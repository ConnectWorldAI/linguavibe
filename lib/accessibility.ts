import { AccessibilityInfo, Platform, PixelRatio } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

// ─── Types ───────────────────────────────────────────────────────────────────
export interface AccessibilityPreferences {
  highContrast: boolean;
  largeText: boolean;
  reduceMotion: boolean;
  screenReaderEnabled: boolean;
  hapticFeedback: boolean;
  autoplayAudio: boolean;
  captionsEnabled: boolean;
  textScaleFactor: number; // 1.0 = normal, 1.5 = large, 2.0 = extra large
}

const DEFAULT_A11Y_PREFS: AccessibilityPreferences = {
  highContrast: false,
  largeText: false,
  reduceMotion: false,
  screenReaderEnabled: false,
  hapticFeedback: true,
  autoplayAudio: true,
  captionsEnabled: false,
  textScaleFactor: 1.0,
};

const A11Y_PREFS_KEY = "@accessibility_prefs";

// ─── High Contrast Colors ────────────────────────────────────────────────────
export const HIGH_CONTRAST_COLORS = {
  background: "#000000",
  surface: "#1a1a1a",
  foreground: "#ffffff",
  primary: "#00d4ff",
  secondary: "#ffcc00",
  muted: "#cccccc",
  border: "#ffffff",
  success: "#00ff88",
  warning: "#ffaa00",
  error: "#ff4444",
};

// ─── Accessibility Manager ───────────────────────────────────────────────────
class AccessibilityManager {
  private prefs: AccessibilityPreferences = DEFAULT_A11Y_PREFS;
  private listeners: Set<(prefs: AccessibilityPreferences) => void> = new Set();

  async initialize(): Promise<AccessibilityPreferences> {
    try {
      const stored = await AsyncStorage.getItem(A11Y_PREFS_KEY);
      if (stored) {
        this.prefs = { ...DEFAULT_A11Y_PREFS, ...JSON.parse(stored) };
      }

      // Detect system accessibility settings
      if (Platform.OS !== "web") {
        const screenReaderEnabled = await AccessibilityInfo.isScreenReaderEnabled();
        const reduceMotion = await AccessibilityInfo.isReduceMotionEnabled();
        this.prefs.screenReaderEnabled = screenReaderEnabled;
        this.prefs.reduceMotion = reduceMotion;
      }

      // Detect system font scale
      const fontScale = PixelRatio.getFontScale();
      if (fontScale > 1.2) {
        this.prefs.largeText = true;
        this.prefs.textScaleFactor = fontScale;
      }
    } catch (e) {
      console.warn("[Accessibility] Error initializing:", e);
    }

    return this.prefs;
  }

  getPreferences(): AccessibilityPreferences {
    return { ...this.prefs };
  }

  async updatePreferences(updates: Partial<AccessibilityPreferences>): Promise<void> {
    this.prefs = { ...this.prefs, ...updates };
    await AsyncStorage.setItem(A11Y_PREFS_KEY, JSON.stringify(this.prefs));
    this.notifyListeners();
  }

  subscribe(listener: (prefs: AccessibilityPreferences) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners(): void {
    this.listeners.forEach((listener) => listener(this.prefs));
  }

  /**
   * Get scaled font size based on accessibility settings
   */
  getScaledFontSize(baseSize: number): number {
    return Math.round(baseSize * this.prefs.textScaleFactor);
  }

  /**
   * Get appropriate animation duration (0 if reduce motion is enabled)
   */
  getAnimationDuration(baseDuration: number): number {
    return this.prefs.reduceMotion ? 0 : baseDuration;
  }

  /**
   * Check if haptic feedback should be triggered
   */
  shouldUseHaptics(): boolean {
    return this.prefs.hapticFeedback && Platform.OS !== "web";
  }

  /**
   * Generate accessibility props for interactive elements
   */
  getButtonA11yProps(label: string, hint?: string) {
    return {
      accessible: true,
      accessibilityRole: "button" as const,
      accessibilityLabel: label,
      accessibilityHint: hint,
    };
  }

  /**
   * Generate accessibility props for text elements
   */
  getTextA11yProps(label: string) {
    return {
      accessible: true,
      accessibilityRole: "text" as const,
      accessibilityLabel: label,
    };
  }

  /**
   * Generate accessibility props for images
   */
  getImageA11yProps(label: string) {
    return {
      accessible: true,
      accessibilityRole: "image" as const,
      accessibilityLabel: label,
    };
  }

  /**
   * Announce a message to screen readers
   */
  announce(message: string): void {
    if (Platform.OS !== "web") {
      AccessibilityInfo.announceForAccessibility(message);
    }
  }
}

export const accessibilityManager = new AccessibilityManager();
export default accessibilityManager;
