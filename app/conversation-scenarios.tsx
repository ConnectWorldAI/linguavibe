/**
 * Conversation Scenarios with AI Personas
 * Inspired by Praktika/Speak - realistic roleplay scenarios with AI characters
 * that have distinct personalities, accents, and cultural backgrounds.
 * Includes B2B technical scenarios for professional training.
 */
import React, { useState, useRef, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { parseAndLogCorrections } from "@/lib/grammar-correction-parser";
import { useHumeVoice, type EmotionScore } from "@/hooks/use-hume-voice";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Dimensions,
  TextInput,
  FlatList,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import * as Haptics from "expo-haptics";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// ─── TYPES ──────────────────────────────────────────────────────────────────

interface AIPersona {
  id: string;
  name: string;
  avatar: string;
  role: string;
  personality: string;
  accent: string;
  language: string;
  flag: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  bio: string;
}

interface Scenario {
  id: string;
  title: string;
  description: string;
  category: string;
  icon: string;
  language: string;
  flag: string;
  difficulty: "A1" | "A2" | "B1" | "B2" | "C1";
  duration: string;
  personas: string[];
  skills: string[];
  isB2B?: boolean;
}

interface ChatMessage {
  id: string;
  sender: "user" | "ai";
  text: string;
  translation?: string;
  timestamp: string;
  feedback?: { grammar: number; vocabulary: number; fluency: number };
}

// ─── DATA ───────────────────────────────────────────────────────────────────

const AI_PERSONAS: AIPersona[] = [
  { id: "p1", name: "Sofía", avatar: "👩‍🦱", role: "Barista in Mexico City", personality: "Friendly, uses lots of slang, speaks fast", accent: "Mexican Spanish", language: "Spanish", flag: "🇲🇽", difficulty: "Intermediate", bio: "Born and raised in CDMX. Loves coffee and chatting with customers about life." },
  { id: "p2", name: "Pierre", avatar: "👨‍🍳", role: "Chef in Paris", personality: "Passionate about food, slightly impatient, uses culinary terms", accent: "Parisian French", language: "French", flag: "🇫🇷", difficulty: "Advanced", bio: "Michelin-trained chef who gets annoyed when you mispronounce 'croissant'." },
  { id: "p3", name: "Yuki", avatar: "👩", role: "University Student in Tokyo", personality: "Polite, helpful, uses casual speech with friends", accent: "Standard Japanese", language: "Japanese", flag: "🇯🇵", difficulty: "Intermediate", bio: "Studies art history, loves anime, and will teach you the difference between formal and casual." },
  { id: "p4", name: "Marco", avatar: "👨", role: "Taxi Driver in Rome", personality: "Talkative, opinionated, loves football", accent: "Roman Italian", language: "Italian", flag: "🇮🇹", difficulty: "Beginner", bio: "Knows every shortcut in Rome and has an opinion about everything, especially calcio." },
  { id: "p5", name: "Min-ji", avatar: "👩‍💼", role: "K-Pop Manager in Seoul", personality: "Professional but fun, uses industry jargon", accent: "Seoul Korean", language: "Korean", flag: "🇰🇷", difficulty: "Advanced", bio: "Manages a rising K-pop group and speaks at lightning speed during meetings." },
  { id: "p6", name: "Ahmed", avatar: "🧔", role: "Tour Guide in Cairo", personality: "Knowledgeable, patient, loves history", accent: "Egyptian Arabic", language: "Arabic", flag: "🇪🇬", difficulty: "Beginner", bio: "Has been giving tours of the pyramids for 15 years. Speaks slowly and clearly for tourists." },
  { id: "p7", name: "Priya", avatar: "👩‍⚕️", role: "Doctor in Mumbai", personality: "Professional, empathetic, uses medical terms", accent: "Hindi (Mumbai)", language: "Hindi", flag: "🇮🇳", difficulty: "Advanced", bio: "Pediatrician who explains complex medical concepts in simple terms." },
  { id: "p8", name: "Carlos", avatar: "👨‍💻", role: "Tech Support in São Paulo", personality: "Patient, technical, switches between formal/informal", accent: "Brazilian Portuguese", language: "Portuguese", flag: "🇧🇷", difficulty: "Intermediate", bio: "Works at a startup and can explain any tech problem in Portuguese." },
];

const SCENARIOS: Scenario[] = [
  // Daily Life
  { id: "s1", title: "Ordering at a Restaurant", description: "Navigate a full dining experience from reservation to paying the bill.", category: "Daily Life", icon: "🍽️", language: "Spanish", flag: "🇲🇽", difficulty: "A2", duration: "5-10 min", personas: ["Sofía"], skills: ["Food vocabulary", "Polite requests", "Numbers"] },
  { id: "s2", title: "Getting Directions", description: "Ask for and understand directions to a landmark in the city.", category: "Daily Life", icon: "🗺️", language: "Italian", flag: "🇮🇹", difficulty: "A1", duration: "3-5 min", personas: ["Marco"], skills: ["Directions", "Landmarks", "Prepositions"] },
  { id: "s3", title: "Shopping at a Market", description: "Haggle prices, ask about products, and complete a purchase.", category: "Daily Life", icon: "🛒", language: "Arabic", flag: "🇪🇬", difficulty: "A2", duration: "5-8 min", personas: ["Ahmed"], skills: ["Numbers", "Bargaining", "Colors/sizes"] },
  // Travel
  { id: "s4", title: "Hotel Check-in", description: "Check into a hotel, ask about amenities, and handle a room issue.", category: "Travel", icon: "🏨", language: "French", flag: "🇫🇷", difficulty: "B1", duration: "5-8 min", personas: ["Pierre"], skills: ["Hotel vocabulary", "Complaints", "Dates"] },
  { id: "s5", title: "Airport Emergency", description: "Your flight is cancelled. Rebook, find accommodation, and manage stress.", category: "Travel", icon: "✈️", language: "Japanese", flag: "🇯🇵", difficulty: "B2", duration: "8-12 min", personas: ["Yuki"], skills: ["Travel vocabulary", "Formal requests", "Problem-solving"] },
  // Professional / B2B
  { id: "s6", title: "Job Interview", description: "Complete a job interview in your target language. Answer tough questions.", category: "Professional", icon: "💼", language: "Korean", flag: "🇰🇷", difficulty: "B2", duration: "10-15 min", personas: ["Min-ji"], skills: ["Formal speech", "Self-introduction", "Industry terms"], isB2B: true },
  { id: "s7", title: "Tech Support Call", description: "Explain a technical problem and follow troubleshooting steps.", category: "Professional", icon: "💻", language: "Portuguese", flag: "🇧🇷", difficulty: "B1", duration: "5-8 min", personas: ["Carlos"], skills: ["Tech vocabulary", "Instructions", "Problem description"], isB2B: true },
  { id: "s8", title: "Medical Appointment", description: "Describe symptoms, understand diagnosis, and follow treatment plan.", category: "Health", icon: "🏥", language: "Hindi", flag: "🇮🇳", difficulty: "B1", duration: "8-10 min", personas: ["Priya"], skills: ["Body parts", "Symptoms", "Medical terms"], isB2B: true },
  // Social
  { id: "s9", title: "Making Friends at a Party", description: "Introduce yourself, find common interests, and make plans to hang out.", category: "Social", icon: "🎉", language: "Spanish", flag: "🇲🇽", difficulty: "A2", duration: "5-8 min", personas: ["Sofía"], skills: ["Introductions", "Hobbies", "Making plans"] },
  { id: "s10", title: "First Date", description: "Navigate a first date conversation — interests, stories, and humor.", category: "Social", icon: "💕", language: "French", flag: "🇫🇷", difficulty: "B1", duration: "8-12 min", personas: ["Pierre"], skills: ["Personal questions", "Opinions", "Humor"] },
  // Emergency
  { id: "s11", title: "Calling Emergency Services", description: "Report an emergency, give your location, and describe what happened.", category: "Emergency", icon: "🚨", language: "Japanese", flag: "🇯🇵", difficulty: "B1", duration: "3-5 min", personas: ["Yuki"], skills: ["Emergency vocab", "Location", "Urgency"] },
];

const CATEGORIES = ["All", "Daily Life", "Travel", "Professional", "Social", "Health", "Emergency"];

// ─── COMPONENT ──────────────────────────────────────────────────────────────

export default function ConversationScenariosScreen() {
  const colors = useColors();
  const [view, setView] = useState<"browse" | "personas" | "chat">("browse");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedScenario, setSelectedScenario] = useState<Scenario | null>(null);
  const [selectedPersona, setSelectedPersona] = useState<AIPersona | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [showTranslations, setShowTranslations] = useState(true);
  const scrollRef = useRef<ScrollView>(null);
  const [isTyping, setIsTyping] = useState(false);
  const teacherChat = trpc.teacher.chat.useMutation();
  const translateMutation = trpc.translate.text.useMutation();

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

  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem('@linguavibe_scenarios_memory');
        if (stored) setLearningMemory(JSON.parse(stored));
      } catch {}
    })();
  }, []);

  const filteredScenarios = selectedCategory === "All"
    ? SCENARIOS
    : SCENARIOS.filter((s) => s.category === selectedCategory);

  const startScenario = (scenario: Scenario) => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedScenario(scenario);
    const persona = AI_PERSONAS.find((p) => p.name === scenario.personas[0]) || AI_PERSONAS[0];
    setSelectedPersona(persona);
    setMessages([
      {
        id: "m1",
        sender: "ai",
        text: getGreeting(persona, scenario),
        translation: getGreetingTranslation(persona, scenario),
        timestamp: "now",
      },
    ]);
    setView("chat");
  };

  const getGreeting = (persona: AIPersona, scenario: Scenario): string => {
    const greetings: Record<string, string> = {
      "Spanish": "¡Hola! Bienvenido. ¿En qué te puedo ayudar hoy?",
      "French": "Bonjour! Bienvenue. Comment puis-je vous aider aujourd'hui?",
      "Japanese": "いらっしゃいませ！何かお手伝いできますか？",
      "Italian": "Ciao! Benvenuto. Come posso aiutarti oggi?",
      "Korean": "안녕하세요! 어서오세요. 무엇을 도와드릴까요?",
      "Arabic": "!أهلاً وسهلاً! كيف أقدر أساعدك اليوم؟",
      "Hindi": "नमस्ते! स्वागत है। आज मैं आपकी कैसे मदद कर सकती हूँ?",
      "Portuguese": "Olá! Bem-vindo. Como posso te ajudar hoje?",
    };
    return greetings[persona.language] || "Hello! How can I help you today?";
  };

  const getGreetingTranslation = (persona: AIPersona, scenario: Scenario): string => {
    return "Hello! Welcome. How can I help you today?";
  };

  const sendMessage = async () => {
    if (!inputText.trim()) return;
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const userMsg: ChatMessage = {
      id: `m${messages.length + 1}`,
      sender: "user",
      text: inputText,
      timestamp: "now",
    };
    setMessages((prev) => [...prev, userMsg]);
    const userText = inputText.trim();
    setInputText("");
    setIsTyping(true);

    try {
      // Build conversation context for the AI persona
      const persona = selectedPersona;
      const scenario = selectedScenario;
      const systemPrompt = `You are ${persona?.name}, a ${persona?.role}. Your personality: ${persona?.personality}. Accent: ${persona?.accent}. You are in a scenario: ${scenario?.title} - ${scenario?.description}. Respond naturally in ${persona?.language} as your character would. Keep responses 1-3 sentences. Be contextually aware of what the user just said and respond meaningfully — never give a generic reply.`;

      // Use teacher.chat for real AI response with emotion-adaptive pacing
      const result = await teacherChat.mutateAsync({
        message: `${systemPrompt}\n\nUser says: ${userText}`,
        language: persona?.language || "Spanish",
        teacherPersona: "casual",
        conversationHistory: messages.slice(-8).map(m => ({ role: m.sender === 'user' ? 'user' as const : 'assistant' as const, content: m.text })),
        userLevel: (scenario?.difficulty === 'A1' || scenario?.difficulty === 'A2') ? 'beginner' : scenario?.difficulty === 'C1' ? 'advanced' : 'intermediate',
        emotionContext: emotionData.dominantEmotion ? emotionData : undefined,
        learningMemory: learningMemory.sessionCount ? learningMemory : undefined,
      });

      const responseText = result?.reply || "...";

      // Get English translation of the AI response
      let translation = "";
      try {
        const transResult = await translateMutation.mutateAsync({
          text: responseText,
          fromLanguage: persona?.language || "Spanish",
          toLanguage: "English",
        });
        translation = transResult?.translation || "";
      } catch { translation = ""; }

      // Auto-log grammar corrections from AI response to mistake journal
      const chatLang = selectedPersona?.language || "Spanish";
      parseAndLogCorrections(responseText, userText, chatLang).catch(() => {});

      const aiMsg: ChatMessage = {
        id: `m${messages.length + 2}`,
        sender: "ai",
        text: responseText,
        translation,
        timestamp: "now",
        feedback: { grammar: 0, vocabulary: 0, fluency: 0 },
      };
      setMessages((prev) => {
        const next = [...prev, aiMsg];
        saveConversationMemory(next);
        return next;
      });
    } catch (err) {
      // Fallback to a generic contextual response if API fails
      const fallbacks: Record<string, string> = {
        "Spanish": "Hmm, no entendí bien. ¿Puedes repetir?",
        "French": "Hmm, je n'ai pas bien compris. Pouvez-vous répéter?",
        "Japanese": "すみません、よく聞き取れませんでした。もう一度お願いします。",
        "Italian": "Scusa, non ho capito bene. Puoi ripetere?",
        "Korean": "죄송해요, 잘 못 들었어요. 다시 말씀해 주시겠어요?",
        "Arabic": "معلش، ما فهمت كويس. ممكن تعيد؟",
        "Hindi": "माफ़ कीजिए, मुझे ठीक से समझ नहीं आया। क्या आप दोहरा सकते हैं?",
        "Portuguese": "Desculpa, não entendi bem. Pode repetir?",
      };
      const aiMsg: ChatMessage = {
        id: `m${messages.length + 2}`,
        sender: "ai",
        text: fallbacks[selectedPersona?.language || "Spanish"] || "Could you repeat that?",
        translation: "Sorry, I didn't quite understand. Could you repeat?",
        timestamp: "now",
      };
      setMessages((prev) => [...prev, aiMsg]);
    }
    setIsTyping(false);
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  };

  // Save conversation memory after each exchange
  const saveConversationMemory = async (msgs: ChatMessage[]) => {
    try {
      const userMsgs = msgs.filter(m => m.sender === 'user');
      const summary = `Practiced ${selectedScenario?.title || 'scenario'} with ${userMsgs.length} exchanges.`;
      const updated = {
        ...learningMemory,
        sessionCount: (learningMemory.sessionCount || 0) + 1,
        lastSessionSummary: summary,
      };
      await AsyncStorage.setItem('@linguavibe_scenarios_memory', JSON.stringify(updated));
      setLearningMemory(updated);
    } catch {}
  };

  // ─── BROWSE VIEW ──────────────────────────────────────────────────────────

  const renderBrowse = () => (
    <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      {/* Hero */}
      <View style={styles.heroSection}>
        <Text style={[styles.heroTitle, { color: colors.foreground }]}>Practice Real Conversations</Text>
        <Text style={[styles.heroSubtitle, { color: colors.muted }]}>
          Talk to AI characters in realistic scenarios. They have personalities, accents, and cultural quirks — just like real people.
        </Text>
      </View>

      {/* Category Filter */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
        {CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat}
            style={[styles.categoryPill, { backgroundColor: selectedCategory === cat ? colors.primary : colors.surface }]}
            onPress={() => setSelectedCategory(cat)}
          >
            <Text style={[styles.categoryText, { color: selectedCategory === cat ? "#FFF" : colors.muted }]}>{cat}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Scenarios */}
      {filteredScenarios.map((scenario) => (
        <TouchableOpacity
          key={scenario.id}
          style={[styles.scenarioCard, { backgroundColor: colors.surface }]}
          onPress={() => startScenario(scenario)}
          activeOpacity={0.7}
        >
          <View style={styles.scenarioHeader}>
            <Text style={styles.scenarioIcon}>{scenario.icon}</Text>
            <View style={styles.scenarioInfo}>
              <Text style={[styles.scenarioTitle, { color: colors.foreground }]}>{scenario.title}</Text>
              <Text style={[styles.scenarioDesc, { color: colors.muted }]}>{scenario.description}</Text>
            </View>
            {scenario.isB2B && (
              <View style={[styles.b2bBadge, { backgroundColor: "#8B5CF620" }]}>
                <Text style={styles.b2bText}>B2B</Text>
              </View>
            )}
          </View>
          <View style={styles.scenarioMeta}>
            <Text style={styles.scenarioFlag}>{scenario.flag}</Text>
            <View style={[styles.diffBadge, { backgroundColor: colors.primary + "15" }]}>
              <Text style={[styles.diffText, { color: colors.primary }]}>{scenario.difficulty}</Text>
            </View>
            <Text style={[styles.scenarioDuration, { color: colors.muted }]}>⏱ {scenario.duration}</Text>
            <View style={styles.scenarioSkills}>
              {scenario.skills.slice(0, 2).map((skill) => (
                <Text key={skill} style={[styles.skillTag, { color: colors.muted, backgroundColor: colors.border + "50" }]}>{skill}</Text>
              ))}
            </View>
          </View>
        </TouchableOpacity>
      ))}

      {/* AI Personas Section */}
      <Text style={[styles.sectionTitle, { color: colors.foreground, marginTop: 20 }]}>🎭 Meet the AI Characters</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.personaScroll}>
        {AI_PERSONAS.map((persona) => (
          <View key={persona.id} style={[styles.personaCard, { backgroundColor: colors.surface }]}>
            <Text style={styles.personaAvatar}>{persona.avatar}</Text>
            <Text style={[styles.personaName, { color: colors.foreground }]}>{persona.name}</Text>
            <Text style={[styles.personaRole, { color: colors.primary }]}>{persona.role}</Text>
            <Text style={[styles.personaAccent, { color: colors.muted }]}>{persona.flag} {persona.accent}</Text>
            <Text style={[styles.personaBio, { color: colors.muted }]} numberOfLines={2}>{persona.bio}</Text>
          </View>
        ))}
      </ScrollView>
    </ScrollView>
  );

  // ─── CHAT VIEW ────────────────────────────────────────────────────────────

  const renderChat = () => (
    <View style={styles.chatContainer}>
      {/* Chat Header */}
      <View style={[styles.chatHeader, { backgroundColor: colors.surface }]}>
        <Text style={styles.chatAvatar}>{selectedPersona?.avatar}</Text>
        <View style={styles.chatHeaderInfo}>
          <Text style={[styles.chatName, { color: colors.foreground }]}>{selectedPersona?.name}</Text>
          <Text style={[styles.chatRole, { color: colors.muted }]}>{selectedPersona?.role}</Text>
        </View>
        <TouchableOpacity
          onPress={() => setShowTranslations(!showTranslations)}
          style={[styles.translateToggle, { backgroundColor: showTranslations ? colors.primary + "20" : colors.border + "50" }]}
        >
          <Ionicons name="language" size={16} color={showTranslations ? colors.primary : colors.muted} />
        </TouchableOpacity>
      </View>

      {/* Scenario Context */}
      <View style={[styles.scenarioContext, { backgroundColor: colors.primary + "10" }]}>
        <Text style={[styles.contextText, { color: colors.primary }]}>
          {selectedScenario?.icon} {selectedScenario?.title} • {selectedScenario?.difficulty}
        </Text>
      </View>

      {/* Messages */}
      <ScrollView
        ref={scrollRef}
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
        onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
      >
        {messages.map((msg) => (
          <View key={msg.id} style={[styles.messageBubble, msg.sender === "user" ? styles.userBubble : styles.aiBubble]}>
            {msg.sender === "ai" && <Text style={styles.msgAvatar}>{selectedPersona?.avatar}</Text>}
            <View style={[
              styles.msgContent,
              { backgroundColor: msg.sender === "user" ? colors.primary : colors.surface }
            ]}>
              <Text style={[styles.msgText, { color: msg.sender === "user" ? "#FFF" : colors.foreground }]}>
                {msg.text}
              </Text>
              {showTranslations && msg.translation && (
                <Text style={[styles.msgTranslation, { color: msg.sender === "user" ? "rgba(255,255,255,0.7)" : colors.muted }]}>
                  {msg.translation}
                </Text>
              )}
              {msg.feedback && (
                <View style={[styles.feedbackRow, { borderTopColor: msg.sender === "user" ? "rgba(255,255,255,0.2)" : colors.border }]}>
                  <Text style={[styles.feedbackItem, { color: "#10B981" }]}>📝 {msg.feedback.grammar}%</Text>
                  <Text style={[styles.feedbackItem, { color: "#3B82F6" }]}>📚 {msg.feedback.vocabulary}%</Text>
                  <Text style={[styles.feedbackItem, { color: "#F59E0B" }]}>🗣 {msg.feedback.fluency}%</Text>
                </View>
              )}
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Input */}
      <View style={[styles.inputContainer, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
        <TouchableOpacity style={styles.micBtn}>
          <Ionicons name="mic" size={22} color={colors.primary} />
        </TouchableOpacity>
        <TextInput
          style={[styles.textInput, { color: colors.foreground, backgroundColor: colors.background }]}
          placeholder="Type or speak..."
          placeholderTextColor={colors.muted}
          value={inputText}
          onChangeText={setInputText}
          onSubmitEditing={sendMessage}
          returnKeyType="send"
        />
        <TouchableOpacity style={[styles.sendBtn, { backgroundColor: colors.primary }]} onPress={sendMessage}>
          <Ionicons name="send" size={18} color="#FFF" />
        </TouchableOpacity>
      </View>
    </View>
  );

  // ─── MAIN RENDER ──────────────────────────────────────────────────────────

  return (
    <ScreenContainer edges={["top", "left", "right"]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => {
          if (view === "chat") setView("browse");
          else router.back();
        }} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>
          {view === "browse" ? "🎭 Scenarios" : view === "chat" ? selectedScenario?.title || "Chat" : "Personas"}
        </Text>
        <View style={{ width: 30 }} />
      </View>

      {view === "browse" && renderBrowse()}
      {view === "chat" && renderChat()}
    </ScreenContainer>
  );
}

// ─── STYLES ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 0.5 },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 17, fontWeight: "700" },
  scrollContent: { padding: 16, paddingBottom: 100 },
  // Hero
  heroSection: { marginBottom: 16 },
  heroTitle: { fontSize: 22, fontWeight: "800" },
  heroSubtitle: { fontSize: 13, lineHeight: 19, marginTop: 6 },
  // Categories
  categoryScroll: { marginBottom: 16 },
  categoryPill: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 16, marginRight: 8 },
  categoryText: { fontSize: 12, fontWeight: "600" },
  // Scenarios
  scenarioCard: { borderRadius: 14, padding: 14, marginBottom: 10 },
  scenarioHeader: { flexDirection: "row", gap: 10, alignItems: "flex-start" },
  scenarioIcon: { fontSize: 28 },
  scenarioInfo: { flex: 1 },
  scenarioTitle: { fontSize: 15, fontWeight: "700" },
  scenarioDesc: { fontSize: 11, lineHeight: 16, marginTop: 3 },
  b2bBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  b2bText: { color: "#8B5CF6", fontSize: 9, fontWeight: "800" },
  scenarioMeta: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 10, flexWrap: "wrap" },
  scenarioFlag: { fontSize: 14 },
  diffBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  diffText: { fontSize: 10, fontWeight: "700" },
  scenarioDuration: { fontSize: 10 },
  scenarioSkills: { flexDirection: "row", gap: 4 },
  skillTag: { fontSize: 9, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, overflow: "hidden" },
  sectionTitle: { fontSize: 16, fontWeight: "700", marginBottom: 12 },
  // Personas
  personaScroll: { marginBottom: 20 },
  personaCard: { width: 140, borderRadius: 14, padding: 14, marginRight: 10, alignItems: "center" },
  personaAvatar: { fontSize: 32 },
  personaName: { fontSize: 13, fontWeight: "700", marginTop: 6 },
  personaRole: { fontSize: 10, fontWeight: "500", marginTop: 2, textAlign: "center" },
  personaAccent: { fontSize: 9, marginTop: 4 },
  personaBio: { fontSize: 9, marginTop: 6, textAlign: "center", lineHeight: 13 },
  // Chat
  chatContainer: { flex: 1 },
  chatHeader: { flexDirection: "row", alignItems: "center", padding: 12, gap: 10 },
  chatAvatar: { fontSize: 32 },
  chatHeaderInfo: { flex: 1 },
  chatName: { fontSize: 15, fontWeight: "700" },
  chatRole: { fontSize: 11 },
  translateToggle: { width: 32, height: 32, borderRadius: 16, justifyContent: "center", alignItems: "center" },
  scenarioContext: { paddingHorizontal: 14, paddingVertical: 8 },
  contextText: { fontSize: 11, fontWeight: "600" },
  messagesContainer: { flex: 1 },
  messagesContent: { padding: 16, gap: 12 },
  messageBubble: { flexDirection: "row", gap: 8 },
  userBubble: { justifyContent: "flex-end" },
  aiBubble: { justifyContent: "flex-start" },
  msgAvatar: { fontSize: 20, marginTop: 4 },
  msgContent: { maxWidth: "75%", borderRadius: 16, padding: 12 },
  msgText: { fontSize: 14, lineHeight: 20 },
  msgTranslation: { fontSize: 11, marginTop: 6, fontStyle: "italic" },
  feedbackRow: { flexDirection: "row", gap: 8, marginTop: 8, paddingTop: 8, borderTopWidth: 0.5 },
  feedbackItem: { fontSize: 10, fontWeight: "600" },
  // Input
  inputContainer: { flexDirection: "row", alignItems: "center", padding: 10, gap: 8, borderTopWidth: 0.5 },
  micBtn: { width: 36, height: 36, borderRadius: 18, justifyContent: "center", alignItems: "center" },
  textInput: { flex: 1, height: 38, borderRadius: 19, paddingHorizontal: 14, fontSize: 14 },
  sendBtn: { width: 36, height: 36, borderRadius: 18, justifyContent: "center", alignItems: "center" },
});
