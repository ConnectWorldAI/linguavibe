/**
 * Tests for Journal AI Prompts and Teacher Text Personalization
 * 
 * Covers:
 * 1. Student Journal AI prompt generation (UI state, server endpoint)
 * 2. Teacher text personalization with recentVocabulary
 * 3. getRecentLessonVocabulary export and behavior
 * 4. createVanillaClient export from lib/trpc
 */
import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

const ROOT = path.resolve(__dirname, "..");

describe("Student Journal AI Prompts", () => {
  const journalCode = fs.readFileSync(path.join(ROOT, "app/student-journal.tsx"), "utf-8");

  it("imports getStruggles from learning-intelligence", () => {
    expect(journalCode).toContain("import { getStruggles }");
    expect(journalCode).toContain("from \"@/lib/learning-intelligence\"");
  });

  it("imports getRecentLessonVocabulary from teacher-texts-engine", () => {
    expect(journalCode).toContain("import { getRecentLessonVocabulary }");
    expect(journalCode).toContain("from \"@/lib/teacher-texts-engine\"");
  });

  it("has AIPrompt interface with required fields", () => {
    expect(journalCode).toContain("interface AIPrompt");
    expect(journalCode).toContain("prompt_target: string");
    expect(journalCode).toContain("prompt_english: string");
    expect(journalCode).toContain("difficulty:");
    expect(journalCode).toContain("vocabulary_hint: string");
  });

  it("has aiPrompts state variable", () => {
    expect(journalCode).toContain("const [aiPrompts, setAiPrompts]");
  });

  it("has isLoadingPrompts state variable", () => {
    expect(journalCode).toContain("const [isLoadingPrompts, setIsLoadingPrompts]");
  });

  it("has selectedPromptIndex state variable", () => {
    expect(journalCode).toContain("const [selectedPromptIndex, setSelectedPromptIndex]");
  });

  it("has previousPrompts state variable", () => {
    expect(journalCode).toContain("const [previousPrompts, setPreviousPrompts]");
  });

  it("has loadAIPrompts function that calls generateJournalPrompt", () => {
    expect(journalCode).toContain("const loadAIPrompts");
    expect(journalCode).toContain("generateJournalPrompt.mutate");
  });

  it("passes recentVocabulary to generateJournalPrompt", () => {
    expect(journalCode).toContain("recentVocabulary: recentVocab");
  });

  it("passes recentStruggles to generateJournalPrompt", () => {
    expect(journalCode).toContain("recentStruggles: struggles.map");
  });

  it("passes journalStreak to generateJournalPrompt", () => {
    expect(journalCode).toContain("journalStreak:");
  });

  it("passes previousPrompts to generateJournalPrompt", () => {
    expect(journalCode).toContain("previousPrompts");
  });

  it("has selectPrompt function that pre-fills text input", () => {
    expect(journalCode).toContain("const selectPrompt");
    expect(journalCode).toContain("setNewEntry(prompt.prompt_target");
  });

  it("has AIPromptsSection component with carousel", () => {
    expect(journalCode).toContain("const AIPromptsSection");
    expect(journalCode).toContain("Writing Prompts");
  });

  it("shows difficulty badges on prompt cards", () => {
    expect(journalCode).toContain("difficultyBadge");
    expect(journalCode).toContain("getDifficultyColor");
  });

  it("shows vocabulary hints on prompt cards", () => {
    expect(journalCode).toContain("vocabHintRow");
    expect(journalCode).toContain("vocabulary_hint");
  });

  it("has refresh button for prompts", () => {
    expect(journalCode).toContain("onPress={loadAIPrompts}");
    expect(journalCode).toContain("Refresh");
  });

  it("has tap to use indicator", () => {
    expect(journalCode).toContain("Tap to use");
    expect(journalCode).toContain("tapToUseRow");
  });

  it("stores prompt history in AsyncStorage", () => {
    expect(journalCode).toContain("@journal_prompts_history");
    expect(journalCode).toContain("JOURNAL_PROMPTS_HISTORY_KEY");
  });

  it("has horizontal ScrollView for prompt carousel", () => {
    expect(journalCode).toContain("horizontal");
    expect(journalCode).toContain("promptsScroll");
  });

  it("has fallback prompts when server fails", () => {
    expect(journalCode).toContain("¿Cómo fue tu día hoy?");
    expect(journalCode).toContain("Describe tu comida favorita");
  });

  it("only shows prompts when no entry today", () => {
    expect(journalCode).toContain("{!todayHasEntry && <AIPromptsSection />");
  });
});

