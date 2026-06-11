/**
 * RevenueCat Webhook Handler
 *
 * Handles server-to-server notifications from RevenueCat for subscription
 * lifecycle events (purchases, renewals, cancellations, billing issues, etc.)
 *
 * Setup in RevenueCat Dashboard:
 * 1. Go to Project → Integrations → Webhooks
 * 2. Add webhook URL: https://<your-domain>/api/webhooks/revenuecat
 * 3. Set Authorization header to match REVENUECAT_WEBHOOK_SECRET env var
 * 4. Select events: All (or filter to specific types)
 */

import type { Request, Response } from "express";
import { eq } from "drizzle-orm";

// ─── Types ─────────────────────────────────────────────────────────────────

export type RevenueCatEventType =
  | "TEST"
  | "INITIAL_PURCHASE"
  | "RENEWAL"
  | "CANCELLATION"
  | "UNCANCELLATION"
  | "NON_RENEWING_PURCHASE"
  | "SUBSCRIPTION_PAUSED"
  | "EXPIRATION"
  | "BILLING_ISSUE"
  | "PRODUCT_CHANGE"
  | "TRANSFER"
  | "SUBSCRIPTION_EXTENDED"
  | "TEMPORARY_ENTITLEMENT_GRANT"
  | "REFUND_REVERSED"
  | "INVOICE_ISSUANCE";

export interface RevenueCatEvent {
  type: RevenueCatEventType;
  id: string;
  app_id: string;
  event_timestamp_ms: number;
  app_user_id: string;
  original_app_user_id: string;
  aliases: string[];
  product_id: string;
  entitlement_ids: string[] | null;
  period_type: "TRIAL" | "INTRO" | "NORMAL" | "PROMOTIONAL" | "PREPAID";
  purchased_at_ms: number;
  expiration_at_ms: number | null;
  environment: "PRODUCTION" | "SANDBOX";
  store: "APP_STORE" | "PLAY_STORE" | "AMAZON" | "STRIPE" | "PROMOTIONAL" | "WEB_BILLING";
  currency: string;
  price: number;
  price_in_purchased_currency: number;
  transaction_id: string;
  original_transaction_id: string;
  is_family_share: boolean;
  country_code: string;
  subscriber_attributes: Record<string, { value: string; updated_at_ms: number }>;
  cancel_reason?: "UNSUBSCRIBE" | "BILLING_ERROR" | "DEVELOPER_INITIATED" | "PRICE_INCREASE" | "CUSTOMER_SUPPORT" | "UNKNOWN";
  expiration_reason?: string;
  offer_code?: string | null;
  takehome_percentage?: number;
  tax_percentage?: number;
  commission_percentage?: number;
  grace_period_expiration_at_ms?: number | null;
  auto_resume_at_ms?: number | null;
  is_trial_conversion?: boolean;
  presented_offering_id?: string | null;
}

export interface RevenueCatWebhookPayload {
  api_version: string;
  event: RevenueCatEvent;
}

// ─── Entitlement → Tier Mapping ────────────────────────────────────────────

const ENTITLEMENT_TO_TIER: Record<string, "plus" | "pro" | "enterprise"> = {
  plus_access: "plus",
  pro_access: "pro",
  enterprise_access: "enterprise",
};

function getTierFromEntitlements(entitlementIds: string[] | null): "free" | "plus" | "pro" | "enterprise" {
  if (!entitlementIds || entitlementIds.length === 0) return "free";

  // Return the highest tier found
  if (entitlementIds.includes("enterprise_access")) return "enterprise";
  if (entitlementIds.includes("pro_access")) return "pro";
  if (entitlementIds.includes("plus_access")) return "plus";

  return "free";
}

// ─── Event Processing Store (for deduplication) ────────────────────────────

const processedEvents = new Set<string>();
const MAX_PROCESSED_EVENTS = 10000;

function isEventProcessed(eventId: string): boolean {
  return processedEvents.has(eventId);
}

function markEventProcessed(eventId: string): void {
  processedEvents.add(eventId);
  // Prevent memory leak by trimming old entries
  if (processedEvents.size > MAX_PROCESSED_EVENTS) {
    const entries = Array.from(processedEvents);
    const toRemove = entries.slice(0, entries.length - MAX_PROCESSED_EVENTS / 2);
    toRemove.forEach((id) => processedEvents.delete(id));
  }
}

