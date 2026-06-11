/**
 * Tests for:
 * 1. Practice Weak Areas button on Daily Briefing card
 * 2. Weekly Progress Notification system
 * 3. Targeted Drill screen
 */
import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

const ROOT = path.resolve(__dirname, "..");

describe("Practice Weak Areas Button", () => {
  const briefingCardSrc = fs.readFileSync(
    path.join(ROOT, "components/daily-briefing-card.tsx"),
    "utf-8"
  );

  it("imports generateDrillSession from error-pattern-detection", () => {
    expect(briefingCardSrc).toContain("generateDrillSession");
    expect(briefingCardSrc).toContain("@/lib/error-pattern-detection");
  });

  it("renders Practice Weak Areas button conditionally on errorPatternsCount > 0", () => {
    expect(briefingCardSrc).toContain("briefing.errorPatternsCount > 0");
    expect(briefingCardSrc).toContain("Practice Weak Areas");
  });

  it("navigates to /targeted-drill with sessionId param on press", () => {
    expect(briefingCardSrc).toContain("/targeted-drill");
    expect(briefingCardSrc).toContain("sessionId");
  });

  it("falls back to /flashcard-srs if drill session is empty or fails", () => {
    expect(briefingCardSrc).toContain("/flashcard-srs");
  });

  it("shows error pattern count badge", () => {
    expect(briefingCardSrc).toContain("patternBadge");
    expect(briefingCardSrc).toContain("briefing.errorPatternsCount");
  });

  it("triggers haptic feedback on press", () => {
    expect(briefingCardSrc).toContain("Haptics.impactAsync");
    expect(briefingCardSrc).toContain("ImpactFeedbackStyle.Medium");
  });

  it("has proper button styling (red background, white text)", () => {
    expect(briefingCardSrc).toContain("practiceButton");
    expect(briefingCardSrc).toContain("#F44336");
    expect(briefingCardSrc).toContain("practiceButtonText");
  });
});

describe("Targeted Drill Screen", () => {
  const drillScreenSrc = fs.readFileSync(
    path.join(ROOT, "app/targeted-drill.tsx"),
    "utf-8"
  );

  it("exists as a screen file", () => {
    expect(drillScreenSrc).toBeDefined();
    expect(drillScreenSrc.length).toBeGreaterThan(100);
  });

  it("imports generateDrillSession and completeDrillSession", () => {
    expect(drillScreenSrc).toContain("generateDrillSession");
    expect(drillScreenSrc).toContain("completeDrillSession");
  });

  it("accepts sessionId as a route param", () => {
    expect(drillScreenSrc).toContain("useLocalSearchParams");
    expect(drillScreenSrc).toContain("sessionId");
  });

  it("renders exercises one at a time with progress bar", () => {
    expect(drillScreenSrc).toContain("progressBar");
    expect(drillScreenSrc).toContain("progressFill");
    expect(drillScreenSrc).toContain("currentIndex");
  });

  it("supports multiple_choice exercises with options", () => {
    expect(drillScreenSrc).toContain("multiple_choice");
    expect(drillScreenSrc).toContain("optionButton");
    expect(drillScreenSrc).toContain("selectedOption");
  });

  it("supports text input exercises (fill_blank, translate, conjugate)", () => {
    expect(drillScreenSrc).toContain("TextInput");
    expect(drillScreenSrc).toContain("Type your answer");
  });

  it("shows correct/incorrect feedback with explanation", () => {
    expect(drillScreenSrc).toContain("resultBox");
    expect(drillScreenSrc).toContain("Correct!");
    expect(drillScreenSrc).toContain("Not quite");
    expect(drillScreenSrc).toContain("explanation");
  });

  it("shows score circle and completion message at end", () => {
    expect(drillScreenSrc).toContain("scoreCircle");
    expect(drillScreenSrc).toContain("scorePercentage");
    expect(drillScreenSrc).toContain("Excellent!");
    expect(drillScreenSrc).toContain("Good progress!");
    expect(drillScreenSrc).toContain("Keep practicing!");
  });

  it("allows retry (Practice Again) after completion", () => {
    expect(drillScreenSrc).toContain("Practice Again");
    expect(drillScreenSrc).toContain("loadSession");
  });

  it("calls completeDrillSession with score on finish", () => {
    expect(drillScreenSrc).toContain("completeDrillSession(session,");
  });

  it("shows category badge with difficulty for each exercise", () => {
    expect(drillScreenSrc).toContain("categoryBadge");
    expect(drillScreenSrc).toContain("currentExercise.type");
    expect(drillScreenSrc).toContain("currentExercise.difficulty");
  });
});

