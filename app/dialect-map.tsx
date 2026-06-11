import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Platform,
  FlatList,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as Speech from "expo-speech";

import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { SLANG_LANGUAGES, getSlangForLanguage, type SlangEntry } from "@/lib/slang-data";

// ─── Region Data ────────────────────────────────────────────────────────────

interface MapRegion {
  id: string;
  name: string;
  flag: string;
  languageCode: string;
  dialectCode: string;
  continent: "americas" | "europe" | "asia" | "africa" | "oceania";
  culturalContext: string;
  samplePhrase: string;
  sampleMeaning: string;
}

const MAP_REGIONS: MapRegion[] = [
  // Americas - Spanish
  { id: "do", name: "Dominican Republic", flag: "\ud83c\udde9\ud83c\uddf4", languageCode: "es", dialectCode: "dominican", continent: "americas", culturalContext: "Caribbean Spanish with Taíno influences, fast-paced speech, dropped 's' sounds", samplePhrase: "¿Qué lo que?", sampleMeaning: "What's up?" },
  { id: "mx", name: "Mexico", flag: "\ud83c\uddf2\ud83c\uddfd", languageCode: "es", dialectCode: "mexican", continent: "americas", culturalContext: "Aztec-influenced vocabulary, formal 'usted' usage, distinctive sing-song intonation", samplePhrase: "¡No manches!", sampleMeaning: "No way!" },
  { id: "co", name: "Colombia", flag: "\ud83c\udde8\ud83c\uddf4", languageCode: "es", dialectCode: "colombian", continent: "americas", culturalContext: "Clear pronunciation, considered 'neutral' Spanish, heavy use of 'parcero'", samplePhrase: "¡Qué chimba!", sampleMeaning: "How awesome!" },
  { id: "ve", name: "Venezuela", flag: "\ud83c\uddfb\ud83c\uddea", languageCode: "es", dialectCode: "venezuelan", continent: "americas", culturalContext: "Caribbean influence, distinctive use of 'chamo/chama', fast speech", samplePhrase: "¡Chévere!", sampleMeaning: "Cool/Awesome!" },
  { id: "pa", name: "Panama", flag: "\ud83c\uddf5\ud83c\udde6", languageCode: "es", dialectCode: "panamanian", continent: "americas", culturalContext: "Mix of Caribbean and Central American Spanish, English loanwords from Canal Zone", samplePhrase: "¡Xopa!", sampleMeaning: "What's up!" },
  { id: "br", name: "Brazil", flag: "\ud83c\udde7\ud83c\uddf7", languageCode: "pt", dialectCode: "brazilian", continent: "americas", culturalContext: "Musical intonation, open vowels, African and Indigenous influences", samplePhrase: "Beleza!", sampleMeaning: "Cool/Alright!" },
  { id: "jm", name: "Jamaica", flag: "\ud83c\uddef\ud83c\uddf2", languageCode: "jm", dialectCode: "standard", continent: "americas", culturalContext: "English-based creole with West African grammar, reggae culture influence", samplePhrase: "Wah gwaan?", sampleMeaning: "What's going on?" },
  { id: "ht", name: "Haiti", flag: "\ud83c\udded\ud83c\uddf9", languageCode: "ht", dialectCode: "standard", continent: "americas", culturalContext: "French-based creole with West African structures, unique phonology", samplePhrase: "Sak pase?", sampleMeaning: "What's happening?" },
  // Americas - English
  { id: "us", name: "United States", flag: "\ud83c\uddfa\ud83c\uddf8", languageCode: "en", dialectCode: "american", continent: "americas", culturalContext: "Diverse regional dialects, heavy slang innovation, pop culture influence", samplePhrase: "That's fire!", sampleMeaning: "That's amazing!" },
  // Europe
  { id: "gb", name: "United Kingdom", flag: "\ud83c\uddec\ud83c\udde7", languageCode: "en", dialectCode: "british", continent: "europe", culturalContext: "Cockney rhyming slang, class-based speech patterns, dry humor", samplePhrase: "Brilliant!", sampleMeaning: "Great/Awesome!" },
  { id: "fr", name: "France", flag: "\ud83c\uddeb\ud83c\uddf7", languageCode: "fr", dialectCode: "standard", continent: "europe", culturalContext: "Verlan (reversed syllable slang), Arabic loanwords from North Africa, café culture", samplePhrase: "C'est ouf!", sampleMeaning: "That's crazy!" },
  { id: "it", name: "Italy", flag: "\ud83c\uddee\ud83c\uddf9", languageCode: "it", dialectCode: "standard", continent: "europe", culturalContext: "Regional dialects vary dramatically, expressive hand gestures, food vocabulary", samplePhrase: "Che figata!", sampleMeaning: "How cool!" },
  { id: "de", name: "Germany", flag: "\ud83c\udde9\ud83c\uddea", languageCode: "de", dialectCode: "standard", continent: "europe", culturalContext: "Compound words, English loanwords (Denglisch), regional Bavarian/Saxon dialects", samplePhrase: "Geil!", sampleMeaning: "Awesome!" },
  { id: "pt", name: "Portugal", flag: "\ud83c\uddf5\ud83c\uddf9", languageCode: "pt", dialectCode: "european", continent: "europe", culturalContext: "Closed vowels, 'sh' sounds, more formal than Brazilian Portuguese", samplePhrase: "Fixe!", sampleMeaning: "Cool!" },
  // Asia
  { id: "jp", name: "Japan", flag: "\ud83c\uddef\ud83c\uddf5", languageCode: "ja", dialectCode: "standard", continent: "asia", culturalContext: "Keigo (honorific speech), anime influence on youth slang, onomatopoeia-rich", samplePhrase: "ヤバい!", sampleMeaning: "Amazing/Crazy!" },
  { id: "kr", name: "South Korea", flag: "\ud83c\uddf0\ud83c\uddf7", languageCode: "ko", dialectCode: "standard", continent: "asia", culturalContext: "K-pop influence, age-based speech levels, internet neologisms", samplePhrase: "대박!", sampleMeaning: "Jackpot/Amazing!" },
  { id: "cn", name: "China", flag: "\ud83c\udde8\ud83c\uddf3", languageCode: "zh", dialectCode: "standard", continent: "asia", culturalContext: "Internet slang (网络用语), tone-based wordplay, rapid evolution", samplePhrase: "666!", sampleMeaning: "Awesome! (liù = smooth)" },
  { id: "in", name: "India", flag: "\ud83c\uddee\ud83c\uddf3", languageCode: "hi", dialectCode: "standard", continent: "asia", culturalContext: "Hinglish code-switching, Bollywood influence, regional variations", samplePhrase: "Jugaad!", sampleMeaning: "Creative hack/solution!" },
  // Middle East
  { id: "sa", name: "Saudi Arabia", flag: "\ud83c\uddf8\ud83c\udde6", languageCode: "ar", dialectCode: "gulf", continent: "asia", culturalContext: "Gulf Arabic, formal/informal registers, poetry tradition", samplePhrase: "يا زين!", sampleMeaning: "How beautiful!" },
  { id: "eg", name: "Egypt", flag: "\ud83c\uddea\ud83c\uddec", languageCode: "ar", dialectCode: "egyptian", continent: "africa", culturalContext: "Most widely understood Arabic dialect, movie/TV influence, humor-rich", samplePhrase: "يا سلام!", sampleMeaning: "Wow!/Amazing!" },
  // Oceania
  { id: "au", name: "Australia", flag: "\ud83c\udde6\ud83c\uddfa", languageCode: "en", dialectCode: "australian", continent: "oceania", culturalContext: "Abbreviation culture (-o, -ie endings), rhyming slang, laid-back tone", samplePhrase: "No worries!", sampleMeaning: "It's all good!" },
];