// ─── Subscription Update Logic ─────────────────────────────────────────────

async function updateUserSubscription(
  appUserId: string,
  tier: "free" | "plus" | "pro" | "enterprise",
  event: RevenueCatEvent,
): Promise<void> {
  try {
    const { getDb } = await import("./db");
    const { userSettings, users } = await import("../drizzle/schema");
    const db = await getDb();
    if (!db) {
      console.warn("[RevenueCat] Database not available, skipping subscription update");
      return;
    }

    // Try to find user by openId (app_user_id from RevenueCat is typically the openId)
    const user = await db.select().from(users).where(eq(users.openId, appUserId)).limit(1);

    if (user.length === 0) {
      // Try numeric user ID
      const numericId = parseInt(appUserId);
      if (!isNaN(numericId)) {
        const existingSettings = await db.select().from(userSettings).where(eq(userSettings.userId, numericId)).limit(1);
        if (existingSettings.length > 0) {
          await db.update(userSettings).set({ subscriptionTier: tier }).where(eq(userSettings.userId, numericId));
          console.log(`[RevenueCat] Updated subscription tier to "${tier}" for userId=${numericId}`);
        }
      } else {
        console.warn(`[RevenueCat] User not found for app_user_id="${appUserId}"`);
      }
      return;
    }

    const userId = user[0].id;

    // Update or create user settings with new tier
    const existingSettings = await db.select().from(userSettings).where(eq(userSettings.userId, userId)).limit(1);

    if (existingSettings.length > 0) {
      await db.update(userSettings).set({ subscriptionTier: tier }).where(eq(userSettings.userId, userId));
    } else {
      await db.insert(userSettings).values({ userId, subscriptionTier: tier });
    }

    console.log(`[RevenueCat] Updated subscription tier to "${tier}" for user="${appUserId}" (id=${userId})`);
  } catch (error: any) {
    console.error(`[RevenueCat] Failed to update subscription for user="${appUserId}":`, error.message);
  }
}

// ─── Record Transaction ────────────────────────────────────────────────────

async function recordTransaction(event: RevenueCatEvent): Promise<void> {
  try {
    const { getDb } = await import("./db");
    const { transactions, users } = await import("../drizzle/schema");
    const db = await getDb();
    if (!db) return;

    // Resolve userId
    let userId = 0;
    const user = await db.select().from(users).where(eq(users.openId, event.app_user_id)).limit(1);
    if (user.length > 0) {
      userId = user[0].id;
    }

    const type = event.type === "NON_RENEWING_PURCHASE" ? "credit_purchase" : "subscription";
    const amount = Math.round((event.price_in_purchased_currency || event.price || 0) * 100); // Convert to cents

    await db.insert(transactions).values({
      userId,
      type,
      amount,
      currency: event.currency || "USD",
      description: `${event.type}: ${event.product_id}`,
      status: "completed",
      externalId: event.transaction_id,
    });

    console.log(`[RevenueCat] Recorded transaction: ${event.type} - ${event.product_id} - $${(amount / 100).toFixed(2)} ${event.currency}`);
  } catch (error: any) {
    console.error("[RevenueCat] Failed to record transaction:", error.message);
  }
}

// ─── Track Affiliate Revenue ───────────────────────────────────────────────

async function trackAffiliateRevenue(event: RevenueCatEvent): Promise<void> {
  try {
    if (event.price <= 0) return; // No revenue to attribute

    const { getDb } = await import("./db");
    const { users, userReferralAttribution, affiliateReferrals } = await import("../drizzle/schema");
    const db = await getDb();
    if (!db) return;

    // Find the user
    const user = await db.select().from(users).where(eq(users.openId, event.app_user_id)).limit(1);
    if (user.length === 0) return;

    const userId = user[0].id;

    // Check if this user was referred by an affiliate
    const attribution = await db.select().from(userReferralAttribution).where(eq(userReferralAttribution.userId, userId)).limit(1);
    if (attribution.length === 0) return;

    // Update the referral's revenue
    const referrals = await db.select().from(affiliateReferrals).where(eq(affiliateReferrals.referredUserId, userId)).limit(1);
    if (referrals.length > 0) {
      const revenueInCents = Math.round(event.price * 100);
      const currentRevenue = referrals[0].revenueGenerated || 0;
      await db.update(affiliateReferrals)
        .set({
          revenueGenerated: currentRevenue + revenueInCents,
          convertedToPaid: 1,
          subscriptionPlan: event.product_id,
          conversionDate: new Date(),
        })
        .where(eq(affiliateReferrals.referredUserId, userId));

      console.log(`[RevenueCat] Attributed $${event.price} revenue to affiliate for user=${userId}`);
    }
  } catch (error: any) {
    console.error("[RevenueCat] Failed to track affiliate revenue:", error.message);
  }
}

