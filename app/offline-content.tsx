import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Platform,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Colors, Spacing, BorderRadius, FontSize } from "../constants/Colors";
import {
  getCacheIndex,
  getCacheStats,
  getCacheSettings,
  updateCacheSettings,
  cacheContent,
  removeCachedContent,
  clearAllCache,
  getRecommendedDownloads,
  type CachedItem,
  type CacheSettings,
  type LessonContent,
  type DownloadProgress,
} from "@/lib/offline-cache-manager";
import { FeatureGateBanner } from "@/components/feature-gate-banner";

const OFFLINE_KEY = "@offline_downloads";

type DownloadStatus = "available" | "downloading" | "downloaded" | "error";

type OfflineItem = {
  id: string;
  title: string;
  subtitle: string;
  type: "course" | "lesson" | "flashcards" | "phrasebook";
  size: string;
  status: DownloadStatus;
  progress?: number;
  icon: string;
};

const AVAILABLE_DOWNLOADS: OfflineItem[] = [
  { id: "1", title: "Dominican Spanish Basics", subtitle: "12 lessons • Audio + Text", type: "course", size: "45 MB", status: "downloaded", icon: "book" },
  { id: "2", title: "Business English", subtitle: "8 lessons • Video + Audio", type: "course", size: "120 MB", status: "downloaded", icon: "briefcase" },
  { id: "3", title: "Travel Phrasebook", subtitle: "200 phrases • 5 languages", type: "phrasebook", size: "8 MB", status: "downloaded", icon: "airplane" },
  { id: "4", title: "Flashcard Deck: Food & Dining", subtitle: "85 cards with audio", type: "flashcards", size: "12 MB", status: "available", icon: "restaurant" },
  { id: "5", title: "French Conversation", subtitle: "15 lessons • Audio", type: "course", size: "67 MB", status: "available", icon: "chatbubbles" },
  { id: "6", title: "Korean Hangul Writing", subtitle: "10 lessons • Interactive", type: "course", size: "34 MB", status: "available", icon: "pencil" },
  { id: "7", title: "Flashcard Deck: Tech Terms", subtitle: "120 cards", type: "flashcards", size: "5 MB", status: "available", icon: "code-slash" },
  { id: "8", title: "Emergency Phrases", subtitle: "50 phrases • 10 languages", type: "phrasebook", size: "3 MB", status: "available", icon: "medkit" },
];

