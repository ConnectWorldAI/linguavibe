/**
 * Viral Music Tracker
 * 
 * Tracks trending/viral songs by language and culture for content engagement.
 * Integrates with Airtable for persistent storage and the TV tab for display.
 * 
 * Strategy: If users see content about songs they're hearing everywhere,
 * they stay engaged. Music is as important as learning for retention.
 * 
 * Sources: DJ curation accounts (@djramny), radio stations (@zeta93fm),
 * music pages (@classicalmusicreel), and viral creator content.
 */

import AsyncStorage from "@react-native-async-storage/async-storage";

// ─── AIRTABLE SCHEMA: VIRAL MUSIC TABLE ─────────────────────────────────────

/**
 * Airtable Table: "Viral Music Tracker"
 * 
 * Add this as TABLE 7 in the ConnectWorld AI Creator Intelligence base.
 * 
 * Purpose: Track viral/trending songs by language and culture to:
 * 1. Feed the TV tab "What's Hot" section
 * 2. Generate lyric breakdown content
 * 3. Inform music generation API style parameters
 * 4. Keep the app feeling current and alive
 */
export interface ViralMusicEntry {
  id: string;
  /** Song title */
  title: string;
  /** Artist name(s) */
  artist: string;
  /** Target language of the song */
  language: string;
  /** Specific dialect/region (e.g., "Dominican", "Puerto Rican", "Mexican") */
  dialect: string;
  /** Music genre */
  genre: ViralMusicGenre;
  /** Culture/region the song is popular in */
  culture: string;
  /** Virality score (0-100) based on engagement metrics */
  viralityScore: number;
  /** Source where we discovered this song */
  source: string;
  /** Source URL (Instagram reel, TikTok, etc.) */
  sourceUrl: string;
  /** Date first tracked */
  dateTracked: string;
  /** Date last seen trending */
  lastSeenTrending: string;
  /** Whether lyrics have been extracted and translated */
  lyricsExtracted: boolean;
  /** Whether a vocabulary breakdown has been created */
  vocabBreakdownCreated: boolean;
  /** Whether content has been created around this song */
  contentCreated: boolean;
  /** Key vocabulary/slang terms from the song */
  keyVocabulary: string[];
  /** Cultural context notes */
  culturalContext: string;
  /** Engagement metrics from our platform */
  platformEngagement: {
    views: number;
    likes: number;
    shares: number;
    lessonCompletions: number;
  };
  /** Status in our content pipeline */
  pipelineStatus: "discovered" | "lyrics_extracted" | "vocab_created" | "content_live" | "archived";
}

export type ViralMusicGenre =
  | "dembow"
  | "reggaeton"
  | "salsa"
  | "bachata"
  | "corridos"
  | "cumbia"
  | "trap_latino"
  | "kpop"
  | "jpop"
  | "cpop"
  | "afrobeats"
  | "amapiano"
  | "french_rap"
  | "german_rap"
  | "italian_pop"
  | "fado"
  | "bossa_nova"
  | "funk_carioca"
  | "arabic_pop"
  | "turkish_pop"
  | "russian_pop"
  | "classical"
  | "flamenco"
  | "other";

