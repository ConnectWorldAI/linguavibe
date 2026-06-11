/**
 * Conversation Phrasebook Screen
 * 
 * Pre-built situational phrases (restaurant, airport, dating, etc.)
 * with audio playback via device TTS. Categories with AI-generated phrases.
 */
import React, { useState, useCallback } from "react";
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator,
  Platform, Modal, ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import * as Speech from "expo-speech";
import { ScreenContainer } from "@/components/screen-container";
import { Colors, Spacing, FontSize, BorderRadius } from "@/constants/Colors";
import { createVanillaClient } from "@/lib/trpc";

type Category = { id: string; name: string; icon: string; color: string };
type Phrase = {
  id: string; phrase: string; translation: string;
  pronunciation: string; context: string;
  formality: "formal" | "casual" | "slang"; difficulty: number;
};

export default function ConversationPhrasebookScreen() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [phrases, setPhrases] = useState<Phrase[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const [customModal, setCustomModal] = useState(false);
  const [customSituation, setCustomSituation] = useState("");
  const [targetLanguage] = useState("Spanish");

  // Load categories on mount
  React.useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const client = createVanillaClient();
      const result = await client.phrasebook.getCategories.query();
      setCategories(result);
    } catch {
      // Fallback categories
      setCategories([
        { id: "restaurant", name: "Restaurant & Food", icon: "🍽️", color: "#FF6B35" },
        { id: "airport", name: "Airport & Travel", icon: "✈️", color: "#00AAFF" },
        { id: "dating", name: "Dating & Romance", icon: "💕", color: "#FF4081" },
        { id: "shopping", name: "Shopping & Markets", icon: "🛍️", color: "#9C27B0" },
        { id: "hotel", name: "Hotel & Accommodation", icon: "🏨", color: "#4CAF50" },
        { id: "emergency", name: "Emergency & Health", icon: "🚨", color: "#F44336" },
        { id: "directions", name: "Directions & Transport", icon: "🗺️", color: "#FF9800" },
        { id: "nightlife", name: "Nightlife & Bars", icon: "🎶", color: "#7C4DFF" },
        { id: "business", name: "Business & Formal", icon: "💼", color: "#607D8B" },
        { id: "smalltalk", name: "Small Talk & Greetings", icon: "👋", color: "#00BCD4" },
        { id: "compliments", name: "Compliments & Flirting", icon: "😊", color: "#E91E63" },
        { id: "sports", name: "Sports & Fitness", icon: "⚽", color: "#8BC34A" },
      ]);
    } finally {
      setLoadingCategories(false);
    }
  };

  const loadPhrases = async (category: Category) => {
    setSelectedCategory(category);
    setLoading(true);
    setPhrases([]);
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      const client = createVanillaClient();
      const result = await client.phrasebook.getPhrases.query({
        categoryId: category.id,
        targetLanguage,
      });
      setPhrases(result.phrases || []);
    } catch {
      setPhrases([]);
    } finally {
      setLoading(false);
    }
  };

  const speakPhrase = useCallback((phrase: Phrase) => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSpeakingId(phrase.id);
    Speech.speak(phrase.phrase, {
      language: "es-ES",
      rate: 0.8,
      onDone: () => setSpeakingId(null),
      onError: () => setSpeakingId(null),
    });
  }, []);

  const renderCategory = ({ item }: { item: Category }) => (
    <TouchableOpacity
      style={[s.categoryCard, { borderColor: item.color + "40" }]}
      onPress={() => loadPhrases(item)}
      activeOpacity={0.7}
    >
      <Text style={s.categoryIcon}>{item.icon}</Text>
      <Text style={s.categoryName}>{item.name}</Text>
    </TouchableOpacity>
  );

  const renderPhrase = ({ item }: { item: Phrase }) => (
    <View style={s.phraseCard}>
      <View style={s.phraseHeader}>
        <View style={[s.formalityBadge, { backgroundColor: item.formality === "slang" ? "#FF4081" : item.formality === "casual" ? "#FF9800" : "#4CAF50" }]}>
          <Text style={s.formalityText}>{item.formality}</Text>
        </View>
        <TouchableOpacity
          onPress={() => speakPhrase(item)}
          style={[s.speakBtn, speakingId === item.id && s.speakBtnActive]}
        >
          <Ionicons name={speakingId === item.id ? "volume-high" : "volume-medium"} size={20} color="#00AAFF" />
        </TouchableOpacity>
      </View>
      <Text style={s.phraseText}>{item.phrase}</Text>
      <Text style={s.translationText}>{item.translation}</Text>
      <Text style={s.pronunciationText}>{item.pronunciation}</Text>
      <Text style={s.contextText}>{item.context}</Text>
    </View>
  );

  return (
    <ScreenContainer>
      <View style={s.container}>
        {/* Header */}
        <View style={s.header}>
          <TouchableOpacity onPress={() => selectedCategory ? setSelectedCategory(null) : router.back()} style={s.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#ECEDEE" />
          </TouchableOpacity>
          <Text style={s.title}>{selectedCategory ? selectedCategory.name : "Phrasebook"}</Text>
          <View style={{ width: 40 }} />
        </View>

        {!selectedCategory ? (
          /* Category Grid */
          <FlatList
            data={categories}
            renderItem={renderCategory}
            keyExtractor={(item) => item.id}
            numColumns={2}
            contentContainerStyle={s.grid}
            columnWrapperStyle={s.gridRow}
            ListHeaderComponent={
              <Text style={s.subtitle}>Choose a situation to get essential phrases</Text>
            }
          />
        ) : (
          /* Phrase List */
          loading ? (
            <View style={s.loadingContainer}>
              <ActivityIndicator size="large" color="#00AAFF" />
              <Text style={s.loadingText}>Generating phrases...</Text>
            </View>
          ) : (
            <FlatList
              data={phrases}
              renderItem={renderPhrase}
              keyExtractor={(item) => item.id}
              contentContainerStyle={s.phraseList}
              ListEmptyComponent={
                <Text style={s.emptyText}>No phrases available. Try again.</Text>
              }
            />
          )
        )}
      </View>
    </ScreenContainer>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.primary },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 12 },
  backBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 20, fontWeight: "700", color: "#ECEDEE" },
  subtitle: { fontSize: 14, color: "#9BA1A6", textAlign: "center", marginBottom: 16, paddingHorizontal: 16 },
  grid: { paddingHorizontal: 12, paddingBottom: 100 },
  gridRow: { justifyContent: "space-between", marginBottom: 12 },
  categoryCard: { width: "48%", backgroundColor: "#141825", borderRadius: 16, padding: 20, alignItems: "center", borderWidth: 1 },
  categoryIcon: { fontSize: 36, marginBottom: 8 },
  categoryName: { fontSize: 13, fontWeight: "600", color: "#ECEDEE", textAlign: "center" },
  loadingContainer: { flex: 1, alignItems: "center", justifyContent: "center" },
  loadingText: { fontSize: 14, color: "#9BA1A6", marginTop: 12 },
  phraseList: { paddingHorizontal: 16, paddingBottom: 100 },
  phraseCard: { backgroundColor: "#141825", borderRadius: 12, padding: 16, marginBottom: 12 },
  phraseHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  formalityBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  formalityText: { fontSize: 10, fontWeight: "600", color: "#FFF", textTransform: "uppercase" },
  speakBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: "rgba(0,170,255,0.1)", alignItems: "center", justifyContent: "center" },
  speakBtnActive: { backgroundColor: "rgba(0,170,255,0.3)" },
  phraseText: { fontSize: 18, fontWeight: "700", color: "#FFFFFF", marginBottom: 4 },
  translationText: { fontSize: 14, color: "#9BA1A6", marginBottom: 4 },
  pronunciationText: { fontSize: 12, color: "#00AAFF", fontStyle: "italic", marginBottom: 6 },
  contextText: { fontSize: 12, color: "#687076" },
  emptyText: { fontSize: 14, color: "#687076", textAlign: "center", marginTop: 40 },
});