// ─── Event Handlers ────────────────────────────────────────────────────────

async function handleInitialPurchase(event: RevenueCatEvent): Promise<void> {
  const tier = getTierFromEntitlements(event.entitlement_ids);
  await updateUserSubscription(event.app_user_id, tier, event);
  await recordTransaction(event);
  await trackAffiliateRevenue(event);
  console.log(`[RevenueCat] INITIAL_PURCHASE: user="${event.app_user_id}" product="${event.product_id}" tier="${tier}"`);
}

async function handleRenewal(event: RevenueCatEvent): Promise<void> {
  const tier = getTierFromEntitlements(event.entitlement_ids);
  await updateUserSubscription(event.app_user_id, tier, event);
  await recordTransaction(event);
  await trackAffiliateRevenue(event);
  console.log(`[RevenueCat] RENEWAL: user="${event.app_user_id}" product="${event.product_id}" tier="${tier}"`);
}

async function handleCancellation(event: RevenueCatEvent): Promise<void> {
  // Don't immediately revoke access — the subscription is still active until expiration
  // Just log the cancellation reason for analytics
  console.log(`[RevenueCat] CANCELLATION: user="${event.app_user_id}" reason="${event.cancel_reason}" expires_at=${event.expiration_at_ms}`);

  // If it's a refund (price is 0 or negative in cancellation), revoke immediately
  if (event.cancel_reason === "CUSTOMER_SUPPORT" || event.cancel_reason === "DEVELOPER_INITIATED") {
    await updateUserSubscription(event.app_user_id, "free", event);
    console.log(`[RevenueCat] Access revoked immediately due to refund/developer action`);
  }
}

async function handleExpiration(event: RevenueCatEvent): Promise<void> {
  // Subscription has expired — revoke access
  await updateUserSubscription(event.app_user_id, "free", event);
  console.log(`[RevenueCat] EXPIRATION: user="${event.app_user_id}" reason="${event.expiration_reason}"`);
}

async function handleUncancellation(event: RevenueCatEvent): Promise<void> {
  // User re-enabled their subscription before it expired
  const tier = getTierFromEntitlements(event.entitlement_ids);
  await updateUserSubscription(event.app_user_id, tier, event);
  console.log(`[RevenueCat] UNCANCELLATION: user="${event.app_user_id}" tier="${tier}"`);
}

async function handleBillingIssue(event: RevenueCatEvent): Promise<void> {
  // Don't revoke access yet — there may be a grace period
  // Log for monitoring and potentially send a push notification
  console.log(`[RevenueCat] BILLING_ISSUE: user="${event.app_user_id}" grace_period_expires=${event.grace_period_expiration_at_ms}`);

  // Optionally send push notification to user about billing issue
  try {
    const { getDb } = await import("./db");
    const { users } = await import("../drizzle/schema");
    const db = await getDb();
    if (!db) return;

    const user = await db.select().from(users).where(eq(users.openId, event.app_user_id)).limit(1);
    if (user.length > 0) {
      const { sendPushToUser } = await import("./pushNotifications");
      await sendPushToUser(user[0].id, {
        title: "Payment Issue",
        body: "There was a problem with your subscription payment. Please update your payment method to keep your access.",
        data: { screen: "settings", action: "manage_subscription" },
      });
    }
  } catch (error: any) {
    console.warn("[RevenueCat] Failed to send billing issue notification:", error.message);
  }
}

async function handleProductChange(event: RevenueCatEvent): Promise<void> {
  const tier = getTierFromEntitlements(event.entitlement_ids);
  await updateUserSubscription(event.app_user_id, tier, event);
  console.log(`[RevenueCat] PRODUCT_CHANGE: user="${event.app_user_id}" new_product="${event.product_id}" tier="${tier}"`);
}

