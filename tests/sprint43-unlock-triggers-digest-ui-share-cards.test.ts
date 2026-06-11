/**
 * Sprint 43 Tests
 * - Live unlock trigger integration (duel results + lesson completion)
 * - Digest preference settings UI
 * - Achievement share cards
 */
import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

const projectRoot = path.resolve(__dirname, "..");

describe("Sprint 43: Live Unlock Trigger Integration", () => {
  it("useAchievementUnlock hook exists with checkForUnlocks and dismissToast", () => {
    const hookPath = path.join(projectRoot, "hooks/use-achievement-unlock.ts");
    expect(fs.existsSync(hookPath)).toBe(true);
    const content = fs.readFileSync(hookPath, "utf-8");
    expect(content).toContain("export function useAchievementUnlock");
    expect(content).toContain("checkForUnlocks");
    expect(content).toContain("dismissToast");
    expect(content).toContain("toastData");
    expect(content).toContain("pendingUnlocks");
  });

  it("pronunciation-duel-results.tsx imports and uses useAchievementUnlock", () => {
    const filePath = path.join(projectRoot, "app/pronunciation-duel-results.tsx");
    expect(fs.existsSync(filePath)).toBe(true);
    const content = fs.readFileSync(filePath, "utf-8");
    expect(content).toContain("useAchievementUnlock");
    expect(content).toContain("AchievementUnlockToast");
    expect(content).toContain("checkForUnlocks");
    expect(content).toContain("dismissToast");
  });

  it("duel results triggers unlock check after match loads from game", () => {
    const filePath = path.join(projectRoot, "app/pronunciation-duel-results.tsx");
    const content = fs.readFileSync(filePath, "utf-8");
    // Should check for unlocks when latestMatch is set and fromGame param is present
    expect(content).toContain("params.fromGame");
    expect(content).toContain("checkForUnlocks()");
    expect(content).toContain("setTimeout");
  });

  it("lesson-player.tsx imports and uses useAchievementUnlock", () => {
    const filePath = path.join(projectRoot, "app/lesson-player.tsx");
    expect(fs.existsSync(filePath)).toBe(true);
    const content = fs.readFileSync(filePath, "utf-8");
    expect(content).toContain("useAchievementUnlock");
    expect(content).toContain("AchievementUnlockToast");
    expect(content).toContain("checkForUnlocks");
  });

  it("lesson-player triggers unlock check in handleComplete", () => {
    const filePath = path.join(projectRoot, "app/lesson-player.tsx");
    const content = fs.readFileSync(filePath, "utf-8");
    // Should trigger after lesson completion
    expect(content).toContain("handleComplete");
    expect(content).toContain("checkForUnlocks()");
    // Should have a delay to let the UI settle
    expect(content).toContain("setTimeout");
  });

  it("AchievementUnlockToast component is rendered in both screens", () => {
    const duelContent = fs.readFileSync(path.join(projectRoot, "app/pronunciation-duel-results.tsx"), "utf-8");
    const lessonContent = fs.readFileSync(path.join(projectRoot, "app/lesson-player.tsx"), "utf-8");
    expect(duelContent).toContain("<AchievementUnlockToast");
    expect(lessonContent).toContain("<AchievementUnlockToast");
  });
});

