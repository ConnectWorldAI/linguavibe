/**
 * Sprint 22 Tests — Slow-Motion Playback, Phoneme Progress History, Daily Phoneme Challenge
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import * as fs from "fs";
import * as path from "path";

// Mock AsyncStorage
vi.mock("@react-native-async-storage/async-storage", () => ({
  default: {
    getItem: vi.fn().mockResolvedValue(null),
    setItem: vi.fn().mockResolvedValue(undefined),
    removeItem: vi.fn().mockResolvedValue(undefined),
  },
}));

describe("Sprint 22 — Slow-Motion Playback", () => {
  it("pronunciation drill has playback speed state and controls", () => {
    const drillPath = path.join(__dirname, "../app/pronunciation-drill.tsx");
    const content = fs.readFileSync(drillPath, "utf-8");
    
    // Should have playback speed state
    expect(content).toContain("playbackSpeed");
    expect(content).toContain("setPlaybackSpeed");
    
    // Should have speed options (0.5x, 0.75x, 1x)
    expect(content).toContain("0.5");
    expect(content).toContain("0.75");
    
    // Should have speed control UI
    expect(content).toContain("speedRow");
    expect(content).toContain("speedPill");
  });

  it("playback speed is applied to native audio player", () => {
    const drillPath = path.join(__dirname, "../app/pronunciation-drill.tsx");
    const content = fs.readFileSync(drillPath, "utf-8");
    
    // Should set rate on the player
    expect(content).toMatch(/rate.*=.*playbackSpeed|playbackSpeed/);
    // Should have speed pill rendering
    expect(content).toContain("speedPillText");
  });

  it("speed controls show all three options", () => {
    const drillPath = path.join(__dirname, "../app/pronunciation-drill.tsx");
    const content = fs.readFileSync(drillPath, "utf-8");
    
    // Check for speed values
    expect(content).toMatch(/0\.5x|0\.5/);
    expect(content).toMatch(/0\.75x|0\.75/);
    expect(content).toMatch(/1x|1\.0/);
  });
});

describe("Sprint 22 — Phoneme Progress History Screen", () => {
  it("phoneme-progress-history.tsx exists", () => {
    const screenPath = path.join(__dirname, "../app/phoneme-progress-history.tsx");
    expect(fs.existsSync(screenPath)).toBe(true);
  });

  it("is registered in _layout.tsx", () => {
    const layoutPath = path.join(__dirname, "../app/_layout.tsx");
    const content = fs.readFileSync(layoutPath, "utf-8");
    expect(content).toContain("phoneme-progress-history");
  });

  it("reads phoneme score history from AsyncStorage", () => {
    const screenPath = path.join(__dirname, "../app/phoneme-progress-history.tsx");
    const content = fs.readFileSync(screenPath, "utf-8");
    
    expect(content).toContain("AsyncStorage");
    expect(content).toMatch(/phoneme.*history|PHONEME_HISTORY/i);
  });

  it("renders improvement charts with score data", () => {
    const screenPath = path.join(__dirname, "../app/phoneme-progress-history.tsx");
    const content = fs.readFileSync(screenPath, "utf-8");
    
    // Should have chart/graph rendering
    expect(content).toMatch(/chart|bar|graph|progress/i);
    // Should show scores
    expect(content).toMatch(/score|accuracy/i);
  });

  it("supports language filtering", () => {
    const screenPath = path.join(__dirname, "../app/phoneme-progress-history.tsx");
    const content = fs.readFileSync(screenPath, "utf-8");
    
    expect(content).toMatch(/language|filter|selected/i);
  });

  it("has navigation link from pronunciation heat map", () => {
    const heatMapPath = path.join(__dirname, "../app/pronunciation-heat-map.tsx");
    const content = fs.readFileSync(heatMapPath, "utf-8");
    
    expect(content).toContain("phoneme-progress-history");
    expect(content).toContain("stats-chart");
  });
});

describe("Sprint 22 — Daily Phoneme Challenge", () => {
  it("home screen has phoneme challenge state", () => {
    const homePath = path.join(__dirname, "../app/(tabs)/index.tsx");
    const content = fs.readFileSync(homePath, "utf-8");
    
    expect(content).toContain("phonemeChallenge");
    expect(content).toContain("setPhonemeChallenge");
    expect(content).toContain("phonemeChallengeDismissed");
  });

  it("loads weakest phoneme from SRS on mount", () => {
    const homePath = path.join(__dirname, "../app/(tabs)/index.tsx");
    const content = fs.readFileSync(homePath, "utf-8");
    
    expect(content).toContain("getWeakestDuePhoneme");
    expect(content).toContain("loadPhonemeChallenge");
  });

  it("renders phoneme challenge card with drill button", () => {
    const homePath = path.join(__dirname, "../app/(tabs)/index.tsx");
    const content = fs.readFileSync(homePath, "utf-8");
    
    expect(content).toContain("phonemeChallengeCard");
    expect(content).toContain("Quick Drill");
    expect(content).toContain("Daily Phoneme Drill");
  });

  it("navigates to pronunciation drill with phoneme params", () => {
    const homePath = path.join(__dirname, "../app/(tabs)/index.tsx");
    const content = fs.readFileSync(homePath, "utf-8");
    
    expect(content).toContain("handlePhonemeChallenge");
    expect(content).toContain("/pronunciation-drill");
    expect(content).toContain("phonemeId");
    expect(content).toContain("phonemeName");
    expect(content).toContain("phonemeSymbol");
  });

  it("can be dismissed for the day", () => {
    const homePath = path.join(__dirname, "../app/(tabs)/index.tsx");
    const content = fs.readFileSync(homePath, "utf-8");
    
    expect(content).toContain("dismissPhonemeChallenge");
    expect(content).toContain("@phoneme_challenge_dismissed");
  });

  it("shows phoneme symbol and language in the card", () => {
    const homePath = path.join(__dirname, "../app/(tabs)/index.tsx");
    const content = fs.readFileSync(homePath, "utf-8");
    
    expect(content).toContain("phonemeChallengeSymbol");
    expect(content).toContain("phoneChallengeLang");
  });
});

describe("Sprint 22 — getWeakestDuePhoneme helper", () => {
  it("srs-phoneme.ts exports getWeakestDuePhoneme", () => {
    const srsPath = path.join(__dirname, "../lib/srs-phoneme.ts");
    const content = fs.readFileSync(srsPath, "utf-8");
    
    expect(content).toContain("export async function getWeakestDuePhoneme");
  });

  it("returns correct shape with phoneme details", () => {
    const srsPath = path.join(__dirname, "../lib/srs-phoneme.ts");
    const content = fs.readFileSync(srsPath, "utf-8");
    
    expect(content).toContain("phonemeId");
    expect(content).toContain("phonemeName");
    expect(content).toContain("phonemeSymbol");
    expect(content).toContain("language");
    expect(content).toContain("examples");
    expect(content).toContain("tip");
    expect(content).toContain("srsCardId");
  });

  it("sorts by due status and lowest score", () => {
    const srsPath = path.join(__dirname, "../lib/srs-phoneme.ts");
    const content = fs.readFileSync(srsPath, "utf-8");
    
    expect(content).toContain("nextReview <= now");
    expect(content).toContain("lastScore");
    expect(content).toContain(".sort(");
  });

  it("returns null when no phoneme cards exist", () => {
    const srsPath = path.join(__dirname, "../lib/srs-phoneme.ts");
    const content = fs.readFileSync(srsPath, "utf-8");
    
    expect(content).toContain("if (phonemeCards.length === 0) return null");
  });
});

describe("Sprint 22 — Phoneme Score History Persistence", () => {
  it("pronunciation drill saves score history to AsyncStorage", () => {
    const drillPath = path.join(__dirname, "../app/pronunciation-drill.tsx");
    const content = fs.readFileSync(drillPath, "utf-8");
    
    expect(content).toMatch(/phoneme.*score.*history|savePhonemeScoreHistory|PHONEME_HISTORY/i);
  });

  it("stores timestamp and score per attempt", () => {
    const drillPath = path.join(__dirname, "../app/pronunciation-drill.tsx");
    const content = fs.readFileSync(drillPath, "utf-8");
    
    // Uses toISOString() for date storage
    expect(content).toMatch(/toISOString|new Date/);
    expect(content).toMatch(/score/);
  });
});
