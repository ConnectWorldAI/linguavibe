import React, { useState, useEffect, useCallback } from "react";
import { View, Text, Pressable, FlatList, StyleSheet, Alert } from "react-native";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ScreenContainer } from "@/components/screen-container";
import * as Haptics from "expo-haptics";
import { Platform } from "react-native";
import { trpc } from "@/lib/trpc";
import { getStreakData, recordGrammarReview } from "@/lib/grammar-streak";
import { onGrammarReviewCompleted } from "@/lib/grammar-streak-notifications";
import * as Sharing from "expo-sharing";
import { captureRef } from "react-native-view-shot";
import { useRef as useRefHook } from "react";

const NOTEBOOK_KEY = "@grammar_notebook_entries";

interface GrammarRow {
  native: string;
  target: string;
  pronunciation: string;
  note?: string;
}

interface ConjugationEntry {
  pronoun: string;
  present: string;
  past: string;
  future: string;
  presentPron: string;
  pastPron: string;
  futurePron: string;
}

interface ConjugationTable {
  verb: string;
  verbMeaning: string;
  entries: ConjugationEntry[];
}

interface NotebookEntry {
  id: string;
  grammarTopic: string;
  nativeLanguage: string;
  targetLanguage: string;
  grammarTable: GrammarRow[];
  conjugationTable?: ConjugationTable;
  keyRule: string;
  savedAt: number;
}

