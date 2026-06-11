/**
 * Tests for new features batch:
 * - Admin access module
 * - Teacher texts engine
 * - Conversation history screen
 * - Student journal screen
 * - Surprise lesson screen
 * - Admin portal screen
 * - Onboarding guardrails
 * - Cultural food data
 */
import { describe, it, expect } from "vitest";
import { readFileSync, existsSync } from "fs";
import { join } from "path";

const root = join(__dirname, "..");

function readFile(relativePath: string): string {
  const fullPath = join(root, relativePath);
  if (!existsSync(fullPath)) throw new Error(`File not found: ${relativePath}`);
  return readFileSync(fullPath, "utf-8");
}

// ─── Admin Access Module ────────────────────────────────────────────────────
describe("Admin Access Module", () => {
  const content = readFile("lib/admin-access.ts");

  it("exports getAdminState function", () => {
    expect(content).toContain("export async function getAdminState");
  });

  it("exports activateAdminAccess function", () => {
    expect(content).toContain("export async function activateAdminAccess");
  });

  it("exports deactivateAdminAccess function", () => {
    expect(content).toContain("export async function deactivateAdminAccess");
  });

  it("exports canSkipOnboarding function", () => {
    expect(content).toContain("export async function canSkipOnboarding");
  });

  it("exports enforceOnboardingGuardrail function", () => {
    expect(content).toContain("export async function enforceOnboardingGuardrail");
  });

  it("exports isRealCostMode function", () => {
    expect(content).toContain("export async function isRealCostMode");
  });

  it("exports toggleOnboardingBypass function", () => {
    expect(content).toContain("export async function toggleOnboardingBypass");
  });

  it("exports toggleRealCostMode function", () => {
    expect(content).toContain("export async function toggleRealCostMode");
  });

  it("has admin PIN verification", () => {
    expect(content).toContain("DEFAULT_ADMIN_PIN");
  });

  it("sets enterprise subscription on activation", () => {
    expect(content).toContain('"@subscription_plan", "enterprise"');
  });

  it("resets to free on deactivation", () => {
    expect(content).toContain('"@subscription_plan", "free"');
  });

  it("checks onboarding_complete in guardrail", () => {
    expect(content).toContain("@onboarding_complete");
  });

  it("returns AdminState interface", () => {
    expect(content).toContain("export interface AdminState");
    expect(content).toContain("isAdmin: boolean");
    expect(content).toContain("canBypassOnboarding: boolean");
    expect(content).toContain("realCostMode: boolean");
  });
});

// ─── Onboarding Guardrails in _layout.tsx ───────────────────────────────────
describe("Onboarding Guardrails", () => {
  const layout = readFile("app/_layout.tsx");

  it("imports canSkipOnboarding from admin-access", () => {
    expect(layout).toContain('import { canSkipOnboarding } from "@/lib/admin-access"');
  });

  it("calls canSkipOnboarding before forcing onboarding", () => {
    expect(layout).toContain("const adminBypass = await canSkipOnboarding()");
  });

  it("marks onboarding complete for admin bypass", () => {
    expect(layout).toContain("Admin bypass");
    expect(layout).toContain('ONBOARDING_COMPLETE_KEY, "true"');
  });

  it("still forces onboarding for non-admin users", () => {
    expect(layout).toContain("Regular user must complete onboarding");
    expect(layout).toContain('router.replace("/onboarding"');
  });
});

// ─── Teacher Texts Engine ───────────────────────────────────────────────────
describe("Teacher Texts Engine", () => {
  const content = readFile("lib/teacher-texts-engine.ts");

  it("exports scheduleTeacherTexts function", () => {
    expect(content).toContain("export async function scheduleTeacherTexts");
  });

  it("exports cancelTeacherTextSchedule function", () => {
    expect(content).toContain("export async function cancelTeacherTextSchedule");
  });

  it("exports getTeacherTextHistory function", () => {
    expect(content).toContain("export async function getTeacherTextHistory");
  });

  it("exports saveTeacherText function", () => {
    expect(content).toContain("export async function saveTeacherText");
  });

  it("has shouldSendTeacherText function", () => {
    expect(content).toContain("export async function shouldSendTeacherText");
  });

  it("has generateAndDeliverTeacherText function", () => {
    expect(content).toContain("export async function generateAndDeliverTeacherText");
  });

  it("uses expo-notifications for scheduling", () => {
    expect(content).toContain("expo-notifications");
  });

  it("generates messages in target language context", () => {
    expect(content).toContain("@target_language");
  });
});

// ─── Student Journal Screen ─────────────────────────────────────────────────
describe("Student Journal Screen", () => {
  const content = readFile("app/student-journal.tsx");

  it("exists as a screen file", () => {
    expect(content.length).toBeGreaterThan(100);
  });

  it("uses ScreenContainer for layout", () => {
    expect(content).toContain("ScreenContainer");
  });

  it("has journal entry creation", () => {
    expect(content).toContain("TextInput");
  });

  it("stores entries in AsyncStorage", () => {
    expect(content).toContain("AsyncStorage");
  });

  it("has teacher correction feature", () => {
    expect(content).toContain("correct");
  });

  it("shows entries in a list", () => {
    expect(content).toContain("FlatList");
  });

  it("is registered in _layout.tsx", () => {
    const layout = readFile("app/_layout.tsx");
    expect(layout).toContain('name="student-journal"');
  });
});

