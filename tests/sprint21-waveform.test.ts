/**
 * Sprint 21 Tests — Waveform Comparison Feature
 *
 * Tests cover:
 * 1. WaveformComparison component props and rendering
 * 2. useWaveformCapture hook logic (metering, samples, similarity)
 * 3. Integration with pronunciation drill (route params, native audio, recording)
 */
import { describe, it, expect } from "vitest";
import { calculateWaveformSimilarity } from "../hooks/use-waveform-capture";

describe("Sprint 21: Waveform Comparison", () => {
  describe("WaveformComparison Component", () => {
    it("exports WaveformComparison component", async () => {
      const fs = await import("fs");
      const content = fs.readFileSync("components/waveform-comparison.tsx", "utf-8");
      expect(content).toContain("export function WaveformComparison");
      expect(content).toContain("WaveformComparisonProps");
    });

    it("WaveformComparison accepts required props interface", async () => {
      const fs = await import("fs");
      const content = fs.readFileSync("components/waveform-comparison.tsx", "utf-8");
      expect(content).toContain("nativeWaveform: WaveformData");
      expect(content).toContain("userWaveform: WaveformData");
      expect(content).toContain("isNativePlaying");
      expect(content).toContain("isUserRecording");
      expect(content).toContain("similarityScore");
    });
  });

  describe("useWaveformCapture Hook", () => {
    it("exports useWaveformCapture hook", async () => {
      const mod = await import("../hooks/use-waveform-capture");
      expect(mod.useWaveformCapture).toBeDefined();
      expect(typeof mod.useWaveformCapture).toBe("function");
    });

    it("exports calculateWaveformSimilarity utility", () => {
      expect(calculateWaveformSimilarity).toBeDefined();
      expect(typeof calculateWaveformSimilarity).toBe("function");
    });

    it("calculateWaveformSimilarity returns 0 for empty arrays", () => {
      expect(calculateWaveformSimilarity([], [])).toBe(0);
      expect(calculateWaveformSimilarity([0.5, 0.6], [])).toBe(0);
      expect(calculateWaveformSimilarity([], [0.5, 0.6])).toBe(0);
    });

    it("calculateWaveformSimilarity returns 100 for identical waveforms", () => {
      const waveform = [0.5, 0.6, 0.7, 0.8, 0.9, 0.7, 0.5, 0.3];
      const score = calculateWaveformSimilarity(waveform, waveform);
      expect(score).toBe(100);
    });

    it("calculateWaveformSimilarity returns high score for similar waveforms", () => {
      const a = [0.5, 0.6, 0.7, 0.8, 0.9, 0.7, 0.5, 0.3];
      const b = [0.52, 0.58, 0.72, 0.78, 0.88, 0.72, 0.48, 0.32];
      const score = calculateWaveformSimilarity(a, b);
      expect(score).toBeGreaterThan(90);
    });

    it("calculateWaveformSimilarity returns low score for very different waveforms", () => {
      const a = [0.9, 0.9, 0.9, 0.9, 0.9, 0.9, 0.9, 0.9];
      const b = [0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1];
      const score = calculateWaveformSimilarity(a, b);
      expect(score).toBeLessThan(30);
    });

    it("calculateWaveformSimilarity handles different length arrays", () => {
      const a = [0.5, 0.6, 0.7, 0.8, 0.9, 0.7, 0.5, 0.3, 0.4, 0.5];
      const b = [0.5, 0.6, 0.7, 0.8];
      const score = calculateWaveformSimilarity(a, b);
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    });

    it("calculateWaveformSimilarity returns value between 0-100", () => {
      const a = Array.from({ length: 48 }, () => Math.random());
      const b = Array.from({ length: 48 }, () => Math.random());
      const score = calculateWaveformSimilarity(a, b);
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    });
  });

  describe("Pronunciation Drill Integration", () => {
    it("pronunciation drill screen imports waveform components", async () => {
      const fs = await import("fs");
      const content = fs.readFileSync("app/pronunciation-drill.tsx", "utf-8");
      expect(content).toContain("WaveformComparison");
      expect(content).toContain("useWaveformCapture");
    });

    it("pronunciation drill has Listen to Native button", async () => {
      const fs = await import("fs");
      const content = fs.readFileSync("app/pronunciation-drill.tsx", "utf-8");
      expect(content).toContain("Listen to Native");
      expect(content).toContain("playNativeAudio");
    });

    it("pronunciation drill captures metering during recording", async () => {
      const fs = await import("fs");
      const content = fs.readFileSync("app/pronunciation-drill.tsx", "utf-8");
      expect(content).toContain("isMeteringEnabled: true");
      expect(content).toContain("waveform.startUserCapture");
      expect(content).toContain("waveform.stopUserCapture");
    });

    it("pronunciation drill uses ElevenLabs for native audio", async () => {
      const fs = await import("fs");
      const content = fs.readFileSync("app/pronunciation-drill.tsx", "utf-8");
      expect(content).toContain("generatePronunciationMutation");
      expect(content).toContain("voiceExercise.generatePronunciation");
    });

    it("pronunciation drill shows waveform comparison when data available", async () => {
      const fs = await import("fs");
      const content = fs.readFileSync("app/pronunciation-drill.tsx", "utf-8");
      expect(content).toContain("<WaveformComparison");
      expect(content).toContain("nativeWaveform={waveform.nativeWaveform}");
      expect(content).toContain("userWaveform={waveform.userWaveform}");
      expect(content).toContain("similarityScore={waveformSimilarity}");
    });

    it("pronunciation drill resets waveform on word navigation", async () => {
      const fs = await import("fs");
      const content = fs.readFileSync("app/pronunciation-drill.tsx", "utf-8");
      expect(content).toContain("waveform.reset()");
      expect(content).toContain("setWaveformSimilarity(null)");
    });

    it("pronunciation drill calculates similarity after analysis", async () => {
      const fs = await import("fs");
      const content = fs.readFileSync("app/pronunciation-drill.tsx", "utf-8");
      expect(content).toContain("waveform.getSimilarityScore()");
    });

    it("pronunciation drill has native player cleanup on unmount", async () => {
      const fs = await import("fs");
      const content = fs.readFileSync("app/pronunciation-drill.tsx", "utf-8");
      expect(content).toContain("nativePlayerRef.current");
      expect(content).toContain("player.remove()");
    });

    it("waveform comparison shows animated bars during recording", async () => {
      const fs = await import("fs");
      const content = fs.readFileSync("components/waveform-comparison.tsx", "utf-8");
      expect(content).toContain("isAnimating");
      expect(content).toContain("WaveformBar");
      expect(content).toContain("Animated.loop");
    });

    it("waveform comparison shows similarity score badge", async () => {
      const fs = await import("fs");
      const content = fs.readFileSync("components/waveform-comparison.tsx", "utf-8");
      expect(content).toContain("similarityScore");
      expect(content).toContain("% match");
    });

    it("waveform comparison has native speaker and user sections", async () => {
      const fs = await import("fs");
      const content = fs.readFileSync("components/waveform-comparison.tsx", "utf-8");
      expect(content).toContain("Native Speaker");
      expect(content).toContain("Your Recording");
    });
  });
});
