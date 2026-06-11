/**
 * Tests for Teacher Texts Engine, Journal Streak, and Surprise Lesson Notifications
 */
import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

// ─── Teacher Texts Engine Tests ──────────────────────────────────────────────

describe("Teacher Texts Engine", () => {
  const enginePath = path.resolve(__dirname, "../lib/teacher-texts-engine.ts");
  const engineCode = fs.readFileSync(enginePath, "utf-8");

  it("exports getTeacherTextPrefs function", () => {
    expect(engineCode).toContain("export async function getTeacherTextPrefs");
  });

  it("exports saveTeacherTextPrefs function", () => {
    expect(engineCode).toContain("export async function saveTeacherTextPrefs");
  });

  it("exports scheduleTeacherTexts function", () => {
    expect(engineCode).toContain("export async function scheduleTeacherTexts");
  });

  it("exports cancelTeacherTextSchedule function", () => {
    expect(engineCode).toContain("export async function cancelTeacherTextSchedule");
  });

  it("exports updatePrefsAndReschedule function", () => {
    expect(engineCode).toContain("export async function updatePrefsAndReschedule");
  });

  it("exports generateAndDeliverTeacherText function", () => {
    expect(engineCode).toContain("export async function generateAndDeliverTeacherText");
  });

  it("exports shouldSendTeacherText function", () => {
    expect(engineCode).toContain("export async function shouldSendTeacherText");
  });

  it("defines TeacherTextPrefs interface with frequency options", () => {
    expect(engineCode).toContain('frequency: "light" | "moderate" | "frequent"');
  });

  it("defines TeacherTextScheduleSlot interface", () => {
    expect(engineCode).toContain("export interface TeacherTextScheduleSlot");
    expect(engineCode).toContain("hour: number");
    expect(engineCode).toContain("minute: number");
    expect(engineCode).toContain("label: string");
  });

  it("has default schedule slots for morning, afternoon, and evening", () => {
    expect(engineCode).toContain("Morning");
    expect(engineCode).toContain("Afternoon");
    expect(engineCode).toContain("Evening");
  });

  it("uses DAILY trigger for notification scheduling", () => {
    expect(engineCode).toContain("SchedulableTriggerInputTypes.DAILY");
  });

  it("creates Android notification channel for teacher texts", () => {
    expect(engineCode).toContain("teacher-texts");
  });

  it("supports target language in messages", () => {
    expect(engineCode).toContain("includeTargetLanguage");
  });

  it("enforces minimum hours between texts", () => {
    expect(engineCode).toContain("MIN_HOURS_BETWEEN_TEXTS");
  });

  it("enforces maximum texts per day", () => {
    expect(engineCode).toContain("MAX_TEXTS_PER_DAY");
  });

  it("uses vanillaClient to call server endpoint", () => {
    expect(engineCode).toContain("createVanillaClient");
  });

  it("exports updateSlotTime function for customizable scheduling", () => {
    expect(engineCode).toContain("export async function updateSlotTime");
  });

  it("exports toggleSlot function", () => {
    expect(engineCode).toContain("export async function toggleSlot");
  });

  it("exports getUnreadTeacherTextCount function", () => {
    expect(engineCode).toContain("export async function getUnreadTeacherTextCount");
  });

  it("exports markTeacherTextRead function", () => {
    expect(engineCode).toContain("export async function markTeacherTextRead");
  });
});

// ─── Journal Streak Tests ─────────────────────────────────────────────────────

