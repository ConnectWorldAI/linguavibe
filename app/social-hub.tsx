import { useState } from "react";
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
import { Colors, Spacing, BorderRadius, FontSize } from "../constants/Colors";

type SocialTab = "feed" | "messages" | "groups";

type FeedItem = {
  id: string;
  user: string;
  avatar: string;
  action: string;
  detail: string;
  time: string;
  likes: number;
  liked: boolean;
  type: "achievement" | "streak" | "course" | "challenge";
};

type MessageThread = {
  id: string;
  name: string;
  avatar: string;
  lastMessage: string;
  time: string;
  unread: number;
  online: boolean;
};

type StudyGroup = {
  id: string;
  name: string;
  members: number;
  language: string;
  flag: string;
  activity: string;
  joined: boolean;
};

const FEED_ITEMS: FeedItem[] = [
  { id: "1", user: "Maria G.", avatar: "🇲🇽", action: "completed", detail: "Advanced Spanish Conversation", time: "2h ago", likes: 12, liked: false, type: "course" },
  { id: "2", user: "James K.", avatar: "🇺🇸", action: "reached", detail: "30-day streak! 🔥", time: "3h ago", likes: 24, liked: true, type: "streak" },
  { id: "3", user: "Yuki T.", avatar: "🇯🇵", action: "earned", detail: "Perfect Score badge", time: "5h ago", likes: 8, liked: false, type: "achievement" },
  { id: "4", user: "Carlos R.", avatar: "🇩🇴", action: "started", detail: "7-day Speaking Challenge", time: "6h ago", likes: 5, liked: false, type: "challenge" },
  { id: "5", user: "Sophie L.", avatar: "🇫🇷", action: "completed", detail: "French Business Writing", time: "8h ago", likes: 15, liked: false, type: "course" },
  { id: "6", user: "Min-Jun P.", avatar: "🇰🇷", action: "reached", detail: "Level 5 in Korean!", time: "12h ago", likes: 31, liked: true, type: "achievement" },
];

const MESSAGES: MessageThread[] = [
  { id: "1", name: "Maria G.", avatar: "🇲🇽", lastMessage: "Want to practice Spanish tomorrow?", time: "10m", unread: 2, online: true },
  { id: "2", name: "Study Group: DOM Spanish", avatar: "🇩🇴", lastMessage: "Carlos: Great session today!", time: "1h", unread: 5, online: false },
  { id: "3", name: "James K.", avatar: "🇺🇸", lastMessage: "Thanks for the tip!", time: "3h", unread: 0, online: true },
  { id: "4", name: "Instructor: Prof. Rivera", avatar: "👨‍🏫", lastMessage: "Your homework looks great", time: "1d", unread: 1, online: false },
  { id: "5", name: "Sophie L.", avatar: "🇫🇷", lastMessage: "Bonjour! How's your French?", time: "2d", unread: 0, online: false },
];

const STUDY_GROUPS: StudyGroup[] = [
  { id: "1", name: "Dominican Spanish Speakers", members: 128, language: "Spanish", flag: "🇩🇴", activity: "Active now", joined: true },
  { id: "2", name: "Business English Pros", members: 256, language: "English", flag: "🇺🇸", activity: "3 online", joined: true },
  { id: "3", name: "K-Pop Korean Learners", members: 512, language: "Korean", flag: "🇰🇷", activity: "15 online", joined: false },
  { id: "4", name: "French Conversation Club", members: 89, language: "French", flag: "🇫🇷", activity: "2 online", joined: false },
  { id: "5", name: "Japanese Anime Vocab", members: 341, language: "Japanese", flag: "🇯🇵", activity: "8 online", joined: false },
  { id: "6", name: "Tech Spanish for Devs", members: 67, language: "Spanish", flag: "🇪🇸", activity: "Active 2h ago", joined: false },
];

