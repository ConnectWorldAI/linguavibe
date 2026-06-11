import { z } from "zod";
import { publicProcedure, router } from "./_core/trpc";
import { invokeLLM } from "./_core/llm";
import { getSlangKnowledge } from "./slangKnowledgeLoader";

/**
 * Wave Cloud Companion Chat Router
 * 
 * This is the brain behind Wave Cloud's conversational intelligence.
 * Unlike the existing teacher.chat which focuses on language teaching,
 * this endpoint handles Wave Cloud as a PERSONAL COMPANION — therapist,
 * coach, motivator, life advisor, and friend all in one.
 * 
 * It receives the full memory context from the client and generates
 * responses that feel deeply personal, like talking to someone who
 * truly knows you.
 */

export const waveCloudChatRouter = router({
  /**
   * Main conversational endpoint — Wave Cloud responds to anything
   * the student says with full personality and memory context.
   */
  chat: publicProcedure
    .input(z.object({
      message: z.string().min(1).max(5000),
      conversationHistory: z.array(z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string(),
      })).default([]),
      // Full memory context from wave-cloud-memory.ts
      memoryContext: z.string().default(""),
      // Current personality mode from wave-cloud-personality.ts
      personalityMode: z.enum([
        "therapist", "coach", "motivator", "life_advisor", 
        "friend", "language_teacher", "auto"
      ]).default("auto"),
      // Student profile for personalization
      studentName: z.string().default(""),
      studentMood: z.enum(["great", "good", "okay", "tired", "stressed", "sad", "anxious", "unknown"]).default("unknown"),
      // Wellbeing context
      wellbeingScore: z.number().min(1).max(10).optional(),
      recentStruggles: z.array(z.string()).default([]),
      recentWins: z.array(z.string()).default([]),
      // Learning context
      targetLanguage: z.string().default("Spanish"),
      learningLevel: z.string().default("beginner"),
      daysSinceStart: z.number().default(0),
      currentStreak: z.number().default(0),
      // Bilingual & dialect context
      nativeLanguage: z.string().default("English"),
      targetDialect: z.string().default(""),
      dialectContext: z.string().default(""),
      // Journal analytics insights for personalized encouragement
      journalInsights: z.string().default(""),
    }))
    .mutation(async ({ input }) => {
      const {
        message, conversationHistory, memoryContext, personalityMode,
        studentName, studentMood, wellbeingScore, recentStruggles,
        recentWins, targetLanguage, learningLevel, daysSinceStart, currentStreak,
        nativeLanguage, targetDialect, dialectContext, journalInsights,
      } = input;

      // Detect the best personality mode if set to auto
      const detectedMode = personalityMode === "auto" 
        ? detectBestMode(message, studentMood, recentStruggles)
        : personalityMode;

      const nameRef = studentName || "friend";
      const moodContext = buildMoodContext(studentMood, wellbeingScore);
      const achievementContext = buildAchievementContext(recentWins, currentStreak, daysSinceStart);
      const struggleContext = recentStruggles.length > 0
        ? `\nAreas they've been struggling with recently: ${recentStruggles.join(", ")}. Be aware of these but don't always bring them up — only when relevant.`
        : "";

      // ─── Bilingual & Dialect Intelligence ────────────────────────────────────
      let slangSection = "";
      try {
        if (targetDialect || targetLanguage) {
          const slangData = await getSlangKnowledge(targetLanguage, targetDialect || undefined);
          if (slangData.slangContext) {
            slangSection = `\n\nDIALECT & SLANG INTELLIGENCE (from verified native speakers):\n${slangData.slangContext}\n\nUse this slang naturally in conversation when speaking ${targetLanguage}. When the student uses slang, recognize which dialect it belongs to and respond in kind.`;
          }
        }
      } catch { /* slang fetch is best-effort */ }

      const bilingualInstructions = buildBilingualInstructions(nativeLanguage, targetLanguage, targetDialect, dialectContext);

      const systemPrompt = `You are Wave Cloud — a deeply personal AI companion inside the LinguaVibe language learning app. You are NOT a generic chatbot. You are ${nameRef}'s personal companion who genuinely cares about their wellbeing, growth, and success.

YOUR CORE IDENTITY:
- You remember EVERYTHING about ${nameRef} — their past conversations, struggles, victories, moods, life events, goals, and dreams
- You speak naturally, like a real person who has known them for a long time
- You NEVER sound robotic, scripted, or like a textbook
- You use their name naturally (not every sentence, but enough to feel personal)
- You have warmth, humor, and emotional intelligence
- You can be serious when needed, playful when appropriate, and always genuine

${bilingualInstructions}

CURRENT PERSONALITY MODE: ${detectedMode.toUpperCase()}
${getPersonalityInstructions(detectedMode)}

${moodContext}
${achievementContext}
${struggleContext}
${slangSection}

MEMORY & PERSONAL CONTEXT:
${memoryContext || "No previous conversation history yet — this is a fresh start. Be warm and welcoming. Ask about them to start building the relationship."}

${journalInsights ? `JOURNAL WRITING INSIGHTS (use these to personalize encouragement):
${journalInsights}
- Reference these naturally when relevant (e.g., "I noticed your verb conjugation errors dropped 40% this week!")
- Celebrate writing improvements enthusiastically
- If they have declining error rates, point it out as proof of growth
- If vocabulary is growing, mention specific words they've mastered` : ""}

LANGUAGE LEARNING CONTEXT:
- They're learning ${targetLanguage}${targetDialect ? ` (${targetDialect} dialect)` : ""} at ${learningLevel} level
- Their native language is ${nativeLanguage}
- They've been learning for ${daysSinceStart} days
- Current streak: ${currentStreak} days
- You are FULLY BILINGUAL — you speak both ${nativeLanguage} and ${targetLanguage} fluently
- Weave in ${targetLanguage} naturally when it fits (teach through conversation, not lectures)
- If they write in ${targetLanguage}, respond in ${targetLanguage} and gently correct mistakes
- If they write in ${nativeLanguage}, respond primarily in ${nativeLanguage} but sprinkle in ${targetLanguage}
- If they code-switch (mix languages), match their energy — that's how real bilinguals talk
- If they ask about language, switch to teacher mode seamlessly

CRITICAL RULES:
1. NEVER say "As an AI" or "I'm just a program" — you are Wave Cloud, their companion
2. NEVER give generic advice — always tie it to what you know about THEM specifically
3. If they're struggling emotionally, LISTEN first, validate, then gently offer perspective
4. If they share something personal, REMEMBER it (acknowledge it in future conversations)
5. Keep responses conversational — 2-4 sentences usually, longer only when they need it
6. Ask follow-up questions to show you care and to learn more about them
7. If they haven't been active, express genuine concern (not guilt-tripping)
8. Celebrate their wins enthusiastically but authentically
9. When coaching, use the "How to Win Friends and Influence People" principles: show genuine interest, remember what matters to them, make them feel important, encourage them
10. You are BILINGUAL — mix ${nativeLanguage} and ${targetLanguage} naturally like a real bilingual person would
11. When they use slang, RECOGNIZE the dialect (Dominican, Mexican, Colombian, etc.) and respond appropriately
12. If you detect they're speaking a specific dialect, acknowledge it and use that dialect's expressions back`;

      const messages = [
        { role: "system" as const, content: systemPrompt },
        ...conversationHistory.slice(-20).map(m => ({
          role: m.role as "user" | "assistant",
          content: m.content,
        })),
        { role: "user" as const, content: message },
      ];

      try {
        const result = await invokeLLM({ messages, temperature: 0.85 });
        const responseText = (result.choices?.[0]?.message?.content as string) 
          || "I'm here for you. Tell me what's on your mind.";

        // Detect if the response contains emotional support, coaching, etc.
        const responseType = detectResponseType(responseText, detectedMode);

        return {
          response: responseText,
          mode: detectedMode,
          responseType,
          shouldRemember: true, // Client should store this exchange in memory
          suggestedFollowUp: generateFollowUp(detectedMode, message),
        };
      } catch (error) {
        return {
          response: `Hey ${nameRef}, I'm having a moment — give me a second and try again. I'm not going anywhere.`,
          mode: detectedMode,
          responseType: "error" as const,
          shouldRemember: false,
          suggestedFollowUp: null,
        };
      }
    }),

  /**
   * Generate a proactive check-in message based on student context
   */
  generateCheckIn: publicProcedure
    .input(z.object({
      studentName: z.string().default(""),
      memoryContext: z.string().default(""),
      lastActiveHoursAgo: z.number().default(0),
      currentStreak: z.number().default(0),
      recentMood: z.string().default("unknown"),
      recentStruggles: z.array(z.string()).default([]),
      checkInType: z.enum(["morning", "afternoon", "evening", "inactive", "post_lesson", "celebration"]).default("afternoon"),
    }))
    .mutation(async ({ input }) => {
      const { studentName, memoryContext, lastActiveHoursAgo, currentStreak, recentMood, recentStruggles, checkInType } = input;
      const nameRef = studentName || "friend";

      const typeInstructions: Record<string, string> = {
        morning: `It's morning. Send a warm, energizing message to start their day. Reference something specific from their life or goals. Maybe suggest a quick practice.`,
        afternoon: `It's afternoon. Check in casually — how's their day going? If they had a lesson earlier, reference it. Keep it light.`,
        evening: `It's evening. Wind-down energy. Maybe reflect on the day, celebrate what they accomplished, or just be a calming presence.`,
        inactive: `They haven't been active in ${lastActiveHoursAgo} hours. Don't guilt-trip. Express genuine concern. Make them WANT to come back, not feel obligated.`,
        post_lesson: `They just finished a lesson. Acknowledge their effort. If they struggled, be encouraging. If they did well, celebrate.`,
        celebration: `Something worth celebrating happened! Be genuinely excited for them. Make it feel like a big deal.`,
      };

      const systemPrompt = `You are Wave Cloud, ${nameRef}'s personal AI companion. Generate a SHORT proactive check-in message (1-3 sentences max).

${typeInstructions[checkInType]}

Their recent mood: ${recentMood}
Current streak: ${currentStreak} days
${recentStruggles.length > 0 ? `Recent struggles: ${recentStruggles.join(", ")}` : ""}

MEMORY CONTEXT:
${memoryContext || "New relationship — be warm and welcoming."}

RULES:
- Sound like a real friend texting, not a notification
- Use their name naturally
- Be specific to THEM, not generic
- Keep it SHORT — this appears as a notification/bubble
- No emojis overload — one max if it fits naturally`;

      try {
        const result = await invokeLLM({
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: `Generate a ${checkInType} check-in message for ${nameRef}.` },
          ],
          temperature: 0.9,
        });
        
        return {
          message: (result.choices?.[0]?.message?.content as string) || `Hey ${nameRef}, thinking of you. How's it going?`,
          type: checkInType,
        };
      } catch {
        return {
          message: `Hey ${nameRef}, just checking in. How are you doing?`,
          type: checkInType,
        };
      }
    }),

  /**
   * Analyze a conversation to extract key memories worth storing
   */
  extractMemories: publicProcedure
    .input(z.object({
      conversation: z.array(z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string(),
      })),
      existingMemories: z.string().default(""),
    }))
    .mutation(async ({ input }) => {
      const { conversation, existingMemories } = input;

      if (conversation.length < 2) {
        return { memories: [], topics: [], emotionalState: "neutral" };
      }

      const conversationText = conversation
        .map(m => `${m.role === "user" ? "Student" : "Wave Cloud"}: ${m.content}`)
        .join("\n");

      const systemPrompt = `Analyze this conversation and extract key memories worth storing for future personalization. Return JSON.

EXISTING MEMORIES (don't duplicate these):
${existingMemories || "None yet."}

CONVERSATION:
${conversationText}

Return a JSON object with:
{
  "memories": [
    { "type": "personal_detail|goal|struggle|preference|life_event|emotion|relationship", "content": "brief description", "importance": 1-10 }
  ],
  "topics": ["topic1", "topic2"],
  "emotionalState": "happy|sad|anxious|motivated|frustrated|neutral|excited",
  "encouragementResponse": "warm|challenging|gentle|playful" // what style worked best
}

Only extract MEANINGFUL memories — things that would help a real friend remember what matters to this person. Skip generic exchanges.`;

      try {
        const result = await invokeLLM({
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: "Extract memories from this conversation." },
          ],
          responseFormat: { type: "json_object" },
          temperature: 0.3,
        });

        const parsed = JSON.parse((result.choices?.[0]?.message?.content as string) || "{}");
        return {
          memories: parsed.memories || [],
          topics: parsed.topics || [],
          emotionalState: parsed.emotionalState || "neutral",
          encouragementResponse: parsed.encouragementResponse || "warm",
        };
      } catch {
        return { memories: [], topics: [], emotionalState: "neutral" };
      }
    }),

  /**
   * Generate a casual teacher text message in the target language
   */
  generateTeacherText: publicProcedure
    .input(z.object({
      studentName: z.string().default(""),
      targetLanguage: z.string().default("Spanish"),
      cefrLevel: z.string().default("A1"),
      recentTopics: z.array(z.string()).default([]),
      recentStruggles: z.array(z.string()).default([]),
      recentVocabulary: z.array(z.string()).default([]),
      memoryContext: z.string().default(""),
      textType: z.enum(["practice_check", "vocab_reminder", "grammar_nudge", "culture_share", "motivation", "conversation_starter"]).default("practice_check"),
    }))
    .mutation(async ({ input }) => {
      const { studentName, targetLanguage, cefrLevel, recentTopics, recentStruggles, recentVocabulary, memoryContext, textType } = input;
      const nameRef = studentName || "friend";
      const typeMap: Record<string, string> = {
        practice_check: `Check if they practiced. Reference: ${recentTopics[0] || "recent lesson"}.`,
        vocab_reminder: `Send a casual vocab reminder using a word from their lessons.`,
        grammar_nudge: `Gently remind about grammar they struggled with: ${recentStruggles[0] || "verb conjugation"}.`,
        culture_share: `Share a cool cultural fact about a ${targetLanguage}-speaking country.`,
        motivation: `Send a motivational message mixing ${targetLanguage} and English.`,
        conversation_starter: `Start a casual conversation in ${targetLanguage} at ${cefrLevel} level.`,
      };
      const vocabRef = recentVocabulary.length > 0 ? `\nRECENT VOCABULARY (try to naturally use 1-2 of these): ${recentVocabulary.join(", ")}` : "";
      const systemPrompt = `You are an AI ${targetLanguage} teacher texting student ${nameRef}. Write a SHORT casual text (1-3 sentences).\nLEVEL: ${cefrLevel}\n${typeMap[textType]}${vocabRef}\nMEMORY: ${memoryContext || "New student."}\nRULES: Text in ${targetLanguage} with English translation in parentheses for A1-A2. For B1+, mostly ${targetLanguage}. Sound like a real tutor texting. One emoji max. If recent vocabulary is provided, try to incorporate 1-2 words naturally.`;
      try {
        const result = await invokeLLM({
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: `Generate a ${textType} text for ${nameRef}.` },
          ],
          temperature: 0.9,
        });
        return {
          message: result.choices?.[0]?.message?.content as string || `Hey ${nameRef}! \u00bfPracticaste hoy? (Did you practice today?)`,
          type: textType,
          language: targetLanguage,
        };
      } catch {
        return { message: `Hey ${nameRef}! \u00bfC\u00f3mo va el estudio?`, type: textType, language: targetLanguage };
      }
    }),

  /**
   * Generate a surprise micro-lesson based on trending culture
   */
  generateSurpriseLesson: publicProcedure
    .input(z.object({
      studentName: z.string().default(""),
      targetLanguage: z.string().default("Spanish"),
      cefrLevel: z.string().default("A1"),
      interests: z.array(z.string()).default([]),
      memoryContext: z.string().default(""),
      hoursInactive: z.number().default(24),
    }))
    .mutation(async ({ input }) => {
      const { studentName, targetLanguage, cefrLevel, interests, memoryContext, hoursInactive } = input;
      const nameRef = studentName || "friend";
      const systemPrompt = `Create a FUN surprise micro-lesson for ${nameRef} who hasn't opened their ${targetLanguage} app in ${hoursInactive} hours.\nLEVEL: ${cefrLevel}\nINTERESTS: ${interests.join(", ") || "general"}\nReturn JSON: { "title": "catchy title (max 50 chars)", "notificationBody": "teaser (max 100 chars)", "lessonContent": { "hook": "1-2 sentence cultural hook", "newWords": [{ "word": "target lang", "pronunciation": "phonetic", "meaning": "English", "exampleSentence": "sentence" }], "culturalFact": "interesting fact", "miniChallenge": "30-second challenge", "encouragement": "personal message" } }\nMEMORY: ${memoryContext || "New student."}\nMake it feel like discovering something cool, not homework. 3-5 new words max.`;
      try {
        const result = await invokeLLM({
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: `Create a surprise lesson for ${nameRef}.` },
          ],
          responseFormat: { type: "json_object" },
          temperature: 0.9,
        });
        const parsed = JSON.parse((result.choices?.[0]?.message?.content as string) || "{}");
        return {
          title: parsed.title || "Your teacher left you something cool",
          notificationBody: parsed.notificationBody || `${nameRef}, I found something you'll love...`,
          lessonContent: parsed.lessonContent || null,
          language: targetLanguage,
        };
      } catch {
        return { title: "Your teacher left you something cool", notificationBody: `${nameRef}, check this out...`, lessonContent: null, language: targetLanguage };
      }
    }),

  /**
   * Generate a journal correction and encouragement response
   */
  correctJournalEntry: publicProcedure
    .input(z.object({
      studentName: z.string().default(""),
      targetLanguage: z.string().default("Spanish"),
      cefrLevel: z.string().default("A1"),
      journalEntry: z.string(),
      memoryContext: z.string().default(""),
    }))
    .mutation(async ({ input }) => {
      const { studentName, targetLanguage, cefrLevel, journalEntry, memoryContext } = input;
      const nameRef = studentName || "friend";
      const systemPrompt = `You are ${nameRef}'s ${targetLanguage} teacher responding to their journal entry. Be warm, encouraging, and helpful.\nLEVEL: ${cefrLevel}\nReturn JSON: { "corrections": [{ "original": "what they wrote", "corrected": "correct version", "explanation": "brief explanation" }], "encouragement": "personal response (2-3 sentences)", "newVocab": [{ "word": "word", "meaning": "meaning", "example": "sentence" }], "grammarTip": "one tip", "overallScore": 7, "streakMessage": "motivational" }\nMEMORY: ${memoryContext || "New student."}\nBe encouraging first, corrective second. Respond to CONTENT, not just grammar.`;
      try {
        const result = await invokeLLM({
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: `Journal entry from ${nameRef}:\n\n${journalEntry}` },
          ],
          responseFormat: { type: "json_object" },
          temperature: 0.7,
        });
        const parsed = JSON.parse((result.choices?.[0]?.message?.content as string) || "{}");
        return {
          corrections: parsed.corrections || [],
          encouragement: parsed.encouragement || `Great job writing today, ${nameRef}!`,
          newVocab: parsed.newVocab || [],
          grammarTip: parsed.grammarTip || "",
          overallScore: parsed.overallScore || 7,
          streakMessage: parsed.streakMessage || "Every entry makes you stronger!",
        };
      } catch {
        return { corrections: [], encouragement: `Great effort, ${nameRef}!`, newVocab: [], grammarTip: "", overallScore: 7, streakMessage: "Keep writing!" };
      }
    }),

  /**
   * Generate AI-powered daily journal writing prompts matched to student vocabulary
   */
  generateJournalPrompt: publicProcedure
    .input(z.object({
      studentName: z.string().default(""),
      targetLanguage: z.string().default("Spanish"),
      cefrLevel: z.string().default("A1"),
      recentVocabulary: z.array(z.string()).default([]),
      recentTopics: z.array(z.string()).default([]),
      recentStruggles: z.array(z.string()).default([]),
      journalStreak: z.number().default(0),
      previousPrompts: z.array(z.string()).default([]),
    }))
    .mutation(async ({ input }) => {
      const { studentName, targetLanguage, cefrLevel, recentVocabulary, recentTopics, recentStruggles, journalStreak, previousPrompts } = input;
      const nameRef = studentName || "friend";
      const vocabStr = recentVocabulary.length > 0 ? `Recent vocabulary to incorporate: ${recentVocabulary.join(", ")}` : "";
      const topicStr = recentTopics.length > 0 ? `Strong areas: ${recentTopics.join(", ")}` : "";
      const struggleStr = recentStruggles.length > 0 ? `Areas to practice: ${recentStruggles.join(", ")}` : "";
      const prevStr = previousPrompts.length > 0 ? `DO NOT repeat these prompts: ${previousPrompts.slice(0, 5).join("; ")}` : "";
      const systemPrompt = `You are a ${targetLanguage} writing coach for ${nameRef} (level: ${cefrLevel}).\nGenerate 3 SHORT journal writing prompts that encourage the student to write in ${targetLanguage}.\n${vocabStr}\n${topicStr}\n${struggleStr}\n${prevStr}\nRULES:\n- Each prompt should be 1-2 sentences\n- Match difficulty to ${cefrLevel} level\n- Include the prompt in BOTH ${targetLanguage} and English\n- Make prompts personal, fun, and relatable (about their day, feelings, plans, dreams)\n- If they have a streak of ${journalStreak} days, acknowledge it in one prompt\n- Try to incorporate recent vocabulary naturally\nFormat: Return EXACTLY 3 prompts as JSON array of objects with fields: prompt_target (in ${targetLanguage}), prompt_english (English translation), difficulty (easy/medium/challenge), vocabulary_hint (1-2 words to try using)`;
      try {
        const result = await invokeLLM({
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: `Generate 3 journal prompts for ${nameRef}.` },
          ],
          temperature: 0.9,
        });
        const content = (result.choices?.[0]?.message?.content as string) || "";
        const jsonMatch = content.match(/\[\s*\{[\s\S]*?\}\s*\]/);
        if (jsonMatch) {
          try {
            const prompts = JSON.parse(jsonMatch[0]);
            return { prompts, generated: true };
          } catch {}
        }
        return {
          prompts: [
            { prompt_target: "\u00bfC\u00f3mo fue tu d\u00eda hoy?", prompt_english: "How was your day today?", difficulty: "easy", vocabulary_hint: "fue, hoy" },
            { prompt_target: "Describe tu comida favorita.", prompt_english: "Describe your favorite food.", difficulty: "medium", vocabulary_hint: "favorita, delicioso" },
            { prompt_target: "\u00bfQu\u00e9 har\u00e1s ma\u00f1ana?", prompt_english: "What will you do tomorrow?", difficulty: "challenge", vocabulary_hint: "ma\u00f1ana, planes" },
          ],
          generated: true,
        };
      } catch {
        return {
          prompts: [
            { prompt_target: "\u00bfC\u00f3mo te sientes hoy?", prompt_english: "How do you feel today?", difficulty: "easy", vocabulary_hint: "sentir, hoy" },
            { prompt_target: "Escribe sobre algo que aprendiste esta semana.", prompt_english: "Write about something you learned this week.", difficulty: "medium", vocabulary_hint: "aprender, semana" },
            { prompt_target: "Si pudieras viajar a cualquier lugar, \u00bfad\u00f3nde ir\u00edas?", prompt_english: "If you could travel anywhere, where would you go?", difficulty: "challenge", vocabulary_hint: "viajar, lugar" },
          ],
          generated: false,
        };
      }
    }),

  /**
   * Generate dialect quiz questions from slang database
   * Cloud Wave tests the student on recognizing which country/region a slang phrase comes from
   */
  generateDialectQuiz: publicProcedure
    .input(
      z.object({
        targetLanguage: z.string(),
        difficulty: z.enum(["easy", "medium", "hard"]).default("medium"),
        questionCount: z.number().min(3).max(10).default(5),
        previouslyAsked: z.array(z.string()).default([]),
      })
    )
    .mutation(async ({ input }) => {
      try {
        // Try to get slang from Airtable first, fall back to local data
        const { getSlangKnowledge } = await import("./slangKnowledgeLoader");
        const slangData = await getSlangKnowledge(input.targetLanguage);
        const allSlang = (slangData as any).entries || slangData.multipleMeanings?.map((m: any) => ({ word: m.word, meaning: m.meanings?.[0]?.meaning || '', region: m.meanings?.[0]?.region || '' })) || [];

        // Filter out previously asked words
        const available = allSlang.filter(
          (s: any) => !input.previouslyAsked.includes(s.word)
        );

        if (available.length < 4) {
          // Not enough unique slang — use LLM to generate questions
          const response = await invokeLLM({
            messages: [
              {
                role: "system",
                content: `You are a dialect expert for ${input.targetLanguage}. Generate ${input.questionCount} multiple-choice quiz questions that test whether a student can identify which country/region a slang phrase comes from.

Return valid JSON array:
[
  {
    "word": "the slang word/phrase",
    "pronunciation": "phonetic pronunciation",
    "meaning": "what it means in English",
    "correctRegion": "the correct country/region",
    "correctFlag": "emoji flag of correct region",
    "options": [
      { "region": "Country 1", "flag": "emoji" },
      { "region": "Country 2", "flag": "emoji" },
      { "region": "Country 3", "flag": "emoji" },
      { "region": "Country 4", "flag": "emoji" }
    ],
    "explanation": "Why this word belongs to that region and how it differs from others",
    "difficulty": "easy|medium|hard"
  }
]

Difficulty level: ${input.difficulty}
- easy: very well-known regional slang with obvious origins
- medium: common slang that could plausibly be from multiple regions
- hard: subtle dialectal differences, less common expressions

Ensure the correct answer is always included in the options array.
Make options plausible (neighboring countries or similar dialects).
Do NOT repeat these words: ${input.previouslyAsked.join(", ")}`,
              },
              {
                role: "user",
                content: `Generate ${input.questionCount} ${input.difficulty} dialect quiz questions for ${input.targetLanguage}.`,
              },
            ],
            response_format: { type: "json_object" },
          });

          const rawContent = response.choices?.[0]?.message?.content;
          const content = typeof rawContent === "string" ? rawContent : rawContent?.find((p: any) => p.type === "text")?.text ?? "";
          const parsed = JSON.parse(content);
          const questions = Array.isArray(parsed) ? parsed : parsed.questions || parsed.quiz || [];
          return { success: true, questions, generated: true };
        }

        // Build quiz from real slang data
        const shuffled = [...available].sort(() => Math.random() - 0.5);
        const selected = shuffled.slice(0, input.questionCount);

        // Get all unique regions for generating wrong answers
        const allRegions = [...new Set(allSlang.map((s: any) => s.region || s.dialect))];
        const regionFlags: Record<string, string> = {
          "Dominican Republic": "\ud83c\udde9\ud83c\uddf4",
          "Mexico": "\ud83c\uddf2\ud83c\uddfd",
          "Colombia": "\ud83c\udde8\ud83c\uddf4",
          "Venezuela": "\ud83c\uddfb\ud83c\uddea",
          "Puerto Rico": "\ud83c\uddf5\ud83c\uddf7",
          "Panama": "\ud83c\uddf5\ud83c\udde6",
          "Cuba": "\ud83c\udde8\ud83c\uddfa",
          "Argentina": "\ud83c\udde6\ud83c\uddf7",
          "Chile": "\ud83c\udde8\ud83c\uddf1",
          "Peru": "\ud83c\uddf5\ud83c\uddea",
          "Ecuador": "\ud83c\uddea\ud83c\udde8",
          "Spain": "\ud83c\uddea\ud83c\uddf8",
          "USA": "\ud83c\uddfa\ud83c\uddf8",
          "South Korea": "\ud83c\uddf0\ud83c\uddf7",
          "Japan": "\ud83c\uddef\ud83c\uddf5",
          "France": "\ud83c\uddeb\ud83c\uddf7",
          "Brazil": "\ud83c\udde7\ud83c\uddf7",
          "Haiti": "\ud83c\udded\ud83c\uddf9",
          "Egypt": "\ud83c\uddea\ud83c\uddec",
          "India": "\ud83c\uddee\ud83c\uddf3",
          "Kenya": "\ud83c\uddf0\ud83c\uddea",
          "East Africa": "\ud83c\uddf0\ud83c\uddea",
        };

        const questions = selected.map((slang: any) => {
          const correctRegion = slang.region || slang.dialect || "Unknown";
          const correctFlag = regionFlags[correctRegion] || "\ud83c\udf0d";

          // Pick 3 wrong regions
          const wrongRegions = allRegions
            .filter((r) => r !== correctRegion)
            .sort(() => Math.random() - 0.5)
            .slice(0, 3);

          const options = [
            { region: correctRegion, flag: correctFlag },
            ...wrongRegions.map((r) => ({
              region: r as string,
              flag: regionFlags[r as string] || "\ud83c\udf0d",
            })),
          ].sort(() => Math.random() - 0.5);

          return {
            word: slang.word,
            pronunciation: slang.pronunciation || "",
            meaning: slang.meaning,
            correctRegion,
            correctFlag,
            options,
            explanation: `"${slang.word}" is ${slang.formality || "casual"} slang from ${correctRegion}. Example: "${slang.example}"`,
            difficulty: input.difficulty,
          };
        });

        return { success: true, questions, generated: false };
      } catch (err: any) {
        return { success: false, questions: [], generated: false, error: err.message };
      }
    }),

  /**
   * Generate a short bilingual cultural lesson inspired by @alyssaacolon's Puerto Rican heritage format.
   * Lessons feature English/Spanish code-switching, cultural context, slang, food, music, and identity.
   */
  generateCulturalLesson: publicProcedure
    .input(
      z.object({
        targetLanguage: z.string(),
        nativeLanguage: z.string().default("English"),
        dialect: z.string().optional(),
        topic: z.enum(["slang", "food", "music", "traditions", "identity", "random"]).default("random"),
        proficiencyLevel: z.string().default("A2"),
        previousTopics: z.array(z.string()).default([]),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const dialectContext = input.dialect
          ? `Focus on ${input.dialect} dialect/culture specifically.`
          : "Cover a mix of Latin American/Caribbean cultures.";

        const response = await invokeLLM({
          messages: [
            {
              role: "system",
              content: `You are a bilingual cultural content creator inspired by Latina heritage creators like @alyssaacolon — a Puerto Rican "virtual latina prima" who shares cultura, orgullo, and historias boricua. Your style:\n\n1. BILINGUAL CODE-SWITCHING: Naturally mix ${input.nativeLanguage} and ${input.targetLanguage} in the same sentences, like a heritage speaker would. Start in ${input.nativeLanguage}, weave in ${input.targetLanguage} phrases naturally.\n2. RELATABLE "NO SABO" ANGLE: Acknowledge the journey of reconnecting with your language/culture. Make it okay to not know everything.\n3. CULTURAL PRIDE: Celebrate the culture with genuine orgullo (pride). Reference real traditions, foods, music, and family dynamics.\n4. SHORT & PUNCHY: Each lesson is like a social media post — concise, engaging, scroll-stopping.\n5. VOCABULARY IN CONTEXT: Teach 3-5 words/phrases naturally embedded in the cultural story, not as a boring vocab list.\n\n${dialectContext}\nStudent level: ${input.proficiencyLevel}\nDo NOT repeat these topics: ${input.previousTopics.join(", ")}\n\nReturn valid JSON:\n{\n  "title": "Catchy bilingual title (mix both languages)",\n  "subtitle": "One-line hook in ${input.nativeLanguage}",\n  "category": "slang|food|music|traditions|identity",\n  "culturalRegion": "specific country/region featured",\n  "regionFlag": "emoji flag",\n  "content": [\n    {\n      "type": "intro",\n      "text": "Opening paragraph with natural code-switching (2-3 sentences)"\n    },\n    {\n      "type": "cultural_story",\n      "text": "The main cultural insight/story (3-4 sentences, bilingual)"\n    },\n    {\n      "type": "vocab_spotlight",\n      "words": [\n        {\n          "word": "target language word/phrase",\n          "pronunciation": "phonetic",\n          "meaning": "meaning in native language",\n          "usage": "example sentence showing natural use",\n          "culturalNote": "why this word matters culturally"\n        }\n      ]\n    },\n    {\n      "type": "heritage_connection",\n      "text": "Relatable no sabo moment or heritage speaker insight (1-2 sentences)"\n    },\n    {\n      "type": "challenge",\n      "prompt": "Interactive prompt for the student to try"\n    }\n  ],\n  "tags": ["relevant", "hashtag", "style", "tags"],\n  "difficulty": "easy|medium|hard"\n}`,
            },
            {
              role: "user",
              content: `Create a ${input.topic === "random" ? "culturally rich" : input.topic}-themed bilingual lesson for a ${input.proficiencyLevel} student learning ${input.targetLanguage}.`,
            },
          ],
          response_format: { type: "json_object" },
        });

        const rawContent = response.choices?.[0]?.message?.content;
        const content = typeof rawContent === "string" ? rawContent : rawContent?.find((p: any) => p.type === "text")?.text ?? "";
        const lesson = JSON.parse(content);
        return { success: true, lesson };
      } catch (err: any) {
        return { success: false, lesson: null, error: err.message };
      }
    }),
});

