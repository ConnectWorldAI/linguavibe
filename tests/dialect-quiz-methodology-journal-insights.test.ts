/**
 * Tests for:
 * 1. Dialect Quiz endpoint (generateDialectQuiz)
 * 2. Methodology Ingestion Router
 * 3. Journal Analytics Insights wired into Cloud Wave context
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";

const SERVER_DIR = join(__dirname, "..", "server");
const LIB_DIR = join(__dirname, "..", "lib");
const APP_DIR = join(__dirname, "..", "app");

// ─── Dialect Quiz Tests ─────────────────────────────────────────────────────

describe("Dialect Quiz Feature", () => {
  const routerContent = readFileSync(
    join(SERVER_DIR, "waveCloudChatRouter.ts"),
    "utf-8"
  );

  it("should have generateDialectQuiz endpoint defined", () => {
    expect(routerContent).toContain("generateDialectQuiz: publicProcedure");
  });

  it("should accept targetLanguage, difficulty, questionCount, and previouslyAsked", () => {
    expect(routerContent).toContain('targetLanguage: z.string()');
    expect(routerContent).toContain('difficulty: z.enum(["easy", "medium", "hard"])');
    expect(routerContent).toContain("questionCount: z.number().min(3).max(10)");
    expect(routerContent).toContain("previouslyAsked: z.array(z.string())");
  });

  it("should import getSlangKnowledge for real slang data", () => {
    expect(routerContent).toContain('import("./slangKnowledgeLoader")');
  });

  it("should fall back to LLM generation when not enough slang available", () => {
    expect(routerContent).toContain("if (available.length < 4)");
    expect(routerContent).toContain("invokeLLM");
  });

  it("should build quiz from real slang data with region flags", () => {
    expect(routerContent).toContain("regionFlags");
    expect(routerContent).toContain("Dominican Republic");
    expect(routerContent).toContain("Mexico");
    expect(routerContent).toContain("Colombia");
    expect(routerContent).toContain("Venezuela");
    expect(routerContent).toContain("Puerto Rico");
    expect(routerContent).toContain("Panama");
  });

  it("should return questions with correctRegion, options, and explanation", () => {
    expect(routerContent).toContain("correctRegion");
    expect(routerContent).toContain("correctFlag");
    expect(routerContent).toContain("options");
    expect(routerContent).toContain("explanation");
  });

  it("should filter out previously asked words", () => {
    expect(routerContent).toContain("!input.previouslyAsked.includes(s.word)");
  });

  // Client-side dialect quiz screen
  const quizScreen = readFileSync(
    join(APP_DIR, "dialect-quiz.tsx"),
    "utf-8"
  );

  it("should have dialect quiz screen with difficulty selector", () => {
    expect(quizScreen).toContain("DialectQuizScreen");
    expect(quizScreen).toContain("difficulty");
    expect(quizScreen).toContain('"easy"');
    expect(quizScreen).toContain('"medium"');
    expect(quizScreen).toContain('"hard"');
  });

  it("should track score, streak, and previously asked questions", () => {
    expect(quizScreen).toContain("score");
    expect(quizScreen).toContain("streak");
    expect(quizScreen).toContain("previouslyAsked");
    expect(quizScreen).toContain("@dialect_quiz_stats");
    expect(quizScreen).toContain("@dialect_quiz_asked");
  });

  it("should call generateDialectQuiz endpoint", () => {
    expect(quizScreen).toContain("waveCloudChat.generateDialectQuiz.mutate");
  });

  it("should show quiz complete view with score and Cloud Wave message", () => {
    expect(quizScreen).toContain("Quiz Complete");
    expect(quizScreen).toContain("Play Again");
    expect(quizScreen).toContain("You really know your dialects");
  });

  it("should provide haptic feedback on correct/incorrect answers", () => {
    expect(quizScreen).toContain("NotificationFeedbackType.Success");
    expect(quizScreen).toContain("NotificationFeedbackType.Error");
  });

  it("should show explanation after answering", () => {
    expect(quizScreen).toContain("explanationCard");
    expect(quizScreen).toContain("question.explanation");
  });
});

// ─── Methodology Ingestion Router Tests ─────────────────────────────────────

describe("Methodology Ingestion Router", () => {
  const methodologyRouter = readFileSync(
    join(SERVER_DIR, "methodologyIngestionRouter.ts"),
    "utf-8"
  );

  it("should export methodologyIngestionRouter", () => {
    expect(methodologyRouter).toContain("export const methodologyIngestionRouter");
  });

  it("should have ingestOne endpoint", () => {
    expect(methodologyRouter).toContain("ingestOne: publicProcedure");
  });

  it("should accept methodName, teachingStyle, source, and description fields", () => {
    expect(methodologyRouter).toContain("methodName: z.string()");
    expect(methodologyRouter).toContain("teachingStyle: z.string()");
    expect(methodologyRouter).toContain("source: z.string()");
    expect(methodologyRouter).toContain("description: z.string()");
  });

  it("should have query endpoint for querying", () => {
    expect(methodologyRouter).toContain("query: publicProcedure");
  });

  it("should support filtering by language and teaching style", () => {
    expect(methodologyRouter).toContain("language");
    expect(methodologyRouter).toContain("teachingStyle");
  });

  it("should push data to Airtable when configured", () => {
    expect(methodologyRouter).toContain("AIRTABLE_BASE_ID");
    expect(methodologyRouter).toContain("AIRTABLE_API_KEY");
  });

  // Check router registration
  const routersFile = readFileSync(
    join(SERVER_DIR, "routers.ts"),
    "utf-8"
  );

  it("should be registered in the main routers.ts", () => {
    expect(routersFile).toContain("methodologyIngestion");
    expect(routersFile).toContain("methodologyIngestionRouter");
  });
});

// ─── Journal Analytics Insights in Cloud Wave Context Tests ─────────────────

describe("Journal Analytics Insights in Cloud Wave Context", () => {
  const agentContext = readFileSync(
    join(LIB_DIR, "agent-context.tsx"),
    "utf-8"
  );

  it("should have buildJournalInsightsString function", () => {
    expect(agentContext).toContain("async function buildJournalInsightsString()");
  });

  it("should read journal entries from AsyncStorage", () => {
    expect(agentContext).toContain('@student_journal_entries');
  });

  it("should calculate recent average score and error trends", () => {
    expect(agentContext).toContain("recentAvgScore");
    expect(agentContext).toContain("recentAvgErrors");
  });

  it("should compare recent vs older entries for improvement tracking", () => {
    expect(agentContext).toContain("scoreDiff");
    expect(agentContext).toContain("errorDiff");
    expect(agentContext).toContain("Score improved by");
    expect(agentContext).toContain("Errors dropped by");
  });

  it("should detect common error categories (verbs, gender, spelling)", () => {
    expect(agentContext).toContain("verbErrors");
    expect(agentContext).toContain("genderErrors");
    expect(agentContext).toContain("spellingErrors");
    expect(agentContext).toContain("verb conjugation");
    expect(agentContext).toContain("gender agreement");
  });

  it("should include recently learned vocabulary", () => {
    expect(agentContext).toContain("Recently learned words");
  });

  it("should include journalInsights in buildAIContext return type", () => {
    expect(agentContext).toContain("journalInsights: string;");
    expect(agentContext).toContain("journalInsights: await buildJournalInsightsString()");
  });

  it("should pass journalInsights to all waveCloudChat.chat.mutate calls", () => {
    // Count occurrences of journalInsights in mutate calls
    const matches = agentContext.match(/journalInsights: ctx\.journalInsights/g);
    expect(matches).not.toBeNull();
    expect(matches!.length).toBeGreaterThanOrEqual(4);
  });

  // Server-side: journalInsights in system prompt
  const serverRouter = readFileSync(
    join(SERVER_DIR, "waveCloudChatRouter.ts"),
    "utf-8"
  );

  it("should accept journalInsights in the chat endpoint input schema", () => {
    expect(serverRouter).toContain('journalInsights: z.string().default("")');
  });

  it("should include journal insights in the system prompt", () => {
    expect(serverRouter).toContain("JOURNAL WRITING INSIGHTS");
    expect(serverRouter).toContain("verb conjugation errors dropped");
  });

  it("should destructure journalInsights from input", () => {
    expect(serverRouter).toContain("journalInsights,");
  });
});
