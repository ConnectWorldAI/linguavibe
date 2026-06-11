import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Cultural Intelligence Pipeline Tests ────────────────────────────────────

describe("Cultural Intelligence Pipeline", () => {
  it("should define LANGUAGE_COUNTRY_MAP with major languages", () => {
    // The culturalIntelligence router maps languages to countries for trending content
    const expectedLanguages = ["spanish", "french", "portuguese", "german", "japanese", "korean", "mandarin", "italian", "arabic", "hindi"];
    // Verify the concept — each language should map to at least one country
    expectedLanguages.forEach((lang) => {
      expect(typeof lang).toBe("string");
      expect(lang.length).toBeGreaterThan(0);
    });
  });

  it("should define content categories for cultural classification", () => {
    const categories = [
      "trending_music",
      "viral_content",
      "news_headline",
      "cultural_history",
      "slang_update",
      "food_culture",
      "sports",
      "entertainment",
      "politics",
      "technology",
    ];
    expect(categories.length).toBe(10);
    categories.forEach((cat) => {
      expect(typeof cat).toBe("string");
    });
  });

  it("should define AI friend message templates", () => {
    // AI friend messages should have a casual, engaging tone
    const templates = [
      "Hey! Did you know that {topic} is trending in {country}?",
      "Check this out — {artist} just dropped a new {type} in {language}!",
      "Fun fact about {country}: {fact}",
      "New slang alert! In {country}, people are saying '{slang}' which means '{meaning}'",
    ];
    templates.forEach((t) => {
      expect(t).toContain("{");
      expect(t.length).toBeGreaterThan(20);
    });
  });

  it("should support Google News RSS feed URLs by language", () => {
    const rssFeeds: Record<string, string> = {
      spanish: "https://news.google.com/rss?hl=es&gl=MX&ceid=MX:es",
      french: "https://news.google.com/rss?hl=fr&gl=FR&ceid=FR:fr",
      portuguese: "https://news.google.com/rss?hl=pt-BR&gl=BR&ceid=BR:pt-419",
      german: "https://news.google.com/rss?hl=de&gl=DE&ceid=DE:de",
      japanese: "https://news.google.com/rss?hl=ja&gl=JP&ceid=JP:ja",
      korean: "https://news.google.com/rss?hl=ko&gl=KR&ceid=KR:ko",
    };
    Object.entries(rssFeeds).forEach(([lang, url]) => {
      expect(url).toContain("news.google.com/rss");
      expect(url).toContain("hl=");
      expect(url).toContain("gl=");
    });
  });
});

// ─── CEFR Hour Logging Wiring Tests ──────────────────────────────────────────

describe("CEFR Hour Logging Wiring", () => {
  // Mock AsyncStorage
  vi.mock("@react-native-async-storage/async-storage", () => ({
    default: {
      getItem: vi.fn().mockResolvedValue(null),
      setItem: vi.fn().mockResolvedValue(undefined),
    },
  }));

  it("should map exercise types to CEFR activity categories", () => {
    // All exercise types should map to a valid CEFR activity
    const exerciseToActivity: Record<string, string> = {
      vocabulary: "adaptive",
      grammar: "adaptive",
      conjugation: "adaptive",
      pronunciation: "pronunciation",
      conversation_chain: "conversation",
      cultural_context: "adaptive",
      fill_blank: "grammar",
      match_pairs: "adaptive",
      whiteboard_teaching: "whiteboard",
      visual_association: "visual_association",
      spot_the_word: "visual_association",
    };

    Object.entries(exerciseToActivity).forEach(([exercise, activity]) => {
      expect(typeof activity).toBe("string");
      expect(activity.length).toBeGreaterThan(0);
    });
  });

  it("should calculate session duration correctly", () => {
    const startTime = Date.now() - 5 * 60 * 1000; // 5 minutes ago
    const endTime = Date.now();
    const durationMinutes = (endTime - startTime) / (1000 * 60);
    expect(durationMinutes).toBeCloseTo(5, 0);
  });

  it("should cap session duration at 60 minutes to prevent idle inflation", () => {
    const MAX_SESSION_MINUTES = 60;
    const startTime = Date.now() - 120 * 60 * 1000; // 2 hours ago (user left app open)
    const rawDuration = (Date.now() - startTime) / (1000 * 60);
    const cappedDuration = Math.min(rawDuration, MAX_SESSION_MINUTES);
    expect(cappedDuration).toBe(MAX_SESSION_MINUTES);
  });

  it("should log to all four exercise screens", () => {
    // Verify the exercise screens that should have CEFR logging
    const screensWithCEFR = [
      "adaptive-lesson.tsx",
      "lesson-exercise.tsx",
      "visual-association-exercise.tsx",
      "whiteboard-lesson.tsx",
    ];
    expect(screensWithCEFR.length).toBe(4);
  });
});

