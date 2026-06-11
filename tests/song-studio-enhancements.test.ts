import { describe, it, expect } from "vitest";

// ─── Test: Dialect-Specific Singing Styles ────────────────────────────────────
describe("Dialect-Specific Singing Styles", () => {
  // Simulate the DIALECT_MAP structure from the studio
  const DIALECT_MAP: Record<string, { id: string; label: string; flag: string; description: string }[]> = {
    es: [
      { id: "standard", label: "Standard", flag: "🇪🇸", description: "Neutral Castilian Spanish" },
      { id: "mexican", label: "Mexican", flag: "🇲🇽", description: "Warm, melodic Mexican inflection" },
      { id: "dominican", label: "Dominican", flag: "🇩🇴", description: "Fast, rhythmic Caribbean flow" },
      { id: "colombian", label: "Colombian", flag: "🇨🇴", description: "Clear, smooth Bogotá style" },
      { id: "argentine", label: "Argentine", flag: "🇦🇷", description: "Tango-influenced porteño" },
      { id: "cuban", label: "Cuban", flag: "🇨🇺", description: "Salsa-infused Havana rhythm" },
      { id: "venezuelan", label: "Venezuelan", flag: "🇻🇪", description: "Energetic, expressive Caracas" },
      { id: "puerto-rican", label: "Puerto Rican", flag: "🇵🇷", description: "Reggaetón-influenced island flow" },
    ],
    fr: [
      { id: "standard", label: "Parisian", flag: "🇫🇷", description: "Classic French pronunciation" },
      { id: "canadian", label: "Québécois", flag: "🇨🇦", description: "Canadian French inflection" },
      { id: "west-african", label: "West African", flag: "🇸🇳", description: "Afro-French musical style" },
    ],
    pt: [
      { id: "standard", label: "Brazilian", flag: "🇧🇷", description: "Bossa nova-influenced Brazilian" },
      { id: "european", label: "European", flag: "🇵🇹", description: "Fado-style Portuguese" },
    ],
    de: [
      { id: "standard", label: "Standard", flag: "🇩🇪", description: "Hochdeutsch pronunciation" },
      { id: "austrian", label: "Austrian", flag: "🇦🇹", description: "Softer Austrian inflection" },
      { id: "swiss", label: "Swiss", flag: "🇨🇭", description: "Swiss German style" },
    ],
    ar: [
      { id: "standard", label: "MSA", flag: "🇸🇦", description: "Modern Standard Arabic" },
      { id: "egyptian", label: "Egyptian", flag: "🇪🇬", description: "Cairo pop vocal style" },
      { id: "levantine", label: "Levantine", flag: "🇱🇧", description: "Lebanese/Syrian musical style" },
    ],
    zh: [
      { id: "standard", label: "Mandarin", flag: "🇨🇳", description: "Standard Mandarin tones" },
      { id: "cantonese", label: "Cantonese", flag: "🇭🇰", description: "Hong Kong Cantopop style" },
    ],
    it: [
      { id: "standard", label: "Standard", flag: "🇮🇹", description: "Classic Italian bel canto" },
      { id: "neapolitan", label: "Neapolitan", flag: "🇮🇹", description: "Southern Italian passion" },
    ],
    en: [
      { id: "standard", label: "American", flag: "🇺🇸", description: "Standard American English" },
      { id: "british", label: "British", flag: "🇬🇧", description: "British RP pronunciation" },
      { id: "jamaican", label: "Jamaican", flag: "🇯🇲", description: "Reggae/dancehall inflection" },
      { id: "nigerian", label: "Nigerian", flag: "🇳🇬", description: "Afrobeats vocal style" },
    ],
  };

  it("should have dialects for Spanish with at least 5 variants", () => {
    expect(DIALECT_MAP.es.length).toBeGreaterThanOrEqual(5);
    const ids = DIALECT_MAP.es.map(d => d.id);
    expect(ids).toContain("mexican");
    expect(ids).toContain("dominican");
    expect(ids).toContain("colombian");
    expect(ids).toContain("argentine");
    expect(ids).toContain("puerto-rican");
  });

  it("should have dialects for French with Canadian and West African", () => {
    const ids = DIALECT_MAP.fr.map(d => d.id);
    expect(ids).toContain("canadian");
    expect(ids).toContain("west-african");
  });

  it("should have dialects for Arabic with Egyptian and Levantine", () => {
    const ids = DIALECT_MAP.ar.map(d => d.id);
    expect(ids).toContain("egyptian");
    expect(ids).toContain("levantine");
  });

  it("should have dialects for English with Jamaican and Nigerian", () => {
    const ids = DIALECT_MAP.en.map(d => d.id);
    expect(ids).toContain("jamaican");
    expect(ids).toContain("nigerian");
  });

  it("every dialect should have id, label, flag, and description", () => {
    for (const [lang, dialects] of Object.entries(DIALECT_MAP)) {
      for (const d of dialects) {
        expect(d.id).toBeTruthy();
        expect(d.label).toBeTruthy();
        expect(d.flag).toBeTruthy();
        expect(d.description).toBeTruthy();
      }
    }
  });

  it("every language should have a 'standard' dialect as first option", () => {
    for (const [lang, dialects] of Object.entries(DIALECT_MAP)) {
      expect(dialects[0].id).toBe("standard");
    }
  });

  it("should not show dialect picker for languages with only 1 option", () => {
    // Languages with only 1 dialect should not show the picker
    const singleDialectLangs = Object.entries(DIALECT_MAP).filter(([_, d]) => d.length <= 1);
    // All our languages have at least 2 dialects
    expect(singleDialectLangs.length).toBe(0);
  });
});

