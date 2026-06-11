import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  FlatList,
  Platform,
  Animated,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { trpc } from "@/lib/trpc";

const { width, height } = Dimensions.get("window");

type Story = {
  id: string;
  userId: string;
  userName: string;
  avatar: string;
  type: "streak" | "milestone" | "photo" | "text" | "achievement";
  content: string;
  backgroundColor: string;
  textColor: string;
  timestamp: string;
  reactions: number;
  viewed: boolean;
};

type StoryUser = {
  id: string;
  name: string;
  avatar: string;
  hasUnviewed: boolean;
  storyCount: number;
};

const MOCK_USERS: StoryUser[] = [
  { id: "me", name: "Your Story", avatar: "➕", hasUnviewed: false, storyCount: 0 },
  { id: "1", name: "Carlos", avatar: "👨‍💼", hasUnviewed: true, storyCount: 3 },
  { id: "2", name: "Isabella", avatar: "👩‍🎓", hasUnviewed: true, storyCount: 2 },
  { id: "3", name: "Yuki", avatar: "👩", hasUnviewed: true, storyCount: 1 },
  { id: "4", name: "Jean-Pierre", avatar: "👨", hasUnviewed: false, storyCount: 4 },
  { id: "5", name: "Prof. Ana", avatar: "👩‍🏫", hasUnviewed: true, storyCount: 2 },
  { id: "6", name: "Ahmed", avatar: "👨‍⚕️", hasUnviewed: false, storyCount: 1 },
];

const MOCK_STORIES: Story[] = [
  { id: "s1", userId: "1", userName: "Carlos", avatar: "👨‍💼", type: "streak", content: "🔥 30-Day Streak! I've been consistent for a whole month learning English!", backgroundColor: "#FF6B3520", textColor: "#FF6B35", timestamp: "2h ago", reactions: 24, viewed: false },
  { id: "s2", userId: "1", userName: "Carlos", avatar: "👨‍💼", type: "milestone", content: "Just passed my B1 English exam! 🎉 One step closer to my goal.", backgroundColor: "#6C5CE720", textColor: "#6C5CE7", timestamp: "4h ago", reactions: 56, viewed: false },
  { id: "s3", userId: "1", userName: "Carlos", avatar: "👨‍💼", type: "text", content: "Today I learned 15 new business vocabulary words. My favorite: 'synergy' — it means working together to create something bigger than the sum of parts.", backgroundColor: "#0984E320", textColor: "#0984E3", timestamp: "6h ago", reactions: 12, viewed: false },
  { id: "s4", userId: "2", userName: "Isabella", avatar: "👩‍🎓", type: "achievement", content: "🏆 Earned 'Pronunciation Master' badge! My rolling R's are finally perfect.", backgroundColor: "#FFD70020", textColor: "#B8860B", timestamp: "1h ago", reactions: 89, viewed: false },
  { id: "s5", userId: "2", userName: "Isabella", avatar: "👩‍🎓", type: "photo", content: "Practicing French at a café in Montreal 🇨🇦☕ Immersion is the best teacher!", backgroundColor: "#00B89420", textColor: "#00B894", timestamp: "3h ago", reactions: 45, viewed: false },
  { id: "s6", userId: "3", userName: "Yuki", avatar: "👩", type: "streak", content: "🔥 100-Day Streak! Can't believe I've studied Spanish every single day for 100 days!", backgroundColor: "#E1705520", textColor: "#E17055", timestamp: "30m ago", reactions: 134, viewed: false },
  { id: "s7", userId: "5", userName: "Prof. Ana", avatar: "👩‍🏫", type: "text", content: "💡 Tip of the day: Don't say 'Yo soy caliente' (I am hot/attractive). Say 'Tengo calor' (I feel hot/warm). Common mistake that can be very embarrassing! 😅", backgroundColor: "#A29BFE20", textColor: "#A29BFE", timestamp: "5h ago", reactions: 203, viewed: false },
  { id: "s8", userId: "5", userName: "Prof. Ana", avatar: "👩‍🏫", type: "milestone", content: "500 students taught this month! Thank you all for trusting me with your language journey. 🙏", backgroundColor: "#4ADE8020", textColor: "#16A34A", timestamp: "8h ago", reactions: 312, viewed: false },
];

