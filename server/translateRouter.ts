import { z } from "zod";
import { publicProcedure, router } from "./_core/trpc";
import { invokeLLM } from "./_core/llm";
import { getKnowledgeWithFallback } from "./teacherKnowledgeStore";
import { getSlangKnowledge, getMultipleMeanings, getOfflinePack, getSlangCacheStats, isSlangCacheReady } from "./slangKnowledgeLoader";
import { storagePut, storageGetSignedUrl } from "./storage";
import { vault } from "./knowledgeVault";
import {
  guardrails,
  enforceGuardrails,
  buildLLMGuardrailPrompt,
  validateLLMOutput,
  normalizeLanguage,
  normalizeDialect,
} from "./languageGuardrails";

/**
 * Translate Router
 * 
 * Provides real AI-powered text translation using OpenAI.
 * Supports dialect/slang variants, contextual translations,
 * and pulls from the curated knowledge base for accurate
 * slang/dialect translations with full breakdowns.
 */
export const translateRouter = router({
  /**
   * Translate text between languages with optional dialect/slang style.
   * Uses OpenAI GPT + curated knowledge base for high-quality, dialect-aware translation.
   * Returns translation + slang breakdown when applicable.
   */
  text: publicProcedure
    .input(z.object({
      text: z.string().min(1).max(5000),
      fromLanguage: z.string().default("English"),
      toLanguage: z.string().default("Spanish"),
      dialect: z.string().optional(), // e.g., "Dominican", "Venezuelan", "Mexican"
      style: z.enum(["formal", "casual", "slang", "standard"]).default("standard"),
      context: z.string().optional(), // additional context for better translation
      includeBreakdown: z.boolean().default(true), // return slang/dialect breakdown
    }))
    .mutation(async ({ input }) => {
      // Pull relevant knowledge from the curated knowledge base
      const knowledgeEntries = getKnowledgeWithFallback(input.toLanguage, input.dialect);
      
      // Pull verified slang knowledge from Airtable/fallback
      const slangData = await getSlangKnowledge(input.toLanguage, input.dialect || undefined);
      
      // Check for words with multiple meanings in the input text
      const inputWords = input.text.toLowerCase().split(/\s+/);
      const multipleMeaningsFound: Array<{ word: string; meanings: Array<{ meaning: string; context: string; region: string }> }> = [];
      for (const word of inputWords) {
        const meanings = getMultipleMeanings(word, input.fromLanguage);
        if (meanings.length > 0) {
          multipleMeaningsFound.push({ word, meanings });
        }
      }
      // Also check target language for multiple meanings
      for (const word of inputWords) {
        const meanings = getMultipleMeanings(word, input.toLanguage);
        if (meanings.length > 0 && !multipleMeaningsFound.find(m => m.word === word)) {
          multipleMeaningsFound.push({ word, meanings });
        }
      }
      
      // Build knowledge context from curated content
      let knowledgeContext = "";
      if (knowledgeEntries.length > 0) {
        const relevantSnippets = knowledgeEntries
          .slice(0, 5) // Use up to 5 most recent entries
          .map(e => `[Source: ${e.title}] ${e.transcript.slice(0, 500)}`)
          .join("\n\n");
        knowledgeContext = `\n\nCURATED KNOWLEDGE BASE (verified authentic content from native speakers/teachers):\n${relevantSnippets}\n\nUse this knowledge to ensure your translation uses authentic, verified slang and expressions. Cross-reference any slang you use with this knowledge base when possible.`;
      }
      
      // Add verified slang context
      if (slangData.slangContext) {
        knowledgeContext += slangData.slangContext;
      }
      
      // Add multiple meanings warning
      if (multipleMeaningsFound.length > 0) {
        const meaningsWarning = multipleMeaningsFound.map(m => {
          const meaningsList = m.meanings.map(mm => `  - ${mm.region}: "${mm.meaning}" (${mm.context})`).join("\n");
          return `⚠️ "${m.word}" has MULTIPLE MEANINGS:\n${meaningsList}`;
        }).join("\n\n");
        knowledgeContext += `\n\nMULTIPLE MEANINGS DETECTED — INCLUDE ALL IN BREAKDOWN:\n${meaningsWarning}\n\nIMPORTANT: When a word has multiple meanings across regions, you MUST include ALL meanings in the breakdown with a warning about which regions use which meaning. This prevents embarrassing mistakes.`;
      }

      const dialectInstruction = input.dialect
        ? `Use the ${input.dialect} dialect/regional variant specifically. Include local slang, expressions, and speech patterns authentic to ${input.dialect} speakers.`
        : "";

      const styleInstruction = {
        formal: "Use formal, professional language suitable for business or academic contexts.",
        casual: "Use casual, everyday conversational language.",
        slang: "Use heavy slang, street language, and colloquial expressions that native speakers actually use in informal settings.",
        standard: "Use standard, neutral language that is widely understood.",
      }[input.style];

      const breakdownInstruction = input.includeBreakdown
        ? `\n\nAFTER the translation, provide a JSON breakdown on a new line starting with "---BREAKDOWN---" followed by a JSON object with:
{
  "slangType": "type of slang/register used (e.g., 'Dominican street slang', 'Formal Castilian', 'Mexican colloquial', 'Standard')",
  "region": "specific region/city where this is commonly used (e.g., 'Santo Domingo, DR', 'Mexico City', 'Buenos Aires')",
  "breakdown": [
    {"original": "word or phrase", "meaning": "what it means", "note": "context/origin/when to use"}
  ],
  "perspectives": [
    {"person": "I", "target": "Yo soy", "pronunciation": "yo soy"},
    {"person": "You (informal)", "target": "Tú eres", "pronunciation": "too eh-res"},
    {"person": "You (formal)", "target": "Usted es", "pronunciation": "oo-sted es"},
    {"person": "He/She", "target": "Él/Ella es", "pronunciation": "el/eya es"},
    {"person": "We", "target": "Nosotros somos", "pronunciation": "no-so-tros so-mos"},
    {"person": "You all", "target": "Ustedes son", "pronunciation": "oo-ste-des son"},
    {"person": "They", "target": "Ellos son", "pronunciation": "ey-yos son"}
  ],
  "perspectiveNote": "which form was used in the translation and why",
  "hasPerspectives": true,
  "culturalNote": "any relevant cultural context about the translation",
  "formality": "formal|casual|slang|vulgar",
  "confidence": "how confident you are this is accurate (high/medium/low)",
  "multipleMeanings": [
    {"word": "word with multiple meanings", "meanings": [{"meaning": "meaning 1", "region": "where this meaning is used", "warning": "any caution about usage"}, {"meaning": "meaning 2", "region": "where this meaning is used", "warning": "any caution"}]}
  ],
  "sourceCitations": ["@creator_handle who verified this expression"]
}

IMPORTANT for "perspectives":
- ONLY include the "perspectives" array if the translation contains a VERB or pronoun-based phrase
- Show ALL person forms (I, You informal, You formal, He/She, We, You all, They) with the correct conjugation in the target language
- Include pronunciation guide for each form
- Set "hasPerspectives" to true if perspectives are included, false otherwise
- Highlight which person form was used in the actual translation via "perspectiveNote"
- For non-verb translations (nouns, adjectives, phrases without verbs), set "hasPerspectives": false and omit "perspectives"`
        : "\nReturn ONLY the translated text with no explanations.";

      // ═══ GUARDRAIL: Inject language guardrail into LLM prompt ═══
      const guardrailPrompt = buildLLMGuardrailPrompt(input.toLanguage, input.dialect);

      const systemPrompt = `You are an expert translator and linguist with deep knowledge of regional dialects, slang, and cultural expressions across all languages worldwide. You don't just translate words — you translate CULTURE.

${guardrailPrompt}

${styleInstruction}
${dialectInstruction}
${knowledgeContext}

IMPORTANT RULES:
- Preserve the original meaning and intent
- If slang or idioms don't have direct equivalents, use the closest cultural equivalent in the target language
- When translating TO a dialect/slang variant, use AUTHENTIC expressions that native speakers actually use
- When translating FROM a dialect/slang variant, explain what it really means (not literal translation)
- Your knowledge of slang should be current and verified${breakdownInstruction}`;

      const userMessage = input.context
        ? `Context: ${input.context}\n\nTranslate from ${input.fromLanguage} to ${input.toLanguage}:\n\n${input.text}`
        : `Translate from ${input.fromLanguage} to ${input.toLanguage}:\n\n${input.text}`;

      try {
        const response = await invokeLLM({
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userMessage },
          ],
        });

        const rawContent = response.choices?.[0]?.message?.content;
        if (!rawContent) {
          return { success: false as const, error: "No response from AI", translation: "", detectedLanguage: null, breakdown: null };
        }

        const fullText = typeof rawContent === "string"
          ? rawContent.trim()
          : (rawContent.find((p: any) => p.type === "text") as any)?.text?.trim() ?? "";

        // ═══ GUARDRAIL: Validate LLM output for cross-language contamination ═══
        const outputValidation = validateLLMOutput(fullText, input.toLanguage, {
          targetLanguage: input.toLanguage,
          targetDialect: input.dialect,
          sourceSystem: "translator",
        });
        if (outputValidation.violations.length > 0) {
          console.warn(`[Translator] Guardrail violations in output:`, outputValidation.violations.map(v => v.message));
        }

        // Parse translation and breakdown
        let translation = fullText;
        let breakdown = null;

        if (input.includeBreakdown && fullText.includes("---BREAKDOWN---")) {
          const parts = fullText.split("---BREAKDOWN---");
          translation = parts[0].trim();
          try {
            const jsonStr = parts[1].trim();
            breakdown = JSON.parse(jsonStr);
          } catch {
            // If JSON parsing fails, still return the translation
            breakdown = null;
          }
        }

        // ═══ KNOWLEDGE VAULT: Store translation + slang discoveries ═══
        // Every translation we do gets archived — builds our own translation memory
        try {
          const slangFromBreakdown = breakdown?.breakdown?.filter((b: any) => b.note?.toLowerCase().includes("slang") || b.note?.toLowerCase().includes("colloquial")) || [];
          await vault.storeTranslation({
            sourceText: input.text,
            translatedText: translation,
            sourceLanguage: input.fromLanguage,
            targetLanguage: input.toLanguage,
            targetDialect: input.dialect,
            translationType: "text",
            slangUsed: slangFromBreakdown.map((s: any) => ({
              word: s.original,
              meaning: s.meaning,
              region: breakdown?.region || input.dialect,
            })),
            culturalNotes: breakdown?.culturalNote || undefined,
            dialectVariants: breakdown?.multipleMeanings?.flatMap((m: any) =>
              m.meanings?.map((mm: any) => ({ dialect: mm.region, translation: mm.meaning })) || []
            ) || undefined,
            qualityScore: breakdown?.confidence === "high" ? 90 : breakdown?.confidence === "medium" ? 70 : 50,
          });

          // Store any vocab discovered in the breakdown
          if (breakdown?.breakdown) {
            for (const item of breakdown.breakdown) {
              await vault.storeVocab({
                word: item.original,
                meaning: item.meaning,
                language: input.toLanguage,
                dialect: input.dialect,
                region: breakdown.region,
                category: "translation_discovery",
                culturalNote: item.note,
                isSlang: item.note?.toLowerCase().includes("slang") || false,
              });
            }
          }
        } catch (vaultErr) {
          // Don't fail the translation if vault storage fails
          console.error("[TranslateRouter] Vault storage error (non-fatal):", vaultErr);
        }
        // ═══ END KNOWLEDGE VAULT ═══

        return {
          success: true as const,
          error: null,
          translation,
          fromLanguage: input.fromLanguage,
          toLanguage: input.toLanguage,
          dialect: input.dialect || null,
          style: input.style,
          detectedLanguage: null,
          breakdown,
          knowledgeSourcesUsed: knowledgeEntries.length,
          slangSourcesUsed: slangData.sources,
          multipleMeanings: multipleMeaningsFound.length > 0 ? multipleMeaningsFound : null,
        };
      } catch (err: any) {
        return {
          success: false as const,
          error: err.message || "Translation failed",
          translation: "",
          detectedLanguage: null,
          breakdown: null,
        };
      }
    }),

  /**
   * Detect the language of input text, including dialect/slang identification
   */
  detectLanguage: publicProcedure
    .input(z.object({
      text: z.string().min(1).max(1000),
    }))
    .mutation(async ({ input }) => {
      try {
        const response = await invokeLLM({
          messages: [
            {
              role: "system",
              content: `You are a language and dialect detection expert. Identify the language AND specific dialect/regional variant of the given text. Return ONLY a JSON object with:
{
  "language": "Spanish",
  "code": "es",
  "confidence": 95,
  "dialect": "Dominican",
  "region": "Santo Domingo area",
  "isSlang": true,
  "slangType": "Dominican street slang",
  "note": "Contains typical Dominican contractions like 'toy' (estoy) and expressions like 'qué lo que'"
}
Do not include any other text.`,
            },
            { role: "user", content: input.text },
          ],
          response_format: { type: "json_object" },
        });

        const rawContent = response.choices?.[0]?.message?.content;
        const content = typeof rawContent === "string"
          ? rawContent
          : (rawContent?.find((p: any) => p.type === "text") as any)?.text ?? "";

        const parsed = JSON.parse(content);
        return { success: true as const, ...parsed };
      } catch (err: any) {
        return { success: false as const, error: err.message, language: "Unknown", code: "und", confidence: 0, dialect: null, isSlang: false };
      }
    }),

  /**
   * Get a detailed slang/expression breakdown without full translation.
   * For when users want to understand a specific phrase or expression.
   */
  explainExpression: publicProcedure
    .input(z.object({
      text: z.string().min(1).max(500),
      language: z.string().optional(), // If known, otherwise auto-detect
    }))
    .mutation(async ({ input }) => {
      // Check knowledge base for this language
      const knowledgeEntries = input.language
        ? getKnowledgeWithFallback(input.language)
        : [];

      let knowledgeContext = "";
      if (knowledgeEntries.length > 0) {
        const snippets = knowledgeEntries
          .slice(0, 3)
          .map(e => `[${e.title}] ${e.transcript.slice(0, 300)}`)
          .join("\n");
        knowledgeContext = `\nReference knowledge: ${snippets}`;
      }

      try {
        const response = await invokeLLM({
          messages: [
            {
              role: "system",
              content: `You are a linguistics expert specializing in slang, idioms, and regional expressions across all world languages. Explain the given expression in detail.${knowledgeContext}

Return a JSON object:
{
  "expression": "the original expression",
  "language": "detected language",
  "dialect": "specific dialect/region",
  "literalMeaning": "word-for-word literal translation to English",
  "actualMeaning": "what it actually means in context",
  "usage": "when and how native speakers use this",
  "formality": "formal|casual|slang|vulgar",
  "region": "where this is commonly used",
  "origin": "etymology or cultural origin if known",
  "examples": ["example sentence 1", "example sentence 2"],
  "similar": ["similar expressions in same language"],
  "englishEquivalent": "closest English slang/idiom equivalent"
}`,
            },
            { role: "user", content: input.text },
          ],
          response_format: { type: "json_object" },
        });

        const rawContent = response.choices?.[0]?.message?.content;
        const content = typeof rawContent === "string"
          ? rawContent
          : (rawContent?.find((p: any) => p.type === "text") as any)?.text ?? "";

        const parsed = JSON.parse(content);
        return { success: true as const, ...parsed };
      } catch (err: any) {
        return { success: false as const, error: err.message };
      }
    }),

  /**
   * Variety mode: show how different regions/dialects say the same word or sentence.
   * Returns a comparison chart of regional variants for any expression.
   */
  variety: publicProcedure
    .input(z.object({
      text: z.string().min(1).max(500),
      fromLanguage: z.string().default("English"),
      toLanguage: z.string().default("Spanish"),
    }))
    .mutation(async ({ input }) => {
      // Pull knowledge for the target language to enrich responses
      const knowledgeEntries = getKnowledgeWithFallback(input.toLanguage);
      let knowledgeContext = "";
      if (knowledgeEntries.length > 0) {
        const snippets = knowledgeEntries
          .slice(0, 5)
          .map(e => `[${e.title} - ${e.dialect}] ${e.transcript.slice(0, 300)}`)
          .join("\n");
        knowledgeContext = `\n\nCURATED KNOWLEDGE (verified from native speakers):\n${snippets}\n\nUse this to ensure regional expressions are authentic.`;
      }

      try {
        const response = await invokeLLM({
          messages: [
            {
              role: "system",
              content: `You are a world-class linguist specializing in regional dialects and variations. Given a word or sentence, show how DIFFERENT regions/countries express the same meaning in their local way.
${knowledgeContext}

Return a JSON object:
{
  "originalText": "the input text",
  "fromLanguage": "source language",
  "toLanguage": "target language",
  "meaning": "what the text means",
  "varieties": [
    {
      "region": "Dominican Republic",
      "expression": "¿Qué lo que?",
      "pronunciation": "keh loh keh",
      "formality": "casual/slang",
      "notes": "Super casual, used between friends. Most common greeting in DR.",
      "commonIn": "Santo Domingo, Santiago"
    }
  ],
  "standardForm": "the textbook/standard way to say it",
  "tip": "a helpful tip about when to use which variant"
}

IMPORTANT:
- Include at LEAST 6-8 regional varieties when the target language has many dialects (Spanish, Arabic, Chinese, French, Portuguese, etc.)
- Include the MOST COMMON street/slang version for each region, not the textbook version
- For Spanish: always include Dominican, Mexican, Puerto Rican, Colombian, Argentine, Venezuelan, Panamanian, and Spain
- For other languages with fewer regional variants, include what's available
- Each variety should be what a REAL person on the street would actually say, not what a textbook teaches
- Include pronunciation guide for slang terms`,
            },
            { role: "user", content: `Show me how different ${input.toLanguage}-speaking regions say: "${input.text}"${input.fromLanguage !== input.toLanguage ? ` (translating from ${input.fromLanguage})` : ""}` },
          ],
          response_format: { type: "json_object" },
        });

        const rawContent = response.choices?.[0]?.message?.content;
        const content = typeof rawContent === "string"
          ? rawContent
          : (rawContent?.find((p: any) => p.type === "text") as any)?.text ?? "";

        const parsed = JSON.parse(content);
        return { success: true as const, ...parsed };
      } catch (err: any) {
        return { success: false as const, error: err.message, varieties: [] };
      }
    }),

  /**
   * AI Smart Reply — suggests 2-3 contextual replies based on the translated message.
   * Matches the dialect/slang style of the incoming message.
   * Privacy-safe: only processes the single message the user chose to translate.
   */
  smartReply: publicProcedure
    .input(z.object({
      originalText: z.string().min(1).max(2000),
      translatedText: z.string().min(1).max(2000),
      fromLanguage: z.string(),
      toLanguage: z.string(),
      dialect: z.string().optional(),
      tone: z.enum(["casual", "formal", "flirty", "business", "auto"]).default("auto"),
    }))
    .mutation(async ({ input }) => {
      // Pull knowledge for authentic dialect replies
      const knowledgeEntries = getKnowledgeWithFallback(input.fromLanguage, input.dialect);
      let knowledgeContext = "";
      if (knowledgeEntries.length > 0) {
        const snippets = knowledgeEntries
          .slice(0, 3)
          .map(e => `[${e.title}] ${e.transcript.slice(0, 200)}`)
          .join("\n");
        knowledgeContext = `\n\nAuthentic dialect reference:\n${snippets}`;
      }

      try {
        const response = await invokeLLM({
          messages: [
            {
              role: "system",
              content: `You are an AI reply assistant for a multilingual messaging translator. The user received a message in ${input.fromLanguage}${input.dialect ? ` (${input.dialect} dialect)` : ""} and wants to reply.

Generate exactly 3 smart reply suggestions that:
1. Are contextually appropriate responses to the message
2. Are written in ${input.fromLanguage}${input.dialect ? ` using authentic ${input.dialect} dialect/slang` : ""}
3. Match the tone: ${input.tone === "auto" ? "detect from the original message" : input.tone}
4. Range from short (1-5 words) to medium (a sentence) to longer (2 sentences)
5. Feel natural — like what a native speaker would actually text back
${knowledgeContext}

Return a JSON object:
{
  "replies": [
    {
      "text": "the reply in ${input.fromLanguage}",
      "translation": "English translation of the reply",
      "tone": "casual|formal|flirty|business",
      "length": "short|medium|long"
    }
  ],
  "detectedTone": "the tone of the original message",
  "context": "brief note about what kind of conversation this seems to be"
}`,
            },
            {
              role: "user",
              content: `Original message (${input.fromLanguage}): "${input.originalText}"
Translation (${input.toLanguage}): "${input.translatedText}"

Suggest 3 replies I could send back in ${input.fromLanguage}${input.dialect ? ` (${input.dialect} style)` : ""}.`,
            },
          ],
          response_format: { type: "json_object" },
        });

        const rawContent = response.choices?.[0]?.message?.content;
        const content = typeof rawContent === "string"
          ? rawContent
          : (rawContent?.find((p: any) => p.type === "text") as any)?.text ?? "";

        const parsed = JSON.parse(content);
        return { success: true as const, ...parsed };
      } catch (err: any) {
        return { success: false as const, error: err.message, replies: [] };
      }
    }),

  /**
   * OCR: Extract text from an image (camera/photo) using LLM vision.
   * User takes a photo of text (menu, sign, message) and we extract it.
   */
  ocr: publicProcedure
    .input(z.object({
      base64Image: z.string(),
      mimeType: z.string().default("image/jpeg"),
    }))
    .mutation(async ({ input }) => {
      try {
        // Upload image to storage
        const buffer = Buffer.from(input.base64Image, "base64");
        const filename = `ocr/scan-${Date.now()}.${input.mimeType === "image/png" ? "png" : "jpg"}`;
        const result = await storagePut(filename, buffer, input.mimeType);
        const signedUrl = await storageGetSignedUrl(result.key);

        // Use LLM vision to extract text from the image
        const response = await invokeLLM({
          messages: [
            {
              role: "system",
              content: "You are an OCR text extraction tool. Extract ALL visible text from the image exactly as it appears. Return ONLY the extracted text, nothing else. Preserve line breaks and formatting where possible. If no text is visible, return an empty string.",
            },
            {
              role: "user",
              content: [
                { type: "text", text: "Extract all text from this image:" },
                { type: "image_url", image_url: { url: signedUrl } },
              ],
            },
          ],
        });

        const rawContent = response.choices?.[0]?.message?.content;
        const extractedText = typeof rawContent === "string"
          ? rawContent
          : (rawContent?.find((p: any) => p.type === "text") as any)?.text ?? "";

        return { success: true as const, text: extractedText.trim() };
      } catch (err: any) {
        return { success: false as const, error: err.message, text: "" };
      }
    }),


  /**
   * Text-to-Speech using ElevenLabs
   * Generates natural, soothing audio for translated text.
   * Uses multilingual Flash v2.5 model for speed + quality.
   */
  tts: publicProcedure
    .input(z.object({
      text: z.string().min(1).max(2000),
      voiceId: z.string().default("cgSgspJ2msm6clMCkdW9"), // Jessica - default soothing voice
      language: z.string().optional(), // helps model pronounce correctly
    }))
    .mutation(async ({ input }) => {
      const apiKey = process.env.ELEVENLABS_API_KEY;
      if (!apiKey) {
        throw new Error("ElevenLabs API key not configured");
      }

      const modelId = "eleven_flash_v2_5"; // Fastest multilingual model (32 languages)

      const response = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${input.voiceId}`,
        {
          method: "POST",
          headers: {
            "xi-api-key": apiKey,
            "Content-Type": "application/json",
            "Accept": "audio/mpeg",
          },
          body: JSON.stringify({
            text: input.text,
            model_id: modelId,
            voice_settings: {
              stability: 0.6,
              similarity_boost: 0.8,
              style: 0.3,
              use_speaker_boost: true,
            },
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`ElevenLabs TTS failed: ${response.status} - ${errorText}`);
      }

      // Get audio as buffer and upload to storage for client playback
      const audioBuffer = Buffer.from(await response.arrayBuffer());
      const fileName = `tts/${Date.now()}-${Math.random().toString(36).slice(2)}.mp3`;
      
      await storagePut(fileName, audioBuffer, "audio/mpeg");
      const audioUrl = await storageGetSignedUrl(fileName);

      return { audioUrl, duration: null };
    }),

  /**
   * List available TTS voices for the voice picker
   */
  voices: publicProcedure
    .query(async () => {
      // Curated voice list with metadata for the voice picker
      return {
        voices: [
          { id: "cgSgspJ2msm6clMCkdW9", name: "Jessica", description: "Warm & Soothing", gender: "female", accent: "American", style: "conversational" },
          { id: "SAz9YHcvj6GT2YYXdXww", name: "River", description: "Calm & Relaxed", gender: "neutral", accent: "American", style: "conversational" },
          { id: "EXAVITQu4vr4xnSDxMaL", name: "Sarah", description: "Mature & Reassuring", gender: "female", accent: "American", style: "professional" },
          { id: "nPczCjzI2devNBz1zQrb", name: "Brian", description: "Deep & Comforting", gender: "male", accent: "American", style: "conversational" },
          { id: "CwhRBWXzGAHq8TQ4Fs17", name: "Roger", description: "Laid-Back & Casual", gender: "male", accent: "American", style: "conversational" },
          { id: "pFZP5JQG7iQjIQuC4Bku", name: "Lily", description: "Velvety & Elegant", gender: "female", accent: "British", style: "professional" },
          { id: "Xb7hH8MSUJpSbSDYk0k2", name: "Alice", description: "Clear & Engaging", gender: "female", accent: "British", style: "educational" },
          { id: "JBFqnCBsd6RMkjVDRZzb", name: "George", description: "Warm Storyteller", gender: "male", accent: "British", style: "narrative" },
        ],
        defaultVoiceId: "cgSgspJ2msm6clMCkdW9",
      };
    }),

  /**
   * Handwriting Recognition
   * Accepts SVG path data from the drawing canvas, renders a description,
   * and uses LLM vision to interpret what the student wrote.
   * Falls back to path-based heuristic if image upload fails.
   */
  recognizeHandwriting: publicProcedure
    .input(z.object({
      /** SVG path strings from the drawing canvas */
      paths: z.array(z.string()),
      /** Canvas dimensions for proper rendering */
      canvasWidth: z.number(),
      canvasHeight: z.number(),
      /** The expected answer (helps LLM disambiguate similar characters) */
      expectedAnswer: z.string().optional(),
      /** Target language the student is learning */
      targetLanguage: z.string().optional(),
      /** If provided, a base64 PNG snapshot of the canvas */
      base64Image: z.string().optional(),
      mimeType: z.string().default("image/png"),
    }))
    .mutation(async ({ input }) => {
      try {
        // If we have a base64 image snapshot, use LLM vision directly
        if (input.base64Image) {
          const buffer = Buffer.from(input.base64Image, "base64");
          const filename = `handwriting/canvas-${Date.now()}.png`;
          const result = await storagePut(filename, buffer, input.mimeType);
          const signedUrl = await storageGetSignedUrl(result.key);

          const langHint = input.targetLanguage
            ? `The student is learning ${input.targetLanguage}. The handwriting is likely in ${input.targetLanguage} or English.`
            : "";
          const answerHint = input.expectedAnswer
            ? `The expected answer is similar to: "${input.expectedAnswer}". Use this to disambiguate unclear characters.`
            : "";

          const response = await invokeLLM({
            messages: [
              {
                role: "system",
                content: `You are a handwriting recognition system for a language learning app. Your job is to read what the student wrote on a digital whiteboard/canvas and return ONLY the text they wrote. Rules:\n- Return ONLY the recognized text, nothing else\n- If the handwriting is unclear, make your best guess\n- Preserve accents and diacritical marks (é, ñ, ü, etc.)\n- If you cannot read anything, return an empty string\n${langHint}\n${answerHint}`,
              },
              {
                role: "user",
                content: [
                  { type: "text", text: "Read the handwritten text in this image:" },
                  { type: "image_url", image_url: { url: signedUrl, detail: "high" } },
                ],
              },
            ],
          });

          const rawContent = response.choices?.[0]?.message?.content;
          const recognizedText = typeof rawContent === "string"
            ? rawContent
            : (rawContent?.find((p: any) => p.type === "text") as any)?.text ?? "";

          return {
            success: true as const,
            text: recognizedText.trim().replace(/^["']|["']$/g, ""),
            confidence: 0.85,
            method: "vision" as const,
          };
        }

        // Fallback: describe the SVG paths to LLM as text
        if (input.paths.length === 0) {
          return { success: false as const, text: "", confidence: 0, method: "none" as const };
        }

        const pathDescription = input.paths.map((p, i) => {
          const points = p.match(/[ML]([\d.]+),([\d.]+)/g) || [];
          return `Stroke ${i + 1}: ${points.length} points spanning the canvas`;
        }).join("; ");

        const langHint = input.targetLanguage ? ` in ${input.targetLanguage}` : "";
        const response = await invokeLLM({
          messages: [
            {
              role: "system",
              content: `You are a handwriting recognition system. Given SVG path descriptions of handwritten strokes on a ${input.canvasWidth}x${input.canvasHeight} canvas, interpret what text was written${langHint}. Return ONLY the recognized text.`,
            },
            {
              role: "user",
              content: `SVG paths from handwriting canvas:\n${input.paths.join("\n")}\n\nPath summary: ${pathDescription}\n${input.expectedAnswer ? `Hint: the expected answer is similar to "${input.expectedAnswer}"` : ""}\n\nWhat text was written?`,
            },
          ],
        });

        const rawContent = response.choices?.[0]?.message?.content;
        const recognizedText = typeof rawContent === "string"
          ? rawContent
          : (rawContent?.find((p: any) => p.type === "text") as any)?.text ?? "";

        return {
          success: true as const,
          text: recognizedText.trim().replace(/^["']|["']$/g, ""),
          confidence: 0.6,
          method: "path_analysis" as const,
        };
      } catch (err: any) {
        return { success: false as const, text: "", confidence: 0, method: "error" as const, error: err.message };
      }
    }),

  /**
   * Get offline translation pack for a language.
   * Returns all dialect slang entries for client-side caching.
   */
  offlinePack: publicProcedure
    .input(z.object({
      language: z.string(),
    }))
    .query(({ input }) => {
      const pack = getOfflinePack(input.language);
      return {
        success: true as const,
        ...pack,
      };
    }),

  /**
   * Get available offline packs (list all languages with entry counts).
   */
  availablePacks: publicProcedure
    .query(() => {
      const stats = getSlangCacheStats();
      const languages = [
        "Spanish", "French", "Portuguese", "Italian", "German",
        "Japanese", "Korean", "Mandarin", "Arabic", "Hindi",
        "Russian", "Swahili", "Turkish", "English", "Haitian Creole",
        "Tagalog", "Vietnamese", "Thai", "Dutch", "Polish",
      ];
      const packs = languages.map(lang => {
        const pack = getOfflinePack(lang);
        return {
          language: lang,
          dialectCount: pack.dialects.length,
          totalEntries: pack.totalEntries,
          lastUpdated: pack.lastUpdated,
        };
      }).filter(p => p.totalEntries > 0);

      return {
        success: true as const,
        isReady: isSlangCacheReady(),
        totalDialects: stats.totalDialects,
        totalEntries: stats.totalEntries,
        lastRefresh: stats.lastRefresh,
        packs,
      };
    }),
});
