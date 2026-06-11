/**
 * Tests for:
 * 1. Live AR Camera Mode screen
 * 2. Offline Pack Download Persistence (expo-file-system)
 * 3. Voice-to-Voice Real-time Translation screen
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import * as fs from "fs";
import * as path from "path";

// ─── 1. Live AR Camera Screen Tests ────────────────────────────────────────

describe("Live AR Camera Screen", () => {
  const screenPath = path.resolve(__dirname, "../app/live-ar-camera.tsx");

  it("screen file exists", () => {
    expect(fs.existsSync(screenPath)).toBe(true);
  });

  it("imports CameraView and useCameraPermissions from expo-camera", () => {
    const content = fs.readFileSync(screenPath, "utf-8");
    expect(content).toContain("CameraView");
    expect(content).toContain("useCameraPermissions");
    expect(content).toContain("from \"expo-camera\"");
  });

  it("uses tRPC OCR mutation for text extraction", () => {
    const content = fs.readFileSync(screenPath, "utf-8");
    expect(content).toContain("trpc.translate.ocr.useMutation");
  });

  it("uses tRPC translate mutation for real-time translation", () => {
    const content = fs.readFileSync(screenPath, "utf-8");
    expect(content).toContain("trpc.translate.text.useMutation");
  });

  it("has continuous scanning interval logic", () => {
    const content = fs.readFileSync(screenPath, "utf-8");
    expect(content).toContain("SCAN_INTERVAL");
    expect(content).toContain("setInterval");
    expect(content).toContain("captureAndTranslate");
  });

  it("has scan frame with corner indicators", () => {
    const content = fs.readFileSync(screenPath, "utf-8");
    expect(content).toContain("scanFrame");
    expect(content).toContain("cornerTL");
    expect(content).toContain("cornerBR");
  });

  it("supports flash toggle", () => {
    const content = fs.readFileSync(screenPath, "utf-8");
    expect(content).toContain("flashEnabled");
    expect(content).toContain("enableTorch");
  });

  it("renders translation overlays on camera view", () => {
    const content = fs.readFileSync(screenPath, "utf-8");
    expect(content).toContain("overlayContainer");
    expect(content).toContain("overlayBubble");
    expect(content).toContain("overlayTranslated");
  });

  it("has auto-scan and manual capture modes", () => {
    const content = fs.readFileSync(screenPath, "utf-8");
    expect(content).toContain("startScanning");
    expect(content).toContain("stopScanning");
    expect(content).toContain("handleManualCapture");
  });

  it("handles camera permissions gracefully", () => {
    const content = fs.readFileSync(screenPath, "utf-8");
    expect(content).toContain("permission.granted");
    expect(content).toContain("requestPermission");
    expect(content).toContain("Camera Access Required");
  });

  it("has language selector for source and target", () => {
    const content = fs.readFileSync(screenPath, "utf-8");
    expect(content).toContain("fromLang");
    expect(content).toContain("toLang");
    expect(content).toContain("Auto-Detect");
  });

  it("cleans up interval on unmount", () => {
    const content = fs.readFileSync(screenPath, "utf-8");
    expect(content).toContain("clearInterval");
    expect(content).toMatch(/return\s*\(\)\s*=>\s*\{[\s\S]*clearInterval/);
  });
});

// ─── 2. Offline Pack Download Persistence Tests ────────────────────────────

describe("Offline Pack Download Persistence", () => {
  const screenPath = path.resolve(__dirname, "../app/offline-translation-packs.tsx");

  it("screen file exists", () => {
    expect(fs.existsSync(screenPath)).toBe(true);
  });

  it("imports expo-file-system for persistent storage", () => {
    const content = fs.readFileSync(screenPath, "utf-8");
    expect(content).toContain("expo-file-system");
    expect(content).toContain("FileSystem");
  });

  it("defines PACKS_DIR using documentDirectory", () => {
    const content = fs.readFileSync(screenPath, "utf-8");
    expect(content).toContain("PACKS_DIR");
    expect(content).toContain("documentDirectory");
    expect(content).toContain("offline_packs/");
  });

  it("has ensurePacksDir function to create directory", () => {
    const content = fs.readFileSync(screenPath, "utf-8");
    expect(content).toContain("async function ensurePacksDir");
    expect(content).toContain("makeDirectoryAsync");
  });

  it("has savePackToDisk function", () => {
    const content = fs.readFileSync(screenPath, "utf-8");
    expect(content).toContain("async function savePackToDisk");
    expect(content).toContain("writeAsStringAsync");
  });

  it("has readPackFromDisk function", () => {
    const content = fs.readFileSync(screenPath, "utf-8");
    expect(content).toContain("async function readPackFromDisk");
    expect(content).toContain("readAsStringAsync");
  });

  it("has deletePackFromDisk function", () => {
    const content = fs.readFileSync(screenPath, "utf-8");
    expect(content).toContain("async function deletePackFromDisk");
    expect(content).toContain("deleteAsync");
  });

  it("has getPacksDiskUsage function for storage calculation", () => {
    const content = fs.readFileSync(screenPath, "utf-8");
    expect(content).toContain("async function getPacksDiskUsage");
    expect(content).toContain("readDirectoryAsync");
  });

  it("verifies packs on disk during initialization", () => {
    const content = fs.readFileSync(screenPath, "utf-8");
    expect(content).toContain("isPackOnDisk");
    expect(content).toContain("Verify each");
  });

  it("uses tRPC offlinePack query for downloading real data", () => {
    const content = fs.readFileSync(screenPath, "utf-8");
    expect(content).toContain("trpc.translate.offlinePack.useQuery");
    expect(content).toContain("refetch");
  });

  it("saves downloaded pack data to device file system", () => {
    const content = fs.readFileSync(screenPath, "utf-8");
    expect(content).toContain("savePackToDisk(packId, dataToSave)");
  });

  it("supports quality levels (basic, standard, full) with different data sizes", () => {
    const content = fs.readFileSync(screenPath, "utf-8");
    expect(content).toContain("selectedQuality === \"basic\"");
    expect(content).toContain("selectedQuality === \"standard\"");
    expect(content).toContain("quality: \"full\"");
  });

  it("handles download failure gracefully with Alert", () => {
    const content = fs.readFileSync(screenPath, "utf-8");
    expect(content).toContain("Download Failed");
    expect(content).toContain("check your connection");
  });

  it("deletes pack from disk when user removes it", () => {
    const content = fs.readFileSync(screenPath, "utf-8");
    expect(content).toContain("deletePackFromDisk(pack.id)");
  });

  it("handles web platform gracefully (no file system ops)", () => {
    const content = fs.readFileSync(screenPath, "utf-8");
    expect(content).toContain('Platform.OS === "web"');
    // All file system functions should return early on web
    const webGuards = (content.match(/if \(Platform\.OS === "web"\) return/g) || []).length;
    expect(webGuards).toBeGreaterThanOrEqual(4);
  });
});

// ─── 3. Voice-to-Voice Real-time Translation Tests ─────────────────────────

describe("Voice-to-Voice Real-time Translation Screen", () => {
  const screenPath = path.resolve(__dirname, "../app/voice-to-voice-translate.tsx");

  it("screen file exists", () => {
    expect(fs.existsSync(screenPath)).toBe(true);
  });

  it("uses useSpeechToText hook for recording", () => {
    const content = fs.readFileSync(screenPath, "utf-8");
    expect(content).toContain("useSpeechToText");
    expect(content).toContain("startRecording");
    expect(content).toContain("stopRecording");
  });

  it("uses useHumeTranslator for bidirectional translation", () => {
    const content = fs.readFileSync(screenPath, "utf-8");
    expect(content).toContain("useHumeTranslator");
    expect(content).toContain('mode: "conversation"');
  });

  it("supports two speakers (user and other)", () => {
    const content = fs.readFileSync(screenPath, "utf-8");
    expect(content).toContain("handleUserSpeak");
    expect(content).toContain("handleOtherSpeak");
    expect(content).toContain("handleUserStopSpeak");
    expect(content).toContain("handleOtherStopSpeak");
  });

  it("has language swap functionality", () => {
    const content = fs.readFileSync(screenPath, "utf-8");
    expect(content).toContain("swapLanguages");
    expect(content).toContain("swap-horizontal");
  });

  it("supports multiple languages including dialects", () => {
    const content = fs.readFileSync(screenPath, "utf-8");
    expect(content).toContain("Dominican Spanish");
    expect(content).toContain("Mandarin");
    expect(content).toContain("Arabic");
  });

  it("has conversation history with speaker bubbles", () => {
    const content = fs.readFileSync(screenPath, "utf-8");
    expect(content).toContain("conversationHistory");
    expect(content).toContain("turnBubble");
    expect(content).toContain("userBubble");
    expect(content).toContain("otherBubble");
  });

  it("has waveform animation when speaking", () => {
    const content = fs.readFileSync(screenPath, "utf-8");
    expect(content).toContain("waveScale1");
    expect(content).toContain("waveCircle");
    expect(content).toContain("withRepeat");
  });

  it("uses TTS to speak translations aloud", () => {
    const content = fs.readFileSync(screenPath, "utf-8");
    expect(content).toContain("Speech.speak");
    expect(content).toContain("trpc.translate.tts.useMutation");
  });

  it("has push-to-talk and continuous modes", () => {
    const content = fs.readFileSync(screenPath, "utf-8");
    expect(content).toContain("push-to-talk");
    expect(content).toContain("continuous");
    expect(content).toContain("ConversationMode");
  });

  it("has session start/stop lifecycle", () => {
    const content = fs.readFileSync(screenPath, "utf-8");
    expect(content).toContain("startSession");
    expect(content).toContain("endSession");
    expect(content).toContain("isSessionActive");
  });

  it("shows live session duration badge", () => {
    const content = fs.readFileSync(screenPath, "utf-8");
    expect(content).toContain("liveBadge");
    expect(content).toContain("formattedDuration");
  });

  it("has language picker overlay", () => {
    const content = fs.readFileSync(screenPath, "utf-8");
    expect(content).toContain("langPickerOverlay");
    expect(content).toContain("showLangPicker");
  });

  it("tracks emotion from Hume translator", () => {
    const content = fs.readFileSync(screenPath, "utf-8");
    expect(content).toContain("speakerEmotion");
    expect(content).toContain("emotion");
  });

  it("auto-scrolls conversation to bottom", () => {
    const content = fs.readFileSync(screenPath, "utf-8");
    expect(content).toContain("scrollToEnd");
    expect(content).toContain("scrollRef");
  });
});

// ─── 4. Integration: Navigation Wiring Tests ───────────────────────────────

describe("Navigation Wiring from Translate Tab", () => {
  const translatePath = path.resolve(__dirname, "../app/(tabs)/translate.tsx");

  it("translate tab has Live AR Camera entry in More Actions", () => {
    const content = fs.readFileSync(translatePath, "utf-8");
    expect(content).toContain("/live-ar-camera");
    expect(content).toContain("Live AR Camera");
  });

  it("translate tab has Voice-to-Voice entry in More Actions", () => {
    const content = fs.readFileSync(translatePath, "utf-8");
    expect(content).toContain("/voice-to-voice-translate");
    expect(content).toContain("Voice-to-Voice");
  });
});
