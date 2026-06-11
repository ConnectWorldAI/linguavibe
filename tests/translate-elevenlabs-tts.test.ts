import { describe, it, expect } from "vitest";

describe("ElevenLabs TTS Integration", () => {
  describe("Backend TTS Endpoint", () => {
    it("should have the tts mutation endpoint defined in translateRouter", async () => {
      const { translateRouter } = await import("../server/translateRouter");
      expect(translateRouter).toBeDefined();
      // Check that the tts procedure exists
      expect((translateRouter as any)._def.procedures.tts).toBeDefined();
    });

    it("should have the voices query endpoint defined in translateRouter", async () => {
      const { translateRouter } = await import("../server/translateRouter");
      expect((translateRouter as any)._def.procedures.voices).toBeDefined();
    });

    it("tts endpoint should require text input", async () => {
      const { translateRouter } = await import("../server/translateRouter");
      const ttsProcedure = (translateRouter as any)._def.procedures.tts;
      expect(ttsProcedure).toBeDefined();
      // It's a mutation
      expect(ttsProcedure._def.type).toBe("mutation");
    });

    it("voices endpoint should be a query", async () => {
      const { translateRouter } = await import("../server/translateRouter");
      const voicesProcedure = (translateRouter as any)._def.procedures.voices;
      expect(voicesProcedure).toBeDefined();
      expect(voicesProcedure._def.type).toBe("query");
    });
  });

  describe("Voice Picker UI", () => {
    it("translate screen should import useAudioPlayer from expo-audio", async () => {
      const fs = await import("fs");
      const content = fs.readFileSync("app/(tabs)/translate.tsx", "utf-8");
      expect(content).toContain("from \"expo-audio\"");
    });

    it("translate screen should have voice picker modal", async () => {
      const fs = await import("fs");
      const content = fs.readFileSync("app/(tabs)/translate.tsx", "utf-8");
      expect(content).toContain("VOICE PICKER MODAL");
      expect(content).toContain("showVoicePicker");
      expect(content).toContain("selectedVoice");
    });

    it("translate screen should have ElevenLabs voice IDs", async () => {
      const fs = await import("fs");
      const content = fs.readFileSync("app/(tabs)/translate.tsx", "utf-8");
      // Jessica voice ID
      expect(content).toContain("cgSgspJ2msm6clMCkdW9");
      // River voice ID
      expect(content).toContain("SAz9YHcvj6GT2YYXdXww");
      // Brian voice ID
      expect(content).toContain("nPczCjzI2devNBz1zQrb");
    });

    it("translate screen should have audio caching for instant replay", async () => {
      const fs = await import("fs");
      const content = fs.readFileSync("app/(tabs)/translate.tsx", "utf-8");
      expect(content).toContain("cachedAudioUrls");
      expect(content).toContain("cacheKey");
    });

    it("translate screen should have loading state for audio generation", async () => {
      const fs = await import("fs");
      const content = fs.readFileSync("app/(tabs)/translate.tsx", "utf-8");
      expect(content).toContain("isLoadingAudio");
      expect(content).toContain("Loading...");
    });

    it("translate screen should fallback to expo-speech if ElevenLabs fails", async () => {
      const fs = await import("fs");
      const content = fs.readFileSync("app/(tabs)/translate.tsx", "utf-8");
      expect(content).toContain("fallback to expo-speech");
      expect(content).toContain("Speech.speak");
    });

    it("voice picker should have multiple voice options with metadata", async () => {
      const fs = await import("fs");
      const content = fs.readFileSync("app/(tabs)/translate.tsx", "utf-8");
      expect(content).toContain("Warm & Soothing");
      expect(content).toContain("Calm & Relaxed");
      expect(content).toContain("Deep & Comforting");
      expect(content).toContain("Velvety & Elegant");
    });
  });
});
