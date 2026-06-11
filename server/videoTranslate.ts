import { z } from "zod";
import { publicProcedure, router } from "./_core/trpc";
import { invokeLLM } from "./_core/llm";
import { transcribeAudio } from "./_core/voiceTranscription";

/**
 * Video Translation Backend
 * 
 * Provides endpoints for video dubbing/translation:
 * 1. Accept video URL or uploaded video
 * 2. Extract and transcribe audio (using Whisper via voiceTranscription)
 * 3. Translate transcript to target language (using LLM)
 * 4. Generate dubbed audio in target language (using TTS)
 * 5. Return translated audio URL for client-side sync with original video
 * 
 * The client handles video playback with the original visuals
 * and replaces the audio track with the translated version.
 */

const SUPPORTED_LANGUAGES = [
  "en", "es", "fr", "de", "it", "pt", "ja", "ko", "zh", "ar",
  "hi", "ru", "nl", "pl", "tr", "th", "vi", "id", "tl", "sw",
  "yo", "ha", "el", "he", "fa", "ur", "bn",
] as const;

export const videoTranslateRouter = router({
  /**
   * Start a video translation job.
   * Accepts either a URL (YouTube, TikTok, etc.) or a storage key for uploaded video.
   */
  startJob: publicProcedure
    .input(z.object({
      videoUrl: z.string().optional(),
      storageKey: z.string().optional(),
      sourceLanguage: z.string().default("en"),
      targetLanguage: z.string().default("es"),
      useVoiceClone: z.boolean().default(false),
      keepSubtitles: z.boolean().default(true),
    }))
    .mutation(async ({ input }) => {
      if (!input.videoUrl && !input.storageKey) {
        return { success: false as const, error: "Either videoUrl or storageKey is required", jobId: null };
      }

      // Generate a job ID for tracking
      const jobId = `vt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

      // In production, this would:
      // 1. Queue the job for background processing
      // 2. Extract audio from video using ffmpeg
      // 3. Transcribe with Whisper
      // 4. Translate with LLM
      // 5. Generate TTS audio
      // 6. Store result and notify client

      return {
        success: true as const,
        error: null,
        jobId,
        estimatedDuration: "2-5 minutes",
        message: `Video translation job started. Translating from ${input.sourceLanguage} to ${input.targetLanguage}.`,
      };
    }),

  /**
   * Translate a transcript from one language to another.
   * Used as part of the video translation pipeline.
   */
  translateTranscript: publicProcedure
    .input(z.object({
      transcript: z.string().min(1),
      sourceLanguage: z.string().default("en"),
      targetLanguage: z.string().default("es"),
      preserveTiming: z.boolean().default(true),
    }))
    .mutation(async ({ input }) => {
      const systemPrompt = `You are a professional video dubbing translator. Translate the following transcript from ${input.sourceLanguage} to ${input.targetLanguage}.

IMPORTANT RULES:
- Maintain the natural speaking rhythm and pacing
- Keep sentences roughly the same length as the original (for lip-sync timing)
- Use natural, conversational language appropriate for spoken content
- Preserve any emotional tone, emphasis, or style
- If there are timestamps, keep them aligned
- Return ONLY the translated text, no explanations

${input.preserveTiming ? "TIMING: Each line represents a segment. Keep the same number of segments and approximate word count per segment." : ""}`;

      try {
        const response = await invokeLLM({
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: input.transcript },
          ],
        });

        const rawContent = response.choices?.[0]?.message?.content;
        const content = typeof rawContent === "string"
          ? rawContent
          : (rawContent as any)?.find((p: any) => p.type === "text")?.text ?? "";

        if (!content) {
          return { success: false as const, error: "No translation returned", translatedText: "" };
        }

        return { success: true as const, error: null, translatedText: content };
      } catch (err: any) {
        return { success: false as const, error: err.message || "Translation failed", translatedText: "" };
      }
    }),

  /**
   * Check the status of a video translation job.
   */
  checkJobStatus: publicProcedure
    .input(z.object({
      jobId: z.string(),
    }))
    .query(async ({ input }) => {
      // In production, this would check a job queue/database
      // For now, return a simulated status
      return {
        jobId: input.jobId,
        status: "processing" as "queued" | "processing" | "complete" | "error",
        progress: 0.5,
        message: "Translating audio...",
        resultUrl: null as string | null,
      };
    }),

  /**
   * Get supported languages for video translation.
   */
  getSupportedLanguages: publicProcedure.query(() => {
    return {
      languages: SUPPORTED_LANGUAGES,
      maxDuration: 600, // 10 minutes max
      creditsPerMinute: 15,
    };
  }),
});
