import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

const CRASH_ANALYTICS_PATH = path.resolve(__dirname, "../lib/crash-analytics.ts");
const ERROR_BOUNDARY_PATH = path.resolve(__dirname, "../components/error-boundary.tsx");

describe("Crash Analytics Module", () => {
  const source = fs.readFileSync(CRASH_ANALYTICS_PATH, "utf-8");

  it("exports reportCrash function", () => {
    expect(source).toContain("export async function reportCrash(");
  });

  it("exports flushCrashQueue function", () => {
    expect(source).toContain("export async function flushCrashQueue(");
  });

  it("exports getQueuedCrashCount function", () => {
    expect(source).toContain("export async function getQueuedCrashCount(");
  });

  it("exports getQueuedCrashReports function", () => {
    expect(source).toContain("export async function getQueuedCrashReports(");
  });

  it("defines CrashReport interface with required fields", () => {
    expect(source).toContain("export interface CrashReport");
    expect(source).toContain("id: string");
    expect(source).toContain("message: string");
    expect(source).toContain("stack?: string");
    expect(source).toContain("componentStack?: string");
    expect(source).toContain("level: \"root\" | \"screen\"");
    expect(source).toContain("timestamp: string");
    expect(source).toContain("appVersion: string");
    expect(source).toContain("platform: string");
  });

  it("uses AsyncStorage for queue persistence", () => {
    expect(source).toContain("AsyncStorage");
    expect(source).toContain("@crash_analytics:queue");
  });

  it("limits queued reports to MAX_QUEUED_REPORTS", () => {
    expect(source).toContain("MAX_QUEUED_REPORTS");
    expect(source).toContain("const MAX_QUEUED_REPORTS = 50");
  });

  it("generates unique crash IDs", () => {
    expect(source).toContain("generateCrashId");
    expect(source).toContain("crash_");
  });

  it("includes device info in reports", () => {
    expect(source).toContain("getDeviceInfo");
    expect(source).toContain("Platform.OS");
  });

  it("handles dev mode differently (console only)", () => {
    expect(source).toContain("__DEV__");
    expect(source).toContain("dev mode");
  });

  it("attempts to send to backend via tRPC in production", () => {
    expect(source).toContain("vanillaClient");
    expect(source).toContain("crashReport.submit.mutate");
  });

  it("queues reports on network failure", () => {
    expect(source).toContain("saveToQueue(report)");
  });

  it("supports batch flush of queued reports via tRPC", () => {
    expect(source).toContain("crashReport.submitBatch.mutate");
  });
});

describe("ErrorBoundary Integration", () => {
  const source = fs.readFileSync(ERROR_BOUNDARY_PATH, "utf-8");

  it("imports reportCrash from crash-analytics", () => {
    expect(source).toContain("import { reportCrash } from \"@/lib/crash-analytics\"");
  });

  it("calls reportCrash in componentDidCatch", () => {
    expect(source).toContain("reportCrash(error,");
  });

  it("passes componentStack to reportCrash", () => {
    expect(source).toContain("componentStack: errorInfo.componentStack");
  });

  it("passes level to reportCrash", () => {
    expect(source).toContain("level: this.props.level");
  });

  it("wraps reportCrash in catch to prevent crash-in-crash", () => {
    expect(source).toContain(".catch(() => {");
  });
});
