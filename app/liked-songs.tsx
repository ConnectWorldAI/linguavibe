import React from "react";
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

export default function LikedSongsScreen() {
  const { likedSongs, unlikeSong } = usePlaylist();

  const handlePlay = (song: PlaylistSong) => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({
      pathname: "/song-player",
      params: { title: song.title, artist: song.artist },
    } as any);
  };

  const handleUnlike = (song: PlaylistSong) => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    unlikeSong(song.id);
  };

  const renderSongItem = ({ item }: { item: PlaylistSong }) => (
    <TouchableOpacity
      style={styles.songRow}
      onPress={() => handlePlay(item)}
      activeOpacity={0.7}
    >
      <View style={styles.songArt}>
        <Ionicons name="musical-notes" size={20} color={Colors.accent} />
      </View>
      <View style={styles.songInfo}>
        <Text style={styles.songTitle} numberOfLines={1}>{item.title}</Text>
        <Text style={styles.songArtist} numberOfLines={1}>
          {item.artist || "Unknown"} {item.duration ? `• ${item.duration}` : ""}
        </Text>
      </View>
      <TouchableOpacity onPress={() => handleUnlike(item)} style={styles.heartBtn}>
        <Ionicons name="heart" size={22} color={Colors.accent} />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Liked Songs</Text>
        <View style={styles.backBtn} />
      </View>

      {/* Hero Banner */}
      <View style={styles.heroBanner}>
        <View style={styles.heroGradient}>
          <Ionicons name="heart" size={40} color={Colors.accent} />
        </View>
        <View style={styles.heroInfo}>
          <Text style={styles.heroTitle}>Liked Songs</Text>
          <Text style={styles.heroSubtitle}>{likedSongs.length} songs</Text>
        </View>
        {likedSongs.length > 0 && (
          <TouchableOpacity
            style={styles.shuffleBtn}
            onPress={() => {
              if (likedSongs.length > 0) handlePlay(likedSongs[0]);
            }}
          >
            <Ionicons name="shuffle" size={18} color="#FFF" />
            <Text style={styles.shuffleBtnText}>Shuffle</Text>
          </TouchableOpacity>
        )}
      </View>

      {likedSongs.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={styles.emptyIcon}>
            <Ionicons name="heart-outline" size={56} color={Colors.textMuted} />
          </View>
          <Text style={styles.emptyTitle}>No Liked Songs</Text>
          <Text style={styles.emptySubtitle}>
            Tap the heart icon on any song to add it to your favorites.
          </Text>
        </View>
      ) : (
        <FlatList
          data={likedSongs}
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
  heroBanner: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 14,
  },
  heroGradient: {
    width: 64,
    height: 64,
    borderRadius: 12,
    backgroundColor: "rgba(255,45,85,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  heroInfo: { flex: 1 },
  heroTitle: { fontSize: 20, fontWeight: "800", color: Colors.textPrimary },
  heroSubtitle: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  shuffleBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Colors.accent,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  shuffleBtnText: { fontSize: 13, fontWeight: "600", color: "#FFF" },
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
  heartBtn: { padding: 8 },
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
});
