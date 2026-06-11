import { describe, it, expect, vi } from "vitest";
import * as fs from "fs";
import * as path from "path";

const appDir = path.join(__dirname, "..", "app");
const libDir = path.join(__dirname, "..", "lib");
const layoutPath = path.join(appDir, "_layout.tsx");
const layoutSrc = fs.readFileSync(layoutPath, "utf-8");

// ─── Translator UX Fixes ──────────────────────────────────────────────────────
describe("Translator UX Fixes", () => {
  const translateSrc = fs.readFileSync(path.join(appDir, "(tabs)", "translate.tsx"), "utf-8");

  it("has a clear button for the output/translation field", () => {
    // Should have a way to clear the translated text
    expect(translateSrc).toContain("setTranslatedText");
    // Should have a clear action for output (close-circle or similar)
    expect(translateSrc).toMatch(/close-circle|clearOutput|setTranslatedText\(""\)/);
  });

  it("has real-time translation as you type (debounced)", () => {
    // Should have a debounce timer or useEffect watching inputText
    expect(translateSrc).toMatch(/debounce|setTimeout|useEffect.*inputText/s);
    // Should auto-translate without pressing a button (uses translateMutation inline)
    expect(translateSrc).toContain("translateMutation");
  });

  it("has voice playback with expo-speech fallback", () => {
    // Should import Speech from expo-speech
    expect(translateSrc).toMatch(/expo-speech|Speech\.speak/);
    // Should have a listen/play function
    expect(translateSrc).toMatch(/handleListen|playAudio|speakOutput/);
  });

  it("has clear buttons for both input AND output fields", () => {
    // New UI uses handleClear to clear both input and output, plus close-circle in search
    expect(translateSrc).toContain("handleClear");
    expect(translateSrc).toContain("setTranslatedText");
    expect(translateSrc).toContain("setInputText");
  });
});

// ─── SRS Push Notification Reminders ──────────────────────────────────────────
describe("SRS Push Notification Reminders", () => {
  const notifSrc = fs.readFileSync(path.join(libDir, "notifications.ts"), "utf-8");

  it("has SRS review notification scheduling function", () => {
    expect(notifSrc).toMatch(/scheduleSrsReviewNotification|scheduleSrsReminder|srs.*notification/i);
  });

  it("checks for due items count", () => {
    expect(notifSrc).toMatch(/getDueCount|dueCount|due.*items/i);
  });

  it("schedules a notification with review content", () => {
    expect(notifSrc).toMatch(/scheduleNotificationAsync|Notifications\.schedule/);
  });

  const srsSrc = fs.readFileSync(path.join(appDir, "srs-review.tsx"), "utf-8");

  it("srs-review screen imports notification function", () => {
    expect(srsSrc).toMatch(/scheduleSrsReviewNotification|notifications/);
  });

  it("triggers notification scheduling after review session", () => {
    // Should call notification scheduling somewhere in the review flow
    expect(srsSrc).toMatch(/scheduleSrs|scheduleNext|notification/i);
  });
});

// ─── Challenge Leaderboard ────────────────────────────────────────────────────
describe("Challenge Leaderboard", () => {
  const leaderboardPath = path.join(appDir, "challenge-leaderboard.tsx");

  it("challenge-leaderboard.tsx exists", () => {
    expect(fs.existsSync(leaderboardPath)).toBe(true);
  });

  const leaderboardSrc = fs.readFileSync(leaderboardPath, "utf-8");

  it("has a default export", () => {
    expect(leaderboardSrc).toMatch(/export default function/);
  });

  it("displays XP rankings", () => {
    expect(leaderboardSrc).toMatch(/XP|xp|points/i);
  });

  it("displays streak data", () => {
    expect(leaderboardSrc).toMatch(/streak/i);
  });

  it("has time filter tabs (daily/weekly/all-time)", () => {
    expect(leaderboardSrc).toMatch(/daily|weekly|all.?time|Today|This Week/i);
  });

  it("shows podium/top 3 users", () => {
    expect(leaderboardSrc).toMatch(/podium|top.*3|first.*place|gold|silver|bronze|rank/i);
  });

  it("loads user XP from AsyncStorage", () => {
    expect(leaderboardSrc).toContain("AsyncStorage");
    expect(leaderboardSrc).toMatch(/@total_xp|@current_streak|xp/i);
  });

  it("is registered in _layout.tsx", () => {
    expect(layoutSrc).toContain("challenge-leaderboard");
  });

  it("is navigable from daily-challenges", () => {
    const challengesSrc = fs.readFileSync(path.join(appDir, "daily-challenges.tsx"), "utf-8");
    expect(challengesSrc).toContain("challenge-leaderboard");
  });
});

// ─── Partner Chat Voice Messages ──────────────────────────────────────────────
describe("Partner Chat Voice Messages", () => {
  const chatSrc = fs.readFileSync(path.join(appDir, "partner-chat.tsx"), "utf-8");

  it("imports expo-audio recording APIs", () => {
    expect(chatSrc).toContain("useAudioRecorder");
    expect(chatSrc).toContain("RecordingPresets");
  });

  it("has startRecording function", () => {
    expect(chatSrc).toContain("startRecording");
  });

  it("has stopRecording function", () => {
    expect(chatSrc).toContain("stopRecording");
  });

  it("has cancelRecording function", () => {
    expect(chatSrc).toContain("cancelRecording");
  });

  it("has playVoiceMessage function", () => {
    expect(chatSrc).toContain("playVoiceMessage");
  });

  it("requests microphone permissions", () => {
    expect(chatSrc).toContain("requestRecordingPermissionsAsync");
  });

  it("ChatMessage type includes audioUri and audioDuration", () => {
    expect(chatSrc).toContain("audioUri");
    expect(chatSrc).toContain("audioDuration");
  });

  it("renders voice message bubbles with waveform", () => {
    expect(chatSrc).toMatch(/voiceWaveform|waveBar|play-circle|pause-circle/);
  });

  it("shows recording overlay with timer and cancel/send buttons", () => {
    expect(chatSrc).toMatch(/recordingOverlay|recordingTimer|cancelRecord/);
  });

  it("has voice message duration display", () => {
    expect(chatSrc).toContain("formatDuration");
  });

  it("creates audio player for playback", () => {
    expect(chatSrc).toContain("createAudioPlayer");
  });

  it("cleans up audio resources on unmount", () => {
    // Should have cleanup in useEffect return
    expect(chatSrc).toMatch(/recordingTimer\.current.*clearInterval|currentPlayer\.current.*remove/s);
  });
});

// ─── @lukebuildsai Research ───────────────────────────────────────────────────
describe("@lukebuildsai Architecture Research", () => {
  const researchPath = path.join(__dirname, "..", "research-lukebuildsai.md");

  it("research file exists", () => {
    expect(fs.existsSync(researchPath)).toBe(true);
  });

  const researchSrc = fs.readFileSync(researchPath, "utf-8");

  it("covers agent architecture patterns", () => {
    expect(researchSrc).toMatch(/agent|workflow|pipeline|architecture/i);
  });

  it("includes actionable recommendations for ConnectWorld", () => {
    expect(researchSrc).toMatch(/recommend|ConnectWorld|apply|implement/i);
  });
});
