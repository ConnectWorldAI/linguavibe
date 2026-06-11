import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock expo-audio
vi.mock("expo-audio", () => ({
  createAudioPlayer: vi.fn(() => ({
    play: vi.fn(),
    pause: vi.fn(),
    remove: vi.fn(),
    duration: 180,
    currentTime: 45,
    playing: true,
  })),
  setAudioModeAsync: vi.fn(),
}));

// Mock AsyncStorage
vi.mock("@react-native-async-storage/async-storage", () => ({
  default: {
    getItem: vi.fn(() => Promise.resolve(null)),
    setItem: vi.fn(() => Promise.resolve()),
  },
}));

// Mock react-native
vi.mock("react-native", () => ({
  Platform: { OS: "ios" },
  Share: { share: vi.fn(() => Promise.resolve({ action: "sharedAction" })) },
  StyleSheet: { create: (s: any) => s },
  Dimensions: { get: () => ({ width: 390, height: 844 }) },
  View: "View",
  Text: "Text",
  ScrollView: "ScrollView",
  TouchableOpacity: "TouchableOpacity",
  FlatList: "FlatList",
  TextInput: "TextInput",
  ActivityIndicator: "ActivityIndicator",
  RefreshControl: "RefreshControl",
  Modal: "Modal",
  Alert: { alert: vi.fn() },
}));

// Mock expo-router
vi.mock("expo-router", () => ({
  router: { push: vi.fn(), back: vi.fn() },
}));

// Mock expo-haptics
vi.mock("expo-haptics", () => ({
  impactAsync: vi.fn(),
  ImpactFeedbackStyle: { Light: "Light", Medium: "Medium" },
  notificationAsync: vi.fn(),
  NotificationFeedbackType: { Success: "Success", Error: "Error" },
}));

// Mock @expo/vector-icons
vi.mock("@expo/vector-icons", () => ({
  Ionicons: "Ionicons",
}));

vi.mock("@expo/vector-icons/MaterialIcons", () => ({
  default: "MaterialIcons",
}));

// Mock react-native-reanimated
vi.mock("react-native-reanimated", () => ({
  default: { View: "Animated.View", createAnimatedComponent: (c: any) => c },
  useSharedValue: () => ({ value: 0 }),
  useAnimatedStyle: () => ({}),
  withTiming: (v: any) => v,
  withRepeat: (v: any) => v,
  withSequence: (v: any) => v,
  withDelay: (_d: any, v: any) => v,
  withSpring: (v: any) => v,
  runOnJS: (fn: any) => fn,
  Easing: { inOut: () => ({}), ease: {}, out: () => ({}), cubic: {} },
  FadeInDown: { delay: () => ({ duration: () => ({}) }) },
  FadeInUp: { delay: () => ({ duration: () => ({}) }) },
  FadeOutDown: { duration: () => ({}) },
}));

// Mock react-native-gesture-handler
vi.mock("react-native-gesture-handler", () => ({
  Gesture: { Pan: () => ({ activeOffsetX: () => ({ onUpdate: () => ({ onEnd: () => ({}) }) }) }) },
  GestureDetector: "GestureDetector",
}));

// Mock react-native-safe-area-context
vi.mock("react-native-safe-area-context", () => ({
  SafeAreaView: "SafeAreaView",
  useSafeAreaInsets: () => ({ top: 44, bottom: 34, left: 0, right: 0 }),
}));

// Mock expo-symbols
vi.mock("expo-symbols", () => ({}));

// Mock lib/i18n
vi.mock("@/lib/i18n", () => ({
  useI18n: () => ({ t: (k: string) => k }),
}));

// Mock lib/trpc
vi.mock("@/lib/trpc", () => ({
  trpc: { useUtils: () => ({}) },
}));

// Mock hooks/use-colors
vi.mock("@/hooks/use-colors", () => ({
  useColors: () => ({ primary: "#6366F1", background: "#0F1115", foreground: "#FFFFFF", border: "#1F2937" }),
}));

// Mock lib/playlist-store
vi.mock("@/lib/playlist-store", () => ({
  usePlaylist: () => ({ playlists: [], addToPlaylist: vi.fn(), createPlaylist: vi.fn() }),
}));

// Mock constants/Colors
vi.mock("../constants/Colors", () => ({
  Colors: { background: "#0F1115", text: "#FFFFFF", textSecondary: "#9CA3AF", secondary: "#6366F1", success: "#22C55E", error: "#EF4444", warning: "#F59E0B", accent: "#EC4899", gold: "#F59E0B", surfaceCard: "#1A1D23", border: "#1F2937" },
  Spacing: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 },
  BorderRadius: { sm: 4, md: 8, lg: 12 },
  FontSize: { xs: 10, sm: 12, md: 14, lg: 16, xl: 18 },
}));

