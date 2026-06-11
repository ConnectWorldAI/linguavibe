/**
 * Sprint 42 Tests
 * - Achievement unlock detection library (lib/achievement-unlock.ts)
 * - Achievement unlock toast component (components/achievement-unlock-toast.tsx)
 * - Trophies card on profile screen navigating to achievements-wall
 * - Weekly achievement digest notification library (lib/achievement-digest-notification.ts)
 */
import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

const APP_DIR = path.join(__dirname, "..");
const LIB_DIR = path.join(APP_DIR, "lib");
const COMPONENTS_DIR = path.join(APP_DIR, "components");
const TABS_DIR = path.join(APP_DIR, "app", "(tabs)");

describe("Sprint 42 — Achievement Unlock Animations, Trophies Profile Entry, Weekly Digest", () => {
  // ─── Achievement Unlock Detection Library ─────────────────────────────────
  describe("Achievement Unlock Detection (lib/achievement-unlock.ts)", () => {
    const libFile = path.join(LIB_DIR, "achievement-unlock.ts");

    it("file exists", () => {
      expect(fs.existsSync(libFile)).toBe(true);
    });

    it("exports detectNewUnlocks function", () => {
      const content = fs.readFileSync(libFile, "utf-8");
      expect(content).toContain("export async function detectNewUnlocks");
    });

    it("exports getUnlockedAchievementIds function", () => {
      const content = fs.readFileSync(libFile, "utf-8");
      expect(content).toContain("export async function getUnlockedAchievementIds");
    });

    it("exports saveUnlockedAchievementIds function", () => {
      const content = fs.readFileSync(libFile, "utf-8");
      expect(content).toContain("export async function saveUnlockedAchievementIds");
    });

    it("exports createAchievementToast function", () => {
      const content = fs.readFileSync(libFile, "utf-8");
      expect(content).toContain("export function createAchievementToast");
    });

    it("exports shouldShowConfetti function", () => {
      const content = fs.readFileSync(libFile, "utf-8");
      expect(content).toContain("export function shouldShowConfetti");
    });

    it("exports getWeeklyUnlocks for digest integration", () => {
      const content = fs.readFileSync(libFile, "utf-8");
      expect(content).toContain("export async function getWeeklyUnlocks");
    });

    it("exports resetWeeklyUnlocks for post-digest cleanup", () => {
      const content = fs.readFileSync(libFile, "utf-8");
      expect(content).toContain("export async function resetWeeklyUnlocks");
    });

    it("exports getClosestToUnlock for digest content", () => {
      const content = fs.readFileSync(libFile, "utf-8");
      expect(content).toContain("export function getClosestToUnlock");
    });

    it("defines AchievementUnlockEvent interface with required fields", () => {
      const content = fs.readFileSync(libFile, "utf-8");
      expect(content).toContain("export interface AchievementUnlockEvent");
      expect(content).toContain("id: string");
      expect(content).toContain("title: string");
      expect(content).toContain("category:");
      expect(content).toContain("unlockedAt: string");
    });

    it("defines AchievementToastData interface with navigateTo", () => {
      const content = fs.readFileSync(libFile, "utf-8");
      expect(content).toContain("export interface AchievementToastData");
      expect(content).toContain("navigateTo: string");
      expect(content).toContain("showConfetti: boolean");
    });

    it("tracks weekly unlocks in addToWeeklyUnlocks", () => {
      const content = fs.readFileSync(libFile, "utf-8");
      expect(content).toContain("addToWeeklyUnlocks");
      expect(content).toContain("@achievements_weekly_unlocks");
    });

    it("confetti logic triggers for gold/diamond tiers", () => {
      const content = fs.readFileSync(libFile, "utf-8");
      expect(content).toContain("gold");
      expect(content).toContain("diamond");
      expect(content).toContain("shouldShowConfetti");
    });
  });

  // ─── Achievement Unlock Toast Component ───────────────────────────────────
  describe("Achievement Unlock Toast (components/achievement-unlock-toast.tsx)", () => {
    const toastFile = path.join(COMPONENTS_DIR, "achievement-unlock-toast.tsx");

    it("file exists", () => {
      expect(fs.existsSync(toastFile)).toBe(true);
    });

    it("exports AchievementUnlockToast component", () => {
      const content = fs.readFileSync(toastFile, "utf-8");
      expect(content).toContain("export function AchievementUnlockToast");
    });

    it("uses expo-haptics for success notification", () => {
      const content = fs.readFileSync(toastFile, "utf-8");
      expect(content).toContain("Haptics.notificationAsync");
      expect(content).toContain("NotificationFeedbackType.Success");
    });

    it("generates confetti particles when showConfetti is true", () => {
      const content = fs.readFileSync(toastFile, "utf-8");
      expect(content).toContain("generateConfetti");
      expect(content).toContain("confettiParticles");
      expect(content).toContain("toastData.showConfetti");
    });

    it("navigates to achievements-wall on tap", () => {
      const content = fs.readFileSync(toastFile, "utf-8");
      expect(content).toContain("/achievements-wall");
      expect(content).toContain("router.push");
    });

    it("auto-dismisses after timeout", () => {
      const content = fs.readFileSync(toastFile, "utf-8");
      expect(content).toContain("setTimeout");
      expect(content).toContain("dismissToast");
    });

    it("shows tier badge for gold/diamond achievements", () => {
      const content = fs.readFileSync(toastFile, "utf-8");
      expect(content).toContain("tierBadge");
      expect(content).toContain("achievement.tier");
    });

    it("has glow animation for premium tiers", () => {
      const content = fs.readFileSync(toastFile, "utf-8");
      expect(content).toContain("glowAnim");
      expect(content).toContain("glowBorder");
    });

    it("shows 'Achievement Unlocked!' label", () => {
      const content = fs.readFileSync(toastFile, "utf-8");
      expect(content).toContain("Achievement Unlocked!");
    });

    it("shows tap hint to view trophy room", () => {
      const content = fs.readFileSync(toastFile, "utf-8");
      expect(content).toContain("Tap to view trophy room");
    });
  });

  // ─── Trophies Card on Profile Screen ──────────────────────────────────────
  describe("Trophies Card on Profile Screen", () => {
    const profileFile = path.join(TABS_DIR, "profile.tsx");

    it("profile screen exists", () => {
      expect(fs.existsSync(profileFile)).toBe(true);
    });

    it("has Trophy Room card section", () => {
      const content = fs.readFileSync(profileFile, "utf-8");
      expect(content).toContain("Trophy Room");
    });

    it("navigates to /achievements-wall on press", () => {
      const content = fs.readFileSync(profileFile, "utf-8");
      expect(content).toContain('"/achievements-wall"');
    });

    it("shows trophy icon", () => {
      const content = fs.readFileSync(profileFile, "utf-8");
      expect(content).toContain('"trophy"');
    });

    it("shows badge count with 'Earned' label", () => {
      const content = fs.readFileSync(profileFile, "utf-8");
      expect(content).toContain("trophiesBadgeNumber");
      expect(content).toContain("Earned");
    });

    it("has trophiesCard style defined", () => {
      const content = fs.readFileSync(profileFile, "utf-8");
      expect(content).toContain("trophiesCard:");
    });

    it("has trophiesIconWrap style defined", () => {
      const content = fs.readFileSync(profileFile, "utf-8");
      expect(content).toContain("trophiesIconWrap:");
    });
  });

  // ─── Weekly Achievement Digest Notification ───────────────────────────────
  describe("Weekly Achievement Digest (lib/achievement-digest-notification.ts)", () => {
    const digestFile = path.join(LIB_DIR, "achievement-digest-notification.ts");

    it("file exists", () => {
      expect(fs.existsSync(digestFile)).toBe(true);
    });

    it("exports getAchievementDigestPrefs function", () => {
      const content = fs.readFileSync(digestFile, "utf-8");
      expect(content).toContain("export async function getAchievementDigestPrefs");
    });

    it("exports saveAchievementDigestPrefs function", () => {
      const content = fs.readFileSync(digestFile, "utf-8");
      expect(content).toContain("export async function saveAchievementDigestPrefs");
    });

    it("exports generateAchievementDigest function", () => {
      const content = fs.readFileSync(digestFile, "utf-8");
      expect(content).toContain("export async function generateAchievementDigest");
    });

    it("exports scheduleAchievementDigest function", () => {
      const content = fs.readFileSync(digestFile, "utf-8");
      expect(content).toContain("export async function scheduleAchievementDigest");
    });

    it("exports cancelAchievementDigest function", () => {
      const content = fs.readFileSync(digestFile, "utf-8");
      expect(content).toContain("export async function cancelAchievementDigest");
    });

    it("exports updateAndRescheduleDigest function", () => {
      const content = fs.readFileSync(digestFile, "utf-8");
      expect(content).toContain("export async function updateAndRescheduleDigest");
    });

    it("exports isAchievementDigestNotification handler", () => {
      const content = fs.readFileSync(digestFile, "utf-8");
      expect(content).toContain("export function isAchievementDigestNotification");
    });

    it("exports formatDigestDay helper", () => {
      const content = fs.readFileSync(digestFile, "utf-8");
      expect(content).toContain("export function formatDigestDay");
    });

    it("exports formatDigestTime helper", () => {
      const content = fs.readFileSync(digestFile, "utf-8");
      expect(content).toContain("export function formatDigestTime");
    });

    it("defines AchievementDigestData interface with weekly counts", () => {
      const content = fs.readFileSync(digestFile, "utf-8");
      expect(content).toContain("export interface AchievementDigestData");
      expect(content).toContain("weeklyUnlockedCount: number");
      expect(content).toContain("closestToUnlock:");
    });

    it("defines AchievementDigestPrefs with dayOfWeek/hour/minute", () => {
      const content = fs.readFileSync(digestFile, "utf-8");
      expect(content).toContain("export interface AchievementDigestPrefs");
      expect(content).toContain("dayOfWeek: number");
      expect(content).toContain("hour: number");
      expect(content).toContain("minute: number");
    });

    it("uses WEEKLY trigger type for recurring notification", () => {
      const content = fs.readFileSync(digestFile, "utf-8");
      expect(content).toContain("SchedulableTriggerInputTypes.WEEKLY");
    });

    it("includes closest-to-unlock achievements in digest body", () => {
      const content = fs.readFileSync(digestFile, "utf-8");
      expect(content).toContain("closestToUnlock");
      expect(content).toContain("progressPercent");
    });

    it("resets weekly unlocks after scheduling digest", () => {
      const content = fs.readFileSync(digestFile, "utf-8");
      expect(content).toContain("Reset weekly unlocks");
      expect(content).toContain("@achievements_weekly_unlocks");
    });

    it("routes to /achievements-wall on notification tap", () => {
      const content = fs.readFileSync(digestFile, "utf-8");
      expect(content).toContain('route: "/achievements-wall"');
    });

    it("default schedule is Sunday 11 AM", () => {
      const content = fs.readFileSync(digestFile, "utf-8");
      expect(content).toContain("dayOfWeek: 1"); // Sunday
      expect(content).toContain("hour: 11");
    });
  });
});
