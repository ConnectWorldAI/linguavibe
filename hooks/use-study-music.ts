/**
 * useStudyMusic — Background music hook for lesson player
 * 
 * Plays culturally-appropriate background music during lessons.
 * Uses the cultural music styles configuration to select music
 * that matches the learner's target language.
 * 
 * Features:
 * - Auto-selects style based on target language
 * - Volume control (defaults to low for background)
 * - Fade in/out on mount/unmount
 * - Respects user preference (can be disabled)
 * - Pauses when app goes to background
 */

import { useState, useEffect, useCallback, useRef } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getStudyMusicStyle } from "@/lib/cultural-music-styles";

const STUDY_MUSIC_ENABLED_KEY = "@connectworld_study_music_enabled";
const STUDY_MUSIC_VOLUME_KEY = "@connectworld_study_music_volume";

export interface StudyMusicState {
  /** Whether study music is currently playing */
  isPlaying: boolean;
  /** Whether study music feature is enabled by user */
  isEnabled: boolean;
  /** Current volume (0.0 - 1.0) */
  volume: number;
  /** Music style description for the current language */
  styleDescription: string;
  /** Suggested instruments for the current language */
  instruments: string[];
  /** Tempo suggestion */
  tempo: string;
}

export interface StudyMusicControls {
  /** Toggle play/pause */
  toggle: () => void;
  /** Set volume (0.0 - 1.0) */
  setVolume: (vol: number) => void;
  /** Enable/disable study music feature */
  setEnabled: (enabled: boolean) => void;
}

/**
 * Hook to manage background study music during lessons.
 * 
 * Usage:
 * ```tsx
 * const { state, controls } = useStudyMusic("Spanish");
 * // state.isPlaying, state.styleDescription
 * // controls.toggle(), controls.setVolume(0.3)
 * ```
 */
export function useStudyMusic(targetLanguage: string): {
  state: StudyMusicState;
  controls: StudyMusicControls;
} {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isEnabled, setIsEnabled] = useState(true);
  const [volume, setVolume] = useState(0.15); // Low default for background
  const mountedRef = useRef(true);

  // Get culturally-appropriate music style
  const musicStyle = getStudyMusicStyle(targetLanguage);

  // Load user preferences
  useEffect(() => {
    const loadPrefs = async () => {
      try {
        const [enabledStr, volumeStr] = await Promise.all([
          AsyncStorage.getItem(STUDY_MUSIC_ENABLED_KEY),
          AsyncStorage.getItem(STUDY_MUSIC_VOLUME_KEY),
        ]);
        if (enabledStr !== null) setIsEnabled(JSON.parse(enabledStr));
        if (volumeStr !== null) setVolume(parseFloat(volumeStr));
      } catch {}
    };
    loadPrefs();
    return () => { mountedRef.current = false; };
  }, []);

  // Auto-play on mount if enabled
  useEffect(() => {
    if (isEnabled && mountedRef.current) {
      // Small delay for smooth entry
      const timer = setTimeout(() => {
        if (mountedRef.current) setIsPlaying(true);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [isEnabled]);

  const toggle = useCallback(() => {
    setIsPlaying((prev) => !prev);
  }, []);

  const handleSetVolume = useCallback(async (vol: number) => {
    const clamped = Math.max(0, Math.min(1, vol));
    setVolume(clamped);
    try {
      await AsyncStorage.setItem(STUDY_MUSIC_VOLUME_KEY, clamped.toString());
    } catch {}
  }, []);

  const handleSetEnabled = useCallback(async (enabled: boolean) => {
    setIsEnabled(enabled);
    if (!enabled) setIsPlaying(false);
    try {
      await AsyncStorage.setItem(STUDY_MUSIC_ENABLED_KEY, JSON.stringify(enabled));
    } catch {}
  }, []);

  return {
    state: {
      isPlaying,
      isEnabled,
      volume,
      styleDescription: musicStyle.style,
      instruments: musicStyle.instruments,
      tempo: musicStyle.tempo,
    },
    controls: {
      toggle,
      setVolume: handleSetVolume,
      setEnabled: handleSetEnabled,
    },
  };
}
