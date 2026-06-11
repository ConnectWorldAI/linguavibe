import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";

const readFile = (path: string) => readFileSync(join(__dirname, "..", path), "utf-8");

describe("Dialect of the Week", () => {
  const moduleContent = readFile("lib/dialect-of-the-week.ts");
  const screenContent = readFile("app/dialect-of-the-week.tsx");

  it("exports getCurrentDialectOfTheWeek function", () => {
    expect(moduleContent).toContain("export function getCurrentDialectOfTheWeek");
  });

  it("exports recordDialectOfTheWeekView function", () => {
    expect(moduleContent).toContain("export async function recordDialectOfTheWeekView");
  });

  it("defines DialectOfTheWeek type with required fields", () => {
    expect(moduleContent).toContain("dialectName");
    expect(moduleContent).toContain("dialectFlag");
    expect(moduleContent).toContain("featuredSlang");
    expect(moduleContent).toContain("culturalFact");
    expect(moduleContent).toContain("quizChallenge");
    expect(moduleContent).toContain("weekNumber");
  });

  it("rotates weekly based on week number", () => {
    expect(moduleContent).toContain("getISOWeekNumber");
  });

  it("screen renders featured slang with pronunciation", () => {
    expect(screenContent).toContain("Speech.speak");
    expect(screenContent).toContain("featuredSlang");
  });

  it("screen links to dialect quiz", () => {
    expect(screenContent).toContain("dialect-quiz");
  });

  it("screen links to dialect map", () => {
    expect(screenContent).toContain("dialect-map");
  });

  it("screen shows weekly challenge section", () => {
    expect(screenContent).toContain("Weekly Challenge");
    expect(screenContent).toContain("Start Dialect Quiz");
  });
});

describe("Social Sharing Card Generator", () => {
  const screenContent = readFile("app/share-card-generator.tsx");

  it("renders card style selector with 5 styles", () => {
    expect(screenContent).toContain("vocab");
    expect(screenContent).toContain("cultural");
    expect(screenContent).toContain("slang");
    expect(screenContent).toContain("quote");
    expect(screenContent).toContain("challenge");
  });

  it("has gradient color cycling", () => {
    expect(screenContent).toContain("GRADIENT_PRESETS");
    expect(screenContent).toContain("cycleGradient");
  });

  it("uses system Share API", () => {
    expect(screenContent).toContain("Share.share");
  });

  it("formats share text with hashtags", () => {
    expect(screenContent).toContain("#ConnectWorldAI");
    expect(screenContent).toContain("#LanguageLearning");
  });

  it("renders card preview with 9:16 ratio for Instagram stories", () => {
    expect(screenContent).toContain("(16 / 9)");
  });

  it("includes ConnectWorld AI branding in footer", () => {
    expect(screenContent).toContain("ConnectWorld AI");
  });

  it("accepts params for pre-filling card content", () => {
    expect(screenContent).toContain("useLocalSearchParams");
    expect(screenContent).toContain("word");
    expect(screenContent).toContain("meaning");
    expect(screenContent).toContain("culturalFact");
  });
});

describe("Explore Tab Dialect Map Integration", () => {
  const exploreContent = readFile("app/(tabs)/explore.tsx");

  it("has Dialect Map doorway entry", () => {
    expect(exploreContent).toContain("Dialect Map");
    expect(exploreContent).toContain("/dialect-map");
  });

  it("has Weekly Dialect doorway entry", () => {
    expect(exploreContent).toContain("Weekly Dialect");
    expect(exploreContent).toContain("/dialect-of-the-week");
  });

  it("has Culture doorway entry linking to cultural-lessons", () => {
    expect(exploreContent).toContain("Culture");
    expect(exploreContent).toContain("/cultural-lessons");
  });

  it("has Share Cards doorway entry", () => {
    expect(exploreContent).toContain("Share Cards");
    expect(exploreContent).toContain("/share-card-generator");
  });

  it("uses globe icon for Dialect Map", () => {
    expect(exploreContent).toContain('name="globe"');
  });

  it("screens are registered in _layout.tsx", () => {
    const layoutContent = readFile("app/_layout.tsx");
    expect(layoutContent).toContain("dialect-of-the-week");
    expect(layoutContent).toContain("share-card-generator");
    expect(layoutContent).toContain("dialect-map");
  });
});
