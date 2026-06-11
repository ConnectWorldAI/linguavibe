/**
 * Pronunciation Duel Game Library
 *
 * Provides game modes, word banks, AI scoring, and match management
 * for live pronunciation duel games between friends.
 *
 * Game Modes:
 * - Word Flash: Quick-fire single words, fastest + most accurate wins
 * - Phrase Race: Complete phrases/sentences, scored on accuracy + speed
 * - Tongue Twister: Difficult tongue twisters, scored on clarity + completeness
 *
 * Categories: ABCs, Numbers, Adjectives, Verb Tenses (present/past/future)
 */
import AsyncStorage from "@react-native-async-storage/async-storage";

// ─── Types ──────────────────────────────────────────────────────────────────

export type DuelGameMode = "word_flash" | "phrase_race" | "tongue_twister";
export type DuelCategory = "abcs" | "numbers" | "adjectives" | "verbs_present" | "verbs_past" | "verbs_future" | "mixed";
export type DuelDifficulty = "easy" | "medium" | "hard";

export interface DuelWord {
  id: string;
  text: string;
  phonetic: string;
  translation: string;
  language: string;
  category: DuelCategory;
  difficulty: DuelDifficulty;
}

export interface DuelRound {
  roundNumber: number;
  word: DuelWord;
  playerScore: number;
  opponentScore: number;
  playerTime: number; // ms
  opponentTime: number; // ms
  playerTranscript: string;
  opponentTranscript: string;
}

export interface DuelMatch {
  id: string;
  mode: DuelGameMode;
  category: DuelCategory;
  difficulty: DuelDifficulty;
  language: string;
  playerName: string;
  opponentName: string;
  rounds: DuelRound[];
  totalRounds: number;
  currentRound: number;
  playerTotalScore: number;
  opponentTotalScore: number;
  startedAt: string;
  completedAt: string | null;
  winner: "player" | "opponent" | "tie" | null;
  shared: boolean;
}

export interface DuelStats {
  totalDuels: number;
  wins: number;
  losses: number;
  ties: number;
  winStreak: number;
  bestWinStreak: number;
  averageScore: number;
  favoriteMode: DuelGameMode;
  totalWordsSpoken: number;
}

// ─── Word Banks ─────────────────────────────────────────────────────────────

