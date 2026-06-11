import { z } from "zod";
import { publicProcedure, router } from "./_core/trpc";
import { invokeLLM } from "./_core/llm";
import { notifyIngestionResults } from "./ingestionNotificationTrigger";
import { createHeartbeatJob, deleteHeartbeatJob, listHeartbeatJobs, updateHeartbeatJob } from "./_core/heartbeat";
import { parse as parseCookie } from "cookie";
import { COOKIE_NAME } from "../shared/const";

/**
 * Auto-Ingestion Scheduler
 * 
 * Architecture:
 * 1. Admin adds "seed channels" (YouTube channels, Instagram accounts) tagged by language/dialect
 * 2. A daily heartbeat cron job checks all seed channels for new content
 * 3. New content is scraped via Apify, validated by AI, and stored in the knowledge base
 * 4. AI teachers automatically get fresh, current knowledge without admin intervention
 * 
 * The admin's only job is to add seed sources once — the system handles everything after that.
 */

// In-memory seed channel store (will be DB-backed in production)
export interface SeedChannel {
  id: string;
  url: string; // Channel/account URL (e.g., https://youtube.com/@bilingueblogs)
  name: string; // Display name
  platform: "youtube" | "instagram" | "tiktok" | "other";
  language: string;
  dialect: string;
  isActive: boolean;
  lastChecked: string | null;
  lastNewContent: string | null;
  totalIngested: number;
  addedAt: string;
  cronTaskUid?: string; // Heartbeat job ID if scheduled
}

// In-memory store
const seedChannels: Map<string, SeedChannel> = new Map();

// Pre-seed featured creators — these are always available as content sources
const FEATURED_CREATORS: SeedChannel[] = [
  {
    id: "seed_featured_spanishovertea",
    url: "https://www.instagram.com/spanishovertea",
    name: "Spanish Over Tea ☕",
    platform: "instagram",
    language: "Spanish",
    dialect: "Dominican",
    isActive: true,
    lastChecked: null,
    lastNewContent: null,
    totalIngested: 0,
    addedAt: "2025-01-01T00:00:00.000Z",
  },
  {
    id: "seed_featured_bilingueblogs",
    url: "https://www.instagram.com/bilingueblogs",
    name: "Bilingüe Blogs 🗣️",
    platform: "instagram",
    language: "Spanish",
    dialect: "Multi-Dialect",
    isActive: true,
    lastChecked: null,
    lastNewContent: null,
    totalIngested: 0,
    addedAt: "2025-01-01T00:00:00.000Z",
  },
  {
    id: "seed_featured_natasha_fig",
    url: "https://www.instagram.com/natasha_fig",
    name: "Natasha Fig 🇩🇴",
    platform: "instagram",
    language: "Spanish",
    dialect: "Dominican",
    isActive: true,
    lastChecked: null,
    lastNewContent: null,
    totalIngested: 0,
    addedAt: "2025-01-01T00:00:00.000Z",
  },
  {
    id: "seed_featured_haitian_proudd",
    url: "https://www.instagram.com/haitian.proudd",
    name: "Haitian Proudd 🇭🇹",
    platform: "instagram",
    language: "Haitian Creole",
    dialect: "Standard",
    isActive: true,
    lastChecked: null,
    lastNewContent: null,
    totalIngested: 0,
    addedAt: "2026-05-27T00:00:00.000Z",
  },
  {
    id: "seed_featured_englishwith_herold",
    url: "https://www.instagram.com/englishwith.herold",
    name: "English with Herold 🇭🇹",
    platform: "instagram",
    language: "Haitian Creole",
    dialect: "Standard",
    isActive: true,
    lastChecked: null,
    lastNewContent: null,
    totalIngested: 0,
    addedAt: "2026-05-27T00:00:00.000Z",
  },
  {
    id: "seed_featured_itsaihistory",
    url: "https://www.instagram.com/itsaihistory",
    name: "ItsAI History 🌍",
    platform: "instagram",
    language: "Multi-Language",
    dialect: "Historical Linguistics",
    isActive: true,
    lastChecked: null,
    lastNewContent: null,
    totalIngested: 0,
    addedAt: "2026-05-27T00:00:00.000Z",
  },
  {
    id: "seed_featured_yourspanishwithjavier",
    url: "https://www.instagram.com/yourspanishwithjavier",
    name: "Your Spanish with Javier 🇨🇴",
    platform: "instagram",
    language: "Spanish",
    dialect: "Colombian",
    isActive: true,
    lastChecked: null,
    lastNewContent: null,
    totalIngested: 0,
    addedAt: "2026-06-01T00:00:00.000Z",
  },
  // @spanishwithtuta — cross-platform ingestion (Instagram + TikTok + Facebook)
  {
    id: "seed_featured_spanishwithtuta_ig",
    url: "https://www.instagram.com/spanishwithtuta",
    name: "Spanish with Tuta 🇨🇴 (IG)",
    platform: "instagram",
    language: "Spanish",
    dialect: "Colombian/General Latin American",
    isActive: true,
    lastChecked: null,
    lastNewContent: null,
    totalIngested: 0,
    addedAt: "2026-06-02T00:00:00.000Z",
  },
  {
    id: "seed_featured_spanishwithtuta_tt",
    url: "https://www.tiktok.com/@spanishwithtuta",
    name: "Spanish with Tuta 🇨🇴 (TikTok)",
    platform: "tiktok",
    language: "Spanish",
    dialect: "Colombian/General Latin American",
    isActive: true,
    lastChecked: null,
    lastNewContent: null,
    totalIngested: 0,
    addedAt: "2026-06-02T00:00:00.000Z",
  },
  {
    id: "seed_featured_spanishwithtuta_fb",
    url: "https://www.facebook.com/spanishwithtuta",
    name: "Spanish with Tuta 🇨🇴 (Facebook)",
    platform: "other",
    language: "Spanish",
    dialect: "Colombian/General Latin American",
    isActive: true,
    lastChecked: null,
    lastNewContent: null,
    totalIngested: 0,
    addedAt: "2026-06-02T00:00:00.000Z",
  },
  {
    id: "seed_featured_zigintranslation",
    url: "https://www.tiktok.com/@zigintranslation",
    name: "Zig 🇩🇴",
    platform: "tiktok",
    language: "Spanish",
    dialect: "Dominican",
    isActive: true,
    lastChecked: null,
    lastNewContent: null,
    totalIngested: 0,
    addedAt: "2026-06-07T00:00:00.000Z",
  },
];

