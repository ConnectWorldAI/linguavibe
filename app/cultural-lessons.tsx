import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  StyleSheet,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as Speech from "expo-speech";
import * as Sharing from "expo-sharing";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { createVanillaClient } from "@/lib/trpc";

const STORAGE_KEY = "@cultural_lessons_history";
const FAVORITES_KEY = "@cultural_lessons_favorites";

type TopicCategory = "slang" | "food" | "music" | "traditions" | "identity" | "random";

interface VocabWord {
  word: string;
  pronunciation: string;
  meaning: string;
  usage: string;
  culturalNote: string;
}

interface ContentBlock {
  type: "intro" | "cultural_story" | "vocab_spotlight" | "heritage_connection" | "challenge";
  text?: string;
  words?: VocabWord[];
  prompt?: string;
}

interface CulturalLesson {
  title: string;
  subtitle: string;
  category: string;
  culturalRegion: string;
  regionFlag: string;
  content: ContentBlock[];
  tags: string[];
  difficulty: string;
}

const TOPIC_OPTIONS: { key: TopicCategory; label: string; icon: string }[] = [
  { key: "random", label: "Surprise Me", icon: "sparkles" },
  { key: "slang", label: "Slang", icon: "chatbubble-ellipses" },
  { key: "food", label: "Food", icon: "restaurant" },
  { key: "music", label: "Music", icon: "musical-notes" },
  { key: "traditions", label: "Traditions", icon: "flame" },
  { key: "identity", label: "Identity", icon: "heart" },
];

