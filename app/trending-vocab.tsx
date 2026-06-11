/**
 * Trending Vocabulary Screen — Real-time social media trends monitor
 * that surfaces trending vocabulary, viral phrases, music lyrics,
 * and news vocabulary for each language/dialect.
 */

import { useEffect, useState, useCallback } from "react";
import {
  Text,
  View,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { ScreenContainer } from "@/components/screen-container";
import { Colors } from "@/constants/Colors";
import { trpc } from "@/lib/trpc";

// ─── Language Options ─────────────────────────────────────────────────────────
const LANGUAGE_OPTIONS = [
  { code: "es-DO", label: "Dominican", flag: "🇩🇴" },
  { code: "es-MX", label: "Mexican", flag: "🇲🇽" },
  { code: "es-CO", label: "Colombian", flag: "🇨🇴" },
  { code: "es-VE", label: "Venezuelan", flag: "🇻🇪" },
  { code: "es-CU", label: "Cuban", flag: "🇨🇺" },
  { code: "es-CR", label: "Costa Rican", flag: "🇨🇷" },
  { code: "es-AR", label: "Argentine", flag: "🇦🇷" },
  { code: "es-PE", label: "Peruvian", flag: "🇵🇪" },
  { code: "es-CL", label: "Chilean", flag: "🇨🇱" },
  { code: "es-PR", label: "Puerto Rican", flag: "🇵🇷" },
  { code: "es", label: "Spanish", flag: "🇪🇸" },
  { code: "fr", label: "French", flag: "🇫🇷" },
  { code: "fr-HT", label: "Haitian Creole", flag: "🇭🇹" },
  { code: "fr-QC", label: "Québécois", flag: "🇨🇦" },
  { code: "fr-SN", label: "Senegalese", flag: "🇸🇳" },
  { code: "pt-BR", label: "Brazilian", flag: "🇧🇷" },
  { code: "pt-PT", label: "Portuguese", flag: "🇵🇹" },
  { code: "ar-EG", label: "Egyptian", flag: "🇪🇬" },
  { code: "ar-LB", label: "Lebanese", flag: "🇱🇧" },
  { code: "ar-AE", label: "Emirati", flag: "🇦🇪" },
  { code: "ja", label: "Japanese", flag: "🇯🇵" },
  { code: "ko", label: "Korean", flag: "🇰🇷" },
  { code: "zh", label: "Mandarin", flag: "🇨🇳" },
  { code: "it", label: "Italian", flag: "🇮🇹" },
  { code: "de", label: "German", flag: "🇩🇪" },
];

const CATEGORY_FILTERS = [
  { id: "all", label: "All", icon: "apps", color: Colors.primary },
  { id: "slang", label: "Slang", icon: "flame", color: "#EF4444" },
  { id: "music", label: "Music", icon: "musical-notes", color: "#8B5CF6" },
  { id: "news", label: "News", icon: "newspaper", color: "#3B82F6" },
  { id: "meme", label: "Memes", icon: "happy", color: "#F59E0B" },
  { id: "culture", label: "Culture", icon: "globe", color: "#10B981" },
];

export default function TrendingVocabScreen() {
  const router = useRouter();
  const [activeLang, setActiveLang] = useState("es-DO");
  const [activeCategory, setActiveCategory] = useState("all");
  const [showLanguagePicker, setShowLanguagePicker] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Load user's language preference
  useEffect(() => {
    (async () => {
      try {
        const prefsStr = await AsyncStorage.getItem("@language_preferences");
        if (prefsStr) {
          const prefs = JSON.parse(prefsStr);
          if (prefs.targetLanguages?.length > 0) {
            setActiveLang(prefs.targetLanguages[0]);
            return;
          }
        }
        const lang = await AsyncStorage.getItem("@target_language");
        if (lang) setActiveLang(lang);
      } catch {}
    })();
  }, []);

  // Fetch trending data from server
  const trendsQuery = trpc.trendingVocab.getTrends.useQuery(
    { languageCode: activeLang },
    { staleTime: 15 * 60 * 1000 } // 15 min stale time
  );

  const refreshMutation = trpc.trendingVocab.refreshTrends.useMutation();

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await refreshMutation.mutateAsync({ languageCode: activeLang });
      await trendsQuery.refetch();
    } catch {}
    setRefreshing(false);
  }, [activeLang, refreshMutation, trendsQuery]);

  const currentLangOption = LANGUAGE_OPTIONS.find(l => l.code === activeLang) || LANGUAGE_OPTIONS[0];

  // Filter trending words by category
  const filteredWords = (trendsQuery.data?.trendingWords || []).filter(
    w => activeCategory === "all" || w.category === activeCategory
  );

  // ─── Render Functions ────────────────────────────────────────────────────────

  const renderViralScoreBar = (score: number) => {
    const color = score >= 90 ? "#EF4444" : score >= 75 ? "#F59E0B" : score >= 50 ? "#10B981" : "#6366F1";
    return (
      <View style={styles.scoreBarContainer}>
        <View style={[styles.scoreBarFill, { width: `${score}%`, backgroundColor: color }]} />
        <Text style={[styles.scoreText, { color }]}>{score}</Text>
      </View>
    );
  };

  const renderTrendingWord = ({ item }: { item: any }) => {
    const sourceColors: Record<string, string> = {
      TikTok: "#000000",
      Instagram: "#E1306C",
      Music: "#8B5CF6",
      News: "#3B82F6",
      Street: "#10B981",
      YouTube: "#FF0000",
    };
    const sourceColor = sourceColors[item.source] || Colors.textSecondary;

    return (
      <View style={styles.wordCard}>
        <View style={styles.wordHeader}>
          <View style={styles.wordTitleRow}>
            <Text style={styles.wordText}>{item.word}</Text>
            <View style={[styles.sourceBadge, { backgroundColor: sourceColor + "20" }]}>
              <Text style={[styles.sourceText, { color: sourceColor }]}>{item.source}</Text>
            </View>
          </View>
          <Text style={styles.translationText}>{item.translation}</Text>
        </View>

        <Text style={styles.contextText}>{item.context}</Text>

        <View style={styles.exampleRow}>
          <Ionicons name="chatbubble-outline" size={12} color={Colors.textSecondary} />
          <Text style={styles.exampleText}>"{item.example}"</Text>
        </View>

        <View style={styles.wordFooter}>
          <Text style={styles.viralLabel}>Viral Score</Text>
          {renderViralScoreBar(item.viralScore)}
        </View>
      </View>
    );
  };

  const renderViralPhrase = ({ item }: { item: any }) => (
    <View style={styles.phraseCard}>
      <View style={styles.phraseHeader}>
        <Ionicons name="trending-up" size={16} color="#EF4444" />
        <Text style={styles.phraseText}>{item.phrase}</Text>
      </View>
      <Text style={styles.phraseMeaning}>{item.meaning}</Text>
      <View style={styles.phraseFooter}>
        <Text style={styles.phraseOrigin}>{item.origin}</Text>
        <View style={[styles.platformBadge]}>
          <Text style={styles.platformText}>{item.platform}</Text>
        </View>
      </View>
    </View>
  );

  const renderMusicTrend = ({ item }: { item: any }) => (
    <View style={styles.musicCard}>
      <View style={styles.musicHeader}>
        <Ionicons name="musical-notes" size={16} color="#8B5CF6" />
        <View style={styles.musicInfo}>
          <Text style={styles.musicSong}>{item.song}</Text>
          <Text style={styles.musicArtist}>{item.artist}</Text>
        </View>
      </View>
      <View style={styles.musicLyric}>
        <Text style={styles.musicPhrase}>"{item.phrase}"</Text>
        <Text style={styles.musicTranslation}>{item.translation}</Text>
      </View>
    </View>
  );

  const renderNewsTrend = ({ item }: { item: any }) => (
    <View style={styles.newsCard}>
      <View style={styles.newsHeader}>
        <Ionicons name="newspaper" size={16} color="#3B82F6" />
        <Text style={styles.newsTopic}>{item.topic}</Text>
      </View>
      <Text style={styles.newsContext}>{item.context}</Text>
      <View style={styles.newsVocab}>
        {item.keyVocab.map((word: string, i: number) => (
          <View key={i} style={styles.newsVocabChip}>
            <Text style={styles.newsVocabText}>{word}</Text>
          </View>
        ))}
      </View>
    </View>
  );

  return (
    <ScreenContainer className="p-0">
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
          <View style={styles.headerTitleArea}>
            <Text style={styles.headerTitle}>Trending Vocabulary</Text>
            <Text style={styles.headerSubtitle}>Social media • Music • News</Text>
          </View>
          <TouchableOpacity onPress={handleRefresh} style={styles.refreshBtn}>
            <Ionicons name="refresh" size={20} color={Colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Language Selector */}
        <TouchableOpacity
          style={styles.langSelector}
          onPress={() => setShowLanguagePicker(!showLanguagePicker)}
        >
          <Text style={styles.langFlag}>{currentLangOption.flag}</Text>
          <Text style={styles.langName}>{currentLangOption.label}</Text>
          <Ionicons name={showLanguagePicker ? "chevron-up" : "chevron-down"} size={16} color={Colors.textSecondary} />
        </TouchableOpacity>

        {showLanguagePicker && (
          <View style={styles.langDropdown}>
            <FlatList
              data={LANGUAGE_OPTIONS}
              keyExtractor={(item) => item.code}
              style={{ maxHeight: 200 }}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.langOption}
                  onPress={() => {
                    setActiveLang(item.code);
                    setShowLanguagePicker(false);
                  }}
                >
                  <Text style={styles.langFlag}>{item.flag}</Text>
                  <Text style={[
                    styles.langOptionText,
                    item.code === activeLang && styles.langOptionActive,
                  ]}>{item.label}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        )}

        {/* Category Filters */}
        <FlatList
          horizontal
          data={CATEGORY_FILTERS}
          keyExtractor={(item) => item.id}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryRow}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.categoryChip,
                activeCategory === item.id && { backgroundColor: item.color + "20", borderColor: item.color },
              ]}
              onPress={() => setActiveCategory(item.id)}
            >
              <Ionicons
                name={item.icon as any}
                size={14}
                color={activeCategory === item.id ? item.color : Colors.textSecondary}
              />
              <Text style={[
                styles.categoryText,
                activeCategory === item.id && { color: item.color, fontWeight: "700" },
              ]}>{item.label}</Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* Content */}
      {trendsQuery.isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Scanning social media trends...</Text>
        </View>
      ) : (
        <FlatList
          data={[1]} // Single item to render all sections
          keyExtractor={() => "content"}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={Colors.primary}
            />
          }
          contentContainerStyle={styles.contentContainer}
          renderItem={() => (
            <View>
              {/* Last Updated */}
              {trendsQuery.data?.lastUpdated && (
                <View style={styles.updatedRow}>
                  <Ionicons name="time-outline" size={12} color={Colors.textSecondary} />
                  <Text style={styles.updatedText}>
                    Updated: {new Date(trendsQuery.data.lastUpdated).toLocaleString()}
                  </Text>
                </View>
              )}

              {/* Trending Words Section */}
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Ionicons name="trending-up" size={18} color="#EF4444" />
                  <Text style={styles.sectionTitle}>Trending Words</Text>
                  <View style={styles.countBadge}>
                    <Text style={styles.countText}>{filteredWords.length}</Text>
                  </View>
                </View>
                {filteredWords.map((word, i) => (
                  <View key={i}>{renderTrendingWord({ item: word })}</View>
                ))}
                {filteredWords.length === 0 && (
                  <Text style={styles.emptyText}>No trending words in this category</Text>
                )}
              </View>

              {/* Viral Phrases Section */}
              {activeCategory === "all" && (trendsQuery.data?.viralPhrases || []).length > 0 && (
                <View style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <Ionicons name="flash" size={18} color="#F59E0B" />
                    <Text style={styles.sectionTitle}>Viral Phrases</Text>
                  </View>
                  {(trendsQuery.data?.viralPhrases || []).map((phrase, i) => (
                    <View key={i}>{renderViralPhrase({ item: phrase })}</View>
                  ))}
                </View>
              )}

              {/* Music Trends Section */}
              {(activeCategory === "all" || activeCategory === "music") && (trendsQuery.data?.musicTrends || []).length > 0 && (
                <View style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <Ionicons name="musical-notes" size={18} color="#8B5CF6" />
                    <Text style={styles.sectionTitle}>Music Trends</Text>
                  </View>
                  {(trendsQuery.data?.musicTrends || []).map((trend, i) => (
                    <View key={i}>{renderMusicTrend({ item: trend })}</View>
                  ))}
                </View>
              )}

              {/* News Trends Section */}
              {(activeCategory === "all" || activeCategory === "news") && (trendsQuery.data?.newsTrends || []).length > 0 && (
                <View style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <Ionicons name="newspaper" size={18} color="#3B82F6" />
                    <Text style={styles.sectionTitle}>News Vocabulary</Text>
                  </View>
                  {(trendsQuery.data?.newsTrends || []).map((trend, i) => (
                    <View key={i}>{renderNewsTrend({ item: trend })}</View>
                  ))}
                </View>
              )}

              {/* Cultural Feed Link */}
              <TouchableOpacity
                style={styles.feedLink}
                onPress={() => router.push("/live-cultural-feed" as any)}
              >
                <Ionicons name="pulse" size={18} color="#EF4444" />
                <Text style={styles.feedLinkText}>View Live Cultural Feed</Text>
                <Ionicons name="chevron-forward" size={16} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>
          )}
        />
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 4,
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  backBtn: {
    marginRight: 12,
  },
  headerTitleArea: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  headerSubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  refreshBtn: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: Colors.surfaceCard,
  },
  langSelector: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surfaceCard,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 10,
    gap: 8,
  },
  langFlag: {
    fontSize: 18,
  },
  langName: {
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  langDropdown: {
    backgroundColor: Colors.surfaceCard,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 10,
  },
  langOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.border,
    gap: 8,
  },
  langOptionText: {
    fontSize: 13,
    color: Colors.textPrimary,
  },
  langOptionActive: {
    color: Colors.primary,
    fontWeight: "700",
  },
  categoryRow: {
    paddingVertical: 8,
    gap: 8,
  },
  categoryChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 4,
  },
  categoryText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: "500",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  updatedRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 16,
  },
  updatedText: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.textPrimary,
    flex: 1,
  },
  countBadge: {
    backgroundColor: Colors.primary + "20",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  countText: {
    fontSize: 11,
    fontWeight: "700",
    color: Colors.primary,
  },
  wordCard: {
    backgroundColor: Colors.surfaceCard,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  wordHeader: {
    marginBottom: 8,
  },
  wordTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  wordText: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.textPrimary,
    flex: 1,
  },
  sourceBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  sourceText: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  translationText: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  contextText: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 8,
    lineHeight: 18,
  },
  exampleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
    marginBottom: 10,
    paddingTop: 4,
  },
  exampleText: {
    fontSize: 12,
    color: Colors.primary,
    fontStyle: "italic",
    flex: 1,
    lineHeight: 18,
  },
  wordFooter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  viralLabel: {
    fontSize: 10,
    fontWeight: "600",
    color: Colors.textSecondary,
  },
  scoreBarContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  scoreBarFill: {
    height: 4,
    borderRadius: 2,
    flex: 1,
  },
  scoreText: {
    fontSize: 11,
    fontWeight: "700",
  },
  phraseCard: {
    backgroundColor: Colors.surfaceCard,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  phraseHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 6,
  },
  phraseText: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.textPrimary,
    flex: 1,
  },
  phraseMeaning: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 8,
    lineHeight: 18,
  },
  phraseFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  phraseOrigin: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontStyle: "italic",
  },
  platformBadge: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  platformText: {
    fontSize: 10,
    fontWeight: "600",
    color: Colors.textSecondary,
  },
  musicCard: {
    backgroundColor: Colors.surfaceCard,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#8B5CF6" + "30",
  },
  musicHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  musicInfo: {
    flex: 1,
  },
  musicSong: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  musicArtist: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  musicLyric: {
    backgroundColor: Colors.primary,
    borderRadius: 10,
    padding: 10,
  },
  musicPhrase: {
    fontSize: 13,
    fontWeight: "500",
    color: "#8B5CF6",
    fontStyle: "italic",
    marginBottom: 4,
  },
  musicTranslation: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  newsCard: {
    backgroundColor: Colors.surfaceCard,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#3B82F6" + "30",
  },
  newsHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 6,
  },
  newsTopic: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.textPrimary,
    flex: 1,
  },
  newsContext: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 8,
    lineHeight: 18,
  },
  newsVocab: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  newsVocabChip: {
    backgroundColor: "#3B82F6" + "15",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  newsVocabText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#3B82F6",
  },
  feedLink: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surfaceCard,
    borderRadius: 14,
    padding: 16,
    gap: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    marginTop: 8,
  },
  feedLinkText: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.textPrimary,
    flex: 1,
  },
  emptyText: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: "center",
    paddingVertical: 20,
  },
});
