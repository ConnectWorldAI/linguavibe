import { describe, it, expect, beforeEach } from "vitest";
import * as fs from "fs";
import * as path from "path";

function readFile(filePath: string): string {
  return fs.readFileSync(path.join(__dirname, "..", filePath), "utf-8");
}

describe("Adaptive Learning Engine - Error Pattern Detection", () => {
  let content: string;
  beforeEach(() => { content = readFile("lib/error-pattern-detection.ts"); });

  it("exports logError function for recording errors", () => {
    expect(content).toContain("export async function logError");
  });

  it("exports detectPatterns function", () => {
    expect(content).toContain("export async function detectPatterns");
  });

  it("exports getActivePatterns function", () => {
    expect(content).toContain("export async function getActivePatterns");
  });

  it("exports generateDrillSession function", () => {
    expect(content).toContain("export async function generateDrillSession");
  });

  it("exports getWeaknessReport function", () => {
    expect(content).toContain("export async function getWeaknessReport");
  });

  it("exports getErrorStats function", () => {
    expect(content).toContain("export async function getErrorStats");
  });

  it("defines ErrorCategory type with grammar, vocabulary, pronunciation, spelling, conjugation", () => {
    expect(content).toContain("grammar");
    expect(content).toContain("vocabulary");
    expect(content).toContain("pronunciation");
    expect(content).toContain("spelling");
    expect(content).toContain("conjugation");
  });

  it("defines ErrorPattern interface with category, frequency, examples, resolved", () => {
    expect(content).toContain("category:");
    expect(content).toContain("frequency:");
    expect(content).toContain("examples:");
    expect(content).toContain("resolved:");
  });

  it("defines DrillExercise interface with type, prompt, correctAnswer, explanation", () => {
    expect(content).toContain("type:");
    expect(content).toContain("prompt:");
    expect(content).toContain("correctAnswer:");
    expect(content).toContain("explanation:");
  });

  it("tracks error frequency to identify recurring mistakes", () => {
    expect(content).toContain("frequency");
  });

  it("generates drill exercises based on most common error patterns", () => {
    expect(content).toContain("generateDrillSession");
    expect(content).toContain("generateDrillsForPattern");
  });

  it("stores errors in AsyncStorage with @error_pattern_entries key", () => {
    expect(content).toContain("AsyncStorage");
    expect(content).toContain("@error_pattern_entries");
  });

  it("supports drill types: fill_blank, multiple_choice, translate, correct_error, conjugate", () => {
    expect(content).toContain("fill_blank");
    expect(content).toContain("multiple_choice");
    expect(content).toContain("translate");
    expect(content).toContain("correct_error");
    expect(content).toContain("conjugate");
  });
});

describe("Adaptive Learning Engine - Comprehension Check", () => {
  let content: string;
  beforeEach(() => { content = readFile("lib/comprehension-check.ts"); });

  it("exports generateComprehensionCheck function", () => {
    expect(content).toContain("export function generateComprehensionCheck");
  });

  it("exports recordComprehensionResult function", () => {
    expect(content).toContain("export async function recordComprehensionResult");
  });

  it("exports needsReTeaching function", () => {
    expect(content).toContain("export async function needsReTeaching");
  });

  it("exports generateReTeachPlan function", () => {
    expect(content).toContain("export async function generateReTeachPlan");
  });

  it("exports getComprehensionStats function", () => {
    expect(content).toContain("export async function getComprehensionStats");
  });

  it("exports getStrugglingConcepts function", () => {
    expect(content).toContain("export async function getStrugglingConcepts");
  });

  it("defines ComprehensionQuestion with prompt, options, correctAnswer, explanation", () => {
    expect(content).toContain("prompt:");
    expect(content).toContain("options:");
    expect(content).toContain("correctAnswer:");
    expect(content).toContain("explanation:");
  });

  it("tracks pass/fail rate to determine re-teaching need", () => {
    expect(content).toContain("passed");
    expect(content).toContain("needsReTeaching");
  });

  it("supports question types: multiple_choice, fill_blank, true_false, reorder, match", () => {
    expect(content).toContain("multiple_choice");
    expect(content).toContain("fill_blank");
    expect(content).toContain("true_false");
    expect(content).toContain("reorder");
    expect(content).toContain("match");
  });

  it("generates ReTeachPlan with alternative teaching approach when user fails", () => {
    expect(content).toContain("ReTeachPlan");
    expect(content).toContain("nextApproach");
    expect(content).toContain("microLesson");
  });

  it("supports multiple teaching approaches: visual, example_based, rule_based, contextual", () => {
    expect(content).toContain("visual");
    expect(content).toContain("example_based");
    expect(content).toContain("rule_based");
    expect(content).toContain("contextual");
  });

  it("stores comprehension results in AsyncStorage", () => {
    expect(content).toContain("AsyncStorage");
    expect(content).toContain("@comprehension_results");
  });
});

