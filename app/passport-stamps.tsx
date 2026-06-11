import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";

type Stamp = {
  id: string;
  city: string;
  country: string;
  flag: string;
  language: string;
  unlocked: boolean;
  progress: number;
  lessonsRequired: number;
  lessonsCompleted: number;
  landmark: string;
  color: string;
};

const STAMPS: Stamp[] = [
  { id: "1", city: "Mexico City", country: "Mexico", flag: "🇲🇽", language: "Spanish", unlocked: true, progress: 100, lessonsRequired: 10, lessonsCompleted: 10, landmark: "🏛️", color: "#22C55E" },
  { id: "2", city: "Paris", country: "France", flag: "🇫🇷", language: "French", unlocked: true, progress: 100, lessonsRequired: 10, lessonsCompleted: 10, landmark: "🗼", color: "#3B82F6" },
  { id: "3", city: "Tokyo", country: "Japan", flag: "🇯🇵", language: "Japanese", unlocked: false, progress: 70, lessonsRequired: 10, lessonsCompleted: 7, landmark: "🏯", color: "#F87171" },
  { id: "4", city: "Berlin", country: "Germany", flag: "🇩🇪", language: "German", unlocked: false, progress: 40, lessonsRequired: 10, lessonsCompleted: 4, landmark: "🏰", color: "#FBBF24" },
  { id: "5", city: "Seoul", country: "South Korea", flag: "🇰🇷", language: "Korean", unlocked: false, progress: 20, lessonsRequired: 10, lessonsCompleted: 2, landmark: "🎎", color: "#A855F7" },
  { id: "6", city: "Rome", country: "Italy", flag: "🇮🇹", language: "Italian", unlocked: false, progress: 0, lessonsRequired: 10, lessonsCompleted: 0, landmark: "🏟️", color: "#EC4899" },
  { id: "7", city: "Beijing", country: "China", flag: "🇨🇳", language: "Mandarin", unlocked: false, progress: 0, lessonsRequired: 10, lessonsCompleted: 0, landmark: "🏯", color: "#EF4444" },
  { id: "8", city: "Cairo", country: "Egypt", flag: "🇪🇬", language: "Arabic", unlocked: false, progress: 10, lessonsRequired: 10, lessonsCompleted: 1, landmark: "🏺", color: "#F59E0B" },
  { id: "9", city: "Lagos", country: "Nigeria", flag: "🇳🇬", language: "Yoruba", unlocked: false, progress: 0, lessonsRequired: 10, lessonsCompleted: 0, landmark: "🌍", color: "#10B981" },
  { id: "10", city: "Mumbai", country: "India", flag: "🇮🇳", language: "Hindi", unlocked: false, progress: 30, lessonsRequired: 10, lessonsCompleted: 3, landmark: "🕌", color: "#F97316" },
];

