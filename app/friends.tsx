import { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  Platform,
  Share,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Colors, Spacing, BorderRadius, FontSize } from "../constants/Colors";

const FRIENDS_KEY = "@connectworld_friends_list";
const MY_CODE_KEY = "@connectworld_my_friend_code";

type ConnectionType = "friend" | "classmate";

interface Friend {
  id: string;
  name: string;
  username: string;
  avatar: string; // emoji avatar
  language: string;
  streak: number;
  connectionType: ConnectionType;
  addedDate: string;
  isOnline: boolean;
  lastActive: string;
}

// Simulated user directory for search
// Discover suggestions — people with shared goals/similar streaks
const DISCOVER_SUGGESTIONS: Friend[] = [
  { id: "d1", name: "Fatima Al-Rashid", username: "@fatima_ar", avatar: "👩🏽", language: "Arabic", streak: 42, connectionType: "classmate", addedDate: "", isOnline: true, lastActive: "now" },
  { id: "d2", name: "Tomás Herrera", username: "@tomas_h", avatar: "👨🏽", language: "Spanish", streak: 33, connectionType: "friend", addedDate: "", isOnline: true, lastActive: "now" },
  { id: "d3", name: "Hana Kim", username: "@hana_k", avatar: "👩🏻", language: "Korean", streak: 57, connectionType: "classmate", addedDate: "", isOnline: false, lastActive: "1h ago" },
  { id: "d4", name: "Dmitri Volkov", username: "@dmitri_v", avatar: "👨🏼", language: "Russian", streak: 19, connectionType: "friend", addedDate: "", isOnline: false, lastActive: "3h ago" },
  { id: "d5", name: "Amara Okafor", username: "@amara_o", avatar: "👩🏿", language: "French", streak: 64, connectionType: "classmate", addedDate: "", isOnline: true, lastActive: "now" },
];

const USER_DIRECTORY: Friend[] = [
  { id: "u1", name: "Maria Garcia", username: "@maria_g", avatar: "👩🏽", language: "Spanish", streak: 45, connectionType: "friend", addedDate: "", isOnline: true, lastActive: "now" },
  { id: "u2", name: "Yuki Tanaka", username: "@yuki_t", avatar: "👩🏻", language: "Japanese", streak: 32, connectionType: "classmate", addedDate: "", isOnline: false, lastActive: "2h ago" },
  { id: "u3", name: "Ahmed Hassan", username: "@ahmed_h", avatar: "👨🏽", language: "Arabic", streak: 67, connectionType: "friend", addedDate: "", isOnline: true, lastActive: "now" },
  { id: "u4", name: "Sophie Laurent", username: "@sophie_l", avatar: "👩🏼", language: "French", streak: 21, connectionType: "classmate", addedDate: "", isOnline: false, lastActive: "1d ago" },
  { id: "u5", name: "Wei Chen", username: "@wei_c", avatar: "👨🏻", language: "Mandarin", streak: 89, connectionType: "friend", addedDate: "", isOnline: true, lastActive: "now" },
  { id: "u6", name: "Priya Patel", username: "@priya_p", avatar: "👩🏽", language: "Hindi", streak: 14, connectionType: "classmate", addedDate: "", isOnline: false, lastActive: "5h ago" },
  { id: "u7", name: "Carlos Rivera", username: "@carlos_r", avatar: "👨🏽", language: "Spanish", streak: 55, connectionType: "friend", addedDate: "", isOnline: true, lastActive: "now" },
  { id: "u8", name: "Lena Schmidt", username: "@lena_s", avatar: "👩🏼", language: "German", streak: 38, connectionType: "classmate", addedDate: "", isOnline: false, lastActive: "3h ago" },
  { id: "u9", name: "Kenji Watanabe", username: "@kenji_w", avatar: "👨🏻", language: "Japanese", streak: 72, connectionType: "friend", addedDate: "", isOnline: true, lastActive: "now" },
  { id: "u10", name: "Isabella Rossi", username: "@bella_r", avatar: "👩🏼", language: "Italian", streak: 28, connectionType: "friend", addedDate: "", isOnline: false, lastActive: "30m ago" },
];

