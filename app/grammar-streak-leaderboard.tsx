import React, { useState, useEffect, useCallback } from "react";
import { View, Text, Pressable, FlatList, StyleSheet, TextInput, Alert, Share } from "react-native";
import { router } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import * as Haptics from "expo-haptics";
import { Platform } from "react-native";
import { getStreakData } from "@/lib/grammar-streak";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { trpc } from "@/lib/trpc";
import { sendChallengeNotification, getPendingChallengeCount } from "@/lib/challenge-notifications";
import { useFocusEffect } from "@react-navigation/native";

const LEADERBOARD_KEY = "@grammar_streak_leaderboard";

interface LeaderboardEntry {
  id: string;
  name: string;
  avatar: string;
  streak: number;
  totalReviews: number;
  isCurrentUser: boolean;
  rank: number;
}

interface StudyGroup {
  id: number;
  name: string;
  description: string | null;
  languageCode: string | null;
  maxMembers: number | null;
  isAdmin: boolean;
}

type TabMode = "friends" | "groups";

// Fallback: Generate simulated leaderboard when backend is unavailable
function generateLeaderboard(userStreak: number): LeaderboardEntry[] {
  const friends: Omit<LeaderboardEntry, "rank">[] = [
    { id: "user", name: "You", avatar: "🧑‍🎓", streak: userStreak, totalReviews: userStreak * 3, isCurrentUser: true },
    { id: "f1", name: "Maria G.", avatar: "👩‍💻", streak: Math.max(0, userStreak + Math.floor(Math.random() * 5) - 2), totalReviews: 45, isCurrentUser: false },
    { id: "f2", name: "Carlos R.", avatar: "👨‍🎨", streak: Math.max(0, userStreak + Math.floor(Math.random() * 8) - 4), totalReviews: 38, isCurrentUser: false },
    { id: "f3", name: "Yuki T.", avatar: "👩‍🔬", streak: Math.max(0, userStreak + Math.floor(Math.random() * 6) - 3), totalReviews: 52, isCurrentUser: false },
    { id: "f4", name: "Ahmed K.", avatar: "👨‍🏫", streak: Math.max(0, userStreak + Math.floor(Math.random() * 4) - 1), totalReviews: 29, isCurrentUser: false },
    { id: "f5", name: "Sophie L.", avatar: "👩‍🎤", streak: Math.max(0, userStreak + Math.floor(Math.random() * 7) - 5), totalReviews: 61, isCurrentUser: false },
    { id: "f6", name: "Jin W.", avatar: "🧑‍💼", streak: Math.max(0, userStreak + Math.floor(Math.random() * 3)), totalReviews: 33, isCurrentUser: false },
    { id: "f7", name: "Elena P.", avatar: "👩‍⚕️", streak: Math.max(0, userStreak - Math.floor(Math.random() * 3)), totalReviews: 41, isCurrentUser: false },
    { id: "f8", name: "David M.", avatar: "👨‍🚀", streak: Math.max(0, userStreak - Math.floor(Math.random() * 5)), totalReviews: 22, isCurrentUser: false },
    { id: "f9", name: "Priya S.", avatar: "👩‍🏫", streak: Math.max(0, userStreak + Math.floor(Math.random() * 2)), totalReviews: 47, isCurrentUser: false },
  ];

  const sorted = friends.sort((a, b) => b.streak - a.streak || b.totalReviews - a.totalReviews);
  return sorted.map((entry, i) => ({ ...entry, rank: i + 1 }));
}

