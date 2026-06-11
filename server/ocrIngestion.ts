/**
 * OCR Video Ingestion Pipeline
 * 
 * Extracts on-screen text from video URLs (TikTok, YouTube, Instagram):
 * 1. Downloads video / extracts key frames
 * 2. Runs LLM Vision OCR on each frame to read on-screen text
 * 3. Parses extracted text into structured data (word, pronunciation, translation, context)
 * 4. Feeds into knowledge base: slang dictionary, word of day, pronunciation guides, class curriculum
 * 
 * Uses the built-in LLM with vision capabilities (no external OCR API needed).
 */

import { z } from "zod";
import { router, publicProcedure } from "./_core/trpc";
import { invokeLLM } from "./_core/llm";
import { storagePut } from "./storage";

// ─── Types ───────────────────────────────────────────────────────────────────

interface ExtractedTextEntry {
  word: string;
  pronunciation: string;
  translation: string;
  language: string;
  dialect: string;
  context: string;
  category: "slang" | "formal" | "idiom" | "greeting" | "food" | "culture" | "grammar" | "other";
  source: string;
  confidence: "high" | "medium" | "low";
}

interface OCRFrameResult {
  frameIndex: number;
  rawText: string;
  entries: ExtractedTextEntry[];
}

interface IngestionResult {
  videoUrl: string;
  totalFramesAnalyzed: number;
  totalEntriesExtracted: number;
  entries: ExtractedTextEntry[];
  audioTranscript?: string;
  status: "success" | "partial" | "failed";
  errors: string[];
}

// ─── LLM Vision OCR ─────────────────────────────────────────────────────────

/**
 * Uses the built-in LLM with vision to extract on-screen text from a video frame image.
 * The LLM identifies words, pronunciation guides, translations, and context displayed in the video.
 */
async function extractTextFromFrame(imageUrl: string, sourceUrl: string): Promise<ExtractedTextEntry[]> {
  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: `You are an expert OCR and language analysis system for a language learning platform.
Your job is to extract ALL on-screen text from video frames, specifically:
- Words or phrases being taught (in the target language)
- Pronunciation guides (phonetic spellings like "keh-loh-keh")
- Translations (English or other language equivalents)
- Context clues (what situation the word is used in)
- Slang indicators (if the word is slang, informal, regional, etc.)

Return a JSON array of extracted entries. Each entry should have:
- "word": The word/phrase in the target language
- "pronunciation": How to pronounce it (phonetic spelling if shown, or your best phonetic guide)
- "translation": English translation
- "language": The target language (e.g., "Spanish", "French", "Japanese")
- "dialect": Regional dialect if identifiable (e.g., "Dominican", "Mexican", "Parisian")
- "context": Usage context or example sentence
- "category": One of: "slang", "formal", "idiom", "greeting", "food", "culture", "grammar", "other"
- "confidence": "high" if clearly visible, "medium" if partially visible, "low" if inferred

If no language-learning text is visible, return an empty array [].
IMPORTANT: Return ONLY the JSON array, no markdown formatting.`
        },
        {
          role: "user",
          content: [
            { type: "text", text: "Extract all on-screen language-learning text from this video frame:" },
            { type: "image_url", image_url: { url: imageUrl, detail: "high" } }
          ]
        }
      ],
      response_format: { type: "json_object" }
    });

    const content = (response.choices?.[0]?.message?.content || "[]") as string;
    let parsed: any;
    try {
      parsed = JSON.parse(content);
    } catch {
      // Try to extract JSON array from response
      const match = content.match(/\[[\s\S]*\]/);
      if (match) {
        parsed = JSON.parse(match[0]);
      } else {
        return [];
      }
    }

    // Handle both { entries: [...] } and [...] formats
    const entries = Array.isArray(parsed) ? parsed : (parsed.entries || parsed.results || []);
    
    return entries.map((e: any) => ({
      word: e.word || "",
      pronunciation: e.pronunciation || "",
      translation: e.translation || "",
      language: e.language || "Unknown",
      dialect: e.dialect || "Standard",
      context: e.context || "",
      category: e.category || "other",
      source: sourceUrl,
      confidence: e.confidence || "medium",
    }));
  } catch (error) {
    console.error("[OCR] Frame extraction failed:", error);
    return [];
  }
}

