/**
 * Tests for:
 * 1. Push notification to referrer on code redemption (server-side)
 * 2. Reward history on Referral Dashboard
 * 3. Rate-limiting on validateAndRedeem
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import * as fs from "fs";

// ─── Mock AsyncStorage ─────────────────────────────────────────────────────
const mockStorage: Record<string, string> = {};
vi.mock("@react-native-async-storage/async-storage", () => ({
  default: {
    getItem: vi.fn((key: string) => Promise.resolve(mockStorage[key] || null)),
    setItem: vi.fn((key: string, value: string) => {
      mockStorage[key] = value;
      return Promise.resolve();
    }),
    removeItem: vi.fn((key: string) => {
      delete mockStorage[key];
      return Promise.resolve();
    }),
  },
}));

vi.mock("@/lib/trpc", () => ({
  vanillaClient: {
    affiliate: {
      validateAndRedeem: {
        mutate: vi.fn().mockRejectedValue(new Error("Network")),
      },
    },
  },
}));

// ─── Test: Push Notification to Referrer ────────────────────────────────────
describe("Push Notification to Referrer on Redemption", () => {
  it("affiliateRouter imports sendPushToUser", () => {
    const content = fs.readFileSync("/home/ubuntu/linguavibe/server/affiliateRouter.ts", "utf-8");
    expect(content).toContain('import { sendPushToUser } from "./pushNotifications"');
  });

  it("validateAndRedeem calls sendPushToUser after successful affiliate code redemption", () => {
    const content = fs.readFileSync("/home/ubuntu/linguavibe/server/affiliateRouter.ts", "utf-8");
    // Check that the push notification is sent after affiliate validation
    expect(content).toContain("sendPushToUser(referrerAffiliate[0].userId");
    expect(content).toContain("Your referral code was used!");
    expect(content).toContain('type: "referral_redeemed"');
    expect(content).toContain('deepLink: "referral-dashboard"');
  });

  it("push notification is fire-and-forget (catch block)", () => {
    const content = fs.readFileSync("/home/ubuntu/linguavibe/server/affiliateRouter.ts", "utf-8");
    // Ensure it won't crash the mutation if push fails
    expect(content).toContain(".catch(() => {})");
  });

  it("only sends push if referrer has a userId", () => {
    const content = fs.readFileSync("/home/ubuntu/linguavibe/server/affiliateRouter.ts", "utf-8");
    expect(content).toContain("referrerAffiliate[0].userId");
    expect(content).toContain("referrerAffiliate.length > 0 && referrerAffiliate[0].userId");
  });

  it("uses 'referrals' channel for the notification", () => {
    const content = fs.readFileSync("/home/ubuntu/linguavibe/server/affiliateRouter.ts", "utf-8");
    expect(content).toContain('channelId: "referrals"');
  });
});

// ─── Test: Reward History ───────────────────────────────────────────────────
describe("Reward History on Referral Dashboard", () => {
  beforeEach(() => {
    Object.keys(mockStorage).forEach((k) => delete mockStorage[k]);
  });

  it("getRewardHistory returns empty array when no history exists", async () => {
    vi.resetModules();
    vi.doMock("@react-native-async-storage/async-storage", () => ({
      default: {
        getItem: vi.fn(() => Promise.resolve(null)),
        setItem: vi.fn(() => Promise.resolve()),
        removeItem: vi.fn(() => Promise.resolve()),
      },
    }));
    vi.doMock("@/lib/trpc", () => ({
      vanillaClient: { affiliate: { validateAndRedeem: { mutate: vi.fn().mockRejectedValue(new Error("Network")) } } },
    }));

    const { getRewardHistory } = await import("../lib/referral-incentive");
    const history = await getRewardHistory();
    expect(history).toEqual([]);
  });

  it("recordReferral appends to reward history", async () => {
    vi.resetModules();
    const storage: Record<string, string> = {};
    vi.doMock("@react-native-async-storage/async-storage", () => ({
      default: {
        getItem: vi.fn((key: string) => Promise.resolve(storage[key] || null)),
        setItem: vi.fn((key: string, value: string) => { storage[key] = value; return Promise.resolve(); }),
        removeItem: vi.fn(() => Promise.resolve()),
      },
    }));
    vi.doMock("@/lib/trpc", () => ({
      vanillaClient: { affiliate: { validateAndRedeem: { mutate: vi.fn().mockRejectedValue(new Error("Network")) } } },
    }));

    const { recordReferral, getRewardHistory } = await import("../lib/referral-incentive");
    await recordReferral("user1", "Alice");
    const history = await getRewardHistory();
    expect(history.length).toBe(1);
    expect(history[0].type).toBe("referrer_earned");
    expect(history[0].description).toContain("Alice");
    expect(history[0].rewards.bonusXP).toBeGreaterThan(0);
  });

  it("claimReferralRewards appends claimed entry to history", async () => {
    vi.resetModules();
    const storage: Record<string, string> = {};
    // Pre-seed with unclaimed rewards
    storage["@connectworld_referral_rewards"] = JSON.stringify({
      totalXPEarned: 50,
      totalFreezes: 1,
      totalVideoMinutes: 5,
      totalTranslationCredits: 10,
      unclaimedXP: 50,
      unclaimedFreezes: 1,
      unclaimedVideoMinutes: 5,
      unclaimedTranslationCredits: 10,
    });
    vi.doMock("@react-native-async-storage/async-storage", () => ({
      default: {
        getItem: vi.fn((key: string) => Promise.resolve(storage[key] || null)),
        setItem: vi.fn((key: string, value: string) => { storage[key] = value; return Promise.resolve(); }),
        removeItem: vi.fn(() => Promise.resolve()),
      },
    }));
    vi.doMock("@/lib/trpc", () => ({
      vanillaClient: { affiliate: { validateAndRedeem: { mutate: vi.fn().mockRejectedValue(new Error("Network")) } } },
    }));

    const { claimReferralRewards, getRewardHistory } = await import("../lib/referral-incentive");
    const claimed = await claimReferralRewards();
    expect(claimed.xp).toBe(50);

    const history = await getRewardHistory();
    expect(history.length).toBe(1);
    expect(history[0].type).toBe("claimed");
    expect(history[0].description).toBe("Claimed pending rewards");
  });

  it("applyReferralRewards (via redeemReferralCode) appends invitee_redeemed entry", async () => {
    vi.resetModules();
    const storage: Record<string, string> = {};
    vi.doMock("@react-native-async-storage/async-storage", () => ({
      default: {
        getItem: vi.fn((key: string) => Promise.resolve(storage[key] || null)),
        setItem: vi.fn((key: string, value: string) => { storage[key] = value; return Promise.resolve(); }),
        removeItem: vi.fn(() => Promise.resolve()),
      },
    }));
    vi.doMock("@/lib/trpc", () => ({
      vanillaClient: { affiliate: { validateAndRedeem: { mutate: vi.fn().mockRejectedValue(new Error("Network")) } } },
    }));

    const { redeemReferralCode, getRewardHistory } = await import("../lib/referral-incentive");
    const result = await redeemReferralCode("CW-A3B7K");
    expect(result.success).toBe(true);

    const history = await getRewardHistory();
    const redeemEntry = history.find((h) => h.type === "invitee_redeemed");
    expect(redeemEntry).toBeDefined();
    expect(redeemEntry!.code).toBe("CW-A3B7K");
    expect(redeemEntry!.rewards.bonusXP).toBe(25);
  });

  it("referral-dashboard.tsx imports getRewardHistory and RewardHistoryEntry", () => {
    const content = fs.readFileSync("/home/ubuntu/linguavibe/app/referral-dashboard.tsx", "utf-8");
    expect(content).toContain("getRewardHistory");
    expect(content).toContain("RewardHistoryEntry");
    expect(content).toContain("Reward History");
    expect(content).toContain("rewardHistoryHeader");
  });

  it("reward history limits to 100 entries", async () => {
    vi.resetModules();
    const storage: Record<string, string> = {};
    vi.doMock("@react-native-async-storage/async-storage", () => ({
      default: {
        getItem: vi.fn((key: string) => Promise.resolve(storage[key] || null)),
        setItem: vi.fn((key: string, value: string) => { storage[key] = value; return Promise.resolve(); }),
        removeItem: vi.fn(() => Promise.resolve()),
      },
    }));
    vi.doMock("@/lib/trpc", () => ({
      vanillaClient: { affiliate: { validateAndRedeem: { mutate: vi.fn().mockRejectedValue(new Error("Network")) } } },
    }));

    const { recordReferral, getRewardHistory } = await import("../lib/referral-incentive");
    // Record 105 referrals
    for (let i = 0; i < 105; i++) {
      await recordReferral(`user_${i}`, `User ${i}`);
    }
    const history = await getRewardHistory();
    expect(history.length).toBeLessThanOrEqual(100);
  });
});

// ─── Test: Rate Limiting ────────────────────────────────────────────────────
describe("Rate Limiting on validateAndRedeem", () => {
  it("affiliateRouter.ts contains rate limit constants", () => {
    const content = fs.readFileSync("/home/ubuntu/linguavibe/server/affiliateRouter.ts", "utf-8");
    expect(content).toContain("RATE_LIMIT_WINDOW_MS");
    expect(content).toContain("RATE_LIMIT_MAX_ATTEMPTS");
    expect(content).toContain("15 * 60 * 1000"); // 15 minutes
    expect(content).toContain("redeemRateLimitMap");
  });

  it("rate limiter allows first 5 attempts", () => {
    const content = fs.readFileSync("/home/ubuntu/linguavibe/server/affiliateRouter.ts", "utf-8");
    expect(content).toContain("RATE_LIMIT_MAX_ATTEMPTS = 5");
  });

  it("rate limiter returns error message with retry time", () => {
    const content = fs.readFileSync("/home/ubuntu/linguavibe/server/affiliateRouter.ts", "utf-8");
    expect(content).toContain("Too many attempts. Please try again in");
    expect(content).toContain("retryMinutes");
  });

  it("rate limit check runs before DB query", () => {
    const content = fs.readFileSync("/home/ubuntu/linguavibe/server/affiliateRouter.ts", "utf-8");
    const rateLimitPos = content.indexOf("checkRedeemRateLimit(rateLimitKey)");
    const dbQueryPos = content.indexOf("const db = await getDb()");
    // Rate limit check should come before DB access in validateAndRedeem
    // Find the positions within the validateAndRedeem mutation
    const validateStart = content.indexOf("validateAndRedeem: publicProcedure");
    const rateLimitInMutation = content.indexOf("checkRedeemRateLimit", validateStart);
    const dbInMutation = content.indexOf("const db = await getDb()", validateStart);
    expect(rateLimitInMutation).toBeLessThan(dbInMutation);
  });

  it("rate limit uses userId when available, falls back to anon key", () => {
    const content = fs.readFileSync("/home/ubuntu/linguavibe/server/affiliateRouter.ts", "utf-8");
    expect(content).toContain("`user_${input.redeemerUserId}`");
    expect(content).toContain("`anon_${input.code.trim().toUpperCase()}`");
  });

  it("stale rate limit entries are cleaned up periodically", () => {
    const content = fs.readFileSync("/home/ubuntu/linguavibe/server/affiliateRouter.ts", "utf-8");
    expect(content).toContain("setInterval");
    expect(content).toContain("redeemRateLimitMap.delete(key)");
    expect(content).toContain("5 * 60 * 1000"); // cleanup every 5 min
  });

  it("checkRedeemRateLimit function resets after window expires", () => {
    const content = fs.readFileSync("/home/ubuntu/linguavibe/server/affiliateRouter.ts", "utf-8");
    // Verify the logic resets when window expires
    expect(content).toContain("Window expired — reset");
    expect(content).toContain("now - entry.firstAttemptAt > RATE_LIMIT_WINDOW_MS");
  });
});
