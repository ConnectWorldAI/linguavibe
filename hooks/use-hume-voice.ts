/**
 * Hume EVI Voice Hook
 * 
 * Provides a React hook for connecting to Hume's Empathic Voice Interface (EVI)
 * from the mobile app. Handles:
 * - Token acquisition from our backend
 * - WebSocket connection to Hume EVI
 * - Audio streaming (mic → Hume) via MediaRecorder (web) or expo-audio (native)
 * - Audio playback (Hume → speaker) via AudioContext (web) or expo-audio (native)
 * - Emotion detection callbacks
 * - Session lifecycle management
 * 
 * Usage:
 * ```tsx
 * const { connect, disconnect, isConnected, emotions, transcript } = useHumeVoice({
 *   persona: "ai_teacher_spanish",
 *   language: "Spanish",
 *   dialect: "Dominican",
 * });
 * ```
 */

import { useState, useCallback, useRef, useEffect } from "react";
import { Platform } from "react-native";
import { trpc } from "@/lib/trpc";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface EmotionScore {
  name: string;
  score: number;
}

export interface HumeMessage {
  role: "user" | "assistant";
  content: string;
  emotions?: EmotionScore[];
  timestamp: number;
}

export interface UseHumeVoiceOptions {
  persona?: string;
  language?: string;
  dialect?: string;
  studentLevel?: string;
  customContext?: string;
  onMessage?: (message: HumeMessage) => void;
  onEmotions?: (emotions: EmotionScore[]) => void;
  onError?: (error: string) => void;
  onConnected?: () => void;
  onDisconnected?: () => void;
}

export interface UseHumeVoiceReturn {
  connect: () => Promise<void>;
  disconnect: () => void;
  sendAudio: (base64Audio: string) => void;
  isConnected: boolean;
  isConnecting: boolean;
  isMuted: boolean;
  setMuted: (muted: boolean) => void;
  emotions: EmotionScore[];
  dominantEmotion: string;
  transcript: HumeMessage[];
  sessionId: string | null;
  error: string | null;
  persona: string | null;
}

// ─── Audio Helpers ──────────────────────────────────────────────────────────

/**
 * Convert a base64-encoded PCM/WAV/webm audio string to an ArrayBuffer.
 */
function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * Convert an ArrayBuffer to a base64 string.
 */
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// ─── Web Audio Playback Queue ───────────────────────────────────────────────

class WebAudioPlayer {
  private audioContext: AudioContext | null = null;
  private queue: ArrayBuffer[] = [];
  private isPlaying = false;

  init() {
    if (typeof AudioContext !== "undefined") {
      this.audioContext = new AudioContext({ sampleRate: 24000 });
    }
  }

  async play(base64Audio: string) {
    if (!this.audioContext) return;
    try {
      const buffer = base64ToArrayBuffer(base64Audio);
      this.queue.push(buffer);
      if (!this.isPlaying) {
        this.processQueue();
      }
    } catch (e) {
      console.warn("[WebAudioPlayer] Failed to queue audio:", e);
    }
  }

  private async processQueue() {
    if (!this.audioContext || this.queue.length === 0) {
      this.isPlaying = false;
      return;
    }
    this.isPlaying = true;
    const buffer = this.queue.shift()!;
    try {
      const audioBuffer = await this.audioContext.decodeAudioData(buffer.slice(0));
      const source = this.audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(this.audioContext.destination);
      source.onended = () => this.processQueue();
      source.start();
    } catch {
      // If decoding fails (e.g., raw PCM), try playing as raw 16-bit PCM at 24kHz
      try {
        const pcmData = new Int16Array(buffer);
        const floatData = new Float32Array(pcmData.length);
        for (let i = 0; i < pcmData.length; i++) {
          floatData[i] = pcmData[i] / 32768;
        }
        const audioBuffer = this.audioContext!.createBuffer(1, floatData.length, 24000);
        audioBuffer.getChannelData(0).set(floatData);
        const source = this.audioContext!.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(this.audioContext!.destination);
        source.onended = () => this.processQueue();
        source.start();
      } catch (e2) {
        console.warn("[WebAudioPlayer] Failed to play audio:", e2);
        this.processQueue();
      }
    }
  }

  stop() {
    this.queue = [];
    this.isPlaying = false;
  }

  destroy() {
    this.stop();
    this.audioContext?.close();
    this.audioContext = null;
  }
}

// ─── Web Microphone Capture ─────────────────────────────────────────────────

class WebMicCapture {
  private stream: MediaStream | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private onAudioChunk: ((base64: string) => void) | null = null;
  private _isMuted = false;

