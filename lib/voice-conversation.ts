/**
 * AI Voice Conversation Practice Engine
 *
 * Manages the full voice conversation loop:
 *   1. AI speaks a prompt/response via TTS (expo-speech)
 *   2. User records a voice response (expo-audio)
 *   3. Server transcribes the recording
 *   4. Server generates AI response via LLM
 *   5. AI speaks the response, loop continues
 *
 * Features:
 *   - Multiple conversation modes (free talk, guided, pronunciation drill)
 *   - Speed control for TTS
 *   - Conversation history with translations
 *   - Pronunciation scoring integration
 *   - Session stats (words spoken, accuracy, fluency)
 */
import AsyncStorage from "@react-native-async-storage/async-storage";

// ─── Constants ───────────────────────────────────────────────────────────────
const CONVERSATION_HISTORY_KEY = "linguavibe_voice_conversations";
const CONVERSATION_STATS_KEY = "linguavibe_voice_conv_stats";

// ─── Types ───────────────────────────────────────────────────────────────────
export type ConversationMode = "free_talk" | "guided" | "pronunciation" | "roleplay";

export interface ConversationTurn {
  id: string;
  role: "ai" | "user";
  text: string;
  translation?: string;
  timestamp: number;
  pronunciationScore?: number;
  corrections?: string[];
  durationMs?: number;
}

export interface ConversationSession {
  id: string;
  mode: ConversationMode;
  language: string;
  topic: string;
  turns: ConversationTurn[];
  startedAt: string;
  endedAt?: string;
  stats: SessionStats;
}

export interface SessionStats {
  totalTurns: number;
  userTurns: number;
  aiTurns: number;
  averagePronunciationScore: number;
  wordsSpoken: number;
  durationMs: number;
  correctionsCount: number;
}

export interface VoiceConversationConfig {
  language: string;
  targetLanguage: string;
  mode: ConversationMode;
  topic: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  ttsSpeed: number; // 0.5 - 2.0
  autoPlayAI: boolean;
  showTranslations: boolean;
}

export interface ConversationTopic {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  systemPrompt: string;
  starterPhrase: string;
  starterTranslation: string;
}

// ─── Conversation Topics ─────────────────────────────────────────────────────
export const CONVERSATION_TOPICS: ConversationTopic[] = [
  {
    id: "greetings",
    title: "Greetings & Introductions",
    description: "Practice saying hello and introducing yourself",
    icon: "hand-left",
    color: "#22C55E",
    difficulty: "beginner",
    systemPrompt: "You are a friendly native speaker. Have a simple conversation about greetings and introductions. Use simple vocabulary. Correct pronunciation gently. Keep responses to 1-2 sentences.",
    starterPhrase: "¡Hola! ¿Cómo te llamas?",
    starterTranslation: "Hello! What is your name?",
  },
  {
    id: "restaurant",
    title: "At the Restaurant",
    description: "Order food and drinks like a local",
    icon: "restaurant",
    color: "#F59E0B",
    difficulty: "beginner",
    systemPrompt: "You are a waiter at a restaurant. Help the customer order food. Use common restaurant vocabulary. Keep responses natural and short.",
    starterPhrase: "¡Bienvenido! ¿Qué le gustaría ordenar?",
    starterTranslation: "Welcome! What would you like to order?",
  },
  {
    id: "directions",
    title: "Asking for Directions",
    description: "Navigate a city in your target language",
    icon: "navigate",
    color: "#3B82F6",
    difficulty: "intermediate",
    systemPrompt: "You are a local giving directions to a tourist. Use directional vocabulary (left, right, straight, blocks). Be helpful and patient.",
    starterPhrase: "¿Disculpe, cómo llego al museo?",
    starterTranslation: "Excuse me, how do I get to the museum?",
  },
  {
    id: "shopping",
    title: "Shopping & Bargaining",
    description: "Buy things and negotiate prices",
    icon: "cart",
    color: "#EC4899",
    difficulty: "intermediate",
    systemPrompt: "You are a market vendor. Engage in a shopping conversation. Include prices, descriptions, and light bargaining. Use natural speech.",
    starterPhrase: "¡Buenos días! ¿Qué busca hoy?",
    starterTranslation: "Good morning! What are you looking for today?",
  },
  {
    id: "doctor",
    title: "At the Doctor",
    description: "Describe symptoms and understand medical advice",
    icon: "medkit",
    color: "#EF4444",
    difficulty: "advanced",
    systemPrompt: "You are a doctor. Ask about symptoms, give advice. Use medical vocabulary but explain terms simply. Be professional and caring.",
    starterPhrase: "Buenos días, ¿qué le trae por aquí hoy?",
    starterTranslation: "Good morning, what brings you here today?",
  },
  {
    id: "job_interview",
    title: "Job Interview",
    description: "Practice professional conversation skills",
    icon: "briefcase",
    color: "#8B5CF6",
    difficulty: "advanced",
    systemPrompt: "You are a job interviewer. Ask professional questions about experience, skills, and goals. Use formal language. Give feedback on responses.",
    starterPhrase: "Bienvenido. Cuénteme sobre su experiencia profesional.",
    starterTranslation: "Welcome. Tell me about your professional experience.",
  },
  {
    id: "travel",
    title: "Travel & Airport",
    description: "Check in, board, and navigate airports",
    icon: "airplane",
    color: "#06B6D4",
    difficulty: "intermediate",
    systemPrompt: "You are an airline agent at the airport. Help the traveler with check-in, boarding, and travel questions. Use travel vocabulary.",
    starterPhrase: "Buenas tardes. ¿Puedo ver su pasaporte y boleto?",
    starterTranslation: "Good afternoon. May I see your passport and ticket?",
  },
  {
    id: "free_talk",
    title: "Free Conversation",
    description: "Talk about anything — AI adapts to your level",
    icon: "chatbubbles",
    color: "#10B981",
    difficulty: "beginner",
    systemPrompt: "You are a friendly conversation partner. Adapt to the user's level. If they make mistakes, gently correct them. Keep the conversation flowing naturally.",
    starterPhrase: "¡Hola! ¿De qué te gustaría hablar hoy?",
    starterTranslation: "Hello! What would you like to talk about today?",
  },
];

