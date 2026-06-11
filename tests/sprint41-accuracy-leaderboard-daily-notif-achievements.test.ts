import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

const APP_DIR = path.resolve(__dirname, "../app");
const LIB_DIR = path.resolve(__dirname, "../lib");

describe("Sprint 41 — Accuracy Leaderboard, Daily Notifications, Achievements Wall", () => {
  // ─── Pronunciation Accuracy Leaderboard Entry Point ─────────────────────────
  describe("Pronunciation Accuracy Leaderboard entry point", () => {
    it("pronunciation-accuracy-leaderboard screen file exists", () => {
      const filePath = path.join(APP_DIR, "pronunciation-accuracy-leaderboard.tsx");
      expect(fs.existsSync(filePath)).toBe(true);
    });

    it("pronunciation-accuracy-leaderboard is registered in _layout.tsx", () => {
      const layout = fs.readFileSync(path.join(APP_DIR, "_layout.tsx"), "utf-8");
      expect(layout).toContain('"pronunciation-accuracy-leaderboard"');
    });

    it("teacher tab includes Accuracy Leaderboard button", () => {
      const teacherTab = fs.readFileSync(path.join(APP_DIR, "(tabs)", "teacher.tsx"), "utf-8");
      expect(teacherTab).toContain("pronunciation-accuracy-leaderboard");
    });
  });

  // ─── Daily Challenge Push Notifications Wired into App Startup ──────────────
  describe("Daily challenge push notifications wired into app startup", () => {
    it("_layout.tsx imports scheduleDailyChallengeNotification", () => {
      const layout = fs.readFileSync(path.join(APP_DIR, "_layout.tsx"), "utf-8");
      expect(layout).toContain("scheduleDailyChallengeNotification");
    });

    it("_layout.tsx imports getDailyChallengeNotifPrefs", () => {
      const layout = fs.readFileSync(path.join(APP_DIR, "_layout.tsx"), "utf-8");
      expect(layout).toContain("getDailyChallengeNotifPrefs");
    });

    it("_layout.tsx auto-schedules daily challenge notification on app start if enabled", () => {
      const layout = fs.readFileSync(path.join(APP_DIR, "_layout.tsx"), "utf-8");
      // Should check prefs.enabled before scheduling
      expect(layout).toContain("prefs.enabled");
      expect(layout).toContain("scheduleDailyChallengeNotification()");
    });

    it("daily-challenge-notifications lib exports getDailyChallengeNotifPrefs", () => {
      const libFile = path.join(LIB_DIR, "daily-challenge-notifications.ts");
      expect(fs.existsSync(libFile)).toBe(true);
      const content = fs.readFileSync(libFile, "utf-8");
      expect(content).toContain("getDailyChallengeNotifPrefs");
    });

    it("getDailyChallengeNotifPrefs returns object with enabled field (interface check)", () => {
      const content = fs.readFileSync(path.join(LIB_DIR, "daily-challenge-notifications.ts"), "utf-8");
      // Function is exported and async, returns DailyChallengeNotifPrefs with enabled field
      expect(content).toContain("export async function getDailyChallengeNotifPrefs");
      expect(content).toContain("enabled: boolean");
      // Default prefs include enabled: true
      expect(content).toContain("enabled: true");
    });
  });

  // ─── Achievements Wall (Gamification Trophy Room) ───────────────────────────
  describe("Achievements Wall screen", () => {
    const filePath = path.join(APP_DIR, "achievements-wall.tsx");

    it("achievements-wall.tsx file exists", () => {
      expect(fs.existsSync(filePath)).toBe(true);
    });

    it("achievements-wall is registered in _layout.tsx", () => {
      const layout = fs.readFileSync(path.join(APP_DIR, "_layout.tsx"), "utf-8");
      expect(layout).toContain('"achievements-wall"');
    });

    it("contains 28 achievement definitions", () => {
      const content = fs.readFileSync(filePath, "utf-8");
      // Count unique achievement IDs
      const idMatches = content.match(/id:\s*"[^"]+"/g) || [];
      expect(idMatches.length).toBeGreaterThanOrEqual(28);
    });

    it("has all 5 achievement categories (duels, streaks, mastery, social, milestones)", () => {
      const content = fs.readFileSync(filePath, "utf-8");
      expect(content).toContain('category: "duels"');
      expect(content).toContain('category: "streaks"');
      expect(content).toContain('category: "mastery"');
      expect(content).toContain('category: "social"');
      expect(content).toContain('category: "milestones"');
    });

    it("has tier badge system (bronze, silver, gold, diamond)", () => {
      const content = fs.readFileSync(filePath, "utf-8");
      expect(content).toContain('tier: "bronze"');
      expect(content).toContain('tier: "silver"');
      expect(content).toContain('tier: "gold"');
      expect(content).toContain('tier: "diamond"');
    });

    it("has progress bars for each achievement", () => {
      const content = fs.readFileSync(filePath, "utf-8");
      expect(content).toContain("progressBarBg");
      expect(content).toContain("progressBarFill");
      expect(content).toContain("progress:");
    });

    it("has stats summary panel with unlocked count, total, wins, streak", () => {
      const content = fs.readFileSync(filePath, "utf-8");
      expect(content).toContain("statsSummary");
      expect(content).toContain("Unlocked");
      expect(content).toContain("Total");
      expect(content).toContain("Wins");
      expect(content).toContain("Streak");
    });

    it("has category filter chips", () => {
      const content = fs.readFileSync(filePath, "utf-8");
      expect(content).toContain("filterChip");
      expect(content).toContain("CATEGORY_LABELS");
      expect(content).toContain("CategoryFilter");
    });

    it("uses ScreenContainer for proper layout", () => {
      const content = fs.readFileSync(filePath, "utf-8");
      expect(content).toContain("ScreenContainer");
    });

    it("loads stats from duel match history and AsyncStorage", () => {
      const content = fs.readFileSync(filePath, "utf-8");
      expect(content).toContain("getDuelMatchHistory");
      expect(content).toContain("AsyncStorage");
      expect(content).toContain("loadUserStats");
    });

    it("displays tier badge colors (bronze, silver, gold, diamond)", () => {
      const content = fs.readFileSync(filePath, "utf-8");
      expect(content).toContain("TIER_COLORS");
      expect(content).toContain("#CD7F32"); // bronze
      expect(content).toContain("#FFD700"); // gold
      expect(content).toContain("#B9F2FF"); // diamond
    });
  });
});
