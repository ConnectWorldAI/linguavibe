import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

const appDir = path.resolve(__dirname, "../app");
const libDir = path.resolve(__dirname, "../lib");
const layoutPath = path.join(appDir, "_layout.tsx");

function readFile(filePath: string): string {
  return fs.readFileSync(filePath, "utf-8");
}

function fileExists(filePath: string): boolean {
  return fs.existsSync(filePath);
}

// ─── Daily Challenges Screen ──────────────────────────────────────────────────

describe("Sprint 15: Gamified Daily Challenges", () => {
  const screenPath = path.join(appDir, "daily-challenges.tsx");

  it("screen file exists", () => {
    expect(fileExists(screenPath)).toBe(true);
  });

  it("is registered in root layout", () => {
    const layout = readFile(layoutPath);
    expect(layout).toContain('"daily-challenges"');
  });

  it("exports a default component", () => {
    const src = readFile(screenPath);
    expect(src).toMatch(/export\s+default\s+function/);
  });

  it("has challenge categories and difficulty levels", () => {
    const src = readFile(screenPath);
    expect(src).toContain("ChallengeCategory");
    expect(src).toContain("ChallengeDifficulty");
  });

  it("has XP reward system", () => {
    const src = readFile(screenPath);
    expect(src).toContain("xpReward");
    expect(src).toContain("bonusXP");
  });

  it("persists challenge state with AsyncStorage", () => {
    const src = readFile(screenPath);
    expect(src).toContain("AsyncStorage");
    expect(src).toContain("@linguavibe_daily_challenges");
  });

  it("has daily rotation logic", () => {
    const src = readFile(screenPath);
    expect(src).toContain("pickDailyChallenges");
  });

  it("has streak tracking", () => {
    const src = readFile(screenPath);
    expect(src).toMatch(/streak/i);
  });

  it("has claim reward functionality", () => {
    const src = readFile(screenPath);
    expect(src).toContain("claimReward");
  });

  it("has navigation from home screen", () => {
    const homeSrc = readFile(path.join(appDir, "(tabs)", "index.tsx"));
    expect(homeSrc).toContain("/daily-challenges");
  });
});

// ─── Partner Chat Screen ──────────────────────────────────────────────────────

describe("Sprint 15: In-app Partner Messaging", () => {
  const screenPath = path.join(appDir, "partner-chat.tsx");

  it("screen file exists", () => {
    expect(fileExists(screenPath)).toBe(true);
  });

  it("is registered in root layout", () => {
    const layout = readFile(layoutPath);
    expect(layout).toContain('"partner-chat"');
  });

  it("exports a default component", () => {
    const src = readFile(screenPath);
    expect(src).toMatch(/export\s+default\s+function/);
  });

  it("has partner list and chat message types", () => {
    const src = readFile(screenPath);
    expect(src).toContain("ChatMessage");
    expect(src).toContain("Partner");
  });

  it("has translation toggle feature", () => {
    const src = readFile(screenPath);
    expect(src).toContain("toggleTranslation");
    expect(src).toContain("showTranslation");
  });

  it("has correction mode", () => {
    const src = readFile(screenPath);
    expect(src).toContain("correction");
    expect(src).toContain("sendCorrection");
  });

  it("has quick phrases feature", () => {
    const src = readFile(screenPath);
    expect(src).toMatch(/quick.?phrase/i);
  });

  it("persists chat messages with AsyncStorage", () => {
    const src = readFile(screenPath);
    expect(src).toContain("AsyncStorage");
    expect(src).toContain("PARTNER_CHATS_KEY");
  });

  it("is navigable from language-exchange screen", () => {
    const exchangeSrc = readFile(path.join(appDir, "language-exchange.tsx"));
    expect(exchangeSrc).toContain("/partner-chat");
  });

  it("supports partnerId param from navigation", () => {
    const src = readFile(screenPath);
    expect(src).toContain("useLocalSearchParams");
  });
});

// ─── SRS Integration into Learning Path ───────────────────────────────────────

describe("Sprint 15: Spaced Repetition Review Integration", () => {
  const srsPath = path.join(libDir, "srs.ts");
  const learningPathPath = path.join(appDir, "personalized-learning-path.tsx");
  const srsReviewPath = path.join(appDir, "srs-review.tsx");

  it("SRS library exists with core exports", () => {
    expect(fileExists(srsPath)).toBe(true);
    const src = readFile(srsPath);
    expect(src).toContain("getDueItems");
    expect(src).toContain("reviewItem");
    expect(src).toContain("getDueCount");
    expect(src).toContain("calculateNextReview");
    expect(src).toContain("addToReviewQueue");
  });

  it("SRS review screen exists", () => {
    expect(fileExists(srsReviewPath)).toBe(true);
    const src = readFile(srsReviewPath);
    expect(src).toMatch(/export\s+default\s+function/);
  });

  it("SRS review is registered in root layout", () => {
    const layout = readFile(layoutPath);
    expect(layout).toContain('"srs-review"');
  });

  it("learning path imports getDueCount from SRS lib", () => {
    const src = readFile(learningPathPath);
    expect(src).toContain("getDueCount");
    expect(src).toContain("from \"@/lib/srs\"");
  });

  it("learning path has SRS block detection logic", () => {
    const src = readFile(learningPathPath);
    expect(src).toContain("isSrsBlock");
    expect(src).toContain("Memory");
    expect(src).toContain("Vocabulary");
  });

  it("learning path navigates to srs-review for SRS blocks", () => {
    const src = readFile(learningPathPath);
    expect(src).toContain("router.push(\"/srs-review\")");
  });

  it("learning path shows due count badge on SRS blocks", () => {
    const src = readFile(learningPathPath);
    expect(src).toContain("dueBadge");
    expect(src).toContain("dueCount");
    expect(src).toContain("due");
  });

  it("SRS algorithm implements SM-2 with correct parameters", () => {
    const src = readFile(srsPath);
    // SM-2 ease factor minimum is 1.3
    expect(src).toContain("1.3");
    // Failed reviews (quality < 3) reset
    expect(src).toMatch(/quality\s*<\s*3/);
  });

  it("study blocks include Memory and Vocabulary skills for SRS", () => {
    const src = readFile(learningPathPath);
    // Verify the weekly plan has Memory and Vocabulary blocks
    expect(src).toContain('skill: "Memory"');
    expect(src).toContain('skill: "Vocabulary"');
  });
});
