import { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  FlatList,
  Modal,
  ActivityIndicator,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { trpc } from "@/lib/trpc";
import { useKlingVideo } from "@/hooks/use-kling-video";

const { width } = Dimensions.get("window");

// ═══════════════ TV SERIES DATA ═══════════════
const TV_SERIES = [
  {
    id: "spanish-street",
    name: "Spanish Street",
    language: "Spanish",
    dialect: "Mexican",
    episodes: 12,
    level: "beginner",
    description: "Navigate daily life in Mexico City — from ordering tacos to catching the metro.",
    thumbnail: "🇲🇽",
    color: "#EF4444",
    teacher: "María",
    totalDuration: "45 min",
    tags: ["Street Spanish", "Daily Life", "Food"],
  },
  {
    id: "dominican-vibes",
    name: "Dominican Vibes",
    language: "Spanish",
    dialect: "Dominican",
    episodes: 10,
    level: "intermediate",
    description: "Santo Domingo street life — learn real Dominican slang, sayings, and how locals actually talk.",
    thumbnail: "🇩🇴",
    color: "#F59E0B",
    teacher: "Rafael",
    totalDuration: "38 min",
    tags: ["Slang", "Sayings", "Caribbean"],
  },
  {
    id: "paris-life",
    name: "La Vie Parisienne",
    language: "French",
    dialect: "Parisian",
    episodes: 10,
    level: "intermediate",
    description: "Follow a student's semester abroad in Paris — romance, culture, and croissants.",
    thumbnail: "🇫🇷",
    color: "#3B82F6",
    teacher: "Jean-Pierre",
    totalDuration: "40 min",
    tags: ["Culture", "Romance", "Food"],
  },
  {
    id: "tokyo-nights",
    name: "Tokyo Nights",
    language: "Japanese",
    dialect: "Standard",
    episodes: 8,
    level: "beginner",
    description: "A foreigner's first month in Tokyo — from convenience stores to karaoke.",
    thumbnail: "🇯🇵",
    color: "#EC4899",
    teacher: "Yuki",
    totalDuration: "32 min",
    tags: ["Anime", "Daily Life", "Polite Forms"],
  },
  {
    id: "cairo-stories",
    name: "Cairo Stories",
    language: "Arabic",
    dialect: "Egyptian",
    episodes: 10,
    level: "beginner",
    description: "Explore Egyptian culture through the eyes of a traveler in Cairo.",
    thumbnail: "🇪🇬",
    color: "#8B5CF6",
    teacher: "Ahmed",
    totalDuration: "42 min",
    tags: ["Culture", "Travel", "Street Arabic"],
  },
  {
    id: "rio-rhythms",
    name: "Rio Rhythms",
    language: "Portuguese",
    dialect: "Brazilian",
    episodes: 8,
    level: "intermediate",
    description: "Music, beaches, and Brazilian Portuguese — learn through the rhythm of Rio.",
    thumbnail: "🇧🇷",
    color: "#10B981",
    teacher: "Isabela",
    totalDuration: "35 min",
    tags: ["Music", "Slang", "Beach Life"],
  },
  {
    id: "seoul-hustle",
    name: "Seoul Hustle",
    language: "Korean",
    dialect: "Standard",
    episodes: 10,
    level: "beginner",
    description: "K-culture immersion — from K-pop to Korean BBQ, learn the language of Seoul.",
    thumbnail: "🇰🇷",
    color: "#6366F1",
    teacher: "Jimin",
    totalDuration: "40 min",
    tags: ["K-Pop", "K-Drama", "Food"],
  },
  {
    id: "mumbai-mix",
    name: "Mumbai Mix",
    language: "Hindi",
    dialect: "Standard",
    episodes: 10,
    level: "beginner",
    description: "Bollywood, street food, and Hindi — experience Mumbai's vibrant energy.",
    thumbnail: "🇮🇳",
    color: "#F97316",
    teacher: "Priya",
    totalDuration: "42 min",
    tags: ["Bollywood", "Street Food", "Hinglish"],
  },
];

// Sample episodes for expanded series view
const SAMPLE_EPISODES: Record<string, Array<{
  id: string;
  number: number;
  title: string;
  duration: string;
  description: string;
  vocabCount: number;
  hasQuiz: boolean;
  watched: boolean;
}>> = {
  "dominican-vibes": [
    { id: "dv-1", number: 1, title: "Llegando al Barrio", duration: "3:45", description: "Arriving in the neighborhood — first impressions, greetings, and \"¿Qué lo que?\"", vocabCount: 15, hasQuiz: true, watched: false },
    { id: "dv-2", number: 2, title: "El Colmado", duration: "4:10", description: "At the corner store — ordering, haggling, and Dominican small talk", vocabCount: 18, hasQuiz: true, watched: false },
    { id: "dv-3", number: 3, title: "Motoconcho Ride", duration: "3:30", description: "Taking a motorcycle taxi — directions, prices, and street slang", vocabCount: 14, hasQuiz: true, watched: false },
    { id: "dv-4", number: 4, title: "La Playa", duration: "4:30", description: "Beach day with friends — Dominican expressions for fun, food, and flirting", vocabCount: 22, hasQuiz: true, watched: false },
    { id: "dv-5", number: 5, title: "Dembow & Chill", duration: "3:55", description: "Music, dancing, and nightlife vocabulary — understanding dembow lyrics", vocabCount: 20, hasQuiz: true, watched: false },
    { id: "dv-6", number: 6, title: "Familia Dominicana", duration: "5:00", description: "Family dinner — expressions of love, teasing, and Dominican humor", vocabCount: 25, hasQuiz: true, watched: false },
    { id: "dv-7", number: 7, title: "El Trabajo", duration: "4:20", description: "At work — professional Dominican Spanish vs. street talk", vocabCount: 19, hasQuiz: true, watched: false },
    { id: "dv-8", number: 8, title: "Dichos Dominicanos", duration: "4:45", description: "Classic Dominican sayings — what they mean and when to use them", vocabCount: 28, hasQuiz: true, watched: false },
    { id: "dv-9", number: 9, title: "El Juego de Pelota", duration: "3:50", description: "Baseball culture — sports slang and passionate commentary", vocabCount: 16, hasQuiz: true, watched: false },
    { id: "dv-10", number: 10, title: "Despedida", duration: "4:00", description: "Saying goodbye — farewell expressions and promises to return", vocabCount: 17, hasQuiz: true, watched: false },
  ],
  "spanish-street": [
    { id: "ss-1", number: 1, title: "Buenos Días, México", duration: "3:30", description: "Morning routine — greetings, breakfast, and getting around", vocabCount: 12, hasQuiz: true, watched: false },
    { id: "ss-2", number: 2, title: "En el Metro", duration: "4:00", description: "Navigating the subway — directions, tickets, and crowd phrases", vocabCount: 15, hasQuiz: true, watched: false },
    { id: "ss-3", number: 3, title: "Tacos al Pastor", duration: "3:45", description: "Ordering street food — food vocabulary and casual conversation", vocabCount: 18, hasQuiz: true, watched: false },
  ],
};

const CATEGORIES = ["All", "Spanish", "French", "Japanese", "Arabic", "Portuguese", "Korean", "Hindi"];

// ═══════════════ KLING VIDEO AREA COMPONENT ═══════════════
function KlingVideoArea({ episode, subtitleMode }: { episode: any; subtitleMode: "dual" | "target" | "none" }) {
  const { generateLessonVideo, currentVideo, status, error } = useKlingVideo();
  const isGenerating = status === "generating" || status === "polling";
  const [hasRequested, setHasRequested] = useState(false);

  useEffect(() => {
    if (episode && !hasRequested && !currentVideo) {
      // Auto-generate video for this episode using Kling AI
      const prompt = `A language learning scene: ${episode.description}. Teacher ${episode.teacher} speaking ${episode.language} in a realistic setting. Cinematic quality, natural conversation, educational tone.`;
      generateLessonVideo({
        prompt,
        duration: "5",
        mode: "std",
        aspectRatio: "16:9",
      });
      setHasRequested(true);
    }
  }, [episode]);

  if (isGenerating) {
    return (
      <View style={styles.videoPlaceholder}>
        <ActivityIndicator size="large" color="#6366F1" />
        <Text style={styles.videoTeacherName}>Generating AI Video...</Text>
        <Text style={styles.videoLanguage}>Kling AI is creating your lesson video</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.videoPlaceholder}>
        <Ionicons name="alert-circle" size={40} color="#EF4444" />
        <Text style={styles.videoTeacherName}>Video unavailable</Text>
        <Text style={styles.videoLanguage}>{error}</Text>
        {/* Fallback to static placeholder */}
        <View style={styles.teacherAvatar}>
          <Ionicons name="person-circle" size={60} color="#6366F1" />
        </View>
      </View>
    );
  }

  // Show placeholder with teacher info (video URL would be used with expo-video when ready)
  return (
    <View style={styles.videoPlaceholder}>
      {currentVideo?.videoUrl ? (
        <View style={{ width: "100%", alignItems: "center" }}>
          <View style={[styles.teacherAvatar, { marginBottom: 8 }]}>
            <Ionicons name="videocam" size={60} color="#10B981" />
          </View>
          <Text style={styles.videoTeacherName}>AI Video Ready</Text>
          <Text style={styles.videoLanguage}>Teacher {episode?.teacher} • {episode?.language}</Text>
        </View>
      ) : (
        <>
          <View style={styles.teacherAvatar}>
            <Ionicons name="person-circle" size={80} color="#6366F1" />
          </View>
          <Text style={styles.videoTeacherName}>Teacher {episode?.teacher}</Text>
          <Text style={styles.videoLanguage}>{episode?.language}</Text>
        </>
      )}

      {/* Subtitles */}
      <View style={styles.subtitleArea}>
        {subtitleMode !== "none" && (
          <>
            <Text style={styles.subtitleTarget}>
              "¿Qué lo que, mi hermano? Tá to' bien aquí."
            </Text>
            {subtitleMode === "dual" && (
              <Text style={styles.subtitleNative}>
                "What's up, bro? Everything's good here."
              </Text>
            )}
          </>
        )}
      </View>
    </View>
  );
}

