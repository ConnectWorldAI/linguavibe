import React, { useState, useEffect, useCallback } from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import AsyncStorage from "@react-native-async-storage/async-storage";

const Colors = {
  primary: "#0A0E1A",
  surface: "#141825",
  surfaceElevated: "#1C2235",
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

interface SavedLesson {
  lessonId: string;
  lessonTitle: string;
  courseName: string;
  savedAt: number;
}

export default function SavedLessonsScreen() {
  const router = useRouter();
  const [bookmarks, setBookmarks] = useState<SavedLesson[]>([]);
  const [loading, setLoading] = useState(true);

  const loadBookmarks = async () => {
    const saved = await AsyncStorage.getItem("saved_lessons");
    if (saved) {
      const parsed: SavedLesson[] = JSON.parse(saved);
      // Sort by most recently saved
      parsed.sort((a, b) => b.savedAt - a.savedAt);
      setBookmarks(parsed);
    } else {
      setBookmarks([]);
    }
    setLoading(false);
  };

  useFocusEffect(
    useCallback(() => {
      loadBookmarks();
    }, [])
  );

  const handleRemoveBookmark = async (lessonId: string) => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const filtered = bookmarks.filter((b) => b.lessonId !== lessonId);
    setBookmarks(filtered);
    await AsyncStorage.setItem("saved_lessons", JSON.stringify(filtered));
    await AsyncStorage.removeItem(`lesson_bookmarked_${lessonId}`);
  };

  const handleNavigate = (item: SavedLesson) => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({
      pathname: "/lesson-player",
      params: { lessonId: item.lessonId, lessonTitle: item.lessonTitle, courseName: item.courseName },
    });
  };

  const formatDate = (timestamp: number) => {
    const d = new Date(timestamp);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  const renderItem = ({ item }: { item: SavedLesson }) => (
    <TouchableOpacity style={styles.card} activeOpacity={0.7} onPress={() => handleNavigate(item)}>
      <View style={styles.cardIcon}>
        <Ionicons name="bookmark" size={20} color={Colors.gold} />
      </View>
      <View style={styles.cardContent}>
        <Text style={styles.cardTitle} numberOfLines={1}>{item.lessonTitle}</Text>
        <Text style={styles.cardSubtitle} numberOfLines={1}>{item.courseName}</Text>
        <Text style={styles.cardDate}>Saved {formatDate(item.savedAt)}</Text>
      </View>
      <View style={styles.cardActions}>
        <TouchableOpacity
          style={styles.removeBtn}
          onPress={() => handleRemoveBookmark(item.lessonId)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="close-circle" size={20} color={Colors.textMuted} />
        </TouchableOpacity>
        <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Saved Lessons</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Stats */}
      {bookmarks.length > 0 && (
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Ionicons name="bookmark" size={14} color={Colors.gold} />
            <Text style={styles.statText}>{bookmarks.length} saved</Text>
          </View>
          <View style={styles.statItem}>
            <Ionicons name="library" size={14} color={Colors.secondary} />
            <Text style={styles.statText}>
              {new Set(bookmarks.map((b) => b.courseName)).size} courses
            </Text>
          </View>
        </View>
      )}

      {/* List */}
      <FlatList
        data={bookmarks}
        keyExtractor={(item) => item.lessonId}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyState}>
              <Ionicons name="bookmark-outline" size={56} color={Colors.textMuted} />
              <Text style={styles.emptyTitle}>No Saved Lessons</Text>
              <Text style={styles.emptySubtitle}>
                Tap the bookmark icon on any lesson to save it here for quick access
              </Text>
              <TouchableOpacity
                style={styles.emptyBtn}
                onPress={() => router.push("/course-catalog" as any)}
                activeOpacity={0.8}
              >
                <Text style={styles.emptyBtnText}>Browse Courses</Text>
              </TouchableOpacity>
            </View>
          ) : null
        }
      />
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
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: { fontSize: 18, fontWeight: "800", color: Colors.textPrimary },
  statsRow: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingBottom: 12,
    gap: 16,
  },
  statItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  statText: { fontSize: 13, fontWeight: "600", color: Colors.textSecondary },
  listContent: { paddingHorizontal: 16, paddingBottom: 100 },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: "rgba(255,215,0,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  cardContent: { flex: 1, marginLeft: 12 },
  cardTitle: { fontSize: 14, fontWeight: "700", color: Colors.textPrimary },
  cardSubtitle: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  cardDate: { fontSize: 11, color: Colors.textMuted, marginTop: 4 },
  cardActions: { flexDirection: "row", alignItems: "center", gap: 8 },
  removeBtn: { padding: 4 },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 80,
    paddingHorizontal: 40,
  },
  emptyTitle: { fontSize: 18, fontWeight: "700", color: Colors.textPrimary, marginTop: 16 },
  emptySubtitle: { fontSize: 14, color: Colors.textSecondary, textAlign: "center", marginTop: 8, lineHeight: 20 },
  emptyBtn: {
    marginTop: 24,
    backgroundColor: Colors.secondary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  emptyBtnText: { fontSize: 14, fontWeight: "700", color: "#FFFFFF" },
});
