import { describe, it, expect } from "vitest";

// Test the multilingual slang data module
describe("Multilingual Slang Dictionary", () => {
  it("should have slang data for all major languages", async () => {
    const { getAvailableSlangLanguages } = await import("../lib/slang-data");
    const languages = getAvailableSlangLanguages();

    // Should have at least 11 languages
    expect(languages.length).toBeGreaterThanOrEqual(11);

    // Check key languages exist
    const codes = languages.map(l => l.code);
    expect(codes).toContain("es"); // Spanish
    expect(codes).toContain("en"); // English
    expect(codes).toContain("fr"); // French
    expect(codes).toContain("pt"); // Portuguese
    expect(codes).toContain("ja"); // Japanese
    expect(codes).toContain("zh"); // Mandarin
    expect(codes).toContain("hi"); // Hindi
    expect(codes).toContain("ko"); // Korean
    expect(codes).toContain("ar"); // Arabic
    expect(codes).toContain("it"); // Italian
    expect(codes).toContain("de"); // German

    // Each language should have entries
    for (const lang of languages) {
      expect(lang.count).toBeGreaterThan(0);
    }
  });

  it("should return language-specific slang entries", async () => {
    const { getSlangForLanguage } = await import("../lib/slang-data");

    // Spanish Dominican
    const domSlang = getSlangForLanguage("es", "dominican");
    expect(domSlang.length).toBeGreaterThan(0);
    expect(domSlang[0].expression).toBeDefined();
    expect(domSlang[0].meaning).toBeDefined();

    // English American
    const enSlang = getSlangForLanguage("en", "american");
    expect(enSlang.length).toBeGreaterThan(0);

    // Japanese
    const jaSlang = getSlangForLanguage("ja");
    expect(jaSlang.length).toBeGreaterThan(0);

    // Hindi
    const hiSlang = getSlangForLanguage("hi");
    expect(hiSlang.length).toBeGreaterThan(0);
  });

  it("should map language names to codes correctly", async () => {
    const { languageNameToCode } = await import("../lib/slang-data");

    expect(languageNameToCode("Spanish")).toBe("es");
    expect(languageNameToCode("english")).toBe("en");
    expect(languageNameToCode("French")).toBe("fr");
    expect(languageNameToCode("Japanese")).toBe("ja");
    expect(languageNameToCode("Mandarin")).toBe("zh");
    expect(languageNameToCode("Hindi")).toBe("hi");
    expect(languageNameToCode("Korean")).toBe("ko");
    expect(languageNameToCode("Arabic")).toBe("ar");
    expect(languageNameToCode("Italian")).toBe("it");
    expect(languageNameToCode("German")).toBe("de");
  });

  it("should return correct TTS codes for language/dialect pairs", async () => {
    const { getSlangTTSCode } = await import("../lib/slang-data");

    expect(getSlangTTSCode("es", "dominican")).toBe("es-DO");
    expect(getSlangTTSCode("es", "mexican")).toBe("es-MX");
    expect(getSlangTTSCode("en", "american")).toBe("en-US");
    expect(getSlangTTSCode("en", "british")).toBe("en-GB");
    expect(getSlangTTSCode("pt", "brazilian")).toBe("pt-BR");
    expect(getSlangTTSCode("ja", "standard")).toBe("ja-JP");
    expect(getSlangTTSCode("zh", "standard")).toBe("zh-CN");
    expect(getSlangTTSCode("hi", "standard")).toBe("hi-IN");
    expect(getSlangTTSCode("ko", "standard")).toBe("ko-KR");
  });

  it("should provide language config with dialects and categories", async () => {
    const { getSlangLanguageConfig } = await import("../lib/slang-data");

    const esConfig = getSlangLanguageConfig("es");
    expect(esConfig).toBeDefined();
    expect(esConfig!.dialects.length).toBeGreaterThan(0);
    expect(esConfig!.categories.length).toBeGreaterThan(0);
    expect(esConfig!.flag).toBeDefined();

    const enConfig = getSlangLanguageConfig("en");
    expect(enConfig).toBeDefined();
    expect(enConfig!.dialects.some(d => d.code === "american")).toBe(true);
    expect(enConfig!.dialects.some(d => d.code === "british")).toBe(true);
  });

  it("should have proper SlangEntry structure for all entries", async () => {
    const { getSlangForLanguage, getAvailableSlangLanguages } = await import("../lib/slang-data");
    const languages = getAvailableSlangLanguages();

    for (const lang of languages) {
      const entries = getSlangForLanguage(lang.code);
      for (const entry of entries) {
        expect(entry.id).toBeDefined();
        expect(entry.expression).toBeDefined();
        expect(entry.expression.length).toBeGreaterThan(0);
        expect(entry.meaning).toBeDefined();
        expect(entry.meaning.length).toBeGreaterThan(0);
        expect(entry.category).toBeDefined();
        expect(entry.formality).toBeDefined();
        expect(["very informal", "informal", "neutral", "formal"]).toContain(entry.formality);
      }
    }
  });

  it("should support multi-language curriculum system", async () => {
    const { getCurriculum, getAvailableCurricula } = await import("../lib/curriculum-data");

    const available = getAvailableCurricula();
    expect(available.length).toBeGreaterThan(5); // At least 6 curricula

    // Spanish Dominican curriculum
    const esDo = getCurriculum("es", "dominican");
    expect(esDo).toBeDefined();
    expect(esDo!.units.length).toBeGreaterThan(0);
    expect(esDo!.units[0].lessons.length).toBeGreaterThan(0);

    // French curriculum
    const fr = getCurriculum("fr");
    expect(fr).toBeDefined();
    expect(fr!.units.length).toBeGreaterThan(0);

    // Japanese curriculum
    const ja = getCurriculum("ja");
    expect(ja).toBeDefined();
    expect(ja!.units.length).toBeGreaterThan(0);
  });
});
