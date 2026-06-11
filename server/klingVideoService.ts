/**
 * Kling AI Video Generation Service
 * 
 * Generates short entertaining video clips for lessons:
 * - Cultural scenario videos (ordering food, asking directions, etc.)
 * - Vocabulary story animations (visual mnemonics)
 * - Grammar concept visualizations
 * - Reward/celebration clips for achievements
 * - Lesson intro/outro animations
 * 
 * API: https://api.klingai.com/v1
 * Requires: KLING_ACCESS_KEY and KLING_SECRET_KEY environment variables
 */

import { router as trpcRouter, publicProcedure } from "./_core/trpc";
import { z } from "zod";
import * as jose from "jose";

const KLING_API_BASE = "https://api-singapore.klingai.com";

// Video template categories for language learning
const VIDEO_CATEGORIES = {
  "cultural-scenario": {
    label: "Cultural Scenario",
    description: "Real-life situations in the target culture",
    examples: ["Ordering at a taqueria", "Haggling at a market", "Meeting someone's family"],
  },
  "vocabulary-story": {
    label: "Vocabulary Story",
    description: "Visual stories that make words memorable",
    examples: ["The word 'mariposa' (butterfly) flying through a garden", "The journey of 'camino' (path)"],
  },
  "grammar-visual": {
    label: "Grammar Visual",
    description: "Animated explanations of grammar concepts",
    examples: ["Ser vs Estar shown as permanent vs temporary states", "Verb conjugation patterns"],
  },
  "celebration": {
    label: "Celebration",
    description: "Reward clips for achievements and streaks",
    examples: ["Fireworks for completing a level", "Dance celebration for 7-day streak"],
  },
  "lesson-intro": {
    label: "Lesson Intro",
    description: "Short animated intros for lesson topics",
    examples: ["Travel theme for travel vocabulary", "Kitchen scene for food vocabulary"],
  },
  "immersion-clip": {
    label: "Immersion Clip",
    description: "Short clips simulating being in the country",
    examples: ["Walking through streets of Mexico City", "Café scene in Paris"],
  },
};

interface VideoGenerationJob {
  id: string;
  status: "pending" | "processing" | "completed" | "failed";
  category: string;
  prompt: string;
  videoUrl?: string;
  thumbnailUrl?: string;
  duration: number;
  createdAt: Date;
  taskId?: string;
}

const videoJobs = new Map<string, VideoGenerationJob>();

// Pre-built video prompts for common lesson scenarios
const LESSON_VIDEO_PROMPTS: Record<string, string[]> = {
  "food-ordering": [
    "A person walking into a colorful Mexican restaurant, sitting down, and a friendly waiter approaching with a menu, warm lighting, cinematic",
    "Close-up of hands pointing at a menu with Spanish text, then a plate of tacos being served with steam rising, vibrant colors",
    "A busy street food market in Mexico City at night, neon lights, people ordering from vendors, authentic atmosphere",
  ],
  "greetings": [
    "Two people meeting on a sunny street in Barcelona, warmly greeting each other with a kiss on each cheek, Mediterranean architecture",
    "A group of friends arriving at a house party in Colombia, everyone hugging and greeting enthusiastically, colorful decorations",
  ],
  "directions": [
    "A tourist looking at a map on a cobblestone street in a Latin American city, then asking a local for directions, the local pointing and gesturing",
    "An aerial view of a city transitioning to street level, showing landmarks and street signs in Spanish",
  ],
  "shopping": [
    "A vibrant open-air market with colorful textiles and crafts, a customer examining handmade jewelry and negotiating price with a vendor",
    "A modern shopping mall in Madrid, people carrying bags, window displays with sale signs in Spanish",
  ],
  "travel": [
    "An airplane landing at a tropical airport, then a traveler walking through customs and immigration, signs in Spanish",
    "A scenic train ride through the Andes mountains, lush green valleys, small villages passing by",
  ],
};

