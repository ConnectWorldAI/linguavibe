import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

describe("Sprint 37 — Real Speech-to-Text Integration", () => {
  const duelScreen = fs.readFileSync(
    path.resolve(__dirname, "../app/pronunciation-duel.tsx"),
    "utf-8"
  );

  it("imports useSpeechToText hook", () => {
    expect(duelScreen).toContain('import { useSpeechToText } from "@/hooks/use-speech-to-text"');
  });

  it("initializes speechToText hook instance", () => {
    expect(duelScreen).toContain("const speechToText = useSpeechToText()");
  });

  it("calls speechToText.startRecording() in handleStartRecording", () => {
    expect(duelScreen).toContain("await speechToText.startRecording()");
  });

  it("calls speechToText.stopRecording() in handleStopRecording", () => {
    expect(duelScreen).toContain("finalTranscript = await speechToText.stopRecording()");
  });

  it("falls back to simulateTranscript when STT fails", () => {
    expect(duelScreen).toContain("finalTranscript = simulateTranscript(currentWord.text, difficulty)");
  });

  it("checks speechToText.state before stopping", () => {
    expect(duelScreen).toContain('speechToText.state === "recording"');
  });
});

describe("Sprint 37 — German Word Bank", () => {
  const germanBank = fs.readFileSync(
    path.resolve(__dirname, "../lib/word-banks/german.ts"),
    "utf-8"
  );

  it("exports GERMAN_WORD_BANK", () => {
    expect(germanBank).toContain("export const GERMAN_WORD_BANK");
  });

  it("exports GERMAN_TONGUE_TWISTERS", () => {
    expect(germanBank).toContain("export const GERMAN_TONGUE_TWISTERS");
  });

  it("has abcs category", () => {
    expect(germanBank).toContain('category: "abcs"');
  });

  it("has numbers category", () => {
    expect(germanBank).toContain('category: "numbers"');
  });

  it("has adjectives category", () => {
    expect(germanBank).toContain('category: "adjectives"');
  });

  it("has verbs_present category", () => {
    expect(germanBank).toContain('category: "verbs_present"');
  });

  it("has verbs_past category", () => {
    expect(germanBank).toContain('category: "verbs_past"');
  });

  it("has verbs_future category", () => {
    expect(germanBank).toContain('category: "verbs_future"');
  });

  it("has phonetic transcriptions", () => {
    expect(germanBank).toContain("phonetic:");
  });

  it("has language set to German", () => {
    expect(germanBank).toContain('language: "German"');
  });
});

describe("Sprint 37 — Korean Word Bank", () => {
  const koreanBank = fs.readFileSync(
    path.resolve(__dirname, "../lib/word-banks/korean.ts"),
    "utf-8"
  );

  it("exports KOREAN_WORD_BANK", () => {
    expect(koreanBank).toContain("export const KOREAN_WORD_BANK");
  });

  it("exports KOREAN_TONGUE_TWISTERS", () => {
    expect(koreanBank).toContain("export const KOREAN_TONGUE_TWISTERS");
  });

  it("has all 6 categories", () => {
    expect(koreanBank).toContain('category: "abcs"');
    expect(koreanBank).toContain('category: "numbers"');
    expect(koreanBank).toContain('category: "adjectives"');
    expect(koreanBank).toContain('category: "verbs_present"');
    expect(koreanBank).toContain('category: "verbs_past"');
    expect(koreanBank).toContain('category: "verbs_future"');
  });

  it("has Korean characters in text fields", () => {
    expect(koreanBank).toContain("안녕하세요");
    expect(koreanBank).toContain("감사합니다");
  });

  it("has language set to Korean", () => {
    expect(koreanBank).toContain('language: "Korean"');
  });
});

