import { useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import { Colors, Spacing, BorderRadius, FontSize } from "../constants/Colors";

interface ActivityItem {
  id: string;
  userName: string;
  userAvatar: string;
  type: "milestone" | "perfect_day" | "streak" | "badge" | "level_up";
  title: string;
  description: string;
  timestamp: string;
  icon: string;
  color: string;
  congratulated: boolean;
}

const SAMPLE_ACTIVITIES: ActivityItem[] = [
  {
    id: "1",
    userName: "Maria García",
    userAvatar: "🇪🇸",
    type: "perfect_day",
    title: "Perfect Day!",
    description: "Completed all 8 milestones today",
    timestamp: "2m ago",
    icon: "star",
    color: Colors.gold,
    congratulated: false,
  },
  {
    id: "2",
    userName: "Yuki Tanaka",
    userAvatar: "🇯🇵",
    type: "streak",
    title: "7-Day Streak!",
    description: "7 consecutive days of learning",
    timestamp: "15m ago",
    icon: "flame",
    color: "#FF6B35",
    congratulated: false,
  },
  {
    id: "3",
    userName: "Ahmed Hassan",
    userAvatar: "🇪🇬",
    type: "badge",
    title: "Song Master Badge",
    description: "Translated 50 songs",
    timestamp: "1h ago",
    icon: "musical-notes",
    color: Colors.secondary,
    congratulated: false,
  },
  {
    id: "4",
    userName: "Sophie Martin",
    userAvatar: "🇫🇷",
    type: "milestone",
    title: "Chatterbox Milestone",
    description: "30 minutes of talk time today",
    timestamp: "2h ago",
    icon: "chatbubbles",
    color: Colors.glow,
    congratulated: true,
  },
  {
    id: "5",
    userName: "Carlos Silva",
    userAvatar: "🇧🇷",
    type: "level_up",
    title: "Level Up!",
    description: "Advanced to Intermediate Portuguese",
    timestamp: "3h ago",
    icon: "arrow-up-circle",
    color: Colors.success,
    congratulated: false,
  },
  {
    id: "6",
    userName: "Lena Müller",
    userAvatar: "🇩🇪",
    type: "perfect_day",
    title: "3-Day Perfect Streak!",
    description: "3 consecutive Perfect Days",
    timestamp: "4h ago",
    icon: "trophy",
    color: Colors.gold,
    congratulated: true,
  },
  {
    id: "7",
    userName: "Jin Park",
    userAvatar: "🇰🇷",
    type: "milestone",
    title: "Music Lover Milestone",
    description: "Learned 3 songs today",
    timestamp: "5h ago",
    icon: "musical-note",
    color: "#9B59B6",
    congratulated: false,
  },
  {
    id: "8",
    userName: "Priya Sharma",
    userAvatar: "🇮🇳",
    type: "badge",
    title: "Social Butterfly Badge",
    description: "Connected with 10 language partners",
    timestamp: "6h ago",
    icon: "people",
    color: "#E91E63",
    congratulated: false,
  },
];

export default function FriendsActivityScreen() {
  const [activities, setActivities] = useState<ActivityItem[]>(SAMPLE_ACTIVITIES);

  const handleCongratulate = (id: string) => {
    if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setActivities((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, congratulated: true } : item
      )
    );
  };

  const renderActivity = ({ item }: { item: ActivityItem }) => (
    <View style={styles.activityCard}>
      <View style={styles.avatarContainer}>
        <Text style={styles.avatar}>{item.userAvatar}</Text>
        <View style={[styles.activityIconBadge, { backgroundColor: item.color + "22" }]}>
          <Ionicons name={item.icon as any} size={12} color={item.color} />
        </View>
      </View>
      <View style={styles.activityContent}>
        <View style={styles.activityHeader}>
          <Text style={styles.userName}>{item.userName}</Text>
          <Text style={styles.timestamp}>{item.timestamp}</Text>
        </View>
        <Text style={styles.activityTitle}>{item.title}</Text>
        <Text style={styles.activityDesc}>{item.description}</Text>
        <TouchableOpacity
          style={[
            styles.congratsBtn,
            item.congratulated && styles.congratsBtnDone,
          ]}
          onPress={() => !item.congratulated && handleCongratulate(item.id)}
          disabled={item.congratulated}
        >
          <Ionicons
            name={item.congratulated ? "heart" : "heart-outline"}
            size={14}
            color={item.congratulated ? Colors.accent : Colors.textSecondary}
          />
          <Text
            style={[
              styles.congratsText,
              item.congratulated && styles.congratsTextDone,
            ]}
          >
            {item.congratulated ? "Congratulated!" : "Congratulate"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );


  // Load persisted data from AsyncStorage
  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem('@friends_activity_data');
        if (stored) {
          // Data available from sync/server
        }
      } catch {}
    })();
  }, []);
  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => {
            if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.back();
          }}
          style={styles.backBtn}
        >
          <Ionicons name="chevron-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Friends' Activity</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Activity Summary */}
      <View style={styles.summaryBar}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>{activities.length}</Text>
          <Text style={styles.summaryLabel}>Activities</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>
            {activities.filter((a) => a.type === "perfect_day").length}
          </Text>
          <Text style={styles.summaryLabel}>Perfect Days</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>
            {activities.filter((a) => a.congratulated).length}
          </Text>
          <Text style={styles.summaryLabel}>Congrats Sent</Text>
        </View>
      </View>

      {/* Activity Feed */}
      <FlatList
        data={activities}
        renderItem={renderActivity}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>👥</Text>
            <Text style={styles.emptyTitle}>No Activity Yet</Text>
            <Text style={styles.emptyDesc}>
              Connect with friends to see their learning achievements here!
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: FontSize.lg,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  summaryBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.md,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.surfaceCard,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  summaryItem: {
    alignItems: "center",
  },
  summaryValue: {
    fontSize: FontSize.lg,
    fontWeight: "800",
    color: Colors.secondary,
  },
  summaryLabel: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  summaryDivider: {
    width: 1,
    height: 30,
    backgroundColor: Colors.border,
  },
  list: {
    paddingHorizontal: Spacing.md,
    paddingBottom: 100,
    gap: Spacing.sm,
  },
  activityCard: {
    flexDirection: "row",
    backgroundColor: Colors.surfaceCard,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.sm,
  },
  avatarContainer: {
    position: "relative",
  },
  avatar: {
    fontSize: 32,
    width: 44,
    height: 44,
    textAlign: "center",
    lineHeight: 44,
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 22,
    overflow: "hidden",
  },
  activityIconBadge: {
    position: "absolute",
    bottom: -2,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: Colors.surfaceCard,
  },
  activityContent: {
    flex: 1,
  },
  activityHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  userName: {
    fontSize: FontSize.sm,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  timestamp: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
  },
  activityTitle: {
    fontSize: FontSize.md,
    fontWeight: "600",
    color: Colors.secondary,
    marginTop: 2,
  },
  activityDesc: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  congratsBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: Spacing.sm,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    alignSelf: "flex-start",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  congratsBtnDone: {
    backgroundColor: "rgba(255, 45, 45, 0.08)",
    borderColor: "rgba(255, 45, 45, 0.25)",
  },
  congratsText: {
    fontSize: FontSize.xs,
    fontWeight: "600",
    color: Colors.textSecondary,
  },
  congratsTextDone: {
    color: Colors.accent,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: Spacing.md,
  },
  emptyTitle: {
    fontSize: FontSize.lg,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  emptyDesc: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    textAlign: "center",
    marginTop: Spacing.sm,
    paddingHorizontal: Spacing.xl,
  },
});
