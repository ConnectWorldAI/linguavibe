import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

// ─── Pronunciation Accuracy Leaderboard ─────────────────────────────────────

describe("Sprint 39 — Pronunciation Accuracy Leaderboard", () => {
  const libPath = path.join(__dirname, "../lib/pronunciation-accuracy-leaderboard.ts");
  const screenPath = path.join(__dirname, "../app/pronunciation-accuracy-leaderboard.tsx");

  it("lib file exists", () => {
    expect(fs.existsSync(libPath)).toBe(true);
  });

  it("screen file exists", () => {
    expect(fs.existsSync(screenPath)).toBe(true);
  });

  it("lib exports ranking functions", () => {
    const content = fs.readFileSync(libPath, "utf-8");
    expect(content).toContain("export");
    expect(content).toContain("mastery");
  });

  it("screen imports from the leaderboard lib", () => {
    const content = fs.readFileSync(screenPath, "utf-8");
    expect(content).toContain("pronunciation-accuracy-leaderboard");
  });

  it("screen renders podium or ranking UI", () => {
    const content = fs.readFileSync(screenPath, "utf-8");
    expect(content).toMatch(/podium|rank|medal|trophy|leaderboard/i);
  });

  it("screen is registered in _layout.tsx", () => {
    const layout = fs.readFileSync(
      path.join(__dirname, "../app/_layout.tsx"),
      "utf-8",
    );
    expect(layout).toContain("pronunciation-accuracy-leaderboard");
  });

  it("lobby has Rankings quick link to accuracy leaderboard", () => {
    const lobby = fs.readFileSync(
      path.join(__dirname, "../app/pronunciation-duel-lobby.tsx"),
      "utf-8",
    );
    expect(lobby).toContain("pronunciation-accuracy-leaderboard");
    expect(lobby).toContain("Rankings");
  });

  it("lib has language-specific ranking support", () => {
    const content = fs.readFileSync(libPath, "utf-8");
    expect(content).toMatch(/language|Language/);
  });
});

// ─── Daily Challenge Push Notifications ─────────────────────────────────────

describe("Sprint 39 — Daily Challenge Push Notifications", () => {
  const libPath = path.join(__dirname, "../lib/daily-challenge-notifications.ts");

  it("lib file exists", () => {
    expect(fs.existsSync(libPath)).toBe(true);
  });

  it("exports scheduling functions", () => {
    const content = fs.readFileSync(libPath, "utf-8");
    expect(content).toContain("scheduleDailyChallengeNotification");
    expect(content).toContain("cancelDailyChallengeNotification");
  });

  it("exports preference management", () => {
    const content = fs.readFileSync(libPath, "utf-8");
    expect(content).toContain("getDailyChallengeNotifPrefs");
    expect(content).toContain("saveDailyChallengeNotifPrefs");
    expect(content).toContain("updateAndReschedule");
  });

  it("has motivational messages array", () => {
    const content = fs.readFileSync(libPath, "utf-8");
    expect(content).toContain("MOTIVATIONAL_MESSAGES");
    expect(content).toContain("pronunciation");
  });

  it("supports time formatting", () => {
    const content = fs.readFileSync(libPath, "utf-8");
    expect(content).toContain("formatNotifTime");
    expect(content).toContain("AM");
    expect(content).toContain("PM");
  });

  it("uses DAILY trigger type for scheduling", () => {
    const content = fs.readFileSync(libPath, "utf-8");
    expect(content).toContain("SchedulableTriggerInputTypes.DAILY");
  });

  it("includes notification response handler", () => {
    const content = fs.readFileSync(libPath, "utf-8");
    expect(content).toContain("isDailyChallengeNotification");
    expect(content).toContain("getDailyChallengeRoute");
  });

  it("notification preferences screen has Daily Challenge section", () => {
    const prefs = fs.readFileSync(
      path.join(__dirname, "../app/notification-preferences.tsx"),
      "utf-8",
    );
    expect(prefs).toContain("Daily Challenge");
    expect(prefs).toContain("Word of the Day");
    expect(prefs).toContain("includeWordPreview");
    expect(prefs).toContain("includeStreakInfo");
  });

  it("notification preferences imports daily challenge lib", () => {
    const prefs = fs.readFileSync(
      path.join(__dirname, "../app/notification-preferences.tsx"),
      "utf-8",
    );
    expect(prefs).toContain("daily-challenge-notifications");
    expect(prefs).toContain("updateAndReschedule");
    expect(prefs).toContain("formatNotifTime");
  });

  it("has Android notification channel setup", () => {
    const content = fs.readFileSync(libPath, "utf-8");
    expect(content).toContain("setNotificationChannelAsync");
    expect(content).toContain("daily-duel-challenge");
  });
});

