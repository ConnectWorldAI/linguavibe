import { z } from "zod";
import { router, publicProcedure } from "./_core/trpc";
import { invokeLLM } from "./_core/llm";

function extractText(result: any): string {
  const raw = result.choices?.[0]?.message?.content;
  if (!raw) return "";
  if (typeof raw === "string") return raw;
  const textPart = raw.find((p: any) => p.type === "text");
  return textPart?.text ?? "";
}

export const songReproductionRouter = router({
  detectPlatform: publicProcedure
    .input(z.object({ url: z.string() }))
    .mutation(async ({ input }) => {
      const { url } = input;
      let platform = "unknown";
      let songId = "";
      let isSupported = false;

      if (/spotify\.com/i.test(url)) {
        platform = "Spotify";
        isSupported = true;
        const match = url.match(/track\/([a-zA-Z0-9]+)/);
        if (match) songId = match[1];
      } else if (/apple\.com/i.test(url)) {
        platform = "Apple Music";
        isSupported = true;
        const match = url.match(/i=([0-9]+)/);
        if (match) songId = match[1];
      } else if (/youtube\.com|youtu\.be/i.test(url)) {
        platform = "YouTube Music";
        isSupported = true;
        const match = url.match(/[?&]v=([^&]+)/) || url.match(/youtu\.be\/([^?]+)/);
        if (match) songId = match[1];
      } else if (/soundcloud\.com/i.test(url)) {
        platform = "SoundCloud";
        isSupported = true;
      } else if (/tidal\.com/i.test(url)) {
        platform = "Tidal";
        isSupported = true;
      } else if (/deezer\.com/i.test(url)) {
        platform = "Deezer";
        isSupported = true;
      } else if (/amazon\.com/i.test(url)) {
        platform = "Amazon Music";
        isSupported = true;
      }

      return { platform, songId, isSupported };
    }),

  fetchMetadata: publicProcedure
    .input(z.object({ url: z.string(), platform: z.string() }))
    .mutation(async ({ input }) => {
      const { url, platform } = input;
      
      try {
        if (platform === "Spotify") {
          const res = await fetch(`https://open.spotify.com/oembed?url=${encodeURIComponent(url)}`);
          if (res.ok) {
            const data = await res.json();
            return {
              title: data.title || "Unknown Title",
              artist: data.author_name || "Unknown Artist",
              albumArt: data.thumbnail_url || "",
              duration: 0,
              album: "Unknown Album"
            };
          }
        } else if (platform === "YouTube Music") {
          const res = await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(url)}`);
          if (res.ok) {
            const data = await res.json();
            return {
              title: data.title || "Unknown Title",
              artist: data.author_name || "Unknown Artist",
              albumArt: data.thumbnail_url || "",
              duration: 0,
              album: "Unknown Album"
            };
          }
        }
      } catch (e) {
        // Fallback to LLM
      }

      // LLM Fallback
      const prompt = `Extract metadata for the song at this URL: ${url}. Return JSON with title, artist, albumArt (url if possible), duration (number in seconds), album.`;
      const result = await invokeLLM({
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" }
      });
      
      const text = extractText(result);
      try {
        const parsed = JSON.parse(text);
        return {
          title: parsed.title || "Unknown Title",
          artist: parsed.artist || "Unknown Artist",
          albumArt: parsed.albumArt || "",
          duration: parsed.duration || 0,
          album: parsed.album || "Unknown Album"
        };
      } catch (e) {
        return {
          title: "Unknown Title",
          artist: "Unknown Artist",
          albumArt: "",
          duration: 0,
          album: "Unknown Album"
        };
      }
    }),

  fetchLyrics: publicProcedure
    .input(z.object({ title: z.string(), artist: z.string(), targetLanguage: z.string() }))
    .mutation(async ({ input }) => {
      const { title, artist, targetLanguage } = input;
      const prompt = `Provide the lyrics for "${title}" by ${artist}. Also translate them to ${targetLanguage} with rhythm/syllable awareness. Extract key vocabulary. Return JSON with:
{
  "originalLyrics": ["line 1", "line 2"],
  "translatedLyrics": ["translated line 1", "translated line 2"],
  "vocabulary": [{"word": "word", "translation": "translation", "partOfSpeech": "noun"}]
}`;
      const result = await invokeLLM({
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" }
      });
      
      const text = extractText(result);
      try {
        const parsed = JSON.parse(text);
        return {
          originalLyrics: parsed.originalLyrics || [],
          translatedLyrics: parsed.translatedLyrics || [],
          vocabulary: parsed.vocabulary || []
        };
      } catch (e) {
        return {
          originalLyrics: [],
          translatedLyrics: [],
          vocabulary: []
        };
      }
    }),

  requestStemSeparation: publicProcedure
    .input(z.object({ audioUrl: z.string(), stems: z.array(z.string()) }))
    .mutation(async ({ input }) => {
      return {
        jobId: `stem-job-${Date.now()}`,
        status: 'processing',
        estimatedTime: 45
      };
    }),

  requestVocalSynthesis: publicProcedure
    .input(z.object({ 
      lyrics: z.string(), 
      targetLanguage: z.string(), 
      voiceStyle: z.string(), 
      key: z.string(), 
      tempo: z.number() 
    }))
    .mutation(async ({ input }) => {
      return {
        jobId: `vocal-job-${Date.now()}`,
        status: 'processing',
        estimatedTime: 60
      };
    }),

  getJobStatus: publicProcedure
    .input(z.object({ jobId: z.string() }))
    .query(async ({ input }) => {
      return {
        jobId: input.jobId,
        status: 'completed',
        outputUrl: '/manus-storage/mock-output.mp3',
        progress: 100
      };
    })
});
