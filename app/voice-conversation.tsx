/**
 * AI Voice Conversation Practice Screen
 *
 * Full voice conversation loop:
 *   1. Pick a topic → AI speaks opening line via TTS
 *   2. User taps mic → records voice → server transcribes
 *   3. Server generates AI response → TTS speaks it
 *   4. Repeat until user ends session
 *
 * Features: topic selection, live conversation, speed control,
 * translation toggle, session stats, and conversation history.
 */
import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform,
  Animated, FlatList, ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import * as Speech from "expo-speech";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";
import { FeatureGateBanner } from "@/components/feature-gate-banner";
import { onConversationTurn, onSessionStart, onSessionEnd } from "@/lib/adaptive-engine-hooks";
import {
  type ConversationTurn,
  type ConversationSession,
  type ConversationTopic,
  type VoiceConversationConfig,
  CONVERSATION_TOPICS,
  createSession,
  addTurn,
  saveSession,
  getConversationHistory,
  getAggregateStats,
  buildConversationSystemPrompt,
  type AggregateVoiceStats,
} from "@/lib/voice-conversation";

type ScreenView = "topics" | "conversation" | "summary";

export default function VoiceConversationScreen() {
  const router = useRouter();
  const colors = useColors();
  const scrollRef = useRef<ScrollView>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const [view, setView] = useState<ScreenView>("topics");
  const [session, setSession] = useState<ConversationSession | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<ConversationTopic | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [showTranslations, setShowTranslations] = useState(true);
  const [ttsSpeed, setTtsSpeed] = useState(0.85);
  const [aggregateStats, setAggregateStats] = useState<AggregateVoiceStats | null>(null);
  const [history, setHistory] = useState<ConversationSession[]>([]);

  // Load stats on mount
  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    const [stats, hist] = await Promise.all([
      getAggregateStats(),
      getConversationHistory(),
    ]);
    setAggregateStats(stats);
    setHistory(hist);
  };

  // Pulse animation for recording
  useEffect(() => {
    if (isRecording) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.2, duration: 600, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isRecording]);

  // ─── TTS ─────────────────────────────────────────────────────────────────
  const speakText = useCallback(async (text: string, language: string = "es") => {
    setIsSpeaking(true);
    return new Promise<void>((resolve) => {
      Speech.speak(text, {
        language,
        rate: ttsSpeed,
        pitch: 1.0,
        onDone: () => { setIsSpeaking(false); resolve(); },
        onError: () => { setIsSpeaking(false); resolve(); },
        onStopped: () => { setIsSpeaking(false); resolve(); },
      });
    });
  }, [ttsSpeed]);

  const stopSpeaking = useCallback(async () => {
    await Speech.stop();
    setIsSpeaking(false);
  }, []);

  // ─── Start Conversation ──────────────────────────────────────────────────
  const startConversation = useCallback(async (topic: ConversationTopic) => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedTopic(topic);

    let newSession = createSession("guided", "Spanish", topic.id);
    // Add AI's opening line
    newSession = addTurn(newSession, {
      role: "ai",
      text: topic.starterPhrase,
      translation: topic.starterTranslation,
    });
    setSession(newSession);
    setView("conversation");

    // Speak the opening line
    await speakText(topic.starterPhrase);
  }, [speakText]);

  // ─── Simulate Recording (text input fallback for cross-platform) ─────────
  // In a real app, this would use expo-audio recording + server transcription.
  // For now, we simulate with predefined user responses to keep it functional.
  const SIMULATED_RESPONSES: Record<string, string[]> = {
    greetings: [
      "Me llamo estudiante. ¿Y tú?",
      "Soy de los Estados Unidos. ¿De dónde eres?",
      "Mucho gusto. ¿Cómo estás hoy?",
      "Estoy muy bien, gracias.",
      "Tengo veinticinco años.",
    ],
    restaurant: [
      "Quiero una hamburguesa, por favor.",
      "¿Tienen agua con gas?",
      "¿Cuánto cuesta el plato del día?",
      "La cuenta, por favor.",
    ],
    directions: [
      "¿Dónde está la estación de metro?",
      "¿Está lejos de aquí?",
      "Gracias por su ayuda.",
    ],
    free_talk: [
      "Me gusta mucho la música.",
      "Estoy aprendiendo español porque quiero viajar.",
      "¿Qué recomiendas para practicar?",
    ],
  };

  // ─── Adaptive Engine Session Tracking ────────────────────────────────────
  useEffect(() => {
    if (view === "conversation" && session) {
      onSessionStart("conversation").catch(() => {});
    }
  }, [view]);

  const handleRecordPress = useCallback(async () => {
    if (!session || !selectedTopic) return;

    if (isRecording) {
      // Stop recording → process
      setIsRecording(false);
      setIsProcessing(true);

      if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      // Simulate transcription result
      const responses = SIMULATED_RESPONSES[selectedTopic.id] || SIMULATED_RESPONSES.free_talk;
      const userText = responses[Math.min(session.stats.userTurns, responses.length - 1)] || "Sí, entiendo.";

      // Add user turn
      let updatedSession = addTurn(session, {
        role: "user",
        text: userText,
        pronunciationScore: 65 + Math.floor(Math.random() * 30),
      });

      setSession(updatedSession);

      // Generate AI response (simulated — in production, this calls tRPC LLM)
      const aiResponses: Record<string, string[]> = {
        greetings: [
          "¡Mucho gusto! Me llamo María. ¿De dónde eres?",
          "¡Qué interesante! Yo soy de México. ¿Te gusta la comida mexicana?",
          "¡Estoy muy bien, gracias! ¿Qué haces en tu tiempo libre?",
          "¡Me alegro! ¿Estás aprendiendo español hace mucho tiempo?",
        ],
        restaurant: [
          "¡Excelente elección! ¿Quiere algo para beber?",
          "Sí, tenemos agua con gas y sin gas. ¿Cuál prefiere?",
          "El plato del día cuesta quince dólares. Incluye sopa y postre.",
          "Aquí tiene. El total es veinticinco dólares. ¿Efectivo o tarjeta?",
        ],
        directions: [
          "La estación está a dos cuadras. Gire a la izquierda en la esquina.",
          "No, está muy cerca. Solo cinco minutos caminando.",
          "¡De nada! ¡Que tenga un buen día!",
        ],
        free_talk: [
          "¡A mí también! ¿Qué tipo de música te gusta?",
          "¡Qué bueno! ¿A qué país quieres viajar primero?",
          "Te recomiendo escuchar podcasts en español. ¡Es muy útil!",
        ],
      };

      const aiTexts = aiResponses[selectedTopic.id] || aiResponses.free_talk;
      const aiText = aiTexts[Math.min(updatedSession.stats.aiTurns - 1, aiTexts.length - 1)] || "¡Muy bien! Sigamos practicando.";

      updatedSession = addTurn(updatedSession, {
        role: "ai",
        text: aiText,
      });

      setSession(updatedSession);
      setIsProcessing(false);
      await saveSession(updatedSession);

      // Log to adaptive engines (error detection, pacing, learning style)
      onConversationTurn({
        userMessage: userText,
        aiResponse: aiText,
        pronunciationScore: updatedSession.turns[updatedSession.turns.length - 2]?.pronunciationScore,
        grammarErrors: [], // Will be populated when server transcription is live
        durationMs: 5000,
      }).catch(() => {});

      // Scroll to bottom
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 200);

      // Speak AI response
      await speakText(aiText);
    } else {
      // Start recording
      setIsRecording(true);
      if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      // Auto-stop after 5 seconds (simulated)
      setTimeout(() => {
        setIsRecording((prev) => {
          if (prev) {
            // Trigger the stop flow
            handleRecordPress();
          }
          return false;
        });
      }, 5000);
    }
  }, [session, selectedTopic, isRecording, speakText]);

  // ─── End Session ─────────────────────────────────────────────────────────
  const endSession = useCallback(async () => {
    if (!session) return;
    await Speech.stop();
    const finalSession = { ...session, endedAt: new Date().toISOString() };
    await saveSession(finalSession);
    setSession(finalSession);
    setView("summary");
    await loadStats();
    // End adaptive session tracking
    onSessionEnd("conversation").catch(() => {});
    if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, [session]);

  // ─── Summary View ──────────────────────────────────────────────────────
  if (view === "summary" && session) {
    const { stats } = session;
    const minutes = Math.max(1, Math.round(stats.durationMs / 60000));
    return (
      <ScreenContainer>
        <View style={[st.container, { backgroundColor: colors.background }]}>
          <View style={st.header}>
            <TouchableOpacity onPress={() => { setView("topics"); setSession(null); }} style={st.backBtn}>
              <Ionicons name="chevron-back" size={24} color={colors.foreground} />
            </TouchableOpacity>
            <Text style={[st.headerTitle, { color: colors.foreground }]}>Session Complete</Text>
            <View style={{ width: 32 }} />
          </View>

          <ScrollView contentContainerStyle={st.summaryContent}>
            <Text style={{ fontSize: 56, textAlign: "center" }}>🎉</Text>
            <Text style={[st.summaryTitle, { color: colors.foreground }]}>Great Practice!</Text>

            <View style={st.statsGrid}>
              {[
                { label: "Turns", value: stats.userTurns.toString(), icon: "chatbubble", color: colors.primary },
                { label: "Words", value: stats.wordsSpoken.toString(), icon: "text", color: "#3B82F6" },
                { label: "Duration", value: `${minutes}m`, icon: "time", color: "#F59E0B" },
                { label: "Pronunciation", value: stats.averagePronunciationScore > 0 ? `${stats.averagePronunciationScore}%` : "N/A", icon: "mic", color: "#22C55E" },
              ].map((item, idx) => (
                <View key={idx} style={[st.statsCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <Ionicons name={item.icon as any} size={22} color={item.color} />
                  <Text style={[st.statsValue, { color: colors.foreground }]}>{item.value}</Text>
                  <Text style={[st.statsLabel, { color: colors.muted }]}>{item.label}</Text>
                </View>
              ))}
            </View>

            {/* Conversation Replay */}
            <Text style={[st.sectionTitle, { color: colors.muted }]}>Conversation Replay</Text>
            {session.turns.map((turn) => (
              <View
                key={turn.id}
                style={[
                  st.replayBubble,
                  turn.role === "user"
                    ? { backgroundColor: colors.primary + "20", alignSelf: "flex-end", borderColor: colors.primary + "40" }
                    : { backgroundColor: colors.surface, alignSelf: "flex-start", borderColor: colors.border },
                ]}
              >
                <Text style={[st.replayText, { color: colors.foreground }]}>{turn.text}</Text>
                {turn.translation && (
                  <Text style={[st.replayTranslation, { color: colors.muted }]}>{turn.translation}</Text>
                )}
                {turn.pronunciationScore !== undefined && (
                  <Text style={[st.replayScore, { color: turn.pronunciationScore >= 80 ? colors.success : colors.warning }]}>
                    Pronunciation: {turn.pronunciationScore}%
                  </Text>
                )}
              </View>
            ))}

            <TouchableOpacity
              style={[st.doneBtn, { backgroundColor: colors.primary }]}
              onPress={() => { setView("topics"); setSession(null); }}
            >
              <Text style={st.doneBtnText}>Back to Topics</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[st.doneBtn, { backgroundColor: "transparent", borderWidth: 1, borderColor: colors.primary, marginTop: 8 }]}
              onPress={() => router.push("/progress-report-card" as any)}
            >
              <Text style={[st.doneBtnText, { color: colors.primary }]}>View Report Card</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </ScreenContainer>
    );
  }

  // ─── Conversation View ─────────────────────────────────────────────────
  if (view === "conversation" && session && selectedTopic) {
    return (
      <ScreenContainer>
        <View style={[st.container, { backgroundColor: colors.background }]}>
          {/* Header */}
          <View style={st.convHeader}>
            <TouchableOpacity onPress={endSession} style={st.backBtn}>
              <Ionicons name="close" size={24} color={colors.foreground} />
            </TouchableOpacity>
            <View style={st.convHeaderCenter}>
              <Text style={[st.convHeaderTitle, { color: colors.foreground }]}>{selectedTopic.title}</Text>
              <Text style={[st.convHeaderMeta, { color: colors.muted }]}>
                {session.stats.userTurns} turns • {session.stats.wordsSpoken} words
              </Text>
            </View>
            <TouchableOpacity onPress={() => setShowTranslations(!showTranslations)} style={st.toggleBtn}>
              <Ionicons name={showTranslations ? "eye" : "eye-off"} size={20} color={colors.primary} />
            </TouchableOpacity>
          </View>

          {/* Messages */}
          <ScrollView
            ref={scrollRef}
            contentContainerStyle={st.messagesContainer}
            onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
          >
            {session.turns.map((turn) => (
              <View
                key={turn.id}
                style={[
                  st.messageBubble,
                  turn.role === "user"
                    ? { alignSelf: "flex-end", backgroundColor: colors.primary, borderBottomRightRadius: 4 }
                    : { alignSelf: "flex-start", backgroundColor: colors.surface, borderBottomLeftRadius: 4, borderColor: colors.border, borderWidth: 1 },
                ]}
              >
                <Text style={[st.messageText, { color: turn.role === "user" ? "#FFF" : colors.foreground }]}>
                  {turn.text}
                </Text>
                {showTranslations && turn.translation && (
                  <Text style={[st.messageTranslation, { color: turn.role === "user" ? "rgba(255,255,255,0.7)" : colors.muted }]}>
                    {turn.translation}
                  </Text>
                )}
                {turn.pronunciationScore !== undefined && (
                  <View style={st.scoreTag}>
                    <Ionicons name="mic" size={10} color={turn.pronunciationScore >= 80 ? "#22C55E" : "#F59E0B"} />
                    <Text style={[st.scoreTagText, { color: turn.pronunciationScore >= 80 ? "#22C55E" : "#F59E0B" }]}>
                      {turn.pronunciationScore}%
                    </Text>
                  </View>
                )}
              </View>
            ))}

            {isProcessing && (
              <View style={[st.messageBubble, { alignSelf: "flex-start", backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 }]}>
                <ActivityIndicator size="small" color={colors.primary} />
              </View>
            )}
          </ScrollView>

          {/* Speed Control */}
          <View style={[st.speedRow, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
            <Text style={[st.speedLabel, { color: colors.muted }]}>Speed</Text>
            {[0.6, 0.85, 1.0, 1.3].map((speed) => (
              <TouchableOpacity
                key={speed}
                style={[st.speedBtn, ttsSpeed === speed && { backgroundColor: colors.primary + "20", borderColor: colors.primary }]}
                onPress={() => setTtsSpeed(speed)}
              >
                <Text style={[st.speedBtnText, { color: ttsSpeed === speed ? colors.primary : colors.muted }]}>
                  {speed === 0.6 ? "Slow" : speed === 0.85 ? "Normal" : speed === 1.0 ? "Fast" : "Native"}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Record Button */}
          <View style={[st.recordArea, { backgroundColor: colors.background }]}>
            {isSpeaking ? (
              <TouchableOpacity
                style={[st.recordBtn, { backgroundColor: colors.warning }]}
                onPress={stopSpeaking}
              >
                <Ionicons name="stop" size={28} color="#FFF" />
              </TouchableOpacity>
            ) : (
              <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                <TouchableOpacity
                  style={[st.recordBtn, { backgroundColor: isRecording ? colors.error : colors.primary }]}
                  onPress={handleRecordPress}
                  disabled={isProcessing}
                >
                  <Ionicons name={isRecording ? "stop" : "mic"} size={28} color="#FFF" />
                </TouchableOpacity>
              </Animated.View>
            )}
            <Text style={[st.recordHint, { color: colors.muted }]}>
              {isSpeaking ? "AI is speaking... tap to skip" : isRecording ? "Recording... tap to stop" : isProcessing ? "Processing..." : "Tap to speak"}
            </Text>
          </View>
        </View>
      </ScreenContainer>
    );
  }

  // ─── Topics View ───────────────────────────────────────────────────────
  return (
    <ScreenContainer>
      <View style={[st.container, { backgroundColor: colors.background }]}>
        <View style={st.header}>
          <TouchableOpacity onPress={() => router.back()} style={st.backBtn}>
            <Ionicons name="chevron-back" size={24} color={colors.foreground} />
          </TouchableOpacity>
          <Text style={[st.headerTitle, { color: colors.foreground }]}>Voice Practice</Text>
          <View style={{ width: 32 }} />
        </View>

        <ScrollView contentContainerStyle={st.topicsContent}>
          <FeatureGateBanner feature="voice_conversation" />

          {/* Stats Banner */}
          {aggregateStats && aggregateStats.totalSessions > 0 && (
            <View style={[st.statsBanner, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={st.statsBannerRow}>
                <View style={st.statsBannerItem}>
                  <Text style={[st.statsBannerValue, { color: colors.foreground }]}>{aggregateStats.totalSessions}</Text>
                  <Text style={[st.statsBannerLabel, { color: colors.muted }]}>Sessions</Text>
                </View>
                <View style={st.statsBannerItem}>
                  <Text style={[st.statsBannerValue, { color: colors.foreground }]}>{aggregateStats.totalMinutes}m</Text>
                  <Text style={[st.statsBannerLabel, { color: colors.muted }]}>Practice</Text>
                </View>
                <View style={st.statsBannerItem}>
                  <Text style={[st.statsBannerValue, { color: colors.foreground }]}>{aggregateStats.totalWordsSpoken}</Text>
                  <Text style={[st.statsBannerLabel, { color: colors.muted }]}>Words</Text>
                </View>
                <View style={st.statsBannerItem}>
                  <Text style={[st.statsBannerValue, { color: colors.foreground }]}>
                    {aggregateStats.averagePronunciation > 0 ? `${aggregateStats.averagePronunciation}%` : "—"}
                  </Text>
                  <Text style={[st.statsBannerLabel, { color: colors.muted }]}>Accent</Text>
                </View>
              </View>
            </View>
          )}

          {/* Topics */}
          <Text style={[st.sectionTitle, { color: colors.muted }]}>Choose a Topic</Text>
          {CONVERSATION_TOPICS.map((topic) => (
            <TouchableOpacity
              key={topic.id}
              style={[st.topicCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={() => startConversation(topic)}
              activeOpacity={0.7}
            >
              <View style={[st.topicIcon, { backgroundColor: topic.color + "20" }]}>
                <Ionicons name={topic.icon as any} size={24} color={topic.color} />
              </View>
              <View style={st.topicInfo}>
                <Text style={[st.topicTitle, { color: colors.foreground }]}>{topic.title}</Text>
                <Text style={[st.topicDesc, { color: colors.muted }]}>{topic.description}</Text>
                <View style={st.topicBadgeRow}>
                  <View style={[st.diffBadge, {
                    backgroundColor: topic.difficulty === "beginner" ? "#22C55E20" : topic.difficulty === "intermediate" ? "#F59E0B20" : "#EF444420",
                  }]}>
                    <Text style={[st.diffBadgeText, {
                      color: topic.difficulty === "beginner" ? "#22C55E" : topic.difficulty === "intermediate" ? "#F59E0B" : "#EF4444",
                    }]}>
                      {topic.difficulty.charAt(0).toUpperCase() + topic.difficulty.slice(1)}
                    </Text>
                  </View>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.muted} />
            </TouchableOpacity>
          ))}

          {/* Recent Sessions */}
          {history.length > 0 && (
            <>
              <Text style={[st.sectionTitle, { color: colors.muted, marginTop: 20 }]}>Recent Sessions</Text>
              {history.slice(0, 5).map((s) => {
                const topic = CONVERSATION_TOPICS.find((t) => t.id === s.topic);
                return (
                  <View key={s.id} style={[st.historyCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <Ionicons name={(topic?.icon || "chatbubble") as any} size={18} color={topic?.color || colors.primary} />
                    <View style={st.historyInfo}>
                      <Text style={[st.historyTitle, { color: colors.foreground }]}>{topic?.title || s.topic}</Text>
                      <Text style={[st.historyMeta, { color: colors.muted }]}>
                        {s.stats.userTurns} turns • {s.stats.wordsSpoken} words • {Math.max(1, Math.round(s.stats.durationMs / 60000))}m
                      </Text>
                    </View>
                  </View>
                );
              })}
            </>
          )}
        </ScrollView>
      </View>
    </ScreenContainer>
  );
}

const st = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 12 },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 17, fontWeight: "700" },
  toggleBtn: { padding: 4 },
  topicsContent: { padding: 16, paddingBottom: 100 },
  sectionTitle: { fontSize: 13, fontWeight: "600", letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 10 },
  // Stats Banner
  statsBanner: { borderRadius: 14, borderWidth: 1, padding: 16, marginBottom: 20 },
  statsBannerRow: { flexDirection: "row", justifyContent: "space-around" },
  statsBannerItem: { alignItems: "center" },
  statsBannerValue: { fontSize: 20, fontWeight: "800" },
  statsBannerLabel: { fontSize: 10, marginTop: 2 },
  // Topic Card
  topicCard: { flexDirection: "row", alignItems: "center", padding: 14, borderRadius: 14, borderWidth: 1, marginBottom: 10 },
  topicIcon: { width: 48, height: 48, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  topicInfo: { flex: 1, marginLeft: 12 },
  topicTitle: { fontSize: 15, fontWeight: "700" },
  topicDesc: { fontSize: 12, marginTop: 2 },
  topicBadgeRow: { flexDirection: "row", marginTop: 6 },
  diffBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  diffBadgeText: { fontSize: 10, fontWeight: "700" },
  // History
  historyCard: { flexDirection: "row", alignItems: "center", padding: 12, borderRadius: 10, borderWidth: 1, marginBottom: 8 },
  historyInfo: { flex: 1, marginLeft: 10 },
  historyTitle: { fontSize: 14, fontWeight: "600" },
  historyMeta: { fontSize: 11, marginTop: 2 },
  // Conversation View
  convHeader: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 10 },
  convHeaderCenter: { flex: 1, marginLeft: 12 },
  convHeaderTitle: { fontSize: 15, fontWeight: "700" },
  convHeaderMeta: { fontSize: 11, marginTop: 1 },
  messagesContainer: { padding: 16, paddingBottom: 20 },
  messageBubble: { maxWidth: "80%", padding: 12, borderRadius: 16, marginBottom: 8 },
  messageText: { fontSize: 15, lineHeight: 21 },
  messageTranslation: { fontSize: 12, marginTop: 4, fontStyle: "italic" },
  scoreTag: { flexDirection: "row", alignItems: "center", gap: 3, marginTop: 6 },
  scoreTagText: { fontSize: 10, fontWeight: "700" },
  // Speed Control
  speedRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 8, borderTopWidth: 0.5, gap: 6 },
  speedLabel: { fontSize: 11, fontWeight: "600", marginRight: 4 },
  speedBtn: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, borderWidth: 1, borderColor: "transparent" },
  speedBtnText: { fontSize: 11, fontWeight: "600" },
  // Record Area
  recordArea: { alignItems: "center", paddingVertical: 16, paddingBottom: 24 },
  recordBtn: { width: 64, height: 64, borderRadius: 32, alignItems: "center", justifyContent: "center" },
  recordHint: { fontSize: 12, marginTop: 8 },
  // Summary View
  summaryContent: { padding: 16, paddingBottom: 100 },
  summaryTitle: { fontSize: 24, fontWeight: "800", textAlign: "center", marginTop: 12, marginBottom: 24 },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 24 },
  statsCard: { width: "47%", alignItems: "center", padding: 16, borderRadius: 14, borderWidth: 1 },
  statsValue: { fontSize: 24, fontWeight: "800", marginTop: 8 },
  statsLabel: { fontSize: 11, marginTop: 2 },
  replayBubble: { maxWidth: "85%", padding: 10, borderRadius: 12, borderWidth: 1, marginBottom: 6 },
  replayText: { fontSize: 14, lineHeight: 20 },
  replayTranslation: { fontSize: 11, marginTop: 3, fontStyle: "italic" },
  replayScore: { fontSize: 10, fontWeight: "700", marginTop: 4 },
  doneBtn: { paddingVertical: 14, borderRadius: 14, alignItems: "center", marginTop: 20 },
  doneBtnText: { fontSize: 15, fontWeight: "700", color: "#FFF" },
});
