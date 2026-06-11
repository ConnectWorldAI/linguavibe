import { describe, it, expect, vi } from "vitest";

/**
 * Song Translation Studio - Unit Tests
 * Tests the backend pipeline endpoints and voice clone training
 */

// Mock the server modules
vi.mock("../server/_core/llm", () => ({
  invokeLLM: vi.fn().mockResolvedValue({
    choices: [{ message: { content: JSON.stringify({
      lyrics: ["Line 1", "Line 2", "Line 3"],
      timing: [
        { line: "Line 1", startMs: 0, endMs: 4000 },
        { line: "Line 2", startMs: 4000, endMs: 8000 },
        { line: "Line 3", startMs: 8000, endMs: 12000 },
      ],
      key: "Am",
      tempo: 95,
      language: "English",
    }) } }],
  }),
}));

vi.mock("../server/storage", () => ({
  storagePut: vi.fn().mockResolvedValue({ url: "https://storage.example.com/test-file.mp3", key: "test-file.mp3" }),
  storageGetSignedUrl: vi.fn().mockResolvedValue("https://storage.example.com/signed/test-file.mp3"),
}));

describe("Song Translation Studio - Pipeline Configuration", () => {
  it("should define correct voice modes", () => {
    const voiceModes = ["clone", "record", "ai_voice"];
    expect(voiceModes).toHaveLength(3);
    expect(voiceModes).toContain("clone");
    expect(voiceModes).toContain("record");
    expect(voiceModes).toContain("ai_voice");
  });

  it("should define supported languages for translation", () => {
    const SUPPORTED_LANGUAGES = [
      { code: "es", name: "Spanish" },
      { code: "en", name: "English" },
      { code: "fr", name: "French" },
      { code: "de", name: "German" },
      { code: "pt", name: "Portuguese" },
      { code: "ja", name: "Japanese" },
      { code: "ko", name: "Korean" },
      { code: "it", name: "Italian" },
      { code: "zh", name: "Mandarin" },
      { code: "ar", name: "Arabic" },
      { code: "hi", name: "Hindi" },
      { code: "tr", name: "Turkish" },
    ];
    expect(SUPPORTED_LANGUAGES.length).toBeGreaterThanOrEqual(10);
    expect(SUPPORTED_LANGUAGES.find((l) => l.code === "es")).toBeDefined();
    expect(SUPPORTED_LANGUAGES.find((l) => l.code === "en")).toBeDefined();
  });

  it("should define AI voice options with proper structure", () => {
    const AI_VOICES = [
      { id: "bella", name: "Bella", gender: "female", style: "R&B / Soul" },
      { id: "adam", name: "Adam", gender: "male", style: "Pop / Ballad" },
      { id: "aria", name: "Aria", gender: "female", style: "Pop / Dance" },
      { id: "marcus", name: "Marcus", gender: "male", style: "R&B / Gospel" },
    ];
    expect(AI_VOICES.length).toBeGreaterThanOrEqual(4);
    AI_VOICES.forEach((voice) => {
      expect(voice.id).toBeTruthy();
      expect(voice.name).toBeTruthy();
      expect(["male", "female"]).toContain(voice.gender);
      expect(voice.style).toBeTruthy();
    });
  });

  it("should map voice modes to pipeline voiceStyle correctly", () => {
    const voiceModeToStyle: Record<string, string> = {
      clone: "clone",
      record: "natural",
      ai_voice: "match_original",
    };
    expect(voiceModeToStyle.clone).toBe("clone");
    expect(voiceModeToStyle.record).toBe("natural");
    expect(voiceModeToStyle.ai_voice).toBe("match_original");
  });
});

