import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

const appDir = path.resolve(__dirname, "..");

describe("First-Launch Translator Setup Trigger", () => {
  const filePath = path.join(appDir, "app/_layout.tsx");
  const content = fs.readFileSync(filePath, "utf-8");

  it("defines the AsyncStorage key for tracking first launch", () => {
    expect(content).toContain("TRANSLATOR_SETUP_SHOWN_KEY");
    expect(content).toContain("@connectworld_translator_setup_shown");
  });

  it("uses a ref to prevent duplicate checks", () => {
    expect(content).toContain("hasCheckedFirstLaunch");
    expect(content).toContain("useRef(false)");
  });

  it("checks AsyncStorage for first-launch flag", () => {
    expect(content).toContain("AsyncStorage.getItem(TRANSLATOR_SETUP_SHOWN_KEY)");
  });

  it("sets the flag after showing walkthrough", () => {
    expect(content).toContain('AsyncStorage.setItem(TRANSLATOR_SETUP_SHOWN_KEY, "true")');
  });

  it("waits for animated splash to finish before checking", () => {
    expect(content).toContain("if (showAnimatedSplash || hasCheckedAuth.current) return");
  });

  it("navigates to translator-setup on first launch", () => {
    expect(content).toContain('router.push("/translator-setup"');
  });

  it("uses a delay to let home screen render first", () => {
    expect(content).toContain("setTimeout");
    expect(content).toContain("600");
  });

  it("registers translator-setup screen in the Stack", () => {
    expect(content).toContain('name="translator-setup"');
    expect(content).toContain('presentation: "modal"');
  });

  it("imports router from expo-router", () => {
    expect(content).toContain("import { Stack, router } from \"expo-router\"");
  });
});
