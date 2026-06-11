import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Animated,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import { useNotificationBadges, NotificationItem } from "@/lib/notification-badges";

type FilterType = "all" | "connection" | "message" | "assignment" | "system";

const FILTERS: { key: FilterType; label: string; icon: string }[] = [
  { key: "all", label: "All", icon: "layers" },
  { key: "connection", label: "Connections", icon: "people" },
  { key: "message", label: "Messages", icon: "chatbubble" },
  { key: "assignment", label: "Learning", icon: "school" },
  { key: "system", label: "System", icon: "settings" },
];

export default function NotificationCenterScreen() {
  const {
    notifications,
    badges,
    allRead,
    getBellColor,
    markNotificationRead,
    markAllNotificationsRead,
    dismissNotification,
    clearBadge,
  } = useNotificationBadges();

  const [activeFilter, setActiveFilter] = useState<FilterType>("all");

  const filteredNotifications = notifications.filter((n) => {
    if (activeFilter === "all") return true;
    if (activeFilter === "connection") return n.type === "connection";
    if (activeFilter === "message") return n.type === "message";
    if (activeFilter === "assignment") return n.type === "assignment";
    if (activeFilter === "system") return n.type === "system" || n.type === "call";
    return true;
  });

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleMarkAllRead = () => {
    markAllNotificationsRead();
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const handleNotificationPress = (item: NotificationItem) => {
    if (!item.read) {
      markNotificationRead(item.id);
    }
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    // Navigate based on type
    switch (item.type) {
      case "connection":
        router.push("/connections" as any);
        break;
      case "message":
        router.push("/(tabs)/messages" as any);
        break;
      case "assignment":
        router.push("/(tabs)/calendar" as any);
        break;
      case "call":
        router.push("/(tabs)/calls" as any);
        break;
      default:
        break;
    }
  };

  const handleDismiss = (id: string) => {
    dismissNotification(id);
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  };

  const renderNotification = ({ item }: { item: NotificationItem }) => (
    <TouchableOpacity
      style={[styles.notifCard, !item.read && styles.notifCardUnread]}
      onPress={() => handleNotificationPress(item)}
      activeOpacity={0.7}
    >
      <View style={[styles.notifIconWrap, { backgroundColor: item.color + "20" }]}>
        <Ionicons name={item.icon as any} size={20} color={item.color} />
      </View>
      <View style={styles.notifContent}>
        <View style={styles.notifTitleRow}>
          <Text style={[styles.notifTitle, !item.read && styles.notifTitleUnread]} numberOfLines={1}>
            {item.title}
          </Text>
          {!item.read && <View style={styles.unreadDot} />}
        </View>
        <Text style={styles.notifBody} numberOfLines={2}>
          {item.body}
        </Text>
        <Text style={styles.notifTime}>{item.time}</Text>
      </View>
      <TouchableOpacity
        style={styles.dismissBtn}
        onPress={() => handleDismiss(item.id)}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Ionicons name="close" size={14} color="#64748B" />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Ionicons
            name={unreadCount > 0 ? "notifications" : "notifications-outline"}
            size={22}
            color={getBellColor()}
          />
          <Text style={styles.headerTitle}>Notifications</Text>
          {unreadCount > 0 && (
            <View style={styles.headerBadge}>
              <Text style={styles.headerBadgeText}>{unreadCount}</Text>
            </View>
          )}
        </View>
        {unreadCount > 0 ? (
          <TouchableOpacity onPress={handleMarkAllRead} style={styles.markAllBtn}>
            <Text style={styles.markAllText}>Read All</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ width: 60 }} />
        )}
      </View>

      {/* Status Banner */}
      <View style={[styles.statusBanner, { borderColor: getBellColor() + "40" }]}>
        <Ionicons
          name={allRead ? "checkmark-circle" : "alert-circle"}
          size={18}
          color={allRead ? "#22C55E" : "#EF4444"}
        />
        <Text style={styles.statusText}>
          {allRead
            ? "All caught up! No new notifications."
            : `You have ${unreadCount} unread notification${unreadCount > 1 ? "s" : ""}`}
        </Text>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterRow}>
        <FlatList
          horizontal
          data={FILTERS}
          keyExtractor={(item) => item.key}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.filterChip, activeFilter === item.key && styles.filterChipActive]}
              onPress={() => setActiveFilter(item.key)}
            >
              <Ionicons
                name={item.icon as any}
                size={14}
                color={activeFilter === item.key ? "#fff" : "#94A3B8"}
              />
              <Text
                style={[styles.filterText, activeFilter === item.key && styles.filterTextActive]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          )}
        />
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
            <Ionicons name="notifications-off-outline" size={48} color="#334155" />
            <Text style={styles.emptyTitle}>No notifications</Text>
            <Text style={styles.emptyDesc}>
              {activeFilter === "all"
                ? "You're all caught up! Check back later."
                : `No ${activeFilter} notifications yet.`}
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#060912" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0, 170, 255, 0.1)",
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.05)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerCenter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#fff",
  },
  headerBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#EF4444",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 5,
  },
  headerBadgeText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#fff",
  },
  markAllBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: "rgba(34, 197, 94, 0.15)",
  },
  markAllText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#22C55E",
  },
  statusBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginHorizontal: 16,
    marginTop: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.03)",
    borderWidth: 1,
  },
  statusText: {
    fontSize: 13,
    color: "#94A3B8",
    fontWeight: "500",
  },
  filterRow: {
    marginTop: 12,
    marginBottom: 8,
  },
  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  filterChipActive: {
    backgroundColor: "rgba(0, 170, 255, 0.2)",
    borderColor: "#00AAFF",
  },
  filterText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#94A3B8",
  },
  filterTextActive: {
    color: "#fff",
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 40,
    gap: 8,
  },
  notifCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 14,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.03)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    gap: 12,
  },
  notifCardUnread: {
    backgroundColor: "rgba(0, 170, 255, 0.06)",
    borderColor: "rgba(0, 170, 255, 0.2)",
  },
  notifIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  notifContent: {
    flex: 1,
    gap: 3,
  },
  notifTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  notifTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#CBD5E1",
    flex: 1,
  },
  notifTitleUnread: {
    color: "#fff",
    fontWeight: "700",
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#00AAFF",
    shadowColor: "#00AAFF",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },
  notifBody: {
    fontSize: 13,
    color: "#94A3B8",
    lineHeight: 18,
  },
  notifTime: {
    fontSize: 11,
    color: "#475569",
    marginTop: 2,
  },
  dismissBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.05)",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#fff",
  },
  emptyDesc: {
    fontSize: 14,
    color: "#64748B",
    textAlign: "center",
    maxWidth: 260,
  },
});