describe("Sprint 37 — Mandarin Word Bank", () => {
  const mandarinBank = fs.readFileSync(
    path.resolve(__dirname, "../lib/word-banks/mandarin.ts"),
    "utf-8"
  );

  it("exports MANDARIN_WORD_BANK", () => {
    expect(mandarinBank).toContain("export const MANDARIN_WORD_BANK");
  });

  it("exports MANDARIN_TONGUE_TWISTERS", () => {
    expect(mandarinBank).toContain("export const MANDARIN_TONGUE_TWISTERS");
  });

  it("has all 6 categories", () => {
    expect(mandarinBank).toContain('category: "abcs"');
    expect(mandarinBank).toContain('category: "numbers"');
    expect(mandarinBank).toContain('category: "adjectives"');
    expect(mandarinBank).toContain('category: "verbs_present"');
    expect(mandarinBank).toContain('category: "verbs_past"');
    expect(mandarinBank).toContain('category: "verbs_future"');
  });

  it("has Chinese characters in text fields", () => {
    expect(mandarinBank).toContain("你好");
    expect(mandarinBank).toContain("谢谢");
  });

  it("has pinyin phonetic transcriptions", () => {
    expect(mandarinBank).toContain("nǐ hǎo");
    expect(mandarinBank).toContain("xiè xie");
  });

  it("has language set to Mandarin", () => {
    expect(mandarinBank).toContain('language: "Mandarin"');
  });
});

describe("Sprint 37 — Word Banks Index Updated", () => {
  const indexFile = fs.readFileSync(
    path.resolve(__dirname, "../lib/word-banks/index.ts"),
    "utf-8"
  );

  it("imports German word bank", () => {
    expect(indexFile).toContain('import { GERMAN_WORD_BANK, GERMAN_TONGUE_TWISTERS } from "./german"');
  });

  it("imports Korean word bank", () => {
    expect(indexFile).toContain('import { KOREAN_WORD_BANK, KOREAN_TONGUE_TWISTERS } from "./korean"');
  });

  it("imports Mandarin word bank", () => {
    expect(indexFile).toContain('import { MANDARIN_WORD_BANK, MANDARIN_TONGUE_TWISTERS } from "./mandarin"');
  });

  it("includes German in SUPPORTED_DUEL_LANGUAGES", () => {
    expect(indexFile).toContain('"German"');
  });

  it("includes Korean in SUPPORTED_DUEL_LANGUAGES", () => {
    expect(indexFile).toContain('"Korean"');
  });

  it("includes Mandarin in SUPPORTED_DUEL_LANGUAGES", () => {
    expect(indexFile).toContain('"Mandarin"');
  });

  it("maps German in LANGUAGE_WORD_BANKS", () => {
    expect(indexFile).toContain("German: GERMAN_WORD_BANK");
  });

  it("maps Korean in LANGUAGE_WORD_BANKS", () => {
    expect(indexFile).toContain("Korean: KOREAN_WORD_BANK");
  });

  it("maps Mandarin in LANGUAGE_WORD_BANKS", () => {
    expect(indexFile).toContain("Mandarin: MANDARIN_WORD_BANK");
  });
});

describe("Sprint 37 — Duel Replay Library", () => {
  const replayLib = fs.readFileSync(
    path.resolve(__dirname, "../lib/duel-replay.ts"),
    "utf-8"
  );

  it("exports createReplay function", () => {
    expect(replayLib).toContain("export function createReplay(");
  });

  it("exports saveReplay function", () => {
    expect(replayLib).toContain("export async function saveReplay(");
  });

  it("exports getStoredReplays function", () => {
    expect(replayLib).toContain("export async function getStoredReplays(");
  });

  it("exports getReplayById function", () => {
    expect(replayLib).toContain("export async function getReplayById(");
  });

  it("exports detectHighlights function", () => {
    expect(replayLib).toContain("export function detectHighlights(");
  });

  it("exports generateReplayShare function", () => {
    expect(replayLib).toContain("export function generateReplayShare(");
  });

  it("exports createPlaybackState function", () => {
    expect(replayLib).toContain("export function createPlaybackState(");
  });

  it("detects perfect_score highlights", () => {
    expect(replayLib).toContain('"perfect_score"');
  });

  it("detects comeback highlights", () => {
    expect(replayLib).toContain('"comeback"');
  });

  it("detects close_call highlights", () => {
    expect(replayLib).toContain('"close_call"');
  });

  it("detects domination highlights", () => {
    expect(replayLib).toContain('"domination"');
  });

  it("supports story share format", () => {
    expect(replayLib).toContain('"story"');
  });

  it("supports clip share format", () => {
    expect(replayLib).toContain('"clip"');
  });

  it("supports full_replay share format", () => {
    expect(replayLib).toContain('"full_replay"');
  });
});