const WORD_BANK: Record<DuelCategory, DuelWord[]> = {
  abcs: [
    { id: "abc1", text: "Alfabeto", phonetic: "/al.fa.ˈbe.to/", translation: "Alphabet", language: "Spanish", category: "abcs", difficulty: "easy" },
    { id: "abc2", text: "Biblioteca", phonetic: "/bi.blio.ˈte.ka/", translation: "Library", language: "Spanish", category: "abcs", difficulty: "medium" },
    { id: "abc3", text: "Comunicación", phonetic: "/ko.mu.ni.ka.ˈθjon/", translation: "Communication", language: "Spanish", category: "abcs", difficulty: "hard" },
    { id: "abc4", text: "Desarrollo", phonetic: "/de.sa.ˈro.ʝo/", translation: "Development", language: "Spanish", category: "abcs", difficulty: "hard" },
    { id: "abc5", text: "Escritura", phonetic: "/es.kɾi.ˈtu.ɾa/", translation: "Writing", language: "Spanish", category: "abcs", difficulty: "medium" },
    { id: "abc6", text: "Fonética", phonetic: "/fo.ˈne.ti.ka/", translation: "Phonetics", language: "Spanish", category: "abcs", difficulty: "medium" },
    { id: "abc7", text: "Gramática", phonetic: "/ɡɾa.ˈma.ti.ka/", translation: "Grammar", language: "Spanish", category: "abcs", difficulty: "easy" },
    { id: "abc8", text: "Habilidad", phonetic: "/a.bi.li.ˈðað/", translation: "Skill", language: "Spanish", category: "abcs", difficulty: "medium" },
  ],
  numbers: [
    { id: "num1", text: "Veintiuno", phonetic: "/bein.ti.ˈu.no/", translation: "Twenty-one", language: "Spanish", category: "numbers", difficulty: "easy" },
    { id: "num2", text: "Cuarenta y cinco", phonetic: "/kwa.ˈɾen.ta i ˈθin.ko/", translation: "Forty-five", language: "Spanish", category: "numbers", difficulty: "medium" },
    { id: "num3", text: "Setecientos", phonetic: "/se.te.ˈθjen.tos/", translation: "Seven hundred", language: "Spanish", category: "numbers", difficulty: "hard" },
    { id: "num4", text: "Mil novecientos", phonetic: "/mil no.βe.ˈθjen.tos/", translation: "Nineteen hundred", language: "Spanish", category: "numbers", difficulty: "hard" },
    { id: "num5", text: "Doscientos treinta", phonetic: "/dos.ˈθjen.tos ˈtɾein.ta/", translation: "Two hundred thirty", language: "Spanish", category: "numbers", difficulty: "medium" },
    { id: "num6", text: "Ochenta y ocho", phonetic: "/o.ˈʧen.ta i ˈo.ʧo/", translation: "Eighty-eight", language: "Spanish", category: "numbers", difficulty: "easy" },
  ],
  adjectives: [
    { id: "adj1", text: "Extraordinario", phonetic: "/eks.tɾa.oɾ.ði.ˈna.ɾjo/", translation: "Extraordinary", language: "Spanish", category: "adjectives", difficulty: "hard" },
    { id: "adj2", text: "Impresionante", phonetic: "/im.pɾe.sjo.ˈnan.te/", translation: "Impressive", language: "Spanish", category: "adjectives", difficulty: "medium" },
    { id: "adj3", text: "Maravilloso", phonetic: "/ma.ɾa.βi.ˈʝo.so/", translation: "Wonderful", language: "Spanish", category: "adjectives", difficulty: "medium" },
    { id: "adj4", text: "Hermoso", phonetic: "/eɾ.ˈmo.so/", translation: "Beautiful", language: "Spanish", category: "adjectives", difficulty: "easy" },
    { id: "adj5", text: "Desafortunado", phonetic: "/de.sa.foɾ.tu.ˈna.ðo/", translation: "Unfortunate", language: "Spanish", category: "adjectives", difficulty: "hard" },
    { id: "adj6", text: "Increíble", phonetic: "/in.kɾe.ˈi.βle/", translation: "Incredible", language: "Spanish", category: "adjectives", difficulty: "easy" },
  ],
  verbs_present: [
    { id: "vp1", text: "Yo estoy hablando", phonetic: "/ʝo es.ˈtoi a.ˈβlan.do/", translation: "I am speaking", language: "Spanish", category: "verbs_present", difficulty: "easy" },
    { id: "vp2", text: "Nosotros aprendemos", phonetic: "/no.ˈso.tɾos a.pɾen.ˈde.mos/", translation: "We learn", language: "Spanish", category: "verbs_present", difficulty: "medium" },
    { id: "vp3", text: "Ellos están escribiendo", phonetic: "/ˈe.ʝos es.ˈtan es.kɾi.ˈβjen.do/", translation: "They are writing", language: "Spanish", category: "verbs_present", difficulty: "hard" },
    { id: "vp4", text: "Tú necesitas practicar", phonetic: "/tu ne.θe.ˈsi.tas pɾak.ti.ˈkaɾ/", translation: "You need to practice", language: "Spanish", category: "verbs_present", difficulty: "medium" },
    { id: "vp5", text: "Ella comprende perfectamente", phonetic: "/ˈe.ʝa kom.ˈpɾen.de peɾ.fek.ta.ˈmen.te/", translation: "She understands perfectly", language: "Spanish", category: "verbs_present", difficulty: "hard" },
  ],
  verbs_past: [
    { id: "vpast1", text: "Yo hablé con ella", phonetic: "/ʝo a.ˈβle kon ˈe.ʝa/", translation: "I spoke with her", language: "Spanish", category: "verbs_past", difficulty: "easy" },
    { id: "vpast2", text: "Nosotros viajamos ayer", phonetic: "/no.ˈso.tɾos bja.ˈxa.mos a.ˈʝeɾ/", translation: "We traveled yesterday", language: "Spanish", category: "verbs_past", difficulty: "medium" },
    { id: "vpast3", text: "Ellos descubrieron la verdad", phonetic: "/ˈe.ʝos des.ku.ˈβɾje.ɾon la βeɾ.ˈðað/", translation: "They discovered the truth", language: "Spanish", category: "verbs_past", difficulty: "hard" },
    { id: "vpast4", text: "Tú escribiste una carta", phonetic: "/tu es.kɾi.ˈβis.te ˈu.na ˈkaɾ.ta/", translation: "You wrote a letter", language: "Spanish", category: "verbs_past", difficulty: "medium" },
  ],
  verbs_future: [
    { id: "vf1", text: "Yo hablaré mañana", phonetic: "/ʝo a.βla.ˈɾe ma.ˈɲa.na/", translation: "I will speak tomorrow", language: "Spanish", category: "verbs_future", difficulty: "easy" },
    { id: "vf2", text: "Nosotros aprenderemos juntos", phonetic: "/no.ˈso.tɾos a.pɾen.de.ˈɾe.mos ˈxun.tos/", translation: "We will learn together", language: "Spanish", category: "verbs_future", difficulty: "medium" },
    { id: "vf3", text: "Ellos conquistarán el mundo", phonetic: "/ˈe.ʝos kon.kis.ta.ˈɾan el ˈmun.do/", translation: "They will conquer the world", language: "Spanish", category: "verbs_future", difficulty: "hard" },
    { id: "vf4", text: "Ella viajará a España", phonetic: "/ˈe.ʝa bja.xa.ˈɾa a es.ˈpa.ɲa/", translation: "She will travel to Spain", language: "Spanish", category: "verbs_future", difficulty: "medium" },
  ],
  mixed: [], // populated dynamically
};

