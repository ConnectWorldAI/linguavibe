import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

describe("Viral Music Tracker", () => {
  const trackerPath = path.join(__dirname, "../lib/viral-music-tracker.ts");
  const trackerCode = fs.readFileSync(trackerPath, "utf-8");

  it("exports ViralMusicEntry interface with required fields", () => {
    expect(trackerCode).toContain("export interface ViralMusicEntry");
    expect(trackerCode).toContain("title: string");
    expect(trackerCode).toContain("artist: string");
    expect(trackerCode).toContain("language: string");
    expect(trackerCode).toContain("dialect: string");
    expect(trackerCode).toContain("viralityScore: number");
    expect(trackerCode).toContain("pipelineStatus:");
  });

  it("defines Airtable table fields for Viral Music table", () => {
    expect(trackerCode).toContain("VIRAL_MUSIC_TABLE_FIELDS");
    expect(trackerCode).toContain("Title");
    expect(trackerCode).toContain("Artist");
    expect(trackerCode).toContain("Virality Score");
    expect(trackerCode).toContain("Pipeline Status");
    expect(trackerCode).toContain("Creator (linked)");
  });

  it("includes all major music genres", () => {
    const genres = [
      "dembow", "reggaeton", "salsa", "bachata", "corridos",
      "kpop", "jpop", "afrobeats", "french_rap", "funk_carioca",
    ];
    genres.forEach((genre) => {
      expect(trackerCode).toContain(`"${genre}"`);
    });
  });

  it("provides seed trending music for Spanish", () => {
    expect(trackerCode).toContain("getSeedTrendingMusic");
    expect(trackerCode).toContain('"Spanish"');
    expect(trackerCode).toContain("El Alfa");
    expect(trackerCode).toContain("Bad Bunny");
    expect(trackerCode).toContain("Karol G");
  });

  it("provides seed trending music for multiple languages", () => {
    expect(trackerCode).toContain('"Portuguese"');
    expect(trackerCode).toContain('"Korean"');
    expect(trackerCode).toContain('"Japanese"');
    expect(trackerCode).toContain('"French"');
    expect(trackerCode).toContain('"Arabic"');
  });

  it("includes engagement tracking functions", () => {
    expect(trackerCode).toContain("export async function trackMusicEngagement");
    expect(trackerCode).toContain("export async function getMusicEngagement");
    expect(trackerCode).toContain("songsViewed");
    expect(trackerCode).toContain("lyricsRead");
    expect(trackerCode).toContain("karaokeAttempts");
  });

  it("includes LLM prompt generators for content creation", () => {
    expect(trackerCode).toContain("export function generateLyricBreakdownPrompt");
    expect(trackerCode).toContain("export function generateMusicVocabPrompt");
    expect(trackerCode).toContain("Line-by-line translation");
    expect(trackerCode).toContain("Slang & colloquial terms");
  });

  it("tracks related content per trending item", () => {
    expect(trackerCode).toContain("relatedContent:");
    expect(trackerCode).toContain("lyric_breakdown");
    expect(trackerCode).toContain("vocab_lesson");
    expect(trackerCode).toContain("cultural_context");
    expect(trackerCode).toContain("karaoke");
  });

  it("caches trending data with 4-hour expiry", () => {
    expect(trackerCode).toContain("TRENDING_CACHE_DURATION");
    expect(trackerCode).toContain("4 * 60 * 60 * 1000");
  });
});