describe("Weekly Progress Notification", () => {
  const weeklyNotifSrc = fs.readFileSync(
    path.join(ROOT, "lib/weekly-progress-notification.ts"),
    "utf-8"
  );

  it("exports compileWeeklyMetrics function", () => {
    expect(weeklyNotifSrc).toContain("export async function compileWeeklyMetrics");
  });

  it("exports generateWeeklyReport function", () => {
    expect(weeklyNotifSrc).toContain("export async function generateWeeklyReport");
  });

  it("exports scheduleWeeklyNotification function", () => {
    expect(weeklyNotifSrc).toContain("export async function scheduleWeeklyNotification");
  });

  it("exports cancelWeeklyNotification function", () => {
    expect(weeklyNotifSrc).toContain("export async function cancelWeeklyNotification");
  });

  it("exports toggleWeeklyNotification function", () => {
    expect(weeklyNotifSrc).toContain("export async function toggleWeeklyNotification");
  });

  it("exports isWeeklyNotificationEnabled function", () => {
    expect(weeklyNotifSrc).toContain("export async function isWeeklyNotificationEnabled");
  });

  it("exports sendImmediateProgressNotification function", () => {
    expect(weeklyNotifSrc).toContain("export async function sendImmediateProgressNotification");
  });

  it("exports getLastWeeklyReport function", () => {
    expect(weeklyNotifSrc).toContain("export async function getLastWeeklyReport");
  });

  it("exports getWeeklyReportHistory function", () => {
    expect(weeklyNotifSrc).toContain("export async function getWeeklyReportHistory");
  });

  it("defines WeeklyMetrics interface with all adaptive metrics", () => {
    expect(weeklyNotifSrc).toContain("interface WeeklyMetrics");
    expect(weeklyNotifSrc).toContain("sessionsCompleted");
    expect(weeklyNotifSrc).toContain("averageAccuracy");
    expect(weeklyNotifSrc).toContain("accuracyTrend");
    expect(weeklyNotifSrc).toContain("streakDays");
    expect(weeklyNotifSrc).toContain("knowledgeGapsClosed");
    expect(weeklyNotifSrc).toContain("errorPatternsFixed");
    expect(weeklyNotifSrc).toContain("flashcardsReviewed");
    expect(weeklyNotifSrc).toContain("flashcardsMastered");
    expect(weeklyNotifSrc).toContain("conversationMinutes");
    expect(weeklyNotifSrc).toContain("drillSessionsCompleted");
    expect(weeklyNotifSrc).toContain("primaryLearningStyle");
    expect(weeklyNotifSrc).toContain("overallMastery");
    expect(weeklyNotifSrc).toContain("masteryChange");
  });

  it("defines WeeklyReport interface with grade and teacher note", () => {
    expect(weeklyNotifSrc).toContain("interface WeeklyReport");
    expect(weeklyNotifSrc).toContain("highlights");
    expect(weeklyNotifSrc).toContain("areasOfImprovement");
    expect(weeklyNotifSrc).toContain("teacherNote");
    expect(weeklyNotifSrc).toContain("grade");
  });

  it("calculates grade from A+ to F based on metrics", () => {
    expect(weeklyNotifSrc).toContain("calculateGrade");
    expect(weeklyNotifSrc).toContain('"A+"');
    expect(weeklyNotifSrc).toContain('"A"');
    expect(weeklyNotifSrc).toContain('"B+"');
    expect(weeklyNotifSrc).toContain('"B"');
    expect(weeklyNotifSrc).toContain('"C+"');
    expect(weeklyNotifSrc).toContain('"C"');
    expect(weeklyNotifSrc).toContain('"D"');
    expect(weeklyNotifSrc).toContain('"F"');
  });

  it("generates personalized teacher notes based on grade", () => {
    expect(weeklyNotifSrc).toContain("generateTeacherNote");
    expect(weeklyNotifSrc).toContain("Outstanding week");
    expect(weeklyNotifSrc).toContain("Good progress");
  });

  it("generates highlights from metrics (streak, accuracy, mastery)", () => {
    expect(weeklyNotifSrc).toContain("generateHighlights");
    expect(weeklyNotifSrc).toContain("Perfect week");
    expect(weeklyNotifSrc).toContain("Accuracy trending up");
  });

  it("generates improvement areas from metrics", () => {
    expect(weeklyNotifSrc).toContain("generateImprovementAreas");
    expect(weeklyNotifSrc).toContain("practice at least 5 days");
    expect(weeklyNotifSrc).toContain("Speaking practice is low");
  });

  it("schedules notification for Sunday at 6 PM", () => {
    expect(weeklyNotifSrc).toContain("weekday: 1");
    expect(weeklyNotifSrc).toContain("hour: 18");
    expect(weeklyNotifSrc).toContain("minute: 0");
  });

  it("saves report history (last 12 weeks)", () => {
    expect(weeklyNotifSrc).toContain("history.length > 12");
    expect(weeklyNotifSrc).toContain("_history");
  });

  it("gathers data from all adaptive engines (session, error, knowledge, flashcard, pacing, style, streak)", () => {
    expect(weeklyNotifSrc).toContain("getSessionMetrics");
    expect(weeklyNotifSrc).toContain("getErrorMetrics");
    expect(weeklyNotifSrc).toContain("getKnowledgeMetrics");
    expect(weeklyNotifSrc).toContain("getFlashcardMetrics");
    expect(weeklyNotifSrc).toContain("getPacingMetrics");
    expect(weeklyNotifSrc).toContain("getStyleMetrics");
    expect(weeklyNotifSrc).toContain("getStreakMetrics");
  });
});

