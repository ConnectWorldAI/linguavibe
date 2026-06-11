import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

describe("Viral Creator Templates", () => {
  const templatesPath = path.join(__dirname, "../lib/viral-creator-templates.ts");
  const templatesCode = fs.readFileSync(templatesPath, "utf-8");

  it("should have all 5 registered creator profiles", () => {
    expect(templatesCode).toContain('id: "chrishpro"');
    expect(templatesCode).toContain('id: "jeffer17"');
    expect(templatesCode).toContain('id: "djramny"');
    expect(templatesCode).toContain('id: "zeta93fm"');
    expect(templatesCode).toContain('id: "classicalmusicreel"');
  });

  it("should define CreatorProfile interface with required fields", () => {
    expect(templatesCode).toContain("export interface CreatorProfile");
    expect(templatesCode).toContain("id: string");
    expect(templatesCode).toContain("handle: string");
    expect(templatesCode).toContain("name: string");
    expect(templatesCode).toContain("platform:");
    expect(templatesCode).toContain("location: string");
    expect(templatesCode).toContain("language: string");
    expect(templatesCode).toContain("dialect?:");
    expect(templatesCode).toContain("format: CreatorFormat");
    expect(templatesCode).toContain("signatureExpressions: string[]");
    expect(templatesCode).toContain("educationalAdaptation: EducationalAdaptation");
  });

  it("should define CreatorFormat with visual and hook styles", () => {
    expect(templatesCode).toContain("export interface CreatorFormat");
    expect(templatesCode).toContain("visualStyle:");
    expect(templatesCode).toContain("talking_head");
    expect(templatesCode).toContain("music_mix");
    expect(templatesCode).toContain("street_interview");
    expect(templatesCode).toContain("hookStyle:");
    expect(templatesCode).toContain("bold_statement");
    expect(templatesCode).toContain("question");
    expect(templatesCode).toContain("sound_hook");
    expect(templatesCode).toContain("durationRange:");
    expect(templatesCode).toContain("textOverlay:");
    expect(templatesCode).toContain("engagementDrivers:");
  });

  it("should have chrishpro with correct profile data", () => {
    expect(templatesCode).toContain('name: "Christian Hernández (Chris H)"');
    expect(templatesCode).toContain('location: "Medellín, Colombia"');
    expect(templatesCode).toContain('dialect: "Colombian (Paisa)"');
    expect(templatesCode).toContain('"parce"');
    expect(templatesCode).toContain('"códigos"');
  });

  it("should have jeffer17 with Dominican dialect", () => {
    expect(templatesCode).toContain('handle: "@jeffer__17"');
    expect(templatesCode).toContain('dialect: "Dominican"');
    expect(templatesCode).toContain('"tú sabe\'"');
    expect(templatesCode).toContain('"klok"');
  });

  it("should have djramny with music_mix format", () => {
    expect(templatesCode).toContain('handle: "@djramny"');
    expect(templatesCode).toContain('niche: "Dembow & urban music"');
    expect(templatesCode).toContain('"prende"');
    expect(templatesCode).toContain('"fuego"');
  });

  it("should have educational adaptation for each creator", () => {
    expect(templatesCode).toContain("educationalAdaptation:");
    expect(templatesCode).toContain("contentTypes:");
    expect(templatesCode).toContain("hookAdaptation:");
    expect(templatesCode).toContain("ctaAdaptation:");
    expect(templatesCode).toContain("suggestedTeacherId:");
  });

  it("should export generateContentBrief function", () => {
    expect(templatesCode).toContain("export function generateContentBrief(");
    expect(templatesCode).toContain("creatorId: string");
    expect(templatesCode).toContain("topic: string");
    expect(templatesCode).toContain("language: string");
    expect(templatesCode).toContain("ContentBrief | null");
  });

  it("should export generateWeeklyBriefs function", () => {
    expect(templatesCode).toContain("export function generateWeeklyBriefs(");
  });

  it("should export generateLLMPrompt function", () => {
    expect(templatesCode).toContain("export function generateLLMPrompt(");
    expect(templatesCode).toContain("HOOK");
    expect(templatesCode).toContain("CONTENT");
    expect(templatesCode).toContain("CTA");
  });

  it("should export helper functions for querying creators", () => {
    expect(templatesCode).toContain("export function getAllCreatorProfiles()");
    expect(templatesCode).toContain("export function getCreatorProfile(");
    expect(templatesCode).toContain("export function getCreatorsByLanguage(");
  });

  it("should define ContentBrief with script sections", () => {
    expect(templatesCode).toContain("export interface ContentBrief");
    expect(templatesCode).toContain("script: ScriptSection[]");
    expect(templatesCode).toContain("hashtags: string[]");
    expect(templatesCode).toContain("targetDuration: number");
    expect(templatesCode).toContain("difficulty:");
  });

  it("should define ScriptSection with hook/content/example/cta types", () => {
    expect(templatesCode).toContain("export interface ScriptSection");
    expect(templatesCode).toContain('"hook"');
    expect(templatesCode).toContain('"content"');
    expect(templatesCode).toContain('"example"');
    expect(templatesCode).toContain('"cta"');
  });
});

