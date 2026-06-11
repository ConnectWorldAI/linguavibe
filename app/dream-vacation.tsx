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

type Destination = {
  id: string;
  name: string;
  country: string;
  flag: string;
  emoji: string;
  language: string;
  description: string;
  phrases: { phrase: string; translation: string; pronunciation: string }[];
  scenarios: string[];
  difficulty: "beginner" | "intermediate" | "advanced";
  daysToLearn: number;
};

const DESTINATIONS: Destination[] = [
  {
    id: "1", name: "Barcelona", country: "Spain", flag: "🇪🇸", emoji: "🏖️", language: "Spanish",
    description: "Master tapas ordering, beach conversations, and navigating La Rambla like a local",
    phrases: [
      { phrase: "¿Me pone una caña, por favor?", translation: "Can I get a small beer, please?", pronunciation: "meh PO-neh OO-nah KAH-nyah" },
      { phrase: "¿Dónde está la playa más cercana?", translation: "Where is the nearest beach?", pronunciation: "DON-deh es-TAH lah PLY-ah" },
      { phrase: "La cuenta, por favor", translation: "The bill, please", pronunciation: "lah KWEN-tah por fah-VOR" },
    ],
    scenarios: ["Ordering at a tapas bar", "Asking for directions", "Haggling at La Boquería market", "Booking a flamenco show"],
    difficulty: "beginner", daysToLearn: 14,
  },
  {
    id: "2", name: "Tokyo", country: "Japan", flag: "🇯🇵", emoji: "🗼", language: "Japanese",
    description: "Navigate trains, order ramen, and experience Japanese hospitality with confidence",
    phrases: [
      { phrase: "すみません、この電車は渋谷に行きますか？", translation: "Excuse me, does this train go to Shibuya?", pronunciation: "su-mi-ma-SEN, ko-no DEN-sha wa..." },
      { phrase: "おすすめは何ですか？", translation: "What do you recommend?", pronunciation: "o-su-su-ME wa NAN de-su ka" },
      { phrase: "ありがとうございます", translation: "Thank you very much", pronunciation: "a-ri-ga-TOH go-zai-MA-su" },
    ],
    scenarios: ["Buying a train ticket", "Ordering at a ramen shop", "Checking into a ryokan", "Shopping in Akihabara"],
    difficulty: "intermediate", daysToLearn: 30,
  },
  {
    id: "3", name: "Paris", country: "France", flag: "🇫🇷", emoji: "🗼", language: "French",
    description: "Order croissants, navigate the Métro, and charm locals with proper French etiquette",
    phrases: [
      { phrase: "Bonjour, je voudrais un croissant, s'il vous plaît", translation: "Hello, I'd like a croissant, please", pronunciation: "bon-ZHOOR, zhuh voo-DREH..." },
      { phrase: "Où est la station de métro la plus proche?", translation: "Where is the nearest metro station?", pronunciation: "oo eh lah sta-SYON..." },
      { phrase: "L'addition, s'il vous plaît", translation: "The check, please", pronunciation: "la-dee-SYON seel voo PLEH" },
    ],
    scenarios: ["Café culture and ordering", "Museum ticket purchase", "Asking for directions", "Wine tasting in Montmartre"],
    difficulty: "beginner", daysToLearn: 21,
  },
  {
    id: "4", name: "Seoul", country: "South Korea", flag: "🇰🇷", emoji: "🏯", language: "Korean",
    description: "Navigate K-beauty shops, order Korean BBQ, and explore Gangnam with ease",
    phrases: [
      { phrase: "이거 얼마예요?", translation: "How much is this?", pronunciation: "ee-guh UHL-ma-ye-yo" },
      { phrase: "삼겹살 2인분 주세요", translation: "Two servings of pork belly, please", pronunciation: "sam-gyup-sal ee-in-bun JU-se-yo" },
      { phrase: "감사합니다", translation: "Thank you", pronunciation: "gam-sa-HAM-ni-da" },
    ],
    scenarios: ["Korean BBQ ordering", "Shopping in Myeongdong", "Taking a taxi", "Ordering at a café"],
    difficulty: "intermediate", daysToLearn: 28,
  },
  {
    id: "5", name: "Rio de Janeiro", country: "Brazil", flag: "🇧🇷", emoji: "🏝️", language: "Portuguese",
    description: "Dance samba, order açaí, and explore Copacabana with Brazilian Portuguese",
    phrases: [
      { phrase: "Oi, tudo bem?", translation: "Hi, how are you?", pronunciation: "oy, TOO-doo beng" },
      { phrase: "Quanto custa?", translation: "How much does it cost?", pronunciation: "KWAN-too KOOS-tah" },
      { phrase: "Onde fica a praia de Copacabana?", translation: "Where is Copacabana beach?", pronunciation: "ON-jee FEE-kah..." },
    ],
    scenarios: ["Beach vendors", "Samba school visit", "Ordering açaí", "Taking an Uber"],
    difficulty: "beginner", daysToLearn: 14,
  },
];

