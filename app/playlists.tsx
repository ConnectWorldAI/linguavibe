import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import { usePlaylist, type Playlist } from "@/lib/playlist-store";

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

export default function PlaylistsScreen() {
  const { playlists, downloads, createPlaylist, renamePlaylist, deletePlaylist } = usePlaylist();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [editingPlaylist, setEditingPlaylist] = useState<Playlist | null>(null);

  const handleCreate = () => {
    if (!newName.trim()) return;
    if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    createPlaylist(newName.trim(), newDesc.trim() || undefined);
    setNewName("");
    setNewDesc("");
    setShowCreateModal(false);
  };

  const handleRename = () => {
    if (!newName.trim() || !editingPlaylist) return;
    renamePlaylist(editingPlaylist.id, newName.trim());
    setNewName("");
    setEditingPlaylist(null);
    setShowRenameModal(false);
  };

  const handleDelete = (playlist: Playlist) => {
    Alert.alert(
      "Delete Playlist",
      `Are you sure you want to delete "${playlist.name}"? This cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            deletePlaylist(playlist.id);
          },
        },
      ]
    );
  };

  const handleLongPress = (playlist: Playlist) => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(playlist.name, "What would you like to do?", [
      {
        text: "Rename",
        onPress: () => {
          setEditingPlaylist(playlist);
          setNewName(playlist.name);
          setShowRenameModal(true);
        },
      },
      { text: "Delete", style: "destructive", onPress: () => handleDelete(playlist) },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  const renderPlaylistItem = ({ item }: { item: Playlist }) => (
    <TouchableOpacity
      style={styles.playlistCard}
      activeOpacity={0.7}
      onPress={() => router.push({ pathname: "/playlist-detail", params: { id: item.id } } as any)}
      onLongPress={() => handleLongPress(item)}
    >
      <View style={[styles.playlistCover, { backgroundColor: item.coverColor }]}>
        <Ionicons name="musical-notes" size={28} color="rgba(255,255,255,0.7)" />
        {item.songs.length > 0 && (
          <View style={styles.songCountBadge}>
            <Text style={styles.songCountText}>{item.songs.length}</Text>
          </View>
        )}
      </View>
      <Text style={styles.playlistName} numberOfLines={1}>{item.name}</Text>
      <Text style={styles.playlistMeta}>
        {item.songs.length} {item.songs.length === 1 ? "song" : "songs"}
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Music</Text>
        <TouchableOpacity onPress={() => setShowCreateModal(true)} style={styles.addBtn}>
          <Ionicons name="add" size={24} color={Colors.secondary} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={[]}
        renderItem={() => null}
        ListHeaderComponent={
          <View>
            {/* Quick Actions */}
            <View style={styles.quickActions}>
              <TouchableOpacity
                style={styles.quickAction}
                onPress={() => router.push("/downloaded-songs" as any)}
              >
                <View style={[styles.quickIcon, { backgroundColor: "rgba(0,230,118,0.12)" }]}>
                  <Ionicons name="download" size={22} color={Colors.success} />
                </View>
                <View>
                  <Text style={styles.quickTitle}>Downloads</Text>
                  <Text style={styles.quickSub}>{downloads.length} songs</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} style={{ marginLeft: "auto" }} />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.quickAction}
                onPress={() => router.push("/recently-played" as any)}
              >
                <View style={[styles.quickIcon, { backgroundColor: "rgba(0,170,255,0.12)" }]}>
                  <Ionicons name="time" size={22} color={Colors.secondary} />
                </View>
                <View>
                  <Text style={styles.quickTitle}>Recently Played</Text>
                  <Text style={styles.quickSub}>Continue listening</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} style={{ marginLeft: "auto" }} />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.quickAction}
                onPress={() => router.push("/liked-songs" as any)}
              >
                <View style={[styles.quickIcon, { backgroundColor: "rgba(255,45,85,0.12)" }]}>
                  <Ionicons name="heart" size={22} color={Colors.accent} />
                </View>
                <View>
                  <Text style={styles.quickTitle}>Liked Songs</Text>
                  <Text style={styles.quickSub}>Your favorites</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} style={{ marginLeft: "auto" }} />
              </TouchableOpacity>
            </View>

            {/* Playlists Section */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Playlists</Text>
              <TouchableOpacity onPress={() => setShowCreateModal(true)}>
                <Text style={styles.createText}>+ New</Text>
              </TouchableOpacity>
            </View>

            {playlists.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="musical-notes-outline" size={48} color={Colors.textMuted} />
                <Text style={styles.emptyTitle}>No playlists yet</Text>
                <Text style={styles.emptySub}>
                  Create playlists to organize your learning songs, remixes, and favorites
                </Text>
                <TouchableOpacity style={styles.createBtn} onPress={() => setShowCreateModal(true)}>
                  <Ionicons name="add" size={18} color={Colors.textPrimary} />
                  <Text style={styles.createBtnText}>Create Playlist</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <FlatList
                data={playlists}
                keyExtractor={(item) => item.id}
                renderItem={renderPlaylistItem}
                numColumns={2}
                columnWrapperStyle={styles.playlistGrid}
                scrollEnabled={false}
                contentContainerStyle={{ paddingHorizontal: 16 }}
              />
            )}
          </View>
        }
        keyExtractor={() => "header"}
        showsVerticalScrollIndicator={false}
      />

      {/* Create Playlist Modal */}
      <Modal visible={showCreateModal} transparent animationType="fade" onRequestClose={() => setShowCreateModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>New Playlist</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Playlist name"
              placeholderTextColor={Colors.textMuted}
              value={newName}
              onChangeText={setNewName}
              autoFocus
              returnKeyType="done"
            />
            <TextInput
              style={[styles.modalInput, { marginTop: 10 }]}
              placeholder="Description (optional)"
              placeholderTextColor={Colors.textMuted}
              value={newDesc}
              onChangeText={setNewDesc}
              returnKeyType="done"
            />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancel} onPress={() => { setShowCreateModal(false); setNewName(""); setNewDesc(""); }}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalConfirm, !newName.trim() && { opacity: 0.5 }]} onPress={handleCreate} disabled={!newName.trim()}>
                <Text style={styles.modalConfirmText}>Create</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Rename Playlist Modal */}
      <Modal visible={showRenameModal} transparent animationType="fade" onRequestClose={() => setShowRenameModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Rename Playlist</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="New name"
              placeholderTextColor={Colors.textMuted}
              value={newName}
              onChangeText={setNewName}
              autoFocus
              returnKeyType="done"
            />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancel} onPress={() => { setShowRenameModal(false); setNewName(""); }}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalConfirm, !newName.trim() && { opacity: 0.5 }]} onPress={handleRename} disabled={!newName.trim()}>
                <Text style={styles.modalConfirmText}>Rename</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.primary },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: Colors.surface, alignItems: "center", justifyContent: "center",
  },
  headerTitle: { fontSize: 20, fontWeight: "700", color: Colors.textPrimary },
  addBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: Colors.surface, alignItems: "center", justifyContent: "center",
  },
  quickActions: { paddingHorizontal: 20, gap: 8, marginBottom: 24 },
  quickAction: {
    flexDirection: "row", alignItems: "center", gap: 14,
    backgroundColor: Colors.surface, padding: 16, borderRadius: 14,
    borderWidth: 1, borderColor: Colors.border,
  },
  quickIcon: {
    width: 44, height: 44, borderRadius: 12,
    alignItems: "center", justifyContent: "center",
  },
  quickTitle: { fontSize: 15, fontWeight: "600", color: Colors.textPrimary },
  quickSub: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  sectionHeader: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 20, marginBottom: 16,
  },
  sectionTitle: { fontSize: 18, fontWeight: "700", color: Colors.textPrimary },
  createText: { fontSize: 14, fontWeight: "600", color: Colors.secondary },
  playlistGrid: { gap: 12, marginBottom: 12 },
  playlistCard: { flex: 1, maxWidth: "48%" },
  playlistCover: {
    width: "100%", aspectRatio: 1, borderRadius: 14,
    alignItems: "center", justifyContent: "center",
    marginBottom: 8,
  },
  songCountBadge: {
    position: "absolute", bottom: 8, right: 8,
    backgroundColor: "rgba(0,0,0,0.7)", borderRadius: 10,
    paddingHorizontal: 8, paddingVertical: 3,
  },
  songCountText: { fontSize: 11, fontWeight: "600", color: Colors.textPrimary },
  playlistName: { fontSize: 14, fontWeight: "600", color: Colors.textPrimary, paddingHorizontal: 4 },
  playlistMeta: { fontSize: 12, color: Colors.textSecondary, paddingHorizontal: 4, marginTop: 2 },
  emptyState: {
    alignItems: "center", paddingVertical: 48, paddingHorizontal: 40, gap: 10,
  },
  emptyTitle: { fontSize: 17, fontWeight: "600", color: Colors.textPrimary },
  emptySub: { fontSize: 13, color: Colors.textSecondary, textAlign: "center", lineHeight: 20 },
  createBtn: {
    flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: Colors.secondary, paddingHorizontal: 20, paddingVertical: 12,
    borderRadius: 24, marginTop: 12,
  },
  createBtnText: { fontSize: 14, fontWeight: "600", color: Colors.textPrimary },
  modalOverlay: {
    flex: 1, backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center", alignItems: "center", padding: 30,
  },
  modalCard: {
    width: "100%", backgroundColor: Colors.surfaceElevated,
    borderRadius: 18, padding: 24,
  },
  modalTitle: { fontSize: 18, fontWeight: "700", color: Colors.textPrimary, marginBottom: 16 },
  modalInput: {
    backgroundColor: Colors.surface, borderRadius: 12,
    padding: 14, fontSize: 15, color: Colors.textPrimary,
    borderWidth: 1, borderColor: Colors.border,
  },
  modalActions: { flexDirection: "row", gap: 12, marginTop: 20 },
  modalCancel: {
    flex: 1, paddingVertical: 14, borderRadius: 12,
    backgroundColor: Colors.surface, alignItems: "center",
  },
  modalCancelText: { fontSize: 15, fontWeight: "600", color: Colors.textSecondary },
  modalConfirm: {
    flex: 1, paddingVertical: 14, borderRadius: 12,
    backgroundColor: Colors.secondary, alignItems: "center",
  },
  modalConfirmText: { fontSize: 15, fontWeight: "600", color: Colors.textPrimary },
});
