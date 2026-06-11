import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Platform,
  Switch,
  Alert,
  Modal,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import * as FileSystem from "expo-file-system/legacy";
import { ScreenContainer } from "@/components/screen-container";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Colors, Spacing, BorderRadius, FontSize } from "../constants/Colors";
import { trpc } from "@/lib/trpc";

// Offline pack storage directory
const PACKS_DIR = (FileSystem.documentDirectory || "") + "offline_packs/";

// Ensure the packs directory exists
async function ensurePacksDir() {
  if (Platform.OS === "web") return;
  const dirInfo = await FileSystem.getInfoAsync(PACKS_DIR);
  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(PACKS_DIR, { intermediates: true });
  }
}

// Check if a pack file exists on device
async function isPackOnDisk(packId: string): Promise<boolean> {
  if (Platform.OS === "web") return false;
  const path = PACKS_DIR + packId + ".json";
  const info = await FileSystem.getInfoAsync(path);
  return info.exists;
}

// Save pack data to device file system
async function savePackToDisk(packId: string, data: any): Promise<void> {
  if (Platform.OS === "web") return;
  await ensurePacksDir();
  const path = PACKS_DIR + packId + ".json";
  await FileSystem.writeAsStringAsync(path, JSON.stringify(data), {
    encoding: FileSystem.EncodingType.UTF8,
  });
}

// Read pack data from device file system
async function readPackFromDisk(packId: string): Promise<any | null> {
  if (Platform.OS === "web") return null;
  const path = PACKS_DIR + packId + ".json";
  const info = await FileSystem.getInfoAsync(path);
  if (!info.exists) return null;
  const content = await FileSystem.readAsStringAsync(path, {
    encoding: FileSystem.EncodingType.UTF8,
  });
  return JSON.parse(content);
}

// Delete pack from device file system
async function deletePackFromDisk(packId: string): Promise<void> {
  if (Platform.OS === "web") return;
  const path = PACKS_DIR + packId + ".json";
  const info = await FileSystem.getInfoAsync(path);
  if (info.exists) {
    await FileSystem.deleteAsync(path, { idempotent: true });
  }
}

// Get total size of all downloaded packs on disk
async function getPacksDiskUsage(): Promise<number> {
  if (Platform.OS === "web") return 0;
  try {
    await ensurePacksDir();
    const files = await FileSystem.readDirectoryAsync(PACKS_DIR);
    let totalBytes = 0;
    for (const file of files) {
      const info = await FileSystem.getInfoAsync(PACKS_DIR + file);
      if (info.exists && info.size) {
        totalBytes += info.size;
      }
    }
    return totalBytes;
  } catch {
    return 0;
  }
}

// Types
type QualityLevel = "basic" | "standard" | "full";

interface LanguagePack {
  id: string;
  language: string;
  code: string;
  sizes: {
    basic: number; // MB
    standard: number;
    full: number;
  };
  includes: string[];
  isDownloaded: boolean;
  downloadProgress: number; // 0-100
  currentQuality?: QualityLevel;
  lastUpdated?: string;
}

