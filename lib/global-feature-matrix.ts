/**
 * Global Feature Allocation Matrix for ConnectWorld AI
 * 
 * CORE PRINCIPLE: Every region stays in the green (40%+ margin).
 * Cheaper regions get MORE of the low-cost features (voice memos, exercises,
 * pre-recorded lessons, AI TV content) and LESS of the expensive real-time
 * features (live AI conversations, real-time translation, video calls).
 * 
 * The user still "tastes" premium features — just with tighter caps.
 * The bulk of their experience is filled with content that costs us near-zero to deliver.
 * 
 * Cost Categories:
 * - ZERO COST: Pre-recorded content, cached lessons, downloaded videos, exercises, flashcards
 * - LOW COST: Voice memos from AI teacher ($0.002/memo), text-based AI responses ($0.001/msg)
 * - MEDIUM COST: AI conversation ($0.005/min), song translation ($0.01/song), TTS ($0.004/min)
 * - HIGH COST: Live translation ($0.012/min), video calls ($0.02/min), voice cloning ($0.50/clone)
 */

import { PricingRegion } from "./geo-pricing";

// ─── FEATURE COST CLASSIFICATION ────────────────────────────────────────────

export type FeatureCostLevel = "zero" | "low" | "medium" | "high";

export interface FeatureDefinition {
  id: string;
  name: string;
  description: string;
  costLevel: FeatureCostLevel;
  costPerUse: number; // $ per use/minute/item
  costUnit: string;   // "per_minute" | "per_item" | "per_session" | "flat"
}

/**
 * All features classified by cost to serve
 */
export const FEATURE_CATALOG: FeatureDefinition[] = [
  // ─── ZERO COST (pre-made, cached, infinite delivery) ─────────────────────
  { id: "ai_tv_episodes", name: "ConnectWorld AI TV Episodes", description: "Pre-generated short films and teaching clips", costLevel: "zero", costPerUse: 0, costUnit: "per_item" },
  { id: "daily_lessons", name: "Daily Structured Lessons", description: "Pre-built curriculum modules (grammar, vocab, phrases)", costLevel: "zero", costPerUse: 0, costUnit: "per_item" },
  { id: "flashcards", name: "Flashcard Decks", description: "Vocabulary flashcards with spaced repetition", costLevel: "zero", costPerUse: 0, costUnit: "per_item" },
  { id: "exercises", name: "Grammar & Vocab Exercises", description: "Fill-in-blank, matching, multiple choice", costLevel: "zero", costPerUse: 0, costUnit: "per_item" },
  { id: "slang_library", name: "Slang Dictionary", description: "Browse slang by country/city/context", costLevel: "zero", costPerUse: 0, costUnit: "per_item" },
  { id: "pronunciation_guides", name: "Pronunciation Guides", description: "Pre-recorded audio clips with phonetic spelling (Omar-style)", costLevel: "zero", costPerUse: 0, costUnit: "per_item" },
  { id: "cultural_lessons", name: "Cultural Context Lessons", description: "Food, music, customs, etiquette by country", costLevel: "zero", costPerUse: 0, costUnit: "per_item" },
  { id: "reading_comprehension", name: "Reading Comprehension", description: "Articles, stories, dialogues with quizzes", costLevel: "zero", costPerUse: 0, costUnit: "per_item" },
  { id: "video_subtitles", name: "Video with Bilingual Subtitles", description: "Watch content with dual-language captions", costLevel: "zero", costPerUse: 0, costUnit: "per_item" },
  { id: "daily_challenges", name: "Daily Challenges & Streaks", description: "Gamified daily tasks and XP system", costLevel: "zero", costPerUse: 0, costUnit: "per_item" },
  { id: "community_forums", name: "Community Forums", description: "Text-based community discussions", costLevel: "zero", costPerUse: 0, costUnit: "per_item" },
  { id: "progress_tracking", name: "Progress Tracking", description: "XP, levels, streaks, time capsule recordings", costLevel: "zero", costPerUse: 0, costUnit: "per_item" },

  // ─── LOW COST (voice memos, text AI, basic TTS) ──────────────────────────
  { id: "teacher_voice_memos", name: "AI Teacher Voice Memos", description: "Pre-generated voice messages from AI teacher (corrections, tips, encouragement)", costLevel: "low", costPerUse: 0.002, costUnit: "per_item" },
  { id: "text_ai_chat", name: "Text Chat with AI Teacher", description: "Text-based conversation with AI (no voice)", costLevel: "low", costPerUse: 0.001, costUnit: "per_message" },
  { id: "pronunciation_scoring", name: "Pronunciation Scoring", description: "Record yourself, get a score (uses lightweight model)", costLevel: "low", costPerUse: 0.003, costUnit: "per_attempt" },
  { id: "writing_corrections", name: "Writing Corrections", description: "Submit text, get grammar/spelling corrections", costLevel: "low", costPerUse: 0.002, costUnit: "per_submission" },
  { id: "word_of_day_audio", name: "Word of the Day (Audio)", description: "Daily word with pronunciation audio", costLevel: "low", costPerUse: 0.001, costUnit: "per_item" },
  { id: "quiz_mode", name: "AI-Generated Quizzes", description: "Personalized quizzes based on progress", costLevel: "low", costPerUse: 0.002, costUnit: "per_quiz" },

  // ─── MEDIUM COST (AI conversations, song translation, TTS) ───────────────
  { id: "ai_voice_conversation", name: "AI Voice Conversation", description: "Real-time voice chat with AI teacher", costLevel: "medium", costPerUse: 0.005, costUnit: "per_minute" },
  { id: "song_translation", name: "Song Translation & Breakdown", description: "Translate and break down song lyrics word-by-word", costLevel: "medium", costPerUse: 0.01, costUnit: "per_song" },
  { id: "ai_teacher_tts", name: "AI Teacher Read-Aloud", description: "AI teacher reads passages with natural voice", costLevel: "medium", costPerUse: 0.004, costUnit: "per_minute" },
  { id: "roleplay_scenarios", name: "AI Roleplay Scenarios", description: "Practice ordering food, job interviews, etc.", costLevel: "medium", costPerUse: 0.005, costUnit: "per_minute" },
  { id: "url_translation", name: "URL/Article Translation", description: "Translate any webpage into target language", costLevel: "medium", costPerUse: 0.008, costUnit: "per_page" },

  // ─── HIGH COST (live translation, video, voice cloning) ──────────────────
  { id: "live_call_translation", name: "Live Call Translation", description: "Real-time phone call translation", costLevel: "high", costPerUse: 0.012, costUnit: "per_minute" },
  { id: "video_call_ai", name: "Video Call with AI Teacher", description: "Face-to-face video conversation with AI avatar", costLevel: "high", costPerUse: 0.02, costUnit: "per_minute" },
  { id: "voice_cloning", name: "Voice Cloning", description: "Clone your voice to hear yourself in another language", costLevel: "high", costPerUse: 0.50, costUnit: "per_clone" },
  { id: "live_video_dubbing", name: "Live Video Dubbing", description: "Real-time lip-sync translation of video content", costLevel: "high", costPerUse: 0.03, costUnit: "per_minute" },
  { id: "group_class_live", name: "Live Group Class", description: "Real-time group session with AI teacher", costLevel: "high", costPerUse: 0.015, costUnit: "per_minute" },
];

// ─── REGIONAL FEATURE ALLOCATION ────────────────────────────────────────────

/**
 * What each plan gets in each region.
 * Cheaper regions = MORE zero/low-cost features, FEWER high-cost features.
 * Everyone gets a TASTE of premium (small caps) to drive upgrades.
 */
export interface RegionalFeatureAllocation {
  region: PricingRegion;
  plan: "free" | "plus" | "pro" | "family";
  features: FeatureAllocationItem[];
  monthlyBudgetCap: number; // Max $ we'll spend serving this user/month
}

export interface FeatureAllocationItem {
  featureId: string;
  included: boolean;
  limit: number | "unlimited";
  limitUnit: string; // "per_day" | "per_week" | "per_month" | "total"
  tasteSample?: number; // Free taste before paywall (e.g., 3 free attempts)
}

/**
 * GLOBAL FEATURE MATRIX
 * 
 * Structure: region → plan → feature allocations
 * 
 * Design principle:
 * - Zero-cost features: UNLIMITED or very generous everywhere
 * - Low-cost features: Generous everywhere (they're cheap)
 * - Medium-cost features: Capped based on region price
 * - High-cost features: Tight caps in cheap regions, generous in expensive regions
 * - Everyone gets a "taste" of premium features to drive upgrades
 */
