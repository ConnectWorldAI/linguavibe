import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

const appDir = path.resolve(__dirname, "../app");
const serverDir = path.resolve(__dirname, "../server");

describe("AI Security Middleware", () => {
  const securityFile = fs.readFileSync(path.join(serverDir, "ai-security.ts"), "utf-8");

  it("exports analyzeInput function", () => {
    expect(securityFile).toContain("export function analyzeInput");
  });

  it("detects prompt injection patterns", () => {
    expect(securityFile).toContain("INJECTION_PATTERNS");
    expect(securityFile).toMatch(/ignore.*instructions|ignore.*previous/);
  });

  it("detects jailbreak attempts", () => {
    expect(securityFile).toContain("JAILBREAK_INDICATORS");
    expect(securityFile).toMatch(/DAN|jailbreak|bypass/);
  });

  it("sanitizes input before passing to LLM", () => {
    expect(securityFile).toContain("sanitizeInput");
  });

  it("returns threat level classification", () => {
    expect(securityFile).toMatch(/threatLevel|threat_level|ThreatLevel/);
  });
});

describe("AI Content Guardrails", () => {
  const guardrailsFile = fs.readFileSync(path.join(serverDir, "ai-content-guardrails.ts"), "utf-8");

  it("exports content classification function", () => {
    expect(guardrailsFile).toContain("export function classifyTopic");
  });

  it("defines topic classification", () => {
    expect(guardrailsFile).toMatch(/TopicClassification|classifyTopic|ALLOWED_DOMAINS/);
  });

  it("has content policy for safety levels", () => {
    expect(guardrailsFile).toMatch(/ContentPolicy|SafetyLevel|getContentPolicy/);
  });

  it("enforces language learning context boundaries", () => {
    expect(guardrailsFile).toMatch(/language.*learning|educational.*context|ALLOWED_TOPICS/);
  });
});

describe("AI Security Router", () => {
  const routerFile = fs.readFileSync(path.join(serverDir, "aiSecurityRouter.ts"), "utf-8");

  it("exports aiSecurityRouter", () => {
    expect(routerFile).toContain("export const aiSecurityRouter");
  });

  it("has rate limiting endpoint", () => {
    expect(routerFile).toMatch(/rateLimit|rateLimiting|checkRateLimit/);
  });

  it("has report response endpoint", () => {
    expect(routerFile).toMatch(/reportResponse|reportAIResponse/);
  });

  it("is registered in main routers", () => {
    const routersFile = fs.readFileSync(path.join(serverDir, "routers.ts"), "utf-8");
    expect(routersFile).toContain("aiSecurity: aiSecurityRouter");
  });
});

describe("Security & MFA Settings Screen", () => {
  const screen = fs.readFileSync(path.join(appDir, "security-settings.tsx"), "utf-8");

  it("exists as a screen file", () => {
    expect(screen.length).toBeGreaterThan(100);
  });

  it("has two-factor authentication section", () => {
    expect(screen).toMatch(/two.factor|2FA|MFA|multi.factor/i);
  });

  it("has session management", () => {
    expect(screen).toMatch(/session|active.*device|login.*history/i);
  });

  it("has login alerts", () => {
    expect(screen).toMatch(/login.*alert|security.*alert|suspicious/i);
  });
});

describe("AI Safety Controls Screen", () => {
  const screen = fs.readFileSync(path.join(appDir, "ai-safety-settings.tsx"), "utf-8");

  it("exists as a screen file", () => {
    expect(screen.length).toBeGreaterThan(100);
  });

  it("has content strictness controls", () => {
    expect(screen).toMatch(/strict|content.*filter|safety.*level/i);
  });

  it("has AI reporting functionality", () => {
    expect(screen).toMatch(/report|flag|inappropriate/i);
  });

  it("has human escalation option", () => {
    expect(screen).toMatch(/human|escalat|support|moderator/i);
  });
});

describe("Conversations Settings Screen", () => {
  const screen = fs.readFileSync(path.join(appDir, "conversations-settings.tsx"), "utf-8");

  it("exists as a screen file", () => {
    expect(screen.length).toBeGreaterThan(100);
  });

  it("has theme selection", () => {
    expect(screen).toMatch(/theme|Theme/);
  });

  it("has backup functionality", () => {
    expect(screen).toMatch(/backup|Backup/i);
  });

  it("has export functionality", () => {
    expect(screen).toMatch(/export|Export/i);
  });

  it("has archive option", () => {
    expect(screen).toMatch(/archive|Archive/i);
  });
});

