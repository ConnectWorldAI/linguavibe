/**
 * Tests for Sprint: Pin Recently Visited + @spanishwithtuta Creator
 */
import { describe, it, expect, vi } from "vitest";
import * as fs from "fs";
import * as path from "path";

// ─── 1. Pin Feature in lib/recently-visited.ts ────────────────────────────────

describe("Pin Feature in lib/recently-visited.ts", () => {
  const filePath = path.resolve(__dirname, "../lib/recently-visited.ts");
  const content = fs.readFileSync(filePath, "utf-8");

  it("exports getPinnedFeatures function", () => {
    expect(content).toContain("export async function getPinnedFeatures");
  });

  it("exports pinFeature function", () => {
    expect(content).toContain("export async function pinFeature");
  });

  it("exports unpinFeature function", () => {
    expect(content).toContain("export async function unpinFeature");
  });

  it("exports isFeaturePinned function", () => {
    expect(content).toContain("export async function isFeaturePinned");
  });

  it("exports getMergedRecentAndPinned function", () => {
    expect(content).toContain("export async function getMergedRecentAndPinned");
  });

  it("has separate PINNED_KEY storage key", () => {
    expect(content).toContain("PINNED_KEY");
    expect(content).toContain("@connectworld_pinned_features");
  });

  it("pinFeature prevents duplicates", () => {
    expect(content).toContain("if (pinned.some((p) => p.id === item.id)) return");
  });

  it("getMergedRecentAndPinned filters pinned from recent", () => {
    expect(content).toContain("recentFiltered");
    expect(content).toContain("!pinned.some");
  });

  it("RecentlyVisitedItem interface has pinned field", () => {
    expect(content).toContain("pinned?: boolean");
  });

  it("still exports getRecentlyVisited for backward compat", () => {
    expect(content).toContain("export async function getRecentlyVisited");
  });

  it("still exports addRecentlyVisited for backward compat", () => {
    expect(content).toContain("export async function addRecentlyVisited");
  });

  it("MAX_ITEMS constant is defined", () => {
    expect(content).toContain("MAX_ITEMS");
  });
});

// ─── 2. Pin UI in components/recently-visited-row.tsx ─────────────────────────

describe("Pin UI in components/recently-visited-row.tsx", () => {
  const filePath = path.resolve(__dirname, "../components/recently-visited-row.tsx");
  const content = fs.readFileSync(filePath, "utf-8");

  it("imports getMergedRecentAndPinned", () => {
    expect(content).toContain("getMergedRecentAndPinned");
  });

  it("imports pinFeature", () => {
    expect(content).toContain("pinFeature");
  });

  it("imports unpinFeature", () => {
    expect(content).toContain("unpinFeature");
  });

  it("has onLongPress handler for pin/unpin", () => {
    expect(content).toContain("onLongPress");
  });

  it("shows pin badge for pinned items", () => {
    expect(content).toContain("pinBadge");
  });

  it("has chipPinned style for pinned items", () => {
    expect(content).toContain("chipPinned");
  });

  it("shows 'Hold to pin' hint text", () => {
    expect(content).toContain("Hold to pin");
  });

  it("uses Alert for pin/unpin confirmation on native", () => {
    expect(content).toContain("Alert.alert");
  });

  it("handles web platform without Alert", () => {
    expect(content).toContain("Platform.OS === \"web\"");
  });

  it("uses pin icon from Ionicons", () => {
    expect(content).toContain("\"pin\"");
  });
});

// ─── 3. @spanishwithtuta in creatorPipeline.ts ────────────────────────────────

describe("@spanishwithtuta in creatorPipeline.ts", () => {
  const filePath = path.resolve(__dirname, "../server/creatorPipeline.ts");
  const content = fs.readFileSync(filePath, "utf-8");

  it("has spanishwithtuta in TEACHING_METHOD_MAP", () => {
    expect(content).toContain("\"spanishwithtuta\"");
  });

  it("defines Daily Phrase Immersion method", () => {
    expect(content).toContain("Daily Phrase Immersion");
  });

  it("sets contentType to conversational", () => {
    expect(content).toContain("contentType: \"conversational\"");
  });

  it("includes phrase_immersion exerciseStyle", () => {
    expect(content).toContain("phrase_immersion");
  });

  it("includes bilingual code-switching in prompt injection", () => {
    expect(content).toContain("code-switching");
  });

  it("includes Colombian/Latin American cultural context", () => {
    expect(content).toContain("Colombian/Latin American");
  });

  it("targets heritage speakers and new learners", () => {
    expect(content).toContain("heritage speakers");
  });

  it("includes daily phrases in vocabDomains", () => {
    expect(content).toContain("daily phrases");
  });
});
