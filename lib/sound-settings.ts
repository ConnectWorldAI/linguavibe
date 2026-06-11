/**
 * Sound & Haptic Settings
 * 
 * Independent toggles for celebration sounds, haptics, and notification sounds.
 * Persisted with AsyncStorage. Other modules should call shouldPlaySound(),
 * shouldPlayHaptic(), shouldPlayNotificationSound() before triggering effects.
 */
import AsyncStorage from "@react-native-async-storage/async-storage";

const SOUND_SETTINGS_KEY = "@connectworld_sound_settings";

export interface SoundSettings {
  celebrationSounds: boolean;   // Celebration/milestone sounds
  haptics: boolean;             // All haptic feedback
  notificationSounds: boolean;  // Notification alert sounds
}

const DEFAULT_SETTINGS: SoundSettings = {
  celebrationSounds: true,
  haptics: true,
  notificationSounds: true,
};

/**
 * Get current sound settings
 */
export async function getSoundSettings(): Promise<SoundSettings> {
  try {
    const raw = await AsyncStorage.getItem(SOUND_SETTINGS_KEY);
    if (!raw) return { ...DEFAULT_SETTINGS };
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_SETTINGS, ...parsed };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

/**
 * Update sound settings (partial update supported)
 */
export async function updateSoundSettings(updates: Partial<SoundSettings>): Promise<SoundSettings> {
  const current = await getSoundSettings();
  const updated = { ...current, ...updates };
  await AsyncStorage.setItem(SOUND_SETTINGS_KEY, JSON.stringify(updated));
  return updated;
}

/**
 * Check if celebration sounds should play
 */
export async function shouldPlayCelebrationSound(): Promise<boolean> {
  const settings = await getSoundSettings();
  return settings.celebrationSounds;
}

/**
 * Check if haptics should fire
 */
export async function shouldPlayHaptic(): Promise<boolean> {
  const settings = await getSoundSettings();
  return settings.haptics;
}

/**
 * Check if notification sounds should play
 */
export async function shouldPlayNotificationSound(): Promise<boolean> {
  const settings = await getSoundSettings();
  return settings.notificationSounds;
}

/**
 * Reset all settings to defaults
 */
export async function resetSoundSettings(): Promise<SoundSettings> {
  const defaults = { ...DEFAULT_SETTINGS };
  await AsyncStorage.setItem(SOUND_SETTINGS_KEY, JSON.stringify(defaults));
  return defaults;
}