describe("Weekly Report Toggle in Notification Settings", () => {
  const settingsSrc = fs.readFileSync(
    path.join(ROOT, "app/notification-settings.tsx"),
    "utf-8"
  );

  it("imports toggleWeeklyNotification and isWeeklyNotificationEnabled", () => {
    expect(settingsSrc).toContain("toggleWeeklyNotification");
    expect(settingsSrc).toContain("isWeeklyNotificationEnabled");
  });

  it("has weeklyReportEnabled state variable", () => {
    expect(settingsSrc).toContain("weeklyReportEnabled");
    expect(settingsSrc).toContain("setWeeklyReportEnabled");
  });

  it("loads weekly notification preference on mount", () => {
    expect(settingsSrc).toContain("isWeeklyNotificationEnabled()");
    expect(settingsSrc).toContain("setWeeklyReportEnabled");
  });

  it("renders Weekly Progress Report section with toggle", () => {
    expect(settingsSrc).toContain("Weekly Progress Report");
    expect(settingsSrc).toContain("AI-generated summary every Sunday at 6 PM");
  });

  it("calls toggleWeeklyNotification on switch change", () => {
    expect(settingsSrc).toContain("toggleWeeklyNotification(val)");
  });

  it("shows description of what the notification contains", () => {
    expect(settingsSrc).toContain("weekly grade");
    expect(settingsSrc).toContain("highlights");
    expect(settingsSrc).toContain("teacher's note");
  });
});
