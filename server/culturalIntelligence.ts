/**
 * Cultural Intelligence Pipeline
 * 
 * Aggregates real-time cultural content from TikTok trending, YouTube trending,
 * Google News RSS, and music charts by country/language. AI classifies and enriches
 * content with cultural context, history, slang, and teaching moments.
 * 
 * Delivers through:
 * - AI friend text messages (cultural updates)
 * - In-lesson cultural moments
 * - News reading exercises
 * - Music lesson updates
 * - Push notifications with cultural tidbits
 */

import { z } from "zod";
import { publicProcedure, router } from "./_core/trpc";
import { invokeLLM } from "./_core/llm";
import { callDataApi } from "./_core/dataApi";

// ─── Types ──────────────────────────────────────────────────────────────────

export interface CulturalFeedItem {
  id: string;
  type: "trending_music" | "news" | "viral_content" | "cultural_moment" | "history" | "slang_alert";
  title: string;
  body: string;
  language: string;
  country: string;
  source: string;
  sourceUrl?: string;
  imageUrl?: string;
  /** Teaching moment — vocabulary extracted from this content */
  vocabulary: Array<{
    word: string;
    translation: string;
    context: string;
  }>;
  /** AI friend message version — casual, conversational delivery */
  friendMessage: string;
  /** Cultural/historical context */
  culturalContext: string;
  /** Urgency: how time-sensitive is this content */
  urgency: "breaking" | "trending" | "evergreen";
  /** Engagement score 0-100 */
  relevanceScore: number;
  timestamp: string;
}

export interface CulturalFeedResponse {
  language: string;
  country: string;
  lastUpdated: string;
  items: CulturalFeedItem[];
  aiGreeting: string; // AI friend opening message
  dailyFact: string; // Fun cultural fact of the day
}

interface AiFriendMessage {
  id: string;
  senderName: string;
  senderEmoji: string;
  message: string;
  relatedVocab: Array<{ word: string; meaning: string }>;
  category: "music" | "news" | "culture" | "slang" | "history";
  timestamp: string;
  actionLabel?: string;
  actionRoute?: string;
}

// ─── Cache ──────────────────────────────────────────────────────────────────

export const feedCache = new Map<string, { data: CulturalFeedResponse; timestamp: number }>();
export const FEED_CACHE_TTL = 15 * 60 * 1000; // 15 minutes

const messageCache = new Map<string, { data: AiFriendMessage[]; timestamp: number }>();
const MSG_CACHE_TTL = 30 * 60 * 1000; // 30 minutes

// ─── Language/Country Mapping ───────────────────────────────────────────────

