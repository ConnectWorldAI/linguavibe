/**
 * Tests for Sprint: Pronunciation Categorization, Compare Weeks, Weekly Goals
 */
import { describe, it, expect, beforeAll } from "vitest";
import * as fs from "fs";
import * as path from "path";

// ─── File Existence Tests ───────────────────────────────────────────────────

describe("File Structure", () => {
  it("pronunciation-error-categorization module exists", () => {
    expect(fs.existsSync(path.join(__dirname, "../lib/pronunciation-error-categorization.ts"))).toBe(true);
  });

  it("compare-weeks screen exists", () => {
    expect(fs.existsSync(path.join(__dirname, "../app/compare-weeks.tsx"))).toBe(true);
  });

  it("weekly-goals screen exists", () => {
    expect(fs.existsSync(path.join(__dirname, "../app/weekly-goals.tsx"))).toBe(true);
  });
});

// ─── Pronunciation Error Categorization Tests ───────────────────────────────

describe("Pronunciation Error Categorization Module", () => {
  const modulePath = path.join(__dirname, "../lib/pronunciation-error-categorization.ts");
  let content: string;

  beforeAll(() => {
    content = fs.readFileSync(modulePath, "utf-8");
  });

  it("exports PronunciationCategory type with all expected categories", () => {
    expect(content).toContain("vowel_sounds");
    expect(content).toContain("consonant_clusters");
    expect(content).toContain("accent_placement");
    expect(content).toContain("intonation");
    expect(content).toContain("liaison_elision");
    expect(content).toContain("nasal_sounds");
    expect(content).toContain("trill_tap");
    expect(content).toContain("aspiration");
    expect(content).toContain("tone");
    expect(content).toContain("rhythm_timing");
  });

  it("exports PRONUNCIATION_CATEGORIES array with category info", () => {
    expect(content).toContain("export const PRONUNCIATION_CATEGORIES");
    expect(content).toContain("label:");
    expect(content).toContain("description:");
    expect(content).toContain("icon:");
    expect(content).toContain("color:");
    expect(content).toContain("examples:");
    expect(content).toContain("languages:");
  });

  it("exports classifyPronunciationError function", () => {
    expect(content).toContain("export function classifyPronunciationError");
  });

  it("classifyPronunciationError accepts word, language, score, errorDescription", () => {
    expect(content).toContain("word: string");
    expect(content).toContain("language: string");
    expect(content).toContain("score: number");
    expect(content).toContain("errorDescription?: string");
  });

  it("returns category and subcategory from classification", () => {
    expect(content).toContain("{ category: PronunciationCategory; subcategory: string }");
  });

  it("exports logPronunciationError function", () => {
    expect(content).toContain("export async function logPronunciationError");
  });

  it("exports detectPronunciationPatterns function", () => {
    expect(content).toContain("export async function detectPronunciationPatterns");
  });

  it("exports getPronunciationStats function", () => {
    expect(content).toContain("export async function getPronunciationStats");
  });

  it("exports generatePronunciationDrills function", () => {
    expect(content).toContain("export async function generatePronunciationDrills");
  });

  it("has Spanish-specific heuristics (rr trill, accent marks)", () => {
    expect(content).toContain("alveolar_trill");
    expect(content).toContain("written_accent");
    expect(content).toContain("syllable_timing");
  });

  it("has French-specific heuristics (nasal sounds, uvular R)", () => {
    expect(content).toContain("nasal_vowel");
    expect(content).toContain("uvular_r");
    expect(content).toContain("word_linking");
  });

  it("has drill type mapping per category", () => {
    expect(content).toContain("minimal_pairs");
    expect(content).toContain("tongue_twisters");
    expect(content).toContain("repeat_after");
    expect(content).toContain("stress_marking");
    expect(content).toContain("intonation_contour");
  });

  it("PronunciationDrill interface has items with targetWord and audioHint", () => {
    expect(content).toContain("targetWord: string");
    expect(content).toContain("audioHint?: string");
    expect(content).toContain("contrastWord?: string");
  });

  it("stores errors in AsyncStorage with key @pronunciation_errors", () => {
    expect(content).toContain("@pronunciation_errors");
  });

  it("triggers pattern detection every 3 errors", () => {
    expect(content).toContain("trimmed.length % 3 === 0");
  });
});

// ─── Adaptive Engine Hooks Integration ──────────────────────────────────────

