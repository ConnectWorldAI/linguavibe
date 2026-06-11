/**
 * Synthesia AI Avatar Integration Service
 * 
 * Generates polished, marketing-quality video content for:
 * - Course Previews: Marketing/story-style preview videos for each course/language
 * - ConnectWorld AI TV: Pre-recorded video lessons/episodes with avatar presenting
 * 
 * Note: Live calls use Hume (audio) + teacher photos. Error corrections & onboarding use Kling.
 * Synthesia is reserved for high-polish, pre-rendered marketing and educational content.
 * 
 * API: https://api.synthesia.io/v2
 * Requires: SYNTHESIA_API_KEY environment variable
 */

import { router as trpcRouter, publicProcedure } from "./_core/trpc";
import { z } from "zod";

// Teacher avatar definitions - each teacher has a consistent Synthesia avatar
const TEACHER_AVATARS: Record<string, {
  id: string;
  name: string;
  synthesiaAvatarId: string;
  language: string;
  dialect: string;
  voiceId: string;
  nationality: string;
  photoUrl: string;
  description: string;
}> = {
  "maria": {
    id: "maria",
    name: "Profesora María García",
    synthesiaAvatarId: "anna_costume1_cameraA",
    language: "Spanish",
    dialect: "Mexican",
    voiceId: "es-MX-DaliaNeural",
    nationality: "Mexican",
    photoUrl: "",
    description: "Warm, patient teacher from Mexico City. Specializes in conversational Spanish and cultural immersion.",
  },
  "carlos": {
    id: "carlos",
    name: "Profesor Carlos Rodríguez",
    synthesiaAvatarId: "james_costume1_cameraA",
    language: "Spanish",
    dialect: "Dominican",
    voiceId: "es-DO-EmilioNeural",
    nationality: "Dominican",
    photoUrl: "",
    description: "Energetic teacher from Santo Domingo. Expert in Caribbean Spanish slang and street language.",
  },
  "isabela": {
    id: "isabela",
    name: "Profesora Isabela Santos",
    synthesiaAvatarId: "bridget_costume1_cameraA",
    language: "Portuguese",
    dialect: "Brazilian",
    voiceId: "pt-BR-FranciscaNeural",
    nationality: "Brazilian",
    photoUrl: "",
    description: "Fun, upbeat teacher from São Paulo. Focuses on Brazilian Portuguese with music and pop culture.",
  },
  "jean": {
    id: "jean",
    name: "Professeur Jean-Pierre Dubois",
    synthesiaAvatarId: "jack_costume1_cameraA",
    language: "French",
    dialect: "Parisian",
    voiceId: "fr-FR-HenriNeural",
    nationality: "French",
    photoUrl: "",
    description: "Sophisticated teacher from Paris. Specializes in formal French and business communication.",
  },
  "yuki": {
    id: "yuki",
    name: "先生 Yuki Tanaka",
    synthesiaAvatarId: "lily_costume1_cameraA",
    language: "Japanese",
    dialect: "Standard",
    voiceId: "ja-JP-NanamiNeural",
    nationality: "Japanese",
    photoUrl: "",
    description: "Gentle, methodical teacher from Tokyo. Expert in keigo (polite forms) and anime/manga Japanese.",
  },
  "ahmed": {
    id: "ahmed",
    name: "أستاذ Ahmed Hassan",
    synthesiaAvatarId: "max_costume1_cameraA",
    language: "Arabic",
    dialect: "Egyptian",
    voiceId: "ar-EG-ShakirNeural",
    nationality: "Egyptian",
    photoUrl: "",
    description: "Charismatic teacher from Cairo. Specializes in Egyptian Arabic dialect and MSA.",
  },
  "sofia": {
    id: "sofia",
    name: "Profesora Sofía Herrera",
    synthesiaAvatarId: "mia_costume1_cameraA",
    language: "Spanish",
    dialect: "Colombian",
    voiceId: "es-CO-SalomeNeural",
    nationality: "Colombian",
    photoUrl: "",
    description: "Clear, neutral accent from Bogotá. Great for beginners who want clean pronunciation.",
  },
  "wei": {
    id: "wei",
    name: "老师 Wei Chen",
    synthesiaAvatarId: "noah_costume1_cameraA",
    language: "Chinese",
    dialect: "Mandarin",
    voiceId: "zh-CN-YunxiNeural",
    nationality: "Chinese",
    photoUrl: "",
    description: "Patient teacher from Beijing. Specializes in tones, characters, and business Chinese.",
  },
  "kwame": {
    id: "kwame",
    name: "Teacher Kwame Asante",
    synthesiaAvatarId: "marcus_costume1_cameraA",
    language: "English",
    dialect: "West African",
    voiceId: "en-NG-AbeoNeural",
    nationality: "Ghanaian",
    photoUrl: "",
    description: "Engaging teacher from Accra. Teaches English with West African cultural context.",
  },
  "priya": {
    id: "priya",
    name: "Teacher Priya Sharma",
    synthesiaAvatarId: "mia_costume1_cameraA",
    language: "Hindi",
    dialect: "Standard",
    voiceId: "hi-IN-SwaraNeural",
    nationality: "Indian",
    photoUrl: "",
    description: "Warm teacher from Mumbai. Specializes in Hindi and Hinglish for everyday conversation.",
  },
};

