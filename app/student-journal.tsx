/**
 * Student Journal / Diary Screen
 * 
 * Students write short entries in the target language.
 * The AI teacher responds with corrections and encouragement,
 * building a personal relationship over time.
 * 
 * Includes streak tracking with milestone badges, progress bar,
 * celebration modal for achievements, and AI-generated writing prompts
 * matched to student vocabulary level and recent lessons.
 */
import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View, Text, TextInput, FlatList, Pressable, ActivityIndicator,
  KeyboardAvoidingView, Platform, Alert, StyleSheet, Modal, ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ScreenContainer } from "@/components/screen-container";
import { Colors, Spacing, FontSize, BorderRadius } from "@/constants/Colors";
import { createVanillaClient } from "@/lib/trpc";
import { getStudentName } from "@/lib/teacher-memory";
import { getCompanionContext } from "@/lib/wave-cloud-memory";
import { getStruggles } from "@/lib/learning-intelligence";
import { getRecentLessonVocabulary } from "@/lib/teacher-texts-engine";
import {
  recordJournalEntry,
  getJournalStreakInfo,
  getCurrentBadge,
  getNextBadge,
  JOURNAL_BADGE_TIERS_LIST,
  type JournalStreakInfo,
  type JournalBadgeNotification,
} from "@/lib/journal-streak";

const JOURNAL_KEY = "@student_journal_entries";
const JOURNAL_PROMPTS_HISTORY_KEY = "@journal_prompts_history";

interface JournalCorrection {
  original: string;
  corrected: string;
  explanation: string;
}

interface JournalVocab {
  word: string;
  meaning: string;
  example: string;
}

interface JournalEntry {
  id: string;
  text: string;
  timestamp: number;
  language: string;
  corrections: JournalCorrection[];
  encouragement: string;
  newVocab: JournalVocab[];
  grammarTip: string;
  overallScore: number;
  streakMessage: string;
  isProcessing?: boolean;
}

interface AIPrompt {
  prompt_target: string;
  prompt_english: string;
  difficulty: "easy" | "medium" | "challenge";
  vocabulary_hint: string;
}

