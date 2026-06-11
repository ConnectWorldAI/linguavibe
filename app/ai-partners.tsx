/**
 * AI Conversation Partners — Named AI characters with persistent memory
 * 
 * Features:
 * - Named characters (strict French professor, chill Brazilian surfer, Tokyo street vendor, etc.)
 * - Persistent conversation memory per character
 * - Adaptive difficulty based on user level
 * - Character personality and teaching style
 * - Conversation history with each partner
 */

import React, { useCallback, useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { trpc } from "@/lib/trpc";
import { useAudioPlayer, setAudioModeAsync } from "expo-audio";

// ─── Types ───────────────────────────────────────────────────────────────────

interface AIPartner {
  id: string;
  name: string;
  emoji: string;
  language: string;
  personality: string;
  description: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  accent: string;
  greeting: string;
  topics: string[];
  color: string;
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

interface ConversationState {
  partnerId: string;
  messages: Message[];
  lastActive: number;
  sessionCount: number;
  userLevel: number;
}

// ─── AI Partner Data ─────────────────────────────────────────────────────────

const AI_PARTNERS: AIPartner[] = [
  {
    id: "prof_dubois",
    name: "Prof. Dubois",
    emoji: "🎓",
    language: "French",
    personality: "Strict but caring French professor who insists on perfect grammar",
    description: "A meticulous Parisian professor who corrects every mistake but celebrates every breakthrough. 20 years teaching at the Sorbonne.",
    difficulty: "intermediate",
    accent: "Parisian",
    greeting: "Bonjour! Je suis Professeur Dubois. Today we shall work on your conjugations. No shortcuts!",
    topics: ["Grammar", "Literature", "Formal French", "Business French"],
    color: "#1E3A5F",
  },
  {
    id: "lucas_surf",
    name: "Lucas",
    emoji: "🏄",
    language: "Portuguese",
    personality: "Chill Brazilian surfer who teaches through stories and slang",
    description: "Born in Florianópolis, raised on the beach. Teaches Brazilian Portuguese through surf culture, music, and street slang.",
    difficulty: "beginner",
    accent: "Brazilian (Southern)",
    greeting: "E aí, beleza? I'm Lucas! Let's learn some Portuguese the fun way — no textbooks, just vibes! 🤙",
    topics: ["Slang", "Music", "Culture", "Street Portuguese"],
    color: "#2D8B4E",
  },
  {
    id: "yuki_vendor",
    name: "Yuki",
    emoji: "🏮",
    language: "Japanese",
    personality: "Energetic Tokyo street vendor who teaches practical daily Japanese",
    description: "Runs a yakitori stand in Shibuya. Teaches the Japanese you actually need — ordering food, asking directions, making friends.",
    difficulty: "beginner",
    accent: "Tokyo",
    greeting: "いらっしゃい! Welcome! I'm Yuki! Forget textbook Japanese — I'll teach you how real Tokyoites talk! 🍢",
    topics: ["Daily Life", "Food", "Shopping", "Casual Speech"],
    color: "#C41E3A",
  },
  {
    id: "carmen_abuela",
    name: "Carmen",
    emoji: "👵",
    language: "Spanish",
    personality: "Warm Mexican grandmother who teaches through cooking and family stories",
    description: "A loving abuela from Oaxaca who teaches Spanish through recipes, family traditions, and the wisdom of generations.",
    difficulty: "beginner",
    accent: "Mexican (Oaxacan)",
    greeting: "¡Mijo/Mija! Ven, siéntate. Let me teach you Spanish the way my abuela taught me — with love and good food! 🫶",
    topics: ["Family", "Cooking", "Traditions", "Mexican Slang"],
    color: "#D4A017",
  },
  {
    id: "hans_engineer",
    name: "Hans",
    emoji: "⚙️",
    language: "German",
    personality: "Precise German engineer who teaches through logic and structure",
    description: "A Munich-based automotive engineer. Teaches German with engineering precision — every rule has a reason, every exception has an explanation.",
    difficulty: "advanced",
    accent: "Bavarian (Standard)",
    greeting: "Guten Tag! I'm Hans. German grammar is like engineering — complex but perfectly logical. Let's build your skills systematically.",
    topics: ["Technical", "Business", "Grammar Rules", "Compound Words"],
    color: "#333333",
  },
  {
    id: "amara_poet",
    name: "Amara",
    emoji: "📜",
    language: "Arabic",
    personality: "Poetic Arabic storyteller who teaches through ancient tales and modern media",
    description: "A Cairo-born poet and journalist. Bridges classical Arabic beauty with modern Egyptian dialect through storytelling.",
    difficulty: "intermediate",
    accent: "Egyptian",
    greeting: "أهلاً وسهلاً! I'm Amara. Arabic is the language of poetry — let me show you its beauty through stories old and new! ✨",
    topics: ["Poetry", "Media", "Dialect", "Calligraphy"],
    color: "#6B3FA0",
  },
  {
    id: "jin_gamer",
    name: "Jin",
    emoji: "🎮",
    language: "Korean",
    personality: "Korean esports commentator who teaches through gaming and K-pop culture",
    description: "Former StarCraft pro turned language teacher. Teaches Korean through gaming terms, K-pop lyrics, and internet culture.",
    difficulty: "intermediate",
    accent: "Seoul",
    greeting: "안녕! I'm Jin! Let's learn Korean through the stuff that actually matters — games, K-pop, and memes! GG! 🎮",
    topics: ["Gaming", "K-pop", "Internet Culture", "Slang"],
    color: "#FF6B35",
  },
  {
    id: "sofia_dancer",
    name: "Sofia",
    emoji: "💃",
    language: "Spanish",
    personality: "Fiery Argentine tango dancer who teaches through music, dance, and passion",
    description: "A Buenos Aires tango instructor. Teaches Rioplatense Spanish through the rhythm of tango, Lunfardo slang, and porteño attitude.",
    difficulty: "advanced",
    accent: "Argentine (Porteño)",
    greeting: "¡Che, qué hacés! Soy Sofía. Forget boring Spanish — I'll teach you how we really talk in Buenos Aires. With passion! 💃",
    topics: ["Lunfardo", "Tango", "Argentine Culture", "Voseo"],
    color: "#8B0000",
  },
];

const STORAGE_KEY = "@ai_partners_conversations";

// ─── Component ───────────────────────────────────────────────────────────────

export default function AIPartnersScreen() {
  const colors = useColors();
  const router = useRouter();
  const [selectedPartner, setSelectedPartner] = useState<AIPartner | null>(null);
  const [conversations, setConversations] = useState<Record<string, ConversationState>>({});
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    if (selectedPartner) {
      const convo = conversations[selectedPartner.id];
      if (convo) {
        setMessages(convo.messages);
      } else {
        // Start with greeting
        const greetingMsg: Message = {
          id: `msg_${Date.now()}`,
          role: "assistant",
          content: selectedPartner.greeting,
          timestamp: Date.now(),
        };
        setMessages([greetingMsg]);
      }
    }
  }, [selectedPartner, conversations]);

  const loadConversations = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        setConversations(JSON.parse(stored));
      }
    } catch {}
  };

  const saveConversation = async (partnerId: string, msgs: Message[]) => {
    try {
      const updated = {
        ...conversations,
        [partnerId]: {
          partnerId,
          messages: msgs.slice(-50), // Keep last 50 messages for memory
          lastActive: Date.now(),
          sessionCount: (conversations[partnerId]?.sessionCount || 0) + 1,
          userLevel: conversations[partnerId]?.userLevel || 1,
        },
      };
      setConversations(updated);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {}
  };

  // ─── tRPC mutations for real LLM chat ───────────────────────────────────
  const chatMutation = trpc.aiPartners.chat.useMutation();
  const memoryMutation = trpc.aiPartners.extractMemory.useMutation();
  const [memoryContext, setMemoryContext] = useState<string>("");
  const [showMemoryCard, setShowMemoryCard] = useState(false);
  const [editingMemory, setEditingMemory] = useState(false);
  const [editedMemory, setEditedMemory] = useState("");
  const [showTimeline, setShowTimeline] = useState(false);
  const [memoryTimeline, setMemoryTimeline] = useState<Array<{ id: string; date: number; facts: string[]; sessionCount: number }>>([]);

  // Load memory context from AsyncStorage
  useEffect(() => {
    if (selectedPartner) {
      AsyncStorage.getItem(`@ai_partner_memory_${selectedPartner.id}`).then((stored) => {
        if (stored) setMemoryContext(stored);
        else setMemoryContext("");
      }).catch(() => {});
      AsyncStorage.getItem(`@ai_partner_timeline_${selectedPartner.id}`).then((stored) => {
        if (stored) setMemoryTimeline(JSON.parse(stored));
        else setMemoryTimeline([]);
      }).catch(() => {});
    }
  }, [selectedPartner]);

  const generateAIResponse = useCallback(async (partner: AIPartner, userMsg: string, history: Message[]) => {
    setIsTyping(true);
    try {
      const convo = conversations[partner.id];
      const conversationHistory = history.slice(-20).map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      }));

      const result = await chatMutation.mutateAsync({
        partnerId: partner.id,
        message: userMsg,
        conversationHistory,
        userLevel: partner.difficulty,
        sessionCount: convo?.sessionCount || 1,
        memoryContext,
      });

      // Extract memory every 10 messages to build long-term context
      if (history.length > 0 && history.length % 10 === 0) {
        try {
          const memResult = await memoryMutation.mutateAsync({
            partnerId: partner.id,
            recentMessages: conversationHistory.slice(-10),
            existingMemory: memoryContext,
          });
          if (memResult.memory) {
            setMemoryContext(memResult.memory);
            await AsyncStorage.setItem(`@ai_partner_memory_${partner.id}`, memResult.memory);
            const timelineEntry = { id: `mem_${Date.now()}`, date: Date.now(), facts: memResult.memory.split("\n").filter(Boolean).map((l: string) => l.replace(/^[-•]\s*/, "")), sessionCount: conversations[partner.id]?.messages?.length || 0 };
            const updatedTimeline = [...memoryTimeline, timelineEntry].slice(-50);
            setMemoryTimeline(updatedTimeline);
            await AsyncStorage.setItem(`@ai_partner_timeline_${partner.id}`, JSON.stringify(updatedTimeline));
          }
        } catch {} // Memory extraction is best-effort
      }

      setIsTyping(false);
      return result.response;
    } catch (error) {
      setIsTyping(false);
      // Fallback to a simple in-character response if server is unavailable
      return "I got a bit distracted — could you say that again?";
    }
  }, [conversations, memoryContext, chatMutation, memoryMutation]);

  const handleSend = useCallback(async () => {
    if (!inputText.trim() || !selectedPartner || isTyping) return;

    const userMessage: Message = {
      id: `msg_${Date.now()}_user`,
      role: "user",
      content: inputText.trim(),
      timestamp: Date.now(),
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInputText("");

    // Generate AI response
    const aiResponse = await generateAIResponse(selectedPartner, inputText.trim(), updatedMessages);
    
    const aiMessage: Message = {
      id: `msg_${Date.now()}_ai`,
      role: "assistant",
      content: aiResponse,
      timestamp: Date.now(),
    };

    const finalMessages = [...updatedMessages, aiMessage];
    setMessages(finalMessages);
    await saveConversation(selectedPartner.id, finalMessages);

    // Scroll to bottom
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
  }, [inputText, selectedPartner, messages, isTyping, generateAIResponse, saveConversation]);

  const renderPartnerCard = ({ item }: { item: AIPartner }) => {
    const convo = conversations[item.id];
    const hasHistory = convo && convo.messages.length > 0;

    return (
      <TouchableOpacity
        style={[styles.partnerCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
        onPress={() => setSelectedPartner(item)}
        activeOpacity={0.7}
      >
        <View style={[styles.partnerAvatar, { backgroundColor: item.color + "20" }]}>
          <Text style={styles.partnerEmoji}>{item.emoji}</Text>
        </View>
        <View style={styles.partnerInfo}>
          <View style={styles.partnerNameRow}>
            <Text style={[styles.partnerName, { color: colors.foreground }]}>{item.name}</Text>
            <View style={[styles.langBadge, { backgroundColor: item.color + "20" }]}>
              <Text style={[styles.langText, { color: item.color }]}>{item.language}</Text>
            </View>
          </View>
          <Text style={[styles.partnerDesc, { color: colors.muted }]} numberOfLines={2}>
            {item.personality}
          </Text>
          <View style={styles.partnerMeta}>
            <View style={[styles.difficultyBadge, { 
              backgroundColor: item.difficulty === "beginner" ? colors.success + "20" : 
                item.difficulty === "intermediate" ? colors.warning + "20" : colors.error + "20" 
            }]}>
              <Text style={[styles.difficultyText, {
                color: item.difficulty === "beginner" ? colors.success :
                  item.difficulty === "intermediate" ? colors.warning : colors.error
              }]}>
                {item.difficulty.charAt(0).toUpperCase() + item.difficulty.slice(1)}
              </Text>
            </View>
            {hasHistory && (
              <Text style={[styles.sessionCount, { color: colors.muted }]}>
                {convo.sessionCount} sessions
              </Text>
            )}
          </View>
        </View>
        <Ionicons name="chevron-forward" size={18} color={colors.muted} />
      </TouchableOpacity>
    );
  };

  // ─── Voice Playback State ─────────────────────────────────────────────────
  const [playingMessageId, setPlayingMessageId] = useState<string | null>(null);
  const [loadingAudioId, setLoadingAudioId] = useState<string | null>(null);
  const [currentAudioUrl, setCurrentAudioUrl] = useState<string>("");
  const audioPlayer = useAudioPlayer(currentAudioUrl || undefined);
  const speakMutation = trpc.aiPartners.speak.useMutation();

  // Set up audio mode for playback
  useEffect(() => {
    setAudioModeAsync({ playsInSilentMode: true }).catch(() => {});
  }, []);

  // Handle audio playback state
  useEffect(() => {
    if (audioPlayer && currentAudioUrl) {
      audioPlayer.play();
    }
  }, [currentAudioUrl]);

  const handlePlayVoice = useCallback(async (message: Message) => {
    if (!selectedPartner) return;
    if (playingMessageId === message.id) {
      // Stop playing
      audioPlayer?.pause();
      setPlayingMessageId(null);
      setCurrentAudioUrl("");
      return;
    }

    setLoadingAudioId(message.id);
    try {
      const result = await speakMutation.mutateAsync({
        partnerId: selectedPartner.id,
        text: message.content,
      });

      if (result.audioUrl) {
        setCurrentAudioUrl(result.audioUrl);
        setPlayingMessageId(message.id);
      }
    } catch {
      // TTS unavailable — fail silently
    } finally {
      setLoadingAudioId(null);
    }
  }, [selectedPartner, playingMessageId, audioPlayer, speakMutation]);

  const renderMessage = ({ item }: { item: Message }) => (
    <View style={[
      styles.messageBubble,
      item.role === "user" ? styles.userBubble : styles.aiBubble,
      {
        backgroundColor: item.role === "user" ? colors.primary : colors.surface,
        borderColor: item.role === "user" ? colors.primary : colors.border,
      },
    ]}>
      <Text style={[
        styles.messageText,
        { color: item.role === "user" ? "#fff" : colors.foreground },
      ]}>
        {item.content}
      </Text>
      <View style={styles.messageFooter}>
        <Text style={[styles.messageTime, { color: item.role === "user" ? "#ffffff80" : colors.muted }]}>
          {new Date(item.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </Text>
        {item.role === "assistant" && (
          <TouchableOpacity
            onPress={() => handlePlayVoice(item)}
            style={[styles.playButton, { backgroundColor: (playingMessageId === item.id ? colors.primary : colors.muted) + "20" }]}
            activeOpacity={0.7}
          >
            {loadingAudioId === item.id ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <Ionicons
                name={playingMessageId === item.id ? "stop" : "volume-high"}
                size={14}
                color={playingMessageId === item.id ? colors.primary : colors.muted}
              />
            )}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  // ─── Chat View ─────────────────────────────────────────────────────────────

  if (selectedPartner) {
    return (
      <ScreenContainer edges={["top", "left", "right"]}>
        <KeyboardAvoidingView
          style={styles.flex1}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          keyboardVerticalOffset={90}
        >
          {/* Chat Header */}
          <View style={[styles.chatHeader, { borderBottomColor: colors.border }]}>
            <TouchableOpacity onPress={() => setSelectedPartner(null)} style={styles.backButton} activeOpacity={0.7}>
              <Ionicons name="chevron-back" size={24} color={colors.foreground} />
            </TouchableOpacity>
            <View style={[styles.chatAvatar, { backgroundColor: selectedPartner.color + "20" }]}>
              <Text style={styles.chatAvatarEmoji}>{selectedPartner.emoji}</Text>
            </View>
            <View style={styles.chatHeaderInfo}>
              <Text style={[styles.chatHeaderName, { color: colors.foreground }]}>{selectedPartner.name}</Text>
              <Text style={[styles.chatHeaderLang, { color: colors.muted }]}>
                {selectedPartner.language} • {selectedPartner.accent}
              </Text>
            </View>
            <TouchableOpacity style={styles.infoButton} activeOpacity={0.7} onPress={() => { setShowMemoryCard(!showMemoryCard); setEditedMemory(memoryContext); }}>
              <Ionicons name={showMemoryCard ? "close-circle" : "brain-outline"} size={24} color={colors.primary} />
            </TouchableOpacity>
          </View>

          {/* Memory Card */}
          {showMemoryCard && (
            <View style={[styles.memoryCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.memoryCardHeader}>
                <View style={styles.memoryCardTitleRow}>
                  <Ionicons name="brain" size={18} color={colors.primary} />
                  <Text style={[styles.memoryCardTitle, { color: colors.foreground }]}>
                    What I Remember About You
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => {
                    if (editingMemory) {
                      // Save edited memory
                      setMemoryContext(editedMemory);
                      AsyncStorage.setItem(`@ai_partner_memory_${selectedPartner.id}`, editedMemory).catch(() => {});
                      setEditingMemory(false);
                    } else {
                      setEditingMemory(true);
                    }
                  }}
                  activeOpacity={0.7}
                >
                  <Ionicons name={editingMemory ? "checkmark-circle" : "create-outline"} size={20} color={colors.primary} />
                </TouchableOpacity>
              </View>
              {memoryContext ? (
                editingMemory ? (
                  <TextInput
                    style={[styles.memoryEditInput, { color: colors.foreground, backgroundColor: colors.background, borderColor: colors.border }]}
                    value={editedMemory}
                    onChangeText={setEditedMemory}
                    multiline
                    placeholder="Edit what the AI remembers about you..."
                    placeholderTextColor={colors.muted}
                  />
                ) : (
                  <ScrollView style={styles.memoryScrollView} nestedScrollEnabled>
                    {memoryContext.split("\n").filter(Boolean).map((line, i) => (
                      <View key={i} style={styles.memoryItem}>
                        <Ionicons name="ellipse" size={6} color={colors.primary} style={{ marginTop: 6 }} />
                        <Text style={[styles.memoryItemText, { color: colors.foreground }]}>{line.replace(/^[-•]\s*/, "")}</Text>
                      </View>
                    ))}
                  </ScrollView>
                )
              ) : (
                <View style={styles.memoryEmpty}>
                  <Ionicons name="chatbubble-ellipses-outline" size={24} color={colors.muted} />
                  <Text style={[styles.memoryEmptyText, { color: colors.muted }]}>
                    Keep chatting! {selectedPartner.name} will start remembering things about you after a few conversations.
                  </Text>
                </View>
              )}
              <View style={[styles.memoryFooter, { borderTopColor: colors.border }]}>
                <Text style={[styles.memoryFooterText, { color: colors.muted }]}>
                  {conversations[selectedPartner.id]?.sessionCount || 0} sessions • Memory updates every 10 messages
                </Text>
                {memoryContext ? (
                  <>
                    <TouchableOpacity
                      onPress={() => {
                        setMemoryContext("");
                        setEditedMemory("");
                        AsyncStorage.removeItem(`@ai_partner_memory_${selectedPartner.id}`);
                        AsyncStorage.removeItem(`@ai_partner_timeline_${selectedPartner.id}`).catch(() => {});
                        setMemoryTimeline([]); //.catch(() => {});
                      }}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.memoryClearText, { color: colors.error }]}>Clear Memory</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setShowTimeline(!showTimeline)} activeOpacity={0.7}>
                      <Text style={[styles.memoryClearText, { color: colors.primary }]}>{showTimeline ? "Hide Timeline" : "View Timeline"}</Text>
                    </TouchableOpacity>
                  </>
                ) : null}
              </View>
            </View>
          )}

          {/* Messages */}
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderMessage}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.messagesContent}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
          />

          {/* Typing Indicator */}
          {isTyping && (
            <View style={[styles.typingIndicator, { backgroundColor: colors.surface }]}>
              <Text style={[styles.typingText, { color: colors.muted }]}>
                {selectedPartner.name} is typing...
              </Text>
              <ActivityIndicator size="small" color={colors.primary} />
            </View>
          )}

          {/* Input Bar */}
          <View style={[styles.inputBar, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
            <TextInput
              style={[styles.textInput, { backgroundColor: colors.surface, color: colors.foreground }]}
              placeholder={`Message ${selectedPartner.name}...`}
              placeholderTextColor={colors.muted}
              value={inputText}
              onChangeText={setInputText}
              multiline
              maxLength={500}
              returnKeyType="send"
              onSubmitEditing={handleSend}
            />
            <TouchableOpacity
              style={[styles.sendButton, { backgroundColor: inputText.trim() ? colors.primary : colors.muted + "30" }]}
              onPress={handleSend}
              disabled={!inputText.trim() || isTyping}
              activeOpacity={0.7}
            >
              <Ionicons name="send" size={18} color={inputText.trim() ? "#fff" : colors.muted} />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </ScreenContainer>
    );
  }

  // ─── Partner Selection View ────────────────────────────────────────────────

  return (
    <ScreenContainer edges={["top", "left", "right"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>AI Partners</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Intro */}
      <View style={styles.introSection}>
        <Text style={[styles.introTitle, { color: colors.foreground }]}>
          Choose Your Conversation Partner
        </Text>
        <Text style={[styles.introSubtitle, { color: colors.muted }]}>
          Each AI character has a unique personality, teaching style, and remembers your past conversations.
        </Text>
      </View>

      {/* Partners List */}
      <FlatList
        data={AI_PARTNERS}
        renderItem={renderPartnerCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </ScreenContainer>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  flex1: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: { fontSize: 18, fontWeight: "700" },
  introSection: { paddingHorizontal: 20, paddingBottom: 16 },
  introTitle: { fontSize: 22, fontWeight: "800", marginBottom: 6 },
  introSubtitle: { fontSize: 14, lineHeight: 20 },
  listContent: { padding: 16, gap: 12, paddingBottom: 100 },
  partnerCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 14,
    borderWidth: 0.5,
    gap: 12,
  },
  partnerAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
  },
  partnerEmoji: { fontSize: 26 },
  partnerInfo: { flex: 1, gap: 4 },
  partnerNameRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  partnerName: { fontSize: 16, fontWeight: "700" },
  langBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  langText: { fontSize: 10, fontWeight: "600" },
  partnerDesc: { fontSize: 12, lineHeight: 16 },
  partnerMeta: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 2 },
  difficultyBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  difficultyText: { fontSize: 10, fontWeight: "600" },
  sessionCount: { fontSize: 10 },
  // Chat styles
  chatHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 0.5,
    gap: 10,
  },
  chatAvatar: { width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center" },
  chatAvatarEmoji: { fontSize: 20 },
  chatHeaderInfo: { flex: 1 },
  chatHeaderName: { fontSize: 16, fontWeight: "700" },
  chatHeaderLang: { fontSize: 11 },
  infoButton: { padding: 4 },
  messagesContent: { padding: 16, gap: 8, paddingBottom: 20 },
  messageBubble: {
    maxWidth: "80%",
    padding: 12,
    borderRadius: 16,
    borderWidth: 0.5,
  },
  userBubble: { alignSelf: "flex-end", borderBottomRightRadius: 4 },
  aiBubble: { alignSelf: "flex-start", borderBottomLeftRadius: 4 },
  messageText: { fontSize: 15, lineHeight: 21 },
  messageTime: { fontSize: 10, marginTop: 4, alignSelf: "flex-end" },
  typingIndicator: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  typingText: { fontSize: 12 },
  inputBar: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: 0.5,
    gap: 8,
  },
  textInput: {
    flex: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    maxHeight: 100,
  },
  sendButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
  messageFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 4,
    gap: 8,
  },
  playButton: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  // Memory Card styles
  memoryCard: {
    marginHorizontal: 12,
    marginTop: 8,
    marginBottom: 4,
    borderRadius: 14,
    borderWidth: 0.5,
    padding: 14,
    gap: 10,
  },
  memoryCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  memoryCardTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  memoryCardTitle: {
    fontSize: 14,
    fontWeight: "700",
  },
  memoryScrollView: {
    maxHeight: 150,
  },
  memoryItem: {
    flexDirection: "row",
    gap: 8,
    paddingVertical: 3,
  },
  memoryItemText: {
    fontSize: 13,
    lineHeight: 18,
    flex: 1,
  },
  memoryEditInput: {
    borderRadius: 10,
    borderWidth: 0.5,
    padding: 10,
    fontSize: 13,
    lineHeight: 18,
    minHeight: 80,
    maxHeight: 150,
    textAlignVertical: "top",
  },
  memoryEmpty: {
    alignItems: "center",
    gap: 8,
    paddingVertical: 12,
  },
  memoryEmptyText: {
    fontSize: 12,
    textAlign: "center",
    lineHeight: 18,
  },
  memoryFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderTopWidth: 0.5,
    paddingTop: 8,
  },
  memoryFooterText: {
    fontSize: 10,
  },
  memoryClearText: {
    fontSize: 11,
    fontWeight: "600",
  },
});
