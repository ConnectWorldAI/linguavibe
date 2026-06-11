import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";

describe("Creator Discovery Feed Component", () => {
  const feedSrc = readFileSync(join(__dirname, "../components/creator-discovery-feed.tsx"), "utf-8");

  it("exports CreatorDiscoveryFeed component", () => {
    expect(feedSrc).toContain("export function CreatorDiscoveryFeed");
  });

  it("imports getAllCreatorProfiles from viral-creator-templates", () => {
    expect(feedSrc).toContain("getAllCreatorProfiles");
  });

  it("renders creator cards with platform icons", () => {
    expect(feedSrc).toContain("getPlatformIcon");
    expect(feedSrc).toContain("logo-instagram");
    expect(feedSrc).toContain("logo-tiktok");
    expect(feedSrc).toContain("logo-youtube");
  });

  it("shows creator name, handle, and followers", () => {
    expect(feedSrc).toContain("creatorName");
    expect(feedSrc).toContain("creatorHandle");
    expect(feedSrc).toContain("formatFollowers");
  });

  it("displays signature expressions", () => {
    expect(feedSrc).toContain("signatureExpressions");
    expect(feedSrc).toContain("signature");
  });

  it("shows language and dialect tags", () => {
    expect(feedSrc).toContain("languageTag");
    expect(feedSrc).toContain("dialect");
  });

  it("navigates to creator-content-view on press", () => {
    expect(feedSrc).toContain("creator-content-view");
    expect(feedSrc).toContain("creatorId");
  });

  it("uses horizontal FlatList for scrolling", () => {
    expect(feedSrc).toContain("horizontal");
    expect(feedSrc).toContain("FlatList");
  });

  it("has section header with See All button", () => {
    expect(feedSrc).toContain("Viral Creators");
    expect(feedSrc).toContain("See All");
  });

  it("shows format badge for visual style", () => {
    expect(feedSrc).toContain("formatBadge");
    expect(feedSrc).toContain("getFormatLabel");
  });
});

describe("Creator Discovery Feed integrated into Explore tab", () => {
  const exploreSrc = readFileSync(join(__dirname, "../app/(tabs)/explore.tsx"), "utf-8");

  it("imports CreatorDiscoveryFeed", () => {
    expect(exploreSrc).toContain("import { CreatorDiscoveryFeed }");
  });

  it("renders CreatorDiscoveryFeed in ListHeaderComponent", () => {
    expect(exploreSrc).toContain("<CreatorDiscoveryFeed />");
  });

  it("places creators section before Content Grid label", () => {
    const creatorsIdx = exploreSrc.indexOf("<CreatorDiscoveryFeed />");
    const gridIdx = exploreSrc.indexOf(">Content Grid<");
    expect(creatorsIdx).toBeGreaterThan(0);
    expect(gridIdx).toBeGreaterThan(0);
    expect(creatorsIdx).toBeLessThan(gridIdx);
  });
});

describe("Engagement Notifications Module", () => {
  const notifSrc = readFileSync(join(__dirname, "../lib/engagement-notifications.ts"), "utf-8");

  it("exports initEngagementNotifications", () => {
    expect(notifSrc).toContain("export async function initEngagementNotifications");
  });

  it("has streak reminder scheduling", () => {
    expect(notifSrc).toContain("scheduleStreakReminder");
  });

  it("has music alert scheduling", () => {
    expect(notifSrc).toContain("scheduleMusicAlert");
  });

  it("has re-engagement trigger", () => {
    expect(notifSrc).toContain("scheduleReEngagement");
  });

  it("respects quiet hours", () => {
    expect(notifSrc).toContain("quietHour");
  });

  it("has milestone alerts", () => {
    expect(notifSrc).toContain("milestone");
  });

  it("uses timezone-aware timing", () => {
    expect(notifSrc).toContain("timezone");
  });
});
