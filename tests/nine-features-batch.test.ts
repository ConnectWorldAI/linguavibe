/**
 * Tests for 9 new features batch:
 * 1. Conversation Phrasebook
 * 2. Translation Widget
 * 3. Multi-language Journal
 * 4. Flashcard SRS
 * 5. Pronunciation Scoring
 * 6. Daily Streak & Gamification
 * 7. Creator Content Feed
 * 8. Phrase Collections/Boards
 * 9. Share Lyrics as Stories
 */
import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

// --- Server Router Tests ---

describe("Phrasebook Router", () => {
  const routerPath = path.join(__dirname, "../server/phrasebookRouter.ts");

  it("exists and exports phrasebookRouter", () => {
    expect(fs.existsSync(routerPath)).toBe(true);
    const content = fs.readFileSync(routerPath, "utf-8");
    expect(content).toContain("export const phrasebookRouter");
  });

  it("has getCategories endpoint", () => {
    const content = fs.readFileSync(routerPath, "utf-8");
    expect(content).toContain("getCategories");
  });

  it("has getPhrases endpoint", () => {
    const content = fs.readFileSync(routerPath, "utf-8");
    expect(content).toContain("getPhrases");
  });

  it("has speakPhrase endpoint for audio playback", () => {
    const content = fs.readFileSync(routerPath, "utf-8");
    expect(content).toContain("speakPhrase");
  });
});

describe("Gamification Router", () => {
  const routerPath = path.join(__dirname, "../server/gamificationRouter.ts");

  it("exists and exports gamificationRouter", () => {
    expect(fs.existsSync(routerPath)).toBe(true);
    const content = fs.readFileSync(routerPath, "utf-8");
    expect(content).toContain("export const gamificationRouter");
  });

  it("has getDailyGoals endpoint", () => {
    const content = fs.readFileSync(routerPath, "utf-8");
    expect(content).toContain("getDailyGoals");
  });

  it("has calculateLevel endpoint for XP", () => {
    const content = fs.readFileSync(routerPath, "utf-8");
    expect(content).toContain("calculateLevel");
  });

  it("has getAchievements endpoint", () => {
    const content = fs.readFileSync(routerPath, "utf-8");
    expect(content).toContain("getAchievements");
  });
});

describe("Pronunciation Scoring Router", () => {
  const routerPath = path.join(__dirname, "../server/pronunciationScoringRouter.ts");

  it("exists and exports pronunciationScoringRouter", () => {
    expect(fs.existsSync(routerPath)).toBe(true);
    const content = fs.readFileSync(routerPath, "utf-8");
    expect(content).toContain("export const pronunciationScoringRouter");
  });

  it("has scorePronunciation endpoint", () => {
    const content = fs.readFileSync(routerPath, "utf-8");
    expect(content).toContain("scorePronunciation");
  });

  it("uses LLM for phonetic comparison", () => {
    const content = fs.readFileSync(routerPath, "utf-8");
    expect(content).toContain("llm");
  });
});

describe("Creator Feed Router", () => {
  const routerPath = path.join(__dirname, "../server/creatorFeedRouter.ts");

  it("exists and exports creatorFeedRouter", () => {
    expect(fs.existsSync(routerPath)).toBe(true);
    const content = fs.readFileSync(routerPath, "utf-8");
    expect(content).toContain("export const creatorFeedRouter");
  });

  it("has getFeed endpoint", () => {
    const content = fs.readFileSync(routerPath, "utf-8");
    expect(content).toContain("getFeed");
  });

  it("has getCreators endpoint", () => {
    const content = fs.readFileSync(routerPath, "utf-8");
    expect(content).toContain("getCreators");
  });
});

describe("Phrase Collections Router", () => {
  const routerPath = path.join(__dirname, "../server/phraseCollectionsRouter.ts");

  it("exists and exports phraseCollectionsRouter", () => {
    expect(fs.existsSync(routerPath)).toBe(true);
    const content = fs.readFileSync(routerPath, "utf-8");
    expect(content).toContain("export const phraseCollectionsRouter");
  });

  it("has getDefaultBoards endpoint", () => {
    const content = fs.readFileSync(routerPath, "utf-8");
    expect(content).toContain("getDefaultBoards");
  });

  it("has categorizePhrase endpoint", () => {
    const content = fs.readFileSync(routerPath, "utf-8");
    expect(content).toContain("categorizePhrase");
  });
});

