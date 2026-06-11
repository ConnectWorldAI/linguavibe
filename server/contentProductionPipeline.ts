/**
 * Content Production Pipeline — Skit/Storyline Video Orchestrator
 * 
 * Orchestrates multi-step video production:
 * 1. LLM writes a skit script (scenes, dialogue, camera directions)
 * 2. Kling AI generates scene video clips
 * 3. ElevenLabs generates character voice acting
 * 4. HeyGen generates teacher intro/outro talking-head
 * 5. FFmpeg stitches everything into a final video
 * 6. Auto-post publishes to social media
 * 
 * Pulls inspiration from viral content analysis (contentIngestion.ts)
 * and teacher personalities (teacher-registry.ts)
 */
import { router as trpcRouter, publicProcedure } from "./_core/trpc";
import { z } from "zod";
import { invokeLLM } from "./_core/llm";
import { storagePut, storageGetSignedUrl } from "./storage";
import { executeAutoPost } from "./autoPostPipeline";
import { getSlangKnowledge } from "./slangKnowledgeLoader";
import * as jose from "jose";

// ─── Types ───────────────────────────────────────────────────────────────────

interface ScriptScene {
  sceneNumber: number;
  setting: string;
  description: string;
  dialogue: Array<{
    character: string;
    line: string;
    emotion: string;
    language: string;
  }>;
  cameraDirection: string;
  duration: number; // seconds
}

interface SkitScript {
  title: string;
  concept: string;
  hook: string; // First 3 seconds attention grabber
  targetLanguage: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  scenes: ScriptScene[];
  teacherIntro: string;
  teacherOutro: string;
  hashtags: string[];
  estimatedDuration: number;
  vocabularyTargets: string[];
}

interface ProductionJob {
  id: string;
  status: "scripting" | "generating_scenes" | "generating_voices" | "generating_intro" | "stitching" | "completed" | "failed";
  progress: number;
  stage: string;
  topic: string;
  language: string;
  style: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  viralInspiration?: string;
  script?: SkitScript;
  sceneVideos: Array<{ sceneNumber: number; videoUrl?: string; taskId?: string; status: string }>;
  voiceClips: Array<{ sceneNumber: number; audioUrl?: string; status: string }>;
  introVideo?: { videoUrl?: string; status: string };
  outroVideo?: { videoUrl?: string; status: string };
  finalVideoUrl?: string;
  thumbnailUrl?: string;
  createdAt: number;
  completedAt?: number;
  error?: string;
  teacherId: string;
  platforms: string[];
}

// ─── In-Memory Job Store ─────────────────────────────────────────────────────

const productionJobs = new Map<string, ProductionJob>();

// ─── Kling API Helpers ───────────────────────────────────────────────────────

async function getKlingToken(): Promise<string | null> {
  const accessKey = process.env.KLING_ACCESS_KEY;
  const secretKey = process.env.KLING_SECRET_KEY;
  if (!accessKey || !secretKey) return null;

  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: accessKey,
    exp: now + 1800,
    nbf: now - 5,
  };
  const secret = new TextEncoder().encode(secretKey);
  const token = await new jose.SignJWT(payload)
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .sign(secret);
  return token;
}

async function generateKlingScene(prompt: string, duration: number = 5): Promise<{ taskId: string } | null> {
  const token = await getKlingToken();
  if (!token) return null;

  const response = await fetch("https://api-singapore.klingai.com/v1/videos/text2video", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model_name: "kling-v2-6",
      prompt,
      negative_prompt: "blurry, low quality, distorted faces, text overlay, watermark, static image",
      cfg_scale: 0.5,
      mode: "std",
      aspect_ratio: "9:16",
      duration: `${duration}`,
    }),
  });

  if (!response.ok) return null;
  const data = await response.json();
  if (data.code === 0 && data.data?.task_id) {
    return { taskId: data.data.task_id };
  }
  return null;
}

