/**
 * useKlingVideo Hook
 * 
 * Client-side hook for generating and managing Kling AI videos.
 * Used by: ConnectWorld AI TV (Watch & Learn), Cultural Scenarios, Celebration Videos
 * 
 * Features:
 * - Generate lesson videos (text-to-video)
 * - Generate teacher avatar videos (image-to-video)
 * - Poll for video completion status
 * - Cache generated videos locally
 * - Handle loading/error states
 */
import { useState, useCallback, useRef, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Types
export type VideoCategory = "cultural-scenario" | "vocabulary-story" | "grammar-visual" | "lesson-intro" | "immersion-clip";
export type VideoStatus = "idle" | "generating" | "polling" | "ready" | "error";

export interface GeneratedVideo {
  id: string;
  videoUrl: string;
  thumbnailUrl?: string;
  category: VideoCategory;
  topic: string;
  language: string;
  duration: number;
  generatedAt: number;
}

export interface UseKlingVideoReturn {
  status: VideoStatus;
  currentVideo: GeneratedVideo | null;
  generateLessonVideo: (params: {
    category: VideoCategory;
    topic: string;
    language: string;
    aspectRatio?: string;
  }) => Promise<GeneratedVideo | null>;
  generateTeacherVideo: (params: {
    teacherPhotoUrl: string;
    topic: string;
    language: string;
    teacherName: string;
  }) => Promise<GeneratedVideo | null>;
  generateCelebration: (params: {
    achievement: string;
    streakDays?: number;
    level?: string;
  }) => Promise<GeneratedVideo | null>;
  getCachedVideo: (key: string) => Promise<GeneratedVideo | null>;
  error: string | null;
}

const VIDEO_CACHE_PREFIX = "kling_video_cache_";
const POLL_INTERVAL = 10000; // 10 seconds
const MAX_POLL_ATTEMPTS = 60; // 10 minutes max

export function useKlingVideo(): UseKlingVideoReturn {
  const [status, setStatus] = useState<VideoStatus>("idle");
  const [currentVideo, setCurrentVideo] = useState<GeneratedVideo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // tRPC mutations
  const generateMutation = trpc.klingVideo.generateLessonVideo.useMutation();
  // generateTeacherVideo not available on server, use generateLessonVideo as fallback
  const celebrationMutation = trpc.klingVideo.generateCelebration.useMutation();
  // Note: getVideoStatus is a query on the server, but we call it imperatively via mutateAsync pattern
  // We use a ref-based fetch approach instead
  const trpcUtils = trpc.useUtils();

  // Clean up polling on unmount
  useEffect(() => {
    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
      }
    };
  }, []);

  // Poll for video completion
  const pollForCompletion = useCallback(async (jobId: string): Promise<GeneratedVideo | null> => {
    return new Promise((resolve) => {
      let attempts = 0;

      const poll = async () => {
        attempts++;
        if (attempts > MAX_POLL_ATTEMPTS) {
          setStatus("error");
          setError("Video generation timed out");
          if (pollRef.current) clearInterval(pollRef.current);
          resolve(null);
          return;
        }

        try {
          const result = await trpcUtils.klingVideo.getVideoStatus.fetch({ jobId });

          if (result.status === "completed" && (result as any).videoUrl) {
            if (pollRef.current) clearInterval(pollRef.current);
            const video: GeneratedVideo = {
              id: jobId,
              videoUrl: (result as any).videoUrl,
              thumbnailUrl: result.thumbnailUrl || undefined,
              category: (result.category || "lesson-intro") as VideoCategory,
              topic: result.prompt || "",
              language: "",
              duration: result.duration || 5,
              generatedAt: Date.now(),
            };
            setCurrentVideo(video);
            setStatus("ready");
            resolve(video);
          } else if (result.status === "failed") {
            if (pollRef.current) clearInterval(pollRef.current);
            setStatus("error");
            setError("Video generation failed");
            resolve(null);
          }
          // Otherwise keep polling
        } catch (e) {
          // Network error, keep trying
        }
      };

      setStatus("polling");
      pollRef.current = setInterval(poll, POLL_INTERVAL);
      // First poll immediately
      poll();
    });
  }, [trpcUtils]);

  // Generate a lesson video
  const generateLessonVideo = useCallback(async (params: {
    category: VideoCategory;
    topic: string;
    language: string;
    aspectRatio?: string;
  }): Promise<GeneratedVideo | null> => {
    const cacheKey = `${params.category}_${params.topic}_${params.language}`;

    // Check cache first
    const cached = await getCachedVideo(cacheKey);
    if (cached) {
      setCurrentVideo(cached);
      setStatus("ready");
      return cached;
    }

    try {
      setStatus("generating");
      setError(null);

      const result = await generateMutation.mutateAsync({
        category: params.category,
        topic: params.topic,
        language: params.language,
        aspectRatio: (params.aspectRatio || "16:9") as "16:9" | "9:16" | "1:1",
      });

      if (result.status === "completed" && (result as any).videoUrl) {
        const video: GeneratedVideo = {
          id: result.jobId,
          videoUrl: (result as any).videoUrl,
          category: params.category,
          topic: params.topic,
          language: params.language,
          duration: 5,
          generatedAt: Date.now(),
        };
        setCurrentVideo(video);
        setStatus("ready");
        await cacheVideo(cacheKey, video);
        return video;
      }

      // Video is being generated, poll for completion
      const video = await pollForCompletion(result.jobId);
      if (video) {
        video.category = params.category;
        video.topic = params.topic;
        video.language = params.language;
        await cacheVideo(cacheKey, video);
      }
      return video;
    } catch (e: any) {
      setStatus("error");
      setError(e.message || "Failed to generate video");
      return null;
    }
  }, [generateMutation, pollForCompletion]);

  // Generate a teacher avatar video
  const generateTeacherVideo = useCallback(async (params: {
    teacherPhotoUrl: string;
    topic: string;
    language: string;
    teacherName: string;
  }): Promise<GeneratedVideo | null> => {
    const cacheKey = `teacher_${params.teacherName}_${params.topic}`;

    const cached = await getCachedVideo(cacheKey);
    if (cached) {
      setCurrentVideo(cached);
      setStatus("ready");
      return cached;
    }

    try {
      setStatus("generating");
      setError(null);

      const result = await generateMutation.mutateAsync({
        category: "lesson-intro" as any,
        topic: `${params.teacherName} teaches: ${params.topic}`,
        language: params.language,
        aspectRatio: "16:9" as const,
      });

      if (result.status === "completed" && (result as any).videoUrl) {
        const video: GeneratedVideo = {
          id: result.jobId,
          videoUrl: (result as any).videoUrl,
          category: "lesson-intro",
          topic: params.topic,
          language: params.language,
          duration: 8,
          generatedAt: Date.now(),
        };
        setCurrentVideo(video);
        setStatus("ready");
        await cacheVideo(cacheKey, video);
        return video;
      }

      const video = await pollForCompletion(result.jobId);
      if (video) {
        await cacheVideo(cacheKey, video);
      }
      return video;
    } catch (e: any) {
      setStatus("error");
      setError(e.message || "Failed to generate teacher video");
      return null;
    }
  }, [generateMutation, pollForCompletion]);

  // Generate a celebration video
  const generateCelebration = useCallback(async (params: {
    achievement: string;
    streakDays?: number;
    level?: string;
  }): Promise<GeneratedVideo | null> => {
    try {
      setStatus("generating");
      setError(null);

      const result = await celebrationMutation.mutateAsync(params);

      if (result.status === "completed" && (result as any).videoUrl) {
        const video: GeneratedVideo = {
          id: result.jobId,
          videoUrl: (result as any).videoUrl,
          category: "lesson-intro",
          topic: params.achievement,
          language: "",
          duration: 5,
          generatedAt: Date.now(),
        };
        setCurrentVideo(video);
        setStatus("ready");
        return video;
      }

      return await pollForCompletion(result.jobId);
    } catch (e: any) {
      setStatus("error");
      setError(e.message || "Failed to generate celebration");
      return null;
    }
  }, [celebrationMutation, pollForCompletion]);

  // Cache helpers
  const getCachedVideo = useCallback(async (key: string): Promise<GeneratedVideo | null> => {
    try {
      const cached = await AsyncStorage.getItem(`${VIDEO_CACHE_PREFIX}${key}`);
      if (cached) {
        const video = JSON.parse(cached) as GeneratedVideo;
        // Cache valid for 7 days
        if (Date.now() - video.generatedAt < 7 * 24 * 60 * 60 * 1000) {
          return video;
        }
      }
    } catch {
      // Cache miss
    }
    return null;
  }, []);

  const cacheVideo = useCallback(async (key: string, video: GeneratedVideo) => {
    try {
      await AsyncStorage.setItem(`${VIDEO_CACHE_PREFIX}${key}`, JSON.stringify(video));
    } catch {
      // Non-critical
    }
  }, []);

  return {
    status,
    currentVideo,
    generateLessonVideo,
    generateTeacherVideo,
    generateCelebration,
    getCachedVideo,
    error,
  };
}