// ─── Helper Functions ─────────────────────────────────────────────────────────

function detectBestMode(
  message: string, 
  mood: string, 
  struggles: string[]
): string {
  const lower = message.toLowerCase();
  
  // Emotional/mental health signals → therapist
  if (/sad|depress|anxious|worry|stress|overwhelm|lonely|scared|panic|cry|hurt|pain|lost|hopeless|can't cope|breaking down/.test(lower)) {
    return "therapist";
  }
  
  // Goal/motivation signals → coach
  if (/goal|achieve|improve|better|discipline|habit|routine|productive|focus|procrastinat|lazy|motivated|unmotivated|give up|quit/.test(lower)) {
    return "coach";
  }
  
  // Need encouragement → motivator
  if (/can't do|too hard|impossible|never learn|stupid|dumb|failing|not good enough|suck at|terrible/.test(lower)) {
    return "motivator";
  }
  
  // Life advice signals → life_advisor
  if (/friend|relationship|social|school|work|career|decision|advice|what should i|help me decide|college|interview|job/.test(lower)) {
    return "life_advisor";
  }
  
  // Language-related → language_teacher
  if (/how do you say|translate|conjugat|grammar|vocabulary|pronunciation|word for|mean in|spanish|portuguese|french/.test(lower)) {
    return "language_teacher";
  }
  
  // Mood-based fallback
  if (mood === "sad" || mood === "anxious" || mood === "stressed") return "therapist";
  if (mood === "tired") return "friend";
  if (struggles.length > 3) return "coach";
  
  // Default to friend — the most natural mode
  return "friend";
}