async function handleNonRenewingPurchase(event: RevenueCatEvent): Promise<void> {
  // Lifetime purchase or one-time purchase
  const tier = getTierFromEntitlements(event.entitlement_ids);
  await updateUserSubscription(event.app_user_id, tier, event);
  await recordTransaction(event);
  await trackAffiliateRevenue(event);
  console.log(`[RevenueCat] NON_RENEWING_PURCHASE (Lifetime): user="${event.app_user_id}" product="${event.product_id}" tier="${tier}"`);
}

async function handleSubscriptionExtended(event: RevenueCatEvent): Promise<void> {
  const tier = getTierFromEntitlements(event.entitlement_ids);
  await updateUserSubscription(event.app_user_id, tier, event);
  console.log(`[RevenueCat] SUBSCRIPTION_EXTENDED: user="${event.app_user_id}" new_expiration=${event.expiration_at_ms}`);
}

async function handleTransfer(event: RevenueCatEvent): Promise<void> {
  // Transactions transferred between users — refresh both users' subscription status
  console.log(`[RevenueCat] TRANSFER: from="${event.original_app_user_id}" to="${event.app_user_id}"`);
  // The new user gets the entitlements
  const tier = getTierFromEntitlements(event.entitlement_ids);
  await updateUserSubscription(event.app_user_id, tier, event);
}

// ─── Main Webhook Handler ──────────────────────────────────────────────────

