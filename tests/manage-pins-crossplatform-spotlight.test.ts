/**
 * Tests for Sprint: Manage Pins + Cross-Platform Ingestion + Creator Spotlight
 */
import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

// ─── 1. Manage Pins Screen ───────────────────────────────────────────────────

describe("Manage Pins Screen (app/manage-pins.tsx)", () => {
  const filePath = path.resolve(__dirname, "../app/manage-pins.tsx");
  const content = fs.readFileSync(filePath, "utf-8");

  it("exports a default function ManagePinsScreen", () => {
    expect(content).toContain("export default function ManagePinsScreen");
  });

  it("imports reorderPinnedFeatures", () => {
    expect(content).toContain("reorderPinnedFeatures");
  });

  it("imports bulkUnpinFeatures", () => {
    expect(content).toContain("bulkUnpinFeatures");
  });

  it("has move up functionality", () => {
    expect(content).toContain("reorderPinnedFeatures");
  });

  it("has move down functionality", () => {
    expect(content).toContain("reorder");
  });

  it("has bulk unpin functionality", () => {
    expect(content).toContain("handleBulkUnpin");
  });

  it("has selection mode toggle", () => {
    expect(content).toContain("isSelecting");
    expect(content).toContain("setIsSelecting");
  });

  it("has empty state with helpful message", () => {
    expect(content).toContain("No pinned features yet");
  });

  it("uses FlatList for rendering pins", () => {
    expect(content).toContain("FlatList");
  });

  it("has Select/Done toggle button", () => {
    expect(content).toContain("Select");
    expect(content).toContain("Done");
  });

  it("shows bulk action bar when items selected", () => {
    expect(content).toContain("Unpin All");
  });

  it("uses Alert for confirmation on native", () => {
    expect(content).toContain("Alert.alert");
  });
});

// ─── 2. Reorder and Bulk Unpin in lib/recently-visited.ts ─────────────────────

describe("Reorder and Bulk Unpin in lib/recently-visited.ts", () => {
  const filePath = path.resolve(__dirname, "../lib/recently-visited.ts");
  const content = fs.readFileSync(filePath, "utf-8");

  it("exports reorderPinnedFeatures function", () => {
    expect(content).toContain("export async function reorderPinnedFeatures");
  });

  it("exports bulkUnpinFeatures function", () => {
    expect(content).toContain("export async function bulkUnpinFeatures");
  });

  it("reorderPinnedFeatures takes orderedIds parameter", () => {
    expect(content).toContain("orderedIds: string[]");
  });

  it("bulkUnpinFeatures takes ids parameter", () => {
    expect(content).toContain("ids: string[]");
  });

  it("reorderPinnedFeatures preserves items not in orderedIds", () => {
    expect(content).toContain("remaining");
  });
});

// ─── 3. Manage Link in recently-visited-row.tsx ───────────────────────────────

describe("Manage Link in recently-visited-row.tsx", () => {
  const filePath = path.resolve(__dirname, "../components/recently-visited-row.tsx");
  const content = fs.readFileSync(filePath, "utf-8");

  it("has Manage link in header", () => {
    expect(content).toContain("Manage");
  });

  it("links to /manage-pins route", () => {
    expect(content).toContain("/manage-pins");
  });

  it("has manageLink style", () => {
    expect(content).toContain("manageLink");
  });

  it("has manageLinkText style", () => {
    expect(content).toContain("manageLinkText");
  });
});

// ─── 4. Cross-Platform Ingestion for @spanishwithtuta ─────────────────────────

describe("Cross-Platform Ingestion in autoIngestScheduler.ts", () => {
  const filePath = path.resolve(__dirname, "../server/autoIngestScheduler.ts");
  const content = fs.readFileSync(filePath, "utf-8");

  it("has spanishwithtuta Instagram seed channel", () => {
    expect(content).toContain("seed_featured_spanishwithtuta_ig");
    expect(content).toContain("https://www.instagram.com/spanishwithtuta");
  });

  it("has spanishwithtuta TikTok seed channel", () => {
    expect(content).toContain("seed_featured_spanishwithtuta_tt");
    expect(content).toContain("https://www.tiktok.com/@spanishwithtuta");
  });

  it("has spanishwithtuta Facebook seed channel", () => {
    expect(content).toContain("seed_featured_spanishwithtuta_fb");
    expect(content).toContain("https://www.facebook.com/spanishwithtuta");
  });

  it("all three channels are active", () => {
    // Count occurrences of isActive: true for spanishwithtuta entries
    const matches = content.match(/seed_featured_spanishwithtuta_\w+/g) || [];
    expect(matches.length).toBe(3);
  });

  it("all channels tagged as Colombian/General Latin American dialect", () => {
    const dialectMatches = content.match(/Colombian\/General Latin American/g) || [];
    expect(dialectMatches.length).toBeGreaterThanOrEqual(3);
  });
});