const CONTINENTS = [
  { id: "all", label: "All Regions", icon: "globe-outline" as const },
  { id: "americas", label: "Americas", icon: "earth-outline" as const },
  { id: "europe", label: "Europe", icon: "earth-outline" as const },
  { id: "asia", label: "Asia", icon: "earth-outline" as const },
  { id: "africa", label: "Africa", icon: "earth-outline" as const },
  { id: "oceania", label: "Oceania", icon: "earth-outline" as const },
];

export default function DialectMapScreen() {
  const router = useRouter();
  const colors = useColors();
  const [selectedContinent, setSelectedContinent] = useState("all");
  const [expandedRegion, setExpandedRegion] = useState<string | null>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);

  const filteredRegions = selectedContinent === "all"
    ? MAP_REGIONS
    : MAP_REGIONS.filter(r => r.continent === selectedContinent);

  const speakPhrase = useCallback((region: MapRegion) => {
    if (Platform.OS === "web") return;
    setPlayingId(region.id);
    const langMap: Record<string, string> = {
      es: "es-MX", en: "en-US", fr: "fr-FR", pt: "pt-BR",
      ja: "ja-JP", ko: "ko-KR", zh: "zh-CN", hi: "hi-IN",
      ar: "ar-SA", it: "it-IT", de: "de-DE", jm: "en-JM", ht: "fr-HT",
    };
    Speech.speak(region.samplePhrase, {
      language: langMap[region.languageCode] || "en-US",
      rate: 0.8,
      onDone: () => setPlayingId(null),
      onError: () => setPlayingId(null),
    });
  }, []);

  const toggleRegion = useCallback((regionId: string) => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setExpandedRegion(prev => prev === regionId ? null : regionId);
  }, []);

  const startQuizForRegion = useCallback((region: MapRegion) => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push("/dialect-quiz" as any);
  }, [router]);

  const getSlangPreview = useCallback((region: MapRegion): SlangEntry[] => {
    const entries = getSlangForLanguage(region.languageCode, region.dialectCode);
    return entries.slice(0, 3);
  }, []);

  const renderRegionCard = useCallback(({ item: region }: { item: MapRegion }) => {
    const isExpanded = expandedRegion === region.id;
    const isPlaying = playingId === region.id;
    const slangPreview = isExpanded ? getSlangPreview(region) : [];

    return (
      <View style={[styles.regionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <TouchableOpacity
          onPress={() => toggleRegion(region.id)}
          style={styles.regionHeader}
        >
          <View style={styles.regionInfo}>
            <Text style={styles.regionFlag}>{region.flag}</Text>
            <View style={styles.regionText}>
              <Text style={[styles.regionName, { color: colors.foreground }]}>{region.name}</Text>
              <Text style={[styles.regionDialect, { color: colors.muted }]} numberOfLines={1}>
                {region.culturalContext.split(",")[0]}
              </Text>
            </View>
          </View>
          <Ionicons
            name={isExpanded ? "chevron-up" : "chevron-down"}
            size={20}
            color={colors.muted}
          />
        </TouchableOpacity>

        {/* Sample Phrase */}
        <TouchableOpacity
          onPress={() => speakPhrase(region)}
          style={[styles.phraseRow, { backgroundColor: colors.background }]}
        >
          <View style={styles.phraseContent}>
            <Text style={[styles.phraseText, { color: colors.primary }]}>{region.samplePhrase}</Text>
            <Text style={[styles.phraseMeaning, { color: colors.muted }]}>{region.sampleMeaning}</Text>
          </View>
          <Ionicons
            name={isPlaying ? "volume-high" : "volume-medium-outline"}
            size={20}
            color={isPlaying ? colors.primary : colors.muted}
          />
        </TouchableOpacity>

        {/* Expanded Content */}
        {isExpanded && (
          <View style={styles.expandedContent}>
            {/* Cultural Context */}
            <View style={[styles.contextBox, { backgroundColor: colors.background }]}>
              <Ionicons name="information-circle-outline" size={16} color={colors.primary} />
              <Text style={[styles.contextText, { color: colors.foreground }]}>
                {region.culturalContext}
              </Text>
            </View>

            {/* Slang Preview */}
            {slangPreview.length > 0 && (
              <View style={styles.slangPreview}>
                <Text style={[styles.slangTitle, { color: colors.foreground }]}>Popular Slang</Text>
                {slangPreview.map((entry, i) => (
                  <TouchableOpacity
                    key={entry.id || i}
                    onPress={() => {
                      if (Platform.OS !== "web") {
                        Speech.speak(entry.expression, {
                          language: region.languageCode === "es" ? "es-MX" : "en-US",
                          rate: 0.8,
                        });
                      }
                    }}
                    style={[styles.slangItem, { borderBottomColor: colors.border }]}
                  >
                    <View style={styles.slangItemContent}>
                      <Text style={[styles.slangExpression, { color: colors.primary }]}>{entry.expression}</Text>
                      <Text style={[styles.slangMeaning, { color: colors.foreground }]}>{entry.meaning}</Text>
                    </View>
                    <Ionicons name="volume-medium-outline" size={16} color={colors.muted} />
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Action Buttons */}
            <View style={styles.actionRow}>
              <TouchableOpacity
                onPress={() => startQuizForRegion(region)}
                style={[styles.actionBtn, { backgroundColor: colors.primary }]}
              >
                <Ionicons name="game-controller-outline" size={16} color={colors.background} />
                <Text style={[styles.actionBtnText, { color: colors.background }]}>Quiz Me</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => router.push("/slang-history" as any)}
                style={[styles.actionBtn, { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 }]}
              >
                <Ionicons name="book-outline" size={16} color={colors.primary} />
                <Text style={[styles.actionBtnText, { color: colors.primary }]}>Slang Book</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    );
  }, [expandedRegion, playingId, colors, toggleRegion, speakPhrase, startQuizForRegion, getSlangPreview, router]);

  return (
    <ScreenContainer className="flex-1">
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Dialect Map</Text>
        <View style={styles.backBtn} />
      </View>

      {/* Subtitle */}
      <View style={styles.subtitleRow}>
        <Ionicons name="globe-outline" size={18} color={colors.primary} />
        <Text style={[styles.subtitle, { color: colors.muted }]}>
          Tap a region to hear local slang and start a quiz
        </Text>
      </View>

      {/* Continent Filter */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll} contentContainerStyle={styles.filterContent}>
        {CONTINENTS.map(c => (
          <TouchableOpacity
            key={c.id}
            onPress={() => {
              if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setSelectedContinent(c.id);
            }}
            style={[
              styles.filterChip,
              { backgroundColor: selectedContinent === c.id ? colors.primary : colors.surface, borderColor: colors.border },
            ]}
          >
            <Text style={[
              styles.filterText,
              { color: selectedContinent === c.id ? colors.background : colors.foreground },
            ]}>
              {c.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Region Count */}
      <Text style={[styles.countText, { color: colors.muted }]}>
        {filteredRegions.length} region{filteredRegions.length !== 1 ? "s" : ""}
      </Text>

      {/* Region List */}
      <FlatList
        data={filteredRegions}
        keyExtractor={(item) => item.id}
        renderItem={renderRegionCard}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 0.5 },
  backBtn: { width: 40, alignItems: "center" },
  headerTitle: { fontSize: 18, fontWeight: "700" },
  subtitleRow: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 20, paddingTop: 12 },
  subtitle: { fontSize: 14 },
  filterScroll: { maxHeight: 48, marginTop: 12 },
  filterContent: { paddingHorizontal: 16, gap: 8 },
  filterChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  filterText: { fontSize: 13, fontWeight: "600" },
  countText: { fontSize: 12, paddingHorizontal: 20, paddingTop: 8, paddingBottom: 4 },
  listContent: { padding: 16, gap: 12, paddingBottom: 100 },
  regionCard: { borderRadius: 14, borderWidth: 1, overflow: "hidden" },
  regionHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 14 },
  regionInfo: { flexDirection: "row", alignItems: "center", gap: 12, flex: 1 },
  regionFlag: { fontSize: 28 },
  regionText: { flex: 1 },
  regionName: { fontSize: 16, fontWeight: "700" },
  regionDialect: { fontSize: 12, marginTop: 2 },
  phraseRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginHorizontal: 12, marginBottom: 12, padding: 10, borderRadius: 10 },
  phraseContent: { flex: 1 },
  phraseText: { fontSize: 15, fontWeight: "600" },
  phraseMeaning: { fontSize: 12, marginTop: 2 },
  expandedContent: { paddingHorizontal: 12, paddingBottom: 14, gap: 12 },
  contextBox: { flexDirection: "row", alignItems: "flex-start", gap: 8, padding: 10, borderRadius: 8 },
  contextText: { fontSize: 13, lineHeight: 18, flex: 1 },
  slangPreview: { gap: 4 },
  slangTitle: { fontSize: 14, fontWeight: "700", marginBottom: 4 },
  slangItem: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 8, borderBottomWidth: 0.5 },
  slangItemContent: { flex: 1 },
  slangExpression: { fontSize: 14, fontWeight: "600" },
  slangMeaning: { fontSize: 12, marginTop: 2 },
  actionRow: { flexDirection: "row", gap: 10, marginTop: 4 },
  actionBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 10, borderRadius: 10 },
  actionBtnText: { fontSize: 13, fontWeight: "600" },
});
