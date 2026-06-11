/**
 * Daily Streak & Gamification Router
 * 
 * Server-side tracking of daily translation goals, streak counter,
 * XP system, and achievement badges. Syncs with client-side state.
 */
import { z } from "zod";
import { publicProcedure, router } from "./_core/trpc";
import { invokeLLM } from "./_core/llm";

// ─── XP Rewards ──────────────────────────────────────────────────────────────
const XP_REWARDS = {
  translation: 10,
  flashcardReview: 5,
  journalEntry: 25,
  lessonComplete: 50,
  pronunciationPractice: 15,
  streakBonus: 20, // per day of streak
  perfectDay: 100, // all daily goals met
  weeklyChallenge: 200,
};

const DAILY_GOALS = [
  { id: "translate_5", label: "Translate 5 phrases", target: 5, xp: 30 },
  { id: "review_10", label: "Review 10 flashcards", target: 10, xp: 25 },
  { id: "journal_1", label: "Write 1 journal entry", target: 1, xp: 25 },
  { id: "pronunciation_3", label: "Practice 3 pronunciations", target: 3, xp: 20 },
];

const ACHIEVEMENTS = [
  { id: "first_translation", name: "First Words", description: "Complete your first translation", icon: "🌱", xp: 50 },
  { id: "streak_7", name: "Week Warrior", description: "7-day streak", icon: "🔥", xp: 100 },
  { id: "streak_30", name: "Monthly Master", description: "30-day streak", icon: "⚡", xp: 500 },
  { id: "streak_100", name: "Century Club", description: "100-day streak", icon: "💎", xp: 2000 },
  { id: "translations_100", name: "Polyglot Path", description: "100 translations completed", icon: "🌍", xp: 300 },
  { id: "translations_1000", name: "Translation Titan", description: "1000 translations", icon: "👑", xp: 1000 },
  { id: "perfect_week", name: "Perfect Week", description: "Complete all daily goals for 7 days", icon: "⭐", xp: 500 },
  { id: "flashcards_500", name: "Memory Palace", description: "Review 500 flashcards", icon: "🧠", xp: 400 },
  { id: "journal_30", name: "Diary Devotee", description: "30 journal entries", icon: "📖", xp: 300 },
  { id: "pronunciation_master", name: "Native Sound", description: "Score 90%+ on 50 pronunciations", icon: "🎙️", xp: 500 },
];

const LEVELS = [
  { level: 1, xpRequired: 0, title: "Beginner" },
  { level: 2, xpRequired: 100, title: "Novice" },
  { level: 3, xpRequired: 300, title: "Learner" },
  { level: 4, xpRequired: 600, title: "Student" },
  { level: 5, xpRequired: 1000, title: "Practitioner" },
  { level: 6, xpRequired: 1500, title: "Intermediate" },
  { level: 7, xpRequired: 2500, title: "Advanced" },
  { level: 8, xpRequired: 4000, title: "Expert" },
  { level: 9, xpRequired: 6000, title: "Master" },
  { level: 10, xpRequired: 10000, title: "Grandmaster" },
];

export const gamificationRouter = router({
  /** Get daily goals and current progress */
  getDailyGoals: publicProcedure.query(() => ({
    goals: DAILY_GOALS,
    xpRewards: XP_REWARDS,
  })),

  /** Get all achievements */
  getAchievements: publicProcedure.query(() => ACHIEVEMENTS),

  /** Get level progression info */
  getLevels: publicProcedure.query(() => LEVELS),

  /** Calculate level from XP */
  calculateLevel: publicProcedure
    .input(z.object({ totalXP: z.number() }))
    .query(({ input }) => {
      const { totalXP } = input;
      let currentLevel = LEVELS[0];
      for (const level of LEVELS) {
        if (totalXP >= level.xpRequired) {
          currentLevel = level;
        } else break;
      }
      const nextLevel = LEVELS.find(l => l.level === currentLevel.level + 1);
      return {
        ...currentLevel,
        totalXP,
        xpToNext: nextLevel ? nextLevel.xpRequired - totalXP : 0,
        nextLevelTitle: nextLevel?.title || "Max Level",
        progress: nextLevel 
          ? (totalXP - currentLevel.xpRequired) / (nextLevel.xpRequired - currentLevel.xpRequired)
          : 1,
      };
    }),

  /** Generate a motivational message based on streak */
  getMotivation: publicProcedure
    .input(z.object({
      streak: z.number(),
      level: z.number(),
      targetLanguage: z.string().default("Spanish"),
    }))
    .mutation(async ({ input }) => {
      const { streak, level, targetLanguage } = input;
      const result = await invokeLLM({
        messages: [{
          role: "user",
          content: `Generate a short motivational message (1-2 sentences) for a ${targetLanguage} learner who has a ${streak}-day streak and is level ${level}. Be encouraging and specific. Include one word in ${targetLanguage} naturally. Return JSON: { "message": "...", "emoji": "..." }`,
        }],
        responseFormat: { type: "json_object" },
      });
      try {
        return JSON.parse(result.choices[0].message.content as string);
      } catch {
        return { message: `${streak} days strong! Keep going! 🔥`, emoji: "🔥" };
      }
    }),
});
