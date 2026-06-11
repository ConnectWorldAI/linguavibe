import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

/**
 * Routing & Wiring Audit Test
 * Validates that all screens are reachable and no dead ends exist.
 */

const APP_DIR = path.join(__dirname, "../app");

function getAllScreenFiles(dir: string): string[] {
  const results: string[] = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...getAllScreenFiles(fullPath));
    } else if (entry.name.endsWith(".tsx") && !entry.name.startsWith("_")) {
      results.push(fullPath);
    }
  }
  return results;
}

function getScreenName(filePath: string): string {
  return path.basename(filePath, ".tsx");
}

describe("Routing & Wiring Audit", () => {
  const allScreenFiles = getAllScreenFiles(APP_DIR);
  const allScreenNames = allScreenFiles.map(getScreenName);

  it("should have no empty onPress handlers in any screen", () => {
    const emptyHandlers: string[] = [];
    for (const file of allScreenFiles) {
      const content = fs.readFileSync(file, "utf-8");
      if (content.includes("onPress={() => {}}") || content.includes("onPress={()=>{}}")) {
        emptyHandlers.push(getScreenName(file));
      }
    }
    expect(emptyHandlers).toEqual([]);
  });

  it("should have no null routes in navigation arrays", () => {
    const nullRoutes: string[] = [];
    for (const file of allScreenFiles) {
      const content = fs.readFileSync(file, "utf-8");
      if (content.includes("route: null")) {
        nullRoutes.push(getScreenName(file));
      }
    }
    expect(nullRoutes).toEqual([]);
  });

  it("should have conversation-sim screen file", () => {
    const exists = fs.existsSync(path.join(APP_DIR, "conversation-sim.tsx"));
    expect(exists).toBe(true);
  });

  it("all previously orphan screens should now be referenced from other screens", () => {
    const previousOrphans = [
      "admin-knowledge-base", "artist-portal", "candidate-search",
      "class-chat", "community-validator", "contact-sharing",
      "conversation-summary", "curriculum-drills", "duet-mode",
      "employer-job-post", "enterprise-portal", "goal-adjustment",
      "group-class", "homework", "lesson-path", "marketing-studio",
      "mouth-placement", "notifications", "offline-content",
      "passport-stamps", "payment-flow", "progress-feed",
      "quiz-center", "scorecard-compare", "sing-along", "social-hub",
      "song-lesson-breakdown", "streak-protection", "street-cred",
      "surprise-call", "upload-song", "vocabulary-battle",
    ];

    // Read all screen content
    const allContent = allScreenFiles.map((f) => fs.readFileSync(f, "utf-8")).join("\n");

    const stillOrphan: string[] = [];
    for (const screen of previousOrphans) {
      // Check if the route is referenced from another file
      const routePattern = `"/${screen}"`;
      const references = allScreenFiles.filter((f) => {
        if (getScreenName(f) === screen) return false;
        const content = fs.readFileSync(f, "utf-8");
        return content.includes(routePattern);
      });
      if (references.length === 0) {
        stillOrphan.push(screen);
      }
    }
    expect(stillOrphan).toEqual([]);
  });

  it("should have more than 170 screen files", () => {
    expect(allScreenFiles.length).toBeGreaterThan(170);
  });
});
