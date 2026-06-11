/**
 * User-Scoped Storage Utility
 * 
 * All AsyncStorage keys are prefixed with the current user's ID to ensure
 * complete data isolation between users on shared devices.
 * 
 * Usage:
 *   const storage = getUserStorage();
 *   await storage.get("usage_data");  // reads @user_{userId}_usage_data
 *   await storage.set("usage_data", JSON.stringify(data));
 */

import AsyncStorage from "@react-native-async-storage/async-storage";

// Global keys that are NOT user-scoped (shared across all users on device)
const GLOBAL_KEYS = [
  "@auth_logged_in",
  "@auth_user",
  "@onboarding_complete",
  "@current_user_id",
];

let _currentUserId: string | null = null;

/**
 * Set the current active user ID. Called on login/signup.
 */
export async function setCurrentUserId(userId: string): Promise<void> {
  _currentUserId = userId;
  await AsyncStorage.setItem("@current_user_id", userId);
}

/**
 * Get the current active user ID from memory or storage.
 */
export async function getCurrentUserId(): Promise<string | null> {
  if (_currentUserId) return _currentUserId;
  const stored = await AsyncStorage.getItem("@current_user_id");
  if (stored) _currentUserId = stored;
  return stored;
}

/**
 * Clear the current user ID on logout.
 */
export async function clearCurrentUserId(): Promise<void> {
  _currentUserId = null;
  await AsyncStorage.removeItem("@current_user_id");
}

/**
 * Generate a user-scoped key.
 */
function scopedKey(userId: string, key: string): string {
  // Remove @ prefix if present, then add scoped prefix
  const cleanKey = key.startsWith("@") ? key.slice(1) : key;
  return `@user_${userId}_${cleanKey}`;
}

/**
 * User-scoped storage interface.
 * All operations are automatically scoped to the current user.
 */
export const UserStorage = {
  /**
   * Get a value from user-scoped storage.
   */
  async get(key: string): Promise<string | null> {
    const userId = await getCurrentUserId();
    if (!userId) {
      // Fallback to global key if no user is set (shouldn't happen in normal flow)
      return AsyncStorage.getItem(key.startsWith("@") ? key : `@${key}`);
    }
    return AsyncStorage.getItem(scopedKey(userId, key));
  },

  /**
   * Set a value in user-scoped storage.
   */
  async set(key: string, value: string): Promise<void> {
    const userId = await getCurrentUserId();
    if (!userId) {
      await AsyncStorage.setItem(key.startsWith("@") ? key : `@${key}`, value);
      return;
    }
    await AsyncStorage.setItem(scopedKey(userId, key), value);
  },

  /**
   * Remove a value from user-scoped storage.
   */
  async remove(key: string): Promise<void> {
    const userId = await getCurrentUserId();
    if (!userId) {
      await AsyncStorage.removeItem(key.startsWith("@") ? key : `@${key}`);
      return;
    }
    await AsyncStorage.removeItem(scopedKey(userId, key));
  },

  /**
   * Get the raw scoped key string (for debugging or direct access).
   */
  async getKey(key: string): Promise<string> {
    const userId = await getCurrentUserId();
    if (!userId) return key.startsWith("@") ? key : `@${key}`;
    return scopedKey(userId, key);
  },

  /**
   * Migrate existing global keys to user-scoped keys.
   * Call this once after login to move any pre-existing data to the user's scope.
   */
  async migrateGlobalToUser(keysToMigrate: string[]): Promise<void> {
    const userId = await getCurrentUserId();
    if (!userId) return;

    for (const key of keysToMigrate) {
      const globalKey = key.startsWith("@") ? key : `@${key}`;
      if (GLOBAL_KEYS.includes(globalKey)) continue; // Don't migrate global keys
      
      const existing = await AsyncStorage.getItem(globalKey);
      if (existing) {
        const userKey = scopedKey(userId, key);
        const userExisting = await AsyncStorage.getItem(userKey);
        if (!userExisting) {
          // Only migrate if user doesn't already have data
          await AsyncStorage.setItem(userKey, existing);
        }
      }
    }
  },

  /**
   * Clear all user-scoped data for the current user (for account deletion).
   */
  async clearAllUserData(): Promise<void> {
    const userId = await getCurrentUserId();
    if (!userId) return;

    const allKeys = await AsyncStorage.getAllKeys();
    const userKeys = allKeys.filter((k) => k.startsWith(`@user_${userId}_`));
    if (userKeys.length > 0) {
      await AsyncStorage.multiRemove(userKeys);
    }
  },
};

// Keys that should be migrated to per-user scope on login
export const MIGRATABLE_KEYS = [
  "@connectworld_usage_data",
  "@connectworld_low_balance_shown",
  "@subscription_tier",
  "@subscription_plan",
  "@subscription_date",
  "@practice_log",
  "@flashcards",
  "@vocabulary",
  "@streak_data",
  "@learning_progress",
  "@ai_chat_history",
  "@conversation_history",
  "@pronunciation_scores",
  "@song_library",
  "@translation_history",
  "@schedule_preferences",
  "@daily_goals",
  "@achievements",
  "@notifications_read",
  "@friends_list",
  "@user_username",
  "@user_profile_photo",
  "@user_avatar",
];
