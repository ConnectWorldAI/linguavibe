import { z } from "zod";
import { router, publicProcedure, protectedProcedure } from "./_core/trpc";
import { sendApprovalEmail, sendCommissionEarnedEmail, sendPayoutSentEmail } from "./emailNotifications";
import { scheduleOnboardingDrip } from "./affiliateDrip";
import { eq, and, desc, sql, count, sum } from "drizzle-orm";
import { getDb } from "./db";
import {
  affiliateApplications,
  affiliateReferrals,
  affiliateCommissions,
  userReferralAttribution,
  rateLimitEntries,
} from "../drizzle/schema";
import { sendPushToUser } from "./pushNotifications";

// Commission rates (in percentage)
const TIER1_COMMISSION_RATE = 20; // 20%
const TIER2_COMMISSION_RATE = 5; // 5%

// ─── Rate Limiting for validateAndRedeem (DB-persisted) ──────────────────────
// Sliding window: max 5 attempts per IP/identifier per 15 minutes
// Persists across server restarts using the rate_limit_entries table
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const RATE_LIMIT_MAX_ATTEMPTS = 5;
const RATE_LIMIT_ENDPOINT = "validateAndRedeem";

// In-memory fallback when DB is unavailable
const redeemRateLimitMap = new Map<string, { attempts: number; firstAttemptAt: number }>();

// Cleanup stale in-memory entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of redeemRateLimitMap) {
    if (now - entry.firstAttemptAt > RATE_LIMIT_WINDOW_MS) {
      redeemRateLimitMap.delete(key);
    }
  }
}, 5 * 60 * 1000);

async function checkRedeemRateLimit(identifier: string): Promise<{ allowed: boolean; retryAfterMs?: number }> {
  const db = await getDb();
  if (!db) {
    // Fallback to in-memory if DB is unavailable
    return checkRedeemRateLimitInMemory(identifier);
  }

  try {
    const now = new Date();
    const windowStart = new Date(now.getTime() - RATE_LIMIT_WINDOW_MS);

    // Find existing entry for this key+endpoint
    const existing = await db
      .select()
      .from(rateLimitEntries)
      .where(
        and(
          eq(rateLimitEntries.key, identifier),
          eq(rateLimitEntries.endpoint, RATE_LIMIT_ENDPOINT)
        )
      )
      .limit(1);

    if (existing.length === 0) {
      // No entry — create one and allow
      await db.insert(rateLimitEntries).values({
        key: identifier,
        endpoint: RATE_LIMIT_ENDPOINT,
        attempts: 1,
        windowStart: now,
      });
      return { allowed: true };
    }

    const entry = existing[0];
    const entryWindowStart = new Date(entry.windowStart);

    // Window expired — reset
    if (entryWindowStart < windowStart) {
      await db
        .update(rateLimitEntries)
        .set({ attempts: 1, windowStart: now })
        .where(eq(rateLimitEntries.id, entry.id));
      return { allowed: true };
    }

    // Within window — check attempts
    if (entry.attempts >= RATE_LIMIT_MAX_ATTEMPTS) {
      const retryAfterMs = RATE_LIMIT_WINDOW_MS - (now.getTime() - entryWindowStart.getTime());
      return { allowed: false, retryAfterMs };
    }

    // Increment attempts
    await db
      .update(rateLimitEntries)
      .set({ attempts: entry.attempts + 1 })
      .where(eq(rateLimitEntries.id, entry.id));
    return { allowed: true };
  } catch (err) {
    // On DB error, fall back to in-memory
    console.warn("[RateLimit] DB error, falling back to in-memory:", err);
    return checkRedeemRateLimitInMemory(identifier);
  }
}

