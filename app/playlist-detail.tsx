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
import { router, useLocalSearchParams } from "expo-router";
import * as Haptics from "expo-haptics";
import { usePlaylist } from "@/lib/playlist-store";

const Colors = {
  primary: "#0A0E1A",
  surface: "#141825",
  surfaceElevated: "#1C2235",
  secondary: "#00AAFF",
  textPrimary: "#FFFFFF",
  textSecondary: "#8A9BB0",
  textMuted: "#5A6A7A",
  border: "rgba(255,255,255,0.06)",
  gold: "#FFD700",
  success: "#00E676",
  accent: "#FF2D55",
};

export default function PlaylistDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getPlaylistById, removeSongFromPlaylist } = usePlaylist();
  const playlist = getPlaylistById(id || "");

  if (!playlist) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Playlist</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.emptyState}>
          <Ionicons name="alert-circle-outline" size={48} color={Colors.textMuted} />
          <Text style={styles.emptyTitle}>Playlist not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const handleRemoveSong = (songId: string, songTitle: string) => {
    Alert.alert("Remove Song", `Remove "${songTitle}" from this playlist?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: () => {
          if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          removeSongFromPlaylist(playlist.id, songId);
        },
      },
    ]);
  };

  const handlePlayAll = () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // Navigate to player with playlist context
    if (playlist.songs.length > 0) {
      router.push("/song-player" as any);
    }
  };

  const handleShuffle = () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (playlist.songs.length > 0) {
      router.push("/song-player" as any);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{playlist.name}</Text>
        <TouchableOpacity style={styles.moreBtn}>
          <Ionicons name="ellipsis-horizontal" size={20} color={Colors.textPrimary} />
        </TouchableOpacity>
      </View>

      {/* Playlist Cover & Info */}
      <View style={styles.coverSection}>
        <View style={[styles.coverArt, { backgroundColor: playlist.coverColor }]}>
          <Ionicons name="musical-notes" size={48} color="rgba(255,255,255,0.6)" />
        </View>
        <Text style={styles.playlistTitle}>{playlist.name}</Text>
        {playlist.description && (
          <Text style={styles.playlistDesc}>{playlist.description}</Text>
        )}
        <Text style={styles.playlistInfo}>
          {playlist.songs.length} {playlist.songs.length === 1 ? "song" : "songs"}
        </Text>
      </View>

      {/* Play Controls */}
      {playlist.songs.length > 0 && (
        <View style={styles.controls}>
          <TouchableOpacity style={styles.playAllBtn} onPress={handlePlayAll}>
            <Ionicons name="play" size={18} color={Colors.textPrimary} />
            <Text style={styles.playAllText}>Play All</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.shuffleBtn} onPress={handleShuffle}>
            <Ionicons name="shuffle" size={18} color={Colors.secondary} />
            <Text style={styles.shuffleText}>Shuffle</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Songs List */}
      {playlist.songs.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="musical-note-outline" size={40} color={Colors.textMuted} />
          <Text style={styles.emptyTitle}>No songs yet</Text>
          <Text style={styles.emptySub}>
            Add songs from the Songs tab or save remixes to this playlist
          </Text>
        </View>
      ) : (
        <FlatList
          data={playlist.songs}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
          renderItem={({ item, index }) => (
            <TouchableOpacity
              style={styles.songRow}
              activeOpacity={0.7}
              onPress={() => router.push("/song-player" as any)}
              onLongPress={() => handleRemoveSong(item.id, item.title)}
            >
              <Text style={styles.songIndex}>{index + 1}</Text>
              <View style={styles.songArt}>
                <Ionicons name="musical-note" size={16} color={Colors.secondary} />
              </View>
              <View style={styles.songInfo}>
                <Text style={styles.songTitle} numberOfLines={1}>{item.title}</Text>
                <Text style={styles.songArtist} numberOfLines={1}>
                  {item.artist} • {item.languageFlag} {item.language}
                </Text>
              </View>
              {item.duration && <Text style={styles.songDuration}>{item.duration}</Text>}
              <TouchableOpacity
                onPress={() => handleRemoveSong(item.id, item.title)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="ellipsis-vertical" size={16} color={Colors.textMuted} />
              </TouchableOpacity>
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.primary },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 20, paddingVertical: 14,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: Colors.surface, alignItems: "center", justifyContent: "center",
  },
  headerTitle: { fontSize: 18, fontWeight: "700", color: Colors.textPrimary, flex: 1, textAlign: "center" },
  moreBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: Colors.surface, alignItems: "center", justifyContent: "center",
  },
  coverSection: { alignItems: "center", paddingVertical: 20 },
  coverArt: {
    width: 160, height: 160, borderRadius: 20,
    alignItems: "center", justifyContent: "center", marginBottom: 16,
  },
  playlistTitle: { fontSize: 22, fontWeight: "700", color: Colors.textPrimary },
  playlistDesc: { fontSize: 14, color: Colors.textSecondary, marginTop: 4 },
  playlistInfo: { fontSize: 13, color: Colors.textMuted, marginTop: 6 },
  controls: {
    flexDirection: "row", gap: 12, paddingHorizontal: 20, marginBottom: 20,
  },
  playAllBtn: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, backgroundColor: Colors.secondary, paddingVertical: 14, borderRadius: 14,
  },
  playAllText: { fontSize: 15, fontWeight: "600", color: Colors.textPrimary },
  shuffleBtn: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, backgroundColor: Colors.surface, paddingVertical: 14, borderRadius: 14,
    borderWidth: 1, borderColor: "rgba(0,170,255,0.3)",
  },
  shuffleText: { fontSize: 15, fontWeight: "600", color: Colors.secondary },
  emptyState: { alignItems: "center", paddingVertical: 48, gap: 10 },
  emptyTitle: { fontSize: 17, fontWeight: "600", color: Colors.textPrimary },
  emptySub: { fontSize: 13, color: Colors.textSecondary, textAlign: "center", paddingHorizontal: 40 },
  songRow: {
    flexDirection: "row", alignItems: "center", gap: 12,
    paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  songIndex: { fontSize: 13, color: Colors.textMuted, width: 20, textAlign: "center" },
  songArt: {
    width: 40, height: 40, borderRadius: 10,
    backgroundColor: Colors.surfaceElevated, alignItems: "center", justifyContent: "center",
  },
  songInfo: { flex: 1 },
  songTitle: { fontSize: 14, fontWeight: "600", color: Colors.textPrimary },
  songArtist: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  songDuration: { fontSize: 12, color: Colors.textMuted },
});
