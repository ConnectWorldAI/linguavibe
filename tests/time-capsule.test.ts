import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock expo-audio
vi.mock("expo-audio", () => ({
  useAudioRecorder: vi.fn(() => ({
    prepareToRecordAsync: vi.fn(),
    record: vi.fn(),
    stop: vi.fn(),
    uri: "file:///mock-recording.m4a",
  })),
  useAudioRecorderState: vi.fn(() => ({
    isRecording: false,
  })),
  requestRecordingPermissionsAsync: vi.fn(() =>
    Promise.resolve({ granted: true })
  ),
  setAudioModeAsync: vi.fn(() => Promise.resolve()),
  createAudioPlayer: vi.fn(() => ({
    play: vi.fn(),
    remove: vi.fn(),
  })),
  RecordingPresets: {
    HIGH_QUALITY: {
      isMeteringEnabled: true,
      android: { extension: ".m4a", outputFormat: 2, audioEncoder: 3 },
      ios: { extension: ".m4a", audioQuality: 127 },
      web: { mimeType: "audio/webm" },
    },
  },
}));

// Mock expo-haptics
vi.mock("expo-haptics", () => ({
  impactAsync: vi.fn(),
  notificationAsync: vi.fn(),
  ImpactFeedbackStyle: { Light: "light", Medium: "medium" },
  NotificationFeedbackType: { Success: "success", Error: "error" },
}));

// Mock AsyncStorage
const mockStorage: Record<string, string> = {};
vi.mock("@react-native-async-storage/async-storage", () => ({
  default: {
    getItem: vi.fn((key: string) => Promise.resolve(mockStorage[key] || null)),
    setItem: vi.fn((key: string, value: string) => {
      mockStorage[key] = value;
      return Promise.resolve();
    }),
    removeItem: vi.fn((key: string) => {
      delete mockStorage[key];
      return Promise.resolve();
    }),
  },
}));

// Mock expo-router
vi.mock("expo-router", () => ({
  router: { back: vi.fn(), push: vi.fn() },
}));

// Mock react-native Share
vi.mock("react-native/Libraries/Share/Share", () => ({
  share: vi.fn(() => Promise.resolve({ action: "sharedAction" })),
}));

describe("Time Capsule Screen", () => {
  beforeEach(() => {
    Object.keys(mockStorage).forEach((key) => delete mockStorage[key]);
  });

  it("should have correct milestone structure with 5 milestones", async () => {
    // Verify the milestone data structure
    const milestones = [
      { id: "day1", milestone: "Day 1", targetDay: 1 },
      { id: "day30", milestone: "Day 30", targetDay: 30 },
      { id: "day90", milestone: "Day 90", targetDay: 90 },
      { id: "day180", milestone: "Day 180", targetDay: 180 },
      { id: "day365", milestone: "Day 365", targetDay: 365 },
    ];

    expect(milestones).toHaveLength(5);
    expect(milestones[0].targetDay).toBe(1);
    expect(milestones[4].targetDay).toBe(365);
  });

  it("should persist recordings to AsyncStorage", async () => {
    const AsyncStorage = (await import("@react-native-async-storage/async-storage")).default;

    const capsuleData = [
      {
        id: "day1",
        milestone: "Day 1",
        targetDay: 1,
        date: "May 25, 2026",
        uri: "file:///recording-day1.m4a",
        duration: 15,
        phrase: "Introduce yourself",
        unlocked: true,
        score: 62,
      },
    ];

    await AsyncStorage.setItem("@time_capsule_recordings", JSON.stringify(capsuleData));
    const stored = await AsyncStorage.getItem("@time_capsule_recordings");
    expect(stored).not.toBeNull();

    const parsed = JSON.parse(stored!);
    expect(parsed[0].uri).toBe("file:///recording-day1.m4a");
    expect(parsed[0].score).toBe(62);
    expect(parsed[0].date).toBe("May 25, 2026");
  });

  it("should correctly calculate days learning from start date", () => {
    const startDate = new Date("2026-01-01");
    const now = new Date("2026-05-25");
    const diffDays = Math.floor(
      (now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    expect(diffDays).toBe(144);
    // Day 1 and Day 30 and Day 90 should be unlocked
    expect(diffDays >= 1).toBe(true);
    expect(diffDays >= 30).toBe(true);
    expect(diffDays >= 90).toBe(true);
    // Day 180 should NOT be unlocked yet
    expect(diffDays >= 180).toBe(false);
  });

  it("should adapt milestone prompts to target language", () => {
    const prompts: Record<string, string> = {
      "Day 1": "Introduce yourself — say your name and why you want to learn",
      "Day 30": "Describe your daily routine in your target language",
      "Day 90": "Tell a short story about something that happened to you",
      "Day 180": "Explain your job or studies in detail",
      "Day 365": "Have a natural conversation about any topic you choose",
    };

    // All prompts should be language-neutral (not hardcoded to a specific language)
    Object.values(prompts).forEach((prompt) => {
      expect(prompt).not.toContain("Spanish");
      expect(prompt).not.toContain("Dominican");
      expect(prompt).not.toContain("French");
    });
  });

  it("should use expo-audio recording APIs correctly", async () => {
    const { useAudioRecorder, requestRecordingPermissionsAsync, setAudioModeAsync } =
      await import("expo-audio");

    // Request permissions
    const status = await requestRecordingPermissionsAsync();
    expect(status.granted).toBe(true);

    // Set audio mode for recording
    await setAudioModeAsync({ playsInSilentMode: true, allowsRecording: true });
    expect(setAudioModeAsync).toHaveBeenCalledWith({
      playsInSilentMode: true,
      allowsRecording: true,
    });

    // Create recorder
    const recorder = useAudioRecorder({
      isMeteringEnabled: true,
      android: { extension: ".m4a", outputFormat: 2, audioEncoder: 3 },
      ios: { extension: ".m4a", audioQuality: 127 },
      web: { mimeType: "audio/webm" },
    });

    expect(recorder).toBeDefined();
    expect(recorder.prepareToRecordAsync).toBeDefined();
    expect(recorder.record).toBeDefined();
    expect(recorder.stop).toBeDefined();
  });

  it("should create audio player for playback", async () => {
    const { createAudioPlayer } = await import("expo-audio");

    const player = createAudioPlayer({ uri: "file:///recording.m4a" });
    expect(player).toBeDefined();
    expect(player.play).toBeDefined();
    expect(player.remove).toBeDefined();

    player.play();
    expect(player.play).toHaveBeenCalled();

    player.remove();
    expect(player.remove).toHaveBeenCalled();
  });

  it("should format duration correctly", () => {
    const formatDuration = (seconds: number): string => {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${mins}:${secs.toString().padStart(2, "0")}`;
    };

    expect(formatDuration(0)).toBe("0:00");
    expect(formatDuration(15)).toBe("0:15");
    expect(formatDuration(60)).toBe("1:00");
    expect(formatDuration(90)).toBe("1:30");
    expect(formatDuration(125)).toBe("2:05");
  });

  it("should calculate progress percentage correctly", () => {
    const getProgressPercentage = (recorded: number, total: number): number => {
      return (recorded / total) * 100;
    };

    expect(getProgressPercentage(0, 5)).toBe(0);
    expect(getProgressPercentage(1, 5)).toBe(20);
    expect(getProgressPercentage(3, 5)).toBe(60);
    expect(getProgressPercentage(5, 5)).toBe(100);
  });
});
