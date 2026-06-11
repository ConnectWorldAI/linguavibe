import { describe, it, expect } from "vitest";
import { getCurriculum, getAvailableCurricula } from "../lib/curriculum-data";

describe("Korean, Italian, and German Curricula", () => {
  it("should have Korean curriculum available", () => {
    const curricula = getAvailableCurricula();
    const korean = curricula.find(c => c.code === "ko");
    expect(korean).toBeDefined();
    expect(korean!.name).toContain("Korean");
  });

  it("should have Italian curriculum available", () => {
    const curricula = getAvailableCurricula();
    const italian = curricula.find(c => c.code === "it");
    expect(italian).toBeDefined();
    expect(italian!.name).toContain("Italian");
  });

  it("should have German curriculum available", () => {
    const curricula = getAvailableCurricula();
    const german = curricula.find(c => c.code === "de");
    expect(german).toBeDefined();
    expect(german!.name).toContain("German");
  });

  it("Korean curriculum should have 9 units and 45 lessons", () => {
    const curriculum = getCurriculum("ko");
    expect(curriculum).not.toBeNull();
    if (curriculum) {
      expect(curriculum.units.length).toBe(9);
      const totalLessons = curriculum.units.reduce((sum, u) => sum + u.lessons.length, 0);
      expect(totalLessons).toBe(45);
    }
  });

  it("Italian curriculum should have 9 units and 45 lessons", () => {
    const curriculum = getCurriculum("it");
    expect(curriculum).not.toBeNull();
    if (curriculum) {
      expect(curriculum.units.length).toBe(9);
      const totalLessons = curriculum.units.reduce((sum, u) => sum + u.lessons.length, 0);
      expect(totalLessons).toBe(45);
    }
  });

  it("German curriculum should have 9 units and 45 lessons", () => {
    const curriculum = getCurriculum("de");
    expect(curriculum).not.toBeNull();
    if (curriculum) {
      expect(curriculum.units.length).toBe(9);
      const totalLessons = curriculum.units.reduce((sum, u) => sum + u.lessons.length, 0);
      expect(totalLessons).toBe(45);
    }
  });

  it("all new curricula lessons should have culturalHints", () => {
    for (const code of ["ko", "it", "de"]) {
      const curriculum = getCurriculum(code);
      expect(curriculum).not.toBeNull();
      if (curriculum) {
        for (const unit of curriculum.units) {
          for (const lesson of unit.lessons) {
            expect(lesson.culturalHint).toBeDefined();
            expect(lesson.culturalHint!.length).toBeGreaterThan(10);
          }
        }
      }
    }
  });

  it("Korean curriculum should cover all CEFR levels A1-C2", () => {
    const curriculum = getCurriculum("ko");
    if (curriculum) {
      const levels = new Set(curriculum.units.map(u => u.level));
      expect(levels.has("A1")).toBe(true);
      expect(levels.has("A2")).toBe(true);
      expect(levels.has("B1")).toBe(true);
      expect(levels.has("B2")).toBe(true);
      expect(levels.has("C1")).toBe(true);
      expect(levels.has("C2")).toBe(true);
    }
  });

  it("culturalHints should contain language-specific cultural content", () => {
    const korean = getCurriculum("ko");
    if (korean) {
      const hints = korean.units.flatMap(u => u.lessons.map(l => l.culturalHint || "")).join(" ");
      // Should mention Korean-specific cultural elements
      expect(hints).toMatch(/한글|김치|한복|설날|K-pop|Korean|Seoul/i);
    }

    const italian = getCurriculum("it");
    if (italian) {
      const hints = italian.units.flatMap(u => u.lessons.map(l => l.culturalHint || "")).join(" ");
      expect(hints).toMatch(/pasta|espresso|piazza|Italian|Rome|gelato/i);
    }

    const german = getCurriculum("de");
    if (german) {
      const hints = german.units.flatMap(u => u.lessons.map(l => l.culturalHint || "")).join(" ");
      expect(hints).toMatch(/Brot|Bier|Oktoberfest|German|Berlin|Weihnachtsmarkt/i);
    }
  });
});