// ─── Surprise Lesson Screen ─────────────────────────────────────────────────
describe("Surprise Lesson Screen", () => {
  const content = readFile("app/surprise-lesson.tsx");

  it("exists as a screen file", () => {
    expect(content.length).toBeGreaterThan(100);
  });

  it("uses ScreenContainer for layout", () => {
    expect(content).toContain("ScreenContainer");
  });

  it("generates culture-based lessons", () => {
    expect(content).toContain("culture");
  });

  it("has trending topic integration", () => {
    expect(content).toContain("trend");
  });

  it("is registered in _layout.tsx", () => {
    const layout = readFile("app/_layout.tsx");
    expect(layout).toContain('name="surprise-lesson"');
  });
});

// ─── Conversation History Screen ────────────────────────────────────────────
describe("Conversation History Screen", () => {
  const content = readFile("app/conversation-history.tsx");

  it("exists as a screen file", () => {
    expect(content.length).toBeGreaterThan(100);
  });

  it("uses ScreenContainer for layout", () => {
    expect(content).toContain("ScreenContainer");
  });

  it("has search functionality", () => {
    expect(content).toContain("searchQuery");
    expect(content).toContain("TextInput");
  });

  it("has filter by conversation mode", () => {
    expect(content).toContain("filterMode");
    expect(content).toContain("therapist");
    expect(content).toContain("coach");
    expect(content).toContain("motivator");
  });

  it("groups messages into threads", () => {
    expect(content).toContain("ConversationThread");
    expect(content).toContain("groupIntoThreads");
  });

  it("has expandable thread view", () => {
    expect(content).toContain("expandedThread");
  });

  it("has clear history option", () => {
    expect(content).toContain("clearHistory");
  });

  it("is registered in _layout.tsx", () => {
    const layout = readFile("app/_layout.tsx");
    expect(layout).toContain('name="conversation-history"');
  });
});

// ─── Admin Portal Screen ────────────────────────────────────────────────────
describe("Admin Portal Screen", () => {
  const content = readFile("app/admin-portal.tsx");

  it("exists as a screen file", () => {
    expect(content.length).toBeGreaterThan(100);
  });

  it("imports admin-access module", () => {
    expect(content).toContain("@/lib/admin-access");
  });

  it("has PIN entry for activation", () => {
    expect(content).toContain("handleActivate");
    expect(content).toContain("secureTextEntry");
  });

  it("has deactivation option", () => {
    expect(content).toContain("handleDeactivate");
    expect(content).toContain("Deactivate Admin");
  });

  it("shows onboarding bypass toggle", () => {
    expect(content).toContain("Onboarding Bypass");
    expect(content).toContain("handleToggleBypass");
  });

  it("shows real-cost mode toggle", () => {
    expect(content).toContain("Real-Cost Mode");
    expect(content).toContain("handleToggleRealCost");
  });

  it("shows enterprise subscription level", () => {
    expect(content).toContain("Enterprise");
  });

  it("displays guardrail information", () => {
    expect(content).toContain("Onboarding Guardrail");
    expect(content).toContain("regular users MUST complete onboarding");
  });

  it("is registered in _layout.tsx", () => {
    const layout = readFile("app/_layout.tsx");
    expect(layout).toContain('name="admin-portal"');
  });
});

// ─── Voice Settings Upgrade ─────────────────────────────────────────────────
describe("Voice Settings Upgrade", () => {
  const content = readFile("app/voice-settings.tsx");

  it("has coaching style preferences", () => {
    expect(content).toContain("coaching");
  });

  it("has multiple tabs", () => {
    expect(content).toContain("Voice");
  });

  it("has check-in scheduling", () => {
    expect(content).toContain("check");
  });
});

// ─── Cultural Food Data ─────────────────────────────────────────────────────
describe("Cultural Food Data", () => {
  const content = readFile("lib/cultural-knowledge.ts");

  it("includes Locrio de Chuleta con Maíz", () => {
    expect(content).toContain("Locrio de Chuleta");
  });

  it("includes Locrio de Pollo", () => {
    expect(content).toContain("Locrio de Pollo");
  });

  it("includes Sancocho", () => {
    expect(content).toContain("Sancocho");
  });

  it("includes Mofongo", () => {
    expect(content).toContain("Mofongo");
  });

  it("includes Habichuelas con Dulce", () => {
    expect(content).toContain("Habichuelas con Dulce");
  });
});

// ─── Settings Integration ───────────────────────────────────────────────────
describe("Settings Integration", () => {
  const content = readFile("app/settings.tsx");

  it("has Wave Cloud Companion section", () => {
    expect(content).toContain("Wave Cloud Companion");
  });

  it("links to Conversation History", () => {
    expect(content).toContain("/conversation-history");
  });

  it("links to Student Journal", () => {
    expect(content).toContain("/student-journal");
  });

  it("links to Surprise Lessons", () => {
    expect(content).toContain("/surprise-lesson");
  });

  it("links to Voice & Coaching Settings", () => {
    expect(content).toContain("/voice-settings");
  });

  it("links to Admin Access Portal", () => {
    expect(content).toContain("Admin Access Portal");
    expect(content).toContain("/admin-portal");
  });
});

// ─── Server Endpoints ───────────────────────────────────────────────────────
describe("Server Endpoints", () => {
  const content = readFile("server/waveCloudChatRouter.ts");

  it("has generateTeacherText endpoint", () => {
    expect(content).toContain("generateTeacherText");
  });

  it("has generateSurpriseLesson endpoint", () => {
    expect(content).toContain("generateSurpriseLesson");
  });

  it("has correctJournalEntry endpoint", () => {
    expect(content).toContain("correctJournalEntry");
  });
});
