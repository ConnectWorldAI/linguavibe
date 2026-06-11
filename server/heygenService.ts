/**
 * HeyGen AI Video Service
 *
 * Three core capabilities:
 * 1. Video Dubbing / Lip-Sync Translation — Translate existing videos into other languages
 *    with lip-sync so the speaker's mouth matches the new audio.
 * 2. Talking-Head Avatar Videos — Generate polished avatar videos from scripts for
 *    ConnectWorld AI TV episodes, course previews, and teacher content.
 * 3. Teacher Video Generation — Create on-demand teacher explanation/correction videos.
 *
 * API: https://api.heygen.com/v2
 * Requires: HEYGEN_API_KEY environment variable
 * Optional: HEYGEN_AGENT_API_KEY for interactive avatar agents (future)
 */

import { router as trpcRouter, publicProcedure } from "./_core/trpc";
import { z } from "zod";
import { executeAutoPost } from "./autoPostPipeline";

const HEYGEN_API_BASE = "https://api.heygen.com";

// ---------- Types ----------

interface HeyGenVideoJob {
  id: string;
  heygenVideoId?: string;
  status: "pending" | "processing" | "completed" | "failed";
  type: "dubbing" | "avatar-video" | "teacher-video" | "tv-episode" | "course-preview";
  createdAt: Date;
  completedAt?: Date;
  videoUrl?: string;
  thumbnailUrl?: string;
  duration?: number;
  error?: string;
  metadata: Record<string, any>;
}

// In-memory job store (production: migrate to PostgreSQL)
const videoJobs = new Map<string, HeyGenVideoJob>();

// ---------- HeyGen API Helpers ----------

async function heygenFetch(endpoint: string, options: RequestInit = {}): Promise<Response> {
  const apiKey = process.env.HEYGEN_API_KEY;
  if (!apiKey) throw new Error("HEYGEN_API_KEY not configured");

  return fetch(`${HEYGEN_API_BASE}${endpoint}`, {
    ...options,
    headers: {
      "X-Api-Key": apiKey,
      "Content-Type": "application/json",
      "Accept": "application/json",
      ...(options.headers || {}),
    },
  });
}

/**
 * Check remaining quota on the HeyGen account
 */
async function getQuota(): Promise<{ remaining: number; used: number }> {
  const res = await heygenFetch("/v2/user/remaining_quota");
  if (!res.ok) throw new Error(`HeyGen quota check failed: ${res.status}`);
  const data = await res.json();
  return {
    remaining: data.data?.remaining_quota ?? 0,
    used: data.data?.used_quota ?? 0,
  };
}

/**
 * Create an avatar video from a script using HeyGen's v2 API
 */
async function createAvatarVideo(params: {
  avatarId: string;
  voiceId: string;
  script: string;
  title: string;
  background?: string;
  aspectRatio?: "16:9" | "9:16" | "1:1";
}): Promise<{ videoId: string }> {
  const res = await heygenFetch("/v2/video/generate", {
    method: "POST",
    body: JSON.stringify({
      video_inputs: [
        {
          character: {
            type: "avatar",
            avatar_id: params.avatarId,
            avatar_style: "normal",
          },
          voice: {
            type: "text",
            input_text: params.script,
            voice_id: params.voiceId,
            speed: 1.0,
          },
          background: params.background
            ? { type: "color", value: params.background }
            : { type: "color", value: "#f5f5f5" },
        },
      ],
      dimension: params.aspectRatio === "9:16"
        ? { width: 1080, height: 1920 }
        : params.aspectRatio === "1:1"
          ? { width: 1080, height: 1080 }
          : { width: 1920, height: 1080 },
      title: params.title,
    }),
  });

  if (!res.ok) {
    const errBody = await res.text();
    throw new Error(`HeyGen video creation failed (${res.status}): ${errBody}`);
  }

  const data = await res.json();
  return { videoId: data.data?.video_id };
}

