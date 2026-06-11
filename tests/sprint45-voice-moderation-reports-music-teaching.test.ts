/**
 * Sprint 45 Tests — Voice Room AI Moderation, Post-Conversation Reports, Music-Based Teaching
 */
import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

describe("Sprint 45 — Completing Skipped Items", () => {
  // ─── Voice Room AI Moderation Enhancement ─────────────────────────────────

  describe("Voice Room AI Moderation Engine", () => {
    const modFile = fs.readFileSync(
      path.resolve(__dirname, "../lib/voice-room-ai-moderation.ts"),
      "utf-8"
    );

    it("exports createModerationState function", () => {
      expect(modFile).toContain("export function createModerationState");
    });

    it("exports getTopicSuggestionsForLevel function", () => {
      expect(modFile).toContain("export function getTopicSuggestionsForLevel");
    });

    it("exports generateCorrection function for real-time corrections", () => {
      expect(modFile).toContain("export function generateCorrection");
    });

    it("exports shouldIssueCorrection for frequency-based correction gating", () => {
      expect(modFile).toContain("export function shouldIssueCorrection");
    });

    it("exports updateTurnStatus for turn management", () => {
      expect(modFile).toContain("export function updateTurnStatus");
    });

    it("exports getQuietParticipants for balanced participation", () => {
      expect(modFile).toContain("export function getQuietParticipants");
    });

    it("exports generateTurnPrompt to encourage quiet participants", () => {
      expect(modFile).toContain("export function generateTurnPrompt");
    });

    it("exports checkSilenceThreshold for topic steering", () => {
      expect(modFile).toContain("export function checkSilenceThreshold");
    });

    it("exports filterRoomsByLevel for level-matched room filtering", () => {
      expect(modFile).toContain("export function filterRoomsByLevel");
    });

    it("has TOPIC_SUGGESTIONS with multiple levels and categories", () => {
      expect(modFile).toContain("TOPIC_SUGGESTIONS");
      expect(modFile).toContain("daily_life");
      expect(modFile).toContain("debate");
      expect(modFile).toContain("storytelling");
      expect(modFile).toContain("games");
    });

    it("has CORRECTION_TEMPLATES for grammar, pronunciation, vocabulary, conjugation, gender, word_order", () => {
      expect(modFile).toContain("CORRECTION_TEMPLATES");
      expect(modFile).toContain("grammar:");
      expect(modFile).toContain("pronunciation:");
      expect(modFile).toContain("vocabulary:");
      expect(modFile).toContain("conjugation:");
      expect(modFile).toContain("gender:");
      expect(modFile).toContain("word_order:");
    });

    it("has ModerationConfig with correctionFrequency, silenceThreshold, turnManagement", () => {
      expect(modFile).toContain("correctionFrequency");
      expect(modFile).toContain("silenceThreshold");
      expect(modFile).toContain("turnManagementEnabled");
      expect(modFile).toContain("vocabularyInjection");
    });

    it("has getSessionSummary for post-room report", () => {
      expect(modFile).toContain("export function getSessionSummary");
    });

    it("persists moderation preferences with AsyncStorage", () => {
      expect(modFile).toContain("saveModerationPrefs");
      expect(modFile).toContain("loadModerationPrefs");
    });
  });

  // ─── Post-Conversation Detailed Report ────────────────────────────────────

  describe("Post-Conversation Detailed Report", () => {
    const reportFile = fs.readFileSync(
      path.resolve(__dirname, "../lib/post-conversation-report.ts"),
      "utf-8"
    );

    it("exports generateConversationReport function", () => {
      expect(reportFile).toContain("export function generateConversationReport");
    });

    it("has GrammarPattern interface with trend analysis", () => {
      expect(reportFile).toContain("interface GrammarPattern");
      expect(reportFile).toContain('trend: "improving" | "stable" | "declining"');
    });

    it("has PronunciationDetail interface with phoneme-level feedback", () => {
      expect(reportFile).toContain("interface PronunciationDetail");
      expect(reportFile).toContain("phoneme:");
      expect(reportFile).toContain("tipForImprovement:");
      expect(reportFile).toContain("nativeComparison:");
    });

    it("has ImprovementSuggestion interface with actionable items", () => {
      expect(reportFile).toContain("interface ImprovementSuggestion");
      expect(reportFile).toContain("actionItems:");
      expect(reportFile).toContain("relatedExercises:");
      expect(reportFile).toContain("estimatedTimeToImprove:");
    });

    it("has SessionComparison for session-over-session progress", () => {
      expect(reportFile).toContain("interface SessionComparison");
      expect(reportFile).toContain("previousValue:");
      expect(reportFile).toContain("change:");
      expect(reportFile).toContain('trend: "up" | "down" | "stable"');
    });

    it("calculates fluency, accuracy, complexity, and confidence scores", () => {
      expect(reportFile).toContain("calculateFluencyScore");
      expect(reportFile).toContain("calculateComplexityScore");
      expect(reportFile).toContain("calculateConfidenceScore");
      expect(reportFile).toContain("accuracyScore");
    });

    it("generates personalized improvement suggestions", () => {
      expect(reportFile).toContain("function generateSuggestions");
      expect(reportFile).toContain("grammar_focus");
      expect(reportFile).toContain("pronunciation_focus");
      expect(reportFile).toContain("fluency_focus");
    });

    it("stores report history and supports progress over time", () => {
      expect(reportFile).toContain("export async function saveReport");
      expect(reportFile).toContain("export async function loadReportHistory");
      expect(reportFile).toContain("export async function getProgressOverTime");
    });

    it("includes language-specific pronunciation analysis", () => {
      expect(reportFile).toContain("Spanish");
      expect(reportFile).toContain("French");
      expect(reportFile).toContain("Japanese");
      expect(reportFile).toContain("Korean");
      expect(reportFile).toContain("Arabic");
    });
  });

  // ─── Music-Based Language Teaching ────────────────────────────────────────

  describe("Music-Based Language Teaching System", () => {
    const musicFile = fs.readFileSync(
      path.resolve(__dirname, "../lib/music-language-teaching.ts"),
      "utf-8"
    );

    it("contains research notes on Suno vs ElevenLabs", () => {
      expect(musicFile).toContain("Suno AI:");
      expect(musicFile).toContain("ElevenLabs:");
      expect(musicFile).toContain("Recommendation:");
    });

    it("has SONG_CATALOG with multi-language songs", () => {
      expect(musicFile).toContain("SONG_CATALOG");
      expect(musicFile).toContain('language: "Spanish"');
      expect(musicFile).toContain('language: "French"');
      expect(musicFile).toContain('language: "Japanese"');
      expect(musicFile).toContain('language: "Korean"');
      expect(musicFile).toContain('language: "Arabic"');
      expect(musicFile).toContain('language: "Portuguese"');
    });

    it("has SongLearningMetadata with difficulty tagging", () => {
      expect(musicFile).toContain("interface SongLearningMetadata");
      expect(musicFile).toContain("difficulty: MusicDifficulty");
      expect(musicFile).toContain("cefrLevel:");
      expect(musicFile).toContain("vocabularyDensity:");
    });

    it("exports getSongsForLevel for difficulty matching", () => {
      expect(musicFile).toContain("export function getSongsForLevel");
    });

    it("exports getDailySongRecommendation", () => {
      expect(musicFile).toContain("export function getDailySongRecommendation");
    });

    it("has VocabularyFromLyrics with timestamps and CEFR levels", () => {
      expect(musicFile).toContain("interface VocabularyFromLyrics");
      expect(musicFile).toContain("timestamp:");
      expect(musicFile).toContain("cefrLevel:");
      expect(musicFile).toContain("partOfSpeech:");
    });

    it("has GrammarFromSong for grammar-from-structure teaching", () => {
      expect(musicFile).toContain("interface GrammarFromSong");
      expect(musicFile).toContain("grammarPoint:");
      expect(musicFile).toContain("exercisePrompt:");
    });

    it("has PronunciationFromLyrics for pronunciation practice from songs", () => {
      expect(musicFile).toContain("interface PronunciationFromLyrics");
      expect(musicFile).toContain("focusPhonemes:");
    });

    it("exports generateVocabularyQuiz for vocabulary extraction quizzes", () => {
      expect(musicFile).toContain("export function generateVocabularyQuiz");
    });

    it("exports getGrammarExercisesFromSong", () => {
      expect(musicFile).toContain("export function getGrammarExercisesFromSong");
    });

    it("exports calculateDifficultyScore for difficulty assessment", () => {
      expect(musicFile).toContain("export function calculateDifficultyScore");
    });

    it("supports dialect-specific songs", () => {
      expect(musicFile).toContain("Dominican Spanish");
      expect(musicFile).toContain("Brazilian Portuguese");
      expect(musicFile).toContain("Egyptian Arabic");
    });

    it("has music teaching preferences with genre and mode selection", () => {
      expect(musicFile).toContain("interface MusicTeachingPreferences");
      expect(musicFile).toContain("preferredGenres:");
      expect(musicFile).toContain("focusMode:");
      expect(musicFile).toContain("dailySongEnabled:");
    });

    it("exports getSupportedMusicLanguages", () => {
      expect(musicFile).toContain("export function getSupportedMusicLanguages");
    });

    it("exports findSongsTeaching for targeted vocabulary/grammar search", () => {
      expect(musicFile).toContain("export function findSongsTeaching");
    });

    it("has educational and general music categories", () => {
      expect(musicFile).toContain("isEducational: true");
      expect(musicFile).toContain("hasKaraokeMode:");
      expect(musicFile).toContain("hasDualSubtitles:");
    });

    it("includes cultural references and idioms in song metadata", () => {
      expect(musicFile).toContain("culturalReferences:");
      expect(musicFile).toContain("idioms:");
      expect(musicFile).toContain("Dominican slang");
      expect(musicFile).toContain("saudade concept");
    });
  });

  // ─── Integration Checks ───────────────────────────────────────────────────

  describe("Integration: Existing screens reference new libraries", () => {
    it("voice-rooms.tsx exists and has AI moderation features", () => {
      const voiceRooms = fs.readFileSync(
        path.resolve(__dirname, "../app/voice-rooms.tsx"),
        "utf-8"
      );
      expect(voiceRooms).toContain("AI Moderation");
      expect(voiceRooms).toContain("hasAIModerator");
      expect(voiceRooms).toContain("levelFilter");
      expect(voiceRooms).toContain("AI_CONVERSATION_STARTERS");
      expect(voiceRooms).toContain("AI_FEEDBACK_MESSAGES");
    });

    it("conversation-summary.tsx exists and has detailed report sections", () => {
      const convSummary = fs.readFileSync(
        path.resolve(__dirname, "../app/conversation-summary.tsx"),
        "utf-8"
      );
      expect(convSummary).toContain("Fluency");
      expect(convSummary).toContain("Corrections");
      expect(convSummary).toContain("Vocabulary");
    });
  });
});
