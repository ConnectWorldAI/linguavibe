import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  LayoutAnimation,
  Platform,
  UIManager,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Spacing, BorderRadius, FontSize } from "@/constants/Colors";
import { trpc } from "@/lib/trpc";
import { saveSlangFlashcard, isSlangSaved } from "@/lib/slang-flashcards";
import {
  DialectComparisonModal,
  MOCK_COMPARISONS,
  type DialectComparisonData,
} from "./dialect-comparison-modal";
import * as Haptics from "expo-haptics";

// Enable LayoutAnimation on Android
if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// ─── TYPES ───────────────────────────────────────────────────────────────────

export interface SlangEntry {
  word: string;
  meaning: string;
  dialect: string;
  dialectFlag: string;
  example?: string;
  note?: string;
}

export interface DialectInfo {
  detected: string;
  confidence: number;
  flag: string;
  characteristics: string[];
}

export interface CulturalContext {
  genre: string;
  mood: string;
  theme: string;
  description: string;
}

export interface LearnerNote {
  type: "warning" | "tip" | "info";
  text: string;
}

export interface DialectVariantEntry {
  word: string;
  variants: {
    region: string;
    flag: string;
    term: string;
    usage: string;
  }[];
}

export interface SongAnalysisData {
  slangEntries: SlangEntry[];
  dialect: DialectInfo;
  cultural: CulturalContext;
  learnerNotes: LearnerNote[];
  dialectComparisons?: DialectVariantEntry[];
}

// ─── MOCK DATA (fallback when AI is unavailable) ─────────────────────────────

const MOCK_ANALYSIS: SongAnalysisData = {
  slangEntries: [
    {
      word: "Despacito",
      meaning: "Slowly (diminutive, affectionate tone — not standard 'despacio')",
      dialect: "Puerto Rican",
      dialectFlag: "🇵🇷",
      example: "Hazlo despacito = Do it slowly/gently",
      note: "The '-ito' suffix adds warmth and intimacy, common in Caribbean Spanish",
    },
    {
      word: "Pasito a pasito",
      meaning: "Step by step (little step by little step)",
      dialect: "Caribbean Spanish",
      dialectFlag: "🌴",
      example: "Pasito a pasito, suave suavecito = Little by little, softly softly",
      note: "Double diminutive for extra emphasis — very typical in reggaetón lyrics",
    },
    {
      word: "Suavecito",
      meaning: "Softly/smoothly (diminutive of 'suave')",
      dialect: "Puerto Rican",
      dialectFlag: "🇵🇷",
      example: "Tócame suavecito = Touch me softly",
      note: "Standard Spanish would just use 'suavemente' — this is more intimate/casual",
    },
    {
      word: "Pegadito",
      meaning: "Close together / stuck to (physically close, dancing close)",
      dialect: "Caribbean",
      dialectFlag: "🌴",
      note: "In reggaetón context, implies dancing very close body-to-body",
    },
    {
      word: "Laberinto",
      meaning: "Labyrinth (used metaphorically for body curves)",
      dialect: "Poetic/Reggaetón",
      dialectFlag: "🎵",
      note: "Not slang per se, but a common reggaetón metaphor — wouldn't be used literally in conversation",
    },
    {
      word: "Manuscrito",
      meaning: "Manuscript (metaphor: writing/marking the body)",
      dialect: "Poetic/Reggaetón",
      dialectFlag: "🎵",
      note: "Artistic wordplay — comparing intimacy to writing. A Dominican might say 'rayarte' instead",
    },
  ],
  dialect: {
    detected: "Puerto Rican Spanish (Boricua)",
    confidence: 92,
    flag: "🇵🇷",
    characteristics: [
      "Heavy use of diminutives (-ito, -ita) for affection",
      "Reggaetón flow and rhythm patterns",
      "Caribbean vowel softening",
      "Romantic/sensual metaphors typical of PR urban music",
      "Mix of formal poetic Spanish with street-casual tone",
    ],
  },
  cultural: {
    genre: "Reggaetón / Latin Pop",
    mood: "Romantic, Sensual, Playful",
    theme: "Seduction and physical attraction",
    description:
      "This song blends reggaetón beats with romantic pop sensibility. The lyrics use a series of diminutives and body metaphors to express desire in a way that's playful rather than explicit. The 'despacito' (slowly) motif is a hallmark of Puerto Rican romantic reggaetón — the idea of savoring the moment.",
  },
  learnerNotes: [
    {
      type: "warning",
      text: "Many words here use diminutive forms (-ito/-ita) that you won't find in textbooks. A Dominican learner might hear 'despacito' and think it's a different word from 'despacio' — it's the same root!",
    },
    {
      type: "tip",
      text: "If you're learning Mexican Spanish, note that Mexicans would say 'despacio' or 'lentamente' in conversation. The '-ito' suffix is used differently across regions.",
    },
    {
      type: "info",
      text: "This song mixes poetic/literary Spanish ('laberinto', 'manuscrito') with casual Caribbean slang. In real conversation, Puerto Ricans wouldn't use words like 'manuscrito' — that's artistic license.",
    },
    {
      type: "tip",
      text: "The rhythm and flow of the words matter as much as meaning in reggaetón. Words are often chosen for how they sound when sung, not just their dictionary definition.",
    },
  ],
  dialectComparisons: MOCK_COMPARISONS,
};