describe("Social Sharing Cards", () => {
  const shareCardPath = path.join(__dirname, "../components/share-card.tsx");
  const shareCardCode = fs.readFileSync(shareCardPath, "utf-8");

  it("should export ShareCard component", () => {
    expect(shareCardCode).toContain("export function ShareCard(");
  });

  it("should export generateShareText function", () => {
    expect(shareCardCode).toContain("export function generateShareText(");
  });

  it("should define all 4 card types", () => {
    expect(shareCardCode).toContain("song_lyric");
    expect(shareCardCode).toContain("streak");
    expect(shareCardCode).toContain("new_word");
    expect(shareCardCode).toContain("cultural_fact");
  });

  it("should have gradient colors for each card type", () => {
    expect(shareCardCode).toContain("CARD_GRADIENTS");
    expect(shareCardCode).toContain("song_lyric:");
    expect(shareCardCode).toContain("streak:");
    expect(shareCardCode).toContain("new_word:");
    expect(shareCardCode).toContain("cultural_fact:");
  });

  it("should include LinguaVibe branding in share text", () => {
    expect(shareCardCode).toContain("LinguaVibe");
    expect(shareCardCode).toContain("Learn languages through music & culture");
  });

  it("should support sharing via expo-sharing", () => {
    expect(shareCardCode).toContain("expo-sharing");
    expect(shareCardCode).toContain("Sharing.isAvailableAsync");
    expect(shareCardCode).toContain("Sharing.shareAsync");
  });

  it("should support web navigator.share API", () => {
    expect(shareCardCode).toContain("(navigator as any).share");
    expect(shareCardCode).toContain('Platform.OS === "web"');
  });

  it("should have compact mode for inline usage", () => {
    expect(shareCardCode).toContain("compact");
    expect(shareCardCode).toContain("compactButton");
  });

  it("should export ShareCardData interface with required fields", () => {
    expect(shareCardCode).toContain("export interface ShareCardData");
    expect(shareCardCode).toContain("type: ShareCardType");
    expect(shareCardCode).toContain("content: string");
    expect(shareCardCode).toContain("translation: string");
    expect(shareCardCode).toContain("language: string");
    expect(shareCardCode).toContain("streakCount?:");
    expect(shareCardCode).toContain("wordsLearned?:");
  });

  it("should have share text with emojis for each card type", () => {
    expect(shareCardCode).toContain("🎵");
    expect(shareCardCode).toContain("🔥");
    expect(shareCardCode).toContain("📚");
    expect(shareCardCode).toContain("🌍");
  });

  it("should include I learned this from a song header", () => {
    expect(shareCardCode).toContain("I learned this from a song");
  });
});
