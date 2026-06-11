/**
 * Tests for Visual Association, Whiteboard Lesson, and CEFR Hour Tracker features
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Mock AsyncStorage ──────────────────────────────────────────────────────
const mockStorage: Record<string, string> = {};
vi.mock("@react-native-async-storage/async-storage", () => ({
  default: {
    getItem: vi.fn((key: string) => Promise.resolve(mockStorage[key] || null)),
    setItem: vi.fn((key: string, value: string) => {
      mockStorage[key] = value;
      return Promise.resolve();
    }),
    removeItem: vi.fn((key: string) => {
      delete mockStorage[key];
      return Promise.resolve();
    }),
    getAllKeys: vi.fn(() => Promise.resolve(Object.keys(mockStorage))),
  },
}));

// ─── CEFR Hour Tracker Tests ────────────────────────────────────────────────
describe("CEFR Hour Tracker", () => {
  beforeEach(() => {
    Object.keys(mockStorage).forEach((key) => delete mockStorage[key]);
    vi.resetModules();
  });

  it("should define correct CEFR hour requirements", async () => {
    const tracker = await import("../lib/cefr-hour-tracker");

    // getCEFRRequirements returns an array of level objects
    const reqs = tracker.getCEFRRequirements("Spanish");
    expect(reqs).toBeDefined();
    expect(reqs).toHaveLength(6);

    // Verify all levels present
    const levels = reqs.map((r) => r.level);
    expect(levels).toEqual(["A1", "A2", "B1", "B2", "C1", "C2"]);

    // Verify hours are progressive
    for (let i = 1; i < reqs.length; i++) {
      expect(reqs[i].cumulativeHours).toBeGreaterThan(reqs[i - 1].cumulativeHours);
    }
  });

  it("should apply language difficulty multipliers", async () => {
    const tracker = await import("../lib/cefr-hour-tracker");

    const spanishReqs = tracker.getCEFRRequirements("Spanish"); // 1.0x
    const japaneseReqs = tracker.getCEFRRequirements("Japanese"); // 2.2x

    // Japanese should require more hours than Spanish for same level
    expect(japaneseReqs[0].cumulativeHours).toBeGreaterThan(spanishReqs[0].cumulativeHours);
  });

  it("should log a learning session and persist to storage", async () => {
    const tracker = await import("../lib/cefr-hour-tracker");

    const session = await tracker.logLearningSession({
      language: "Spanish",
      activityType: "whiteboard",
      durationMinutes: 15,
      level: "A1",
    });

    expect(session).toBeDefined();
    expect(session.activityType).toBe("whiteboard");
    expect(session.durationMinutes).toBe(15);
    expect(session.id).toBeDefined();

    // Verify data was stored
    const progress = await tracker.getLanguageProgress("Spanish");
    expect(progress.totalHours).toBeCloseTo(0.25, 1); // 15 min = 0.25h
    expect(progress.totalSessions).toBe(1);
  });

  it("should accumulate multiple sessions", async () => {
    const tracker = await import("../lib/cefr-hour-tracker");

    await tracker.logLearningSession({
      language: "Spanish",
      activityType: "whiteboard",
      durationMinutes: 60,
      level: "A1",
    });

    await tracker.logLearningSession({
      language: "Spanish",
      activityType: "visual_association",
      durationMinutes: 60,
      level: "A1",
    });

    await tracker.logLearningSession({
      language: "Spanish",
      activityType: "adaptive",
      durationMinutes: 60,
      level: "A1",
    });

    const progress = await tracker.getLanguageProgress("Spanish");
    expect(progress.totalHours).toBeCloseTo(3, 1); // 180 min = 3h
    expect(progress.totalSessions).toBe(3);
  });

  it("should calculate progress toward certification level", async () => {
    const tracker = await import("../lib/cefr-hour-tracker");

    // Log 50 hours (3000 minutes) of learning
    await tracker.logLearningSession({
      language: "French",
      activityType: "adaptive",
      durationMinutes: 3000,
      level: "A1",
    });

    const cert = await tracker.getCertificationProgress("French");
    expect(cert).toBeDefined();
    expect(cert.hoursCompleted).toBe(50);
    expect(cert.currentLevel).toBeDefined();
    expect(cert.percentComplete).toBeGreaterThan(0);
    expect(cert.percentComplete).toBeLessThanOrEqual(100);
    expect(cert.hoursToNextLevel).toBeGreaterThan(0);
  });

  it("should track hours by activity type", async () => {
    const tracker = await import("../lib/cefr-hour-tracker");

    await tracker.logLearningSession({
      language: "Japanese",
      activityType: "whiteboard",
      durationMinutes: 30,
      level: "A1",
    });

    await tracker.logLearningSession({
      language: "Japanese",
      activityType: "conversation",
      durationMinutes: 45,
      level: "A1",
    });

    const progress = await tracker.getLanguageProgress("Japanese");
    expect(progress.hoursByActivity.whiteboard).toBeCloseTo(0.5, 1);
    expect(progress.hoursByActivity.conversation).toBeCloseTo(0.75, 1);
  });

  it("should keep separate tracking per language", async () => {
    const tracker = await import("../lib/cefr-hour-tracker");

    await tracker.logLearningSession({
      language: "Spanish",
      activityType: "grammar",
      durationMinutes: 60,
      level: "A1",
    });

    await tracker.logLearningSession({
      language: "French",
      activityType: "grammar",
      durationMinutes: 30,
      level: "A1",
    });

    const spanishProgress = await tracker.getLanguageProgress("Spanish");
    const frenchProgress = await tracker.getLanguageProgress("French");

    expect(spanishProgress.totalHours).toBeCloseTo(1, 1);
    expect(frenchProgress.totalHours).toBeCloseTo(0.5, 1);
  });

  it("should map exercise types to activity types", async () => {
    const tracker = await import("../lib/cefr-hour-tracker");

    expect(tracker.mapExerciseToActivity("whiteboard_teaching")).toBe("whiteboard");
    expect(tracker.mapExerciseToActivity("visual_association")).toBe("visual_association");
    expect(tracker.mapExerciseToActivity("conversation_chain")).toBe("conversation");
    expect(tracker.mapExerciseToActivity("unknown_type")).toBe("adaptive");
  });

  it("should provide activity display info", async () => {
    const tracker = await import("../lib/cefr-hour-tracker");

    const whiteboard = tracker.getActivityDisplayInfo("whiteboard");
    expect(whiteboard.label).toBe("Whiteboard");
    expect(whiteboard.icon).toBeDefined();
    expect(whiteboard.color).toBeDefined();

    const visual = tracker.getActivityDisplayInfo("visual_association");
    expect(visual.label).toBe("Visual Cards");
  });
});

// ─── Visual Association Exercise Types Tests ────────────────────────────────
describe("Visual Association Exercise", () => {
  it("should have correct file structure", async () => {
    const fs = await import("fs");
    const path = await import("path");

    const screenPath = path.resolve(__dirname, "../app/visual-association-exercise.tsx");
    expect(fs.existsSync(screenPath)).toBe(true);

    const content = fs.readFileSync(screenPath, "utf-8");

    // Verify key components are present
    expect(content).toContain("VisualAssociationExerciseScreen");
    expect(content).toContain("ConfettiAnimation");
    expect(content).toContain("generateVisualVocab");
    expect(content).toContain("spot_the_word");

    // Verify phases exist
    expect(content).toContain('"loading"');
    expect(content).toContain('"learn"');
    expect(content).toContain('"game"');
    expect(content).toContain('"results"');

    // Verify progress tracking
    expect(content).toContain("AsyncStorage");
  });
});

// ─── Whiteboard Exercise Component Tests ────────────────────────────────────
describe("Whiteboard Exercise Component", () => {
  it("should have correct file structure", async () => {
    const fs = await import("fs");
    const path = await import("path");

    const componentPath = path.resolve(__dirname, "../components/whiteboard-exercise.tsx");
    expect(fs.existsSync(componentPath)).toBe(true);

    const content = fs.readFileSync(componentPath, "utf-8");

    // Verify key exports
    expect(content).toContain("WhiteboardExercise");

    // Verify dual input mode
    expect(content).toContain("write");
    expect(content).toContain("tap");

    // Verify grading system
    expect(content).toContain("correctAnswers");
    expect(content).toContain("accuracy");
  });

  it("should have whiteboard lesson screen", async () => {
    const fs = await import("fs");
    const path = await import("path");

    const screenPath = path.resolve(__dirname, "../app/whiteboard-lesson.tsx");
    expect(fs.existsSync(screenPath)).toBe(true);

    const content = fs.readFileSync(screenPath, "utf-8");

    // Verify tRPC integration
    expect(content).toContain("generateWhiteboardLesson");
    expect(content).toContain("WhiteboardExercise");

    // Verify results screen
    expect(content).toContain("xpEarned");
    expect(content).toContain("ConfettiAnimation");
  });
});

// ─── Certification Progress Screen Tests ────────────────────────────────────
describe("Certification Progress Screen", () => {
  it("should have correct file structure", async () => {
    const fs = await import("fs");
    const path = await import("path");

    const screenPath = path.resolve(__dirname, "../app/certification-progress.tsx");
    expect(fs.existsSync(screenPath)).toBe(true);

    const content = fs.readFileSync(screenPath, "utf-8");

    // Verify CEFR levels are displayed
    expect(content).toContain("A1");
    expect(content).toContain("A2");
    expect(content).toContain("B1");
    expect(content).toContain("B2");
    expect(content).toContain("C1");
    expect(content).toContain("C2");

    // Verify hour tracking integration
    expect(content).toContain("cefr-hour-tracker");

    // Verify activity breakdown via hoursByActivity
    expect(content).toContain("hoursByActivity");
  });
});

// ─── Screen Registration Tests ──────────────────────────────────────────────
describe("Screen Registration", () => {
  it("should have all new screens registered in _layout.tsx", async () => {
    const fs = await import("fs");
    const path = await import("path");

    const layoutPath = path.resolve(__dirname, "../app/_layout.tsx");
    const content = fs.readFileSync(layoutPath, "utf-8");

    // Verify all new screens are registered
    expect(content).toContain("visual-association-exercise");
    expect(content).toContain("whiteboard-lesson");
    expect(content).toContain("certification-progress");
  });

  it("should have Visual Mode and Whiteboard Mode buttons in lesson-path", async () => {
    const fs = await import("fs");
    const path = await import("path");

    const lessonPathFile = path.resolve(__dirname, "../app/lesson-path.tsx");
    const content = fs.readFileSync(lessonPathFile, "utf-8");

    // Verify Visual Mode button
    expect(content).toContain("visual-association-exercise");

    // Verify Whiteboard Mode button
    expect(content).toContain("whiteboard-lesson");

    // Verify certification progress entry point
    expect(content).toContain("certification-progress");
  });
});

// ─── Omar Creator Enrichment Tests ──────────────────────────────────────────
describe("Omar Creator Profile Enrichment", () => {
  it("should have enriched Omar seed data with teaching methods", async () => {
    const fs = await import("fs");
    const path = await import("path");

    const schemaPath = path.resolve(__dirname, "../lib/airtable-schema.ts");
    const content = fs.readFileSync(schemaPath, "utf-8");

    // Verify Omar's enriched data
    expect(content).toContain("inglesconomar");
    expect(content).toContain("whiteboard");
    expect(content).toContain("phonetic");

    // Verify social links
    expect(content).toContain("tiktok.com/@inglesconomar");

    // Verify teaching patterns
    expect(content).toContain("teachingPatterns");
  });

  it("should have whiteboard teaching in creatorContentEngine", async () => {
    const fs = await import("fs");
    const path = await import("path");

    const enginePath = path.resolve(__dirname, "../server/creatorContentEngine.ts");
    const content = fs.readFileSync(enginePath, "utf-8");

    // Verify whiteboard_teaching in LEVEL_PLACEMENT_MATRIX
    expect(content).toContain("whiteboard_teaching");

    // Verify whiteboard in resolveCreatorTemplate
    expect(content).toContain("whiteboard");

    // Verify generateWhiteboardLesson endpoint
    expect(content).toContain("generateWhiteboardLesson");

    // Verify generateVisualVocab endpoint
    expect(content).toContain("generateVisualVocab");
  });
});
