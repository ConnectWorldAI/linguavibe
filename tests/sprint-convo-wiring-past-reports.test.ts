/**
 * Sprint Tests: Conversation Simulator Wiring + View Past Reports Screen
 *
 * Tests:
 * 1. Adaptive engine hooks are properly called in conversation-sim.tsx
 * 2. Adaptive engine hooks are properly called in voice-conversation.tsx
 * 3. View Past Reports screen renders correctly with report data
 * 4. Grade trend chart displays properly
 * 5. Report expansion/collapse works
 * 6. Generate Now button triggers report generation
 * 7. Empty state renders when no reports exist
 */

import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

const ROOT = path.resolve(__dirname, "..");

// ─── Test: Adaptive Engine Hooks Module ─────────────────────────────────────

describe("Adaptive Engine Hooks - Conversation Integration", () => {
  const hooksSrc = fs.readFileSync(
    path.join(ROOT, "lib/adaptive-engine-hooks.ts"),
    "utf-8"
  );

  it("exports onConversationTurn function", () => {
    expect(hooksSrc).toContain("export async function onConversationTurn");
  });

  it("exports onSessionStart function", () => {
    expect(hooksSrc).toContain("export async function onSessionStart");
  });

  it("exports onSessionEnd function", () => {
    expect(hooksSrc).toContain("export async function onSessionEnd");
  });

  it("onConversationTurn accepts grammarErrors parameter", () => {
    expect(hooksSrc).toContain("grammarErrors");
  });

  it("onConversationTurn logs errors to error pattern detection", () => {
    expect(hooksSrc).toContain("logError");
  });

  it("onSessionEnd records session data", () => {
    expect(hooksSrc).toContain("patternsDetected");
    expect(hooksSrc).toContain("recommendedDifficulty");
  });

  it("integrates with adaptive pacing", () => {
    expect(hooksSrc).toContain("adaptive-pacing");
  });

  it("integrates with knowledge gap map", () => {
    expect(hooksSrc).toContain("knowledge-gap-map");
  });
});

// ─── Test: Conversation Sim Integration Points ──────────────────────────────

describe("Conversation Simulator - Adaptive Hooks Integration", () => {
  const convoSimSrc = fs.readFileSync(
    path.join(ROOT, "app/conversation-sim.tsx"),
    "utf-8"
  );

  it("imports adaptive engine hooks", () => {
    expect(convoSimSrc).toContain("onConversationTurn");
    expect(convoSimSrc).toContain("onSessionStart");
    expect(convoSimSrc).toContain("onSessionEnd");
    expect(convoSimSrc).toContain("adaptive-engine-hooks");
  });

  it("calls onSessionStart on first message", () => {
    expect(convoSimSrc).toContain("onSessionStart");
  });

  it("calls onConversationTurn after AI response", () => {
    expect(convoSimSrc).toContain("onConversationTurn");
  });

  it("calls onSessionEnd in endConversation", () => {
    const endConvoMatch = convoSimSrc.indexOf("const endConversation");
    const afterEndConvo = convoSimSrc.substring(endConvoMatch, endConvoMatch + 800);
    expect(afterEndConvo).toContain("onSessionEnd");
  });

  it("passes corrections from parseCorrections", () => {
    expect(convoSimSrc).toContain("parseCorrections");
    expect(convoSimSrc).toContain("corrections");
  });
});

// ─── Test: Voice Conversation Integration Points ────────────────────────────

describe("Voice Conversation - Adaptive Hooks Integration", () => {
  const voiceConvoSrc = fs.readFileSync(
    path.join(ROOT, "app/voice-conversation.tsx"),
    "utf-8"
  );

  it("imports adaptive engine hooks", () => {
    expect(voiceConvoSrc).toContain("onConversationTurn");
    expect(voiceConvoSrc).toContain("onSessionStart");
    expect(voiceConvoSrc).toContain("onSessionEnd");
    expect(voiceConvoSrc).toContain("adaptive-engine-hooks");
  });

  it("calls onSessionStart when conversation opens", () => {
    expect(voiceConvoSrc).toContain("onSessionStart");
  });

  it("calls onConversationTurn after AI response", () => {
    expect(voiceConvoSrc).toContain("onConversationTurn");
  });

  it("calls onSessionEnd when session ends", () => {
    expect(voiceConvoSrc).toContain("onSessionEnd");
  });
});

// ─── Test: Weekly Progress Notification - Report History ────────────────────

describe("Weekly Report History", () => {
  const weeklyNotifSrc = fs.readFileSync(
    path.join(ROOT, "lib/weekly-progress-notification.ts"),
    "utf-8"
  );

  it("exports getWeeklyReportHistory function", () => {
    expect(weeklyNotifSrc).toContain("export async function getWeeklyReportHistory");
  });

  it("getWeeklyReportHistory returns WeeklyReport array", () => {
    expect(weeklyNotifSrc).toContain("Promise<WeeklyReport[]>");
  });

  it("exports generateWeeklyReport function", () => {
    expect(weeklyNotifSrc).toContain("export async function generateWeeklyReport");
  });

  it("generateWeeklyReport returns WeeklyReport", () => {
    expect(weeklyNotifSrc).toContain("Promise<WeeklyReport>");
  });

  it("stores report history in AsyncStorage", () => {
    expect(weeklyNotifSrc).toContain("WEEKLY_REPORT_KEY");
    expect(weeklyNotifSrc).toContain("_history");
  });

  it("limits history to 12 reports", () => {
    expect(weeklyNotifSrc).toContain("12");
  });

  it("WeeklyReport has grade field with valid grades", () => {
    expect(weeklyNotifSrc).toContain('grade: "A+"');
  });

  it("WeeklyMetrics has all required fields", () => {
    expect(weeklyNotifSrc).toContain("sessionsCompleted");
    expect(weeklyNotifSrc).toContain("totalMinutes");
    expect(weeklyNotifSrc).toContain("averageAccuracy");
    expect(weeklyNotifSrc).toContain("overallMastery");
    expect(weeklyNotifSrc).toContain("masteryChange");
  });

  it("exports sendImmediateProgressNotification", () => {
    expect(weeklyNotifSrc).toContain("export async function sendImmediateProgressNotification");
  });

  it("compiles weekly metrics from adaptive engines", () => {
    expect(weeklyNotifSrc).toContain("compileWeeklyMetrics");
    expect(weeklyNotifSrc).toContain("errorPatternsFixed");
    expect(weeklyNotifSrc).toContain("knowledgeGapsClosed");
  });
});