export default function WatchLearnScreen() {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [expandedSeries, setExpandedSeries] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentEpisode, setCurrentEpisode] = useState<any>(null);
  const [subtitleMode, setSubtitleMode] = useState<"dual" | "target" | "none">("dual");

  const filteredSeries = selectedCategory === "All"
    ? TV_SERIES
    : TV_SERIES.filter(s => s.language === selectedCategory);

  const handlePlayEpisode = (episode: any, series: any) => {
    setCurrentEpisode({ ...episode, seriesName: series.name, language: series.language, teacher: series.teacher });
    setIsPlaying(true);
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  };

  const handleSeriesPress = (seriesId: string) => {
    setExpandedSeries(expandedSeries === seriesId ? null : seriesId);
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };


  // Load persisted data from AsyncStorage
  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem('@watch_learn_data');
        if (stored) {
          // Data available from sync/server
        }
      } catch {}
    })();
  }, []);
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* ═══ Header ═══ */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>ConnectWorld AI TV</Text>
            <Text style={styles.headerSubtitle}>Learn by watching real conversations</Text>
          </View>
          <TouchableOpacity style={styles.settingsBtn}>
            <Ionicons name="settings-outline" size={20} color="#8e8e93" />
          </TouchableOpacity>
        </View>

        {/* ═══ Hero / Featured Series ═══ */}
        <View style={styles.heroCard}>
          <View style={[styles.heroBanner, { backgroundColor: "#F59E0B" }]}>
            <Text style={styles.heroFlag}>🇩🇴</Text>
            <View style={styles.heroPlayBtn}>
              <Ionicons name="play" size={28} color="#FFFFFF" />
            </View>
            <View style={styles.heroBadge}>
              <Text style={styles.heroBadgeText}>FEATURED</Text>
            </View>
          </View>
          <View style={styles.heroInfo}>
            <Text style={styles.heroTitle}>Dominican Vibes</Text>
            <Text style={styles.heroMeta}>
              10 Episodes • Intermediate • Teacher Rafael
            </Text>
            <Text style={styles.heroDesc}>
              Santo Domingo street life — learn real Dominican slang, sayings, and how locals actually talk.
            </Text>
            <View style={styles.heroTags}>
              {["Slang", "Sayings", "Caribbean"].map(tag => (
                <View key={tag} style={styles.heroTag}>
                  <Text style={styles.heroTagText}>{tag}</Text>
                </View>
              ))}
            </View>
            <TouchableOpacity
              style={styles.heroWatchBtn}
              onPress={() => handleSeriesPress("dominican-vibes")}
              activeOpacity={0.8}
            >
              <Ionicons name="play-circle" size={18} color="#FFFFFF" />
              <Text style={styles.heroWatchBtnText}>Start Watching</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ═══ Category Filter ═══ */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryRow}
        >
          {CATEGORIES.map(cat => (
            <TouchableOpacity
              key={cat}
              style={[styles.categoryChip, selectedCategory === cat && styles.categoryChipActive]}
              onPress={() => setSelectedCategory(cat)}
            >
              <Text style={[styles.categoryText, selectedCategory === cat && styles.categoryTextActive]}>
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* ═══ Series Grid ═══ */}
        <View style={styles.seriesSection}>
          <Text style={styles.sectionTitle}>All Series</Text>
          <Text style={styles.sectionSubtitle}>{filteredSeries.length} series available</Text>

          {filteredSeries.map(series => (
            <View key={series.id}>
              {/* Series Card */}
              <TouchableOpacity
                style={[
                  styles.seriesCard,
                  expandedSeries === series.id && styles.seriesCardExpanded,
                ]}
                onPress={() => handleSeriesPress(series.id)}
                activeOpacity={0.8}
              >
                <View style={[styles.seriesThumbnail, { backgroundColor: `${series.color}20` }]}>
                  <Text style={styles.seriesFlag}>{series.thumbnail}</Text>
                </View>
                <View style={styles.seriesInfo}>
                  <Text style={styles.seriesName}>{series.name}</Text>
                  <Text style={styles.seriesMeta}>
                    {series.language} ({series.dialect}) • {series.episodes} eps • {series.totalDuration}
                  </Text>
                  <Text style={styles.seriesDesc} numberOfLines={2}>{series.description}</Text>
                  <View style={styles.seriesFooter}>
                    <View style={[styles.levelBadge, { backgroundColor: `${series.color}20` }]}>
                      <Text style={[styles.levelBadgeText, { color: series.color }]}>
                        {series.level.toUpperCase()}
                      </Text>
                    </View>
                    <Text style={styles.teacherLabel}>
                      <Ionicons name="person" size={11} color="#8e8e93" /> {series.teacher}
                    </Text>
                  </View>
                </View>
                <Ionicons
                  name={expandedSeries === series.id ? "chevron-up" : "chevron-down"}
                  size={18}
                  color="#8e8e93"
                />
              </TouchableOpacity>

              {/* Expanded Episode List */}
              {expandedSeries === series.id && (
                <View style={styles.episodeList}>
                  {(SAMPLE_EPISODES[series.id] || []).length > 0 ? (
                    (SAMPLE_EPISODES[series.id] || []).map((ep, idx) => (
                      <TouchableOpacity
                        key={ep.id}
                        style={styles.episodeRow}
                        onPress={() => handlePlayEpisode(ep, series)}
                        activeOpacity={0.7}
                      >
                        <View style={styles.episodeNumber}>
                          <Text style={styles.episodeNumText}>{ep.number}</Text>
                        </View>
                        <View style={styles.episodeContent}>
                          <Text style={styles.episodeTitle}>{ep.title}</Text>
                          <Text style={styles.episodeDesc} numberOfLines={1}>{ep.description}</Text>
                          <View style={styles.episodeMeta}>
                            <Text style={styles.episodeDuration}>
                              <Ionicons name="time-outline" size={11} color="#8e8e93" /> {ep.duration}
                            </Text>
                            <Text style={styles.episodeVocab}>
                              <Ionicons name="book-outline" size={11} color="#8e8e93" /> {ep.vocabCount} words
                            </Text>
                            {ep.hasQuiz && (
                              <Text style={styles.episodeQuizBadge}>Quiz</Text>
                            )}
                          </View>
                        </View>
                        <TouchableOpacity
                          style={styles.episodePlayBtn}
                          onPress={() => handlePlayEpisode(ep, series)}
                        >
                          <Ionicons name="play" size={16} color="#FFFFFF" />
                        </TouchableOpacity>
                      </TouchableOpacity>
                    ))
                  ) : (
                    <View style={styles.comingSoon}>
                      <Ionicons name="film-outline" size={24} color="#8e8e93" />
                      <Text style={styles.comingSoonText}>Episodes coming soon</Text>
                      <Text style={styles.comingSoonSub}>This series is being generated by our AI teachers</Text>
                    </View>
                  )}
                </View>
              )}
            </View>
          ))}
        </View>

        {/* ═══ Subtitle Preferences ═══ */}
        <View style={styles.prefsSection}>
          <Text style={styles.prefsSectionTitle}>Subtitle Mode</Text>
          <View style={styles.subtitleRow}>
            {([
              { key: "dual", label: "Dual Language", icon: "language" },
              { key: "target", label: "Target Only", icon: "text" },
              { key: "none", label: "No Subtitles", icon: "eye-off" },
            ] as const).map(opt => (
              <TouchableOpacity
                key={opt.key}
                style={[styles.subtitleChip, subtitleMode === opt.key && styles.subtitleChipActive]}
                onPress={() => setSubtitleMode(opt.key)}
              >
                <Ionicons
                  name={opt.icon as any}
                  size={14}
                  color={subtitleMode === opt.key ? "#FFFFFF" : "#8e8e93"}
                />
                <Text style={[styles.subtitleChipText, subtitleMode === opt.key && styles.subtitleChipTextActive]}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ═══ Stats ═══ */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>0</Text>
            <Text style={styles.statLabel}>Episodes Watched</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>0</Text>
            <Text style={styles.statLabel}>Words Learned</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>0</Text>
            <Text style={styles.statLabel}>Quizzes Passed</Text>
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* ═══════════════ VIDEO PLAYER MODAL ═══════════════ */}
      <Modal
        visible={isPlaying}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setIsPlaying(false)}
      >
        <SafeAreaView style={styles.playerContainer}>
          {/* Player Header */}
          <View style={styles.playerHeader}>
            <TouchableOpacity onPress={() => setIsPlaying(false)} style={styles.playerCloseBtn}>
              <Ionicons name="close" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <View style={styles.playerHeaderCenter}>
              <Text style={styles.playerSeriesName}>{currentEpisode?.seriesName}</Text>
              <Text style={styles.playerEpisodeTitle}>Ep {currentEpisode?.number}: {currentEpisode?.title}</Text>
            </View>
            <TouchableOpacity style={styles.playerSettingsBtn}>
              <Ionicons name="options-outline" size={20} color="#8e8e93" />
            </TouchableOpacity>
          </View>

          {/* Video Area — Kling AI generated video or placeholder */}
          <View style={styles.videoArea}>
            <KlingVideoArea
              episode={currentEpisode}
              subtitleMode={subtitleMode}
            />

            {/* Playback Controls */}
            <View style={styles.playbackControls}>
              <TouchableOpacity style={styles.controlBtn}>
                <Ionicons name="play-back" size={24} color="#FFFFFF" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.mainPlayBtn}>
                <Ionicons name="pause" size={32} color="#FFFFFF" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.controlBtn}>
                <Ionicons name="play-forward" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            {/* Progress Bar */}
            <View style={styles.progressBar}>
              <View style={styles.progressFill} />
            </View>
            <View style={styles.progressLabels}>
              <Text style={styles.progressTime}>1:23</Text>
              <Text style={styles.progressTime}>{currentEpisode?.duration}</Text>
            </View>
          </View>

          {/* Episode Info */}
          <ScrollView style={styles.playerInfo}>
            <Text style={styles.playerInfoTitle}>{currentEpisode?.title}</Text>
            <Text style={styles.playerInfoDesc}>{currentEpisode?.description}</Text>

            {/* Vocabulary Preview */}
            <View style={styles.vocabPreview}>
              <Text style={styles.vocabPreviewTitle}>
                <Ionicons name="book" size={14} color="#F59E0B" /> New Vocabulary ({currentEpisode?.vocabCount} words)
              </Text>
              <Text style={styles.vocabPreviewHint}>Complete the episode to unlock vocabulary cards</Text>
            </View>

            {/* Quiz CTA */}
            {currentEpisode?.hasQuiz && (
              <TouchableOpacity style={styles.quizCta}>
                <Ionicons name="help-circle" size={18} color="#6366F1" />
                <Text style={styles.quizCtaText}>Comprehension Quiz Available</Text>
                <Ionicons name="chevron-forward" size={16} color="#6366F1" />
              </TouchableOpacity>
            )}

            {/* Subtitle Toggle in Player */}
            <View style={styles.playerSubtitleToggle}>
              <Text style={styles.playerSubtitleLabel}>Subtitles:</Text>
              {(["dual", "target", "none"] as const).map(mode => (
                <TouchableOpacity
                  key={mode}
                  style={[styles.playerSubChip, subtitleMode === mode && styles.playerSubChipActive]}
                  onPress={() => setSubtitleMode(mode)}
                >
                  <Text style={[styles.playerSubChipText, subtitleMode === mode && styles.playerSubChipTextActive]}>
                    {mode === "dual" ? "Dual" : mode === "target" ? "Target" : "Off"}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0a0a0f",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#1a1a2e",
    alignItems: "center",
    justifyContent: "center",
  },
  headerCenter: {
    flex: 1,
    marginLeft: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  headerSubtitle: {
    fontSize: 13,
    color: "#8e8e93",
    marginTop: 2,
  },
  settingsBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#1a1a2e",
    alignItems: "center",
    justifyContent: "center",
  },

  // ═══ Hero ═══
  heroCard: {
    marginHorizontal: 16,
    backgroundColor: "#1a1a2e",
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#2a2a3e",
  },
  heroBanner: {
    height: 160,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  heroFlag: {
    fontSize: 56,
  },
  heroPlayBtn: {
    position: "absolute",
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.3)",
  },
  heroBadge: {
    position: "absolute",
    top: 12,
    left: 12,
    backgroundColor: "#EF4444",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  heroBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: 0.5,
  },
  heroInfo: {
    padding: 16,
  },
  heroTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  heroMeta: {
    fontSize: 13,
    color: "#8e8e93",
    marginBottom: 8,
  },
  heroDesc: {
    fontSize: 14,
    color: "#a0a0a8",
    lineHeight: 20,
    marginBottom: 12,
  },
  heroTags: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 14,
  },
  heroTag: {
    backgroundColor: "rgba(245, 158, 11, 0.15)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  heroTagText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#F59E0B",
  },
  heroWatchBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#6366F1",
    paddingVertical: 12,
    borderRadius: 10,
  },
  heroWatchBtnText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#FFFFFF",
  },

  // ═══ Category Filter ═══
  categoryRow: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#1a1a2e",
    borderWidth: 1,
    borderColor: "#2a2a3e",
  },
  categoryChipActive: {
    backgroundColor: "#6366F1",
    borderColor: "#6366F1",
  },
  categoryText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#8e8e93",
  },
  categoryTextActive: {
    color: "#FFFFFF",
  },

  // ═══ Series Section ═══
  seriesSection: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  sectionSubtitle: {
    fontSize: 13,
    color: "#8e8e93",
    marginTop: 2,
    marginBottom: 16,
  },
  seriesCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1a1a2e",
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#2a2a3e",
  },
  seriesCardExpanded: {
    borderColor: "#6366F1",
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    marginBottom: 0,
  },
  seriesThumbnail: {
    width: 56,
    height: 56,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  seriesFlag: {
    fontSize: 28,
  },
  seriesInfo: {
    flex: 1,
    marginLeft: 12,
  },
  seriesName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  seriesMeta: {
    fontSize: 11,
    color: "#8e8e93",
    marginTop: 2,
  },
  seriesDesc: {
    fontSize: 12,
    color: "#a0a0a8",
    marginTop: 4,
    lineHeight: 16,
  },
  seriesFooter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 6,
  },
  levelBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  levelBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  teacherLabel: {
    fontSize: 11,
    color: "#8e8e93",
  },

  // ═══ Episode List (expanded) ═══
  episodeList: {
    backgroundColor: "#12121e",
    borderWidth: 1,
    borderTopWidth: 0,
    borderColor: "#6366F1",
    borderBottomLeftRadius: 14,
    borderBottomRightRadius: 14,
    paddingVertical: 8,
    marginBottom: 10,
  },
  episodeRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#1a1a2e",
  },
  episodeNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#1a1a2e",
    alignItems: "center",
    justifyContent: "center",
  },
  episodeNumText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#8e8e93",
  },
  episodeContent: {
    flex: 1,
    marginLeft: 12,
  },
  episodeTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  episodeDesc: {
    fontSize: 12,
    color: "#8e8e93",
    marginTop: 2,
  },
  episodeMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 4,
  },
  episodeDuration: {
    fontSize: 11,
    color: "#8e8e93",
  },
  episodeVocab: {
    fontSize: 11,
    color: "#8e8e93",
  },
  episodeQuizBadge: {
    fontSize: 10,
    fontWeight: "600",
    color: "#6366F1",
    backgroundColor: "rgba(99, 102, 241, 0.15)",
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  episodePlayBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#6366F1",
    alignItems: "center",
    justifyContent: "center",
  },
  comingSoon: {
    alignItems: "center",
    paddingVertical: 24,
    gap: 6,
  },
  comingSoonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#8e8e93",
  },
  comingSoonSub: {
    fontSize: 12,
    color: "#5a5a6e",
  },

  // ═══ Subtitle Prefs ═══
  prefsSection: {
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  prefsSectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
    marginBottom: 10,
  },
  subtitleRow: {
    flexDirection: "row",
    gap: 8,
  },
  subtitleChip: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: "#1a1a2e",
    borderWidth: 1,
    borderColor: "#2a2a3e",
  },
  subtitleChipActive: {
    backgroundColor: "#6366F1",
    borderColor: "#6366F1",
  },
  subtitleChipText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#8e8e93",
  },
  subtitleChipTextActive: {
    color: "#FFFFFF",
  },

  // ═══ Stats ═══
  statsRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    gap: 10,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#1a1a2e",
    borderRadius: 12,
    padding: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#2a2a3e",
  },
  statValue: {
    fontSize: 22,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  statLabel: {
    fontSize: 10,
    color: "#8e8e93",
    marginTop: 4,
    textAlign: "center",
  },

  // ═══ Player Modal ═══
  playerContainer: {
    flex: 1,
    backgroundColor: "#0a0a0f",
  },
  playerHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#1a1a2e",
  },
  playerCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#1a1a2e",
    alignItems: "center",
    justifyContent: "center",
  },
  playerHeaderCenter: {
    flex: 1,
    marginLeft: 12,
  },
  playerSeriesName: {
    fontSize: 12,
    color: "#8e8e93",
  },
  playerEpisodeTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  playerSettingsBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#1a1a2e",
    alignItems: "center",
    justifyContent: "center",
  },
  videoArea: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  videoPlaceholder: {
    height: 220,
    backgroundColor: "#16213e",
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
    overflow: "hidden",
  },
  teacherAvatar: {
    marginBottom: 8,
  },
  videoTeacherName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  videoLanguage: {
    fontSize: 12,
    color: "#8e8e93",
    marginTop: 2,
  },
  subtitleArea: {
    position: "absolute",
    bottom: 16,
    left: 16,
    right: 16,
    alignItems: "center",
  },
  subtitleTarget: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
    backgroundColor: "rgba(0,0,0,0.7)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    textAlign: "center",
    overflow: "hidden",
  },
  subtitleNative: {
    fontSize: 12,
    color: "#a0a0a8",
    backgroundColor: "rgba(0,0,0,0.5)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    marginTop: 4,
    textAlign: "center",
    overflow: "hidden",
  },
  playbackControls: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 32,
    marginTop: 20,
  },
  controlBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#1a1a2e",
    alignItems: "center",
    justifyContent: "center",
  },
  mainPlayBtn: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#6366F1",
    alignItems: "center",
    justifyContent: "center",
  },
  progressBar: {
    height: 4,
    backgroundColor: "#1a1a2e",
    borderRadius: 2,
    marginTop: 20,
    overflow: "hidden",
  },
  progressFill: {
    width: "35%",
    height: "100%",
    backgroundColor: "#6366F1",
    borderRadius: 2,
  },
  progressLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 6,
  },
  progressTime: {
    fontSize: 11,
    color: "#8e8e93",
  },
  playerInfo: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  playerInfoTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 6,
  },
  playerInfoDesc: {
    fontSize: 14,
    color: "#a0a0a8",
    lineHeight: 20,
    marginBottom: 16,
  },
  vocabPreview: {
    backgroundColor: "#1a1a2e",
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#2a2a3e",
  },
  vocabPreviewTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  vocabPreviewHint: {
    fontSize: 12,
    color: "#8e8e93",
  },
  quizCta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(99, 102, 241, 0.1)",
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "rgba(99, 102, 241, 0.3)",
  },
  quizCtaText: {
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
    color: "#6366F1",
  },
  playerSubtitleToggle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 20,
  },
  playerSubtitleLabel: {
    fontSize: 13,
    color: "#8e8e93",
    marginRight: 4,
  },
  playerSubChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: "#1a1a2e",
  },
  playerSubChipActive: {
    backgroundColor: "#6366F1",
  },
  playerSubChipText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#8e8e93",
  },
  playerSubChipTextActive: {
    color: "#FFFFFF",
  },
});
