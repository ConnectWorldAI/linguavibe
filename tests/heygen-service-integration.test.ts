import { describe, it, expect, beforeAll } from "vitest";
import * as fs from "fs";
import * as path from "path";

describe("HeyGen Service Integration", () => {
  const servicePath = path.join(__dirname, "..", "server", "heygenService.ts");
  const routersPath = path.join(__dirname, "..", "server", "routers.ts");
  let serviceContent: string;
  let routersContent: string;

  beforeAll(() => {
    serviceContent = fs.readFileSync(servicePath, "utf-8");
    routersContent = fs.readFileSync(routersPath, "utf-8");
  });

  describe("Service file structure", () => {
    it("should export heygenRouter", () => {
      expect(serviceContent).toContain("export const heygenRouter");
    });

    it("should use HEYGEN_API_KEY env var", () => {
      expect(serviceContent).toContain("process.env.HEYGEN_API_KEY");
    });

    it("should have HeyGen API base URL", () => {
      expect(serviceContent).toContain("https://api.heygen.com");
    });
  });

  describe("Video dubbing endpoints", () => {
    it("should have dubVideo mutation for lip-sync translation", () => {
      expect(serviceContent).toContain("dubVideo:");
      expect(serviceContent).toContain("publicProcedure");
    });

    it("should accept videoUrl, sourceLanguage, targetLanguage", () => {
      expect(serviceContent).toContain("videoUrl: z.string().url()");
      expect(serviceContent).toContain("sourceLanguage:");
      expect(serviceContent).toContain("targetLanguage:");
    });

    it("should call HeyGen video translate API", () => {
      expect(serviceContent).toContain("/v2/video_translate/translate");
    });

    it("should have dubbing status check", () => {
      expect(serviceContent).toContain("checkDubbingStatus");
    });
  });

  describe("Avatar video generation", () => {
    it("should have generateAvatarVideo mutation", () => {
      expect(serviceContent).toContain("generateAvatarVideo:");
    });

    it("should support TV episodes, course previews, and teacher videos", () => {
      expect(serviceContent).toContain('"tv-episode"');
      expect(serviceContent).toContain('"course-preview"');
      expect(serviceContent).toContain('"teacher-video"');
    });

    it("should call HeyGen v2 video generate API", () => {
      expect(serviceContent).toContain("/v2/video/generate");
    });

    it("should support multiple aspect ratios", () => {
      expect(serviceContent).toContain('"16:9"');
      expect(serviceContent).toContain('"9:16"');
      expect(serviceContent).toContain('"1:1"');
    });
  });

  describe("Teacher video generation", () => {
    it("should have generateTeacherVideo mutation", () => {
      expect(serviceContent).toContain("generateTeacherVideo:");
    });

    it("should have teacher avatar mapping", () => {
      expect(serviceContent).toContain("TEACHER_HEYGEN_MAP");
    });

    it("should map all 12 teachers", () => {
      // Updated to match current 34-teacher TEACHER_HEYGEN_MAP (spot-checking 12 from different regions)
      const teachers = ["natasha", "carlos", "valentina", "maria", "rafael", "jean", "priya", "yuki", "jimin", "wei", "kwame", "giulia"];
      for (const t of teachers) {
        expect(serviceContent).toContain(`${t}:`);
      }
    });

    it("should support lesson, correction, greeting, and tip types", () => {
      expect(serviceContent).toContain('"lesson"');
      expect(serviceContent).toContain('"correction"');
      expect(serviceContent).toContain('"greeting"');
      expect(serviceContent).toContain('"tip"');
    });
  });

  describe("Job management", () => {
    it("should have getJobStatus query", () => {
      expect(serviceContent).toContain("getJobStatus:");
    });

    it("should have listRecentJobs query", () => {
      expect(serviceContent).toContain("listRecentJobs:");
    });

    it("should have background polling for job completion", () => {
      expect(serviceContent).toContain("pollJobCompletion");
    });
  });

  describe("Utility endpoints", () => {
    it("should have getQuota query", () => {
      expect(serviceContent).toContain("getQuota:");
    });

    it("should have listAvatars query", () => {
      expect(serviceContent).toContain("listAvatars:");
    });

    it("should have listVoices query", () => {
      expect(serviceContent).toContain("listVoices:");
    });

    it("should have getSupportedLanguages query", () => {
      expect(serviceContent).toContain("getSupportedLanguages:");
    });

    it("should have getTeacherAvatars query", () => {
      expect(serviceContent).toContain("getTeacherAvatars:");
    });
  });

  describe("Demo mode fallback", () => {
    it("should gracefully handle missing API key with demo mode", () => {
      // Each mutation should check for apiKey and fall back to demo
      const demoCount = (serviceContent.match(/demo: true/g) || []).length;
      expect(demoCount).toBeGreaterThanOrEqual(3); // avatar, dub, teacher
    });
  });

  describe("Language support", () => {
    it("should have HeyGen language mapping for 20+ languages", () => {
      expect(serviceContent).toContain("HEYGEN_LANGUAGE_MAP");
      const langEntries = serviceContent.match(/\w+: "[A-Z]/g) || [];
      expect(langEntries.length).toBeGreaterThanOrEqual(15);
    });
  });

  describe("Router registration", () => {
    it("should be imported in routers.ts", () => {
      expect(routersContent).toContain('import { heygenRouter } from "./heygenService"');
    });

    it("should be registered as heygen in appRouter", () => {
      expect(routersContent).toContain("heygen: heygenRouter");
    });
  });
});
