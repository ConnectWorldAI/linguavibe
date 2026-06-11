/**
 * Tests for:
 * 1. Slang of the Day push notification module
 * 2. Dialect Quiz Leaderboard screen
 * 3. Methodology Dashboard screen
 */
import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

const ROOT = path.resolve(__dirname, "..");

// ─── Slang of the Day Notification ──────────────────────────────────────────

describe("Slang of the Day Notification", () => {
  const filePath = path.join(ROOT, "lib/slang-of-the-day-notification.ts");
  const content = fs.readFileSync(filePath, "utf-8");

  it("exports scheduleSlangOfDayNotification function", () => {
    expect(content).toContain("export async function scheduleSlangOfDayNotification");
  });

  it("exports cancelSlangOfDayNotification function", () => {
    expect(content).toContain("export async function cancelSlangOfDayNotification");
  });

  it("exports initSlangOfDayNotification function", () => {
    expect(content).toContain("export async function initSlangOfDayNotification");
  });

  it("exports pickSlangOfTheDay function", () => {
    expect(content).toContain("export async function pickSlangOfTheDay");
  });

  it("exports getSlangOfDayHistory function", () => {
    expect(content).toContain("export async function getSlangOfDayHistory");
  });

  it("exports SlangOfDayEntry interface with required fields", () => {
    expect(content).toContain("export interface SlangOfDayEntry");
    expect(content).toContain("expression: string");
    expect(content).toContain("meaning: string");
    expect(content).toContain("dialect: string");
    expect(content).toContain("dialectFlag: string");
  });

  it("deep links to dialect-quiz screen", () => {
    expect(content).toContain("screen: \"dialect-quiz\"");
  });

  it("includes notification type slang_of_the_day", () => {
    expect(content).toContain("type: \"slang_of_the_day\"");
  });

  it("tracks sent IDs to avoid repeats", () => {
    expect(content).toContain("SENT_IDS_KEY");
    expect(content).toContain("@slang_of_day_sent_ids");
  });

  it("keeps history of last 90 days", () => {
    expect(content).toContain("slice(0, 90)");
  });

  it("includes dialect info for multiple countries", () => {
    expect(content).toContain("Dominican Republic");
    expect(content).toContain("Puerto Rico");
    expect(content).toContain("Panama");
    expect(content).toContain("Mexico");
    expect(content).toContain("Colombia");
    expect(content).toContain("Venezuela");
  });

  it("imports slang data functions", () => {
    expect(content).toContain("getSlangForLanguage");
    expect(content).toContain("getSlangLanguageConfig");
    expect(content).toContain("languageNameToCode");
  });

  it("schedules daily repeating notification", () => {
    expect(content).toContain("SchedulableTriggerInputTypes.DAILY");
  });

  it("uses Android notification channel", () => {
    expect(content).toContain("slang-of-the-day");
    expect(content).toContain("setNotificationChannelAsync");
  });

  it("is initialized in _layout.tsx", () => {
    const layoutContent = fs.readFileSync(path.join(ROOT, "app/_layout.tsx"), "utf-8");
    expect(layoutContent).toContain("initSlangOfDayNotification");
  });
});

// ─── Dialect Quiz Leaderboard ───────────────────────────────────────────────