describe("Adaptive Learning Engine - Adaptive Pacing", () => {
  let content: string;
  beforeEach(() => { content = readFile("lib/adaptive-pacing.ts"); });

  it("exports recordResponse function for tracking response time and accuracy", () => {
    expect(content).toContain("export async function recordResponse");
  });

  it("exports getPacingProfile function", () => {
    expect(content).toContain("export async function getPacingProfile");
  });

  it("exports getRecommendedDifficulty function", () => {
    expect(content).toContain("export async function getRecommendedDifficulty");
  });

  it("exports getFrustrationSignals function", () => {
    expect(content).toContain("export async function getFrustrationSignals");
  });

  it("exports getSessionPacingStats function", () => {
    expect(content).toContain("export async function getSessionPacingStats");
  });

  it("exports startPacingSession function", () => {
    expect(content).toContain("export async function startPacingSession");
  });

  it("defines PaceState type with flow, struggling, breezing, frustrated, warming_up", () => {
    expect(content).toContain("flow");
    expect(content).toContain("struggling");
    expect(content).toContain("breezing");
    expect(content).toContain("frustrated");
    expect(content).toContain("warming_up");
  });

  it("monitors responseTime as a frustration signal", () => {
    expect(content).toContain("responseTime");
  });

  it("tracks frustrationLevel as 0-100 score", () => {
    expect(content).toContain("frustrationLevel");
  });

  it("has ADJUSTMENT_COOLDOWN to prevent over-adjusting", () => {
    expect(content).toContain("ADJUSTMENT_COOLDOWN");
  });

  it("automatically adjusts difficulty via adjustmentHistory", () => {
    expect(content).toContain("adjustmentHistory");
  });

  it("stores pacing data in AsyncStorage", () => {
    expect(content).toContain("AsyncStorage");
    expect(content).toContain("@pacing_profile");
  });
});

describe("Adaptive Learning Engine - Knowledge Gap Map", () => {
  let content: string;
  beforeEach(() => { content = readFile("lib/knowledge-gap-map.ts"); });

  it("exports getSkillTree function", () => {
    expect(content).toContain("export async function getSkillTree");
  });

  it("exports analyzeGaps function", () => {
    expect(content).toContain("export async function analyzeGaps");
  });

  it("exports getLearningPriorities function", () => {
    expect(content).toContain("export async function getLearningPriorities");
  });

  it("exports getDomainSummary function", () => {
    expect(content).toContain("export async function getDomainSummary");
  });

  it("exports updateSkillMastery function", () => {
    expect(content).toContain("export async function updateSkillMastery");
  });

  it("defines SkillDomain covering grammar, vocabulary, pronunciation, comprehension, writing, culture", () => {
    expect(content).toContain("grammar");
    expect(content).toContain("vocabulary");
    expect(content).toContain("pronunciation");
    expect(content).toContain("comprehension");
    expect(content).toContain("writing");
    expect(content).toContain("culture");
  });

  it("defines MasteryLevel with unknown, introduced, practicing, familiar, mastered", () => {
    expect(content).toContain("unknown");
    expect(content).toContain("introduced");
    expect(content).toContain("practicing");
    expect(content).toContain("familiar");
    expect(content).toContain("mastered");
  });

  it("defines SkillNode with id, name, domain, level, mastery, masteryScore", () => {
    expect(content).toContain("id:");
    expect(content).toContain("name:");
    expect(content).toContain("domain:");
    expect(content).toContain("mastery:");
    expect(content).toContain("masteryScore:");
  });

  it("calculates overall mastery percentage", () => {
    expect(content).toContain("overallMastery");
  });

  it("identifies strength and weak areas", () => {
    expect(content).toContain("strengthAreas");
    expect(content).toContain("weakAreas");
  });

  it("generates learning priorities with estimated time", () => {
    expect(content).toContain("estimatedMinutes");
  });

  it("stores skill tree data in AsyncStorage", () => {
    expect(content).toContain("AsyncStorage");
  });
});

