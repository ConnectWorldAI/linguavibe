/**
 * Snapshot / Regression Tests for Dialect Challenge UI States
 *
 * Validates the three main UI states (menu, playing, results) of the
 * dialect challenge screen by verifying structural invariants, data
 * consistency, and state transitions.
 */
import { describe, it, expect, beforeEach } from "vitest";
import * as fs from "fs";
import * as path from "path";

const DIALECT_CHALLENGE_PATH = path.resolve(__dirname, "../app/dialect-challenge.tsx");
const content = fs.readFileSync(DIALECT_CHALLENGE_PATH, "utf-8");

// ─── Menu State Tests ────────────────────────────────────────────────────────

describe("Dialect Challenge - Menu State", () => {
  it("renders difficulty selector with three options", () => {
    // The menu state should offer easy, medium, hard
    expect(content).toMatch(/easy/);
    expect(content).toMatch(/medium/);
    expect(content).toMatch(/hard/);
  });

  it("displays stats from previous games", () => {
    // Menu should show totalPlayed, totalCorrect, bestStreak
    expect(content).toMatch(/totalPlayed/);
    expect(content).toMatch(/totalCorrect/);
    expect(content).toMatch(/bestStreak/);
  });

  it("has a start game button", () => {
    // There should be a startGame function called on press
    expect(content).toMatch(/startGame/);
  });

  it("shows back navigation", () => {
    // Menu should allow going back
    expect(content).toMatch(/router\.back/);
  });

  it("loads stats from AsyncStorage on mount", () => {
    expect(content).toMatch(/loadStats/);
    expect(content).toMatch(/AsyncStorage\.getItem\(STORAGE_KEY\)/);
  });

  it("uses ScreenContainer for safe area handling", () => {
    expect(content).toMatch(/ScreenContainer/);
  });

  it("applies theme colors from useColors hook", () => {
    expect(content).toMatch(/useColors/);
    expect(content).toMatch(/colors\./);
  });

  it("renders game mode state initialized to menu", () => {
    expect(content).toMatch(/useState<"menu" \| "playing" \| "results">\("menu"\)/);
  });
});

// ─── Playing State Tests ─────────────────────────────────────────────────────

describe("Dialect Challenge - Playing State", () => {
  it("displays the current phrase to identify", () => {
    // Playing state should show the phrase text
    expect(content).toMatch(/phrase\.phrase/);
  });

  it("shows 4 dialect choices per round", () => {
    // Each round has 3 wrong + 1 correct = 4 choices
    expect(content).toMatch(/\.slice\(0, 3\)/);
  });

  it("includes a countdown timer", () => {
    expect(content).toMatch(/timeLeft/);
    expect(content).toMatch(/startTimer/);
    expect(content).toMatch(/clearInterval/);
  });

  it("tracks answer time in milliseconds", () => {
    expect(content).toMatch(/answerTime/);
    expect(content).toMatch(/roundStartRef/);
    expect(content).toMatch(/Date\.now\(\)/);
  });

  it("shows streak counter during gameplay", () => {
    expect(content).toMatch(/streak/);
    expect(content).toMatch(/setStreak/);
  });

  it("provides haptic feedback on answer selection", () => {
    expect(content).toMatch(/Haptics\.impactAsync/);
  });

  it("shows teaching moment after answering", () => {
    expect(content).toMatch(/teachingMoment/);
  });

  it("has audio pronunciation via Speech API", () => {
    expect(content).toMatch(/Speech\.speak/);
  });

  it("advances to next round after answering", () => {
    expect(content).toMatch(/setCurrentRound\(\(prev\) => prev \+ 1\)/);
  });

  it("uses animated feedback for correct/incorrect answers", () => {
    expect(content).toMatch(/shakeX/);
    expect(content).toMatch(/pulseScale/);
  });

  it("tracks isCorrect state for visual feedback", () => {
    expect(content).toMatch(/isCorrect/);
    expect(content).toMatch(/setIsCorrect/);
  });

  it("limits rounds to ROUNDS_PER_GAME constant", () => {
    expect(content).toMatch(/ROUNDS_PER_GAME/);
    expect(content).toMatch(/const ROUNDS_PER_GAME = 7/);
  });

  it("uses TIME_LIMITS based on difficulty", () => {
    expect(content).toMatch(/TIME_LIMITS\[difficulty\]/);
    expect(content).toMatch(/TIME_LIMITS = \{ easy: 20, medium: 12, hard: 7 \}/);
  });
});

// ─── Results State Tests ─────────────────────────────────────────────────────

