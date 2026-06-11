import React from "react";
import { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Image,
  ActionSheetIOS,
  Animated,
  Modal,
  ScrollView,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import * as Haptics from "expo-haptics";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Sharing from "expo-sharing";
import { Colors, Spacing, BorderRadius, FontSize } from "../constants/Colors";
import { trpc } from "@/lib/trpc";
import { LinearGradient } from "expo-linear-gradient";
import { SwipeToReply } from "@/components/swipe-to-reply";
import {
  toggleStarredMessage,
  isMessageStarred,
  addSharedLink,
  addSharedPhoto,
  extractUrlsFromText,
  getDomainFromUrl,
  getTitleFromUrl,
  getChatTheme,
  getDisappearingTimer,
  isMessageExpired,
  getTimerLabel,
  getTimerDurationMs,
  type StarredMessage,
  type ChatTheme,
  type DisappearingTimer,
} from "@/lib/chat-media-store";

// Lazy-load image picker (crashes on web if top-level import)
let ImagePicker: any = null;
if (Platform.OS !== "web") {
  ImagePicker = require("expo-image-picker");
}

// Lazy-load document picker
let DocumentPicker: any = null;
if (Platform.OS !== "web") {
  DocumentPicker = require("expo-document-picker");
}

const MESSAGES_KEY = "@connectworld_messages";
const REACTIONS_KEY = "@connectworld_reactions";
const { width: SCREEN_WIDTH } = Dimensions.get("window");

// Emoji reactions available
const REACTION_EMOJIS = ["❤️", "😂", "😮", "😢", "😡", "👍"];

type ReadStatus = "sent" | "delivered" | "read";

type Reaction = {
  emoji: string;
  sender: "me" | "them";
  timestamp: number;
};

type Message = {
  id: string;
  text: string;
  sender: "me" | "them";
  timestamp: number;
  read: boolean;
  type?: "text" | "voice" | "image";
  voiceDuration?: number;
  translation?: string;
  translatedFrom?: string;
  imageUri?: string;
  readStatus?: ReadStatus;
  reactions?: Reaction[];
  replyTo?: { id: string; text: string; sender: "me" | "them" };
  edited?: boolean;
  originalText?: string;
};

type Contact = {
  id: string;
  name: string;
  avatar: string;
  online: boolean;
  type: "friend" | "classmate" | "instructor";
  lastSeen?: string;
};

const CONTACTS: Contact[] = [
  { id: "1", name: "Prof. Carlos", avatar: "👨🏽\u200D🏫", online: true, type: "instructor" },
  { id: "2", name: "Marie Dubois", avatar: "👩🏻", online: true, type: "friend" },
  { id: "3", name: "Sensei Kenji", avatar: "👨🏻\u200D🏫", online: false, type: "instructor", lastSeen: "2h ago" },
  { id: "4", name: "Amara", avatar: "👩🏿", online: true, type: "friend" },
  { id: "5", name: "Prof. Sofia", avatar: "👩🏽\u200D🏫", online: false, type: "instructor", lastSeen: "30m ago" },
  { id: "7", name: "Liam", avatar: "👨🏼", online: true, type: "classmate" },
  { id: "9", name: "Wei Chen", avatar: "👨🏻", online: false, type: "friend", lastSeen: "5h ago" },
];

const SAMPLE_CONVERSATIONS: Record<string, Message[]> = {
  "1": [
    { id: "m1", text: "¡Hola! ¿Cómo estás hoy?", sender: "them", timestamp: Date.now() - 600000, read: true, readStatus: "read" },
    { id: "m2", text: "Bien, gracias! Estoy practicando mi español", sender: "me", timestamp: Date.now() - 540000, read: true, readStatus: "read" },
    { id: "m3", text: "Excelente! Let's practice some Dominican expressions today", sender: "them", timestamp: Date.now() - 480000, read: true, readStatus: "read" },
    { id: "m4", text: "Yes! I want to learn more slang", sender: "me", timestamp: Date.now() - 420000, read: true, readStatus: "read" },
    { id: "m5", text: "Dimelo! That means 'what's up' in DR 🎉", sender: "them", timestamp: Date.now() - 360000, read: true, readStatus: "read" },
  ],
  "2": [
    { id: "m1", text: "Bonjour! Comment allez-vous?", sender: "them", timestamp: Date.now() - 3600000, read: true, readStatus: "read" },
    { id: "m2", text: "Très bien, merci! I'm working on my French pronunciation", sender: "me", timestamp: Date.now() - 3000000, read: true, readStatus: "read" },
    { id: "m3", text: "Your accent is getting much better! Keep practicing the nasal vowels", sender: "them", timestamp: Date.now() - 2400000, read: true, readStatus: "read" },
  ],
  "3": [
    { id: "m1", text: "おはようございます！Today we'll review kanji", sender: "them", timestamp: Date.now() - 7200000, read: true, readStatus: "read" },
    { id: "m2", text: "Hai sensei! I practiced the ones from last week", sender: "me", timestamp: Date.now() - 6600000, read: true, readStatus: "read" },
  ],
  "4": [
    { id: "m1", text: "Hey! Did you try the Yoruba lesson I recommended?", sender: "them", timestamp: Date.now() - 86400000, read: true, readStatus: "read" },
    { id: "m2", text: "Yes! The tonal patterns are challenging but fun", sender: "me", timestamp: Date.now() - 82800000, read: true, readStatus: "delivered" },
  ],
  "5": [
    { id: "m1", text: "Your essay on Colombian culture was excellent!", sender: "them", timestamp: Date.now() - 172800000, read: true, readStatus: "read" },
    { id: "m2", text: "Thank you Professor Sofia! I learned so much researching it", sender: "me", timestamp: Date.now() - 169200000, read: true, readStatus: "read" },
  ],
  "7": [
    { id: "m1", text: "Hallo! Wie geht's? Want to practice German today?", sender: "them", timestamp: Date.now() - 1800000, read: true, readStatus: "read" },
    { id: "m2", text: "Ja! I need help with separable verbs", sender: "me", timestamp: Date.now() - 1200000, read: true, readStatus: "read" },
  ],
  "9": [
    { id: "m1", text: "你好！I want to practice Chinese conversation", sender: "them", timestamp: Date.now() - 43200000, read: true, readStatus: "read" },
    { id: "m2", text: "Sure! Let's start with tones today", sender: "me", timestamp: Date.now() - 39600000, read: true, readStatus: "read" },
  ],
};

export default function MessageComposeScreen() {
  const params = useLocalSearchParams<{ contactId?: string; contactName?: string; contactAvatar?: string; contactType?: string }>();
  const translateMutation = trpc.translate.text.useMutation();
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"all" | "friend" | "classmate" | "instructor">("all");
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);
  const [voicePlaybackProgress, setVoicePlaybackProgress] = useState<Record<string, number>>({});
  const [transcriptions, setTranscriptions] = useState<Record<string, string>>({});
  const [transcribingId, setTranscribingId] = useState<string | null>(null);
  const [translatingId, setTranslatingId] = useState<string | null>(null);
  const [showTranslation, setShowTranslation] = useState<Record<string, boolean>>({});
  const [translateMode, setTranslateMode] = useState(false);
  const [starredIds, setStarredIds] = useState<Set<string>>(new Set());
  // Theme state
  const [chatTheme, setChatThemeState] = useState<ChatTheme | null>(null);
  // Disappearing messages state
  const [disappearingTimer, setDisappearingTimerState] = useState<DisappearingTimer>("off");
  // Typing indicator state
  const [isThemTyping, setIsThemTyping] = useState(false);
  const typingAnim = useRef(new Animated.Value(0)).current;
  const typingDot1 = useRef(new Animated.Value(0)).current;
  const typingDot2 = useRef(new Animated.Value(0)).current;
  const typingDot3 = useRef(new Animated.Value(0)).current;
  // Voice recording waveform animation
  const waveformAnim = useRef(new Animated.Value(0)).current;
  // Voice preview state
  const [voicePreview, setVoicePreview] = useState<{ duration: number } | null>(null);
  // Reactions state
  const [reactionMenuMsgId, setReactionMenuMsgId] = useState<string | null>(null);
  const [reactionMenuPosition, setReactionMenuPosition] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const reactionScaleAnim = useRef(new Animated.Value(0)).current;
  const [showFullEmojiPicker, setShowFullEmojiPicker] = useState(false);
  const [emojiPickerMsgId, setEmojiPickerMsgId] = useState<string | null>(null);
  // Reply state
  const [replyTo, setReplyTo] = useState<{ id: string; text: string; sender: "me" | "them" } | null>(null);
  // In-conversation search state
  const [searchMode, setSearchMode] = useState(false);
  const [msgSearchQuery, setMsgSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<string[]>([]);
  const [currentSearchIndex, setCurrentSearchIndex] = useState(0);
  const [searchFilter, setSearchFilter] = useState<"all" | "photos" | "links" | "voice">("all");
  // Scheduled messages state
  const [showSchedulePicker, setShowSchedulePicker] = useState(false);
  const [scheduledMessages, setScheduledMessages] = useState<{ text: string; scheduledTime: number; id: string }[]>([]);
  // Thread view state
  const [threadRootId, setThreadRootId] = useState<string | null>(null);

  const recordingTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const flatListRef = useRef<FlatList>(null);

  // Typing indicator animation - staggered bounce like iMessage
  useEffect(() => {
    if (isThemTyping) {
      const createBounce = (dot: Animated.Value, delay: number) =>
        Animated.loop(
          Animated.sequence([
            Animated.delay(delay),
            Animated.timing(dot, { toValue: -6, duration: 250, useNativeDriver: true }),
            Animated.timing(dot, { toValue: 0, duration: 250, useNativeDriver: true }),
            Animated.delay(600 - delay),
          ])
        );
      createBounce(typingDot1, 0).start();
      createBounce(typingDot2, 150).start();
      createBounce(typingDot3, 300).start();
      Animated.loop(
        Animated.sequence([
          Animated.timing(typingAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
          Animated.timing(typingAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
        ])
      ).start();
    } else {
      typingAnim.setValue(0);
      typingDot1.setValue(0);
      typingDot2.setValue(0);
      typingDot3.setValue(0);
    }
  }, [isThemTyping]);

  // Voice recording waveform animation
  useEffect(() => {
    if (isRecording) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(waveformAnim, { toValue: 1, duration: 300, useNativeDriver: false }),
          Animated.timing(waveformAnim, { toValue: 0.4, duration: 300, useNativeDriver: false }),
        ])
      ).start();
    } else {
      waveformAnim.setValue(0);
    }
  }, [isRecording]);

  useEffect(() => {
    if (params.contactId) {
      loadStarredStatus(params.contactId);
      loadTheme(params.contactId);
      loadDisappearingTimer(params.contactId);
      loadReactions(params.contactId);
      const contact = CONTACTS.find((c) => c.id === params.contactId);
      if (contact) {
        setSelectedContact(contact);
        loadMessages(contact.id);
      } else if (params.contactName) {
        const fallback: Contact = {
          id: params.contactId,
          name: params.contactName || "Contact",
          avatar: params.contactAvatar || "\u{1F464}",
          online: false,
          type: (params.contactType as Contact["type"]) || "friend",
        };
        setSelectedContact(fallback);
        loadMessages(fallback.id);
      }
    }
  }, [params.contactId]);

  const loadTheme = async (contactId: string) => {
    const theme = await getChatTheme(contactId);
    setChatThemeState(theme);
  };

  const loadDisappearingTimer = async (contactId: string) => {
    const timer = await getDisappearingTimer(contactId);
    setDisappearingTimerState(timer);
  };

  const loadReactions = async (contactId: string) => {
    try {
      const stored = await AsyncStorage.getItem(`${REACTIONS_KEY}_${contactId}`);
      if (stored) {
        const reactionsMap: Record<string, Reaction[]> = JSON.parse(stored);
        setMessages((prev) =>
          prev.map((m) => ({ ...m, reactions: reactionsMap[m.id] || m.reactions || [] }))
        );
      }
    } catch {}
  };

  const saveReactions = async (contactId: string, msgs: Message[]) => {
    try {
      const reactionsMap: Record<string, Reaction[]> = {};
      msgs.forEach((m) => {
        if (m.reactions && m.reactions.length > 0) {
          reactionsMap[m.id] = m.reactions;
        }
      });
      await AsyncStorage.setItem(`${REACTIONS_KEY}_${contactId}`, JSON.stringify(reactionsMap));
    } catch {}
  };

  const loadMessages = async (contactId: string) => {
    try {
      const stored = await AsyncStorage.getItem(`${MESSAGES_KEY}_${contactId}`);
      let msgs: Message[] = [];
      if (stored) {
        msgs = JSON.parse(stored);
      } else if (SAMPLE_CONVERSATIONS[contactId]) {
        msgs = SAMPLE_CONVERSATIONS[contactId];
      }
      // Filter expired messages
      const timer = await getDisappearingTimer(contactId);
      if (timer !== "off") {
        msgs = msgs.filter((m) => !isMessageExpired(m.timestamp, timer));
      }
      setMessages(msgs);
      // Load muted state for this conversation
      const mutedVal = await AsyncStorage.getItem(`mute_${contactId}`);
      setIsMuted(mutedVal === "true");
      // Find first unread message from the other person
      const firstUnread = msgs.find((m) => m.sender !== "me" && !m.read);
      setFirstUnreadMsgId(firstUnread?.id || null);
    } catch {
      if (SAMPLE_CONVERSATIONS[contactId]) {
        const fallbackMsgs = SAMPLE_CONVERSATIONS[contactId];
        setMessages(fallbackMsgs);
        const firstUnread = fallbackMsgs.find((m) => m.sender !== "me" && !m.read);
        setFirstUnreadMsgId(firstUnread?.id || null);
      }
    }
  };

  const saveMessages = async (contactId: string, msgs: Message[]) => {
    try {
      await AsyncStorage.setItem(`${MESSAGES_KEY}_${contactId}`, JSON.stringify(msgs.slice(-100)));
    } catch {}
  };

  const selectContact = (contact: Contact) => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedContact(contact);
    loadMessages(contact.id);
    loadTheme(contact.id);
    loadDisappearingTimer(contact.id);
  };

  // ─── VOICE RECORDING ──────────────────────────────────────────────────────────
  const startVoiceRecording = () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsRecording(true);
    setRecordingDuration(0);
    setVoicePreview(null);
    recordingTimer.current = setInterval(() => {
      setRecordingDuration((d) => d + 1);
    }, 1000);
  };

  const stopVoiceRecording = () => {
    if (recordingTimer.current) clearInterval(recordingTimer.current);
    setIsRecording(false);
    if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    if (recordingDuration < 1) {
      setVoicePreview(null);
      return;
    }
    // Show preview instead of immediately sending
    setVoicePreview({ duration: recordingDuration });
  };

  const sendVoiceMessage = async () => {
    if (!selectedContact || !voicePreview) return;
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const voiceMsg: Message = {
      id: `msg_${Date.now()}_voice`,
      text: `🎤 Voice note (${voicePreview.duration}s)`,
      sender: "me",
      timestamp: Date.now(),
      read: false,
      type: "voice",
      voiceDuration: voicePreview.duration,
      readStatus: "sent",
      reactions: [],
    };
    const updated = [...messages, voiceMsg];
    setMessages(updated);
    await saveMessages(selectedContact.id, updated);
    setVoicePreview(null);
    setRecordingDuration(0);

    // Simulate delivery + read
    simulateReadReceipts(voiceMsg.id, updated);

    // Simulate typing + reply
    simulateTypingAndReply(updated);
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
  };

  const cancelVoicePreview = () => {
    setVoicePreview(null);
    setRecordingDuration(0);
  };

  const playVoiceNote = (msgId: string, duration: number) => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (playingVoiceId === msgId) {
      setPlayingVoiceId(null);
      return;
    }
    setPlayingVoiceId(msgId);
    setVoicePlaybackProgress((prev) => ({ ...prev, [msgId]: 0 }));
    // Simulate playback progress
    const interval = setInterval(() => {
      setVoicePlaybackProgress((prev) => {
        const current = (prev[msgId] || 0) + (100 / (duration * 10));
        if (current >= 100) {
          clearInterval(interval);
          setPlayingVoiceId(null);
          return { ...prev, [msgId]: 0 };
        }
        return { ...prev, [msgId]: current };
      });
    }, 100);
  };

  // ─── VOICE TRANSCRIPTION ─────────────────────────────────────────────────────
  const transcribeVoiceMessage = async (msgId: string) => {
    if (transcriptions[msgId]) {
      // Toggle off if already transcribed
      setTranscriptions((prev) => {
        const copy = { ...prev };
        delete copy[msgId];
        return copy;
      });
      return;
    }
    setTranscribingId(msgId);
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // Simulate transcription (in production, call speech-to-text API)
    await new Promise((resolve) => setTimeout(resolve, 1500));
    const sampleTranscriptions: Record<string, string> = {
      default_es: "¡Hola! ¿Cómo estás? Quiero practicar mi español contigo.",
      default_en: "Hey! I just finished my Spanish lesson. It was really great!",
      default_fr: "Bonjour! Je voulais te dire que la leçon était formidable.",
    };
    const msg = messages.find((m) => m.id === msgId);
    const lang = msg?.sender === "me" ? "default_en" : "default_es";
    const text = sampleTranscriptions[lang] || "Audio transcription unavailable.";
    setTranscriptions((prev) => ({ ...prev, [msgId]: text }));
    setTranscribingId(null);
  };

  // ─── CHAT EXPORT / SHARE ────────────────────────────────────────────────────
  const exportChatAsText = async () => {
    if (!selectedContact || messages.length === 0) return;
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // Build text export
    const header = `Chat with ${selectedContact.name}\nExported on ${new Date().toLocaleDateString()}\n${"-".repeat(40)}\n\n`;
    const body = messages.map((m) => {
      const sender = m.sender === "me" ? "You" : selectedContact.name;
      const time = new Date(m.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      const text = m.type === "voice" ? `[Voice message ${m.voiceDuration}s]` : m.type === "image" ? "[Photo]" : m.text;
      return `[${time}] ${sender}: ${text}`;
    }).join("\n");
    const fullText = header + body;

    if (Platform.OS === "web") {
      // Web: copy to clipboard
      try {
        await (navigator as any).clipboard.writeText(fullText);
        Alert.alert("Exported", "Chat copied to clipboard!");
      } catch {
        Alert.alert("Export", "Could not copy to clipboard.");
      }
      return;
    }
    // Native: write to temp file and share
    try {
      const FileSystem = require("expo-file-system/legacy");
      const fileUri = FileSystem.cacheDirectory + `chat_${selectedContact.name.replace(/\s/g, "_")}_${Date.now()}.txt`;
      await FileSystem.writeAsStringAsync(fileUri, fullText, { encoding: FileSystem.EncodingType.UTF8 });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, { mimeType: "text/plain", dialogTitle: "Share Chat" });
      } else {
        Alert.alert("Sharing unavailable", "Sharing is not available on this device.");
      }
    } catch (err) {
      Alert.alert("Export Error", "Could not export chat.");
    }
  };

  const showExportOptions = () => {
    if (Platform.OS === "ios") {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ["Cancel", "Export Full Chat", "Copy Selected Messages"],
          cancelButtonIndex: 0,
        },
        (idx) => {
          if (idx === 1) exportChatAsText();
          if (idx === 2) {
            // Copy last 5 messages as a quick selection
            const last5 = messages.slice(-5).map((m) => {
              const sender = m.sender === "me" ? "You" : selectedContact?.name || "Them";
              return `${sender}: ${m.text || "[media]"}`;
            }).join("\n");
            if (Platform.OS !== "web") {
              const Clipboard = require("expo-clipboard");
              Clipboard.setStringAsync(last5);
            }
            Alert.alert("Copied", "Last 5 messages copied to clipboard.");
          }
        }
      );
    } else {
      // Android / Web: just export full chat
      exportChatAsText();
    }
  };

  // ─── READ RECEIPTS ─────────────────────────────────────────────────────────────
  const simulateReadReceipts = async (msgId: string, currentMsgs: Message[]) => {
    // Check if read receipts are enabled for this contact
    let receiptsEnabled = true;
    if (selectedContact) {
      try {
        const stored = await AsyncStorage.getItem(`readReceipts_${selectedContact.id}`);
        if (stored === "false") receiptsEnabled = false;
      } catch (e) { /* ignore */ }
    }
    // Simulate: sent → delivered (1s) → read (2.5s, only if receipts enabled)
    setTimeout(() => {
      setMessages((prev) =>
        prev.map((m) => (m.id === msgId ? { ...m, readStatus: "delivered" as ReadStatus } : m))
      );
    }, 1000);
    if (receiptsEnabled) {
      setTimeout(() => {
        setMessages((prev) =>
          prev.map((m) => (m.id === msgId ? { ...m, readStatus: "read" as ReadStatus } : m))
        );
      }, 2500);
    }
  };

  // ─── TYPING INDICATOR ──────────────────────────────────────────────────────────
  const simulateTypingAndReply = (currentMsgs: Message[]) => {
    // Show typing indicator after a short delay
    const typingDelay = 1500 + Math.random() * 1000;
    setTimeout(() => {
      setIsThemTyping(true);
      flatListRef.current?.scrollToEnd({ animated: true });
    }, typingDelay);

    // Stop typing and send reply
    const replyDelay = typingDelay + 2000 + Math.random() * 1500;
    setTimeout(async () => {
      setIsThemTyping(false);
      const replies = ["¡Genial! 😊", "¡Claro que sí!", "¡Nos vemos! 👋", "¡Perfecto!", "Me encanta 🎉"];
      const reply: Message = {
        id: `msg_${Date.now()}_reply`,
        text: replies[Math.floor(Math.random() * replies.length)],
        sender: "them",
        timestamp: Date.now(),
        read: false,
        readStatus: "read",
        reactions: [],
      };
      const withReply = [...currentMsgs, reply];
      setMessages((prev) => [...prev, reply]);
      if (selectedContact) await saveMessages(selectedContact.id, withReply);
      flatListRef.current?.scrollToEnd({ animated: true });
    }, replyDelay);
  };

  // ─── REACTIONS ─────────────────────────────────────────────────────────────────
  const showReactionMenu = (msgId: string, event: any) => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const { pageY, pageX } = event.nativeEvent;
    setReactionMenuMsgId(msgId);
    setReactionMenuPosition({ top: pageY - 60, left: Math.min(pageX - 80, SCREEN_WIDTH - 250) });
    reactionScaleAnim.setValue(0);
    Animated.spring(reactionScaleAnim, {
      toValue: 1,
      friction: 6,
      tension: 100,
      useNativeDriver: true,
    }).start();
  };

  const addReaction = async (msgId: string, emoji: string) => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setReactionMenuMsgId(null);
    const newReaction: Reaction = { emoji, sender: "me", timestamp: Date.now() };
    const updatedMessages = messages.map((m) => {
      if (m.id === msgId) {
        const existing = m.reactions || [];
        // Remove existing reaction from me with same emoji, or add new one
        const alreadyReacted = existing.find((r) => r.sender === "me" && r.emoji === emoji);
        if (alreadyReacted) {
          return { ...m, reactions: existing.filter((r) => !(r.sender === "me" && r.emoji === emoji)) };
        }
        // Replace any existing reaction from me
        const filtered = existing.filter((r) => r.sender !== "me");
        return { ...m, reactions: [...filtered, newReaction] };
      }
      return m;
    });
    setMessages(updatedMessages);
    if (selectedContact) {
      await saveMessages(selectedContact.id, updatedMessages);
      await saveReactions(selectedContact.id, updatedMessages);
    }

    // Simulate them reacting back after a delay
    if (Math.random() > 0.5) {
      setTimeout(() => {
        const theirEmoji = REACTION_EMOJIS[Math.floor(Math.random() * REACTION_EMOJIS.length)];
        setMessages((prev) =>
          prev.map((m) => {
            if (m.id === msgId && m.sender === "me") {
              const existing = m.reactions || [];
              const theirExisting = existing.filter((r) => r.sender !== "them");
              return { ...m, reactions: [...theirExisting, { emoji: theirEmoji, sender: "them", timestamp: Date.now() }] };
            }
            return m;
          })
        );
      }, 3000 + Math.random() * 2000);
    }
  };

  // ─── PHOTO SHARING ──────────────────────────────────────────────────────────
  const pickAndSendPhoto = async () => {
    if (!selectedContact) return;
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (Platform.OS === "web") {
      Alert.alert("Photo Sharing", "Photo sharing is available on iOS and Android devices.");
      return;
    }

    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission Required", "Please allow access to your photo library to share photos.");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: false,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const photoMsg: Message = {
          id: `msg_${Date.now()}_photo`,
          text: "📷 Photo",
          sender: "me",
          timestamp: Date.now(),
          read: false,
          type: "image",
          imageUri: asset.uri,
          readStatus: "sent",
          reactions: [],
        };
        const updated = [...messages, photoMsg];
        setMessages(updated);
        await saveMessages(selectedContact.id, updated);

        await addSharedPhoto(selectedContact.id, {
          id: photoMsg.id,
          uri: asset.uri,
          timestamp: photoMsg.timestamp,
          sender: "me",
        });

        simulateReadReceipts(photoMsg.id, updated);
        setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
      }
    } catch (err) {
      Alert.alert("Error", "Failed to pick photo. Please try again.");
    }
  };

  const pickAndSendDocument = async () => {
    if (!selectedContact) return;
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (Platform.OS === "web" || !DocumentPicker) {
      Alert.alert("Document Sharing", "Document sharing is available on iOS and Android devices.");
      return;
    }

    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "*/*",
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const docMsg: Message = {
          id: `msg_${Date.now()}_doc`,
          text: `📄 ${asset.name || "Document"}`,
          sender: "me",
          timestamp: Date.now(),
          read: false,
          type: "text",
          readStatus: "sent",
          reactions: [],
        };
        const updated = [...messages, docMsg];
        setMessages(updated);
        await saveMessages(selectedContact.id, updated);

        simulateReadReceipts(docMsg.id, updated);
        setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
      }
    } catch (err) {
      Alert.alert("Error", "Failed to pick document. Please try again.");
    }
  };

  const handleAttachPress = () => {
    if (Platform.OS === "ios") {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ["Cancel", "Photo Library", "Camera", "Document"],
          cancelButtonIndex: 0,
        },
        (buttonIndex) => {
          if (buttonIndex === 1) pickAndSendPhoto();
          if (buttonIndex === 2) takeAndSendPhoto();
          if (buttonIndex === 3) pickAndSendDocument();
        }
      );
    } else {
      Alert.alert(
        "Attach",
        "Choose what to share",
        [
          { text: "Photo Library", onPress: pickAndSendPhoto },
          { text: "Camera", onPress: takeAndSendPhoto },
          { text: "Document", onPress: pickAndSendDocument },
          { text: "Cancel", style: "cancel" },
        ]
      );
    }
  };

  const takeAndSendPhoto = async () => {
    if (!selectedContact) return;
    if (Platform.OS === "web") return;

    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission Required", "Please allow camera access to take photos.");
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: false,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const photoMsg: Message = {
          id: `msg_${Date.now()}_camera`,
          text: "📸 Photo",
          sender: "me",
          timestamp: Date.now(),
          read: false,
          type: "image",
          imageUri: asset.uri,
          readStatus: "sent",
          reactions: [],
        };
        const updated = [...messages, photoMsg];
        setMessages(updated);
        await saveMessages(selectedContact.id, updated);

        await addSharedPhoto(selectedContact.id, {
          id: photoMsg.id,
          uri: asset.uri,
          timestamp: photoMsg.timestamp,
          sender: "me",
        });

        simulateReadReceipts(photoMsg.id, updated);
        setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
      }
    } catch {
      Alert.alert("Error", "Failed to take photo. Please try again.");
    }
  };

  // ─── MESSAGE SEARCH ────────────────────────────────────────────────────────
  const handleMsgSearch = (query: string, filter?: "all" | "photos" | "links" | "voice") => {
    setMsgSearchQuery(query);
    const activeFilter = filter ?? searchFilter;
    if (!query.trim() && activeFilter === "all") {
      setSearchResults([]);
      setCurrentSearchIndex(0);
      return;
    }
    let filtered = messages;
    // Apply type filter
    if (activeFilter === "photos") {
      filtered = filtered.filter((m) => m.type === "image");
    } else if (activeFilter === "voice") {
      filtered = filtered.filter((m) => m.type === "voice");
    } else if (activeFilter === "links") {
      filtered = filtered.filter((m) => m.text && /https?:\/\//.test(m.text));
    }
    // Apply text query
    if (query.trim()) {
      filtered = filtered.filter((m) => m.text.toLowerCase().includes(query.toLowerCase()));
    }
    const results = filtered.map((m) => m.id);
    setSearchResults(results);
    setCurrentSearchIndex(results.length > 0 ? 0 : -1);
    if (results.length > 0) {
      const idx = messages.findIndex((m) => m.id === results[0]);
      if (idx >= 0) flatListRef.current?.scrollToIndex({ index: idx, animated: true });
    }
  };

  const applySearchFilter = (filter: "all" | "photos" | "links" | "voice") => {
    setSearchFilter(filter);
    handleMsgSearch(msgSearchQuery, filter);
  };

  const navigateSearchResult = (direction: "prev" | "next") => {
    if (searchResults.length === 0) return;
    let newIdx = direction === "next" ? currentSearchIndex + 1 : currentSearchIndex - 1;
    if (newIdx >= searchResults.length) newIdx = 0;
    if (newIdx < 0) newIdx = searchResults.length - 1;
    setCurrentSearchIndex(newIdx);
    const msgIdx = messages.findIndex((m) => m.id === searchResults[newIdx]);
    if (msgIdx >= 0) flatListRef.current?.scrollToIndex({ index: msgIdx, animated: true });
  };

  // ─── REPLY & FORWARD ──────────────────────────────────────────────────────────
  const handleReply = (msg: Message) => {
    setReplyTo({ id: msg.id, text: msg.text || (msg.type === "voice" ? "Voice message" : "Photo"), sender: msg.sender });
    setReactionMenuMsgId(null);
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const [forwardingMsg, setForwardingMsg] = useState<Message | null>(null);
  const [firstUnreadMsgId, setFirstUnreadMsgId] = useState<string | null>(null);
  const [editingMsgId, setEditingMsgId] = useState<string | null>(null);
  const [showOriginalFor, setShowOriginalFor] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(false);

  const toggleMute = async () => {
    if (!selectedContact) return;
    const newVal = !isMuted;
    setIsMuted(newVal);
    await AsyncStorage.setItem(`mute_${selectedContact.id}`, newVal ? "true" : "false");
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleForward = (msg: Message) => {
    setReactionMenuMsgId(null);
    setForwardingMsg(msg);
  };

  const confirmForward = (contactName: string) => {
    if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setForwardingMsg(null);
    Alert.alert("Forwarded", `Message forwarded to ${contactName}`);
  };

  const renderForwardPicker = () => {
    if (!forwardingMsg) return null;
    const otherContacts = CONTACTS.filter((c) => c.id !== selectedContact?.id);
    return (
      <Modal visible={true} transparent animationType="slide" onRequestClose={() => setForwardingMsg(null)}>
        <View style={styles.forwardOverlay}>
          <View style={styles.forwardSheet}>
            <View style={styles.forwardHeader}>
              <Text style={styles.forwardTitle}>Forward to...</Text>
              <TouchableOpacity onPress={() => setForwardingMsg(null)}>
                <Ionicons name="close" size={22} color={Colors.text} />
              </TouchableOpacity>
            </View>
            <Text style={styles.forwardPreview} numberOfLines={2}>
              {forwardingMsg.text || (forwardingMsg.type === "voice" ? "\ud83c\udf99\ufe0f Voice message" : "\ud83d\uddbc\ufe0f Photo")}
            </Text>
            <ScrollView style={styles.forwardList}>
              {otherContacts.map((contact) => (
                <TouchableOpacity
                  key={contact.id}
                  style={styles.forwardContact}
                  onPress={() => confirmForward(contact.name)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.forwardContactAvatar}>{contact.avatar}</Text>
                  <Text style={styles.forwardContactName}>{contact.name}</Text>
                  <Ionicons name="arrow-redo" size={18} color={Colors.secondary} />
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  };

  // ─── SEND MESSAGE ───────────────────────────────────────────────────────────
  const sendMessage = async () => {
    if (!input.trim() || !selectedContact) return;
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const newMsg: Message = {
      id: `msg_${Date.now()}`,
      text: input.trim(),
      sender: "me",
      timestamp: Date.now(),
      read: false,
      readStatus: "sent",
      reactions: [],
      replyTo: replyTo || undefined,
    };

    const updated = [...messages, newMsg];
    setMessages(updated);
    setInput("");
    setReplyTo(null);
    await saveMessages(selectedContact.id, updated);

    // Track shared links
    const urls = extractUrlsFromText(newMsg.text);
    for (const url of urls) {
      await addSharedLink(selectedContact.id, {
        id: `link_${Date.now()}_${Math.random()}`,
        url,
        title: getTitleFromUrl(url),
        domain: getDomainFromUrl(url),
        timestamp: newMsg.timestamp,
        sender: "me",
      });
    }

    // Simulate read receipts
    simulateReadReceipts(newMsg.id, updated);

    // Get AI-powered contextual reply with typing indicator
    simulateTypingAndReply(updated);

    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
  };

  // ─── SCHEDULED MESSAGES ──────────────────────────────────────────────────────
  const scheduleMessage = (delayMinutes: number) => {
    if (!input.trim() || !selectedContact) return;
    if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const scheduledTime = Date.now() + delayMinutes * 60 * 1000;
    const scheduled = {
      id: `sched_${Date.now()}`,
      text: input.trim(),
      scheduledTime,
    };
    setScheduledMessages((prev) => [...prev, scheduled]);
    setInput("");
    setShowSchedulePicker(false);
    Alert.alert(
      "Message Scheduled",
      `Your message will be sent in ${delayMinutes < 60 ? `${delayMinutes} min` : `${Math.round(delayMinutes / 60)} hr`}.`
    );
    // Simulate sending after delay (capped at 10s for demo)
    const demoDelay = Math.min(delayMinutes * 60 * 1000, 10000);
    setTimeout(async () => {
      const newMsg: Message = {
        id: `msg_${Date.now()}_scheduled`,
        text: scheduled.text,
        sender: "me",
        timestamp: Date.now(),
        read: false,
        readStatus: "sent",
        reactions: [],
      };
      setMessages((prev) => {
        const updated = [...prev, newMsg];
        saveMessages(selectedContact!.id, updated);
        return updated;
      });
      setScheduledMessages((prev) => prev.filter((s) => s.id !== scheduled.id));
      simulateReadReceipts(newMsg.id, []);
    }, demoDelay);
  };

  const showScheduleOptions = () => {
    if (!input.trim()) return;
    if (Platform.OS === "ios") {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ["Cancel", "In 15 minutes", "In 1 hour", "In 3 hours", "Tomorrow morning"],
          cancelButtonIndex: 0,
          title: "Schedule Message",
          message: `"${input.trim().slice(0, 40)}${input.trim().length > 40 ? "..." : ""}"`
        },
        (idx) => {
          if (idx === 1) scheduleMessage(15);
          if (idx === 2) scheduleMessage(60);
          if (idx === 3) scheduleMessage(180);
          if (idx === 4) scheduleMessage(720);
        }
      );
    } else {
      setShowSchedulePicker(true);
    }
  };

  // Inline translation
  const translateMessage = async (msg: Message) => {
    if (msg.translation) {
      setShowTranslation((prev) => ({ ...prev, [msg.id]: !prev[msg.id] }));
      return;
    }
    setTranslatingId(msg.id);
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    let translated = "";
    try {
      const result = await translateMutation.mutateAsync({
        text: msg.text,
        fromLanguage: "Spanish",
        toLanguage: "English",
      });
      translated = (result as any)?.translatedText || (result as any)?.translation || msg.text;
    } catch {
      translated = `[Translation unavailable] ${msg.text}`;
    }
    const updatedMessages = messages.map((m) =>
      m.id === msg.id ? { ...m, translation: translated, translatedFrom: "Spanish" } : m
    );
    setMessages(updatedMessages);
    setShowTranslation((prev) => ({ ...prev, [msg.id]: true }));
    setTranslatingId(null);
    if (selectedContact) saveMessages(selectedContact.id, updatedMessages);
  };

  // Translate outgoing message before sending
  const sendTranslatedMessage = async () => {
    if (!input.trim() || !selectedContact) return;
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    let translated = "";
    try {
      const result = await translateMutation.mutateAsync({
        text: input.trim(),
        fromLanguage: "English",
        toLanguage: "Spanish",
        style: "casual",
      });
      translated = (result as any)?.translatedText || (result as any)?.translation || `[ES] ${input.trim()}`;
    } catch {
      translated = `[ES] ${input.trim()}`;
    }
    const newMsg: Message = {
      id: `msg_${Date.now()}`,
      text: translated,
      sender: "me",
      timestamp: Date.now(),
      read: false,
      translation: input.trim(),
      translatedFrom: "English (original)",
      readStatus: "sent",
      reactions: [],
    };
    const updated = [...messages, newMsg];
    setMessages(updated);
    setInput("");
    setTranslateMode(false);
    await saveMessages(selectedContact.id, updated);
    simulateReadReceipts(newMsg.id, updated);
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
  };

  const loadStarredStatus = async (cId: string) => {
    const msgs = messages.length > 0 ? messages : SAMPLE_CONVERSATIONS[cId] || [];
    const starred = new Set<string>();
    for (const msg of msgs) {
      const isStar = await isMessageStarred(cId, msg.id);
      if (isStar) starred.add(msg.id);
    }
    setStarredIds(starred);
  };

  const handleLongPressMessage = (msg: Message, event: any) => {
    if (!selectedContact) return;
    // For own text messages, offer edit option via ActionSheet on iOS
    if (msg.sender === "me" && msg.type !== "voice" && msg.type !== "image" && Platform.OS === "ios") {
      const ActionSheetIOS = require("react-native").ActionSheetIOS;
      ActionSheetIOS.showActionSheetWithOptions(
        { options: ["Edit Message", "React", "Cancel"], cancelButtonIndex: 2 },
        (idx: number) => {
          if (idx === 0) startEditMessage(msg);
          else if (idx === 1) showReactionMenu(msg.id, event);
        }
      );
      return;
    }
    if (msg.sender === "me" && msg.type !== "voice" && msg.type !== "image" && Platform.OS !== "ios") {
      // On Android/web, show edit via Alert
      Alert.alert("Message Options", "", [
        { text: "Edit Message", onPress: () => startEditMessage(msg) },
        { text: "React", onPress: () => showReactionMenu(msg.id, event) },
        { text: "Cancel", style: "cancel" },
      ]);
      return;
    }
    // Show reaction menu on long press
    showReactionMenu(msg.id, event);
  };

  const startEditMessage = (msg: Message) => {
    setEditingMsgId(msg.id);
    setInput(msg.text);
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const confirmEditMessage = async () => {
    if (!editingMsgId || !input.trim() || !selectedContact) return;
    const updatedMessages = messages.map((m) => {
      if (m.id === editingMsgId) {
        return { ...m, text: input.trim(), edited: true, originalText: m.originalText || m.text };
      }
      return m;
    });
    setMessages(updatedMessages);
    await saveMessages(selectedContact.id, updatedMessages);
    setEditingMsgId(null);
    setInput("");
    if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleDoubleTapMessage = (msg: Message, event: any) => {
    // Quick heart reaction on double tap
    addReaction(msg.id, "❤️");
  };

  const filteredContacts = CONTACTS.filter((c) => {
    const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === "all" || c.type === filterType;
    return matchesSearch && matchesType;
  });

  const formatTime = (ts: number) => {
    const diff = Date.now() - ts;
    if (diff < 60000) return "now";
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h`;
    return `${Math.floor(diff / 86400000)}d`;
  };

  // ─── DISAPPEARING COUNTDOWN ──────────────────────────────────────────────────
  const getCountdownText = (msgTimestamp: number): string => {
    const durationMs = getTimerDurationMs(disappearingTimer);
    if (!durationMs) return "";
    const elapsed = Date.now() - msgTimestamp;
    const remaining = durationMs - elapsed;
    if (remaining <= 0) return "expiring";
    if (remaining < 60000) return `${Math.ceil(remaining / 1000)}s`;
    if (remaining < 3600000) return `${Math.ceil(remaining / 60000)}m`;
    if (remaining < 86400000) return `${Math.round(remaining / 3600000)}h`;
    return `${Math.round(remaining / 86400000)}d`;
  };

  const renderDisappearingCountdown = (item: Message, isMe: boolean) => {
    if (disappearingTimer === "off") return null;
    const countdown = getCountdownText(item.timestamp);
    return (
      <View style={styles.countdownContainer}>
        <Ionicons name="timer-outline" size={10} color={isMe ? "rgba(255,255,255,0.7)" : Colors.textMuted} />
        <Text style={[styles.countdownText, isMe && styles.countdownTextMe]}>{countdown}</Text>
      </View>
    );
  };

  // ─── THREAD VIEW ────────────────────────────────────────────────────────────
  const getThreadMessages = (): Message[] => {
    if (!threadRootId) return [];
    const root = messages.find((m) => m.id === threadRootId);
    if (!root) return [];
    const replies = messages.filter((m) => m.replyTo?.id === threadRootId);
    return [root, ...replies.sort((a, b) => a.timestamp - b.timestamp)];
  };

  const openThread = (replyToId: string) => {
    setThreadRootId(replyToId);
  };

  const renderThreadView = () => {
    if (!threadRootId) return null;
    const threadMsgs = getThreadMessages();
    return (
      <Modal visible={true} transparent animationType="fade" onRequestClose={() => setThreadRootId(null)}>
        <View style={styles.threadOverlay}>
          <View style={styles.threadContainer}>
            <View style={styles.threadHeader}>
              <Text style={styles.threadTitle}>Thread</Text>
              <TouchableOpacity onPress={() => setThreadRootId(null)}>
                <Ionicons name="close" size={22} color={Colors.text} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.threadList}>
              {threadMsgs.map((msg, idx) => {
                const isMine = msg.sender === "me";
                return (
                  <View key={msg.id}>
                    {idx === 0 && <Text style={styles.threadOriginalLabel}>ORIGINAL</Text>}
                    {idx === 1 && <Text style={styles.threadOriginalLabel}>REPLIES</Text>}
                    <View style={[styles.threadBubble, isMine ? styles.threadBubbleMe : styles.threadBubbleThem]}>
                      <Text style={[styles.threadBubbleText, isMine && styles.threadBubbleTextMe]}>
                        {msg.text || (msg.type === "voice" ? "🎙️ Voice message" : "🖼️ Photo")}
                      </Text>
                      <Text style={styles.threadBubbleTime}>{formatTime(msg.timestamp)}</Text>
                    </View>
                  </View>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  };

  // ─── READ RECEIPT ICON (ANIMATED) ──────────────────────────────────────────────
  const receiptAnims = React.useRef<Record<string, Animated.Value>>({}).current;
  const getReceiptAnim = (msgId: string, status: ReadStatus) => {
    const key = `${msgId}_${status}`;
    if (!receiptAnims[key]) {
      receiptAnims[key] = new Animated.Value(0);
      Animated.timing(receiptAnims[key], {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }).start();
    }
    return receiptAnims[key];
  };

  const renderReadReceipt = (msg: Message) => {
    if (msg.sender !== "me") return null;
    const status = msg.readStatus || "sent";
    const anim = getReceiptAnim(msg.id, status);
    const scale = anim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.6, 1.2, 1] });
    const opacity = anim.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] });

    if (status === "sent") {
      return (
        <Animated.View style={{ transform: [{ scale }], opacity }}>
          <Ionicons name="checkmark" size={12} color="rgba(255,255,255,0.6)" />
        </Animated.View>
      );
    }
    if (status === "delivered") {
      return (
        <Animated.View style={[styles.doubleCheck, { transform: [{ scale }], opacity }]}>
          <Ionicons name="checkmark" size={12} color="rgba(255,255,255,0.6)" style={{ marginRight: -6 }} />
          <Ionicons name="checkmark" size={12} color="rgba(255,255,255,0.6)" />
        </Animated.View>
      );
    }
    // read - animated gray → blue transition
    const blueColor = "#34B7F1";
    return (
      <Animated.View style={[styles.doubleCheck, { transform: [{ scale }], opacity }]}>
        <Ionicons name="checkmark" size={12} color={blueColor} style={{ marginRight: -6 }} />
        <Ionicons name="checkmark" size={12} color={blueColor} />
      </Animated.View>
    );
  };

  // ─── REACTIONS DISPLAY ─────────────────────────────────────────────────────────
  const renderReactions = (msg: Message) => {
    if (!msg.reactions || msg.reactions.length === 0) return null;
    const isMe = msg.sender === "me";
    // Group reactions by emoji and count them (iMessage-style summary)
    const grouped: { emoji: string; count: number }[] = [];
    const seen: Record<string, number> = {};
    for (const r of msg.reactions) {
      if (seen[r.emoji] !== undefined) {
        grouped[seen[r.emoji]].count++;
      } else {
        seen[r.emoji] = grouped.length;
        grouped.push({ emoji: r.emoji, count: 1 });
      }
    }
    return (
      <View style={[styles.reactionsContainer, isMe ? styles.reactionsRight : styles.reactionsLeft]}>
        {grouped.map((g) => (
          <View key={g.emoji} style={styles.reactionBubble}>
            <Text style={styles.reactionEmoji}>{g.emoji}</Text>
            {g.count > 1 && <Text style={styles.reactionCount}>{g.count}</Text>}
          </View>
        ))}
      </View>
    );
  };

  // Contact list view
  if (!selectedContact) {
    return (
      <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Messages</Text>
          <TouchableOpacity style={styles.newMsgBtn}>
            <Ionicons name="create-outline" size={20} color={Colors.secondary} />
          </TouchableOpacity>
        </View>

        {/* Search */}
        <View style={styles.searchWrap}>
          <Ionicons name="search" size={16} color={Colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search contacts..."
            placeholderTextColor={Colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Filter chips */}
        <View style={styles.filterRow}>
          {(["all", "friend", "classmate", "instructor"] as const).map((type) => (
            <TouchableOpacity
              key={type}
              style={[styles.filterChip, filterType === type && styles.filterChipActive]}
              onPress={() => setFilterType(type)}
            >
              <Text style={[styles.filterChipText, filterType === type && styles.filterChipTextActive]}>
                {type === "all" ? "All" : type.charAt(0).toUpperCase() + type.slice(1) + "s"}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Contact list */}
        <FlatList
          data={filteredContacts}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.contactList}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.contactCard} onPress={() => selectContact(item)}>
              <View style={styles.contactAvatarWrap}>
                <Text style={styles.contactAvatar}>{item.avatar}</Text>
                {item.online && <View style={styles.onlineDot} />}
              </View>
              <View style={styles.contactInfo}>
                <Text style={styles.contactName}>{item.name}</Text>
                <Text style={styles.contactStatus}>
                  {item.online ? "Online" : item.lastSeen ? `Last seen ${item.lastSeen}` : "Offline"}
                </Text>
              </View>
              <View style={[styles.typeBadge, { backgroundColor: item.type === "instructor" ? Colors.gold + "20" : item.type === "classmate" ? Colors.secondary + "20" : Colors.success + "20" }]}>
                <Text style={[styles.typeBadgeText, { color: item.type === "instructor" ? Colors.gold : item.type === "classmate" ? Colors.secondary : Colors.success }]}>
                  {item.type === "instructor" ? "Instructor" : item.type === "classmate" ? "Classmate" : "Friend"}
                </Text>
              </View>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="chatbubbles-outline" size={48} color={Colors.textMuted} />
              <Text style={styles.emptyText}>No contacts found</Text>
            </View>
          }
        />
      </SafeAreaView>
    );
  }

  // ─── CONVERSATION VIEW ────────────────────────────────────────────────────────
  const renderChatBackground = () => {
    if (chatTheme && chatTheme.type === "image" && chatTheme.imageUri) {
      return (
        <Image
          source={{ uri: chatTheme.imageUri }}
          style={[StyleSheet.absoluteFillObject, { opacity: 0.35 }]}
          resizeMode="cover"
        />
      );
    }
    if (chatTheme && chatTheme.type === "gradient" && chatTheme.colors.length >= 2) {
      return (
        <LinearGradient
          colors={chatTheme.colors as [string, string, ...string[]]}
          style={StyleSheet.absoluteFillObject}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
        />
      );
    }
    if (chatTheme && chatTheme.type === "solid") {
      return <View style={[StyleSheet.absoluteFillObject, { backgroundColor: chatTheme.colors[0] }]} />;
    }
    return null;
  };

  // Track last tap for double-tap detection
  const lastTapRef = useRef<{ msgId: string; time: number } | null>(null);

  const handleTapMessage = (msg: Message, event: any) => {
    const now = Date.now();
    if (lastTapRef.current && lastTapRef.current.msgId === msg.id && now - lastTapRef.current.time < 300) {
      // Double tap detected
      handleDoubleTapMessage(msg, event);
      lastTapRef.current = null;
    } else {
      lastTapRef.current = { msgId: msg.id, time: now };
    }
  };

  const renderMessageItem = ({ item }: { item: Message }) => {
    const isMe = item.sender === "me";
    const showUnreadDivider = firstUnreadMsgId === item.id;

    const unreadDividerEl = showUnreadDivider ? (
      <View style={styles.unreadDivider}>
        <View style={styles.unreadDividerLine} />
        <Text style={styles.unreadDividerText}>New Messages</Text>
        <View style={styles.unreadDividerLine} />
      </View>
    ) : null;

    // Image message
    if (item.type === "image" && item.imageUri) {
      return (<>
        {unreadDividerEl}
        <SwipeToReply onReply={() => handleReply(item)} accentColor={Colors.primary}>
        <View style={styles.msgWrapper}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={(e) => handleTapMessage(item, e)}
            onLongPress={(e) => handleLongPressMessage(item, e)}
            delayLongPress={400}
            style={[styles.msgBubble, isMe ? styles.myMsg : styles.theirMsg, styles.imageBubble]}
          >
            {starredIds.has(item.id) && (
              <View style={styles.starBadge}>
                <Ionicons name="star" size={10} color={Colors.gold || "#FFD700"} />
              </View>
            )}
            <Image source={{ uri: item.imageUri }} style={styles.chatImage} resizeMode="cover" />
            <View style={styles.imageTimeRow}>
              <Text style={[styles.msgTime, isMe && styles.myMsgTime]}>{formatTime(item.timestamp)}</Text>
              {renderDisappearingCountdown(item, isMe)}
              {renderReadReceipt(item)}
            </View>
          </TouchableOpacity>
          {renderReactions(item)}
        </View>
        </SwipeToReply>
      </>);
    }

    // Voice message with waveform
    if (item.type === "voice") {
      const progress = voicePlaybackProgress[item.id] || 0;
      return (<>
        {unreadDividerEl}
        <SwipeToReply onReply={() => handleReply(item)} accentColor={Colors.primary}>
        <View style={styles.msgWrapper}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={(e) => handleTapMessage(item, e)}
            onLongPress={(e) => handleLongPressMessage(item, e)}
            delayLongPress={400}
            style={[styles.msgBubble, isMe ? styles.myMsg : styles.theirMsg]}
          >
            {starredIds.has(item.id) && (
              <View style={styles.starBadge}>
                <Ionicons name="star" size={10} color={Colors.gold || "#FFD700"} />
              </View>
            )}
            <TouchableOpacity
              style={styles.voiceNoteRow}
              onPress={() => playVoiceNote(item.id, item.voiceDuration || 3)}
              activeOpacity={0.7}
            >
              <Ionicons
                name={playingVoiceId === item.id ? "pause-circle" : "play-circle"}
                size={32}
                color={isMe ? "#FFFFFF" : Colors.secondary}
              />
              <View style={styles.voiceWaveform}>
                {Array.from({ length: 20 }).map((_, i) => {
                  const barHeight = 4 + Math.sin(i * 0.8) * 8 + Math.random() * 4;
                  const isPlayed = progress > (i / 20) * 100;
                  return (
                    <View
                      key={i}
                      style={[
                        styles.voiceBar,
                        {
                          height: barHeight,
                          backgroundColor: isMe
                            ? isPlayed ? "#FFFFFF" : "rgba(255,255,255,0.35)"
                            : isPlayed ? Colors.secondary : "rgba(0,170,255,0.25)",
                        },
                      ]}
                    />
                  );
                })}
              </View>
              <Text style={[styles.voiceDuration, isMe && { color: "rgba(255,255,255,0.8)" }]}>
                {playingVoiceId === item.id
                  ? `${Math.floor(((item.voiceDuration || 3) * progress) / 100)}s`
                  : `${item.voiceDuration}s`}
              </Text>
            </TouchableOpacity>
            <View style={styles.imageTimeRow}>
              <Text style={[styles.msgTime, isMe && styles.myMsgTime]}>{formatTime(item.timestamp)}</Text>
              {renderDisappearingCountdown(item, isMe)}
              {renderReadReceipt(item)}
            </View>
          </TouchableOpacity>
          {/* Transcribe button */}
          <TouchableOpacity
            style={[styles.transcribeBtn, isMe ? styles.transcribeBtnRight : styles.transcribeBtnLeft]}
            onPress={() => transcribeVoiceMessage(item.id)}
            activeOpacity={0.7}
          >
            {transcribingId === item.id ? (
              <Text style={styles.transcribeBtnText}>Transcribing...</Text>
            ) : (
              <>
                <Ionicons name="document-text-outline" size={12} color={Colors.secondary} />
                <Text style={styles.transcribeBtnText}>
                  {transcriptions[item.id] ? "Hide" : "Transcribe"}
                </Text>
              </>
            )}
          </TouchableOpacity>
          {/* Transcription text */}
          {transcriptions[item.id] && (
            <View style={[styles.transcriptionBlock, isMe ? styles.transcriptionBlockRight : styles.transcriptionBlockLeft]}>
              <Text style={styles.transcriptionText}>{transcriptions[item.id]}</Text>
            </View>
          )}
                    {renderReactions(item)}
        </View>
        </SwipeToReply>
      </>);
    }
    // Text message
    const isSearchHighlighted = searchResults.includes(item.id);
    return (<>
      {unreadDividerEl}
      <SwipeToReply onReply={() => handleReply(item)} accentColor={Colors.primary}>
      <View style={styles.msgWrapper}>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={(e) => handleTapMessage(item, e)}
          onLongPress={(e) => handleLongPressMessage(item, e)}
          delayLongPress={400}
          style={[styles.msgBubble, isMe ? styles.myMsg : styles.theirMsg, isSearchHighlighted && styles.searchHighlight]}
        >
          {starredIds.has(item.id) && (
            <View style={styles.starBadge}>
              <Ionicons name="star" size={10} color={Colors.gold || "#FFD700"} />
            </View>
          )}
          {/* Reply quote bubble - tap to open thread */}
          {item.replyTo && (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => openThread(item.replyTo!.id)}
              style={[styles.replyQuote, isMe ? styles.replyQuoteMine : styles.replyQuoteTheirs]}
            >
              <View style={[styles.replyQuoteLine, { backgroundColor: isMe ? "rgba(255,255,255,0.6)" : Colors.secondary }]} />
              <View style={styles.replyQuoteContent}>
                <Text style={[styles.replyQuoteSender, isMe && { color: "rgba(255,255,255,0.8)" }]}>
                  {item.replyTo.sender === "me" ? "You" : selectedContact?.name || "Them"}
                </Text>
                <Text style={[styles.replyQuoteText, isMe && { color: "rgba(255,255,255,0.7)" }]} numberOfLines={2}>
                  {item.replyTo.text}
                </Text>
              </View>
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={() => translateMessage(item)} activeOpacity={0.7}>
            <Text style={[styles.msgText, isMe && styles.myMsgText]}>{item.text}</Text>
            {translatingId === item.id && (
              <View style={styles.translatingRow}>
                <Ionicons name="language" size={12} color={isMe ? "rgba(255,255,255,0.7)" : Colors.secondary} />
                <Text style={[styles.translatingText, isMe && { color: "rgba(255,255,255,0.7)" }]}>Translating...</Text>
              </View>
            )}
            {showTranslation[item.id] && item.translation && (
              <View style={[styles.translationBlock, isMe ? styles.myTranslation : styles.theirTranslation]}>
                <View style={styles.translationHeader}>
                  <Ionicons name="language" size={12} color={isMe ? "rgba(255,255,255,0.8)" : Colors.secondary} />
                  <Text style={[styles.translationLabel, isMe && { color: "rgba(255,255,255,0.7)" }]}>
                    Translation
                  </Text>
                </View>
                <Text style={[styles.translationText, isMe && { color: "rgba(255,255,255,0.9)" }]}>
                  {item.translation}
                </Text>
              </View>
            )}
          </TouchableOpacity>
          {item.edited && (
            <TouchableOpacity onPress={() => setShowOriginalFor(showOriginalFor === item.id ? null : item.id)} activeOpacity={0.7}>
              <Text style={[styles.editedLabel, isMe && { color: "rgba(255,255,255,0.6)" }]}>Edited</Text>
            </TouchableOpacity>
          )}
          {showOriginalFor === item.id && item.originalText && (
            <View style={[styles.originalTextBlock, isMe ? { backgroundColor: "rgba(255,255,255,0.1)" } : { backgroundColor: "rgba(0,0,0,0.04)" }]}>
              <Text style={[styles.originalTextLabel, isMe && { color: "rgba(255,255,255,0.6)" }]}>Original:</Text>
              <Text style={[styles.originalTextContent, isMe && { color: "rgba(255,255,255,0.8)" }]}>{item.originalText}</Text>
            </View>
          )}
          <View style={styles.imageTimeRow}>
            <Text style={[styles.msgTime, isMe && styles.myMsgTime]}>{formatTime(item.timestamp)}</Text>
            {renderDisappearingCountdown(item, isMe)}
            {renderReadReceipt(item)}
          </View>
        </TouchableOpacity>
        {/* Inline Translate button for received messages */}
        {!isMe && !item.translation && translatingId !== item.id && (
          <TouchableOpacity
            style={styles.inlineTranslateBtn}
            onPress={() => translateMessage(item)}
            activeOpacity={0.7}
          >
            <Ionicons name="language" size={13} color={Colors.secondary} />
            <Text style={styles.inlineTranslateBtnText}>Translate</Text>
          </TouchableOpacity>
        )}
        {renderReactions(item)}
      </View>
      </SwipeToReply>
    </>);
  };

  // ─── TYPING INDICATOR FOOTER ───────────────────────────────────────────────────
  const renderTypingIndicator = () => {
    if (!isThemTyping) return null;
    return (
      <View style={styles.typingContainer}>
        <View style={styles.typingAvatarWrap}>
          <Text style={styles.typingAvatar}>{selectedContact?.avatar}</Text>
        </View>
        <Animated.View style={[styles.typingBubble, { opacity: typingAnim.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] }) }]}>
          <View style={styles.typingDotsRow}>
            <Animated.View style={[styles.typingDot, { backgroundColor: Colors.secondary, transform: [{ translateY: typingDot1 }] }]} />
            <Animated.View style={[styles.typingDot, { backgroundColor: Colors.secondary, transform: [{ translateY: typingDot2 }] }]} />
            <Animated.View style={[styles.typingDot, { backgroundColor: Colors.secondary, transform: [{ translateY: typingDot3 }] }]} />
          </View>
        </Animated.View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      {/* Chat header */}
      <View style={styles.chatHeader}>
        <TouchableOpacity style={styles.backBtn} onPress={() => setSelectedContact(null)}>
          <Ionicons name="chevron-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.chatHeaderCenter}>
          <View style={styles.chatHeaderAvatarWrap}>
            <Text style={styles.chatHeaderAvatar}>{selectedContact.avatar}</Text>
            <View style={[styles.presenceDot, selectedContact.online ? styles.presenceDotOnline : styles.presenceDotOffline]} />
          </View>
          <View>
            <Text style={styles.chatHeaderName}>{selectedContact.name}</Text>
            <Text style={styles.chatHeaderStatus}>
              {isThemTyping ? "typing..." : selectedContact.online ? "Online" : selectedContact.lastSeen || "Offline"}
            </Text>
          </View>
        </View>
        {disappearingTimer !== "off" && (
          <View style={styles.timerBadge}>
            <Ionicons name="timer-outline" size={12} color={Colors.secondary} />
            <Text style={styles.timerBadgeText}>{getTimerLabel(disappearingTimer)}</Text>
          </View>
        )}
        <TouchableOpacity style={styles.callBtn} onPress={() => setSearchMode(!searchMode)}>
          <Ionicons name="search" size={18} color={searchMode ? Colors.gold : Colors.secondary} />
        </TouchableOpacity>
        <TouchableOpacity style={[styles.callBtn, { marginLeft: 4 }]}>
          <Ionicons name="videocam" size={20} color={Colors.secondary} />
        </TouchableOpacity>
        <TouchableOpacity style={[styles.callBtn, { marginLeft: 4 }]} onPress={toggleMute}>
          <Ionicons name={isMuted ? "notifications-off" : "notifications"} size={18} color={isMuted ? Colors.error : Colors.secondary} />
        </TouchableOpacity>
        <TouchableOpacity style={[styles.callBtn, { marginLeft: 4 }]} onPress={showExportOptions}>
          <Ionicons name="share-outline" size={18} color={Colors.secondary} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.callBtn, { marginLeft: 4 }]}
          onPress={() => router.push({
            pathname: "/chat-contact-info",
            params: {
              contactId: selectedContact.id,
              contactName: selectedContact.name,
              contactAvatar: selectedContact.avatar,
              contactType: selectedContact.type,
            },
          } as any)}
        >
          <Ionicons name="information-circle-outline" size={20} color={Colors.secondary} />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      {searchMode && (
        <>
        <View style={styles.msgSearchBar}>
          <Ionicons name="search" size={16} color={Colors.textMuted} />
          <TextInput
            style={styles.msgSearchInput}
            placeholder="Search in conversation..."
            placeholderTextColor={Colors.textMuted}
            value={msgSearchQuery}
            onChangeText={handleMsgSearch}
            autoFocus
          />
          {searchResults.length > 0 && (
            <Text style={styles.msgSearchCount}>
              {currentSearchIndex + 1}/{searchResults.length}
            </Text>
          )}
          <TouchableOpacity onPress={() => navigateSearchResult("prev")} style={styles.msgSearchNav}>
            <Ionicons name="chevron-up" size={18} color={Colors.secondary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigateSearchResult("next")} style={styles.msgSearchNav}>
            <Ionicons name="chevron-down" size={18} color={Colors.secondary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => { setSearchMode(false); setMsgSearchQuery(""); setSearchResults([]); setSearchFilter("all"); }} style={styles.msgSearchNav}>
            <Ionicons name="close" size={18} color={Colors.textMuted} />
          </TouchableOpacity>
        </View>
        {/* Filter chips */}
        <View style={styles.searchFilterRow}>
          {(["all", "photos", "links", "voice"] as const).map((f) => {
            const labels = { all: "All", photos: "Photos", links: "Links", voice: "Voice" };
            const icons = { all: "apps-outline", photos: "image-outline", links: "link-outline", voice: "mic-outline" };
            const isActive = searchFilter === f;
            return (
              <TouchableOpacity
                key={f}
                style={[styles.searchFilterChip, isActive && styles.searchFilterChipActive]}
                onPress={() => applySearchFilter(f)}
                activeOpacity={0.7}
              >
                <Ionicons name={icons[f] as any} size={13} color={isActive ? "#FFFFFF" : Colors.textSecondary} />
                <Text style={[styles.searchFilterChipText, isActive && styles.searchFilterChipTextActive]}>{labels[f]}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
        </>
      )}

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
        keyboardVerticalOffset={0}
      >
        {/* Chat area with theme background */}
        <View style={{ flex: 1, position: "relative" }}>
          {renderChatBackground()}
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.messagesList}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
            renderItem={renderMessageItem}
            ListFooterComponent={renderTypingIndicator}
            ListEmptyComponent={
              <View style={styles.emptyChat}>
                <Text style={styles.emptyChatEmoji}>{selectedContact.avatar}</Text>
                <Text style={styles.emptyChatText}>Start a conversation with {selectedContact.name}</Text>
                <Text style={styles.emptyChatSub}>Say hello or ask about their learning progress!</Text>
              </View>
            }
          />
        </View>

        {/* Voice Preview Bar */}
        {voicePreview && (
          <View style={styles.voicePreviewBar}>
            <TouchableOpacity onPress={cancelVoicePreview} style={styles.voicePreviewCancel}>
              <Ionicons name="trash-outline" size={20} color={Colors.accent} />
            </TouchableOpacity>
            <View style={styles.voicePreviewWaveform}>
              {Array.from({ length: 30 }).map((_, i) => (
                <View
                  key={i}
                  style={[styles.voicePreviewBarItem, { height: 4 + Math.sin(i * 0.6) * 10 + Math.random() * 6 }]}
                />
              ))}
            </View>
            <Text style={styles.voicePreviewDuration}>{voicePreview.duration}s</Text>
            <TouchableOpacity onPress={sendVoiceMessage} style={styles.voicePreviewSend}>
              <Ionicons name="send" size={18} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        )}

        {/* Reply Preview Bar */}
        {replyTo && (
          <View style={styles.replyPreviewBar}>
            <View style={[styles.replyPreviewLine, { backgroundColor: Colors.secondary }]} />
            <View style={styles.replyPreviewContent}>
              <Text style={styles.replyPreviewSender}>
                {replyTo.sender === "me" ? "You" : selectedContact?.name || "Them"}
              </Text>
              <Text style={styles.replyPreviewText} numberOfLines={1}>{replyTo.text}</Text>
            </View>
            <TouchableOpacity onPress={() => setReplyTo(null)} style={styles.replyPreviewClose}>
              <Ionicons name="close" size={18} color={Colors.textMuted} />
            </TouchableOpacity>
          </View>
        )}

        {/* Input */}
        {/* Editing banner */}
        {editingMsgId && (
          <View style={styles.editBanner}>
            <Ionicons name="pencil" size={14} color={Colors.primary} />
            <Text style={styles.editBannerText}>Editing message</Text>
            <TouchableOpacity onPress={() => { setEditingMsgId(null); setInput(""); }}>
              <Ionicons name="close" size={18} color={Colors.secondary} />
            </TouchableOpacity>
          </View>
        )}
        {!voicePreview && (
          <View style={styles.inputContainer}>
            <View style={styles.inputWrap}>
              <TouchableOpacity style={styles.attachBtn} onPress={handleAttachPress}>
                <Ionicons name="add-circle" size={24} color={Colors.secondary} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.translateToggle, translateMode && styles.translateToggleActive]}
                onPress={() => {
                  setTranslateMode(!translateMode);
                  if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
              >
                <Ionicons name="language" size={18} color={translateMode ? "#FFFFFF" : Colors.secondary} />
              </TouchableOpacity>
              <TextInput
                style={styles.input}
                placeholder="Type a message..."
                placeholderTextColor={Colors.textMuted}
                value={input}
                onChangeText={setInput}
                multiline
                maxLength={1000}
                returnKeyType="send"
                onSubmitEditing={sendMessage}
              />
              {input.trim() ? (
                <TouchableOpacity
                  style={[styles.sendBtn, translateMode && { backgroundColor: Colors.gold }]}
                  onPress={editingMsgId ? confirmEditMessage : (translateMode ? sendTranslatedMessage : sendMessage)}
                  onLongPress={editingMsgId ? undefined : showScheduleOptions}
                  delayLongPress={500}
                >
                  <Ionicons name={editingMsgId ? "checkmark" : (translateMode ? "language" : "send")} size={18} color="#FFFFFF" />
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={[styles.micBtn, isRecording && styles.micBtnRecording]}
                  onPressIn={startVoiceRecording}
                  onPressOut={stopVoiceRecording}
                >
                  <Ionicons name={isRecording ? "radio-button-on" : "mic"} size={20} color={isRecording ? Colors.accent : Colors.secondary} />
                </TouchableOpacity>
              )}
            </View>
            {isRecording && (
              <View style={styles.recordingIndicator}>
                <View style={styles.recordingDot} />
                <Text style={styles.recordingText}>{recordingDuration}s • Hold to record, release to preview</Text>
                <View style={styles.recordingWaveformMini}>
                  {Array.from({ length: 8 }).map((_, i) => (
                    <Animated.View
                      key={i}
                      style={[
                        styles.recordingWaveBar,
                        {
                          height: waveformAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [4, 4 + Math.random() * 12],
                          }),
                        },
                      ]}
                    />
                  ))}
                </View>
              </View>
            )}
          </View>
        )}
      </KeyboardAvoidingView>

      {/* Reaction Menu Overlay */}
      {reactionMenuMsgId && (
        <TouchableOpacity
          style={styles.reactionOverlay}
          activeOpacity={1}
          onPress={() => setReactionMenuMsgId(null)}
        >
          <Animated.View
            style={[
              styles.reactionMenu,
              {
                top: reactionMenuPosition.top,
                left: reactionMenuPosition.left,
                transform: [{ scale: reactionScaleAnim }],
              },
            ]}
          >
            {REACTION_EMOJIS.map((emoji) => (
              <TouchableOpacity
                key={emoji}
                style={styles.reactionOption}
                onPress={() => addReaction(reactionMenuMsgId, emoji)}
              >
                <Text style={styles.reactionOptionEmoji}>{emoji}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={styles.reactionOption}
              onPress={() => {
                const msg = messages.find((m) => m.id === reactionMenuMsgId);
                if (msg) {
                  setReactionMenuMsgId(null);
                  handleStarMessage(msg);
                }
              }}
            >
              <Ionicons name="star-outline" size={20} color={Colors.gold || "#FFD700"} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.reactionOption}
              onPress={() => {
                const msg = messages.find((m) => m.id === reactionMenuMsgId);
                if (msg) handleReply(msg);
              }}
            >
              <Ionicons name="arrow-undo" size={20} color={Colors.secondary} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.reactionOption}
              onPress={() => {
                const msg = messages.find((m) => m.id === reactionMenuMsgId);
                if (msg) handleForward(msg);
              }}
            >
              <Ionicons name="arrow-redo" size={20} color={Colors.secondary} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.reactionOption}
              onPress={() => {
                setEmojiPickerMsgId(reactionMenuMsgId);
                setShowFullEmojiPicker(true);
                setReactionMenuMsgId(null);
              }}
            >
              <Ionicons name="add-circle-outline" size={20} color={Colors.muted} />
            </TouchableOpacity>
          </Animated.View>
        </TouchableOpacity>
      )}

      {/* Schedule Picker Modal (Android/Web) */}
      <Modal visible={showSchedulePicker} transparent animationType="fade" onRequestClose={() => setShowSchedulePicker(false)}>
        <TouchableOpacity style={styles.scheduleOverlay} activeOpacity={1} onPress={() => setShowSchedulePicker(false)}>
          <View style={styles.scheduleSheet}>
            <Text style={styles.scheduleTitle}>Schedule Message</Text>
            <Text style={styles.schedulePreview}>"{input.trim().slice(0, 50)}{input.trim().length > 50 ? "..." : ""}"</Text>
            {[{ label: "In 15 minutes", mins: 15 }, { label: "In 1 hour", mins: 60 }, { label: "In 3 hours", mins: 180 }, { label: "Tomorrow morning", mins: 720 }].map((opt) => (
              <TouchableOpacity key={opt.mins} style={styles.scheduleOption} onPress={() => scheduleMessage(opt.mins)} activeOpacity={0.7}>
                <Ionicons name="time-outline" size={18} color={Colors.secondary} />
                <Text style={styles.scheduleOptionText}>{opt.label}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={styles.scheduleCancelBtn} onPress={() => setShowSchedulePicker(false)}>
              <Text style={styles.scheduleCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Pending scheduled messages indicator */}
      {scheduledMessages.length > 0 && (
        <View style={styles.scheduledBanner}>
          <Ionicons name="time-outline" size={14} color={Colors.gold || "#FFD700"} />
          <Text style={styles.scheduledBannerText}>{scheduledMessages.length} message{scheduledMessages.length > 1 ? "s" : ""} scheduled</Text>
        </View>
      )}
      {/* Full Emoji Picker Modal */}
      <Modal visible={showFullEmojiPicker} transparent animationType="slide" onRequestClose={() => setShowFullEmojiPicker(false)}>
        <TouchableOpacity style={styles.scheduleOverlay} activeOpacity={1} onPress={() => setShowFullEmojiPicker(false)}>
          <View style={[styles.emojiPickerSheet, { backgroundColor: Colors.surface }]}>
            <View style={styles.emojiPickerHeader}>
              <Text style={[styles.emojiPickerTitle, { color: Colors.foreground }]}>Choose Reaction</Text>
              <TouchableOpacity onPress={() => setShowFullEmojiPicker(false)}>
                <Ionicons name="close" size={24} color={Colors.muted} />
              </TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={styles.emojiGrid}>
              {["😀","😃","😄","😁","😆","😅","🤣","😂","🙂","😊","😇","🥰","😍","🤩","😘","😗","😚","😙","🥲","😋","😛","😜","🤪","😝","🤑","🤗","🤭","🫢","🤫","🤔","🫡","🤐","🤨","😐","😑","😶","🫥","😏","😒","🙄","😬","🤥","😌","😔","😪","🤤","😴","😷","🤒","🤕","🤢","🤮","🥵","🥶","🥴","😵","🤯","🤠","🥳","🥸","😎","🤓","🧐","😕","🫤","😟","🙁","😮","😯","😲","😳","🥺","🥹","😦","😧","😨","😰","😥","😢","😭","😱","😖","😣","😞","😓","😩","😫","🥱","😤","😡","😠","🤬","😈","👿","💀","☠️","💩","🤡","👹","👺","👻","👽","👾","🤖","❤️","🧡","💛","💚","💙","💜","🖤","🤍","🤎","💔","❤️‍🔥","💕","💞","💓","💗","💖","💘","💝","👍","👎","👊","✊","🤛","🤜","👏","🙌","🫶","👐","🤲","🤝","🙏","✌️","🤞","🫰","🤟","🤘","👌","🤌","🫳","🫴","👈","👉","👆","👇","☝️","✋","🤚","🖐️","🖖","🫱","🫲","👋","🤙","💪","🦾","🔥","⭐","🌟","✨","💫","🎉","🎊","🏆","🥇","🥈","🥉","🎵","🎶","💯","✅","❌","⚡","💡","🌈","☀️","🌙","⛅","🌊"].map((emoji) => (
                <TouchableOpacity
                  key={emoji}
                  style={styles.emojiPickerItem}
                  onPress={() => {
                    if (emojiPickerMsgId) addReaction(emojiPickerMsgId, emoji);
                    setShowFullEmojiPicker(false);
                    setEmojiPickerMsgId(null);
                  }}
                >
                  <Text style={styles.emojiPickerEmoji}>{emoji}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {renderThreadView()}
      {renderForwardPicker()}
    </SafeAreaView>
  );

  function handleStarMessage(msg: Message) {
    if (!selectedContact) return;
    const isStarred = starredIds.has(msg.id);
    const action = isStarred ? "Unstar" : "Star";
    Alert.alert(
      `${action} Message`,
      isStarred ? "Remove this message from starred?" : "Star this message for quick reference?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: action,
          onPress: async () => {
            await toggleStarredMessage(selectedContact!.id, {
              id: msg.id,
              text: msg.text,
              sender: msg.sender,
              timestamp: msg.timestamp,
              contactName: selectedContact!.name,
              contactAvatar: selectedContact!.avatar,
            });
            setStarredIds((prev) => {
              const next = new Set(prev);
              if (isStarred) next.delete(msg.id);
              else next.add(msg.id);
              return next;
            });
            if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          },
        },
      ]
    );
  }
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
  newMsgBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.secondary + "15",
    alignItems: "center",
    justifyContent: "center",
  },
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: Spacing.lg,
    backgroundColor: Colors.surfaceCard,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: FontSize.sm,
    color: Colors.textPrimary,
  },
  filterRow: {
    flexDirection: "row",
    paddingHorizontal: Spacing.lg,
    gap: 8,
    marginBottom: Spacing.md,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surfaceCard,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterChipActive: {
    backgroundColor: Colors.secondary + "20",
    borderColor: Colors.glowBorder,
  },
  filterChipText: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    fontWeight: "500",
  },
  filterChipTextActive: {
    color: Colors.secondary,
  },
  contactList: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: 100,
  },
  contactCard: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  contactAvatarWrap: {
    position: "relative",
  },
  contactAvatar: {
    fontSize: 28,
    width: 44,
    height: 44,
    textAlign: "center",
    lineHeight: 44,
    backgroundColor: Colors.surfaceCard,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: "hidden",
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
    borderColor: Colors.primary,
  },
  contactInfo: {
    flex: 1,
    marginLeft: 12,
  },
  contactName: {
    fontSize: FontSize.md,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  contactStatus: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    marginTop: 2,
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  typeBadgeText: {
    fontSize: 10,
    fontWeight: "600",
  },
  emptyState: {
    alignItems: "center",
    paddingTop: 60,
    gap: 12,
  },
  emptyText: {
    fontSize: FontSize.md,
    color: Colors.textMuted,
  },
  // Chat view
  chatHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  chatHeaderCenter: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 12,
    gap: 10,
  },
  chatHeaderAvatarWrap: {
    position: "relative",
  },
  chatHeaderAvatar: {
    fontSize: 24,
    width: 34,
    height: 34,
    textAlign: "center",
    lineHeight: 34,
    backgroundColor: Colors.surfaceCard,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: "hidden",
  },
  onlineDotSmall: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.success,
    borderWidth: 1.5,
    borderColor: Colors.primary,
  },
  chatHeaderName: {
    fontSize: FontSize.md,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  chatHeaderStatus: {
    fontSize: FontSize.xs,
    color: Colors.success,
  },
  callBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.secondary + "15",
    alignItems: "center",
    justifyContent: "center",
  },
  timerBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: Colors.secondary + "15",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
  },
  timerBadgeText: {
    fontSize: 10,
    color: Colors.secondary,
    fontWeight: "600",
  },
  messagesList: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    paddingBottom: 10,
  },
  msgWrapper: {
    marginBottom: 8,
  },
  msgBubble: {
    maxWidth: "80%",
    borderRadius: BorderRadius.lg,
    padding: 10,
  },
  myMsg: {
    alignSelf: "flex-end",
    backgroundColor: Colors.secondary,
    borderBottomRightRadius: 4,
  },
  theirMsg: {
    alignSelf: "flex-start",
    backgroundColor: Colors.surfaceCard,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  imageBubble: {
    padding: 4,
    overflow: "hidden",
  },
  chatImage: {
    width: 200,
    height: 200,
    borderRadius: BorderRadius.md,
  },
  imageTimeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
    alignSelf: "flex-end",
  },
  doubleCheck: {
    flexDirection: "row",
    alignItems: "center",
  },
  msgText: {
    fontSize: FontSize.sm,
    color: Colors.textPrimary,
    lineHeight: 20,
  },
  myMsgText: {
    color: "#FFFFFF",
  },
  msgTime: {
    fontSize: 10,
    color: Colors.textMuted,
  },
  myMsgTime: {
    color: "rgba(255,255,255,0.7)",
  },
  emptyChat: {
    alignItems: "center",
    paddingTop: 80,
    gap: 8,
  },
  emptyChatEmoji: {
    fontSize: 48,
  },
  emptyChatText: {
    fontSize: FontSize.md,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  emptyChatSub: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
  },
  // Input area
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
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 6,
  },
  attachBtn: {
    paddingHorizontal: 4,
    paddingVertical: 6,
  },
  input: {
    flex: 1,
    fontSize: FontSize.md,
    color: Colors.textPrimary,
    maxHeight: 100,
    paddingVertical: 6,
  },
  sendBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.secondary,
    alignItems: "center",
    justifyContent: "center",
  },
  micBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  micBtnRecording: {
    backgroundColor: "rgba(255, 45, 45, 0.15)",
    borderWidth: 1,
    borderColor: Colors.redBorder,
  },
  // Voice note styles
  voiceNoteRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 4,
  },
  voiceWaveform: {
    flexDirection: "row",
    alignItems: "center",
    gap: 1.5,
    flex: 1,
  },
  voiceBar: {
    width: 2.5,
    borderRadius: 2,
  },
  voiceDuration: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    fontWeight: "600",
    minWidth: 24,
  },
  // Recording indicator
  recordingIndicator: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 8,
  },
  recordingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.accent,
  },
  recordingText: {
    fontSize: FontSize.xs,
    color: Colors.accent,
    fontWeight: "600",
  },
  recordingWaveformMini: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    marginLeft: 4,
  },
  recordingWaveBar: {
    width: 3,
    borderRadius: 2,
    backgroundColor: Colors.accent,
  },
  // Voice preview bar
  voicePreviewBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.primary,
    gap: 12,
  },
  voicePreviewCancel: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.accent + "15",
    alignItems: "center",
    justifyContent: "center",
  },
  voicePreviewWaveform: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    height: 32,
  },
  voicePreviewBarItem: {
    width: 3,
    borderRadius: 2,
    backgroundColor: Colors.secondary,
  },
  voicePreviewDuration: {
    fontSize: FontSize.sm,
    color: Colors.textPrimary,
    fontWeight: "600",
  },
  voicePreviewSend: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.secondary,
    alignItems: "center",
    justifyContent: "center",
  },
  // Typing indicator
  typingContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    gap: 8,
  },
  typingAvatarWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.surfaceCard,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  typingAvatar: {
    fontSize: 14,
  },
  typingBubble: {
    backgroundColor: Colors.surfaceCard,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  typingDotsRow: {
    flexDirection: "row",
    gap: 4,
  },
  typingDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  // Reactions
  reactionsContainer: {
    flexDirection: "row",
    marginTop: -4,
    gap: 2,
  },
  reactionsRight: {
    alignSelf: "flex-end",
    marginRight: 8,
  },
  reactionsLeft: {
    alignSelf: "flex-start",
    marginLeft: 8,
  },
  reactionBubble: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surfaceCard,
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 2,
  },
  reactionEmoji: {
    fontSize: 14,
  },
  reactionCount: {
    fontSize: 11,
    fontWeight: "600",
    color: Colors.textSecondary,
  },
  reactionOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.3)",
    zIndex: 1000,
  },
  reactionMenu: {
    position: "absolute",
    flexDirection: "row",
    backgroundColor: Colors.surfaceCard,
    borderRadius: 24,
    paddingHorizontal: 8,
    paddingVertical: 6,
    gap: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  reactionOption: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  reactionOptionEmoji: {
    fontSize: 22,
  },
  // Inline translation styles
  translatingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
  },
  translatingText: {
    fontSize: 10,
    color: Colors.secondary,
    fontStyle: "italic",
  },
  translationBlock: {
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: 0.5,
  },
  myTranslation: {
    borderTopColor: "rgba(255,255,255,0.3)",
  },
  theirTranslation: {
    borderTopColor: Colors.border,
  },
  translationHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 2,
  },
  translationLabel: {
    fontSize: 10,
    color: Colors.secondary,
    fontWeight: "600",
  },
  translationText: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    lineHeight: 18,
    fontStyle: "italic",
  },
  translateToggle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.secondary + "15",
  },
  translateToggleActive: {
    backgroundColor: Colors.secondary,
  },
  starBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: Colors.surfaceCard,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.border,
    zIndex: 10,
  },
  // ─── SEARCH BAR ─────────────────────────────────────────────────────────────
  msgSearchBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: Colors.surfaceCard,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: 8,
  },
  msgSearchInput: {
    flex: 1,
    fontSize: 14,
    color: Colors.textPrimary,
    paddingVertical: 4,
  },
  msgSearchCount: {
    fontSize: 12,
    color: Colors.textMuted,
    marginRight: 4,
  },
  msgSearchNav: {
    padding: 4,
  },
  searchHighlight: {
    borderWidth: 2,
    borderColor: Colors.gold || "#FFD700",
  },
  // ─── REPLY QUOTE ────────────────────────────────────────────────────────────
  replyQuote: {
    flexDirection: "row",
    marginBottom: 6,
    borderRadius: 6,
    padding: 6,
    overflow: "hidden",
  },
  replyQuoteMine: {
    backgroundColor: "rgba(255,255,255,0.15)",
  },
  replyQuoteTheirs: {
    backgroundColor: Colors.surfaceCard,
  },
  replyQuoteLine: {
    width: 3,
    borderRadius: 2,
    marginRight: 8,
  },
  replyQuoteContent: {
    flex: 1,
  },
  replyQuoteSender: {
    fontSize: 11,
    fontWeight: "600",
    color: Colors.secondary,
    marginBottom: 2,
  },
  replyQuoteText: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  // ─── REPLY PREVIEW BAR ──────────────────────────────────────────────────────
  replyPreviewBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: Colors.surfaceCard,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    gap: 8,
  },
  replyPreviewLine: {
    width: 3,
    height: 32,
    borderRadius: 2,
  },
  replyPreviewContent: {
    flex: 1,
  },
  replyPreviewSender: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.secondary,
  },
  replyPreviewText: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },
  replyPreviewClose: {
    padding: 4,
  },
  inlineTranslateBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginTop: 3,
    alignSelf: "flex-start",
    backgroundColor: "rgba(0, 170, 255, 0.08)",
    borderRadius: 10,
    borderWidth: 0.5,
    borderColor: "rgba(0, 170, 255, 0.2)",
  },
  inlineTranslateBtnText: {
    fontSize: 11,
    color: Colors.secondary,
    fontWeight: "500",
  },
  transcribeBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 10,
    backgroundColor: "rgba(0, 170, 255, 0.08)",
  },
  transcribeBtnRight: {
    alignSelf: "flex-end",
    marginRight: 8,
  },
  transcribeBtnLeft: {
    alignSelf: "flex-start",
    marginLeft: 8,
  },
  transcribeBtnText: {
    fontSize: 11,
    color: Colors.secondary,
    fontWeight: "500",
  },
  transcriptionBlock: {
    marginTop: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: "rgba(0, 170, 255, 0.06)",
    borderLeftWidth: 2,
    borderLeftColor: Colors.secondary,
    maxWidth: "75%",
  },
  transcriptionBlockRight: {
    alignSelf: "flex-end",
    marginRight: 8,
  },
  transcriptionBlockLeft: {
    alignSelf: "flex-start",
    marginLeft: 8,
  },
  transcriptionText: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 17,
    fontStyle: "italic",
  },
  searchFilterRow: {
    flexDirection: "row",
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 8,
    backgroundColor: Colors.surfaceCard,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.border,
  },
  searchFilterChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    backgroundColor: Colors.surfaceElevated || "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  searchFilterChipActive: {
    backgroundColor: Colors.secondary,
    borderColor: Colors.secondary,
  },
  searchFilterChipText: {
    fontSize: 12,
    fontWeight: "500",
    color: Colors.textSecondary,
  },
  searchFilterChipTextActive: {
    color: "#FFFFFF",
  },
  scheduleOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  scheduleSheet: {
    backgroundColor: Colors.surfaceCard,
    borderRadius: 16,
    padding: 20,
    width: "80%",
    maxWidth: 320,
  },
  scheduleTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: Colors.textPrimary,
    textAlign: "center",
    marginBottom: 4,
  },
  schedulePreview: {
    fontSize: 13,
    color: Colors.textMuted,
    textAlign: "center",
    marginBottom: 16,
    fontStyle: "italic",
  },
  scheduleOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.border,
  },
  scheduleOptionText: {
    fontSize: 15,
    color: Colors.textPrimary,
  },
  scheduleCancelBtn: {
    marginTop: 12,
    alignItems: "center",
    paddingVertical: 10,
  },
  scheduleCancelText: {
    fontSize: 15,
    color: Colors.textMuted,
    fontWeight: "500",
  },
  scheduledBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 6,
    backgroundColor: "rgba(255, 215, 0, 0.1)",
    borderTopWidth: 0.5,
    borderTopColor: Colors.border,
  },
  scheduledBannerText: {
    fontSize: 12,
    color: Colors.gold || "#FFD700",
    fontWeight: "500",
  },
  countdownContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    marginLeft: 4,
  },
  countdownText: {
    fontSize: 9,
    color: Colors.textMuted,
    fontWeight: "500",
  },
  countdownTextMe: {
    color: "rgba(255,255,255,0.7)",
  },
  threadOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 100,
  },
  threadContainer: {
    width: "90%",
    maxHeight: "80%",
    backgroundColor: Colors.surface,
    borderRadius: 16,
    overflow: "hidden",
  },
  threadHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 14,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.border,
  },
  threadTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.text,
  },
  threadList: {
    padding: 12,
  },
  threadBubble: {
    padding: 10,
    borderRadius: 12,
    marginBottom: 8,
    maxWidth: "85%",
  },
  threadBubbleMe: {
    backgroundColor: Colors.primary,
    alignSelf: "flex-end",
  },
  threadBubbleThem: {
    backgroundColor: Colors.surfaceElevated || Colors.surface,
    alignSelf: "flex-start",
  },
  threadBubbleText: {
    fontSize: 14,
    color: Colors.text,
  },
  threadBubbleTextMe: {
    color: "#fff",
  },
  threadBubbleTime: {
    fontSize: 10,
    color: Colors.textMuted,
    marginTop: 4,
  },
  threadOriginalLabel: {
    fontSize: 10,
    color: Colors.secondary,
    fontWeight: "600",
    marginBottom: 2,
  },
  presenceDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: Colors.surface,
    position: "absolute",
    bottom: 0,
    right: 0,
  },
  presenceDotOnline: {
    backgroundColor: "#34C759",
  },
  presenceDotOffline: {
    backgroundColor: "#8E8E93",
  },
  presenceDotList: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: Colors.background,
    position: "absolute",
    bottom: 0,
    right: 0,
  },
  forwardOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  forwardSheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "60%",
    paddingBottom: 30,
  },
  forwardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.border,
  },
  forwardTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: Colors.text,
  },
  forwardPreview: {
    fontSize: 13,
    color: Colors.textMuted,
    paddingHorizontal: 16,
    paddingVertical: 8,
    fontStyle: "italic",
  },
  forwardList: {
    paddingHorizontal: 16,
  },
  forwardContact: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.border,
    gap: 12,
  },
  forwardContactAvatar: {
    fontSize: 28,
  },
  forwardContactName: {
    flex: 1,
    fontSize: 15,
    fontWeight: "500",
    color: Colors.text,
  },
  unreadDivider: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 16,
    gap: 8,
  },
  unreadDividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.error || "#EF4444",
    opacity: 0.5,
  },
  unreadDividerText: {
    fontSize: 11,
    fontWeight: "600",
    color: Colors.error || "#EF4444",
    textTransform: "uppercase",
  },
  editBanner: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: Colors.surfaceElevated || "#F0F8FF",
    borderTopWidth: 0.5,
    borderTopColor: Colors.border,
    gap: 8,
  },
  editBannerText: {
    flex: 1,
    fontSize: 13,
    color: Colors.primary,
    fontWeight: "500",
  },
  editedLabel: {
    fontSize: 11,
    color: Colors.textMuted || Colors.secondary,
    fontStyle: "italic",
    marginTop: 2,
  },
  originalTextBlock: {
    marginTop: 4,
    padding: 6,
    borderRadius: 6,
    borderLeftWidth: 2,
    borderLeftColor: Colors.primary,
  },
  originalTextLabel: {
    fontSize: 10,
    color: Colors.textMuted || Colors.secondary,
    fontWeight: "600",
    marginBottom: 2,
  },
  originalTextContent: {
    fontSize: 13,
    color: Colors.textPrimary,
  },
  emojiPickerSheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "60%",
    paddingBottom: 30,
  },
  emojiPickerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.border,
  },
  emojiPickerTitle: {
    fontSize: 17,
    fontWeight: "600",
  },
  emojiGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 12,
    paddingTop: 12,
  },
  emojiPickerItem: {
    width: "12.5%",
    aspectRatio: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emojiPickerEmoji: {
    fontSize: 28,
  },
});