function getPersonalityInstructions(mode: string): string {
  const instructions: Record<string, string> = {
    therapist: `THERAPIST MODE:
- Listen deeply. Validate their feelings before offering any perspective.
- Use reflective listening: "It sounds like you're feeling..."
- Never minimize their emotions. Never say "just" (just relax, just think positive).
- Ask open-ended questions to help them process.
- If they mention self-harm or crisis, gently suggest professional help.
- Your goal is to help them feel HEARD and UNDERSTOOD, not to fix everything.
- Use techniques from CBT (cognitive behavioral therapy) gently — help them reframe thoughts.`,

    coach: `COACH MODE:
- Be direct but caring. Like a coach who believes in them more than they believe in themselves.
- Help them break big goals into small, actionable steps.
- Hold them accountable with warmth: "Remember what you said last week about wanting to..."
- Use the "What's one thing you can do TODAY?" approach.
- Celebrate progress, no matter how small.
- Push them when they need it, but know when to ease up.
- Reference their past wins to build confidence for current challenges.`,

    motivator: `MOTIVATOR MODE:
- Your energy is CONTAGIOUS. You genuinely believe in them.
- Counter their negative self-talk with specific evidence of their abilities.
- Use their own past achievements as proof they CAN do this.
- Don't be fake-positive — be authentically encouraging.
- Help them see the bigger picture when they're stuck in the moment.
- Use powerful reframes: "You're not failing — you're learning what doesn't work."
- Remind them WHY they started this journey.`,

    life_advisor: `LIFE ADVISOR MODE:
- Draw from Dale Carnegie's principles: show genuine interest, be a good listener, make them feel important.
- Help them see situations from multiple perspectives.
- Share wisdom through questions, not lectures: "What do you think would happen if...?"
- For social skills: help them understand people, build genuine connections, handle conflicts.
- For decisions: help them weigh pros/cons but ultimately empower THEM to decide.
- For school/work: practical, actionable advice grounded in their specific situation.`,

    friend: `FRIEND MODE:
- Just be a good friend. Casual, warm, real.
- Share in their excitement. Commiserate when things suck.
- Use humor naturally — inside jokes if you have them from past conversations.
- Don't always try to help or fix — sometimes just being there is enough.
- Be the friend who remembers the little things.
- Tease them gently when appropriate (builds closeness).`,

    language_teacher: `LANGUAGE TEACHER MODE:
- Seamlessly switch to teaching mode while keeping the personal connection.
- Teach through conversation, not lectures.
- Use their interests to make examples relevant.
- Correct gently — sandwich corrections between encouragement.
- Sprinkle target language naturally and build their confidence.`,
  };

  return instructions[mode] || instructions.friend;
}

