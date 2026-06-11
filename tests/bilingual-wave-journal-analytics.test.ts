/**
 * Tests for:
 * 1. Cloud Wave bilingual & dialect-aware system prompt
 * 2. Journal prompt-of-the-day notification scheduling
 * 3. Journal analytics screen
 */
import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

// ─── Cloud Wave Bilingual Tests ─────────────────────────────────────────────

describe("Cloud Wave Bilingual & Dialect Intelligence", () => {
  const routerPath = path.resolve(__dirname, "../server/waveCloudChatRouter.ts");
  const routerContent = fs.readFileSync(routerPath, "utf-8");

  it("accepts nativeLanguage, targetDialect, and dialectContext in the chat input schema", () => {
    expect(routerContent).toContain("nativeLanguage: z.string().default(\"English\")");
    expect(routerContent).toContain("targetDialect: z.string().default(\"\")");
    expect(routerContent).toContain("dialectContext: z.string().default(\"\")");
  });

  it("destructures nativeLanguage, targetDialect, dialectContext from input", () => {
    expect(routerContent).toContain("nativeLanguage, targetDialect, dialectContext");
  });

  it("imports getSlangKnowledge from slangKnowledgeLoader", () => {
    expect(routerContent).toContain("import { getSlangKnowledge } from \"./slangKnowledgeLoader\"");
  });

  it("calls getSlangKnowledge for dialect intelligence", () => {
    expect(routerContent).toContain("getSlangKnowledge(targetLanguage, targetDialect");
  });

  it("builds bilingual instructions with buildBilingualInstructions function", () => {
    expect(routerContent).toContain("buildBilingualInstructions(nativeLanguage, targetLanguage, targetDialect, dialectContext)");
  });

  it("includes bilingual identity instructions in the system prompt", () => {
    expect(routerContent).toContain("BILINGUAL IDENTITY:");
    expect(routerContent).toContain("You are FULLY BILINGUAL");
  });

  it("includes language detection & response rules", () => {
    expect(routerContent).toContain("LANGUAGE DETECTION & RESPONSE:");
    expect(routerContent).toContain("code-switch");
  });

  it("includes dialect expertise section", () => {
    expect(routerContent).toContain("DIALECT EXPERTISE:");
  });

  it("includes slang recognition rules for multiple dialects", () => {
    expect(routerContent).toContain("Dominican:");
    expect(routerContent).toContain("Mexican:");
    expect(routerContent).toContain("Colombian:");
    expect(routerContent).toContain("Venezuelan:");
    expect(routerContent).toContain("Puerto Rican:");
    expect(routerContent).toContain("Panamanian:");
  });

  it("includes teaching through bilingualism instructions", () => {
    expect(routerContent).toContain("TEACHING THROUGH BILINGUALISM:");
    expect(routerContent).toContain("cognates and language bridges");
  });

  it("system prompt references native language in language learning context", () => {
    expect(routerContent).toContain("Their native language is ${nativeLanguage}");
  });

  it("system prompt includes bilingual critical rule", () => {
    expect(routerContent).toContain("You are BILINGUAL");
    expect(routerContent).toContain("RECOGNIZE the dialect");
  });

  it("includes dialect map with major Spanish-speaking regions", () => {
    expect(routerContent).toContain("\"dominican\": \"Dominican Republic\"");
    expect(routerContent).toContain("\"mexican\": \"Mexico\"");
    expect(routerContent).toContain("\"panamanian\": \"Panama\"");
    expect(routerContent).toContain("\"puerto_rican\": \"Puerto Rico\"");
  });

  it("injects slangSection from Airtable data into the system prompt", () => {
    expect(routerContent).toContain("${slangSection}");
    expect(routerContent).toContain("DIALECT & SLANG INTELLIGENCE (from verified native speakers)");
  });
});

// ─── Agent Context Bilingual Tests ──────────────────────────────────────────

describe("Agent Context passes bilingual data to Cloud Wave", () => {
  const agentPath = path.resolve(__dirname, "../lib/agent-context.tsx");
  const agentContent = fs.readFileSync(agentPath, "utf-8");

  it("buildAIContext return type includes nativeLanguage and targetDialect", () => {
    expect(agentContent).toContain("nativeLanguage: string;");
    expect(agentContent).toContain("targetDialect: string;");
  });

  it("reads native language from AsyncStorage", () => {
    expect(agentContent).toContain("AsyncStorage.getItem(\"@native_language\")");
  });

  it("reads target dialect from AsyncStorage", () => {
    expect(agentContent).toContain("AsyncStorage.getItem(\"@target_dialect\")");
  });

  it("passes nativeLanguage to waveCloudChat.chat.mutate calls", () => {
    const matches = agentContent.match(/nativeLanguage: ctx\.nativeLanguage/g);
    expect(matches).not.toBeNull();
    expect(matches!.length).toBeGreaterThanOrEqual(4);
  });

  it("passes targetDialect to waveCloudChat.chat.mutate calls", () => {
    const matches = agentContent.match(/targetDialect: ctx\.targetDialect/g);
    expect(matches).not.toBeNull();
    expect(matches!.length).toBeGreaterThanOrEqual(4);
  });
});

// ─── Journal Prompt Notification Tests ──────────────────────────────────────

