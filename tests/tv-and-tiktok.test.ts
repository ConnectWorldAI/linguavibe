import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

const projectRoot = path.resolve(__dirname, "..");

describe("ConnectWorld AI TV Tab Screen", () => {
  const tvScreenPath = path.join(projectRoot, "app/(tabs)/tv.tsx");
  const tvContent = fs.readFileSync(tvScreenPath, "utf-8");

  it("TV screen file exists", () => {
    expect(fs.existsSync(tvScreenPath)).toBe(true);
  });

  it("exports a default component", () => {
    expect(tvContent).toContain("export default function TVScreen");
  });

  it("uses SafeAreaView for proper layout", () => {
    expect(tvContent).toContain("SafeAreaView");
  });

  it("has series catalog data", () => {
    expect(tvContent).toContain("TV_SERIES_CATALOG");
    expect(tvContent).toContain("granny-abroad");
    expect(tvContent).toContain("the-colmado");
    expect(tvContent).toContain("lost-in-translation");
    expect(tvContent).toContain("kitchen-secrets");
    expect(tvContent).toContain("night-out");
    expect(tvContent).toContain("the-interview");
  });

  it("has category filtering", () => {
    expect(tvContent).toContain("activeCategory");
    expect(tvContent).toContain("CATEGORIES");
    expect(tvContent).toContain("comedy");
    expect(tvContent).toContain("drama");
    expect(tvContent).toContain("cooking");
  });

  it("has countdown timer for next content drop", () => {
    expect(tvContent).toContain("countdownBanner");
    expect(tvContent).toContain("countdown");
    expect(tvContent).toContain("nextDrop");
    expect(tvContent).toContain("Next Drop:");
  });

  it("has series detail modal with episodes", () => {
    expect(tvContent).toContain("selectedSeries");
    expect(tvContent).toContain("SERIES_EPISODES");
    expect(tvContent).toContain("Modal");
    expect(tvContent).toContain("heroTitle");
  });

  it("has schedule modal showing daily content drops", () => {
    expect(tvContent).toContain("showSchedule");
    expect(tvContent).toContain("Today's Content Schedule");
    expect(tvContent).toContain("generateTodaySchedule");
  });

  it("integrates the share sheet", () => {
    expect(tvContent).toContain("useContentShare");
    expect(tvContent).toContain("openShareSheet");
    expect(tvContent).toContain("ShareSheet");
    expect(tvContent).toContain("handleSeriesShare");
  });

  it("navigates to tv-player for episode playback", () => {
    expect(tvContent).toContain("handleEpisodePress");
    expect(tvContent).toContain("/tv-player");
  });

  it("has episode progress tracking", () => {
    expect(tvContent).toContain("watchProgress");
    expect(tvContent).toContain("progressBar");
    expect(tvContent).toContain("progressFill");
  });
});