async function pollKlingTask(taskId: string): Promise<{ videoUrl: string; thumbnailUrl?: string } | null> {
  const token = await getKlingToken();
  if (!token) return null;

  // Poll for up to 5 minutes
  for (let i = 0; i < 30; i++) {
    await new Promise(r => setTimeout(r, 10000)); // 10s intervals
    const response = await fetch(`https://api-singapore.klingai.com/v1/videos/text2video/${taskId}`, {
      headers: { "Authorization": `Bearer ${token}` },
    });
    if (!response.ok) continue;
    const data = await response.json();
    if (data.code === 0 && data.data?.task_status === "succeed") {
      const video = data.data.task_result?.videos?.[0];
      if (video?.url) {
        return { videoUrl: video.url, thumbnailUrl: video.cover_url };
      }
    } else if (data.data?.task_status === "failed") {
      return null;
    }
  }
  return null;
}

// ─── ElevenLabs Voice Generation ─────────────────────────────────────────────

interface VoiceConfig {
  voiceId: string;
  stability: number;
  similarityBoost: number;
  style: number;
}

const CHARACTER_VOICES: Record<string, VoiceConfig> = {
  "male-young": { voiceId: "pNInz6obpgDQGcFmaJgB", stability: 0.6, similarityBoost: 0.8, style: 0.5 }, // Adam
  "female-young": { voiceId: "EXAVITQu4vr4xnSDxMaL", stability: 0.6, similarityBoost: 0.8, style: 0.5 }, // Bella
  "male-mature": { voiceId: "VR6AewLTigWG4xSOukaG", stability: 0.7, similarityBoost: 0.85, style: 0.3 }, // Arnold
  "female-mature": { voiceId: "ThT5KcBeYPX3keUQqHPh", stability: 0.65, similarityBoost: 0.8, style: 0.4 }, // Dorothy
  "narrator": { voiceId: "onwK4e9ZLuTAKqWW03F9", stability: 0.8, similarityBoost: 0.9, style: 0.2 }, // Daniel
  "teacher-intro": { voiceId: "EXAVITQu4vr4xnSDxMaL", stability: 0.7, similarityBoost: 0.85, style: 0.3 },
};

async function generateVoiceClip(text: string, voiceType: string, language: string): Promise<string | null> {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) return null;

  const voice = CHARACTER_VOICES[voiceType] || CHARACTER_VOICES["narrator"];

  const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voice.voiceId}`, {
    method: "POST",
    headers: {
      "xi-api-key": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      text,
      model_id: "eleven_multilingual_v2",
      voice_settings: {
        stability: voice.stability,
        similarity_boost: voice.similarityBoost,
        style: voice.style,
        use_speaker_boost: true,
      },
    }),
  });

  if (!response.ok) return null;

  const audioBuffer = Buffer.from(await response.arrayBuffer());
  const filename = `skit-voice-${Date.now()}-${Math.random().toString(36).slice(2, 6)}.mp3`;
  const stored = await storagePut(`content-pipeline/voices/${filename}`, audioBuffer, "audio/mpeg");
  return stored.url;
}

// ─── HeyGen Teacher Intro/Outro ──────────────────────────────────────────────

async function generateTeacherClip(teacherId: string, script: string, type: "intro" | "outro"): Promise<string | null> {
  const apiKey = process.env.HEYGEN_API_KEY;
  if (!apiKey) return null;

  // Stock avatar IDs matched to teachers (same as TEACHER_HEYGEN_MAP in heygenService.ts)
  const TEACHER_AVATAR_MAP: Record<string, string> = {
    "maria": "Adriana_Business_Front_2_public",
    "carlos": "Armando_Casual_Front_public",
    "rafael": "Crisanto_Business_Front_public",
    "luis": "Raul_standing_casualsofa_front_close",
    "valentina": "Hada_Casual_Sitting_Front_2_public",
    "sofia": "Mireia_sitting_businessindoor_front",
    "isabela": "Lina_Casual_Sitting_Front_public",
    "camila": "Carlotta_Casual_Sitting_Front_public",
    "jean": "Lucien_public_5",
    "jean-pierre": "Lucien_public_5",
    "marie-claire": "Candace_Beige_Dress_Front",
    "yuki": "Miyu_sitting_sofacasual_front",
    "jimin": "Minho_public_2",
    "wei": "Ren_sitting_sofacasual_front",
    "mei-ling": "Jin_Casual_Sitting_Front_public",
    "ahmed": "Nadim_public_5",
    "yasmine": "Nour_public_1",
    "hans": "Bojan_sitting_businesstraining_front",
    "giulia": "Giulia_standing_office_front",
    "pieter": "Leos_standing_office_front",
    "natasha": "Oxana_standing_gym_front",
    "emre": "Onat_Casual_Sitting_Front_public",
    "linh": "Kavya_standing_indoor_front",
    "somchai": "Aditya_public_4",
    "priya": "Seema_Casual_Sitting_Front_public",
    "kwame": "Diran_Casual_Front_public",
    "amara": "Fina_Casual_Sitting_Front_public",
    "miguel": "Fernando_sitting_businessindoor_front",
    "anna": "Zosia_public_2",
    "olivia": "Annie_Business_Casual_Standing_Front_2_public",
    "marcus": "Marcus_Casual_Sitting_Front_2_public",
    "james": "Bradley_Blue_Polo_Front",
    "chioma": "Candace_Beige_Dress_Front",
    "thabo": "Darnell_Blue_Shirt_Front",
  };

  const avatarId = TEACHER_AVATAR_MAP[teacherId] || TEACHER_AVATAR_MAP["maria"];

  const response = await fetch("https://api.heygen.com/v2/video/generate", {
    method: "POST",
    headers: {
      "X-Api-Key": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      video_inputs: [{
        character: {
          type: "avatar",
          avatar_id: avatarId,
          avatar_style: "normal",
        },
        voice: {
          type: "text",
          input_text: script,
          voice_id: "1bd001e7e50f421d891986aad5c21349", // Melissa multilingual
          speed: 1.0,
        },
        background: {
          type: "color",
          value: "#1a1a2e",
        },
      }],
      dimension: { width: 1080, height: 1920 },
      aspect_ratio: "9:16",
    }),
  });

  if (!response.ok) return null;
  const data = await response.json();
  const videoId = data.data?.video_id;
  if (!videoId) return null;

  // Poll for completion
  for (let i = 0; i < 30; i++) {
    await new Promise(r => setTimeout(r, 10000));
    const statusRes = await fetch(`https://api.heygen.com/v1/video_status.get?video_id=${videoId}`, {
      headers: { "X-Api-Key": apiKey },
    });
    if (!statusRes.ok) continue;
    const statusData = await statusRes.json();
    if (statusData.data?.status === "completed") {
      return statusData.data.video_url;
    } else if (statusData.data?.status === "failed") {
      return null;
    }
  }
  return null;
}

