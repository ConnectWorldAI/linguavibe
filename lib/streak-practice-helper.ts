/**
 * Streak Practice Helper
 * Combines markTodayAsPracticed() with showStreakToast() for use in screens
 * that don't have direct access to the UsageContext (non-hook contexts).
 *
 * For screens that already use `useUsage()`, prefer the inline pattern:
 *   const result = await markTodayAsPracticed(streak);
 *   if (result.firstToday) showStreakToast(streak);
 *
 * For screens that need a fire-and-forget approach, use:
 *   markPracticeAndToast(showStreakToast, streak);
 */
import { markTodayAsPracticed } from "@/lib/streak-notifications";

/**
 * Mark today as practiced and trigger the streak toast if it's the first practice of the day.
 * @param showStreakToast - The showStreakToast function from useUsage() context
 * @param currentStreak - Optional current streak count to display in the toast
 */
export async function markPracticeAndToast(
  showStreakToast: (count?: number) => void,
  currentStreak?: number
): Promise<void> {
  try {
    const result = await markTodayAsPracticed(currentStreak);
    if (result.firstToday) {
      showStreakToast(currentStreak);
    }
  } catch {
    // Silently fail — streak tracking is non-critical
  }
}
