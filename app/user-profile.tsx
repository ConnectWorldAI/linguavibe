import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Platform,
  Dimensions,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import * as Haptics from "expo-haptics";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { trpc } from "@/lib/trpc";

const { width } = Dimensions.get("window");
const GRID_SIZE = (width - 48) / 3;

type ProfileTab = "posts" | "music" | "certifications";

type Post = {
  id: string;
  type: "photo" | "video" | "cover";
  color: string;
  likes: number;
};

type Certification = {
  id: string;
  title: string;
  issuer: string;
  date: string;
  level: string;
};

const MOCK_USER = {
  name: "Isabella Rodríguez",
  username: "@isabella_r",
  avatar: "🧑‍🎓",
  coverColor: "#1a1a2e",
  headline: "Spanish Teacher | Bilingual Educator | B2 French",
  location: "Santo Domingo, DR 🇩🇴",
  bio: "Passionate about helping English speakers master Dominican Spanish. 5+ years teaching experience. Love music, travel, and connecting cultures through language.",
  stats: {
    followers: 2847,
    following: 412,
    connections: 156,
    posts: 89,
  },
  languages: [
    { name: "Spanish", level: "Native", flag: "🇩🇴" },
    { name: "English", level: "C1", flag: "🇺🇸" },
    { name: "French", level: "B2", flag: "🇫🇷" },
  ],
  badges: ["Verified Teacher", "Top Rated", "500+ Sessions"],
  isFollowing: false,
  isConnected: false,
  mutualConnections: 12,
};

const MOCK_POSTS: Post[] = Array.from({ length: 12 }, (_, i) => ({
  id: `post-${i}`,
  type: i % 4 === 0 ? "video" : i % 3 === 0 ? "cover" : "photo",
  color: ["#6C5CE7", "#00B894", "#E17055", "#0984E3", "#FDCB6E", "#A29BFE"][i % 6],
  likes: Math.floor(Math.random() * 200) + 10,
}));

const MOCK_CERTS: Certification[] = [
  { id: "1", title: "DELE C2 Spanish", issuer: "Instituto Cervantes", date: "2023", level: "Native" },
  { id: "2", title: "DELF B2 French", issuer: "Alliance Française", date: "2024", level: "Advanced" },
  { id: "3", title: "TEFL Certification", issuer: "Cambridge", date: "2021", level: "Professional" },
];

