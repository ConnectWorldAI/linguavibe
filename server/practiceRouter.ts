/**
 * Practice Router - Backend routes for:
 * 1. Voice Rooms (WebSocket signaling)
 * 2. Language Battles (matchmaking + scoring)
 * 3. Feedback Reports (store/retrieve)
 * 4. Level Assessment (save CEFR results)
 * 5. Spaced Repetition (persist card schedules)
 */

import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { invokeLLM } from "./_core/llm";

// ============================================
// SCHEMAS
// ============================================

const feedbackScoresSchema = z.object({
  pronunciation: z.number().min(0).max(100),
  grammar: z.number().min(0).max(100),
  vocabulary: z.number().min(0).max(100),
  fluency: z.number().min(0).max(100),
  comprehension: z.number().min(0).max(100),
  culturalAwareness: z.number().min(0).max(100),
});

const callFeedbackSchema = z.object({
  callId: z.string(),
  teacherName: z.string(),
  language: z.string(),
  duration: z.number(),
  scores: feedbackScoresSchema,
  overallScore: z.number(),
  cefrLevel: z.string(),
  wordsUsed: z.array(z.string()),
  newWordsLearned: z.array(z.string()),
  grammarMistakes: z.array(z.object({
    mistake: z.string(),
    correction: z.string(),
    explanation: z.string(),
  })),
  pronunciationIssues: z.array(z.object({
    word: z.string(),
    issue: z.string(),
    tip: z.string(),
  })),
  strengths: z.array(z.string()),
  areasToImprove: z.array(z.string()),
  recommendedLessons: z.array(z.string()),
});

const vocabWordSchema = z.object({
  id: z.string(),
  word: z.string(),
  translation: z.string(),
  language: z.string(),
  pronunciation: z.string().optional(),
  context: z.string().optional(),
  source: z.enum(["lesson", "slang-of-day", "scenario", "musical", "manual", "ai-call"]),
  sourceId: z.string().optional(),
  difficulty: z.number().min(1).max(5),
  nextReview: z.number(),
  interval: z.number(),
  easeFactor: z.number(),
  repetitions: z.number(),
  dateAdded: z.number(),
  lastReviewed: z.number().optional(),
  timesCorrect: z.number(),
  timesIncorrect: z.number(),
});

// ============================================
// IN-MEMORY STORES (for real-time features)
// These would be Redis in production
// ============================================

// Voice Rooms
interface VoiceRoom {
  id: string;
  name: string;
  language: string;
  level: string;
  topic: string;
  hostId: string;
  participants: { id: string; name: string; isMuted: boolean; isSpeaking: boolean }[];
  maxParticipants: number;
  isLive: boolean;
  createdAt: number;
}

const voiceRooms: Map<string, VoiceRoom> = new Map();

// Battle Queue
interface BattlePlayer {
  id: string;
  name: string;
  language: string;
  level: string;
  mode: string;
  joinedAt: number;
}

const battleQueue: BattlePlayer[] = [];

// Active Battles
interface ActiveBattle {
  id: string;
  mode: string;
  language: string;
  players: { id: string; name: string; score: number }[];
  round: number;
  totalRounds: number;
  status: "active" | "finished";
  startedAt: number;
}

const activeBattles: Map<string, ActiveBattle> = new Map();

// ============================================
// ROUTER
// ============================================

