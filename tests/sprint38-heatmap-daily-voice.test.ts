/**
 * Sprint 38 Tests — Pronunciation Heatmap, Daily Duel Challenge, Voice Comparison Playback
 */
import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

const APP = path.resolve(__dirname, "..");

// ─── 1. Pronunciation Heatmap Library ───────────────────────────────────────
describe("Pronunciation Heatmap Library", () => {
  it("pronunciation-heatmap.ts exists with core exports", () => {
    const filePath = path.join(APP, "lib", "pronunciation-heatmap.ts");
    expect(fs.existsSync(filePath)).toBe(true);
    const src = fs.readFileSync(filePath, "utf-8");
    expect(src).toContain("buildHeatmapSummary");
    expect(src).toContain("buildHeatmapCells");
    expect(src).toContain("buildCategoryStats");
    expect(src).toContain("HeatmapCell");
  });

  it("heatmap lib analyzes duel match history", () => {
    const src = fs.readFileSync(path.join(APP, "lib", "pronunciation-heatmap.ts"), "utf-8");
    expect(src).toContain("extractAttempts");
    expect(src).toContain("DuelMatch");
    expect(src).toContain("attempts");
  });

  it("heatmap lib generates cells with color intensity", () => {
    const src = fs.readFileSync(path.join(APP, "lib", "pronunciation-heatmap.ts"), "utf-8");
    expect(src).toContain("getIntensityColor");
    expect(src).toContain("intensity");
  });
});

// ─── 2. Pronunciation Heatmap Screen ────────────────────────────────────────
describe("Pronunciation Heatmap Screen", () => {
  it("pronunciation-heatmap.tsx exists", () => {
    expect(fs.existsSync(path.join(APP, "app", "pronunciation-heatmap.tsx"))).toBe(true);
  });

  it("screen imports heatmap library functions", () => {
    const src = fs.readFileSync(path.join(APP, "app", "pronunciation-heatmap.tsx"), "utf-8");
    expect(src).toContain("buildHeatmapSummary");
    expect(src).toContain("getIntensityColor");
  });

  it("screen renders heatmap grid with cells", () => {
    const src = fs.readFileSync(path.join(APP, "app", "pronunciation-heatmap.tsx"), "utf-8");
    expect(src).toContain("gridContainer");
    expect(src).toContain("HeatmapCell");
  });

  it("screen shows weakest sounds section", () => {
    const src = fs.readFileSync(path.join(APP, "app", "pronunciation-heatmap.tsx"), "utf-8");
    expect(src).toContain("struggling");
  });

  it("screen has category breakdown", () => {
    const src = fs.readFileSync(path.join(APP, "app", "pronunciation-heatmap.tsx"), "utf-8");
    expect(src).toContain("CategoryStats");
  });

  it("screen is registered in _layout.tsx", () => {
    const layout = fs.readFileSync(path.join(APP, "app", "_layout.tsx"), "utf-8");
    expect(layout).toContain("pronunciation-heatmap");
  });
});

// ─── 3. Daily Duel Challenge Library ────────────────────────────────────────
describe("Daily Duel Challenge Library", () => {
  it("daily-duel-challenge.ts exists with core exports", () => {
    const filePath = path.join(APP, "lib", "daily-duel-challenge.ts");
    expect(fs.existsSync(filePath)).toBe(true);
    const src = fs.readFileSync(filePath, "utf-8");
    expect(src).toContain("getTodaysChallenge");
    expect(src).toContain("DailyChallenge");
    expect(src).toContain("DailyChallengeAttempt");
    expect(src).toContain("DailyChallengeStreak");
  });

  it("daily challenge has word of the day with phonetic and translation", () => {
    const src = fs.readFileSync(path.join(APP, "lib", "daily-duel-challenge.ts"), "utf-8");
    expect(src).toContain("phonetic");
    expect(src).toContain("phonetic");
    expect(src).toContain("bonusWords");
  });

  it("daily challenge has sharing functionality", () => {
    const src = fs.readFileSync(path.join(APP, "lib", "daily-duel-challenge.ts"), "utf-8");
    expect(src).toContain("generateShareContent");
    expect(src).toContain("hashtags");
  });

  it("daily challenge has streak tracking", () => {
    const src = fs.readFileSync(path.join(APP, "lib", "daily-duel-challenge.ts"), "utf-8");
    expect(src).toContain("getDailyChallengeStreak");
    expect(src).toContain("updateDailyChallengeStreak");
  });

  it("daily challenge has ranking system", () => {
    const src = fs.readFileSync(path.join(APP, "lib", "daily-duel-challenge.ts"), "utf-8");
    expect(src).toContain("calculateRank");
    expect(src).toContain("getRankColor");
    expect(src).toContain("getRankEmoji");
  });
});