export default function StoriesScreen() {
  const colors = useColors();
  const [currentUserIndex, setCurrentUserIndex] = useState(1); // Start with first user's stories
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const progressAnim = useRef(new Animated.Value(0)).current;
  const [isPaused, setIsPaused] = useState(false);

  const [users, setUsers] = useState(MOCK_USERS);
  const [allStories, setAllStories] = useState(MOCK_STORIES);

  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem('@stories_feed');
        if (stored) {
          const data = JSON.parse(stored);
          if (data.users) setUsers(data.users);
          if (data.stories) setAllStories(data.stories);
        }
      } catch {}
    })();
  }, []);

  const currentUser = users[currentUserIndex];
  const userStories = allStories.filter((s) => s.userId === currentUser?.id);
  const currentStory = userStories[currentStoryIndex];

  useEffect(() => {
    if (!currentStory || isPaused) return;
    progressAnim.setValue(0);
    const animation = Animated.timing(progressAnim, {
      toValue: 1,
      duration: 5000,
      useNativeDriver: false,
    });
    animation.start(({ finished }) => {
      if (finished) nextStory();
    });
    return () => animation.stop();
  }, [currentStoryIndex, currentUserIndex, isPaused]);

  const nextStory = () => {
    if (currentStoryIndex < userStories.length - 1) {
      setCurrentStoryIndex(currentStoryIndex + 1);
    } else if (currentUserIndex < users.length - 1) {
      setCurrentUserIndex(currentUserIndex + 1);
      setCurrentStoryIndex(0);
    } else {
      router.back();
    }
  };

  const prevStory = () => {
    if (currentStoryIndex > 0) {
      setCurrentStoryIndex(currentStoryIndex - 1);
    } else if (currentUserIndex > 1) {
      setCurrentUserIndex(currentUserIndex - 1);
      const prevUserStories = allStories.filter((s) => s.userId === users[currentUserIndex - 1]?.id);
      setCurrentStoryIndex(prevUserStories.length - 1);
    }
  };

  const handleTap = (side: "left" | "right") => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (side === "right") nextStory();
    else prevStory();
  };

  const handleReact = () => {
    if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  if (!currentStory) {
    return (
      <ScreenContainer edges={["top", "left", "right"]}>
        <View style={styles.emptyState}>
          <Ionicons name="images-outline" size={48} color={colors.muted} />
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No Stories</Text>
          <Text style={[styles.emptyDesc, { color: colors.muted }]}>Check back later for updates from your connections</Text>
          <TouchableOpacity style={[styles.backButton, { backgroundColor: colors.primary }]} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </ScreenContainer>
    );
  }

  const typeIcon = {
    streak: "flame-outline",
    milestone: "trophy-outline",
    photo: "image-outline",
    text: "chatbubble-outline",
    achievement: "ribbon-outline",
  }[currentStory.type];

  return (
    <View style={[styles.container, { backgroundColor: "#000000" }]}>
      {/* Progress Bars */}
      <View style={styles.progressContainer}>
        {userStories.map((_, i) => (
          <View key={i} style={[styles.progressTrack, { backgroundColor: "#FFFFFF30" }]}>
            {i < currentStoryIndex && <View style={[styles.progressFill, { width: "100%" }]} />}
            {i === currentStoryIndex && (
              <Animated.View
                style={[
                  styles.progressFill,
                  {
                    width: progressAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ["0%", "100%"],
                    }),
                  },
                ]}
              />
            )}
          </View>
        ))}
      </View>

      {/* Header */}
      <View style={styles.storyHeader}>
        <View style={styles.storyUser}>
          <View style={styles.storyAvatar}>
            <Text style={styles.storyAvatarText}>{currentStory.avatar}</Text>
          </View>
          <View>
            <Text style={styles.storyUserName}>{currentStory.userName}</Text>
            <Text style={styles.storyTimestamp}>{currentStory.timestamp}</Text>
          </View>
        </View>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
          <Ionicons name="close" size={28} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Story Content */}
      <View style={[styles.storyContent, { backgroundColor: currentStory.backgroundColor }]}>
        <View style={styles.storyTypeIcon}>
          <Ionicons name={typeIcon as any} size={28} color={currentStory.textColor} />
        </View>
        <Text style={[styles.storyText, { color: currentStory.textColor }]}>{currentStory.content}</Text>
      </View>

      {/* Tap Zones */}
      <View style={styles.tapZones}>
        <TouchableOpacity style={styles.tapLeft} onPress={() => handleTap("left")} activeOpacity={1} />
        <TouchableOpacity style={styles.tapRight} onPress={() => handleTap("right")} activeOpacity={1} />
      </View>

      {/* Bottom Actions */}
      <View style={styles.bottomActions}>
        <TouchableOpacity style={styles.reactionBtn} onPress={handleReact}>
          <Ionicons name="heart-outline" size={24} color="#FFFFFF" />
          <Text style={styles.reactionCount}>{currentStory.reactions}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.reactionBtn}>
          <Ionicons name="chatbubble-outline" size={22} color="#FFFFFF" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.reactionBtn}>
          <Ionicons name="paper-plane-outline" size={22} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  progressContainer: { flexDirection: "row", gap: 3, paddingHorizontal: 8, paddingTop: 50, zIndex: 10 },
  progressTrack: { flex: 1, height: 3, borderRadius: 2, overflow: "hidden" },
  progressFill: { height: "100%", backgroundColor: "#FFFFFF", borderRadius: 2 },
  storyHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 12, zIndex: 10 },
  storyUser: { flexDirection: "row", alignItems: "center", gap: 10 },
  storyAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: "#FFFFFF20", alignItems: "center", justifyContent: "center" },
  storyAvatarText: { fontSize: 18 },
  storyUserName: { fontSize: 14, fontWeight: "700", color: "#FFFFFF" },
  storyTimestamp: { fontSize: 11, color: "#FFFFFF80" },
  closeBtn: { padding: 4 },
  storyContent: {
    flex: 1,
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 20,
    padding: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  storyTypeIcon: { marginBottom: 16 },
  storyText: { fontSize: 20, fontWeight: "700", textAlign: "center", lineHeight: 28 },
  tapZones: { position: "absolute", top: 100, bottom: 80, left: 0, right: 0, flexDirection: "row" },
  tapLeft: { flex: 1 },
  tapRight: { flex: 2 },
  bottomActions: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 24, paddingBottom: 40, paddingTop: 12 },
  reactionBtn: { flexDirection: "row", alignItems: "center", gap: 4 },
  reactionCount: { fontSize: 13, color: "#FFFFFF", fontWeight: "600" },
  emptyState: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12, padding: 32 },
  emptyTitle: { fontSize: 20, fontWeight: "700" },
  emptyDesc: { fontSize: 14, textAlign: "center" },
  backButton: { marginTop: 16, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  backButtonText: { fontSize: 15, fontWeight: "700", color: "#FFFFFF" },
});
