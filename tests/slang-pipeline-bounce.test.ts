import { describe, it, expect } from "vitest";

/**
 * Tests for the Slang-Aware Translation Pipeline and MP3 Bounce/Export features.
 * 
 * These tests verify:
 * 1. The slang knowledge loader is properly wired into all translation functions
 * 2. The MP3 bounce/export feature is available in Song Translation Studio and WavyEQ Studio
 * 3. The Google Translate-style UI has real-time debounced translation
 */

describe("Slang-Aware Translation Pipeline", () => {
  describe("Architecture: Dual-Source Translation (Airtable + LLM)", () => {
    it("slangKnowledgeLoader exports getSlangKnowledge and getMultipleMeanings", async () => {
      const fs = await import("fs");
      const content = fs.readFileSync("server/slangKnowledgeLoader.ts", "utf-8");
      expect(content).toContain("export async function getSlangKnowledge");
      expect(content).toContain("export function getMultipleMeanings");
      expect(content).toContain("function formatSlangForTranslator");
    });

    it("getSlangKnowledge accepts language and dialect parameters", async () => {
      const fs = await import("fs");
      const content = fs.readFileSync("server/slangKnowledgeLoader.ts", "utf-8");
      // Function signature accepts language and optional dialect
      expect(content).toContain("language: string, dialect?: string");
      // Returns slangContext and sources
      expect(content).toContain("slangContext");
      expect(content).toContain("sources");
    });

    it("getMultipleMeanings has ambiguous terms like coger", async () => {
      const fs = await import("fs");
      const content = fs.readFileSync("server/slangKnowledgeLoader.ts", "utf-8");
      // Should contain known ambiguous terms
      expect(content).toContain("coger");
      expect(content).toContain("meaning");
      expect(content).toContain("region");
    });

    it("getSlangKnowledge uses caching mechanism", async () => {
      const fs = await import("fs");
      const content = fs.readFileSync("server/slangKnowledgeLoader.ts", "utf-8");
      // Should have cache implementation
      expect(content).toContain("cache");
      expect(content).toContain("CACHE_TTL");
    });
  });

  describe("Song Translation Pipeline - Slang Integration", () => {
    it("songTranslationPipeline imports slangKnowledgeLoader", async () => {
      // Verify the import exists by checking the file content
      const fs = await import("fs");
      const content = fs.readFileSync("server/songTranslationPipeline.ts", "utf-8");
      expect(content).toContain('import { getSlangKnowledge, getMultipleMeanings } from "./slangKnowledgeLoader"');
    });

    it("translateLyrics procedure accepts targetDialect parameter", async () => {
      const fs = await import("fs");
      const content = fs.readFileSync("server/songTranslationPipeline.ts", "utf-8");
      expect(content).toContain("targetDialect");
      expect(content).toContain("slangContext");
    });

    it("runPipeline translation stage uses slang knowledge", async () => {
      const fs = await import("fs");
      const content = fs.readFileSync("server/songTranslationPipeline.ts", "utf-8");
      expect(content).toContain("pipelineSlangData");
      expect(content).toContain("pipelineSlangContext");
    });
  });

  describe("Live Translation - Slang Integration", () => {
    it("liveTranslate imports slangKnowledgeLoader", async () => {
      const fs = await import("fs");
      const content = fs.readFileSync("server/liveTranslate.ts", "utf-8");
      expect(content).toContain('import { getSlangKnowledge, getMultipleMeanings } from "./slangKnowledgeLoader"');
    });

    it("createSession accepts dialect parameter", async () => {
      const fs = await import("fs");
      const content = fs.readFileSync("server/liveTranslate.ts", "utf-8");
      expect(content).toContain('dialect: z.string().optional()');
      expect(content).toContain("DIALECT INSTRUCTIONS");
    });

    it("slang instructions are injected into session config", async () => {
      const fs = await import("fs");
      const content = fs.readFileSync("server/liveTranslate.ts", "utf-8");
      expect(content).toContain("slangInstructions");
      expect(content).toContain("instructions: slangInstructions");
    });
  });

  describe("Text Translation - Slang Integration (existing)", () => {
    it("translateRouter uses slang knowledge in text mutation", async () => {
      const fs = await import("fs");
      const content = fs.readFileSync("server/translateRouter.ts", "utf-8");
      expect(content).toContain('getSlangKnowledge, getMultipleMeanings');
      expect(content).toContain('from "./slangKnowledgeLoader"');
      expect(content).toContain("getSlangKnowledge(input.toLanguage");
    });
  });
});

