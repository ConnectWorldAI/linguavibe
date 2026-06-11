import React, { useState, useCallback, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  ScrollView,
  Animated,
  Platform,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import * as Haptics from "expo-haptics";
import { Colors, Spacing, BorderRadius, FontSize } from "../../constants/Colors";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNotificationBadges } from "@/lib/notification-badges";
import { trpc } from "@/lib/trpc";
import { useI18n } from "@/lib/i18n";
import { BrandNameInline } from "@/components/brand-name";

// ─── TYPES ───────────────────────────────────────────────────────────────────
type FilterTab = "primary" | "general" | "requests";

type Conversation = {
  id: string;
  name: string;
  avatar: string;
  flag: string;
  lastMessage: string;
  lastMessageLang: string; // language code of last message
  time: string;
  unread: number;
  type: "teacher" | "person" | "group";
  language: string;
  online: boolean;
  verified: boolean;
  category: FilterTab;
  sharedContent?: { type: "reel" | "post" | "story"; text: string };
};

type RequestItem = {
  id: string;
  name: string;
  avatar: string;
  flag: string;
  message: string;
  messageLang: string;
  time: string;
  mutualConnections: number;
  language: string;
};

// ─── MOCK DATA ───────────────────────────────────────────────────────────────
const CONVERSATIONS: Conversation[] = [
  {
    id: "1", name: "Prof. Carlos", avatar: "👨🏽‍🏫", flag: "🇩🇴",
    lastMessage: "¡Excelente! Tu pronunciación mejoró mucho hoy 🎉",
    lastMessageLang: "es", time: "2m ago", unread: 2, type: "teacher",
    language: "Dominican Spanish", online: true, verified: true, category: "primary",
  },
  {
    id: "2", name: "Marie Dubois", avatar: "👩🏻", flag: "🇫🇷",
    lastMessage: "Oui! On se voit demain pour pratiquer?",
    lastMessageLang: "fr", time: "15m ago", unread: 1, type: "person",
    language: "French", online: true, verified: false, category: "primary",
  },
  {
    id: "3", name: "Sensei Kenji", avatar: "👨🏻‍🏫", flag: "🇯🇵",
    lastMessage: "今日のレッスンは文法についてです",
    lastMessageLang: "ja", time: "1h ago", unread: 0, type: "teacher",
    language: "Japanese", online: false, verified: true, category: "primary",
  },
  {
    id: "4", name: "Amara", avatar: "👩🏿", flag: "🇳🇬",
    lastMessage: "I sent you a voice note about Yoruba greetings!",
    lastMessageLang: "en", time: "3h ago", unread: 3, type: "person",
    language: "Yoruba", online: false, verified: false, category: "primary",
  },
  {
    id: "5", name: "Prof. Sofia", avatar: "👩🏽‍🏫", flag: "🇨🇴",
    lastMessage: "Remember: 'parcero' is Colombian slang for friend 🇨🇴",
    lastMessageLang: "en", time: "5h ago", unread: 0, type: "teacher",
    language: "Colombian Spanish", online: true, verified: true, category: "primary",
  },
  {
    id: "6", name: "DOM Spanish Group", avatar: "🇩🇴", flag: "🇩🇴",
    lastMessage: "Carlos: Manito, vamo' a practicar mañana",
    lastMessageLang: "es", time: "30m ago", unread: 5, type: "group",
    language: "Dominican Spanish", online: false, verified: false, category: "general",
  },
  {
    id: "7", name: "Liam", avatar: "👨🏼", flag: "🇩🇪",
    lastMessage: "Haha that meme about German compound words 😂",
    lastMessageLang: "en", time: "1d ago", unread: 0, type: "person",
    language: "German", online: false, verified: false, category: "general",
    sharedContent: { type: "reel", text: "Donaudampfschifffahrtsgesellschaft 🤯" },
  },
  {
    id: "8", name: "K-Pop Study Club", avatar: "🇰🇷", flag: "🇰🇷",
    lastMessage: "Min-Ji: 오늘 새로운 노래 배웠어요!",
    lastMessageLang: "ko", time: "2d ago", unread: 0, type: "group",
    language: "Korean", online: false, verified: false, category: "general",
  },
  {
    id: "9", name: "Wei Chen", avatar: "👨🏻", flag: "🇨🇳",
    lastMessage: "你好！我想练习中文对话",
    lastMessageLang: "zh", time: "4h ago", unread: 1, type: "person",
    language: "Mandarin", online: true, verified: false, category: "general",
  },
];

