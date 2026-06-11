/**
 * Music Generation Router
 * 
 * Integrates with Suno API (via Apiframe) for AI music generation.
 * Generates learning songs in target languages with synchronized lyrics.
 * 
 * Flow:
 * 1. Client requests song generation with topic, language, style
 * 2. Server generates lyrics via LLM
 * 3. Server submits to Suno API for music generation
 * 4. Client polls for completion
 * 5. On completion, server generates synced lyrics for karaoke
 */

import { z } from "zod";
import { router, publicProcedure } from "./_core/trpc";
import { invokeLLM } from "./_core/llm";
import { storagePut, storageGetSignedUrl } from "./storage";

function extractText(result: any): string {
  const raw = result.choices?.[0]?.message?.content;
  if (!raw) return "";
  if (typeof raw === "string") return raw;
  const textPart = raw.find((p: any) => p.type === "text");
  return textPart?.text ?? "";
}

// In-memory job store for music generation
const musicJobStore = new Map<string, {
  id: string;
  status: "generating_lyrics" | "submitting" | "generating_music" | "processing" | "completed" | "failed";
  progress: number;
  stage: string;
  createdAt: number;
  completedAt: number | null;
  result: {
    audioUrl: string | null;
    title: string;
    lyrics: string;
    syncedLyrics: any[] | null;
    duration: number;
    language: string;
    topic: string;
    style: string;
  } | null;
  error: string | null;
}>();

// Song library (in-memory, production would use database)
const songLibrary: Array<{
  id: string;
  title: string;
  language: string;
  topic: string;
  difficulty: string;
  style: string;
  lyrics: string;
  translatedLyrics: string;
  syncedLyrics: any[];
  audioUrl: string;
  duration: number;
  createdAt: number;
  plays: number;
  likes: number;
}> = [];

