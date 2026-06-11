import React, { useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useChatWallpaper } from "@/hooks/use-chat-wallpaper";
import { ChatWallpaperBackground } from "@/components/chat-wallpaper-background";

type Message = {
  id: string;
  sender: string;
  avatar: string;
  text: string;
  time: string;
  isMe: boolean;
  isSystem?: boolean;
  language?: string;
  translation?: string;
};

const MESSAGES: Message[] = [
  { id: "1", sender: "System", avatar: "🤖", text: "Class 'Spanish Beginners' session ended. Great work everyone!", time: "6:58 PM", isMe: false, isSystem: true },
  { id: "2", sender: "Maria", avatar: "👩🏽", text: "¡Eso fue genial! I learned so much about restaurant vocabulary today.", time: "7:00 PM", isMe: false, language: "Spanish/English" },
  { id: "3", sender: "You", avatar: "🧑", text: "Same! I finally understand the difference between pedir and preguntar", time: "7:01 PM", isMe: true },
  { id: "4", sender: "Alex", avatar: "👨🏻", text: "Can someone explain the homework? I missed the last 5 minutes", time: "7:02 PM", isMe: false },
  { id: "5", sender: "Yuki", avatar: "👩🏻", text: "We need to write 5 sentences ordering food at a restaurant. Due by Thursday!", time: "7:03 PM", isMe: false },
  { id: "6", sender: "Maria", avatar: "👩🏽", text: "¿Quién quiere practicar conmigo mañana?", time: "7:05 PM", isMe: false, language: "Spanish", translation: "Who wants to practice with me tomorrow?" },
  { id: "7", sender: "You", avatar: "🧑", text: "¡Yo! I'm free after 5pm", time: "7:06 PM", isMe: true },
  { id: "8", sender: "Alex", avatar: "👨🏻", text: "Count me in too 🙋‍♂️", time: "7:07 PM", isMe: false },
];

export default function ClassChatScreen() {
  const { theme: chatWallpaper } = useChatWallpaper("class-chat");

  const colors = useColors();
  const [messages, setMessages] = useState(MESSAGES);
  const [inputText, setInputText] = useState("");
  const [showTranslation, setShowTranslation] = useState<string | null>(null);
  const flatListRef = useRef<FlatList>(null);

  const sendMessage = () => {
    if (!inputText.trim()) return;
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const newMsg: Message = {
      id: Date.now().toString(),
      sender: "You",
      avatar: "🧑",
      text: inputText.trim(),
      time: new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }),
      isMe: true,
    };
    setMessages((prev) => [...prev, newMsg]);
    setInputText("");
    setTimeout(() => flatListRef.current?.scrollToEnd(), 100);
  };

  const renderMessage = ({ item }: { item: Message }) => {
    if (item.isSystem) {
      return (
        <View style={[styles.systemMsg, { backgroundColor: colors.primary + "10" }]}>
          <Ionicons name="information-circle" size={14} color={colors.primary} />
          <Text style={[styles.systemText, { color: colors.primary }]}>{item.text}</Text>
        </View>
      );
    }

    return (
      <View style={[styles.msgRow, { justifyContent: item.isMe ? "flex-end" : "flex-start" }]}>
        {!item.isMe && <Text style={styles.msgAvatar}>{item.avatar}</Text>}
        <View style={[styles.msgBubble, {
          backgroundColor: item.isMe ? colors.primary : colors.surface,
          borderColor: item.isMe ? colors.primary : colors.border,
        }]}>
          {!item.isMe && <Text style={[styles.msgSender, { color: item.isMe ? "#FFF" : colors.primary }]}>{item.sender}</Text>}
          <Text style={[styles.msgText, { color: item.isMe ? "#FFF" : colors.foreground }]}>{item.text}</Text>
          
          {item.translation && (
            <TouchableOpacity
              onPress={() => setShowTranslation(showTranslation === item.id ? null : item.id)}
              style={[styles.translateBtn, { borderTopColor: item.isMe ? "rgba(255,255,255,0.2)" : colors.border }]}
            >
              <Ionicons name="language" size={12} color={item.isMe ? "rgba(255,255,255,0.7)" : colors.muted} />
              <Text style={[styles.translateText, { color: item.isMe ? "rgba(255,255,255,0.7)" : colors.muted }]}>
                {showTranslation === item.id ? item.translation : "Translate"}
              </Text>
            </TouchableOpacity>
          )}
          
          <Text style={[styles.msgTime, { color: item.isMe ? "rgba(255,255,255,0.6)" : colors.muted }]}>{item.time}</Text>
        </View>
      </View>
    );
  };

  return (
    <ScreenContainer edges={["top", "left", "right"]}>
    <ChatWallpaperBackground theme={chatWallpaper} fallbackColor="#0A1628">
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Spanish Beginners</Text>
          <Text style={[styles.headerSubtitle, { color: colors.muted }]}>3 members online</Text>
        </View>
        <TouchableOpacity style={styles.headerAction}>
          <Ionicons name="people" size={20} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messageList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
      />

      {/* Input Bar */}
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <View style={[styles.inputBar, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
          <TouchableOpacity style={styles.inputAction}>
            <Ionicons name="add-circle" size={24} color={colors.primary} />
          </TouchableOpacity>
          <TextInput
            style={[styles.textInput, { backgroundColor: colors.background, borderColor: colors.border, color: colors.foreground }]}
            placeholder="Message..."
            placeholderTextColor={colors.muted}
            value={inputText}
            onChangeText={setInputText}
            returnKeyType="send"
            onSubmitEditing={sendMessage}
          />
          <TouchableOpacity
            style={[styles.sendBtn, { backgroundColor: inputText.trim() ? colors.primary : colors.border }]}
            onPress={sendMessage}
            disabled={!inputText.trim()}
          >
            <Ionicons name="send" size={16} color="#FFF" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
        </ChatWallpaperBackground>
</ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 0.5 },
  backBtn: { padding: 4 },
  headerCenter: { flex: 1, marginLeft: 12 },
  headerTitle: { fontSize: 16, fontWeight: "700" },
  headerSubtitle: { fontSize: 11, marginTop: 1 },
  headerAction: { padding: 4 },
  messageList: { padding: 16, paddingBottom: 8 },
  systemMsg: { flexDirection: "row", alignItems: "center", gap: 6, alignSelf: "center", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, marginBottom: 12 },
  systemText: { fontSize: 11, fontWeight: "600" },
  msgRow: { flexDirection: "row", alignItems: "flex-end", marginBottom: 8, gap: 6 },
  msgAvatar: { fontSize: 20 },
  msgBubble: { maxWidth: "75%", padding: 10, borderRadius: 14, borderWidth: 0.5 },
  msgSender: { fontSize: 11, fontWeight: "700", marginBottom: 2 },
  msgText: { fontSize: 14, lineHeight: 20 },
  msgTime: { fontSize: 10, marginTop: 4, alignSelf: "flex-end" },
  translateBtn: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 6, paddingTop: 6, borderTopWidth: 0.5 },
  translateText: { fontSize: 11 },
  inputBar: { flexDirection: "row", alignItems: "center", padding: 10, borderTopWidth: 0.5, gap: 8 },
  inputAction: { padding: 2 },
  textInput: { flex: 1, height: 36, borderRadius: 18, borderWidth: 1, paddingHorizontal: 14, fontSize: 14 },
  sendBtn: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center" },
});
