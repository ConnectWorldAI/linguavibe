/**
 * AI Security Router — ConnectWorld AI
 * 
 * Exposes security-related endpoints:
 * - Report AI responses
 * - Get user's security status
 * - Admin: view audit logs and stats
 * - Admin: manage bans
 */

import { z } from "zod";
import { router, publicProcedure } from "./_core/trpc";
import {
  getSecurityStats,
  getSecurityAuditLog,
  checkRateLimit,
  recordViolation,
  analyzeInput,
} from "./ai-security";
import {
  reportAIResponse,
  getPendingReports,
} from "./ai-content-guardrails";

export const aiSecurityRouter = router({
  /**
   * Report an AI response that was inaccurate, offensive, or inappropriate.
   * Any authenticated user can submit reports.
   */
  reportResponse: publicProcedure
    .input(
      z.object({
        conversationId: z.string(),
        messageId: z.string(),
        reportType: z.enum(["inaccurate", "offensive", "inappropriate", "harmful", "other"]),
        description: z.string().max(1000),
        aiResponse: z.string().max(5000),
        userInput: z.string().max(2000),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const userId = (ctx as any).userId || "anonymous";
      const report = reportAIResponse({
        userId,
        conversationId: input.conversationId,
        messageId: input.messageId,
        reportType: input.reportType,
        description: input.description,
        aiResponse: input.aiResponse,
        userInput: input.userInput,
      });
      return { success: true, reportId: report.id };
    }),

  /**
   * Check if the current user is rate-limited or has any security flags.
   */
  getMySecurityStatus: publicProcedure.query(async ({ ctx }) => {
    const userId = (ctx as any).userId || "anonymous";
    const rateLimitResult = checkRateLimit(userId);
    return {
      isRateLimited: rateLimitResult !== null,
      rateLimitMessage: rateLimitResult,
      userId,
    };
  }),

  /**
   * Get security statistics (admin only in production, open for now).
   */
  getStats: publicProcedure.query(async () => {
    return getSecurityStats();
  }),

  /**
   * Get recent audit log entries (admin only in production).
   */
  getAuditLog: publicProcedure
    .input(z.object({ limit: z.number().min(1).max(500).default(100) }).optional())
    .query(async ({ input }) => {
      const limit = input?.limit ?? 100;
      return getSecurityAuditLog(limit);
    }),

  /**
   * Get pending AI response reports (admin only in production).
   */
  getPendingReports: publicProcedure
    .input(z.object({ limit: z.number().min(1).max(200).default(50) }).optional())
    .query(async ({ input }) => {
      const limit = input?.limit ?? 50;
      return getPendingReports(limit);
    }),

  /**
   * Analyze a text input for security threats (useful for testing/debugging).
   */
  analyzeText: publicProcedure
    .input(z.object({ text: z.string().max(5000) }))
    .query(async ({ input }) => {
      const analysis = analyzeInput(input.text, { isUserFacing: true });
      return {
        threatLevel: analysis.threatLevel,
        score: analysis.score,
        threats: analysis.threats,
        blocked: analysis.blocked,
      };
    }),
});
