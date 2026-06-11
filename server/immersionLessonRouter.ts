/**
 * Immersion Lesson Router
 * 
 * Generates personalized micro-lessons for immersion mode notifications.
 * Instead of static examples, the LLM creates contextual lessons based on:
 * - User's current curriculum level
 * - Recently-learned vocabulary
 * - Time of day / context
 * - Enabled categories
 * - User's struggle areas
 */

import { z } from "zod";
import { publicProcedure, router } from "./_core/trpc";
import { invokeLLM } from "./_core/llm";

export const immersionLessonRouter = router({
  /**
   * Generate a batch of personalized micro-lessons for immersion notifications.
   * Called when the user enables immersion mode or when the lesson pool runs low.
   */
  generateLessons: publicProcedure
    .input(z.object({
      targetLanguage: z.string(),
      nativeLanguage: z.string().default("English"),
      level: z.enum(["beginner", "intermediate", "advanced"]),
      categories: z.array(z.string()),
      recentVocabulary: z.array(z.string()).default([]),
      struggleAreas: z.array(z.string()).default([]),
      count: z.number().min(1).max(20).default(10),
      contextHint: z.string().optional(), // e.g., "morning", "commute", "evening"
    }))
    .mutation(async ({ input }) => {
      const { targetLanguage, nativeLanguage, level, categories, recentVocabulary, struggleAreas, count, contextHint } = input;

      const vocabSection = recentVocabulary.length > 0
        ? `\nRecently learned vocabulary to reinforce: ${recentVocabulary.slice(0, 15).join(", ")}`
        : "";

      const struggleSection = struggleAreas.length > 0
        ? `\nAreas the student struggles with: ${struggleAreas.join(", ")}`
        : "";

      const contextSection = contextHint
        ? `\nTime context: ${contextHint} — generate lessons appropriate for this time of day.`
        : "";

      const prompt = `Generate ${count} immersion micro-lessons for a ${level} ${targetLanguage} learner (native: ${nativeLanguage}).

These are short notification-style lessons that appear throughout the day, transforming everyday phone notifications into language learning moments.

Categories to include: ${categories.join(", ")}
${vocabSection}
${struggleSection}
${contextSection}

Each lesson should be a realistic notification/message that someone might receive on their phone, translated into ${targetLanguage}. Include:
- The original ${nativeLanguage} phrase (as it would appear in a real notification)
- The ${targetLanguage} translation
- A brief context note (what app/situation this would be from)
- Difficulty level (easy/medium/hard)
- One key vocabulary word or grammar point highlighted

For ${level} learners:
${level === "beginner" ? "- Use simple, high-frequency vocabulary\n- Short sentences (5-8 words)\n- Focus on present tense and basic structures" : ""}
${level === "intermediate" ? "- Mix common and less common vocabulary\n- Medium sentences (8-15 words)\n- Include some idioms and colloquial expressions" : ""}
${level === "advanced" ? "- Use sophisticated vocabulary and complex structures\n- Longer sentences with subordinate clauses\n- Include slang, cultural references, and nuanced expressions" : ""}

Return as JSON with this exact structure:
{
  "lessons": [
    {
      "id": "unique_id",
      "category": "category_name",
      "original": "English notification text",
      "translated": "Target language translation",
      "context": "Brief context (e.g., 'Uber notification')",
      "difficulty": "easy|medium|hard",
      "keyPoint": "One vocabulary word or grammar note",
      "pronunciation": "Phonetic hint for key word (optional)"
    }
  ]
}`;

      try {
        const result = await invokeLLM({
          messages: [{ role: "user", content: prompt }],
          responseFormat: { type: "json_object" },
          temperature: 0.9, // High creativity for varied lessons
        });

        const content = result.choices?.[0]?.message?.content;
        const text = typeof content === "string" ? content : "";
        const parsed = JSON.parse(text);

        if (parsed.lessons && Array.isArray(parsed.lessons)) {
          return {
            success: true,
            lessons: parsed.lessons.map((l: any, i: number) => ({
              id: l.id || `imm_${Date.now()}_${i}`,
              category: l.category || categories[0] || "general",
              original: l.original || "",
              translated: l.translated || "",
              context: l.context || "",
              difficulty: l.difficulty || "easy",
              keyPoint: l.keyPoint || "",
              pronunciation: l.pronunciation || null,
            })),
          };
        }

        return { success: false, lessons: [], error: "Invalid response format" };
      } catch (err) {
        return { success: false, lessons: [], error: "Lesson generation failed" };
      }
    }),

  /**
   * Generate a single contextual lesson based on time of day and recent activity.
   * Used for on-demand lesson refresh or when a notification fires.
   */
  generateSingleLesson: publicProcedure
    .input(z.object({
      targetLanguage: z.string(),
      nativeLanguage: z.string().default("English"),
      level: z.enum(["beginner", "intermediate", "advanced"]),
      category: z.string(),
      timeOfDay: z.enum(["morning", "afternoon", "evening", "night"]),
      recentVocabulary: z.array(z.string()).default([]),
    }))
    .mutation(async ({ input }) => {
      const { targetLanguage, nativeLanguage, level, category, timeOfDay, recentVocabulary } = input;

      const timeContexts: Record<string, string> = {
        morning: "morning routine — coffee, commute, checking messages, weather",
        afternoon: "midday — lunch, work meetings, errands, social media",
        evening: "evening — dinner, entertainment, social plans, relaxation",
        night: "late night — bedtime routine, setting alarms, planning tomorrow",
      };

      const prompt = `Generate ONE immersion micro-lesson for a ${level} ${targetLanguage} learner.

Context: ${timeContexts[timeOfDay]}
Category: ${category}
${recentVocabulary.length > 0 ? `Reinforce these words if possible: ${recentVocabulary.slice(0, 5).join(", ")}` : ""}

Create a realistic phone notification in ${nativeLanguage}, translate it to ${targetLanguage}, and add a learning note.

Return JSON:
{
  "original": "English text",
  "translated": "${targetLanguage} translation",
  "context": "Brief source context",
  "difficulty": "easy|medium|hard",
  "keyPoint": "Grammar or vocab note",
  "pronunciation": "Phonetic hint"
}`;

      try {
        const result = await invokeLLM({
          messages: [{ role: "user", content: prompt }],
          responseFormat: { type: "json_object" },
          temperature: 0.95,
        });

        const content = result.choices?.[0]?.message?.content;
        const text = typeof content === "string" ? content : "";
        const parsed = JSON.parse(text);

        return {
          success: true,
          lesson: {
            id: `imm_single_${Date.now()}`,
            category: input.category,
            original: parsed.original || "",
            translated: parsed.translated || "",
            context: parsed.context || "",
            difficulty: parsed.difficulty || "easy",
            keyPoint: parsed.keyPoint || "",
            pronunciation: parsed.pronunciation || null,
          },
        };
      } catch {
        return { success: false, lesson: null, error: "Generation failed" };
      }
    }),
});
