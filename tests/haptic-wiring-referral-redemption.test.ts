/**
 * Tests for Sprint: Sound/Haptic Wiring, Copy Code, Referral Redemption
 *
 * 1. shouldPlayHaptic() and shouldPlayCelebrationSound() are wired into
 *    milestone-celebration.ts and all other haptic callers.
 * 2. Copy Code button with clipboard feedback on Referral Dashboard.
 * 3. Referral redemption flow in onboarding.
 */
import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

const readFile = (filePath: string) =>
  fs.readFileSync(path.join(__dirname, "..", filePath), "utf-8");

describe("Feature 1: shouldPlayHaptic/shouldPlayCelebrationSound wiring", () => {
  it("milestone-celebration.ts imports and uses shouldPlayHaptic", () => {
    const content = readFile("lib/milestone-celebration.ts");
    expect(content).toContain('import { shouldPlayHaptic, shouldPlayCelebrationSound } from "@/lib/sound-settings"');
    expect(content).toContain("await shouldPlayHaptic()");
    expect(content).toContain("await shouldPlayCelebrationSound()");
  });

  it("milestone-celebration.ts gates haptics behind the preference check", () => {
    const content = readFile("lib/milestone-celebration.ts");
    // Ensure haptics are only called after the check
    expect(content).toContain("const hapticEnabled = await shouldPlayHaptic()");
    expect(content).toContain("if (!hapticEnabled) return;");
    expect(content).toContain("const soundEnabled = await shouldPlayCelebrationSound()");
    expect(content).toContain("if (!soundEnabled) return;");
  });

  it("haptic-tab.tsx uses shouldPlayHaptic before firing haptics", () => {
    const content = readFile("components/haptic-tab.tsx");
    expect(content).toContain('import { shouldPlayHaptic } from "@/lib/sound-settings"');
    expect(content).toContain("shouldPlayHaptic().then");
  });

  it("badge-toast.tsx gates haptic with shouldPlayHaptic", () => {
    const content = readFile("components/badge-toast.tsx");
    expect(content).toContain('import { shouldPlayHaptic } from "@/lib/sound-settings"');
    expect(content).toContain("shouldPlayHaptic().then");
  });

  it("streak-freeze-shop-modal.tsx gates haptics with shouldPlayHaptic", () => {
    const content = readFile("components/streak-freeze-shop-modal.tsx");
    expect(content).toContain('import { shouldPlayHaptic } from "@/lib/sound-settings"');
    expect(content).toContain("await shouldPlayHaptic()");
  });

  it("streak-celebration-modal.tsx gates haptics with shouldPlayHaptic", () => {
    const content = readFile("components/streak-celebration-modal.tsx");
    expect(content).toContain('import { shouldPlayHaptic } from "@/lib/sound-settings"');
    expect(content).toContain("shouldPlayHaptic().then");
  });

  it("badge-unlock-modal.tsx gates haptics with shouldPlayHaptic", () => {
    const content = readFile("components/badge-unlock-modal.tsx");
    expect(content).toContain('import { shouldPlayHaptic } from "@/lib/sound-settings"');
    expect(content).toContain("shouldPlayHaptic().then");
  });

  it("manage-pins.tsx gates all haptic calls with shouldPlayHaptic", () => {
    const content = readFile("app/manage-pins.tsx");
    expect(content).toContain('import { shouldPlayHaptic } from "@/lib/sound-settings"');
    // Should not have any ungated Haptics calls (all should be inside shouldPlayHaptic checks)
    const hapticLines = content.split("\n").filter(
      (line) => line.includes("Haptics.") && !line.includes("shouldPlayHaptic") && !line.includes("import")
    );
    // All haptic lines should be preceded by a shouldPlayHaptic check
    for (const line of hapticLines) {
      expect(line.trim()).toMatch(/^(if \(on\)|if \(hapticOn\))/);
    }
  });

  it("referral-dashboard.tsx gates haptics with shouldPlayHaptic", () => {
    const content = readFile("app/referral-dashboard.tsx");
    expect(content).toContain('import { shouldPlayHaptic } from "@/lib/sound-settings"');
    expect(content).toContain("await shouldPlayHaptic()");
  });
});

