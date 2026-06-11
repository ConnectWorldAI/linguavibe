import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  FlatList,
  Platform,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  Easing,
} from "react-native-reanimated";
import { useMusicPlayer } from "@/lib/music-player-context";
import { Colors, Spacing, BorderRadius, FontSize } from "../constants/Colors";

// Alias for convenience
const C = {
  text: Colors.textPrimary,
  textSecondary: Colors.textSecondary,
  background: Colors.primary,
  surfaceCard: Colors.surfaceCard,
  border: Colors.border,
  success: Colors.success,
  secondary: Colors.secondary,
};

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// ─── Sample Lyrics (synced) ──────────────────────────────────────────────────
interface LyricLine {
  time: number; // seconds
  original: string;
  translation: string;
}

const SAMPLE_LYRICS: LyricLine[] = [
  { time: 0, original: "Yo no sé mañana", translation: "I don't know about tomorrow" },
  { time: 4, original: "Yo no sé si hay un después", translation: "I don't know if there's an after" },
  { time: 8, original: "Si estaremos juntos", translation: "If we'll be together" },
  { time: 12, original: "Si se acaba o no", translation: "If it ends or not" },
  { time: 16, original: "Solo sé que estoy aquí", translation: "I only know I'm here" },
  { time: 20, original: "Que te quiero tanto", translation: "That I love you so much" },
  { time: 24, original: "Y que tú estás junto a mí", translation: "And that you're next to me" },
  { time: 28, original: "Vamos a vivir el momento", translation: "Let's live the moment" },
  { time: 32, original: "Vamos a dejar todo atrás", translation: "Let's leave everything behind" },
  { time: 36, original: "No importa lo que venga después", translation: "It doesn't matter what comes after" },
  { time: 40, original: "Solo importa este instante", translation: "Only this instant matters" },
  { time: 44, original: "Contigo todo es diferente", translation: "With you everything is different" },
  { time: 48, original: "Tú me haces sentir vivo", translation: "You make me feel alive" },
  { time: 52, original: "Cada día a tu lado", translation: "Every day by your side" },
  { time: 56, original: "Es un regalo del cielo", translation: "Is a gift from heaven" },
];

type RepeatMode = "off" | "all" | "one";