export const LANGUAGE_COUNTRY_MAP: Record<string, { country: string; flag: string; region: string; newsLang: string }> = {
  "es-DO": { country: "Dominican Republic", flag: "🇩🇴", region: "Caribbean", newsLang: "es" },
  "es-MX": { country: "Mexico", flag: "🇲🇽", region: "North America", newsLang: "es" },
  "es-CO": { country: "Colombia", flag: "🇨🇴", region: "South America", newsLang: "es" },
  "es-PR": { country: "Puerto Rico", flag: "🇵🇷", region: "Caribbean", newsLang: "es" },
  "es-AR": { country: "Argentina", flag: "🇦🇷", region: "South America", newsLang: "es" },
  "es-VE": { country: "Venezuela", flag: "🇻🇪", region: "South America", newsLang: "es" },
  "es-CU": { country: "Cuba", flag: "🇨🇺", region: "Caribbean", newsLang: "es" },
  "es-CR": { country: "Costa Rica", flag: "🇨🇷", region: "Central America", newsLang: "es" },
  "es-PE": { country: "Peru", flag: "🇵🇪", region: "South America", newsLang: "es" },
  "es-CL": { country: "Chile", flag: "🇨🇱", region: "South America", newsLang: "es" },
  "es": { country: "Spain", flag: "🇪🇸", region: "Europe", newsLang: "es" },
  "fr": { country: "France", flag: "🇫🇷", region: "Europe", newsLang: "fr" },
  "fr-HT": { country: "Haiti", flag: "🇭🇹", region: "Caribbean", newsLang: "fr" },
  "fr-SN": { country: "Senegal", flag: "🇸🇳", region: "West Africa", newsLang: "fr" },
  "pt-BR": { country: "Brazil", flag: "🇧🇷", region: "South America", newsLang: "pt" },
  "pt-PT": { country: "Portugal", flag: "🇵🇹", region: "Europe", newsLang: "pt" },
  "ja": { country: "Japan", flag: "🇯🇵", region: "East Asia", newsLang: "ja" },
  "ko": { country: "South Korea", flag: "🇰🇷", region: "East Asia", newsLang: "ko" },
  "zh": { country: "China", flag: "🇨🇳", region: "East Asia", newsLang: "zh" },
  "it": { country: "Italy", flag: "🇮🇹", region: "Europe", newsLang: "it" },
  "de": { country: "Germany", flag: "🇩🇪", region: "Europe", newsLang: "de" },
  "ar-EG": { country: "Egypt", flag: "🇪🇬", region: "Middle East", newsLang: "ar" },
  "ar-LB": { country: "Lebanon", flag: "🇱🇧", region: "Middle East", newsLang: "ar" },
};

// ─── Data Fetchers ──────────────────────────────────────────────────────────

async function fetchTikTokTrending(country: string, language: string): Promise<any[]> {
  try {
    const result = await callDataApi("Tiktok/search_tiktok_video_general", {
      query: {
        keyword: `trending ${country} ${language}`,
        count: 10,
        sort_type: 1, // relevance
      },
    }) as any;
    return result?.data?.videos || result?.videos || [];
  } catch (err) {
    console.error("[CulturalIntel] TikTok fetch failed:", err);
    return [];
  }
}

async function fetchYouTubeTrending(country: string, language: string): Promise<any[]> {
  try {
    const countryCode = Object.entries(LANGUAGE_COUNTRY_MAP).find(
      ([, v]) => v.country === country
    )?.[0]?.split("-")[1] || "US";

    const result = await callDataApi("Youtube/search", {
      query: {
        q: `trending ${country} music culture news`,
        gl: countryCode,
        hl: language.split("-")[0],
      },
    }) as any;
    return result?.data || result?.results || [];
  } catch (err) {
    console.error("[CulturalIntel] YouTube fetch failed:", err);
    return [];
  }
}

async function fetchGoogleNewsRSS(newsLang: string, country: string): Promise<Array<{ title: string; link: string; source: string }>> {
  try {
    // Google News RSS feed by language/region
    const countryCode = Object.entries(LANGUAGE_COUNTRY_MAP).find(
      ([, v]) => v.country === country
    )?.[0]?.split("-")[1]?.toUpperCase() || "US";

    const rssUrl = `https://news.google.com/rss?hl=${newsLang}&gl=${countryCode}&ceid=${countryCode}:${newsLang}`;
    const response = await fetch(rssUrl);
    const xml = await response.text();

    // Simple XML parsing for RSS items
    const items: Array<{ title: string; link: string; source: string }> = [];
    const itemMatches = xml.match(/<item>([\s\S]*?)<\/item>/g) || [];

    for (const item of itemMatches.slice(0, 10)) {
      const titleMatch = item.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/) || item.match(/<title>(.*?)<\/title>/);
      const linkMatch = item.match(/<link>(.*?)<\/link>/);
      const sourceMatch = item.match(/<source[^>]*>(.*?)<\/source>/);

      if (titleMatch) {
        items.push({
          title: titleMatch[1].replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">"),
          link: linkMatch?.[1] || "",
          source: sourceMatch?.[1] || "Google News",
        });
      }
    }

    return items;
  } catch (err) {
    console.error("[CulturalIntel] Google News RSS fetch failed:", err);
    return [];
  }
}