export default function GrammarNotebookScreen() {
  const [entries, setEntries] = useState<NotebookEntry[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [playingText, setPlayingText] = useState<string | null>(null);
  const [streakCount, setStreakCount] = useState(0);
  const [longestStreak, setLongestStreak] = useState(0);

  const generatePronunciation = trpc.voiceExercise.generatePronunciation.useMutation();

  useEffect(() => {
    loadEntries();
    loadStreak();
  }, []);

  const loadStreak = async () => {
    const data = await getStreakData();
    setStreakCount(data.currentStreak);
    setLongestStreak(data.longestStreak);
  };

  // Record a review when user expands an entry (counts as reviewing)
  const handleExpand = async (id: string) => {
    const isExpanded = expandedId === id;
    setExpandedId(isExpanded ? null : id);
    if (!isExpanded) {
      // Expanding — counts as a review
      const data = await recordGrammarReview();
      setStreakCount(data.currentStreak);
      setLongestStreak(data.longestStreak);
      onGrammarReviewCompleted();
    }
  };

  const loadEntries = async () => {
    try {
      const stored = await AsyncStorage.getItem(NOTEBOOK_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as NotebookEntry[];
        // Sort by most recent first
        parsed.sort((a, b) => b.savedAt - a.savedAt);
        setEntries(parsed);
      }
    } catch (e) {
      console.error("Failed to load notebook entries:", e);
    }
  };

  const deleteEntry = async (id: string) => {
    const updated = entries.filter((e) => e.id !== id);
    setEntries(updated);
    await AsyncStorage.setItem(NOTEBOOK_KEY, JSON.stringify(updated));
    if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const shareCardRef = useRefHook<View>(null);
  const [sharingEntryId, setSharingEntryId] = useState<string | null>(null);

  const handleShare = async (entry: NotebookEntry) => {
    setSharingEntryId(entry.id);
    // Small delay to let the card render in shareable state
    setTimeout(async () => {
      try {
        if (shareCardRef.current) {
          const uri = await captureRef(shareCardRef, {
            format: "png",
            quality: 1,
          });
          const isAvailable = await Sharing.isAvailableAsync();
          if (isAvailable) {
            await Sharing.shareAsync(uri, {
              mimeType: "image/png",
              dialogTitle: `Grammar: ${entry.grammarTopic}`,
            });
          }
        }
      } catch (e) {
        console.error("Failed to share grammar card:", e);
      }
      setSharingEntryId(null);
    }, 300);
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleDelete = (id: string, topic: string) => {
    if (Platform.OS === "web") {
      deleteEntry(id);
      return;
    }
    Alert.alert("Delete Entry", `Remove "${topic}" from your notebook?`, [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => deleteEntry(id) },
    ]);
  };

  const playAudio = async (text: string, language: string) => {
    setPlayingText(text);
    try {
      const result = await generatePronunciation.mutateAsync({
        text,
        language,
        speed: "slow",
      });
      if (result.success && result.audioUrl) {
        // Audio plays via the trpc response (data URI)
        // In a real implementation, we'd use expo-audio here
        if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    } catch (e) {
      // Fallback: just haptic feedback
      if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setTimeout(() => setPlayingText(null), 1500);
  };

  const renderEntry = useCallback(({ item }: { item: NotebookEntry }) => {
    const isExpanded = expandedId === item.id;
    const date = new Date(item.savedAt).toLocaleDateString();
    const hasConjugation = !!item.conjugationTable;

    return (
      <View style={styles.entryCard}>
        {/* Header */}
        <Pressable
          style={({ pressed }) => [styles.entryHeader, pressed && { opacity: 0.8 }]}
          onPress={() => handleExpand(item.id)}
        >
          <View style={styles.entryHeaderLeft}>
            <Text style={styles.entryIcon}>{hasConjugation ? "📝" : "📋"}</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.entryTopic}>{item.grammarTopic}</Text>
              <Text style={styles.entryMeta}>
                {item.targetLanguage} • {date}
              </Text>
            </View>
          </View>
          <Text style={styles.expandIcon}>{isExpanded ? "▼" : "▶"}</Text>
        </Pressable>

        {/* Expanded Content */}
        {isExpanded && (
          <View style={styles.entryContent}>
            {/* Key Rule */}
            <View style={styles.ruleBox}>
              <Text style={styles.ruleIcon}>💡</Text>
              <Text style={styles.ruleText}>{item.keyRule}</Text>
            </View>

            {/* Conjugation Table */}
            {item.conjugationTable && (
              <View style={styles.tableSection}>
                <Text style={styles.sectionTitle}>
                  {item.conjugationTable.verb} — {item.conjugationTable.verbMeaning}
                </Text>
                <View style={styles.miniTable}>
                  <View style={styles.miniTableHeader}>
                    <Text style={[styles.miniHeaderCell, { width: 60 }]}>—</Text>
                    <Text style={styles.miniHeaderCell}>Present</Text>
                    <Text style={styles.miniHeaderCell}>Past</Text>
                    <Text style={styles.miniHeaderCell}>Future</Text>
                  </View>
                  {item.conjugationTable.entries.map((entry, i) => (
                    <View key={i} style={[styles.miniTableRow, i % 2 === 0 && styles.miniRowEven]}>
                      <Text style={[styles.miniCell, { width: 60, fontWeight: "700" }]}>{entry.pronoun}</Text>
                      <Pressable
                        style={({ pressed }) => [styles.miniCellTap, pressed && { opacity: 0.6 }]}
                        onPress={() => playAudio(entry.present, item.targetLanguage)}
                      >
                        <Text style={styles.miniCellVerb}>{entry.present}</Text>
                        <Text style={styles.miniCellPron}>{entry.presentPron}</Text>
                      </Pressable>
                      <Pressable
                        style={({ pressed }) => [styles.miniCellTap, pressed && { opacity: 0.6 }]}
                        onPress={() => playAudio(entry.past, item.targetLanguage)}
                      >
                        <Text style={styles.miniCellVerb}>{entry.past}</Text>
                        <Text style={styles.miniCellPron}>{entry.pastPron}</Text>
                      </Pressable>
                      <Pressable
                        style={({ pressed }) => [styles.miniCellTap, pressed && { opacity: 0.6 }]}
                        onPress={() => playAudio(entry.future, item.targetLanguage)}
                      >
                        <Text style={styles.miniCellVerb}>{entry.future}</Text>
                        <Text style={styles.miniCellPron}>{entry.futurePron}</Text>
                      </Pressable>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Grammar Table */}
            {item.grammarTable.length > 0 && (
              <View style={styles.tableSection}>
                <Text style={styles.sectionTitle}>
                  {item.nativeLanguage} ↔ {item.targetLanguage}
                </Text>
                <View style={styles.miniTable}>
                  <View style={styles.miniTableHeader}>
                    <Text style={styles.miniHeaderCell}>{item.nativeLanguage}</Text>
                    <Text style={styles.miniHeaderCell}>{item.targetLanguage}</Text>
                  </View>
                  {item.grammarTable.map((row, i) => (
                    <Pressable
                      key={i}
                      style={({ pressed }) => [styles.miniTableRow, i % 2 === 0 && styles.miniRowEven, pressed && { opacity: 0.7 }]}
                      onPress={() => playAudio(row.target, item.targetLanguage)}
                    >
                      <Text style={[styles.miniCell, { flex: 1 }]}>{row.native}</Text>
                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                          <Text style={styles.miniCellVerb}>{row.target}</Text>
                          <Text style={{ fontSize: 10 }}>🔊</Text>
                        </View>
                        <Text style={styles.miniCellPron}>{row.pronunciation}</Text>
                      </View>
                    </Pressable>
                  ))}
                </View>
              </View>
            )}

            {/* Action Buttons */}
            <View style={styles.actionRow}>
              <Pressable
                style={({ pressed }) => [styles.shareBtn, pressed && { opacity: 0.7 }]}
                onPress={() => handleShare(item)}
              >
                <Text style={styles.shareBtnText}>📤 Share Card</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [styles.deleteBtn, pressed && { opacity: 0.7 }]}
                onPress={() => handleDelete(item.id, item.grammarTopic)}
              >
                <Text style={styles.deleteBtnText}>🗑 Remove</Text>
              </Pressable>
            </View>
          </View>
        )}
      </View>
    );
  }, [expandedId, playingText]);

  return (
    <ScreenContainer edges={["top", "left", "right"]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.7 }]}
          onPress={() => router.back()}
        >
          <Text style={styles.backText}>← Back</Text>
        </Pressable>
        <Text style={styles.headerTitle}>📓 Grammar Notebook</Text>
        <Pressable
          style={({ pressed }) => [styles.quizBtn, pressed && { opacity: 0.7 }]}
          onPress={() => router.push("/grammar-quiz" as any)}
        >
          <Text style={styles.quizBtnText}>📝 Quiz</Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [styles.quizBtn, pressed && { opacity: 0.7 }]}
          onPress={() => router.push("/grammar-mistake-journal" as any)}
        >
          <Text style={styles.quizBtnText}>📋</Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [styles.quizBtn, pressed && { opacity: 0.7 }]}
          onPress={() => router.push("/grammar-progress-report" as any)}
        >
          <Text style={styles.quizBtnText}>📊</Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [styles.quizBtn, pressed && { opacity: 0.7 }]}
          onPress={() => router.push("/grammar-streak-leaderboard" as any)}
        >
          <Text style={styles.quizBtnText}>🏆</Text>
        </Pressable>
      </View>

      {/* Streak Banner */}
      {streakCount > 0 && (
        <View style={styles.streakBanner}>
          <Text style={styles.streakFire}>🔥</Text>
          <Text style={styles.streakText}>{streakCount} day streak</Text>
          {longestStreak > streakCount && (
            <Text style={styles.streakBest}>Best: {longestStreak}</Text>
          )}
        </View>
      )}

      {entries.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>📓</Text>
          <Text style={styles.emptyTitle}>No Saved Grammar</Text>
          <Text style={styles.emptyText}>
            Grammar tables you save during lessons will appear here for quick review.
            Tap any row to hear pronunciation!
          </Text>
        </View>
      ) : (
        <FlatList
          data={entries}
          keyExtractor={(item) => item.id}
          renderItem={renderEntry}
          contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Off-screen shareable card for capture */}
      {sharingEntryId && (() => {
        const entry = entries.find((e) => e.id === sharingEntryId);
        if (!entry) return null;
        return (
          <View style={styles.shareCardOffscreen}>
            <View ref={shareCardRef} style={styles.shareCard} collapsable={false}>
              <View style={styles.shareCardHeader}>
                <Text style={styles.shareCardLogo}>LinguaVibe</Text>
                <Text style={styles.shareCardTopic}>{entry.grammarTopic}</Text>
                <Text style={styles.shareCardLang}>{entry.nativeLanguage} \u2192 {entry.targetLanguage}</Text>
              </View>
              {entry.grammarTable.length > 0 && (
                <View style={styles.shareTable}>
                  <View style={styles.shareTableHeader}>
                    <Text style={[styles.shareTableHeaderCell, { flex: 1 }]}>{entry.nativeLanguage}</Text>
                    <Text style={[styles.shareTableHeaderCell, { flex: 1 }]}>{entry.targetLanguage}</Text>
                    <Text style={[styles.shareTableHeaderCell, { flex: 1 }]}>Pronunciation</Text>
                  </View>
                  {entry.grammarTable.slice(0, 8).map((row, i) => (
                    <View key={i} style={[styles.shareTableRow, i % 2 === 0 && { backgroundColor: "#0d1b2a" }]}>
                      <Text style={[styles.shareTableCell, { flex: 1 }]}>{row.native}</Text>
                      <Text style={[styles.shareTableCell, { flex: 1, color: "#4ADE80", fontWeight: "700" }]}>{row.target}</Text>
                      <Text style={[styles.shareTableCell, { flex: 1, fontStyle: "italic", color: "#9BA1A6" }]}>{row.pronunciation}</Text>
                    </View>
                  ))}
                </View>
              )}
              {entry.conjugationTable && (
                <View style={styles.shareTable}>
                  <Text style={styles.shareConjTitle}>{entry.conjugationTable.verb} \u2014 {entry.conjugationTable.verbMeaning}</Text>
                  <View style={styles.shareTableHeader}>
                    <Text style={[styles.shareTableHeaderCell, { width: 50 }]}>\u2014</Text>
                    <Text style={styles.shareTableHeaderCell}>Present</Text>
                    <Text style={styles.shareTableHeaderCell}>Past</Text>
                    <Text style={styles.shareTableHeaderCell}>Future</Text>
                  </View>
                  {entry.conjugationTable.entries.slice(0, 6).map((conj, i) => (
                    <View key={i} style={[styles.shareTableRow, i % 2 === 0 && { backgroundColor: "#0d1b2a" }]}>
                      <Text style={[styles.shareTableCell, { width: 50, fontWeight: "700" }]}>{conj.pronoun}</Text>
                      <Text style={[styles.shareTableCell, { flex: 1, color: "#4ADE80" }]}>{conj.present}</Text>
                      <Text style={[styles.shareTableCell, { flex: 1, color: "#00AAFF" }]}>{conj.past}</Text>
                      <Text style={[styles.shareTableCell, { flex: 1, color: "#FBBF24" }]}>{conj.future}</Text>
                    </View>
                  ))}
                </View>
              )}
              <View style={styles.shareCardFooter}>
                <Text style={styles.shareCardRule}>\ud83d\udca1 {entry.keyRule}</Text>
              </View>
            </View>
          </View>
        );
      })()}
    </ScreenContainer>
  );
}

// Helper to save a notebook entry from outside this screen
export async function saveGrammarNotebookEntry(entry: NotebookEntry): Promise<void> {
  try {
    const stored = await AsyncStorage.getItem(NOTEBOOK_KEY);
    const existing: NotebookEntry[] = stored ? JSON.parse(stored) : [];
    // Avoid duplicates by topic
    const filtered = existing.filter((e) => e.grammarTopic !== entry.grammarTopic || e.targetLanguage !== entry.targetLanguage);
    filtered.push(entry);
    await AsyncStorage.setItem(NOTEBOOK_KEY, JSON.stringify(filtered));
  } catch (e) {
    console.error("Failed to save notebook entry:", e);
  }
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12, gap: 12, borderBottomWidth: 1, borderBottomColor: "#1e2d3d" },
  backBtn: { paddingVertical: 4, paddingHorizontal: 8 },
  backText: { fontSize: 16, color: "#00AAFF", fontWeight: "600" },
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#ECEDEE", flex: 1 },
  headerCount: { fontSize: 13, color: "#9BA1A6", fontWeight: "500" },
  quizBtn: { backgroundColor: "rgba(0, 170, 255, 0.12)", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, borderWidth: 1, borderColor: "rgba(0, 170, 255, 0.3)" },
  quizBtnText: { fontSize: 13, color: "#00AAFF", fontWeight: "700" },
  streakBanner: { flexDirection: "row", alignItems: "center", gap: 8, marginHorizontal: 16, marginTop: 10, backgroundColor: "rgba(251, 191, 36, 0.08)", paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12, borderWidth: 1, borderColor: "rgba(251, 191, 36, 0.2)" },
  streakFire: { fontSize: 18 },
  streakText: { fontSize: 14, fontWeight: "700", color: "#FBBF24", flex: 1 },
  streakBest: { fontSize: 12, color: "#9BA1A6", fontWeight: "500" },

  // Empty State
  emptyState: { flex: 1, alignItems: "center", justifyContent: "center", padding: 40 },
  emptyIcon: { fontSize: 60, marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontWeight: "700", color: "#ECEDEE", marginBottom: 8 },
  emptyText: { fontSize: 14, color: "#9BA1A6", textAlign: "center", lineHeight: 20 },

  // Entry Card
  entryCard: { backgroundColor: "#1a2234", borderRadius: 14, marginBottom: 12, borderWidth: 1, borderColor: "#334155", overflow: "hidden" },
  entryHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 14 },
  entryHeaderLeft: { flexDirection: "row", alignItems: "center", gap: 10, flex: 1 },
  entryIcon: { fontSize: 24 },
  entryTopic: { fontSize: 15, fontWeight: "700", color: "#ECEDEE" },
  entryMeta: { fontSize: 12, color: "#9BA1A6", marginTop: 2 },
  expandIcon: { fontSize: 12, color: "#9BA1A6" },

  // Expanded Content
  entryContent: { paddingHorizontal: 14, paddingBottom: 14, borderTopWidth: 1, borderTopColor: "#1e2d3d" },

  // Rule Box
  ruleBox: { flexDirection: "row", alignItems: "flex-start", gap: 8, backgroundColor: "#0d1b2a", borderRadius: 10, padding: 12, marginTop: 12, borderLeftWidth: 3, borderLeftColor: "#FBBF24" },
  ruleIcon: { fontSize: 14 },
  ruleText: { fontSize: 13, color: "#FBBF24", flex: 1, lineHeight: 18, fontWeight: "600" },

  // Table Section
  tableSection: { marginTop: 14 },
  sectionTitle: { fontSize: 13, fontWeight: "700", color: "#00AAFF", marginBottom: 8, textTransform: "uppercase" },

  // Mini Table
  miniTable: { borderRadius: 10, overflow: "hidden", borderWidth: 1, borderColor: "#334155" },
  miniTableHeader: { flexDirection: "row", backgroundColor: "#1e3a5f", paddingVertical: 8, paddingHorizontal: 8 },
  miniHeaderCell: { flex: 1, fontSize: 10, fontWeight: "800", color: "#00AAFF", textTransform: "uppercase", textAlign: "center" },
  miniTableRow: { flexDirection: "row", paddingVertical: 8, paddingHorizontal: 8, alignItems: "center" },
  miniRowEven: { backgroundColor: "rgba(0, 170, 255, 0.03)" },
  miniCell: { fontSize: 13, color: "#ECEDEE", fontWeight: "500" },
  miniCellTap: { flex: 1, alignItems: "center" },
  miniCellVerb: { fontSize: 13, fontWeight: "700", color: "#4ADE80" },
  miniCellPron: { fontSize: 9, color: "#9BA1A6", marginTop: 1, fontStyle: "italic" },

  // Action Row
  actionRow: { flexDirection: "row", gap: 10, marginTop: 14 },
  shareBtn: { flex: 1, paddingVertical: 10, alignItems: "center", borderRadius: 8, backgroundColor: "rgba(0, 170, 255, 0.08)", borderWidth: 1, borderColor: "rgba(0, 170, 255, 0.2)" },
  shareBtnText: { fontSize: 13, color: "#00AAFF", fontWeight: "600" },
  deleteBtn: { flex: 1, paddingVertical: 10, alignItems: "center", borderRadius: 8, backgroundColor: "rgba(239, 68, 68, 0.08)", borderWidth: 1, borderColor: "rgba(239, 68, 68, 0.2)" },
  deleteBtnText: { fontSize: 13, color: "#EF4444", fontWeight: "600" },

  // Share Card (off-screen for capture)
  shareCardOffscreen: { position: "absolute", left: -9999, top: 0 },
  shareCard: { width: 380, backgroundColor: "#0a1628", borderRadius: 16, padding: 20, borderWidth: 2, borderColor: "#1e3a5f" },
  shareCardHeader: { alignItems: "center", marginBottom: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: "#1e3a5f" },
  shareCardLogo: { fontSize: 20, fontWeight: "800", color: "#00AAFF", marginBottom: 6 },
  shareCardTopic: { fontSize: 16, fontWeight: "700", color: "#ECEDEE", textAlign: "center" },
  shareCardLang: { fontSize: 12, color: "#9BA1A6", marginTop: 4 },
  shareTable: { marginBottom: 12 },
  shareConjTitle: { fontSize: 13, fontWeight: "700", color: "#FBBF24", marginBottom: 8 },
  shareTableHeader: { flexDirection: "row", backgroundColor: "#1e3a5f", paddingVertical: 6, paddingHorizontal: 8, borderRadius: 6 },
  shareTableHeaderCell: { fontSize: 10, fontWeight: "800", color: "#00AAFF", textTransform: "uppercase", textAlign: "center" },
  shareTableRow: { flexDirection: "row", paddingVertical: 6, paddingHorizontal: 8 },
  shareTableCell: { fontSize: 12, color: "#ECEDEE" },
  shareCardFooter: { marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: "#1e3a5f" },
  shareCardRule: { fontSize: 12, color: "#FBBF24", fontWeight: "600", textAlign: "center" },
});
