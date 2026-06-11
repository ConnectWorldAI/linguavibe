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

type SoundGuide = {
  id: string;
  sound: string;
  phonetic: string;
  language: string;
  difficulty: "Easy" | "Medium" | "Hard";
  tonguePosition: string;
  lipShape: string;
  airflow: string;
  tips: string[];
  examples: { word: string; translation: string }[];
  mouthDiagram: string; // emoji representation
};

const SOUND_GUIDES: SoundGuide[] = [
  {
    id: "1",
    sound: "Rolling R",
    phonetic: "/r/ (trilled)",
    language: "Spanish",
    difficulty: "Hard",
    tonguePosition: "Tip touches alveolar ridge, vibrates rapidly",
    lipShape: "Slightly open, relaxed",
    airflow: "Continuous airstream over tongue tip",
    tips: ["Start by saying 'butter' quickly", "Practice 'dra-dra-dra' repeatedly", "Relax your tongue — tension prevents vibration"],
    examples: [{ word: "Perro", translation: "Dog" }, { word: "Carro", translation: "Car" }],
    mouthDiagram: "👅",
  },
  {
    id: "2",
    sound: "French R",
    phonetic: "/ʁ/ (uvular)",
    language: "French",
    difficulty: "Hard",
    tonguePosition: "Back of tongue raised toward uvula",
    lipShape: "Neutral, slightly rounded",
    airflow: "Friction at back of throat",
    tips: ["Gargle gently — that's the position", "Think of clearing your throat softly", "Keep front of tongue down"],
    examples: [{ word: "Rouge", translation: "Red" }, { word: "Paris", translation: "Paris" }],
    mouthDiagram: "🗣️",
  },
  {
    id: "3",
    sound: "ñ Sound",
    phonetic: "/ɲ/ (palatal nasal)",
    language: "Spanish",
    difficulty: "Medium",
    tonguePosition: "Middle of tongue pressed against hard palate",
    lipShape: "Slightly open",
    airflow: "Through the nose",
    tips: ["Like 'ny' in 'canyon'", "Press tongue flat against roof of mouth", "Air exits through nose, not mouth"],
    examples: [{ word: "España", translation: "Spain" }, { word: "Año", translation: "Year" }],
    mouthDiagram: "👃",
  },
  {
    id: "4",
    sound: "ü Sound",
    phonetic: "/y/ (close front rounded)",
    language: "French/German",
    difficulty: "Medium",
    tonguePosition: "High and forward (like 'ee')",
    lipShape: "Rounded (like 'oo')",
    airflow: "Steady through rounded lips",
    tips: ["Say 'ee' then round your lips without moving tongue", "Imagine whistling while saying 'ee'", "Mirror practice helps"],
    examples: [{ word: "Lune", translation: "Moon (FR)" }, { word: "Über", translation: "Over (DE)" }],
    mouthDiagram: "👄",
  },
  {
    id: "5",
    sound: "つ Sound",
    phonetic: "/t͡sɯ/ (voiceless alveolar)",
    language: "Japanese",
    difficulty: "Medium",
    tonguePosition: "Tip behind upper teeth, then releases",
    lipShape: "Unrounded, spread slightly",
    airflow: "Quick burst then friction",
    tips: ["Like 'ts' in 'cats' + 'oo'", "Don't add a vowel before it", "Keep lips unrounded"],
    examples: [{ word: "つき", translation: "Moon" }, { word: "つよい", translation: "Strong" }],
    mouthDiagram: "😮",
  },
  {
    id: "6",
    sound: "Nasal Vowels",
    phonetic: "/ã, ẽ, õ/ (nasalized)",
    language: "French/Portuguese",
    difficulty: "Hard",
    tonguePosition: "Varies by vowel, soft palate lowered",
    lipShape: "Depends on the vowel",
    airflow: "Simultaneously through mouth and nose",
    tips: ["Lower your soft palate (like starting to say 'ng')", "Practice humming while saying vowels", "Hold your nose to check — sound should change"],
    examples: [{ word: "Bon", translation: "Good (FR)" }, { word: "Irmã", translation: "Sister (PT)" }],
    mouthDiagram: "👃",
  },
];