describe("Adaptive Engine Hooks - Pronunciation Categorization Integration", () => {
  const hooksPath = path.join(__dirname, "../lib/adaptive-engine-hooks.ts");
  let content: string;

  beforeAll(() => {
    content = fs.readFileSync(hooksPath, "utf-8");
  });

  it("imports logPronunciationError from pronunciation-error-categorization", () => {
    expect(content).toContain('import { logPronunciationError } from "./pronunciation-error-categorization"');
  });

  it("calls logPronunciationError when pronunciationScore < 70", () => {
    expect(content).toContain("await logPronunciationError({");
  });

  it("passes word, userAttempt, expected, language, score, context, source", () => {
    // Check that the logPronunciationError call includes the key fields
    const callIndex = content.indexOf("await logPronunciationError({");
    const callBlock = content.slice(callIndex, callIndex + 400);
    expect(callBlock).toContain("word:");
    expect(callBlock).toContain("userAttempt:");
    expect(callBlock).toContain("expected:");
    expect(callBlock).toContain("language:");
    expect(callBlock).toContain("score: pronunciationScore");
    expect(callBlock).toContain("source:");
  });
});

// ─── Compare Weeks Screen Tests ─────────────────────────────────────────────

describe("Compare Weeks Screen", () => {
  const screenPath = path.join(__dirname, "../app/compare-weeks.tsx");
  let content: string;

  beforeAll(() => {
    content = fs.readFileSync(screenPath, "utf-8");
  });

  it("exports default CompareWeeksScreen component", () => {
    expect(content).toContain("export default function CompareWeeksScreen");
  });

  it("imports getWeeklyReportHistory from weekly-progress-notification", () => {
    expect(content).toContain("getWeeklyReportHistory");
  });

  it("has ReportSelector component for choosing weeks", () => {
    expect(content).toContain("function ReportSelector");
  });

  it("has ComparisonRow component for metric-by-metric display", () => {
    expect(content).toContain("function ComparisonRow");
  });

  it("defines COMPARISON_METRICS array with key metrics", () => {
    expect(content).toContain("const COMPARISON_METRICS");
    expect(content).toContain("Overall Mastery");
    expect(content).toContain("Accuracy");
    expect(content).toContain("Sessions");
    expect(content).toContain("Total Minutes");
    expect(content).toContain("Flashcards Reviewed");
    expect(content).toContain("Conversation Minutes");
    expect(content).toContain("Error Patterns Fixed");
  });

  it("shows change indicators (improved/declined/unchanged)", () => {
    expect(content).toContain("improved");
    expect(content).toContain("declined");
    expect(content).toContain("unchanged");
    expect(content).toContain("arrow-up");
    expect(content).toContain("arrow-down");
  });

  it("shows summary card with grade change and key metrics", () => {
    expect(content).toContain("Comparison Summary");
    expect(content).toContain("gradeChange");
    expect(content).toContain("masteryChange");
    expect(content).toContain("accuracyChange");
  });

  it("shows highlights comparison side-by-side", () => {
    expect(content).toContain("Highlights Comparison");
    expect(content).toContain("highlightsRow");
    expect(content).toContain("highlightsCol");
  });

  it("shows focus areas comparison side-by-side", () => {
    expect(content).toContain("Focus Areas Comparison");
    expect(content).toContain("areasOfImprovement");
  });

  it("handles empty state (less than 2 reports)", () => {
    expect(content).toContain("Need More Data");
    expect(content).toContain("at least 2 weekly reports");
  });

  it("auto-selects two most recent reports", () => {
    expect(content).toContain("setLeftIndex(1)");
    expect(content).toContain("setRightIndex(0)");
  });

  it("has higherIsBetter flag for correct comparison direction", () => {
    expect(content).toContain("higherIsBetter");
    // errorPatternsRemaining should have higherIsBetter: false
    expect(content).toContain("\"Errors Remaining\"");
  });
});

// ─── View Past Reports - Compare Button ─────────────────────────────────────

describe("View Past Reports - Compare Weeks Button", () => {
  const screenPath = path.join(__dirname, "../app/view-past-reports.tsx");
  let content: string;

  beforeAll(() => {
    content = fs.readFileSync(screenPath, "utf-8");
  });

  it("has a button linking to /compare-weeks", () => {
    expect(content).toContain("/compare-weeks");
  });

  it("uses git-compare-outline icon for the compare button", () => {
    expect(content).toContain("git-compare-outline");
  });
});

// ─── Weekly Goals Screen Tests ──────────────────────────────────────────────