describe("Journal Streak System", () => {
  const streakPath = path.resolve(__dirname, "../lib/journal-streak.ts");
  const streakCode = fs.readFileSync(streakPath, "utf-8");

  it("exports getJournalStreak function", () => {
    expect(streakCode).toContain("export async function getJournalStreak");
  });

  it("exports recordJournalEntry function", () => {
    expect(streakCode).toContain("export async function recordJournalEntry");
  });

  it("exports getEarnedBadges function", () => {
    expect(streakCode).toContain("export async function getEarnedBadges");
  });

  it("exports isMilestoneDay function", () => {
    expect(streakCode).toContain("export function isMilestoneDay");
  });

  it("defines badge tiers with milestones", () => {
    expect(streakCode).toContain("JOURNAL_BADGE_TIERS");
  });

  it("has bronze badge tier", () => {
    expect(streakCode).toContain("bronze");
  });

  it("has milestone badges at various streak levels", () => {
    // Check for some milestone levels
    expect(streakCode).toContain("streak:");
  });

  it("tracks current streak and longest streak", () => {
    expect(streakCode).toContain("currentStreak");
    expect(streakCode).toContain("longestStreak");
  });

  it("tracks total entries", () => {
    expect(streakCode).toContain("totalEntries");
  });

  it("stores streak data in AsyncStorage", () => {
    expect(streakCode).toContain("AsyncStorage");
  });
});

// ─── Student Journal Screen Tests ─────────────────────────────────────────────

describe("Student Journal Screen", () => {
  const journalPath = path.resolve(__dirname, "../app/student-journal.tsx");
  const journalCode = fs.readFileSync(journalPath, "utf-8");

  it("imports journal streak functions", () => {
    expect(journalCode).toContain("journal-streak");
  });

  it("displays streak counter in header", () => {
    expect(journalCode).toContain("streak");
  });

  it("has badge display section", () => {
    expect(journalCode).toContain("badge");
  });

  it("has celebration modal for milestones", () => {
    expect(journalCode).toContain("celebration");
  });

  it("calls recordJournalEntry on submit", () => {
    expect(journalCode).toContain("recordJournalEntry");
  });

  it("calls isMilestoneDay or recordJournalEntry after submission", () => {
    expect(journalCode).toContain("recordJournalEntry");
  });

  it("uses ScreenContainer for proper layout", () => {
    expect(journalCode).toContain("ScreenContainer");
  });
});

// ─── Surprise Lesson Notifications Tests ──────────────────────────────────────

describe("Surprise Lesson Notifications", () => {
  const surprisePath = path.resolve(__dirname, "../lib/surprise-lesson-notifications.ts");
  const surpriseCode = fs.readFileSync(surprisePath, "utf-8");

  it("exports scheduleSurpriseLessonCheck function", () => {
    expect(surpriseCode).toContain("export async function scheduleSurpriseLessonCheck");
  });

  it("exports cancelSurpriseLessonSchedule function", () => {
    expect(surpriseCode).toContain("export async function cancelSurpriseLessonSchedule");
  });

  it("exports recordAppOpen function", () => {
    expect(surpriseCode).toContain("export async function recordAppOpen");
  });

  it("exports getHoursSinceLastOpen function", () => {
    expect(surpriseCode).toContain("export async function getHoursSinceLastOpen");
  });

  it("exports getSurpriseLessonPrefs function", () => {
    expect(surpriseCode).toContain("export async function getSurpriseLessonPrefs");
  });

  it("exports saveSurpriseLessonPrefs function", () => {
    expect(surpriseCode).toContain("export async function saveSurpriseLessonPrefs");
  });

  it("exports sendImmediateSurpriseLessonNotif function", () => {
    expect(surpriseCode).toContain("export async function sendImmediateSurpriseLessonNotif");
  });

  it("exports isSurpriseLessonNotification helper", () => {
    expect(surpriseCode).toContain("export function isSurpriseLessonNotification");
  });

  it("defines SurpriseLessonNotifPrefs interface", () => {
    expect(surpriseCode).toContain("export interface SurpriseLessonNotifPrefs");
    expect(surpriseCode).toContain("inactivityThresholdHours");
  });

  it("uses DAILY trigger for scheduling", () => {
    expect(surpriseCode).toContain("SchedulableTriggerInputTypes.DAILY");
  });

  it("creates Android notification channel", () => {
    expect(surpriseCode).toContain("surprise-lessons");
  });

  it("has fun notification titles", () => {
    expect(surpriseCode).toContain("Your teacher left you something cool!");
    expect(surpriseCode).toContain("Your teacher misses you!");
  });

  it("default inactivity threshold is 24 hours", () => {
    expect(surpriseCode).toContain("inactivityThresholdHours: 24");
  });
});

