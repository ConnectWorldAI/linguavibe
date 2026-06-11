import { z } from "zod";
import { publicProcedure, router } from "./_core/trpc";
import { getSlangKnowledge, getMultipleMeanings } from "./slangKnowledgeLoader";

/**
 * Live Translate Backend
 * 
 * Provides endpoints for real-time speech-to-speech translation using
 * OpenAI's Realtime Translation API (gpt-realtime-translate).
 * 
 * Architecture:
 * - Client captures mic audio
 * - Creates a WebRTC or WebSocket session with OpenAI directly (via client secret)
 * - Server provides session creation endpoint (generates short-lived client secrets)
 * - Translated audio streams back to client in real-time (<1s latency)
 * 
 * This is FASTER than Apple's text-only approach because:
 * 1. Streaming — translation starts while speaker is still talking
 * 2. Speech-to-speech — no intermediate text display required
 * 3. Dedicated translation model — optimized for interpretation, not chat
 */

const SUPPORTED_LANGUAGES = [
  "en", "es", "fr", "de", "it", "pt", "ja", "ko", "zh", "ar",
  "hi", "ru", "nl", "pl", "sv", "da", "no", "fi", "tr", "th",
  "vi", "id", "ms", "tl", "sw", "he", "uk", "cs", "ro", "hu",
  "el", "bg", "hr", "sk", "sl", "lt", "lv", "et", "ca", "gl",
] as const;

