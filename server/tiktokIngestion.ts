/**
 * TikTok Content Ingestion Service
 * 
 * Uses the TikTok API to discover and ingest content from tracked creators.
 * Extracts captions, transcripts, trending sounds, and slang for the language learning pipeline.
 * 
 * Architecture:
 * 1. Track creators by username (e.g., @randycruzc, @yaismar_21)
 * 2. Poll their recent videos via TikTok API
 * 3. Extract captions + audio transcripts
 * 4. AI classifies content: educational vs. viral/marketing
 * 5. Educational content → teacher knowledge base enrichment
 * 6. Viral content → marketing intelligence pipeline
 * 7. Slang/phrases → dictionary auto-growth + "Slang of the Day"
 */

import { z } from "zod";
import { publicProcedure, router } from "./_core/trpc";
import { invokeLLM } from "./_core/llm";

// ─── TYPES ───────────────────────────────────────────────────────────────────
export interface TikTokCreator {
  id: string;
  username: string;
  displayName: string;
  language: string;
  dialect: string;
  region: string;
  followerCount: number;
  contentFocus: string[];
  isActive: boolean;
  lastChecked: string | null;
  totalIngested: number;
  addedAt: string;
}

export interface TikTokVideo {
  id: string;
  creatorUsername: string;
  caption: string;
  hashtags: string[];
  soundName: string | null;
  duration: number; // seconds
  viewCount: number;
  likeCount: number;
  commentCount: number;
  shareCount: number;
  createTime: string;
  videoUrl: string | null;
  transcriptText: string | null;
}

export interface TeachingPattern {
  format: "whiteboard" | "direct-camera" | "text-overlay" | "visual-props" | "pronunciation-drill" | "comparison" | "skit" | "other";
  visualElements: string[]; // e.g., ["color-coded text", "phonetic spelling", "american flag", "mouth close-up"]
  phoneticApproach: string | null; // e.g., "Spanish phonetic rules for English sounds"
  repetitionStyle: "pause-and-repeat" | "call-and-response" | "listen-only" | "none";
  durationCategory: "micro" | "short" | "medium" | "long"; // <15s, 15-30s, 30-60s, 60s+
  engagementHooks: string[]; // e.g., ["points at camera", "asks viewer to repeat", "uses humor"]
  avatarReplicationScore: number; // 1-10: how easily our AI avatar can replicate this format
  avatarReplicationNotes: string; // What our avatar would need to do to replicate
}

export interface IngestedContent {
  videoId: string;
  classification: "educational" | "viral" | "mixed";
  extractedPhrases: ExtractedPhrase[];
  teachingNotes: string | null;
  slangTerms: SlangTerm[];
  culturalContext: string | null;
  teachingPattern: TeachingPattern | null;
  ingestedAt: string;
}

export interface ExtractedPhrase {
  original: string;
  translation: string;
  context: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  isSlang: boolean;
}

export interface SlangTerm {
  term: string;
  meaning: string;
  region: string;
  usage: string;
  example: string;
  popularity: "trending" | "established" | "emerging";
}

export interface TrendingSound {
  id: string;
  name: string;
  artist: string | null;
  language: string;
  useCount: number;
  isOriginal: boolean;
  relatedHashtags: string[];
}

// ─── IN-MEMORY STORES ────────────────────────────────────────────────────────
const trackedCreators: Map<string, TikTokCreator> = new Map();
const ingestedVideos: Map<string, IngestedContent> = new Map();
const trendingSounds: Map<string, TrendingSound> = new Map();
const slangDatabase: Map<string, SlangTerm> = new Map();