// Mock Data
const MOCK_PACKS: LanguagePack[] = [
  {
    id: "pack_es",
    language: "Spanish",
    code: "ES",
    sizes: { basic: 45, standard: 140, full: 480 },
    includes: ["Dictionary", "Phrasebook", "Grammar Rules", "Pronunciation Guide"],
    isDownloaded: true,
    downloadProgress: 100,
    currentQuality: "standard",
    lastUpdated: "2023-10-15",
  },
  {
    id: "pack_fr",
    language: "French",
    code: "FR",
    sizes: { basic: 50, standard: 150, full: 500 },
    includes: ["Dictionary", "Phrasebook", "Grammar Rules", "Pronunciation Guide"],
    isDownloaded: false,
    downloadProgress: 0,
  },
  {
    id: "pack_de",
    language: "German",
    code: "DE",
    sizes: { basic: 55, standard: 160, full: 520 },
    includes: ["Dictionary", "Phrasebook", "Grammar Rules", "Pronunciation Guide"],
    isDownloaded: false,
    downloadProgress: 0,
  },
  {
    id: "pack_ja",
    language: "Japanese",
    code: "JA",
    sizes: { basic: 60, standard: 180, full: 600 },
    includes: ["Dictionary", "Phrasebook", "Grammar Rules", "Pronunciation Guide", "Kanji Guide"],
    isDownloaded: true,
    downloadProgress: 100,
    currentQuality: "full",
    lastUpdated: "2023-10-20",
  },
  {
    id: "pack_zh",
    language: "Chinese (Mandarin)",
    code: "ZH",
    sizes: { basic: 65, standard: 190, full: 650 },
    includes: ["Dictionary", "Phrasebook", "Grammar Rules", "Pronunciation Guide", "Pinyin Guide"],
    isDownloaded: false,
    downloadProgress: 0,
  },
  {
    id: "pack_it",
    language: "Italian",
    code: "IT",
    sizes: { basic: 40, standard: 130, full: 450 },
    includes: ["Dictionary", "Phrasebook", "Grammar Rules", "Pronunciation Guide"],
    isDownloaded: false,
    downloadProgress: 0,
  },
  {
    id: "pack_ko",
    language: "Korean",
    code: "KO",
    sizes: { basic: 55, standard: 165, full: 550 },
    includes: ["Dictionary", "Phrasebook", "Grammar Rules", "Pronunciation Guide", "Hangul Guide"],
    isDownloaded: false,
    downloadProgress: 0,
  },
];

const TOTAL_STORAGE_MB = 10240; // 10 GB
const SYSTEM_STORAGE_MB = 2048; // 2 GB

