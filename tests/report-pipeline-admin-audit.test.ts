/**
 * Tests for:
 * 1. Report AI button → Moderation Dashboard pipeline (shared AsyncStorage key, matching data shape)
 * 2. Admin role gating (moderation dashboard + settings filtering)
 * 3. AI Guardrails Audit Log screen
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import * as fs from "fs";
import * as path from "path";

// ─── 1. Report → Dashboard Pipeline ─────────────────────────────────────────

describe("Report AI → Moderation Dashboard Pipeline", () => {
  const reportComponentPath = path.resolve(__dirname, "../components/report-ai-response.tsx");
  const dashboardPath = path.resolve(__dirname, "../app/moderation-dashboard.tsx");

  it("report component file exists", () => {
    expect(fs.existsSync(reportComponentPath)).toBe(true);
  });

  it("moderation dashboard file exists", () => {
    expect(fs.existsSync(dashboardPath)).toBe(true);
  });

  it("both use the same AsyncStorage key @linguavibe_ai_reports", () => {
    const reportSrc = fs.readFileSync(reportComponentPath, "utf-8");
    const dashSrc = fs.readFileSync(dashboardPath, "utf-8");
    expect(reportSrc).toContain('@linguavibe_ai_reports');
    expect(dashSrc).toContain('@linguavibe_ai_reports');
  });

  it("report component includes status: pending field in report data", () => {
    const src = fs.readFileSync(reportComponentPath, "utf-8");
    expect(src).toContain('status: "pending"');
  });

  it("report component includes details field for context", () => {
    const src = fs.readFileSync(reportComponentPath, "utf-8");
    expect(src).toContain("details:");
  });

  it("dashboard reads reports with status field", () => {
    const src = fs.readFileSync(dashboardPath, "utf-8");
    expect(src).toContain('status: "pending" | "approved" | "dismissed" | "retrain"');
  });

  it("dashboard has reason labels matching report component reason values", () => {
    const src = fs.readFileSync(dashboardPath, "utf-8");
    expect(src).toContain("incorrect_translation");
    expect(src).toContain("offensive_content");
    expect(src).toContain("inappropriate_response");
    expect(src).toContain("wrong_grammar");
    expect(src).toContain("cultural_insensitivity");
  });

  it("report component exports getStoredReports helper", () => {
    const src = fs.readFileSync(reportComponentPath, "utf-8");
    expect(src).toContain("export async function getStoredReports");
  });

  it("report component exports clearStoredReports helper", () => {
    const src = fs.readFileSync(reportComponentPath, "utf-8");
    expect(src).toContain("export async function clearStoredReports");
  });
});

// ─── 2. Admin Role Gating ────────────────────────────────────────────────────

describe("Admin Role Gating", () => {
  const dashboardPath = path.resolve(__dirname, "../app/moderation-dashboard.tsx");
  const settingsPath = path.resolve(__dirname, "../app/settings.tsx");
  const adminAccessPath = path.resolve(__dirname, "../lib/admin-access.ts");

  it("admin-access.ts provides getAdminState function", () => {
    const src = fs.readFileSync(adminAccessPath, "utf-8");
    expect(src).toContain("export async function getAdminState");
  });

  it("moderation dashboard imports getAdminState", () => {
    const src = fs.readFileSync(dashboardPath, "utf-8");
    expect(src).toContain("import { getAdminState }");
  });

  it("moderation dashboard checks isAdmin state", () => {
    const src = fs.readFileSync(dashboardPath, "utf-8");
    expect(src).toContain("isAdmin");
    expect(src).toContain("Access Denied");
  });

  it("moderation dashboard shows lock icon for non-admin users", () => {
    const src = fs.readFileSync(dashboardPath, "utf-8");
    expect(src).toContain("lock-closed");
    expect(src).toContain("Admin Access Required");
  });

  it("settings screen imports getAdminState", () => {
    const src = fs.readFileSync(settingsPath, "utf-8");
    expect(src).toContain("import { getAdminState }");
  });

  it("settings screen has isAdminUser state", () => {
    const src = fs.readFileSync(settingsPath, "utf-8");
    expect(src).toContain("isAdminUser");
  });

  it("settings screen filters admin-only items for non-admin users", () => {
    const src = fs.readFileSync(settingsPath, "utf-8");
    expect(src).toContain("!isAdminUser");
    expect(src).toContain("Moderation Dashboard");
    expect(src).toContain("Audit Log");
  });

  it("settings screen hides admin section for non-admin users", () => {
    const src = fs.readFileSync(settingsPath, "utf-8");
    expect(src).toContain('section.id === "admin"');
  });
});

// ─── 3. AI Guardrails Audit Log Screen ──────────────────────────────────────

describe("AI Guardrails Audit Log Screen", () => {
  const auditLogPath = path.resolve(__dirname, "../app/ai-audit-log.tsx");
  const settingsPath = path.resolve(__dirname, "../app/settings.tsx");
  const securityRouterPath = path.resolve(__dirname, "../server/aiSecurityRouter.ts");

  it("audit log screen file exists", () => {
    expect(fs.existsSync(auditLogPath)).toBe(true);
  });

  it("audit log screen imports getAdminState for admin gating", () => {
    const src = fs.readFileSync(auditLogPath, "utf-8");
    expect(src).toContain("import { getAdminState }");
  });

  it("audit log screen uses trpc.aiSecurity.getAuditLog", () => {
    const src = fs.readFileSync(auditLogPath, "utf-8");
    expect(src).toContain("trpc.aiSecurity.getAuditLog");
  });

  it("audit log screen uses trpc.aiSecurity.getStats", () => {
    const src = fs.readFileSync(auditLogPath, "utf-8");
    expect(src).toContain("trpc.aiSecurity.getStats");
  });

  it("audit log screen has filter tabs for all/blocked/warned/banned/allowed", () => {
    const src = fs.readFileSync(auditLogPath, "utf-8");
    expect(src).toContain('"blocked"');
    expect(src).toContain('"warned"');
    expect(src).toContain('"banned"');
    expect(src).toContain('"allowed"');
  });

  it("audit log screen displays threat level and score", () => {
    const src = fs.readFileSync(auditLogPath, "utf-8");
    expect(src).toContain("threatLevel");
    expect(src).toContain("score");
  });

  it("audit log screen displays input preview", () => {
    const src = fs.readFileSync(auditLogPath, "utf-8");
    expect(src).toContain("inputPreview");
    expect(src).toContain("INPUT PREVIEW");
  });

  it("audit log screen has admin access check with lock icon", () => {
    const src = fs.readFileSync(auditLogPath, "utf-8");
    expect(src).toContain("lock-closed");
    expect(src).toContain("Admin Access Required");
  });

  it("audit log is linked from settings under AI Safety section", () => {
    const src = fs.readFileSync(settingsPath, "utf-8");
    expect(src).toContain("AI Guardrails Audit Log");
    expect(src).toContain("/ai-audit-log");
  });

  it("server has getAuditLog endpoint in aiSecurityRouter", () => {
    const src = fs.readFileSync(securityRouterPath, "utf-8");
    expect(src).toContain("getAuditLog");
  });

  it("server has getStats endpoint in aiSecurityRouter", () => {
    const src = fs.readFileSync(securityRouterPath, "utf-8");
    expect(src).toContain("getStats");
  });

  it("audit log screen uses FlatList for entries", () => {
    const src = fs.readFileSync(auditLogPath, "utf-8");
    expect(src).toContain("FlatList");
  });

  it("audit log screen has RefreshControl for pull-to-refresh", () => {
    const src = fs.readFileSync(auditLogPath, "utf-8");
    expect(src).toContain("RefreshControl");
  });

  it("audit log screen shows stats summary (total, blocked, banned, threats)", () => {
    const src = fs.readFileSync(auditLogPath, "utf-8");
    expect(src).toContain("totalRequests");
    expect(src).toContain("blockedRequests");
    expect(src).toContain("bannedUsers");
    expect(src).toContain("recentThreats");
  });
});

// ─── 4. Data Shape Compatibility ────────────────────────────────────────────

describe("Data Shape Compatibility", () => {
  const reportComponentPath = path.resolve(__dirname, "../components/report-ai-response.tsx");
  const dashboardPath = path.resolve(__dirname, "../app/moderation-dashboard.tsx");

  it("report data shape has all fields the dashboard expects", () => {
    const reportSrc = fs.readFileSync(reportComponentPath, "utf-8");
    const dashSrc = fs.readFileSync(dashboardPath, "utf-8");

    // Dashboard expects: id, messageContent, reason, timestamp, status, details?, reviewedAt?, reviewNote?
    // Report creates: id, messageContent, reason, timestamp, context, status, details
    expect(reportSrc).toContain("id:");
    expect(reportSrc).toContain("messageContent:");
    expect(reportSrc).toContain("reason:");
    expect(reportSrc).toContain("timestamp:");
    expect(reportSrc).toContain("status:");

    // Dashboard reads these fields
    expect(dashSrc).toContain("item.id");
    expect(dashSrc).toContain("item.messageContent");
    expect(dashSrc).toContain("item.reason");
    expect(dashSrc).toContain("item.timestamp");
    expect(dashSrc).toContain("item.status");
  });

  it("report stores max 100 entries to prevent storage bloat", () => {
    const src = fs.readFileSync(reportComponentPath, "utf-8");
    expect(src).toContain("reports.length > 100");
  });

  it("dashboard sorts reports by newest first", () => {
    const src = fs.readFileSync(dashboardPath, "utf-8");
    expect(src).toContain("parsed.sort((a, b) => b.timestamp - a.timestamp)");
  });
});
