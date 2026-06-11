import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

const readFile = (filePath: string) =>
  fs.readFileSync(path.join(__dirname, "..", filePath), "utf-8");

describe("Sprint 24 — Grammar Enhancements", () => {
  describe("Conjugation Table Variant", () => {
    it("GrammarComparisonExercise supports ConjugationTable interface", () => {
      const content = readFile("components/exercises/grammar-comparison-exercise.tsx");
      expect(content).toContain("interface ConjugationEntry");
      expect(content).toContain("interface ConjugationTable");
      expect(content).toContain("pronoun: string");
      expect(content).toContain("present: string");
      expect(content).toContain("past: string");
      expect(content).toContain("future: string");
      expect(content).toContain("presentPron: string");
      expect(content).toContain("pastPron: string");
      expect(content).toContain("futurePron: string");
    });

    it("GrammarComparisonExercise accepts conjugationTable prop", () => {
      const content = readFile("components/exercises/grammar-comparison-exercise.tsx");
      expect(content).toContain("conjugationTable?: ConjugationTable");
    });

    it("renders conjugation phase when conjugationTable is provided", () => {
      const content = readFile("components/exercises/grammar-comparison-exercise.tsx");
      expect(content).toContain('conjugationTable ? "conjugation" : "table"');
      expect(content).toContain("phase === \"conjugation\"");
      expect(content).toContain("conjHeaderRow");
      expect(content).toContain("conjRow");
      expect(content).toContain("conjVerbText");
    });

    it("shows verb name and meaning in conjugation banner", () => {
      const content = readFile("components/exercises/grammar-comparison-exercise.tsx");
      expect(content).toContain("conjugationTable.verb");
      expect(content).toContain("conjugationTable.verbMeaning");
    });

    it("renders Present/Past/Future column headers", () => {
      const content = readFile("components/exercises/grammar-comparison-exercise.tsx");
      expect(content).toContain(">Present</Text>");
      expect(content).toContain(">Past</Text>");
      expect(content).toContain(">Future</Text>");
    });

    it("adaptive-lesson passes conjugationTable to GrammarComparisonExercise", () => {
      const content = readFile("app/adaptive-lesson.tsx");
      expect(content).toContain("conjugationTable={exercise.conjugationTable}");
    });

    it("server prompt includes conjugationTable schema", () => {
      const content = readFile("server/adaptiveExerciseRouter.ts");
      expect(content).toContain('"conjugationTable"');
      expect(content).toContain('"verbMeaning"');
      expect(content).toContain("presentPron");
      expect(content).toContain("pastPron");
      expect(content).toContain("futurePron");
    });
  });

  describe("Grammar Notebook Screen", () => {
    it("grammar-notebook.tsx exists with proper structure", () => {
      const content = readFile("app/grammar-notebook.tsx");
      expect(content).toContain("export default function GrammarNotebookScreen");
      expect(content).toContain("NOTEBOOK_KEY");
      expect(content).toContain("@grammar_notebook_entries");
    });

    it("exports saveGrammarNotebookEntry helper function", () => {
      const content = readFile("app/grammar-notebook.tsx");
      expect(content).toContain("export async function saveGrammarNotebookEntry");
    });

    it("supports loading, displaying, and deleting entries", () => {
      const content = readFile("app/grammar-notebook.tsx");
      expect(content).toContain("loadEntries");
      expect(content).toContain("deleteEntry");
      expect(content).toContain("handleDelete");
    });

    it("renders expandable entry cards with grammar tables", () => {
      const content = readFile("app/grammar-notebook.tsx");
      expect(content).toContain("expandedId");
      expect(content).toContain("setExpandedId");
      expect(content).toContain("entryCard");
      expect(content).toContain("miniTable");
    });

    it("shows conjugation tables in notebook entries", () => {
      const content = readFile("app/grammar-notebook.tsx");
      expect(content).toContain("item.conjugationTable");
      expect(content).toContain("entry.present");
      expect(content).toContain("entry.past");
      expect(content).toContain("entry.future");
    });

    it("has empty state when no entries saved", () => {
      const content = readFile("app/grammar-notebook.tsx");
      expect(content).toContain("No Saved Grammar");
      expect(content).toContain("emptyState");
    });

    it("is registered in _layout.tsx", () => {
      const content = readFile("app/_layout.tsx");
      expect(content).toContain('"grammar-notebook"');
    });

    it("adaptive-lesson imports and uses saveGrammarNotebookEntry", () => {
      const content = readFile("app/adaptive-lesson.tsx");
      expect(content).toContain("saveGrammarNotebookEntry");
      expect(content).toContain("handleSaveToNotebook");
      expect(content).toContain("onSaveToNotebook={handleSaveToNotebook}");
    });
  });

  describe("Voice-Reading on Grammar Table Rows", () => {
    it("GrammarComparisonExercise accepts onPlayAudio callback", () => {
      const content = readFile("components/exercises/grammar-comparison-exercise.tsx");
      expect(content).toContain("onPlayAudio?: (text: string, language: string) => void");
    });

    it("table rows are tappable with Pressable for voice playback", () => {
      const content = readFile("components/exercises/grammar-comparison-exercise.tsx");
      // Grammar table rows use Pressable
      expect(content).toContain("handlePlayRow(row.target)");
      // Conjugation cells use Pressable
      expect(content).toContain("handlePlayRow(entry.present)");
      expect(content).toContain("handlePlayRow(entry.past)");
      expect(content).toContain("handlePlayRow(entry.future)");
    });

    it("shows tap hint text to guide users", () => {
      const content = readFile("components/exercises/grammar-comparison-exercise.tsx");
      expect(content).toContain("Tap any row to hear pronunciation");
      expect(content).toContain("Tap any cell to hear pronunciation");
    });

    it("shows speaker icon on grammar table rows", () => {
      const content = readFile("components/exercises/grammar-comparison-exercise.tsx");
      expect(content).toContain("🔊");
    });

    it("adaptive-lesson wires handlePlayGrammarAudio to onPlayAudio", () => {
      const content = readFile("app/adaptive-lesson.tsx");
      expect(content).toContain("handlePlayGrammarAudio");
      expect(content).toContain("onPlayAudio={handlePlayGrammarAudio}");
    });

    it("handlePlayGrammarAudio uses ElevenLabs with Speech fallback", () => {
      const content = readFile("app/adaptive-lesson.tsx");
      expect(content).toContain("generatePronunciation.mutateAsync");
      expect(content).toContain("Speech.speak(text");
      expect(content).toContain("rate: 0.8");
    });

    it("grammar notebook also supports audio playback on rows", () => {
      const content = readFile("app/grammar-notebook.tsx");
      expect(content).toContain("playAudio");
      expect(content).toContain("generatePronunciation");
    });
  });

  describe("Save to Notebook Button", () => {
    it("GrammarComparisonExercise has save button in table phase", () => {
      const content = readFile("components/exercises/grammar-comparison-exercise.tsx");
      expect(content).toContain("Save to Notebook");
      expect(content).toContain("saveBtn");
      expect(content).toContain("handleSave");
    });

    it("exports GrammarNotebookEntry type", () => {
      const content = readFile("components/exercises/grammar-comparison-exercise.tsx");
      expect(content).toContain("export interface GrammarNotebookEntry");
    });

    it("save button shows confirmation state after saving", () => {
      const content = readFile("components/exercises/grammar-comparison-exercise.tsx");
      expect(content).toContain("Saved to Notebook");
      expect(content).toContain("saveBtnSaved");
      expect(content).toContain("setSaved(true)");
    });
  });
});
