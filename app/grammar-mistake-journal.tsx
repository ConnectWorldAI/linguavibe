import React, { useState, useEffect, useCallback } from "react";
import { View, Text, Pressable, FlatList, StyleSheet } from "react-native";
import { router } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import * as Haptics from "expo-haptics";
import { Platform } from "react-native";
import {
  getMistakes,
  getMistakePatterns,
  GrammarMistake,
  MistakePattern,
} from "@/lib/grammar-mistakes";

type ViewMode = "patterns" | "history";

export default function GrammarMistakeJournalScreen() {
  const [mistakes, setMistakes] = useState<GrammarMistake[]>([]);
  const [patterns, setPatterns] = useState<MistakePattern[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>("patterns");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [m, p] = await Promise.all([getMistakes(), getMistakePatterns()]);
    setMistakes(m.reverse()); // Most recent first
    setPatterns(p);
  };

  const filteredMistakes = selectedCategory
    ? mistakes.filter((m) => m.category === selectedCategory)
    : mistakes;

  const getCategoryIcon = (category: string): string => {
    const icons: Record<string, string> = {
      verb_conjugation: "🔄",
      pronoun_usage: "👤",
      word_order: "↔️",
      article: "📝",
      preposition: "📍",
      gender_agreement: "⚖️",
      tense: "⏰",
      vocabulary: "📖",
      spelling: "✏️",
      accent_mark: "´",
    };
    return icons[category] || "❓";
  };

  const getCategoryLabel = (category: string): string => {
    return category
      .split("_")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
  };

  const formatTimeAgo = (timestamp: number): string => {
    const diff = Date.now() - timestamp;
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const renderPatternCard = useCallback(
    ({ item }: { item: MistakePattern }) => (
      <Pressable
        style={({ pressed }) => [styles.patternCard, pressed && { opacity: 0.8 }]}
        onPress={() => {
          setSelectedCategory(item.category);
          setViewMode("history");
          if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }}
      >
        <View style={styles.patternHeader}>
          <Text style={styles.patternIcon}>{getCategoryIcon(item.category)}</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.patternName}>{getCategoryLabel(item.category)}</Text>
            <Text style={styles.patternCount}>
              {item.count} mistake{item.count !== 1 ? "s" : ""} • {item.percentage}% of total
            </Text>
          </View>
          <View style={styles.patternBadge}>
            <Text style={styles.patternBadgeText}>{item.count}</Text>
          </View>
        </View>

        {/* Progress bar */}
        <View style={styles.progressBarBg}>
          <View
            style={[
              styles.progressBarFill,
              {
                width: `${Math.min(item.percentage, 100)}%`,
                backgroundColor:
                  item.percentage > 30 ? "#EF4444" : item.percentage > 15 ? "#F59E0B" : "#22C55E",
              },
            ]}
          />
        </View>

        {/* Recent example */}
        {item.recentMistakes.length > 0 && (
          <View style={styles.recentExample}>
            <Text style={styles.recentLabel}>Most recent:</Text>
            <Text style={styles.recentQuestion} numberOfLines={1}>
              {item.recentMistakes[0].question}
            </Text>
            <View style={styles.recentAnswers}>
              <Text style={styles.wrongAnswer}>✗ {item.recentMistakes[0].userAnswer}</Text>
              <Text style={styles.correctAnswer}>✓ {item.recentMistakes[0].correctAnswer}</Text>
            </View>
          </View>
        )}
      </Pressable>
    ),
    []
  );

  const renderMistakeItem = useCallback(
    ({ item }: { item: GrammarMistake }) => (
      <View style={styles.mistakeItem}>
        <View style={styles.mistakeHeader}>
          <Text style={styles.mistakeIcon}>{getCategoryIcon(item.category)}</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.mistakeCategory}>{getCategoryLabel(item.category)}</Text>
            <Text style={styles.mistakeSource}>
              From {item.source} • {formatTimeAgo(item.timestamp)}
            </Text>
          </View>
          <Text style={styles.mistakeLang}>{item.language}</Text>
        </View>

        <View style={styles.mistakeBody}>
          <Text style={styles.mistakeQuestion}>{item.question}</Text>
          <View style={styles.mistakeAnswerRow}>
            <View style={styles.mistakeWrong}>
              <Text style={styles.mistakeWrongLabel}>Your answer:</Text>
              <Text style={styles.mistakeWrongText}>{item.userAnswer}</Text>
            </View>
            <View style={styles.mistakeCorrect}>
              <Text style={styles.mistakeCorrectLabel}>Correct:</Text>
              <Text style={styles.mistakeCorrectText}>{item.correctAnswer}</Text>
            </View>
          </View>
          <View style={styles.ruleBox}>
            <Text style={styles.ruleText}>💡 {item.rule}</Text>
          </View>
        </View>
      </View>
    ),
    []
  );

  return (
    <ScreenContainer edges={["top", "left", "right"]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.7 }]}
          onPress={() => router.back()}
        >
          <Text style={styles.backText}>← Back</Text>
        </Pressable>
        <Text style={styles.headerTitle}>📋 Mistake Journal</Text>
        <Text style={styles.headerCount}>{mistakes.length} logged</Text>
      </View>

      {/* View Toggle */}
      <View style={styles.toggleRow}>
        <Pressable
          style={[styles.toggleBtn, viewMode === "patterns" && styles.toggleActive]}
          onPress={() => {
            setViewMode("patterns");
            setSelectedCategory(null);
          }}
        >
          <Text style={[styles.toggleText, viewMode === "patterns" && styles.toggleTextActive]}>
            Patterns
          </Text>
        </Pressable>
        <Pressable
          style={[styles.toggleBtn, viewMode === "history" && styles.toggleActive]}
          onPress={() => setViewMode("history")}
        >
          <Text style={[styles.toggleText, viewMode === "history" && styles.toggleTextActive]}>
            History
          </Text>
        </Pressable>
      </View>

      {/* Category filter chip */}
      {selectedCategory && viewMode === "history" && (
        <View style={styles.filterRow}>
          <Pressable
            style={styles.filterChip}
            onPress={() => setSelectedCategory(null)}
          >
            <Text style={styles.filterChipText}>
              {getCategoryIcon(selectedCategory)} {getCategoryLabel(selectedCategory)} ✕
            </Text>
          </Pressable>
        </View>
      )}

      {/* Content */}
      {viewMode === "patterns" ? (
        patterns.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📋</Text>
            <Text style={styles.emptyTitle}>No Mistakes Yet</Text>
            <Text style={styles.emptyText}>
              Errors from grammar quizzes and conversations will be logged here automatically.
              Keep practicing!
            </Text>
          </View>
        ) : (
          <FlatList
            data={patterns}
            keyExtractor={(item) => item.category}
            renderItem={renderPatternCard}
            contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
            showsVerticalScrollIndicator={false}
          />
        )
      ) : filteredMistakes.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>✅</Text>
          <Text style={styles.emptyTitle}>No Mistakes Here</Text>
          <Text style={styles.emptyText}>
            {selectedCategory
              ? `No mistakes in ${getCategoryLabel(selectedCategory)} yet.`
              : "Your mistake history will appear here."}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredMistakes}
          keyExtractor={(item) => item.id}
          renderItem={renderMistakeItem}
          contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
        />
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12, gap: 12, borderBottomWidth: 1, borderBottomColor: "#1e2d3d" },
  backBtn: { paddingVertical: 4, paddingHorizontal: 8 },
  backText: { fontSize: 16, color: "#00AAFF", fontWeight: "600" },
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#ECEDEE", flex: 1 },
  headerCount: { fontSize: 13, color: "#9BA1A6", fontWeight: "500" },

  toggleRow: { flexDirection: "row", marginHorizontal: 16, marginTop: 12, backgroundColor: "#0d1b2a", borderRadius: 10, padding: 3 },
  toggleBtn: { flex: 1, paddingVertical: 8, alignItems: "center", borderRadius: 8 },
  toggleActive: { backgroundColor: "#1e3a5f" },
  toggleText: { fontSize: 14, fontWeight: "600", color: "#9BA1A6" },
  toggleTextActive: { color: "#00AAFF" },

  filterRow: { paddingHorizontal: 16, marginTop: 10 },
  filterChip: { alignSelf: "flex-start", backgroundColor: "rgba(0, 170, 255, 0.1)", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, borderWidth: 1, borderColor: "rgba(0, 170, 255, 0.3)" },
  filterChipText: { fontSize: 13, color: "#00AAFF", fontWeight: "600" },

  // Pattern Cards
  patternCard: { backgroundColor: "#0d1b2a", borderRadius: 14, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: "#1e3a5f" },
  patternHeader: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 10 },
  patternIcon: { fontSize: 24 },
  patternName: { fontSize: 15, fontWeight: "700", color: "#ECEDEE" },
  patternCount: { fontSize: 12, color: "#9BA1A6", marginTop: 2 },
  patternBadge: { backgroundColor: "rgba(239, 68, 68, 0.15)", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  patternBadgeText: { fontSize: 14, fontWeight: "800", color: "#EF4444" },

  progressBarBg: { height: 6, backgroundColor: "#1e2d3d", borderRadius: 3, overflow: "hidden", marginBottom: 10 },
  progressBarFill: { height: "100%", borderRadius: 3 },

  recentExample: { backgroundColor: "#0a1628", borderRadius: 8, padding: 10, borderWidth: 1, borderColor: "#1e2d3d" },
  recentLabel: { fontSize: 10, color: "#9BA1A6", fontWeight: "600", textTransform: "uppercase", marginBottom: 4 },
  recentQuestion: { fontSize: 13, color: "#ECEDEE", marginBottom: 6 },
  recentAnswers: { flexDirection: "row", gap: 12 },
  wrongAnswer: { fontSize: 12, color: "#EF4444", fontWeight: "600" },
  correctAnswer: { fontSize: 12, color: "#22C55E", fontWeight: "600" },

  // Mistake Items
  mistakeItem: { backgroundColor: "#0d1b2a", borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: "#1e3a5f" },
  mistakeHeader: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 10 },
  mistakeIcon: { fontSize: 20 },
  mistakeCategory: { fontSize: 13, fontWeight: "700", color: "#ECEDEE" },
  mistakeSource: { fontSize: 11, color: "#9BA1A6", marginTop: 1 },
  mistakeLang: { fontSize: 11, color: "#00AAFF", fontWeight: "600", backgroundColor: "rgba(0, 170, 255, 0.1)", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },

  mistakeBody: { gap: 8 },
  mistakeQuestion: { fontSize: 14, color: "#ECEDEE", fontWeight: "500" },
  mistakeAnswerRow: { flexDirection: "row", gap: 10 },
  mistakeWrong: { flex: 1, backgroundColor: "rgba(239, 68, 68, 0.06)", padding: 8, borderRadius: 8, borderWidth: 1, borderColor: "rgba(239, 68, 68, 0.15)" },
  mistakeWrongLabel: { fontSize: 10, color: "#9BA1A6", fontWeight: "600", marginBottom: 2 },
  mistakeWrongText: { fontSize: 13, color: "#EF4444", fontWeight: "600" },
  mistakeCorrect: { flex: 1, backgroundColor: "rgba(34, 197, 94, 0.06)", padding: 8, borderRadius: 8, borderWidth: 1, borderColor: "rgba(34, 197, 94, 0.15)" },
  mistakeCorrectLabel: { fontSize: 10, color: "#9BA1A6", fontWeight: "600", marginBottom: 2 },
  mistakeCorrectText: { fontSize: 13, color: "#22C55E", fontWeight: "600" },

  ruleBox: { backgroundColor: "rgba(251, 191, 36, 0.06)", padding: 8, borderRadius: 8, borderWidth: 1, borderColor: "rgba(251, 191, 36, 0.15)" },
  ruleText: { fontSize: 12, color: "#FBBF24", fontWeight: "500" },

  // Empty State
  emptyState: { flex: 1, alignItems: "center", justifyContent: "center", padding: 40 },
  emptyIcon: { fontSize: 60, marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontWeight: "700", color: "#ECEDEE", marginBottom: 8 },
  emptyText: { fontSize: 14, color: "#9BA1A6", textAlign: "center", lineHeight: 20 },
});