describe("Dialect Quiz Leaderboard", () => {
  const filePath = path.join(ROOT, "app/dialect-quiz-leaderboard.tsx");
  const content = fs.readFileSync(filePath, "utf-8");

  it("exports default component", () => {
    expect(content).toContain("export default function DialectQuizLeaderboardScreen");
  });

  it("has weekly and allTime time filters", () => {
    expect(content).toContain("type TimeFilter = \"weekly\" | \"allTime\"");
  });

  it("displays top 3 podium", () => {
    expect(content).toContain("podiumContainer");
    expect(content).toContain("podiumRank");
  });

  it("shows user stats card with score, accuracy, best streak, and games", () => {
    expect(content).toContain("Your Stats");
    expect(content).toContain("Score");
    expect(content).toContain("Accuracy");
    expect(content).toContain("Best Streak");
    expect(content).toContain("Games");
  });

  it("includes Play Dialect Quiz button linking to dialect-quiz", () => {
    expect(content).toContain("Play Dialect Quiz");
    expect(content).toContain("/dialect-quiz");
  });

  it("has LeaderEntry interface with score and accuracy", () => {
    expect(content).toContain("interface LeaderEntry");
    expect(content).toContain("score: number");
    expect(content).toContain("accuracy: number");
    expect(content).toContain("bestStreak: number");
  });

  it("highlights user row differently", () => {
    expect(content).toContain("rowYou");
    expect(content).toContain("isYou");
  });

  it("has medal colors for top 3", () => {
    expect(content).toContain("#FFD700"); // gold
    expect(content).toContain("#C0C0C0"); // silver
    expect(content).toContain("#CD7F32"); // bronze
  });

  it("is registered in _layout.tsx", () => {
    const layoutContent = fs.readFileSync(path.join(ROOT, "app/_layout.tsx"), "utf-8");
    expect(layoutContent).toContain("dialect-quiz-leaderboard");
  });

  it("dialect quiz has leaderboard button in header", () => {
    const quizContent = fs.readFileSync(path.join(ROOT, "app/dialect-quiz.tsx"), "utf-8");
    expect(quizContent).toContain("/dialect-quiz-leaderboard");
    expect(quizContent).toContain("trophy");
  });
});

// ─── Methodology Dashboard ──────────────────────────────────────────────────

describe("Methodology Dashboard", () => {
  const filePath = path.join(ROOT, "app/methodology-dashboard.tsx");
  const content = fs.readFileSync(filePath, "utf-8");

  it("exports default component", () => {
    expect(content).toContain("export default function MethodologyDashboardScreen");
  });

  it("has search functionality", () => {
    expect(content).toContain("searchInput");
    expect(content).toContain("Search methodologies");
  });

  it("has teaching style filter chips", () => {
    expect(content).toContain("Teaching Style");
    expect(content).toContain("selectedStyle");
    expect(content).toContain("filterChip");
  });

  it("has difficulty filter", () => {
    expect(content).toContain("selectedDifficulty");
    expect(content).toContain("Difficulty");
  });

  it("has sort options: name, style, difficulty", () => {
    expect(content).toContain("type SortBy = \"name\" | \"style\" | \"difficulty\"");
    expect(content).toContain("A-Z");
    expect(content).toContain("Style");
    expect(content).toContain("Level");
  });

  it("includes all 12 teaching styles", () => {
    const styles = [
      "Immersive", "Kinesthetic", "Conversational", "Project-Based",
      "Memory-Optimized", "Relaxation-Based", "Drill-Based", "Vocabulary-First",
      "Content-Based", "Academic", "Pronunciation-Focused", "Peer-Based",
    ];
    for (const style of styles) {
      expect(content).toContain(style);
    }
  });

  it("includes 12 methodology cards", () => {
    const methods = [
      "Comprehensible Input",
      "Total Physical Response",
      "Communicative Language Teaching",
      "Task-Based Language Teaching",
      "Spaced Repetition System",
      "Immersion Method",
      "Suggestopedia",
      "Audio-Lingual Method",
      "Lexical Approach",
      "Content and Language Integrated Learning",
      "Grammar-Translation Method",
      "Shadowing Technique",
    ];
    for (const method of methods) {
      expect(content).toContain(method);
    }
  });

  it("card shows key principles, example activities, best for, and research basis", () => {
    expect(content).toContain("Key Principles");
    expect(content).toContain("Example Activities");
    expect(content).toContain("Best For");
    expect(content).toContain("researchBasis");
  });

  it("cards are expandable", () => {
    expect(content).toContain("expandedId");
    expect(content).toContain("toggleExpand");
    expect(content).toContain("chevron-up");
    expect(content).toContain("chevron-down");
  });

  it("shows result count", () => {
    expect(content).toContain("filtered.length");
    expect(content).toContain("method");
  });

  it("shows empty state when no results", () => {
    expect(content).toContain("No methodologies found");
    expect(content).toContain("Try adjusting your filters");
  });

  it("uses FlatList for performance", () => {
    expect(content).toContain("FlatList");
    expect(content).toContain("renderItem={renderCard}");
  });

  it("is registered in _layout.tsx", () => {
    const layoutContent = fs.readFileSync(path.join(ROOT, "app/_layout.tsx"), "utf-8");
    expect(layoutContent).toContain("methodology-dashboard");
  });
});