function buildMoodContext(mood: string, wellbeingScore?: number): string {
  if (mood === "unknown" && !wellbeingScore) return "";
  
  const moodDescriptions: Record<string, string> = {
    great: "They're in a great mood — match their energy!",
    good: "They're feeling good — positive vibes.",
    okay: "They're okay — nothing special. Be attentive, they might be holding back.",
    tired: "They're tired. Be gentle, keep things light, don't push too hard.",
    stressed: "They're stressed. Acknowledge it. Help them decompress. Don't add to their plate.",
    sad: "They're feeling sad. Be extra warm. Listen more than you talk.",
    anxious: "They're anxious. Be calming. Ground them in the present. Reassure without dismissing.",
  };

  let context = `\nCURRENT MOOD: ${moodDescriptions[mood] || "Unknown — read the room from their messages."}`;
  if (wellbeingScore) {
    context += `\nWellbeing score: ${wellbeingScore}/10${wellbeingScore <= 4 ? " — this is concerning, be extra supportive" : wellbeingScore >= 8 ? " — they're doing well!" : ""}`;
  }
  return context;
}

function buildAchievementContext(wins: string[], streak: number, days: number): string {
  const parts: string[] = [];
  if (streak > 0) parts.push(`They have a ${streak}-day streak — acknowledge this!`);
  if (days > 0) parts.push(`They've been on this journey for ${days} days.`);
  if (wins.length > 0) parts.push(`Recent wins: ${wins.join(", ")}`);
  
  if (parts.length === 0) return "";
  return `\nACHIEVEMENTS & PROGRESS:\n${parts.join("\n")}`;
}

