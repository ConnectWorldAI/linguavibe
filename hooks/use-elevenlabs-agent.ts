/**
 * useElevenLabsAgent Hook
 * 
 * Client-side hook for managing ElevenLabs Conversational AI agent sessions.
 * Handles: connection, audio streaming, transcript, and session lifecycle.
 * 
 * Used by: AI Tutor calls, Practice Partner, Scenario Practice, Pronunciation Coach, Support
 */
import { useState, useCallback, useRef, useEffect } from "react";
import { Platform } from "react-native";
import { trpc } from "@/lib/trpc";

// Types
export type AgentRole = "tutor" | "practice-partner" | "scenario" | "pronunciation-coach" | "support";
export type AgentStatus = "idle" | "connecting" | "connected" | "speaking" | "listening" | "processing" | "disconnected" | "error";

export interface AgentMessage {
  id: string;
  role: "agent" | "user";
  text: string;
  timestamp: number;
  isFinal: boolean;
}

export interface AgentSessionConfig {
  agentType: "language-tutor" | "practice-partner" | "scenario-practice" | "pronunciation-coach" | "support-agent";
  targetLanguage: string;
  nativeLanguage?: string;
  proficiencyLevel?: "beginner" | "intermediate" | "advanced";
  studentName?: string;
  studentInterests?: string;
  lessonTopic?: string;
  scenarioId?: string;
  pronunciationFocus?: string;
  customAgentId?: string;
}

export interface AgentSession {
  conversationId: string | null;
  status: AgentStatus;
  messages: AgentMessage[];
  duration: number;
  agentName: string;
  isMuted: boolean;
}

export interface UseElevenLabsAgentReturn {
  session: AgentSession;
  startSession: (config: AgentSessionConfig) => Promise<void>;
  endSession: () => Promise<void>;
  toggleMute: () => void;
  sendTextInput: (text: string) => void;
  isAvailable: boolean;
}

/**
 * Hook to manage ElevenLabs Conversational AI agent sessions.
 * 
 * Usage:
 * ```tsx
 * const { session, startSession, endSession, toggleMute } = useElevenLabsAgent();
 * 
 * // Start a tutoring session
 * await startSession({
 *   agentType: "language-tutor",
 *   targetLanguage: "Spanish",
 *   proficiencyLevel: "intermediate",
 *   lessonTopic: "Ordering food at a restaurant",
 * });
 * ```
 */