// ─── AI Enrichment ──────────────────────────────────────────────────────────

async function enrichWithAI(
  rawData: {
    tiktokVideos: any[];
    youtubeVideos: any[];
    newsItems: Array<{ title: string; link: string; source: string }>;
  },
  language: string,
  country: string,
  flag: string,
): Promise<CulturalFeedResponse> {
  const langInfo = LANGUAGE_COUNTRY_MAP[language] || { country, flag: "🌍", region: "Global", newsLang: "en" };

  const systemPrompt = `You are a cultural intelligence analyst for ${country} ${flag}. You help language learners understand what's happening RIGHT NOW in ${country} — trending music, viral content, news, cultural events, and street slang.

Your job is to take raw data from TikTok, YouTube, and news sources and transform it into engaging, educational cultural feed items for language learners.

For each item, you MUST:
1. Write a catchy title and informative body
2. Extract 2-3 vocabulary words that learners should know from this content
3. Write an "AI friend message" — a casual, conversational text as if a local friend is texting the learner about this
4. Add cultural/historical context that helps learners understand WHY this matters
5. Rate relevance 0-100

Return valid JSON:
{
  "items": [
    {
      "type": "trending_music" | "news" | "viral_content" | "cultural_moment" | "history" | "slang_alert",
      "title": "catchy title",
      "body": "2-3 sentence description",
      "source": "TikTok/YouTube/News",
      "vocabulary": [{ "word": "word in target language", "translation": "English", "context": "how it's used" }],
      "friendMessage": "Hey! Did you see that Bad Bunny just... (casual text message style)",
      "culturalContext": "This matters because...",
      "urgency": "breaking" | "trending" | "evergreen",
      "relevanceScore": 85
    }
  ],
  "aiGreeting": "A warm greeting from the AI friend in the target language with translation",
  "dailyFact": "A fun cultural fact about ${country} that most people don't know"
}

Generate 8-12 items mixing music, news, viral content, cultural moments, and slang. Make the friend messages feel authentic — like a real person from ${country} texting their friend.`;

  const tiktokSummary = rawData.tiktokVideos.slice(0, 5).map((v: any) => 
    `TikTok: "${v.desc || v.title || v.caption || "trending video"}" (${v.play_count || v.views || "?"} views)`
  ).join("\n");

  const youtubeSummary = rawData.youtubeVideos.slice(0, 5).map((v: any) =>
    `YouTube: "${v.title || v.snippet?.title || "trending video"}" by ${v.channelTitle || v.snippet?.channelTitle || "unknown"}`
  ).join("\n");

  const newsSummary = rawData.newsItems.slice(0, 8).map(n =>
    `News (${n.source}): ${n.title}`
  ).join("\n");

  const userPrompt = `Here's what's happening in ${country} right now. Transform this into cultural feed items for a language learner studying ${language}:

=== TikTok Trending ===
${tiktokSummary || "No TikTok data available — generate based on your knowledge of current trends"}

=== YouTube Trending ===
${youtubeSummary || "No YouTube data available — generate based on your knowledge of current trends"}

=== News Headlines ===
${newsSummary || "No news data available — generate based on your knowledge of current events"}

Generate cultural feed items that teach the learner about what's happening in ${country} RIGHT NOW. Include music, news, viral content, cultural moments, and slang.`;

  try {
    const response = await invokeLLM({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      response_format: { type: "json_object" },
    });

    const rawContent = response.choices?.[0]?.message?.content;
    const content = typeof rawContent === "string"
      ? rawContent
      : Array.isArray(rawContent) ? (rawContent[0] as any)?.text || "" : "";

    if (!content) throw new Error("Empty LLM response");

    const parsed = JSON.parse(content);
    const now = new Date().toISOString();

    return {
      language,
      country,
      lastUpdated: now,
      items: (parsed.items || []).map((item: any, idx: number) => ({
        id: `ci_${language}_${Date.now()}_${idx}`,
        type: item.type || "cultural_moment",
        title: item.title || "Cultural Update",
        body: item.body || "",
        language,
        country,
        source: item.source || "AI Analysis",
        sourceUrl: item.sourceUrl,
        imageUrl: item.imageUrl,
        vocabulary: item.vocabulary || [],
        friendMessage: item.friendMessage || "",
        culturalContext: item.culturalContext || "",
        urgency: item.urgency || "trending",
        relevanceScore: item.relevanceScore || 50,
        timestamp: now,
      })),
      aiGreeting: parsed.aiGreeting || `¡Hola! Here's what's happening in ${country} today!`,
      dailyFact: parsed.dailyFact || `${country} has a rich cultural heritage that influences the world.`,
    };
  } catch (err) {
    console.error("[CulturalIntel] AI enrichment failed:", err);
    return generateFallbackFeed(language, country, flag);
  }
}