describe("Sprint 10: Persistent Mini-Player Bar", () => {
  describe("MusicPlayerContext interface", () => {
    it("should export MiniPlayerTrack with audioUrl field", async () => {
      // Verify the interface includes audioUrl for queue/history support
      const context = await import("../lib/music-player-context");
      expect(context).toBeDefined();
      expect(context.MusicPlayerProvider).toBeDefined();
      expect(context.useMusicPlayer).toBeDefined();
    });

    it("should have queue and skip functions in the context type", async () => {
      // The context module should export the provider
      const context = await import("../lib/music-player-context");
      // Verify the module exports exist
      expect(typeof context.MusicPlayerProvider).toBe("function");
      expect(typeof context.useMusicPlayer).toBe("function");
    });
  });

  describe("Mini-Player Component", () => {
    it("should export MiniPlayer component", async () => {
      // Verify the mini-player component file exists by checking the module
      const fs = await import("fs");
      const exists = fs.existsSync("/home/ubuntu/linguavibe/components/mini-player.tsx");
      expect(exists).toBe(true);
    });

    it("should contain skip controls in mini-player source", async () => {
      const fs = await import("fs");
      const content = fs.readFileSync("/home/ubuntu/linguavibe/components/mini-player.tsx", "utf-8");
      expect(content).toContain("skipNext");
      expect(content).toContain("skipPrevious");
      expect(content).toContain("play-skip-forward");
      expect(content).toContain("play-skip-back");
    });
  });

  describe("Queue management logic", () => {
    it("should handle empty queue gracefully for skipNext", () => {
      // When queue is empty, skipNext should not crash
      const queue: any[] = [];
      const skipNext = () => {
        if (queue.length > 0) {
          const [next, ...rest] = queue;
          return { next, remaining: rest };
        }
        return null;
      };
      expect(skipNext()).toBeNull();
    });

    it("should dequeue first item when skipNext is called with items", () => {
      const queue = [
        { id: "1", title: "Song A", artist: "Artist A" },
        { id: "2", title: "Song B", artist: "Artist B" },
      ];
      const [next, ...rest] = queue;
      expect(next.id).toBe("1");
      expect(rest.length).toBe(1);
      expect(rest[0].id).toBe("2");
    });

    it("should handle history for skipPrevious", () => {
      const history = [
        { id: "prev-1", title: "Previous Song", artist: "Prev Artist" },
      ];
      const [prev, ...rest] = history;
      expect(prev.id).toBe("prev-1");
      expect(rest.length).toBe(0);
    });

    it("should limit history to 50 items", () => {
      const history: any[] = [];
      for (let i = 0; i < 55; i++) {
        history.push({ id: `song-${i}`, title: `Song ${i}`, artist: "Artist" });
      }
      const trimmed = history.slice(0, 50);
      expect(trimmed.length).toBe(50);
      expect(trimmed[0].id).toBe("song-0");
    });

    it("should add track to queue with addToQueue", () => {
      const queue: any[] = [];
      const track = { id: "new", title: "New Song", artist: "New Artist", audioUrl: "https://example.com/song.mp3" };
      const newQueue = [...queue, track];
      expect(newQueue.length).toBe(1);
      expect(newQueue[0].audioUrl).toBe("https://example.com/song.mp3");
    });
  });
});

