/**
 * Higgsfield Marketing Content Pipeline
 * 
 * Generates promo clips for ConnectWorld AI's social media channels
 * using Higgsfield Cloud API (text-to-video and image-to-video).
 * 
 * Supports: Instagram Reels, TikTok, YouTube Shorts
 */

import { z } from "zod";
import { publicProcedure, router } from "./_core/trpc";
import { invokeLLM } from "./_core/llm";
import { storagePut, storageGetSignedUrl } from "./storage";

// ─── Higgsfield API Client ─────────────────────────────────────────────────────

const HIGGSFIELD_API_BASE = "https://cloud.higgsfield.ai/api/v1";

interface HiggsfieldConfig {
  apiKey: string;
  apiSecret: string;
}

function getHiggsfieldConfig(): HiggsfieldConfig {
  const key = process.env.HIGGSFIELD_API_KEY || "";
  const secret = process.env.HIGGSFIELD_API_SECRET || "";
  
  // Support combined key format: "key:secret"
  if (key.includes(":") && !secret) {
    const [k, s] = key.split(":");
    return { apiKey: k, apiSecret: s };
  }
  
  return { apiKey: key, apiSecret: secret };
}

function getAuthHeaders(): Record<string, string> {
  const { apiKey, apiSecret } = getHiggsfieldConfig();
  return {
    "Content-Type": "application/json",
    "X-API-Key": apiKey,
    "X-API-Secret": apiSecret,
  };
}

async function higgsfieldRequest(endpoint: string, body: any): Promise<any> {
  const response = await fetch(`${HIGGSFIELD_API_BASE}${endpoint}`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(body),
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Higgsfield API error (${response.status}): ${errorText}`);
  }
  
  return response.json();
}

async function higgsfieldGet(endpoint: string): Promise<any> {
  const response = await fetch(`${HIGGSFIELD_API_BASE}${endpoint}`, {
    method: "GET",
    headers: getAuthHeaders(),
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Higgsfield API error (${response.status}): ${errorText}`);
  }
  
  return response.json();
}

// ─── Marketing Templates ────────────────────────────────────────────────────────

export interface MarketingTemplate {
  id: string;
  name: string;
  description: string;
  category: "feature_promo" | "testimonial" | "trending" | "language_tip" | "app_showcase" | "referral";
  platform: ("instagram" | "tiktok" | "youtube_shorts")[];
  aspectRatio: "9:16" | "1:1" | "16:9";
  duration: number; // seconds
  promptTemplate: string;
  style: string;
  motionPreset?: string;
}