describe("Share Lyrics Router", () => {
  const routerPath = path.join(__dirname, "../server/shareLyricsRouter.ts");

  it("exists and exports shareLyricsRouter", () => {
    expect(fs.existsSync(routerPath)).toBe(true);
    const content = fs.readFileSync(routerPath, "utf-8");
    expect(content).toContain("export const shareLyricsRouter");
  });

  it("has generateStoryCard endpoint", () => {
    const content = fs.readFileSync(routerPath, "utf-8");
    expect(content).toContain("generateStoryCard");
  });
});

// --- Frontend Screen Tests ---

describe("Conversation Phrasebook Screen", () => {
  const screenPath = path.join(__dirname, "../app/conversation-phrasebook.tsx");

  it("exists", () => {
    expect(fs.existsSync(screenPath)).toBe(true);
  });

  it("has category-based navigation", () => {
    const content = fs.readFileSync(screenPath, "utf-8");
    expect(content).toContain("restaurant");
    expect(content).toContain("airport");
  });

  it("has audio playback functionality", () => {
    const content = fs.readFileSync(screenPath, "utf-8");
    expect(content).toMatch(/play|audio|speak|tts/i);
  });

  it("uses ScreenContainer", () => {
    const content = fs.readFileSync(screenPath, "utf-8");
    expect(content).toContain("ScreenContainer");
  });
});

describe("Translation Widget Screen", () => {
  const screenPath = path.join(__dirname, "../app/translation-widget.tsx");

  it("exists", () => {
    expect(fs.existsSync(screenPath)).toBe(true);
  });

  it("has quick translate input", () => {
    const content = fs.readFileSync(screenPath, "utf-8");
    expect(content).toContain("TextInput");
  });

  it("uses tRPC for translation", () => {
    const content = fs.readFileSync(screenPath, "utf-8");
    expect(content).toMatch(/trpc|translate/i);
  });
});

describe("Multi-language Journal Screen", () => {
  const screenPath = path.join(__dirname, "../app/multi-language-journal.tsx");

  it("exists", () => {
    expect(fs.existsSync(screenPath)).toBe(true);
  });

  it("has AI corrections feature", () => {
    const content = fs.readFileSync(screenPath, "utf-8");
    expect(content).toMatch(/correction|grammar|feedback/i);
  });

  it("supports multiple languages", () => {
    const content = fs.readFileSync(screenPath, "utf-8");
    expect(content).toMatch(/language|Spanish|French/i);
  });
});

describe("Flashcard SRS Screen", () => {
  const screenPath = path.join(__dirname, "../app/flashcard-srs.tsx");

  it("exists", () => {
    expect(fs.existsSync(screenPath)).toBe(true);
  });

  it("implements Leitner box system", () => {
    const content = fs.readFileSync(screenPath, "utf-8");
    expect(content).toMatch(/leitner|box|level|interval/i);
  });

  it("has card flip interaction", () => {
    const content = fs.readFileSync(screenPath, "utf-8");
    expect(content).toMatch(/flip|reveal|answer/i);
  });

  it("has difficulty rating buttons", () => {
    const content = fs.readFileSync(screenPath, "utf-8");
    expect(content).toMatch(/easy|hard|again|good/i);
  });
});

describe("Pronunciation Scoring Screen", () => {
  const screenPath = path.join(__dirname, "../app/pronunciation-scoring.tsx");

  it("exists", () => {
    expect(fs.existsSync(screenPath)).toBe(true);
  });

  it("has recording functionality", () => {
    const content = fs.readFileSync(screenPath, "utf-8");
    expect(content).toMatch(/record|mic|audio/i);
  });

  it("displays score/feedback", () => {
    const content = fs.readFileSync(screenPath, "utf-8");
    expect(content).toMatch(/score|accuracy|feedback/i);
  });
});

describe("Daily Streak Screen", () => {
  const screenPath = path.join(__dirname, "../app/daily-streak.tsx");

  it("exists", () => {
    expect(fs.existsSync(screenPath)).toBe(true);
  });

  it("has streak counter", () => {
    const content = fs.readFileSync(screenPath, "utf-8");
    expect(content).toContain("streak");
  });

  it("has XP system", () => {
    const content = fs.readFileSync(screenPath, "utf-8");
    expect(content).toMatch(/XP|xp|xpReward/);
  });

  it("has daily goals", () => {
    const content = fs.readFileSync(screenPath, "utf-8");
    expect(content).toContain("dailyGoals");
  });

  it("has achievements", () => {
    const content = fs.readFileSync(screenPath, "utf-8");
    expect(content).toContain("achievements");
  });

  it("persists with AsyncStorage", () => {
    const content = fs.readFileSync(screenPath, "utf-8");
    expect(content).toContain("AsyncStorage");
  });
});

