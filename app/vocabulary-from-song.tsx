import { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Platform,
  FlatList,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { ScreenContainer } from "@/components/screen-container";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";

const Colors = {
  bg: "#0A0A0F",
  surface: "#14141A",
  surfaceCard: "#1C1C24",
  textPrimary: "#FFFFFF",
  textSecondary: "#9CA3AF",
  secondary: "#6366F1",
  gold: "#F59E0B",
  success: "#22C55E",
  error: "#EF4444",
  border: "#2A2A35",
};

interface VocabWord {
  id: string;
  word: string;
  translation: string;
  partOfSpeech: string;
  example: string;
  pronunciation?: string;
  mastered: boolean;
}

const STORAGE_KEY = "@song_vocabulary";

export default function VocabularyFromSongScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ songTitle?: string; words?: string }>();
  const [words, setWords] = useState<VocabWord[]>([]);
  const [filter, setFilter] = useState<"all" | "learning" | "mastered">("all");

  useEffect(() => {
    loadVocabulary();
  }, []);

  const loadVocabulary = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        setWords(JSON.parse(stored));
      } else {
        // Default vocabulary from songs
        const defaultWords: VocabWord[] = [
          { id: "1", word: "comer", translation: "to eat", partOfSpeech: "verb", example: "Yo como arroz todos los días", pronunciation: "koh-MEHR", mastered: false },
          { id: "2", word: "beber", translation: "to drink", partOfSpeech: "verb", example: "Ella bebe agua fría", pronunciation: "beh-BEHR", mastered: false },
          { id: "3", word: "correr", translation: "to run", partOfSpeech: "verb", example: "Nosotros corremos en el parque", pronunciation: "koh-RREHR", mastered: false },
          { id: "4", word: "aprender", translation: "to learn", partOfSpeech: "verb", example: "Tú aprendes español rápido", pronunciation: "ah-prehn-DEHR", mastered: false },
          { id: "5", word: "leer", translation: "to read", partOfSpeech: "verb", example: "Ellos leen libros interesantes", pronunciation: "leh-EHR", mastered: false },
          { id: "6", word: "entender", translation: "to understand", partOfSpeech: "verb", example: "¿Tú entiendes la lección?", pronunciation: "ehn-tehn-DEHR", mastered: false },
          { id: "7", word: "vender", translation: "to sell", partOfSpeech: "verb", example: "Él vende frutas en el mercado", pronunciation: "behn-DEHR", mastered: false },
          { id: "8", word: "responder", translation: "to respond", partOfSpeech: "verb", example: "Ella responde las preguntas", pronunciation: "rehs-pohn-DEHR", mastered: false },
        ];
        setWords(defaultWords);
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(defaultWords));
      }
    } catch {}
  };

  const toggleMastered = async (wordId: string) => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const updated = words.map((w) => (w.id === wordId ? { ...w, mastered: !w.mastered } : w));
    setWords(updated);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  const filteredWords = words.filter((w) => {
    if (filter === "learning") return !w.mastered;
    if (filter === "mastered") return w.mastered;
    return true;
  });

  const masteredCount = words.filter((w) => w.mastered).length;

  const renderWord = ({ item }: { item: VocabWord }) => (
    <TouchableOpacity
      style={[styles.wordCard, item.mastered && styles.wordCardMastered]}
      onPress={() => toggleMastered(item.id)}
      activeOpacity={0.7}
    >
      <View style={styles.wordHeader}>
        <View style={styles.wordMain}>
          <Text style={styles.wordText}>{item.word}</Text>
          <Text style={styles.posText}>{item.partOfSpeech}</Text>
        </View>
        <View style={[styles.masteredBadge, item.mastered && styles.masteredBadgeActive]}>
          {item.mastered ? (
            <Ionicons name="checkmark-circle" size={22} color={Colors.success} />
          ) : (
            <Ionicons name="ellipse-outline" size={22} color={Colors.border} />
          )}
        </View>
      </View>
      <Text style={styles.translationText}>{item.translation}</Text>
      {item.pronunciation && (
        <Text style={styles.pronunciationText}>/{item.pronunciation}/</Text>
      )}
      <View style={styles.exampleRow}>
        <Ionicons name="chatbubble-outline" size={12} color={Colors.textSecondary} />
        <Text style={styles.exampleText}>{item.example}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <ScreenContainer className="bg-background">
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Song Vocabulary</Text>
          <View style={{ width: 36 }} />
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{words.length}</Text>
            <Text style={styles.statLabel}>Total Words</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: Colors.success }]}>{masteredCount}</Text>
            <Text style={styles.statLabel}>Mastered</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: Colors.gold }]}>{words.length - masteredCount}</Text>
            <Text style={styles.statLabel}>Learning</Text>
          </View>
        </View>

        {/* Filter Tabs */}
        <View style={styles.filterRow}>
          {(["all", "learning", "mastered"] as const).map((f) => (
            <TouchableOpacity
              key={f}
              style={[styles.filterTab, filter === f && styles.filterTabActive]}
              onPress={() => setFilter(f)}
            >
              <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Word List */}
        <FlatList
          data={filteredWords}
          renderItem={renderWord}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="book-outline" size={40} color={Colors.textSecondary} />
              <Text style={styles.emptyText}>No words in this category yet</Text>
            </View>
          }
        />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 12 },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.surfaceCard, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 17, fontWeight: "700", color: Colors.textPrimary },

  statsRow: { flexDirection: "row", justifyContent: "space-around", paddingVertical: 16, marginHorizontal: 16, backgroundColor: Colors.surfaceCard, borderRadius: 14, marginBottom: 16, borderWidth: 1, borderColor: Colors.border },
  statItem: { alignItems: "center" },
  statNumber: { fontSize: 22, fontWeight: "800", color: Colors.textPrimary },
  statLabel: { fontSize: 11, color: Colors.textSecondary, marginTop: 2 },

  filterRow: { flexDirection: "row", marginHorizontal: 16, marginBottom: 16, gap: 8 },
  filterTab: { flex: 1, paddingVertical: 8, borderRadius: 8, backgroundColor: Colors.surfaceCard, alignItems: "center" },
  filterTabActive: { backgroundColor: Colors.secondary + "20", borderWidth: 1, borderColor: Colors.secondary },
  filterText: { fontSize: 13, fontWeight: "600", color: Colors.textSecondary },
  filterTextActive: { color: Colors.secondary },

  wordCard: { backgroundColor: Colors.surfaceCard, borderRadius: 14, padding: 16, marginBottom: 10, borderWidth: 1, borderColor: Colors.border },
  wordCardMastered: { borderColor: Colors.success + "40" },
  wordHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
  wordMain: { flexDirection: "row", alignItems: "center", gap: 8 },
  wordText: { fontSize: 18, fontWeight: "700", color: Colors.textPrimary },
  posText: { fontSize: 11, color: Colors.secondary, backgroundColor: Colors.secondary + "15", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  masteredBadge: {},
  masteredBadgeActive: {},
  translationText: { fontSize: 14, color: Colors.textSecondary, marginBottom: 4 },
  pronunciationText: { fontSize: 12, color: Colors.gold, fontStyle: "italic", marginBottom: 6 },
  exampleRow: { flexDirection: "row", alignItems: "flex-start", gap: 6, marginTop: 4 },
  exampleText: { fontSize: 12, color: Colors.textSecondary, flex: 1, lineHeight: 18, fontStyle: "italic" },

  emptyState: { alignItems: "center", paddingVertical: 40, gap: 10 },
  emptyText: { fontSize: 14, color: Colors.textSecondary },
});
