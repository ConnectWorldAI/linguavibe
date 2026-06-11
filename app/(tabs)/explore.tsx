import React, { useState, useCallback, useEffect } from "react";
import { ScreenErrorBoundary } from "@/components/error-boundary";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  ScrollView,
  Dimensions,
  Image,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { trpc } from "@/lib/trpc";
import { Colors, Spacing, BorderRadius, FontSize } from "../../constants/Colors";
import { useI18n } from "@/lib/i18n";
import { CreatorDiscoveryFeed } from "@/components/creator-discovery-feed";
import { SaveButton } from "@/components/save-button";
import { ExploreTabSkeleton, hapticLoadComplete } from "@/components/skeleton-loader";

const { width } = Dimensions.get("window");
const GRID_GAP = 2;
const NUM_COLUMNS = 3;
const TILE_SIZE = (width - GRID_GAP * (NUM_COLUMNS - 1)) / NUM_COLUMNS;

type SubTab = "foryou" | "trending" | "news" | "tech" | "live";

const SUB_TABS: { id: SubTab; label: string; icon: string }[] = [
  { id: "foryou", label: "For You", icon: "sparkles" },
  { id: "trending", label: "Trending", icon: "trending-up" },
  { id: "news", label: "World News", icon: "newspaper" },
  { id: "tech", label: "Tech", icon: "hardware-chip" },
  { id: "live", label: "Live", icon: "radio" },
];

type ContentTile = {
  id: string;
  type: "video" | "image" | "live";
  thumbnail: string;
  flag: string;
  language: string;
  caption: string;
  views: string;
  isLive?: boolean;
  isPremium?: boolean;
  height: "small" | "medium" | "large";
};

// Mock content tiles representing language learning content from around the world
const CONTENT_TILES: ContentTile[] = [
  { id: "1", type: "video", thumbnail: "", flag: "🇩🇴", language: "Dominican Spanish", caption: "Dime a ver — street interview Santo Domingo", views: "45K", height: "large", isPremium: false },
  { id: "2", type: "video", thumbnail: "", flag: "🇫🇷", language: "French", caption: "Paris slang you won't learn in school", views: "128K", height: "small", isPremium: false },
  { id: "3", type: "video", thumbnail: "", flag: "🇯🇵", language: "Japanese", caption: "Tokyo convenience store phrases", views: "89K", height: "medium", isPremium: false },
  { id: "4", type: "live", thumbnail: "", flag: "🇨🇴", language: "Colombian Spanish", caption: "LIVE: Medellín street food tour", views: "2.1K watching", isLive: true, height: "large", isPremium: false },
  { id: "5", type: "video", thumbnail: "", flag: "🇳🇬", language: "Yoruba", caption: "Nigerian pidgin vs Yoruba — know the difference", views: "67K", height: "small", isPremium: true },
  { id: "6", type: "video", thumbnail: "", flag: "🇰🇷", language: "Korean", caption: "K-drama phrases that hit different", views: "234K", height: "medium", isPremium: false },
  { id: "7", type: "video", thumbnail: "", flag: "🇧🇷", language: "Brazilian Portuguese", caption: "Funk carioca lyrics decoded", views: "156K", height: "medium", isPremium: false },
  { id: "8", type: "video", thumbnail: "", flag: "🇲🇽", language: "Mexican Spanish", caption: "CDMX market haggling 101", views: "91K", height: "small", isPremium: true },
  { id: "9", type: "video", thumbnail: "", flag: "🇩🇪", language: "German", caption: "Berlin techno scene vocabulary", views: "43K", height: "large", isPremium: false },
  { id: "10", type: "video", thumbnail: "", flag: "🇸🇦", language: "Arabic", caption: "Gulf Arabic vs Egyptian — daily phrases", views: "78K", height: "small", isPremium: false },
  { id: "11", type: "live", thumbnail: "", flag: "🇵🇷", language: "Puerto Rican Spanish", caption: "LIVE: Reggaetón lyrics breakdown", views: "1.8K watching", isLive: true, height: "medium", isPremium: false },
  { id: "12", type: "video", thumbnail: "", flag: "🇮🇳", language: "Hindi", caption: "Bollywood dialogues — learn Hindi through movies", views: "312K", height: "medium", isPremium: false },
  { id: "13", type: "video", thumbnail: "", flag: "🇹🇭", language: "Thai", caption: "Bangkok night market survival guide", views: "55K", height: "small", isPremium: false },
  { id: "14", type: "video", thumbnail: "", flag: "🇭🇹", language: "Haitian Creole", caption: "Kreyòl expressions for everyday life", views: "29K", height: "large", isPremium: true },
  { id: "15", type: "video", thumbnail: "", flag: "🇮🇹", language: "Italian", caption: "Italian hand gestures decoded 🤌", views: "445K", height: "small", isPremium: false },
  { id: "16", type: "video", thumbnail: "", flag: "🇻🇪", language: "Venezuelan Spanish", caption: "Maracucho slang nobody teaches you", views: "38K", height: "medium", isPremium: false },
  { id: "17", type: "video", thumbnail: "", flag: "🇰🇪", language: "Swahili", caption: "Nairobi sheng vs standard Swahili", views: "22K", height: "small", isPremium: false },
  { id: "18", type: "video", thumbnail: "", flag: "🇵🇭", language: "Tagalog", caption: "Filipino internet slang 2026", views: "67K", height: "large", isPremium: false },
];

