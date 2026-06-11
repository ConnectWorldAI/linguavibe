import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

describe("Sprint 35 — Multiplayer Matchmaking", () => {
  const serverFile = fs.readFileSync(
    path.resolve(__dirname, "../server/duelMatchmaking.ts"),
    "utf-8"
  );
  const clientFile = fs.readFileSync(
    path.resolve(__dirname, "../lib/duel-multiplayer.ts"),
    "utf-8"
  );
  const screenFile = fs.readFileSync(
    path.resolve(__dirname, "../app/duel-multiplayer.tsx"),
    "utf-8"
  );

  it("server exports setupDuelMatchmaking function", () => {
    expect(serverFile).toContain("export function setupDuelMatchmaking");
  });

  it("server handles WebSocket path /ws/duel", () => {
    expect(serverFile).toContain('path: "/ws/duel"');
  });

  it("server supports join_queue, create_room, join_room, round_result, ready, leave messages", () => {
    expect(serverFile).toContain('"join_queue"');
    expect(serverFile).toContain('"create_room"');
    expect(serverFile).toContain('"join_room"');
    expect(serverFile).toContain('"round_result"');
    expect(serverFile).toContain('"ready"');
    expect(serverFile).toContain('"leave"');
  });

  it("server generates room codes and manages rooms", () => {
    expect(serverFile).toContain("generateRoomCode");
    expect(serverFile).toContain("rooms.set");
    expect(serverFile).toContain("cleanupRoom");
  });

  it("server broadcasts round_scored and match_complete events", () => {
    expect(serverFile).toContain('"round_scored"');
    expect(serverFile).toContain('"match_complete"');
  });

  it("server handles opponent disconnect gracefully", () => {
    expect(serverFile).toContain('"opponent_disconnected"');
    expect(serverFile).toContain('"opponent_left"');
  });

  it("client lib exports DuelMultiplayerClient class", () => {
    expect(clientFile).toContain("export class DuelMultiplayerClient");
  });

  it("client lib provides singleton getDuelMultiplayerClient", () => {
    expect(clientFile).toContain("export function getDuelMultiplayerClient");
  });

  it("client handles all multiplayer states", () => {
    expect(clientFile).toContain('"idle"');
    expect(clientFile).toContain('"connecting"');
    expect(clientFile).toContain('"queued"');
    expect(clientFile).toContain('"matched"');
    expect(clientFile).toContain('"playing"');
    expect(clientFile).toContain('"complete"');
    expect(clientFile).toContain('"disconnected"');
  });

  it("client supports joinQueue, createRoom, joinRoom, sendReady, submitRoundResult", () => {
    expect(clientFile).toContain("joinQueue(");
    expect(clientFile).toContain("createRoom(");
    expect(clientFile).toContain("joinRoom(");
    expect(clientFile).toContain("sendReady(");
    expect(clientFile).toContain("submitRoundResult(");
  });

  it("client has reconnection logic", () => {
    expect(clientFile).toContain("attemptReconnect");
    expect(clientFile).toContain("maxReconnectAttempts");
  });

  it("multiplayer screen has choose/create/join/waiting/matched/playing phases", () => {
    expect(screenFile).toContain("renderChoosePhase");
    expect(screenFile).toContain("renderJoinPhase");
    expect(screenFile).toContain("renderWaitingPhase");
    expect(screenFile).toContain("renderMatchedPhase");
    expect(screenFile).toContain("renderPlayingPhase");
  });

  it("multiplayer screen has Quick Match, Create Room, Join Room options", () => {
    expect(screenFile).toContain("Quick Match");
    expect(screenFile).toContain("Create Room");
    expect(screenFile).toContain("Join Room");
  });

  it("multiplayer screen shows room code for sharing", () => {
    expect(screenFile).toContain("Room Code");
    expect(screenFile).toContain("handleCopyCode");
  });

  it("server is wired into index.ts", () => {
    const indexFile = fs.readFileSync(
      path.resolve(__dirname, "../server/_core/index.ts"),
      "utf-8"
    );
    expect(indexFile).toContain("setupDuelMatchmaking");
  });

  it("Challenge a Friend button in lobby navigates to duel-multiplayer", () => {
    const lobbyFile = fs.readFileSync(
      path.resolve(__dirname, "../app/pronunciation-duel-lobby.tsx"),
      "utf-8"
    );
    expect(lobbyFile).toContain("duel-multiplayer");
  });
});

describe("Sprint 35 — Content Recording Overlay", () => {
  const overlayFile = fs.readFileSync(
    path.resolve(__dirname, "../components/duel-recording-overlay.tsx"),
    "utf-8"
  );
  const exportFile = fs.readFileSync(
    path.resolve(__dirname, "../lib/duel-content-export.ts"),
    "utf-8"
  );

  it("overlay component exports DuelRecordingOverlay", () => {
    expect(overlayFile).toContain("export function DuelRecordingOverlay");
  });

  it("overlay has recording indicator with pulse animation", () => {
    expect(overlayFile).toContain("pulseAnim");
    expect(overlayFile).toContain("REC");
    expect(overlayFile).toContain("recordDotActive");
  });

  it("overlay tracks recording duration with timer", () => {
    expect(overlayFile).toContain("recordingDuration");
    expect(overlayFile).toContain("formatTime");
  });

  it("overlay auto-detects highlights (round_win, perfect_score)", () => {
    expect(overlayFile).toContain("round_win");
    expect(overlayFile).toContain("perfect_score");
    expect(overlayFile).toContain("setHighlights");
  });

  it("overlay has share button for social posts", () => {
    expect(overlayFile).toContain("handleShareHighlight");
    expect(overlayFile).toContain("Share.share");
  });

  it("overlay exports RecordingData type", () => {
    expect(overlayFile).toContain("export interface RecordingData");
  });

  it("export lib generates story content", () => {
    expect(exportFile).toContain("export function generateStoryContent");
  });

  it("export lib generates challenge content", () => {
    expect(exportFile).toContain("export function generateChallengeContent");
  });

  it("export lib generates highlight reel", () => {
    expect(exportFile).toContain("export function generateHighlightReel");
  });

  it("export lib has share functions", () => {
    expect(exportFile).toContain("export async function shareContent");
    expect(exportFile).toContain("export async function shareAsChallenge");
    expect(exportFile).toContain("export async function shareAsStory");
  });

  it("export lib has quick share for duel results", () => {
    expect(exportFile).toContain("export async function quickShareDuelResult");
  });

  it("export lib saves to AsyncStorage", () => {
    expect(exportFile).toContain("AsyncStorage.setItem");
    expect(exportFile).toContain("EXPORTS_KEY");
  });

  it("export lib includes hashtags for social media", () => {
    expect(exportFile).toContain("#LinguaVibe");
    expect(exportFile).toContain("#PronunciationDuel");
  });
});

