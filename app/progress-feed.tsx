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

type FeedItem = {
  id: string;
  user: { name: string; avatar: string; flag: string };
  type: "lesson" | "streak" | "badge" | "level_up" | "challenge" | "song";
  title: string;
  description: string;
  time: string;
  likes: number;
  liked: boolean;
  icon: string;
  color: string;
};

const FEED_ITEMS: FeedItem[] = [
  { id: "1", user: { name: "Maria Garcia", avatar: "👩🏽", flag: "🇲🇽" }, type: "streak", title: "30-Day Streak!", description: "Maria hit a 30-day learning streak in Spanish", time: "2m ago", likes: 12, liked: false, icon: "🔥", color: "#F59E0B" },
  { id: "2", user: { name: "Alex Chen", avatar: "👨🏻", flag: "🇺🇸" }, type: "level_up", title: "Level Up: B1", description: "Alex reached Intermediate level in Japanese", time: "15m ago", likes: 8, liked: true, icon: "⬆️", color: "#3B82F6" },
  { id: "3", user: { name: "Yuki Tanaka", avatar: "👩🏻", flag: "🇯🇵" }, type: "badge", title: "New Badge: Polyglot", description: "Yuki earned the Polyglot badge (3+ languages)", time: "1h ago", likes: 24, liked: false, icon: "🏅", color: "#A855F7" },
  { id: "4", user: { name: "Pierre Dupont", avatar: "👨🏻", flag: "🇫🇷" }, type: "song", title: "Song Mastered", description: "Pierre mastered 'La Vie en Rose' with 95% pronunciation", time: "2h ago", likes: 15, liked: false, icon: "🎵", color: "#EC4899" },
  { id: "5", user: { name: "Amara Okafor", avatar: "👩🏿", flag: "🇳🇬" }, type: "challenge", title: "Challenge Won!", description: "Amara won a vocabulary battle against 3 opponents", time: "3h ago", likes: 19, liked: true, icon: "⚔️", color: "#EF4444" },
  { id: "6", user: { name: "Carlos Silva", avatar: "👨🏽", flag: "🇧🇷" }, type: "lesson", title: "Lesson Complete", description: "Carlos completed 'Advanced Subjunctive' in Spanish", time: "4h ago", likes: 5, liked: false, icon: "📚", color: "#22C55E" },
  { id: "7", user: { name: "Emma Wilson", avatar: "👩🏼", flag: "🇬🇧" }, type: "streak", title: "7-Day Streak!", description: "Emma started a new streak in Korean", time: "5h ago", likes: 7, liked: false, icon: "🔥", color: "#F59E0B" },
  { id: "8", user: { name: "Li Wei", avatar: "👨🏻", flag: "🇨🇳" }, type: "level_up", title: "Level Up: A2", description: "Li reached Elementary level in English", time: "6h ago", likes: 11, liked: false, icon: "⬆️", color: "#3B82F6" },
];

export default function ProgressFeedScreen() {
  const colors = useColors();
  const [items, setItems] = useState(FEED_ITEMS);

  const toggleLike = (id: string) => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, liked: !item.liked, likes: item.liked ? item.likes - 1 : item.likes + 1 }
          : item
      )
    );
  };

  const renderItem = ({ item }: { item: FeedItem }) => (
    <View style={[styles.feedCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      {/* User Row */}
      <View style={styles.userRow}>
        <View style={styles.userLeft}>
          <Text style={styles.userAvatar}>{item.user.avatar}</Text>
          <View>
            <Text style={[styles.userName, { color: colors.foreground }]}>{item.user.flag} {item.user.name}</Text>
            <Text style={[styles.feedTime, { color: colors.muted }]}>{item.time}</Text>
          </View>
        </View>
        <View style={[styles.typeBadge, { backgroundColor: item.color + "15" }]}>
          <Text style={{ fontSize: 12 }}>{item.icon}</Text>
        </View>
      </View>

      {/* Content */}
      <View style={[styles.feedContent, { borderLeftColor: item.color }]}>
        <Text style={[styles.feedTitle, { color: colors.foreground }]}>{item.title}</Text>
        <Text style={[styles.feedDesc, { color: colors.muted }]}>{item.description}</Text>
      </View>

      {/* Actions */}
      <View style={styles.feedActions}>
        <TouchableOpacity style={styles.likeBtn} onPress={() => toggleLike(item.id)}>
          <Ionicons name={item.liked ? "heart" : "heart-outline"} size={18} color={item.liked ? "#EF4444" : colors.muted} />
          <Text style={[styles.likeCount, { color: item.liked ? "#EF4444" : colors.muted }]}>{item.likes}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.commentBtn}>
          <Ionicons name="chatbubble-outline" size={16} color={colors.muted} />
          <Text style={[styles.commentText, { color: colors.muted }]}>Congrats!</Text>
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
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Activity Feed</Text>
        <TouchableOpacity>
          <Ionicons name="filter" size={20} color={colors.muted} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={items}
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
  content: { padding: 16, paddingBottom: 100 },
  feedCard: { padding: 14, borderRadius: 14, borderWidth: 1, marginBottom: 12 },
  userRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 },
  userLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  userAvatar: { fontSize: 24 },
  userName: { fontSize: 14, fontWeight: "700" },
  feedTime: { fontSize: 11, marginTop: 1 },
  typeBadge: { width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  feedContent: { borderLeftWidth: 3, paddingLeft: 12, marginBottom: 10 },
  feedTitle: { fontSize: 15, fontWeight: "700" },
  feedDesc: { fontSize: 13, marginTop: 2, lineHeight: 18 },
  feedActions: { flexDirection: "row", alignItems: "center", gap: 16 },
  likeBtn: { flexDirection: "row", alignItems: "center", gap: 4 },
  likeCount: { fontSize: 12, fontWeight: "600" },
  commentBtn: { flexDirection: "row", alignItems: "center", gap: 4 },
  commentText: { fontSize: 12 },
});
