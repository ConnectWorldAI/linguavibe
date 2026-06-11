/**
 * Friend Challenges System
 *
 * Enables competitive language learning between friends with:
 *   - Daily vocabulary duels (head-to-head word matching)
 *   - Weekly streak challenges (who can maintain the longest streak)
 *   - Translation races (speed-based translation accuracy)
 *   - Pronunciation battles (AI-scored pronunciation comparison)
 *
 * All data is persisted locally via AsyncStorage.
 * In a production app, this would sync via the server.
 */
import AsyncStorage from "@react-native-async-storage/async-storage";

// ─── Constants ───────────────────────────────────────────────────────────────
const CHALLENGES_KEY = "linguavibe_challenges";
const CHALLENGE_HISTORY_KEY = "linguavibe_challenge_history";

// ─── Types ───────────────────────────────────────────────────────────────────
export type ChallengeType = "vocab_duel" | "streak_race" | "translation_race" | "pronunciation_battle";
export type ChallengeStatus = "pending" | "active" | "completed" | "expired" | "declined";

export interface ChallengeParticipant {
  id: string;
  name: string;
  avatar: string;
  score: number;
  completedAt?: string;
  streak?: number;
}

export interface Challenge {
  id: string;
  type: ChallengeType;
  title: string;
  description: string;
  language: string;
  difficulty: "easy" | "medium" | "hard";
  status: ChallengeStatus;
  creator: ChallengeParticipant;
  opponent: ChallengeParticipant;
  createdAt: string;
  expiresAt: string;
  completedAt?: string;
  // Challenge-specific data
  questions?: ChallengeQuestion[];
  targetStreak?: number;
  timeLimit?: number; // seconds
  winnerId?: string;
}

export interface ChallengeQuestion {
  id: string;
  prompt: string;
  correctAnswer: string;
  options?: string[];
  type: "multiple_choice" | "translation" | "pronunciation";
}

export interface ChallengeStats {
  totalChallenges: number;
  wins: number;
  losses: number;
  draws: number;
  winRate: number;
  currentWinStreak: number;
  bestWinStreak: number;
  favoriteType: ChallengeType | null;
  totalPointsEarned: number;
}

// ─── Challenge Templates ─────────────────────────────────────────────────────
export const CHALLENGE_TEMPLATES: Record<ChallengeType, {
  title: string;
  description: string;
  icon: string;
  color: string;
  duration: number; // hours
  questionCount: number;
}> = {
  vocab_duel: {
    title: "Vocabulary Duel",
    description: "Match 20 words faster than your opponent",
    icon: "flash",
    color: "#F59E0B",
    duration: 24,
    questionCount: 20,
  },
  streak_race: {
    title: "Streak Race",
    description: "Who can maintain a 7-day streak first?",
    icon: "flame",
    color: "#EF4444",
    duration: 168, // 7 days
    questionCount: 0,
  },
  translation_race: {
    title: "Translation Race",
    description: "Translate 10 sentences with speed and accuracy",
    icon: "language",
    color: "#3B82F6",
    duration: 48,
    questionCount: 10,
  },
  pronunciation_battle: {
    title: "Pronunciation Battle",
    description: "AI judges who pronounces 5 phrases better",
    icon: "mic",
    color: "#8B5CF6",
    duration: 72,
    questionCount: 5,
  },
};

