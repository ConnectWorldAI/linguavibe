/**
 * Creator Content Feed Screen
 * 
 * Surface curated clips from ingested creators (like @yourspanishwithjavier)
 * as bite-sized learning moments. Shows short-form content with translations.
 */
import React, { useState, useEffect, useCallback } from "react";
import {
  View, Text, TouchableOpacity, StyleSheet, Platform,
  FlatList, Dimensions, ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import { ScreenContainer } from "@/components/screen-container";
import { Colors } from "@/constants/Colors";
import { createVanillaClient } from "@/lib/trpc";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

type CreatorPost = {
  id: string;
  creatorName: string;
  creatorHandle: string;
  creatorAvatar: string;
  thumbnailUrl: string;
  caption: string;
  translatedCaption: string;
  language: string;
  category: "slang" | "grammar" | "culture" | "pronunciation" | "vocabulary";
  duration: string;
  likes: number;
  saved: boolean;
};

const MOCK_POSTS: CreatorPost[] = [
  {
    id: "1", creatorName: "Javier Benavides", creatorHandle: "@yourspanishwithjavier",
    creatorAvatar: "", thumbnailUrl: "",
    caption: "5 frases que NUNCA te enseñan en clase 🇨🇴",
    translatedCaption: "5 phrases they NEVER teach you in class",
    language: "Spanish", category: "slang", duration: "0:45", likes: 12400, saved: false,
  },
  {
    id: "2", creatorName: "Javier Benavides", creatorHandle: "@yourspanishwithjavier",
    creatorAvatar: "", thumbnailUrl: "",
    caption: "¿'Ser' o 'Estar'? La regla que nadie te dice",
    translatedCaption: "Ser or Estar? The rule nobody tells you",
    language: "Spanish", category: "grammar", duration: "1:20", likes: 8900, saved: false,
  },
  {
    id: "3", creatorName: "BilingueBlogs", creatorHandle: "@bilingueblogs",
    creatorAvatar: "", thumbnailUrl: "",
    caption: "Palabras que suenan igual pero significan diferente 🤯",
    translatedCaption: "Words that sound the same but mean different things",
    language: "Spanish", category: "vocabulary", duration: "0:58", likes: 15200, saved: false,
  },
  {
    id: "4", creatorName: "Spanish with Linda", creatorHandle: "@spanishwithlinda",
    creatorAvatar: "", thumbnailUrl: "",
    caption: "Cómo pedir comida como un local en México 🌮",
    translatedCaption: "How to order food like a local in Mexico",
    language: "Spanish", category: "culture", duration: "1:05", likes: 6700, saved: false,
  },
  {
    id: "5", creatorName: "LingoTwin", creatorHandle: "@lingotwin",
    creatorAvatar: "", thumbnailUrl: "",
    caption: "La 'R' española: truco para pronunciarla perfecta",
    translatedCaption: "The Spanish 'R': trick to pronounce it perfectly",
    language: "Spanish", category: "pronunciation", duration: "0:38", likes: 21000, saved: false,
  },
];

export default function CreatorFeedScreen() {
  const router = useRouter();
  const [posts, setPosts] = useState<CreatorPost[]>(MOCK_POSTS);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const categories = ["all", "slang", "grammar", "culture", "pronunciation", "vocabulary"];

  const filteredPosts = selectedCategory === "all" ? posts : posts.filter(p => p.category === selectedCategory);

  const toggleSave = (postId: string) => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, saved: !p.saved } : p));
  };

  const getCategoryColor = (cat: string) => {
    const colors: Record<string, string> = {
      slang: "#FF6B35", grammar: "#9C27B0", culture: "#FF9800",
      pronunciation: "#00BCD4", vocabulary: "#4CAF50",
    };
    return colors[cat] || "#00AAFF";
  };

  const renderPost = ({ item }: { item: CreatorPost }) => (
    <View style={s.postCard}>
      {/* Creator header */}
      <View style={s.creatorRow}>
        <View style={s.avatarPlaceholder}>
          <Text style={s.avatarText}>{item.creatorName[0]}</Text>
        </View>
        <View style={s.creatorInfo}>
          <Text style={s.creatorName}>{item.creatorName}</Text>
          <Text style={s.creatorHandle}>{item.creatorHandle}</Text>
        </View>
        <View style={[s.categoryBadge, { backgroundColor: getCategoryColor(item.category) + "20" }]}>
          <Text style={[s.categoryText, { color: getCategoryColor(item.category) }]}>{item.category}</Text>
        </View>
      </View>

      {/* Content thumbnail */}
      <View style={s.thumbnailContainer}>
        <View style={s.thumbnailPlaceholder}>
          <Ionicons name="play-circle" size={48} color="rgba(255,255,255,0.8)" />
          <Text style={s.durationBadge}>{item.duration}</Text>
        </View>
      </View>

      {/* Caption with translation */}
      <View style={s.captionSection}>
        <Text style={s.caption}>{item.caption}</Text>
        <Text style={s.translatedCaption}>{item.translatedCaption}</Text>
      </View>

      {/* Actions */}
      <View style={s.actionsRow}>
        <TouchableOpacity style={s.actionBtn}>
          <Ionicons name="heart-outline" size={20} color="#9BA1A6" />
          <Text style={s.actionText}>{(item.likes / 1000).toFixed(1)}k</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => toggleSave(item.id)} style={s.actionBtn}>
          <Ionicons name={item.saved ? "bookmark" : "bookmark-outline"} size={20} color={item.saved ? "#00AAFF" : "#9BA1A6"} />
          <Text style={[s.actionText, item.saved && { color: "#00AAFF" }]}>Save</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.actionBtn}>
          <Ionicons name="share-outline" size={20} color="#9BA1A6" />
          <Text style={s.actionText}>Share</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.actionBtn}>
          <Ionicons name="language" size={20} color="#9BA1A6" />
          <Text style={s.actionText}>Translate</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <ScreenContainer>
      <View style={s.container}>
        {/* Header */}
        <View style={s.header}>
          <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#ECEDEE" />
          </TouchableOpacity>
          <Text style={s.title}>Creator Feed</Text>
          <TouchableOpacity style={s.filterBtn}>
            <Ionicons name="options" size={20} color="#9BA1A6" />
          </TouchableOpacity>
        </View>

        {/* Category filter */}
        <FlatList
          horizontal
          data={categories}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => setSelectedCategory(item)}
              style={[s.catPill, selectedCategory === item && s.catPillActive]}
            >
              <Text style={[s.catPillText, selectedCategory === item && s.catPillTextActive]}>
                {item === "all" ? "All" : item.charAt(0).toUpperCase() + item.slice(1)}
              </Text>
            </TouchableOpacity>
          )}
          keyExtractor={(item) => item}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={s.catRow}
        />

        {/* Feed */}
        <FlatList
          data={filteredPosts}
          renderItem={renderPost}
          keyExtractor={(item) => item.id}
          contentContainerStyle={s.feedList}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={s.emptyState}>
              <Text style={{ fontSize: 48 }}>📱</Text>
              <Text style={s.emptyTitle}>No posts in this category</Text>
            </View>
          }
        />
      </View>
    </ScreenContainer>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.primary },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 12 },
  backBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 20, fontWeight: "700", color: "#ECEDEE" },
  filterBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  catRow: { paddingHorizontal: 16, paddingBottom: 12, gap: 8 },
  catPill: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 16, backgroundColor: "#1C2235" },
  catPillActive: { backgroundColor: "#00AAFF" },
  catPillText: { fontSize: 12, fontWeight: "600", color: "#9BA1A6" },
  catPillTextActive: { color: "#FFF" },
  feedList: { paddingHorizontal: 16, paddingBottom: 100 },
  postCard: { backgroundColor: "#141825", borderRadius: 16, marginBottom: 16, overflow: "hidden" },
  creatorRow: { flexDirection: "row", alignItems: "center", padding: 12 },
  avatarPlaceholder: { width: 36, height: 36, borderRadius: 18, backgroundColor: "#2A2F45", alignItems: "center", justifyContent: "center" },
  avatarText: { fontSize: 14, fontWeight: "700", color: "#00AAFF" },
  creatorInfo: { flex: 1, marginLeft: 10 },
  creatorName: { fontSize: 13, fontWeight: "700", color: "#ECEDEE" },
  creatorHandle: { fontSize: 11, color: "#687076" },
  categoryBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  categoryText: { fontSize: 10, fontWeight: "700", textTransform: "uppercase" },
  thumbnailContainer: { width: "100%", height: 180 },
  thumbnailPlaceholder: { flex: 1, backgroundColor: "#0D1117", alignItems: "center", justifyContent: "center" },
  durationBadge: { position: "absolute", bottom: 8, right: 8, backgroundColor: "rgba(0,0,0,0.7)", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, fontSize: 10, color: "#FFF", overflow: "hidden" },
  captionSection: { padding: 12 },
  caption: { fontSize: 14, fontWeight: "600", color: "#ECEDEE", marginBottom: 4 },
  translatedCaption: { fontSize: 12, color: "#9BA1A6", fontStyle: "italic" },
  actionsRow: { flexDirection: "row", justifyContent: "space-around", paddingVertical: 10, borderTopWidth: 1, borderTopColor: "#1C2235" },
  actionBtn: { flexDirection: "row", alignItems: "center", gap: 4 },
  actionText: { fontSize: 11, color: "#9BA1A6" },
  emptyState: { alignItems: "center", marginTop: 60 },
  emptyTitle: { fontSize: 16, fontWeight: "600", color: "#9BA1A6", marginTop: 12 },
});
