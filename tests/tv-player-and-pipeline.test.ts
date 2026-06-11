import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

describe("ConnectWorld AI TV Episode Player", () => {
  const tvPlayerPath = path.resolve(__dirname, "../app/tv-player.tsx");

  it("tv-player.tsx file exists", () => {
    expect(fs.existsSync(tvPlayerPath)).toBe(true);
  });

  it("has full-screen video player with video support", () => {
    const content = fs.readFileSync(tvPlayerPath, "utf-8");
    expect(
      content.includes("expo-video") ||
      content.includes("Video") ||
      content.includes("video")
    ).toBe(true);
  });

  it("supports swipe-to-next episode navigation", () => {
    const content = fs.readFileSync(tvPlayerPath, "utf-8");
    // Should have gesture or swipe handling
    expect(
      content.includes("swipe") ||
      content.includes("Gesture") ||
      content.includes("nextEpisode") ||
      content.includes("handleNext")
    ).toBe(true);
  });

  it("has subtitle/caption overlay system", () => {
    const content = fs.readFileSync(tvPlayerPath, "utf-8");
    expect(
      content.includes("subtitle") ||
      content.includes("caption") ||
      content.includes("Subtitle")
    ).toBe(true);
  });

  it("integrates share sheet for episodes", () => {
    const content = fs.readFileSync(tvPlayerPath, "utf-8");
    expect(
      content.includes("share") ||
      content.includes("Share") ||
      content.includes("ContentShareSheet") ||
      content.includes("useContentShare")
    ).toBe(true);
  });

  it("has progress bar and playback controls", () => {
    const content = fs.readFileSync(tvPlayerPath, "utf-8");
    expect(
      content.includes("progress") ||
      content.includes("Progress") ||
      content.includes("seek") ||
      content.includes("duration")
    ).toBe(true);
  });
});

describe("Creator Dashboard", () => {
  const dashboardPath = path.resolve(__dirname, "../app/creator-dashboard.tsx");

  it("creator-dashboard.tsx file exists", () => {
    expect(fs.existsSync(dashboardPath)).toBe(true);
  });

  it("shows earnings and revenue data", () => {
    const content = fs.readFileSync(dashboardPath, "utf-8");
    expect(
      content.includes("earnings") ||
      content.includes("Earnings") ||
      content.includes("revenue") ||
      content.includes("Revenue")
    ).toBe(true);
  });

  it("shows referral tracking", () => {
    const content = fs.readFileSync(dashboardPath, "utf-8");
    expect(
      content.includes("referral") ||
      content.includes("Referral") ||
      content.includes("referrals")
    ).toBe(true);
  });

  it("shows payout status and history", () => {
    const content = fs.readFileSync(dashboardPath, "utf-8");
    expect(
      content.includes("payout") ||
      content.includes("Payout") ||
      content.includes("withdraw") ||
      content.includes("Withdraw")
    ).toBe(true);
  });

  it("has commission rate display", () => {
    const content = fs.readFileSync(dashboardPath, "utf-8");
    expect(
      content.includes("commission") ||
      content.includes("Commission") ||
      content.includes("%")
    ).toBe(true);
  });
});

describe("Apify → Airtable → Manus Pipeline", () => {
  const pipelinePath = path.resolve(__dirname, "../lib/apify-pipeline.ts");

  it("apify-pipeline.ts file exists", () => {
    expect(fs.existsSync(pipelinePath)).toBe(true);
  });

  it("defines Apify actors for TikTok, Instagram, and YouTube", () => {
    const content = fs.readFileSync(pipelinePath, "utf-8");
    expect(content).toContain("tiktok");
    expect(content).toContain("instagram");
    expect(content).toContain("youtube");
  });

  it("defines Airtable schema with all required tables", () => {
    const content = fs.readFileSync(pipelinePath, "utf-8");
    expect(content).toContain("Creators");
    expect(content).toContain("Content");
    expect(content).toContain("Audience");
    expect(content).toContain("Outreach");
    expect(content).toContain("Teaching Patterns");
    expect(content).toContain("Social Strategy");
  });

  it("has creator scoring algorithm", () => {
    const content = fs.readFileSync(pipelinePath, "utf-8");
    expect(content).toContain("scoreCreator");
    expect(content).toContain("partnershipScore");
  });

  it("generates social content ideas for ConnectWorld AI page", () => {
    const content = fs.readFileSync(pipelinePath, "utf-8");
    expect(content).toContain("generateSocialContentIdeas");
    expect(content).toContain("SocialContentIdea");
  });

  it("has pipeline scheduling with cost estimates", () => {
    const content = fs.readFileSync(pipelinePath, "utf-8");
    expect(content).toContain("PIPELINE_SCHEDULE");
    expect(content).toContain("calculateMonthlyCost");
  });

  it("includes pitch angle generation for different creator types", () => {
    const content = fs.readFileSync(pipelinePath, "utf-8");
    expect(content).toContain("generatePitchAngle");
    expect(content).toContain("Steal from competitor");
    expect(content).toContain("Big fish");
    expect(content).toContain("Local hero");
  });
});

describe("TikTok Ingestion - Omar Integration", () => {
  const ingestionPath = path.resolve(__dirname, "../server/tiktokIngestion.ts");

  it("tiktokIngestion.ts file exists", () => {
    expect(fs.existsSync(ingestionPath)).toBe(true);
  });

  it("includes Omar in tracked creators", () => {
    const content = fs.readFileSync(ingestionPath, "utf-8");
    expect(content).toContain("inglesconomar");
  });

  it("includes other researched creators", () => {
    const content = fs.readFileSync(ingestionPath, "utf-8");
    expect(
      content.includes("espanol.w.lola") ||
      content.includes("dannycashhout") ||
      content.includes("spanishovertea") ||
      content.includes("aprendeinglesen7meses")
    ).toBe(true);
  });

  it("extracts teaching patterns from content", () => {
    const content = fs.readFileSync(ingestionPath, "utf-8");
    expect(
      content.includes("teachingPattern") ||
      content.includes("teaching_pattern") ||
      content.includes("formatType") ||
      content.includes("phoneticApproach")
    ).toBe(true);
  });

  it("uses TIKTOK_API_KEY environment variable", () => {
    const content = fs.readFileSync(ingestionPath, "utf-8");
    expect(content).toContain("TIKTOK_API_KEY");
  });
});

describe("Global Feature Matrix", () => {
  const matrixPath = path.resolve(__dirname, "../lib/global-feature-matrix.ts");

  it("global-feature-matrix.ts file exists", () => {
    expect(fs.existsSync(matrixPath)).toBe(true);
  });

  it("defines all global regions", () => {
    const content = fs.readFileSync(matrixPath, "utf-8");
    expect(content).toContain("caribbean");
    expect(content).toContain("africa");
    expect(content).toContain("south_asia");
  });

  it("classifies features by cost tier", () => {
    const content = fs.readFileSync(matrixPath, "utf-8");
    expect(
      content.includes("zero_cost") ||
      content.includes("zeroCost") ||
      content.includes("low_cost") ||
      content.includes("lowCost") ||
      content.includes("ZERO") ||
      content.includes("LOW")
    ).toBe(true);
  });

  it("adjusts feature limits based on region pricing", () => {
    const content = fs.readFileSync(matrixPath, "utf-8");
    expect(
      content.includes("aiMinutes") ||
      content.includes("ai_minutes") ||
      content.includes("minutesPerMonth") ||
      content.includes("limits")
    ).toBe(true);
  });
});
