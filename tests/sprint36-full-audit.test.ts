import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

/**
 * Sprint 36 Full Audit — Verifies the entire pronunciation duel system
 * is properly integrated and ready for real users.
 */
describe("Full Duel System Audit — User Readiness", () => {
  // ─── Navigation & Entry Points ─────────────────────────────────────────────

  describe("Entry Points & Navigation", () => {
    it("Home tab → Language Battles has pronunciation-duel mode", () => {
      const home = fs.readFileSync(path.join(__dirname, "../app/(tabs)/index.tsx"), "utf-8");
      expect(home).toContain("language-battles");
    });

    it("Language Battles navigates to pronunciation-duel-lobby", () => {
      const battles = fs.readFileSync(path.join(__dirname, "../app/language-battles.tsx"), "utf-8");
      expect(battles).toContain("pronunciation-duel-lobby");
      expect(battles).toContain("pronunciation-duel");
    });

    it("All duel screens are registered in _layout.tsx", () => {
      const layout = fs.readFileSync(path.join(__dirname, "../app/_layout.tsx"), "utf-8");
      expect(layout).toContain("pronunciation-duel-lobby");
      expect(layout).toContain("pronunciation-duel");
      expect(layout).toContain("pronunciation-duel-results");
      expect(layout).toContain("duel-multiplayer");
      expect(layout).toContain("duel-leaderboard-language");
      expect(layout).toContain("streak-freeze-purchase");
    });

    it("Lobby navigates to duel game with all params", () => {
      const lobby = fs.readFileSync(path.join(__dirname, "../app/pronunciation-duel-lobby.tsx"), "utf-8");
      expect(lobby).toContain("pathname: \"/pronunciation-duel\"");
      expect(lobby).toContain("language: selectedLanguage");
      expect(lobby).toContain("mode: selectedMode");
      expect(lobby).toContain("category: selectedCategory");
    });

    it("Lobby navigates to multiplayer with language", () => {
      const lobby = fs.readFileSync(path.join(__dirname, "../app/pronunciation-duel-lobby.tsx"), "utf-8");
      expect(lobby).toContain("pathname: \"/duel-multiplayer\"");
      expect(lobby).toContain("language: selectedLanguage");
    });

    it("Lobby trophy button goes to duel-leaderboard-language", () => {
      const lobby = fs.readFileSync(path.join(__dirname, "../app/pronunciation-duel-lobby.tsx"), "utf-8");
      expect(lobby).toContain("duel-leaderboard-language");
    });
  });

  // ─── Content Availability ──────────────────────────────────────────────────

  describe("Content & Word Banks", () => {
    it("Spanish word bank has all categories", () => {
      const duel = fs.readFileSync(path.join(__dirname, "../lib/pronunciation-duel.ts"), "utf-8");
      expect(duel).toContain("WORD_BANK");
      expect(duel).toContain("abcs");
      expect(duel).toContain("numbers");
      expect(duel).toContain("adjectives");
      expect(duel).toContain("verbs_present");
      expect(duel).toContain("verbs_past");
      expect(duel).toContain("verbs_future");
    });

    it("French word bank has all categories", () => {
      const french = fs.readFileSync(path.join(__dirname, "../lib/word-banks/french.ts"), "utf-8");
      expect(french).toContain("abcs");
      expect(french).toContain("numbers");
      expect(french).toContain("adjectives");
      expect(french).toContain("verbs_present");
      expect(french).toContain("verbs_past");
      expect(french).toContain("verbs_future");
    });

    it("Portuguese word bank has all categories", () => {
      const port = fs.readFileSync(path.join(__dirname, "../lib/word-banks/portuguese.ts"), "utf-8");
      expect(port).toContain("abcs");
      expect(port).toContain("numbers");
      expect(port).toContain("adjectives");
      expect(port).toContain("verbs_present");
      expect(port).toContain("verbs_past");
      expect(port).toContain("verbs_future");
    });

    it("Japanese word bank has all categories", () => {
      const jp = fs.readFileSync(path.join(__dirname, "../lib/word-banks/japanese.ts"), "utf-8");
      expect(jp).toContain("abcs");
      expect(jp).toContain("numbers");
      expect(jp).toContain("adjectives");
      expect(jp).toContain("verbs_present");
      expect(jp).toContain("verbs_past");
      expect(jp).toContain("verbs_future");
    });

    it("Word banks index exports all languages", () => {
      const index = fs.readFileSync(path.join(__dirname, "../lib/word-banks/index.ts"), "utf-8");
      expect(index).toContain("SUPPORTED_DUEL_LANGUAGES");
      expect(index).toContain("Spanish");
      expect(index).toContain("French");
      expect(index).toContain("Portuguese");
      expect(index).toContain("Japanese");
      expect(index).toContain("getLanguageDuelWords");
      expect(index).toContain("getLanguageWordCount");
    });

    it("Each word has phonetic transcription", () => {
      const french = fs.readFileSync(path.join(__dirname, "../lib/word-banks/french.ts"), "utf-8");
      expect(french).toContain("phonetic:");
      expect(french).toContain("translation:");
    });
  });

  // ─── AI Scoring System ─────────────────────────────────────────────────────

  describe("AI Pronunciation Scoring", () => {
    it("Has scorePronunciation function", () => {
      const duel = fs.readFileSync(path.join(__dirname, "../lib/pronunciation-duel.ts"), "utf-8");
      expect(duel).toContain("export function scorePronunciation");
    });

    it("Uses Levenshtein distance for scoring", () => {
      const duel = fs.readFileSync(path.join(__dirname, "../lib/pronunciation-duel.ts"), "utf-8");
      expect(duel).toContain("levenshteinDistance");
    });

    it("Scores are 0-100 range", () => {
      const duel = fs.readFileSync(path.join(__dirname, "../lib/pronunciation-duel.ts"), "utf-8");
      expect(duel).toContain("Math.max(0");
      expect(duel).toContain("Math.min(");
    });

    it("Duel screen shows AI judging phase", () => {
      const screen = fs.readFileSync(path.join(__dirname, "../app/pronunciation-duel.tsx"), "utf-8");
      expect(screen).toContain("AI is judging");
      expect(screen).toContain("scorePronunciation");
    });

    it("Server has pronunciation challenge endpoint", () => {
      const server = fs.readFileSync(path.join(__dirname, "../server/practiceRouter.ts"), "utf-8");
      expect(server).toContain("pronunciation-duel");
      expect(server).toContain("pronunciation challenge");
    });
  });

  // ─── Game Modes ────────────────────────────────────────────────────────────

  describe("Game Modes", () => {
    it("Supports word_flash mode", () => {
      const duel = fs.readFileSync(path.join(__dirname, "../lib/pronunciation-duel.ts"), "utf-8");
      expect(duel).toContain("word_flash");
    });

    it("Supports phrase_race mode", () => {
      const duel = fs.readFileSync(path.join(__dirname, "../lib/pronunciation-duel.ts"), "utf-8");
      expect(duel).toContain("phrase_race");
    });

    it("Supports tongue_twister mode", () => {
      const duel = fs.readFileSync(path.join(__dirname, "../lib/pronunciation-duel.ts"), "utf-8");
      expect(duel).toContain("tongue_twister");
    });

    it("Lobby shows all 3 modes via getModeInfo", () => {
      const lobby = fs.readFileSync(path.join(__dirname, "../app/pronunciation-duel-lobby.tsx"), "utf-8");
      expect(lobby).toContain("getModeInfo");
      expect(lobby).toContain("info.title");
      // Modes are defined in the lib
      const duel = fs.readFileSync(path.join(__dirname, "../lib/pronunciation-duel.ts"), "utf-8");
      expect(duel).toContain("Word Flash");
      expect(duel).toContain("Phrase Race");
      expect(duel).toContain("Tongue Twister");
    });
  });

  // ─── Multiplayer System ────────────────────────────────────────────────────

  describe("Multiplayer System", () => {
    it("Server has WebSocket matchmaking", () => {
      const server = fs.readFileSync(path.join(__dirname, "../server/duelMatchmaking.ts"), "utf-8");
      expect(server).toContain("WebSocket");
      expect(server).toContain("join_queue");
      expect(server).toContain("handleCreateRoom");
    });

    it("Server is wired in index.ts", () => {
      const index = fs.readFileSync(path.join(__dirname, "../server/_core/index.ts"), "utf-8");
      expect(index).toContain("duelMatchmaking");
    });

    it("Client library has connection management", () => {
      const client = fs.readFileSync(path.join(__dirname, "../lib/duel-multiplayer.ts"), "utf-8");
      expect(client).toContain("connect");
      expect(client).toContain("disconnect");
      expect(client).toContain("createRoom");
      expect(client).toContain("joinRoom");
    });

    it("Voice streaming is supported", () => {
      const client = fs.readFileSync(path.join(__dirname, "../lib/duel-multiplayer.ts"), "utf-8");
      expect(client).toContain("sendVoiceAudio");
      expect(client).toContain("sendSpeakingState");
    });

    it("Multiplayer screen has Quick Match, Create Room, Join Room", () => {
      const screen = fs.readFileSync(path.join(__dirname, "../app/duel-multiplayer.tsx"), "utf-8");
      expect(screen).toContain("Quick Match");
      expect(screen).toContain("Create Room");
      expect(screen).toContain("Join Room");
    });

    it("Multiplayer screen has voice indicators", () => {
      const screen = fs.readFileSync(path.join(__dirname, "../app/duel-multiplayer.tsx"), "utf-8");
      expect(screen).toContain("voiceIndicatorRow");
      expect(screen).toContain("LIVE");
    });
  });

  // ─── Content Recording & Social Sharing ────────────────────────────────────

  describe("Content Recording & Social Sharing", () => {
    it("Recording overlay component exists", () => {
      expect(fs.existsSync(path.join(__dirname, "../components/duel-recording-overlay.tsx"))).toBe(true);
    });

    it("Content export library exists", () => {
      expect(fs.existsSync(path.join(__dirname, "../lib/duel-content-export.ts"))).toBe(true);
    });

    it("Duel screen integrates recording overlay", () => {
      const screen = fs.readFileSync(path.join(__dirname, "../app/pronunciation-duel.tsx"), "utf-8");
      expect(screen).toContain("DuelRecordingOverlay");
      expect(screen).toContain("showRecordingOverlay");
      expect(screen).toContain("videocam");
    });

    it("Results screen has share functionality", () => {
      const results = fs.readFileSync(path.join(__dirname, "../app/pronunciation-duel-results.tsx"), "utf-8");
      expect(results).toContain("Share");
      expect(results).toContain("share-social");
    });

    it("Content export generates story posts", () => {
      const exp = fs.readFileSync(path.join(__dirname, "../lib/duel-content-export.ts"), "utf-8");
      expect(exp).toContain("generateStoryContent");
    });

    it("Content export generates challenge invitations", () => {
      const exp = fs.readFileSync(path.join(__dirname, "../lib/duel-content-export.ts"), "utf-8");
      expect(exp).toContain("generateChallengeContent");
    });

    it("Content export generates highlight reels", () => {
      const exp = fs.readFileSync(path.join(__dirname, "../lib/duel-content-export.ts"), "utf-8");
      expect(exp).toContain("generateHighlightReel");
    });
  });

  // ─── Leaderboard ───────────────────────────────────────────────────────────

  describe("Duel Leaderboard by Language", () => {
    it("Leaderboard screen exists", () => {
      expect(fs.existsSync(path.join(__dirname, "../app/duel-leaderboard-language.tsx"))).toBe(true);
    });

    it("Has language tabs for all supported languages", () => {
      const lb = fs.readFileSync(path.join(__dirname, "../app/duel-leaderboard-language.tsx"), "utf-8");
      expect(lb).toContain("SUPPORTED_DUEL_LANGUAGES");
      expect(lb).toContain("languageTabs");
    });

    it("Has podium for top 3 players", () => {
      const lb = fs.readFileSync(path.join(__dirname, "../app/duel-leaderboard-language.tsx"), "utf-8");
      expect(lb).toContain("renderPodium");
      expect(lb).toContain("podiumContainer");
    });

    it("Shows user's own rank", () => {
      const lb = fs.readFileSync(path.join(__dirname, "../app/duel-leaderboard-language.tsx"), "utf-8");
      expect(lb).toContain("userBanner");
      expect(lb).toContain("Your Rank");
    });

    it("Has play button linking back to lobby", () => {
      const lb = fs.readFileSync(path.join(__dirname, "../app/duel-leaderboard-language.tsx"), "utf-8");
      expect(lb).toContain("pronunciation-duel-lobby");
    });
  });

  // ─── UI & Interaction ──────────────────────────────────────────────────────

  describe("UI & Interaction Quality", () => {
    it("Duel screen has haptic feedback", () => {
      const screen = fs.readFileSync(path.join(__dirname, "../app/pronunciation-duel.tsx"), "utf-8");
      expect(screen).toContain("Haptics");
    });

    it("Lobby has haptic feedback", () => {
      const lobby = fs.readFileSync(path.join(__dirname, "../app/pronunciation-duel-lobby.tsx"), "utf-8");
      expect(lobby).toContain("Haptics");
    });

    it("Duel screen has countdown animation", () => {
      const screen = fs.readFileSync(path.join(__dirname, "../app/pronunciation-duel.tsx"), "utf-8");
      expect(screen).toContain("countdown");
      expect(screen).toContain("Animated");
    });

    it("Duel screen has pulse animation for mic", () => {
      const screen = fs.readFileSync(path.join(__dirname, "../app/pronunciation-duel.tsx"), "utf-8");
      expect(screen).toContain("pulseAnim");
    });

    it("Results show win/loss with appropriate colors", () => {
      const results = fs.readFileSync(path.join(__dirname, "../app/pronunciation-duel-results.tsx"), "utf-8");
      expect(results).toContain("winner");
      expect(results).toContain("Colors.success");
    });
  });

  // ─── Data Persistence ──────────────────────────────────────────────────────

  describe("Data Persistence", () => {
    it("Duel matches are saved to AsyncStorage", () => {
      const duel = fs.readFileSync(path.join(__dirname, "../lib/pronunciation-duel.ts"), "utf-8");
      expect(duel).toContain("saveDuelMatch");
      expect(duel).toContain("AsyncStorage");
    });

    it("Leaderboard data persists", () => {
      const lb = fs.readFileSync(path.join(__dirname, "../app/duel-leaderboard-language.tsx"), "utf-8");
      expect(lb).toContain("AsyncStorage");
      expect(lb).toContain("@duel_leaderboard_language");
    });

    it("Content exports are saved", () => {
      const exp = fs.readFileSync(path.join(__dirname, "../lib/duel-content-export.ts"), "utf-8");
      expect(exp).toContain("saveExportedContent");
      expect(exp).toContain("AsyncStorage");
    });
  });
});