// Pre-seed tracked creators
const SEED_CREATORS: TikTokCreator[] = [
  {
    id: "tt_randycruzc",
    username: "randycruzc",
    displayName: "Randy Cruz",
    language: "Spanish",
    dialect: "Dominican",
    region: "Santo Domingo",
    followerCount: 850000,
    contentFocus: ["Dominican slang", "Street interviews", "Culture"],
    isActive: true,
    lastChecked: null,
    totalIngested: 0,
    addedAt: "2025-01-01T00:00:00.000Z",
  },
  {
    id: "tt_yaismar_21",
    username: "yaismar_21",
    displayName: "Yaismar",
    language: "Spanish",
    dialect: "Dominican",
    region: "Santiago",
    followerCount: 420000,
    contentFocus: ["Dominican expressions", "Humor", "Daily life"],
    isActive: true,
    lastChecked: null,
    totalIngested: 0,
    addedAt: "2025-01-01T00:00:00.000Z",
  },
  {
    id: "tt_spanishwithvicente",
    username: "spanishwithvicente",
    displayName: "Vicente",
    language: "Spanish",
    dialect: "Mexican",
    region: "CDMX",
    followerCount: 1200000,
    contentFocus: ["Mexican slang", "Grammar tips", "Pronunciation"],
    isActive: true,
    lastChecked: null,
    totalIngested: 0,
    addedAt: "2025-01-01T00:00:00.000Z",
  },
  {
    id: "tt_frenchwithnelly",
    username: "frenchwithnelly",
    displayName: "Nelly",
    language: "French",
    dialect: "Parisian",
    region: "Paris",
    followerCount: 680000,
    contentFocus: ["French slang", "Verlan", "Culture"],
    isActive: true,
    lastChecked: null,
    totalIngested: 0,
    addedAt: "2025-01-01T00:00:00.000Z",
  },
  {
    id: "tt_koreanunnie",
    username: "koreanunnie",
    displayName: "Korean Unnie",
    language: "Korean",
    dialect: "Standard",
    region: "Seoul",
    followerCount: 950000,
    contentFocus: ["K-drama phrases", "Korean slang", "Pronunciation"],
    isActive: true,
    lastChecked: null,
    totalIngested: 0,
    addedAt: "2025-01-01T00:00:00.000Z",
  },
  {
    id: "tt_japaneseammo",
    username: "japaneseammo",
    displayName: "Misa",
    language: "Japanese",
    dialect: "Standard",
    region: "Tokyo",
    followerCount: 750000,
    contentFocus: ["Japanese grammar", "Anime phrases", "Keigo"],
    isActive: true,
    lastChecked: null,
    totalIngested: 0,
    addedAt: "2025-01-01T00:00:00.000Z",
  },
  {
    id: "tt_brazilianportuguese",
    username: "brazilianportuguese",
    displayName: "Lucas",
    language: "Portuguese",
    dialect: "Brazilian",
    region: "Rio de Janeiro",
    followerCount: 520000,
    contentFocus: ["Brazilian slang", "Funk lyrics", "Carioca expressions"],
    isActive: true,
    lastChecked: null,
    totalIngested: 0,
    addedAt: "2025-01-01T00:00:00.000Z",
  },
  // ═══ PARTNER CREATORS (DR Market Strategy) ═══════════════════════════════
  {
    id: "tt_inglesconomar",
    username: "inglesconomar",
    displayName: "Inglés con Omar",
    language: "English",
    dialect: "American",
    region: "Dominican Republic",
    followerCount: 2100000,
    contentFocus: ["English for Spanish speakers", "Pronunciation", "Phonetic spelling", "Natural speech linking", "Vocabulary drills", "Grammar tips"],
    isActive: true,
    lastChecked: null,
    totalIngested: 0,
    addedAt: "2026-05-27T00:00:00.000Z",
  },
  {
    id: "tt_aprendeinglesen7meses",
    username: "aprendeinglesen7meses",
    displayName: "Aprende Inglés en 7 Meses",
    language: "English",
    dialect: "American",
    region: "Dominican Republic",
    followerCount: 500000,
    contentFocus: ["English for Spanish speakers", "Call center English", "Business English", "Fast-track learning"],
    isActive: true,
    lastChecked: null,
    totalIngested: 0,
    addedAt: "2026-05-27T00:00:00.000Z",
  },
  {
    id: "tt_dannycashhout",
    username: "dannycashhout",
    displayName: "Danny Cash",
    language: "Spanish",
    dialect: "Bilingual",
    region: "El Paso, TX",
    followerCount: 1000000,
    contentFocus: ["Bilingual lifestyle", "Spanglish", "Code-switching", "Border culture"],
    isActive: true,
    lastChecked: null,
    totalIngested: 0,
    addedAt: "2026-05-27T00:00:00.000Z",
  },
  {
    id: "tt_espanolwlola",
    username: "espanol.w.lola",
    displayName: "Español w/ Lola",
    language: "Spanish",
    dialect: "Various",
    region: "United States",
    followerCount: 421000,
    contentFocus: ["Spanish for English speakers", "Situational phrases", "Gen-Z humor", "Sassy teaching style"],
    isActive: true,
    lastChecked: null,
    totalIngested: 0,
    addedAt: "2026-05-27T00:00:00.000Z",
  },
  {
    id: "tt_spanishovertea",
    username: "spanishovertea",
    displayName: "Spanish Over Tea",
    language: "Spanish",
    dialect: "Various",
    region: "United States",
    followerCount: 300000,
    contentFocus: ["Conversational Spanish", "Relaxed teaching", "Cultural context", "Everyday phrases"],
    isActive: true,
    lastChecked: null,
    totalIngested: 0,
    addedAt: "2026-05-27T00:00:00.000Z",
  },
  {
    id: "tt_ai_spanish_tutor",
    username: "ai_spanish_tutor",
    displayName: "AI Spanish Tutor",
    language: "Spanish",
    dialect: "Various",
    region: "Online",
    followerCount: 150000,
    contentFocus: ["AI-powered teaching", "Grammar drills", "Vocabulary", "Competitor research"],
    isActive: true,
    lastChecked: null,
    totalIngested: 0,
    addedAt: "2026-05-27T00:00:00.000Z",
  },
  {
    id: "tt_byondlanguage",
    username: "byondlanguage",
    displayName: "Byond Language",
    language: "Spanish",
    dialect: "Various",
    region: "United States",
    followerCount: 200000,
    contentFocus: ["Language immersion", "Cultural learning", "Travel phrases", "Advanced conversation"],
    isActive: true,
    lastChecked: null,
    totalIngested: 0,
    addedAt: "2026-05-27T00:00:00.000Z",
  },
  {
    id: "tt_endosidiomas",
    username: "endosidiomas",
    displayName: "En Dos Idiomas",
    language: "Spanish",
    dialect: "Various",
    region: "Latin America",
    followerCount: 350000,
    contentFocus: ["Bilingual content", "Translation comparisons", "False friends", "Idioms"],
    isActive: true,
    lastChecked: null,
    totalIngested: 0,
    addedAt: "2026-05-27T00:00:00.000Z",
  },
  {
    id: "tt_bwill_memphis10",
    username: "bwill_memphis10",
    displayName: "BWill Memphis",
    language: "Spanish",
    dialect: "Various",
    region: "Memphis, TN",
    followerCount: 180000,
    contentFocus: ["Learning Spanish as Black American", "Street Spanish", "Authentic immersion", "Cultural bridge"],
    isActive: true,
    lastChecked: null,
    totalIngested: 0,
    addedAt: "2026-05-27T00:00:00.000Z",
  },
  {
    id: "tt_thatbilingualchick",
    username: "thatbilingualchick",
    displayName: "That Bilingual Chick",
    language: "Spanish",
    dialect: "Various",
    region: "United States",
    followerCount: 280000,
    contentFocus: ["Bilingual life", "Heritage speaker tips", "Spanglish", "Cultural identity"],
    isActive: true,
    lastChecked: null,
    totalIngested: 0,
    addedAt: "2026-05-27T00:00:00.000Z",
  },
];

