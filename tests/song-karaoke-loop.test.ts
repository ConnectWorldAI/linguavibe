import { describe, it, expect } from "vitest";

/**
 * Tests for Song Player: Word-by-Word Karaoke, Loop-a-Line, and Dynamic Lyrics
 */

// ─── Word Timing Data Structure ─────────────────────────────────────────────
interface WordTiming {
  word: string;
  startTime: number;
  endTime: number;
  translation: string;
}

interface SyncedLyricLine {
  id: string;
  startTime: number;
  endTime: number;
  original: string;
  translated: string;
  words: WordTiming[];
}

// Sample data matching song-player.tsx
const SAMPLE_LINE: SyncedLyricLine = {
  id: "2",
  startTime: 4,
  endTime: 9,
  original: "Quiero respirar tu cuello despacito",
  translated: "I want to breathe your neck slowly",
  words: [
    { word: "Quiero", startTime: 4, endTime: 4.8, translation: "I want" },
    { word: "respirar", startTime: 4.8, endTime: 5.7, translation: "to breathe" },
    { word: "tu", startTime: 5.7, endTime: 6.0, translation: "your" },
    { word: "cuello", startTime: 6.0, endTime: 6.8, translation: "neck" },
    { word: "despacito", startTime: 6.8, endTime: 8.8, translation: "slowly" },
  ],
};

const SAMPLE_LYRICS: SyncedLyricLine[] = [
  { id: "1", startTime: 0, endTime: 4, original: "Despacito", translated: "Slowly",
    words: [{ word: "Despacito", startTime: 0, endTime: 3.5, translation: "Slowly" }] },
  SAMPLE_LINE,
  { id: "3", startTime: 9, endTime: 14, original: "Deja que te diga cosas al oído", translated: "Let me whisper things in your ear",
    words: [
      { word: "Deja", startTime: 9, endTime: 9.6, translation: "Let" },
      { word: "que", startTime: 9.6, endTime: 9.9, translation: "that" },
      { word: "te", startTime: 9.9, endTime: 10.2, translation: "you" },
      { word: "diga", startTime: 10.2, endTime: 10.8, translation: "tell" },
      { word: "cosas", startTime: 10.8, endTime: 11.5, translation: "things" },
      { word: "al", startTime: 11.5, endTime: 11.8, translation: "to the" },
      { word: "oído", startTime: 11.8, endTime: 13.5, translation: "ear" },
    ] },
];

// ─── Helper: Find active word at a given time ───────────────────────────────
function findActiveWord(line: SyncedLyricLine, currentTime: number): WordTiming | null {
  return line.words.find(w => currentTime >= w.startTime && currentTime < w.endTime) || null;
}

// ─── Helper: Find active line at a given time ───────────────────────────────
function findActiveLine(lyrics: SyncedLyricLine[], currentTime: number): number {
  return lyrics.findIndex(l => currentTime >= l.startTime && currentTime < l.endTime);
}

// ─── Helper: Loop-a-line simulation ─────────────────────────────────────────
function simulateLoop(line: SyncedLyricLine, currentTime: number): number {
  // If current time passes the line's end, reset to line's start
  if (currentTime >= line.endTime) {
    return line.startTime;
  }
  return currentTime;
}

// ─── Helper: Convert ms timestamps from pipeline to seconds ─────────────────
function convertPipelineTimings(pipelineLine: {
  startTime: number; endTime: number; original: string; translated: string;
  words: { word: string; startTime: number; endTime: number; translation: string }[];
}): SyncedLyricLine {
  return {
    id: "dynamic",
    startTime: pipelineLine.startTime / 1000,
    endTime: pipelineLine.endTime / 1000,
    original: pipelineLine.original,
    translated: pipelineLine.translated,
    words: pipelineLine.words.map(w => ({
      word: w.word,
      startTime: w.startTime / 1000,
      endTime: w.endTime / 1000,
      translation: w.translation,
    })),
  };
}

describe("Word-by-Word Karaoke Highlighting", () => {
  it("should find the correct active word at a given timestamp", () => {
    // At 4.5s, "Quiero" should be active (4.0 - 4.8)
    const word = findActiveWord(SAMPLE_LINE, 4.5);
    expect(word).not.toBeNull();
    expect(word!.word).toBe("Quiero");
    expect(word!.translation).toBe("I want");
  });

  it("should highlight 'respirar' at 5.0s", () => {
    const word = findActiveWord(SAMPLE_LINE, 5.0);
    expect(word).not.toBeNull();
    expect(word!.word).toBe("respirar");
    expect(word!.translation).toBe("to breathe");
  });

  it("should highlight 'despacito' at 7.5s", () => {
    const word = findActiveWord(SAMPLE_LINE, 7.5);
    expect(word).not.toBeNull();
    expect(word!.word).toBe("despacito");
    expect(word!.translation).toBe("slowly");
  });

  it("should return null when between words (gap)", () => {
    // At 8.9s, past the last word's endTime (8.8) but before line end (9.0)
    const word = findActiveWord(SAMPLE_LINE, 8.9);
    expect(word).toBeNull();
  });

  it("should return null when before line starts", () => {
    const word = findActiveWord(SAMPLE_LINE, 3.5);
    expect(word).toBeNull();
  });

  it("each word should have a non-empty translation", () => {
    SAMPLE_LINE.words.forEach(w => {
      expect(w.translation.length).toBeGreaterThan(0);
    });
  });

  it("word timings should be sequential and non-overlapping", () => {
    for (let i = 1; i < SAMPLE_LINE.words.length; i++) {
      expect(SAMPLE_LINE.words[i].startTime).toBeGreaterThanOrEqual(
        SAMPLE_LINE.words[i - 1].endTime
      );
    }
  });

  it("all words should fall within line boundaries", () => {
    SAMPLE_LINE.words.forEach(w => {
      expect(w.startTime).toBeGreaterThanOrEqual(SAMPLE_LINE.startTime);
      expect(w.endTime).toBeLessThanOrEqual(SAMPLE_LINE.endTime);
    });
  });
});