function generateFallbackFeed(language: string, country: string, flag: string): CulturalFeedResponse {
  const now = new Date().toISOString();
  return {
    language,
    country,
    lastUpdated: now,
    items: [
      {
        id: `ci_fallback_1`,
        type: "cultural_moment",
        title: `${flag} Discover ${country} Today`,
        body: `Explore the vibrant culture, music, and daily life of ${country}. Every day brings new vocabulary and cultural insights!`,
        language,
        country,
        source: "LinguaVibe",
        vocabulary: [],
        friendMessage: `Hey! I wanted to share some cool stuff about ${country} with you. Check it out! 🎶`,
        culturalContext: `${country} has a rich cultural tapestry that influences music, food, and language worldwide.`,
        urgency: "evergreen",
        relevanceScore: 70,
        timestamp: now,
      },
    ],
    aiGreeting: `${flag} Welcome! Let's explore what's happening in ${country}!`,
    dailyFact: `${country} is known for its unique blend of traditions and modern culture.`,
  };
}

// ─── AI Friend Message Generator ────────────────────────────────────────────

async function generateAiFriendMessages(
  feedItems: CulturalFeedItem[],
  language: string,
  country: string,
  learnerLevel: string,
): Promise<AiFriendMessage[]> {
  const friendNames: Record<string, { name: string; emoji: string }> = {
    "es-DO": { name: "María", emoji: "🇩🇴" },
    "es-MX": { name: "Carlos", emoji: "🇲🇽" },
    "es-CO": { name: "Valentina", emoji: "🇨🇴" },
    "es-PR": { name: "Luis", emoji: "🇵🇷" },
    "es-AR": { name: "Sofía", emoji: "🇦🇷" },
    "fr": { name: "Camille", emoji: "🇫🇷" },
    "fr-HT": { name: "Jean-Pierre", emoji: "🇭🇹" },
    "pt-BR": { name: "Lucas", emoji: "🇧🇷" },
    "ja": { name: "Yuki", emoji: "🇯🇵" },
    "ko": { name: "Min-jun", emoji: "🇰🇷" },
    "it": { name: "Marco", emoji: "🇮🇹" },
    "de": { name: "Lena", emoji: "🇩🇪" },
    "ar-EG": { name: "Ahmed", emoji: "🇪🇬" },
  };

  const friend = friendNames[language] || { name: "Alex", emoji: "🌍" };

  const systemPrompt = `You are ${friend.name} ${friend.emoji}, a friendly local from ${country} who texts your language-learner friend about what's happening in your country. You're casual, warm, and love sharing your culture.

The learner is at ${learnerLevel} level, so adjust vocabulary complexity accordingly:
- A1/A2: Simple words, mostly English with key words in target language
- B1/B2: Mix of both languages, more complex cultural references
- C1/C2: Mostly target language with cultural nuances

Take these cultural feed items and create 5-8 text messages as if you're texting your friend throughout the day. Each message should:
1. Feel like a real text (short, casual, with emoji)
2. Include 1-2 vocabulary words with quick translations
3. Have a category (music/news/culture/slang/history)
4. Optionally suggest an action (listen to song, read article, practice phrase)

Return JSON:
{
  "messages": [
    {
      "message": "the text message content",
      "relatedVocab": [{ "word": "word", "meaning": "meaning" }],
      "category": "music|news|culture|slang|history",
      "actionLabel": "Listen Now|Read More|Practice This|null",
      "actionRoute": "/song-lesson|/cultural-feed|null"
    }
  ]
}`;

  const itemSummary = feedItems.slice(0, 8).map(item =>
    `[${item.type}] ${item.title}: ${item.body}`
  ).join("\n");

  try {
    const response = await invokeLLM({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Here's what's happening in ${country}. Create text messages from ${friend.name} to the learner:\n\n${itemSummary}` },
      ],
      response_format: { type: "json_object" },
    });

    const rawContent = response.choices?.[0]?.message?.content;
    const content = typeof rawContent === "string"
      ? rawContent
      : Array.isArray(rawContent) ? (rawContent[0] as any)?.text || "" : "";

    const parsed = JSON.parse(content);
    const now = new Date().toISOString();

    return (parsed.messages || []).map((msg: any, idx: number) => ({
      id: `afm_${language}_${Date.now()}_${idx}`,
      senderName: friend.name,
      senderEmoji: friend.emoji,
      message: msg.message || "",
      relatedVocab: msg.relatedVocab || [],
      category: msg.category || "culture",
      timestamp: now,
      actionLabel: msg.actionLabel || undefined,
      actionRoute: msg.actionRoute || undefined,
    }));
  } catch (err) {
    console.error("[CulturalIntel] AI friend messages failed:", err);
    return [{
      id: `afm_fallback_${Date.now()}`,
      senderName: friend.name,
      senderEmoji: friend.emoji,
      message: `Hey! 👋 Just wanted to check in. Have you been practicing your ${language.split("-")[0] === "es" ? "Spanish" : language}? There's so much cool stuff happening in ${country} right now!`,
      relatedVocab: [],
      category: "culture",
      timestamp: new Date().toISOString(),
    }];
  }
}

