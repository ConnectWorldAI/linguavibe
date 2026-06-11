import React, { useState } from "react";
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

type NotificationType = "message" | "call" | "job" | "lesson" | "system" | "achievement";

interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  time: string;
  read: boolean;
  icon: string;
  iconColor: string;
}

const INITIAL_NOTIFICATIONS: Notification[] = [
  {
    id: "1",
    type: "message",
    title: "New Message from Maria",
    body: "Hey! Are you free for a Spanish practice session tonight? I found a great song we can break down together.",
    time: "2 min ago",
    read: false,
    icon: "chatbubble-ellipses",
    iconColor: Colors.secondary,
  },
  {
    id: "2",
    type: "call",
    title: "Missed Call",
    body: "You missed a video call from Carlos Rivera. They tried reaching you for a live translation session.",
    time: "15 min ago",
    read: false,
    icon: "videocam",
    iconColor: Colors.accent,
  },
  {
    id: "3",
    type: "job",
    title: "New Job Match",
    body: "Bilingual Customer Support (Spanish/English) at TechCorp - $28/hr remote. Matches your profile!",
    time: "1 hr ago",
    read: false,
    icon: "briefcase",
    iconColor: Colors.gold,
  },
  {
    id: "4",
    type: "lesson",
    title: "Lesson Reminder",
    body: "Your daily Spanish lesson starts in 30 minutes. Topic: Subjunctive Mood in Conversation.",
    time: "2 hrs ago",
    read: true,
    icon: "school",
    iconColor: Colors.glow,
  },
  {
    id: "5",
    type: "achievement",
    title: "Achievement Unlocked!",
    body: "You have completed a 7-day streak! Keep it up to earn bonus credits.",
    time: "5 hrs ago",
    read: true,
    icon: "trophy",
    iconColor: Colors.goldBright,
  },
  {
    id: "6",
    type: "system",
    title: "Credits Added",
    body: "50 bonus credits have been added to your account for completing the onboarding tutorial.",
    time: "1 day ago",
    read: true,
    icon: "gift",
    iconColor: Colors.success,
  },
  {
    id: "7",
    type: "message",
    title: "Voice Memo from Teacher Yuki",
    body: "Your pronunciation was excellent! Here is feedback on your intonation for the phrase.",
    time: "1 day ago",
    read: true,
    icon: "mic",
    iconColor: Colors.secondary,
  },
  {
    id: "8",
    type: "system",
    title: "App Update Available",
    body: "ConnectWorld AI v2.1 is available with improved live translation speed and new language packs.",
    time: "2 days ago",
    read: true,
    icon: "cloud-download",
    iconColor: Colors.textSecondary,
  },
  {
    id: "9",
    type: "system",
    title: "📊 Weekly Learning Summary",
    body: "This week: 7 min talk time, 2 songs translated, 4 min AI teacher. You're on a 1-day streak! Keep it up — consistency builds fluency. 💪",
    time: "Sunday",
    read: false,
    icon: "bar-chart",
    iconColor: Colors.gold,
  },
];

