/**
 * Trending Vocabulary Router — Server endpoint that uses LLM to generate
 * real-time trending vocabulary, slang, and cultural phrases for each
 * language/dialect. Monitors social media trends, music, news, and
 * viral content to surface the most current vocabulary.
 */

import { publicProcedure, router } from "./_core/trpc";
import { invokeLLM } from "./_core/llm";
import { z } from "zod";

// In-memory cache to avoid hitting LLM on every request
const trendCache = new Map<string, { data: TrendingResponse; timestamp: number }>();
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes

interface TrendingWord {
  word: string;
  translation: string;
  context: string;
  source: string;
  category: string;
  viralScore: number;
  example: string;
}

interface TrendingResponse {
  language: string;
  region: string;
  lastUpdated: string;
  trendingWords: TrendingWord[];
  viralPhrases: { phrase: string; meaning: string; origin: string; platform: string }[];
  musicTrends: { song: string; artist: string; phrase: string; translation: string }[];
  newsTrends: { topic: string; keyVocab: string[]; context: string }[];
}

export const trendingVocabRouter = router({
  /**
   * Get trending vocabulary for a specific language/dialect.
   * Uses LLM to generate culturally-relevant trending content.
   */
  getTrends: publicProcedure
    .input(z.object({
      languageCode: z.string().min(2),
      region: z.string().optional(),
    }))
    .query(async ({ input }) => {
      const cacheKey = `${input.languageCode}_${input.region || "default"}`;
      const cached = trendCache.get(cacheKey);

      if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        return cached.data;
      }

      const languageNames: Record<string, string> = {
        "es-DO": "Dominican Spanish (Dominican Republic)",
        "es-MX": "Mexican Spanish (Mexico)",
        "es-CO": "Colombian Spanish (Colombia)",
        "es-VE": "Venezuelan Spanish (Venezuela)",
        "es-CU": "Cuban Spanish (Cuba)",
        "es-CR": "Costa Rican Spanish (Costa Rica)",
        "es-AR": "Argentine Spanish (Argentina)",
        "es-PE": "Peruvian Spanish (Peru)",
        "es-CL": "Chilean Spanish (Chile)",
        "es-PR": "Puerto Rican Spanish (Puerto Rico)",
        "es": "Standard Spanish (Spain)",
        "fr": "French (France)",
        "fr-HT": "Haitian Creole (Haiti)",
        "fr-QC": "Québécois French (Quebec, Canada)",
        "fr-SN": "Senegalese French (Senegal, West Africa)",
        "pt-BR": "Brazilian Portuguese (Brazil)",
        "pt-PT": "European Portuguese (Portugal)",
        "pt": "Portuguese (Portugal)",
        "ar-EG": "Egyptian Arabic (Egypt)",
        "ar-LB": "Levantine Arabic (Lebanon/Syria)",
        "ar-AE": "Gulf Arabic (UAE/Saudi Arabia)",
        "ja": "Japanese (Japan)",
        "ko": "Korean (South Korea)",
        "zh": "Mandarin Chinese (China)",
        "it": "Italian (Italy)",
        "de": "German (Germany)",
      };

      const langName = languageNames[input.languageCode] || input.languageCode;

      try {
        const response = await invokeLLM({
          messages: [
            {
              role: "system",
              content: `You are a cultural linguist and social media analyst specializing in ${langName}. You monitor social media platforms (TikTok, Instagram, X/Twitter, YouTube), music charts, news, and viral content in this language/region. Generate trending vocabulary that language learners should know RIGHT NOW. Focus on:
1. Viral slang and phrases trending on social media
2. New words from popular music (reggaeton, K-pop, J-pop, etc.)
3. News-related vocabulary from current events
4. Memes and internet culture phrases
5. Street slang that's gaining popularity

Return a JSON object with this structure:
{
  "language": "${input.languageCode}",
  "region": "${langName}",
  "lastUpdated": "ISO date string",
  "trendingWords": [
    {
      "word": "the trending word/phrase in target language",
      "translation": "English translation",
      "context": "How/where it's being used",
      "source": "TikTok/Instagram/Music/News/Street",
      "category": "slang/music/news/meme/culture",
      "viralScore": 85,
      "example": "Example sentence using the word"
    }
  ],
  "viralPhrases": [
    {
      "phrase": "viral phrase in target language",
      "meaning": "what it means",
      "origin": "where it came from",
      "platform": "which platform it's trending on"
    }
  ],
  "musicTrends": [
    {
      "song": "song name",
      "artist": "artist name",
      "phrase": "catchy phrase from the song in target language",
      "translation": "English translation"
    }
  ],
  "newsTrends": [
    {
      "topic": "news topic",
      "keyVocab": ["word1", "word2", "word3"],
      "context": "why this vocabulary matters now"
    }
  ]
}

Generate 10 trending words, 5 viral phrases, 3 music trends, and 3 news trends. Make them authentic, current, and culturally accurate for ${langName}. Use real cultural references.`
            },
            {
              role: "user",
              content: `Generate the latest trending vocabulary and cultural content for ${langName}. Include the most viral slang, music phrases, and news vocabulary that someone learning this language should know right now.`
            }
          ],
          response_format: { type: "json_object" },
        });

        const rawContent = response.choices?.[0]?.message?.content;
        const content = typeof rawContent === 'string' ? rawContent : Array.isArray(rawContent) ? (rawContent[0] as any)?.text || '' : '';
        if (!content) {
          return getFallbackTrends(input.languageCode, langName);
        }

        const parsed = JSON.parse(content) as TrendingResponse;
        parsed.lastUpdated = new Date().toISOString();

        trendCache.set(cacheKey, { data: parsed, timestamp: Date.now() });
        return parsed;
      } catch (error) {
        console.error("Failed to fetch trending vocabulary:", error);
        return getFallbackTrends(input.languageCode, langName);
      }
    }),

  /**
   * Get trending vocabulary categories (for filtering).
   */
  getCategories: publicProcedure.query(() => {
    return [
      { id: "slang", label: "Street Slang", icon: "flame", color: "#EF4444" },
      { id: "music", label: "Music & Lyrics", icon: "musical-notes", color: "#8B5CF6" },
      { id: "news", label: "News & Current Events", icon: "newspaper", color: "#3B82F6" },
      { id: "meme", label: "Memes & Internet", icon: "happy", color: "#F59E0B" },
      { id: "culture", label: "Cultural Phrases", icon: "globe", color: "#10B981" },
    ];
  }),

  /**
   * Refresh trends (force cache invalidation).
   */
  refreshTrends: publicProcedure
    .input(z.object({ languageCode: z.string().min(2) }))
    .mutation(({ input }) => {
      // Clear all caches for this language
      for (const key of trendCache.keys()) {
        if (key.startsWith(input.languageCode)) {
          trendCache.delete(key);
        }
      }
      return { cleared: true };
    }),
});

