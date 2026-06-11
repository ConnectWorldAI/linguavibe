/**
 * Surprise Call Trigger System
 * Randomly initiates Coach Mode calls based on user's schedule gaps.
 * Shows incoming call UI with accept/decline, countdown timer,
 * frequency settings, and cool-down management.
 */
import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Dimensions,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { ScreenContainer } from "@/components/screen-container";
import * as Haptics from "expo-haptics";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  Easing,
} from "react-native-reanimated";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const Colors = {
  bg: "#0A0E1A",
  card: "#141B2D",
  cardBorder: "#1E293B",
  text: "#FFFFFF",
  textSecondary: "#94A3B8",
  textMuted: "#64748B",
  primary: "#00AAFF",
  success: "#10B981",
  error: "#EF4444",
  warning: "#F59E0B",
  gold: "#FFD700",
  purple: "#8B5CF6",
  orange: "#F97316",
  callGreen: "#22C55E",
  callRed: "#EF4444",
};

const STORAGE_KEY = "@surprise_call_settings";
const HISTORY_KEY = "@surprise_call_history";

interface SurpriseCallSettings {
  enabled: boolean;
  frequencyPerWeek: number; // 1-3
  cooldownHours: number; // minimum hours between calls
  availableHours: { start: number; end: number }; // 24h format
  lastCallTimestamp: number;
  declinedCount: number;
  acceptedCount: number;
}

interface CallAgent {
  name: string;
  avatar: string;
  nationality: string;
  scenario: string;
  difficulty: "easy" | "medium" | "hard";
}

const AGENTS: CallAgent[] = [
  { name: "Maria", avatar: "👩🏽", nationality: "Dominican Republic", scenario: "Ordering at a colmado", difficulty: "easy" },
  { name: "Carlos", avatar: "👨🏽", nationality: "Mexico City", scenario: "Asking for directions in el centro", difficulty: "medium" },
  { name: "Isabella", avatar: "👩🏻", nationality: "Madrid, Spain", scenario: "Job interview at a tech company", difficulty: "hard" },
  { name: "Diego", avatar: "👨🏽‍🦱", nationality: "Medellín, Colombia", scenario: "Negotiating at a market", difficulty: "medium" },
  { name: "Valentina", avatar: "👩🏽‍🦱", nationality: "Buenos Aires, Argentina", scenario: "Making plans with friends using lunfardo", difficulty: "hard" },
  { name: "Roberto", avatar: "👨🏽‍🦳", nationality: "San Juan, Puerto Rico", scenario: "Talking to your landlord about repairs", difficulty: "medium" },
];

const DEFAULT_SETTINGS: SurpriseCallSettings = {
  enabled: true,
  frequencyPerWeek: 2,
  cooldownHours: 24,
  availableHours: { start: 9, end: 21 },
  lastCallTimestamp: 0,
  declinedCount: 0,
  acceptedCount: 0,
};