const TONGUE_TWISTERS: DuelWord[] = [
  { id: "tt1", text: "Tres tristes tigres tragaban trigo", phonetic: "/tɾes ˈtɾis.tes ˈti.ɣɾes tɾa.ˈɣa.βan ˈtɾi.ɣo/", translation: "Three sad tigers swallowed wheat", language: "Spanish", category: "mixed", difficulty: "hard" },
  { id: "tt2", text: "El perro de San Roque no tiene rabo", phonetic: "/el ˈpe.ro ðe san ˈro.ke no ˈtje.ne ˈra.βo/", translation: "San Roque's dog has no tail", language: "Spanish", category: "mixed", difficulty: "medium" },
  { id: "tt3", text: "Pablito clavó un clavito", phonetic: "/pa.ˈβli.to kla.ˈβo un kla.ˈβi.to/", translation: "Pablito nailed a little nail", language: "Spanish", category: "mixed", difficulty: "easy" },
  { id: "tt4", text: "Como poco coco como, poco coco compro", phonetic: "/ˈko.mo ˈpo.ko ˈko.ko ˈko.mo ˈpo.ko ˈko.ko ˈkom.pɾo/", translation: "Since I eat little coconut, I buy little coconut", language: "Spanish", category: "mixed", difficulty: "hard" },
  { id: "tt5", text: "Erre con erre guitarra, erre con erre barril", phonetic: "/ˈe.re kon ˈe.re ɡi.ˈta.ra ˈe.re kon ˈe.re ba.ˈril/", translation: "R with R guitar, R with R barrel", language: "Spanish", category: "mixed", difficulty: "hard" },
  { id: "tt6", text: "Un tigre, dos tigres, tres tigres", phonetic: "/un ˈti.ɣɾe ðos ˈti.ɣɾes tɾes ˈti.ɣɾes/", translation: "One tiger, two tigers, three tigers", language: "Spanish", category: "mixed", difficulty: "easy" },
];

