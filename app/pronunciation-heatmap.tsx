/**
 * Pronunciation Heatmap Screen
 * Visual grid showing which sounds/words users struggle with most.
 * Color-coded cells from green (mastered) to red (struggling).
 */
import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { ScreenContainer } from "@/components/screen-container";
import { Colors, Spacing, BorderRadius, FontSize } from "@/constants/Colors";
import {
  type HeatmapSummary,
  type HeatmapCell,
  type LanguageHeatmap,
  type CategoryStats,
  type PracticeRecommendation,
  type HeatmapIntensity,
  buildHeatmapSummary,
  cacheHeatmap,
  getCachedHeatmap,
  getIntensityColor,
  getIntensityBgColor,
  generateRecommendations,
} from "@/lib/pronunciation-heatmap";

type ViewMode = "grid" | "categories" | "recommendations";

export default function PronunciationHeatmapScreen() {
  const router = useRouter();
  const [summary, setSummary] = useState<HeatmapSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [selectedLanguage, setSelectedLanguage] = useState<string>("");
  const [recommendations, setRecommendations] = useState<PracticeRecommendation[]>([]);

  useEffect(() => {
    loadHeatmap();
  }, []);

  const loadHeatmap = async () => {
    setLoading(true);
    try {
      // Try cache first
      const cached = await getCachedHeatmap();
      if (cached) {
        setSummary(cached);
        setRecommendations(generateRecommendations(cached));
        if (cached.languages.length > 0) {
          setSelectedLanguage(cached.languages[0].language);
        }
        setLoading(false);
        return;
      }
      const data = await buildHeatmapSummary();
      setSummary(data);
      setRecommendations(generateRecommendations(data));
      await cacheHeatmap(data);
      if (data.languages.length > 0) {
        setSelectedLanguage(data.languages[0].language);
      }
    } catch (err) {
      console.error("Failed to load heatmap:", err);
    } finally {
      setLoading(false);
    }
  };

  const currentLangMap = summary?.languages.find(l => l.language === selectedLanguage);

  // ── Render Helpers ─────────────────────────────────────────────
  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
        <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>Pronunciation Heatmap</Text>
      <TouchableOpacity onPress={loadHeatmap} style={styles.refreshBtn}>
        <Ionicons name="refresh" size={20} color={Colors.accentBlue} />
      </TouchableOpacity>
    </View>
  );

  const renderOverviewStats = () => {
    if (!summary) return null;
    return (
      <View style={styles.overviewRow}>
        <View style={styles.overviewCard}>
          <Text style={styles.overviewValue}>{summary.totalWordsAttempted}</Text>
          <Text style={styles.overviewLabel}>Words Tried</Text>
        </View>
        <View style={styles.overviewCard}>
          <Text style={[styles.overviewValue, { color: Colors.accentBlue }]}>
            {summary.overallAccuracy}%
          </Text>
          <Text style={styles.overviewLabel}>Accuracy</Text>
        </View>
        <View style={styles.overviewCard}>
          <Text style={[styles.overviewValue, { color: Colors.success }]}>
            {summary.practiceStreak}
          </Text>
          <Text style={styles.overviewLabel}>Day Streak</Text>
        </View>
      </View>
    );
  };

  const renderLanguageTabs = () => {
    if (!summary || summary.languages.length <= 1) return null;
    return (
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.langTabs}>
        {summary.languages.map(lang => (
          <TouchableOpacity
            key={lang.language}
            style={[
              styles.langTab,
              selectedLanguage === lang.language && styles.langTabActive,
            ]}
            onPress={() => setSelectedLanguage(lang.language)}
          >
            <Text style={[
              styles.langTabText,
              selectedLanguage === lang.language && styles.langTabTextActive,
            ]}>
              {lang.language}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    );
  };

  const renderViewToggle = () => (
    <View style={styles.viewToggle}>
      {(["grid", "categories", "recommendations"] as ViewMode[]).map(mode => (
        <TouchableOpacity
          key={mode}
          style={[styles.viewToggleBtn, viewMode === mode && styles.viewToggleBtnActive]}
          onPress={() => setViewMode(mode)}
        >
          <Ionicons
            name={mode === "grid" ? "grid" : mode === "categories" ? "bar-chart" : "bulb"}
            size={16}
            color={viewMode === mode ? Colors.accentBlue : Colors.textSecondary}
          />
          <Text style={[
            styles.viewToggleText,
            viewMode === mode && styles.viewToggleTextActive,
          ]}>
            {mode === "grid" ? "Grid" : mode === "categories" ? "Categories" : "Tips"}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderHeatmapCell = ({ item }: { item: HeatmapCell }) => (
    <View style={[styles.heatCell, { backgroundColor: getIntensityBgColor(item.intensity) }]}>
      <View style={[styles.heatCellDot, { backgroundColor: getIntensityColor(item.intensity) }]} />
      <Text style={styles.heatCellWord} numberOfLines={1}>{item.word}</Text>
      <Text style={styles.heatCellPhonetic} numberOfLines={1}>{item.phonetic}</Text>
      <Text style={[styles.heatCellScore, { color: getIntensityColor(item.intensity) }]}>
        {item.averageScore}%
      </Text>
      <View style={styles.heatCellMeta}>
        <Text style={styles.heatCellAttempts}>{item.attempts}x</Text>
        <Ionicons
          name={
            item.recentTrend === "improving" ? "trending-up" :
            item.recentTrend === "declining" ? "trending-down" : "remove"
          }
          size={12}
          color={
            item.recentTrend === "improving" ? Colors.success :
            item.recentTrend === "declining" ? Colors.error : Colors.textSecondary
          }
        />
      </View>
    </View>
  );

  const renderGridView = () => {
    if (!currentLangMap || currentLangMap.cells.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Ionicons name="analytics-outline" size={48} color={Colors.textSecondary} />
          <Text style={styles.emptyTitle}>No Data Yet</Text>
          <Text style={styles.emptySubtitle}>
            Play some pronunciation duels to see your heatmap!
          </Text>
          <TouchableOpacity
            style={styles.startDuelBtn}
            onPress={() => router.push("/pronunciation-duel-lobby" as any)}
          >
            <Text style={styles.startDuelBtnText}>Start a Duel</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.gridContainer}>
        {/* Legend */}
        <View style={styles.legend}>
          {(["struggling", "weak", "moderate", "strong", "mastered"] as HeatmapIntensity[]).map(i => (
            <View key={i} style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: getIntensityColor(i) }]} />
              <Text style={styles.legendText}>{i}</Text>
            </View>
          ))}
        </View>

        {/* Language stats bar */}
        <View style={styles.langStatsBar}>
          <Text style={styles.langStatsText}>
            {currentLangMap.language} — {currentLangMap.overallScore}% avg
          </Text>
          {currentLangMap.improvementRate !== 0 && (
            <View style={styles.improvementBadge}>
              <Ionicons
                name={currentLangMap.improvementRate > 0 ? "arrow-up" : "arrow-down"}
                size={12}
                color={currentLangMap.improvementRate > 0 ? Colors.success : Colors.error}
              />
              <Text style={[
                styles.improvementText,
                { color: currentLangMap.improvementRate > 0 ? Colors.success : Colors.error },
              ]}>
                {Math.abs(currentLangMap.improvementRate)}% this week
              </Text>
            </View>
          )}
        </View>

        <FlatList
          data={currentLangMap.cells}
          renderItem={renderHeatmapCell}
          keyExtractor={item => `${item.language}:${item.word}`}
          numColumns={3}
          columnWrapperStyle={styles.gridRow}
          contentContainerStyle={styles.gridContent}
          showsVerticalScrollIndicator={false}
        />
      </View>
    );
  };

  const renderCategoryView = () => {
    if (!currentLangMap) return null;

    return (
      <ScrollView style={styles.categoryContainer} showsVerticalScrollIndicator={false}>
        {currentLangMap.categoryStats.map(cat => (
          <View key={cat.category} style={styles.categoryCard}>
            <View style={styles.categoryHeader}>
              <Text style={styles.categoryLabel}>{cat.label}</Text>
              <Text style={[
                styles.categoryScore,
                { color: cat.averageScore >= 75 ? Colors.success :
                  cat.averageScore >= 55 ? Colors.warning : Colors.error },
              ]}>
                {cat.totalAttempts > 0 ? `${cat.averageScore}%` : "—"}
              </Text>
            </View>

            {/* Progress bar */}
            <View style={styles.progressBarBg}>
              <View style={[
                styles.progressBarFill,
                {
                  width: `${Math.min(100, cat.averageScore)}%`,
                  backgroundColor: cat.averageScore >= 75 ? Colors.success :
                    cat.averageScore >= 55 ? Colors.warning : Colors.error,
                },
              ]} />
            </View>

            <View style={styles.categoryMeta}>
              <Text style={styles.categoryMetaText}>
                {cat.totalAttempts} attempts
              </Text>
              <Text style={styles.categoryMetaText}>
                {cat.weakWordCount} weak · {cat.strongWordCount} strong
              </Text>
            </View>

            {/* Weak words in this category */}
            {currentLangMap.cells
              .filter(c => c.category === cat.category && c.averageScore < 55)
              .slice(0, 3)
              .map(cell => (
                <View key={cell.word} style={styles.weakWordRow}>
                  <View style={[styles.weakWordDot, { backgroundColor: getIntensityColor(cell.intensity) }]} />
                  <Text style={styles.weakWordText}>{cell.word}</Text>
                  <Text style={styles.weakWordPhonetic}>{cell.phonetic}</Text>
                  <Text style={[styles.weakWordScore, { color: getIntensityColor(cell.intensity) }]}>
                    {cell.averageScore}%
                  </Text>
                </View>
              ))
            }
          </View>
        ))}
      </ScrollView>
    );
  };

  const renderRecommendationsView = () => {
    if (recommendations.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Ionicons name="checkmark-circle" size={48} color={Colors.success} />
          <Text style={styles.emptyTitle}>Looking Good!</Text>
          <Text style={styles.emptySubtitle}>
            Keep practicing and recommendations will appear here.
          </Text>
        </View>
      );
    }

    return (
      <FlatList
        data={recommendations}
        keyExtractor={(item, i) => `rec-${i}`}
        contentContainerStyle={styles.recList}
        renderItem={({ item }) => (
          <View style={styles.recCard}>
            <View style={[
              styles.recIcon,
              {
                backgroundColor: item.priority === 1 ? "rgba(255,68,68,0.15)" :
                  item.priority === 2 ? "rgba(255,140,0,0.15)" :
                  item.priority === 3 ? "rgba(255,214,0,0.15)" : "rgba(0,204,255,0.15)",
              },
            ]}>
              <Ionicons
                name={
                  item.type === "weak_word" ? "alert-circle" :
                  item.type === "declining_word" ? "trending-down" :
                  item.type === "new_category" ? "add-circle" : "refresh"
                }
                size={20}
                color={
                  item.priority === 1 ? Colors.error :
                  item.priority === 2 ? "#FF8C00" :
                  item.priority === 3 ? Colors.warning : Colors.accentBlue
                }
              />
            </View>
            <View style={styles.recContent}>
              <Text style={styles.recReason}>{item.reason}</Text>
              <Text style={styles.recLang}>{item.language}</Text>
            </View>
            <TouchableOpacity
              style={styles.recAction}
              onPress={() => router.push({
                pathname: "/pronunciation-duel-lobby" as any,
                params: { language: item.language, category: item.category },
              })}
            >
              <Ionicons name="play" size={16} color={Colors.accentBlue} />
            </TouchableOpacity>
          </View>
        )}
      />
    );
  };

  if (loading) {
    return (
      <ScreenContainer>
        {renderHeader()}
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.accentBlue} />
          <Text style={styles.loadingText}>Analyzing your pronunciation data...</Text>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      {renderHeader()}
      {renderOverviewStats()}
      {renderLanguageTabs()}
      {renderViewToggle()}
      <View style={styles.content}>
        {viewMode === "grid" && renderGridView()}
        {viewMode === "categories" && renderCategoryView()}
        {viewMode === "recommendations" && renderRecommendationsView()}
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  backBtn: { padding: 8 },
  headerTitle: {
    flex: 1,
    fontSize: FontSize.xl,
    fontWeight: "700",
    color: Colors.textPrimary,
    textAlign: "center",
  },
  refreshBtn: { padding: 8 },

  overviewRow: {
    flexDirection: "row",
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  overviewCard: {
    flex: 1,
    backgroundColor: Colors.surfaceCard,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.glassBorder,
  },
  overviewValue: {
    fontSize: FontSize.xxl,
    fontWeight: "800",
    color: Colors.textPrimary,
  },
  overviewLabel: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },

  langTabs: {
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
    maxHeight: 40,
  },
  langTab: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surfaceCard,
    marginRight: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
  },
  langTabActive: {
    backgroundColor: "rgba(0,204,255,0.15)",
    borderColor: Colors.accentBlue,
  },
  langTabText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontWeight: "600",
  },
  langTabTextActive: {
    color: Colors.accentBlue,
  },

  viewToggle: {
    flexDirection: "row",
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  viewToggleBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingVertical: 8,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surfaceCard,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
  },
  viewToggleBtnActive: {
    backgroundColor: "rgba(0,204,255,0.1)",
    borderColor: Colors.accentBlue,
  },
  viewToggleText: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    fontWeight: "600",
  },
  viewToggleTextActive: {
    color: Colors.accentBlue,
  },

  content: { flex: 1 },

  // Grid view
  gridContainer: { flex: 1, paddingHorizontal: Spacing.md },
  legend: {
    flexDirection: "row",
    justifyContent: "center",
    gap: Spacing.md,
    marginBottom: Spacing.sm,
  },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 10, color: Colors.textSecondary, textTransform: "capitalize" },

  langStatsBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.sm,
  },
  langStatsText: {
    fontSize: FontSize.sm,
    color: Colors.textPrimary,
    fontWeight: "600",
  },
  improvementBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  improvementText: {
    fontSize: FontSize.xs,
    fontWeight: "600",
  },

  gridRow: { gap: Spacing.sm, marginBottom: Spacing.sm },
  gridContent: { paddingBottom: 100 },
  heatCell: {
    flex: 1,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    minHeight: 90,
  },
  heatCellDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    position: "absolute",
    top: 8,
    right: 8,
  },
  heatCellWord: {
    fontSize: FontSize.sm,
    fontWeight: "700",
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  heatCellPhonetic: {
    fontSize: 10,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  heatCellScore: {
    fontSize: FontSize.lg,
    fontWeight: "800",
  },
  heatCellMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 2,
  },
  heatCellAttempts: {
    fontSize: 10,
    color: Colors.textSecondary,
  },

  // Category view
  categoryContainer: { paddingHorizontal: Spacing.md },
  categoryCard: {
    backgroundColor: Colors.surfaceCard,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
  },
  categoryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  categoryLabel: {
    fontSize: FontSize.md,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  categoryScore: {
    fontSize: FontSize.lg,
    fontWeight: "800",
  },
  progressBarBg: {
    height: 6,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 3,
    overflow: "hidden",
    marginBottom: Spacing.sm,
  },
  progressBarFill: {
    height: 6,
    borderRadius: 3,
  },
  categoryMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: Spacing.sm,
  },
  categoryMetaText: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
  },
  weakWordRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 4,
    borderTopWidth: 1,
    borderTopColor: Colors.glassBorder,
  },
  weakWordDot: { width: 6, height: 6, borderRadius: 3 },
  weakWordText: {
    fontSize: FontSize.sm,
    color: Colors.textPrimary,
    fontWeight: "600",
    flex: 1,
  },
  weakWordPhonetic: {
    fontSize: 10,
    color: Colors.textSecondary,
  },
  weakWordScore: {
    fontSize: FontSize.sm,
    fontWeight: "700",
    width: 40,
    textAlign: "right",
  },

  // Recommendations view
  recList: { paddingHorizontal: Spacing.md, paddingBottom: 100 },
  recCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surfaceCard,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    gap: Spacing.sm,
  },
  recIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  recContent: { flex: 1 },
  recReason: {
    fontSize: FontSize.sm,
    color: Colors.textPrimary,
    fontWeight: "500",
    lineHeight: 18,
  },
  recLang: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  recAction: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(0,204,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },

  // Empty state
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing.xl,
    gap: Spacing.sm,
  },
  emptyTitle: {
    fontSize: FontSize.xl,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  emptySubtitle: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: 20,
  },
  startDuelBtn: {
    marginTop: Spacing.md,
    backgroundColor: Colors.accentBlue,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  startDuelBtnText: {
    fontSize: FontSize.md,
    fontWeight: "700",
    color: "#FFFFFF",
  },

  // Loading
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.md,
  },
  loadingText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
});
