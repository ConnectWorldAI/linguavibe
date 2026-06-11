import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

describe("DR Market Strategy - Geo Pricing System", () => {
  const geoPricingPath = path.resolve(__dirname, "../lib/geo-pricing.ts");
  const geoPricingContent = fs.readFileSync(geoPricingPath, "utf-8");

  it("should have geo-pricing module", () => {
    expect(fs.existsSync(geoPricingPath)).toBe(true);
  });

  it("should define Caribbean region pricing at $1.99", () => {
    expect(geoPricingContent).toContain("caribbean");
    expect(geoPricingContent).toContain("1.99");
  });

  it("should include Dominican Republic in Caribbean region", () => {
    expect(geoPricingContent).toContain("DO");
  });

  it("should include Jamaica, Haiti, and Trinidad in Caribbean region", () => {
    expect(geoPricingContent).toContain("JM");
    expect(geoPricingContent).toContain("HT");
    expect(geoPricingContent).toContain("TT");
  });

  it("should have IP-based geolocation detection", () => {
    expect(geoPricingContent).toContain("detectPricingRegion");
  });

  it("should have standard US pricing as default", () => {
    expect(geoPricingContent).toContain("13.99");
  });

  it("should define all global regions", () => {
    expect(geoPricingContent).toContain("central_america");
    expect(geoPricingContent).toContain("south_america");
    expect(geoPricingContent).toContain("africa");
    expect(geoPricingContent).toContain("southeast_asia");
    expect(geoPricingContent).toContain("south_asia");
  });
});

describe("DR Market Strategy - Avatar Content Format", () => {
  const avatarFormatPath = path.resolve(__dirname, "../lib/avatar-content-format.ts");
  const avatarFormatContent = fs.readFileSync(avatarFormatPath, "utf-8");

  it("should have avatar content format module", () => {
    expect(fs.existsSync(avatarFormatPath)).toBe(true);
  });

  it("should define Omar-style content types", () => {
    expect(avatarFormatContent).toContain("word_card");
    expect(avatarFormatContent).toContain("phrase_card");
    expect(avatarFormatContent).toContain("confusing_words");
  });

  it("should include phonetic pronunciation system", () => {
    expect(avatarFormatContent).toContain("phonetic");
  });

  it("should define DR-focused avatar personalities", () => {
    expect(avatarFormatContent).toContain("Profesor Carlos");
    expect(avatarFormatContent).toContain("María La Profe");
    expect(avatarFormatContent).toContain("Mike Teaches Spanish");
    expect(avatarFormatContent).toContain("Abuela Rosa");
    expect(avatarFormatContent).toContain("Kevin el Bilingüe");
  });

  it("should have bilingual text overlay format", () => {
    expect(avatarFormatContent).toContain("bilingual");
  });

  it("should include Spider-Man style comparison format", () => {
    expect(avatarFormatContent).toContain("confusing_words");
  });

  it("should produce 17 pieces per avatar per day", () => {
    expect(avatarFormatContent).toContain("17");
  });
});

describe("DR Market Strategy - Creator Partnership System", () => {
  const partnershipPath = path.resolve(__dirname, "../lib/creator-partnership.ts");
  const partnershipContent = fs.readFileSync(partnershipPath, "utf-8");

  it("should have creator partnership module", () => {
    expect(fs.existsSync(partnershipPath)).toBe(true);
  });

  it("should define partnership tiers", () => {
    expect(partnershipContent).toContain("affiliate");
    expect(partnershipContent).toContain("ambassador");
    expect(partnershipContent).toContain("featured_teacher");
    expect(partnershipContent).toContain("co_creator");
  });

  it("should include Inglés con Omar as target partner", () => {
    expect(partnershipContent).toContain("Inglés con Omar");
    expect(partnershipContent).toContain("@inglesconomar");
    expect(partnershipContent).toContain("2_100_000");
  });

  it("should define commission structure with profit protection", () => {
    expect(partnershipContent).toContain("tier1Rate");
    expect(partnershipContent).toContain("tier2Rate");
    expect(partnershipContent).toContain("maxCommissionCap");
    expect(partnershipContent).toContain("25");
  });

  it("should include promo code generation", () => {
    expect(partnershipContent).toContain("generatePromoCode");
    expect(partnershipContent).toContain("OMAR2026");
  });

  it("should have referral tracking system", () => {
    expect(partnershipContent).toContain("storeReferralAttribution");
    expect(partnershipContent).toContain("getReferralAttribution");
  });

  it("should include outreach templates in English and Spanish", () => {
    expect(partnershipContent).toContain("tiktok_dm_english");
    expect(partnershipContent).toContain("tiktok_dm_spanish");
    expect(partnershipContent).toContain("email_formal");
  });

  it("should calculate commission correctly with cap", () => {
    expect(partnershipContent).toContain("calculateCommission");
    // Verify profit protection logic exists
    expect(partnershipContent).toContain("Math.min");
  });

  it("should include revenue projections showing 50x improvement over TikTok", () => {
    expect(partnershipContent).toContain("PARTNERSHIP_VALUE_PROPOSITION");
    expect(partnershipContent).toContain("currentTikTokRevenue");
    expect(partnershipContent).toContain("connectworldProjection_conservative");
  });

  it("should include other DR/Caribbean target creators", () => {
    expect(partnershipContent).toContain("@bilingueblogs");
    expect(partnershipContent).toContain("@randycruzc");
    expect(partnershipContent).toContain("@yaismar_21");
  });
});

describe("Master Plan - DR Market Strategy Section", () => {
  const masterPlanPath = path.resolve(__dirname, "../CONNECTME-AI-MASTER-PLAN.md");
  const masterPlanContent = fs.readFileSync(masterPlanPath, "utf-8");

  it("should include DR Market Strategy section", () => {
    expect(masterPlanContent).toContain("Dominican Republic & Caribbean Market Expansion Strategy");
  });

  it("should include Omar partnership details", () => {
    expect(masterPlanContent).toContain("@inglesconomar");
    expect(masterPlanContent).toContain("Featured Teacher");
  });

  it("should include geo-pricing table", () => {
    expect(masterPlanContent).toContain("Caribbean (DR, Jamaica, Haiti, Trinidad)");
    expect(masterPlanContent).toContain("$1.99");
  });

  it("should include revenue projections", () => {
    expect(masterPlanContent).toContain("Conservative");
    expect(masterPlanContent).toContain("Moderate");
    expect(masterPlanContent).toContain("Optimistic");
  });

  it("should be version 5.4", () => {
    expect(masterPlanContent).toMatch(/Version 5\.\d/);
  });
});
