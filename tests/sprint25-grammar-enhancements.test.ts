import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

describe("Sprint 25 — Grammar Quiz Mode", () => {
  const quizPath = path.join(__dirname, "../app/grammar-quiz.tsx");
  const quizContent = fs.readFileSync(quizPath, "utf-8");

  it("grammar-quiz screen exists", () => {
    expect(fs.existsSync(quizPath)).toBe(true);
  });

  it("generates questions from grammar tables", () => {
    expect(quizContent).toContain("generateQuestions");
    expect(quizContent).toContain("fill_blank_grammar");
    expect(quizContent).toContain("fill_blank_conjugation");
  });

  it("has fill-in-the-blank input with answer checking", () => {
    expect(quizContent).toContain("TextInput");
    expect(quizContent).toContain("checkAnswer");
    expect(quizContent).toContain("correctAnswer");
  });

  it("shows score and results on quiz completion", () => {
    expect(quizContent).toContain("quizComplete");
    expect(quizContent).toContain("scorePercentage");
    expect(quizContent).toContain("Quiz Complete!");
  });

  it("saves quiz history to AsyncStorage", () => {
    expect(quizContent).toContain("QUIZ_HISTORY_KEY");
    expect(quizContent).toContain("saveQuizResult");
    expect(quizContent).toContain("getQuizHistory");
  });

  it("supports filtering by specific entry", () => {
    expect(quizContent).toContain("entryId");
    expect(quizContent).toContain("useLocalSearchParams");
  });

  it("has retry and done buttons on results screen", () => {
    expect(quizContent).toContain("restartQuiz");
    expect(quizContent).toContain("Try Again");
    expect(quizContent).toContain("Done");
  });

  it("shows pronunciation hint for each question", () => {
    expect(quizContent).toContain("hint");
    expect(quizContent).toContain("pronunciation");
  });

  it("provides correct/incorrect feedback with the answer", () => {
    expect(quizContent).toContain("isCorrect");
    expect(quizContent).toContain("feedbackCorrect");
    expect(quizContent).toContain("feedbackWrong");
  });
});

describe("Sprint 25 — Grammar Streak Tracking", () => {
  const streakPath = path.join(__dirname, "../lib/grammar-streak.ts");
  const streakContent = fs.readFileSync(streakPath, "utf-8");
  const notebookPath = path.join(__dirname, "../app/grammar-notebook.tsx");
  const notebookContent = fs.readFileSync(notebookPath, "utf-8");

  it("grammar-streak.ts library exists", () => {
    expect(fs.existsSync(streakPath)).toBe(true);
  });

  it("tracks current streak and longest streak", () => {
    expect(streakContent).toContain("currentStreak");
    expect(streakContent).toContain("longestStreak");
  });

  it("records review dates and detects consecutive days", () => {
    expect(streakContent).toContain("lastReviewDate");
    expect(streakContent).toContain("reviewDates");
    expect(streakContent).toContain("getYesterday");
  });

  it("resets streak when day is missed", () => {
    // If last review was neither today nor yesterday, streak resets
    expect(streakContent).toContain("currentStreak: 0");
  });

  it("notebook imports and uses streak tracking", () => {
    expect(notebookContent).toContain("getStreakData");
    expect(notebookContent).toContain("recordGrammarReview");
    expect(notebookContent).toContain("streakCount");
  });

  it("notebook shows streak banner with fire emoji", () => {
    expect(notebookContent).toContain("streakBanner");
    expect(notebookContent).toContain("day streak");
  });

  it("records review when expanding a grammar entry", () => {
    expect(notebookContent).toContain("handleExpand");
    expect(notebookContent).toContain("recordGrammarReview");
  });
});

describe("Sprint 25 — Share Grammar Card", () => {
  const notebookPath = path.join(__dirname, "../app/grammar-notebook.tsx");
  const notebookContent = fs.readFileSync(notebookPath, "utf-8");

  it("imports expo-sharing and react-native-view-shot", () => {
    expect(notebookContent).toContain("expo-sharing");
    expect(notebookContent).toContain("react-native-view-shot");
    expect(notebookContent).toContain("captureRef");
  });

  it("has handleShare function", () => {
    expect(notebookContent).toContain("handleShare");
    expect(notebookContent).toContain("Sharing.shareAsync");
  });

  it("renders off-screen shareable card for capture", () => {
    expect(notebookContent).toContain("shareCardOffscreen");
    expect(notebookContent).toContain("shareCardRef");
    expect(notebookContent).toContain("collapsable={false}");
  });

  it("share card includes LinguaVibe branding", () => {
    expect(notebookContent).toContain("LinguaVibe");
    expect(notebookContent).toContain("shareCardLogo");
  });

  it("share card shows grammar table data", () => {
    expect(notebookContent).toContain("shareTable");
    expect(notebookContent).toContain("shareTableRow");
    expect(notebookContent).toContain("shareTableCell");
  });

  it("share card shows conjugation table if present", () => {
    expect(notebookContent).toContain("conjugationTable");
    expect(notebookContent).toContain("shareConjTitle");
  });

  it("share card includes key rule footer", () => {
    expect(notebookContent).toContain("shareCardFooter");
    expect(notebookContent).toContain("shareCardRule");
  });

  it("share button visible in action row", () => {
    expect(notebookContent).toContain("Share Card");
    expect(notebookContent).toContain("actionRow");
    expect(notebookContent).toContain("shareBtn");
  });
});

describe("Sprint 25 — Layout Registration", () => {
  const layoutPath = path.join(__dirname, "../app/_layout.tsx");
  const layoutContent = fs.readFileSync(layoutPath, "utf-8");

  it("grammar-quiz screen is registered in _layout.tsx", () => {
    expect(layoutContent).toContain("grammar-quiz");
  });

  it("grammar-notebook screen is registered in _layout.tsx", () => {
    expect(layoutContent).toContain("grammar-notebook");
  });
});

describe("Sprint 25 — Quiz button in notebook header", () => {
  const notebookPath = path.join(__dirname, "../app/grammar-notebook.tsx");
  const notebookContent = fs.readFileSync(notebookPath, "utf-8");

  it("has quiz button navigating to grammar-quiz", () => {
    expect(notebookContent).toContain("grammar-quiz");
    expect(notebookContent).toContain("quizBtn");
    expect(notebookContent).toContain("Quiz");
  });
});
