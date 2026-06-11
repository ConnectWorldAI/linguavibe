/**
 * ElevenLabs Agent Call Screen
 * 
 * Full-screen voice call interface for ElevenLabs Conversational AI agents.
 * Used by: AI Tutors, Practice Partners, Scenario Practice, Pronunciation Coach, Support
 * 
 * Features:
 * - Real-time voice conversation with AI agent
 * - Live transcript display
 * - Call controls (mute, speaker, end)
 * - Session analytics (duration, words learned)
 * - Animated speaking indicator
 * - Post-call summary
 */
import { useEffect, useState, useCallback, useRef } from "react";
import { View, Text, ScrollView, Pressable, Platform, StyleSheet, Dimensions, TouchableOpacity, Modal } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useElevenLabsAgent, type AgentSessionConfig, type AgentMessage } from "@/hooks/use-elevenlabs-agent";
import { useColors } from "@/hooks/use-colors";
import { getStudentName, getTeacherMemoryContext } from "@/lib/teacher-memory";
import { usePip } from "@/lib/pip-context";
import { useUsage } from "@/lib/usage-context";
import { PaywallModal, type PaywallFeature } from "@/components/paywall-modal";
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, withSequence, Easing } from "react-native-reanimated";
import { IconSymbol } from "@/components/ui/icon-symbol";
import * as Haptics from "expo-haptics";
import { markTodayAsPracticed } from "@/lib/streak-notifications";
import { markPracticeAndToast } from "@/lib/streak-practice-helper";

const { width } = Dimensions.get("window");

type AgentCallMode = "tutor" | "practice-partner" | "scenario" | "pronunciation" | "support";