export default function SurpriseCallScreen() {
  const router = useRouter();
  const [mode, setMode] = useState<"incoming" | "settings" | "countdown">("incoming");
  const [settings, setSettings] = useState<SurpriseCallSettings>(DEFAULT_SETTINGS);
  const [currentAgent, setCurrentAgent] = useState<CallAgent>(AGENTS[0]);
  const [countdown, setCountdown] = useState(30);
  const [xpPenalty, setXpPenalty] = useState(0);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Animations
  const pulseScale = useSharedValue(1);
  const ringOpacity = useSharedValue(0.3);

  useEffect(() => {
    loadSettings();
    // Pick a random agent
    const agent = AGENTS[Math.floor(Math.random() * AGENTS.length)];
    setCurrentAgent(agent);

    // Start pulse animation
    pulseScale.value = withRepeat(
      withSequence(
        withTiming(1.15, { duration: 800, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 800, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
    ringOpacity.value = withRepeat(
      withSequence(
        withTiming(0.8, { duration: 800 }),
        withTiming(0.2, { duration: 800 })
      ),
      -1,
      true
    );

    // Start countdown
    countdownRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          // Auto-decline after 30 seconds
          if (countdownRef.current) clearInterval(countdownRef.current);
          handleDecline();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Haptic vibration pattern for incoming call
    if (Platform.OS !== "web") {
      const vibrateInterval = setInterval(() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      }, 1500);
      return () => {
        clearInterval(vibrateInterval);
        if (countdownRef.current) clearInterval(countdownRef.current);
      };
    }

    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, []);

  const loadSettings = async () => {
    try {
      const saved = await AsyncStorage.getItem(STORAGE_KEY);
      if (saved) setSettings(JSON.parse(saved));
    } catch (e) {}
  };

  const saveSettings = async (newSettings: SurpriseCallSettings) => {
    setSettings(newSettings);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newSettings));
  };

  const handleAccept = async () => {
    if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    if (countdownRef.current) clearInterval(countdownRef.current);

    const updated = {
      ...settings,
      lastCallTimestamp: Date.now(),
      acceptedCount: settings.acceptedCount + 1,
    };
    await saveSettings(updated);

    // Log to history
    const history = JSON.parse((await AsyncStorage.getItem(HISTORY_KEY)) || "[]");
    history.push({
      agent: currentAgent.name,
      scenario: currentAgent.scenario,
      difficulty: currentAgent.difficulty,
      accepted: true,
      timestamp: Date.now(),
    });
    await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(history));

    // Navigate to Hume AI surprise call
    router.replace({
      pathname: "/hume-call" as any,
      params: {
        mode: "surprise",
        language: "Spanish",
        dialect: "Dominican",
        level: currentAgent.difficulty || "medium",
        scenario: currentAgent.scenario,
        teacherName: currentAgent.name,
      },
    });
  };

  const handleDecline = async () => {
    if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    if (countdownRef.current) clearInterval(countdownRef.current);

    const penalty = 15; // XP penalty for declining
    setXpPenalty(penalty);

    const updated = {
      ...settings,
      declinedCount: settings.declinedCount + 1,
    };
    await saveSettings(updated);

    // Log to history
    const history = JSON.parse((await AsyncStorage.getItem(HISTORY_KEY)) || "[]");
    history.push({
      agent: currentAgent.name,
      scenario: currentAgent.scenario,
      difficulty: currentAgent.difficulty,
      accepted: false,
      timestamp: Date.now(),
    });
    await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(history));

    setMode("settings");
  };

  const handleUpdateFrequency = async (freq: number) => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const updated = { ...settings, frequencyPerWeek: freq };
    await saveSettings(updated);
  };

  const handleToggleEnabled = async () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const updated = { ...settings, enabled: !settings.enabled };
    await saveSettings(updated);
  };

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  const ringStyle = useAnimatedStyle(() => ({
    opacity: ringOpacity.value,
  }));

  // ─── Incoming Call UI ──────────────────────────────────────────────────────
  if (mode === "incoming") {
    return (
      <View style={styles.incomingContainer}>
        {/* Background gradient effect */}
        <View style={styles.incomingBg} />

        {/* Top info */}
        <View style={styles.incomingTop}>
          <Text style={styles.incomingLabel}>INCOMING SURPRISE CALL</Text>
          <Text style={styles.countdownText}>{countdown}s</Text>
        </View>

        {/* Agent Avatar */}
        <View style={styles.avatarSection}>
          <Animated.View style={[styles.avatarRing, ringStyle]} />
          <Animated.View style={[styles.avatarContainer, pulseStyle]}>
            <Text style={styles.avatarEmoji}>{currentAgent.avatar}</Text>
          </Animated.View>
          <Text style={styles.agentName}>{currentAgent.name}</Text>
          <Text style={styles.agentNationality}>{currentAgent.nationality}</Text>
          <View style={styles.scenarioChip}>
            <Ionicons name="chatbubbles" size={12} color={Colors.primary} />
            <Text style={styles.scenarioText}>{currentAgent.scenario}</Text>
          </View>
          <View style={styles.difficultyChip}>
            <Text style={styles.difficultyText}>
              {currentAgent.difficulty === "easy" ? "🟢" : currentAgent.difficulty === "medium" ? "🟡" : "🔴"}{" "}
              {currentAgent.difficulty.charAt(0).toUpperCase() + currentAgent.difficulty.slice(1)}
            </Text>
          </View>
        </View>

        {/* XP Bonus */}
        <View style={styles.bonusRow}>
          <Ionicons name="flash" size={14} color={Colors.gold} />
          <Text style={styles.bonusText}>2x XP Bonus for surprise calls!</Text>
        </View>

        {/* Accept / Decline Buttons */}
        <View style={styles.callActions}>
          <TouchableOpacity
            style={styles.declineBtn}
            onPress={handleDecline}
            activeOpacity={0.8}
          >
            <View style={styles.callBtnInner}>
              <Ionicons name="close" size={28} color="#FFFFFF" />
            </View>
            <Text style={styles.callBtnLabel}>Decline</Text>
            <Text style={styles.penaltyText}>-15 XP</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.acceptBtn}
            onPress={handleAccept}
            activeOpacity={0.8}
          >
            <View style={[styles.callBtnInner, { backgroundColor: Colors.callGreen }]}>
              <Ionicons name="call" size={28} color="#FFFFFF" />
            </View>
            <Text style={styles.callBtnLabel}>Accept</Text>
            <Text style={styles.bonusSmall}>+2x XP</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ─── Settings / Post-Decline UI ────────────────────────────────────────────
  return (
    <ScreenContainer className="bg-[#0A0E1A]">
      <View style={styles.settingsContainer}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Surprise Calls</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Penalty Notice (if just declined) */}
        {xpPenalty > 0 && (
          <View style={styles.penaltyCard}>
            <Ionicons name="warning" size={20} color={Colors.warning} />
            <View style={{ flex: 1 }}>
              <Text style={styles.penaltyCardTitle}>Call Declined</Text>
              <Text style={styles.penaltyCardSub}>-{xpPenalty} XP deducted. Next call rescheduled within {settings.cooldownHours}h.</Text>
            </View>
          </View>
        )}

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{settings.acceptedCount}</Text>
            <Text style={styles.statLabel}>Accepted</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statNumber, { color: Colors.error }]}>{settings.declinedCount}</Text>
            <Text style={styles.statLabel}>Declined</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statNumber, { color: Colors.gold }]}>
              {settings.acceptedCount > 0
                ? Math.round((settings.acceptedCount / (settings.acceptedCount + settings.declinedCount)) * 100)
                : 0}%
            </Text>
            <Text style={styles.statLabel}>Accept Rate</Text>
          </View>
        </View>

        {/* Enable/Disable Toggle */}
        <TouchableOpacity style={styles.toggleCard} onPress={handleToggleEnabled} activeOpacity={0.8}>
          <View style={{ flex: 1 }}>
            <Text style={styles.toggleTitle}>Surprise Calls</Text>
            <Text style={styles.toggleSub}>Random calls to test your real-world readiness</Text>
          </View>
          <View style={[styles.toggleSwitch, settings.enabled && styles.toggleSwitchOn]}>
            <View style={[styles.toggleDot, settings.enabled && styles.toggleDotOn]} />
          </View>
        </TouchableOpacity>

        {/* Frequency */}
        <Text style={styles.sectionTitle}>Frequency</Text>
        <Text style={styles.sectionSub}>How many surprise calls per week?</Text>
        <View style={styles.frequencyRow}>
          {[1, 2, 3].map((freq) => (
            <TouchableOpacity
              key={freq}
              style={[styles.freqBtn, settings.frequencyPerWeek === freq && styles.freqBtnActive]}
              onPress={() => handleUpdateFrequency(freq)}
              activeOpacity={0.8}
            >
              <Text style={[styles.freqBtnText, settings.frequencyPerWeek === freq && styles.freqBtnTextActive]}>
                {freq}x
              </Text>
              <Text style={[styles.freqBtnLabel, settings.frequencyPerWeek === freq && styles.freqBtnLabelActive]}>
                per week
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Cool-down */}
        <Text style={styles.sectionTitle}>Cool-down Period</Text>
        <Text style={styles.sectionSub}>Minimum time between surprise calls</Text>
        <View style={styles.cooldownRow}>
          {[12, 24, 48].map((hours) => (
            <TouchableOpacity
              key={hours}
              style={[styles.cooldownBtn, settings.cooldownHours === hours && styles.cooldownBtnActive]}
              onPress={async () => {
                if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                await saveSettings({ ...settings, cooldownHours: hours });
              }}
              activeOpacity={0.8}
            >
              <Text style={[styles.cooldownBtnText, settings.cooldownHours === hours && styles.cooldownBtnTextActive]}>
                {hours}h
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Available Hours */}
        <Text style={styles.sectionTitle}>Available Hours</Text>
        <Text style={styles.sectionSub}>Only receive calls during these hours</Text>
        <View style={styles.hoursCard}>
          <View style={styles.hourItem}>
            <Text style={styles.hourLabel}>From</Text>
            <Text style={styles.hourValue}>{settings.availableHours.start}:00</Text>
          </View>
          <Ionicons name="arrow-forward" size={16} color={Colors.textMuted} />
          <View style={styles.hourItem}>
            <Text style={styles.hourLabel}>To</Text>
            <Text style={styles.hourValue}>{settings.availableHours.end}:00</Text>
          </View>
        </View>

        {/* Next Call Estimate */}
        <View style={styles.nextCallCard}>
          <Ionicons name="time" size={18} color={Colors.primary} />
          <View style={{ flex: 1 }}>
            <Text style={styles.nextCallTitle}>Next Surprise Call</Text>
            <Text style={styles.nextCallSub}>
              {settings.enabled
                ? `Estimated within the next ${Math.max(settings.cooldownHours, 24)} hours`
                : "Disabled — enable to receive surprise calls"}
            </Text>
          </View>
        </View>

        {/* Done Button */}
        <TouchableOpacity style={styles.doneBtn} onPress={() => router.back()} activeOpacity={0.8}>
          <Text style={styles.doneBtnText}>Done</Text>
        </TouchableOpacity>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  // ─── Incoming Call ──────────────────────────────────────────────────────────
  incomingContainer: {
    flex: 1,
    backgroundColor: Colors.bg,
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 80,
    paddingHorizontal: 32,
  },
  incomingBg: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.bg,
  },
  incomingTop: { alignItems: "center", gap: 8 },
  incomingLabel: {
    fontSize: 12,
    fontWeight: "800",
    color: Colors.warning,
    letterSpacing: 2,
  },
  countdownText: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.textMuted,
  },
  avatarSection: { alignItems: "center", gap: 12 },
  avatarRing: {
    position: "absolute",
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 3,
    borderColor: Colors.callGreen,
    top: -10,
  },
  avatarContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.card,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: Colors.callGreen,
  },
  avatarEmoji: { fontSize: 56 },
  agentName: { fontSize: 26, fontWeight: "900", color: Colors.text },
  agentNationality: { fontSize: 14, color: Colors.textSecondary },
  scenarioChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Colors.primary + "15",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.primary + "30",
    marginTop: 4,
  },
  scenarioText: { fontSize: 12, color: Colors.primary, fontWeight: "600" },
  difficultyChip: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  difficultyText: { fontSize: 12, color: Colors.textSecondary, fontWeight: "600" },
  bonusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Colors.gold + "12",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.gold + "30",
  },
  bonusText: { fontSize: 13, color: Colors.gold, fontWeight: "700" },
  callActions: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 60,
  },
  declineBtn: { alignItems: "center", gap: 8 },
  acceptBtn: { alignItems: "center", gap: 8 },
  callBtnInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.callRed,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: Colors.callRed,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  callBtnLabel: { fontSize: 13, fontWeight: "600", color: Colors.text },
  penaltyText: { fontSize: 11, color: Colors.error, fontWeight: "700" },
  bonusSmall: { fontSize: 11, color: Colors.callGreen, fontWeight: "700" },

  // ─── Settings ──────────────────────────────────────────────────────────────
  settingsContainer: { flex: 1, paddingHorizontal: 20 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.card,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: { fontSize: 17, fontWeight: "800", color: Colors.text },
  penaltyCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: Colors.warning + "12",
    borderRadius: 12,
    padding: 14,
    marginTop: 12,
    borderWidth: 1,
    borderColor: Colors.warning + "30",
  },
  penaltyCardTitle: { fontSize: 13, fontWeight: "700", color: Colors.warning },
  penaltyCardSub: { fontSize: 11, color: Colors.textSecondary, marginTop: 2 },
  statsRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 20,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  statNumber: { fontSize: 22, fontWeight: "900", color: Colors.success },
  statLabel: { fontSize: 10, color: Colors.textMuted, marginTop: 4, fontWeight: "600" },
  toggleCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    marginBottom: 24,
  },
  toggleTitle: { fontSize: 14, fontWeight: "700", color: Colors.text },
  toggleSub: { fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  toggleSwitch: {
    width: 48,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.1)",
    justifyContent: "center",
    paddingHorizontal: 3,
  },
  toggleSwitchOn: { backgroundColor: Colors.success + "40" },
  toggleDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Colors.textMuted,
  },
  toggleDotOn: { backgroundColor: Colors.success, alignSelf: "flex-end" },
  sectionTitle: { fontSize: 14, fontWeight: "800", color: Colors.text, marginBottom: 4 },
  sectionSub: { fontSize: 11, color: Colors.textMuted, marginBottom: 12 },
  frequencyRow: { flexDirection: "row", gap: 10, marginBottom: 24 },
  freqBtn: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  freqBtnActive: { backgroundColor: Colors.primary + "15", borderColor: Colors.primary },
  freqBtnText: { fontSize: 20, fontWeight: "900", color: Colors.textMuted },
  freqBtnTextActive: { color: Colors.primary },
  freqBtnLabel: { fontSize: 10, color: Colors.textMuted, marginTop: 2 },
  freqBtnLabelActive: { color: Colors.primary },
  cooldownRow: { flexDirection: "row", gap: 10, marginBottom: 24 },
  cooldownBtn: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  cooldownBtnActive: { backgroundColor: Colors.purple + "15", borderColor: Colors.purple },
  cooldownBtnText: { fontSize: 16, fontWeight: "700", color: Colors.textMuted },
  cooldownBtnTextActive: { color: Colors.purple },
  hoursCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 20,
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    marginBottom: 24,
  },
  hourItem: { alignItems: "center" },
  hourLabel: { fontSize: 10, color: Colors.textMuted, marginBottom: 4 },
  hourValue: { fontSize: 18, fontWeight: "800", color: Colors.text },
  nextCallCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: Colors.primary + "10",
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.primary + "20",
    marginBottom: 24,
  },
  nextCallTitle: { fontSize: 13, fontWeight: "700", color: Colors.primary },
  nextCallSub: { fontSize: 11, color: Colors.textSecondary, marginTop: 2 },
  doneBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
  },
  doneBtnText: { fontSize: 15, fontWeight: "700", color: "#FFFFFF" },
});
