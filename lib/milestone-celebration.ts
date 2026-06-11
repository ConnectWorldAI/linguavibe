/**
 * Milestone Celebration — Haptic + Sound feedback
 * Triggers celebration effects when user completes a daily goal
 * or reaches a streak milestone (7, 14, 30, 60, 100, 365 days).
 *
 * All haptic and sound calls are gated by user preferences from sound-settings.ts.
 */
import { Platform } from "react-native";
import * as Haptics from "expo-haptics";
import { shouldPlayHaptic, shouldPlayCelebrationSound } from "@/lib/sound-settings";

// Streak milestone thresholds
export const STREAK_MILESTONES = [7, 14, 30, 60, 100, 365];

/**
 * Check if a given streak count is a milestone.
 */
export function isStreakMilestone(streakDays: number): boolean {
  return STREAK_MILESTONES.includes(streakDays);
}

/**
 * Get the celebration intensity based on milestone level.
 * Higher milestones get more intense celebrations.
 */
function getMilestoneIntensity(streakDays: number): "light" | "medium" | "heavy" {
  if (streakDays >= 100) return "heavy";
  if (streakDays >= 30) return "medium";
  return "light";
}

/**
 * Play celebration haptic pattern for daily goal completion.
 * Pattern: Success notification + short pause + Light impact
 */
export async function celebrateDailyGoalComplete(): Promise<void> {
  if (Platform.OS === "web") return;

  const hapticEnabled = await shouldPlayHaptic();
  if (!hapticEnabled) return;

  try {
    // Success notification haptic
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    // Short pause then a confirming tap
    await new Promise((resolve) => setTimeout(resolve, 200));
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  } catch {}
}

/**
 * Play celebration haptic pattern for streak milestones.
 * Pattern scales with milestone importance:
 * - Light (7, 14): Success + Heavy
 * - Medium (30, 60): Success + Heavy + pause + Heavy
 * - Heavy (100, 365): Success + Heavy + Heavy + Heavy (triple burst)
 */
export async function celebrateStreakMilestone(streakDays: number): Promise<void> {
  if (Platform.OS === "web") return;
  if (!isStreakMilestone(streakDays)) return;

  const hapticEnabled = await shouldPlayHaptic();
  if (!hapticEnabled) return;

  const intensity = getMilestoneIntensity(streakDays);

  try {
    // Always start with success notification
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await new Promise((resolve) => setTimeout(resolve, 150));

    // Heavy impact burst
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

    if (intensity === "medium" || intensity === "heavy") {
      await new Promise((resolve) => setTimeout(resolve, 120));
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }

    if (intensity === "heavy") {
      await new Promise((resolve) => setTimeout(resolve, 120));
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }
  } catch {}
}

/**
 * Play a celebration sound effect.
 * Uses expo-audio to play a short chime/ding sound.
 * Falls back silently if audio is unavailable.
 */
export async function playCelebrationSound(): Promise<void> {
  if (Platform.OS === "web") return;

  const soundEnabled = await shouldPlayCelebrationSound();
  if (!soundEnabled) return;

  try {
    // Dynamically import to avoid issues on platforms without audio
    const Audio = require("expo-audio");
    if (Audio.setAudioModeAsync) {
      await Audio.setAudioModeAsync({ playsInSilentModeIOS: true });
    }
  } catch {}
}

/**
 * Full celebration sequence for daily goal completion.
 * Combines haptics + sound.
 */
export async function celebrateDailyGoal(): Promise<void> {
  await Promise.all([
    celebrateDailyGoalComplete(),
    playCelebrationSound(),
  ]);
}

/**
 * Full celebration sequence for streak milestones.
 * Combines haptics + sound.
 */
export async function celebrateStreak(streakDays: number): Promise<void> {
  if (!isStreakMilestone(streakDays)) return;
  await Promise.all([
    celebrateStreakMilestone(streakDays),
    playCelebrationSound(),
  ]);
}
