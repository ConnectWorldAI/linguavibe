import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";

type TrendingItem = {
  id: string;
  word: string;
  language: string;
  flag: string;
  meaning: string;
  context: string;
  origin: string;
  category: "slang" | "viral" | "cultural" | "tech";
  trending: number; // percentage increase
  examples: string[];
  saved: boolean;
};

const TRENDING: TrendingItem[] = [
  { id: "1", word: "Rizz", language: "English", flag: "🇺🇸", meaning: "Charisma or charm, especially in attracting romantic interest", context: "Gen Z slang popularized on TikTok in 2023", origin: "Shortened from 'charisma'", category: "slang", trending: 340, examples: ["He's got unspoken rizz", "That was a rizz move"], saved: false },
  { id: "2", word: "Mola mucho", language: "Spanish", flag: "🇪🇸", meaning: "That's really cool / awesome", context: "Common in Spain (less in Latin America)", origin: "From Romani 'mol' (to be worth)", category: "slang", trending: 120, examples: ["¡Tu coche mola mucho!", "Esta canción mola"], saved: true },
  { id: "3", word: "Kilig", language: "Filipino", flag: "🇵🇭", meaning: "The feeling of butterflies in your stomach from something romantic", context: "Untranslatable word gaining global popularity", origin: "Tagalog emotional vocabulary", category: "cultural", trending: 85, examples: ["Kilig na kilig ako!", "That scene gave me kilig"], saved: false },
  { id: "4", word: "Slay", language: "French (adopted)", flag: "🇫🇷", meaning: "To do something exceptionally well (adopted from English)", context: "French Gen Z using English loanwords", origin: "English via social media", category: "viral", trending: 200, examples: ["Elle a trop slayé", "Tu slay toujours"], saved: false },
  { id: "5", word: "草 (kusa)", language: "Japanese", flag: "🇯🇵", meaning: "LOL / laughing (literally 'grass' because www looks like grass)", context: "Internet slang used in chat and social media", origin: "www → looks like grass → 草", category: "tech", trending: 95, examples: ["それ草", "草生える"], saved: true },
  { id: "6", word: "Hygge", language: "Danish", flag: "🇩🇰", meaning: "A cozy, warm atmosphere; enjoying simple pleasures with loved ones", context: "Cultural concept gaining worldwide recognition", origin: "Old Norse 'hugga' (to comfort)", category: "cultural", trending: 60, examples: ["Let's have a hygge evening", "This café is so hygge"], saved: false },
  { id: "7", word: "Cringe", language: "German (adopted)", flag: "🇩🇪", meaning: "Embarrassing, awkward (adopted from English)", context: "Named Germany's youth word of the year 2021", origin: "English via social media", category: "viral", trending: 150, examples: ["Das ist so cringe", "Cringe Moment"], saved: false },
];

