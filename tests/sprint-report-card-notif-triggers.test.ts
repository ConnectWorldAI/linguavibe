/**
 * Sprint Tests: Progress Report Card Real Data + Notification Triggers + Navigation Wiring
 *
 * Validates:
 * 1. Progress Report Card loads real data from AsyncStorage
 * 2. Creator content notification trigger module
 * 3. Unified notification triggers initialization
 * 4. Server-side ingestion notification trigger
 * 5. Navigation entry points for all 9 new feature screens
 */
import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

const APP_DIR = path.join(__dirname, "..");

// ─── Helper: Read file content ───────────────────────────────────────────────
function readFile(filePath: string): string {
  return fs.readFileSync(path.join(APP_DIR, filePath), "utf-8");
}

function fileExists(filePath: string): boolean {
  return fs.existsSync(path.join(APP_DIR, filePath));
}

// ─── 1. Progress Report Card — Real Data Integration ─────────────────────────
describe("Progress Report Card — Real Data", () => {
  const reportCard = readFile("app/progress-report-card.tsx");

  it("imports createVanillaClient for tRPC calls", () => {
    expect(reportCard).toContain("createVanillaClient");
  });

  it("reads flashcard data from AsyncStorage", () => {
    expect(reportCard).toContain("linguavibe_flashcards");
    expect(reportCard).toContain("AsyncStorage.getItem(FLASHCARD_KEY)");
  });

  it("reads journal data from AsyncStorage", () => {
    expect(reportCard).toContain("linguavibe_journal_entries");
    expect(reportCard).toContain("AsyncStorage.getItem(JOURNAL_KEY)");
  });

  it("reads gamification data from AsyncStorage", () => {
    expect(reportCard).toContain("linguavibe_gamification");
    expect(reportCard).toContain("AsyncStorage.getItem(GAMIFICATION_KEY)");
  });

  it("has loadRealStats function that returns RealStats interface", () => {
    expect(reportCard).toContain("async function loadRealStats(): Promise<RealStats>");
    expect(reportCard).toContain("interface RealStats");
  });

  it("has buildReportFromStats function that computes skill scores", () => {
    expect(reportCard).toContain("function buildReportFromStats(stats: RealStats): TermReport");
    expect(reportCard).toContain("vocabScore");
    expect(reportCard).toContain("grammarScore");
    expect(reportCard).toContain("speakingScore");
    expect(reportCard).toContain("pronunciationScore");
  });

  it("computes flashcard accuracy from timesCorrect/timesIncorrect", () => {
    expect(reportCard).toContain("timesCorrect");
    expect(reportCard).toContain("timesIncorrect");
    expect(reportCard).toContain("flashcardAccuracy");
  });

  it("computes flashcards mastered (box >= 5)", () => {
    expect(reportCard).toContain("box >= 5");
    expect(reportCard).toContain("flashcardsMastered");
  });

  it("has AI Weekly Insight section using tRPC gamification.getMotivation", () => {
    expect(reportCard).toContain("gamification.getMotivation.query");
    expect(reportCard).toContain("AI Weekly Insight");
    expect(reportCard).toContain("aiInsight");
  });

  it("has Live Learning Stats grid with real data", () => {
    expect(reportCard).toContain("Live Learning Stats");
    expect(reportCard).toContain("realStats.flashcardsTotal");
    expect(reportCard).toContain("realStats.flashcardsMastered");
    expect(reportCard).toContain("realStats.journalEntries");
    expect(reportCard).toContain("realStats.currentStreak");
    expect(reportCard).toContain("realStats.flashcardAccuracy");
    expect(reportCard).toContain("realStats.flashcardsDueToday");
  });

  it("has realStatsCard styles in StyleSheet", () => {
    expect(reportCard).toContain("realStatsCard:");
    expect(reportCard).toContain("realStatsGrid:");
    expect(reportCard).toContain("realStatItem:");
    expect(reportCard).toContain("realStatValue:");
    expect(reportCard).toContain("realStatLabel:");
  });

  it("has loading state for AI insight", () => {
    expect(reportCard).toContain("loadingInsight");
    expect(reportCard).toContain("ActivityIndicator");
  });

  it("has fallback data in case real data loading fails", () => {
    expect(reportCard).toContain("FALLBACK_TERM");
  });

  it("calls loadLiveData on mount", () => {
    expect(reportCard).toContain("loadLiveData()");
    expect(reportCard).toContain("useEffect");
  });
});