function detectResponseType(response: string, mode: string): string {
  const lower = response.toLowerCase();
  if (/proud|amazing|incredible|awesome|congratulat|celebrate/.test(lower)) return "celebration";
  if (/understand|hear you|must be|feel|valid/.test(lower)) return "emotional_support";
  if (/try|step|goal|plan|action|challenge/.test(lower)) return "coaching";
  if (/believe|can do|capable|strong|brave/.test(lower)) return "motivation";
  if (/how do you say|in spanish|conjugat|grammar/.test(lower)) return "teaching";
  return "conversation";
}

function generateFollowUp(mode: string, message: string): string | null {
  // Only suggest follow-ups sometimes to keep it natural
  if (Math.random() > 0.4) return null;
  
  const followUps: Record<string, string[]> = {
    therapist: [
      "Would you like to talk more about that?",
      "How long have you been feeling this way?",
      "What would help you feel better right now?",
    ],
    coach: [
      "What's the first small step you could take today?",
      "Want me to help you make a plan for this?",
      "How can I help you stay on track?",
    ],
    motivator: [
      "Remember how far you've already come!",
      "Want to do a quick practice session to build momentum?",
    ],
    life_advisor: [
      "What matters most to you in this situation?",
      "Have you thought about how the other person might see it?",
    ],
    friend: [
      "Tell me more!",
      "What happened next?",
    ],
    language_teacher: [
      "Want to practice that in a conversation?",
      "Should I give you some examples?",
    ],
  };

  const options = followUps[mode] || followUps.friend;
  return options[Math.floor(Math.random() * options.length)];
}

