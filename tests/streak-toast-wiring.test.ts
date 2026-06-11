/**
 * Tests for Streak Toast Wiring and Blocked Users
 * Verifies that:
 * 1. All markTodayAsPracticed call sites are wired to showStreakToast
 * 2. The streak-practice-helper exists and has correct logic
 * 3. Blocked users screen exists with proper functionality
 */
import { describe, it, expect, beforeAll } from "vitest";
import * as fs from "fs";
import * as path from "path";

const ROOT = path.resolve(__dirname, "..");

function readFile(relativePath: string): string {
  return fs.readFileSync(path.join(ROOT, relativePath), "utf-8");
}

function fileExists(relativePath: string): boolean {
  return fs.existsSync(path.join(ROOT, relativePath));
}

// ─── Streak Practice Helper ──────────────────────────────────────────────────

describe("Streak Practice Helper", () => {
  let helperSource: string;

  beforeAll(() => {
    helperSource = readFile("lib/streak-practice-helper.ts");
  });

  it("exists as a module", () => {
    expect(fileExists("lib/streak-practice-helper.ts")).toBe(true);
  });

  it("imports markTodayAsPracticed from streak-notifications", () => {
    expect(helperSource).toContain('import { markTodayAsPracticed } from "@/lib/streak-notifications"');
  });

  it("exports markPracticeAndToast function", () => {
    expect(helperSource).toContain("export async function markPracticeAndToast");
  });

  it("accepts showStreakToast callback parameter", () => {
    expect(helperSource).toContain("showStreakToast: (count?: number) => void");
  });

  it("accepts optional currentStreak parameter", () => {
    expect(helperSource).toContain("currentStreak?: number");
  });

  it("calls markTodayAsPracticed and checks firstToday", () => {
    expect(helperSource).toContain("await markTodayAsPracticed(currentStreak)");
    expect(helperSource).toContain("result.firstToday");
  });

  it("calls showStreakToast only when firstToday is true", () => {
    expect(helperSource).toContain("if (result.firstToday)");
    expect(helperSource).toContain("showStreakToast(currentStreak)");
  });

  it("has try/catch for graceful error handling", () => {
    expect(helperSource).toContain("try {");
    expect(helperSource).toContain("} catch {");
  });
});

// ─── Call Site Wiring ────────────────────────────────────────────────────────

describe("Streak Toast Call Site Wiring", () => {
  const callSiteFiles = [
    "app/adaptive-lesson.tsx",
    "app/agent-call.tsx",
    "app/call-screen.tsx",
    "app/curriculum-drills.tsx",
    "app/daily-duel-challenge.tsx",
    "app/demo-call.tsx",
    "app/dialect-quiz.tsx",
    "app/dialect-challenge.tsx",
    "app/grammar-challenge.tsx",
    "app/grammar-quiz.tsx",
    "app/homework.tsx",
    "app/hume-call.tsx",
    "app/influencer-call.tsx",
    "app/lesson-exercise.tsx",
    "app/lesson-player.tsx",
    "app/placement-test.tsx",
    "app/practice-pronunciation.tsx",
    "app/quiz-test.tsx",
    "app/smart-practice.tsx",
    "app/surprise-lesson.tsx",
    "app/targeted-drill.tsx",
    "app/visual-association-exercise.tsx",
    "app/creator-exercise.tsx",
  ];

  it("all call site files exist", () => {
    for (const file of callSiteFiles) {
      expect(fileExists(file)).toBe(true);
    }
  });

  it("all call sites import markPracticeAndToast", () => {
    for (const file of callSiteFiles) {
      const source = readFile(file);
      expect(source).toContain('from "@/lib/streak-practice-helper"');
    }
  });

  it("all call sites import or use useUsage for showStreakToast", () => {
    for (const file of callSiteFiles) {
      const source = readFile(file);
      expect(source).toContain("showStreakToast");
    }
  });

  it("all call sites use markPracticeAndToast(showStreakToast) instead of bare markTodayAsPracticed()", () => {
    for (const file of callSiteFiles) {
      const source = readFile(file);
      expect(source).toContain("markPracticeAndToast(showStreakToast");
      // Should NOT have bare markTodayAsPracticed() calls (only imports are OK)
      const lines = source.split("\n");
      const callLines = lines.filter(
        (l) => l.includes("markTodayAsPracticed(") && !l.includes("import") && !l.includes("//")
      );
      expect(callLines.length).toBe(0);
    }
  });
});

// ─── Blocked Users Screen ────────────────────────────────────────────────────

describe("Blocked Users Management Screen", () => {
  let blockedSource: string;

  beforeAll(() => {
    blockedSource = readFile("app/blocked-users.tsx");
  });

  it("exists as a screen", () => {
    expect(fileExists("app/blocked-users.tsx")).toBe(true);
  });

  it("uses the correct AsyncStorage key", () => {
    expect(blockedSource).toContain("@linguavibe_blocked_users");
  });

  it("defines BlockedUser interface with required fields", () => {
    expect(blockedSource).toContain("interface BlockedUser");
    expect(blockedSource).toContain("id: string");
    expect(blockedSource).toContain("name: string");
    expect(blockedSource).toContain("username: string");
    expect(blockedSource).toContain("blockedAt: string");
  });

  it("has unblock functionality", () => {
    expect(blockedSource).toContain("unblockUser");
    expect(blockedSource).toContain("Unblock");
  });

  it("shows confirmation alert before unblocking", () => {
    expect(blockedSource).toContain("Alert.alert");
    expect(blockedSource).toContain("Are you sure you want to unblock");
  });

  it("filters out unblocked user from list", () => {
    expect(blockedSource).toContain("blockedUsers.filter");
  });

  it("renders empty state when no blocked users", () => {
    expect(blockedSource).toContain("No Blocked Users");
    expect(blockedSource).toContain("renderEmptyState");
  });

  it("uses FlatList for the blocked users list", () => {
    expect(blockedSource).toContain("FlatList");
  });

  it("shows avatar with initial fallback", () => {
    expect(blockedSource).toContain("avatarInitial");
    expect(blockedSource).toContain("item.name.charAt(0)");
  });

  it("displays relative blocked date", () => {
    expect(blockedSource).toContain("formatBlockedDate");
    expect(blockedSource).toContain("Today");
    expect(blockedSource).toContain("Yesterday");
  });

  it("has back navigation", () => {
    expect(blockedSource).toContain("router.back()");
  });
});

// ─── Privacy Settings → Blocked Users Route ─────────────────────────────────

describe("Privacy Settings routes to Blocked Users", () => {
  let privacySource: string;

  beforeAll(() => {
    privacySource = readFile("app/privacy-settings.tsx");
  });

  it("has a Blocked Users navigation row", () => {
    expect(privacySource).toContain("Blocked Users");
  });

  it("routes to /blocked-users screen", () => {
    expect(privacySource).toContain("/blocked-users");
  });
});
