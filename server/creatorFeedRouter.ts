/**
 * Creator Content Feed Router
 * 
 * Surfaces curated clips from ingested creators (like @yourspanishwithjavier)
 * as bite-sized learning moments with translations and vocabulary highlights.
 */
import { z } from "zod";
import { publicProcedure, router } from "./_core/trpc";
import { invokeLLM } from "./_core/llm";

// ─── Featured Creators (synced from autoIngestScheduler) ─────────────────────
const FEATURED_CREATORS = [
  { handle: "yourspanishwithjavier", name: "Javier Benavides", platform: "instagram", language: "Spanish", dialect: "Colombian", avatar: "🇨🇴", followers: "1.15M" },
  { handle: "bilingueblogs", name: "Bilingue Blogs", platform: "instagram", language: "Spanish", dialect: "Mixed", avatar: "🌎", followers: "500K" },
  { handle: "spanishwithlinda", name: "Spanish with Linda", platform: "instagram", language: "Spanish", dialect: "Castilian", avatar: "🇪🇸", followers: "300K" },
  { handle: "lingotwin", name: "LingoTwin", platform: "instagram", language: "Multiple", dialect: "Various", avatar: "🌐", followers: "200K" },
];

export const creatorFeedRouter = router({
  /** Get featured creators list */
  getCreators: publicProcedure.query(() => FEATURED_CREATORS),

  /** Get curated content feed with learning annotations */
  getFeed: publicProcedure
    .input(z.object({
      targetLanguage: z.string().default("Spanish"),
      dialect: z.string().optional(),
      page: z.number().default(1),
      limit: z.number().default(10),
    }))
    .query(async ({ input }) => {
      const { targetLanguage, dialect, page, limit } = input;
      const dialectNote = dialect ? ` (${dialect} dialect)` : "";

      const result = await invokeLLM({
        messages: [{
          role: "user",
          content: `Generate ${limit} bite-sized language learning content items that would come from social media language teachers teaching ${targetLanguage}${dialectNote}. These simulate curated clips from creators.

Return JSON array:
[{
  "id": "unique_id_${page}_N",
  "creatorHandle": "one of: yourspanishwithjavier, bilingueblogs, spanishwithlinda, lingotwin",
  "type": "vocabulary" | "grammar_tip" | "cultural_note" | "slang" | "pronunciation" | "conversation",
  "title": "catchy title",
  "content": "the teaching content (2-3 sentences)",
  "targetPhrase": "key phrase in ${targetLanguage}",
  "translation": "English translation",
  "difficulty": 1-5,
  "tags": ["tag1", "tag2"],
  "engagement": { "likes": number, "saves": number, "comments": number },
  "timestamp": "ISO date string within last 7 days"
}]

Make content feel authentic — like real social media language teaching posts. Include slang, cultural context, and practical usage.`,
        }],
        responseFormat: { type: "json_object" },
      });

      try {
        const items = JSON.parse(result.choices[0].message.content as string);
        return { items, page, hasMore: true };
      } catch {
        return { items: [], page, hasMore: false };
      }
    }),

  /** Get vocabulary breakdown for a content item */
  getVocabBreakdown: publicProcedure
    .input(z.object({
      phrase: z.string(),
      targetLanguage: z.string().default("Spanish"),
    }))
    .mutation(async ({ input }) => {
      const { phrase, targetLanguage } = input;
      const result = await invokeLLM({
        messages: [{
          role: "user",
          content: `Break down this ${targetLanguage} phrase for learners: "${phrase}"

Return JSON:
{
  "words": [{ "word": "...", "meaning": "...", "partOfSpeech": "noun/verb/etc" }],
  "grammar": "brief grammar explanation",
  "usage": "when/how to use this",
  "relatedPhrases": ["similar phrase 1", "similar phrase 2"]
}`,
        }],
        responseFormat: { type: "json_object" },
      });
      try { return JSON.parse(result.choices[0].message.content as string); }
      catch { return { words: [], grammar: "", usage: "", relatedPhrases: [] }; }
    }),
});