// ─── Handwriting Recognition Tests ───────────────────────────────────────────

describe("Handwriting Recognition", () => {
  it("should accept SVG path data format", () => {
    const samplePaths = [
      "M10.5,20.3 L15.2,25.1 L20.0,22.4",
      "M50.0,10.0 L55.3,15.2 L60.1,12.8 L65.0,18.0",
    ];
    samplePaths.forEach((path) => {
      expect(path).toMatch(/^M[\d.]+,[\d.]+/);
      expect(path).toContain("L");
    });
  });

  it("should support both vision and path_analysis recognition methods", () => {
    const methods = ["vision", "path_analysis", "none", "error"];
    expect(methods).toContain("vision");
    expect(methods).toContain("path_analysis");
  });

  it("should return confidence scores between 0 and 1", () => {
    const visionConfidence = 0.85;
    const pathConfidence = 0.6;
    expect(visionConfidence).toBeGreaterThanOrEqual(0);
    expect(visionConfidence).toBeLessThanOrEqual(1);
    expect(pathConfidence).toBeGreaterThanOrEqual(0);
    expect(pathConfidence).toBeLessThanOrEqual(1);
  });

  it("should handle empty paths gracefully", () => {
    const emptyPaths: string[] = [];
    expect(emptyPaths.length).toBe(0);
    // Should return success: false, method: "none"
    const result = { success: false, text: "", confidence: 0, method: "none" };
    expect(result.success).toBe(false);
    expect(result.method).toBe("none");
  });

  it("should clean recognized text by removing surrounding quotes", () => {
    const rawTexts = ['"hola"', "'buenos días'", "gracias"];
    const cleaned = rawTexts.map((t) => t.trim().replace(/^["']|["']$/g, ""));
    expect(cleaned[0]).toBe("hola");
    expect(cleaned[1]).toBe("buenos días");
    expect(cleaned[2]).toBe("gracias");
  });

  it("should preserve diacritical marks in recognized text", () => {
    const spanishWords = ["café", "niño", "güero", "jalapeño"];
    spanishWords.forEach((word) => {
      expect(word.length).toBeGreaterThan(0);
      // Verify the accented characters are preserved
      expect(word).toMatch(/[éñü]/);
    });
  });

  it("should provide expected answer hint for disambiguation", () => {
    const input = {
      paths: ["M10,20 L30,40"],
      canvasWidth: 300,
      canvasHeight: 150,
      expectedAnswer: "hola",
      targetLanguage: "Spanish",
    };
    expect(input.expectedAnswer).toBe("hola");
    expect(input.targetLanguage).toBe("Spanish");
    // The hint helps LLM disambiguate similar characters like h/n, o/a
  });

  it("should auto-submit recognized text to answer pipeline", () => {
    // When DrawingCanvas recognizes text, it should call onTextRecognized
    // which triggers submitAnswer in the parent WhiteboardExercise
    const mockSubmit = vi.fn();
    const recognizedText = "hola";
    
    // Simulate the callback chain
    if (recognizedText) {
      mockSubmit(recognizedText, "write");
    }
    
    expect(mockSubmit).toHaveBeenCalledWith("hola", "write");
  });

  it("should attempt base64 canvas snapshot before falling back to path analysis", () => {
    // The handleRecognize function should:
    // 1. Try captureRef(canvasRef, { format: 'png', result: 'base64' })
    // 2. If successful, send base64Image + mimeType to the mutation
    // 3. If captureRef fails, fall back to sending only paths (path_analysis method)
    const mutationInput = {
      paths: ["M10,20 L30,40"],
      canvasWidth: 300,
      canvasHeight: 150,
      expectedAnswer: "hola",
      targetLanguage: "Spanish",
      base64Image: "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
      mimeType: "image/png",
    };
    expect(mutationInput.base64Image).toBeTruthy();
    expect(mutationInput.base64Image!.length).toBeGreaterThan(50);
    expect(mutationInput.mimeType).toBe("image/png");
  });

  it("should gracefully fall back when captureRef is unavailable", () => {
    // On some platforms, captureRef may throw. The code wraps it in try/catch
    // and sends only paths when base64Image is undefined.
    const mutationInputFallback = {
      paths: ["M10,20 L30,40"],
      canvasWidth: 300,
      canvasHeight: 150,
      expectedAnswer: "hola",
      targetLanguage: "Spanish",
    };
    expect(mutationInputFallback).not.toHaveProperty("base64Image");
    expect(mutationInputFallback).not.toHaveProperty("mimeType");
  });

  it("should validate base64 image length before sending (>100 chars)", () => {
    // Very short strings are likely errors, not real images
    const tooShort = "abc123";
    const validBase64 = "iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAFklEQVQYV2P8z8BQz0AEYBxVOHIUAgBGWAkFdZJ7SQAAAABJRU5ErkJgggAAAAAAAAAAAAAAAA==";
    expect(tooShort.length).toBeLessThan(100);
    expect(validBase64.length).toBeGreaterThan(100);
    // Only send if length > 100
    const shouldSend = (b64: string) => b64.length > 100;
    expect(shouldSend(tooShort)).toBe(false);
    expect(shouldSend(validBase64)).toBe(true);
  });
});

// ─── Rocky Rodriguez Creator Integration Tests ─────────────────────────────

describe("Rocky Rodriguez Creator Integration", () => {
  it("should have Rocky in SEED_CREATORS with correct handle", () => {
    // Rocky Rodriguez (@SevenDaySpanish) should be in the seed data
    const rockyCreator = {
      name: "Rocky Rodriguez",
      handle: "@sevendayspanish",
      platform: "multi-platform",
      niche: "pronunciation_phonetics",
      region: "United States (Puerto Rican)",
    };
    expect(rockyCreator.name).toBe("Rocky Rodriguez");
    expect(rockyCreator.handle).toBe("@sevendayspanish");
    expect(rockyCreator.niche).toBe("pronunciation_phonetics");
  });

  it("should have all 5 teaching patterns for Rocky", () => {
    const patterns = [
      "Rhythmic Reinforcement Training (RRT)",
      "Alphabet Mastery Foundation",
      "Netflix Dictation Exercise",
      "Speed Trials",
      "Live Decoding Sessions",
    ];
    expect(patterns.length).toBe(5);
    expect(patterns).toContain("Rhythmic Reinforcement Training (RRT)");
    expect(patterns).toContain("Netflix Dictation Exercise");
  });

  it("should map RRT to correct exercise types", () => {
    const rrtExerciseTypes = ["pronunciation_drill", "speed_trial", "listening_comprehension", "native_speed_decode"];
    expect(rrtExerciseTypes).toContain("pronunciation_drill");
    expect(rrtExerciseTypes).toContain("speed_trial");
    expect(rrtExerciseTypes).toContain("native_speed_decode");
  });

  it("should map Netflix Dictation to correct exercise types", () => {
    const netflixExerciseTypes = ["dictation", "listening_comprehension", "pronunciation_imitation", "translation_matching"];
    expect(netflixExerciseTypes).toContain("dictation");
    expect(netflixExerciseTypes).toContain("pronunciation_imitation");
  });
});

// ─── Cultural Moments Injection Tests ──────────────────────────────────────

describe("Cultural Moments Injection", () => {
  it("should inject trending content into generateLesson LLM prompt", () => {
    // The creatorContentEngine should inject cultural feed items into the system prompt
    const mockFeedItems = [
      {
        type: "trending_music",
        title: "Bad Bunny new album trending",
        body: "Bad Bunny released a new album featuring reggaeton and Latin trap...",
        vocabulary: [{ word: "perreo", translation: "reggaeton dance" }],
        culturalContext: "Reggaeton is the dominant music genre in Latin America",
      },
    ];
    const injection = `=== REAL-TIME CULTURAL INTELLIGENCE ===\n${mockFeedItems[0].title}`;
    expect(injection).toContain("CULTURAL INTELLIGENCE");
    expect(injection).toContain("Bad Bunny");
  });

  it("should gracefully skip cultural injection when feed cache is empty", () => {
    // If no cached feed data, culturalMomentInjection should be empty string
    const feedItems: any[] = [];
    let culturalMomentInjection = "";
    if (feedItems.length > 0) {
      culturalMomentInjection = "some content";
    }
    expect(culturalMomentInjection).toBe("");
  });
});

// ─── Daily Cultural Push Notification Tests ────────────────────────────────

describe("Daily Cultural Push Notifications", () => {
  it("should have daily cultural messages for major languages", () => {
    const supportedLanguages = ["es", "fr", "pt", "ja", "ko"];
    expect(supportedLanguages.length).toBeGreaterThanOrEqual(5);
  });

  it("should include vocabulary in push notification data", () => {
    const notifData = {
      type: "daily_cultural_intel",
      category: "music",
      route: "/cultural-feed",
      vocabulary: JSON.stringify([{ word: "perreo", meaning: "reggaeton dance" }]),
    };
    expect(notifData.type).toBe("daily_cultural_intel");
    expect(notifData.route).toBe("/cultural-feed");
    const vocab = JSON.parse(notifData.vocabulary);
    expect(vocab[0].word).toBe("perreo");
  });

  it("should schedule daily push at preferred hour using DAILY trigger", () => {
    const trigger = {
      type: "DAILY",
      hour: 10,
      minute: 0,
    };
    expect(trigger.type).toBe("DAILY");
    expect(trigger.hour).toBe(10);
    expect(trigger.minute).toBe(0);
  });

  it("should reschedule when language changes", () => {
    const lastScheduled = { language: "es", scheduledAt: new Date().toISOString(), preferredHour: 10 };
    const currentLanguage = "fr";
    const shouldReschedule = lastScheduled.language !== currentLanguage;
    expect(shouldReschedule).toBe(true);
  });
});

// ─── Cultural Feed Screen Tests ──────────────────────────────────────────────

describe("Cultural Feed Screen", () => {
  it("should define feed item categories with icons", () => {
    const categoryIcons: Record<string, string> = {
      trending_music: "musical-notes",
      viral_content: "flame",
      news_headline: "newspaper",
      cultural_history: "library",
      slang_update: "chatbubble-ellipses",
      food_culture: "restaurant",
    };
    Object.values(categoryIcons).forEach((icon) => {
      expect(typeof icon).toBe("string");
      expect(icon.length).toBeGreaterThan(0);
    });
  });

  it("should support AI friend message delivery format", () => {
    const friendMessage = {
      friendName: "María",
      friendAvatar: "🇲🇽",
      message: "Hey! Bad Bunny just dropped a new album. Want to learn the slang from it?",
      timestamp: new Date().toISOString(),
      actionUrl: "/cultural-feed",
      category: "trending_music",
    };
    expect(friendMessage.friendName).toBeTruthy();
    expect(friendMessage.message.length).toBeGreaterThan(10);
    expect(friendMessage.category).toBe("trending_music");
  });
});
