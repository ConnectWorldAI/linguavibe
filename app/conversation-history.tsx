/**
 * Conversation History Screen
 * 
 * Browse past Wave Cloud conversations, searchable by topic or date.
 * Shows conversation threads with timestamps and topic tags.
 */
import React, { useState, useEffect, useCallback } from "react";
import {
  View, Text, FlatList, Pressable, TextInput, StyleSheet, Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ScreenContainer } from "@/components/screen-container";
import { Colors, Spacing, FontSize, BorderRadius } from "@/constants/Colors";

const CHAT_HISTORY_KEY = "@wave_cloud_chat_history";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

interface ConversationThread {
  id: string;
  messages: ChatMessage[];
  topic: string;
  startTime: number;
  lastTime: number;
  mode: string;
}

type FilterMode = "all" | "therapist" | "coach" | "motivator" | "tutor" | "advisor";

export default function ConversationHistoryScreen() {
  const router = useRouter();
  const [threads, setThreads] = useState<ConversationThread[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterMode, setFilterMode] = useState<FilterMode>("all");
  const [expandedThread, setExpandedThread] = useState<string | null>(null);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const stored = await AsyncStorage.getItem(CHAT_HISTORY_KEY);
      if (stored) {
        const msgs: ChatMessage[] = JSON.parse(stored);
        const grouped = groupIntoThreads(msgs);
        setThreads(grouped);
      }
    } catch {}
  };

  const groupIntoThreads = (messages: ChatMessage[]): ConversationThread[] => {
    if (messages.length === 0) return [];
    const sorted = [...messages].sort((a, b) => a.timestamp - b.timestamp);
    const threadList: ConversationThread[] = [];
    let currentThread: ChatMessage[] = [];
    let lastTime = 0;

    for (const msg of sorted) {
      // New thread if gap > 30 minutes
      if (lastTime > 0 && msg.timestamp - lastTime > 30 * 60 * 1000) {
        if (currentThread.length > 0) {
          threadList.push(buildThread(currentThread));
        }
        currentThread = [];
      }
      currentThread.push(msg);
      lastTime = msg.timestamp;
    }
    if (currentThread.length > 0) {
      threadList.push(buildThread(currentThread));
    }

    return threadList.reverse(); // newest first
  };

  const buildThread = (messages: ChatMessage[]): ConversationThread => {
    const firstUserMsg = messages.find((m) => m.role === "user");
    const topic = firstUserMsg
      ? firstUserMsg.content.slice(0, 60) + (firstUserMsg.content.length > 60 ? "..." : "")
      : "Conversation";
    const mode = detectMode(messages);
    return {
      id: `thread_${messages[0].timestamp}`,
      messages,
      topic,
      startTime: messages[0].timestamp,
      lastTime: messages[messages.length - 1].timestamp,
      mode,
    };
  };

  const detectMode = (messages: ChatMessage[]): string => {
    const text = messages.map((m) => m.content.toLowerCase()).join(" ");
    if (text.includes("feeling") || text.includes("stress") || text.includes("anxious") || text.includes("sad")) return "therapist";
    if (text.includes("goal") || text.includes("habit") || text.includes("routine") || text.includes("discipline")) return "coach";
    if (text.includes("motivat") || text.includes("inspire") || text.includes("believe") || text.includes("you can")) return "motivator";
    if (text.includes("grammar") || text.includes("vocab") || text.includes("conjugat") || text.includes("lesson")) return "tutor";
    if (text.includes("friend") || text.includes("social") || text.includes("advice") || text.includes("relationship")) return "advisor";
    return "general";
  };

  const getModeIcon = (mode: string): keyof typeof Ionicons.glyphMap => {
    switch (mode) {
      case "therapist": return "heart";
      case "coach": return "fitness";
      case "motivator": return "flame";
      case "tutor": return "book";
      case "advisor": return "people";
      default: return "chatbubble";
    }
  };

  const getModeColor = (mode: string): string => {
    switch (mode) {
      case "therapist": return Colors.neonPurple;
      case "coach": return Colors.success;
      case "motivator": return Colors.gold;
      case "tutor": return Colors.accent;
      case "advisor": return "#FF6B9D";
      default: return Colors.muted;
    }
  };

  const getModeLabel = (mode: string): string => {
    switch (mode) {
      case "therapist": return "Therapy";
      case "coach": return "Coaching";
      case "motivator": return "Motivation";
      case "tutor": return "Tutoring";
      case "advisor": return "Life Advice";
      default: return "Chat";
    }
  };

  const formatDate = (ts: number) => {
    const d = new Date(ts);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const isYesterday = d.toDateString() === yesterday.toDateString();
    if (isToday) return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
    if (isYesterday) return "Yesterday";
    return d.toLocaleDateString([], { month: "short", day: "numeric" });
  };

  const formatFullDate = (ts: number) => {
    const d = new Date(ts);
    return d.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
  };

  const filteredThreads = threads.filter((t) => {
    const matchesFilter = filterMode === "all" || t.mode === filterMode;
    const matchesSearch = !searchQuery.trim() ||
      t.messages.some((m) => m.content.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesFilter && matchesSearch;
  });

  const clearHistory = () => {
    Alert.alert("Clear History", "This will delete all conversation history. This cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Clear All", style: "destructive",
        onPress: async () => {
          await AsyncStorage.removeItem(CHAT_HISTORY_KEY);
          setThreads([]);
        },
      },
    ]);
  };

  const renderThread = ({ item }: { item: ConversationThread }) => {
    const isExpanded = expandedThread === item.id;
    const modeColor = getModeColor(item.mode);
    const msgCount = item.messages.length;
    const lastAssistantMsg = [...item.messages].reverse().find((m) => m.role === "assistant");

    return (
      <Pressable
        onPress={() => setExpandedThread(isExpanded ? null : item.id)}
        style={[s.threadCard, isExpanded && { borderColor: modeColor + "40" }]}
      >
        {/* Thread header */}
        <View style={s.threadHeader}>
          <View style={[s.modeIcon, { backgroundColor: modeColor + "15" }]}>
            <Ionicons name={getModeIcon(item.mode)} size={16} color={modeColor} />
          </View>
          <View style={s.threadInfo}>
            <Text style={s.threadTopic} numberOfLines={isExpanded ? undefined : 1}>{item.topic}</Text>
            <View style={s.threadMeta}>
              <Text style={[s.modeBadge, { color: modeColor }]}>{getModeLabel(item.mode)}</Text>
              <Text style={s.threadDot}>·</Text>
              <Text style={s.threadDate}>{formatDate(item.startTime)}</Text>
              <Text style={s.threadDot}>·</Text>
              <Text style={s.threadMsgCount}>{msgCount} messages</Text>
            </View>
          </View>
          <Ionicons
            name={isExpanded ? "chevron-up" : "chevron-down"}
            size={18}
            color={Colors.muted}
          />
        </View>

        {/* Preview when collapsed */}
        {!isExpanded && lastAssistantMsg && (
          <Text style={s.previewText} numberOfLines={2}>
            {lastAssistantMsg.content}
          </Text>
        )}

        {/* Full messages when expanded */}
        {isExpanded && (
          <View style={s.messagesContainer}>
            {item.messages.map((msg) => (
              <View
                key={msg.id}
                style={[
                  s.messageBubble,
                  msg.role === "user" ? s.userBubble : s.assistantBubble,
                ]}
              >
                <Text style={[
                  s.messageText,
                  msg.role === "user" ? s.userText : s.assistantText,
                ]}>
                  {msg.content}
                </Text>
                <Text style={[
                  s.messageTime,
                  msg.role === "user" ? s.userTime : s.assistantTime,
                ]}>
                  {formatFullDate(msg.timestamp)}
                </Text>
              </View>
            ))}
          </View>
        )}
      </Pressable>
    );
  };

  const filters: { key: FilterMode; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
    { key: "all", label: "All", icon: "chatbubbles" },
    { key: "therapist", label: "Therapy", icon: "heart" },
    { key: "coach", label: "Coaching", icon: "fitness" },
    { key: "motivator", label: "Motivation", icon: "flame" },
    { key: "tutor", label: "Tutoring", icon: "book" },
    { key: "advisor", label: "Advice", icon: "people" },
  ];

  return (
    <ScreenContainer edges={["top", "left", "right"]}>
      {/* Header */}
      <View style={s.header}>
        <Pressable onPress={() => router.back()} style={({ pressed }) => [s.backBtn, pressed && { opacity: 0.6 }]}>
          <Ionicons name="chevron-back" size={24} color={Colors.textPrimary} />
        </Pressable>
        <View style={s.headerCenter}>
          <Text style={s.headerTitle}>Conversation History</Text>
          <Text style={s.headerSubtitle}>{threads.length} conversations</Text>
        </View>
        {threads.length > 0 && (
          <Pressable onPress={clearHistory} style={({ pressed }) => [s.clearBtn, pressed && { opacity: 0.6 }]}>
            <Ionicons name="trash-outline" size={20} color={Colors.error} />
          </Pressable>
        )}
      </View>

      {/* Search */}
      <View style={s.searchContainer}>
        <Ionicons name="search" size={18} color={Colors.muted} />
        <TextInput
          style={s.searchInput}
          placeholder="Search conversations..."
          placeholderTextColor={Colors.muted}
          value={searchQuery}
          onChangeText={setSearchQuery}
          returnKeyType="search"
        />
        {searchQuery.length > 0 && (
          <Pressable onPress={() => setSearchQuery("")}>
            <Ionicons name="close-circle" size={18} color={Colors.muted} />
          </Pressable>
        )}
      </View>

      {/* Filter chips */}
      <View style={s.filterRow}>
        <FlatList
          horizontal
          data={filters}
          keyExtractor={(item) => item.key}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={s.filterContent}
          renderItem={({ item: f }) => (
            <Pressable
              onPress={() => setFilterMode(f.key)}
              style={[
                s.filterChip,
                filterMode === f.key && s.filterChipActive,
              ]}
            >
              <Ionicons
                name={f.icon}
                size={14}
                color={filterMode === f.key ? "#fff" : Colors.muted}
              />
              <Text style={[
                s.filterChipText,
                filterMode === f.key && s.filterChipTextActive,
              ]}>
                {f.label}
              </Text>
            </Pressable>
          )}
        />
      </View>

      {/* Thread list */}
      <FlatList
        data={filteredThreads}
        keyExtractor={(item) => item.id}
        renderItem={renderThread}
        contentContainerStyle={s.listContent}
        ListEmptyComponent={
          <View style={s.emptyState}>
            <Ionicons name="chatbubbles-outline" size={48} color={Colors.muted} />
            <Text style={s.emptyTitle}>
              {searchQuery ? "No Results" : "No Conversations Yet"}
            </Text>
            <Text style={s.emptyText}>
              {searchQuery
                ? `No conversations match "${searchQuery}"`
                : "Start chatting with Wave Cloud and your conversations will appear here."
              }
            </Text>
          </View>
        }
      />
    </ScreenContainer>
  );
}