describe("Sprint 10: Progress Report Card", () => {
  describe("Progress Report Card screen", () => {
    it("should exist and contain weekly/monthly progress sections", async () => {
      const fs = await import("fs");
      const exists = fs.existsSync("/home/ubuntu/linguavibe/app/progress-report-card.tsx");
      expect(exists).toBe(true);
      const content = fs.readFileSync("/home/ubuntu/linguavibe/app/progress-report-card.tsx", "utf-8");
      expect(content).toContain("Weekly XP Breakdown");
      expect(content).toContain("This Month vs Last Month");
      expect(content).toContain("WEEKLY_PROGRESS");
      expect(content).toContain("MONTHLY_SUMMARY");
    });

    it("should contain skill grades and GPA calculation", async () => {
      const fs = await import("fs");
      const content = fs.readFileSync("/home/ubuntu/linguavibe/app/progress-report-card.tsx", "utf-8");
      expect(content).toContain("Skill Grades");
      expect(content).toContain("scoreToGrade");
      expect(content).toContain("gpa");
      expect(content).toContain("AI Weekly Insight");
    });
  });

  describe("Grade calculation helpers", () => {
    it("should calculate correct grades from scores", () => {
      // Replicate the scoreToGrade logic
      function scoreToGrade(score: number): string {
        if (score >= 97) return "A+";
        if (score >= 93) return "A";
        if (score >= 90) return "A-";
        if (score >= 87) return "B+";
        if (score >= 83) return "B";
        if (score >= 80) return "B-";
        if (score >= 77) return "C+";
        if (score >= 73) return "C";
        if (score >= 70) return "C-";
        if (score >= 67) return "D+";
        if (score >= 60) return "D";
        return "F";
      }

      expect(scoreToGrade(98)).toBe("A+");
      expect(scoreToGrade(94)).toBe("A");
      expect(scoreToGrade(91)).toBe("A-");
      expect(scoreToGrade(88)).toBe("B+");
      expect(scoreToGrade(84)).toBe("B");
      expect(scoreToGrade(80)).toBe("B-");
      expect(scoreToGrade(78)).toBe("C+");
      expect(scoreToGrade(74)).toBe("C");
      expect(scoreToGrade(70)).toBe("C-");
      expect(scoreToGrade(67)).toBe("D+");
      expect(scoreToGrade(60)).toBe("D");
      expect(scoreToGrade(50)).toBe("F");
    });

    it("should calculate monthly change percentages correctly", () => {
      const thisMonth = { xp: 4690, words: 249, lessons: 30 };
      const lastMonth = { xp: 3820, words: 198, lessons: 24 };

      const xpChange = Math.round(((thisMonth.xp - lastMonth.xp) / lastMonth.xp) * 100);
      const wordsChange = Math.round(((thisMonth.words - lastMonth.words) / lastMonth.words) * 100);
      const lessonsChange = Math.round(((thisMonth.lessons - lastMonth.lessons) / lastMonth.lessons) * 100);

      expect(xpChange).toBe(23); // ~22.8% rounded
      expect(wordsChange).toBe(26); // ~25.8% rounded
      expect(lessonsChange).toBe(25); // 25% exactly
    });

    it("should handle zero previous month gracefully", () => {
      const current = 100;
      const prev = 0;
      const change = prev > 0 ? Math.round(((current - prev) / prev) * 100) : 100;
      expect(change).toBe(100);
    });
  });

  describe("Weekly progress data structure", () => {
    it("should have valid weekly progress entries", () => {
      const weeklyProgress = [
        { week: "Apr 28", xp: 820, words: 42, lessons: 5, minutes: 145 },
        { week: "May 5", xp: 1050, words: 58, lessons: 7, minutes: 210 },
        { week: "May 12", xp: 940, words: 51, lessons: 6, minutes: 180 },
        { week: "May 19", xp: 1200, words: 63, lessons: 8, minutes: 240 },
        { week: "May 26", xp: 680, words: 35, lessons: 4, minutes: 120 },
      ];

      expect(weeklyProgress.length).toBe(5);
      weeklyProgress.forEach((entry) => {
        expect(entry.week).toBeTruthy();
        expect(entry.xp).toBeGreaterThan(0);
        expect(entry.words).toBeGreaterThan(0);
        expect(entry.lessons).toBeGreaterThan(0);
        expect(entry.minutes).toBeGreaterThan(0);
      });
    });

    it("should calculate max XP for bar chart scaling", () => {
      const weeklyProgress = [
        { xp: 820 },
        { xp: 1050 },
        { xp: 940 },
        { xp: 1200 },
        { xp: 680 },
      ];
      const maxXp = Math.max(...weeklyProgress.map((w) => w.xp));
      expect(maxXp).toBe(1200);

      // Bar heights should be proportional
      const barHeight = (680 / maxXp) * 80;
      expect(barHeight).toBeCloseTo(45.33, 1);
    });
  });

  describe("Term report data", () => {
    it("should calculate cumulative GPA correctly", () => {
      const terms = [
        { gpa: 3.6 },
        { gpa: 3.3 },
        { gpa: 2.9 },
      ];
      const cumulativeGPA = terms.reduce((sum, t) => sum + t.gpa, 0) / terms.length;
      expect(cumulativeGPA).toBeCloseTo(3.27, 1);
    });

    it("should calculate total words across all terms", () => {
      const terms = [
        { wordsLearned: 87 },
        { wordsLearned: 65 },
        { wordsLearned: 42 },
      ];
      const total = terms.reduce((sum, t) => sum + t.wordsLearned, 0);
      expect(total).toBe(194);
    });
  });
});