export default function AgentCallScreen() {
  const router = useRouter();
  const colors = useColors();
  const { minimizeCall } = usePip();
  const params = useLocalSearchParams<{
    mode: AgentCallMode;
    language?: string;
    nativeLanguage?: string;
    level?: string;
    teacherName?: string;
    topic?: string;
    scenarioId?: string;
    pronunciationFocus?: string;
    agentId?: string;
  }>();

  const mode = (params.mode || "tutor") as AgentCallMode;
  const { session, startSession, endSession, toggleMute, isAvailable } = useElevenLabsAgent();

  const [showTranscript, setShowTranscript] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  // Usage tracking
  const { isLimitReached, incrementUsage , showStreakToast } = useUsage();

  // Animated speaking indicator
  const pulseScale = useSharedValue(1);
  const pulseOpacity = useSharedValue(0.3);

  useEffect(() => {
    if (session.status === "speaking") {
      pulseScale.value = withRepeat(
        withSequence(
          withTiming(1.3, { duration: 600, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 600, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );
      pulseOpacity.value = withRepeat(
        withSequence(
          withTiming(0.6, { duration: 600 }),
          withTiming(0.2, { duration: 600 })
        ),
        -1,
        true
      );
    } else {
      pulseScale.value = withTiming(1, { duration: 300 });
      pulseOpacity.value = withTiming(0.3, { duration: 300 });
    }
  }, [session.status]);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
    opacity: pulseOpacity.value,
  }));

  // Start the session on mount
  useEffect(() => {
    const initSession = async () => {
      const studentName = await getStudentName();
      const memoryContext = await getTeacherMemoryContext();
      const config: AgentSessionConfig = {
        agentType: getAgentType(mode),
        targetLanguage: params.language || "Spanish",
        nativeLanguage: params.nativeLanguage || "English",
        proficiencyLevel: (params.level as any) || "intermediate",
        studentName: studentName || undefined,
        studentInterests: (params as any).interests,
        lessonTopic: params.topic ? `${params.topic}\n\nSTUDENT MEMORY: ${memoryContext}` : `General practice\n\nSTUDENT MEMORY: ${memoryContext}`,
        scenarioId: params.scenarioId,
        pronunciationFocus: params.pronunciationFocus,
        customAgentId: params.agentId,
      };
      startSession(config);
    };
    initSession();

    return () => {
      // Cleanup handled by the hook
    };
  }, []);

  // Auto-scroll transcript
  useEffect(() => {
    if (showTranscript && scrollRef.current) {
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [session.messages, showTranscript]);

  // Handle end call
  const handleEndCall = useCallback(async () => {
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }
    await endSession();
    setShowSummary(true);
    markPracticeAndToast(showStreakToast);
  }, [endSession]);

  // Handle minimize to PiP
  const handleMinimize = useCallback(() => {
    minimizeCall("agent" as any, getAgentTitle(mode), params.language || "Spanish");
    router.back();
  }, [mode, params.language]);

  // Format duration
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Get status text
  const getStatusText = () => {
    switch (session.status) {
      case "connecting": return "Connecting...";
      case "connected": return "Connected";
      case "speaking": return "Speaking...";
      case "listening": return "Listening...";
      case "processing": return "Thinking...";
      case "disconnected": return "Disconnected";
      case "error": return "Connection Error";
      default: return "";
    }
  };

  // Get accent color based on mode
  const getAccentColor = () => {
    switch (mode) {
      case "tutor": return "#7C3AED";
      case "practice-partner": return "#00AAFF";
      case "scenario": return "#F59E0B";
      case "pronunciation": return "#22C55E";
      case "support": return "#6366F1";
      default: return "#7C3AED";
    }
  };

  const accentColor = getAccentColor();

  return (
    <ScreenContainer edges={["top", "bottom", "left", "right"]} containerClassName="bg-[#0D0F14]">
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleMinimize} style={styles.minimizeBtn}>
            <IconSymbol name="chevron.right" size={20} color="#9BA1A6" />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>{getAgentTitle(mode)}</Text>
            <Text style={[styles.headerStatus, { color: accentColor }]}>{getStatusText()}</Text>
          </View>
          <Text style={styles.duration}>{formatDuration(session.duration)}</Text>
        </View>

        {/* Agent Avatar Area */}
        <View style={styles.avatarArea}>
          <Animated.View style={[styles.pulseRing, { borderColor: accentColor }, pulseStyle]} />
          <View style={[styles.avatarCircle, { backgroundColor: accentColor + "20", borderColor: accentColor }]}>
            <Text style={styles.avatarEmoji}>{getAgentEmoji(mode)}</Text>
          </View>
          <Text style={styles.agentName}>{session.agentName || getAgentTitle(mode)}</Text>
          <Text style={styles.agentLanguage}>{params.language || "Spanish"} • {params.level || "Intermediate"}</Text>
        </View>

        {/* Transcript (toggleable) */}
        {showTranscript && (
          <View style={styles.transcriptArea}>
            <ScrollView ref={scrollRef} style={styles.transcriptScroll} showsVerticalScrollIndicator={false}>
              {session.messages.map((msg) => (
                <View key={msg.id} style={[styles.messageBubble, msg.role === "user" ? styles.userBubble : styles.agentBubble]}>
                  <Text style={[styles.messageText, msg.role === "user" && styles.userMessageText]}>
                    {msg.text}
                  </Text>
                </View>
              ))}
              {session.messages.length === 0 && (
                <Text style={styles.transcriptEmpty}>Conversation will appear here...</Text>
              )}
            </ScrollView>
          </View>
        )}

        {/* Call Controls */}
        <View style={styles.controls}>
          {/* Top row: secondary controls */}
          <View style={styles.secondaryControls}>
            <TouchableOpacity
              style={[styles.secondaryBtn, showTranscript && styles.secondaryBtnActive]}
              onPress={() => setShowTranscript(!showTranscript)}
            >
              <Text style={styles.secondaryBtnIcon}>📝</Text>
              <Text style={styles.secondaryBtnLabel}>Transcript</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryBtn} onPress={handleMinimize}>
              <Text style={styles.secondaryBtnIcon}>🔲</Text>
              <Text style={styles.secondaryBtnLabel}>Minimize</Text>
            </TouchableOpacity>
          </View>

          {/* Main controls */}
          <View style={styles.mainControls}>
            <TouchableOpacity
              style={[styles.controlBtn, session.isMuted && styles.controlBtnActive]}
              onPress={() => {
                toggleMute();
                if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
            >
              <Text style={styles.controlIcon}>{session.isMuted ? "🔇" : "🎤"}</Text>
              <Text style={styles.controlLabel}>{session.isMuted ? "Unmute" : "Mute"}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.endCallBtn} onPress={handleEndCall}>
              <Text style={styles.endCallIcon}>📞</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.controlBtn}>
              <Text style={styles.controlIcon}>🔊</Text>
              <Text style={styles.controlLabel}>Speaker</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Post-Call Summary Modal */}
        <Modal visible={showSummary} animationType="slide" transparent>
          <View style={styles.summaryOverlay}>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>Session Complete 🎉</Text>
              <View style={styles.summaryStats}>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{formatDuration(session.duration)}</Text>
                  <Text style={styles.statLabel}>Duration</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{session.messages.length}</Text>
                  <Text style={styles.statLabel}>Exchanges</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{Math.floor(session.messages.filter(m => m.role === "user").length * 2.5)}</Text>
                  <Text style={styles.statLabel}>Words Practiced</Text>
                </View>
              </View>
              <TouchableOpacity
                style={[styles.summaryBtn, { backgroundColor: accentColor }]}
                onPress={() => { setShowSummary(false); router.back(); }}
              >
                <Text style={styles.summaryBtnText}>Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Paywall Modal */}
        <PaywallModal
          visible={showPaywall}
          feature={"cloudwave" as PaywallFeature}
          onClose={() => setShowPaywall(false)}
        />
      </View>
    </ScreenContainer>
  );
}