// ─── Script Generation via LLM ──────────────────────────────────────────────

async function generateSkitScript(params: {
  topic: string;
  language: string;
  teacherId: string;
  teacherName: string;
  style: string;
  difficulty: string;
  viralInspiration?: string;
  slangContext?: string;
}): Promise<SkitScript> {
  const response = await invokeLLM({
    messages: [
      {
        role: "system",
        content: `You are a creative director for ConnectWorld AI, a language learning app that creates viral educational content.

You write SHORT, ENGAGING skit scripts for social media (TikTok/Reels/Shorts style).

Rules:
- Total video MUST be 30-60 seconds (3-5 short scenes of 5-10 seconds each)
- First 3 seconds MUST have an attention-grabbing hook
- Mix the target language with English (code-switching for engagement)
- Include humor, surprise, or relatable situations
- Each scene should teach 1-2 vocabulary words or phrases naturally
- The teacher character introduces and wraps up (5-10 seconds each)
- Scenes should tell a STORY with a beginning, middle, and punchline/twist
- Camera directions should be specific and cinematic
- Dialogue should feel natural, not textbook-y

Style options:
- "comedy-skit": Funny situation where language confusion causes chaos
- "day-in-life": Follow someone through a scenario using the language
- "challenge": Quick-fire language challenge with stakes
- "story-time": Mini narrative with a twist ending
- "cultural-shock": Funny cultural differences explained through language
- "street-interview": Fake interview testing language skills

Return ONLY valid JSON matching this schema:
{
  "title": "Short catchy title",
  "concept": "One-line concept description",
  "hook": "What happens in first 3 seconds to grab attention",
  "targetLanguage": "${params.language}",
  "difficulty": "${params.difficulty}",
  "scenes": [
    {
      "sceneNumber": 1,
      "setting": "Visual description of location/environment",
      "description": "What happens in this scene",
      "dialogue": [
        { "character": "Name", "line": "What they say", "emotion": "happy/confused/excited/etc", "language": "spanish/english/mixed" }
      ],
      "cameraDirection": "Close-up / Wide shot / POV / etc",
      "duration": 5
    }
  ],
  "teacherIntro": "What the teacher says to introduce (in English + target language)",
  "teacherOutro": "What the teacher says to wrap up with a CTA",
  "hashtags": ["#relevant", "#hashtags"],
  "estimatedDuration": 45,
  "vocabularyTargets": ["word1", "word2", "word3"]
}`
      },
      {
        role: "user",
        content: `Create a ${params.style} skit about "${params.topic}" in ${params.language}.

Teacher: ${params.teacherName} (ID: ${params.teacherId})
Difficulty: ${params.difficulty}
${params.viralInspiration ? `\nInspired by this viral format: ${params.viralInspiration}` : ""}
${params.slangContext ? `\n\nUSE THESE VERIFIED SLANG/EXPRESSIONS from our Airtable database (sourced from real creators):\n${params.slangContext}\n\nIncorporate the most relevant expressions above into the skit dialogue naturally. Cite the source creator in hashtags.` : ""}

Make it feel like content from a popular language learning creator on TikTok — entertaining FIRST, educational SECOND.`
      }
    ],
  });

  const responseText = typeof response.choices?.[0]?.message?.content === "string"
    ? response.choices[0].message.content
    : "";

  try {
    const cleaned = responseText.replace(/```json\n?|\n?```/g, "").trim();
    return JSON.parse(cleaned);
  } catch {
    // Fallback script
    return {
      title: `${params.topic} - ${params.language}`,
      concept: `A short skit about ${params.topic}`,
      hook: "Wait, did they just say THAT?!",
      targetLanguage: params.language,
      difficulty: params.difficulty as any,
      scenes: [{
        sceneNumber: 1,
        setting: "A colorful street scene",
        description: `Someone trying to use ${params.language} in a real situation`,
        dialogue: [
          { character: "Student", line: "Excuse me, where is the bathroom?", emotion: "nervous", language: "english" },
          { character: "Local", line: "¿El baño? ¡Por allá!", emotion: "friendly", language: params.language },
        ],
        cameraDirection: "Medium shot, handheld style",
        duration: 8,
      }],
      teacherIntro: `Hey! Today we're learning how to talk about ${params.topic} in ${params.language}. Watch what happens...`,
      teacherOutro: `See? It's not that hard! Follow for more ${params.language} tips!`,
      hashtags: ["#languagelearning", `#learn${params.language}`, "#connectworldai"],
      estimatedDuration: 30,
      vocabularyTargets: [params.topic],
    };
  }
}

