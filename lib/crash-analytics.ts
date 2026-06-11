/**
 * Crash Analytics Service
 * 
 * Lightweight crash reporting that sends error data to the backend.
 * In production, this reports to our server endpoint which can forward
 * to external services (Sentry, Bugsnag, etc.) if configured.
 * 
 * In development, errors are logged to console only.
 */

import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface CrashReport {
  /** Unique crash ID */
  id: string;
  /** Error message */
  message: string;
  /** Error stack trace */
  stack?: string;
  /** React component stack */
  componentStack?: string;
  /** Screen/route where crash occurred */
  screen?: string;
  /** Error boundary level (root | screen) */
  level: "root" | "screen";
  /** Timestamp ISO string */
  timestamp: string;
  /** App version */
  appVersion: string;
  /** Platform (ios | android | web) */
  platform: string;
  /** Device info */
  deviceInfo: {
    os: string;
    osVersion?: string;
  };
  /** User ID if available */
  userId?: string;
  /** Additional context */
  metadata?: Record<string, string>;
}

// ─── Storage Keys ────────────────────────────────────────────────────────────

const CRASH_QUEUE_KEY = "@crash_analytics:queue";
const MAX_QUEUED_REPORTS = 50;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function generateCrashId(): string {
  return `crash_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function getDeviceInfo() {
  return {
    os: Platform.OS,
    osVersion: Platform.Version?.toString(),
  };
}

function getAppVersion(): string {
  return Constants.expoConfig?.version ?? "1.0.0";
}

// ─── Queue Management ────────────────────────────────────────────────────────

async function getQueuedReports(): Promise<CrashReport[]> {
  try {
    const raw = await AsyncStorage.getItem(CRASH_QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

async function saveToQueue(report: CrashReport): Promise<void> {
  try {
    const queue = await getQueuedReports();
    // Keep only the most recent reports
    const trimmed = queue.slice(-(MAX_QUEUED_REPORTS - 1));
    trimmed.push(report);
    await AsyncStorage.setItem(CRASH_QUEUE_KEY, JSON.stringify(trimmed));
  } catch {
    // Silently fail — we don't want crash reporting to crash the app
  }
}

async function clearQueue(): Promise<void> {
  try {
    await AsyncStorage.removeItem(CRASH_QUEUE_KEY);
  } catch {
    // Silently fail
  }
}

// ─── Reporting ───────────────────────────────────────────────────────────────

/**
 * Report a crash to the analytics backend.
 * Falls back to local queue if network is unavailable.
 */
export async function reportCrash(
  error: Error,
  options: {
    componentStack?: string;
    screen?: string;
    level?: "root" | "screen";
    userId?: string;
    metadata?: Record<string, string>;
  } = {}
): Promise<void> {
  const report: CrashReport = {
    id: generateCrashId(),
    message: error.message,
    stack: error.stack?.slice(0, 2000), // Limit stack size
    componentStack: options.componentStack?.slice(0, 1000),
    screen: options.screen,
    level: options.level ?? "root",
    timestamp: new Date().toISOString(),
    appVersion: getAppVersion(),
    platform: Platform.OS,
    deviceInfo: getDeviceInfo(),
    userId: options.userId,
    metadata: options.metadata,
  };

  if (__DEV__) {
    // In development, just log and queue locally
    console.warn("[CrashAnalytics] Crash captured (dev mode):", report.id);
    console.warn("[CrashAnalytics] Message:", report.message);
    await saveToQueue(report);
    return;
  }

  // In production, attempt to send to backend via tRPC
  try {
    const { vanillaClient } = await import("@/lib/trpc");
    await vanillaClient.crashReport.submit.mutate({
      id: report.id,
      message: report.message,
      stack: report.stack,
      componentStack: report.componentStack,
      level: report.level === "root" ? "fatal" : "error",
      timestamp: report.timestamp,
      platform: report.platform,
      appVersion: report.appVersion,
      screen: report.screen,
      userId: report.userId,
      metadata: report.metadata as Record<string, unknown> | undefined,
    });
  } catch {
    // Network error — queue for later
    await saveToQueue(report);
  }
}

/**
 * Flush queued crash reports to the backend.
 * Call this on app startup or when network becomes available.
 */
export async function flushCrashQueue(): Promise<number> {
  const queue = await getQueuedReports();
  if (queue.length === 0) return 0;

  if (__DEV__) {
    console.log(`[CrashAnalytics] ${queue.length} queued reports (dev mode, skipping flush)`);
    return 0;
  }

  try {
    const { vanillaClient } = await import("@/lib/trpc");
    const mapped = queue.map((r) => ({
      id: r.id,
      message: r.message,
      stack: r.stack,
      componentStack: r.componentStack,
      level: (r.level === "root" ? "fatal" : "error") as "fatal" | "error" | "warning",
      timestamp: r.timestamp,
      platform: r.platform,
      appVersion: r.appVersion,
      screen: r.screen,
      userId: r.userId,
      metadata: r.metadata as Record<string, unknown> | undefined,
    }));
    await vanillaClient.crashReport.submitBatch.mutate({ reports: mapped });
    await clearQueue();
    return queue.length;
  } catch {
    // Keep queue for next attempt
  }

  return 0;
}

/**
 * Get the count of queued (unsent) crash reports.
 */
export async function getQueuedCrashCount(): Promise<number> {
  const queue = await getQueuedReports();
  return queue.length;
}

/**
 * Get all queued crash reports (for debugging/admin).
 */
export async function getQueuedCrashReports(): Promise<CrashReport[]> {
  return getQueuedReports();
}
