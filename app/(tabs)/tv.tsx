import React, { useState, useCallback, useEffect, useRef } from "react";
import { ScreenErrorBoundary } from "@/components/error-boundary";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ScrollView,
  Dimensions,
  Modal,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import { Colors, Spacing, BorderRadius, FontSize } from "../../constants/Colors";
import { useContentShare } from "@/hooks/use-content-share";
import { ContentItem } from "@/lib/deep-links";
import { ExploreTabSkeleton, hapticLoadComplete } from "@/components/skeleton-loader";
import { WhatsHotCarousel } from "@/components/whats-hot-carousel";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// ─── TYPES ───────────────────────────────────────────────────────────────────
type TVCategory = "all" | "comedy" | "drama" | "cooking" | "nightlife" | "professional" | "adventure";
type SeriesStatus = "airing" | "upcoming" | "completed";

interface TVSeries {
  id: string;
  title: string;
  description: string;
  genre: string;
  flag: string;
  color: string;
  totalEpisodes: number;
  releasedEpisodes: number;
  releaseSchedule: string;
  releaseTime: string;
  difficulty: string;
  vocabPerEpisode: number;
  status: SeriesStatus;
  characters: { name: string; role: string; accent: string }[];
  tags: string[];
}

interface Episode {
  id: string;
  number: number;
  title: string;
  duration: string;
  description: string;
  vocabCount: number;
  isNew: boolean;
  isLocked: boolean;
  watchProgress: number; // 0-1
}

interface ScheduledDrop {
  time: string;
  label: string;
  series: string | null;
  type: string;
  isPast: boolean;
}

// ─── SERIES DATA ─────────────────────────────────────────────────────────────
const TV_SERIES_CATALOG: TVSeries[] = [
  {
    id: "granny-abroad",
    title: "Granny Abroad",
    description: "A fearless grandmother travels to different countries, getting into hilarious situations while teaching you real street language.",
    genre: "comedy",
    flag: "🌍",
    color: "#F59E0B",
    totalEpisodes: 52,
    releasedEpisodes: 3,
    releaseSchedule: "Daily",
    releaseTime: "7:00 AM",
    difficulty: "Mixed",
    vocabPerEpisode: 8,
    status: "airing",
    characters: [
      { name: "Abuela Rosa", role: "Protagonist", accent: "Dominican" },
      { name: "Local Guide", role: "Recurring", accent: "Varies" },
    ],
    tags: ["Street Language", "Comedy", "Travel"],
  },
  {
    id: "the-colmado",
    title: "The Colmado",
    description: "Daily life at a Dominican corner store. Drama, comedy, and real Dominican Spanish — the way people actually talk.",
    genre: "comedy",
    flag: "🇩🇴",
    color: "#EF4444",
    totalEpisodes: 100,
    releasedEpisodes: 5,
    releaseSchedule: "Weekdays",
    releaseTime: "12:00 PM",
    difficulty: "Intermediate",
    vocabPerEpisode: 12,
    status: "airing",
    characters: [
      { name: "Don Julio", role: "Store Owner", accent: "Cibaeño" },
      { name: "Yari", role: "Cashier/Student", accent: "Santo Domingo" },
      { name: "El Americano", role: "Expat Regular", accent: "Gringo" },
    ],
    tags: ["Dominican Slang", "Sitcom", "Daily Life"],
  },
  {
    id: "lost-in-translation",
    title: "Lost in Translation",
    description: "An American student moves abroad and has to figure everything out in a language they barely speak. Cringe, comedy, growth.",
    genre: "drama",
    flag: "🎭",
    color: "#8B5CF6",
    totalEpisodes: 30,
    releasedEpisodes: 2,
    releaseSchedule: "Daily",
    releaseTime: "7:00 PM",
    difficulty: "Beginner",
    vocabPerEpisode: 6,
    status: "airing",
    characters: [
      { name: "Jordan", role: "Protagonist", accent: "American" },
      { name: "Roommate", role: "Local Friend", accent: "Varies" },
    ],
    tags: ["Relatable", "Drama", "Study Abroad"],
  },
  {
    id: "kitchen-secrets",
    title: "Kitchen Secrets",
    description: "A chef reveals family recipes from around the world while teaching you cooking vocabulary and cultural food traditions.",
    genre: "cooking",
    flag: "👨‍🍳",
    color: "#22C55E",
    totalEpisodes: 40,
    releasedEpisodes: 4,
    releaseSchedule: "Daily",
    releaseTime: "5:00 PM",
    difficulty: "Intermediate",
    vocabPerEpisode: 10,
    status: "airing",
    characters: [
      { name: "Chef Marta", role: "Host", accent: "Mexican" },
      { name: "Guest Chef", role: "Rotating", accent: "Varies" },
    ],
    tags: ["Cooking", "Culture", "Food Vocab"],
  },
  {
    id: "night-out",
    title: "Night Out",
    description: "Friends going out in different cities worldwide. Bars, clubs, parties — all the slang you need for nightlife.",
    genre: "nightlife",
    flag: "🌃",
    color: "#EC4899",
    totalEpisodes: 24,
    releasedEpisodes: 1,
    releaseSchedule: "Weekly",
    releaseTime: "9:00 PM",
    difficulty: "Advanced",
    vocabPerEpisode: 15,
    status: "airing",
    characters: [
      { name: "The Crew", role: "Ensemble", accent: "Varies" },
    ],
    tags: ["Nightlife", "Slang", "Advanced"],
  },
  {
    id: "the-interview",
    title: "The Interview",
    description: "Job interviews in a foreign language. High stakes, professional vocabulary, cultural workplace norms.",
    genre: "professional",
    flag: "💼",
    color: "#06B6D4",
    totalEpisodes: 20,
    releasedEpisodes: 3,
    releaseSchedule: "Weekdays",
    releaseTime: "8:00 AM",
    difficulty: "Advanced",
    vocabPerEpisode: 12,
    status: "airing",
    characters: [
      { name: "Candidate", role: "Protagonist", accent: "American" },
      { name: "Interviewer", role: "Antagonist", accent: "Varies" },
    ],
    tags: ["Professional", "Business", "High Stakes"],
  },
];

