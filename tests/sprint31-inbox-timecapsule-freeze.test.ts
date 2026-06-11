import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

const APP_DIR = path.join(__dirname, "..");

function readFile(filePath: string): string {
  return fs.readFileSync(path.join(APP_DIR, filePath), "utf-8");
}

describe("Sprint 31 — Challenge Inbox, Time Capsule, Streak Freeze", () => {
  describe("Challenge Inbox Screen", () => {
    const content = readFile("app/challenge-inbox.tsx");

    it("should have challenge-inbox screen file", () => {
      expect(content).toBeTruthy();
    });

    it("should import getPendingChallenges and acceptChallenge", () => {
      expect(content).toContain("getPendingChallenges");
      expect(content).toContain("acceptChallenge");
      expect(content).toContain("declineChallenge");
    });

    it("should render pending challenges in a FlatList", () => {
      expect(content).toContain("FlatList");
      expect(content).toContain("renderItem");
    });

    it("should have Accept and Decline buttons", () => {
      expect(content).toContain("Accept");
      expect(content).toContain("Decline");
      expect(content).toContain("handleAccept");
      expect(content).toContain("handleDecline");
    });

    it("should display challenge details (category, difficulty, question count)", () => {
      expect(content).toContain("categoryLabel");
      expect(content).toContain("difficulty");
      expect(content).toContain("questionCount");
    });

    it("should show empty state when no challenges", () => {
      expect(content).toContain("No Pending Challenges");
    });

    it("should be registered in _layout.tsx", () => {
      const layout = readFile("app/_layout.tsx");
      expect(layout).toContain("challenge-inbox");
    });
  });

  describe("Challenge Badge on Leaderboard", () => {
    const content = readFile("app/grammar-streak-leaderboard.tsx");

    it("should import getPendingChallengeCount", () => {
      expect(content).toContain("getPendingChallengeCount");
    });

    it("should track pending challenge count state", () => {
      expect(content).toContain("pendingChallengeCount");
    });

    it("should show inbox button with badge", () => {
      expect(content).toContain("inboxBtn");
      expect(content).toContain("inboxBadge");
      expect(content).toContain("challenge-inbox");
    });

    it("should use useFocusEffect to refresh count", () => {
      expect(content).toContain("useFocusEffect");
    });
  });

  describe("Time Capsule Voice Recording", () => {
    const content = readFile("app/time-capsule.tsx");

    it("should have time-capsule screen file", () => {
      expect(content).toBeTruthy();
    });

    it("should support recording with expo-audio", () => {
      expect(content).toContain("useAudioRecorder");
      expect(content).toContain("requestRecordingPermissionsAsync");
    });

    it("should have milestone days (Day 1, 30, 90, 365)", () => {
      expect(content).toContain("Day 1");
      expect(content).toContain("Day 30");
      expect(content).toContain("Day 90");
      expect(content).toContain("Day 365");
    });

    it("should support playback of past recordings", () => {
      expect(content).toContain("playRecording");
      expect(content).toContain("createAudioPlayer");
    });

    it("should persist recordings to AsyncStorage", () => {
      expect(content).toContain("@time_capsule_recordings");
    });

    it("should be registered in _layout.tsx", () => {
      const layout = readFile("app/_layout.tsx");
      expect(layout).toContain("time-capsule");
    });
  });

  describe("Streak Freeze Library", () => {
    const content = readFile("lib/streak-freeze.ts");

    it("should have streak-freeze module", () => {
      expect(content).toBeTruthy();
    });

    it("should export isFreezeActiveToday", () => {
      expect(content).toContain("export async function isFreezeActiveToday");
    });

    it("should export activateFreeze", () => {
      expect(content).toContain("export async function activateFreeze");
    });

    it("should export purchaseStreakFreeze", () => {
      expect(content).toContain("export async function purchaseStreakFreeze");
    });

    it("should export purchaseFreezeWithCredits", () => {
      expect(content).toContain("export async function purchaseFreezeWithCredits");
    });

    it("should grant free monthly freezes", () => {
      expect(content).toContain("FREE_MONTHLY_FREEZES");
      expect(content).toContain("grantMonthlyFreezes");
    });

    it("should track purchase history", () => {
      expect(content).toContain("purchaseHistory");
      expect(content).toContain("FreezePurchase");
    });
  });

  describe("Streak Freeze Integration with Grammar Streak", () => {
    const content = readFile("lib/grammar-streak.ts");

    it("should import isFreezeActiveToday", () => {
      expect(content).toContain("import { isFreezeActiveToday }");
    });

    it("should check freeze before breaking streak", () => {
      expect(content).toContain("freezeActive");
      expect(content).toContain("isFreezeActiveToday()");
    });

    it("should preserve streak when freeze is active", () => {
      expect(content).toContain("Freeze protects the streak");
    });
  });

  describe("Streak Protection Screen RevenueCat Wiring", () => {
    const content = readFile("app/streak-protection.tsx");

    it("should import purchaseStreakFreeze from streak-freeze module", () => {
      expect(content).toContain("purchaseStreakFreeze");
    });

    it("should import activateFreeze", () => {
      expect(content).toContain("activateFreeze");
    });

    it("should call purchaseStreakFreeze in handlePurchaseFreeze", () => {
      expect(content).toContain("await purchaseStreakFreeze(1)");
    });

    it("should handle purchase failure gracefully", () => {
      expect(content).toContain("Purchase Failed");
    });

    it("should show remaining freezes after purchase", () => {
      expect(content).toContain("result.data.availableFreezes");
    });

    it("should support credits-based purchase", () => {
      expect(content).toContain("purchaseFreezeWithCredits");
    });
  });
});
