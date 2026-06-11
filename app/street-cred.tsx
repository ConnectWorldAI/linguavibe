import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";

type StreetCredBadge = {
  id: string;
  dialect: string;
  region: string;
  flag: string;
  level: "Bronze" | "Silver" | "Gold" | "Platinum";
  earned: boolean;
  slangsLearned: number;
  slangsRequired: number;
  examples: string[];
  color: string;
};

const BADGES: StreetCredBadge[] = [
  { id: "1", dialect: "Dominican Spanish", region: "Santo Domingo", flag: "🇩🇴", level: "Gold", earned: true, slangsLearned: 50, slangsRequired: 50, examples: ["Vaina", "Tiguere", "Jevi"], color: "#FFD700" },
  { id: "2", dialect: "Parisian Verlan", region: "Paris", flag: "🇫🇷", level: "Silver", earned: true, slangsLearned: 30, slangsRequired: 30, examples: ["Meuf", "Relou", "Ouf"], color: "#C0C0C0" },
  { id: "3", dialect: "Tokyo Slang", region: "Shibuya", flag: "🇯🇵", level: "Bronze", earned: true, slangsLearned: 15, slangsRequired: 15, examples: ["ヤバい", "マジ", "ウケる"], color: "#CD7F32" },
  { id: "4", dialect: "Mexican Slang", region: "CDMX", flag: "🇲🇽", level: "Gold", earned: false, slangsLearned: 38, slangsRequired: 50, examples: ["Neta", "Chido", "Güey"], color: "#FFD700" },
  { id: "5", dialect: "London Slang", region: "London", flag: "🇬🇧", level: "Silver", earned: false, slangsLearned: 18, slangsRequired: 30, examples: ["Bruv", "Peng", "Bare"], color: "#C0C0C0" },
  { id: "6", dialect: "Brazilian Gíria", region: "Rio de Janeiro", flag: "🇧🇷", level: "Bronze", earned: false, slangsLearned: 5, slangsRequired: 15, examples: ["Mano", "Firmeza", "Suave"], color: "#CD7F32" },
  { id: "7", dialect: "Korean Slang", region: "Seoul", flag: "🇰🇷", level: "Bronze", earned: false, slangsLearned: 0, slangsRequired: 15, examples: ["대박", "헐", "꿀잼"], color: "#CD7F32" },
  { id: "8", dialect: "Naija Pidgin", region: "Lagos", flag: "🇳🇬", level: "Silver", earned: false, slangsLearned: 10, slangsRequired: 30, examples: ["Wahala", "Oga", "Japa"], color: "#C0C0C0" },
];