describe("MP3 Bounce/Export Feature", () => {
  describe("Song Translation Studio - Bounce Button", () => {
    it("song-translation-studio has bounce/export state and handler", async () => {
      const fs = await import("fs");
      const content = fs.readFileSync("app/song-translation-studio.tsx", "utf-8");
      expect(content).toContain("showBounceModal");
      expect(content).toContain("handleBounce");
      expect(content).toContain("Bounce as MP3");
    });

    it("song-translation-studio has bounce modal with progress", async () => {
      const fs = await import("fs");
      const content = fs.readFileSync("app/song-translation-studio.tsx", "utf-8");
      expect(content).toContain("showBounceModal");
      expect(content).toContain("bounceProgress");
      expect(content).toContain("bounceComplete");
    });

    it("bounce calls songStudio.bounce tRPC mutation", async () => {
      const fs = await import("fs");
      const content = fs.readFileSync("app/song-translation-studio.tsx", "utf-8");
      expect(content).toContain("songStudio.bounce");
    });
  });

  describe("WavyEQ Studio - Bounce Button", () => {
    it("wavy-eq-studio has bounce/export state and handler", async () => {
      const fs = await import("fs");
      const content = fs.readFileSync("app/wavy-eq-studio.tsx", "utf-8");
      expect(content).toContain("showBounceModal");
      expect(content).toContain("handleBounce");
      expect(content).toContain("Bounce MP3");
    });

    it("wavy-eq-studio has bounce modal with share option", async () => {
      const fs = await import("fs");
      const content = fs.readFileSync("app/wavy-eq-studio.tsx", "utf-8");
      expect(content).toContain("showBounceModal");
      expect(content).toContain("Share File");
    });
  });

  describe("Server Bounce Endpoint", () => {
    it("songStudioRouter has bounce mutation", async () => {
      const fs = await import("fs");
      const content = fs.readFileSync("server/songStudioRouter.ts", "utf-8");
      expect(content).toContain("bounce:");
      expect(content).toContain("format: z.enum");
    });
  });
});

describe("Google Translate-Style UI", () => {
  describe("Real-time Translation (No Button)", () => {
    it("translate tab uses debounced real-time translation", async () => {
      const fs = await import("fs");
      const content = fs.readFileSync("app/(tabs)/translate.tsx", "utf-8");
      // Should have debounce timer for real-time translation
      expect(content).toContain("debounce");
      // Should NOT have a manual "Translate" button as primary action
      expect(content).not.toContain('onPress={handleTranslate}');
    });

    it("translate tab has language swap functionality", async () => {
      const fs = await import("fs");
      const content = fs.readFileSync("app/(tabs)/translate.tsx", "utf-8");
      expect(content).toContain("handleSwapLanguages");
    });

    it("translate tab has translation history with bookmarks", async () => {
      const fs = await import("fs");
      const content = fs.readFileSync("app/(tabs)/translate.tsx", "utf-8");
      expect(content).toContain("history");
      expect(content).toContain("bookmark");
    });

    it("translate tab has action icons (speaker, copy, share)", async () => {
      const fs = await import("fs");
      const content = fs.readFileSync("app/(tabs)/translate.tsx", "utf-8");
      expect(content).toContain("volume");
      expect(content).toContain("copy");
    });

    it("translate tab has language selector pills at bottom", async () => {
      const fs = await import("fs");
      const content = fs.readFileSync("app/(tabs)/translate.tsx", "utf-8");
      expect(content).toContain("fromLang");
      expect(content).toContain("toLang");
    });
  });
});
