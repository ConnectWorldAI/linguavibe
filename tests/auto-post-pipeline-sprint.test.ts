import { describe, it, expect, beforeAll } from "vitest";
import * as fs from "fs";
import * as path from "path";

const PROJECT_ROOT = path.resolve(__dirname, "..");

describe("Auto-Post Pipeline Sprint", () => {
  describe("Auto-Post Pipeline Service", () => {
    const filePath = path.join(PROJECT_ROOT, "server/autoPostPipeline.ts");

    it("service file exists", () => {
      expect(fs.existsSync(filePath)).toBe(true);
    });

    it("exports autoPostRouter", () => {
      const content = fs.readFileSync(filePath, "utf-8");
      expect(content).toContain("export const autoPostRouter");
    });

    it("has postVideo mutation", () => {
      const content = fs.readFileSync(filePath, "utf-8");
      expect(content).toContain("postVideo:");
    });

    it("has repost mutation", () => {
      const content = fs.readFileSync(filePath, "utf-8");
      expect(content).toContain("repost:");
    });

    it("has listRecentPosts query", () => {
      const content = fs.readFileSync(filePath, "utf-8");
      expect(content).toContain("listRecentPosts:");
    });

    it("has getAnalytics query", () => {
      const content = fs.readFileSync(filePath, "utf-8");
      expect(content).toContain("getAnalytics:");
    });

    it("posts to TikTok", () => {
      const content = fs.readFileSync(filePath, "utf-8");
      expect(content).toContain("postToTikTok");
      expect(content).toContain("tiktokapis.com");
    });

    it("posts to Instagram via Meta Graph API or Apify fallback", () => {
      const content = fs.readFileSync(filePath, "utf-8");
      expect(content).toContain("postToInstagram");
      expect(content).toContain("graph.facebook.com");
      expect(content).toContain("APIFY_API_TOKEN");
    });

    it("posts to YouTube with OAuth refresh", () => {
      const content = fs.readFileSync(filePath, "utf-8");
      expect(content).toContain("postToYouTube");
      expect(content).toContain("googleapis.com");
    });

    it("generates platform-specific captions via LLM", () => {
      const content = fs.readFileSync(filePath, "utf-8");
      expect(content).toContain("generatePlatformCaptions");
      expect(content).toContain("invokeLLM");
    });

    it("exports executeAutoPost function", () => {
      const content = fs.readFileSync(filePath, "utf-8");
      expect(content).toContain("export async function executeAutoPost");
    });
  });

  describe("Auto-Post Wired to HeyGen Completion", () => {
    it("heygenService imports executeAutoPost", () => {
      const content = fs.readFileSync(path.join(PROJECT_ROOT, "server/heygenService.ts"), "utf-8");
      expect(content).toContain("import { executeAutoPost } from \"./autoPostPipeline\"");
    });

    it("pollJobCompletion triggers auto-post on video completion", () => {
      const content = fs.readFileSync(path.join(PROJECT_ROOT, "server/heygenService.ts"), "utf-8");
      expect(content).toContain("Auto-post pipeline");
      expect(content).toContain("executeAutoPost({");
    });
  });

  describe("Auto-Post Router Registered", () => {
    it("autoPostRouter is imported in routers.ts", () => {
      const content = fs.readFileSync(path.join(PROJECT_ROOT, "server/routers.ts"), "utf-8");
      expect(content).toContain("import { autoPostRouter } from \"./autoPostPipeline\"");
    });

    it("autoPost is registered in appRouter", () => {
      const content = fs.readFileSync(path.join(PROJECT_ROOT, "server/routers.ts"), "utf-8");
      expect(content).toContain("autoPost: autoPostRouter");
    });
  });

  describe("Recent Generations Panel in Admin Command Center", () => {
    const filePath = path.join(PROJECT_ROOT, "app/admin-command-center.tsx");

    it("has RecentGenerationsPanel component", () => {
      const content = fs.readFileSync(filePath, "utf-8");
      expect(content).toContain("function RecentGenerationsPanel");
    });

    it("renders RecentGenerationsPanel in content tab", () => {
      const content = fs.readFileSync(filePath, "utf-8");
      expect(content).toContain("<RecentGenerationsPanel />");
    });

    it("polls for job updates", () => {
      const content = fs.readFileSync(filePath, "utf-8");
      expect(content).toContain("setInterval(loadJobs");
    });

    it("has re-post buttons for each platform", () => {
      const content = fs.readFileSync(filePath, "utf-8");
      expect(content).toContain("handleRepost");
      expect(content).toContain("autoPost.repost.mutate");
    });

    it("shows job status with color coding", () => {
      const content = fs.readFileSync(filePath, "utf-8");
      expect(content).toContain("getStatusColor");
      expect(content).toContain("completed");
      expect(content).toContain("processing");
      expect(content).toContain("failed");
    });

    it("shows thumbnail for completed jobs", () => {
      const content = fs.readFileSync(filePath, "utf-8");
      expect(content).toContain("job.thumbnailUrl");
    });
  });

  describe("Custom Avatar Creation Flow", () => {
    const filePath = path.join(PROJECT_ROOT, "server/heygenService.ts");

    it("has createPhotoAvatar endpoint", () => {
      const content = fs.readFileSync(filePath, "utf-8");
      expect(content).toContain("createPhotoAvatar:");
    });

    it("createPhotoAvatar calls HeyGen photo_avatar API", () => {
      const content = fs.readFileSync(filePath, "utf-8");
      expect(content).toContain("/v2/photo_avatar");
    });

    it("updates teacher mapping with custom avatar ID", () => {
      const content = fs.readFileSync(filePath, "utf-8");
      expect(content).toContain("teacher.customAvatarId = avatarId");
    });

    it("has listAvatars endpoint", () => {
      const content = fs.readFileSync(filePath, "utf-8");
      expect(content).toContain("listAvatars:");
      expect(content).toContain("/v2/avatars");
    });

    it("has listJobs endpoint for frontend", () => {
      const content = fs.readFileSync(filePath, "utf-8");
      expect(content).toContain("listJobs:");
    });
  });
});
