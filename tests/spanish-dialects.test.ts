import { describe, it, expect } from "vitest";
import { getCurriculum, getAvailableCurricula } from "../lib/curriculum-data";
import { getAllHolidaysForLanguage } from "../lib/cultural-calendar";
import { getFreshnessTags, getFreshnessBadge } from "../lib/freshness-tags";

describe("Spanish Dialect Curricula", () => {
  const dialects = ["es-CO", "es-VE", "es-CU", "es-CR", "es-AR", "es-PE", "es-CL", "es-PR"];

  dialects.forEach(code => {
    it(`${code} curriculum has 45 lessons across all CEFR levels`, () => {
      const curriculum = getCurriculum(code);
      expect(curriculum).toBeDefined();
      const totalLessons = curriculum!.units.reduce((sum, u) => sum + u.lessons.length, 0);
      expect(totalLessons).toBe(45);
    });

    it(`${code} curriculum has culturalHints on all lessons`, () => {
      const curriculum = getCurriculum(code);
      const allLessons = curriculum!.units.flatMap(u => u.lessons);
      const withHints = allLessons.filter(l => l.culturalHint && l.culturalHint.length > 10);
      expect(withHints.length).toBe(45);
    });
  });

  it("all 8 dialects are in available curricula", () => {
    const available = getAvailableCurricula();
    dialects.forEach(code => {
      expect(available.some(c => c.code === code)).toBe(true);
    });
  });
});

describe("Cultural Calendar - Dialect Holidays", () => {
  const dialectsWithHolidays = ["es-CO", "es-VE", "es-CU", "es-CR", "es-AR", "es-PE", "es-CL", "es-PR"];

  dialectsWithHolidays.forEach(code => {
    it(`${code} has at least 2 holidays in the cultural calendar`, () => {
      const holidays = getAllHolidaysForLanguage(code);
      expect(holidays.length).toBeGreaterThanOrEqual(2);
    });
  });

  it("holidays have location and history fields", () => {
    const holidays = getAllHolidaysForLanguage("es-DO");
    const withLocation = holidays.filter(h => (h as any).location);
    expect(withLocation.length).toBeGreaterThanOrEqual(1);
    const withHistory = holidays.filter(h => (h as any).history);
    expect(withHistory.length).toBeGreaterThanOrEqual(1);
  });

  it("holidays have dances and newsStyle fields", () => {
    const holidays = getAllHolidaysForLanguage("es-DO");
    const withDances = holidays.filter(h => (h as any).dances?.length > 0);
    expect(withDances.length).toBeGreaterThanOrEqual(1);
    const withNews = holidays.filter(h => (h as any).newsStyle);
    expect(withNews.length).toBeGreaterThanOrEqual(1);
  });
});

describe("Regional Freshness Tags", () => {
  it("provides tags for Spanish dialects with data", () => {
    const dialects = ["es-DO", "es-CO", "es-CU", "es-CR", "es-AR", "es-PE", "es-CL", "es-PR"];
    dialects.forEach(code => {
      const tags = getFreshnessTags(code);
      expect(tags.length).toBeGreaterThan(0);
    });
  });

  it("provides tags for non-Spanish languages", () => {
    const langs = ["fr", "ja", "ko", "it", "de"];
    langs.forEach(code => {
      const tags = getFreshnessTags(code);
      expect(tags.length).toBeGreaterThan(0);
    });
  });

  it("getFreshnessBadge returns correct badge info", () => {
    const badge = getFreshnessBadge("trending");
    expect(badge.emoji).toBe("🔥");
    expect(badge.label).toBe("Trending");
    expect(badge.color).toBeDefined();
  });

  it("tags have word, translation, and freshness fields", () => {
    const tags = getFreshnessTags("es-DO");
    tags.forEach(tag => {
      expect(tag.word).toBeDefined();
      expect(tag.translation).toBeDefined();
      expect(tag.freshness).toBeDefined();
    });
  });
});