export default function SocialHubScreen() {
  const [tab, setTab] = useState<SocialTab>("feed");
  const [feed, setFeed] = useState(FEED_ITEMS);
  const [groups, setGroups] = useState(STUDY_GROUPS);

  const handleLike = (id: string) => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setFeed((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, liked: !item.liked, likes: item.liked ? item.likes - 1 : item.likes + 1 }
          : item
      )
    );
  };

  const handleShare = async (item: FeedItem) => {
    try {
      await Share.share({
        message: `${item.user} just ${item.action} ${item.detail} on ConnectWorld AI! 🎉 Join me in learning languages.`,
      });
    } catch {}
  };

  const handleJoinGroup = (id: string) => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setGroups((prev) =>
      prev.map((g) => (g.id === id ? { ...g, joined: !g.joined, members: g.joined ? g.members - 1 : g.members + 1 } : g))
    );
  };

  const getTypeColor = (type: FeedItem["type"]) => {
    switch (type) {
      case "achievement": return Colors.gold;
      case "streak": return Colors.accent;
      case "course": return Colors.secondary;
      case "challenge": return Colors.success;
    }
  };

  const renderFeedItem = ({ item }: { item: FeedItem }) => (
    <View style={styles.feedCard}>
      <View style={styles.feedHeader}>
        <View style={styles.feedAvatar}>
          <Text style={styles.feedAvatarText}>{item.avatar}</Text>
        </View>
        <View style={styles.feedInfo}>
          <Text style={styles.feedUser}>{item.user}</Text>
          <Text style={styles.feedTime}>{item.time}</Text>
        </View>
        <View style={[styles.typeBadge, { backgroundColor: getTypeColor(item.type) + "20" }]}>
          <Text style={[styles.typeBadgeText, { color: getTypeColor(item.type) }]}>
            {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
          </Text>
        </View>
      </View>
      <Text style={styles.feedAction}>
        <Text style={styles.feedActionVerb}>{item.action} </Text>
        {item.detail}
      </Text>
      <View style={styles.feedActions}>
        <TouchableOpacity style={styles.feedActionBtn} onPress={() => handleLike(item.id)}>
          <Ionicons name={item.liked ? "heart" : "heart-outline"} size={18} color={item.liked ? Colors.accent : Colors.textMuted} />
          <Text style={[styles.feedActionCount, item.liked && { color: Colors.accent }]}>{item.likes}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.feedActionBtn} onPress={() => handleShare(item)}>
          <Ionicons name="share-outline" size={18} color={Colors.textMuted} />
          <Text style={styles.feedActionCount}>Share</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.feedActionBtn}>
          <Ionicons name="chatbubble-outline" size={16} color={Colors.textMuted} />
          <Text style={styles.feedActionCount}>Comment</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderMessage = ({ item }: { item: MessageThread }) => (
    <TouchableOpacity style={styles.messageCard}>
      <View style={styles.messageAvatarWrap}>
        <Text style={styles.messageAvatar}>{item.avatar}</Text>
        {item.online && <View style={styles.onlineDot} />}
      </View>
      <View style={styles.messageInfo}>
        <Text style={styles.messageName}>{item.name}</Text>
        <Text style={styles.messagePreview} numberOfLines={1}>{item.lastMessage}</Text>
      </View>
      <View style={styles.messageRight}>
        <Text style={styles.messageTime}>{item.time}</Text>
        {item.unread > 0 && (
          <View style={styles.unreadBadge}>
            <Text style={styles.unreadText}>{item.unread}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderGroup = ({ item }: { item: StudyGroup }) => (
    <View style={styles.groupCard}>
      <View style={styles.groupLeft}>
        <Text style={styles.groupFlag}>{item.flag}</Text>
        <View style={styles.groupInfo}>
          <Text style={styles.groupName}>{item.name}</Text>
          <Text style={styles.groupMeta}>{item.members} members • {item.activity}</Text>
        </View>
      </View>
      <TouchableOpacity
        style={[styles.joinBtn, item.joined && styles.joinedBtn]}
        onPress={() => handleJoinGroup(item.id)}
      >
        <Text style={[styles.joinBtnText, item.joined && styles.joinedBtnText]}>
          {item.joined ? "Joined" : "Join"}
        </Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Social</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => router.push("/connections" as any)}>
          <Ionicons name="person-add" size={18} color={Colors.secondary} />
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        {(["feed", "messages", "groups"] as SocialTab[]).map((t) => (
          <TouchableOpacity
            key={t}
            style={[styles.tab, tab === t && styles.tabActive]}
            onPress={() => setTab(t)}
          >
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
              {t === "feed" ? "Feed" : t === "messages" ? "Messages" : "Groups"}
            </Text>
            {t === "messages" && MESSAGES.filter((m) => m.unread > 0).length > 0 && (
              <View style={styles.tabBadge}>
                <Text style={styles.tabBadgeText}>{MESSAGES.reduce((a, m) => a + m.unread, 0)}</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      {tab === "feed" && (
        <FlatList
          data={feed}
          keyExtractor={(item) => item.id}
          renderItem={renderFeedItem}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        />
      )}

      {tab === "messages" && (
        <FlatList
          data={MESSAGES}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={() => <View style={{ height: 2 }} />}
        />
      )}

      {tab === "groups" && (
        <FlatList
          data={groups}
          keyExtractor={(item) => item.id}
          renderItem={renderGroup}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
          ListHeaderComponent={
            <Text style={styles.groupsHeader}>Find your community and learn together</Text>
          }
          ListFooterComponent={
            <View>
              <TouchableOpacity
                style={styles.browseAllBtn}
                onPress={() => router.push("/study-groups" as any)}
              >
                <Ionicons name="search" size={16} color={Colors.secondary} />
                <Text style={styles.browseAllText}>Browse All Study Groups</Text>
                <Ionicons name="chevron-forward" size={14} color={Colors.secondary} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.browseAllBtn, { marginTop: 8, borderColor: Colors.goldBorder }]}
                onPress={() => router.push("/study-buddy" as any)}
              >
                <Ionicons name="people" size={16} color={Colors.gold} />
                <Text style={[styles.browseAllText, { color: Colors.gold }]}>Find a Study Buddy</Text>
                <Ionicons name="chevron-forward" size={14} color={Colors.gold} />
              </TouchableOpacity>
            </View>
          }
        />
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
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surfaceCard,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  headerTitle: {
    fontSize: FontSize.xl,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  addBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.secondary + "15",
    alignItems: "center",
    justifyContent: "center",
  },
  tabs: {
    flexDirection: "row",
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    backgroundColor: Colors.surfaceCard,
    borderRadius: BorderRadius.lg,
    padding: 4,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: BorderRadius.md,
  },
  tabActive: {
    backgroundColor: Colors.secondary + "20",
  },
  tabText: {
    fontSize: FontSize.sm,
    fontWeight: "600",
    color: Colors.textSecondary,
  },
  tabTextActive: {
    color: Colors.secondary,
  },
  tabBadge: {
    backgroundColor: Colors.accent,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  tabBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#fff",
  },
  listContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: 100,
  },
  // Feed
  feedCard: {
    backgroundColor: Colors.surfaceCard,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  feedHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  feedAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  feedAvatarText: {
    fontSize: 18,
  },
  feedInfo: {
    flex: 1,
    marginLeft: 10,
  },
  feedUser: {
    fontSize: FontSize.sm,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  feedTime: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  typeBadgeText: {
    fontSize: 10,
    fontWeight: "700",
  },
  feedAction: {
    fontSize: FontSize.md,
    color: Colors.textPrimary,
    lineHeight: 22,
    marginBottom: 12,
  },
  feedActionVerb: {
    color: Colors.textSecondary,
  },
  feedActions: {
    flexDirection: "row",
    gap: 20,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: 10,
  },
  feedActionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  feedActionCount: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
  },
  // Messages
  messageCard: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  messageAvatarWrap: {
    position: "relative",
  },
  messageAvatar: {
    fontSize: 28,
    width: 44,
    height: 44,
    textAlign: "center",
    lineHeight: 44,
    backgroundColor: Colors.primary,
    borderRadius: 22,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: Colors.border,
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
  messageInfo: {
    flex: 1,
    marginLeft: 12,
    gap: 2,
  },
  messageName: {
    fontSize: FontSize.sm,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  messagePreview: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
  },
  messageRight: {
    alignItems: "flex-end",
    gap: 4,
  },
  messageTime: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
  },
  unreadBadge: {
    backgroundColor: Colors.secondary,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
  },
  unreadText: {
    fontSize: 11,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  // Groups
  groupsHeader: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginBottom: 12,
  },
  groupCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Colors.surfaceCard,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  groupLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 12,
  },
  groupFlag: {
    fontSize: 28,
  },
  groupInfo: {
    flex: 1,
  },
  groupName: {
    fontSize: FontSize.sm,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  groupMeta: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  joinBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.secondary,
  },
  joinedBtn: {
    backgroundColor: Colors.secondary + "20",
    borderWidth: 1,
    borderColor: Colors.glowBorder,
  },
  joinBtnText: {
    fontSize: FontSize.sm,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  joinedBtnText: {
    color: Colors.secondary,
  },
  browseAllBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 16,
    paddingVertical: 14,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.glowBorder,
    backgroundColor: Colors.secondary + "08",
  },
  browseAllText: {
    fontSize: FontSize.sm,
    fontWeight: "700",
    color: Colors.secondary,
  },
});
