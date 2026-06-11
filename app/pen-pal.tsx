import React, { useState, useEffect, useRef } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Platform, FlatList, TextInput, KeyboardAvoidingView, Animated } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { trpc } from "@/lib/trpc";
import { ScreenContainer } from "@/components/screen-container";
import { Colors, Spacing, BorderRadius, FontSize } from "../constants/Colors";
import { usePaywallGate } from "@/hooks/use-paywall-gate";
import { PaywallModal } from "@/components/paywall-modal";
import { ReportAIResponse } from "@/components/report-ai-response";
import { useChatWallpaper } from "@/hooks/use-chat-wallpaper";
import { ChatWallpaperBackground } from "@/components/chat-wallpaper-background";

type MessageType = "text" | "correction" | "voice" | "challenge";

interface Message {
  id: string; text: string; sender: "user" | "penpal"; type: MessageType; timestamp: number;
  translatedText?: string; showTranslation?: boolean; originalText?: string; explanation?: string;
  duration?: number; isPlaying?: boolean; challengeTask?: string;
}

interface Persona {
  id: string; name: string; emoji: string; flag: string; personality: string; language: string;
  description: string; teachingStyle: string; starters: string[]; initialMessages: Message[];
}

const PERSONAS: Persona[] = [
  {
    id: "carlos", name: "Carlos", emoji: "🧢", flag: "🇩🇴", personality: "Dominican slang teen", language: "Spanish",
    description: "High energy, uses lots of slang, loves talking about music and baseball.",
    teachingStyle: "Casual, corrects you like a friend would, focuses on street smarts.",
    starters: ["Ask about local food", "Discuss weekend plans", "Talk about favorite music"],
    initialMessages: [
      { id: "c1", text: "¡Klk mi loco! ¿Todo bien?", sender: "penpal", type: "text", timestamp: Date.now() - 10000, translatedText: "What's up crazy! All good?" },
      { id: "c2", text: "I'm Carlos, ready to help you sound like a real dominicano.", sender: "penpal", type: "text", timestamp: Date.now() - 5000 },
    ],
  },
  {
    id: "marie", name: "Marie", emoji: "👩‍💼", flag: "🇫🇷", personality: "Parisian professional", language: "French",
    description: "Elegant, precise, works in fashion, loves discussing art and culture.",
    teachingStyle: "Strict but polite, focuses on formal grammar and pronunciation.",
    starters: ["Practice ordering at restaurant", "Discuss art exhibition", "Ask for fashion advice"],
    initialMessages: [
      { id: "m1", text: "Bonjour. Je m'appelle Marie.", sender: "penpal", type: "text", timestamp: Date.now() - 10000, translatedText: "Hello. My name is Marie." },
      { id: "m2", text: "Let's refine your French together.", sender: "penpal", type: "text", timestamp: Date.now() - 5000 },
    ],
  },
  {
    id: "kenji", name: "Kenji", emoji: "🎧", flag: "🇯🇵", personality: "Tokyo student", language: "Japanese",
    description: "Tech-savvy, anime fan, studies engineering, stays up late.",
    teachingStyle: "Patient, uses anime references to explain concepts.",
    starters: ["Talk about anime", "Ask about university life", "Discuss technology"],
    initialMessages: [
      { id: "k1", text: "ヤッホー！健司だよ。", sender: "penpal", type: "text", timestamp: Date.now() - 10000, translatedText: "Yahoo! I'm Kenji." },
      { id: "k2", text: "I can help you with casual Japanese!", sender: "penpal", type: "text", timestamp: Date.now() - 5000 },
    ],
  },
  {
    id: "amara", name: "Amara", emoji: "👵🏾", flag: "🇳🇬", personality: "Lagos elder/storyteller", language: "Yoruba/English",
    description: "Wise, warm, tells great stories, loves cooking and family.",
    teachingStyle: "Encouraging, uses proverbs, focuses on cultural context.",
    starters: ["Ask for a proverb", "Discuss family traditions", "Talk about cooking"],
    initialMessages: [
      { id: "a1", text: "Bawo ni, my child?", sender: "penpal", type: "text", timestamp: Date.now() - 10000, translatedText: "How are you, my child?" },
      { id: "a2", text: "Come, let me share some wisdom with you.", sender: "penpal", type: "text", timestamp: Date.now() - 5000 },
    ],
  },
  {
    id: "priya", name: "Priya", emoji: "🎒", flag: "🇮🇳", personality: "Mumbai traveler", language: "Hindi",
    description: "Adventurous, food blogger, always on the move, energetic.",
    teachingStyle: "Enthusiastic, practical phrases for traveling.",
    starters: ["Ask about street food", "Discuss travel destinations", "Learn bargaining phrases"],
    initialMessages: [
      { id: "p1", text: "Namaste! Ready for an adventure?", sender: "penpal", type: "text", timestamp: Date.now() - 10000, translatedText: "Hello! Ready for an adventure?" },
      { id: "p2", text: "I'll teach you Hindi you can actually use on the streets!", sender: "penpal", type: "text", timestamp: Date.now() - 5000 },
    ],
  },
  {
    id: "luca", name: "Luca", emoji: "👨‍🍳", flag: "🇮🇹", personality: "Roman chef", language: "Italian",
    description: "Passionate, loud, obsessed with authentic recipes, hates pineapple on pizza.",
    teachingStyle: "Expressive, uses hand gestures (emojis), focuses on food vocabulary.",
    starters: ["Ask for a recipe", "Discuss Italian coffee", "Debate pizza toppings"],
    initialMessages: [
      { id: "l1", text: "Ciao bello! Hai fame?", sender: "penpal", type: "text", timestamp: Date.now() - 10000, translatedText: "Hello beautiful! Are you hungry?" },
      { id: "l2", text: "Let's talk about real Italian food!", sender: "penpal", type: "text", timestamp: Date.now() - 5000 },
    ],
  },
];