// Initialize with seed creators
for (const creator of SEED_CREATORS) {
  trackedCreators.set(creator.id, { ...creator });
}

// ─── TIKTOK API INTEGRATION ─────────────────────────────────────────────────
const TIKTOK_API_BASE = "https://open.tiktokapis.com/v2";

/**
 * Fetch recent videos from a TikTok creator using the API
 */
async function fetchCreatorVideos(username: string, limit: number = 5): Promise<TikTokVideo[]> {
  const apiKey = process.env.TIKTOK_API_KEY;
  if (!apiKey) {
    console.warn("[TikTok] No API key configured, skipping fetch");
    return [];
  }

  try {
    // TikTok Research API - query user videos
    const response = await fetch(`${TIKTOK_API_BASE}/research/video/query/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        query: {
          and: [
            { field_name: "username", operation: "EQ", field_values: [username] },
          ],
        },
        max_count: limit,
        start_date: getDateDaysAgo(7), // Last 7 days
        end_date: getTodayDate(),
      }),
    });

    if (!response.ok) {
      console.error(`[TikTok] API error for @${username}: ${response.status}`);
      return [];
    }

    const data = await response.json();
    const videos: TikTokVideo[] = (data.data?.videos || []).map((v: any) => ({
      id: v.id,
      creatorUsername: username,
      caption: v.video_description || "",
      hashtags: extractHashtags(v.video_description || ""),
      soundName: v.music_id ? `sound_${v.music_id}` : null,
      duration: v.duration || 0,
      viewCount: v.view_count || 0,
      likeCount: v.like_count || 0,
      commentCount: v.comment_count || 0,
      shareCount: v.share_count || 0,
      createTime: v.create_time ? new Date(v.create_time * 1000).toISOString() : new Date().toISOString(),
      videoUrl: v.share_url || null,
      transcriptText: null, // Will be filled by transcription step
    }));

    return videos;
  } catch (err) {
    console.error(`[TikTok] Error fetching videos for @${username}:`, err);
    return [];
  }
}

/**
 * Fetch trending hashtags for a region/language
 */
async function fetchTrendingHashtags(region: string = "US"): Promise<string[]> {
  const apiKey = process.env.TIKTOK_API_KEY;
  if (!apiKey) return [];

  try {
    const response = await fetch(`${TIKTOK_API_BASE}/research/hashtag/query/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        keyword: "language learning",
        max_count: 20,
      }),
    });

    if (!response.ok) return [];
    const data = await response.json();
    return (data.data?.hashtags || []).map((h: any) => h.hashtag_name);
  } catch (err) {
    return [];
  }
}