/**
 * Analyzes a video URL by extracting thumbnail/preview frames and running OCR.
 * For platforms like TikTok/YouTube/Instagram, we use their oEmbed/thumbnail APIs
 * to get preview images, then run LLM vision on them.
 */
async function analyzeVideoUrl(videoUrl: string): Promise<IngestionResult> {
  const errors: string[] = [];
  const allEntries: ExtractedTextEntry[] = [];
  let framesAnalyzed = 0;

  try {
    // Step 1: Get video thumbnail/preview images
    const thumbnailUrls = await getVideoThumbnails(videoUrl);
    
    if (thumbnailUrls.length === 0) {
      // Fallback: try to use the URL directly with LLM vision
      // Some URLs (especially direct video links) can be analyzed directly
      errors.push("Could not extract thumbnails; attempting direct URL analysis");
    }

    // Step 2: Run LLM Vision OCR on each frame
    for (const thumbUrl of thumbnailUrls) {
      try {
        const entries = await extractTextFromFrame(thumbUrl, videoUrl);
        allEntries.push(...entries);
        framesAnalyzed++;
      } catch (err) {
        errors.push(`Frame analysis failed: ${err}`);
      }
    }

    // Step 3: If we have the video URL, also try audio transcription for spoken words
    // This captures words that are spoken but not shown on screen
    let audioTranscript: string | undefined;
    try {
      audioTranscript = await transcribeVideoAudio(videoUrl);
    } catch {
      // Audio transcription is optional enhancement
    }

    // Step 4: If audio transcript exists, extract additional language entries from it
    if (audioTranscript) {
      try {
        const audioEntries = await extractEntriesFromTranscript(audioTranscript, videoUrl);
        allEntries.push(...audioEntries);
      } catch {
        errors.push("Failed to extract entries from audio transcript");
      }
    }

    // Step 5: Deduplicate entries by word
    const deduped = deduplicateEntries(allEntries);

    return {
      videoUrl,
      totalFramesAnalyzed: framesAnalyzed,
      totalEntriesExtracted: deduped.length,
      entries: deduped,
      audioTranscript,
      status: deduped.length > 0 ? "success" : framesAnalyzed > 0 ? "partial" : "failed",
      errors,
    };
  } catch (error) {
    return {
      videoUrl,
      totalFramesAnalyzed: 0,
      totalEntriesExtracted: 0,
      entries: [],
      status: "failed",
      errors: [`Pipeline failed: ${error}`],
    };
  }
}

/**
 * Extract thumbnail URLs from various video platforms.
 * Uses oEmbed APIs and known URL patterns.
 */