// ─── LLM System Prompt Builder ───────────────────────────────────────────────
export function buildConversationSystemPrompt(
  topic: ConversationTopic,
  config: VoiceConversationConfig,
  history: ConversationTurn[]
): string {
  const levelGuide = {
    beginner: "Use simple vocabulary and short sentences. Speak slowly. Correct mistakes gently.",
    intermediate: "Use natural speech with some complex structures. Introduce new vocabulary in context.",
    advanced: "Use native-level speech including idioms and slang. Challenge the learner with complex topics.",
  };

  return `${topic.systemPrompt}

Language: Respond in ${config.targetLanguage}.
Level: ${config.difficulty}. ${levelGuide[config.difficulty]}

Rules:
- Keep responses to 1-3 sentences maximum
- After every 3-4 exchanges, gently correct any recurring mistakes
- If the user seems stuck, offer a simpler way to express their idea
- Stay in character and on topic
- Always respond in ${config.targetLanguage}

Conversation so far has ${history.length} turns.`;
}

// ─── Session Management ──────────────────────────────────────────────────────
export function createSession(
  mode: ConversationMode,
  language: string,
  topic: string
): ConversationSession {
  return {
    id: `voice_conv_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    mode,
    language,
    topic,
    turns: [],
    startedAt: new Date().toISOString(),
    stats: {
      totalTurns: 0,
      userTurns: 0,
      aiTurns: 0,
      averagePronunciationScore: 0,
      wordsSpoken: 0,
      durationMs: 0,
      correctionsCount: 0,
    },
  };
}

export function addTurn(
  session: ConversationSession,
  turn: Omit<ConversationTurn, "id" | "timestamp">
): ConversationSession {
  const newTurn: ConversationTurn = {
    ...turn,
    id: `turn_${session.turns.length}`,
    timestamp: Date.now(),
  };

  const turns = [...session.turns, newTurn];
  const userTurns = turns.filter((t) => t.role === "user");
  const pronScores = userTurns.filter((t) => t.pronunciationScore !== undefined).map((t) => t.pronunciationScore!);
  const totalWords = userTurns.reduce((sum, t) => sum + t.text.split(/\s+/).length, 0);
  const totalCorrections = turns.reduce((sum, t) => sum + (t.corrections?.length || 0), 0);

  return {
    ...session,
    turns,
    stats: {
      totalTurns: turns.length,
      userTurns: userTurns.length,
      aiTurns: turns.filter((t) => t.role === "ai").length,
      averagePronunciationScore: pronScores.length > 0
        ? Math.round(pronScores.reduce((a, b) => a + b, 0) / pronScores.length)
        : 0,
      wordsSpoken: totalWords,
      durationMs: turns.length > 1 ? turns[turns.length - 1].timestamp - turns[0].timestamp : 0,
      correctionsCount: totalCorrections,
    },
  };
}

export async function saveSession(session: ConversationSession): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(CONVERSATION_HISTORY_KEY);
    const sessions: ConversationSession[] = raw ? JSON.parse(raw) : [];
    const idx = sessions.findIndex((s) => s.id === session.id);
    if (idx >= 0) sessions[idx] = session;
    else sessions.unshift(session);
    // Keep last 20 sessions
    await AsyncStorage.setItem(CONVERSATION_HISTORY_KEY, JSON.stringify(sessions.slice(0, 20)));
  } catch {}
}

export async function getConversationHistory(): Promise<ConversationSession[]> {
  try {
    const raw = await AsyncStorage.getItem(CONVERSATION_HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

// ─── Aggregate Stats ─────────────────────────────────────────────────────────
export interface AggregateVoiceStats {
  totalSessions: number;
  totalMinutes: number;
  totalWordsSpoken: number;
  averagePronunciation: number;
  favoriteTopicId: string | null;
  sessionsThisWeek: number;
}

export async function getAggregateStats(): Promise<AggregateVoiceStats> {
  const sessions = await getConversationHistory();
  const now = Date.now();
  const weekAgo = now - 7 * 24 * 60 * 60 * 1000;

  const totalMinutes = Math.round(
    sessions.reduce((sum, s) => sum + s.stats.durationMs, 0) / 60000
  );
  const totalWords = sessions.reduce((sum, s) => sum + s.stats.wordsSpoken, 0);
  const pronScores = sessions
    .filter((s) => s.stats.averagePronunciationScore > 0)
    .map((s) => s.stats.averagePronunciationScore);
  const avgPron = pronScores.length > 0
    ? Math.round(pronScores.reduce((a, b) => a + b, 0) / pronScores.length)
    : 0;

  const topicCounts: Record<string, number> = {};
  sessions.forEach((s) => { topicCounts[s.topic] = (topicCounts[s.topic] || 0) + 1; });
  const favTopic = Object.entries(topicCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || null;

  const sessionsThisWeek = sessions.filter(
    (s) => new Date(s.startedAt).getTime() > weekAgo
  ).length;

  return {
    totalSessions: sessions.length,
    totalMinutes,
    totalWordsSpoken: totalWords,
    averagePronunciation: avgPron,
    favoriteTopicId: favTopic,
    sessionsThisWeek,
  };
}
