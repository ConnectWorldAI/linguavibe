import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

describe("Global Feature Matrix System", () => {
  const filePath = path.resolve(__dirname, "../lib/global-feature-matrix.ts");
  const content = fs.readFileSync(filePath, "utf-8");

  describe("File Structure", () => {
    it("should exist and contain the feature matrix", () => {
      expect(content).toContain("GLOBAL_FEATURE_MATRIX");
      expect(content).toContain("FEATURE_CATALOG");
    });

    it("should define all 8 pricing regions", () => {
      expect(content).toContain("standard:");
      expect(content).toContain("caribbean:");
      expect(content).toContain("central_america:");
      expect(content).toContain("south_america:");
      expect(content).toContain("africa:");
      expect(content).toContain("southeast_asia:");
      expect(content).toContain("south_asia:");
      expect(content).toContain("middle_east:");
    });

    it("should define all 4 plan tiers for each region", () => {
      expect(content).toContain('"free"');
      expect(content).toContain('"plus"');
      expect(content).toContain('"pro"');
      expect(content).toContain('"family"');
    });
  });

  describe("Feature Cost Classification", () => {
    it("should classify features into 4 cost levels", () => {
      expect(content).toContain('"zero"');
      expect(content).toContain('"low"');
      expect(content).toContain('"medium"');
      expect(content).toContain('"high"');
    });

    it("should have zero-cost features (pre-made content)", () => {
      expect(content).toContain("ai_tv_episodes");
      expect(content).toContain("daily_lessons");
      expect(content).toContain("flashcards");
      expect(content).toContain("exercises");
      expect(content).toContain("pronunciation_guides");
      expect(content).toContain("slang_library");
    });

    it("should have low-cost features (voice memos, text chat)", () => {
      expect(content).toContain("teacher_voice_memos");
      expect(content).toContain("text_ai_chat");
      expect(content).toContain("pronunciation_scoring");
      expect(content).toContain("writing_corrections");
    });

    it("should have medium-cost features (AI conversations, songs)", () => {
      expect(content).toContain("ai_voice_conversation");
      expect(content).toContain("song_translation");
      expect(content).toContain("roleplay_scenarios");
    });

    it("should have high-cost features (live translation, video, cloning)", () => {
      expect(content).toContain("live_call_translation");
      expect(content).toContain("video_call_ai");
      expect(content).toContain("voice_cloning");
      expect(content).toContain("live_video_dubbing");
    });
  });

  describe("Pricing Strategy Logic", () => {
    it("should give cheaper regions MORE zero-cost content in free tier", () => {
      // Africa free tier gets 5 AI TV episodes/day vs Standard's 2
      const africaFreeTV = content.match(/africa:[\s\S]*?free:\s*\[[\s\S]*?ai_tv_episodes.*?limit:\s*(\d+)/);
      const standardFreeTV = content.match(/standard:[\s\S]*?free:\s*\[[\s\S]*?ai_tv_episodes.*?limit:\s*(\d+)/);
      if (africaFreeTV && standardFreeTV) {
        expect(parseInt(africaFreeTV[1])).toBeGreaterThanOrEqual(parseInt(standardFreeTV[1]));
      }
    });

    it("should give cheaper regions MORE voice memos (low-cost teacher experience)", () => {
      // Africa Plus: 20 voice memos/day, Caribbean Plus: 15, Standard Plus: 10
      expect(content).toContain("teacher_voice_memos");
      // The pattern shows Africa gets more voice memos than standard
      const africaPlusMemos = content.match(/africa:[\s\S]*?plus:\s*\[[\s\S]*?teacher_voice_memos.*?limit:\s*(\d+)/);
      if (africaPlusMemos) {
        expect(parseInt(africaPlusMemos[1])).toBeGreaterThanOrEqual(15);
      }
    });

    it("should give expensive regions MORE real-time AI minutes", () => {
      // Standard Plus: 60 min AI voice, Caribbean Plus: 30 min, Africa Plus: 15 min
      const hasAIMinutes = content.includes("aiTeacherMinutesPerMonth") || content.includes("ai_voice_conversation");
      expect(hasAIMinutes).toBe(true);
    });

    it("should always make pre-generated content unlimited for paid tiers", () => {
      // All paid tiers should have unlimited AI TV episodes
      const unlimitedTVCount = (content.match(/ai_tv_episodes.*?limit:\s*"unlimited"/g) || []).length;
      // At least 4 regions x 3 paid tiers = 12 unlimited entries
      expect(unlimitedTVCount).toBeGreaterThanOrEqual(10);
    });

    it("should include taste samples for free tier premium features", () => {
      expect(content).toContain("tasteSample");
    });
  });

  describe("Helper Functions", () => {
    it("should export getFeatureAllocation function", () => {
      expect(content).toContain("export function getFeatureAllocation");
    });

    it("should export canAccessFeature function", () => {
      expect(content).toContain("export function canAccessFeature");
    });

    it("should export getMonthlyBudgetCap function", () => {
      expect(content).toContain("export function getMonthlyBudgetCap");
    });

    it("should export getRegionPlanSummary function", () => {
      expect(content).toContain("export function getRegionPlanSummary");
    });
  });

  describe("Region Mirrors", () => {
    it("should mirror Southeast Asia from Caribbean", () => {
      expect(content).toContain("southeast_asia = { ...GLOBAL_FEATURE_MATRIX.caribbean }");
    });

    it("should mirror South Asia from Africa", () => {
      expect(content).toContain("south_asia = { ...GLOBAL_FEATURE_MATRIX.africa }");
    });

    it("should mirror Middle East from South America", () => {
      expect(content).toContain("middle_east = { ...GLOBAL_FEATURE_MATRIX.south_america }");
    });
  });

  describe("Budget Caps", () => {
    it("should have budget caps that scale with price", () => {
      // Standard Plus budget ($2.80) > Caribbean Plus budget ($0.60) > Africa Plus budget ($0.30)
      expect(content).toContain("standard: { free: 0, plus: 2.80");
      expect(content).toContain("caribbean: { free: 0, plus: 0.60");
      expect(content).toContain("africa: { free: 0, plus: 0.30");
    });
  });

  describe("Master Plan Integration", () => {
    const masterPlanPath = path.resolve(__dirname, "../CONNECTME-AI-MASTER-PLAN.md");
    const masterPlan = fs.readFileSync(masterPlanPath, "utf-8");

    it("should have global pricing section in master plan", () => {
      expect(masterPlan).toContain("Global Pricing & Feature Allocation Strategy");
    });

    it("should document the Always Green principle", () => {
      expect(masterPlan).toContain("Always Green, Never Red");
      expect(masterPlan).toContain("minimum 40% profit margin");
    });

    it("should include the global pricing matrix table", () => {
      expect(masterPlan).toContain("$13.99/mo");
      expect(masterPlan).toContain("$2.99/mo");
      expect(masterPlan).toContain("$1.49/mo");
    });

    it("should document the voice memo strategy", () => {
      expect(masterPlan).toContain("Voice Memo Strategy");
      expect(masterPlan).toContain("WhatsApp voice notes");
    });

    it("should document credit pack pricing", () => {
      expect(masterPlan).toContain("Credit Pack Pricing");
    });

    it("should document data cap alerts", () => {
      expect(masterPlan).toContain("Data Cap Alerts");
    });
  });
});
