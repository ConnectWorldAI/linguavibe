/**
 * Learning Intelligence Router
 * 
 * Server-side AI-powered analysis of student performance.
 * Generates personalized practice exercises, analyzes patterns,
 * and provides recommendations that the client-side intelligence engine uses.
 */
import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { invokeLLM } from "./_core/llm";

export const learningIntelligenceRouter = router({
  /**
   * Analyze student progress and generate AI-powered insights.
   * Called periodically by the client when struggles are detected.
   */
  analyzeStudentProgress: publicProcedure
    .input(z.object({
      struggles: z.array(z.object({
        category: z.string(),
        topic: z.string(),
        exerciseType: z.string(),
        language: z.string(),
        severity: z.string(),
        accuracy: z.number(),
        attempts: z.number(),
        trend: z.string(),
      })),
      overallAccuracy: z.number(),
      totalExercises: z.number(),
      language: z.string(),
      level: z.string(),
    }))
    .mutation(async ({ input }) => {
      try {
        const prompt = `You are an expert language learning AI tutor analyzing a student's performance data.

STUDENT DATA:
- Target language: ${input.language}
- Level: ${input.level}
- Overall accuracy: ${input.overallAccuracy}%
- Total exercises completed: ${input.totalExercises}

STRUGGLE AREAS:
${input.struggles.map((s) => `- ${s.topic} (${s.category}): ${s.accuracy}% accuracy, ${s.severity} severity, trend: ${s.trend}, ${s.attempts} attempts`).join("\n")}

Based on this data, provide:
1. A brief encouraging message to the student (2-3 sentences, warm and supportive)
2. The top 3 specific things they should practice next (be very specific to their language and level)
3. A teaching strategy recommendation (how to approach their weak areas)

Respond in JSON format:
{
  "encouragement": "...",
  "practiceItems": [
    { "title": "...", "description": "...", "exerciseType": "...", "estimatedMinutes": 5 }
  ],
  "teachingStrategy": "...",
  "overallAssessment": "struggling|needs_work|progressing|excelling"
}`;

        const result = await invokeLLM({
          messages: [{ role: "user", content: prompt }],
          responseFormat: { type: "json_object" },
        });

        try {
          const content = result.choices?.[0]?.message?.content;
          const text = typeof content === "string" ? content : "";
          const parsed = JSON.parse(text);
          return { success: true, analysis: parsed };
        } catch {
          return {
            success: true,
            analysis: {
              encouragement: "Keep going! Every practice session brings you closer to fluency.",
              practiceItems: input.struggles.slice(0, 3).map((s) => ({
                title: `Practice ${s.topic}`,
                description: `Focus on ${s.category} exercises for ${s.topic}`,
                exerciseType: s.exerciseType,
                estimatedMinutes: 8,
              })),
              teachingStrategy: "Focus on your weakest areas with short, frequent practice sessions.",
              overallAssessment: input.overallAccuracy >= 70 ? "progressing" : "needs_work",
            },
          };
        }
      } catch (err) {
        return { success: false, analysis: null };
      }
    }),

  /**
   * Generate personalized practice exercises based on struggle areas.
   * The AI creates exercises specifically targeting the student's weak points.
   */
  generatePersonalizedPractice: publicProcedure
    .input(z.object({
      topic: z.string(),
      category: z.string(),
      exerciseType: z.string(),
      language: z.string(),
      level: z.string(),
      focusAreas: z.array(z.string()),
      phraseCount: z.number().optional().default(5),
    }))
    .mutation(async ({ input }) => {
      try {
        const prompt = `Generate ${input.phraseCount} practice exercises for a ${input.level} ${input.language} learner who is struggling with ${input.category} in the topic "${input.topic}".

Exercise type: ${input.exerciseType}
Focus areas: ${input.focusAreas.join(", ")}

The exercises should:
- Start easy and gradually increase difficulty
- Target the specific weak areas mentioned
- Include cultural context where appropriate
- Provide clear feedback for wrong answers
- Use real-world scenarios the student might encounter

Generate in JSON format appropriate for the exercise type "${input.exerciseType}":
${getExerciseSchema(input.exerciseType)}`;

        const result = await invokeLLM({
          messages: [{ role: "user", content: prompt }],
          responseFormat: { type: "json_object" },
        });

        try {
          const content = result.choices?.[0]?.message?.content;
          const text = typeof content === "string" ? content : "";
          const parsed = JSON.parse(text);
          return { success: true, exercises: parsed };
        } catch {
          return { success: false, exercises: null, error: "Failed to parse generated exercises" };
        }
      } catch (err) {
        return { success: false, exercises: null, error: "Generation failed" };
      }
    }),

  /**
   * Get AI recommendations for what the student should do next.
   * Used by Wave Cloud and the home screen intelligence cards.
   */
  getRecommendations: publicProcedure
    .input(z.object({
      struggles: z.array(z.object({
        category: z.string(),
        topic: z.string(),
        severity: z.string(),
        accuracy: z.number(),
        trend: z.string(),
      })),
      recentExerciseTypes: z.array(z.string()),
      language: z.string(),
      level: z.string(),
      minutesAvailable: z.number().optional().default(15),
    }))
    .mutation(async ({ input }) => {
      try {
        const prompt = `You are a smart language learning system. A student learning ${input.language} at ${input.level} level has ${input.minutesAvailable} minutes available.

Their struggles: ${JSON.stringify(input.struggles)}
Recent exercise types they've done: ${input.recentExerciseTypes.join(", ")}

Recommend 2-3 specific activities they should do RIGHT NOW. Consider:
- Variety (don't repeat what they just did)
- Priority (address severe struggles first)
- Time available
- Mix of fun and challenging

Respond in JSON:
{
  "recommendations": [
    {
      "title": "...",
      "description": "...",
      "exerciseType": "rrt|netflix_dictation|match_pairs|fill_order|conversation_chain|grammar_comparison|story_choice|cultural_discovery|whiteboard",
      "topic": "...",
      "estimatedMinutes": 5,
      "reason": "...",
      "urgency": "low|medium|high|critical"
    }
  ],
  "motivationalMessage": "..."
}`;

        const result = await invokeLLM({
          messages: [{ role: "user", content: prompt }],
          responseFormat: { type: "json_object" },
        });

        try {
          const content = result.choices?.[0]?.message?.content;
          const text = typeof content === "string" ? content : "";
          const parsed = JSON.parse(text);
          return { success: true, data: parsed };
        } catch {
          return { success: false, data: null };
        }
      } catch {
        return { success: false, data: null };
      }
    }),
});