/**
 * Create a video dubbing / translation job
 */
async function createVideoDubbing(params: {
  videoUrl: string;
  sourceLanguage: string;
  targetLanguage: string;
  title?: string;
}): Promise<{ videoTranslateId: string }> {
  const res = await heygenFetch("/v2/video_translate/translate", {
    method: "POST",
    body: JSON.stringify({
      video_url: params.videoUrl,
      output_language: params.targetLanguage,
      title: params.title || `Dub ${params.sourceLanguage} → ${params.targetLanguage}`,
    }),
  });

  if (!res.ok) {
    const errBody = await res.text();
    throw new Error(`HeyGen dubbing failed (${res.status}): ${errBody}`);
  }

  const data = await res.json();
  return { videoTranslateId: data.data?.video_translate_id };
}

/**
 * Check the status of a generated video
 */
async function checkVideoStatus(videoId: string): Promise<{
  status: string;
  videoUrl?: string;
  thumbnailUrl?: string;
  duration?: number;
}> {
  const res = await heygenFetch(`/v1/video_status.get?video_id=${videoId}`);
  if (!res.ok) throw new Error(`HeyGen status check failed: ${res.status}`);
  const data = await res.json();
  return {
    status: data.data?.status, // "processing" | "completed" | "failed"
    videoUrl: data.data?.video_url,
    thumbnailUrl: data.data?.thumbnail_url,
    duration: data.data?.duration,
  };
}

/**
 * Check the status of a video translation/dubbing job
 */
async function checkDubbingStatus(translateId: string): Promise<{
  status: string;
  videoUrl?: string;
  title?: string;
}> {
  const res = await heygenFetch(`/v2/video_translate/${translateId}`);
  if (!res.ok) throw new Error(`HeyGen dubbing status check failed: ${res.status}`);
  const data = await res.json();
  return {
    status: data.data?.status, // "pending" | "processing" | "completed" | "failed"
    videoUrl: data.data?.url,
    title: data.data?.title,
  };
}

/**
 * List available HeyGen avatars
 */
async function listAvatars(): Promise<any[]> {
  const res = await heygenFetch("/v2/avatars");
  if (!res.ok) throw new Error(`HeyGen avatar list failed: ${res.status}`);
  const data = await res.json();
  return data.data?.avatars || [];
}

/**
 * List available HeyGen voices
 */
async function listVoices(): Promise<any[]> {
  const res = await heygenFetch("/v2/voices");
  if (!res.ok) throw new Error(`HeyGen voice list failed: ${res.status}`);
  const data = await res.json();
  return data.data?.voices || [];
}

// ---------- Background Polling ----------

function pollJobCompletion(jobId: string, heygenId: string, type: "video" | "dubbing") {
  let attempts = 0;
  const maxAttempts = 120; // 20 minutes max

  const poll = async () => {
    attempts++;
    if (attempts > maxAttempts) {
      const job = videoJobs.get(jobId);
      if (job) { job.status = "failed"; job.error = "Timed out waiting for HeyGen"; }
      return;
    }

    try {
      if (type === "video") {
        const result = await checkVideoStatus(heygenId);
        if (result.status === "completed") {
          const job = videoJobs.get(jobId);
          if (job) {
            job.status = "completed";
            job.videoUrl = result.videoUrl;
            job.thumbnailUrl = result.thumbnailUrl;
            job.duration = result.duration;
            job.completedAt = new Date();

            // Auto-post pipeline: if job has platform metadata, post automatically
            const platforms = job.metadata?.platforms?.split(",").filter(Boolean);
            if (platforms && platforms.length > 0 && result.videoUrl) {
              executeAutoPost({
                videoJobId: jobId,
                videoUrl: result.videoUrl,
                thumbnailUrl: result.thumbnailUrl,
                influencerId: job.metadata?.influencerId || "unknown",
                influencerName: job.metadata?.influencerName || "ConnectWorld AI",
                script: job.metadata?.script || "",
                platforms,
                postToApp: job.metadata?.postToApp === "true",
              }).catch((err) => console.error(`[AutoPost] Failed for job ${jobId}:`, err.message));
            }
          }
          return;
        } else if (result.status === "failed") {
          const job = videoJobs.get(jobId);
          if (job) { job.status = "failed"; job.error = "HeyGen generation failed"; }
          return;
        }
      } else {
        const result = await checkDubbingStatus(heygenId);
        if (result.status === "completed") {
          const job = videoJobs.get(jobId);
          if (job) {
            job.status = "completed";
            job.videoUrl = result.videoUrl;
            job.completedAt = new Date();
          }
          return;
        } else if (result.status === "failed") {
          const job = videoJobs.get(jobId);
          if (job) { job.status = "failed"; job.error = "HeyGen dubbing failed"; }
          return;
        }
      }
      // Still processing — poll again in 10s
      setTimeout(poll, 10000);
    } catch (err) {
      // Retry on transient errors
      setTimeout(poll, 15000);
    }
  };

  setTimeout(poll, 10000);
}

