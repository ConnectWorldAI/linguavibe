/**
 * Scorecard Comparison View
 * Select two past scorecards and compare them side-by-side.
 * Shows category-by-category deltas, overall improvement, and time gap.
 */
import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Share,
  Modal,
  Animated,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { ScreenContainer } from "@/components/screen-container";
import * as Haptics from "expo-haptics";

const Colors = {
  bg: "#0A0E1A",
  card: "#141B2D",
  cardBorder: "#1E293B",
  text: "#FFFFFF",
  textSecondary: "#94A3B8",
  textMuted: "#64748B",
  primary: "#00AAFF",
  warning: "#F59E0B",
  success: "#10B981",
  error: "#EF4444",
  purple: "#8B5CF6",
  gold: "#FFD700",
};

interface ScorecardEntry {
  id: string;
  date: string;
  scenario: string;
  speaker: string;
  overallScore: number;
  grade: string;
  categories: {
    pronunciation: number;
    comprehension: number;
    fluency: number;
    vocabulary: number;
    recovery: number;
  };
}

const PAST_SCORECARDS: ScorecardEntry[] = [
  {
    id: "s1", date: "2026-05-23", scenario: "Meeting Host Family",
    speaker: "Familia Rodriguez", overallScore: 79, grade: "C+",
    categories: { pronunciation: 72, comprehension: 85, fluency: 74, vocabulary: 80, recovery: 78 },
  },
  {
    id: "s2", date: "2026-05-21", scenario: "Ordering at a Colmado",
    speaker: "Agent Maria", overallScore: 85, grade: "B",
    categories: { pronunciation: 82, comprehension: 88, fluency: 80, vocabulary: 87, recovery: 85 },
  },
  {
    id: "s3", date: "2026-05-18", scenario: "Airport Navigation",
    speaker: "Agent Carlos", overallScore: 68, grade: "D+",
    categories: { pronunciation: 60, comprehension: 72, fluency: 65, vocabulary: 70, recovery: 68 },
  },
  {
    id: "s4", date: "2026-05-15", scenario: "Job Interview Practice",
    speaker: "Agent Sofia", overallScore: 91, grade: "A-",
    categories: { pronunciation: 88, comprehension: 94, fluency: 90, vocabulary: 92, recovery: 89 },
  },
  {
    id: "s5", date: "2026-05-10", scenario: "Street Directions",
    speaker: "Agent Pedro", overallScore: 55, grade: "F",
    categories: { pronunciation: 48, comprehension: 60, fluency: 50, vocabulary: 58, recovery: 55 },
  },
  {
    id: "s6", date: "2026-05-05", scenario: "Restaurant Order",
    speaker: "Agent Lucia", overallScore: 73, grade: "C",
    categories: { pronunciation: 68, comprehension: 78, fluency: 70, vocabulary: 75, recovery: 72 },
  },
];

const CATEGORY_LABELS: { key: keyof ScorecardEntry["categories"]; label: string; icon: string }[] = [
  { key: "pronunciation", label: "Pronunciation", icon: "mic" },
  { key: "comprehension", label: "Comprehension", icon: "ear" },
  { key: "fluency", label: "Fluency", icon: "speedometer" },
  { key: "vocabulary", label: "Vocabulary", icon: "book" },
  { key: "recovery", label: "Recovery", icon: "refresh" },
];

function getDaysBetween(date1: string, date2: string): number {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  return Math.abs(Math.floor((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24)));
}

function getGradeColor(grade: string): string {
  if (grade.startsWith("A")) return Colors.success;
  if (grade.startsWith("B")) return Colors.primary;
  if (grade.startsWith("C")) return Colors.warning;
  if (grade.startsWith("D")) return Colors.error;
  return "#EF4444";
}