// Initialize with featured creators
for (const creator of FEATURED_CREATORS) {
  seedChannels.set(creator.id, { ...creator });
}

// Track what URLs we've already ingested to avoid duplicates
const ingestedUrls: Set<string> = new Set();

function generateId(): string {
  return `seed_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function detectPlatform(url: string): "youtube" | "instagram" | "tiktok" | "other" {
  if (url.includes("youtube.com") || url.includes("youtu.be")) return "youtube";
  if (url.includes("instagram.com")) return "instagram";
  if (url.includes("tiktok.com")) return "tiktok";
  return "other";
}

/**
 * Discover recent videos/posts from a YouTube channel or Instagram account.
 * Uses Apify to crawl the channel and find recent content URLs.
 */
async function discoverNewContent(channel: SeedChannel): Promise<string[]> {
  const apifyToken = process.env.APIFY_API_TOKEN;
  if (!apifyToken) return [];

  const newUrls: string[] = [];

  try {
    if (channel.platform === "youtube") {
      // Use Apify YouTube Channel Scraper to get recent videos
      const response = await fetch(
        `https://api.apify.com/v2/acts/apify~youtube-scraper/runs?token=${apifyToken}&waitForFinish=120`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            startUrls: [{ url: channel.url }],
            maxResults: 5, // Get last 5 videos
            maxResultsShorts: 0,
            maxResultStreams: 0,
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        const datasetId = data?.data?.defaultDatasetId;
        if (datasetId) {
          await new Promise(resolve => setTimeout(resolve, 5000));
          const resultsResp = await fetch(
            `https://api.apify.com/v2/datasets/${datasetId}/items?token=${apifyToken}`
          );
          if (resultsResp.ok) {
            const results = await resultsResp.json();
            for (const item of results) {
              const videoUrl = item.url || item.videoUrl;
              if (videoUrl && !ingestedUrls.has(videoUrl)) {
                newUrls.push(videoUrl);
              }
            }
          }
        }
      }
    } else if (channel.platform === "instagram") {
      // Use Apify Instagram Scraper for recent posts
      const response = await fetch(
        `https://api.apify.com/v2/acts/apify~instagram-scraper/runs?token=${apifyToken}&waitForFinish=120`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            directUrls: [channel.url],
            resultsType: "posts",
            resultsLimit: 5,
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        const datasetId = data?.data?.defaultDatasetId;
        if (datasetId) {
          await new Promise(resolve => setTimeout(resolve, 5000));
          const resultsResp = await fetch(
            `https://api.apify.com/v2/datasets/${datasetId}/items?token=${apifyToken}`
          );
          if (resultsResp.ok) {
            const results = await resultsResp.json();
            for (const item of results) {
              const postUrl = item.url || item.shortCode ? `https://instagram.com/p/${item.shortCode}` : null;
              if (postUrl && !ingestedUrls.has(postUrl)) {
                newUrls.push(postUrl);
              }
            }
          }
        }
      }
    } else {
      // Generic: use web content crawler on the channel page to find links
      const response = await fetch(
        `https://api.apify.com/v2/acts/apify~website-content-crawler/runs?token=${apifyToken}&waitForFinish=60`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            startUrls: [{ url: channel.url }],
            maxCrawlPages: 5,
            crawlerType: "cheerio",
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        const datasetId = data?.data?.defaultDatasetId;
        if (datasetId) {
          await new Promise(resolve => setTimeout(resolve, 5000));
          const resultsResp = await fetch(
            `https://api.apify.com/v2/datasets/${datasetId}/items?token=${apifyToken}`
          );
          if (resultsResp.ok) {
            const results = await resultsResp.json();
            for (const item of results) {
              if (item.url && !ingestedUrls.has(item.url)) {
                newUrls.push(item.url);
              }
            }
          }
        }
      }
    }
  } catch (err) {
    console.error(`[AutoIngest] Error discovering content for ${channel.name}:`, err);
  }

  return newUrls.slice(0, 3); // Limit to 3 new items per check to control costs
}