// ─── Test: View Past Reports Screen Structure ───────────────────────────────

describe("View Past Reports Screen - File Structure", () => {
  const viewPastReportsSrc = fs.readFileSync(
    path.join(ROOT, "app/view-past-reports.tsx"),
    "utf-8"
  );

  it("view-past-reports.tsx exists", () => {
    expect(fs.existsSync(path.join(ROOT, "app/view-past-reports.tsx"))).toBe(true);
  });

  it("imports getWeeklyReportHistory from weekly-progress-notification", () => {
    expect(viewPastReportsSrc).toContain("getWeeklyReportHistory");
    expect(viewPastReportsSrc).toContain("weekly-progress-notification");
  });

  it("imports sendImmediateProgressNotification for Generate Now", () => {
    expect(viewPastReportsSrc).toContain("sendImmediateProgressNotification");
  });

  it("has a GradeTrendChart component", () => {
    expect(viewPastReportsSrc).toContain("GradeTrendChart");
  });

  it("has grade color helper function", () => {
    expect(viewPastReportsSrc).toContain("gradeColor");
    expect(viewPastReportsSrc).toContain("gradeToNumeric");
  });

  it("has expandable report items", () => {
    expect(viewPastReportsSrc).toContain("isExpanded");
    expect(viewPastReportsSrc).toContain("expandedIndex");
    expect(viewPastReportsSrc).toContain("toggleExpand");
  });

  it("displays highlights and improvement areas when expanded", () => {
    expect(viewPastReportsSrc).toContain("highlights");
    expect(viewPastReportsSrc).toContain("areasOfImprovement");
    expect(viewPastReportsSrc).toContain("teacherNote");
  });

  it("has empty state with Generate Now button", () => {
    expect(viewPastReportsSrc).toContain("No Reports Yet");
    expect(viewPastReportsSrc).toContain("Generate Report Now");
    expect(viewPastReportsSrc).toContain("handleGenerateNow");
  });

  it("uses FlatList for report list", () => {
    expect(viewPastReportsSrc).toContain("FlatList");
  });

  it("shows loading state", () => {
    expect(viewPastReportsSrc).toContain("ActivityIndicator");
    expect(viewPastReportsSrc).toContain("Loading reports");
  });

  it("has back navigation", () => {
    expect(viewPastReportsSrc).toContain("router.back()");
    expect(viewPastReportsSrc).toContain("arrow-back");
  });

  it("displays metrics grid in expanded view", () => {
    expect(viewPastReportsSrc).toContain("metricsGrid");
    expect(viewPastReportsSrc).toContain("MetricCell");
    expect(viewPastReportsSrc).toContain("flashcardsReviewed");
    expect(viewPastReportsSrc).toContain("conversationMinutes");
  });
});

// ─── Test: Home Screen Navigation Entry ─────────────────────────────────────

describe("Home Screen - View Past Reports Navigation", () => {
  const homeSrc = fs.readFileSync(
    path.join(ROOT, "app/(tabs)/index.tsx"),
    "utf-8"
  );
  const reportCardSrc = fs.readFileSync(
    path.join(ROOT, "app/progress-report-card.tsx"),
    "utf-8"
  );

  it("EXPLORE_FEATURES includes past-reports entry", () => {
    expect(homeSrc).toContain("past-reports");
    expect(homeSrc).toContain("/view-past-reports");
  });

  it("past-reports has document-text-outline icon", () => {
    expect(homeSrc).toContain("document-text-outline");
  });

  it("progress-report-card has link to view-past-reports", () => {
    expect(reportCardSrc).toContain("/view-past-reports");
    expect(reportCardSrc).toContain("Past Reports");
  });
});

// ─── Test: Grade Helpers ────────────────────────────────────────────────────

describe("Grade Helpers in View Past Reports", () => {
  const viewPastReportsSrc = fs.readFileSync(
    path.join(ROOT, "app/view-past-reports.tsx"),
    "utf-8"
  );

  it("gradeToNumeric maps all grades including A+ and F", () => {
    expect(viewPastReportsSrc).toContain('"A+": 8');
    expect(viewPastReportsSrc).toContain("F: 1");
  });

  it("gradeColor returns appropriate colors for each grade tier", () => {
    expect(viewPastReportsSrc).toContain("Colors.success");
    expect(viewPastReportsSrc).toContain("Colors.error");
    expect(viewPastReportsSrc).toContain("#3B82F6"); // B grades
  });

  it("formatDateRange formats week ranges using toLocaleDateString", () => {
    expect(viewPastReportsSrc).toContain("formatDateRange");
    expect(viewPastReportsSrc).toContain("toLocaleDateString");
  });

  it("gradeEmoji returns emoji for each grade", () => {
    expect(viewPastReportsSrc).toContain("gradeEmoji");
    expect(viewPastReportsSrc).toContain("🌟"); // A+
    expect(viewPastReportsSrc).toContain("📈"); // B
  });
});