export default function PenPalScreen() {
  const { theme: chatWallpaper } = useChatWallpaper("pen-pal");

  const { showPaywall, paywallFeature, singlePrice, checkAccess, dismissPaywall } = usePaywallGate();

  const [selectedPersonaId, setSelectedPersonaId] = useState<string>(PERSONAS[0].id);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  
  const flatListRef = useRef<FlatList>(null);
  const recordingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const typingAnim = useRef(new Animated.Value(0)).current;

  const selectedPersona = PERSONAS.find((p) => p.id === selectedPersonaId) || PERSONAS[0];

  useEffect(() => { loadMessages(selectedPersonaId); }, [selectedPersonaId]);

  useEffect(() => {
    if (isTyping) {
      Animated.loop(Animated.sequence([
        Animated.timing(typingAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.timing(typingAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
      ])).start();
    } else { typingAnim.setValue(0); }
  }, [isTyping]);

  const loadMessages = async (personaId: string) => {
    try {
      const stored = await AsyncStorage.getItem(`@penpal_messages_${personaId}`);
      if (stored) setMessages(JSON.parse(stored));
      else {
        const initial = PERSONAS.find((p) => p.id === personaId)?.initialMessages || [];
        setMessages(initial); saveMessages(personaId, initial);
      }
    } catch (e) { console.error("Failed to load messages", e); }
  };

  const saveMessages = async (personaId: string, msgs: Message[]) => {
    try { await AsyncStorage.setItem(`@penpal_messages_${personaId}`, JSON.stringify(msgs.slice(-50))); }
    catch (e) { console.error("Failed to save messages", e); }
  };

  const handleSend = async () => {
    if (!checkAccess("credits", "ai_chat")) return;

    if (!inputText.trim()) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const newUserMsg: Message = { id: Date.now().toString(), text: inputText.trim(), sender: "user", type: "text", timestamp: Date.now() };
    const updatedMessages = [...messages, newUserMsg];
    setMessages(updatedMessages); setInputText(""); saveMessages(selectedPersonaId, updatedMessages);
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    setIsTyping(true);
    setTimeout(() => { setIsTyping(false); generatePenPalResponse(newUserMsg.text, updatedMessages); }, 1500 + Math.random() * 1000);
  };

  const chatMutation = trpc.teacher.chat.useMutation();
  const generatePenPalResponse = async (userText: string, currentMessages: Message[]) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const systemPrompt = `You are a pen pal named ${selectedPersona.name}. Personality: ${selectedPersona.personality}. You speak ${selectedPersona.language}. Respond naturally as a pen pal friend. Sometimes correct the user's language mistakes (mark as correction), sometimes give daily challenges. Keep responses concise (1-3 sentences). Respond in a mix of ${selectedPersona.language} and English.`;
      const result = await chatMutation.mutateAsync({
        message: userText,
        teacherPersona: systemPrompt,
        conversationHistory: currentMessages.slice(-10).map(m => ({ role: m.sender === 'user' ? 'user' as const : 'assistant' as const, content: m.text })),
      });
      const responseText = (result as any).response || (result as any).reply || "That's interesting! Tell me more.";
      const isCorrection = responseText.toLowerCase().includes('correction') || responseText.toLowerCase().includes('mistake') || responseText.toLowerCase().includes('better way');
      const isChallenge = responseText.toLowerCase().includes('challenge') || responseText.toLowerCase().includes('try to');
      let newMsg: Message;
      if (isCorrection) {
        newMsg = { id: Date.now().toString(), text: responseText, sender: "penpal", type: "correction", timestamp: Date.now(), originalText: userText, translatedText: responseText, explanation: "AI-powered correction" };
      } else if (isChallenge) {
        newMsg = { id: Date.now().toString(), text: responseText, sender: "penpal", type: "challenge", timestamp: Date.now(), challengeTask: responseText };
      } else {
        newMsg = { id: Date.now().toString(), text: responseText, sender: "penpal", type: "text", timestamp: Date.now(), translatedText: responseText };
      }
      const updatedMessages = [...currentMessages, newMsg];
      setMessages(updatedMessages); saveMessages(selectedPersonaId, updatedMessages);
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    } catch {
      // Fallback to simple response on error
      const newMsg: Message = { id: Date.now().toString(), text: `That's interesting! As a ${selectedPersona.personality}, I'd love to hear more about that.`, sender: "penpal", type: "text", timestamp: Date.now(), translatedText: "Fallback response" };
      const updatedMessages = [...currentMessages, newMsg];
      setMessages(updatedMessages); saveMessages(selectedPersonaId, updatedMessages);
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    }
  };

  const toggleTranslation = (msgId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setMessages((prev) => prev.map((msg) => msg.id === msgId ? { ...msg, showTranslation: !msg.showTranslation } : msg));
  };

  const toggleRecording = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    if (isRecording) {
      setIsRecording(false);
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      if (recordingTime > 0) {
        const newVoiceMsg: Message = { id: Date.now().toString(), text: "Voice message", sender: "user", type: "voice", timestamp: Date.now(), duration: recordingTime, isPlaying: false };
        const updatedMessages = [...messages, newVoiceMsg];
        setMessages(updatedMessages); saveMessages(selectedPersonaId, updatedMessages); setRecordingTime(0);
        setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
        setIsTyping(true);
        setTimeout(() => { setIsTyping(false); generatePenPalResponse("Voice message received", updatedMessages); }, 2000);
      }
    } else {
      setIsRecording(true); setRecordingTime(0);
      recordingTimerRef.current = setInterval(() => setRecordingTime((prev) => prev + 1), 1000);
    }
  };

  const formatTime = (seconds: number) => `${Math.floor(seconds / 60)}:${seconds % 60 < 10 ? "0" : ""}${seconds % 60}`;

  const renderMessage = ({ item }: { item: Message }) => {
    const isUser = item.sender === "user";
    return (
      <View style={[styles.messageWrapper, isUser ? styles.messageWrapperUser : styles.messageWrapperPenpal]}>
        {!isUser && <View style={styles.messageAvatar}><Text style={styles.messageAvatarEmoji}>{selectedPersona.emoji}</Text></View>}
        <View style={styles.messageContentWrapper}>
          <TouchableOpacity activeOpacity={0.8} onPress={() => !isUser && item.translatedText && toggleTranslation(item.id)}
            style={[styles.messageBubble, isUser ? styles.messageBubbleUser : styles.messageBubblePenpal, item.type === "correction" && styles.messageBubbleCorrection, item.type === "challenge" && styles.messageBubbleChallenge]}>
            {item.type === "text" && <Text style={[styles.messageText, isUser ? styles.messageTextUser : styles.messageTextPenpal]}>{item.text}</Text>}
            {item.type === "correction" && (
              <View>
                <View style={styles.correctionHeader}><Ionicons name="bulb" size={16} color={Colors.warning} /><Text style={styles.correctionTitle}>Correction</Text></View>
                <Text style={styles.correctionOriginal}>"{item.originalText}"</Text><Text style={styles.correctionCorrected}>{item.translatedText}</Text><Text style={styles.correctionExplanation}>{item.explanation}</Text>
              </View>
            )}
            {item.type === "challenge" && (
              <View>
                <View style={styles.challengeHeader}><Ionicons name="star" size={16} color="#B142FF" /><Text style={styles.challengeTitle}>Daily Challenge</Text></View>
                <Text style={styles.challengeText}>{item.challengeTask}</Text>
                <TouchableOpacity style={styles.challengeBtn}><Text style={styles.challengeBtnText}>Accept Challenge</Text></TouchableOpacity>
              </View>
            )}
            {item.type === "voice" && (
              <View style={styles.voiceContainer}>
                <TouchableOpacity style={styles.voicePlayBtn}><Ionicons name="play" size={20} color={isUser ? Colors.primary : Colors.textPrimary} /></TouchableOpacity>
                <View style={styles.voiceWaveform}>{[1, 2, 3, 4, 5, 6, 7, 8].map((i) => <View key={i} style={[styles.voiceBar, { height: 10 + Math.random() * 15, backgroundColor: isUser ? Colors.primary : Colors.secondary }]} />)}</View>
                <Text style={[styles.voiceDuration, isUser ? { color: Colors.primary } : {}]}>{formatTime(item.duration || 0)}</Text>
              </View>
            )}
          </TouchableOpacity>
          {item.showTranslation && item.translatedText && item.type === "text" && (
            <View style={styles.translationContainer}><Ionicons name="language" size={14} color={Colors.textSecondary} /><Text style={styles.translationText}>{item.translatedText}</Text></View>
          )}
          {isUser && (
            <View style={styles.readReceiptContainer}>
              <Text style={styles.messageTime}>{new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
              <Ionicons name="checkmark-done" size={14} color={Colors.secondary} style={styles.readReceipt} />
            </View>
          )}
          {!isUser && <ReportAIResponse messageContent={item.text} size="small" />}
        </View>
      </View>
    );
  };

  return (
    <ScreenContainer>
    <ChatWallpaperBackground theme={chatWallpaper} fallbackColor="#0A1628">
      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}><Ionicons name="chevron-back" size={24} color={Colors.textPrimary} /></TouchableOpacity>
          <View style={styles.headerTitleContainer}><Text style={styles.title}>AI Pen Pal</Text><View style={styles.onlineIndicatorContainer}><View style={styles.onlineDot} /><Text style={styles.onlineText}>Online</Text></View></View>
          <TouchableOpacity style={styles.settingsBtn}><Ionicons name="ellipsis-horizontal" size={24} color={Colors.textPrimary} /></TouchableOpacity>
        </View>

        <View style={styles.personaSelectorContainer}>
          <FlatList horizontal showsHorizontalScrollIndicator={false} data={PERSONAS} keyExtractor={(item) => item.id} contentContainerStyle={styles.personaList}
            renderItem={({ item }) => {
              const isSelected = item.id === selectedPersonaId;
              return (
                <TouchableOpacity style={[styles.personaItem, isSelected && styles.personaItemSelected]} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setSelectedPersonaId(item.id); }}>
                  <View style={styles.personaEmojiContainer}><Text style={styles.personaEmoji}>{item.emoji}</Text><View style={styles.personaFlagBadge}><Text style={styles.personaFlag}>{item.flag}</Text></View></View>
                  <Text style={[styles.personaName, isSelected && styles.personaNameSelected]}>{item.name}</Text><Text style={styles.personaLanguage}>{item.language}</Text>
                </TouchableOpacity>
              );
            }}
          />
          <View style={styles.personaInfoContainer}><Text style={styles.personaDescription}>{selectedPersona.description}</Text><Text style={styles.personaTeachingStyle}>Style: {selectedPersona.teachingStyle}</Text></View>
        </View>

        <FlatList ref={flatListRef} data={messages} keyExtractor={(item) => item.id} renderItem={renderMessage} contentContainerStyle={styles.chatContainer} onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })} />

        {isTyping && (
          <View style={styles.typingIndicatorContainer}>
            <View style={styles.messageAvatar}><Text style={styles.messageAvatarEmoji}>{selectedPersona.emoji}</Text></View>
            <View style={styles.typingBubble}>
              <Animated.View style={[styles.typingDot, { opacity: typingAnim }]} /><Animated.View style={[styles.typingDot, { opacity: typingAnim, animationDelay: "150ms" as any }]} /><Animated.View style={[styles.typingDot, { opacity: typingAnim, animationDelay: "300ms" as any }]} />
            </View>
          </View>
        )}

        <View style={styles.startersContainer}>
          <FlatList horizontal showsHorizontalScrollIndicator={false} data={selectedPersona.starters} keyExtractor={(item, index) => index.toString()}
            renderItem={({ item }) => <TouchableOpacity style={styles.starterChip} onPress={() => setInputText(item)}><Text style={styles.starterText}>{item}</Text></TouchableOpacity>}
          />
        </View>

        <View style={styles.inputContainer}>
          {isRecording ? (
            <View style={styles.recordingContainer}>
              <View style={styles.recordingIndicator}><View style={styles.recordingDot} /><Text style={styles.recordingTime}>{formatTime(recordingTime)}</Text></View>
              <Text style={styles.recordingHelpText}>Tap mic to stop</Text>
            </View>
          ) : (
            <TextInput style={styles.textInput} placeholder={`Message ${selectedPersona.name}...`} placeholderTextColor={Colors.textMuted} value={inputText} onChangeText={setInputText} multiline maxLength={500} />
          )}
          <View style={styles.inputActions}>
            {!inputText.trim() && !isRecording ? (
              <TouchableOpacity style={styles.micBtn} onPress={toggleRecording}><Ionicons name="mic" size={24} color={Colors.textPrimary} /></TouchableOpacity>
            ) : isRecording ? (
              <TouchableOpacity style={[styles.micBtn, styles.micBtnRecording]} onPress={toggleRecording}><Ionicons name="stop" size={24} color={Colors.textPrimary} /></TouchableOpacity>
            ) : (
              <TouchableOpacity style={styles.sendBtn} onPress={handleSend}><Ionicons name="send" size={20} color={Colors.primary} /></TouchableOpacity>
            )}
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
</ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.primary },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.surfaceElevated },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.surfaceCard, alignItems: "center", justifyContent: "center" },
  headerTitleContainer: { alignItems: "center" },
  title: { fontSize: FontSize.lg, fontWeight: "700", color: Colors.textPrimary },
  onlineIndicatorContainer: { flexDirection: "row", alignItems: "center", marginTop: 2 },
  onlineDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.success, marginRight: 4 },
  onlineText: { fontSize: FontSize.xs, color: Colors.textSecondary },
  settingsBtn: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  personaSelectorContainer: { backgroundColor: Colors.surfaceCard, borderBottomWidth: 1, borderBottomColor: Colors.border, paddingBottom: Spacing.md },
  personaList: { paddingHorizontal: Spacing.md, paddingTop: Spacing.md, paddingBottom: Spacing.sm },
  personaItem: { alignItems: "center", marginHorizontal: Spacing.sm, width: 70, opacity: 0.6 },
  personaItemSelected: { opacity: 1 },
  personaEmojiContainer: { width: 56, height: 56, borderRadius: 28, backgroundColor: Colors.surfaceElevated, alignItems: "center", justifyContent: "center", marginBottom: Spacing.xs, borderWidth: 2, borderColor: "transparent" },
  personaEmoji: { fontSize: 28 },
  personaFlagBadge: { position: "absolute", bottom: -2, right: -2, backgroundColor: Colors.surfaceCard, borderRadius: 10, width: 20, height: 20, alignItems: "center", justifyContent: "center" },
  personaFlag: { fontSize: 12 },
  personaName: { fontSize: FontSize.sm, color: Colors.textSecondary, fontWeight: "500" },
  personaNameSelected: { color: Colors.secondary, fontWeight: "700" },
  personaLanguage: { fontSize: FontSize.xs, color: Colors.textMuted },
  personaInfoContainer: { paddingHorizontal: Spacing.lg, marginTop: Spacing.xs },
  personaDescription: { fontSize: FontSize.sm, color: Colors.textPrimary, marginBottom: 2 },
  personaTeachingStyle: { fontSize: FontSize.xs, color: Colors.textSecondary, fontStyle: "italic" },
  chatContainer: { padding: Spacing.md, paddingBottom: Spacing.xxl },
  messageWrapper: { flexDirection: "row", marginBottom: Spacing.md, maxWidth: "100%" },
  messageWrapperUser: { justifyContent: "flex-end" },
  messageWrapperPenpal: { justifyContent: "flex-start" },
  messageAvatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.surfaceElevated, alignItems: "center", justifyContent: "center", marginRight: Spacing.sm, alignSelf: "flex-end" },
  messageAvatarEmoji: { fontSize: 16 },
  messageContentWrapper: { maxWidth: "80%" },
  messageBubble: { padding: Spacing.md, borderRadius: BorderRadius.lg },
  messageBubbleUser: { backgroundColor: Colors.secondary, borderBottomRightRadius: 4 },
  messageBubblePenpal: { backgroundColor: Colors.surfaceElevated, borderBottomLeftRadius: 4, borderWidth: 1, borderColor: Colors.border },
  messageBubbleCorrection: { borderColor: Colors.warning, borderWidth: 1, backgroundColor: "rgba(255, 214, 0, 0.1)" },
  messageBubbleChallenge: { borderColor: "#B142FF", borderWidth: 1, backgroundColor: "rgba(177, 66, 255, 0.1)" },
  messageText: { fontSize: FontSize.md, lineHeight: 22 },
  messageTextUser: { color: Colors.primary, fontWeight: "500" },
  messageTextPenpal: { color: Colors.textPrimary },
  correctionHeader: { flexDirection: "row", alignItems: "center", marginBottom: Spacing.xs },
  correctionTitle: { color: Colors.warning, fontWeight: "700", fontSize: FontSize.sm, marginLeft: 4 },
  correctionOriginal: { color: Colors.textMuted, textDecorationLine: "line-through", fontSize: FontSize.sm, marginBottom: 2 },
  correctionCorrected: { color: Colors.success, fontWeight: "600", fontSize: FontSize.md, marginBottom: Spacing.xs },
  correctionExplanation: { color: Colors.textSecondary, fontSize: FontSize.sm, fontStyle: "italic" },
  challengeHeader: { flexDirection: "row", alignItems: "center", marginBottom: Spacing.xs },
  challengeTitle: { color: "#B142FF", fontWeight: "700", fontSize: FontSize.sm, marginLeft: 4 },
  challengeText: { color: Colors.textPrimary, fontSize: FontSize.md, marginBottom: Spacing.md },
  challengeBtn: { backgroundColor: "#B142FF", paddingVertical: Spacing.sm, paddingHorizontal: Spacing.md, borderRadius: BorderRadius.full, alignItems: "center" },
  challengeBtnText: { color: Colors.textPrimary, fontWeight: "600", fontSize: FontSize.sm },
  voiceContainer: { flexDirection: "row", alignItems: "center", width: 180 },
  voicePlayBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center", marginRight: Spacing.sm },
  voiceWaveform: { flexDirection: "row", alignItems: "center", flex: 1, height: 30 },
  voiceBar: { width: 3, borderRadius: 1.5, marginHorizontal: 2 },
  voiceDuration: { fontSize: FontSize.xs, color: Colors.textSecondary, marginLeft: Spacing.sm },
  translationContainer: { flexDirection: "row", alignItems: "flex-start", marginTop: Spacing.xs, paddingHorizontal: Spacing.sm },
  translationText: { color: Colors.textSecondary, fontSize: FontSize.sm, marginLeft: 4, flex: 1 },
  readReceiptContainer: { flexDirection: "row", alignItems: "center", justifyContent: "flex-end", marginTop: 4 },
  messageTime: { fontSize: 10, color: Colors.textMuted },
  readReceipt: { marginLeft: 4 },
  typingIndicatorContainer: { flexDirection: "row", alignItems: "flex-end", paddingHorizontal: Spacing.md, marginBottom: Spacing.md },
  typingBubble: { backgroundColor: Colors.surfaceElevated, borderRadius: BorderRadius.lg, borderBottomLeftRadius: 4, padding: Spacing.md, flexDirection: "row", alignItems: "center", width: 60, justifyContent: "space-between", borderWidth: 1, borderColor: Colors.border },
  typingDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.textSecondary },
  startersContainer: { paddingHorizontal: Spacing.md, paddingBottom: Spacing.sm },
  starterChip: { backgroundColor: Colors.surfaceElevated, borderWidth: 1, borderColor: Colors.border, borderRadius: BorderRadius.full, paddingVertical: Spacing.sm, paddingHorizontal: Spacing.md, marginRight: Spacing.sm },
  starterText: { color: Colors.secondary, fontSize: FontSize.sm, fontWeight: "500" },
  inputContainer: { flexDirection: "row", alignItems: "flex-end", paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, paddingBottom: Platform.OS === "ios" ? Spacing.xl : Spacing.md, backgroundColor: Colors.surfaceCard, borderTopWidth: 1, borderTopColor: Colors.border },
  textInput: { flex: 1, backgroundColor: Colors.surfaceElevated, borderRadius: BorderRadius.lg, paddingHorizontal: Spacing.md, paddingTop: 12, paddingBottom: 12, color: Colors.textPrimary, fontSize: FontSize.md, maxHeight: 100, minHeight: 44 },
  recordingContainer: { flex: 1, backgroundColor: "rgba(255, 45, 45, 0.1)", borderRadius: BorderRadius.lg, paddingHorizontal: Spacing.md, height: 44, flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderWidth: 1, borderColor: "rgba(255, 45, 45, 0.3)" },
  recordingIndicator: { flexDirection: "row", alignItems: "center" },
  recordingDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.accent, marginRight: Spacing.sm },
  recordingTime: { color: Colors.accent, fontWeight: "600", fontSize: FontSize.md },
  recordingHelpText: { color: Colors.textMuted, fontSize: FontSize.sm },
  inputActions: { marginLeft: Spacing.sm, justifyContent: "center", height: 44 },
  sendBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.secondary, alignItems: "center", justifyContent: "center", shadowColor: Colors.glow, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.5, shadowRadius: 8, elevation: 4 },
  micBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.surfaceElevated, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: Colors.border },
  micBtnRecording: { backgroundColor: Colors.accent, borderColor: Colors.accent },
});