export default function MouthPlacementScreen() {
  const colors = useColors();
  const [selectedSound, setSelectedSound] = useState<SoundGuide | null>(null);
  const [filter, setFilter] = useState<"all" | "Easy" | "Medium" | "Hard">("all");

  const filtered = SOUND_GUIDES.filter((s) => filter === "all" || s.difficulty === filter);

  return (
    <ScreenContainer edges={["top", "left", "right"]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Mouth Placement</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Intro */}
        <View style={[styles.introCard, { backgroundColor: colors.primary + "10", borderColor: colors.primary + "30" }]}>
          <Ionicons name="information-circle" size={18} color={colors.primary} />
          <Text style={[styles.introText, { color: colors.primary }]}>
            Visual guides for difficult sounds. Tap a sound to see tongue, lip, and airflow instructions.
          </Text>
        </View>

        {/* Filters */}
        <View style={styles.filterRow}>
          {(["all", "Easy", "Medium", "Hard"] as const).map((f) => (
            <TouchableOpacity
              key={f}
              style={[styles.filterBtn, { backgroundColor: filter === f ? colors.primary + "15" : colors.surface, borderColor: filter === f ? colors.primary : colors.border }]}
              onPress={() => {
                if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setFilter(f);
              }}
            >
              <Text style={[styles.filterText, { color: filter === f ? colors.primary : colors.muted }]}>
                {f === "all" ? "All" : f}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Sound Cards */}
        {filtered.map((sound) => (
          <TouchableOpacity
            key={sound.id}
            style={[styles.soundCard, { backgroundColor: colors.surface, borderColor: selectedSound?.id === sound.id ? colors.primary : colors.border }]}
            activeOpacity={0.7}
            onPress={() => {
              if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setSelectedSound(selectedSound?.id === sound.id ? null : sound);
            }}
          >
            {/* Sound Header */}
            <View style={styles.soundHeader}>
              <View style={styles.soundLeft}>
                <Text style={styles.soundDiagram}>{sound.mouthDiagram}</Text>
                <View>
                  <Text style={[styles.soundName, { color: colors.foreground }]}>{sound.sound}</Text>
                  <Text style={[styles.soundPhonetic, { color: colors.primary }]}>{sound.phonetic}</Text>
                </View>
              </View>
              <View style={styles.soundRight}>
                <View style={[styles.langBadge, { backgroundColor: colors.primary + "10" }]}>
                  <Text style={[styles.langText, { color: colors.primary }]}>{sound.language}</Text>
                </View>
                <View style={[styles.diffDot, {
                  backgroundColor: sound.difficulty === "Easy" ? "#4ADE80" : sound.difficulty === "Medium" ? "#FBBF24" : "#F87171",
                }]} />
              </View>
            </View>

            {/* Expanded Detail */}
            {selectedSound?.id === sound.id && (
              <View style={[styles.detailSection, { borderTopColor: colors.border }]}>
                {/* Placement Guide */}
                <View style={styles.guideGrid}>
                  <View style={[styles.guideItem, { backgroundColor: colors.background, borderColor: colors.border }]}>
                    <Ionicons name="body" size={16} color="#A855F7" />
                    <Text style={[styles.guideLabel, { color: colors.muted }]}>Tongue</Text>
                    <Text style={[styles.guideValue, { color: colors.foreground }]}>{sound.tonguePosition}</Text>
                  </View>
                  <View style={[styles.guideItem, { backgroundColor: colors.background, borderColor: colors.border }]}>
                    <Ionicons name="ellipse-outline" size={16} color="#EC4899" />
                    <Text style={[styles.guideLabel, { color: colors.muted }]}>Lips</Text>
                    <Text style={[styles.guideValue, { color: colors.foreground }]}>{sound.lipShape}</Text>
                  </View>
                  <View style={[styles.guideItem, { backgroundColor: colors.background, borderColor: colors.border }]}>
                    <Ionicons name="cloud-outline" size={16} color="#3B82F6" />
                    <Text style={[styles.guideLabel, { color: colors.muted }]}>Airflow</Text>
                    <Text style={[styles.guideValue, { color: colors.foreground }]}>{sound.airflow}</Text>
                  </View>
                </View>

                {/* Tips */}
                <View style={styles.tipsSection}>
                  <Text style={[styles.tipsTitle, { color: colors.foreground }]}>Tips</Text>
                  {sound.tips.map((tip, i) => (
                    <View key={i} style={styles.tipRow}>
                      <View style={[styles.tipDot, { backgroundColor: colors.primary }]} />
                      <Text style={[styles.tipText, { color: colors.muted }]}>{tip}</Text>
                    </View>
                  ))}
                </View>

                {/* Examples */}
                <View style={styles.examplesSection}>
                  <Text style={[styles.examplesTitle, { color: colors.foreground }]}>Examples</Text>
                  <View style={styles.examplesRow}>
                    {sound.examples.map((ex, i) => (
                      <View key={i} style={[styles.exampleChip, { backgroundColor: colors.primary + "10", borderColor: colors.primary + "30" }]}>
                        <Text style={[styles.exampleWord, { color: colors.primary }]}>{ex.word}</Text>
                        <Text style={[styles.exampleTranslation, { color: colors.muted }]}>{ex.translation}</Text>
                      </View>
                    ))}
                  </View>
                </View>

                {/* Practice Button */}
                <TouchableOpacity style={[styles.practiceBtn, { backgroundColor: colors.primary }]}>
                  <Ionicons name="mic" size={16} color="#FFF" />
                  <Text style={styles.practiceBtnText}>Practice This Sound</Text>
                </TouchableOpacity>
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
  introCard: { flexDirection: "row", alignItems: "center", gap: 10, padding: 12, borderRadius: 10, borderWidth: 1, marginBottom: 16 },
  introText: { flex: 1, fontSize: 12, lineHeight: 18 },
  filterRow: { flexDirection: "row", gap: 8, marginBottom: 16 },
  filterBtn: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1 },
  filterText: { fontSize: 12, fontWeight: "700" },
  soundCard: { padding: 14, borderRadius: 14, borderWidth: 1.5, marginBottom: 10 },
  soundHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  soundLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  soundDiagram: { fontSize: 28 },
  soundName: { fontSize: 15, fontWeight: "700" },
  soundPhonetic: { fontSize: 12, marginTop: 2 },
  soundRight: { flexDirection: "row", alignItems: "center", gap: 8 },
  langBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  langText: { fontSize: 10, fontWeight: "700" },
  diffDot: { width: 8, height: 8, borderRadius: 4 },
  detailSection: { marginTop: 14, paddingTop: 14, borderTopWidth: 0.5 },
  guideGrid: { gap: 8, marginBottom: 14 },
  guideItem: { padding: 12, borderRadius: 10, borderWidth: 1, flexDirection: "row", alignItems: "flex-start", gap: 10 },
  guideLabel: { fontSize: 10, fontWeight: "700", marginBottom: 2 },
  guideValue: { fontSize: 12, lineHeight: 16, flex: 1 },
  tipsSection: { marginBottom: 14 },
  tipsTitle: { fontSize: 13, fontWeight: "700", marginBottom: 8 },
  tipRow: { flexDirection: "row", alignItems: "flex-start", gap: 8, marginBottom: 6 },
  tipDot: { width: 5, height: 5, borderRadius: 3, marginTop: 5 },
  tipText: { fontSize: 13, lineHeight: 18, flex: 1 },
  examplesSection: { marginBottom: 14 },
  examplesTitle: { fontSize: 13, fontWeight: "700", marginBottom: 8 },
  examplesRow: { flexDirection: "row", gap: 8 },
  exampleChip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, borderWidth: 1 },
  exampleWord: { fontSize: 14, fontWeight: "700" },
  exampleTranslation: { fontSize: 11, marginTop: 2 },
  practiceBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 12, borderRadius: 10 },
  practiceBtnText: { fontSize: 14, fontWeight: "700", color: "#FFF" },
});