export default function NotificationsScreen() {
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);
  const [filter, setFilter] = useState<"all" | "unread">("all");

  const unreadCount = notifications.filter((n) => !n.read).length;

  const filteredNotifications =
    filter === "unread" ? notifications.filter((n) => !n.read) : notifications;

  const markAsRead = (id: string) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllAsRead = () => {
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const renderNotification = ({ item }: { item: Notification }) => (
    <TouchableOpacity
      style={[styles.notifCard, !item.read && styles.notifCardUnread]}
      activeOpacity={0.7}
      onPress={() => markAsRead(item.id)}
    >
      <View style={[styles.notifIconWrap, { backgroundColor: item.iconColor + "18" }]}>
        <Ionicons name={item.icon as any} size={20} color={item.iconColor} />
      </View>
      <View style={styles.notifContent}>
        <View style={styles.notifHeader}>
          <Text style={[styles.notifTitle, !item.read && styles.notifTitleUnread]} numberOfLines={1}>
            {item.title}
          </Text>
          {!item.read && <View style={styles.unreadDot} />}
        </View>
        <Text style={styles.notifBody} numberOfLines={3}>
          {item.body}
        </Text>
        <Text style={styles.notifTime}>{item.time}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Notifications</Text>
          {unreadCount > 0 && (
            <View style={styles.headerBadge}>
              <Text style={styles.headerBadgeText}>{unreadCount}</Text>
            </View>
          )}
        </View>
        {unreadCount > 0 ? (
          <TouchableOpacity onPress={markAllAsRead} style={styles.markAllBtn}>
            <Text style={styles.markAllText}>Read All</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.headerPlaceholder} />
        )}
      </View>

      {/* Status Banner */}
      <View style={[styles.statusBanner, unreadCount === 0 && styles.statusBannerGreen]}>
        <Ionicons
          name={unreadCount > 0 ? "notifications" : "notifications-outline"}
          size={16}
          color={unreadCount > 0 ? Colors.accent : Colors.success}
        />
        <Text style={[styles.statusText, unreadCount === 0 && styles.statusTextGreen]}>
          {unreadCount > 0
            ? `You have ${unreadCount} unread notification${unreadCount > 1 ? "s" : ""}`
            : "All caught up! No unread notifications."}
        </Text>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterRow}>
        {(["all", "unread"] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.filterTab, filter === tab && styles.filterTabActive]}
            onPress={() => setFilter(tab)}
          >
            <Text style={[styles.filterTabText, filter === tab && styles.filterTabTextActive]}>
              {tab === "all" ? "All" : `Unread (${unreadCount})`}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Notification List */}
      <FlatList
        data={filteredNotifications}
        keyExtractor={(item) => item.id}
        renderItem={renderNotification}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="checkmark-circle" size={48} color={Colors.success} />
            <Text style={styles.emptyTitle}>All Clear!</Text>
            <Text style={styles.emptySubtitle}>No unread notifications</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.primary },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
  },
  backBtn: { padding: 4 },
  headerCenter: { flexDirection: "row", alignItems: "center", gap: 8 },
  headerTitle: { fontSize: FontSize.xl, fontWeight: "700", color: Colors.textPrimary },
  headerBadge: {
    backgroundColor: Colors.accent, borderRadius: 10,
    paddingHorizontal: 7, paddingVertical: 2,
  },
  headerBadgeText: { fontSize: 11, fontWeight: "700", color: "#FFFFFF" },
  markAllBtn: {
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: BorderRadius.sm, backgroundColor: Colors.glowSubtle,
    borderWidth: 1, borderColor: Colors.glowBorder,
  },
  markAllText: { fontSize: 12, fontWeight: "600", color: Colors.secondary },
  headerPlaceholder: { width: 70 },

  statusBanner: {
    flexDirection: "row", alignItems: "center", gap: 8,
    marginHorizontal: Spacing.lg, marginBottom: Spacing.md,
    paddingHorizontal: Spacing.md, paddingVertical: 10,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.redGlow, borderWidth: 1, borderColor: Colors.redBorder,
  },
  statusBannerGreen: {
    backgroundColor: Colors.greenGlow, borderColor: Colors.greenBorder,
  },
  statusText: { fontSize: 13, fontWeight: "500", color: Colors.accent },
  statusTextGreen: { color: Colors.success },

  filterRow: {
    flexDirection: "row", paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md, gap: 10,
  },
  filterTab: {
    paddingHorizontal: 16, paddingVertical: 8,
    borderRadius: 20, backgroundColor: Colors.surfaceCard,
    borderWidth: 1, borderColor: Colors.border,
  },
  filterTabActive: {
    backgroundColor: Colors.glowSubtle, borderColor: Colors.secondary,
  },
  filterTabText: { fontSize: 13, fontWeight: "500", color: Colors.textSecondary },
  filterTabTextActive: { color: Colors.secondary },

  listContent: { paddingHorizontal: Spacing.lg, paddingBottom: 100 },
  notifCard: {
    flexDirection: "row", gap: 12,
    padding: Spacing.md, marginBottom: 10,
    borderRadius: BorderRadius.md, backgroundColor: Colors.surfaceCard,
    borderWidth: 1, borderColor: Colors.border,
  },
  notifCardUnread: {
    backgroundColor: Colors.surfaceElevated,
    borderColor: Colors.glowBorder,
  },
  notifIconWrap: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: "center", justifyContent: "center",
  },
  notifContent: { flex: 1 },
  notifHeader: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 4 },
  notifTitle: { fontSize: 14, fontWeight: "500", color: Colors.textSecondary, flex: 1 },
  notifTitleUnread: { fontWeight: "700", color: Colors.textPrimary },
  unreadDot: {
    width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.secondary,
  },
  notifBody: { fontSize: 13, color: Colors.textSecondary, lineHeight: 18, marginBottom: 6 },
  notifTime: { fontSize: 11, color: Colors.textMuted },

  emptyState: { alignItems: "center", paddingTop: 60, gap: 8 },
  emptyTitle: { fontSize: 18, fontWeight: "700", color: Colors.textPrimary },
  emptySubtitle: { fontSize: 14, color: Colors.textSecondary },
});
