/**
 * Song Library / Feed Screen
 * Browsable library of pre-generated learning songs organized by language and difficulty.
 * Users can discover content without generating each time.
 */
import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ActivityIndicator,
  Platform,
  RefreshControl,
  Modal,
  Alert,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useMusicPlayer } from "@/lib/music-player-context";
import { usePlaylist } from "@/lib/playlist-store";
import { trpc } from "@/lib/trpc";
import * as Haptics from "expo-haptics";
import AsyncStorage from "@react-native-async-storage/async-storage";
// ─── TYPES ──────────────────────────────────────────────────────────────────

interface LibrarySong {
  id: string;
  title: string;
  language: string;
  topic: string;
  difficulty: string;
  style: string;
  lyrics: string;
  translatedLyrics: string;
  syncedLyrics: any[];
  audioUrl: string;
  duration: number;
  createdAt: number;
  plays: number;
  likes: number;
}

// ─── CONSTANTS ──────────────────────────────────────────────────────────────

const LANGUAGE_FILTERS = [
  { id: "all", label: "All", flag: "🌍" },
  { id: "Spanish", label: "Spanish", flag: "🇪🇸" },
  { id: "French", label: "French", flag: "🇫🇷" },
  { id: "Japanese", label: "Japanese", flag: "🇯🇵" },
  { id: "Korean", label: "Korean", flag: "🇰🇷" },
  { id: "Italian", label: "Italian", flag: "🇮🇹" },
  { id: "Portuguese", label: "Portuguese", flag: "🇧🇷" },
  { id: "German", label: "German", flag: "🇩🇪" },
  { id: "Mandarin", label: "Mandarin", flag: "🇨🇳" },
];

const DIFFICULTY_FILTERS = [
  { id: "all", label: "All Levels" },
  { id: "beginner", label: "Beginner" },
  { id: "intermediate", label: "Intermediate" },
  { id: "advanced", label: "Advanced" },
];

