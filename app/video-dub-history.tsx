import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Colors, Spacing, BorderRadius, FontSize } from "../constants/Colors";
import { useSubscription, VIDEO_DUB_MONTHLY_LIMITS } from "@/hooks/use-subscription";

const VIDEO_DUB_HISTORY_KEY = "@video_dub_history";
const VIDEO_DUB_USAGE_KEY = "@video_dub_usage";

interface DubHistoryItem {
  id: string;
  videoName: string;
  sourceLanguage: string;
  targetLanguage: string;
  sourceLangName: string;
  targetLangName: string;
  sourceFlag: string;
  targetFlag: string;
  date: string;
  duration: string;
}

export default function VideoDubHistoryScreen() {
  const { plan } = useSubscription();
  const monthlyLimit = VIDEO_DUB_MONTHLY_LIMITS[plan];
  const [history, setHistory] = useState<DubHistoryItem[]>([]);
  const [usageCount, setUsageCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [historyRaw, usageRaw] = await Promise.all([
        AsyncStorage.getItem(VIDEO_DUB_HISTORY_KEY),
        AsyncStorage.getItem(VIDEO_DUB_USAGE_KEY),
      ]);

      if (historyRaw) {
        setHistory(JSON.parse(historyRaw));
      }

      if (usageRaw) {
        const usage = JSON.parse(usageRaw);
        const currentMonth = new Date().toISOString().slice(0, 7);
        setUsageCount(usage.month === currentMonth ? usage.count : 0);
      }
    } catch {} finally {
      setIsLoading(false);
    }
  };

  const handleClearHistory = () => {
    Alert.alert(
      "Clear History",
      "This will remove all dub history. Your monthly usage count will not be affected.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear",
          style: "destructive",
          onPress: async () => {
            await AsyncStorage.removeItem(VIDEO_DUB_HISTORY_KEY);
            setHistory([]);
          },
        },
      ]
    );
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const renderItem = useCallback(({ item }: { item: DubHistoryItem }) => (
    <TouchableOpacity
      style={styles.historyCard}
      activeOpacity={0.7}
      onPress={() => {
        // Navigate back to video-translate with this item's settings
        router.push("/video-translate" as any);
      }}
    >
      <View style={styles.cardLeft}>
        <View style={styles.cardIcon}>
          <Ionicons name="film" size={20} color={Colors.secondary} />
        </View>
      </View>
      <View style={styles.cardCenter}>
        <Text style={styles.cardTitle} numberOfLines={1}>{item.videoName}</Text>
        <View style={styles.cardLangRow}>
          <Text style={styles.cardLang}>{item.sourceFlag} {item.sourceLangName}</Text>
          <Ionicons name="arrow-forward" size={12} color={Colors.textMuted} />
          <Text style={styles.cardLang}>{item.targetFlag} {item.targetLangName}</Text>
        </View>
        <View style={styles.cardMeta}>
          <Text style={styles.cardMetaText}>{item.duration}</Text>
          <Text style={styles.cardMetaDot}>•</Text>
          <Text style={styles.cardMetaText}>{formatDate(item.date)}</Text>
        </View>
      </View>
      <View style={styles.cardRight}>
        <Ionicons name="play-circle" size={28} color={Colors.secondary} />
      </View>
    </TouchableOpacity>
  ), []);

  const renderEmpty = () => (
    <View style={styles.emptyState}>
      <View style={styles.emptyIcon}>
        <Ionicons name="film-outline" size={48} color={Colors.textMuted} />
      </View>
      <Text style={styles.emptyTitle}>No Dubs Yet</Text>
      <Text style={styles.emptySubtitle}>
        Your translated videos will appear here after you dub your first video.
      </Text>
      <TouchableOpacity
        style={styles.emptyBtn}
        onPress={() => router.push("/video-translate" as any)}
      >
        <Ionicons name="add" size={18} color="#FFFFFF" />
        <Text style={styles.emptyBtnText}>Dub a Video</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Dub History</Text>
          <Text style={styles.headerSubtitle}>Your translated videos</Text>
        </View>
        {history.length > 0 ? (
          <TouchableOpacity style={styles.clearBtn} onPress={handleClearHistory}>
            <Ionicons name="trash-outline" size={20} color={Colors.error} />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 40 }} />
        )}
      </View>

      {/* Usage Summary */}
      <View style={styles.usageSummary}>
        <View style={styles.usageRow}>
          <View style={styles.usageStat}>
            <Text style={styles.usageNumber}>{usageCount}</Text>
            <Text style={styles.usageLabel}>Used this month</Text>
          </View>
          <View style={styles.usageDivider} />
          <View style={styles.usageStat}>
            <Text style={styles.usageNumber}>
              {monthlyLimit === -1 ? "∞" : monthlyLimit}
            </Text>
            <Text style={styles.usageLabel}>Monthly limit</Text>
          </View>
          <View style={styles.usageDivider} />
          <View style={styles.usageStat}>
            <Text style={[styles.usageNumber, { color: monthlyLimit !== -1 && usageCount >= monthlyLimit ? Colors.error : Colors.success }]}>
              {monthlyLimit === -1 ? "∞" : Math.max(0, monthlyLimit - usageCount)}
            </Text>
            <Text style={styles.usageLabel}>Remaining</Text>
          </View>
        </View>
        {monthlyLimit !== -1 && (
          <View style={styles.usageBarWrap}>
            <View style={styles.usageBar}>
              <View
                style={[
                  styles.usageBarFill,
                  {
                    width: `${Math.min((usageCount / monthlyLimit) * 100, 100)}%`,
                    backgroundColor: usageCount >= monthlyLimit ? Colors.error : usageCount >= monthlyLimit * 0.8 ? Colors.warning : Colors.secondary,
                  },
                ]}
              />
            </View>
          </View>
        )}
        <View style={styles.planBadgeRow}>
          <View style={styles.planBadge}>
            <Text style={styles.planBadgeText}>{plan.charAt(0).toUpperCase() + plan.slice(1)} Plan</Text>
          </View>
          {monthlyLimit !== -1 && usageCount >= monthlyLimit && (
            <TouchableOpacity onPress={() => router.push("/subscription" as any)}>
              <Text style={styles.upgradeText}>Upgrade for more →</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* History List */}
      <FlatList
        data={history}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ListEmptyComponent={isLoading ? null : renderEmpty}
        contentContainerStyle={history.length === 0 ? styles.emptyContainer : styles.listContainer}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.backgroundDark,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surfaceCard,
    alignItems: "center",
    justifyContent: "center",
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
  },
  headerTitle: {
    fontSize: FontSize.lg,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  headerSubtitle: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    marginTop: 2,
  },
  clearBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(239, 68, 68, 0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  usageSummary: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    backgroundColor: Colors.surfaceCard,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  usageRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
  },
  usageStat: {
    alignItems: "center",
    flex: 1,
  },
  usageNumber: {
    fontSize: 24,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  usageLabel: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    marginTop: 4,
  },
  usageDivider: {
    width: 1,
    height: 32,
    backgroundColor: Colors.border,
  },
  usageBarWrap: {
    marginTop: Spacing.md,
  },
  usageBar: {
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.surfaceElevated,
    overflow: "hidden",
  },
  usageBarFill: {
    height: "100%",
    borderRadius: 3,
  },
  planBadgeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: Spacing.sm,
  },
  planBadge: {
    backgroundColor: "rgba(168, 85, 247, 0.1)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  planBadgeText: {
    fontSize: FontSize.xs,
    fontWeight: "600",
    color: Colors.secondary,
  },
  upgradeText: {
    fontSize: FontSize.xs,
    fontWeight: "600",
    color: Colors.secondary,
  },
  listContainer: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: 100,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: Spacing.xl,
  },
  historyCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surfaceCard,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardLeft: {
    marginRight: Spacing.md,
  },
  cardIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "rgba(168, 85, 247, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  cardCenter: {
    flex: 1,
  },
  cardTitle: {
    fontSize: FontSize.sm,
    fontWeight: "600",
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  cardLangRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
  },
  cardLang: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
  },
  cardMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  cardMetaText: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  cardMetaDot: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  cardRight: {
    marginLeft: Spacing.sm,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: Spacing.xl,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.surfaceCard,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.lg,
  },
  emptyTitle: {
    fontSize: FontSize.lg,
    fontWeight: "700",
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  emptySubtitle: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: Spacing.lg,
  },
  emptyBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Colors.secondary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: BorderRadius.full,
  },
  emptyBtnText: {
    fontSize: FontSize.sm,
    fontWeight: "600",
    color: "#FFFFFF",
  },
});