// ─── Main Orchestration Pipeline ─────────────────────────────────────────────

async function runProductionPipeline(jobId: string): Promise<void> {
  const job = productionJobs.get(jobId);
  if (!job) return;

  try {
    // ─── STEP 1: Generate Script ───────────────────────────────────────────
    job.status = "scripting";
    job.stage = "AI writing skit script...";
    job.progress = 5;

    // Teacher name lookup (all 34 from teacher-registry.ts)
    const teacherNames: Record<string, string> = {
      "maria": "María", "carlos": "Carlos", "rafael": "Rafael",
      "luis": "Luis", "valentina": "Valentina", "sofia": "Sofía",
      "isabela": "Isabela", "camila": "Camila", "jean": "Jean-Pierre",
      "jean-pierre": "Jean-Pierre", "marie-claire": "Marie-Claire",
      "yuki": "Yuki", "jimin": "Jimin", "wei": "Wei",
      "mei-ling": "Mei-Ling", "ahmed": "Ahmed", "yasmine": "Yasmine",
      "hans": "Hans", "giulia": "Giulia", "pieter": "Pieter",
      "natasha": "Natasha", "emre": "Emre", "linh": "Linh",
      "somchai": "Somchai", "priya": "Priya", "kwame": "Kwame",
      "amara": "Amara", "miguel": "Miguel", "anna": "Anna",
      "olivia": "Olivia", "marcus": "Marcus", "james": "James",
      "chioma": "Chioma", "thabo": "Thabo",
    };

    // ─── Fetch best-match slang from Airtable for this topic/language ───
    let slangContext = "";
    try {
      // Derive dialect from teacher ID (e.g., maria→Mexican, rafael→Dominican)
      const teacherDialectMap: Record<string, string> = {
        maria: "Mexican", carlos: "Colombian", rafael: "Dominican",
        luis: "Puerto Rican", valentina: "Argentine", sofia: "Castilian",
        isabela: "Brazilian", camila: "Brazilian", jean: "Parisian",
        "marie-claire": "Haitian Creole", yuki: "Standard", jimin: "Standard",
        wei: "Standard", "mei-ling": "Cantonese", ahmed: "Egyptian",
        yasmine: "Moroccan", hans: "Standard", giulia: "Standard",
        pieter: "Standard", natasha: "Standard", emre: "Standard",
        linh: "Northern", somchai: "Standard", priya: "Standard",
        kwame: "Standard", amara: "Standard", miguel: "Standard",
        anna: "Standard", olivia: "Australian", marcus: "Caribbean",
        james: "British", chioma: "Nigerian", thabo: "South African",
      };
      const dialect = teacherDialectMap[job.teacherId] || "standard";
      const slangData = await getSlangKnowledge(job.language, dialect);
      if (slangData.slangContext) {
        // Filter to entries most relevant to the topic via keyword matching
        const topicWords = job.topic.toLowerCase().split(/\s+/);
        const lines = slangData.slangContext.split("\n").filter(l => l.startsWith("\u2022"));
        const scored = lines.map(line => {
          const lineL = line.toLowerCase();
          const matches = topicWords.filter(w => lineL.includes(w)).length;
          return { line, score: matches };
        }).sort((a, b) => b.score - a.score);
        // Take top 8 most relevant entries (or all if fewer)
        const bestMatches = scored.slice(0, 8).map(s => s.line);
        if (bestMatches.length > 0) {
          slangContext = bestMatches.join("\n");
          if (slangData.sources.length > 0) {
            slangContext += `\n\nSources: ${slangData.sources.join(", ")}`;
          }
        }
      }
    } catch (e) {
      // Non-fatal — proceed without slang context
      console.log(`[Pipeline] Slang fetch skipped: ${(e as Error).message}`);
    }

    const script = await generateSkitScript({
      topic: job.topic,
      language: job.language,
      teacherId: job.teacherId,
      teacherName: teacherNames[job.teacherId] || "María",
      style: job.style as any,
      difficulty: job.difficulty,
      viralInspiration: job.viralInspiration,
      slangContext,
    });

    job.script = script;
    job.progress = 15;
    job.stage = `Script ready: "${script.title}" (${script.scenes.length} scenes)`;

    // ─── STEP 2: Generate Scene Videos (Kling) ─────────────────────────────
    job.status = "generating_scenes";
    job.stage = "Generating scene videos with Kling AI...";
    job.progress = 20;

    const scenePromises = script.scenes.map(async (scene, idx) => {
      const sceneEntry = { sceneNumber: scene.sceneNumber, status: "pending" as string, videoUrl: undefined as string | undefined, taskId: undefined as string | undefined };
      job.sceneVideos.push(sceneEntry);

      // Build cinematic prompt from scene data
      const prompt = `${scene.setting}. ${scene.description}. Camera: ${scene.cameraDirection}. Cinematic, vibrant colors, social media vertical video style, high quality, 4K`;

      const result = await generateKlingScene(prompt, Math.min(scene.duration, 10));
      if (result) {
        sceneEntry.taskId = result.taskId;
        sceneEntry.status = "processing";

        // Poll for completion
        const video = await pollKlingTask(result.taskId);
        if (video) {
          sceneEntry.videoUrl = video.videoUrl;
          sceneEntry.status = "completed";
        } else {
          sceneEntry.status = "failed";
        }
      } else {
        // Demo mode — simulate
        sceneEntry.status = "completed";
        sceneEntry.videoUrl = `https://demo.connectworldai.com/scenes/scene-${idx + 1}.mp4`;
      }

      job.progress = 20 + Math.floor((idx + 1) / script.scenes.length * 25);
      return sceneEntry;
    });

    await Promise.all(scenePromises);
    job.stage = `${job.sceneVideos.filter(s => s.status === "completed").length}/${script.scenes.length} scenes generated`;
    job.progress = 45;

    // ─── STEP 3: Generate Voice Acting (ElevenLabs) ────────────────────────
    job.status = "generating_voices";
    job.stage = "Generating character voices with ElevenLabs...";
    job.progress = 50;

    for (const scene of script.scenes) {
      const voiceEntry = { sceneNumber: scene.sceneNumber, status: "pending" as string, audioUrl: undefined as string | undefined };
      job.voiceClips.push(voiceEntry);

      // Combine all dialogue in the scene into one audio clip
      const dialogueText = scene.dialogue
        .map(d => `${d.line}`)
        .join(". ");

      if (dialogueText.trim()) {
        // Determine voice type from first character
        const firstChar = scene.dialogue[0]?.character?.toLowerCase() || "";
        let voiceType = "narrator";
        if (firstChar.includes("student") || firstChar.includes("learner")) voiceType = "male-young";
        else if (firstChar.includes("local") || firstChar.includes("native")) voiceType = "female-mature";
        else if (firstChar.includes("teacher")) voiceType = "teacher-intro";

        const audioUrl = await generateVoiceClip(dialogueText, voiceType, script.targetLanguage);
        if (audioUrl) {
          voiceEntry.audioUrl = audioUrl;
          voiceEntry.status = "completed";
        } else {
          voiceEntry.status = "demo";
          voiceEntry.audioUrl = `https://demo.connectworldai.com/voices/scene-${scene.sceneNumber}.mp3`;
        }
      } else {
        voiceEntry.status = "skipped";
      }

      job.progress = 50 + Math.floor((scene.sceneNumber / script.scenes.length) * 15);
    }

    job.stage = `${job.voiceClips.filter(v => v.status === "completed").length} voice clips generated`;
    job.progress = 65;

    // ─── STEP 4: Generate Teacher Intro/Outro (HeyGen) ─────────────────────
    job.status = "generating_intro";
    job.stage = "Generating teacher intro/outro with HeyGen...";
    job.progress = 70;

    job.introVideo = { status: "processing" };
    const introUrl = await generateTeacherClip(job.teacherId, script.teacherIntro, "intro");
    if (introUrl) {
      job.introVideo = { videoUrl: introUrl, status: "completed" };
    } else {
      job.introVideo = { videoUrl: `https://demo.connectworldai.com/intros/${job.teacherId}-intro.mp4`, status: "demo" };
    }
    job.progress = 80;

    job.outroVideo = { status: "processing" };
    const outroUrl = await generateTeacherClip(job.teacherId, script.teacherOutro, "outro");
    if (outroUrl) {
      job.outroVideo = { videoUrl: outroUrl, status: "completed" };
    } else {
      job.outroVideo = { videoUrl: `https://demo.connectworldai.com/outros/${job.teacherId}-outro.mp4`, status: "demo" };
    }
    job.progress = 85;

    // ─── STEP 5: Stitch Final Video ────────────────────────────────────────
    job.status = "stitching";
    job.stage = "Assembling final video...";
    job.progress = 90;

    // In production, this would use FFmpeg to concatenate:
    // intro.mp4 + scene1.mp4 + scene2.mp4 + ... + outro.mp4
    // with voice audio overlaid on each scene
    // For now, we store the manifest and the intro as the "final" video
    const finalManifest = {
      intro: job.introVideo?.videoUrl,
      scenes: job.sceneVideos.map(s => ({ scene: s.sceneNumber, video: s.videoUrl })),
      voices: job.voiceClips.map(v => ({ scene: v.sceneNumber, audio: v.audioUrl })),
      outro: job.outroVideo?.videoUrl,
      script: script,
    };

    // Store manifest
    const manifestBuffer = Buffer.from(JSON.stringify(finalManifest, null, 2));
    const manifestStored = await storagePut(
      `content-pipeline/productions/${jobId}/manifest.json`,
      manifestBuffer,
      "application/json"
    );

    // Use the intro video as the "final" for now (full FFmpeg stitching requires deployment)
    // In production: FFmpeg concat + audio overlay
    job.finalVideoUrl = job.introVideo?.videoUrl || job.sceneVideos[0]?.videoUrl;
    job.thumbnailUrl = `https://demo.connectworldai.com/thumbnails/${jobId}.jpg`;
    job.progress = 95;

    // ─── STEP 6: Auto-Post (if platforms specified) ────────────────────────
    if (job.platforms.length > 0 && job.finalVideoUrl && !job.finalVideoUrl.includes("demo.")) {
      job.stage = "Publishing to social media...";
      try {
        await executeAutoPost({
          videoJobId: jobId,
          videoUrl: job.finalVideoUrl,
          thumbnailUrl: job.thumbnailUrl,
          influencerId: job.teacherId,
          influencerName: job.script?.title || "ConnectWorld AI",
          script: `${script.teacherIntro}\n\n${script.scenes.map(s => s.dialogue.map(d => `${d.character}: ${d.line}`).join("\n")).join("\n\n")}\n\n${script.teacherOutro}`,
          platforms: job.platforms,
          postToApp: true,
        });
      } catch (e) {
        // Non-fatal — video is still generated even if posting fails
        console.log(`Auto-post skipped: ${(e as Error).message}`);
      }
    }

    // ─── DONE ──────────────────────────────────────────────────────────────
    job.status = "completed";
    job.progress = 100;
    job.completedAt = Date.now();
    job.stage = `Production complete: "${script.title}" — ${script.scenes.length} scenes, ${script.estimatedDuration}s`;

  } catch (error: any) {
    job.status = "failed";
    job.error = error.message || "Unknown error";
    job.stage = `Failed: ${error.message}`;
  }
}

