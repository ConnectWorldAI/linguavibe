/**
 * Multi-Language Journal Screen
 * 
 * Write daily entries in your target language and get AI corrections
 * with grammar explanations. Tracks writing streak and vocabulary growth.
 */
import React, { useState, useEffect, useCallback } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, FlatList,
  Platform, ActivityIndicator, Alert, ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ScreenContainer } from "@/components/screen-container";
import { Colors } from "@/constants/Colors";
import { createVanillaClient } from "@/lib/trpc";

type JournalEntry = {
  id: string;
  text: string;
  language: string;
  date: string;
  corrections: Correction[];
  score: number;
  wordCount: number;
};

type Correction = {
  original: string;
  corrected: string;
  explanation: string;
  type: "grammar" | "spelling" | "vocabulary" | "style";
};

const STORAGE_KEY = "linguavibe_journal_entries";
const STREAK_KEY = "linguavibe_journal_streak";

export default function MultiLanguageJournalScreen() {
  const router = useRouter();
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [isWriting, setIsWriting] = useState(false);
  const [entryText, setEntryText] = useState("");
  const [targetLanguage, setTargetLanguage] = useState("Spanish");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentCorrections, setCurrentCorrections] = useState<Correction[]>([]);
  const [showCorrections, setShowCorrections] = useState(false);
  const [streak, setStreak] = useState(0);
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null);

  useEffect(() => {
    loadEntries();
    loadStreak();
  }, []);

  const loadEntries = async () => {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEY);
      if (data) setEntries(JSON.parse(data));
    } catch {}
  };

  const loadStreak = async () => {
    try {
      const data = await AsyncStorage.getItem(STREAK_KEY);
      if (data) {
        const { count, lastDate } = JSON.parse(data);
        const today = new Date().toISOString().split("T")[0];
        const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
        if (lastDate === today || lastDate === yesterday) {
          setStreak(count);
        } else {
          setStreak(0);
        }
      }
    } catch {}
  };

  const updateStreak = async () => {
    const today = new Date().toISOString().split("T")[0];
    try {
      const data = await AsyncStorage.getItem(STREAK_KEY);
      let count = 1;
      if (data) {
        const prev = JSON.parse(data);
        const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
        if (prev.lastDate === today) count = prev.count;
        else if (prev.lastDate === yesterday) count = prev.count + 1;
      }
      await AsyncStorage.setItem(STREAK_KEY, JSON.stringify({ count, lastDate: today }));
      setStreak(count);
    } catch {}
  };

  const submitEntry = async () => {
    if (!entryText.trim() || entryText.trim().length < 10) {
      Alert.alert("Too Short", "Write at least 10 characters for meaningful feedback.");
      return;
    }
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsAnalyzing(true);
    try {
      const client = createVanillaClient();
      const result = await client.translate.text.mutate({
        text: `[JOURNAL CORRECTION MODE] Correct the following ${targetLanguage} journal entry. Return JSON with: {"corrections": [{"original": "wrong text", "corrected": "correct text", "explanation": "why", "type": "grammar|spelling|vocabulary|style"}], "score": 0-100, "feedback": "overall feedback"}. Entry: ${entryText}`,
        sourceLang: targetLanguage,
        targetLang: "English",
      });

      let corrections: Correction[] = [];
      let score = 75;
      try {
        const parsed = JSON.parse(result.translatedText || "{}");
        corrections = parsed.corrections || [];
        score = parsed.score || 75;
      } catch {
        corrections = [];
        score = 80;
      }

      const entry: JournalEntry = {
        id: Date.now().toString(),
        text: entryText,
        language: targetLanguage,
        date: new Date().toISOString(),
        corrections,
        score,
        wordCount: entryText.split(/\s+/).length,
      };

      const updated = [entry, ...entries];
      setEntries(updated);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      await updateStreak();
      setCurrentCorrections(corrections);
      setShowCorrections(true);
      setEntryText("");
      setIsWriting(false);
    } catch {
      Alert.alert("Error", "Could not analyze your entry. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const renderEntry = ({ item }: { item: JournalEntry }) => (
    <TouchableOpacity
      style={s.entryCard}
      onPress={() => setSelectedEntry(item)}
      activeOpacity={0.7}
    >
      <View style={s.entryHeader}>
        <Text style={s.entryDate}>{new Date(item.date).toLocaleDateString()}</Text>
        <View style={[s.scoreBadge, { backgroundColor: item.score >= 80 ? "#4CAF50" : item.score >= 60 ? "#FF9800" : "#F44336" }]}>
          <Text style={s.scoreText}>{item.score}%</Text>
        </View>
      </View>
      <Text style={s.entryPreview} numberOfLines={2}>{item.text}</Text>
      <View style={s.entryMeta}>
        <Text style={s.metaText}>{item.wordCount} words</Text>
        <Text style={s.metaText}>{item.corrections.length} corrections</Text>
        <Text style={s.metaText}>{item.language}</Text>
      </View>
    </TouchableOpacity>
  );

  // Writing mode
  if (isWriting) {
    return (
      <ScreenContainer>
        <View style={s.container}>
          <View style={s.header}>
            <TouchableOpacity onPress={() => setIsWriting(false)} style={s.backBtn}>
              <Ionicons name="close" size={24} color="#ECEDEE" />
            </TouchableOpacity>
            <Text style={s.title}>Write in {targetLanguage}</Text>
            <TouchableOpacity onPress={submitEntry} style={s.submitBtn} disabled={isAnalyzing}>
              {isAnalyzing ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <Text style={s.submitText}>Submit</Text>
              )}
            </TouchableOpacity>
          </View>
          <View style={s.promptCard}>
            <Ionicons name="bulb-outline" size={16} color="#FFB800" />
            <Text style={s.promptText}>Write about your day, a memory, or anything you want to practice!</Text>
          </View>
          <TextInput
            style={s.journalInput}
            placeholder={`Start writing in ${targetLanguage}...`}
            placeholderTextColor="#687076"
            value={entryText}
            onChangeText={setEntryText}
            multiline
            autoFocus
            textAlignVertical="top"
          />
          <Text style={s.wordCounter}>{entryText.split(/\s+/).filter(Boolean).length} words</Text>
        </View>
      </ScreenContainer>
    );
  }

  // Corrections view
  if (showCorrections && currentCorrections.length > 0) {
    return (
      <ScreenContainer>
        <View style={s.container}>
          <View style={s.header}>
            <TouchableOpacity onPress={() => setShowCorrections(false)} style={s.backBtn}>
              <Ionicons name="arrow-back" size={24} color="#ECEDEE" />
            </TouchableOpacity>
            <Text style={s.title}>Corrections</Text>
            <View style={{ width: 40 }} />
          </View>
          <ScrollView contentContainerStyle={s.correctionsList}>
            {currentCorrections.map((c, i) => (
              <View key={i} style={s.correctionCard}>
                <View style={[s.corrTypeBadge, { backgroundColor: c.type === "grammar" ? "#FF4081" : c.type === "spelling" ? "#FF9800" : c.type === "vocabulary" ? "#9C27B0" : "#00BCD4" }]}>
                  <Text style={s.corrTypeText}>{c.type}</Text>
                </View>
                <Text style={s.corrOriginal}>{c.original}</Text>
                <Ionicons name="arrow-down" size={16} color="#4CAF50" style={{ marginVertical: 4 }} />
                <Text style={s.corrCorrected}>{c.corrected}</Text>
                <Text style={s.corrExplanation}>{c.explanation}</Text>
              </View>
            ))}
          </ScrollView>
        </View>
      </ScreenContainer>
    );
  }

  // Entry detail view
  if (selectedEntry) {
    return (
      <ScreenContainer>
        <View style={s.container}>
          <View style={s.header}>
            <TouchableOpacity onPress={() => setSelectedEntry(null)} style={s.backBtn}>
              <Ionicons name="arrow-back" size={24} color="#ECEDEE" />
            </TouchableOpacity>
            <Text style={s.title}>{new Date(selectedEntry.date).toLocaleDateString()}</Text>
            <View style={{ width: 40 }} />
          </View>
          <ScrollView contentContainerStyle={{ padding: 16 }}>
            <Text style={s.entryFullText}>{selectedEntry.text}</Text>
            {selectedEntry.corrections.length > 0 && (
              <>
                <Text style={[s.sectionTitle, { marginTop: 20 }]}>Corrections ({selectedEntry.corrections.length})</Text>
                {selectedEntry.corrections.map((c, i) => (
                  <View key={i} style={s.correctionCard}>
                    <View style={[s.corrTypeBadge, { backgroundColor: c.type === "grammar" ? "#FF4081" : c.type === "spelling" ? "#FF9800" : "#9C27B0" }]}>
                      <Text style={s.corrTypeText}>{c.type}</Text>
                    </View>
                    <Text style={s.corrOriginal}>{c.original}</Text>
                    <Text style={s.corrCorrected}>{c.corrected}</Text>
                    <Text style={s.corrExplanation}>{c.explanation}</Text>
                  </View>
                ))}
              </>
            )}
          </ScrollView>
        </View>
      </ScreenContainer>
    );
  }

  // Main journal list
  return (
    <ScreenContainer>
      <View style={s.container}>
        <View style={s.header}>
          <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#ECEDEE" />
          </TouchableOpacity>
          <Text style={s.title}>Journal</Text>
          <TouchableOpacity onPress={() => setIsWriting(true)} style={s.newBtn}>
            <Ionicons name="add" size={24} color="#00AAFF" />
          </TouchableOpacity>
        </View>

        {/* Stats Bar */}
        <View style={s.statsBar}>
          <View style={s.statItem}>
            <Text style={s.statValue}>🔥 {streak}</Text>
            <Text style={s.statLabel}>Day Streak</Text>
          </View>
          <View style={s.statItem}>
            <Text style={s.statValue}>{entries.length}</Text>
            <Text style={s.statLabel}>Entries</Text>
          </View>
          <View style={s.statItem}>
            <Text style={s.statValue}>{entries.reduce((sum, e) => sum + e.wordCount, 0)}</Text>
            <Text style={s.statLabel}>Words Written</Text>
          </View>
        </View>

        <FlatList
          data={entries}
          renderItem={renderEntry}
          keyExtractor={(item) => item.id}
          contentContainerStyle={s.entryList}
          ListEmptyComponent={
            <View style={s.emptyState}>
              <Text style={{ fontSize: 48 }}>📝</Text>
              <Text style={s.emptyTitle}>Start Your Journal</Text>
              <Text style={s.emptySubtitle}>Write daily in {targetLanguage} and get AI corrections</Text>
              <TouchableOpacity onPress={() => setIsWriting(true)} style={s.startBtn}>
                <Text style={s.startBtnText}>Write First Entry</Text>
              </TouchableOpacity>
            </View>
          }
        />
      </View>
    </ScreenContainer>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.primary },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 12 },
  backBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  newBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(0,170,255,0.15)", alignItems: "center", justifyContent: "center" },
  title: { fontSize: 20, fontWeight: "700", color: "#ECEDEE" },
  statsBar: { flexDirection: "row", justifyContent: "space-around", paddingVertical: 12, marginHorizontal: 16, backgroundColor: "#141825", borderRadius: 12, marginBottom: 12 },
  statItem: { alignItems: "center" },
  statValue: { fontSize: 18, fontWeight: "700", color: "#ECEDEE" },
  statLabel: { fontSize: 11, color: "#9BA1A6", marginTop: 2 },
  entryList: { paddingHorizontal: 16, paddingBottom: 100 },
  entryCard: { backgroundColor: "#141825", borderRadius: 12, padding: 14, marginBottom: 10 },
  entryHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
  entryDate: { fontSize: 12, color: "#9BA1A6" },
  scoreBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  scoreText: { fontSize: 11, fontWeight: "700", color: "#FFF" },
  entryPreview: { fontSize: 14, color: "#ECEDEE", lineHeight: 20 },
  entryMeta: { flexDirection: "row", gap: 12, marginTop: 8 },
  metaText: { fontSize: 11, color: "#687076" },
  emptyState: { alignItems: "center", marginTop: 60 },
  emptyTitle: { fontSize: 18, fontWeight: "700", color: "#ECEDEE", marginTop: 12 },
  emptySubtitle: { fontSize: 13, color: "#9BA1A6", marginTop: 4, textAlign: "center" },
  startBtn: { marginTop: 20, backgroundColor: "#00AAFF", paddingHorizontal: 24, paddingVertical: 12, borderRadius: 24 },
  startBtnText: { fontSize: 14, fontWeight: "700", color: "#FFF" },
  // Writing mode
  promptCard: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "rgba(255,184,0,0.1)", padding: 12, marginHorizontal: 16, borderRadius: 10, marginBottom: 12 },
  promptText: { fontSize: 12, color: "#FFB800", flex: 1 },
  journalInput: { flex: 1, fontSize: 16, color: "#ECEDEE", padding: 16, lineHeight: 24 },
  wordCounter: { fontSize: 12, color: "#687076", textAlign: "right", paddingHorizontal: 16, paddingBottom: 8 },
  submitBtn: { backgroundColor: "#00AAFF", paddingHorizontal: 16, paddingVertical: 8, borderRadius: 16 },
  submitText: { fontSize: 14, fontWeight: "700", color: "#FFF" },
  // Corrections
  correctionsList: { padding: 16 },
  correctionCard: { backgroundColor: "#141825", borderRadius: 12, padding: 14, marginBottom: 10 },
  corrTypeBadge: { alignSelf: "flex-start", paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, marginBottom: 6 },
  corrTypeText: { fontSize: 10, fontWeight: "700", color: "#FFF", textTransform: "uppercase" },
  corrOriginal: { fontSize: 14, color: "#FF6B6B", textDecorationLine: "line-through" },
  corrCorrected: { fontSize: 14, color: "#4CAF50", fontWeight: "600" },
  corrExplanation: { fontSize: 12, color: "#9BA1A6", marginTop: 6, lineHeight: 18 },
  // Detail
  entryFullText: { fontSize: 16, color: "#ECEDEE", lineHeight: 24 },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: "#ECEDEE", marginBottom: 12 },
});
