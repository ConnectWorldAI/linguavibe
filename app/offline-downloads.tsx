import React, { useState, useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Platform,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";

type DownloadItem = {
  id: string;
  title: string;
  type: "lesson" | "phrasebook" | "flashcards" | "song" | "course";
  icon: string;
  size: string;
  language: string;
  status: "downloaded" | "available" | "downloading";
  progress?: number;
};

const DOWNLOADS: DownloadItem[] = [
  { id: "1", title: "Spanish A2 - Unit 3", type: "lesson", icon: "📚", size: "12 MB", language: "Spanish", status: "downloaded" },
  { id: "2", title: "Barcelona Travel Pack", type: "phrasebook", icon: "✈️", size: "5 MB", language: "Spanish", status: "downloaded" },
  { id: "3", title: "Top 500 Vocab Cards", type: "flashcards", icon: "🃏", size: "3 MB", language: "Spanish", status: "downloaded" },
  { id: "4", title: "Despacito - Song Lesson", type: "song", icon: "🎵", size: "8 MB", language: "Spanish", status: "downloaded" },
  { id: "5", title: "French B1 - Unit 1", type: "lesson", icon: "📚", size: "15 MB", language: "French", status: "downloading", progress: 65 },
  { id: "6", title: "Paris Travel Pack", type: "phrasebook", icon: "✈️", size: "5 MB", language: "French", status: "available" },
  { id: "7", title: "Japanese Hiragana Course", type: "course", icon: "🎓", size: "45 MB", language: "Japanese", status: "available" },
  { id: "8", title: "Korean Basic Phrases", type: "phrasebook", icon: "✈️", size: "4 MB", language: "Korean", status: "available" },
  { id: "9", title: "JLPT N3 Flashcards", type: "flashcards", icon: "🃏", size: "6 MB", language: "Japanese", status: "available" },
];

export default function OfflineDownloadsScreen() {
  const colors = useColors();
  const [items, setItems] = useState(DOWNLOADS);
  const [batchDownloading, setBatchDownloading] = useState(false);
  const [batchProgress, setBatchProgress] = useState(0);
  const batchCancelledRef = useRef(false);

  const downloaded = items.filter((i) => i.status === "downloaded");
  const downloading = items.filter((i) => i.status === "downloading");
  const available = items.filter((i) => i.status === "available");
  const totalSize = downloaded.reduce((acc, i) => acc + parseInt(i.size), 0);

  const handleDownload = useCallback((id: string) => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setItems((prev) => prev.map((i) => i.id === id ? { ...i, status: "downloading" as const, progress: 0 } : i));

    // Simulate download progress
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 20 + 10;
      if (progress >= 100) {
        clearInterval(interval);
        setItems((prev) => prev.map((i) => i.id === id ? { ...i, status: "downloaded" as const, progress: undefined } : i));
      } else {
        setItems((prev) => prev.map((i) => i.id === id ? { ...i, progress: Math.min(Math.round(progress), 99) } : i));
      }
    }, 500);
  }, []);

  const handleDelete = useCallback((id: string) => {
    if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    setItems((prev) => prev.map((i) => i.id === id ? { ...i, status: "available" as const, progress: undefined } : i));
  }, []);

  const handleDownloadAll = useCallback(() => {
    const availableItems = items.filter((i) => i.status === "available");
    if (availableItems.length === 0) return;

    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setBatchDownloading(true);
    setBatchProgress(0);
    batchCancelledRef.current = false;

    // Queue all available items for sequential download
    const totalItems = availableItems.length;
    let completedItems = 0;

    // Mark all as downloading
    setItems((prev) =>
      prev.map((i) =>
        i.status === "available" ? { ...i, status: "downloading" as const, progress: 0 } : i
      )
    );

    const downloadNext = (index: number) => {
      if (batchCancelledRef.current || index >= totalItems) {
        setBatchDownloading(false);
        if (!batchCancelledRef.current && Platform.OS !== "web") {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
        return;
      }

      const item = availableItems[index];
      let progress = 0;

      const interval = setInterval(() => {
        if (batchCancelledRef.current) {
          clearInterval(interval);
          return;
        }
        progress += Math.random() * 25 + 10;
        if (progress >= 100) {
          clearInterval(interval);
          completedItems++;
          const overallProgress = Math.round((completedItems / totalItems) * 100);
          setBatchProgress(overallProgress);

          setItems((prev) =>
            prev.map((i) =>
              i.id === item.id ? { ...i, status: "downloaded" as const, progress: undefined } : i
            )
          );

          // Download next item
          downloadNext(index + 1);
        } else {
          const itemProgress = Math.min(Math.round(progress), 99);
          const overallProgress = Math.round(((completedItems + itemProgress / 100) / totalItems) * 100);
          setBatchProgress(overallProgress);
          setItems((prev) =>
            prev.map((i) => i.id === item.id ? { ...i, progress: itemProgress } : i)
          );
        }
      }, 400);
    };

    downloadNext(0);
  }, [items]);

  const handleCancelBatch = useCallback(() => {
    batchCancelledRef.current = true;
    setBatchDownloading(false);
    setBatchProgress(0);
    // Revert any still-downloading items back to available
    setItems((prev) =>
      prev.map((i) =>
        i.status === "downloading" ? { ...i, status: "available" as const, progress: undefined } : i
      )
    );
    if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  }, []);

  const renderItem = useCallback(({ item }: { item: DownloadItem }) => (
    <View style={[styles.itemCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.itemLeft}>
        <Text style={styles.itemIcon}>{item.icon}</Text>
        <View style={styles.itemInfo}>
          <Text style={[styles.itemTitle, { color: colors.foreground }]}>{item.title}</Text>
          <Text style={[styles.itemMeta, { color: colors.muted }]}>{item.language} • {item.size}</Text>
          {item.status === "downloading" && (
            <View style={styles.progressContainer}>
              <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
                <View style={[styles.progressFill, { backgroundColor: colors.primary, width: `${item.progress || 0}%` }]} />
              </View>
              <Text style={[styles.progressText, { color: colors.primary }]}>{item.progress}%</Text>
            </View>
          )}
        </View>
      </View>
      <View style={styles.itemActions}>
        {item.status === "downloaded" && (
          <TouchableOpacity onPress={() => handleDelete(item.id)} style={styles.deleteBtn}>
            <Ionicons name="trash-outline" size={18} color={colors.error} />
          </TouchableOpacity>
        )}
        {item.status === "available" && (
          <TouchableOpacity onPress={() => handleDownload(item.id)} style={[styles.downloadBtn, { backgroundColor: colors.primary }]}>
            <Ionicons name="download" size={14} color="#FFF" />
          </TouchableOpacity>
        )}
        {item.status === "downloading" && (
          <View style={[styles.cancelBtn, { borderColor: colors.border }]}>
            <Ionicons name="hourglass-outline" size={14} color={colors.muted} />
          </View>
        )}
      </View>
    </View>
  ), [colors, handleDownload, handleDelete]);

  const keyExtractor = useCallback((item: DownloadItem) => item.id, []);

  const ListHeader = () => (
    <>
      {/* Storage Summary */}
      <View style={[styles.storageCard, { backgroundColor: colors.primary + "10", borderColor: colors.primary + "30" }]}>
        <View style={styles.storageTop}>
          <Ionicons name="phone-portrait" size={20} color={colors.primary} />
          <View style={styles.storageInfo}>
            <Text style={[styles.storageTitle, { color: colors.foreground }]}>Storage Used</Text>
            <Text style={[styles.storageValue, { color: colors.primary }]}>{totalSize} MB</Text>
          </View>
          <Text style={[styles.storageTotal, { color: colors.muted }]}>of 500 MB</Text>
        </View>
        <View style={[styles.storageBar, { backgroundColor: colors.border }]}>
          <View style={[styles.storageFill, { backgroundColor: colors.primary, width: `${(totalSize / 500) * 100}%` }]} />
        </View>
      </View>

      {/* Download All Banner */}
      {available.length > 0 && (
        <View style={[styles.downloadAllCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {batchDownloading ? (
            <>
              <View style={styles.batchProgressHeader}>
                <Text style={[styles.batchProgressTitle, { color: colors.foreground }]}>
                  Downloading All...
                </Text>
                <TouchableOpacity onPress={handleCancelBatch} style={styles.batchCancelBtn}>
                  <Ionicons name="close-circle" size={20} color={colors.error} />
                </TouchableOpacity>
              </View>
              <View style={[styles.batchProgressBar, { backgroundColor: colors.border }]}>
                <View style={[styles.batchProgressFill, { backgroundColor: colors.primary, width: `${batchProgress}%` }]} />
              </View>
              <Text style={[styles.batchProgressText, { color: colors.muted }]}>
                {batchProgress}% complete
              </Text>
            </>
          ) : (
            <TouchableOpacity
              style={[styles.downloadAllBtn, { backgroundColor: colors.primary }]}
              onPress={handleDownloadAll}
              activeOpacity={0.8}
            >
              <Ionicons name="cloud-download" size={18} color="#FFF" />
              <Text style={styles.downloadAllBtnText}>
                Download All ({available.length} packs)
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Downloading Section */}
      {downloading.length > 0 && (
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Downloading</Text>
      )}
    </>
  );

  // Combine all items in display order: downloading → downloaded → available
  const allItems = [...downloading, ...downloaded, ...available];

  // Section separators are handled via item indices
  const getSectionLabel = (index: number): string | null => {
    if (index === downloading.length && downloaded.length > 0) return `Downloaded (${downloaded.length})`;
    if (index === downloading.length + downloaded.length && available.length > 0) return "Available for Download";
    return null;
  };

  const renderItemWithSection = useCallback(({ item, index }: { item: DownloadItem; index: number }) => {
    const sectionLabel = getSectionLabel(index);
    return (
      <>
        {sectionLabel && (
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>{sectionLabel}</Text>
            {sectionLabel.startsWith("Downloaded") && downloaded.length > 0 && (
              <TouchableOpacity>
                <Text style={[styles.clearAll, { color: colors.error }]}>Clear All</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
        {renderItem({ item })}
      </>
    );
  }, [colors, downloading.length, downloaded.length, available.length, renderItem]);

  return (
    <ScreenContainer edges={["top", "left", "right"]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Offline Downloads</Text>
        <View style={{ width: 32 }} />
      </View>

      <FlatList
        data={allItems}
        keyExtractor={keyExtractor}
        renderItem={renderItemWithSection}
        ListHeaderComponent={ListHeader}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 0.5 },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 17, fontWeight: "700" },
  content: { padding: 16, paddingBottom: 100 },
  storageCard: { padding: 14, borderRadius: 12, borderWidth: 1, marginBottom: 16 },
  storageTop: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 10 },
  storageInfo: { flex: 1 },
  storageTitle: { fontSize: 13, fontWeight: "600" },
  storageValue: { fontSize: 18, fontWeight: "800" },
  storageTotal: { fontSize: 12 },
  storageBar: { height: 6, borderRadius: 3, overflow: "hidden" },
  storageFill: { height: "100%", borderRadius: 3 },
  // Download All
  downloadAllCard: { padding: 14, borderRadius: 12, borderWidth: 1, marginBottom: 20 },
  downloadAllBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 14, borderRadius: 10 },
  downloadAllBtnText: { fontSize: 15, fontWeight: "700", color: "#FFF" },
  batchProgressHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 },
  batchProgressTitle: { fontSize: 14, fontWeight: "700" },
  batchCancelBtn: { padding: 4 },
  batchProgressBar: { height: 6, borderRadius: 3, overflow: "hidden", marginBottom: 6 },
  batchProgressFill: { height: "100%", borderRadius: 3 },
  batchProgressText: { fontSize: 12, textAlign: "center" },
  // Section
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10, marginTop: 4 },
  sectionTitle: { fontSize: 16, fontWeight: "700", marginBottom: 10 },
  clearAll: { fontSize: 12, fontWeight: "600" },
  // Item card
  itemCard: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 12, borderRadius: 10, borderWidth: 1, marginBottom: 8 },
  itemLeft: { flexDirection: "row", alignItems: "center", gap: 10, flex: 1 },
  itemIcon: { fontSize: 24 },
  itemInfo: { flex: 1 },
  itemTitle: { fontSize: 14, fontWeight: "600" },
  itemMeta: { fontSize: 11, marginTop: 2 },
  progressContainer: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 6 },
  progressBar: { flex: 1, height: 4, borderRadius: 2, overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 2 },
  progressText: { fontSize: 10, fontWeight: "700" },
  itemActions: {},
  deleteBtn: { padding: 6 },
  downloadBtn: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  cancelBtn: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center", borderWidth: 1 },
});
