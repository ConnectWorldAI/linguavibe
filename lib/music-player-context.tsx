import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from "react";
import { createAudioPlayer, AudioPlayer, setAudioModeAsync } from "expo-audio";
import { Platform } from "react-native";

export interface MiniPlayerTrack {
  id: string;
  title: string;
  artist: string;
  artworkColor?: string;
  language?: string;
  languageFlag?: string;
  audioUrl?: string;
}

interface MusicPlayerContextType {
  currentTrack: MiniPlayerTrack | null;
  isPlaying: boolean;
  progress: number; // 0-1
  duration: number; // seconds
  play: (track: MiniPlayerTrack, audioUrl?: string) => void;
  pause: () => void;
  resume: () => void;
  stop: () => void;
  dismiss: () => void;
  skipNext: () => void;
  skipPrevious: () => void;
  addToQueue: (track: MiniPlayerTrack, audioUrl?: string) => void;
  queue: MiniPlayerTrack[];
  isVisible: boolean;
}

const MusicPlayerContext = createContext<MusicPlayerContextType | null>(null);

export function MusicPlayerProvider({ children }: { children: React.ReactNode }) {
  const [currentTrack, setCurrentTrack] = useState<MiniPlayerTrack | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [queue, setQueue] = useState<MiniPlayerTrack[]>([]);
  const [history, setHistory] = useState<MiniPlayerTrack[]>([]);
  const playerRef = useRef<AudioPlayer | null>(null);
  const progressInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (playerRef.current) {
        playerRef.current.remove();
      }
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
      }
    };
  }, []);

  const startProgressTracking = useCallback(() => {
    if (progressInterval.current) clearInterval(progressInterval.current);
    progressInterval.current = setInterval(() => {
      if (playerRef.current) {
        const dur = playerRef.current.duration || 1;
        const current = playerRef.current.currentTime || 0;
        setDuration(dur);
        setProgress(dur > 0 ? current / dur : 0);
        if (!playerRef.current.playing) {
          setIsPlaying(false);
          if (current >= dur - 0.5) {
            // Song ended — auto-play next in queue
            setProgress(0);
          }
        }
      }
    }, 500);
  }, []);

  const play = useCallback(async (track: MiniPlayerTrack, audioUrl?: string) => {
    // Stop existing player
    if (playerRef.current) {
      playerRef.current.pause();
      playerRef.current.remove();
      playerRef.current = null;
    }
    if (progressInterval.current) clearInterval(progressInterval.current);

    // Push current track to history
    if (currentTrack) {
      setHistory((prev) => [currentTrack, ...prev].slice(0, 50));
    }

    const trackWithUrl = { ...track, audioUrl };
    setCurrentTrack(trackWithUrl);
    setIsVisible(true);
    setProgress(0);
    setDuration(0);

    if (audioUrl) {
      try {
        if (Platform.OS !== "web") {
          await setAudioModeAsync({ playsInSilentMode: true });
        }
        const player = createAudioPlayer(audioUrl);
        playerRef.current = player;
        player.play();
        setIsPlaying(true);
        startProgressTracking();
      } catch (e) {
        // Audio failed, still show mini-player with track info
        setIsPlaying(false);
      }
    } else {
      // No audio URL - just show the track in mini-player (simulated)
      setIsPlaying(true);
      // Simulate progress for demo purposes
      let simProgress = 0;
      progressInterval.current = setInterval(() => {
        simProgress += 0.005;
        if (simProgress >= 1) {
          simProgress = 0;
          setIsPlaying(false);
          if (progressInterval.current) clearInterval(progressInterval.current);
        }
        setProgress(simProgress);
      }, 150);
    }
  }, [startProgressTracking]);

  const pause = useCallback(() => {
    if (playerRef.current) {
      playerRef.current.pause();
    }
    if (progressInterval.current) clearInterval(progressInterval.current);
    setIsPlaying(false);
  }, []);

  const resume = useCallback(() => {
    if (playerRef.current) {
      playerRef.current.play();
      startProgressTracking();
    } else if (currentTrack) {
      // Resume simulated progress
      setIsPlaying(true);
      let simProgress = progress;
      progressInterval.current = setInterval(() => {
        simProgress += 0.005;
        if (simProgress >= 1) {
          simProgress = 0;
          setIsPlaying(false);
          if (progressInterval.current) clearInterval(progressInterval.current);
        }
        setProgress(simProgress);
      }, 150);
    }
    setIsPlaying(true);
  }, [startProgressTracking, currentTrack, progress]);

  const stop = useCallback(() => {
    if (playerRef.current) {
      playerRef.current.pause();
      playerRef.current.remove();
      playerRef.current = null;
    }
    if (progressInterval.current) clearInterval(progressInterval.current);
    setIsPlaying(false);
    setProgress(0);
  }, []);

  const addToQueue = useCallback((track: MiniPlayerTrack, audioUrl?: string) => {
    setQueue((prev) => [...prev, { ...track, audioUrl }]);
  }, []);

  const skipNext = useCallback(() => {
    if (queue.length > 0) {
      const [next, ...rest] = queue;
      setQueue(rest);
      // play will be called with the next track
      if (playerRef.current) {
        playerRef.current.pause();
        playerRef.current.remove();
        playerRef.current = null;
      }
      if (progressInterval.current) clearInterval(progressInterval.current);
      if (currentTrack) {
        setHistory((prev) => [currentTrack, ...prev].slice(0, 50));
      }
      setCurrentTrack(next);
      setProgress(0);
      setDuration(0);
      // Attempt to play audio
      if (next.audioUrl) {
        try {
          const player = createAudioPlayer(next.audioUrl);
          playerRef.current = player;
          player.play();
          setIsPlaying(true);
          startProgressTracking();
        } catch (e) {
          setIsPlaying(false);
        }
      } else {
        setIsPlaying(true);
        let simProgress = 0;
        progressInterval.current = setInterval(() => {
          simProgress += 0.005;
          if (simProgress >= 1) {
            simProgress = 0;
            setIsPlaying(false);
            if (progressInterval.current) clearInterval(progressInterval.current);
          }
          setProgress(simProgress);
        }, 150);
      }
    }
  }, [queue, currentTrack, startProgressTracking]);

  const skipPrevious = useCallback(() => {
    if (history.length > 0) {
      const [prev, ...rest] = history;
      setHistory(rest);
      // Push current to front of queue
      if (currentTrack) {
        setQueue((q) => [currentTrack, ...q]);
      }
      if (playerRef.current) {
        playerRef.current.pause();
        playerRef.current.remove();
        playerRef.current = null;
      }
      if (progressInterval.current) clearInterval(progressInterval.current);
      setCurrentTrack(prev);
      setProgress(0);
      setDuration(0);
      if (prev.audioUrl) {
        try {
          const player = createAudioPlayer(prev.audioUrl);
          playerRef.current = player;
          player.play();
          setIsPlaying(true);
          startProgressTracking();
        } catch (e) {
          setIsPlaying(false);
        }
      } else {
        setIsPlaying(true);
        let simProgress = 0;
        progressInterval.current = setInterval(() => {
          simProgress += 0.005;
          if (simProgress >= 1) {
            simProgress = 0;
            setIsPlaying(false);
            if (progressInterval.current) clearInterval(progressInterval.current);
          }
          setProgress(simProgress);
        }, 150);
      }
    }
  }, [history, currentTrack, startProgressTracking]);

  const dismiss = useCallback(() => {
    stop();
    setCurrentTrack(null);
    setIsVisible(false);
    setQueue([]);
    setHistory([]);
  }, [stop]);

  return (
    <MusicPlayerContext.Provider
      value={{
        currentTrack,
        isPlaying,
        progress,
        duration,
        play,
        pause,
        resume,
        stop,
        dismiss,
        skipNext,
        skipPrevious,
        addToQueue,
        queue,
        isVisible,
      }}
    >
      {children}
    </MusicPlayerContext.Provider>
  );
}

export function useMusicPlayer() {
  const ctx = useContext(MusicPlayerContext);
  if (!ctx) {
    throw new Error("useMusicPlayer must be used within MusicPlayerProvider");
  }
  return ctx;
}