/**
 * Process a single URL: scrape, extract, validate, store.
 * This is the same pipeline as the manual ingestContent but automated.
 */
async function processUrl(url: string, channel: SeedChannel): Promise<{ success: boolean; error?: string }> {
  const apifyToken = process.env.APIFY_API_TOKEN;
  if (!apifyToken) return { success: false, error: "No Apify token" };

  try {
    let transcript = "";
    let title = "";

    // Scrape the content
    if (channel.platform === "youtube") {
      const runResponse = await fetch(
        `https://api.apify.com/v2/acts/bernardo~youtube-transcript-scraper/runs?token=${apifyToken}&waitForFinish=120`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ startUrls: [{ url }], maxResults: 1 }),
        }
      );

      if (runResponse.ok) {
        const runData = await runResponse.json();
        const datasetId = runData?.data?.defaultDatasetId;
        if (datasetId) {
          await new Promise(resolve => setTimeout(resolve, 10000));
          const resultsResp = await fetch(
            `https://api.apify.com/v2/datasets/${datasetId}/items?token=${apifyToken}`
          );
          if (resultsResp.ok) {
            const results = await resultsResp.json();
            if (results.length > 0) {
              transcript = results[0].captions || results[0].transcript || results[0].text || "";
              title = results[0].title || results[0].videoTitle || "YouTube Content";
            }
          }
        }
      }
    }

    // Fallback: use web content crawler
    if (!transcript) {
      const crawlerResponse = await fetch(
        `https://api.apify.com/v2/acts/apify~website-content-crawler/runs?token=${apifyToken}&waitForFinish=120`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ startUrls: [{ url }], maxCrawlPages: 1, crawlerType: "cheerio" }),
        }
      );

      if (crawlerResponse.ok) {
        const crawlerData = await crawlerResponse.json();
        const datasetId = crawlerData?.data?.defaultDatasetId;
        if (datasetId) {
          await new Promise(resolve => setTimeout(resolve, 5000));
          const resultsResp = await fetch(
            `https://api.apify.com/v2/datasets/${datasetId}/items?token=${apifyToken}`
          );
          if (resultsResp.ok) {
            const results = await resultsResp.json();
            if (results.length > 0) {
              transcript = results[0].text || results[0].markdown || results[0].body || "";
              title = title || results[0].title || "Scraped Content";
            }
          }
        }
      }
    }

    if (!transcript || transcript.length < 50) {
      return { success: false, error: "No meaningful content extracted" };
    }

    // Build dialect-specific extraction instructions
    const isFeaturedDominicanSource = channel.id.includes("featured_") && 
      (channel.dialect === "Dominican" || channel.dialect === "Multi-Dialect");
    
    const dominicanSlangFocus = isFeaturedDominicanSource ? `

SPECIAL FOCUS — DOMINICAN SPANISH SAYINGS & SLANG:
This is a featured Dominican content source. Pay extra attention to:
- Dominican sayings (dichos dominicanos) and their meanings
- Street slang (jerga callejera) unique to DR
- Common Dominican expressions that differ from standard Spanish
- Pronunciation patterns (e.g., dropped "s", "l" to "r" swaps)
- Cultural context: when and how Dominicans use each expression
- Comparisons to how other Spanish dialects say the same thing
- Tag each slang/saying with: the expression, literal meaning, actual meaning, usage example, and formality level

Format slang entries like:
**Expression:** "Tá to'"
**Literal:** "Está todo"
**Meaning:** Everything is fine / It's all good
**Usage:** Casual greeting response among friends
**Example:** "¿Cómo tú tá?" — "Tá to', mi loco"
**Formality:** Very informal / street` : "";

    // AI Extract teaching content
    const extractionResponse = await invokeLLM({
      messages: [
        {
          role: "system",
          content: `You are a language education content curator specializing in ${channel.language}${channel.dialect !== "Standard" ? ` (${channel.dialect} dialect)` : ""}. Extract and organize the teaching-relevant content from this scraped transcript/text. Focus on:
1. Vocabulary and phrases being taught
2. Grammar explanations
3. Pronunciation tips
4. Cultural context and usage notes
5. Dialect-specific expressions and slang
6. Example sentences and conversations${dominicanSlangFocus}

Format it as clean, structured teaching notes. Remove ads, unrelated content, or platform-specific text.`,
        },
        {
          role: "user",
          content: `Extract teaching content from this ${channel.language} (${channel.dialect}) video/post:\n\n${transcript.slice(0, 8000)}`,
        },
      ],
    });

    const processedContent = typeof extractionResponse.choices?.[0]?.message?.content === "string"
      ? extractionResponse.choices[0].message.content
      : "";

    if (!processedContent) {
      return { success: false, error: "AI could not extract teaching content" };
    }

    // AI Validate
    const validationResponse = await invokeLLM({
      messages: [
        {
          role: "system",
          content: `You are a linguistic accuracy validator. Verify this ${channel.language} (${channel.dialect}) teaching content is correct and authentic. Respond with JSON (no markdown fencing):
{
  "isValid": true/false,
  "confidence": 0.0-1.0,
  "issues": [],
  "verifiedContent": "the content with corrections if needed"
}`,
        },
        {
          role: "user",
          content: `Validate this ${channel.language} (${channel.dialect}) teaching content:\n\n${processedContent.slice(0, 6000)}`,
        },
      ],
    });

    const validationRaw = typeof validationResponse.choices?.[0]?.message?.content === "string"
      ? validationResponse.choices[0].message.content
      : "";

    let validation: { isValid: boolean; confidence: number; verifiedContent: string };
    try {
      const jsonStr = validationRaw.replace(/^```json\n?|```$/g, "").trim();
      validation = JSON.parse(jsonStr);
    } catch {
      validation = { isValid: true, confidence: 0.7, verifiedContent: processedContent };
    }

    if (!validation.isValid && validation.confidence < 0.6) {
      return { success: false, error: "Content failed validation" };
    }

    // Store in the knowledge base (import from teacherRouter's shared store)
    // For now, we'll use a global event to notify the teacherRouter
    const { addToKnowledgeBase } = await import("./teacherKnowledgeStore");
    addToKnowledgeBase({
      url,
      title,
      transcript: validation.verifiedContent || processedContent,
      language: channel.language,
      dialect: channel.dialect,
      platform: channel.platform,
    });

    // Mark URL as ingested
    ingestedUrls.add(url);

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Main auto-ingestion function — called by the scheduled endpoint.
 * Iterates all active seed channels, discovers new content, processes it.
 */