  async start(onAudioChunk: (base64: string) => void): Promise<boolean> {
    this.onAudioChunk = onAudioChunk;
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
        },
      });

      // Use MediaRecorder to capture chunks
      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : "audio/webm";

      this.mediaRecorder = new MediaRecorder(this.stream, {
        mimeType,
        audioBitsPerSecond: 16000,
      });

      this.mediaRecorder.ondataavailable = async (event) => {
        if (event.data.size > 0 && !this._isMuted && this.onAudioChunk) {
          const arrayBuffer = await event.data.arrayBuffer();
          const base64 = arrayBufferToBase64(arrayBuffer);
          this.onAudioChunk(base64);
        }
      };

      // Send audio chunks every 250ms for real-time streaming
      this.mediaRecorder.start(250);
      return true;
    } catch (e) {
      console.error("[WebMicCapture] Failed to start:", e);
      return false;
    }
  }

  setMuted(muted: boolean) {
    this._isMuted = muted;
    // Also mute the actual tracks for privacy
    if (this.stream) {
      this.stream.getAudioTracks().forEach((track) => {
        track.enabled = !muted;
      });
    }
  }

  stop() {
    if (this.mediaRecorder && this.mediaRecorder.state !== "inactive") {
      this.mediaRecorder.stop();
    }
    if (this.stream) {
      this.stream.getTracks().forEach((t) => t.stop());
    }
    this.mediaRecorder = null;
    this.stream = null;
    this.onAudioChunk = null;
  }
}

// ─── Hook Implementation ─────────────────────────────────────────────────────

