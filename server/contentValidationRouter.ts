/**
 * Content Validation Router
 * 
 * Manages the review queue for Portuguese lessons and other content
 * requiring native speaker validation before being served to learners.
 * 
 * Flow:
 * 1. Content is generated (via creatorContentEngine or adaptive lessons)
 * 2. If language is Portuguese (or flagged for review), it's submitted here
 * 3. Reviewers see pending items in the queue
 * 4. They approve, reject, or request revisions
 * 5. Only approved content is served to learners
 */
import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { invokeLLM } from "./_core/llm";

// ─── Types ───────────────────────────────────────────────────────────────────

const contentTypeEnum = z.enum(["lesson", "phrase", "translation", "slang", "rrt_phrase", "dictation_clip"]);
const statusEnum = z.enum(["pending_review", "approved", "rejected", "needs_revision"]);

// ─── Router ──────────────────────────────────────────────────────────────────

export const contentValidationRouter = router({
  /**
   * Submit content for native speaker review.
   * Called automatically when Portuguese/Brazilian content is generated.
   */
  submitForReview: publicProcedure
    .input(z.object({
      contentType: contentTypeEnum,
      language: z.string(),
      dialect: z.string().optional(),
      title: z.string().min(1).max(255),
      content: z.any(), // The full lesson/phrase data as JSON
      sourceCreator: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        const { getDb } = await import("./db");
        const db = await getDb();
        if (!db) return { success: false, id: null, message: "Database unavailable" };

        const { contentValidation } = await import("../drizzle/schema");

        const result = await db.insert(contentValidation).values({
          contentType: input.contentType,
          language: input.language,
          dialect: input.dialect || null,
          title: input.title,
          content: JSON.stringify(input.content),
          sourceCreator: input.sourceCreator || null,
          status: "pending_review",
          submittedBy: ctx.user?.id || null,
        });

        return {
          success: true,
          id: result[0]?.insertId || null,
          message: "Content submitted for review",
        };
      } catch (err) {
        console.error("[ContentValidation] Submit failed:", err);
        return { success: false, id: null, message: "Failed to submit for review" };
      }
    }),

  /**
   * Get the review queue with filtering options.
   */
  getReviewQueue: publicProcedure
    .input(z.object({
      status: statusEnum.optional(),
      language: z.string().optional(),
      contentType: contentTypeEnum.optional(),
      limit: z.number().min(1).max(100).default(20),
      offset: z.number().min(0).default(0),
    }))
    .query(async ({ input }) => {
      try {
        const { getDb } = await import("./db");
        const db = await getDb();
        if (!db) return { items: [], total: 0 };

        const { contentValidation } = await import("../drizzle/schema");
        const { eq, and, sql, desc } = await import("drizzle-orm");

        // Build conditions
        const conditions = [];
        if (input.status) {
          conditions.push(eq(contentValidation.status, input.status));
        }
        if (input.language) {
          conditions.push(eq(contentValidation.language, input.language));
        }
        if (input.contentType) {
          conditions.push(eq(contentValidation.contentType, input.contentType));
        }

        const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

        // Get total count
        const countResult = await db
          .select({ count: sql<number>`COUNT(*)` })
          .from(contentValidation)
          .where(whereClause);
        const total = Number(countResult[0]?.count || 0);

        // Get items
        const items = await db
          .select()
          .from(contentValidation)
          .where(whereClause)
          .orderBy(desc(contentValidation.createdAt))
          .limit(input.limit)
          .offset(input.offset);

        return {
          items: items.map((item) => ({
            ...item,
            content: typeof item.content === "string" ? JSON.parse(item.content) : item.content,
          })),
          total,
        };
      } catch (err) {
        console.error("[ContentValidation] getReviewQueue failed:", err);
        return { items: [], total: 0 };
      }
    }),

  /**
   * Approve a piece of content after native speaker review.
   */
  approveContent: protectedProcedure
    .input(z.object({
      id: z.number(),
      reviewerNotes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        const { getDb } = await import("./db");
        const db = await getDb();
        if (!db) return { success: false, message: "Database unavailable" };

        const { contentValidation } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");

        await db.update(contentValidation).set({
          status: "approved",
          reviewedBy: ctx.user.id,
          reviewedAt: new Date(),
          reviewerNotes: input.reviewerNotes || null,
        }).where(eq(contentValidation.id, input.id));

        return { success: true, message: "Content approved" };
      } catch (err) {
        console.error("[ContentValidation] Approve failed:", err);
        return { success: false, message: "Failed to approve content" };
      }
    }),

  /**
   * Reject a piece of content with feedback.
   */
  rejectContent: protectedProcedure
    .input(z.object({
      id: z.number(),
      reviewerNotes: z.string().min(1), // Must provide reason for rejection
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        const { getDb } = await import("./db");
        const db = await getDb();
        if (!db) return { success: false, message: "Database unavailable" };

        const { contentValidation } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");

        await db.update(contentValidation).set({
          status: "rejected",
          reviewedBy: ctx.user.id,
          reviewedAt: new Date(),
          reviewerNotes: input.reviewerNotes,
        }).where(eq(contentValidation.id, input.id));

        return { success: true, message: "Content rejected" };
      } catch (err) {
        console.error("[ContentValidation] Reject failed:", err);
        return { success: false, message: "Failed to reject content" };
      }
    }),

  /**
   * Request revisions for a piece of content.
   */
  requestRevision: protectedProcedure
    .input(z.object({
      id: z.number(),
      reviewerNotes: z.string().min(1), // What needs to be fixed
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        const { getDb } = await import("./db");
        const db = await getDb();
        if (!db) return { success: false, message: "Database unavailable" };

        const { contentValidation } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");

        await db.update(contentValidation).set({
          status: "needs_revision",
          reviewedBy: ctx.user.id,
          reviewedAt: new Date(),
          reviewerNotes: input.reviewerNotes,
        }).where(eq(contentValidation.id, input.id));

        return { success: true, message: "Revision requested" };
      } catch (err) {
        console.error("[ContentValidation] RequestRevision failed:", err);
        return { success: false, message: "Failed to request revision" };
      }
    }),

  /**
   * AI-assisted pre-validation: checks content for common Portuguese errors
   * before submitting to human reviewers. Reduces reviewer workload.
   */
  aiPreValidate: publicProcedure
    .input(z.object({
      content: z.any(),
      language: z.string().default("portuguese"),
      dialect: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const dialectHint = input.dialect
        ? `The target dialect is ${input.dialect} (e.g., Brazilian Portuguese vs European Portuguese).`
        : "Assume Brazilian Portuguese unless otherwise specified.";

      const contentStr = typeof input.content === "string"
        ? input.content
        : JSON.stringify(input.content, null, 2);

      const result = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `You are a native ${input.language} language expert and content validator.
${dialectHint}

Analyze the following language learning content for:
1. Grammatical errors in the target language
2. Incorrect translations
3. Unnatural phrasing that a native speaker would not use
4. Cultural inaccuracies or inappropriate content
5. Dialect mismatches (e.g., European Portuguese phrases labeled as Brazilian)
6. Missing or incorrect pronunciation guides

Return ONLY valid JSON:
{
  "isValid": true/false,
  "confidence": 0-100,
  "issues": [
    { "severity": "error"|"warning"|"suggestion", "field": "which field", "description": "what's wrong", "suggestion": "how to fix" }
  ],
  "overallFeedback": "brief summary"
}`,
          },
          {
            role: "user",
            content: `Validate this ${input.language} content:\n\n${contentStr}`,
          },
        ],
      });

      const responseContent = result.choices[0]?.message?.content;
      if (!responseContent || typeof responseContent !== "string") {
        return { isValid: false, confidence: 0, issues: [], overallFeedback: "AI validation unavailable" };
      }

      try {
        const jsonMatch = responseContent.match(/\{[\s\S]*\}/);
        if (!jsonMatch) throw new Error("No JSON");
        return JSON.parse(jsonMatch[0]);
      } catch {
        return { isValid: false, confidence: 0, issues: [], overallFeedback: responseContent.slice(0, 200) };
      }
    }),

  /**
   * Get validation statistics for dashboard.
   */
  getStats: publicProcedure.query(async () => {
    try {
      const { getDb } = await import("./db");
      const db = await getDb();
      if (!db) return { pending: 0, approved: 0, rejected: 0, needsRevision: 0, total: 0 };

      const { contentValidation } = await import("../drizzle/schema");
      const { sql } = await import("drizzle-orm");

      const results = await db
        .select({
          status: contentValidation.status,
          count: sql<number>`COUNT(*)`,
        })
        .from(contentValidation)
        .groupBy(contentValidation.status);

      const stats: Record<string, number> = {};
      for (const row of results) {
        stats[row.status] = Number(row.count);
      }

      return {
        pending: stats["pending_review"] || 0,
        approved: stats["approved"] || 0,
        rejected: stats["rejected"] || 0,
        needsRevision: stats["needs_revision"] || 0,
        total: Object.values(stats).reduce((a, b) => a + b, 0),
      };
    } catch (err) {
      console.error("[ContentValidation] getStats failed:", err);
      return { pending: 0, approved: 0, rejected: 0, needsRevision: 0, total: 0 };
    }
  }),
});