export const liveTranslateRouter = router({
  /**
   * Create a translation session — returns a short-lived client secret
   * that the mobile app uses to connect directly to OpenAI's Realtime API.
   * 
   * The client secret is valid for ~60 seconds and scoped to translation only.
   * This keeps the full API key server-side while letting the client stream audio directly.
   * 
   * Voice selection: "natural" uses OpenAI's default voice, "clone" uses the user's
   * trained voice model ID (stored in voiceModelId) for personalized output.
   */
  createSession: publicProcedure
    .input(z.object({
      targetLanguage: z.string().default("es"),
      sourceLanguage: z.string().optional(), // auto-detect if not specified
      mode: z.enum(["fast", "study"]).default("fast"),
      voicePreference: z.enum(["natural", "clone"]).default("natural"),
      voiceModelId: z.string().optional(), // user's cloned voice model ID
      conversationMode: z.boolean().default(false), // two-way translation
      secondLanguage: z.string().optional(), // for conversation mode: the other speaker's language
      dialect: z.string().optional(), // e.g. "dominican", "venezuelan", "puerto-rican"
    }))
    .mutation(async ({ input }) => {
      const apiKey = process.env.OPENAI_API_KEY;
      if (!apiKey) {
        throw new Error("OpenAI API key not configured. Add OPENAI_API_KEY to enable live translation.");
      }

      try {
        // ─── Slang-Aware Context Injection ───
        // Fetch dialect-specific slang from Airtable/cache to inject as translation instructions
        let slangInstructions = "";
        if (input.dialect) {
          try {
            const targetLangName = getLanguageName(input.targetLanguage);
            const slangData = await getSlangKnowledge(targetLangName, input.dialect);
            if (slangData.slangContext) {
              slangInstructions = `\n\nIMPORTANT DIALECT INSTRUCTIONS:\nYou are translating into ${input.dialect} ${targetLangName}. Use authentic regional expressions.\n${slangData.slangContext}\n\nPrefer verified slang over generic textbook translations. Sound like a real person from this region.`;
            }
          } catch (e) {
            // Slang lookup failed — proceed without it (speed > accuracy for live)
            console.warn("[LiveTranslate] Slang lookup failed:", (e as Error).message);
          }
        }

        // Build session configuration based on voice preference
        const sessionConfig: any = {
          model: "gpt-realtime-translate",
          audio: {
            output: {
              language: input.targetLanguage,
            },
          },
          ...(slangInstructions ? { instructions: slangInstructions } : {}),
        };

        // Thread voice selection into session
        if (input.voicePreference === "clone" && input.voiceModelId) {
          sessionConfig.audio.output.voice = input.voiceModelId;
        }

        // For conversation mode, set up bidirectional translation
        if (input.conversationMode && input.secondLanguage) {
          sessionConfig.conversation = {
            enabled: true,
            languages: [input.targetLanguage, input.secondLanguage],
            bidirectional: true,
          };
        }

        // Create a client secret for the Realtime Translation API
        const response = await fetch(
          "https://api.openai.com/v1/realtime/translations/client_secrets",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${apiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ session: sessionConfig }),
          }
        );

        if (!response.ok) {
          const errorText = await response.text();
          console.error("[LiveTranslate] Session creation failed:", errorText);
          throw new Error(`Failed to create translation session: ${response.status}`);
        }

        const data = await response.json();

        return {
          success: true as const,
          clientSecret: data.value || data.client_secret,
          expiresAt: data.expires_at || Date.now() + 60000,
          targetLanguage: input.targetLanguage,
          mode: input.mode,
          conversationMode: input.conversationMode,
          voicePreference: input.voicePreference,
          // Connection info for the client
          endpoints: {
            webrtc: "https://api.openai.com/v1/realtime/translations/calls",
            websocket: `wss://api.openai.com/v1/realtime/translations?model=gpt-realtime-translate`,
          },
        };
      } catch (error: any) {
        console.error("[LiveTranslate] Error:", error.message);
        return {
          success: false as const,
          error: error.message || "Failed to create translation session",
          clientSecret: null,
          expiresAt: null,
          targetLanguage: input.targetLanguage,
          mode: input.mode,
          conversationMode: input.conversationMode,
          voicePreference: input.voicePreference,
          endpoints: null,
        };
      }
    }),

  /**
   * Create a conversation mode session — two-way live translation
   * Both speakers hold the phone and it translates back and forth.
   * Creates TWO sessions (one per direction) for simultaneous translation.
   */
  createConversationSession: publicProcedure
    .input(z.object({
      language1: z.string(), // Speaker 1's language
      language2: z.string(), // Speaker 2's language
      voicePreference: z.enum(["natural", "clone"]).default("natural"),
      voiceModelId: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const apiKey = process.env.OPENAI_API_KEY;
      if (!apiKey) {
        throw new Error("OpenAI API key not configured.");
      }

      try {
        // Create two sessions — one for each direction
        const [session1, session2] = await Promise.all([
          // Session 1: language1 → language2
          fetch("https://api.openai.com/v1/realtime/translations/client_secrets", {
            method: "POST",
            headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
            body: JSON.stringify({
              session: {
                model: "gpt-realtime-translate",
                audio: { output: { language: input.language2 } },
              },
            }),
          }),
          // Session 2: language2 → language1
          fetch("https://api.openai.com/v1/realtime/translations/client_secrets", {
            method: "POST",
            headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
            body: JSON.stringify({
              session: {
                model: "gpt-realtime-translate",
                audio: { output: { language: input.language1 } },
              },
            }),
          }),
        ]);

        if (!session1.ok || !session2.ok) {
          throw new Error("Failed to create conversation sessions");
        }

        const [data1, data2] = await Promise.all([session1.json(), session2.json()]);

        return {
          success: true as const,
          sessions: {
            forward: {
              clientSecret: data1.value || data1.client_secret,
              expiresAt: data1.expires_at || Date.now() + 60000,
              direction: `${input.language1} → ${input.language2}`,
            },
            reverse: {
              clientSecret: data2.value || data2.client_secret,
              expiresAt: data2.expires_at || Date.now() + 60000,
              direction: `${input.language2} → ${input.language1}`,
            },
          },
          endpoints: {
            webrtc: "https://api.openai.com/v1/realtime/translations/calls",
            websocket: `wss://api.openai.com/v1/realtime/translations?model=gpt-realtime-translate`,
          },
        };
      } catch (error: any) {
        return {
          success: false as const,
          error: error.message,
          sessions: null,
          endpoints: null,
        };
      }
    }),

  /**
   * Report usage — tracks minutes used for tier-based billing
   * Called by the client when a session ends with the duration.
   */
  reportUsage: publicProcedure
    .input(z.object({
      durationSeconds: z.number().min(0),
      targetLanguage: z.string(),
      voicePreference: z.enum(["natural", "clone"]),
      conversationMode: z.boolean().default(false),
      quality: z.number().min(1).max(5).optional(),
    }))
    .mutation(async ({ input }) => {
      const minutes = Math.ceil(input.durationSeconds / 60);
      // Log usage for analytics and billing
      console.log(`[LiveTranslate] Usage: ${minutes}min, lang=${input.targetLanguage}, voice=${input.voicePreference}, convo=${input.conversationMode}`);
      return {
        success: true,
        minutesCharged: minutes,
        // Conversation mode counts as 2x minutes (two simultaneous sessions)
        effectiveMinutes: input.conversationMode ? minutes * 2 : minutes,
      };
    }),

  /**
   * Get supported languages for live translation
   */
  getSupportedLanguages: publicProcedure.query(() => {
    return {
      languages: SUPPORTED_LANGUAGES.map((code) => ({
        code,
        name: getLanguageName(code),
        flag: getLanguageFlag(code),
      })),
    };
  }),

  /**
   * Report translation quality (for improving the system)
   */
  reportQuality: publicProcedure
    .input(z.object({
      sessionId: z.string().optional(),
      targetLanguage: z.string(),
      rating: z.number().min(1).max(5),
      issue: z.enum(["accuracy", "latency", "voice_quality", "missing_words", "other"]).optional(),
      feedback: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      // Log quality report for analytics
      console.log("[LiveTranslate] Quality report:", JSON.stringify(input));
      return { success: true };
    }),

  /**
   * Get usage summary for the current billing period
   * Returns minutes used, limits, and tier info for the Live Translate feature
   */
  getUsageSummary: publicProcedure.query(() => {
    // In production, this would query the database for the authenticated user
    // For now, return the tier structure so the client can enforce locally
    return {
      tiers: {
        free: { dailyMinutes: 5, monthlyMinutes: 15, conversationMode: false, voiceClone: false },
        plus: { dailyMinutes: 60, monthlyMinutes: 120, conversationMode: true, voiceClone: false },
        pro: { dailyMinutes: -1, monthlyMinutes: -1, conversationMode: true, voiceClone: true },
      },
      features: {
        free: ["Basic one-way translation", "20+ languages", "5 min/day"],
        plus: ["Two-way conversation mode", "All 40 languages", "60 min/day", "Priority latency"],
        pro: ["Unlimited minutes", "Voice clone output", "Conversation mode", "All languages", "Lowest latency"],
      },
    };
  }),
});

