/**
 * Tests for Memory Visualization, Daily Lesson Streak Widget, and Native Audio Samples
 */
import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

describe("Conversation Memory Visualization", () => {
  const filePath = path.join(__dirname, "../app/ai-partners.tsx");
  const content = fs.readFileSync(filePath, "utf-8");

  it("has memory card state variables", () => {
    expect(content).toContain("showMemoryCard");
    expect(content).toContain("editingMemory");
    expect(content).toContain("editedMemory");
  });

  it("renders 'What I Remember About You' card", () => {
    expect(content).toContain("What I Remember About You");
  });

  it("has brain icon toggle button", () => {
    expect(content).toContain("brain-outline");
    expect(content).toContain("setShowMemoryCard");
  });

  it("supports editing memory", () => {
    expect(content).toContain("Edit what the AI remembers about you");
    expect(content).toContain("setEditingMemory(true)");
  });

  it("supports clearing memory", () => {
    expect(content).toContain("Clear Memory");
    expect(content).toContain("AsyncStorage.removeItem");
  });

  it("shows empty state when no memory exists", () => {
    expect(content).toContain("Keep chatting!");
    expect(content).toContain("will start remembering things about you");
  });

  it("displays session count and memory update frequency", () => {
    expect(content).toContain("sessions • Memory updates every 10 messages");
  });

  it("saves edited memory to AsyncStorage", () => {
    expect(content).toContain("AsyncStorage.setItem(`@ai_partner_memory_${selectedPartner.id}`");
  });
});

describe("Daily Lesson Streak Widget", () => {
  const widgetPath = path.join(__dirname, "../components/daily-lesson-streak-widget.tsx");
  const widgetContent = fs.readFileSync(widgetPath, "utf-8");

  it("widget component file exists", () => {
    expect(fs.existsSync(widgetPath)).toBe(true);
  });

  it("reads immersion settings from AsyncStorage", () => {
    expect(widgetContent).toContain("@immersion_mode_settings");
  });

  it("reads pronunciation progress from AsyncStorage", () => {
    expect(widgetContent).toContain("@pronunciation_progress");
  });

  it("shows lessons today count", () => {
    expect(widgetContent).toContain("Lessons Today");
  });

  it("shows pronunciation score with trend", () => {
    expect(widgetContent).toContain("Pron. Score");
    expect(widgetContent).toContain("pronunciationTrend");
  });

  it("shows next notification time", () => {
    expect(widgetContent).toContain("Next Lesson");
    expect(widgetContent).toContain("nextNotificationTime");
  });

  it("shows immersion streak bar", () => {
    expect(widgetContent).toContain("immersion streak");
    expect(widgetContent).toContain("streakBarFill");
  });

  it("links to immersion mode and pronunciation progress", () => {
    expect(widgetContent).toContain("/immersion-mode");
    expect(widgetContent).toContain("/pronunciation-progress");
  });

  it("is imported and rendered in home screen", () => {
    const homePath = path.join(__dirname, "../app/(tabs)/index.tsx");
    const homeContent = fs.readFileSync(homePath, "utf-8");
    expect(homeContent).toContain("DailyLessonStreakWidget");
    expect(homeContent).toContain("daily-pulse");
  });
});

describe("Native Audio Samples for Speech Coach", () => {
  const filePath = path.join(__dirname, "../app/speech-coach.tsx");
  const content = fs.readFileSync(filePath, "utf-8");

  it("has native audio playback state", () => {
    expect(content).toContain("isPlayingNative");
    expect(content).toContain("isLoadingNative");
    expect(content).toContain("nativeAudioCache");
  });

  it("uses rrtAudio.generatePhraseAudio mutation", () => {
    expect(content).toContain("trpc.rrtAudio.generatePhraseAudio.useMutation");
  });

  it("has handlePlayNative function", () => {
    expect(content).toContain("handlePlayNative");
  });

  it("uses createAudioPlayer for playback", () => {
    expect(content).toContain("createAudioPlayer");
  });

  it("caches generated audio URLs", () => {
    expect(content).toContain("nativeAudioCache[drill.id]");
    expect(content).toContain("setNativeAudioCache");
  });

  it("has expo-speech fallback", () => {
    expect(content).toContain("Speech.speak(drill.word");
    expect(content).toContain("fr-FR");
  });

  it("wires the Listen to Native button with onPress", () => {
    expect(content).toContain("onPress={() => handlePlayNative(currentDrill)");
  });

  it("shows loading state on button", () => {
    expect(content).toContain("Loading...");
    expect(content).toContain("disabled={isLoadingNative}");
  });

  it("cleans up player on unmount", () => {
    expect(content).toContain("nativePlayerRef.current.remove()");
  });
});