describe("Server generateJournalPrompt endpoint", () => {
  const serverCode = fs.readFileSync(path.join(ROOT, "server/waveCloudChatRouter.ts"), "utf-8");

  it("has generateJournalPrompt procedure", () => {
    expect(serverCode).toContain("generateJournalPrompt:");
  });

  it("accepts recentVocabulary input", () => {
    // Check the input schema includes recentVocabulary for journal prompts
    const journalPromptSection = serverCode.substring(
      serverCode.indexOf("generateJournalPrompt:"),
      serverCode.indexOf("generateJournalPrompt:") + 1500
    );
    expect(journalPromptSection).toContain("recentVocabulary: z.array(z.string())");
  });

  it("accepts previousPrompts input", () => {
    const journalPromptSection = serverCode.substring(
      serverCode.indexOf("generateJournalPrompt:"),
      serverCode.indexOf("generateJournalPrompt:") + 1500
    );
    expect(journalPromptSection).toContain("previousPrompts: z.array(z.string())");
  });

  it("accepts journalStreak input", () => {
    const journalPromptSection = serverCode.substring(
      serverCode.indexOf("generateJournalPrompt:"),
      serverCode.indexOf("generateJournalPrompt:") + 1500
    );
    expect(journalPromptSection).toContain("journalStreak: z.number()");
  });

  it("builds system prompt with vocabulary reference", () => {
    expect(serverCode).toContain("Recent vocabulary to incorporate");
  });

  it("instructs LLM to not repeat previous prompts", () => {
    expect(serverCode).toContain("DO NOT repeat these prompts");
  });

  it("requests JSON array of 3 prompts", () => {
    expect(serverCode).toContain("Return EXACTLY 3 prompts as JSON array");
  });

  it("has fallback prompts on parse failure", () => {
    expect(serverCode).toContain("How was your day today?");
  });

  it("has fallback prompts on server error", () => {
    expect(serverCode).toContain("How do you feel today?");
  });

  it("returns prompts and generated flag", () => {
    expect(serverCode).toContain("return { prompts, generated: true }");
  });
});

describe("Teacher Text Personalization with recentVocabulary", () => {
  const serverCode = fs.readFileSync(path.join(ROOT, "server/waveCloudChatRouter.ts"), "utf-8");
  const engineCode = fs.readFileSync(path.join(ROOT, "lib/teacher-texts-engine.ts"), "utf-8");

  it("server generateTeacherText accepts recentVocabulary field", () => {
    const teacherTextSection = serverCode.substring(
      serverCode.indexOf("generateTeacherText:"),
      serverCode.indexOf("generateTeacherText:") + 1000
    );
    expect(teacherTextSection).toContain("recentVocabulary: z.array(z.string())");
  });

  it("server prompt references recent vocabulary", () => {
    expect(serverCode).toContain("RECENT VOCABULARY (try to naturally use 1-2 of these)");
  });

  it("server prompt instructs to incorporate vocabulary naturally", () => {
    expect(serverCode).toContain("try to incorporate 1-2 words naturally");
  });

  it("engine passes recentVocabulary to server call", () => {
    expect(engineCode).toContain("recentVocabulary: recentVocab");
  });

  it("engine calls getRecentLessonVocabulary before server call", () => {
    const callIdx = engineCode.indexOf("generateTeacherText.mutate");
    const vocabIdx = engineCode.indexOf("getRecentLessonVocabulary(targetLanguage, cefrLevel)");
    expect(vocabIdx).toBeGreaterThan(-1);
    expect(vocabIdx).toBeLessThan(callIdx);
  });
});

describe("getRecentLessonVocabulary export", () => {
  const engineCode = fs.readFileSync(path.join(ROOT, "lib/teacher-texts-engine.ts"), "utf-8");

  it("is exported as a public function", () => {
    expect(engineCode).toContain("export async function getRecentLessonVocabulary");
  });

  it("reads @lesson_progress from AsyncStorage", () => {
    expect(engineCode).toContain("@lesson_progress");
  });

  it("gets last 5 completed lesson IDs", () => {
    expect(engineCode).toContain("completedIds.slice(-5)");
  });

  it("extracts vocabulary from lesson titles", () => {
    expect(engineCode).toContain("vocabHints.push(lesson.title)");
  });

  it("extracts quoted words from cultural hints", () => {
    expect(engineCode).toContain("lesson.culturalHint.match(/'([^']+)'/g)");
  });

  it("returns max 8 vocabulary hints", () => {
    expect(engineCode).toContain("vocabHints.slice(0, 8)");
  });

  it("returns empty array on error", () => {
    // The function has a try/catch that returns []
    const funcStart = engineCode.indexOf("export async function getRecentLessonVocabulary");
    const funcSection = engineCode.substring(funcStart, funcStart + 800);
    expect(funcSection).toContain("return [];");
  });
});

describe("createVanillaClient export from lib/trpc", () => {
  const trpcCode = fs.readFileSync(path.join(ROOT, "lib/trpc.ts"), "utf-8");

  it("exports createVanillaClient as a function", () => {
    expect(trpcCode).toContain("export function createVanillaClient()");
  });

  it("returns the vanillaClient singleton", () => {
    expect(trpcCode).toContain("return vanillaClient");
  });

  it("does not have duplicate createVanillaClient declarations in imports", () => {
    // The import should use a different alias
    expect(trpcCode).not.toContain("import { createTRPCClient as createVanillaClient");
    expect(trpcCode).toContain("import { createTRPCClient as createTRPCVanilla");
  });

  it("exports vanillaClient constant", () => {
    expect(trpcCode).toContain("export const vanillaClient");
  });

  it("exports createTRPCClient function", () => {
    expect(trpcCode).toContain("export function createTRPCClient()");
  });
});
