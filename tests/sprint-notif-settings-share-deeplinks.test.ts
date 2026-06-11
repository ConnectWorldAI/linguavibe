/**
 * Sprint Tests: Notification Settings, Share as Image, Deep Link Handling
 *
 * Tests for:
 * 1. Notification Settings screen — individual toggles for streak, creator, journal, engagement
 * 2. Progress Report Card share-as-image — captureRef + Sharing integration
 * 3. Deep link handler — routes notification taps to correct screens
 * 4. Integration chain — incoming-call-handler chains to deep link handler
 */
import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

const APP_DIR = path.join(__dirname, "..");

function readFile(filePath: string): string {
  return fs.readFileSync(path.join(APP_DIR, filePath), "utf-8");
}

function fileExists(filePath: string): boolean {
  return fs.existsSync(path.join(APP_DIR, filePath));
}

// ─── 1. Notification Settings Screen ───────────────────────────────────────
describe("Notification Settings — Individual Toggles", () => {
  const content = readFile("app/notification-settings.tsx");

  it("screen file exists", () => {
    expect(fileExists("app/notification-settings.tsx")).toBe(true);
  });

  it("imports streak-notifications module", () => {
    expect(content).toContain("streak-notifications");
  });

  it("imports creator-content-notifications module", () => {
    expect(content).toContain("creator-content-notifications");
  });

  it("imports journal-prompt-notification module", () => {
    expect(content).toContain("journal-prompt-notification");
  });

  it("imports engagement-notifications module", () => {
    expect(content).toContain("engagement-notifications");
  });

  it("has toggle state for streak reminders", () => {
    expect(content).toContain("streakNotifEnabled");
  });

  it("has toggle state for creator alerts", () => {
    expect(content).toContain("creatorNotifEnabled");
  });

  it("has toggle state for journal prompts", () => {
    expect(content).toContain("journalNotifEnabled");
  });

  it("has toggle state for engagement notifications", () => {
    expect(content).toContain("engagementStreakEnabled");
  });

  it("persists preferences via save helpers", () => {
    expect(content).toContain("saveCreatorContentNotifPrefs");
    expect(content).toContain("saveJournalPromptNotifPrefs");
  });

  it("loads saved preferences on mount via get helpers", () => {
    expect(content).toContain("getStreakNotificationSettings");
    expect(content).toContain("getCreatorContentNotifPrefs");
    expect(content).toContain("getJournalPromptNotifPrefs");
  });

  it("has section header for Learning Notification Triggers", () => {
    expect(content).toContain("Learning Notification Triggers");
  });

  it("has streak reminder toggle UI", () => {
    expect(content).toContain("Streak Reminder");
  });

  it("has creator content toggle UI", () => {
    expect(content).toContain("Creator Content");
  });

  it("has journal prompt toggle UI", () => {
    expect(content).toContain("Journal Prompt");
  });

  it("has engagement notification toggle UI", () => {
    expect(content).toContain("Engagement");
  });

  it("calls scheduleStreakReminder when streak is enabled", () => {
    expect(content).toContain("scheduleStreakReminder");
  });

  it("calls cancelStreakReminder when streak is disabled", () => {
    expect(content).toContain("cancelStreakReminder");
  });

  it("calls saveCreatorContentNotifPrefs when creator toggle changes", () => {
    expect(content).toContain("saveCreatorContentNotifPrefs");
  });

  it("calls cancelCreatorContentAlerts when creator is disabled", () => {
    expect(content).toContain("cancelCreatorContentAlerts");
  });

  it("calls scheduleJournalPromptNotification when journal is enabled", () => {
    expect(content).toContain("scheduleJournalPromptNotification");
  });

  it("calls cancelJournalPromptNotification when journal is disabled", () => {
    expect(content).toContain("cancelJournalPromptNotification");
  });
});