// Airtable field definitions for the Viral Music table
export const VIRAL_MUSIC_TABLE_FIELDS = [
  { name: "Title", type: "singleLineText" },
  { name: "Artist", type: "singleLineText" },
  { name: "Language", type: "singleSelect", options: [
    "Spanish", "Portuguese", "French", "Japanese", "Korean", "Chinese",
    "Arabic", "German", "Italian", "Russian", "Turkish", "Swahili",
    "Vietnamese", "Thai", "Hindi", "Polish", "Dutch", "Tagalog"
  ]},
  { name: "Dialect/Region", type: "singleLineText" },
  { name: "Genre", type: "singleSelect", options: [
    "Dembow", "Reggaeton", "Salsa", "Bachata", "Corridos", "Cumbia",
    "Trap Latino", "K-Pop", "J-Pop", "C-Pop", "Afrobeats", "Amapiano",
    "French Rap", "German Rap", "Italian Pop", "Fado", "Bossa Nova",
    "Funk Carioca", "Arabic Pop", "Turkish Pop", "Russian Pop",
    "Classical", "Flamenco", "Other"
  ]},
  { name: "Culture", type: "singleLineText" },
  { name: "Virality Score", type: "number", options: { precision: 0 } },
  { name: "Source", type: "singleLineText" },
  { name: "Source URL", type: "url" },
  { name: "Date Tracked", type: "date" },
  { name: "Last Seen Trending", type: "date" },
  { name: "Lyrics Extracted", type: "checkbox" },
  { name: "Vocab Breakdown Created", type: "checkbox" },
  { name: "Content Created", type: "checkbox" },
  { name: "Key Vocabulary", type: "multilineText" },
  { name: "Cultural Context", type: "multilineText" },
  { name: "Platform Views", type: "number" },
  { name: "Platform Likes", type: "number" },
  { name: "Platform Shares", type: "number" },
  { name: "Lesson Completions", type: "number" },
  { name: "Pipeline Status", type: "singleSelect", options: [
    "Discovered", "Lyrics Extracted", "Vocab Created", "Content Live", "Archived"
  ]},
  { name: "Creator (linked)", type: "linkedRecord", table: "Creators" },
];

// ─── LOCAL TRENDING MUSIC STORE ─────────────────────────────────────────────

const TRENDING_STORAGE_KEY = "@connectworld_trending_music";
const TRENDING_CACHE_DURATION = 4 * 60 * 60 * 1000; // 4 hours

export interface TrendingMusicItem {
  id: string;
  title: string;
  artist: string;
  genre: ViralMusicGenre;
  language: string;
  dialect: string;
  coverArt?: string;
  previewUrl?: string;
  viralityScore: number;
  /** Why this is trending (e.g., "Used in 50K+ TikToks this week") */
  trendingReason: string;
  /** Content we've created around this song */
  relatedContent: {
    type: "lyric_breakdown" | "vocab_lesson" | "cultural_context" | "karaoke" | "meme";
    title: string;
    id: string;
  }[];
  /** Tags for content discovery */
  tags: string[];
}

interface TrendingCache {
  items: TrendingMusicItem[];
  lastUpdated: number;
  language: string;
}

/**
 * Get trending music for the user's target language.
 * Returns cached data if fresh, otherwise fetches from server.
 */
export async function getTrendingMusic(language: string): Promise<TrendingMusicItem[]> {
  try {
    const cached = await AsyncStorage.getItem(TRENDING_STORAGE_KEY);
    if (cached) {
      const data: TrendingCache = JSON.parse(cached);
      const isStale = Date.now() - data.lastUpdated > TRENDING_CACHE_DURATION;
      if (!isStale && data.language === language) {
        return data.items;
      }
    }
  } catch {}

  // Return curated seed data for now (server will provide real-time data later)
  const seedData = getSeedTrendingMusic(language);
  
  // Cache it
  try {
    await AsyncStorage.setItem(TRENDING_STORAGE_KEY, JSON.stringify({
      items: seedData,
      lastUpdated: Date.now(),
      language,
    }));
  } catch {}

  return seedData;
}

/**
 * Seed trending music data by language.
 * This is curated content based on our creator research.
 * In production, this would be fetched from Airtable via the server.
 */
