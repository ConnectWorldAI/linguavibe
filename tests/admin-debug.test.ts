import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

const ADMIN_DEBUG_PATH = path.resolve(__dirname, "../app/admin-debug.tsx");
const SETTINGS_PATH = path.resolve(__dirname, "../app/settings.tsx");
const ROUTERS_PATH = path.resolve(__dirname, "../server/routers.ts");

describe("Admin Debug Panel", () => {
  const source = fs.readFileSync(ADMIN_DEBUG_PATH, "utf-8");

  it("exports default AdminDebugScreen component", () => {
    expect(source).toContain("export default function AdminDebugScreen()");
  });

  it("imports feature flag management functions", () => {
    expect(source).toContain("initFeatureFlags");
    expect(source).toContain("overrideFlag");
    expect(source).toContain("resetFlags");
    expect(source).toContain("getExperimentEvents");
    expect(source).toContain("clearExperimentEvents");
  });

  it("imports crash analytics functions", () => {
    expect(source).toContain("getQueuedCrashCount");
    expect(source).toContain("getQueuedCrashReports");
    expect(source).toContain("flushCrashQueue");
  });

  it("displays crash analytics section with stats", () => {
    expect(source).toContain("Crash Analytics");
    expect(source).toContain("Queued Reports");
    expect(source).toContain("Experiment Events");
  });

  it("displays feature flags section with toggles", () => {
    expect(source).toContain("Feature Flags");
    expect(source).toContain("Switch");
    expect(source).toContain("handleToggleFlag");
  });

  it("has reset all flags functionality", () => {
    expect(source).toContain("handleResetFlags");
    expect(source).toContain("Reset Feature Flags");
  });

  it("has flush crashes button", () => {
    expect(source).toContain("handleFlushCrashes");
    expect(source).toContain("Flush Crashes");
  });

  it("shows environment info section", () => {
    expect(source).toContain("Environment");
    expect(source).toContain("Platform");
    expect(source).toContain("DEV Mode");
  });

  it("displays recent crash reports when expanded", () => {
    expect(source).toContain("showCrashes");
    expect(source).toContain("recentCrashes");
    expect(source).toContain("crashCard");
  });
});

describe("Settings Triple-Tap Trigger", () => {
  const source = fs.readFileSync(SETTINGS_PATH, "utf-8");

  it("has version tap counter state", () => {
    expect(source).toContain("versionTapCount");
    expect(source).toContain("setVersionTapCount");
  });

  it("implements triple-tap detection with timer", () => {
    expect(source).toContain("handleVersionTap");
    expect(source).toContain("newCount >= 3");
    expect(source).toContain("versionTapTimer");
  });

  it("navigates to admin-debug on triple tap", () => {
    expect(source).toContain("/admin-debug");
  });

  it("resets tap count after timeout", () => {
    expect(source).toContain("setTimeout(() => setVersionTapCount(0)");
  });

  it("provides haptic feedback on successful triple tap", () => {
    expect(source).toContain("Haptics.notificationAsync");
  });
});

describe("Server Crash Report Endpoint", () => {
  const source = fs.readFileSync(ROUTERS_PATH, "utf-8");

  it("defines crashReport router", () => {
    expect(source).toContain("crashReport: router({");
  });

  it("has submit mutation for single reports", () => {
    expect(source).toContain("submit: publicProcedure");
    expect(source).toContain("id: z.string()");
    expect(source).toContain("message: z.string()");
    expect(source).toContain("level: z.enum([\"fatal\", \"error\", \"warning\"])");
  });

  it("has submitBatch mutation for batch reports", () => {
    expect(source).toContain("submitBatch: publicProcedure");
    expect(source).toContain("reports: z.array(");
  });

  it("has stats query for admin panel", () => {
    expect(source).toContain("stats: publicProcedure.query(");
    expect(source).toContain("totalReports");
    expect(source).toContain("last24h");
  });

  it("logs crash reports server-side", () => {
    expect(source).toContain("[CRASH]");
    expect(source).toContain("[CRASH BATCH]");
  });

  it("returns acknowledgment with report ID", () => {
    expect(source).toContain("received: true, id: input.id");
  });
});
