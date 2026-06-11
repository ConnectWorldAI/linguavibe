/**
 * Sprint 46 Tests — Deep Link Invite Flow, Ranked Leaderboard, Referral Milestone Notifications
 */
import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

describe("Sprint 46: Deep Link Invite Flow", () => {
  const libPath = path.resolve(__dirname, "../lib/deep-link-invite-handler.ts");

  it("deep-link-invite-handler.ts exists", () => {
    expect(fs.existsSync(libPath)).toBe(true);
  });

  it("exports parseInviteURL function", () => {
    const content = fs.readFileSync(libPath, "utf-8");
    expect(content).toContain("export function parseInviteURL");
  });

  it("exports routeInviteToScreen function", () => {
    const content = fs.readFileSync(libPath, "utf-8");
    expect(content).toContain("export function routeInviteToScreen");
  });

  it("exports initInviteDeepLinkHandler function", () => {
    const content = fs.readFileSync(libPath, "utf-8");
    expect(content).toContain("export function initInviteDeepLinkHandler");
  });

  it("exports processPendingInvite function", () => {
    const content = fs.readFileSync(libPath, "utf-8");
    expect(content).toContain("export async function processPendingInvite");
  });

  it("handles all invite types: duel, friend, study, class, referral", () => {
    const content = fs.readFileSync(libPath, "utf-8");
    expect(content).toContain("case \"duel\"");
    expect(content).toContain("case \"friend\"");
    expect(content).toContain("case \"study\"");
    expect(content).toContain("case \"class\"");
    expect(content).toContain("case \"referral\"");
  });

  it("routes duel invites to duel-multiplayer with autoJoin", () => {
    const content = fs.readFileSync(libPath, "utf-8");
    expect(content).toContain("duel-multiplayer");
    expect(content).toContain("autoJoin");
  });

  it("routes friend invites with autoAccept", () => {
    const content = fs.readFileSync(libPath, "utf-8");
    expect(content).toContain("autoAccept");
  });

  it("handles cold start via getInitialURL", () => {
    const content = fs.readFileSync(libPath, "utf-8");
    expect(content).toContain("getInitialURL");
  });

  it("handles warm start via addEventListener", () => {
    const content = fs.readFileSync(libPath, "utf-8");
    expect(content).toContain("addEventListener");
  });

  it("stores pending invites for processing after navigation ready", () => {
    const content = fs.readFileSync(libPath, "utf-8");
    expect(content).toContain("PENDING_INVITE_KEY");
    expect(content).toContain("storePendingInvite");
  });

  it("records invite acceptance history", () => {
    const content = fs.readFileSync(libPath, "utf-8");
    expect(content).toContain("recordInviteAcceptance");
    expect(content).toContain("INVITE_HISTORY_KEY");
  });

  it("is wired into _layout.tsx on app startup", () => {
    const layoutPath = path.resolve(__dirname, "../app/_layout.tsx");
    const content = fs.readFileSync(layoutPath, "utf-8");
    expect(content).toContain("initInviteDeepLinkHandler");
    expect(content).toContain("cleanupInviteHandler");
  });
});

describe("Sprint 46: Ranked Matchmaking Leaderboard Screen", () => {
  const screenPath = path.resolve(__dirname, "../app/ranked-leaderboard.tsx");

  it("ranked-leaderboard.tsx exists", () => {
    expect(fs.existsSync(screenPath)).toBe(true);
  });

  it("imports from matchmaking library", () => {
    const content = fs.readFileSync(screenPath, "utf-8");
    expect(content).toContain("from \"@/lib/matchmaking\"");
  });

  it("shows player ELO ratings", () => {
    const content = fs.readFileSync(screenPath, "utf-8");
    expect(content).toContain("ELO");
  });

  it("displays tier badges with colors", () => {
    const content = fs.readFileSync(screenPath, "utf-8");
    expect(content).toContain("tierBadge");
    expect(content).toContain("tierColor");
  });

  it("shows weekly climb stats", () => {
    const content = fs.readFileSync(screenPath, "utf-8");
    expect(content).toContain("weeklyClimb");
  });

  it("has time filter (weekly, monthly, all time)", () => {
    const content = fs.readFileSync(screenPath, "utf-8");
    expect(content).toContain("This Week");
    expect(content).toContain("This Month");
    expect(content).toContain("All Time");
  });

  it("shows current user stats card", () => {
    const content = fs.readFileSync(screenPath, "utf-8");
    expect(content).toContain("myStatsCard");
    expect(content).toContain("Win Rate");
  });

  it("has Play Ranked Match button linking to duel-multiplayer", () => {
    const content = fs.readFileSync(screenPath, "utf-8");
    expect(content).toContain("Play Ranked Match");
    expect(content).toContain("duel-multiplayer?mode=ranked");
  });

  it("uses FlatList with keyExtractor", () => {
    const content = fs.readFileSync(screenPath, "utf-8");
    expect(content).toContain("FlatList");
    expect(content).toContain("keyExtractor");
  });

  it("is registered in _layout.tsx", () => {
    const layoutPath = path.resolve(__dirname, "../app/_layout.tsx");
    const content = fs.readFileSync(layoutPath, "utf-8");
    expect(content).toContain("ranked-leaderboard");
  });

  it("shows medal badges for top 3 players", () => {
    const content = fs.readFileSync(screenPath, "utf-8");
    expect(content).toContain("medalBadge");
    expect(content).toContain("#FFD700"); // Gold
    expect(content).toContain("#C0C0C0"); // Silver
    expect(content).toContain("#CD7F32"); // Bronze
  });
});

