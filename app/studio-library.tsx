import React, { useState, useMemo, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  Platform,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { Ionicons } from "@expo/vector-icons";
import { ScreenContainer } from "@/components/screen-container";

// ─── Types ───────────────────────────────────────────────────────────────────
type SortOption = "Added" | "Name" | "Duration" | "Artist";

interface Song {
  id: string;
  title: string;
  artist: string;
  duration: string;
  addedAt: number;
  isSeparated: boolean;
}

// ─── Mock Data ───────────────────────────────────────────────────────────────
const MOCK_SONGS: Song[] = [
  { id: "1", title: "Lil Wayne   Trouble", artist: "-", duration: "3:59", addedAt: 1716500000, isSeparated: true },
  { id: "2", title: "Love Druggie (Rough Version)", artist: "-", duration: "4:12", addedAt: 1716490000, isSeparated: true },
  { id: "3", title: "dont recallclosure (dont recall) rough dr...", artist: "-", duration: "3:45", addedAt: 1716480000, isSeparated: false },
  { id: "4", title: "pnb scUber bpm 150", artist: "-", duration: "2:58", addedAt: 1716470000, isSeparated: true },
  { id: "5", title: "TROPICAL GUITAR BEAT 2 (Master)", artist: "-", duration: "3:30", addedAt: 1716460000, isSeparated: true },
  { id: "6", title: "Dont Change ft. Bayon", artist: "-", duration: "4:05", addedAt: 1716450000, isSeparated: false },
  { id: "7", title: "love druggie new new new 2", artist: "-", duration: "3:22", addedAt: 1716440000, isSeparated: true },
  { id: "8", title: "The Lox Featuring Timbaland & Eve - Ry...", artist: "-", duration: "4:33", addedAt: 1716430000, isSeparated: false },
  { id: "9", title: "Rick Ross Santorini Greece", artist: "-", duration: "3:48", addedAt: 1716420000, isSeparated: true },
  { id: "10", title: "Summer Vibes Instrumental", artist: "-", duration: "3:15", addedAt: 1716410000, isSeparated: false },
  { id: "11", title: "Late Night Session (Demo)", artist: "-", duration: "5:02", addedAt: 1716400000, isSeparated: true },
  { id: "12", title: "Caribbean Flow Beat", artist: "-", duration: "3:40", addedAt: 1716390000, isSeparated: false },
];

// ─── Component ───────────────────────────────────────────────────────────────
export default function StudioLibraryScreen() {
  const router = useRouter();

  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>("Added");
  const [showSortMenu, setShowSortMenu] = useState(false);

  const filteredSongs = useMemo(() => {
    let songs = [...MOCK_SONGS];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      songs = songs.filter(
        (s) => s.title.toLowerCase().includes(q) || s.artist.toLowerCase().includes(q)
      );
    }
    switch (sortBy) {
      case "Name":
        songs.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case "Duration":
        songs.sort((a, b) => a.duration.localeCompare(b.duration));
        break;
      case "Artist":
        songs.sort((a, b) => a.artist.localeCompare(b.artist));
        break;
      default:
        songs.sort((a, b) => b.addedAt - a.addedAt);
    }
    return songs;
  }, [searchQuery, sortBy]);

  const handleSongPress = (song: Song) => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({
      pathname: "/stem-separator" as any,
      params: { songTitle: song.title, songArtist: song.artist },
    });
  };

  const handleRecord = () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push("/wavy-eq-studio" as any);
  };

  const handleAdd = () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      "Add Song",
      "Choose how to add a song",
      [
        { text: "From Files", onPress: () => {} },
        { text: "From URL", onPress: () => {} },
        { text: "Cancel", style: "cancel" },
      ]
    );
  };

  const handleSongMenu = (song: Song) => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Alert.alert(
      song.title,
      undefined,
      [
        { text: "Open in Mixer", onPress: () => handleSongPress(song) },
        { text: "Translate Vocals", onPress: () => router.push("/song-translation-result" as any) },
        { text: "Export", onPress: () => {} },
        { text: "Delete", style: "destructive", onPress: () => {} },
        { text: "Cancel", style: "cancel" },
      ]
    );
  };

  const cycleSortOption = () => {
    const options: SortOption[] = ["Added", "Name", "Duration", "Artist"];
    const idx = options.indexOf(sortBy);
    setSortBy(options[(idx + 1) % options.length]);
    if (Platform.OS !== "web") Haptics.selectionAsync();
  };

  const renderSongItem = ({ item }: { item: Song }) => (
    <TouchableOpacity
      style={styles.songRow}
      onPress={() => handleSongPress(item)}
      activeOpacity={0.7}
    >
      {/* Music icon */}
      <View style={styles.songIcon}>
        <Ionicons name="musical-note" size={20} color="#AAAAAA" />
      </View>

      {/* Song info */}
      <View style={styles.songInfo}>
        <Text style={styles.songTitle} numberOfLines={1}>
          {item.title}
        </Text>
        <Text style={styles.songArtist}>{item.artist}</Text>
      </View>

      {/* More button */}
      <TouchableOpacity
        style={styles.moreButton}
        onPress={() => handleSongMenu(item)}
      >
        <Ionicons name="ellipsis-horizontal" size={20} color="#777777" />
      </TouchableOpacity>
    </TouchableOpacity>
  );


  // Load persisted data from AsyncStorage
  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem('@studio_library_data');
        if (stored) {
          // Data available from sync/server
        }
      } catch {}
    })();
  }, []);
  return (
    <View style={styles.container}>
      <ScreenContainer containerClassName="bg-black">
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.backBtn}
            >
              <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Songs</Text>
          </View>
          <TouchableOpacity
            style={styles.searchButton}
            onPress={() => {
              setShowSearch(!showSearch);
              if (Platform.OS !== "web") Haptics.selectionAsync();
            }}
          >
            <Ionicons name="search" size={22} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Search bar */}
        {showSearch && (
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={18} color="#555" style={{ marginRight: 8 }} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search songs..."
              placeholderTextColor="#555555"
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus
              returnKeyType="search"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery("")}>
                <Ionicons name="close-circle" size={18} color="#555" />
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Record + Add buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.recordButton} onPress={handleRecord}>
            <View style={styles.recordDot} />
            <Text style={styles.recordText}>Record</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.addButton} onPress={handleAdd}>
            <Ionicons name="add" size={22} color="#FFFFFF" />
            <Text style={styles.addText}>Add</Text>
          </TouchableOpacity>
        </View>

        {/* Filter / Sort row */}
        <View style={styles.filterRow}>
          <View style={styles.filterLeft}>
            <Ionicons name="filter" size={16} color="#AAAAAA" />
            <Text style={styles.filterText}>All ({filteredSongs.length})</Text>
          </View>
          <TouchableOpacity style={styles.sortBtn} onPress={cycleSortOption}>
            <Text style={styles.sortText}>{sortBy}</Text>
            <Ionicons name="arrow-down" size={14} color="#AAAAAA" />
          </TouchableOpacity>
        </View>

        {/* Song list */}
        <FlatList
          data={filteredSongs}
          renderItem={renderSongItem}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="musical-notes-outline" size={48} color="#444" />
              <Text style={styles.emptyTitle}>No songs yet</Text>
              <Text style={styles.emptyDesc}>
                Tap "Add" to import a song or "Record" to start creating
              </Text>
            </View>
          }
        />
      </ScreenContainer>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
  },
  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    color: "#FFFFFF",
    fontSize: 28,
    fontWeight: "700",
  },
  searchButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#2A2A2A",
    justifyContent: "center",
    alignItems: "center",
  },
  // Search
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    backgroundColor: "#1A1A1A",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: "#FFFFFF",
    fontSize: 15,
  },
  // Action Buttons
  actionButtons: {
    flexDirection: "row",
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 16,
  },
  recordButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#2A2A2A",
    borderRadius: 12,
    paddingVertical: 14,
    gap: 8,
  },
  recordDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#FF3B30",
  },
  recordText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
  },
  addButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#2A2A2A",
    borderRadius: 12,
    paddingVertical: 14,
    gap: 6,
  },
  addText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
  },
  // Filter row
  filterRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  filterLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  filterText: {
    color: "#AAAAAA",
    fontSize: 13,
  },
  sortBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  sortText: {
    color: "#AAAAAA",
    fontSize: 13,
  },
  // Song list
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  songRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    gap: 12,
  },
  songIcon: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: "#2A2A2A",
    justifyContent: "center",
    alignItems: "center",
  },
  songInfo: {
    flex: 1,
  },
  songTitle: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "500",
    marginBottom: 2,
  },
  songArtist: {
    color: "#777777",
    fontSize: 13,
  },
  moreButton: {
    padding: 8,
  },
  // Empty state
  emptyState: {
    alignItems: "center",
    paddingTop: 60,
    gap: 8,
  },
  emptyTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "600",
  },
  emptyDesc: {
    color: "#777777",
    fontSize: 14,
    textAlign: "center",
    paddingHorizontal: 40,
  },
});
