import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

describe("Dream Vacation Expansion", () => {
  const appDir = path.join(__dirname, "..", "app");

  it("city-explore.tsx exists and has neighborhoods", () => {
    const content = fs.readFileSync(path.join(appDir, "city-explore.tsx"), "utf-8");
    expect(content).toContain("CityExploreScreen");
    expect(content).toContain("Neighborhood");
    expect(content).toContain("barcelona");
    expect(content).toContain("tokyo");
    expect(content).toContain("paris");
    expect(content).toContain("seoul");
    expect(content).toContain("rio");
    expect(content).toContain("scenario-chat");
  });

  it("scenario-chat.tsx exists and has branching dialogue", () => {
    const content = fs.readFileSync(path.join(appDir, "scenario-chat.tsx"), "utf-8");
    expect(content).toContain("ScenarioChatScreen");
    expect(content).toContain("DialogueOption");
    expect(content).toContain("quality");
    expect(content).toContain("perfect");
    expect(content).toContain("tapas-bar");
    expect(content).toContain("ramen-shop");
    expect(content).toContain("wine-bar");
    expect(content).toContain("culturalNote");
    expect(content).toContain("slangNote");
  });

  it("dream-vacation.tsx navigates to city-explore", () => {
    const content = fs.readFileSync(path.join(appDir, "dream-vacation.tsx"), "utf-8");
    expect(content).toContain("city-explore");
    expect(content).toContain("Explore");
  });

  it("screens are registered in _layout.tsx", () => {
    const layout = fs.readFileSync(path.join(appDir, "_layout.tsx"), "utf-8");
    expect(layout).toContain("city-explore");
    expect(layout).toContain("scenario-chat");
  });

  it("scenario-chat has scoring system", () => {
    const content = fs.readFileSync(path.join(appDir, "scenario-chat.tsx"), "utf-8");
    expect(content).toContain("totalScore");
    expect(content).toContain("maxScore");
    expect(content).toContain("getScoreGrade");
    expect(content).toContain("points");
  });

  it("city-explore has 5 cities with neighborhoods", () => {
    const content = fs.readFileSync(path.join(appDir, "city-explore.tsx"), "utf-8");
    // Check each city has neighborhoods
    expect(content).toContain("Gothic Quarter");
    expect(content).toContain("Shibuya");
    expect(content).toContain("Montmartre");
    expect(content).toContain("Hongdae");
    expect(content).toContain("Copacabana");
  });
});
