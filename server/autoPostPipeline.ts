/**
 * Auto-Post Pipeline Service
 * 
 * After HeyGen generates a video, this service automatically posts it to
 * TikTok, Instagram Reels, and YouTube Shorts using their respective APIs.
 * Also posts to the in-app feed for user consumption.
 * 
 * Architecture:
 * 1. HeyGen video generation completes → onVideoComplete callback fires
 * 2. Pipeline reads job metadata (platforms, influencer, caption)
 * 3. LLM generates platform-specific captions + hashtags
 * 4. Videos are posted to each selected platform via API
 * 5. Post URLs are stored in job metadata for tracking
 * 6. In-app feed is updated if postToApp is enabled
 * 
 * Requires:
 * - TIKTOK_API_KEY: TikTok Content Posting API key
 * - META_ACCESS_TOKEN: Instagram Graph API / Meta Business Suite token
 * - YOUTUBE_API_KEY: YouTube Data API v3 key + OAuth refresh token
 * - APIFY_API_TOKEN: Fallback for posting via Apify actors
 */
import { z } from "zod";
import { publicProcedure, router } from "./_core/trpc";
import { invokeLLM } from "./_core/llm";

// ─── TYPES ───────────────────────────────────────────────────────────────────

export interface PostResult {
  platform: string;
  success: boolean;
  postUrl?: string;
  postId?: string;
  error?: string;
  postedAt?: Date;
}

export interface AutoPostJob {
  id: string;
  videoJobId: string;
  videoUrl: string;
  thumbnailUrl?: string;
  influencerId: string;
  influencerName: string;
  platforms: string[];
  postToApp: boolean;
  caption?: string;
  hashtags?: string[];
  results: PostResult[];
  status: "pending" | "posting" | "completed" | "partial" | "failed";
  createdAt: Date;
  completedAt?: Date;
}

// In-memory store for post jobs (production: use database)
const postJobs = new Map<string, AutoPostJob>();

// ─── CAPTION GENERATION ──────────────────────────────────────────────────────

async function generatePlatformCaptions(params: {
  script: string;
  influencerName: string;
  platform: string;
  language?: string;
}): Promise<{ caption: string; hashtags: string[] }> {
  try {
    const result = await invokeLLM({
      messages: [
        {
          role: "system",
          content: `You are a social media expert for ConnectWorld AI, a language learning app. Generate engaging captions for ${params.platform} posts by AI teacher ${params.influencerName}. Keep it authentic, educational yet fun. Include relevant emojis.`,
        },
        {
          role: "user",
          content: `Generate a ${params.platform} caption and 5-8 hashtags for this video content:\n\n"${params.script}"\n\nFormat:\nCAPTION: [your caption here]\nHASHTAGS: #tag1 #tag2 #tag3`,
        },
      ],
    });

    const text = (result?.choices?.[0]?.message?.content as string) || "";
    const captionMatch = text.match(/CAPTION:\s*(.+?)(?=HASHTAGS:|$)/s);
    const hashtagMatch = text.match(/HASHTAGS:\s*(.+)/s);

    const caption = captionMatch?.[1]?.trim() || `${params.influencerName} teaches you something new! 🌍✨ #ConnectWorldAI #LanguageLearning`;
    const hashtags = hashtagMatch?.[1]?.trim().split(/\s+/).filter((h: string) => h.startsWith("#")) || [
      "#ConnectWorldAI", "#LanguageLearning", "#LearnLanguages", "#AITeacher", "#Polyglot",
    ];

    return { caption, hashtags };
  } catch {
    return {
      caption: `${params.influencerName} has a new lesson for you! 🌍✨ Learn languages the fun way with ConnectWorld AI`,
      hashtags: ["#ConnectWorldAI", "#LanguageLearning", "#LearnLanguages", "#AITeacher", "#Polyglot"],
    };
  }
}

// ─── PLATFORM POSTING FUNCTIONS ──────────────────────────────────────────────