describe("Sprint 46: Referral Milestone Push Notifications", () => {
  const libPath = path.resolve(__dirname, "../lib/referral-milestone-notifications.ts");

  it("referral-milestone-notifications.ts exists", () => {
    expect(fs.existsSync(libPath)).toBe(true);
  });

  it("exports getCurrentAndNextTier function", () => {
    const content = fs.readFileSync(libPath, "utf-8");
    expect(content).toContain("export function getCurrentAndNextTier");
  });

  it("exports shouldNotifyApproachingTier function", () => {
    const content = fs.readFileSync(libPath, "utf-8");
    expect(content).toContain("export function shouldNotifyApproachingTier");
  });

  it("exports generateMilestoneNotification function", () => {
    const content = fs.readFileSync(libPath, "utf-8");
    expect(content).toContain("export function generateMilestoneNotification");
  });

  it("exports scheduleReferralMilestoneNotification function", () => {
    const content = fs.readFileSync(libPath, "utf-8");
    expect(content).toContain("export async function scheduleReferralMilestoneNotification");
  });

  it("exports checkAndNotifyReferralMilestones function", () => {
    const content = fs.readFileSync(libPath, "utf-8");
    expect(content).toContain("export async function checkAndNotifyReferralMilestones");
  });

  it("defines 5 referral tiers", () => {
    const content = fs.readFileSync(libPath, "utf-8");
    expect(content).toContain("Starter");
    expect(content).toContain("Connector");
    expect(content).toContain("Ambassador");
    expect(content).toContain("Champion");
    expect(content).toContain("Legend");
  });

  it("handles approaching_tier notification type", () => {
    const content = fs.readFileSync(libPath, "utf-8");
    expect(content).toContain("approaching_tier");
    expect(content).toContain("Just 1 more referral");
  });

  it("handles new_conversion notification type", () => {
    const content = fs.readFileSync(libPath, "utf-8");
    expect(content).toContain("new_conversion");
    expect(content).toContain("New referral joined");
  });

  it("handles weekly_nudge notification type", () => {
    const content = fs.readFileSync(libPath, "utf-8");
    expect(content).toContain("weekly_nudge");
    expect(content).toContain("Share ConnectWorld AI");
  });

  it("handles tier_unlocked notification type", () => {
    const content = fs.readFileSync(libPath, "utf-8");
    expect(content).toContain("tier_unlocked");
    expect(content).toContain("Tier Unlocked");
  });

  it("has notification preferences with per-type toggles", () => {
    const content = fs.readFileSync(libPath, "utf-8");
    expect(content).toContain("approachingTierEnabled");
    expect(content).toContain("conversionEnabled");
    expect(content).toContain("weeklyNudgeEnabled");
  });

  it("prevents spam by checking recent notifications", () => {
    const content = fs.readFileSync(libPath, "utf-8");
    expect(content).toContain("recentApproaching");
    expect(content).toContain("24 * 60 * 60 * 1000");
  });

  it("exports scheduleWeeklyReferralNudge function", () => {
    const content = fs.readFileSync(libPath, "utf-8");
    expect(content).toContain("export async function scheduleWeeklyReferralNudge");
  });
});