// ─── Adaptive Difficulty ────────────────────────────────────────────────────

describe("Sprint 39 — Adaptive Difficulty Engine", () => {
  const libPath = path.join(__dirname, "../lib/adaptive-difficulty.ts");

  it("lib file exists", () => {
    expect(fs.existsSync(libPath)).toBe(true);
  });

  it("exports adaptive profile builder", () => {
    const content = fs.readFileSync(libPath, "utf-8");
    expect(content).toContain("buildAdaptiveProfile");
    expect(content).toContain("getCachedProfile");
  });

  it("exports adaptive round generator", () => {
    const content = fs.readFileSync(libPath, "utf-8");
    expect(content).toContain("getAdaptiveRound");
  });

  it("exports session logging", () => {
    const content = fs.readFileSync(libPath, "utf-8");
    expect(content).toContain("logAdaptiveSession");
    expect(content).toContain("getAdaptiveSessionLogs");
  });

  it("has four adaptive strategies", () => {
    const content = fs.readFileSync(libPath, "utf-8");
    expect(content).toContain("weakness_focus");
    expect(content).toContain("balanced");
    expect(content).toContain("challenge_up");
    expect(content).toContain("review");
  });

  it("exports strategy and difficulty info helpers", () => {
    const content = fs.readFileSync(libPath, "utf-8");
    expect(content).toContain("getStrategyInfo");
    expect(content).toContain("getDifficultyInfo");
  });

  it("uses heatmap data for profiling", () => {
    const content = fs.readFileSync(libPath, "utf-8");
    expect(content).toContain("buildHeatmapSummary");
    expect(content).toContain("getCachedHeatmap");
    expect(content).toContain("HeatmapSummary");
  });

  it("determines difficulty based on mastery", () => {
    const content = fs.readFileSync(libPath, "utf-8");
    expect(content).toContain("determineDifficulty");
    expect(content).toContain("determineStrategy");
  });

  it("pronunciation-duel.tsx accepts adaptive param", () => {
    const duel = fs.readFileSync(
      path.join(__dirname, "../app/pronunciation-duel.tsx"),
      "utf-8",
    );
    expect(duel).toContain("adaptive");
    expect(duel).toContain("getAdaptiveRound");
    expect(duel).toContain("logAdaptiveSession");
  });

  it("lobby has Adaptive Practice button", () => {
    const lobby = fs.readFileSync(
      path.join(__dirname, "../app/pronunciation-duel-lobby.tsx"),
      "utf-8",
    );
    expect(lobby).toContain("Adaptive Practice");
    expect(lobby).toContain('adaptive: "true"');
  });

  it("adaptive settings have configurable weakness focus ratio", () => {
    const content = fs.readFileSync(libPath, "utf-8");
    expect(content).toContain("weaknessFocusRatio");
    expect(content).toContain("difficultyAutoAdjust");
    expect(content).toContain("maxConsecutiveHardWords");
  });

  it("adaptive profile tracks weak and strong categories", () => {
    const content = fs.readFileSync(libPath, "utf-8");
    expect(content).toContain("weakCategories");
    expect(content).toContain("strongCategories");
    expect(content).toContain("weakWords");
    expect(content).toContain("strongWords");
  });

  it("provides personalized reason for each round", () => {
    const content = fs.readFileSync(libPath, "utf-8");
    expect(content).toContain("personalizedReason");
    expect(content).toContain("Focusing on");
    expect(content).toContain("excelling");
  });
});
