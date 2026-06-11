import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Platform,
  Alert,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";

const BLOCKED_USERS_KEY = "@linguavibe_blocked_users";

export interface BlockedUser {
  id: string;
  name: string;
  username: string;
  avatar?: string;
  blockedAt: string; // ISO date
  reason?: string;
}

export default function BlockedUsersScreen() {
  const colors = useColors();
  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBlockedUsers();
  }, []);

  const loadBlockedUsers = async () => {
    try {
      const stored = await AsyncStorage.getItem(BLOCKED_USERS_KEY);
      if (stored) {
        setBlockedUsers(JSON.parse(stored));
      }
    } catch {} finally {
      setLoading(false);
    }
  };

  const unblockUser = useCallback(async (userId: string, userName: string) => {
    Alert.alert(
      "Unblock User",
      `Are you sure you want to unblock ${userName}? They will be able to message you and see your profile again.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Unblock",
          style: "destructive",
          onPress: async () => {
            if (Platform.OS !== "web") {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            }
            const updated = blockedUsers.filter((u) => u.id !== userId);
            setBlockedUsers(updated);
            await AsyncStorage.setItem(BLOCKED_USERS_KEY, JSON.stringify(updated));
          },
        },
      ]
    );
  }, [blockedUsers]);

  const formatBlockedDate = (isoDate: string): string => {
    const date = new Date(isoDate);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  };

  const renderBlockedUser = ({ item }: { item: BlockedUser }) => (
    <View style={[styles.userRow, { borderBottomColor: colors.border }]}>
      <View style={[styles.avatar, { backgroundColor: colors.surface }]}>
        {item.avatar ? (
          <Image source={{ uri: item.avatar }} style={styles.avatarImage} />
        ) : (
          <Text style={[styles.avatarInitial, { color: colors.primary }]}>
            {item.name.charAt(0).toUpperCase()}
          </Text>
        )}
      </View>
      <View style={styles.userInfo}>
        <Text style={[styles.userName, { color: colors.foreground }]}>{item.name}</Text>
        <Text style={[styles.userHandle, { color: colors.muted }]}>@{item.username}</Text>
        <Text style={[styles.blockedDate, { color: colors.muted }]}>
          Blocked {formatBlockedDate(item.blockedAt)}
        </Text>
      </View>
      <TouchableOpacity
        style={[styles.unblockBtn, { borderColor: colors.primary }]}
        onPress={() => unblockUser(item.id, item.name)}
        activeOpacity={0.7}
      >
        <Text style={[styles.unblockText, { color: colors.primary }]}>Unblock</Text>
      </TouchableOpacity>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <View style={[styles.emptyIcon, { backgroundColor: colors.surface }]}>
        <Ionicons name="shield-checkmark" size={48} color="#00B894" />
      </View>
      <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No Blocked Users</Text>
      <Text style={[styles.emptyDesc, { color: colors.muted }]}>
        When you block someone, they won't be able to message you, see your profile, or find you in search. You can block users from their profile page.
      </Text>
    </View>
  );

  return (
    <ScreenContainer edges={["top", "left", "right"]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Blocked Users</Text>
        <View style={{ width: 32 }} />
      </View>

      {/* Info Banner */}
      <View style={[styles.infoBanner, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Ionicons name="information-circle" size={20} color={colors.primary} />
        <Text style={[styles.infoText, { color: colors.muted }]}>
          Blocked users can't contact you, see your learning progress, or find you in search. They won't be notified that you blocked them.
        </Text>
      </View>

      {/* List */}
      <FlatList
        data={blockedUsers}
        keyExtractor={(item) => item.id}
        renderItem={renderBlockedUser}
        ListEmptyComponent={loading ? null : renderEmptyState}
        contentContainerStyle={blockedUsers.length === 0 ? styles.emptyContainer : styles.listContainer}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 17, fontWeight: "700" },
  infoBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    margin: 16,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  infoText: { flex: 1, fontSize: 13, lineHeight: 18 },
  listContainer: { paddingHorizontal: 16 },
  emptyContainer: { flex: 1, justifyContent: "center", alignItems: "center", padding: 32 },
  userRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 0.5,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  avatarImage: { width: 48, height: 48, borderRadius: 24 },
  avatarInitial: { fontSize: 20, fontWeight: "700" },
  userInfo: { flex: 1, marginRight: 12 },
  userName: { fontSize: 15, fontWeight: "600" },
  userHandle: { fontSize: 13, marginTop: 2 },
  blockedDate: { fontSize: 12, marginTop: 3 },
  unblockBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  unblockText: { fontSize: 13, fontWeight: "700" },
  emptyState: { alignItems: "center", paddingHorizontal: 24 },
  emptyIcon: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  emptyTitle: { fontSize: 18, fontWeight: "700", marginBottom: 10 },
  emptyDesc: { fontSize: 14, lineHeight: 20, textAlign: "center" },
});