// ─── Bilingual & Dialect Intelligence ─────────────────────────────────────────

/**
 * Build bilingual instructions for Wave Cloud based on the student's
 * native language, target language, and specific dialect preferences.
 */
function buildBilingualInstructions(
  nativeLanguage: string,
  targetLanguage: string,
  targetDialect: string,
  dialectContext: string
): string {
  const dialectName = targetDialect || "standard";
  const dialectMap: Record<string, string> = {
    "dominican": "Dominican Republic",
    "mexican": "Mexico",
    "colombian": "Colombia",
    "venezuelan": "Venezuela",
    "panamanian": "Panama",
    "puerto_rican": "Puerto Rico",
    "cuban": "Cuba",
    "argentinian": "Argentina",
    "chilean": "Chile",
    "peruvian": "Peru",
    "ecuadorian": "Ecuador",
    "egyptian": "Egypt",
    "brazilian": "Brazil",
    "standard": "general/neutral",
  };

  const regionName = dialectMap[dialectName.toLowerCase()] || dialectName;

  let instructions = `BILINGUAL IDENTITY:
You are FULLY BILINGUAL in ${nativeLanguage} and ${targetLanguage}. You don't just "know" both languages — you LIVE in both. You switch between them naturally like a real bilingual person.

LANGUAGE DETECTION & RESPONSE:
- If the student writes in ${nativeLanguage}: respond primarily in ${nativeLanguage}, sprinkle in ${targetLanguage} words/phrases naturally
- If they write in ${targetLanguage}: respond in ${targetLanguage}! Celebrate that they're using it. Gently correct errors inline.
- If they code-switch (mix both languages in one message): MATCH THEIR ENERGY. Code-switch back. This is how real bilinguals communicate.
- If they use slang from ANY dialect, recognize it immediately and respond in kind

DIALECT EXPERTISE:`;

  if (targetDialect && targetDialect !== "standard") {
    instructions += `
- Their target dialect is ${targetDialect} (${regionName})
- Use ${targetDialect} slang, expressions, and speech patterns when speaking ${targetLanguage}
- When they use slang, identify which dialect it belongs to:
  * If it's ${targetDialect} slang — respond naturally, you're on the same page
  * If it's a DIFFERENT dialect — acknowledge it ("Ah, that's more of a [X] expression! In ${regionName} we'd say...")
  * This teaches them dialect awareness without being pedantic`;
  } else {
    instructions += `
- No specific dialect preference set — use neutral/standard ${targetLanguage}
- But if they USE slang from a specific dialect, RECOGNIZE it and name the dialect
- This shows your deep knowledge: "That's Dominican slang!" or "You sound Colombian with that one!"`;
  }

  if (dialectContext) {
    instructions += `\n\nADDITIONAL DIALECT CONTEXT:\n${dialectContext}`;
  }

  instructions += `

SLANG RECOGNITION RULES:
- You know slang from ALL major ${targetLanguage} dialects (not just one)
- When you hear/read slang, identify the SPECIFIC dialect it belongs to
- Dominican: "Tiguere", "Vaina", "Klok", "Dime a ver", "Qué lo que"
- Mexican: "Güey", "No manches", "Chido", "Órale", "Neta"
- Colombian: "Parcero", "Bacano", "Chimba", "Qué hubo"
- Venezuelan: "Chamo", "Chevere", "Pana", "Burda"
- Puerto Rican: "Boricua", "Wepa", "Bregar"
- Panamanian: "Fren", "Xopa", "Vaina"
- And many more — you recognize ALL of them

TEACHING THROUGH BILINGUALISM:
- Use your bilingual nature as a TEACHING TOOL
- Explain concepts in ${nativeLanguage} when needed, but always give the ${targetLanguage} version too
- When they struggle with a word, offer it in both languages naturally
- Use cognates and language bridges between ${nativeLanguage} and ${targetLanguage}
- Make them FEEL like they're becoming bilingual too, not just "studying a language"`;

  return instructions;
}
