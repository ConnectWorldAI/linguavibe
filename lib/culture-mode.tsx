/**
 * Culture Mode Context
 * 
 * Allows users to switch between:
 * - "immersive" — Culturally-rich AI-generated exercises (story scenarios, cultural discovery, conversation chains)
 * - "grammar" — Traditional grammar drills and structured exercises
 * - "balanced" — Mix of both (default)
 * 
 * This affects how lessons are generated and rendered.
 */
import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const CULTURE_MODE_KEY = "@linguavibe_culture_mode";
const CULTURE_INTENSITY_KEY = "@linguavibe_culture_intensity";

export type CultureMode = "immersive" | "grammar" | "balanced";
export type CultureIntensity = "light" | "medium" | "deep";

interface CultureModeState {
  mode: CultureMode;
  intensity: CultureIntensity;
  setMode: (mode: CultureMode) => void;
  setIntensity: (intensity: CultureIntensity) => void;
  isImmersive: boolean;
  isGrammarOnly: boolean;
  isBalanced: boolean;
}

const CultureModeContext = createContext<CultureModeState>({
  mode: "balanced",
  intensity: "medium",
  setMode: () => {},
  setIntensity: () => {},
  isImmersive: false,
  isGrammarOnly: false,
  isBalanced: true,
});

export function CultureModeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<CultureMode>("balanced");
  const [intensity, setIntensityState] = useState<CultureIntensity>("medium");

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const savedMode = await AsyncStorage.getItem(CULTURE_MODE_KEY);
      const savedIntensity = await AsyncStorage.getItem(CULTURE_INTENSITY_KEY);
      if (savedMode) setModeState(savedMode as CultureMode);
      if (savedIntensity) setIntensityState(savedIntensity as CultureIntensity);
    } catch {}
  };

  const setMode = useCallback(async (newMode: CultureMode) => {
    setModeState(newMode);
    try {
      await AsyncStorage.setItem(CULTURE_MODE_KEY, newMode);
    } catch {}
  }, []);

  const setIntensity = useCallback(async (newIntensity: CultureIntensity) => {
    setIntensityState(newIntensity);
    try {
      await AsyncStorage.setItem(CULTURE_INTENSITY_KEY, newIntensity);
    } catch {}
  }, []);

  return (
    <CultureModeContext.Provider
      value={{
        mode,
        intensity,
        setMode,
        setIntensity,
        isImmersive: mode === "immersive",
        isGrammarOnly: mode === "grammar",
        isBalanced: mode === "balanced",
      }}
    >
      {children}
    </CultureModeContext.Provider>
  );
}

export function useCultureMode() {
  return useContext(CultureModeContext);
}

/**
 * Get the exercise type distribution based on culture mode.
 * This tells the AI backend what percentage of exercises should be cultural vs grammar.
 */
export function getExerciseDistribution(mode: CultureMode, intensity: CultureIntensity) {
  const distributions: Record<CultureMode, Record<CultureIntensity, { cultural: number; grammar: number; mixed: number }>> = {
    immersive: {
      light: { cultural: 60, grammar: 20, mixed: 20 },
      medium: { cultural: 75, grammar: 10, mixed: 15 },
      deep: { cultural: 90, grammar: 5, mixed: 5 },
    },
    grammar: {
      light: { cultural: 10, grammar: 70, mixed: 20 },
      medium: { cultural: 5, grammar: 80, mixed: 15 },
      deep: { cultural: 0, grammar: 90, mixed: 10 },
    },
    balanced: {
      light: { cultural: 30, grammar: 40, mixed: 30 },
      medium: { cultural: 40, grammar: 35, mixed: 25 },
      deep: { cultural: 50, grammar: 25, mixed: 25 },
    },
  };
  return distributions[mode][intensity];
}

/**
 * Get the exercise types that should be generated based on culture mode.
 */
export function getPreferredExerciseTypes(mode: CultureMode): string[] {
  switch (mode) {
    case "immersive":
      return ["story_choice", "cultural_discovery", "conversation_chain", "fill_the_order", "match_pairs"];
    case "grammar":
      return ["grammar_comparison", "fill_the_order", "match_pairs", "sentence_reorder", "translation"];
    case "balanced":
      return ["story_choice", "cultural_discovery", "grammar_comparison", "fill_the_order", "conversation_chain", "match_pairs"];
  }
}