describe("Weekly Goals Screen", () => {
  const screenPath = path.join(__dirname, "../app/weekly-goals.tsx");
  let content: string;

  beforeAll(() => {
    content = fs.readFileSync(screenPath, "utf-8");
  });

  it("exports default WeeklyGoalsScreen component", () => {
    expect(content).toContain("export default function WeeklyGoalsScreen");
  });

  it("exports GoalCategory type with expected categories", () => {
    expect(content).toContain("error_patterns");
    expect(content).toContain("study_time");
    expect(content).toContain("sessions");
    expect(content).toContain("accuracy");
    expect(content).toContain("flashcards");
    expect(content).toContain("conversations");
    expect(content).toContain("drills");
    expect(content).toContain("streak");
    expect(content).toContain("lessons");
    expect(content).toContain("mastery");
  });

  it("exports WeeklyGoal interface with required fields", () => {
    expect(content).toContain("export interface WeeklyGoal");
    expect(content).toContain("targetValue: number");
    expect(content).toContain("currentValue: number");
    expect(content).toContain("completed: boolean");
  });

  it("exports gradeGoals function", () => {
    expect(content).toContain("export function gradeGoals");
  });

  it("gradeGoals returns score and grade", () => {
    expect(content).toContain("{ score: number; grade: string }");
  });

  it("has GOAL_TEMPLATES with 10 templates", () => {
    expect(content).toContain("const GOAL_TEMPLATES");
    expect(content).toContain("Fix Error Patterns");
    expect(content).toContain("Daily Study Time");
    expect(content).toContain("Complete Sessions");
    expect(content).toContain("Maintain Accuracy");
    expect(content).toContain("Review Flashcards");
    expect(content).toContain("Conversation Practice");
    expect(content).toContain("Complete Drills");
    expect(content).toContain("Maintain Streak");
    expect(content).toContain("Complete Lessons");
    expect(content).toContain("Increase Mastery");
  });

  it("has GoalCard component with progress bar", () => {
    expect(content).toContain("function GoalCard");
    expect(content).toContain("progressBarBg");
    expect(content).toContain("progressBarFill");
  });

  it("has GoalTemplateCard component with target input", () => {
    expect(content).toContain("function GoalTemplateCard");
    expect(content).toContain("targetInput");
    expect(content).toContain("Set Goal");
  });

  it("has three tabs: current, add, history", () => {
    expect(content).toContain("\"current\"");
    expect(content).toContain("\"add\"");
    expect(content).toContain("\"history\"");
    expect(content).toContain("My Goals");
    expect(content).toContain("Add Goal");
    expect(content).toContain("History");
  });

  it("has score card showing weekly progress grade", () => {
    expect(content).toContain("scoreCard");
    expect(content).toContain("This Week's Progress");
    expect(content).toContain("scoreGrade");
  });

  it("stores goals in AsyncStorage with key @weekly_goals_current", () => {
    expect(content).toContain("@weekly_goals_current");
  });

  it("stores goal history with key @weekly_goals_history", () => {
    expect(content).toContain("@weekly_goals_history");
  });

  it("has empty state with CTA to add first goal", () => {
    expect(content).toContain("No Goals Set");
    expect(content).toContain("Add Your First Goal");
  });

  it("has HistoryCard component for past weeks", () => {
    expect(content).toContain("function HistoryCard");
    expect(content).toContain("goals met");
  });

  it("supports removing goals with confirmation", () => {
    expect(content).toContain("Remove Goal");
    expect(content).toContain("removeGoal");
  });

  it("grading uses A+ through F scale", () => {
    expect(content).toContain("\"A+\"");
    expect(content).toContain("\"A\"");
    expect(content).toContain("\"B+\"");
    expect(content).toContain("\"B\"");
    expect(content).toContain("\"C+\"");
    expect(content).toContain("\"C\"");
    expect(content).toContain("\"D\"");
    expect(content).toContain("\"F\"");
  });
});

// ─── Home Screen Integration ────────────────────────────────────────────────

describe("Home Screen Integration", () => {
  const homePath = path.join(__dirname, "../app/(tabs)/index.tsx");
  let content: string;

  beforeAll(() => {
    content = fs.readFileSync(homePath, "utf-8");
  });

  it("has Compare Weeks entry in EXPLORE_FEATURES", () => {
    expect(content).toContain("compare-weeks");
    expect(content).toContain("Compare Weeks");
    expect(content).toContain("/compare-weeks");
  });

  it("has Weekly Goals entry in EXPLORE_FEATURES", () => {
    expect(content).toContain("weekly-goals");
    expect(content).toContain("Weekly Goals");
    expect(content).toContain("/weekly-goals");
  });
});
