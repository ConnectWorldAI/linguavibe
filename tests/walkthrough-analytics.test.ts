import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock AsyncStorage
const mockStorage: Record<string, string> = {};
vi.mock("@react-native-async-storage/async-storage", () => ({
  default: {
    getItem: vi.fn((key: string) => Promise.resolve(mockStorage[key] || null)),
    setItem: vi.fn((key: string, value: string) => {
      mockStorage[key] = value;
      return Promise.resolve();
    }),
    removeItem: vi.fn((key: string) => {
      delete mockStorage[key];
      return Promise.resolve();
    }),
  },
}));

// Mock __DEV__
(globalThis as any).__DEV__ = false;

describe("Walkthrough Analytics Module", () => {
  beforeEach(() => {
    Object.keys(mockStorage).forEach((key) => delete mockStorage[key]);
    vi.clearAllMocks();
  });

  it("should export trackWalkthroughEvent function", async () => {
    const { trackWalkthroughEvent } = await import("../lib/walkthrough-analytics");
    expect(typeof trackWalkthroughEvent).toBe("function");
  });

  it("should export getWalkthroughAnalytics function", async () => {
    const { getWalkthroughAnalytics } = await import("../lib/walkthrough-analytics");
    expect(typeof getWalkthroughAnalytics).toBe("function");
  });

  it("should export clearWalkthroughAnalytics function", async () => {
    const { clearWalkthroughAnalytics } = await import("../lib/walkthrough-analytics");
    expect(typeof clearWalkthroughAnalytics).toBe("function");
  });

  it("should track walkthrough_step_viewed events", async () => {
    const { trackWalkthroughEvent, getWalkthroughAnalytics } = await import("../lib/walkthrough-analytics");
    await trackWalkthroughEvent("walkthrough_step_viewed", { stepIndex: 0, stepId: "overview" });
    const analytics = await getWalkthroughAnalytics();
    expect(analytics.events.length).toBeGreaterThan(0);
    expect(analytics.events[0].event).toBe("walkthrough_step_viewed");
    expect(analytics.events[0].stepIndex).toBe(0);
  });

  it("should track walkthrough_completed events", async () => {
    const { trackWalkthroughEvent, getWalkthroughAnalytics } = await import("../lib/walkthrough-analytics");
    await trackWalkthroughEvent("walkthrough_completed", { totalSteps: 5 });
    const analytics = await getWalkthroughAnalytics();
    expect(analytics.totalCompletions).toBe(1);
  });

  it("should track walkthrough_skipped events with step info", async () => {
    const { trackWalkthroughEvent, getWalkthroughAnalytics } = await import("../lib/walkthrough-analytics");
    await trackWalkthroughEvent("walkthrough_skipped", { stepIndex: 2, stepId: "tap_default" });
    const analytics = await getWalkthroughAnalytics();
    expect(analytics.totalSkips).toBe(1);
    expect(analytics.stepDropoffs["tap_default"]).toBe(1);
  });

  it("should track walkthrough_started events", async () => {
    const { trackWalkthroughEvent, getWalkthroughAnalytics } = await import("../lib/walkthrough-analytics");
    await trackWalkthroughEvent("walkthrough_started", { source: "first_launch" });
    const analytics = await getWalkthroughAnalytics();
    expect(analytics.totalStarts).toBe(1);
  });

  it("should clear analytics data", async () => {
    const { trackWalkthroughEvent, clearWalkthroughAnalytics, getWalkthroughAnalytics } = await import("../lib/walkthrough-analytics");
    await trackWalkthroughEvent("walkthrough_started");
    await clearWalkthroughAnalytics();
    const analytics = await getWalkthroughAnalytics();
    expect(analytics.events.length).toBe(0);
    expect(analytics.totalStarts).toBe(0);
  });

  it("should calculate averageLastStep from skip events", async () => {
    const { trackWalkthroughEvent, getWalkthroughAnalytics } = await import("../lib/walkthrough-analytics");
    await trackWalkthroughEvent("walkthrough_skipped", { stepIndex: 2 });
    await trackWalkthroughEvent("walkthrough_skipped", { stepIndex: 4 });
    const analytics = await getWalkthroughAnalytics();
    expect(analytics.averageLastStep).toBe(3);
  });

  it("should include source metadata in events", async () => {
    const { trackWalkthroughEvent, getWalkthroughAnalytics } = await import("../lib/walkthrough-analytics");
    await trackWalkthroughEvent("walkthrough_started", { source: "settings" });
    const analytics = await getWalkthroughAnalytics();
    expect(analytics.events[0].source).toBe("settings");
  });
});
