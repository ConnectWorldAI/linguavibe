import { describe, it, expect, beforeEach } from "vitest";
import * as fs from "fs";
import * as path from "path";

describe("Sprint 36 — Language Picker, Voice Streaming, Duel Leaderboard", () => {
  // ─── Feature 1: Language Picker in Duel Lobby ─────────────────────────────

  describe("Language Picker in Duel Lobby", () => {
    const lobbyPath = path.join(__dirname, "../app/pronunciation-duel-lobby.tsx");
    let lobbyContent: string;

    beforeEach(() => {
      lobbyContent = fs.readFileSync(lobbyPath, "utf-8");
    });

    it("imports SUPPORTED_DUEL_LANGUAGES from word-banks", () => {
      expect(lobbyContent).toContain("SUPPORTED_DUEL_LANGUAGES");
      expect(lobbyContent).toContain("from \"@/lib/word-banks\"");
    });

    it("imports DuelLanguage type", () => {
      expect(lobbyContent).toContain("DuelLanguage");
    });

    it("imports getLanguageWordCount", () => {
      expect(lobbyContent).toContain("getLanguageWordCount");
    });

    it("has selectedLanguage state", () => {
      expect(lobbyContent).toContain("selectedLanguage");
      expect(lobbyContent).toContain("setSelectedLanguage");
    });

    it("renders language selection section", () => {
      expect(lobbyContent).toContain("Language");
      expect(lobbyContent).toContain("languageChip");
      expect(lobbyContent).toContain("languageFlag");
    });

    it("passes language param to duel screen", () => {
      expect(lobbyContent).toContain("language: selectedLanguage");
    });

    it("shows word count for each language", () => {
      expect(lobbyContent).toContain("words");
      expect(lobbyContent).toContain("wordCount");
    });

    it("has language chip styles", () => {
      expect(lobbyContent).toContain("languageScroll");
      expect(lobbyContent).toContain("languageName");
      expect(lobbyContent).toContain("languageWordCount");
    });
  });

  // ─── Feature 2: Real-Time Voice Streaming ─────────────────────────────────

  describe("Voice Streaming - Server", () => {
    const serverPath = path.join(__dirname, "../server/duelMatchmaking.ts");
    let serverContent: string;

    beforeEach(() => {
      serverContent = fs.readFileSync(serverPath, "utf-8");
    });

    it("supports voice_audio message type in protocol", () => {
      expect(serverContent).toContain("\"voice_audio\"");
    });

    it("has audioChunk field in ClientMessage", () => {
      expect(serverContent).toContain("audioChunk");
    });

    it("has speaking field in ClientMessage", () => {
      expect(serverContent).toContain("speaking");
    });

    it("has handleVoiceAudio function", () => {
      expect(serverContent).toContain("handleVoiceAudio");
    });

    it("relays audio to opponent", () => {
      expect(serverContent).toContain("sendTo(opponent");
      expect(serverContent).toContain("type: \"voice_audio\"");
    });

    it("handles voice_audio case in switch", () => {
      expect(serverContent).toContain("case \"voice_audio\":");
    });
  });

  describe("Voice Streaming - Client Library", () => {
    const clientPath = path.join(__dirname, "../lib/duel-multiplayer.ts");
    let clientContent: string;

    beforeEach(() => {
      clientContent = fs.readFileSync(clientPath, "utf-8");
    });

    it("has sendVoiceAudio method", () => {
      expect(clientContent).toContain("sendVoiceAudio");
    });

    it("has sendSpeakingState method", () => {
      expect(clientContent).toContain("sendSpeakingState");
    });

    it("handles voice_audio event from server", () => {
      expect(clientContent).toContain("case \"voice_audio\":");
    });

    it("emits voice_audio event with player info", () => {
      expect(clientContent).toContain("type: \"voice_audio\"");
      expect(clientContent).toContain("playerName: data.playerName");
    });
  });

  describe("Voice Streaming - Multiplayer Screen", () => {
    const screenPath = path.join(__dirname, "../app/duel-multiplayer.tsx");
    let screenContent: string;

    beforeEach(() => {
      screenContent = fs.readFileSync(screenPath, "utf-8");
    });

    it("accepts language param", () => {
      expect(screenContent).toContain("language?: string");
    });

    it("has opponentSpeaking state", () => {
      expect(screenContent).toContain("opponentSpeaking");
      expect(screenContent).toContain("setOpponentSpeaking");
    });

    it("has isSpeaking state", () => {
      expect(screenContent).toContain("isSpeaking");
      expect(screenContent).toContain("setIsSpeaking");
    });

    it("subscribes to voice_audio events", () => {
      expect(screenContent).toContain("voice_audio");
      expect(screenContent).toContain("unsubVoice");
    });

    it("has voice indicator UI elements", () => {
      expect(screenContent).toContain("voiceIndicatorRow");
      expect(screenContent).toContain("voiceCircle");
      expect(screenContent).toContain("voiceLabel");
    });

    it("has speaking/listening status text", () => {
      expect(screenContent).toContain("Speaking");
      expect(screenContent).toContain("Listening");
    });

    it("has record button with start/stop", () => {
      expect(screenContent).toContain("handleStartSpeaking");
      expect(screenContent).toContain("handleStopSpeaking");
      expect(screenContent).toContain("recordBtn");
    });

    it("shows LIVE indicator", () => {
      expect(screenContent).toContain("LIVE");
      expect(screenContent).toContain("voiceLive");
    });

    it("passes language to createRoom", () => {
      expect(screenContent).toContain("language: params.language");
    });
  });

  // ─── Feature 3: Duel Leaderboard by Language ──────────────────────────────

  describe("Duel Leaderboard by Language Screen", () => {
    const leaderboardPath = path.join(__dirname, "../app/duel-leaderboard-language.tsx");
    let leaderboardContent: string;

    beforeEach(() => {
      leaderboardContent = fs.readFileSync(leaderboardPath, "utf-8");
    });

    it("file exists", () => {
      expect(fs.existsSync(leaderboardPath)).toBe(true);
    });

    it("imports SUPPORTED_DUEL_LANGUAGES", () => {
      expect(leaderboardContent).toContain("SUPPORTED_DUEL_LANGUAGES");
    });

    it("has language selection tabs", () => {
      expect(leaderboardContent).toContain("languageTabs");
      expect(leaderboardContent).toContain("languageTab");
      expect(leaderboardContent).toContain("selectedLanguage");
    });

    it("has podium rendering for top 3", () => {
      expect(leaderboardContent).toContain("renderPodium");
      expect(leaderboardContent).toContain("podiumContainer");
      expect(leaderboardContent).toContain("podiumBar");
    });

    it("has user rank banner", () => {
      expect(leaderboardContent).toContain("userBanner");
      expect(leaderboardContent).toContain("userRank");
      expect(leaderboardContent).toContain("Your Rank");
    });

    it("has rank rows with stats", () => {
      expect(leaderboardContent).toContain("rankRow");
      expect(leaderboardContent).toContain("rankScore");
      expect(leaderboardContent).toContain("rankChange");
    });

    it("shows win rate and streak in rank stats", () => {
      expect(leaderboardContent).toContain("winRate");
      expect(leaderboardContent).toContain("bestStreak");
    });

    it("has rank change indicators (up/down)", () => {
      expect(leaderboardContent).toContain("arrow-up");
      expect(leaderboardContent).toContain("arrow-down");
    });

    it("uses AsyncStorage for persistence", () => {
      expect(leaderboardContent).toContain("AsyncStorage");
      expect(leaderboardContent).toContain("@duel_leaderboard_language");
    });

    it("has FlatList for rankings", () => {
      expect(leaderboardContent).toContain("FlatList");
    });

    it("has empty state for no rankings", () => {
      expect(leaderboardContent).toContain("No rankings yet");
      expect(leaderboardContent).toContain("Play duels to earn your spot");
    });

    it("has link to play duels from header", () => {
      expect(leaderboardContent).toContain("pronunciation-duel-lobby");
      expect(leaderboardContent).toContain("game-controller");
    });

    it("has sample data for all 4 languages", () => {
      expect(leaderboardContent).toContain("Spanish:");
      expect(leaderboardContent).toContain("French:");
      expect(leaderboardContent).toContain("Portuguese:");
      expect(leaderboardContent).toContain("Japanese:");
    });
  });

  // ─── Integration: Lobby links to Leaderboard ──────────────────────────────

  describe("Lobby → Leaderboard Navigation", () => {
    it("lobby trophy button navigates to duel-leaderboard-language", () => {
      const lobbyContent = fs.readFileSync(
        path.join(__dirname, "../app/pronunciation-duel-lobby.tsx"),
        "utf-8"
      );
      expect(lobbyContent).toContain("duel-leaderboard-language");
    });
  });
});