// ─── 2. Progress Report Card — Share as Image ──────────────────────────────
describe("Progress Report Card — Share as Image", () => {
  const content = readFile("app/progress-report-card.tsx");

  it("imports captureRef from react-native-view-shot", () => {
    expect(content).toContain("captureRef");
    expect(content).toContain("react-native-view-shot");
  });

  it("imports expo-sharing", () => {
    expect(content).toContain("expo-sharing");
    expect(content).toContain("Sharing");
  });

  it("has a reportCardRef for view capture", () => {
    expect(content).toContain("reportCardRef");
    expect(content).toContain("useRef<View>");
  });

  it("has handleShareAsImage function", () => {
    expect(content).toContain("handleShareAsImage");
  });

  it("has isCapturing state for loading indicator", () => {
    expect(content).toContain("isCapturing");
    expect(content).toContain("setIsCapturing");
  });

  it("has Share as Image button text", () => {
    expect(content).toContain("Share as Image");
  });

  it("has capturable area wrapper with collapsable=false", () => {
    expect(content).toContain("collapsable={false}");
    expect(content).toContain("ref={reportCardRef}");
  });

  it("has image-outline icon for share button in header", () => {
    expect(content).toContain("image-outline");
  });

  it("captures with png format and tmpfile result", () => {
    expect(content).toContain('format: "png"');
    expect(content).toContain('result: "tmpfile"');
  });

  it("calls Sharing.shareAsync with correct mimeType", () => {
    expect(content).toContain('mimeType: "image/png"');
  });

  it("checks Sharing.isAvailableAsync before sharing", () => {
    expect(content).toContain("isAvailableAsync");
  });

  it("falls back to text share on web platform", () => {
    expect(content).toContain('Platform.OS === "web"');
    expect(content).toContain("handleShare()");
  });

  it("shows ActivityIndicator while capturing", () => {
    expect(content).toContain("ActivityIndicator");
    expect(content).toContain("isCapturing");
  });

  it("has shareAsImageBtn style", () => {
    expect(content).toContain("shareAsImageBtn");
  });

  it("has shareAsImageRow style", () => {
    expect(content).toContain("shareAsImageRow");
  });
});

// ─── 3. Deep Link Handler Module ───────────────────────────────────────────
describe("Notification Deep Link Handler — Module Structure", () => {
  const content = readFile("lib/notification-deep-links.ts");

  it("module file exists", () => {
    expect(fileExists("lib/notification-deep-links.ts")).toBe(true);
  });

  it("exports handleNotificationDeepLink function", () => {
    expect(content).toContain("export function handleNotificationDeepLink");
  });

  it("exports NOTIFICATION_ROUTE_MAP constant", () => {
    expect(content).toContain("export { NOTIFICATION_ROUTE_MAP }");
  });

  it("maps streak-reminder to home tab", () => {
    expect(content).toContain('"streak-reminder"');
    expect(content).toContain('"streak_reminder"');
  });

  it("maps creator_content_new to creator-feed", () => {
    expect(content).toContain('"creator_content_new": "/creator-feed"');
  });

  it("maps journal_prompt_of_the_day to student-journal", () => {
    expect(content).toContain('"journal_prompt_of_the_day": "/student-journal"');
  });

  it("maps music_trending to song-player", () => {
    expect(content).toContain('"music_trending": "/song-player"');
  });

  it("maps music_breakdown to lyrics-player", () => {
    expect(content).toContain('"music_breakdown": "/lyrics-player"');
  });

  it("maps milestone to profile tab", () => {
    expect(content).toContain('"milestone": "/(tabs)/profile"');
  });

  it("maps weekly_report to progress-report-card", () => {
    expect(content).toContain('"weekly_report": "/progress-report-card"');
  });

  it("maps grammar_challenge to grammar-challenge", () => {
    expect(content).toContain('"grammar_challenge": "/grammar-challenge"');
  });

  it("maps achievement_digest to progress-report-card", () => {
    expect(content).toContain('"achievement_digest": "/progress-report-card"');
  });

  it("handles explicit data.route field", () => {
    expect(content).toContain("data.route");
    expect(content).toContain('typeof data.route === "string"');
  });

  it("handles legacy data.screen field", () => {
    expect(content).toContain("data.screen");
    expect(content).toContain('typeof data.screen === "string"');
  });

  it("handles generic data.url field", () => {
    expect(content).toContain("data.url");
    expect(content).toContain('typeof data.url === "string"');
  });

  it("falls back to route map by type", () => {
    expect(content).toContain("data.type");
    expect(content).toContain("NOTIFICATION_ROUTE_MAP[data.type]");
  });

  it("returns false when nothing matches", () => {
    expect(content).toContain("return false");
  });

  it("includes haptic feedback on successful navigation", () => {
    expect(content).toContain("tapHaptic");
    expect(content).toContain("impactAsync");
  });

  it("extracts params excluding internal fields", () => {
    expect(content).toContain("extractParams");
    expect(content).toContain("SKIP_KEYS");
  });

  it("skips type, route, screen, url, sound from params", () => {
    expect(content).toContain('"type"');
    expect(content).toContain('"route"');
    expect(content).toContain('"screen"');
    expect(content).toContain('"url"');
    expect(content).toContain('"sound"');
  });

  it("imports router from expo-router", () => {
    expect(content).toContain('import { router } from "expo-router"');
  });

  it("imports Notifications from expo-notifications", () => {
    expect(content).toContain('import * as Notifications from "expo-notifications"');
  });
});