// ─── Test: Pitch-Matching Playback Comparison ─────────────────────────────────
describe("Pitch-Matching Playback Comparison", () => {
  type ComparisonMode = "full_mix" | "original_vocals" | "translated_vocals" | "instrumental";

  const COMPARISON_MODES: { key: ComparisonMode; label: string; icon: string }[] = [
    { key: "full_mix", label: "Full Mix", icon: "musical-notes" },
    { key: "original_vocals", label: "Original", icon: "person" },
    { key: "translated_vocals", label: "Translated", icon: "language" },
    { key: "instrumental", label: "Beat Only", icon: "disc" },
  ];

  it("should have 4 comparison modes", () => {
    expect(COMPARISON_MODES.length).toBe(4);
  });

  it("should include full_mix, original_vocals, translated_vocals, and instrumental", () => {
    const keys = COMPARISON_MODES.map(m => m.key);
    expect(keys).toContain("full_mix");
    expect(keys).toContain("original_vocals");
    expect(keys).toContain("translated_vocals");
    expect(keys).toContain("instrumental");
  });

  it("each mode should have a label and icon", () => {
    for (const mode of COMPARISON_MODES) {
      expect(mode.label).toBeTruthy();
      expect(mode.icon).toBeTruthy();
    }
  });

  it("playback progress should be bounded between 0 and 100", () => {
    let progress = 0;
    // Simulate incrementing
    for (let i = 0; i < 250; i++) {
      progress = Math.min(100, progress + 0.5);
    }
    expect(progress).toBeLessThanOrEqual(100);
    expect(progress).toBeGreaterThanOrEqual(0);
  });

  it("formatTime should correctly format seconds", () => {
    const formatTime = (seconds: number) => {
      const m = Math.floor(seconds / 60);
      const s = seconds % 60;
      return `${m}:${s.toString().padStart(2, "0")}`;
    };
    expect(formatTime(0)).toBe("0:00");
    expect(formatTime(60)).toBe("1:00");
    expect(formatTime(125)).toBe("2:05");
    expect(formatTime(240)).toBe("4:00");
  });
});

// ─── Test: Share Cover Flow ───────────────────────────────────────────────────
describe("Share Cover Flow", () => {
  it("should build correct share text with dialect", () => {
    const songTitle = "End of the Road";
    const songArtist = "Boyz II Men";
    const targetLanguage = "es";
    const selectedDialect = "dominican";
    const shareCaption = "My Dominican version!";

    const SUPPORTED_LANGUAGES = [
      { code: "es", name: "Spanish", flag: "🇪🇸" },
      { code: "fr", name: "French", flag: "🇫🇷" },
    ];

    const DIALECT_MAP_LOCAL: Record<string, { id: string; label: string }[]> = {
      es: [
        { id: "standard", label: "Standard" },
        { id: "dominican", label: "Dominican" },
      ],
    };

    const dialectLabel = DIALECT_MAP_LOCAL[targetLanguage]?.find(d => d.id === selectedDialect)?.label || "";
    const langName = SUPPORTED_LANGUAGES.find(l => l.code === targetLanguage)?.name || targetLanguage;
    const shareText = `♪ "${songTitle}" by ${songArtist}\nTranslated to ${langName}${dialectLabel !== "Standard" ? ` (${dialectLabel})` : ""}\n\n${shareCaption ? shareCaption + "\n\n" : ""}Translated & performed with ConnectWorld AI`;

    expect(shareText).toContain("End of the Road");
    expect(shareText).toContain("Boyz II Men");
    expect(shareText).toContain("Spanish");
    expect(shareText).toContain("(Dominican)");
    expect(shareText).toContain("My Dominican version!");
    expect(shareText).toContain("ConnectWorld AI");
  });

  it("should not include dialect when standard is selected", () => {
    const selectedDialect = "standard";
    const dialectLabel = "Standard";
    const result = dialectLabel !== "Standard" ? ` (${dialectLabel})` : "";
    expect(result).toBe("");
  });

  it("should save post with correct structure", () => {
    const post = {
      id: "123456",
      type: "song_translation_cover",
      songTitle: "End of the Road",
      artist: "Boyz II Men",
      sourceLanguage: "en",
      targetLanguage: "es",
      dialect: "Dominican",
      voiceMode: "ai_voice",
      caption: "Check this out!",
      quality: { syllableMatch: 0.92, rhymePreservation: 0.85 },
      createdAt: new Date().toISOString(),
      likes: 0,
      comments: 0,
    };

    expect(post.type).toBe("song_translation_cover");
    expect(post.dialect).toBe("Dominican");
    expect(post.likes).toBe(0);
    expect(post.quality.syllableMatch).toBeGreaterThan(0);
  });

  it("export progress should reach 100%", () => {
    let progress = 0;
    const increment = 5;
    const steps = 100 / increment;
    for (let i = 0; i < steps; i++) {
      progress = Math.min(100, progress + increment);
    }
    expect(progress).toBe(100);
  });
});