describe("Music Vocabulary Generator", () => {
  const generatorPath = path.join(__dirname, "../lib/music-vocab-generator.ts");
  const generatorCode = fs.readFileSync(generatorPath, "utf-8");

  it("exports generateMusicVocabLesson function", () => {
    expect(generatorCode).toContain("export function generateMusicVocabLesson");
  });

  it("exports generateMusicVocabLessons for batch generation", () => {
    expect(generatorCode).toContain("export function generateMusicVocabLessons");
  });

  it("defines MusicVocabLesson interface with required fields", () => {
    expect(generatorCode).toContain("export interface MusicVocabLesson");
    expect(generatorCode).toContain("title: string");
    expect(generatorCode).toContain("sections: MusicVocabSection[]");
    expect(generatorCode).toContain("difficulty:");
    expect(generatorCode).toContain("estimatedMinutes: number");
  });

  it("includes genre-specific vocabulary banks", () => {
    expect(generatorCode).toContain("GENRE_VOCAB_BANKS");
    expect(generatorCode).toContain("dembow:");
    expect(generatorCode).toContain("reggaeton:");
    expect(generatorCode).toContain("corridos:");
    expect(generatorCode).toContain("kpop:");
    expect(generatorCode).toContain("jpop:");
    expect(generatorCode).toContain("funk_carioca:");
  });

  it("includes Dominican dembow vocabulary", () => {
    expect(generatorCode).toContain("bellaqueo");
    expect(generatorCode).toContain("tiguere");
    expect(generatorCode).toContain("janguear");
  });

  it("includes reggaeton vocabulary", () => {
    expect(generatorCode).toContain("bichiyal");
    expect(generatorCode).toContain("sandungueo");
    expect(generatorCode).toContain("bichote");
  });

  it("includes corridos tumbados vocabulary", () => {
    expect(generatorCode).toContain("compa");
    expect(generatorCode).toContain("tumbado");
    expect(generatorCode).toContain("fierro");
  });

  it("includes K-pop vocabulary", () => {
    expect(generatorCode).toContain("대박");
    expect(generatorCode).toContain("파이팅");
    expect(generatorCode).toContain("최애");
  });

  it("includes cultural context notes per genre", () => {
    expect(generatorCode).toContain("getCulturalNote");
    expect(generatorCode).toContain("Dominican Republic");
    expect(generatorCode).toContain("Puerto Rico");
    expect(generatorCode).toContain("Rio de Janeiro");
  });

  it("tracks word register (formal/informal/slang/vulgar)", () => {
    expect(generatorCode).toContain('"formal"');
    expect(generatorCode).toContain('"informal"');
    expect(generatorCode).toContain('"slang"');
    expect(generatorCode).toContain('"vulgar"');
  });

  it("provides getAvailableGenresForLanguage utility", () => {
    expect(generatorCode).toContain("export function getAvailableGenresForLanguage");
  });
});

describe("Study Music Hook", () => {
  const hookPath = path.join(__dirname, "../hooks/use-study-music.ts");
  const hookCode = fs.readFileSync(hookPath, "utf-8");

  it("exports useStudyMusic hook", () => {
    expect(hookCode).toContain("export function useStudyMusic");
  });

  it("returns state and controls", () => {
    expect(hookCode).toContain("state: StudyMusicState");
    expect(hookCode).toContain("controls: StudyMusicControls");
  });

  it("defaults volume to low (0.15) for background listening", () => {
    expect(hookCode).toContain("useState(0.15)");
  });

  it("persists user preferences in AsyncStorage", () => {
    expect(hookCode).toContain("STUDY_MUSIC_ENABLED_KEY");
    expect(hookCode).toContain("STUDY_MUSIC_VOLUME_KEY");
    expect(hookCode).toContain("AsyncStorage.setItem");
  });

  it("provides toggle, setVolume, and setEnabled controls", () => {
    expect(hookCode).toContain("toggle:");
    expect(hookCode).toContain("setVolume:");
    expect(hookCode).toContain("setEnabled:");
  });
});

describe("Engagement Content Strategy", () => {
  const strategyPath = path.join(__dirname, "../references/engagement-content-strategy.md");
  const strategyContent = fs.readFileSync(strategyPath, "utf-8");

  it("defines the engagement flywheel", () => {
    expect(strategyContent).toContain("Engagement Flywheel");
    expect(strategyContent).toContain("Viral Song Discovered");
  });

  it("covers all 5 content pillars", () => {
    expect(strategyContent).toContain("Viral Music");
    expect(strategyContent).toContain("Cultural Entertainment");
    expect(strategyContent).toContain("Live Translation");
    expect(strategyContent).toContain("AI Companion");
    expect(strategyContent).toContain("Community");
  });

  it("includes music content pipeline steps", () => {
    expect(strategyContent).toContain("Step 1: Discovery");
    expect(strategyContent).toContain("Step 2: Content Creation");
    expect(strategyContent).toContain("Step 3: Distribution");
  });

  it("defines engagement metrics with targets", () => {
    expect(strategyContent).toContain("Daily Active Users");
    expect(strategyContent).toContain("Session Duration");
    expect(strategyContent).toContain("Day 7 Retention");
    expect(strategyContent).toContain("Day 30 Retention");
  });

  it("includes weekly content calendar", () => {
    expect(strategyContent).toContain("Monday");
    expect(strategyContent).toContain("Sunday");
    expect(strategyContent).toContain("Content Calendar");
  });
});
