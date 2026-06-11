import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Share,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import * as Haptics from "expo-haptics";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { trpc } from "@/lib/trpc";

type CorrectionItem = {
  id: string;
  original: string;
  corrected: string;
  explanation: string;
  type: "grammar" | "pronunciation" | "vocabulary" | "conjugation";
};

type VocabItem = {
  id: string;
  word: string;
  translation: string;
  example: string;
  level: "beginner" | "intermediate" | "advanced";
  saved: boolean;
};

type ConversationStats = {
  duration: string;
  wordsSpoken: number;
  accuracy: number;
  fluencyScore: number;
  newWordsUsed: number;
  topicsDiscussed: string[];
};

const MOCK_STATS: ConversationStats = {
  duration: "12:34",
  wordsSpoken: 847,
  accuracy: 78,
  fluencyScore: 72,
  newWordsUsed: 14,
  topicsDiscussed: ["Travel", "Food", "Family", "Weather"],
};

const CORRECTIONS_FALLBACK: CorrectionItem[] = [
  {
    id: "1",
    original: "Yo soy ir al mercado",
    corrected: "Yo voy al mercado",
    explanation: "Use 'ir' conjugated as 'voy' (present tense, first person) instead of infinitive after 'soy'.",
    type: "conjugation",
  },
  {
    id: "2",
    original: "La comida es muy buena, me gusta mucho el",
    corrected: "La comida es muy buena, me gusta mucho",
    explanation: "Remove trailing article 'el' — the sentence is complete without it.",
    type: "grammar",
  },
  {
    id: "3",
    original: "Necessito comprar frutas",
    corrected: "Necesito comprar frutas",
    explanation: "Spelling: 'necesito' has one 's', not double 'ss'.",
    type: "vocabulary",
  },
  {
    id: "4",
    original: "Pronunciation: 'rr' in 'perro'",
    corrected: "Roll the tongue: tip vibrates against alveolar ridge",
    explanation: "The Spanish trilled 'rr' requires tongue vibration. Practice with 'butter' → 'budder' → 'perro'.",
    type: "pronunciation",
  },
  {
    id: "5",
    original: "Yo tengo hambre mucho",
    corrected: "Yo tengo mucha hambre",
    explanation: "In Spanish, 'mucho/mucha' comes before the noun and agrees in gender. 'Hambre' is feminine → 'mucha hambre'.",
    type: "grammar",
  },
];

const VOCAB_FALLBACK: VocabItem[] = [
  { id: "1", word: "mercado", translation: "market", example: "Voy al mercado los sábados", level: "beginner", saved: false },
  { id: "2", word: "madrugada", translation: "early morning / dawn", example: "Me desperté de madrugada", level: "intermediate", saved: false },
  { id: "3", word: "cotidiano", translation: "daily / everyday", example: "Es parte de mi vida cotidiana", level: "advanced", saved: false },
  { id: "4", word: "temporada", translation: "season / period", example: "Es temporada de mangos", level: "intermediate", saved: false },
  { id: "5", word: "aprovechar", translation: "to take advantage of", example: "Hay que aprovechar el día", level: "intermediate", saved: false },
  { id: "6", word: "mariscos", translation: "seafood", example: "Me encantan los mariscos frescos", level: "beginner", saved: false },
  { id: "7", word: "ambiente", translation: "atmosphere / environment", example: "El ambiente del restaurante es acogedor", level: "intermediate", saved: false },
];

const TYPE_COLORS: Record<string, string> = {
  grammar: "#FF6B6B",
  pronunciation: "#4ECDC4",
  vocabulary: "#FFD93D",
  conjugation: "#6C5CE7",
};

const TYPE_ICONS: Record<string, string> = {
  grammar: "construct-outline",
  pronunciation: "mic-outline",
  vocabulary: "book-outline",
  conjugation: "git-branch-outline",
};

const LEVEL_COLORS: Record<string, string> = {
  beginner: "#4ADE80",
  intermediate: "#FBBF24",
  advanced: "#F87171",
};