// ─── Sample Challenge Questions ──────────────────────────────────────────────
function generateVocabQuestions(language: string): ChallengeQuestion[] {
  const spanishWords = [
    { prompt: "House", correctAnswer: "Casa", options: ["Casa", "Carro", "Cama", "Calle"] },
    { prompt: "Water", correctAnswer: "Agua", options: ["Agua", "Aire", "Arena", "Alma"] },
    { prompt: "Friend", correctAnswer: "Amigo", options: ["Amigo", "Amor", "Animal", "Anillo"] },
    { prompt: "Book", correctAnswer: "Libro", options: ["Libro", "Libre", "Limón", "Luna"] },
    { prompt: "Time", correctAnswer: "Tiempo", options: ["Tiempo", "Tierra", "Tigre", "Tinta"] },
    { prompt: "Food", correctAnswer: "Comida", options: ["Comida", "Camino", "Cielo", "Color"] },
    { prompt: "City", correctAnswer: "Ciudad", options: ["Ciudad", "Ciencia", "Cuerpo", "Campo"] },
    { prompt: "Work", correctAnswer: "Trabajo", options: ["Trabajo", "Triste", "Tren", "Trueno"] },
    { prompt: "Family", correctAnswer: "Familia", options: ["Familia", "Fiesta", "Fuego", "Flor"] },
    { prompt: "Money", correctAnswer: "Dinero", options: ["Dinero", "Diente", "Dolor", "Dulce"] },
    { prompt: "School", correctAnswer: "Escuela", options: ["Escuela", "Estrella", "Espejo", "Espada"] },
    { prompt: "Music", correctAnswer: "Música", options: ["Música", "Mundo", "Mano", "Mesa"] },
    { prompt: "Heart", correctAnswer: "Corazón", options: ["Corazón", "Cabeza", "Cuerpo", "Camisa"] },
    { prompt: "Dream", correctAnswer: "Sueño", options: ["Sueño", "Sol", "Sal", "Sed"] },
    { prompt: "Night", correctAnswer: "Noche", options: ["Noche", "Nombre", "Nube", "Nariz"] },
    { prompt: "Light", correctAnswer: "Luz", options: ["Luz", "Luna", "Lluvia", "Lago"] },
    { prompt: "Door", correctAnswer: "Puerta", options: ["Puerta", "Piedra", "Playa", "Pared"] },
    { prompt: "Tree", correctAnswer: "Árbol", options: ["Árbol", "Arena", "Azul", "Alto"] },
    { prompt: "Love", correctAnswer: "Amor", options: ["Amor", "Alma", "Arte", "Ayer"] },
    { prompt: "Life", correctAnswer: "Vida", options: ["Vida", "Verde", "Viento", "Voz"] },
  ];

  return spanishWords.map((w, i) => ({
    id: `vocab_${i}`,
    prompt: w.prompt,
    correctAnswer: w.correctAnswer,
    options: w.options,
    type: "multiple_choice" as const,
  }));
}

