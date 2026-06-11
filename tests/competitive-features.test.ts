/**
 * Tests for 7 Competitive Differentiator Features
 * Validates that all feature screens exist, export default components,
 * and that settings navigation routes are properly configured.
 */
import { describe, it, expect } from "vitest";
import { existsSync } from "fs";
import { readFileSync } from "fs";
import path from "path";

const APP_DIR = path.resolve(__dirname, "../app");

describe("Competitive Differentiator Features", () => {
  const features = [
    { file: "ai-partners.tsx", name: "AI Conversation Partners" },
    { file: "voice-rooms.tsx", name: "Live Voice Rooms" },
    { file: "immersion-mode.tsx", name: "AI-Powered Immersion Mode" },
    { file: "cultural-intelligence.tsx", name: "Cultural Intelligence Engine" },
    { file: "streak-battles.tsx", name: "Streak Battles & Wagering" },
    { file: "speech-coach.tsx", name: "AI Speech Coach with Accent Training" },
    { file: "language-exchange.tsx", name: "Language Exchange Marketplace" },
  ];

  features.forEach(({ file, name }) => {
    describe(name, () => {
      it(`screen file exists: ${file}`, () => {
        const filePath = path.join(APP_DIR, file);
        expect(existsSync(filePath)).toBe(true);
      });

      it(`exports a default component`, () => {
        const filePath = path.join(APP_DIR, file);
        const content = readFileSync(filePath, "utf-8");
        expect(content).toMatch(/export default function/);
      });

      it(`uses ScreenContainer or SafeAreaView for safe layout`, () => {
        const filePath = path.join(APP_DIR, file);
        const content = readFileSync(filePath, "utf-8");
        const hasSafeLayout = content.includes("ScreenContainer") || content.includes("SafeAreaView");
        expect(hasSafeLayout).toBe(true);
      });

      it(`has a back navigation button`, () => {
        const filePath = path.join(APP_DIR, file);
        const content = readFileSync(filePath, "utf-8");
        const hasBack = content.includes("router.back()") || content.includes("chevron-back");
        expect(hasBack).toBe(true);
      });
    });
  });

  describe("Settings Integration", () => {
    it("settings.tsx contains routes to all 7 competitive features", () => {
      const settingsPath = path.join(APP_DIR, "settings.tsx");
      const content = readFileSync(settingsPath, "utf-8");

      expect(content).toContain("/ai-partners");
      expect(content).toContain("/voice-rooms");
      expect(content).toContain("/immersion-mode");
      expect(content).toContain("/cultural-intelligence");
      expect(content).toContain("/streak-battles");
      expect(content).toContain("/speech-coach");
      expect(content).toContain("/language-exchange");
    });
  });

  describe("AI Partners - Character System", () => {
    it("defines multiple AI character personalities", () => {
      const content = readFileSync(path.join(APP_DIR, "ai-partners.tsx"), "utf-8");
      // Should have multiple characters defined
      const characterMatches = content.match(/name:/g);
      expect(characterMatches && characterMatches.length >= 3).toBe(true);
    });

    it("includes personality traits for characters", () => {
      const content = readFileSync(path.join(APP_DIR, "ai-partners.tsx"), "utf-8");
      const hasPersonality = content.includes("personality") || content.includes("style") || content.includes("trait");
      expect(hasPersonality).toBe(true);
    });
  });

  describe("Immersion Mode - Notification System", () => {
    it("defines micro-lesson notification schedule", () => {
      const content = readFileSync(path.join(APP_DIR, "immersion-mode.tsx"), "utf-8");
      const hasSchedule = content.includes("schedule") || content.includes("frequency") || content.includes("notification");
      expect(hasSchedule).toBe(true);
    });

    it("has toggle controls for immersion settings", () => {
      const content = readFileSync(path.join(APP_DIR, "immersion-mode.tsx"), "utf-8");
      const hasToggle = content.includes("Switch") || content.includes("toggle") || content.includes("enabled");
      expect(hasToggle).toBe(true);
    });
  });

  describe("Cultural Intelligence - Knowledge Base", () => {
    it("covers multiple cultural categories", () => {
      const content = readFileSync(path.join(APP_DIR, "cultural-intelligence.tsx"), "utf-8");
      const hasCategories = content.includes("taboo") || content.includes("etiquette") || content.includes("slang");
      expect(hasCategories).toBe(true);
    });

    it("supports multiple regions/countries", () => {
      const content = readFileSync(path.join(APP_DIR, "cultural-intelligence.tsx"), "utf-8");
      // Should reference multiple countries/regions
      const regionIndicators = ["Japan", "France", "Brazil", "Mexico", "Korea"].filter(r => content.includes(r));
      expect(regionIndicators.length >= 3).toBe(true);
    });
  });

  describe("Streak Battles - Competition System", () => {
    it("includes wagering/betting mechanics", () => {
      const content = readFileSync(path.join(APP_DIR, "streak-battles.tsx"), "utf-8");
      const hasWager = content.includes("wager") || content.includes("bet") || content.includes("stake") || content.includes("coins");
      expect(hasWager).toBe(true);
    });

    it("has live challenge/battle UI", () => {
      const content = readFileSync(path.join(APP_DIR, "streak-battles.tsx"), "utf-8");
      const hasBattle = content.includes("challenge") || content.includes("battle") || content.includes("opponent");
      expect(hasBattle).toBe(true);
    });
  });

  describe("Speech Coach - Pronunciation Analysis", () => {
    it("includes spectrogram visualization", () => {
      const content = readFileSync(path.join(APP_DIR, "speech-coach.tsx"), "utf-8");
      const hasSpectrogram = content.includes("spectrogram") || content.includes("Spectrogram") || content.includes("spectrogramBar");
      expect(hasSpectrogram).toBe(true);
    });

    it("has phoneme-level scoring", () => {
      const content = readFileSync(path.join(APP_DIR, "speech-coach.tsx"), "utf-8");
      const hasPhoneme = content.includes("phoneme") || content.includes("Phoneme");
      expect(hasPhoneme).toBe(true);
    });

    it("supports multiple accent targets", () => {
      const content = readFileSync(path.join(APP_DIR, "speech-coach.tsx"), "utf-8");
      const hasAccents = content.includes("accent") || content.includes("Accent") || content.includes("ACCENT");
      expect(hasAccents).toBe(true);
    });
  });

  describe("Language Exchange - Matching System", () => {
    it("includes partner matching with language pairs", () => {
      const content = readFileSync(path.join(APP_DIR, "language-exchange.tsx"), "utf-8");
      const hasMatching = content.includes("nativeLanguage") || content.includes("native");
      expect(hasMatching).toBe(true);
    });

    it("has AI mediation concept", () => {
      const content = readFileSync(path.join(APP_DIR, "language-exchange.tsx"), "utf-8");
      const hasAI = content.includes("AI") || content.includes("mediat") || content.includes("timer") || content.includes("balanced");
      expect(hasAI).toBe(true);
    });

    it("includes rating/review system", () => {
      const content = readFileSync(path.join(APP_DIR, "language-exchange.tsx"), "utf-8");
      const hasRating = content.includes("rating") || content.includes("star");
      expect(hasRating).toBe(true);
    });
  });
});
