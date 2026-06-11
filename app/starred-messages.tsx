import React, { useState, useEffect } from "react";
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
import { router, useLocalSearchParams } from "expo-router";
import * as Haptics from "expo-haptics";
import { Colors } from "../constants/Colors";
import { getStarredMessages, toggleStarredMessage, type StarredMessage } from "@/lib/chat-media-store";

export default function StarredMessagesScreen() {
  const params = useLocalSearchParams<{
    contactId?: string;
    contactName?: string;
    contactAvatar?: string;
  }>();

  const contactId = params.contactId || "unknown";
  const contactName = params.contactName || "Contact";
  const contactAvatar = params.contactAvatar || "\u{1F464}";

  const [messages, setMessages] = useState<StarredMessage[]>([]);

  useEffect(() => {
    loadStarred();
  }, [contactId]);

  const loadStarred = async () => {
    const starred = await getStarredMessages(contactId);
    setStarred(starred);
  };

  const setStarred = (starred: StarredMessage[]) => {
    // Sort by timestamp descending (newest first)
    setMessages([...starred].sort((a, b) => b.timestamp - a.timestamp));
  };

  const haptic = () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const unstarMessage = async (messageId: string) => {
    haptic();
    await toggleStarredMessage(contactId, {
      id: messageId,
      text: "",
      sender: "me" as const,
      timestamp: 0,
      contactName: contactName,
      contactAvatar: contactAvatar,
    });
    // Reload
    const starred = await getStarredMessages(contactId);
    setStarred(starred);
  };

  const renderStarredMessage = ({ item }: { item: StarredMessage }) => {
    const isMe = item.sender === "me";
    const date = new Date(item.timestamp);
    const timeStr = date.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
    const dateStr = date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });

    return (
      <View style={styles.messageCard}>
        <View style={styles.messageHeader}>
          <View style={styles.senderInfo}>
            <Text style={styles.senderAvatar}>{isMe ? "\u{1F9D1}" : contactAvatar}</Text>
            <Text style={styles.senderName}>{isMe ? "You" : contactName}</Text>
          </View>
          <View style={styles.messageTime}>
            <Text style={styles.timeText}>{dateStr}</Text>
            <Text style={styles.timeText}>{timeStr}</Text>
          </View>
        </View>
        <View style={[styles.messageBubble, isMe ? styles.bubbleMine : styles.bubbleTheirs]}>
          <Text style={[styles.messageText, isMe ? styles.textMine : styles.textTheirs]}>
            {item.text}
          </Text>
        </View>
        <View style={styles.messageActions}>
          <TouchableOpacity
            style={styles.unstarBtn}
            onPress={() => unstarMessage(item.id)}
            activeOpacity={0.7}
          >
            <Ionicons name="star" size={14} color={Colors.gold || "#FFD700"} />
            <Text style={styles.unstarText}>Unstar</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.replyBtn} activeOpacity={0.7}>
            <Ionicons name="arrow-undo" size={14} color={Colors.secondary} />
            <Text style={styles.replyText}>Reply</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Starred Messages</Text>
          <Text style={styles.headerSubtitle}>{contactName}</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      {messages.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={styles.emptyIcon}>
            <Ionicons name="star-outline" size={56} color={Colors.textSecondary} />
          </View>
          <Text style={styles.emptyTitle}>No Starred Messages</Text>
          <Text style={styles.emptySubtitle}>
            Long press any message in the chat to star it for quick reference later.
          </Text>
        </View>
      ) : (
        <FlatList
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderStarredMessage}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}
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
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.border,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 20,
    backgroundColor: Colors.surfaceCard,
  },
  headerCenter: {
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  headerSubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  // Empty State
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
  },
  emptyIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.surfaceCard,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: 20,
  },
  // List
  listContent: {
    padding: 16,
  },
  separator: {
    height: 12,
  },
  // Message Card
  messageCard: {
    backgroundColor: Colors.surfaceCard,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 14,
  },
  messageHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  senderInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  senderAvatar: {
    fontSize: 20,
  },
  senderName: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  messageTime: {
    alignItems: "flex-end",
  },
  timeText: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  // Bubble
  messageBubble: {
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    maxWidth: "85%",
  },
  bubbleMine: {
    alignSelf: "flex-end",
    backgroundColor: Colors.secondary,
    borderBottomRightRadius: 4,
  },
  bubbleTheirs: {
    alignSelf: "flex-start",
    backgroundColor: Colors.surfaceElevated,
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  textMine: {
    color: "#fff",
  },
  textTheirs: {
    color: Colors.textPrimary,
  },
  // Actions
  messageActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 16,
    marginTop: 10,
  },
  unstarBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  unstarText: {
    fontSize: 12,
    color: Colors.gold || "#FFD700",
    fontWeight: "600",
  },
  replyBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  replyText: {
    fontSize: 12,
    color: Colors.secondary,
    fontWeight: "600",
  },
});