// ─── COMPONENT ───────────────────────────────────────────────────────────────

interface SongAnalysisProps {
  lyrics?: string;
  songTitle?: string;
  artist?: string;
  sourceLanguage?: string;
  targetLanguage?: string;
  userDialect?: string;
  analysis?: SongAnalysisData;
  visible?: boolean;
}

export function SongAnalysis({
  lyrics,
  songTitle,
  artist,
  sourceLanguage = "Spanish",
  targetLanguage = "English",
  userDialect,
  analysis: externalAnalysis,
  visible = true,
}: SongAnalysisProps) {
  const [expandedSection, setExpandedSection] = useState<string | null>("dialect");
  const [analysisData, setAnalysisData] = useState<SongAnalysisData | null>(
    externalAnalysis || null
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedWords, setSavedWords] = useState<Set<string>>(new Set());
  const [savingWord, setSavingWord] = useState<string | null>(null);
  const [comparisonModal, setComparisonModal] = useState<DialectComparisonData | null>(null);

  const analyzeMutation = trpc.songAnalysis.analyze.useMutation();

  // Fetch AI analysis when lyrics are provided
  useEffect(() => {
    if (lyrics && !externalAnalysis) {
      fetchAnalysis();
    } else if (!lyrics && !externalAnalysis) {
      // Use mock data as fallback
      setAnalysisData(MOCK_ANALYSIS);
    }
  }, [lyrics]);

  // Check which words are already saved
  useEffect(() => {
    if (analysisData?.slangEntries) {
      checkSavedWords();
    }
  }, [analysisData]);

  const checkSavedWords = async () => {
    if (!analysisData) return;
    const saved = new Set<string>();
    for (const entry of analysisData.slangEntries) {
      const isSaved = await isSlangSaved(entry.word, entry.dialect);
      if (isSaved) saved.add(`${entry.word}_${entry.dialect}`);
    }
    setSavedWords(saved);
  };

  const fetchAnalysis = async () => {
    if (!lyrics) return;
    setLoading(true);
    setError(null);
    try {
      const result = await analyzeMutation.mutateAsync({
        lyrics,
        songTitle,
        artist,
        sourceLanguage,
        targetLanguage,
        userDialect,
      });
      if (result.success && result.data) {
        setAnalysisData(result.data as SongAnalysisData);
      } else {
        setError(result.error || "Analysis failed");
        // Fall back to mock data
        setAnalysisData(MOCK_ANALYSIS);
      }
    } catch (err: any) {
      setError(err.message || "Failed to analyze song");
      // Fall back to mock data
      setAnalysisData(MOCK_ANALYSIS);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveToFlashcards = async (entry: SlangEntry) => {
    const key = `${entry.word}_${entry.dialect}`;
    if (savedWords.has(key)) return;

    setSavingWord(entry.word);
    try {
      await saveSlangFlashcard({
        word: entry.word,
        meaning: entry.meaning,
        dialect: entry.dialect,
        dialectFlag: entry.dialectFlag,
        example: entry.example,
        note: entry.note,
        songTitle,
        artist,
      });
      setSavedWords((prev) => new Set([...prev, key]));
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (err) {
      Alert.alert("Error", "Failed to save flashcard");
    } finally {
      setSavingWord(null);
    }
  };

  const handleDialectCompare = (entry: SlangEntry) => {
    // Look for comparison data for this word
    const comparisons = analysisData?.dialectComparisons || MOCK_COMPARISONS;
    const match = comparisons.find(
      (c) => c.word.toLowerCase() === entry.word.toLowerCase()
    );
    if (match) {
      setComparisonModal(match);
    } else {
      // Create a basic comparison from the entry itself
      setComparisonModal({
        word: entry.word,
        variants: [
          {
            region: entry.dialect,
            flag: entry.dialectFlag,
            term: entry.word,
            usage: entry.meaning,
          },
        ],
      });
    }
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  if (!visible) return null;

  const toggleSection = (section: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedSection(expandedSection === section ? null : section);
  };

  // Loading state
  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={Colors.secondary} />
          <Text style={styles.loadingText}>Analyzing lyrics...</Text>
          <Text style={styles.loadingSubtext}>
            Detecting dialect, slang, and cultural context
          </Text>
        </View>
      </View>
    );
  }

  const analysis = analysisData || MOCK_ANALYSIS;

  return (
    <View style={styles.container}>
      {/* Section Header */}
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <Ionicons name="analytics" size={20} color={Colors.secondary} />
          <Text style={styles.headerTitle}>Song Analysis</Text>
        </View>
        <View style={styles.headerRight}>
          {error && (
            <TouchableOpacity onPress={fetchAnalysis} style={styles.retryButton}>
              <Ionicons name="refresh" size={14} color={Colors.warning} />
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          )}
          <View style={styles.aiBadge}>
            <Ionicons name="sparkles" size={12} color={Colors.gold} />
            <Text style={styles.aiBadgeText}>AI</Text>
          </View>
        </View>
      </View>

      {/* Dialect Detection */}
      <TouchableOpacity
        style={styles.sectionHeader}
        onPress={() => toggleSection("dialect")}
      >
        <View style={styles.sectionLeft}>
          <Text style={styles.sectionIcon}>{analysis.dialect.flag}</Text>
          <Text style={styles.sectionTitle}>Dialect Detected</Text>
        </View>
        <View style={styles.sectionRight}>
          <View style={styles.confidenceBadge}>
            <Text style={styles.confidenceText}>{analysis.dialect.confidence}%</Text>
          </View>
          <Ionicons
            name={expandedSection === "dialect" ? "chevron-up" : "chevron-down"}
            size={18}
            color={Colors.textSecondary}
          />
        </View>
      </TouchableOpacity>
      {expandedSection === "dialect" && (
        <View style={styles.sectionContent}>
          <Text style={styles.dialectName}>{analysis.dialect.detected}</Text>
          <View style={styles.characteristicsList}>
            {analysis.dialect.characteristics.map((char, i) => (
              <View key={i} style={styles.characteristicItem}>
                <View style={styles.bulletDot} />
                <Text style={styles.characteristicText}>{char}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Slang Breakdown */}
      <TouchableOpacity
        style={styles.sectionHeader}
        onPress={() => toggleSection("slang")}
      >
        <View style={styles.sectionLeft}>
          <Ionicons name="language" size={18} color={Colors.gold} />
          <Text style={styles.sectionTitle}>Slang & Regional Words</Text>
        </View>
        <View style={styles.sectionRight}>
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{analysis.slangEntries.length}</Text>
          </View>
          <Ionicons
            name={expandedSection === "slang" ? "chevron-up" : "chevron-down"}
            size={18}
            color={Colors.textSecondary}
          />
        </View>
      </TouchableOpacity>
      {expandedSection === "slang" && (
        <View style={styles.sectionContent}>
          {analysis.slangEntries.map((entry, i) => {
            const wordKey = `${entry.word}_${entry.dialect}`;
            const isSaved = savedWords.has(wordKey);
            const isSaving = savingWord === entry.word;

            return (
              <View key={i} style={styles.slangCard}>
                <View style={styles.slangHeader}>
                  <Text style={styles.slangWord}>{entry.word}</Text>
                  <View style={styles.dialectTag}>
                    <Text style={styles.dialectTagFlag}>{entry.dialectFlag}</Text>
                    <Text style={styles.dialectTagText}>{entry.dialect}</Text>
                  </View>
                </View>
                <Text style={styles.slangMeaning}>{entry.meaning}</Text>
                {entry.example && (
                  <View style={styles.exampleRow}>
                    <Ionicons name="chatbubble-ellipses" size={12} color={Colors.secondary} />
                    <Text style={styles.exampleText}>{entry.example}</Text>
                  </View>
                )}
                {entry.note && (
                  <View style={styles.noteRow}>
                    <Ionicons name="information-circle" size={12} color={Colors.gold} />
                    <Text style={styles.noteText}>{entry.note}</Text>
                  </View>
                )}

                {/* Action buttons: Compare + Save */}
                <View style={styles.slangActions}>
                  <TouchableOpacity
                    style={styles.compareButton}
                    onPress={() => handleDialectCompare(entry)}
                  >
                    <Ionicons name="git-compare" size={14} color={Colors.secondary} />
                    <Text style={styles.compareButtonText}>Compare Dialects</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.saveButton,
                      isSaved && styles.saveButtonSaved,
                    ]}
                    onPress={() => handleSaveToFlashcards(entry)}
                    disabled={isSaved || isSaving}
                  >
                    {isSaving ? (
                      <ActivityIndicator size={12} color={Colors.success} />
                    ) : (
                      <Ionicons
                        name={isSaved ? "checkmark-circle" : "add-circle-outline"}
                        size={14}
                        color={isSaved ? Colors.success : Colors.gold}
                      />
                    )}
                    <Text
                      style={[
                        styles.saveButtonText,
                        isSaved && styles.saveButtonTextSaved,
                      ]}
                    >
                      {isSaved ? "Saved" : "Flashcard"}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
        </View>
      )}

      {/* Cultural Context */}
      <TouchableOpacity
        style={styles.sectionHeader}
        onPress={() => toggleSection("cultural")}
      >
        <View style={styles.sectionLeft}>
          <Ionicons name="globe" size={18} color={Colors.accent} />
          <Text style={styles.sectionTitle}>Cultural Context</Text>
        </View>
        <Ionicons
          name={expandedSection === "cultural" ? "chevron-up" : "chevron-down"}
          size={18}
          color={Colors.textSecondary}
        />
      </TouchableOpacity>
      {expandedSection === "cultural" && (
        <View style={styles.sectionContent}>
          <View style={styles.culturalMeta}>
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>Genre</Text>
              <Text style={styles.metaValue}>{analysis.cultural.genre}</Text>
            </View>
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>Mood</Text>
              <Text style={styles.metaValue}>{analysis.cultural.mood}</Text>
            </View>
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>Theme</Text>
              <Text style={styles.metaValue}>{analysis.cultural.theme}</Text>
            </View>
          </View>
          <Text style={styles.culturalDescription}>{analysis.cultural.description}</Text>
        </View>
      )}

      {/* Learner Notes */}
      <TouchableOpacity
        style={styles.sectionHeader}
        onPress={() => toggleSection("notes")}
      >
        <View style={styles.sectionLeft}>
          <Ionicons name="school" size={18} color={Colors.success} />
          <Text style={styles.sectionTitle}>Learner Notes</Text>
        </View>
        <Ionicons
          name={expandedSection === "notes" ? "chevron-up" : "chevron-down"}
          size={18}
          color={Colors.textSecondary}
        />
      </TouchableOpacity>
      {expandedSection === "notes" && (
        <View style={styles.sectionContent}>
          {analysis.learnerNotes.map((note, i) => (
            <View
              key={i}
              style={[
                styles.noteCard,
                note.type === "warning" && styles.noteCardWarning,
                note.type === "tip" && styles.noteCardTip,
                note.type === "info" && styles.noteCardInfo,
              ]}
            >
              <Ionicons
                name={
                  note.type === "warning"
                    ? "alert-circle"
                    : note.type === "tip"
                    ? "bulb"
                    : "information-circle"
                }
                size={16}
                color={
                  note.type === "warning"
                    ? Colors.warning
                    : note.type === "tip"
                    ? Colors.success
                    : Colors.secondary
                }
              />
              <Text style={styles.noteCardText}>{note.text}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Dialect Comparison Modal */}
      <DialectComparisonModal
        visible={!!comparisonModal}
        onClose={() => setComparisonModal(null)}
        comparison={comparisonModal}
        userDialect={userDialect}
      />
    </View>
  );
}

// ─── STYLES ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
    backgroundColor: Colors.surfaceCard,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: "hidden",
  },
  loadingContainer: {
    padding: Spacing.xl,
    alignItems: "center",
    gap: Spacing.sm,
  },
  loadingText: {
    fontSize: FontSize.md,
    fontWeight: "600",
    color: Colors.textPrimary,
    marginTop: Spacing.sm,
  },
  loadingSubtext: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.surfaceElevated,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  headerTitle: {
    fontSize: FontSize.md,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  retryButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: Colors.warning + "15",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  retryText: {
    fontSize: FontSize.xs,
    fontWeight: "600",
    color: Colors.warning,
  },
  aiBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: Colors.goldGlow,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.goldBorder,
  },
  aiBadgeText: {
    fontSize: FontSize.xs,
    fontWeight: "700",
    color: Colors.gold,
  },

  // Section headers
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.border,
  },
  sectionLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  sectionIcon: {
    fontSize: 18,
  },
  sectionTitle: {
    fontSize: FontSize.sm,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  sectionRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  confidenceBadge: {
    backgroundColor: Colors.success + "20",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  confidenceText: {
    fontSize: FontSize.xs,
    fontWeight: "700",
    color: Colors.success,
  },
  countBadge: {
    backgroundColor: Colors.gold + "20",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
    minWidth: 24,
    alignItems: "center",
  },
  countText: {
    fontSize: FontSize.xs,
    fontWeight: "700",
    color: Colors.gold,
  },

  // Section content
  sectionContent: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.primary + "80",
  },

  // Dialect section
  dialectName: {
    fontSize: FontSize.md,
    fontWeight: "700",
    color: Colors.secondary,
    marginBottom: Spacing.sm,
  },
  characteristicsList: {
    gap: 6,
  },
  characteristicItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.sm,
  },
  bulletDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: Colors.secondary,
    marginTop: 6,
  },
  characteristicText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    flex: 1,
    lineHeight: 18,
  },

  // Slang section
  slangCard: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  slangHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  slangWord: {
    fontSize: FontSize.md,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  dialectTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: Colors.surfaceCard,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  dialectTagFlag: {
    fontSize: 12,
  },
  dialectTagText: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    fontWeight: "600",
  },
  slangMeaning: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 18,
    marginBottom: 6,
  },
  exampleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
    marginTop: 4,
  },
  exampleText: {
    fontSize: FontSize.xs,
    color: Colors.secondary,
    fontStyle: "italic",
    flex: 1,
    lineHeight: 16,
  },
  noteRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
    marginTop: 6,
    backgroundColor: Colors.goldGlow,
    padding: 8,
    borderRadius: BorderRadius.sm,
  },
  noteText: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    flex: 1,
    lineHeight: 16,
  },

  // Slang action buttons
  slangActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginTop: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  compareButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: Colors.secondary + "15",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.secondary + "30",
  },
  compareButtonText: {
    fontSize: FontSize.xs,
    fontWeight: "600",
    color: Colors.secondary,
  },
  saveButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: Colors.gold + "15",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.gold + "30",
  },
  saveButtonSaved: {
    backgroundColor: Colors.success + "15",
    borderColor: Colors.success + "30",
  },
  saveButtonText: {
    fontSize: FontSize.xs,
    fontWeight: "600",
    color: Colors.gold,
  },
  saveButtonTextSaved: {
    color: Colors.success,
  },

  // Cultural section
  culturalMeta: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  metaItem: {
    backgroundColor: Colors.surfaceElevated,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  metaLabel: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  metaValue: {
    fontSize: FontSize.sm,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  culturalDescription: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
  },

  // Learner notes
  noteCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
  },
  noteCardWarning: {
    backgroundColor: Colors.warning + "10",
    borderColor: Colors.warning + "30",
  },
  noteCardTip: {
    backgroundColor: Colors.success + "10",
    borderColor: Colors.success + "30",
  },
  noteCardInfo: {
    backgroundColor: Colors.secondary + "10",
    borderColor: Colors.secondary + "30",
  },
  noteCardText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    flex: 1,
    lineHeight: 18,
  },
});
