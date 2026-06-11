import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Animated,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import * as Haptics from "expo-haptics";
import { Colors, Spacing, BorderRadius, FontSize } from "../constants/Colors";
import { useChatWallpaper } from "@/hooks/use-chat-wallpaper";
import { ChatWallpaperBackground } from "@/components/chat-wallpaper-background";

// ─── TYPES ──────────────────────────────────────────────────────────────────────
type GroupMessage = {
  id: string;
  text: string;
  senderId: string;
  senderName: string;
  timestamp: number;
};

type GroupMember = {
  id: string;
  name: string;
  avatar: string;
  color: string;
  isTyping: boolean;
};

// ─── MEMBER COLORS ──────────────────────────────────────────────────────────────
const MEMBER_COLORS = [
  "#7C3AED", // purple
  "#0EA5E9", // sky blue
  "#10B981", // emerald
  "#F59E0B", // amber
  "#EF4444", // red
  "#EC4899", // pink
  "#06B6D4", // cyan
  "#8B5CF6", // violet
  "#F97316", // orange
  "#14B8A6", // teal
];

// ─── SAMPLE GROUP DATA ──────────────────────────────────────────────────────────
const SAMPLE_MEMBERS: GroupMember[] = [
  { id: "me", name: "You", avatar: "👤", color: Colors.secondary, isTyping: false },
  { id: "maria", name: "María", avatar: "🇲🇽", color: MEMBER_COLORS[0], isTyping: false },
  { id: "kenji", name: "Kenji", avatar: "🇯🇵", color: MEMBER_COLORS[1], isTyping: false },
  { id: "pierre", name: "Pierre", avatar: "🇫🇷", color: MEMBER_COLORS[2], isTyping: false },
  { id: "aisha", name: "Aisha", avatar: "🇸🇦", color: MEMBER_COLORS[3], isTyping: false },
];

const SAMPLE_MESSAGES: GroupMessage[] = [
  { id: "g1", text: "Welcome to the Spanish Practice Group! 🎉", senderId: "maria", senderName: "María", timestamp: Date.now() - 3600000 },
  { id: "g2", text: "Excited to practice with everyone!", senderId: "kenji", senderName: "Kenji", timestamp: Date.now() - 3500000 },
  { id: "g3", text: "Let's start with introductions. Yo soy María de México.", senderId: "maria", senderName: "María", timestamp: Date.now() - 3400000 },
  { id: "g4", text: "Bonjour! Je m'appelle Pierre. I'm learning Spanish too.", senderId: "pierre", senderName: "Pierre", timestamp: Date.now() - 3300000 },
  { id: "g5", text: "مرحبا! I'm Aisha. My Spanish is still beginner level.", senderId: "aisha", senderName: "Aisha", timestamp: Date.now() - 3200000 },
  { id: "g6", text: "No worries! We're all here to learn together 💪", senderId: "maria", senderName: "María", timestamp: Date.now() - 3100000 },
];

// AI responses for simulating group chat
const AI_RESPONSES = [
  { senderId: "maria", text: "¡Muy bien! Your pronunciation is getting better!" },
  { senderId: "kenji", text: "I agree! Let's try a harder sentence next." },
  { senderId: "pierre", text: "Can someone explain the subjunctive tense?" },
  { senderId: "aisha", text: "I found a great resource for vocabulary practice!" },
  { senderId: "maria", text: "Try this: 'Si yo fuera tú, estudiaría más.' Who can translate?" },
  { senderId: "kenji", text: "If I were you, I would study more! Right?" },
  { senderId: "pierre", text: "Exactement! The subjunctive is like French subjonctif." },
  { senderId: "aisha", text: "This is so helpful! Thank you all 🙏" },
];