// Color palette for placeholder thumbnails
const TILE_COLORS = [
  "#1a2744", "#2d1b3d", "#1b3d2d", "#3d2d1b", "#1b2d3d",
  "#2d3d1b", "#3d1b2d", "#1b3d3d", "#3d3d1b", "#2d1b1b",
  "#1b1b3d", "#3d1b1b", "#1b3d1b", "#2d2d3d", "#3d2d2d",
  "#1b2d2d", "#2d3d2d", "#3d1b3d",
];

export default function ExploreScreen() {
  const { t } = useI18n();
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<SubTab>("foryou");
  const [searchText, setSearchText] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => { setIsLoading(false); hapticLoadComplete(); }, 600);
    return () => clearTimeout(timer);
  }, []);
  const [dailyUsed, setDailyUsed] = useState(2); // Mock: user has used 2 of 5 free breakdowns
  const FREE_LIMIT = 5;

  const handleTilePress = (tile: ContentTile) => {
    if (tile.isPremium && dailyUsed >= FREE_LIMIT) {
      Alert.alert(
        "Pro Content",
        "Upgrade to Pro for unlimited access to premium content with full dialect breakdowns.",
        [
          { text: "Upgrade", onPress: () => router.push("/subscription") },
          { text: "Cancel", style: "cancel" },
        ]
      );
      return;
    }
    setDailyUsed((prev) => prev + 1);
    router.push({
      pathname: "/explore-detail",
      params: { id: tile.id, flag: tile.flag, language: tile.language, caption: tile.caption },
    });
  };

  const renderTile = useCallback(({ item, index }: { item: ContentTile; index: number }) => {
    const isLarge = index % 9 === 0; // Every 9th tile is large (spans 2 rows)
    const tileHeight = isLarge ? TILE_SIZE * 2 + GRID_GAP : TILE_SIZE;

    return (
      <TouchableOpacity
        style={[
          styles.tile,
          {
            width: TILE_SIZE,
            height: tileHeight,
            backgroundColor: TILE_COLORS[index % TILE_COLORS.length],
          },
        ]}
        activeOpacity={0.85}
        onPress={() => handleTilePress(item)}
      >
        {/* Content overlay */}
        <View style={styles.tileOverlay}>
          {/* Top badges */}
          <View style={styles.tileBadgeRow}>
            <View style={styles.flagBadge}>
              <Text style={styles.flagText}>{item.flag}</Text>
            </View>
            {item.isLive && (
              <View style={styles.liveBadge}>
                <View style={styles.liveDot} />
                <Text style={styles.liveText}>LIVE</Text>
              </View>
            )}
            {item.isPremium && (
              <View style={styles.proBadge}>
                <Ionicons name="lock-closed" size={8} color="#FFB800" />
                <Text style={styles.proText}>PRO</Text>
              </View>
            )}
          </View>

          {/* Bottom info */}
          <View style={styles.tileBottom}>
            {item.type === "video" && !item.isLive && (
              <View style={styles.playIcon}>
                <Ionicons name="play" size={10} color="#FFFFFF" />
              </View>
            )}
            <Text style={styles.tileViews}>{item.views}</Text>
          </View>
        </View>

        {/* Translated badge */}
        <View style={styles.translatedBadge}>
          <Ionicons name="language" size={9} color={Colors.secondary} />
        </View>
        {/* Save button */}
        <View style={styles.tileSaveBtn}>
          <SaveButton
            itemId={item.id}
            itemType="video"
            title={item.caption}
            language={item.language}
            languageFlag={item.flag}
            sourceScreen="explore"
            size={14}
          />
        </View>
      </TouchableOpacity>
    );
  }, []);

  if (isLoading) {
    return (<ScreenErrorBoundary><SafeAreaView style={styles.container}><ExploreTabSkeleton /></SafeAreaView></ScreenErrorBoundary>);
  }

  return (
    <ScreenErrorBoundary>
    <SafeAreaView style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={[styles.searchBar, searchFocused && styles.searchBarFocused]}>
          <Ionicons name="search" size={18} color={searchFocused ? Colors.secondary : Colors.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search languages, topics, creators..."
            placeholderTextColor={Colors.textMuted}
            value={searchText}
            onChangeText={setSearchText}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
          />
          {searchText.length > 0 && (
            <TouchableOpacity onPress={() => setSearchText("")}>
              <Ionicons name="close-circle" size={18} color={Colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Content Grid - wraps all above sections as header so everything scrolls */}
      <FlatList
        data={CONTENT_TILES}
        renderItem={renderTile}
        keyExtractor={(item) => item.id}
        numColumns={NUM_COLUMNS}
        columnWrapperStyle={styles.gridRow}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.gridContent}
        ItemSeparatorComponent={() => <View style={{ height: GRID_GAP }} />}
        ListHeaderComponent={
          <View>
            {/* Sub-tabs */}
            <View style={styles.subTabContainer}>
              <FlatList
                horizontal
                scrollEnabled={false}
                showsHorizontalScrollIndicator={false}
                data={SUB_TABS}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.subTabList}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[styles.subTab, activeTab === item.id && styles.subTabActive]}
                    onPress={() => setActiveTab(item.id)}
                  >
                    <Ionicons name={item.icon as any} size={14} color={activeTab === item.id ? Colors.secondary : Colors.textSecondary} />
                    <Text style={[styles.subTabText, activeTab === item.id && styles.subTabTextActive]}>{item.label}</Text>
                  </TouchableOpacity>
                )}
              />
            </View>

            {/* Trending Topics Carousel */}
            {activeTab === "trending" && (
              <View style={styles.trendingSection}>
                <Text style={styles.trendingSectionTitle}>{"\ud83d\udd25"} Trending Now</Text>
                <FlatList
                  horizontal
                  scrollEnabled={true}
                  showsHorizontalScrollIndicator={false}
                  data={[
                    { id: "t1", title: "AI Language Models 2026", source: "TechCrunch", category: "Tech", emoji: "\ud83e\udd16" },
                    { id: "t2", title: "World Cup Qualifiers", source: "ESPN", category: "Sports", emoji: "\u26bd" },
                    { id: "t3", title: "K-Pop Global Tour", source: "Billboard", category: "Music", emoji: "\ud83c\udfb5" },
                    { id: "t4", title: "Fashion Week Milan", source: "Vogue", category: "Modeling", emoji: "\ud83d\udc57" },
                    { id: "t5", title: "Crypto Market Rally", source: "CoinDesk", category: "Finance", emoji: "\ud83d\udcc8" },
                    { id: "t6", title: "Climate Summit 2026", source: "Reuters", category: "World", emoji: "\ud83c\udf0d" },
                  ]}
                  keyExtractor={(item) => item.id}
                  contentContainerStyle={{ paddingHorizontal: 16, gap: 10 }}
                  renderItem={({ item }) => (
                    <TouchableOpacity style={styles.trendingCard} activeOpacity={0.8}>
                      <Text style={styles.trendingEmoji}>{item.emoji}</Text>
                      <Text style={styles.trendingTitle} numberOfLines={2}>{item.title}</Text>
                      <Text style={styles.trendingSource}>{item.source} {"\u2022"} {item.category}</Text>
                    </TouchableOpacity>
                  )}
                />
              </View>
            )}

            {/* Category Filters for News */}
            {activeTab === "news" && (
              <FlatList
                horizontal
                scrollEnabled={true}
                showsHorizontalScrollIndicator={false}
                data={[
                  { id: "all", label: "All" },
                  { id: "world", label: "World" },
                  { id: "tech", label: "Technology" },
                  { id: "culture", label: "Culture" },
                  { id: "sports", label: "Sports" },
                  { id: "modeling", label: "Modeling" },
                  { id: "finance", label: "Finance" },
                  { id: "entertainment", label: "Entertainment" },
                ]}
                keyExtractor={(item) => item.id}
                contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 8, gap: 8 }}
                renderItem={({ item }) => (
                  <TouchableOpacity style={styles.categoryChip}>
                    <Text style={styles.categoryChipText}>{item.label}</Text>
                  </TouchableOpacity>
                )}
              />
            )}

            {/* Free tier usage indicator */}
            <View style={styles.usageBar}>
              <View style={styles.usageLeft}>
                <Ionicons name="flash" size={12} color={Colors.secondary} />
                <Text style={styles.usageText}>
                  {FREE_LIMIT - dailyUsed} free translations left today
                </Text>
              </View>
              <TouchableOpacity style={styles.upgradeChip} onPress={() => router.push("/membership" as any)}>
                <Text style={styles.upgradeText}>Upgrade</Text>
                <Ionicons name="arrow-forward" size={10} color={Colors.gold} />
              </TouchableOpacity>
            </View>

            {/* Feature Doorways */}
            <View style={styles.doorwayRow}>
              <TouchableOpacity style={styles.doorwayCard} activeOpacity={0.7} onPress={() => router.push("/watch-party" as any)}>
                <View style={[styles.doorwayIcon, { backgroundColor: "rgba(168, 85, 247, 0.12)", borderColor: "rgba(168, 85, 247, 0.40)" }]}>
                  <Ionicons name="tv" size={18} color="#A855F7" />
                </View>
                <Text style={styles.doorwayLabel}>Watch Party</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.doorwayCard} activeOpacity={0.7} onPress={() => router.push("/dream-vacation" as any)}>
                <View style={[styles.doorwayIcon, { backgroundColor: "rgba(34, 197, 94, 0.12)", borderColor: "rgba(34, 197, 94, 0.40)" }]}>
                  <Ionicons name="airplane" size={18} color="#22C55E" />
                </View>
                <Text style={styles.doorwayLabel}>Dream Trip</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.doorwayCard} activeOpacity={0.7} onPress={() => router.push("/discover-people" as any)}>
                <View style={[styles.doorwayIcon, { backgroundColor: "rgba(6, 182, 212, 0.12)", borderColor: "rgba(6, 182, 212, 0.40)" }]}>
                  <Ionicons name="people" size={18} color="#06B6D4" />
                </View>
                <Text style={styles.doorwayLabel}>Discover</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.doorwayCard} activeOpacity={0.7} onPress={() => router.push("/trending-updates" as any)}>
                <View style={[styles.doorwayIcon, { backgroundColor: "rgba(236, 72, 153, 0.12)", borderColor: "rgba(236, 72, 153, 0.40)" }]}>
                  <Ionicons name="flame" size={18} color="#EC4899" />
                </View>
                <Text style={styles.doorwayLabel}>Trending</Text>
              </TouchableOpacity>
            </View>

            {/* More Features */}
            <View style={styles.doorwayRow}>
              <TouchableOpacity style={styles.doorwayCard} activeOpacity={0.7} onPress={() => router.push("/progress-feed" as any)}>
                <View style={[styles.doorwayIcon, { backgroundColor: "rgba(34, 197, 94, 0.12)", borderColor: "rgba(34, 197, 94, 0.40)" }]}>
                  <Ionicons name="bar-chart" size={18} color="#22C55E" />
                </View>
                <Text style={styles.doorwayLabel}>Progress</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.doorwayCard} activeOpacity={0.7} onPress={() => router.push("/offline-content" as any)}>
                <View style={[styles.doorwayIcon, { backgroundColor: "rgba(245, 158, 11, 0.12)", borderColor: "rgba(245, 158, 11, 0.40)" }]}>
                  <Ionicons name="cloud-download" size={18} color="#F59E0B" />
                </View>
                <Text style={styles.doorwayLabel}>Offline</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.doorwayCard} activeOpacity={0.7} onPress={() => router.push("/lesson-path" as any)}>
                <View style={[styles.doorwayIcon, { backgroundColor: "rgba(124, 58, 237, 0.12)", borderColor: "rgba(124, 58, 237, 0.40)" }]}>
                  <Ionicons name="map" size={18} color="#7C3AED" />
                </View>
                <Text style={styles.doorwayLabel}>Path</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.doorwayCard} activeOpacity={0.7} onPress={() => router.push("/scorecard-compare" as any)}>
                <View style={[styles.doorwayIcon, { backgroundColor: "rgba(255, 184, 0, 0.12)", borderColor: "rgba(255, 184, 0, 0.40)" }]}>
                  <Ionicons name="trophy" size={18} color="#FFB800" />
                </View>
                <Text style={styles.doorwayLabel}>Scorecard</Text>
              </TouchableOpacity>
            </View>
            {/* Dialect & Cultural Features */}
            <View style={styles.doorwayRow}>
              <TouchableOpacity style={styles.doorwayCard} activeOpacity={0.7} onPress={() => router.push("/dialect-map" as any)}>
                <View style={[styles.doorwayIcon, { backgroundColor: "rgba(16, 185, 129, 0.12)", borderColor: "rgba(16, 185, 129, 0.40)" }]}>
                  <Ionicons name="globe" size={18} color="#10B981" />
                </View>
                <Text style={styles.doorwayLabel}>Dialect Map</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.doorwayCard} activeOpacity={0.7} onPress={() => router.push("/dialect-of-the-week" as any)}>
                <View style={[styles.doorwayIcon, { backgroundColor: "rgba(99, 102, 241, 0.12)", borderColor: "rgba(99, 102, 241, 0.40)" }]}>
                  <Ionicons name="calendar" size={18} color="#6366F1" />
                </View>
                <Text style={styles.doorwayLabel}>Weekly Dialect</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.doorwayCard} activeOpacity={0.7} onPress={() => router.push("/cultural-lessons" as any)}>
                <View style={[styles.doorwayIcon, { backgroundColor: "rgba(244, 63, 94, 0.12)", borderColor: "rgba(244, 63, 94, 0.40)" }]}>
                  <Ionicons name="heart" size={18} color="#F43F5E" />
                </View>
                <Text style={styles.doorwayLabel}>Culture</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.doorwayCard} activeOpacity={0.7} onPress={() => router.push("/share-card-generator" as any)}>
                <View style={[styles.doorwayIcon, { backgroundColor: "rgba(168, 85, 247, 0.12)", borderColor: "rgba(168, 85, 247, 0.40)" }]}>
                  <Ionicons name="share-social" size={18} color="#A855F7" />
                </View>
                <Text style={styles.doorwayLabel}>Share Cards</Text>
              </TouchableOpacity>
            </View>

            {/* Song Cover Feed */}
            <View style={styles.songCoverSection}>
              <View style={styles.songCoverHeader}>
                <Text style={styles.songCoverTitle}>{"\ud83c\udfa4"} Song Covers</Text>
                <TouchableOpacity onPress={() => router.push("/song-cover" as any)}>
                  <Text style={styles.songCoverSeeAll}>See All</Text>
                </TouchableOpacity>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}>
                {[
                  { id: "1", title: "Despacito", artist: "Luis Fonsi", lang: "Spanish \u2192 English", flag: "\ud83c\uddea\ud83c\uddf8", plays: "12.4K", color: "#1a2744" },
                  { id: "2", title: "Papaoutai", artist: "Stromae", lang: "French \u2192 English", flag: "\ud83c\uddeb\ud83c\uddf7", plays: "8.9K", color: "#2d1b3d" },
                  { id: "3", title: "Con Calma", artist: "Daddy Yankee", lang: "Spanish \u2192 Japanese", flag: "\ud83c\uddef\ud83c\uddf5", plays: "6.2K", color: "#1b3d2d" },
                  { id: "4", title: "D\u00e1kiti", artist: "Bad Bunny", lang: "Spanish \u2192 Korean", flag: "\ud83c\uddf0\ud83c\uddf7", plays: "15.1K", color: "#3d2d1b" },
                  { id: "5", title: "B\u00e9same Mucho", artist: "Andrea Bocelli", lang: "Spanish \u2192 Hindi", flag: "\ud83c\uddee\ud83c\uddf3", plays: "4.7K", color: "#1b2d3d" },
                ].map((cover) => (
                  <TouchableOpacity key={cover.id} style={[styles.songCoverCard, { backgroundColor: cover.color }]} activeOpacity={0.8} onPress={() => router.push("/song-cover" as any)}>
                    <View style={styles.songCoverPlay}>
                      <Ionicons name="play" size={14} color="#FFFFFF" />
                    </View>
                    <Text style={styles.songCoverSong} numberOfLines={1}>{cover.title}</Text>
                    <Text style={styles.songCoverArtist} numberOfLines={1}>{cover.artist}</Text>
                    <View style={styles.songCoverMeta}>
                      <Text style={styles.songCoverFlag}>{cover.flag}</Text>
                      <Text style={styles.songCoverLang}>{cover.lang}</Text>
                    </View>
                    <View style={styles.songCoverPlays}>
                      <Ionicons name="headset" size={10} color="#9BA1A6" />
                      <Text style={styles.songCoverPlaysText}>{cover.plays}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* AI Video Content (Kling-powered) */}
            <View style={styles.klingSection}>
              <View style={styles.klingHeader}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                  <Ionicons name="videocam" size={16} color="#F97316" />
                  <Text style={styles.klingTitle}>AI Video Lessons</Text>
                </View>
                <View style={styles.klingBadge}>
                  <Text style={styles.klingBadgeText}>Powered by Kling AI</Text>
                </View>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}>
                {[
                  { id: "k1", category: "immersion-clip" as const, topic: "Walking through Mexico City streets", language: "Spanish", flag: "\ud83c\uddf2\ud83c\uddfd", color: "#1a2744" },
                  { id: "k2", category: "cultural-scenario" as const, topic: "Ordering coffee in a Parisian caf\u00e9", language: "French", flag: "\ud83c\uddeb\ud83c\uddf7", color: "#2d1b3d" },
                  { id: "k3", category: "vocabulary-story" as const, topic: "The journey of the word Sakura", language: "Japanese", flag: "\ud83c\uddef\ud83c\uddf5", color: "#1b3d2d" },
                  { id: "k4", category: "cultural-scenario" as const, topic: "Haggling at a Marrakech souk", language: "Arabic", flag: "\ud83c\uddf2\ud83c\udde6", color: "#3d2d1b" },
                  { id: "k5", category: "immersion-clip" as const, topic: "Night market in Bangkok", language: "Thai", flag: "\ud83c\uddf9\ud83c\udded", color: "#1b2d3d" },
                  { id: "k6", category: "grammar-visual" as const, topic: "Ser vs Estar explained visually", language: "Spanish", flag: "\ud83c\uddea\ud83c\uddf8", color: "#2d3d1b" },
                ].map((video) => (
                  <TouchableOpacity
                    key={video.id}
                    style={[styles.klingCard, { backgroundColor: video.color }]}
                    activeOpacity={0.8}
                    onPress={() => router.push({
                      pathname: "/explore-detail",
                      params: { id: video.id, flag: video.flag, language: video.language, caption: video.topic },
                    })}
                  >
                    <View style={styles.klingCardOverlay}>
                      <View style={styles.klingPlayBtn}>
                        <Ionicons name="play" size={20} color="#FFFFFF" />
                      </View>
                      <View style={styles.klingCardBottom}>
                        <Text style={styles.klingCardFlag}>{video.flag}</Text>
                        <Text style={styles.klingCardTopic} numberOfLines={2}>{video.topic}</Text>
                        <View style={styles.klingCardMeta}>
                          <View style={styles.klingCategoryTag}>
                            <Text style={styles.klingCategoryText}>{video.category.replace("-", " ")}</Text>
                          </View>
                        </View>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Viral Creators Discovery */}
            <CreatorDiscoveryFeed />
            <Text style={{ color: Colors.textSecondary, fontSize: 12, fontWeight: "600", paddingHorizontal: 16, paddingTop: 12, paddingBottom: 6, textTransform: "uppercase", letterSpacing: 1 }}>Content Grid</Text>
          </View>
        }
      />
    </SafeAreaView>
    </ScreenErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary,
  },

  // Search
  searchContainer: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.sm,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surfaceCard,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  searchBarFocused: {
    borderColor: Colors.secondary,
    backgroundColor: Colors.surfaceElevated,
    shadowColor: Colors.glow,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: FontSize.md,
    color: Colors.textPrimary,
  },

  // Sub-tabs
  subTabContainer: {
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.border,
  },
  subTabList: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: 8,
  },
  subTab: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surfaceCard,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    gap: 5,
  },
  subTabActive: {
    backgroundColor: Colors.glowSubtle,
    borderColor: Colors.secondary,
    shadowColor: Colors.glow,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 6,
  },
  subTabText: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.textSecondary,
  },
  subTabTextActive: {
    color: Colors.textPrimary,
    fontWeight: "700",
  },
  liveIndicator: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: "#FF2D2D",
  },

  // Trending
  trendingSection: {
    paddingVertical: 10,
  },
  trendingSectionTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: Colors.textPrimary,
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  trendingCard: {
    width: 140,
    backgroundColor: Colors.surfaceCard,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  trendingEmoji: {
    fontSize: 22,
    marginBottom: 6,
  },
  trendingTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: Colors.textPrimary,
    marginBottom: 4,
    lineHeight: 16,
  },
  trendingSource: {
    fontSize: 9,
    color: Colors.textMuted,
    fontWeight: "500",
  },
  // Category chips
  categoryChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: Colors.surfaceCard,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  categoryChipText: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.textSecondary,
  },

  // Usage bar
  usageBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    backgroundColor: "rgba(0, 170, 255, 0.05)",
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.border,
  },
  usageLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  usageText: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: "500",
  },
  upgradeChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(255, 184, 0, 0.12)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: "rgba(255, 184, 0, 0.30)",
  },
  upgradeText: {
    fontSize: 10,
    fontWeight: "700",
    color: Colors.gold,
  },

  // Grid
  gridContent: {
    paddingBottom: 100,
  },
  gridRow: {
    gap: GRID_GAP,
  },
  tile: {
    position: "relative",
    overflow: "hidden",
  },
  tileOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "space-between",
    padding: 6,
  },
  tileBadgeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  flagBadge: {
    backgroundColor: "rgba(0, 0, 0, 0.55)",
    borderRadius: 4,
    paddingHorizontal: 3,
    paddingVertical: 1,
  },
  flagText: {
    fontSize: 11,
  },
  liveBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 45, 45, 0.85)",
    borderRadius: 3,
    paddingHorizontal: 5,
    paddingVertical: 2,
    gap: 3,
  },
  liveDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#FFFFFF",
  },
  liveText: {
    fontSize: 8,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: 0.5,
  },
  proBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.70)",
    borderRadius: 3,
    paddingHorizontal: 5,
    paddingVertical: 2,
    gap: 2,
    borderWidth: 0.5,
    borderColor: "rgba(255, 184, 0, 0.50)",
  },
  proText: {
    fontSize: 8,
    fontWeight: "800",
    color: Colors.gold,
    letterSpacing: 0.3,
  },
  tileBottom: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  playIcon: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "rgba(255, 255, 255, 0.25)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.50)",
  },
  tileViews: {
    fontSize: 9,
    fontWeight: "600",
    color: "rgba(255, 255, 255, 0.85)",
    textShadowColor: "rgba(0, 0, 0, 0.8)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  translatedBadge: {
    position: "absolute",
    bottom: 6,
    right: 6,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "rgba(0, 0, 0, 0.65)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 0.5,
    borderColor: "rgba(0, 170, 255, 0.50)",
  },
  tileSaveBtn: {
    position: "absolute",
    top: 6,
    right: 6,
    zIndex: 10,
  },
  doorwayRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    marginBottom: 12,
    gap: 10,
  },
  doorwayCard: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 12,
    backgroundColor: Colors.surfaceCard,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  doorwayIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
    borderWidth: 1,
  },
  doorwayLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: Colors.textSecondary,
  },
  // Song Cover Feed
  songCoverSection: {
    marginBottom: 16,
  },
  songCoverHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  songCoverTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  songCoverSeeAll: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.secondary,
  },
  songCoverCard: {
    width: 130,
    borderRadius: 12,
    padding: 12,
    justifyContent: "flex-end",
    minHeight: 150,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  songCoverPlay: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(0, 170, 255, 0.8)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
    alignSelf: "flex-start",
  },
  songCoverSong: {
    fontSize: 13,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 2,
  },
  songCoverArtist: {
    fontSize: 11,
    color: "rgba(255,255,255,0.7)",
    marginBottom: 6,
  },
  songCoverMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 4,
  },
  songCoverFlag: {
    fontSize: 11,
  },
  songCoverLang: {
    fontSize: 9,
    color: "rgba(255,255,255,0.6)",
    fontWeight: "600",
  },
  songCoverPlays: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  songCoverPlaysText: {
    fontSize: 9,
    color: "#9BA1A6",
    fontWeight: "500",
  },

  // Kling AI Video Section
  klingSection: {
    paddingVertical: 12,
  },
  klingHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  klingTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  klingBadge: {
    backgroundColor: "rgba(249, 115, 22, 0.12)",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  klingBadgeText: {
    fontSize: 9,
    color: "#F97316",
    fontWeight: "600",
  },
  klingCard: {
    width: 160,
    height: 220,
    borderRadius: 14,
    overflow: "hidden",
  },
  klingCardOverlay: {
    flex: 1,
    justifyContent: "space-between",
    padding: 12,
  },
  klingPlayBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(249, 115, 22, 0.8)",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    marginTop: 40,
  },
  klingCardBottom: {
    gap: 4,
  },
  klingCardFlag: {
    fontSize: 18,
  },
  klingCardTopic: {
    fontSize: 12,
    fontWeight: "600",
    color: "#FFFFFF",
    lineHeight: 16,
  },
  klingCardMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  klingCategoryTag: {
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  klingCategoryText: {
    fontSize: 9,
    color: "rgba(255,255,255,0.8)",
    fontWeight: "500",
    textTransform: "capitalize",
  },
});
