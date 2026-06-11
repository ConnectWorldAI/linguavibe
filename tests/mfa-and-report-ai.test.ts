import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

describe("MFA/TOTP Router", () => {
  const routerPath = path.resolve(__dirname, "../server/mfaRouter.ts");
  const routerContent = fs.readFileSync(routerPath, "utf-8");

  it("exports mfaRouter", () => {
    expect(routerContent).toContain("export const mfaRouter");
  });

  it("has setupStart procedure for generating TOTP secret", () => {
    expect(routerContent).toContain("setupStart:");
    expect(routerContent).toContain("otpauth://totp/");
  });

  it("has setupVerify procedure for completing MFA enrollment", () => {
    expect(routerContent).toContain("setupVerify:");
    expect(routerContent).toContain("MFA enabled successfully");
  });

  it("has verify procedure for login verification", () => {
    expect(routerContent).toContain("verify:");
    expect(routerContent).toContain("verifyTOTP");
  });

  it("has status query for checking MFA state", () => {
    expect(routerContent).toContain("status:");
    expect(routerContent).toContain("enabled:");
  });

  it("has disable procedure requiring code verification", () => {
    expect(routerContent).toContain("disable:");
    expect(routerContent).toContain("Cannot disable MFA without valid verification");
  });

  it("has regenerateBackupCodes procedure", () => {
    expect(routerContent).toContain("regenerateBackupCodes:");
    expect(routerContent).toContain("New backup codes generated");
  });

  it("generates base32 encoded secrets", () => {
    expect(routerContent).toContain("base32Encode");
    expect(routerContent).toContain("base32Decode");
  });

  it("uses timing-safe comparison for code verification", () => {
    expect(routerContent).toContain("timingSafeEqual");
    expect(routerContent).toContain("crypto.timingSafeEqual");
  });

  it("supports backup codes in XXXX-XXXX format", () => {
    expect(routerContent).toContain("generateBackupCodes");
    expect(routerContent).toContain("code.slice(0, 4)");
  });

  it("uses 30-second TOTP period with 6 digits", () => {
    expect(routerContent).toContain("TOTP_PERIOD = 30");
    expect(routerContent).toContain("TOTP_DIGITS = 6");
  });

  it("allows time window of +/- 1 step for clock drift", () => {
    expect(routerContent).toContain("window: number = 1");
  });
});

describe("MFA Router is wired into appRouter", () => {
  const routersPath = path.resolve(__dirname, "../server/routers.ts");
  const routersContent = fs.readFileSync(routersPath, "utf-8");

  it("imports mfaRouter", () => {
    expect(routersContent).toContain('import { mfaRouter } from "./mfaRouter"');
  });

  it("registers mfa route in appRouter", () => {
    expect(routersContent).toContain("mfa: mfaRouter");
  });
});

describe("Report AI Response Component", () => {
  const componentPath = path.resolve(__dirname, "../components/report-ai-response.tsx");
  const content = fs.readFileSync(componentPath, "utf-8");

  it("exports ReportAIResponse component", () => {
    expect(content).toContain("export function ReportAIResponse");
  });

  it("has report reasons for language learning context", () => {
    expect(content).toContain("incorrect_translation");
    expect(content).toContain("wrong_grammar");
    expect(content).toContain("offensive_content");
    expect(content).toContain("cultural_insensitivity");
  });

  it("stores reports in AsyncStorage", () => {
    expect(content).toContain("@linguavibe_ai_reports");
    expect(content).toContain("AsyncStorage.setItem");
  });

  it("shows a flag button for inline reporting", () => {
    expect(content).toContain("Report this AI response");
    expect(content).toContain("flagButton");
  });

  it("shows a modal with reason selection", () => {
    expect(content).toContain("<Modal");
    expect(content).toContain("What's wrong with this response?");
  });

  it("provides success feedback after submission", () => {
    expect(content).toContain("Report Submitted");
    expect(content).toContain("Thank you for helping improve ConnectWorld AI");
  });

  it("exports helper functions for retrieving stored reports", () => {
    expect(content).toContain("export async function getStoredReports");
    expect(content).toContain("export async function clearStoredReports");
  });

  it("limits stored reports to 100", () => {
    expect(content).toContain("reports.length > 100");
  });
});

describe("Report AI Response wired into chat screens", () => {
  it("is wired into ai-chat.tsx", () => {
    const content = fs.readFileSync(path.resolve(__dirname, "../app/ai-chat.tsx"), "utf-8");
    expect(content).toContain("ReportAIResponse");
    expect(content).toContain('import { ReportAIResponse } from "@/components/report-ai-response"');
  });

  it("is wired into pen-pal.tsx", () => {
    const content = fs.readFileSync(path.resolve(__dirname, "../app/pen-pal.tsx"), "utf-8");
    expect(content).toContain("ReportAIResponse");
    expect(content).toContain('import { ReportAIResponse } from "@/components/report-ai-response"');
  });

  it("is wired into conversation-sim.tsx", () => {
    const content = fs.readFileSync(path.resolve(__dirname, "../app/conversation-sim.tsx"), "utf-8");
    expect(content).toContain("ReportAIResponse");
    expect(content).toContain('import { ReportAIResponse } from "@/components/report-ai-response"');
  });

  it("is wired into live-simulation.tsx", () => {
    const content = fs.readFileSync(path.resolve(__dirname, "../app/live-simulation.tsx"), "utf-8");
    expect(content).toContain("ReportAIResponse");
    expect(content).toContain('import { ReportAIResponse } from "@/components/report-ai-response"');
  });

  it("is wired into virtual-classroom.tsx", () => {
    const content = fs.readFileSync(path.resolve(__dirname, "../app/virtual-classroom.tsx"), "utf-8");
    expect(content).toContain("ReportAIResponse");
    expect(content).toContain('import { ReportAIResponse } from "@/components/report-ai-response"');
  });
});

describe("AI Security Middleware wired into invokeLLM", () => {
  const llmPath = path.resolve(__dirname, "../server/_core/llm.ts");
  const llmContent = fs.readFileSync(llmPath, "utf-8");

  it("imports AI security module", () => {
    expect(llmContent).toContain("ai-security");
  });

  it("imports AI request context", () => {
    expect(llmContent).toContain("ai-request-context");
  });

  it("checks request context for user ID", () => {
    expect(llmContent).toContain("getAIRequestContext");
  });

  it("runs analyzeInput before LLM call", () => {
    expect(llmContent).toContain("analyzeInput");
  });

  it("runs validateOutput after LLM response", () => {
    expect(llmContent).toContain("validateOutput");
  });
});