// ---------- Teacher Avatar Mapping ----------
// Maps our teacher IDs to HeyGen STOCK avatar/voice combos
// Stock avatars have professional-quality lip-sync (much better than Photo Avatars)
// Matched by ethnicity, gender, and regional appearance to our teacher registry
// Original teacher photos are kept in teacher-registry.ts for profile cards

const TEACHER_HEYGEN_MAP: Record<string, {
  avatarId: string;
  voiceId: string;
  name: string;
  language: string;
  gender: "male" | "female";
  stockAvatarName: string; // HeyGen stock avatar character name for reference
  customAvatarId?: string; // Override with custom-trained HeyGen avatar
}> = {
  // === SPANISH DIALECT SPECIALISTS ===
  // Latina females matched to HeyGen Latina stock avatars
  maria: { avatarId: "Adriana_Business_Front_2_public", voiceId: "es_female_maria", name: "María", language: "Mexican Spanish", gender: "female", stockAvatarName: "Adriana" },
  carlos: { avatarId: "Armando_Casual_Front_public", voiceId: "es_male_carlos", name: "Carlos", language: "Colombian Spanish", gender: "male", stockAvatarName: "Armando" },
  rafael: { avatarId: "Crisanto_Business_Front_public", voiceId: "es_male_rafael", name: "Rafael", language: "Dominican Spanish", gender: "male", stockAvatarName: "Crisanto" },
  luis: { avatarId: "Raul_standing_casualsofa_front_close", voiceId: "es_male_luis", name: "Luis", language: "Puerto Rican Spanish", gender: "male", stockAvatarName: "Raul" },
  valentina: { avatarId: "Hada_Casual_Sitting_Front_2_public", voiceId: "es_female_valentina", name: "Valentina", language: "Argentine Spanish", gender: "female", stockAvatarName: "Hada" },
  sofia: { avatarId: "Mireia_sitting_businessindoor_front", voiceId: "es_female_sofia", name: "Sofía", language: "Castilian Spanish", gender: "female", stockAvatarName: "Mireia" },

  // === PORTUGUESE ===
  isabela: { avatarId: "Lina_Casual_Sitting_Front_public", voiceId: "pt_female_isabela", name: "Isabela", language: "Brazilian Portuguese", gender: "female", stockAvatarName: "Lina" },
  camila: { avatarId: "Carlotta_Casual_Sitting_Front_public", voiceId: "pt_female_camila", name: "Camila", language: "Brazilian Portuguese", gender: "female", stockAvatarName: "Carlotta" },

  // === FRENCH ===
  jean: { avatarId: "Lucien_public_5", voiceId: "fr_male_jean", name: "Jean-Pierre", language: "Parisian French", gender: "male", stockAvatarName: "Lucien" },
  "marie-claire": { avatarId: "Candace_Beige_Dress_Front", voiceId: "fr_female_marie", name: "Marie-Claire", language: "Haitian Creole", gender: "female", stockAvatarName: "Candace" },

  // === EAST ASIAN ===
  yuki: { avatarId: "Miyu_sitting_sofacasual_front", voiceId: "ja_female_yuki", name: "Yuki", language: "Japanese", gender: "female", stockAvatarName: "Miyu" },
  jimin: { avatarId: "Minho_public_2", voiceId: "ko_male_jimin", name: "Jimin", language: "Korean", gender: "male", stockAvatarName: "Minho" },
  wei: { avatarId: "Ren_sitting_sofacasual_front", voiceId: "zh_male_wei", name: "Wei", language: "Mandarin Chinese", gender: "male", stockAvatarName: "Ren" },
  "mei-ling": { avatarId: "Jin_Casual_Sitting_Front_public", voiceId: "zh_female_mei", name: "Mei-Ling", language: "Cantonese", gender: "female", stockAvatarName: "Jin" },

  // === MIDDLE EAST & NORTH AFRICA ===
  ahmed: { avatarId: "Nadim_public_5", voiceId: "ar_male_ahmed", name: "Ahmed", language: "Egyptian Arabic", gender: "male", stockAvatarName: "Nadim" },
  yasmine: { avatarId: "Nour_public_1", voiceId: "ar_female_yasmine", name: "Yasmine", language: "Moroccan Arabic", gender: "female", stockAvatarName: "Nour" },

  // === EUROPEAN ===
  hans: { avatarId: "Bojan_sitting_businesstraining_front", voiceId: "de_male_hans", name: "Hans", language: "German", gender: "male", stockAvatarName: "Bojan" },
  giulia: { avatarId: "Giulia_standing_office_front", voiceId: "it_female_giulia", name: "Giulia", language: "Italian", gender: "female", stockAvatarName: "Giulia" },
  pieter: { avatarId: "Leos_standing_office_front", voiceId: "nl_male_pieter", name: "Pieter", language: "Dutch", gender: "male", stockAvatarName: "Leos" },
  natasha: { avatarId: "Oxana_standing_gym_front", voiceId: "ru_female_natasha", name: "Natasha", language: "Russian", gender: "female", stockAvatarName: "Oxana" },
  emre: { avatarId: "Onat_Casual_Sitting_Front_public", voiceId: "tr_male_emre", name: "Emre", language: "Turkish", gender: "male", stockAvatarName: "Onat" },

  // === SOUTHEAST ASIAN ===
  linh: { avatarId: "Kavya_standing_indoor_front", voiceId: "vi_female_linh", name: "Linh", language: "Vietnamese", gender: "female", stockAvatarName: "Kavya" },
  somchai: { avatarId: "Aditya_public_4", voiceId: "th_male_somchai", name: "Somchai", language: "Thai", gender: "male", stockAvatarName: "Aditya" },

  // === SOUTH ASIAN ===
  priya: { avatarId: "Seema_Casual_Sitting_Front_public", voiceId: "hi_female_priya", name: "Priya", language: "Hindi", gender: "female", stockAvatarName: "Seema" },

  // === AFRICAN ===
  kwame: { avatarId: "Diran_Casual_Front_public", voiceId: "en_male_kwame", name: "Kwame", language: "Twi/English", gender: "male", stockAvatarName: "Diran" },
  amara: { avatarId: "Fina_Casual_Sitting_Front_public", voiceId: "sw_female_amara", name: "Amara", language: "Swahili", gender: "female", stockAvatarName: "Fina" },

  // === TAGALOG / FILIPINO ===
  miguel: { avatarId: "Fernando_sitting_businessindoor_front", voiceId: "tl_male_miguel", name: "Miguel", language: "Filipino", gender: "male", stockAvatarName: "Fernando" },

  // === POLISH ===
  anna: { avatarId: "Zosia_public_2", voiceId: "pl_female_anna", name: "Anna", language: "Polish", gender: "female", stockAvatarName: "Zosia" },

  // === ENGLISH SPECIALISTS ===
  olivia: { avatarId: "Annie_Business_Casual_Standing_Front_2_public", voiceId: "en_female_olivia", name: "Olivia", language: "Australian English", gender: "female", stockAvatarName: "Annie" },
  marcus: { avatarId: "Marcus_Casual_Sitting_Front_2_public", voiceId: "en_male_marcus", name: "Marcus", language: "Caribbean English", gender: "male", stockAvatarName: "Marcus" },
  james: { avatarId: "Bradley_Blue_Polo_Front", voiceId: "en_male_james", name: "James", language: "British English", gender: "male", stockAvatarName: "Bradley" },
  chioma: { avatarId: "Candace_Beige_Dress_Front", voiceId: "en_female_chioma", name: "Chioma", language: "Nigerian English", gender: "female", stockAvatarName: "Candace" },
  "priya-en": { avatarId: "Seema_Business_Front_public", voiceId: "en_female_priya", name: "Priya", language: "Indian English", gender: "female", stockAvatarName: "Seema" },
  thabo: { avatarId: "Darnell_Blue_Shirt_Front", voiceId: "en_male_thabo", name: "Thabo", language: "South African English", gender: "male", stockAvatarName: "Darnell" },
};