export default function OfflineContentScreen() {
  const [items, setItems] = useState<OfflineItem[]>(AVAILABLE_DOWNLOADS);
  const [isOffline, setIsOffline] = useState(false);
  const [cacheStats, setCacheStats] = useState<{ totalItems: number; totalSizeMB: number; maxSizeMB: number; usagePercent: number } | null>(null);
  const [settings, setSettings] = useState<CacheSettings | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [recommendations, setRecommendations] = useState<{ id: string; title: string; reason: string }[]>([]);

  useEffect(() => {
    loadDownloadState();
    loadCacheData();
  }, []);

  const loadCacheData = async () => {
    try {
      const [stats, prefs] = await Promise.all([getCacheStats(), getCacheSettings()]);
      setCacheStats(stats);
      setSettings(prefs);
      const recs = getRecommendedDownloads("A2", "Spanish", items.filter(i => i.status === "downloaded").map(i => i.id));
      setRecommendations(recs);
    } catch {}
  };

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadCacheData();
    await loadDownloadState();
    setRefreshing(false);
  }, []);

  const toggleAutoDownload = async () => {
    if (!settings) return;
    const updated = await updateCacheSettings({ autoDownload: !settings.autoDownload });
    setSettings(updated);
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleClearAll = () => {
    Alert.alert("Clear All Downloads", "This will remove all offline content. You can re-download anytime.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Clear All",
        style: "destructive",
        onPress: async () => {
          await clearAllCache();
          setItems(prev => prev.map(i => ({ ...i, status: "available" as DownloadStatus, progress: undefined })));
          await loadCacheData();
          if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        },
      },
    ]);
  };

  const loadDownloadState = async () => {
    try {
      const stored = await AsyncStorage.getItem(OFFLINE_KEY);
      if (stored) {
        const downloadedIds: string[] = JSON.parse(stored);
        setItems((prev) =>
          prev.map((item) => ({
            ...item,
            status: downloadedIds.includes(item.id) ? "downloaded" : item.status,
          }))
        );
      }
    } catch {}
  };

  const saveDownloadState = async (updatedItems: OfflineItem[]) => {
    const downloadedIds = updatedItems.filter((i) => i.status === "downloaded").map((i) => i.id);
    await AsyncStorage.setItem(OFFLINE_KEY, JSON.stringify(downloadedIds));
  };

  const handleDownload = async (id: string) => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // Simulate download
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: "downloading" as DownloadStatus, progress: 0 } : item))
    );

    // Simulate progress
    for (let p = 0; p <= 100; p += 20) {
      await new Promise((r) => setTimeout(r, 300));
      setItems((prev) =>
        prev.map((item) => (item.id === id ? { ...item, progress: p } : item))
      );
    }

    const updated = items.map((item) =>
      item.id === id ? { ...item, status: "downloaded" as DownloadStatus, progress: 100 } : item
    );
    setItems(updated);
    await saveDownloadState(updated);
    if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleDelete = (id: string) => {
    Alert.alert("Remove Download", "This will free up storage space. You can re-download anytime.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: async () => {
          const updated = items.map((item) =>
            item.id === id ? { ...item, status: "available" as DownloadStatus, progress: undefined } : item
          );
          setItems(updated);
          await saveDownloadState(updated);
        },
      },
    ]);
  };

  const downloadedItems = items.filter((i) => i.status === "downloaded");
  const availableItems = items.filter((i) => i.status === "available" || i.status === "downloading");
  const totalSize = downloadedItems.reduce((acc, i) => acc + parseInt(i.size), 0);

  const renderItem = ({ item }: { item: OfflineItem }) => (
    <View style={styles.itemCard}>
      <View style={[styles.itemIcon, item.status === "downloaded" && styles.itemIconDownloaded]}>
        <Ionicons name={item.icon as any} size={20} color={item.status === "downloaded" ? Colors.success : Colors.textSecondary} />
      </View>
      <View style={styles.itemInfo}>
        <Text style={styles.itemTitle}>{item.title}</Text>
        <Text style={styles.itemSubtitle}>{item.subtitle}</Text>
        <View style={styles.itemMeta}>
          <Text style={styles.itemSize}>{item.size}</Text>
          {item.status === "downloaded" && (
            <View style={styles.offlineBadge}>
              <Ionicons name="checkmark-circle" size={12} color={Colors.success} />
              <Text style={styles.offlineBadgeText}>Available Offline</Text>
            </View>
          )}
        </View>
        {item.status === "downloading" && (
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${item.progress || 0}%` }]} />
          </View>
        )}
      </View>
      <View style={styles.itemAction}>
        {item.status === "available" && (
          <TouchableOpacity style={styles.downloadBtn} onPress={() => handleDownload(item.id)}>
            <Ionicons name="cloud-download" size={20} color={Colors.secondary} />
          </TouchableOpacity>
        )}
        {item.status === "downloading" && (
          <Text style={styles.progressText}>{item.progress}%</Text>
        )}
        {item.status === "downloaded" && (
          <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(item.id)}>
            <Ionicons name="trash-outline" size={18} color={Colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Offline Content</Text>
        <View style={{ width: 36 }} />
      </View>

      <FeatureGateBanner feature="offline_downloads" />

      {/* Offline Banner */}
      {isOffline && (
        <View style={styles.offlineBanner}>
          <Ionicons name="cloud-offline" size={18} color={Colors.warning} />
          <Text style={styles.offlineBannerText}>You're offline. Only downloaded content is available.</Text>
        </View>
      )}

      {/* Storage Summary with Cache Stats */}
      <View style={styles.storageCard}>
        <View style={styles.storageLeft}>
          <Ionicons name="folder" size={24} color={Colors.secondary} />
          <View>
            <Text style={styles.storageTitle}>{downloadedItems.length} items downloaded</Text>
            <Text style={styles.storageSize}>
              {cacheStats ? `${cacheStats.totalSizeMB} / ${cacheStats.maxSizeMB} MB` : `${totalSize} MB used`}
            </Text>
            {cacheStats && (
              <View style={styles.cacheBar}>
                <View style={[styles.cacheBarFill, { width: `${Math.min(cacheStats.usagePercent, 100)}%` }]} />
              </View>
            )}
          </View>
        </View>
        <View style={styles.storageActions}>
          <TouchableOpacity style={styles.simulateBtn} onPress={() => setIsOffline(!isOffline)}>
            <Ionicons name={isOffline ? "wifi" : "cloud-offline"} size={16} color={Colors.textPrimary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.simulateBtn} onPress={handleClearAll}>
            <Ionicons name="trash-outline" size={16} color={Colors.error} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Auto-Download Toggle */}
      {settings && (
        <TouchableOpacity style={styles.autoDownloadRow} onPress={toggleAutoDownload}>
          <Ionicons name={settings.autoDownload ? "cloud-done" : "cloud-outline"} size={20} color={settings.autoDownload ? Colors.success : Colors.textSecondary} />
          <View style={{ flex: 1 }}>
            <Text style={styles.autoDownloadTitle}>Auto-Download on WiFi</Text>
            <Text style={styles.autoDownloadSub}>Automatically cache recommended lessons when connected to WiFi</Text>
          </View>
          <View style={[styles.toggleDot, settings.autoDownload && styles.toggleDotActive]} />
        </TouchableOpacity>
      )}

      {/* Recommended Downloads */}
      {recommendations.length > 0 && !isOffline && (
        <View style={styles.recsSection}>
          <Text style={styles.sectionLabel}>RECOMMENDED FOR YOU</Text>
          {recommendations.slice(0, 3).map((rec) => (
            <View key={rec.id} style={styles.recCard}>
              <Ionicons name="sparkles" size={16} color={Colors.secondary} />
              <View style={{ flex: 1 }}>
                <Text style={styles.recTitle}>{rec.title}</Text>
                <Text style={styles.recReason}>{rec.reason}</Text>
              </View>
              <TouchableOpacity style={styles.downloadBtn}>
                <Ionicons name="cloud-download" size={18} color={Colors.secondary} />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      <FlatList
        data={[...downloadedItems, ...availableItems]}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          downloadedItems.length > 0 ? (
            <Text style={styles.sectionLabel}>DOWNLOADED ({downloadedItems.length})</Text>
          ) : null
        }
        ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
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
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surfaceCard,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  headerTitle: {
    fontSize: FontSize.xl,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  offlineBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    padding: 12,
    backgroundColor: Colors.warning + "15",
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.yellowBorder,
  },
  offlineBannerText: {
    flex: 1,
    fontSize: FontSize.sm,
    color: Colors.warning,
    fontWeight: "500",
  },
  storageCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
    padding: Spacing.md,
    backgroundColor: Colors.surfaceCard,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  storageLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  storageTitle: {
    fontSize: FontSize.sm,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  storageSize: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  simulateBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: Colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  simulateBtnText: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    fontWeight: "500",
  },
  listContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: 100,
  },
  sectionLabel: {
    fontSize: FontSize.xs,
    fontWeight: "700",
    color: Colors.textSecondary,
    letterSpacing: 1,
    marginBottom: 12,
  },
  itemCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surfaceCard,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 12,
  },
  itemIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  itemIconDownloaded: {
    backgroundColor: Colors.success + "15",
    borderColor: Colors.greenBorder,
  },
  itemInfo: {
    flex: 1,
    gap: 2,
  },
  itemTitle: {
    fontSize: FontSize.sm,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  itemSubtitle: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
  },
  itemMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 4,
  },
  itemSize: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
  },
  offlineBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  offlineBadgeText: {
    fontSize: 10,
    color: Colors.success,
    fontWeight: "500",
  },
  progressBar: {
    height: 3,
    backgroundColor: Colors.border,
    borderRadius: 2,
    marginTop: 6,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: Colors.secondary,
    borderRadius: 2,
  },
  itemAction: {
    width: 36,
    alignItems: "center",
  },
  downloadBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.secondary + "15",
    alignItems: "center",
    justifyContent: "center",
  },
  deleteBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  progressText: {
    fontSize: FontSize.xs,
    color: Colors.secondary,
    fontWeight: "600",
  },
  storageActions: {
    flexDirection: "row",
    gap: 8,
  },
  cacheBar: {
    height: 3,
    backgroundColor: Colors.border,
    borderRadius: 2,
    marginTop: 6,
    width: 100,
    overflow: "hidden",
  },
  cacheBarFill: {
    height: "100%",
    backgroundColor: Colors.secondary,
    borderRadius: 2,
  },
  autoDownloadRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    padding: 12,
    backgroundColor: Colors.surfaceCard,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  autoDownloadTitle: {
    fontSize: FontSize.sm,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  autoDownloadSub: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  toggleDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: Colors.border,
  },
  toggleDotActive: {
    backgroundColor: Colors.success,
    borderColor: Colors.success,
  },
  recsSection: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
  recCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 10,
    backgroundColor: Colors.secondary + "08",
    borderRadius: BorderRadius.md,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: Colors.secondary + "20",
  },
  recTitle: {
    fontSize: FontSize.sm,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  recReason: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 1,
  },
});