const DIFFICULTY_COLORS = {
  beginner: "#4ADE80",
  intermediate: "#FBBF24",
  advanced: "#F87171",
};

export default function DreamVacationScreen() {
  const colors = useColors();
  const [selectedDestination, setSelectedDestination] = useState<Destination | null>(null);

  if (selectedDestination) {
    return (
      <ScreenContainer edges={["top", "left", "right"]}>
        {/* Detail Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => setSelectedDestination(null)} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color={colors.foreground} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>{selectedDestination.name}</Text>
          <View style={{ width: 32 }} />
        </View>

        <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
          {/* Hero */}
          <View style={[styles.heroCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={styles.heroEmoji}>{selectedDestination.emoji}</Text>
            <Text style={[styles.heroTitle, { color: colors.foreground }]}>{selectedDestination.name}, {selectedDestination.country} {selectedDestination.flag}</Text>
            <Text style={[styles.heroDesc, { color: colors.muted }]}>{selectedDestination.description}</Text>
            <View style={styles.heroMeta}>
              <View style={[styles.metaChip, { backgroundColor: DIFFICULTY_COLORS[selectedDestination.difficulty] + "15" }]}>
                <Text style={[styles.metaText, { color: DIFFICULTY_COLORS[selectedDestination.difficulty] }]}>{selectedDestination.difficulty}</Text>
              </View>
              <View style={[styles.metaChip, { backgroundColor: colors.primary + "15" }]}>
                <Ionicons name="calendar-outline" size={12} color={colors.primary} />
                <Text style={[styles.metaText, { color: colors.primary }]}>{selectedDestination.daysToLearn} days</Text>
              </View>
            </View>
          </View>

          {/* Key Phrases */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Essential Phrases</Text>
            {selectedDestination.phrases.map((phrase, i) => (
              <View key={i} style={[styles.phraseCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <View style={styles.phraseHeader}>
                  <Text style={[styles.phraseOriginal, { color: colors.foreground }]}>{phrase.phrase}</Text>
                  <TouchableOpacity>
                    <Ionicons name="volume-high-outline" size={18} color={colors.primary} />
                  </TouchableOpacity>
                </View>
                <Text style={[styles.phraseTranslation, { color: colors.muted }]}>{phrase.translation}</Text>
                <View style={[styles.pronunciationBox, { backgroundColor: colors.background }]}>
                  <Ionicons name="mic-outline" size={12} color={colors.primary} />
                  <Text style={[styles.pronunciationText, { color: colors.primary }]}>{phrase.pronunciation}</Text>
                </View>
              </View>
            ))}
          </View>

          {/* Practice Scenarios */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Practice Scenarios</Text>
            {selectedDestination.scenarios.map((scenario, i) => (
              <TouchableOpacity key={i} style={[styles.scenarioRow, { backgroundColor: colors.surface, borderColor: colors.border }]} activeOpacity={0.7}
                onPress={() => {
                  if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.push({ pathname: "/city-explore" as any, params: { city: selectedDestination.name.toLowerCase().replace(/ /g, '') } });
                }}
              >
                <View style={[styles.scenarioIcon, { backgroundColor: colors.primary + "15" }]}>
                  <Ionicons name="chatbubbles-outline" size={18} color={colors.primary} />
                </View>
                <Text style={[styles.scenarioText, { color: colors.foreground }]}>{scenario}</Text>
                <Ionicons name="chevron-forward" size={16} color={colors.muted} />
              </TouchableOpacity>
            ))}
          </View>

          {/* Start Learning CTA */}
          <TouchableOpacity
            style={[styles.startBtn, { backgroundColor: colors.primary }]}
            onPress={() => {
              if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              router.push({ pathname: "/city-explore" as any, params: { city: selectedDestination.name.toLowerCase().replace(/ /g, '') } });
            }}
          >
            <Ionicons name="airplane-outline" size={20} color="#FFFFFF" />
            <Text style={styles.startBtnText}>Explore {selectedDestination.name}</Text>
          </TouchableOpacity>

          {/* Travel Phrasebook Link */}
          <TouchableOpacity
            style={[styles.phrasebookBtn, { borderColor: colors.primary }]}
            onPress={() => {
              if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push("/travel-phrasebook" as any);
            }}
          >
            <Ionicons name="book-outline" size={18} color={colors.primary} />
            <Text style={[styles.phrasebookBtnText, { color: colors.primary }]}>Full Travel Phrasebook</Text>
            <Ionicons name="chevron-forward" size={14} color={colors.primary} />
          </TouchableOpacity>

          <View style={{ height: 40 }} />
        </ScrollView>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer edges={["top", "left", "right"]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Dream Vacation</Text>
          <Text style={[styles.headerSubtitle, { color: colors.muted }]}>Learn for your next trip</Text>
        </View>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {/* Intro */}
        <View style={[styles.introCard, { backgroundColor: colors.primary + "10", borderColor: colors.primary + "30" }]}>
          <Ionicons name="airplane" size={24} color={colors.primary} />
          <Text style={[styles.introText, { color: colors.foreground }]}>
            Choose your dream destination and we'll create a personalized learning plan with the exact phrases and scenarios you'll need.
          </Text>
        </View>

        {/* Destinations */}
        <Text style={[styles.sectionTitle, { color: colors.foreground, marginTop: 20 }]}>Choose Your Destination</Text>
        {DESTINATIONS.map((dest) => {
          const diffColor = DIFFICULTY_COLORS[dest.difficulty];
          return (
            <TouchableOpacity
              key={dest.id}
              style={[styles.destCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
              activeOpacity={0.7}
              onPress={() => {
                if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setSelectedDestination(dest);
              }}
            >
              <View style={[styles.destEmoji, { backgroundColor: diffColor + "15" }]}>
                <Text style={{ fontSize: 28 }}>{dest.emoji}</Text>
              </View>
              <View style={styles.destInfo}>
                <View style={styles.destNameRow}>
                  <Text style={[styles.destName, { color: colors.foreground }]}>{dest.name}</Text>
                  <Text style={styles.destFlag}>{dest.flag}</Text>
                </View>
                <Text style={[styles.destCountry, { color: colors.muted }]}>{dest.country} · {dest.language}</Text>
                <View style={styles.destMeta}>
                  <View style={[styles.destDiff, { backgroundColor: diffColor + "15" }]}>
                    <Text style={[styles.destDiffText, { color: diffColor }]}>{dest.difficulty}</Text>
                  </View>
                  <Text style={[styles.destDays, { color: colors.muted }]}>{dest.daysToLearn} days</Text>
                  <Text style={[styles.destPhrases, { color: colors.muted }]}>{dest.phrases.length} phrases</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.muted} />
            </TouchableOpacity>
          );
        })}

        <View style={{ height: 40 }} />
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 0.5 },
  backBtn: { padding: 4 },
  headerCenter: { flex: 1, alignItems: "center" },
  headerTitle: { fontSize: 17, fontWeight: "700" },
  headerSubtitle: { fontSize: 12, marginTop: 1 },
  content: { flex: 1 },
  contentContainer: { padding: 16 },
  introCard: { flexDirection: "row", alignItems: "center", gap: 12, padding: 16, borderRadius: 14, borderWidth: 1 },
  introText: { flex: 1, fontSize: 14, lineHeight: 20 },
  sectionTitle: { fontSize: 18, fontWeight: "700", marginBottom: 12 },
  destCard: { flexDirection: "row", alignItems: "center", padding: 14, borderRadius: 14, borderWidth: 1, marginBottom: 10 },
  destEmoji: { width: 56, height: 56, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  destInfo: { flex: 1, marginLeft: 12 },
  destNameRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  destName: { fontSize: 16, fontWeight: "700" },
  destFlag: { fontSize: 14 },
  destCountry: { fontSize: 12, marginTop: 2 },
  destMeta: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 6 },
  destDiff: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  destDiffText: { fontSize: 10, fontWeight: "700", textTransform: "capitalize" },
  destDays: { fontSize: 11 },
  destPhrases: { fontSize: 11 },
  // Detail view styles
  heroCard: { alignItems: "center", padding: 24, borderRadius: 16, borderWidth: 1, marginBottom: 24 },
  heroEmoji: { fontSize: 48, marginBottom: 12 },
  heroTitle: { fontSize: 20, fontWeight: "800", textAlign: "center" },
  heroDesc: { fontSize: 14, textAlign: "center", marginTop: 8, lineHeight: 20 },
  heroMeta: { flexDirection: "row", gap: 10, marginTop: 14 },
  metaChip: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  metaText: { fontSize: 12, fontWeight: "600", textTransform: "capitalize" },
  section: { marginBottom: 24 },
  phraseCard: { padding: 14, borderRadius: 12, borderWidth: 1, marginBottom: 10 },
  phraseHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  phraseOriginal: { flex: 1, fontSize: 15, fontWeight: "700" },
  phraseTranslation: { fontSize: 13, marginTop: 4 },
  pronunciationBox: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 8, padding: 8, borderRadius: 8 },
  pronunciationText: { fontSize: 12, fontStyle: "italic" },
  scenarioRow: { flexDirection: "row", alignItems: "center", padding: 14, borderRadius: 12, borderWidth: 1, marginBottom: 8 },
  scenarioIcon: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center", marginRight: 12 },
  scenarioText: { flex: 1, fontSize: 14, fontWeight: "600" },
  startBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, padding: 16, borderRadius: 14, marginTop: 8 },
  startBtnText: { fontSize: 16, fontWeight: "700", color: "#FFFFFF" },
  phrasebookBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, padding: 14, borderRadius: 12, borderWidth: 1.5, marginTop: 10 },
  phrasebookBtnText: { fontSize: 14, fontWeight: "700" },
});
