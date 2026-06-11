/**
 * Methodology Dashboard
 *
 * Visual browse and filter of language learning methodologies
 * by teaching style, language, and difficulty level.
 * Card-based layout with search and sort functionality.
 */
import React, { useState, useMemo, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
  FlatList,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/use-colors";

// ─── Types ──────────────────────────────────────────────────────────────────

interface Methodology {
  id: string;
  methodName: string;
  teachingStyle: string;
  description: string;
  keyPrinciples: string[];
  difficultyLevel: string;
  bestFor: string;
  exampleActivities: string[];
  applicableLanguages: string[];
  researchBasis: string;
  source: string;
  color: string;
}

type SortBy = "name" | "style" | "difficulty";

// ─── Data ───────────────────────────────────────────────────────────────────

const STYLE_COLORS: Record<string, string> = {
  Immersive: "#6366F1",
  Kinesthetic: "#EC4899",
  Conversational: "#10B981",
  "Project-Based": "#F59E0B",
  "Memory-Optimized": "#3B82F6",
  "Relaxation-Based": "#8B5CF6",
  "Drill-Based": "#EF4444",
  "Vocabulary-First": "#14B8A6",
  "Content-Based": "#F97316",
  Academic: "#6B7280",
  "Pronunciation-Focused": "#06B6D4",
  "Peer-Based": "#D946EF",
};

const STYLE_ICONS: Record<string, string> = {
  Immersive: "earth",
  Kinesthetic: "body",
  Conversational: "chatbubbles",
  "Project-Based": "construct",
  "Memory-Optimized": "flash",
  "Relaxation-Based": "leaf",
  "Drill-Based": "repeat",
  "Vocabulary-First": "book",
  "Content-Based": "newspaper",
  Academic: "school",
  "Pronunciation-Focused": "mic",
  "Peer-Based": "people",
};

const DIFFICULTY_ORDER: Record<string, number> = {
  Beginner: 1,
  "Beginner to Advanced": 2,
  "All levels": 3,
  "Intermediate to Advanced": 4,
  Advanced: 5,
};

const METHODOLOGIES: Methodology[] = [
  {
    id: "1",
    methodName: "Comprehensible Input (Krashen)",
    teachingStyle: "Immersive",
    description: "Language is acquired naturally when learners receive input slightly above their current level (i+1). Focus on understanding messages rather than drilling grammar rules.",
    keyPrinciples: ["Input hypothesis (i+1)", "Natural order of acquisition", "Low affective filter", "Acquisition vs learning distinction"],
    difficultyLevel: "Beginner to Advanced",
    bestFor: "Self-directed learners who enjoy reading and listening, heritage speakers reconnecting with their language",
    exampleActivities: ["Story listening", "Free voluntary reading", "Conversation with native speakers", "Watching target-language media"],
    applicableLanguages: ["Spanish", "French", "Japanese", "Korean", "Arabic", "Portuguese", "English"],
    researchBasis: "One of the most influential theories in SLA; supported by decades of research on natural language acquisition",
    source: "Dr. Stephen Krashen",
    color: STYLE_COLORS.Immersive,
  },
  {
    id: "2",
    methodName: "Total Physical Response (TPR)",
    teachingStyle: "Kinesthetic",
    description: "Students learn language through physical actions. The teacher gives commands and students respond with body movements, connecting language to physical memory.",
    keyPrinciples: ["Physical response to commands", "Listening before speaking", "Stress-free environment", "Right-brain activation"],
    difficultyLevel: "Beginner",
    bestFor: "Young learners, kinesthetic learners, absolute beginners who need a low-anxiety start",
    exampleActivities: ["Simon Says in target language", "Action commands", "Movement storytelling", "Gesture vocabulary drills"],
    applicableLanguages: ["Spanish", "French", "Japanese", "Korean", "English"],
    researchBasis: "Effective for beginners; builds listening comprehension and vocabulary through motor memory",
    source: "Dr. James Asher",
    color: STYLE_COLORS.Kinesthetic,
  },
  {
    id: "3",
    methodName: "Communicative Language Teaching (CLT)",
    teachingStyle: "Conversational",
    description: "Focuses on the ability to communicate in real-life situations. Grammar is taught in context, and meaningful interaction is prioritized over accuracy.",
    keyPrinciples: ["Communication over accuracy", "Authentic materials", "Meaningful interaction", "Functional language use"],
    difficultyLevel: "All levels",
    bestFor: "Social learners who want to speak from day one, travelers, professionals needing conversational skills",
    exampleActivities: ["Role-plays", "Information gap activities", "Debates and discussions", "Real-world simulations"],
    applicableLanguages: ["Spanish", "French", "Japanese", "Korean", "Arabic", "Portuguese", "English"],
    researchBasis: "Dominant approach in modern language teaching; proven effective for developing communicative competence",
    source: "Dell Hymes / CLT Movement",
    color: STYLE_COLORS.Conversational,
  },
  {
    id: "4",
    methodName: "Task-Based Language Teaching (TBLT)",
    teachingStyle: "Project-Based",
    description: "Students complete meaningful tasks (ordering food, planning a trip) that require using the target language. Grammar is taught as needed to complete tasks.",
    keyPrinciples: ["Task completion drives learning", "Authentic language use", "Focus on meaning", "Grammar emerges from need"],
    difficultyLevel: "Intermediate to Advanced",
    bestFor: "Goal-oriented learners who want practical skills, professionals needing specific language tasks",
    exampleActivities: ["Planning a trip itinerary", "Ordering at a restaurant", "Job interview practice", "Negotiation simulations"],
    applicableLanguages: ["Spanish", "French", "Japanese", "Korean", "Arabic", "Portuguese", "English"],
    researchBasis: "Strong evidence for developing procedural knowledge and real-world language skills",
    source: "Peter Skehan / Rod Ellis",
    color: STYLE_COLORS["Project-Based"],
  },
  {
    id: "5",
    methodName: "Spaced Repetition System (SRS)",
    teachingStyle: "Memory-Optimized",
    description: "Uses algorithmically-timed review intervals to optimize long-term memory retention. Words and phrases are reviewed just before they would be forgotten.",
    keyPrinciples: ["Forgetting curve optimization", "Active recall", "Increasing intervals", "Personalized review schedules"],
    difficultyLevel: "All levels",
    bestFor: "Vocabulary builders, exam preppers, systematic learners who want measurable progress",
    exampleActivities: ["Flashcard review sessions", "Vocabulary quizzes", "Sentence cloze exercises", "Audio recognition drills"],
    applicableLanguages: ["Spanish", "French", "Japanese", "Korean", "Arabic", "Portuguese", "English"],
    researchBasis: "Backed by cognitive science research on memory; proven to dramatically improve long-term retention",
    source: "Piotr Wozniak / Ebbinghaus",
    color: STYLE_COLORS["Memory-Optimized"],
  },
  {
    id: "6",
    methodName: "Immersion Method",
    teachingStyle: "Immersive",
    description: "All instruction and interaction happens in the target language. Students are surrounded by the language and learn through context, similar to how children acquire their first language.",
    keyPrinciples: ["Target language only", "Context-based understanding", "Natural acquisition", "Cultural integration"],
    difficultyLevel: "All levels",
    bestFor: "Committed learners ready for full immersion, heritage speakers, those living in target-language countries",
    exampleActivities: ["Full-day target language classes", "Cultural immersion trips", "Language exchange partnerships", "Media consumption in target language"],
    applicableLanguages: ["Spanish", "French", "Japanese", "Korean", "Arabic", "Portuguese", "English"],
    researchBasis: "Canadian immersion programs show strong results; most natural path to bilingualism",
    source: "Canadian Immersion Programs",
    color: STYLE_COLORS.Immersive,
  },
  {
    id: "7",
    methodName: "Suggestopedia",
    teachingStyle: "Relaxation-Based",
    description: "Uses music, relaxation, and a comfortable environment to lower anxiety and accelerate learning. Lessons are presented in a dramatic, story-like format.",
    keyPrinciples: ["Relaxed alertness", "Music-enhanced learning", "Dramatic presentation", "Peripheral learning"],
    difficultyLevel: "Beginner to Advanced",
    bestFor: "Anxious learners, creative types, those who learn better in low-stress environments",
    exampleActivities: ["Music-accompanied readings", "Dramatic dialogues", "Relaxation exercises before study", "Art-integrated vocabulary"],
    applicableLanguages: ["Spanish", "French", "Japanese", "Korean", "English"],
    researchBasis: "Mixed evidence but positive results for reducing anxiety and increasing motivation",
    source: "Dr. Georgi Lozanov",
    color: STYLE_COLORS["Relaxation-Based"],
  },
  {
    id: "8",
    methodName: "Audio-Lingual Method",
    teachingStyle: "Drill-Based",
    description: "Emphasizes repetitive drills and pattern practice. Students memorize dialogues and practice substitution drills to build automatic language habits.",
    keyPrinciples: ["Habit formation through repetition", "Pattern drills", "Oral practice priority", "Error prevention"],
    difficultyLevel: "Beginner to Advanced",
    bestFor: "Structured learners who prefer clear patterns, military/professional language training",
    exampleActivities: ["Substitution drills", "Dialogue memorization", "Pattern practice", "Pronunciation drills"],
    applicableLanguages: ["Spanish", "French", "Japanese", "Korean", "Arabic", "English"],
    researchBasis: "Effective for building automaticity in basic structures; less effective for creative language use",
    source: "Charles Fries / Robert Lado",
    color: STYLE_COLORS["Drill-Based"],
  },
  {
    id: "9",
    methodName: "Lexical Approach",
    teachingStyle: "Vocabulary-First",
    description: "Focuses on learning chunks of language (collocations, fixed expressions, idioms) rather than individual words or grammar rules. Language is seen as grammaticalized lexis.",
    keyPrinciples: ["Chunks over individual words", "Collocations are key", "Notice and record patterns", "Fluency through prefabricated language"],
    difficultyLevel: "Intermediate to Advanced",
    bestFor: "Intermediate learners hitting a plateau, those wanting to sound more natural and fluent",
    exampleActivities: ["Collocation matching", "Chunk identification in texts", "Phrase journal keeping", "Native speaker pattern analysis"],
    applicableLanguages: ["Spanish", "French", "Japanese", "Korean", "Arabic", "Portuguese", "English"],
    researchBasis: "Growing evidence that chunk-based learning leads to more natural and fluent production",
    source: "Michael Lewis",
    color: STYLE_COLORS["Vocabulary-First"],
  },
  {
    id: "10",
    methodName: "Content and Language Integrated Learning (CLIL)",
    teachingStyle: "Content-Based",
    description: "Students learn a subject (history, science, art) through the target language. Language is a vehicle for content learning, not the primary focus.",
    keyPrinciples: ["Dual-focused learning", "Authentic content", "Cognitive engagement", "Language as medium"],
    difficultyLevel: "Intermediate to Advanced",
    bestFor: "Academic learners, professionals needing domain-specific language, curious minds who want to learn about topics in their target language",
    exampleActivities: ["History lessons in target language", "Science experiments described in L2", "Art criticism in target language", "Current events discussion"],
    applicableLanguages: ["Spanish", "French", "Japanese", "Korean", "Arabic", "Portuguese", "English"],
    researchBasis: "Strong results in European education systems; develops both content knowledge and language proficiency",
    source: "European CLIL Framework",
    color: STYLE_COLORS["Content-Based"],
  },
  {
    id: "11",
    methodName: "Grammar-Translation Method",
    teachingStyle: "Academic",
    description: "Traditional approach focusing on grammar rules and translation between native and target languages. Emphasizes reading and writing over speaking.",
    keyPrinciples: ["Explicit grammar instruction", "Translation exercises", "Literary texts", "Written accuracy"],
    difficultyLevel: "All levels",
    bestFor: "Academic learners, those preparing for written exams, learners who prefer structured rule-based learning",
    exampleActivities: ["Grammar rule study", "Translation exercises", "Literary analysis", "Written composition"],
    applicableLanguages: ["Spanish", "French", "Japanese", "Korean", "Arabic", "Portuguese", "English"],
    researchBasis: "Oldest method; effective for reading comprehension and grammar knowledge but limited for oral communication",
    source: "Classical Language Teaching",
    color: STYLE_COLORS.Academic,
  },
  {
    id: "12",
    methodName: "Shadowing Technique",
    teachingStyle: "Pronunciation-Focused",
    description: "Students listen to native speakers and immediately repeat what they hear, mimicking pronunciation, rhythm, and intonation in real-time.",
    keyPrinciples: ["Real-time repetition", "Prosody matching", "Automatic processing", "Native-like pronunciation"],
    difficultyLevel: "All levels",
    bestFor: "Pronunciation perfectionists, accent reduction, learners wanting to sound more native",
    exampleActivities: ["Podcast shadowing", "Movie dialogue repetition", "News anchor mimicking", "Song lyric shadowing"],
    applicableLanguages: ["Spanish", "French", "Japanese", "Korean", "Arabic", "Portuguese", "English"],
    researchBasis: "Proven effective for improving pronunciation, listening comprehension, and speaking fluency",
    source: "Alexander Arguelles / Japanese SLA Research",
    color: STYLE_COLORS["Pronunciation-Focused"],
  },
];

const ALL_STYLES = [...new Set(METHODOLOGIES.map((m) => m.teachingStyle))].sort();
const ALL_DIFFICULTIES = [...new Set(METHODOLOGIES.map((m) => m.difficultyLevel))].sort(
  (a, b) => (DIFFICULTY_ORDER[a] || 99) - (DIFFICULTY_ORDER[b] || 99)
);

// ─── Component ──────────────────────────────────────────────────────────────

export default function MethodologyDashboardScreen() {
  const colors = useColors();
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [selectedStyle, setSelectedStyle] = useState<string | null>(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortBy>("name");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let result = [...METHODOLOGIES];

    // Search filter
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (m) =>
          m.methodName.toLowerCase().includes(q) ||
          m.teachingStyle.toLowerCase().includes(q) ||
          m.description.toLowerCase().includes(q) ||
          m.bestFor.toLowerCase().includes(q)
      );
    }

    // Style filter
    if (selectedStyle) {
      result = result.filter((m) => m.teachingStyle === selectedStyle);
    }

    // Difficulty filter
    if (selectedDifficulty) {
      result = result.filter((m) => m.difficultyLevel === selectedDifficulty);
    }

    // Sort
    if (sortBy === "name") {
      result.sort((a, b) => a.methodName.localeCompare(b.methodName));
    } else if (sortBy === "style") {
      result.sort((a, b) => a.teachingStyle.localeCompare(b.teachingStyle));
    } else if (sortBy === "difficulty") {
      result.sort(
        (a, b) =>
          (DIFFICULTY_ORDER[a.difficultyLevel] || 99) -
          (DIFFICULTY_ORDER[b.difficultyLevel] || 99)
      );
    }

    return result;
  }, [search, selectedStyle, selectedDifficulty, sortBy]);

  const toggleExpand = useCallback(
    (id: string) => {
      if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setExpandedId((prev) => (prev === id ? null : id));
    },
    []
  );

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingTop: 12,
      paddingBottom: 8,
    },
    backBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.surface,
      alignItems: "center",
      justifyContent: "center",
    },
    headerTitle: {
      flex: 1,
      fontSize: 20,
      fontWeight: "700",
      color: colors.foreground,
      textAlign: "center",
      marginRight: 40,
    },
    searchContainer: {
      flexDirection: "row",
      alignItems: "center",
      marginHorizontal: 16,
      marginTop: 8,
      backgroundColor: colors.surface,
      borderRadius: 12,
      paddingHorizontal: 12,
      paddingVertical: 10,
      borderWidth: 1,
      borderColor: colors.border,
    },
    searchInput: {
      flex: 1,
      fontSize: 15,
      color: colors.foreground,
      marginLeft: 8,
      padding: 0,
    },
    filterSection: {
      marginTop: 12,
      paddingHorizontal: 16,
    },
    filterLabel: {
      fontSize: 12,
      fontWeight: "600",
      color: colors.muted,
      textTransform: "uppercase",
      marginBottom: 8,
    },
    filterScroll: {
      flexDirection: "row",
      gap: 8,
      flexWrap: "wrap",
    },
    filterChip: {
      paddingHorizontal: 14,
      paddingVertical: 7,
      borderRadius: 20,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    filterChipActive: {
      borderColor: colors.primary,
      backgroundColor: colors.primary + "15",
    },
    filterChipText: {
      fontSize: 13,
      fontWeight: "500",
      color: colors.muted,
    },
    filterChipTextActive: {
      color: colors.primary,
      fontWeight: "600",
    },
    sortRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginHorizontal: 16,
      marginTop: 16,
      marginBottom: 8,
    },
    resultCount: {
      fontSize: 13,
      color: colors.muted,
    },
    sortBtns: {
      flexDirection: "row",
      gap: 4,
    },
    sortBtn: {
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 8,
    },
    sortBtnActive: {
      backgroundColor: colors.primary + "20",
    },
    sortBtnText: {
      fontSize: 12,
      fontWeight: "500",
      color: colors.muted,
    },
    sortBtnTextActive: {
      color: colors.primary,
      fontWeight: "600",
    },
    card: {
      marginHorizontal: 16,
      marginBottom: 12,
      backgroundColor: colors.surface,
      borderRadius: 16,
      overflow: "hidden",
      borderWidth: 1,
      borderColor: colors.border,
    },
    cardHeader: {
      flexDirection: "row",
      padding: 16,
      alignItems: "center",
    },
    cardIcon: {
      width: 44,
      height: 44,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
      marginRight: 12,
    },
    cardInfo: {
      flex: 1,
    },
    cardName: {
      fontSize: 15,
      fontWeight: "700",
      color: colors.foreground,
      marginBottom: 2,
    },
    cardStyle: {
      fontSize: 12,
      fontWeight: "600",
    },
    cardChevron: {
      marginLeft: 8,
    },
    cardBody: {
      paddingHorizontal: 16,
      paddingBottom: 16,
    },
    cardDesc: {
      fontSize: 14,
      color: colors.foreground,
      lineHeight: 20,
      marginBottom: 12,
    },
    cardMeta: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
      marginBottom: 12,
    },
    metaBadge: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 8,
      backgroundColor: colors.background,
    },
    metaText: {
      fontSize: 12,
      color: colors.muted,
      fontWeight: "500",
    },
    sectionTitle: {
      fontSize: 13,
      fontWeight: "700",
      color: colors.foreground,
      marginBottom: 6,
      marginTop: 8,
    },
    bulletItem: {
      fontSize: 13,
      color: colors.muted,
      lineHeight: 20,
      paddingLeft: 8,
    },
    bestForText: {
      fontSize: 13,
      color: colors.muted,
      lineHeight: 20,
      fontStyle: "italic",
    },
    researchText: {
      fontSize: 12,
      color: colors.muted,
      lineHeight: 18,
      marginTop: 8,
      paddingTop: 8,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    sourceText: {
      fontSize: 11,
      color: colors.primary,
      fontWeight: "600",
      marginTop: 4,
    },
    emptyContainer: {
      alignItems: "center",
      paddingVertical: 40,
    },
    emptyText: {
      fontSize: 16,
      color: colors.muted,
      marginTop: 12,
    },
    emptySubtext: {
      fontSize: 13,
      color: colors.muted,
      marginTop: 4,
    },
  });

  const renderCard = useCallback(
    ({ item }: { item: Methodology }) => {
      const isExpanded = expandedId === item.id;
      const iconName = (STYLE_ICONS[item.teachingStyle] || "book") as any;

      return (
        <TouchableOpacity
          style={styles.card}
          onPress={() => toggleExpand(item.id)}
          activeOpacity={0.7}
        >
          <View style={styles.cardHeader}>
            <View style={[styles.cardIcon, { backgroundColor: item.color + "20" }]}>
              <Ionicons name={iconName} size={22} color={item.color} />
            </View>
            <View style={styles.cardInfo}>
              <Text style={styles.cardName} numberOfLines={isExpanded ? undefined : 1}>
                {item.methodName}
              </Text>
              <Text style={[styles.cardStyle, { color: item.color }]}>{item.teachingStyle}</Text>
            </View>
            <Ionicons
              name={isExpanded ? "chevron-up" : "chevron-down"}
              size={18}
              color={colors.muted}
              style={styles.cardChevron}
            />
          </View>

          {isExpanded && (
            <View style={styles.cardBody}>
              <Text style={styles.cardDesc}>{item.description}</Text>

              {/* Meta badges */}
              <View style={styles.cardMeta}>
                <View style={styles.metaBadge}>
                  <Ionicons name="speedometer" size={14} color={colors.muted} />
                  <Text style={styles.metaText}>{item.difficultyLevel}</Text>
                </View>
                <View style={styles.metaBadge}>
                  <Ionicons name="language" size={14} color={colors.muted} />
                  <Text style={styles.metaText}>{item.applicableLanguages.length} languages</Text>
                </View>
              </View>

              {/* Best For */}
              <Text style={styles.sectionTitle}>Best For</Text>
              <Text style={styles.bestForText}>{item.bestFor}</Text>

              {/* Key Principles */}
              <Text style={styles.sectionTitle}>Key Principles</Text>
              {item.keyPrinciples.map((p, i) => (
                <Text key={i} style={styles.bulletItem}>
                  {"\u2022"} {p}
                </Text>
              ))}

              {/* Example Activities */}
              <Text style={styles.sectionTitle}>Example Activities</Text>
              {item.exampleActivities.map((a, i) => (
                <Text key={i} style={styles.bulletItem}>
                  {"\u2022"} {a}
                </Text>
              ))}

              {/* Research */}
              <Text style={styles.researchText}>{item.researchBasis}</Text>
              <Text style={styles.sourceText}>Source: {item.source}</Text>
            </View>
          )}
        </TouchableOpacity>
      );
    },
    [expandedId, colors]
  );

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => {
            if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.back();
          }}
        >
          <Ionicons name="chevron-back" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Methodology Lab</Text>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={18} color={colors.muted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search methodologies..."
          placeholderTextColor={colors.muted}
          value={search}
          onChangeText={setSearch}
          returnKeyType="done"
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch("")}>
            <Ionicons name="close-circle" size={18} color={colors.muted} />
          </TouchableOpacity>
        )}
      </View>

      {/* Teaching Style Filter */}
      <View style={styles.filterSection}>
        <Text style={styles.filterLabel}>Teaching Style</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.filterScroll}>
            <TouchableOpacity
              style={[styles.filterChip, !selectedStyle && styles.filterChipActive]}
              onPress={() => {
                if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setSelectedStyle(null);
              }}
            >
              <Text style={[styles.filterChipText, !selectedStyle && styles.filterChipTextActive]}>
                All
              </Text>
            </TouchableOpacity>
            {ALL_STYLES.map((style) => (
              <TouchableOpacity
                key={style}
                style={[
                  styles.filterChip,
                  selectedStyle === style && styles.filterChipActive,
                ]}
                onPress={() => {
                  if (Platform.OS !== "web")
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setSelectedStyle((prev) => (prev === style ? null : style));
                }}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    selectedStyle === style && styles.filterChipTextActive,
                  ]}
                >
                  {style}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      {/* Difficulty Filter */}
      <View style={[styles.filterSection, { marginTop: 8 }]}>
        <Text style={styles.filterLabel}>Difficulty</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.filterScroll}>
            <TouchableOpacity
              style={[styles.filterChip, !selectedDifficulty && styles.filterChipActive]}
              onPress={() => {
                if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setSelectedDifficulty(null);
              }}
            >
              <Text
                style={[
                  styles.filterChipText,
                  !selectedDifficulty && styles.filterChipTextActive,
                ]}
              >
                All
              </Text>
            </TouchableOpacity>
            {ALL_DIFFICULTIES.map((diff) => (
              <TouchableOpacity
                key={diff}
                style={[
                  styles.filterChip,
                  selectedDifficulty === diff && styles.filterChipActive,
                ]}
                onPress={() => {
                  if (Platform.OS !== "web")
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setSelectedDifficulty((prev) => (prev === diff ? null : diff));
                }}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    selectedDifficulty === diff && styles.filterChipTextActive,
                  ]}
                >
                  {diff}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      {/* Sort & Count */}
      <View style={styles.sortRow}>
        <Text style={styles.resultCount}>
          {filtered.length} method{filtered.length !== 1 ? "s" : ""}
        </Text>
        <View style={styles.sortBtns}>
          {(["name", "style", "difficulty"] as SortBy[]).map((s) => (
            <TouchableOpacity
              key={s}
              style={[styles.sortBtn, sortBy === s && styles.sortBtnActive]}
              onPress={() => setSortBy(s)}
            >
              <Text style={[styles.sortBtnText, sortBy === s && styles.sortBtnTextActive]}>
                {s === "name" ? "A-Z" : s === "style" ? "Style" : "Level"}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Cards */}
      {filtered.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="search" size={40} color={colors.muted} />
          <Text style={styles.emptyText}>No methodologies found</Text>
          <Text style={styles.emptySubtext}>Try adjusting your filters</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          renderItem={renderCard}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}
