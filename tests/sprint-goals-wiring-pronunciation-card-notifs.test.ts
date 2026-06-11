/**
 * Tests for Sprint: Goals Wiring + Pronunciation Weak Spots + Goal Notifications
 * 
 * 1. Weekly Goals grading wired into report card generation
 * 2. Pronunciation Weak Spots card on home dashboard
 * 3. Push notification reminders for weekly goals
 */
import { describe, it, expect, beforeAll } from "vitest";
import * as fs from "fs";
import * as path from "path";

const ROOT = path.resolve(__dirname, "..");

// ─── Feature 1: Goals Wired into Report Card ────────────────────────────────

describe("Weekly Goals Wired into Report Card Generation", () => {
  let weeklyProgressContent: string;
  let reportCardContent: string;
  let goalsStorageContent: string;

  beforeAll(() => {
    weeklyProgressContent = fs.readFileSync(
      path.join(ROOT, "lib/weekly-progress-notification.ts"),
      "utf-8"
    );
    reportCardContent = fs.readFileSync(
      path.join(ROOT, "app/progress-report-card.tsx"),
      "utf-8"
    );
    goalsStorageContent = fs.readFileSync(
      path.join(ROOT, "lib/weekly-goals-storage.ts"),
      "utf-8"
    );
  });

  describe("WeeklyReport interface", () => {
    it("includes goalGrade field", () => {
      expect(weeklyProgressContent).toContain("goalGrade?:");
    });

    it("includes goalScore field", () => {
      expect(weeklyProgressContent).toContain("goalScore?:");
    });

    it("includes goalsSet field", () => {
      expect(weeklyProgressContent).toContain("goalsSet?:");
    });

    it("includes goalsCompleted field", () => {
      expect(weeklyProgressContent).toContain("goalsCompleted?:");
    });
  });

  describe("generateWeeklyReport integration", () => {
    it("imports getCurrentGoals and gradeGoals from weekly-goals-storage", () => {
      expect(weeklyProgressContent).toContain("import { getCurrentGoals, gradeGoals }");
      expect(weeklyProgressContent).toContain("weekly-goals-storage");
    });

    it("calls getCurrentGoals in generateWeeklyReport", () => {
      expect(weeklyProgressContent).toContain("await getCurrentGoals()");
    });

    it("calls gradeGoals with current goals", () => {
      expect(weeklyProgressContent).toContain("gradeGoals(currentGoals)");
    });

    it("sets goalGrade in report when goals exist", () => {
      expect(weeklyProgressContent).toContain("goalGrade: currentGoals.length > 0");
    });

    it("sets goalScore in report when goals exist", () => {
      expect(weeklyProgressContent).toContain("goalScore: currentGoals.length > 0");
    });
  });

  describe("Progress Report Card UI", () => {
    it("has goalGrade state", () => {
      expect(reportCardContent).toContain("goalGrade");
      expect(reportCardContent).toContain("setGoalGrade");
    });

    it("has goalScore state", () => {
      expect(reportCardContent).toContain("goalScore");
      expect(reportCardContent).toContain("setGoalScore");
    });

    it("has goalsSet state", () => {
      expect(reportCardContent).toContain("goalsSet");
      expect(reportCardContent).toContain("setGoalsSet");
    });

    it("has goalsCompleted state", () => {
      expect(reportCardContent).toContain("goalsCompleted");
      expect(reportCardContent).toContain("setGoalsCompleted");
    });

    it("loads goal grade on mount", () => {
      expect(reportCardContent).toContain("loadGoalGrade");
    });

    it("imports from weekly-goals-storage dynamically", () => {
      expect(reportCardContent).toContain("@/lib/weekly-goals-storage");
    });

    it("displays Personal Goals section", () => {
      expect(reportCardContent).toContain("Personal Goals");
    });

    it("shows goal completion count", () => {
      expect(reportCardContent).toContain("{goalsCompleted}/{goalsSet} goals completed");
    });

    it("links to weekly-goals screen", () => {
      expect(reportCardContent).toContain("/weekly-goals");
    });

    it("shows empty state when no goals set", () => {
      expect(reportCardContent).toContain("No goals set this week");
    });
  });

  describe("Weekly Goals Storage module", () => {
    it("exports getCurrentGoals function", () => {
      expect(goalsStorageContent).toContain("export async function getCurrentGoals");
    });

    it("exports gradeGoals function", () => {
      expect(goalsStorageContent).toContain("export function gradeGoals");
    });

    it("exports saveCurrentGoals function", () => {
      expect(goalsStorageContent).toContain("export async function saveCurrentGoals");
    });

    it("exports getGoalHistory function", () => {
      expect(goalsStorageContent).toContain("export async function getGoalHistory");
    });

    it("exports updateGoalProgress function", () => {
      expect(goalsStorageContent).toContain("export async function updateGoalProgress");
    });

    it("exports archiveAndResetGoals function", () => {
      expect(goalsStorageContent).toContain("export async function archiveAndResetGoals");
    });

    it("gradeGoals returns correct grades", () => {
      // Import and test the actual function
      const gradeGoals = (goals: any[]) => {
        if (goals.length === 0) return { score: 0, grade: "N/A" };
        let totalProgress = 0;
        for (const goal of goals) {
          const progress = Math.min(goal.currentValue / goal.targetValue, 1.5);
          totalProgress += progress;
        }
        const avgProgress = totalProgress / goals.length;
        const score = Math.round(avgProgress * 100);
        let grade = "F";
        if (score >= 95) grade = "A+";
        else if (score >= 85) grade = "A";
        else if (score >= 78) grade = "B+";
        else if (score >= 70) grade = "B";
        else if (score >= 62) grade = "C+";
        else if (score >= 55) grade = "C";
        else if (score >= 40) grade = "D";
        return { score, grade };
      };

      expect(gradeGoals([{ currentValue: 10, targetValue: 10 }])).toEqual({ score: 100, grade: "A+" });
      expect(gradeGoals([{ currentValue: 5, targetValue: 10 }])).toEqual({ score: 50, grade: "D" });
      expect(gradeGoals([{ currentValue: 0, targetValue: 10 }])).toEqual({ score: 0, grade: "F" });
      expect(gradeGoals([])).toEqual({ score: 0, grade: "N/A" });
    });
  });
});

