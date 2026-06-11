/**
 * AI Guardrails Audit Log — Shows history of blocked/modified requests
 * from the rate limiter and input scanner.
 * 
 * Displays security events including:
 * - Blocked prompt injection attempts
 * - Rate-limited requests
 * - Jailbreak detection events
 * - Warned/flagged inputs
 * 
 * Admin-only screen (requires admin access).
 */

import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { getAdminState } from "@/lib/admin-access";
import { trpc } from "@/lib/trpc";

// ─── Types ───────────────────────────────────────────────────────────────────

interface AuditEntry {
  timestamp: number;
  userId?: string;
  action: "allowed" | "blocked" | "warned" | "banned";
  threatLevel: "safe" | "suspicious" | "blocked";
  score: number;
  threats: string[];
  inputPreview: string;
}

interface SecurityStats {
  totalRequests: number;
  blockedRequests: number;
  bannedUsers: number;
  recentThreats: number;
}

type FilterAction = "all" | "blocked" | "warned" | "banned" | "allowed";

// ─── Component ───────────────────────────────────────────────────────────────

export default function AIAuditLog() {
  const colors = useColors();
  const router = useRouter();
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [stats, setStats] = useState<SecurityStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<FilterAction>("all");
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  // Check admin access
  useEffect(() => {
    getAdminState().then((state) => {
      setIsAdmin(state.isAdmin);
      if (!state.isAdmin) {
        Alert.alert(
          "Access Denied",
          "You need admin privileges to view the AI Audit Log.",
          [{ text: "Go Back", onPress: () => router.back() }]
        );
      }
    });
  }, [router]);

  // Fetch audit log from server
  const auditLogQuery = trpc.aiSecurity.getAuditLog.useQuery(
    { limit: 200 },
    { enabled: isAdmin === true }
  );
  const statsQuery = trpc.aiSecurity.getStats.useQuery(
    undefined,
    { enabled: isAdmin === true }
  );

  useEffect(() => {
    if (auditLogQuery.data) {
      setEntries(auditLogQuery.data as AuditEntry[]);
      setLoading(false);
    }
  }, [auditLogQuery.data]);

  useEffect(() => {
    if (statsQuery.data) {
      setStats(statsQuery.data as SecurityStats);
    }
  }, [statsQuery.data]);

  useEffect(() => {
    if (auditLogQuery.isError || statsQuery.isError) {
      setLoading(false);
    }
  }, [auditLogQuery.isError, statsQuery.isError]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    Promise.all([auditLogQuery.refetch(), statsQuery.refetch()]).finally(() => {
      setRefreshing(false);
    });
  }, [auditLogQuery, statsQuery]);

  const filteredEntries = filter === "all"
    ? entries
    : entries.filter((e) => e.action === filter);

  const getActionColor = (action: AuditEntry["action"]) => {
    switch (action) {
      case "blocked": return colors.error;
      case "warned": return colors.warning;
      case "banned": return "#DC2626";
      case "allowed": return colors.success;
      default: return colors.muted;
    }
  };

  const getActionIcon = (action: AuditEntry["action"]): string => {
    switch (action) {
      case "blocked": return "close-circle";
      case "warned": return "warning";
      case "banned": return "ban";
      case "allowed": return "checkmark-circle";
      default: return "help-circle";
    }
  };

  const getThreatIcon = (level: AuditEntry["threatLevel"]): string => {
    switch (level) {
      case "blocked": return "skull";
      case "suspicious": return "eye";
      case "safe": return "shield-checkmark";
      default: return "help";
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

  const renderEntry = ({ item }: { item: AuditEntry }) => (
    <View style={[styles.entryCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      {/* Header row */}
      <View style={styles.entryHeader}>
        <View style={[styles.actionBadge, { backgroundColor: getActionColor(item.action) + "20" }]}>
          <Ionicons name={getActionIcon(item.action) as any} size={14} color={getActionColor(item.action)} />
          <Text style={[styles.actionText, { color: getActionColor(item.action) }]}>
            {item.action.charAt(0).toUpperCase() + item.action.slice(1)}
          </Text>
        </View>
        <Text style={[styles.timestamp, { color: colors.muted }]}>{formatTime(item.timestamp)}</Text>
      </View>

      {/* Threat level & score */}
      <View style={styles.threatRow}>
        <View style={styles.threatBadge}>
          <Ionicons
            name={getThreatIcon(item.threatLevel) as any}
            size={12}
            color={item.threatLevel === "blocked" ? colors.error : item.threatLevel === "suspicious" ? colors.warning : colors.success}
          />
          <Text style={[styles.threatText, {
            color: item.threatLevel === "blocked" ? colors.error : item.threatLevel === "suspicious" ? colors.warning : colors.success,
          }]}>
            {item.threatLevel.charAt(0).toUpperCase() + item.threatLevel.slice(1)}
          </Text>
        </View>
        <View style={[styles.scoreBadge, { backgroundColor: colors.background }]}>
          <Text style={[styles.scoreText, { color: colors.foreground }]}>
            Score: {item.score.toFixed(1)}
          </Text>
        </View>
        {item.userId && (
          <Text style={[styles.userId, { color: colors.muted }]} numberOfLines={1}>
            User: {item.userId.slice(0, 12)}...
          </Text>
        )}
      </View>

      {/* Threats detected */}
      {item.threats.length > 0 && (
        <View style={styles.threatsContainer}>
          <Text style={[styles.threatsLabel, { color: colors.muted }]}>Threats Detected:</Text>
          <View style={styles.threatTags}>
            {item.threats.slice(0, 4).map((threat, i) => (
              <View key={i} style={[styles.threatTag, { backgroundColor: colors.error + "12" }]}>
                <Text style={[styles.threatTagText, { color: colors.error }]} numberOfLines={1}>
                  {threat}
                </Text>
              </View>
            ))}
            {item.threats.length > 4 && (
              <Text style={[styles.moreThreats, { color: colors.muted }]}>
                +{item.threats.length - 4} more
              </Text>
            )}
          </View>
        </View>
      )}

      {/* Input preview */}
      <View style={[styles.inputPreview, { backgroundColor: colors.background }]}>
        <Text style={[styles.inputLabel, { color: colors.muted }]}>INPUT PREVIEW</Text>
        <Text style={[styles.inputText, { color: colors.foreground }]} numberOfLines={2}>
          {item.inputPreview || "(empty)"}
        </Text>
      </View>
    </View>
  );

  const renderFilterTab = (action: FilterAction, label: string) => {
    const count = action === "all" ? entries.length : entries.filter((e) => e.action === action).length;
    return (
      <TouchableOpacity
        style={[
          styles.filterTab,
          filter === action && { backgroundColor: colors.primary + "20", borderColor: colors.primary },
        ]}
        onPress={() => setFilter(action)}
        activeOpacity={0.7}
      >
        <Text style={[styles.filterLabel, { color: filter === action ? colors.primary : colors.muted }]}>
          {label}
        </Text>
        {count > 0 && (
          <View style={[styles.filterCount, { backgroundColor: filter === action ? colors.primary : colors.muted + "30" }]}>
            <Text style={[styles.filterCountText, { color: filter === action ? "#fff" : colors.muted }]}>
              {count}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  // Admin gate
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
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>AI Audit Log</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.emptyContainer}>
          <Ionicons name="lock-closed" size={64} color={colors.error + "60"} />
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Admin Access Required</Text>
          <Text style={[styles.emptySubtitle, { color: colors.muted }]}>
            This audit log is restricted to admin users. Enable admin access in Account Settings to view security events.
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
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>AI Audit Log</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Stats Summary */}
      {stats && (
        <View style={[styles.statsRow, { borderBottomColor: colors.border }]}>
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: colors.foreground }]}>{stats.totalRequests}</Text>
            <Text style={[styles.statLabel, { color: colors.muted }]}>Total</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: colors.error }]}>{stats.blockedRequests}</Text>
            <Text style={[styles.statLabel, { color: colors.muted }]}>Blocked (24h)</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: "#DC2626" }]}>{stats.bannedUsers}</Text>
            <Text style={[styles.statLabel, { color: colors.muted }]}>Banned</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: colors.warning }]}>{stats.recentThreats}</Text>
            <Text style={[styles.statLabel, { color: colors.muted }]}>Threats (24h)</Text>
          </View>
        </View>
      )}

      {/* Filter Tabs */}
      <View style={styles.filterRow}>
        {renderFilterTab("all", "All")}
        {renderFilterTab("blocked", "Blocked")}
        {renderFilterTab("warned", "Warned")}
        {renderFilterTab("banned", "Banned")}
        {renderFilterTab("allowed", "Allowed")}
      </View>

      {/* Entries List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.muted }]}>Loading audit log...</Text>
        </View>
      ) : filteredEntries.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="shield-checkmark" size={64} color={colors.success + "50"} />
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
            {filter === "all" ? "No Security Events" : `No ${filter} Events`}
          </Text>
          <Text style={[styles.emptySubtitle, { color: colors.muted }]}>
            {filter === "all"
              ? "No AI security events have been logged yet. Events appear when the guardrails detect threats."
              : `No events with action "${filter}" found in the log.`}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredEntries}
          renderItem={renderEntry}
          keyExtractor={(item, index) => `${item.timestamp}_${index}`}
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
    fontSize: 20,
    fontWeight: "700",
  },
  statLabel: {
    fontSize: 10,
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
  entryCard: {
    borderRadius: 12,
    padding: 14,
    borderWidth: 0.5,
    gap: 10,
  },
  entryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  actionBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  actionText: {
    fontSize: 11,
    fontWeight: "600",
  },
  timestamp: {
    fontSize: 11,
  },
  threatRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  threatBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  threatText: {
    fontSize: 11,
    fontWeight: "500",
  },
  scoreBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  scoreText: {
    fontSize: 11,
    fontWeight: "600",
  },
  userId: {
    fontSize: 10,
    flex: 1,
  },
  threatsContainer: {
    gap: 4,
  },
  threatsLabel: {
    fontSize: 10,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  threatTags: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
  },
  threatTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  threatTagText: {
    fontSize: 11,
    fontWeight: "500",
  },
  moreThreats: {
    fontSize: 11,
    alignSelf: "center",
  },
  inputPreview: {
    borderRadius: 8,
    padding: 10,
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: "600",
    marginBottom: 4,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  inputText: {
    fontSize: 12,
    lineHeight: 16,
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
