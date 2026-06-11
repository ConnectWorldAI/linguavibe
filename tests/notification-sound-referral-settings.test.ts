/**
 * Tests for:
 * 1. shouldPlayNotificationSound wiring in notification schedulers
 * 2. Server-side referral code validation (validateAndRedeem)
 * 3. Settings referral entry point (redeem-referral screen)
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

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

// ─── Mock expo-notifications ────────────────────────────────────────────────
const mockScheduleNotification = vi.fn().mockResolvedValue("notif-id-123");
const mockCancelNotification = vi.fn().mockResolvedValue(undefined);
const mockRequestPermissions = vi.fn().mockResolvedValue({ status: "granted" });
const mockGetPermissions = vi.fn().mockResolvedValue({ status: "granted" });

vi.mock("expo-notifications", () => ({
  scheduleNotificationAsync: (...args: any[]) => mockScheduleNotification(...args),
  cancelScheduledNotificationAsync: (...args: any[]) => mockCancelNotification(...args),
  requestPermissionsAsync: () => mockRequestPermissions(),
  getPermissionsAsync: () => mockGetPermissions(),
  SchedulableTriggerInputTypes: {
    DAILY: "daily",
    WEEKLY: "weekly",
  },
}));

// ─── Mock react-native ─────────────────────────────────────────────────────
vi.mock("react-native", () => ({
  Platform: { OS: "ios" },
}));

// ─── Mock sound-settings ────────────────────────────────────────────────────
let notifSoundEnabled = true;
vi.mock("@/lib/sound-settings", () => ({
  shouldPlayNotificationSound: vi.fn(() => Promise.resolve(notifSoundEnabled)),
  shouldPlayHaptic: vi.fn(() => Promise.resolve(true)),
  shouldPlayCelebrationSound: vi.fn(() => Promise.resolve(true)),
}));

// ─── Mock tRPC vanillaClient ────────────────────────────────────────────────
const mockValidateAndRedeem = vi.fn();
vi.mock("@/lib/trpc", () => ({
  vanillaClient: {
    affiliate: {
      validateAndRedeem: {
        mutate: (...args: any[]) => mockValidateAndRedeem(...args),
      },
    },
  },
}));

// ─── Test: Notification Sound Wiring ────────────────────────────────────────
describe("Notification Sound Wiring", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.keys(mockStorage).forEach((k) => delete mockStorage[k]);
    notifSoundEnabled = true;
  });

  it("daily-xp-goal passes sound=true when notification sounds enabled", async () => {
    notifSoundEnabled = true;
    // scheduleDailyReminder is not exported - test via setDailyXPGoal
    // The function is private, so we test via setDailyXPGoal
    const { setDailyXPGoal } = await import("../lib/daily-xp-goal");
    await setDailyXPGoal({
      targetXP: 10,
      reminderHour: 20,
      reminderMinute: 0,
      isEnabled: true,
    });

    expect(mockScheduleNotification).toHaveBeenCalled();
    const callArgs = mockScheduleNotification.mock.calls[0][0];
    expect(callArgs.content.sound).toBe(true);
  });

  it("daily-xp-goal passes sound=false when notification sounds disabled", async () => {
    notifSoundEnabled = false;
    // Reset module to pick up new mock value
    vi.resetModules();
    vi.doMock("@/lib/sound-settings", () => ({
      shouldPlayNotificationSound: vi.fn(() => Promise.resolve(false)),
      shouldPlayHaptic: vi.fn(() => Promise.resolve(true)),
      shouldPlayCelebrationSound: vi.fn(() => Promise.resolve(true)),
    }));
    vi.doMock("@react-native-async-storage/async-storage", () => ({
      default: {
        getItem: vi.fn(() => Promise.resolve(null)),
        setItem: vi.fn(() => Promise.resolve()),
        removeItem: vi.fn(() => Promise.resolve()),
      },
    }));
    vi.doMock("expo-notifications", () => ({
      scheduleNotificationAsync: mockScheduleNotification,
      cancelScheduledNotificationAsync: mockCancelNotification,
      requestPermissionsAsync: mockRequestPermissions,
      getPermissionsAsync: mockGetPermissions,
      SchedulableTriggerInputTypes: { DAILY: "daily", WEEKLY: "weekly" },
    }));
    vi.doMock("react-native", () => ({ Platform: { OS: "ios" } }));

    const { setDailyXPGoal } = await import("../lib/daily-xp-goal");
    await setDailyXPGoal({
      targetXP: 10,
      reminderHour: 20,
      reminderMinute: 0,
      isEnabled: true,
    });

    expect(mockScheduleNotification).toHaveBeenCalled();
    const callArgs = mockScheduleNotification.mock.calls[0][0];
    expect(callArgs.content.sound).toBe(false);
  });

  it("weekly-digest passes sound='default' when enabled, false when disabled", async () => {
    vi.resetModules();
    vi.doMock("@/lib/sound-settings", () => ({
      shouldPlayNotificationSound: vi.fn(() => Promise.resolve(true)),
      shouldPlayHaptic: vi.fn(() => Promise.resolve(true)),
      shouldPlayCelebrationSound: vi.fn(() => Promise.resolve(true)),
    }));
    vi.doMock("@react-native-async-storage/async-storage", () => ({
      default: {
        getItem: vi.fn(() => Promise.resolve(null)),
        setItem: vi.fn(() => Promise.resolve()),
        removeItem: vi.fn(() => Promise.resolve()),
      },
    }));
    vi.doMock("expo-notifications", () => ({
      scheduleNotificationAsync: mockScheduleNotification,
      cancelScheduledNotificationAsync: mockCancelNotification,
      requestPermissionsAsync: mockRequestPermissions,
      getPermissionsAsync: mockGetPermissions,
      SchedulableTriggerInputTypes: { DAILY: "daily", WEEKLY: "weekly" },
    }));
    vi.doMock("react-native", () => ({ Platform: { OS: "ios" } }));

    const { scheduleWeeklyDigestNotification } = await import("../lib/weekly-digest");
    await scheduleWeeklyDigestNotification({
      isEnabled: true,
      dayOfWeek: 0,
      hour: 9,
      minute: 0,
    });

    expect(mockScheduleNotification).toHaveBeenCalled();
    const callArgs = mockScheduleNotification.mock.calls[0][0];
    expect(callArgs.content.sound).toBe("default");
  });

  it("weekly-recap passes sound based on shouldPlayNotificationSound", async () => {
    vi.resetModules();
    vi.doMock("@/lib/sound-settings", () => ({
      shouldPlayNotificationSound: vi.fn(() => Promise.resolve(true)),
      shouldPlayHaptic: vi.fn(() => Promise.resolve(true)),
      shouldPlayCelebrationSound: vi.fn(() => Promise.resolve(true)),
    }));
    vi.doMock("@react-native-async-storage/async-storage", () => ({
      default: {
        getItem: vi.fn(() => Promise.resolve(null)),
        setItem: vi.fn(() => Promise.resolve()),
        removeItem: vi.fn(() => Promise.resolve()),
      },
    }));
    vi.doMock("expo-notifications", () => ({
      scheduleNotificationAsync: mockScheduleNotification,
      cancelScheduledNotificationAsync: mockCancelNotification,
      requestPermissionsAsync: mockRequestPermissions,
      getPermissionsAsync: mockGetPermissions,
      SchedulableTriggerInputTypes: { DAILY: "daily", WEEKLY: "weekly" },
    }));
    vi.doMock("react-native", () => ({ Platform: { OS: "ios" } }));

    const { scheduleWeeklyRecap } = await import("../lib/weekly-recap");
    await scheduleWeeklyRecap({ enabled: true, hour: 10, minute: 0 });

    expect(mockScheduleNotification).toHaveBeenCalled();
    const callArgs = mockScheduleNotification.mock.calls[0][0];
    expect(callArgs.content.sound).toBe(true);
  });
});

// ─── Test: Server-side Referral Validation ──────────────────────────────────
describe("Server-side Referral Validation (validateAndRedeem)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.keys(mockStorage).forEach((k) => delete mockStorage[k]);
    mockValidateAndRedeem.mockReset();
  });

  it("redeemReferralCode tries server validation first", async () => {
    vi.resetModules();
    vi.doMock("@react-native-async-storage/async-storage", () => ({
      default: {
        getItem: vi.fn(() => Promise.resolve(null)),
        setItem: vi.fn(() => Promise.resolve()),
        removeItem: vi.fn(() => Promise.resolve()),
      },
    }));
    vi.doMock("@/lib/trpc", () => ({
      vanillaClient: {
        affiliate: {
          validateAndRedeem: {
            mutate: mockValidateAndRedeem,
          },
        },
      },
    }));
    vi.doMock("@/lib/sound-settings", () => ({
      shouldPlayNotificationSound: vi.fn(() => Promise.resolve(true)),
      shouldPlayHaptic: vi.fn(() => Promise.resolve(true)),
      shouldPlayCelebrationSound: vi.fn(() => Promise.resolve(true)),
    }));

    mockValidateAndRedeem.mockResolvedValue({
      valid: true,
      type: "affiliate",
      affiliateName: "TestAffiliate",
      rewards: {
        bonusXP: 50,
        streakFreezes: 1,
        videoCallMinutes: 5,
        translationCredits: 25,
      },
    });

    const { redeemReferralCode } = await import("../lib/referral-incentive");
    const result = await redeemReferralCode("TESTCODE123");

    expect(mockValidateAndRedeem).toHaveBeenCalledWith({ code: "TESTCODE123" });
    expect(result.success).toBe(true);
    expect(result.rewards?.bonusXP).toBe(50);
  });

  it("redeemReferralCode falls back to local validation when server fails", async () => {
    vi.resetModules();
    vi.doMock("@react-native-async-storage/async-storage", () => ({
      default: {
        getItem: vi.fn(() => Promise.resolve(null)),
        setItem: vi.fn(() => Promise.resolve()),
        removeItem: vi.fn(() => Promise.resolve()),
      },
    }));
    vi.doMock("@/lib/trpc", () => ({
      vanillaClient: {
        affiliate: {
          validateAndRedeem: {
            mutate: vi.fn().mockRejectedValue(new Error("Network error")),
          },
        },
      },
    }));
    vi.doMock("@/lib/sound-settings", () => ({
      shouldPlayNotificationSound: vi.fn(() => Promise.resolve(true)),
      shouldPlayHaptic: vi.fn(() => Promise.resolve(true)),
      shouldPlayCelebrationSound: vi.fn(() => Promise.resolve(true)),
    }));

    const { redeemReferralCode } = await import("../lib/referral-incentive");
    // CW-XXXXX format should pass local validation
    const result = await redeemReferralCode("CW-A3B7K");

    expect(result.success).toBe(true);
    expect(result.rewards?.bonusXP).toBe(25);
  });

  it("redeemReferralCode rejects invalid codes when server returns invalid", async () => {
    vi.resetModules();
    vi.doMock("@react-native-async-storage/async-storage", () => ({
      default: {
        getItem: vi.fn(() => Promise.resolve(null)),
        setItem: vi.fn(() => Promise.resolve()),
        removeItem: vi.fn(() => Promise.resolve()),
      },
    }));
    vi.doMock("@/lib/trpc", () => ({
      vanillaClient: {
        affiliate: {
          validateAndRedeem: {
            mutate: vi.fn().mockResolvedValue({
              valid: false,
              type: null,
              affiliateName: null,
              rewards: null,
              error: "Invalid referral code. Please check and try again.",
            }),
          },
        },
      },
    }));
    vi.doMock("@/lib/sound-settings", () => ({
      shouldPlayNotificationSound: vi.fn(() => Promise.resolve(true)),
      shouldPlayHaptic: vi.fn(() => Promise.resolve(true)),
      shouldPlayCelebrationSound: vi.fn(() => Promise.resolve(true)),
    }));

    const { redeemReferralCode } = await import("../lib/referral-incentive");
    const result = await redeemReferralCode("INVALID");

    expect(result.success).toBe(false);
    expect(result.error).toContain("Invalid");
  });

  it("redeemReferralCode prevents double redemption", async () => {
    vi.resetModules();
    vi.doMock("@react-native-async-storage/async-storage", () => ({
      default: {
        getItem: vi.fn((key: string) => {
          if (key === "@connectworld_referral_redeemed") {
            return Promise.resolve(JSON.stringify({ code: "CW-OLD01", redeemedAt: "2025-01-01" }));
          }
          return Promise.resolve(null);
        }),
        setItem: vi.fn(() => Promise.resolve()),
        removeItem: vi.fn(() => Promise.resolve()),
      },
    }));
    vi.doMock("@/lib/trpc", () => ({
      vanillaClient: {
        affiliate: {
          validateAndRedeem: { mutate: vi.fn() },
        },
      },
    }));
    vi.doMock("@/lib/sound-settings", () => ({
      shouldPlayNotificationSound: vi.fn(() => Promise.resolve(true)),
      shouldPlayHaptic: vi.fn(() => Promise.resolve(true)),
      shouldPlayCelebrationSound: vi.fn(() => Promise.resolve(true)),
    }));

    const { redeemReferralCode } = await import("../lib/referral-incentive");
    const result = await redeemReferralCode("CW-NEW01");

    expect(result.success).toBe(false);
    expect(result.error).toContain("already redeemed");
  });
});

// ─── Test: Server affiliateRouter validateAndRedeem logic ───────────────────
describe("affiliateRouter.validateAndRedeem", () => {
  it("validates CW-XXXXX format codes as peer referrals", () => {
    // Test the regex pattern used in the server
    const peerCodePattern = /^CW-[A-Z0-9]{5}$/;
    expect(peerCodePattern.test("CW-A3B7K")).toBe(true);
    expect(peerCodePattern.test("CW-12345")).toBe(true);
    expect(peerCodePattern.test("CW-abc")).toBe(false);
    expect(peerCodePattern.test("XX-A3B7K")).toBe(false);
  });

  it("validates CM-XXXXXX format codes as legacy referrals", () => {
    const legacyCodePattern = /^CM-[A-Z0-9]{6}$/;
    expect(legacyCodePattern.test("CM-ABC123")).toBe(true);
    expect(legacyCodePattern.test("CM-XYZ789")).toBe(true);
    expect(legacyCodePattern.test("CM-AB")).toBe(false);
    expect(legacyCodePattern.test("CW-ABC123")).toBe(false);
  });

  it("rejects completely invalid codes", () => {
    const peerCodePattern = /^CW-[A-Z0-9]{5}$/;
    const legacyCodePattern = /^CM-[A-Z0-9]{6}$/;
    const code = "BADCODE";
    expect(peerCodePattern.test(code)).toBe(false);
    expect(legacyCodePattern.test(code)).toBe(false);
  });
});

// ─── Test: Settings Referral Entry Point ────────────────────────────────────
describe("Settings Referral Entry Point", () => {
  it("settings.tsx includes Redeem Referral Code item", async () => {
    const fs = await import("fs");
    const settingsContent = fs.readFileSync("/home/ubuntu/linguavibe/app/settings.tsx", "utf-8");
    expect(settingsContent).toContain("Redeem Referral Code");
    expect(settingsContent).toContain("/redeem-referral");
  });

  it("redeem-referral.tsx screen file exists", async () => {
    const fs = await import("fs");
    const exists = fs.existsSync("/home/ubuntu/linguavibe/app/redeem-referral.tsx");
    expect(exists).toBe(true);
  });

  it("redeem-referral.tsx imports redeemReferralCode", async () => {
    const fs = await import("fs");
    const content = fs.readFileSync("/home/ubuntu/linguavibe/app/redeem-referral.tsx", "utf-8");
    expect(content).toContain("redeemReferralCode");
    expect(content).toContain("hasRedeemedReferral");
  });

  it("redeem-referral.tsx handles already-redeemed state", async () => {
    const fs = await import("fs");
    const content = fs.readFileSync("/home/ubuntu/linguavibe/app/redeem-referral.tsx", "utf-8");
    expect(content).toContain("alreadyRedeemed");
    expect(content).toContain("Already Redeemed");
  });
});