/**
 * Fallback trends when LLM is unavailable.
 */
function getFallbackTrends(code: string, name: string): TrendingResponse {
  const fallbacks: Record<string, TrendingWord[]> = {
    "es-DO": [
      { word: "Tá to'", translation: "Everything's good", context: "Universal Dominican greeting response", source: "Street", category: "slang", viralScore: 95, example: "¿Cómo tú tá? — Tá to', tranquilo." },
      { word: "Klk", translation: "What's up (text)", context: "Dominican texting abbreviation of 'Qué lo que'", source: "Instagram", category: "meme", viralScore: 90, example: "Klk manín, ¿vamo' pa'l malecón?" },
      { word: "Dembow", translation: "Dominican urban music genre", context: "Dominating Latin music charts globally", source: "Music", category: "music", viralScore: 92, example: "El dembow de El Alfa está pegao' en TikTok." },
      { word: "Jevi", translation: "Cool/awesome", context: "Dominican slang for something great", source: "TikTok", category: "slang", viralScore: 85, example: "Esa fiesta estuvo jevi." },
      { word: "Dique", translation: "Supposedly/apparently", context: "Used constantly in Dominican conversation", source: "Street", category: "slang", viralScore: 88, example: "Dique va a llover hoy." },
    ],
    "fr-HT": [
      { word: "Sak pase", translation: "What's happening", context: "The most common Haitian greeting", source: "Street", category: "slang", viralScore: 95, example: "Sak pase zanmi? N ap boule!" },
      { word: "Krik? Krak!", translation: "Story call-and-response", context: "Traditional storytelling opener trending on social media", source: "TikTok", category: "culture", viralScore: 85, example: "Krik? — Krak! Ti moun, koute yon istwa..." },
      { word: "Kompa", translation: "Haitian music genre", context: "Kompa music going viral on dance challenges", source: "Music", category: "music", viralScore: 90, example: "Nou pral danse kompa nan fèt la." },
    ],
    "pt-BR": [
      { word: "Saudade", translation: "Deep longing/nostalgia", context: "Uniquely Brazilian concept trending in self-care content", source: "Instagram", category: "culture", viralScore: 92, example: "Tô com saudade daquele verão." },
      { word: "Tá ligado", translation: "You know what I mean", context: "Brazilian slang filler phrase", source: "TikTok", category: "slang", viralScore: 88, example: "A festa vai ser top, tá ligado?" },
      { word: "Mano", translation: "Bro/dude", context: "Universal Brazilian informal address", source: "Street", category: "slang", viralScore: 90, example: "E aí mano, bora pro rolê?" },
    ],
    "ar-EG": [
      { word: "يا سلام", translation: "Oh wow/amazing", context: "Egyptian expression of amazement", source: "TikTok", category: "slang", viralScore: 90, example: "يا سلام على الأكل ده!" },
      { word: "حلو أوي", translation: "Very nice/sweet", context: "Common Egyptian compliment", source: "Instagram", category: "slang", viralScore: 85, example: "الفيلم ده حلو أوي." },
      { word: "مهرجانات", translation: "Mahraganat (Egyptian street music)", context: "Egyptian street music genre dominating charts", source: "Music", category: "music", viralScore: 92, example: "المهرجانات بتاعة حسن شاكوش منتشرة في كل حتة." },
    ],
  };

  const words = fallbacks[code] || [
    { word: "Hello", translation: "Greeting", context: "Basic greeting", source: "Street", category: "culture", viralScore: 80, example: "Hello, how are you?" },
  ];

  return {
    language: code,
    region: name,
    lastUpdated: new Date().toISOString(),
    trendingWords: words,
    viralPhrases: [
      { phrase: "Trending phrase", meaning: "Popular expression", origin: "Social media", platform: "TikTok" },
    ],
    musicTrends: [
      { song: "Popular Song", artist: "Local Artist", phrase: "Catchy lyric", translation: "English meaning" },
    ],
    newsTrends: [
      { topic: "Current events", keyVocab: ["word1", "word2"], context: "Relevant vocabulary from recent news" },
    ],
  };
}
