import { describe, it, expect } from "vitest";
import { getExerciseDistribution, getPreferredExerciseTypes } from "../lib/culture-mode";

describe("Culture Mode", () => {
  describe("getExerciseDistribution", () => {
    it("immersive + deep gives 90% cultural", () => {
      const dist = getExerciseDistribution("immersive", "deep");
      expect(dist.cultural).toBe(90);
      expect(dist.grammar).toBe(5);
      expect(dist.mixed).toBe(5);
    });

    it("grammar + deep gives 90% grammar", () => {
      const dist = getExerciseDistribution("grammar", "deep");
      expect(dist.grammar).toBe(90);
      expect(dist.cultural).toBe(0);
    });

    it("balanced + medium gives 40% cultural, 35% grammar", () => {
      const dist = getExerciseDistribution("balanced", "medium");
      expect(dist.cultural).toBe(40);
      expect(dist.grammar).toBe(35);
      expect(dist.mixed).toBe(25);
    });

    it("all distributions sum to 100", () => {
      const modes = ["immersive", "grammar", "balanced"] as const;
      const intensities = ["light", "medium", "deep"] as const;
      for (const mode of modes) {
        for (const intensity of intensities) {
          const dist = getExerciseDistribution(mode, intensity);
          expect(dist.cultural + dist.grammar + dist.mixed).toBe(100);
        }
      }
    });
  });

  describe("getPreferredExerciseTypes", () => {
    it("immersive mode prefers cultural exercise types", () => {
      const types = getPreferredExerciseTypes("immersive");
      expect(types).toContain("story_choice");
      expect(types).toContain("cultural_discovery");
      expect(types).toContain("conversation_chain");
      expect(types).not.toContain("conjugation");
      expect(types).not.toContain("translation");
    });

    it("grammar mode prefers structured exercise types", () => {
      const types = getPreferredExerciseTypes("grammar");
      expect(types).toContain("grammar_comparison");
      expect(types).toContain("fill_the_order");
      expect(types).toContain("match_pairs");
      expect(types).not.toContain("story_choice");
      expect(types).not.toContain("cultural_discovery");
    });

    it("balanced mode includes both cultural and grammar types", () => {
      const types = getPreferredExerciseTypes("balanced");
      expect(types).toContain("story_choice");
      expect(types).toContain("cultural_discovery");
      expect(types).toContain("grammar_comparison");
      expect(types).toContain("fill_the_order");
    });
  });
});