// Demo songs for when library is empty
const DEMO_SONGS: LibrarySong[] = [
  {
    id: "demo-1",
    title: "Buenos Días, Amigos",
    language: "Spanish",
    topic: "greetings",
    difficulty: "beginner",
    style: "Reggaeton, catchy",
    lyrics: "[Verse 1]\nBuenos días, ¿cómo estás?\nMe llamo Juan, ¿y tú?\nMucho gusto en conocerte\nVamos a hablar un poco más\n\n[Chorus]\nHola, hola, buenos días\nAdiós, adiós, buenas noches\nGracias, de nada, por favor\nAprendemos con amor",
    translatedLyrics: "[Verse 1]\nGood morning, how are you?\nMy name is Juan, and you?\nNice to meet you\nLet's talk a little more\n\n[Chorus]\nHello, hello, good morning\nGoodbye, goodbye, good night\nThank you, you're welcome, please\nWe learn with love",
    syncedLyrics: [],
    audioUrl: "",
    duration: 135000,
    createdAt: Date.now() - 86400000,
    plays: 142,
    likes: 38,
  },
  {
    id: "demo-2",
    title: "Au Café de Paris",
    language: "French",
    topic: "food & dining",
    difficulty: "intermediate",
    style: "Chanson Pop, smooth",
    lyrics: "[Verse 1]\nJe voudrais un café, s'il vous plaît\nAvec un croissant doré\nL'addition, quand vous êtes prêt\nMerci beaucoup, c'est parfait\n\n[Chorus]\nAu café de Paris\nOn apprend la vie\nUn espresso, un macaron\nC'est la belle chanson",
    translatedLyrics: "[Verse 1]\nI would like a coffee, please\nWith a golden croissant\nThe bill, when you're ready\nThank you very much, it's perfect\n\n[Chorus]\nAt the Paris café\nWe learn about life\nAn espresso, a macaron\nIt's the beautiful song",
    syncedLyrics: [],
    audioUrl: "",
    duration: 150000,
    createdAt: Date.now() - 172800000,
    plays: 89,
    likes: 24,
  },
  {
    id: "demo-3",
    title: "東京の電車で",
    language: "Japanese",
    topic: "transportation",
    difficulty: "beginner",
    style: "J-Pop, upbeat",
    lyrics: "[Verse 1]\nすみません、この電車は\n東京駅に行きますか？\n切符はいくらですか？\nありがとうございます\n\n[Chorus]\n電車に乗って、行こう\n右に曲がって、左に曲がって\n次の駅で降りましょう\n日本語で話しましょう",
    translatedLyrics: "[Verse 1]\nExcuse me, does this train\nGo to Tokyo Station?\nHow much is the ticket?\nThank you very much\n\n[Chorus]\nLet's ride the train, let's go\nTurn right, turn left\nLet's get off at the next station\nLet's speak in Japanese",
    syncedLyrics: [],
    audioUrl: "",
    duration: 120000,
    createdAt: Date.now() - 259200000,
    plays: 215,
    likes: 67,
  },
  {
    id: "demo-4",
    title: "Contando Estrellas",
    language: "Spanish",
    topic: "numbers & counting",
    difficulty: "beginner",
    style: "Bachata, romantic",
    lyrics: "[Verse 1]\nUno, dos, tres estrellas\nCuatro, cinco, seis tan bellas\nSiete, ocho, nueve, diez\nContamos otra vez\n\n[Chorus]\nCien estrellas en el cielo\nMil razones para aprender\nUn millón de palabras nuevas\nVamos a contar otra vez",
    translatedLyrics: "[Verse 1]\nOne, two, three stars\nFour, five, six so beautiful\nSeven, eight, nine, ten\nWe count again\n\n[Chorus]\nA hundred stars in the sky\nA thousand reasons to learn\nA million new words\nLet's count again",
    syncedLyrics: [],
    audioUrl: "",
    duration: 140000,
    createdAt: Date.now() - 345600000,
    plays: 310,
    likes: 95,
  },
  {
    id: "demo-5",
    title: "사랑해요, 서울",
    language: "Korean",
    topic: "emotions & feelings",
    difficulty: "intermediate",
    style: "K-Pop, energetic",
    lyrics: "[Verse 1]\n기분이 좋아요, 행복해요\n오늘은 특별한 날이에요\n사랑해요, 고마워요\n서울에서 만나요\n\n[Chorus]\n슬퍼요, 기뻐요\n화나요, 놀라워요\n감정을 말해봐요\n한국어로 표현해요",
    translatedLyrics: "[Verse 1]\nI feel good, I'm happy\nToday is a special day\nI love you, thank you\nLet's meet in Seoul\n\n[Chorus]\nI'm sad, I'm happy\nI'm angry, I'm surprised\nLet's express feelings\nLet's express in Korean",
    syncedLyrics: [],
    audioUrl: "",
    duration: 130000,
    createdAt: Date.now() - 432000000,
    plays: 178,
    likes: 52,
  },
  {
    id: "demo-6",
    title: "Im Supermarkt",
    language: "German",
    topic: "shopping",
    difficulty: "beginner",
    style: "Electro Pop, fun",
    lyrics: "[Verse 1]\nIch brauche Brot und Milch\nWo finde ich das Obst?\nWie viel kostet das?\nDas ist zu teuer!\n\n[Chorus]\nIm Supermarkt, im Supermarkt\nWir kaufen ein, wir kaufen ein\nÄpfel, Bananen, Käse, Wein\nDeutsch lernen kann so schön sein",
    translatedLyrics: "[Verse 1]\nI need bread and milk\nWhere can I find the fruit?\nHow much does this cost?\nThat's too expensive!\n\n[Chorus]\nAt the supermarket, at the supermarket\nWe're shopping, we're shopping\nApples, bananas, cheese, wine\nLearning German can be so nice",
    syncedLyrics: [],
    audioUrl: "",
    duration: 125000,
    createdAt: Date.now() - 518400000,
    plays: 96,
    likes: 31,
  },
];

// ─── COMPONENT ──────────────────────────────────────────────────────────────

