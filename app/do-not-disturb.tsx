import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Platform,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import { useNotificationScheduler } from "@/lib/notification-scheduler";

const PRESET_DURATIONS = [
  { label: "15 min", minutes: 15, icon: "timer-outline" },
  { label: "30 min", minutes: 30, icon: "timer-outline" },
  { label: "1 hour", minutes: 60, icon: "time-outline" },
  { label: "2 hours", minutes: 120, icon: "time-outline" },
  { label: "4 hours", minutes: 240, icon: "moon-outline" },
  { label: "Until I turn off", minutes: 1440, icon: "infinite-outline" },
];

export default function DoNotDisturbScreen() {
  const { dndState, activateDND, deactivateDND, isDNDActive, dndTimeRemaining } =
    useNotificationScheduler();

  const [customMinutes, setCustomMinutes] = useState("");
  const [showCustom, setShowCustom] = useState(false);
  const [timeLeft, setTimeLeft] = useState(dndTimeRemaining());

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  // Update countdown every minute
  useEffect(() => {
    if (!isDNDActive()) return;
    const interval = setInterval(() => {
      setTimeLeft(dndTimeRemaining());
    }, 10000); // every 10 seconds
    return () => clearInterval(interval);
  }, [dndState]);

  // Pulse animation for active DND
  useEffect(() => {
    if (isDNDActive()) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.1, duration: 1500, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 1500, useNativeDriver: true }),
        ])
      ).start();
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, { toValue: 1, duration: 2000, useNativeDriver: true }),
          Animated.timing(glowAnim, { toValue: 0.3, duration: 2000, useNativeDriver: true }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
      glowAnim.setValue(0);
    }
  }, [dndState.active]);

  const handleActivate = async (minutes: number) => {
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    await activateDND(minutes);
    setTimeLeft(minutes);
  };

  const handleDeactivate = async () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    await deactivateDND();
    setTimeLeft(0);
  };

  const handleCustomActivate = async () => {
    const mins = parseInt(customMinutes, 10);
    if (mins > 0 && mins <= 1440) {
      await handleActivate(mins);
      setShowCustom(false);
      setCustomMinutes("");
    }
  };

  const formatTimeRemaining = (minutes: number): string => {
    if (minutes >= 60) {
      const h = Math.floor(minutes / 60);
      const m = minutes % 60;
      return m > 0 ? `${h}h ${m}m` : `${h}h`;
    }
    return `${minutes}m`;
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Do Not Disturb</Text>
        <View style={{ width: 36 }} />
      </View>

      {/* Status Area */}
      <View style={styles.statusArea}>
        <Animated.View
          style={[
            styles.moonCircle,
            {
              transform: [{ scale: pulseAnim }],
              opacity: isDNDActive() ? glowAnim : 0.3,
            },
          ]}
        >
          <View style={styles.moonInner}>
            <Ionicons
              name={isDNDActive() ? "moon" : "moon-outline"}
              size={48}
              color={isDNDActive() ? "#6366F1" : "#475569"}
            />
          </View>
        </Animated.View>

        <Text style={styles.statusTitle}>
          {isDNDActive() ? "Focus Mode Active" : "Focus Mode Off"}
        </Text>
        <Text style={styles.statusDesc}>
          {isDNDActive()
            ? `All notifications silenced. Resuming in ${formatTimeRemaining(timeLeft)}.`
            : "Silence notifications during study sessions. They'll be waiting when you're done."}
        </Text>

        {isDNDActive() && (
          <TouchableOpacity style={styles.deactivateBtn} onPress={handleDeactivate}>
            <Ionicons name="power" size={18} color="#EF4444" />
            <Text style={styles.deactivateText}>Turn Off</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Duration Presets */}
      {!isDNDActive() && (
        <View style={styles.presetsSection}>
          <Text style={styles.presetsTitle}>Set Duration</Text>
          <View style={styles.presetsGrid}>
            {PRESET_DURATIONS.map((preset) => (
              <TouchableOpacity
                key={preset.minutes}
                style={styles.presetCard}
                onPress={() => handleActivate(preset.minutes)}
                activeOpacity={0.7}
              >
                <Ionicons name={preset.icon as any} size={22} color="#6366F1" />
                <Text style={styles.presetLabel}>{preset.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Custom Duration */}
          <TouchableOpacity
            style={styles.customToggle}
            onPress={() => setShowCustom(!showCustom)}
          >
            <Ionicons name="create-outline" size={16} color="#94A3B8" />
            <Text style={styles.customToggleText}>Custom duration</Text>
            <Ionicons name={showCustom ? "chevron-up" : "chevron-down"} size={14} color="#64748B" />
          </TouchableOpacity>

          {showCustom && (
            <View style={styles.customRow}>
              <TextInput
                style={styles.customInput}
                value={customMinutes}
                onChangeText={setCustomMinutes}
                placeholder="Minutes"
                placeholderTextColor="#475569"
                keyboardType="number-pad"
                maxLength={4}
                returnKeyType="done"
                onSubmitEditing={handleCustomActivate}
              />
              <TouchableOpacity
                style={[styles.customBtn, !customMinutes && styles.customBtnDisabled]}
                onPress={handleCustomActivate}
                disabled={!customMinutes}
              >
                <Text style={styles.customBtnText}>Start</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}

      {/* Info Section */}
      <View style={styles.infoSection}>
        <View style={styles.infoCard}>
          <Ionicons name="information-circle-outline" size={18} color="#6366F1" />
          <Text style={styles.infoText}>
            While DND is active, all notifications are silenced. They'll still be collected and
            available in your Notification Center when you resume.
          </Text>
        </View>
        <View style={styles.infoCard}>
          <Ionicons name="alarm-outline" size={18} color="#6366F1" />
          <Text style={styles.infoText}>
            Notifications automatically resume when the timer expires. You can also turn off DND
            manually at any time.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#060912" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(99, 102, 241, 0.1)",
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.05)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#fff" },
  statusArea: {
    alignItems: "center",
    paddingVertical: 32,
    paddingHorizontal: 24,
  },
  moonCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(99, 102, 241, 0.1)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "rgba(99, 102, 241, 0.3)",
    marginBottom: 20,
  },
  moonInner: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(99, 102, 241, 0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  statusTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#fff",
    marginBottom: 8,
  },
  statusDesc: {
    fontSize: 14,
    color: "#94A3B8",
    textAlign: "center",
    lineHeight: 20,
    maxWidth: 300,
  },
  deactivateBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 20,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    backgroundColor: "rgba(239, 68, 68, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.3)",
  },
  deactivateText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#EF4444",
  },
  presetsSection: {
    paddingHorizontal: 16,
  },
  presetsTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#E2E8F0",
    marginBottom: 12,
  },
  presetsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  presetCard: {
    width: "31%",
    aspectRatio: 1.4,
    borderRadius: 14,
    backgroundColor: "rgba(99, 102, 241, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(99, 102, 241, 0.2)",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  presetLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#A5B4FC",
  },
  customToggle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 16,
    paddingVertical: 8,
  },
  customToggleText: {
    fontSize: 13,
    color: "#94A3B8",
    flex: 1,
  },
  customRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 8,
  },
  customInput: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    paddingHorizontal: 14,
    fontSize: 14,
    color: "#fff",
  },
  customBtn: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: "#6366F1",
  },
  customBtnDisabled: {
    opacity: 0.4,
  },
  customBtnText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#fff",
  },
  infoSection: {
    paddingHorizontal: 16,
    marginTop: 24,
    gap: 10,
  },
  infoCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    padding: 14,
    borderRadius: 12,
    backgroundColor: "rgba(99, 102, 241, 0.05)",
    borderWidth: 1,
    borderColor: "rgba(99, 102, 241, 0.1)",
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    color: "#94A3B8",
    lineHeight: 18,
  },
});
