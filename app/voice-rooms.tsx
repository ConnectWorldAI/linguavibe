/**
 * Voice Rooms - Live Audio Group Practice
 * HelloTalk-inspired voice rooms where learners practice together.
 * Features: Room lobby, topic-based rooms, AI moderator, hand raise, live feedback.
 */
import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Platform,
  FlatList,
  Modal,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { ScreenContainer } from "@/components/screen-container";
import { trackVoiceRoomJoined } from "@/lib/analytics";
import { useColors } from "@/hooks/use-colors";
import * as Haptics from "expo-haptics";

// ─── TYPES ──────────────────────────────────────────────────────────────────

interface RoomParticipant {
  id: string;
  name: string;
  avatar: string;
  level: string;
  isSpeaking: boolean;
  isMuted: boolean;
  isHost: boolean;
  isModerator: boolean;
  isAI: boolean;
  handRaised: boolean;
  nativeLanguage: string;
  learningLanguage: string;
}

interface VoiceRoom {
  id: string;
  title: string;
  topic: string;
  language: string;
  flag: string;
  level: "beginner" | "intermediate" | "advanced" | "all";
  hostName: string;
  participantCount: number;
  maxParticipants: number;
  isLive: boolean;
  hasAIModerator: boolean;
  tags: string[];
  description: string;
  startedAt: string;
  scheduledFor?: string;
}

// ─── MOCK DATA ──────────────────────────────────────────────────────────────

const LIVE_ROOMS: VoiceRoom[] = [
  {
    id: "1", title: "Spanish Conversation Hour", topic: "Weekend Plans & Hobbies",
    language: "Spanish", flag: "🇪🇸", level: "intermediate",
    hostName: "María G.", participantCount: 8, maxParticipants: 12,
    isLive: true, hasAIModerator: true,
    tags: ["casual", "conversation", "hobbies"],
    description: "Casual conversation practice. All topics welcome! AI moderator helps with corrections.",
    startedAt: "25 min ago",
  },
  {
    id: "2", title: "Japanese Pronunciation Clinic", topic: "Pitch Accent Practice",
    language: "Japanese", flag: "🇯🇵", level: "intermediate",
    hostName: "Yuki T.", participantCount: 5, maxParticipants: 8,
    isLive: true, hasAIModerator: true,
    tags: ["pronunciation", "pitch-accent", "drill"],
    description: "Focus on pitch accent patterns. AI gives real-time pronunciation feedback.",
    startedAt: "12 min ago",
  },
  {
    id: "3", title: "French Debate Club", topic: "Should AI Replace Teachers?",
    language: "French", flag: "🇫🇷", level: "advanced",
    hostName: "Antoine L.", participantCount: 6, maxParticipants: 10,
    isLive: true, hasAIModerator: false,
    tags: ["debate", "opinions", "advanced"],
    description: "Structured debate practice. Pick a side and argue in French!",
    startedAt: "40 min ago",
  },
  {
    id: "4", title: "Korean Drama Discussion", topic: "Reviewing This Week's K-Drama",
    language: "Korean", flag: "🇰🇷", level: "all",
    hostName: "민지 K.", participantCount: 11, maxParticipants: 15,
    isLive: true, hasAIModerator: true,
    tags: ["entertainment", "drama", "casual"],
    description: "Discuss the latest K-dramas in Korean. Spoilers allowed! Beginners welcome.",
    startedAt: "1 hr ago",
  },
  {
    id: "5", title: "Arabic for Travelers", topic: "Ordering Food in Egypt",
    language: "Arabic", flag: "🇪🇬", level: "beginner",
    hostName: "Ahmed M.", participantCount: 4, maxParticipants: 8,
    isLive: true, hasAIModerator: true,
    tags: ["travel", "food", "beginner-friendly"],
    description: "Learn essential phrases for ordering food in Egyptian Arabic. Very beginner-friendly!",
    startedAt: "8 min ago",
  },
  {
    id: "6", title: "Portuguese Music Jam", topic: "Singing Brazilian Songs Together",
    language: "Portuguese", flag: "🇧🇷", level: "all",
    hostName: "Lucas R.", participantCount: 7, maxParticipants: 12,
    isLive: true, hasAIModerator: false,
    tags: ["music", "singing", "fun"],
    description: "Learn Portuguese through music! We sing together and break down lyrics.",
    startedAt: "18 min ago",
  },
];