function getSeedTrendingMusic(language: string): TrendingMusicItem[] {
  const allTrending: Record<string, TrendingMusicItem[]> = {
    "Spanish": [
      {
        id: "tr_es_001",
        title: "La Mamá de la Mamá",
        artist: "El Alfa",
        genre: "dembow",
        language: "Spanish",
        dialect: "Dominican",
        viralityScore: 95,
        trendingReason: "50M+ streams, used in 200K+ reels this month",
        relatedContent: [
          { type: "lyric_breakdown", title: "Dominican Slang in 'La Mamá de la Mamá'", id: "lb_001" },
          { type: "vocab_lesson", title: "Dembow Vocabulary: Party & Dance", id: "vl_001" },
        ],
        tags: ["dembow", "dominican", "party", "viral", "dance"],
      },
      {
        id: "tr_es_002",
        title: "Baila Conmigo",
        artist: "Selena Gomez & Rauw Alejandro",
        genre: "reggaeton",
        language: "Spanish",
        dialect: "Puerto Rican",
        viralityScore: 88,
        trendingReason: "Billboard Hot 100, trending on TikTok",
        relatedContent: [
          { type: "lyric_breakdown", title: "Reggaeton Love Vocabulary", id: "lb_002" },
          { type: "karaoke", title: "Sing Along: Baila Conmigo", id: "kr_001" },
        ],
        tags: ["reggaeton", "puerto rican", "dance", "love", "bilingual"],
      },
      {
        id: "tr_es_003",
        title: "Ella Baila Sola",
        artist: "Eslabon Armado & Peso Pluma",
        genre: "corridos",
        language: "Spanish",
        dialect: "Mexican",
        viralityScore: 92,
        trendingReason: "#1 on Spotify Global, 1B+ streams",
        relatedContent: [
          { type: "lyric_breakdown", title: "Mexican Corridos Tumbados Vocabulary", id: "lb_003" },
          { type: "cultural_context", title: "The Rise of Corridos Tumbados", id: "cc_001" },
        ],
        tags: ["corridos", "mexican", "regional", "romantic", "viral"],
      },
      {
        id: "tr_es_004",
        title: "Tití Me Preguntó",
        artist: "Bad Bunny",
        genre: "reggaeton",
        language: "Spanish",
        dialect: "Puerto Rican",
        viralityScore: 90,
        trendingReason: "Summer anthem, 2B+ streams, cultural phenomenon",
        relatedContent: [
          { type: "lyric_breakdown", title: "Puerto Rican Slang Deep Dive", id: "lb_004" },
          { type: "vocab_lesson", title: "Street Spanish: Bad Bunny Edition", id: "vl_002" },
          { type: "meme", title: "Bad Bunny Memes Explained", id: "mm_001" },
        ],
        tags: ["reggaeton", "puerto rican", "slang", "summer", "cultural"],
      },
      {
        id: "tr_es_005",
        title: "Provenza",
        artist: "Karol G",
        genre: "reggaeton",
        language: "Spanish",
        dialect: "Colombian",
        viralityScore: 85,
        trendingReason: "Latin Grammy winner, 1.5B+ streams",
        relatedContent: [
          { type: "lyric_breakdown", title: "Colombian Spanish in Karol G Songs", id: "lb_005" },
          { type: "cultural_context", title: "Medellín: Music Capital of Latin America", id: "cc_002" },
        ],
        tags: ["reggaeton", "colombian", "summer", "party", "female artist"],
      },
    ],
    "Portuguese": [
      {
        id: "tr_pt_001",
        title: "Envolver",
        artist: "Anitta",
        genre: "funk_carioca",
        language: "Portuguese",
        dialect: "Brazilian",
        viralityScore: 91,
        trendingReason: "#1 Spotify Global, viral TikTok dance",
        relatedContent: [
          { type: "lyric_breakdown", title: "Brazilian Funk Vocabulary", id: "lb_pt_001" },
          { type: "vocab_lesson", title: "Dance & Body Movement in Portuguese", id: "vl_pt_001" },
        ],
        tags: ["funk", "brazilian", "dance", "viral", "tiktok"],
      },
      {
        id: "tr_pt_002",
        title: "Ai Preto",
        artist: "L7nnon & UCLÃ",
        genre: "funk_carioca",
        language: "Portuguese",
        dialect: "Brazilian",
        viralityScore: 82,
        trendingReason: "Trending in Brazil, 500M+ streams",
        relatedContent: [
          { type: "lyric_breakdown", title: "Rio Favela Slang Breakdown", id: "lb_pt_002" },
        ],
        tags: ["funk", "brazilian", "rio", "slang", "urban"],
      },
    ],
    "Korean": [
      {
        id: "tr_ko_001",
        title: "Supernova",
        artist: "aespa",
        genre: "kpop",
        language: "Korean",
        dialect: "Standard",
        viralityScore: 89,
        trendingReason: "K-pop chart #1, viral choreography",
        relatedContent: [
          { type: "lyric_breakdown", title: "K-Pop Vocabulary: aespa Edition", id: "lb_ko_001" },
          { type: "vocab_lesson", title: "Korean Fan Culture Terms", id: "vl_ko_001" },
        ],
        tags: ["kpop", "dance", "viral", "girl group", "trending"],
      },
      {
        id: "tr_ko_002",
        title: "SPOT!",
        artist: "ZICO ft. JENNIE",
        genre: "kpop",
        language: "Korean",
        dialect: "Standard",
        viralityScore: 93,
        trendingReason: "Viral TikTok challenge, 800M+ views",
        relatedContent: [
          { type: "lyric_breakdown", title: "Korean Slang in ZICO's Lyrics", id: "lb_ko_002" },
          { type: "cultural_context", title: "Korean Hip-Hop Culture", id: "cc_ko_001" },
        ],
        tags: ["kpop", "hiphop", "viral", "tiktok", "collab"],
      },
    ],
    "Japanese": [
      {
        id: "tr_ja_001",
        title: "Idol",
        artist: "YOASOBI",
        genre: "jpop",
        language: "Japanese",
        dialect: "Standard",
        viralityScore: 96,
        trendingReason: "Anime opening (Oshi no Ko), 600M+ YouTube views",
        relatedContent: [
          { type: "lyric_breakdown", title: "YOASOBI Vocabulary: Idol Culture", id: "lb_ja_001" },
          { type: "cultural_context", title: "Anime & J-Pop: Cultural Connection", id: "cc_ja_001" },
        ],
        tags: ["jpop", "anime", "viral", "idol", "cultural"],
      },
    ],
    "French": [
      {
        id: "tr_fr_001",
        title: "Formidable",
        artist: "Stromae",
        genre: "french_rap",
        language: "French",
        dialect: "Belgian/Standard",
        viralityScore: 84,
        trendingReason: "Classic viral hit, still trending on reels",
        relatedContent: [
          { type: "lyric_breakdown", title: "French Emotions Vocabulary via Stromae", id: "lb_fr_001" },
          { type: "vocab_lesson", title: "Everyday French Through Music", id: "vl_fr_001" },
        ],
        tags: ["french", "belgian", "emotional", "classic", "viral"],
      },
    ],
    "Arabic": [
      {
        id: "tr_ar_001",
        title: "Habibi",
        artist: "Ricky Rich & ARAM Mafia",
        genre: "arabic_pop",
        language: "Arabic",
        dialect: "Levantine",
        viralityScore: 80,
        trendingReason: "Cross-cultural viral hit, 400M+ streams",
        relatedContent: [
          { type: "lyric_breakdown", title: "Arabic Love Words in Pop Music", id: "lb_ar_001" },
        ],
        tags: ["arabic", "pop", "love", "crossover", "viral"],
      },
    ],
  };

  return allTrending[language] || allTrending["Spanish"] || [];
}