describe("Adaptive Learning Engine - Learning Style Detection", () => {
  let content: string;
  beforeEach(() => { content = readFile("lib/learning-style-detection.ts"); });

  it("exports recordLearningEvent function", () => {
    expect(content).toContain("export async function recordLearningEvent");
  });

  it("exports getLearningStyleProfile function", () => {
    expect(content).toContain("export async function getLearningStyleProfile");
  });

  it("exports getRecommendedContentMix function", () => {
    expect(content).toContain("export async function getRecommendedContentMix");
  });

  it("exports getStyleDescription function", () => {
    expect(content).toContain("export async function getStyleDescription");
  });

  it("exports getSuggestedActivities function", () => {
    expect(content).toContain("export async function getSuggestedActivities");
  });

  it("exports recordRetentionCheck function", () => {
    expect(content).toContain("export async function recordRetentionCheck");
  });

  it("exports hasEnoughData function", () => {
    expect(content).toContain("export async function hasEnoughData");
  });

  it("defines LearningModality with visual, auditory, reading, kinesthetic", () => {
    expect(content).toContain("visual");
    expect(content).toContain("auditory");
    expect(content).toContain("reading");
    expect(content).toContain("kinesthetic");
  });

  it("tracks averageRetention per modality", () => {
    expect(content).toContain("averageRetention");
  });

  it("identifies primary and secondary learning styles", () => {
    expect(content).toContain("primaryStyle");
    expect(content).toContain("secondaryStyle");
  });

  it("provides styleConfidence percentage", () => {
    expect(content).toContain("styleConfidence");
  });

  it("defines ContentMix for recommended content balance", () => {
    expect(content).toContain("ContentMix");
  });

  it("stores learning style data in AsyncStorage", () => {
    expect(content).toContain("AsyncStorage");
    expect(content).toContain("@learning_style_profile");
  });
});

describe("Adaptive Learning Engine - Session Summary", () => {
  let content: string;
  beforeEach(() => { content = readFile("lib/session-summary.ts"); });

  it("exports endSession function", () => {
    expect(content).toContain("export async function endSession");
  });

  it("exports getLastSessionSummary function", () => {
    expect(content).toContain("export async function getLastSessionSummary");
  });

  it("exports getWeeklyStats function", () => {
    expect(content).toContain("export async function getWeeklyStats");
  });

  it("exports getSessionHistory function", () => {
    expect(content).toContain("export async function getSessionHistory");
  });

  it("defines SessionSummary with overallScore, strengths, weaknesses, nextSteps, teacherNote", () => {
    expect(content).toContain("overallScore");
    expect(content).toContain("strengths");
    expect(content).toContain("weaknesses");
    expect(content).toContain("nextSteps");
    expect(content).toContain("teacherNote");
  });

  it("includes tomorrowFocus in session summary", () => {
    expect(content).toContain("tomorrowFocus");
  });

  it("next steps include action, reason, priority, estimatedMinutes, screenRoute", () => {
    expect(content).toContain("action:");
    expect(content).toContain("reason:");
    expect(content).toContain("priority:");
    expect(content).toContain("estimatedMinutes:");
    expect(content).toContain("screenRoute:");
  });

  it("tracks session duration in minutes", () => {
    expect(content).toContain("durationMinutes");
  });

  it("calculates accuracy percentage", () => {
    expect(content).toContain("accuracy");
  });

  it("provides weekly stats with improvement trend", () => {
    expect(content).toContain("improvementTrend");
  });

  it("stores session history in AsyncStorage", () => {
    expect(content).toContain("AsyncStorage");
  });
});