// ─── Push Notification Content ──────────────────────────────────────────────

function generatePushContent(items: CulturalFeedItem[]): Array<{ title: string; body: string; data: Record<string, string> }> {
  return items
    .filter(item => item.relevanceScore >= 70)
    .slice(0, 3)
    .map(item => ({
      title: item.type === "trending_music" ? "🎵 New Music Alert" :
             item.type === "news" ? "📰 News in Your Language" :
             item.type === "slang_alert" ? "🗣️ New Slang Alert" :
             item.type === "viral_content" ? "🔥 Trending Now" :
             "🌍 Cultural Update",
      body: item.friendMessage.length > 100
        ? item.friendMessage.substring(0, 97) + "..."
        : item.friendMessage,
      data: {
        type: "cultural_feed",
        itemId: item.id,
        route: "/cultural-feed",
      },
    }));
}

// ─── Router ─────────────────────────────────────────────────────────────────

export const culturalIntelligenceRouter = router({
  /**
   * Get the cultural feed for a language/country.
   * Aggregates TikTok, YouTube, News, and AI enrichment.
   */
  getFeed: publicProcedure
    .input(z.object({
      languageCode: z.string().min(2),
      forceRefresh: z.boolean().optional(),
    }))
    .query(async ({ input }) => {
      const cacheKey = input.languageCode;

      if (!input.forceRefresh) {
        const cached = feedCache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < FEED_CACHE_TTL) {
          return cached.data;
        }
      }

      const langInfo = LANGUAGE_COUNTRY_MAP[input.languageCode];
      const country = langInfo?.country || "Unknown";
      const flag = langInfo?.flag || "🌍";
      const newsLang = langInfo?.newsLang || "en";

      // Fetch from all sources in parallel
      const [tiktokVideos, youtubeVideos, newsItems] = await Promise.all([
        fetchTikTokTrending(country, input.languageCode),
        fetchYouTubeTrending(country, input.languageCode),
        fetchGoogleNewsRSS(newsLang, country),
      ]);

      // AI enrichment
      const feed = await enrichWithAI(
        { tiktokVideos, youtubeVideos, newsItems },
        input.languageCode,
        country,
        flag,
      );

      feedCache.set(cacheKey, { data: feed, timestamp: Date.now() });
      return feed;
    }),

  /**
   * Get AI friend text messages based on cultural feed.
   * These are casual, conversational messages from a virtual local friend.
   */
  getAiFriendMessages: publicProcedure
    .input(z.object({
      languageCode: z.string().min(2),
      learnerLevel: z.string().default("A1"),
      forceRefresh: z.boolean().optional(),
    }))
    .query(async ({ input }) => {
      const cacheKey = `${input.languageCode}_${input.learnerLevel}`;

      if (!input.forceRefresh) {
        const cached = messageCache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < MSG_CACHE_TTL) {
          return { messages: cached.data };
        }
      }

      // First get the cultural feed
      const langInfo = LANGUAGE_COUNTRY_MAP[input.languageCode];
      const country = langInfo?.country || "Unknown";

      const feedCacheKey = input.languageCode;
      let feedItems: CulturalFeedItem[];

      const cachedFeed = feedCache.get(feedCacheKey);
      if (cachedFeed && Date.now() - cachedFeed.timestamp < FEED_CACHE_TTL) {
        feedItems = cachedFeed.data.items;
      } else {
        // Generate a quick feed
        const [tiktokVideos, youtubeVideos, newsItems] = await Promise.all([
          fetchTikTokTrending(country, input.languageCode),
          fetchYouTubeTrending(country, input.languageCode),
          fetchGoogleNewsRSS(langInfo?.newsLang || "en", country),
        ]);

        const feed = await enrichWithAI(
          { tiktokVideos, youtubeVideos, newsItems },
          input.languageCode,
          country,
          langInfo?.flag || "🌍",
        );
        feedCache.set(feedCacheKey, { data: feed, timestamp: Date.now() });
        feedItems = feed.items;
      }

      // Generate AI friend messages
      const messages = await generateAiFriendMessages(
        feedItems,
        input.languageCode,
        country,
        input.learnerLevel,
      );

      messageCache.set(cacheKey, { data: messages, timestamp: Date.now() });
      return { messages };
    }),

  /**
   * Get push notification content for cultural updates.
   * Returns pre-formatted notification payloads ready to send.
   */
  getPushContent: publicProcedure
    .input(z.object({
      languageCode: z.string().min(2),
    }))
    .query(async ({ input }) => {
      const cached = feedCache.get(input.languageCode);
      if (cached) {
        return { notifications: generatePushContent(cached.data.items) };
      }

      // No cached feed — return empty
      return { notifications: [] };
    }),

  /**
   * Force refresh the cultural feed for a language.
   */
  refreshFeed: publicProcedure
    .input(z.object({
      languageCode: z.string().min(2),
    }))
    .mutation(({ input }) => {
      feedCache.delete(input.languageCode);
      for (const key of messageCache.keys()) {
        if (key.startsWith(input.languageCode)) {
          messageCache.delete(key);
        }
      }
      return { cleared: true };
    }),

  /**
   * Get supported languages/countries for cultural intelligence.
   */
  getSupportedLanguages: publicProcedure.query(() => {
    return Object.entries(LANGUAGE_COUNTRY_MAP).map(([code, info]) => ({
      code,
      country: info.country,
      flag: info.flag,
      region: info.region,
    }));
  }),
});