export const klingVideoRouter = trpcRouter({
  // List available video categories
  listCategories: publicProcedure.query(() => {
    return Object.entries(VIDEO_CATEGORIES).map(([key, val]) => ({
      id: key,
      ...val,
    }));
  }),

  // Generate a lesson video clip
  generateLessonVideo: publicProcedure
    .input(z.object({
      category: z.enum(["cultural-scenario", "vocabulary-story", "grammar-visual", "celebration", "lesson-intro", "immersion-clip"]),
      topic: z.string(),
      language: z.string(),
      prompt: z.string().optional(),
      duration: z.number().min(3).max(10).default(5),
      aspectRatio: z.enum(["16:9", "9:16", "1:1"]).default("9:16"),
    }))
    .mutation(async ({ input }) => {
      const jobId = `kling-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

      // Build prompt from category + topic if not provided
      const videoPrompt = input.prompt || buildVideoPrompt(input.category, input.topic, input.language);

      const job: VideoGenerationJob = {
        id: jobId,
        status: "pending",
        category: input.category,
        prompt: videoPrompt,
        duration: input.duration,
        createdAt: new Date(),
      };
      videoJobs.set(jobId, job);

      const accessKey = process.env.KLING_ACCESS_KEY;
      const secretKey = process.env.KLING_SECRET_KEY;

      if (!accessKey || !secretKey) {
        // Demo mode
        setTimeout(() => {
          const j = videoJobs.get(jobId);
          if (j) {
            j.status = "completed";
            j.videoUrl = `https://demo.klingai.com/videos/${jobId}.mp4`;
            j.thumbnailUrl = `https://demo.klingai.com/thumbnails/${jobId}.jpg`;
          }
        }, 5000);

        return { jobId, status: "pending", prompt: videoPrompt, estimatedWait: "30-60 seconds" };
      }

      // Production: call Kling AI API
      try {
        const token = await getKlingToken(accessKey, secretKey);

        const response = await fetch(`${KLING_API_BASE}/v1/videos/text2video`, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model_name: "kling-v2-6",
            prompt: videoPrompt,
            negative_prompt: "blurry, low quality, distorted faces, text overlay, watermark",
            cfg_scale: 0.5,
            mode: "std",
            aspect_ratio: input.aspectRatio,
            duration: `${input.duration}`,
          }),
        });

        if (!response.ok) {
          job.status = "failed";
          throw new Error(`Kling API error: ${response.status}`);
        }

        const data = await response.json();
        if (data.code === 0 && data.data?.task_id) {
          job.status = "processing";
          job.taskId = data.data.task_id;
          pollKlingStatus(jobId, data.data.task_id, accessKey, secretKey);
        } else {
          job.status = "failed";
        }

        return { jobId, taskId: data.data?.task_id, status: "processing", prompt: videoPrompt };
      } catch (error: any) {
        job.status = "failed";
        throw new Error(`Video generation failed: ${error.message}`);
      }
    }),

  // Get video generation status
  getVideoStatus: publicProcedure
    .input(z.object({ jobId: z.string() }))
    .query(({ input }) => {
      const job = videoJobs.get(input.jobId);
      if (!job) throw new Error("Job not found");
      return {
        id: job.id,
        status: job.status,
        videoUrl: job.videoUrl,
        thumbnailUrl: job.thumbnailUrl,
        category: job.category,
        duration: job.duration,
        prompt: job.prompt,
      };
    }),

  // Get pre-built prompts for a lesson topic
  getLessonPrompts: publicProcedure
    .input(z.object({ topic: z.string() }))
    .query(({ input }) => {
      const key = input.topic.toLowerCase().replace(/\s+/g, "-");
      const prompts = LESSON_VIDEO_PROMPTS[key] || [];
      return {
        topic: input.topic,
        prompts,
        hasPrebuilt: prompts.length > 0,
      };
    }),

  // === ERROR CORRECTION VIDEO (Kling animates teacher photo) ===
  generateErrorCorrection: publicProcedure
    .input(z.object({
      teacherName: z.string(),
      teacherPhotoUrl: z.string(),
      originalMistake: z.string(),
      correction: z.string(),
      explanation: z.string(),
      language: z.string(),
      studentName: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const jobId = `correction-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

      // Build a prompt that animates the teacher photo speaking the correction
      const prompt = `A professional language teacher (use reference image) speaking directly to camera with warm, encouraging expression. The teacher is explaining a language correction with gentle hand gestures. Soft classroom lighting, shallow depth of field, intimate close-up framing. Natural head movements and blinking. Professional educational video quality.`;

      const job: VideoGenerationJob = {
        id: jobId,
        status: "pending",
        category: "error-correction",
        prompt,
        duration: 8,
        createdAt: new Date(),
      };
      videoJobs.set(jobId, job);

      const accessKey = process.env.KLING_ACCESS_KEY;
      const secretKey = process.env.KLING_SECRET_KEY;

      if (!accessKey || !secretKey) {
        // Demo mode
        setTimeout(() => {
          const j = videoJobs.get(jobId);
          if (j) {
            j.status = "completed";
            j.videoUrl = `https://demo.klingai.com/corrections/${jobId}.mp4`;
            j.thumbnailUrl = input.teacherPhotoUrl;
          }
        }, 3000);
        return {
          jobId,
          status: "pending",
          script: `Hi${input.studentName ? ` ${input.studentName}` : ""}! Quick correction from our last session. You said \"${input.originalMistake}\" — the correct way is \"${input.correction}\". ${input.explanation}. Keep it up!`,
          estimatedWait: "30-60 seconds",
        };
      }

      // Production: use Kling image-to-video API
      try {
        const token = await getKlingToken(accessKey, secretKey);
        const response = await fetch(`${KLING_API_BASE}/v1/videos/image2video`, {
          method: "POST",
          headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            model_name: "kling-v2-6",
            image: input.teacherPhotoUrl,
            prompt: prompt,
            negative_prompt: "blurry, distorted, unnatural movement, text overlay",
            cfg_scale: 0.5,
            mode: "std",
            duration: "8",
          }),
        });

        if (!response.ok) { job.status = "failed"; throw new Error(`Kling API error: ${response.status}`); }
        const data = await response.json();
        if (data.code === 0 && data.data?.task_id) {
          job.status = "processing";
          job.taskId = data.data.task_id;
          pollKlingStatus(jobId, data.data.task_id, accessKey, secretKey);
        } else {
          job.status = "failed";
        }
        return { jobId, taskId: data.data?.task_id, status: "processing" };
      } catch (error: any) {
        job.status = "failed";
        throw new Error(`Error correction video failed: ${error.message}`);
      }
    }),

  // === ONBOARDING WELCOME VIDEO (Kling animates chosen teacher photo) ===
  generateOnboardingWelcome: publicProcedure
    .input(z.object({
      teacherName: z.string(),
      teacherPhotoUrl: z.string(),
      studentName: z.string().optional(),
      targetLanguage: z.string(),
      nativeLanguage: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const jobId = `welcome-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

      const prompt = `A warm, friendly language teacher (use reference image) looking directly at camera with a big genuine smile, waving hello. The teacher then gestures welcomingly with open arms. Bright, warm lighting with soft bokeh background. Natural, human-like movements — blinking, slight head tilts, breathing. Close-up portrait framing. Inviting and personal atmosphere.`;

      const job: VideoGenerationJob = {
        id: jobId,
        status: "pending",
        category: "onboarding-welcome",
        prompt,
        duration: 10,
        createdAt: new Date(),
      };
      videoJobs.set(jobId, job);

      const accessKey = process.env.KLING_ACCESS_KEY;
      const secretKey = process.env.KLING_SECRET_KEY;

      const welcomeScript = `${input.studentName ? `Hi ${input.studentName}!` : "Hi there!"} I'm ${input.teacherName}, and I'm so excited to be your ${input.targetLanguage} teacher! We're going to have an amazing time learning together. Whether you're a complete beginner or looking to level up, I'm here for you. Let's make ${input.targetLanguage} your superpower. Ready? Let's go!`;

      if (!accessKey || !secretKey) {
        // Demo mode
        setTimeout(() => {
          const j = videoJobs.get(jobId);
          if (j) {
            j.status = "completed";
            j.videoUrl = `https://demo.klingai.com/welcome/${jobId}.mp4`;
            j.thumbnailUrl = input.teacherPhotoUrl;
          }
        }, 3000);
        return { jobId, status: "pending", script: welcomeScript, estimatedWait: "30-60 seconds" };
      }

      // Production: use Kling image-to-video
      try {
        const token = await getKlingToken(accessKey, secretKey);
        const response = await fetch(`${KLING_API_BASE}/v1/videos/image2video`, {
          method: "POST",
          headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            model_name: "kling-v2-6",
            image: input.teacherPhotoUrl,
            prompt: prompt,
            negative_prompt: "blurry, distorted, unnatural, stiff, robotic",
            cfg_scale: 0.5,
            mode: "std",
            duration: "10",
          }),
        });

        if (!response.ok) { job.status = "failed"; throw new Error(`Kling API error: ${response.status}`); }
        const data = await response.json();
        if (data.code === 0 && data.data?.task_id) {
          job.status = "processing";
          job.taskId = data.data.task_id;
          pollKlingStatus(jobId, data.data.task_id, accessKey, secretKey);
        } else {
          job.status = "failed";
        }
        return { jobId, taskId: data.data?.task_id, status: "processing", script: welcomeScript };
      } catch (error: any) {
        job.status = "failed";
        throw new Error(`Welcome video generation failed: ${error.message}`);
      }
    }),

  // Generate a celebration/reward video
  generateCelebration: publicProcedure
    .input(z.object({
      achievement: z.string(),
      streakDays: z.number().optional(),
      level: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const prompt = buildCelebrationPrompt(input.achievement, input.streakDays, input.level);
      const jobId = `celebrate-${Date.now()}`;

      const job: VideoGenerationJob = {
        id: jobId,
        status: "completed",
        category: "celebration",
        prompt,
        videoUrl: `https://demo.klingai.com/celebrations/${jobId}.mp4`,
        thumbnailUrl: `https://demo.klingai.com/celebrations/${jobId}.jpg`,
        duration: 5,
        createdAt: new Date(),
      };
      videoJobs.set(jobId, job);

      return { jobId, status: "completed", videoUrl: job.videoUrl };
    }),
});

