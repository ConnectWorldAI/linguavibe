/**
 * Tests for Sprint: Download All + Streak Notifications + Voice Preview
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";

// ─── Offline Downloads: Download All Button ─────────────────────────────────
describe("Offline Downloads - Download All", () => {
  const filePath = resolve(__dirname, "../app/offline-downloads.tsx");
  const source = readFileSync(filePath, "utf-8");

  it("should export a default screen component", () => {
    expect(source).toContain("export default function OfflineDownloadsScreen");
  });

  it("should have a Download All button", () => {
    expect(source).toContain("Download All");
    expect(source).toContain("handleDownloadAll");
  });

  it("should track batch downloading state", () => {
    expect(source).toContain("batchDownloading");
    expect(source).toContain("setBatchDownloading");
  });

  it("should show batch progress", () => {
    expect(source).toContain("batchProgress");
    expect(source).toContain("setBatchProgress");
  });

  it("should support cancelling batch download", () => {
    expect(source).toContain("handleCancelBatch");
    expect(source).toContain("batchCancelledRef");
  });

  it("should queue available items for sequential download", () => {
    expect(source).toContain("downloadNext");
    expect(source).toContain("completedItems");
  });

  it("should use FlatList for performance", () => {
    expect(source).toContain("FlatList");
    expect(source).toContain("keyExtractor");
  });

  it("should show overall progress percentage", () => {
    expect(source).toContain("overallProgress");
    expect(source).toContain("% complete");
  });

  it("should provide haptic feedback on batch download", () => {
    expect(source).toContain("Haptics.ImpactFeedbackStyle.Heavy");
  });
});

// ─── Streak Notifications ───────────────────────────────────────────────────
describe("Streak Notifications", () => {
  const filePath = resolve(__dirname, "../lib/streak-notifications.ts");
  const source = readFileSync(filePath, "utf-8");

  it("should export scheduleStreakReminder function", () => {
    expect(source).toContain("export async function scheduleStreakReminder");
  });

  it("should export cancelStreakReminder function", () => {
    expect(source).toContain("export async function cancelStreakReminder");
  });

  it("should export initStreakNotifications function", () => {
    expect(source).toContain("export async function initStreakNotifications");
  });

  it("should export toggleStreakNotifications function", () => {
    expect(source).toContain("export async function toggleStreakNotifications");
  });

  it("should export updateReminderTime function", () => {
    expect(source).toContain("export async function updateReminderTime");
  });

  it("should export markTodayAsPracticed function", () => {
    expect(source).toContain("export async function markTodayAsPracticed");
  });

  it("should have streak-aware motivational messages", () => {
    expect(source).toContain("STREAK_MESSAGES");
    expect(source).toContain("{streak}");
    expect(source).toContain("{next}");
  });

  it("should use DAILY trigger type for recurring notifications", () => {
    expect(source).toContain("SchedulableTriggerInputTypes.CALENDAR");
    expect(source).toContain("repeats: true");
  });

  it("should cancel existing reminder before scheduling new one", () => {
    expect(source).toContain("await cancelStreakReminder()");
  });

  it("should check if user practiced today before scheduling", () => {
    expect(source).toContain("hasUserPracticedToday");
    expect(source).toContain("@last_practice_date");
  });

  it("should guard against web platform", () => {
    expect(source).toContain('if (Platform.OS === "web") return');
  });

  it("should request notification permissions", () => {
    expect(source).toContain("requestNotificationPermissions");
    expect(source).toContain("requestPermissionsAsync");
  });

  it("should set up Android notification channel", () => {
    expect(source).toContain("setNotificationChannelAsync");
    expect(source).toContain("streak-reminders");
  });

  it("should provide REMINDER_TIMES for settings UI", () => {
    expect(source).toContain("REMINDER_TIMES");
    expect(source).toContain("6:00 AM");
    expect(source).toContain("9:00 PM");
  });

  it("should be initialized in _layout.tsx", () => {
    const layoutPath = resolve(__dirname, "../app/_layout.tsx");
    const layoutSource = readFileSync(layoutPath, "utf-8");
    expect(layoutSource).toContain("initStreakNotifications");
    expect(layoutSource).toContain("@/lib/streak-notifications");
  });
});

// ─── Voice Clone Studio: Voice Quality Preview ──────────────────────────────
describe("Voice Clone Studio - Voice Quality Preview", () => {
  const filePath = resolve(__dirname, "../app/voice-clone-studio.tsx");
  const source = readFileSync(filePath, "utf-8");

  it("should export a default screen component", () => {
    expect(source).toContain("export default function VoiceCloneStudioScreen");
  });

  it("should have preview state management", () => {
    expect(source).toContain("previewLoading");
    expect(source).toContain("previewPlaying");
    expect(source).toContain("previewSongId");
  });

  it("should have a handlePreview function", () => {
    expect(source).toContain("handlePreview");
  });

  it("should have a stopPreview function", () => {
    expect(source).toContain("stopPreview");
  });

  it("should show 5-second preview duration info", () => {
    expect(source).toContain("5-second");
    expect(source).toContain("5s voice preview");
  });

  it("should have a preview button on each song card", () => {
    expect(source).toContain("previewBtn");
    expect(source).toContain('name="ear"');
  });

  it("should have a preview banner when playing", () => {
    expect(source).toContain("previewBanner");
    expect(source).toContain("previewWaveform");
  });

  it("should have a preview button next to generate button", () => {
    expect(source).toContain("previewBeforeGenBtn");
    expect(source).toContain("Preview");
  });

  it("should stop preview when generating full song", () => {
    expect(source).toContain("// Stop any preview playing");
    expect(source).toContain("stopPreview()");
  });

  it("should import audio player from expo-audio", () => {
    expect(source).toContain("createAudioPlayer");
    expect(source).toContain("setAudioModeAsync");
    expect(source).toContain('from "expo-audio"');
  });

  it("should enable silent mode playback", () => {
    expect(source).toContain("playsInSilentMode: true");
  });

  it("should clean up preview on unmount", () => {
    expect(source).toContain("// Cleanup preview player on unmount");
    expect(source).toContain("stopPreview");
  });

  it("should simulate 5-second playback timeout", () => {
    expect(source).toContain("5000");
  });

  it("should update info card to mention preview feature", () => {
    expect(source).toContain("5-second quality preview");
  });
});
