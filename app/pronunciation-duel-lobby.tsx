import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { ScreenContainer } from "@/components/screen-container";
import { Colors, Spacing, BorderRadius, FontSize } from "@/constants/Colors";
import {
  type DuelGameMode,
  type DuelCategory,
  type DuelDifficulty,
  getModeInfo,
  getCategoryInfo,
  getDuelStats,
  getRandomOpponent,
  type DuelStats,
} from "@/lib/pronunciation-duel";
import {
  SUPPORTED_DUEL_LANGUAGES,
  type DuelLanguage,
  getLanguageWordCount,
} from "@/lib/word-banks";

const GAME_MODES: DuelGameMode[] = ["word_flash", "phrase_race", "tongue_twister"];
const CATEGORIES: DuelCategory[] = ["abcs", "numbers", "adjectives", "verbs_present", "verbs_past", "verbs_future", "mixed"];
const DIFFICULTIES: { key: DuelDifficulty; label: string; icon: string; color: string }[] = [
  { key: "easy", label: "Casual", icon: "happy", color: Colors.success },
  { key: "medium", label: "Competitive", icon: "flash", color: Colors.gold },
  { key: "hard", label: "Intense", icon: "flame", color: Colors.accent },
];

export default function PronunciationDuelLobbyScreen() {
  const router = useRouter();
  const [selectedMode, setSelectedMode] = useState<DuelGameMode>("word_flash");
  const [selectedCategory, setSelectedCategory] = useState<DuelCategory>("mixed");
  const [selectedDifficulty, setSelectedDifficulty] = useState<DuelDifficulty>("medium");
  const [selectedLanguage, setSelectedLanguage] = useState<DuelLanguage>("Spanish");
  const [stats, setStats] = useState<DuelStats | null>(null);

  useEffect(() => {
    getDuelStats().then(setStats);
  }, []);

  const handleStartDuel = () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const opponent = getRandomOpponent();
    router.push({
      pathname: "/pronunciation-duel" as any,
      params: {
        mode: selectedMode,
        category: selectedCategory,
        difficulty: selectedDifficulty,
        language: selectedLanguage,
        opponent,
      },
    });
  };

  const modeInfo = getModeInfo(selectedMode);

  return (
    <ScreenContainer>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Pronunciation Duel</Text>
          <TouchableOpacity
            onPress={() => router.push("/duel-leaderboard-language" as any)}
            style={styles.historyBtn}
          >
            <Ionicons name="trophy" size={20} color={Colors.gold} />
          </TouchableOpacity>
        </View>

        {/* Stats Banner */}
        {stats && stats.totalDuels > 0 && (
          <View style={styles.statsBanner}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats.wins}</Text>
              <Text style={styles.statLabel}>Wins</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats.bestWinStreak}</Text>
              <Text style={styles.statLabel}>Best Streak</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats.averageScore}%</Text>
              <Text style={styles.statLabel}>Avg Score</Text>
            </View>
          </View>
        )}

        {/* Language Selection */}
        <Text style={styles.sectionTitle}>Language</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.languageScroll}>
          {SUPPORTED_DUEL_LANGUAGES.map((lang) => {
            const isSelected = selectedLanguage === lang.id;
            const wordCount = getLanguageWordCount(lang.id);
            return (
              <TouchableOpacity
                key={lang.id}
                style={[
                  styles.languageChip,
                  isSelected && { backgroundColor: Colors.primary + "20", borderColor: Colors.primary },
                ]}
                onPress={() => {
                  setSelectedLanguage(lang.id);
                  if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.languageFlag}>{lang.flag}</Text>
                <View>
                  <Text style={[styles.languageName, isSelected && { color: Colors.primary }]}>
                    {lang.label}
                  </Text>
                  <Text style={styles.languageWordCount}>{wordCount} words</Text>
                </View>
                {isSelected && (
                  <Ionicons name="checkmark-circle" size={18} color={Colors.primary} />
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Game Mode Selection */}
        <Text style={styles.sectionTitle}>Choose Your Battle</Text>
        <View style={styles.modeGrid}>
          {GAME_MODES.map((mode) => {
            const info = getModeInfo(mode);
            const isSelected = selectedMode === mode;
            return (
              <TouchableOpacity
                key={mode}
                style={[
                  styles.modeCard,
                  isSelected && { borderColor: info.color, borderWidth: 2 },
                ]}
                onPress={() => {
                  setSelectedMode(mode);
                  if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
                activeOpacity={0.7}
              >
                <View style={[styles.modeIconWrap, { backgroundColor: info.color + "20" }]}>
                  <Ionicons name={info.icon as any} size={28} color={info.color} />
                </View>
                <Text style={styles.modeTitle}>{info.title}</Text>
                <Text style={styles.modeDesc}>{info.description}</Text>
                {isSelected && (
                  <View style={[styles.selectedBadge, { backgroundColor: info.color }]}>
                    <Ionicons name="checkmark" size={12} color="#fff" />
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Category Selection */}
        {selectedMode !== "tongue_twister" && (
          <>
            <Text style={styles.sectionTitle}>Category</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
              {CATEGORIES.map((cat) => {
                const info = getCategoryInfo(cat);
                const isSelected = selectedCategory === cat;
                return (
                  <TouchableOpacity
                    key={cat}
                    style={[
                      styles.categoryChip,
                      isSelected && { backgroundColor: info.color + "25", borderColor: info.color },
                    ]}
                    onPress={() => {
                      setSelectedCategory(cat);
                      if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }}
                    activeOpacity={0.7}
                  >
                    <Ionicons name={info.icon as any} size={16} color={isSelected ? info.color : Colors.textMuted} />
                    <Text style={[styles.categoryText, isSelected && { color: info.color }]}>
                      {info.title}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </>
        )}

        {/* Difficulty Selection */}
        <Text style={styles.sectionTitle}>Difficulty</Text>
        <View style={styles.difficultyRow}>
          {DIFFICULTIES.map((diff) => {
            const isSelected = selectedDifficulty === diff.key;
            return (
              <TouchableOpacity
                key={diff.key}
                style={[
                  styles.difficultyCard,
                  isSelected && { borderColor: diff.color, backgroundColor: diff.color + "15" },
                ]}
                onPress={() => {
                  setSelectedDifficulty(diff.key);
                  if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
                activeOpacity={0.7}
              >
                <Ionicons name={diff.icon as any} size={22} color={isSelected ? diff.color : Colors.textMuted} />
                <Text style={[styles.difficultyText, isSelected && { color: diff.color }]}>
                  {diff.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Start Button */}
        <TouchableOpacity
          style={[styles.startBtn, { backgroundColor: modeInfo.color }]}
          onPress={handleStartDuel}
          activeOpacity={0.8}
        >
          <Ionicons name="mic" size={22} color="#fff" />
          <Text style={styles.startBtnText}>Start Duel</Text>
        </TouchableOpacity>

        {/* Adaptive Practice */}
        <TouchableOpacity
          style={[styles.startBtn, { backgroundColor: "#E040FB", marginTop: 10 }]}
          onPress={() => {
            if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            const opponent = getRandomOpponent();
            router.push({
              pathname: "/pronunciation-duel" as any,
              params: {
                mode: selectedMode,
                category: selectedCategory,
                difficulty: selectedDifficulty,
                language: selectedLanguage,
                opponent,
                adaptive: "true",
              },
            });
          }}
          activeOpacity={0.8}
        >
          <Ionicons name="fitness" size={22} color="#fff" />
          <Text style={styles.startBtnText}>Adaptive Practice</Text>
        </TouchableOpacity>

        {/* Challenge Friend */}
        <TouchableOpacity
          style={styles.challengeFriendBtn}
          onPress={() => {
            if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.push({
              pathname: "/duel-multiplayer" as any,
              params: {
                mode: selectedMode,
                category: selectedCategory,
                difficulty: selectedDifficulty,
                language: selectedLanguage,
                playerName: "Player",
              },
            });
          }}
          activeOpacity={0.7}
        >
          <Ionicons name="people" size={18} color={Colors.secondary} />
          <Text style={styles.challengeFriendText}>Challenge a Friend</Text>
        </TouchableOpacity>

        {/* Quick Links Row */}
        <View style={styles.quickLinksRow}>
          <TouchableOpacity
            style={styles.quickLinkBtn}
            onPress={() => router.push("/daily-duel-challenge" as any)}
          >
            <Ionicons name="today" size={18} color="#FFD700" />
            <Text style={styles.quickLinkText}>Daily Challenge</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.quickLinkBtn}
            onPress={() => router.push("/pronunciation-heatmap" as any)}
          >
            <Ionicons name="analytics" size={18} color={Colors.success} />
            <Text style={styles.quickLinkText}>My Heatmap</Text>
          </TouchableOpacity>
        </View>
        <View style={[styles.quickLinksRow, { marginTop: 8 }]}>
          <TouchableOpacity
            style={styles.quickLinkBtn}
            onPress={() => router.push("/pronunciation-accuracy-leaderboard" as any)}
          >
            <Ionicons name="podium" size={18} color={Colors.secondary} />
            <Text style={styles.quickLinkText}>Rankings</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingBottom: 40 },
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
    backgroundColor: Colors.surfaceCard,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: { fontSize: FontSize.xl, fontWeight: "700", color: Colors.textPrimary },
  historyBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.goldGlow,
    alignItems: "center",
    justifyContent: "center",
  },
  statsBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    marginHorizontal: 16,
    marginBottom: 20,
    padding: 16,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.surfaceCard,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statItem: { alignItems: "center" },
  statValue: { fontSize: FontSize.xl, fontWeight: "800", color: Colors.textPrimary },
  statLabel: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 2 },
  statDivider: { width: 1, height: 30, backgroundColor: Colors.border },
  sectionTitle: {
    fontSize: FontSize.md,
    fontWeight: "700",
    color: Colors.textPrimary,
    paddingHorizontal: 16,
    marginTop: 20,
    marginBottom: 12,
  },
  modeGrid: { paddingHorizontal: 16, gap: 12 },
  modeCard: {
    padding: 16,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.surfaceCard,
    borderWidth: 1,
    borderColor: Colors.border,
    position: "relative",
  },
  modeIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  modeTitle: { fontSize: FontSize.lg, fontWeight: "700", color: Colors.textPrimary },
  modeDesc: { fontSize: FontSize.sm, color: Colors.textMuted, marginTop: 4 },
  selectedBadge: {
    position: "absolute",
    top: 12,
    right: 12,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  languageScroll: { paddingLeft: 16, marginBottom: 8 },
  languageChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.surfaceCard,
    borderWidth: 1,
    borderColor: Colors.border,
    marginRight: 10,
    minWidth: 130,
  },
  languageFlag: { fontSize: 24 },
  languageName: { fontSize: FontSize.sm, fontWeight: "700", color: Colors.textPrimary },
  languageWordCount: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 1 },
  categoryScroll: { paddingLeft: 16, marginBottom: 8 },
  categoryChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: Colors.surfaceCard,
    borderWidth: 1,
    borderColor: Colors.border,
    marginRight: 8,
  },
  categoryText: { fontSize: FontSize.sm, fontWeight: "600", color: Colors.textMuted },
  difficultyRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    gap: 10,
  },
  difficultyCard: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 14,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surfaceCard,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 6,
  },
  difficultyText: { fontSize: FontSize.sm, fontWeight: "600", color: Colors.textMuted },
  startBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    marginHorizontal: 16,
    marginTop: 28,
    paddingVertical: 16,
    borderRadius: BorderRadius.lg,
  },
  startBtnText: { fontSize: FontSize.lg, fontWeight: "700", color: "#fff" },
  challengeFriendBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginHorizontal: 16,
    marginTop: 12,
    paddingVertical: 14,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.secondary + "15",
    borderWidth: 1,
    borderColor: Colors.secondary + "40",
  },
  challengeFriendText: { fontSize: FontSize.md, fontWeight: "600", color: Colors.secondary },
  quickLinksRow: {
    flexDirection: "row",
    gap: 10,
    marginHorizontal: 16,
    marginTop: 16,
  },
  quickLinkBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.surfaceCard,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
  },
  quickLinkText: {
    fontSize: FontSize.sm,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
});