// ─── 2. Creator Content Notification Trigger ─────────────────────────────────
describe("Creator Content Notifications", () => {
  it("creator-content-notifications.ts exists", () => {
    expect(fileExists("lib/creator-content-notifications.ts")).toBe(true);
  });

  const creatorNotif = readFile("lib/creator-content-notifications.ts");

  it("exports scheduleCreatorContentAlert function", () => {
    expect(creatorNotif).toContain("export async function scheduleCreatorContentAlert");
  });

  it("exports cancelCreatorContentAlerts function", () => {
    expect(creatorNotif).toContain("export async function cancelCreatorContentAlerts");
  });

  it("exports preference getters and setters", () => {
    expect(creatorNotif).toContain("export async function getCreatorContentNotifPrefs");
    expect(creatorNotif).toContain("export async function saveCreatorContentNotifPrefs");
  });

  it("has CreatorContentPayload interface with required fields", () => {
    expect(creatorNotif).toContain("interface CreatorContentPayload");
    expect(creatorNotif).toContain("creatorId: string");
    expect(creatorNotif).toContain("creatorName: string");
    expect(creatorNotif).toContain("platform: string");
    expect(creatorNotif).toContain("language: string");
    expect(creatorNotif).toContain("contentCount: number");
  });

  it("has notification templates with dynamic variables", () => {
    expect(creatorNotif).toContain("CREATOR_TEMPLATES");
    expect(creatorNotif).toContain("{creatorName}");
    expect(creatorNotif).toContain("{language}");
    expect(creatorNotif).toContain("{contentCount}");
  });

  it("checks followed creators via AsyncStorage", () => {
    expect(creatorNotif).toContain("connectworld_followed_influencers");
    expect(creatorNotif).toContain("getFollowedCreatorIds");
  });

  it("has throttle mechanism (6-hour cooldown per creator)", () => {
    expect(creatorNotif).toContain("6 * 60 * 60 * 1000");
    expect(creatorNotif).toContain("CREATOR_NOTIF_LAST_KEY");
  });

  it("uses expo-notifications for scheduling", () => {
    expect(creatorNotif).toContain("expo-notifications");
    expect(creatorNotif).toContain("scheduleNotificationAsync");
  });

  it("tags notifications with type creator_content_new", () => {
    expect(creatorNotif).toContain("creator_content_new");
  });

  it("has followedOnly preference option", () => {
    expect(creatorNotif).toContain("followedOnly");
  });
});

// ─── 3. Unified Notification Triggers ────────────────────────────────────────
describe("Unified Notification Triggers", () => {
  it("notification-triggers.ts exists", () => {
    expect(fileExists("lib/notification-triggers.ts")).toBe(true);
  });

  const triggers = readFile("lib/notification-triggers.ts");

  it("exports initAllNotificationTriggers function", () => {
    expect(triggers).toContain("export async function initAllNotificationTriggers");
  });

  it("exports cancelAllNotificationTriggers function", () => {
    expect(triggers).toContain("export async function cancelAllNotificationTriggers");
  });

  it("re-exports streak notification functions", () => {
    expect(triggers).toContain("scheduleStreakReminder");
    expect(triggers).toContain("cancelStreakReminder");
    expect(triggers).toContain("markTodayAsPracticed");
  });

  it("re-exports journal prompt notification functions", () => {
    expect(triggers).toContain("scheduleJournalPromptNotification");
    expect(triggers).toContain("cancelJournalPromptNotification");
    expect(triggers).toContain("initJournalPromptNotification");
  });

  it("re-exports creator content notification functions", () => {
    expect(triggers).toContain("scheduleCreatorContentAlert");
    expect(triggers).toContain("cancelCreatorContentAlerts");
  });

  it("re-exports engagement notification functions", () => {
    expect(triggers).toContain("initEngagementNotifications");
    expect(triggers).toContain("scheduleMusicAlert");
    expect(triggers).toContain("scheduleMilestoneAlert");
  });

  it("reads gamification state from AsyncStorage for initialization", () => {
    expect(triggers).toContain("linguavibe_gamification");
    expect(triggers).toContain("currentStreak");
    expect(triggers).toContain("lessonsCompleted");
  });

  it("reads language preferences for initialization", () => {
    expect(triggers).toContain("@language_preferences");
    expect(triggers).toContain("targetLanguage");
  });

  it("returns status object with scheduling results", () => {
    expect(triggers).toContain("streakScheduled");
    expect(triggers).toContain("journalScheduled");
    expect(triggers).toContain("engagementScheduled");
  });
});

