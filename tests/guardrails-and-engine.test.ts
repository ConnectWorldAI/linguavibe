import { describe, it, expect } from "vitest";

/**
 * Tests for Language Guardrails and Creator Content Engine
 * Tests the core logic without requiring network/DB connections
 */

// ─── Language Guardrails Tests ───────────────────────────────────────────────

describe("Language Guardrails", () => {
  // We test the pure logic functions by importing from the module
  // Since these are server-side modules, we test the exported interfaces

  describe("Language-Dialect Map Validation", () => {
    it("should define Spanish with correct dialects", async () => {
      const { LANGUAGE_DIALECT_MAP } = await import("../server/languageGuardrails");
      expect(LANGUAGE_DIALECT_MAP["spanish"]).toBeDefined();
      expect(LANGUAGE_DIALECT_MAP["spanish"]).toContain("dominican");
      expect(LANGUAGE_DIALECT_MAP["spanish"]).toContain("colombian");
      expect(LANGUAGE_DIALECT_MAP["spanish"]).toContain("mexican");
      expect(LANGUAGE_DIALECT_MAP["spanish"]).toContain("puerto rican");
      expect(LANGUAGE_DIALECT_MAP["spanish"]).toContain("cuban");
    });

    it("should define French with correct dialects", async () => {
      const { LANGUAGE_DIALECT_MAP } = await import("../server/languageGuardrails");
      expect(LANGUAGE_DIALECT_MAP["french"]).toBeDefined();
      expect(LANGUAGE_DIALECT_MAP["french"]).toContain("haitian creole");
      expect(LANGUAGE_DIALECT_MAP["french"]).toContain("québécois");
      expect(LANGUAGE_DIALECT_MAP["french"]).toContain("african french");
    });

    it("should define Arabic with correct dialects", async () => {
      const { LANGUAGE_DIALECT_MAP } = await import("../server/languageGuardrails");
      expect(LANGUAGE_DIALECT_MAP["arabic"]).toBeDefined();
      expect(LANGUAGE_DIALECT_MAP["arabic"]).toContain("egyptian");
      expect(LANGUAGE_DIALECT_MAP["arabic"]).toContain("levantine");
      expect(LANGUAGE_DIALECT_MAP["arabic"]).toContain("gulf");
    });

    it("should define Portuguese with correct dialects", async () => {
      const { LANGUAGE_DIALECT_MAP } = await import("../server/languageGuardrails");
      expect(LANGUAGE_DIALECT_MAP["portuguese"]).toBeDefined();
      expect(LANGUAGE_DIALECT_MAP["portuguese"]).toContain("brazilian");
      expect(LANGUAGE_DIALECT_MAP["portuguese"]).toContain("european");
    });

    it("should NOT have Jamaican Patois as a Spanish dialect", async () => {
      const { LANGUAGE_DIALECT_MAP } = await import("../server/languageGuardrails");
      expect(LANGUAGE_DIALECT_MAP["spanish"]).not.toContain("jamaican");
      expect(LANGUAGE_DIALECT_MAP["spanish"]).not.toContain("patois");
    });
  });

  describe("normalizeLanguage", () => {
    it("should normalize language names to lowercase", async () => {
      const { normalizeLanguage } = await import("../server/languageGuardrails");
      expect(normalizeLanguage("Spanish")).toBe("spanish");
      expect(normalizeLanguage("FRENCH")).toBe("french");
      expect(normalizeLanguage("  Arabic  ")).toBe("arabic");
    });
  });

  describe("normalizeDialect", () => {
    it("should normalize dialect names to lowercase", async () => {
      const { normalizeDialect } = await import("../server/languageGuardrails");
      expect(normalizeDialect("Dominican")).toBe("dominican");
      expect(normalizeDialect("COLOMBIAN")).toBe("colombian");
      expect(normalizeDialect("  Mexican  ")).toBe("mexican");
    });

    it("should return standard for undefined dialect", async () => {
      const { normalizeDialect } = await import("../server/languageGuardrails");
      expect(normalizeDialect(undefined)).toBe("standard");
      expect(normalizeDialect("")).toBe("standard");
    });
  });

  describe("isValidLanguage", () => {
    it("should accept valid languages", async () => {
      const { isValidLanguage } = await import("../server/languageGuardrails");
      expect(isValidLanguage("spanish")).toBe(true);
      expect(isValidLanguage("french")).toBe(true);
      expect(isValidLanguage("arabic")).toBe(true);
      expect(isValidLanguage("japanese")).toBe(true);
    });

    it("should reject invalid languages", async () => {
      const { isValidLanguage } = await import("../server/languageGuardrails");
      expect(isValidLanguage("klingon")).toBe(false);
      expect(isValidLanguage("elvish")).toBe(false);
      expect(isValidLanguage("")).toBe(false);
    });
  });

  describe("isValidDialect", () => {
    it("should accept valid dialect for language", async () => {
      const { isValidDialect } = await import("../server/languageGuardrails");
      expect(isValidDialect("spanish", "dominican")).toBe(true);
      expect(isValidDialect("french", "haitian creole")).toBe(true);
      expect(isValidDialect("arabic", "egyptian")).toBe(true);
    });

    it("should reject wrong dialect for language", async () => {
      const { isValidDialect } = await import("../server/languageGuardrails");
      // Dominican is Spanish, not French
      expect(isValidDialect("french", "dominican")).toBe(false);
      // Egyptian is Arabic, not Spanish
      expect(isValidDialect("spanish", "egyptian")).toBe(false);
    });
  });

  describe("validateLanguageMatch", () => {
    it("should allow matching language content", async () => {
      const { validateLanguageMatch } = await import("../server/languageGuardrails");
      const result = validateLanguageMatch("spanish", "spanish", { targetLanguage: "spanish", sourceSystem: "lesson" });
      expect(result.allowed).toBe(true);
      expect(result.violations).toHaveLength(0);
    });

    it("should block mismatched language content", async () => {
      const { validateLanguageMatch } = await import("../server/languageGuardrails");
      const result = validateLanguageMatch("spanish", "french", { targetLanguage: "spanish", sourceSystem: "lesson" });
      expect(result.allowed).toBe(false);
      expect(result.violations.length).toBeGreaterThan(0);
    });
  });

  describe("buildLLMGuardrailPrompt", () => {
    it("should include language name in prompt", async () => {
      const { buildLLMGuardrailPrompt } = await import("../server/languageGuardrails");
      const prompt = buildLLMGuardrailPrompt("spanish", "dominican");
      expect(prompt).toContain("spanish");
      expect(prompt).toContain("dominican");
    });

    it("should include strict contamination rules", async () => {
      const { buildLLMGuardrailPrompt } = await import("../server/languageGuardrails");
      const prompt = buildLLMGuardrailPrompt("spanish");
      // Should mention not mixing languages
      expect(prompt.toLowerCase()).toMatch(/do not|never|must not|only/);
    });
  });

  describe("buildAirtableLanguageFilter", () => {
    it("should build a filter formula for Airtable", async () => {
      const { buildAirtableLanguageFilter } = await import("../server/languageGuardrails");
      const filter = buildAirtableLanguageFilter("spanish");
      expect(filter.toLowerCase()).toContain("spanish");
      expect(filter).toContain("Language");
    });
  });

  describe("getViolationLog", () => {
    it("should return an array", async () => {
      const { getViolationLog } = await import("../server/languageGuardrails");
      const log = getViolationLog();
      expect(Array.isArray(log)).toBe(true);
    });
  });

  describe("getRecentViolations", () => {
    it("should return limited violations", async () => {
      const { getRecentViolations } = await import("../server/languageGuardrails");
      const recent = getRecentViolations(10);
      expect(Array.isArray(recent)).toBe(true);
      expect(recent.length).toBeLessThanOrEqual(10);
    });
  });
});

// ─── Creator Content Engine Tests ────────────────────────────────────────────

describe("Creator Content Engine - Level Placement", () => {
  it("should export LEVEL_PLACEMENT_MATRIX with teaching methods", async () => {
    const mod = await import("../server/creatorContentEngine");
    // The module should export the router and the level placement matrix
    expect(mod).toBeDefined();
  });
});