function checkRedeemRateLimitInMemory(identifier: string): { allowed: boolean; retryAfterMs?: number } {
  const now = Date.now();
  const entry = redeemRateLimitMap.get(identifier);

  if (!entry) {
    redeemRateLimitMap.set(identifier, { attempts: 1, firstAttemptAt: now });
    return { allowed: true };
  }

  if (now - entry.firstAttemptAt > RATE_LIMIT_WINDOW_MS) {
    redeemRateLimitMap.set(identifier, { attempts: 1, firstAttemptAt: now });
    return { allowed: true };
  }

  if (entry.attempts >= RATE_LIMIT_MAX_ATTEMPTS) {
    const retryAfterMs = RATE_LIMIT_WINDOW_MS - (now - entry.firstAttemptAt);
    return { allowed: false, retryAfterMs };
  }

  entry.attempts++;
  return { allowed: true };
}

// Periodic DB cleanup of expired rate-limit entries (every 30 minutes)
setInterval(async () => {
  try {
    const db = await getDb();
    if (!db) return;
    const cutoff = new Date(Date.now() - RATE_LIMIT_WINDOW_MS * 2);
    await db.delete(rateLimitEntries).where(
      sql`${rateLimitEntries.windowStart} < ${cutoff}`
    );
  } catch {}
}, 30 * 60 * 1000);

