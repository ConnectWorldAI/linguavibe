/**
 * Tests for Sprint: Streak Wiring + Voice Preview Backend + Settings UI
 * 
 * 1. markTodayAsPracticed wired into lesson completion (adaptive-lesson.tsx)
 * 2. markTodayAsPracticed + trackCallCompleted wired into call end (hume-call.tsx)
 * 3. Voice preview connected to real backend TTS (voice-clone-studio.tsx)
 * 4. Streak reminder time settings UI already functional (notification-settings.tsx)
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock modules
vi.mock("expo-notifications", () => ({
  setNotificationChannelAsync: vi.fn(),
  scheduleNotificationAsync: vi.fn().mockResolvedValue("notif-id"),
  cancelScheduledNotificationAsync: vi.fn(),
  getPermissionsAsync: vi.fn().mockResolvedValue({ status: "granted" }),
  requestPermissionsAsync: vi.fn().mockResolvedValue({ status: "granted" }),
  setNotificationHandler: vi.fn(),
  AndroidImportance: { HIGH: 4 },
}));

vi.mock("react-native", () => ({
  Platform: { OS: "ios" },
}));

vi.mock("@react-native-async-storage/async-storage", () => ({
  default: {
    getItem: vi.fn().mockResolvedValue(null),
    setItem: vi.fn().mockResolvedValue(undefined),
    removeItem: vi.fn().mockResolvedValue(undefined),
  },
}));

describe("Streak Notifications - markTodayAsPracticed", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("streak-notifications.ts exports markTodayAsPracticed function", async () => {
    const fs = await import("fs");
    const content = fs.readFileSync("/home/ubuntu/linguavibe/lib/streak-notifications.ts", "utf-8");
    expect(content).toContain("export async function markTodayAsPracticed");
  });

  it("markTodayAsPracticed stores last_practice_date", async () => {
    const fs = await import("fs");
    const content = fs.readFileSync("/home/ubuntu/linguavibe/lib/streak-notifications.ts", "utf-8");
    expect(content).toContain('@last_practice_date');
    expect(content).toContain("AsyncStorage.setItem");
  });

  it("hasUserPracticedToday compares with today's date", async () => {
    const fs = await import("fs");
    const content = fs.readFileSync("/home/ubuntu/linguavibe/lib/streak-notifications.ts", "utf-8");
    expect(content).toContain("export async function hasUserPracticedToday");
    expect(content).toContain("toISOString().split");
  });

  it("REMINDER_TIMES has correct format", async () => {
    const fs = await import("fs");
    const content = fs.readFileSync("/home/ubuntu/linguavibe/lib/streak-notifications.ts", "utf-8");
    expect(content).toContain("export const REMINDER_TIMES");
    // Should have at least 8 time options
    const matches = content.match(/\{ label:/g);
    expect(matches).not.toBeNull();
    expect(matches!.length).toBeGreaterThanOrEqual(8);
  });
});

describe("Streak Wiring - Lesson Completion Integration", () => {
  it("adaptive-lesson.tsx imports markTodayAsPracticed", async () => {
    const fs = await import("fs");
    const content = fs.readFileSync("/home/ubuntu/linguavibe/app/adaptive-lesson.tsx", "utf-8");
    expect(content).toContain('import { markTodayAsPracticed } from "@/lib/streak-notifications"');
  });

  it("adaptive-lesson.tsx imports trackLessonComplete", async () => {
    const fs = await import("fs");
    const content = fs.readFileSync("/home/ubuntu/linguavibe/app/adaptive-lesson.tsx", "utf-8");
    expect(content).toContain('import { trackLessonComplete } from "@/lib/analytics"');
  });

  it("adaptive-lesson.tsx calls markPracticeAndToast on lesson complete", async () => {
    const fs = await import("fs");
    const content = fs.readFileSync("/home/ubuntu/linguavibe/app/adaptive-lesson.tsx", "utf-8");
    expect(content).toContain("markPracticeAndToast(showStreakToast, currentStreak)");
  });

  it("adaptive-lesson.tsx increments @lessons_completed", async () => {
    const fs = await import("fs");
    const content = fs.readFileSync("/home/ubuntu/linguavibe/app/adaptive-lesson.tsx", "utf-8");
    expect(content).toContain('@lessons_completed');
    expect(content).toContain("String(count + 1)");
  });

  it("adaptive-lesson.tsx calls trackLessonComplete with params", async () => {
    const fs = await import("fs");
    const content = fs.readFileSync("/home/ubuntu/linguavibe/app/adaptive-lesson.tsx", "utf-8");
    expect(content).toContain("trackLessonComplete(params.topic");
  });
});

describe("Streak Wiring - Call Completion Integration", () => {
  it("hume-call.tsx imports markTodayAsPracticed", async () => {
    const fs = await import("fs");
    const content = fs.readFileSync("/home/ubuntu/linguavibe/app/hume-call.tsx", "utf-8");
    expect(content).toContain('import { markTodayAsPracticed } from "@/lib/streak-notifications"');
  });

  it("hume-call.tsx imports trackCallCompleted", async () => {
    const fs = await import("fs");
    const content = fs.readFileSync("/home/ubuntu/linguavibe/app/hume-call.tsx", "utf-8");
    expect(content).toContain('import { trackCallCompleted } from "@/lib/analytics"');
  });

  it("hume-call.tsx calls markPracticeAndToast in handleEndCall", async () => {
    const fs = await import("fs");
    const content = fs.readFileSync("/home/ubuntu/linguavibe/app/hume-call.tsx", "utf-8");
    expect(content).toContain("markPracticeAndToast(showStreakToast, currentStreak)");
  });

  it("hume-call.tsx calls trackCallCompleted with duration and language", async () => {
    const fs = await import("fs");
    const content = fs.readFileSync("/home/ubuntu/linguavibe/app/hume-call.tsx", "utf-8");
    expect(content).toContain("trackCallCompleted(params.teacherName || mode, callDuration, params.language");
  });
});

describe("Voice Preview - Backend TTS Integration", () => {
  it("voice-clone-studio.tsx imports trpc", async () => {
    const fs = await import("fs");
    const content = fs.readFileSync("/home/ubuntu/linguavibe/app/voice-clone-studio.tsx", "utf-8");
    expect(content).toContain('import { trpc } from "@/lib/trpc"');
  });

  it("voice-clone-studio.tsx uses trpc.translate.tts.useMutation", async () => {
    const fs = await import("fs");
    const content = fs.readFileSync("/home/ubuntu/linguavibe/app/voice-clone-studio.tsx", "utf-8");
    expect(content).toContain("trpc.translate.tts.useMutation()");
  });

  it("voice-clone-studio.tsx calls ttsMutation.mutateAsync for preview", async () => {
    const fs = await import("fs");
    const content = fs.readFileSync("/home/ubuntu/linguavibe/app/voice-clone-studio.tsx", "utf-8");
    expect(content).toContain("ttsMutation.mutateAsync");
  });

  it("voice-clone-studio.tsx caches preview audio URLs", async () => {
    const fs = await import("fs");
    const content = fs.readFileSync("/home/ubuntu/linguavibe/app/voice-clone-studio.tsx", "utf-8");
    expect(content).toContain("previewCacheRef.current[song.id]");
  });

  it("voice-clone-studio.tsx creates real audio player for preview", async () => {
    const fs = await import("fs");
    const content = fs.readFileSync("/home/ubuntu/linguavibe/app/voice-clone-studio.tsx", "utf-8");
    // Should use createAudioPlayer with the actual URL
    const previewSection = content.substring(
      content.indexOf("Voice Quality Preview (Real Backend TTS)"),
      content.indexOf("const stopPreview")
    );
    expect(previewSection).toContain("createAudioPlayer(audioUrl)");
    expect(previewSection).toContain("player.play()");
  });

  it("voice-clone-studio.tsx auto-stops preview after 5 seconds", async () => {
    const fs = await import("fs");
    const content = fs.readFileSync("/home/ubuntu/linguavibe/app/voice-clone-studio.tsx", "utf-8");
    const previewSection = content.substring(
      content.indexOf("Voice Quality Preview (Real Backend TTS)"),
      content.indexOf("const stopPreview")
    );
    expect(previewSection).toContain("5000");
  });

  it("voice-clone-studio.tsx has fallback for TTS failure", async () => {
    const fs = await import("fs");
    const content = fs.readFileSync("/home/ubuntu/linguavibe/app/voice-clone-studio.tsx", "utf-8");
    const previewSection = content.substring(
      content.indexOf("Voice Quality Preview (Real Backend TTS)"),
      content.indexOf("const stopPreview")
    );
    expect(previewSection).toContain("catch (error)");
    // Fallback shows brief visual feedback
    expect(previewSection).toContain("2000");
  });
});

describe("Settings UI - Streak Reminder Time", () => {
  it("notification-settings.tsx imports REMINDER_TIMES", async () => {
    const fs = await import("fs");
    const content = fs.readFileSync("/home/ubuntu/linguavibe/app/notification-settings.tsx", "utf-8");
    expect(content).toContain("REMINDER_TIMES");
  });

  it("notification-settings.tsx renders time chips from REMINDER_TIMES", async () => {
    const fs = await import("fs");
    const content = fs.readFileSync("/home/ubuntu/linguavibe/app/notification-settings.tsx", "utf-8");
    expect(content).toContain("REMINDER_TIMES.map");
  });

  it("notification-settings.tsx has handleStreakTimeChange handler", async () => {
    const fs = await import("fs");
    const content = fs.readFileSync("/home/ubuntu/linguavibe/app/notification-settings.tsx", "utf-8");
    expect(content).toContain("handleStreakTimeChange");
    expect(content).toContain("scheduleStreakReminder");
  });

  it("notification-settings.tsx has streak toggle with switch", async () => {
    const fs = await import("fs");
    const content = fs.readFileSync("/home/ubuntu/linguavibe/app/notification-settings.tsx", "utf-8");
    expect(content).toContain("handleStreakNotifToggle");
    expect(content).toContain("streakNotifEnabled");
  });
});

describe("Airtable Upload - BilingueBlogs", () => {
  it("upload script exists with correct creator data", async () => {
    const fs = await import("fs");
    const content = fs.readFileSync("/home/ubuntu/linguavibe/scripts/upload-bilingueblogs.js", "utf-8");
    expect(content).toContain("@bilingueblogs");
    expect(content).toContain("Rickie");
    expect(content).toContain("Caribbean");
    expect(content).toContain("Dominican");
    expect(content).toContain("High");
  });
});