// ─── 4. Server-Side Ingestion Notification ───────────────────────────────────
describe("Server-Side Ingestion Notification", () => {
  it("ingestionNotificationTrigger.ts exists", () => {
    expect(fileExists("server/ingestionNotificationTrigger.ts")).toBe(true);
  });

  const ingestionNotif = readFile("server/ingestionNotificationTrigger.ts");

  it("exports notifyIngestionResults function", () => {
    expect(ingestionNotif).toContain("export async function notifyIngestionResults");
  });

  it("imports notifyOwner from notification module", () => {
    expect(ingestionNotif).toContain("notifyOwner");
    expect(ingestionNotif).toContain("./_core/notification");
  });

  it("has IngestionNotificationPayload interface", () => {
    expect(ingestionNotif).toContain("interface IngestionNotificationPayload");
    expect(ingestionNotif).toContain("channelsChecked");
    expect(ingestionNotif).toContain("newContentFound");
    expect(ingestionNotif).toContain("successfullyIngested");
    expect(ingestionNotif).toContain("channelsWithNewContent");
  });

  it("only fires when successfullyIngested > 0", () => {
    expect(ingestionNotif).toContain("payload.successfullyIngested === 0");
  });

  it("includes channel names in notification content", () => {
    expect(ingestionNotif).toContain("channelsWithNewContent.join");
  });

  // Verify autoIngestScheduler wires the notification
  const scheduler = readFile("server/autoIngestScheduler.ts");

  it("autoIngestScheduler imports notifyIngestionResults", () => {
    expect(scheduler).toContain("notifyIngestionResults");
    expect(scheduler).toContain("./ingestionNotificationTrigger");
  });

  it("autoIngestScheduler calls notifyIngestionResults after successful ingestion", () => {
    expect(scheduler).toContain("await notifyIngestionResults({");
    expect(scheduler).toContain("results.successfullyIngested > 0");
  });
});

// ─── 5. Navigation Entry Points for 9 New Feature Screens ───────────────────
describe("Navigation Entry Points — Home Screen", () => {
  const homeScreen = readFile("app/(tabs)/index.tsx");

  const featureScreens = [
    { name: "Conversation Phrasebook", route: "conversation-phrasebook" },
    { name: "Translation Widget", route: "translation-widget" },
    { name: "Multi-language Journal", route: "multi-language-journal" },
    { name: "Flashcard SRS", route: "flashcard-srs" },
    { name: "Pronunciation Scoring", route: "pronunciation-scoring" },
    { name: "Daily Streak", route: "daily-streak" },
    { name: "Creator Content Feed", route: "creator-feed" },
    { name: "Phrase Collections", route: "phrase-collections" },
    { name: "Share Lyrics Stories", route: "share-lyrics-stories" },
  ];

  for (const screen of featureScreens) {
    it(`has navigation entry point for ${screen.name}`, () => {
      expect(homeScreen).toContain(screen.route);
    });
  }

  it("all 9 feature screen files exist", () => {
    const screenFiles = [
      "app/conversation-phrasebook.tsx",
      "app/translation-widget.tsx",
      "app/multi-language-journal.tsx",
      "app/flashcard-srs.tsx",
      "app/pronunciation-scoring.tsx",
      "app/daily-streak.tsx",
      "app/creator-feed.tsx",
      "app/phrase-collections.tsx",
      "app/share-lyrics-stories.tsx",
    ];
    for (const file of screenFiles) {
      expect(fileExists(file)).toBe(true);
    }
  });
});

// ─── 6. Progress Report Card Screen File Integrity ───────────────────────────
describe("Progress Report Card — File Integrity", () => {
  const reportCard = readFile("app/progress-report-card.tsx");

  it("exports a default function component", () => {
    expect(reportCard).toContain("export default function ProgressReportCardScreen");
  });

  it("uses SafeAreaView for safe rendering", () => {
    expect(reportCard).toContain("SafeAreaView");
  });

  it("has share functionality", () => {
    expect(reportCard).toContain("handleShare");
    expect(reportCard).toContain("Share.share");
  });

  it("has term selector for switching between terms", () => {
    expect(reportCard).toContain("termSelector");
    expect(reportCard).toContain("selectedTerm");
  });

  it("has growth chart section", () => {
    expect(reportCard).toContain("Growth Over Time");
    expect(reportCard).toContain("growthBars");
  });

  it("has achievements section", () => {
    expect(reportCard).toContain("Achievements Earned");
    expect(reportCard).toContain("ACHIEVEMENTS");
  });

  it("has monthly comparison section", () => {
    expect(reportCard).toContain("This Month vs Last Month");
    expect(reportCard).toContain("MONTHLY_SUMMARY");
  });
});
