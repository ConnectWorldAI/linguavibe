/**
 * Moderation Dashboard — Admin screen for reviewing reported AI responses.
 * Shows all flagged AI messages with approve/dismiss/retrain actions.
 * Only accessible to admin users.
 */

import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getAdminState } from "@/lib/admin-access";

// ─── Types ───────────────────────────────────────────────────────────────────

interface AIReport {
  id: string;
  messageContent: string;
  reason: string;
  details?: string;
  timestamp: number;
  status: "pending" | "approved" | "dismissed" | "retrain";
  reviewedAt?: number;
  reviewNote?: string;
}

type FilterStatus = "all" | "pending" | "approved" | "dismissed" | "retrain";

const REPORTS_STORAGE_KEY = "@linguavibe_ai_reports";
const MODERATION_LOG_KEY = "@linguavibe_moderation_log";

// ─── Component ───────────────────────────────────────────────────────────────

export default function ModerationDashboard() {
  const colors = useColors();
  const router = useRouter();
  const [reports, setReports] = useState<AIReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<FilterStatus>("pending");
  const [stats, setStats] = useState({ pending: 0, approved: 0, dismissed: 0, retrain: 0, total: 0 });
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  // Check admin access on mount
  useEffect(() => {
    getAdminState().then((state) => {
      setIsAdmin(state.isAdmin);
      if (!state.isAdmin) {
        Alert.alert(
          "Access Denied",
          "You need admin privileges to access the Moderation Dashboard.",
          [{ text: "Go Back", onPress: () => router.back() }]
        );
      }
    });
  }, [router]);

  const loadReports = useCallback(async () => {
    try {
      const stored = await AsyncStorage.getItem(REPORTS_STORAGE_KEY);
      if (stored) {
        const parsed: AIReport[] = JSON.parse(stored);
        // Sort by newest first
        parsed.sort((a, b) => b.timestamp - a.timestamp);
        setReports(parsed);
        // Calculate stats
        const pending = parsed.filter((r) => r.status === "pending").length;
        const approved = parsed.filter((r) => r.status === "approved").length;
        const dismissed = parsed.filter((r) => r.status === "dismissed").length;
        const retrain = parsed.filter((r) => r.status === "retrain").length;
        setStats({ pending, approved, dismissed, retrain, total: parsed.length });
      }
    } catch (e) {
      console.warn("Failed to load reports:", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadReports();
  }, [loadReports]);

  const updateReportStatus = useCallback(
    async (reportId: string, newStatus: AIReport["status"], note?: string) => {
      const updated = reports.map((r) =>
        r.id === reportId
          ? { ...r, status: newStatus, reviewedAt: Date.now(), reviewNote: note }
          : r
      );
      setReports(updated);
      await AsyncStorage.setItem(REPORTS_STORAGE_KEY, JSON.stringify(updated));

      // Log moderation action
      const logEntry = {
        reportId,
        action: newStatus,
        note,
        timestamp: Date.now(),
      };
      const existingLog = await AsyncStorage.getItem(MODERATION_LOG_KEY);
      const log = existingLog ? JSON.parse(existingLog) : [];
      log.push(logEntry);
      await AsyncStorage.setItem(MODERATION_LOG_KEY, JSON.stringify(log));

      // Recalculate stats
      const pending = updated.filter((r) => r.status === "pending").length;
      const approved = updated.filter((r) => r.status === "approved").length;
      const dismissed = updated.filter((r) => r.status === "dismissed").length;
      const retrain = updated.filter((r) => r.status === "retrain").length;
      setStats({ pending, approved, dismissed, retrain, total: updated.length });
    },
    [reports]
  );

  const handleApprove = useCallback(
    (report: AIReport) => {
      Alert.alert(
        "Approve Report",
        "This confirms the AI response was problematic and has been noted for improvement.",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Approve",
            onPress: () => updateReportStatus(report.id, "approved", "Confirmed as problematic"),
          },
        ]
      );
    },
    [updateReportStatus]
  );

  const handleDismiss = useCallback(
    (report: AIReport) => {
      Alert.alert(
        "Dismiss Report",
        "This marks the report as not actionable (false positive or acceptable response).",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Dismiss",
            style: "destructive",
            onPress: () => updateReportStatus(report.id, "dismissed", "Dismissed as false positive"),
          },
        ]
      );
    },
    [updateReportStatus]
  );

  const handleRetrain = useCallback(
    (report: AIReport) => {
      Alert.alert(
        "Flag for Retraining",
        "This flags the response pattern for AI model improvement. The response type will be added to content guardrails.",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Flag for Retrain",
            onPress: () => updateReportStatus(report.id, "retrain", "Flagged for model retraining"),
          },
        ]
      );
    },
    [updateReportStatus]
  );

  const filteredReports = filter === "all" ? reports : reports.filter((r) => r.status === filter);

  const getReasonLabel = (reason: string) => {
    const labels: Record<string, string> = {
      incorrect: "Incorrect Information",
      incorrect_translation: "Incorrect Translation",
      offensive: "Offensive Content",
      offensive_content: "Offensive Content",
      inappropriate: "Inappropriate",
      inappropriate_response: "Inappropriate Response",
      misleading: "Misleading",
      wrong_grammar: "Wrong Grammar",
      cultural_insensitivity: "Culturally Insensitive",
      off_topic: "Off Topic",
      other: "Other",
    };
    return labels[reason] || reason.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  };

  const getStatusColor = (status: AIReport["status"]) => {
    switch (status) {
      case "pending":
        return colors.warning;
      case "approved":
        return colors.success;
      case "dismissed":
        return colors.muted;
      case "retrain":
        return colors.primary;
      default:
        return colors.muted;
    }
  };

  const getStatusIcon = (status: AIReport["status"]) => {
    switch (status) {
      case "pending":
        return "time-outline";
      case "approved":
        return "checkmark-circle";
      case "dismissed":
        return "close-circle";
      case "retrain":
        return "refresh-circle";
      default:
        return "help-circle";
    }
  };

  const formatTime = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return new Date(timestamp).toLocaleDateString();
  };

  const renderReport = ({ item }: { item: AIReport }) => (
    <View style={[styles.reportCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      {/* Header */}
      <View style={styles.reportHeader}>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + "20" }]}>
          <Ionicons name={getStatusIcon(item.status) as any} size={14} color={getStatusColor(item.status)} />
          <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
            {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
          </Text>
        </View>
        <Text style={[styles.timestamp, { color: colors.muted }]}>{formatTime(item.timestamp)}</Text>
      </View>

      {/* Reason */}
      <View style={[styles.reasonBadge, { backgroundColor: colors.error + "15" }]}>
        <Ionicons name="flag" size={12} color={colors.error} />
        <Text style={[styles.reasonText, { color: colors.error }]}>{getReasonLabel(item.reason)}</Text>
      </View>

      {/* AI Message Content */}
      <View style={[styles.messageBox, { backgroundColor: colors.background }]}>
        <Text style={[styles.messageLabel, { color: colors.muted }]}>AI Response:</Text>
        <Text style={[styles.messageContent, { color: colors.foreground }]} numberOfLines={4}>
          {item.messageContent}
        </Text>
      </View>

      {/* Details */}
      {item.details && (
        <View style={styles.detailsRow}>
          <Text style={[styles.detailsLabel, { color: colors.muted }]}>User note:</Text>
          <Text style={[styles.detailsText, { color: colors.foreground }]}>{item.details}</Text>
        </View>
      )}

      {/* Review note */}
      {item.reviewNote && (
        <View style={styles.detailsRow}>
          <Text style={[styles.detailsLabel, { color: colors.primary }]}>Review:</Text>
          <Text style={[styles.detailsText, { color: colors.foreground }]}>{item.reviewNote}</Text>
        </View>
      )}

      {/* Actions (only for pending) */}
      {item.status === "pending" && (
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.success + "15" }]}
            onPress={() => handleApprove(item)}
            activeOpacity={0.7}
          >
            <Ionicons name="checkmark" size={16} color={colors.success} />
            <Text style={[styles.actionText, { color: colors.success }]}>Approve</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.primary + "15" }]}
            onPress={() => handleRetrain(item)}
            activeOpacity={0.7}
          >
            <Ionicons name="refresh" size={16} color={colors.primary} />
            <Text style={[styles.actionText, { color: colors.primary }]}>Retrain</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.muted + "15" }]}
            onPress={() => handleDismiss(item)}
            activeOpacity={0.7}
          >
            <Ionicons name="close" size={16} color={colors.muted} />
            <Text style={[styles.actionText, { color: colors.muted }]}>Dismiss</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  const renderFilterTab = (status: FilterStatus, label: string, count: number) => (
    <TouchableOpacity
      style={[
        styles.filterTab,
        filter === status && { backgroundColor: colors.primary + "20", borderColor: colors.primary },
      ]}
      onPress={() => setFilter(status)}
      activeOpacity={0.7}
    >
      <Text
        style={[
          styles.filterLabel,
          { color: filter === status ? colors.primary : colors.muted },
        ]}
      >
        {label}
      </Text>
      {count > 0 && (
        <View style={[styles.filterCount, { backgroundColor: filter === status ? colors.primary : colors.muted + "30" }]}>
          <Text style={[styles.filterCountText, { color: filter === status ? "#fff" : colors.muted }]}>
            {count}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );

  // Block non-admin users from seeing the dashboard
  if (isAdmin === null) {
    return (
      <ScreenContainer edges={["top", "left", "right"]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.muted }]}>Verifying access...</Text>
        </View>
      </ScreenContainer>
    );
  }

  if (!isAdmin) {
    return (
      <ScreenContainer edges={["top", "left", "right"]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton} activeOpacity={0.7}>
            <Ionicons name="chevron-back" size={24} color={colors.foreground} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>AI Moderation</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.emptyContainer}>
          <Ionicons name="lock-closed" size={64} color={colors.error + "60"} />
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Admin Access Required</Text>
          <Text style={[styles.emptySubtitle, { color: colors.muted }]}>
            This dashboard is restricted to admin users. Enable admin access in Account Settings to view moderation reports.
          </Text>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer edges={["top", "left", "right"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>AI Moderation</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Stats Summary */}
      <View style={[styles.statsRow, { borderBottomColor: colors.border }]}>
        <View style={styles.statItem}>
          <Text style={[styles.statNumber, { color: colors.warning }]}>{stats.pending}</Text>
          <Text style={[styles.statLabel, { color: colors.muted }]}>Pending</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statNumber, { color: colors.success }]}>{stats.approved}</Text>
          <Text style={[styles.statLabel, { color: colors.muted }]}>Approved</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statNumber, { color: colors.primary }]}>{stats.retrain}</Text>
          <Text style={[styles.statLabel, { color: colors.muted }]}>Retrain</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statNumber, { color: colors.muted }]}>{stats.dismissed}</Text>
          <Text style={[styles.statLabel, { color: colors.muted }]}>Dismissed</Text>
        </View>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterRow}>
        {renderFilterTab("pending", "Pending", stats.pending)}
        {renderFilterTab("approved", "Approved", stats.approved)}
        {renderFilterTab("retrain", "Retrain", stats.retrain)}
        {renderFilterTab("dismissed", "Dismissed", stats.dismissed)}
        {renderFilterTab("all", "All", stats.total)}
      </View>

      {/* Reports List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.muted }]}>Loading reports...</Text>
        </View>
      ) : filteredReports.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="shield-checkmark" size={64} color={colors.muted + "50"} />
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
            {filter === "pending" ? "No Pending Reports" : "No Reports Found"}
          </Text>
          <Text style={[styles.emptySubtitle, { color: colors.muted }]}>
            {filter === "pending"
              ? "All AI responses have been reviewed. Great job keeping the AI safe!"
              : `No reports with status "${filter}" found.`}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredReports}
          renderItem={renderReport}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
          }
        />
      )}
    </ScreenContainer>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  statsRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statNumber: {
    fontSize: 22,
    fontWeight: "700",
  },
  statLabel: {
    fontSize: 11,
    marginTop: 2,
  },
  filterRow: {
    flexDirection: "row",
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 6,
  },
  filterTab: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "transparent",
    gap: 4,
  },
  filterLabel: {
    fontSize: 12,
    fontWeight: "600",
  },
  filterCount: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  filterCountText: {
    fontSize: 10,
    fontWeight: "700",
  },
  listContent: {
    padding: 16,
    gap: 12,
    paddingBottom: 100,
  },
  reportCard: {
    borderRadius: 12,
    padding: 14,
    borderWidth: 0.5,
    gap: 10,
  },
  reportHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "600",
  },
  timestamp: {
    fontSize: 11,
  },
  reasonBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: "flex-start",
  },
  reasonText: {
    fontSize: 12,
    fontWeight: "500",
  },
  messageBox: {
    borderRadius: 8,
    padding: 10,
  },
  messageLabel: {
    fontSize: 10,
    fontWeight: "600",
    marginBottom: 4,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  messageContent: {
    fontSize: 13,
    lineHeight: 18,
  },
  detailsRow: {
    flexDirection: "row",
    gap: 6,
    alignItems: "flex-start",
  },
  detailsLabel: {
    fontSize: 11,
    fontWeight: "600",
  },
  detailsText: {
    fontSize: 12,
    flex: 1,
    lineHeight: 16,
  },
  actions: {
    flexDirection: "row",
    gap: 8,
    marginTop: 4,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingVertical: 8,
    borderRadius: 8,
  },
  actionText: {
    fontSize: 12,
    fontWeight: "600",
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
});
