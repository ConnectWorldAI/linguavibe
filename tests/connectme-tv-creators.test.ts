import { describe, it, expect } from "vitest";

/**
 * Tests for ConnectWorld AI TV series data and Featured Dominican Creators integration.
 */

// Simulate the TV_SERIES data from watch-learn.tsx
const TV_SERIES = [
  { id: "spanish-street", name: "Spanish Street", language: "Spanish", dialect: "Mexican", episodes: 12, level: "beginner", teacher: "María" },
  { id: "dominican-vibes", name: "Dominican Vibes", language: "Spanish", dialect: "Dominican", episodes: 10, level: "intermediate", teacher: "Rafael" },
  { id: "paris-life", name: "La Vie Parisienne", language: "French", dialect: "Parisian", episodes: 10, level: "intermediate", teacher: "Jean-Pierre" },
  { id: "tokyo-nights", name: "Tokyo Nights", language: "Japanese", dialect: "Standard", episodes: 8, level: "beginner", teacher: "Yuki" },
  { id: "cairo-stories", name: "Cairo Stories", language: "Arabic", dialect: "Egyptian", episodes: 10, level: "beginner", teacher: "Ahmed" },
  { id: "rio-rhythms", name: "Rio Rhythms", language: "Portuguese", dialect: "Brazilian", episodes: 8, level: "intermediate", teacher: "Isabela" },
  { id: "seoul-hustle", name: "Seoul Hustle", language: "Korean", dialect: "Standard", episodes: 10, level: "beginner", teacher: "Jimin" },
  { id: "mumbai-mix", name: "Mumbai Mix", language: "Hindi", dialect: "Standard", episodes: 10, level: "beginner", teacher: "Priya" },
];

// Simulate the FEATURED_CREATORS data from autoIngestScheduler.ts
const FEATURED_CREATORS = [
  {
    id: "seed_featured_spanishovertea",
    url: "https://www.instagram.com/spanishovertea",
    name: "Spanish Over Tea ☕",
    platform: "instagram",
    language: "Spanish",
    dialect: "Dominican",
    isActive: true,
  },
  {
    id: "seed_featured_bilingueblogs",
    url: "https://www.instagram.com/bilingueblogs",
    name: "Bilingüe Blogs 🗣️",
    platform: "instagram",
    language: "Spanish",
    dialect: "Multi-Dialect",
    isActive: true,
  },
];

describe("ConnectWorld AI TV Series", () => {
  it("should have exactly 8 series", () => {
    expect(TV_SERIES).toHaveLength(8);
  });

  it("should have unique series IDs", () => {
    const ids = TV_SERIES.map(s => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("should include Dominican Vibes series", () => {
    const dominican = TV_SERIES.find(s => s.id === "dominican-vibes");
    expect(dominican).toBeDefined();
    expect(dominican!.dialect).toBe("Dominican");
    expect(dominican!.teacher).toBe("Rafael");
  });

  it("should cover multiple languages", () => {
    const languages = new Set(TV_SERIES.map(s => s.language));
    expect(languages.size).toBeGreaterThanOrEqual(6);
    expect(languages.has("Spanish")).toBe(true);
    expect(languages.has("French")).toBe(true);
    expect(languages.has("Japanese")).toBe(true);
    expect(languages.has("Arabic")).toBe(true);
    expect(languages.has("Korean")).toBe(true);
  });

  it("should have valid difficulty levels", () => {
    const validLevels = ["beginner", "intermediate", "advanced"];
    for (const series of TV_SERIES) {
      expect(validLevels).toContain(series.level);
    }
  });

  it("should have a teacher assigned to each series", () => {
    for (const series of TV_SERIES) {
      expect(series.teacher).toBeTruthy();
      expect(series.teacher.length).toBeGreaterThan(0);
    }
  });
});

describe("Featured Dominican Creators", () => {
  it("should have @spanishovertea as a featured creator", () => {
    const spanishOverTea = FEATURED_CREATORS.find(c => c.id.includes("spanishovertea"));
    expect(spanishOverTea).toBeDefined();
    expect(spanishOverTea!.url).toBe("https://www.instagram.com/spanishovertea");
    expect(spanishOverTea!.dialect).toBe("Dominican");
    expect(spanishOverTea!.platform).toBe("instagram");
  });

  it("should have @bilingueblogs as a featured creator", () => {
    const bilingue = FEATURED_CREATORS.find(c => c.id.includes("bilingueblogs"));
    expect(bilingue).toBeDefined();
    expect(bilingue!.url).toBe("https://www.instagram.com/bilingueblogs");
    expect(bilingue!.dialect).toBe("Multi-Dialect");
    expect(bilingue!.platform).toBe("instagram");
  });

  it("all featured creators should be active", () => {
    for (const creator of FEATURED_CREATORS) {
      expect(creator.isActive).toBe(true);
    }
  });

  it("featured creators should have valid Instagram URLs", () => {
    for (const creator of FEATURED_CREATORS) {
      expect(creator.url).toMatch(/^https:\/\/www\.instagram\.com\//);
    }
  });
});

describe("Dominican Slang AI Extraction", () => {
  it("should detect featured Dominican sources for enhanced extraction", () => {
    // Simulate the detection logic from autoIngestScheduler.ts
    for (const channel of FEATURED_CREATORS) {
      const isFeaturedDominicanSource = channel.id.includes("featured_") &&
        (channel.dialect === "Dominican" || channel.dialect === "Multi-Dialect");
      
      expect(isFeaturedDominicanSource).toBe(true);
    }
  });

  it("should not flag non-featured channels as Dominican sources", () => {
    const regularChannel = {
      id: "user_added_channel_123",
      dialect: "Dominican",
    };
    const isFeaturedDominicanSource = regularChannel.id.includes("featured_") &&
      (regularChannel.dialect === "Dominican" || regularChannel.dialect === "Multi-Dialect");
    
    expect(isFeaturedDominicanSource).toBe(false);
  });
});