export default function CulturalLessonsScreen() {
  const router = useRouter();
  const colors = useColors();
  const [loading, setLoading] = useState(false);
  const [lesson, setLesson] = useState<CulturalLesson | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<TopicCategory>("random");
  const [previousTopics, setPreviousTopics] = useState<string[]>([]);
  const [isFavorited, setIsFavorited] = useState(false);
  const [speakingWord, setSpeakingWord] = useState<string | null>(null);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) {
        const history = JSON.parse(raw) as string[];
        setPreviousTopics(history);
      }
    } catch {}
  };

  const generateLesson = async (topic: TopicCategory) => {
    setLoading(true);
    setLesson(null);
    setIsFavorited(false);
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const [targetLang, nativeLang, dialect, level] = await Promise.all([
        AsyncStorage.getItem("@target_language"),
        AsyncStorage.getItem("@native_language"),
        AsyncStorage.getItem("@target_dialect"),
        AsyncStorage.getItem("@proficiency_level"),
      ]);

      const client = createVanillaClient();
      const result = await (client as any).waveCloudChat.generateCulturalLesson.mutate({
        targetLanguage: targetLang || "Spanish",
        nativeLanguage: nativeLang || "English",
        dialect: dialect || undefined,
        topic,
        proficiencyLevel: level || "A2",
        previousTopics,
      });

      if (result.success && result.lesson) {
        setLesson(result.lesson);
        // Save to history
        const newHistory = [...previousTopics, result.lesson.title].slice(-20);
        setPreviousTopics(newHistory);
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newHistory));
      }
    } catch (err) {
      console.warn("Failed to generate cultural lesson:", err);
    } finally {
      setLoading(false);
    }
  };

  const toggleFavorite = async () => {
    if (!lesson) return;
    if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setIsFavorited(!isFavorited);

    try {
      const raw = await AsyncStorage.getItem(FAVORITES_KEY);
      const favorites: CulturalLesson[] = raw ? JSON.parse(raw) : [];
      if (isFavorited) {
        const filtered = favorites.filter((f) => f.title !== lesson.title);
        await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(filtered));
      } else {
        favorites.unshift(lesson);
        await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites.slice(0, 50)));
      }
    } catch {}
  };

  const speakWord = (word: string, lang: string) => {
    setSpeakingWord(word);
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const langCode = lang.toLowerCase().includes("spanish") ? "es" : lang.toLowerCase().includes("french") ? "fr" : lang.toLowerCase().includes("portuguese") ? "pt" : "es";
    Speech.speak(word, {
      language: langCode,
      rate: 0.8,
      onDone: () => setSpeakingWord(null),
      onError: () => setSpeakingWord(null),
    });
  };

  const renderContentBlock = (block: ContentBlock, idx: number) => {
    switch (block.type) {
      case "intro":
        return (
          <View key={idx} style={[styles.blockCard, { backgroundColor: colors.primary + "10" }]}>
            <Text style={[styles.blockText, { color: colors.foreground }]}>{block.text}</Text>
          </View>
        );
      case "cultural_story":
        return (
          <View key={idx} style={[styles.blockCard, { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 }]}>
            <View style={styles.blockHeader}>
              <Ionicons name="book-outline" size={16} color={colors.primary} />
              <Text style={[styles.blockLabel, { color: colors.primary }]}>Cultural Story</Text>
            </View>
            <Text style={[styles.blockText, { color: colors.foreground }]}>{block.text}</Text>
          </View>
        );
      case "vocab_spotlight":
        return (
          <View key={idx} style={styles.vocabSection}>
            <View style={styles.blockHeader}>
              <Ionicons name="bulb-outline" size={16} color="#F59E0B" />
              <Text style={[styles.blockLabel, { color: "#F59E0B" }]}>Vocab Spotlight</Text>
            </View>
            {block.words?.map((word, i) => (
              <View key={i} style={[styles.vocabCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <View style={styles.vocabHeader}>
                  <Text style={[styles.vocabWord, { color: colors.foreground }]}>{word.word}</Text>
                  <TouchableOpacity
                    onPress={() => speakWord(word.word, "Spanish")}
                    style={[styles.speakBtn, { backgroundColor: colors.primary + "20" }]}
                  >
                    <Ionicons
                      name={speakingWord === word.word ? "volume-high" : "volume-medium"}
                      size={16}
                      color={colors.primary}
                    />
                  </TouchableOpacity>
                </View>
                <Text style={[styles.vocabPronunciation, { color: colors.muted }]}>/{word.pronunciation}/</Text>
                <Text style={[styles.vocabMeaning, { color: colors.foreground }]}>{word.meaning}</Text>
                <Text style={[styles.vocabUsage, { color: colors.muted }]}>"{word.usage}"</Text>
                {word.culturalNote && (
                  <View style={[styles.culturalNote, { backgroundColor: colors.primary + "08" }]}>
                    <Ionicons name="information-circle" size={12} color={colors.primary} />
                    <Text style={[styles.culturalNoteText, { color: colors.primary }]}>{word.culturalNote}</Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        );
      case "heritage_connection":
        return (
          <View key={idx} style={[styles.blockCard, { backgroundColor: "#F59E0B" + "10" }]}>
            <View style={styles.blockHeader}>
              <Ionicons name="heart" size={16} color="#F59E0B" />
              <Text style={[styles.blockLabel, { color: "#F59E0B" }]}>Heritage Connection</Text>
            </View>
            <Text style={[styles.blockText, { color: colors.foreground, fontStyle: "italic" }]}>{block.text}</Text>
          </View>
        );
      case "challenge":
        return (
          <View key={idx} style={[styles.blockCard, { backgroundColor: colors.success + "10", borderColor: colors.success, borderWidth: 1 }]}>
            <View style={styles.blockHeader}>
              <Ionicons name="flash" size={16} color={colors.success} />
              <Text style={[styles.blockLabel, { color: colors.success }]}>Your Challenge</Text>
            </View>
            <Text style={[styles.blockText, { color: colors.foreground }]}>{block.prompt || block.text}</Text>
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <ScreenContainer>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
          <Ionicons name="chevron-back" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.foreground }]}>Cultural Lessons</Text>
        {lesson ? (
          <TouchableOpacity onPress={toggleFavorite} style={styles.headerBtn}>
            <Ionicons name={isFavorited ? "heart" : "heart-outline"} size={22} color={isFavorited ? "#EF4444" : colors.muted} />
          </TouchableOpacity>
        ) : (
          <View style={styles.headerBtn} />
        )}
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Topic Selector */}
        <View style={styles.topicRow}>
          {TOPIC_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt.key}
              onPress={() => setSelectedTopic(opt.key)}
              style={[
                styles.topicChip,
                {
                  backgroundColor: selectedTopic === opt.key ? colors.primary : colors.surface,
                  borderColor: selectedTopic === opt.key ? colors.primary : colors.border,
                },
              ]}
            >
              <Ionicons name={opt.icon as any} size={14} color={selectedTopic === opt.key ? colors.background : colors.muted} />
              <Text style={[styles.topicText, { color: selectedTopic === opt.key ? colors.background : colors.foreground }]}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Generate Button */}
        <TouchableOpacity
          onPress={() => generateLesson(selectedTopic)}
          disabled={loading}
          style={[styles.generateBtn, { backgroundColor: colors.primary, opacity: loading ? 0.6 : 1 }]}
        >
          {loading ? (
            <ActivityIndicator size="small" color={colors.background} />
          ) : (
            <Ionicons name="sparkles" size={18} color={colors.background} />
          )}
          <Text style={[styles.generateText, { color: colors.background }]}>
            {loading ? "Creating your lesson..." : "Generate Lesson"}
          </Text>
        </TouchableOpacity>

        {/* Lesson Content */}
        {lesson && (
          <View style={styles.lessonContainer}>
            {/* Lesson Header */}
            <View style={[styles.lessonHeader, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={styles.regionFlag}>{lesson.regionFlag}</Text>
              <Text style={[styles.lessonTitle, { color: colors.foreground }]}>{lesson.title}</Text>
              <Text style={[styles.lessonSubtitle, { color: colors.muted }]}>{lesson.subtitle}</Text>
              <View style={styles.lessonMeta}>
                <View style={[styles.metaChip, { backgroundColor: colors.primary + "15" }]}>
                  <Text style={[styles.metaText, { color: colors.primary }]}>{lesson.culturalRegion}</Text>
                </View>
                <View style={[styles.metaChip, { backgroundColor: colors.success + "15" }]}>
                  <Text style={[styles.metaText, { color: colors.success }]}>{lesson.difficulty}</Text>
                </View>
                <View style={[styles.metaChip, { backgroundColor: "#F59E0B" + "15" }]}>
                  <Text style={[styles.metaText, { color: "#F59E0B" }]}>{lesson.category}</Text>
                </View>
              </View>
            </View>

            {/* Content Blocks */}
            {lesson.content.map((block, idx) => renderContentBlock(block, idx))}

            {/* Tags */}
            <View style={styles.tagsRow}>
              {lesson.tags.map((tag, i) => (
                <Text key={i} style={[styles.tag, { color: colors.muted }]}>#{tag}</Text>
              ))}
            </View>

            {/* Action Buttons */}
            <View style={styles.actionRow}>
              <TouchableOpacity
                onPress={() => generateLesson(selectedTopic)}
                style={[styles.actionBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
              >
                <Ionicons name="refresh" size={18} color={colors.primary} />
                <Text style={[styles.actionText, { color: colors.primary }]}>New Lesson</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => router.push("/student-journal" as any)}
                style={[styles.actionBtn, { backgroundColor: colors.primary }]}
              >
                <Ionicons name="pencil" size={18} color={colors.background} />
                <Text style={[styles.actionText, { color: colors.background }]}>Write About It</Text>
              </TouchableOpacity>
            </View>
            {/* Share Lesson */}
            <TouchableOpacity
              onPress={async () => {
                if (!lesson) return;
                const vocabBlock = (lesson as any).contentBlocks.find((b: any) => b.type === "vocab_spotlight");
                const vocabText = vocabBlock?.words?.map((w: any) => `${w.word} — ${w.translation}`).join("\n") || "";
                const shareText = `\u{1F30E} Cultural Lesson: ${lesson.title}\n\n${lesson.culturalRegion} ${selectedTopic}\n\n${(lesson as any).contentBlocks[0]?.text || ""}\n\n\u{1F4DA} Vocabulary:\n${vocabText}\n\n\u{1F3B5} Learn more on LinguaVibe!`;
                try {
                  if (await Sharing.isAvailableAsync()) {
                    await Sharing.shareAsync("data:text/plain;base64," + btoa(unescape(encodeURIComponent(shareText))), { mimeType: "text/plain", dialogTitle: "Share Cultural Lesson" });
                  }
                } catch {}
              }}
              style={[styles.shareBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
            >
              <Ionicons name="share-outline" size={18} color={colors.primary} />
              <Text style={[styles.actionText, { color: colors.primary }]}>Share Lesson</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Empty State */}
        {!lesson && !loading && (
          <View style={styles.emptyState}>
            <Text style={{ fontSize: 48 }}>🇵🇷</Text>
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Bilingual Cultural Lessons</Text>
            <Text style={[styles.emptyText, { color: colors.muted }]}>
              Short, punchy lessons that mix English and your target language naturally — inspired by heritage creators who celebrate cultura with orgullo.
            </Text>
            <Text style={[styles.emptyHint, { color: colors.muted }]}>
              Pick a topic above and tap "Generate Lesson" to start
            </Text>
          </View>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 0.5 },
  headerBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 18, fontWeight: "700" },
  scrollContent: { padding: 16, paddingBottom: 100, gap: 16 },
  topicRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  topicChip: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  topicText: { fontSize: 12, fontWeight: "600" },
  generateBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 14, borderRadius: 12 },
  generateText: { fontSize: 15, fontWeight: "700" },
  lessonContainer: { gap: 12 },
  lessonHeader: { padding: 16, borderRadius: 14, borderWidth: 1, alignItems: "center", gap: 6 },
  regionFlag: { fontSize: 36 },
  lessonTitle: { fontSize: 20, fontWeight: "800", textAlign: "center", lineHeight: 26 },
  lessonSubtitle: { fontSize: 14, textAlign: "center" },
  lessonMeta: { flexDirection: "row", gap: 8, marginTop: 8 },
  metaChip: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  metaText: { fontSize: 11, fontWeight: "600" },
  blockCard: { padding: 14, borderRadius: 12, gap: 6 },
  blockHeader: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 4 },
  blockLabel: { fontSize: 12, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.5 },
  blockText: { fontSize: 14, lineHeight: 21 },
  vocabSection: { gap: 10 },
  vocabCard: { padding: 14, borderRadius: 12, borderWidth: 1, gap: 4 },
  vocabHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  vocabWord: { fontSize: 18, fontWeight: "700" },
  speakBtn: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  vocabPronunciation: { fontSize: 12, fontStyle: "italic" },
  vocabMeaning: { fontSize: 14, fontWeight: "500", marginTop: 2 },
  vocabUsage: { fontSize: 13, fontStyle: "italic", marginTop: 4 },
  culturalNote: { flexDirection: "row", alignItems: "flex-start", gap: 6, padding: 8, borderRadius: 8, marginTop: 6 },
  culturalNoteText: { fontSize: 12, flex: 1, lineHeight: 17 },
  tagsRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, paddingTop: 4 },
  tag: { fontSize: 12 },
  actionRow: { flexDirection: "row", gap: 12, marginTop: 8 },
  actionBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 12, borderRadius: 10, borderWidth: 1, borderColor: "transparent" },
  actionText: { fontSize: 14, fontWeight: "600" },
  shareBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 12, borderRadius: 10, borderWidth: 1, marginTop: 8 },
  emptyState: { alignItems: "center", gap: 12, paddingTop: 40, paddingHorizontal: 20 },
  emptyTitle: { fontSize: 20, fontWeight: "700" },
  emptyText: { fontSize: 14, textAlign: "center", lineHeight: 20 },
  emptyHint: { fontSize: 12, textAlign: "center", marginTop: 8 },
});