const UPCOMING_ROOMS: VoiceRoom[] = [
  {
    id: "u1", title: "Mandarin Tone Training", topic: "The 4 Tones Deep Dive",
    language: "Mandarin", flag: "🇨🇳", level: "beginner",
    hostName: "AI Coach", participantCount: 0, maxParticipants: 10,
    isLive: false, hasAIModerator: true,
    tags: ["tones", "pronunciation", "fundamentals"],
    description: "Master Mandarin tones with AI-powered real-time feedback.",
    startedAt: "", scheduledFor: "In 30 min",
  },
  {
    id: "u2", title: "Italian Cooking Class", topic: "Making Pasta & Learning Vocab",
    language: "Italian", flag: "🇮🇹", level: "intermediate",
    hostName: "Chef Marco", participantCount: 0, maxParticipants: 8,
    isLive: false, hasAIModerator: true,
    tags: ["cooking", "vocabulary", "culture"],
    description: "Cook a real Italian recipe while learning food vocabulary!",
    startedAt: "", scheduledFor: "In 2 hrs",
  },
  {
    id: "u3", title: "German Business Meeting Sim", topic: "Professional Negotiations",
    language: "German", flag: "🇩🇪", level: "advanced",
    hostName: "Herr Schmidt (AI)", participantCount: 0, maxParticipants: 6,
    isLive: false, hasAIModerator: true,
    tags: ["business", "formal", "roleplay"],
    description: "Simulate a real German business meeting. Practice formal register and negotiation.",
    startedAt: "", scheduledFor: "Tomorrow 3pm",
  },
];

const ROOM_PARTICIPANTS: RoomParticipant[] = [
  { id: "1", name: "María G.", avatar: "👩‍🏫", level: "B2", isSpeaking: true, isMuted: false, isHost: true, isModerator: false, isAI: false, handRaised: false, nativeLanguage: "Spanish", learningLanguage: "English" },
  { id: "2", name: "AI Moderator", avatar: "🤖", level: "∞", isSpeaking: false, isMuted: false, isHost: false, isModerator: true, isAI: true, handRaised: false, nativeLanguage: "All", learningLanguage: "All" },
  { id: "3", name: "Jake W.", avatar: "👨‍💻", level: "B1", isSpeaking: false, isMuted: false, isHost: false, isModerator: false, isAI: false, handRaised: true, nativeLanguage: "English", learningLanguage: "Spanish" },
  { id: "4", name: "Yuki T.", avatar: "👩‍🎨", level: "A2", isSpeaking: false, isMuted: true, isHost: false, isModerator: false, isAI: false, handRaised: false, nativeLanguage: "Japanese", learningLanguage: "Spanish" },
  { id: "5", name: "Ahmed K.", avatar: "👨‍🔬", level: "B1", isSpeaking: false, isMuted: false, isHost: false, isModerator: false, isAI: false, handRaised: false, nativeLanguage: "Arabic", learningLanguage: "Spanish" },
  { id: "6", name: "Sophie L.", avatar: "👩‍🎓", level: "A2", isSpeaking: false, isMuted: false, isHost: false, isModerator: false, isAI: false, handRaised: true, nativeLanguage: "French", learningLanguage: "Spanish" },
  { id: "7", name: "Carlos M.", avatar: "🧑‍💼", level: "C1", isSpeaking: false, isMuted: false, isHost: false, isModerator: false, isAI: false, handRaised: false, nativeLanguage: "Spanish", learningLanguage: "English" },
  { id: "8", name: "Min-ji P.", avatar: "👩‍🏭", level: "B2", isSpeaking: false, isMuted: true, isHost: false, isModerator: false, isAI: false, handRaised: false, nativeLanguage: "Korean", learningLanguage: "Spanish" },
];

// ─── COMPONENT ──────────────────────────────────────────────────────────────

// ─── AI MODERATION PROMPTS ──────────────────────────────────────────────────
const AI_CONVERSATION_STARTERS = [
  "Let's go around the room! Tell us about your favorite meal from a country whose language you're learning.",
  "Quick challenge: Describe your morning routine in your target language. I'll help with corrections!",
  "Topic switch! If you could teleport anywhere right now, where would you go? Answer in your target language.",
  "Let's practice numbers — what's your phone number backward? Say it in your target language!",
  "Debate time: Is it better to learn grammar first or vocabulary first? Defend your position!",
  "Story round! Each person adds one sentence to build a story. I'll start: 'Yesterday I found a mysterious letter...'",
  "Tongue twister challenge! I'll give one in each language — try to say it 3 times fast.",
  "Role play: You're ordering food at a restaurant. Who wants to be the waiter?",
];

