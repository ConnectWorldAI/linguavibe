import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

const appDir = path.resolve(__dirname, "../app");
const tabsDir = path.resolve(appDir, "(tabs)");

describe("Sprint 33: Challenge History Screen", () => {
  const filePath = path.join(appDir, "challenge-history.tsx");

  it("challenge-history.tsx exists", () => {
    expect(fs.existsSync(filePath)).toBe(true);
  });

  it("contains FlatList for rendering history", () => {
    const content = fs.readFileSync(filePath, "utf-8");
    expect(content).toContain("FlatList");
  });

  it("renders win/loss stats section", () => {
    const content = fs.readFileSync(filePath, "utf-8");
    expect(content).toContain("wins");
    expect(content).toContain("losses");
  });

  it("renders rivalry leaderboard", () => {
    const content = fs.readFileSync(filePath, "utf-8");
    expect(content).toContain("RivalryStats");
  });

  it("loads history from AsyncStorage", () => {
    const content = fs.readFileSync(filePath, "utf-8");
    expect(content).toContain("AsyncStorage");
    expect(content).toContain("HISTORY_KEY");
  });

  it("is registered in _layout.tsx", () => {
    const layout = fs.readFileSync(path.join(appDir, "_layout.tsx"), "utf-8");
    expect(layout).toContain('name="challenge-history"');
  });
});

describe("Sprint 33: Streak Freeze Countdown Widget", () => {
  const filePath = path.join(tabsDir, "teacher.tsx");

  it("teacher.tsx contains freezeActive state", () => {
    const content = fs.readFileSync(filePath, "utf-8");
    expect(content).toContain("freezeActive");
    expect(content).toContain("setFreezeActive");
  });

  it("teacher.tsx contains freezeCountdown state", () => {
    const content = fs.readFileSync(filePath, "utf-8");
    expect(content).toContain("freezeCountdown");
    expect(content).toContain("setFreezeCountdown");
  });

  it("teacher.tsx contains freeze widget JSX", () => {
    const content = fs.readFileSync(filePath, "utf-8");
    expect(content).toContain("freezeWidget");
    expect(content).toContain("Freeze Active");
    expect(content).toContain("Streak Shield");
  });

  it("teacher.tsx has countdown timer interval", () => {
    const content = fs.readFileSync(filePath, "utf-8");
    expect(content).toContain("setInterval(updateCountdown");
    expect(content).toContain("clearInterval");
  });

  it("teacher.tsx has freeze timer progress bar", () => {
    const content = fs.readFileSync(filePath, "utf-8");
    expect(content).toContain("freezeTimerBar");
    expect(content).toContain("freezeTimerFill");
  });

  it("teacher.tsx imports streak-freeze library", () => {
    const content = fs.readFileSync(filePath, "utf-8");
    expect(content).toContain("getStreakFreezeData");
    expect(content).toContain("isFreezeActiveToday");
  });
});

describe("Sprint 33: Notification Preferences - Challenge & Weekly Report", () => {
  const filePath = path.join(appDir, "notification-preferences.tsx");

  it("notification-preferences.tsx contains Challenge Alerts section", () => {
    const content = fs.readFileSync(filePath, "utf-8");
    expect(content).toContain("Challenge Alerts");
    expect(content).toContain("Friend Challenges");
  });

  it("notification-preferences.tsx contains Weekly Report section", () => {
    const content = fs.readFileSync(filePath, "utf-8");
    expect(content).toContain("Weekly Report");
    expect(content).toContain("Progress Summary");
  });

  it("weekly report toggle uses weeklyRecap preference", () => {
    const content = fs.readFileSync(filePath, "utf-8");
    expect(content).toContain("weeklyRecap.enabled");
  });

  it("challenge toggle uses connectionRequests preference", () => {
    const content = fs.readFileSync(filePath, "utf-8");
    expect(content).toContain("connectionRequests.enabled");
  });

  it("weekly report shows delivery schedule info", () => {
    const content = fs.readFileSync(filePath, "utf-8");
    expect(content).toContain("Sunday at 10:00 AM");
  });
});