const REQUESTS: RequestItem[] = [
  {
    id: "r1", name: "Isabella R.", avatar: "👩🏽", flag: "🇻🇪",
    message: "Hola! Me encantaría practicar español contigo 🙌",
    messageLang: "es", time: "1h ago", mutualConnections: 3, language: "Venezuelan Spanish",
  },
  {
    id: "r2", name: "Takeshi M.", avatar: "👨🏻", flag: "🇯🇵",
    message: "英語を練習したいです。手伝ってくれますか？",
    messageLang: "ja", time: "4h ago", mutualConnections: 1, language: "Japanese",
  },
  {
    id: "r3", name: "Fatima A.", avatar: "👩🏽", flag: "🇲🇦",
    message: "Salut! Je cherche quelqu'un pour pratiquer le français",
    messageLang: "fr", time: "1d ago", mutualConnections: 0, language: "Moroccan French",
  },
];

// ─── SIMPLE MOCK TRANSLATIONS ────────────────────────────────────────────────
const TRANSLATIONS: Record<string, string> = {
  "¡Excelente! Tu pronunciación mejoró mucho hoy 🎉": "Excellent! Your pronunciation improved a lot today 🎉",
  "Oui! On se voit demain pour pratiquer?": "Yes! See you tomorrow to practice?",
  "今日のレッスンは文法についてです": "Today's lesson is about grammar",
  "Carlos: Manito, vamo' a practicar mañana": "Carlos: Bro, let's practice tomorrow",
  "Min-Ji: 오늘 새로운 노래 배웠어요!": "Min-Ji: I learned a new song today!",
  "你好！我想练习中文对话": "Hello! I want to practice Chinese conversation",
  "Hola! Me encantaría practicar español contigo 🙌": "Hi! I'd love to practice Spanish with you 🙌",
  "英語を練習したいです。手伝ってくれますか？": "I want to practice English. Can you help me?",
  "Salut! Je cherche quelqu'un pour pratiquer le français": "Hi! I'm looking for someone to practice French with",
  "Y yo odio pedirle a un hombre. Me gusta que el ho...": "And I hate asking a man. I like it when the man...",
  "Donaudampfschifffahrtsgesellschaft 🤯": "Danube steamship company 🤯",
};

function getTranslation(text: string): string {
  return TRANSLATIONS[text] || "Translation: " + text;
}

