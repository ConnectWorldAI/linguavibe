/**
 * Store Review Prompt — triggers after 7th completed lesson.
 *
 * Uses expo-store-review to show the native in-app review dialog.
 * Guards:
 *   1. Only triggers once (flag stored in AsyncStorage).
 *   2. Only triggers on native platforms (iOS/Android).
 *   3. Checks StoreReview.isAvailableAsync() before calling.
 */
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const REVIEW_SHOWN_KEY = "@store_review_shown";
const LESSON_COUNT_KEY = "@total_lessons_completed";
const REVIEW_THRESHOLD = 7;

/**
 * Increment the total lesson completion counter and return the new count.
 */
export async function incrementLessonCount(): Promise<number> {
  const raw = await AsyncStorage.getItem(LESSON_COUNT_KEY);
  const current = raw ? parseInt(raw, 10) : 0;
  const next = current + 1;
  await AsyncStorage.setItem(LESSON_COUNT_KEY, String(next));
  return next;
}

/**
 * Get the current total lesson completion count.
 */
export async function getLessonCount(): Promise<number> {
  const raw = await AsyncStorage.getItem(LESSON_COUNT_KEY);
  return raw ? parseInt(raw, 10) : 0;
}

/**
 * Attempt to show the store review prompt if the user has completed
 * at least REVIEW_THRESHOLD lessons and hasn't been prompted before.
 *
 * Call this after every lesson completion (inside handleComplete).
 */
export async function maybeRequestStoreReview(): Promise<void> {
  // Only on native
  if (Platform.OS === "web") return;

  // Check if already shown
  const alreadyShown = await AsyncStorage.getItem(REVIEW_SHOWN_KEY);
  if (alreadyShown === "true") return;

  // Check lesson count
  const count = await getLessonCount();
  if (count < REVIEW_THRESHOLD) return;

  try {
    // Dynamic import to avoid bundling issues on web
    const StoreReview = await import("expo-store-review");
    const isAvailable = await StoreReview.isAvailableAsync();
    if (isAvailable) {
      await StoreReview.requestReview();
      await AsyncStorage.setItem(REVIEW_SHOWN_KEY, "true");
    }
  } catch (e) {
    // Silently fail — review prompt is non-critical
    console.warn("[StoreReview] Failed to request review:", e);
  }
}
