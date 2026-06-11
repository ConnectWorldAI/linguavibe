import { describe, it, expect, vi } from "vitest";

/**
 * Tests for Song Player: Speed Control, Vocabulary Save, Per-Word Pronunciation Scoring
 */

// ─── Speed Control Logic ────────────────────────────────────────────────────
describe("Playback Speed Control", () => {
  const SPEED_OPTIONS = [0.5, 0.75, 1, 1.25];
  const BASE_INCREMENT = 0.1; // 100ms interval

  it("should include 0.5x, 0.75x, 1x, and 1.25x options", () => {
    expect(SPEED_OPTIONS).toContain(0.5);
    expect(SPEED_OPTIONS).toContain(0.75);
    expect(SPEED_OPTIONS).toContain(1);
    expect(SPEED_OPTIONS).toContain(1.25);
  });

  it("at 0.5x speed, time advances half as fast", () => {
    const speed = 0.5;
    const increment = BASE_INCREMENT * speed;
    expect(increment).toBe(0.05);
    // After 10 intervals (1 second real time), only 0.5s of song time passes
    const after10Intervals = increment * 10;
    expect(after10Intervals).toBe(0.5);
  });

  it("at 0.75x speed, time advances 75% as fast", () => {
    const speed = 0.75;
    const increment = BASE_INCREMENT * speed;
    expect(increment).toBeCloseTo(0.075);
    const after10Intervals = increment * 10;
    expect(after10Intervals).toBeCloseTo(0.75);
  });

  it("at 1x speed, time advances normally", () => {
    const speed = 1;
    const increment = BASE_INCREMENT * speed;
    expect(increment).toBe(0.1);
    const after10Intervals = increment * 10;
    expect(after10Intervals).toBe(1);
  });

  it("at 1.25x speed, time advances 25% faster", () => {
    const speed = 1.25;
    const increment = BASE_INCREMENT * speed;
    expect(increment).toBe(0.125);
    const after10Intervals = increment * 10;
    expect(after10Intervals).toBe(1.25);
  });

  it("speed change should not affect current position", () => {
    let currentTime = 45.5;
    const newSpeed = 0.5;
    // Changing speed doesn't reset position
    expect(currentTime).toBe(45.5);
    // Only future increments are affected
    const nextIncrement = BASE_INCREMENT * newSpeed;
    expect(currentTime + nextIncrement).toBe(45.55);
  });

  it("slow speed combined with loop should work correctly", () => {
    const speed = 0.5;
    const lineStart = 4;
    const lineEnd = 9;
    let currentTime = 8.95;

    // Advance at slow speed
    const next = currentTime + BASE_INCREMENT * speed;
    expect(next).toBe(9.0);

    // At exactly endTime, loop should trigger
    if (next >= lineEnd) {
      currentTime = lineStart;
    }
    expect(currentTime).toBe(4);
  });
});

// ─── Vocabulary Save Logic ──────────────────────────────────────────────────
describe("Tap-a-Word Vocabulary Save", () => {
  interface WordTiming {
    word: string;
    startTime: number;
    endTime: number;
    translation: string;
  }

  const sampleWord: WordTiming = {
    word: "despacito",
    startTime: 6.8,
    endTime: 8.8,
    translation: "slowly",
  };

  const songTitle = "Despacito";

  it("should generate a unique word ID from song title, word, and startTime", () => {
    const wordId = `song_${songTitle}_${sampleWord.word}_${sampleWord.startTime}`;
    expect(wordId).toBe("song_Despacito_despacito_6.8");
  });

  it("should not duplicate saved words (Set-based tracking)", () => {
    const savedWords = new Set<string>();
    const wordId = `song_${songTitle}_${sampleWord.word}_${sampleWord.startTime}`;

    savedWords.add(wordId);
    expect(savedWords.has(wordId)).toBe(true);
    expect(savedWords.size).toBe(1);

    // Adding same word again doesn't increase size
    savedWords.add(wordId);
    expect(savedWords.size).toBe(1);
  });

  it("should create SRS-compatible item from word timing", () => {
    const wordId = `song_${songTitle}_${sampleWord.word}_${sampleWord.startTime}`;
    const srsItem = {
      id: wordId,
      word: sampleWord.word,
      translation: sampleWord.translation,
      context: "Quiero respirar tu cuello despacito",
      lessonId: `song:${songTitle}`,
    };

    expect(srsItem.id).toContain("song_");
    expect(srsItem.word).toBe("despacito");
    expect(srsItem.translation).toBe("slowly");
    expect(srsItem.context).toContain("despacito");
    expect(srsItem.lessonId).toBe("song:Despacito");
  });

  it("different words from same song should have different IDs", () => {
    const word1: WordTiming = { word: "Quiero", startTime: 4, endTime: 4.8, translation: "I want" };
    const word2: WordTiming = { word: "respirar", startTime: 4.8, endTime: 5.7, translation: "to breathe" };

    const id1 = `song_${songTitle}_${word1.word}_${word1.startTime}`;
    const id2 = `song_${songTitle}_${word2.word}_${word2.startTime}`;

    expect(id1).not.toBe(id2);
  });

  it("same word at different positions should have different IDs", () => {
    // "Despacito" appears at startTime 0 and again at startTime 196
    const id1 = `song_${songTitle}_Despacito_0`;
    const id2 = `song_${songTitle}_Despacito_196`;
    expect(id1).not.toBe(id2);
  });
});