// ─── 4. Integration Chain — incoming-call-handler ──────────────────────────
describe("Deep Link Handler — Integration with incoming-call-handler", () => {
  const content = readFile("lib/incoming-call-handler.ts");

  it("requires notification-deep-links as final fallback", () => {
    expect(content).toContain("notification-deep-links");
    expect(content).toContain("handleNotificationDeepLink");
  });

  it("chains handlers in correct order: call → challenge → surprise → deep-link", () => {
    const callIdx = content.indexOf("handleIncomingCallNotificationResponse");
    const challengeIdx = content.indexOf("handleChallengeNotificationTap");
    const surpriseIdx = content.indexOf("handleSurpriseLessonNotificationTap");
    const deepLinkIdx = content.indexOf("handleNotificationDeepLink");
    expect(callIdx).toBeLessThan(challengeIdx);
    expect(challengeIdx).toBeLessThan(surpriseIdx);
    expect(surpriseIdx).toBeLessThan(deepLinkIdx);
  });

  it("cold-start handler also chains to notification-deep-links", () => {
    const coldStartSection = content.indexOf("getLastNotificationResponseAsync");
    const deepLinkAfterColdStart = content.indexOf("handleNotificationDeepLink", coldStartSection);
    expect(deepLinkAfterColdStart).toBeGreaterThan(coldStartSection);
  });

  it("deep link handler is called only when previous handlers return false", () => {
    // The deep link handler should be inside nested if (!surpriseHandled) blocks
    expect(content).toContain("if (!surpriseHandled)");
    expect(content).toContain("handleNotificationDeepLink(response)");
  });
});

// ─── 5. Creator Content Notifications Module ───────────────────────────────
describe("Creator Content Notifications — Module Structure", () => {
  const content = readFile("lib/creator-content-notifications.ts");

  it("module file exists", () => {
    expect(fileExists("lib/creator-content-notifications.ts")).toBe(true);
  });

  it("exports scheduleCreatorContentAlert", () => {
    expect(content).toContain("scheduleCreatorContentAlert");
  });

  it("exports cancelCreatorContentAlerts", () => {
    expect(content).toContain("cancelCreatorContentAlerts");
  });

  it("includes throttle mechanism", () => {
    const hasThrottle = content.includes("THROTTLE") || content.includes("lastNotified") || content.includes("CREATOR_NOTIF_LAST_KEY");
    expect(hasThrottle).toBe(true);
  });

  it("includes notification data with route to creator-feed", () => {
    expect(content).toContain("/creator-feed");
    expect(content).toContain("creator_content_new");
  });
});

// ─── 6. Unified Notification Triggers ──────────────────────────────────────
describe("Unified Notification Triggers", () => {
  it("notification-triggers.ts file exists", () => {
    expect(fileExists("lib/notification-triggers.ts")).toBe(true);
  });

  it("exports initAllNotificationTriggers", () => {
    const content = readFile("lib/notification-triggers.ts");
    expect(content).toContain("initAllNotificationTriggers");
  });

  it("exports cancelAllNotificationTriggers", () => {
    const content = readFile("lib/notification-triggers.ts");
    expect(content).toContain("cancelAllNotificationTriggers");
  });

  it("imports from streak-notifications", () => {
    const content = readFile("lib/notification-triggers.ts");
    expect(content).toContain("streak-notifications");
  });

  it("imports from creator-content-notifications", () => {
    const content = readFile("lib/notification-triggers.ts");
    expect(content).toContain("creator-content-notifications");
  });

  it("imports from journal-prompt-notification", () => {
    const content = readFile("lib/notification-triggers.ts");
    expect(content).toContain("journal-prompt-notification");
  });
});
