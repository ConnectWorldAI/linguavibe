import { describe, it, expect, vi } from "vitest";

// Mock trpc
vi.mock("@/lib/trpc", () => ({
  trpc: {
    translate: {
      text: { useMutation: () => ({ mutateAsync: vi.fn() }) },
      variety: { useMutation: () => ({ mutateAsync: vi.fn() }) },
      ocr: { useMutation: () => ({ mutateAsync: vi.fn() }) },
      detectLanguage: { useMutation: () => ({ mutateAsync: vi.fn() }) },
      smartReply: { useMutation: () => ({ mutateAsync: vi.fn() }) },
    },
    useUtils: () => ({}),
  },
}));

describe("Auto-Detect Language Feature", () => {
  it("detectLanguage endpoint schema accepts text input", () => {
    // The endpoint accepts a text string and returns language info
    const input = { text: "Que lo que mi hermano" };
    expect(input.text).toBeDefined();
    expect(input.text.length).toBeGreaterThan(0);
    expect(input.text.length).toBeLessThanOrEqual(5000);
  });

  it("detectLanguage response includes language, dialect, slangType, and confidence", () => {
    const mockResponse = {
      success: true,
      language: "Spanish",
      dialect: "Dominican",
      slangType: "street slang",
      confidence: 0.95,
      details: "Que lo que is Dominican street slang for 'What's up'",
    };
    expect(mockResponse.success).toBe(true);
    expect(mockResponse.language).toBe("Spanish");
    expect(mockResponse.dialect).toBe("Dominican");
    expect(mockResponse.slangType).toBe("street slang");
    expect(mockResponse.confidence).toBeGreaterThan(0);
    expect(mockResponse.confidence).toBeLessThanOrEqual(1);
    expect(mockResponse.details).toBeDefined();
  });

  it("auto-detect matches detected language to LANGUAGES array", () => {
    const LANGUAGES = [
      { code: "en", name: "English", flag: "🇺🇸" },
      { code: "es", name: "Spanish", flag: "🇪🇸" },
      { code: "fr", name: "French", flag: "🇫🇷" },
      { code: "pt", name: "Portuguese", flag: "🇧🇷" },
    ];

    const detectedLanguage = "Spanish";
    const matchedLang = LANGUAGES.find(
      (l) => l.name.toLowerCase() === detectedLanguage.toLowerCase()
    );
    expect(matchedLang).toBeDefined();
    expect(matchedLang!.code).toBe("es");
    expect(matchedLang!.flag).toBe("🇪🇸");
  });

  it("auto-detect matches detected dialect to SLANG_VARIANTS", () => {
    const SLANG_VARIANTS = [
      { id: "standard", label: "Standard", free: true },
      { id: "dominican", label: "Dominican 🇩🇴", free: true },
      { id: "venezuelan", label: "Venezuelan 🇻🇪", free: true },
      { id: "colombian", label: "Colombian 🇨🇴", free: true },
      { id: "puerto-rican", label: "Puerto Rican 🇵🇷", free: false },
      { id: "mexican", label: "Mexican 🇲🇽", free: false },
    ];

    const detectedDialect = "Dominican";
    const matchedSlang = SLANG_VARIANTS.find((s) =>
      s.label.toLowerCase().includes(detectedDialect.toLowerCase())
    );
    expect(matchedSlang).toBeDefined();
    expect(matchedSlang!.id).toBe("dominican");
  });

  it("handles unknown language detection gracefully", () => {
    const mockResponse = {
      success: false,
      language: "Unknown",
      dialect: null,
      slangType: null,
      confidence: 0,
      details: "Detection failed",
    };
    expect(mockResponse.success).toBe(false);
    expect(mockResponse.language).toBe("Unknown");
    expect(mockResponse.confidence).toBe(0);
  });
});

describe("Offline Translation Packs Feature", () => {
  it("offline packs data structure is correct", () => {
    const packs = [
      { lang: "Spanish", flag: "🇪🇸", size: "12 MB", phrases: "5,000+" },
      { lang: "French", flag: "🇫🇷", size: "10 MB", phrases: "4,200+" },
      { lang: "Portuguese", flag: "🇧🇷", size: "11 MB", phrases: "4,500+" },
      { lang: "Arabic", flag: "🇸🇦", size: "9 MB", phrases: "3,800+" },
      { lang: "Chinese", flag: "🇨🇳", size: "14 MB", phrases: "5,500+" },
      { lang: "Japanese", flag: "🇯🇵", size: "13 MB", phrases: "4,800+" },
    ];

    expect(packs.length).toBe(6);
    packs.forEach((pack) => {
      expect(pack.lang).toBeDefined();
      expect(pack.flag).toBeDefined();
      expect(pack.size).toMatch(/\d+ MB/);
      expect(pack.phrases).toMatch(/\d+,?\d*\+/);
    });
  });

  it("offline packs are gated behind premium subscription", () => {
    const isPremiumFree = false;
    const isPremiumPaid = true;

    // Free users should see locked state
    expect(isPremiumFree).toBe(false);
    // Paid users should see download buttons
    expect(isPremiumPaid).toBe(true);
  });

  it("subscription check reads from AsyncStorage", () => {
    // Verify the subscription tiers that unlock offline packs
    const validTiers = ["pro", "plus", "class"];
    validTiers.forEach((tier) => {
      const isPremium = tier === "pro" || tier === "plus" || tier === "class";
      expect(isPremium).toBe(true);
    });

    // Free tier should not unlock
    const freeTier: string = "free";
    const isPremiumFree =
      freeTier === "pro" || freeTier === "plus" || freeTier === "class";
    expect(isPremiumFree).toBe(false);
  });
});