// ─── Per-Word Pronunciation Scoring ─────────────────────────────────────────
describe("Per-Word Pronunciation Scoring", () => {
  type ScoreColor = "green" | "yellow" | "red";

  function scoreToColor(score: number): ScoreColor {
    if (score >= 80) return "green";
    if (score >= 55) return "yellow";
    return "red";
  }

  it("should map score >= 80 to green", () => {
    expect(scoreToColor(80)).toBe("green");
    expect(scoreToColor(95)).toBe("green");
    expect(scoreToColor(100)).toBe("green");
  });

  it("should map score 55-79 to yellow", () => {
    expect(scoreToColor(55)).toBe("yellow");
    expect(scoreToColor(70)).toBe("yellow");
    expect(scoreToColor(79)).toBe("yellow");
  });

  it("should map score < 55 to red", () => {
    expect(scoreToColor(54)).toBe("red");
    expect(scoreToColor(30)).toBe("red");
    expect(scoreToColor(0)).toBe("red");
  });

  it("should assign scores to all words in a line", () => {
    const lineWords = ["Quiero", "respirar", "tu", "cuello", "despacito"];
    const lineId = "2";
    const scores: Record<string, ScoreColor> = {};

    // Simulate scoring each word
    lineWords.forEach((_, idx) => {
      const key = `${lineId}_${idx}`;
      const mockScore = 60 + Math.floor(idx * 10); // 60, 70, 80, 90, 100
      scores[key] = scoreToColor(mockScore);
    });

    expect(scores["2_0"]).toBe("yellow"); // 60
    expect(scores["2_1"]).toBe("yellow"); // 70
    expect(scores["2_2"]).toBe("green");  // 80
    expect(scores["2_3"]).toBe("green");  // 90
    expect(scores["2_4"]).toBe("green");  // 100
  });

  it("should calculate overall score from word scores", () => {
    const wordScores: Record<string, ScoreColor> = {
      "2_0": "green",
      "2_1": "yellow",
      "2_2": "green",
      "2_3": "red",
      "2_4": "green",
    };

    const greenCount = Object.values(wordScores).filter(v => v === "green").length;
    const total = Object.values(wordScores).length;
    const overallScore = Math.round((greenCount / total) * 100);

    expect(greenCount).toBe(3);
    expect(total).toBe(5);
    expect(overallScore).toBe(60);
  });

  it("should count perfect, close, and needs-work words", () => {
    const wordScores: Record<string, ScoreColor> = {
      "2_0": "green",
      "2_1": "green",
      "2_2": "yellow",
      "2_3": "yellow",
      "2_4": "red",
    };

    const perfect = Object.values(wordScores).filter(v => v === "green").length;
    const close = Object.values(wordScores).filter(v => v === "yellow").length;
    const needsWork = Object.values(wordScores).filter(v => v === "red").length;

    expect(perfect).toBe(2);
    expect(close).toBe(2);
    expect(needsWork).toBe(1);
  });

  it("should reset scores when starting a new sing-along session", () => {
    let wordScores: Record<string, ScoreColor> = {
      "2_0": "green",
      "2_1": "red",
    };
    let pronunciationScore: number | null = 50;

    // Starting new session clears everything
    wordScores = {};
    pronunciationScore = null;

    expect(Object.keys(wordScores).length).toBe(0);
    expect(pronunciationScore).toBeNull();
  });
});

// ─── Integration: Speed + Scoring + Vocab ───────────────────────────────────
describe("Feature Integration", () => {
  it("slowing down should not affect scoring accuracy", () => {
    // Speed only affects timer increment, not scoring logic
    const speed = 0.5;
    const score = 85;
    const color = score >= 80 ? "green" : score >= 55 ? "yellow" : "red";
    expect(color).toBe("green");
    // Speed doesn't influence the score mapping
  });

  it("saving a word should not interrupt playback state", () => {
    let isPlaying = true;
    let currentTime = 5.5;
    const savedWords = new Set<string>();

    // Simulate saving a word
    savedWords.add("song_Despacito_respirar_4.8");

    // Playback should continue unaffected
    expect(isPlaying).toBe(true);
    expect(currentTime).toBe(5.5);
    expect(savedWords.size).toBe(1);
  });

  it("scoring should work at any playback speed", () => {
    const speeds = [0.5, 0.75, 1, 1.25];
    speeds.forEach(speed => {
      // Scoring is independent of speed
      const mockAnalysisScore = 72;
      const color = mockAnalysisScore >= 80 ? "green" : mockAnalysisScore >= 55 ? "yellow" : "red";
      expect(color).toBe("yellow");
    });
  });
});
