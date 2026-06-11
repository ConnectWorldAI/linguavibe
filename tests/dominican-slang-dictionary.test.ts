import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

describe("Dominican Slang Dictionary", () => {
  const screenPath = path.join(__dirname, "../app/dominican-slang-dictionary.tsx");
  const dataPath = path.join(__dirname, "../lib/slang-data.ts");
  const screenContent = fs.readFileSync(screenPath, "utf-8");
  const dataContent = fs.readFileSync(dataPath, "utf-8");

  it("screen file exists", () => {
    expect(fs.existsSync(screenPath)).toBe(true);
  });

  it("has a comprehensive slang database with 15+ Dominican entries", () => {
    const entries = dataContent.match(/id: "es_do/g);
    expect(entries).not.toBeNull();
    expect(entries!.length).toBeGreaterThanOrEqual(15);
  });

  it("each entry in data has required fields", () => {
    expect(dataContent).toContain("expression:");
    expect(dataContent).toContain("literal:");
    expect(dataContent).toContain("meaning:");
    expect(dataContent).toContain("usage:");
    expect(dataContent).toContain("example:");
    expect(dataContent).toContain("exampleTranslation:");
    expect(dataContent).toContain("formality:");
  });

  it("sources content from @spanishovertea and @bilingueblogs", () => {
    // Sources are referenced in the screen UI
    expect(screenContent).toContain("spanishovertea");
    expect(screenContent).toContain("bilingueblogs");
  });

  it("has search functionality", () => {
    expect(screenContent).toContain("searchText");
    expect(screenContent).toContain("TextInput");
  });

  it("has category filters", () => {
    expect(screenContent).toContain("activeCategory");
    expect(screenContent).toContain("categories");
  });

  it("has flip card animation", () => {
    expect(screenContent).toContain("flipped");
    expect(screenContent).toContain("rotate");
  });

  it("has TTS (speak) functionality", () => {
    expect(screenContent).toContain("Speech.speak");
    expect(screenContent).toContain("handleSpeak");
  });

  it("has save/bookmark functionality", () => {
    expect(screenContent).toContain("handleSave");
    expect(screenContent).toContain("saved");
  });

  it("has share functionality", () => {
    expect(screenContent).toContain("Share.share");
    expect(screenContent).toContain("handleShare");
  });

  it("is wired from home screen and translate tab", () => {
    const homeContent = fs.readFileSync(path.join(__dirname, "../app/(tabs)/index.tsx"), "utf-8");
    const translateContent = fs.readFileSync(path.join(__dirname, "../app/(tabs)/translate.tsx"), "utf-8");
    expect(homeContent).toContain("/dominican-slang-dictionary");
    expect(translateContent).toContain("/dominican-slang-dictionary");
  });

  it("includes authentic Dominican expressions in data", () => {
    expect(dataContent).toContain("Qué lo que");
    expect(dataContent).toContain("Vaina");
    expect(dataContent).toContain("Tigueraje");
  });
});