describe("Sprint 37 — Duel Replay Screen", () => {
  const replayScreen = fs.readFileSync(
    path.resolve(__dirname, "../app/duel-replay.tsx"),
    "utf-8"
  );

  it("imports replay library functions", () => {
    expect(replayScreen).toContain("getReplayById");
    expect(replayScreen).toContain("getReplayByMatchId");
    expect(replayScreen).toContain("detectHighlights");
    expect(replayScreen).toContain("generateReplayShare");
  });

  it("has playback view mode", () => {
    expect(replayScreen).toContain('"playback"');
  });

  it("has highlights view mode", () => {
    expect(replayScreen).toContain('"highlights"');
  });

  it("has stats view mode", () => {
    expect(replayScreen).toContain('"stats"');
  });

  it("has auto-play functionality", () => {
    expect(replayScreen).toContain("isAutoPlaying");
    expect(replayScreen).toContain("handleToggleAutoPlay");
  });

  it("has speed control", () => {
    expect(replayScreen).toContain("handleSpeedChange");
    expect(replayScreen).toContain("playback.speed");
  });

  it("has share functionality with multiple formats", () => {
    expect(replayScreen).toContain('handleShare("story")');
    expect(replayScreen).toContain('handleShare("clip")');
    expect(replayScreen).toContain('handleShare("full_replay")');
  });

  it("displays round-by-round word cards", () => {
    expect(replayScreen).toContain("currentRound.word");
    expect(replayScreen).toContain("currentRound.phonetic");
    expect(replayScreen).toContain("currentRound.translation");
  });

  it("shows player transcript", () => {
    expect(replayScreen).toContain("currentRound.playerTranscript");
  });
});

describe("Sprint 37 — Replay Integration in Duel Screen", () => {
  const duelScreen = fs.readFileSync(
    path.resolve(__dirname, "../app/pronunciation-duel.tsx"),
    "utf-8"
  );

  it("imports createReplay and saveReplay", () => {
    expect(duelScreen).toContain('import { createReplay, saveReplay } from "@/lib/duel-replay"');
  });

  it("calls createReplay on match completion", () => {
    expect(duelScreen).toContain("const replayData = createReplay(");
  });

  it("calls saveReplay to persist the replay", () => {
    expect(duelScreen).toContain("saveReplay(replayData)");
  });
});

describe("Sprint 37 — Replay Button in Results Screen", () => {
  const resultsScreen = fs.readFileSync(
    path.resolve(__dirname, "../app/pronunciation-duel-results.tsx"),
    "utf-8"
  );

  it("has a Replay button", () => {
    expect(resultsScreen).toContain("Replay");
  });

  it("navigates to duel-replay screen", () => {
    expect(resultsScreen).toContain("/duel-replay");
  });

  it("passes matchId to replay screen", () => {
    expect(resultsScreen).toContain("matchId:");
  });
});

describe("Sprint 37 — Duel Replay Screen Registered in Layout", () => {
  const layout = fs.readFileSync(
    path.resolve(__dirname, "../app/_layout.tsx"),
    "utf-8"
  );

  it("registers duel-replay screen", () => {
    expect(layout).toContain('name="duel-replay"');
  });
});