export default function StudentJournalScreen() {
  const router = useRouter();
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [newEntry, setNewEntry] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [expandedEntry, setExpandedEntry] = useState<string | null>(null);
  const [targetLanguage, setTargetLanguage] = useState("Spanish");
  const [targetLangCode, setTargetLangCode] = useState("es");
  const [cefrLevel, setCefrLevel] = useState("A1");
  const [streakInfo, setStreakInfo] = useState<JournalStreakInfo | null>(null);
  const [showBadgeModal, setShowBadgeModal] = useState(false);
  const [badgeNotification, setBadgeNotification] = useState<JournalBadgeNotification | null>(null);
  const [showBadgesSheet, setShowBadgesSheet] = useState(false);
  // AI Prompts state
  const [aiPrompts, setAiPrompts] = useState<AIPrompt[]>([]);
  const [isLoadingPrompts, setIsLoadingPrompts] = useState(false);
  const [selectedPromptIndex, setSelectedPromptIndex] = useState<number | null>(null);
  const [previousPrompts, setPreviousPrompts] = useState<string[]>([]);
  const flatListRef = useRef<FlatList>(null);

  const langNameMap: Record<string, string> = {
    es: "Spanish", fr: "French", pt: "Portuguese", de: "German",
    it: "Italian", ja: "Japanese", ko: "Korean", zh: "Chinese",
    ar: "Arabic", en: "English",
  };

  useEffect(() => {
    loadEntries();
    loadSettings();
    loadStreakInfo();
    loadPreviousPrompts();
  }, []);

  const loadSettings = async () => {
    try {
      const lang = await AsyncStorage.getItem("@target_language");
      if (lang) {
        setTargetLangCode(lang);
        setTargetLanguage(langNameMap[lang] || "Spanish");
      }
      const level = await AsyncStorage.getItem("@cefr_level");
      if (level) setCefrLevel(level);
    } catch {}
  };

  const loadEntries = async () => {
    try {
      const stored = await AsyncStorage.getItem(JOURNAL_KEY);
      if (stored) {
        const parsed: JournalEntry[] = JSON.parse(stored);
        setEntries(parsed);
      }
    } catch {}
  };

  const loadStreakInfo = async () => {
    try {
      const info = await getJournalStreakInfo();
      setStreakInfo(info);
    } catch {}
  };

  const loadPreviousPrompts = async () => {
    try {
      const stored = await AsyncStorage.getItem(JOURNAL_PROMPTS_HISTORY_KEY);
      if (stored) setPreviousPrompts(JSON.parse(stored));
    } catch {}
  };

  const saveEntries = async (updated: JournalEntry[]) => {
    try {
      await AsyncStorage.setItem(JOURNAL_KEY, JSON.stringify(updated));
    } catch {}
  };

  // ─── AI Prompt Generation ──────────────────────────────────────────────
  const loadAIPrompts = useCallback(async () => {
    setIsLoadingPrompts(true);
    try {
      const vanillaClient = createVanillaClient();
      const studentName = await getStudentName();
      const struggles = await getStruggles();
      const lang = (await AsyncStorage.getItem("@target_language")) || "es";
      const level = (await AsyncStorage.getItem("@cefr_level")) || "A1";
      const recentVocab = await getRecentLessonVocabulary(lang, level);
      const streakData = await getJournalStreakInfo();

      const result = await vanillaClient.waveCloudChat.generateJournalPrompt.mutate({
        studentName,
        targetLanguage: langNameMap[lang] || "Spanish",
        cefrLevel: level,
        recentVocabulary: recentVocab,
        recentTopics: [],
        recentStruggles: struggles.map((s) => s.topic).slice(0, 3),
        journalStreak: streakData.currentStreak,
        previousPrompts,
      });

      if (result.prompts && result.prompts.length > 0) {
        setAiPrompts(result.prompts.slice(0, 3));
        // Save used prompts to history
        const newHistory = [
          ...previousPrompts,
          ...result.prompts.map((p: AIPrompt) => p.prompt_english),
        ].slice(-20);
        setPreviousPrompts(newHistory);
        await AsyncStorage.setItem(JOURNAL_PROMPTS_HISTORY_KEY, JSON.stringify(newHistory));
      }
    } catch {
      // Fallback prompts if server fails
      setAiPrompts([
        { prompt_target: "¿Cómo fue tu día hoy?", prompt_english: "How was your day today?", difficulty: "easy", vocabulary_hint: "fue, hoy" },
        { prompt_target: "Describe tu comida favorita.", prompt_english: "Describe your favorite food.", difficulty: "medium", vocabulary_hint: "favorita, delicioso" },
        { prompt_target: "¿Qué harás mañana?", prompt_english: "What will you do tomorrow?", difficulty: "challenge", vocabulary_hint: "mañana, planes" },
      ]);
    }
    setIsLoadingPrompts(false);
  }, [previousPrompts]);

  // Load prompts when settings are loaded
  useEffect(() => {
    if (targetLanguage) {
      loadAIPrompts();
    }
  }, [targetLanguage]);

  const selectPrompt = (index: number) => {
    setSelectedPromptIndex(index);
    const prompt = aiPrompts[index];
    if (prompt) {
      // Pre-fill with the target language prompt as a starting point
      setNewEntry(prompt.prompt_target + "\n\n");
    }
  };

  const handleSubmit = useCallback(async () => {
    if (!newEntry.trim() || isSubmitting) return;
    setIsSubmitting(true);
    const entryId = `j_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const placeholderEntry: JournalEntry = {
      id: entryId,
      text: newEntry.trim(),
      timestamp: Date.now(),
      language: targetLanguage,
      corrections: [],
      encouragement: "",
      newVocab: [],
      grammarTip: "",
      overallScore: 0,
      streakMessage: "",
      isProcessing: true,
    };
    const updatedWithPlaceholder = [placeholderEntry, ...entries];
    setEntries(updatedWithPlaceholder);
    setNewEntry("");
    setSelectedPromptIndex(null);
    setExpandedEntry(entryId);

    // Record journal entry for streak tracking
    try {
      const { streak, notification } = await recordJournalEntry();
      if (notification) {
        setBadgeNotification(notification);
        setShowBadgeModal(true);
      }
      // Refresh streak info
      const info = await getJournalStreakInfo();
      setStreakInfo(info);
    } catch {}

    try {
      const vanillaClient = createVanillaClient();
      const studentName = await getStudentName();
      const memoryContext = await getCompanionContext();

      const result = await vanillaClient.waveCloudChat.correctJournalEntry.mutate({
        studentName,
        targetLanguage,
        cefrLevel,
        journalEntry: placeholderEntry.text,
        memoryContext: memoryContext.slice(0, 500),
      });

      const completedEntry: JournalEntry = {
        ...placeholderEntry,
        corrections: result.corrections || [],
        encouragement: result.encouragement || "Great job writing today!",
        newVocab: result.newVocab || [],
        grammarTip: result.grammarTip || "",
        overallScore: result.overallScore || 7,
        streakMessage: result.streakMessage || "Keep writing!",
        isProcessing: false,
      };

      const finalEntries = [completedEntry, ...entries];
      setEntries(finalEntries);
      await saveEntries(finalEntries);
    } catch {
      const fallbackEntry: JournalEntry = {
        ...placeholderEntry,
        encouragement: "Great effort! Keep writing every day.",
        overallScore: 7,
        streakMessage: "Every entry counts!",
        isProcessing: false,
      };
      const finalEntries = [fallbackEntry, ...entries];
      setEntries(finalEntries);
      await saveEntries(finalEntries);
    }
    setIsSubmitting(false);
  }, [newEntry, entries, isSubmitting, targetLanguage, cefrLevel]);

  const getScoreColor = (score: number) => {
    if (score >= 8) return Colors.success;
    if (score >= 5) return Colors.gold;
    return Colors.error;
  };

  const getScoreLabel = (score: number) => {
    if (score >= 9) return "Excellent!";
    if (score >= 7) return "Great work!";
    if (score >= 5) return "Good effort!";
    if (score >= 3) return "Keep practicing!";
    return "You'll get there!";
  };

  const formatDate = (ts: number) => {
    const d = new Date(ts);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const isYesterday = d.toDateString() === yesterday.toDateString();
    if (isToday) return `Today at ${d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`;
    if (isYesterday) return `Yesterday at ${d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`;
    return d.toLocaleDateString([], { month: "short", day: "numeric" });
  };

  const deleteEntry = (entryId: string) => {
    Alert.alert("Delete Entry", "Are you sure you want to delete this journal entry?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete", style: "destructive",
        onPress: async () => {
          const updated = entries.filter((e) => e.id !== entryId);
          setEntries(updated);
          await saveEntries(updated);
          if (expandedEntry === entryId) setExpandedEntry(null);
        },
      },
    ]);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "easy": return Colors.success;
      case "medium": return Colors.gold;
      case "challenge": return Colors.neonPurple;
      default: return Colors.muted;
    }
  };

  const getDifficultyIcon = (difficulty: string) => {
    switch (difficulty) {
      case "easy": return "leaf";
      case "medium": return "flash";
      case "challenge": return "rocket";
      default: return "star";
    }
  };

  // ─── Streak Header Component ───────────────────────────────────────────
  const StreakHeader = () => {
    if (!streakInfo) return null;
    const currentBadge = getCurrentBadge(streakInfo.currentStreak);
    const nextBadgeInfo = getNextBadge(streakInfo.currentStreak);

    return (
      <Pressable
        style={s.streakCard}
        onPress={() => setShowBadgesSheet(true)}
      >
        <View style={s.streakCardTop}>
          <View style={s.streakIconRow}>
            <Text style={s.streakBadgeIcon}>{currentBadge.icon}</Text>
            <View style={s.streakInfoCol}>
              <Text style={s.streakBadgeName}>{currentBadge.name}</Text>
              <Text style={s.streakDaysText}>
                {streakInfo.currentStreak} day streak
                {streakInfo.totalEntries > 0 ? ` · ${streakInfo.totalEntries} entries` : ""}
              </Text>
            </View>
          </View>
          <View style={s.streakFireBadge}>
            <Ionicons name="flame" size={18} color={Colors.gold} />
            <Text style={s.streakFireText}>{streakInfo.currentStreak}</Text>
          </View>
        </View>

        {/* Progress bar to next badge */}
        {nextBadgeInfo && (
          <View style={s.progressSection}>
            <View style={s.progressBarBg}>
              <View
                style={[
                  s.progressBarFill,
                  {
                    width: `${Math.min(streakInfo.progressPercent, 100)}%`,
                    backgroundColor: currentBadge.color === "#9BA1A6" ? Colors.neonPurple : currentBadge.color,
                  },
                ]}
              />
            </View>
            <Text style={s.progressLabel}>
              {nextBadgeInfo.icon} {streakInfo.daysToNextTier} days to {nextBadgeInfo.name}
            </Text>
          </View>
        )}

        <Text style={s.streakTapHint}>Tap to view all badges</Text>
      </Pressable>
    );
  };

  // ─── AI Prompts Carousel ───────────────────────────────────────────────
  const AIPromptsSection = () => {
    if (todayHasEntry && aiPrompts.length === 0) return null;

    return (
      <View style={s.promptsSection}>
        <View style={s.promptsHeader}>
          <View style={s.promptsHeaderLeft}>
            <Ionicons name="sparkles" size={16} color={Colors.neonPurple} />
            <Text style={s.promptsSectionTitle}>Writing Prompts</Text>
          </View>
          <Pressable
            onPress={loadAIPrompts}
            disabled={isLoadingPrompts}
            style={({ pressed }) => [s.refreshBtn, pressed && { opacity: 0.6 }]}
          >
            {isLoadingPrompts ? (
              <ActivityIndicator size="small" color={Colors.neonPurple} />
            ) : (
              <View style={s.refreshBtnInner}>
                <Ionicons name="refresh" size={14} color={Colors.neonPurple} />
                <Text style={s.refreshBtnText}>Refresh</Text>
              </View>
            )}
          </Pressable>
        </View>

        {isLoadingPrompts && aiPrompts.length === 0 ? (
          <View style={s.promptsLoading}>
            <ActivityIndicator size="small" color={Colors.neonPurple} />
            <Text style={s.promptsLoadingText}>Generating prompts for you...</Text>
          </View>
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={s.promptsScroll}
          >
            {aiPrompts.map((prompt, index) => (
              <Pressable
                key={index}
                style={({ pressed }) => [
                  s.promptCard,
                  selectedPromptIndex === index && s.promptCardSelected,
                  pressed && { opacity: 0.8, transform: [{ scale: 0.97 }] },
                ]}
                onPress={() => selectPrompt(index)}
              >
                {/* Difficulty badge */}
                <View style={[s.difficultyBadge, { backgroundColor: getDifficultyColor(prompt.difficulty) + "20" }]}>
                  <Ionicons
                    name={getDifficultyIcon(prompt.difficulty) as any}
                    size={12}
                    color={getDifficultyColor(prompt.difficulty)}
                  />
                  <Text style={[s.difficultyText, { color: getDifficultyColor(prompt.difficulty) }]}>
                    {prompt.difficulty}
                  </Text>
                </View>

                {/* Prompt text in target language */}
                <Text style={s.promptTargetText} numberOfLines={2}>
                  {prompt.prompt_target}
                </Text>

                {/* English translation */}
                <Text style={s.promptEnglishText} numberOfLines={2}>
                  {prompt.prompt_english}
                </Text>

                {/* Vocabulary hint */}
                {prompt.vocabulary_hint && (
                  <View style={s.vocabHintRow}>
                    <Ionicons name="bulb-outline" size={12} color={Colors.gold} />
                    <Text style={s.vocabHintText}>
                      Try: {prompt.vocabulary_hint}
                    </Text>
                  </View>
                )}

                {/* Tap to use indicator */}
                <View style={s.tapToUseRow}>
                  <Ionicons name="create-outline" size={12} color={Colors.neonPurple} />
                  <Text style={s.tapToUseText}>Tap to use</Text>
                </View>
              </Pressable>
            ))}
          </ScrollView>
        )}
      </View>
    );
  };

  // ─── Badge Celebration Modal ───────────────────────────────────────────
  const BadgeCelebrationModal = () => {
    if (!badgeNotification) return null;
    const { badge, message, celebrationLevel } = badgeNotification;
    const isEpic = celebrationLevel === "epic" || celebrationLevel === "large";

    return (
      <Modal visible={showBadgeModal} transparent animationType="fade">
        <View style={s.modalOverlay}>
          <View style={s.celebrationCard}>
            <Text style={s.celebrationEmoji}>
              {isEpic ? "🎉🏆🎉" : celebrationLevel === "medium" ? "🎉⭐🎉" : "✨🎉✨"}
            </Text>
            <Text style={[s.celebrationBadgeIcon, { fontSize: 56 }]}>{badge.icon}</Text>
            <Text style={[s.celebrationTitle, { color: badge.color }]}>{badge.name}</Text>
            <Text style={s.celebrationMessage}>{message}</Text>
            <Text style={s.celebrationDesc}>{badge.description}</Text>
            <Pressable
              style={({ pressed }) => [s.celebrationBtn, pressed && { opacity: 0.8 }]}
              onPress={() => setShowBadgeModal(false)}
            >
              <Text style={s.celebrationBtnText}>Keep Writing!</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    );
  };

  // ─── Badges Sheet Modal ────────────────────────────────────────────────
  const BadgesSheetModal = () => {
    if (!streakInfo) return null;

    return (
      <Modal visible={showBadgesSheet} transparent animationType="slide">
        <View style={s.modalOverlay}>
          <View style={s.badgesSheet}>
            <View style={s.badgesSheetHeader}>
              <Text style={s.badgesSheetTitle}>Journal Badges</Text>
              <Pressable onPress={() => setShowBadgesSheet(false)}>
                <Ionicons name="close-circle" size={28} color={Colors.muted} />
              </Pressable>
            </View>

            {/* Stats row */}
            <View style={s.statsRow}>
              <View style={s.statItem}>
                <Ionicons name="flame" size={20} color={Colors.gold} />
                <Text style={s.statValue}>{streakInfo.currentStreak}</Text>
                <Text style={s.statLabel}>Current</Text>
              </View>
              <View style={s.statDivider} />
              <View style={s.statItem}>
                <Ionicons name="trophy" size={20} color={Colors.neonPurple} />
                <Text style={s.statValue}>{streakInfo.longestStreak}</Text>
                <Text style={s.statLabel}>Longest</Text>
              </View>
              <View style={s.statDivider} />
              <View style={s.statItem}>
                <Ionicons name="document-text" size={20} color={Colors.success} />
                <Text style={s.statValue}>{streakInfo.totalEntries}</Text>
                <Text style={s.statLabel}>Entries</Text>
              </View>
              <View style={s.statDivider} />
              <View style={s.statItem}>
                <Ionicons name="medal" size={20} color={Colors.gold} />
                <Text style={s.statValue}>{streakInfo.totalBadgesEarned}</Text>
                <Text style={s.statLabel}>Badges</Text>
              </View>
            </View>

            {/* Badge tiers */}
            <ScrollView style={s.badgesList}>
              {JOURNAL_BADGE_TIERS_LIST.map((tier) => {
                const earned = streakInfo.badges.find((b) => b.tier === tier.tier);
                const isEarned = !!earned?.earnedAt;
                const isCurrent = streakInfo.currentTier === tier.tier;

                return (
                  <View
                    key={tier.tier}
                    style={[
                      s.badgeTierRow,
                      isCurrent && s.badgeTierRowCurrent,
                      !isEarned && s.badgeTierRowLocked,
                    ]}
                  >
                    <Text style={[s.badgeTierIcon, !isEarned && { opacity: 0.3 }]}>
                      {tier.icon}
                    </Text>
                    <View style={s.badgeTierInfo}>
                      <Text style={[s.badgeTierName, !isEarned && { color: Colors.muted }]}>
                        {tier.name}
                      </Text>
                      <Text style={s.badgeTierDesc}>{tier.description}</Text>
                      {isEarned && earned?.earnedAt && (
                        <Text style={s.badgeTierEarned}>
                          Earned {new Date(earned.earnedAt).toLocaleDateString()}
                        </Text>
                      )}
                    </View>
                    <View style={s.badgeTierDays}>
                      <Text style={[s.badgeTierDaysText, { color: isEarned ? tier.color : Colors.muted }]}>
                        {tier.minStreak}d
                      </Text>
                      {isEarned ? (
                        <Ionicons name="checkmark-circle" size={18} color={Colors.success} />
                      ) : (
                        <Ionicons name="lock-closed" size={16} color={Colors.muted} />
                      )}
                    </View>
                  </View>
                );
              })}
            </ScrollView>

            <Pressable
              style={({ pressed }) => [s.closeBadgesBtn, pressed && { opacity: 0.8 }]}
              onPress={() => setShowBadgesSheet(false)}
            >
              <Text style={s.closeBadgesBtnText}>Close</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    );
  };

  // ─── Entry Renderer ────────────────────────────────────────────────────
  const renderEntry = ({ item }: { item: JournalEntry }) => {
    const isExpanded = expandedEntry === item.id;
    return (
      <Pressable
        style={[s.entryCard, isExpanded && s.entryCardExpanded]}
        onPress={() => setExpandedEntry(isExpanded ? null : item.id)}
        onLongPress={() => deleteEntry(item.id)}
      >
        <View style={s.entryHeader}>
          <Text style={s.entryDate}>{formatDate(item.timestamp)}</Text>
          {item.overallScore > 0 && (
            <View style={[s.scoreBadge, { backgroundColor: getScoreColor(item.overallScore) + "20" }]}>
              <Text style={[s.scoreText, { color: getScoreColor(item.overallScore) }]}>
                {item.overallScore}/10
              </Text>
            </View>
          )}
        </View>

        <Text style={s.entryText} numberOfLines={isExpanded ? undefined : 3}>
          {item.text}
        </Text>

        {item.isProcessing && (
          <View style={s.processingRow}>
            <ActivityIndicator size="small" color={Colors.neonPurple} />
            <Text style={s.processingText}>Your teacher is reading...</Text>
          </View>
        )}

        {isExpanded && !item.isProcessing && (
          <View style={s.feedbackSection}>
            {item.encouragement ? (
              <View style={s.encouragementBox}>
                <Ionicons name="heart" size={16} color={Colors.neonPurple} />
                <Text style={s.encouragementText}>{item.encouragement}</Text>
              </View>
            ) : null}

            {item.corrections.length > 0 && (
              <View style={s.correctionsSection}>
                <Text style={s.sectionTitle}>
                  <Ionicons name="pencil" size={14} color={Colors.gold} /> Corrections
                </Text>
                {item.corrections.map((c, i) => (
                  <View key={i} style={s.correctionItem}>
                    <Text style={s.correctionOriginal}>{c.original}</Text>
                    <Ionicons name="arrow-forward" size={12} color={Colors.muted} style={{ marginHorizontal: 6 }} />
                    <Text style={s.correctionFixed}>{c.corrected}</Text>
                    {c.explanation ? (
                      <Text style={s.correctionExplanation}>{c.explanation}</Text>
                    ) : null}
                  </View>
                ))}
              </View>
            )}

            {item.grammarTip ? (
              <View style={s.tipBox}>
                <Ionicons name="bulb" size={14} color={Colors.gold} />
                <Text style={s.tipText}>{item.grammarTip}</Text>
              </View>
            ) : null}

            {item.newVocab.length > 0 && (
              <View style={s.vocabSection}>
                <Text style={s.sectionTitle}>
                  <Ionicons name="book" size={14} color={Colors.success} /> New Words
                </Text>
                {item.newVocab.map((v, i) => (
                  <View key={i} style={s.vocabItem}>
                    <Text style={s.vocabWord}>{v.word}</Text>
                    <Text style={s.vocabMeaning}>{v.meaning}</Text>
                    {v.example ? <Text style={s.vocabExample}>"{v.example}"</Text> : null}
                  </View>
                ))}
              </View>
            )}

            {item.overallScore > 0 && (
              <Text style={[s.scoreLabel, { color: getScoreColor(item.overallScore) }]}>
                {getScoreLabel(item.overallScore)}
              </Text>
            )}
          </View>
        )}

        {!isExpanded && item.encouragement && !item.isProcessing && (
          <Text style={s.previewEncouragement} numberOfLines={1}>
            {item.encouragement}
          </Text>
        )}
      </Pressable>
    );
  };

  const todayHasEntry = entries.some(
    (e) => new Date(e.timestamp).toDateString() === new Date().toDateString()
  );

  return (
    <ScreenContainer edges={["top", "left", "right"]}>
      <KeyboardAvoidingView
        style={s.container}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        {/* Header */}
        <View style={s.header}>
          <Pressable onPress={() => router.back()} style={({ pressed }) => [s.backBtn, pressed && { opacity: 0.6 }]}>
            <Ionicons name="chevron-back" size={24} color={Colors.textPrimary} />
          </Pressable>
          <View style={s.headerCenter}>
            <Text style={s.headerTitle}>My Journal</Text>
            <Text style={s.headerSubtitle}>Write in {targetLanguage}</Text>
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Pressable
              onPress={() => router.push("/journal-analytics" as any)}
              style={({ pressed }) => [{ padding: 4 }, pressed && { opacity: 0.6 }]}
            >
              <Ionicons name="analytics-outline" size={22} color={Colors.textPrimary} />
            </Pressable>
            <Pressable
              style={s.streakHeaderBadge}
              onPress={() => setShowBadgesSheet(true)}
            >
              <Ionicons name="flame" size={16} color={Colors.gold} />
              <Text style={s.streakHeaderText}>{streakInfo?.currentStreak || 0}</Text>
            </Pressable>
          </View>
        </View>

        {/* Streak card */}
        <StreakHeader />

        {/* AI Writing Prompts */}
        {!todayHasEntry && <AIPromptsSection />}

        {/* Journal entries list */}
        <FlatList
          ref={flatListRef}
          data={entries}
          keyExtractor={(item) => item.id}
          renderItem={renderEntry}
          contentContainerStyle={s.listContent}
          ListEmptyComponent={
            <View style={s.emptyState}>
              <Ionicons name="book-outline" size={48} color={Colors.muted} />
              <Text style={s.emptyTitle}>Start Your Journal</Text>
              <Text style={s.emptyText}>
                Write your first entry in {targetLanguage} below. Your teacher will read it and respond with corrections, new vocabulary, and encouragement.
              </Text>
            </View>
          }
        />

        {/* Input area */}
        <View style={s.inputArea}>
          <View style={s.inputRow}>
            <TextInput
              style={s.textInput}
              placeholder={`Write in ${targetLanguage}...`}
              placeholderTextColor={Colors.muted}
              value={newEntry}
              onChangeText={setNewEntry}
              multiline
              maxLength={2000}
              returnKeyType="default"
            />
            <Pressable
              onPress={handleSubmit}
              disabled={!newEntry.trim() || isSubmitting}
              style={({ pressed }) => [
                s.sendBtn,
                (!newEntry.trim() || isSubmitting) && s.sendBtnDisabled,
                pressed && { opacity: 0.7 },
              ]}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Ionicons name="send" size={20} color="#fff" />
              )}
            </Pressable>
          </View>
          <Text style={s.charCount}>{newEntry.length}/2000</Text>
        </View>
      </KeyboardAvoidingView>

      {/* Modals */}
      <BadgeCelebrationModal />
      <BadgesSheetModal />
    </ScreenContainer>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row", alignItems: "center", paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm, borderBottomWidth: 0.5, borderBottomColor: Colors.borderLight,
  },
  backBtn: { padding: 4 },
  headerCenter: { flex: 1, marginLeft: Spacing.sm },
  headerTitle: { fontSize: FontSize.lg, fontWeight: "700", color: Colors.textPrimary },
  headerSubtitle: { fontSize: FontSize.xs, color: Colors.muted, marginTop: 1 },
  streakHeaderBadge: {
    flexDirection: "row", alignItems: "center", backgroundColor: Colors.gold + "20",
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, gap: 4,
  },
  streakHeaderText: { fontSize: FontSize.sm, fontWeight: "700", color: Colors.gold },

  // ─── Streak Card ─────────────────────────────────────────────────────
  streakCard: {
    marginHorizontal: Spacing.md, marginTop: Spacing.sm, backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg, padding: Spacing.md, borderWidth: 0.5,
    borderColor: Colors.borderLight,
  },
  streakCardTop: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
  },
  streakIconRow: { flexDirection: "row", alignItems: "center", gap: Spacing.sm },
  streakBadgeIcon: { fontSize: 28 },
  streakInfoCol: {},
  streakBadgeName: { fontSize: FontSize.base, fontWeight: "700", color: Colors.textPrimary },
  streakDaysText: { fontSize: FontSize.xs, color: Colors.muted, marginTop: 1 },
  streakFireBadge: {
    flexDirection: "row", alignItems: "center", backgroundColor: Colors.gold + "15",
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 14, gap: 4,
  },
  streakFireText: { fontSize: FontSize.lg, fontWeight: "800", color: Colors.gold },
  progressSection: { marginTop: Spacing.sm },
  progressBarBg: {
    height: 6, backgroundColor: Colors.borderLight, borderRadius: 3, overflow: "hidden",
  },
  progressBarFill: { height: 6, borderRadius: 3 },
  progressLabel: {
    fontSize: FontSize.xs, color: Colors.muted, marginTop: 4, textAlign: "center",
  },
  streakTapHint: {
    fontSize: 10, color: Colors.muted, textAlign: "center", marginTop: 6, opacity: 0.6,
  },

  // ─── AI Prompts Section ─────────────────────────────────────────────
  promptsSection: {
    marginHorizontal: Spacing.md, marginTop: Spacing.sm,
  },
  promptsHeader: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    marginBottom: Spacing.sm,
  },
  promptsHeaderLeft: {
    flexDirection: "row", alignItems: "center", gap: 6,
  },
  promptsSectionTitle: {
    fontSize: FontSize.sm, fontWeight: "700", color: Colors.textPrimary,
  },
  refreshBtn: {
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12,
    backgroundColor: Colors.neonPurple + "10",
  },
  refreshBtnInner: {
    flexDirection: "row", alignItems: "center", gap: 4,
  },
  refreshBtnText: {
    fontSize: FontSize.xs, fontWeight: "600", color: Colors.neonPurple,
  },
  promptsLoading: {
    flexDirection: "row", alignItems: "center", gap: 8,
    paddingVertical: Spacing.md, justifyContent: "center",
  },
  promptsLoadingText: {
    fontSize: FontSize.sm, color: Colors.muted, fontStyle: "italic",
  },
  promptsScroll: {
    paddingRight: Spacing.md, gap: Spacing.sm,
  },
  promptCard: {
    width: 200, backgroundColor: Colors.surface, borderRadius: BorderRadius.lg,
    padding: Spacing.md, borderWidth: 1, borderColor: Colors.borderLight,
    gap: 8,
  },
  promptCardSelected: {
    borderColor: Colors.neonPurple, backgroundColor: Colors.neonPurple + "08",
  },
  difficultyBadge: {
    flexDirection: "row", alignItems: "center", alignSelf: "flex-start",
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10, gap: 4,
  },
  difficultyText: {
    fontSize: 10, fontWeight: "700", textTransform: "capitalize",
  },
  promptTargetText: {
    fontSize: FontSize.sm, fontWeight: "600", color: Colors.textPrimary, lineHeight: 18,
  },
  promptEnglishText: {
    fontSize: FontSize.xs, color: Colors.muted, lineHeight: 16, fontStyle: "italic",
  },
  vocabHintRow: {
    flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2,
  },
  vocabHintText: {
    fontSize: 11, color: Colors.gold, fontWeight: "500",
  },
  tapToUseRow: {
    flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4,
    paddingTop: 6, borderTopWidth: 0.5, borderTopColor: Colors.borderLight,
  },
  tapToUseText: {
    fontSize: 11, color: Colors.neonPurple, fontWeight: "600",
  },

  // ─── List ────────────────────────────────────────────────────────────
  listContent: { padding: Spacing.md, paddingBottom: 120 },
  entryCard: {
    backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, padding: Spacing.md,
    marginBottom: Spacing.sm, borderWidth: 0.5, borderColor: Colors.borderLight,
  },
  entryCardExpanded: { borderColor: Colors.neonPurple + "40" },
  entryHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  entryDate: { fontSize: FontSize.xs, color: Colors.muted },
  scoreBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  scoreText: { fontSize: FontSize.xs, fontWeight: "700" },
  entryText: { fontSize: FontSize.base, color: Colors.textPrimary, lineHeight: 22 },
  processingRow: { flexDirection: "row", alignItems: "center", marginTop: Spacing.sm, gap: 8 },
  processingText: { fontSize: FontSize.sm, color: Colors.muted, fontStyle: "italic" },
  feedbackSection: { marginTop: Spacing.md, gap: Spacing.sm },
  encouragementBox: {
    flexDirection: "row", alignItems: "flex-start", backgroundColor: Colors.neonPurple + "10",
    padding: Spacing.sm, borderRadius: BorderRadius.md, gap: 8,
  },
  encouragementText: { flex: 1, fontSize: FontSize.sm, color: Colors.textPrimary, lineHeight: 20 },
  correctionsSection: { gap: 6 },
  sectionTitle: { fontSize: FontSize.sm, fontWeight: "600", color: Colors.textPrimary, marginBottom: 4 },
  correctionItem: {
    flexDirection: "row", flexWrap: "wrap", alignItems: "center",
    backgroundColor: Colors.background, padding: 8, borderRadius: BorderRadius.sm,
  },
  correctionOriginal: { fontSize: FontSize.sm, color: Colors.error, textDecorationLine: "line-through" },
  correctionFixed: { fontSize: FontSize.sm, color: Colors.success, fontWeight: "600" },
  correctionExplanation: { width: "100%", fontSize: FontSize.xs, color: Colors.muted, marginTop: 4 },
  tipBox: {
    flexDirection: "row", alignItems: "flex-start", backgroundColor: Colors.gold + "10",
    padding: Spacing.sm, borderRadius: BorderRadius.md, gap: 8,
  },
  tipText: { flex: 1, fontSize: FontSize.sm, color: Colors.textPrimary, lineHeight: 20 },
  vocabSection: { gap: 4 },
  vocabItem: { backgroundColor: Colors.background, padding: 8, borderRadius: BorderRadius.sm },
  vocabWord: { fontSize: FontSize.sm, fontWeight: "700", color: Colors.neonPurple },
  vocabMeaning: { fontSize: FontSize.sm, color: Colors.textSecondary },
  vocabExample: { fontSize: FontSize.xs, color: Colors.muted, fontStyle: "italic", marginTop: 2 },
  scoreLabel: { fontSize: FontSize.sm, fontWeight: "700", textAlign: "center", marginTop: 4 },
  previewEncouragement: { fontSize: FontSize.xs, color: Colors.muted, fontStyle: "italic", marginTop: 6 },
  emptyState: { alignItems: "center", paddingVertical: 60, gap: Spacing.sm },
  emptyTitle: { fontSize: FontSize.lg, fontWeight: "700", color: Colors.textPrimary },
  emptyText: { fontSize: FontSize.sm, color: Colors.muted, textAlign: "center", lineHeight: 20, paddingHorizontal: 20 },

  // ─── Input Area ──────────────────────────────────────────────────────
  inputArea: {
    borderTopWidth: 0.5, borderTopColor: Colors.borderLight, backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.md, paddingTop: Spacing.sm, paddingBottom: Spacing.lg,
  },
  inputRow: { flexDirection: "row", alignItems: "flex-end", gap: Spacing.sm },
  textInput: {
    flex: 1, backgroundColor: Colors.background, borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, fontSize: FontSize.base,
    color: Colors.textPrimary, maxHeight: 120, minHeight: 44, borderWidth: 0.5,
    borderColor: Colors.borderLight,
  },
  sendBtn: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.neonPurple,
    alignItems: "center", justifyContent: "center",
  },
  sendBtnDisabled: { opacity: 0.4 },
  charCount: { fontSize: FontSize.xs, color: Colors.muted, textAlign: "right", marginTop: 4 },

  // ─── Badge Celebration Modal ─────────────────────────────────────────
  modalOverlay: {
    flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "center", alignItems: "center",
  },
  celebrationCard: {
    backgroundColor: Colors.surface, borderRadius: 24, padding: 32,
    alignItems: "center", width: "85%", maxWidth: 340,
  },
  celebrationEmoji: { fontSize: 32, marginBottom: 8 },
  celebrationBadgeIcon: { marginBottom: 12 },
  celebrationTitle: { fontSize: 22, fontWeight: "800", marginBottom: 8 },
  celebrationMessage: {
    fontSize: FontSize.base, color: Colors.textPrimary, textAlign: "center", marginBottom: 8,
  },
  celebrationDesc: {
    fontSize: FontSize.sm, color: Colors.muted, textAlign: "center", marginBottom: 20,
  },
  celebrationBtn: {
    backgroundColor: Colors.neonPurple, paddingHorizontal: 32, paddingVertical: 12,
    borderRadius: 20,
  },
  celebrationBtnText: { color: "#fff", fontWeight: "700", fontSize: FontSize.base },

  // ─── Badges Sheet Modal ──────────────────────────────────────────────
  badgesSheet: {
    backgroundColor: Colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: Spacing.lg, maxHeight: "80%", width: "100%", position: "absolute", bottom: 0,
  },
  badgesSheetHeader: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: Spacing.md,
  },
  badgesSheetTitle: { fontSize: FontSize.xl, fontWeight: "800", color: Colors.textPrimary },
  statsRow: {
    flexDirection: "row", justifyContent: "space-around", alignItems: "center",
    backgroundColor: Colors.background, borderRadius: BorderRadius.lg, padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  statItem: { alignItems: "center", gap: 4 },
  statValue: { fontSize: FontSize.lg, fontWeight: "800", color: Colors.textPrimary },
  statLabel: { fontSize: 10, color: Colors.muted },
  statDivider: { width: 1, height: 30, backgroundColor: Colors.borderLight },
  badgesList: { maxHeight: 300 },
  badgeTierRow: {
    flexDirection: "row", alignItems: "center", padding: Spacing.md,
    backgroundColor: Colors.background, borderRadius: BorderRadius.md, marginBottom: 8,
    gap: Spacing.sm,
  },
  badgeTierRowCurrent: { borderWidth: 1.5, borderColor: Colors.neonPurple + "60" },
  badgeTierRowLocked: { opacity: 0.6 },
  badgeTierIcon: { fontSize: 32 },
  badgeTierInfo: { flex: 1 },
  badgeTierName: { fontSize: FontSize.base, fontWeight: "700", color: Colors.textPrimary },
  badgeTierDesc: { fontSize: FontSize.xs, color: Colors.muted, marginTop: 2 },
  badgeTierEarned: { fontSize: 10, color: Colors.success, marginTop: 2 },
  badgeTierDays: { alignItems: "center", gap: 4 },
  badgeTierDaysText: { fontSize: FontSize.sm, fontWeight: "700" },
  closeBadgesBtn: {
    backgroundColor: Colors.neonPurple, paddingVertical: 14, borderRadius: 16,
    alignItems: "center", marginTop: Spacing.md,
  },
  closeBadgesBtnText: { color: "#fff", fontWeight: "700", fontSize: FontSize.base },
});