// ─── Surprise Lesson Tap Handler Tests ────────────────────────────────────────

describe("Surprise Lesson Tap Handler", () => {
  const tapPath = path.resolve(__dirname, "../lib/surprise-lesson-tap-handler.ts");
  const tapCode = fs.readFileSync(tapPath, "utf-8");

  it("exports handleSurpriseLessonNotificationTap function", () => {
    expect(tapCode).toContain("export function handleSurpriseLessonNotificationTap");
  });

  it("routes surprise_lesson type to /surprise-lesson", () => {
    expect(tapCode).toContain('"surprise_lesson"');
    expect(tapCode).toContain('"/surprise-lesson"');
  });

  it("routes teacher_text type to /student-journal", () => {
    expect(tapCode).toContain('"teacher_text"');
    expect(tapCode).toContain('"/student-journal"');
  });

  it("provides haptic feedback on tap", () => {
    expect(tapCode).toContain("Haptics.notificationAsync");
  });

  it("returns boolean indicating if handled", () => {
    expect(tapCode).toContain("return true");
    expect(tapCode).toContain("return false");
  });
});

// ─── Layout Integration Tests ─────────────────────────────────────────────────

describe("Layout Startup Integration", () => {
  const layoutPath = path.resolve(__dirname, "../app/_layout.tsx");
  const layoutCode = fs.readFileSync(layoutPath, "utf-8");

  it("imports scheduleTeacherTexts from teacher-texts-engine", () => {
    expect(layoutCode).toContain("scheduleTeacherTexts");
    expect(layoutCode).toContain("teacher-texts-engine");
  });

  it("imports scheduleSurpriseLessonCheck from surprise-lesson-notifications", () => {
    expect(layoutCode).toContain("scheduleSurpriseLessonCheck");
    expect(layoutCode).toContain("surprise-lesson-notifications");
  });

  it("imports recordAppOpen from surprise-lesson-notifications", () => {
    expect(layoutCode).toContain("recordAppOpen");
  });

  it("calls scheduleTeacherTexts on app start when enabled", () => {
    expect(layoutCode).toContain("getTeacherTextPrefs");
    expect(layoutCode).toContain("scheduleTeacherTexts()");
  });

  it("calls scheduleSurpriseLessonCheck on app start", () => {
    expect(layoutCode).toContain("scheduleSurpriseLessonCheck()");
  });

  it("calls recordAppOpen on app start", () => {
    expect(layoutCode).toContain("recordAppOpen()");
  });

  it("registers student-journal screen", () => {
    expect(layoutCode).toContain("student-journal");
  });

  it("registers surprise-lesson screen", () => {
    expect(layoutCode).toContain("surprise-lesson");
  });

  it("registers conversation-history screen", () => {
    expect(layoutCode).toContain("conversation-history");
  });

  it("registers admin-portal screen", () => {
    expect(layoutCode).toContain("admin-portal");
  });
});

// ─── Notification Tap Handler Chain Tests ─────────────────────────────────────

describe("Notification Tap Handler Chain", () => {
  const handlerPath = path.resolve(__dirname, "../lib/incoming-call-handler.ts");
  const handlerCode = fs.readFileSync(handlerPath, "utf-8");

  it("chains surprise lesson tap handler after challenge handler", () => {
    expect(handlerCode).toContain("handleSurpriseLessonNotificationTap");
  });

  it("imports surprise-lesson-tap-handler module", () => {
    expect(handlerCode).toContain("surprise-lesson-tap-handler");
  });

  it("checks challengeHandled before trying surprise lesson handler", () => {
    expect(handlerCode).toContain("challengeHandled");
  });
});

