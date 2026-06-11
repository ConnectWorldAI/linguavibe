import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";

describe("HeyGen Wiring Sprint", () => {
  const projectRoot = join(__dirname, "..");

  describe("Video Translate → HeyGen Dubbing", () => {
    const content = readFileSync(join(projectRoot, "app/video-translate.tsx"), "utf-8");

    it("imports heygenDubMutation via trpc", () => {
      expect(content).toContain("trpc.heygen.dubVideo.useMutation()");
    });

    it("calls heygenDubMutation.mutateAsync in the translation flow", () => {
      expect(content).toContain("heygenDubMutation.mutateAsync");
    });

    it("sends videoUrl, sourceLanguage, targetLanguage, title to HeyGen", () => {
      expect(content).toContain("videoUrl,");
      expect(content).toContain("sourceLanguage: sourceLanguage.code");
      expect(content).toContain("targetLanguage: targetLanguage.code");
    });

    it("handles HeyGen dubbing success with job info alert", () => {
      expect(content).toContain("Dubbing Started");
      expect(content).toContain("HeyGen is processing your video");
    });

    it("handles HeyGen dubbing failure gracefully", () => {
      expect(content).toContain("Translation Failed");
      expect(content).toContain("HeyGen pipeline error");
    });
  });

  describe("Teacher Avatar Map - All 34 Teachers", () => {
    const content = readFileSync(join(projectRoot, "server/heygenService.ts"), "utf-8");

    it("maps all teacher IDs from the registry", () => {
      // Simple IDs use `id:` format, hyphenated IDs use `"id":` format
      const simpleIds = [
        "maria", "carlos", "rafael", "luis", "valentina", "sofia", "isabela", "camila",
        "jean", "yuki", "jimin", "wei",
        "ahmed", "yasmine", "hans", "giulia", "pieter", "natasha", "emre",
        "linh", "somchai", "priya", "kwame", "amara", "miguel",
        "anna", "olivia", "marcus", "james", "chioma", "thabo",
      ];
      const hyphenatedIds = ["marie-claire", "mei-ling", "priya-en"];
      for (const id of simpleIds) {
        expect(content).toContain(`${id}:`);
      }
      for (const id of hyphenatedIds) {
        expect(content).toContain(`"${id}"`);
      }
    });

    it("supports customAvatarId field for each teacher", () => {
      expect(content).toContain("customAvatarId?: string");
    });

    it("prefers customAvatarId over default avatarId in generation", () => {
      expect(content).toContain("teacher.customAvatarId || teacher.avatarId");
    });

    it("includes gender field for voice selection", () => {
      expect(content).toContain('gender: "male"');
      expect(content).toContain('gender: "female"');
    });

    it("includes Custom Avatar Creation Guide documentation", () => {
      expect(content).toContain("Custom Avatar Creation Guide");
      expect(content).toContain("photo_avatar/create");
    });
  });

  describe("Admin Command Center → HeyGen Video Generation", () => {
    const content = readFileSync(join(projectRoot, "app/admin-command-center.tsx"), "utf-8");

    it("imports generateAvatarVideo mutation", () => {
      expect(content).toContain("trpc.heygen.generateAvatarVideo.useMutation()");
    });

    it("calls generateVideoMutation.mutateAsync with proper payload", () => {
      expect(content).toContain("generateVideoMutation.mutateAsync");
    });

    it("sends script, title, type, aspectRatio, and metadata", () => {
      expect(content).toContain("script: contentPrompt.trim()");
      expect(content).toContain('type: "teacher-video"');
      expect(content).toContain('aspectRatio: "9:16"');
      expect(content).toContain("influencerId: selectedInfluencer.id");
    });

    it("shows loading state during generation", () => {
      expect(content).toContain("isGenerating");
      expect(content).toContain("Generating...");
    });

    it("shows last job ID after successful generation", () => {
      expect(content).toContain("lastJobId");
      expect(content).toContain("Last job:");
    });

    it("handles demo mode vs real generation alerts", () => {
      expect(content).toContain("Demo Mode");
      expect(content).toContain("Video Generation Started");
    });

    it("handles generation failure with alert", () => {
      expect(content).toContain("Generation Failed");
    });
  });
});