describe("Sprint 43: Digest Preference Settings UI", () => {
  it("notification-settings.tsx imports achievement digest functions", () => {
    const filePath = path.join(projectRoot, "app/notification-settings.tsx");
    expect(fs.existsSync(filePath)).toBe(true);
    const content = fs.readFileSync(filePath, "utf-8");
    expect(content).toContain("getAchievementDigestPrefs");
    expect(content).toContain("updateAndRescheduleDigest");
  });

  it("notification-settings has digest toggle state and handlers", () => {
    const filePath = path.join(projectRoot, "app/notification-settings.tsx");
    const content = fs.readFileSync(filePath, "utf-8");
    expect(content).toContain("digestEnabled");
    expect(content).toContain("digestDay");
    expect(content).toContain("digestHour");
    expect(content).toContain("handleDigestToggle");
    expect(content).toContain("handleDigestDayChange");
    expect(content).toContain("handleDigestTimeChange");
  });

  it("notification-settings renders Achievement Digest section with Switch", () => {
    const filePath = path.join(projectRoot, "app/notification-settings.tsx");
    const content = fs.readFileSync(filePath, "utf-8");
    expect(content).toContain("Achievement Digest");
    expect(content).toContain("Weekly summary of your achievements");
    expect(content).toContain("digestEnabled");
  });

  it("notification-settings has day of week picker with 7 days", () => {
    const filePath = path.join(projectRoot, "app/notification-settings.tsx");
    const content = fs.readFileSync(filePath, "utf-8");
    expect(content).toContain("DIGEST_DAYS");
    expect(content).toContain("Sun");
    expect(content).toContain("Mon");
    expect(content).toContain("Sat");
    expect(content).toContain("Day of week");
  });

  it("notification-settings has time picker with multiple options", () => {
    const filePath = path.join(projectRoot, "app/notification-settings.tsx");
    const content = fs.readFileSync(filePath, "utf-8");
    expect(content).toContain("DIGEST_TIMES");
    expect(content).toContain("8 AM");
    expect(content).toContain("11 AM");
    expect(content).toContain("8 PM");
  });

  it("digest settings are conditionally shown when enabled", () => {
    const filePath = path.join(projectRoot, "app/notification-settings.tsx");
    const content = fs.readFileSync(filePath, "utf-8");
    expect(content).toContain("digestEnabled && (");
    expect(content).toContain("digestSettings");
  });

  it("notification-settings loads prefs on mount with useEffect", () => {
    const filePath = path.join(projectRoot, "app/notification-settings.tsx");
    const content = fs.readFileSync(filePath, "utf-8");
    expect(content).toContain("useEffect");
    expect(content).toContain("getAchievementDigestPrefs");
  });
});

describe("Sprint 43: Achievement Share Cards", () => {
  it("achievement-share-card.ts library exists with core exports", () => {
    const filePath = path.join(projectRoot, "lib/achievement-share-card.ts");
    expect(fs.existsSync(filePath)).toBe(true);
    const content = fs.readFileSync(filePath, "utf-8");
    expect(content).toContain("export function generateShareCardData");
    expect(content).toContain("export function getShareCardStyle");
    expect(content).toContain("export function isShareEligible");
    expect(content).toContain("export async function shareAchievementCard");
    expect(content).toContain("export function generateTextShareCard");
    expect(content).toContain("export function getShareCardPreview");
  });

  it("share card has tier-specific styles for gold and diamond", () => {
    const filePath = path.join(projectRoot, "lib/achievement-share-card.ts");
    const content = fs.readFileSync(filePath, "utf-8");
    expect(content).toContain("gold:");
    expect(content).toContain("diamond:");
    expect(content).toContain("backgroundColor");
    expect(content).toContain("borderColor");
    expect(content).toContain("glowColor");
  });

  it("isShareEligible only allows gold and diamond tiers", () => {
    const filePath = path.join(projectRoot, "lib/achievement-share-card.ts");
    const content = fs.readFileSync(filePath, "utf-8");
    expect(content).toContain('event.tier === "gold" || event.tier === "diamond"');
  });

  it("share message includes celebration, tier, category, and deep link", () => {
    const filePath = path.join(projectRoot, "lib/achievement-share-card.ts");
    const content = fs.readFileSync(filePath, "utf-8");
    expect(content).toContain("CELEBRATION_MESSAGES");
    expect(content).toContain("tierLabel");
    expect(content).toContain("category");
    expect(content).toContain("APP_DEEP_LINK");
  });

  it("AchievementShareCard component exists with share button", () => {
    const filePath = path.join(projectRoot, "components/achievement-share-card.tsx");
    expect(fs.existsSync(filePath)).toBe(true);
    const content = fs.readFileSync(filePath, "utf-8");
    expect(content).toContain("export function AchievementShareCard");
    expect(content).toContain("Share Achievement");
    expect(content).toContain("shareAchievementCard");
  });

  it("share card component has animated glow effect", () => {
    const filePath = path.join(projectRoot, "components/achievement-share-card.tsx");
    const content = fs.readFileSync(filePath, "utf-8");
    expect(content).toContain("glowOpacity");
    expect(content).toContain("useAnimatedStyle");
    expect(content).toContain("withTiming");
  });

  it("share card component has dismiss and share callbacks", () => {
    const filePath = path.join(projectRoot, "components/achievement-share-card.tsx");
    const content = fs.readFileSync(filePath, "utf-8");
    expect(content).toContain("onDismiss");
    expect(content).toContain("onShared");
    expect(content).toContain("handleShare");
  });

  it("text share card generates ASCII art style card", () => {
    const filePath = path.join(projectRoot, "lib/achievement-share-card.ts");
    const content = fs.readFileSync(filePath, "utf-8");
    expect(content).toContain("ACHIEVEMENT UNLOCKED");
    expect(content).toContain("generateTextShareCard");
  });
});
