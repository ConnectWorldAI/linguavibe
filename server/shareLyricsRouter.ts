/**
 * Share Translated Lyrics as Stories Router
 * 
 * Export song translations as shareable Instagram story-style cards.
 * Generates beautiful visual cards with lyrics + translations.
 */
import { z } from "zod";
import { publicProcedure, router } from "./_core/trpc";
import { invokeLLM } from "./_core/llm";

const STORY_THEMES = [
  { id: "neon", name: "Neon Glow", gradient: ["#0a0e1a", "#1a0533"], textColor: "#00AAFF", accentColor: "#FF4081" },
  { id: "sunset", name: "Sunset Vibes", gradient: ["#FF6B35", "#FF4081"], textColor: "#FFFFFF", accentColor: "#FFD700" },
  { id: "ocean", name: "Ocean Deep", gradient: ["#0077B6", "#023E8A"], textColor: "#FFFFFF", accentColor: "#90E0EF" },
  { id: "forest", name: "Forest Night", gradient: ["#1B4332", "#2D6A4F"], textColor: "#FFFFFF", accentColor: "#95D5B2" },
  { id: "midnight", name: "Midnight Purple", gradient: ["#240046", "#3C096C"], textColor: "#FFFFFF", accentColor: "#C77DFF" },
  { id: "fire", name: "Fire & Gold", gradient: ["#370617", "#6A040F"], textColor: "#FFD700", accentColor: "#FF4500" },
  { id: "minimal", name: "Clean White", gradient: ["#FFFFFF", "#F5F5F5"], textColor: "#1A1A1A", accentColor: "#00AAFF" },
  { id: "retro", name: "Retro Wave", gradient: ["#2B2D42", "#8D99AE"], textColor: "#EDF2F4", accentColor: "#EF233C" },
];

export const shareLyricsRouter = router({
  /** Get available story themes */
  getThemes: publicProcedure.query(() => STORY_THEMES),

  /** Generate a story card layout for lyrics */
  generateStoryCard: publicProcedure
    .input(z.object({
      originalLyrics: z.string(),
      translatedLyrics: z.string(),
      songTitle: z.string(),
      artist: z.string().optional(),
      targetLanguage: z.string().default("Spanish"),
      themeId: z.string().default("neon"),
      layout: z.enum(["side_by_side", "stacked", "highlight", "karaoke"]).default("stacked"),
    }))
    .mutation(async ({ input }) => {
      const { originalLyrics, translatedLyrics, songTitle, artist, targetLanguage, themeId, layout } = input;
      const theme = STORY_THEMES.find(t => t.id === themeId) || STORY_THEMES[0];

      // Use LLM to pick the best 4 lines for a story card
      const result = await invokeLLM({
        messages: [{
          role: "user",
          content: `Pick the most impactful/shareable 4 lines from these translated lyrics for an Instagram story card.

Original: "${originalLyrics}"
Translation (${targetLanguage}): "${translatedLyrics}"

Return JSON:
{
  "selectedOriginal": ["line1", "line2", "line3", "line4"],
  "selectedTranslation": ["translated_line1", "translated_line2", "translated_line3", "translated_line4"],
  "caption": "suggested Instagram caption with relevant hashtags",
  "mood": "one word describing the mood"
}

Pick lines that are emotionally powerful, quotable, or culturally interesting.`,
        }],
        responseFormat: { type: "json_object" },
      });

      try {
        const selection = JSON.parse(result.choices[0].message.content as string);
        return {
          ...selection,
          theme,
          layout,
          songTitle,
          artist: artist || "Unknown",
          targetLanguage,
          watermark: "LinguaVibe",
        };
      } catch {
        return {
          selectedOriginal: originalLyrics.split("\n").slice(0, 4),
          selectedTranslation: translatedLyrics.split("\n").slice(0, 4),
          caption: `🎵 ${songTitle} translated to ${targetLanguage} #LinguaVibe #LanguageLearning`,
          mood: "vibes",
          theme,
          layout,
          songTitle,
          artist: artist || "Unknown",
          targetLanguage,
          watermark: "LinguaVibe",
        };
      }
    }),

  /** Generate multiple story cards for a full song */
  generateStorySet: publicProcedure
    .input(z.object({
      originalLyrics: z.string(),
      translatedLyrics: z.string(),
      songTitle: z.string(),
      artist: z.string().optional(),
      targetLanguage: z.string().default("Spanish"),
      themeId: z.string().default("neon"),
      cardCount: z.number().default(4),
    }))
    .mutation(async ({ input }) => {
      const { originalLyrics, translatedLyrics, songTitle, artist, targetLanguage, themeId, cardCount } = input;
      const theme = STORY_THEMES.find(t => t.id === themeId) || STORY_THEMES[0];

      const result = await invokeLLM({
        messages: [{
          role: "user",
          content: `Split these lyrics into ${cardCount} story cards for Instagram stories. Each card should have 2-4 lines.

Original: "${originalLyrics}"
Translation (${targetLanguage}): "${translatedLyrics}"

Return JSON array of ${cardCount} cards:
[{
  "cardNumber": 1,
  "originalLines": ["line1", "line2"],
  "translatedLines": ["translated1", "translated2"],
  "highlightWord": "one key vocabulary word from this section",
  "highlightMeaning": "its English meaning"
}]

Make each card feel complete and shareable on its own.`,
        }],
        responseFormat: { type: "json_object" },
      });

      try {
        const cards = JSON.parse(result.choices[0].message.content as string);
        return {
          cards,
          theme,
          songTitle,
          artist: artist || "Unknown",
          targetLanguage,
          totalCards: cards.length,
        };
      } catch {
        return { cards: [], theme, songTitle, artist: artist || "Unknown", targetLanguage, totalCards: 0 };
      }
    }),
});
