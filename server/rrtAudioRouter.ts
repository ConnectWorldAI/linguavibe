/**
 * RRT Audio Assets Router
 * 
 * Generates native speaker audio clips at multiple speeds for RRT exercises.
 * Uses ElevenLabs TTS with speed control to produce authentic audio at slow/normal/fast speeds.
 * Audio is cached in S3 for reuse across sessions.
 */
import { z } from "zod";
import { publicProcedure, router } from "./_core/trpc";
import { storagePut, storageGetSignedUrl } from "./storage";
import { invokeLLM } from "./_core/llm";

// ─── Voice Configuration for Different Languages ─────────────────────────────
const LANGUAGE_VOICES: Record<string, { voiceId: string; name: string; accent: string }> = {
  spanish: { voiceId: "cgSgspJ2msm6clMCkdW9", name: "Jessica", accent: "Latin American" },
  portuguese: { voiceId: "SAz9YHcvj6GT2YYXdXww", name: "River", accent: "Brazilian" },
  french: { voiceId: "pFZP5JQG7iQjIQuC4Bku", name: "Lily", accent: "French" },
  japanese: { voiceId: "Xb7hH8MSUJpSbSDYk0k2", name: "Alice", accent: "Japanese" },
  english: { voiceId: "nPczCjzI2devNBz1zQrb", name: "Brian", accent: "American" },
};

// ─── Speed Presets ───────────────────────────────────────────────────────────
const SPEED_PRESETS = {
  slow: { stability: 0.75, similarity_boost: 0.85, style: 0.2, speed: 0.7 },
  normal: { stability: 0.6, similarity_boost: 0.8, style: 0.3, speed: 1.0 },
  fast: { stability: 0.5, similarity_boost: 0.75, style: 0.4, speed: 1.3 },
  native: { stability: 0.45, similarity_boost: 0.7, style: 0.5, speed: 1.5 },
};

type SpeedLevel = keyof typeof SPEED_PRESETS;

// ─── Cache Key Generation ────────────────────────────────────────────────────
function generateCacheKey(text: string, language: string, speed: SpeedLevel): string {
  // Create a deterministic key from text + language + speed
  const hash = Buffer.from(`${text}:${language}:${speed}`).toString("base64url").slice(0, 32);
  return `rrt-audio/${language}/${speed}/${hash}.mp3`;
}

// ─── ElevenLabs TTS with Speed Control ───────────────────────────────────────
async function generateAudioClip(
  text: string,
  language: string,
  speed: SpeedLevel,
  voiceId?: string,
): Promise<{ audioUrl: string; cacheKey: string; durationEstimate: number }> {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    throw new Error("ElevenLabs API key not configured — RRT audio generation requires ELEVENLABS_API_KEY");
  }

  const voice = voiceId || LANGUAGE_VOICES[language.toLowerCase()]?.voiceId || LANGUAGE_VOICES.english.voiceId;
  const preset = SPEED_PRESETS[speed];
  const cacheKey = generateCacheKey(text, language, speed);

  // Check if already cached in S3
  try {
    const existingUrl = await storageGetSignedUrl(cacheKey);
    if (existingUrl) {
      // Estimate duration based on text length and speed
      const wordsPerSecond = (150 / 60) * preset.speed; // ~150 WPM base
      const wordCount = text.split(/\s+/).length;
      const durationEstimate = Math.max(1, wordCount / wordsPerSecond);
      return { audioUrl: existingUrl, cacheKey, durationEstimate };
    }
  } catch {
    // Not cached, generate new
  }

  // Generate via ElevenLabs with speed parameter
  const response = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voice}`,
    {
      method: "POST",
      headers: {
        "xi-api-key": apiKey,
        "Content-Type": "application/json",
        "Accept": "audio/mpeg",
      },
      body: JSON.stringify({
        text,
        model_id: "eleven_flash_v2_5", // Fastest multilingual model
        voice_settings: {
          stability: preset.stability,
          similarity_boost: preset.similarity_boost,
          style: preset.style,
          use_speaker_boost: true,
          speed: preset.speed,
        },
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`ElevenLabs RRT audio failed: ${response.status} - ${errorText}`);
  }

  // Store to S3 for caching
  const audioBuffer = Buffer.from(await response.arrayBuffer());
  await storagePut(cacheKey, audioBuffer, "audio/mpeg");
  const audioUrl = await storageGetSignedUrl(cacheKey);

  // Estimate duration
  const wordsPerSecond = (150 / 60) * preset.speed;
  const wordCount = text.split(/\s+/).length;
  const durationEstimate = Math.max(1, wordCount / wordsPerSecond);

  return { audioUrl, cacheKey, durationEstimate };
}

// ─── Router ──────────────────────────────────────────────────────────────────
export const rrtAudioRouter = router({
  /**
   * Generate a complete set of RRT audio assets for a phrase at all speed levels.
   * Returns URLs for slow, normal, fast, and native speed clips.
   */
  generatePhraseAudio: publicProcedure
    .input(z.object({
      phrase: z.string().min(1).max(500),
      language: z.string().default("spanish"),
      voiceId: z.string().optional(),
      speeds: z.array(z.enum(["slow", "normal", "fast", "native"])).default(["slow", "normal", "fast"]),
    }))
    .mutation(async ({ input }) => {
      const results: Record<string, { audioUrl: string; durationEstimate: number }> = {};

      for (const speed of input.speeds) {
        const clip = await generateAudioClip(
          input.phrase,
          input.language,
          speed as SpeedLevel,
          input.voiceId,
        );
        results[speed] = { audioUrl: clip.audioUrl, durationEstimate: clip.durationEstimate };
      }

      return {
        phrase: input.phrase,
        language: input.language,
        clips: results,
      };
    }),

  /**
   * Batch generate RRT audio assets for multiple phrases.
   * Used to pre-generate all audio for a lesson in one call.
   */
  batchGenerateAudio: publicProcedure
    .input(z.object({
      phrases: z.array(z.object({
        phrase: z.string().min(1).max(500),
        translation: z.string().optional(),
      })).min(1).max(20),
      language: z.string().default("spanish"),
      voiceId: z.string().optional(),
      speeds: z.array(z.enum(["slow", "normal", "fast", "native"])).default(["slow", "normal", "fast"]),
    }))
    .mutation(async ({ input }) => {
      const allResults: Array<{
        phrase: string;
        translation?: string;
        clips: Record<string, { audioUrl: string; durationEstimate: number }>;
      }> = [];

      for (const phraseData of input.phrases) {
        const clips: Record<string, { audioUrl: string; durationEstimate: number }> = {};

        for (const speed of input.speeds) {
          const clip = await generateAudioClip(
            phraseData.phrase,
            input.language,
            speed as SpeedLevel,
            input.voiceId,
          );
          clips[speed] = { audioUrl: clip.audioUrl, durationEstimate: clip.durationEstimate };
        }

        allResults.push({
          phrase: phraseData.phrase,
          translation: phraseData.translation,
          clips,
        });
      }

      return {
        language: input.language,
        totalPhrases: allResults.length,
        totalClips: allResults.length * input.speeds.length,
        phrases: allResults,
      };
    }),

  /**
   * Generate an RRT lesson with AI-curated phrases and pre-generated audio.
   * Uses LLM to create contextual phrases based on the user's level and topic.
   */
  generateRRTLesson: publicProcedure
    .input(z.object({
      language: z.string().default("spanish"),
      level: z.enum(["A1", "A2", "B1", "B2", "C1", "C2"]).default("A2"),
      topic: z.string().optional(),
      phraseCount: z.number().min(3).max(10).default(5),
      voiceId: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      // Generate contextual phrases via LLM
      const topicHint = input.topic ? `Focus on the topic: "${input.topic}".` : "Choose a practical everyday topic.";
      
      const llmResult = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `You are a language learning content creator specializing in Rhythmic Reinforcement Training (RRT).