export default function UserProfileScreen() {
  const colors = useColors();
  const params = useLocalSearchParams<{ userId?: string; name?: string }>();
  const [activeTab, setActiveTab] = useState<ProfileTab>("posts");
  const [user, setUser] = useState(MOCK_USER);
  const [posts, setPosts] = useState(MOCK_POSTS);
  const [certs, setCerts] = useState(MOCK_CERTS);
  const [isFollowing, setIsFollowing] = useState(MOCK_USER.isFollowing);
  const [isConnected, setIsConnected] = useState(MOCK_USER.isConnected);

  // Load real profile data from AsyncStorage
  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(`@user_profile_${params.userId || 'default'}`);
        if (stored) {
          const data = JSON.parse(stored);
          if (data.user) setUser(data.user);
          if (data.posts) setPosts(data.posts);
          if (data.certs) setCerts(data.certs);
          if (data.user?.isFollowing !== undefined) setIsFollowing(data.user.isFollowing);
          if (data.user?.isConnected !== undefined) setIsConnected(data.user.isConnected);
        }
      } catch {}
    })();
  }, []);

  const handleFollow = () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsFollowing(!isFollowing);
  };

  const handleConnect = () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsConnected(!isConnected);
  };

  const handleMessage = () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push("/message-compose");
  };

  const isVisitorPreview = params.userId === "self";

  const handleMoreMenu = () => {
    if (isVisitorPreview) return;
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Alert.alert(
      user.displayName || user.username,
      "Choose an action",
      [
        {
          text: "Report User",
          onPress: () => {
            Alert.alert("Report Submitted", "Thank you. Our team will review this profile within 24 hours.");
          },
        },
        {
          text: "Block User",
          style: "destructive",
          onPress: () => handleBlockUser(),
        },
        { text: "Cancel", style: "cancel" },
      ]
    );
  };

  const handleBlockUser = () => {
    const displayName = user.displayName || user.username;
    Alert.alert(
      `Block ${displayName}?`,
      "They won't be able to see your profile, send you messages, or appear in your connections. You can unblock them later in Privacy Settings.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Block",
          style: "destructive",
          onPress: async () => {
            try {
              const existing = await AsyncStorage.getItem("@linguavibe_blocked_users");
              const blocked = existing ? JSON.parse(existing) : [];
              blocked.push({
                id: params.userId || "unknown",
                name: displayName,
                username: user.username,
                avatar: null,
                blockedAt: new Date().toISOString(),
                reason: "Blocked from profile",
              });
              await AsyncStorage.setItem("@linguavibe_blocked_users", JSON.stringify(blocked));
              if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              Alert.alert("Blocked", `${displayName} has been blocked.`, [
                { text: "OK", onPress: () => router.back() },
              ]);
            } catch {}
          },
        },
      ]
    );
  };

  const formatCount = (n: number) => (n >= 1000 ? `${(n / 1000).toFixed(1)}K` : `${n}`);

  const renderPostGrid = () => (
    <View style={styles.grid}>
      {posts.map((post) => (
        <TouchableOpacity key={post.id} style={[styles.gridItem, { backgroundColor: post.color + "30" }]} activeOpacity={0.7}>
          <View style={[styles.gridItemInner, { backgroundColor: post.color + "50" }]}>
            {post.type === "video" && <Ionicons name="play-circle" size={24} color="#FFFFFF" />}
            {post.type === "cover" && <Ionicons name="musical-notes" size={24} color="#FFFFFF" />}
            {post.type === "photo" && <Ionicons name="image" size={20} color="#FFFFFF80" />}
          </View>
          <View style={styles.gridLikes}>
            <Ionicons name="heart" size={10} color="#FFFFFF" />
            <Text style={styles.gridLikesText}>{post.likes}</Text>
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderCertifications = () => (
    <View style={styles.certList}>
      {certs.map((cert) => (
        <View key={cert.id} style={[styles.certCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={[styles.certIcon, { backgroundColor: "#6C5CE720" }]}>
            <Ionicons name="ribbon-outline" size={20} color="#6C5CE7" />
          </View>
          <View style={styles.certInfo}>
            <Text style={[styles.certTitle, { color: colors.foreground }]}>{cert.title}</Text>
            <Text style={[styles.certIssuer, { color: colors.muted }]}>{cert.issuer} · {cert.date}</Text>
          </View>
          <View style={[styles.certLevel, { backgroundColor: "#4ADE8020" }]}>
            <Text style={styles.certLevelText}>{cert.level}</Text>
          </View>
        </View>
      ))}
    </View>
  );

  const renderMusicCovers = () => (
    <View style={styles.musicList}>
      {["Despacito (Spanish Cover)", "Bésame Mucho (Live)", "La Bamba (Acoustic)"].map((title, i) => (
        <TouchableOpacity key={i} style={[styles.musicCard, { backgroundColor: colors.surface, borderColor: colors.border }]} activeOpacity={0.7}>
          <View style={[styles.musicThumb, { backgroundColor: ["#E17055", "#6C5CE7", "#00B894"][i] + "30" }]}>
            <Ionicons name="musical-notes" size={20} color={["#E17055", "#6C5CE7", "#00B894"][i]} />
          </View>
          <View style={styles.musicInfo}>
            <Text style={[styles.musicTitle, { color: colors.foreground }]}>{title}</Text>
            <Text style={[styles.musicMeta, { color: colors.muted }]}>{Math.floor(Math.random() * 500) + 50} plays · {Math.floor(Math.random() * 30) + 5} likes</Text>
          </View>
          <TouchableOpacity style={styles.playBtn}>
            <Ionicons name="play-circle" size={32} color={colors.primary} />
          </TouchableOpacity>
        </TouchableOpacity>
      ))}
    </View>
  );

  return (
    <ScreenContainer edges={["top", "left", "right"]}>
      {/* Visitor Preview Banner */}
      {isVisitorPreview && (
        <View style={{ backgroundColor: "#6C5CE720", paddingVertical: 8, paddingHorizontal: 16, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 }}>
          <Ionicons name="eye" size={16} color="#6C5CE7" />
          <Text style={{ fontSize: 13, fontWeight: "600", color: "#6C5CE7" }}>Viewing as visitor</Text>
          <TouchableOpacity onPress={() => router.back()} style={{ marginLeft: 12, backgroundColor: "#6C5CE730", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 }}>
            <Text style={{ fontSize: 11, fontWeight: "700", color: "#6C5CE7" }}>Exit</Text>
          </TouchableOpacity>
        </View>
      )}
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>{params.name || user.username}</Text>
        <TouchableOpacity style={styles.moreBtn} onPress={handleMoreMenu}>
          <Ionicons name="ellipsis-horizontal" size={22} color={colors.foreground} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarRow}>
            <View style={[styles.avatar, { backgroundColor: "#6C5CE720" }]}>
              <Text style={styles.avatarText}>{user.avatar}</Text>
              <View style={[styles.verifiedBadge, { backgroundColor: colors.primary }]}>
                <Ionicons name="checkmark" size={10} color="#FFFFFF" />
              </View>
            </View>
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={[styles.statNumber, { color: colors.foreground }]}>{formatCount(user.stats.posts)}</Text>
                <Text style={[styles.statLabel, { color: colors.muted }]}>Posts</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statNumber, { color: colors.foreground }]}>{formatCount(user.stats.followers)}</Text>
                <Text style={[styles.statLabel, { color: colors.muted }]}>Followers</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statNumber, { color: colors.foreground }]}>{formatCount(user.stats.following)}</Text>
                <Text style={[styles.statLabel, { color: colors.muted }]}>Following</Text>
              </View>
            </View>
          </View>

          <Text style={[styles.name, { color: colors.foreground }]}>{user.name}</Text>
          <Text style={[styles.headline, { color: colors.muted }]}>{user.headline}</Text>
          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={14} color={colors.muted} />
            <Text style={[styles.location, { color: colors.muted }]}>{user.location}</Text>
          </View>

          {/* Badges */}
          <View style={styles.badgesRow}>
            {user.badges.map((badge, i) => (
              <View key={i} style={[styles.badgeChip, { backgroundColor: colors.primary + "15", borderColor: colors.primary + "30" }]}>
                <Ionicons name="star" size={10} color={colors.primary} />
                <Text style={[styles.badgeText, { color: colors.primary }]}>{badge}</Text>
              </View>
            ))}
          </View>

          {/* Bio */}
          <Text style={[styles.bio, { color: colors.foreground }]}>{user.bio}</Text>

          {/* Mutual Connections */}
          <View style={styles.mutualRow}>
            <View style={styles.mutualAvatars}>
              {["🧑", "👩", "👨"].map((e, i) => (
                <View key={i} style={[styles.mutualAvatar, { backgroundColor: colors.surface, marginLeft: i > 0 ? -8 : 0 }]}>
                  <Text style={{ fontSize: 12 }}>{e}</Text>
                </View>
              ))}
            </View>
            <Text style={[styles.mutualText, { color: colors.muted }]}>
              {user.mutualConnections} mutual connections
            </Text>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={[styles.followBtn, { backgroundColor: isFollowing ? colors.surface : colors.primary, borderColor: isFollowing ? colors.border : colors.primary }]}
              onPress={handleFollow}
            >
              <Ionicons name={isFollowing ? "checkmark" : "person-add-outline"} size={16} color={isFollowing ? colors.foreground : "#FFFFFF"} />
              <Text style={[styles.followBtnText, { color: isFollowing ? colors.foreground : "#FFFFFF" }]}>
                {isFollowing ? "Following" : "Follow"}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.connectBtn, { backgroundColor: isConnected ? "#4ADE8015" : "#6C5CE715", borderColor: isConnected ? "#4ADE8030" : "#6C5CE730" }]}
              onPress={handleConnect}
            >
              <Ionicons name={isConnected ? "link" : "link-outline"} size={16} color={isConnected ? "#4ADE80" : "#6C5CE7"} />
              <Text style={[styles.connectBtnText, { color: isConnected ? "#4ADE80" : "#6C5CE7" }]}>
                {isConnected ? "Connected" : "Connect"}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.msgBtn, { backgroundColor: colors.surface, borderColor: colors.border }]} onPress={handleMessage}>
              <Ionicons name="chatbubble-outline" size={16} color={colors.foreground} />
            </TouchableOpacity>
          </View>

          {/* Languages */}
          <View style={styles.languagesSection}>
            <Text style={[styles.langLabel, { color: colors.muted }]}>Languages</Text>
            <View style={styles.langRow}>
              {user.languages.map((lang, i) => (
                <View key={i} style={[styles.langChip, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <Text style={styles.langFlag}>{lang.flag}</Text>
                  <Text style={[styles.langName, { color: colors.foreground }]}>{lang.name}</Text>
                  <Text style={[styles.langLevel, { color: colors.muted }]}>{lang.level}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* Tab Bar */}
        <View style={[styles.tabBar, { borderBottomColor: colors.border }]}>
          {([
            { key: "posts", icon: "grid-outline", label: "Posts" },
            { key: "music", icon: "musical-notes-outline", label: "Music" },
            { key: "certifications", icon: "ribbon-outline", label: "Certs" },
          ] as const).map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tab, activeTab === tab.key && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
              onPress={() => setActiveTab(tab.key)}
            >
              <Ionicons name={tab.icon as any} size={20} color={activeTab === tab.key ? colors.primary : colors.muted} />
              <Text style={[styles.tabLabel, { color: activeTab === tab.key ? colors.primary : colors.muted }]}>{tab.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Tab Content */}
        {activeTab === "posts" && renderPostGrid()}
        {activeTab === "music" && renderMusicCovers()}
        {activeTab === "certifications" && renderCertifications()}

        <View style={{ height: 40 }} />
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 0.5 },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 16, fontWeight: "700" },
  moreBtn: { padding: 4 },
  content: { flex: 1 },
  contentContainer: {},
  profileHeader: { padding: 16 },
  avatarRow: { flexDirection: "row", alignItems: "center", gap: 20 },
  avatar: { width: 80, height: 80, borderRadius: 40, alignItems: "center", justifyContent: "center" },
  avatarText: { fontSize: 36 },
  verifiedBadge: { position: "absolute", bottom: 2, right: 2, width: 18, height: 18, borderRadius: 9, alignItems: "center", justifyContent: "center" },
  statsRow: { flex: 1, flexDirection: "row", justifyContent: "space-around" },
  statItem: { alignItems: "center" },
  statNumber: { fontSize: 18, fontWeight: "800" },
  statLabel: { fontSize: 12, marginTop: 2 },
  name: { fontSize: 18, fontWeight: "700", marginTop: 14 },
  headline: { fontSize: 14, marginTop: 4 },
  locationRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 6 },
  location: { fontSize: 13 },
  badgesRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 10 },
  badgeChip: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, borderWidth: 1 },
  badgeText: { fontSize: 11, fontWeight: "600" },
  bio: { fontSize: 14, lineHeight: 20, marginTop: 12 },
  mutualRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 12 },
  mutualAvatars: { flexDirection: "row" },
  mutualAvatar: { width: 24, height: 24, borderRadius: 12, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "#00000020" },
  mutualText: { fontSize: 12 },
  actionsRow: { flexDirection: "row", gap: 8, marginTop: 16 },
  followBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 10, borderRadius: 10, borderWidth: 1 },
  followBtnText: { fontSize: 14, fontWeight: "700" },
  connectBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 10, borderRadius: 10, borderWidth: 1 },
  connectBtnText: { fontSize: 14, fontWeight: "700" },
  msgBtn: { width: 42, alignItems: "center", justifyContent: "center", borderRadius: 10, borderWidth: 1 },
  languagesSection: { marginTop: 16 },
  langLabel: { fontSize: 12, fontWeight: "600", marginBottom: 8 },
  langRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  langChip: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1 },
  langFlag: { fontSize: 14 },
  langName: { fontSize: 13, fontWeight: "600" },
  langLevel: { fontSize: 11 },
  tabBar: { flexDirection: "row", borderBottomWidth: 0.5 },
  tab: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 14 },
  tabLabel: { fontSize: 13, fontWeight: "600" },
  grid: { flexDirection: "row", flexWrap: "wrap", padding: 2 },
  gridItem: { width: GRID_SIZE, height: GRID_SIZE, margin: 1, borderRadius: 4, overflow: "hidden" },
  gridItemInner: { flex: 1, alignItems: "center", justifyContent: "center" },
  gridLikes: { position: "absolute", bottom: 4, left: 4, flexDirection: "row", alignItems: "center", gap: 2 },
  gridLikesText: { fontSize: 10, color: "#FFFFFF", fontWeight: "600" },
  certList: { padding: 16, gap: 10 },
  certCard: { flexDirection: "row", alignItems: "center", padding: 14, borderRadius: 12, borderWidth: 1 },
  certIcon: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center", marginRight: 12 },
  certInfo: { flex: 1 },
  certTitle: { fontSize: 14, fontWeight: "700" },
  certIssuer: { fontSize: 12, marginTop: 2 },
  certLevel: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  certLevelText: { fontSize: 11, fontWeight: "600", color: "#4ADE80" },
  musicList: { padding: 16, gap: 10 },
  musicCard: { flexDirection: "row", alignItems: "center", padding: 12, borderRadius: 12, borderWidth: 1 },
  musicThumb: { width: 48, height: 48, borderRadius: 10, alignItems: "center", justifyContent: "center", marginRight: 12 },
  musicInfo: { flex: 1 },
  musicTitle: { fontSize: 14, fontWeight: "600" },
  musicMeta: { fontSize: 12, marginTop: 2 },
  playBtn: { padding: 4 },
});