export default function PassportStampsScreen() {
  const colors = useColors();
  const [filter, setFilter] = useState<"all" | "unlocked" | "in_progress">("all");

  const unlockedCount = STAMPS.filter((s) => s.unlocked).length;
  const filteredStamps = STAMPS.filter((s) => {
    if (filter === "unlocked") return s.unlocked;
    if (filter === "in_progress") return !s.unlocked && s.progress > 0;
    return true;
  });

  return (
    <ScreenContainer edges={["top", "left", "right"]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Passport</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Passport Cover */}
        <View style={[styles.passportCover, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={styles.passportEmoji}>🛂</Text>
          <Text style={[styles.passportTitle, { color: colors.foreground }]}>Language Passport</Text>
          <Text style={[styles.passportSubtitle, { color: colors.muted }]}>
            {unlockedCount} / {STAMPS.length} cities unlocked
          </Text>
          <View style={[styles.passportProgress, { backgroundColor: colors.border }]}>
            <View style={[styles.passportProgressFill, { backgroundColor: colors.primary, width: `${(unlockedCount / STAMPS.length) * 100}%` }]} />
          </View>
        </View>

        {/* Filters */}
        <View style={styles.filterRow}>
          {(["all", "unlocked", "in_progress"] as const).map((f) => (
            <TouchableOpacity
              key={f}
              style={[styles.filterBtn, { backgroundColor: filter === f ? colors.primary + "15" : colors.surface, borderColor: filter === f ? colors.primary : colors.border }]}
              onPress={() => {
                if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setFilter(f);
              }}
            >
              <Text style={[styles.filterText, { color: filter === f ? colors.primary : colors.muted }]}>
                {f === "all" ? "All" : f === "unlocked" ? "Unlocked" : "In Progress"}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Stamps Grid */}
        <View style={styles.stampsGrid}>
          {filteredStamps.map((stamp) => (
            <TouchableOpacity
              key={stamp.id}
              style={[styles.stampCard, { backgroundColor: colors.surface, borderColor: stamp.unlocked ? stamp.color + "60" : colors.border }]}
              activeOpacity={0.7}
              onPress={() => {
                if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
            >
              {stamp.unlocked && (
                <View style={[styles.stampBadge, { backgroundColor: stamp.color }]}>
                  <Ionicons name="checkmark" size={10} color="#FFF" />
                </View>
              )}
              <Text style={styles.stampLandmark}>{stamp.landmark}</Text>
              <Text style={[styles.stampCity, { color: colors.foreground }]}>{stamp.city}</Text>
              <Text style={[styles.stampCountry, { color: colors.muted }]}>{stamp.flag} {stamp.country}</Text>
              <Text style={[styles.stampLanguage, { color: stamp.color }]}>{stamp.language}</Text>

              {!stamp.unlocked && (
                <View style={styles.stampProgressWrap}>
                  <View style={[styles.stampProgressBar, { backgroundColor: colors.border }]}>
                    <View style={[styles.stampProgressFill, { backgroundColor: stamp.color, width: `${stamp.progress}%` }]} />
                  </View>
                  <Text style={[styles.stampProgressText, { color: colors.muted }]}>
                    {stamp.lessonsCompleted}/{stamp.lessonsRequired}
                  </Text>
                </View>
              )}

              {stamp.unlocked && (
                <View style={[styles.unlockedTag, { backgroundColor: stamp.color + "15" }]}>
                  <Ionicons name="ribbon" size={10} color={stamp.color} />
                  <Text style={[styles.unlockedText, { color: stamp.color }]}>Collected</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 0.5 },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 17, fontWeight: "700" },
  content: { padding: 16, paddingBottom: 100 },
  passportCover: { alignItems: "center", padding: 24, borderRadius: 16, borderWidth: 1, marginBottom: 16 },
  passportEmoji: { fontSize: 40, marginBottom: 8 },
  passportTitle: { fontSize: 20, fontWeight: "800" },
  passportSubtitle: { fontSize: 13, marginTop: 4, marginBottom: 12 },
  passportProgress: { width: "80%", height: 6, borderRadius: 3 },
  passportProgressFill: { height: 6, borderRadius: 3 },
  filterRow: { flexDirection: "row", gap: 8, marginBottom: 16 },
  filterBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  filterText: { fontSize: 12, fontWeight: "700" },
  stampsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  stampCard: { width: "48%", padding: 14, borderRadius: 14, borderWidth: 1, alignItems: "center", position: "relative" },
  stampBadge: { position: "absolute", top: 8, right: 8, width: 18, height: 18, borderRadius: 9, alignItems: "center", justifyContent: "center" },
  stampLandmark: { fontSize: 32, marginBottom: 6 },
  stampCity: { fontSize: 14, fontWeight: "700", textAlign: "center" },
  stampCountry: { fontSize: 11, marginTop: 2 },
  stampLanguage: { fontSize: 11, fontWeight: "700", marginTop: 4 },
  stampProgressWrap: { width: "100%", marginTop: 8, alignItems: "center" },
  stampProgressBar: { width: "100%", height: 4, borderRadius: 2 },
  stampProgressFill: { height: 4, borderRadius: 2 },
  stampProgressText: { fontSize: 10, marginTop: 4 },
  unlockedTag: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, marginTop: 8 },
  unlockedText: { fontSize: 10, fontWeight: "700" },
});
