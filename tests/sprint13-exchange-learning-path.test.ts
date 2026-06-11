import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

const APP_DIR = path.resolve(__dirname, "../app");

describe("Sprint 13: Streak Freeze Enhancement", () => {
  it("streak-protection.tsx has earn freezes section", () => {
    const content = fs.readFileSync(path.join(APP_DIR, "streak-protection.tsx"), "utf-8");
    expect(content).toContain("Earn Free Freezes");
    expect(content).toContain("Complete 5 Daily Goals");
    expect(content).toContain("Refer a Friend");
    expect(content).toContain("7-Day Streak Bonus");
    expect(content).toContain("Weekly Challenge Winner");
    expect(content).toContain("Perfect Karaoke Score");
  });
});

describe("Sprint 13: Language Exchange Matching", () => {
  it("language-exchange.tsx exists with correct structure", () => {
    const filePath = path.join(APP_DIR, "language-exchange.tsx");
    expect(fs.existsSync(filePath)).toBe(true);
    const content = fs.readFileSync(filePath, "utf-8");
    expect(content).toContain("Language Exchange");
    expect(content).toContain("Quick Match");
    expect(content).toContain("ExchangePartner");
    expect(content).toContain("Session Type");
    expect(content).toContain("Browse Partners");
  });

  it("has partner matching with languages and ratings", () => {
    const content = fs.readFileSync(path.join(APP_DIR, "language-exchange.tsx"), "utf-8");
    expect(content).toContain("nativeLanguage");
    expect(content).toContain("learningLanguage");
    expect(content).toContain("rating");
    expect(content).toContain("sessionsCompleted");
    expect(content).toContain("online");
  });

  it("supports voice, video, and text session types", () => {
    const content = fs.readFileSync(path.join(APP_DIR, "language-exchange.tsx"), "utf-8");
    expect(content).toContain("Voice Call");
    expect(content).toContain("Video Call");
    expect(content).toContain("Text Chat");
  });

  it("has favorites and filter functionality", () => {
    const content = fs.readFileSync(path.join(APP_DIR, "language-exchange.tsx"), "utf-8");
    expect(content).toContain("toggleFavorite");
    expect(content).toContain("filterLanguage");
    expect(content).toContain("showOnlineOnly");
    expect(content).toContain("@exchange_favorites");
  });
});

describe("Sprint 13: Personalized Learning Path", () => {
  it("personalized-learning-path.tsx exists with correct structure", () => {
    const filePath = path.join(APP_DIR, "personalized-learning-path.tsx");
    expect(fs.existsSync(filePath)).toBe(true);
    const content = fs.readFileSync(filePath, "utf-8");
    expect(content).toContain("My Learning Path");
    expect(content).toContain("AI-Personalized Plan");
    expect(content).toContain("WeakArea");
    expect(content).toContain("StudyBlock");
    expect(content).toContain("WeeklyGoal");
  });

  it("has AI-detected weak areas with scores and trends", () => {
    const content = fs.readFileSync(path.join(APP_DIR, "personalized-learning-path.tsx"), "utf-8");
    expect(content).toContain("Focus Areas (AI Detected)");
    expect(content).toContain("Listening Comprehension");
    expect(content).toContain("Verb Conjugation");
    expect(content).toContain("Pronunciation (R sounds)");
    expect(content).toContain("improving");
    expect(content).toContain("declining");
    expect(content).toContain("stable");
  });

  it("has weekly goals with progress tracking", () => {
    const content = fs.readFileSync(path.join(APP_DIR, "personalized-learning-path.tsx"), "utf-8");
    expect(content).toContain("This Week's Goals");
    expect(content).toContain("Study Time");
    expect(content).toContain("New Words");
    expect(content).toContain("Speaking");
    expect(content).toContain("Lessons");
  });

  it("has daily schedule with day selector and completable blocks", () => {
    const content = fs.readFileSync(path.join(APP_DIR, "personalized-learning-path.tsx"), "utf-8");
    expect(content).toContain("Daily Schedule");
    expect(content).toContain("handleToggleBlock");
    expect(content).toContain("selectedDay");
    expect(content).toContain("Mon");
    expect(content).toContain("Tue");
    expect(content).toContain("Wed");
  });

  it("has AI insight section with regenerate capability", () => {
    const content = fs.readFileSync(path.join(APP_DIR, "personalized-learning-path.tsx"), "utf-8");
    expect(content).toContain("AI Insight");
    expect(content).toContain("handleRegenerate");
    expect(content).toContain("Regenerating");
    expect(content).toContain("Adjust Plan");
  });
});

describe("Sprint 13: Screen Registration", () => {
  it("language-exchange is registered in _layout.tsx", () => {
    const layout = fs.readFileSync(path.join(APP_DIR, "_layout.tsx"), "utf-8");
    expect(layout).toContain('name="language-exchange"');
  });

  it("personalized-learning-path is registered in _layout.tsx", () => {
    const layout = fs.readFileSync(path.join(APP_DIR, "_layout.tsx"), "utf-8");
    expect(layout).toContain('name="personalized-learning-path"');
  });
});