const AI_FEEDBACK_MESSAGES = [
  { icon: "🎯", text: "Great pronunciation on that last phrase! The stress was perfect." },
  { icon: "💡", text: "Tip: Try using the subjunctive here — it sounds more natural to native speakers." },
  { icon: "🔥", text: "You're on fire! That was a complex sentence and you nailed it." },
  { icon: "📝", text: "Small correction: The verb should be conjugated in the past tense here." },
  { icon: "🌟", text: "Excellent vocabulary choice! That's exactly how a native speaker would say it." },
  { icon: "🤔", text: "I notice some silence — would anyone like to share their thoughts on the topic?" },
  { icon: "🎭", text: "Let's switch it up! Try expressing the same idea using different words." },
  { icon: "👏", text: "Everyone's doing great! Let's move to a slightly harder topic." },
];

const LEVEL_MATCH_OPTIONS = [
  { id: "all", label: "All Levels", icon: "🌐" },
  { id: "beginner", label: "Beginner (A1-A2)", icon: "🌱" },
  { id: "intermediate", label: "Intermediate (B1-B2)", icon: "📚" },
  { id: "advanced", label: "Advanced (C1-C2)", icon: "🎓" },
];

export default function VoiceRoomsScreen() {
  const colors = useColors();
  const [view, setView] = useState<"lobby" | "room">("lobby");
  const [activeRoom, setActiveRoom] = useState<VoiceRoom | null>(null);
  const [participants, setParticipants] = useState(ROOM_PARTICIPANTS);
  const [isMuted, setIsMuted] = useState(true);
  const [handRaised, setHandRaised] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filter, setFilter] = useState<string>("all");
  const [levelFilter, setLevelFilter] = useState<string>("all");
  const [aiFeedbackIdx, setAiFeedbackIdx] = useState(0);
  const [aiPrompt, setAiPrompt] = useState(AI_CONVERSATION_STARTERS[0]);
  const [silenceSeconds, setSilenceSeconds] = useState(0);
  const [showTopicSuggestions, setShowTopicSuggestions] = useState(false);
  const silenceTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const feedbackTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.15, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  // AI Moderation: Rotate feedback messages every 12s
  useEffect(() => {
    if (view !== "room" || !activeRoom?.hasAIModerator) return;
    feedbackTimer.current = setInterval(() => {
      setAiFeedbackIdx((prev) => (prev + 1) % AI_FEEDBACK_MESSAGES.length);
    }, 12000);
    return () => { if (feedbackTimer.current) clearInterval(feedbackTimer.current); };
  }, [view, activeRoom]);

  // AI Moderation: Detect silence and inject conversation prompts
  useEffect(() => {
    if (view !== "room" || !activeRoom?.hasAIModerator) return;
    const anySpeaking = participants.some((p) => p.isSpeaking && !p.isAI);
    if (!anySpeaking) {
      silenceTimer.current = setInterval(() => {
        setSilenceSeconds((prev) => {
          if (prev >= 15) {
            // After 15s silence, AI injects a new conversation starter
            setAiPrompt(AI_CONVERSATION_STARTERS[Math.floor(Math.random() * AI_CONVERSATION_STARTERS.length)]);
            return 0;
          }
          return prev + 1;
        });
      }, 1000);
    } else {
      setSilenceSeconds(0);
    }
    return () => { if (silenceTimer.current) clearInterval(silenceTimer.current); };
  }, [view, activeRoom, participants]);

  const joinRoom = (room: VoiceRoom) => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setActiveRoom(room);
    setView("room");
    trackVoiceRoomJoined(room.id, room.level);
  };

  const leaveRoom = () => {
    if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    setActiveRoom(null);
    setView("lobby");
    setIsMuted(true);
    setHandRaised(false);
  };

  const toggleMute = () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsMuted(!isMuted);
  };

  const toggleHand = () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setHandRaised(!handRaised);
  };

  const getLevelColor = (level: string) => {
    if (level === "beginner") return "#10B981";
    if (level === "intermediate") return "#F59E0B";
    if (level === "advanced") return "#EF4444";
    return "#3B82F6";
  };

  const filters = [
    { id: "all", label: "All" },
    { id: "Spanish", label: "🇪🇸 Spanish" },
    { id: "French", label: "🇫🇷 French" },
    { id: "Japanese", label: "🇯🇵 Japanese" },
    { id: "Korean", label: "🇰🇷 Korean" },
    { id: "Arabic", label: "🇪🇬 Arabic" },
    { id: "Portuguese", label: "🇧🇷 Portuguese" },
  ];

  const filteredRooms = LIVE_ROOMS.filter((r) => {
    const langMatch = filter === "all" || r.language === filter;
    const levelMatch = levelFilter === "all" || r.level === levelFilter || r.level === "all";
    return langMatch && levelMatch;
  });

  // ─── LOBBY VIEW ─────────────────────────────────────────────────────────────

  const renderLobby = () => (
    <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      {/* Hero */}
      <View style={styles.heroSection}>
        <Text style={[styles.heroTitle, { color: colors.foreground }]}>Voice Rooms</Text>
        <Text style={[styles.heroSubtitle, { color: colors.muted }]}>
          Join live conversations with learners worldwide. Practice speaking in real-time.
        </Text>
      </View>

      {/* Create Room Button */}
      <TouchableOpacity
        style={[styles.createRoomBtn, { backgroundColor: colors.primary }]}
        onPress={() => {
          if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          setShowCreateModal(true);
        }}
        activeOpacity={0.8}
      >
        <Ionicons name="add-circle" size={22} color="#FFF" />
        <Text style={styles.createRoomText}>Create a Room</Text>
      </TouchableOpacity>

      {/* Language Filter */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
        {filters.map((f) => (
          <TouchableOpacity
            key={f.id}
            style={[styles.filterChip, filter === f.id && { backgroundColor: colors.primary }]}
            onPress={() => setFilter(f.id)}
          >
            <Text style={[styles.filterText, { color: filter === f.id ? "#FFF" : colors.foreground }]}>{f.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Level Match Filter */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
        {LEVEL_MATCH_OPTIONS.map((l) => (
          <TouchableOpacity
            key={l.id}
            style={[styles.filterChip, levelFilter === l.id && { backgroundColor: "#8B5CF6" }]}
            onPress={() => setLevelFilter(l.id)}
          >
            <Text style={[styles.filterText, { color: levelFilter === l.id ? "#FFF" : colors.foreground }]}>{l.icon} {l.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Live Rooms */}
      <View style={styles.sectionHeader}>
        <Animated.View style={[styles.liveDot, { transform: [{ scale: pulseAnim }] }]} />
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Live Now</Text>
        <Text style={[styles.roomCount, { color: colors.muted }]}>{filteredRooms.length} rooms</Text>
      </View>

      {filteredRooms.map((room) => (
        <TouchableOpacity
          key={room.id}
          style={[styles.roomCard, { backgroundColor: colors.surface }]}
          onPress={() => joinRoom(room)}
          activeOpacity={0.7}
        >
          <View style={styles.roomCardTop}>
            <Text style={styles.roomFlag}>{room.flag}</Text>
            <View style={styles.roomInfo}>
              <Text style={[styles.roomTitle, { color: colors.foreground }]}>{room.title}</Text>
              <Text style={[styles.roomTopic, { color: colors.muted }]}>{room.topic}</Text>
            </View>
            {room.hasAIModerator && (
              <View style={styles.aiBadge}>
                <Text style={styles.aiBadgeText}>🤖 AI</Text>
              </View>
            )}
          </View>
          <View style={styles.roomMeta}>
            <View style={[styles.levelBadge, { backgroundColor: getLevelColor(room.level) + "20" }]}>
              <Text style={[styles.levelText, { color: getLevelColor(room.level) }]}>{room.level}</Text>
            </View>
            <View style={styles.participantInfo}>
              <Ionicons name="people" size={14} color={colors.muted} />
              <Text style={[styles.participantText, { color: colors.muted }]}>
                {room.participantCount}/{room.maxParticipants}
              </Text>
            </View>
            <Text style={[styles.startedAt, { color: colors.muted }]}>{room.startedAt}</Text>
          </View>
          <View style={styles.tagRow}>
            {room.tags.map((tag) => (
              <View key={tag} style={[styles.tag, { backgroundColor: colors.background }]}>
                <Text style={[styles.tagText, { color: colors.muted }]}>#{tag}</Text>
              </View>
            ))}
          </View>
        </TouchableOpacity>
      ))}

      {/* Upcoming Rooms */}
      <View style={[styles.sectionHeader, { marginTop: 24 }]}>
        <Ionicons name="time-outline" size={16} color={colors.muted} />
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Upcoming</Text>
      </View>

      {UPCOMING_ROOMS.map((room) => (
        <View key={room.id} style={[styles.upcomingCard, { backgroundColor: colors.surface }]}>
          <View style={styles.roomCardTop}>
            <Text style={styles.roomFlag}>{room.flag}</Text>
            <View style={styles.roomInfo}>
              <Text style={[styles.roomTitle, { color: colors.foreground }]}>{room.title}</Text>
              <Text style={[styles.roomTopic, { color: colors.muted }]}>{room.topic}</Text>
            </View>
            <View style={[styles.scheduleBadge, { backgroundColor: colors.primary + "20" }]}>
              <Text style={[styles.scheduleText, { color: colors.primary }]}>{room.scheduledFor}</Text>
            </View>
          </View>
          <Text style={[styles.roomDesc, { color: colors.muted }]}>{room.description}</Text>
          <TouchableOpacity style={[styles.remindBtn, { borderColor: colors.primary }]}>
            <Ionicons name="notifications-outline" size={14} color={colors.primary} />
            <Text style={[styles.remindText, { color: colors.primary }]}>Remind Me</Text>
          </TouchableOpacity>
        </View>
      ))}
    </ScrollView>
  );

  // ─── ROOM VIEW ──────────────────────────────────────────────────────────────

  const renderRoom = () => {
    if (!activeRoom) return null;
    return (
      <View style={styles.roomView}>
        {/* Room Header */}
        <View style={[styles.roomHeader, { backgroundColor: colors.surface }]}>
          <View style={styles.roomHeaderLeft}>
            <Text style={styles.roomHeaderFlag}>{activeRoom.flag}</Text>
            <View>
              <Text style={[styles.roomHeaderTitle, { color: colors.foreground }]}>{activeRoom.title}</Text>
              <Text style={[styles.roomHeaderTopic, { color: colors.muted }]}>{activeRoom.topic}</Text>
            </View>
          </View>
          <View style={styles.liveIndicator}>
            <Animated.View style={[styles.liveDotSmall, { transform: [{ scale: pulseAnim }] }]} />
            <Text style={styles.liveText}>LIVE</Text>
          </View>
        </View>

        {/* Participants Grid */}
        <ScrollView style={styles.participantsScroll} contentContainerStyle={styles.participantsGrid}>
          {participants.map((p) => (
            <View key={p.id} style={[styles.participantCard, p.isSpeaking && styles.participantSpeaking]}>
              <View style={styles.participantAvatarContainer}>
                <Text style={styles.participantAvatar}>{p.avatar}</Text>
                {p.isSpeaking && (
                  <Animated.View style={[styles.speakingRing, { transform: [{ scale: pulseAnim }] }]} />
                )}
                {p.isMuted && (
                  <View style={styles.mutedIcon}>
                    <Ionicons name="mic-off" size={10} color="#FFF" />
                  </View>
                )}
                {p.handRaised && (
                  <View style={styles.handIcon}>
                    <Text style={{ fontSize: 12 }}>✋</Text>
                  </View>
                )}
              </View>
              <Text style={[styles.participantName, { color: colors.foreground }]} numberOfLines={1}>
                {p.name}
              </Text>
              <View style={styles.participantBadges}>
                {p.isHost && <Text style={styles.hostBadge}>👑</Text>}
                {p.isAI && <Text style={styles.aiBadgeSmall}>🤖</Text>}
                <Text style={[styles.levelBadgeSmall, { color: colors.muted }]}>{p.level}</Text>
              </View>
            </View>
          ))}
        </ScrollView>

        {/* AI Feedback Banner — rotates dynamically */}
        {activeRoom.hasAIModerator && (
          <View style={[styles.aiFeedback, { backgroundColor: "#3B82F620" }]}>
            <Text style={styles.aiFeedbackIcon}>{AI_FEEDBACK_MESSAGES[aiFeedbackIdx].icon}</Text>
            <Text style={[styles.aiFeedbackText, { color: "#3B82F6" }]}>
              AI Moderator: {AI_FEEDBACK_MESSAGES[aiFeedbackIdx].text}
            </Text>
          </View>
        )}

        {/* AI Conversation Prompt — appears when silence detected */}
        {activeRoom.hasAIModerator && silenceSeconds >= 8 && (
          <View style={[styles.aiPromptBanner, { backgroundColor: "#8B5CF620" }]}>
            <Text style={styles.aiFeedbackIcon}>💬</Text>
            <View style={{ flex: 1 }}>
              <Text style={[styles.aiPromptLabel, { color: "#8B5CF6" }]}>AI Conversation Starter</Text>
              <Text style={[styles.aiFeedbackText, { color: "#8B5CF6" }]}>{aiPrompt}</Text>
            </View>
          </View>
        )}

        {/* Topic Suggestions Button */}
        {activeRoom.hasAIModerator && (
          <TouchableOpacity
            style={[styles.topicSuggestBtn, { backgroundColor: colors.surface }]}
            onPress={() => {
              if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setShowTopicSuggestions(!showTopicSuggestions);
            }}
          >
            <Ionicons name="bulb-outline" size={16} color="#F59E0B" />
            <Text style={[styles.topicSuggestText, { color: colors.foreground }]}>Topic Ideas</Text>
            <Ionicons name={showTopicSuggestions ? "chevron-up" : "chevron-down"} size={14} color={colors.muted} />
          </TouchableOpacity>
        )}
        {showTopicSuggestions && (
          <View style={[styles.topicList, { backgroundColor: colors.surface }]}>
            {AI_CONVERSATION_STARTERS.slice(0, 4).map((prompt, i) => (
              <TouchableOpacity
                key={i}
                style={styles.topicItem}
                onPress={() => {
                  setAiPrompt(prompt);
                  setSilenceSeconds(10);
                  setShowTopicSuggestions(false);
                }}
              >
                <Text style={[styles.topicItemText, { color: colors.foreground }]}>{prompt}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Controls */}
        <View style={[styles.controls, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
          <TouchableOpacity
            style={[styles.controlBtn, isMuted ? styles.controlBtnMuted : styles.controlBtnActive]}
            onPress={toggleMute}
          >
            <Ionicons name={isMuted ? "mic-off" : "mic"} size={22} color={isMuted ? "#EF4444" : "#FFF"} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.controlBtn, handRaised ? styles.controlBtnRaised : styles.controlBtnDefault]}
            onPress={toggleHand}
          >
            <Text style={{ fontSize: 20 }}>{handRaised ? "✋" : "🤚"}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.controlBtn, styles.controlBtnDefault]}>
            <Ionicons name="chatbubble-outline" size={20} color={colors.foreground} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.leaveBtn]}
            onPress={leaveRoom}
          >
            <Text style={styles.leaveText}>Leave</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <ScreenContainer edges={["top", "left", "right"]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => view === "room" ? leaveRoom() : router.back()} style={styles.backBtn}>
          <Ionicons name={view === "lobby" ? "arrow-back" : "chevron-back"} size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>
          {view === "room" && activeRoom ? activeRoom.title : "Voice Rooms"}
        </Text>
        <View style={{ width: 30 }} />
      </View>

      {view === "lobby" ? renderLobby() : renderRoom()}
    </ScreenContainer>
  );
}

// ─── STYLES ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 0.5 },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 17, fontWeight: "700" },
  scrollContent: { padding: 16, paddingBottom: 100 },
  heroSection: { marginBottom: 16 },
  heroTitle: { fontSize: 28, fontWeight: "800" },
  heroSubtitle: { fontSize: 14, marginTop: 4, lineHeight: 20 },
  createRoomBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, padding: 14, borderRadius: 12, marginBottom: 16 },
  createRoomText: { color: "#FFF", fontSize: 15, fontWeight: "700" },
  filterScroll: { marginBottom: 16 },
  filterChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, marginRight: 8, backgroundColor: "rgba(148,163,184,0.1)" },
  filterText: { fontSize: 13, fontWeight: "600" },
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#EF4444" },
  sectionTitle: { fontSize: 18, fontWeight: "700", flex: 1 },
  roomCount: { fontSize: 12 },
  roomCard: { borderRadius: 14, padding: 16, marginBottom: 12 },
  roomCardTop: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 10 },
  roomFlag: { fontSize: 28 },
  roomInfo: { flex: 1 },
  roomTitle: { fontSize: 15, fontWeight: "700" },
  roomTopic: { fontSize: 12, marginTop: 2 },
  aiBadge: { backgroundColor: "#3B82F620", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  aiBadgeText: { fontSize: 10, fontWeight: "700" },
  roomMeta: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 10 },
  levelBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  levelText: { fontSize: 10, fontWeight: "700", textTransform: "capitalize" },
  participantInfo: { flexDirection: "row", alignItems: "center", gap: 4 },
  participantText: { fontSize: 12 },
  startedAt: { fontSize: 11 },
  tagRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  tag: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  tagText: { fontSize: 10 },
  upcomingCard: { borderRadius: 14, padding: 16, marginBottom: 12 },
  roomDesc: { fontSize: 12, lineHeight: 17, marginTop: 8 },
  scheduleBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  scheduleText: { fontSize: 10, fontWeight: "700" },
  remindBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 12, paddingVertical: 8, borderRadius: 8, borderWidth: 1 },
  remindText: { fontSize: 12, fontWeight: "600" },
  // Room View
  roomView: { flex: 1 },
  roomHeader: { padding: 16 },
  roomHeaderLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  roomHeaderFlag: { fontSize: 28 },
  roomHeaderTitle: { fontSize: 16, fontWeight: "700" },
  roomHeaderTopic: { fontSize: 12, marginTop: 2 },
  liveIndicator: { flexDirection: "row", alignItems: "center", gap: 4, position: "absolute", right: 16, top: 16 },
  liveDotSmall: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#EF4444" },
  liveText: { fontSize: 10, fontWeight: "800", color: "#EF4444" },
  participantsScroll: { flex: 1 },
  participantsGrid: { flexDirection: "row", flexWrap: "wrap", padding: 16, gap: 12, justifyContent: "center" },
  participantCard: { width: 80, alignItems: "center", padding: 8, borderRadius: 12 },
  participantSpeaking: { backgroundColor: "rgba(59,130,246,0.1)" },
  participantAvatarContainer: { position: "relative", marginBottom: 6 },
  participantAvatar: { fontSize: 36 },
  speakingRing: { position: "absolute", top: -4, left: -4, right: -4, bottom: -4, borderRadius: 24, borderWidth: 2, borderColor: "#3B82F6" },
  mutedIcon: { position: "absolute", bottom: -2, right: -2, backgroundColor: "#EF4444", borderRadius: 8, padding: 2 },
  handIcon: { position: "absolute", top: -4, right: -4 },
  participantName: { fontSize: 11, fontWeight: "600", textAlign: "center" },
  participantBadges: { flexDirection: "row", alignItems: "center", gap: 2, marginTop: 2 },
  hostBadge: { fontSize: 10 },
  aiBadgeSmall: { fontSize: 10 },
  levelBadgeSmall: { fontSize: 9, fontWeight: "600" },
  aiFeedback: { marginHorizontal: 16, padding: 12, borderRadius: 10, flexDirection: "row", alignItems: "center", gap: 8 },
  aiFeedbackIcon: { fontSize: 16 },
  aiFeedbackText: { flex: 1, fontSize: 12, lineHeight: 16 },
  controls: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 16, padding: 16, borderTopWidth: 0.5 },
  controlBtn: { width: 48, height: 48, borderRadius: 24, justifyContent: "center", alignItems: "center" },
  controlBtnMuted: { backgroundColor: "#EF444420" },
  controlBtnActive: { backgroundColor: "#10B981" },
  controlBtnRaised: { backgroundColor: "#F59E0B20" },
  controlBtnDefault: { backgroundColor: "rgba(148,163,184,0.15)" },
  leaveBtn: { backgroundColor: "#EF4444", paddingHorizontal: 20, paddingVertical: 12, borderRadius: 20 },
  leaveText: { color: "#FFF", fontSize: 13, fontWeight: "700" },
  // AI Moderation styles
  aiPromptBanner: { marginHorizontal: 16, marginTop: 8, padding: 12, borderRadius: 10, flexDirection: "row", alignItems: "flex-start", gap: 8 },
  aiPromptLabel: { fontSize: 9, fontWeight: "800", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 2 },
  topicSuggestBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, marginHorizontal: 16, marginTop: 8, padding: 10, borderRadius: 8 },
  topicSuggestText: { fontSize: 12, fontWeight: "600" },
  topicList: { marginHorizontal: 16, marginTop: 4, borderRadius: 10, overflow: "hidden" },
  topicItem: { padding: 12, borderBottomWidth: 0.5, borderBottomColor: "rgba(148,163,184,0.2)" },
  topicItemText: { fontSize: 12, lineHeight: 17 },
});