export default function SongLibraryScreen() {
  const colors = useColors();
  const musicPlayer = useMusicPlayer();
  const playlist = usePlaylist();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState("all");
  const [selectedDifficulty, setSelectedDifficulty] = useState("all");
  const [refreshing, setRefreshing] = useState(false);
  const [likedSongs, setLikedSongs] = useState<Set<string>>(new Set());
  const [showPlaylistPicker, setShowPlaylistPicker] = useState(false);
  const [songToAdd, setSongToAdd] = useState<LibrarySong | null>(null);
  const [showCreatePlaylist, setShowCreatePlaylist] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState("");
  const [downloadedSongs, setDownloadedSongs] = useState<Set<string>>(new Set());

  // Load downloaded songs from AsyncStorage
  useEffect(() => {
    const loadDownloaded = async () => {
      try {
        const stored = await AsyncStorage.getItem("@downloaded_songs");
        if (stored) setDownloadedSongs(new Set(JSON.parse(stored)));
      } catch {}
    };
    loadDownloaded();
  }, []);

  // Fetch from backend library
  const { data: libraryData, refetch, isLoading } = trpc.musicGeneration.getLibrary.useQuery({
    language: selectedLanguage === "all" ? undefined : selectedLanguage,
    difficulty: selectedDifficulty === "all" ? undefined : selectedDifficulty,
    topic: searchQuery || undefined,
    limit: 50,
  });

  const likeMutation = trpc.musicGeneration.likeSong.useMutation();

  // Combine backend songs with demo songs
  const allSongs: LibrarySong[] = [
    ...(libraryData?.songs || []),
    ...DEMO_SONGS,
  ];

  // Filter by search
  const filteredSongs = allSongs.filter((song) => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        song.title.toLowerCase().includes(q) ||
        song.topic.toLowerCase().includes(q) ||
        song.language.toLowerCase().includes(q)
      );
    }
    if (selectedLanguage !== "all" && song.language.toLowerCase() !== selectedLanguage.toLowerCase()) return false;
    if (selectedDifficulty !== "all" && song.difficulty !== selectedDifficulty) return false;
    return true;
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const handleAddToPlaylist = (song: LibrarySong) => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSongToAdd(song);
    setShowPlaylistPicker(true);
  };

  const confirmAddToPlaylist = (playlistId: string) => {
    if (!songToAdd) return;
    const langFlag = LANGUAGE_FILTERS.find(l => l.label === songToAdd.language)?.flag || "🌍";
    playlist.addSongToPlaylist(playlistId, {
      id: songToAdd.id,
      title: songToAdd.title,
      artist: `${songToAdd.language} • ${songToAdd.topic}`,
      language: songToAdd.language,
      languageFlag: langFlag,
      duration: formatDuration(songToAdd.duration),
      audioUrl: songToAdd.audioUrl || undefined,
    });
    if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setShowPlaylistPicker(false);
    setSongToAdd(null);
    Alert.alert("Added!", `"${songToAdd.title}" added to playlist.`);
  };

  const handleCreateAndAdd = () => {
    if (!newPlaylistName.trim()) return;
    const newPl = playlist.createPlaylist(newPlaylistName.trim(), "Learning songs");
    setNewPlaylistName("");
    setShowCreatePlaylist(false);
    confirmAddToPlaylist(newPl.id);
  };

  const handleLike = (songId: string) => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setLikedSongs((prev) => {
      const next = new Set(prev);
      if (next.has(songId)) next.delete(songId);
      else next.add(songId);
      return next;
    });
    likeMutation.mutate({ songId });
  };

  const handlePlaySong = (song: LibrarySong) => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const langFlag = LANGUAGE_FILTERS.find(l => l.label === song.language)?.flag || "🌍";
    musicPlayer.play({
      id: song.id,
      title: song.title,
      artist: `${song.language} • ${song.difficulty} • ${song.topic}`,
      artworkColor: getDifficultyColor(song.difficulty),
      language: song.language,
      languageFlag: langFlag,
    }, song.audioUrl || undefined);

    // Navigate to karaoke if synced lyrics available
    if (song.syncedLyrics && song.syncedLyrics.length > 0) {
      router.push({
        pathname: "/karaoke-mode",
        params: {
          songId: song.id,
          title: song.title,
          language: song.language,
          lyrics: JSON.stringify(song.syncedLyrics),
          duration: String(song.duration),
        },
      });
    }
  };

  const handleDownloadSong = async (song: LibrarySong) => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (downloadedSongs.has(song.id)) {
      // Already downloaded — remove
      const updated = new Set(downloadedSongs);
      updated.delete(song.id);
      setDownloadedSongs(updated);
      await AsyncStorage.setItem("@downloaded_songs", JSON.stringify([...updated]));
      if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    } else {
      // Download (simulated)
      const updated = new Set(downloadedSongs);
      updated.add(song.id);
      setDownloadedSongs(updated);
      await AsyncStorage.setItem("@downloaded_songs", JSON.stringify([...updated]));
      if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "beginner": return "#22C55E";
      case "intermediate": return "#F59E0B";
      case "advanced": return "#EF4444";
      default: return colors.primary;
    }
  };

  const getDifficultyLabel = (difficulty: string) => {
    switch (difficulty) {
      case "beginner": return "A1-A2";
      case "intermediate": return "B1-B2";
      case "advanced": return "C1-C2";
      default: return difficulty;
    }
  };

  const formatDuration = (ms: number) => {
    const min = Math.floor(ms / 60000);
    const sec = Math.floor((ms % 60000) / 1000);
    return `${min}:${String(sec).padStart(2, "0")}`;
  };

  const renderSongItem = ({ item }: { item: LibrarySong }) => {
    const langFilter = LANGUAGE_FILTERS.find(l => l.label === item.language);
    const isLiked = likedSongs.has(item.id);

    return (
      <TouchableOpacity
        style={[styles.songCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
        onPress={() => handlePlaySong(item)}
        activeOpacity={0.7}
      >
        {/* Cover art placeholder */}
        <View style={[styles.songCover, { backgroundColor: getDifficultyColor(item.difficulty) + "20" }]}>
          <Text style={styles.songCoverFlag}>{langFilter?.flag || "🌍"}</Text>
          <View style={[styles.difficultyBadge, { backgroundColor: getDifficultyColor(item.difficulty) }]}>
            <Text style={styles.difficultyBadgeText}>{getDifficultyLabel(item.difficulty)}</Text>
          </View>
        </View>

        {/* Song info */}
        <View style={styles.songInfo}>
          <Text style={[styles.songTitle, { color: colors.foreground }]} numberOfLines={1}>{item.title}</Text>
          <Text style={[styles.songMeta, { color: colors.muted }]} numberOfLines={1}>
            {item.language} • {item.topic} • {formatDuration(item.duration)}
          </Text>
          <View style={styles.songStats}>
            <View style={styles.statItem}>
              <Ionicons name="play" size={12} color={colors.muted} />
              <Text style={[styles.statText, { color: colors.muted }]}>{item.plays}</Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="heart" size={12} color={isLiked ? "#EF4444" : colors.muted} />
              <Text style={[styles.statText, { color: colors.muted }]}>{item.likes + (isLiked ? 1 : 0)}</Text>
            </View>
            {item.syncedLyrics && item.syncedLyrics.length > 0 && (
              <View style={[styles.karaokeBadge, { backgroundColor: colors.primary + "15" }]}>
                <Ionicons name="mic" size={10} color={colors.primary} />
                <Text style={[styles.karaokeBadgeText, { color: colors.primary }]}>Karaoke</Text>
              </View>
            )}
          </View>
        </View>

        {/* Actions */}
        <View style={styles.songActions}>
          <TouchableOpacity onPress={() => handleLike(item.id)} style={styles.likeBtn}>
            <Ionicons name={isLiked ? "heart" : "heart-outline"} size={22} color={isLiked ? "#EF4444" : colors.muted} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleAddToPlaylist(item)} style={styles.likeBtn}>
            <Ionicons name="add-circle-outline" size={22} color={colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleDownloadSong(item)} style={styles.likeBtn}>
            <Ionicons name={downloadedSongs.has(item.id) ? "cloud-done" : "cloud-download-outline"} size={20} color={downloadedSongs.has(item.id) ? colors.success : colors.muted} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.playIconBtn}>
            <Ionicons name="play-circle" size={32} color={colors.primary} />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  const renderHeader = () => (
    <View style={styles.listHeader}>
      {/* Stats */}
      <View style={[styles.statsRow, { backgroundColor: colors.surface }]}>
        <View style={styles.statBox}>
          <Text style={[styles.statBoxValue, { color: colors.primary }]}>{filteredSongs.length}</Text>
          <Text style={[styles.statBoxLabel, { color: colors.muted }]}>Songs</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={[styles.statBoxValue, { color: colors.primary }]}>
            {new Set(filteredSongs.map(s => s.language)).size}
          </Text>
          <Text style={[styles.statBoxLabel, { color: colors.muted }]}>Languages</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={[styles.statBoxValue, { color: colors.primary }]}>
            {filteredSongs.reduce((sum, s) => sum + s.plays, 0)}
          </Text>
          <Text style={[styles.statBoxLabel, { color: colors.muted }]}>Total Plays</Text>
        </View>
      </View>

      {/* Generate CTA */}
      <TouchableOpacity
        style={[styles.generateCta, { backgroundColor: colors.primary }]}
        onPress={() => router.push("/generate-learning-song")}
        activeOpacity={0.8}
      >
        <Ionicons name="sparkles" size={20} color="#fff" />
        <Text style={styles.generateCtaText}>Generate New Song</Text>
        <Ionicons name="arrow-forward" size={18} color="#fff" />
      </TouchableOpacity>
    </View>
  );

  return (
    <ScreenContainer>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBack}>
          <Ionicons name="arrow-back" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Song Library</Text>
        <TouchableOpacity onPress={() => router.push("/generate-learning-song")}>
          <Ionicons name="add-circle" size={28} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={[styles.searchBar, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Ionicons name="search" size={18} color={colors.muted} />
        <TextInput
          style={[styles.searchInput, { color: colors.foreground }]}
          placeholder="Search songs, topics, languages..."
          placeholderTextColor={colors.muted}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery("")}>
            <Ionicons name="close-circle" size={18} color={colors.muted} />
          </TouchableOpacity>
        )}
      </View>

      {/* Language Filter */}
      <FlatList
        horizontal
        data={LANGUAGE_FILTERS}
        keyExtractor={(item) => item.id}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterRow}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.filterChip,
              {
                backgroundColor: selectedLanguage === item.id ? colors.primary : colors.surface,
                borderColor: selectedLanguage === item.id ? colors.primary : colors.border,
              },
            ]}
            onPress={() => {
              setSelectedLanguage(item.id);
              if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
          >
            <Text style={styles.filterFlag}>{item.flag}</Text>
            <Text style={[styles.filterLabel, { color: selectedLanguage === item.id ? "#fff" : colors.foreground }]}>
              {item.label}
            </Text>
          </TouchableOpacity>
        )}
      />

      {/* Difficulty Filter */}
      <FlatList
        horizontal
        data={DIFFICULTY_FILTERS}
        keyExtractor={(item) => item.id}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.diffFilterRow}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.diffChip,
              {
                backgroundColor: selectedDifficulty === item.id ? colors.primary + "15" : "transparent",
                borderColor: selectedDifficulty === item.id ? colors.primary : colors.border,
              },
            ]}
            onPress={() => setSelectedDifficulty(item.id)}
          >
            <Text style={[styles.diffChipText, { color: selectedDifficulty === item.id ? colors.primary : colors.muted }]}>
              {item.label}
            </Text>
          </TouchableOpacity>
        )}
      />

      {/* Song List */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.muted }]}>Loading library...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredSongs}
          keyExtractor={(item) => item.id}
          renderItem={renderSongItem}
          ListHeaderComponent={renderHeader}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="musical-notes-outline" size={48} color={colors.muted} />
              <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No songs found</Text>
              <Text style={[styles.emptySubtitle, { color: colors.muted }]}>
                Try a different filter or generate a new song!
              </Text>
            </View>
          }
        />
      )}
      {/* Playlist Picker Modal */}
      <Modal visible={showPlaylistPicker} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.foreground }]}>Add to Playlist</Text>
              <TouchableOpacity onPress={() => { setShowPlaylistPicker(false); setSongToAdd(null); }}>
                <Ionicons name="close" size={24} color={colors.muted} />
              </TouchableOpacity>
            </View>

            {songToAdd && (
              <View style={[styles.modalSongPreview, { borderColor: colors.border }]}>
                <Text style={[styles.modalSongTitle, { color: colors.foreground }]} numberOfLines={1}>{songToAdd.title}</Text>
                <Text style={[styles.modalSongMeta, { color: colors.muted }]}>{songToAdd.language} • {songToAdd.topic}</Text>
              </View>
            )}

            {/* Create New Playlist */}
            {showCreatePlaylist ? (
              <View style={[styles.createPlaylistRow, { borderColor: colors.border }]}>
                <TextInput
                  style={[styles.createPlaylistInput, { color: colors.foreground, borderColor: colors.border }]}
                  placeholder="Playlist name (e.g. Travel Spanish)"
                  placeholderTextColor={colors.muted}
                  value={newPlaylistName}
                  onChangeText={setNewPlaylistName}
                  autoFocus
                  returnKeyType="done"
                  onSubmitEditing={handleCreateAndAdd}
                />
                <TouchableOpacity
                  style={[styles.createPlaylistBtn, { backgroundColor: colors.primary, opacity: newPlaylistName.trim() ? 1 : 0.5 }]}
                  onPress={handleCreateAndAdd}
                  disabled={!newPlaylistName.trim()}
                >
                  <Text style={styles.createPlaylistBtnText}>Create & Add</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={[styles.newPlaylistRow, { borderColor: colors.border }]}
                onPress={() => setShowCreatePlaylist(true)}
              >
                <Ionicons name="add" size={22} color={colors.primary} />
                <Text style={[styles.newPlaylistText, { color: colors.primary }]}>Create New Playlist</Text>
              </TouchableOpacity>
            )}

            {/* Existing Playlists */}
            <FlatList
              data={playlist.playlists}
              keyExtractor={(item) => item.id}
              style={styles.playlistList}
              ListEmptyComponent={
                <Text style={[styles.emptyPlaylistText, { color: colors.muted }]}>No playlists yet. Create one above!</Text>
              }
              renderItem={({ item: pl }) => (
                <TouchableOpacity
                  style={[styles.playlistRow, { borderColor: colors.border }]}
                  onPress={() => confirmAddToPlaylist(pl.id)}
                >
                  <View style={[styles.playlistCover, { backgroundColor: pl.coverColor }]}>
                    <Ionicons name="musical-notes" size={18} color="#fff" />
                  </View>
                  <View style={styles.playlistInfo}>
                    <Text style={[styles.playlistName, { color: colors.foreground }]}>{pl.name}</Text>
                    <Text style={[styles.playlistCount, { color: colors.muted }]}>{pl.songs.length} songs</Text>
                  </View>
                  <Ionicons name="add-circle" size={24} color={colors.primary} />
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
}

// ─── STYLES ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 0.5 },
  headerBack: { width: 40 },
  headerTitle: { fontSize: 17, fontWeight: "600" },
  searchBar: { flexDirection: "row", alignItems: "center", marginHorizontal: 16, marginTop: 12, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, borderWidth: 1, gap: 8 },
  searchInput: { flex: 1, fontSize: 15 },
  filterRow: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 4, gap: 8 },
  filterChip: { flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1, gap: 4 },
  filterFlag: { fontSize: 16 },
  filterLabel: { fontSize: 13, fontWeight: "500" },
  diffFilterRow: { paddingHorizontal: 16, paddingTop: 6, paddingBottom: 8, gap: 8 },
  diffChip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 16, borderWidth: 1 },
  diffChipText: { fontSize: 12, fontWeight: "500" },
  listContent: { paddingBottom: 100 },
  listHeader: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12 },
  statsRow: { flexDirection: "row", borderRadius: 12, padding: 14, marginBottom: 12 },
  statBox: { flex: 1, alignItems: "center" },
  statBoxValue: { fontSize: 20, fontWeight: "700" },
  statBoxLabel: { fontSize: 11, marginTop: 2 },
  generateCta: { flexDirection: "row", alignItems: "center", justifyContent: "center", padding: 14, borderRadius: 12, gap: 8 },
  generateCtaText: { color: "#fff", fontSize: 15, fontWeight: "600" },
  songCard: { flexDirection: "row", alignItems: "center", marginHorizontal: 16, marginBottom: 10, padding: 12, borderRadius: 14, borderWidth: 0.5 },
  songCover: { width: 56, height: 56, borderRadius: 12, alignItems: "center", justifyContent: "center", position: "relative" },
  songCoverFlag: { fontSize: 24 },
  difficultyBadge: { position: "absolute", bottom: -4, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8 },
  difficultyBadgeText: { color: "#fff", fontSize: 9, fontWeight: "700" },
  songInfo: { flex: 1, marginLeft: 12 },
  songTitle: { fontSize: 15, fontWeight: "600" },
  songMeta: { fontSize: 12, marginTop: 3 },
  songStats: { flexDirection: "row", alignItems: "center", marginTop: 6, gap: 12 },
  statItem: { flexDirection: "row", alignItems: "center", gap: 3 },
  statText: { fontSize: 11 },
  karaokeBadge: { flexDirection: "row", alignItems: "center", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8, gap: 3 },
  karaokeBadgeText: { fontSize: 10, fontWeight: "600" },
  songActions: { alignItems: "center", gap: 8 },
  likeBtn: { padding: 4 },
  playIconBtn: { padding: 2 },
  loadingContainer: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  loadingText: { fontSize: 14 },
  emptyState: { alignItems: "center", justifyContent: "center", paddingTop: 60, gap: 8 },
  emptyTitle: { fontSize: 18, fontWeight: "600" },
  emptySubtitle: { fontSize: 14, textAlign: "center", paddingHorizontal: 40 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modalContent: { borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingTop: 16, paddingBottom: 40, maxHeight: "70%" },
  modalHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, marginBottom: 12 },
  modalTitle: { fontSize: 18, fontWeight: "700" },
  modalSongPreview: { marginHorizontal: 20, padding: 12, borderRadius: 10, borderWidth: 0.5, marginBottom: 12 },
  modalSongTitle: { fontSize: 15, fontWeight: "600" },
  modalSongMeta: { fontSize: 12, marginTop: 3 },
  newPlaylistRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 0.5, gap: 8 },
  newPlaylistText: { fontSize: 15, fontWeight: "600" },
  createPlaylistRow: { paddingHorizontal: 20, paddingVertical: 12, borderBottomWidth: 0.5, gap: 10 },
  createPlaylistInput: { fontSize: 15, borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10 },
  createPlaylistBtn: { alignSelf: "flex-end", paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10 },
  createPlaylistBtnText: { color: "#fff", fontSize: 14, fontWeight: "600" },
  playlistList: { paddingHorizontal: 20 },
  playlistRow: { flexDirection: "row", alignItems: "center", paddingVertical: 12, borderBottomWidth: 0.5, gap: 12 },
  playlistCover: { width: 40, height: 40, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  playlistInfo: { flex: 1 },
  playlistName: { fontSize: 15, fontWeight: "500" },
  playlistCount: { fontSize: 12, marginTop: 2 },
  emptyPlaylistText: { fontSize: 14, textAlign: "center", paddingVertical: 20 },
});