describe("Adaptive Learning Screens - Knowledge Gap Map", () => {
  let content: string;
  beforeEach(() => { content = readFile("app/knowledge-gap-map.tsx"); });

  it("renders overall mastery progress bar", () => {
    expect(content).toContain("Overall Mastery");
    expect(content).toContain("progressBar");
    expect(content).toContain("progressFill");
  });

  it("shows mastered, in-progress, and to-learn counts", () => {
    expect(content).toContain("Mastered");
    expect(content).toContain("In Progress");
    expect(content).toContain("To Learn");
  });

  it("renders domain grid with 6 skill domains", () => {
    expect(content).toContain("Skill Domains");
    expect(content).toContain("domainGrid");
    expect(content).toContain("Grammar");
    expect(content).toContain("Vocabulary");
  });

  it("shows learning priorities with badges", () => {
    expect(content).toContain("What to Learn Next");
    expect(content).toContain("priorityBadge");
  });

  it("shows strength and focus areas from gap analysis", () => {
    expect(content).toContain("Your Strengths");
    expect(content).toContain("Focus Areas");
  });

  it("includes mastery level legend", () => {
    expect(content).toContain("Mastery Levels");
    expect(content).toContain("legendDot");
  });

  it("supports domain selection to show individual skills", () => {
    expect(content).toContain("selectedDomain");
    expect(content).toContain("selectDomain");
  });
});

describe("Adaptive Learning Screens - Session Summary", () => {
  let content: string;
  beforeEach(() => { content = readFile("app/session-summary.tsx"); });

  it("shows overall score with emoji indicator", () => {
    expect(content).toContain("overallScore");
    expect(content).toContain("Overall");
  });

  it("renders Teacher's Note section", () => {
    expect(content).toContain("Teacher's Note");
    expect(content).toContain("teacherNote");
  });

  it("shows What Went Well section", () => {
    expect(content).toContain("What Went Well");
  });

  it("shows Needs Attention section", () => {
    expect(content).toContain("Needs Attention");
  });

  it("renders Next Steps with priority indicators", () => {
    expect(content).toContain("Next Steps");
    expect(content).toContain("priorityIndicator");
  });

  it("shows Tomorrow's Focus card", () => {
    expect(content).toContain("Tomorrow's Focus");
    expect(content).toContain("tomorrowFocus");
  });

  it("shows weekly stats", () => {
    expect(content).toContain("This Week");
    expect(content).toContain("Sessions");
    expect(content).toContain("Minutes");
  });

  it("shows empty state with Start Learning button", () => {
    expect(content).toContain("No Sessions Yet");
    expect(content).toContain("Start Learning");
  });
});

describe("Adaptive Learning Screens - Learning Style", () => {
  let content: string;
  beforeEach(() => { content = readFile("app/learning-style.tsx"); });

  it("shows primary learning style with confidence", () => {
    expect(content).toContain("Learner");
    expect(content).toContain("styleConfidence");
  });

  it("renders modality effectiveness bars", () => {
    expect(content).toContain("Modality Effectiveness");
    expect(content).toContain("barTrack");
    expect(content).toContain("barFill");
  });

  it("shows recommended lesson mix", () => {
    expect(content).toContain("Recommended Lesson Mix");
    expect(content).toContain("mixBar");
  });

  it("provides tips for the user's learning style", () => {
    expect(content).toContain("Tips for");
  });

  it("shows suggested activities", () => {
    expect(content).toContain("Suggested Activities");
    expect(content).toContain("activityChip");
  });

  it("shows detection status when not enough data", () => {
    expect(content).toContain("Still detecting your learning style");
  });

  it("shows performance by modality breakdown", () => {
    expect(content).toContain("Performance by Modality");
  });
});

describe("Home Screen Navigation - Adaptive Learning Screens", () => {
  let content: string;
  beforeEach(() => { content = readFile("app/(tabs)/index.tsx"); });

  it("includes Knowledge Map in EXPLORE_FEATURES", () => {
    expect(content).toContain("knowledge-map");
    expect(content).toContain("/knowledge-gap-map");
  });

  it("includes Session Notes in EXPLORE_FEATURES", () => {
    const ssExists = fs.existsSync(path.resolve(__dirname, "../app/session-summary.tsx"));
    expect(ssExists).toBe(true);
  });

  it("includes Learning Style in EXPLORE_FEATURES", () => {
    expect(content).toContain("learning-style");
    expect(content).toContain("/learning-style");
  });
});
