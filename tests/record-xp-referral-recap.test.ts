/**
 * Tests for: recordDailyXP wiring, Referral Incentive system, Weekly Recap notification
 * Uses file-based testing approach (no runtime imports of RN modules)
 */
import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

// ─── recordDailyXP Wiring Tests ───
describe("creator-exercise.tsx - recordDailyXP wiring", () => {
  const filePath = path.resolve(__dirname, "../app/creator-exercise.tsx");
  const content = fs.readFileSync(filePath, "utf-8");

  it("imports recordDailyXP from weekly-progress-card", () => {
    expect(content).toContain("import { recordDailyXP } from");
    expect(content).toContain("weekly-progress-card");
  });

  it("calls recordDailyXP after addDailyXP in finishExercise", () => {
    const addIdx = content.indexOf("await addDailyXP(totalXP)");
    const recordIdx = content.indexOf("await recordDailyXP(totalXP)");
    expect(addIdx).toBeGreaterThan(-1);
    expect(recordIdx).toBeGreaterThan(-1);
    expect(recordIdx).toBeGreaterThan(addIdx);
  });

  it("calls recordDailyXP with the same totalXP value", () => {
    expect(content).toContain("await recordDailyXP(totalXP)");
  });
});

// ─── Referral Incentive System Tests ───
describe("lib/referral-incentive.ts", () => {
  const filePath = path.resolve(__dirname, "../lib/referral-incentive.ts");
  const content = fs.readFileSync(filePath, "utf-8");

  it("exists and exports generateReferralCode function", () => {
    expect(content).toContain("export async function generateReferralCode");
  });

  it("exports getReferralCode function", () => {
    expect(content).toContain("export async function getReferralCode");
  });

  it("exports buildChallengeMessage function", () => {
    expect(content).toContain("export async function buildChallengeMessage");
  });

  it("exports recordReferral function", () => {
    expect(content).toContain("export async function recordReferral");
  });

  it("exports claimReferralRewards function", () => {
    expect(content).toContain("export async function claimReferralRewards");
  });

  it("exports getReferralData function", () => {
    expect(content).toContain("export async function getReferralData");
  });

  it("defines REFERRAL_REWARDS with referrer and invitee benefits", () => {
    expect(content).toContain("REFERRAL_REWARDS");
    expect(content).toContain("referrer");
    expect(content).toContain("invitee");
  });

  it("includes bonusXP reward for both parties", () => {
    expect(content).toContain("bonusXP: 50"); // referrer
    expect(content).toContain("bonusXP: 25"); // invitee
  });

  it("includes streakFreezes reward", () => {
    expect(content).toContain("streakFreezes: 1");
  });

  it("includes videoCallMinutes reward", () => {
    expect(content).toContain("videoCallMinutes");
  });

  it("includes translationCredits reward", () => {
    expect(content).toContain("translationCredits");
  });

  it("defines REFERRAL_TIERS with escalating multipliers", () => {
    expect(content).toContain("REFERRAL_TIERS");
    expect(content).toContain("Connector");
    expect(content).toContain("Ambassador");
    expect(content).toContain("Champion");
    expect(content).toContain("Legend");
  });

  it("generates CW-XXXXX format referral codes", () => {
    expect(content).toContain('let code = "CW-"');
  });

  it("uses AsyncStorage for persistence", () => {
    expect(content).toContain("AsyncStorage.getItem");
    expect(content).toContain("AsyncStorage.setItem");
  });

  it("includes invite URL in challenge message", () => {
    expect(content).toContain("connectworld.ai/invite");
  });

  it("calculates tier multiplier for rewards", () => {
    expect(content).toContain("bonusMultiplier");
    expect(content).toContain("multiplier");
  });
});

// ─── Leaderboard Challenge Integration Tests ───
describe("app/leaderboard.tsx - Referral integration", () => {
  const filePath = path.resolve(__dirname, "../app/leaderboard.tsx");
  const content = fs.readFileSync(filePath, "utf-8");

  it("imports buildChallengeMessage from referral-incentive", () => {
    expect(content).toContain("buildChallengeMessage");
    expect(content).toContain("referral-incentive");
  });

  it("uses buildChallengeMessage in the Challenge button", () => {
    expect(content).toContain("await buildChallengeMessage(");
  });
});

// ─── Weekly Recap Notification Tests ───
describe("lib/weekly-recap.ts", () => {
  const filePath = path.resolve(__dirname, "../lib/weekly-recap.ts");
  const content = fs.readFileSync(filePath, "utf-8");

  it("exists and exports getWeeklyRecapSettings function", () => {
    expect(content).toContain("export async function getWeeklyRecapSettings");
  });

  it("exports saveWeeklyRecapSettings function", () => {
    expect(content).toContain("export async function saveWeeklyRecapSettings");
  });

  it("exports scheduleWeeklyRecap function", () => {
    expect(content).toContain("export async function scheduleWeeklyRecap");
  });

  it("exports cancelWeeklyRecap function", () => {
    expect(content).toContain("export async function cancelWeeklyRecap");
  });

  it("exports formatRecapMessage function", () => {
    expect(content).toContain("export function formatRecapMessage");
  });

  it("exports toggleWeeklyRecap function", () => {
    expect(content).toContain("export async function toggleWeeklyRecap");
  });

  it("exports isWeeklyRecapEnabled function", () => {
    expect(content).toContain("export async function isWeeklyRecapEnabled");
  });

  it("schedules notification for Sunday (weekday 1)", () => {
    expect(content).toContain("weekday: 1");
  });

  it("includes deep link to xp-dashboard in notification data", () => {
    expect(content).toContain('deepLink: "xp-dashboard"');
  });

  it("includes type weekly-recap in notification data", () => {
    expect(content).toContain('type: "weekly-recap"');
  });

  it("guards against web platform", () => {
    expect(content).toContain('Platform.OS === "web"');
  });

  it("formatRecapMessage includes XP, goals, streak, and badges", () => {
    expect(content).toContain("totalXP");
    expect(content).toContain("daysGoalMet");
    expect(content).toContain("currentStreak");
    expect(content).toContain("badgesEarned");
  });

  it("defaults to 6 PM Sunday", () => {
    expect(content).toContain("hour: 18");
  });
});

// ─── Daily XP Goal Screen - Recap Toggle Integration ───
describe("app/daily-xp-goal.tsx - Weekly Recap toggle", () => {
  const filePath = path.resolve(__dirname, "../app/daily-xp-goal.tsx");
  const content = fs.readFileSync(filePath, "utf-8");

  it("imports weekly-recap functions", () => {
    expect(content).toContain("weekly-recap");
    expect(content).toContain("saveWeeklyRecapSettings");
  });

  it("has recapEnabled state", () => {
    expect(content).toContain("recapEnabled");
    expect(content).toContain("setRecapEnabled");
  });

  it("renders Sunday Recap section", () => {
    expect(content).toContain("Sunday Recap");
  });

  it("has a toggle switch for weekly recap", () => {
    expect(content).toContain("Weekly Recap");
    expect(content).toContain("recapEnabled");
  });
});