// Helper: build video prompt from category and topic
function buildVideoPrompt(category: string, topic: string, language: string): string {
  const languageContext: Record<string, string> = {
    Spanish: "Latin American or Spanish",
    French: "French or Francophone",
    Portuguese: "Brazilian or Portuguese",
    Japanese: "Japanese",
    Chinese: "Chinese",
    Arabic: "Middle Eastern or North African",
    Korean: "Korean",
    German: "German or Austrian",
    Italian: "Italian",
    Hindi: "Indian",
  };

  const context = languageContext[language] || language;

  switch (category) {
    case "cultural-scenario":
      return `A realistic ${context} cultural scene showing "${topic}". Warm natural lighting, authentic setting, diverse people interacting naturally. Cinematic quality, 4K, no text overlays.`;
    case "vocabulary-story":
      return `A creative visual metaphor for the word/phrase "${topic}" in ${language}. Artistic, colorful, dreamlike quality with smooth transitions. Abstract yet meaningful imagery that helps memorize the concept.`;
    case "grammar-visual":
      return `An elegant animated visualization showing the grammar concept "${topic}" in ${language}. Clean, modern design with smooth morphing transitions. Educational yet visually stunning.`;
    case "lesson-intro":
      return `A cinematic establishing shot for a ${language} lesson about "${topic}". Beautiful ${context} scenery, golden hour lighting, smooth camera movement. Sets the mood for learning.`;
    case "immersion-clip":
      return `A first-person walking tour through a ${context} city or town, showing "${topic}". Authentic street sounds, natural movement, real-life atmosphere. Makes the viewer feel transported there.`;
    default:
      return `A beautiful ${context} scene related to "${topic}". High quality, cinematic, engaging. No text overlays.`;
  }
}