export function useHumeVoice(options: UseHumeVoiceOptions = {}): UseHumeVoiceReturn {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isMuted, setIsMutedState] = useState(false);
  const [emotions, setEmotions] = useState<EmotionScore[]>([]);
  const [dominantEmotion, setDominantEmotion] = useState("neutral");
  const [transcript, setTranscript] = useState<HumeMessage[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [persona, setPersona] = useState<string | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const sessionIdRef = useRef<string | null>(null);
  const audioPlayerRef = useRef<WebAudioPlayer | null>(null);
  const micCaptureRef = useRef<WebMicCapture | null>(null);

  // tRPC mutations
  const getAccessToken = trpc.hume.getAccessToken.useMutation();
  const reportEmotions = trpc.hume.reportEmotions.useMutation();
  const endSession = trpc.hume.endSession.useMutation();

  /**
   * Handle incoming Hume EVI messages.
   */
  const handleHumeMessage = useCallback((msg: any) => {
    switch (msg.type) {
      case "user_message": {
        const userMsg: HumeMessage = {
          role: "user",
          content: msg.message?.content || "",
          emotions: msg.models?.prosody?.scores
            ? Object.entries(msg.models.prosody.scores)
                .map(([name, score]) => ({ name, score: score as number }))
                .sort((a, b) => b.score - a.score)
                .slice(0, 10)
            : undefined,
          timestamp: Date.now(),
        };

        setTranscript((prev) => [...prev, userMsg]);
        options.onMessage?.(userMsg);

        if (userMsg.emotions?.length) {
          setEmotions(userMsg.emotions);
          setDominantEmotion(userMsg.emotions[0]?.name || "neutral");
          options.onEmotions?.(userMsg.emotions);

          if (sessionIdRef.current) {
            reportEmotions.mutate({
              sessionId: sessionIdRef.current,
              emotions: userMsg.emotions.slice(0, 5),
              transcript: userMsg.content,
            });
          }
        }
        break;
      }

      case "assistant_message": {
        const assistantMsg: HumeMessage = {
          role: "assistant",
          content: msg.message?.content || "",
          timestamp: Date.now(),
        };
        setTranscript((prev) => [...prev, assistantMsg]);
        options.onMessage?.(assistantMsg);
        break;
      }

      case "audio_output": {
        // Play EVI's audio response
        if (msg.data && audioPlayerRef.current) {
          audioPlayerRef.current.play(msg.data);
        }
        break;
      }

      case "user_interruption": {
        // User interrupted EVI — stop any playing audio
        if (audioPlayerRef.current) {
          audioPlayerRef.current.stop();
        }
        break;
      }

      case "error": {
        console.error("[HumeVoice] EVI error:", msg.message);
        setError(msg.message || "EVI error");
        options.onError?.(msg.message || "EVI error");
        break;
      }
    }
  }, [options, reportEmotions]);

  /**
   * Send audio data to Hume EVI.
   * Call this with base64-encoded audio chunks from the microphone.
   */
  const sendAudio = useCallback((base64Audio: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: "audio_input",
        data: base64Audio,
      }));
    }
  }, []);

  /**
   * Set muted state and propagate to mic capture.
   */
  const setMuted = useCallback((muted: boolean) => {
    setIsMutedState(muted);
    if (micCaptureRef.current) {
      micCaptureRef.current.setMuted(muted);
    }
  }, []);

  /**
   * Connect to Hume EVI via WebSocket with full audio pipeline.
   */
  const connect = useCallback(async () => {
    if (isConnected || isConnecting) return;

    setIsConnecting(true);
    setError(null);

    try {
      // 1. Get access token from our backend
      const result = await getAccessToken.mutateAsync({
        persona: options.persona || "cloudwave",
        language: options.language,
        dialect: options.dialect,
        studentLevel: options.studentLevel,
        customContext: options.customContext,
      });

      if (!result.success) {
        throw new Error(result.error || "Failed to get access token");
      }

      const { accessToken, configId, sessionId: sid, websocketUrl } = result;
      setSessionId(sid);
      sessionIdRef.current = sid;
      setPersona(result.persona?.name || options.persona || null);

      // 2. Initialize audio player for playback
      if (Platform.OS === "web") {
        const player = new WebAudioPlayer();
        player.init();
        audioPlayerRef.current = player;
      }

      // 3. Connect to Hume EVI WebSocket
      const wsUrl = configId
        ? `${websocketUrl}?access_token=${accessToken}&config_id=${configId}`
        : `${websocketUrl}?access_token=${accessToken}`;

      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = async () => {
        setIsConnected(true);
        setIsConnecting(false);
        options.onConnected?.();
        console.log("[HumeVoice] Connected to EVI");

        // 4. Start microphone capture and stream to Hume
        if (Platform.OS === "web") {
          const mic = new WebMicCapture();
          micCaptureRef.current = mic;
          const started = await mic.start((base64Audio) => {
            // Stream audio chunks to Hume EVI
            if (ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify({
                type: "audio_input",
                data: base64Audio,
              }));
            }
          });
          if (!started) {
            setError("Microphone access denied. Please allow microphone access and try again.");
          }
        }
        // Native audio capture would use expo-audio recorder here
        // For now, native falls back to text-only mode
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          handleHumeMessage(msg);
        } catch (e) {
          console.warn("[HumeVoice] Failed to parse message:", e);
        }
      };

      ws.onerror = (event) => {
        console.error("[HumeVoice] WebSocket error:", event);
        setError("Connection error — please check your internet and try again.");
        options.onError?.("WebSocket connection error");
      };

      ws.onclose = (event) => {
        setIsConnected(false);
        setIsConnecting(false);
        wsRef.current = null;

        // Clean up audio
        micCaptureRef.current?.stop();
        micCaptureRef.current = null;
        audioPlayerRef.current?.stop();

        options.onDisconnected?.();
        console.log("[HumeVoice] Disconnected:", event.code, event.reason);
      };
    } catch (err: any) {
      setIsConnecting(false);
      const message = err.message || "Connection failed";
      setError(message);
      options.onError?.(message);
      console.error("[HumeVoice] Connection failed:", err);
    }
  }, [isConnected, isConnecting, options, getAccessToken, handleHumeMessage]);

  /**
   * Disconnect from Hume EVI.
   */
  const disconnect = useCallback(() => {
    // Stop mic capture
    micCaptureRef.current?.stop();
    micCaptureRef.current = null;

    // Stop audio playback
    audioPlayerRef.current?.destroy();
    audioPlayerRef.current = null;

    // Close WebSocket
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    // End session on backend
    if (sessionIdRef.current) {
      endSession.mutate({ sessionId: sessionIdRef.current });
      sessionIdRef.current = null;
    }

    setIsConnected(false);
    setIsConnecting(false);
    setSessionId(null);
  }, [endSession]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      micCaptureRef.current?.stop();
      audioPlayerRef.current?.destroy();
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  return {
    connect,
    disconnect,
    sendAudio,
    isConnected,
    isConnecting,
    isMuted,
    setMuted,
    emotions,
    dominantEmotion,
    transcript,
    sessionId,
    error,
    persona,
  };
}

// ─── Teacher-specific hook ───────────────────────────────────────────────────

export interface UseHumeTeacherOptions {
  teacherName: string;
  language: string;
  dialect?: string;
  level?: "beginner" | "intermediate" | "advanced";
  lessonTopic?: string;
  scenarioType?: string;
  customContext?: string;
  onMessage?: (message: HumeMessage) => void;
  onEmotions?: (emotions: EmotionScore[]) => void;
  onError?: (error: string) => void;
  onConnected?: () => void;
  onDisconnected?: () => void;
}

