/**
 * Onboarding Flow Smoke Test
 *
 * Validates the full onboarding sequence exists and is correctly wired:
 * - Welcome slides (steps 0-2)
 * - Native language selection (step 3)
 * - Target language selection (step 4)
 * - Dialect picker (step 5)
 * - Level selection (step 6)
 * - Schedule setup (step 7)
 * - Feature tour (step 8)
 * - Completion → navigation to home
 */
import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

const ROOT = path.resolve(__dirname, "..");

describe("Onboarding Flow - Full Sequence Validation", () => {
  const onboardingPath = path.join(ROOT, "app/onboarding.tsx");
  const onboardingContent = fs.readFileSync(onboardingPath, "utf-8");

  it("onboarding.tsx exists", () => {
    expect(fs.existsSync(onboardingPath)).toBe(true);
  });

  // ─── Step Structure ────────────────────────────────────────────────
  it("defines step state starting at 0", () => {
    expect(onboardingContent).toContain("const [step, setStep] = useState(0)");
  });

  it("documents all 9 steps (0-8) in comments", () => {
    expect(onboardingContent).toContain("Steps: 0-2 = welcome slides, 2.5 = quick-pick");
  });

  // ─── Welcome Slides (Steps 0-2) ───────────────────────────────────
  it("has WELCOME_SLIDES array with at least 3 slides", () => {
    expect(onboardingContent).toContain("WELCOME_SLIDES");
    // Check for multiple slide objects
    const slideMatches = onboardingContent.match(/title:\s*"/g);
    expect(slideMatches).not.toBeNull();
    expect(slideMatches!.length).toBeGreaterThanOrEqual(3);
  });

  // ─── Native Language Selection (Step 3) ────────────────────────────
  it("renders native language selection at step 3", () => {
    expect(onboardingContent).toContain("step === 3 && renderNativeLanguageSelection()");
  });

  it("tracks nativeLanguage state", () => {
    expect(onboardingContent).toContain("nativeLanguage");
    expect(onboardingContent).toContain("setNativeLanguage");
  });

  // ─── Target Language Selection (Step 4) ────────────────────────────
  it("renders target language selection at step 4", () => {
    expect(onboardingContent).toContain("step === 4 && renderTargetLanguageSelection()");
  });

  it("tracks targetLanguage state", () => {
    expect(onboardingContent).toContain("targetLanguage");
  });

  // ─── Dialect Picker (Step 5) ───────────────────────────────────────
  it("defines dialect options with regions", () => {
    expect(onboardingContent).toContain("dialects");
    expect(onboardingContent).toContain("DialectOption");
  });

  it("has dialect preview audio functionality", () => {
    expect(onboardingContent).toContain("playDialectPreview");
    expect(onboardingContent).toContain("DIALECT_PREVIEW_PHRASES");
  });

  it("tracks targetDialect state", () => {
    expect(onboardingContent).toContain("targetDialect");
  });

  // ─── Level Selection (Step 6) ──────────────────────────────────────
  it("renders level selection at step 6", () => {
    expect(onboardingContent).toContain("step === 6 && renderLevelSelection()");
  });

  it("tracks proficiency level state", () => {
    expect(onboardingContent).toContain("level");
    expect(onboardingContent).toContain("setLevel");
  });

  // ─── Schedule Setup (Step 7) ───────────────────────────────────────
  it("renders schedule setup at step 7", () => {
    expect(onboardingContent).toContain("step === 7 && renderScheduleSetup()");
  });

  it("tracks schedule preferences (days, minutes, time)", () => {
    expect(onboardingContent).toContain("daysPerWeek");
    expect(onboardingContent).toContain("minutesPerDay");
    expect(onboardingContent).toContain("preferredTime");
  });

  // ─── Feature Tour (Step 8) ─────────────────────────────────────────
  it("renders feature tour at step 8", () => {
    expect(onboardingContent).toContain("step === 8 && renderFeatureTour()");
  });

  // ─── Completion Flow ───────────────────────────────────────────────
  it("has handleComplete function", () => {
    expect(onboardingContent).toContain("const handleComplete = async ()");
  });

  it("saves onboarding_complete flag to AsyncStorage", () => {
    expect(onboardingContent).toContain('AsyncStorage.setItem("@onboarding_complete", "true")');
  });

  it("saves native language preference", () => {
    expect(onboardingContent).toContain('AsyncStorage.setItem("@native_language"');
  });

  it("saves target language/dialect preference", () => {
    expect(onboardingContent).toContain('AsyncStorage.setItem("@target_language"');
  });

  it("saves proficiency level", () => {
    expect(onboardingContent).toContain('AsyncStorage.setItem("@proficiency_level"');
  });

  it("saves learning schedule", () => {
    expect(onboardingContent).toContain('AsyncStorage.setItem("@learning_schedule"');
  });

  it("flags methodology recommendation for first home visit", () => {
    expect(onboardingContent).toContain('AsyncStorage.setItem("@show_methodology_recommendation", "true")');
  });

  it("navigates to home tabs after completion", () => {
    expect(onboardingContent).toContain('router.replace("/(tabs)/');
  });

  it("triggers success haptic on completion", () => {
    expect(onboardingContent).toContain("Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)");
  });

  // ─── Root Layout Integration ───────────────────────────────────────
  const rootLayoutPath = path.join(ROOT, "app/_layout.tsx");
  const rootLayoutContent = fs.readFileSync(rootLayoutPath, "utf-8");

  it("root layout checks onboarding_complete flag", () => {
    expect(rootLayoutContent).toContain("@onboarding_complete");
  });

  it("root layout redirects to /onboarding if not completed", () => {
    expect(rootLayoutContent).toContain('router.replace("/onboarding"');
  });

  it("root layout registers onboarding as a Stack.Screen", () => {
    expect(rootLayoutContent).toContain('name="onboarding"');
  });

  // ─── Methodology Recommendation Wiring ─────────────────────────────
  it("home screen checks for methodology recommendation flag", () => {
    const homeContent = fs.readFileSync(path.join(ROOT, "app/(tabs)/index.tsx"), "utf-8");
    expect(homeContent).toContain("@show_methodology_recommendation");
  });
});
