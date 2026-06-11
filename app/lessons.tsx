import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Colors, Spacing, BorderRadius, FontSize } from "../constants/Colors";
import { useI18n } from "@/lib/i18n";

const LESSON_CATEGORIES = [
  {
    id: "1",
    title: "Dominican Spanish",
    flag: "🇩🇴",
    lessons: 24,
    progress: 35,
    color: Colors.secondary,
  },
  {
    id: "2",
    title: "Venezuelan Spanish",
    flag: "🇻🇪",
    lessons: 20,
    progress: 15,
    color: Colors.accent,
  },
  {
    id: "3",
    title: "Colombian Spanish",
    flag: "🇨🇴",
    lessons: 22,
    progress: 50,
    color: Colors.success,
  },
  {
    id: "4",
    title: "Standard French",
    flag: "🇫🇷",
    lessons: 30,
    progress: 10,
    color: Colors.warning,
  },
  {
    id: "5",
    title: "Brazilian Portuguese",
    flag: "🇧🇷",
    lessons: 18,
    progress: 0,
    color: "#A855F7",
  },
];

export default function LessonsScreen() {
  const { t } = useI18n();
  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t.lessons}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.subtitle}>
          Structured lessons for every language and dialect
        </Text>

        {/* Lesson Categories */}
        {LESSON_CATEGORIES.map((category) => (
          <TouchableOpacity
            key={category.id}
            style={styles.categoryCard}
            activeOpacity={0.7}
            onPress={() => router.push("/lesson-detail" as any)}
          >
            <View style={styles.categoryHeader}>
              <Text style={styles.categoryFlag}>{category.flag}</Text>
              <View style={styles.categoryInfo}>
                <Text style={styles.categoryTitle}>{category.title}</Text>
                <Text style={styles.categoryMeta}>
                  {category.lessons} {t.lessons.toLowerCase()}
                </Text>
              </View>
              <View style={[styles.progressCircle, { borderColor: category.color }]}>
                <Text style={[styles.progressText, { color: category.color }]}>
                  {category.progress}%
                </Text>
              </View>
            </View>
            <View style={styles.progressBarContainer}>
              <View
                style={[
                  styles.progressBar,
                  { width: `${category.progress}%`, backgroundColor: category.color },
                ]}
              />
            </View>
          </TouchableOpacity>
        ))}

        <View style={{ height: 40 }} />
      </ScrollView>
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
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surfaceCard,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: FontSize.lg,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
  },
  subtitle: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.lg,
  },
  categoryCard: {
    backgroundColor: Colors.surfaceCard,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  categoryHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: Spacing.md,
  },
  categoryFlag: {
    fontSize: 32,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryTitle: {
    fontSize: FontSize.md,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  categoryMeta: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  progressCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  progressText: {
    fontSize: FontSize.xs,
    fontWeight: "700",
  },
  progressBarContainer: {
    height: 6,
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 3,
    overflow: "hidden",
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
  },
});