export default function TrendingUpdatesScreen() {
  const colors = useColors();
  const [items, setItems] = useState(TRENDING);
  const [filter, setFilter] = useState<"all" | "slang" | "viral" | "cultural" | "tech">("all");

  const filtered = items.filter((i) => filter === "all" || i.category === filter);

  const toggleSave = (id: string) => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setItems((prev) => prev.map((i) => i.id === id ? { ...i, saved: !i.saved } : i));
  };

  const categoryColors: Record<string, string> = {
    slang: "#A855F7",
    viral: "#EC4899",
    cultural: "#F59E0B",
    tech: "#3B82F6",
  };

  const renderItem = ({ item }: { item: TrendingItem }) => (
    <View style={[styles.trendCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      {/* Header */}
      <View style={styles.trendHeader}>
        <View style={styles.trendLeft}>
          <Text style={styles.trendFlag}>{item.flag}</Text>
          <View>
            <Text style={[styles.trendWord, { color: colors.foreground }]}>{item.word}</Text>
            <Text style={[styles.trendLang, { color: colors.muted }]}>{item.language}</Text>
          </View>
        </View>
        <View style={styles.trendRight}>
          <View style={[styles.trendBadge, { backgroundColor: categoryColors[item.category] + "15" }]}>
            <Text style={[styles.trendBadgeText, { color: categoryColors[item.category] }]}>{item.category}</Text>
          </View>
          <View style={[styles.trendingUp, { backgroundColor: "#22C55E15" }]}>
            <Ionicons name="trending-up" size={12} color="#22C55E" />
            <Text style={[styles.trendingText, { color: "#22C55E" }]}>+{item.trending}%</Text>
          </View>
        </View>
      </View>

      {/* Meaning */}
      <Text style={[styles.trendMeaning, { color: colors.foreground }]}>{item.meaning}</Text>
      <Text style={[styles.trendContext, { color: colors.muted }]}>{item.context}</Text>

      {/* Origin */}
      <View style={[styles.originRow, { backgroundColor: colors.background, borderColor: colors.border }]}>
        <Ionicons name="time" size={12} color={colors.muted} />
        <Text style={[styles.originText, { color: colors.muted }]}>Origin: {item.origin}</Text>
      </View>

      {/* Examples */}
      <View style={styles.examplesSection}>
        {item.examples.map((ex, i) => (
          <View key={i} style={styles.exampleRow}>
            <Text style={[styles.exampleBullet, { color: colors.primary }]}>•</Text>
            <Text style={[styles.exampleText, { color: colors.foreground }]}>"{ex}"</Text>
          </View>
        ))}
      </View>

      {/* Actions */}
      <View style={styles.trendActions}>
        <TouchableOpacity onPress={() => toggleSave(item.id)} style={styles.saveBtn}>
          <Ionicons name={item.saved ? "bookmark" : "bookmark-outline"} size={18} color={item.saved ? colors.primary : colors.muted} />
          <Text style={[styles.saveBtnText, { color: item.saved ? colors.primary : colors.muted }]}>
            {item.saved ? "Saved" : "Save"}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.practiceBtn, { backgroundColor: colors.primary + "10" }]}>
          <Ionicons name="mic" size={14} color={colors.primary} />
          <Text style={[styles.practiceBtnText, { color: colors.primary }]}>Practice</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <ScreenContainer edges={["top", "left", "right"]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Trending Words</Text>
        <View style={{ width: 32 }} />
      </View>

      {/* Filters */}
      <View style={styles.filterRow}>
        {(["all", "slang", "viral", "cultural", "tech"] as const).map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterBtn, {
              backgroundColor: filter === f ? (f === "all" ? colors.primary : categoryColors[f]) + "15" : colors.surface,
              borderColor: filter === f ? (f === "all" ? colors.primary : categoryColors[f]) : colors.border,
            }]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.filterText, { color: filter === f ? (f === "all" ? colors.primary : categoryColors[f]) : colors.muted }]}>
              {f === "all" ? "All" : f.charAt(0).toUpperCase() + f.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filtered}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.content}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 0.5 },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 17, fontWeight: "700" },
  filterRow: { flexDirection: "row", paddingHorizontal: 16, paddingVertical: 10, gap: 6 },
  filterBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, borderWidth: 1 },
  filterText: { fontSize: 11, fontWeight: "700" },
  content: { padding: 16, paddingBottom: 100 },
  trendCard: { padding: 14, borderRadius: 14, borderWidth: 1, marginBottom: 12 },
  trendHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 },
  trendLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  trendFlag: { fontSize: 24 },
  trendWord: { fontSize: 17, fontWeight: "800" },
  trendLang: { fontSize: 11, marginTop: 1 },
  trendRight: { flexDirection: "row", gap: 6 },
  trendBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  trendBadgeText: { fontSize: 9, fontWeight: "800", textTransform: "uppercase" },
  trendingUp: { flexDirection: "row", alignItems: "center", gap: 3, paddingHorizontal: 6, paddingVertical: 3, borderRadius: 6 },
  trendingText: { fontSize: 10, fontWeight: "700" },
  trendMeaning: { fontSize: 14, fontWeight: "600", lineHeight: 20, marginBottom: 4 },
  trendContext: { fontSize: 12, lineHeight: 16, marginBottom: 8 },
  originRow: { flexDirection: "row", alignItems: "center", gap: 6, padding: 8, borderRadius: 6, borderWidth: 0.5, marginBottom: 8 },
  originText: { fontSize: 11 },
  examplesSection: { marginBottom: 10 },
  exampleRow: { flexDirection: "row", alignItems: "flex-start", gap: 6, marginBottom: 4 },
  exampleBullet: { fontSize: 14, fontWeight: "700" },
  exampleText: { fontSize: 13, fontStyle: "italic", flex: 1 },
  trendActions: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  saveBtn: { flexDirection: "row", alignItems: "center", gap: 4 },
  saveBtnText: { fontSize: 12, fontWeight: "600" },
  practiceBtn: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  practiceBtnText: { fontSize: 12, fontWeight: "700" },
});
