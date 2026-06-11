import { describe, it, expect, vi } from "vitest";
import * as fs from "fs";
import * as path from "path";

// Mock react-native and expo modules
vi.mock("react-native", () => ({
  View: "View",
  Text: "Text",
  StyleSheet: { create: (s: any) => s },
  TouchableOpacity: "TouchableOpacity",
  ScrollView: "ScrollView",
  Platform: { OS: "ios" },
  Switch: "Switch",
  Dimensions: { get: () => ({ width: 390, height: 844 }) },
  FlatList: "FlatList",
}));
vi.mock("react-native-safe-area-context", () => ({ SafeAreaView: "SafeAreaView" }));
vi.mock("@expo/vector-icons", () => ({ Ionicons: "Ionicons" }));
vi.mock("expo-router", () => ({ router: { back: vi.fn(), push: vi.fn() } }));
vi.mock("expo-haptics", () => ({ impactAsync: vi.fn(), notificationAsync: vi.fn(), ImpactFeedbackStyle: { Light: "Light", Medium: "Medium" }, NotificationFeedbackType: { Success: "Success" } }));
vi.mock("@react-native-async-storage/async-storage", () => ({ default: { getItem: vi.fn(), setItem: vi.fn() } }));
vi.mock("react-native-reanimated", () => ({
  default: { View: "AnimatedView", createAnimatedComponent: (c: any) => c },
  useSharedValue: () => ({ value: 0 }),
  useAnimatedStyle: () => ({}),
  withRepeat: (v: any) => v,
  withTiming: (v: any) => v,
  withSequence: (...args: any[]) => args[0],
  Easing: { inOut: () => ({}), ease: {} },
}));
vi.mock("expo-document-picker", () => ({ getDocumentAsync: vi.fn() }));

describe("Sprint 12: Sleep Sounds / Ambient Mixer", () => {
  const filePath = path.resolve(__dirname, "../app/sleep-sounds.tsx");

  it("sleep-sounds.tsx file exists", () => {
    expect(fs.existsSync(filePath)).toBe(true);
  });

  it("contains nature sound layers (rain, ocean, forest, thunder, wind, birds)", () => {
    const content = fs.readFileSync(filePath, "utf-8");
    expect(content).toContain("rain");
    expect(content).toContain("ocean");
    expect(content).toContain("forest");
    expect(content).toContain("thunder");
    expect(content).toContain("wind");
    expect(content).toContain("birds");
  });

  it("contains ambient sound layers (fire, cafe, train, piano, whitenoise)", () => {
    const content = fs.readFileSync(filePath, "utf-8");
    expect(content).toContain("fire");
    expect(content).toContain("cafe");
    expect(content).toContain("train");
    expect(content).toContain("piano");
    expect(content).toContain("whitenoise");
  });

  it("contains language whisper packs for multiple languages", () => {
    const content = fs.readFileSync(filePath, "utf-8");
    expect(content).toContain("Spanish");
    expect(content).toContain("French");
    expect(content).toContain("Japanese");
    expect(content).toContain("Korean");
    expect(content).toContain("Italian");
  });

  it("has sleep timer options", () => {
    const content = fs.readFileSync(filePath, "utf-8");
    expect(content).toContain("SLEEP_TIMERS");
    expect(content).toContain("15 min");
    expect(content).toContain("30 min");
    expect(content).toContain("1 hour");
    expect(content).toContain("All night");
  });

  it("has play/stop controls and timer countdown", () => {
    const content = fs.readFileSync(filePath, "utf-8");
    expect(content).toContain("handlePlay");
    expect(content).toContain("handleStop");
    expect(content).toContain("timeRemaining");
    expect(content).toContain("formatTimeRemaining");
  });

  it("persists configuration with AsyncStorage", () => {
    const content = fs.readFileSync(filePath, "utf-8");
    expect(content).toContain("@sleep_sounds_config");
    expect(content).toContain("AsyncStorage.setItem");
    expect(content).toContain("AsyncStorage.getItem");
  });
});

describe("Sprint 12: Voice Clone Studio", () => {
  const filePath = path.resolve(__dirname, "../app/voice-clone-studio.tsx");

  it("voice-clone-studio.tsx file exists", () => {
    expect(fs.existsSync(filePath)).toBe(true);
  });

  it("contains song catalog with multiple languages", () => {
    const content = fs.readFileSync(filePath, "utf-8");
    expect(content).toContain("Despacito");
    expect(content).toContain("La Vie en Rose");
    expect(content).toContain("Sakura");
    expect(content).toContain("Gangnam Style");
    expect(content).toContain("Con Te Partirò");
  });

  it("has voice profile options (natural, smooth, powerful)", () => {
    const content = fs.readFileSync(filePath, "utf-8");
    expect(content).toContain("Natural");
    expect(content).toContain("Smooth");
    expect(content).toContain("Powerful");
    expect(content).toContain("VOICE_PROFILES");
  });

  it("has generation flow with progress tracking", () => {
    const content = fs.readFileSync(filePath, "utf-8");
    expect(content).toContain("handleGenerate");
    expect(content).toContain("isGenerating");
    expect(content).toContain("generationProgress");
    expect(content).toContain("Creating Your Version");
  });

  it("has results section with playback and sharing", () => {
    const content = fs.readFileSync(filePath, "utf-8");
    expect(content).toContain("My Recordings");
    expect(content).toContain("handlePlayResult");
    expect(content).toContain("share-outline");
  });

  it("checks if voice is trained and shows training prompt if not", () => {
    const content = fs.readFileSync(filePath, "utf-8");
    expect(content).toContain("voiceReady");
    expect(content).toContain("Train Your Voice First");
    expect(content).toContain("voice-clone-training");
  });

  it("screens are registered in _layout.tsx", () => {
    const layoutPath = path.resolve(__dirname, "../app/_layout.tsx");
    const content = fs.readFileSync(layoutPath, "utf-8");
    expect(content).toContain("voice-clone-studio");
    expect(content).toContain("sleep-sounds");
  });
});
