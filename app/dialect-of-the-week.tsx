import { useEffect, useState, useCallback } from "react";
import { Text, View, ScrollView, FlatList, Pressable, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Speech from "expo-speech";
import * as Haptics from "expo-haptics";
import { Platform } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import {
  getCurrentDialectOfTheWeek,
  recordDialectOfTheWeekView,
  type DialectOfTheWeek,
} from "@/lib/dialect-of-the-week";

export default function DialectOfTheWeekScreen() {
  const colors = useColors();
  const router = useRouter();
  const [dialect, setDialect] = useState<DialectOfTheWeek | null>(null);
  const [speakingWord, setSpeakingWord] = useState<string | null>(null);

  useEffect(() => {
    const dotw = getCurrentDialectOfTheWeek();
    setDialect(dotw);
    recordDialectOfTheWeekView(dotw);
  }, []);

  const speakWord = useCallback((word: string, langCode: string) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setSpeakingWord(word);
    Speech.speak(word, {
      language: langCode,
      onDone: () => setSpeakingWord(null),
      onError: () => setSpeakingWord(null),
    });
  }, []);

  const startQuiz = useCallback(() => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    if (dialect) {
      router.push({
        pathname: "/dialect-quiz" as any,
        params: { preselectedDialect: dialect.dialectCode },
      });
    }
  }, [dialect, router]);

  const openDialectMap = useCallback(() => {
    router.push("/dialect-map" as any);
  }, [router]);

  if (!dialect) {
    return (
      <ScreenContainer className="p-6">
        <View className="flex-1 items-center justify-center">
          <Text className="text-muted text-base">Loading...</Text>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer className="p-0">
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: colors.primary + "15" }]}>
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.6 }]}
          >
            <Ionicons name="chevron-back" size={24} color={colors.foreground} />
          </Pressable>
          <View style={styles.headerContent}>
            <Text style={[styles.weekLabel, { color: colors.muted }]}>
              Week {dialect.weekNumber}, {dialect.year}
            </Text>
            <Text style={[styles.title, { color: colors.foreground }]}>
              Dialect of the Week
            </Text>
            <View style={styles.dialectBadge}>
              <Text style={styles.dialectFlag}>{dialect.dialectFlag}</Text>
              <Text style={[styles.dialectName, { color: colors.primary }]}>
                {dialect.dialectName} {dialect.languageName}
              </Text>
            </View>
          </View>
          <Pressable
            onPress={openDialectMap}
            style={({ pressed }) => [styles.mapBtn, pressed && { opacity: 0.6 }]}
          >
            <Ionicons name="map-outline" size={22} color={colors.primary} />
          </Pressable>
        </View>

        {/* Cultural Fact */}
        <View style={[styles.section, { marginHorizontal: 16 }]}>
          <View style={[styles.factCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.factHeader}>
              <Ionicons name="bulb-outline" size={20} color={colors.warning} />
              <Text style={[styles.factTitle, { color: colors.foreground }]}>Cultural Insight</Text>
            </View>
            <Text style={[styles.factText, { color: colors.muted }]}>
              {dialect.culturalFact}
            </Text>
          </View>
        </View>

        {/* Featured Slang */}
        <View style={[styles.section, { marginHorizontal: 16 }]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            Featured Slang This Week
          </Text>
          {dialect.featuredSlang.map((slang, index) => (
            <View
              key={index}
              style={[styles.slangCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
            >
              <View style={styles.slangHeader}>
                <Text style={[styles.slangWord, { color: colors.foreground }]}>
                  {slang.word}
                </Text>
                <Pressable
                  onPress={() => speakWord(slang.word, dialect.languageCode)}
                  style={({ pressed }) => [
                    styles.speakBtn,
                    { backgroundColor: colors.primary + "20" },
                    pressed && { opacity: 0.6 },
                  ]}
                >
                  <Ionicons
                    name={speakingWord === slang.word ? "volume-high" : "volume-medium-outline"}
                    size={18}
                    color={colors.primary}
                  />
                </Pressable>
              </View>
              <Text style={[styles.slangMeaning, { color: colors.muted }]}>
                {slang.meaning}
              </Text>
              {slang.example && (
                <Text style={[styles.slangExample, { color: colors.muted }]}>
                  "{slang.example}"
                </Text>
              )}
              {slang.category && (
                <View style={[styles.categoryBadge, { backgroundColor: colors.primary + "15" }]}>
                  <Text style={[styles.categoryText, { color: colors.primary }]}>
                    {slang.category}
                  </Text>
                </View>
              )}
            </View>
          ))}
        </View>

        {/* Quiz Challenge */}
        <View style={[styles.section, { marginHorizontal: 16 }]}>
          <View style={[styles.quizCard, { backgroundColor: colors.primary + "10", borderColor: colors.primary + "30" }]}>
            <View style={styles.quizHeader}>
              <Ionicons name="trophy-outline" size={22} color={colors.primary} />
              <Text style={[styles.quizTitle, { color: colors.foreground }]}>Weekly Challenge</Text>
            </View>
            <Text style={[styles.quizText, { color: colors.muted }]}>
              {dialect.quizChallenge}
            </Text>
            <Pressable
              onPress={startQuiz}
              style={({ pressed }) => [
                styles.quizBtn,
                { backgroundColor: colors.primary },
                pressed && { opacity: 0.8, transform: [{ scale: 0.97 }] },
              ]}
            >
              <Ionicons name="play" size={18} color="#fff" />
              <Text style={styles.quizBtnText}>Start Dialect Quiz</Text>
            </Pressable>
          </View>
        </View>

        {/* Explore More */}
        <View style={[styles.section, { marginHorizontal: 16 }]}>
          <Pressable
            onPress={openDialectMap}
            style={({ pressed }) => [
              styles.exploreCard,
              { backgroundColor: colors.surface, borderColor: colors.border },
              pressed && { opacity: 0.8 },
            ]}
          >
            <Ionicons name="globe-outline" size={24} color={colors.primary} />
            <View style={styles.exploreText}>
              <Text style={[styles.exploreTitle, { color: colors.foreground }]}>
                Explore All Dialects
              </Text>
              <Text style={[styles.exploreSubtitle, { color: colors.muted }]}>
                Tap regions on the map to discover more
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.muted} />
          </Pressable>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingTop: 8,
    paddingBottom: 20,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "flex-start",
  },
  backBtn: {
    padding: 8,
    marginTop: 4,
  },
  headerContent: {
    flex: 1,
    alignItems: "center",
    paddingTop: 8,
  },
  mapBtn: {
    padding: 8,
    marginTop: 4,
  },
  weekLabel: {
    fontSize: 13,
    fontWeight: "500",
    marginBottom: 4,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 8,
  },
  dialectBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  dialectFlag: {
    fontSize: 24,
  },
  dialectName: {
    fontSize: 16,
    fontWeight: "600",
  },
  section: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "600",
    marginBottom: 12,
  },
  factCard: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
  },
  factHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  factTitle: {
    fontSize: 15,
    fontWeight: "600",
  },
  factText: {
    fontSize: 14,
    lineHeight: 21,
  },
  slangCard: {
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    marginBottom: 10,
  },
  slangHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  slangWord: {
    fontSize: 18,
    fontWeight: "700",
  },
  speakBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  slangMeaning: {
    fontSize: 14,
    marginTop: 4,
  },
  slangExample: {
    fontSize: 13,
    fontStyle: "italic",
    marginTop: 6,
  },
  categoryBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    marginTop: 8,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: "600",
  },
  quizCard: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
  },
  quizHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  quizTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  quizText: {
    fontSize: 14,
    lineHeight: 21,
    marginBottom: 14,
  },
  quizBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    borderRadius: 10,
  },
  quizBtnText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
  },
  exploreCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
  },
  exploreText: {
    flex: 1,
  },
  exploreTitle: {
    fontSize: 15,
    fontWeight: "600",
  },
  exploreSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
});
