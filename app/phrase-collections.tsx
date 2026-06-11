/**
 * Phrase Collections/Boards Screen
 * 
 * Let users organize saved translations into themed boards
 * (Travel, Food, Music, Slang). Pinterest-style organization.
 */
import React, { useState, useEffect } from "react";
import {
  View, Text, TouchableOpacity, StyleSheet, Platform,
  FlatList, TextInput, Alert, Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ScreenContainer } from "@/components/screen-container";
import { Colors } from "@/constants/Colors";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

type PhraseItem = {
  id: string;
  original: string;
  translated: string;
  language: string;
  addedAt: string;
};

type Collection = {
  id: string;
  name: string;
  icon: string;
  color: string;
  phrases: PhraseItem[];
  createdAt: string;
};

const STORAGE_KEY = "linguavibe_phrase_collections";

const DEFAULT_COLLECTIONS: Collection[] = [
  { id: "travel", name: "Travel", icon: "✈️", color: "#00BCD4", phrases: [
    { id: "t1", original: "Where is the nearest metro?", translated: "¿Dónde está el metro más cercano?", language: "Spanish", addedAt: new Date().toISOString() },
    { id: "t2", original: "How much is a taxi to the airport?", translated: "¿Cuánto cuesta un taxi al aeropuerto?", language: "Spanish", addedAt: new Date().toISOString() },
    { id: "t3", original: "I have a reservation", translated: "Tengo una reservación", language: "Spanish", addedAt: new Date().toISOString() },
  ], createdAt: new Date().toISOString() },
  { id: "food", name: "Food & Dining", icon: "🍽️", color: "#FF9800", phrases: [
    { id: "f1", original: "Can I see the menu?", translated: "¿Puedo ver el menú?", language: "Spanish", addedAt: new Date().toISOString() },
    { id: "f2", original: "I'm allergic to nuts", translated: "Soy alérgico a los frutos secos", language: "Spanish", addedAt: new Date().toISOString() },
  ], createdAt: new Date().toISOString() },
  { id: "music", name: "Music & Lyrics", icon: "🎵", color: "#9C27B0", phrases: [], createdAt: new Date().toISOString() },
  { id: "slang", name: "Slang & Idioms", icon: "🔥", color: "#FF6B35", phrases: [
    { id: "s1", original: "That's cool!", translated: "¡Qué chévere!", language: "Spanish", addedAt: new Date().toISOString() },
    { id: "s2", original: "No way!", translated: "¡No joda!", language: "Spanish", addedAt: new Date().toISOString() },
  ], createdAt: new Date().toISOString() },
  { id: "dating", name: "Dating & Social", icon: "💬", color: "#E91E63", phrases: [], createdAt: new Date().toISOString() },
  { id: "work", name: "Work & Business", icon: "💼", color: "#607D8B", phrases: [], createdAt: new Date().toISOString() },
];