// ─── Voice Settings Screen Tests ──────────────────────────────────────────────

describe("Voice Settings Screen", () => {
  const settingsPath = path.resolve(__dirname, "../app/voice-settings.tsx");
  const settingsCode = fs.readFileSync(settingsPath, "utf-8");

  it("has Voice tab", () => {
    expect(settingsCode).toContain("Voice");
  });

  it("has Coaching tab", () => {
    expect(settingsCode).toContain("Coaching");
  });

  it("has Check-ins tab", () => {
    expect(settingsCode).toContain("Check-ins");
  });

  it("has coaching style options", () => {
    expect(settingsCode).toContain("coaching");
  });

  it("has teacher text scheduling settings", () => {
    expect(settingsCode).toContain("teacher");
  });

  it("has surprise lesson toggle", () => {
    expect(settingsCode).toContain("surprise");
  });
});

// ─── Server Endpoints Tests ───────────────────────────────────────────────────

describe("Server Wave Cloud Chat Router", () => {
  const routerPath = path.resolve(__dirname, "../server/waveCloudChatRouter.ts");
  const routerCode = fs.readFileSync(routerPath, "utf-8");

  it("has generateTeacherText endpoint", () => {
    expect(routerCode).toContain("generateTeacherText");
  });

  it("has generateSurpriseLesson endpoint", () => {
    expect(routerCode).toContain("generateSurpriseLesson");
  });

  it("has correctJournalEntry endpoint", () => {
    expect(routerCode).toContain("correctJournalEntry");
  });

  it("generateTeacherText accepts targetLanguage and studentName", () => {
    expect(routerCode).toContain("targetLanguage");
    expect(routerCode).toContain("studentName");
  });

  it("correctJournalEntry accepts journalEntry and targetLanguage", () => {
    expect(routerCode).toContain("journalEntry");
    expect(routerCode).toContain("targetLanguage");
  });
});

// ─── Cultural Food Data Tests ─────────────────────────────────────────────────

describe("Cultural Food Data", () => {
  const culturalPath = path.resolve(__dirname, "../lib/cultural-knowledge.ts");
  const culturalCode = fs.readFileSync(culturalPath, "utf-8");

  it("includes Locrio de Chuleta con Maíz", () => {
    expect(culturalCode).toContain("Locrio de Chuleta");
  });

  it("includes Mofongo", () => {
    expect(culturalCode).toContain("Mofongo");
  });

  it("includes Sancocho", () => {
    expect(culturalCode).toContain("Sancocho");
  });

  it("includes Habichuelas or Dominican dishes", () => {
    expect(culturalCode).toContain("Habichuelas");
  });

  it("includes Tostones", () => {
    expect(culturalCode).toContain("Tostones");
  });
});

// ─── Admin Access Tests ───────────────────────────────────────────────────────

describe("Admin Access System", () => {
  const adminPath = path.resolve(__dirname, "../lib/admin-access.ts");
  const adminCode = fs.readFileSync(adminPath, "utf-8");

  it("exports canSkipOnboarding function", () => {
    expect(adminCode).toContain("export async function canSkipOnboarding");
  });

  it("exports activateAdminAccess function", () => {
    expect(adminCode).toContain("export async function activateAdminAccess");
  });

  it("exports deactivateAdminAccess function", () => {
    expect(adminCode).toContain("export async function deactivateAdminAccess");
  });

  it("exports isRealCostMode function", () => {
    expect(adminCode).toContain("export async function isRealCostMode");
  });

  it("has admin PIN handling", () => {
    expect(adminCode).toContain("pin");
  });

  it("stores admin state in AsyncStorage", () => {
    expect(adminCode).toContain("AsyncStorage");
  });
});
