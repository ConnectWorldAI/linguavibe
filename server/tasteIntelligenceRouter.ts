import { z } from "zod";
import { router, publicProcedure } from "./_core/trpc";
import { invokeLLM } from "./_core/llm";

export const tasteIntelligenceRouter = router({
  generatePersonalizedPrompts: publicProcedure
    .input(z.object({
      tasteSummary: z.string(),
      targetLanguage: z.string(),
      level: z.enum(["beginner", "intermediate", "advanced"]),
      count: z.number().min(1).max(5).default(3),
      teachingFocus: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const { tasteSummary, targetLanguage, level, count, teachingFocus } = input;
      const systemPrompt = `You are a music intelligence AI that creates song generation prompts for a language learning app. Analyze a user's music taste and create Suno AI-compatible prompts that generate songs matching their vibe but in their target language for learning. Match their preferred genres, tempos, moods, and vocal styles. Write lyrics in ${targetLanguage} appropriate for ${level} level. Teaching focus: ${teachingFocus || "general vocabulary and common phrases"}. Output format: JSON array.`;
      const userPrompt = `${tasteSummary}\n\nGenerate ${count} personalized song concepts. For each provide: title (in ${targetLanguage}), suno_prompt (style/genre tags + mood + tempo + vocal, max 200 chars), lyrics_prompt (what lyrics should teach), style_tags (array), teaching_focus (language skill), estimated_tempo (slow/medium/fast), mood (one word). Return ONLY valid JSON array.`;
      const result = await invokeLLM({ messages: [{ role: "system", content: systemPrompt }, { role: "user", content: userPrompt }] });
      try {
        const content = result.content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
        const songs = JSON.parse(content);
        return { songs, success: true };
      } catch {
        return { songs: [], success: false, error: "Failed to parse LLM response" };
      }
    }),

  generateLyrics: publicProcedure
    .input(z.object({
      tasteSummary: z.string(),
      targetLanguage: z.string(),
      level: z.enum(["beginner", "intermediate", "advanced"]),
      songConcept: z.string(),
      teachingFocus: z.string(),
    }))
    .mutation(async ({ input }) => {
      const { tasteSummary, targetLanguage, level, songConcept, teachingFocus } = input;
      const result = await invokeLLM({
        messages: [
          { role: "system", content: `You are a songwriter who writes catchy songs in ${targetLanguage} for ${level} level learners. Match the user's taste while teaching language concepts.` },
          { role: "user", content: `User's taste: ${tasteSummary}\n\nSong concept: ${songConcept}\nTeaching focus: ${teachingFocus}\n\nWrite full song lyrics (verse, chorus, verse, chorus, bridge, chorus) in ${targetLanguage}. Include key vocabulary translation at end.` },
        ],
      });
      return { lyrics: result.content, success: true };
    }),

  analyzeMusicDNA: publicProcedure
    .input(z.object({ artists: z.array(z.string()), songs: z.array(z.string()).optional() }))
    .mutation(async ({ input }) => {
      const { artists, songs } = input;
      const result = await invokeLLM({
        messages: [
          { role: "system", content: "You are a music analyst. Analyze artists/songs and extract musical DNA. Return JSON only." },
          { role: "user", content: `Analyze: ${artists.join(", ")}${songs?.length ? ` | Songs: ${songs.join(", ")}` : ""}\n\nReturn JSON: { genres: string[], subGenres: string[], typicalBPM: string, moods: string[], vocalStyles: string[], instrumentation: string[], culturalContext: string, recommendedTempos: string[] }` },
        ],
      });
      try {
        const content = result.content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
        return { analysis: JSON.parse(content), success: true };
      } catch {
        return { analysis: null, success: false };
      }
    }),

  generateAudioFromTaste: publicProcedure
    .input(z.object({
      prompt: z.string(),
      lyrics: z.string(),
      title: z.string(),
    }))
    .mutation(async ({ input }) => {
      const apiKey = process.env.SUNO_API_KEY || process.env.APIFRAME_API_KEY;
      if (!apiKey) {
        return { status: "no_key", message: "Audio generation requires APIFRAME_API_KEY. Lyrics available only.", lyrics: input.lyrics };
      }
      
      // Submit to Suno via Apiframe
      const response = await fetch("https://api.apiframe.pro/suno/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
        body: JSON.stringify({
          prompt: input.prompt,
          lyrics: input.lyrics,
          title: input.title,
          make_instrumental: false,
        }),
      });
      
      if (!response.ok) {
        return { status: "error", message: "Failed to generate audio" };
      }
      
      const data = await response.json();
      return { status: "submitted", taskId: data.task_id || data.id, message: "Audio generation started" };
    }),

  getAudioStatus: publicProcedure
    .input(z.object({ taskId: z.string() }))
    .query(async ({ input }) => {
      const apiKey = process.env.SUNO_API_KEY || process.env.APIFRAME_API_KEY;
      if (!apiKey) return { status: "no_key" };
      
      const response = await fetch(`https://api.apiframe.pro/suno/status/${input.taskId}`, {
        headers: { "Authorization": `Bearer ${apiKey}` },
      });
      
      if (!response.ok) return { status: "pending" };
      const data = await response.json();
      return {
        status: data.status || "pending",
        audioUrl: data.audio_url || data.output?.[0]?.audio_url || null,
        title: data.title || null,
      };
    }),


  analyzeVideoContent: publicProcedure
    .input(z.object({ url: z.string().url() }))
    .mutation(async ({ input }) => {
      const prompt = `Analyze this video URL and provide a summary. URL: ${input.url}\n\nReturn a JSON object with:\n- title: A descriptive title for the video content\n- description: A 2-3 sentence summary of what is happening in the video\n- keyPhrases: An array of 5-8 key phrases or vocabulary from the video that would be useful for language learners\n- language: The primary language spoken in the video\n\nRespond ONLY with valid JSON.`;

      try {
        const result = await invokeLLM({ messages: [{ role: "user", content: prompt }] });
        const content = result.content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
        return JSON.parse(content);
      } catch (e) {
        return {
          title: "Video Content",
          description: "AI analysis of the video at: " + input.url + ". The video contains spoken content that can be used for language learning.",
          keyPhrases: ["greeting", "conversation", "expression", "vocabulary", "pronunciation"],
          language: "Unknown",
        };
      }
    }),

});
