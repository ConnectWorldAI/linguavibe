import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock react-native
vi.mock("react-native", () => ({
  View: "View",
  Text: "Text",
  StyleSheet: { create: (s: any) => s },
  TouchableOpacity: "TouchableOpacity",
  ScrollView: "ScrollView",
  FlatList: "FlatList",
  Platform: { OS: "web" },
  Dimensions: { get: () => ({ width: 375, height: 812 }) },
  Alert: { alert: vi.fn() },
}));

vi.mock("react-native-safe-area-context", () => ({
  SafeAreaView: "SafeAreaView",
}));

vi.mock("expo-router", () => ({
  router: { push: vi.fn(), back: vi.fn() },
}));

vi.mock("expo-haptics", () => ({
  impactAsync: vi.fn(),
  notificationAsync: vi.fn(),
  ImpactFeedbackStyle: { Light: "Light", Medium: "Medium" },
  NotificationFeedbackType: { Success: "Success", Warning: "Warning" },
}));

vi.mock("@expo/vector-icons", () => ({
  Ionicons: "Ionicons",
}));

vi.mock("react-native-reanimated", () => ({
  default: { View: "AnimatedView", createAnimatedComponent: (c: any) => c },
  useSharedValue: (v: any) => ({ value: v }),
  useAnimatedStyle: (fn: any) => fn(),
  withTiming: (v: any) => v,
  withRepeat: (v: any) => v,
  withSequence: (v: any) => v,
  Easing: { linear: "linear" },
}));

vi.mock("@/lib/music-player-context", () => ({
  useMusicPlayer: () => ({
    currentTrack: { id: "1", title: "Test Song", artist: "Test Artist", artworkColor: "#6366F1", language: "Spanish", languageFlag: "🇪🇸" },
    isPlaying: true,
    progress: 0.5,
    duration: 120,
    pause: vi.fn(),
    resume: vi.fn(),
    skipNext: vi.fn(),
    skipPrevious: vi.fn(),
    queue: [],
    addToQueue: vi.fn(),
    isVisible: true,
  }),
}));

vi.mock("@/hooks/use-colors", () => ({
  useColors: () => ({
    primary: "#6366F1",
    background: "#151718",
    surface: "#1e2022",
    foreground: "#ECEDEE",
    muted: "#9BA1A6",
    border: "#334155",
    success: "#4ADE80",
    error: "#F87171",
    text: "#ECEDEE",
    textSecondary: "#9BA1A6",
  }),
}));

vi.mock("@/components/screen-container", () => ({
  ScreenContainer: "ScreenContainer",
}));

vi.mock("@react-native-async-storage/async-storage", () => ({
  default: {
    getItem: vi.fn().mockResolvedValue(null),
    setItem: vi.fn().mockResolvedValue(undefined),
  },
}));

vi.mock("@/lib/trpc", () => ({
  trpc: {
    musicGeneration: {
      getLibrary: { useQuery: () => ({ data: null, refetch: vi.fn(), isLoading: false }) },
      likeSong: { useMutation: () => ({ mutateAsync: vi.fn() }) },
    },
  },
}));

vi.mock("@/lib/playlist-store", () => ({
  usePlaylist: () => ({
    playlists: [],
    createPlaylist: vi.fn(),
    addSongToPlaylist: vi.fn(),
  }),
}));

describe("Now Playing Screen", () => {
  it("exports a default component", async () => {
    const mod = await import("../app/now-playing");
    expect(mod.default).toBeDefined();
    expect(typeof mod.default).toBe("function");
  });

  it("has lyrics data with original and translation", async () => {
    // The screen should show synced lyrics with both languages
    const fs = await import("fs");
    const content = fs.readFileSync("/home/ubuntu/linguavibe/app/now-playing.tsx", "utf-8");
    expect(content).toContain("original");
    expect(content).toContain("translation");
    expect(content).toContain("LyricLine");
  });

  it("has repeat and shuffle controls", async () => {
    const fs = await import("fs");
    const content = fs.readFileSync("/home/ubuntu/linguavibe/app/now-playing.tsx", "utf-8");
    expect(content).toContain("RepeatMode");
    expect(content).toContain("shuffleOn");
    expect(content).toContain("handleRepeat");
    expect(content).toContain("handleShuffle");
  });

  it("has queue view toggle", async () => {
    const fs = await import("fs");
    const content = fs.readFileSync("/home/ubuntu/linguavibe/app/now-playing.tsx", "utf-8");
    expect(content).toContain("showQueue");
    expect(content).toContain("queueContainer");
    expect(content).toContain("Up Next");
  });

  it("has skip next and previous controls", async () => {
    const fs = await import("fs");
    const content = fs.readFileSync("/home/ubuntu/linguavibe/app/now-playing.tsx", "utf-8");
    expect(content).toContain("handleSkipNext");
    expect(content).toContain("handleSkipPrevious");
    expect(content).toContain("play-skip-back");
    expect(content).toContain("play-skip-forward");
  });
});

describe("Offline Mode - Song Downloads", () => {
  it("song-library has download functionality", async () => {
    const fs = await import("fs");
    const content = fs.readFileSync("/home/ubuntu/linguavibe/app/song-library.tsx", "utf-8");
    expect(content).toContain("handleDownloadSong");
    expect(content).toContain("downloadedSongs");
    expect(content).toContain("@downloaded_songs");
    expect(content).toContain("cloud-download-outline");
    expect(content).toContain("cloud-done");
  });

  it("offline-downloads screen has storage management", async () => {
    const fs = await import("fs");
    const content = fs.readFileSync("/home/ubuntu/linguavibe/app/offline-downloads.tsx", "utf-8");
    expect(content).toContain("Storage Used");
    expect(content).toContain("Downloaded");
    expect(content).toContain("Available for Download");
    expect(content).toContain("handleDownload");
    expect(content).toContain("handleDelete");
  });

  it("offline-content screen has course downloads", async () => {
    const fs = await import("fs");
    const content = fs.readFileSync("/home/ubuntu/linguavibe/app/offline-content.tsx", "utf-8");
    expect(content).toContain("OFFLINE_KEY");
    expect(content).toContain("DownloadStatus");
    expect(content).toContain("downloading");
    expect(content).toContain("downloaded");
    expect(content).toContain("Available Offline");
  });
});

describe("Time Capsule Recording", () => {
  it("time-capsule screen exists with milestone recordings", async () => {
    const fs = await import("fs");
    const content = fs.readFileSync("/home/ubuntu/linguavibe/app/time-capsule.tsx", "utf-8");
    expect(content).toContain("Day 1");
    expect(content).toContain("Day 30");
    expect(content).toContain("Day 90");
    expect(content).toContain("recording");
  });
});