export async function handleRevenueCatWebhook(req: Request, res: Response): Promise<void> {
  // Verify authorization header
  const webhookSecret = process.env.REVENUECAT_WEBHOOK_SECRET;
  if (webhookSecret) {
    const authHeader = req.headers.authorization;
    if (!authHeader || authHeader !== `Bearer ${webhookSecret}`) {
      console.warn("[RevenueCat] Webhook unauthorized — invalid or missing auth header");
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
  }

  // Respond immediately (RevenueCat requires quick 200 response)
  res.status(200).json({ received: true });

  // Process asynchronously after responding
  try {
    const payload = req.body as RevenueCatWebhookPayload;

    if (!payload || !payload.event) {
      console.warn("[RevenueCat] Received empty or malformed webhook payload");
      return;
    }

    const { event } = payload;

    // Deduplicate events
    if (isEventProcessed(event.id)) {
      console.log(`[RevenueCat] Skipping duplicate event: ${event.id} (${event.type})`);
      return;
    }
    markEventProcessed(event.id);

    console.log(`[RevenueCat] Processing event: ${event.type} (id=${event.id}, env=${event.environment})`);

    // Route to appropriate handler
    switch (event.type) {
      case "TEST":
        console.log("[RevenueCat] TEST event received — webhook is working!");
        break;
      case "INITIAL_PURCHASE":
        await handleInitialPurchase(event);
        break;
      case "RENEWAL":
        await handleRenewal(event);
        break;
      case "CANCELLATION":
        await handleCancellation(event);
        break;
      case "EXPIRATION":
        await handleExpiration(event);
        break;
      case "UNCANCELLATION":
        await handleUncancellation(event);
        break;
      case "BILLING_ISSUE":
        await handleBillingIssue(event);
        break;
      case "PRODUCT_CHANGE":
        await handleProductChange(event);
        break;
      case "NON_RENEWING_PURCHASE":
        await handleNonRenewingPurchase(event);
        break;
      case "SUBSCRIPTION_EXTENDED":
        await handleSubscriptionExtended(event);
        break;
      case "TRANSFER":
        await handleTransfer(event);
        break;
      case "SUBSCRIPTION_PAUSED":
        // Don't revoke access — wait for EXPIRATION event
        console.log(`[RevenueCat] SUBSCRIPTION_PAUSED: user="${event.app_user_id}" auto_resume=${event.auto_resume_at_ms}`);
        break;
      default:
        console.log(`[RevenueCat] Unhandled event type: ${event.type}`);
    }
  } catch (error: any) {
    // Don't throw — we already sent 200 response
    console.error("[RevenueCat] Error processing webhook:", error.message, error.stack);
  }
}

// ─── Server-Side Subscription Validation ───────────────────────────────────

/**
 * Validate a user's subscription status by calling RevenueCat REST API.
 * Use this for server-side entitlement checks (e.g., before serving premium content).
 *
 * Requires REVENUECAT_SECRET_API_KEY env var (found in RevenueCat Dashboard → API Keys).
 */
export async function validateSubscription(appUserId: string): Promise<{
  isActive: boolean;
  tier: "free" | "plus" | "pro" | "enterprise";
  entitlements: string[];
  expiresAt: Date | null;
  managementUrl: string | null;
}> {
  const secretKey = process.env.REVENUECAT_SECRET_API_KEY;
  if (!secretKey) {
    console.warn("[RevenueCat] REVENUECAT_SECRET_API_KEY not set — cannot validate server-side");
    return { isActive: false, tier: "free", entitlements: [], expiresAt: null, managementUrl: null };
  }

  try {
    const response = await fetch(`https://api.revenuecat.com/v1/subscribers/${encodeURIComponent(appUserId)}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${secretKey}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        // Customer not found — they have no purchases
        return { isActive: false, tier: "free", entitlements: [], expiresAt: null, managementUrl: null };
      }
      throw new Error(`RevenueCat API returned ${response.status}: ${await response.text()}`);
    }

    const data = await response.json();
    const subscriber = data.subscriber;

    // Check active entitlements
    const activeEntitlements: string[] = [];
    let latestExpiration: Date | null = null;

    if (subscriber.entitlements) {
      for (const [entitlementId, entitlement] of Object.entries(subscriber.entitlements) as any[]) {
        const expiresDate = entitlement.expires_date ? new Date(entitlement.expires_date) : null;
        const isActive = !expiresDate || expiresDate > new Date();

        if (isActive) {
          activeEntitlements.push(entitlementId);
          if (expiresDate && (!latestExpiration || expiresDate > latestExpiration)) {
            latestExpiration = expiresDate;
          }
        }
      }
    }

    const tier = getTierFromEntitlements(activeEntitlements.length > 0 ? activeEntitlements : null);
    const managementUrl = subscriber.management_url || null;

    return {
      isActive: activeEntitlements.length > 0,
      tier,
      entitlements: activeEntitlements,
      expiresAt: latestExpiration,
      managementUrl,
    };
  } catch (error: any) {
    console.error("[RevenueCat] Subscription validation failed:", error.message);
    return { isActive: false, tier: "free", entitlements: [], expiresAt: null, managementUrl: null };
  }
}

/**
 * Get full customer info from RevenueCat REST API.
 * Useful for syncing subscription status after receiving a webhook.
 */
export async function getCustomerInfo(appUserId: string): Promise<any | null> {
  const secretKey = process.env.REVENUECAT_SECRET_API_KEY;
  if (!secretKey) {
    console.warn("[RevenueCat] REVENUECAT_SECRET_API_KEY not set");
    return null;
  }

  try {
    const response = await fetch(`https://api.revenuecat.com/v1/subscribers/${encodeURIComponent(appUserId)}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${secretKey}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) return null;
    return await response.json();
  } catch (error: any) {
    console.error("[RevenueCat] Failed to get customer info:", error.message);
    return null;
  }
}

/**
 * Grant a promotional entitlement to a user via RevenueCat REST API.
 * Useful for giving free access to specific users (e.g., beta testers, influencers).
 */
export async function grantPromotionalEntitlement(
  appUserId: string,
  entitlementId: string,
  durationDays: number = 30,
): Promise<boolean> {
  const secretKey = process.env.REVENUECAT_SECRET_API_KEY;
  if (!secretKey) {
    console.warn("[RevenueCat] REVENUECAT_SECRET_API_KEY not set");
    return false;
  }

  try {
    const response = await fetch(
      `https://api.revenuecat.com/v1/subscribers/${encodeURIComponent(appUserId)}/entitlements/${encodeURIComponent(entitlementId)}/promotional`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${secretKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          duration: durationDays <= 7 ? "weekly" : durationDays <= 31 ? "monthly" : durationDays <= 62 ? "two_month" : durationDays <= 93 ? "three_month" : durationDays <= 186 ? "six_month" : "yearly",
        }),
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[RevenueCat] Failed to grant entitlement: ${response.status} - ${errorText}`);
      return false;
    }

    console.log(`[RevenueCat] Granted "${entitlementId}" to user="${appUserId}" for ${durationDays} days`);
    return true;
  } catch (error: any) {
    console.error("[RevenueCat] Failed to grant promotional entitlement:", error.message);
    return false;
  }
}
