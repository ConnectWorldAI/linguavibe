/**
 * Phrase Collections / Boards Router
 * 
 * Let users organize saved translations into themed boards
 * (Travel, Food, Music, Slang, Custom). Server-side provides
 * suggested boards and AI-powered auto-categorization.
 */
import { z } from "zod";
import { publicProcedure, router } from "./_core/trpc";
import { invokeLLM } from "./_core/llm";

const DEFAULT_BOARDS = [
  { id: "travel", name: "Travel", icon: "✈️", color: "#00AAFF", description: "Phrases for traveling abroad" },
  { id: "food", name: "Food & Dining", icon: "🍕", color: "#FF6B35", description: "Restaurant and cooking vocabulary" },
  { id: "music", name: "Music & Lyrics", icon: "🎵", color: "#9C27B0", description: "Song lyrics and music terms" },
  { id: "slang", name: "Slang & Street", icon: "🔥", color: "#FF4081", description: "Informal and street language" },
  { id: "work", name: "Work & Business", icon: "💼", color: "#607D8B", description: "Professional vocabulary" },
  { id: "love", name: "Love & Romance", icon: "💕", color: "#E91E63", description: "Romantic expressions" },
  { id: "culture", name: "Culture & History", icon: "🏛️", color: "#795548", description: "Cultural references and idioms" },
  { id: "daily", name: "Daily Life", icon: "☀️", color: "#FFC107", description: "Everyday conversation phrases" },
];

export const phraseCollectionsRouter = router({
  /** Get default board templates */
  getDefaultBoards: publicProcedure.query(() => DEFAULT_BOARDS),

  /** Auto-categorize a phrase into the best board */
  categorizePhrase: publicProcedure
    .input(z.object({
      phrase: z.string(),
      translation: z.string(),
      context: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const { phrase, translation, context } = input;
      const boardIds = DEFAULT_BOARDS.map(b => b.id).join(", ");
      
      const result = await invokeLLM({
        messages: [{
          role: "user",
          content: `Categorize this phrase into the best board. Available boards: ${boardIds}

Phrase: "${phrase}"
Translation: "${translation}"
${context ? `Context: ${context}` : ""}

Return JSON: { "boardId": "best_board_id", "confidence": 0.0-1.0, "alternateBoard": "second_best_id" }`,
        }],
        responseFormat: { type: "json_object" },
      });

      try { return JSON.parse(result.choices[0].message.content as string); }
      catch { return { boardId: "daily", confidence: 0.5, alternateBoard: "travel" }; }
    }),

  /** Generate themed phrases for a board */
  generateBoardPhrases: publicProcedure
    .input(z.object({
      boardId: z.string(),
      targetLanguage: z.string().default("Spanish"),
      count: z.number().default(10),
    }))
    .mutation(async ({ input }) => {
      const { boardId, targetLanguage, count } = input;
      const board = DEFAULT_BOARDS.find(b => b.id === boardId);
      
      const result = await invokeLLM({
        messages: [{
          role: "user",
          content: `Generate ${count} useful ${targetLanguage} phrases for the "${board?.name || boardId}" category.

Return JSON array:
[{ "phrase": "in ${targetLanguage}", "translation": "English", "usage": "brief context" }]

Make them practical and commonly used by native speakers.`,
        }],
        responseFormat: { type: "json_object" },
      });

      try { return JSON.parse(result.choices[0].message.content as string); }
      catch { return []; }
    }),
});
