/**
 * Tests for Referral Dashboard, Quick Actions (already exists), and Sound Settings
 */
import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

const ROOT = path.resolve(__dirname, "..");

// ─── Referral Dashboard Tests ────────────────────────────────────────────────
describe("Referral Dashboard", () => {
  const filePath = path.join(ROOT, "app/referral-dashboard.tsx");
  const content = fs.readFileSync(filePath, "utf-8");

  it("screen file exists", () => {
    expect(fs.existsSync(filePath)).toBe(true);
  });

  it("exports a default component", () => {
    expect(content).toMatch(/export default function/);
  });

  it("displays referral code", () => {
    expect(content).toMatch(/referralCode|getMyReferralCode|code/i);
  });

  it("shows tier progress", () => {
    expect(content).toMatch(/tier|Tier|TIERS|tierProgress/i);
  });

  it("shows referral history", () => {
    expect(content).toMatch(/history|History|referralHistory/i);
  });

  it("has Claim All button", () => {
    expect(content).toMatch(/Claim All|claimAll|claim.*reward/i);
  });

  it("imports referral-incentive library", () => {
    expect(content).toMatch(/referral-incentive/);
  });

  it("has navigation back button", () => {
    expect(content).toMatch(/router\.back|Back/);
  });

  it("shows reward details (XP, freeze, video, credits)", () => {
    expect(content).toMatch(/XP|freeze|video|credit/i);
  });

  it("is accessible from leaderboard", () => {
    const leaderboardPath = path.join(ROOT, "app/leaderboard.tsx");
    const leaderboardContent = fs.readFileSync(leaderboardPath, "utf-8");
    expect(leaderboardContent).toMatch(/referral-dashboard/);
  });
});

// ─── Referral Incentive Library Tests ────────────────────────────────────────
describe("Referral Incentive Library", () => {
  const filePath = path.join(ROOT, "lib/referral-incentive.ts");
  const content = fs.readFileSync(filePath, "utf-8");

  it("file exists", () => {
    expect(fs.existsSync(filePath)).toBe(true);
  });

  it("exports buildChallengeMessage", () => {
    expect(content).toMatch(/export.*buildChallengeMessage/);
  });

  it("has referral code generation", () => {
    expect(content).toMatch(/generateReferralCode|getMyReferralCode|referralCode/i);
  });

  it("has tiered rewards system", () => {
    expect(content).toMatch(/tier|TIER|Connector|Legend/i);
  });

  it("rewards both referrer and invitee", () => {
    expect(content).toMatch(/referrer|invitee|REFERRER|INVITEE/i);
  });

  it("includes XP bonus reward", () => {
    expect(content).toMatch(/\d+.*XP|xpBonus|bonusXP/);
  });

  it("includes streak freeze reward", () => {
    expect(content).toMatch(/freeze|streakFreeze/i);
  });
});

// ─── Quick Actions Widget Tests (already exists) ─────────────────────────────
describe("Quick Actions Widget (existing)", () => {
  const filePath = path.join(ROOT, "components/quick-actions-widget.tsx");
  const content = fs.readFileSync(filePath, "utf-8");

  it("file exists", () => {
    expect(fs.existsSync(filePath)).toBe(true);
  });

  it("exports QuickActionsWidget component", () => {
    expect(content).toMatch(/export.*function QuickActionsWidget/);
  });

  it("has time-of-day contextual actions", () => {
    expect(content).toMatch(/getTimeOfDay|TimeOfDay|morning|afternoon|evening/);
  });

  it("has haptic feedback on press", () => {
    expect(content).toMatch(/Haptics\.impactAsync/);
  });

  it("has greeting based on time", () => {
    expect(content).toMatch(/getGreeting|greeting/);
  });

  it("supports continue activity tracking", () => {
    expect(content).toMatch(/trackLastActivity|LAST_ACTIVITY_KEY/);
  });
});

// ─── Sound Settings Library Tests ────────────────────────────────────────────
describe("Sound Settings Library", () => {
  const filePath = path.join(ROOT, "lib/sound-settings.ts");
  const content = fs.readFileSync(filePath, "utf-8");

  it("file exists", () => {
    expect(fs.existsSync(filePath)).toBe(true);
  });

  it("exports getSoundSettings", () => {
    expect(content).toMatch(/export.*async function getSoundSettings/);
  });

  it("exports updateSoundSettings", () => {
    expect(content).toMatch(/export.*async function updateSoundSettings/);
  });

  it("exports shouldPlayCelebrationSound", () => {
    expect(content).toMatch(/export.*async function shouldPlayCelebrationSound/);
  });

  it("exports shouldPlayHaptic", () => {
    expect(content).toMatch(/export.*async function shouldPlayHaptic/);
  });

  it("exports shouldPlayNotificationSound", () => {
    expect(content).toMatch(/export.*async function shouldPlayNotificationSound/);
  });

  it("exports resetSoundSettings", () => {
    expect(content).toMatch(/export.*async function resetSoundSettings/);
  });

  it("has SoundSettings interface with three toggles", () => {
    expect(content).toMatch(/celebrationSounds.*boolean/);
    expect(content).toMatch(/haptics.*boolean/);
    expect(content).toMatch(/notificationSounds.*boolean/);
  });

  it("uses AsyncStorage for persistence", () => {
    expect(content).toMatch(/AsyncStorage/);
  });

  it("has default settings (all enabled)", () => {
    expect(content).toMatch(/celebrationSounds:\s*true/);
    expect(content).toMatch(/haptics:\s*true/);
    expect(content).toMatch(/notificationSounds:\s*true/);
  });
});

// ─── Sound Settings Screen Tests ─────────────────────────────────────────────
describe("Sound Settings Screen", () => {
  const filePath = path.join(ROOT, "app/sound-settings.tsx");
  const content = fs.readFileSync(filePath, "utf-8");

  it("screen file exists", () => {
    expect(fs.existsSync(filePath)).toBe(true);
  });

  it("exports a default component", () => {
    expect(content).toMatch(/export default function/);
  });

  it("has Switch toggles for each setting", () => {
    expect(content).toMatch(/Switch/);
    expect(content).toMatch(/celebrationSounds/);
    expect(content).toMatch(/haptics/);
    expect(content).toMatch(/notificationSounds/);
  });

  it("has Reset to Defaults button", () => {
    expect(content).toMatch(/Reset to Defaults|resetSoundSettings/);
  });

  it("shows status summary", () => {
    expect(content).toMatch(/Current Status|statusCard/);
  });

  it("imports sound-settings library", () => {
    expect(content).toMatch(/sound-settings/);
  });

  it("is accessible from main settings", () => {
    const settingsPath = path.join(ROOT, "app/settings.tsx");
    const settingsContent = fs.readFileSync(settingsPath, "utf-8");
    expect(settingsContent).toMatch(/sound-settings/);
  });

  it("has descriptions for each toggle", () => {
    expect(content).toMatch(/Play sounds when completing goals/);
    expect(content).toMatch(/Vibration feedback/);
    expect(content).toMatch(/Sound alerts for push notifications/);
  });
});