export async function runAutoIngestion(): Promise<{
  channelsChecked: number;
  newContentFound: number;
  successfullyIngested: number;
  errors: string[];
}> {
  const results = {
    channelsChecked: 0,
    newContentFound: 0,
    successfullyIngested: 0,
    errors: [] as string[],
  };

  const activeChannels = Array.from(seedChannels.values()).filter(c => c.isActive);

  for (const channel of activeChannels) {
    results.channelsChecked++;

    try {
      // Discover new content from this channel
      const newUrls = await discoverNewContent(channel);
      results.newContentFound += newUrls.length;

      // Process each new URL
      for (const url of newUrls) {
        const result = await processUrl(url, channel);
        if (result.success) {
          results.successfullyIngested++;
          channel.totalIngested++;
          channel.lastNewContent = new Date().toISOString();
        } else if (result.error) {
          results.errors.push(`${channel.name}: ${result.error}`);
        }
      }

      channel.lastChecked = new Date().toISOString();
    } catch (err: any) {
      results.errors.push(`${channel.name}: ${err.message}`);
    }
  }

  // Send push notification if new content was ingested
  if (results.successfullyIngested > 0) {
    const channelsWithNewContent = Array.from(seedChannels.values())
      .filter(c => c.lastNewContent && new Date(c.lastNewContent).getTime() > Date.now() - 60000)
      .map(c => c.name);
    await notifyIngestionResults({
      channelsChecked: results.channelsChecked,
      newContentFound: results.newContentFound,
      successfullyIngested: results.successfullyIngested,
      channelsWithNewContent,
    }).catch(() => {});
  }

  return results;
}

