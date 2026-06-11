/**
 * Focus History — Review past focus sessions.
 * Shows a list of all recorded focus sessions with duration, date, and activity.
 */
import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import * as Haptics from "expo-haptics";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Colors } from "@/constants/Colors";

const FOCUS_HISTORY_KEY = "@connectworld_focus_history";

interface FocusSession {
  startedAt: number;
  endedAt: number;
  durationSeconds: number;
  activity: string;
}

function formatDuration(seconds: number): string {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  if (hrs > 0) return `${hrs}h ${mins}m`;
  if (mins > 0) return `${mins}m ${secs}s`;
  return `${secs}s`;
}

function formatDate(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;

  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  });
}

function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

export default function FocusHistoryScreen() {
  const [sessions, setSessions] = useState<FocusSession[]>([]);
  const [totalMinutes, setTotalMinutes] = useState(0);
  const [totalSessions, setTotalSessions] = useState(0);

  useFocusEffect(
    useCallback(() => {
      const loadHistory = async () => {
        try {
          const raw = await AsyncStorage.getItem(FOCUS_HISTORY_KEY);
          if (raw) {
            const parsed: FocusSession[] = JSON.parse(raw);
            setSessions(parsed);
            setTotalSessions(parsed.length);
            const totalSecs = parsed.reduce((sum, s) => sum + s.durationSeconds, 0);
            setTotalMinutes(Math.round(totalSecs / 60));
          }
        } catch {}
      };
      loadHistory();
    }, [])
  );

  const handleClearHistory = async () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await AsyncStorage.removeItem(FOCUS_HISTORY_KEY);
    setSessions([]);
    setTotalMinutes(0);
    setTotalSessions(0);
  };

  const renderSession = ({ item, index }: { item: FocusSession; index: number }) => (
    <View style={styles.sessionCard}>
      <View style={styles.sessionLeft}>
        <View style={styles.sessionIconWrap}>
          <Ionicons name="eye-outline" size={18} color={Colors.secondary} />
        </View>
        <View style={styles.sessionInfo}>
          <Text style={styles.sessionActivity}>{item.activity}</Text>
          <Text style={styles.sessionMeta}>
            {formatDate(item.startedAt)} at {formatTime(item.startedAt)}
          </Text>
        </View>
      </View>
      <View style={styles.sessionRight}>
        <Text style={styles.sessionDuration}>{formatDuration(item.durationSeconds)}</Text>
      </View>
    </View>
  );

  const ListHeader = () => (
    <View style={styles.statsContainer}>
      <View style={styles.statCard}>
        <Text style={styles.statValue}>{totalSessions}</Text>
        <Text style={styles.statLabel}>Sessions</Text>
      </View>
      <View style={styles.statCard}>
        <Text style={styles.statValue}>{totalMinutes}</Text>
        <Text style={styles.statLabel}>Total Minutes</Text>
      </View>
      <View style={styles.statCard}>
        <Text style={styles.statValue}>
          {totalSessions > 0 ? Math.round(totalMinutes / totalSessions) : 0}
        </Text>
        <Text style={styles.statLabel}>Avg. Minutes</Text>
      </View>
    </View>
  );

  const ListEmpty = () => (
    <View style={styles.emptyState}>
      <View style={styles.emptyIcon}>
        <Ionicons name="eye-off-outline" size={48} color={Colors.textMuted} />
      </View>
      <Text style={styles.emptyTitle}>No Focus Sessions Yet</Text>
      <Text style={styles.emptySubtitle}>
        Start a Focus Mode session to see your history here.
      </Text>
      <TouchableOpacity
        style={styles.startBtn}
        onPress={() => router.push("/focus-mode" as any)}
        activeOpacity={0.8}
      >
        <Ionicons name="eye-outline" size={18} color="#fff" />
        <Text style={styles.startBtnText}>Start Focus Mode</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Focus History</Text>
        {sessions.length > 0 && (
          <TouchableOpacity style={styles.clearBtn} onPress={handleClearHistory}>
            <Text style={styles.clearBtnText}>Clear</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={sessions}
        renderItem={renderSession}
        keyExtractor={(item, index) => `${item.startedAt}-${index}`}
        ListHeaderComponent={sessions.length > 0 ? ListHeader : null}
        ListEmptyComponent={ListEmpty}
        contentContainerStyle={sessions.length === 0 ? styles.emptyContainer : styles.listContent}
        showsVerticalScrollIndicator={false}
      />
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: "700",
    color: Colors.textPrimary,
    marginLeft: 8,
  },
  clearBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  clearBtnText: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.accent,
  },
  statsContainer: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.surfaceCard,
    borderRadius: 14,
    padding: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statValue: {
    fontSize: 22,
    fontWeight: "700",
    color: Colors.textPrimary,
    fontVariant: ["tabular-nums"],
  },
  statLabel: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 4,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  listContent: {
    paddingBottom: 40,
  },
  sessionCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginHorizontal: 16,
    marginBottom: 8,
    backgroundColor: Colors.surfaceCard,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sessionLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 12,
  },
  sessionIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.secondary + "15",
    alignItems: "center",
    justifyContent: "center",
  },
  sessionInfo: {
    flex: 1,
  },
  sessionActivity: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  sessionMeta: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },
  sessionRight: {
    marginLeft: 12,
  },
  sessionDuration: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.secondary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
  },
  emptyState: {
    alignItems: "center",
    paddingHorizontal: 32,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.surfaceCard,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 24,
  },
  startBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: Colors.secondary,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 14,
  },
  startBtnText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#fff",
  },
});