export default function FriendsScreen() {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Friend[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [activeTab, setActiveTab] = useState<"all" | "friends" | "classmates">("all");
  const [myCode, setMyCode] = useState("");

  useEffect(() => {
    loadFriends();
    loadMyCode();
  }, []);

  const loadFriends = async () => {
    try {
      const stored = await AsyncStorage.getItem(FRIENDS_KEY);
      if (stored) {
        setFriends(JSON.parse(stored));
      } else {
        // Default friends for demo
        const defaultFriends = USER_DIRECTORY.slice(0, 5).map(f => ({
          ...f,
          addedDate: "2024-01-15",
        }));
        setFriends(defaultFriends);
        await AsyncStorage.setItem(FRIENDS_KEY, JSON.stringify(defaultFriends));
      }
    } catch (e) { /* ignore */ }
  };

  const loadMyCode = async () => {
    try {
      const stored = await AsyncStorage.getItem(MY_CODE_KEY);
      if (stored) {
        setMyCode(stored);
      } else {
        const code = "CM-" + Math.random().toString(36).substring(2, 8).toUpperCase();
        setMyCode(code);
        await AsyncStorage.setItem(MY_CODE_KEY, code);
      }
    } catch (e) { /* ignore */ }
  };

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    if (query.length >= 2) {
      setIsSearching(true);
      const results = USER_DIRECTORY.filter(
        u => !friends.find(f => f.id === u.id) &&
          (u.name.toLowerCase().includes(query.toLowerCase()) ||
           u.username.toLowerCase().includes(query.toLowerCase()))
      );
      setSearchResults(results);
    } else {
      setIsSearching(false);
      setSearchResults([]);
    }
  }, [friends]);

  const addFriend = async (user: Friend, type: ConnectionType) => {
    if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const newFriend = { ...user, connectionType: type, addedDate: new Date().toISOString().split("T")[0] };
    const updated = [...friends, newFriend];
    setFriends(updated);
    await AsyncStorage.setItem(FRIENDS_KEY, JSON.stringify(updated));
    setSearchQuery("");
    setIsSearching(false);
    setSearchResults([]);
  };

  const removeFriend = async (id: string) => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const updated = friends.filter(f => f.id !== id);
    setFriends(updated);
    await AsyncStorage.setItem(FRIENDS_KEY, JSON.stringify(updated));
  };

  const shareInvite = async () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const inviteUrl = `https://connectworld.ai/invite/${myCode}`;
    try {
      await Share.share({
        message: `Hey! Join me on ConnectWorld AI \u2014 free WiFi calling, messaging, and real-time translation. Use my code: ${myCode}\n\nDownload here: ${inviteUrl}`,
        title: "Join ConnectWorld AI",
      });
    } catch (e) { /* ignore */ }
  };

  const filteredFriends = activeTab === "all"
    ? friends
    : friends.filter(f => f.connectionType === (activeTab === "friends" ? "friend" : "classmate"));

  const renderFriend = ({ item }: { item: Friend }) => (
    <TouchableOpacity
      style={styles.friendCard}
      onPress={() => {
        if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }}
      onLongPress={() => {
        Alert.alert(
          "Remove Connection",
          `Remove ${item.name} from your ${item.connectionType}s?`,
          [
            { text: "Cancel", style: "cancel" },
            { text: "Remove", style: "destructive", onPress: () => removeFriend(item.id) },
          ]
        );
      }}
      activeOpacity={0.7}
    >
      <View style={styles.friendAvatarContainer}>
        <Text style={styles.friendAvatar}>{item.avatar}</Text>
        {item.isOnline && <View style={styles.onlineDot} />}
      </View>
      <View style={styles.friendInfo}>
        <Text style={styles.friendName}>{item.name}</Text>
        <Text style={styles.friendUsername}>{item.username}</Text>
        <View style={styles.friendMeta}>
          <Text style={styles.friendLanguage}>🌐 {item.language}</Text>
          <Text style={styles.friendStreak}>🔥 {item.streak}d</Text>
        </View>
      </View>
      <View style={styles.friendActions}>
        <View style={[styles.connectionBadge, item.connectionType === "friend" ? styles.friendBadge : styles.classmateBadge]}>
          <Text style={styles.connectionBadgeText}>
            {item.connectionType === "friend" ? "Friend" : "Classmate"}
          </Text>
        </View>
        <Text style={styles.lastActive}>{item.lastActive}</Text>
      </View>
    </TouchableOpacity>
  );

  const renderSearchResult = ({ item }: { item: Friend }) => (
    <View style={styles.searchResultCard}>
      <View style={styles.friendAvatarContainer}>
        <Text style={styles.friendAvatar}>{item.avatar}</Text>
      </View>
      <View style={styles.friendInfo}>
        <Text style={styles.friendName}>{item.name}</Text>
        <Text style={styles.friendUsername}>{item.username} · {item.language}</Text>
      </View>
      <View style={styles.addBtns}>
        <TouchableOpacity
          style={styles.addFriendBtn}
          onPress={() => addFriend(item, "friend")}
        >
          <Ionicons name="person-add" size={14} color="#fff" />
          <Text style={styles.addBtnText}>Friend</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.addClassmateBtn}
          onPress={() => addFriend(item, "classmate")}
        >
          <Ionicons name="school" size={14} color="#fff" />
          <Text style={styles.addBtnText}>Class</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

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
        <Text style={styles.headerTitle}>Connections</Text>
        <TouchableOpacity onPress={shareInvite} style={styles.shareBtn}>
          <Ionicons name="share-social" size={22} color={Colors.secondary} />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color={Colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name or username..."
            placeholderTextColor={Colors.textMuted}
            value={searchQuery}
            onChangeText={handleSearch}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => { setSearchQuery(""); setIsSearching(false); setSearchResults([]); }}>
              <Ionicons name="close-circle" size={18} color={Colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Invite Card */}
      <TouchableOpacity style={styles.inviteCard} onPress={shareInvite} activeOpacity={0.7}>
        <View style={styles.inviteIcon}>
          <Text style={{ fontSize: 24 }}>🔗</Text>
        </View>
        <View style={styles.inviteInfo}>
          <Text style={styles.inviteTitle}>Invite Friends</Text>
          <Text style={styles.inviteCode}>Your code: {myCode}</Text>
        </View>
        <View style={styles.inviteReward}>
          <Text style={styles.inviteRewardText}>+25</Text>
          <Text style={styles.inviteRewardLabel}>credits each</Text>
        </View>
      </TouchableOpacity>

      {/* Search Results */}
      {isSearching && (
        <View style={styles.searchResultsContainer}>
          <Text style={styles.sectionTitle}>
            {searchResults.length > 0 ? `Found ${searchResults.length} users` : "No users found"}
          </Text>
          <FlatList
            data={searchResults}
            renderItem={renderSearchResult}
            keyExtractor={(item) => item.id}
            style={styles.searchResultsList}
            showsVerticalScrollIndicator={false}
          />
        </View>
      )}

      {/* Tabs */}
      {!isSearching && (
        <>
          <View style={styles.tabs}>
            {(["all", "friends", "classmates"] as const).map(tab => (
              <TouchableOpacity
                key={tab}
                style={[styles.tab, activeTab === tab && styles.tabActive]}
                onPress={() => {
                  if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setActiveTab(tab);
                }}
              >
                <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                  {tab === "all" ? `All (${friends.length})` : tab === "friends" ? `Friends (${friends.filter(f => f.connectionType === "friend").length})` : `Classmates (${friends.filter(f => f.connectionType === "classmate").length})`}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Discover Section */}
          <View style={styles.discoverSection}>
            <View style={styles.discoverHeader}>
              <Text style={styles.discoverTitle}>🔍 People You May Know</Text>
              <Text style={styles.discoverSubtitle}>Based on shared goals & similar streaks</Text>
            </View>
            <FlatList
              horizontal
              data={DISCOVER_SUGGESTIONS.filter(d => !friends.find(f => f.id === d.id))}
              keyExtractor={(item) => item.id}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: Spacing.md, gap: 10 }}
              renderItem={({ item }) => (
                <View style={styles.discoverCard}>
                  <View style={styles.discoverAvatarRow}>
                    <Text style={{ fontSize: 28 }}>{item.avatar}</Text>
                    {item.isOnline && <View style={styles.discoverOnline} />}
                  </View>
                  <Text style={styles.discoverName} numberOfLines={1}>{item.name}</Text>
                  <Text style={styles.discoverLang}>🌐 {item.language}</Text>
                  <Text style={styles.discoverStreak}>🔥 {item.streak}d streak</Text>
                  <TouchableOpacity
                    style={styles.discoverAddBtn}
                    onPress={() => addFriend(item, "friend")}
                  >
                    <Ionicons name="person-add" size={14} color="#fff" />
                    <Text style={styles.discoverAddText}>Connect</Text>
                  </TouchableOpacity>
                </View>
              )}
            />
          </View>

          {/* QR Connect Link */}
          <TouchableOpacity
            style={styles.qrLink}
            onPress={() => {
              if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push("/qr-connect" as any);
            }}
            activeOpacity={0.7}
          >
            <Ionicons name="qr-code" size={20} color={Colors.secondary} />
            <Text style={styles.qrLinkText}>Scan QR Code to Connect Instantly</Text>
            <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
          </TouchableOpacity>

          {/* Friends List */}
          <FlatList
            data={filteredFriends}
            renderItem={renderFriend}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.friendsList}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Text style={{ fontSize: 48 }}>👥</Text>
                <Text style={styles.emptyTitle}>No connections yet</Text>
                <Text style={styles.emptySubtitle}>Search for users or share your invite code</Text>
              </View>
            }
          />
        </>
      )}
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
  shareBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  searchContainer: {
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surfaceCard,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: FontSize.md,
    color: Colors.textPrimary,
  },
  inviteCard: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.md,
    padding: Spacing.md,
    backgroundColor: "rgba(0, 170, 255, 0.08)",
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: "rgba(0, 170, 255, 0.2)",
    gap: Spacing.sm,
  },
  inviteIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(0, 170, 255, 0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  inviteInfo: {
    flex: 1,
  },
  inviteTitle: {
    fontSize: FontSize.md,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  inviteCode: {
    fontSize: FontSize.sm,
    color: Colors.secondary,
    fontWeight: "600",
    marginTop: 2,
  },
  inviteReward: {
    alignItems: "center",
    backgroundColor: Colors.gold + "22",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  inviteRewardText: {
    fontSize: FontSize.md,
    fontWeight: "800",
    color: Colors.gold,
  },
  inviteRewardLabel: {
    fontSize: 9,
    color: Colors.gold,
    fontWeight: "600",
  },
  tabs: {
    flexDirection: "row",
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
    gap: 8,
  },
  tab: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.surfaceCard,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tabActive: {
    backgroundColor: Colors.secondary,
    borderColor: Colors.secondary,
  },
  tabText: {
    fontSize: FontSize.sm,
    fontWeight: "600",
    color: Colors.textSecondary,
  },
  tabTextActive: {
    color: "#fff",
  },
  friendsList: {
    paddingHorizontal: Spacing.md,
    paddingBottom: 100,
  },
  friendCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surfaceCard,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.sm,
  },
  friendAvatarContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(0, 170, 255, 0.08)",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  friendAvatar: {
    fontSize: 24,
  },
  onlineDot: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.success,
    borderWidth: 2,
    borderColor: Colors.surfaceCard,
  },
  friendInfo: {
    flex: 1,
  },
  friendName: {
    fontSize: FontSize.md,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  friendUsername: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  friendMeta: {
    flexDirection: "row",
    gap: 10,
    marginTop: 4,
  },
  friendLanguage: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
  },
  friendStreak: {
    fontSize: FontSize.xs,
    color: Colors.gold,
    fontWeight: "600",
  },
  friendActions: {
    alignItems: "flex-end",
    gap: 4,
  },
  connectionBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  friendBadge: {
    backgroundColor: "rgba(0, 170, 255, 0.12)",
  },
  classmateBadge: {
    backgroundColor: "rgba(168, 85, 247, 0.12)",
  },
  connectionBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: Colors.textSecondary,
  },
  lastActive: {
    fontSize: 10,
    color: Colors.textMuted,
  },
  searchResultsContainer: {
    flex: 1,
    paddingHorizontal: Spacing.md,
  },
  sectionTitle: {
    fontSize: FontSize.sm,
    fontWeight: "700",
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  searchResultsList: {
    flex: 1,
  },
  searchResultCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surfaceCard,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.sm,
  },
  addBtns: {
    gap: 4,
  },
  addFriendBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: Colors.secondary,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  addClassmateBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#8B5CF6",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  addBtnText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#fff",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    gap: 8,
  },
  emptyTitle: {
    fontSize: FontSize.lg,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  emptySubtitle: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    textAlign: "center",
  },
  discoverSection: {
    marginBottom: Spacing.md,
  },
  discoverHeader: {
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
  },
  discoverTitle: {
    fontSize: FontSize.md,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  discoverSubtitle: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    marginTop: 2,
  },
  discoverCard: {
    width: 140,
    backgroundColor: Colors.surfaceCard,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
    gap: 4,
  },
  discoverAvatarRow: {
    position: "relative",
    marginBottom: 4,
  },
  discoverOnline: {
    position: "absolute",
    bottom: 0,
    right: -4,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.success,
    borderWidth: 2,
    borderColor: Colors.surfaceCard,
  },
  discoverName: {
    fontSize: FontSize.sm,
    fontWeight: "700",
    color: Colors.textPrimary,
    textAlign: "center",
  },
  discoverLang: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
  },
  discoverStreak: {
    fontSize: FontSize.xs,
    color: Colors.gold,
    fontWeight: "600",
  },
  discoverAddBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: Colors.secondary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    marginTop: 6,
  },
  discoverAddText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#fff",
  },
  qrLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.md,
    paddingVertical: 12,
    paddingHorizontal: Spacing.md,
    backgroundColor: "rgba(0, 170, 255, 0.06)",
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: "rgba(0, 170, 255, 0.15)",
  },
  qrLinkText: {
    flex: 1,
    fontSize: FontSize.sm,
    fontWeight: "600",
    color: Colors.secondary,
  },
});
