import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

const appDir = path.resolve(__dirname, "..");

describe("Translator Setup Walkthrough Screen", () => {
  const filePath = path.join(appDir, "app/translator-setup.tsx");
  const content = fs.readFileSync(filePath, "utf-8");

  it("exists and exports a default component", () => {
    expect(fs.existsSync(filePath)).toBe(true);
    expect(content).toContain("export default function TranslatorSetupScreen");
  });

  it("has 5 walkthrough steps", () => {
    expect(content).toContain('id: "intro"');
    expect(content).toContain('id: "step1"');
    expect(content).toContain('id: "step2"');
    expect(content).toContain('id: "step3"');
    expect(content).toContain('id: "try-it"');
  });

  it("includes iOS Settings navigation instructions", () => {
    expect(content).toContain("Open iOS Settings");
    expect(content).toContain("Settings → Translate");
  });

  it("mentions selecting ConnectWorld AI as default", () => {
    expect(content).toContain("Select ConnectWorld AI");
    expect(content).toContain("Default Translation App");
  });

  it("mentions iOS version requirement", () => {
    expect(content).toContain("iOS 17.4");
  });

  it("has a horizontal FlatList carousel", () => {
    expect(content).toContain("FlatList");
    expect(content).toContain("horizontal");
    expect(content).toContain("pagingEnabled");
  });

  it("has progress dots", () => {
    expect(content).toContain("dotsContainer");
    expect(content).toContain("dotActive");
    expect(content).toContain("dotCompleted");
  });

  it("has Next and Skip buttons", () => {
    expect(content).toContain("handleNext");
    expect(content).toContain("handleSkip");
    expect(content).toContain("Get Started");
    expect(content).toContain("Skip for now");
  });

  it("uses reanimated for entrance animations", () => {
    expect(content).toContain("FadeInDown");
    expect(content).toContain("react-native-reanimated");
  });

  it("uses haptics on navigation", () => {
    expect(content).toContain("Haptics.impactAsync");
  });

  it("has feature highlights on final step", () => {
    expect(content).toContain("Animated gradient popup");
    expect(content).toContain("Color-coded word-by-word grammar");
    expect(content).toContain("Pronunciation for every word");
    expect(content).toContain("Learn These");
  });

  it("uses ConnectWorld AI neon blue branding", () => {
    expect(content).toContain("#00AAFF");
    expect(content).toContain("#040810");
  });

  it("has Open iOS Settings action on final step", () => {
    expect(content).toContain("Open iOS Settings");
    expect(content).toContain("handleOpenSettings");
  });
});

describe("Translator Setup Wiring", () => {
  it("translation-hub links to translator-setup", () => {
    const hubPath = path.join(appDir, "app/translation-hub.tsx");
    const hubContent = fs.readFileSync(hubPath, "utf-8");
    expect(hubContent).toContain('"/translator-setup"');
  });

  it("settings links to translator-setup", () => {
    const settingsPath = path.join(appDir, "app/settings.tsx");
    const settingsContent = fs.readFileSync(settingsPath, "utf-8");
    expect(settingsContent).toContain('"/translator-setup"');
    expect(settingsContent).toContain("Set as Default iOS Translator");
  });
});