// Helper: build celebration prompt
function buildCelebrationPrompt(achievement: string, streakDays?: number, level?: string): string {
  if (streakDays && streakDays >= 30) {
    return "Epic celebration with golden confetti raining down, fireworks exploding in the sky, a trophy materializing with golden light, triumphant atmosphere, cinematic slow motion";
  }
  if (streakDays && streakDays >= 7) {
    return "Colorful confetti explosion, balloons rising, sparklers and party atmosphere, joyful celebration, warm golden lighting";
  }
  if (level) {
    return `A magical level-up transformation, energy swirling around a glowing orb that transforms into a ${level} badge, epic lighting, fantasy atmosphere`;
  }
  return "A cheerful celebration with confetti, sparkles, and warm golden light, positive energy, achievement unlocked feeling";
}

// Helper: get Kling API token using JWT (HS256) per Kling API docs
async function getKlingToken(accessKey: string, secretKey: string): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const secret = new TextEncoder().encode(secretKey);
  const token = await new jose.SignJWT({ iss: accessKey, exp: now + 1800, nbf: now - 5 })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .sign(secret);
  return token;
}

// Helper: poll Kling API for video completion
async function pollKlingStatus(jobId: string, taskId: string, accessKey: string, secretKey: string) {
  const maxAttempts = 60;
  let attempts = 0;

  const poll = async () => {
    attempts++;
    if (attempts > maxAttempts) {
      const job = videoJobs.get(jobId);
      if (job) job.status = "failed";
      return;
    }

    try {
      const token = await getKlingToken(accessKey, secretKey);
      const response = await fetch(`${KLING_API_BASE}/v1/videos/text2video/${taskId}`, {
        headers: { "Authorization": `Bearer ${token}` },
      });
      const data = await response.json();

      if (data.data?.task_status === "succeed") {
        const job = videoJobs.get(jobId);
        if (job) {
          job.status = "completed";
          const video = data.data.task_result?.videos?.[0];
          if (video) {
            job.videoUrl = video.url;
            job.thumbnailUrl = video.url + "?x-oss-process=video/snapshot,t_1000,f_jpg";
          }
        }
      } else if (data.data?.task_status === "failed") {
        const job = videoJobs.get(jobId);
        if (job) job.status = "failed";
      } else {
        setTimeout(poll, 10000);
      }
    } catch {
      setTimeout(poll, 15000);
    }
  };

  setTimeout(poll, 15000);
}
