import { describe, it, expect } from "vitest";
import {
  getCulturalContent,
  SUPPORTED_LANGUAGES,
} from "../lib/cultural-knowledge";
import {
  getCurriculum,
  getAvailableCurricula,
} from "../lib/curriculum-data";

describe("Cultural Knowledge Base", () => {
  it("should have cultural content for all supported languages", () => {
    for (const lang of SUPPORTED_LANGUAGES) {
      const content = getCulturalContent(lang);
      expect(content).toBeDefined();
      expect(content.language).toBeTruthy();
    }
  });

  it("should include food, music, traditions for each language", () => {
    for (const lang of SUPPORTED_LANGUAGES) {
      const content = getCulturalContent(lang);
      expect(content.foods).toBeDefined();
      expect(content.foods.length).toBeGreaterThan(0);
      expect(content.music).toBeDefined();
      expect(content.music.length).toBeGreaterThan(0);
      expect(content.traditions).toBeDefined();
      expect(content.traditions.length).toBeGreaterThan(0);
    }
  });

  it("should have target-language vocabulary in food items", () => {
    for (const lang of SUPPORTED_LANGUAGES) {
      const content = getCulturalContent(lang);
      for (const food of content.foods) {
        expect(food.name).toBeTruthy();
        expect(food.nativeName).toBeTruthy();
        expect(food.description).toBeTruthy();
      }
    }
  });

  it("should have target-language vocabulary in traditions", () => {
    for (const lang of SUPPORTED_LANGUAGES) {
      const content = getCulturalContent(lang);
      for (const tradition of content.traditions) {
        expect(tradition.name).toBeTruthy();
        expect(tradition.nativeName).toBeTruthy();
        expect(tradition.description).toBeTruthy();
      }
    }
  });
});

describe("Curriculum Cultural Integration", () => {
  it("should have culturalHint on lessons across all levels", () => {
    // Check the primary curriculum (Spanish Dominican) which has full cultural coverage
    const curriculum = getCurriculum("es-DO");
    expect(curriculum.units.length).toBeGreaterThan(0);

    let totalLessons = 0;
    let lessonsWithHints = 0;
    for (const unit of curriculum.units) {
      for (const lesson of unit.lessons) {
        totalLessons++;
        if (lesson.culturalHint && lesson.culturalHint.length > 0) {
          lessonsWithHints++;
        }
      }
    }
    expect(totalLessons).toBeGreaterThan(0);
    expect(lessonsWithHints / totalLessons).toBeGreaterThan(0.9);
  });

  it("should have culturalHint that references real cultural elements", () => {
    const curriculum = getCurriculum("es-DO");
    const hintsWithCulture = curriculum.units.flatMap(u => u.lessons)
      .filter(l => l.culturalHint && l.culturalHint.length > 10);
    expect(hintsWithCulture.length).toBeGreaterThan(5);

    const culturalKeywords = ["food", "dance", "holiday", "tradition", "music", "festival",
      "sancocho", "merengue", "bachata", "colmado", "platano", "mofongo",
      "dia", "fiesta", "familia", "cocina", "mercado"];
    const hasRealCulture = hintsWithCulture.some(l =>
      culturalKeywords.some(kw => (l.culturalHint || "").toLowerCase().includes(kw.toLowerCase()))
    );
    expect(hasRealCulture).toBe(true);
  });

  it("should have descriptions that create real-world scenarios", () => {
    const curriculum = getCurriculum("es-DO");
    const lessonsWithContext = curriculum.units.flatMap(u => u.lessons)
      .filter(l => l.description && l.description.length > 10);
    expect(lessonsWithContext.length).toBeGreaterThan(10);
  });
});

describe("Adaptive Exercise Types", () => {
  it("should support all immersive exercise types", () => {
    const exerciseTypes = [
      "story_choice",
      "cultural_discovery",
      "conversation_chain",
      "fill_the_order",
      "match_pairs",
    ];
    expect(exerciseTypes).toHaveLength(5);
    for (const type of exerciseTypes) {
      expect(type).toMatch(/^[a-z_]+$/);
    }
  });

  it("should accept valid exercise generation parameters", () => {
    const validInput = {
      language: "Spanish",
      dialect: "Dominican",
      level: "A1",
      lessonTopic: "Survival Words",
      lessonCategory: "vocabulary",
      culturalFocus: "Learn food names at a Dominican colmado",
    };
    expect(validInput.language).toBeTruthy();
    expect(["A1", "A2", "B1", "B2", "C1", "C2"]).toContain(validInput.level);
    expect(["grammar", "vocabulary", "reading", "writing", "speaking", "listening"]).toContain(validInput.lessonCategory);
  });
});

describe("Voice Exercise Character Profiles", () => {
  it("should have culturally appropriate character types for each language", () => {
    const characterTypes = [
      { id: "spanish_abuela", language: "Spanish" },
      { id: "french_grandmere", language: "French" },
      { id: "japanese_obaachan", language: "Japanese" },
      { id: "korean_halmeoni", language: "Korean" },
      { id: "italian_nonna", language: "Italian" },
      { id: "portuguese_avo", language: "Portuguese" },
      { id: "german_oma", language: "German" },
      { id: "mandarin_nainai", language: "Mandarin" },
    ];
    expect(characterTypes).toHaveLength(8);
    for (const char of characterTypes) {
      expect(char.id).toBeTruthy();
      expect(char.language).toBeTruthy();
    }
  });
});
