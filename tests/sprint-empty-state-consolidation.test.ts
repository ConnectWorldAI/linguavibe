import { describe, it, expect, beforeAll } from "vitest";
import * as fs from "fs";
import * as path from "path";

const HOME_SCREEN = fs.readFileSync(
  path.resolve(__dirname, "../app/(tabs)/index.tsx"),
  "utf-8"
);

describe("New User Empty State", () => {
  it("has isNewUser state variable", () => {
    expect(HOME_SCREEN).toContain("isNewUser");
    expect(HOME_SCREEN).toContain("setIsNewUser");
  });

  it("detects new users by checking AsyncStorage for lessons_completed", () => {
    expect(HOME_SCREEN).toContain("@lessons_completed");
  });

  it("renders welcome card when isNewUser is true", () => {
    expect(HOME_SCREEN).toContain("newUserWelcome");
    expect(HOME_SCREEN).toContain("Welcome to LinguaVibe!");
    expect(HOME_SCREEN).toContain("Start your language journey");
  });

  it("has three action buttons for new users", () => {
    expect(HOME_SCREEN).toContain("Take Level Test");
    expect(HOME_SCREEN).toContain("Start a Lesson");
    expect(HOME_SCREEN).toContain("Try a Conversation");
  });

  it("action buttons navigate to correct routes", () => {
    expect(HOME_SCREEN).toContain("/level-assessment");
    expect(HOME_SCREEN).toContain("/lessons");
    expect(HOME_SCREEN).toContain("/conversation-sim");
  });

  it("has dismiss button for returning users", () => {
    expect(HOME_SCREEN).toContain("I've used this before");
    expect(HOME_SCREEN).toContain("newUserDismiss");
  });

  it("hides Try Free Call CTA when user is new", () => {
    expect(HOME_SCREEN).toContain("{!isNewUser && (");
  });

  it("has proper styles for new user welcome card", () => {
    expect(HOME_SCREEN).toContain("newUserWelcome:");
    expect(HOME_SCREEN).toContain("newUserIconCircle:");
    expect(HOME_SCREEN).toContain("newUserTitle:");
    expect(HOME_SCREEN).toContain("newUserSubtitle:");
    expect(HOME_SCREEN).toContain("newUserActions:");
    expect(HOME_SCREEN).toContain("newUserActionBtn:");
    expect(HOME_SCREEN).toContain("newUserActionText:");
    expect(HOME_SCREEN).toContain("newUserDismissText:");
  });
});

describe("Consolidated Explore Categories", () => {
  it("has unified EXPLORE_CATEGORIES array", () => {
    expect(HOME_SCREEN).toContain("Unified feature categories");
    expect(HOME_SCREEN).toContain("const EXPLORE_CATEGORIES = [");
  });

  it("Phase 1 and Phase 2 features are marked as legacy", () => {
    expect(HOME_SCREEN).toContain("Legacy Phase 1 features (now merged into categories)");
  });

  it("no longer renders Phase 1 and Phase 2 sections separately", () => {
    expect(HOME_SCREEN).not.toContain("Phase 1 — Available Now");
    expect(HOME_SCREEN).not.toContain("Connect • Practice • Grow");
  });

  it("has the unified section header", () => {
    expect(HOME_SCREEN).toContain("All features in one place");
    expect(HOME_SCREEN).toContain("UNIFIED FEATURE CATEGORIES");
  });

  it("includes Learning & Lessons category with key items", () => {
    const learningSection = HOME_SCREEN.includes('"learning"') &&
      HOME_SCREEN.includes('"Learning & Lessons"');
    expect(learningSection).toBe(true);
    expect(HOME_SCREEN).toContain('"Conversation Sim"');
    expect(HOME_SCREEN).toContain('"Voice Practice"');
    expect(HOME_SCREEN).toContain('"Lessons"');
  });

  it("includes Communication category (formerly Phase 2)", () => {
    const commSection = HOME_SCREEN.includes('"communication"') &&
      HOME_SCREEN.includes('"Communication"');
    expect(commSection).toBe(true);
    expect(HOME_SCREEN).toContain('"Messaging"');
    expect(HOME_SCREEN).toContain('"VoIP Calling"');
    expect(HOME_SCREEN).toContain('"AI Pen Pal"');
  });

  it("includes all 9 categories", () => {
    const categories = [
      "learning", "progress", "practice", "communication",
      "entertainment", "social", "explore-world", "games", "tools"
    ];
    categories.forEach((cat) => {
      expect(HOME_SCREEN).toContain(`id: "${cat}"`);
    });
  });

  it("shows first 3 categories by default with Show More button", () => {
    expect(HOME_SCREEN).toContain("showAllExplore ? EXPLORE_CATEGORIES.length : 3");
    expect(HOME_SCREEN).toContain("Show Less");
  });

  it("has Show More button with correct count", () => {
    expect(HOME_SCREEN).toContain("EXPLORE_CATEGORIES.length - 3");
  });

  it("includes Progress & Goals category with all report features", () => {
    expect(HOME_SCREEN).toContain('"Progress & Goals"');
    expect(HOME_SCREEN).toContain('"Report Card"');
    expect(HOME_SCREEN).toContain('"Weekly Goals"');
    expect(HOME_SCREEN).toContain('"Streak Shield"');
    expect(HOME_SCREEN).toContain('"Past Reports"');
    expect(HOME_SCREEN).toContain('"Compare Weeks"');
    expect(HOME_SCREEN).toContain('"Export Report"');
  });

  it("includes Practice & Drills category with pronunciation features", () => {
    expect(HOME_SCREEN).toContain('"Practice & Drills"');
    expect(HOME_SCREEN).toContain('"Phoneme Drill"');
    expect(HOME_SCREEN).toContain('"Pronunciation Timeline"');
    expect(HOME_SCREEN).toContain('"Pronunciation Score"');
    expect(HOME_SCREEN).toContain('"Mouth Placement"');
  });

  it("includes Explore & Travel category with cultural features", () => {
    expect(HOME_SCREEN).toContain('"Explore & Travel"');
    expect(HOME_SCREEN).toContain('"City Exploration"');
    expect(HOME_SCREEN).toContain('"Cultural Calendar"');
    expect(HOME_SCREEN).toContain('"Trending Vocab"');
  });

  it("includes Tools & Settings category", () => {
    expect(HOME_SCREEN).toContain('"Tools & Settings"');
    expect(HOME_SCREEN).toContain('"Quick Translate"');
    expect(HOME_SCREEN).toContain('"Offline Mode"');
    expect(HOME_SCREEN).toContain('"Smart Notifications"');
  });

  it("keeps the flat EXPLORE_FEATURES list for backward compat", () => {
    expect(HOME_SCREEN).toContain("EXPLORE_CATEGORIES.flatMap((cat) => cat.items)");
  });
});