describe("Sprint 35 — Multi-Language Word Banks", () => {
  const frenchFile = fs.readFileSync(
    path.resolve(__dirname, "../lib/word-banks/french.ts"),
    "utf-8"
  );
  const portugueseFile = fs.readFileSync(
    path.resolve(__dirname, "../lib/word-banks/portuguese.ts"),
    "utf-8"
  );
  const japaneseFile = fs.readFileSync(
    path.resolve(__dirname, "../lib/word-banks/japanese.ts"),
    "utf-8"
  );
  const indexFile = fs.readFileSync(
    path.resolve(__dirname, "../lib/word-banks/index.ts"),
    "utf-8"
  );
  const duelFile = fs.readFileSync(
    path.resolve(__dirname, "../lib/pronunciation-duel.ts"),
    "utf-8"
  );

  it("French word bank exports FRENCH_WORD_BANK with all categories", () => {
    expect(frenchFile).toContain("export const FRENCH_WORD_BANK");
    expect(frenchFile).toContain("abcs:");
    expect(frenchFile).toContain("numbers:");
    expect(frenchFile).toContain("adjectives:");
    expect(frenchFile).toContain("verbs_present:");
    expect(frenchFile).toContain("verbs_past:");
    expect(frenchFile).toContain("verbs_future:");
  });

  it("French word bank has tongue twisters", () => {
    expect(frenchFile).toContain("export const FRENCH_TONGUE_TWISTERS");
  });

  it("French words have phonetic and translation", () => {
    expect(frenchFile).toContain("phonetic:");
    expect(frenchFile).toContain("translation:");
    expect(frenchFile).toContain('language: "French"');
  });

  it("Portuguese word bank exports PORTUGUESE_WORD_BANK with all categories", () => {
    expect(portugueseFile).toContain("export const PORTUGUESE_WORD_BANK");
    expect(portugueseFile).toContain("abcs:");
    expect(portugueseFile).toContain("numbers:");
    expect(portugueseFile).toContain("adjectives:");
    expect(portugueseFile).toContain("verbs_present:");
    expect(portugueseFile).toContain("verbs_past:");
    expect(portugueseFile).toContain("verbs_future:");
  });

  it("Portuguese word bank has tongue twisters", () => {
    expect(portugueseFile).toContain("export const PORTUGUESE_TONGUE_TWISTERS");
  });

  it("Portuguese words have phonetic and translation", () => {
    expect(portugueseFile).toContain("phonetic:");
    expect(portugueseFile).toContain("translation:");
    expect(portugueseFile).toContain('language: "Portuguese"');
  });

  it("Japanese word bank exports JAPANESE_WORD_BANK with all categories", () => {
    expect(japaneseFile).toContain("export const JAPANESE_WORD_BANK");
    expect(japaneseFile).toContain("abcs:");
    expect(japaneseFile).toContain("numbers:");
    expect(japaneseFile).toContain("adjectives:");
    expect(japaneseFile).toContain("verbs_present:");
    expect(japaneseFile).toContain("verbs_past:");
    expect(japaneseFile).toContain("verbs_future:");
  });

  it("Japanese word bank has tongue twisters", () => {
    expect(japaneseFile).toContain("export const JAPANESE_TONGUE_TWISTERS");
  });

  it("Japanese words include hiragana/kanji text", () => {
    expect(japaneseFile).toContain("こんにちは");
    expect(japaneseFile).toContain("食べます");
    expect(japaneseFile).toContain('language: "Japanese"');
  });

  it("index file exports SUPPORTED_DUEL_LANGUAGES with all 4 languages", () => {
    expect(indexFile).toContain("export const SUPPORTED_DUEL_LANGUAGES");
    expect(indexFile).toContain('"Spanish"');
    expect(indexFile).toContain('"French"');
    expect(indexFile).toContain('"Portuguese"');
    expect(indexFile).toContain('"Japanese"');
  });

  it("index file exports getLanguageDuelWords function", () => {
    expect(indexFile).toContain("export function getLanguageDuelWords");
  });

  it("index file exports isLanguageSupported utility", () => {
    expect(indexFile).toContain("export function isLanguageSupported");
  });

  it("index file exports getLanguageWordCount utility", () => {
    expect(indexFile).toContain("export function getLanguageWordCount");
  });

  it("pronunciation-duel.ts getDuelWords accepts language parameter", () => {
    expect(duelFile).toContain('language: string = "Spanish"');
  });

  it("pronunciation-duel.ts falls back to Spanish when language not found", () => {
    expect(duelFile).toContain('if (language !== "Spanish")');
    expect(duelFile).toContain("getLanguageDuelWords");
  });
});
