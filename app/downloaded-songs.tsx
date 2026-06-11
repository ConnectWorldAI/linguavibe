import React from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import { usePlaylist, type PlaylistSong } from "@/lib/playlist-store";

const Colors = {
  primary: "#0A0E1A",
  surface: "#141825",
  surfaceElevated: "#1C2235",
  secondary: "#00AAFF",
  textPrimary: "#FFFFFF",
  textSecondary: "#8A9BB0",
  textMuted: "#5A6A7A",
  border: "rgba(255,255,255,0.06)",
  success: "#00E676",
  accent: "#FF2D55",
};

export default function DownloadedSongsScreen() {
  const { downloads, removeDownload } = usePlaylist();

  const handleRemoveDownload = (song: PlaylistSong) => {
    Alert.alert(
      "Remove Download",
      `Remove "${song.title}" from downloads? The file will be deleted from your device.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: () => {
            if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            removeDownload(song.id);
          },
        },
      ]
    );
  };

  const handlePlay = (song: PlaylistSong) => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({
      pathname: "/song-player",
      params: { title: song.title, artist: song.artist },
    } as any);
  };

  const renderSongItem = ({ item, index }: { item: PlaylistSong; index: number }) => (
    <TouchableOpacity
      style={styles.songRow}
      onPress={() => handlePlay(item)}
      activeOpacity={0.7}
    >
      <View style={styles.songArt}>
        <Ionicons name="musical-notes" size={20} color={Colors.success} />
      </View>
      <View style={styles.songInfo}>
        <Text style={styles.songTitle} numberOfLines={1}>{item.title}</Text>
        <Text style={styles.songArtist} numberOfLines={1}>
          {item.artist || "Unknown"} {item.duration ? `• ${item.duration}` : ""}
        </Text>
      </View>
      <View style={styles.songActions}>
        <View style={styles.downloadedBadge}>
          <Ionicons name="checkmark-circle" size={16} color={Colors.success} />
        </View>
        <TouchableOpacity
          onPress={() => handleRemoveDownload(item)}
          style={styles.moreBtn}
        >
          <Ionicons name="ellipsis-horizontal" size={18} color={Colors.textMuted} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Downloads</Text>
        <View style={styles.backBtn} />
      </View>

      {/* Stats Bar */}
      <View style={styles.statsBar}>
        <View style={styles.statItem}>
          <Ionicons name="arrow-down-circle" size={18} color={Colors.success} />
          <Text style={styles.statText}>{downloads.length} songs</Text>
        </View>
        <Text style={styles.statDivider}>•</Text>
        <Text style={styles.statText}>Available offline</Text>
      </View>

      {downloads.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={styles.emptyIcon}>
            <Ionicons name="cloud-download-outline" size={56} color={Colors.textMuted} />
          </View>
          <Text style={styles.emptyTitle}>No Downloads</Text>
          <Text style={styles.emptySubtitle}>
            Download songs to listen offline without an internet connection.
          </Text>
          <TouchableOpacity
            style={styles.browseBtn}
            onPress={() => router.back()}
          >
            <Text style={styles.browseBtnText}>Browse Songs</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={downloads}
          keyExtractor={(item) => item.id}
          renderItem={renderSongItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.primary },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtn: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 18, fontWeight: "700", color: Colors.textPrimary },
  statsBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 10,
    gap: 8,
  },
  statItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  statText: { fontSize: 13, color: Colors.textSecondary, fontWeight: "500" },
  statDivider: { color: Colors.textMuted, fontSize: 13 },
  listContent: { paddingHorizontal: 16, paddingBottom: 100 },
  songRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    gap: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.border,
  },
  songArt: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: Colors.surfaceElevated,
    alignItems: "center",
    justifyContent: "center",
  },
  songInfo: { flex: 1 },
  songTitle: { fontSize: 15, fontWeight: "600", color: Colors.textPrimary },
  songArtist: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  songActions: { flexDirection: "row", alignItems: "center", gap: 10 },
  downloadedBadge: { opacity: 0.8 },
  moreBtn: { padding: 4 },
  emptyState: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 40 },
  emptyIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.surface,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  emptyTitle: { fontSize: 20, fontWeight: "700", color: Colors.textPrimary, marginBottom: 8 },
  emptySubtitle: { fontSize: 14, color: Colors.textSecondary, textAlign: "center", lineHeight: 20 },
  browseBtn: {
    marginTop: 20,
    backgroundColor: Colors.secondary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  browseBtnText: { fontSize: 15, fontWeight: "600", color: "#FFF" },
});
