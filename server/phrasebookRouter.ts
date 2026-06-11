/**
 * Conversation Phrasebook Router
 * 
 * Pre-built situational phrases (restaurant, airport, dating, shopping, etc.)
 * with audio playback via ElevenLabs TTS. Supports multiple languages and dialects.
 */
import { z } from "zod";
import { publicProcedure, router } from "./_core/trpc";
import { invokeLLM } from "./_core/llm";

// ─── Phrase Categories ───────────────────────────────────────────────────────
const CATEGORIES = [
  { id: "restaurant", name: "Restaurant & Food", icon: "🍽️", color: "#FF6B35" },
  { id: "airport", name: "Airport & Travel", icon: "✈️", color: "#00AAFF" },
  { id: "dating", name: "Dating & Romance", icon: "💕", color: "#FF4081" },
  { id: "shopping", name: "Shopping & Markets", icon: "🛍️", color: "#9C27B0" },
  { id: "hotel", name: "Hotel & Accommodation", icon: "🏨", color: "#4CAF50" },
  { id: "emergency", name: "Emergency & Health", icon: "🚨", color: "#F44336" },
  { id: "directions", name: "Directions & Transport", icon: "🗺️", color: "#FF9800" },
  { id: "nightlife", name: "Nightlife & Bars", icon: "🎶", color: "#7C4DFF" },
  { id: "business", name: "Business & Formal", icon: "💼", color: "#607D8B" },
  { id: "smalltalk", name: "Small Talk & Greetings", icon: "👋", color: "#00BCD4" },
  { id: "compliments", name: "Compliments & Flirting", icon: "😊", color: "#E91E63" },
  { id: "sports", name: "Sports & Fitness", icon: "⚽", color: "#8BC34A" },
];

export const phrasebookRouter = router({
  /** Get all available categories */
  getCategories: publicProcedure.query(() => CATEGORIES),

  /** Get phrases for a specific category and language */
  getPhrases: publicProcedure
    .input(z.object({
      categoryId: z.string(),
      targetLanguage: z.string().default("Spanish"),
      dialect: z.string().optional(),
      cefrLevel: z.enum(["A1", "A2", "B1", "B2", "C1", "C2"]).default("A2"),
    }))
    .query(async ({ input }) => {
      const { categoryId, targetLanguage, dialect, cefrLevel } = input;
      const category = CATEGORIES.find(c => c.id === categoryId);
      if (!category) throw new Error("Category not found");

      const dialectNote = dialect ? ` (${dialect} dialect/variant)` : "";
      const prompt = `Generate 15 essential conversational phrases for the "${category.name}" situation in ${targetLanguage}${dialectNote}.
Target CEFR level: ${cefrLevel}

Return JSON array with this exact structure:
[{
  "id": "unique_id",
  "phrase": "the phrase in ${targetLanguage}",
  "translation": "English translation",
  "pronunciation": "phonetic guide for English speakers",
  "context": "when/how to use this phrase (1 sentence)",
  "formality": "formal" | "casual" | "slang",
  "difficulty": 1-5
}]

Include a mix of formality levels. For slang/casual phrases, include the cultural context.
Order from most essential to least. Make phrases natural and actually used by native speakers, not textbook-stiff.`;

      const result = await invokeLLM({
        messages: [{ role: "user", content: prompt }],
        responseFormat: { type: "json_object" },
      });

      try {
        const phrases = JSON.parse(result.choices[0].message.content as string);
        return { category, phrases, language: targetLanguage, dialect };
      } catch {
        return { category, phrases: [], language: targetLanguage, dialect };
      }
    }),

  /** Generate TTS audio for a phrase */
  speakPhrase: publicProcedure
    .input(z.object({
      phrase: z.string(),
      language: z.string().default("Spanish"),
      speed: z.enum(["slow", "normal", "fast"]).default("normal"),
    }))
    .mutation(async ({ input }) => {
      const { phrase, language, speed } = input;
      // Use the built-in LLM TTS or ElevenLabs for pronunciation
      const speedNote = speed === "slow" ? " (speak slowly and clearly for learners)" : 
                        speed === "fast" ? " (speak at native speed)" : "";
      
      // Return the phrase data for client-side Speech.speak() with language tag
      const langMap: Record<string, string> = {
        "Spanish": "es-ES", "French": "fr-FR", "Japanese": "ja-JP",
        "Korean": "ko-KR", "Italian": "it-IT", "Portuguese": "pt-BR",
        "German": "de-DE", "Mandarin": "zh-CN", "Arabic": "ar-SA",
        "Dominican Spanish": "es-DO", "Colombian Spanish": "es-CO",
        "Mexican Spanish": "es-MX",
      };
      
      return {
        phrase,
        languageCode: langMap[language] || "es-ES",
        speed: speed === "slow" ? 0.7 : speed === "fast" ? 1.2 : 1.0,
      };
    }),

  /** Generate a custom phrase for a specific situation */
  customPhrase: publicProcedure
    .input(z.object({
      situation: z.string(),
      targetLanguage: z.string().default("Spanish"),
      dialect: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const { situation, targetLanguage, dialect } = input;
      const dialectNote = dialect ? ` (${dialect} dialect)` : "";
      
      const result = await invokeLLM({
        messages: [{
          role: "user",
          content: `I need to say something in ${targetLanguage}${dialectNote} for this situation: "${situation}"
          
Return JSON: { "phrase": "phrase in target language", "translation": "English meaning", "pronunciation": "phonetic guide", "alternatives": ["alt1", "alt2"], "culturalNote": "any important context" }`,
        }],
        responseFormat: { type: "json_object" },
      });

      try {
        return JSON.parse(result.choices[0].message.content as string);
      } catch {
        return { phrase: "", translation: "", pronunciation: "", alternatives: [], culturalNote: "" };
      }
    }),
});