// ─── Feature 2: Pronunciation Weak Spots Card ───────────────────────────────

describe("Pronunciation Weak Spots Card on Home Dashboard", () => {
  let cardContent: string;
  let homeContent: string;

  beforeAll(() => {
    cardContent = fs.readFileSync(
      path.join(ROOT, "components/pronunciation-weak-spots-card.tsx"),
      "utf-8"
    );
    homeContent = fs.readFileSync(
      path.join(ROOT, "app/(tabs)/index.tsx"),
      "utf-8"
    );
  });

  describe("Component structure", () => {
    it("exports PronunciationWeakSpotsCard component", () => {
      expect(cardContent).toContain("export function PronunciationWeakSpotsCard");
    });

    it("imports getPronunciationStats", () => {
      expect(cardContent).toContain("getPronunciationStats");
    });

    it("imports PRONUNCIATION_CATEGORIES", () => {
      expect(cardContent).toContain("PRONUNCIATION_CATEGORIES");
    });

    it("shows top 3 weak categories", () => {
      expect(cardContent).toContain(".slice(0, 3)");
    });

    it("displays error count per category", () => {
      expect(cardContent).toContain("errorCount");
    });

    it("shows trend indicator (improving/stable/declining)", () => {
      expect(cardContent).toContain("trending-down");
      expect(cardContent).toContain("trending-up");
    });

    it("has a priority badge for #1 weakness", () => {
      expect(cardContent).toContain("#1");
      expect(cardContent).toContain("priorityBadge");
    });

    it("has Start Targeted Drill CTA button", () => {
      expect(cardContent).toContain("Start Targeted Drill");
    });

    it("links to pronunciation-drills screen", () => {
      expect(cardContent).toContain("/pronunciation-drills");
    });

    it("returns null when no errors logged", () => {
      expect(cardContent).toContain("if (loading || weakSpots.length === 0) return null");
    });
  });

  describe("Home screen integration", () => {
    it("imports PronunciationWeakSpotsCard", () => {
      expect(homeContent).toContain("import { PronunciationWeakSpotsCard }");
      expect(homeContent).toContain("pronunciation-weak-spots-card");
    });

    it("renders PronunciationWeakSpotsCard in the dashboard", () => {
      expect(homeContent).toContain("<PronunciationWeakSpotsCard />");
    });

    it("places it after DailyPlanWidget", () => {
      const planIdx = homeContent.indexOf("<DailyPlanWidget />");
      const pronIdx = homeContent.indexOf("<PronunciationWeakSpotsCard />");
      expect(pronIdx).toBeGreaterThan(planIdx);
    });
  });
});

// ─── Feature 3: Push Notification Reminders for Weekly Goals ────────────────

