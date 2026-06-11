import { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Platform,
  TextInput,
  FlatList,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { ReportAIResponse } from "@/components/report-ai-response";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { trpc } from "@/lib/trpc";
import { parseAndLogCorrections, parseCorrections, type ParsedCorrection } from "@/lib/grammar-correction-parser";
import { GrammarCorrectionOverlay } from "@/components/grammar-correction-overlay";
import { usePaywallGate } from "@/hooks/use-paywall-gate";
import { PaywallModal } from "@/components/paywall-modal";
import { useHumeVoice, type EmotionScore } from "@/hooks/use-hume-voice";
import { onConversationTurn, onSessionStart, onSessionEnd } from "@/lib/adaptive-engine-hooks";
import { useChatWallpaper } from "@/hooks/use-chat-wallpaper";
import { ChatWallpaperBackground } from "@/components/chat-wallpaper-background";

// ─── Theme ──────────────────────────────────────────────────────────────────

const Colors = {
  primary: "#0D0F14",
  surface: "#161922",
  surfaceCard: "#1C1F2B",
  surfaceElevated: "#242838",
  border: "#2A2E3D",
  textPrimary: "#FFFFFF",
  textSecondary: "#9BA1A6",
  textMuted: "#687076",
  accent: "#7C3AED",
  secondary: "#00AAFF",
  success: "#22C55E",
  warning: "#F59E0B",
  error: "#EF4444",
  gold: "#FFB800",
};

// ─── Types ──────────────────────────────────────────────────────────────────

type Message = {
  id: string;
  role: "user" | "ai" | "system";
  text: string;
  translation?: string;
  timestamp: number;
  corrections?: ParsedCorrection[];
};

type Scenario = {
  id: string;
  title: string;
  description: string;
  difficulty: "beginner" | "intermediate" | "hard";
  language: string;
  icon: string;
  color: string;
  systemPrompt: string;
};

// ─── Scenarios ──────────────────────────────────────────────────────────────

const SCENARIOS: Scenario[] = [
  {
    id: "speed-response",
    title: "Speed Response Drill",
    description: "Quick-fire responses to common phrases. Think fast!",
    difficulty: "hard",
    language: "Spanish",
    icon: "flash",
    color: Colors.error,
    systemPrompt: "You are a fast-paced conversation partner. Ask rapid questions in Spanish and expect quick answers.",
  },
  {
    id: "cafe-order",
    title: "Café Ordering",
    description: "Practice ordering food and drinks at a café",
    difficulty: "beginner",
    language: "Spanish",
    icon: "cafe",
    color: Colors.gold,
    systemPrompt: "You are a friendly barista at a Dominican café. Speak in Spanish and help the customer order.",
  },
  {
    id: "job-interview",
    title: "Job Interview",
    description: "Practice professional conversation for interviews",
    difficulty: "intermediate",
    language: "Spanish",
    icon: "briefcase",
    color: Colors.secondary,
    systemPrompt: "You are an interviewer at a tech company. Conduct a bilingual interview mixing Spanish and English.",
  },
  {
    id: "street-directions",
    title: "Asking for Directions",
    description: "Navigate a city by asking locals for help",
    difficulty: "beginner",
    language: "Spanish",
    icon: "navigate",
    color: Colors.success,
    systemPrompt: "You are a local in Santo Domingo. Help the tourist find their way using Dominican Spanish.",
  },
  {
    id: "haggling",
    title: "Market Haggling",
    description: "Negotiate prices at a local market",
    difficulty: "intermediate",
    language: "Spanish",
    icon: "cart",
    color: "#F472B6",
    systemPrompt: "You are a vendor at a Dominican market. Negotiate prices in Spanish with the buyer.",
  },
  {
    id: "emergency",
    title: "Emergency Phrases",
    description: "Handle urgent situations in another language",
    difficulty: "hard",
    language: "Spanish",
    icon: "medkit",
    color: Colors.error,
    systemPrompt: "Simulate an emergency scenario where the user needs to communicate urgently in Spanish.",
  },
];

// ─── Component ──────────────────────────────────────────────────────────────

export default function ConversationSimScreen() {
  const { theme: chatWallpaper } = useChatWallpaper("conversation-sim");

  const { showPaywall, paywallFeature, singlePrice, checkAccess, dismissPaywall } = usePaywallGate();

  const router = useRouter();
  const params = useLocalSearchParams<{ scenario?: string; difficulty?: string }>();
  const scrollRef = useRef<ScrollView>(null);

  const [selectedScenario, setSelectedScenario] = useState<Scenario | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [score, setScore] = useState(0);
  const [responseCount, setResponseCount] = useState(0);
  const teacherChat = trpc.teacher.chat.useMutation();
  const translateText = trpc.translate.text.useMutation();

  // Emotion-adaptive pacing via Hume
  const [emotionData, setEmotionData] = useState<{ dominantEmotion?: string; frustration?: number; confidence?: number; joy?: number; concentration?: number }>({});
  const humeVoice = useHumeVoice({
    persona: 'language_tutor',
    onEmotions: (emotions: EmotionScore[]) => {
      if (emotions.length > 0) {
        const top = emotions[0];
        setEmotionData({
          dominantEmotion: top.name,
          frustration: emotions.find((e: EmotionScore) => e.name === 'Frustration')?.score,
          confidence: emotions.find((e: EmotionScore) => e.name === 'Confidence' || e.name === 'Determination')?.score,
          joy: emotions.find((e: EmotionScore) => e.name === 'Joy' || e.name === 'Amusement')?.score,
          concentration: emotions.find((e: EmotionScore) => e.name === 'Concentration')?.score,
        });
      }
    },
  });

  // Conversation memory across sessions
  const [learningMemory, setLearningMemory] = useState<{
    struggledTopics?: string[];
    masteredTopics?: string[];
    commonMistakes?: string[];
    sessionCount?: number;
    lastSessionSummary?: string;
  }>({});

  // Load conversation memory on mount
  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem('@linguavibe_convsim_memory');
        if (stored) setLearningMemory(JSON.parse(stored));
      } catch {}
    })();
  }, []);

  // Save conversation memory when session ends
  const saveConversationMemory = async (msgs: Message[]) => {
    try {
      const userMsgs = msgs.filter(m => m.role === 'user').map(m => m.text);
      const aiMsgs = msgs.filter(m => m.role === 'ai').map(m => m.text);
      const summary = `Practiced ${selectedScenario?.title || 'conversation'} with ${userMsgs.length} exchanges.`;
      const updated = {
        ...learningMemory,
        sessionCount: (learningMemory.sessionCount || 0) + 1,
        lastSessionSummary: summary,
      };
      await AsyncStorage.setItem('@linguavibe_convsim_memory', JSON.stringify(updated));
      setLearningMemory(updated);
    } catch {}
  };

  // Auto-select scenario from params
  useEffect(() => {
    if (params.scenario) {
      const found = SCENARIOS.find((s) => s.id === params.scenario);
      if (found) {
        startScenario(found);
      }
    }
  }, [params.scenario]);

  const startScenario = (scenario: Scenario) => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedScenario(scenario);
    setMessages([
      {
        id: "system-1",
        role: "system",
        text: `Scenario: ${scenario.title}\n${scenario.description}`,
        timestamp: Date.now(),
      },
      {
        id: "ai-1",
        role: "ai",
        text: getOpeningMessage(scenario),
        translation: getOpeningTranslation(scenario),
        timestamp: Date.now() + 100,
      },
    ]);
    setScore(0);
    setResponseCount(0);
  };

  const getOpeningMessage = (scenario: Scenario): string => {
    switch (scenario.id) {
      case "speed-response":
        return "¡Vamos! ¿Cómo te llamas? ¡Rápido!";
      case "cafe-order":
        return "¡Buenos días! Bienvenido al Café Dominicano. ¿Qué le puedo servir hoy?";
      case "job-interview":
        return "Buenos días, gracias por venir. Cuéntame un poco sobre ti y tu experiencia.";
      case "street-directions":
        return "¡Hola! ¿En qué te puedo ayudar? ¿Estás perdido?";
      case "haggling":
        return "¡Mira lo que tengo aquí! Las mejores frutas del mercado. ¿Qué te interesa?";
      case "emergency":
        return "¡Auxilio! ¿Qué pasó? ¿Necesitas ayuda?";
      default:
        return "¡Hola! ¿Estás listo para practicar?";
    }
  };

  const getOpeningTranslation = (scenario: Scenario): string => {
    switch (scenario.id) {
      case "speed-response":
        return "Let's go! What's your name? Quick!";
      case "cafe-order":
        return "Good morning! Welcome to Café Dominicano. What can I serve you today?";
      case "job-interview":
        return "Good morning, thanks for coming. Tell me a bit about yourself and your experience.";
      case "street-directions":
        return "Hi! How can I help you? Are you lost?";
      case "haggling":
        return "Look what I have here! The best fruits in the market. What interests you?";
      case "emergency":
        return "Help! What happened? Do you need help?";
      default:
        return "Hi! Are you ready to practice?";
    }
  };

    const sendMessage = () => {
    if (!checkAccess("credits", "ai_chat")) return;
    if (!inputText.trim()) return;
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // Start adaptive session on first message
    if (responseCount === 0) onSessionStart("conversation").catch(() => {});

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      text: inputText.trim(),
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInputText("");
    setResponseCount((prev) => prev + 1);
    setScore((prev) => prev + 10);

    // Get real AI response from server
    setIsTyping(true);
    (async () => {
      try {
        const result = await teacherChat.mutateAsync({
          message: inputText.trim(),
          language: selectedScenario!.language || 'Spanish',
          teacherPersona: selectedScenario!.systemPrompt,
          conversationHistory: messages.slice(-8).map(m => ({ role: m.role === 'user' ? 'user' as const : 'assistant' as const, content: m.text })),
          userLevel: selectedScenario!.difficulty === 'beginner' ? 'beginner' : selectedScenario!.difficulty === 'hard' ? 'advanced' : 'intermediate',
          emotionContext: emotionData.dominantEmotion ? emotionData : undefined,
          learningMemory: learningMemory.sessionCount ? learningMemory : undefined,
        });
        const responseText = result?.reply || generateAIResponse(inputText.trim(), selectedScenario!).text;
        let translation = '';
        try {
          const transResult = await translateText.mutateAsync({ text: responseText, fromLanguage: 'Spanish', toLanguage: 'English' });
          translation = transResult?.translation || '';
        } catch { translation = ''; }
        // Parse grammar corrections from AI response and show inline
        const corrections = parseCorrections(responseText, inputText.trim());
        parseAndLogCorrections(responseText, inputText.trim(), selectedScenario?.language || 'Spanish').catch(() => {});
        // Feed into adaptive engine for error pattern detection and pacing
        onConversationTurn({
          userMessage: inputText.trim(),
          aiResponse: responseText,
          grammarErrors: corrections.map(c => c.original),
          durationMs: 3000,
        }).catch(() => {});
        const aiMsg: Message = { id: `ai-${Date.now()}`, role: "ai", text: responseText, translation, timestamp: Date.now(), corrections: corrections.length > 0 ? corrections : undefined };
        setMessages((prev) => [...prev, aiMsg]);
      } catch {
        const fallback = generateAIResponse(inputText.trim(), selectedScenario!);
        const aiMsg: Message = { id: `ai-${Date.now()}`, role: "ai", text: fallback.text, translation: fallback.translation, timestamp: Date.now() };
        setMessages((prev) => [...prev, aiMsg]);
      }
      setIsTyping(false);
      scrollRef.current?.scrollToEnd({ animated: true });
    })();

    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  };

  const generateAIResponse = (
    userText: string,
    scenario: Scenario
  ): { text: string; translation: string } => {
    // Simulated responses based on scenario
    const responses: Record<string, { text: string; translation: string }[]> = {
      "speed-response": [
        { text: "¡Bien! ¿De dónde eres? ¡Dime rápido!", translation: "Good! Where are you from? Tell me quick!" },
        { text: "¡Excelente! ¿Cuántos años tienes?", translation: "Excellent! How old are you?" },
        { text: "¡Perfecto! ¿Qué haces para vivir?", translation: "Perfect! What do you do for a living?" },
      ],
      "cafe-order": [
        { text: "¡Buena elección! ¿Lo quiere caliente o frío?", translation: "Good choice! Do you want it hot or cold?" },
        { text: "¿Algo más? Tenemos unos pastelitos fresquecitos.", translation: "Anything else? We have some fresh pastries." },
        { text: "Son 150 pesos. ¿Paga en efectivo o con tarjeta?", translation: "That's 150 pesos. Cash or card?" },
      ],
      "job-interview": [
        { text: "Interesante. ¿Cuáles son tus fortalezas principales?", translation: "Interesting. What are your main strengths?" },
        { text: "¿Por qué te interesa esta posición?", translation: "Why are you interested in this position?" },
        { text: "¿Dónde te ves en cinco años?", translation: "Where do you see yourself in five years?" },
      ],
      "street-directions": [
        { text: "Ah sí, queda por allá. Camina dos cuadras y dobla a la izquierda.", translation: "Oh yes, it's over there. Walk two blocks and turn left." },
        { text: "¿Vas caminando o en carro? Porque queda un poco lejos.", translation: "Are you walking or driving? Because it's a bit far." },
        { text: "Mira, agarra un motoconcho que te lleva más rápido.", translation: "Look, grab a motoconcho (motorcycle taxi) — it'll get you there faster." },
      ],
      "haggling": [
        { text: "Eso vale 200 pesos, pero pa' ti te lo dejo en 180.", translation: "That's 200 pesos, but for you I'll leave it at 180." },
        { text: "¡Ay no! Eso está muy barato ya. No puedo bajar más.", translation: "Oh no! That's already very cheap. I can't go lower." },
        { text: "Bueno, llévate dos por 300 y te regalo una yuca.", translation: "OK, take two for 300 and I'll throw in a yuca for free." },
      ],
      "emergency": [
        { text: "¡Cálmate! ¿Dónde te duele? ¿Puedes caminar?", translation: "Calm down! Where does it hurt? Can you walk?" },
        { text: "Voy a llamar una ambulancia. ¿Cuál es tu dirección?", translation: "I'm going to call an ambulance. What's your address?" },
        { text: "¿Tienes alguna alergia o condición médica?", translation: "Do you have any allergies or medical conditions?" },
      ],
    };

    const scenarioResponses = responses[scenario.id] || responses["cafe-order"];
    const idx = responseCount % scenarioResponses.length;
    return scenarioResponses[idx];
  };

  const endConversation = async () => {
    if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    // Save score
    const key = `@convo_sim_${selectedScenario?.id}_score`;
    const prev = await AsyncStorage.getItem(key);
    const best = Math.max(score, parseInt(prev || "0"));
    await AsyncStorage.setItem(key, best.toString());
    // End adaptive session tracking
    const userMsgCount = messages.filter(m => m.role === 'user').length;
    onSessionEnd("conversation").catch(() => {});
    // Navigate to session summary so user sees their results
    router.push("/session-summary" as any);
    setSelectedScenario(null);
    setMessages([]);
  };

  // ─── Scenario Selection ───────────────────────────────────────────────────

  if (!selectedScenario) {
    return (
      <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => router.back()}
          >
            <Ionicons name="chevron-back" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Conversation Simulator</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scenarioList}>
          <Text style={styles.scenarioIntro}>
            Practice real-world conversations with AI. Choose a scenario below:
          </Text>

          {SCENARIOS.map((scenario) => (
            <TouchableOpacity
              key={scenario.id}
              style={styles.scenarioCard}
              activeOpacity={0.8}
              onPress={() => startScenario(scenario)}
            >
              <View style={[styles.scenarioIcon, { backgroundColor: scenario.color + "20", borderColor: scenario.color + "50" }]}>
                <Ionicons name={scenario.icon as any} size={24} color={scenario.color} />
              </View>
              <View style={styles.scenarioInfo}>
                <Text style={styles.scenarioTitle}>{scenario.title}</Text>
                <Text style={styles.scenarioDesc}>{scenario.description}</Text>
                <View style={styles.scenarioMeta}>
                  <View style={[styles.difficultyBadge, { backgroundColor: getDifficultyColor(scenario.difficulty) + "20" }]}>
                    <Text style={[styles.difficultyText, { color: getDifficultyColor(scenario.difficulty) }]}>
                      {scenario.difficulty}
                    </Text>
                  </View>
                  <Text style={styles.scenarioLang}>{scenario.language}</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color={Colors.textMuted} />
            </TouchableOpacity>
          ))}
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ─── Active Conversation ──────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <ChatWallpaperBackground theme={chatWallpaper} fallbackColor="#0A1628">
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={endConversation}>
          <Ionicons name="close" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>{selectedScenario.title}</Text>
          <Text style={styles.headerSub}>Score: {score} pts</Text>
        </View>
        <TouchableOpacity style={styles.endBtn} onPress={endConversation}>
          <Text style={styles.endBtnText}>End</Text>
        </TouchableOpacity>
      </View>

      {/* Messages */}
      <ScrollView
        ref={scrollRef}
        style={styles.chatArea}
        contentContainerStyle={styles.chatContent}
      >
        {messages.map((msg) => (
          <View
            key={msg.id}
            style={[
              styles.messageBubble,
              msg.role === "user" && styles.userBubble,
              msg.role === "ai" && styles.aiBubble,
              msg.role === "system" && styles.systemBubble,
            ]}
          >
            <Text
              style={[
                styles.messageText,
                msg.role === "user" && styles.userText,
                msg.role === "system" && styles.systemText,
              ]}
            >
              {msg.text}
            </Text>
            {msg.translation && (
              <Text style={styles.translationText}>{msg.translation}</Text>
            )}
            {msg.corrections && msg.corrections.length > 0 && (
              <GrammarCorrectionOverlay corrections={msg.corrections} compact={true} />
            )}
            {msg.role === "ai" && <ReportAIResponse messageContent={msg.text} size="small" />}
          </View>
        ))}
        {isTyping && (
          <View style={[styles.messageBubble, styles.aiBubble]}>
            <Text style={styles.typingText}>typing...</Text>
          </View>
        )}
      </ScrollView>

      {/* Input */}
      <View style={styles.inputArea}>
        <TextInput
          style={styles.input}
          value={inputText}
          onChangeText={setInputText}
          placeholder="Type your response..."
          placeholderTextColor={Colors.textMuted}
          returnKeyType="send"
          onSubmitEditing={sendMessage}
        />
        <TouchableOpacity
          style={[styles.sendBtn, !inputText.trim() && styles.sendBtnDisabled]}
          onPress={sendMessage}
          disabled={!inputText.trim()}
        >
          <Ionicons name="send" size={20} color={inputText.trim() ? "#FFFFFF" : Colors.textMuted} />
        </TouchableOpacity>
      </View>
    
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