export default function ScorecardCompareScreen() {
  const [selectedA, setSelectedA] = useState<ScorecardEntry | null>(null);
  const [selectedB, setSelectedB] = useState<ScorecardEntry | null>(null);
  const [selectingFor, setSelectingFor] = useState<"A" | "B" | null>("A");

  const handleSelect = (entry: ScorecardEntry) => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (selectingFor === "A") {
      setSelectedA(entry);
      if (!selectedB) setSelectingFor("B");
      else setSelectingFor(null);
    } else if (selectingFor === "B") {
      setSelectedB(entry);
      setSelectingFor(null);
    }
  };

  const resetSelection = () => {
    setSelectedA(null);
    setSelectedB(null);
    setSelectingFor("A");
  };

  const isComparing = selectedA && selectedB;
  const dayGap = isComparing ? getDaysBetween(selectedA.date, selectedB.date) : 0;
  const overallDelta = isComparing ? selectedB.overallScore - selectedA.overallScore : 0;
  const [showShareCard, setShowShareCard] = useState(false);
  const shareScale = useState(new Animated.Value(0))[0];

  const handleShareCard = () => {
    if (!selectedA || !selectedB) return;
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setShowShareCard(true);
    shareScale.setValue(0);
    Animated.spring(shareScale, { toValue: 1, useNativeDriver: true, damping: 14 }).start();
  };

  const handleShareToSocial = async () => {
    if (!selectedA || !selectedB) return;
    if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const catDeltas = CATEGORY_LABELS.map(c => {
      const d = selectedB.categories[c.key] - selectedA.categories[c.key];
      return `${c.label}: ${d >= 0 ? "+" : ""}${d}%`;
    }).join("\n");
    const message = `🥊 ConnectWorld AI Scorecard Comparison\n\n` +
      `${selectedA.scenario} (${selectedA.grade}) → ${selectedB.scenario} (${selectedB.grade})\n` +
      `Overall: ${selectedA.overallScore}% → ${selectedB.overallScore}% (${overallDelta >= 0 ? "+" : ""}${overallDelta}%)\n` +
      `${dayGap} days apart\n\n` +
      `${catDeltas}\n\n` +
      `#ConnectWorldAI #LanguageLearning #Progress`;
    try {
      await Share.share({ message, title: "My ConnectWorld AI Progress" });
    } catch (_) {}
    setShowShareCard(false);
  };

  return (
    <ScreenContainer edges={["top", "left", "right"]}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Compare Scorecards</Text>
          {isComparing && (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <TouchableOpacity onPress={handleShareCard} style={styles.shareHeaderBtn}>
                <Ionicons name="share-outline" size={18} color={Colors.gold} />
              </TouchableOpacity>
              <TouchableOpacity onPress={resetSelection} style={styles.resetBtn}>
                <Ionicons name="refresh" size={18} color={Colors.primary} />
                <Text style={styles.resetText}>Reset</Text>
              </TouchableOpacity>
            </View>
          )}
          {!isComparing && <View style={{ width: 60 }} />}
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
          {/* Selection Slots */}
          <View style={styles.slotsRow}>
            <TouchableOpacity
              style={[styles.slot, selectingFor === "A" && styles.slotActive, selectedA && styles.slotFilled]}
              onPress={() => { setSelectingFor("A"); setSelectedA(null); }}
            >
              {selectedA ? (
                <>
                  <Text style={styles.slotDate}>{selectedA.date}</Text>
                  <Text style={styles.slotScenario} numberOfLines={1}>{selectedA.scenario}</Text>
                  <View style={[styles.slotGradeBadge, { backgroundColor: getGradeColor(selectedA.grade) + "20" }]}>
                    <Text style={[styles.slotGradeText, { color: getGradeColor(selectedA.grade) }]}>{selectedA.grade}</Text>
                  </View>
                  <Text style={styles.slotScore}>{selectedA.overallScore}%</Text>
                </>
              ) : (
                <>
                  <Ionicons name="add-circle-outline" size={28} color={selectingFor === "A" ? Colors.primary : Colors.textMuted} />
                  <Text style={[styles.slotPlaceholder, selectingFor === "A" && { color: Colors.primary }]}>Select First</Text>
                </>
              )}
            </TouchableOpacity>

            <View style={styles.vsContainer}>
              <Text style={styles.vsText}>VS</Text>
              {isComparing && (
                <View style={styles.dayGapBadge}>
                  <Text style={styles.dayGapText}>{dayGap}d apart</Text>
                </View>
              )}
            </View>

            <TouchableOpacity
              style={[styles.slot, selectingFor === "B" && styles.slotActive, selectedB && styles.slotFilled]}
              onPress={() => { setSelectingFor("B"); setSelectedB(null); }}
            >
              {selectedB ? (
                <>
                  <Text style={styles.slotDate}>{selectedB.date}</Text>
                  <Text style={styles.slotScenario} numberOfLines={1}>{selectedB.scenario}</Text>
                  <View style={[styles.slotGradeBadge, { backgroundColor: getGradeColor(selectedB.grade) + "20" }]}>
                    <Text style={[styles.slotGradeText, { color: getGradeColor(selectedB.grade) }]}>{selectedB.grade}</Text>
                  </View>
                  <Text style={styles.slotScore}>{selectedB.overallScore}%</Text>
                </>
              ) : (
                <>
                  <Ionicons name="add-circle-outline" size={28} color={selectingFor === "B" ? Colors.primary : Colors.textMuted} />
                  <Text style={[styles.slotPlaceholder, selectingFor === "B" && { color: Colors.primary }]}>Select Second</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* Comparison Results */}
          {isComparing && (
            <View style={styles.resultsSection}>
              {/* Overall Delta */}
              <View style={styles.overallDeltaCard}>
                <Text style={styles.overallDeltaLabel}>Overall Change</Text>
                <View style={styles.overallDeltaRow}>
                  <Text style={styles.overallScoreOld}>{selectedA.overallScore}%</Text>
                  <Ionicons
                    name={overallDelta >= 0 ? "arrow-forward" : "arrow-forward"}
                    size={20}
                    color={Colors.textMuted}
                  />
                  <Text style={styles.overallScoreNew}>{selectedB.overallScore}%</Text>
                  <View style={[styles.deltaBadge, { backgroundColor: overallDelta >= 0 ? Colors.success + "20" : Colors.error + "20" }]}>
                    <Ionicons
                      name={overallDelta >= 0 ? "trending-up" : "trending-down"}
                      size={14}
                      color={overallDelta >= 0 ? Colors.success : Colors.error}
                    />
                    <Text style={[styles.deltaText, { color: overallDelta >= 0 ? Colors.success : Colors.error }]}>
                      {overallDelta >= 0 ? "+" : ""}{overallDelta}%
                    </Text>
                  </View>
                </View>
                <Text style={styles.overallDeltaSummary}>
                  {overallDelta > 10 ? "Significant improvement!" :
                   overallDelta > 0 ? "Steady progress." :
                   overallDelta === 0 ? "Consistent performance." :
                   overallDelta > -10 ? "Slight regression — review weak areas." :
                   "Needs attention — focus on drills."}
                </Text>
              </View>

              {/* Category Breakdown */}
              <Text style={styles.sectionTitle}>Category Breakdown</Text>
              {CATEGORY_LABELS.map((cat) => {
                const scoreA = selectedA.categories[cat.key];
                const scoreB = selectedB.categories[cat.key];
                const delta = scoreB - scoreA;
                return (
                  <View key={cat.key} style={styles.categoryRow}>
                    <View style={styles.categoryLeft}>
                      <Ionicons name={cat.icon as any} size={18} color={Colors.primary} />
                      <Text style={styles.categoryLabel}>{cat.label}</Text>
                    </View>
                    <View style={styles.categoryScores}>
                      <Text style={styles.categoryScoreA}>{scoreA}%</Text>
                      <View style={styles.categoryBarContainer}>
                        <View style={[styles.categoryBarA, { width: `${scoreA}%` }]} />
                        <View style={[styles.categoryBarB, { width: `${scoreB}%` }]} />
                      </View>
                      <Text style={styles.categoryScoreB}>{scoreB}%</Text>
                    </View>
                    <View style={[styles.categoryDelta, { backgroundColor: delta >= 0 ? Colors.success + "15" : Colors.error + "15" }]}>
                      <Ionicons
                        name={delta > 0 ? "arrow-up" : delta < 0 ? "arrow-down" : "remove"}
                        size={12}
                        color={delta > 0 ? Colors.success : delta < 0 ? Colors.error : Colors.textMuted}
                      />
                      <Text style={[styles.categoryDeltaText, { color: delta > 0 ? Colors.success : delta < 0 ? Colors.error : Colors.textMuted }]}>
                        {delta > 0 ? "+" : ""}{delta}
                      </Text>
                    </View>
                  </View>
                );
              })}

              {/* Insights */}
              <View style={styles.insightsCard}>
                <Ionicons name="bulb" size={20} color={Colors.gold} />
                <View style={styles.insightsContent}>
                  <Text style={styles.insightsTitle}>Coach Insights</Text>
                  {(() => {
                    const improvements = CATEGORY_LABELS.filter(c => selectedB.categories[c.key] - selectedA.categories[c.key] > 5);
                    const regressions = CATEGORY_LABELS.filter(c => selectedB.categories[c.key] - selectedA.categories[c.key] < -5);
                    return (
                      <>
                        {improvements.length > 0 && (
                          <Text style={styles.insightText}>
                            <Text style={{ color: Colors.success }}>Improved: </Text>
                            {improvements.map(c => c.label).join(", ")}
                          </Text>
                        )}
                        {regressions.length > 0 && (
                          <Text style={styles.insightText}>
                            <Text style={{ color: Colors.error }}>Needs work: </Text>
                            {regressions.map(c => c.label).join(", ")}
                          </Text>
                        )}
                        {improvements.length === 0 && regressions.length === 0 && (
                          <Text style={styles.insightText}>Performance is consistent across all categories.</Text>
                        )}
                      </>
                    );
                  })()}
                </View>
              </View>
            </View>
          )}

          {/* Scorecard Picker */}
          {selectingFor && (
            <View style={styles.pickerSection}>
              <Text style={styles.pickerTitle}>
                {selectingFor === "A" ? "Select First Scorecard" : "Select Second Scorecard"}
              </Text>
              {PAST_SCORECARDS.filter(s => 
                (selectingFor === "A" ? s.id !== selectedB?.id : s.id !== selectedA?.id)
              ).map((entry) => (
                <TouchableOpacity
                  key={entry.id}
                  style={styles.pickerItem}
                  onPress={() => handleSelect(entry)}
                  activeOpacity={0.7}
                >
                  <View style={styles.pickerItemLeft}>
                    <Text style={styles.pickerDate}>{entry.date}</Text>
                    <Text style={styles.pickerScenario}>{entry.scenario}</Text>
                    <Text style={styles.pickerSpeaker}>{entry.speaker}</Text>
                  </View>
                  <View style={styles.pickerItemRight}>
                    <View style={[styles.pickerGrade, { backgroundColor: getGradeColor(entry.grade) + "20" }]}>
                      <Text style={[styles.pickerGradeText, { color: getGradeColor(entry.grade) }]}>{entry.grade}</Text>
                    </View>
                    <Text style={styles.pickerScore}>{entry.overallScore}%</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </ScrollView>
      </View>

      {/* Share Card Modal */}
      <Modal visible={showShareCard} transparent animationType="fade">
        <View style={styles.shareOverlay}>
          <Animated.View style={[styles.shareCardContainer, { transform: [{ scale: shareScale }] }]}>
            {/* Share Card Preview */}
            <View style={styles.shareCard}>
              <View style={styles.shareCardHeader}>
                <Text style={styles.shareCardBrand}>🥊 ConnectWorld AI</Text>
                <Text style={styles.shareCardTitle}>Progress Report</Text>
              </View>

              {selectedA && selectedB && (
                <>
                  <View style={styles.shareCardScores}>
                    <View style={styles.shareCardScoreBlock}>
                      <Text style={styles.shareCardScoreLabel}>{selectedA.scenario}</Text>
                      <Text style={styles.shareCardScoreValue}>{selectedA.overallScore}%</Text>
                      <Text style={[styles.shareCardGrade, { color: getGradeColor(selectedA.grade) }]}>{selectedA.grade}</Text>
                    </View>
                    <View style={styles.shareCardArrow}>
                      <Ionicons name="arrow-forward" size={20} color={Colors.gold} />
                      <Text style={styles.shareCardDays}>{dayGap}d</Text>
                    </View>
                    <View style={styles.shareCardScoreBlock}>
                      <Text style={styles.shareCardScoreLabel}>{selectedB.scenario}</Text>
                      <Text style={styles.shareCardScoreValue}>{selectedB.overallScore}%</Text>
                      <Text style={[styles.shareCardGrade, { color: getGradeColor(selectedB.grade) }]}>{selectedB.grade}</Text>
                    </View>
                  </View>

                  <View style={styles.shareCardDelta}>
                    <Ionicons
                      name={overallDelta >= 0 ? "trending-up" : "trending-down"}
                      size={24}
                      color={overallDelta >= 0 ? Colors.success : Colors.error}
                    />
                    <Text style={[styles.shareCardDeltaText, { color: overallDelta >= 0 ? Colors.success : Colors.error }]}>
                      {overallDelta >= 0 ? "+" : ""}{overallDelta}% Overall
                    </Text>
                  </View>

                  <View style={styles.shareCardCategories}>
                    {CATEGORY_LABELS.map((cat) => {
                      const delta = selectedB.categories[cat.key] - selectedA.categories[cat.key];
                      return (
                        <View key={cat.key} style={styles.shareCardCatRow}>
                          <Text style={styles.shareCardCatLabel}>{cat.label}</Text>
                          <Text style={[styles.shareCardCatDelta, { color: delta >= 0 ? Colors.success : Colors.error }]}>
                            {delta >= 0 ? "+" : ""}{delta}%
                          </Text>
                        </View>
                      );
                    })}
                  </View>
                </>
              )}

              <View style={styles.shareCardFooter}>
                <Text style={styles.shareCardFooterText}>connectworldai.app</Text>
              </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.shareActions}>
              <TouchableOpacity style={styles.shareActionBtn} onPress={handleShareToSocial}>
                <Ionicons name="share-social" size={20} color="#fff" />
                <Text style={styles.shareActionText}>Share</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.shareActionBtnSecondary} onPress={() => setShowShareCard(false)}>
                <Ionicons name="close" size={20} color={Colors.textSecondary} />
                <Text style={styles.shareActionTextSecondary}>Close</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </Modal>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 14 },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.card, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 18, fontWeight: "700", color: Colors.text },
  resetBtn: { flexDirection: "row", alignItems: "center", gap: 4 },
  resetText: { fontSize: 13, color: Colors.primary, fontWeight: "600" },
  slotsRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", paddingHorizontal: 16, marginTop: 8, gap: 8 },
  slot: { flex: 1, backgroundColor: Colors.card, borderRadius: 16, borderWidth: 1.5, borderColor: Colors.cardBorder, padding: 14, alignItems: "center", justifyContent: "center", minHeight: 130, gap: 6 },
  slotActive: { borderColor: Colors.primary, borderWidth: 2 },
  slotFilled: { borderColor: Colors.success + "60" },
  slotPlaceholder: { fontSize: 12, color: Colors.textMuted, marginTop: 6 },
  slotDate: { fontSize: 11, color: Colors.textMuted },
  slotScenario: { fontSize: 12, fontWeight: "600", color: Colors.text, textAlign: "center" },
  slotGradeBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  slotGradeText: { fontSize: 14, fontWeight: "800" },
  slotScore: { fontSize: 18, fontWeight: "700", color: Colors.text },
  vsContainer: { alignItems: "center", gap: 4 },
  vsText: { fontSize: 14, fontWeight: "800", color: Colors.textMuted },
  dayGapBadge: { backgroundColor: Colors.purple + "20", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8 },
  dayGapText: { fontSize: 10, color: Colors.purple, fontWeight: "600" },
  resultsSection: { paddingHorizontal: 16, marginTop: 20 },
  overallDeltaCard: { backgroundColor: Colors.card, borderRadius: 16, padding: 18, borderWidth: 1, borderColor: Colors.cardBorder, marginBottom: 20 },
  overallDeltaLabel: { fontSize: 12, color: Colors.textMuted, fontWeight: "600", marginBottom: 10 },
  overallDeltaRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  overallScoreOld: { fontSize: 24, fontWeight: "700", color: Colors.textSecondary },
  overallScoreNew: { fontSize: 24, fontWeight: "700", color: Colors.text },
  deltaBadge: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  deltaText: { fontSize: 14, fontWeight: "700" },
  overallDeltaSummary: { fontSize: 13, color: Colors.textSecondary, marginTop: 10, fontStyle: "italic" },
  sectionTitle: { fontSize: 15, fontWeight: "700", color: Colors.text, marginBottom: 12 },
  categoryRow: { flexDirection: "row", alignItems: "center", backgroundColor: Colors.card, borderRadius: 12, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: Colors.cardBorder },
  categoryLeft: { flexDirection: "row", alignItems: "center", gap: 8, width: 120 },
  categoryLabel: { fontSize: 12, color: Colors.text, fontWeight: "500" },
  categoryScores: { flex: 1, flexDirection: "row", alignItems: "center", gap: 6 },
  categoryScoreA: { fontSize: 11, color: Colors.textMuted, width: 30, textAlign: "right" },
  categoryScoreB: { fontSize: 11, color: Colors.text, fontWeight: "600", width: 30 },
  categoryBarContainer: { flex: 1, height: 6, backgroundColor: Colors.bg, borderRadius: 3, overflow: "hidden", position: "relative" },
  categoryBarA: { position: "absolute", top: 0, left: 0, height: 3, backgroundColor: Colors.textMuted + "60", borderRadius: 2 },
  categoryBarB: { position: "absolute", bottom: 0, left: 0, height: 3, backgroundColor: Colors.primary, borderRadius: 2 },
  categoryDelta: { flexDirection: "row", alignItems: "center", gap: 2, paddingHorizontal: 6, paddingVertical: 3, borderRadius: 6, marginLeft: 8 },
  categoryDeltaText: { fontSize: 11, fontWeight: "700" },
  insightsCard: { flexDirection: "row", backgroundColor: Colors.gold + "10", borderRadius: 14, padding: 14, marginTop: 16, gap: 12, borderWidth: 1, borderColor: Colors.gold + "30" },
  insightsContent: { flex: 1 },
  insightsTitle: { fontSize: 13, fontWeight: "700", color: Colors.gold, marginBottom: 6 },
  insightText: { fontSize: 12, color: Colors.textSecondary, lineHeight: 18, marginBottom: 4 },
  pickerSection: { paddingHorizontal: 16, marginTop: 20 },
  pickerTitle: { fontSize: 14, fontWeight: "700", color: Colors.text, marginBottom: 12 },
  pickerItem: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: Colors.card, borderRadius: 12, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: Colors.cardBorder },
  pickerItemLeft: { flex: 1, gap: 2 },
  pickerDate: { fontSize: 11, color: Colors.textMuted },
  pickerScenario: { fontSize: 13, fontWeight: "600", color: Colors.text },
  pickerSpeaker: { fontSize: 11, color: Colors.textSecondary },
  pickerItemRight: { alignItems: "center", gap: 4 },
  pickerGrade: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  pickerGradeText: { fontSize: 13, fontWeight: "800" },
  pickerScore: { fontSize: 12, color: Colors.textSecondary },
  // Share button
  shareHeaderBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.gold + "20", alignItems: "center", justifyContent: "center" },
  // Share modal
  shareOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.85)", alignItems: "center", justifyContent: "center", padding: 24 },
  shareCardContainer: { width: "100%", maxWidth: 340, alignItems: "center" },
  shareCard: { width: "100%", backgroundColor: "#0F1629", borderRadius: 20, padding: 24, borderWidth: 1.5, borderColor: Colors.gold + "40" },
  shareCardHeader: { alignItems: "center", marginBottom: 20 },
  shareCardBrand: { fontSize: 18, fontWeight: "800", color: Colors.gold },
  shareCardTitle: { fontSize: 13, color: Colors.textSecondary, marginTop: 4 },
  shareCardScores: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 },
  shareCardScoreBlock: { flex: 1, alignItems: "center", gap: 4 },
  shareCardScoreLabel: { fontSize: 10, color: Colors.textMuted, textAlign: "center" },
  shareCardScoreValue: { fontSize: 28, fontWeight: "800", color: Colors.text },
  shareCardGrade: { fontSize: 16, fontWeight: "800" },
  shareCardArrow: { alignItems: "center", gap: 2, paddingHorizontal: 8 },
  shareCardDays: { fontSize: 10, color: Colors.textMuted },
  shareCardDelta: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: Colors.card, borderRadius: 12, padding: 12, marginBottom: 16 },
  shareCardDeltaText: { fontSize: 18, fontWeight: "800" },
  shareCardCategories: { gap: 6 },
  shareCardCatRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 4, borderBottomWidth: 0.5, borderBottomColor: Colors.cardBorder },
  shareCardCatLabel: { fontSize: 12, color: Colors.textSecondary },
  shareCardCatDelta: { fontSize: 12, fontWeight: "700" },
  shareCardFooter: { alignItems: "center", marginTop: 16, paddingTop: 12, borderTopWidth: 1, borderTopColor: Colors.cardBorder },
  shareCardFooterText: { fontSize: 11, color: Colors.textMuted },
  shareActions: { flexDirection: "row", gap: 12, marginTop: 20 },
  shareActionBtn: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: Colors.gold, paddingVertical: 14, paddingHorizontal: 24, borderRadius: 14 },
  shareActionText: { fontSize: 15, fontWeight: "700", color: "#000" },
  shareActionBtnSecondary: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: Colors.card, paddingVertical: 14, paddingHorizontal: 20, borderRadius: 14, borderWidth: 1, borderColor: Colors.cardBorder },
  shareActionTextSecondary: { fontSize: 15, fontWeight: "600", color: Colors.textSecondary },
});