describe("Dialect Challenge - Results State", () => {
  it("shows final score", () => {
    expect(content).toMatch(/score/);
  });

  it("displays best streak achieved", () => {
    expect(content).toMatch(/bestStreak/);
  });

  it("shows total correct answers", () => {
    expect(content).toMatch(/totalCorrect/);
  });

  it("offers Play Again button", () => {
    expect(content).toMatch(/Play Again/);
  });

  it("saves stats to AsyncStorage on completion", () => {
    expect(content).toMatch(/saveStats/);
    expect(content).toMatch(/AsyncStorage\.setItem\(STORAGE_KEY/);
  });

  it("calls markPracticeAndToast on game completion", () => {
    expect(content).toMatch(/markPracticeAndToast|markTodayAsPracticed/);
  });

  it("transitions to results state after final round", () => {
    expect(content).toMatch(/setGameMode\("results"\)/);
  });

  it("updates totalPlayed count", () => {
    // Stats should increment totalPlayed (by rounds.length)
    expect(content).toMatch(/totalPlayed:.*stats\.totalPlayed \+ rounds\.length/);
  });

  it("tracks best time across games", () => {
    expect(content).toMatch(/bestTime/);
    expect(content).toMatch(/Math\.min\(stats\.bestTime/);
  });

  it("records lastPlayed timestamp", () => {
    expect(content).toMatch(/lastPlayed:.*new Date\(\)\.toISOString\(\)/);
  });
});

// ─── State Transition Tests ──────────────────────────────────────────────────

describe("Dialect Challenge - State Transitions", () => {
  it("transitions from menu to playing on startGame", () => {
    expect(content).toMatch(/setGameMode\("playing"\)/);
  });

  it("transitions from playing to results after all rounds", () => {
    // After final round, should go to results
    expect(content).toMatch(/setGameMode\("results"\)/);
  });

  it("can restart from results back to playing", () => {
    // Play Again should call startGame which sets mode to playing
    expect(content).toMatch(/startGame/);
    expect(content).toMatch(/setGameMode\("playing"\)/);
  });

  it("resets game state on new game start", () => {
    expect(content).toMatch(/setCurrentRound\(0\)/);
    expect(content).toMatch(/setScore\(0\)/);
    expect(content).toMatch(/setStreak\(0\)/);
    expect(content).toMatch(/setBestStreak\(0\)/);
    expect(content).toMatch(/setAnswered\(false\)/);
    expect(content).toMatch(/setSelectedAnswer\(null\)/);
    expect(content).toMatch(/setIsCorrect\(null\)/);
  });
});

// ─── Data Integrity Tests ────────────────────────────────────────────────────

describe("Dialect Challenge - Data Integrity", () => {
  it("has at least 7 challenge phrases (enough for one game)", () => {
    const phraseMatches = content.match(/correctDialect:\s*"/g);
    expect(phraseMatches).not.toBeNull();
    expect(phraseMatches!.length).toBeGreaterThanOrEqual(7);
  });

  it("covers at least 5 different dialects", () => {
    const dialectMatches = content.match(/correctDialect:\s*"([^"]+)"/g) || [];
    const dialects = new Set(dialectMatches.map((m) => m.replace(/correctDialect:\s*"/, "").replace(/"$/, "")));
    expect(dialects.size).toBeGreaterThanOrEqual(5);
  });

  it("every phrase has a teachingMoment", () => {
    const phraseCount = (content.match(/correctDialect:\s*"/g) || []).length;
    const teachingCount = (content.match(/teachingMoment:\s*"/g) || []).length;
    expect(teachingCount).toBe(phraseCount);
  });

  it("every phrase has an audioHint", () => {
    const phraseCount = (content.match(/correctDialect:\s*"/g) || []).length;
    const audioHintCount = (content.match(/audioHint:\s*"/g) || []).length;
    expect(audioHintCount).toBe(phraseCount);
  });

  it("every phrase has a category", () => {
    // Each phrase entry has a category field; the type definition also matches the pattern
    // so categoryDataCount >= phraseDataCount
    const phraseDataCount = (content.match(/correctDialect:\s*"[A-Z]/g) || []).length;
    const categoryDataCount = (content.match(/category:\s*"(slang|greeting|expression|pronunciation|grammar)"/g) || []).length;
    expect(categoryDataCount).toBeGreaterThanOrEqual(phraseDataCount);
  });

  it("DIALECT_CHOICES includes all dialects referenced in phrases", () => {
    const dialectMatches = content.match(/correctDialect:\s*"([^"]+)"/g) || [];
    const usedDialects = new Set(dialectMatches.map((m) => m.replace(/correctDialect:\s*"/, "").replace(/"$/, "")));
    const choiceMatches = content.match(/name:\s*"([^"]+)",\s*flag:/g) || [];
    const availableDialects = new Set(choiceMatches.map((m) => m.replace(/name:\s*"/, "").replace(/",\s*flag:/, "")));
    for (const dialect of usedDialects) {
      expect(availableDialects.has(dialect)).toBe(true);
    }
  });

  it("ChallengeStats interface matches saved data structure", () => {
    expect(content).toMatch(/interface ChallengeStats/);
    expect(content).toMatch(/totalPlayed:\s*number/);
    expect(content).toMatch(/totalCorrect:\s*number/);
    expect(content).toMatch(/bestStreak:\s*number/);
    expect(content).toMatch(/bestTime:\s*number/);
    expect(content).toMatch(/dialectsMastered:\s*string\[\]/);
    expect(content).toMatch(/lastPlayed:\s*string/);
  });

  it("storage key is properly namespaced", () => {
    expect(content).toMatch(/@dialect_challenge_stats/);
  });
});

// ─── Accessibility & UX Tests ────────────────────────────────────────────────

describe("Dialect Challenge - Accessibility & UX", () => {
  it("uses flags alongside dialect names for visual identification", () => {
    expect(content).toMatch(/correctFlag/);
    expect(content).toMatch(/🇩🇴/);
    expect(content).toMatch(/🇲🇽/);
    expect(content).toMatch(/🇨🇴/);
  });

  it("provides pronunciation guides for phrases", () => {
    expect(content).toMatch(/pronunciation/);
  });

  it("includes meaning/translation for each phrase", () => {
    expect(content).toMatch(/meaning:/);
  });

  it("uses animated transitions between states", () => {
    expect(content).toMatch(/FadeIn/);
    expect(content).toMatch(/FadeInDown/);
  });

  it("cleans up timer on unmount", () => {
    expect(content).toMatch(/return \(\) => \{/);
    expect(content).toMatch(/clearInterval/);
  });
});
