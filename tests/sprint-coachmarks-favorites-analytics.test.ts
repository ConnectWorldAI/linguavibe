import { describe, it, expect, beforeAll } from "vitest";
import * as fs from "fs";
import * as path from "path";

const APP_DIR = path.resolve(__dirname, "..");

// ─── COACH MARKS OVERLAY ─────────────────────────────────────────────────────

describe("Coach Marks Overlay", () => {
  let coachMarksSource: string;

  beforeAll(() => {
    coachMarksSource = fs.readFileSync(
      path.join(APP_DIR, "components/coach-marks-overlay.tsx"),
      "utf-8"
    );
  });

  it("exports CoachMarksOverlay component and hasSeenCoachMarks function", () => {
    expect(coachMarksSource).toContain("export function CoachMarksOverlay");
    expect(coachMarksSource).toContain("export async function hasSeenCoachMarks");
  });

  it("has 3 coach mark steps", () => {
    const stepMatches = coachMarksSource.match(/step.*===.*[0-2]|currentStep.*[0-2]/g);
    expect(stepMatches).not.toBeNull();
    expect(coachMarksSource).toContain("currentStep");
  });

  it("persists dismissal to AsyncStorage", () => {
    expect(coachMarksSource).toContain("AsyncStorage");
    expect(coachMarksSource).toContain("@connectworld_coach_marks_seen");
  });

  it("has visible prop to control display", () => {
    expect(coachMarksSource).toContain("visible");
  });

  it("has onDismiss callback", () => {
    expect(coachMarksSource).toContain("onDismiss");
  });

  it("has Next and Skip buttons", () => {
    expect(coachMarksSource).toContain("Next");
    expect(coachMarksSource).toContain("Skip");
  });

  it("uses haptics for step transitions", () => {
    expect(coachMarksSource).toContain("Haptics");
  });

  it("has animated overlay with backdrop", () => {
    expect(coachMarksSource).toContain("Animated");
  });
});

describe("Coach Marks Integration in Home Screen", () => {
  let homeSource: string;

  beforeAll(() => {
    homeSource = fs.readFileSync(
      path.join(APP_DIR, "app/(tabs)/index.tsx"),
      "utf-8"
    );
  });

  it("imports CoachMarksOverlay and hasSeenCoachMarks", () => {
    expect(homeSource).toContain("CoachMarksOverlay");
    expect(homeSource).toContain("hasSeenCoachMarks");
  });

  it("has showCoachMarks state variable", () => {
    expect(homeSource).toContain("showCoachMarks");
    expect(homeSource).toContain("setShowCoachMarks");
  });

  it("renders CoachMarksOverlay component", () => {
    expect(homeSource).toContain("<CoachMarksOverlay");
  });
});

// ─── FAVORITES SYSTEM ────────────────────────────────────────────────────────

describe("Favorites Storage Module", () => {
  let favSource: string;

  beforeAll(() => {
    favSource = fs.readFileSync(
      path.join(APP_DIR, "lib/favorites-storage.ts"),
      "utf-8"
    );
  });

  it("exports toggleFavorite function", () => {
    expect(favSource).toContain("export async function toggleFavorite");
  });

  it("exports getFavorites function", () => {
    expect(favSource).toContain("export async function getFavorites");
  });

  it("exports isFavorite function", () => {
    expect(favSource).toContain("export async function isFavorite");
  });

  it("uses AsyncStorage with a favorites key", () => {
    expect(favSource).toContain("AsyncStorage");
    expect(favSource).toContain("@connectworld_favorites");
  });

  it("stores favorite items with id, title, icon, and route", () => {
    expect(favSource).toContain("id");
    expect(favSource).toContain("title");
    expect(favSource).toContain("icon");
    expect(favSource).toContain("route");
  });
});

describe("Favorites Section Component", () => {
  let favSectionSource: string;

  beforeAll(() => {
    favSectionSource = fs.readFileSync(
      path.join(APP_DIR, "components/favorites-section.tsx"),
      "utf-8"
    );
  });

  it("exports FavoritesSection component", () => {
    expect(favSectionSource).toContain("export function FavoritesSection");
  });

  it("imports getFavorites from favorites-storage", () => {
    expect(favSectionSource).toContain("getFavorites");
  });

  it("navigates to favorite route on tap", () => {
    expect(favSectionSource).toContain("router.push");
  });

  it("shows pinned favorites with icons", () => {
    expect(favSectionSource).toContain("Ionicons");
  });

  it("returns null when no favorites exist", () => {
    expect(favSectionSource).toContain("null");
  });

  it("has a refresh trigger prop for re-rendering", () => {
    expect(favSectionSource).toContain("refreshTrigger");
  });
});