// ─── State Management ────────────────────────────────────────────────────────
async function loadChallenges(): Promise<Challenge[]> {
  try {
    const raw = await AsyncStorage.getItem(CHALLENGES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

async function saveChallenges(challenges: Challenge[]): Promise<void> {
  await AsyncStorage.setItem(CHALLENGES_KEY, JSON.stringify(challenges));
}

// ─── Public API ──────────────────────────────────────────────────────────────

export async function createChallenge(params: {
  type: ChallengeType;
  language: string;
  difficulty: "easy" | "medium" | "hard";
  opponentName: string;
  opponentAvatar?: string;
}): Promise<Challenge> {
  const template = CHALLENGE_TEMPLATES[params.type];
  const now = new Date();
  const expiresAt = new Date(now.getTime() + template.duration * 60 * 60 * 1000);

  const challenge: Challenge = {
    id: `challenge_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    type: params.type,
    title: template.title,
    description: template.description,
    language: params.language,
    difficulty: params.difficulty,
    status: "active",
    creator: {
      id: "me",
      name: "You",
      avatar: "🧑",
      score: 0,
    },
    opponent: {
      id: `opponent_${Date.now()}`,
      name: params.opponentName,
      avatar: params.opponentAvatar || "🤖",
      score: 0,
    },
    createdAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
    questions: params.type === "vocab_duel" ? generateVocabQuestions(params.language) : undefined,
    targetStreak: params.type === "streak_race" ? 7 : undefined,
    timeLimit: params.type === "translation_race" ? 300 : undefined, // 5 minutes
  };

  const challenges = await loadChallenges();
  challenges.unshift(challenge);
  await saveChallenges(challenges);
  return challenge;
}

export async function answerChallengeQuestion(
  challengeId: string,
  questionId: string,
  answer: string,
  timeMs: number
): Promise<{ correct: boolean; pointsEarned: number }> {
  const challenges = await loadChallenges();
  const challenge = challenges.find((c) => c.id === challengeId);
  if (!challenge || !challenge.questions) return { correct: false, pointsEarned: 0 };

  const question = challenge.questions.find((q) => q.id === questionId);
  if (!question) return { correct: false, pointsEarned: 0 };

  const correct = answer === question.correctAnswer;
  // Points: base 100 + speed bonus (max 50 for < 3s)
  const speedBonus = correct ? Math.max(0, Math.round(50 * (1 - timeMs / 10000))) : 0;
  const pointsEarned = correct ? 100 + speedBonus : 0;

  challenge.creator.score += pointsEarned;

  // Simulate opponent answer (AI opponent)
  const opponentCorrect = Math.random() > 0.35; // 65% accuracy
  const opponentSpeed = 2000 + Math.random() * 5000;
  const opponentSpeedBonus = opponentCorrect ? Math.max(0, Math.round(50 * (1 - opponentSpeed / 10000))) : 0;
  challenge.opponent.score += opponentCorrect ? 100 + opponentSpeedBonus : 0;

  await saveChallenges(challenges);
  return { correct, pointsEarned };
}

export async function completeChallenge(challengeId: string): Promise<Challenge | null> {
  const challenges = await loadChallenges();
  const challenge = challenges.find((c) => c.id === challengeId);
  if (!challenge) return null;

  challenge.status = "completed";
  challenge.completedAt = new Date().toISOString();
  challenge.winnerId = challenge.creator.score >= challenge.opponent.score ? challenge.creator.id : challenge.opponent.id;

  await saveChallenges(challenges);

  // Save to history
  try {
    const historyRaw = await AsyncStorage.getItem(CHALLENGE_HISTORY_KEY);
    const history: Challenge[] = historyRaw ? JSON.parse(historyRaw) : [];
    history.unshift(challenge);
    await AsyncStorage.setItem(CHALLENGE_HISTORY_KEY, JSON.stringify(history.slice(0, 50)));
  } catch {}

  return challenge;
}

export async function getActiveChallenges(): Promise<Challenge[]> {
  const challenges = await loadChallenges();
  const now = new Date();
  return challenges.filter((c) => {
    if (c.status === "active" && new Date(c.expiresAt) < now) {
      c.status = "expired";
    }
    return c.status === "active";
  });
}

export async function getChallengeHistory(): Promise<Challenge[]> {
  try {
    const raw = await AsyncStorage.getItem(CHALLENGE_HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function getChallengeStats(): Promise<ChallengeStats> {
  const history = await getChallengeHistory();

  const wins = history.filter((c) => c.winnerId === "me").length;
  const losses = history.filter((c) => c.winnerId && c.winnerId !== "me").length;
  const draws = history.filter((c) => !c.winnerId).length;
  const totalPoints = history.reduce((sum, c) => sum + c.creator.score, 0);

  // Calculate win streak
  let currentStreak = 0;
  let bestStreak = 0;
  for (const c of history) {
    if (c.winnerId === "me") {
      currentStreak++;
      bestStreak = Math.max(bestStreak, currentStreak);
    } else {
      currentStreak = 0;
    }
  }

  // Favorite type
  const typeCounts: Record<string, number> = {};
  history.forEach((c) => { typeCounts[c.type] = (typeCounts[c.type] || 0) + 1; });
  const favoriteType = Object.entries(typeCounts).sort((a, b) => b[1] - a[1])[0]?.[0] as ChallengeType | undefined;

  return {
    totalChallenges: history.length,
    wins,
    losses,
    draws,
    winRate: history.length > 0 ? Math.round((wins / history.length) * 100) : 0,
    currentWinStreak: currentStreak,
    bestWinStreak: bestStreak,
    favoriteType: favoriteType || null,
    totalPointsEarned: totalPoints,
  };
}