export default function ConversationSummaryScreen() {
  const colors = useColors();
  const params = useLocalSearchParams<{ teacherName?: string; language?: string; sessionId?: string }>();
  const teacherName = params.teacherName || "Profesora María";
  const language = params.language || "Spanish";

  const [savedVocab, setSavedVocab] = useState<Set<string>>(new Set());
  const [expandedCorrection, setExpandedCorrection] = useState<string | null>(null);
  const [stats, setStats] = useState<ConversationStats>(MOCK_STATS);
  const [corrections, setCorrections] = useState<CorrectionItem[]>(CORRECTIONS_FALLBACK);
  const [vocab, setVocab] = useState<VocabItem[]>(VOCAB_FALLBACK);

  // Load real session data from AsyncStorage
  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(`@session_summary_${params.sessionId || 'latest'}`);
        if (stored) {
          const data = JSON.parse(stored);
          if (data.stats) setStats(data.stats);
          if (data.corrections?.length) setCorrections(data.corrections);
          if (data.vocab?.length) setVocab(data.vocab);
        }
      } catch {}
    })();
  }, []);

  const toggleSaveWord = (id: string) => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSavedVocab((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleShare = async () => {
    if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await Share.share({
      message: `🎓 ConnectWorld AI Session Summary\n\n📊 ${stats.duration} conversation with ${teacherName}\n✅ Accuracy: ${stats.accuracy}%\n🗣️ Fluency: ${stats.fluencyScore}/100\n📝 ${corrections.length} corrections\n📚 ${vocab.length} new words learned\n\nKeep learning with ConnectWorld AI!`,
    });
  };

  const renderStatCard = (icon: string, value: string | number, label: string, color: string) => (
    <View style={[styles.statCard, { backgroundColor: color + "15", borderColor: color + "30" }]}>
      <Ionicons name={icon as any} size={20} color={color} />
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: colors.muted }]}>{label}</Text>
    </View>
  );

  const renderCorrection = ({ item }: { item: CorrectionItem }) => {
    const isExpanded = expandedCorrection === item.id;
    const typeColor = TYPE_COLORS[item.type];
    return (
      <TouchableOpacity
        style={[styles.correctionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
        onPress={() => setExpandedCorrection(isExpanded ? null : item.id)}
        activeOpacity={0.7}
      >
        <View style={styles.correctionHeader}>
          <View style={[styles.typeBadge, { backgroundColor: typeColor + "20" }]}>
            <Ionicons name={TYPE_ICONS[item.type] as any} size={14} color={typeColor} />
            <Text style={[styles.typeText, { color: typeColor }]}>{item.type}</Text>
          </View>
          <Ionicons name={isExpanded ? "chevron-up" : "chevron-down"} size={16} color={colors.muted} />
        </View>
        <View style={styles.correctionBody}>
          <View style={styles.correctionRow}>
            <Ionicons name="close-circle" size={16} color="#FF6B6B" />
            <Text style={[styles.originalText, { color: colors.muted }]}>{item.original}</Text>
          </View>
          <View style={styles.correctionRow}>
            <Ionicons name="checkmark-circle" size={16} color="#4ADE80" />
            <Text style={[styles.correctedText, { color: colors.foreground }]}>{item.corrected}</Text>
          </View>
        </View>
        {isExpanded && (
          <View style={[styles.explanationBox, { backgroundColor: typeColor + "10", borderColor: typeColor + "30" }]}>
            <Ionicons name="bulb-outline" size={14} color={typeColor} />
            <Text style={[styles.explanationText, { color: colors.foreground }]}>{item.explanation}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderVocabItem = ({ item }: { item: VocabItem }) => {
    const isSaved = savedVocab.has(item.id);
    const levelColor = LEVEL_COLORS[item.level];
    return (
      <View style={[styles.vocabCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.vocabHeader}>
          <View style={styles.vocabWordRow}>
            <Text style={[styles.vocabWord, { color: colors.foreground }]}>{item.word}</Text>
            <View style={[styles.levelBadge, { backgroundColor: levelColor + "20" }]}>
              <Text style={[styles.levelText, { color: levelColor }]}>{item.level}</Text>
            </View>
          </View>
          <TouchableOpacity onPress={() => toggleSaveWord(item.id)} style={styles.saveBtn}>
            <Ionicons name={isSaved ? "bookmark" : "bookmark-outline"} size={20} color={isSaved ? "#FFD700" : colors.muted} />
          </TouchableOpacity>
        </View>
        <Text style={[styles.vocabTranslation, { color: colors.muted }]}>{item.translation}</Text>
        <View style={[styles.exampleBox, { backgroundColor: colors.background }]}>
          <Ionicons name="chatbubble-outline" size={12} color={colors.muted} />
          <Text style={[styles.exampleText, { color: colors.muted }]}>{item.example}</Text>
        </View>
      </View>
    );
  };

  return (
    <ScreenContainer edges={["top", "left", "right"]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Session Summary</Text>
          <Text style={[styles.headerSubtitle, { color: colors.muted }]}>with {teacherName}</Text>
        </View>
        <TouchableOpacity onPress={handleShare} style={styles.shareBtn}>
          <Ionicons name="share-outline" size={22} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {/* Overall Score */}
        <View style={[styles.scoreSection, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.scoreCircle}>
            <Text style={styles.scoreNumber}>{stats.fluencyScore}</Text>
            <Text style={styles.scoreMax}>/100</Text>
          </View>
          <View style={styles.scoreInfo}>
            <Text style={[styles.scoreTitle, { color: colors.foreground }]}>Fluency Score</Text>
            <Text style={[styles.scoreDesc, { color: colors.muted }]}>
              Great progress! Your conversational flow improved since last session.
            </Text>
          </View>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          {renderStatCard("time-outline", stats.duration, "Duration", "#6C5CE7")}
          {renderStatCard("chatbubbles-outline", stats.wordsSpoken, "Words", "#00B894")}
          {renderStatCard("checkmark-done-outline", `${stats.accuracy}%`, "Accuracy", "#0984E3")}
          {renderStatCard("sparkles-outline", stats.newWordsUsed, "New Words", "#FFD700")}
        </View>

        {/* Topics Discussed */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Topics Discussed</Text>
          <View style={styles.topicsRow}>
            {stats.topicsDiscussed.map((topic, i) => (
              <View key={i} style={[styles.topicChip, { backgroundColor: colors.primary + "15", borderColor: colors.primary + "30" }]}>
                <Text style={[styles.topicText, { color: colors.primary }]}>{topic}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Corrections */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
              Corrections ({corrections.length})
            </Text>
            <View style={[styles.badge, { backgroundColor: "#FF6B6B20" }]}>
              <Text style={[styles.badgeText, { color: "#FF6B6B" }]}>Review</Text>
            </View>
          </View>
          <FlatList
            data={corrections}
            renderItem={renderCorrection}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          />
        </View>

        {/* New Vocabulary */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
              New Vocabulary ({vocab.length})
            </Text>
            <TouchableOpacity style={[styles.saveAllBtn, { backgroundColor: colors.primary + "15" }]}>
              <Ionicons name="bookmark" size={14} color={colors.primary} />
              <Text style={[styles.saveAllText, { color: colors.primary }]}>Save All</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={vocab}
            renderItem={renderVocabItem}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          />
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsSection}>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: colors.primary }]}
            onPress={() => {
              if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              router.push("/flashcard-review");
            }}
          >
            <Ionicons name="flash-outline" size={20} color="#FFFFFF" />
            <Text style={styles.actionBtnText}>Practice These Words</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtnOutline, { borderColor: colors.primary }]}
            onPress={() => {
              if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.back();
            }}
          >
            <Ionicons name="refresh-outline" size={20} color={colors.primary} />
            <Text style={[styles.actionBtnOutlineText, { color: colors.primary }]}>Book Another Session</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
  },
  backBtn: { padding: 4 },
  headerCenter: { flex: 1, alignItems: "center" },
  headerTitle: { fontSize: 17, fontWeight: "700" },
  headerSubtitle: { fontSize: 13, marginTop: 2 },
  shareBtn: { padding: 4 },
  content: { flex: 1 },
  contentContainer: { padding: 16 },
  scoreSection: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16,
  },
  scoreCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#6C5CE720",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "#6C5CE7",
  },
  scoreNumber: { fontSize: 24, fontWeight: "800", color: "#6C5CE7" },
  scoreMax: { fontSize: 11, color: "#6C5CE7", marginTop: -2 },
  scoreInfo: { flex: 1, marginLeft: 16 },
  scoreTitle: { fontSize: 16, fontWeight: "700" },
  scoreDesc: { fontSize: 13, marginTop: 4, lineHeight: 18 },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    minWidth: "45%",
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    gap: 4,
  },
  statValue: { fontSize: 20, fontWeight: "800" },
  statLabel: { fontSize: 11 },
  section: { marginBottom: 24 },
  sectionHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
  sectionTitle: { fontSize: 18, fontWeight: "700" },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  badgeText: { fontSize: 12, fontWeight: "600" },
  topicsRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  topicChip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, borderWidth: 1 },
  topicText: { fontSize: 13, fontWeight: "600" },
  correctionCard: { padding: 14, borderRadius: 12, borderWidth: 1 },
  correctionHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 },
  typeBadge: { flexDirection: "row", alignItems: "center", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, gap: 4 },
  typeText: { fontSize: 12, fontWeight: "600", textTransform: "capitalize" },
  correctionBody: { gap: 6 },
  correctionRow: { flexDirection: "row", alignItems: "flex-start", gap: 8 },
  originalText: { flex: 1, fontSize: 14, textDecorationLine: "line-through" },
  correctedText: { flex: 1, fontSize: 14, fontWeight: "600" },
  explanationBox: { marginTop: 10, padding: 10, borderRadius: 8, borderWidth: 1, flexDirection: "row", alignItems: "flex-start", gap: 8 },
  explanationText: { flex: 1, fontSize: 13, lineHeight: 18 },
  vocabCard: { padding: 14, borderRadius: 12, borderWidth: 1 },
  vocabHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  vocabWordRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  vocabWord: { fontSize: 16, fontWeight: "700" },
  levelBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  levelText: { fontSize: 10, fontWeight: "700", textTransform: "capitalize" },
  saveBtn: { padding: 4 },
  vocabTranslation: { fontSize: 14, marginTop: 4 },
  exampleBox: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 8, padding: 8, borderRadius: 8 },
  exampleText: { flex: 1, fontSize: 12, fontStyle: "italic" },
  saveAllBtn: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  saveAllText: { fontSize: 12, fontWeight: "600" },
  actionsSection: { gap: 12, marginTop: 8 },
  actionBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, padding: 16, borderRadius: 14 },
  actionBtnText: { fontSize: 16, fontWeight: "700", color: "#FFFFFF" },
  actionBtnOutline: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, padding: 16, borderRadius: 14, borderWidth: 2 },
  actionBtnOutlineText: { fontSize: 16, fontWeight: "700" },
});
