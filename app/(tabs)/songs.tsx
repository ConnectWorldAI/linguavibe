import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Colors, Spacing, BorderRadius, FontSize } from "../../constants/Colors";
import { DEMO_SONGS, type DemoSong } from "@/lib/demo-songs";
import { useI18n } from "@/lib/i18n";

const { width } = Dimensions.get("window");

const TRENDING_SONGS = [
  { id: "1", title: "Despacito", artist: "Luis Fonsi ft. Daddy Yankee", lang: "🇵🇷 Spanish → English", plays: "2.4M", difficulty: "medium" },
  { id: "2", title: "Dákiti", artist: "Bad Bunny & Jhay Cortez", lang: "🇵🇷 Spanish → English", plays: "1.8M", difficulty: "hard" },
  { id: "3", title: "Tusa", artist: "Karol G & Nicki Minaj", lang: "🇨🇴 Spanish → English", plays: "1.2M", difficulty: "medium" },
  { id: "4", title: "Ojitos Lindos", artist: "Bad Bunny ft. Bomba Estéreo", lang: "🇵🇷 Spanish → French", plays: "890K", difficulty: "hard" },
  { id: "5", title: "La Canción", artist: "J Balvin & Bad Bunny", lang: "🇨🇴 Spanish → English", plays: "650K", difficulty: "easy" },
  { id: "6", title: "Butter", artist: "BTS", lang: "🇰🇷 Korean → Spanish", plays: "3.1M", difficulty: "easy" },
];

const FEATURE_CARDS = [
  { id: "translate", icon: "cloud-upload", title: "Translate a Song", desc: "Upload or paste link", color: Colors.secondary, route: "/song-translate-agent" },
  { id: "translation-studio", icon: "color-wand", title: "Translation Studio", desc: "Voice clone, record, or AI sing", color: "#8B5CF6", route: "/song-translation-studio" },
  { id: "studio", icon: "mic", title: "WavyEq Studio", desc: "Sing over translations", color: Colors.accent, route: "/studio" },
  { id: "cover", icon: "videocam", title: "Song Cover", desc: "Record & post to profile", color: Colors.gold, route: "/song-cover" },
  { id: "karaoke", icon: "musical-notes", title: "Karaoke Mode", desc: "Sing along with scoring", color: Colors.gold, route: "/karaoke-mode" },
  { id: "library", icon: "library", title: "Song Library", desc: "Browse learning songs", color: "#06B6D4", route: "/song-library" },
  { id: "ai-gen", icon: "sparkles", title: "AI Music Lab", desc: "Generate songs to learn", color: "#8B5CF6", route: "/upload-song" },
  { id: "gen-learn", icon: "bulb", title: "Generate Learning Song", desc: "AI creates songs for you", color: "#EC4899", route: "/generate-learning-song" },
];

type FilterType = "trending" | "library" | "generated";