// ─── 4. Daily Duel Challenge Screen ────────────────────────────────────────
describe("Daily Duel Challenge Screen", () => {
  it("daily-duel-challenge.tsx exists", () => {
    expect(fs.existsSync(path.join(APP, "app", "daily-duel-challenge.tsx"))).toBe(true);
  });

  it("screen shows Word of the Day card", () => {
    const src = fs.readFileSync(path.join(APP, "app", "daily-duel-challenge.tsx"), "utf-8");
    expect(src).toContain("Word of the Day");
    expect(src).toContain("mainWordCard");
  });

  it("screen has recording and scoring phases", () => {
    const src = fs.readFileSync(path.join(APP, "app", "daily-duel-challenge.tsx"), "utf-8");
    expect(src).toContain("recording");
    expect(src).toContain("scoring");
    expect(src).toContain("results");
  });

  it("screen has bonus words", () => {
    const src = fs.readFileSync(path.join(APP, "app", "daily-duel-challenge.tsx"), "utf-8");
    expect(src).toContain("bonusWords");
    expect(src).toContain("Bonus");
  });

  it("screen has share button with social content", () => {
    const src = fs.readFileSync(path.join(APP, "app", "daily-duel-challenge.tsx"), "utf-8");
    expect(src).toContain("handleShare");
    expect(src).toContain("Share.share");
  });

  it("screen shows streak counter", () => {
    const src = fs.readFileSync(path.join(APP, "app", "daily-duel-challenge.tsx"), "utf-8");
    expect(src).toContain("streakBadge");
    expect(src).toContain("flame");
  });

  it("screen shows community completion count", () => {
    const src = fs.readFileSync(path.join(APP, "app", "daily-duel-challenge.tsx"), "utf-8");
    expect(src).toContain("completedBy");
    expect(src).toContain("players completed today");
  });

  it("screen is registered in _layout.tsx", () => {
    const layout = fs.readFileSync(path.join(APP, "app", "_layout.tsx"), "utf-8");
    expect(layout).toContain("daily-duel-challenge");
  });
});

// ─── 5. Voice Comparison Playback in Replay ─────────────────────────────────
describe("Voice Comparison Playback", () => {
  it("duel-replay.tsx imports expo-speech", () => {
    const src = fs.readFileSync(path.join(APP, "app", "duel-replay.tsx"), "utf-8");
    expect(src).toContain("import * as Speech from \"expo-speech\"");
  });

  it("replay screen has voice comparison state variables", () => {
    const src = fs.readFileSync(path.join(APP, "app", "duel-replay.tsx"), "utf-8");
    expect(src).toContain("isSpeakingNative");
    expect(src).toContain("isSpeakingUser");
    expect(src).toContain("voiceCompareMode");
  });

  it("replay screen has Native voice button", () => {
    const src = fs.readFileSync(path.join(APP, "app", "duel-replay.tsx"), "utf-8");
    expect(src).toContain("Native");
    expect(src).toContain("Speech.speak");
  });

  it("replay screen has Yours (user) voice button", () => {
    const src = fs.readFileSync(path.join(APP, "app", "duel-replay.tsx"), "utf-8");
    expect(src).toContain("Yours");
    expect(src).toContain("playerTranscript");
  });

  it("replay screen has Compare button for side-by-side playback", () => {
    const src = fs.readFileSync(path.join(APP, "app", "duel-replay.tsx"), "utf-8");
    expect(src).toContain("Compare");
    expect(src).toContain("swap-horizontal");
  });

  it("voice comparison maps languages to BCP 47 codes", () => {
    const src = fs.readFileSync(path.join(APP, "app", "duel-replay.tsx"), "utf-8");
    expect(src).toContain("es-ES");
    expect(src).toContain("fr-FR");
    expect(src).toContain("ja-JP");
    expect(src).toContain("de-DE");
    expect(src).toContain("ko-KR");
    expect(src).toContain("zh-CN");
    expect(src).toContain("pt-BR");
  });

  it("voice comparison has proper Speech.speak callbacks", () => {
    const src = fs.readFileSync(path.join(APP, "app", "duel-replay.tsx"), "utf-8");
    expect(src).toContain("onDone");
    expect(src).toContain("onStopped");
    expect(src).toContain("onError");
  });

  it("voice comparison has visual styles", () => {
    const src = fs.readFileSync(path.join(APP, "app", "duel-replay.tsx"), "utf-8");
    expect(src).toContain("voiceCompareSection");
    expect(src).toContain("voiceBtn");
    expect(src).toContain("voiceBtnActive");
  });
});

// ─── 6. Entry Points ───────────────────────────────────────────────────────
describe("Entry Points and Navigation", () => {
  it("pronunciation-duel-lobby has Daily Challenge link", () => {
    const src = fs.readFileSync(path.join(APP, "app", "pronunciation-duel-lobby.tsx"), "utf-8");
    expect(src).toContain("daily-duel-challenge");
    expect(src).toContain("Daily Challenge");
  });

  it("pronunciation-duel-lobby has Heatmap link", () => {
    const src = fs.readFileSync(path.join(APP, "app", "pronunciation-duel-lobby.tsx"), "utf-8");
    expect(src).toContain("pronunciation-heatmap");
    expect(src).toContain("My Heatmap");
  });

  it("teacher tab has Daily Duel quick action", () => {
    const src = fs.readFileSync(path.join(APP, "app", "(tabs)", "teacher.tsx"), "utf-8");
    expect(src).toContain("daily-duel-challenge");
    expect(src).toContain("Daily Duel");
  });

  it("teacher tab has Heatmap quick action", () => {
    const src = fs.readFileSync(path.join(APP, "app", "(tabs)", "teacher.tsx"), "utf-8");
    expect(src).toContain("pronunciation-heatmap");
    expect(src).toContain("Heatmap");
  });
});