// ─── Storage Keys ───────────────────────────────────────────────────────────

const DUEL_HISTORY_KEY = "@pronunciation_duel_history";
const DUEL_STATS_KEY = "@pronunciation_duel_stats";

// ─── Game Logic ─────────────────────────────────────────────────────────────

/**
 * Get words for a duel round based on mode and category
 */
export function getDuelWords(
  mode: DuelGameMode,
  category: DuelCategory,
  count: number = 5,
  language: string = "Spanish"
): DuelWord[] {
  // Try language-specific word bank first (French, Portuguese, Japanese)
  if (language !== "Spanish") {
    const { getLanguageDuelWords } = require("./word-banks");
    const langWords = getLanguageDuelWords(language, mode, category, count);
    if (langWords && langWords.length > 0) return langWords;
  }

  // Default: Spanish word bank
  if (mode === "tongue_twister") {
    const shuffled = [...TONGUE_TWISTERS].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, Math.min(count, TONGUE_TWISTERS.length));
  }

  let pool: DuelWord[] = [];
  if (category === "mixed") {
    // Combine all categories
    Object.values(WORD_BANK).forEach(words => {
      pool = pool.concat(words);
    });
  } else {
    pool = [...(WORD_BANK[category] || [])];
  }

  const shuffled = pool.sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, shuffled.length));
}

/**
 * Score a pronunciation attempt using text similarity
 * Returns 0-100 score based on how closely the transcript matches the target
 */
export function scorePronunciation(target: string, transcript: string): number {
  if (!transcript || transcript.trim().length === 0) return 0;

  const normalizeText = (t: string) =>
    t.toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // remove accents for comparison
      .replace(/[^a-z0-9\s]/g, "")
      .trim();

  const targetNorm = normalizeText(target);
  const transcriptNorm = normalizeText(transcript);

  if (targetNorm === transcriptNorm) return 100;

  // Levenshtein distance-based scoring
  const maxLen = Math.max(targetNorm.length, transcriptNorm.length);
  if (maxLen === 0) return 100;

  const distance = levenshteinDistance(targetNorm, transcriptNorm);
  const similarity = 1 - distance / maxLen;

  // Word-level matching bonus
  const targetWords = targetNorm.split(/\s+/);
  const transcriptWords = transcriptNorm.split(/\s+/);
  let wordMatches = 0;
  targetWords.forEach(tw => {
    if (transcriptWords.some(sw => sw === tw || levenshteinDistance(tw, sw) <= 1)) {
      wordMatches++;
    }
  });
  const wordBonus = targetWords.length > 0 ? (wordMatches / targetWords.length) * 0.3 : 0;

  const rawScore = (similarity * 0.7 + wordBonus) * 100;
  return Math.min(100, Math.max(0, Math.round(rawScore)));
}

/**
 * Calculate time bonus (faster = higher bonus, max 20 points)
 */
export function calculateTimeBonus(timeMs: number, mode: DuelGameMode): number {
  const maxTime = mode === "tongue_twister" ? 15000 : mode === "phrase_race" ? 10000 : 5000;
  if (timeMs >= maxTime) return 0;
  const ratio = 1 - timeMs / maxTime;
  return Math.round(ratio * 20);
}

/**
 * Simulate opponent score (AI opponent with variable difficulty)
 */
export function simulateOpponentScore(difficulty: DuelDifficulty, playerScore: number): number {
  const baseRange = {
    easy: { min: 40, max: 70 },
    medium: { min: 55, max: 85 },
    hard: { min: 70, max: 95 },
  };
  const range = baseRange[difficulty];
  const base = range.min + Math.random() * (range.max - range.min);

  // Add some variance based on player score to keep it competitive
  const variance = (Math.random() - 0.5) * 15;
  return Math.min(100, Math.max(0, Math.round(base + variance)));
}

