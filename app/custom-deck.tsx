import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet, Platform, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import AsyncStorage from "@react-native-async-storage/async-storage";

const Colors = {
  primary: "#0A0E1A",
  surface: "#141825",
  surfaceElevated: "#1C2235",
  secondary: "#00AAFF",
  textPrimary: "#FFFFFF",
  textSecondary: "#8A9BB0",
  textMuted: "#5A6A7A",
  border: "rgba(255,255,255,0.06)",
  gold: "#FFD700",
  success: "#00E676",
  error: "#FF5252",
  warning: "#FF9F43",
  glowSubtle: "rgba(0,170,255,0.08)",
  glowBorder: "rgba(0,170,255,0.2)",
};

interface CustomCard {
  id: string;
  front: string;
  back: string;
  example: string;
  category: string;
}

interface CustomDeck {
  id: string;
  name: string;
  description: string;
  language: string;
  cards: CustomCard[];
  createdAt: number;
  lastStudied: number | null;
}

const STORAGE_KEY = "custom_decks";

export default function CustomDeckScreen() {
  const router = useRouter();
  const [decks, setDecks] = useState<CustomDeck[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [editingDeck, setEditingDeck] = useState<CustomDeck | null>(null);
  const [showAddCard, setShowAddCard] = useState(false);

  // Deck form
  const [deckName, setDeckName] = useState("");
  const [deckDescription, setDeckDescription] = useState("");
  const [deckLanguage, setDeckLanguage] = useState("");

  // Card form
  const [cardFront, setCardFront] = useState("");
  const [cardBack, setCardBack] = useState("");
  const [cardExample, setCardExample] = useState("");
  const [cardCategory, setCardCategory] = useState("");

  useEffect(() => {
    loadDecks();
  }, []);

  const loadDecks = async () => {
    try {
      const saved = await AsyncStorage.getItem(STORAGE_KEY);
      if (saved) setDecks(JSON.parse(saved));
    } catch (e) {}
  };

  const saveDecks = async (updated: CustomDeck[]) => {
    setDecks(updated);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  const createDeck = () => {
    if (!deckName.trim()) {
      Alert.alert("Required", "Please enter a deck name");
      return;
    }
    if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const newDeck: CustomDeck = {
      id: Date.now().toString(),
      name: deckName.trim(),
      description: deckDescription.trim(),
      language: deckLanguage.trim() || "General",
      cards: [],
      createdAt: Date.now(),
      lastStudied: null,
    };
    const updated = [...decks, newDeck];
    saveDecks(updated);
    setDeckName("");
    setDeckDescription("");
    setDeckLanguage("");
    setShowCreate(false);
    setEditingDeck(newDeck);
  };

  const addCard = () => {
    if (!cardFront.trim() || !cardBack.trim()) {
      Alert.alert("Required", "Please enter front and back text");
      return;
    }
    if (!editingDeck) return;
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const newCard: CustomCard = {
      id: Date.now().toString(),
      front: cardFront.trim(),
      back: cardBack.trim(),
      example: cardExample.trim(),
      category: cardCategory.trim() || "General",
    };

    const updatedDeck = { ...editingDeck, cards: [...editingDeck.cards, newCard] };
    const updatedDecks = decks.map((d) => (d.id === editingDeck.id ? updatedDeck : d));
    saveDecks(updatedDecks);
    setEditingDeck(updatedDeck);
    setCardFront("");
    setCardBack("");
    setCardExample("");
    setCardCategory("");
    setShowAddCard(false);
  };

  const deleteCard = (cardId: string) => {
    if (!editingDeck) return;
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const updatedDeck = { ...editingDeck, cards: editingDeck.cards.filter((c) => c.id !== cardId) };
    const updatedDecks = decks.map((d) => (d.id === editingDeck.id ? updatedDeck : d));
    saveDecks(updatedDecks);
    setEditingDeck(updatedDeck);
  };

  const deleteDeck = (deckId: string) => {
    if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    Alert.alert("Delete Deck", "Are you sure you want to delete this deck?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          const updated = decks.filter((d) => d.id !== deckId);
          saveDecks(updated);
          if (editingDeck?.id === deckId) setEditingDeck(null);
        },
      },
    ]);
  };

  const studyDeck = (deck: CustomDeck) => {
    if (deck.cards.length === 0) {
      Alert.alert("Empty Deck", "Add some cards before studying");
      return;
    }
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // Update lastStudied
    const updatedDecks = decks.map((d) => (d.id === deck.id ? { ...d, lastStudied: Date.now() } : d));
    saveDecks(updatedDecks);
    router.push("/flashcard-review" as any);
  };

  // Deck editing view
  if (editingDeck) {
    return (
      <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setEditingDeck(null)} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>{editingDeck.name}</Text>
            <Text style={styles.headerSub}>{editingDeck.cards.length} cards</Text>
          </View>
          <TouchableOpacity onPress={() => setShowAddCard(true)} style={styles.addBtn}>
            <Ionicons name="add" size={22} color={Colors.secondary} />
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
          {/* Deck Info */}
          <View style={styles.deckInfoCard}>
            <Text style={styles.deckInfoLanguage}>{editingDeck.language}</Text>
            {editingDeck.description ? <Text style={styles.deckInfoDesc}>{editingDeck.description}</Text> : null}
            <TouchableOpacity style={styles.studyBtn} onPress={() => studyDeck(editingDeck)}>
              <Ionicons name="play" size={16} color="#FFFFFF" />
              <Text style={styles.studyBtnText}>Study This Deck</Text>
            </TouchableOpacity>
          </View>

          {/* Add Card Form */}
          {showAddCard && (
            <View style={styles.formCard}>
              <Text style={styles.formTitle}>Add New Card</Text>
              <TextInput
                style={styles.input}
                placeholder="Front (word/phrase)"
                placeholderTextColor={Colors.textMuted}
                value={cardFront}
                onChangeText={setCardFront}
              />
              <TextInput
                style={styles.input}
                placeholder="Back (translation/meaning)"
                placeholderTextColor={Colors.textMuted}
                value={cardBack}
                onChangeText={setCardBack}
              />
              <TextInput
                style={styles.input}
                placeholder="Example sentence (optional)"
                placeholderTextColor={Colors.textMuted}
                value={cardExample}
                onChangeText={setCardExample}
              />
              <TextInput
                style={styles.input}
                placeholder="Category (optional)"
                placeholderTextColor={Colors.textMuted}
                value={cardCategory}
                onChangeText={setCardCategory}
              />
              <View style={styles.formActions}>
                <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowAddCard(false)}>
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.saveBtn} onPress={addCard}>
                  <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                  <Text style={styles.saveBtnText}>Add Card</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Cards List */}
          {editingDeck.cards.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyEmoji}>📝</Text>
              <Text style={styles.emptyTitle}>No cards yet</Text>
              <Text style={styles.emptyDesc}>Tap the + button to add your first flashcard</Text>
            </View>
          ) : (
            <View style={styles.cardsList}>
              {editingDeck.cards.map((card, idx) => (
                <View key={card.id} style={styles.cardItem}>
                  <View style={styles.cardItemLeft}>
                    <Text style={styles.cardNumber}>{idx + 1}</Text>
                    <View style={styles.cardItemContent}>
                      <Text style={styles.cardFrontText}>{card.front}</Text>
                      <Text style={styles.cardBackText}>{card.back}</Text>
                      {card.category && <Text style={styles.cardCategoryText}>{card.category}</Text>}
                    </View>
                  </View>
                  <TouchableOpacity onPress={() => deleteCard(card.id)} style={styles.deleteCardBtn}>
                    <Ionicons name="trash-outline" size={16} color={Colors.error} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Main deck list view
  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Decks</Text>
        <TouchableOpacity onPress={() => setShowCreate(true)} style={styles.addBtn}>
          <Ionicons name="add" size={22} color={Colors.secondary} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Create Deck Form */}
        {showCreate && (
          <View style={styles.formCard}>
            <Text style={styles.formTitle}>Create New Deck</Text>
            <TextInput
              style={styles.input}
              placeholder="Deck name"
              placeholderTextColor={Colors.textMuted}
              value={deckName}
              onChangeText={setDeckName}
            />
            <TextInput
              style={styles.input}
              placeholder="Description (optional)"
              placeholderTextColor={Colors.textMuted}
              value={deckDescription}
              onChangeText={setDeckDescription}
            />
            <TextInput
              style={styles.input}
              placeholder="Language (e.g., Spanish, French)"
              placeholderTextColor={Colors.textMuted}
              value={deckLanguage}
              onChangeText={setDeckLanguage}
            />
            <View style={styles.formActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowCreate(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={createDeck}>
                <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                <Text style={styles.saveBtnText}>Create</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Decks List */}
        {decks.length === 0 && !showCreate ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>🗂️</Text>
            <Text style={styles.emptyTitle}>No custom decks</Text>
            <Text style={styles.emptyDesc}>Create your own flashcard decks to study vocabulary your way</Text>
            <TouchableOpacity style={styles.createFirstBtn} onPress={() => setShowCreate(true)}>
              <Ionicons name="add-circle" size={18} color="#FFFFFF" />
              <Text style={styles.createFirstBtnText}>Create First Deck</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.deckGrid}>
            {decks.map((deck) => (
              <TouchableOpacity
                key={deck.id}
                style={styles.deckCard}
                onPress={() => setEditingDeck(deck)}
                activeOpacity={0.8}
              >
                <View style={styles.deckCardHeader}>
                  <View style={styles.deckCardIcon}>
                    <Ionicons name="layers" size={20} color={Colors.secondary} />
                  </View>
                  <TouchableOpacity onPress={() => deleteDeck(deck.id)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                    <Ionicons name="ellipsis-vertical" size={16} color={Colors.textMuted} />
                  </TouchableOpacity>
                </View>
                <Text style={styles.deckCardName}>{deck.name}</Text>
                <Text style={styles.deckCardMeta}>{deck.cards.length} cards • {deck.language}</Text>
                {deck.lastStudied && (
                  <Text style={styles.deckCardStudied}>
                    Last studied {new Date(deck.lastStudied).toLocaleDateString()}
                  </Text>
                )}
                <View style={styles.deckCardActions}>
                  <TouchableOpacity style={styles.deckStudyBtn} onPress={() => studyDeck(deck)}>
                    <Ionicons name="play" size={12} color="#FFFFFF" />
                    <Text style={styles.deckStudyBtnText}>Study</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Pre-made Decks Suggestion */}
        <View style={styles.suggestSection}>
          <Text style={styles.suggestTitle}>Quick Start Templates</Text>
          <Text style={styles.suggestDesc}>Start with a pre-made template and customize it</Text>
          <View style={styles.templateGrid}>
            {[
              { name: "Travel Essentials", icon: "airplane", cards: 20, lang: "Spanish" },
              { name: "Business Vocab", icon: "briefcase", cards: 30, lang: "French" },
              { name: "Food & Dining", icon: "restaurant", cards: 25, lang: "Japanese" },
            ].map((tmpl) => (
              <TouchableOpacity
                key={tmpl.name}
                style={styles.templateCard}
                onPress={() => {
                  if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  const newDeck: CustomDeck = {
                    id: Date.now().toString(),
                    name: tmpl.name,
                    description: `Pre-made ${tmpl.lang} deck`,
                    language: tmpl.lang,
                    cards: [],
                    createdAt: Date.now(),
                    lastStudied: null,
                  };
                  const updated = [...decks, newDeck];
                  saveDecks(updated);
                  setEditingDeck(newDeck);
                }}
              >
                <Ionicons name={tmpl.icon as any} size={22} color={Colors.gold} />
                <Text style={styles.templateName}>{tmpl.name}</Text>
                <Text style={styles.templateMeta}>{tmpl.lang}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.primary },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.surface, alignItems: "center", justifyContent: "center" },
  headerCenter: { alignItems: "center" },
  headerTitle: { fontSize: 18, fontWeight: "800", color: Colors.textPrimary },
  headerSub: { fontSize: 12, color: Colors.textMuted },
  addBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.glowSubtle, borderWidth: 1, borderColor: Colors.glowBorder, alignItems: "center", justifyContent: "center" },
  formCard: {
    marginHorizontal: 16,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.glowBorder,
    marginBottom: 16,
  },
  formTitle: { fontSize: 16, fontWeight: "800", color: Colors.textPrimary, marginBottom: 14 },
  input: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: Colors.textPrimary,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 10,
  },
  formActions: { flexDirection: "row", gap: 10, marginTop: 6 },
  cancelBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, backgroundColor: "rgba(255,255,255,0.05)", alignItems: "center" },
  cancelBtnText: { fontSize: 13, fontWeight: "600", color: Colors.textSecondary },
  saveBtn: { flex: 1, flexDirection: "row", gap: 6, paddingVertical: 12, borderRadius: 10, backgroundColor: Colors.secondary, alignItems: "center", justifyContent: "center" },
  saveBtnText: { fontSize: 13, fontWeight: "700", color: "#FFFFFF" },
  emptyState: { alignItems: "center", paddingVertical: 60, paddingHorizontal: 32 },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: "800", color: Colors.textPrimary, marginBottom: 8 },
  emptyDesc: { fontSize: 13, color: Colors.textMuted, textAlign: "center", lineHeight: 20, marginBottom: 20 },
  createFirstBtn: { flexDirection: "row", gap: 8, backgroundColor: Colors.secondary, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12, alignItems: "center" },
  createFirstBtnText: { fontSize: 14, fontWeight: "700", color: "#FFFFFF" },
  deckGrid: { paddingHorizontal: 16, gap: 12 },
  deckCard: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  deckCardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  deckCardIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: Colors.glowSubtle, borderWidth: 1, borderColor: Colors.glowBorder, alignItems: "center", justifyContent: "center" },
  deckCardName: { fontSize: 16, fontWeight: "700", color: Colors.textPrimary, marginBottom: 4 },
  deckCardMeta: { fontSize: 12, color: Colors.textSecondary, marginBottom: 4 },
  deckCardStudied: { fontSize: 11, color: Colors.textMuted },
  deckCardActions: { flexDirection: "row", marginTop: 12 },
  deckStudyBtn: { flexDirection: "row", gap: 4, backgroundColor: Colors.secondary, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, alignItems: "center" },
  deckStudyBtnText: { fontSize: 11, fontWeight: "700", color: "#FFFFFF" },
  cardsList: { paddingHorizontal: 16, gap: 8 },
  cardItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardItemLeft: { flex: 1, flexDirection: "row", alignItems: "center", gap: 12 },
  cardNumber: { fontSize: 12, fontWeight: "700", color: Colors.textMuted, width: 20, textAlign: "center" },
  cardItemContent: { flex: 1 },
  cardFrontText: { fontSize: 14, fontWeight: "700", color: Colors.textPrimary },
  cardBackText: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  cardCategoryText: { fontSize: 10, color: Colors.secondary, marginTop: 2 },
  deleteCardBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: "rgba(255,82,82,0.1)", alignItems: "center", justifyContent: "center" },
  deckInfoCard: {
    marginHorizontal: 16,
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 16,
  },
  deckInfoLanguage: { fontSize: 12, fontWeight: "600", color: Colors.secondary, marginBottom: 6 },
  deckInfoDesc: { fontSize: 13, color: Colors.textSecondary, marginBottom: 12 },
  studyBtn: { flexDirection: "row", gap: 8, backgroundColor: Colors.secondary, paddingVertical: 12, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  studyBtnText: { fontSize: 14, fontWeight: "700", color: "#FFFFFF" },
  suggestSection: { marginHorizontal: 16, marginTop: 24 },
  suggestTitle: { fontSize: 16, fontWeight: "800", color: Colors.textPrimary, marginBottom: 4 },
  suggestDesc: { fontSize: 12, color: Colors.textMuted, marginBottom: 14 },
  templateGrid: { flexDirection: "row", gap: 10 },
  templateCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 6,
  },
  templateName: { fontSize: 11, fontWeight: "700", color: Colors.textPrimary, textAlign: "center" },
  templateMeta: { fontSize: 10, color: Colors.textMuted },
});
