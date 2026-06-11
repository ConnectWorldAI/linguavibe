import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  FlatList,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import { Platform } from "react-native";
import { Colors, Spacing, BorderRadius, FontSize } from "../constants/Colors";

// ─── Types ───────────────────────────────────────────────────────────────────
type LibraryCategory = "all" | "stories" | "grammar" | "vocabulary" | "culture" | "news";

type ReadingItem = {
  id: string;
  title: string;
  subtitle: string;
  category: LibraryCategory;
  difficulty: "A1" | "A2" | "B1" | "B2" | "C1";
  duration: string;
  progress: number; // 0-100
  isNew: boolean;
  wordCount: number;
  icon: string;
};

// ─── Mock Data ───────────────────────────────────────────────────────────────
const CATEGORIES: { key: LibraryCategory; label: string; icon: string }[] = [
  { key: "all", label: "All", icon: "library" },
  { key: "stories", label: "Stories", icon: "book" },
  { key: "grammar", label: "Grammar", icon: "school" },
  { key: "vocabulary", label: "Vocab", icon: "text" },
  { key: "culture", label: "Culture", icon: "earth" },
  { key: "news", label: "News", icon: "newspaper" },
];

const READING_ITEMS: ReadingItem[] = [
  { id: "1", title: "El Mercado de San Miguel", subtitle: "A day at Madrid's famous food market", category: "stories", difficulty: "A2", duration: "5 min", progress: 100, isNew: false, wordCount: 320, icon: "storefront" },
  { id: "2", title: "Ser vs. Estar", subtitle: "Master the two 'to be' verbs", category: "grammar", difficulty: "A2", duration: "8 min", progress: 65, isNew: false, wordCount: 580, icon: "school" },
  { id: "3", title: "La Familia", subtitle: "Family vocabulary and relationships", category: "vocabulary", difficulty: "A1", duration: "4 min", progress: 0, isNew: true, wordCount: 200, icon: "people" },
  { id: "4", title: "Día de los Muertos", subtitle: "Understanding Mexico's celebration of life", category: "culture", difficulty: "B1", duration: "10 min", progress: 30, isNew: false, wordCount: 750, icon: "skull" },
  { id: "5", title: "Noticias del Mundo", subtitle: "Current events in simple Spanish", category: "news", difficulty: "B1", duration: "6 min", progress: 0, isNew: true, wordCount: 420, icon: "newspaper" },
  { id: "6", title: "El Subjuntivo", subtitle: "When and how to use the subjunctive mood", category: "grammar", difficulty: "B2", duration: "12 min", progress: 0, isNew: true, wordCount: 900, icon: "git-branch" },
  { id: "7", title: "Un Viaje a Buenos Aires", subtitle: "Exploring Argentina's vibrant capital", category: "stories", difficulty: "B1", duration: "7 min", progress: 45, isNew: false, wordCount: 520, icon: "airplane" },
  { id: "8", title: "Comida Callejera", subtitle: "Street food vocabulary across Latin America", category: "vocabulary", difficulty: "A2", duration: "5 min", progress: 0, isNew: true, wordCount: 280, icon: "fast-food" },
  { id: "9", title: "El Tango Argentino", subtitle: "History and culture of Argentina's iconic dance", category: "culture", difficulty: "B2", duration: "9 min", progress: 0, isNew: false, wordCount: 680, icon: "musical-notes" },
  { id: "10", title: "Preterite vs Imperfect", subtitle: "Telling stories in the past tense", category: "grammar", difficulty: "B1", duration: "10 min", progress: 20, isNew: false, wordCount: 720, icon: "time" },
  { id: "11", title: "La Receta de Abuela", subtitle: "Grandma's recipe — cooking vocabulary", category: "stories", difficulty: "A1", duration: "3 min", progress: 100, isNew: false, wordCount: 180, icon: "restaurant" },
  { id: "12", title: "Deportes en Latinoamérica", subtitle: "Sports culture and fan vocabulary", category: "culture", difficulty: "A2", duration: "6 min", progress: 0, isNew: true, wordCount: 380, icon: "football" },
];