// ─── Helpers ────────────────────────────────────────────────────────────────

function getDifficultyColor(difficulty: string): string {
  switch (difficulty) {
    case "beginner":
      return Colors.success;
    case "intermediate":
      return Colors.warning;
    case "hard":
      return Colors.error;
    default:
      return Colors.textSecondary;
  }
}

// ─── Styles ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.border,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  headerSub: {
    fontSize: 12,
    color: Colors.gold,
    marginTop: 2,
  },
  endBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: Colors.error + "20",
  },
  endBtnText: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.error,
  },

  // Scenario selection
  scenarioList: {
    padding: 20,
    gap: 12,
  },
  scenarioIntro: {
    fontSize: 15,
    color: Colors.textSecondary,
    marginBottom: 8,
    lineHeight: 22,
  },
  scenarioCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: Colors.surfaceCard,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 14,
  },
  scenarioIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  scenarioInfo: {
    flex: 1,
  },
  scenarioTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  scenarioDesc: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  scenarioMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 6,
  },
  difficultyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  difficultyText: {
    fontSize: 11,
    fontWeight: "600",
    textTransform: "capitalize",
  },
  scenarioLang: {
    fontSize: 11,
    color: Colors.textMuted,
  },

  // Chat
  chatArea: {
    flex: 1,
  },
  chatContent: {
    padding: 16,
    gap: 10,
  },
  messageBubble: {
    maxWidth: "80%",
    padding: 12,
    borderRadius: 16,
  },
  userBubble: {
    alignSelf: "flex-end",
    backgroundColor: Colors.secondary,
    borderBottomRightRadius: 4,
  },
  aiBubble: {
    alignSelf: "flex-start",
    backgroundColor: Colors.surfaceCard,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  systemBubble: {
    alignSelf: "center",
    backgroundColor: Colors.surface,
    borderRadius: 12,
    maxWidth: "90%",
  },
  messageText: {
    fontSize: 15,
    color: Colors.textPrimary,
    lineHeight: 21,
  },
  userText: {
    color: "#FFFFFF",
  },
  systemText: {
    fontSize: 13,
    color: Colors.textMuted,
    textAlign: "center",
  },
  translationText: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 6,
    fontStyle: "italic",
    borderTopWidth: 0.5,
    borderTopColor: Colors.border,
    paddingTop: 6,
  },
  typingText: {
    fontSize: 14,
    color: Colors.textMuted,
    fontStyle: "italic",
  },

  // Input
  inputArea: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    paddingBottom: 24,
    borderTopWidth: 0.5,
    borderTopColor: Colors.border,
    backgroundColor: Colors.surface,
    gap: 10,
  },
  input: {
    flex: 1,
    backgroundColor: Colors.surfaceCard,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: Colors.textPrimary,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sendBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: Colors.secondary,
    alignItems: "center",
    justifyContent: "center",
  },
  sendBtnDisabled: {
    backgroundColor: Colors.surfaceCard,
  },
});