export default function StreetCredScreen() {
  const colors = useColors();
  const [selectedBadge, setSelectedBadge] = useState<StreetCredBadge | null>(null);

  const earnedCount = BADGES.filter((b) => b.earned).length;
  const totalXP = BADGES.reduce((sum, b) => sum + b.slangsLearned * 10, 0);

  return (
    <ScreenContainer edges={["top", "left", "right"]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Street Cred</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Stats Banner */}
        <View style={[styles.statsBanner, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.primary }]}>{earnedCount}</Text>
            <Text style={[styles.statLabel, { color: colors.muted }]}>Badges</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: "#FFD700" }]}>{totalXP}</Text>
            <Text style={[styles.statLabel, { color: colors.muted }]}>Slang XP</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.success }]}>{BADGES.length}</Text>
            <Text style={[styles.statLabel, { color: colors.muted }]}>Dialects</Text>
          </View>
        </View>

        {/* Badge List */}
        {BADGES.map((badge) => (
          <TouchableOpacity
            key={badge.id}
            style={[styles.badgeCard, { backgroundColor: colors.surface, borderColor: badge.earned ? badge.color + "60" : colors.border }]}
            activeOpacity={0.7}
            onPress={() => {
              if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setSelectedBadge(selectedBadge?.id === badge.id ? null : badge);
            }}
          >
            <View style={styles.badgeTop}>
              <View style={styles.badgeLeft}>
                <View style={[styles.badgeIcon, { backgroundColor: badge.color + "20", borderColor: badge.color + "40" }]}>
                  <Text style={{ fontSize: 20 }}>{badge.flag}</Text>
                </View>
                <View>
                  <Text style={[styles.badgeName, { color: colors.foreground }]}>{badge.dialect}</Text>
                  <Text style={[styles.badgeRegion, { color: colors.muted }]}>{badge.region}</Text>
                </View>
              </View>
              <View style={styles.badgeRight}>
                <View style={[styles.levelBadge, { backgroundColor: badge.color + "20" }]}>
                  <Text style={[styles.levelText, { color: badge.color }]}>{badge.level}</Text>
                </View>
                {badge.earned && <Ionicons name="checkmark-circle" size={18} color={badge.color} />}
              </View>
            </View>

            {/* Progress */}
            <View style={styles.badgeProgress}>
              <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
                <View style={[styles.progressFill, { backgroundColor: badge.color, width: `${(badge.slangsLearned / badge.slangsRequired) * 100}%` }]} />
              </View>
              <Text style={[styles.progressText, { color: colors.muted }]}>
                {badge.slangsLearned}/{badge.slangsRequired} slangs
              </Text>
            </View>

            {/* Expanded Examples */}
            {selectedBadge?.id === badge.id && (
              <View style={[styles.examplesSection, { borderTopColor: colors.border }]}>
                <Text style={[styles.examplesTitle, { color: colors.foreground }]}>Sample Slangs</Text>
                <View style={styles.exampleChips}>
                  {badge.examples.map((ex, i) => (
                    <View key={i} style={[styles.exampleChip, { backgroundColor: badge.color + "15", borderColor: badge.color + "30" }]}>
                      <Text style={[styles.exampleText, { color: badge.color }]}>{ex}</Text>
                    </View>
                  ))}
                </View>
                {!badge.earned && (
                  <TouchableOpacity style={[styles.practiceBtn, { backgroundColor: badge.color }]}>
                    <Ionicons name="flash" size={14} color="#FFF" />
                    <Text style={styles.practiceBtnText}>Practice This Dialect</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 0.5 },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 17, fontWeight: "700" },
  content: { padding: 16, paddingBottom: 100 },
  statsBanner: { flexDirection: "row", alignItems: "center", justifyContent: "space-around", padding: 16, borderRadius: 14, borderWidth: 1, marginBottom: 16 },
  statItem: { alignItems: "center" },
  statValue: { fontSize: 22, fontWeight: "800" },
  statLabel: { fontSize: 11, marginTop: 2 },
  statDivider: { width: 1, height: 30 },
  badgeCard: { padding: 14, borderRadius: 14, borderWidth: 1.5, marginBottom: 10 },
  badgeTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  badgeLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  badgeIcon: { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center", borderWidth: 1 },
  badgeName: { fontSize: 14, fontWeight: "700" },
  badgeRegion: { fontSize: 12, marginTop: 2 },
  badgeRight: { flexDirection: "row", alignItems: "center", gap: 8 },
  levelBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  levelText: { fontSize: 10, fontWeight: "800" },
  badgeProgress: { marginTop: 12 },
  progressBar: { height: 5, borderRadius: 3, marginBottom: 4 },
  progressFill: { height: 5, borderRadius: 3 },
  progressText: { fontSize: 11, textAlign: "right" },
  examplesSection: { marginTop: 12, paddingTop: 12, borderTopWidth: 0.5 },
  examplesTitle: { fontSize: 12, fontWeight: "700", marginBottom: 8 },
  exampleChips: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 12 },
  exampleChip: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, borderWidth: 1 },
  exampleText: { fontSize: 13, fontWeight: "600" },
  practiceBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 10, borderRadius: 10 },
  practiceBtnText: { fontSize: 13, fontWeight: "700", color: "#FFF" },
});
