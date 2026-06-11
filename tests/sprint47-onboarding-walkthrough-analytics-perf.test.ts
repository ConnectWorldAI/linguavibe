/**
 * Sprint 47 Tests — Onboarding Walkthrough, Analytics Tracking, Performance Optimization
 */
import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

const APP_DIR = path.resolve(__dirname, "..");

describe("Sprint 47: Onboarding Walkthrough", () => {
  it("onboarding-walkthrough component exists", () => {
    const filePath = path.join(APP_DIR, "components/onboarding-walkthrough.tsx");
    expect(fs.existsSync(filePath)).toBe(true);
  });

  it("walkthrough has 6 steps covering key features", () => {
    const content = fs.readFileSync(path.join(APP_DIR, "components/onboarding-walkthrough.tsx"), "utf-8");
    expect(content).toContain("WALKTHROUGH_STEPS");
    expect(content).toContain("pronunciation_duels");
    expect(content).toContain("voice_rooms");
    expect(content).toContain("referral_rewards");
    expect(content).toContain("achievements");
    expect(content).toContain("daily_challenge");
  });

  it("walkthrough checks AsyncStorage flag before showing", () => {
    const content = fs.readFileSync(path.join(APP_DIR, "components/onboarding-walkthrough.tsx"), "utf-8");
    expect(content).toContain("@connectworld_walkthrough_complete");
    expect(content).toContain("AsyncStorage.getItem");
    expect(content).toContain("AsyncStorage.setItem");
  });

  it("walkthrough has skip and next navigation", () => {
    const content = fs.readFileSync(path.join(APP_DIR, "components/onboarding-walkthrough.tsx"), "utf-8");
    expect(content).toContain("handleNext");
    expect(content).toContain("handleSkip");
    expect(content).toContain("handleComplete");
  });

  it("walkthrough has action buttons that navigate to feature screens", () => {
    const content = fs.readFileSync(path.join(APP_DIR, "components/onboarding-walkthrough.tsx"), "utf-8");
    expect(content).toContain("router.push");
    expect(content).toContain("/duel-multiplayer");
    expect(content).toContain("/voice-rooms");
    expect(content).toContain("/referral");
    expect(content).toContain("/achievements-wall");
  });

  it("walkthrough has progress bar and step counter dots", () => {
    const content = fs.readFileSync(path.join(APP_DIR, "components/onboarding-walkthrough.tsx"), "utf-8");
    expect(content).toContain("progressBar");
    expect(content).toContain("progressFill");
    expect(content).toContain("counterDot");
    expect(content).toContain("stepCounter");
  });

  it("walkthrough is wired into the home screen", () => {
    const content = fs.readFileSync(path.join(APP_DIR, "app/(tabs)/index.tsx"), "utf-8");
    expect(content).toContain("OnboardingWalkthrough");
    expect(content).toContain("@/components/onboarding-walkthrough");
  });

  it("walkthrough exports utility functions for testing and reset", () => {
    const content = fs.readFileSync(path.join(APP_DIR, "components/onboarding-walkthrough.tsx"), "utf-8");
    expect(content).toContain("export async function hasCompletedWalkthrough");
    expect(content).toContain("export async function resetWalkthrough");
    expect(content).toContain("export function getWalkthroughSteps");
  });

  it("walkthrough has animated transitions", () => {
    const content = fs.readFileSync(path.join(APP_DIR, "components/onboarding-walkthrough.tsx"), "utf-8");
    expect(content).toContain("Animated.Value");
    expect(content).toContain("Animated.timing");
    expect(content).toContain("animateIn");
    expect(content).toContain("animateOut");
  });
});