const MARKETING_TEMPLATES: MarketingTemplate[] = [
  // Feature Promo Templates
  {
    id: "feature-hd-voice",
    name: "HD Voice Translation",
    description: "Showcase the ElevenLabs HD Voice feature — crystal-clear translations in any language",
    category: "feature_promo",
    platform: ["instagram", "tiktok", "youtube_shorts"],
    aspectRatio: "9:16",
    duration: 15,
    promptTemplate: "A sleek phone screen showing a translation app with sound waves emanating from it, neon blue and gold glow, text appearing in multiple languages floating around the phone, cinematic lighting, premium tech aesthetic, dark background with subtle particles",
    style: "cinematic, tech, premium",
    motionPreset: "zoom-in-dramatic",
  },
  {
    id: "feature-live-translate",
    name: "Live Translation Demo",
    description: "Show real-time conversation translation in action",
    category: "feature_promo",
    platform: ["instagram", "tiktok", "youtube_shorts"],
    aspectRatio: "9:16",
    duration: 20,
    promptTemplate: "Two people having a conversation across a table, speech bubbles appearing between them with text transforming from one language to another, warm lighting, modern cafe setting, subtle glow effects on the translation bubbles, cinematic depth of field",
    style: "lifestyle, warm, relatable",
    motionPreset: "slow-pan",
  },
  {
    id: "feature-ai-teachers",
    name: "Meet Your AI Teachers",
    description: "Introduce the diverse cast of AI language teachers",
    category: "feature_promo",
    platform: ["instagram", "tiktok", "youtube_shorts"],
    aspectRatio: "9:16",
    duration: 15,
    promptTemplate: "A grid of diverse AI teacher avatars appearing one by one with country flags, each with a distinct personality and cultural background, vibrant colors, modern UI design aesthetic, energetic transitions between each teacher reveal",
    style: "energetic, diverse, colorful",
    motionPreset: "quick-cuts",
  },
  {
    id: "feature-dominican-slang",
    name: "Dominican Slang Lesson",
    description: "Quick Dominican Spanish slang lesson — engaging and educational",
    category: "language_tip",
    platform: ["instagram", "tiktok", "youtube_shorts"],
    aspectRatio: "9:16",
    duration: 15,
    promptTemplate: "Dominican Republic flag colors (red, white, blue) flowing in the background, bold text appearing with slang words and their meanings, tropical vibes, palm trees subtly in background, energetic Caribbean music feel, modern typography",
    style: "vibrant, Caribbean, educational",
    motionPreset: "bounce-reveal",
  },
  // Trending Format Templates
  {
    id: "trending-before-after",
    name: "Before/After Learning",
    description: "Trending before/after format showing language learning progress",
    category: "trending",
    platform: ["instagram", "tiktok"],
    aspectRatio: "9:16",
    duration: 12,
    promptTemplate: "Split screen transition: left side shows confused person with question marks, right side shows confident person speaking fluently with checkmarks, dramatic reveal transition, modern social media aesthetic, bold colors",
    style: "trending, viral, split-screen",
    motionPreset: "split-reveal",
  },
  {
    id: "trending-day-in-life",
    name: "Day in Life with ConnectWorld AI",
    description: "Day-in-the-life format showing the app in daily scenarios",
    category: "trending",
    platform: ["instagram", "tiktok", "youtube_shorts"],
    aspectRatio: "9:16",
    duration: 30,
    promptTemplate: "Morning routine montage: person waking up, using phone app to practice language during breakfast, commuting with earbuds doing live translation, ordering coffee in a foreign language confidently, golden hour lighting, lifestyle aesthetic",
    style: "lifestyle, aspirational, daily",
    motionPreset: "montage-flow",
  },
  // App Showcase Templates
  {
    id: "showcase-connectworld-tv",
    name: "ConnectWorld AI TV Preview",
    description: "Netflix-style preview of the AI TV learning series",
    category: "app_showcase",
    platform: ["instagram", "tiktok", "youtube_shorts"],
    aspectRatio: "9:16",
    duration: 20,
    promptTemplate: "A phone screen showing a Netflix-style grid of language learning shows, camera slowly zooming into one show that starts playing, cinematic trailer feel, dramatic lighting, premium streaming aesthetic with dark UI",
    style: "premium, streaming, cinematic",
    motionPreset: "zoom-through",
  },
  {
    id: "showcase-video-call",
    name: "AI Video Call Feature",
    description: "Show the live AI video call with real-time translation",
    category: "app_showcase",
    platform: ["instagram", "tiktok"],
    aspectRatio: "9:16",
    duration: 15,
    promptTemplate: "A video call interface with two people speaking different languages, real-time subtitles appearing at the bottom translating between languages, futuristic UI overlay, blue and purple glow effects, modern tech aesthetic",
    style: "futuristic, tech, communication",
    motionPreset: "interface-reveal",
  },
  // Referral/Growth Templates
  {
    id: "referral-invite",
    name: "Invite Friends Promo",
    description: "Encourage referrals with bonus credits incentive",
    category: "referral",
    platform: ["instagram", "tiktok", "youtube_shorts"],
    aspectRatio: "9:16",
    duration: 10,
    promptTemplate: "Two friends sharing a phone screen excitedly, golden coins/credits floating between them, celebration confetti, bold text 'Share & Earn', modern social app aesthetic, warm and inviting colors",
    style: "social, rewarding, fun",
    motionPreset: "celebration-burst",
  },
  // Testimonial Templates
  {
    id: "testimonial-success",
    name: "Success Story",
    description: "User success story format — before/after language confidence",
    category: "testimonial",
    platform: ["instagram", "tiktok", "youtube_shorts"],
    aspectRatio: "9:16",
    duration: 20,
    promptTemplate: "A person speaking confidently in a foreign country, locals smiling and responding, beautiful travel destination background, warm golden hour lighting, authentic and emotional moment, subtle text overlay with their journey stats",
    style: "emotional, authentic, aspirational",
    motionPreset: "cinematic-slow",
  },
];

