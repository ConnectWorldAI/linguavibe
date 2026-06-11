/**
 * Tests for Voice Playback, Pronunciation Progress, and Smart Immersion Lessons
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── AI Partners Voice Playback ─────────────────────────────────────────────

describe("AI Partners Voice Playback (ElevenLabs TTS)", () => {
  it("should have speak endpoint in aiPartnersRouter", async () => {
    const router = await import("../server/aiPartnersRouter");
    expect(router.aiPartnersRouter).toBeDefined();
    // The router should have a speak procedure
    const procedures = Object.keys((router.aiPartnersRouter as any)._def.procedures || {});
    expect(procedures).toContain("speak");
  });

  it("should have chat endpoint in aiPartnersRouter", async () => {
    const router = await import("../server/aiPartnersRouter");
    const procedures = Object.keys((router.aiPartnersRouter as any)._def.procedures || {});
    expect(procedures).toContain("chat");
  });

  it("should have extractMemory endpoint in aiPartnersRouter", async () => {
    const router = await import("../server/aiPartnersRouter");
    const procedures = Object.keys((router.aiPartnersRouter as any)._def.procedures || {});
    expect(procedures).toContain("extractMemory");
  });

  it("should define PARTNER_VOICES with accent-appropriate voice IDs", async () => {
    const fs = await import("fs");
    const content = fs.readFileSync("server/aiPartnersRouter.ts", "utf-8");
    // Check that all 8 partners have voice configurations
    expect(content).toContain("prof_dubois:");
    expect(content).toContain("lucas_surf:");
    expect(content).toContain("yuki_vendor:");
    expect(content).toContain("carmen_abuela:");
    expect(content).toContain("hans_engineer:");
    expect(content).toContain("amara_poet:");
    expect(content).toContain("jin_gamer:");
    expect(content).toContain("sofia_dancer:");
    // Check ElevenLabs multilingual model
    expect(content).toContain("eleven_multilingual_v2");
  });

  it("should use storagePut for audio file persistence", async () => {
    const fs = await import("fs");
    const content = fs.readFileSync("server/aiPartnersRouter.ts", "utf-8");
    expect(content).toContain("storagePut");
    expect(content).toContain("ai-partner-audio");
  });

  it("should handle missing API key gracefully", async () => {
    const fs = await import("fs");
    const content = fs.readFileSync("server/aiPartnersRouter.ts", "utf-8");
    expect(content).toContain("TTS not configured");
  });

  it("should have voice playback UI in ai-partners screen", async () => {
    const fs = await import("fs");
    const content = fs.readFileSync("app/ai-partners.tsx", "utf-8");
    expect(content).toContain("handlePlayVoice");
    expect(content).toContain("playingMessageId");
    expect(content).toContain("loadingAudioId");
    expect(content).toContain("volume-high");
    expect(content).toContain("useAudioPlayer");
  });
});

// ─── Pronunciation Progress Timeline ────────────────────────────────────────

describe("Pronunciation Progress Timeline", () => {
  it("should exist as a screen file", async () => {
    const fs = await import("fs");
    expect(fs.existsSync("app/pronunciation-progress.tsx")).toBe(true);
  });

  it("should track scores over time with phoneme breakdown", async () => {
    const fs = await import("fs");
    const content = fs.readFileSync("app/pronunciation-progress.tsx", "utf-8");
    expect(content).toContain("PronunciationSession");
    expect(content).toContain("phonemeScores");
    expect(content).toContain("PhonemeProgress");
    expect(content).toContain("overallScore");
  });

  it("should render a bar graph visualization", async () => {
    const fs = await import("fs");
    const content = fs.readFileSync("app/pronunciation-progress.tsx", "utf-8");
    expect(content).toContain("renderGraph");
    expect(content).toContain("barsContainer");
    expect(content).toContain("barHeight");
  });

  it("should support time range filtering (week/month/all)", async () => {
    const fs = await import("fs");
    const content = fs.readFileSync("app/pronunciation-progress.tsx", "utf-8");
    expect(content).toContain("TimeRange");
    expect(content).toContain("\"week\"");
    expect(content).toContain("\"month\"");
    expect(content).toContain("\"all\"");
  });

  it("should include Time Capsule comparison", async () => {
    const fs = await import("fs");
    const content = fs.readFileSync("app/pronunciation-progress.tsx", "utf-8");
    expect(content).toContain("TimeCapsuleEntry");
    expect(content).toContain("Time Capsule");
    expect(content).toContain("capsuleComparison");
    expect(content).toContain("Day 1");
  });

  it("should calculate improvement trends per phoneme", async () => {
    const fs = await import("fs");
    const content = fs.readFileSync("app/pronunciation-progress.tsx", "utf-8");
    expect(content).toContain("\"improving\"");
    expect(content).toContain("\"declining\"");
    expect(content).toContain("\"stable\"");
    expect(content).toContain("getTrendIcon");
  });

  it("should persist progress data in AsyncStorage", async () => {
    const fs = await import("fs");
    const content = fs.readFileSync("app/pronunciation-progress.tsx", "utf-8");
    expect(content).toContain("@pronunciation_progress");
    expect(content).toContain("@time_capsule_entries");
    expect(content).toContain("AsyncStorage");
  });

  it("should be accessible from settings", async () => {
    const fs = await import("fs");
    const content = fs.readFileSync("app/settings.tsx", "utf-8");
    expect(content).toContain("pronunciation-progress");
    expect(content).toContain("Pronunciation Progress");
  });
});

// ─── Smart Immersion Lessons (Server-Generated) ─────────────────────────────

describe("Smart Immersion Lessons (Server-Generated)", () => {
  it("should have immersionLessonRouter registered in server", async () => {
    const fs = await import("fs");
    const content = fs.readFileSync("server/routers.ts", "utf-8");
    expect(content).toContain("immersionLessonRouter");
    expect(content).toContain("immersionLessons:");
  });

  it("should have generateLessons endpoint", async () => {
    const router = await import("../server/immersionLessonRouter");
    expect(router.immersionLessonRouter).toBeDefined();
    const procedures = Object.keys((router.immersionLessonRouter as any)._def.procedures || {});
    expect(procedures).toContain("generateLessons");
  });

  it("should have generateSingleLesson endpoint", async () => {
    const router = await import("../server/immersionLessonRouter");
    const procedures = Object.keys((router.immersionLessonRouter as any)._def.procedures || {});
    expect(procedures).toContain("generateSingleLesson");
  });

  it("should accept user level, vocabulary, and struggle areas as input", async () => {
    const fs = await import("fs");
    const content = fs.readFileSync("server/immersionLessonRouter.ts", "utf-8");
    expect(content).toContain("recentVocabulary");
    expect(content).toContain("struggleAreas");
    expect(content).toContain("level:");
    expect(content).toContain("targetLanguage");
  });

  it("should generate level-appropriate content", async () => {
    const fs = await import("fs");
    const content = fs.readFileSync("server/immersionLessonRouter.ts", "utf-8");
    expect(content).toContain("beginner");
    expect(content).toContain("intermediate");
    expect(content).toContain("advanced");
    expect(content).toContain("high-frequency vocabulary");
    expect(content).toContain("sophisticated vocabulary");
  });

  it("should use time-of-day context for relevant lessons", async () => {
    const fs = await import("fs");
    const content = fs.readFileSync("server/immersionLessonRouter.ts", "utf-8");
    expect(content).toContain("morning");
    expect(content).toContain("afternoon");
    expect(content).toContain("evening");
    expect(content).toContain("night");
    expect(content).toContain("timeOfDay");
  });

  it("should wire immersion-mode.tsx to tRPC for server lessons", async () => {
    const fs = await import("fs");
    const content = fs.readFileSync("app/immersion-mode.tsx", "utf-8");
    expect(content).toContain("trpc.immersionLessons.generateLessons");
    expect(content).toContain("fetchPersonalizedLessons");
    expect(content).toContain("@immersion_lessons_cache");
  });

  it("should return structured JSON lessons", async () => {
    const fs = await import("fs");
    const content = fs.readFileSync("server/immersionLessonRouter.ts", "utf-8");
    expect(content).toContain("json_object");
    expect(content).toContain("keyPoint");
    expect(content).toContain("pronunciation");
  });
});