Generate ${input.phraseCount} phrases for ${input.language} at CEFR level ${input.level}.
${topicHint}

Rules:
- Each phrase should be 3-8 words (ideal for repetition drills)
- Include a mix of statements, questions, and common expressions
- Progress from simpler to slightly more complex within the set
- Include pronunciation guide using simple phonetic notation
- Include an encouraging message after each phrase (Rocky Rodriguez style - energetic, motivating)

Return ONLY valid JSON in this exact format:
{
  "title": "RRT: [Topic Name]",
  "scenario": "Brief context for these phrases",
  "phrases": [
    {
      "phrase": "the phrase in target language",
      "translation": "English translation",
      "pronunciation": "phonetic guide",
      "encouragement": "Rocky-style encouragement"
    }
  ]
}`,
          },
          {
            role: "user",
            content: `Generate ${input.phraseCount} RRT phrases for ${input.language} at ${input.level} level.`,
          },
        ],
      });

      const content = llmResult.choices[0]?.message?.content;
      if (!content || typeof content !== "string") {
        throw new Error("LLM did not return valid content for RRT lesson");
      }

      // Parse LLM response
      let lessonData: {
        title: string;
        scenario: string;
        phrases: Array<{ phrase: string; translation: string; pronunciation: string; encouragement: string }>;
      };

      try {
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (!jsonMatch) throw new Error("No JSON found in LLM response");
        lessonData = JSON.parse(jsonMatch[0]);
      } catch (e) {
        throw new Error(`Failed to parse RRT lesson from LLM: ${e}`);
      }

      // Generate audio for all phrases at all speeds
      const phrasesWithAudio: Array<{
        phrase: string;
        translation: string;
        pronunciation: string;
        encouragement: string;
        audioClips: Record<string, { audioUrl: string; durationEstimate: number }>;
      }> = [];

      for (const phraseData of lessonData.phrases) {
        const clips: Record<string, { audioUrl: string; durationEstimate: number }> = {};

        for (const speed of ["slow", "normal", "fast"] as SpeedLevel[]) {
          try {
            const clip = await generateAudioClip(
              phraseData.phrase,
              input.language,
              speed,
              input.voiceId,
            );
            clips[speed] = { audioUrl: clip.audioUrl, durationEstimate: clip.durationEstimate };
          } catch (err) {
            // If audio generation fails for one speed, continue with others
            console.warn(`[RRT Audio] Failed to generate ${speed} clip for "${phraseData.phrase}":`, err);
          }
        }

        phrasesWithAudio.push({
          ...phraseData,
          audioClips: clips,
        });
      }

      return {
        title: lessonData.title,
        scenario: lessonData.scenario,
        language: input.language,
        level: input.level,
        phrases: phrasesWithAudio,
        hasAudio: phrasesWithAudio.some(p => Object.keys(p.audioClips).length > 0),
      };
    }),

  /**
   * Get available voices for a language (for voice picker in RRT settings)
   */
  getVoicesForLanguage: publicProcedure
    .input(z.object({ language: z.string() }))
    .query(({ input }) => {
      const defaultVoice = LANGUAGE_VOICES[input.language.toLowerCase()] || LANGUAGE_VOICES.english;
      return {
        language: input.language,
        defaultVoice,
        allVoices: Object.entries(LANGUAGE_VOICES).map(([lang, voice]) => ({
          language: lang,
          ...voice,
        })),
      };
    }),
});
