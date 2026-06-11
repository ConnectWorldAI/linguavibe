import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

describe("Slang of the Day History Screen", () => {
  const filePath = path.join(__dirname, "../app/slang-history.tsx");
  const content = fs.readFileSync(filePath, "utf-8");

  it("exists as a screen file", () => {
    expect(fs.existsSync(filePath)).toBe(true);
  });

  it("reads slang history from AsyncStorage", () => {
    expect(content).toContain("@slang");
  });

  it("has pronunciation replay with Speech.speak", () => {
    expect(content).toContain("Speech.speak");
  });

  it("supports saving favorites", () => {
    expect(content).toContain("@slang_favorites");
  });

  it("shows word, meaning, and dialect/region", () => {
    expect(content).toContain("dialect");
    expect(content).toContain("meaning");
    expect(content).toContain("dialectFlag");
  });

  it("has filter tabs (All, Favorites)", () => {
    expect(content).toContain("All");
    expect(content).toContain("Favorites");
  });

  it("uses FlatList for the word list", () => {
    expect(content).toContain("FlatList");
  });

  it("has a link to the dialect quiz", () => {
    expect(content).toContain("dialect-quiz");
  });
});

describe("Methodology Recommendation Engine", () => {
  const routerPath = path.join(__dirname, "../server/methodologyIngestionRouter.ts");
  const routerContent = fs.readFileSync(routerPath, "utf-8");

  it("accepts quizPerformance input", () => {
    expect(routerContent).toContain("quizPerformance");
    expect(routerContent).toContain("totalQuestions");
    expect(routerContent).toContain("correctAnswers");
    expect(routerContent).toContain("bestStreak");
  });

  it("accepts learningPace input", () => {
    expect(routerContent).toContain("learningPace");
    expect(routerContent).toContain("slow");
    expect(routerContent).toContain("moderate");
    expect(routerContent).toContain("fast");
  });

  it("accepts struggles input", () => {
    expect(routerContent).toContain("struggles: z.array(z.string())");
  });

  it("scores methods based on student profile", () => {
    expect(routerContent).toContain("let score = 0");
    expect(routerContent).toContain("score += 30");
    expect(routerContent).toContain("score += 20");
  });

  it("returns matchScore and reasons for each recommendation", () => {
    expect(routerContent).toContain("matchScore: s.score");
    expect(routerContent).toContain("reasons: s.reasons");
  });

  it("boosts methods based on quiz accuracy", () => {
    expect(routerContent).toContain("accuracy < 0.5");
    expect(routerContent).toContain("accuracy > 0.8");
  });

  it("matches learning pace to methodology difficulty", () => {
    expect(routerContent).toContain("learningPace === \"slow\"");
    expect(routerContent).toContain("learningPace === \"fast\"");
  });

  it("boosts methods that target specific struggle areas", () => {
    expect(routerContent).toContain("struggleStr.includes(\"pronunciation\")");
    expect(routerContent).toContain("struggleStr.includes(\"grammar\")");
    expect(routerContent).toContain("struggleStr.includes(\"vocabulary\")");
  });
});

describe("Methodology Recommendations Screen", () => {
  const filePath = path.join(__dirname, "../app/methodology-recommendations.tsx");
  const content = fs.readFileSync(filePath, "utf-8");

  it("exists as a screen file", () => {
    expect(fs.existsSync(filePath)).toBe(true);
  });

  it("calls the recommend endpoint", () => {
    expect(content).toContain("methodologyIngestion.recommend.query");
  });

  it("displays student profile summary", () => {
    expect(content).toContain("Your Learning Profile");
    expect(content).toContain("Level");
    expect(content).toContain("Pace");
    expect(content).toContain("Quiz Acc.");
  });

  it("shows match score and reasons", () => {
    expect(content).toContain("matchScore");
    expect(content).toContain("reasons");
  });

  it("has expandable cards with activities", () => {
    expect(content).toContain("exampleActivities");
    expect(content).toContain("expandedIdx");
  });
});

describe("Cultural Lessons Screen (@alyssaacolon style)", () => {
  const filePath = path.join(__dirname, "../app/cultural-lessons.tsx");
  const content = fs.readFileSync(filePath, "utf-8");

  it("exists as a screen file", () => {
    expect(fs.existsSync(filePath)).toBe(true);
  });

  it("calls generateCulturalLesson endpoint", () => {
    expect(content).toContain("generateCulturalLesson");
  });

  it("has topic categories (slang, food, music, traditions, identity)", () => {
    expect(content).toContain("\"slang\"");
    expect(content).toContain("\"food\"");
    expect(content).toContain("\"music\"");
    expect(content).toContain("\"traditions\"");
    expect(content).toContain("\"identity\"");
  });

  it("renders content blocks (intro, cultural_story, vocab_spotlight, heritage_connection, challenge)", () => {
    expect(content).toContain("case \"intro\"");
    expect(content).toContain("case \"cultural_story\"");
    expect(content).toContain("case \"vocab_spotlight\"");
    expect(content).toContain("case \"heritage_connection\"");
    expect(content).toContain("case \"challenge\"");
  });

  it("has pronunciation replay for vocab words", () => {
    expect(content).toContain("Speech.speak");
    expect(content).toContain("speakWord");
  });

  it("supports favoriting lessons", () => {
    expect(content).toContain("@cultural_lessons_favorites");
    expect(content).toContain("toggleFavorite");
  });

  it("tracks lesson history to avoid repeats", () => {
    expect(content).toContain("@cultural_lessons_history");
    expect(content).toContain("previousTopics");
  });

  it("has a Write About It button linking to journal", () => {
    expect(content).toContain("Write About It");
    expect(content).toContain("student-journal");
  });
});

describe("Cultural Lesson Server Endpoint", () => {
  const filePath = path.join(__dirname, "../server/waveCloudChatRouter.ts");
  const content = fs.readFileSync(filePath, "utf-8");

  it("has generateCulturalLesson endpoint", () => {
    expect(content).toContain("generateCulturalLesson: publicProcedure");
  });

  it("accepts topic, dialect, and proficiencyLevel inputs", () => {
    expect(content).toContain("topic: z.enum");
    expect(content).toContain("dialect: z.string()");
    expect(content).toContain("proficiencyLevel: z.string()");
  });

  it("references @alyssaacolon style in the system prompt", () => {
    expect(content).toContain("alyssaacolon");
    expect(content).toContain("Puerto Rican");
    expect(content).toContain("virtual latina prima");
  });

  it("includes bilingual code-switching instructions", () => {
    expect(content).toContain("BILINGUAL CODE-SWITCHING");
    expect(content).toContain("NO SABO");
  });

  it("includes cultural pride and vocabulary in context instructions", () => {
    expect(content).toContain("CULTURAL PRIDE");
    expect(content).toContain("VOCABULARY IN CONTEXT");
  });

  it("returns structured lesson with content blocks", () => {
    expect(content).toContain("vocab_spotlight");
    expect(content).toContain("heritage_connection");
    expect(content).toContain("culturalRegion");
  });
});

describe("Screen Registration", () => {
  const layoutPath = path.join(__dirname, "../app/_layout.tsx");
  const layoutContent = fs.readFileSync(layoutPath, "utf-8");

  it("registers slang-history screen", () => {
    expect(layoutContent).toContain("slang-history");
  });

  it("registers cultural-lessons screen", () => {
    expect(layoutContent).toContain("cultural-lessons");
  });

  it("registers methodology-recommendations screen", () => {
    expect(layoutContent).toContain("methodology-recommendations");
  });
});
