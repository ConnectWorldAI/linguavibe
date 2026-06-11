/**
 * Focus Mode — Distraction-free learning with a minimal timer.
 * Hides all non-essential UI and shows only the current activity with an elapsed timer.
 * Uses expo-keep-awake to prevent screen sleep during focus sessions.
 */
import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import * as Haptics from "expo-haptics";
import { useKeepAwake } from "expo-keep-awake";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Colors } from "@/constants/Colors";

const FOCUS_HISTORY_KEY = "@connectworld_focus_history";

interface FocusSession {
  startedAt: number;
  endedAt: number;
  durationSeconds: number;
  activity: string;
}

export default function FocusModeScreen() {
  useKeepAwake();

  const params = useLocalSearchParams<{ activity?: string }>();
  const activity = params.activity || "Learning Session";

  const [elapsed, setElapsed] = useState(0);
  const [isActive, setIsActive] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(Date.now());

  useEffect(() => {
    if (isActive && !isPaused) {
      intervalRef.current = setInterval(() => {
        setElapsed(Math.floor((Date.now() - startTimeRef.current) / 1000));
      }, 1000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isActive, isPaused]);

  const formatTime = (seconds: number): string => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handlePause = () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (isPaused) {
      // Resume — adjust start time to account for paused duration
      startTimeRef.current = Date.now() - elapsed * 1000;
      setIsPaused(false);
    } else {
      setIsPaused(true);
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
  };

  const handleEndFocus = useCallback(async () => {
    if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setIsActive(false);
    if (intervalRef.current) clearInterval(intervalRef.current);

    // Save session to history
    const session: FocusSession = {
      startedAt: startTimeRef.current,
      endedAt: Date.now(),
      durationSeconds: elapsed,
      activity,
    };

    try {
      const raw = await AsyncStorage.getItem(FOCUS_HISTORY_KEY);
      const history: FocusSession[] = raw ? JSON.parse(raw) : [];
      history.unshift(session);
      // Keep last 50 sessions
      await AsyncStorage.setItem(FOCUS_HISTORY_KEY, JSON.stringify(history.slice(0, 50)));
    } catch {}

    router.back();
  }, [elapsed, activity]);

  // Motivational messages based on elapsed time
  const getMotivation = (): string => {
    if (elapsed < 60) return "Getting started...";
    if (elapsed < 300) return "Great focus! Keep going.";
    if (elapsed < 600) return "You're in the zone!";
    if (elapsed < 1200) return "Incredible dedication!";
    if (elapsed < 1800) return "30 minutes of pure focus!";
    return "You're a focus champion!";
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom", "left", "right"]}>
      <StatusBar barStyle="light-content" />

      {/* Minimal top bar */}
      <View style={styles.topBar}>
        <View style={styles.focusBadge}>
          <Ionicons name="eye-outline" size={14} color={Colors.secondary} />
          <Text style={styles.focusBadgeText}>FOCUS MODE</Text>
        </View>
        <TouchableOpacity
          style={styles.historyLink}
          onPress={() => router.push("/focus-history" as any)}
          activeOpacity={0.7}
        >
          <Ionicons name="time-outline" size={16} color={Colors.textMuted} />
          <Text style={styles.historyLinkText}>History</Text>
        </TouchableOpacity>
      </View>

      {/* Center content */}
      <View style={styles.centerContent}>
        {/* Activity label */}
        <Text style={styles.activityLabel}>{activity}</Text>

        {/* Timer */}
        <View style={styles.timerContainer}>
          <Text style={styles.timerText}>{formatTime(elapsed)}</Text>
          {isPaused && <Text style={styles.pausedLabel}>PAUSED</Text>}
        </View>

        {/* Motivation */}
        <Text style={styles.motivationText}>{getMotivation()}</Text>
      </View>

      {/* Bottom controls */}
      <View style={styles.bottomControls}>
        <TouchableOpacity
          style={styles.pauseBtn}
          onPress={handlePause}
          activeOpacity={0.7}
        >
          <Ionicons
            name={isPaused ? "play" : "pause"}
            size={24}
            color={Colors.textPrimary}
          />
          <Text style={styles.pauseBtnText}>{isPaused ? "Resume" : "Pause"}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.endBtn}
          onPress={handleEndFocus}
          activeOpacity={0.7}
        >
          <Ionicons name="stop-circle" size={24} color="#fff" />
          <Text style={styles.endBtnText}>End Focus</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary,
  },
  topBar: {
    alignItems: "center",
    paddingTop: 16,
    paddingBottom: 8,
  },
  focusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Colors.secondary + "15",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.secondary + "30",
  },
  focusBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: Colors.secondary,
    letterSpacing: 1.5,
  },
  centerContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  activityLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.textSecondary,
    marginBottom: 24,
    textAlign: "center",
  },
  timerContainer: {
    alignItems: "center",
    marginBottom: 24,
  },
  timerText: {
    fontSize: 64,
    fontWeight: "200",
    color: Colors.textPrimary,
    fontVariant: ["tabular-nums"],
    letterSpacing: 2,
  },
  pausedLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: Colors.gold,
    letterSpacing: 2,
    marginTop: 8,
  },
  motivationText: {
    fontSize: 14,
    color: Colors.textMuted,
    textAlign: "center",
  },
  bottomControls: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
    paddingBottom: 40,
    paddingHorizontal: 24,
  },
  pauseBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: Colors.surfaceCard,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  pauseBtnText: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  endBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: Colors.accent,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 14,
  },
  endBtnText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#fff",
  },
  historyLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 10,
  },
  historyLinkText: {
    fontSize: 12,
    color: Colors.textMuted,
    fontWeight: "500",
  },
});
