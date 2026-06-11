import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

const readFile = (filePath: string) =>
  fs.readFileSync(path.join(__dirname, "..", filePath), "utf-8");

describe("Onboarding Flow Integration", () => {
  describe("Onboarding routes to placement test", () => {
    const onboarding = readFile("app/onboarding.tsx");

    it("routes to /placement-test after completing onboarding", () => {
      expect(onboarding).toContain('router.replace("/placement-test"');
    });

    it("does NOT route directly to /(tabs) after onboarding", () => {
      // The old direct route to tabs should be replaced
      expect(onboarding).not.toMatch(/router\.replace\("\/\(tabs\)"/);
    });

    it("still saves onboarding preferences before routing", () => {
      expect(onboarding).toContain("@onboarding_complete");
      expect(onboarding).toContain("@target_language");
    });

    it("has haptic feedback on completion", () => {
      expect(onboarding).toContain("NotificationFeedbackType.Success");
    });
  });

  describe("Placement test handles first-time users from onboarding", () => {
    const placementTest = readFile("app/placement-test.tsx");

    it("has a skip button for first-time users", () => {
      expect(placementTest).toContain("handleSkipTest");
      expect(placementTest).toContain("Skip for now");
    });

    it("defaults to A1 when skipping", () => {
      expect(placementTest).toContain('@cefr_level", "A1"');
    });

    it("marks test as skipped when user skips", () => {
      expect(placementTest).toContain("@placement_test_skipped");
    });

    it("routes to /(tabs) after skip (not cloudwave-guide)", () => {
      expect(placementTest).toContain('router.replace("/(tabs)"');
      expect(placementTest).not.toContain("cloudwave-guide");
    });

    it("routes to /(tabs) after completing test for first time", () => {
      // When lastTestDate is null (first time), routes to tabs
      expect(placementTest).toContain('router.replace("/(tabs)" as any)');
    });

    it("routes back when retaking test (has lastTestDate)", () => {
      expect(placementTest).toContain("router.back()");
    });

    it("saves CEFR level to AsyncStorage", () => {
      expect(placementTest).toContain('@cefr_level"');
    });

    it("saves placement test date", () => {
      expect(placementTest).toContain("@placement_test_date");
    });

    it("generates adaptive placement result and learning path", () => {
      expect(placementTest).toContain("generatePlacementResult");
      expect(placementTest).toContain("generateLearningPath");
      expect(placementTest).toContain("savePlacementResult");
      expect(placementTest).toContain("saveLearningPath");
    });

    it("tracks CEFR history array", () => {
      expect(placementTest).toContain("@cefr_history");
    });
  });

  describe("Home screen personalization based on CEFR level", () => {
    const homeScreen = readFile("app/(tabs)/index.tsx");

    it("loads CEFR level from AsyncStorage on mount", () => {
      expect(homeScreen).toContain('@cefr_level"');
      expect(homeScreen).toContain("setCefrLevel");
    });

    it("shows placement test prompt for users who skipped (A1 or no level)", () => {
      expect(homeScreen).toContain("Find Your Level");
      expect(homeScreen).toContain("Take a 10-min placement test");
    });

    it("links placement test prompt to /placement-test", () => {
      expect(homeScreen).toContain('router.push("/placement-test"');
    });

    it("shows CEFR level indicator when level is set", () => {
      expect(homeScreen).toContain("CEFR Level:");
      expect(homeScreen).toContain("cefrLevel");
    });

    it("shows level-based recommendations section", () => {
      expect(homeScreen).toContain("Recommended for");
      expect(homeScreen).toContain("Level-Based Recommendations");
    });

    it("recommends Build Vocabulary for A2/B1 users", () => {
      expect(homeScreen).toContain("Build Vocabulary");
      expect(homeScreen).toContain("FSRS flashcards adapted to your level");
    });

    it("recommends Practice Speaking for B1/B2 users", () => {
      expect(homeScreen).toContain("Practice Speaking");
      expect(homeScreen).toContain("AI conversation partner at");
    });

    it("recommends Challenge Friends for B2/C1/C2 users", () => {
      expect(homeScreen).toContain("Challenge Friends");
      expect(homeScreen).toContain("Compete in vocab duels and grammar races");
    });

    it("recommends Join Study Groups for A2/B1/B2 users", () => {
      expect(homeScreen).toContain("Join Study Groups");
      expect(homeScreen).toContain("Learn together with peers at your level");
    });

    it("links recommendations to correct screens", () => {
      expect(homeScreen).toContain('router.push("/flashcard-srs"');
      expect(homeScreen).toContain('router.push("/voice-conversation"');
      expect(homeScreen).toContain('router.push("/friend-challenges"');
      expect(homeScreen).toContain('router.push("/study-groups"');
    });

    it("shows CEFR history timeline for users with multiple assessments", () => {
      expect(homeScreen).toContain("Level Journey");
      expect(homeScreen).toContain("cefrHistory");
    });

    it("shows retake option on CEFR level card", () => {
      expect(homeScreen).toContain("Retake");
    });
  });

  describe("Root layout auth gate handles onboarding state", () => {
    const rootLayout = readFile("app/_layout.tsx");

    it("checks @onboarding_complete flag", () => {
      expect(rootLayout).toContain("@onboarding_complete");
    });

    it("redirects to /onboarding if not onboarded", () => {
      expect(rootLayout).toContain('router.replace("/onboarding"');
    });

    it("redirects to /signup if not logged in", () => {
      expect(rootLayout).toContain('router.replace("/signup"');
    });
  });
});
