import { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Animated,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Colors, Spacing, BorderRadius, FontSize } from "../constants/Colors";

const NAME_AUDIO_KEY = "@connectworld_name_recorded";
const NAME_VALUE_KEY = "@connectworld_user_name";

type RecordingState = "idle" | "listening" | "recorded" | "playing";

export default function NameRecordingScreen() {
  const [state, setState] = useState<RecordingState>("idle");
  const [recordedName, setRecordedName] = useState("");
  const [hasExisting, setHasExisting] = useState(false);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0.3)).current;
  const waveAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    checkExisting();
  }, []);

  useEffect(() => {
    if (state === "listening") {
      startPulse();
      startWave();
      // Simulate recording for 3 seconds
      const timer = setTimeout(() => {
        setState("recorded");
        setRecordedName("Your Name"); // Placeholder — real STT would fill this
        if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }, 3000);
      return () => clearTimeout(timer);
    } else {
      pulseAnim.stopAnimation();
      waveAnim.stopAnimation();
    }
  }, [state]);

  const checkExisting = async () => {
    try {
      const stored = await AsyncStorage.getItem(NAME_AUDIO_KEY);
      const name = await AsyncStorage.getItem(NAME_VALUE_KEY);
      if (stored === "true" && name) {
        setHasExisting(true);
        setRecordedName(name);
        setState("recorded");
      }
    } catch (e) { /* ignore */ }
  };

  const startPulse = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.15, duration: 600, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      ])
    ).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 0.8, duration: 500, useNativeDriver: true }),
        Animated.timing(glowAnim, { toValue: 0.3, duration: 500, useNativeDriver: true }),
      ])
    ).start();
  };

  const startWave = () => {
    Animated.loop(
      Animated.timing(waveAnim, { toValue: 1, duration: 1500, useNativeDriver: true })
    ).start();
  };

  const handleStartRecording = () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setState("listening");
  };

  const handleReRecord = () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setState("idle");
    setRecordedName("");
  };

  const handleSave = async () => {
    if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await AsyncStorage.setItem(NAME_AUDIO_KEY, "true");
    await AsyncStorage.setItem(NAME_VALUE_KEY, recordedName || "User");
    router.back();
  };

  const handlePlayback = () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setState("playing");
    setTimeout(() => setState("recorded"), 2000);
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => {
            if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.back();
          }}
          style={styles.backBtn}
        >
          <Ionicons name="chevron-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Voice Introduction</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Agent Message */}
      <View style={styles.agentSection}>
        <View style={styles.agentBubble}>
          <Text style={styles.agentEmoji}>🌊</Text>
          <View style={styles.agentTextContainer}>
            {state === "idle" && (
              <Text style={styles.agentText}>
                Hey! Say your name for me so I can introduce you to your teacher. They'll know exactly who's joining their class. 🎓
              </Text>
            )}
            {state === "listening" && (
              <Text style={styles.agentText}>
                I'm listening... Go ahead, say your name! 👂
              </Text>
            )}
            {state === "recorded" && (
              <Text style={styles.agentText}>
                Got it! I'll let your teacher know {recordedName ? `"${recordedName}"` : "you"} is joining. Sound good? 👋
              </Text>
            )}
            {state === "playing" && (
              <Text style={styles.agentText}>
                Playing back what I heard... 🔊
              </Text>
            )}
          </View>
        </View>
      </View>

      {/* Recording Orb */}
      <View style={styles.orbSection}>
        <TouchableOpacity
          onPress={state === "idle" ? handleStartRecording : state === "recorded" ? handlePlayback : undefined}
          activeOpacity={0.8}
          disabled={state === "listening" || state === "playing"}
        >
          <Animated.View style={[
            styles.orbOuter,
            state === "listening" && { transform: [{ scale: pulseAnim }] },
          ]}>
            <Animated.View style={[
              styles.orbGlow,
              {
                opacity: state === "listening" ? glowAnim : state === "recorded" ? 0.5 : 0.2,
                backgroundColor: state === "listening" ? Colors.secondary : state === "recorded" ? Colors.success : Colors.secondary,
              },
            ]} />
            <View style={[
              styles.orbInner,
              state === "listening" && styles.orbListening,
              state === "recorded" && styles.orbRecorded,
              state === "playing" && styles.orbPlaying,
            ]}>
              {state === "idle" && (
                <Ionicons name="mic" size={48} color={Colors.secondary} />
              )}
              {state === "listening" && (
                <View style={styles.waveContainer}>
                  {[0, 1, 2, 3, 4].map(i => (
                    <Animated.View
                      key={i}
                      style={[
                        styles.waveBar,
                        {
                          height: 20 + Math.random() * 30,
                          opacity: glowAnim,
                        },
                      ]}
                    />
                  ))}
                </View>
              )}
              {state === "recorded" && (
                <Ionicons name="play" size={48} color={Colors.success} />
              )}
              {state === "playing" && (
                <Ionicons name="volume-high" size={48} color={Colors.gold} />
              )}
            </View>
          </Animated.View>
        </TouchableOpacity>

        {/* State Label */}
        <Text style={styles.stateLabel}>
          {state === "idle" && "Tap to start recording"}
          {state === "listening" && "Listening..."}
          {state === "recorded" && "Tap to play back"}
          {state === "playing" && "Playing..."}
        </Text>
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        {state === "recorded" && (
          <>
            <TouchableOpacity style={styles.reRecordBtn} onPress={handleReRecord}>
              <Ionicons name="refresh" size={20} color={Colors.secondary} />
              <Text style={styles.reRecordText}>Re-record</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
              <Ionicons name="checkmark-circle" size={22} color="#fff" />
              <Text style={styles.saveBtnText}>Sounds Good!</Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      {/* Info */}
      <View style={styles.infoSection}>
        <View style={styles.infoCard}>
          <Ionicons name="information-circle" size={18} color={Colors.secondary} />
          <Text style={styles.infoText}>
            Your teacher will use this to greet you by name in your first class. You can re-record anytime in Settings.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: FontSize.lg,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  agentSection: {
    paddingHorizontal: Spacing.lg,
    marginTop: Spacing.lg,
  },
  agentBubble: {
    flexDirection: "row",
    backgroundColor: Colors.surfaceCard,
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.glowBorder,
    gap: Spacing.sm,
    alignItems: "flex-start",
  },
  agentEmoji: {
    fontSize: 28,
    marginTop: 2,
  },
  agentTextContainer: {
    flex: 1,
  },
  agentText: {
    fontSize: FontSize.md,
    color: Colors.textPrimary,
    lineHeight: 22,
  },
  orbSection: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.lg,
  },
  orbOuter: {
    width: 180,
    height: 180,
    borderRadius: 90,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  orbGlow: {
    position: "absolute",
    width: 180,
    height: 180,
    borderRadius: 90,
  },
  orbInner: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: Colors.surfaceCard,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: Colors.border,
  },
  orbListening: {
    borderColor: Colors.secondary,
    backgroundColor: "rgba(0, 170, 255, 0.08)",
  },
  orbRecorded: {
    borderColor: Colors.success,
    backgroundColor: "rgba(0, 255, 136, 0.05)",
  },
  orbPlaying: {
    borderColor: Colors.gold,
    backgroundColor: "rgba(255, 184, 0, 0.05)",
  },
  waveContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  waveBar: {
    width: 6,
    borderRadius: 3,
    backgroundColor: Colors.secondary,
  },
  stateLabel: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    fontWeight: "600",
  },
  actions: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
    gap: Spacing.md,
    alignItems: "center",
  },
  reRecordBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.secondary,
  },
  reRecordText: {
    fontSize: FontSize.md,
    color: Colors.secondary,
    fontWeight: "600",
  },
  saveBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: Colors.success,
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 28,
  },
  saveBtnText: {
    fontSize: FontSize.md,
    fontWeight: "700",
    color: "#fff",
  },
  infoSection: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  infoCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: "rgba(0, 170, 255, 0.06)",
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: "rgba(0, 170, 255, 0.15)",
  },
  infoText: {
    flex: 1,
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
});
