import { z } from "zod";
import { publicProcedure, router } from "./_core/trpc";
import { invokeLLM } from "./_core/llm";
import {
  buildLLMGuardrailPrompt,
  validateLLMOutput,
  enforceGuardrails,
  type GuardrailContext,
} from "./languageGuardrails";

/**
 * Adaptive Exercise Router
 * AI-powered exercise generation that creates fresh, culturally-immersive
 * exercises every time a user opens a lesson.
 */

const ExerciseTypeEnum = z.enum([
  "story_choice",
  "cultural_discovery",
  "conversation_chain",
  "fill_the_order",
  "match_pairs",
  "grammar_comparison",
]);

export const adaptiveExerciseRouter = router({
  generateLesson: publicProcedure
    .input(z.object({
      language: z.string(),
      dialect: z.string().optional(),
      level: z.enum(["A1", "A2", "B1", "B2", "C1", "C2"]),
      lessonTopic: z.string(),
      lessonCategory: z.string(),
      culturalFocus: z.string().optional(),
      previousErrors: z.array(z.string()).optional(),
      preferredExerciseTypes: z.array(z.string()).optional(),
      culturalPercentage: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      const { language, dialect, level, lessonTopic, lessonCategory, culturalFocus, previousErrors, preferredExerciseTypes, culturalPercentage } = input;
      const dialectNote = dialect ? `The student is learning the ${dialect} dialect/variant.` : "";
      const errorContext = previousErrors?.length
        ? `The student previously struggled with: ${previousErrors.join(", ")}. Reinforce these.`
        : "";

      // ═══ GUARDRAIL: Enforce language/dialect validation ═══
      const guardrailCtx: GuardrailContext = { targetLanguage: language, targetDialect: dialect, sourceSystem: "adaptive_exercise" };
      enforceGuardrails(guardrailCtx);
      const guardrailPrompt = buildLLMGuardrailPrompt(language, dialect);

      const systemPrompt = `You are an immersive language teacher creating culturally-rich exercises for a ${level} level student learning ${language}${dialect ? ` (${dialect} dialect)` : ""}.

${guardrailPrompt}

RULES:
1. ALL exercises teach vocabulary IN ${language} with pronunciation guides
2. Every exercise is rooted in REAL cultural scenarios (real foods, dances, holidays, traditions)
3. NEVER create generic "translate this word" exercises - make them EXPERIENCES
4. Wrong answers get culturally-aware corrections (character reacts naturally)
5. Difficulty matches ${level}: A1=single words/basic phrases, A2=simple sentences, B1=paragraphs, B2+=complex scenarios
6. Include pronunciation for EVERY target-language word/phrase
${dialectNote}
${errorContext}

EXERCISE TYPES (generate 4-6, ${preferredExerciseTypes?.length ? `PREFER these types: ${preferredExerciseTypes.join(", ")}` : "mix these"}):
CULTURAL CONTENT: ${culturalPercentage ?? 50}% of exercises should be culturally-immersive, rest can be grammar-focused.
1. story_choice: Interactive scenario where character speaks in ${language}, student picks correct response
2. cultural_discovery: Present a cultural tradition/food/dance, teach vocabulary around it
3. conversation_chain: Back-and-forth dialogue, student picks responses
4. fill_the_order: Complete a real-world task (order food, fill form, write message)
5. match_pairs: Match cultural items with meanings/descriptions
6. grammar_comparison: Whiteboard-style side-by-side grammar table comparing English and ${language}. Show pronoun/verb/structure tables, word order differences with pronunciation, and a quick quiz. Like a real teacher explaining on a whiteboard with bilingual columns.`;

      const userPrompt = `Generate an adaptive lesson for: "${lessonTopic}" (category: ${lessonCategory}).
${culturalFocus ? `Cultural focus: ${culturalFocus}` : "Include authentic cultural content."}

Return JSON:
{
  "lessonTitle": "string - engaging title with cultural hook",
  "culturalContext": "string - 1-2 sentences setting the scene",
  "exercises": [
    {
      "type": "story_choice|cultural_discovery|conversation_chain|fill_the_order|match_pairs|grammar_comparison",
      "title": "string",
      "scenario": "string - scene description",
      "character": { "name": "string", "role": "string", "emoji": "string" },
      "steps": [
        {
          "prompt": "string - in ${language} with translation",
          "promptTranslation": "string - English",
          "pronunciation": "string",
          "options": ["option1", "option2", "option3", "option4"],
          "correctIndex": 0,
          "correctFeedback": "string - in ${language}",
          "wrongFeedback": "string - correction in ${language} with translation",
          "culturalNote": "string - cultural insight"
        }
      ],
      "vocabularyLearned": [
        { "word": "string in ${language}", "pronunciation": "string", "meaning": "string English" }
      ],
      // For grammar_comparison type ONLY, include these additional fields:
      "grammarTopic": "string - e.g. Subject Pronouns vs Object Pronouns",
      "nativeLanguage": "English",
      "targetLanguage": "${language}",
      "grammarTable": [
        { "native": "I", "target": "Yo", "pronunciation": "/yoh/", "note": "optional context" }
      ],
      "wordOrderExamples": [
        {
          "nativeSentence": "They called them",
          "targetSentence": "Los llamaron",
          "nativeBreakdown": ["They", "called", "them"],
          "targetBreakdown": ["Los", "llamaron"],
          "pronunciationBreakdown": ["/lohs/", "/yah-MAH-rohn/"],
          "orderNote": "In ${language}, the object pronoun comes BEFORE the verb"
        }
      ],
      "quiz": [
        { "question": "string", "options": ["a","b","c","d"], "correctIndex": 0, "explanation": "string" }
      ],
      "keyRule": "string - the main grammar rule being taught",
      "conjugationTable": {
        "verb": "hablar",
        "verbMeaning": "to speak",
        "entries": [
          { "pronoun": "yo", "present": "hablo", "past": "habl\u00e9", "future": "hablar\u00e9", "presentPron": "/AH-bloh/", "pastPron": "/ah-BLEH/", "futurePron": "/ah-blah-REH/" }
        ]
      }
    }
  ],
  "totalXP": number,
  "culturalInsight": "string - fascinating cultural fact"
}

Generate 4-6 exercises. Include at least ONE grammar_comparison exercise when the category is grammar. For verb-focused topics, include a conjugationTable showing present/past/future forms. Make them feel like REAL experiences.`;

      try {
        const result = await invokeLLM({
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          responseFormat: { type: "json_object" },
          maxTokens: 4000,
        });

        const content = result.choices[0]?.message?.content;
        if (!content) throw new Error("No content from LLM");
        const textContent = typeof content === "string" ? content :
          Array.isArray(content) ? (content.find((c: any) => c.type === "text") as any)?.text || "{}" : "{}";
        const parsed = JSON.parse(textContent);

        // ═══ GUARDRAIL: Validate LLM output for cross-language contamination ═══
        const outputCheck = validateLLMOutput(textContent, language, guardrailCtx);
        if (outputCheck.violations.length > 0) {
          console.warn(`[AdaptiveExercise] Guardrail violations:`, outputCheck.violations.map(v => v.message));
        }

        return { success: true, lesson: parsed, generatedAt: new Date().toISOString() };
      } catch (error: any) {
        return {
          success: false,
          lesson: getFallbackLesson(language, level, lessonTopic),
          generatedAt: new Date().toISOString(),
          error: error.message,
        };
      }
    }),

  generateQuickExercise: publicProcedure
    .input(z.object({
      language: z.string(),
      dialect: z.string().optional(),
      level: z.enum(["A1", "A2", "B1", "B2", "C1", "C2"]),
      type: ExerciseTypeEnum,
      culturalTopic: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const { language, dialect, level, type, culturalTopic } = input;
      // ═══ GUARDRAIL: Quick exercise guardrail ═══
      const quickGuardrailPrompt = buildLLMGuardrailPrompt(language, dialect);

      const prompt = `Generate a single ${type} exercise for a ${level} ${language}${dialect ? ` (${dialect})` : ""} learner.
${quickGuardrailPrompt}
${culturalTopic ? `Cultural topic: ${culturalTopic}` : "Pick any authentic cultural scenario."}
Return JSON with: type, title, scenario, character {name, role, emoji}, steps [{prompt, promptTranslation, pronunciation, options, correctIndex, correctFeedback, wrongFeedback, culturalNote}], vocabularyLearned [{word, pronunciation, meaning}]`;

      try {
        const result = await invokeLLM({
          messages: [{ role: "user", content: prompt }],
          responseFormat: { type: "json_object" },
          maxTokens: 2000,
        });
        const content = result.choices[0]?.message?.content;
        const textContent = typeof content === "string" ? content :
          Array.isArray(content) ? (content.find((c: any) => c.type === "text") as any)?.text || "{}" : "{}";
        return { success: true, exercise: JSON.parse(textContent) };
      } catch (error: any) {
        return { success: false, exercise: null, error: error.message };
      }
    }),

  evaluateResponse: publicProcedure
    .input(z.object({
      language: z.string(),
      level: z.string(),
      prompt: z.string(),
      studentResponse: z.string(),
      expectedContent: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const { language, level, prompt, studentResponse, expectedContent } = input;
      const evalPrompt = `Evaluate a ${level} ${language} student's response.
Prompt: "${prompt}" ${expectedContent ? `Expected: "${expectedContent}"` : ""}
Student wrote: "${studentResponse}"
Return JSON: { "score": 0-100, "grammarCorrect": bool, "corrections": [{"original":"","corrected":"","explanation":""}], "encouragement": "in ${language} with translation", "nextSuggestion": "" }`;

      try {
        const result = await invokeLLM({
          messages: [{ role: "user", content: evalPrompt }],
          responseFormat: { type: "json_object" },
          maxTokens: 1500,
        });
        const content = result.choices[0]?.message?.content;
        const textContent = typeof content === "string" ? content :
          Array.isArray(content) ? (content.find((c: any) => c.type === "text") as any)?.text || "{}" : "{}";
        return { success: true, evaluation: JSON.parse(textContent) };
      } catch (error: any) {
        return { success: false, evaluation: null, error: error.message };
      }
    }),
});

function getFallbackLesson(language: string, level: string, topic: string) {
  return {
    lessonTitle: `${topic} - Cultural Immersion`,
    culturalContext: `An immersive ${language} experience focused on ${topic}.`,
    exercises: [
      {
        type: "story_choice",
        title: "Kitchen Scenario",
        scenario: "You're helping prepare a traditional meal.",
        character: { name: "Abuela", role: "grandmother", emoji: "👵🏽" },
        steps: [{
          prompt: language === "Spanish" ? "¡Mijo! Pásame la sal, por favor." : "Please pass me the salt.",
          promptTranslation: "My child! Pass me the salt, please.",
          pronunciation: "MEE-ho PA-sa-meh la SAL por fa-VOR",
          options: ["🧂 Salt", "🍚 Rice", "🧅 Onion", "🥄 Spoon"],
          correctIndex: 0,
          correctFeedback: "¡Perfecto! Gracias, mijo.",
          wrongFeedback: "No, eso no es la sal. Intenta de nuevo.",
          culturalNote: "In Dominican families, cooking together passes down traditions.",
        }],
        vocabularyLearned: [
          { word: "la sal", pronunciation: "la SAL", meaning: "salt" },
          { word: "pásame", pronunciation: "PA-sa-meh", meaning: "pass me" },
        ],
      },
    ],
    totalXP: 30,
    culturalInsight: "Cooking together is how cultural traditions are preserved across generations.",
  };
}
