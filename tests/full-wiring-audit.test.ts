import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

const APP_DIR = path.resolve(__dirname, "../app");

function fileExists(relativePath: string): boolean {
  return fs.existsSync(path.join(APP_DIR, relativePath));
}

function fileContains(relativePath: string, text: string): boolean {
  const filePath = path.join(APP_DIR, relativePath);
  if (!fs.existsSync(filePath)) return false;
  return fs.readFileSync(filePath, "utf-8").includes(text);
}

function readFile(relativePath: string): string {
  const filePath = path.join(APP_DIR, relativePath);
  if (!fs.existsSync(filePath)) return "";
  return fs.readFileSync(filePath, "utf-8");
}

// ═══════════════════════════════════════════════════════════════
// 1. EXPLORE-APP SCREEN EXISTS AND HAS ALL 8 OPTIONS
// ═══════════════════════════════════════════════════════════════
describe("Explore App Screen", () => {
  it("explore-app.tsx exists", () => {
    expect(fileExists("explore-app.tsx")).toBe(true);
  });

  it("has all 8 options with correct labels", () => {
    const content = readFile("explore-app.tsx");
    const labels = [
      "Explore",
      "Listen To Music",
      "Take A Course",
      "Translate",
      "Make A Call",
      "Send A Text",
      "Video Call",
      "Entertainment",
    ];
    for (const label of labels) {
      expect(content).toContain(label);
    }
  });

  it("has correct routes for each option", () => {
    const content = readFile("explore-app.tsx");
    expect(content).toContain('route: "/(tabs)"');
    expect(content).toContain('route: "/playlists"');
    expect(content).toContain('route: "/course-catalog"');
    expect(content).toContain('route: "/(tabs)/translate"');
    expect(content).toContain('route: "/(tabs)/calls"');
    expect(content).toContain('route: "/(tabs)/messages"');
    expect(content).toContain('route: "/(tabs)/tv"');
  });

  it("uses router.replace for navigation", () => {
    const content = readFile("explore-app.tsx");
    expect(content).toContain("router.replace");
  });
});

// ═══════════════════════════════════════════════════════════════
// 2. ALL ROUTE TARGET FILES EXIST
// ═══════════════════════════════════════════════════════════════
describe("Route Target Files Exist", () => {
  const targets = [
    { name: "Tabs layout", path: "(tabs)/_layout.tsx" },
    { name: "Playlists", path: "playlists.tsx" },
    { name: "Course Catalog", path: "course-catalog.tsx" },
    { name: "Translate tab", path: "(tabs)/translate.tsx" },
    { name: "Calls tab", path: "(tabs)/calls.tsx" },
    { name: "Messages tab", path: "(tabs)/messages.tsx" },
    { name: "TV tab", path: "(tabs)/tv.tsx" },
  ];

  for (const target of targets) {
    it(`${target.name} (${target.path}) exists`, () => {
      expect(fileExists(target.path)).toBe(true);
    });
  }
});

// ═══════════════════════════════════════════════════════════════
// 3. BACK NAVIGATION ON ALL SUB-SCREENS
// ═══════════════════════════════════════════════════════════════
describe("Back Navigation", () => {
  const screensWithBack = [
    "playlists.tsx",
    "course-catalog.tsx",
    "playlist-detail.tsx",
    "downloaded-songs.tsx",
    "liked-songs.tsx",
    "recently-played.tsx",
    "saved-collections.tsx",
    "course-detail.tsx",
  ];

  for (const screen of screensWithBack) {
    it(`${screen} has back button (router.back)`, () => {
      expect(fileContains(screen, "router.back()")).toBe(true);
    });
  }
});