// Helper to provide exercise schema examples for the LLM
function getExerciseSchema(exerciseType: string): string {
  const schemas: Record<string, string> = {
    rrt: `{ "phrases": [{ "phrase": "...", "translation": "...", "pronunciation": "..." }] }`,
    match_pairs: `{ "pairs": [{ "left": "...", "right": "..." }] }`,
    fill_order: `{ "blanks": [{ "sentence": "...", "blank": "...", "options": ["...", "..."], "correctIndex": 0, "explanation": "..." }] }`,
    grammar_comparison: `{ "grammarTopic": "...", "grammarTable": [{ "rule": "...", "example": "...", "translation": "..." }], "quiz": [{ "question": "...", "options": ["..."], "correctIndex": 0, "explanation": "..." }] }`,
    conversation_chain: `{ "steps": [{ "prompt": "...", "promptTranslation": "...", "options": ["..."], "correctIndex": 0, "correctFeedback": "...", "wrongFeedback": "..." }] }`,
    story_choice: `{ "steps": [{ "prompt": "...", "promptTranslation": "...", "options": ["..."], "correctIndex": 0, "correctFeedback": "...", "wrongFeedback": "..." }] }`,
    netflix_dictation: `{ "clips": [{ "text": "...", "translation": "...", "speed": "normal|fast|slow" }] }`,
    cultural_discovery: `{ "steps": [{ "prompt": "...", "promptTranslation": "...", "options": ["..."], "correctIndex": 0, "culturalNote": "..." }] }`,
  };
  return schemas[exerciseType] || `{ "exercises": [{ "question": "...", "answer": "..." }] }`;
}