/**
 * Simulate opponent time
 */
export function simulateOpponentTime(mode: DuelGameMode, difficulty: DuelDifficulty): number {
  const baseTimes = {
    word_flash: { easy: 3500, medium: 2800, hard: 2200 },
    phrase_race: { easy: 6000, medium: 4500, hard: 3500 },
    tongue_twister: { easy: 9000, medium: 7000, hard: 5500 },
  };
  const base = baseTimes[mode][difficulty];
  const variance = (Math.random() - 0.5) * 2000;
  return Math.max(1000, Math.round(base + variance));
}

// ─── Match Management ───────────────────────────────────────────────────────

/**
 * Create a new duel match
 */
export function createDuelMatch(
  mode: DuelGameMode,
  category: DuelCategory,
  difficulty: DuelDifficulty,
  language: string,
  playerName: string,
  opponentName: string,
  totalRounds: number = 5
): DuelMatch {
  return {
    id: `duel_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    mode,
    category,
    difficulty,
    language,
    playerName,
    opponentName,
    rounds: [],
    totalRounds,
    currentRound: 0,
    playerTotalScore: 0,
    opponentTotalScore: 0,
    startedAt: new Date().toISOString(),
    completedAt: null,
    winner: null,
    shared: false,
  };
}

/**
 * Complete a round and update match
 */
export function completeRound(
  match: DuelMatch,
  word: DuelWord,
  playerScore: number,
  playerTime: number,
  playerTranscript: string
): DuelMatch {
  const opponentScore = simulateOpponentScore(match.difficulty, playerScore);
  const opponentTime = simulateOpponentTime(match.mode, match.difficulty);
  const timeBonus = calculateTimeBonus(playerTime, match.mode);
  const opponentTimeBonus = calculateTimeBonus(opponentTime, match.mode);

  const finalPlayerScore = Math.min(100, playerScore + timeBonus);
  const finalOpponentScore = Math.min(100, opponentScore + opponentTimeBonus);

  const round: DuelRound = {
    roundNumber: match.currentRound + 1,
    word,
    playerScore: finalPlayerScore,
    opponentScore: finalOpponentScore,
    playerTime,
    opponentTime,
    playerTranscript,
    opponentTranscript: word.text, // simulated perfect match for opponent
  };

  const updatedMatch: DuelMatch = {
    ...match,
    rounds: [...match.rounds, round],
    currentRound: match.currentRound + 1,
    playerTotalScore: match.playerTotalScore + finalPlayerScore,
    opponentTotalScore: match.opponentTotalScore + finalOpponentScore,
  };

  // Check if match is complete
  if (updatedMatch.currentRound >= updatedMatch.totalRounds) {
    updatedMatch.completedAt = new Date().toISOString();
    if (updatedMatch.playerTotalScore > updatedMatch.opponentTotalScore) {
      updatedMatch.winner = "player";
    } else if (updatedMatch.opponentTotalScore > updatedMatch.playerTotalScore) {
      updatedMatch.winner = "opponent";
    } else {
      updatedMatch.winner = "tie";
    }
  }

  return updatedMatch;
}

// ─── Persistence ────────────────────────────────────────────────────────────

/**
 * Save completed match to history
 */
export async function saveDuelMatch(match: DuelMatch): Promise<void> {
  try {
    const existing = await AsyncStorage.getItem(DUEL_HISTORY_KEY);
    const history: DuelMatch[] = existing ? JSON.parse(existing) : [];
    history.unshift(match);
    // Keep last 50 matches
    if (history.length > 50) history.length = 50;
    await AsyncStorage.setItem(DUEL_HISTORY_KEY, JSON.stringify(history));
    await updateDuelStats(match);
  } catch {}
}

/**
 * Get duel match history
 */
export async function getDuelHistory(): Promise<DuelMatch[]> {
  try {
    const data = await AsyncStorage.getItem(DUEL_HISTORY_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

/**
 * Get duel stats
 */
export async function getDuelStats(): Promise<DuelStats> {
  try {
    const data = await AsyncStorage.getItem(DUEL_STATS_KEY);
    if (data) return JSON.parse(data);
  } catch {}
  return {
    totalDuels: 0,
    wins: 0,
    losses: 0,
    ties: 0,
    winStreak: 0,
    bestWinStreak: 0,
    averageScore: 0,
    favoriteMode: "word_flash",
    totalWordsSpoken: 0,
  };
}

/**
 * Update stats after a match
 */
async function updateDuelStats(match: DuelMatch): Promise<void> {
  try {
    const stats = await getDuelStats();
    stats.totalDuels++;
    stats.totalWordsSpoken += match.rounds.length;

    if (match.winner === "player") {
      stats.wins++;
      stats.winStreak++;
      if (stats.winStreak > stats.bestWinStreak) {
        stats.bestWinStreak = stats.winStreak;
      }
    } else if (match.winner === "opponent") {
      stats.losses++;
      stats.winStreak = 0;
    } else {
      stats.ties++;
    }

    // Update average score
    const totalScore = stats.averageScore * (stats.totalDuels - 1) + (match.playerTotalScore / match.totalRounds);
    stats.averageScore = Math.round(totalScore / stats.totalDuels);

    // Update favorite mode
    const history = await getDuelHistory();
    const modeCounts: Record<string, number> = {};
    history.forEach(m => {
      modeCounts[m.mode] = (modeCounts[m.mode] || 0) + 1;
    });
    const topMode = Object.entries(modeCounts).sort((a, b) => b[1] - a[1])[0];
    if (topMode) stats.favoriteMode = topMode[0] as DuelGameMode;

    await AsyncStorage.setItem(DUEL_STATS_KEY, JSON.stringify(stats));
  } catch {}
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

/**
 * Get mode display info
 */
export function getModeInfo(mode: DuelGameMode) {
  switch (mode) {
    case "word_flash":
      return { title: "Word Flash", icon: "flash", description: "Quick-fire words — fastest + most accurate wins!", color: "#FFB800" };
    case "phrase_race":
      return { title: "Phrase Race", icon: "rocket", description: "Complete phrases before your opponent!", color: "#00AAFF" };
    case "tongue_twister":
      return { title: "Tongue Twister", icon: "flame", description: "Master tricky tongue twisters — clarity is key!", color: "#FF2D2D" };
  }
}

/**
 * Get category display info
 */
export function getCategoryInfo(category: DuelCategory) {
  switch (category) {
    case "abcs": return { title: "ABCs & Words", icon: "text", color: "#8B5CF6" };
    case "numbers": return { title: "Numbers", icon: "calculator", color: "#06B6D4" };
    case "adjectives": return { title: "Adjectives", icon: "color-palette", color: "#EC4899" };
    case "verbs_present": return { title: "Present Tense", icon: "time", color: "#10B981" };
    case "verbs_past": return { title: "Past Tense", icon: "arrow-back-circle", color: "#F59E0B" };
    case "verbs_future": return { title: "Future Tense", icon: "arrow-forward-circle", color: "#6366F1" };
    case "mixed": return { title: "Mixed Challenge", icon: "shuffle", color: "#EF4444" };
  }
}

/**
 * Get opponent names for simulated duels
 */
export function getRandomOpponent(): string {
  const opponents = [
    "Sofia M.", "Carlos R.", "Aisha K.", "Marco L.",
    "Luna P.", "Diego V.", "Yuki T.", "Priya S.",
    "André B.", "Mei W.", "Hassan A.", "Isabella F.",
  ];
  return opponents[Math.floor(Math.random() * opponents.length)];
}