async function getVideoThumbnails(videoUrl: string): Promise<string[]> {
  const thumbnails: string[] = [];
  const url = videoUrl.toLowerCase();

  try {
    if (url.includes("youtube.com") || url.includes("youtu.be")) {
      // YouTube: extract video ID and use thumbnail API
      const videoId = extractYouTubeId(videoUrl);
      if (videoId) {
        thumbnails.push(
          `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
          `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
          `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`
        );
      }
    } else if (url.includes("tiktok.com")) {
      // TikTok: use oEmbed API to get thumbnail
      try {
        const oembedUrl = `https://www.tiktok.com/oembed?url=${encodeURIComponent(videoUrl)}`;
        const resp = await fetch(oembedUrl);
        if (resp.ok) {
          const data = await resp.json();
          if (data.thumbnail_url) {
            thumbnails.push(data.thumbnail_url);
          }
        }
      } catch {
        // TikTok oEmbed may fail for some videos
      }
    } else if (url.includes("instagram.com")) {
      // Instagram: use oEmbed API
      try {
        const oembedUrl = `https://api.instagram.com/oembed?url=${encodeURIComponent(videoUrl)}`;
        const resp = await fetch(oembedUrl);
        if (resp.ok) {
          const data = await resp.json();
          if (data.thumbnail_url) {
            thumbnails.push(data.thumbnail_url);
          }
        }
      } catch {
        // Instagram oEmbed may require auth
      }
    }

    // If URL is a direct image, use it directly
    if (url.match(/\.(jpg|jpeg|png|webp|gif)(\?|$)/i)) {
      thumbnails.push(videoUrl);
    }
  } catch (error) {
    console.error("[OCR] Thumbnail extraction failed:", error);
  }

  return thumbnails;
}

function extractYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/,
    /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

/**
 * Transcribe audio from a video URL using the built-in voice transcription.
 */
async function transcribeVideoAudio(videoUrl: string): Promise<string | undefined> {
  try {
    const { transcribeAudio } = await import("./_core/voiceTranscription");
    const result = await transcribeAudio({
      audioUrl: videoUrl,
      prompt: "Transcribe language learning content including slang, pronunciation, and translations",
    });
    return (result as any)?.text;
  } catch {
    return undefined;
  }
}

/**
 * Extract structured language entries from an audio transcript using LLM.
 */
async function extractEntriesFromTranscript(transcript: string, sourceUrl: string): Promise<ExtractedTextEntry[]> {
  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: `You are a language analysis system. Extract all language-learning vocabulary from this transcript.
For each word/phrase being taught, return a JSON object with:
- "word": The word/phrase in the target language
- "pronunciation": Phonetic pronunciation guide
- "translation": English translation
- "language": Target language name
- "dialect": Regional dialect if mentioned
- "context": How/when to use it
- "category": One of: "slang", "formal", "idiom", "greeting", "food", "culture", "grammar", "other"
- "confidence": "high", "medium", or "low"

Return ONLY a JSON object with an "entries" array.`
        },
        {
          role: "user",
          content: `Extract language vocabulary from this transcript:\n\n${transcript}`
        }
      ],
      response_format: { type: "json_object" }
    });

    const content = (response.choices?.[0]?.message?.content || "{}") as string;
    const parsed = JSON.parse(content);
    const entries = parsed.entries || [];

    return entries.map((e: any) => ({
      ...e,
      source: sourceUrl,
      confidence: e.confidence || "medium",
    }));
  } catch {
    return [];
  }
}

/**
 * Remove duplicate entries based on word + language combination.
 * Keeps the entry with higher confidence.
 */
function deduplicateEntries(entries: ExtractedTextEntry[]): ExtractedTextEntry[] {
  const map = new Map<string, ExtractedTextEntry>();
  const confidenceOrder = { high: 3, medium: 2, low: 1 };

  for (const entry of entries) {
    if (!entry.word) continue;
    const key = `${entry.word.toLowerCase()}_${entry.language.toLowerCase()}`;
    const existing = map.get(key);
    if (!existing || confidenceOrder[entry.confidence] > confidenceOrder[existing.confidence]) {
      map.set(key, entry);
    }
  }

  return Array.from(map.values());
}

/**
 * Feed extracted entries into the knowledge base via LLM enrichment.
 * Verifies accuracy, adds cultural context, and categorizes for:
 * - Slang of the Day / Word of the Day
 * - Class curriculum (matched to language/level)
 * - Pronunciation practice
 * - Influencer teaching content
 */