// Video generation status tracking
interface VideoJob {
  id: string;
  status: "pending" | "processing" | "completed" | "failed";
  teacherId: string;
  type: "course-preview" | "tv-episode" | "tv-series-intro" | "lesson" | "correction" | "greeting" | "classroom-intro";
  scriptText: string;
  videoUrl?: string;
  thumbnailUrl?: string;
  duration?: number;
  createdAt: Date;
  metadata?: {
    courseName?: string;
    episodeNumber?: number;
    seriesName?: string;
    language?: string;
    level?: string;
  };
}

const videoJobs = new Map<string, VideoJob>();

export const synthesiaRouter = trpcRouter({
  // List all available teacher avatars
  listTeachers: publicProcedure.query(() => {
    return Object.values(TEACHER_AVATARS).map((t) => ({
      id: t.id,
      name: t.name,
      language: t.language,
      dialect: t.dialect,
      nationality: t.nationality,
      photoUrl: t.photoUrl,
      description: t.description,
    }));
  }),

  // Get a specific teacher's full profile
  getTeacher: publicProcedure
    .input(z.object({ teacherId: z.string() }))
    .query(({ input }) => {
      const teacher = TEACHER_AVATARS[input.teacherId];
      if (!teacher) throw new Error("Teacher not found");
      return teacher;
    }),

  // Generate a video with a teacher avatar speaking a script
  generateVideo: publicProcedure
    .input(z.object({
      teacherId: z.string(),
      script: z.string().min(1).max(5000),
      type: z.enum(["lesson", "correction", "greeting", "classroom-intro"]),
      background: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const teacher = TEACHER_AVATARS[input.teacherId];
      if (!teacher) throw new Error("Teacher not found");

      const apiKey = process.env.SYNTHESIA_API_KEY;
      const jobId = `synth-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

      const job: VideoJob = {
        id: jobId,
        status: "pending",
        teacherId: input.teacherId,
        type: input.type,
        scriptText: input.script,
        createdAt: new Date(),
      };
      videoJobs.set(jobId, job);

      if (!apiKey) {
        // Demo mode: simulate video generation
        setTimeout(() => {
          const j = videoJobs.get(jobId);
          if (j) {
            j.status = "completed";
            j.videoUrl = `https://demo.synthesia.io/videos/${jobId}.mp4`;
            j.thumbnailUrl = `https://demo.synthesia.io/thumbnails/${jobId}.jpg`;
            j.duration = Math.ceil(input.script.length / 15); // ~15 chars per second
          }
        }, 3000);

        return { jobId, status: "pending", estimatedDuration: Math.ceil(input.script.length / 15) };
      }

      // Production: call Synthesia API
      try {
        const response = await fetch("https://api.synthesia.io/v2/videos", {
          method: "POST",
          headers: {
            "Authorization": apiKey,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title: `${teacher.name} - ${input.type}`,
            description: `Auto-generated ${input.type} video for LinguaVibe`,
            visibility: "private",
            input: [{
              avatarSettings: {
                horizontalAlign: "center",
                scale: 1,
                style: "rectangular",
                seamless: false,
              },
              avatar: teacher.synthesiaAvatarId,
              scriptText: input.script,
              voiceId: teacher.voiceId,
              background: input.background || "off_white",
            }],
          }),
        });

        if (!response.ok) {
          job.status = "failed";
          throw new Error(`Synthesia API error: ${response.status}`);
        }

        const data = await response.json();
        job.status = "processing";

        // Poll for completion in background
        pollVideoStatus(jobId, data.id, apiKey);

        return { jobId, synthesiaId: data.id, status: "processing" };
      } catch (error: any) {
        job.status = "failed";
        throw new Error(`Video generation failed: ${error.message}`);
      }
    }),

  // Check video generation status
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
        duration: job.duration,
        teacherId: job.teacherId,
        type: job.type,
      };
    }),

  // Generate a classroom intro video for a specific topic
  generateClassroomIntro: publicProcedure
    .input(z.object({
      teacherId: z.string(),
      topic: z.string(),
      language: z.string(),
      classSize: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      const teacher = TEACHER_AVATARS[input.teacherId];
      if (!teacher) throw new Error("Teacher not found");

      const script = generateIntroScript(teacher, input.topic, input.language, input.classSize || 6);
      const jobId = `intro-${Date.now()}`;

      const job: VideoJob = {
        id: jobId,
        status: "completed",
        teacherId: input.teacherId,
        type: "classroom-intro",
        scriptText: script,
        videoUrl: `https://demo.synthesia.io/intros/${jobId}.mp4`,
        thumbnailUrl: teacher.photoUrl || undefined,
        duration: Math.ceil(script.length / 15),
        createdAt: new Date(),
      };
      videoJobs.set(jobId, job);

      return { jobId, script, status: "completed" };
    }),

  // === COURSE PREVIEWS (Marketing/Story-Style) ===
  generateCoursePreview: publicProcedure
    .input(z.object({
      teacherId: z.string(),
      courseName: z.string(),
      language: z.string(),
      level: z.enum(["beginner", "intermediate", "advanced"]),
      highlights: z.array(z.string()).max(5), // Key selling points
      tone: z.enum(["professional", "casual", "exciting", "warm"]).default("exciting"),
    }))
    .mutation(async ({ input }) => {
      const teacher = TEACHER_AVATARS[input.teacherId];
      if (!teacher) throw new Error("Teacher not found");

      const script = buildCoursePreviewScript(teacher, input);
      const jobId = `preview-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

      const job: VideoJob = {
        id: jobId,
        status: "pending",
        teacherId: input.teacherId,
        type: "course-preview",
        scriptText: script,
        createdAt: new Date(),
        metadata: {
          courseName: input.courseName,
          language: input.language,
          level: input.level,
        },
      };
      videoJobs.set(jobId, job);

      const apiKey = process.env.SYNTHESIA_API_KEY;
      if (!apiKey) {
        // Demo mode
        setTimeout(() => {
          const j = videoJobs.get(jobId);
          if (j) {
            j.status = "completed";
            j.videoUrl = `https://demo.synthesia.io/previews/${jobId}.mp4`;
            j.thumbnailUrl = `https://demo.synthesia.io/thumbnails/${jobId}.jpg`;
            j.duration = Math.ceil(script.length / 15);
          }
        }, 3000);
        return { jobId, status: "pending", script, estimatedDuration: Math.ceil(script.length / 15) };
      }

      // Production call
      try {
        const response = await fetch("https://api.synthesia.io/v2/videos", {
          method: "POST",
          headers: { "Authorization": apiKey, "Content-Type": "application/json" },
          body: JSON.stringify({
            title: `Course Preview: ${input.courseName}`,
            description: `Marketing preview for ${input.language} ${input.level} course`,
            visibility: "private",
            input: [{
              avatarSettings: { horizontalAlign: "center", scale: 1, style: "rectangular", seamless: false },
              avatar: teacher.synthesiaAvatarId,
              scriptText: script,
              voiceId: teacher.voiceId,
              background: "luxury_office",
            }],
          }),
        });
        if (!response.ok) { job.status = "failed"; throw new Error(`Synthesia API error: ${response.status}`); }
        const data = await response.json();
        job.status = "processing";
        pollVideoStatus(jobId, data.id, apiKey);
        return { jobId, synthesiaId: data.id, status: "processing", script };
      } catch (error: any) {
        job.status = "failed";
        throw new Error(`Course preview generation failed: ${error.message}`);
      }
    }),

  // === CONNECTME AI TV (Pre-recorded Episodes) ===
  generateTVEpisode: publicProcedure
    .input(z.object({
      teacherId: z.string(),
      seriesName: z.string(),
      episodeNumber: z.number().min(1),
      episodeTitle: z.string(),
      language: z.string(),
      level: z.enum(["beginner", "intermediate", "advanced"]),
      script: z.string().min(50).max(10000),
      background: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const teacher = TEACHER_AVATARS[input.teacherId];
      if (!teacher) throw new Error("Teacher not found");

      const jobId = `tv-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

      const job: VideoJob = {
        id: jobId,
        status: "pending",
        teacherId: input.teacherId,
        type: "tv-episode",
        scriptText: input.script,
        createdAt: new Date(),
        metadata: {
          seriesName: input.seriesName,
          episodeNumber: input.episodeNumber,
          language: input.language,
          level: input.level,
        },
      };
      videoJobs.set(jobId, job);

      const apiKey = process.env.SYNTHESIA_API_KEY;
      if (!apiKey) {
        setTimeout(() => {
          const j = videoJobs.get(jobId);
          if (j) {
            j.status = "completed";
            j.videoUrl = `https://demo.synthesia.io/tv/${input.seriesName}/${jobId}.mp4`;
            j.thumbnailUrl = `https://demo.synthesia.io/tv/thumbnails/${jobId}.jpg`;
            j.duration = Math.ceil(input.script.length / 15);
          }
        }, 5000);
        return { jobId, status: "pending", estimatedDuration: Math.ceil(input.script.length / 15) };
      }

      try {
        const response = await fetch("https://api.synthesia.io/v2/videos", {
          method: "POST",
          headers: { "Authorization": apiKey, "Content-Type": "application/json" },
          body: JSON.stringify({
            title: `${input.seriesName} - Ep ${input.episodeNumber}: ${input.episodeTitle}`,
            description: `ConnectWorld AI TV: ${input.language} ${input.level}`,
            visibility: "private",
            input: [{
              avatarSettings: { horizontalAlign: "center", scale: 1, style: "rectangular", seamless: false },
              avatar: teacher.synthesiaAvatarId,
              scriptText: input.script,
              voiceId: teacher.voiceId,
              background: input.background || "modern_classroom",
            }],
          }),
        });
        if (!response.ok) { job.status = "failed"; throw new Error(`Synthesia API error: ${response.status}`); }
        const data = await response.json();
        job.status = "processing";
        pollVideoStatus(jobId, data.id, apiKey);
        return { jobId, synthesiaId: data.id, status: "processing" };
      } catch (error: any) {
        job.status = "failed";
        throw new Error(`TV episode generation failed: ${error.message}`);
      }
    }),

  // List all TV series available
  listTVSeries: publicProcedure.query(() => {
    return [
      { id: "spanish-street", name: "Spanish Street", language: "Spanish", episodes: 12, level: "beginner", description: "Navigate daily life in Mexico City — from ordering tacos to catching the metro." },
      { id: "paris-life", name: "La Vie Parisienne", language: "French", episodes: 10, level: "intermediate", description: "Follow a student's semester abroad in Paris — romance, culture, and croissants." },
      { id: "tokyo-nights", name: "Tokyo Nights", language: "Japanese", episodes: 8, level: "beginner", description: "A foreigner's first month in Tokyo — from convenience stores to karaoke." },
      { id: "cairo-stories", name: "Cairo Stories", language: "Arabic", episodes: 10, level: "beginner", description: "Explore Egyptian culture through the eyes of a traveler in Cairo." },
      { id: "rio-rhythms", name: "Rio Rhythms", language: "Portuguese", episodes: 8, level: "intermediate", description: "Music, beaches, and Brazilian Portuguese — learn through the rhythm of Rio." },
      { id: "seoul-hustle", name: "Seoul Hustle", language: "Korean", episodes: 10, level: "beginner", description: "K-culture immersion — from K-pop to Korean BBQ, learn the language of Seoul." },
      { id: "berlin-express", name: "Berlin Express", language: "German", episodes: 8, level: "intermediate", description: "Fast-paced German through the lens of Berlin's startup scene." },
      { id: "mumbai-mix", name: "Mumbai Mix", language: "Hindi", episodes: 10, level: "beginner", description: "Bollywood, street food, and Hindi — experience Mumbai's vibrant energy." },
    ];
  }),

  // List course previews available for marketing
  listCoursePreviewTemplates: publicProcedure.query(() => {
    return [
      { id: "spanish-beginner", courseName: "Spanish for Beginners", language: "Spanish", level: "beginner", suggestedTeacher: "maria", highlights: ["Conversational from day 1", "Real Mexican Spanish", "Cultural immersion", "AI-powered pronunciation"] },
      { id: "french-intermediate", courseName: "French Conversation Mastery", language: "French", level: "intermediate", suggestedTeacher: "jean", highlights: ["Sound like a local", "Business & casual French", "Parisian culture", "Real-time corrections"] },
      { id: "japanese-beginner", courseName: "Japanese Essentials", language: "Japanese", level: "beginner", suggestedTeacher: "yuki", highlights: ["Hiragana to conversation", "Anime & manga Japanese", "Polite vs casual forms", "Cultural context"] },
      { id: "arabic-beginner", courseName: "Egyptian Arabic Basics", language: "Arabic", level: "beginner", suggestedTeacher: "ahmed", highlights: ["Real Egyptian dialect", "Not textbook Arabic", "Street-ready phrases", "Cultural insights"] },
      { id: "portuguese-beginner", courseName: "Brazilian Portuguese Vibes", language: "Portuguese", level: "beginner", suggestedTeacher: "isabela", highlights: ["Brazilian accent", "Music & culture", "Everyday conversation", "Slang included"] },
    ];
  }),

  // Generate error correction video (when teacher made a mistake)
  generateCorrection: publicProcedure
    .input(z.object({
      teacherId: z.string(),
      originalStatement: z.string(),
      correctedStatement: z.string(),
      explanation: z.string(),
      studentName: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const teacher = TEACHER_AVATARS[input.teacherId];
      if (!teacher) throw new Error("Teacher not found");

      const script = `Hi${input.studentName ? ` ${input.studentName}` : ""}! I wanted to follow up on something from our last session. I said "${input.originalStatement}" but the correct way to say it is "${input.correctedStatement}". ${input.explanation}. Sorry for the confusion, and keep up the great work!`;

      const jobId = `correction-${Date.now()}`;
      const job: VideoJob = {
        id: jobId,
        status: "completed",
        teacherId: input.teacherId,
        type: "correction",
        scriptText: script,
        videoUrl: `https://demo.synthesia.io/corrections/${jobId}.mp4`,
        duration: Math.ceil(script.length / 15),
        createdAt: new Date(),
      };
      videoJobs.set(jobId, job);

      return { jobId, script, status: "completed" };
    }),

  // Get teacher avatar for real-time streaming (Hume + Synthesia combo)
  getStreamConfig: publicProcedure
    .input(z.object({ teacherId: z.string(), mode: z.enum(["classroom", "one-on-one", "phone-call"]) }))
    .query(({ input }) => {
      const teacher = TEACHER_AVATARS[input.teacherId];
      if (!teacher) throw new Error("Teacher not found");

      return {
        teacher: {
          id: teacher.id,
          name: teacher.name,
          avatarId: teacher.synthesiaAvatarId,
          voiceId: teacher.voiceId,
          photoUrl: teacher.photoUrl,
        },
        humeConfig: {
          persona: `${teacher.name} - ${teacher.language} ${teacher.dialect} teacher`,
          systemPrompt: buildTeacherSystemPrompt(teacher, input.mode),
          voiceSettings: {
            speed: input.mode === "classroom" ? "normal" : "adaptive",
            accent: teacher.dialect,
          },
        },
        streamSettings: {
          mode: input.mode,
          videoEnabled: input.mode !== "phone-call",
          avatarStyle: input.mode === "classroom" ? "full-body" : "bust",
          background: input.mode === "classroom" ? "classroom" : "neutral",
        },
      };
    }),
});