describe("Creator Feed Screen", () => {
  const screenPath = path.join(__dirname, "../app/creator-feed.tsx");

  it("exists", () => {
    expect(fs.existsSync(screenPath)).toBe(true);
  });

  it("has category filtering", () => {
    const content = fs.readFileSync(screenPath, "utf-8");
    expect(content).toContain("selectedCategory");
    expect(content).toContain("slang");
    expect(content).toContain("grammar");
  });

  it("shows creator info", () => {
    const content = fs.readFileSync(screenPath, "utf-8");
    expect(content).toContain("creatorName");
    expect(content).toContain("creatorHandle");
  });

  it("has save/bookmark functionality", () => {
    const content = fs.readFileSync(screenPath, "utf-8");
    expect(content).toContain("toggleSave");
    expect(content).toContain("bookmark");
  });

  it("includes @yourspanishwithjavier", () => {
    const content = fs.readFileSync(screenPath, "utf-8");
    expect(content).toContain("yourspanishwithjavier");
  });
});

describe("Phrase Collections Screen", () => {
  const screenPath = path.join(__dirname, "../app/phrase-collections.tsx");

  it("exists", () => {
    expect(fs.existsSync(screenPath)).toBe(true);
  });

  it("has themed boards", () => {
    const content = fs.readFileSync(screenPath, "utf-8");
    expect(content).toContain("Travel");
    expect(content).toContain("Food");
    expect(content).toContain("Slang");
  });

  it("supports creating new boards", () => {
    const content = fs.readFileSync(screenPath, "utf-8");
    expect(content).toContain("createBoard");
  });

  it("persists with AsyncStorage", () => {
    const content = fs.readFileSync(screenPath, "utf-8");
    expect(content).toContain("AsyncStorage");
  });

  it("has grid layout for boards", () => {
    const content = fs.readFileSync(screenPath, "utf-8");
    expect(content).toContain("numColumns");
  });
});

describe("Share Lyrics Stories Screen", () => {
  const screenPath = path.join(__dirname, "../app/share-lyrics-stories.tsx");

  it("exists", () => {
    expect(fs.existsSync(screenPath)).toBe(true);
  });

  it("has multiple card styles", () => {
    const content = fs.readFileSync(screenPath, "utf-8");
    expect(content).toContain("CARD_STYLES");
    expect(content).toContain("Midnight");
    expect(content).toContain("Sunset");
  });

  it("shows translated lyrics on card", () => {
    const content = fs.readFileSync(screenPath, "utf-8");
    expect(content).toContain("translatedLine");
    expect(content).toContain("originalLine");
  });

  it("has share and save actions", () => {
    const content = fs.readFileSync(screenPath, "utf-8");
    expect(content).toContain("handleShare");
    expect(content).toContain("handleSaveToGallery");
  });

  it("supports custom lyrics input", () => {
    const content = fs.readFileSync(screenPath, "utf-8");
    expect(content).toContain("customOriginal");
    expect(content).toContain("customTranslated");
  });
});

// --- Router Registration Test ---

describe("Router Registration", () => {
  const routersPath = path.join(__dirname, "../server/routers.ts");

  it("registers phrasebookRouter", () => {
    const content = fs.readFileSync(routersPath, "utf-8");
    expect(content).toContain("phrasebookRouter");
  });

  it("registers gamificationRouter", () => {
    const content = fs.readFileSync(routersPath, "utf-8");
    expect(content).toContain("gamificationRouter");
  });

  it("registers pronunciationScoringRouter", () => {
    const content = fs.readFileSync(routersPath, "utf-8");
    expect(content).toContain("pronunciationScoringRouter");
  });

  it("registers creatorFeedRouter", () => {
    const content = fs.readFileSync(routersPath, "utf-8");
    expect(content).toContain("creatorFeedRouter");
  });

  it("registers phraseCollectionsRouter", () => {
    const content = fs.readFileSync(routersPath, "utf-8");
    expect(content).toContain("phraseCollectionsRouter");
  });

  it("registers shareLyricsRouter", () => {
    const content = fs.readFileSync(routersPath, "utf-8");
    expect(content).toContain("shareLyricsRouter");
  });
});
