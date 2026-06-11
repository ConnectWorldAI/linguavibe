import React, { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, TextInput, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

const Colors = {
  primary: "#0A0E1A",
  surface: "#141825",
  secondary: "#00AAFF",
  textPrimary: "#FFFFFF",
  textSecondary: "#8A9BB0",
  textMuted: "#5A6A7A",
  border: "rgba(255,255,255,0.06)",
  gold: "#FFD700",
  success: "#00E676",
  glowSubtle: "rgba(0,170,255,0.08)",
  glowBorder: "rgba(0,170,255,0.2)",
};

const ALL_COURSES = [
  { id: "1", title: "Dominican Spanish: From Zero to Fluent", instructor: "Sophia Martinez", rating: 4.9, students: 2340, duration: "8 hrs", lessons: 42, level: "Beginner", category: "Business", thumb: "🇩🇴", price: "Free", certified: true },
  { id: "2", title: "Business Spanish for IT Professionals", instructor: "Sophia Martinez", rating: 4.8, students: 1890, duration: "4.5 hrs", lessons: 24, level: "Intermediate", category: "Business", thumb: "💼", price: "75 credits", certified: true },
  { id: "3", title: "Japanese for Anime Fans", instructor: "Yuki Tanaka", rating: 4.8, students: 1560, duration: "6 hrs", lessons: 30, level: "Beginner", category: "Culture & Media", thumb: "🇯🇵", price: "50 credits", certified: false },
  { id: "4", title: "Mandarin Business Communication", instructor: "Wei Chen", rating: 4.7, students: 890, duration: "7 hrs", lessons: 36, level: "Intermediate", category: "Business", thumb: "🇨🇳", price: "75 credits", certified: true },
  { id: "5", title: "French for Healthcare Professionals", instructor: "Marie Dubois", rating: 4.9, students: 3100, duration: "5.5 hrs", lessons: 28, level: "Advanced", category: "Certification", thumb: "🇫🇷", price: "100 credits", certified: true },
  { id: "6", title: "Spanish for Customer Service", instructor: "Carlos Reyes", rating: 4.7, students: 2100, duration: "3 hrs", lessons: 20, level: "Beginner", category: "Business", thumb: "📞", price: "Free", certified: false },
  { id: "7", title: "Korean K-Pop & Drama Vocab", instructor: "Min-Ji Park", rating: 4.9, students: 4200, duration: "4 hrs", lessons: 22, level: "Beginner", category: "Culture & Media", thumb: "🇰🇷", price: "50 credits", certified: false },
  { id: "8", title: "Portuguese for Travel in Brazil", instructor: "Ana Silva", rating: 4.6, students: 980, duration: "3.5 hrs", lessons: 18, level: "Beginner", category: "Travel", thumb: "🇧🇷", price: "Free", certified: false },
  { id: "9", title: "Arabic for Business Meetings", instructor: "Omar Hassan", rating: 4.8, students: 670, duration: "5 hrs", lessons: 26, level: "Intermediate", category: "Business", thumb: "🇸🇦", price: "75 credits", certified: true },
  { id: "10", title: "Italian Cooking Vocabulary", instructor: "Luca Romano", rating: 4.7, students: 1340, duration: "2.5 hrs", lessons: 14, level: "Beginner", category: "Culture & Media", thumb: "🇮🇹", price: "Free", certified: false },
  { id: "11", title: "German Technical Writing", instructor: "Hans Mueller", rating: 4.6, students: 560, duration: "6 hrs", lessons: 32, level: "Advanced", category: "Tech & IT", thumb: "🇩🇪", price: "100 credits", certified: true },
  { id: "12", title: "Hindi for Bollywood Fans", instructor: "Priya Sharma", rating: 4.8, students: 1780, duration: "3 hrs", lessons: 16, level: "Beginner", category: "Culture & Media", thumb: "🇮🇳", price: "Free", certified: false },
];

const CATEGORIES = ["All", "Business", "Travel", "Certification", "Conversation", "Culture & Media", "Tech & IT"];
const LEVELS = ["All Levels", "Beginner", "Intermediate", "Advanced"];
const DURATIONS = ["Any Duration", "< 3 hrs", "3-5 hrs", "5+ hrs"];

export default function CourseCatalogScreen() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedLevel, setSelectedLevel] = useState("All Levels");
  const [selectedDuration, setSelectedDuration] = useState("Any Duration");
  const [sortBy, setSortBy] = useState<"popular" | "rating" | "newest">("popular");

  const hasActiveFilters = selectedCategory !== "All" || selectedLevel !== "All Levels" || selectedDuration !== "Any Duration" || search.length > 0;

  const clearAllFilters = () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSearch("");
    setSelectedCategory("All");
    setSelectedLevel("All Levels");
    setSelectedDuration("Any Duration");
  };

  const parseDuration = (dur: string): number => {
    return parseFloat(dur.replace(/ hrs?/, ""));
  };

  const filtered = ALL_COURSES.filter((c) => {
    const matchSearch = c.title.toLowerCase().includes(search.toLowerCase()) ||
      c.instructor.toLowerCase().includes(search.toLowerCase());
    const matchCategory = selectedCategory === "All" || c.category === selectedCategory;
    const matchLevel = selectedLevel === "All Levels" || c.level === selectedLevel;
    let matchDuration = true;
    if (selectedDuration === "< 3 hrs") matchDuration = parseDuration(c.duration) < 3;
    else if (selectedDuration === "3-5 hrs") matchDuration = parseDuration(c.duration) >= 3 && parseDuration(c.duration) <= 5;
    else if (selectedDuration === "5+ hrs") matchDuration = parseDuration(c.duration) > 5;
    return matchSearch && matchCategory && matchLevel && matchDuration;
  }).sort((a, b) => {
    if (sortBy === "popular") return b.students - a.students;
    if (sortBy === "rating") return b.rating - a.rating;
    return 0;
  });

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Course Catalog</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Search */}
      <View style={styles.searchRow}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color={Colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search courses..."
            placeholderTextColor={Colors.textMuted}
            value={search}
            onChangeText={setSearch}
            returnKeyType="search"
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch("")}>
              <Ionicons name="close-circle" size={18} color={Colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Category Filter */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
        {CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat}
            style={[styles.filterChip, selectedCategory === cat && styles.filterChipActive]}
            onPress={() => {
              if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setSelectedCategory(cat);
            }}
          >
            <Text style={[styles.filterChipText, selectedCategory === cat && styles.filterChipTextActive]}>
              {cat}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Level Filter */}
      <View style={styles.secondFilter}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flex: 1 }}>
          {LEVELS.map((level) => (
            <TouchableOpacity
              key={level}
              style={[styles.levelChip, selectedLevel === level && styles.levelChipActive]}
              onPress={() => setSelectedLevel(level)}
            >
              <Text style={[styles.levelChipText, selectedLevel === level && styles.levelChipTextActive]}>
                {level}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Duration Filter */}
      <View style={styles.secondFilter}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flex: 1 }}>
          {DURATIONS.map((dur) => (
            <TouchableOpacity
              key={dur}
              style={[styles.levelChip, selectedDuration === dur && styles.levelChipActive]}
              onPress={() => setSelectedDuration(dur)}
            >
              <Text style={[styles.levelChipText, selectedDuration === dur && styles.levelChipTextActive]}>
                {dur}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Sort + Clear */}
      <View style={styles.sortRow}>
        <View style={styles.sortBtns}>
          {(["popular", "rating", "newest"] as const).map((s) => (
            <TouchableOpacity
              key={s}
              style={[styles.sortChip, sortBy === s && styles.sortChipActive]}
              onPress={() => setSortBy(s)}
            >
              <Text style={[styles.sortChipText, sortBy === s && styles.sortChipTextActive]}>
                {s === "popular" ? "Popular" : s === "rating" ? "Top Rated" : "Newest"}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        {hasActiveFilters && (
          <TouchableOpacity onPress={clearAllFilters} style={styles.clearBtn}>
            <Ionicons name="close" size={12} color={Colors.secondary} />
            <Text style={styles.clearBtnText}>Clear</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Results */}
      <ScrollView style={styles.results} showsVerticalScrollIndicator={false}>
        <Text style={styles.resultCount}>{filtered.length} courses found</Text>

        {filtered.map((course) => (
          <TouchableOpacity
            key={course.id}
            style={styles.courseCard}
            onPress={() => router.push("/course-detail" as any)}
            activeOpacity={0.8}
          >
            <View style={styles.courseThumb}>
              <Text style={{ fontSize: 28 }}>{course.thumb}</Text>
              {course.certified && (
                <View style={styles.certBadge}>
                  <Ionicons name="ribbon" size={8} color="#FFFFFF" />
                </View>
              )}
            </View>
            <View style={styles.courseBody}>
              <Text style={styles.courseTitle} numberOfLines={2}>{course.title}</Text>
              <Text style={styles.courseInstructor}>{course.instructor}</Text>
              <View style={styles.courseMeta}>
                <Ionicons name="star" size={11} color={Colors.gold} />
                <Text style={styles.courseRating}>{course.rating}</Text>
                <Text style={styles.courseDot}>•</Text>
                <Text style={styles.courseStudents}>{course.students.toLocaleString()}</Text>
                <Text style={styles.courseDot}>•</Text>
                <Text style={styles.courseDuration}>{course.duration}</Text>
              </View>
              <View style={styles.courseBottom}>
                <View style={styles.courseLevelBadge}>
                  <Text style={styles.courseLevelText}>{course.level}</Text>
                </View>
                <Text style={[styles.coursePrice, course.price === "Free" && { color: Colors.success }]}>
                  {course.price}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}

        {filtered.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="search-outline" size={48} color={Colors.textMuted} />
            <Text style={styles.emptyTitle}>No courses found</Text>
            <Text style={styles.emptySubtitle}>Try adjusting your search or filters</Text>
            <TouchableOpacity style={styles.emptyBtn} onPress={clearAllFilters}>
              <Text style={styles.emptyBtnText}>Clear All Filters</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.primary },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.surface, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 18, fontWeight: "800", color: Colors.textPrimary },
  searchRow: { paddingHorizontal: 16, marginBottom: 12 },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  searchInput: { flex: 1, fontSize: 15, color: Colors.textPrimary },
  filterRow: { paddingHorizontal: 16, marginBottom: 10, maxHeight: 40 },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    marginRight: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterChipActive: { backgroundColor: Colors.glowSubtle, borderColor: Colors.secondary },
  filterChipText: { fontSize: 13, fontWeight: "600", color: Colors.textMuted },
  filterChipTextActive: { color: Colors.secondary },
  secondFilter: { flexDirection: "row", paddingHorizontal: 16, marginBottom: 12 },
  levelChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    backgroundColor: "transparent",
  },
  levelChipActive: { backgroundColor: "rgba(255,255,255,0.05)" },
  levelChipText: { fontSize: 12, color: Colors.textMuted },
  levelChipTextActive: { color: Colors.textPrimary, fontWeight: "600" },
  sortRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  sortBtns: { flexDirection: "row", gap: 6 },
  sortChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  sortChipActive: { backgroundColor: Colors.secondary },
  sortChipText: { fontSize: 11, fontWeight: "600", color: Colors.textMuted },
  sortChipTextActive: { color: "#FFFFFF" },
  clearBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: Colors.glowSubtle,
    borderWidth: 1,
    borderColor: Colors.glowBorder,
  },
  clearBtnText: { fontSize: 11, fontWeight: "600", color: Colors.secondary },
  emptyState: { alignItems: "center", paddingTop: 60, paddingHorizontal: 40 },
  emptyTitle: { fontSize: 16, fontWeight: "700", color: Colors.textPrimary, marginTop: 12 },
  emptySubtitle: { fontSize: 13, color: Colors.textSecondary, textAlign: "center", marginTop: 6 },
  emptyBtn: { marginTop: 16, backgroundColor: Colors.secondary, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10 },
  emptyBtnText: { fontSize: 13, fontWeight: "700", color: "#FFFFFF" },
  results: { flex: 1, paddingHorizontal: 16 },
  resultCount: { fontSize: 13, color: Colors.textSecondary, marginBottom: 12 },
  courseCard: {
    flexDirection: "row",
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 12,
  },
  courseThumb: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: Colors.glowSubtle,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  certBadge: {
    position: "absolute",
    top: -3,
    right: -3,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: Colors.success,
    alignItems: "center",
    justifyContent: "center",
  },
  courseBody: { flex: 1, gap: 3 },
  courseTitle: { fontSize: 14, fontWeight: "700", color: Colors.textPrimary },
  courseInstructor: { fontSize: 12, color: Colors.textSecondary },
  courseMeta: { flexDirection: "row", alignItems: "center", gap: 4 },
  courseRating: { fontSize: 11, fontWeight: "700", color: Colors.gold },
  courseDot: { fontSize: 10, color: Colors.textMuted },
  courseStudents: { fontSize: 11, color: Colors.textSecondary },
  courseDuration: { fontSize: 11, color: Colors.textSecondary },
  courseBottom: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 4 },
  courseLevelBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, backgroundColor: "rgba(0,170,255,0.15)" },
  courseLevelText: { fontSize: 10, fontWeight: "700", color: Colors.secondary },
  coursePrice: { fontSize: 12, fontWeight: "800", color: Colors.gold },
});