export const musicGenerationRouter = router({
  /**
   * Generate a learning song
   * Creates lyrics via LLM, then submits to Suno for music generation
   */
  generate: publicProcedure
    .input(z.object({
      topic: z.string().min(1),
      language: z.string().min(1),
      nativeLanguage: z.string().default("English"),
      difficulty: z.enum(["beginner", "intermediate", "advanced"]).default("beginner"),
      style: z.string().default("pop, catchy, upbeat"),
      customPrompt: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const jobId = `music_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

      // Initialize job
      musicJobStore.set(jobId, {
        id: jobId,
        status: "generating_lyrics",
        progress: 0,
        stage: "Writing lyrics...",
        createdAt: Date.now(),
        completedAt: null,
        result: null,
        error: null,
      });

      // Start async generation
      generateSongAsync(jobId, input).catch((err) => {
        const job = musicJobStore.get(jobId);
        if (job) {
          job.status = "failed";
          job.error = err.message || "Generation failed";
        }
      });

      return { jobId, status: "generating_lyrics" };
    }),

  /**
   * Poll job status
   */
  getStatus: publicProcedure
    .input(z.object({ jobId: z.string() }))
    .query(({ input }) => {
      const job = musicJobStore.get(input.jobId);
      if (!job) {
        return { found: false as const, status: "not_found", progress: 0, stage: "", result: null, error: "Job not found" };
      }
      return {
        found: true as const,
        status: job.status,
        progress: job.progress,
        stage: job.stage,
        result: job.result,
        error: job.error,
      };
    }),

  /**
   * Get song library - browsable feed of generated songs
   */
  getLibrary: publicProcedure
    .input(z.object({
      language: z.string().optional(),
      difficulty: z.string().optional(),
      topic: z.string().optional(),
      limit: z.number().default(20),
      offset: z.number().default(0),
    }))
    .query(({ input }) => {
      let filtered = [...songLibrary];

      if (input.language) {
        filtered = filtered.filter(s => s.language.toLowerCase() === input.language!.toLowerCase());
      }
      if (input.difficulty) {
        filtered = filtered.filter(s => s.difficulty === input.difficulty);
      }
      if (input.topic) {
        filtered = filtered.filter(s => s.topic.toLowerCase().includes(input.topic!.toLowerCase()));
      }

      // Sort by most recent
      filtered.sort((a, b) => b.createdAt - a.createdAt);

      return {
        songs: filtered.slice(input.offset, input.offset + input.limit),
        total: filtered.length,
        hasMore: input.offset + input.limit < filtered.length,
      };
    }),

  /**
   * Get a single song by ID
   */
  getSong: publicProcedure
    .input(z.object({ songId: z.string() }))
    .query(({ input }) => {
      const song = songLibrary.find(s => s.id === input.songId);
      if (!song) return { found: false as const, song: null };
      return { found: true as const, song };
    }),

  /**
   * Like a song (increment likes)
   */
  likeSong: publicProcedure
    .input(z.object({ songId: z.string() }))
    .mutation(({ input }) => {
      const song = songLibrary.find(s => s.id === input.songId);
      if (song) {
        song.likes += 1;
        return { success: true, likes: song.likes };
      }
      return { success: false, likes: 0 };
    }),

  /**
   * Record a play
   */
  recordPlay: publicProcedure
    .input(z.object({ songId: z.string() }))
    .mutation(({ input }) => {
      const song = songLibrary.find(s => s.id === input.songId);
      if (song) song.plays += 1;
      return { success: true };
    }),

  /**
   * Generate synced lyrics for karaoke mode
   */
  generateKaraokeLyrics: publicProcedure
    .input(z.object({
      songId: z.string().optional(),
      title: z.string(),
      lyrics: z.string(),
      language: z.string(),
      nativeLanguage: z.string().default("English"),
      duration: z.number().default(120000),
    }))
    .mutation(async ({ input }) => {
      const prompt = `Generate time-synced dual-language lyrics for a learning song titled "${input.title}".
Song language: ${input.language}
Translation language: ${input.nativeLanguage}
Total duration: ${input.duration}ms

Original lyrics:
${input.lyrics}

Return JSON with word-level synchronized lyrics (timestamps in milliseconds):
{
  "duration": ${input.duration},
  "lines": [
    {
      "startTime": ms,
      "endTime": ms,
      "original": "original lyric line in ${input.language}",
      "translated": "translated line in ${input.nativeLanguage}",
      "words": [
        { "word": "individual_word", "startTime": ms, "endTime": ms, "translation": "word_translation" }
      ]
    }
  ],
  "vocabulary": [
    { "word": "key_word", "translation": "meaning", "partOfSpeech": "noun/verb/etc", "example": "usage example" }
  ]
}

Make timestamps realistic and evenly distributed across the duration.
Include word-level timing for karaoke-style highlighting.
Ensure translations are accurate and natural.`;

      try {
        const result = await invokeLLM({
          messages: [{ role: "user", content: prompt }],
          response_format: { type: "json_object" },
        });

        const text = extractText(result);
        const parsed = JSON.parse(text);

        // Update song in library if songId provided
        if (input.songId) {
          const song = songLibrary.find(s => s.id === input.songId);
          if (song) {
            song.syncedLyrics = parsed.lines || [];
          }
        }

        return {
          success: true as const,
          duration: parsed.duration || input.duration,
          lines: parsed.lines || [],
          vocabulary: parsed.vocabulary || [],
        };
      } catch (err: any) {
        return {
          success: false as const,
          error: err.message,
          duration: 0,
          lines: [],
          vocabulary: [],
        };
      }
    }),
});

/**
 * Async song generation pipeline
 */
async function generateSongAsync(jobId: string, input: {
  topic: string;
  language: string;
  nativeLanguage: string;
  difficulty: string;
  style: string;
  customPrompt?: string;
}) {
  const job = musicJobStore.get(jobId);
  if (!job) return;

  try {
    // Step 1: Generate lyrics via LLM
    job.status = "generating_lyrics";
    job.progress = 10;
    job.stage = "Writing song lyrics...";

    const difficultyGuide = {
      beginner: "Use simple vocabulary (A1-A2 level), short sentences, lots of repetition. Focus on basic everyday words.",
      intermediate: "Use moderate vocabulary (B1-B2 level), some idioms, varied sentence structures.",
      advanced: "Use rich vocabulary (C1-C2 level), complex grammar, slang, cultural references, and wordplay.",
    }[input.difficulty] || "";

    const lyricsPrompt = `Write a catchy, educational song in ${input.language} about "${input.topic}".
${input.customPrompt ? `Additional instructions: ${input.customPrompt}` : ""}

Difficulty level: ${input.difficulty}
${difficultyGuide}

The song should:
- Be 2-3 minutes long (2 verses, 1 chorus repeated, 1 bridge)
- Teach vocabulary related to "${input.topic}"
- Be catchy and memorable for language learners
- Include repetition of key phrases for memorization
- Sound natural in ${input.language} (not a direct translation)

Return JSON:
{
  "title": "Song title in ${input.language}",
  "titleTranslated": "Song title in ${input.nativeLanguage}",
  "lyrics": "Full lyrics with [Verse 1], [Chorus], [Verse 2], [Bridge], [Chorus] markers",
  "translatedLyrics": "Full translation in ${input.nativeLanguage} line by line",
  "tags": "comma-separated genre/mood tags for music generation",
  "keyVocabulary": [
    { "word": "word_in_target", "translation": "in_native", "context": "how it's used in the song" }
  ]
}`;

    const lyricsResult = await invokeLLM({
      messages: [{ role: "user", content: lyricsPrompt }],
      response_format: { type: "json_object" },
    });

    const lyricsText = extractText(lyricsResult);
    const lyricsData = JSON.parse(lyricsText);

    job.progress = 30;
    job.stage = "Lyrics written! Generating music...";
    job.status = "submitting";

    // Step 2: Submit to Suno API (via Apiframe or direct)
    // For now, we'll use the LLM-generated lyrics and simulate Suno submission
    // In production, this would call the Apiframe SDK
    const sunoApiKey = process.env.SUNO_API_KEY || process.env.APIFRAME_API_KEY;

    let audioUrl: string | null = null;
    let duration = 120000; // default 2 min

    if (sunoApiKey) {
      // Live Suno API call via Apiframe
      job.status = "generating_music";
      job.progress = 40;
      job.stage = "Submitting to Suno AI...";

      try {
        const sunoResponse = await fetch("https://api.apiframe.pro/suno/generate", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${sunoApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            prompt: lyricsData.lyrics,
            custom_mode: true,
            title: lyricsData.title,
            tags: lyricsData.tags || `${input.style}, educational`,
            model_version: "V4",
            instrumental: false,
          }),
        });

        if (sunoResponse.ok) {
          const sunoData = await sunoResponse.json();
          const sunoJobId = sunoData.id || sunoData.jobId;

          // Poll for completion
          job.progress = 50;
          job.stage = "AI composing music...";

          let attempts = 0;
          const maxAttempts = 60; // 5 minutes max

          while (attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 5000));
            attempts++;

            const statusResponse = await fetch(`https://api.apiframe.pro/suno/status/${sunoJobId}`, {
              headers: { "Authorization": `Bearer ${sunoApiKey}` },
            });

            if (statusResponse.ok) {
              const statusData = await statusResponse.json();
              job.progress = Math.min(50 + (attempts / maxAttempts) * 40, 89);

              if (statusData.status === "completed" || statusData.status === "done") {
                audioUrl = statusData.result?.tracks?.[0]?.audio_url
                  || statusData.result?.audio_url
                  || statusData.audio_url;
                duration = (statusData.result?.tracks?.[0]?.duration || 120) * 1000;
                break;
              } else if (statusData.status === "failed" || statusData.status === "error") {
                throw new Error(statusData.error || "Suno generation failed");
              }
            }
          }

          if (!audioUrl && attempts >= maxAttempts) {
            throw new Error("Music generation timed out");
          }
        } else {
          const errorText = await sunoResponse.text();
          console.error("Suno API error:", errorText);
          // Fall back to demo mode
          audioUrl = null;
        }
      } catch (apiErr: any) {
        console.error("Suno API call failed:", apiErr.message);
        // Continue without audio - lyrics still valuable
        audioUrl = null;
      }
    }

    // Step 3: Generate synced lyrics for karaoke
    job.progress = 90;
    job.stage = "Generating synchronized lyrics...";
    job.status = "processing";

    const syncPrompt = `Generate time-synced lyrics for this song (total duration: ${duration}ms):

Title: ${lyricsData.title}
Lyrics:
${lyricsData.lyrics}

Return JSON:
{
  "lines": [
    {
      "startTime": ms_number,
      "endTime": ms_number,
      "original": "lyric line in ${input.language}",
      "translated": "translation in ${input.nativeLanguage}",
      "words": [
        { "word": "word", "startTime": ms, "endTime": ms, "translation": "word_translation" }
      ]
    }
  ]
}

Distribute timestamps evenly across ${duration}ms. Include word-level timing.`;

    let syncedLyrics: any[] = [];
    try {
      const syncResult = await invokeLLM({
        messages: [{ role: "user", content: syncPrompt }],
        response_format: { type: "json_object" },
      });
      const syncText = extractText(syncResult);
      const syncData = JSON.parse(syncText);
      syncedLyrics = syncData.lines || [];
    } catch (syncErr) {
      // Non-fatal - song still works without synced lyrics
      console.error("Synced lyrics generation failed:", syncErr);
    }

    // Step 4: Store in library
    const songId = `song_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const librarySong = {
      id: songId,
      title: lyricsData.title || `${input.topic} Song`,
      language: input.language,
      topic: input.topic,
      difficulty: input.difficulty,
      style: input.style,
      lyrics: lyricsData.lyrics || "",
      translatedLyrics: lyricsData.translatedLyrics || "",
      syncedLyrics,
      audioUrl: audioUrl || "",
      duration,
      createdAt: Date.now(),
      plays: 0,
      likes: 0,
    };
    songLibrary.unshift(librarySong);

    // Complete
    job.status = "completed";
    job.progress = 100;
    job.stage = "Song ready!";
    job.completedAt = Date.now();
    job.result = {
      audioUrl,
      title: lyricsData.title || `${input.topic} Song`,
      lyrics: lyricsData.lyrics || "",
      syncedLyrics,
      duration,
      language: input.language,
      topic: input.topic,
      style: input.style,
    };

  } catch (err: any) {
    job.status = "failed";
    job.error = err.message || "Generation failed";
    job.progress = 0;
    job.stage = "Failed";
  }
}
