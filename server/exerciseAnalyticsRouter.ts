/**
 * Exercise Analytics Router
 * 
 * Server-side endpoint for syncing exercise analytics from client devices.
 * Stores aggregated data in PostgreSQL for cross-device analytics and admin dashboards.
 */
import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";

// ─── Schemas ─────────────────────────────────────────────────────────────────

const exerciseEventSchema = z.object({
  id: z.string(),
  type: z.string(),
  action: z.enum(["start", "complete", "abandoned"]),
  timestamp: z.number(),
  language: z.string(),
  level: z.string().optional(),
  phraseCount: z.number().optional(),
  correct: z.number().optional(),
  total: z.number().optional(),
  durationMs: z.number().optional(),
  accuracy: z.number().optional(),
  audioMode: z.string().optional(),
  phraseIndex: z.number().optional(),
  reason: z.string().optional(),
});

const dailyAggregateSchema = z.object({
  date: z.string(),
  totalExercises: z.number(),
  completedExercises: z.number(),
  abandonedExercises: z.number(),
  totalDurationMs: z.number(),
  averageAccuracy: z.number(),
  byType: z.record(z.string(), z.object({
    started: z.number(),
    completed: z.number(),
    abandoned: z.number(),
    totalCorrect: z.number(),
    totalQuestions: z.number(),
    totalDurationMs: z.number(),
  })),
  byLanguage: z.record(z.string(), z.object({
    started: z.number(),
    completed: z.number(),
    averageAccuracy: z.number(),
  })),
});

// ─── Router ──────────────────────────────────────────────────────────────────