// ─── ENGAGEMENT TRACKING ────────────────────────────────────────────────────

const MUSIC_ENGAGEMENT_KEY = "@connectworld_music_engagement";

interface MusicEngagement {
  songsViewed: number;
  lyricsRead: number;
  vocabLessonsFromMusic: number;
  karaokeAttempts: number;
  songsShared: number;
  totalTimeOnMusicContent: number; // seconds
  favoriteSongs: string[];
  lastInteraction: number;
}

/**
 * Track user engagement with music content.
 * This data helps us understand what keeps users on the app.
 */
export async function trackMusicEngagement(
  action: "view_song" | "read_lyrics" | "start_vocab" | "karaoke" | "share" | "favorite",
  songId: string,
  durationSeconds?: number
): Promise<void> {
  try {
    const stored = await AsyncStorage.getItem(MUSIC_ENGAGEMENT_KEY);
    const engagement: MusicEngagement = stored ? JSON.parse(stored) : {
      songsViewed: 0,
      lyricsRead: 0,
      vocabLessonsFromMusic: 0,
      karaokeAttempts: 0,
      songsShared: 0,
      totalTimeOnMusicContent: 0,
      favoriteSongs: [],
      lastInteraction: Date.now(),
    };

    switch (action) {
      case "view_song":
        engagement.songsViewed++;
        break;
      case "read_lyrics":
        engagement.lyricsRead++;
        break;
      case "start_vocab":
        engagement.vocabLessonsFromMusic++;
        break;
      case "karaoke":
        engagement.karaokeAttempts++;
        break;
      case "share":
        engagement.songsShared++;
        break;
      case "favorite":
        if (!engagement.favoriteSongs.includes(songId)) {
          engagement.favoriteSongs.push(songId);
        }
        break;
    }

    if (durationSeconds) {
      engagement.totalTimeOnMusicContent += durationSeconds;
    }
    engagement.lastInteraction = Date.now();

    await AsyncStorage.setItem(MUSIC_ENGAGEMENT_KEY, JSON.stringify(engagement));
  } catch {}
}

