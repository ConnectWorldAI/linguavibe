import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

const APP_DIR = path.resolve(__dirname, "../app");
const TABS_DIR = path.resolve(APP_DIR, "(tabs)");
const LAYOUT_PATH = path.resolve(APP_DIR, "_layout.tsx");

describe("Sprint 2: Messages Redesign", () => {
  const messagesPath = path.join(TABS_DIR, "messages.tsx");
  let messagesContent: string;

  it("messages.tsx exists and is substantial", () => {
    expect(fs.existsSync(messagesPath)).toBe(true);
    messagesContent = fs.readFileSync(messagesPath, "utf-8");
    expect(messagesContent.length).toBeGreaterThan(5000);
  });

  it("has Primary/General/Requests filter tabs", () => {
    messagesContent = fs.readFileSync(messagesPath, "utf-8");
    expect(messagesContent).toContain("Primary");
    expect(messagesContent).toContain("General");
    expect(messagesContent).toContain("Requests");
  });

  it("has verified badges", () => {
    messagesContent = fs.readFileSync(messagesPath, "utf-8");
    expect(messagesContent).toContain("verified");
  });

  it("has tap-to-translate feature", () => {
    messagesContent = fs.readFileSync(messagesPath, "utf-8");
    expect(messagesContent).toContain("translat");
  });

  it("has Voice Clone Memo banner", () => {
    messagesContent = fs.readFileSync(messagesPath, "utf-8");
    expect(messagesContent).toContain("Voice Clone");
  });
});

describe("Sprint 2: Watch Party Expansion", () => {
  const watchPartyPath = path.join(APP_DIR, "watch-party.tsx");
  let watchPartyContent: string;

  it("watch-party.tsx exists and is substantial", () => {
    expect(fs.existsSync(watchPartyPath)).toBe(true);
    watchPartyContent = fs.readFileSync(watchPartyPath, "utf-8");
    expect(watchPartyContent.length).toBeGreaterThan(5000);
  });

  it("has dual subtitle display", () => {
    watchPartyContent = fs.readFileSync(watchPartyPath, "utf-8");
    expect(watchPartyContent).toContain("subtitle");
  });

  it("has vocabulary extraction", () => {
    watchPartyContent = fs.readFileSync(watchPartyPath, "utf-8");
    expect(watchPartyContent).toContain("vocab");
  });

  it("has comprehension quiz", () => {
    watchPartyContent = fs.readFileSync(watchPartyPath, "utf-8");
    expect(watchPartyContent).toContain("quiz");
  });
});

describe("Sprint 2: Translation Hub & ConnectWorld AI Popup", () => {
  const translationHubPath = path.join(APP_DIR, "translation-hub.tsx");
  const translatePopupPath = path.join(APP_DIR, "translate-popup.tsx");
  const liveCallPath = path.join(APP_DIR, "live-call-translation.tsx");

  it("translation-hub.tsx exists", () => {
    expect(fs.existsSync(translationHubPath)).toBe(true);
    const content = fs.readFileSync(translationHubPath, "utf-8");
    expect(content).toContain("Clipboard");
    expect(content).toContain("ConnectWorld");
  });

  it("translate-popup.tsx exists with distinctive design", () => {
    expect(fs.existsSync(translatePopupPath)).toBe(true);
    const content = fs.readFileSync(translatePopupPath, "utf-8");
    expect(content).toContain("ConnectWorld AI");
    expect(content).toContain("wordBreakdown");
    expect(content).toContain("WORD_COLORS");
    expect(content).toContain("formality");
    expect(content).toContain("pronunciation");
  });

  it("live-call-translation.tsx exists", () => {
    expect(fs.existsSync(liveCallPath)).toBe(true);
    const content = fs.readFileSync(liveCallPath, "utf-8");
    expect(content).toContain("Call");
    expect(content.length).toBeGreaterThan(3000);
  });

  it("all screens are registered in _layout.tsx", () => {
    const layout = fs.readFileSync(LAYOUT_PATH, "utf-8");
    expect(layout).toContain("translation-hub");
    expect(layout).toContain("translate-popup");
    expect(layout).toContain("live-call-translation");
  });
});

describe("Sprint 2: iOS Translation Extension Docs", () => {
  it("docs/ios-translation-extension.md exists", () => {
    const docsPath = path.resolve(__dirname, "../docs/ios-translation-extension.md");
    expect(fs.existsSync(docsPath)).toBe(true);
    const content = fs.readFileSync(docsPath, "utf-8");
    expect(content).toContain("TranslationProvider");
    expect(content).toContain("CallKit");
    expect(content).toContain("ConnectWorld AI");
  });
});