// Sample episodes for series detail
const SERIES_EPISODES: Record<string, Episode[]> = {
  "granny-abroad": [
    { id: "ga-1", number: 1, title: "Abuela Lands in Tokyo", duration: "1:15", description: "Rosa arrives in Japan and immediately gets lost in Shibuya. Her Dominican confidence meets Japanese politeness.", vocabCount: 8, isNew: false, isLocked: false, watchProgress: 1 },
    { id: "ga-2", number: 2, title: "The Ramen Incident", duration: "1:22", description: "Rosa tries to order ramen but accidentally insults the chef. Cultural clash comedy at its finest.", vocabCount: 9, isNew: false, isLocked: false, watchProgress: 0.6 },
    { id: "ga-3", number: 3, title: "Karaoke Night", duration: "1:08", description: "Rosa discovers karaoke and becomes an instant legend. Bachata meets J-Pop.", vocabCount: 7, isNew: true, isLocked: false, watchProgress: 0 },
    { id: "ga-4", number: 4, title: "Lost in the Metro", duration: "1:30", description: "The Tokyo subway system vs. Dominican navigation skills. Who will win?", vocabCount: 10, isNew: false, isLocked: true, watchProgress: 0 },
  ],
  "the-colmado": [
    { id: "tc-1", number: 1, title: "Opening Day", duration: "1:20", description: "Don Julio opens the colmado. Meet the neighborhood characters.", vocabCount: 12, isNew: false, isLocked: false, watchProgress: 1 },
    { id: "tc-2", number: 2, title: "El Fiado", duration: "1:35", description: "Everyone wants credit. Don Julio's patience is tested.", vocabCount: 14, isNew: false, isLocked: false, watchProgress: 1 },
    { id: "tc-3", number: 3, title: "The Gringo Arrives", duration: "1:18", description: "El Americano walks in and tries to order in textbook Spanish. Hilarity ensues.", vocabCount: 11, isNew: false, isLocked: false, watchProgress: 0.3 },
    { id: "tc-4", number: 4, title: "Apagón", duration: "1:42", description: "Power outage! The colmado becomes the neighborhood meeting point.", vocabCount: 15, isNew: true, isLocked: false, watchProgress: 0 },
    { id: "tc-5", number: 5, title: "Yari's Exam", duration: "1:25", description: "Yari studies for her university exam while running the register.", vocabCount: 13, isNew: true, isLocked: false, watchProgress: 0 },
  ],
  "lost-in-translation": [
    { id: "lit-1", number: 1, title: "Day One", duration: "1:30", description: "Jordan arrives in Bogotá. Nothing goes as planned.", vocabCount: 6, isNew: false, isLocked: false, watchProgress: 1 },
    { id: "lit-2", number: 2, title: "The Roommate", duration: "1:22", description: "Meeting the Colombian roommate who speaks zero English.", vocabCount: 7, isNew: true, isLocked: false, watchProgress: 0 },
  ],
};