export function useHumeTeacher(options: UseHumeTeacherOptions) {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isMuted, setIsMutedState] = useState(false);
  const [emotions, setEmotions] = useState<EmotionScore[]>([]);
  const [transcript, setTranscript] = useState<HumeMessage[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const sessionIdRef = useRef<string | null>(null);
  const audioPlayerRef = useRef<WebAudioPlayer | null>(null);
  const micCaptureRef = useRef<WebMicCapture | null>(null);

  const startTeacherSession = trpc.hume.startTeacherSession.useMutation();
  const reportEmotions = trpc.hume.reportEmotions.useMutation();
  const endSession = trpc.hume.endSession.useMutation();

  const setMuted = useCallback((muted: boolean) => {
    setIsMutedState(muted);
    micCaptureRef.current?.setMuted(muted);
  }, []);

  const connect = useCallback(async () => {
    if (isConnected || isConnecting) return;
    setIsConnecting(true);
    setError(null);

    try {
      const result = await startTeacherSession.mutateAsync({
        teacherName: options.teacherName,
        language: options.language,
        dialect: options.dialect,
        level: options.level || "intermediate",
        lessonTopic: options.lessonTopic,
        scenarioType: options.scenarioType,
        customContext: options.customContext,
      });

      if (!result.success) {
        throw new Error(result.error || "Failed to start teacher session");
      }

      const { accessToken, configId, sessionId: sid, websocketUrl } = result;
      setSessionId(sid);
      sessionIdRef.current = sid;

      // Initialize audio player
      if (Platform.OS === "web") {
        const player = new WebAudioPlayer();
        player.init();
        audioPlayerRef.current = player;
      }

      const wsUrl = configId
        ? `${websocketUrl}?access_token=${accessToken}&config_id=${configId}`
        : `${websocketUrl}?access_token=${accessToken}`;

      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = async () => {
        setIsConnected(true);
        setIsConnecting(false);
        options.onConnected?.();

        // Start mic capture on web
        if (Platform.OS === "web") {
          const mic = new WebMicCapture();
          micCaptureRef.current = mic;
          await mic.start((base64Audio) => {
            if (ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify({ type: "audio_input", data: base64Audio }));
            }
          });
        }
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === "user_message") {
            const userMsg: HumeMessage = {
              role: "user",
              content: msg.message?.content || "",
              emotions: msg.models?.prosody?.scores
                ? Object.entries(msg.models.prosody.scores)
                    .map(([name, score]) => ({ name, score: score as number }))
                    .sort((a, b) => b.score - a.score)
                    .slice(0, 10)
                : undefined,
              timestamp: Date.now(),
            };
            setTranscript((prev) => [...prev, userMsg]);
            options.onMessage?.(userMsg);
            if (userMsg.emotions?.length) {
              setEmotions(userMsg.emotions);
              options.onEmotions?.(userMsg.emotions);
            }
          } else if (msg.type === "assistant_message") {
            const assistantMsg: HumeMessage = {
              role: "assistant",
              content: msg.message?.content || "",
              timestamp: Date.now(),
            };
            setTranscript((prev) => [...prev, assistantMsg]);
            options.onMessage?.(assistantMsg);
          } else if (msg.type === "audio_output" && msg.data && audioPlayerRef.current) {
            audioPlayerRef.current.play(msg.data);
          } else if (msg.type === "user_interruption") {
            audioPlayerRef.current?.stop();
          }
        } catch (e) {
          // ignore parse errors
        }
      };

      ws.onerror = () => {
        setError("Connection error");
        options.onError?.("WebSocket error");
      };

      ws.onclose = () => {
        setIsConnected(false);
        setIsConnecting(false);
        wsRef.current = null;
        micCaptureRef.current?.stop();
        micCaptureRef.current = null;
        audioPlayerRef.current?.stop();
        options.onDisconnected?.();
      };
    } catch (err: any) {
      setIsConnecting(false);
      setError(err.message);
      options.onError?.(err.message);
    }
  }, [isConnected, isConnecting, options, startTeacherSession]);

  const disconnect = useCallback(() => {
    micCaptureRef.current?.stop();
    micCaptureRef.current = null;
    audioPlayerRef.current?.destroy();
    audioPlayerRef.current = null;
    wsRef.current?.close();
    wsRef.current = null;
    if (sessionIdRef.current) {
      endSession.mutate({ sessionId: sessionIdRef.current });
      sessionIdRef.current = null;
    }
    setIsConnected(false);
    setIsConnecting(false);
    setSessionId(null);
  }, [endSession]);

  useEffect(() => {
    return () => {
      micCaptureRef.current?.stop();
      audioPlayerRef.current?.destroy();
      wsRef.current?.close();
    };
  }, []);

  return { connect, disconnect, isConnected, isConnecting, isMuted, setMuted, emotions, transcript, sessionId, error };
}

