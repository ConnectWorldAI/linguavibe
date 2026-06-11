import { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Image,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";
import Animated, { FadeInDown, FadeIn } from "react-native-reanimated";
import {
  useAudioRecorder,
  useAudioRecorderState,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  createAudioPlayer,
  RecordingPresets,
} from "expo-audio";
import { Colors, Spacing, BorderRadius, FontSize } from "@/constants/Colors";
import { useChatWallpaper } from "@/hooks/use-chat-wallpaper";
import { ChatWallpaperBackground } from "@/components/chat-wallpaper-background";

const PARTNER_CHATS_KEY = "@linguavibe_partner_chats";

interface ChatMessage {
  id: string;
  text: string;
  senderId: string;
  timestamp: number;
  translated?: string;
  showTranslation?: boolean;
  type: "text" | "correction" | "audio" | "system";
  correctedText?: string;
  audioUri?: string;
  audioDuration?: number;
}

interface Partner {
  id: string;
  name: string;
  avatar: string;
  nativeLanguage: string;
  learningLanguage: string;
  flag: string;
  online: boolean;
  lastSeen?: string;
}

const SAMPLE_PARTNERS: Partner[] = [
  { id: "p1", name: "Maria Garcia", avatar: "👩🏽", nativeLanguage: "Spanish", learningLanguage: "English", flag: "🇲🇽", online: true },
  { id: "p2", name: "Yuki Tanaka", avatar: "👩🏻", nativeLanguage: "Japanese", learningLanguage: "English", flag: "🇯🇵", online: false, lastSeen: "2h ago" },
  { id: "p3", name: "Pierre Dubois", avatar: "👨🏼", nativeLanguage: "French", learningLanguage: "Spanish", flag: "🇫🇷", online: true },
  { id: "p4", name: "Ana Silva", avatar: "👩🏽", nativeLanguage: "Portuguese", learningLanguage: "English", flag: "🇧🇷", online: false, lastSeen: "30m ago" },
  { id: "p5", name: "Kim Soo-jin", avatar: "👩🏻", nativeLanguage: "Korean", learningLanguage: "English", flag: "🇰🇷", online: true },
];

const SAMPLE_MESSAGES: Record<string, ChatMessage[]> = {
  p1: [
    { id: "m1", text: "Hola! Cómo estás hoy?", senderId: "p1", timestamp: Date.now() - 3600000, type: "text", translated: "Hello! How are you today?" },
    { id: "m2", text: "I'm doing great! Practicing my Spanish.", senderId: "me", timestamp: Date.now() - 3500000, type: "text", translated: "¡Estoy muy bien! Practicando mi español." },
    { id: "m3", text: "Muy bien! Tu español está mejorando mucho.", senderId: "p1", timestamp: Date.now() - 3400000, type: "text", translated: "Very good! Your Spanish is improving a lot." },
    { id: "m4", text: "Yo quiero practicar más con frases comunes", senderId: "me", timestamp: Date.now() - 3300000, type: "text", translated: "I want to practice more with common phrases" },
    { id: "m5", text: "Perfecto! Podemos hablar sobre la comida dominicana 🍽️", senderId: "p1", timestamp: Date.now() - 3200000, type: "text", translated: "Perfect! We can talk about Dominican food 🍽️" },
    { id: "m6", text: "", senderId: "system", timestamp: Date.now() - 3100000, type: "system", correctedText: "Maria corrected your message: 'Yo quiero' → 'Quiero' (subject pronoun is optional in Spanish)" },
  ],
  p3: [
    { id: "m1", text: "Bonjour! Comment allez-vous?", senderId: "p3", timestamp: Date.now() - 7200000, type: "text", translated: "Hello! How are you?" },
    { id: "m2", text: "Très bien, merci! Et vous?", senderId: "me", timestamp: Date.now() - 7100000, type: "text", translated: "Very well, thank you! And you?" },
  ],
};

export default function PartnerChatScreen() {
  const { theme: chatWallpaper } = useChatWallpaper("partner-chat");

  const params = useLocalSearchParams<{ partnerId?: string }>();
  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [showTranslateAll, setShowTranslateAll] = useState(false);
  const [showCorrectionMode, setShowCorrectionMode] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const recordingTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(audioRecorder, 100);
  const currentPlayer = useRef<ReturnType<typeof createAudioPlayer> | null>(null);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    if (params.partnerId) {
      const partner = SAMPLE_PARTNERS.find(p => p.id === params.partnerId);
      if (partner) {
        setSelectedPartner(partner);
        setMessages(SAMPLE_MESSAGES[partner.id] || []);
      }
    }
  }, [params.partnerId]);

  const sendMessage = useCallback(() => {
    if (!inputText.trim() || !selectedPartner) return;
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      text: inputText.trim(),
      senderId: "me",
      timestamp: Date.now(),
      type: "text",
    };
    setMessages(prev => [...prev, newMsg]);
    setInputText("");

    // Simulate partner reply after 2s
    setTimeout(() => {
      const replies = [
        { text: "¡Muy bien dicho! 👏", translated: "Very well said! 👏" },
        { text: "Excelente pronunciación!", translated: "Excellent pronunciation!" },
        { text: "Sigue practicando así 💪", translated: "Keep practicing like that 💪" },
        { text: "Me gusta cómo lo dices!", translated: "I like how you say it!" },
      ];
      const reply = replies[Math.floor(Math.random() * replies.length)];
      const replyMsg: ChatMessage = {
        id: `msg-${Date.now()}-reply`,
        text: reply.text,
        senderId: selectedPartner.id,
        timestamp: Date.now(),
        type: "text",
        translated: reply.translated,
      };
      setMessages(prev => [...prev, replyMsg]);
    }, 2000);
  }, [inputText, selectedPartner]);

  const toggleTranslation = (msgId: string) => {
    setMessages(prev => prev.map(m =>
      m.id === msgId ? { ...m, showTranslation: !m.showTranslation } : m
    ));
  };

  // ─── Voice Message Recording ─────────────────────────────────────────────
  const startRecording = useCallback(async () => {
    try {
      const perm = await requestRecordingPermissionsAsync();
      if (!perm.granted) {
        Alert.alert("Permission Required", "Microphone access is needed to record voice messages.");
        return;
      }
      await setAudioModeAsync({ playsInSilentMode: true, allowsRecording: true } as any);
      audioRecorder.prepareToRecordAsync();
      audioRecorder.record();
      setIsRecording(true);
      setRecordingDuration(0);
      recordingTimer.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
      if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (e) {
      console.warn("Recording failed:", e);
    }
  }, [audioRecorder]);

  const stopRecording = useCallback(async () => {
    try {
      audioRecorder.stop();
      if (recordingTimer.current) {
        clearInterval(recordingTimer.current);
        recordingTimer.current = null;
      }
      setIsRecording(false);
      const uri = audioRecorder.uri;
      if (uri && selectedPartner) {
        if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        const voiceMsg: ChatMessage = {
          id: `voice-${Date.now()}`,
          text: "🎤 Voice message",
          senderId: "me",
          timestamp: Date.now(),
          type: "audio",
          audioUri: uri,
          audioDuration: recordingDuration,
        };
        setMessages(prev => [...prev, voiceMsg]);
        setRecordingDuration(0);

        // Simulate partner voice reply
        setTimeout(() => {
          const replyMsg: ChatMessage = {
            id: `voice-reply-${Date.now()}`,
            text: "🎤 Voice message",
            senderId: selectedPartner.id,
            timestamp: Date.now(),
            type: "audio",
            audioDuration: Math.floor(Math.random() * 8) + 3,
            translated: "Great pronunciation! Keep practicing.",
          };
          setMessages(prev => [...prev, replyMsg]);
        }, 2500);
      }
    } catch (e) {
      console.warn("Stop recording failed:", e);
      setIsRecording(false);
    }
  }, [audioRecorder, recordingDuration, selectedPartner]);

  const cancelRecording = useCallback(() => {
    try {
      audioRecorder.stop();
    } catch {}
    if (recordingTimer.current) {
      clearInterval(recordingTimer.current);
      recordingTimer.current = null;
    }
    setIsRecording(false);
    setRecordingDuration(0);
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [audioRecorder]);

  const playVoiceMessage = useCallback(async (msg: ChatMessage) => {
    try {
      // Stop any currently playing audio
      if (currentPlayer.current) {
        currentPlayer.current.remove();
        currentPlayer.current = null;
      }
      if (playingAudioId === msg.id) {
        setPlayingAudioId(null);
        return;
      }
      if (msg.audioUri) {
        await setAudioModeAsync({ playsInSilentMode: true } as any);
        const player = createAudioPlayer({ uri: msg.audioUri });
        currentPlayer.current = player;
        setPlayingAudioId(msg.id);
        player.play();
        // Auto-stop after duration
        setTimeout(() => {
          player.remove();
          currentPlayer.current = null;
          setPlayingAudioId(null);
        }, (msg.audioDuration || 5) * 1000);
      } else {
        // Simulated playback for partner messages without real URI
        setPlayingAudioId(msg.id);
        if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setTimeout(() => {
          setPlayingAudioId(null);
        }, (msg.audioDuration || 5) * 1000);
      }
    } catch (e) {
      console.warn("Playback failed:", e);
      setPlayingAudioId(null);
    }
  }, [playingAudioId]);

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recordingTimer.current) clearInterval(recordingTimer.current);
      if (currentPlayer.current) currentPlayer.current.remove();
    };
  }, []);

  const sendCorrection = useCallback((originalMsg: ChatMessage) => {
    if (!selectedPartner) return;
    Alert.prompt(
      "Correct Message",
      `Original: "${originalMsg.text}"\nProvide the corrected version:`,
      (corrected) => {
        if (!corrected) return;
        const correctionMsg: ChatMessage = {
          id: `corr-${Date.now()}`,
          text: "",
          senderId: "me",
          timestamp: Date.now(),
          type: "correction",
          correctedText: `You corrected: "${originalMsg.text}" → "${corrected}"`,
        };
        setMessages(prev => [...prev, correctionMsg]);
      }
    ) || Alert.alert("Correction", "Long-press a message to correct it on your device.");
  }, [selectedPartner]);

  // Partner list view
  if (!selectedPartner) {
    return (
      <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Partner Chat</Text>
          <TouchableOpacity onPress={() => router.push("/language-exchange" as any)} style={styles.findButton}>
            <Ionicons name="person-add" size={20} color={Colors.secondary} />
          </TouchableOpacity>
        </View>

        <FlatList
          data={SAMPLE_PARTNERS}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.partnerList}
          renderItem={({ item, index }) => (
            <Animated.View entering={FadeInDown.delay(index * 80)}>
              <TouchableOpacity
                style={styles.partnerCard}
                onPress={() => {
                  setSelectedPartner(item);
                  setMessages(SAMPLE_MESSAGES[item.id] || []);
                }}
              >
                <View style={styles.partnerAvatarContainer}>
                  <Text style={styles.partnerAvatar}>{item.avatar}</Text>
                  {item.online && <View style={styles.onlineDot} />}
                </View>
                <View style={styles.partnerInfo}>
                  <View style={styles.partnerNameRow}>
                    <Text style={styles.partnerName}>{item.name}</Text>
                    <Text style={styles.partnerFlag}>{item.flag}</Text>
                  </View>
                  <Text style={styles.partnerLanguages}>
                    Speaks {item.nativeLanguage} · Learning {item.learningLanguage}
                  </Text>
                  {!item.online && item.lastSeen && (
                    <Text style={styles.lastSeen}>Last seen {item.lastSeen}</Text>
                  )}
                </View>
                <Ionicons name="chatbubble-ellipses" size={20} color={Colors.secondary} />
              </TouchableOpacity>
            </Animated.View>
          )}
          ListHeaderComponent={
            <View style={styles.partnerListHeader}>
              <Text style={styles.partnerListTitle}>Your Language Partners</Text>
              <Text style={styles.partnerListSubtitle}>
                Chat with native speakers to practice your target language
              </Text>
            </View>
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="people-outline" size={48} color={Colors.textSecondary} />
              <Text style={styles.emptyText}>No partners yet</Text>
              <TouchableOpacity
                style={styles.findPartnersButton}
                onPress={() => router.push("/language-exchange" as any)}
              >
                <Text style={styles.findPartnersText}>Find Partners</Text>
              </TouchableOpacity>
            </View>
          }
        />
      </SafeAreaView>
    );
  }

  // Chat view
  const renderMessage = ({ item }: { item: ChatMessage }) => {
    const isMe = item.senderId === "me";
    const isSystem = item.type === "system" || item.type === "correction";

    if (isSystem) {
      return (
        <View style={styles.systemMessage}>
          <Ionicons name={item.type === "correction" ? "school" : "information-circle"} size={14} color={Colors.gold} />
          <Text style={styles.systemMessageText}>{item.correctedText || item.text}</Text>
        </View>
      );
    }

    // Audio message rendering
    if (item.type === "audio") {
      const isPlaying = playingAudioId === item.id;
      return (
        <TouchableOpacity
          style={[styles.messageBubble, isMe ? styles.myMessage : styles.theirMessage, styles.voiceBubble]}
          onPress={() => playVoiceMessage(item)}
          onLongPress={() => item.translated && toggleTranslation(item.id)}
          activeOpacity={0.7}
        >
          <View style={styles.voiceRow}>
            <Ionicons
              name={isPlaying ? "pause-circle" : "play-circle"}
              size={32}
              color={isMe ? "#fff" : Colors.secondary}
            />
            <View style={styles.voiceWaveform}>
              {[0.4, 0.7, 0.5, 0.9, 0.6, 0.8, 0.3, 0.7, 0.5, 0.6, 0.8, 0.4].map((h, i) => (
                <View
                  key={i}
                  style={[
                    styles.waveBar,
                    {
                      height: h * 24,
                      backgroundColor: isMe ? "rgba(255,255,255,0.6)" : Colors.secondary + "60",
                      opacity: isPlaying ? 1 : 0.5,
                    },
                  ]}
                />
              ))}
            </View>
            <Text style={[styles.voiceDuration, isMe && { color: "rgba(255,255,255,0.7)" }]}>
              {formatDuration(item.audioDuration || 0)}
            </Text>
          </View>
          {item.showTranslation && item.translated && (
            <View style={styles.translationContainer}>
              <View style={styles.translationDivider} />
              <Text style={[styles.translationText, isMe && styles.myTranslationText]}>
                {item.translated}
              </Text>
            </View>
          )}
          <View style={styles.messageFooter}>
            <Text style={[styles.messageTime, isMe && styles.myMessageTime]}>
              {new Date(item.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </Text>
            {item.translated && (
              <Ionicons name="language" size={10} color={isMe ? "rgba(255,255,255,0.5)" : Colors.textSecondary} />
            )}
          </View>
        </TouchableOpacity>
      );
    }

    return (
      <TouchableOpacity
        style={[styles.messageBubble, isMe ? styles.myMessage : styles.theirMessage]}
        onPress={() => item.translated && toggleTranslation(item.id)}
        onLongPress={() => !isMe && sendCorrection(item)}
        activeOpacity={0.8}
      >
        <Text style={[styles.messageText, isMe && styles.myMessageText]}>{item.text}</Text>
        {item.showTranslation && item.translated && (
          <View style={styles.translationContainer}>
            <View style={styles.translationDivider} />
            <Text style={[styles.translationText, isMe && styles.myTranslationText]}>
              {item.translated}
            </Text>
          </View>
        )}
        <View style={styles.messageFooter}>
          <Text style={[styles.messageTime, isMe && styles.myMessageTime]}>
            {new Date(item.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </Text>
          {item.translated && (
            <Ionicons name="language" size={10} color={isMe ? "rgba(255,255,255,0.5)" : Colors.textSecondary} />
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <ChatWallpaperBackground theme={chatWallpaper} fallbackColor="#0A1628">
      {/* Chat Header */}
      <View style={styles.chatHeader}>
        <TouchableOpacity onPress={() => setSelectedPartner(null)} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <View style={styles.chatHeaderInfo}>
          <Text style={styles.chatHeaderAvatar}>{selectedPartner.avatar}</Text>
          <View>
            <Text style={styles.chatHeaderName}>{selectedPartner.name} {selectedPartner.flag}</Text>
            <Text style={styles.chatHeaderStatus}>
              {selectedPartner.online ? "Online" : `Last seen ${selectedPartner.lastSeen || "recently"}`}
            </Text>
          </View>
        </View>
        <View style={styles.chatHeaderActions}>
          <TouchableOpacity
            style={styles.headerAction}
            onPress={() => setShowTranslateAll(!showTranslateAll)}
          >
            <Ionicons name="language" size={20} color={showTranslateAll ? Colors.secondary : Colors.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerAction}>
            <Ionicons name="call" size={20} color={Colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Translation Hint */}
      <View style={styles.translationHint}>
        <Ionicons name="information-circle" size={14} color={Colors.secondary} />
        <Text style={styles.translationHintText}>Tap any message to see translation · Long-press to correct</Text>
      </View>

      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={item => item.id}
        renderItem={renderMessage}
        contentContainerStyle={styles.messageList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        ListEmptyComponent={
          <View style={styles.emptyChat}>
            <Text style={styles.emptyChatEmoji}>{selectedPartner.avatar}</Text>
            <Text style={styles.emptyChatText}>Start chatting with {selectedPartner.name}!</Text>
            <Text style={styles.emptyChatHint}>Practice your {selectedPartner.nativeLanguage} skills</Text>
          </View>
        }
      />

      {/* Quick Phrases */}
      <ScrollableQuickPhrases
        language={selectedPartner.nativeLanguage}
        onSelect={(phrase) => {
          setInputText(phrase);
        }}
      />

      {/* Recording Overlay */}
      {isRecording && (
        <View style={styles.recordingOverlay}>
          <View style={styles.recordingPulse}>
            <Ionicons name="mic" size={28} color="#fff" />
          </View>
          <View style={styles.recordingInfo}>
            <Text style={styles.recordingTimer}>{formatDuration(recordingDuration)}</Text>
            <Text style={styles.recordingHint}>Release to send · Swipe left to cancel</Text>
          </View>
          <View style={styles.recordingActions}>
            <TouchableOpacity onPress={cancelRecording} style={styles.cancelRecordBtn}>
              <Ionicons name="close-circle" size={36} color={Colors.accent} />
            </TouchableOpacity>
            <TouchableOpacity onPress={stopRecording} style={styles.stopRecordBtn}>
              <Ionicons name="checkmark-circle" size={44} color={Colors.success} />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Input Bar */}
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={90}
      >
        <View style={styles.inputBar}>
          <TouchableOpacity
            style={[styles.inputAction, isRecording && styles.inputActionRecording]}
            onPress={isRecording ? stopRecording : startRecording}
            onLongPress={startRecording}
          >
            <Ionicons name={isRecording ? "stop" : "mic"} size={22} color={isRecording ? Colors.accent : Colors.secondary} />
          </TouchableOpacity>
          {!isRecording && (
            <>
              <TextInput
                style={styles.textInput}
                value={inputText}
                onChangeText={setInputText}
                placeholder={`Message ${selectedPartner.name}...`}
                placeholderTextColor={Colors.textSecondary}
                multiline
                maxLength={500}
                returnKeyType="send"
                onSubmitEditing={sendMessage}
              />
              <TouchableOpacity
                style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
                onPress={sendMessage}
                disabled={!inputText.trim()}
              >
                <Ionicons name="send" size={18} color={inputText.trim() ? "#fff" : Colors.textSecondary} />
              </TouchableOpacity>
            </>
          )}
        </View>
      </KeyboardAvoidingView>
      </ChatWallpaperBackground>
</SafeAreaView>
  );
}

function ScrollableQuickPhrases({ language, onSelect }: { language: string; onSelect: (phrase: string) => void }) {
  const phrases: Record<string, string[]> = {
    Spanish: ["¿Cómo se dice...?", "¿Puedes repetir?", "No entiendo", "¡Muy bien!", "¿Qué significa...?"],
    French: ["Comment dit-on...?", "Pouvez-vous répéter?", "Je ne comprends pas", "Très bien!", "Que signifie...?"],
    Japanese: ["どういう意味ですか？", "もう一度お願いします", "わかりません", "すごい！", "どう言いますか？"],
    Portuguese: ["Como se diz...?", "Pode repetir?", "Não entendo", "Muito bem!", "O que significa...?"],
    Korean: ["무슨 뜻이에요?", "다시 말해주세요", "이해 못 했어요", "잘했어요!", "어떻게 말해요?"],
  };

  const currentPhrases = phrases[language] || phrases.Spanish || [];

  return (
    <FlatList
      horizontal
      data={currentPhrases}
      keyExtractor={(item, i) => `phrase-${i}`}
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.quickPhraseContainer}
      renderItem={({ item }) => (
        <TouchableOpacity style={styles.quickPhrase} onPress={() => onSelect(item)}>
          <Text style={styles.quickPhraseText}>{item}</Text>
        </TouchableOpacity>
      )}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm },
  backButton: { padding: 8 },
  headerTitle: { flex: 1, fontSize: FontSize.xl, fontWeight: "700", color: Colors.text, marginLeft: 8 },
  findButton: { padding: 8 },
  partnerList: { paddingHorizontal: Spacing.md, paddingBottom: 100 },
  partnerListHeader: { marginBottom: Spacing.md },
  partnerListTitle: { fontSize: 18, fontWeight: "700", color: Colors.text },
  partnerListSubtitle: { fontSize: 13, color: Colors.textSecondary, marginTop: 4 },
  partnerCard: { flexDirection: "row", alignItems: "center", backgroundColor: Colors.card, borderRadius: BorderRadius.lg, padding: Spacing.md, marginBottom: 10, borderWidth: 1, borderColor: Colors.border },
  partnerAvatarContainer: { position: "relative" },
  partnerAvatar: { fontSize: 36 },
  onlineDot: { position: "absolute", bottom: 0, right: 0, width: 12, height: 12, borderRadius: 6, backgroundColor: Colors.success, borderWidth: 2, borderColor: Colors.card },
  partnerInfo: { flex: 1, marginLeft: 12 },
  partnerNameRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  partnerName: { fontSize: 16, fontWeight: "600", color: Colors.text },
  partnerFlag: { fontSize: 16 },
  partnerLanguages: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  lastSeen: { fontSize: 11, color: Colors.textSecondary, marginTop: 2 },
  emptyContainer: { alignItems: "center", paddingTop: 60, gap: 12 },
  emptyText: { fontSize: 16, color: Colors.textSecondary },
  findPartnersButton: { backgroundColor: Colors.secondary, paddingHorizontal: 24, paddingVertical: 10, borderRadius: 20 },
  findPartnersText: { color: "#fff", fontWeight: "600" },
  chatHeader: { flexDirection: "row", alignItems: "center", paddingHorizontal: Spacing.sm, paddingVertical: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.border },
  chatHeaderInfo: { flex: 1, flexDirection: "row", alignItems: "center", gap: 10, marginLeft: 4 },
  chatHeaderAvatar: { fontSize: 32 },
  chatHeaderName: { fontSize: 16, fontWeight: "600", color: Colors.text },
  chatHeaderStatus: { fontSize: 12, color: Colors.success },
  chatHeaderActions: { flexDirection: "row", gap: 4 },
  headerAction: { padding: 8 },
  translationHint: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: Spacing.md, paddingVertical: 6, backgroundColor: Colors.card },
  translationHintText: { fontSize: 11, color: Colors.textSecondary },
  messageList: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, flexGrow: 1 },
  messageBubble: { maxWidth: "78%", paddingHorizontal: 14, paddingVertical: 10, borderRadius: 18, marginBottom: 8 },
  myMessage: { alignSelf: "flex-end", backgroundColor: Colors.secondary, borderBottomRightRadius: 4 },
  theirMessage: { alignSelf: "flex-start", backgroundColor: Colors.card, borderBottomLeftRadius: 4, borderWidth: 1, borderColor: Colors.border },
  messageText: { fontSize: 15, color: Colors.text, lineHeight: 21 },
  myMessageText: { color: "#fff" },
  translationContainer: { marginTop: 6 },
  translationDivider: { height: 1, backgroundColor: "rgba(255,255,255,0.2)", marginBottom: 4 },
  translationText: { fontSize: 13, color: Colors.textSecondary, fontStyle: "italic" },
  myTranslationText: { color: "rgba(255,255,255,0.7)" },
  messageFooter: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 },
  messageTime: { fontSize: 10, color: Colors.textSecondary },
  myMessageTime: { color: "rgba(255,255,255,0.5)" },
  systemMessage: { flexDirection: "row", alignItems: "center", gap: 6, alignSelf: "center", backgroundColor: "rgba(245,158,11,0.1)", paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, marginBottom: 8, maxWidth: "90%" },
  systemMessageText: { fontSize: 12, color: Colors.gold, flex: 1, lineHeight: 17 },
  quickPhraseContainer: { paddingHorizontal: Spacing.md, paddingVertical: 8, gap: 8 },
  quickPhrase: { backgroundColor: Colors.card, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 16, borderWidth: 1, borderColor: Colors.border },
  quickPhraseText: { fontSize: 13, color: Colors.text },
  inputBar: { flexDirection: "row", alignItems: "flex-end", paddingHorizontal: Spacing.sm, paddingVertical: 8, borderTopWidth: 1, borderTopColor: Colors.border, backgroundColor: Colors.background, gap: 8 },
  inputAction: { padding: 8 },
  textInput: { flex: 1, backgroundColor: Colors.card, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, fontSize: 15, color: Colors.text, maxHeight: 100, borderWidth: 1, borderColor: Colors.border },
  sendButton: { width: 38, height: 38, borderRadius: 19, backgroundColor: Colors.secondary, justifyContent: "center", alignItems: "center" },
  sendButtonDisabled: { backgroundColor: Colors.card },
  inputActionRecording: { backgroundColor: Colors.accent + "20", borderRadius: 20 },
  recordingOverlay: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12, backgroundColor: Colors.accent + "15", borderTopWidth: 1, borderTopColor: Colors.accent + "30", gap: 12 },
  recordingPulse: { width: 48, height: 48, borderRadius: 24, backgroundColor: Colors.accent, alignItems: "center", justifyContent: "center" },
  recordingInfo: { flex: 1 },
  recordingTimer: { fontSize: 20, fontWeight: "700", color: Colors.accent },
  recordingHint: { fontSize: 11, color: Colors.textSecondary, marginTop: 2 },
  recordingActions: { flexDirection: "row", alignItems: "center", gap: 8 },
  cancelRecordBtn: { padding: 4 },
  stopRecordBtn: { padding: 4 },
  voiceBubble: { paddingVertical: 8 },
  voiceRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  voiceWaveform: { flex: 1, flexDirection: "row", alignItems: "center", gap: 2, height: 28 },
  waveBar: { width: 3, borderRadius: 1.5 },
  voiceDuration: { fontSize: 12, fontWeight: "600", color: Colors.textSecondary, minWidth: 32, textAlign: "right" },
  emptyChat: { flex: 1, justifyContent: "center", alignItems: "center", paddingTop: 80, gap: 8 },
  emptyChatEmoji: { fontSize: 48 },
  emptyChatText: { fontSize: 16, fontWeight: "600", color: Colors.text },
  emptyChatHint: { fontSize: 13, color: Colors.textSecondary },
});