// Today's content schedule
function generateTodaySchedule(): ScheduledDrop[] {
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();

  const schedule: ScheduledDrop[] = [
    { time: "7:00 AM", label: "Morning Episode", series: "Granny Abroad", type: "ai_short_film", isPast: currentHour > 7 || (currentHour === 7 && currentMinute > 0) },
    { time: "7:05 AM", label: "Slang of the Day", series: null, type: "slang", isPast: currentHour > 7 || (currentHour === 7 && currentMinute > 5) },
    { time: "8:00 AM", label: "Professional Series", series: "The Interview", type: "ai_short_film", isPast: currentHour > 8 || (currentHour === 8 && currentMinute > 0) },
    { time: "12:00 PM", label: "Lunch Break Episode", series: "The Colmado", type: "ai_short_film", isPast: currentHour > 12 || (currentHour === 12 && currentMinute > 0) },
    { time: "1:00 PM", label: "Surprise Agent Call", series: null, type: "surprise_call", isPast: currentHour > 13 || (currentHour === 13 && currentMinute > 0) },
    { time: "3:00 PM", label: "Music Feature", series: null, type: "music", isPast: currentHour > 15 || (currentHour === 15 && currentMinute > 0) },
    { time: "5:00 PM", label: "Cooking Episode", series: "Kitchen Secrets", type: "ai_short_film", isPast: currentHour > 17 || (currentHour === 17 && currentMinute > 0) },
    { time: "7:00 PM", label: "Evening Series", series: "Lost in Translation", type: "ai_short_film", isPast: currentHour > 19 || (currentHour === 19 && currentMinute > 0) },
    { time: "9:00 PM", label: "Cultural Deep Dive", series: null, type: "cultural", isPast: currentHour > 21 || (currentHour === 21 && currentMinute > 0) },
    { time: "10:00 PM", label: "Daily Recap", series: null, type: "recap", isPast: currentHour > 22 || (currentHour === 22 && currentMinute > 0) },
  ];

  return schedule;
}

