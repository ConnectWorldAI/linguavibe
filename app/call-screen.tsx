import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Platform,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import * as Haptics from "expo-haptics";
import { useKeepAwake } from "expo-keep-awake";
import { Colors, Spacing, BorderRadius, FontSize } from "@/constants/Colors";
import { markTodayAsPracticed } from "@/lib/streak-notifications";
import { markPracticeAndToast } from "@/lib/streak-practice-helper";
import { useUsage } from "@/lib/usage-context";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

// ─── TYPES ───────────────────────────────────────────────────────────────────

type CallState = "connecting" | "ringing" | "active" | "ended";
type CallType = "video" | "voice";

// ─── COMPONENT ───────────────────────────────────────────────────────────────

export default function CallScreen() {
  const { showStreakToast } = useUsage();
  const router = useRouter();
  const params = useLocalSearchParams<{ name?: string; type?: string; avatar?: string }>();
  useKeepAwake();

  const calleeName = params.name || "Spanish Tutor";
  const callType = (params.type as CallType) || "video";
  const calleeAvatar = params.avatar || "👩‍🏫";

  const [callState, setCallState] = useState<CallState>("connecting");
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [isSpeaker, setIsSpeaker] = useState(false);
  const [isVideoCall, setIsVideoCall] = useState(callType === "video");
  const [showControls, setShowControls] = useState(true);

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const controlsAnim = useRef(new Animated.Value(1)).current;
  const durationRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Simulate connection
  useEffect(() => {
    const connectTimer = setTimeout(() => {
      setCallState("ringing");
    }, 1500);

    const answerTimer = setTimeout(() => {
      setCallState("active");
      if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }, 4000);

    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();

    return () => {
      clearTimeout(connectTimer);
      clearTimeout(answerTimer);
    };
  }, []);

  // Pulse animation for ringing
  useEffect(() => {
    if (callState === "ringing" || callState === "connecting") {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.2, duration: 800, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    }
  }, [callState]);

  // Duration timer
  useEffect(() => {
    if (callState === "active") {
      durationRef.current = setInterval(() => {
        setDuration((d) => d + 1);
      }, 1000);
    }
    return () => {
      if (durationRef.current) clearInterval(durationRef.current);
    };
  }, [callState]);

  // Auto-hide controls after 5s in video call
  useEffect(() => {
    if (callState === "active" && isVideoCall) {
      const hideTimer = setTimeout(() => {
        setShowControls(false);
        Animated.timing(controlsAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }).start();
      }, 5000);
      return () => clearTimeout(hideTimer);
    }
  }, [callState, isVideoCall, showControls]);

  const toggleControls = () => {
    if (!isVideoCall) return;
    const newState = !showControls;
    setShowControls(newState);
    Animated.timing(controlsAnim, {
      toValue: newState ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const endCall = () => {
    if (durationRef.current) clearInterval(durationRef.current);
    setCallState("ended");
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    // Mark today as practiced for streak tracking
    markPracticeAndToast(showStreakToast);
    // Auto-open feedback report after call ends
    setTimeout(() => {
      router.replace({
        pathname: "/feedback-report",
        params: {
          teacherName: calleeName,
          duration: String(duration),
          language: "Spanish",
        },
      } as any);
    }, 1500);
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const toggleCamera = () => {
    setIsCameraOff(!isCameraOff);
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const toggleSpeaker = () => {
    setIsSpeaker(!isSpeaker);
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const switchCallType = () => {
    setIsVideoCall(!isVideoCall);
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  // ─── ENDED STATE ───────────────────────────────────────────────────────────

  if (callState === "ended") {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.endedContainer}>
          <Text style={styles.endedEmoji}>📞</Text>
          <Text style={styles.endedTitle}>Call Ended</Text>
          <Text style={styles.endedDuration}>Duration: {formatDuration(duration)}</Text>
          <View style={styles.endedStats}>
            <View style={styles.endedStatItem}>
              <Ionicons name="time" size={18} color={Colors.secondary} />
              <Text style={styles.endedStatText}>{formatDuration(duration)}</Text>
            </View>
            <View style={styles.endedStatItem}>
              <Ionicons name={isVideoCall ? "videocam" : "call"} size={18} color={Colors.gold} />
              <Text style={styles.endedStatText}>{isVideoCall ? "Video" : "Voice"} Call</Text>
            </View>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // ─── CONNECTING / RINGING ──────────────────────────────────────────────────

  if (callState === "connecting" || callState === "ringing") {
    return (
      <SafeAreaView style={styles.container}>
        <Animated.View style={[styles.connectingContainer, { opacity: fadeAnim }]}>
          <Animated.View style={[styles.avatarRing, { transform: [{ scale: pulseAnim }] }]}>
            <View style={styles.avatarContainer}>
              <Text style={styles.avatarText}>{calleeAvatar}</Text>
            </View>
          </Animated.View>

          <Text style={styles.calleeName}>{calleeName}</Text>
          <Text style={styles.callStatus}>
            {callState === "connecting" ? "Connecting..." : "Ringing..."}
          </Text>

          <View style={styles.callTypeIndicator}>
            <Ionicons
              name={isVideoCall ? "videocam" : "call"}
              size={16}
              color={Colors.secondary}
            />
            <Text style={styles.callTypeText}>
              {isVideoCall ? "Video Call" : "Voice Call"}
            </Text>
          </View>

          {/* End call button during ringing */}
          <View style={styles.ringingActions}>
            <TouchableOpacity style={styles.endCallBtn} onPress={endCall}>
              <Ionicons name="call" size={28} color="#FFF" style={{ transform: [{ rotate: "135deg" }] }} />
            </TouchableOpacity>
            <Text style={styles.endCallLabel}>End</Text>
          </View>
        </Animated.View>
      </SafeAreaView>
    );
  }

  // ─── ACTIVE CALL ───────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity
        style={styles.activeCallContainer}
        activeOpacity={1}
        onPress={toggleControls}
      >
        {/* Video tiles area */}
        {isVideoCall ? (
          <View style={styles.videoArea}>
            {/* Remote video (full screen placeholder) */}
            <View style={styles.remoteVideo}>
              <View style={styles.remoteVideoPlaceholder}>
                <Text style={styles.remoteAvatarLarge}>{calleeAvatar}</Text>
                <Text style={styles.remoteNameOverlay}>{calleeName}</Text>
              </View>
            </View>

            {/* Self video (PiP) */}
            {!isCameraOff && (
              <View style={styles.selfVideo}>
                <View style={styles.selfVideoInner}>
                  <Text style={styles.selfVideoEmoji}>👤</Text>
                  <Text style={styles.selfVideoLabel}>You</Text>
                </View>
              </View>
            )}
          </View>
        ) : (
          <View style={styles.voiceArea}>
            <View style={styles.voiceAvatarContainer}>
              <Text style={styles.voiceAvatar}>{calleeAvatar}</Text>
            </View>
            <Text style={styles.voiceCalleeName}>{calleeName}</Text>
            <Text style={styles.voiceDuration}>{formatDuration(duration)}</Text>

            {/* Audio waveform visualization */}
            <View style={styles.waveformContainer}>
              {Array.from({ length: 12 }).map((_, i) => (
                <View
                  key={i}
                  style={[
                    styles.waveformBar,
                    {
                      height: 8 + Math.random() * 24,
                      opacity: isMuted ? 0.3 : 0.6 + Math.random() * 0.4,
                    },
                  ]}
                />
              ))}
            </View>
          </View>
        )}

        {/* Top bar with duration and info */}
        <Animated.View style={[styles.topBar, { opacity: controlsAnim }]}>
          <View style={styles.topBarLeft}>
            <View style={styles.liveDot} />
            <Text style={styles.durationText}>{formatDuration(duration)}</Text>
          </View>
          <View style={styles.topBarRight}>
            <View style={styles.encryptedBadge}>
              <Ionicons name="lock-closed" size={10} color={Colors.success} />
              <Text style={styles.encryptedText}>Encrypted</Text>
            </View>
          </View>
        </Animated.View>

        {/* Bottom controls */}
        <Animated.View style={[styles.controlsContainer, { opacity: controlsAnim }]}>
          {/* Secondary controls row */}
          <View style={styles.secondaryControls}>
            <TouchableOpacity
              style={[styles.controlBtn, isSpeaker && styles.controlBtnActive]}
              onPress={toggleSpeaker}
            >
              <Ionicons
                name={isSpeaker ? "volume-high" : "volume-medium"}
                size={22}
                color={isSpeaker ? "#000" : Colors.textPrimary}
              />
              <Text style={[styles.controlLabel, isSpeaker && styles.controlLabelActive]}>
                Speaker
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.controlBtn, isVideoCall && styles.controlBtnActive]}
              onPress={switchCallType}
            >
              <Ionicons
                name="videocam"
                size={22}
                color={isVideoCall ? "#000" : Colors.textPrimary}
              />
              <Text style={[styles.controlLabel, isVideoCall && styles.controlLabelActive]}>
                Video
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.controlBtn}>
              <Ionicons name="chatbubble" size={22} color={Colors.textPrimary} />
              <Text style={styles.controlLabel}>Chat</Text>
            </TouchableOpacity>
          </View>

          {/* Primary controls row */}
          <View style={styles.primaryControls}>
            <TouchableOpacity
              style={[styles.primaryBtn, isMuted && styles.primaryBtnActive]}
              onPress={toggleMute}
            >
              <Ionicons
                name={isMuted ? "mic-off" : "mic"}
                size={24}
                color={isMuted ? "#000" : Colors.textPrimary}
              />
            </TouchableOpacity>

            <TouchableOpacity style={styles.endCallBtnLarge} onPress={endCall}>
              <Ionicons name="call" size={30} color="#FFF" style={{ transform: [{ rotate: "135deg" }] }} />
            </TouchableOpacity>

            {isVideoCall && (
              <TouchableOpacity
                style={[styles.primaryBtn, isCameraOff && styles.primaryBtnActive]}
                onPress={toggleCamera}
              >
                <Ionicons
                  name={isCameraOff ? "videocam-off" : "videocam"}
                  size={24}
                  color={isCameraOff ? "#000" : Colors.textPrimary}
                />
              </TouchableOpacity>
            )}

            {!isVideoCall && (
              <TouchableOpacity style={styles.primaryBtn} onPress={() => { if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}>
                <Ionicons name="keypad" size={24} color={Colors.textPrimary} />
              </TouchableOpacity>
            )}
          </View>
        </Animated.View>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

// ─── STYLES ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary,
  },

  // Connecting / Ringing
  connectingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: 100,
  },
  avatarRing: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 3,
    borderColor: Colors.secondary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.xl,
    shadowColor: Colors.secondary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
  },
  avatarContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.surfaceCard,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 56,
  },
  calleeName: {
    fontSize: FontSize.xxl,
    fontWeight: "800",
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  callStatus: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    marginBottom: Spacing.lg,
  },
  callTypeIndicator: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    backgroundColor: Colors.surfaceCard,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  callTypeText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  ringingActions: {
    position: "absolute",
    bottom: 80,
    alignItems: "center",
  },
  endCallBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.accent,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.sm,
  },
  endCallLabel: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },

  // Active Call
  activeCallContainer: {
    flex: 1,
  },

  // Video area
  videoArea: {
    flex: 1,
    backgroundColor: Colors.backgroundDark,
  },
  remoteVideo: {
    flex: 1,
    backgroundColor: Colors.surfaceCard,
  },
  remoteVideoPlaceholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.surfaceElevated,
  },
  remoteAvatarLarge: {
    fontSize: 80,
    marginBottom: Spacing.md,
  },
  remoteNameOverlay: {
    fontSize: FontSize.lg,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  selfVideo: {
    position: "absolute",
    top: 80,
    right: Spacing.lg,
    width: 100,
    height: 140,
    borderRadius: BorderRadius.lg,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: Colors.border,
  },
  selfVideoInner: {
    flex: 1,
    backgroundColor: Colors.surfaceCard,
    alignItems: "center",
    justifyContent: "center",
  },
  selfVideoEmoji: {
    fontSize: 32,
    marginBottom: 4,
  },
  selfVideoLabel: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
  },

  // Voice area
  voiceArea: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: 120,
  },
  voiceAvatarContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.surfaceCard,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.lg,
    borderWidth: 2,
    borderColor: Colors.glowBorder,
  },
  voiceAvatar: {
    fontSize: 56,
  },
  voiceCalleeName: {
    fontSize: FontSize.xxl,
    fontWeight: "800",
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  voiceDuration: {
    fontSize: FontSize.lg,
    color: Colors.textSecondary,
    marginBottom: Spacing.xl,
  },
  waveformContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    height: 40,
  },
  waveformBar: {
    width: 4,
    borderRadius: 2,
    backgroundColor: Colors.secondary,
  },

  // Top bar
  topBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  topBarLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.success,
  },
  durationText: {
    fontSize: FontSize.md,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  topBarRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  encryptedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(0, 255, 136, 0.1)",
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: "rgba(0, 255, 136, 0.3)",
  },
  encryptedText: {
    fontSize: FontSize.xs,
    color: Colors.success,
  },

  // Controls
  controlsContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingBottom: Spacing.xl,
    paddingHorizontal: Spacing.lg,
    backgroundColor: "rgba(4, 8, 16, 0.85)",
  },
  secondaryControls: {
    flexDirection: "row",
    justifyContent: "center",
    gap: Spacing.xl,
    marginBottom: Spacing.lg,
    paddingTop: Spacing.md,
  },
  controlBtn: {
    alignItems: "center",
    gap: Spacing.xs,
    width: 64,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  controlBtnActive: {
    backgroundColor: Colors.textPrimary,
    borderRadius: BorderRadius.md,
  },
  controlLabel: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
  },
  controlLabelActive: {
    color: "#000",
  },
  primaryControls: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.xl,
  },
  primaryBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.surfaceCard,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  primaryBtnActive: {
    backgroundColor: Colors.textPrimary,
    borderColor: Colors.textPrimary,
  },
  endCallBtnLarge: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.accent,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
  },

  // Ended
  endedContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  endedEmoji: {
    fontSize: 56,
    marginBottom: Spacing.md,
  },
  endedTitle: {
    fontSize: FontSize.xxl,
    fontWeight: "800",
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  endedDuration: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    marginBottom: Spacing.xl,
  },
  endedStats: {
    flexDirection: "row",
    gap: Spacing.lg,
  },
  endedStatItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    backgroundColor: Colors.surfaceCard,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  endedStatText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
});