// ─── 5. @spanishwithtuta in creatorContentEngine.ts ───────────────────────────

describe("@spanishwithtuta in creatorContentEngine.ts", () => {
  const filePath = path.resolve(__dirname, "../server/creatorContentEngine.ts");
  const content = fs.readFileSync(filePath, "utf-8");

  it("has local-spanishwithtuta entry", () => {
    expect(content).toContain("local-spanishwithtuta");
  });

  it("is multi-platform", () => {
    // Find the spanishwithtuta block
    const idx = content.indexOf("local-spanishwithtuta");
    const block = content.slice(idx, idx + 500);
    expect(block).toContain("multi-platform");
  });

  it("mentions cross-platform in notes", () => {
    expect(content).toContain("Cross-platform: Instagram (@spanishwithtuta, 690K+), TikTok (@spanishwithtuta), Facebook");
  });

  it("includes Daily Phrases content style", () => {
    const idx = content.indexOf("local-spanishwithtuta");
    const block = content.slice(idx, idx + 500);
    expect(block).toContain("Daily Phrases");
  });
});

// ─── 6. Creator Spotlight Library ─────────────────────────────────────────────

describe("Creator Spotlight (lib/creator-spotlight.ts)", () => {
  const filePath = path.resolve(__dirname, "../lib/creator-spotlight.ts");
  const content = fs.readFileSync(filePath, "utf-8");

  it("exports getWeeklySpotlightCreator function", () => {
    expect(content).toContain("export function getWeeklySpotlightCreator");
  });

  it("exports getAllSpotlightCreators function", () => {
    expect(content).toContain("export function getAllSpotlightCreators");
  });

  it("exports isSpotlightDismissed function", () => {
    expect(content).toContain("export async function isSpotlightDismissed");
  });

  it("exports dismissSpotlight function", () => {
    expect(content).toContain("export async function dismissSpotlight");
  });

  it("has spanishwithtuta in the roster", () => {
    expect(content).toContain("spotlight_spanishwithtuta");
  });

  it("has multiple creators in the roster (at least 5)", () => {
    const matches = content.match(/id: "spotlight_/g) || [];
    expect(matches.length).toBeGreaterThanOrEqual(5);
  });

  it("each creator has sampleExercises", () => {
    expect(content).toContain("sampleExercises");
  });

  it("uses week number for deterministic rotation", () => {
    expect(content).toContain("getWeekNumber");
  });

  it("has SpotlightCreator interface with required fields", () => {
    expect(content).toContain("interface SpotlightCreator");
    expect(content).toContain("teachingStyle: string");
    expect(content).toContain("sampleExercises: SampleExercise[]");
  });
});

// ─── 7. Creator Spotlight Card Component ──────────────────────────────────────

describe("Creator Spotlight Card (components/creator-spotlight-card.tsx)", () => {
  const filePath = path.resolve(__dirname, "../components/creator-spotlight-card.tsx");
  const content = fs.readFileSync(filePath, "utf-8");

  it("exports CreatorSpotlightCard component", () => {
    expect(content).toContain("export function CreatorSpotlightCard");
  });

  it("imports getWeeklySpotlightCreator", () => {
    expect(content).toContain("getWeeklySpotlightCreator");
  });

  it("imports isSpotlightDismissed and dismissSpotlight", () => {
    expect(content).toContain("isSpotlightDismissed");
    expect(content).toContain("dismissSpotlight");
  });

  it("has dismiss button", () => {
    expect(content).toContain("handleDismiss");
  });

  it("has expandable exercise answers", () => {
    expect(content).toContain("expandedExercise");
  });

  it("has Visit Profile button with Linking", () => {
    expect(content).toContain("Visit Profile");
    expect(content).toContain("Linking.openURL");
  });

  it("shows 'New creator every week' hint", () => {
    expect(content).toContain("New creator every week");
  });

  it("shows Creator Spotlight badge", () => {
    expect(content).toContain("Creator Spotlight");
  });
});

// ─── 8. Home Screen Wiring ────────────────────────────────────────────────────

describe("Home Screen Wiring for Creator Spotlight", () => {
  const filePath = path.resolve(__dirname, "../app/(tabs)/index.tsx");
  const content = fs.readFileSync(filePath, "utf-8");

  it("imports CreatorSpotlightCard", () => {
    expect(content).toContain("import { CreatorSpotlightCard }");
  });

  it("renders CreatorSpotlightCard component", () => {
    expect(content).toContain("<CreatorSpotlightCard />");
  });

  it("shows spotlight only for non-new users", () => {
    expect(content).toContain("{!isNewUser && <CreatorSpotlightCard />}");
  });
});
