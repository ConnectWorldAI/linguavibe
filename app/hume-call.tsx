/**
 * Hume Voice Call Screen
 * 
 * Full-screen voice call interface for Hume EVI conversations.
 * Used by: AI Teachers, CloudWave, Surprise Calls, Pronunciation Coach
 * 
 * Features:
 * - Animated waveform visualization
 * - Real-time emotion display
 * - Live transcript
 * - Call controls (mute, speaker, end)
 */

import { useEffect, useState, useCallback, useRef } from "react";
import { View, Text, ScrollView, Pressable, Platform, StyleSheet } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useHumeVoice, useHumeTeacher, useHumeSurpriseCall, type HumeMessage, type EmotionScore } from "@/hooks/use-hume-voice";
import { useColors } from "@/hooks/use-colors";
import { usePip } from "@/lib/pip-context";
import { useUsage } from "@/lib/usage-context";
import { PaywallModal, type PaywallFeature } from "@/components/paywall-modal";
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, withSequence, Easing } from "react-native-reanimated";
import { IconSymbol } from "@/components/ui/icon-symbol";
import * as Haptics from "expo-haptics";
import { getStudentName, getTeacherMemoryContext } from "@/lib/teacher-memory";
import { markTodayAsPracticed } from "@/lib/streak-notifications";
import { markPracticeAndToast } from "@/lib/streak-practice-helper";
import { trackCallCompleted } from "@/lib/analytics";
import AsyncStorage from "@react-native-async-storage/async-storage";

type CallMode = "teacher" | "cloudwave" | "surprise" | "pronunciation" | "translator" | "classroom";