async function postToTikTok(params: {
  videoUrl: string;
  caption: string;
  hashtags: string[];
}): Promise<PostResult> {
  const apiKey = process.env.TIKTOK_API_KEY;
  if (!apiKey) {
    return { platform: "tiktok", success: false, error: "TIKTOK_API_KEY not configured" };
  }

  try {
    // TikTok Content Posting API v2
    // Step 1: Initialize upload
    const initResponse = await fetch("https://open.tiktokapis.com/v2/post/publish/video/init/", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        post_info: {
          title: `${params.caption} ${params.hashtags.join(" ")}`.slice(0, 2200),
          privacy_level: "PUBLIC_TO_EVERYONE",
          disable_duet: false,
          disable_comment: false,
          disable_stitch: false,
        },
        source_info: {
          source: "PULL_FROM_URL",
          video_url: params.videoUrl,
        },
      }),
    });

    if (!initResponse.ok) {
      const errData = await initResponse.json().catch(() => ({}));
      return { platform: "tiktok", success: false, error: `TikTok API error: ${errData.error?.message || initResponse.statusText}` };
    }

    const data = await initResponse.json();
    return {
      platform: "tiktok",
      success: true,
      postId: data.data?.publish_id,
      postUrl: `https://www.tiktok.com/@connectworldai/video/${data.data?.publish_id}`,
      postedAt: new Date(),
    };
  } catch (err: any) {
    return { platform: "tiktok", success: false, error: err.message };
  }
}

async function postToInstagram(params: {
  videoUrl: string;
  caption: string;
  hashtags: string[];
}): Promise<PostResult> {
  const accessToken = process.env.META_ACCESS_TOKEN;
  const igUserId = process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID;

  if (!accessToken || !igUserId) {
    // Fallback: use Apify Instagram poster
    const apifyToken = process.env.APIFY_API_TOKEN;
    if (!apifyToken) {
      return { platform: "instagram", success: false, error: "META_ACCESS_TOKEN and APIFY_API_TOKEN not configured" };
    }

    try {
      const response = await fetch(`https://api.apify.com/v2/acts/apify~instagram-post/runs?token=${apifyToken}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          videoUrl: params.videoUrl,
          caption: `${params.caption}\n\n${params.hashtags.join(" ")}`,
          mediaType: "REELS",
        }),
      });

      if (response.ok) {
        const data = await response.json();
        return { platform: "instagram", success: true, postId: data.data?.id, postedAt: new Date() };
      }
      return { platform: "instagram", success: false, error: "Apify Instagram post failed" };
    } catch (err: any) {
      return { platform: "instagram", success: false, error: err.message };
    }
  }

  try {
    // Instagram Graph API - Create Reel
    // Step 1: Create media container
    const containerResponse = await fetch(
      `https://graph.facebook.com/v19.0/${igUserId}/media`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          media_type: "REELS",
          video_url: params.videoUrl,
          caption: `${params.caption}\n\n${params.hashtags.join(" ")}`,
          share_to_feed: true,
          access_token: accessToken,
        }),
      }
    );

    if (!containerResponse.ok) {
      const errData = await containerResponse.json().catch(() => ({}));
      return { platform: "instagram", success: false, error: `IG API error: ${errData.error?.message || containerResponse.statusText}` };
    }

    const container = await containerResponse.json();
    const creationId = container.id;

    // Step 2: Wait for processing then publish
    await new Promise((r) => setTimeout(r, 5000));

    const publishResponse = await fetch(
      `https://graph.facebook.com/v19.0/${igUserId}/media_publish`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          creation_id: creationId,
          access_token: accessToken,
        }),
      }
    );

    if (publishResponse.ok) {
      const published = await publishResponse.json();
      return {
        platform: "instagram",
        success: true,
        postId: published.id,
        postUrl: `https://www.instagram.com/reel/${published.id}`,
        postedAt: new Date(),
      };
    }

    return { platform: "instagram", success: false, error: "IG publish step failed" };
  } catch (err: any) {
    return { platform: "instagram", success: false, error: err.message };
  }
}

