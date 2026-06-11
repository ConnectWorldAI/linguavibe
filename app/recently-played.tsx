import React from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Platform,
  Alert,
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

function formatTimeAgo(timestamp: number): string {
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
}

export default function RecentlyPlayedScreen() {
  const { recentlyPlayed, clearRecentlyPlayed } = usePlaylist();

  const handlePlay = (song: PlaylistSong) => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({
      pathname: "/song-player",
      params: { title: song.title, artist: song.artist },
    } as any);
  };

  const handleClear = () => {
    Alert.alert(
      "Clear History",
      "Clear all recently played songs? This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear",
          style: "destructive",
          onPress: () => {
            if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            clearRecentlyPlayed();
          },
        },
      ]
    );
  };

  const renderSongItem = ({ item }: { item: PlaylistSong }) => (
    <TouchableOpacity
      style={styles.songRow}
      onPress={() => handlePlay(item)}
      activeOpacity={0.7}
    >
      <View style={styles.songArt}>
        <Ionicons name="musical-notes" size={20} color={Colors.secondary} />
      </View>
      <View style={styles.songInfo}>
        <Text style={styles.songTitle} numberOfLines={1}>{item.title}</Text>
        <Text style={styles.songArtist} numberOfLines={1}>
          {item.artist || "Unknown"} {item.duration ? `• ${item.duration}` : ""}
        </Text>
      </View>
      <View style={styles.timeContainer}>
        <Text style={styles.timeText}>{formatTimeAgo(item.playedAt || item.addedAt)}</Text>
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
        <Text style={styles.headerTitle}>Recently Played</Text>
        {recentlyPlayed.length > 0 ? (
          <TouchableOpacity onPress={handleClear} style={styles.clearBtn}>
            <Text style={styles.clearText}>Clear</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.backBtn} />
        )}
      </View>

      {recentlyPlayed.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={styles.emptyIcon}>
            <Ionicons name="time-outline" size={56} color={Colors.textMuted} />
          </View>
          <Text style={styles.emptyTitle}>No Recent Plays</Text>
          <Text style={styles.emptySubtitle}>
            Songs you listen to will appear here so you can easily find them again.
          </Text>
          <TouchableOpacity
            style={styles.browseBtn}
            onPress={() => router.back()}
          >
            <Text style={styles.browseBtnText}>Discover Songs</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={recentlyPlayed}
          keyExtractor={(item) => `${item.id}_${item.playedAt}`}
          renderItem={renderSongItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <View style={styles.listHeader}>
              <Ionicons name="time" size={16} color={Colors.textMuted} />
              <Text style={styles.listHeaderText}>
                {recentlyPlayed.length} song{recentlyPlayed.length !== 1 ? "s" : ""} in history
              </Text>
            </View>
          }
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
  clearBtn: { paddingHorizontal: 12, paddingVertical: 6 },
  clearText: { fontSize: 14, fontWeight: "600", color: Colors.accent },
  listHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 12,
    marginBottom: 4,
  },
  listHeaderText: { fontSize: 13, color: Colors.textMuted, fontWeight: "500" },
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
  timeContainer: { paddingLeft: 8 },
  timeText: { fontSize: 11, color: Colors.textMuted, fontWeight: "500" },
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
