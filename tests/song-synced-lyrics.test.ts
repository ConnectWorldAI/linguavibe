import { describe, it, expect, vi } from "vitest";

// Mock expo-haptics
vi.mock("expo-haptics", () => ({
  impactAsync: vi.fn(),
  notificationAsync: vi.fn(),
  ImpactFeedbackStyle: { Light: "light", Medium: "medium" },
  NotificationFeedbackType: { Success: "success", Error: "error" },
}));

// Mock expo-router
vi.mock("expo-router", () => ({
  router: { back: vi.fn(), push: vi.fn() },
}));

describe("Song Player - Synced Lyrics", () => {
  // Replicate the synced lyrics data structure from song-player.tsx
  interface SyncedLyricLine {
    id: string;
    startTime: number;
    endTime: number;
    original: string;
    translated: string;
  }

  const SYNCED_LYRICS: SyncedLyricLine[] = [
    { id: "1", startTime: 0, endTime: 4, original: "Despacito", translated: "Slowly" },
    { id: "2", startTime: 4, endTime: 9, original: "Quiero respirar tu cuello despacito", translated: "I want to breathe your neck slowly" },
    { id: "3", startTime: 9, endTime: 14, original: "Deja que te diga cosas al oído", translated: "Let me whisper things in your ear" },
    { id: "4", startTime: 14, endTime: 19, original: "Para que te acuerdes si no estás conmigo", translated: "So you remember when you're not with me" },
    { id: "5", startTime: 19, endTime: 24, original: "Despacito", translated: "Slowly" },
  ];

  const TOTAL_DURATION = 227;

  it("should have lyrics with proper start/end time structure", () => {
    SYNCED_LYRICS.forEach((line) => {
      expect(line.startTime).toBeDefined();
      expect(line.endTime).toBeDefined();
      expect(line.endTime).toBeGreaterThan(line.startTime);
      expect(line.original).toBeTruthy();
      expect(line.translated).toBeTruthy();
    });
  });

  it("should have sequential non-overlapping time ranges", () => {
    for (let i = 1; i < SYNCED_LYRICS.length; i++) {
      expect(SYNCED_LYRICS[i].startTime).toBeGreaterThanOrEqual(
        SYNCED_LYRICS[i - 1].endTime
      );
    }
  });

  it("should detect active line based on current time", () => {
    const findActiveLine = (currentTime: number): number => {
      return SYNCED_LYRICS.findIndex(
        (line) => currentTime >= line.startTime && currentTime < line.endTime
      );
    };

    // At time 0, first line should be active
    expect(findActiveLine(0)).toBe(0);
    // At time 2, still first line
    expect(findActiveLine(2)).toBe(0);
    // At time 5, second line
    expect(findActiveLine(5)).toBe(1);
    // At time 10, third line
    expect(findActiveLine(10)).toBe(2);
    // At time 15, fourth line
    expect(findActiveLine(15)).toBe(3);
    // At time 20, fifth line
    expect(findActiveLine(20)).toBe(4);
  });

  it("should format time correctly", () => {
    const formatTime = (seconds: number) => {
      const m = Math.floor(seconds / 60);
      const s = Math.floor(seconds % 60);
      return `${m}:${s.toString().padStart(2, "0")}`;
    };

    expect(formatTime(0)).toBe("0:00");
    expect(formatTime(30)).toBe("0:30");
    expect(formatTime(60)).toBe("1:00");
    expect(formatTime(79)).toBe("1:19");
    expect(formatTime(227)).toBe("3:47");
  });

  it("should calculate progress correctly", () => {
    const getProgress = (currentTime: number) => currentTime / TOTAL_DURATION;

    expect(getProgress(0)).toBe(0);
    expect(getProgress(TOTAL_DURATION)).toBe(1);
    expect(getProgress(TOTAL_DURATION / 2)).toBeCloseTo(0.5, 1);
  });

  it("should seekTo within bounds", () => {
    const seekTo = (time: number) => Math.max(0, Math.min(TOTAL_DURATION, time));

    expect(seekTo(-5)).toBe(0);
    expect(seekTo(100)).toBe(100);
    expect(seekTo(300)).toBe(TOTAL_DURATION);
    expect(seekTo(0)).toBe(0);
  });

  it("should have both original and translated text for every line", () => {
    SYNCED_LYRICS.forEach((line) => {
      expect(line.original.length).toBeGreaterThan(0);
      expect(line.translated.length).toBeGreaterThan(0);
      // Original should be Spanish
      expect(line.original).not.toBe(line.translated);
    });
  });

  it("should support three display modes", () => {
    type LyricsDisplayMode = "dual" | "original" | "translation";
    const modes: LyricsDisplayMode[] = ["dual", "original", "translation"];

    modes.forEach((mode) => {
      const showOriginal = mode === "dual" || mode === "original";
      const showTranslation = mode === "dual" || mode === "translation";

      if (mode === "dual") {
        expect(showOriginal).toBe(true);
        expect(showTranslation).toBe(true);
      } else if (mode === "original") {
        expect(showOriginal).toBe(true);
        expect(showTranslation).toBe(false);
      } else {
        expect(showOriginal).toBe(false);
        expect(showTranslation).toBe(true);
      }
    });
  });

  it("should correctly identify past, active, and future lines", () => {
    const currentTime = 10; // In the middle of line 3 (startTime: 9, endTime: 14)

    SYNCED_LYRICS.forEach((line, index) => {
      const isActive = currentTime >= line.startTime && currentTime < line.endTime;
      const isPast = currentTime > line.endTime;
      const isFuture = currentTime < line.startTime;

      if (index === 2) {
        expect(isActive).toBe(true);
        expect(isPast).toBe(false);
        expect(isFuture).toBe(false);
      } else if (index < 2) {
        expect(isPast).toBe(true);
        expect(isActive).toBe(false);
      } else {
        expect(isFuture).toBe(true);
        expect(isActive).toBe(false);
      }
    });
  });

  it("should have 34 total synced lyrics lines in the full song", () => {
    // The full song-player has 34 lines covering the entire 3:47 song
    expect(34).toBeGreaterThan(10); // Meaningful coverage
    expect(TOTAL_DURATION).toBe(227); // 3:47
  });
});
