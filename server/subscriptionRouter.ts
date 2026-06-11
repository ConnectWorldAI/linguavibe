/**
 * Subscription Router - Server-side subscription management via tRPC
 *
 * Provides endpoints for:
 * - Validating subscription status server-side
 * - Getting customer info from RevenueCat
 * - Granting promotional access (admin only)
 * - Checking entitlements before serving premium content
 */

import { z } from "zod";
import { router, protectedProcedure, publicProcedure } from "./_core/trpc";
import { validateSubscription, getCustomerInfo, grantPromotionalEntitlement } from "./revenuecatWebhook";

export const subscriptionRouter = router({
  /**
   * Validate the current user's subscription status server-side.
   * This calls RevenueCat's REST API to get the authoritative subscription state.
   * Use this when you need to verify access before serving premium content.
   */
  validate: protectedProcedure.query(async ({ ctx }) => {
    const appUserId = ctx.user.openId;
    const result = await validateSubscription(appUserId);
    return result;
  }),

  /**
   * Get full customer info from RevenueCat (for debugging/admin).
   * Returns raw RevenueCat subscriber data.
   */
  customerInfo: protectedProcedure.query(async ({ ctx }) => {
    const appUserId = ctx.user.openId;
    const info = await getCustomerInfo(appUserId);
    if (!info) {
      return { found: false as const, subscriber: null };
    }
    return { found: true as const, subscriber: info.subscriber };
  }),

  /**
   * Check if the current user has a specific entitlement.
   * Quick boolean check for feature gating on the server side.
   */
  hasEntitlement: protectedProcedure
    .input(z.object({
      entitlementId: z.string(),
    }))
    .query(async ({ ctx, input }) => {
      const appUserId = ctx.user.openId;
      const result = await validateSubscription(appUserId);
      return {
        hasAccess: result.entitlements.includes(input.entitlementId),
        tier: result.tier,
        expiresAt: result.expiresAt?.toISOString() || null,
      };
    }),

  /**
   * Grant promotional access to a user (admin only).
   * Useful for beta testers, influencers, contest winners, etc.
   */
  grantPromo: protectedProcedure
    .input(z.object({
      targetUserId: z.string().min(1),
      entitlementId: z.enum(["plus_access", "pro_access", "enterprise_access"]),
      durationDays: z.number().min(1).max(365).default(30),
    }))
    .mutation(async ({ ctx, input }) => {
      // Only admins can grant promotional access
      if (ctx.user.role !== "admin") {
        throw new Error("Only admins can grant promotional entitlements");
      }

      const success = await grantPromotionalEntitlement(
        input.targetUserId,
        input.entitlementId,
        input.durationDays,
      );

      return { success, message: success ? `Granted ${input.entitlementId} for ${input.durationDays} days` : "Failed to grant entitlement" };
    }),

  /**
   * Sync subscription status from RevenueCat to local database.
   * Call this after login to ensure local tier is up-to-date.
   */
  syncStatus: protectedProcedure.mutation(async ({ ctx }) => {
    const appUserId = ctx.user.openId;
    const result = await validateSubscription(appUserId);

    // Update local database with current tier
    try {
      const { getDb } = await import("./db");
      const { userSettings } = await import("../drizzle/schema");
      const { eq } = await import("drizzle-orm");
      const db = await getDb();
      if (db) {
        const existing = await db.select().from(userSettings).where(eq(userSettings.userId, ctx.user.id)).limit(1);
        if (existing.length > 0) {
          await db.update(userSettings).set({ subscriptionTier: result.tier }).where(eq(userSettings.userId, ctx.user.id));
        } else {
          await db.insert(userSettings).values({ userId: ctx.user.id, subscriptionTier: result.tier });
        }
      }
    } catch (error: any) {
      console.warn("[Subscription] Failed to sync status to DB:", error.message);
    }

    return {
      tier: result.tier,
      isActive: result.isActive,
      entitlements: result.entitlements,
      expiresAt: result.expiresAt?.toISOString() || null,
      managementUrl: result.managementUrl,
    };
  }),
});