const DAILY_READING = {
  title: "Today's Reading Challenge",
  target: 3,
  completed: 1,
  streak: 7,
};

// ─── Component ───────────────────────────────────────────────────────────────
export default function LibraryScreen() {
  const [activeCategory, setActiveCategory] = useState<LibraryCategory>("all");
  const [sortBy, setSortBy] = useState<"recent" | "difficulty" | "progress">("recent");

  const filteredItems = READING_ITEMS.filter(
    (item) => activeCategory === "all" || item.category === activeCategory
  );

  const sortedItems = [...filteredItems].sort((a, b) => {
    if (sortBy === "difficulty") {
      const order = ["A1", "A2", "B1", "B2", "C1"];
      return order.indexOf(a.difficulty) - order.indexOf(b.difficulty);
    }
    if (sortBy === "progress") return b.progress - a.progress;
    return 0; // recent = default order
  });

  const getDifficultyColor = (d: string) => {
    switch (d) {
      case "A1": return Colors.success;
      case "A2": return Colors.success;
      case "B1": return Colors.gold;
      case "B2": return Colors.warning;
      case "C1": return Colors.accent;
      default: return Colors.textSecondary;
    }
  };

  const renderReadingItem = ({ item }: { item: ReadingItem }) => (
    <TouchableOpacity
      style={styles.readingCard}
      activeOpacity={0.7}
      onPress={() => {
        if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }}
    >
      <View style={styles.cardLeft}>
        <View style={[styles.cardIcon, { backgroundColor: getDifficultyColor(item.difficulty) + "15" }]}>
          <Ionicons name={item.icon as any} size={20} color={getDifficultyColor(item.difficulty)} />
        </View>
      </View>
      <View style={styles.cardCenter}>
        <View style={styles.cardTitleRow}>
          <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
          {item.isNew && (
            <View style={styles.newBadge}>
              <Text style={styles.newBadgeText}>NEW</Text>
            </View>
          )}
        </View>
        <Text style={styles.cardSubtitle} numberOfLines={1}>{item.subtitle}</Text>
        <View style={styles.cardMeta}>
          <View style={[styles.difficultyBadge, { backgroundColor: getDifficultyColor(item.difficulty) + "20" }]}>
            <Text style={[styles.difficultyText, { color: getDifficultyColor(item.difficulty) }]}>{item.difficulty}</Text>
          </View>
          <Text style={styles.metaText}>{item.duration}</Text>
          <Text style={styles.metaDot}>·</Text>
          <Text style={styles.metaText}>{item.wordCount} words</Text>
        </View>
        {item.progress > 0 && (
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${item.progress}%`, backgroundColor: item.progress === 100 ? Colors.success : Colors.secondary }]} />
          </View>
        )}
      </View>
      <View style={styles.cardRight}>
        {item.progress === 100 ? (
          <Ionicons name="checkmark-circle" size={22} color={Colors.success} />
        ) : item.progress > 0 ? (
          <Text style={styles.progressText}>{item.progress}%</Text>
        ) : (
          <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Library</Text>
          <Text style={styles.headerSub}>Reading & vocabulary study</Text>
        </View>
        <TouchableOpacity style={styles.searchBtn}>
          <Ionicons name="search" size={20} color={Colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Daily Challenge Card */}
      <View style={styles.dailyCard}>
        <View style={styles.dailyLeft}>
          <View style={styles.dailyIcon}>
            <Ionicons name="book" size={20} color={Colors.secondary} />
          </View>
          <View>
            <Text style={styles.dailyTitle}>{DAILY_READING.title}</Text>
            <Text style={styles.dailySub}>{DAILY_READING.completed}/{DAILY_READING.target} readings today</Text>
          </View>
        </View>
        <View style={styles.dailyStreak}>
          <Ionicons name="flame" size={14} color={Colors.gold} />
          <Text style={styles.dailyStreakText}>{DAILY_READING.streak}d</Text>
        </View>
      </View>

      {/* Category Tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryBar} contentContainerStyle={styles.categoryScroll}>
        {CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat.key}
            style={[styles.categoryTab, activeCategory === cat.key && styles.categoryTabActive]}
            onPress={() => {
              setActiveCategory(cat.key);
              if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
            activeOpacity={0.7}
          >
            <Ionicons
              name={cat.icon as any}
              size={14}
              color={activeCategory === cat.key ? Colors.textPrimary : Colors.textSecondary}
            />
            <Text style={[styles.categoryText, activeCategory === cat.key && styles.categoryTextActive]}>
              {cat.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Sort Row */}
      <View style={styles.sortRow}>
        <Text style={styles.resultCount}>{sortedItems.length} items</Text>
        <View style={styles.sortButtons}>
          {(["recent", "difficulty", "progress"] as const).map((s) => (
            <TouchableOpacity
              key={s}
              style={[styles.sortBtn, sortBy === s && styles.sortBtnActive]}
              onPress={() => setSortBy(s)}
            >
              <Text style={[styles.sortBtnText, sortBy === s && styles.sortBtnTextActive]}>
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Reading List */}
      <FlatList
        data={sortedItems}
        keyExtractor={(item) => item.id}
        renderItem={renderReadingItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    gap: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surfaceCard,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  headerCenter: { flex: 1 },
  headerTitle: {
    fontSize: FontSize.lg,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  headerSub: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  searchBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surfaceCard,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.border,
  },

  // Daily card
  dailyCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginHorizontal: Spacing.lg,
    padding: Spacing.md,
    backgroundColor: Colors.glowSubtle,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.glowBorder,
    marginBottom: Spacing.md,
  },
  dailyLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  dailyIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.secondary + "20",
    alignItems: "center",
    justifyContent: "center",
  },
  dailyTitle: {
    fontSize: FontSize.sm,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  dailySub: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  dailyStreak: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: Colors.goldGlow,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.goldBorder,
  },
  dailyStreakText: {
    fontSize: FontSize.xs,
    fontWeight: "700",
    color: Colors.gold,
  },

  // Category tabs
  categoryBar: {
    maxHeight: 44,
    marginBottom: Spacing.sm,
  },
  categoryScroll: {
    paddingHorizontal: Spacing.lg,
    gap: 6,
  },
  categoryTab: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surfaceCard,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  categoryTabActive: {
    backgroundColor: Colors.secondary,
    borderColor: Colors.secondary,
  },
  categoryText: {
    fontSize: FontSize.sm,
    fontWeight: "600",
    color: Colors.textSecondary,
  },
  categoryTextActive: {
    color: Colors.textPrimary,
  },

  // Sort
  sortRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    marginTop: Spacing.sm,
  },
  resultCount: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
  },
  sortButtons: {
    flexDirection: "row",
    gap: 4,
  },
  sortBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  sortBtnActive: {
    backgroundColor: Colors.surfaceCard,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sortBtnText: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    fontWeight: "600",
  },
  sortBtnTextActive: {
    color: Colors.textPrimary,
  },

  // Reading cards
  listContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: 100,
    gap: 10,
  },
  readingCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surfaceCard,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 12,
  },
  cardLeft: {},
  cardIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  cardCenter: {
    flex: 1,
    gap: 4,
  },
  cardTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  cardTitle: {
    fontSize: FontSize.md,
    fontWeight: "700",
    color: Colors.textPrimary,
    flex: 1,
  },
  newBadge: {
    backgroundColor: Colors.secondary + "20",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.secondary + "40",
  },
  newBadgeText: {
    fontSize: 9,
    fontWeight: "800",
    color: Colors.secondary,
    letterSpacing: 0.5,
  },
  cardSubtitle: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    lineHeight: 16,
  },
  cardMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 2,
  },
  difficultyBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  difficultyText: {
    fontSize: 10,
    fontWeight: "700",
  },
  metaText: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
  },
  metaDot: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
  },
  progressBar: {
    height: 3,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 2,
    marginTop: 6,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 2,
  },
  cardRight: {
    alignItems: "center",
    justifyContent: "center",
    width: 30,
  },
  progressText: {
    fontSize: FontSize.xs,
    fontWeight: "700",
    color: Colors.secondary,
  },
});
