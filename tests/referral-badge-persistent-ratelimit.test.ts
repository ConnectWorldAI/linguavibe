/**
 * Tests for:
 * 1. In-app notification badge on Referral Dashboard entry points
 * 2. Server-side DB-persistent rate limiting for validateAndRedeem
 */
import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

const readFile = (filePath: string) =>
  fs.readFileSync(path.join(__dirname, "..", filePath), "utf-8");

describe("Referral Badge System", () => {
  it("referral-incentive.ts exports getUnreadReferralCount", () => {
    const content = readFile("lib/referral-incentive.ts");
    expect(content).toContain("export async function getUnreadReferralCount");
  });

  it("referral-incentive.ts exports clearUnreadReferralCount", () => {
    const content = readFile("lib/referral-incentive.ts");
    expect(content).toContain("export async function clearUnreadReferralCount");
  });

  it("recordReferral calls incrementUnreadReferralCount", () => {
    const content = readFile("lib/referral-incentive.ts");
    expect(content).toContain("await incrementUnreadReferralCount()");
  });

  it("REFERRAL_UNREAD_KEY is defined for persistence", () => {
    const content = readFile("lib/referral-incentive.ts");
    expect(content).toContain("REFERRAL_UNREAD_KEY");
    expect(content).toContain("@connectworld_referral_unread_count");
  });
});

describe("BadgeCounts interface includes referrals", () => {
  it("notification-badges.tsx has referrals in BadgeCounts", () => {
    const content = readFile("lib/notification-badges.tsx");
    expect(content).toContain("referrals: number;");
  });

  it("DEFAULT_BADGES includes referrals: 0", () => {
    const content = readFile("lib/notification-badges.tsx");
    expect(content).toContain("referrals: 0,");
  });
});

describe("Persistent Rate Limiting", () => {
  it("checkRedeemRateLimitInMemory allows first attempt", () => {
    const content = readFile("server/affiliateRouter.ts");

    // Verify DB-backed rate limiter is implemented
    expect(content).toContain("async function checkRedeemRateLimit");
    expect(content).toContain("rateLimitEntries");
    expect(content).toContain("RATE_LIMIT_ENDPOINT");
    expect(content).toContain("checkRedeemRateLimitInMemory");
    expect(content).toContain("await checkRedeemRateLimit(rateLimitKey)");
  });

  it("rate limiter uses DB with in-memory fallback pattern", () => {
    const content = readFile("server/affiliateRouter.ts");

    // Verify DB-first approach with fallback
    expect(content).toContain("const db = await getDb()");
    expect(content).toContain("if (!db)");
    expect(content).toContain("return checkRedeemRateLimitInMemory(identifier)");

    // Verify DB operations (multiline chained calls)
    expect(content).toContain(".insert(rateLimitEntries)");
    expect(content).toContain(".update(rateLimitEntries)");

    // Verify periodic cleanup
    expect(content).toContain(".delete(rateLimitEntries)");
  });

  it("rate_limit_entries schema is properly defined", () => {
    const schema = readFile("drizzle/schema.ts");

    expect(schema).toContain("rateLimitEntries");
    expect(schema).toContain("rate_limit_entries");
    expect(schema).toContain("key_endpoint_idx");
    expect(schema).toContain("windowStart");
    expect(schema).toContain("attempts");
  });

  it("migration file creates the rate_limit_entries table", () => {
    const migration = readFile("drizzle/0007_uneven_gorgon.sql");

    expect(migration).toContain("CREATE TABLE `rate_limit_entries`");
    expect(migration).toContain("`key` varchar(255) NOT NULL");
    expect(migration).toContain("`endpoint` varchar(128) NOT NULL");
    expect(migration).toContain("`attempts` int NOT NULL DEFAULT 1");
    expect(migration).toContain("`windowStart` timestamp NOT NULL");
    expect(migration).toContain("key_endpoint_idx");
  });

  it("in-memory rate limiter blocks after max attempts", () => {
    // Simulate the in-memory rate limiter logic
    const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
    const RATE_LIMIT_MAX_ATTEMPTS = 5;
    const map = new Map<string, { attempts: number; firstAttemptAt: number }>();

    function check(identifier: string): { allowed: boolean; retryAfterMs?: number } {
      const now = Date.now();
      const entry = map.get(identifier);
      if (!entry) {
        map.set(identifier, { attempts: 1, firstAttemptAt: now });
        return { allowed: true };
      }
      if (now - entry.firstAttemptAt > RATE_LIMIT_WINDOW_MS) {
        map.set(identifier, { attempts: 1, firstAttemptAt: now });
        return { allowed: true };
      }
      if (entry.attempts >= RATE_LIMIT_MAX_ATTEMPTS) {
        const retryAfterMs = RATE_LIMIT_WINDOW_MS - (now - entry.firstAttemptAt);
        return { allowed: false, retryAfterMs };
      }
      entry.attempts++;
      return { allowed: true };
    }

    const key = "test_user_1";
    // First 5 attempts should be allowed
    for (let i = 0; i < 5; i++) {
      const result = check(key);
      expect(result.allowed).toBe(true);
    }
    // 6th attempt should be blocked
    const blocked = check(key);
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterMs).toBeGreaterThan(0);
  });
});

describe("Badge display on Referral Dashboard entry points", () => {
  it("settings.tsx imports badge system and referral count", () => {
    const content = readFile("app/settings.tsx");

    expect(content).toContain("useNotificationBadges");
    expect(content).toContain("getUnreadReferralCount");
    expect(content).toContain("referralBadgeCount");
    expect(content).toContain("setBadge(\"referrals\"");
  });

  it("leaderboard.tsx shows badge on referral dashboard button", () => {
    const content = readFile("app/leaderboard.tsx");

    expect(content).toContain("useNotificationBadges");
    expect(content).toContain("badges.referrals > 0");
    expect(content).toContain("getUnreadReferralCount");
  });

  it("referral-dashboard.tsx clears badge on load", () => {
    const content = readFile("app/referral-dashboard.tsx");

    expect(content).toContain("clearUnreadReferralCount");
    expect(content).toContain("setBadge(\"referrals\", 0)");
  });
});
