import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

const APP_DIR = path.resolve(__dirname, "../app");
const TABS_DIR = path.join(APP_DIR, "(tabs)");

describe("Explore App Screen - Routing Verification", () => {
  // All routes referenced in explore-app.tsx (updated 8-icon grid)
  const EXPLORE_ROUTES = [
    { id: "explore", route: "/(tabs)", file: "_layout.tsx", dir: TABS_DIR },
    { id: "music", route: "/playlists", file: "playlists.tsx", dir: APP_DIR },
    { id: "course", route: "/course-catalog", file: "course-catalog.tsx", dir: APP_DIR },
    { id: "translate", route: "/(tabs)/translate", file: "translate.tsx", dir: TABS_DIR },
    { id: "call", route: "/(tabs)/calls", file: "calls.tsx", dir: TABS_DIR },
    { id: "message", route: "/(tabs)/messages", file: "messages.tsx", dir: TABS_DIR },
    { id: "video-call", route: "/(tabs)/calls", file: "calls.tsx", dir: TABS_DIR },
    { id: "entertainment", route: "/(tabs)/tv", file: "tv.tsx", dir: TABS_DIR },
  ];

  it("explore-app.tsx exists", () => {
    expect(fs.existsSync(path.join(APP_DIR, "explore-app.tsx"))).toBe(true);
  });

  it("explore-app is registered in _layout.tsx Stack", () => {
    const layout = fs.readFileSync(path.join(APP_DIR, "_layout.tsx"), "utf-8");
    expect(layout).toContain('name="explore-app"');
  });

  it("has exactly 8 options", () => {
    const content = fs.readFileSync(path.join(APP_DIR, "explore-app.tsx"), "utf-8");
    const matches = content.match(/id: "/g);
    expect(matches?.length).toBe(8);
  });

  it("has correct labels", () => {
    const content = fs.readFileSync(path.join(APP_DIR, "explore-app.tsx"), "utf-8");
    expect(content).toContain('"Explore"');
    expect(content).toContain('"Listen To Music"');
    expect(content).toContain('"Take A Course"');
    expect(content).toContain('"Translate"');
    expect(content).toContain('"Make A Call"');
    expect(content).toContain('"Send A Text"');
    expect(content).toContain('"Video Call"');
    expect(content).toContain('"Entertainment"');
  });

  for (const route of EXPLORE_ROUTES) {
    it(`Route "${route.id}" -> ${route.file} exists`, () => {
      const filePath = path.join(route.dir, route.file);
      expect(fs.existsSync(filePath)).toBe(true);
    });
  }

  it("explore-app saves choice to AsyncStorage", () => {
    const content = fs.readFileSync(path.join(APP_DIR, "explore-app.tsx"), "utf-8");
    expect(content).toContain("@explore_choice_made");
  });

  it("uses icon grid layout", () => {
    const content = fs.readFileSync(path.join(APP_DIR, "explore-app.tsx"), "utf-8");
    expect(content).toContain("grid");
    expect(content).toContain("iconWrap");
  });
});
