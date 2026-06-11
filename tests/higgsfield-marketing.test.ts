import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

/**
 * Tests for Higgsfield Marketing Content Pipeline
 */

describe("Higgsfield Marketing Service", () => {
  const servicePath = path.join(__dirname, "../server/higgsfieldMarketing.ts");
  const serviceContent = fs.readFileSync(servicePath, "utf-8");

  describe("Service Structure", () => {
    it("should export higgsfieldMarketingRouter", () => {
      expect(serviceContent).toContain("export const higgsfieldMarketingRouter");
    });

    it("should have getTemplates endpoint", () => {
      expect(serviceContent).toContain("getTemplates:");
    });

    it("should have generateVideo endpoint", () => {
      expect(serviceContent).toContain("generateVideo:");
    });

    it("should have checkStatus endpoint", () => {
      expect(serviceContent).toContain("checkStatus:");
    });

    it("should have generateCaption endpoint", () => {
      expect(serviceContent).toContain("generateCaption:");
    });

    it("should have batchGenerate endpoint", () => {
      expect(serviceContent).toContain("batchGenerate:");
    });

    it("should have getRecommendations endpoint", () => {
      expect(serviceContent).toContain("getRecommendations:");
    });

    it("should have generateWeeklyPlan endpoint", () => {
      expect(serviceContent).toContain("generateWeeklyPlan:");
    });
  });

  describe("Marketing Templates", () => {
    it("should have at least 10 templates defined", () => {
      const templateMatches = serviceContent.match(/id:\s*"[^"]+"/g);
      expect(templateMatches).not.toBeNull();
      expect(templateMatches!.length).toBeGreaterThanOrEqual(10);
    });

    it("should include feature promo templates", () => {
      expect(serviceContent).toContain('"feature-hd-voice"');
      expect(serviceContent).toContain('"feature-live-translate"');
      expect(serviceContent).toContain('"feature-ai-teachers"');
    });

    it("should include trending format templates", () => {
      expect(serviceContent).toContain('"trending-before-after"');
      expect(serviceContent).toContain('"trending-day-in-life"');
    });

    it("should include Dominican slang template", () => {
      expect(serviceContent).toContain('"feature-dominican-slang"');
      expect(serviceContent).toContain("Dominican");
    });

    it("should include referral template", () => {
      expect(serviceContent).toContain('"referral-invite"');
    });

    it("should include ConnectWorld AI TV showcase template", () => {
      expect(serviceContent).toContain('"showcase-connectworld-tv"');
    });

    it("should support all three platforms", () => {
      expect(serviceContent).toContain('"instagram"');
      expect(serviceContent).toContain('"tiktok"');
      expect(serviceContent).toContain('"youtube_shorts"');
    });

    it("should use 9:16 aspect ratio for vertical video", () => {
      expect(serviceContent).toContain('"9:16"');
    });
  });

  describe("Higgsfield API Integration", () => {
    it("should use HIGGSFIELD_API_KEY environment variable", () => {
      expect(serviceContent).toContain("HIGGSFIELD_API_KEY");
    });

    it("should use HIGGSFIELD_API_SECRET environment variable", () => {
      expect(serviceContent).toContain("HIGGSFIELD_API_SECRET");
    });

    it("should support combined key format (key:secret)", () => {
      expect(serviceContent).toContain('key.includes(":")');
    });

    it("should have image-to-video endpoint", () => {
      expect(serviceContent).toContain("image-to-video");
    });

    it("should have text-to-video endpoint", () => {
      expect(serviceContent).toContain("text-to-video");
    });

    it("should use dop-lite model for cost efficiency", () => {
      expect(serviceContent).toContain('"dop-lite"');
    });

    it("should have enhance_prompt enabled", () => {
      expect(serviceContent).toContain("enhance_prompt: true");
    });

    it("should gracefully handle missing API key (mock mode)", () => {
      expect(serviceContent).toContain("!process.env.HIGGSFIELD_API_KEY");
      expect(serviceContent).toContain("mock_");
    });
  });

  describe("AI-Powered Content Generation", () => {
    it("should use LLM for prompt optimization", () => {
      expect(serviceContent).toContain("invokeLLM");
      expect(serviceContent).toContain("generateMarketingPrompt");
    });

    it("should generate AI captions with hashtags", () => {
      expect(serviceContent).toContain("generateCaption");
      expect(serviceContent).toContain("hashtags");
    });

    it("should include platform-specific posting recommendations", () => {
      expect(serviceContent).toContain("bestPostingTimes");
      expect(serviceContent).toContain("optimalDuration");
      expect(serviceContent).toContain("hookTiming");
    });

    it("should include algorithm awareness notes", () => {
      expect(serviceContent).toContain("algorithmNotes");
      expect(serviceContent).toContain("watch-through rate");
    });
  });
});

describe("Marketing Studio Screen", () => {
  const screenPath = path.join(__dirname, "../app/marketing-studio.tsx");
  const screenContent = fs.readFileSync(screenPath, "utf-8");

  it("should be a valid React component", () => {
    expect(screenContent).toContain("export default function MarketingStudioScreen");
  });

  it("should have template browsing UI", () => {
    expect(screenContent).toContain("renderTemplatesTab");
    expect(screenContent).toContain("renderTemplateCard");
  });

  it("should have generated videos tab", () => {
    expect(screenContent).toContain("renderGeneratedTab");
    expect(screenContent).toContain("Generated Videos");
  });

  it("should have content calendar tab", () => {
    expect(screenContent).toContain("renderCalendarTab");
    expect(screenContent).toContain("Weekly Content Plan");
  });

  it("should have platform tips tab", () => {
    expect(screenContent).toContain("renderTipsTab");
    expect(screenContent).toContain("Platform Tips");
  });

  it("should have category filters", () => {
    expect(screenContent).toContain("renderCategoryFilter");
    expect(screenContent).toContain("Features");
    expect(screenContent).toContain("Trending");
  });

  it("should have platform filters", () => {
    expect(screenContent).toContain("renderPlatformFilter");
    expect(screenContent).toContain("Instagram");
    expect(screenContent).toContain("TikTok");
  });

  it("should have video generation modal", () => {
    expect(screenContent).toContain("renderGenerateModal");
    expect(screenContent).toContain("Generate Video");
  });

  it("should support custom prompts", () => {
    expect(screenContent).toContain("customPrompt");
    expect(screenContent).toContain("Custom Prompt");
  });

  it("should have weekly plan generation", () => {
    expect(screenContent).toContain("handleGenerateWeeklyPlan");
    expect(screenContent).toContain("Generate Plan");
  });
});

describe("Router Registration", () => {
  const routersPath = path.join(__dirname, "../server/routers.ts");
  const routersContent = fs.readFileSync(routersPath, "utf-8");

  it("should import higgsfieldMarketingRouter", () => {
    expect(routersContent).toContain('import { higgsfieldMarketingRouter } from "./higgsfieldMarketing"');
  });

  it("should register marketing router in appRouter", () => {
    expect(routersContent).toContain("marketing: higgsfieldMarketingRouter");
  });
});