export const exerciseAnalyticsRouter = router({
  /**
   * Sync exercise analytics events from client to server.
   * Stores raw events and updates user's aggregate stats.
   */
  syncEvents: protectedProcedure
    .input(z.object({
      events: z.array(exerciseEventSchema).max(500),
      aggregates: z.record(z.string(), dailyAggregateSchema).optional(),
      deviceId: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user.id;

      try {
        const { getDb } = await import("./db");
        const db = await getDb();
        if (!db) {
          return { success: false, message: "Database unavailable", syncedCount: 0 };
        }

        // Store events in exercise_analytics table
        const { exerciseAnalytics } = await import("../drizzle/schema");
        
        let syncedCount = 0;
        for (const event of input.events) {
          try {
            await db.insert(exerciseAnalytics).values({
              userId,
              eventId: event.id,
              exerciseType: event.type,
              action: event.action,
              timestamp: new Date(event.timestamp),
              language: event.language,
              level: event.level || null,
              correct: event.correct ?? null,
              total: event.total ?? null,
              durationMs: event.durationMs ?? null,
              accuracy: event.accuracy ?? null,
              audioMode: event.audioMode || null,
              phraseIndex: event.phraseIndex ?? null,
              abandonReason: event.reason || null,
              deviceId: input.deviceId || null,
              metadata: JSON.stringify(event),
            });
            syncedCount++;
          } catch (insertErr: any) {
            // Skip duplicates (same eventId)
            if (insertErr?.code === "23505") continue;
            console.warn("[ExerciseAnalytics] Insert failed:", insertErr);
          }
        }

        return { success: true, syncedCount, totalReceived: input.events.length };
      } catch (err) {
        console.error("[ExerciseAnalytics] Sync failed:", err);
        return { success: false, message: "Sync failed", syncedCount: 0 };
      }
    }),

  /**
   * Get the user's exercise analytics summary from the server.
   * Useful for cross-device progress viewing.
   */
  getSummary: protectedProcedure
    .input(z.object({
      startDate: z.string().optional(),
      endDate: z.string().optional(),
      language: z.string().optional(),
      exerciseType: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const userId = ctx.user.id;

      try {
        const { getDb } = await import("./db");
        const db = await getDb();
        if (!db) {
          return { success: false, data: null };
        }

        const { exerciseAnalytics } = await import("../drizzle/schema");
        const { eq, and, gte, lte, sql } = await import("drizzle-orm");

        // Build query conditions
        const conditions = [eq(exerciseAnalytics.userId, userId)];
        if (input.startDate) {
          conditions.push(gte(exerciseAnalytics.timestamp, new Date(input.startDate)));
        }
        if (input.endDate) {
          conditions.push(lte(exerciseAnalytics.timestamp, new Date(input.endDate)));
        }
        if (input.language) {
          conditions.push(eq(exerciseAnalytics.language, input.language));
        }
        if (input.exerciseType) {
          conditions.push(eq(exerciseAnalytics.exerciseType, input.exerciseType));
        }

        const events = await db
          .select()
          .from(exerciseAnalytics)
          .where(and(...conditions))
          .orderBy(exerciseAnalytics.timestamp);

        // Calculate summary
        const starts = events.filter((e) => e.action === "start");
        const completes = events.filter((e) => e.action === "complete");
        const abandoned = events.filter((e) => e.action === "abandoned");

        const totalAccuracy = completes.reduce((sum, e) => sum + (e.accuracy || 0), 0);
        const totalDuration = completes.reduce((sum, e) => sum + (e.durationMs || 0), 0);

        // Group by type
        const byType: Record<string, { completed: number; accuracy: number; avgDurationMs: number }> = {};
        for (const event of completes) {
          if (!byType[event.exerciseType]) {
            byType[event.exerciseType] = { completed: 0, accuracy: 0, avgDurationMs: 0 };
          }
          byType[event.exerciseType].completed++;
        }
        for (const type of Object.keys(byType)) {
          const typeCompletes = completes.filter((e) => e.exerciseType === type);
          byType[type].accuracy = typeCompletes.length > 0
            ? Math.round(typeCompletes.reduce((s, e) => s + (e.accuracy || 0), 0) / typeCompletes.length)
            : 0;
          byType[type].avgDurationMs = typeCompletes.length > 0
            ? Math.round(typeCompletes.reduce((s, e) => s + (e.durationMs || 0), 0) / typeCompletes.length)
            : 0;
        }

        // Group by language
        const byLanguage: Record<string, { completed: number; accuracy: number }> = {};
        for (const event of completes) {
          if (!byLanguage[event.language]) {
            byLanguage[event.language] = { completed: 0, accuracy: 0 };
          }
          byLanguage[event.language].completed++;
        }
        for (const lang of Object.keys(byLanguage)) {
          const langCompletes = completes.filter((e) => e.language === lang);
          byLanguage[lang].accuracy = langCompletes.length > 0
            ? Math.round(langCompletes.reduce((s, e) => s + (e.accuracy || 0), 0) / langCompletes.length)
            : 0;
        }

        return {
          success: true,
          data: {
            totalExercises: starts.length,
            completedExercises: completes.length,
            abandonedExercises: abandoned.length,
            completionRate: starts.length > 0 ? Math.round((completes.length / starts.length) * 100) : 0,
            averageAccuracy: completes.length > 0 ? Math.round(totalAccuracy / completes.length) : 0,
            totalDurationMs: totalDuration,
            byType,
            byLanguage,
          },
        };
      } catch (err) {
        console.error("[ExerciseAnalytics] getSummary failed:", err);
        return { success: false, data: null };
      }
    }),

  /**
   * Get leaderboard data for exercise performance (anonymized).
   */
  getLeaderboard: publicProcedure
    .input(z.object({
      exerciseType: z.string().optional(),
      language: z.string().optional(),
      limit: z.number().min(1).max(50).default(10),
    }))
    .query(async ({ input }) => {
      try {
        const { getDb } = await import("./db");
        const db = await getDb();
        if (!db) return { entries: [] };

        const { exerciseAnalytics } = await import("../drizzle/schema");
        const { sql, eq, and } = await import("drizzle-orm");

        // Get top performers by accuracy (min 5 completions)
        const conditions = [eq(exerciseAnalytics.action, "complete")];
        if (input.exerciseType) {
          conditions.push(eq(exerciseAnalytics.exerciseType, input.exerciseType));
        }
        if (input.language) {
          conditions.push(eq(exerciseAnalytics.language, input.language));
        }

        const results = await db
          .select({
            userId: exerciseAnalytics.userId,
            avgAccuracy: sql<number>`AVG(${exerciseAnalytics.accuracy})`.as("avg_accuracy"),
            totalCompleted: sql<number>`COUNT(*)`.as("total_completed"),
            totalDuration: sql<number>`SUM(${exerciseAnalytics.durationMs})`.as("total_duration"),
          })
          .from(exerciseAnalytics)
          .where(and(...conditions))
          .groupBy(exerciseAnalytics.userId)
          .having(sql`COUNT(*) >= 5`)
          .orderBy(sql`avg_accuracy DESC`)
          .limit(input.limit);

        return {
          entries: results.map((r, idx) => ({
            rank: idx + 1,
            userId: r.userId,
            avgAccuracy: Math.round(Number(r.avgAccuracy)),
            totalCompleted: Number(r.totalCompleted),
            totalDurationMs: Number(r.totalDuration),
          })),
        };
      } catch (err) {
        console.error("[ExerciseAnalytics] getLeaderboard failed:", err);
        return { entries: [] };
      }
    }),
});
