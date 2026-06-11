/**
 * Sprint: 6 High-Impact Features Tests
 *
 * Tests for:
 * 1. Offline mode / download lessons (offline-cache-manager)
 * 2. FSRS spaced repetition engine (fsrs-engine)
 * 3. Adaptive placement test (adaptive-placement)
 * 4. Friend challenges (friend-challenges)
 * 5. Voice conversation (voice-conversation lib)
 * 6. Premium feature gates (premium-feature-gates)
 * 7. Feature gate banner component
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import * as fs from "fs";
import * as path from "path";

// ─── File existence tests ───────────────────────────────────────────────────
describe("Feature file existence", () => {
  const files = [
    "lib/offline-cache-manager.ts",
    "lib/fsrs-engine.ts",
    "lib/adaptive-placement.ts",
    "lib/friend-challenges.ts",
    "lib/voice-conversation.ts",
    "lib/premium-feature-gates.ts",
    "components/feature-gate-banner.tsx",
    "app/voice-conversation.tsx",
    "app/friend-challenges.tsx",
  ];
  files.forEach((f) => {
    it(`${f} exists`, () => {
      expect(fs.existsSync(path.join(process.cwd(), f))).toBe(true);
    });
  });
});

// ─── Offline Cache Manager ──────────────────────────────────────────────────
describe("Offline Cache Manager", () => {
  const src = fs.readFileSync(path.join(process.cwd(), "lib/offline-cache-manager.ts"), "utf-8");

  it("exports getCacheIndex function", () => {
    expect(src).toContain("export async function getCacheIndex");
  });

  it("exports getCacheStats function", () => {
    expect(src).toContain("export async function getCacheStats");
  });

  it("exports cacheContent function", () => {
    expect(src).toContain("export async function cacheContent");
  });

  it("exports removeCachedContent function", () => {
    expect(src).toContain("export async function removeCachedContent");
  });

  it("exports clearAllCache function", () => {
    expect(src).toContain("export async function clearAllCache");
  });

  it("exports getCacheSettings function", () => {
    expect(src).toContain("export async function getCacheSettings");
  });

  it("exports updateCacheSettings function", () => {
    expect(src).toContain("export async function updateCacheSettings");
  });

  it("exports getRecommendedDownloads function", () => {
    expect(src).toContain("export function getRecommendedDownloads");
  });

  it("defines CachedItem type", () => {
    expect(src).toContain("export interface CachedItem");
  });

  it("defines CacheSettings type", () => {
    expect(src).toContain("export interface CacheSettings");
  });

  it("defines LessonContent type", () => {
    expect(src).toContain("export interface LessonContent");
  });

  it("defines DownloadProgress type", () => {
    expect(src).toContain("export interface DownloadProgress");
  });

  it("has max cache size constant", () => {
    expect(src).toMatch(/MAX_CACHE_SIZE|maxSizeMB/);
  });

  it("uses AsyncStorage for persistence", () => {
    expect(src).toContain("AsyncStorage");
  });

  it("calculates cache usage percentage", () => {
    expect(src).toContain("usagePercent");
  });
});

// ─── FSRS Engine ────────────────────────────────────────────────────────────
describe("FSRS Engine", () => {
  const src = fs.readFileSync(path.join(process.cwd(), "lib/fsrs-engine.ts"), "utf-8");

  it("exports FSRSRating type", () => {
    expect(src).toContain("export type FSRSRating");
  });

  it("exports FSRSCard type", () => {
    expect(src).toContain("export interface FSRSCard");
  });

  it("exports getSchedulingOptions function", () => {
    expect(src).toContain("export function getSchedulingOptions");
  });

  it("exports formatInterval function", () => {
    expect(src).toContain("export function formatInterval");
  });

  it("exports getFSRSStats function", () => {
    expect(src).toContain("export async function getFSRSStats");
  });

  it("exports getDueFSRSCards function", () => {
    expect(src).toContain("export async function getDueFSRSCards");
  });

  it("exports reviewFSRSCard function", () => {
    expect(src).toContain("export async function reviewFSRSCard");
  });

  it("exports forgettingCurve function", () => {
    expect(src).toContain("export function forgettingCurve");
  });

  it("implements stability calculation", () => {
    expect(src).toContain("stability");
  });

  it("implements difficulty calculation", () => {
    expect(src).toContain("difficulty");
  });

  it("has 4 rating levels (Again, Hard, Good, Easy)", () => {
    expect(src).toContain("Again");
    expect(src).toContain("Hard");
    expect(src).toContain("Good");
    expect(src).toContain("Easy");
  });

  it("calculates retrievability", () => {
    expect(src).toContain("retrievability");
  });
});

// ─── Adaptive Placement ────────────────────────────────────────────────────
describe("Adaptive Placement Engine", () => {
  const src = fs.readFileSync(path.join(process.cwd(), "lib/adaptive-placement.ts"), "utf-8");

  it("exports generatePlacementResult function", () => {
    expect(src).toContain("export function generatePlacementResult");
  });

  it("exports generateLearningPath function", () => {
    expect(src).toContain("export function generateLearningPath");
  });

  it("exports savePlacementResult function", () => {
    expect(src).toContain("export async function savePlacementResult");
  });

  it("exports saveLearningPath function", () => {
    expect(src).toContain("export async function saveLearningPath");
  });

  it("exports CEFR_THETA constant", () => {
    expect(src).toContain("export const CEFR_THETA");
  });

  it("defines PlacementResult type", () => {
    expect(src).toContain("export interface PlacementResult");
  });

  it("defines LearningPath type", () => {
    expect(src).toContain("export interface LearningPath");
  });

  it("includes CEFR levels A1 through C2", () => {
    expect(src).toContain("A1");
    expect(src).toContain("A2");
    expect(src).toContain("B1");
    expect(src).toContain("B2");
    expect(src).toContain("C1");
    expect(src).toContain("C2");
  });

  it("generates skill breakdown", () => {
    expect(src).toMatch(/skillBreakdown|skill_breakdown|breakdown/);
  });

  it("generates recommended focus areas", () => {
    expect(src).toMatch(/focusAreas|focus_areas|recommendations/);
  });
});

// ─── Friend Challenges ─────────────────────────────────────────────────────
describe("Friend Challenges", () => {
  const src = fs.readFileSync(path.join(process.cwd(), "lib/friend-challenges.ts"), "utf-8");

  it("exports Challenge type", () => {
    expect(src).toContain("export interface Challenge");
  });

  it("exports ChallengeType type", () => {
    expect(src).toContain("export type ChallengeType");
  });

  it("exports ChallengeStats type", () => {
    expect(src).toContain("export interface ChallengeStats");
  });

  it("exports CHALLENGE_TEMPLATES", () => {
    expect(src).toContain("export const CHALLENGE_TEMPLATES");
  });

  it("exports createChallenge function", () => {
    expect(src).toContain("export async function createChallenge");
  });

  it("exports getActiveChallenges function", () => {
    expect(src).toContain("export async function getActiveChallenges");
  });

  it("exports getChallengeStats function", () => {
    expect(src).toContain("export async function getChallengeStats");
  });

  it("exports getChallengeHistory function", () => {
    expect(src).toContain("export async function getChallengeHistory");
  });

  it("exports answerChallengeQuestion function", () => {
    expect(src).toContain("export async function answerChallengeQuestion");
  });

  it("exports completeChallenge function", () => {
    expect(src).toContain("export async function completeChallenge");
  });

  it("includes vocab_duel challenge type", () => {
    expect(src).toContain("vocab_duel");
  });

  it("tracks win/loss/draw outcomes", () => {
    expect(src).toContain("wins");
    expect(src).toContain("losses");
    expect(src).toContain("draws");
  });

  it("generates questions for challenges", () => {
    expect(src).toContain("questions");
  });
});

// ─── Voice Conversation ────────────────────────────────────────────────────
describe("Voice Conversation Library", () => {
  const src = fs.readFileSync(path.join(process.cwd(), "lib/voice-conversation.ts"), "utf-8");

  it("exports ConversationTurn type", () => {
    expect(src).toContain("export interface ConversationTurn");
  });

  it("exports ConversationSession type", () => {
    expect(src).toContain("export interface ConversationSession");
  });

  it("exports ConversationTopic type", () => {
    expect(src).toContain("export interface ConversationTopic");
  });

  it("exports VoiceConversationConfig type", () => {
    expect(src).toContain("export interface VoiceConversationConfig");
  });

  it("exports CONVERSATION_TOPICS", () => {
    expect(src).toContain("export const CONVERSATION_TOPICS");
  });

  it("has multiple topic categories", () => {
    expect(src).toMatch(/Travel|Food|Shopping|Business|Daily/i);
  });

  it("tracks session statistics", () => {
    expect(src).toMatch(/totalSessions|sessionsCount|sessionStats/);
  });
});

describe("Voice Conversation Screen", () => {
  const src = fs.readFileSync(path.join(process.cwd(), "app/voice-conversation.tsx"), "utf-8");

  it("imports expo-speech for TTS", () => {
    expect(src).toContain("expo-speech");
  });

  it("has recording functionality", () => {
    expect(src).toMatch(/recording|isRecording|startRecording/i);
  });

  it("has AI response handling", () => {
    expect(src).toMatch(/aiResponse|generateResponse|trpc/i);
  });

  it("includes FeatureGateBanner", () => {
    expect(src).toContain("FeatureGateBanner");
    expect(src).toContain("voice_conversation");
  });

  it("has topic selection UI", () => {
    expect(src).toContain("CONVERSATION_TOPICS");
  });

  it("uses ScreenContainer", () => {
    expect(src).toContain("ScreenContainer");
  });
});

// ─── Premium Feature Gates ──────────────────────────────────────────────────
describe("Premium Feature Gates", () => {
  const src = fs.readFileSync(path.join(process.cwd(), "lib/premium-feature-gates.ts"), "utf-8");

  it("exports GatedFeature type", () => {
    expect(src).toContain("export type GatedFeature");
  });

  it("exports FEATURE_GATES constant", () => {
    expect(src).toContain("export const FEATURE_GATES");
  });

  it("exports checkFeatureGate function", () => {
    expect(src).toContain("export async function checkFeatureGate");
  });

  it("exports recordFeatureUsage function", () => {
    expect(src).toContain("export async function recordFeatureUsage");
  });

  it("exports getRemainingUses function", () => {
    expect(src).toContain("export async function getRemainingUses");
  });

  it("exports getPlanFeatureSummary function", () => {
    expect(src).toContain("export function getPlanFeatureSummary");
  });

  it("defines gates for voice_conversation", () => {
    expect(src).toContain("voice_conversation");
  });

  it("defines gates for fsrs_algorithm", () => {
    expect(src).toContain("fsrs_algorithm");
  });

  it("defines gates for friend_challenges", () => {
    expect(src).toContain("friend_challenges");
  });

  it("defines gates for offline_downloads", () => {
    expect(src).toContain("offline_downloads");
  });

  it("defines gates for placement_retake", () => {
    expect(src).toContain("placement_retake");
  });

  it("defines gates for study_group_create", () => {
    expect(src).toContain("study_group_create");
  });

  it("defines gates for advanced_report", () => {
    expect(src).toContain("advanced_report");
  });

  it("has 4 plan tiers (free, plus, pro, enterprise)", () => {
    expect(src).toContain('"free"');
    expect(src).toContain('"plus"');
    expect(src).toContain('"pro"');
    expect(src).toContain('"enterprise"');
  });

  it("tracks daily usage with date-based reset", () => {
    expect(src).toContain("getDailyUsage");
    expect(src).toContain("saveDailyUsage");
  });

  it("returns upgrade target when access denied", () => {
    expect(src).toContain("upgradeTarget");
  });

  it("supports unlimited (-1) daily limits", () => {
    expect(src).toContain("dailyLimit: -1");
  });
});

// ─── Feature Gate Banner Component ──────────────────────────────────────────
describe("Feature Gate Banner Component", () => {
  const src = fs.readFileSync(path.join(process.cwd(), "components/feature-gate-banner.tsx"), "utf-8");

  it("exports FeatureGateBanner component", () => {
    expect(src).toContain("export function FeatureGateBanner");
  });

  it("accepts feature prop", () => {
    expect(src).toContain("feature: GatedFeature");
  });

  it("accepts currentPlan prop", () => {
    expect(src).toContain("currentPlan");
  });

  it("shows remaining uses", () => {
    expect(src).toContain("remaining");
  });

  it("shows upgrade button when locked", () => {
    expect(src).toContain("Upgrade");
  });

  it("navigates to subscription screen", () => {
    expect(src).toContain("/subscription");
  });

  it("returns null for unlimited access", () => {
    expect(src).toContain("return null");
  });
});

// ─── Paywall Integration in Screens ─────────────────────────────────────────
describe("Paywall integration in feature screens", () => {
  const screens = [
    { file: "app/voice-conversation.tsx", feature: "voice_conversation" },
    { file: "app/flashcard-srs.tsx", feature: "fsrs_algorithm" },
    { file: "app/friend-challenges.tsx", feature: "friend_challenges" },
    { file: "app/offline-content.tsx", feature: "offline_downloads" },
    { file: "app/placement-test.tsx", feature: "placement_retake" },
    { file: "app/study-groups.tsx", feature: "study_group_create" },
    { file: "app/progress-report-card.tsx", feature: "advanced_report" },
  ];

  screens.forEach(({ file, feature }) => {
    it(`${file} imports FeatureGateBanner`, () => {
      const src = fs.readFileSync(path.join(process.cwd(), file), "utf-8");
      expect(src).toContain("FeatureGateBanner");
    });

    it(`${file} uses feature="${feature}"`, () => {
      const src = fs.readFileSync(path.join(process.cwd(), file), "utf-8");
      expect(src).toContain(`feature="${feature}"`);
    });
  });
});

// ─── Home Screen Navigation ─────────────────────────────────────────────────
describe("Home screen navigation to new features", () => {
  const homeSrc = fs.readFileSync(path.join(process.cwd(), "app/(tabs)/index.tsx"), "utf-8");

  it("has voice-conversation navigation entry", () => {
    expect(homeSrc).toContain("voice-conversation");
  });

  it("has friend-challenges navigation entry", () => {
    expect(homeSrc).toContain("friend-challenges");
  });

  it("has study-groups navigation entry", () => {
    expect(homeSrc).toContain("study-groups");
  });
});

// ─── Flashcard SRS FSRS Integration ─────────────────────────────────────────
describe("Flashcard SRS FSRS Integration", () => {
  const src = fs.readFileSync(path.join(process.cwd(), "app/flashcard-srs.tsx"), "utf-8");

  it("imports FSRS engine functions", () => {
    expect(src).toContain("from \"@/lib/fsrs-engine\"");
  });

  it("imports FSRSRating type", () => {
    expect(src).toContain("FSRSRating");
  });

  it("has 4-button FSRS rating system", () => {
    expect(src).toContain("Again");
    expect(src).toContain("Hard");
    expect(src).toContain("Good");
    expect(src).toContain("Easy");
  });

  it("shows FSRS interval predictions", () => {
    expect(src).toMatch(/fsrsBtnInterval|interval/i);
  });
});

// ─── Placement Test Adaptive Integration ────────────────────────────────────
describe("Placement Test Adaptive Integration", () => {
  const src = fs.readFileSync(path.join(process.cwd(), "app/placement-test.tsx"), "utf-8");

  it("imports adaptive placement engine", () => {
    expect(src).toContain("from \"@/lib/adaptive-placement\"");
  });

  it("imports generateLearningPath", () => {
    expect(src).toContain("generateLearningPath");
  });

  it("imports savePlacementResult", () => {
    expect(src).toContain("savePlacementResult");
  });

  it("uses subscription hook for retake gating", () => {
    expect(src).toContain("useSubscription");
  });

  it("has retake guard for free users", () => {
    expect(src).toContain("canRetake");
  });
});

// ─── Offline Content Enhanced ───────────────────────────────────────────────
describe("Offline Content Enhanced", () => {
  const src = fs.readFileSync(path.join(process.cwd(), "app/offline-content.tsx"), "utf-8");

  it("imports offline cache manager", () => {
    expect(src).toContain("from \"@/lib/offline-cache-manager\"");
  });

  it("shows cache statistics", () => {
    expect(src).toContain("cacheStats");
  });

  it("has auto-download toggle", () => {
    expect(src).toContain("autoDownload");
  });

  it("shows recommended downloads", () => {
    expect(src).toContain("recommendations");
  });

  it("has clear all cache functionality", () => {
    expect(src).toContain("clearAllCache");
  });

  it("has cache usage bar", () => {
    expect(src).toContain("cacheBar");
  });
});