function generateCode(name: string): string {
  const clean = name.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 8);
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${clean}${rand}`;
}

export const affiliateRouter = router({
  // ─── PUBLIC: Submit affiliate application ─────────────────────────────
  submitApplication: publicProcedure
    .input(
      z.object({
        name: z.string().min(1),
        email: z.string().email(),
        tiktokHandle: z.string().optional(),
        instagramHandle: z.string().optional(),
        youtubeHandle: z.string().optional(),
        followerCount: z.string().optional(),
        languagesSpoken: z.string().optional(),
        languagesTaught: z.string().optional(),
        contentNiche: z.string().optional(),
        whyJoin: z.string().optional(),
        parentReferralCode: z.string().optional(), // If recruited by another affiliate
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) return { success: false, error: "Database not available" };

      try {
        let parentAffiliateId: number | null = null;
        let tier: "tier1" | "tier2" = "tier1";

        // Check if recruited by another affiliate (Tier 2)
        if (input.parentReferralCode) {
          const parent = await db
            .select()
            .from(affiliateApplications)
            .where(
              and(
                eq(affiliateApplications.referralCode, input.parentReferralCode),
                eq(affiliateApplications.status, "approved")
              )
            )
            .limit(1);
          if (parent.length > 0) {
            parentAffiliateId = parent[0].id;
            tier = "tier2";
          }
        }

        const result = await db.insert(affiliateApplications).values({
          name: input.name,
          email: input.email,
          tiktokHandle: input.tiktokHandle || null,
          instagramHandle: input.instagramHandle || null,
          youtubeHandle: input.youtubeHandle || null,
          followerCount: input.followerCount || null,
          languagesSpoken: input.languagesSpoken || null,
          languagesTaught: input.languagesTaught || null,
          contentNiche: input.contentNiche || null,
          whyJoin: input.whyJoin || null,
          tier,
          parentAffiliateId,
          status: "pending",
        });

        return { success: true, applicationId: result[0].insertId };
      } catch (err: any) {
        return { success: false, error: err.message || "Failed to submit application" };
      }
    }),

  // ─── PUBLIC: Validate a referral code ─────────────────────────────────
  validateCode: publicProcedure
    .input(z.object({ code: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return { valid: false, affiliateName: null };

      const result = await db
        .select({
          id: affiliateApplications.id,
          name: affiliateApplications.name,
          referralCode: affiliateApplications.referralCode,
        })
        .from(affiliateApplications)
        .where(
          and(
            eq(affiliateApplications.referralCode, input.code.toUpperCase()),
            eq(affiliateApplications.status, "approved")
          )
        )
        .limit(1);

      if (result.length > 0) {
        return { valid: true, affiliateName: result[0].name, affiliateId: result[0].id };
      }
      return { valid: false, affiliateName: null };
    }),

  // ─── PUBLIC: Record a referral at signup ──────────────────────────────
  recordReferral: publicProcedure
    .input(
      z.object({
        referralCode: z.string(),
        referredUserId: z.number(),
        source: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) return { success: false };

      try {
        // Find the affiliate by referral code
        const affiliate = await db
          .select()
          .from(affiliateApplications)
          .where(
            and(
              eq(affiliateApplications.referralCode, input.referralCode.toUpperCase()),
              eq(affiliateApplications.status, "approved")
            )
          )
          .limit(1);

        if (affiliate.length === 0) return { success: false, error: "Invalid referral code" };

        const aff = affiliate[0];

        // Create referral record
        await db.insert(affiliateReferrals).values({
          affiliateId: aff.id,
          referredUserId: input.referredUserId,
          referralCode: input.referralCode.toUpperCase(),
          tier: aff.tier,
          signedUp: 1,
          convertedToPaid: 0,
          revenueGenerated: 0,
        });

        // Create user attribution record
        await db.insert(userReferralAttribution).values({
          userId: input.referredUserId,
          referralCode: input.referralCode.toUpperCase(),
          affiliateId: aff.id,
          source: input.source || "signup_form",
        });

        // If this is a Tier 2 affiliate, also record a Tier 2 referral for the parent
        if (aff.parentAffiliateId) {
          await db.insert(affiliateReferrals).values({
            affiliateId: aff.parentAffiliateId,
            referredUserId: input.referredUserId,
            referralCode: input.referralCode.toUpperCase(),
            tier: "tier2",
            signedUp: 1,
            convertedToPaid: 0,
            revenueGenerated: 0,
          });
        }

        return { success: true };
      } catch (err: any) {
        return { success: false, error: err.message };
      }
    }),

  // ─── ADMIN: List all affiliate applications ───────────────────────────
  listApplications: publicProcedure
    .input(
      z.object({
        status: z.enum(["pending", "approved", "rejected", "all"]).optional(),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      const conditions = [];
      if (input.status && input.status !== "all") {
        conditions.push(eq(affiliateApplications.status, input.status));
      }

      if (conditions.length > 0) {
        return db
          .select()
          .from(affiliateApplications)
          .where(and(...conditions))
          .orderBy(desc(affiliateApplications.createdAt));
      }
      return db
        .select()
        .from(affiliateApplications)
        .orderBy(desc(affiliateApplications.createdAt));
    }),

  // ─── ADMIN: Approve an affiliate application ─────────────────────────
  approveApplication: publicProcedure
    .input(z.object({ applicationId: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) return { success: false, error: "Database not available" };

      try {
        // Get the application
        const app = await db
          .select()
          .from(affiliateApplications)
          .where(eq(affiliateApplications.id, input.applicationId))
          .limit(1);

        if (app.length === 0) return { success: false, error: "Application not found" };

        // Generate referral code and link
        const referralCode = generateCode(app[0].name);
        const referralLink = `https://connectworldai.com/?ref=${referralCode}`;

        await db
          .update(affiliateApplications)
          .set({
            status: "approved",
            referralCode,
            referralLink,
            approvedAt: new Date(),
          })
          .where(eq(affiliateApplications.id, input.applicationId));

        // Send approval email notification
        const tier = app[0].tier || "tier1";
        const commissionRate = tier === "tier1" ? TIER1_COMMISSION_RATE : TIER2_COMMISSION_RATE;
        sendApprovalEmail({
          email: app[0].email,
          name: app[0].name,
          referralCode,
          referralLink,
          tier,
          commissionRate,
        }).catch((e) => console.error("[Email] Approval email failed:", e));

        // Schedule 7-day onboarding drip sequence
        scheduleOnboardingDrip({
          affiliateId: app[0].id,
          email: app[0].email,
          name: app[0].name,
          referralCode,
          referralLink,
        });

        return { success: true, referralCode, referralLink };
      } catch (err: any) {
        return { success: false, error: err.message };
      }
    }),

  // ─── ADMIN: Reject an affiliate application ──────────────────────────
  rejectApplication: publicProcedure
    .input(z.object({ applicationId: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) return { success: false };

      await db
        .update(affiliateApplications)
        .set({ status: "rejected", rejectedAt: new Date() })
        .where(eq(affiliateApplications.id, input.applicationId));

      return { success: true };
    }),

  // ─── AFFILIATE: Get my dashboard data ─────────────────────────────────
  myDashboard: publicProcedure
    .input(z.object({ email: z.string().email() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db)
        return {
          affiliate: null,
          stats: { totalReferrals: 0, paidConversions: 0, totalEarnings: 0, pendingPayout: 0 },
          referrals: [],
          commissions: [],
        };

      // Find affiliate by email
      const aff = await db
        .select()
        .from(affiliateApplications)
        .where(
          and(
            eq(affiliateApplications.email, input.email),
            eq(affiliateApplications.status, "approved")
          )
        )
        .limit(1);

      if (aff.length === 0)
        return {
          affiliate: null,
          stats: { totalReferrals: 0, paidConversions: 0, totalEarnings: 0, pendingPayout: 0 },
          referrals: [],
          commissions: [],
        };

      const affiliate = aff[0];

      // Get referrals
      const referrals = await db
        .select()
        .from(affiliateReferrals)
        .where(eq(affiliateReferrals.affiliateId, affiliate.id))
        .orderBy(desc(affiliateReferrals.createdAt));

      // Get commissions
      const commissions = await db
        .select()
        .from(affiliateCommissions)
        .where(eq(affiliateCommissions.affiliateId, affiliate.id))
        .orderBy(desc(affiliateCommissions.createdAt));

      // Calculate stats
      const totalReferrals = referrals.length;
      const paidConversions = referrals.filter((r) => r.convertedToPaid === 1).length;
      const totalEarnings = commissions
        .filter((c) => c.status === "paid" || c.status === "approved")
        .reduce((sum, c) => sum + c.amount, 0);
      const pendingPayout = commissions
        .filter((c) => c.status === "pending" || c.status === "approved")
        .reduce((sum, c) => sum + c.amount, 0);

      return {
        affiliate,
        stats: { totalReferrals, paidConversions, totalEarnings, pendingPayout },
        referrals,
        commissions,
      };
    }),

  // ─── ADMIN: Get all affiliate stats (overview) ────────────────────────
  adminStats: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db)
      return {
        totalAffiliates: 0,
        pendingApplications: 0,
        totalReferrals: 0,
        totalCommissionsPaid: 0,
        topAffiliates: [],
      };

    const totalAffiliates = await db
      .select({ count: count() })
      .from(affiliateApplications)
      .where(eq(affiliateApplications.status, "approved"));

    const pendingApplications = await db
      .select({ count: count() })
      .from(affiliateApplications)
      .where(eq(affiliateApplications.status, "pending"));

    const totalReferrals = await db.select({ count: count() }).from(affiliateReferrals);

    const totalCommissionsPaid = await db
      .select({ total: sum(affiliateCommissions.amount) })
      .from(affiliateCommissions)
      .where(eq(affiliateCommissions.status, "paid"));

    // Top affiliates by referral count
    const topAffiliates = await db
      .select({
        affiliateId: affiliateReferrals.affiliateId,
        referralCount: count(),
      })
      .from(affiliateReferrals)
      .groupBy(affiliateReferrals.affiliateId)
      .orderBy(desc(count()))
      .limit(10);

    return {
      totalAffiliates: totalAffiliates[0]?.count || 0,
      pendingApplications: pendingApplications[0]?.count || 0,
      totalReferrals: totalReferrals[0]?.count || 0,
      totalCommissionsPaid: Number(totalCommissionsPaid[0]?.total || 0),
      topAffiliates,
    };
  }),

  // ─── ADMIN: Record a conversion (user upgraded to paid) ───────────────
  recordConversion: publicProcedure
    .input(
      z.object({
        userId: z.number(),
        subscriptionPlan: z.string(),
        revenueAmount: z.number(), // cents
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) return { success: false };

      // Find the referral for this user
      const attribution = await db
        .select()
        .from(userReferralAttribution)
        .where(eq(userReferralAttribution.userId, input.userId))
        .limit(1);

      if (attribution.length === 0) return { success: false, error: "No referral attribution found" };

      const attr = attribution[0];

      // Update the referral record
      await db
        .update(affiliateReferrals)
        .set({
          convertedToPaid: 1,
          subscriptionPlan: input.subscriptionPlan,
          conversionDate: new Date(),
          revenueGenerated: input.revenueAmount,
        })
        .where(
          and(
            eq(affiliateReferrals.affiliateId, attr.affiliateId),
            eq(affiliateReferrals.referredUserId, input.userId)
          )
        );

      // Calculate and create Tier 1 commission
      const tier1Commission = Math.round(input.revenueAmount * (TIER1_COMMISSION_RATE / 100));
      const refRows = await db
        .select()
        .from(affiliateReferrals)
        .where(
          and(
            eq(affiliateReferrals.affiliateId, attr.affiliateId),
            eq(affiliateReferrals.referredUserId, input.userId),
            eq(affiliateReferrals.tier, "tier1")
          )
        )
        .limit(1);

      await db.insert(affiliateCommissions).values({
        affiliateId: attr.affiliateId,
        referralId: refRows.length > 0 ? refRows[0].id : null,
        type: "tier1_commission",
        amount: tier1Commission,
        description: `Tier 1 commission for ${input.subscriptionPlan} conversion`,
        status: "pending",
      });

      // Send commission earned email to Tier 1 affiliate
      const tier1Affiliate = await db
        .select()
        .from(affiliateApplications)
        .where(eq(affiliateApplications.id, attr.affiliateId))
        .limit(1);

      if (tier1Affiliate.length > 0) {
        // Get total earnings for the affiliate
        const totalEarningsResult = await db
          .select({ total: sum(affiliateCommissions.amount) })
          .from(affiliateCommissions)
          .where(eq(affiliateCommissions.affiliateId, attr.affiliateId));
        const totalEarnings = Number(totalEarningsResult[0]?.total || 0) + tier1Commission;

        sendCommissionEarnedEmail({
          email: tier1Affiliate[0].email,
          name: tier1Affiliate[0].name,
          amount: tier1Commission,
          referredUserName: `User #${input.userId}`,
          tier: "tier1",
          totalEarnings,
        }).catch((e) => console.error("[Email] Commission email failed:", e));
      }

      // Check if the affiliate has a parent (Tier 2 commission)
      const affiliate = await db
        .select()
        .from(affiliateApplications)
        .where(eq(affiliateApplications.id, attr.affiliateId))
        .limit(1);

      if (affiliate.length > 0 && affiliate[0].parentAffiliateId) {
        const tier2Commission = Math.round(input.revenueAmount * (TIER2_COMMISSION_RATE / 100));
        await db.insert(affiliateCommissions).values({
          affiliateId: affiliate[0].parentAffiliateId,
          referralId: null,
          type: "tier2_commission",
          amount: tier2Commission,
          description: `Tier 2 commission from sub-affiliate ${affiliate[0].name}`,
          status: "pending",
        });
      }

      return { success: true };
    }),

  // ─── STRIPE CONNECT: Create onboarding link for affiliate ─────────────
  stripeCreateOnboardingLink: publicProcedure
    .input(z.object({ affiliateId: z.number(), returnUrl: z.string().optional() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) return { success: false, error: "Database not available" };

      try {
        const stripeKey = process.env.STRIPE_SECRET_KEY;
        if (!stripeKey) return { success: false, error: "Stripe not configured", url: null };

        // Dynamic import stripe
        const Stripe = (await import("stripe")).default;
        const stripe = new Stripe(stripeKey);

        // Get affiliate
        const aff = await db.select().from(affiliateApplications)
          .where(eq(affiliateApplications.id, input.affiliateId)).limit(1);
        if (aff.length === 0) return { success: false, error: "Affiliate not found", url: null };

        let accountId = aff[0].stripeConnectAccountId;

        // Create Stripe Connect account if doesn't exist
        if (!accountId) {
          const account = await stripe.accounts.create({
            type: "express",
            email: aff[0].email,
            metadata: { affiliateId: input.affiliateId.toString(), name: aff[0].name },
          });
          accountId = account.id;
          await db.update(affiliateApplications)
            .set({ stripeConnectAccountId: accountId })
            .where(eq(affiliateApplications.id, input.affiliateId));
        }

        // Create onboarding link
        const returnUrl = input.returnUrl || "https://connectworldai.com/affiliate-dashboard";
        const accountLink = await stripe.accountLinks.create({
          account: accountId,
          refresh_url: returnUrl,
          return_url: returnUrl,
          type: "account_onboarding",
        });

        return { success: true, url: accountLink.url, accountId };
      } catch (err: any) {
        return { success: false, error: err.message, url: null };
      }
    }),

  // ─── STRIPE CONNECT: Check onboarding status ──────────────────────────
  stripeCheckStatus: publicProcedure
    .input(z.object({ affiliateId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return { connected: false, payoutsEnabled: false };

      const stripeKey = process.env.STRIPE_SECRET_KEY;
      if (!stripeKey) return { connected: false, payoutsEnabled: false };

      try {
        const aff = await db.select().from(affiliateApplications)
          .where(eq(affiliateApplications.id, input.affiliateId)).limit(1);
        if (aff.length === 0 || !aff[0].stripeConnectAccountId)
          return { connected: false, payoutsEnabled: false };

        const Stripe = (await import("stripe")).default;
        const stripe = new Stripe(stripeKey);
        const account = await stripe.accounts.retrieve(aff[0].stripeConnectAccountId);

        const payoutsEnabled = account.payouts_enabled || false;
        if (payoutsEnabled && !aff[0].stripeOnboardingComplete) {
          await db.update(affiliateApplications)
            .set({ stripeOnboardingComplete: 1 })
            .where(eq(affiliateApplications.id, input.affiliateId));
        }

        return { connected: true, payoutsEnabled, chargesEnabled: account.charges_enabled || false };
      } catch (err: any) {
        return { connected: false, payoutsEnabled: false, error: err.message };
      }
    }),

  // ─── STRIPE CONNECT: Initiate payout to affiliate ─────────────────────
  stripeInitiatePayout: publicProcedure
    .input(z.object({
      affiliateId: z.number(),
      commissionIds: z.array(z.number()), // which commissions to pay out
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) return { success: false, error: "Database not available" };

      const stripeKey = process.env.STRIPE_SECRET_KEY;
      if (!stripeKey) return { success: false, error: "Stripe not configured" };

      try {
        // Get affiliate's Stripe account
        const aff = await db.select().from(affiliateApplications)
          .where(eq(affiliateApplications.id, input.affiliateId)).limit(1);
        if (aff.length === 0 || !aff[0].stripeConnectAccountId)
          return { success: false, error: "Affiliate has no Stripe account" };

        // Get pending commissions
        const commissions = await db.select().from(affiliateCommissions)
          .where(and(
            eq(affiliateCommissions.affiliateId, input.affiliateId),
            eq(affiliateCommissions.status, "approved")
          ));

        const toPayIds = input.commissionIds.length > 0
          ? commissions.filter((c) => input.commissionIds.includes(c.id))
          : commissions;

        if (toPayIds.length === 0) return { success: false, error: "No approved commissions to pay" };

        const totalAmount = toPayIds.reduce((s, c) => s + c.amount, 0); // cents

        const Stripe = (await import("stripe")).default;
        const stripe = new Stripe(stripeKey);

        // Create a transfer to the connected account
        const transfer = await stripe.transfers.create({
          amount: totalAmount,
          currency: "usd",
          destination: aff[0].stripeConnectAccountId,
          metadata: {
            affiliateId: input.affiliateId.toString(),
            commissionIds: toPayIds.map((c) => c.id).join(","),
          },
        });

        // Mark commissions as paid
        for (const comm of toPayIds) {
          await db.update(affiliateCommissions)
            .set({
              status: "paid",
              paidAt: new Date(),
              payoutMethod: "stripe_connect",
              payoutReference: transfer.id,
            })
            .where(eq(affiliateCommissions.id, comm.id));
        }

        // Send payout email notification
        sendPayoutSentEmail({
          email: aff[0].email,
          name: aff[0].name,
          amount: totalAmount,
          stripeTransferId: transfer.id,
          commissionCount: toPayIds.length,
        }).catch((e) => console.error("[Email] Payout email failed:", e));

        return { success: true, transferId: transfer.id, amount: totalAmount, count: toPayIds.length };
      } catch (err: any) {
        return { success: false, error: err.message };
      }
    }),

  // ─── LEADERBOARD: Get top affiliates ranked by signups/conversions ────
  leaderboard: publicProcedure
    .input(z.object({
      timeFilter: z.enum(["all_time", "this_month", "this_week"]).optional(),
      limit: z.number().optional(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return { leaderboard: [], myRank: null };

      try {
        // Build date filter
        let dateConditions: any[] = [];
        const now = new Date();
        if (input.timeFilter === "this_month") {
          const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
          dateConditions.push(sql`${affiliateReferrals.createdAt} >= ${startOfMonth}`);
        } else if (input.timeFilter === "this_week") {
          const startOfWeek = new Date(now);
          startOfWeek.setDate(now.getDate() - now.getDay());
          startOfWeek.setHours(0, 0, 0, 0);
          dateConditions.push(sql`${affiliateReferrals.createdAt} >= ${startOfWeek}`);
        }

        // Get all approved affiliates with their referral counts
        const affiliates = await db.select().from(affiliateApplications)
          .where(eq(affiliateApplications.status, "approved"));

        const leaderboardData = [];
        for (const aff of affiliates) {
          const refConditions = [eq(affiliateReferrals.affiliateId, aff.id), ...dateConditions];
          const refs = await db.select({ count: count() }).from(affiliateReferrals)
            .where(and(...refConditions));

          const conversions = await db.select({ count: count() }).from(affiliateReferrals)
            .where(and(
              eq(affiliateReferrals.affiliateId, aff.id),
              eq(affiliateReferrals.convertedToPaid, 1),
              ...dateConditions
            ));

          const earnings = await db.select({ total: sum(affiliateCommissions.amount) })
            .from(affiliateCommissions)
            .where(eq(affiliateCommissions.affiliateId, aff.id));

          const totalRefs = refs[0]?.count || 0;
          const totalConversions = conversions[0]?.count || 0;
          const totalEarnings = Number(earnings[0]?.total || 0);

          // Calculate badge tier
          let badge = "Bronze";
          if (Number(totalRefs) >= 100) badge = "Platinum";
          else if (Number(totalRefs) >= 50) badge = "Gold";
          else if (Number(totalRefs) >= 20) badge = "Silver";

          leaderboardData.push({
            affiliateId: aff.id,
            name: aff.name,
            tier: aff.tier,
            totalReferrals: Number(totalRefs),
            totalConversions: Number(totalConversions),
            totalEarnings,
            conversionRate: Number(totalRefs) > 0 ? Math.round((Number(totalConversions) / Number(totalRefs)) * 100) : 0,
            badge,
            joinedAt: aff.approvedAt || aff.createdAt,
          });
        }

        // Sort by total referrals descending
        leaderboardData.sort((a, b) => b.totalReferrals - a.totalReferrals);

        // Add rank
        const ranked = leaderboardData.map((item, index) => ({ ...item, rank: index + 1 }));

        return {
          leaderboard: ranked.slice(0, input.limit || 50),
          total: ranked.length,
        };
      } catch (err: any) {
        return { leaderboard: [], total: 0, error: err.message };
      }
    }),

  // ─── PUBLIC: Validate and redeem a referral code (server-side) ────────
  // Accepts both CW-XXXXX (peer referral) and affiliate codes.
  // Returns validation result and, if valid, credits both parties.
  // Rate-limited: 5 attempts per 15 minutes per user/IP.
  validateAndRedeem: publicProcedure
    .input(
      z.object({
        code: z.string().min(1),
        redeemerUserId: z.number().optional(),
      })
    )
    .mutation(async ({ input }) => {
      // Rate limit check using redeemerUserId or code as identifier
      const rateLimitKey = input.redeemerUserId
        ? `user_${input.redeemerUserId}`
        : `anon_${input.code.trim().toUpperCase()}`;
      const rateCheck = await checkRedeemRateLimit(rateLimitKey);
      if (!rateCheck.allowed) {
        const retryMinutes = Math.ceil((rateCheck.retryAfterMs || 0) / 60000);
        return {
          valid: false,
          type: null,
          affiliateName: null,
          rewards: null,
          error: `Too many attempts. Please try again in ${retryMinutes} minute${retryMinutes !== 1 ? "s" : ""}.`,
        };
      }

      const db = await getDb();
      const code = input.code.trim().toUpperCase();

      // First try affiliate code validation (server DB)
      if (db) {
        try {
          const result = await db
            .select({
              id: affiliateApplications.id,
              name: affiliateApplications.name,
              referralCode: affiliateApplications.referralCode,
            })
            .from(affiliateApplications)
            .where(
              and(
                eq(affiliateApplications.referralCode, code),
                eq(affiliateApplications.status, "approved")
              )
            )
            .limit(1);

          if (result.length > 0) {
            // Valid affiliate code — record the referral if we have a user ID
            if (input.redeemerUserId) {
              await db.insert(affiliateReferrals).values({
                affiliateId: result[0].id,
                referredUserId: input.redeemerUserId,
                referralCode: code,
                tier: "tier1",
                signedUp: 1,
                convertedToPaid: 0,
                revenueGenerated: 0,
              });
              await db.insert(userReferralAttribution).values({
                userId: input.redeemerUserId,
                referralCode: code,
                affiliateId: result[0].id,
                source: "in_app_redeem",
              });
            }

            // Send push notification to the referrer if they have a userId
            const referrerAffiliate = await db
              .select({ userId: affiliateApplications.userId })
              .from(affiliateApplications)
              .where(eq(affiliateApplications.id, result[0].id))
              .limit(1);

            if (referrerAffiliate.length > 0 && referrerAffiliate[0].userId) {
              sendPushToUser(referrerAffiliate[0].userId, {
                title: "🎉 Your referral code was used!",
                body: "Someone just redeemed your code. You earned 50 XP, 1 Streak Freeze, and more!",
                data: { type: "referral_redeemed", deepLink: "referral-dashboard" },
                channelId: "referrals",
              }).catch(() => {}); // Fire-and-forget
            }

            return {
              valid: true,
              type: "affiliate" as const,
              affiliateName: result[0].name,
              rewards: {
                bonusXP: 50,
                streakFreezes: 1,
                videoCallMinutes: 5,
                translationCredits: 25,
              },
            };
          }
        } catch {}
      }

      // Fallback: validate CW-XXXXX format (peer referral, validated locally)
      const peerCodePattern = /^CW-[A-Z0-9]{5}$/;
      if (peerCodePattern.test(code)) {
        return {
          valid: true,
          type: "peer" as const,
          affiliateName: null,
          rewards: {
            bonusXP: 25,
            streakFreezes: 1,
            videoCallMinutes: 3,
            translationCredits: 15,
          },
        };
      }

      // Also accept CM-XXXXXX format (legacy referral screen codes)
      const legacyCodePattern = /^CM-[A-Z0-9]{6}$/;
      if (legacyCodePattern.test(code)) {
        return {
          valid: true,
          type: "peer" as const,
          affiliateName: null,
          rewards: {
            bonusXP: 25,
            streakFreezes: 1,
            videoCallMinutes: 3,
            translationCredits: 15,
          },
        };
      }

      return {
        valid: false,
        type: null,
        affiliateName: null,
        rewards: null,
        error: "Invalid referral code. Please check and try again.",
      };
    }),
});