/**
 * Stock Avatar Matching Strategy:
 * 
 * We use HeyGen's pre-made stock avatars (not Photo Avatars) for better lip-sync quality.
 * Each teacher is matched to a stock avatar by ethnicity, gender, and regional appearance.
 * Original teacher photos from teacher-registry.ts are kept for profile cards in the app.
 * 
 * Custom Avatar Creation Guide:
 * 1. POST to /v2/photo_avatar/create with teacher photo URL
 * 2. Wait for avatar training to complete (5-10 minutes)
 * 3. Set customAvatarId field on the teacher entry
 * 4. The system prefers customAvatarId over default avatarId in generation
 * 
 * For voices:
 * 1. Go to HeyGen Dashboard → Voices → Voice Cloning
 * 2. Upload a 30-second sample of the teacher's voice (from ElevenLabs or recordings)
 * 3. Copy the voice_id and update the voiceId field
 */

// HeyGen language code mapping
const HEYGEN_LANGUAGE_MAP: Record<string, string> = {
  en: "English", es: "Spanish", fr: "French", de: "German",
  it: "Italian", pt: "Portuguese", ja: "Japanese", ko: "Korean",
  zh: "Chinese", ar: "Arabic", hi: "Hindi", ru: "Russian",
  nl: "Dutch", pl: "Polish", tr: "Turkish", th: "Thai",
  vi: "Vietnamese", id: "Indonesian", tl: "Filipino", sw: "Swahili",
};

