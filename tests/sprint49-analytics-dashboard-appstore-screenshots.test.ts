import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

const APP_DIR = path.resolve(__dirname, "..");

// ─── Analytics Dashboard Screen ──────────────────────────────────────────────

describe("Sprint 49 — Analytics Dashboard Screen", () => {
  const dashboardPath = path.join(APP_DIR, "app", "analytics-dashboard.tsx");

  it("analytics-dashboard.tsx file exists", () => {
    expect(fs.existsSync(dashboardPath)).toBe(true);
  });

  it("imports analytics library helpers", () => {
    const content = fs.readFileSync(dashboardPath, "utf-8");
    expect(content).toContain("getAnalyticsSummary");
    expect(content).toContain("getEventCounts");
  });

  it("displays journey summary with lessons, duels, and streaks", () => {
    const content = fs.readFileSync(dashboardPath, "utf-8");
    expect(content).toContain("Lessons");
    expect(content).toContain("Duels");
    expect(content).toContain("Streak");
  });

  it("shows weekly activity trends section", () => {
    const content = fs.readFileSync(dashboardPath, "utf-8");
    expect(content).toContain("Weekly Activity");
  });

  it("shows personal bests section", () => {
    const content = fs.readFileSync(dashboardPath, "utf-8");
    expect(content).toContain("Personal Bests");
  });

  it("uses ScreenContainer for safe area handling", () => {
    const content = fs.readFileSync(dashboardPath, "utf-8");
    expect(content).toContain("ScreenContainer");
  });

  it("has a back button for navigation", () => {
    const content = fs.readFileSync(dashboardPath, "utf-8");
    expect(content).toContain("router.back");
  });

  it("loads data from AsyncStorage on mount", () => {
    const content = fs.readFileSync(dashboardPath, "utf-8");
    expect(content).toContain("AsyncStorage");
    expect(content).toContain("useEffect");
  });
});

// ─── Screen Registration in _layout.tsx ──────────────────────────────────────

describe("Sprint 49 — Analytics Dashboard Registration", () => {
  const layoutPath = path.join(APP_DIR, "app", "_layout.tsx");

  it("analytics-dashboard is registered in _layout.tsx", () => {
    const content = fs.readFileSync(layoutPath, "utf-8");
    expect(content).toContain('name="analytics-dashboard"');
  });

  it("no duplicate Stack.Screen names in _layout.tsx", () => {
    const content = fs.readFileSync(layoutPath, "utf-8");
    const screenNames = [...content.matchAll(/Stack\.Screen\s+name="([^"]+)"/g)].map(
      (m) => m[1]
    );
    const unique = new Set(screenNames);
    expect(screenNames.length).toBe(unique.size);
  });
});

// ─── Profile Screen Entry Point ──────────────────────────────────────────────

describe("Sprint 49 — Profile Screen Analytics Entry Point", () => {
  const profilePath = path.join(APP_DIR, "app", "(tabs)", "profile.tsx");

  it("profile screen has My Progress entry point", () => {
    const content = fs.readFileSync(profilePath, "utf-8");
    expect(content).toContain("My Progress");
  });

  it("profile screen navigates to analytics-dashboard", () => {
    const content = fs.readFileSync(profilePath, "utf-8");
    expect(content).toContain("/analytics-dashboard");
  });

  it("View all analytics button is wired to analytics-dashboard", () => {
    const content = fs.readFileSync(profilePath, "utf-8");
    // The "View all analytics" button should have an onPress handler
    const viewAllIdx = content.indexOf("View all analytics");
    expect(viewAllIdx).toBeGreaterThan(-1);
    // Check that there's a router.push to analytics-dashboard near this button
    const nearbyContent = content.substring(Math.max(0, viewAllIdx - 200), viewAllIdx);
    expect(nearbyContent).toContain("analytics-dashboard");
  });
});

// ─── App Store Screenshots ───────────────────────────────────────────────────

describe("Sprint 49 — App Store Marketing Screenshots", () => {
  const manifestPath = path.join(APP_DIR, "assets", "appstore-screenshots.md");

  it("screenshots manifest file exists", () => {
    expect(fs.existsSync(manifestPath)).toBe(true);
  });

  it("manifest references home screen screenshot CDN URL", () => {
    const content = fs.readFileSync(manifestPath, "utf-8");
    expect(content).toContain("appstore-screenshot-home");
  });

  it("manifest references duels screen screenshot CDN URL", () => {
    const content = fs.readFileSync(manifestPath, "utf-8");
    expect(content).toContain("appstore-screenshot-duels");
  });

  it("manifest references achievements screen screenshot CDN URL", () => {
    const content = fs.readFileSync(manifestPath, "utf-8");
    expect(content).toContain("appstore-screenshot-achievements");
  });

  it("manifest references voice rooms screen screenshot CDN URL", () => {
    const content = fs.readFileSync(manifestPath, "utf-8");
    expect(content).toContain("appstore-screenshot-voicerooms");
  });

  it("manifest references analytics dashboard screenshot CDN URL", () => {
    const content = fs.readFileSync(manifestPath, "utf-8");
    expect(content).toContain("appstore-screenshot-analytics");
  });
});

// ─── Analytics Library Exports ───────────────────────────────────────────────

describe("Sprint 49 — Analytics Library Integrity", () => {
  const analyticsPath = path.join(APP_DIR, "lib", "analytics.ts");

  it("analytics.ts exports getAnalyticsSummary", () => {
    const content = fs.readFileSync(analyticsPath, "utf-8");
    expect(content).toContain("export async function getAnalyticsSummary");
  });

  it("analytics.ts exports getEventCounts", () => {
    const content = fs.readFileSync(analyticsPath, "utf-8");
    expect(content).toContain("export async function getEventCounts");
  });

  it("analytics.ts exports getStoredBatches", () => {
    const content = fs.readFileSync(analyticsPath, "utf-8");
    expect(content).toContain("export async function getStoredBatches");
  });
});