export default function OfflineTranslationPacksScreen() {
  const [packs, setPacks] = useState<LanguagePack[]>(MOCK_PACKS);
  const [autoUpdate, setAutoUpdate] = useState(true);
  const [offlineMode, setOfflineMode] = useState(false);
  const [selectedPack, setSelectedPack] = useState<LanguagePack | null>(null);
  const [qualityModalVisible, setQualityModalVisible] = useState(false);
  const [selectedQuality, setSelectedQuality] = useState<QualityLevel>("standard");
  const [isInitializing, setIsInitializing] = useState(true);

  // Fetch real available packs from server
  const availablePacksQuery = trpc.translate.availablePacks.useQuery(undefined, {
    staleTime: 5 * 60 * 1000, // 5 min
  });

  // Load saved settings and verify packs on disk
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const savedAutoUpdate = await AsyncStorage.getItem("@offline_auto_update");
        const savedOfflineMode = await AsyncStorage.getItem("@offline_mode");
        const savedPacks = await AsyncStorage.getItem("@offline_packs");

        if (savedAutoUpdate !== null) setAutoUpdate(savedAutoUpdate === "true");
        if (savedOfflineMode !== null) setOfflineMode(savedOfflineMode === "true");
        if (savedPacks !== null) {
          const parsedPacks: LanguagePack[] = JSON.parse(savedPacks);
          // Verify each "downloaded" pack actually exists on disk
          const verified = await Promise.all(
            parsedPacks.map(async (p) => {
              if (p.isDownloaded && Platform.OS !== "web") {
                const exists = await isPackOnDisk(p.id);
                if (!exists) {
                  // Pack was marked downloaded but file is missing
                  return { ...p, isDownloaded: false, downloadProgress: 0, currentQuality: undefined, lastUpdated: undefined };
                }
              }
              return p;
            })
          );
          setPacks(verified);
        }
      } catch (error) {
        console.error("Failed to load settings", error);
      } finally {
        setIsInitializing(false);
      }
    };

    loadSettings();
  }, []);

  // Merge server packs into local state when query resolves
  useEffect(() => {
    if (availablePacksQuery.data?.packs && availablePacksQuery.data.packs.length > 0) {
      setPacks((prev) => {
        const serverPacks = availablePacksQuery.data!.packs;
        // Merge: if server has a pack not in local state, add it
        const merged = [...prev];
        for (const sp of serverPacks) {
          const existing = merged.find(
            (p) => p.language.toLowerCase() === sp.language.toLowerCase()
          );
          if (!existing) {
            merged.push({
              id: `pack_${sp.language.toLowerCase().replace(/\s/g, "_")}`,
              language: sp.language,
              code: sp.language.substring(0, 2).toUpperCase(),
              sizes: { basic: 30, standard: 90, full: 300 },
              includes: ["Slang Dictionary", `${sp.dialectCount} Dialects`, `${sp.totalEntries} Entries`],
              isDownloaded: false,
              downloadProgress: 0,
            });
          }
        }
        return merged;
      });
    }
  }, [availablePacksQuery.data]);

  // Save settings when they change
  useEffect(() => {
    if (isInitializing) return;

    const saveSettings = async () => {
      try {
        await AsyncStorage.setItem("@offline_auto_update", autoUpdate.toString());
        await AsyncStorage.setItem("@offline_mode", offlineMode.toString());
        await AsyncStorage.setItem("@offline_packs", JSON.stringify(packs));
      } catch (error) {
        console.error("Failed to save settings", error);
      }
    };

    saveSettings();
  }, [autoUpdate, offlineMode, packs, isInitializing]);

  // Calculate storage
  const usedStorageMB = packs.reduce((total, pack) => {
    if (pack.isDownloaded && pack.currentQuality) {
      return total + pack.sizes[pack.currentQuality];
    }
    return total;
  }, 0);

  const totalUsedMB = usedStorageMB + SYSTEM_STORAGE_MB;
  const storagePercentage = (totalUsedMB / TOTAL_STORAGE_MB) * 100;

  const handleToggleAutoUpdate = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setAutoUpdate(!autoUpdate);
  };

  const handleToggleOfflineMode = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setOfflineMode(!offlineMode);
  };

  const handleDownloadPress = (pack: LanguagePack) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedPack(pack);
    setSelectedQuality("standard");
    setQualityModalVisible(true);
  };

  // tRPC query for downloading a specific pack's data
  const offlinePackQuery = trpc.translate.offlinePack.useQuery(
    { language: selectedPack?.language || "" },
    { enabled: false } // manual fetch
  );

  const startDownload = async () => {
    if (!selectedPack) return;

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setQualityModalVisible(false);

    const packId = selectedPack.id;

    // Start progress
    setPacks((prevPacks) =>
      prevPacks.map((p) =>
        p.id === packId
          ? { ...p, downloadProgress: 5, currentQuality: selectedQuality }
          : p
      )
    );

    try {
      // Fetch pack data from server
      setPacks((prev) => prev.map((p) => p.id === packId ? { ...p, downloadProgress: 20 } : p));

      const result = await offlinePackQuery.refetch();
      const packData = result.data;

      setPacks((prev) => prev.map((p) => p.id === packId ? { ...p, downloadProgress: 60 } : p));

      if (packData && packData.success) {
        // Filter data based on quality level
        let dataToSave: any;
        if (selectedQuality === "basic") {
          // Basic: only first 50 entries per dialect
          dataToSave = {
            ...packData,
            dialects: packData.dialects.map((d: any) => ({
              ...d,
              entries: d.entries.slice(0, 50),
              count: Math.min(d.count, 50),
            })),
            quality: "basic",
            downloadedAt: Date.now(),
          };
        } else if (selectedQuality === "standard") {
          // Standard: first 200 entries per dialect
          dataToSave = {
            ...packData,
            dialects: packData.dialects.map((d: any) => ({
              ...d,
              entries: d.entries.slice(0, 200),
              count: Math.min(d.count, 200),
            })),
            quality: "standard",
            downloadedAt: Date.now(),
          };
        } else {
          // Full: all entries
          dataToSave = {
            ...packData,
            quality: "full",
            downloadedAt: Date.now(),
          };
        }

        setPacks((prev) => prev.map((p) => p.id === packId ? { ...p, downloadProgress: 80 } : p));

        // Persist to device file system
        await savePackToDisk(packId, dataToSave);

        setPacks((prev) => prev.map((p) => p.id === packId ? { ...p, downloadProgress: 95 } : p));

        // Mark as complete
        setPacks((prevPacks) =>
          prevPacks.map((p) =>
            p.id === packId
              ? {
                  ...p,
                  isDownloaded: true,
                  downloadProgress: 100,
                  lastUpdated: new Date().toISOString().split("T")[0],
                }
              : p
          )
        );
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        throw new Error("Failed to fetch pack data");
      }
    } catch (error: any) {
      console.error("Download failed:", error);
      // Reset progress on failure
      setPacks((prevPacks) =>
        prevPacks.map((p) =>
          p.id === packId
            ? { ...p, downloadProgress: 0, currentQuality: undefined }
            : p
        )
      );
      Alert.alert(
        "Download Failed",
        `Could not download ${selectedPack.language} pack. Please check your connection and try again.`,
        [{ text: "OK" }]
      );
    }
  };

  const handleDeletePress = (pack: LanguagePack) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      "Delete Language Pack",
      `Are you sure you want to delete the ${pack.language} offline pack? This will free up storage on your device.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            // Delete from device file system
            await deletePackFromDisk(pack.id);
            setPacks((prevPacks) =>
              prevPacks.map((p) =>
                p.id === pack.id
                  ? {
                      ...p,
                      isDownloaded: false,
                      downloadProgress: 0,
                      currentQuality: undefined,
                      lastUpdated: undefined,
                    }
                  : p
              )
            );
          },
        },
      ]
    );
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          router.back();
        }}
      >
        <Ionicons name="chevron-back" size={24} color={Colors.textPrimary} />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>Offline Packs</Text>
      <View style={styles.headerRight} />
    </View>
  );

  const renderStorageIndicator = () => (
    <View style={styles.storageContainer}>
      <View style={styles.storageHeader}>
        <Text style={styles.storageTitle}>Storage Usage</Text>
        <Text style={styles.storageText}>
          {(totalUsedMB / 1024).toFixed(1)} GB / {(TOTAL_STORAGE_MB / 1024).toFixed(1)} GB
        </Text>
      </View>
      <View style={styles.progressBarContainer}>
        <View
          style={[
            styles.progressBarFill,
            { width: `${(SYSTEM_STORAGE_MB / TOTAL_STORAGE_MB) * 100}%`, backgroundColor: Colors.textMuted },
          ]}
        />
        <View
          style={[
            styles.progressBarFill,
            {
              width: `${(usedStorageMB / TOTAL_STORAGE_MB) * 100}%`,
              backgroundColor: Colors.secondary,
              left: `${(SYSTEM_STORAGE_MB / TOTAL_STORAGE_MB) * 100}%`,
              position: "absolute",
            },
          ]}
        />
      </View>
      <View style={styles.storageLegend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: Colors.textMuted }]} />
          <Text style={styles.legendText}>System</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: Colors.secondary }]} />
          <Text style={styles.legendText}>Language Packs</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: Colors.surfaceCard }]} />
          <Text style={styles.legendText}>Free</Text>
        </View>
      </View>
    </View>
  );

  const renderSettings = () => (
    <View style={styles.settingsContainer}>
      <View style={styles.settingRow}>
        <View style={styles.settingInfo}>
          <Text style={styles.settingTitle}>Offline Mode</Text>
          <Text style={styles.settingDescription}>Force app to use offline packs only</Text>
        </View>
        <Switch
          value={offlineMode}
          onValueChange={handleToggleOfflineMode}
          trackColor={{ false: Colors.surfaceCard, true: Colors.secondary }}
          thumbColor={Colors.textPrimary}
        />
      </View>
      <View style={styles.settingDivider} />
      <View style={styles.settingRow}>
        <View style={styles.settingInfo}>
          <Text style={styles.settingTitle}>Auto-Update Packs</Text>
          <Text style={styles.settingDescription}>Update over Wi-Fi automatically</Text>
        </View>
        <Switch
          value={autoUpdate}
          onValueChange={handleToggleAutoUpdate}
          trackColor={{ false: Colors.surfaceCard, true: Colors.secondary }}
          thumbColor={Colors.textPrimary}
        />
      </View>
    </View>
  );

  const renderPackItem = ({ item }: { item: LanguagePack }) => {
    const isDownloading = item.downloadProgress > 0 && item.downloadProgress < 100;

    return (
      <View style={styles.packCard}>
        <View style={styles.packHeader}>
          <View style={styles.packInfo}>
            <View style={styles.packTitleRow}>
              <Text style={styles.packLanguage}>{item.language}</Text>
              {item.isDownloaded && (
                <View style={styles.badgeContainer}>
                  <Text style={styles.badgeText}>{item.currentQuality}</Text>
                </View>
              )}
            </View>
            <Text style={styles.packDetails}>
              {item.isDownloaded
                ? `${item.sizes[item.currentQuality!]} MB • Updated ${item.lastUpdated}`
                : `${item.sizes.basic} MB - ${item.sizes.full} MB`}
            </Text>
          </View>
          
          {isDownloading ? (
            <View style={styles.downloadingAction}>
              <Text style={styles.progressText}>{item.downloadProgress}%</Text>
              <ActivityIndicator size="small" color={Colors.secondary} />
            </View>
          ) : item.isDownloaded ? (
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => handleDeletePress(item)}
            >
              <Ionicons name="trash-outline" size={20} color={Colors.error} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.downloadButton}
              onPress={() => handleDownloadPress(item)}
            >
              <Ionicons name="cloud-download-outline" size={20} color={Colors.secondary} />
            </TouchableOpacity>
          )}
        </View>

        {isDownloading && (
          <View style={styles.downloadProgressBarContainer}>
            <View
              style={[
                styles.downloadProgressBarFill,
                { width: `${item.downloadProgress}%` },
              ]}
            />
          </View>
        )}

        <View style={styles.includesContainer}>
          <Text style={styles.includesTitle}>Includes:</Text>
          <View style={styles.tagsContainer}>
            {item.includes.map((include, index) => (
              <View key={index} style={styles.tag}>
                <Text style={styles.tagText}>{include}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>
    );
  };

  const renderQualityModal = () => (
    <Modal
      visible={qualityModalVisible}
      transparent
      animationType="slide"
      onRequestClose={() => setQualityModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Quality</Text>
            <TouchableOpacity
              onPress={() => setQualityModalVisible(false)}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={24} color={Colors.textMuted} />
            </TouchableOpacity>
          </View>

          <Text style={styles.modalSubtitle}>
            Choose download quality for {selectedPack?.language}
          </Text>

          <TouchableOpacity
            style={[
              styles.qualityOption,
              selectedQuality === "basic" && styles.qualityOptionSelected,
            ]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setSelectedQuality("basic");
            }}
          >
            <View style={styles.qualityOptionInfo}>
              <Text style={styles.qualityOptionTitle}>Basic</Text>
              <Text style={styles.qualityOptionDesc}>Essential vocabulary and phrases</Text>
            </View>
            <Text style={styles.qualityOptionSize}>{selectedPack?.sizes.basic} MB</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.qualityOption,
              selectedQuality === "standard" && styles.qualityOptionSelected,
            ]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setSelectedQuality("standard");
            }}
          >
            <View style={styles.qualityOptionInfo}>
              <Text style={styles.qualityOptionTitle}>Standard</Text>
              <Text style={styles.qualityOptionDesc}>Full dictionary and grammar rules</Text>
            </View>
            <Text style={styles.qualityOptionSize}>{selectedPack?.sizes.standard} MB</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.qualityOption,
              selectedQuality === "full" && styles.qualityOptionSelected,
            ]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setSelectedQuality("full");
            }}
          >
            <View style={styles.qualityOptionInfo}>
              <Text style={styles.qualityOptionTitle}>Full</Text>
              <Text style={styles.qualityOptionDesc}>Includes high-quality audio pronunciation</Text>
            </View>
            <Text style={styles.qualityOptionSize}>{selectedPack?.sizes.full} MB</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.confirmButton} onPress={startDownload}>
            <Text style={styles.confirmButtonText}>Download Pack</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  if (isInitializing) {
    return (
      <ScreenContainer edges={["top", "bottom", "left", "right"]} containerClassName="bg-background">
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.secondary} />
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer edges={["top", "bottom", "left", "right"]} containerClassName="bg-background">
      {renderHeader()}
      
      <FlatList
        data={packs}
        keyExtractor={(item) => item.id}
        renderItem={renderPackItem}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <>
            {renderStorageIndicator()}
            {renderSettings()}
            <Text style={styles.sectionTitle}>Available Packs</Text>
          </>
        }
        showsVerticalScrollIndicator={false}
      />

      {renderQualityModal()}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.primary,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.primary,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    padding: Spacing.xs,
  },
  headerTitle: {
    fontSize: FontSize.lg,
    fontWeight: "bold",
    color: Colors.textPrimary,
  },
  headerRight: {
    width: 32, // To balance the back button
  },
  listContent: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl,
    backgroundColor: Colors.primary,
  },
  storageContainer: {
    backgroundColor: Colors.surfaceCard,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  storageHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  storageTitle: {
    fontSize: FontSize.md,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  storageText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.sm,
    overflow: "hidden",
    marginBottom: Spacing.md,
    flexDirection: "row",
  },
  progressBarFill: {
    height: "100%",
    borderRadius: BorderRadius.sm,
  },
  storageLegend: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: Spacing.xs,
  },
  legendText: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
  },
  settingsContainer: {
    backgroundColor: Colors.surfaceCard,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  settingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: Spacing.sm,
  },
  settingInfo: {
    flex: 1,
    paddingRight: Spacing.md,
  },
  settingTitle: {
    fontSize: FontSize.md,
    fontWeight: "500",
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
  },
  settingDivider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: Spacing.xs,
  },
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: "bold",
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  packCard: {
    backgroundColor: Colors.surfaceCard,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  packHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: Spacing.sm,
  },
  packInfo: {
    flex: 1,
  },
  packTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  packLanguage: {
    fontSize: FontSize.md,
    fontWeight: "bold",
    color: Colors.textPrimary,
    marginRight: Spacing.sm,
  },
  badgeContainer: {
    backgroundColor: "rgba(0, 170, 255, 0.15)",
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: "rgba(0, 170, 255, 0.3)",
  },
  badgeText: {
    fontSize: FontSize.xs,
    color: Colors.secondary,
    textTransform: "capitalize",
    fontWeight: "600",
  },
  packDetails: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
  },
  downloadButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0, 170, 255, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(0, 170, 255, 0.3)",
  },
  deleteButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 59, 48, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 59, 48, 0.3)",
  },
  downloadingAction: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0, 170, 255, 0.1)",
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.md,
  },
  progressText: {
    fontSize: FontSize.sm,
    color: Colors.secondary,
    fontWeight: "bold",
    marginRight: Spacing.xs,
  },
  downloadProgressBarContainer: {
    height: 4,
    backgroundColor: Colors.primary,
    borderRadius: 2,
    overflow: "hidden",
    marginBottom: Spacing.sm,
  },
  downloadProgressBarFill: {
    height: "100%",
    backgroundColor: Colors.secondary,
    borderRadius: 2,
  },
  includesContainer: {
    marginTop: Spacing.xs,
  },
  includesTitle: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    marginBottom: Spacing.xs,
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.xs,
  },
  tag: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tagText: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(4, 8, 16, 0.8)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: Colors.surfaceCard,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    padding: Spacing.xl,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: Colors.border,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  modalTitle: {
    fontSize: FontSize.xl,
    fontWeight: "bold",
    color: Colors.textPrimary,
  },
  closeButton: {
    padding: Spacing.xs,
  },
  modalSubtitle: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    marginBottom: Spacing.xl,
  },
  qualityOption: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.md,
    backgroundColor: Colors.primary,
  },
  qualityOptionSelected: {
    borderColor: Colors.secondary,
    backgroundColor: "rgba(0, 170, 255, 0.05)",
  },
  qualityOptionInfo: {
    flex: 1,
    paddingRight: Spacing.md,
  },
  qualityOptionTitle: {
    fontSize: FontSize.md,
    fontWeight: "bold",
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  qualityOptionDesc: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
  },
  qualityOptionSize: {
    fontSize: FontSize.md,
    fontWeight: "600",
    color: Colors.secondary,
  },
  confirmButton: {
    backgroundColor: Colors.secondary,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    alignItems: "center",
    marginTop: Spacing.lg,
    shadowColor: Colors.glow,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 5,
  },
  confirmButtonText: {
    fontSize: FontSize.md,
    fontWeight: "bold",
    color: Colors.primary,
  },
});
