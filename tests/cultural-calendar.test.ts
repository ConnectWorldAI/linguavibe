import { describe, it, expect } from "vitest";
import {
  getUpcomingHolidays,
  getAllHolidaysForLanguage,
  getHolidayLessonRecommendation,
  getCurrentHoliday,
  ALL_CULTURAL_HOLIDAYS,
} from "../lib/cultural-calendar";

describe("Cultural Calendar", () => {
  it("should have holidays for all supported languages", () => {
    const languages = ["es-DO", "es-MX", "fr", "ja", "ko", "it", "de", "pt", "zh"];
    for (const lang of languages) {
      const holidays = getAllHolidaysForLanguage(lang);
      expect(holidays.length).toBeGreaterThan(0);
    }
  });

  it("should have at least 25 total holidays across all languages", () => {
    expect(ALL_CULTURAL_HOLIDAYS.length).toBeGreaterThanOrEqual(25);
  });

  it("every holiday should have vocabulary, foods, and greetings", () => {
    for (const h of ALL_CULTURAL_HOLIDAYS) {
      expect(h.vocabulary.length).toBeGreaterThan(0);
      expect(h.foods.length).toBeGreaterThan(0);
      expect(h.greetings.length).toBeGreaterThan(0);
      expect(h.nativeName.length).toBeGreaterThan(0);
      expect(h.traditions.length).toBeGreaterThan(0);
    }
  });

  it("should return upcoming holidays for a date near Día de Muertos", () => {
    const oct20 = new Date(2026, 9, 20); // October 20
    const upcoming = getUpcomingHolidays("es-DO", 14, oct20);
    const diaDeMuertos = upcoming.find(h => h.id === "dia_de_muertos");
    expect(diaDeMuertos).toBeDefined();
  });

  it("should return upcoming holidays for Japanese near New Year", () => {
    const dec20 = new Date(2026, 11, 20); // December 20
    const upcoming = getUpcomingHolidays("ja", 14, dec20);
    const oshogatsu = upcoming.find(h => h.id === "oshogatsu");
    expect(oshogatsu).toBeDefined();
  });

  it("should return a lesson recommendation when holiday is near", () => {
    const oct25 = new Date(2026, 9, 25); // October 25
    const rec = getHolidayLessonRecommendation("es-DO", oct25);
    expect(rec).not.toBeNull();
    if (rec) {
      expect(rec.suggestedVocabulary.length).toBeGreaterThan(0);
      expect(rec.lessonPrompt.length).toBeGreaterThan(0);
    }
  });

  it("should detect current holiday during Oktoberfest", () => {
    const oct1 = new Date(2026, 9, 1); // October 1 (within Oktoberfest)
    const current = getCurrentHoliday("de", oct1);
    expect(current).not.toBeNull();
    if (current) {
      expect(current.id).toBe("oktoberfest");
    }
  });

  it("every holiday should have valid month (1-12) and day (1-31)", () => {
    for (const h of ALL_CULTURAL_HOLIDAYS) {
      expect(h.month).toBeGreaterThanOrEqual(1);
      expect(h.month).toBeLessThanOrEqual(12);
      expect(h.day).toBeGreaterThanOrEqual(1);
      expect(h.day).toBeLessThanOrEqual(31);
    }
  });
});
