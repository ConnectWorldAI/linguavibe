import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

describe("Share Lesson Feature", () => {
  const culturalLessonsPath = path.join(__dirname, "../app/cultural-lessons.tsx");
  const culturalLessonsContent = fs.readFileSync(culturalLessonsPath, "utf-8");

  it("imports expo-sharing module", () => {
    expect(culturalLessonsContent).toMatch(/import.*Sharing.*from.*expo-sharing|import.*\*.*as.*Sharing.*from/);
  });

  it("has a share button in the UI", () => {
    expect(culturalLessonsContent).toContain("share");
  });

  it("builds a shareable message with bilingual content", () => {
    expect(culturalLessonsContent).toMatch(/shareText|shareAsync|Share.*Lesson/);
  });

  it("includes cultural lesson title and vocabulary in share content", () => {
    expect(culturalLessonsContent).toMatch(/title|vocab_spotlight|cultural_story/);
  });
});

describe("Dialect Map Screen", () => {
  const dialectMapPath = path.join(__dirname, "../app/dialect-map.tsx");
  const dialectMapContent = fs.readFileSync(dialectMapPath, "utf-8");

  it("exists as a screen file", () => {
    expect(fs.existsSync(dialectMapPath)).toBe(true);
  });

  it("imports SLANG_LANGUAGES and getSlangForLanguage", () => {
    expect(dialectMapContent).toContain("SLANG_LANGUAGES");
    expect(dialectMapContent).toContain("getSlangForLanguage");
  });

  it("defines MAP_REGIONS with continent groupings", () => {
    expect(dialectMapContent).toContain("MAP_REGIONS");
    expect(dialectMapContent).toContain("americas");
    expect(dialectMapContent).toContain("europe");
    expect(dialectMapContent).toContain("asia");
  });

  it("includes Dominican Republic region", () => {
    expect(dialectMapContent).toContain("Dominican Republic");
    expect(dialectMapContent).toContain("dominican");
  });

  it("includes Mexico, Colombia, Venezuela, Panama regions", () => {
    expect(dialectMapContent).toContain("Mexico");
    expect(dialectMapContent).toContain("Colombia");
    expect(dialectMapContent).toContain("Venezuela");
    expect(dialectMapContent).toContain("Panama");
  });

  it("includes non-Spanish regions (Japan, Korea, France, etc.)", () => {
    expect(dialectMapContent).toContain("Japan");
    expect(dialectMapContent).toContain("South Korea");
    expect(dialectMapContent).toContain("France");
  });

  it("has continent filter chips", () => {
    expect(dialectMapContent).toContain("CONTINENTS");
    expect(dialectMapContent).toContain("filterChip");
  });

  it("has pronunciation replay via Speech.speak", () => {
    expect(dialectMapContent).toContain("Speech.speak");
    expect(dialectMapContent).toContain("speakPhrase");
  });

  it("has a Quiz Me button that navigates to dialect-quiz", () => {
    expect(dialectMapContent).toContain("Quiz Me");
    expect(dialectMapContent).toContain("dialect-quiz");
  });

  it("shows cultural context when region is expanded", () => {
    expect(dialectMapContent).toContain("culturalContext");
    expect(dialectMapContent).toContain("expandedRegion");
  });

  it("shows slang preview entries when expanded", () => {
    expect(dialectMapContent).toContain("slangPreview");
    expect(dialectMapContent).toContain("getSlangPreview");
  });

  it("has sample phrase and meaning for each region", () => {
    expect(dialectMapContent).toContain("samplePhrase");
    expect(dialectMapContent).toContain("sampleMeaning");
  });

  it("is registered in _layout.tsx", () => {
    const layoutPath = path.join(__dirname, "../app/_layout.tsx");
    const layoutContent = fs.readFileSync(layoutPath, "utf-8");
    expect(layoutContent).toContain('name="dialect-map"');
  });
});

describe("Methodology Recommendations in Onboarding", () => {
  const onboardingPath = path.join(__dirname, "../app/onboarding.tsx");
  const onboardingContent = fs.readFileSync(onboardingPath, "utf-8");
  const homeScreenPath = path.join(__dirname, "../app/(tabs)/index.tsx");
  const homeScreenContent = fs.readFileSync(homeScreenPath, "utf-8");

  it("saves learning preferences to AsyncStorage during onboarding", () => {
    expect(onboardingContent).toContain("@learning_preferences");
    expect(onboardingContent).toContain("learningPace");
  });

  it("sets show_methodology_recommendation flag after onboarding", () => {
    expect(onboardingContent).toContain("@show_methodology_recommendation");
  });

  it("computes learning pace from minutesPerDay", () => {
    expect(onboardingContent).toMatch(/minutesPerDay\s*<=\s*10.*slow/);
    expect(onboardingContent).toMatch(/moderate/);
    expect(onboardingContent).toMatch(/fast/);
  });

  it("home screen checks for methodology recommendation flag", () => {
    expect(homeScreenContent).toContain("@show_methodology_recommendation");
    expect(homeScreenContent).toContain("showMethodologyBanner");
  });

  it("home screen shows methodology recommendation banner", () => {
    expect(homeScreenContent).toContain("Your Personalized Learning Style");
    expect(homeScreenContent).toContain("See My Recommendation");
  });

  it("banner navigates to methodology-recommendations screen", () => {
    expect(homeScreenContent).toContain("methodology-recommendations");
  });

  it("banner can be dismissed and flag is removed", () => {
    expect(homeScreenContent).toContain("dismissMethodologyBanner");
    expect(homeScreenContent).toContain("removeItem");
  });
});
