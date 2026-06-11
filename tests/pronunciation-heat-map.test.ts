import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

const APP_DIR = path.resolve(__dirname, "../app");

describe("Pronunciation Heat Map", () => {
  const heatMapPath = path.join(APP_DIR, "pronunciation-heat-map.tsx");
  const heatMapContent = fs.readFileSync(heatMapPath, "utf-8");

  it("screen file exists and has default export", () => {
    expect(fs.existsSync(heatMapPath)).toBe(true);
    expect(heatMapContent).toContain("export default function PronunciationHeatMapScreen");
  });

  it("has heat color coding system (green/blue/amber/orange/red)", () => {
    expect(heatMapContent).toContain("getHeatColor");
    expect(heatMapContent).toContain("#10B981"); // green - mastered
    expect(heatMapContent).toContain("#3B82F6"); // blue - good
    expect(heatMapContent).toContain("#F59E0B"); // amber - developing
    expect(heatMapContent).toContain("#F97316"); // orange - needs work
    expect(heatMapContent).toContain("#EF4444"); // red - struggling
  });

  it("has Spanish phoneme data with vowels and consonants", () => {
    expect(heatMapContent).toContain("SPANISH_PHONEMES");
    expect(heatMapContent).toContain("Rolled RR");
    expect(heatMapContent).toContain("Single R (tap)");
    expect(heatMapContent).toContain("Eñe (palatal nasal)");
    expect(heatMapContent).toContain("Open A");
  });

  it("has French phoneme data with nasal vowels and uvular R", () => {
    expect(heatMapContent).toContain("FRENCH_PHONEMES");
    expect(heatMapContent).toContain("Uvular R");
    expect(heatMapContent).toContain("Nasal ON");
    expect(heatMapContent).toContain("Front U");
  });

  it("supports grid and list view modes", () => {
    expect(heatMapContent).toContain("viewMode");
    expect(heatMapContent).toContain("grid");
    expect(heatMapContent).toContain("list");
    expect(heatMapContent).toContain("gridContainer");
    expect(heatMapContent).toContain("listContainer");
  });

  it("has category filters (all, vowel, consonant, special)", () => {
    expect(heatMapContent).toContain("selectedCategory");
    expect(heatMapContent).toContain("\"all\"");
    expect(heatMapContent).toContain("\"vowel\"");
    expect(heatMapContent).toContain("\"consonant\"");
    expect(heatMapContent).toContain("\"special\"");
  });

  it("has sort options (score, attempts, trend)", () => {
    expect(heatMapContent).toContain("sortBy");
    expect(heatMapContent).toContain("\"score\"");
    expect(heatMapContent).toContain("\"attempts\"");
    expect(heatMapContent).toContain("\"trend\"");
  });

  it("shows trend indicators (improving, stable, declining, new)", () => {
    expect(heatMapContent).toContain("getTrendIcon");
    expect(heatMapContent).toContain("trending-up");
    expect(heatMapContent).toContain("trending-down");
    expect(heatMapContent).toContain("improving");
    expect(heatMapContent).toContain("declining");
  });

  it("has expanded phoneme detail with tip and examples", () => {
    expect(heatMapContent).toContain("expandedPhoneme");
    expect(heatMapContent).toContain("detailCard");
    expect(heatMapContent).toContain("tipBox");
    expect(heatMapContent).toContain("examplesRow");
  });

  it("has Focus Areas section for struggling sounds", () => {
    expect(heatMapContent).toContain("Focus Areas");
    expect(heatMapContent).toContain("weakSummary");
    expect(heatMapContent).toContain("These sounds need the most attention");
  });

  it("has Recommended Drills section", () => {
    expect(heatMapContent).toContain("Recommended Drills");
    expect(heatMapContent).toContain("drillsSection");
    expect(heatMapContent).toContain("Practice This Sound");
  });

  it("has drill navigation to pronunciation-drill screen", () => {
    expect(heatMapContent).toContain("handleDrillPress");
    expect(heatMapContent).toContain("pronunciation-drill");
  });

  it("is registered in _layout.tsx", () => {
    const layoutPath = path.join(APP_DIR, "_layout.tsx");
    const layoutContent = fs.readFileSync(layoutPath, "utf-8");
    expect(layoutContent).toContain("pronunciation-heat-map");
  });

  it("is linked from call-scorecard screen", () => {
    const scorecardPath = path.join(APP_DIR, "call-scorecard.tsx");
    const scorecardContent = fs.readFileSync(scorecardPath, "utf-8");
    expect(scorecardContent).toContain("pronunciation-heat-map");
    expect(scorecardContent).toContain("View Pronunciation Heat Map");
  });

  it("hume-call navigates to scorecard on end (which links to heat map)", () => {
    const humePath = path.join(APP_DIR, "hume-call.tsx");
    const humeContent = fs.readFileSync(humePath, "utf-8");
    expect(humeContent).toContain("call-scorecard");
    expect(humeContent).toContain("handleEndCall");
  });

  it("has overview stats (avg score, struggling count, mastered count, total attempts)", () => {
    expect(heatMapContent).toContain("avgScore");
    expect(heatMapContent).toContain("struggling");
    expect(heatMapContent).toContain("mastered");
    expect(heatMapContent).toContain("totalAttempts");
  });

  it("has language selector with flags", () => {
    expect(heatMapContent).toContain("LANGUAGE_SETS");
    expect(heatMapContent).toContain("🇪🇸");
    expect(heatMapContent).toContain("🇫🇷");
    expect(heatMapContent).toContain("selectedLanguage");
  });

  it("has color legend for heat map interpretation", () => {
    expect(heatMapContent).toContain("legendRow");
    expect(heatMapContent).toContain("Struggling");
    expect(heatMapContent).toContain("Needs Work");
    expect(heatMapContent).toContain("Developing");
    expect(heatMapContent).toContain("Good");
    expect(heatMapContent).toContain("Mastered");
  });
});