// ─── Surprise Call hook ──────────────────────────────────────────────────────

export function useHumeSurpriseCall(options: {
  language: string;
  dialect?: string;
  difficulty?: "easy" | "medium" | "hard";
  onMessage?: (message: HumeMessage) => void;
  onEmotions?: (emotions: EmotionScore[]) => void;
  onConnected?: () => void;
  onDisconnected?: () => void;
}) {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isMuted, setIsMutedState] = useState(false);
  const [scenario, setScenario] = useState<string | null>(null);
  const [transcript, setTranscript] = useState<HumeMessage[]>([]);
  const [error, setError] = useState<string | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const startSurpriseCall = trpc.hume.startSurpriseCall.useMutation();
  const endSession = trpc.hume.endSession.useMutation();
  const sessionIdRef = useRef<string | null>(null);
  const audioPlayerRef = useRef<WebAudioPlayer | null>(null);
  const micCaptureRef = useRef<WebMicCapture | null>(null);

  const setMuted = useCallback((muted: boolean) => {
    setIsMutedState(muted);
    micCaptureRef.current?.setMuted(muted);
  }, []);

  const connect = useCallback(async () => {
    if (isConnected || isConnecting) return;
    setIsConnecting(true);
    setError(null);

    try {
      const result = await startSurpriseCall.mutateAsync({
        language: options.language,
        dialect: options.dialect,
        difficulty: options.difficulty || "medium",
      });

      if (!result.success) throw new Error(result.error);

      const { accessToken, configId, sessionId, websocketUrl } = result;
      sessionIdRef.current = sessionId;
      setScenario(result.scenario || null);

      // Initialize audio
      if (Platform.OS === "web") {
        const player = new WebAudioPlayer();
        player.init();
        audioPlayerRef.current = player;
      }

      const wsUrl = configId
        ? `${websocketUrl}?access_token=${accessToken}&config_id=${configId}`
        : `${websocketUrl}?access_token=${accessToken}`;

      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = async () => {
        setIsConnected(true);
        setIsConnecting(false);
        options.onConnected?.();

        if (Platform.OS === "web") {
          const mic = new WebMicCapture();
          micCaptureRef.current = mic;
          await mic.start((base64Audio) => {
            if (ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify({ type: "audio_input", data: base64Audio }));
            }
          });
        }
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === "user_message" || msg.type === "assistant_message") {
            const humeMsg: HumeMessage = {
              role: msg.type === "user_message" ? "user" : "assistant",
              content: msg.message?.content || "",
              timestamp: Date.now(),
            };
            setTranscript((prev) => [...prev, humeMsg]);
            options.onMessage?.(humeMsg);
          } else if (msg.type === "audio_output" && msg.data && audioPlayerRef.current) {
            audioPlayerRef.current.play(msg.data);
          } else if (msg.type === "user_interruption") {
            audioPlayerRef.current?.stop();
          }
        } catch {}
      };
      ws.onerror = () => { setError("Connection error"); };
      ws.onclose = () => {
        setIsConnected(false);
        setIsConnecting(false);
        micCaptureRef.current?.stop();
        micCaptureRef.current = null;
        audioPlayerRef.current?.stop();
        options.onDisconnected?.();
      };
    } catch (err: any) {
      setIsConnecting(false);
      setError(err.message);
    }
  }, [isConnected, isConnecting, options, startSurpriseCall]);

  const disconnect = useCallback(() => {
    micCaptureRef.current?.stop();
    micCaptureRef.current = null;
    audioPlayerRef.current?.destroy();
    audioPlayerRef.current = null;
    wsRef.current?.close();
    if (sessionIdRef.current) endSession.mutate({ sessionId: sessionIdRef.current });
    setIsConnected(false);
    setIsConnecting(false);
  }, [endSession]);

  useEffect(() => {
    return () => {
      micCaptureRef.current?.stop();
      audioPlayerRef.current?.destroy();
      wsRef.current?.close();
    };
  }, []);

  return { connect, disconnect, isConnected, isConnecting, isMuted, setMuted, scenario, transcript, error };
}