describe("Favorites Integration in Home Screen", () => {
  let homeSource: string;

  beforeAll(() => {
    homeSource = fs.readFileSync(
      path.join(APP_DIR, "app/(tabs)/index.tsx"),
      "utf-8"
    );
  });

  it("imports FavoritesSection component", () => {
    expect(homeSource).toContain("FavoritesSection");
  });

  it("imports toggleFavorite from favorites-storage", () => {
    expect(homeSource).toContain("toggleFavorite");
  });

  it("has favRefresh state for triggering re-renders", () => {
    expect(homeSource).toContain("favRefresh");
  });

  it("renders FavoritesSection with refreshTrigger", () => {
    expect(homeSource).toContain("<FavoritesSection");
    expect(homeSource).toContain("refreshTrigger");
  });

  it("has long-press handler on explore items to toggle favorites", () => {
    expect(homeSource).toContain("onLongPress");
    expect(homeSource).toContain("toggleFavorite");
  });
});

// ─── ANALYTICS DASHBOARD ENHANCEMENT ─────────────────────────────────────────

describe("Analytics Dashboard - Most Used Features Section", () => {
  let dashSource: string;

  beforeAll(() => {
    dashSource = fs.readFileSync(
      path.join(APP_DIR, "app/analytics-dashboard.tsx"),
      "utf-8"
    );
  });

  it("has a Most Used Features section", () => {
    expect(dashSource).toContain("Most Used Features");
  });

  it("shows feature usage with progress bars", () => {
    expect(dashSource).toContain("featureEntries");
    expect(dashSource).toContain("maxCount");
  });

  it("displays feature count with multiplier symbol", () => {
    expect(dashSource).toContain("×");
  });

  it("sorts features by count descending", () => {
    expect(dashSource).toContain("sort((a, b) => b.count - a.count)");
  });

  it("limits to top 5 features", () => {
    expect(dashSource).toContain("slice(0, 5)");
  });

  it("shows empty state when no features used", () => {
    expect(dashSource).toContain("Start using features to see your usage stats here");
  });

  it("includes feature categories (lessons, duels, voice rooms, calls, challenges, referrals)", () => {
    expect(dashSource).toContain("Lessons");
    expect(dashSource).toContain("Duels");
    expect(dashSource).toContain("Voice Rooms");
    expect(dashSource).toContain("AI Calls");
    expect(dashSource).toContain("Daily Challenges");
    expect(dashSource).toContain("Referrals");
  });
});

describe("Feature Usage Tracking in Home Screen", () => {
  let homeSource: string;

  beforeAll(() => {
    homeSource = fs.readFileSync(
      path.join(APP_DIR, "app/(tabs)/index.tsx"),
      "utf-8"
    );
  });

  it("imports trackFeatureUsed from analytics", () => {
    expect(homeSource).toContain("trackFeatureUsed");
    expect(homeSource).toContain("from \"@/lib/analytics\"");
  });

  it("calls trackFeatureUsed when explore item is tapped", () => {
    expect(homeSource).toContain("trackFeatureUsed(item.id)");
  });
});

// ─── ANALYTICS MODULE ────────────────────────────────────────────────────────

describe("Analytics Module", () => {
  let analyticsSource: string;

  beforeAll(() => {
    analyticsSource = fs.readFileSync(
      path.join(APP_DIR, "lib/analytics.ts"),
      "utf-8"
    );
  });

  it("exports trackFeatureUsed function", () => {
    expect(analyticsSource).toContain("export function trackFeatureUsed");
  });

  it("exports getAnalyticsSummary function", () => {
    expect(analyticsSource).toContain("export async function getAnalyticsSummary");
  });

  it("exports getEventCounts function", () => {
    expect(analyticsSource).toContain("export async function getEventCounts");
  });

  it("tracks feature_used events", () => {
    expect(analyticsSource).toContain("feature_used");
  });

  it("has session tracking (initAnalytics/endAnalytics)", () => {
    expect(analyticsSource).toContain("export async function initAnalytics");
    expect(analyticsSource).toContain("export async function endAnalytics");
  });
});