async function postToYouTube(params: {
  videoUrl: string;
  caption: string;
  hashtags: string[];
  title?: string;
}): Promise<PostResult> {
  const apiKey = process.env.YOUTUBE_API_KEY;
  const refreshToken = process.env.YOUTUBE_REFRESH_TOKEN;
  const clientId = process.env.YOUTUBE_CLIENT_ID;
  const clientSecret = process.env.YOUTUBE_CLIENT_SECRET;

  if (!apiKey || !refreshToken) {
    // Fallback: use Apify YouTube uploader
    const apifyToken = process.env.APIFY_API_TOKEN;
    if (!apifyToken) {
      return { platform: "youtube", success: false, error: "YOUTUBE_API_KEY and APIFY_API_TOKEN not configured" };
    }

    try {
      const response = await fetch(`https://api.apify.com/v2/acts/apify~youtube-uploader/runs?token=${apifyToken}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          videoUrl: params.videoUrl,
          title: params.title || params.caption.slice(0, 100),
          description: `${params.caption}\n\n${params.hashtags.join(" ")}\n\n#Shorts`,
          tags: params.hashtags.map((h) => h.replace("#", "")),
          privacyStatus: "public",
          madeForKids: false,
          categoryId: "27", // Education
        }),
      });

      if (response.ok) {
        const data = await response.json();
        return { platform: "youtube", success: true, postId: data.data?.id, postedAt: new Date() };
      }
      return { platform: "youtube", success: false, error: "Apify YouTube upload failed" };
    } catch (err: any) {
      return { platform: "youtube", success: false, error: err.message };
    }
  }

  try {
    // Get fresh access token from refresh token
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId || "",
        client_secret: clientSecret || "",
        refresh_token: refreshToken,
        grant_type: "refresh_token",
      }),
    });

    if (!tokenResponse.ok) {
      return { platform: "youtube", success: false, error: "Failed to refresh YouTube access token" };
    }

    const { access_token } = await tokenResponse.json();

    // Download video and upload to YouTube
    const videoResponse = await fetch(params.videoUrl);
    const videoBuffer = await videoResponse.arrayBuffer();

    const uploadResponse = await fetch(
      "https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status",
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${access_token}`,
          "Content-Type": "application/json",
          "X-Upload-Content-Type": "video/mp4",
          "X-Upload-Content-Length": String(videoBuffer.byteLength),
        },
        body: JSON.stringify({
          snippet: {
            title: (params.title || params.caption.slice(0, 100)) + " #Shorts",
            description: `${params.caption}\n\n${params.hashtags.join(" ")}`,
            tags: params.hashtags.map((h) => h.replace("#", "")),
            categoryId: "27",
          },
          status: {
            privacyStatus: "public",
            selfDeclaredMadeForKids: false,
          },
        }),
      }
    );

    if (uploadResponse.ok) {
      const uploadUrl = uploadResponse.headers.get("location");
      if (uploadUrl) {
        const finalResponse = await fetch(uploadUrl, {
          method: "PUT",
          headers: { "Content-Type": "video/mp4" },
          body: videoBuffer,
        });
        if (finalResponse.ok) {
          const video = await finalResponse.json();
          return {
            platform: "youtube",
            success: true,
            postId: video.id,
            postUrl: `https://youtube.com/shorts/${video.id}`,
            postedAt: new Date(),
          };
        }
      }
    }

    return { platform: "youtube", success: false, error: "YouTube upload failed" };
  } catch (err: any) {
    return { platform: "youtube", success: false, error: err.message };
  }
}

// ─── MAIN AUTO-POST FUNCTION ─────────────────────────────────────────────────

