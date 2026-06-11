/**
 * Song Lesson Breakdown Router
 * 
 * Takes extracted lyrics from a song and generates a comprehensive language lesson:
 * - Vocabulary extraction (nouns, verbs, adjectives, idioms, slang)
 * - Grammar rules used in the lyrics
 * - Conjugation tables for verbs
 * - Gender identification for nouns
 * - Cultural context and usage notes
 * - Difficulty grading per word
 * - Example sentences beyond the song
 * 
 * Architecture inspired by Moises: analyze audio → extract lyrics → generate lesson
 */

import { z } from "zod";
import { router, publicProcedure } from "./_core/trpc";
import { invokeLLM } from "./_core/llm";

function extractText(result: any): string {
  const raw = result.choices?.[0]?.message?.content;
  if (!raw) return "";
  if (typeof raw === "string") return raw;
  const textPart = raw.find((p: any) => p.type === "text");
  return textPart?.text ?? "";
}

export const songLessonBreakdownRouter = router({
  /**
   * Generate a full lesson breakdown from song lyrics
   * Returns vocabulary, grammar, conjugations, cultural notes
   */
  generateBreakdown: publicProcedure
    .input(z.object({
      lyrics: z.string().min(1),
      songTitle: z.string().optional(),
      artist: z.string().optional(),
      sourceLanguage: z.string().default("Spanish"),
      targetLanguage: z.string().default("English"),
      userLevel: z.string().optional(), // CEFR level: A1, A2, B1, B2, C1, C2
      dialect: z.string().optional(), // e.g., "Dominican", "Puerto Rican"
      focusAreas: z.array(z.enum([
        "nouns", "verbs", "adjectives", "idioms", "slang",
        "grammar", "conjugation", "pronunciation", "cultural"
      ])).optional(),
    }))
    .mutation(async ({ input }) => {
      const systemPrompt = `You are an expert language teacher who creates comprehensive song-based lessons. Given song lyrics, extract ALL teachable vocabulary and grammar, organized for language learners.

You MUST return valid JSON with this EXACT structure:
{
  "songInfo": {
    "title": "song title",
    "artist": "artist name",
    "detectedLanguage": "detected source language",
    "dialect": "detected dialect/variant if any",
    "estimatedLevel": "A1/A2/B1/B2/C1/C2",
    "genre": "music genre",
    "theme": "main theme of the song"
  },
  "vocabulary": [
    {
      "id": "unique_id",
      "word": "the word in source language",
      "translation": "translation in target language",
      "category": "nouns|verbs|adjectives|idioms|slang",
      "gender": "masculine|feminine|neutral|null (for nouns only)",
      "conjugation": ["yo form", "tú form", "él/ella form", "nosotros form", "vosotros form", "ellos form"] or null (for verbs only, present tense),
      "pronunciation": "phonetic guide",
      "examples": ["example sentence 1 in source language", "example sentence 2"],
      "exampleTranslations": ["translation of example 1", "translation of example 2"],
      "difficulty": "easy|medium|hard",
      "lyricContext": "the line from the song where this word appears",
      "usageNote": "when/how to use this word naturally"
    }
  ],
  "grammarRules": [
    {
      "id": "unique_id",
      "rule": "name of the grammar rule",
      "explanation": "clear explanation for learners",
      "pattern": "the grammatical pattern (e.g., 'ir + a + infinitive')",
      "lyricExample": "the line from the song demonstrating this rule",
      "lyricTranslation": "translation of that line",
      "additionalExamples": [
        { "source": "example in source language", "translation": "translation" }
      ],
      "level": "A1/A2/B1/B2/C1/C2",
      "tip": "practical tip for remembering or using this rule"
    }
  ],
  "culturalNotes": [
    {
      "topic": "cultural topic",
      "explanation": "explanation of cultural reference or context",
      "relatedLyric": "the lyric line that references this"
    }
  ],
  "lessonSummary": {
    "totalWords": number,
    "byCategory": { "nouns": number, "verbs": number, "adjectives": number, "idioms": number, "slang": number },
    "keyTakeaways": ["3-5 key things the learner should remember"],
    "suggestedPractice": ["2-3 practice activities based on this song"]
  }
}

IMPORTANT RULES:
- Extract EVERY meaningful word from the lyrics (aim for 15-30 vocabulary items)
- Include ALL verb conjugations found in the song
- Identify gender for ALL nouns
- Mark slang and idioms clearly with usage context
- Grade difficulty relative to the learner's level
- Provide at least 2 examples per word (one from the song, one original)
- Identify 3-8 grammar rules demonstrated in the lyrics
- Include cultural context for slang, idioms, and cultural references
- If the song uses a specific dialect, note dialect-specific vocabulary`;

      const userMessage = `Analyze these ${input.sourceLanguage} lyrics and create a comprehensive lesson breakdown.
${input.songTitle ? `Song: "${input.songTitle}"` : ""}
${input.artist ? `Artist: ${input.artist}` : ""}
${input.dialect ? `Dialect/Variant: ${input.dialect}` : ""}
${input.userLevel ? `Learner's current level: ${input.userLevel}` : ""}
${input.focusAreas?.length ? `Focus areas: ${input.focusAreas.join(", ")}` : ""}
Target language for translations: ${input.targetLanguage}

LYRICS:
${input.lyrics}`;

      try {
        const response = await invokeLLM({
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userMessage },
          ],
          response_format: { type: "json_object" },
        });

        const text = extractText(response);
        if (!text) {
          return { success: false as const, error: "No response from AI", data: null };
        }

        const parsed = JSON.parse(text);

        // Ensure IDs are unique
        if (parsed.vocabulary) {
          parsed.vocabulary = parsed.vocabulary.map((v: any, i: number) => ({
            ...v,
            id: v.id || `vocab_${i + 1}`,
          }));
        }
        if (parsed.grammarRules) {
          parsed.grammarRules = parsed.grammarRules.map((g: any, i: number) => ({
            ...g,
            id: g.id || `grammar_${i + 1}`,
          }));
        }

        return { success: true as const, error: null, data: parsed };
      } catch (err: any) {
        return { success: false as const, error: err.message || "Breakdown generation failed", data: null };
      }
    }),

  /**
   * Generate a quick vocabulary quiz from a previous breakdown
   * Takes vocabulary items and generates quiz questions
   */
  generateQuiz: publicProcedure
    .input(z.object({
      vocabulary: z.array(z.object({
        word: z.string(),
        translation: z.string(),
        category: z.string(),
      })),
      quizType: z.enum(["translation", "fill_blank", "conjugation", "mixed"]).default("mixed"),
      questionCount: z.number().min(3).max(20).default(10),
      sourceLanguage: z.string().default("Spanish"),
      targetLanguage: z.string().default("English"),
    }))
    .mutation(async ({ input }) => {
      const prompt = `Generate a vocabulary quiz with ${input.questionCount} questions based on these words.
Quiz type: ${input.quizType}
Source language: ${input.sourceLanguage}
Target language: ${input.targetLanguage}

Words to quiz:
${input.vocabulary.map(v => `- ${v.word} (${v.translation}) [${v.category}]`).join("\n")}

Return JSON:
{
  "questions": [
    {
      "id": number,
      "type": "translation|fill_blank|conjugation",
      "prompt": "the question text",
      "correctAnswer": "the correct answer",
      "options": ["option1", "option2", "option3", "option4"],
      "explanation": "why this is correct",
      "relatedWord": "the vocabulary word this tests"
    }
  ]
}

Rules:
- Mix question types if "mixed" is selected
- Always provide exactly 4 options per question
- Make wrong options plausible (same category, similar difficulty)
- Include brief explanations for learning`;

      try {
        const response = await invokeLLM({
          messages: [{ role: "user", content: prompt }],
          response_format: { type: "json_object" },
        });

        const text = extractText(response);
        const parsed = JSON.parse(text);

        return { success: true as const, error: null, questions: parsed.questions || [] };
      } catch (err: any) {
        return { success: false as const, error: err.message || "Quiz generation failed", questions: [] };
      }
    }),
});