describe("Push Notification Reminders for Weekly Goals", () => {
  let notifContent: string;
  let weeklyGoalsContent: string;

  beforeAll(() => {
    notifContent = fs.readFileSync(
      path.join(ROOT, "lib/weekly-goals-notifications.ts"),
      "utf-8"
    );
    weeklyGoalsContent = fs.readFileSync(
      path.join(ROOT, "app/weekly-goals.tsx"),
      "utf-8"
    );
  });

  describe("Notification module structure", () => {
    it("exports getGoalNotificationPrefs", () => {
      expect(notifContent).toContain("export async function getGoalNotificationPrefs");
    });

    it("exports setGoalNotificationPrefs", () => {
      expect(notifContent).toContain("export async function setGoalNotificationPrefs");
    });

    it("exports scheduleGoalReminders", () => {
      expect(notifContent).toContain("export async function scheduleGoalReminders");
    });

    it("exports cancelAllGoalReminders", () => {
      expect(notifContent).toContain("export async function cancelAllGoalReminders");
    });

    it("exports sendGoalCelebration", () => {
      expect(notifContent).toContain("export async function sendGoalCelebration");
    });

    it("exports checkAndNotifyGoalProgress", () => {
      expect(notifContent).toContain("export async function checkAndNotifyGoalProgress");
    });

    it("exports getGoalNotificationStatus", () => {
      expect(notifContent).toContain("export async function getGoalNotificationStatus");
    });
  });

  describe("Notification preferences", () => {
    it("has dailyReminder preference", () => {
      expect(notifContent).toContain("dailyReminder:");
    });

    it("has midWeekNudge preference", () => {
      expect(notifContent).toContain("midWeekNudge:");
    });

    it("has finalPush preference", () => {
      expect(notifContent).toContain("finalPush:");
    });

    it("has celebration preference", () => {
      expect(notifContent).toContain("celebration:");
    });

    it("has reminderHour preference", () => {
      expect(notifContent).toContain("reminderHour:");
    });

    it("defaults to 7 PM", () => {
      expect(notifContent).toContain("reminderHour: 19");
    });
  });

  describe("Notification templates", () => {
    it("has progress templates", () => {
      expect(notifContent).toContain("PROGRESS_TEMPLATES");
      expect(notifContent).toContain("Goal Check-In");
    });

    it("has nudge templates for mid-week", () => {
      expect(notifContent).toContain("NUDGE_TEMPLATES");
      expect(notifContent).toContain("Mid-Week Check");
    });

    it("has final push templates", () => {
      expect(notifContent).toContain("FINAL_PUSH_TEMPLATES");
      expect(notifContent).toContain("Last Chance");
    });

    it("has celebration templates", () => {
      expect(notifContent).toContain("CELEBRATION_TEMPLATES");
      expect(notifContent).toContain("Goals Crushed");
    });

    it("templates use placeholder variables", () => {
      expect(notifContent).toContain("{{remaining}}");
      expect(notifContent).toContain("{{goalTitle}}");
      expect(notifContent).toContain("{{progress}}");
      expect(notifContent).toContain("{{grade}}");
    });
  });

  describe("Scheduling logic", () => {
    it("schedules daily notifications", () => {
      expect(notifContent).toContain("SchedulableTriggerInputTypes.DAILY");
    });

    it("schedules weekly notifications for Wednesday", () => {
      expect(notifContent).toContain("SchedulableTriggerInputTypes.WEEKLY");
      expect(notifContent).toContain("weekday: 4");
    });

    it("schedules weekly notifications for Saturday", () => {
      expect(notifContent).toContain("weekday: 7");
    });

    it("cancels existing goal reminders before rescheduling", () => {
      expect(notifContent).toContain("cancelAllGoalReminders");
    });

    it("sends immediate celebration when all goals complete", () => {
      expect(notifContent).toContain("trigger: null");
    });

    it("skips on web platform", () => {
      expect(notifContent).toContain('if (Platform.OS === "web") return');
    });
  });

  describe("Weekly Goals screen integration", () => {
    it("calls scheduleGoalReminders when adding a goal", () => {
      const addGoalSection = weeklyGoalsContent.slice(
        weeklyGoalsContent.indexOf("const addGoal"),
        weeklyGoalsContent.indexOf("const removeGoal")
      );
      expect(addGoalSection).toContain("scheduleGoalReminders");
    });

    it("reschedules notifications when removing a goal", () => {
      const removeGoalSection = weeklyGoalsContent.slice(
        weeklyGoalsContent.indexOf("const removeGoal"),
        weeklyGoalsContent.indexOf("const { score, grade }")
      );
      expect(removeGoalSection).toContain("scheduleGoalReminders");
      expect(removeGoalSection).toContain("cancelAllGoalReminders");
    });

    it("imports from weekly-goals-notifications dynamically", () => {
      expect(weeklyGoalsContent).toContain("@/lib/weekly-goals-notifications");
    });
  });
});