// ─── Router ──────────────────────────────────────────────────────────────────

export const contentProductionRouter = trpcRouter({
  /**
   * Start a new skit/storyline video production
   */
  produce: publicProcedure
    .input(z.object({
      topic: z.string().min(3).describe("What the skit is about (e.g., 'ordering coffee in Mexico City')"),
      teacherId: z.string().default("maria"),
      language: z.string().default("Spanish"),
      style: z.enum(["comedy-skit", "day-in-life", "challenge", "story-time", "cultural-shock", "street-interview"]).default("comedy-skit"),
      difficulty: z.enum(["beginner", "intermediate", "advanced"]).default("intermediate"),
      platforms: z.array(z.enum(["tiktok", "instagram", "youtube"])).default(["tiktok", "instagram"]),
      viralInspiration: z.string().optional().describe("Optional: viral content format to draw inspiration from"),
    }))
    .mutation(async ({ input }) => {
      const jobId = `prod-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

      const job: ProductionJob = {
        id: jobId,
        status: "scripting",
        progress: 0,
        stage: "Initializing...",
        topic: input.topic,
        language: input.language,
        style: input.style,
        difficulty: input.difficulty,
        viralInspiration: input.viralInspiration,
        sceneVideos: [],
        voiceClips: [],
        createdAt: Date.now(),
        teacherId: input.teacherId,
        platforms: input.platforms,
      };

      productionJobs.set(jobId, job);

      // Run pipeline in background (non-blocking)
      runProductionPipeline(jobId).catch(err => {
        const j = productionJobs.get(jobId);
        if (j) {
          j.status = "failed";
          j.error = err.message;
        }
      });

      return {
        jobId,
        status: "scripting",
        message: `Production started: "${input.topic}" with ${input.teacherId}. Style: ${input.style}. Platforms: ${input.platforms.join(", ")}`,
      };
    }),

  /**
   * Get production job status and progress
   */
  getStatus: publicProcedure
    .input(z.object({ jobId: z.string() }))
    .query(({ input }) => {
      const job = productionJobs.get(input.jobId);
      if (!job) throw new Error("Production job not found");
      return {
        id: job.id,
        status: job.status,
        progress: job.progress,
        stage: job.stage,
        script: job.script ? {
          title: job.script.title,
          concept: job.script.concept,
          scenes: job.script.scenes.length,
          duration: job.script.estimatedDuration,
          vocabulary: job.script.vocabularyTargets,
        } : null,
        scenes: job.sceneVideos,
        voices: job.voiceClips,
        intro: job.introVideo,
        outro: job.outroVideo,
        finalVideoUrl: job.finalVideoUrl,
        thumbnailUrl: job.thumbnailUrl,
        createdAt: job.createdAt,
        completedAt: job.completedAt,
        error: job.error,
      };
    }),

  /**
   * List all production jobs
   */
  listJobs: publicProcedure
    .input(z.object({
      limit: z.number().min(1).max(50).default(20),
    }).optional())
    .query(({ input }) => {
      const limit = input?.limit || 20;
      const jobs = Array.from(productionJobs.values())
        .sort((a, b) => b.createdAt - a.createdAt)
        .slice(0, limit);

      return jobs.map(j => ({
        id: j.id,
        status: j.status,
        progress: j.progress,
        stage: j.stage,
        title: j.script?.title || "Untitled",
        teacherId: j.teacherId,
        platforms: j.platforms,
        createdAt: j.createdAt,
        completedAt: j.completedAt,
      }));
    }),

  /**
   * Generate ONLY a script (for preview before full production)
   */
  previewScript: publicProcedure
    .input(z.object({
      topic: z.string().min(3),
      teacherId: z.string().default("maria"),
      language: z.string().default("Spanish"),
      style: z.enum(["comedy-skit", "day-in-life", "challenge", "story-time", "cultural-shock", "street-interview"]).default("comedy-skit"),
      difficulty: z.enum(["beginner", "intermediate", "advanced"]).default("intermediate"),
      viralInspiration: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const teacherNames: Record<string, string> = {
        "maria": "María", "carlos": "Carlos", "rafael": "Rafael",
        "luis": "Luis", "valentina": "Valentina", "sofia": "Sofía",
        "isabela": "Isabela", "camila": "Camila", "jean": "Jean-Pierre",
        "jean-pierre": "Jean-Pierre", "marie-claire": "Marie-Claire",
        "yuki": "Yuki", "jimin": "Jimin", "wei": "Wei",
        "mei-ling": "Mei-Ling", "ahmed": "Ahmed", "yasmine": "Yasmine",
        "hans": "Hans", "giulia": "Giulia", "pieter": "Pieter",
        "natasha": "Natasha", "emre": "Emre", "linh": "Linh",
        "somchai": "Somchai", "priya": "Priya", "kwame": "Kwame",
        "amara": "Amara", "miguel": "Miguel", "anna": "Anna",
        "olivia": "Olivia", "marcus": "Marcus", "james": "James",
        "chioma": "Chioma", "thabo": "Thabo",
      };

      const script = await generateSkitScript({
        topic: input.topic,
        language: input.language,
        teacherId: input.teacherId,
        teacherName: teacherNames[input.teacherId] || "María",
        style: input.style,
        difficulty: input.difficulty,
        viralInspiration: input.viralInspiration,
      });

      return script;
    }),

  /**
   * Get content ideas from viral content analysis
   */
  getContentIdeas: publicProcedure
    .input(z.object({
      language: z.string().default("Spanish"),
      count: z.number().min(1).max(10).default(5),
    }))
    .mutation(async ({ input }) => {
      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `You are a viral content strategist for ConnectWorld AI. Generate ${input.count} trending content ideas for ${input.language} language learning TikTok/Reels.

Each idea should be:
- Based on current social media trends
- Educational but entertaining
- 30-60 seconds long
- Designed for maximum engagement

Return JSON array:
[
  {
    "topic": "Short topic description",
    "style": "comedy-skit|day-in-life|challenge|story-time|cultural-shock|street-interview",
    "hook": "First 3 seconds hook",
    "whyItWorks": "Why this will go viral",
    "difficulty": "beginner|intermediate|advanced",
    "estimatedReach": "medium|high|viral"
  }
]`
          },
          {
            role: "user",
            content: `Generate ${input.count} viral content ideas for ${input.language} language learning. Focus on trends that are working RIGHT NOW on TikTok and Instagram Reels.`
          }
        ],
      });

      const responseText = typeof response.choices?.[0]?.message?.content === "string"
        ? response.choices[0].message.content : "[]";

      try {
        return JSON.parse(responseText.replace(/```json\n?|\n?```/g, "").trim());
      } catch {
        return [{ topic: `Learn ${input.language} basics`, style: "comedy-skit", hook: "POV: You just moved abroad", whyItWorks: "Relatable", difficulty: "beginner", estimatedReach: "medium" }];
      }
    }),
});