const s = StyleSheet.create({
  header: {
    flexDirection: "row", alignItems: "center", paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm, borderBottomWidth: 0.5, borderBottomColor: Colors.borderLight,
  },
  backBtn: { padding: 4 },
  headerCenter: { flex: 1, marginLeft: Spacing.sm },
  headerTitle: { fontSize: FontSize.lg, fontWeight: "700", color: Colors.textPrimary },
  headerSubtitle: { fontSize: FontSize.xs, color: Colors.muted, marginTop: 1 },
  clearBtn: { padding: 8 },
  searchContainer: {
    flexDirection: "row", alignItems: "center", backgroundColor: Colors.surface,
    marginHorizontal: Spacing.md, marginTop: Spacing.sm, paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.lg, borderWidth: 0.5, borderColor: Colors.borderLight, gap: 8,
  },
  searchInput: { flex: 1, fontSize: FontSize.base, color: Colors.textPrimary, paddingVertical: 10 },
  filterRow: { marginTop: Spacing.sm },
  filterContent: { paddingHorizontal: Spacing.md, gap: 8 },
  filterChip: {
    flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 12,
    paddingVertical: 6, borderRadius: 16, backgroundColor: Colors.surface,
    borderWidth: 0.5, borderColor: Colors.borderLight,
  },
  filterChipActive: { backgroundColor: Colors.neonPurple, borderColor: Colors.neonPurple },
  filterChipText: { fontSize: FontSize.xs, color: Colors.muted, fontWeight: "500" },
  filterChipTextActive: { color: "#fff" },
  listContent: { padding: Spacing.md, paddingBottom: 100 },
  threadCard: {
    backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, padding: Spacing.md,
    marginBottom: Spacing.sm, borderWidth: 0.5, borderColor: Colors.borderLight,
  },
  threadHeader: { flexDirection: "row", alignItems: "center", gap: Spacing.sm },
  modeIcon: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  threadInfo: { flex: 1 },
  threadTopic: { fontSize: FontSize.base, fontWeight: "600", color: Colors.textPrimary },
  threadMeta: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 },
  modeBadge: { fontSize: FontSize.xs, fontWeight: "600" },
  threadDot: { fontSize: FontSize.xs, color: Colors.muted },
  threadDate: { fontSize: FontSize.xs, color: Colors.muted },
  threadMsgCount: { fontSize: FontSize.xs, color: Colors.muted },
  previewText: { fontSize: FontSize.sm, color: Colors.muted, marginTop: 8, lineHeight: 18 },
  messagesContainer: { marginTop: Spacing.sm, gap: 8 },
  messageBubble: { maxWidth: "85%", padding: 10, borderRadius: 16 },
  userBubble: { alignSelf: "flex-end", backgroundColor: Colors.neonPurple },
  assistantBubble: { alignSelf: "flex-start", backgroundColor: Colors.background },
  messageText: { fontSize: FontSize.sm, lineHeight: 20 },
  userText: { color: "#fff" },
  assistantText: { color: Colors.textPrimary },
  messageTime: { fontSize: 10, marginTop: 4 },
  userTime: { color: "rgba(255,255,255,0.6)", textAlign: "right" },
  assistantTime: { color: Colors.muted },
  emptyState: { alignItems: "center", paddingVertical: 60, gap: Spacing.sm },
  emptyTitle: { fontSize: FontSize.lg, fontWeight: "700", color: Colors.textPrimary },
  emptyText: { fontSize: FontSize.sm, color: Colors.muted, textAlign: "center", lineHeight: 20, paddingHorizontal: 20 },
});
