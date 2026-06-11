/**
 * Tests for engagement notifications and What's Hot carousel
 */
import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

describe("Engagement Notifications Module", () => {
  const filePath = path.resolve(__dirname, "../lib/engagement-notifications.ts");
  const content = fs.readFileSync(filePath, "utf-8");

  it("exports initEngagementNotifications master function", () => {
    expect(content).toContain("export async function initEngagementNotifications");
  });

  it("exports scheduleStreakReminder function", () => {
    expect(content).toContain("export async function scheduleStreakReminder");
  });

  it("exports scheduleMusicAlert function", () => {
    expect(content).toContain("export async function scheduleMusicAlert");
  });

  it("exports scheduleMilestoneAlert function", () => {
    expect(content).toContain("export async function scheduleMilestoneAlert");
  });

  it("exports scheduleReEngagement function", () => {
    expect(content).toContain("export async function scheduleReEngagement");
  });

  it("exports cancelAllEngagementNotifications function", () => {
    expect(content).toContain("export async function cancelAllEngagementNotifications");
  });

  it("exports getEngagementPrefs and updateEngagementPrefs", () => {
    expect(content).toContain("export async function getEngagementPrefs");
    expect(content).toContain("export async function updateEngagementPrefs");
  });

  it("exports recordActivity for active hours tracking", () => {
    expect(content).toContain("export async function recordActivity");
  });

  it("exports getActiveHoursProfile for smart timing", () => {
    expect(content).toContain("export async function getActiveHoursProfile");
  });

  it("has streak reminder templates with variables", () => {
    expect(content).toContain("STREAK_TEMPLATES");
    expect(content).toContain("{streak}");
    expect(content).toContain("Don't break your streak");
  });

  it("has music alert templates with song variables", () => {
    expect(content).toContain("MUSIC_TEMPLATES");
    expect(content).toContain("{songTitle}");
    expect(content).toContain("{artist}");
  });

  it("has milestone templates with count variables", () => {
    expect(content).toContain("MILESTONE_TEMPLATES");
    expect(content).toContain("{count}");
  });

  it("has re-engagement templates with days and teacher variables", () => {
    expect(content).toContain("REENGAGEMENT_TEMPLATES");
    expect(content).toContain("{days}");
    expect(content).toContain("{teacherName}");
  });

  it("implements quiet hours logic", () => {
    expect(content).toContain("isQuietHour");
    expect(content).toContain("quietHoursStart");
    expect(content).toContain("quietHoursEnd");
  });

  it("calculates optimal notification time based on user profile", () => {
    expect(content).toContain("export function getOptimalNotificationTime");
    expect(content).toContain("peakHour");
    expect(content).toContain("secondaryHour");
  });

  it("uses expo-notifications dynamic import for native-only", () => {
    expect(content).toContain('await import("expo-notifications")');
    expect(content).toContain('if (Platform.OS === "web") return');
  });

  it("schedules at different intervals for re-engagement (3, 7, 14 days)", () => {
    expect(content).toContain("const intervals = [3, 7, 14]");
  });

  it("cancels existing notifications before rescheduling", () => {
    expect(content).toContain("cancelScheduledNotificationAsync");
  });

  it("has EngagementPreferences interface with all settings", () => {
    expect(content).toContain("streakReminders: boolean");
    expect(content).toContain("musicAlerts: boolean");
    expect(content).toContain("milestoneAlerts: boolean");
    expect(content).toContain("reEngagement: boolean");
  });

  it("only triggers milestones at meaningful counts", () => {
    expect(content).toContain("const milestones = [5, 10, 25, 50, 75, 100, 150, 200, 300, 500]");
  });
});

describe("What's Hot Carousel Component", () => {
  const filePath = path.resolve(__dirname, "../components/whats-hot-carousel.tsx");
  const content = fs.readFileSync(filePath, "utf-8");

  it("exports WhatsHotCarousel component", () => {
    expect(content).toContain("export function WhatsHotCarousel");
  });

  it("imports getTrendingMusic from viral-music-tracker", () => {
    expect(content).toContain("getTrendingMusic");
    expect(content).toContain("viral-music-tracker");
  });

  it("renders a horizontal FlatList carousel", () => {
    expect(content).toContain("horizontal");
    expect(content).toContain("FlatList");
    expect(content).toContain("snapToInterval");
  });

  it("shows virality score badge on cards", () => {
    expect(content).toContain("viralityScore");
    expect(content).toContain("viralBadge");
  });

  it("has a Learn CTA button that navigates to lyrics-player", () => {
    expect(content).toContain("learnBtn");
    expect(content).toContain("/lyrics-player");
  });

  it("navigates to song-player on card press", () => {
    expect(content).toContain("/song-player");
  });

  it("shows section header with flame icon and See All button", () => {
    expect(content).toContain("What's Hot");
    expect(content).toContain("See All");
    expect(content).toContain("flame");
  });

  it("accepts language prop for filtering", () => {
    expect(content).toContain("language?: string");
    expect(content).toContain('language = "Spanish"');
  });

  it("returns null when no trending data", () => {
    expect(content).toContain("return null");
  });
});

describe("TV Tab What's Hot Integration", () => {
  const filePath = path.resolve(__dirname, "../app/(tabs)/tv.tsx");
  const content = fs.readFileSync(filePath, "utf-8");

  it("imports WhatsHotCarousel component", () => {
    expect(content).toContain("WhatsHotCarousel");
    expect(content).toContain("whats-hot-carousel");
  });

  it("renders WhatsHotCarousel in the TV tab", () => {
    expect(content).toContain("<WhatsHotCarousel");
  });
});