// ─── AI Prompt Generator ────────────────────────────────────────────────────────

async function generateMarketingPrompt(
  template: MarketingTemplate,
  customization: {
    targetLanguage?: string;
    feature?: string;
    slangWord?: string;
    teacherName?: string;
    platform: string;
  }
): Promise<string> {
  const systemPrompt = `You are a viral social media content strategist for ConnectWorld AI, a language learning app. 
Generate an optimized video generation prompt for Higgsfield AI that will create a ${customization.platform} video.

RULES:
- The prompt must be visual and cinematic — describe what the CAMERA SEES
- Include specific motion direction (pan, zoom, track, etc.)
- Include lighting and mood descriptors
- Keep it under 200 words
- Make it trend-aware for ${customization.platform} (hook in first 2 seconds)
- Do NOT include text-on-screen instructions (Higgsfield handles motion, not text overlays)
- Focus on emotion, movement, and visual storytelling

The base template prompt is: "${template.promptTemplate}"

Customize it for:
${customization.targetLanguage ? `- Target language/culture: ${customization.targetLanguage}` : ""}
${customization.feature ? `- Highlighting feature: ${customization.feature}` : ""}
${customization.slangWord ? `- Dominican slang word: ${customization.slangWord}` : ""}
${customization.teacherName ? `- AI Teacher: ${customization.teacherName}` : ""}

Return ONLY the optimized prompt text, nothing else.`;

  try {
    const response = await invokeLLM({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Generate the video prompt for template "${template.name}" targeting ${customization.platform}.` },
      ],
    });

    const content = response.choices?.[0]?.message?.content;
    if (typeof content === "string") return content.trim();
    if (Array.isArray(content)) {
      const textPart = content.find((p: any) => p.type === "text") as any;
      return textPart?.text?.trim() || template.promptTemplate;
    }
    return template.promptTemplate;
  } catch {
    return template.promptTemplate;
  }
}

// ─── Video Generation ───────────────────────────────────────────────────────────

interface GenerateVideoRequest {
  templateId: string;
  platform: "instagram" | "tiktok" | "youtube_shorts";
  customPrompt?: string;
  targetLanguage?: string;
  feature?: string;
  slangWord?: string;
  teacherName?: string;
  inputImageUrl?: string; // For image-to-video
}

interface GenerateVideoResult {
  requestId: string;
  status: "queued" | "processing" | "completed" | "failed";
  videoUrl?: string;
  thumbnailUrl?: string;
  prompt: string;
  template: string;
  platform: string;
}

async function generateMarketingVideo(req: GenerateVideoRequest): Promise<GenerateVideoResult> {
  const template = MARKETING_TEMPLATES.find(t => t.id === req.templateId);
  if (!template) throw new Error(`Template not found: ${req.templateId}`);

  // Generate optimized prompt
  const prompt = req.customPrompt || await generateMarketingPrompt(template, {
    targetLanguage: req.targetLanguage,
    feature: req.feature,
    slangWord: req.slangWord,
    teacherName: req.teacherName,
    platform: req.platform,
  });

  // Determine generation mode
  const isImageToVideo = !!req.inputImageUrl;
  
  try {
    let result: any;
    
    if (isImageToVideo) {
      // Image-to-Video generation
      result = await higgsfieldRequest("/generate/image-to-video", {
        prompt,
        input_images: [req.inputImageUrl],
        aspect_ratio: template.aspectRatio,
        duration: template.duration,
        enhance_prompt: true,
        model: "dop-lite", // Cost-effective for marketing content
      });
    } else {
      // Text-to-Video generation
      result = await higgsfieldRequest("/generate/text-to-video", {
        prompt,
        aspect_ratio: template.aspectRatio,
        duration: template.duration,
        enhance_prompt: true,
        model: "dop-lite",
      });
    }

    return {
      requestId: result.request_id || result.id || `hf_${Date.now()}`,
      status: "queued",
      prompt,
      template: template.id,
      platform: req.platform,
    };
  } catch (error: any) {
    // If Higgsfield API is not configured, return a mock for development
    if (!process.env.HIGGSFIELD_API_KEY) {
      return {
        requestId: `mock_${Date.now()}`,
        status: "queued",
        prompt,
        template: template.id,
        platform: req.platform,
      };
    }
    throw error;
  }
}

async function checkVideoStatus(requestId: string): Promise<GenerateVideoResult> {
  try {
    const result = await higgsfieldGet(`/requests/${requestId}/status`);
    
    const status = result.status?.toLowerCase() || "processing";
    const mappedStatus = status === "completed" ? "completed" 
      : status === "failed" || status === "error" ? "failed"
      : status === "queued" ? "queued"
      : "processing";

    return {
      requestId,
      status: mappedStatus as any,
      videoUrl: result.output?.media_url?.[0] || result.output?.video_url,
      thumbnailUrl: result.output?.thumbnail_url,
      prompt: result.prompt || "",
      template: result.metadata?.template || "",
      platform: result.metadata?.platform || "",
    };
  } catch (error: any) {
    // Mock response for development
    if (!process.env.HIGGSFIELD_API_KEY) {
      return {
        requestId,
        status: "completed",
        videoUrl: "https://example.com/mock-video.mp4",
        prompt: "",
        template: "",
        platform: "",
      };
    }
    throw error;
  }
}

// ─── Content Calendar & Batch Generation ────────────────────────────────────────

interface ContentCalendarEntry {
  id: string;
  scheduledDate: string;
  templateId: string;
  platform: string;
  status: "draft" | "generating" | "ready" | "posted";
  videoUrl?: string;
  caption?: string;
  hashtags?: string[];
}

async function generateCaption(
  template: MarketingTemplate,
  platform: string,
  targetLanguage?: string,
): Promise<{ caption: string; hashtags: string[] }> {
  const systemPrompt = `You are a social media copywriter for ConnectWorld AI, a language learning app.
Write a short, engaging caption for a ${platform} post about "${template.name}".

RULES:
- Instagram: 1-3 sentences + line break + hashtags (max 2200 chars)
- TikTok: 1-2 punchy sentences (max 150 chars for description)
- YouTube Shorts: 1 sentence title + description (max 100 chars title)
- Use relevant emojis sparingly
- Include a CTA (download app, try free, etc.)
- Make it feel authentic, not corporate
${targetLanguage ? `- Reference ${targetLanguage} learning` : ""}

Return JSON: { "caption": "...", "hashtags": ["tag1", "tag2", ...] }`;

  try {
    const response = await invokeLLM({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Write caption for "${template.name}" on ${platform}` },
      ],
      response_format: { type: "json_object" },
    });

    const content = response.choices?.[0]?.message?.content;
    const text = typeof content === "string" ? content : (content?.find((p: any) => p.type === "text") as any)?.text || "";
    const parsed = JSON.parse(text);
    return {
      caption: parsed.caption || "",
      hashtags: parsed.hashtags || [],
    };
  } catch {
    return {
      caption: `Learn languages the smart way with ConnectWorld AI 🌍✨ #LanguageLearning #ConnectWorldAI`,
      hashtags: ["LanguageLearning", "ConnectWorldAI", "AITranslation", "LearnSpanish"],
    };
  }
}