describe("Content Drops Scheduling System", () => {
  const dropsPath = path.join(projectRoot, "lib/content-drops.ts");
  const dropsContent = fs.readFileSync(dropsPath, "utf-8");

  it("content drops file exists", () => {
    expect(fs.existsSync(dropsPath)).toBe(true);
  });

  it("exports generateDailySchedule function", () => {
    expect(dropsContent).toContain("export function generateDailySchedule");
  });

  it("exports getCountdownState function", () => {
    expect(dropsContent).toContain("export function getCountdownState");
  });

  it("exports markDropWatched function", () => {
    expect(dropsContent).toContain("export async function markDropWatched");
  });

  it("has 10 daily content drops", () => {
    expect(dropsContent).toContain("DAILY_SCHEDULE_TEMPLATE");
    // Count the drops (each has a time field)
    const timeMatches = dropsContent.match(/time: "/g);
    expect(timeMatches?.length).toBe(10);
  });

  it("covers morning to night schedule (7am-10pm)", () => {
    expect(dropsContent).toContain('time: "7:00 AM"');
    expect(dropsContent).toContain('time: "10:00 PM"');
  });

  it("has drop type classification", () => {
    expect(dropsContent).toContain("ai_short_film");
    expect(dropsContent).toContain("slang");
    expect(dropsContent).toContain("surprise_call");
    expect(dropsContent).toContain("music");
    expect(dropsContent).toContain("cultural");
    expect(dropsContent).toContain("recap");
  });

  it("exports notification helper", () => {
    expect(dropsContent).toContain("export function getNextDropNotificationData");
  });

  it("exports drop type icon/color helpers", () => {
    expect(dropsContent).toContain("export function getDropTypeIcon");
    expect(dropsContent).toContain("export function getDropTypeColor");
  });
});

describe("TikTok Content Ingestion Service", () => {
  const tiktokPath = path.join(projectRoot, "server/tiktokIngestion.ts");
  const tiktokContent = fs.readFileSync(tiktokPath, "utf-8");

  it("TikTok ingestion file exists", () => {
    expect(fs.existsSync(tiktokPath)).toBe(true);
  });

  it("exports tiktokIngestionRouter", () => {
    expect(tiktokContent).toContain("export const tiktokIngestionRouter");
  });

  it("uses TIKTOK_API_KEY from environment", () => {
    expect(tiktokContent).toContain("process.env.TIKTOK_API_KEY");
  });

  it("has seed creators pre-configured", () => {
    expect(tiktokContent).toContain("SEED_CREATORS");
    expect(tiktokContent).toContain("randycruzc");
    expect(tiktokContent).toContain("yaismar_21");
    expect(tiktokContent).toContain("spanishwithvicente");
    expect(tiktokContent).toContain("frenchwithnelly");
    expect(tiktokContent).toContain("koreanunnie");
    expect(tiktokContent).toContain("japaneseammo");
    expect(tiktokContent).toContain("brazilianportuguese");
  });

  it("has content classification with AI", () => {
    expect(tiktokContent).toContain("classifyAndExtract");
    expect(tiktokContent).toContain("educational");
    expect(tiktokContent).toContain("viral");
    expect(tiktokContent).toContain("mixed");
  });

  it("extracts slang terms from content", () => {
    expect(tiktokContent).toContain("SlangTerm");
    expect(tiktokContent).toContain("slangDatabase");
    expect(tiktokContent).toContain("getSlangOfTheDay");
  });

  it("has CRUD operations for tracked creators", () => {
    expect(tiktokContent).toContain("listCreators");
    expect(tiktokContent).toContain("addCreator");
    expect(tiktokContent).toContain("removeCreator");
    expect(tiktokContent).toContain("toggleCreator");
  });

  it("has full ingestion pipeline", () => {
    expect(tiktokContent).toContain("ingestCreator");
    expect(tiktokContent).toContain("runFullIngestion");
    expect(tiktokContent).toContain("fetchCreatorVideos");
  });

  it("tracks trending hashtags", () => {
    expect(tiktokContent).toContain("fetchTrendingHashtags");
    expect(tiktokContent).toContain("getTrendingHashtags");
  });

  it("has stats endpoint", () => {
    expect(tiktokContent).toContain("getStats");
    expect(tiktokContent).toContain("totalCreators");
    expect(tiktokContent).toContain("totalVideosIngested");
    expect(tiktokContent).toContain("totalSlangTerms");
  });
});

describe("Tab Layout Integration", () => {
  const layoutPath = path.join(projectRoot, "app/(tabs)/_layout.tsx");
  const layoutContent = fs.readFileSync(layoutPath, "utf-8");

  it("TV tab is registered in tab layout", () => {
    // Tab layout uses dynamic rendering from tabOrder array which includes "tv"
    expect(layoutContent).toContain('"tv"');
    expect(layoutContent).toContain('TV');
  });

  it("TV tab has proper icon", () => {
    expect(layoutContent).toContain("tv-outline");
  });
});

describe("Router Integration", () => {
  const routersPath = path.join(projectRoot, "server/routers.ts");
  const routersContent = fs.readFileSync(routersPath, "utf-8");

  it("TikTok router is imported", () => {
    expect(routersContent).toContain('import { tiktokIngestionRouter } from "./tiktokIngestion"');
  });

  it("TikTok router is registered in appRouter", () => {
    expect(routersContent).toContain("tiktok: tiktokIngestionRouter");
  });
});
