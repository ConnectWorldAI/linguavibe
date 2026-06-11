import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

describe("Sprint 23 — Comparative Grammar Explanation Exercise", () => {
  const projectRoot = path.resolve(__dirname, "..");

  describe("GrammarComparisonExercise component", () => {
    const componentPath = path.join(projectRoot, "components/exercises/grammar-comparison-exercise.tsx");
    const content = fs.readFileSync(componentPath, "utf-8");

    it("should exist as a component file", () => {
      expect(fs.existsSync(componentPath)).toBe(true);
    });

    it("should export GrammarComparisonExercise function", () => {
      expect(content).toContain("export function GrammarComparisonExercise");
    });

    it("should accept grammarTable prop for side-by-side bilingual table", () => {
      expect(content).toContain("grammarTable");
    });

    it("should accept wordOrderExamples prop for sentence structure comparison", () => {
      expect(content).toContain("wordOrderExamples");
    });

    it("should accept quiz prop for comprehension check", () => {
      expect(content).toContain("quiz");
    });

    it("should accept keyRule prop for the main grammar rule", () => {
      expect(content).toContain("keyRule");
    });

    it("should accept nativeLanguage and targetLanguage props", () => {
      expect(content).toContain("nativeLanguage");
      expect(content).toContain("targetLanguage");
    });

    it("should have 4 phases: table, examples, quiz, results", () => {
      expect(content).toContain("\"table\"");
      expect(content).toContain("\"examples\"");
      expect(content).toContain("\"quiz\"");
      expect(content).toContain("\"results\"");
    });

    it("should render pronunciation guides for target language words", () => {
      expect(content).toContain("pronunciationText");
      expect(content).toContain("pronunciation");
    });

    it("should render word-by-word breakdown with pronunciation", () => {
      expect(content).toContain("breakdownWord");
      expect(content).toContain("breakdownPron");
    });

    it("should show order note explaining structural differences", () => {
      expect(content).toContain("orderNote");
      expect(content).toContain("orderNoteText");
    });

    it("should call onComplete with quiz results", () => {
      expect(content).toContain("onComplete(quizCorrect, quiz.length)");
    });

    it("should use haptics for quiz feedback", () => {
      expect(content).toContain("Haptics.notificationAsync");
    });
  });

  describe("Exercise barrel export", () => {
    const indexPath = path.join(projectRoot, "components/exercises/index.ts");
    const content = fs.readFileSync(indexPath, "utf-8");

    it("should export GrammarComparisonExercise", () => {
      expect(content).toContain("GrammarComparisonExercise");
    });
  });

  describe("Adaptive lesson screen integration", () => {
    const lessonPath = path.join(projectRoot, "app/adaptive-lesson.tsx");
    const content = fs.readFileSync(lessonPath, "utf-8");

    it("should import GrammarComparisonExercise", () => {
      expect(content).toContain("GrammarComparisonExercise");
    });

    it("should include grammar_comparison in ExerciseType union", () => {
      expect(content).toContain("grammar_comparison");
    });

    it("should have a case for grammar_comparison in renderExercise", () => {
      expect(content).toContain("case \"grammar_comparison\":");
    });

    it("should pass grammarTable, wordOrderExamples, quiz, keyRule props", () => {
      expect(content).toContain("grammarTopic={exercise.grammarTopic");
      expect(content).toContain("grammarTable={exercise.grammarTable");
      expect(content).toContain("wordOrderExamples={exercise.wordOrderExamples");
      expect(content).toContain("quiz={exercise.quiz");
      expect(content).toContain("keyRule={exercise.keyRule");
    });

    it("should include grammar comparison fields in GeneratedExercise interface", () => {
      expect(content).toContain("grammarTopic?: string");
      expect(content).toContain("grammarTable?: Array");
      expect(content).toContain("wordOrderExamples?: Array");
      expect(content).toContain("quiz?: Array");
      expect(content).toContain("keyRule?: string");
    });
  });

  describe("Server-side adaptive exercise router", () => {
    const routerPath = path.join(projectRoot, "server/adaptiveExerciseRouter.ts");
    const content = fs.readFileSync(routerPath, "utf-8");

    it("should include grammar_comparison in ExerciseTypeEnum", () => {
      expect(content).toContain("\"grammar_comparison\"");
    });

    it("should describe grammar_comparison in the LLM system prompt", () => {
      expect(content).toContain("grammar_comparison: Whiteboard-style side-by-side grammar table");
    });

    it("should include grammar_comparison JSON schema in the user prompt", () => {
      expect(content).toContain("grammarTopic");
      expect(content).toContain("grammarTable");
      expect(content).toContain("wordOrderExamples");
      expect(content).toContain("pronunciationBreakdown");
    });

    it("should instruct LLM to include grammar_comparison for grammar category", () => {
      expect(content).toContain("Include at least ONE grammar_comparison exercise when the category is grammar");
    });
  });

  describe("Culture mode integration", () => {
    const culturePath = path.join(projectRoot, "lib/culture-mode.tsx");
    const content = fs.readFileSync(culturePath, "utf-8");

    it("should include grammar_comparison in grammar mode preferred types", () => {
      expect(content).toContain("grammar_comparison");
      // Check it's in the grammar case
      const grammarSection = content.split("case \"grammar\"")[1]?.split("case")[0] || "";
      expect(grammarSection).toContain("grammar_comparison");
    });

    it("should include grammar_comparison in balanced mode preferred types", () => {
      const balancedSection = content.split("case \"balanced\"")[1]?.split("}")[0] || "";
      expect(balancedSection).toContain("grammar_comparison");
    });
  });
});