describe("Journal Prompt-of-the-Day Notification", () => {
  const notifPath = path.resolve(__dirname, "../lib/journal-prompt-notification.ts");
  const notifContent = fs.readFileSync(notifPath, "utf-8");

  it("exports scheduleJournalPromptNotification function", () => {
    expect(notifContent).toContain("export async function scheduleJournalPromptNotification");
  });

  it("exports cancelJournalPromptNotification function", () => {
    expect(notifContent).toContain("export async function cancelJournalPromptNotification");
  });

  it("exports initJournalPromptNotification function", () => {
    expect(notifContent).toContain("export async function initJournalPromptNotification");
  });

  it("exports getJournalPromptNotifPrefs function", () => {
    expect(notifContent).toContain("export async function getJournalPromptNotifPrefs");
  });

  it("exports saveJournalPromptNotifPrefs function", () => {
    expect(notifContent).toContain("export async function saveJournalPromptNotifPrefs");
  });

  it("uses DAILY trigger type for scheduling", () => {
    expect(notifContent).toContain("SchedulableTriggerInputTypes.DAILY");
  });

  it("maps preferred study time to notification hour", () => {
    expect(notifContent).toContain("morning: 8");
    expect(notifContent).toContain("afternoon: 14");
    expect(notifContent).toContain("evening: 19");
    expect(notifContent).toContain("night: 21");
  });

  it("reads learning schedule from AsyncStorage for default time", () => {
    expect(notifContent).toContain("@learning_schedule");
  });

  it("includes journal_prompt_of_the_day as notification data type", () => {
    expect(notifContent).toContain("journal_prompt_of_the_day");
  });

  it("routes to student-journal screen on tap", () => {
    expect(notifContent).toContain("screen: \"student-journal\"");
  });

  it("has prompt teasers for notification body", () => {
    expect(notifContent).toContain("PROMPT_TEASERS");
    expect(notifContent).toContain("Your daily writing prompt is ready!");
  });

  it("is initialized in app/_layout.tsx on app start", () => {
    const layoutPath = path.resolve(__dirname, "../app/_layout.tsx");
    const layoutContent = fs.readFileSync(layoutPath, "utf-8");
    expect(layoutContent).toContain("import { initJournalPromptNotification } from \"@/lib/journal-prompt-notification\"");
    expect(layoutContent).toContain("initJournalPromptNotification()");
  });
});

// ─── Journal Analytics Screen Tests ─────────────────────────────────────────

describe("Journal Analytics Screen", () => {
  const analyticsPath = path.resolve(__dirname, "../app/journal-analytics.tsx");
  const analyticsContent = fs.readFileSync(analyticsPath, "utf-8");

  it("exports a default screen component", () => {
    expect(analyticsContent).toContain("export default function JournalAnalyticsScreen");
  });

  it("reads journal entries from AsyncStorage", () => {
    expect(analyticsContent).toContain("@student_journal_entries");
  });

  it("calculates total entries, words, vocab, and corrections", () => {
    expect(analyticsContent).toContain("totalEntries");
    expect(analyticsContent).toContain("totalWords");
    expect(analyticsContent).toContain("totalVocabLearned");
    expect(analyticsContent).toContain("totalCorrections");
  });

  it("calculates average score", () => {
    expect(analyticsContent).toContain("averageScore");
  });

  it("tracks current and longest streak", () => {
    expect(analyticsContent).toContain("currentStreak");
    expect(analyticsContent).toContain("longestStreak");
  });

  it("provides score progression data", () => {
    expect(analyticsContent).toContain("scoreProgression");
    expect(analyticsContent).toContain("Score Progression");
  });

  it("provides corrections trend data (per 100 words)", () => {
    expect(analyticsContent).toContain("correctionsTrend");
    expect(analyticsContent).toContain("Corrections per 100 Words");
  });

  it("provides vocabulary growth data (cumulative)", () => {
    expect(analyticsContent).toContain("vocabGrowth");
    expect(analyticsContent).toContain("Vocabulary Growth (Cumulative)");
  });

  it("shows common mistake categories", () => {
    expect(analyticsContent).toContain("commonMistakeCategories");
    expect(analyticsContent).toContain("Common Mistake Areas");
  });

  it("shows top vocabulary learned", () => {
    expect(analyticsContent).toContain("topVocab");
    expect(analyticsContent).toContain("Top Vocabulary Learned");
  });

  it("supports time range filtering (week, month, all)", () => {
    expect(analyticsContent).toContain("timeRange");
    expect(analyticsContent).toContain("7 Days");
    expect(analyticsContent).toContain("30 Days");
    expect(analyticsContent).toContain("All Time");
  });

  it("shows weekly activity bar chart", () => {
    expect(analyticsContent).toContain("WeeklyBarChart");
    expect(analyticsContent).toContain("This Week");
  });

  it("shows trend indicators (improving/declining/stable)", () => {
    expect(analyticsContent).toContain("Improving");
    expect(analyticsContent).toContain("Declining");
    expect(analyticsContent).toContain("Stable");
  });

  it("has empty state with CTA to start writing", () => {
    expect(analyticsContent).toContain("No Data Yet");
    expect(analyticsContent).toContain("Start Writing");
    expect(analyticsContent).toContain("student-journal");
  });

  it("is accessible from student journal header", () => {
    const journalPath = path.resolve(__dirname, "../app/student-journal.tsx");
    const journalContent = fs.readFileSync(journalPath, "utf-8");
    expect(journalContent).toContain("journal-analytics");
    expect(journalContent).toContain("analytics-outline");
  });
});