// ---------- tRPC Router ----------

export const heygenRouter = trpcRouter({
  /**
   * Get HeyGen account quota
   */
  getQuota: publicProcedure.query(async () => {
    const apiKey = process.env.HEYGEN_API_KEY;
    if (!apiKey) return { remaining: 0, used: 0, configured: false };
    try {
      const quota = await getQuota();
      return { ...quota, configured: true };
    } catch (err: any) {
      return { remaining: 0, used: 0, configured: true, error: err.message };
    }
  }),

  /**
   * List available HeyGen avatars
   */
  listAvatars: publicProcedure.query(async () => {
    const apiKey = process.env.HEYGEN_API_KEY;
    if (!apiKey) return { avatars: [], configured: false };
    try {
      const avatars = await listAvatars();
      return { avatars, configured: true };
    } catch (err: any) {
      return { avatars: [], configured: true, error: err.message };
    }
  }),

  /**
   * List available HeyGen voices
   */
  listVoices: publicProcedure.query(async () => {
    const apiKey = process.env.HEYGEN_API_KEY;
    if (!apiKey) return { voices: [], configured: false };
    try {
      const voices = await listVoices();
      return { voices, configured: true };
    } catch (err: any) {
      return { voices: [], configured: true, error: err.message };
    }
  }),

  /**
   * Generate a talking-head avatar video from a script
   * Used for: ConnectWorld AI TV episodes, course previews, teacher content
   */
  generateAvatarVideo: publicProcedure
    .input(z.object({
      teacherId: z.string().optional(),
      avatarId: z.string().optional(),
      voiceId: z.string().optional(),
      script: z.string().min(1).max(10000),
      title: z.string().default("ConnectWorld AI Video"),
      type: z.enum(["tv-episode", "course-preview", "teacher-video"]).default("teacher-video"),
      aspectRatio: z.enum(["16:9", "9:16", "1:1"]).default("16:9"),
      background: z.string().optional(),
      metadata: z.record(z.string(), z.any()).optional(),
    }))
    .mutation(async ({ input }) => {
      const apiKey = process.env.HEYGEN_API_KEY;
      const jobId = `hg-${input.type}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

      // Resolve avatar/voice from teacher mapping or direct IDs
      let avatarId = input.avatarId || "Daisy-inskirt-20220818";
      let voiceId = input.voiceId || "en_us_001";

      if (input.teacherId && TEACHER_HEYGEN_MAP[input.teacherId]) {
        const teacher = TEACHER_HEYGEN_MAP[input.teacherId];
        avatarId = teacher.customAvatarId || teacher.avatarId;
        voiceId = teacher.voiceId;
      }

      const job: HeyGenVideoJob = {
        id: jobId,
        status: "pending",
        type: input.type,
        createdAt: new Date(),
        metadata: { ...input.metadata, teacherId: input.teacherId, script: input.script.slice(0, 200) },
      };
      videoJobs.set(jobId, job);

      if (!apiKey) {
        // Demo mode — simulate generation
        setTimeout(() => {
          const j = videoJobs.get(jobId);
          if (j) {
            j.status = "completed";
            j.videoUrl = `https://demo.heygen.com/videos/${jobId}.mp4`;
            j.thumbnailUrl = `https://demo.heygen.com/thumbnails/${jobId}.jpg`;
            j.duration = Math.ceil(input.script.length / 15);
            j.completedAt = new Date();
          }
        }, 3000);
        return { jobId, status: "pending", demo: true, estimatedDuration: Math.ceil(input.script.length / 15) };
      }

      // Production: call HeyGen API
      try {
        const result = await createAvatarVideo({
          avatarId,
          voiceId,
          script: input.script,
          title: input.title,
          background: input.background,
          aspectRatio: input.aspectRatio,
        });

        job.heygenVideoId = result.videoId;
        job.status = "processing";

        // Start background polling for completion
        pollJobCompletion(jobId, result.videoId, "video");

        return { jobId, heygenVideoId: result.videoId, status: "processing", demo: false };
      } catch (err: any) {
        job.status = "failed";
        job.error = err.message;
        return { jobId, status: "failed", error: err.message, demo: false };
      }
    }),

  /**
   * Dub/translate a video into another language with lip-sync
   * Used for: Video translation feature, content localization, B2B dubbing
   */
  dubVideo: publicProcedure
    .input(z.object({
      videoUrl: z.string().url(),
      sourceLanguage: z.string().default("en"),
      targetLanguage: z.string(),
      title: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const apiKey = process.env.HEYGEN_API_KEY;
      const jobId = `hg-dub-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

      const job: HeyGenVideoJob = {
        id: jobId,
        status: "pending",
        type: "dubbing",
        createdAt: new Date(),
        metadata: {
          sourceLanguage: input.sourceLanguage,
          targetLanguage: input.targetLanguage,
          videoUrl: input.videoUrl,
        },
      };
      videoJobs.set(jobId, job);

      if (!apiKey) {
        // Demo mode
        setTimeout(() => {
          const j = videoJobs.get(jobId);
          if (j) {
            j.status = "completed";
            j.videoUrl = `https://demo.heygen.com/dubbed/${jobId}.mp4`;
            j.duration = 60;
            j.completedAt = new Date();
          }
        }, 5000);
        return { jobId, status: "pending", demo: true };
      }

      // Production: call HeyGen Video Translate API
      try {
        const targetLang = HEYGEN_LANGUAGE_MAP[input.targetLanguage] || input.targetLanguage;
        const result = await createVideoDubbing({
          videoUrl: input.videoUrl,
          sourceLanguage: input.sourceLanguage,
          targetLanguage: targetLang,
          title: input.title || `Dub to ${targetLang}`,
        });

        job.heygenVideoId = result.videoTranslateId;
        job.status = "processing";

        // Start background polling
        pollJobCompletion(jobId, result.videoTranslateId, "dubbing");

        return { jobId, heygenTranslateId: result.videoTranslateId, status: "processing", demo: false };
      } catch (err: any) {
        job.status = "failed";
        job.error = err.message;
        return { jobId, status: "failed", error: err.message, demo: false };
      }
    }),

  /**
   * Generate a teacher explanation or correction video
   */
  generateTeacherVideo: publicProcedure
    .input(z.object({
      teacherId: z.string(),
      script: z.string().min(1).max(5000),
      type: z.enum(["lesson", "correction", "greeting", "tip"]).default("lesson"),
      aspectRatio: z.enum(["16:9", "9:16", "1:1"]).default("9:16"),
    }))
    .mutation(async ({ input }) => {
      const teacher = TEACHER_HEYGEN_MAP[input.teacherId];
      if (!teacher) {
        return { jobId: null, status: "failed", error: `Unknown teacher: ${input.teacherId}` };
      }

      const apiKey = process.env.HEYGEN_API_KEY;
      const jobId = `hg-teacher-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

      const job: HeyGenVideoJob = {
        id: jobId,
        status: "pending",
        type: "teacher-video",
        createdAt: new Date(),
        metadata: { teacherId: input.teacherId, teacherName: teacher.name, videoType: input.type },
      };
      videoJobs.set(jobId, job);

      if (!apiKey) {
        setTimeout(() => {
          const j = videoJobs.get(jobId);
          if (j) {
            j.status = "completed";
            j.videoUrl = `https://demo.heygen.com/teacher/${input.teacherId}/${jobId}.mp4`;
            j.duration = Math.ceil(input.script.length / 15);
            j.completedAt = new Date();
          }
        }, 3000);
        return { jobId, status: "pending", demo: true, teacher: teacher.name };
      }

      try {
        const result = await createAvatarVideo({
          avatarId: teacher.avatarId,
          voiceId: teacher.voiceId,
          script: input.script,
          title: `${teacher.name} - ${input.type}`,
          aspectRatio: input.aspectRatio,
        });

        job.heygenVideoId = result.videoId;
        job.status = "processing";
        pollJobCompletion(jobId, result.videoId, "video");

        return { jobId, heygenVideoId: result.videoId, status: "processing", demo: false, teacher: teacher.name };
      } catch (err: any) {
        job.status = "failed";
        job.error = err.message;
        return { jobId, status: "failed", error: err.message, demo: false, teacher: teacher.name };
      }
    }),

  /**
   * Check the status of any HeyGen job
   */
  getJobStatus: publicProcedure
    .input(z.object({ jobId: z.string() }))
    .query(({ input }) => {
      const job = videoJobs.get(input.jobId);
      if (!job) return { found: false, status: "unknown" as const };
      return {
        found: true,
        id: job.id,
        status: job.status,
        type: job.type,
        videoUrl: job.videoUrl,
        thumbnailUrl: job.thumbnailUrl,
        duration: job.duration,
        error: job.error,
        createdAt: job.createdAt.toISOString(),
        completedAt: job.completedAt?.toISOString(),
        metadata: job.metadata,
      };
    }),

  /**
   * List recent jobs
   */
  listRecentJobs: publicProcedure
    .input(z.object({
      limit: z.number().min(1).max(50).default(20),
      type: z.enum(["dubbing", "avatar-video", "teacher-video", "tv-episode", "course-preview", "all"]).default("all"),
    }))
    .query(({ input }) => {
      let jobs = Array.from(videoJobs.values());
      if (input.type !== "all") {
        jobs = jobs.filter((j) => j.type === input.type);
      }
      jobs.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      return jobs.slice(0, input.limit).map((j) => ({
        id: j.id,
        status: j.status,
        type: j.type,
        videoUrl: j.videoUrl,
        thumbnailUrl: j.thumbnailUrl,
        duration: j.duration,
        createdAt: j.createdAt.toISOString(),
        metadata: j.metadata,
      }));
    }),

  /**
   * Get supported dubbing languages
   */
  getSupportedLanguages: publicProcedure.query(() => {
    return {
      languages: Object.entries(HEYGEN_LANGUAGE_MAP).map(([code, name]) => ({ code, name })),
      maxDurationSeconds: 600, // 10 minutes max per video
    };
  }),

  /**
   * Get teacher avatar mapping for the frontend
   */
  getTeacherAvatars: publicProcedure.query(() => {
    return Object.entries(TEACHER_HEYGEN_MAP).map(([id, t]) => ({
      id,
      name: t.name,
      language: t.language,
      avatarId: t.avatarId,
    }));
  }),

  /**
   * Create a custom Photo Avatar from an uploaded image
   * Used for: Creating consistent teacher avatars in HeyGen
   */
  createPhotoAvatar: publicProcedure
    .input(z.object({
      teacherId: z.string(),
      imageUrl: z.string().url().describe("URL of the teacher photo to use"),
      name: z.string().describe("Display name for the avatar"),
    }))
    .mutation(async ({ input }) => {
      const apiKey = process.env.HEYGEN_API_KEY;
      if (!apiKey) {
        return { success: false, error: "HEYGEN_API_KEY not configured", demo: true, avatarId: `demo_avatar_${input.teacherId}` };
      }

      try {
        // Step 1: Create photo avatar via HeyGen API
        const response = await fetch(`${HEYGEN_API_BASE}/v2/photo_avatar`, {
          method: "POST",
          headers: {
            "X-Api-Key": apiKey,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            image_url: input.imageUrl,
            name: input.name,
          }),
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          return { success: false, error: errData.message || response.statusText };
        }

        const data = await response.json();
        const avatarId = data.data?.avatar_id || data.data?.id;

        // Step 2: Update the teacher mapping with the new avatar ID
        const teacher = TEACHER_HEYGEN_MAP[input.teacherId];
        if (teacher) {
          teacher.customAvatarId = avatarId;
        }

        return { success: true, avatarId, teacherId: input.teacherId, name: input.name };
      } catch (err: any) {
        return { success: false, error: err.message };
      }
    }),

  /**
   * List jobs (alias for frontend compatibility)
   */
  listJobs: publicProcedure
    .input(z.object({ limit: z.number().default(10) }))
    .query(({ input }) => {
      const jobs = Array.from(videoJobs.values())
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        .slice(0, input.limit)
        .map((j) => ({
          id: j.id,
          status: j.status,
          type: j.type,
          videoUrl: j.videoUrl,
          thumbnailUrl: j.thumbnailUrl,
          duration: j.duration,
          error: j.error,
          createdAt: j.createdAt.toISOString(),
          completedAt: j.completedAt?.toISOString(),
          metadata: j.metadata,
        }));
      return jobs;
    }),
});
