import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

const MUSIC_STYLES_PATH = path.resolve(__dirname, "../lib/cultural-music-styles.ts");
const CREATOR_RESEARCH_PATH = path.resolve(__dirname, "../references/creator-classicalmusicreel.md");

describe("Cultural Music Styles Configuration", () => {
  const source = fs.readFileSync(MUSIC_STYLES_PATH, "utf-8");

  it("exports CULTURAL_MUSIC_STYLES array", () => {
    expect(source).toContain("export const CULTURAL_MUSIC_STYLES: CulturalMusicStyle[]");
  });

  it("defines CulturalMusicStyle interface", () => {
    expect(source).toContain("export interface CulturalMusicStyle");
    expect(source).toContain("classical:");
    expect(source).toContain("modern:");
    expect(source).toContain("studyMusic:");
    expect(source).toContain("generationTags:");
  });

  it("includes Italian classical tradition with opera vocabulary", () => {
    expect(source).toContain("italian_classical");
    expect(source).toContain("bel_canto");
    expect(source).toContain("Verdi");
    expect(source).toContain("forte");
    expect(source).toContain("allegro");
  });

  it("includes German romantic tradition", () => {
    expect(source).toContain("german_romantic");
    expect(source).toContain("Beethoven");
    expect(source).toContain("Bach");
    expect(source).toContain("symphonic");
  });

  it("includes French impressionist tradition", () => {
    expect(source).toContain("french_impressionist");
    expect(source).toContain("Debussy");
    expect(source).toContain("Ravel");
    expect(source).toContain("Satie");
  });

  it("includes Russian romantic tradition", () => {
    expect(source).toContain("russian_romantic");
    expect(source).toContain("Tchaikovsky");
    expect(source).toContain("Rachmaninoff");
  });

  it("includes Spanish classical with flamenco vocabulary", () => {
    expect(source).toContain("spanish_classical");
    expect(source).toContain("flamenco");
    expect(source).toContain("duende");
    expect(source).toContain("Rodrigo");
  });

  it("includes Puerto Rican Latin tradition (from @zeta93fm research)", () => {
    expect(source).toContain("puerto_rican_latin");
    expect(source).toContain("salsa");
    expect(source).toContain("bomba");
    expect(source).toContain("reggaeton");
  });

  it("includes Brazilian bossa nova tradition", () => {
    expect(source).toContain("brazilian_bossa");
    expect(source).toContain("bossa nova");
    expect(source).toContain("Villa-Lobos");
  });

  it("includes Japanese contemporary tradition", () => {
    expect(source).toContain("japanese_contemporary");
    expect(source).toContain("Takemitsu");
    expect(source).toContain("koto");
    expect(source).toContain("shakuhachi");
  });

  it("includes Korean traditional and K-Pop", () => {
    expect(source).toContain("korean_traditional");
    expect(source).toContain("gayageum");
    expect(source).toContain("pansori");
  });

  it("includes Chinese classical tradition", () => {
    expect(source).toContain("chinese_traditional");
    expect(source).toContain("guzheng");
    expect(source).toContain("erhu");
    expect(source).toContain("Tan Dun");
  });

  it("includes Arabic maqam tradition", () => {
    expect(source).toContain("arabic_modal");
    expect(source).toContain("maqam");
    expect(source).toContain("oud");
    expect(source).toContain("tarab");
  });

  it("includes West African rhythmic traditions", () => {
    expect(source).toContain("west_african");
    expect(source).toContain("djembe");
    expect(source).toContain("kora");
    expect(source).toContain("Afrobeat");
  });

  it("includes Polish romantic tradition", () => {
    expect(source).toContain("polish_romantic");
    expect(source).toContain("Chopin");
    expect(source).toContain("polonez");
  });

  it("includes Hungarian folk-classical tradition", () => {
    expect(source).toContain("hungarian_folk");
    expect(source).toContain("Liszt");
    expect(source).toContain("Bartók");
    expect(source).toContain("cimbalom");
  });

  it("exports getMusicStyleForLanguage utility", () => {
    expect(source).toContain("export function getMusicStyleForLanguage(language: string)");
  });

  it("exports getGenerationTagsForLanguage utility", () => {
    expect(source).toContain("export function getGenerationTagsForLanguage(language: string)");
  });

  it("exports getStudyMusicStyle utility", () => {
    expect(source).toContain("export function getStudyMusicStyle(language: string)");
  });

  it("exports getMusicalVocabulary utility", () => {
    expect(source).toContain("export function getMusicalVocabulary(language: string)");
  });

  it("exports getAllCulturalMusicStyles utility", () => {
    expect(source).toContain("export function getAllCulturalMusicStyles()");
  });

  it("each style has vocabularyTerms for language learning", () => {
    const vocabCount = (source.match(/vocabularyTerms:/g) || []).length;
    expect(vocabCount).toBeGreaterThanOrEqual(12);
  });

  it("each style has generationTags for Suno API", () => {
    const tagCount = (source.match(/generationTags:/g) || []).length;
    expect(tagCount).toBeGreaterThanOrEqual(12);
  });
});

describe("Creator Research: @classicalmusicreel", () => {
  const source = fs.readFileSync(CREATOR_RESEARCH_PATH, "utf-8");

  it("documents the creator profile", () => {
    expect(source).toContain("@classicalmusicreel");
    expect(source).toContain("1,000,000");
    expect(source).toContain("Classical Music");
  });

  it("identifies cultural music categories", () => {
    expect(source).toContain("European Classical");
    expect(source).toContain("Orchestral");
    expect(source).toContain("Piano");
    expect(source).toContain("Film Scores");
  });

  it("maps cultures to language learning connections", () => {
    expect(source).toContain("Italian");
    expect(source).toContain("German");
    expect(source).toContain("French");
    expect(source).toContain("Russian");
    expect(source).toContain("Spanish");
  });

  it("defines API training categories", () => {
    expect(source).toContain("CLASSICAL_CULTURE_MAP");
    expect(source).toContain("italian_opera");
    expect(source).toContain("german_romantic");
    expect(source).toContain("french_impressionist");
  });

  it("identifies content pipeline integration points", () => {
    expect(source).toContain("TV Tab Content");
    expect(source).toContain("Lesson Enhancement");
    expect(source).toContain("Music Generation Seeds");
  });

  it("notes partnership opportunity", () => {
    expect(source).toContain("DM us to Collab/Credit/Removal");
  });
});