// Helper: poll Synthesia API for video completion
async function pollVideoStatus(jobId: string, synthesiaId: string, apiKey: string) {
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
      const response = await fetch(`https://api.synthesia.io/v2/videos/${synthesiaId}`, {
        headers: { "Authorization": apiKey },
      });
      const data = await response.json();

      if (data.status === "complete") {
        const job = videoJobs.get(jobId);
        if (job) {
          job.status = "completed";
          job.videoUrl = data.download;
          job.duration = data.duration;
        }
      } else if (data.status === "failed") {
        const job = videoJobs.get(jobId);
        if (job) job.status = "failed";
      } else {
        setTimeout(poll, 10000); // Poll every 10s
      }
    } catch {
      setTimeout(poll, 15000);
    }
  };

  setTimeout(poll, 10000);
}

// Helper: generate classroom intro script
function generateIntroScript(teacher: any, topic: string, language: string, classSize: number): string {
  return `Welcome everyone to today's ${language} class! I'm ${teacher.name}, and today we have ${classSize} students joining us. Our topic today is "${topic}". I'm excited to practice with all of you. Remember, don't be afraid to make mistakes - that's how we learn! If you have a question, raise your hand or type it in the chat. Let's get started!`;
}

// Helper: build course preview marketing script
function buildCoursePreviewScript(teacher: any, input: { courseName: string; language: string; level: string; highlights: string[]; tone: string }): string {
  const greetings: Record<string, string> = {
    professional: `Hello! I'm ${teacher.name}, and I'm thrilled to introduce you to`,
    casual: `Hey there! I'm ${teacher.name}, and I can't wait to show you`,
    exciting: `Get ready! I'm ${teacher.name}, and I'm about to take you on an incredible journey with`,
    warm: `Hi! I'm ${teacher.name}, and I'd love to welcome you to`,
  };
  const greeting = greetings[input.tone] || greetings.exciting;
  const highlightText = input.highlights.map((h, i) => `${i + 1}. ${h}`).join(". ");
  return `${greeting} ${input.courseName}! This ${input.level} ${input.language} course is designed to get you speaking confidently from day one. Here's what makes this course special: ${highlightText}. Whether you're preparing for travel, connecting with family, or advancing your career, this course will transform how you communicate. Join me, and let's make ${input.language} your superpower. See you in class!`;
}

// Helper: build system prompt for Hume integration
function buildTeacherSystemPrompt(teacher: any, mode: string): string {
  const basePrompt = `You are ${teacher.name}, a ${teacher.nationality} ${teacher.language} teacher specializing in ${teacher.dialect} dialect. ${teacher.description}`;

  if (mode === "classroom") {
    return `${basePrompt}\n\nYou are currently teaching a virtual group class. Keep responses concise and manage time well. If a student asks a complex question, acknowledge it and offer to answer in chat or after class. Encourage participation from all students. If running low on time, say "Great question! Let me type the answer in the chat so we can keep moving."`;
  } else if (mode === "one-on-one") {
    return `${basePrompt}\n\nYou are in a 1-on-1 tutoring session. Be patient, thorough, and adaptive. Adjust your pace based on the student's confidence level. Provide detailed explanations and practice exercises. Focus on the student's specific goals and weaknesses.`;
  } else {
    return `${basePrompt}\n\nYou are making a phone call to a student for a surprise practice session. Be energetic and encouraging. Keep the conversation natural and flowing. Test their knowledge casually through conversation.`;
  }
}
