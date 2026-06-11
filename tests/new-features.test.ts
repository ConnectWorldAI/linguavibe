import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

describe("New Features - Notification Bell, Calls Tab, Messages Icon, Profile Photo, All Languages", () => {
  const tabsDir = path.join(__dirname, "..", "app", "(tabs)");

  it("calls.tsx tab exists", () => {
    expect(fs.existsSync(path.join(tabsDir, "calls.tsx"))).toBe(true);
  });

  it("calls tab has missed call detection and call history", () => {
    const content = fs.readFileSync(path.join(tabsDir, "calls.tsx"), "utf-8");
    expect(content).toContain("missedCount");
    expect(content).toContain("CALL_HISTORY");
    expect(content).toContain("type: \"missed\"");
  });

  it("tab layout registers calls tab (hidden, accessible via floating button)", () => {
    const content = fs.readFileSync(path.join(tabsDir, "_layout.tsx"), "utf-8");
    expect(content).toContain("name=\"calls\"");
    expect(content).toContain("href: null"); // Hidden from tab bar
  });

  it("tab layout registers messages tab (hidden, accessible via floating button)", () => {
    const content = fs.readFileSync(path.join(tabsDir, "_layout.tsx"), "utf-8");
    expect(content).toContain("name=\"messages\"");
    expect(content).toContain("href: null"); // Hidden from tab bar
  });

  it("messages accessible via floating button with chatbubbles icon", () => {
    const homeContent = fs.readFileSync(path.join(tabsDir, "index.tsx"), "utf-8");
    expect(homeContent).toContain("chatbubbles");
    expect(homeContent).toContain("Messages");
  });

  it("profile tab icon shows circular avatar placeholder (like WhatsApp)", () => {
    const content = fs.readFileSync(path.join(tabsDir, "_layout.tsx"), "utf-8");
    expect(content).toContain("borderRadius: 13");
    expect(content).toContain("overflow: \"hidden\"");
  });

  it("notification bell on home screen has green default / red with count logic", () => {
    const content = fs.readFileSync(path.join(tabsDir, "index.tsx"), "utf-8");
    expect(content).toContain("notifCount");
    expect(content).toContain("Colors.accent"); // Red when notifications exist
    expect(content).toContain("Colors.success"); // Green by default
    expect(content).toContain("notifBadge");
    expect(content).toContain("getNotifColor");
  });

  it("translate screen has all 33 languages from the master plan", () => {
    const content = fs.readFileSync(path.join(tabsDir, "translate.tsx"), "utf-8");
    const languages = [
      "English", "Spanish", "French", "Portuguese", "Arabic", "Chinese",
      "Hindi", "Japanese", "Korean", "German", "Italian", "Russian",
      "Turkish", "Swahili", "Yoruba", "Igbo", "Hausa", "Amharic",
      "Zulu", "Thai", "Vietnamese", "Tagalog", "Indonesian", "Polish",
      "Dutch", "Greek", "Hebrew", "Persian", "Urdu", "Bengali",
      "Punjabi", "Haitian Creole", "Papiamento",
    ];
    for (const lang of languages) {
      expect(content).toContain(lang);
    }
  });

  it("translate screen has all language flags", () => {
    const content = fs.readFileSync(path.join(tabsDir, "translate.tsx"), "utf-8");
    const flags = [
      "🇺🇸", "🇪🇸", "🇫🇷", "🇧🇷", "🇸🇦", "🇨🇳", "🇮🇳", "🇯🇵", "🇰🇷",
      "🇩🇪", "🇮🇹", "🇷🇺", "🇹🇷", "🇹🇿", "🇳🇬", "🇪🇹", "🇿🇦", "🇹🇭",
      "🇻🇳", "🇵🇭", "🇮🇩", "🇵🇱", "🇳🇱", "🇬🇷", "🇮🇱", "🇮🇷", "🇵🇰",
      "🇧🇩", "🇭🇹", "🇨🇼",
    ];
    for (const flag of flags) {
      expect(content).toContain(flag);
    }
  });

  it("icon-symbol.tsx has phone.fill mapping", () => {
    const content = fs.readFileSync(
      path.join(__dirname, "..", "components", "ui", "icon-symbol.tsx"),
      "utf-8"
    );
    expect(content).toContain("\"phone.fill\": \"phone\"");
  });
});