export default function PhraseCollectionsScreen() {
  const router = useRouter();
  const [collections, setCollections] = useState<Collection[]>([]);
  const [selectedCollection, setSelectedCollection] = useState<Collection | null>(null);
  const [showNewBoard, setShowNewBoard] = useState(false);
  const [newBoardName, setNewBoardName] = useState("");

  useEffect(() => {
    loadCollections();
  }, []);

  const loadCollections = async () => {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEY);
      if (data) setCollections(JSON.parse(data));
      else {
        setCollections(DEFAULT_COLLECTIONS);
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_COLLECTIONS));
      }
    } catch {}
  };

  const saveCollections = async (updated: Collection[]) => {
    setCollections(updated);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  const createBoard = async () => {
    if (!newBoardName.trim()) return;
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const newCollection: Collection = {
      id: Date.now().toString(),
      name: newBoardName.trim(),
      icon: "📌",
      color: "#00AAFF",
      phrases: [],
      createdAt: new Date().toISOString(),
    };
    await saveCollections([...collections, newCollection]);
    setNewBoardName("");
    setShowNewBoard(false);
  };

  const deletePhrase = async (collectionId: string, phraseId: string) => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const updated = collections.map(c => {
      if (c.id === collectionId) {
        return { ...c, phrases: c.phrases.filter(p => p.id !== phraseId) };
      }
      return c;
    });
    await saveCollections(updated);
    if (selectedCollection) {
      setSelectedCollection(updated.find(c => c.id === selectedCollection.id) || null);
    }
  };

  // Collection detail view
  if (selectedCollection) {
    return (
      <ScreenContainer>
        <View style={s.container}>
          <View style={s.header}>
            <TouchableOpacity onPress={() => setSelectedCollection(null)} style={s.backBtn}>
              <Ionicons name="arrow-back" size={24} color="#ECEDEE" />
            </TouchableOpacity>
            <Text style={s.title}>{selectedCollection.icon} {selectedCollection.name}</Text>
            <Text style={s.phraseCount}>{selectedCollection.phrases.length}</Text>
          </View>

          <FlatList
            data={selectedCollection.phrases}
            renderItem={({ item }) => (
              <View style={s.phraseCard}>
                <View style={s.phraseContent}>
                  <Text style={s.phraseOriginal}>{item.original}</Text>
                  <Text style={s.phraseTranslated}>{item.translated}</Text>
                  <Text style={s.phraseMeta}>{item.language} • {new Date(item.addedAt).toLocaleDateString()}</Text>
                </View>
                <TouchableOpacity onPress={() => deletePhrase(selectedCollection.id, item.id)} style={s.deleteBtn}>
                  <Ionicons name="trash-outline" size={16} color="#F44336" />
                </TouchableOpacity>
              </View>
            )}
            keyExtractor={(item) => item.id}
            contentContainerStyle={s.phraseList}
            ListEmptyComponent={
              <View style={s.emptyState}>
                <Text style={{ fontSize: 48 }}>📭</Text>
                <Text style={s.emptyTitle}>No phrases yet</Text>
                <Text style={s.emptySubtitle}>Translate something and save it to this board</Text>
              </View>
            }
          />
        </View>
      </ScreenContainer>
    );
  }

  // Board grid view
  return (
    <ScreenContainer>
      <View style={s.container}>
        <View style={s.header}>
          <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#ECEDEE" />
          </TouchableOpacity>
          <Text style={s.title}>Collections</Text>
          <TouchableOpacity onPress={() => setShowNewBoard(true)} style={s.addBtn}>
            <Ionicons name="add" size={24} color="#00AAFF" />
          </TouchableOpacity>
        </View>

        {/* New board input */}
        {showNewBoard && (
          <View style={s.newBoardRow}>
            <TextInput
              style={s.newBoardInput}
              placeholder="Board name..."
              placeholderTextColor="#687076"
              value={newBoardName}
              onChangeText={setNewBoardName}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={createBoard}
            />
            <TouchableOpacity onPress={createBoard} style={s.createBtn}>
              <Text style={s.createBtnText}>Create</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShowNewBoard(false)} style={s.cancelBtn}>
              <Ionicons name="close" size={20} color="#9BA1A6" />
            </TouchableOpacity>
          </View>
        )}

        {/* Collections grid */}
        <FlatList
          data={collections}
          numColumns={2}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => setSelectedCollection(item)}
              style={[s.boardCard, { borderColor: item.color + "40" }]}
              activeOpacity={0.7}
            >
              <Text style={s.boardIcon}>{item.icon}</Text>
              <Text style={s.boardName}>{item.name}</Text>
              <Text style={s.boardCount}>{item.phrases.length} phrases</Text>
              <View style={[s.boardAccent, { backgroundColor: item.color }]} />
            </TouchableOpacity>
          )}
          keyExtractor={(item) => item.id}
          contentContainerStyle={s.boardGrid}
          columnWrapperStyle={s.boardRow}
        />
      </View>
    </ScreenContainer>
  );
}

const CARD_WIDTH = (SCREEN_WIDTH - 48) / 2;

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.primary },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 12 },
  backBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 20, fontWeight: "700", color: "#ECEDEE" },
  addBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(0,170,255,0.15)", alignItems: "center", justifyContent: "center" },
  phraseCount: { fontSize: 14, color: "#9BA1A6", backgroundColor: "#1C2235", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  newBoardRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, marginBottom: 12, gap: 8 },
  newBoardInput: { flex: 1, backgroundColor: "#141825", borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, color: "#ECEDEE" },
  createBtn: { backgroundColor: "#00AAFF", paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10 },
  createBtnText: { fontSize: 13, fontWeight: "700", color: "#FFF" },
  cancelBtn: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  boardGrid: { paddingHorizontal: 16, paddingBottom: 100 },
  boardRow: { gap: 12, marginBottom: 12 },
  boardCard: { width: CARD_WIDTH, backgroundColor: "#141825", borderRadius: 14, padding: 16, borderWidth: 1, overflow: "hidden" },
  boardIcon: { fontSize: 28, marginBottom: 8 },
  boardName: { fontSize: 14, fontWeight: "700", color: "#ECEDEE", marginBottom: 4 },
  boardCount: { fontSize: 11, color: "#9BA1A6" },
  boardAccent: { position: "absolute", bottom: 0, left: 0, right: 0, height: 3 },
  // Phrase list
  phraseList: { paddingHorizontal: 16, paddingBottom: 100 },
  phraseCard: { flexDirection: "row", backgroundColor: "#141825", borderRadius: 12, padding: 14, marginBottom: 8 },
  phraseContent: { flex: 1 },
  phraseOriginal: { fontSize: 14, fontWeight: "600", color: "#ECEDEE", marginBottom: 2 },
  phraseTranslated: { fontSize: 13, color: "#00AAFF", marginBottom: 4 },
  phraseMeta: { fontSize: 10, color: "#687076" },
  deleteBtn: { width: 32, height: 32, alignItems: "center", justifyContent: "center" },
  emptyState: { alignItems: "center", marginTop: 60 },
  emptyTitle: { fontSize: 18, fontWeight: "700", color: "#ECEDEE", marginTop: 12 },
  emptySubtitle: { fontSize: 13, color: "#9BA1A6", marginTop: 4, textAlign: "center" },
});