// ═══════════════════════════════════════════════════════════════
// 4. COURSE FLOW (Take A Course)
// ═══════════════════════════════════════════════════════════════
describe("Course Flow", () => {
  it("course-catalog.tsx exists and routes to course-detail", () => {
    expect(fileExists("course-catalog.tsx")).toBe(true);
    expect(fileContains("course-catalog.tsx", "course-detail")).toBe(true);
  });

  it("course-detail.tsx exists and routes to lesson-player", () => {
    expect(fileExists("course-detail.tsx")).toBe(true);
    expect(fileContains("course-detail.tsx", "lesson-player")).toBe(true);
  });

  it("lesson-player.tsx exists", () => {
    expect(fileExists("lesson-player.tsx")).toBe(true);
  });

  it("choose-teacher.tsx exists and routes to permissions-setup", () => {
    expect(fileExists("choose-teacher.tsx")).toBe(true);
    expect(fileContains("choose-teacher.tsx", "permissions-setup")).toBe(true);
  });

  it("permissions-setup.tsx exists and routes to placement-test or cloudwave-guide", () => {
    expect(fileExists("permissions-setup.tsx")).toBe(true);
    const content = readFile("permissions-setup.tsx");
    expect(content.includes("placement-test") || content.includes("cloudwave-guide")).toBe(true);
  });

  it("placement-test.tsx exists", () => {
    expect(fileExists("placement-test.tsx")).toBe(true);
  });

  it("level-assessment.tsx exists", () => {
    expect(fileExists("level-assessment.tsx")).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════
// 5. MUSIC / PLAYLISTS SYSTEM
// ═══════════════════════════════════════════════════════════════
describe("Music/Playlists System", () => {
  it("playlists.tsx exists with library grid (Downloaded, Liked, Recently Played)", () => {
    expect(fileExists("playlists.tsx")).toBe(true);
    const content = readFile("playlists.tsx");
    expect(content).toContain("downloaded-songs");
    expect(content).toContain("liked-songs");
    expect(content).toContain("recently-played");
  });

  it("downloaded-songs.tsx exists", () => {
    expect(fileExists("downloaded-songs.tsx")).toBe(true);
  });

  it("liked-songs.tsx exists", () => {
    expect(fileExists("liked-songs.tsx")).toBe(true);
  });

  it("recently-played.tsx exists", () => {
    expect(fileExists("recently-played.tsx")).toBe(true);
  });

  it("playlist-detail.tsx exists", () => {
    expect(fileExists("playlist-detail.tsx")).toBe(true);
  });

  it("PlaylistProvider is wired in _layout.tsx", () => {
    const content = readFile("_layout.tsx");
    expect(content).toContain("PlaylistProvider");
  });

  it("all music screens registered in Stack", () => {
    const content = readFile("_layout.tsx");
    expect(content).toContain('"playlists"');
    expect(content).toContain('"playlist-detail"');
    expect(content).toContain('"downloaded-songs"');
    expect(content).toContain('"liked-songs"');
    expect(content).toContain('"recently-played"');
  });
});

// ═══════════════════════════════════════════════════════════════
// 6. TRANSLATE BOOKMARK/SAVE FEATURE
// ═══════════════════════════════════════════════════════════════
describe("Translate Save/Bookmark Feature", () => {
  it("translate.tsx imports useSavedCollections", () => {
    expect(fileContains("(tabs)/translate.tsx", "useSavedCollections")).toBe(true);
  });

  it("translate.tsx has bookmark button in result area", () => {
    const content = readFile("(tabs)/translate.tsx");
    expect(content).toContain("bookmark-outline");
    expect(content).toContain("bookmark");
  });

  it("translate.tsx has saved-collections link in header", () => {
    expect(fileContains("(tabs)/translate.tsx", "saved-collections")).toBe(true);
  });

  it("saved-collections.tsx exists and is registered in Stack", () => {
    expect(fileExists("saved-collections.tsx")).toBe(true);
    expect(fileContains("_layout.tsx", '"saved-collections"')).toBe(true);
  });

  it("saved-collections store supports 'translation' type", () => {
    const storePath = path.resolve(__dirname, "../lib/saved-collections.tsx");
    const content = fs.readFileSync(storePath, "utf-8");
    expect(content).toContain('"translation"');
  });
});

// ═══════════════════════════════════════════════════════════════
// 7. SONGS TAB LIBRARY BUTTON
// ═══════════════════════════════════════════════════════════════
describe("Songs Tab Library Button", () => {
  it("songs tab has library/playlist button routing to /playlists", () => {
    const content = readFile("(tabs)/songs.tsx");
    expect(content).toContain("playlists");
  });
});

// ═══════════════════════════════════════════════════════════════
// 8. EXPLORE-APP IS REGISTERED IN STACK
// ═══════════════════════════════════════════════════════════════
describe("Explore App Registration", () => {
  it("explore-app is registered in Stack", () => {
    expect(fileContains("_layout.tsx", '"explore-app"')).toBe(true);
  });

  it("onboarding routes to main app", () => {
    expect(fileContains("onboarding.tsx", "/(tabs)")).toBe(true);
  });
});