/**
 * Get music engagement stats for analytics.
 */
export async function getMusicEngagement(): Promise<MusicEngagement | null> {
  try {
    const stored = await AsyncStorage.getItem(MUSIC_ENGAGEMENT_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

// ─── CONTENT GENERATION HELPERS ─────────────────────────────────────────────

/**
 * Generate a lyric breakdown prompt for the LLM.
 * Takes a viral song and creates educational content around it.
 */
export function generateLyricBreakdownPrompt(song: TrendingMusicItem): string {
  return `You are a language teacher creating an engaging lyric breakdown for a viral ${song.language} song.

Song: "${song.title}" by ${song.artist}
Genre: ${song.genre}
Dialect: ${song.dialect}
Why it's trending: ${song.trendingReason}

Create an educational breakdown that includes:
1. **Line-by-line translation** — Original lyrics with English translation side by side
2. **Slang & colloquial terms** — Highlight informal language that textbooks don't teach
3. **Cultural context** — Why certain phrases matter culturally
4. **Pronunciation tips** — How words are actually pronounced vs. formal pronunciation
5. **Grammar notes** — Any interesting grammar patterns (keep it light and fun)
6. **Related vocabulary** — 10 useful words/phrases from the song for daily conversation

Tone: Fun, engaging, like explaining a song to a friend. NOT academic.
Format: Use emojis sparingly. Include the original script if non-Latin alphabet.`;
}

/**
 * Generate a vocabulary lesson prompt based on a trending song's themes.
 */
export function generateMusicVocabPrompt(song: TrendingMusicItem): string {
  return `Create a vocabulary lesson inspired by the viral ${song.language} song "${song.title}" by ${song.artist}.

Genre: ${song.genre} | Dialect: ${song.dialect}
Tags: ${song.tags.join(", ")}

Generate 20 vocabulary items organized by theme:
- 5 words from the song's actual lyrics (with context)
- 5 related words for the song's topic (${song.tags[0]}, ${song.tags[1]})
- 5 slang/informal expressions common in this genre
- 5 cultural references a native speaker would know

For each word provide:
- Original (with pronunciation guide)
- English translation
- Example sentence (natural, not textbook)
- Usage note (formal/informal/slang, when to use it)

Make it feel like learning from a cool friend, not a textbook.`;
}
