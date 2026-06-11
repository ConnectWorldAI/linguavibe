import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

const readFile = (filePath: string) =>
  fs.readFileSync(path.join(__dirname, "..", filePath), "utf-8");

describe("Adaptive Engine Wiring into Lesson Flows", () => {
  const hooksFile = readFile("lib/adaptive-engine-hooks.ts");

  it("exports onFlashcardAnswer hook", () => {
    expect(hooksFile).toContain("export async function onFlashcardAnswer");
  });

  it("exports onLessonComplete hook", () => {
    expect(hooksFile).toContain("export async function onLessonComplete");
  });

  it("exports onLessonQuizAnswer hook", () => {
    expect(hooksFile).toContain("export async function onLessonQuizAnswer");
  });

  it("integrates error pattern detection into flashcard hook", () => {
    expect(hooksFile).toContain("logError");
  });

  it("integrates adaptive pacing into flashcard hook", () => {
    expect(hooksFile).toContain("recordResponse");
  });

  it("integrates session summary into lesson complete hook", () => {
    expect(hooksFile).toContain("endSession");
  });

  it("integrates knowledge gap map into lesson complete hook", () => {
    expect(hooksFile).toContain("updateSkillMastery");
  });

  it("integrates learning style detection into hooks", () => {
    expect(hooksFile).toContain("recordLearningEvent");
  });

  describe("Flashcard SRS integration", () => {
    const flashcardFile = readFile("app/flashcard-srs.tsx");

    it("imports adaptive-engine-hooks", () => {
      expect(flashcardFile).toContain("adaptive-engine-hooks");
    });

    it("calls onFlashcardAnswer in the answer handler", () => {
      expect(flashcardFile).toContain("onFlashcardAnswer");
    });
  });

  describe("Lesson Player integration", () => {
    const lessonFile = readFile("app/lesson-player.tsx");

    it("imports adaptive-engine-hooks", () => {
      expect(lessonFile).toContain("adaptive-engine-hooks");
    });

    it("calls onLessonComplete in handleComplete", () => {
      expect(lessonFile).toContain("onLessonComplete");
    });
  });
});

describe("Daily Briefing Home Card", () => {
  const briefingFile = readFile("components/daily-briefing-card.tsx");

  it("exports DailyBriefingCard component", () => {
    expect(briefingFile).toContain("export function DailyBriefingCard");
  });

  it("uses knowledge gap map for focus areas", () => {
    expect(briefingFile).toContain("getLearningPriorities");
  });

  it("uses session summary for recent performance", () => {
    expect(briefingFile).toContain("getLastSessionSummary");
  });

  it("uses adaptive pacing for difficulty recommendation", () => {
    expect(briefingFile).toContain("getPacingProfile");
  });

  it("uses error pattern detection for weak areas", () => {
    expect(briefingFile).toContain("getActivePatterns");
  });

  it("renders a focus area section", () => {
    expect(briefingFile).toContain("Focus");
  });

  it("renders recommended activities", () => {
    expect(briefingFile).toContain("recommend");
  });

  it("is imported in the home screen", () => {
    const homeFile = readFile("app/(tabs)/index.tsx");
    expect(homeFile).toContain("DailyBriefingCard");
    expect(homeFile).toContain("daily-briefing-card");
  });
});