describe("Sprint 47: Analytics Event Tracking", () => {
  it("analytics library exists", () => {
    const filePath = path.join(APP_DIR, "lib/analytics.ts");
    expect(fs.existsSync(filePath)).toBe(true);
  });

  it("tracks all key engagement events", () => {
    const content = fs.readFileSync(path.join(APP_DIR, "lib/analytics.ts"), "utf-8");
    expect(content).toContain("lesson_complete");
    expect(content).toContain("duel_played");
    expect(content).toContain("referral_shared");
    expect(content).toContain("achievement_unlocked");
    expect(content).toContain("voice_room_joined");
    expect(content).toContain("daily_challenge_completed");
    expect(content).toContain("streak_maintained");
    expect(content).toContain("call_completed");
  });

  it("has event batching with configurable batch size", () => {
    const content = fs.readFileSync(path.join(APP_DIR, "lib/analytics.ts"), "utf-8");
    expect(content).toContain("BATCH_SIZE");
    expect(content).toContain("MAX_BATCHES");
    expect(content).toContain("flushEvents");
    expect(content).toContain("eventQueue");
  });

  it("persists events to AsyncStorage before flush", () => {
    const content = fs.readFileSync(path.join(APP_DIR, "lib/analytics.ts"), "utf-8");
    expect(content).toContain("@connectworld_analytics_queue");
    expect(content).toContain("@connectworld_analytics_batches");
    expect(content).toContain("persistQueue");
  });

  it("has session management with init and end", () => {
    const content = fs.readFileSync(path.join(APP_DIR, "lib/analytics.ts"), "utf-8");
    expect(content).toContain("export async function initAnalytics");
    expect(content).toContain("export async function endAnalytics");
    expect(content).toContain("generateSessionId");
    expect(content).toContain("currentSessionId");
  });

  it("has convenience tracker functions for common events", () => {
    const content = fs.readFileSync(path.join(APP_DIR, "lib/analytics.ts"), "utf-8");
    expect(content).toContain("export function trackLessonComplete");
    expect(content).toContain("export function trackDuelPlayed");
    expect(content).toContain("export function trackReferralShared");
    expect(content).toContain("export function trackAchievementUnlocked");
    expect(content).toContain("export function trackVoiceRoomJoined");
    expect(content).toContain("export function trackCallCompleted");
  });

  it("has reporting and summary functions", () => {
    const content = fs.readFileSync(path.join(APP_DIR, "lib/analytics.ts"), "utf-8");
    expect(content).toContain("export async function getAnalyticsSummary");
    expect(content).toContain("export async function getStoredBatches");
    expect(content).toContain("export function getPendingEventCount");
    expect(content).toContain("export async function exportAnalyticsData");
  });

  it("has periodic flush interval", () => {
    const content = fs.readFileSync(path.join(APP_DIR, "lib/analytics.ts"), "utf-8");
    expect(content).toContain("FLUSH_INTERVAL_MS");
    expect(content).toContain("flushTimer");
    expect(content).toContain("setInterval");
  });

  it("includes platform info in events", () => {
    const content = fs.readFileSync(path.join(APP_DIR, "lib/analytics.ts"), "utf-8");
    expect(content).toContain("Platform.OS");
    expect(content).toContain("platform:");
  });
});

describe("Sprint 47: Performance Optimization", () => {
  it("ranked-leaderboard FlatList has performance props", () => {
    const content = fs.readFileSync(path.join(APP_DIR, "app/ranked-leaderboard.tsx"), "utf-8");
    expect(content).toContain("windowSize={7}");
    expect(content).toContain("maxToRenderPerBatch={12}");
    expect(content).toContain("initialNumToRender={10}");
    expect(content).toContain("removeClippedSubviews={true}");
    expect(content).toContain("getItemLayout");
  });

  it("achievements-wall FlatList has performance props", () => {
    const content = fs.readFileSync(path.join(APP_DIR, "app/achievements-wall.tsx"), "utf-8");
    expect(content).toContain("windowSize={7}");
    expect(content).toContain("maxToRenderPerBatch={10}");
    expect(content).toContain("initialNumToRender={8}");
    expect(content).toContain("removeClippedSubviews={true}");
    expect(content).toContain("getItemLayout");
  });

  it("achievements-wall uses useMemo for filtered lists", () => {
    const content = fs.readFileSync(path.join(APP_DIR, "app/achievements-wall.tsx"), "utf-8");
    expect(content).toContain("useMemo");
    // Check that filtered and unlockedCount use useMemo
    expect(content).toMatch(/const filtered = useMemo/);
    expect(content).toMatch(/const unlockedCount = useMemo/);
  });

  it("both screens use useCallback for renderItem", () => {
    const leaderboard = fs.readFileSync(path.join(APP_DIR, "app/ranked-leaderboard.tsx"), "utf-8");
    const achievements = fs.readFileSync(path.join(APP_DIR, "app/achievements-wall.tsx"), "utf-8");
    expect(leaderboard).toContain("useCallback");
    expect(achievements).toContain("useCallback");
  });

  it("ranked-leaderboard imports useMemo", () => {
    const content = fs.readFileSync(path.join(APP_DIR, "app/ranked-leaderboard.tsx"), "utf-8");
    expect(content).toContain("useMemo");
  });
});