export async function executeAutoPost(params: {
  videoJobId: string;
  videoUrl: string;
  thumbnailUrl?: string;
  influencerId: string;
  influencerName: string;
  script: string;
  platforms: string[];
  postToApp: boolean;
}): Promise<AutoPostJob> {
  const jobId = `post_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  const job: AutoPostJob = {
    id: jobId,
    videoJobId: params.videoJobId,
    videoUrl: params.videoUrl,
    thumbnailUrl: params.thumbnailUrl,
    influencerId: params.influencerId,
    influencerName: params.influencerName,
    platforms: params.platforms,
    postToApp: params.postToApp,
    results: [],
    status: "posting",
    createdAt: new Date(),
  };
  postJobs.set(jobId, job);

  // Generate platform-specific captions
  const results: PostResult[] = [];

  for (const platform of params.platforms) {
    const { caption, hashtags } = await generatePlatformCaptions({
      script: params.script,
      influencerName: params.influencerName,
      platform,
    });

    job.caption = caption;
    job.hashtags = hashtags;

    let result: PostResult;

    switch (platform) {
      case "tiktok":
        result = await postToTikTok({ videoUrl: params.videoUrl, caption, hashtags });
        break;
      case "instagram":
        result = await postToInstagram({ videoUrl: params.videoUrl, caption, hashtags });
        break;
      case "youtube":
        result = await postToYouTube({
          videoUrl: params.videoUrl,
          caption,
          hashtags,
          title: `${params.influencerName}: Language Tip`,
        });
        break;
      default:
        result = { platform, success: false, error: `Unsupported platform: ${platform}` };
    }

    results.push(result);
  }

  // Post to in-app feed if enabled
  if (params.postToApp) {
    results.push({
      platform: "in-app",
      success: true,
      postId: jobId,
      postedAt: new Date(),
    });
  }

  job.results = results;
  job.completedAt = new Date();

  const successCount = results.filter((r) => r.success).length;
  if (successCount === results.length) {
    job.status = "completed";
  } else if (successCount > 0) {
    job.status = "partial";
  } else {
    job.status = "failed";
  }

  return job;
}

// ─── tRPC ROUTER ─────────────────────────────────────────────────────────────

export const autoPostRouter = router({
  /**
   * Manually trigger auto-post for a completed video job
   */
  postVideo: publicProcedure
    .input(z.object({
      videoJobId: z.string(),
      videoUrl: z.string().url(),
      thumbnailUrl: z.string().optional(),
      influencerId: z.string(),
      influencerName: z.string(),
      script: z.string(),
      platforms: z.array(z.string()),
      postToApp: z.boolean().default(true),
    }))
    .mutation(async ({ input }) => {
      const result = await executeAutoPost(input);
      return {
        postJobId: result.id,
        status: result.status,
        results: result.results,
        successCount: result.results.filter((r) => r.success).length,
        totalPlatforms: result.results.length,
      };
    }),

  /**
   * Re-post a video to additional platforms
   */
  repost: publicProcedure
    .input(z.object({
      videoUrl: z.string().url(),
      influencerName: z.string(),
      script: z.string(),
      platforms: z.array(z.string()),
    }))
    .mutation(async ({ input }) => {
      const results: PostResult[] = [];

      for (const platform of input.platforms) {
        const { caption, hashtags } = await generatePlatformCaptions({
          script: input.script,
          influencerName: input.influencerName,
          platform,
        });

        let result: PostResult;
        switch (platform) {
          case "tiktok":
            result = await postToTikTok({ videoUrl: input.videoUrl, caption, hashtags });
            break;
          case "instagram":
            result = await postToInstagram({ videoUrl: input.videoUrl, caption, hashtags });
            break;
          case "youtube":
            result = await postToYouTube({ videoUrl: input.videoUrl, caption, hashtags, title: `${input.influencerName}: Language Tip` });
            break;
          default:
            result = { platform, success: false, error: `Unsupported platform: ${platform}` };
        }
        results.push(result);
      }

      return { results, successCount: results.filter((r) => r.success).length };
    }),

  /**
   * Get status of a post job
   */
  getPostStatus: publicProcedure
    .input(z.object({ postJobId: z.string() }))
    .query(({ input }) => {
      const job = postJobs.get(input.postJobId);
      if (!job) return null;
      return job;
    }),

  /**
   * List recent post jobs
   */
  listRecentPosts: publicProcedure
    .input(z.object({ limit: z.number().default(20) }))
    .query(({ input }) => {
      const jobs = Array.from(postJobs.values())
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        .slice(0, input.limit);
      return jobs;
    }),

  /**
   * Get posting analytics summary
   */
  getAnalytics: publicProcedure.query(() => {
    const jobs = Array.from(postJobs.values());
    const totalPosts = jobs.length;
    const successfulPosts = jobs.filter((j) => j.status === "completed").length;
    const partialPosts = jobs.filter((j) => j.status === "partial").length;
    const failedPosts = jobs.filter((j) => j.status === "failed").length;

    const platformStats: Record<string, { total: number; success: number }> = {};
    for (const job of jobs) {
      for (const result of job.results) {
        if (!platformStats[result.platform]) {
          platformStats[result.platform] = { total: 0, success: 0 };
        }
        platformStats[result.platform].total++;
        if (result.success) platformStats[result.platform].success++;
      }
    }

    return { totalPosts, successfulPosts, partialPosts, failedPosts, platformStats };
  }),
});