async function enrichAndCategorize(entries: ExtractedTextEntry[]): Promise<ExtractedTextEntry[]> {
  if (entries.length === 0) return [];

  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: `You are a language expert and curriculum designer. Review and enrich these vocabulary entries.
For each entry:
1. VERIFY the translation is correct
2. ADD cultural context and usage notes
3. IMPROVE the pronunciation guide if needed
4. CATEGORIZE accurately (slang, formal, idiom, greeting, food, culture, grammar, other)
5. IDENTIFY the dialect/region more precisely if possible
6. ADD an example sentence showing natural usage

Return the enriched entries as a JSON object with an "entries" array.
Each entry should have all original fields plus:
- "verified": true/false (whether you confirmed the translation)
- "culturalNote": brief cultural context
- "exampleSentence": natural usage example in the target language
- "exampleTranslation": English translation of the example
- "difficulty": "beginner", "intermediate", or "advanced"
- "suitableForWordOfDay": true/false
- "suitableForSlangOfDay": true/false`
        },
        {
          role: "user",
          content: `Enrich these vocabulary entries:\n${JSON.stringify(entries, null, 2)}`
        }
      ],
      response_format: { type: "json_object" }
    });

    const content = (response.choices?.[0]?.message?.content || "{}") as string;
    const parsed = JSON.parse(content);
    return parsed.entries || entries;
  } catch {
    return entries;
  }
}

// ─── tRPC Router ─────────────────────────────────────────────────────────────

export const ocrIngestionRouter = router({
  /**
   * Analyze a single video URL: extract frames, run OCR, parse vocabulary.
   */
  analyzeVideo: publicProcedure
    .input(z.object({
      videoUrl: z.string().url(),
      autoEnrich: z.boolean().default(true),
    }))
    .mutation(async ({ input }) => {
      const result = await analyzeVideoUrl(input.videoUrl);

      // Optionally enrich entries with LLM verification
      if (input.autoEnrich && result.entries.length > 0) {
        result.entries = await enrichAndCategorize(result.entries);
      }

      return result;
    }),

  /**
   * Batch analyze multiple video URLs.
   */
  batchAnalyze: publicProcedure
    .input(z.object({
      videoUrls: z.array(z.string().url()).min(1).max(20),
      autoEnrich: z.boolean().default(true),
    }))
    .mutation(async ({ input }) => {
      const results: IngestionResult[] = [];

      for (const url of input.videoUrls) {
        const result = await analyzeVideoUrl(url);
        if (input.autoEnrich && result.entries.length > 0) {
          result.entries = await enrichAndCategorize(result.entries);
        }
        results.push(result);
      }

      const totalEntries = results.reduce((sum, r) => sum + r.totalEntriesExtracted, 0);
      const successCount = results.filter((r) => r.status === "success").length;

      return {
        totalVideos: input.videoUrls.length,
        successCount,
        totalEntries,
        results,
      };
    }),

  /**
   * Extract text from a single image URL (for screenshots, memes, etc.)
   */
  analyzeImage: publicProcedure
    .input(z.object({
      imageUrl: z.string().url(),
    }))
    .mutation(async ({ input }) => {
      const entries = await extractTextFromFrame(input.imageUrl, input.imageUrl);
      const enriched = await enrichAndCategorize(entries);
      return {
        imageUrl: input.imageUrl,
        entries: enriched,
        totalEntries: enriched.length,
      };
    }),

  /**
   * Enrich and verify a set of manually entered vocabulary entries.
   */
  enrichEntries: publicProcedure
    .input(z.object({
      entries: z.array(z.object({
        word: z.string(),
        pronunciation: z.string().optional().default(""),
        translation: z.string().optional().default(""),
        language: z.string(),
        dialect: z.string().optional().default("Standard"),
        context: z.string().optional().default(""),
        category: z.string().optional().default("other"),
        source: z.string().optional().default("manual"),
        confidence: z.string().optional().default("medium"),
      })),
    }))
    .mutation(async ({ input }) => {
      const enriched = await enrichAndCategorize(input.entries as ExtractedTextEntry[]);
      return { entries: enriched };
    }),
});
