/**
 * Sprint 44 Tests — Social/Viral Growth: Matchmaking, Friend Invites, Referral Program
 */
import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

const appDir = path.resolve(__dirname, "..");

describe("Sprint 44 — Bug Fixes", () => {
  it("should not have dead screen registrations for non-existent files", () => {
    const layout = fs.readFileSync(path.join(appDir, "app/_layout.tsx"), "utf-8");
    // These were removed as they had no corresponding screen files
    expect(layout).not.toContain('"app-walkthrough"');
    expect(layout).not.toContain('"ar-translate"');
    expect(layout).not.toContain('"audio-journal"');
    expect(layout).not.toContain('"onboarding-quiz"');
  });

  it("notification-preferences screen should exist", () => {
    const exists = fs.existsSync(path.join(appDir, "app/notification-preferences.tsx"));
    expect(exists).toBe(true);
  });
});

describe("Sprint 44 — Matchmaking System", () => {
  it("matchmaking library should exist with ELO system", () => {
    const content = fs.readFileSync(path.join(appDir, "lib/matchmaking.ts"), "utf-8");
    expect(content).toContain("calculateNewRating");
    expect(content).toContain("getRankForRating");
    expect(content).toContain("getSearchRadius");
    expect(content).toContain("findBestMatch");
    expect(content).toContain("generateSimulatedOpponents");
    expect(content).toContain("isQueueTimedOut");
    expect(content).toContain("recordMatchResult");
  });

  it("should define rank tiers from bronze to master", () => {
    const content = fs.readFileSync(path.join(appDir, "lib/matchmaking.ts"), "utf-8");
    expect(content).toContain('"bronze"');
    expect(content).toContain('"silver"');
    expect(content).toContain('"gold"');
    expect(content).toContain('"platinum"');
    expect(content).toContain('"diamond"');
    expect(content).toContain('"master"');
  });

  it("should have ELO K-factor system with placement games", () => {
    const content = fs.readFileSync(path.join(appDir, "lib/matchmaking.ts"), "utf-8");
    expect(content).toContain("K_FACTOR_NEW");
    expect(content).toContain("K_FACTOR_NORMAL");
    expect(content).toContain("K_FACTOR_VETERAN");
    expect(content).toContain("PLACEMENT_GAMES");
  });

  it("duel-multiplayer screen should integrate matchmaking", () => {
    const content = fs.readFileSync(path.join(appDir, "app/duel-multiplayer.tsx"), "utf-8");
    expect(content).toContain("from \"@/lib/matchmaking\"");
    expect(content).toContain("handleRankedMatch");
    expect(content).toContain("matchProfile");
    expect(content).toContain("Ranked Match");
    expect(content).toContain("Skill-based matchmaking");
  });

  it("should show rank badge with ELO rating in multiplayer lobby", () => {
    const content = fs.readFileSync(path.join(appDir, "app/duel-multiplayer.tsx"), "utf-8");
    expect(content).toContain("rankBadgeRow");
    expect(content).toContain("getRankForRating");
    expect(content).toContain("getWinRate");
  });
});

describe("Sprint 44 — Friend Invite System", () => {
  it("friend-invites library should exist with deep link support", () => {
    const content = fs.readFileSync(path.join(appDir, "lib/friend-invites.ts"), "utf-8");
    expect(content).toContain("createInviteLink");
    expect(content).toContain("parseInviteLink");
    expect(content).toContain("shareInvite");
    expect(content).toContain("shareDuelChallenge");
    expect(content).toContain("shareFriendInvite");
    expect(content).toContain("shareStudyInvite");
    expect(content).toContain("shareClassInvite");
  });

  it("should support multiple invite types", () => {
    const content = fs.readFileSync(path.join(appDir, "lib/friend-invites.ts"), "utf-8");
    expect(content).toContain('"friend"');
    expect(content).toContain('"duel"');
    expect(content).toContain('"study"');
    expect(content).toContain('"class"');
    expect(content).toContain('"referral"');
  });

  it("should generate contextual share messages per invite type", () => {
    const content = fs.readFileSync(path.join(appDir, "lib/friend-invites.ts"), "utf-8");
    expect(content).toContain("challenges you to a pronunciation duel");
    expect(content).toContain("wants to study with you");
    expect(content).toContain("invited you to join");
    expect(content).toContain("wants to connect with you");
  });

  it("should have pending invite management", () => {
    const content = fs.readFileSync(path.join(appDir, "lib/friend-invites.ts"), "utf-8");
    expect(content).toContain("getPendingInvites");
    expect(content).toContain("addPendingInvite");
    expect(content).toContain("acceptInvite");
    expect(content).toContain("declineInvite");
    expect(content).toContain("getPendingInviteCount");
  });

  it("duel-multiplayer should have Challenge a Friend option", () => {
    const content = fs.readFileSync(path.join(appDir, "app/duel-multiplayer.tsx"), "utf-8");
    expect(content).toContain("Challenge a Friend");
    expect(content).toContain("shareDuelChallenge");
    expect(content).toContain("Send a duel invite link via messages");
  });
});

describe("Sprint 44 — Referral Incentive Program", () => {
  it("referral-program library should exist with tiered rewards", () => {
    const content = fs.readFileSync(path.join(appDir, "lib/referral-program.ts"), "utf-8");
    expect(content).toContain("getReferralProfile");
    expect(content).toContain("recordSuccessfulReferral");
    expect(content).toContain("calculateReward");
    expect(content).toContain("getTierForReferrals");
    expect(content).toContain("getTierProgress");
    expect(content).toContain("shareReferralLink");
  });

  it("should define referral tiers with multipliers", () => {
    const content = fs.readFileSync(path.join(appDir, "lib/referral-program.ts"), "utf-8");
    expect(content).toContain('"starter"');
    expect(content).toContain('"ambassador"');
    expect(content).toContain('"champion"');
    expect(content).toContain('"legend"');
    expect(content).toContain("TIER_MULTIPLIERS");
  });

  it("should offer video call time and translation credits as rewards", () => {
    const content = fs.readFileSync(path.join(appDir, "lib/referral-program.ts"), "utf-8");
    expect(content).toContain("VIDEO_MINUTES_PER_REFERRAL");
    expect(content).toContain("TRANSLATION_CREDITS_PER_REFERRAL");
    expect(content).toContain("CREDITS_PER_REFERRAL");
    expect(content).toContain("spendVideoMinutes");
    expect(content).toContain("spendTranslationCredits");
  });

  it("should have conversion tracking", () => {
    const content = fs.readFileSync(path.join(appDir, "lib/referral-program.ts"), "utf-8");
    expect(content).toContain("successfulReferrals");
    expect(content).toContain("pendingReferrals");
    expect(content).toContain("conversionRate");
    expect(content).toContain("getReferralStats");
    expect(content).toContain("getReferralHistory");
  });

  it("referral screen should integrate tiered rewards UI", () => {
    const content = fs.readFileSync(path.join(appDir, "app/referral.tsx"), "utf-8");
    expect(content).toContain("from \"@/lib/referral-program\"");
    expect(content).toContain("tierProfile");
    expect(content).toContain("tierCard");
    expect(content).toContain("tierProgress");
    expect(content).toContain("reward multiplier");
  });
});
