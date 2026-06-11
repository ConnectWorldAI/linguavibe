import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

const appDir = path.resolve(__dirname, "..");

describe("Song Analysis Component", () => {
  const filePath = path.join(appDir, "components/song-analysis.tsx");
  const content = fs.readFileSync(filePath, "utf-8");

  it("exists and exports SongAnalysis component", () => {
    expect(fs.existsSync(filePath)).toBe(true);
    expect(content).toContain("export function SongAnalysis");
  });

  it("has SlangEntry type with word, meaning, dialect, dialectFlag", () => {
    expect(content).toContain("export interface SlangEntry");
    expect(content).toContain("word: string");
    expect(content).toContain("meaning: string");
    expect(content).toContain("dialect: string");
    expect(content).toContain("dialectFlag: string");
  });

  it("has DialectInfo type with detected, confidence, characteristics", () => {
    expect(content).toContain("export interface DialectInfo");
    expect(content).toContain("detected: string");
    expect(content).toContain("confidence: number");
    expect(content).toContain("characteristics: string[]");
  });

  it("has CulturalContext type with genre, mood, theme, description", () => {
    expect(content).toContain("export interface CulturalContext");
    expect(content).toContain("genre: string");
    expect(content).toContain("mood: string");
    expect(content).toContain("theme: string");
    expect(content).toContain("description: string");
  });

  it("has LearnerNote type with warning, tip, info types", () => {
    expect(content).toContain("export interface LearnerNote");
    expect(content).toContain('"warning"');
    expect(content).toContain('"tip"');
    expect(content).toContain('"info"');
  });

  it("includes mock slang entries with Puerto Rican and Caribbean dialects", () => {
    expect(content).toContain("Puerto Rican");
    expect(content).toContain("Caribbean");
    expect(content).toContain("Despacito");
    expect(content).toContain("Pasito a pasito");
    expect(content).toContain("Suavecito");
  });

  it("includes dialect detection with confidence score", () => {
    expect(content).toContain("Puerto Rican Spanish (Boricua)");
    expect(content).toContain("confidence: 92");
  });

  it("includes cultural context with genre and description", () => {
    expect(content).toContain("Reggaetón / Latin Pop");
    expect(content).toContain("Romantic, Sensual, Playful");
    expect(content).toContain("Seduction and physical attraction");
  });

  it("includes learner notes about diminutives and regional differences", () => {
    expect(content).toContain("diminutive");
    expect(content).toContain("Dominican");
    expect(content).toContain("Mexican Spanish");
  });

  it("has expandable accordion sections", () => {
    expect(content).toContain("expandedSection");
    expect(content).toContain("toggleSection");
    expect(content).toContain("LayoutAnimation");
  });

  it("has four expandable sections: dialect, slang, cultural, notes", () => {
    expect(content).toContain('"dialect"');
    expect(content).toContain('"slang"');
    expect(content).toContain('"cultural"');
    expect(content).toContain('"notes"');
  });

  it("has AI badge indicator", () => {
    expect(content).toContain("aiBadge");
    expect(content).toContain("sparkles");
    expect(content).toContain("Song Analysis");
  });

  it("shows dialect flags for each slang entry", () => {
    expect(content).toContain("🇵🇷");
    expect(content).toContain("🌴");
    expect(content).toContain("🎵");
  });
});

describe("Song Analysis Integration in Song Player", () => {
  const filePath = path.join(appDir, "app/song-player.tsx");
  const content = fs.readFileSync(filePath, "utf-8");

  it("imports SongAnalysis component", () => {
    expect(content).toContain('import { SongAnalysis } from "@/components/song-analysis"');
  });

  it("renders SongAnalysis in the song player", () => {
    expect(content).toContain("<SongAnalysis");
  });

  it("places analysis after lyrics/grammar and before lesson button", () => {
    const analysisIndex = content.indexOf("<SongAnalysis");
    const lessonIndex = content.indexOf("Start Full Lesson");
    const lyricsIndex = content.indexOf("lyricsContainer");
    expect(analysisIndex).toBeGreaterThan(lyricsIndex);
    expect(analysisIndex).toBeLessThan(lessonIndex);
  });
});