// ─── CONTENT CLASSIFICATION ──────────────────────────────────────────────────
/**
 * Use AI to classify and extract language learning content from a TikTok video
 */
async function classifyAndExtract(video: TikTokVideo, creator: TikTokCreator): Promise<IngestedContent> {
  const prompt = `You are a language learning content classifier for ConnectWorld AI.

Analyze this TikTok video from @${creator.username} (${creator.language} - ${creator.dialect} dialect, ${creator.region}):

Caption: "${video.caption}"
Hashtags: ${video.hashtags.join(", ")}
Views: ${video.viewCount}
Duration: ${video.duration}s

Classify this content and extract language learning material:

1. CLASSIFICATION: Is this "educational" (teaches language/culture), "viral" (entertainment/marketing value), or "mixed"?

2. EXTRACTED PHRASES: List 3-5 phrases from the caption/context that would be useful for language learners. For each:
   - original: the phrase in the target language
   - translation: English translation
   - context: when/how to use it
   - difficulty: beginner/intermediate/advanced
   - isSlang: true/false

3. SLANG TERMS: If any slang or colloquial expressions are present, list them with:
   - term: the slang word/phrase
   - meaning: what it means
   - region: where it's used
   - usage: formal/informal/street
   - example: example sentence
   - popularity: trending/established/emerging

4. TEACHING NOTES: Brief notes on how an AI teacher could use this content in a lesson.

5. CULTURAL CONTEXT: Any cultural background needed to understand this content.

6. TEACHING PATTERN: Analyze the creator's teaching FORMAT so our AI avatar can replicate it:
   - format: "whiteboard" | "direct-camera" | "text-overlay" | "visual-props" | "pronunciation-drill" | "comparison" | "skit" | "other"
   - visualElements: list visual elements used (e.g., "color-coded text", "phonetic spelling", "flags", "mouth close-up", "props")
   - phoneticApproach: how they write pronunciation (e.g., "Spanish phonetic rules for English sounds like (ai gat japi)")
   - repetitionStyle: "pause-and-repeat" | "call-and-response" | "listen-only" | "none"
   - durationCategory: "micro" (<15s) | "short" (15-30s) | "medium" (30-60s) | "long" (60s+)
   - engagementHooks: what they do to keep viewers (e.g., "points at camera", "asks viewer to repeat", "uses humor", "physical demonstration")
   - avatarReplicationScore: 1-10 how easily our AI avatar can replicate this exact format
   - avatarReplicationNotes: what our avatar would need to do/show to replicate this

Respond in JSON format:
{
  "classification": "educational|viral|mixed",
  "extractedPhrases": [...],
  "slangTerms": [...],
  "teachingNotes": "...",
  "culturalContext": "...",
  "teachingPattern": { "format": "...", "visualElements": [...], "phoneticApproach": "...", "repetitionStyle": "...", "durationCategory": "...", "engagementHooks": [...], "avatarReplicationScore": 8, "avatarReplicationNotes": "..." }
}`;

  try {
    const result = await invokeLLM({
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
      response_format: { type: "json_object" },
    });

    const parsed = JSON.parse(result.choices[0]?.message?.content as string);

    const teachingPattern: TeachingPattern | null = parsed.teachingPattern ? {
      format: parsed.teachingPattern.format || "other",
      visualElements: parsed.teachingPattern.visualElements || [],
      phoneticApproach: parsed.teachingPattern.phoneticApproach || null,
      repetitionStyle: parsed.teachingPattern.repetitionStyle || "none",
      durationCategory: parsed.teachingPattern.durationCategory || "short",
      engagementHooks: parsed.teachingPattern.engagementHooks || [],
      avatarReplicationScore: parsed.teachingPattern.avatarReplicationScore || 5,
      avatarReplicationNotes: parsed.teachingPattern.avatarReplicationNotes || "",
    } : null;

    return {
      videoId: video.id,
      classification: parsed.classification || "mixed",
      extractedPhrases: (parsed.extractedPhrases || []).map((p: any) => ({
        original: p.original || "",
        translation: p.translation || "",
        context: p.context || "",
        difficulty: p.difficulty || "intermediate",
        isSlang: p.isSlang || false,
      })),
      teachingNotes: parsed.teachingNotes || null,
      slangTerms: (parsed.slangTerms || []).map((s: any) => ({
        term: s.term || "",
        meaning: s.meaning || "",
        region: s.region || creator.region,
        usage: s.usage || "informal",
        example: s.example || "",
        popularity: s.popularity || "established",
      })),
      culturalContext: parsed.culturalContext || null,
      teachingPattern,
      ingestedAt: new Date().toISOString(),
    };
  } catch (err) {
    console.error(`[TikTok] Classification error for video ${video.id}:`, err);
    return {
      videoId: video.id,
      classification: "mixed",
      extractedPhrases: [],
      teachingNotes: null,
      slangTerms: [],
      culturalContext: null,
      teachingPattern: null,
      ingestedAt: new Date().toISOString(),
    };
  }
}

