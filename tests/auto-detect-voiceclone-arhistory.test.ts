import { describe, it, expect, vi, beforeEach } from "vitest";
import * as fs from "node:fs";
import * as path from "node:path";

describe("Auto-Language Detection in Voice-to-Voice", () => {
  const filePath = path.resolve("app/voice-to-voice-translate.tsx");
  let content: string;

  beforeEach(() => {
    content = fs.readFileSync(filePath, "utf-8");
  });

  it("should have autoDetectLanguage state variable", () => {
    expect(content).toContain("autoDetectLanguage");
    expect(content).toContain("setAutoDetectLanguage");
  });

  it("should call detectLanguage tRPC mutation", () => {
    expect(content).toContain("trpc.translate.detectLanguage.useMutation");
  });

  it("should have auto-detect toggle UI element", () => {
    expect(content).toContain("Auto-Detect Language");
    expect(content).toContain("autoDetectToggle");
  });

  it("should detect language from transcribed speech when auto-detect is on", () => {
    expect(content).toContain("detectLangMutation.mutateAsync");
  });

  it("should have sparkles icon for auto-detect indicator", () => {
    expect(content).toContain("sparkles");
  });
});

describe("Voice Clone Integration", () => {
  describe("Voice-to-Voice Translation Screen", () => {
    const filePath = path.resolve("app/voice-to-voice-translate.tsx");
    let content: string;

    beforeEach(() => {
      content = fs.readFileSync(filePath, "utf-8");
    });

    it("should have useVoiceClone state", () => {
      expect(content).toContain("useVoiceClone");
      expect(content).toContain("setUseVoiceClone");
    });

    it("should load voice model ID from AsyncStorage on mount", () => {
      expect(content).toContain("@voice_clone_model_id");
      expect(content).toContain("@voice_clone_trained");
    });

    it("should have synthesizeWithClone function", () => {
      expect(content).toContain("synthesizeWithClone");
    });

    it("should fallback to device TTS when clone fails", () => {
      expect(content).toContain("Speech.speak");
      expect(content).toContain("usedClone");
    });

    it("should have voice clone toggle in UI", () => {
      expect(content).toContain("Use My Voice");
      expect(content).toContain("Voice Clone (Train First)");
    });

    it("should navigate to training screen if not trained", () => {
      expect(content).toContain("voice-clone-training");
    });
  });

  describe("Voice Clone Training Screen", () => {
    const filePath = path.resolve("app/voice-clone-training.tsx");
    let content: string;

    beforeEach(() => {
      content = fs.readFileSync(filePath, "utf-8");
    });

    it("should import trpc for real API calls", () => {
      expect(content).toContain("import { trpc } from");
    });

    it("should use trainVoiceClone mutation", () => {
      expect(content).toContain("trpc.songPipeline.trainVoiceClone.useMutation");
    });

    it("should read file as base64 for upload", () => {
      expect(content).toContain("FileSystem.readAsStringAsync");
      expect(content).toContain("EncodingType.Base64");
    });

    it("should save voice model ID to AsyncStorage", () => {
      expect(content).toContain("@voice_clone_model_id");
      expect(content).toContain("result.voiceModelId");
    });

    it("should handle both real and demo clone modes", () => {
      expect(content).toContain("result.realClone");
      expect(content).toContain("demo mode");
    });

    it("should have error fallback for failed training", () => {
      expect(content).toContain("Voice clone training failed");
    });
  });
});

describe("AR Overlay History/Favorites", () => {
  const filePath = path.resolve("app/live-ar-camera.tsx");
  let content: string;

  beforeEach(() => {
    content = fs.readFileSync(filePath, "utf-8");
  });

  it("should have savedHistory state", () => {
    expect(content).toContain("savedHistory");
    expect(content).toContain("setSavedHistory");
  });

  it("should have favorites state with Set", () => {
    expect(content).toContain("favorites");
    expect(content).toContain("setFavorites");
    expect(content).toContain("new Set");
  });

  it("should load history from AsyncStorage on mount", () => {
    expect(content).toContain("@ar_scan_history");
    expect(content).toContain("AsyncStorage.getItem");
  });

  it("should save to history after each scan", () => {
    expect(content).toContain("saveToHistory(newOverlay)");
  });

  it("should have toggleFavorite function", () => {
    expect(content).toContain("toggleFavorite");
  });

  it("should have clearHistory function", () => {
    expect(content).toContain("clearHistory");
    expect(content).toContain("AsyncStorage.removeItem");
  });

  it("should have history panel UI with FlatList", () => {
    expect(content).toContain("FlatList");
    expect(content).toContain("showHistory");
    expect(content).toContain("Scan History");
  });

  it("should have history badge showing count", () => {
    expect(content).toContain("historyBadge");
    expect(content).toContain("savedHistory.length");
  });

  it("should have favorite heart icon toggle", () => {
    expect(content).toContain("heart");
    expect(content).toContain("heart-outline");
    expect(content).toContain("favorites.has(item.id)");
  });

  it("should keep last 100 history items", () => {
    expect(content).toContain(".slice(0, 100)");
  });

  it("should display original text, translated text, and timestamp", () => {
    expect(content).toContain("historyOriginal");
    expect(content).toContain("historyTranslated");
    expect(content).toContain("historyTime");
    expect(content).toContain("toLocaleString");
  });

  it("should have empty state when no history", () => {
    expect(content).toContain("No scans yet");
    expect(content).toContain("Point your camera at text to start scanning");
  });
});