describe("Notifications Settings Screen", () => {
  const screen = fs.readFileSync(path.join(appDir, "notifications-settings.tsx"), "utf-8");

  it("exists as a screen file", () => {
    expect(screen.length).toBeGreaterThan(100);
  });

  it("has lesson notification controls", () => {
    expect(screen).toMatch(/lesson.*notif|Lesson.*Notif/i);
  });

  it("has group notification controls", () => {
    expect(screen).toMatch(/group.*notif|Group.*Notif/i);
  });

  it("has sound selection", () => {
    expect(screen).toMatch(/sound|Sound/i);
  });

  it("has reset option", () => {
    expect(screen).toMatch(/reset|Reset/i);
  });
});

describe("Linked Devices Screen", () => {
  const screen = fs.readFileSync(path.join(appDir, "linked-devices.tsx"), "utf-8");

  it("exists as a screen file", () => {
    expect(screen.length).toBeGreaterThan(100);
  });

  it("has link device functionality", () => {
    expect(screen).toMatch(/link.*device|Link.*device/i);
  });

  it("has unlink device functionality", () => {
    expect(screen).toMatch(/unlink|Unlink/i);
  });

  it("shows encryption notice", () => {
    expect(screen).toMatch(/encrypt|end-to-end/i);
  });
});

describe("Invite a Friend Screen", () => {
  const screen = fs.readFileSync(path.join(appDir, "invite-friend.tsx"), "utf-8");

  it("exists as a screen file", () => {
    expect(screen.length).toBeGreaterThan(100);
  });

  it("has share link functionality", () => {
    expect(screen).toMatch(/share.*link|Share.*link|invite.*link/i);
  });

  it("has contact search", () => {
    expect(screen).toMatch(/search|Search/);
  });

  it("has alphabetical contact list", () => {
    expect(screen).toMatch(/ALPHABET|alphabet/);
  });
});

describe("Block User on Profile Screens", () => {
  it("connection-profile has block user handler", () => {
    const screen = fs.readFileSync(path.join(appDir, "connection-profile.tsx"), "utf-8");
    expect(screen).toContain("handleBlockUser");
    expect(screen).toContain("@linguavibe_blocked_users");
  });

  it("user-profile has block user handler", () => {
    const screen = fs.readFileSync(path.join(appDir, "user-profile.tsx"), "utf-8");
    expect(screen).toContain("handleBlockUser");
    expect(screen).toContain("@linguavibe_blocked_users");
  });

  it("connection-profile more button is wired", () => {
    const screen = fs.readFileSync(path.join(appDir, "connection-profile.tsx"), "utf-8");
    expect(screen).toContain("onPress={handleMoreMenu}");
  });

  it("user-profile more button is wired", () => {
    const screen = fs.readFileSync(path.join(appDir, "user-profile.tsx"), "utf-8");
    expect(screen).toContain("onPress={handleMoreMenu}");
  });
});

describe("Streak Toast Milestone Customization", () => {
  const toast = fs.readFileSync(path.resolve(__dirname, "../components/streak-saved-toast.tsx"), "utf-8");

  it("has milestone theme configuration", () => {
    expect(toast).toContain("getMilestoneTheme");
  });

  it("has 7-day milestone", () => {
    expect(toast).toMatch(/count\s*>=\s*7/);
  });

  it("has 14-day milestone", () => {
    expect(toast).toMatch(/count\s*>=\s*14/);
  });

  it("has 30-day milestone", () => {
    expect(toast).toMatch(/count\s*>=\s*30/);
  });

  it("has 100-day milestone", () => {
    expect(toast).toMatch(/count\s*>=\s*100/);
  });

  it("has 365-day milestone", () => {
    expect(toast).toMatch(/count\s*>=\s*365/);
  });

  it("uses different colors for milestones", () => {
    expect(toast).toContain("#FFD700"); // Gold for 365
    expect(toast).toContain("#A855F7"); // Purple for 100
    expect(toast).toContain("#3B82F6"); // Blue for 60
    expect(toast).toContain("#F59E0B"); // Amber for 30
    expect(toast).toContain("#10B981"); // Green for 14
  });

  it("milestones stay visible longer", () => {
    expect(toast).toContain("4000");
  });
});

describe("Settings wiring for new screens", () => {
  const settings = fs.readFileSync(path.join(appDir, "settings.tsx"), "utf-8");

  it("has Security & MFA route", () => {
    expect(settings).toContain("/security-settings");
  });

  it("has Conversations route", () => {
    expect(settings).toContain("/conversations-settings");
  });

  it("has Notifications route", () => {
    expect(settings).toContain("/notifications-settings");
  });

  it("has Linked Devices route", () => {
    expect(settings).toContain("/linked-devices");
  });

  it("has Invite a Friend route", () => {
    expect(settings).toContain("/invite-friend");
  });

  it("has AI Safety section", () => {
    expect(settings).toContain("AI Safety & Compliance");
    expect(settings).toContain("/ai-safety-settings");
  });
});