// Helper functions
function getAgentType(mode: AgentCallMode): AgentSessionConfig["agentType"] {
  const map: Record<AgentCallMode, AgentSessionConfig["agentType"]> = {
    "tutor": "language-tutor",
    "practice-partner": "practice-partner",
    "scenario": "scenario-practice",
    "pronunciation": "pronunciation-coach",
    "support": "support-agent",
  };
  return map[mode];
}

function getAgentTitle(mode: AgentCallMode): string {
  const map: Record<AgentCallMode, string> = {
    "tutor": "AI Tutor",
    "practice-partner": "Practice Partner",
    "scenario": "Scenario Practice",
    "pronunciation": "Pronunciation Coach",
    "support": "Support",
  };
  return map[mode];
}

function getAgentEmoji(mode: AgentCallMode): string {
  const map: Record<AgentCallMode, string> = {
    "tutor": "👩‍🏫",
    "practice-partner": "🗣️",
    "scenario": "🎭",
    "pronunciation": "🎯",
    "support": "💬",
  };
  return map[mode];
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0D0F14",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  minimizeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#1C1F2B",
    alignItems: "center",
    justifyContent: "center",
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  headerStatus: {
    fontSize: 12,
    marginTop: 2,
  },
  duration: {
    fontSize: 14,
    fontWeight: "500",
    color: "#9BA1A6",
  },
  avatarArea: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: 40,
  },
  pulseRing: {
    position: "absolute",
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 2,
  },
  avatarCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
  },
  avatarEmoji: {
    fontSize: 48,
  },
  agentName: {
    fontSize: 20,
    fontWeight: "700",
    color: "#FFFFFF",
    marginTop: 16,
  },
  agentLanguage: {
    fontSize: 14,
    color: "#9BA1A6",
    marginTop: 4,
  },
  transcriptArea: {
    maxHeight: 200,
    marginHorizontal: 20,
    marginBottom: 16,
    backgroundColor: "#1C1F2B",
    borderRadius: 16,
    padding: 12,
  },
  transcriptScroll: {
    flex: 1,
  },
  messageBubble: {
    maxWidth: "80%",
    padding: 10,
    borderRadius: 12,
    marginBottom: 8,
  },
  agentBubble: {
    alignSelf: "flex-start",
    backgroundColor: "#242838",
  },
  userBubble: {
    alignSelf: "flex-end",
    backgroundColor: "#7C3AED",
  },
  messageText: {
    fontSize: 14,
    color: "#FFFFFF",
    lineHeight: 20,
  },
  userMessageText: {
    color: "#FFFFFF",
  },
  transcriptEmpty: {
    fontSize: 14,
    color: "#687076",
    textAlign: "center",
    marginTop: 20,
  },
  controls: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  secondaryControls: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 24,
    marginBottom: 24,
  },
  secondaryBtn: {
    alignItems: "center",
    gap: 4,
  },
  secondaryBtnActive: {
    opacity: 1,
  },
  secondaryBtnIcon: {
    fontSize: 24,
  },
  secondaryBtnLabel: {
    fontSize: 11,
    color: "#9BA1A6",
  },
  mainControls: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 40,
  },
  controlBtn: {
    alignItems: "center",
    gap: 6,
  },
  controlBtnActive: {
    opacity: 0.6,
  },
  controlIcon: {
    fontSize: 28,
    width: 56,
    height: 56,
    lineHeight: 56,
    textAlign: "center",
    backgroundColor: "#1C1F2B",
    borderRadius: 28,
    overflow: "hidden",
  },
  controlLabel: {
    fontSize: 11,
    color: "#9BA1A6",
  },
  endCallBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#EF4444",
    alignItems: "center",
    justifyContent: "center",
  },
  endCallIcon: {
    fontSize: 28,
    transform: [{ rotate: "135deg" }],
  },
  summaryOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.8)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  summaryCard: {
    width: "100%",
    backgroundColor: "#1C1F2B",
    borderRadius: 24,
    padding: 32,
    alignItems: "center",
  },
  summaryTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 24,
  },
  summaryStats: {
    flexDirection: "row",
    gap: 32,
    marginBottom: 32,
  },
  statItem: {
    alignItems: "center",
  },
  statValue: {
    fontSize: 24,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  statLabel: {
    fontSize: 12,
    color: "#9BA1A6",
    marginTop: 4,
  },
  summaryBtn: {
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
  },
  summaryBtnText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
});
