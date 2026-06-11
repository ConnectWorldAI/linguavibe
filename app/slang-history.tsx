import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  Platform,
  StyleSheet,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Speech from "expo-speech";
import * as Haptics from "expo-haptics";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import {
  getSlangOfDayHistory,
  type SlangOfDayEntry,
} from "@/lib/slang-of-the-day-notification";

const FAVORITES_KEY = "@slang_favorites";

interface FavoriteSlang extends SlangOfDayEntry {
  savedAt: string;
}

type FilterDialect = "all" | string;

export default function SlangHistoryScreen() {
  const router = useRouter();
  const colors = useColors();
  const [history, setHistory] = useState<SlangOfDayEntry[]>([]);
  const [favorites, setFavorites] = useState<FavoriteSlang[]>([]);
  const [search, setSearch] = useState("");
  const [filterDialect, setFilterDialect] = useState<FilterDialect>("all");
  const [tab, setTab] = useState<"history" | "favorites">("history");
  const [speakingId, setSpeakingId] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const h = await getSlangOfDayHistory();
    setHistory(h);
    try {
      const raw = await AsyncStorage.getItem(FAVORITES_KEY);
      if (raw) setFavorites(JSON.parse(raw));
    } catch {}
  };

  const dialects = React.useMemo(() => {
    const set = new Set(history.map((e) => e.dialect));
    return ["all", ...Array.from(set).sort()];
  }, [history]);

  const filteredData = React.useMemo(() => {
    const source = tab === "history" ? history : favorites;
    let result = source;
    if (filterDialect !== "all") {
      result = result.filter((e) => e.dialect === filterDialect);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (e) =>
          e.expression.toLowerCase().includes(q) ||
          e.meaning.toLowerCase().includes(q) ||
          e.dialect.toLowerCase().includes(q)
      );
    }
    return result;
  }, [tab, history, favorites, filterDialect, search]);

  const isFavorite = useCallback(
    (expression: string) => favorites.some((f) => f.expression === expression),
    [favorites]
  );

  const toggleFavorite = async (entry: SlangOfDayEntry) => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    let updated: FavoriteSlang[];
    if (isFavorite(entry.expression)) {
      updated = favorites.filter((f) => f.expression !== entry.expression);
    } else {
      updated = [{ ...entry, savedAt: new Date().toISOString() }, ...favorites];
    }
    setFavorites(updated);
    await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(updated));
  };

  const speakSlang = (entry: SlangOfDayEntry) => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const id = entry.expression + entry.date;
    if (speakingId === id) {
      Speech.stop();
      setSpeakingId(null);
      return;
    }
    setSpeakingId(id);
    const langCode = entry.language?.toLowerCase().startsWith("span") ? "es" : entry.language?.slice(0, 2) || "es";
    Speech.speak(entry.expression, {
      language: langCode,
      rate: 0.75,
      onDone: () => setSpeakingId(null),
      onStopped: () => setSpeakingId(null),
    });
  };

  const renderItem = ({ item }: { item: SlangOfDayEntry }) => {
    const id = item.expression + item.date;
    const isSpeaking = speakingId === id;
    const fav = isFavorite(item.expression);

    return (
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.cardHeader}>
          <View style={styles.dialectBadge}>
            <Text style={styles.dialectFlag}>{item.dialectFlag}</Text>
            <Text style={[styles.dialectText, { color: colors.muted }]}>{item.dialect}</Text>
          </View>
          <Text style={[styles.dateText, { color: colors.muted }]}>{item.date}</Text>
        </View>

        <Text style={[styles.expression, { color: colors.foreground }]}>{item.expression}</Text>
        <Text style={[styles.meaning, { color: colors.muted }]}>{item.meaning}</Text>

        {item.example ? (
          <View style={[styles.exampleBox, { backgroundColor: colors.background }]}>
            <Text style={[styles.exampleText, { color: colors.foreground }]}>"{item.example}"</Text>
            {item.exampleTranslation ? (
              <Text style={[styles.exampleTranslation, { color: colors.muted }]}>
                {item.exampleTranslation}
              </Text>
            ) : null}
          </View>
        ) : null}

        <View style={styles.cardActions}>
          <TouchableOpacity
            onPress={() => speakSlang(item)}
            style={[styles.actionBtn, { backgroundColor: isSpeaking ? colors.primary : colors.background }]}
          >
            <Ionicons
              name={isSpeaking ? "stop" : "volume-high"}
              size={18}
              color={isSpeaking ? colors.background : colors.primary}
            />
            <Text style={[styles.actionText, { color: isSpeaking ? colors.background : colors.primary }]}>
              {isSpeaking ? "Stop" : "Listen"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => toggleFavorite(item)}
            style={[styles.actionBtn, { backgroundColor: fav ? "#FEF3C7" : colors.background }]}
          >
            <Ionicons name={fav ? "star" : "star-outline"} size={18} color={fav ? "#F59E0B" : colors.muted} />
            <Text style={[styles.actionText, { color: fav ? "#F59E0B" : colors.muted }]}>
              {fav ? "Saved" : "Save"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push("/dialect-quiz" as any)}
            style={[styles.actionBtn, { backgroundColor: colors.background }]}
          >
            <Ionicons name="game-controller-outline" size={18} color={colors.primary} />
            <Text style={[styles.actionText, { color: colors.primary }]}>Quiz</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <ScreenContainer>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.foreground }]}>Slang History</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Tabs */}
      <View style={[styles.tabRow, { backgroundColor: colors.surface }]}>
        <TouchableOpacity
          onPress={() => setTab("history")}
          style={[styles.tab, tab === "history" && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
        >
          <Ionicons name="time-outline" size={18} color={tab === "history" ? colors.primary : colors.muted} />
          <Text style={[styles.tabText, { color: tab === "history" ? colors.primary : colors.muted }]}>
            History ({history.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setTab("favorites")}
          style={[styles.tab, tab === "favorites" && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
        >
          <Ionicons name="star" size={18} color={tab === "favorites" ? "#F59E0B" : colors.muted} />
          <Text style={[styles.tabText, { color: tab === "favorites" ? "#F59E0B" : colors.muted }]}>
            Favorites ({favorites.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={[styles.searchRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Ionicons name="search" size={18} color={colors.muted} />
        <TextInput
          style={[styles.searchInput, { color: colors.foreground }]}
          placeholder="Search slang..."
          placeholderTextColor={colors.muted}
          value={search}
          onChangeText={setSearch}
          returnKeyType="done"
        />
        {search ? (
          <TouchableOpacity onPress={() => setSearch("")}>
            <Ionicons name="close-circle" size={18} color={colors.muted} />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Dialect Filter */}
      <FlatList
        horizontal
        data={dialects}
        keyExtractor={(item) => item}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterRow}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => setFilterDialect(item as FilterDialect)}
            style={[
              styles.filterChip,
              {
                backgroundColor: filterDialect === item ? colors.primary : colors.surface,
                borderColor: filterDialect === item ? colors.primary : colors.border,
              },
            ]}
          >
            <Text
              style={[
                styles.filterText,
                { color: filterDialect === item ? colors.background : colors.foreground },
              ]}
            >
              {item === "all" ? "All Dialects" : item}
            </Text>
          </TouchableOpacity>
        )}
      />

      {/* List */}
      <FlatList
        data={filteredData}
        keyExtractor={(item, idx) => item.expression + item.date + idx}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="chatbubble-ellipses-outline" size={48} color={colors.muted} />
            <Text style={[styles.emptyText, { color: colors.muted }]}>
              {tab === "favorites" ? "No favorites yet. Save slang words you want to remember!" : "No slang history yet. Check back tomorrow!"}
            </Text>
          </View>
        }
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 0.5 },
  backBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 18, fontWeight: "700" },
  tabRow: { flexDirection: "row", paddingHorizontal: 16 },
  tab: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 12 },
  tabText: { fontSize: 14, fontWeight: "600" },
  searchRow: { flexDirection: "row", alignItems: "center", marginHorizontal: 16, marginTop: 12, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 10, borderWidth: 1, gap: 8 },
  searchInput: { flex: 1, fontSize: 15 },
  filterRow: { paddingHorizontal: 16, paddingVertical: 10, gap: 8 },
  filterChip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1 },
  filterText: { fontSize: 13, fontWeight: "500" },
  list: { padding: 16, gap: 12, paddingBottom: 100 },
  card: { borderRadius: 14, padding: 16, borderWidth: 1, gap: 8 },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  dialectBadge: { flexDirection: "row", alignItems: "center", gap: 6 },
  dialectFlag: { fontSize: 18 },
  dialectText: { fontSize: 12, fontWeight: "500" },
  dateText: { fontSize: 11 },
  expression: { fontSize: 20, fontWeight: "700" },
  meaning: { fontSize: 14, lineHeight: 20 },
  exampleBox: { padding: 10, borderRadius: 8, marginTop: 4 },
  exampleText: { fontSize: 13, fontStyle: "italic", lineHeight: 18 },
  exampleTranslation: { fontSize: 12, marginTop: 4, lineHeight: 16 },
  cardActions: { flexDirection: "row", gap: 8, marginTop: 8 },
  actionBtn: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  actionText: { fontSize: 12, fontWeight: "600" },
  emptyState: { alignItems: "center", justifyContent: "center", paddingTop: 60, gap: 12 },
  emptyText: { fontSize: 14, textAlign: "center", paddingHorizontal: 40, lineHeight: 20 },
});