describe("Loop-a-Line Feature", () => {
  it("should reset to line start when current time passes line end", () => {
    const line = SAMPLE_LYRICS[1]; // startTime: 4, endTime: 9
    const result = simulateLoop(line, 9.1);
    expect(result).toBe(4); // Reset to start
  });

  it("should not reset when still within line boundaries", () => {
    const line = SAMPLE_LYRICS[1];
    const result = simulateLoop(line, 6.5);
    expect(result).toBe(6.5); // No change
  });

  it("should reset exactly at endTime", () => {
    const line = SAMPLE_LYRICS[1];
    const result = simulateLoop(line, 9.0);
    expect(result).toBe(4); // Reset at boundary
  });

  it("should keep time unchanged at startTime", () => {
    const line = SAMPLE_LYRICS[1];
    const result = simulateLoop(line, 4.0);
    expect(result).toBe(4.0);
  });

  it("loop should work for any line in the lyrics array", () => {
    const line = SAMPLE_LYRICS[0]; // "Despacito" 0-4
    const result = simulateLoop(line, 4.5);
    expect(result).toBe(0); // Reset to 0
  });
});

describe("Active Line Detection", () => {
  it("should find line 0 at time 2.0", () => {
    expect(findActiveLine(SAMPLE_LYRICS, 2.0)).toBe(0);
  });

  it("should find line 1 at time 5.0", () => {
    expect(findActiveLine(SAMPLE_LYRICS, 5.0)).toBe(1);
  });

  it("should find line 2 at time 10.0", () => {
    expect(findActiveLine(SAMPLE_LYRICS, 10.0)).toBe(2);
  });

  it("should return -1 when no line is active (past all lines)", () => {
    expect(findActiveLine(SAMPLE_LYRICS, 15.0)).toBe(-1);
  });
});

describe("Dynamic Lyrics from Translation Pipeline", () => {
  it("should convert millisecond timestamps to seconds", () => {
    const pipelineLine = {
      startTime: 4000,
      endTime: 9000,
      original: "Quiero respirar tu cuello despacito",
      translated: "I want to breathe your neck slowly",
      words: [
        { word: "Quiero", startTime: 4000, endTime: 4800, translation: "I want" },
        { word: "respirar", startTime: 4800, endTime: 5700, translation: "to breathe" },
      ],
    };

    const converted = convertPipelineTimings(pipelineLine);
    expect(converted.startTime).toBe(4);
    expect(converted.endTime).toBe(9);
    expect(converted.words[0].startTime).toBe(4);
    expect(converted.words[0].endTime).toBe(4.8);
    expect(converted.words[1].startTime).toBe(4.8);
    expect(converted.words[1].endTime).toBe(5.7);
  });

  it("should preserve original and translated text", () => {
    const pipelineLine = {
      startTime: 0,
      endTime: 4000,
      original: "Despacito",
      translated: "Slowly",
      words: [{ word: "Despacito", startTime: 0, endTime: 3500, translation: "Slowly" }],
    };

    const converted = convertPipelineTimings(pipelineLine);
    expect(converted.original).toBe("Despacito");
    expect(converted.translated).toBe("Slowly");
    expect(converted.words[0].word).toBe("Despacito");
    expect(converted.words[0].translation).toBe("Slowly");
  });

  it("should handle empty words array gracefully", () => {
    const pipelineLine = {
      startTime: 0,
      endTime: 4000,
      original: "Instrumental",
      translated: "",
      words: [],
    };

    const converted = convertPipelineTimings(pipelineLine);
    expect(converted.words).toHaveLength(0);
    expect(converted.startTime).toBe(0);
    expect(converted.endTime).toBe(4);
  });

  it("converted line should work with findActiveWord", () => {
    const pipelineLine = {
      startTime: 4000,
      endTime: 9000,
      original: "Quiero respirar",
      translated: "I want to breathe",
      words: [
        { word: "Quiero", startTime: 4000, endTime: 5500, translation: "I want" },
        { word: "respirar", startTime: 5500, endTime: 8500, translation: "to breathe" },
      ],
    };

    const converted = convertPipelineTimings(pipelineLine);
    const word = findActiveWord(converted, 6.0);
    expect(word).not.toBeNull();
    expect(word!.word).toBe("respirar");
  });
});

describe("Karaoke + Loop Integration", () => {
  it("looping a line should keep karaoke words cycling", () => {
    const line = SAMPLE_LYRICS[1];
    // Simulate: time reaches 9.0 → loop resets to 4.0
    let time = 9.0;
    time = simulateLoop(line, time);
    expect(time).toBe(4.0);

    // Now at 4.0, first word "Quiero" should be active
    const word = findActiveWord(line, time);
    expect(word).not.toBeNull();
    expect(word!.word).toBe("Quiero");
  });

  it("multiple loops should always reset to same start", () => {
    const line = SAMPLE_LYRICS[1];
    let time = 9.5;
    // Loop 1
    time = simulateLoop(line, time);
    expect(time).toBe(4);
    // Advance and loop again
    time = 9.2;
    time = simulateLoop(line, time);
    expect(time).toBe(4);
  });
});