export const GLOBAL_FEATURE_MATRIX: Record<PricingRegion, Record<"free" | "plus" | "pro" | "family", FeatureAllocationItem[]>> = {
  // ═══════════════════════════════════════════════════════════════════════════
  // STANDARD REGION (US, EU, Japan, etc.) — $13.99/$27.99/$44.99
  // Budget: Plus $5.60/mo, Pro $11.20/mo, Family $18/mo
  // ═══════════════════════════════════════════════════════════════════════════
  standard: {
    free: [
      // Zero cost — generous
      { featureId: "ai_tv_episodes", included: true, limit: 2, limitUnit: "per_day" },
      { featureId: "daily_lessons", included: true, limit: 1, limitUnit: "per_day" },
      { featureId: "flashcards", included: true, limit: 1, limitUnit: "total_decks" },
      { featureId: "exercises", included: true, limit: 5, limitUnit: "per_day" },
      { featureId: "slang_library", included: true, limit: 3, limitUnit: "per_day" },
      { featureId: "pronunciation_guides", included: true, limit: 5, limitUnit: "per_day" },
      { featureId: "cultural_lessons", included: true, limit: 1, limitUnit: "per_day" },
      { featureId: "reading_comprehension", included: true, limit: 1, limitUnit: "per_day" },
      { featureId: "video_subtitles", included: true, limit: 2, limitUnit: "per_day" },
      { featureId: "daily_challenges", included: true, limit: "unlimited", limitUnit: "per_day" },
      { featureId: "community_forums", included: true, limit: "unlimited", limitUnit: "per_day" },
      { featureId: "progress_tracking", included: true, limit: "unlimited", limitUnit: "per_day" },
      // Low cost — taste
      { featureId: "teacher_voice_memos", included: true, limit: 2, limitUnit: "per_day" },
      { featureId: "text_ai_chat", included: true, limit: 5, limitUnit: "per_day" },
      { featureId: "pronunciation_scoring", included: true, limit: 3, limitUnit: "per_day" },
      { featureId: "writing_corrections", included: true, limit: 1, limitUnit: "per_day" },
      { featureId: "word_of_day_audio", included: true, limit: 1, limitUnit: "per_day" },
      { featureId: "quiz_mode", included: true, limit: 1, limitUnit: "per_day" },
      // Medium cost — small taste
      { featureId: "ai_voice_conversation", included: true, limit: 5, limitUnit: "per_month", tasteSample: 5 },
      { featureId: "song_translation", included: true, limit: 1, limitUnit: "per_week" },
      { featureId: "roleplay_scenarios", included: true, limit: 3, limitUnit: "per_month", tasteSample: 3 },
      // High cost — tiny taste
      { featureId: "live_call_translation", included: false, limit: 0, limitUnit: "per_month", tasteSample: 2 },
      { featureId: "video_call_ai", included: false, limit: 0, limitUnit: "per_month", tasteSample: 1 },
      { featureId: "voice_cloning", included: false, limit: 0, limitUnit: "total", tasteSample: 0 },
    ],
    plus: [
      // Zero cost — unlimited
      { featureId: "ai_tv_episodes", included: true, limit: "unlimited", limitUnit: "per_day" },
      { featureId: "daily_lessons", included: true, limit: "unlimited", limitUnit: "per_day" },
      { featureId: "flashcards", included: true, limit: 20, limitUnit: "total_decks" },
      { featureId: "exercises", included: true, limit: "unlimited", limitUnit: "per_day" },
      { featureId: "slang_library", included: true, limit: "unlimited", limitUnit: "per_day" },
      { featureId: "pronunciation_guides", included: true, limit: "unlimited", limitUnit: "per_day" },
      { featureId: "cultural_lessons", included: true, limit: "unlimited", limitUnit: "per_day" },
      { featureId: "reading_comprehension", included: true, limit: "unlimited", limitUnit: "per_day" },
      { featureId: "video_subtitles", included: true, limit: "unlimited", limitUnit: "per_day" },
      { featureId: "daily_challenges", included: true, limit: "unlimited", limitUnit: "per_day" },
      { featureId: "community_forums", included: true, limit: "unlimited", limitUnit: "per_day" },
      { featureId: "progress_tracking", included: true, limit: "unlimited", limitUnit: "per_day" },
      // Low cost — generous
      { featureId: "teacher_voice_memos", included: true, limit: 10, limitUnit: "per_day" },
      { featureId: "text_ai_chat", included: true, limit: 50, limitUnit: "per_day" },
      { featureId: "pronunciation_scoring", included: true, limit: 20, limitUnit: "per_day" },
      { featureId: "writing_corrections", included: true, limit: 10, limitUnit: "per_day" },
      { featureId: "word_of_day_audio", included: true, limit: "unlimited", limitUnit: "per_day" },
      { featureId: "quiz_mode", included: true, limit: 10, limitUnit: "per_day" },
      // Medium cost — solid allocation
      { featureId: "ai_voice_conversation", included: true, limit: 60, limitUnit: "per_month" },
      { featureId: "song_translation", included: true, limit: 10, limitUnit: "per_week" },
      { featureId: "ai_teacher_tts", included: true, limit: 30, limitUnit: "per_month" },
      { featureId: "roleplay_scenarios", included: true, limit: 30, limitUnit: "per_month" },
      { featureId: "url_translation", included: true, limit: 10, limitUnit: "per_month" },
      // High cost — taste
      { featureId: "live_call_translation", included: true, limit: 30, limitUnit: "per_month" },
      { featureId: "video_call_ai", included: true, limit: 15, limitUnit: "per_month" },
      { featureId: "voice_cloning", included: false, limit: 0, limitUnit: "total" },
    ],
    pro: [
      // Zero cost — unlimited
      { featureId: "ai_tv_episodes", included: true, limit: "unlimited", limitUnit: "per_day" },
      { featureId: "daily_lessons", included: true, limit: "unlimited", limitUnit: "per_day" },
      { featureId: "flashcards", included: true, limit: "unlimited", limitUnit: "total_decks" },
      { featureId: "exercises", included: true, limit: "unlimited", limitUnit: "per_day" },
      { featureId: "slang_library", included: true, limit: "unlimited", limitUnit: "per_day" },
      { featureId: "pronunciation_guides", included: true, limit: "unlimited", limitUnit: "per_day" },
      { featureId: "cultural_lessons", included: true, limit: "unlimited", limitUnit: "per_day" },
      { featureId: "reading_comprehension", included: true, limit: "unlimited", limitUnit: "per_day" },
      { featureId: "video_subtitles", included: true, limit: "unlimited", limitUnit: "per_day" },
      { featureId: "daily_challenges", included: true, limit: "unlimited", limitUnit: "per_day" },
      { featureId: "community_forums", included: true, limit: "unlimited", limitUnit: "per_day" },
      { featureId: "progress_tracking", included: true, limit: "unlimited", limitUnit: "per_day" },
      // Low cost — unlimited
      { featureId: "teacher_voice_memos", included: true, limit: "unlimited", limitUnit: "per_day" },
      { featureId: "text_ai_chat", included: true, limit: "unlimited", limitUnit: "per_day" },
      { featureId: "pronunciation_scoring", included: true, limit: "unlimited", limitUnit: "per_day" },
      { featureId: "writing_corrections", included: true, limit: "unlimited", limitUnit: "per_day" },
      { featureId: "word_of_day_audio", included: true, limit: "unlimited", limitUnit: "per_day" },
      { featureId: "quiz_mode", included: true, limit: "unlimited", limitUnit: "per_day" },
      // Medium cost — generous
      { featureId: "ai_voice_conversation", included: true, limit: 300, limitUnit: "per_month" },
      { featureId: "song_translation", included: true, limit: 50, limitUnit: "per_week" },
      { featureId: "ai_teacher_tts", included: true, limit: 120, limitUnit: "per_month" },
      { featureId: "roleplay_scenarios", included: true, limit: 120, limitUnit: "per_month" },
      { featureId: "url_translation", included: true, limit: 50, limitUnit: "per_month" },
      // High cost — included with caps
      { featureId: "live_call_translation", included: true, limit: 120, limitUnit: "per_month" },
      { featureId: "video_call_ai", included: true, limit: 60, limitUnit: "per_month" },
      { featureId: "voice_cloning", included: true, limit: 3, limitUnit: "total" },
      { featureId: "live_video_dubbing", included: true, limit: 30, limitUnit: "per_month" },
      { featureId: "group_class_live", included: true, limit: 60, limitUnit: "per_month" },
    ],
    family: [
      // Same as Pro but shared across 5 members (per-member limits = Pro / 2 per person)
      { featureId: "ai_tv_episodes", included: true, limit: "unlimited", limitUnit: "per_day" },
      { featureId: "daily_lessons", included: true, limit: "unlimited", limitUnit: "per_day" },
      { featureId: "flashcards", included: true, limit: "unlimited", limitUnit: "total_decks" },
      { featureId: "exercises", included: true, limit: "unlimited", limitUnit: "per_day" },
      { featureId: "slang_library", included: true, limit: "unlimited", limitUnit: "per_day" },
      { featureId: "pronunciation_guides", included: true, limit: "unlimited", limitUnit: "per_day" },
      { featureId: "cultural_lessons", included: true, limit: "unlimited", limitUnit: "per_day" },
      { featureId: "reading_comprehension", included: true, limit: "unlimited", limitUnit: "per_day" },
      { featureId: "video_subtitles", included: true, limit: "unlimited", limitUnit: "per_day" },
      { featureId: "daily_challenges", included: true, limit: "unlimited", limitUnit: "per_day" },
      { featureId: "community_forums", included: true, limit: "unlimited", limitUnit: "per_day" },
      { featureId: "progress_tracking", included: true, limit: "unlimited", limitUnit: "per_day" },
      { featureId: "teacher_voice_memos", included: true, limit: "unlimited", limitUnit: "per_day" },
      { featureId: "text_ai_chat", included: true, limit: "unlimited", limitUnit: "per_day" },
      { featureId: "pronunciation_scoring", included: true, limit: "unlimited", limitUnit: "per_day" },
      { featureId: "writing_corrections", included: true, limit: "unlimited", limitUnit: "per_day" },
      { featureId: "word_of_day_audio", included: true, limit: "unlimited", limitUnit: "per_day" },
      { featureId: "quiz_mode", included: true, limit: "unlimited", limitUnit: "per_day" },
      { featureId: "ai_voice_conversation", included: true, limit: 500, limitUnit: "per_month" },
      { featureId: "song_translation", included: true, limit: 100, limitUnit: "per_week" },
      { featureId: "ai_teacher_tts", included: true, limit: 200, limitUnit: "per_month" },
      { featureId: "roleplay_scenarios", included: true, limit: 200, limitUnit: "per_month" },
      { featureId: "url_translation", included: true, limit: 100, limitUnit: "per_month" },
      { featureId: "live_call_translation", included: true, limit: 200, limitUnit: "per_month" },
      { featureId: "video_call_ai", included: true, limit: 100, limitUnit: "per_month" },
      { featureId: "voice_cloning", included: true, limit: 5, limitUnit: "total" },
      { featureId: "live_video_dubbing", included: true, limit: 60, limitUnit: "per_month" },
      { featureId: "group_class_live", included: true, limit: 120, limitUnit: "per_month" },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // CARIBBEAN REGION (DR, Jamaica, Haiti, etc.) — $2.99/$4.99/$7.99
  // Budget: Plus $1.20/mo, Pro $2.00/mo, Family $3.20/mo
  // Strategy: HEAVY on zero-cost content, voice memos, exercises. Light on live AI.
  // ═══════════════════════════════════════════════════════════════════════════
  caribbean: {
    free: [
      { featureId: "ai_tv_episodes", included: true, limit: 3, limitUnit: "per_day" },
      { featureId: "daily_lessons", included: true, limit: 2, limitUnit: "per_day" },
      { featureId: "flashcards", included: true, limit: 2, limitUnit: "total_decks" },
      { featureId: "exercises", included: true, limit: 10, limitUnit: "per_day" },
      { featureId: "slang_library", included: true, limit: 5, limitUnit: "per_day" },
      { featureId: "pronunciation_guides", included: true, limit: 10, limitUnit: "per_day" },
      { featureId: "cultural_lessons", included: true, limit: 2, limitUnit: "per_day" },
      { featureId: "reading_comprehension", included: true, limit: 2, limitUnit: "per_day" },
      { featureId: "video_subtitles", included: true, limit: 3, limitUnit: "per_day" },
      { featureId: "daily_challenges", included: true, limit: "unlimited", limitUnit: "per_day" },
      { featureId: "community_forums", included: true, limit: "unlimited", limitUnit: "per_day" },
      { featureId: "progress_tracking", included: true, limit: "unlimited", limitUnit: "per_day" },
      { featureId: "teacher_voice_memos", included: true, limit: 3, limitUnit: "per_day" },
      { featureId: "text_ai_chat", included: true, limit: 5, limitUnit: "per_day" },
      { featureId: "pronunciation_scoring", included: true, limit: 3, limitUnit: "per_day" },
      { featureId: "writing_corrections", included: true, limit: 1, limitUnit: "per_day" },
      { featureId: "word_of_day_audio", included: true, limit: 1, limitUnit: "per_day" },
      { featureId: "quiz_mode", included: true, limit: 2, limitUnit: "per_day" },
      { featureId: "ai_voice_conversation", included: true, limit: 3, limitUnit: "per_month", tasteSample: 3 },
      { featureId: "song_translation", included: true, limit: 1, limitUnit: "per_week" },
      { featureId: "roleplay_scenarios", included: true, limit: 2, limitUnit: "per_month", tasteSample: 2 },
      { featureId: "live_call_translation", included: false, limit: 0, limitUnit: "per_month", tasteSample: 1 },
      { featureId: "video_call_ai", included: false, limit: 0, limitUnit: "per_month", tasteSample: 1 },
    ],
    plus: [
      // Zero cost — VERY generous (this is the bulk of their experience)
      { featureId: "ai_tv_episodes", included: true, limit: "unlimited", limitUnit: "per_day" },
      { featureId: "daily_lessons", included: true, limit: "unlimited", limitUnit: "per_day" },
      { featureId: "flashcards", included: true, limit: 15, limitUnit: "total_decks" },
      { featureId: "exercises", included: true, limit: "unlimited", limitUnit: "per_day" },
      { featureId: "slang_library", included: true, limit: "unlimited", limitUnit: "per_day" },
      { featureId: "pronunciation_guides", included: true, limit: "unlimited", limitUnit: "per_day" },
      { featureId: "cultural_lessons", included: true, limit: "unlimited", limitUnit: "per_day" },
      { featureId: "reading_comprehension", included: true, limit: "unlimited", limitUnit: "per_day" },
      { featureId: "video_subtitles", included: true, limit: "unlimited", limitUnit: "per_day" },
      { featureId: "daily_challenges", included: true, limit: "unlimited", limitUnit: "per_day" },
      { featureId: "community_forums", included: true, limit: "unlimited", limitUnit: "per_day" },
      { featureId: "progress_tracking", included: true, limit: "unlimited", limitUnit: "per_day" },
      // Low cost — generous (voice memos are the "teacher" for this tier)
      { featureId: "teacher_voice_memos", included: true, limit: 15, limitUnit: "per_day" },
      { featureId: "text_ai_chat", included: true, limit: 30, limitUnit: "per_day" },
      { featureId: "pronunciation_scoring", included: true, limit: 15, limitUnit: "per_day" },
      { featureId: "writing_corrections", included: true, limit: 5, limitUnit: "per_day" },
      { featureId: "word_of_day_audio", included: true, limit: "unlimited", limitUnit: "per_day" },
      { featureId: "quiz_mode", included: true, limit: 10, limitUnit: "per_day" },
      // Medium cost — capped but present
      { featureId: "ai_voice_conversation", included: true, limit: 30, limitUnit: "per_month" },
      { featureId: "song_translation", included: true, limit: 5, limitUnit: "per_week" },
      { featureId: "ai_teacher_tts", included: true, limit: 15, limitUnit: "per_month" },
      { featureId: "roleplay_scenarios", included: true, limit: 15, limitUnit: "per_month" },
      { featureId: "url_translation", included: true, limit: 5, limitUnit: "per_month" },
      // High cost — taste only
      { featureId: "live_call_translation", included: true, limit: 10, limitUnit: "per_month" },
      { featureId: "video_call_ai", included: true, limit: 5, limitUnit: "per_month" },
      { featureId: "voice_cloning", included: false, limit: 0, limitUnit: "total" },
    ],
    pro: [
      { featureId: "ai_tv_episodes", included: true, limit: "unlimited", limitUnit: "per_day" },
      { featureId: "daily_lessons", included: true, limit: "unlimited", limitUnit: "per_day" },
      { featureId: "flashcards", included: true, limit: "unlimited", limitUnit: "total_decks" },
      { featureId: "exercises", included: true, limit: "unlimited", limitUnit: "per_day" },
      { featureId: "slang_library", included: true, limit: "unlimited", limitUnit: "per_day" },
      { featureId: "pronunciation_guides", included: true, limit: "unlimited", limitUnit: "per_day" },
      { featureId: "cultural_lessons", included: true, limit: "unlimited", limitUnit: "per_day" },
      { featureId: "reading_comprehension", included: true, limit: "unlimited", limitUnit: "per_day" },
      { featureId: "video_subtitles", included: true, limit: "unlimited", limitUnit: "per_day" },
      { featureId: "daily_challenges", included: true, limit: "unlimited", limitUnit: "per_day" },
      { featureId: "community_forums", included: true, limit: "unlimited", limitUnit: "per_day" },
      { featureId: "progress_tracking", included: true, limit: "unlimited", limitUnit: "per_day" },
      { featureId: "teacher_voice_memos", included: true, limit: "unlimited", limitUnit: "per_day" },
      { featureId: "text_ai_chat", included: true, limit: "unlimited", limitUnit: "per_day" },
      { featureId: "pronunciation_scoring", included: true, limit: "unlimited", limitUnit: "per_day" },
      { featureId: "writing_corrections", included: true, limit: "unlimited", limitUnit: "per_day" },
      { featureId: "word_of_day_audio", included: true, limit: "unlimited", limitUnit: "per_day" },
      { featureId: "quiz_mode", included: true, limit: "unlimited", limitUnit: "per_day" },
      { featureId: "ai_voice_conversation", included: true, limit: 120, limitUnit: "per_month" },
      { featureId: "song_translation", included: true, limit: 20, limitUnit: "per_week" },
      { featureId: "ai_teacher_tts", included: true, limit: 60, limitUnit: "per_month" },
      { featureId: "roleplay_scenarios", included: true, limit: 60, limitUnit: "per_month" },
      { featureId: "url_translation", included: true, limit: 20, limitUnit: "per_month" },
      { featureId: "live_call_translation", included: true, limit: 45, limitUnit: "per_month" },
      { featureId: "video_call_ai", included: true, limit: 20, limitUnit: "per_month" },
      { featureId: "voice_cloning", included: true, limit: 1, limitUnit: "total" },
      { featureId: "live_video_dubbing", included: true, limit: 10, limitUnit: "per_month" },
      { featureId: "group_class_live", included: true, limit: 30, limitUnit: "per_month" },
    ],
    family: [
      { featureId: "ai_tv_episodes", included: true, limit: "unlimited", limitUnit: "per_day" },
      { featureId: "daily_lessons", included: true, limit: "unlimited", limitUnit: "per_day" },
      { featureId: "flashcards", included: true, limit: "unlimited", limitUnit: "total_decks" },
      { featureId: "exercises", included: true, limit: "unlimited", limitUnit: "per_day" },
      { featureId: "slang_library", included: true, limit: "unlimited", limitUnit: "per_day" },
      { featureId: "pronunciation_guides", included: true, limit: "unlimited", limitUnit: "per_day" },
      { featureId: "cultural_lessons", included: true, limit: "unlimited", limitUnit: "per_day" },
      { featureId: "reading_comprehension", included: true, limit: "unlimited", limitUnit: "per_day" },
      { featureId: "video_subtitles", included: true, limit: "unlimited", limitUnit: "per_day" },
      { featureId: "daily_challenges", included: true, limit: "unlimited", limitUnit: "per_day" },
      { featureId: "community_forums", included: true, limit: "unlimited", limitUnit: "per_day" },
      { featureId: "progress_tracking", included: true, limit: "unlimited", limitUnit: "per_day" },
      { featureId: "teacher_voice_memos", included: true, limit: "unlimited", limitUnit: "per_day" },
      { featureId: "text_ai_chat", included: true, limit: "unlimited", limitUnit: "per_day" },
      { featureId: "pronunciation_scoring", included: true, limit: "unlimited", limitUnit: "per_day" },
      { featureId: "writing_corrections", included: true, limit: "unlimited", limitUnit: "per_day" },
      { featureId: "word_of_day_audio", included: true, limit: "unlimited", limitUnit: "per_day" },
      { featureId: "quiz_mode", included: true, limit: "unlimited", limitUnit: "per_day" },
      { featureId: "ai_voice_conversation", included: true, limit: 200, limitUnit: "per_month" },
      { featureId: "song_translation", included: true, limit: 40, limitUnit: "per_week" },
      { featureId: "ai_teacher_tts", included: true, limit: 100, limitUnit: "per_month" },
      { featureId: "roleplay_scenarios", included: true, limit: 100, limitUnit: "per_month" },
      { featureId: "url_translation", included: true, limit: 40, limitUnit: "per_month" },
      { featureId: "live_call_translation", included: true, limit: 75, limitUnit: "per_month" },
      { featureId: "video_call_ai", included: true, limit: 40, limitUnit: "per_month" },
      { featureId: "voice_cloning", included: true, limit: 3, limitUnit: "total" },
      { featureId: "live_video_dubbing", included: true, limit: 20, limitUnit: "per_month" },
      { featureId: "group_class_live", included: true, limit: 60, limitUnit: "per_month" },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // CENTRAL AMERICA (Guatemala, Honduras, Mexico, etc.) — $2.99/$5.99/$9.99
  // Budget: Plus $1.20/mo, Pro $2.40/mo, Family $4.00/mo
  // Same as Caribbean (similar purchasing power)
  // ═══════════════════════════════════════════════════════════════════════════
  central_america: {
    free: [
      { featureId: "ai_tv_episodes", included: true, limit: 3, limitUnit: "per_day" },
      { featureId: "daily_lessons", included: true, limit: 2, limitUnit: "per_day" },
      { featureId: "flashcards", included: true, limit: 2, limitUnit: "total_decks" },
      { featureId: "exercises", included: true, limit: 10, limitUnit: "per_day" },
      { featureId: "slang_library", included: true, limit: 5, limitUnit: "per_day" },
      { featureId: "pronunciation_guides", included: true, limit: 10, limitUnit: "per_day" },
      { featureId: "cultural_lessons", included: true, limit: 2, limitUnit: "per_day" },
      { featureId: "reading_comprehension", included: true, limit: 2, limitUnit: "per_day" },
      { featureId: "video_subtitles", included: true, limit: 3, limitUnit: "per_day" },
      { featureId: "daily_challenges", included: true, limit: "unlimited", limitUnit: "per_day" },
      { featureId: "community_forums", included: true, limit: "unlimited", limitUnit: "per_day" },
      { featureId: "progress_tracking", included: true, limit: "unlimited", limitUnit: "per_day" },
      { featureId: "teacher_voice_memos", included: true, limit: 3, limitUnit: "per_day" },
      { featureId: "text_ai_chat", included: true, limit: 5, limitUnit: "per_day" },
      { featureId: "pronunciation_scoring", included: true, limit: 3, limitUnit: "per_day" },
      { featureId: "writing_corrections", included: true, limit: 1, limitUnit: "per_day" },
      { featureId: "word_of_day_audio", included: true, limit: 1, limitUnit: "per_day" },
      { featureId: "quiz_mode", included: true, limit: 2, limitUnit: "per_day" },
      { featureId: "ai_voice_conversation", included: true, limit: 3, limitUnit: "per_month", tasteSample: 3 },
      { featureId: "song_translation", included: true, limit: 1, limitUnit: "per_week" },
      { featureId: "roleplay_scenarios", included: true, limit: 2, limitUnit: "per_month", tasteSample: 2 },
      { featureId: "live_call_translation", included: false, limit: 0, limitUnit: "per_month", tasteSample: 1 },
      { featureId: "video_call_ai", included: false, limit: 0, limitUnit: "per_month", tasteSample: 1 },
    ],
    plus: [
      { featureId: "ai_tv_episodes", included: true, limit: "unlimited", limitUnit: "per_day" },
      { featureId: "daily_lessons", included: true, limit: "unlimited", limitUnit: "per_day" },
      { featureId: "flashcards", included: true, limit: 15, limitUnit: "total_decks" },
      { featureId: "exercises", included: true, limit: "unlimited", limitUnit: "per_day" },
      { featureId: "slang_library", included: true, limit: "unlimited", limitUnit: "per_day" },
      { featureId: "pronunciation_guides", included: true, limit: "unlimited", limitUnit: "per_day" },
      { featureId: "cultural_lessons", included: true, limit: "unlimited", limitUnit: "per_day" },
      { featureId: "reading_comprehension", included: true, limit: "unlimited", limitUnit: "per_day" },
      { featureId: "video_subtitles", included: true, limit: "unlimited", limitUnit: "per_day" },
      { featureId: "daily_challenges", included: true, limit: "unlimited", limitUnit: "per_day" },
      { featureId: "community_forums", included: true, limit: "unlimited", limitUnit: "per_day" },
      { featureId: "progress_tracking", included: true, limit: "unlimited", limitUnit: "per_day" },
      { featureId: "teacher_voice_memos", included: true, limit: 15, limitUnit: "per_day" },
      { featureId: "text_ai_chat", included: true, limit: 30, limitUnit: "per_day" },
      { featureId: "pronunciation_scoring", included: true, limit: 15, limitUnit: "per_day" },
      { featureId: "writing_corrections", included: true, limit: 5, limitUnit: "per_day" },
      { featureId: "word_of_day_audio", included: true, limit: "unlimited", limitUnit: "per_day" },
      { featureId: "quiz_mode", included: true, limit: 10, limitUnit: "per_day" },
      { featureId: "ai_voice_conversation", included: true, limit: 30, limitUnit: "per_month" },
      { featureId: "song_translation", included: true, limit: 5, limitUnit: "per_week" },
      { featureId: "ai_teacher_tts", included: true, limit: 15, limitUnit: "per_month" },
      { featureId: "roleplay_scenarios", included: true, limit: 15, limitUnit: "per_month" },
      { featureId: "url_translation", included: true, limit: 5, limitUnit: "per_month" },
      { featureId: "live_call_translation", included: true, limit: 10, limitUnit: "per_month" },
      { featureId: "video_call_ai", included: true, limit: 5, limitUnit: "per_month" },
      { featureId: "voice_cloning", included: false, limit: 0, limitUnit: "total" },
    ],
    pro: [
      { featureId: "ai_tv_episodes", included: true, limit: "unlimited", limitUnit: "per_day" },
      { featureId: "daily_lessons", included: true, limit: "unlimited", limitUnit: "per_day" },
      { featureId: "flashcards", included: true, limit: "unlimited", limitUnit: "total_decks" },
      { featureId: "exercises", included: true, limit: "unlimited", limitUnit: "per_day" },
      { featureId: "slang_library", included: true, limit: "unlimited", limitUnit: "per_day" },
      { featureId: "pronunciation_guides", included: true, limit: "unlimited", limitUnit: "per_day" },
      { featureId: "cultural_lessons", included: true, limit: "unlimited", limitUnit: "per_day" },
      { featureId: "reading_comprehension", included: true, limit: "unlimited", limitUnit: "per_day" },
      { featureId: "video_subtitles", included: true, limit: "unlimited", limitUnit: "per_day" },
      { featureId: "daily_challenges", included: true, limit: "unlimited", limitUnit: "per_day" },
      { featureId: "community_forums", included: true, limit: "unlimited", limitUnit: "per_day" },
      { featureId: "progress_tracking", included: true, limit: "unlimited", limitUnit: "per_day" },
      { featureId: "teacher_voice_memos", included: true, limit: "unlimited", limitUnit: "per_day" },
      { featureId: "text_ai_chat", included: true, limit: "unlimited", limitUnit: "per_day" },
      { featureId: "pronunciation_scoring", included: true, limit: "unlimited", limitUnit: "per_day" },
      { featureId: "writing_corrections", included: true, limit: "unlimited", limitUnit: "per_day" },
      { featureId: "word_of_day_audio", included: true, limit: "unlimited", limitUnit: "per_day" },
      { featureId: "quiz_mode", included: true, limit: "unlimited", limitUnit: "per_day" },
      { featureId: "ai_voice_conversation", included: true, limit: 120, limitUnit: "per_month" },
      { featureId: "song_translation", included: true, limit: 20, limitUnit: "per_week" },
      { featureId: "ai_teacher_tts", included: true, limit: 60, limitUnit: "per_month" },
      { featureId: "roleplay_scenarios", included: true, limit: 60, limitUnit: "per_month" },
      { featureId: "url_translation", included: true, limit: 20, limitUnit: "per_month" },
      { featureId: "live_call_translation", included: true, limit: 45, limitUnit: "per_month" },
      { featureId: "video_call_ai", included: true, limit: 25, limitUnit: "per_month" },
      { featureId: "voice_cloning", included: true, limit: 1, limitUnit: "total" },
      { featureId: "live_video_dubbing", included: true, limit: 15, limitUnit: "per_month" },
      { featureId: "group_class_live", included: true, limit: 30, limitUnit: "per_month" },
    ],
    family: [
      { featureId: "ai_tv_episodes", included: true, limit: "unlimited", limitUnit: "per_day" },
      { featureId: "daily_lessons", included: true, limit: "unlimited", limitUnit: "per_day" },
      { featureId: "flashcards", included: true, limit: "unlimited", limitUnit: "total_decks" },
      { featureId: "exercises", included: true, limit: "unlimited", limitUnit: "per_day" },
      { featureId: "slang_library", included: true, limit: "unlimited", limitUnit: "per_day" },
      { featureId: "pronunciation_guides", included: true, limit: "unlimited", limitUnit: "per_day" },
      { featureId: "cultural_lessons", included: true, limit: "unlimited", limitUnit: "per_day" },
      { featureId: "reading_comprehension", included: true, limit: "unlimited", limitUnit: "per_day" },
      { featureId: "video_subtitles", included: true, limit: "unlimited", limitUnit: "per_day" },
      { featureId: "daily_challenges", included: true, limit: "unlimited", limitUnit: "per_day" },
      { featureId: "community_forums", included: true, limit: "unlimited", limitUnit: "per_day" },
      { featureId: "progress_tracking", included: true, limit: "unlimited", limitUnit: "per_day" },
      { featureId: "teacher_voice_memos", included: true, limit: "unlimited", limitUnit: "per_day" },
      { featureId: "text_ai_chat", included: true, limit: "unlimited", limitUnit: "per_day" },
      { featureId: "pronunciation_scoring", included: true, limit: "unlimited", limitUnit: "per_day" },
      { featureId: "writing_corrections", included: true, limit: "unlimited", limitUnit: "per_day" },
      { featureId: "word_of_day_audio", included: true, limit: "unlimited", limitUnit: "per_day" },
      { featureId: "quiz_mode", included: true, limit: "unlimited", limitUnit: "per_day" },
      { featureId: "ai_voice_conversation", included: true, limit: 200, limitUnit: "per_month" },
      { featureId: "song_translation", included: true, limit: 40, limitUnit: "per_week" },
      { featureId: "ai_teacher_tts", included: true, limit: 100, limitUnit: "per_month" },
      { featureId: "roleplay_scenarios", included: true, limit: 100, limitUnit: "per_month" },
      { featureId: "url_translation", included: true, limit: 40, limitUnit: "per_month" },
      { featureId: "live_call_translation", included: true, limit: 75, limitUnit: "per_month" },
      { featureId: "video_call_ai", included: true, limit: 40, limitUnit: "per_month" },
      { featureId: "voice_cloning", included: true, limit: 2, limitUnit: "total" },
      { featureId: "live_video_dubbing", included: true, limit: 25, limitUnit: "per_month" },
      { featureId: "group_class_live", included: true, limit: 60, limitUnit: "per_month" },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // SOUTH AMERICA (Brazil, Colombia, Argentina, etc.) — $3.99/$7.99/$12.99
  // Budget: Plus $1.60/mo, Pro $3.20/mo, Family $5.20/mo
  // Slightly more generous than Caribbean (higher price point)
  // ═══════════════════════════════════════════════════════════════════════════
  south_america: {
    free: [
      { featureId: "ai_tv_episodes", included: true, limit: 3, limitUnit: "per_day" },
      { featureId: "daily_lessons", included: true, limit: 2, limitUnit: "per_day" },
      { featureId: "flashcards", included: true, limit: 2, limitUnit: "total_decks" },
      { featureId: "exercises", included: true, limit: 8, limitUnit: "per_day" },
      { featureId: "slang_library", included: true, limit: 5, limitUnit: "per_day" },
      { featureId: "pronunciation_guides", included: true, limit: 8, limitUnit: "per_day" },
      { featureId: "cultural_lessons", included: true, limit: 1, limitUnit: "per_day" },
      { featureId: "reading_comprehension", included: true, limit: 2, limitUnit: "per_day" },
      { featureId: "video_subtitles", included: true, limit: 2, limitUnit: "per_day" },
      { featureId: "daily_challenges", included: true, limit: "unlimited", limitUnit: "per_day" },
      { featureId: "community_forums", included: true, limit: "unlimited", limitUnit: "per_day" },
      { featureId: "progress_tracking", included: true, limit: "unlimited", limitUnit: "per_day" },
      { featureId: "teacher_voice_memos", included: true, limit: 2, limitUnit: "per_day" },
      { featureId: "text_ai_chat", included: true, limit: 5, limitUnit: "per_day" },
      { featureId: "pronunciation_scoring", included: true, limit: 3, limitUnit: "per_day" },
      { featureId: "writing_corrections", included: true, limit: 1, limitUnit: "per_day" },
      { featureId: "word_of_day_audio", included: true, limit: 1, limitUnit: "per_day" },
      { featureId: "quiz_mode", included: true, limit: 2, limitUnit: "per_day" },
      { featureId: "ai_voice_conversation", included: true, limit: 5, limitUnit: "per_month", tasteSample: 5 },
      { featureId: "song_translation", included: true, limit: 1, limitUnit: "per_week" },
      { featureId: "roleplay_scenarios", included: true, limit: 3, limitUnit: "per_month", tasteSample: 3 },
      { featureId: "live_call_translation", included: false, limit: 0, limitUnit: "per_month", tasteSample: 2 },
      { featureId: "video_call_ai", included: false, limit: 0, limitUnit: "per_month", tasteSample: 1 },
    ],
    plus: [
      { featureId: "ai_tv_episodes", included: true, limit: "unlimited", limitUnit: "per_day" },
      { featureId: "daily_lessons", included: true, limit: "unlimited", limitUnit: "per_day" },
      { featureId: "flashcards", included: true, limit: 15, limitUnit: "total_decks" },
      { featureId: "exercises", included: true, limit: "unlimited", limitUnit: "per_day" },
      { featureId: "slang_library", included: true, limit: "unlimited", limitUnit: "per_day" },
      { featureId: "pronunciation_guides", included: true, limit: "unlimited", limitUnit: "per_day" },
      { featureId: "cultural_lessons", included: true, limit: "unlimited", limitUnit: "per_day" },
      { featureId: "reading_comprehension", included: true, limit: "unlimited", limitUnit: "per_day" },
      { featureId: "video_subtitles", included: true, limit: "unlimited", limitUnit: "per_day" },
      { featureId: "daily_challenges", included: true, limit: "unlimited", limitUnit: "per_day" },
      { featureId: "community_forums", included: true, limit: "unlimited", limitUnit: "per_day" },
      { featureId: "progress_tracking", included: true, limit: "unlimited", limitUnit: "per_day" },
      { featureId: "teacher_voice_memos", included: true, limit: 12, limitUnit: "per_day" },
      { featureId: "text_ai_chat", included: true, limit: 40, limitUnit: "per_day" },
      { featureId: "pronunciation_scoring", included: true, limit: 15, limitUnit: "per_day" },
      { featureId: "writing_corrections", included: true, limit: 8, limitUnit: "per_day" },
      { featureId: "word_of_day_audio", included: true, limit: "unlimited", limitUnit: "per_day" },
      { featureId: "quiz_mode", included: true, limit: 10, limitUnit: "per_day" },
      { featureId: "ai_voice_conversation", included: true, limit: 45, limitUnit: "per_month" },
      { featureId: "song_translation", included: true, limit: 7, limitUnit: "per_week" },
      { featureId: "ai_teacher_tts", included: true, limit: 20, limitUnit: "per_month" },
      { featureId: "roleplay_scenarios", included: true, limit: 20, limitUnit: "per_month" },
      { featureId: "url_translation", included: true, limit: 7, limitUnit: "per_month" },
      { featureId: "live_call_translation", included: true, limit: 15, limitUnit: "per_month" },
      { featureId: "video_call_ai", included: true, limit: 8, limitUnit: "per_month" },
      { featureId: "voice_cloning", included: false, limit: 0, limitUnit: "total" },
    ],
    pro: [
      { featureId: "ai_tv_episodes", included: true, limit: "unlimited", limitUnit: "per_day" },
      { featureId: "daily_lessons", included: true, limit: "unlimited", limitUnit: "per_day" },
      { featureId: "flashcards", included: true, limit: "unlimited", limitUnit: "total_decks" },
      { featureId: "exercises", included: true, limit: "unlimited", limitUnit: "per_day" },
      { featureId: "slang_library", included: true, limit: "unlimited", limitUnit: "per_day" },
      { featureId: "pronunciation_guides", included: true, limit: "unlimited", limitUnit: "per_day" },
      { featureId: "cultural_lessons", included: true, limit: "unlimited", limitUnit: "per_day" },
      { featureId: "reading_comprehension", included: true, limit: "unlimited", limitUnit: "per_day" },
      { featureId: "video_subtitles", included: true, limit: "unlimited", limitUnit: "per_day" },
      { featureId: "daily_challenges", included: true, limit: "unlimited", limitUnit: "per_day" },
      { featureId: "community_forums", included: true, limit: "unlimited", limitUnit: "per_day" },
      { featureId: "progress_tracking", included: true, limit: "unlimited", limitUnit: "per_day" },
      { featureId: "teacher_voice_memos", included: true, limit: "unlimited", limitUnit: "per_day" },
      { featureId: "text_ai_chat", included: true, limit: "unlimited", limitUnit: "per_day" },
      { featureId: "pronunciation_scoring", included: true, limit: "unlimited", limitUnit: "per_day" },
      { featureId: "writing_corrections", included: true, limit: "unlimited", limitUnit: "per_day" },
      { featureId: "word_of_day_audio", included: true, limit: "unlimited", limitUnit: "per_day" },
      { featureId: "quiz_mode", included: true, limit: "unlimited", limitUnit: "per_day" },
      { featureId: "ai_voice_conversation", included: true, limit: 180, limitUnit: "per_month" },
      { featureId: "song_translation", included: true, limit: 30, limitUnit: "per_week" },
      { featureId: "ai_teacher_tts", included: true, limit: 90, limitUnit: "per_month" },
      { featureId: "roleplay_scenarios", included: true, limit: 90, limitUnit: "per_month" },
      { featureId: "url_translation", included: true, limit: 30, limitUnit: "per_month" },
      { featureId: "live_call_translation", included: true, limit: 60, limitUnit: "per_month" },
      { featureId: "video_call_ai", included: true, limit: 30, limitUnit: "per_month" },
      { featureId: "voice_cloning", included: true, limit: 2, limitUnit: "total" },
      { featureId: "live_video_dubbing", included: true, limit: 20, limitUnit: "per_month" },
      { featureId: "group_class_live", included: true, limit: 45, limitUnit: "per_month" },
    ],
    family: [
      { featureId: "ai_tv_episodes", included: true, limit: "unlimited", limitUnit: "per_day" },
      { featureId: "daily_lessons", included: true, limit: "unlimited", limitUnit: "per_day" },
      { featureId: "flashcards", included: true, limit: "unlimited", limitUnit: "total_decks" },
      { featureId: "exercises", included: true, limit: "unlimited", limitUnit: "per_day" },
      { featureId: "slang_library", included: true, limit: "unlimited", limitUnit: "per_day" },
      { featureId: "pronunciation_guides", included: true, limit: "unlimited", limitUnit: "per_day" },
      { featureId: "cultural_lessons", included: true, limit: "unlimited", limitUnit: "per_day" },
      { featureId: "reading_comprehension", included: true, limit: "unlimited", limitUnit: "per_day" },
      { featureId: "video_subtitles", included: true, limit: "unlimited", limitUnit: "per_day" },
      { featureId: "daily_challenges", included: true, limit: "unlimited", limitUnit: "per_day" },
      { featureId: "community_forums", included: true, limit: "unlimited", limitUnit: "per_day" },
      { featureId: "progress_tracking", included: true, limit: "unlimited", limitUnit: "per_day" },
      { featureId: "teacher_voice_memos", included: true, limit: "unlimited", limitUnit: "per_day" },
      { featureId: "text_ai_chat", included: true, limit: "unlimited", limitUnit: "per_day" },
      { featureId: "pronunciation_scoring", included: true, limit: "unlimited", limitUnit: "per_day" },
      { featureId: "writing_corrections", included: true, limit: "unlimited", limitUnit: "per_day" },
      { featureId: "word_of_day_audio", included: true, limit: "unlimited", limitUnit: "per_day" },
      { featureId: "quiz_mode", included: true, limit: "unlimited", limitUnit: "per_day" },
      { featureId: "ai_voice_conversation", included: true, limit: 300, limitUnit: "per_month" },
      { featureId: "song_translation", included: true, limit: 60, limitUnit: "per_week" },
      { featureId: "ai_teacher_tts", included: true, limit: 150, limitUnit: "per_month" },
      { featureId: "roleplay_scenarios", included: true, limit: 150, limitUnit: "per_month" },
      { featureId: "url_translation", included: true, limit: 60, limitUnit: "per_month" },
      { featureId: "live_call_translation", included: true, limit: 100, limitUnit: "per_month" },
      { featureId: "video_call_ai", included: true, limit: 50, limitUnit: "per_month" },
      { featureId: "voice_cloning", included: true, limit: 3, limitUnit: "total" },
      { featureId: "live_video_dubbing", included: true, limit: 40, limitUnit: "per_month" },
      { featureId: "group_class_live", included: true, limit: 90, limitUnit: "per_month" },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // AFRICA (Nigeria, Kenya, South Africa, etc.) — $1.49/$3.99/$6.99
  // Budget: Plus $0.60/mo, Pro $1.60/mo, Family $2.80/mo
  // MOST content-heavy, LEAST real-time AI. Voice memos + exercises dominate.
  // ═══════════════════════════════════════════════════════════════════════════
  africa: {
    free: [
      { featureId: "ai_tv_episodes", included: true, limit: 5, limitUnit: "per_day" },
      { featureId: "daily_lessons", included: true, limit: 3, limitUnit: "per_day" },
      { featureId: "flashcards", included: true, limit: 3, limitUnit: "total_decks" },
      { featureId: "exercises", included: true, limit: 15, limitUnit: "per_day" },
      { featureId: "slang_library", included: true, limit: 10, limitUnit: "per_day" },
      { featureId: "pronunciation_guides", included: true, limit: 15, limitUnit: "per_day" },
      { featureId: "cultural_lessons", included: true, limit: 3, limitUnit: "per_day" },
      { featureId: "reading_comprehension", included: true, limit: 3, limitUnit: "per_day" },
      { featureId: "video_subtitles", included: true, limit: 5, limitUnit: "per_day" },
      { featureId: "daily_challenges", included: true, limit: "unlimited", limitUnit: "per_day" },
      { featureId: "community_forums", included: true, limit: "unlimited", limitUnit: "per_day" },
      { featureId: "progress_tracking", included: true, limit: "unlimited", limitUnit: "per_day" },
      { featureId: "teacher_voice_memos", included: true, limit: 5, limitUnit: "per_day" },
      { featureId: "text_ai_chat", included: true, limit: 5, limitUnit: "per_day" },
      { featureId: "pronunciation_scoring", included: true, limit: 5, limitUnit: "per_day" },
      { featureId: "writing_corrections", included: true, limit: 2, limitUnit: "per_day" },
      { featureId: "word_of_day_audio", included: true, limit: 1, limitUnit: "per_day" },
      { featureId: "quiz_mode", included: true, limit: 3, limitUnit: "per_day" },
      { featureId: "ai_voice_conversation", included: true, limit: 2, limitUnit: "per_month", tasteSample: 2 },
      { featureId: "song_translation", included: true, limit: 1, limitUnit: "per_week" },
      { featureId: "roleplay_scenarios", included: true, limit: 1, limitUnit: "per_month", tasteSample: 1 },
      { featureId: "live_call_translation", included: false, limit: 0, limitUnit: "per_month", tasteSample: 1 },
      { featureId: "video_call_ai", included: false, limit: 0, limitUnit: "per_month", tasteSample: 0 },
    ],
    plus: [
      // Zero cost — MAXIMUM (this IS the product for Africa Plus)
      { featureId: "ai_tv_episodes", included: true, limit: "unlimited", limitUnit: "per_day" },
      { featureId: "daily_lessons", included: true, limit: "unlimited", limitUnit: "per_day" },
      { featureId: "flashcards", included: true, limit: 20, limitUnit: "total_decks" },
      { featureId: "exercises", included: true, limit: "unlimited", limitUnit: "per_day" },
      { featureId: "slang_library", included: true, limit: "unlimited", limitUnit: "per_day" },
      { featureId: "pronunciation_guides", included: true, limit: "unlimited", limitUnit: "per_day" },
      { featureId: "cultural_lessons", included: true, limit: "unlimited", limitUnit: "per_day" },
      { featureId: "reading_comprehension", included: true, limit: "unlimited", limitUnit: "per_day" },
      { featureId: "video_subtitles", included: true, limit: "unlimited", limitUnit: "per_day" },
      { featureId: "daily_challenges", included: true, limit: "unlimited", limitUnit: "per_day" },
      { featureId: "community_forums", included: true, limit: "unlimited", limitUnit: "per_day" },
      { featureId: "progress_tracking", included: true, limit: "unlimited", limitUnit: "per_day" },
      // Low cost — VERY generous (voice memos = the teacher experience here)
      { featureId: "teacher_voice_memos", included: true, limit: 20, limitUnit: "per_day" },
      { featureId: "text_ai_chat", included: true, limit: 25, limitUnit: "per_day" },
      { featureId: "pronunciation_scoring", included: true, limit: 20, limitUnit: "per_day" },
      { featureId: "writing_corrections", included: true, limit: 5, limitUnit: "per_day" },
      { featureId: "word_of_day_audio", included: true, limit: "unlimited", limitUnit: "per_day" },
      { featureId: "quiz_mode", included: true, limit: 15, limitUnit: "per_day" },
      // Medium cost — tight but present
      { featureId: "ai_voice_conversation", included: true, limit: 15, limitUnit: "per_month" },
      { featureId: "song_translation", included: true, limit: 3, limitUnit: "per_week" },
      { featureId: "ai_teacher_tts", included: true, limit: 10, limitUnit: "per_month" },
      { featureId: "roleplay_scenarios", included: true, limit: 10, limitUnit: "per_month" },
      { featureId: "url_translation", included: true, limit: 3, limitUnit: "per_month" },
      // High cost — minimal taste
      { featureId: "live_call_translation", included: true, limit: 5, limitUnit: "per_month" },
      { featureId: "video_call_ai", included: true, limit: 3, limitUnit: "per_month" },
      { featureId: "voice_cloning", included: false, limit: 0, limitUnit: "total" },
    ],
    pro: [
      { featureId: "ai_tv_episodes", included: true, limit: "unlimited", limitUnit: "per_day" },
      { featureId: "daily_lessons", included: true, limit: "unlimited", limitUnit: "per_day" },
      { featureId: "flashcards", included: true, limit: "unlimited", limitUnit: "total_decks" },
      { featureId: "exercises", included: true, limit: "unlimited", limitUnit: "per_day" },
      { featureId: "slang_library", included: true, limit: "unlimited", limitUnit: "per_day" },
      { featureId: "pronunciation_guides", included: true, limit: "unlimited", limitUnit: "per_day" },
      { featureId: "cultural_lessons", included: true, limit: "unlimited", limitUnit: "per_day" },
      { featureId: "reading_comprehension", included: true, limit: "unlimited", limitUnit: "per_day" },
      { featureId: "video_subtitles", included: true, limit: "unlimited", limitUnit: "per_day" },
      { featureId: "daily_challenges", included: true, limit: "unlimited", limitUnit: "per_day" },
      { featureId: "community_forums", included: true, limit: "unlimited", limitUnit: "per_day" },
      { featureId: "progress_tracking", included: true, limit: "unlimited", limitUnit: "per_day" },
      { featureId: "teacher_voice_memos", included: true, limit: "unlimited", limitUnit: "per_day" },
      { featureId: "text_ai_chat", included: true, limit: "unlimited", limitUnit: "per_day" },
      { featureId: "pronunciation_scoring", included: true, limit: "unlimited", limitUnit: "per_day" },
      { featureId: "writing_corrections", included: true, limit: "unlimited", limitUnit: "per_day" },
      { featureId: "word_of_day_audio", included: true, limit: "unlimited", limitUnit: "per_day" },
      { featureId: "quiz_mode", included: true, limit: "unlimited", limitUnit: "per_day" },
      { featureId: "ai_voice_conversation", included: true, limit: 60, limitUnit: "per_month" },
      { featureId: "song_translation", included: true, limit: 10, limitUnit: "per_week" },
      { featureId: "ai_teacher_tts", included: true, limit: 30, limitUnit: "per_month" },
      { featureId: "roleplay_scenarios", included: true, limit: 30, limitUnit: "per_month" },
      { featureId: "url_translation", included: true, limit: 10, limitUnit: "per_month" },
      { featureId: "live_call_translation", included: true, limit: 20, limitUnit: "per_month" },
      { featureId: "video_call_ai", included: true, limit: 10, limitUnit: "per_month" },
      { featureId: "voice_cloning", included: true, limit: 1, limitUnit: "total" },
      { featureId: "live_video_dubbing", included: true, limit: 5, limitUnit: "per_month" },
      { featureId: "group_class_live", included: true, limit: 15, limitUnit: "per_month" },
    ],
    family: [
      { featureId: "ai_tv_episodes", included: true, limit: "unlimited", limitUnit: "per_day" },
      { featureId: "daily_lessons", included: true, limit: "unlimited", limitUnit: "per_day" },
      { featureId: "flashcards", included: true, limit: "unlimited", limitUnit: "total_decks" },
      { featureId: "exercises", included: true, limit: "unlimited", limitUnit: "per_day" },
      { featureId: "slang_library", included: true, limit: "unlimited", limitUnit: "per_day" },
      { featureId: "pronunciation_guides", included: true, limit: "unlimited", limitUnit: "per_day" },
      { featureId: "cultural_lessons", included: true, limit: "unlimited", limitUnit: "per_day" },
      { featureId: "reading_comprehension", included: true, limit: "unlimited", limitUnit: "per_day" },
      { featureId: "video_subtitles", included: true, limit: "unlimited", limitUnit: "per_day" },
      { featureId: "daily_challenges", included: true, limit: "unlimited", limitUnit: "per_day" },
      { featureId: "community_forums", included: true, limit: "unlimited", limitUnit: "per_day" },
      { featureId: "progress_tracking", included: true, limit: "unlimited", limitUnit: "per_day" },
      { featureId: "teacher_voice_memos", included: true, limit: "unlimited", limitUnit: "per_day" },
      { featureId: "text_ai_chat", included: true, limit: "unlimited", limitUnit: "per_day" },
      { featureId: "pronunciation_scoring", included: true, limit: "unlimited", limitUnit: "per_day" },
      { featureId: "writing_corrections", included: true, limit: "unlimited", limitUnit: "per_day" },
      { featureId: "word_of_day_audio", included: true, limit: "unlimited", limitUnit: "per_day" },
      { featureId: "quiz_mode", included: true, limit: "unlimited", limitUnit: "per_day" },
      { featureId: "ai_voice_conversation", included: true, limit: 100, limitUnit: "per_month" },
      { featureId: "song_translation", included: true, limit: 20, limitUnit: "per_week" },
      { featureId: "ai_teacher_tts", included: true, limit: 50, limitUnit: "per_month" },
      { featureId: "roleplay_scenarios", included: true, limit: 50, limitUnit: "per_month" },
      { featureId: "url_translation", included: true, limit: 20, limitUnit: "per_month" },
      { featureId: "live_call_translation", included: true, limit: 35, limitUnit: "per_month" },
      { featureId: "video_call_ai", included: true, limit: 20, limitUnit: "per_month" },
      { featureId: "voice_cloning", included: true, limit: 2, limitUnit: "total" },
      { featureId: "live_video_dubbing", included: true, limit: 10, limitUnit: "per_month" },
      { featureId: "group_class_live", included: true, limit: 30, limitUnit: "per_month" },
    ],
  },

  // Remaining regions use the same pattern — reference from Caribbean/South America
  // Southeast Asia mirrors Caribbean, South Asia mirrors Africa, Middle East mirrors South America
  southeast_asia: {
    free: [] as FeatureAllocationItem[], // Will be populated by getRegionFeatures()
    plus: [] as FeatureAllocationItem[],
    pro: [] as FeatureAllocationItem[],
    family: [] as FeatureAllocationItem[],
  },
  south_asia: {
    free: [] as FeatureAllocationItem[],
    plus: [] as FeatureAllocationItem[],
    pro: [] as FeatureAllocationItem[],
    family: [] as FeatureAllocationItem[],
  },
  middle_east: {
    free: [] as FeatureAllocationItem[],
    plus: [] as FeatureAllocationItem[],
    pro: [] as FeatureAllocationItem[],
    family: [] as FeatureAllocationItem[],
  },
};

// ─── POPULATE REMAINING REGIONS (mirrors) ───────────────────────────────────
// Southeast Asia ($2.99) mirrors Caribbean
GLOBAL_FEATURE_MATRIX.southeast_asia = { ...GLOBAL_FEATURE_MATRIX.caribbean };
// South Asia ($1.99) mirrors Africa (cheapest tier)
GLOBAL_FEATURE_MATRIX.south_asia = { ...GLOBAL_FEATURE_MATRIX.africa };
// Middle East ($3.99) mirrors South America
GLOBAL_FEATURE_MATRIX.middle_east = { ...GLOBAL_FEATURE_MATRIX.south_america };

// ─── HELPER FUNCTIONS ───────────────────────────────────────────────────────

/**
 * Get feature allocation for a specific user
 */
export function getFeatureAllocation(
  region: PricingRegion,
  plan: "free" | "plus" | "pro" | "family"
): FeatureAllocationItem[] {
  return GLOBAL_FEATURE_MATRIX[region][plan];
}

/**
 * Check if a user can access a specific feature
 */
export function canAccessFeature(
  region: PricingRegion,
  plan: "free" | "plus" | "pro" | "family",
  featureId: string
): { allowed: boolean; limit: number | "unlimited"; limitUnit: string; tasteSample?: number } {
  const allocation = GLOBAL_FEATURE_MATRIX[region][plan];
  const feature = allocation.find(f => f.featureId === featureId);
  
  if (!feature) {
    return { allowed: false, limit: 0, limitUnit: "per_month" };
  }
  
  return {
    allowed: feature.included,
    limit: feature.limit,
    limitUnit: feature.limitUnit,
    tasteSample: feature.tasteSample,
  };
}

/**
 * Get the monthly budget cap for a user (max we'll spend serving them)
 */
export function getMonthlyBudgetCap(region: PricingRegion, plan: "free" | "plus" | "pro" | "family"): number {
  // Budget = subscription price * 0.4 (we keep 40% minimum margin)
  // After store cut (30%) and affiliate (up to 25%), we have ~50% of price
  // 40% of that 50% goes to costs = 20% of subscription price
  const PRICING_TABLE: Record<PricingRegion, Record<string, number>> = {
    standard: { free: 0, plus: 2.80, pro: 5.60, family: 9.00 },
    caribbean: { free: 0, plus: 0.60, pro: 1.00, family: 1.60 },
    central_america: { free: 0, plus: 0.60, pro: 1.20, family: 2.00 },
    south_america: { free: 0, plus: 0.80, pro: 1.60, family: 2.60 },
    africa: { free: 0, plus: 0.30, pro: 0.80, family: 1.40 },
    southeast_asia: { free: 0, plus: 0.60, pro: 1.20, family: 2.00 },
    south_asia: { free: 0, plus: 0.40, pro: 1.00, family: 1.60 },
    middle_east: { free: 0, plus: 0.80, pro: 1.60, family: 2.60 },
  };
  
  return PRICING_TABLE[region][plan] || 0;
}

/**
 * Get a summary of what a region's Plus plan emphasizes
 * (for marketing copy and feature comparison pages)
 */
export function getRegionPlanSummary(region: PricingRegion): {
  emphasis: string;
  topFeatures: string[];
  limitedFeatures: string[];
  premiumTaste: string[];
} {
  const summaries: Record<PricingRegion, ReturnType<typeof getRegionPlanSummary>> = {
    standard: {
      emphasis: "Full AI-powered learning experience",
      topFeatures: ["60 min AI voice conversations", "30 min live translation", "10 songs/week", "Unlimited content"],
      limitedFeatures: ["Voice cloning (Pro only)"],
      premiumTaste: ["Video calls with AI teacher", "Live dubbing"],
    },
    caribbean: {
      emphasis: "Unlimited lessons, exercises & voice memos from your AI teacher",
      topFeatures: ["Unlimited AI TV episodes", "15 voice memos/day from teacher", "30 text chats/day", "15 pronunciation checks/day", "Unlimited exercises & flashcards"],
      limitedFeatures: ["30 min AI voice conversation/month", "10 min live translation/month"],
      premiumTaste: ["5 min video call with AI teacher", "5 songs/week"],
    },
    central_america: {
      emphasis: "Unlimited lessons, exercises & voice memos from your AI teacher",
      topFeatures: ["Unlimited AI TV episodes", "15 voice memos/day from teacher", "30 text chats/day", "15 pronunciation checks/day", "Unlimited exercises & flashcards"],
      limitedFeatures: ["30 min AI voice conversation/month", "10 min live translation/month"],
      premiumTaste: ["5 min video call with AI teacher", "5 songs/week"],
    },
    south_america: {
      emphasis: "Rich content library + solid AI conversation time",
      topFeatures: ["Unlimited AI TV episodes", "12 voice memos/day", "40 text chats/day", "45 min AI voice/month", "7 songs/week"],
      limitedFeatures: ["15 min live translation/month", "8 min video call/month"],
      premiumTaste: ["URL translation", "Roleplay scenarios"],
    },
    africa: {
      emphasis: "Maximum content: lessons, exercises, voice memos & pronunciation practice",
      topFeatures: ["Unlimited AI TV episodes", "20 voice memos/day from teacher", "25 text chats/day", "20 pronunciation checks/day", "15 quizzes/day", "Unlimited exercises"],
      limitedFeatures: ["15 min AI voice conversation/month", "5 min live translation/month"],
      premiumTaste: ["3 min video call with AI teacher", "3 songs/week"],
    },
    southeast_asia: {
      emphasis: "Unlimited lessons, exercises & voice memos from your AI teacher",
      topFeatures: ["Unlimited AI TV episodes", "15 voice memos/day from teacher", "30 text chats/day", "15 pronunciation checks/day", "Unlimited exercises & flashcards"],
      limitedFeatures: ["30 min AI voice conversation/month", "10 min live translation/month"],
      premiumTaste: ["5 min video call with AI teacher", "5 songs/week"],
    },
    south_asia: {
      emphasis: "Maximum content: lessons, exercises, voice memos & pronunciation practice",
      topFeatures: ["Unlimited AI TV episodes", "20 voice memos/day from teacher", "25 text chats/day", "20 pronunciation checks/day", "15 quizzes/day", "Unlimited exercises"],
      limitedFeatures: ["15 min AI voice conversation/month", "5 min live translation/month"],
      premiumTaste: ["3 min video call with AI teacher", "3 songs/week"],
    },
    middle_east: {
      emphasis: "Rich content library + solid AI conversation time",
      topFeatures: ["Unlimited AI TV episodes", "12 voice memos/day", "40 text chats/day", "45 min AI voice/month", "7 songs/week"],
      limitedFeatures: ["15 min live translation/month", "8 min video call/month"],
      premiumTaste: ["URL translation", "Roleplay scenarios"],
    },
  };
  
  return summaries[region];
}
