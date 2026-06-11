import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

describe("Class Recaps Screen", () => {
  const filePath = path.resolve(__dirname, "../app/class-recaps.tsx");
  const content = fs.readFileSync(filePath, "utf-8");

  it("exists and exports a default component", () => {
    expect(content).toContain("export default function ClassRecapsScreen");
  });

  it("has 6 class recap entries", () => {
    const matches = content.match(/id: "/g);
    expect(matches).not.toBeNull();
    expect(matches!.length).toBeGreaterThanOrEqual(6);
  });

  it("has premium and free tier content", () => {
    expect(content).toContain('tier: "premium"');
    expect(content).toContain('tier: "free"');
  });

  it("has attendance policy section", () => {
    expect(content).toContain("Attendance Policy");
    expect(content).toContain("24-hour buffer");
    expect(content).toContain("3 missed classes per month");
  });

  it("has pay-per-replay for exceeded limit", () => {
    expect(content).toContain("Replay Limit Reached");
    expect(content).toContain("$2.99");
  });

  it("has AI summary option", () => {
    expect(content).toContain("AI Summary");
    expect(content).toContain("handleAiSummary");
  });

  it("has filter chips", () => {
    expect(content).toContain("All Classes");
    expect(content).toContain("Live Replays");
    expect(content).toContain("Free");
  });

  it("navigates to membership for upgrade", () => {
    expect(content).toContain("/membership");
  });

  it("has live vs prerecorded type badges", () => {
    expect(content).toContain("Live Replay");
    expect(content).toContain("Pre-recorded");
  });

  it("shows attended badge", () => {
    expect(content).toContain("Attended");
    expect(content).toContain("checkmark-circle");
  });
});

describe("Membership Screen", () => {
  const filePath = path.resolve(__dirname, "../app/membership.tsx");
  const content = fs.readFileSync(filePath, "utf-8");

  it("exists and exports a default component", () => {
    expect(content).toContain("export default function MembershipScreen");
  });

  it("has three membership tiers", () => {
    expect(content).toContain('"free"');
    expect(content).toContain('"pro"');
    expect(content).toContain('"premium"');
  });

  it("has correct pricing", () => {
    expect(content).toContain("$0");
    expect(content).toContain("$4.99");
    expect(content).toContain("$13.99");
  });

  it("has pay-as-you-go options", () => {
    expect(content).toContain("Pay As You Go");
    expect(content).toContain("Single class replay");
    expect(content).toContain("Song Translation (full pipeline)");
    expect(content).toContain("AI Tutor Session (30 min)");
    expect(content).toContain("Certificate PDF");
    expect(content).toContain("Voice Clone");
  });

  it("has feature comparison lists", () => {
    expect(content).toContain("Unlimited lessons");
    expect(content).toContain("3 lessons per week");
    expect(content).toContain("All class replays included");
  });

  it("has Most Popular badge", () => {
    expect(content).toContain("MOST POPULAR");
  });

  it("has FAQ section", () => {
    expect(content).toContain("Can I cancel anytime?");
    expect(content).toContain("Family sharing?");
  });

  it("has subscribe handler", () => {
    expect(content).toContain("handleSubscribe");
    expect(content).toContain("handlePayAsYouGo");
  });
});

describe("Search/Discover Tab Enhancement", () => {
  const filePath = path.resolve(__dirname, "../app/(tabs)/explore.tsx");
  const content = fs.readFileSync(filePath, "utf-8");

  it("has trending sub-tab", () => {
    expect(content).toContain('"trending"');
    expect(content).toContain("Trending");
  });

  it("has tech sub-tab", () => {
    expect(content).toContain('"tech"');
    expect(content).toContain("Tech");
  });

  it("has trending topics carousel", () => {
    expect(content).toContain("Trending Now");
    expect(content).toContain("AI Language Models 2026");
    expect(content).toContain("World Cup Qualifiers");
    expect(content).toContain("Fashion Week Milan");
  });

  it("has category filters for news", () => {
    expect(content).toContain("World");
    expect(content).toContain("Technology");
    expect(content).toContain("Modeling");
    expect(content).toContain("Finance");
    expect(content).toContain("Entertainment");
  });

  it("has tiered translation usage indicator", () => {
    expect(content).toContain("free translations left today");
    expect(content).toContain("FREE_LIMIT");
  });

  it("has upgrade button wired to membership", () => {
    expect(content).toContain("/membership");
  });

  it("has content grid with PRO badges", () => {
    expect(content).toContain("isPremium");
    expect(content).toContain("PRO");
  });

  it("has live content indicators", () => {
    expect(content).toContain("isLive");
    expect(content).toContain("LIVE");
  });
});

describe("Navigation Registration", () => {
  const layoutPath = path.resolve(__dirname, "../app/_layout.tsx");
  const content = fs.readFileSync(layoutPath, "utf-8");

  it("has class-recaps screen registered", () => {
    expect(content).toContain("class-recaps");
  });

  it("has membership screen registered", () => {
    expect(content).toContain("membership");
  });
});
