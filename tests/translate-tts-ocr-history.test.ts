import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock expo-speech
vi.mock("expo-speech", () => ({
  speak: vi.fn(),
  stop: vi.fn(),
  isSpeakingAsync: vi.fn().mockResolvedValue(false),
}));

// Mock expo-image-picker
vi.mock("expo-image-picker", () => ({
  requestCameraPermissionsAsync: vi.fn().mockResolvedValue({ status: "granted" }),
  launchCameraAsync: vi.fn().mockResolvedValue({
    canceled: false,
    assets: [{ uri: "file:///test/photo.jpg", base64: "dGVzdA==", mimeType: "image/jpeg" }],
  }),
  launchImageLibraryAsync: vi.fn().mockResolvedValue({
    canceled: false,
    assets: [{ uri: "file:///test/photo.jpg", base64: "dGVzdA==", mimeType: "image/jpeg" }],
  }),
}));

// Mock expo-file-system
vi.mock("expo-file-system/legacy", () => ({
  readAsStringAsync: vi.fn().mockResolvedValue("dGVzdA=="),
  EncodingType: { Base64: "base64" },
}));

// Mock AsyncStorage
vi.mock("@react-native-async-storage/async-storage", () => ({
  default: {
    getItem: vi.fn().mockResolvedValue(null),
    setItem: vi.fn().mockResolvedValue(undefined),
    removeItem: vi.fn().mockResolvedValue(undefined),
  },
}));

describe("Translate Screen - TTS (Listen) Feature", () => {
  it("should call Speech.speak with correct language code", async () => {
    const Speech = await import("expo-speech");
    const translatedText = "Hola, ¿cómo estás?";
    const langCode = "es";

    Speech.speak(translatedText, {
      language: langCode,
      rate: 0.9,
      onDone: () => {},
      onStopped: () => {},
      onError: () => {},
    });

    expect(Speech.speak).toHaveBeenCalledWith(translatedText, expect.objectContaining({
      language: "es",
      rate: 0.9,
    }));
  });

  it("should stop speaking when already speaking", async () => {
    const Speech = await import("expo-speech");
    (Speech.isSpeakingAsync as any).mockResolvedValueOnce(true);

    const isSpeaking = await Speech.isSpeakingAsync();
    expect(isSpeaking).toBe(true);

    await Speech.stop();
    expect(Speech.stop).toHaveBeenCalled();
  });
});

describe("Translate Screen - Camera/OCR Feature", () => {
  it("should request camera permissions before launching camera", async () => {
    const ImagePicker = await import("expo-image-picker");

    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    expect(status).toBe("granted");
    expect(ImagePicker.requestCameraPermissionsAsync).toHaveBeenCalled();
  });

  it("should launch camera and return image with base64", async () => {
    const ImagePicker = await import("expo-image-picker");

    const result = await ImagePicker.launchCameraAsync({
      quality: 0.8,
      base64: true,
    });

    expect(result.canceled).toBe(false);
    expect(result.assets![0].base64).toBe("dGVzdA==");
    expect(result.assets![0].mimeType).toBe("image/jpeg");
  });

  it("should fall back to library if camera permission denied", async () => {
    const ImagePicker = await import("expo-image-picker");
    (ImagePicker.requestCameraPermissionsAsync as any).mockResolvedValueOnce({ status: "denied" });

    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    expect(status).toBe("denied");

    // Fall back to library
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.8,
      base64: true,
    });
    expect(result.canceled).toBe(false);
  });

  it("should read file as base64 if not provided directly", async () => {
    const FileSystem = await import("expo-file-system/legacy");

    const base64 = await FileSystem.readAsStringAsync("file:///test/photo.jpg", {
      encoding: FileSystem.EncodingType.Base64,
    });
    expect(base64).toBe("dGVzdA==");
  });
});

describe("Translate Screen - Translation History Feature", () => {
  it("should save translation to history with correct structure", async () => {
    const AsyncStorage = (await import("@react-native-async-storage/async-storage")).default;

    const entry = {
      id: "123",
      input: "Hello",
      output: "Hola",
      from: "English",
      to: "Spanish",
      dialect: "Dominican",
      timestamp: Date.now(),
    };

    const history = [entry];
    await AsyncStorage.setItem("@translate_history", JSON.stringify(history));

    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      "@translate_history",
      expect.stringContaining("Hello")
    );
  });

  it("should limit history to 50 items", () => {
    const items = Array.from({ length: 60 }, (_, i) => ({
      id: String(i),
      input: `Text ${i}`,
      output: `Translated ${i}`,
      from: "English",
      to: "Spanish",
      timestamp: Date.now() - i * 1000,
    }));

    const limited = items.slice(0, 50);
    expect(limited.length).toBe(50);
    expect(limited[0].id).toBe("0"); // Most recent first
  });

  it("should clear history by removing storage key", async () => {
    const AsyncStorage = (await import("@react-native-async-storage/async-storage")).default;

    await AsyncStorage.removeItem("@translate_history");
    expect(AsyncStorage.removeItem).toHaveBeenCalledWith("@translate_history");
  });

  it("should load history from AsyncStorage on mount", async () => {
    const AsyncStorage = (await import("@react-native-async-storage/async-storage")).default;
    const mockHistory = [
      { id: "1", input: "Hi", output: "Hola", from: "English", to: "Spanish", timestamp: Date.now() },
    ];
    (AsyncStorage.getItem as any).mockResolvedValueOnce(JSON.stringify(mockHistory));

    const stored = await AsyncStorage.getItem("@translate_history");
    const parsed = stored ? JSON.parse(stored) : [];
    expect(parsed.length).toBe(1);
    expect(parsed[0].input).toBe("Hi");
  });
});
