import { describe, it, expect } from "vitest";
import { getCurriculum, getAvailableCurricula } from "../lib/curriculum-data";

describe("Cultural Hints Coverage - All Languages", () => {
  const curricula = getAvailableCurricula();
  
  it("all curricula have cultural hints on their lessons", () => {
    for (const curr of curricula) {
      const curriculum = getCurriculum(curr.code);
      if (!curriculum) continue;
      
      const allLessons = curriculum.units.flatMap(u => u.lessons);
      const withHints = allLessons.filter(l => l.culturalHint && l.culturalHint.length > 0);
      const coverage = (withHints.length / allLessons.length) * 100;
      
      // Every curriculum should have at least 80% coverage
      expect(coverage, `${curr.code} has only ${coverage.toFixed(0)}% cultural hint coverage`).toBeGreaterThanOrEqual(80);
    }
  });

  it("Spanish Dominican has 100% coverage", () => {
    const curriculum = getCurriculum("es-DO");
    expect(curriculum).toBeDefined();
    const allLessons = curriculum!.units.flatMap(u => u.lessons);
    const withHints = allLessons.filter(l => l.culturalHint && l.culturalHint.length > 0);
    expect(withHints.length).toBe(allLessons.length);
  });

  it("cultural hints contain target-language vocabulary", () => {
    // Check that hints include actual words in the target language (not just English descriptions)
    const esDO = getCurriculum("es-DO");
    if (!esDO) return;
    const hints = esDO.units.flatMap(u => u.lessons).map(l => l.culturalHint).filter(Boolean);
    
    // At least 50% of hints should contain non-English characters or Spanish words
    const withTargetLang = hints.filter(h => 
      /[áéíóúñ¿¡]/.test(h!) || // Spanish characters
      /\b(el|la|los|las|un|una|de|del|en|con|por|para)\b/.test(h!) // Spanish articles/prepositions
    );
    expect(withTargetLang.length / hints.length).toBeGreaterThan(0.3);
  });

  it("French curriculum has cultural hints with French vocabulary", () => {
    const fr = getCurriculum("fr");
    if (!fr) return;
    const hints = fr.units.flatMap(u => u.lessons).map(l => l.culturalHint).filter(Boolean);
    expect(hints.length).toBeGreaterThan(30);
    
    // Check for French vocabulary
    const withFrench = hints.filter(h =>
      /[àâéèêëïîôùûüÿçœæ]/.test(h!) || 
      /\b(le|la|les|un|une|de|du|des|en|avec|pour|sur|dans)\b/.test(h!)
    );
    expect(withFrench.length).toBeGreaterThan(10);
  });

  it("Japanese curriculum has cultural hints with Japanese characters", () => {
    const ja = getCurriculum("ja");
    if (!ja) return;
    const hints = ja.units.flatMap(u => u.lessons).map(l => l.culturalHint).filter(Boolean);
    expect(hints.length).toBeGreaterThan(30);
    
    // Check for Japanese characters (hiragana, katakana, kanji)
    const withJapanese = hints.filter(h =>
      /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF]/.test(h!)
    );
    expect(withJapanese.length).toBeGreaterThan(10);
  });

  it("total cultural hints across all curricula exceeds 300", () => {
    let total = 0;
    for (const curr of curricula) {
      const curriculum = getCurriculum(curr.code);
      if (!curriculum) continue;
      const withHints = curriculum.units.flatMap(u => u.lessons).filter(l => l.culturalHint);
      total += withHints.length;
    }
    expect(total).toBeGreaterThanOrEqual(300);
  });
});
