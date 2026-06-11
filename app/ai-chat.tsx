import { ChatWallpaperShortcut } from "@/components/chat-wallpaper-shortcut";
import { useState, useRef, useEffect } from "react";
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
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Colors, Spacing, BorderRadius, FontSize } from "../constants/Colors";
import { trpc } from "@/lib/trpc";
import { usePaywallGate } from "@/hooks/use-paywall-gate";
import { PaywallModal } from "@/components/paywall-modal";
import { ReportAIResponse } from "@/components/report-ai-response";
import { useChatWallpaper } from "@/hooks/use-chat-wallpaper";
import { ChatWallpaperBackground } from "@/components/chat-wallpaper-background";

const CHAT_KEY = "@ai_chat_history";

type Message = {
  id: string;
  role: "user" | "assistant";
  text: string;
  timestamp: number;
  suggestions?: string[];
};

const QUICK_ACTIONS = [
  { id: "schedule", label: "📅 Schedule a class", prompt: "Help me schedule a class this week" },
  { id: "practice", label: "🎯 Practice vocab", prompt: "Quiz me on my recent vocabulary" },
  { id: "translate", label: "🌐 Translate", prompt: "Translate something for me" },
  { id: "recommend", label: "📚 Recommend course", prompt: "Recommend a course for my level" },
  { id: "streak", label: "🔥 Streak tips", prompt: "How can I maintain my streak?" },
  { id: "grammar", label: "✏️ Grammar help", prompt: "Explain a grammar concept" },
];

const AI_RESPONSES: Record<string, { text: string; suggestions?: string[] }> = {
  schedule: {
    text: "I'd love to help you schedule a class! Based on your availability (weekday evenings, 7-9 PM), here are some options:\n\n📌 **Dominican Spanish Conversation** — Tue 7:30 PM\n📌 **Business English Workshop** — Wed 8:00 PM\n📌 **French Basics Group** — Thu 7:00 PM\n\nWould you like me to book one of these, or should I look for different times?",
    suggestions: ["Book the Tuesday class", "Show me weekend options", "What's my current schedule?"],
  },
  practice: {
    text: "Let's practice! 🎯 Here's a quick vocab quiz from your recent lessons:\n\n**Word:** ¿Cómo tú ta'?\n**Hint:** This is Dominican slang\n\nWhat does it mean?\n\nA) Where are you going?\nB) How are you?\nC) What's your name?\nD) See you later",
    suggestions: ["B) How are you?", "Give me a harder one", "Switch to French vocab"],
  },
  translate: {
    text: "Sure! What would you like me to translate? Just type or paste the text, and tell me the target language.\n\nI can translate between:\n🇪🇸 Spanish ↔ 🇺🇸 English\n🇫🇷 French ↔ 🇺🇸 English\n🇰🇷 Korean ↔ 🇺🇸 English\n🇯🇵 Japanese ↔ 🇺🇸 English\n\nAnd many more!",
    suggestions: ["Translate 'Good morning' to Spanish", "How do you say 'thank you' in Korean?", "Translate a full paragraph"],
  },
  recommend: {
    text: "Based on your learning history, I'd recommend:\n\n⭐ **Advanced Dominican Slang** (Intermediate)\nYou've completed the basics — this builds on what you know with real conversation patterns.\n\n⭐ **Business Spanish for Professionals** (Intermediate)\nGreat for career growth, covers meetings, emails, and presentations.\n\n⭐ **Spanish Listening Comprehension** (All levels)\nImprove your ear with native speaker audio at various speeds.\n\nWant me to enroll you in any of these?",
    suggestions: ["Enroll in Dominican Slang", "Show me beginner courses", "What about French courses?"],
  },
  streak: {
    text: "Great question! Here are my top tips to maintain your streak 🔥:\n\n1. **Set a daily reminder** — I can schedule one at your preferred time\n2. **Start small** — Even 2 minutes of flashcards counts\n3. **Morning routine** — Review 5 cards with your coffee\n4. **Streak freeze** — You have 1 freeze available for emergencies\n5. **Weekend buffer** — Do extra on weekdays to build a cushion\n\nYour current streak: **12 days** 🎉\nLongest streak: **28 days**\n\nWant me to set up a daily reminder?",
    suggestions: ["Set a reminder at 8 AM", "Use my streak freeze", "What's my weekly goal?"],
  },
  grammar: {
    text: "I'd be happy to help with grammar! What language and topic?\n\nPopular topics I can explain:\n\n🇪🇸 **Spanish:** Ser vs Estar, Subjunctive, Preterite vs Imperfect\n🇫🇷 **French:** Passé composé, Gender rules, Subjunctive\n🇰🇷 **Korean:** Particles (은/는, 이/가), Honorifics, Verb conjugation\n\nOr just ask me any grammar question!",
    suggestions: ["Explain ser vs estar", "When do I use subjunctive?", "Korean particle rules"],
  },
  default: {
    text: "I'm your AI learning assistant! I can help you with:\n\n• 📅 Scheduling and managing classes\n• 🎯 Vocabulary practice and quizzes\n• 🌐 Translations\n• 📚 Course recommendations\n• ✏️ Grammar explanations\n• 🔥 Streak and motivation tips\n• 📊 Progress analysis\n\nWhat would you like help with?",
    suggestions: ["Schedule a class", "Quiz me", "Show my progress"],
  },
};

