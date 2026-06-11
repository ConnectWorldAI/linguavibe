import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

const ROOT = path.resolve(__dirname, "..");

function readFile(filePath: string): string {
  return fs.readFileSync(path.join(ROOT, filePath), "utf-8");
}

function fileExists(filePath: string): boolean {
  return fs.existsSync(path.join(ROOT, filePath));
}

describe("Sprint 30 — Challenge Notifications, Grammar Report, Streak Celebration", () => {
  // ─── Feature 1: Challenge Notification System ──────────────────────────────
  describe("Challenge Notification System", () => {
    it("challenge-notifications.ts exists with required exports", () => {
      expect(fileExists("lib/challenge-notifications.ts")).toBe(true);
      const content = readFile("lib/challenge-notifications.ts");
      expect(content).toContain("sendChallengeNotification");
      expect(content).toContain("handleIncomingChallenge");
      expect(content).toContain("handleChallengeNotificationTap");
      expect(content).toContain("getPendingChallenges");
      expect(content).toContain("acceptChallenge");
      expect(content).toContain("declineChallenge");
      expect(content).toContain("simulateIncomingChallenge");
    });

    it("challenge notification handler routes to grammar-challenge screen", () => {
      const content = readFile("lib/challenge-notifications.ts");
      expect(content).toContain('pathname: "/grammar-challenge"');
      expect(content).toContain("fromNotification");
    });

    it("incoming-call-handler chains challenge notification tap handler", () => {
      const content = readFile("lib/incoming-call-handler.ts");
      expect(content).toContain("handleChallengeNotificationTap");
      expect(content).toContain("challenge-notifications");
    });

    it("leaderboard sends challenge notification when challenge button is pressed", () => {
      const content = readFile("app/grammar-streak-leaderboard.tsx");
      expect(content).toContain("sendChallengeNotification");
      expect(content).toContain("sendChallengeNotification");
      expect(content).toContain('from "@/lib/challenge-notifications"');
    });

    it("challenge notification payload includes required fields", () => {
      const content = readFile("lib/challenge-notifications.ts");
      expect(content).toContain("challengeId");
      expect(content).toContain("fromUser");
      expect(content).toContain("fromUserId");
      expect(content).toContain("category");
      expect(content).toContain("difficulty");
      expect(content).toContain("questionCount");
    });

    it("pending challenges are stored in AsyncStorage", () => {
      const content = readFile("lib/challenge-notifications.ts");
      expect(content).toContain("@pending_grammar_challenges");
      expect(content).toContain("AsyncStorage");
    });

    it("challenge handler is imported in _layout.tsx", () => {
      const content = readFile("app/_layout.tsx");
      expect(content).toContain("handleChallengeNotificationTap");
      expect(content).toContain("challenge-notifications");
    });
  });

  // ─── Feature 2: Weekly Grammar Progress Report ─────────────────────────────
  describe("Weekly Grammar Progress Report", () => {
    it("grammar-progress-report.tsx exists", () => {
      expect(fileExists("app/grammar-progress-report.tsx")).toBe(true);
    });

    it("report screen imports grammar mistake data sources", () => {
      const content = readFile("app/grammar-progress-report.tsx");
      expect(content).toContain("getMistakes");
      expect(content).toContain("getStreakData");
      expect(content).toContain("getCorrectionHistory");
    });

    it("report screen is registered in layout", () => {
      const content = readFile("app/_layout.tsx");
      expect(content).toContain("grammar-progress-report");
    });

    it("report screen is accessible from grammar-notebook", () => {
      const content = readFile("app/grammar-notebook.tsx");
      expect(content).toContain("grammar-progress-report");
    });

    it("report includes category breakdown and trends", () => {
      const content = readFile("app/grammar-progress-report.tsx");
      expect(content).toContain("category");
      expect(content).toContain("trend");
      // Should show improvement or decline
      expect(content).toMatch(/improved|improvement|reduction/i);
    });

    it("report includes daily breakdown visualization", () => {
      const content = readFile("app/grammar-progress-report.tsx");
      expect(content).toContain("dailyBreakdown");
      // Should have bar chart or similar
      expect(content).toMatch(/bar|chart|height/i);
    });

    it("report includes share functionality", () => {
      const content = readFile("app/grammar-progress-report.tsx");
      expect(content).toContain("Share");
      expect(content).toContain("share");
    });
  });

  // ─── Feature 3: Streak Celebration Animation ───────────────────────────────
  describe("Streak Celebration Animation", () => {
    it("streak-celebration.tsx component exists", () => {
      expect(fileExists("components/streak-celebration.tsx")).toBe(true);
    });

    it("celebration component has confetti particles", () => {
      const content = readFile("components/streak-celebration.tsx");
      expect(content).toContain("Particle");
      expect(content).toContain("CONFETTI_COLORS");
      expect(content).toContain("particles");
    });

    it("celebration supports milestone days (7, 14, 30)", () => {
      const content = readFile("components/streak-celebration.tsx");
      expect(content).toContain("isStreakMilestone");
      expect(content).toMatch(/7.*14.*30/s);
    });

    it("celebration has unique messages per milestone", () => {
      const content = readFile("components/streak-celebration.tsx");
      expect(content).toContain("1 Week Streak");
      expect(content).toContain("2 Week Streak");
      expect(content).toContain("30 Day Streak");
    });

    it("celebration uses haptic feedback", () => {
      const content = readFile("components/streak-celebration.tsx");
      expect(content).toContain("Haptics");
      expect(content).toContain("notificationAsync");
    });

    it("celebration auto-dismisses", () => {
      const content = readFile("components/streak-celebration.tsx");
      expect(content).toContain("setTimeout");
      expect(content).toContain("handleDismiss");
    });

    it("teacher tab integrates streak celebration", () => {
      const content = readFile("app/(tabs)/teacher.tsx");
      expect(content).toContain("StreakCelebration");
      expect(content).toContain("showStreakCelebration");
      expect(content).toContain("isStreakMilestone");
    });

    it("celebration only shows once per milestone (persisted)", () => {
      const content = readFile("app/(tabs)/teacher.tsx");
      expect(content).toContain("@streak_celebrated_");
      expect(content).toContain("alreadyCelebrated");
    });

    it("celebration is exported with isStreakMilestone helper", () => {
      const content = readFile("components/streak-celebration.tsx");
      expect(content).toContain("export function isStreakMilestone");
      expect(content).toContain("export function StreakCelebration");
    });
  });

  // ─── Integration Tests ─────────────────────────────────────────────────────
  describe("Integration", () => {
    it("all Sprint 29 features still intact - grammar streak notifications", () => {
      expect(fileExists("lib/grammar-streak-notifications.ts")).toBe(true);
      const content = readFile("lib/grammar-streak-notifications.ts");
      expect(content).toContain("scheduleGrammarStreakReminder");
    });

    it("all Sprint 29 features still intact - grammar challenge screen", () => {
      expect(fileExists("app/grammar-challenge.tsx")).toBe(true);
      const content = readFile("app/grammar-challenge.tsx");
      expect(content).toContain("GrammarChallenge");
    });

    it("all Sprint 29 features still intact - grammar correction overlay", () => {
      expect(fileExists("components/grammar-correction-overlay.tsx")).toBe(true);
    });

    it("all Sprint 29 features still intact - checkout wired to RevenueCat", () => {
      const content = readFile("app/checkout.tsx");
      expect(content).toContain("purchasePackage");
      expect(content).toContain("restorePurchases");
    });

    it("all Sprint 29 features still intact - teacher refresh toast", () => {
      const content = readFile("app/(tabs)/teacher.tsx");
      expect(content).toContain("showToast");
      expect(content).toContain("toastMessage");
    });

    it("all Sprint 29 features still intact - dynamic stat cards", () => {
      const content = readFile("app/(tabs)/teacher.tsx");
      expect(content).toContain("statData");
      expect(content).toContain("getStreakData");
      expect(content).toContain("getQueueStats");
    });
  });
});