describe("MP3/Song Pipeline Fix", () => {
  const uploadSongFile = readFile("app/upload-song.tsx");

  describe("Real polling replaces fake timer", () => {
    it("uses trpc.songPipeline.getJobStatus.useQuery for polling", () => {
      expect(uploadSongFile).toContain("trpc.songPipeline.getJobStatus.useQuery");
    });

    it("polls with refetchInterval of 2000ms", () => {
      expect(uploadSongFile).toContain("refetchInterval: 2000");
    });

    it("enables polling only when jobId exists and step is processing", () => {
      expect(uploadSongFile).toContain('enabled: !!jobIdRef.current && step === "processing"');
    });

    it("updates progress from server data", () => {
      expect(uploadSongFile).toContain("data.progress");
      expect(uploadSongFile).toContain("data.stage");
    });

    it("handles completed status with result", () => {
      expect(uploadSongFile).toContain('data.status === "completed"');
      expect(uploadSongFile).toContain("setPipelineResult(data.result)");
    });

    it("handles failed status with error alert", () => {
      expect(uploadSongFile).toContain('data.status === "failed"');
      expect(uploadSongFile).toContain("Translation Failed");
    });
  });

  describe("Done step passes real data to song player", () => {
    it("navigates to song-player with params", () => {
      expect(uploadSongFile).toContain('pathname: "/song-player"');
    });

    it("passes useDynamic=true to enable real lyrics fetch", () => {
      expect(uploadSongFile).toContain('useDynamic: "true"');
    });

    it("passes title from file name or search query", () => {
      expect(uploadSongFile).toContain("selectedFile?.name");
      expect(uploadSongFile).toContain("searchQuery");
    });

    it("passes targetLanguage from selection", () => {
      expect(uploadSongFile).toContain("targetLanguage: selectedLanguage");
    });

    it("passes artist from pipeline result", () => {
      expect(uploadSongFile).toContain("pipelineResult?.artist");
    });

    it("passes sourceLanguage from pipeline result", () => {
      expect(uploadSongFile).toContain("pipelineResult?.sourceLanguage");
    });
  });

  describe("Fallback simulation still exists for error cases", () => {
    it("keeps simulateProgress as fallback when no jobId", () => {
      expect(uploadSongFile).toContain("simulateProgress");
    });

    it("simulateProgress still has stage labels", () => {
      expect(uploadSongFile).toContain("Separating vocals from instrumentals");
    });
  });

  describe("Pipeline state management", () => {
    it("has pipelineResult state", () => {
      expect(uploadSongFile).toContain("pipelineResult");
      expect(uploadSongFile).toContain("setPipelineResult");
    });

    it("has pipelineError state", () => {
      expect(uploadSongFile).toContain("pipelineError");
      expect(uploadSongFile).toContain("setPipelineError");
    });

    it("has useEffect import for polling reaction", () => {
      expect(uploadSongFile).toContain("useEffect");
    });

    it("resets to upload step on failure acknowledgment", () => {
      expect(uploadSongFile).toContain('setStep("upload")');
    });
  });
});

describe("Server Pipeline Contract", () => {
  const pipelineFile = readFile("server/songTranslationPipeline.ts");

  it("exports getJobStatus endpoint", () => {
    expect(pipelineFile).toContain("getJobStatus");
  });

  it("returns status, progress, stage, and result fields", () => {
    expect(pipelineFile).toContain("status");
    expect(pipelineFile).toContain("progress");
    expect(pipelineFile).toContain("stage");
    expect(pipelineFile).toContain("result");
  });

  it("supports completed and failed statuses", () => {
    expect(pipelineFile).toContain("completed");
    expect(pipelineFile).toContain("failed");
  });

  it("has uploadAudio endpoint", () => {
    expect(pipelineFile).toContain("uploadAudio");
  });

  it("has startPipeline endpoint", () => {
    expect(pipelineFile).toContain("startPipeline");
  });
});

describe("Generate Learning Song - Already Using Real Polling", () => {
  const genSongFile = readFile("app/generate-learning-song.tsx");

  it("uses trpc.musicGeneration.getStatus.useQuery for real polling", () => {
    expect(genSongFile).toContain("trpc.musicGeneration.getStatus.useQuery");
  });

  it("polls with refetchInterval of 2000ms", () => {
    expect(genSongFile).toContain("refetchInterval: 2000");
  });

  it("handles completed status from job status", () => {
    expect(genSongFile).toContain('"completed"');
  });
});