export default function GrammarStreakLeaderboardScreen() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [userStreak, setUserStreak] = useState(0);
  const [userRank, setUserRank] = useState(0);
  const [loading, setLoading] = useState(true);
  const [tabMode, setTabMode] = useState<TabMode>("friends");
  const [myGroups, setMyGroups] = useState<StudyGroup[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showJoinGroup, setShowJoinGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [isBackendAvailable, setIsBackendAvailable] = useState(false);
  const [pendingChallengeCount, setPendingChallengeCount] = useState(0);

  // Load pending challenge count on focus
  useFocusEffect(
    useCallback(() => {
      getPendingChallengeCount().then(setPendingChallengeCount);
    }, [])
  );

  // tRPC queries
  const friendsQuery = trpc.grammarLeaderboard.getFriendsLeaderboard.useQuery(undefined, {
    enabled: tabMode === "friends",
    retry: 1,
    
  });

  const groupsQuery = trpc.grammarLeaderboard.getMyGroups.useQuery(undefined, {
    enabled: tabMode === "groups",
    retry: 1,
  });

  const groupLeaderboardQuery = trpc.grammarLeaderboard.getGroupLeaderboard.useQuery(
    { groupId: selectedGroupId! },
    { enabled: !!selectedGroupId && tabMode === "groups", retry: 1 }
  );

  const createGroupMutation = trpc.grammarLeaderboard.createGroup.useMutation();
  const joinGroupMutation = trpc.grammarLeaderboard.joinGroup.useMutation();
  const generateInviteMutation = trpc.grammarLeaderboard.generateGroupInvite.useMutation();

  useEffect(() => {
    loadLeaderboard();
  }, []);

  useEffect(() => {
    if (friendsQuery.data && tabMode === "friends") {
      setIsBackendAvailable(true);
      setLeaderboard(friendsQuery.data.leaderboard);
      setUserRank(friendsQuery.data.userRank);
      setUserStreak(friendsQuery.data.userStreak);
      setLoading(false);
    }
  }, [friendsQuery.data]);

  useEffect(() => {
    if (groupsQuery.data) {
      setMyGroups(groupsQuery.data);
    }
  }, [groupsQuery.data]);

  useEffect(() => {
    if (groupLeaderboardQuery.data && selectedGroupId) {
      setLeaderboard(groupLeaderboardQuery.data.leaderboard);
      setUserRank(groupLeaderboardQuery.data.userRank);
      setLoading(false);
    }
  }, [groupLeaderboardQuery.data]);

  const loadLeaderboard = async () => {
    try {
      const streakData = await getStreakData();
      const streak = streakData.currentStreak;
      setUserStreak(streak);

      // Try backend first via tRPC (handled by useQuery above)
      // If backend fails, fall back to local simulation
      setTimeout(() => {
        if (!isBackendAvailable && loading) {
          loadLocalFallback(streak);
        }
      }, 3000);
    } catch (e) {
      console.error("Failed to load leaderboard:", e);
      setLoading(false);
    }
  };

  const loadLocalFallback = async (streak: number) => {
    try {
      const cached = await AsyncStorage.getItem(LEADERBOARD_KEY);
      const today = new Date().toDateString();

      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed.date === today) {
          const updated = parsed.entries.map((e: LeaderboardEntry) =>
            e.isCurrentUser ? { ...e, streak } : e
          );
          const sorted = updated.sort((a: LeaderboardEntry, b: LeaderboardEntry) => b.streak - a.streak || b.totalReviews - a.totalReviews);
          const ranked = sorted.map((e: LeaderboardEntry, i: number) => ({ ...e, rank: i + 1 }));
          setLeaderboard(ranked);
          const user = ranked.find((e: LeaderboardEntry) => e.isCurrentUser);
          setUserRank(user?.rank || 0);
          setLoading(false);
          return;
        }
      }

      const entries = generateLeaderboard(streak);
      setLeaderboard(entries);
      const user = entries.find((e) => e.isCurrentUser);
      setUserRank(user?.rank || 0);
      await AsyncStorage.setItem(LEADERBOARD_KEY, JSON.stringify({ date: today, entries }));
    } catch (e) {
      console.error("Fallback load failed:", e);
    }
    setLoading(false);
  };

  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) return;
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const result = await createGroupMutation.mutateAsync({ name: newGroupName.trim() });
      if (result.success) {
        setShowCreateGroup(false);
        setNewGroupName("");
        groupsQuery.refetch();
        Alert.alert("Success", "Study group created!");
      }
    } catch (e) {
      Alert.alert("Error", "Could not create group. Please try again.");
    }
  };

  const handleJoinGroup = async () => {
    if (!joinCode.trim()) return;
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const result = await joinGroupMutation.mutateAsync({ inviteCode: joinCode.trim() });
      if (result.success) {
        setShowJoinGroup(false);
        setJoinCode("");
        groupsQuery.refetch();
        Alert.alert("Joined!", `Welcome to ${result.groupName}!`);
      } else {
        Alert.alert("Error", result.error || "Could not join group.");
      }
    } catch (e) {
      Alert.alert("Error", "Invalid invite code. Please try again.");
    }
  };

  const handleShareInvite = async (groupId: number) => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    try {
      const result = await generateInviteMutation.mutateAsync({ groupId });
      await Share.share({
        message: result.shareMessage,
      });
    } catch (e) {
      Alert.alert("Error", "Could not generate invite. Please try again.");
    }
  };

  const getRankBadge = (rank: number): string => {
    if (rank === 1) return "🥇";
    if (rank === 2) return "🥈";
    if (rank === 3) return "🥉";
    return `#${rank}`;
  };

  const getRankColor = (rank: number): string => {
    if (rank === 1) return "#FFD700";
    if (rank === 2) return "#C0C0C0";
    if (rank === 3) return "#CD7F32";
    return "#9BA1A6";
  };

  const renderEntry = useCallback(
    ({ item }: { item: LeaderboardEntry }) => (
      <View
        style={[
          styles.entryRow,
          item.isCurrentUser && styles.entryRowCurrent,
        ]}
      >
        <View style={styles.rankCol}>
          {item.rank <= 3 ? (
            <Text style={styles.rankEmoji}>{getRankBadge(item.rank)}</Text>
          ) : (
            <Text style={[styles.rankNumber, { color: getRankColor(item.rank) }]}>
              {item.rank}
            </Text>
          )}
        </View>

        <View style={styles.userCol}>
          <Text style={styles.avatar}>{item.avatar}</Text>
          <View>
            <Text style={[styles.userName, item.isCurrentUser && styles.userNameCurrent]}>
              {item.name}
            </Text>
            <Text style={styles.userReviews}>{item.totalReviews} reviews</Text>
          </View>
        </View>

        <View style={styles.streakCol}>
          <Text style={[styles.streakValue, { color: getRankColor(item.rank) }]}>
            {item.streak}
          </Text>
          <Text style={styles.streakLabel}>days</Text>
        </View>

        {!item.isCurrentUser && (
          <Pressable
            style={({ pressed }) => [styles.challengeBtn, pressed && { opacity: 0.7 }]}
            onPress={() => {
              if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              // Send challenge notification to friend
              sendChallengeNotification(item.id, item.name, "mixed", "medium", 5).catch(() => {});
              router.push({ pathname: "/grammar-challenge", params: { friendId: item.id, friendName: item.name } } as any);
            }}
          >
            <Text style={styles.challengeBtnText}>⚔️</Text>
          </Pressable>
        )}
      </View>
    ),
    []
  );

  const renderGroupItem = ({ item }: { item: StudyGroup }) => (
    <Pressable
      style={({ pressed }) => [
        styles.groupCard,
        selectedGroupId === item.id && styles.groupCardActive,
        pressed && { opacity: 0.8 },
      ]}
      onPress={() => {
        setSelectedGroupId(item.id);
        setLoading(true);
        if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }}
    >
      <View style={styles.groupInfo}>
        <Text style={styles.groupName}>{item.name}</Text>
        {item.description && <Text style={styles.groupDesc}>{item.description}</Text>}
        {item.isAdmin && <Text style={styles.adminBadge}>Admin</Text>}
      </View>
      {item.isAdmin && (
        <Pressable
          style={({ pressed }) => [styles.inviteBtn, pressed && { opacity: 0.7 }]}
          onPress={() => handleShareInvite(item.id)}
        >
          <Text style={styles.inviteBtnText}>Invite</Text>
        </Pressable>
      )}
    </Pressable>
  );

  return (
    <ScreenContainer edges={["top", "left", "right"]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.7 }]}
          onPress={() => router.back()}
        >
          <Text style={styles.backText}>← Back</Text>
        </Pressable>
        <Text style={styles.headerTitle}>🏆 Grammar Leaderboard</Text>
        <Pressable
          style={({ pressed }) => [styles.inboxBtn, pressed && { opacity: 0.7 }]}
          onPress={() => router.push("/challenge-inbox" as any)}
        >
          <Text style={styles.inboxBtnText}>📥</Text>
          {pendingChallengeCount > 0 && (
            <View style={styles.inboxBadge}>
              <Text style={styles.inboxBadgeText}>{pendingChallengeCount}</Text>
            </View>
          )}
        </Pressable>
      </View>

      {/* Tab Switcher */}
      <View style={styles.tabRow}>
        <Pressable
          style={({ pressed }) => [styles.tab, tabMode === "friends" && styles.tabActive, pressed && { opacity: 0.8 }]}
          onPress={() => { setTabMode("friends"); setSelectedGroupId(null); }}
        >
          <Text style={[styles.tabText, tabMode === "friends" && styles.tabTextActive]}>Friends</Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [styles.tab, tabMode === "groups" && styles.tabActive, pressed && { opacity: 0.8 }]}
          onPress={() => setTabMode("groups")}
        >
          <Text style={[styles.tabText, tabMode === "groups" && styles.tabTextActive]}>Study Groups</Text>
        </Pressable>
      </View>

      {/* User Summary Card */}
      <View style={styles.summaryCard}>
        <View style={styles.summaryLeft}>
          <Text style={styles.summaryEmoji}>🔥</Text>
          <View>
            <Text style={styles.summaryStreak}>{userStreak} Day Streak</Text>
            <Text style={styles.summaryRank}>
              {userRank > 0 ? `Rank #${userRank} among ${tabMode === "friends" ? "friends" : "group"}` : "Start reviewing to rank up!"}
            </Text>
          </View>
        </View>
        {userRank <= 3 && userRank > 0 && (
          <Text style={styles.summaryBadge}>{getRankBadge(userRank)}</Text>
        )}
      </View>

      {/* Backend status indicator */}
      {!isBackendAvailable && tabMode === "friends" && !loading && (
        <View style={styles.offlineBanner}>
          <Text style={styles.offlineText}>Showing simulated rankings (sign in to see real friends)</Text>
        </View>
      )}

      {/* Motivational message */}
      {userRank > 1 && tabMode === "friends" && (
        <View style={styles.motivationBanner}>
          <Text style={styles.motivationText}>
            {userRank === 2
              ? "So close! One more day to take the lead! 💪"
              : userRank <= 5
              ? `${(leaderboard[0]?.streak || 0) - userStreak} more days to reach #1!`
              : "Keep going! Consistency is key to mastery."}
          </Text>
        </View>
      )}

      {/* Groups Tab Content */}
      {tabMode === "groups" && !selectedGroupId && (
        <View style={styles.groupsSection}>
          {/* Create / Join buttons */}
          <View style={styles.groupActions}>
            <Pressable
              style={({ pressed }) => [styles.actionBtn, pressed && { opacity: 0.8 }]}
              onPress={() => setShowCreateGroup(true)}
            >
              <Text style={styles.actionBtnText}>+ Create Group</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [styles.actionBtn, styles.actionBtnSecondary, pressed && { opacity: 0.8 }]}
              onPress={() => setShowJoinGroup(true)}
            >
              <Text style={[styles.actionBtnText, styles.actionBtnTextSecondary]}>Join Group</Text>
            </Pressable>
          </View>

          {/* Create Group Form */}
          {showCreateGroup && (
            <View style={styles.formCard}>
              <Text style={styles.formTitle}>Create Study Group</Text>
              <TextInput
                style={styles.formInput}
                placeholder="Group name..."
                placeholderTextColor="#687076"
                value={newGroupName}
                onChangeText={setNewGroupName}
                returnKeyType="done"
                onSubmitEditing={handleCreateGroup}
              />
              <View style={styles.formBtns}>
                <Pressable
                  style={({ pressed }) => [styles.formBtn, pressed && { opacity: 0.8 }]}
                  onPress={handleCreateGroup}
                >
                  <Text style={styles.formBtnText}>Create</Text>
                </Pressable>
                <Pressable
                  style={({ pressed }) => [styles.formBtnCancel, pressed && { opacity: 0.8 }]}
                  onPress={() => setShowCreateGroup(false)}
                >
                  <Text style={styles.formBtnCancelText}>Cancel</Text>
                </Pressable>
              </View>
            </View>
          )}

          {/* Join Group Form */}
          {showJoinGroup && (
            <View style={styles.formCard}>
              <Text style={styles.formTitle}>Join Study Group</Text>
              <TextInput
                style={styles.formInput}
                placeholder="Enter invite code..."
                placeholderTextColor="#687076"
                value={joinCode}
                onChangeText={setJoinCode}
                autoCapitalize="characters"
                returnKeyType="done"
                onSubmitEditing={handleJoinGroup}
              />
              <View style={styles.formBtns}>
                <Pressable
                  style={({ pressed }) => [styles.formBtn, pressed && { opacity: 0.8 }]}
                  onPress={handleJoinGroup}
                >
                  <Text style={styles.formBtnText}>Join</Text>
                </Pressable>
                <Pressable
                  style={({ pressed }) => [styles.formBtnCancel, pressed && { opacity: 0.8 }]}
                  onPress={() => setShowJoinGroup(false)}
                >
                  <Text style={styles.formBtnCancelText}>Cancel</Text>
                </Pressable>
              </View>
            </View>
          )}

          {/* My Groups List */}
          {myGroups.length > 0 ? (
            <FlatList
              data={myGroups}
              keyExtractor={(item) => String(item.id)}
              renderItem={renderGroupItem}
              contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
              showsVerticalScrollIndicator={false}
              ListHeaderComponent={
                <View style={styles.listHeader}>
                  <Text style={styles.listHeaderText}>My Study Groups</Text>
                  <Text style={styles.listHeaderSub}>Tap a group to see its leaderboard</Text>
                </View>
              }
            />
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyEmoji}>📚</Text>
              <Text style={styles.emptyTitle}>No study groups yet</Text>
              <Text style={styles.emptyDesc}>Create a group or join one with an invite code to compete with friends!</Text>
            </View>
          )}
        </View>
      )}

      {/* Leaderboard List (Friends tab or selected group) */}
      {(tabMode === "friends" || selectedGroupId) && (
        <>
          {loading ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Loading leaderboard...</Text>
            </View>
          ) : (
            <FlatList
              data={leaderboard}
              keyExtractor={(item) => item.id}
              renderItem={renderEntry}
              contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
              showsVerticalScrollIndicator={false}
              ListHeaderComponent={
                <View style={styles.listHeader}>
                  <Text style={styles.listHeaderText}>
                    {tabMode === "groups" && groupLeaderboardQuery.data
                      ? `${groupLeaderboardQuery.data.groupName} Rankings`
                      : "Study Group Rankings"}
                  </Text>
                  <Text style={styles.listHeaderSub}>Based on consecutive grammar review days</Text>
                </View>
              }
            />
          )}
        </>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12, gap: 12, borderBottomWidth: 1, borderBottomColor: "#1e2d3d" },
  backBtn: { paddingVertical: 4, paddingHorizontal: 8 },
  backText: { fontSize: 16, color: "#00AAFF", fontWeight: "600" },
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#ECEDEE", flex: 1 },
  inboxBtn: { position: "relative", padding: 8 },
  inboxBtnText: { fontSize: 20 },
  inboxBadge: { position: "absolute", top: 2, right: 2, backgroundColor: "#EF4444", borderRadius: 8, minWidth: 16, height: 16, justifyContent: "center", alignItems: "center", paddingHorizontal: 4 },
  inboxBadgeText: { color: "#fff", fontSize: 10, fontWeight: "700" },

  tabRow: { flexDirection: "row", marginHorizontal: 16, marginTop: 12, backgroundColor: "#0d1b2a", borderRadius: 10, padding: 3 },
  tab: { flex: 1, paddingVertical: 8, alignItems: "center", borderRadius: 8 },
  tabActive: { backgroundColor: "#00AAFF" },
  tabText: { fontSize: 13, fontWeight: "600", color: "#9BA1A6" },
  tabTextActive: { color: "#FFFFFF" },

  summaryCard: { marginHorizontal: 16, marginTop: 12, backgroundColor: "rgba(255, 215, 0, 0.06)", borderRadius: 14, padding: 16, flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderWidth: 1, borderColor: "rgba(255, 215, 0, 0.2)" },
  summaryLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  summaryEmoji: { fontSize: 32 },
  summaryStreak: { fontSize: 18, fontWeight: "800", color: "#ECEDEE" },
  summaryRank: { fontSize: 12, color: "#9BA1A6", marginTop: 2 },
  summaryBadge: { fontSize: 36 },

  offlineBanner: { marginHorizontal: 16, marginTop: 8, backgroundColor: "rgba(245, 158, 11, 0.08)", borderRadius: 8, padding: 8, borderWidth: 1, borderColor: "rgba(245, 158, 11, 0.2)" },
  offlineText: { fontSize: 11, color: "#F59E0B", textAlign: "center" },

  motivationBanner: { marginHorizontal: 16, marginTop: 10, backgroundColor: "rgba(0, 170, 255, 0.06)", borderRadius: 10, padding: 12, borderWidth: 1, borderColor: "rgba(0, 170, 255, 0.15)" },
  motivationText: { fontSize: 13, color: "#00AAFF", fontWeight: "600", textAlign: "center" },

  groupsSection: { flex: 1 },
  groupActions: { flexDirection: "row", gap: 10, paddingHorizontal: 16, marginTop: 12 },
  actionBtn: { flex: 1, backgroundColor: "#00AAFF", paddingVertical: 10, borderRadius: 10, alignItems: "center" },
  actionBtnSecondary: { backgroundColor: "transparent", borderWidth: 1, borderColor: "#00AAFF" },
  actionBtnText: { fontSize: 13, fontWeight: "700", color: "#FFFFFF" },
  actionBtnTextSecondary: { color: "#00AAFF" },

  formCard: { marginHorizontal: 16, marginTop: 12, backgroundColor: "#0d1b2a", borderRadius: 12, padding: 16, borderWidth: 1, borderColor: "#1e3a5f" },
  formTitle: { fontSize: 15, fontWeight: "700", color: "#ECEDEE", marginBottom: 10 },
  formInput: { backgroundColor: "#1a2a3a", borderRadius: 8, padding: 12, fontSize: 14, color: "#ECEDEE", borderWidth: 1, borderColor: "#2a3a4a" },
  formBtns: { flexDirection: "row", gap: 10, marginTop: 12 },
  formBtn: { flex: 1, backgroundColor: "#00AAFF", paddingVertical: 10, borderRadius: 8, alignItems: "center" },
  formBtnText: { fontSize: 13, fontWeight: "700", color: "#FFFFFF" },
  formBtnCancel: { flex: 1, paddingVertical: 10, borderRadius: 8, alignItems: "center" },
  formBtnCancelText: { fontSize: 13, fontWeight: "600", color: "#9BA1A6" },

  groupCard: { backgroundColor: "#0d1b2a", borderRadius: 12, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: "#1e3a5f", flexDirection: "row", alignItems: "center" },
  groupCardActive: { borderColor: "#00AAFF", backgroundColor: "rgba(0, 170, 255, 0.04)" },
  groupInfo: { flex: 1 },
  groupName: { fontSize: 15, fontWeight: "700", color: "#ECEDEE" },
  groupDesc: { fontSize: 12, color: "#9BA1A6", marginTop: 2 },
  adminBadge: { fontSize: 10, color: "#FFD700", fontWeight: "700", marginTop: 4 },
  inviteBtn: { backgroundColor: "rgba(0, 170, 255, 0.15)", paddingVertical: 6, paddingHorizontal: 12, borderRadius: 6 },
  inviteBtnText: { fontSize: 12, fontWeight: "600", color: "#00AAFF" },

  emptyState: { flex: 1, alignItems: "center", justifyContent: "center", padding: 40 },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: "700", color: "#ECEDEE" },
  emptyDesc: { fontSize: 13, color: "#9BA1A6", textAlign: "center", marginTop: 6, lineHeight: 18 },

  listHeader: { marginBottom: 12 },
  listHeaderText: { fontSize: 15, fontWeight: "700", color: "#ECEDEE" },
  listHeaderSub: { fontSize: 12, color: "#9BA1A6", marginTop: 2 },

  entryRow: { flexDirection: "row", alignItems: "center", backgroundColor: "#0d1b2a", borderRadius: 12, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: "#1e3a5f" },
  entryRowCurrent: { borderColor: "#00AAFF", backgroundColor: "rgba(0, 170, 255, 0.04)" },

  rankCol: { width: 36, alignItems: "center" },
  rankEmoji: { fontSize: 22 },
  rankNumber: { fontSize: 16, fontWeight: "800" },

  userCol: { flex: 1, flexDirection: "row", alignItems: "center", gap: 10, marginLeft: 8 },
  avatar: { fontSize: 28 },
  userName: { fontSize: 14, fontWeight: "600", color: "#ECEDEE" },
  userNameCurrent: { color: "#00AAFF" },
  userReviews: { fontSize: 11, color: "#9BA1A6", marginTop: 1 },

  streakCol: { alignItems: "center", minWidth: 50 },
  streakValue: { fontSize: 20, fontWeight: "800" },
  streakLabel: { fontSize: 10, color: "#9BA1A6", marginTop: 1 },

  loadingContainer: { flex: 1, alignItems: "center", justifyContent: "center" },
  loadingText: { fontSize: 14, color: "#9BA1A6" },
  challengeBtn: { paddingHorizontal: 8, paddingVertical: 6, marginLeft: 8 },
  challengeBtnText: { fontSize: 18 },
});
