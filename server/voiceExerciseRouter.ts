import { z } from "zod";
import { publicProcedure, router } from "./_core/trpc";

/**
 * Voice Exercise Router
 * Integrates Hume AI for emotional voice interactions and
 * ElevenLabs for native-quality pronunciation audio.
 */

export const voiceExerciseRouter = router({
  generatePronunciation: publicProcedure
    .input(z.object({
      text: z.string(),
      language: z.string(),
      voiceStyle: z.enum(["teacher", "friend", "elder", "child"]).default("teacher"),
      speed: z.enum(["slow", "normal", "fast"]).default("normal"),
    }))
    .mutation(async ({ input }) => {
      const { text, language, voiceStyle, speed } = input;
      const apiKey = process.env.ELEVENLABS_API_KEY;
      if (!apiKey) {
        return { success: false, audioUrl: null, error: "ElevenLabs API key not configured" };
      }
      const voiceId = "EXAVITQu4vr4xnSDxMaL";
      const speedSettings = { slow: 0.7, normal: 1.0, fast: 1.3 };
      try {
        const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
          method: "POST",
          headers: { "xi-api-key": apiKey, "Content-Type": "application/json" },
          body: JSON.stringify({
            text,
            model_id: "eleven_multilingual_v2",
            voice_settings: { stability: 0.5, similarity_boost: 0.8, speed: speedSettings[speed] },
          }),
        });
        if (!response.ok) throw new Error(`ElevenLabs error: ${response.status}`);
        const audioBuffer = await response.arrayBuffer();
        const base64Audio = Buffer.from(audioBuffer).toString("base64");
        return { success: true, audioUrl: `data:audio/mpeg;base64,${base64Audio}`, voiceId, language };
      } catch (error: any) {
        return { success: false, audioUrl: null, error: error.message };
      }
    }),

  startVoiceScenario: publicProcedure
    .input(z.object({
      language: z.string(),
      dialect: z.string().optional(),
      level: z.enum(["A1", "A2", "B1", "B2", "C1", "C2"]),
      scenario: z.string(),
      characterName: z.string(),
      characterRole: z.string(),
    }))
    .mutation(async ({ input }) => {
      const { language, dialect, level, scenario, characterName, characterRole } = input;
      const humeApiKey = process.env.HUME_API_KEY;
      if (!humeApiKey) {
        return { success: false, sessionId: null, error: "Hume API key not configured" };
      }
      try {
        const systemPrompt = `You are ${characterName}, a ${characterRole} who speaks ${language}${dialect ? ` (${dialect})` : ""}. Scenario: ${scenario}. Student level: ${level}. Stay in character, speak primarily in ${language}, correct mistakes gently.`;
        const response = await fetch("https://api.hume.ai/v0/evi/chat", {
          method: "POST",
          headers: { "X-Hume-Api-Key": humeApiKey, "Content-Type": "application/json" },
          body: JSON.stringify({ system_prompt: systemPrompt }),
        });
        if (!response.ok) throw new Error(`Hume error: ${response.status}`);
        const session = await response.json();
        return { success: true, sessionId: session.chat_id || session.id, websocketUrl: session.websocket_url };
      } catch (error: any) {
        return { success: false, sessionId: null, error: error.message };
      }
    }),

  getCharacters: publicProcedure
    .input(z.object({ language: z.string() }))
    .query(({ input }) => {
      const characters: Record<string, Array<{ id: string; name: string; role: string; emoji: string; description: string }>> = {
        Spanish: [
          { id: "abuela_rosa", name: "Abuela Rosa", role: "grandmother", emoji: "👵🏽", description: "Warm Dominican grandmother who teaches through cooking" },
          { id: "chef_miguel", name: "Chef Miguel", role: "restaurant owner", emoji: "👨‍🍳", description: "Friendly colmado owner" },
          { id: "amiga_lucia", name: "Lucía", role: "friend", emoji: "👩🏽", description: "Dominican friend who takes you to parties" },
        ],
        French: [
          { id: "grandmere_marie", name: "Grand-mère Marie", role: "grandmother", emoji: "👵🏻", description: "Elegant Parisian grandmother" },
          { id: "boulanger_pierre", name: "Pierre", role: "baker", emoji: "👨‍🍳", description: "Friendly neighborhood baker" },
        ],
        Japanese: [
          { id: "obaachan_yuki", name: "おばあちゃん", role: "grandmother", emoji: "👵🏻", description: "Gentle grandmother teaching tea ceremony" },
          { id: "tomodachi_hana", name: "花ちゃん", role: "friend", emoji: "👩🏻", description: "Energetic friend for festivals" },
        ],
        Korean: [
          { id: "halmeoni_kim", name: "할머니", role: "grandmother", emoji: "👵🏻", description: "Loving grandmother teaching kimchi-making" },
          { id: "chingu_minjun", name: "민준", role: "friend", emoji: "👨🏻", description: "Friend who takes you to noraebang" },
        ],
        Italian: [
          { id: "nonna_lucia", name: "Nonna Lucia", role: "grandmother", emoji: "👵🏻", description: "Passionate grandmother teaching pasta" },
        ],
        Portuguese: [
          { id: "avo_maria", name: "Avó Maria", role: "grandmother", emoji: "👵🏽", description: "Brazilian grandmother teaching feijoada" },
        ],
      };
      return characters[input.language] || characters["Spanish"] || [];
    }),
});