// ─── COMPONENT ───────────────────────────────────────────────────────────────
export default function MessagesScreen() {
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState<FilterTab>("primary");
  const [search, setSearch] = useState("");
  const [globalSearchMode, setGlobalSearchMode] = useState(false);
  const [globalSearchResults, setGlobalSearchResults] = useState<{ convId: string; convName: string; avatar: string; flag: string; matchedMessage: string; matchType: "name" | "message" }[]>([]);
  const [translatedIds, setTranslatedIds] = useState<Set<string>>(new Set());
  const [acceptedRequests, setAcceptedRequests] = useState<Set<string>>(new Set());
  const [smartReplies, setSmartReplies] = useState<Record<string, string[]>>({});
  const [loadingReplies, setLoadingReplies] = useState<Set<string>>(new Set());
  const [copiedReply, setCopiedReply] = useState<string | null>(null);
  const { clearBadge } = useNotificationBadges();
  const smartReplyMutation = trpc.translate.smartReply.useMutation();
  const [pinnedIds, setPinnedIds] = useState<Set<string>>(new Set());
  const swipeRefs = useRef<Record<string, Animated.Value>>({});

  // Load pinned conversations from AsyncStorage
  useEffect(() => {
    AsyncStorage.getItem("@pinned_conversations").then((data) => {
      if (data) setPinnedIds(new Set(JSON.parse(data)));
    });
  }, []);

  const togglePin = (id: string) => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setPinnedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      AsyncStorage.setItem("@pinned_conversations", JSON.stringify([...next]));
      return next;
    });
  };

  const getSwipeAnim = (id: string) => {
    if (!swipeRefs.current[id]) {
      swipeRefs.current[id] = new Animated.Value(0);
    }
    return swipeRefs.current[id];
  };

  useFocusEffect(
    useCallback(() => {
      clearBadge("messages");
    }, [clearBadge])
  );

  const handleTranslate = (id: string, message?: string, lang?: string) => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setTranslatedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else {
        next.add(id);
        // Load smart replies when translating
        if (message && lang && lang !== "en" && !smartReplies[id]) {
          loadSmartReplies(id, message, lang);
        }
      }
      return next;
    });
  };

  const loadSmartReplies = async (id: string, originalMessage: string, fromLanguage: string) => {
    setLoadingReplies((prev) => new Set(prev).add(id));
    try {
      const result = await smartReplyMutation.mutateAsync({
        originalText: originalMessage,
        translatedText: getTranslation(originalMessage),
        fromLanguage,
        toLanguage: "English",
        tone: "casual",
      });
      if (result.success && result.replies) {
        setSmartReplies((prev) => ({ ...prev, [id]: result.replies }));
      }
    } catch (e) {
      // Silently fail — smart replies are optional
    }
    setLoadingReplies((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  const handleCopyReply = async (reply: string) => {
    try {
      const Clipboard = await import("expo-clipboard");
      await Clipboard.setStringAsync(reply);
      setCopiedReply(reply);
      if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setTimeout(() => setCopiedReply(null), 2000);
    } catch (e) {}
  };

  const handleAcceptRequest = (id: string) => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setAcceptedRequests((prev) => new Set(prev).add(id));
  };

  // Global search across all conversations when search is active
  useEffect(() => {
    if (search.length >= 2) {
      setGlobalSearchMode(true);
      const q = search.toLowerCase();
      const results: typeof globalSearchResults = [];
      CONVERSATIONS.forEach((c) => {
        if (c.name.toLowerCase().includes(q)) {
          results.push({ convId: c.id, convName: c.name, avatar: c.avatar, flag: c.flag, matchedMessage: c.lastMessage, matchType: "name" });
        } else if (c.lastMessage.toLowerCase().includes(q)) {
          results.push({ convId: c.id, convName: c.name, avatar: c.avatar, flag: c.flag, matchedMessage: c.lastMessage, matchType: "message" });
        }
      });
      setGlobalSearchResults(results);
    } else {
      setGlobalSearchMode(false);
      setGlobalSearchResults([]);
    }
  }, [search]);

  const filteredConversations = CONVERSATIONS.filter((c) => {
    if (c.category !== activeTab) return false;
    if (search && !c.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  // Sort pinned conversations to top
  const sortedConversations = [...filteredConversations].sort((a, b) => {
    const aPinned = pinnedIds.has(a.id) ? 0 : 1;
    const bPinned = pinnedIds.has(b.id) ? 0 : 1;
    return aPinned - bPinned;
  });

  const getTabUnread = (tab: FilterTab) => {
    if (tab === "requests") return REQUESTS.length - acceptedRequests.size;
    return CONVERSATIONS.filter((c) => c.category === tab).reduce((sum, c) => sum + c.unread, 0);
  };

  // ─── RENDER CONVERSATION ────────────────────────────────────────────────────
  const renderConversation = ({ item }: { item: Conversation }) => {
    const isTranslated = translatedIds.has(item.id);
    const needsTranslation = item.lastMessageLang !== "en";
    const isPinned = pinnedIds.has(item.id);

    return (
      <View style={styles.swipeContainer}>
        {/* Swipe background - Pin action */}
        <View style={styles.swipeBackground}>
          <TouchableOpacity
            style={[styles.swipeAction, isPinned ? styles.swipeUnpin : styles.swipePin]}
            onPress={() => togglePin(item.id)}
          >
            <Ionicons name={isPinned ? "pin-outline" : "pin"} size={20} color="#FFFFFF" />
            <Text style={styles.swipeActionText}>{isPinned ? "Unpin" : "Pin"}</Text>
          </TouchableOpacity>
        </View>
      <TouchableOpacity
        style={[styles.conversationItem, isPinned && styles.conversationPinned]}
        activeOpacity={0.7}
        onLongPress={() => togglePin(item.id)}
        onPress={() => {
          if (item.type === "group") {
            router.push({
              pathname: "/group-chat",
              params: { groupId: item.id, groupName: item.name },
            } as any);
          } else {
            router.push({
              pathname: "/message-compose",
              params: {
                contactId: item.id,
                contactName: item.name,
                contactAvatar: item.avatar,
                contactType: item.type,
              },
            } as any);
          }
        }}
      >
        {isPinned && (
          <View style={styles.pinIndicator}>
            <Ionicons name="pin" size={10} color={Colors.gold} />
          </View>
        )}
        <View style={styles.avatarWrap}>
          <Text style={styles.avatar}>{item.avatar}</Text>
          <View style={[styles.presenceDotList, item.online ? styles.presenceDotOnline : styles.presenceDotOffline]} />
          <Text style={styles.flagBadge}>{item.flag}</Text>
        </View>
        <View style={styles.conversationContent}>
          <View style={styles.conversationHeader}>
            <View style={styles.nameRow}>
              <Text style={styles.conversationName}>{item.name}</Text>
              {item.verified && (
                <View style={styles.verifiedBadge}>
                  <Ionicons name="checkmark-circle" size={14} color={Colors.secondary} />
                </View>
              )}
            </View>
            <Text style={[styles.conversationTime, item.unread > 0 && { color: Colors.secondary }]}>
              {item.time}
            </Text>
          </View>

          {/* Message preview with tap-to-translate */}
          <TouchableOpacity
            style={styles.messagePreviewWrap}
            activeOpacity={0.7}
            onPress={() => needsTranslation && handleTranslate(item.id, item.lastMessage, item.lastMessageLang)}
            disabled={!needsTranslation}
          >
            <View style={styles.conversationFooter}>
              <Text style={styles.lastMessage} numberOfLines={1}>
                {item.lastMessage}
              </Text>
              {item.unread > 0 && (
                <View style={styles.unreadBadge}>
                  <Text style={styles.unreadText}>{item.unread}</Text>
                </View>
              )}
            </View>

            {/* Inline translation */}
            {isTranslated && (
              <View style={styles.translationRow}>
                <Ionicons name="language" size={12} color={Colors.secondary} />
                <Text style={styles.translationText}>
                  {getTranslation(item.lastMessage)}
                </Text>
              </View>
            )}

            {/* AI Smart Reply Chips */}
            {isTranslated && smartReplies[item.id] && (
              <View style={styles.smartReplyRow}>
                <Text style={styles.smartReplyLabel}>Quick reply:</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.smartReplyScroll}>
                  {smartReplies[item.id].map((reply, idx) => (
                    <TouchableOpacity
                      key={idx}
                      style={[styles.smartReplyChip, copiedReply === reply && styles.smartReplyChipCopied]}
                      onPress={() => handleCopyReply(reply)}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.smartReplyChipText, copiedReply === reply && { color: Colors.success }]}>
                        {copiedReply === reply ? "Copied!" : reply}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
            {isTranslated && loadingReplies.has(item.id) && (
              <View style={styles.smartReplyLoading}>
                <ActivityIndicator size="small" color={Colors.secondary} />
                <Text style={styles.smartReplyLoadingText}>Generating replies...</Text>
              </View>
            )}

            {/* Tap to translate hint */}
            {needsTranslation && !isTranslated && (
              <View style={styles.translateHint}>
                <Ionicons name="language-outline" size={10} color={Colors.textMuted} />
                <Text style={styles.translateHintText}>Tap to translate</Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Shared content indicator */}
          {item.sharedContent && (
            <View style={styles.sharedContentBadge}>
              <Ionicons
                name={item.sharedContent.type === "reel" ? "play-circle" : "image"}
                size={11}
                color={Colors.textAccent}
              />
              <Text style={styles.sharedContentText}>
                Shared a {item.sharedContent.type}
              </Text>
            </View>
          )}

          <Text style={styles.languageTag}>{item.language}</Text>
        </View>
      </TouchableOpacity>
      </View>
    );
  };

  // ─── RENDER REQUEST ─────────────────────────────────────────────────────────
  const renderRequest = ({ item }: { item: RequestItem }) => {
    const isAccepted = acceptedRequests.has(item.id);
    const isTranslated = translatedIds.has(item.id);
    const needsTranslation = item.messageLang !== "en";

    return (
      <View style={[styles.requestCard, isAccepted && styles.requestCardAccepted]}>
        <View style={styles.requestHeader}>
          <View style={styles.requestAvatarWrap}>
            <Text style={styles.requestAvatar}>{item.avatar}</Text>
            <Text style={styles.requestFlag}>{item.flag}</Text>
          </View>
          <View style={styles.requestInfo}>
            <Text style={styles.requestName}>{item.name}</Text>
            <Text style={styles.requestMeta}>
              {item.language} • {item.mutualConnections} mutual{item.mutualConnections !== 1 ? "s" : ""}
            </Text>
          </View>
          <Text style={styles.requestTime}>{item.time}</Text>
        </View>

        {/* Request message with tap-to-translate */}
        <TouchableOpacity
          style={styles.requestMessageWrap}
          activeOpacity={0.7}
          onPress={() => needsTranslation && handleTranslate(item.id)}
          disabled={!needsTranslation}
        >
          <Text style={styles.requestMessage}>"{item.message}"</Text>
          {isTranslated && (
            <View style={styles.translationRow}>
              <Ionicons name="language" size={12} color={Colors.secondary} />
              <Text style={styles.translationText}>{getTranslation(item.message)}</Text>
            </View>
          )}
          {needsTranslation && !isTranslated && (
            <View style={styles.translateHint}>
              <Ionicons name="language-outline" size={10} color={Colors.textMuted} />
              <Text style={styles.translateHintText}>Tap to translate</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Accept/Decline buttons */}
        {!isAccepted ? (
          <View style={styles.requestActions}>
            <TouchableOpacity
              style={styles.acceptBtn}
              onPress={() => handleAcceptRequest(item.id)}
            >
              <Ionicons name="checkmark" size={16} color="#FFFFFF" />
              <Text style={styles.acceptBtnText}>Accept</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.declineBtn}>
              <Ionicons name="close" size={16} color={Colors.textSecondary} />
              <Text style={styles.declineBtnText}>Decline</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.acceptedRow}>
            <Ionicons name="checkmark-circle" size={16} color={Colors.success} />
            <Text style={styles.acceptedText}>Connected! Start chatting →</Text>
          </View>
        )}
      </View>
    );
  };

  // ─── MAIN RENDER ────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>{t.messages}</Text>
          <Text style={styles.headerSubtitle}>
            {getTabUnread("primary") + getTabUnread("general") > 0
              ? `${getTabUnread("primary") + getTabUnread("general")} unread`
              : "All caught up ✓"}
          </Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.headerBtn} onPress={() => router.push("/stories" as any)}>
            <Ionicons name="add-circle-outline" size={22} color={Colors.secondary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerBtn}>
            <Ionicons name="create-outline" size={20} color={Colors.secondary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Voice Clone Memo Banner */}
      <TouchableOpacity style={styles.memoBanner} activeOpacity={0.8}>
        <View style={styles.memoBannerIcon}>
          <Ionicons name="mic" size={16} color={Colors.accent} />
        </View>
        <View style={styles.memoBannerContent}>
          <Text style={styles.memoBannerTitle}>Voice Clone Memo</Text>
          <Text style={styles.memoBannerDesc}>Send voice messages in your target language accent</Text>
        </View>
        <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
      </TouchableOpacity>
      {/* ConnectWorld AI Translator */}
      <TouchableOpacity style={styles.memoBanner} activeOpacity={0.8} onPress={() => router.push("/translation-hub" as any)}>
        <View style={[styles.memoBannerIcon, { backgroundColor: Colors.glowSubtle }]}>
          <Ionicons name="language" size={16} color={Colors.secondary} />
        </View>
        <View style={styles.memoBannerContent}>
          <Text style={styles.memoBannerTitle}><BrandNameInline /> Translator</Text>
          <Text style={styles.memoBannerDesc}>Translate messages instantly • Set as default</Text>
        </View>
        <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
      </TouchableOpacity>

      {/* Filter Tabs: Primary / General / Requests */}
      <View style={styles.filterRow}>
        {(["primary", "general", "requests"] as FilterTab[]).map((tab) => {
          const count = getTabUnread(tab);
          return (
            <TouchableOpacity
              key={tab}
              style={[styles.filterTab, activeTab === tab && styles.filterTabActive]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[styles.filterTabText, activeTab === tab && styles.filterTabTextActive]}>
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </Text>
              {count > 0 && (
                <View style={[styles.filterBadge, activeTab === tab && styles.filterBadgeActive]}>
                  <Text style={styles.filterBadgeText}>{count}</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Search (for Primary and General) */}
      {activeTab !== "requests" && (
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={16} color={Colors.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search conversations..."
            placeholderTextColor={Colors.textSecondary}
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch("")}>
              <Ionicons name="close-circle" size={16} color={Colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Stories Row (Primary tab only) */}
      {activeTab === "primary" && (
        <View style={styles.storiesRow}>
          <TouchableOpacity style={styles.myStoryBtn} onPress={() => router.push("/stories" as any)}>
            <View style={styles.myStoryAvatar}>
              <Ionicons name="add" size={18} color={Colors.secondary} />
            </View>
            <Text style={styles.storyLabel}>Your Story</Text>
          </TouchableOpacity>
          {["Prof. Carlos", "Marie", "Kenji", "Amara", "Sofia"].map((name, i) => (
            <TouchableOpacity key={i} style={styles.storyItem} onPress={() => router.push("/stories" as any)}>
              <View style={[styles.storyRing, i < 2 && styles.storyRingActive]}>
                <View style={styles.storyAvatarInner}>
                  <Text style={{ fontSize: 18 }}>
                    {["👨🏽‍🏫", "👩🏻", "👨🏻‍🏫", "👩🏿", "👩🏽‍🏫"][i]}
                  </Text>
                </View>
              </View>
              <Text style={styles.storyLabel} numberOfLines={1}>{name}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Feature Doorways (Primary tab only) */}
      {activeTab === "primary" && (
        <View style={styles.doorwayRow}>
          <TouchableOpacity style={styles.doorwayCard} onPress={() => router.push("/pen-pal" as any)}>
            <View style={[styles.doorwayIcon, { backgroundColor: "rgba(244, 114, 182, 0.12)", borderColor: "rgba(244, 114, 182, 0.40)" }]}>
              <Ionicons name="mail" size={18} color="#F472B6" />
            </View>
            <Text style={styles.doorwayLabel}>AI Pen Pal</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.doorwayCard}>
            <View style={[styles.doorwayIcon, { backgroundColor: "rgba(6, 182, 212, 0.12)", borderColor: "rgba(6, 182, 212, 0.40)" }]}>
              <Ionicons name="language" size={18} color="#06B6D4" />
            </View>
            <Text style={styles.doorwayLabel}>Translate</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.doorwayCard}>
            <View style={[styles.doorwayIcon, { backgroundColor: "rgba(245, 158, 11, 0.12)", borderColor: "rgba(245, 158, 11, 0.40)" }]}>
              <Ionicons name="swap-horizontal" size={18} color="#F59E0B" />
            </View>
            <Text style={styles.doorwayLabel}>Exchange</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Content */}
      {activeTab === "requests" ? (
        <FlatList
          data={REQUESTS}
          renderItem={renderRequest}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <Text style={styles.requestsHeader}>
              {REQUESTS.length - acceptedRequests.size} pending request{REQUESTS.length - acceptedRequests.size !== 1 ? "s" : ""}
            </Text>
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="people-outline" size={48} color={Colors.textSecondary} />
              <Text style={styles.emptyText}>No pending requests</Text>
            </View>
          }
        />
      ) : globalSearchMode ? (
        <FlatList
          data={globalSearchResults}
          keyExtractor={(item, idx) => `${item.convId}-${idx}`}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <Text style={styles.globalSearchHeader}>Results across all conversations ({globalSearchResults.length})</Text>
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="search-outline" size={48} color={Colors.textSecondary} />
              <Text style={styles.emptyText}>No matches found</Text>
              <Text style={styles.emptySubtext}>Try a different search term</Text>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.globalSearchRow}
              activeOpacity={0.7}
              onPress={() => router.push({ pathname: "/message-compose" as any, params: { contactName: item.convName } })}
            >
              <Text style={styles.globalSearchAvatar}>{item.avatar}</Text>
              <View style={styles.globalSearchContent}>
                <View style={styles.globalSearchNameRow}>
                  <Text style={styles.globalSearchName}>{item.convName}</Text>
                  <Text style={styles.globalSearchFlag}>{item.flag}</Text>
                  {item.matchType === "message" && (
                    <View style={styles.globalSearchBadge}>
                      <Text style={styles.globalSearchBadgeText}>Message</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.globalSearchMsg} numberOfLines={1}>{item.matchedMessage}</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={Colors.textSecondary} />
            </TouchableOpacity>
          )}
        />
      ) : (
        <FlatList
          data={sortedConversations}
          renderItem={renderConversation}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="chatbubbles-outline" size={48} color={Colors.textSecondary} />
              <Text style={styles.emptyText}>No conversations yet</Text>
              <Text style={styles.emptySubtext}>Start a chat with a teacher or language partner</Text>
            </View>
          }
        />
      )}

      {/* Quick Connect CTA */}
      <View style={styles.ctaContainer}>
        <TouchableOpacity
          style={styles.ctaButton}
          activeOpacity={0.8}
          onPress={() => router.push("/discover-people" as any)}
        >
          <Ionicons name="people" size={18} color="#FFFFFF" />
          <Text style={styles.ctaText}>Find Language Partners</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// ─── STYLES ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.sm,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: Colors.textPrimary,
  },
  headerSubtitle: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  headerActions: {
    flexDirection: "row",
    gap: 8,
  },
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surfaceCard,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  // Voice Clone Memo Banner
  memoBanner: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    backgroundColor: Colors.redGlow,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.redBorder,
    gap: 10,
  },
  memoBannerIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255, 45, 45, 0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  memoBannerContent: {
    flex: 1,
  },
  memoBannerTitle: {
    fontSize: FontSize.sm,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  memoBannerDesc: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  // Filter Tabs
  filterRow: {
    flexDirection: "row",
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
    gap: 6,
  },
  filterTab: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surfaceCard,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 6,
  },
  filterTabActive: {
    backgroundColor: Colors.glowSubtle,
    borderColor: Colors.secondary,
    shadowColor: Colors.glow,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 6,
  },
  filterTabText: {
    fontSize: FontSize.sm,
    fontWeight: "600",
    color: Colors.textSecondary,
  },
  filterTabTextActive: {
    color: Colors.secondary,
  },
  filterBadge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: Colors.accent,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 5,
  },
  filterBadgeActive: {
    backgroundColor: Colors.secondary,
    shadowColor: Colors.glow,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
    elevation: 4,
  },
  filterBadgeText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  // Search
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
    backgroundColor: Colors.surfaceCard,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: FontSize.sm,
    color: Colors.textPrimary,
  },
  // Stories
  storiesRow: {
    flexDirection: "row",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xs,
    gap: 12,
    marginBottom: Spacing.xs,
  },
  myStoryBtn: {
    alignItems: "center",
    gap: 4,
  },
  myStoryAvatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: Colors.surfaceCard,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: Colors.secondary,
    borderStyle: "dashed",
  },
  storyItem: {
    alignItems: "center",
    gap: 4,
  },
  storyRing: {
    width: 48,
    height: 48,
    borderRadius: 24,
    padding: 2,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  storyRingActive: {
    borderColor: Colors.secondary,
    shadowColor: Colors.glow,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 6,
    elevation: 4,
  },
  storyAvatarInner: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surfaceCard,
    alignItems: "center",
    justifyContent: "center",
  },
  storyLabel: {
    fontSize: 10,
    color: Colors.textSecondary,
    maxWidth: 50,
    textAlign: "center",
  },
  // Doorways
  doorwayRow: {
    flexDirection: "row",
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
    gap: 10,
  },
  doorwayCard: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 12,
    backgroundColor: Colors.surfaceCard,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  doorwayIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 5,
    borderWidth: 1,
  },
  doorwayLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: Colors.textSecondary,
  },
  // Conversations
  listContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: 100,
  },
  conversationItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: Spacing.md,
    gap: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.border,
  },
  avatarWrap: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.surfaceCard,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: Colors.border,
    position: "relative",
  },
  avatar: {
    fontSize: 22,
  },
  onlineDot: {
    position: "absolute",
    bottom: 1,
    right: 1,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.success,
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  flagBadge: {
    position: "absolute",
    top: -3,
    right: -3,
    fontSize: 11,
  },
  conversationContent: {
    flex: 1,
  },
  conversationHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  conversationName: {
    fontSize: FontSize.md,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  verifiedBadge: {
    marginLeft: 2,
  },
  conversationTime: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  messagePreviewWrap: {
    marginTop: 3,
  },
  conversationFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  lastMessage: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    flex: 1,
    marginRight: 8,
  },
  unreadBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.secondary,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
    shadowColor: Colors.glow,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
    elevation: 6,
  },
  unreadText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  // Tap-to-translate
  translationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: Colors.glowSubtle,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.glowBorder,
  },
  translationText: {
    fontSize: 12,
    color: Colors.secondary,
    fontStyle: "italic",
    flex: 1,
  },
  translateHint: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    marginTop: 3,
  },
  translateHintText: {
    fontSize: 10,
    color: Colors.textMuted,
  },
  // Shared content
  sharedContentBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 3,
  },
  sharedContentText: {
    fontSize: 10,
    color: Colors.textAccent,
    fontWeight: "500",
  },
  languageTag: {
    fontSize: 10,
    color: Colors.textAccent,
    marginTop: 3,
    fontWeight: "500",
  },
  // Requests
  requestsHeader: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontWeight: "600",
    marginBottom: Spacing.md,
  },
  requestCard: {
    backgroundColor: Colors.surfaceCard,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  requestCardAccepted: {
    borderColor: Colors.greenBorder,
    backgroundColor: Colors.greenGlow,
  },
  requestHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  requestAvatarWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  requestAvatar: {
    fontSize: 20,
  },
  requestFlag: {
    position: "absolute",
    bottom: -2,
    right: -2,
    fontSize: 10,
  },
  requestInfo: {
    flex: 1,
    marginLeft: 10,
  },
  requestName: {
    fontSize: FontSize.md,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  requestMeta: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  requestTime: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  requestMessageWrap: {
    marginBottom: 12,
  },
  requestMessage: {
    fontSize: FontSize.sm,
    color: Colors.textPrimary,
    fontStyle: "italic",
    lineHeight: 20,
  },
  requestActions: {
    flexDirection: "row",
    gap: 10,
  },
  acceptBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    backgroundColor: Colors.secondary,
    borderRadius: BorderRadius.md,
    shadowColor: Colors.glow,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 6,
  },
  acceptBtnText: {
    fontSize: FontSize.sm,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  declineBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    backgroundColor: Colors.surfaceCard,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  declineBtnText: {
    fontSize: FontSize.sm,
    fontWeight: "600",
    color: Colors.textSecondary,
  },
  acceptedRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  acceptedText: {
    fontSize: FontSize.sm,
    color: Colors.success,
    fontWeight: "600",
  },
  // Empty state
  emptyState: {
    alignItems: "center",
    paddingTop: 60,
    gap: 12,
  },
  emptyText: {
    fontSize: FontSize.lg,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  emptySubtext: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    textAlign: "center",
  },
  // CTA
  ctaContainer: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  ctaButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.secondary,
    paddingVertical: 14,
    borderRadius: BorderRadius.lg,
    shadowColor: Colors.glow,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 12,
    elevation: 10,
  },
  ctaText: {
    fontSize: FontSize.md,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  // Smart Reply styles
  smartReplyRow: {
    marginTop: 6,
  },
  smartReplyLabel: {
    fontSize: 10,
    color: Colors.textMuted,
    marginBottom: 4,
    fontWeight: "600",
  },
  smartReplyScroll: {
    flexDirection: "row",
  },
  smartReplyChip: {
    backgroundColor: "rgba(0, 170, 255, 0.08)",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginRight: 6,
    borderWidth: 1,
    borderColor: "rgba(0, 170, 255, 0.2)",
  },
  smartReplyChipCopied: {
    backgroundColor: "rgba(0, 255, 136, 0.08)",
    borderColor: "rgba(0, 255, 136, 0.3)",
  },
  smartReplyChipText: {
    fontSize: 11,
    color: Colors.secondary,
    fontWeight: "500",
  },
  smartReplyLoading: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 6,
  },
  smartReplyLoadingText: {
    fontSize: 10,
    color: Colors.textMuted,
  },
  swipeContainer: {
    position: "relative" as const,
    overflow: "hidden",
  },
  swipeBackground: {
    position: "absolute" as const,
    right: 0,
    top: 0,
    bottom: 0,
    flexDirection: "row" as const,
    alignItems: "center" as const,
  },
  swipeAction: {
    width: 80,
    height: "100%" as const,
    justifyContent: "center" as const,
    alignItems: "center" as const,
  },
  swipePin: {
    backgroundColor: Colors.primary,
  },
  swipeUnpin: {
    backgroundColor: Colors.textMuted,
  },
  swipeActionText: {
    color: "#FFFFFF",
    fontSize: 11,
    marginTop: 2,
  },
  conversationPinned: {
    backgroundColor: Colors.surfaceElevated,
  },
  pinIndicator: {
    position: "absolute" as const,
    top: 8,
    right: 8,
  },
  presenceDotList: {
    position: "absolute" as const,
    bottom: 1,
    right: 1,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: Colors.background,
  },
  presenceDotOnline: {
    backgroundColor: "#34C759",
  },
  presenceDotOffline: {
    backgroundColor: "#8E8E93",
  },
  globalSearchHeader: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.textSecondary,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  globalSearchRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.border,
  },
  globalSearchAvatar: {
    fontSize: 36,
    marginRight: 12,
  },
  globalSearchContent: {
    flex: 1,
  },
  globalSearchNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  globalSearchName: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  globalSearchFlag: {
    fontSize: 14,
  },
  globalSearchBadge: {
    backgroundColor: Colors.secondary + "20",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  globalSearchBadgeText: {
    fontSize: 10,
    fontWeight: "600",
    color: Colors.secondary,
  },
  globalSearchMsg: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
});
