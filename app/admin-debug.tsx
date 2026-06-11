import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { Colors, Spacing, BorderRadius, FontSize } from "../constants/Colors";
import {
  initFeatureFlags,
  overrideFlag,
  resetFlags,
  getExperimentEvents,
  clearExperimentEvents,
  type FeatureFlag,
} from "@/lib/feature-flags";
import {
  getQueuedCrashCount,
  getQueuedCrashReports,
  flushCrashQueue,
  type CrashReport,
} from "@/lib/crash-analytics";

export default function AdminDebugScreen() {
  const router = useRouter();
  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const [crashCount, setCrashCount] = useState(0);
  const [eventCount, setEventCount] = useState(0);
  const [recentCrashes, setRecentCrashes] = useState<CrashReport[]>([]);
  const [showCrashes, setShowCrashes] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      const flagMap = await initFeatureFlags();
      setFlags(Array.from(flagMap.values()));

      const count = await getQueuedCrashCount();
      setCrashCount(count);

      const events = await getExperimentEvents();
      setEventCount(events.length);

      if (count > 0) {
        const reports = await getQueuedCrashReports();
        setRecentCrashes(reports.slice(-5));
      }
    } catch (e) {
      console.error("Failed to load debug data:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleToggleFlag = async (key: string, currentEnabled: boolean) => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await overrideFlag(key, !currentEnabled);
    await loadData();
  };

  const handleResetFlags = async () => {
    Alert.alert(
      "Reset Feature Flags",
      "This will reset all flags to their default values. Continue?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reset",
          style: "destructive",
          onPress: async () => {
            await resetFlags();
            await loadData();
            if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          },
        },
      ]
    );
  };

  const handleFlushCrashes = async () => {
    const flushed = await flushCrashQueue();
    if (flushed > 0) {
      Alert.alert("Flushed", `${flushed} crash reports sent to server.`);
    } else {
      Alert.alert("Info", "No reports to flush (dev mode skips server).");
    }
    await loadData();
  };

  const handleClearEvents = async () => {
    await clearExperimentEvents();
    setEventCount(0);
    if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading debug data...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Developer Tools</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* ─── Crash Analytics Section ─────────────────────────────── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="bug" size={20} color={Colors.error} />
            <Text style={styles.sectionTitle}>Crash Analytics</Text>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{crashCount}</Text>
              <Text style={styles.statLabel}>Queued Reports</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{eventCount}</Text>
              <Text style={styles.statLabel}>Experiment Events</Text>
            </View>
          </View>

          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.actionBtn} onPress={handleFlushCrashes}>
              <Ionicons name="cloud-upload" size={16} color="#fff" />
              <Text style={styles.actionBtnText}>Flush Crashes</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionBtn, styles.actionBtnSecondary]} onPress={handleClearEvents}>
              <Ionicons name="trash" size={16} color={Colors.textSecondary} />
              <Text style={[styles.actionBtnText, { color: Colors.textSecondary }]}>Clear Events</Text>
            </TouchableOpacity>
          </View>

          {crashCount > 0 && (
            <TouchableOpacity
              style={styles.expandBtn}
              onPress={() => setShowCrashes(!showCrashes)}
            >
              <Text style={styles.expandBtnText}>
                {showCrashes ? "Hide" : "Show"} Recent Crashes
              </Text>
              <Ionicons
                name={showCrashes ? "chevron-up" : "chevron-down"}
                size={16}
                color={Colors.secondary}
              />
            </TouchableOpacity>
          )}

          {showCrashes && recentCrashes.map((crash) => (
            <View key={crash.id} style={styles.crashCard}>
              <Text style={styles.crashId}>{crash.id}</Text>
              <Text style={styles.crashMessage} numberOfLines={2}>{crash.message}</Text>
              <Text style={styles.crashMeta}>
                {crash.level} | {crash.platform} | {new Date(crash.timestamp).toLocaleString()}
              </Text>
            </View>
          ))}
        </View>

        {/* ─── Feature Flags Section ──────────────────────────────── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="flag" size={20} color={Colors.secondary} />
            <Text style={styles.sectionTitle}>Feature Flags</Text>
            <TouchableOpacity onPress={handleResetFlags} style={styles.resetBtn}>
              <Text style={styles.resetBtnText}>Reset All</Text>
            </TouchableOpacity>
          </View>

          {flags.map((flag) => (
            <View key={flag.key} style={styles.flagRow}>
              <View style={styles.flagInfo}>
                <Text style={styles.flagName}>{flag.name}</Text>
                <Text style={styles.flagKey}>{flag.key}</Text>
                {flag.experiment && (
                  <Text style={styles.flagExperiment}>Experiment: {flag.experiment}</Text>
                )}
                {flag.variant && (
                  <Text style={styles.flagVariant}>Variant: {flag.variant}</Text>
                )}
                <Text style={styles.flagRollout}>
                  Rollout: {flag.rolloutPercentage}% | Platforms: {flag.platforms.join(", ")}
                </Text>
              </View>
              <Switch
                value={flag.enabled}
                onValueChange={() => handleToggleFlag(flag.key, flag.enabled)}
                trackColor={{ false: "#334155", true: "rgba(0, 170, 255, 0.4)" }}
                thumbColor={flag.enabled ? Colors.secondary : "#687076"}
              />
            </View>
          ))}
        </View>

        {/* ─── Environment Info ────────────────────────────────────── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="information-circle" size={20} color={Colors.textSecondary} />
            <Text style={styles.sectionTitle}>Environment</Text>
          </View>
          <View style={styles.envRow}>
            <Text style={styles.envLabel}>Platform</Text>
            <Text style={styles.envValue}>{Platform.OS}</Text>
          </View>
          <View style={styles.envRow}>
            <Text style={styles.envLabel}>DEV Mode</Text>
            <Text style={styles.envValue}>{__DEV__ ? "Yes" : "No"}</Text>
          </View>
          <View style={styles.envRow}>
            <Text style={styles.envLabel}>OS Version</Text>
            <Text style={styles.envValue}>{Platform.Version}</Text>
          </View>
        </View>

        <View style={{ height: 60 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: Colors.textSecondary,
    fontSize: 14,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.border,
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.md,
    gap: 20,
  },
  section: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 0.5,
    borderColor: Colors.border,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: FontSize.md,
    fontWeight: "600",
    color: Colors.textPrimary,
    flex: 1,
  },
  statsRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: "rgba(0, 170, 255, 0.06)",
    borderRadius: BorderRadius.md,
    padding: 12,
    alignItems: "center",
  },
  statValue: {
    fontSize: 24,
    fontWeight: "700",
    color: Colors.secondary,
  },
  statLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  buttonRow: {
    flexDirection: "row",
    gap: 10,
  },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: Colors.secondary,
    paddingVertical: 10,
    borderRadius: BorderRadius.md,
  },
  actionBtnSecondary: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderWidth: 0.5,
    borderColor: Colors.border,
  },
  actionBtnText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#fff",
  },
  expandBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: 12,
    paddingVertical: 8,
  },
  expandBtnText: {
    fontSize: 13,
    color: Colors.secondary,
    fontWeight: "500",
  },
  crashCard: {
    backgroundColor: "rgba(239, 68, 68, 0.06)",
    borderRadius: BorderRadius.sm,
    padding: 10,
    marginTop: 8,
    borderWidth: 0.5,
    borderColor: "rgba(239, 68, 68, 0.2)",
  },
  crashId: {
    fontSize: 10,
    color: Colors.textSecondary,
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
  },
  crashMessage: {
    fontSize: 12,
    color: "#F87171",
    marginTop: 4,
  },
  crashMeta: {
    fontSize: 10,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  flagRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.border,
  },
  flagInfo: {
    flex: 1,
    marginRight: 12,
  },
  flagName: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  flagKey: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
    marginTop: 2,
  },
  flagExperiment: {
    fontSize: 10,
    color: Colors.secondary,
    marginTop: 2,
  },
  flagVariant: {
    fontSize: 10,
    color: Colors.accent || "#F59E0B",
    marginTop: 1,
  },
  flagRollout: {
    fontSize: 10,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  resetBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
    backgroundColor: "rgba(239, 68, 68, 0.1)",
  },
  resetBtnText: {
    fontSize: 11,
    color: "#F87171",
    fontWeight: "600",
  },
  envRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.border,
  },
  envLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  envValue: {
    fontSize: 13,
    color: Colors.textPrimary,
    fontWeight: "500",
  },
});