export default function HumeCallScreen() {
  const router = useRouter();
  const colors = useColors();
  const { minimizeCall } = usePip();
  const params = useLocalSearchParams<{
    mode: CallMode;
    persona?: string;
    language?: string;
    dialect?: string;
    level?: string;
    teacherName?: string;
    topic?: string;
    scenario?: string;
  }>();

  const mode = (params.mode || "cloudwave") as CallMode;
  const [callDuration, setCallDuration] = useState(0);
  const [localMuted, setLocalMuted] = useState(false);
  const [isSpeaker, setIsSpeaker] = useState(false);
  const [showTranscript, setShowTranscript] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const [paywallFeature, setPaywallFeature] = useState<PaywallFeature>("cloudwave");
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const scrollRef = useRef<ScrollView>(null);
  const hasShownPaywall = useRef(false);
  
  // Usage tracking
  const { isLimitReached, incrementUsage , showStreakToast } = useUsage();
  
  // Free tier time limits (in seconds)
  const FREE_CLOUDWAVE_LIMIT = 5 * 60; // 5 minutes
  const FREE_TEACHER_LIMIT = 10 * 60; // 10 minutes (1 sample session)

  // Load teacher memory context for personalization
  const [memoryContext, setMemoryContext] = useState<string>("");
  const [studentName, setStudentName] = useState<string>("");
  useEffect(() => {
    (async () => {
      const [name, ctx] = await Promise.all([getStudentName(), getTeacherMemoryContext()]);
      setStudentName(name);
      setMemoryContext(ctx);
    })();
  }, []);

  // Determine which hook to use based on mode
  const teacherHook = useHumeTeacher({
    teacherName: params.teacherName || "Teacher",
    language: params.language || "Spanish",
    dialect: params.dialect,
    level: (params.level as any) || "intermediate",
    lessonTopic: params.topic,
    customContext: memoryContext ? `Student name: ${studentName}. ${memoryContext}` : undefined,
  });

  const voiceHook = useHumeVoice({
    persona: params.persona || "cloudwave",
    language: params.language,
    dialect: params.dialect,
    studentLevel: params.level,
    customContext: memoryContext ? `Student name: ${studentName}. ${memoryContext}` : undefined,
  });

  const surpriseHook = useHumeSurpriseCall({
    language: params.language || "Spanish",
    dialect: params.dialect,
    difficulty: (params.level as any) || "medium",
  });

  // Select the active hook based on mode
  const activeHook = mode === "teacher" || mode === "pronunciation" || mode === "classroom"
    ? teacherHook
    : mode === "surprise"
    ? surpriseHook
    : voiceHook;

  const { connect, disconnect, isConnected, isConnecting, transcript, error } = activeHook;
  const emotions = "emotions" in activeHook ? (activeHook as any).emotions : [];
  const hookSetMuted = "setMuted" in activeHook ? (activeHook as any).setMuted : null;
  const hookIsMuted = "isMuted" in activeHook ? (activeHook as any).isMuted : false;

  // Animation values for the waveform
  const wave1 = useSharedValue(0.3);
  const wave2 = useSharedValue(0.5);
  const wave3 = useSharedValue(0.7);
  const wave4 = useSharedValue(0.4);
  const wave5 = useSharedValue(0.6);
  const pulseScale = useSharedValue(1);

  // Start animations when connected
  useEffect(() => {
    if (isConnected) {
      wave1.value = withRepeat(withSequence(
        withTiming(0.9, { duration: 400, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.3, { duration: 500, easing: Easing.inOut(Easing.ease) })
      ), -1, true);
      wave2.value = withRepeat(withSequence(
        withTiming(1, { duration: 350, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.4, { duration: 450, easing: Easing.inOut(Easing.ease) })
      ), -1, true);
      wave3.value = withRepeat(withSequence(
        withTiming(0.8, { duration: 500, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.2, { duration: 400, easing: Easing.inOut(Easing.ease) })
      ), -1, true);
      wave4.value = withRepeat(withSequence(
        withTiming(0.95, { duration: 300, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.35, { duration: 550, easing: Easing.inOut(Easing.ease) })
      ), -1, true);
      wave5.value = withRepeat(withSequence(
        withTiming(0.85, { duration: 450, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.25, { duration: 350, easing: Easing.inOut(Easing.ease) })
      ), -1, true);
      pulseScale.value = withRepeat(
        withSequence(
          withTiming(1.05, { duration: 1000 }),
          withTiming(1, { duration: 1000 })
        ), -1, true
      );
    }
  }, [isConnected]);

  // Auto-connect on mount
  useEffect(() => {
    connect();
    return () => { disconnect(); };
  }, []);

  // Call timer with free tier enforcement
  useEffect(() => {
    if (isConnected) {
      timerRef.current = setInterval(() => {
        setCallDuration((d) => {
          const newDuration = d + 1;
          // Track usage every minute
          if (newDuration % 60 === 0) {
            const category = (mode === "teacher" || mode === "pronunciation" || mode === "classroom") ? "teacher" : "talk";
            incrementUsage(category, 1);
          }
          // Check free tier limit
          const limit = (mode === "teacher" || mode === "pronunciation" || mode === "classroom")
            ? FREE_TEACHER_LIMIT
            : FREE_CLOUDWAVE_LIMIT;
          const category = (mode === "teacher" || mode === "pronunciation" || mode === "classroom") ? "teacher" : "talk";
          if (newDuration >= limit && isLimitReached(category) && !hasShownPaywall.current) {
            hasShownPaywall.current = true;
            setPaywallFeature(mode === "teacher" ? "teacher" : "cloudwave");
            setShowPaywall(true);
            disconnect();
          }
          return newDuration;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isConnected]);

  // Format duration
  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  // Get title based on mode
  const getTitle = () => {
    switch (mode) {
      case "teacher": return params.teacherName || "AI Teacher";
      case "cloudwave": return "CloudWave";
      case "surprise": return "Surprise Call";
      case "pronunciation": return "Pronunciation Coach";
      case "translator": return "Live Translator";
      case "classroom": return "Virtual Classroom";
      default: return "Voice Call";
    }
  };

  // Get subtitle
  const getSubtitle = () => {
    if (isConnecting) return "Connecting...";
    if (!isConnected) return "Disconnected";
    const lang = params.language || "";
    const dialect = params.dialect ? ` (${params.dialect})` : "";
    return `${lang}${dialect} • ${formatDuration(callDuration)}`;
  };

  // Get dominant emotion display
  const getDominantEmotion = (): string => {
    if (!emotions || emotions.length === 0) return "";
    const top = emotions[0];
    if (top.score < 0.3) return "";
    return top.name.charAt(0).toUpperCase() + top.name.slice(1);
  };

  // End call
  const handleEndCall = useCallback(() => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    disconnect();
    // Wire streak tracking and analytics on call completion
    (async () => {
      try {
        const streakStr = await AsyncStorage.getItem("@connectworld_streak");
        const currentStreak = streakStr ? parseInt(streakStr, 10) : 1;
        await markPracticeAndToast(showStreakToast, currentStreak);
        trackCallCompleted(params.teacherName || mode, callDuration, params.language || "Spanish");
      } catch {}
    })();
    // Navigate to scorecard which includes pronunciation heat map link
    router.replace({ pathname: "/call-scorecard" as any, params: { source: "hume-call", teacher: getTitle() } });
  }, [disconnect, router, callDuration, mode, params.teacherName, params.language]);

  // Minimize to PIP
  const handleMinimize = useCallback(() => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    minimizeCall("hume", getTitle(), "");
    router.back();
  }, [minimizeCall, router]);

  // Derive muted state from hook or local
  const isMuted = hookIsMuted ?? localMuted;

  // Toggle mute
  const handleMute = useCallback(() => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    if (hookSetMuted) {
      hookSetMuted(!isMuted);
    } else {
      setLocalMuted(!isMuted);
    }
  }, [isMuted, hookSetMuted]);

  // Toggle speaker
  const handleSpeaker = useCallback(() => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setIsSpeaker(!isSpeaker);
  }, [isSpeaker]);

  // Animated wave styles
  const waveStyle1 = useAnimatedStyle(() => ({ height: `${wave1.value * 100}%` }));
  const waveStyle2 = useAnimatedStyle(() => ({ height: `${wave2.value * 100}%` }));
  const waveStyle3 = useAnimatedStyle(() => ({ height: `${wave3.value * 100}%` }));
  const waveStyle4 = useAnimatedStyle(() => ({ height: `${wave4.value * 100}%` }));
  const waveStyle5 = useAnimatedStyle(() => ({ height: `${wave5.value * 100}%` }));
  const pulseStyle = useAnimatedStyle(() => ({ transform: [{ scale: pulseScale.value }] }));

  // Get emotion color
  const getEmotionColor = (emotion: string): string => {
    const emotionColors: Record<string, string> = {
      joy: "#22C55E",
      excitement: "#F59E0B",
      interest: "#3B82F6",
      concentration: "#8B5CF6",
      confusion: "#F97316",
      frustration: "#EF4444",
      sadness: "#6B7280",
      anxiety: "#EC4899",
      neutral: colors.muted,
    };
    return emotionColors[emotion.toLowerCase()] || colors.primary;
  };

  return (
    <ScreenContainer edges={["top", "bottom", "left", "right"]} containerClassName="bg-background">
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.foreground }]}>{getTitle()}</Text>
          <Text style={[styles.subtitle, { color: colors.muted }]}>{getSubtitle()}</Text>
          {getDominantEmotion() ? (
            <View style={[styles.emotionBadge, { backgroundColor: getEmotionColor(getDominantEmotion()) + "20" }]}>
              <Text style={[styles.emotionText, { color: getEmotionColor(getDominantEmotion()) }]}>
                {getDominantEmotion()}
              </Text>
            </View>
          ) : null}
        </View>

        {/* Waveform Visualization */}
        <Animated.View style={[styles.waveContainer, pulseStyle]}>
          <View style={styles.waveInner}>
            <Animated.View style={[styles.waveBar, { backgroundColor: colors.primary }, waveStyle1]} />
            <Animated.View style={[styles.waveBar, { backgroundColor: colors.primary }, waveStyle2]} />
            <Animated.View style={[styles.waveBar, { backgroundColor: colors.primary }, waveStyle3]} />
            <Animated.View style={[styles.waveBar, { backgroundColor: colors.primary }, waveStyle4]} />
            <Animated.View style={[styles.waveBar, { backgroundColor: colors.primary }, waveStyle5]} />
            <Animated.View style={[styles.waveBar, { backgroundColor: colors.primary }, waveStyle4]} />
            <Animated.View style={[styles.waveBar, { backgroundColor: colors.primary }, waveStyle2]} />
            <Animated.View style={[styles.waveBar, { backgroundColor: colors.primary }, waveStyle1]} />
            <Animated.View style={[styles.waveBar, { backgroundColor: colors.primary }, waveStyle3]} />
          </View>
        </Animated.View>

        {/* Error Display */}
        {error && (
          <View style={[styles.errorContainer, { backgroundColor: colors.error + "20" }]}>
            <Text style={[styles.errorText, { color: colors.error }]}>
              {error.includes("login") || error.includes("10001")
                ? "Voice call requires you to sign in first. Tap below to retry or restart the app."
                : error}
            </Text>
            <Pressable
              onPress={() => { connect(); }}
              style={({ pressed }) => [{ marginTop: 12, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20, backgroundColor: colors.primary, opacity: pressed ? 0.7 : 1 }]}
            >
              <Text style={{ color: "#fff", fontWeight: "600", fontSize: 14 }}>Retry Connection</Text>
            </Pressable>
          </View>
        )}

        {/* Transcript Toggle */}
        {transcript.length > 0 && (
          <Pressable
            onPress={() => setShowTranscript(!showTranscript)}
            style={({ pressed }) => [
              styles.transcriptToggle,
              { backgroundColor: colors.surface, opacity: pressed ? 0.7 : 1 },
            ]}
          >
            <Text style={[styles.transcriptToggleText, { color: colors.foreground }]}>
              {showTranscript ? "Hide Transcript" : "Show Transcript"}
            </Text>
          </Pressable>
        )}

        {/* Transcript */}
        {showTranscript && transcript.length > 0 && (
          <ScrollView
            ref={scrollRef}
            style={[styles.transcriptContainer, { backgroundColor: colors.surface }]}
            onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
          >
            {transcript.map((msg, i) => (
              <View key={i} style={[styles.transcriptMsg, msg.role === "user" ? styles.userMsg : styles.assistantMsg]}>
                <Text style={[styles.transcriptRole, { color: colors.muted }]}>
                  {msg.role === "user" ? "You" : getTitle()}
                </Text>
                <Text style={[styles.transcriptContent, { color: colors.foreground }]}>
                  {msg.content}
                </Text>
              </View>
            ))}
          </ScrollView>
        )}

        {/* Emotion Bars (top 5) */}
        {emotions.length > 0 && (
          <View style={styles.emotionBars}>
            {emotions.slice(0, 5).map((e: EmotionScore, i: number) => (
              <View key={i} style={styles.emotionBarRow}>
                <Text style={[styles.emotionBarLabel, { color: colors.muted }]} numberOfLines={1}>
                  {e.name}
                </Text>
                <View style={[styles.emotionBarTrack, { backgroundColor: colors.border }]}>
                  <View
                    style={[
                      styles.emotionBarFill,
                      { width: `${Math.round(e.score * 100)}%`, backgroundColor: getEmotionColor(e.name) },
                    ]}
                  />
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Call Controls */}
        <View style={styles.controls}>
          <Pressable
            onPress={handleMute}
            style={({ pressed }) => [
              styles.controlButton,
              { backgroundColor: isMuted ? colors.error : colors.surface, opacity: pressed ? 0.7 : 1 },
            ]}
          >
            <IconSymbol name={isMuted ? "mic.slash.fill" : "mic.fill"} size={24} color={isMuted ? "#fff" : colors.foreground} />
            <Text style={[styles.controlLabel, { color: isMuted ? "#fff" : colors.muted }]}>
              {isMuted ? "Unmute" : "Mute"}
            </Text>
          </Pressable>

          <Pressable
            onPress={handleEndCall}
            style={({ pressed }) => [
              styles.endCallButton,
              { backgroundColor: colors.error, opacity: pressed ? 0.8 : 1, transform: [{ scale: pressed ? 0.97 : 1 }] },
            ]}
          >
            <IconSymbol name="phone.down.fill" size={32} color="#fff" />
          </Pressable>

          <Pressable
            onPress={handleSpeaker}
            style={({ pressed }) => [
              styles.controlButton,
              { backgroundColor: isSpeaker ? colors.primary : colors.surface, opacity: pressed ? 0.7 : 1 },
            ]}
          >
            <IconSymbol name="speaker.wave.2.fill" size={24} color={isSpeaker ? "#fff" : colors.foreground} />
            <Text style={[styles.controlLabel, { color: isSpeaker ? "#fff" : colors.muted }]}>
              Speaker
            </Text>
          </Pressable>
        </View>
      </View>
      {/* Paywall Modal */}
      <PaywallModal
        visible={showPaywall}
        onClose={() => {
          setShowPaywall(false);
          router.back();
        }}
        feature={paywallFeature}
        singlePrice={paywallFeature === "teacher" ? "$4.99" : "$1.99"}
        showSinglePurchase={true}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  header: {
    alignItems: "center",
    gap: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
  },
  subtitle: {
    fontSize: 14,
    marginTop: 4,
  },
  emotionBadge: {
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  emotionText: {
    fontSize: 12,
    fontWeight: "600",
  },
  waveContainer: {
    width: 200,
    height: 120,
    alignItems: "center",
    justifyContent: "center",
  },
  waveInner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 80,
    gap: 4,
  },
  waveBar: {
    width: 6,
    borderRadius: 3,
    minHeight: 8,
  },
  errorContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 8,
  },
  errorText: {
    fontSize: 13,
    textAlign: "center",
  },
  transcriptToggle: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },
  transcriptToggleText: {
    fontSize: 13,
    fontWeight: "500",
  },
  transcriptContainer: {
    flex: 1,
    width: "100%",
    borderRadius: 12,
    padding: 12,
    maxHeight: 200,
  },
  transcriptMsg: {
    marginBottom: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  userMsg: {
    alignSelf: "flex-end",
    maxWidth: "80%",
  },
  assistantMsg: {
    alignSelf: "flex-start",
    maxWidth: "80%",
  },
  transcriptRole: {
    fontSize: 10,
    fontWeight: "600",
    marginBottom: 2,
  },
  transcriptContent: {
    fontSize: 14,
    lineHeight: 20,
  },
  emotionBars: {
    width: "100%",
    gap: 6,
    paddingHorizontal: 16,
  },
  emotionBarRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  emotionBarLabel: {
    fontSize: 11,
    width: 80,
  },
  emotionBarTrack: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
  },
  emotionBarFill: {
    height: "100%",
    borderRadius: 3,
  },
  controls: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 32,
    paddingBottom: 16,
  },
  controlButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  controlLabel: {
    fontSize: 10,
    fontWeight: "500",
  },
  endCallButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
  },
});