// ─── CATEGORIES ──────────────────────────────────────────────────────────────
const CATEGORIES: { id: TVCategory; label: string; icon: string }[] = [
  { id: "all", label: "All", icon: "tv" },
  { id: "comedy", label: "Comedy", icon: "happy" },
  { id: "drama", label: "Drama", icon: "film" },
  { id: "cooking", label: "Cooking", icon: "restaurant" },
  { id: "nightlife", label: "Nightlife", icon: "moon" },
  { id: "professional", label: "Business", icon: "briefcase" },
  { id: "adventure", label: "Adventure", icon: "compass" },
];

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────
export default function TVScreen() {
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    const timer = setTimeout(() => { setIsLoading(false); hapticLoadComplete(); }, 550);
    return () => clearTimeout(timer);
  }, []);
  const [activeCategory, setActiveCategory] = useState<TVCategory>("all");
  const [selectedSeries, setSelectedSeries] = useState<TVSeries | null>(null);
  const [showSchedule, setShowSchedule] = useState(false);
  const [countdown, setCountdown] = useState("");
  const [nextDrop, setNextDrop] = useState<ScheduledDrop | null>(null);
  const { openShareSheet, ShareSheet } = useContentShare();

  // Countdown timer
  useEffect(() => {
    const schedule = generateTodaySchedule();
    const upcoming = schedule.find((s) => !s.isPast);
    setNextDrop(upcoming || null);

    const interval = setInterval(() => {
      if (!upcoming) {
        setCountdown("Tomorrow 7:00 AM");
        return;
      }
      const now = new Date();
      const [timePart, period] = upcoming.time.split(" ");
      const [hours, minutes] = timePart.split(":").map(Number);
      let targetHour = hours;
      if (period === "PM" && hours !== 12) targetHour += 12;
      if (period === "AM" && hours === 12) targetHour = 0;

      const target = new Date();
      target.setHours(targetHour, minutes, 0, 0);
      const diff = target.getTime() - now.getTime();

      if (diff <= 0) {
        setCountdown("Now!");
      } else {
        const h = Math.floor(diff / 3600000);
        const m = Math.floor((diff % 3600000) / 60000);
        const s = Math.floor((diff % 60000) / 1000);
        if (h > 0) {
          setCountdown(`${h}h ${m}m`);
        } else if (m > 0) {
          setCountdown(`${m}m ${s}s`);
        } else {
          setCountdown(`${s}s`);
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const filteredSeries = activeCategory === "all"
    ? TV_SERIES_CATALOG
    : TV_SERIES_CATALOG.filter((s) => s.genre === activeCategory);

  const handleSeriesPress = (series: TVSeries) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setSelectedSeries(series);
  };

  const handleSeriesShare = (series: TVSeries) => {
    const content: ContentItem = {
      id: series.id,
      type: "video",
      title: series.title,
      description: series.description,
      authorName: "ConnectWorld AI TV",
      language: "Multi",
    };
    openShareSheet(content);
  };

  const handleEpisodePress = (episode: Episode) => {
    if (episode.isLocked) {
      router.push("/subscription" as any);
      return;
    }
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    // Navigate to full-screen TV player with episode context
    router.push({
      pathname: "/tv-player",
      params: {
        seriesId: selectedSeries?.id,
        episodeId: episode.id,
        seriesTitle: selectedSeries?.title,
        episodeTitle: episode.title,
      },
    } as any);
  };

  // ─── RENDER: SERIES CARD ────────────────────────────────────────────────────
  const renderSeriesCard = ({ item }: { item: TVSeries }) => (
    <TouchableOpacity
      style={[styles.seriesCard, { borderColor: `${item.color}40` }]}
      activeOpacity={0.85}
      onPress={() => handleSeriesPress(item)}
    >
      {/* Thumbnail area */}
      <View style={[styles.seriesThumbnail, { backgroundColor: `${item.color}15` }]}>
        <Text style={styles.seriesEmoji}>{item.flag}</Text>
        {item.status === "airing" && (
          <View style={styles.airingBadge}>
            <View style={styles.airingDot} />
            <Text style={styles.airingText}>AIRING</Text>
          </View>
        )}
        <View style={[styles.difficultyBadge, { backgroundColor: `${item.color}30`, borderColor: `${item.color}60` }]}>
          <Text style={[styles.difficultyText, { color: item.color }]}>{item.difficulty}</Text>
        </View>
      </View>

      {/* Info */}
      <View style={styles.seriesInfo}>
        <Text style={styles.seriesTitle} numberOfLines={1}>{item.title}</Text>
        <Text style={styles.seriesDesc} numberOfLines={2}>{item.description}</Text>
        <View style={styles.seriesMeta}>
          <View style={styles.metaItem}>
            <Ionicons name="film-outline" size={12} color={Colors.textSecondary} />
            <Text style={styles.metaText}>{item.releasedEpisodes}/{item.totalEpisodes} eps</Text>
          </View>
          <View style={styles.metaItem}>
            <Ionicons name="time-outline" size={12} color={Colors.textSecondary} />
            <Text style={styles.metaText}>{item.releaseSchedule} @ {item.releaseTime}</Text>
          </View>
        </View>
        {/* Tags */}
        <View style={styles.tagRow}>
          {item.tags.slice(0, 3).map((tag) => (
            <View key={tag} style={styles.tag}>
              <Text style={styles.tagText}>{tag}</Text>
            </View>
          ))}
        </View>
      </View>
    </TouchableOpacity>
  );

  // ─── RENDER: EPISODE ROW ────────────────────────────────────────────────────
  const renderEpisode = ({ item }: { item: Episode }) => (
    <TouchableOpacity
      style={[styles.episodeRow, item.isNew && styles.episodeNew]}
      activeOpacity={0.8}
      onPress={() => handleEpisodePress(item)}
    >
      {/* Episode number */}
      <View style={[styles.episodeNumber, { backgroundColor: item.watchProgress === 1 ? `${Colors.success}20` : Colors.surfaceCard }]}>
        {item.watchProgress === 1 ? (
          <Ionicons name="checkmark" size={16} color={Colors.success} />
        ) : item.isLocked ? (
          <Ionicons name="lock-closed" size={14} color={Colors.textMuted} />
        ) : (
          <Text style={styles.episodeNumText}>{item.number}</Text>
        )}
      </View>

      {/* Episode info */}
      <View style={styles.episodeInfo}>
        <View style={styles.episodeTitleRow}>
          <Text style={styles.episodeTitle} numberOfLines={1}>{item.title}</Text>
          {item.isNew && (
            <View style={styles.newBadge}>
              <Text style={styles.newBadgeText}>NEW</Text>
            </View>
          )}
        </View>
        <Text style={styles.episodeDesc} numberOfLines={1}>{item.description}</Text>
        <View style={styles.episodeMetaRow}>
          <Text style={styles.episodeDuration}>{item.duration}</Text>
          <Text style={styles.episodeVocab}>{item.vocabCount} words</Text>
        </View>
        {/* Progress bar */}
        {item.watchProgress > 0 && item.watchProgress < 1 && (
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${item.watchProgress * 100}%` }]} />
          </View>
        )}
      </View>

      {/* Play button */}
      <TouchableOpacity style={styles.playBtn} onPress={() => handleEpisodePress(item)}>
        <Ionicons name={item.isLocked ? "lock-closed" : "play"} size={18} color={item.isLocked ? Colors.textMuted : Colors.secondary} />
      </TouchableOpacity>
    </TouchableOpacity>
  );

    if (isLoading) {
    return (
      <ScreenErrorBoundary>
      <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
        <ExploreTabSkeleton />
      </SafeAreaView>
      </ScreenErrorBoundary>
    );
  }
  return (
    <ScreenErrorBoundary>
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="tv" size={22} color={Colors.secondary} />
          <Text style={styles.headerTitle}>ConnectWorld AI TV</Text>
        </View>
        <TouchableOpacity
          style={styles.scheduleBtn}
          onPress={() => { setShowSchedule(true); if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
        >
          <Ionicons name="calendar-outline" size={18} color={Colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Next Drop Countdown Banner */}
      {nextDrop && (
        <TouchableOpacity
          style={styles.countdownBanner}
          activeOpacity={0.85}
          onPress={() => setShowSchedule(true)}
        >
          <View style={styles.countdownLeft}>
            <View style={styles.countdownDot} />
            <Text style={styles.countdownLabel}>Next Drop:</Text>
            <Text style={styles.countdownSeries}>{nextDrop.series || nextDrop.label}</Text>
          </View>
          <View style={styles.countdownRight}>
            <Text style={styles.countdownTime}>{countdown}</Text>
            <Ionicons name="chevron-forward" size={14} color={Colors.textSecondary} />
          </View>
        </TouchableOpacity>
      )}

      {/* What's Hot Trending Music */}
      <WhatsHotCarousel language="Spanish" />

      {/* Category Chips */}
      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={CATEGORIES}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.categoryList}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.categoryChip, activeCategory === item.id && styles.categoryChipActive]}
            onPress={() => setActiveCategory(item.id)}
          >
            <Ionicons
              name={item.icon as any}
              size={14}
              color={activeCategory === item.id ? Colors.textPrimary : Colors.textSecondary}
            />
            <Text style={[styles.categoryText, activeCategory === item.id && styles.categoryTextActive]}>
              {item.label}
            </Text>
          </TouchableOpacity>
        )}
      />

      {/* Series List */}
      <FlatList
        data={filteredSeries}
        keyExtractor={(item) => item.id}
        renderItem={renderSeriesCard}
        contentContainerStyle={styles.seriesList}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              {activeCategory === "all" ? "All Series" : CATEGORIES.find(c => c.id === activeCategory)?.label}
            </Text>
            <Text style={styles.sectionCount}>{filteredSeries.length} series</Text>
          </View>
        }
      />

      {/* Series Detail Modal */}
      <Modal
        visible={!!selectedSeries}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setSelectedSeries(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View style={styles.modalHandle} />
              <TouchableOpacity style={styles.modalClose} onPress={() => setSelectedSeries(null)}>
                <Ionicons name="close" size={22} color={Colors.textPrimary} />
              </TouchableOpacity>
            </View>

            {selectedSeries && (
              <ScrollView showsVerticalScrollIndicator={false}>
                {/* Series Hero */}
                <View style={[styles.seriesHero, { backgroundColor: `${selectedSeries.color}10` }]}>
                  <Text style={styles.heroEmoji}>{selectedSeries.flag}</Text>
                  <Text style={styles.heroTitle}>{selectedSeries.title}</Text>
                  <Text style={styles.heroDesc}>{selectedSeries.description}</Text>
                  <View style={styles.heroStats}>
                    <View style={styles.heroStat}>
                      <Text style={styles.heroStatValue}>{selectedSeries.releasedEpisodes}</Text>
                      <Text style={styles.heroStatLabel}>Episodes</Text>
                    </View>
                    <View style={styles.heroStatDivider} />
                    <View style={styles.heroStat}>
                      <Text style={styles.heroStatValue}>{selectedSeries.vocabPerEpisode}</Text>
                      <Text style={styles.heroStatLabel}>Words/Ep</Text>
                    </View>
                    <View style={styles.heroStatDivider} />
                    <View style={styles.heroStat}>
                      <Text style={styles.heroStatValue}>{selectedSeries.releaseSchedule}</Text>
                      <Text style={styles.heroStatLabel}>Schedule</Text>
                    </View>
                  </View>
                </View>

                {/* Characters */}
                <View style={styles.charactersSection}>
                  <Text style={styles.sectionLabel}>Characters</Text>
                  {selectedSeries.characters.map((char, i) => (
                    <View key={i} style={styles.characterRow}>
                      <View style={[styles.characterAvatar, { backgroundColor: `${selectedSeries.color}20` }]}>
                        <Text style={styles.characterInitial}>{char.name[0]}</Text>
                      </View>
                      <View style={styles.characterInfo}>
                        <Text style={styles.characterName}>{char.name}</Text>
                        <Text style={styles.characterRole}>{char.role} • {char.accent} accent</Text>
                      </View>
                    </View>
                  ))}
                </View>

                {/* Episodes */}
                <View style={styles.episodesSection}>
                  <Text style={styles.sectionLabel}>Episodes</Text>
                  {(SERIES_EPISODES[selectedSeries.id] || []).map((ep) => (
                    <View key={ep.id}>
                      {renderEpisode({ item: ep })}
                    </View>
                  ))}
                  {!SERIES_EPISODES[selectedSeries.id] && (
                    <View style={styles.comingSoon}>
                      <Ionicons name="hourglass-outline" size={32} color={Colors.textMuted} />
                      <Text style={styles.comingSoonText}>Episodes coming soon</Text>
                      <Text style={styles.comingSoonSub}>New episodes drop {selectedSeries.releaseSchedule.toLowerCase()} at {selectedSeries.releaseTime}</Text>
                    </View>
                  )}
                </View>

                <View style={{ height: 40 }} />
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* Share Sheet */}
      {ShareSheet}

      {/* Schedule Modal */}
      <Modal
        visible={showSchedule}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowSchedule(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.scheduleModal}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHandle} />
              <TouchableOpacity style={styles.modalClose} onPress={() => setShowSchedule(false)}>
                <Ionicons name="close" size={22} color={Colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <Text style={styles.scheduleTitle}>Today's Content Schedule</Text>
            <Text style={styles.scheduleSubtitle}>New content drops throughout the day</Text>

            <ScrollView showsVerticalScrollIndicator={false} style={styles.scheduleList}>
              {generateTodaySchedule().map((drop, i) => (
                <View key={i} style={[styles.scheduleRow, drop.isPast && styles.scheduleRowPast]}>
                  <View style={styles.scheduleTimeCol}>
                    <Text style={[styles.scheduleTime, drop.isPast && styles.scheduleTimePast]}>{drop.time}</Text>
                  </View>
                  <View style={[styles.scheduleDot, drop.isPast ? styles.scheduleDotPast : styles.scheduleDotFuture]} />
                  <View style={styles.scheduleLine} />
                  <View style={styles.scheduleContent}>
                    <Text style={[styles.scheduleLabel, drop.isPast && styles.scheduleLabelPast]}>{drop.label}</Text>
                    {drop.series && (
                      <Text style={styles.scheduleSeries}>{drop.series}</Text>
                    )}
                    {drop.isPast && (
                      <View style={styles.watchedBadge}>
                        <Ionicons name="checkmark-circle" size={12} color={Colors.success} />
                        <Text style={styles.watchedText}>Available</Text>
                      </View>
                    )}
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
            </Modal>
    </SafeAreaView>
    </ScreenErrorBoundary>
  );
}
// ─── STYLES ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.primary },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
  headerTitle: { fontSize: FontSize.xl, fontWeight: "800", color: Colors.textPrimary, letterSpacing: -0.5 },
  scheduleBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.surfaceCard, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: Colors.border },

  // Countdown banner
  countdownBanner: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginHorizontal: Spacing.lg, marginBottom: Spacing.md, paddingHorizontal: Spacing.md, paddingVertical: 10, borderRadius: BorderRadius.md, backgroundColor: "rgba(0, 170, 255, 0.08)", borderWidth: 1, borderColor: "rgba(0, 170, 255, 0.25)" },
  countdownLeft: { flexDirection: "row", alignItems: "center", gap: 6, flex: 1 },
  countdownDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.success, shadowColor: Colors.success, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 1, shadowRadius: 4 },
  countdownLabel: { fontSize: FontSize.xs, color: Colors.textSecondary },
  countdownSeries: { fontSize: FontSize.sm, fontWeight: "700", color: Colors.textPrimary, flex: 1 },
  countdownRight: { flexDirection: "row", alignItems: "center", gap: 4 },
  countdownTime: { fontSize: FontSize.sm, fontWeight: "800", color: Colors.secondary },

  // Categories
  categoryList: { paddingHorizontal: Spacing.lg, gap: 8, marginBottom: Spacing.md },
  categoryChip: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 12, paddingVertical: 7, borderRadius: BorderRadius.full, backgroundColor: Colors.surfaceCard, borderWidth: 1, borderColor: Colors.border },
  categoryChipActive: { backgroundColor: "rgba(0, 170, 255, 0.15)", borderColor: Colors.glowBorder },
  categoryText: { fontSize: FontSize.xs, color: Colors.textSecondary, fontWeight: "600" },
  categoryTextActive: { color: Colors.textPrimary },

  // Section
  sectionHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: Spacing.lg, marginBottom: Spacing.md },
  sectionTitle: { fontSize: FontSize.lg, fontWeight: "700", color: Colors.textPrimary },
  sectionCount: { fontSize: FontSize.xs, color: Colors.textMuted },

  // Series List
  seriesList: { paddingHorizontal: Spacing.lg, paddingBottom: 100 },
  seriesCard: { flexDirection: "row", backgroundColor: Colors.surfaceCard, borderRadius: BorderRadius.lg, marginBottom: Spacing.md, overflow: "hidden", borderWidth: 1, borderColor: Colors.border },
  seriesThumbnail: { width: 100, alignItems: "center", justifyContent: "center", position: "relative" },
  seriesEmoji: { fontSize: 36 },
  airingBadge: { position: "absolute", top: 6, left: 6, flexDirection: "row", alignItems: "center", gap: 3, backgroundColor: "rgba(0, 255, 136, 0.15)", paddingHorizontal: 5, paddingVertical: 2, borderRadius: 4 },
  airingDot: { width: 5, height: 5, borderRadius: 2.5, backgroundColor: Colors.success },
  airingText: { fontSize: 8, fontWeight: "800", color: Colors.success, letterSpacing: 0.5 },
  difficultyBadge: { position: "absolute", bottom: 6, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, borderWidth: 1 },
  difficultyText: { fontSize: 9, fontWeight: "700" },
  seriesInfo: { flex: 1, padding: Spacing.md, gap: 4 },
  seriesTitle: { fontSize: FontSize.md, fontWeight: "700", color: Colors.textPrimary },
  seriesDesc: { fontSize: FontSize.xs, color: Colors.textSecondary, lineHeight: 16 },
  seriesMeta: { flexDirection: "row", gap: 12, marginTop: 4 },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 3 },
  metaText: { fontSize: 10, color: Colors.textMuted },
  tagRow: { flexDirection: "row", gap: 4, marginTop: 4 },
  tag: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, backgroundColor: "rgba(0, 170, 255, 0.08)" },
  tagText: { fontSize: 9, color: Colors.textSecondary, fontWeight: "600" },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: "rgba(0, 0, 0, 0.7)", justifyContent: "flex-end" },
  modalContent: { backgroundColor: Colors.primary, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: "90%", paddingBottom: 20 },
  modalHeader: { alignItems: "center", paddingTop: 12, paddingBottom: 8, position: "relative" },
  modalHandle: { width: 36, height: 4, borderRadius: 2, backgroundColor: Colors.textMuted },
  modalClose: { position: "absolute", right: 16, top: 10, width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.surfaceCard, alignItems: "center", justifyContent: "center" },

  // Series Hero
  seriesHero: { alignItems: "center", paddingVertical: Spacing.xl, paddingHorizontal: Spacing.lg, marginHorizontal: Spacing.lg, borderRadius: BorderRadius.lg, marginBottom: Spacing.lg },
  heroEmoji: { fontSize: 48, marginBottom: 8 },
  heroTitle: { fontSize: FontSize.xl, fontWeight: "800", color: Colors.textPrimary, textAlign: "center" },
  heroDesc: { fontSize: FontSize.sm, color: Colors.textSecondary, textAlign: "center", marginTop: 6, lineHeight: 20 },
  heroStats: { flexDirection: "row", alignItems: "center", marginTop: Spacing.lg, gap: 16 },
  heroStat: { alignItems: "center" },
  heroStatValue: { fontSize: FontSize.lg, fontWeight: "800", color: Colors.secondary },
  heroStatLabel: { fontSize: 10, color: Colors.textMuted, marginTop: 2 },
  heroStatDivider: { width: 1, height: 24, backgroundColor: Colors.border },

  // Characters
  charactersSection: { paddingHorizontal: Spacing.lg, marginBottom: Spacing.lg },
  sectionLabel: { fontSize: FontSize.md, fontWeight: "700", color: Colors.textPrimary, marginBottom: Spacing.md },
  characterRow: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: Spacing.sm },
  characterAvatar: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  characterInitial: { fontSize: FontSize.md, fontWeight: "700", color: Colors.textPrimary },
  characterInfo: { flex: 1 },
  characterName: { fontSize: FontSize.sm, fontWeight: "600", color: Colors.textPrimary },
  characterRole: { fontSize: FontSize.xs, color: Colors.textSecondary },

  // Episodes
  episodesSection: { paddingHorizontal: Spacing.lg },
  episodeRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.border },
  episodeNew: { backgroundColor: "rgba(0, 170, 255, 0.04)" },
  episodeNumber: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: Colors.border },
  episodeNumText: { fontSize: FontSize.sm, fontWeight: "700", color: Colors.textSecondary },
  episodeInfo: { flex: 1, gap: 2 },
  episodeTitleRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  episodeTitle: { fontSize: FontSize.sm, fontWeight: "600", color: Colors.textPrimary, flex: 1 },
  newBadge: { paddingHorizontal: 5, paddingVertical: 1, borderRadius: 3, backgroundColor: "rgba(0, 170, 255, 0.15)" },
  newBadgeText: { fontSize: 8, fontWeight: "800", color: Colors.secondary, letterSpacing: 0.5 },
  episodeDesc: { fontSize: FontSize.xs, color: Colors.textMuted },
  episodeMetaRow: { flexDirection: "row", gap: 10, marginTop: 2 },
  episodeDuration: { fontSize: 10, color: Colors.textSecondary },
  episodeVocab: { fontSize: 10, color: Colors.textSecondary },
  progressBar: { height: 2, backgroundColor: Colors.surfaceCard, borderRadius: 1, marginTop: 4 },
  progressFill: { height: 2, backgroundColor: Colors.secondary, borderRadius: 1 },
  playBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.surfaceCard, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: Colors.border },

  // Coming soon
  comingSoon: { alignItems: "center", paddingVertical: Spacing.xl, gap: 8 },
  comingSoonText: { fontSize: FontSize.md, fontWeight: "600", color: Colors.textSecondary },
  comingSoonSub: { fontSize: FontSize.xs, color: Colors.textMuted },

  // Schedule Modal
  scheduleModal: { backgroundColor: Colors.primary, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: "80%", paddingBottom: 20 },
  scheduleTitle: { fontSize: FontSize.xl, fontWeight: "800", color: Colors.textPrimary, paddingHorizontal: Spacing.lg, marginTop: Spacing.sm },
  scheduleSubtitle: { fontSize: FontSize.sm, color: Colors.textSecondary, paddingHorizontal: Spacing.lg, marginBottom: Spacing.lg },
  scheduleList: { paddingHorizontal: Spacing.lg },
  scheduleRow: { flexDirection: "row", alignItems: "flex-start", marginBottom: Spacing.lg, gap: 10 },
  scheduleRowPast: { opacity: 0.5 },
  scheduleTimeCol: { width: 65 },
  scheduleTime: { fontSize: FontSize.xs, fontWeight: "700", color: Colors.textSecondary },
  scheduleTimePast: { color: Colors.textMuted },
  scheduleDot: { width: 10, height: 10, borderRadius: 5, marginTop: 3 },
  scheduleDotPast: { backgroundColor: Colors.textMuted },
  scheduleDotFuture: { backgroundColor: Colors.secondary, shadowColor: Colors.secondary, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.8, shadowRadius: 4 },
  scheduleLine: { position: "absolute", left: 79, top: 14, width: 1, height: 40, backgroundColor: Colors.border },
  scheduleContent: { flex: 1 },
  scheduleLabel: { fontSize: FontSize.sm, fontWeight: "600", color: Colors.textPrimary },
  scheduleLabelPast: { color: Colors.textSecondary },
  scheduleSeries: { fontSize: FontSize.xs, color: Colors.textAccent, marginTop: 2 },
  watchedBadge: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 },
  watchedText: { fontSize: 10, color: Colors.success },
});