// ─── PIPELINE ORCHESTRATION ──────────────────────────────────────────────────
/**
 * Run the full ingestion pipeline for a single creator
 */
async function ingestCreator(creator: TikTokCreator): Promise<{
  videosFound: number;
  videosIngested: number;
  phrasesExtracted: number;
  slangTermsFound: number;
}> {
  const stats = { videosFound: 0, videosIngested: 0, phrasesExtracted: 0, slangTermsFound: 0 };

  // 1. Fetch recent videos
  const videos = await fetchCreatorVideos(creator.username);
  stats.videosFound = videos.length;

  // 2. Process each video
  for (const video of videos) {
    // Skip if already ingested
    if (ingestedVideos.has(video.id)) continue;

    // 3. Classify and extract
    const content = await classifyAndExtract(video, creator);
    ingestedVideos.set(video.id, content);
    stats.videosIngested++;
    stats.phrasesExtracted += content.extractedPhrases.length;
    stats.slangTermsFound += content.slangTerms.length;

    // 4. Add slang terms to database
    for (const slang of content.slangTerms) {
      const key = `${slang.term}_${slang.region}`.toLowerCase();
      slangDatabase.set(key, slang);
    }
  }

  // Update creator stats
  const updated = trackedCreators.get(creator.id);
  if (updated) {
    updated.lastChecked = new Date().toISOString();
    updated.totalIngested += stats.videosIngested;
    trackedCreators.set(creator.id, updated);
  }

  return stats;
}

/**
 * Run ingestion for all active creators
 */
async function runFullIngestion(): Promise<{
  creatorsProcessed: number;
  totalVideos: number;
  totalPhrases: number;
  totalSlang: number;
}> {
  const totals = { creatorsProcessed: 0, totalVideos: 0, totalPhrases: 0, totalSlang: 0 };

  const activeCreators = Array.from(trackedCreators.values()).filter((c) => c.isActive);

  for (const creator of activeCreators) {
    const stats = await ingestCreator(creator);
    totals.creatorsProcessed++;
    totals.totalVideos += stats.videosIngested;
    totals.totalPhrases += stats.phrasesExtracted;
    totals.totalSlang += stats.slangTermsFound;
  }

  return totals;
}