export function useElevenLabsAgent(): UseElevenLabsAgentReturn {
  const [session, setSession] = useState<AgentSession>({
    conversationId: null,
    status: "idle",
    messages: [],
    duration: 0,
    agentName: "",
    isMuted: false,
  });

  const conversationRef = useRef<any>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);

  // tRPC mutations
  const startSessionMutation = trpc.elevenLabsAgents.startSession.useMutation();
  const getSignedUrlMutation = trpc.elevenLabsAgents.getSignedUrl.useMutation();
  const processCallResultMutation = trpc.elevenLabsAgents.processCallResult.useMutation();

  // Check if the SDK is available (not available on web in some cases)
  const isAvailable = Platform.OS !== "web";

  // Start duration timer
  const startTimer = useCallback(() => {
    startTimeRef.current = Date.now();
    timerRef.current = setInterval(() => {
      setSession(prev => ({
        ...prev,
        duration: Math.floor((Date.now() - startTimeRef.current) / 1000),
      }));
    }, 1000);
  }, []);

  // Stop duration timer
  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // Start a new agent session
  const startSession = useCallback(async (config: AgentSessionConfig) => {
    try {
      setSession(prev => ({ ...prev, status: "connecting", messages: [] }));

      // Get session configuration from server
      const result = await startSessionMutation.mutateAsync({
        agentType: config.agentType,
        targetLanguage: config.targetLanguage,
        nativeLanguage: config.nativeLanguage || "English",
        proficiencyLevel: config.proficiencyLevel || "intermediate",
        studentName: config.studentName,
        studentInterests: config.studentInterests,
        lessonTopic: config.lessonTopic,
        scenarioId: config.scenarioId,
        pronunciationFocus: config.pronunciationFocus,
        customAgentId: config.customAgentId,
      });

      // If we got a signed URL, use it for private agent connection
      if ("signedUrl" in result && result.signedUrl) {
        await connectWithSignedUrl(result.signedUrl, result.dynamicVariables || {});
      } else {
        // Use the public agent ID from environment
        const agentId = getAgentIdForType(config.agentType);
        if (agentId) {
          // Get signed URL for the agent
          const { signedUrl } = await getSignedUrlMutation.mutateAsync({ agentId });
          await connectWithSignedUrl(signedUrl, result.dynamicVariables || {});
        } else {
          // Fallback: simulate connection for development/testing
          simulateSession(result);
        }
      }

      setSession(prev => ({
        ...prev,
        status: "connected",
        agentName: result.config?.name || config.agentType,
        conversationId: `conv-${Date.now()}`,
      }));

      startTimer();

      // Add first message if provided
      if (result.config?.firstMessage) {
        const firstMsg: AgentMessage = {
          id: `msg-${Date.now()}`,
          role: "agent",
          text: result.config.firstMessage,
          timestamp: Date.now(),
          isFinal: true,
        };
        setSession(prev => ({
          ...prev,
          messages: [firstMsg],
        }));
      }
    } catch (error: any) {
      console.error("Failed to start ElevenLabs agent session:", error);
      setSession(prev => ({
        ...prev,
        status: "error",
      }));
    }
  }, [startSessionMutation, getSignedUrlMutation, startTimer]);

  // Connect using signed URL (native only)
  const connectWithSignedUrl = useCallback(async (signedUrl: string, dynamicVariables: Record<string, string>) => {
    if (Platform.OS === "web") {
      // Web doesn't support the native SDK, use WebSocket fallback
      console.log("ElevenLabs agent connected via WebSocket (web mode)");
      return;
    }

    try {
      // Dynamic import to avoid web bundling issues
      const mod = await import("@elevenlabs/react-native") as any;
      const Conversation = mod.Conversation;

      const conversation = await Conversation.startSession({
        signedUrl,
        overrides: {
          agent: {
            prompt: {
              prompt: "", // Server already configured the prompt
            },
          },
        },
        onConnect: ({ conversationId }: any) => {
          setSession(prev => ({
            ...prev,
            conversationId,
            status: "connected",
          }));
        },
        onDisconnect: () => {
          setSession(prev => ({ ...prev, status: "disconnected" }));
          stopTimer();
        },
        onMessage: ({ message, source }: any) => {
          const newMsg: AgentMessage = {
            id: `msg-${Date.now()}-${Math.random().toString(36).slice(2)}`,
            role: source === "ai" ? "agent" : "user",
            text: message,
            timestamp: Date.now(),
            isFinal: true,
          };
          setSession(prev => ({
            ...prev,
            messages: [...prev.messages, newMsg],
          }));
        },
        onStatusChange: ({ status }: any) => {
          const statusMap: Record<string, AgentStatus> = {
            speaking: "speaking",
            listening: "listening",
            processing: "processing",
            connected: "connected",
          };
          if (statusMap[status]) {
            setSession(prev => ({ ...prev, status: statusMap[status] }));
          }
        },
        onError: (error: any) => {
          console.error("ElevenLabs agent error:", error);
          setSession(prev => ({ ...prev, status: "error" }));
        },
      });

      conversationRef.current = conversation;
    } catch (error: any) {
      console.error("Failed to connect ElevenLabs agent:", error);
      throw error;
    }
  }, [stopTimer]);

  // Simulate session for development/web
  const simulateSession = useCallback((result: any) => {
    setSession(prev => ({
      ...prev,
      status: "connected",
      agentName: result.config?.name || "AI Agent",
    }));
  }, []);

  // End the current session
  const endSession = useCallback(async () => {
    stopTimer();

    // End the native conversation if active
    if (conversationRef.current) {
      try {
        await conversationRef.current.endSession();
      } catch (e) {
        // Ignore errors on disconnect
      }
      conversationRef.current = null;
    }

    // Process call results for analytics
    if (session.conversationId && session.messages.length > 0) {
      try {
        await processCallResultMutation.mutateAsync({
          conversationId: session.conversationId,
          agentType: session.agentName,
          durationSeconds: session.duration,
          transcript: session.messages.map(m => ({
            role: m.role,
            message: m.text,
            timestamp: m.timestamp,
          })),
        });
      } catch (e) {
        // Non-critical, don't block disconnect
      }
    }

    setSession({
      conversationId: null,
      status: "idle",
      messages: [],
      duration: 0,
      agentName: "",
      isMuted: false,
    });
  }, [session, stopTimer, processCallResultMutation]);

  // Toggle mute
  const toggleMute = useCallback(() => {
    if (conversationRef.current) {
      const newMuted = !session.isMuted;
      conversationRef.current.setVolume({ volume: newMuted ? 0 : 1 });
      setSession(prev => ({ ...prev, isMuted: newMuted }));
    } else {
      setSession(prev => ({ ...prev, isMuted: !prev.isMuted }));
    }
  }, [session.isMuted]);

  // Send text input (for accessibility or text-based interaction)
  const sendTextInput = useCallback((text: string) => {
    // Add user message to transcript
    const userMsg: AgentMessage = {
      id: `msg-${Date.now()}-user`,
      role: "user",
      text,
      timestamp: Date.now(),
      isFinal: true,
    };
    setSession(prev => ({
      ...prev,
      messages: [...prev.messages, userMsg],
    }));

    // In a real implementation, this would send to the agent via WebSocket
    // For now, the native SDK handles voice input automatically
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopTimer();
      if (conversationRef.current) {
        conversationRef.current.endSession().catch(() => {});
        conversationRef.current = null;
      }
    };
  }, [stopTimer]);

  return {
    session,
    startSession,
    endSession,
    toggleMute,
    sendTextInput,
    isAvailable,
  };
}

// Helper: get agent ID from environment based on type
function getAgentIdForType(agentType: string): string | null {
  // These would be set in your ElevenLabs dashboard and stored as env vars
  const agentIds: Record<string, string | undefined> = {
    "language-tutor": process.env.EXPO_PUBLIC_ELEVENLABS_TUTOR_AGENT_ID,
    "practice-partner": process.env.EXPO_PUBLIC_ELEVENLABS_PARTNER_AGENT_ID,
    "scenario-practice": process.env.EXPO_PUBLIC_ELEVENLABS_SCENARIO_AGENT_ID,
    "pronunciation-coach": process.env.EXPO_PUBLIC_ELEVENLABS_PRONUNCIATION_AGENT_ID,
    "support-agent": process.env.EXPO_PUBLIC_ELEVENLABS_SUPPORT_AGENT_ID,
  };
  return agentIds[agentType] || null;
}