export default function NowPlayingScreen() {
  const { currentTrack, isPlaying, progress, duration, pause, resume, skipNext, skipPrevious, queue, addToQueue } = useMusicPlayer();
  const [showLyrics, setShowLyrics] = useState(true);
  const [showQueue, setShowQueue] = useState(false);
  const [repeatMode, setRepeatMode] = useState<RepeatMode>("off");
  const [shuffleOn, setShuffle] = useState(false);
  const [liked, setLiked] = useState(false);
  const [currentLyricIndex, setCurrentLyricIndex] = useState(0);

  // Animated vinyl rotation
  const rotation = useSharedValue(0);

  useEffect(() => {
    if (isPlaying) {
      rotation.value = withRepeat(
        withTiming(rotation.value + 360, { duration: 8000, easing: Easing.linear }),
        -1,
        false
      );
    }
  }, [isPlaying]);

  const vinylStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  // Track current lyric based on progress
  useEffect(() => {
    const currentTime = progress * duration;
    let idx = 0;
    for (let i = SAMPLE_LYRICS.length - 1; i >= 0; i--) {
      if (currentTime >= SAMPLE_LYRICS[i].time) {
        idx = i;
        break;
      }
    }
    setCurrentLyricIndex(idx);
  }, [progress, duration]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handlePlayPause = () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (isPlaying) pause();
    else resume();
  };

  const handleRepeat = () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const modes: RepeatMode[] = ["off", "all", "one"];
    const idx = modes.indexOf(repeatMode);
    setRepeatMode(modes[(idx + 1) % modes.length]);
  };

  const handleShuffle = () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShuffle(!shuffleOn);
  };

  const handleLike = () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLiked(!liked);
  };

  const handleSkipNext = () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    skipNext();
  };

  const handleSkipPrevious = () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    skipPrevious();
  };

  if (!currentTrack) {
    return (
      <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
        <View style={styles.emptyState}>
          <Ionicons name="musical-notes" size={64} color={C.textSecondary} />
          <Text style={styles.emptyTitle}>Nothing Playing</Text>
          <Text style={styles.emptySubtitle}>Play a song to see it here</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const artworkGradient = currentTrack.artworkColor || "#6366F1";

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-down" size={24} color={C.text} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerLabel}>NOW PLAYING</Text>
          <Text style={styles.headerSublabel}>{currentTrack.language || "Spanish"}</Text>
        </View>
        <TouchableOpacity style={styles.headerBtn} onPress={() => setShowQueue(!showQueue)}>
          <Ionicons name="list" size={22} color={showQueue ? artworkGradient : C.text} />
        </TouchableOpacity>
      </View>

      {showQueue ? (
        /* Queue View */
        <View style={styles.queueContainer}>
          <Text style={styles.queueTitle}>Up Next ({queue.length})</Text>
          {queue.length === 0 ? (
            <View style={styles.queueEmpty}>
              <Ionicons name="musical-notes-outline" size={40} color={C.textSecondary} />
              <Text style={styles.queueEmptyText}>Queue is empty</Text>
              <Text style={styles.queueEmptySubtext}>Add songs from the library to play next</Text>
            </View>
          ) : (
            <FlatList
              data={queue}
              keyExtractor={(item, index) => `${item.id}-${index}`}
              renderItem={({ item, index }) => (
                <View style={styles.queueItem}>
                  <Text style={styles.queueIndex}>{index + 1}</Text>
                  <View style={[styles.queueArt, { backgroundColor: item.artworkColor || "#6366F1" + "30" }]}>
                    <Ionicons name="musical-note" size={16} color={item.artworkColor || "#6366F1"} />
                  </View>
                  <View style={styles.queueInfo}>
                    <Text style={styles.queueItemTitle} numberOfLines={1}>{item.title}</Text>
                    <Text style={styles.queueItemArtist} numberOfLines={1}>{item.artist}</Text>
                  </View>
                  <Ionicons name="reorder-three" size={20} color={C.textSecondary} />
                </View>
              )}
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>
      ) : showLyrics ? (
        /* Lyrics View */
        <ScrollView style={styles.lyricsContainer} showsVerticalScrollIndicator={false}>
          {/* Artwork */}
          <View style={styles.artworkSection}>
            <Animated.View style={[styles.vinylDisc, { backgroundColor: artworkGradient + "20", borderColor: artworkGradient }, vinylStyle]}>
              <View style={[styles.vinylCenter, { backgroundColor: artworkGradient }]}>
                <Ionicons name="musical-note" size={28} color="#fff" />
              </View>
              <View style={styles.vinylGroove1} />
              <View style={styles.vinylGroove2} />
              <View style={styles.vinylGroove3} />
            </Animated.View>
          </View>

          {/* Track Info */}
          <View style={styles.trackInfo}>
            <View style={styles.trackTitleRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.trackTitle} numberOfLines={1}>{currentTrack.title}</Text>
                <Text style={styles.trackArtist} numberOfLines={1}>{currentTrack.artist}</Text>
              </View>
              <TouchableOpacity onPress={handleLike}>
                <Ionicons name={liked ? "heart" : "heart-outline"} size={24} color={liked ? "#EF4444" : C.textSecondary} />
              </TouchableOpacity>
            </View>
            {currentTrack.languageFlag && (
              <View style={styles.languageBadge}>
                <Text style={styles.languageFlag}>{currentTrack.languageFlag}</Text>
                <Text style={styles.languageText}>{currentTrack.language}</Text>
              </View>
            )}
          </View>

          {/* Lyrics */}
          <View style={styles.lyricsSection}>
            <View style={styles.lyricsSectionHeader}>
              <Text style={styles.lyricsSectionTitle}>Lyrics</Text>
              <TouchableOpacity onPress={() => setShowLyrics(false)}>
                <Text style={[styles.lyricsToggle, { color: artworkGradient }]}>Hide</Text>
              </TouchableOpacity>
            </View>
            {SAMPLE_LYRICS.map((line, index) => (
              <View
                key={index}
                style={[
                  styles.lyricLine,
                  index === currentLyricIndex && styles.lyricLineActive,
                ]}
              >
                <Text style={[
                  styles.lyricOriginal,
                  index === currentLyricIndex && { color: artworkGradient, fontWeight: "700" },
                ]}>
                  {line.original}
                </Text>
                <Text style={[
                  styles.lyricTranslation,
                  index === currentLyricIndex && { color: C.text, opacity: 1 },
                ]}>
                  {line.translation}
                </Text>
              </View>
            ))}
          </View>
          <View style={{ height: 200 }} />
        </ScrollView>
      ) : (
        /* Artwork Only View */
        <View style={styles.artworkOnlyContainer}>
          <Animated.View style={[styles.vinylDiscLarge, { backgroundColor: artworkGradient + "15", borderColor: artworkGradient }, vinylStyle]}>
            <View style={[styles.vinylCenterLarge, { backgroundColor: artworkGradient }]}>
              <Ionicons name="musical-note" size={48} color="#fff" />
            </View>
            <View style={styles.vinylGrooveLarge1} />
            <View style={styles.vinylGrooveLarge2} />
            <View style={styles.vinylGrooveLarge3} />
          </Animated.View>
          <View style={styles.trackInfoLarge}>
            <Text style={styles.trackTitleLarge} numberOfLines={2}>{currentTrack.title}</Text>
            <Text style={styles.trackArtistLarge} numberOfLines={1}>{currentTrack.artist}</Text>
          </View>
          <TouchableOpacity style={styles.showLyricsBtn} onPress={() => setShowLyrics(true)}>
            <Ionicons name="document-text-outline" size={16} color={artworkGradient} />
            <Text style={[styles.showLyricsBtnText, { color: artworkGradient }]}>Show Lyrics</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Bottom Controls (always visible) */}
      <View style={styles.controlsContainer}>
        {/* Progress Bar */}
        <View style={styles.progressSection}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progress * 100}%`, backgroundColor: artworkGradient }]} />
            <View style={[styles.progressThumb, { left: `${progress * 100}%`, backgroundColor: artworkGradient }]} />
          </View>
          <View style={styles.timeRow}>
            <Text style={styles.timeText}>{formatTime(progress * duration)}</Text>
            <Text style={styles.timeText}>{formatTime(duration)}</Text>
          </View>
        </View>

        {/* Main Controls */}
        <View style={styles.mainControls}>
          <TouchableOpacity onPress={handleShuffle} style={styles.secondaryControl}>
            <Ionicons name="shuffle" size={22} color={shuffleOn ? artworkGradient : C.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity onPress={handleSkipPrevious} style={styles.skipControl}>
            <Ionicons name="play-skip-back" size={28} color={C.text} />
          </TouchableOpacity>

          <TouchableOpacity onPress={handlePlayPause} style={[styles.playButton, { backgroundColor: artworkGradient }]}>
            <Ionicons name={isPlaying ? "pause" : "play"} size={32} color="#fff" />
          </TouchableOpacity>

          <TouchableOpacity onPress={handleSkipNext} style={styles.skipControl}>
            <Ionicons name="play-skip-forward" size={28} color={C.text} />
          </TouchableOpacity>

          <TouchableOpacity onPress={handleRepeat} style={styles.secondaryControl}>
            <Ionicons
              name={repeatMode === "one" ? "repeat" : "repeat"}
              size={22}
              color={repeatMode !== "off" ? artworkGradient : C.textSecondary}
            />
            {repeatMode === "one" && <View style={[styles.repeatOneDot, { backgroundColor: artworkGradient }]} />}
          </TouchableOpacity>
        </View>

        {/* Bottom Actions */}
        <View style={styles.bottomActions}>
          <TouchableOpacity style={styles.actionBtn}>
            <Ionicons name="share-outline" size={20} color={C.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={() => setShowLyrics(!showLyrics)}>
            <Ionicons name="document-text-outline" size={20} color={showLyrics ? artworkGradient : C.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn}>
            <Ionicons name="add-circle-outline" size={20} color={C.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn}>
            <Ionicons name="ellipsis-horizontal" size={20} color={C.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.background },
  // Header
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm },
  headerBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: C.surfaceCard, alignItems: "center", justifyContent: "center" },
  headerCenter: { alignItems: "center" },
  headerLabel: { fontSize: 11, fontWeight: "600", color: C.textSecondary, letterSpacing: 1 },
  headerSublabel: { fontSize: 12, color: C.textSecondary, marginTop: 2 },
  // Empty state
  emptyState: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  emptyTitle: { fontSize: FontSize.xl, fontWeight: "700", color: C.text },
  emptySubtitle: { fontSize: FontSize.sm, color: C.textSecondary },
  backButton: { marginTop: 16, paddingHorizontal: 24, paddingVertical: 12, backgroundColor: C.secondary, borderRadius: BorderRadius.full },
  backButtonText: { fontSize: FontSize.sm, fontWeight: "600", color: "#fff" },
  // Artwork section
  artworkSection: { alignItems: "center", paddingVertical: 20 },
  vinylDisc: { width: 180, height: 180, borderRadius: 90, borderWidth: 3, alignItems: "center", justifyContent: "center" },
  vinylCenter: { width: 60, height: 60, borderRadius: 30, alignItems: "center", justifyContent: "center" },
  vinylGroove1: { position: "absolute", width: 100, height: 100, borderRadius: 50, borderWidth: 1, borderColor: "rgba(255,255,255,0.05)" },
  vinylGroove2: { position: "absolute", width: 130, height: 130, borderRadius: 65, borderWidth: 1, borderColor: "rgba(255,255,255,0.03)" },
  vinylGroove3: { position: "absolute", width: 160, height: 160, borderRadius: 80, borderWidth: 1, borderColor: "rgba(255,255,255,0.02)" },
  // Artwork only (large)
  artworkOnlyContainer: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: Spacing.lg },
  vinylDiscLarge: { width: 260, height: 260, borderRadius: 130, borderWidth: 3, alignItems: "center", justifyContent: "center" },
  vinylCenterLarge: { width: 90, height: 90, borderRadius: 45, alignItems: "center", justifyContent: "center" },
  vinylGrooveLarge1: { position: "absolute", width: 140, height: 140, borderRadius: 70, borderWidth: 1, borderColor: "rgba(255,255,255,0.05)" },
  vinylGrooveLarge2: { position: "absolute", width: 190, height: 190, borderRadius: 95, borderWidth: 1, borderColor: "rgba(255,255,255,0.03)" },
  vinylGrooveLarge3: { position: "absolute", width: 230, height: 230, borderRadius: 115, borderWidth: 1, borderColor: "rgba(255,255,255,0.02)" },
  trackInfoLarge: { marginTop: 32, alignItems: "center" },
  trackTitleLarge: { fontSize: 24, fontWeight: "700", color: C.text, textAlign: "center" },
  trackArtistLarge: { fontSize: FontSize.md, color: C.textSecondary, marginTop: 6 },
  showLyricsBtn: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 20, paddingHorizontal: 16, paddingVertical: 8, borderRadius: BorderRadius.full, backgroundColor: C.surfaceCard, borderWidth: 1, borderColor: C.border },
  showLyricsBtnText: { fontSize: FontSize.sm, fontWeight: "500" },
  // Track info
  trackInfo: { paddingHorizontal: Spacing.lg, marginBottom: 12 },
  trackTitleRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  trackTitle: { fontSize: FontSize.xl, fontWeight: "700", color: C.text },
  trackArtist: { fontSize: FontSize.sm, color: C.textSecondary, marginTop: 4 },
  languageBadge: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 8, alignSelf: "flex-start", paddingHorizontal: 10, paddingVertical: 4, backgroundColor: C.surfaceCard, borderRadius: BorderRadius.full },
  languageFlag: { fontSize: 14 },
  languageText: { fontSize: 12, color: C.textSecondary, fontWeight: "500" },
  // Lyrics
  lyricsContainer: { flex: 1 },
  lyricsSection: { paddingHorizontal: Spacing.lg, paddingTop: 8 },
  lyricsSectionHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 },
  lyricsSectionTitle: { fontSize: FontSize.lg, fontWeight: "700", color: C.text },
  lyricsToggle: { fontSize: FontSize.sm, fontWeight: "500" },
  lyricLine: { paddingVertical: 10, paddingHorizontal: 12, borderRadius: 8, marginBottom: 4 },
  lyricLineActive: { backgroundColor: C.surfaceCard },
  lyricOriginal: { fontSize: FontSize.md, color: C.text, fontWeight: "500", lineHeight: 22 },
  lyricTranslation: { fontSize: FontSize.sm, color: C.textSecondary, marginTop: 4, opacity: 0.7, lineHeight: 20 },
  // Queue
  queueContainer: { flex: 1, paddingHorizontal: Spacing.lg, paddingTop: 12 },
  queueTitle: { fontSize: FontSize.lg, fontWeight: "700", color: C.text, marginBottom: 16 },
  queueEmpty: { flex: 1, alignItems: "center", justifyContent: "center", gap: 8 },
  queueEmptyText: { fontSize: FontSize.md, fontWeight: "600", color: C.text },
  queueEmptySubtext: { fontSize: FontSize.sm, color: C.textSecondary },
  queueItem: { flexDirection: "row", alignItems: "center", paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: C.border },
  queueIndex: { width: 24, fontSize: FontSize.sm, color: C.textSecondary, fontWeight: "500" },
  queueArt: { width: 40, height: 40, borderRadius: 8, alignItems: "center", justifyContent: "center", marginRight: 12 },
  queueInfo: { flex: 1 },
  queueItemTitle: { fontSize: FontSize.sm, fontWeight: "600", color: C.text },
  queueItemArtist: { fontSize: 12, color: C.textSecondary, marginTop: 2 },
  // Controls
  controlsContainer: { paddingHorizontal: Spacing.lg, paddingBottom: Platform.OS === "web" ? 20 : 8 },
  progressSection: { marginBottom: 16 },
  progressBar: { height: 4, backgroundColor: C.border, borderRadius: 2, overflow: "visible" },
  progressFill: { height: "100%", borderRadius: 2 },
  progressThumb: { position: "absolute", top: -5, width: 14, height: 14, borderRadius: 7, marginLeft: -7 },
  timeRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 8 },
  timeText: { fontSize: 12, color: C.textSecondary, fontWeight: "500" },
  mainControls: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 20, marginBottom: 16 },
  secondaryControl: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  skipControl: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  playButton: { width: 64, height: 64, borderRadius: 32, alignItems: "center", justifyContent: "center" },
  repeatOneDot: { position: "absolute", bottom: 2, width: 4, height: 4, borderRadius: 2 },
  bottomActions: { flexDirection: "row", justifyContent: "space-around", paddingTop: 8, borderTopWidth: 1, borderTopColor: C.border },
  actionBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
});