// ─── tRPC Router ────────────────────────────────────────────────────────────────

export const higgsfieldMarketingRouter = router({
  // Get all available marketing templates
  getTemplates: publicProcedure
    .input(z.object({
      category: z.enum(["feature_promo", "testimonial", "trending", "language_tip", "app_showcase", "referral"]).optional(),
      platform: z.enum(["instagram", "tiktok", "youtube_shorts"]).optional(),
    }).optional())
    .query(({ input }) => {
      let templates = MARKETING_TEMPLATES;
      
      if (input?.category) {
        templates = templates.filter(t => t.category === input.category);
      }
      if (input?.platform) {
        templates = templates.filter(t => t.platform.includes(input.platform!));
      }
      
      return { templates, total: templates.length };
    }),

  // Generate a marketing video
  generateVideo: publicProcedure
    .input(z.object({
      templateId: z.string(),
      platform: z.enum(["instagram", "tiktok", "youtube_shorts"]),
      customPrompt: z.string().optional(),
      targetLanguage: z.string().optional(),
      feature: z.string().optional(),
      slangWord: z.string().optional(),
      teacherName: z.string().optional(),
      inputImageUrl: z.string().url().optional(),
    }))
    .mutation(async ({ input }) => {
      const result = await generateMarketingVideo(input);
      return result;
    }),

  // Check video generation status
  checkStatus: publicProcedure
    .input(z.object({ requestId: z.string() }))
    .query(async ({ input }) => {
      return checkVideoStatus(input.requestId);
    }),

  // Generate AI-optimized caption and hashtags
  generateCaption: publicProcedure
    .input(z.object({
      templateId: z.string(),
      platform: z.enum(["instagram", "tiktok", "youtube_shorts"]),
      targetLanguage: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const template = MARKETING_TEMPLATES.find(t => t.id === input.templateId);
      if (!template) throw new Error(`Template not found: ${input.templateId}`);
      
      return generateCaption(template, input.platform, input.targetLanguage);
    }),

  // Batch generate multiple videos for a content calendar
  batchGenerate: publicProcedure
    .input(z.object({
      entries: z.array(z.object({
        templateId: z.string(),
        platform: z.enum(["instagram", "tiktok", "youtube_shorts"]),
        targetLanguage: z.string().optional(),
        scheduledDate: z.string().optional(),
      })),
    }))
    .mutation(async ({ input }) => {
      const results = [];
      
      for (const entry of input.entries) {
        try {
          const video = await generateMarketingVideo({
            templateId: entry.templateId,
            platform: entry.platform,
            targetLanguage: entry.targetLanguage,
          });
          
          const caption = await generateCaption(
            MARKETING_TEMPLATES.find(t => t.id === entry.templateId)!,
            entry.platform,
            entry.targetLanguage,
          );
          
          results.push({
            ...video,
            caption: caption.caption,
            hashtags: caption.hashtags,
            scheduledDate: entry.scheduledDate,
            success: true,
          });
        } catch (error: any) {
          results.push({
            requestId: "",
            status: "failed" as const,
            prompt: "",
            template: entry.templateId,
            platform: entry.platform,
            caption: "",
            hashtags: [],
            scheduledDate: entry.scheduledDate,
            success: false,
            error: error.message,
          });
        }
      }
      
      return { results, generated: results.filter(r => r.success).length, failed: results.filter(r => !r.success).length };
    }),

  // Get platform-specific recommendations
  getRecommendations: publicProcedure
    .input(z.object({
      platform: z.enum(["instagram", "tiktok", "youtube_shorts"]),
      recentPerformance: z.enum(["low", "medium", "high"]).optional(),
    }))
    .query(({ input }) => {
      const platformTips: Record<string, any> = {
        instagram: {
          bestPostingTimes: ["9:00 AM", "12:00 PM", "7:00 PM"],
          optimalDuration: "15-30 seconds",
          trendingFormats: ["Before/After", "Tutorial Carousel", "Day in Life"],
          hashtagStrategy: "Mix of broad (500K+) and niche (10K-50K) tags",
          hookTiming: "First 1.5 seconds must grab attention",
          recommendedTemplates: ["trending-before-after", "feature-hd-voice", "testimonial-success"],
        },
        tiktok: {
          bestPostingTimes: ["7:00 AM", "12:00 PM", "10:00 PM"],
          optimalDuration: "10-20 seconds",
          trendingFormats: ["Stitch", "Duet", "Green Screen", "Quick Tips"],
          hashtagStrategy: "3-5 trending + 2-3 niche hashtags",
          hookTiming: "First 0.5-1 second — immediate visual hook",
          recommendedTemplates: ["feature-dominican-slang", "trending-before-after", "showcase-video-call"],
        },
        youtube_shorts: {
          bestPostingTimes: ["2:00 PM", "5:00 PM", "9:00 PM"],
          optimalDuration: "15-45 seconds",
          trendingFormats: ["Educational", "Transformation", "Quick Demo"],
          hashtagStrategy: "3 hashtags max, broad reach",
          hookTiming: "First 2 seconds — clear value proposition",
          recommendedTemplates: ["feature-ai-teachers", "showcase-connectworld-tv", "trending-day-in-life"],
        },
      };
      
      return {
        platform: input.platform,
        tips: platformTips[input.platform] || platformTips.instagram,
        algorithmNotes: [
          "Post consistently (3-5x/week minimum)",
          "Engage with comments within first hour",
          "Use trending audio when available",
          "Optimize for watch-through rate (keep it short and punchy)",
          "Cross-post with platform-specific adjustments",
        ],
      };
    }),

  // Generate a weekly content plan
  generateWeeklyPlan: publicProcedure
    .input(z.object({
      platforms: z.array(z.enum(["instagram", "tiktok", "youtube_shorts"])),
      postsPerWeek: z.number().min(1).max(21).default(7),
      focusLanguage: z.string().optional(),
      focusFeature: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const systemPrompt = `You are a social media content strategist for ConnectWorld AI, a language learning app.
Create a weekly content calendar with ${input.postsPerWeek} posts across these platforms: ${input.platforms.join(", ")}.

Available templates:
${MARKETING_TEMPLATES.map(t => `- ${t.id}: ${t.name} (${t.category}) - ${t.description}`).join("\n")}

RULES:
- Mix template categories for variety (don't repeat same type consecutively)
- Prioritize trending formats on TikTok
- Feature promos work best on Instagram
- Educational content performs well on YouTube Shorts
- Include at least 1 referral/growth post per week
${input.focusLanguage ? `- Focus on ${input.focusLanguage} content` : ""}
${input.focusFeature ? `- Highlight the ${input.focusFeature} feature` : ""}

Return JSON: { "plan": [{ "day": "Monday", "platform": "...", "templateId": "...", "caption_hint": "brief caption idea", "best_time": "HH:MM" }] }`;

      try {
        const response = await invokeLLM({
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: "Generate the weekly content plan." },
          ],
          response_format: { type: "json_object" },
        });

        const content = response.choices?.[0]?.message?.content;
        const text = typeof content === "string" ? content : (content?.find((p: any) => p.type === "text") as any)?.text || "";
        const parsed = JSON.parse(text);
        return { success: true, plan: parsed.plan || [] };
      } catch (error: any) {
        // Fallback plan
        const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
        const fallbackPlan = days.slice(0, input.postsPerWeek).map((day, i) => ({
          day,
          platform: input.platforms[i % input.platforms.length],
          templateId: MARKETING_TEMPLATES[i % MARKETING_TEMPLATES.length].id,
          caption_hint: `${MARKETING_TEMPLATES[i % MARKETING_TEMPLATES.length].name} content`,
          best_time: ["9:00", "12:00", "15:00", "18:00", "20:00", "10:00", "14:00"][i],
        }));
        return { success: true, plan: fallbackPlan };
      }
    }),
});