/**
 * tRPC Router for managing seed channels and the auto-ingestion scheduler.
 */
export const autoIngestRouter = router({
  /**
   * Add a seed channel — the system will automatically check it for new content daily.
   */
  addSeedChannel: publicProcedure
    .input(z.object({
      url: z.string().url(),
      name: z.string().optional(),
      language: z.string().min(1),
      dialect: z.string().default("Standard"),
    }))
    .mutation(async ({ input }) => {
      const id = generateId();
      const platform = detectPlatform(input.url);

      const channel: SeedChannel = {
        id,
        url: input.url,
        name: input.name || `${platform} channel`,
        platform,
        language: input.language,
        dialect: input.dialect,
        isActive: true,
        lastChecked: null,
        lastNewContent: null,
        totalIngested: 0,
        addedAt: new Date().toISOString(),
      };

      seedChannels.set(id, channel);

      return {
        success: true,
        channel: {
          id: channel.id,
          name: channel.name,
          platform: channel.platform,
          language: channel.language,
          dialect: channel.dialect,
          isActive: channel.isActive,
        },
        message: `Seed channel added! The system will automatically check for new ${input.language} (${input.dialect}) teaching content from this source daily.`,
      };
    }),

  /**
   * Remove a seed channel — stops auto-ingesting from this source.
   */
  removeSeedChannel: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(({ input }) => {
      const channel = seedChannels.get(input.id);
      if (!channel) return { success: false, message: "Channel not found" };
      seedChannels.delete(input.id);
      return { success: true, message: `Removed ${channel.name} from auto-ingestion` };
    }),

  /**
   * Toggle a seed channel active/inactive.
   */
  toggleSeedChannel: publicProcedure
    .input(z.object({ id: z.string(), isActive: z.boolean() }))
    .mutation(({ input }) => {
      const channel = seedChannels.get(input.id);
      if (!channel) return { success: false, message: "Channel not found" };
      channel.isActive = input.isActive;
      return { success: true, message: `${channel.name} is now ${input.isActive ? "active" : "paused"}` };
    }),

  /**
   * List all seed channels with their status.
   */
  listSeedChannels: publicProcedure.query(() => {
    const channels = Array.from(seedChannels.values()).map(c => ({
      id: c.id,
      url: c.url,
      name: c.name,
      platform: c.platform,
      language: c.language,
      dialect: c.dialect,
      isActive: c.isActive,
      lastChecked: c.lastChecked,
      lastNewContent: c.lastNewContent,
      totalIngested: c.totalIngested,
      addedAt: c.addedAt,
    }));

    return {
      channels,
      total: channels.length,
      active: channels.filter(c => c.isActive).length,
    };
  }),

  /**
   * Manually trigger auto-ingestion for all active channels (for testing).
   */
  triggerIngestion: publicProcedure.mutation(async () => {
    const results = await runAutoIngestion();
    return {
      success: true,
      ...results,
      message: `Checked ${results.channelsChecked} channels. Found ${results.newContentFound} new items, successfully ingested ${results.successfullyIngested}.`,
    };
  }),

  /**
   * Set up the daily auto-ingestion cron job.
   * This creates a heartbeat job that runs every 24 hours.
   */
  setupSchedule: publicProcedure
    .input(z.object({
      cron: z.string().default("0 0 6 * * *"), // Default: daily at 6 AM UTC
    }))
    .mutation(async ({ input, ctx }) => {
      const sessionToken = parseCookie(ctx.req.headers.cookie ?? "")[COOKIE_NAME] ?? "";

      try {
        const job = await createHeartbeatJob({
          name: "auto-ingest-daily",
          cron: input.cron,
          path: "/api/scheduled/auto-ingest",
          method: "POST",
          payload: { trigger: "scheduled" },
          description: "Daily auto-ingestion of teaching content from seed channels",
        }, sessionToken);

        return {
          success: true,
          taskUid: job.taskUid,
          nextExecution: job.nextExecutionAt,
          message: "Auto-ingestion scheduled! The system will automatically check all seed channels for new content daily.",
        };
      } catch (err: any) {
        return {
          success: false,
          message: `Failed to set up schedule: ${err.message}. Make sure the app is deployed first.`,
        };
      }
    }),

  /**
   * AI Auto-Discovery: Find popular language teachers for a given language/dialect.
   * Uses AI to suggest channels to follow.
   */
  discoverTeachers: publicProcedure
    .input(z.object({
      language: z.string().min(1),
      dialect: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `You are a language learning content curator. Suggest 5 popular YouTube channels or Instagram accounts that teach ${input.language}${input.dialect ? ` (${input.dialect} dialect)` : ""}. Focus on channels that:
1. Teach authentic, real-world usage (not just textbook grammar)
2. Cover slang, idioms, and cultural context
3. Have native speakers teaching
4. Are currently active (posting in 2024-2026)

Respond with JSON (no markdown fencing):
{
  "suggestions": [
    {
      "name": "Channel Name",
      "url": "https://youtube.com/@channelname or https://instagram.com/accountname",
      "platform": "youtube" or "instagram",
      "description": "Brief description of what they teach",
      "whyRecommended": "Why this channel is good for learning this dialect"
    }
  ]
}`,
          },
          {
            role: "user",
            content: `Find popular ${input.language}${input.dialect ? ` (${input.dialect})` : ""} teaching channels on YouTube and Instagram.`,
          },
        ],
      });

      const raw = typeof response.choices?.[0]?.message?.content === "string"
        ? response.choices[0].message.content
        : "";

      try {
        const jsonStr = raw.replace(/^```json\n?|```$/g, "").trim();
        const data = JSON.parse(jsonStr);
        return { success: true, suggestions: data.suggestions || [] };
      } catch {
        return { success: true, suggestions: [] };
      }
    }),
});
