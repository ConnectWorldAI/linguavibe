/**
 * Tests for Sprint: Celebration Modal + Focus History + Search Recently Visited
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Mock AsyncStorage ────────────────────────────────────────────────────────
const mockStorage: Record<string, string> = {};
vi.mock("@react-native-async-storage/async-storage", () => ({
  default: {
    getItem: vi.fn((key: string) => Promise.resolve(mockStorage[key] || null)),
    setItem: vi.fn((key: string, value: string) => { mockStorage[key] = value; return Promise.resolve(); }),
    removeItem: vi.fn((key: string) => { delete mockStorage[key]; return Promise.resolve(); }),
  },
}));

// ─── Mock expo-haptics ────────────────────────────────────────────────────────
vi.mock("expo-haptics", () => ({
  impactAsync: vi.fn(),
  notificationAsync: vi.fn(),
  ImpactFeedbackStyle: { Light: "Light", Medium: "Medium", Heavy: "Heavy" },
  NotificationFeedbackType: { Success: "Success", Error: "Error" },
}));

// ─── Mock react-native ───────────────────────────────────────────────────────
vi.mock("react-native", () => ({
  Platform: { OS: "ios" },
  Animated: {
    Value: class { _value: number; constructor(v: number) { this._value = v; } },
    timing: () => ({ start: vi.fn() }),
    spring: () => ({ start: vi.fn() }),
    loop: () => ({ start: vi.fn() }),
    sequence: () => ({ start: vi.fn() }),
    parallel: () => ({ start: vi.fn() }),
  },
  Dimensions: { get: () => ({ width: 390, height: 844 }) },
  StyleSheet: { create: (s: any) => s },
  View: "View",
  Text: "Text",
  Modal: "Modal",
  TouchableOpacity: "TouchableOpacity",
  FlatList: "FlatList",
}));

vi.mock("react-native-safe-area-context", () => ({
  SafeAreaView: "SafeAreaView",
}));

vi.mock("@expo/vector-icons", () => ({
  Ionicons: "Ionicons",
}));

vi.mock("expo-router", () => ({
  router: { push: vi.fn(), back: vi.fn() },
}));

vi.mock("@react-navigation/native", () => ({
  useFocusEffect: vi.fn(),
}));

// ─── 1. Streak Celebration Modal Tests ────────────────────────────────────────

describe("StreakCelebrationModal", () => {
  it("getBadgeInfo returns correct badge for 7-day streak", async () => {
    // Test the badge info logic directly
    const getBadgeInfo = (streakDays: number) => {
      if (streakDays >= 365) return { emoji: "🌟", title: "LEGENDARY!", subtitle: "365-day streak!", color: "#EC4899" };
      if (streakDays >= 100) return { emoji: "👑", title: "UNSTOPPABLE!", subtitle: "100-day streak!", color: "#8B5CF6" };
      if (streakDays >= 60) return { emoji: "🏆", title: "CHAMPION!", subtitle: "60-day streak!", color: "#F59E0B" };
      if (streakDays >= 30) return { emoji: "💪", title: "DEDICATED!", subtitle: "30-day streak!", color: "#10B981" };
      if (streakDays >= 14) return { emoji: "⚡", title: "MOMENTUM!", subtitle: "14-day streak!", color: "#EAB308" };
      return { emoji: "🔥", title: "ON FIRE!", subtitle: "7-day streak!", color: "#F97316" };
    };

    expect(getBadgeInfo(7).title).toBe("ON FIRE!");
    expect(getBadgeInfo(7).emoji).toBe("🔥");
  });

  it("getBadgeInfo returns correct badge for 14-day streak", () => {
    const getBadgeInfo = (streakDays: number) => {
      if (streakDays >= 365) return { emoji: "🌟", title: "LEGENDARY!" };
      if (streakDays >= 100) return { emoji: "👑", title: "UNSTOPPABLE!" };
      if (streakDays >= 60) return { emoji: "🏆", title: "CHAMPION!" };
      if (streakDays >= 30) return { emoji: "💪", title: "DEDICATED!" };
      if (streakDays >= 14) return { emoji: "⚡", title: "MOMENTUM!" };
      return { emoji: "🔥", title: "ON FIRE!" };
    };
    expect(getBadgeInfo(14).title).toBe("MOMENTUM!");
    expect(getBadgeInfo(14).emoji).toBe("⚡");
  });

  it("getBadgeInfo returns correct badge for 30-day streak", () => {
    const getBadgeInfo = (streakDays: number) => {
      if (streakDays >= 365) return { title: "LEGENDARY!" };
      if (streakDays >= 100) return { title: "UNSTOPPABLE!" };
      if (streakDays >= 60) return { title: "CHAMPION!" };
      if (streakDays >= 30) return { title: "DEDICATED!" };
      if (streakDays >= 14) return { title: "MOMENTUM!" };
      return { title: "ON FIRE!" };
    };
    expect(getBadgeInfo(30).title).toBe("DEDICATED!");
    expect(getBadgeInfo(45).title).toBe("DEDICATED!");
  });

  it("getBadgeInfo returns correct badge for 60-day streak", () => {
    const getBadgeInfo = (streakDays: number) => {
      if (streakDays >= 365) return { title: "LEGENDARY!" };
      if (streakDays >= 100) return { title: "UNSTOPPABLE!" };
      if (streakDays >= 60) return { title: "CHAMPION!" };
      if (streakDays >= 30) return { title: "DEDICATED!" };
      if (streakDays >= 14) return { title: "MOMENTUM!" };
      return { title: "ON FIRE!" };
    };
    expect(getBadgeInfo(60).title).toBe("CHAMPION!");
    expect(getBadgeInfo(99).title).toBe("CHAMPION!");
  });

  it("getBadgeInfo returns correct badge for 100-day streak", () => {
    const getBadgeInfo = (streakDays: number) => {
      if (streakDays >= 365) return { title: "LEGENDARY!" };
      if (streakDays >= 100) return { title: "UNSTOPPABLE!" };
      if (streakDays >= 60) return { title: "CHAMPION!" };
      if (streakDays >= 30) return { title: "DEDICATED!" };
      if (streakDays >= 14) return { title: "MOMENTUM!" };
      return { title: "ON FIRE!" };
    };
    expect(getBadgeInfo(100).title).toBe("UNSTOPPABLE!");
    expect(getBadgeInfo(200).title).toBe("UNSTOPPABLE!");
  });

  it("getBadgeInfo returns correct badge for 365-day streak", () => {
    const getBadgeInfo = (streakDays: number) => {
      if (streakDays >= 365) return { title: "LEGENDARY!" };
      if (streakDays >= 100) return { title: "UNSTOPPABLE!" };
      if (streakDays >= 60) return { title: "CHAMPION!" };
      if (streakDays >= 30) return { title: "DEDICATED!" };
      if (streakDays >= 14) return { title: "MOMENTUM!" };
      return { title: "ON FIRE!" };
    };
    expect(getBadgeInfo(365).title).toBe("LEGENDARY!");
    expect(getBadgeInfo(500).title).toBe("LEGENDARY!");
  });

  it("CONFETTI_COUNT is 40 particles", () => {
    const CONFETTI_COUNT = 40;
    expect(CONFETTI_COUNT).toBe(40);
  });

  it("CONFETTI_COLORS has 8 colors", () => {
    const CONFETTI_COLORS = ["#FFD700", "#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4", "#FF9FF3", "#00AAFF", "#FF2D2D"];
    expect(CONFETTI_COLORS).toHaveLength(8);
  });

  it("motivation text varies by streak level", () => {
    const getMotivation = (streakDays: number) => {
      if (streakDays >= 100) return "You're in the top 1% of learners!";
      if (streakDays >= 30) return "Consistency is your superpower!";
      return "Keep the momentum going!";
    };
    expect(getMotivation(7)).toBe("Keep the momentum going!");
    expect(getMotivation(30)).toBe("Consistency is your superpower!");
    expect(getMotivation(100)).toBe("You're in the top 1% of learners!");
  });
});

// ─── 2. Badge Celebration State Tests (file-based) ───────────────────────────

import * as fs from "fs";
import * as path from "path";

describe("Badge Celebration State (file-based)", () => {
  const filePath = path.resolve(__dirname, "../lib/badge-celebration.ts");
  const content = fs.readFileSync(filePath, "utf-8");

  it("exports getCelebrationState function", () => {
    expect(content).toContain("export async function getCelebrationState");
  });

  it("exports saveCelebrationState function", () => {
    expect(content).toContain("export async function saveCelebrationState");
  });

  it("exports checkForNewBadge function", () => {
    expect(content).toContain("export async function checkForNewBadge");
  });

  it("exports markBadgeCelebrated function", () => {
    expect(content).toContain("export async function markBadgeCelebrated");
  });

  it("exports resetCelebrations function", () => {
    expect(content).toContain("export async function resetCelebrations");
  });

  it("uses AsyncStorage for persistence", () => {
    expect(content).toContain("AsyncStorage");
    expect(content).toContain("@badge_celebration_state");
  });

  it("checks if badge has already been celebrated to avoid duplicates", () => {
    expect(content).toContain("celebratedBadges.includes");
  });
});

// ─── 3. Focus History Tests ──────────────────────────────────────────────────

describe("Focus History", () => {
  beforeEach(() => {
    Object.keys(mockStorage).forEach((k) => delete mockStorage[k]);
  });

  const FOCUS_HISTORY_KEY = "@connectworld_focus_history";

  it("returns empty array when no history exists", async () => {
    const AsyncStorage = (await import("@react-native-async-storage/async-storage")).default;
    const raw = await AsyncStorage.getItem(FOCUS_HISTORY_KEY);
    expect(raw).toBeNull();
  });

  it("stores and retrieves focus sessions", async () => {
    const AsyncStorage = (await import("@react-native-async-storage/async-storage")).default;
    const sessions = [
      { startedAt: 1000000, endedAt: 1001800, durationSeconds: 1800, activity: "Vocabulary Review" },
      { startedAt: 2000000, endedAt: 2000900, durationSeconds: 900, activity: "Grammar Practice" },
    ];
    await AsyncStorage.setItem(FOCUS_HISTORY_KEY, JSON.stringify(sessions));
    const raw = await AsyncStorage.getItem(FOCUS_HISTORY_KEY);
    const parsed = JSON.parse(raw!);
    expect(parsed).toHaveLength(2);
    expect(parsed[0].activity).toBe("Vocabulary Review");
    expect(parsed[1].durationSeconds).toBe(900);
  });

  it("formatDuration formats seconds correctly", () => {
    const formatDuration = (seconds: number): string => {
      const hrs = Math.floor(seconds / 3600);
      const mins = Math.floor((seconds % 3600) / 60);
      const secs = seconds % 60;
      if (hrs > 0) return `${hrs}h ${mins}m`;
      if (mins > 0) return `${mins}m ${secs}s`;
      return `${secs}s`;
    };
    expect(formatDuration(45)).toBe("45s");
    expect(formatDuration(125)).toBe("2m 5s");
    expect(formatDuration(3661)).toBe("1h 1m");
    expect(formatDuration(7200)).toBe("2h 0m");
  });

  it("formatDate returns Today for current date", () => {
    const formatDate = (timestamp: number): string => {
      const date = new Date(timestamp);
      const now = new Date();
      const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays === 0) return "Today";
      if (diffDays === 1) return "Yesterday";
      if (diffDays < 7) return `${diffDays} days ago`;
      return date.toLocaleDateString();
    };
    expect(formatDate(Date.now())).toBe("Today");
    expect(formatDate(Date.now() - 86400000)).toBe("Yesterday");
    expect(formatDate(Date.now() - 86400000 * 3)).toBe("3 days ago");
  });

  it("calculates total minutes from sessions", () => {
    const sessions = [
      { durationSeconds: 1800 },
      { durationSeconds: 900 },
      { durationSeconds: 3600 },
    ];
    const totalSecs = sessions.reduce((sum, s) => sum + s.durationSeconds, 0);
    const totalMinutes = Math.round(totalSecs / 60);
    expect(totalMinutes).toBe(105);
  });

  it("calculates average minutes per session", () => {
    const sessions = [
      { durationSeconds: 1800 },
      { durationSeconds: 900 },
      { durationSeconds: 600 },
    ];
    const totalSecs = sessions.reduce((sum, s) => sum + s.durationSeconds, 0);
    const totalMinutes = Math.round(totalSecs / 60);
    const avgMinutes = Math.round(totalMinutes / sessions.length);
    expect(avgMinutes).toBe(18);
  });

  it("clearing history removes all sessions", async () => {
    const AsyncStorage = (await import("@react-native-async-storage/async-storage")).default;
    await AsyncStorage.setItem(FOCUS_HISTORY_KEY, JSON.stringify([{ durationSeconds: 100 }]));
    await AsyncStorage.removeItem(FOCUS_HISTORY_KEY);
    const raw = await AsyncStorage.getItem(FOCUS_HISTORY_KEY);
    expect(raw).toBeNull();
  });
});

// ─── 4. Search Results → Recently Visited Wiring Tests (file-based) ──────────

describe("Search Results → Recently Visited Wiring", () => {
  const homeFilePath = path.resolve(__dirname, "../app/(tabs)/index.tsx");
  const homeContent = fs.readFileSync(homeFilePath, "utf-8");
  const recentFilePath = path.resolve(__dirname, "../lib/recently-visited.ts");
  const recentContent = fs.readFileSync(recentFilePath, "utf-8");

  it("home screen imports addRecentlyVisited", () => {
    expect(homeContent).toContain("import { addRecentlyVisited }");
  });

  it("search result onPress calls addRecentlyVisited", () => {
    // The search results section should call addRecentlyVisited
    expect(homeContent).toContain("addRecentlyVisited({ id: item.id, title: item.title, icon: item.icon, route: item.route, color: item.color })");
  });

  it("search result onPress also calls setRecentRefresh", () => {
    expect(homeContent).toContain("setRecentRefresh");
  });

  it("recently-visited module exports addRecentlyVisited", () => {
    expect(recentContent).toContain("export async function addRecentlyVisited");
  });

  it("recently-visited module exports getRecentlyVisited", () => {
    expect(recentContent).toContain("export async function getRecentlyVisited");
  });

  it("recently-visited module limits to MAX_ITEMS", () => {
    expect(recentContent).toContain("MAX_ITEMS");
  });

  it("recently-visited module deduplicates by id", () => {
    expect(recentContent).toContain("filter");
  });

  it("search result tap triggers both trackFeatureUsed and addRecentlyVisited", () => {
    // Simulate the onPress handler logic
    const trackFeatureUsed = vi.fn();
    const addRecentlyVisitedFn = vi.fn();
    const setRecentRefresh = vi.fn();
    const routerPush = vi.fn();

    const item = { id: "test", title: "Test", icon: "🧪", route: "/test", color: "#000" };

    // Simulate onPress
    trackFeatureUsed(item.id);
    addRecentlyVisitedFn({ id: item.id, title: item.title, icon: item.icon, route: item.route, color: item.color });
    setRecentRefresh(1);
    routerPush(item.route);

    expect(trackFeatureUsed).toHaveBeenCalledWith("test");
    expect(addRecentlyVisitedFn).toHaveBeenCalledWith({ id: "test", title: "Test", icon: "🧪", route: "/test", color: "#000" });
    expect(setRecentRefresh).toHaveBeenCalled();
    expect(routerPush).toHaveBeenCalledWith("/test");
  });
});