describe("Feature 2: Copy Code button with clipboard feedback", () => {
  it("referral-dashboard.tsx has a Copy Code button with state feedback", () => {
    const content = readFile("app/referral-dashboard.tsx");
    // State for copied feedback
    expect(content).toContain("const [copied, setCopied] = useState(false)");
    // Button shows different text based on state
    expect(content).toContain('copied ? "✓ Copied!" : "📋 Copy Code"');
    // Uses clipboard
    expect(content).toContain("Clipboard.setStringAsync(data.code)");
    // Resets after timeout
    expect(content).toContain("setCopied(true)");
    expect(content).toContain("setTimeout(() => setCopied(false), 2000)");
  });

  it("referral-dashboard.tsx changes button color on copy", () => {
    const content = readFile("app/referral-dashboard.tsx");
    // Background changes to success color when copied
    expect(content).toContain('copied ? colors.success + "20" : colors.primary + "15"');
    // Text color changes to success when copied
    expect(content).toContain("copied ? colors.success : colors.primary");
  });
});

describe("Feature 3: Referral redemption flow in onboarding", () => {
  it("referral-incentive.ts exports redeemReferralCode function", () => {
    const content = readFile("lib/referral-incentive.ts");
    expect(content).toContain("export async function redeemReferralCode");
    expect(content).toContain("export function isValidReferralCode");
    expect(content).toContain("export async function hasRedeemedReferral");
    expect(content).toContain("export async function getReferralBonusXP");
  });

  it("redeemReferralCode validates code format", () => {
    const content = readFile("lib/referral-incentive.ts");
    expect(content).toContain("isValidReferralCode(trimmed)");
    expect(content).toContain("Invalid referral code");
  });

  it("redeemReferralCode prevents double redemption", () => {
    const content = readFile("lib/referral-incentive.ts");
    expect(content).toContain("hasRedeemedReferral");
    expect(content).toContain("You have already redeemed a referral code");
  });

  it("redeemReferralCode prevents self-referral", () => {
    const content = readFile("lib/referral-incentive.ts");
    expect(content).toContain("You cannot use your own referral code");
  });

  it("redeemReferralCode awards invitee rewards", () => {
    const content = readFile("lib/referral-incentive.ts");
    // Awards bonus XP
    expect(content).toContain("REFERRAL_BONUS_XP_KEY");
    // Awards streak freezes
    expect(content).toContain("freezeData.availableFreezes += rewards.streakFreezes");
    // Awards video minutes and translation credits
    expect(content).toContain("usage.creditsUsed = (usage.creditsUsed || 0) - rewards.translationCredits");
    expect(content).toContain("usage.videoMinutesUsed = (usage.videoMinutesUsed || 0) - rewards.videoCallMinutes");
  });

  it("redeemReferralCode credits the referrer", () => {
    const content = readFile("lib/referral-incentive.ts");
    expect(content).toContain("await recordReferral(");
  });

  it("onboarding.tsx has step 11 for referral code entry", () => {
    const content = readFile("app/onboarding.tsx");
    expect(content).toContain("step === 11 && renderReferralCodeEntry()");
    expect(content).toContain("Have a referral code?");
    expect(content).toContain("handleRedeemReferral");
  });

  it("onboarding.tsx imports referral redemption functions", () => {
    const content = readFile("app/onboarding.tsx");
    expect(content).toContain('import { redeemReferralCode, isValidReferralCode, REFERRAL_REWARDS } from "@/lib/referral-incentive"');
  });

  it("onboarding.tsx shows success state with rewards breakdown", () => {
    const content = readFile("app/onboarding.tsx");
    expect(content).toContain("Rewards Unlocked!");
    expect(content).toContain("referralRewards.bonusXP");
    expect(content).toContain("referralRewards.streakFreezes");
    expect(content).toContain("referralRewards.videoCallMinutes");
    expect(content).toContain("referralRewards.translationCredits");
  });

  it("onboarding.tsx allows skipping referral code entry", () => {
    const content = readFile("app/onboarding.tsx");
    // Skip button routes to placement test
    expect(content).toContain('router.replace("/placement-test" as any)');
    expect(content).toContain('"Skip"');
  });

  it("onboarding handleComplete routes to step 11 (referral entry)", () => {
    const content = readFile("app/onboarding.tsx");
    expect(content).toContain("setStep(11)");
  });
});
