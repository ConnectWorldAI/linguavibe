import { describe, it, expect } from "vitest";
import { existsSync } from "fs";
import { resolve } from "path";

describe("Call Translator Plugin Screen", () => {
  it("call-translator.tsx exists", () => {
    expect(existsSync(resolve(__dirname, "../app/call-translator.tsx"))).toBe(true);
  });

  it("exports a default function component (source check)", () => {
    const fs = require("fs");
    const source = fs.readFileSync(resolve(__dirname, "../app/call-translator.tsx"), "utf-8");
    expect(source).toContain("export default function CallTranslatorScreen");
  });

  it("is registered in root layout", async () => {
    const fs = await import("fs");
    const layout = fs.readFileSync(resolve(__dirname, "../app/_layout.tsx"), "utf-8");
    expect(layout).toContain("call-translator");
  });

  it("contains key UI elements in source", async () => {
    const fs = await import("fs");
    const source = fs.readFileSync(resolve(__dirname, "../app/call-translator.tsx"), "utf-8");
    // Main toggle
    expect(source).toContain("Plugin Active");
    // Language pair
    expect(source).toContain("I SPEAK");
    expect(source).toContain("THEY SPEAK");
    // Translation modes
    expect(source).toContain("Fast Mode");
    expect(source).toContain("Study Mode");
    // Audio output options
    expect(source).toContain("One Earbud");
    expect(source).toContain("Speaker");
    expect(source).toContain("Text Only");
    // Usage meter
    expect(source).toContain("Usage This Month");
    // Compatible apps
    expect(source).toContain("Works With");
    expect(source).toContain("FaceTime");
    expect(source).toContain("WhatsApp");
    expect(source).toContain("Instagram");
    // Test button
    expect(source).toContain("Test Translation");
    // How it works
    expect(source).toContain("How It Works");
    // Platform expansion
    expect(source).toContain("Desktop App");
    expect(source).toContain("Browser Extension");
    // Privacy
    expect(source).toContain("Privacy & Permissions");
  });
});
