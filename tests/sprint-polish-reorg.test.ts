/**
 * Tests for Sprint: Polish Core Flows & Reorganize Home Screen
 *
 * Validates:
 * 1. Home screen EXPLORE_CATEGORIES structure (categorized, show more/less)
 * 2. Lessons screen has onPress navigation to lesson-detail
 * 3. Voice conversation summary has "View Report Card" button
 * 4. Conversation-sim navigates to session-summary after ending
 * 5. Core flow connectivity: onboarding → placement-test → home → lessons/conversation → report card
 */
import { describe, it, expect, beforeAll } from "vitest";
import * as fs from "fs";
import * as path from "path";

const APP_DIR = path.resolve(__dirname, "..");

function readFile(relativePath: string): string {
  return fs.readFileSync(path.join(APP_DIR, relativePath), "utf-8");
}

describe("Home Screen Reorganization", () => {
  let homeScreen: string;

  beforeAll(() => {
    homeScreen = readFile("app/(tabs)/index.tsx");
  });

  it("defines EXPLORE_CATEGORIES as a categorized array", () => {
    expect(homeScreen).toContain("const EXPLORE_CATEGORIES = [");
    // Each category should have id, title, icon, items
    expect(homeScreen).toMatch(/id:\s*["']learning/);
    expect(homeScreen).toMatch(/id:\s*["']progress/);
    expect(homeScreen).toMatch(/id:\s*["']practice/);
  });

  it("renders categories with a Show More / Show Less toggle", () => {
    expect(homeScreen).toContain("showAllExplore");
    expect(homeScreen).toContain("setShowAllExplore(true)");
    expect(homeScreen).toContain("setShowAllExplore(false)");
    expect(homeScreen).toContain("Show Less");
  });

  it("shows only first 3 categories by default", () => {
    expect(homeScreen).toContain("EXPLORE_CATEGORIES.slice(0, showAllExplore ? EXPLORE_CATEGORIES.length : 3)");
  });

  it("has category header with title, icon, and count", () => {
    expect(homeScreen).toContain("exploreCategoryHeader");
    expect(homeScreen).toContain("exploreCategoryTitle");
    expect(homeScreen).toContain("exploreCategoryCount");
  });

  it("renders explore items within each category grid", () => {
    expect(homeScreen).toContain("category.items.map((item)");
    expect(homeScreen).toContain("router.push(item.route as any)");
  });

  it("has styles for category blocks and show more button", () => {
    expect(homeScreen).toContain("exploreCategoryBlock:");
    expect(homeScreen).toContain("showMoreBtn:");
    expect(homeScreen).toContain("showMoreText:");
  });
});

describe("Lessons Screen Navigation Fix", () => {
  let lessonsScreen: string;

  beforeAll(() => {
    lessonsScreen = readFile("app/lessons.tsx");
  });

  it("has onPress handler on lesson category cards", () => {
    expect(lessonsScreen).toContain('onPress={() => router.push("/lesson-detail"');
  });

  it("imports router from expo-router", () => {
    expect(lessonsScreen).toContain("router");
    expect(lessonsScreen).toContain("expo-router");
  });
});

describe("Voice Conversation Summary - Report Card Link", () => {
  let voiceScreen: string;

  beforeAll(() => {
    voiceScreen = readFile("app/voice-conversation.tsx");
  });

  it("has a View Report Card button in the summary view", () => {
    expect(voiceScreen).toContain("View Report Card");
    expect(voiceScreen).toContain('router.push("/progress-report-card"');
  });

  it("has Back to Topics as primary action", () => {
    expect(voiceScreen).toContain("Back to Topics");
  });

  it("renders the report card button with outline style", () => {
    expect(voiceScreen).toContain('backgroundColor: "transparent"');
    expect(voiceScreen).toContain("borderColor: colors.primary");
  });
});

describe("Conversation Sim - Session Summary Navigation", () => {
  let convoSim: string;

  beforeAll(() => {
    convoSim = readFile("app/conversation-sim.tsx");
  });

  it("navigates to session-summary after ending conversation", () => {
    expect(convoSim).toContain('router.push("/session-summary"');
  });

  it("calls onSessionEnd before navigation", () => {
    const endIdx = convoSim.indexOf('onSessionEnd("conversation")');
    const navIdx = convoSim.indexOf('router.push("/session-summary"');
    expect(endIdx).toBeGreaterThan(-1);
    expect(navIdx).toBeGreaterThan(-1);
    expect(endIdx).toBeLessThan(navIdx);
  });
});

describe("Core Flow Connectivity", () => {
  it("onboarding completes and routes to placement-test", () => {
    const onboarding = readFile("app/onboarding.tsx");
    expect(onboarding).toContain('@onboarding_complete');
    expect(onboarding).toContain('router.replace("/placement-test"');
  });

  it("placement-test can route to home tabs", () => {
    const placementTest = readFile("app/placement-test.tsx");
    expect(placementTest).toContain('router.replace("/(tabs)"');
  });

  it("home screen has entry points to lessons and conversations", () => {
    const home = readFile("app/(tabs)/index.tsx");
    expect(home).toContain('"/lessons"');
    expect(home).toContain('"/conversation-sim"');
    expect(home).toContain('"/voice-conversation"');
  });

  it("home screen has entry point to progress report card", () => {
    const home = readFile("app/(tabs)/index.tsx");
    expect(home).toContain('"/progress-report-card"');
  });

  it("progress-report-card has navigation to past reports and export", () => {
    const reportCard = readFile("app/progress-report-card.tsx");
    expect(reportCard).toContain('"/view-past-reports"');
    expect(reportCard).toContain('"/export-report"');
  });

  it("root layout guards onboarding for new users", () => {
    const layout = readFile("app/_layout.tsx");
    expect(layout).toContain("ONBOARDING_COMPLETE_KEY");
    expect(layout).toContain('router.replace("/onboarding"');
  });
});