// Helper functions
function getLanguageName(code: string): string {
  const names: Record<string, string> = {
    en: "English", es: "Spanish", fr: "French", de: "German",
    it: "Italian", pt: "Portuguese", ja: "Japanese", ko: "Korean",
    zh: "Mandarin", ar: "Arabic", hi: "Hindi", ru: "Russian",
    nl: "Dutch", pl: "Polish", sv: "Swedish", da: "Danish",
    no: "Norwegian", fi: "Finnish", tr: "Turkish", th: "Thai",
    vi: "Vietnamese", id: "Indonesian", ms: "Malay", tl: "Tagalog",
    sw: "Swahili", he: "Hebrew", uk: "Ukrainian", cs: "Czech",
    ro: "Romanian", hu: "Hungarian", el: "Greek", bg: "Bulgarian",
    hr: "Croatian", sk: "Slovak", sl: "Slovenian", lt: "Lithuanian",
    lv: "Latvian", et: "Estonian", ca: "Catalan", gl: "Galician",
  };
  return names[code] || code;
}

function getLanguageFlag(code: string): string {
  const flags: Record<string, string> = {
    en: "🇺🇸", es: "🇪🇸", fr: "🇫🇷", de: "🇩🇪",
    it: "🇮🇹", pt: "🇧🇷", ja: "🇯🇵", ko: "🇰🇷",
    zh: "🇨🇳", ar: "🇸🇦", hi: "🇮🇳", ru: "🇷🇺",
    nl: "🇳🇱", pl: "🇵🇱", sv: "🇸🇪", da: "🇩🇰",
    no: "🇳🇴", fi: "🇫🇮", tr: "🇹🇷", th: "🇹🇭",
    vi: "🇻🇳", id: "🇮🇩", ms: "🇲🇾", tl: "🇵🇭",
    sw: "🇰🇪", he: "🇮🇱", uk: "🇺🇦", cs: "🇨🇿",
    ro: "🇷🇴", hu: "🇭🇺", el: "🇬🇷", bg: "🇧🇬",
    hr: "🇭🇷", sk: "🇸🇰", sl: "🇸🇮", lt: "🇱🇹",
    lv: "🇱🇻", et: "🇪🇪", ca: "🇪🇸", gl: "🇪🇸",
  };
  return flags[code] || "🌐";
}