// ─── UTILITY FUNCTIONS ───────────────────────────────────────────────────────
function extractHashtags(text: string): string[] {
  const matches = text.match(/#[\w\u00C0-\u024F]+/g);
  return matches ? matches.map((h) => h.slice(1)) : [];
}

function getDateDaysAgo(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().split("T")[0];
}

function getTodayDate(): string {
  return new Date().toISOString().split("T")[0];
}

function generateId(): string {
  return `tt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

// ─── tRPC ROUTER ─────────────────────────────────────────────────────────────
export const tiktokIngestionRouter = router({
  // List all tracked creators
  listCreators: publicProcedure.query(() => {
    return Array.from(trackedCreators.values());
  }),

  // Add a new creator to track
  addCreator: publicProcedure
    .input(z.object({
      username: z.string(),
      displayName: z.string(),
      language: z.string(),
      dialect: z.string(),
      region: z.string(),
      contentFocus: z.array(z.string()),
    }))
    .mutation(({ input }) => {
      const id = generateId();
      const creator: TikTokCreator = {
        id,
        username: input.username.replace("@", ""),
        displayName: input.displayName,
        language: input.language,
        dialect: input.dialect,
        region: input.region,
        followerCount: 0,
        contentFocus: input.contentFocus,
        isActive: true,
        lastChecked: null,
        totalIngested: 0,
        addedAt: new Date().toISOString(),
      };
      trackedCreators.set(id, creator);
      return { success: true, creator };
    }),

  // Remove a creator
  removeCreator: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(({ input }) => {
      trackedCreators.delete(input.id);
      return { success: true };
    }),

  // Toggle creator active status
  toggleCreator: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(({ input }) => {
      const creator = trackedCreators.get(input.id);
      if (creator) {
        creator.isActive = !creator.isActive;
        trackedCreators.set(input.id, creator);
        return { success: true, isActive: creator.isActive };
      }
      return { success: false, isActive: false };
    }),

  // Trigger ingestion for a specific creator
  ingestCreator: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      const creator = trackedCreators.get(input.id);
      if (!creator) return { success: false, error: "Creator not found" };
      const stats = await ingestCreator(creator);
      return { success: true, stats };
    }),

  // Trigger full ingestion run
  runFullIngestion: publicProcedure.mutation(async () => {
    const results = await runFullIngestion();
    return { success: true, results };
  }),

  // Get ingested content stats
  getStats: publicProcedure.query(() => {
    return {
      totalCreators: trackedCreators.size,
      activeCreators: Array.from(trackedCreators.values()).filter((c) => c.isActive).length,
      totalVideosIngested: ingestedVideos.size,
      totalSlangTerms: slangDatabase.size,
      trendingSounds: trendingSounds.size,
    };
  }),

  // Get slang database (paginated)
  getSlangTerms: publicProcedure
    .input(z.object({
      language: z.string().optional(),
      limit: z.number().default(20),
      offset: z.number().default(0),
    }))
    .query(({ input }) => {
      let terms = Array.from(slangDatabase.values());
      if (input.language) {
        // Filter by matching region/language
        terms = terms.filter((t) =>
          t.region.toLowerCase().includes(input.language!.toLowerCase())
        );
      }
      return {
        terms: terms.slice(input.offset, input.offset + input.limit),
        total: terms.length,
      };
    }),

  // Get "Slang of the Day" — picks a random trending slang term
  getSlangOfTheDay: publicProcedure.query(() => {
    const terms = Array.from(slangDatabase.values());
    if (terms.length === 0) {
      // Return a default if no slang has been ingested yet
      return {
        term: "¿Qué lo que?",
        meaning: "What's up? / What's going on?",
        region: "Dominican Republic",
        usage: "Informal greeting used among friends",
        example: "¡Ey, ¿qué lo que, hermano?!",
        popularity: "established" as const,
      };
    }
    // Prefer trending terms
    const trending = terms.filter((t) => t.popularity === "trending");
    const pool = trending.length > 0 ? trending : terms;
    const dayIndex = new Date().getDate() % pool.length;
    return pool[dayIndex];
  }),

  // Fetch trending hashtags
  getTrendingHashtags: publicProcedure
    .input(z.object({ region: z.string().default("US") }))
    .query(async ({ input }) => {
      return await fetchTrendingHashtags(input.region);
    }),
});