export default function SongsScreen() {
  const { t } = useI18n();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterType>("trending");

  const renderFeatureCard = ({ item }: { item: typeof FEATURE_CARDS[0] }) => (
    <TouchableOpacity
      style={[styles.featureCard, { borderColor: item.color + "50" }]}
      activeOpacity={0.8}
      onPress={() => item.route && router.push(item.route as any)}
    >
      <View style={[styles.featureIcon, { backgroundColor: item.color + "18", borderColor: item.color + "40" }]}>
        <Ionicons name={item.icon as any} size={20} color={item.color} />
      </View>
      <Text style={styles.featureTitle}>{item.title}</Text>
      <Text style={styles.featureDesc}>{item.desc}</Text>
      {!item.route && (
        <View style={styles.comingSoonBadge}>
          <Text style={styles.comingSoonText}>Soon</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  const renderSongItem = ({ item }: { item: typeof TRENDING_SONGS[0] }) => (
    <TouchableOpacity
      style={styles.songItem}
      onPress={() => router.push("/song-player")}
      activeOpacity={0.7}
    >
      <View style={styles.songArt}>
        <Ionicons name="musical-note" size={18} color={Colors.secondary} />
      </View>
      <View style={styles.songInfo}>
        <Text style={styles.songTitle} numberOfLines={1}>{item.title}</Text>
        <Text style={styles.songArtist} numberOfLines={1}>{item.artist}</Text>
        <Text style={styles.songLang}>{item.lang}</Text>
      </View>
      <View style={styles.songMeta}>
        <Text style={styles.songPlays}>{item.plays}</Text>
        <View style={[
          styles.diffBadge,
          item.difficulty === "easy" && { backgroundColor: "rgba(0, 255, 136, 0.15)" },
          item.difficulty === "medium" && { backgroundColor: "rgba(255, 214, 0, 0.15)" },
          item.difficulty === "hard" && { backgroundColor: "rgba(255, 45, 45, 0.15)" },
        ]}>
          <Text style={[
            styles.diffText,
            item.difficulty === "easy" && { color: Colors.success },
            item.difficulty === "medium" && { color: Colors.warning },
            item.difficulty === "hard" && { color: Colors.accent },
          ]}>{item.difficulty}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const ListHeader = () => (
    <View>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t.songs}</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.libraryBtn} onPress={() => router.push("/playlists" as any)}>
            <Ionicons name="library" size={20} color={Colors.secondary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.creditsChip}>
            <Ionicons name="flash" size={14} color={Colors.warning} />
            <Text style={styles.creditsChipText}>3 left today</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={18} color={Colors.textSecondary} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search songs, artists, genres..."
          placeholderTextColor={Colors.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Feature Cards Row */}
      <FlatList
        data={FEATURE_CARDS}
        renderItem={renderFeatureCard}
        keyExtractor={(item) => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.featureRow}
      />

      {/* TikTok-style Discover Card */}
      <TouchableOpacity style={styles.discoverCard} activeOpacity={0.85}>
        <View style={styles.discoverGlow} />
        <View style={styles.discoverContent}>
          <View style={styles.discoverLeft}>
            <View style={styles.discoverBadge}>
              <Ionicons name="trending-up" size={12} color={Colors.textPrimary} />
              <Text style={styles.discoverBadgeText}>VIRAL NOW</Text>
            </View>
            <Text style={styles.discoverTitle}>Song Feed</Text>
            <Text style={styles.discoverDesc}>
              Swipe through translated songs • TikTok-style discovery
            </Text>
          </View>
          <View style={styles.discoverPlayBtn}>
            <Ionicons name="play" size={24} color={Colors.textPrimary} />
          </View>
        </View>
      </TouchableOpacity>

      {/* Demo Songs Section — Try the full pipeline without uploading */}
      <View style={styles.demoSection}>
        <View style={styles.demoHeader}>
          <View style={styles.demoBadge}>
            <Ionicons name="flash" size={10} color="#FFF" />
            <Text style={styles.demoBadgeText}>TRY IT FREE</Text>
          </View>
          <Text style={styles.demoTitle}>Demo Songs</Text>
          <Text style={styles.demoSubtitle}>Test the full splitter + lesson pipeline — no upload needed</Text>
        </View>
        {DEMO_SONGS.map((demo) => (
          <TouchableOpacity
            key={demo.id}
            style={[styles.demoCard, { borderColor: demo.coverColor + "60" }]}
            activeOpacity={0.8}
            onPress={() => router.push({
              pathname: "/song-player" as any,
              params: {
                title: demo.title,
                artist: demo.artist,
                sourceLanguage: demo.sourceLanguage,
                targetLanguage: demo.targetLanguage,
                demoSongId: demo.id,
              },
            })}
          >
            <View style={[styles.demoArt, { backgroundColor: demo.coverColor + "25" }]}>
              <Ionicons name="musical-notes" size={22} color={demo.coverColor} />
            </View>
            <View style={styles.demoInfo}>
              <Text style={styles.demoSongTitle}>{demo.title}</Text>
              <Text style={styles.demoArtist}>{demo.artist}</Text>
              <Text style={styles.demoMeta}>{demo.dialect} • {demo.difficulty} • {demo.duration}</Text>
            </View>
            <View style={styles.demoActions}>
              <TouchableOpacity
                style={[styles.demoActionBtn, { backgroundColor: demo.coverColor + "20" }]}
                onPress={() => router.push({
                  pathname: "/stem-separator" as any,
                  params: { songTitle: demo.title, songArtist: demo.artist, demoSongId: demo.id },
                })}
              >
                <Ionicons name="layers" size={14} color={demo.coverColor} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.demoActionBtn, { backgroundColor: "#FFD70020" }]}
                onPress={() => router.push({
                  pathname: "/song-lesson-breakdown" as any,
                  params: {
                    title: demo.title,
                    artist: demo.artist,
                    lyrics: demo.lyrics,
                    sourceLanguage: demo.sourceLanguage,
                    targetLanguage: demo.targetLanguage,
                  },
                })}
              >
                <Ionicons name="school" size={14} color="#FFD700" />
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* Voice Clone CTA */}
      <TouchableOpacity style={styles.voiceCloneCard} activeOpacity={0.85}>
        <View style={styles.voiceCloneIcon}>
          <Ionicons name="person-circle" size={24} color={Colors.gold} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.voiceCloneTitle}>Voice Clone</Text>
          <Text style={styles.voiceCloneDesc}>Hear yourself singing in any language</Text>
        </View>
        <View style={styles.proBadge}>
          <Text style={styles.proBadgeText}>PRO</Text>
        </View>
      </TouchableOpacity>

      {/* Filter Tabs */}
      <View style={styles.filterRow}>
        {([
          { key: "trending", label: "Trending", icon: "flame" },
          { key: "library", label: "My Library", icon: "library" },
          { key: "generated", label: "AI Generated", icon: "sparkles" },
        ] as const).map((filter) => (
          <TouchableOpacity
            key={filter.key}
            style={[styles.filterTab, activeFilter === filter.key && styles.filterTabActive]}
            onPress={() => setActiveFilter(filter.key)}
          >
            <Ionicons
              name={filter.icon as any}
              size={14}
              color={activeFilter === filter.key ? Colors.textPrimary : Colors.textSecondary}
            />
            <Text style={[styles.filterTabText, activeFilter === filter.key && styles.filterTabTextActive]}>
              {filter.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Section Title */}
      <Text style={styles.sectionTitle}>
        {activeFilter === "trending" ? "Trending Translations" :
         activeFilter === "library" ? "Your Translated Songs" : "AI-Generated Songs"}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={TRENDING_SONGS}
        renderItem={renderSongItem}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={ListHeader}
        ListFooterComponent={<View style={{ height: 100 }} />}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  headerTitle: {
    fontSize: FontSize.xxl,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  libraryBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surfaceCard,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  creditsChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surfaceCard,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    gap: 4,
    borderWidth: 1,
    borderColor: Colors.yellowBorder,
  },
  creditsChipText: {
    color: Colors.warning,
    fontSize: FontSize.xs,
    fontWeight: "600",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surfaceCard,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  searchInput: {
    flex: 1,
    color: Colors.textPrimary,
    fontSize: FontSize.md,
    paddingVertical: Spacing.md,
  },

  // Feature cards
  featureRow: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    gap: 10,
  },
  featureCard: {
    width: 120,
    padding: Spacing.md,
    backgroundColor: Colors.surfaceCard,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    alignItems: "center",
    gap: 6,
  },
  featureIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  featureTitle: {
    fontSize: FontSize.sm,
    fontWeight: "700",
    color: Colors.textPrimary,
    textAlign: "center",
  },
  featureDesc: {
    fontSize: 10,
    color: Colors.textSecondary,
    textAlign: "center",
  },
  comingSoonBadge: {
    position: "absolute",
    top: 6,
    right: 6,
    backgroundColor: Colors.goldGlow,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: Colors.goldBorder,
  },
  comingSoonText: {
    fontSize: 8,
    fontWeight: "700",
    color: Colors.gold,
  },

  // Discover card
  discoverCard: {
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.lg,
    backgroundColor: Colors.surfaceCard,
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5,
    borderColor: Colors.glowBorder,
    overflow: "hidden",
    shadowColor: Colors.glow,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  discoverGlow: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: Colors.secondary,
  },
  discoverContent: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
  },
  discoverLeft: {
    flex: 1,
  },
  discoverBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: Colors.accent,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
    alignSelf: "flex-start",
    marginBottom: 8,
  },
  discoverBadgeText: {
    fontSize: 9,
    fontWeight: "800",
    color: Colors.textPrimary,
    letterSpacing: 0.5,
  },
  discoverTitle: {
    fontSize: FontSize.lg,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  discoverDesc: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  discoverPlayBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.secondary,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: Colors.glow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.6,
    shadowRadius: 10,
    elevation: 8,
  },

  // Voice clone
  voiceCloneCard: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.md,
    padding: Spacing.md,
    backgroundColor: Colors.surfaceCard,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.goldBorder,
    gap: 12,
  },
  voiceCloneIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.goldGlow,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.goldBorder,
  },
  voiceCloneTitle: {
    fontSize: FontSize.md,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  voiceCloneDesc: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  proBadge: {
    backgroundColor: Colors.gold,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  proBadgeText: {
    fontSize: 10,
    fontWeight: "800",
    color: Colors.textDark,
  },

  // Filter tabs
  filterRow: {
    flexDirection: "row",
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.lg,
    gap: 8,
  },
  filterTab: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surfaceCard,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterTabActive: {
    backgroundColor: Colors.secondary,
    borderColor: Colors.secondary,
  },
  filterTabText: {
    fontSize: FontSize.sm,
    fontWeight: "600",
    color: Colors.textSecondary,
  },
  filterTabTextActive: {
    color: Colors.textPrimary,
  },

  // Section title
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: "700",
    color: Colors.textPrimary,
    paddingHorizontal: Spacing.lg,
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },

  // Song items
  songItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    gap: 12,
  },
  songArt: {
    width: 46,
    height: 46,
    backgroundColor: Colors.glowSubtle,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.glowBorder,
  },
  songInfo: {
    flex: 1,
  },
  songTitle: {
    fontSize: FontSize.md,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  songArtist: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  songLang: {
    fontSize: FontSize.xs,
    color: Colors.secondary,
    marginTop: 3,
    fontWeight: "500",
  },
  songMeta: {
    alignItems: "flex-end",
    gap: 4,
  },
  songPlays: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
  },
  diffBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  diffText: {
    fontSize: 9,
    fontWeight: "700",
    textTransform: "uppercase",
  },

  // Demo songs section
  demoSection: {
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.lg,
    backgroundColor: Colors.surfaceCard,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.glowBorder,
    padding: Spacing.md,
    gap: 10,
  },
  demoHeader: {
    marginBottom: 4,
  },
  demoBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: Colors.success,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
    alignSelf: "flex-start",
    marginBottom: 6,
  },
  demoBadgeText: {
    fontSize: 9,
    fontWeight: "800",
    color: "#FFF",
    letterSpacing: 0.5,
  },
  demoTitle: {
    fontSize: FontSize.lg,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  demoSubtitle: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  demoCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    gap: 10,
  },
  demoArt: {
    width: 44,
    height: 44,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  demoInfo: {
    flex: 1,
  },
  demoSongTitle: {
    fontSize: FontSize.md,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  demoArtist: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  demoMeta: {
    fontSize: 10,
    color: Colors.secondary,
    marginTop: 2,
    fontWeight: "500",
  },
  demoActions: {
    flexDirection: "row",
    gap: 6,
  },
  demoActionBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
});