export default function GroupChatScreen() {
  const { theme: chatWallpaper } = useChatWallpaper("group-chat");

  const params = useLocalSearchParams<{ groupName?: string; memberCount?: string }>();
  const groupName = params.groupName || "Spanish Practice Group";

  const [messages, setMessages] = useState<GroupMessage[]>(SAMPLE_MESSAGES);
  const [members, setMembers] = useState<GroupMember[]>(SAMPLE_MEMBERS);
  const [inputText, setInputText] = useState("");
  const [responseIndex, setResponseIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  // Typing indicator animations
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animateDots = () => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(dot1, { toValue: 1, duration: 300, useNativeDriver: true }),
          Animated.timing(dot2, { toValue: 1, duration: 300, useNativeDriver: true }),
          Animated.timing(dot3, { toValue: 1, duration: 300, useNativeDriver: true }),
          Animated.timing(dot1, { toValue: 0, duration: 300, useNativeDriver: true }),
          Animated.timing(dot2, { toValue: 0, duration: 300, useNativeDriver: true }),
          Animated.timing(dot3, { toValue: 0, duration: 300, useNativeDriver: true }),
        ])
      ).start();
    };
    animateDots();
  }, []);

  const typingMembers = members.filter((m) => m.isTyping && m.id !== "me");

  const sendMessage = useCallback(() => {
    if (!inputText.trim()) return;
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const newMsg: GroupMessage = {
      id: `msg_${Date.now()}`,
      text: inputText.trim(),
      senderId: "me",
      senderName: "You",
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, newMsg]);
    setInputText("");

    // Simulate group responses
    simulateGroupResponse();
  }, [inputText, responseIndex]);

  const simulateGroupResponse = () => {
    const response = AI_RESPONSES[responseIndex % AI_RESPONSES.length];
    const responderId = response.senderId;

    // Show typing indicator for the responder
    setTimeout(() => {
      setMembers((prev) =>
        prev.map((m) => (m.id === responderId ? { ...m, isTyping: true } : m))
      );
    }, 800);

    // Send the response after typing delay
    setTimeout(() => {
      setMembers((prev) =>
        prev.map((m) => (m.id === responderId ? { ...m, isTyping: false } : m))
      );
      const reply: GroupMessage = {
        id: `msg_${Date.now()}_reply`,
        text: response.text,
        senderId: response.senderId,
        senderName: SAMPLE_MEMBERS.find((m) => m.id === response.senderId)?.name || "Member",
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, reply]);
      setResponseIndex((prev) => prev + 1);

      // Sometimes a second member responds too
      if (Math.random() > 0.5) {
        const secondResponse = AI_RESPONSES[(responseIndex + 1) % AI_RESPONSES.length];
        const secondId = secondResponse.senderId;
        if (secondId !== responderId) {
          setTimeout(() => {
            setMembers((prev) =>
              prev.map((m) => (m.id === secondId ? { ...m, isTyping: true } : m))
            );
          }, 500);
          setTimeout(() => {
            setMembers((prev) =>
              prev.map((m) => (m.id === secondId ? { ...m, isTyping: false } : m))
            );
            const secondReply: GroupMessage = {
              id: `msg_${Date.now()}_reply2`,
              text: secondResponse.text,
              senderId: secondResponse.senderId,
              senderName: SAMPLE_MEMBERS.find((m) => m.id === secondResponse.senderId)?.name || "Member",
              timestamp: Date.now(),
            };
            setMessages((prev) => [...prev, secondReply]);
          }, 3000);
        }
      }
    }, 2000 + Math.random() * 1000);
  };

  const getMemberColor = (senderId: string): string => {
    const member = members.find((m) => m.id === senderId);
    return member?.color || Colors.textMuted;
  };

  const getMemberAvatar = (senderId: string): string => {
    const member = members.find((m) => m.id === senderId);
    return member?.avatar || "👤";
  };

  const formatTime = (ts: number) => {
    const d = new Date(ts);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  // ─── RENDER MESSAGE ─────────────────────────────────────────────────────────────
  const renderMessage = ({ item, index }: { item: GroupMessage; index: number }) => {
    const isMe = item.senderId === "me";
    const prevMsg = index > 0 ? messages[index - 1] : null;
    const showSender = !prevMsg || prevMsg.senderId !== item.senderId;
    const senderColor = getMemberColor(item.senderId);

    return (
      <View style={[styles.msgRow, isMe ? styles.msgRowRight : styles.msgRowLeft]}>
        {/* Avatar for others */}
        {!isMe && showSender && (
          <View style={[styles.msgAvatar, { borderColor: senderColor }]}>
            <Text style={styles.msgAvatarText}>{getMemberAvatar(item.senderId)}</Text>
          </View>
        )}
        {!isMe && !showSender && <View style={styles.msgAvatarSpacer} />}

        <View style={[
          styles.msgBubble,
          isMe ? styles.msgBubbleMine : styles.msgBubbleTheirs,
          !isMe && { borderLeftColor: senderColor, borderLeftWidth: 3 },
        ]}>
          {/* Sender name (color-coded) */}
          {!isMe && showSender && (
            <Text style={[styles.msgSenderName, { color: senderColor }]}>
              {item.senderName}
            </Text>
          )}
          <Text style={[styles.msgText, isMe && styles.msgTextMine]}>
            {item.text}
          </Text>
          <Text style={[styles.msgTime, isMe && styles.msgTimeMine]}>
            {formatTime(item.timestamp)}
          </Text>
        </View>
      </View>
    );
  };

  // ─── TYPING INDICATOR ─────────────────────────────────────────────────────────
  const renderTypingIndicator = () => {
    if (typingMembers.length === 0) return null;
    const names = typingMembers.map((m) => m.name).join(", ");
    const typingColor = typingMembers[0]?.color || Colors.textMuted;

    return (
      <View style={styles.typingRow}>
        <View style={[styles.typingAvatar, { borderColor: typingColor }]}>
          <Text style={styles.typingAvatarText}>{typingMembers[0]?.avatar}</Text>
        </View>
        <View style={styles.typingBubble}>
          <Text style={[styles.typingName, { color: typingColor }]}>{names}</Text>
          <View style={styles.typingDots}>
            <Animated.View style={[styles.dot, { opacity: dot1, backgroundColor: typingColor }]} />
            <Animated.View style={[styles.dot, { opacity: dot2, backgroundColor: typingColor }]} />
            <Animated.View style={[styles.dot, { opacity: dot3, backgroundColor: typingColor }]} />
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
    <ChatWallpaperBackground theme={chatWallpaper} fallbackColor="#0A1628">
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle} numberOfLines={1}>{groupName}</Text>
          <Text style={styles.headerSubtitle}>
            {members.length} members • {typingMembers.length > 0 ? `${typingMembers[0].name} typing...` : "Online"}
          </Text>
        </View>
        <View style={styles.headerAvatars}>
          {members.slice(1, 4).map((m) => (
            <View key={m.id} style={[styles.headerAvatarDot, { backgroundColor: m.color }]}>
              <Text style={styles.headerAvatarEmoji}>{m.avatar}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Members Bar */}
      <View style={styles.membersBar}>
        {members.filter((m) => m.id !== "me").map((m) => (
          <View key={m.id} style={styles.memberChip}>
            <Text style={styles.memberChipEmoji}>{m.avatar}</Text>
            <Text style={[styles.memberChipName, { color: m.color }]}>{m.name}</Text>
            {m.isTyping && (
              <View style={[styles.memberTypingDot, { backgroundColor: m.color }]} />
            )}
          </View>
        ))}
      </View>

      {/* Messages */}
      <KeyboardAvoidingView
        style={styles.chatArea}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={90}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          contentContainerStyle={styles.messagesList}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          ListFooterComponent={renderTypingIndicator}
        />

        {/* Input Area */}
        <View style={styles.inputArea}>
          <TextInput
            style={styles.input}
            placeholder="Message the group..."
            placeholderTextColor={Colors.textMuted}
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={1000}
            returnKeyType="send"
            onSubmitEditing={sendMessage}
          />
          <TouchableOpacity
            style={[styles.sendBtn, !inputText.trim() && styles.sendBtnDisabled]}
            onPress={sendMessage}
            disabled={!inputText.trim()}
          >
            <Ionicons name="send" size={18} color={inputText.trim() ? "#FFFFFF" : Colors.textMuted} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
        </ChatWallpaperBackground>
</SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.backgroundDark,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: 12,
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
  headerCenter: {
    flex: 1,
  },
  headerTitle: {
    fontSize: FontSize.lg,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  headerSubtitle: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    marginTop: 2,
  },
  headerAvatars: {
    flexDirection: "row",
    gap: -8,
  },
  headerAvatarDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: Colors.backgroundDark,
  },
  headerAvatarEmoji: {
    fontSize: 12,
  },
  membersBar: {
    flexDirection: "row",
    paddingHorizontal: Spacing.lg,
    paddingVertical: 8,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    flexWrap: "wrap",
  },
  memberChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surfaceCard,
    borderRadius: BorderRadius.full,
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 4,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  memberChipEmoji: {
    fontSize: 12,
  },
  memberChipName: {
    fontSize: 11,
    fontWeight: "600",
  },
  memberTypingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  chatArea: {
    flex: 1,
  },
  messagesList: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    paddingBottom: 20,
  },
  msgRow: {
    flexDirection: "row",
    marginBottom: 6,
    alignItems: "flex-end",
  },
  msgRowLeft: {
    justifyContent: "flex-start",
  },
  msgRowRight: {
    justifyContent: "flex-end",
  },
  msgAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.surfaceCard,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 6,
    borderWidth: 2,
  },
  msgAvatarText: {
    fontSize: 14,
  },
  msgAvatarSpacer: {
    width: 34,
  },
  msgBubble: {
    maxWidth: "75%",
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  msgBubbleMine: {
    backgroundColor: Colors.secondary,
    borderBottomRightRadius: 4,
  },
  msgBubbleTheirs: {
    backgroundColor: Colors.surfaceCard,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  msgSenderName: {
    fontSize: 11,
    fontWeight: "700",
    marginBottom: 2,
  },
  msgText: {
    fontSize: 14,
    color: Colors.textPrimary,
    lineHeight: 20,
  },
  msgTextMine: {
    color: "#FFFFFF",
  },
  msgTime: {
    fontSize: 10,
    color: Colors.textMuted,
    marginTop: 4,
    alignSelf: "flex-end",
  },
  msgTimeMine: {
    color: "rgba(255,255,255,0.7)",
  },
  // Typing indicator
  typingRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    paddingLeft: 4,
  },
  typingAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.surfaceCard,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 6,
    borderWidth: 2,
  },
  typingAvatarText: {
    fontSize: 14,
  },
  typingBubble: {
    backgroundColor: Colors.surfaceCard,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  typingName: {
    fontSize: 10,
    fontWeight: "600",
    marginBottom: 4,
  },
  typingDots: {
    flexDirection: "row",
    gap: 4,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  // Input
  inputArea: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.surfaceCard,
    gap: 8,
  },
  input: {
    flex: 1,
    backgroundColor: Colors.backgroundDark,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: Colors.textPrimary,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sendBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.secondary,
    alignItems: "center",
    justifyContent: "center",
  },
  sendBtnDisabled: {
    backgroundColor: Colors.surfaceCard,
    borderWidth: 1,
    borderColor: Colors.border,
  },
});