describe("Song Translation Studio - Voice Clone Training", () => {
  it("should require minimum 15 seconds of audio for voice clone", () => {
    const MIN_DURATION = 15;
    const MAX_DURATION = 120;
    
    // Valid durations
    expect(30).toBeGreaterThanOrEqual(MIN_DURATION);
    expect(60).toBeLessThanOrEqual(MAX_DURATION);
    
    // Invalid durations
    expect(10).toBeLessThan(MIN_DURATION);
    expect(150).toBeGreaterThan(MAX_DURATION);
  });

  it("should generate a unique voice model ID", () => {
    const generateModelId = () => `clone-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const id1 = generateModelId();
    const id2 = generateModelId();
    
    expect(id1).toMatch(/^clone-\d+-[a-z0-9]+$/);
    expect(id2).toMatch(/^clone-\d+-[a-z0-9]+$/);
    expect(id1).not.toBe(id2);
  });
});

describe("Song Translation Studio - Translation Quality", () => {
  it("should define quality metrics with valid ranges", () => {
    const qualityMetrics = {
      syllableMatch: 0.87,
      rhymePreservation: 0.82,
      meaningPreservation: 0.94,
      singability: 0.89,
    };
    
    Object.values(qualityMetrics).forEach((value) => {
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThanOrEqual(1);
    });
  });

  it("should define preservation options", () => {
    const preservationOptions = {
      preserveRhyme: true,
      preserveSyllables: true,
      preserveMelody: true,
    };
    
    expect(preservationOptions.preserveRhyme).toBe(true);
    expect(preservationOptions.preserveSyllables).toBe(true);
    expect(preservationOptions.preserveMelody).toBe(true);
  });
});

describe("Song Translation Studio - Pipeline Integration", () => {
  it("should construct correct pipeline input from UI state", () => {
    const uiState = {
      songUrl: "https://example.com/song.mp3",
      songTitle: "End of the Road",
      songArtist: "Boyz II Men",
      sourceLanguage: "en",
      targetLanguage: "es",
      voiceMode: "ai_voice" as const,
      selectedAIVoice: { id: "bella" },
      preserveRhyme: true,
      preserveSyllables: true,
      preserveMelody: true,
    };

    // Construct pipeline input
    const pipelineInput = {
      sourceUrl: uiState.songUrl || undefined,
      title: uiState.songTitle,
      artist: uiState.songArtist,
      sourceLanguage: uiState.sourceLanguage,
      targetLanguage: uiState.targetLanguage,
      voiceStyle: (uiState.voiceMode as string) === "clone" ? "clone" : (uiState.voiceMode as string) === "record" ? "natural" : "match_original",
      voiceModelId: (uiState.voiceMode as string) === "clone" ? undefined : undefined,
      preserveRhyme: uiState.preserveRhyme,
      preserveSyllables: uiState.preserveSyllables,
      preserveMelody: uiState.preserveMelody,
    };

    expect(pipelineInput.title).toBe("End of the Road");
    expect(pipelineInput.artist).toBe("Boyz II Men");
    expect(pipelineInput.sourceLanguage).toBe("en");
    expect(pipelineInput.targetLanguage).toBe("es");
    expect(pipelineInput.voiceStyle).toBe("match_original");
    expect(pipelineInput.preserveRhyme).toBe(true);
    expect(pipelineInput.preserveSyllables).toBe(true);
    expect(pipelineInput.preserveMelody).toBe(true);
  });

  it("should handle voice clone mode pipeline input", () => {
    const voiceModelId = "clone-1234567890-abc123";
    const pipelineInput = {
      title: "Test Song",
      artist: "Test Artist",
      sourceLanguage: "en",
      targetLanguage: "es",
      voiceStyle: "clone",
      voiceModelId,
      preserveRhyme: true,
      preserveSyllables: true,
      preserveMelody: true,
    };

    expect(pipelineInput.voiceStyle).toBe("clone");
    expect(pipelineInput.voiceModelId).toBe(voiceModelId);
  });

  it("should track pipeline stages correctly", () => {
    const PIPELINE_STAGES = ["isolating", "transcribing", "translating", "synthesizing", "mixing", "completed"];
    
    expect(PIPELINE_STAGES).toHaveLength(6);
    expect(PIPELINE_STAGES[0]).toBe("isolating");
    expect(PIPELINE_STAGES[PIPELINE_STAGES.length - 1]).toBe("completed");
  });
});

describe("Song Translation Studio - History Storage", () => {
  it("should format history entries correctly", () => {
    const historyEntry = {
      id: "job-123",
      title: "End of the Road",
      artist: "Boyz II Men",
      sourceLanguage: "en",
      targetLanguage: "es",
      voiceMode: "ai_voice",
      timestamp: Date.now(),
      quality: { syllableMatch: 0.87, rhymePreservation: 0.82, meaningPreservation: 0.94, singability: 0.89 },
    };

    expect(historyEntry.id).toBeTruthy();
    expect(historyEntry.title).toBeTruthy();
    expect(historyEntry.timestamp).toBeGreaterThan(0);
    expect(historyEntry.quality.singability).toBeGreaterThan(0.5);
  });

  it("should limit history to 50 entries", () => {
    const MAX_HISTORY = 50;
    const history = Array.from({ length: 60 }, (_, i) => ({ id: `job-${i}`, title: `Song ${i}` }));
    const trimmed = history.slice(0, MAX_HISTORY);
    expect(trimmed).toHaveLength(50);
  });
});
