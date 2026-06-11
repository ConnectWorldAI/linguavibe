/**
 * Creator Directory — Browse all spotlight creators with language filtering.
 * Users can explore creators on demand rather than waiting for the weekly rotation.
 */
import React, { useState, useMemo, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  ScrollView,
  Platform,
  Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/use-colors";
import { getAllSpotlightCreators, SpotlightCreator } from "@/lib/creator-spotlight";
import { getOverallXP, type CreatorScoreSummary } from "@/lib/exercise-scoring";

export default function CreatorDirectoryScreen() {
  const colors = useColors();
  const router = useRouter();
  const allCreators = getAllSpotlightCreators();

  const [selectedLanguage, setSelectedLanguage] = useState<string>("All");
  const [creatorScores, setCreatorScores] = useState<Map<string, CreatorScoreSummary>>(new Map());

  useEffect(() => {
    getOverallXP().then((xp) => {
      const map = new Map<string, CreatorScoreSummary>();
      xp.creatorScores.forEach((cs) => map.set(cs.creatorId, cs));
      setCreatorScores(map);
    });
  }, []);

  // Extract unique languages from the roster
  const languages = useMemo(() => {
    const langs = new Set(allCreators.map((c) => c.language));
    return ["All", ...Array.from(langs).sort()];
  }, [allCreators]);

  // Filter creators by selected language
  const filteredCreators = useMemo(() => {
    if (selectedLanguage === "All") return allCreators;
    return allCreators.filter((c) => c.language === selectedLanguage);
  }, [allCreators, selectedLanguage]);

  const handleFilterPress = (lang: string) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setSelectedLanguage(lang);
  };

  const handleTryExercise = (creator: SpotlightCreator) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    router.push({ pathname: "/creator-exercise", params: { creatorId: creator.id } });
  };

  const handleVisitProfile = (creator: SpotlightCreator) => {
    if (creator.profileUrl) {
      Linking.openURL(creator.profileUrl);
    }
  };

  const renderCreatorCard = ({ item }: { item: SpotlightCreator }) => {
    const score = creatorScores.get(item.id);
    const mastery = score && score.maxPossiblePoints > 0
      ? Math.round((score.totalPoints / score.maxPossiblePoints) * 100)
      : null;

    return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      {/* Creator header */}
      <View style={styles.cardHeader}>
        <View style={[styles.avatar, { backgroundColor: colors.primary + "15" }]}>
          <Text style={styles.avatarEmoji}>{item.avatarEmoji}</Text>
        </View>
        <View style={styles.cardInfo}>
          <Text style={[styles.creatorName, { color: colors.foreground }]}>
            {item.name}
          </Text>
          <Text style={[styles.creatorHandle, { color: colors.muted }]}>
            {item.handle} • {item.followers}
          </Text>
        </View>
        {mastery !== null ? (
          <View style={[styles.masteryBadge, { backgroundColor: mastery >= 80 ? "#22C55E15" : mastery >= 50 ? "#F59E0B15" : "#6B728015" }]}>
            <Ionicons
              name={mastery >= 80 ? "trophy" : mastery >= 50 ? "star" : "flash"}
              size={14}
              color={mastery >= 80 ? "#22C55E" : mastery >= 50 ? "#F59E0B" : "#6B7280"}
            />
            <Text style={[styles.masteryText, { color: mastery >= 80 ? "#22C55E" : mastery >= 50 ? "#F59E0B" : "#6B7280" }]}>
              {mastery}%
            </Text>
          </View>
        ) : (
          <View style={[styles.langBadge, { backgroundColor: colors.primary + "12" }]}>
            <Text style={[styles.langBadgeText, { color: colors.primary }]}>
              {item.language}
            </Text>
          </View>
        )}
      </View>

      {/* Tagline */}
      <Text style={[styles.tagline, { color: colors.muted }]}>
        "{item.tagline}"
      </Text>

      {/* Teaching style */}
      <View style={[styles.styleRow, { backgroundColor: colors.background }]}>
        <Ionicons name="school-outline" size={14} color={colors.primary} />
        <Text style={[styles.styleText, { color: colors.foreground }]}>
          {item.teachingStyle}
        </Text>
      </View>

      {/* Platform & Region */}
      <View style={styles.metaRow}>
        <View style={styles.metaItem}>
          <Ionicons name="globe-outline" size={13} color={colors.muted} />
          <Text style={[styles.metaText, { color: colors.muted }]}>{item.platform}</Text>
        </View>
        <View style={styles.metaItem}>
          <Ionicons name="location-outline" size={13} color={colors.muted} />
          <Text style={[styles.metaText, { color: colors.muted }]}>{item.region}</Text>
        </View>
      </View>

      {/* Content highlights */}
      <View style={styles.highlightsRow}>
        {item.contentHighlights.slice(0, 3).map((h, i) => (
          <View key={i} style={[styles.highlightChip, { backgroundColor: colors.background, borderColor: colors.border }]}>
            <Text style={[styles.highlightText, { color: colors.foreground }]}>{h}</Text>
          </View>
        ))}
      </View>

      {/* Best Score indicator */}
      {score && (
        <View style={[styles.scoreRow, { backgroundColor: colors.background }]}>
          <Ionicons name="flash" size={13} color="#F59E0B" />
          <Text style={[styles.scoreText, { color: colors.foreground }]}>
            Best: {score.totalPoints}/{score.maxPossiblePoints} XP
          </Text>
          <Text style={[styles.scoreSessionText, { color: colors.muted }]}>
            • {score.sessionsCompleted} session{score.sessionsCompleted !== 1 ? "s" : ""}
          </Text>
        </View>
      )}

      {/* Actions */}
      <View style={styles.cardActions}>
        <Pressable
          onPress={() => handleTryExercise(item)}
          style={({ pressed }) => [
            styles.actionBtn,
            { backgroundColor: colors.success },
            pressed && { opacity: 0.8 },
          ]}
        >
          <Ionicons name="flash" size={14} color="#fff" />
          <Text style={styles.actionBtnText}>Try Exercise</Text>
        </Pressable>
        <Pressable
          onPress={() => handleVisitProfile(item)}
          style={({ pressed }) => [
            styles.actionBtn,
            { backgroundColor: colors.primary },
            pressed && { opacity: 0.8 },
          ]}
        >
          <Ionicons name="open-outline" size={14} color="#fff" />
          <Text style={styles.actionBtnText}>Visit Profile</Text>
        </Pressable>
      </View>
    </View>
  );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.5 }]}
        >
          <Ionicons name="arrow-back" size={22} color={colors.foreground} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>
            Creator Directory
          </Text>
          <Text style={[styles.headerSubtitle, { color: colors.muted }]}>
            {filteredCreators.length} creator{filteredCreators.length !== 1 ? "s" : ""}
          </Text>
        </View>
        <View style={styles.headerRight} />
      </View>

      {/* Language filter chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterRow}
      >
        {languages.map((lang) => (
          <Pressable
            key={lang}
            onPress={() => handleFilterPress(lang)}
            style={({ pressed }) => [
              styles.filterChip,
              {
                backgroundColor:
                  selectedLanguage === lang ? colors.primary : colors.surface,
                borderColor:
                  selectedLanguage === lang ? colors.primary : colors.border,
              },
              pressed && { opacity: 0.8 },
            ]}
          >
            <Text
              style={[
                styles.filterChipText,
                {
                  color: selectedLanguage === lang ? "#fff" : colors.foreground,
                },
              ]}
            >
              {lang}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* Creator list */}
      <FlatList
        data={filteredCreators}
        keyExtractor={(item) => item.id}
        renderItem={renderCreatorCard}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="search-outline" size={48} color={colors.muted} />
            <Text style={[styles.emptyText, { color: colors.muted }]}>
              No creators found for this language yet.
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtn: {
    padding: 4,
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  headerSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  headerRight: {
    width: 30,
  },
  filterRow: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: "600",
  },
  list: {
    padding: 16,
    gap: 16,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 12,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarEmoji: {
    fontSize: 22,
  },
  cardInfo: {
    flex: 1,
  },
  creatorName: {
    fontSize: 16,
    fontWeight: "700",
  },
  creatorHandle: {
    fontSize: 12,
    marginTop: 2,
  },
  langBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  langBadgeText: {
    fontSize: 11,
    fontWeight: "700",
  },
  tagline: {
    fontSize: 13,
    fontStyle: "italic",
  },
  styleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  styleText: {
    fontSize: 13,
    flex: 1,
  },
  metaRow: {
    flexDirection: "row",
    gap: 16,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  metaText: {
    fontSize: 11,
  },
  highlightsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  highlightChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  highlightText: {
    fontSize: 11,
  },
  cardActions: {
    flexDirection: "row",
    gap: 8,
    marginTop: 4,
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  actionBtnText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "600",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    gap: 12,
  },
  emptyText: {
    fontSize: 14,
    textAlign: "center",
  },
  masteryBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  masteryText: {
    fontSize: 12,
    fontWeight: "700",
  },
  scoreRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  scoreText: {
    fontSize: 12,
    fontWeight: "600",
  },
  scoreSessionText: {
    fontSize: 11,
  },
});