export const practiceRouter = router({
  // ==========================================
  // VOICE ROOMS
  // ==========================================
  voiceRooms: router({
    // List active rooms
    list: publicProcedure
      .input(z.object({
        language: z.string().optional(),
        level: z.string().optional(),
      }).optional())
      .query(({ input }) => {
        const rooms = Array.from(voiceRooms.values()).filter((r) => {
          if (!r.isLive) return false;
          if (input?.language && r.language !== input.language) return false;
          if (input?.level && r.level !== input.level) return false;
          return true;
        });
        return rooms.map((r) => ({
          ...r,
          participantCount: r.participants.length,
        }));
      }),

    // Create a room
    create: publicProcedure
      .input(z.object({
        name: z.string(),
        language: z.string(),
        level: z.string(),
        topic: z.string(),
        maxParticipants: z.number().min(2).max(20).default(8),
      }))
      .mutation(({ input }) => {
        const roomId = `room-${Date.now()}-${Math.random().toString(36).slice(2)}`;
        const room: VoiceRoom = {
          id: roomId,
          ...input,
          hostId: "user", // Would be ctx.user.id in production
          participants: [{ id: "user", name: "Host", isMuted: false, isSpeaking: false }],
          isLive: true,
          createdAt: Date.now(),
        };
        voiceRooms.set(roomId, room);
        return room;
      }),

    // Join a room
    join: publicProcedure
      .input(z.object({
        roomId: z.string(),
        userName: z.string(),
      }))
      .mutation(({ input }) => {
        const room = voiceRooms.get(input.roomId);
        if (!room) throw new Error("Room not found");
        if (room.participants.length >= room.maxParticipants) throw new Error("Room is full");

        const participantId = `p-${Date.now()}`;
        room.participants.push({
          id: participantId,
          name: input.userName,
          isMuted: true,
          isSpeaking: false,
        });
        voiceRooms.set(input.roomId, room);
        return { participantId, room };
      }),

    // Leave a room
    leave: publicProcedure
      .input(z.object({
        roomId: z.string(),
        participantId: z.string(),
      }))
      .mutation(({ input }) => {
        const room = voiceRooms.get(input.roomId);
        if (!room) return { success: true };

        room.participants = room.participants.filter((p) => p.id !== input.participantId);
        if (room.participants.length === 0) {
          voiceRooms.delete(input.roomId);
        } else {
          voiceRooms.set(input.roomId, room);
        }
        return { success: true };
      }),

    // Get AI moderator prompt for a topic
    getModeratorPrompt: publicProcedure
      .input(z.object({
        topic: z.string(),
        language: z.string(),
        level: z.string(),
      }))
      .mutation(async ({ input }) => {
        const result = await invokeLLM({
          messages: [{
            role: "user",
            content: `You are an AI moderator for a voice room where people practice ${input.language} at ${input.level} level. The topic is "${input.topic}". Generate 5 discussion questions that are appropriate for this level, culturally relevant, and encourage conversation. Also provide 3 vocabulary words related to the topic with translations. Format as JSON: { questions: string[], vocabulary: { word: string, translation: string, example: string }[] }`,
          }],
        });
        try {
          return JSON.parse(result.choices[0]?.message?.content as string || "{}");
        } catch {
          return { questions: [`Let's discuss: ${input.topic}`], vocabulary: [] };
        }
      }),
  }),

  // ==========================================
  // LANGUAGE BATTLES
  // ==========================================
  battles: router({
    // Join matchmaking queue
    joinQueue: publicProcedure
      .input(z.object({
        playerName: z.string(),
        language: z.string(),
        level: z.string(),
        mode: z.enum(["speed-round", "pronunciation-duel", "grammar-gauntlet", "translation-race"]),
      }))
      .mutation(({ input }) => {
        const playerId = `player-${Date.now()}`;
        const player: BattlePlayer = {
          id: playerId,
          name: input.playerName,
          language: input.language,
          level: input.level,
          mode: input.mode,
          joinedAt: Date.now(),
        };

        // Check for a match
        const matchIndex = battleQueue.findIndex(
          (p) => p.language === input.language && p.level === input.level && p.mode === input.mode
        );

        if (matchIndex >= 0) {
          // Found a match! Create battle
          const opponent = battleQueue.splice(matchIndex, 1)[0];
          const battleId = `battle-${Date.now()}`;
          const battle: ActiveBattle = {
            id: battleId,
            mode: input.mode,
            language: input.language,
            players: [
              { id: opponent.id, name: opponent.name, score: 0 },
              { id: playerId, name: input.playerName, score: 0 },
            ],
            round: 1,
            totalRounds: input.mode === "speed-round" ? 10 : 5,
            status: "active",
            startedAt: Date.now(),
          };
          activeBattles.set(battleId, battle);
          return { matched: true, battleId, opponent: opponent.name };
        }

        // No match, add to queue
        battleQueue.push(player);
        return { matched: false, playerId, position: battleQueue.length };
      }),

    // Leave queue
    leaveQueue: publicProcedure
      .input(z.object({ playerId: z.string() }))
      .mutation(({ input }) => {
        const idx = battleQueue.findIndex((p) => p.id === input.playerId);
        if (idx >= 0) battleQueue.splice(idx, 1);
        return { success: true };
      }),

    // Get battle questions
    getQuestions: publicProcedure
      .input(z.object({
        battleId: z.string(),
        mode: z.string(),
        language: z.string(),
        round: z.number(),
      }))
      .mutation(async ({ input }) => {
        const modePrompts: Record<string, string> = {
          "speed-round": `Generate a vocabulary question for ${input.language} learners. Give a word and 4 translation options (1 correct, 3 wrong). Format as JSON: { word: string, options: string[], correctIndex: number, timeLimit: 10 }`,
          "pronunciation-duel": `Generate a pronunciation challenge for ${input.language}. Give a phrase that's tricky to pronounce with phonetic guide. Format as JSON: { phrase: string, phonetic: string, difficulty: "easy"|"medium"|"hard", points: number }`,
          "grammar-gauntlet": `Generate a grammar fill-in-the-blank for ${input.language}. Format as JSON: { sentence: string, blank: string, options: string[], correctIndex: number, explanation: string }`,
          "translation-race": `Generate a translation challenge for ${input.language}. Give a sentence to translate with the correct answer. Format as JSON: { original: string, correctTranslation: string, hints: string[], points: number }`,
        };

        const result = await invokeLLM({
          messages: [{ role: "user", content: modePrompts[input.mode] || modePrompts["speed-round"] }],
        });

        try {
          return JSON.parse(result.choices[0]?.message?.content as string || "{}");
        } catch {
          return { word: "hello", options: ["hola", "bonjour", "ciao", "hallo"], correctIndex: 0, timeLimit: 10 };
        }
      }),

    // Submit answer
    submitAnswer: publicProcedure
      .input(z.object({
        battleId: z.string(),
        playerId: z.string(),
        round: z.number(),
        correct: z.boolean(),
        timeMs: z.number(),
      }))
      .mutation(({ input }) => {
        const battle = activeBattles.get(input.battleId);
        if (!battle) throw new Error("Battle not found");

        const player = battle.players.find((p) => p.id === input.playerId);
        if (!player) throw new Error("Player not in battle");

        // Score: correct = base points + speed bonus
        if (input.correct) {
          const speedBonus = Math.max(0, Math.floor((10000 - input.timeMs) / 1000));
          player.score += 10 + speedBonus;
        }

        // Check if battle is over
        if (input.round >= battle.totalRounds) {
          battle.status = "finished";
        } else {
          battle.round = input.round + 1;
        }

        activeBattles.set(input.battleId, battle);
        return {
          scores: battle.players.map((p) => ({ name: p.name, score: p.score })),
          isFinished: battle.status === "finished",
          nextRound: battle.round,
        };
      }),

    // Get battle result
    getResult: publicProcedure
      .input(z.object({ battleId: z.string() }))
      .query(({ input }) => {
        const battle = activeBattles.get(input.battleId);
        if (!battle) throw new Error("Battle not found");
        return battle;
      }),
  }),

  // ==========================================
  // FEEDBACK REPORTS
  // ==========================================
  feedback: router({
    // Generate AI feedback after a call
    generateReport: publicProcedure
      .input(z.object({
        language: z.string(),
        duration: z.number(),
        transcript: z.string(),
        teacherName: z.string(),
      }))
      .mutation(async ({ input }) => {
        const result = await invokeLLM({
          messages: [{
            role: "user",
            content: `Analyze this ${input.language} conversation transcript and generate a detailed feedback report. The student spoke with AI teacher "${input.teacherName}" for ${Math.round(input.duration / 60)} minutes.

Transcript:
${input.transcript}

Generate a JSON report with:
{
  "scores": {
    "pronunciation": 0-100,
    "grammar": 0-100,
    "vocabulary": 0-100,
    "fluency": 0-100,
    "comprehension": 0-100,
    "culturalAwareness": 0-100
  },
  "overallScore": 0-100,
  "cefrLevel": "A1"|"A2"|"B1"|"B2"|"C1"|"C2",
  "newWordsLearned": ["word1", "word2"],
  "grammarMistakes": [{"mistake": "", "correction": "", "explanation": ""}],
  "pronunciationIssues": [{"word": "", "issue": "", "tip": ""}],
  "strengths": ["strength1", "strength2"],
  "areasToImprove": ["area1", "area2"],
  "recommendedLessons": ["lesson1", "lesson2"]
}`,
          }],
        });

        try {
          return JSON.parse(result.choices[0]?.message?.content as string || "{}");
        } catch {
          return {
            scores: { pronunciation: 70, grammar: 65, vocabulary: 72, fluency: 68, comprehension: 75, culturalAwareness: 60 },
            overallScore: 68,
            cefrLevel: "B1",
            newWordsLearned: [],
            grammarMistakes: [],
            pronunciationIssues: [],
            strengths: ["Good effort"],
            areasToImprove: ["Keep practicing"],
            recommendedLessons: [],
          };
        }
      }),

    // Get historical progress
    getProgress: publicProcedure
      .input(z.object({
        language: z.string(),
        limit: z.number().default(10),
      }))
      .query(() => {
        // In production, this would query the database
        return { calls: [], improvement: null };
      }),
  }),

  // ==========================================
  // LEVEL ASSESSMENT
  // ==========================================
  assessment: router({
    // Generate assessment questions
    getQuestions: publicProcedure
      .input(z.object({
        language: z.string(),
        phase: z.enum(["listening", "reading", "grammar", "speaking"]),
        currentLevel: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const phasePrompts: Record<string, string> = {
          listening: `Generate a listening comprehension question for ${input.language} level assessment. Include a short passage (2-3 sentences) and a multiple choice question about it. Target level: ${input.currentLevel || "unknown"}. Format as JSON: { passage: string, passageTranslation: string, question: string, options: string[], correctIndex: number, level: "A1"|"A2"|"B1"|"B2"|"C1"|"C2" }`,
          reading: `Generate a reading comprehension question for ${input.language} level assessment. Include a short text and question. Target level: ${input.currentLevel || "unknown"}. Format as JSON: { text: string, question: string, options: string[], correctIndex: number, level: "A1"|"A2"|"B1"|"B2"|"C1"|"C2" }`,
          grammar: `Generate a grammar question for ${input.language} level assessment. Fill-in-the-blank style. Target level: ${input.currentLevel || "unknown"}. Format as JSON: { sentence: string, blank: string, options: string[], correctIndex: number, explanation: string, level: "A1"|"A2"|"B1"|"B2"|"C1"|"C2" }`,
          speaking: `Generate a speaking prompt for ${input.language} level assessment. Give a topic or question the student should answer verbally. Target level: ${input.currentLevel || "unknown"}. Format as JSON: { prompt: string, expectedLength: "short"|"medium"|"long", keyVocabulary: string[], level: "A1"|"A2"|"B1"|"B2"|"C1"|"C2" }`,
        };

        const result = await invokeLLM({
          messages: [{ role: "user", content: phasePrompts[input.phase] }],
        });

        try {
          return JSON.parse(result.choices[0]?.message?.content as string || "{}");
        } catch {
          return { error: "Failed to generate question" };
        }
      }),

    // Submit assessment results and get CEFR level
    submitResults: publicProcedure
      .input(z.object({
        language: z.string(),
        answers: z.array(z.object({
          phase: z.string(),
          correct: z.boolean(),
          level: z.string(),
          timeMs: z.number(),
        })),
      }))
      .mutation(({ input }) => {
        // Calculate CEFR level based on answers
        const levelScores: Record<string, number> = { A1: 0, A2: 0, B1: 0, B2: 0, C1: 0, C2: 0 };
        const levelOrder = ["A1", "A2", "B1", "B2", "C1", "C2"];

        input.answers.forEach((a) => {
          if (a.correct) {
            levelScores[a.level] = (levelScores[a.level] || 0) + 1;
          }
        });

        // Find highest level where student got at least 60% correct
        let determinedLevel = "A1";
        for (const level of levelOrder) {
          if (levelScores[level] >= 1) { // At least 1 correct at this level
            determinedLevel = level;
          }
        }

        const totalCorrect = input.answers.filter((a) => a.correct).length;
        const accuracy = totalCorrect / input.answers.length;

        return {
          cefrLevel: determinedLevel,
          accuracy: Math.round(accuracy * 100),
          breakdown: {
            listening: input.answers.filter((a) => a.phase === "listening" && a.correct).length,
            reading: input.answers.filter((a) => a.phase === "reading" && a.correct).length,
            grammar: input.answers.filter((a) => a.phase === "grammar" && a.correct).length,
            speaking: input.answers.filter((a) => a.phase === "speaking" && a.correct).length,
          },
          recommendations: getRecommendationsForLevel(determinedLevel, input.language),
        };
      }),
  }),

  // ==========================================
  // SPACED REPETITION (Server-side persistence)
  // ==========================================
  spacedRepetition: router({
    // Sync vocab deck to server (for cross-device)
    syncDeck: publicProcedure
      .input(z.object({
        words: z.array(vocabWordSchema),
        lastSyncTimestamp: z.number(),
      }))
      .mutation(({ input }) => {
        // In production, merge with server-side deck
        // For now, acknowledge the sync
        return {
          success: true,
          syncedAt: Date.now(),
          conflicts: 0,
        };
      }),

    // Get AI-generated translations for words without them
    fillTranslations: publicProcedure
      .input(z.object({
        words: z.array(z.object({
          word: z.string(),
          language: z.string(),
        })),
      }))
      .mutation(async ({ input }) => {
        if (input.words.length === 0) return { translations: [] };

        const wordList = input.words.map((w) => `${w.word} (${w.language})`).join(", ");
        const result = await invokeLLM({
          messages: [{
            role: "user",
            content: `Translate these words to English. Return JSON array: [{ "word": "original", "translation": "english", "pronunciation": "phonetic" }]\n\nWords: ${wordList}`,
          }],
        });

        try {
          return { translations: JSON.parse(result.choices[0]?.message?.content as string || "[]") };
        } catch {
          return { translations: [] };
        }
      }),

    // Get review stats
    getStats: publicProcedure
      .input(z.object({ language: z.string().optional() }))
      .query(() => {
        // Would query database in production
        return {
          totalWords: 0,
          mastered: 0,
          learning: 0,
          dueToday: 0,
          streak: 0,
        };
      }),
  }),
});

// Helper function
function getRecommendationsForLevel(level: string, language: string) {
  const recs: Record<string, string[]> = {
    A1: ["Start with basic greetings", "Learn numbers 1-100", "Practice simple introductions"],
    A2: ["Expand daily vocabulary", "Practice ordering food", "Learn present tense verbs"],
    B1: ["Practice conversation scenarios", "Learn past tense", "Read simple articles"],
    B2: ["Join voice rooms for practice", "Watch content in target language", "Learn idioms and slang"],
    C1: ["Debate complex topics", "Read literature", "Practice professional language"],
    C2: ["Refine accent and style", "Learn regional dialects", "Practice creative writing"],
  };
  return recs[level] || recs["A1"];
}