export default function AIChatScreen() {
  const { theme: chatWallpaper } = useChatWallpaper("ai-assistant");

  const { showPaywall, paywallFeature, singlePrice, checkAccess, dismissPaywall } = usePaywallGate();

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const typingAnim = useRef(new Animated.Value(0)).current;
  const teacherChat = trpc.teacher.chat.useMutation();

  useEffect(() => {
    loadHistory();
    // Send welcome message if no history
    setTimeout(() => {
      setMessages((prev) => {
        if (prev.length === 0) {
          return [{
            id: "welcome",
            role: "assistant",
            text: "Hey! 👋 I'm your ConnectWorld AI assistant. I can help you schedule classes, practice vocabulary, translate text, and more. What would you like to do?",
            timestamp: Date.now(),
            suggestions: ["Schedule a class", "Practice vocab", "Recommend a course"],
          }];
        }
        return prev;
      });
    }, 500);
  }, []);

  useEffect(() => {
    if (isTyping) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(typingAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
          Animated.timing(typingAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
        ])
      ).start();
    } else {
      typingAnim.setValue(0);
    }
  }, [isTyping]);

  const loadHistory = async () => {
    try {
      const stored = await AsyncStorage.getItem(CHAT_KEY);
      if (stored) setMessages(JSON.parse(stored));
    } catch {}
  };

  const saveHistory = async (msgs: Message[]) => {
    try {
      // Keep last 50 messages
      const toSave = msgs.slice(-50);
      await AsyncStorage.setItem(CHAT_KEY, JSON.stringify(toSave));
    } catch {}
  };

  const getAIResponse = async (userText: string): Promise<{ text: string; suggestions?: string[] }> => {
    try {
      const history = messages.filter(m => (m.role as string) !== 'system').slice(-10).map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.text,
      }));
      const result = await teacherChat.mutateAsync({
        message: userText,
        language: 'Spanish',
        teacherPersona: 'friendly',
        conversationHistory: history,
        userLevel: 'intermediate',
      });
      const responseText = (result as any)?.response || (result as any)?.text || 'I can help you with that!';
      return { text: responseText, suggestions: ['Practice vocabulary', 'Translate something', 'Grammar help'] };
    } catch {
      // Fallback to local responses if server fails
      const lower = userText.toLowerCase();
      if (lower.includes("schedule") || lower.includes("class") || lower.includes("book")) return AI_RESPONSES.schedule;
      if (lower.includes("practice") || lower.includes("quiz") || lower.includes("vocab")) return AI_RESPONSES.practice;
      if (lower.includes("translate") || lower.includes("translation")) return AI_RESPONSES.translate;
      if (lower.includes("recommend") || lower.includes("course") || lower.includes("suggest")) return AI_RESPONSES.recommend;
      if (lower.includes("streak") || lower.includes("motivation") || lower.includes("remind")) return AI_RESPONSES.streak;
      if (lower.includes("grammar") || lower.includes("explain") || lower.includes("rule")) return AI_RESPONSES.grammar;
      return AI_RESPONSES.default;
    }
  };

  const sendMessage = async (text: string) => {
    if (!checkAccess("credits", "ai_chat")) return;

    if (!text.trim()) return;
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const userMsg: Message = {
      id: `user_${Date.now()}`,
      role: "user",
      text: text.trim(),
      timestamp: Date.now(),
    };

    const updated = [...messages, userMsg];
    setMessages(updated);
    setInput("");
    setIsTyping(true);

    // Get real AI response from server
    const response = await getAIResponse(text);
    const aiMsg: Message = {
      id: `ai_${Date.now()}`,
      role: "assistant",
      text: response.text,
      timestamp: Date.now(),
      suggestions: response.suggestions,
    };

    const finalMsgs = [...updated, aiMsg];
    setMessages(finalMsgs);
    setIsTyping(false);
    await saveHistory(finalMsgs);

    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const handleSuggestion = (suggestion: string) => {
    sendMessage(suggestion);
  };

  const clearChat = async () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setMessages([{
      id: "welcome_new",
      role: "assistant",
      text: "Chat cleared! 🧹 How can I help you today?",
      timestamp: Date.now(),
      suggestions: ["Schedule a class", "Practice vocab", "Recommend a course"],
    }]);
    await AsyncStorage.removeItem(CHAT_KEY);
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isUser = item.role === "user";
    return (
      <View style={[styles.messageBubble, isUser ? styles.userBubble : styles.aiBubble]}>
        {!isUser && (
          <View style={styles.aiAvatar}>
            <Ionicons name="sparkles" size={14} color={Colors.secondary} />
          </View>
        )}
        <View style={[styles.bubbleContent, isUser ? styles.userContent : styles.aiContent]}>
          <Text style={[styles.messageText, isUser && styles.userText]}>{item.text}</Text>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <Text style={styles.timestamp}>
              {new Date(item.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </Text>
            {!isUser && <ReportAIResponse messageContent={item.text} size="small" />}
          </View>
        </View>
        {item.suggestions && item.suggestions.length > 0 && (
          <View style={styles.suggestionsWrap}>
            {item.suggestions.map((s, i) => (
              <TouchableOpacity key={i} style={styles.suggestionChip} onPress={() => handleSuggestion(s)}>
                <Text style={styles.suggestionText}>{s}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
    <ChatWallpaperBackground theme={chatWallpaper} fallbackColor="#0A1628">
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <View style={styles.headerAvatar}>
            <Ionicons name="sparkles" size={16} color={Colors.secondary} />
          </View>
          <View>
            <Text style={styles.headerTitle}>AI Assistant</Text>
            <Text style={styles.headerStatus}>Always available</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.clearBtn} onPress={clearChat}>
          <Ionicons name="trash-outline" size={18} color={Colors.textMuted} />
        </TouchableOpacity>
      </View>

      {/* Quick Actions (shown when chat is empty or short) */}
      {messages.length <= 1 && (
        <View style={styles.quickActions}>
          {QUICK_ACTIONS.map((action) => (
            <TouchableOpacity
              key={action.id}
              style={styles.quickActionChip}
              onPress={() => sendMessage(action.prompt)}
            >
              <Text style={styles.quickActionText}>{action.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Messages */}
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
        keyboardVerticalOffset={0}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.messagesList}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          ListFooterComponent={
            isTyping ? (
              <View style={styles.typingIndicator}>
                <View style={styles.aiAvatar}>
                  <Ionicons name="sparkles" size={14} color={Colors.secondary} />
                </View>
                <Animated.View style={[styles.typingDots, { opacity: typingAnim }]}>
                  <View style={styles.dot} />
                  <View style={styles.dot} />
                  <View style={styles.dot} />
                </Animated.View>
              </View>
            ) : null
          }
        />

        {/* Input */}
        <View style={styles.inputContainer}>
          <View style={styles.inputWrap}>
            <TextInput
              style={styles.input}
              placeholder="Ask me anything..."
              placeholderTextColor={Colors.textMuted}
              value={input}
              onChangeText={setInput}
              multiline
              maxLength={500}
              returnKeyType="send"
              onSubmitEditing={() => sendMessage(input)}
            />
            <TouchableOpacity
              style={[styles.sendBtn, !input.trim() && styles.sendBtnDisabled]}
              onPress={() => sendMessage(input)}
              disabled={!input.trim()}
            >
              <Ionicons name="send" size={18} color={input.trim() ? Colors.textPrimary : Colors.textMuted} />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    
      <PaywallModal
        visible={showPaywall}
        onClose={dismissPaywall}
        feature={paywallFeature}
        singlePrice={singlePrice}
      />
    </ChatWallpaperBackground>
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
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
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
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  headerAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.secondary + "20",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.glowBorder,
  },
  headerTitle: {
    fontSize: FontSize.md,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  headerStatus: {
    fontSize: FontSize.xs,
    color: Colors.success,
  },
  clearBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  quickActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  quickActionChip: {
    backgroundColor: Colors.surfaceCard,
    borderRadius: BorderRadius.full,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  quickActionText: {
    fontSize: FontSize.sm,
    color: Colors.textPrimary,
  },
  messagesList: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    paddingBottom: 20,
  },
  messageBubble: {
    marginBottom: 16,
  },
  userBubble: {
    alignItems: "flex-end",
  },
  aiBubble: {
    alignItems: "flex-start",
  },
  aiAvatar: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: Colors.secondary + "20",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  bubbleContent: {
    maxWidth: "85%",
    borderRadius: BorderRadius.lg,
    padding: 12,
  },
  userContent: {
    backgroundColor: Colors.secondary,
    borderBottomRightRadius: 4,
  },
  aiContent: {
    backgroundColor: Colors.surfaceCard,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  messageText: {
    fontSize: FontSize.sm,
    color: Colors.textPrimary,
    lineHeight: 20,
  },
  userText: {
    color: Colors.textPrimary,
  },
  timestamp: {
    fontSize: 10,
    color: Colors.textMuted,
    marginTop: 4,
    alignSelf: "flex-end",
  },
  suggestionsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 8,
    maxWidth: "85%",
  },
  suggestionChip: {
    backgroundColor: Colors.secondary + "15",
    borderRadius: BorderRadius.full,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: Colors.glowBorder,
  },
  suggestionText: {
    fontSize: FontSize.xs,
    color: Colors.secondary,
    fontWeight: "500",
  },
  typingIndicator: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 8,
  },
  typingDots: {
    flexDirection: "row",
    gap: 4,
    backgroundColor: Colors.surfaceCard,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.textMuted,
  },
  inputContainer: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.primary,
  },
  inputWrap: {
    flexDirection: "row",
    alignItems: "flex-end",
    backgroundColor: Colors.surfaceCard,
    borderRadius: BorderRadius.xl,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 8,
  },
  input: {
    flex: 1,
    fontSize: FontSize.md,
    color: Colors.textPrimary,
    maxHeight: 100,
    paddingVertical: 6,
  },
  sendBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Colors.secondary,
    alignItems: "center",
    justifyContent: "center",
  },
  sendBtnDisabled: {
    backgroundColor: Colors.border,
  },
});
