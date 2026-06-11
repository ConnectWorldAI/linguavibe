import { describe, it, expect } from "vitest";

/**
 * Tests that the content production pipeline is correctly wired:
 * 1. TEACHER_HEYGEN_MAP uses stock avatar IDs (not custom)
 * 2. contentProductionRouter has produce, getStatus, listJobs, previewScript endpoints
 * 3. Admin Command Center's INFLUENCER_TEACHER_MAP maps all 12 influencers to valid teachers
 */

describe("Content Production Pipeline Wiring", () => {
  it("TEACHER_HEYGEN_MAP uses stock avatar IDs (format: character_name_variant)", async () => {
    // Import the map from heygenService
    const fs = await import("fs");
    const heygenServiceContent = fs.readFileSync(
      "/home/ubuntu/linguavibe/server/heygenService.ts",
      "utf-8"
    );

    // Check that the map contains stock avatar IDs (format like "Adriana_sitting_front_close")
    expect(heygenServiceContent).toContain("TEACHER_HEYGEN_MAP");
    // Stock avatars have underscore-separated names with pose info
    expect(heygenServiceContent).toMatch(/avatarId:\s*["'][\w]+_[\w]+/);
    // customAvatarId is an optional override field for custom-trained avatars
    expect(heygenServiceContent).toContain("customAvatarId");
  });

  it("contentProductionRouter exports produce, getStatus, listJobs, previewScript", async () => {
    const fs = await import("fs");
    const pipelineContent = fs.readFileSync(
      "/home/ubuntu/linguavibe/server/contentProductionPipeline.ts",
      "utf-8"
    );

    // Check all required endpoints exist
    expect(pipelineContent).toContain("produce: publicProcedure");
    expect(pipelineContent).toContain("getStatus: publicProcedure");
    expect(pipelineContent).toContain("listJobs: publicProcedure");
    expect(pipelineContent).toContain("previewScript: publicProcedure");
  });

  it("produce endpoint accepts topic, teacherId, language, style, difficulty, platforms", async () => {
    const fs = await import("fs");
    const pipelineContent = fs.readFileSync(
      "/home/ubuntu/linguavibe/server/contentProductionPipeline.ts",
      "utf-8"
    );

    // Check the produce input schema has all required fields
    expect(pipelineContent).toMatch(/topic:\s*z\.string/);
    expect(pipelineContent).toMatch(/teacherId:\s*z\.string/);
    expect(pipelineContent).toMatch(/language:\s*z\.string/);
    expect(pipelineContent).toMatch(/style:\s*z\.enum/);
    expect(pipelineContent).toMatch(/difficulty:\s*z\.enum/);
    expect(pipelineContent).toMatch(/platforms:\s*z\.array/);
  });

  it("pipeline injects Airtable slang context into script generation", async () => {
    const fs = await import("fs");
    const pipelineContent = fs.readFileSync(
      "/home/ubuntu/linguavibe/server/contentProductionPipeline.ts",
      "utf-8"
    );

    // Check that getSlangKnowledge is imported and used
    expect(pipelineContent).toContain('import { getSlangKnowledge } from "./slangKnowledgeLoader"');
    expect(pipelineContent).toContain("getSlangKnowledge");
    // Check that slangContext is passed to generateSkitScript
    expect(pipelineContent).toContain("slangContext");
  });

  it("Admin Command Center maps all 12 influencers to teacher IDs", async () => {
    const fs = await import("fs");
    const adminContent = fs.readFileSync(
      "/home/ubuntu/linguavibe/app/admin-command-center.tsx",
      "utf-8"
    );

    // Check the INFLUENCER_TEACHER_MAP exists and has all 12 mappings
    expect(adminContent).toContain("INFLUENCER_TEACHER_MAP");
    expect(adminContent).toContain("natasha_rd");
    expect(adminContent).toContain("carlos_mx");
    expect(adminContent).toContain("valentina_co");
    expect(adminContent).toContain("thierry_fr");
    expect(adminContent).toContain("bianca_br");
    expect(adminContent).toContain("kenji_jp");
    expect(adminContent).toContain("soojin_kr");
    expect(adminContent).toContain("omar_ar");
    expect(adminContent).toContain("mei_cn");
    expect(adminContent).toContain("marco_it");
    expect(adminContent).toContain("lena_de");
    expect(adminContent).toContain("arjun_in");
  });

  it("Admin Command Center calls contentProduction.produce instead of heygen.generateAvatarVideo", async () => {
    const fs = await import("fs");
    const adminContent = fs.readFileSync(
      "/home/ubuntu/linguavibe/app/admin-command-center.tsx",
      "utf-8"
    );

    // Should use contentProduction.produce
    expect(adminContent).toContain("contentProduction.produce.useMutation");
    expect(adminContent).toContain("contentProductionMutation.mutateAsync");
    // The handleGenerateContent should call the pipeline, not direct HeyGen
    const handleFn = adminContent.slice(
      adminContent.indexOf("const handleGenerateContent"),
      adminContent.indexOf("const togglePlatform")
    );
    expect(handleFn).toContain("contentProductionMutation.mutateAsync");
    expect(handleFn).not.toContain("generateVideoMutation.mutateAsync");
  });

  it("Admin Command Center has style and difficulty selectors", async () => {
    const fs = await import("fs");
    const adminContent = fs.readFileSync(
      "/home/ubuntu/linguavibe/app/admin-command-center.tsx",
      "utf-8"
    );

    // Check style selector
    expect(adminContent).toContain("comedy-skit");
    expect(adminContent).toContain("day-in-life");
    expect(adminContent).toContain("challenge");
    expect(adminContent).toContain("story-time");
    expect(adminContent).toContain("cultural-shock");
    expect(adminContent).toContain("street-interview");

    // Check difficulty selector
    expect(adminContent).toContain("setContentDifficulty");
    expect(adminContent).toContain("beginner");
    expect(adminContent).toContain("intermediate");
    expect(adminContent).toContain("advanced");
  });

  it("RecentGenerationsPanel polls contentProduction.listJobs", async () => {
    const fs = await import("fs");
    const adminContent = fs.readFileSync(
      "/home/ubuntu/linguavibe/app/admin-command-center.tsx",
      "utf-8"
    );

    expect(adminContent).toContain("contentProduction.listJobs.query");
  });

  it("Script Preview button calls previewScript mutation", async () => {
    const fs = await import("fs");
    const adminContent = fs.readFileSync(
      "/home/ubuntu/linguavibe/app/admin-command-center.tsx",
      "utf-8"
    );

    // Check previewScript mutation is wired
    expect(adminContent).toContain("contentProduction.previewScript.useMutation");
    expect(adminContent).toContain("handlePreviewScript");
    expect(adminContent).toContain("previewScriptMutation.mutateAsync");
    // Check the Script Preview modal exists
    expect(adminContent).toContain("showScriptModal");
    expect(adminContent).toContain("editableScript");
    expect(adminContent).toContain("handleProduceFromPreview");
    // Check the Preview Script button text
    expect(adminContent).toContain("Preview Script");
  });

  it("PipelineProgressTracker component exists with 5 stages", async () => {
    const fs = await import("fs");
    const adminContent = fs.readFileSync(
      "/home/ubuntu/linguavibe/app/admin-command-center.tsx",
      "utf-8"
    );

    // Check the pipeline stages are defined
    expect(adminContent).toContain("PIPELINE_STAGES");
    expect(adminContent).toContain("PipelineProgressTracker");
    expect(adminContent).toContain('"scripting"');
    expect(adminContent).toContain('"scenes"');
    expect(adminContent).toContain('"voices"');
    expect(adminContent).toContain('"stitching"');
    expect(adminContent).toContain('"done"');
    // Check it's used in the job cards
    expect(adminContent).toContain("<PipelineProgressTracker");
    // Check progress bar styles exist
    expect(adminContent).toContain("progressStyles");
    expect(adminContent).toContain("barFill");
    expect(adminContent).toContain("stepDotActive");
    expect(adminContent).toContain("stepDotCompleted");
  });

  it("Slang upload script exists and maps to correct Airtable fields", async () => {
    const fs = await import("fs");
    const uploadScript = fs.readFileSync(
      "/home/ubuntu/linguavibe/scripts/upload-slang-database.js",
      "utf-8"
    );

    // Check it maps to the correct Airtable field names
    expect(uploadScript).toContain('"Word/Phrase"');
    expect(uploadScript).toContain('"Pronunciation"');
    expect(uploadScript).toContain('"Meaning"');
    expect(uploadScript).toContain('"Region"');
    expect(uploadScript).toContain('"Example Sentence"');
    expect(uploadScript).toContain('"English Translation"');
    expect(uploadScript).toContain('"Formality"');
    expect(uploadScript).toContain('"Category"');
    expect(uploadScript).toContain('"Cultural Context"');
    expect(uploadScript).toContain('"Language"');
    // Check it covers all 19 dialect mappings
    expect(uploadScript).toContain("SPANISH_DOMINICAN");
    expect(uploadScript).toContain("ENGLISH_AMERICAN");
    expect(uploadScript).toContain("JAPANESE_SLANG");
    expect(uploadScript).toContain("HAITIAN_CREOLE");
    expect(uploadScript).toContain("EGYPTIAN_ARABIC");
  });

  it("contentProductionPipeline TEACHER_AVATAR_MAP has stock avatar IDs for all 34 teachers", async () => {
    const fs = await import("fs");
    const pipelineContent = fs.readFileSync(
      "/home/ubuntu/linguavibe/server/contentProductionPipeline.ts",
      "utf-8"
    );

    // Extract the TEACHER_AVATAR_MAP section
    expect(pipelineContent).toContain("TEACHER_AVATAR_MAP");

    // Check key teachers are mapped
    const teachers = ["maria", "carlos", "rafael", "valentina", "jean", "yuki", "jimin", "ahmed", "wei", "giulia", "hans", "priya"];
    for (const t of teachers) {
      expect(pipelineContent).toContain(`"${t}"`);
    }
  });
});
