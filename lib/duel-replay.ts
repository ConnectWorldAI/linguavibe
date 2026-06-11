/**
 * Duel Replay System
 *
 * Stores round-by-round recordings of pronunciation duels and provides
 * playback, highlight extraction, and sharing capabilities.
 */
import AsyncStorage from "@react-native-async-storage/async-storage";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ReplayRoundData {
  roundNumber: number;
  word: string;
  phonetic: string;
  translation: string;
  playerTranscript: string;
  playerScore: number;
  opponentScore: number;
  recordingDurationMs: number;
  timestamp: number;
  isHighlight: boolean; // Auto-detected highlight moment
}

export interface DuelReplay {
  id: string;
  matchId: string;
  mode: string;
  category: string;
  language: string;
  difficulty: string;
  playerName: string;
  opponentName: string;
  playerTotalScore: number;
  opponentTotalScore: number;
  winner: "player" | "opponent" | "tie";
  rounds: ReplayRoundData[];
  createdAt: number;
  totalDurationMs: number;
  highlightCount: number;
}

export interface ReplayHighlight {
  replayId: string;
  roundNumber: number;
  word: string;
  playerScore: number;
  opponentScore: number;
  type: "perfect_score" | "comeback" | "close_call" | "domination" | "tongue_twister_ace";
  description: string;
}

export interface ReplayShareData {
  replay: DuelReplay;
  highlights: ReplayHighlight[];
  shareText: string;
  shareFormat: "story" | "clip" | "full_replay";
}

// ─── Constants ────────────────────────────────────────────────────────────────

const REPLAY_STORAGE_KEY = "@duel_replays";
const MAX_STORED_REPLAYS = 50;

// ─── Highlight Detection ──────────────────────────────────────────────────────

/**
 * Detect highlight moments in a duel replay
 */
export function detectHighlights(replay: DuelReplay): ReplayHighlight[] {
  const highlights: ReplayHighlight[] = [];

  replay.rounds.forEach((round, idx) => {
    // Perfect score (95+)
    if (round.playerScore >= 95) {
      highlights.push({
        replayId: replay.id,
        roundNumber: round.roundNumber,
        word: round.word,
        playerScore: round.playerScore,
        opponentScore: round.opponentScore,
        type: "perfect_score",
        description: `Perfect pronunciation of "${round.word}" — ${round.playerScore}%!`,
      });
    }

    // Comeback: lost previous round but won this one by 15+ points
    if (idx > 0) {
      const prevRound = replay.rounds[idx - 1];
      if (
        prevRound.playerScore < prevRound.opponentScore &&
        round.playerScore > round.opponentScore &&
        round.playerScore - round.opponentScore >= 15
      ) {
        highlights.push({
          replayId: replay.id,
          roundNumber: round.roundNumber,
          word: round.word,
          playerScore: round.playerScore,
          opponentScore: round.opponentScore,
          type: "comeback",
          description: `Comeback! Won "${round.word}" by ${round.playerScore - round.opponentScore} points after trailing!`,
        });
      }
    }

    // Close call: within 3 points
    if (
      Math.abs(round.playerScore - round.opponentScore) <= 3 &&
      round.playerScore >= 70
    ) {
      highlights.push({
        replayId: replay.id,
        roundNumber: round.roundNumber,
        word: round.word,
        playerScore: round.playerScore,
        opponentScore: round.opponentScore,
        type: "close_call",
        description: `Nail-biter! "${round.word}" decided by just ${Math.abs(round.playerScore - round.opponentScore)} points!`,
      });
    }

    // Domination: won by 30+ points
    if (round.playerScore - round.opponentScore >= 30) {
      highlights.push({
        replayId: replay.id,
        roundNumber: round.roundNumber,
        word: round.word,
        playerScore: round.playerScore,
        opponentScore: round.opponentScore,
        type: "domination",
        description: `Dominated "${round.word}" — ${round.playerScore}% vs ${round.opponentScore}%!`,
      });
    }
  });

  return highlights;
}

// ─── Replay Creation ──────────────────────────────────────────────────────────

/**
 * Create a replay from match data
 */
export function createReplay(
  matchId: string,
  mode: string,
  category: string,
  language: string,
  difficulty: string,
  playerName: string,
  opponentName: string,
  rounds: Array<{
    word: string;
    phonetic: string;
    translation: string;
    playerTranscript: string;
    playerScore: number;
    opponentScore: number;
    durationMs: number;
  }>
): DuelReplay {
  const playerTotal = rounds.reduce((sum, r) => sum + r.playerScore, 0);
  const opponentTotal = rounds.reduce((sum, r) => sum + r.opponentScore, 0);
  const totalDuration = rounds.reduce((sum, r) => sum + r.durationMs, 0);

  const replayRounds: ReplayRoundData[] = rounds.map((r, idx) => ({
    roundNumber: idx + 1,
    word: r.word,
    phonetic: r.phonetic,
    translation: r.translation,
    playerTranscript: r.playerTranscript,
    playerScore: r.playerScore,
    opponentScore: r.opponentScore,
    recordingDurationMs: r.durationMs,
    timestamp: Date.now() + idx * 1000,
    isHighlight: r.playerScore >= 95 || r.playerScore - r.opponentScore >= 30,
  }));

  const replay: DuelReplay = {
    id: `replay_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    matchId,
    mode,
    category,
    language,
    difficulty,
    playerName,
    opponentName,
    playerTotalScore: playerTotal,
    opponentTotalScore: opponentTotal,
    winner: playerTotal > opponentTotal ? "player" : playerTotal < opponentTotal ? "opponent" : "tie",
    rounds: replayRounds,
    createdAt: Date.now(),
    totalDurationMs: totalDuration,
    highlightCount: replayRounds.filter(r => r.isHighlight).length,
  };

  return replay;
}

// ─── Storage ──────────────────────────────────────────────────────────────────

/**
 * Save a replay to storage
 */
export async function saveReplay(replay: DuelReplay): Promise<void> {
  try {
    const existing = await getStoredReplays();
    existing.unshift(replay);
    // Keep only the most recent replays
    const trimmed = existing.slice(0, MAX_STORED_REPLAYS);
    await AsyncStorage.setItem(REPLAY_STORAGE_KEY, JSON.stringify(trimmed));
  } catch (err) {
    console.warn("Failed to save replay:", err);
  }
}

/**
 * Get all stored replays
 */
export async function getStoredReplays(): Promise<DuelReplay[]> {
  try {
    const data = await AsyncStorage.getItem(REPLAY_STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (err) {
    console.warn("Failed to load replays:", err);
    return [];
  }
}

/**
 * Get a specific replay by ID
 */
export async function getReplayById(replayId: string): Promise<DuelReplay | null> {
  const replays = await getStoredReplays();
  return replays.find(r => r.id === replayId) || null;
}

/**
 * Get replays for a specific match
 */
export async function getReplayByMatchId(matchId: string): Promise<DuelReplay | null> {
  const replays = await getStoredReplays();
  return replays.find(r => r.matchId === matchId) || null;
}

/**
 * Delete a replay
 */
export async function deleteReplay(replayId: string): Promise<void> {
  try {
    const replays = await getStoredReplays();
    const filtered = replays.filter(r => r.id !== replayId);
    await AsyncStorage.setItem(REPLAY_STORAGE_KEY, JSON.stringify(filtered));
  } catch (err) {
    console.warn("Failed to delete replay:", err);
  }
}

// ─── Share Generation ─────────────────────────────────────────────────────────

/**
 * Generate shareable content from a replay
 */
export function generateReplayShare(
  replay: DuelReplay,
  format: "story" | "clip" | "full_replay"
): ReplayShareData {
  const highlights = detectHighlights(replay);
  let shareText = "";

  const resultEmoji = replay.winner === "player" ? "🏆" : replay.winner === "tie" ? "🤝" : "💪";
  const modeLabel = replay.mode === "word_flash" ? "Word Flash" : replay.mode === "phrase_race" ? "Phrase Race" : "Tongue Twister";

  switch (format) {
    case "story":
      shareText = [
        `${resultEmoji} Pronunciation Duel — ${modeLabel}`,
        `🌍 Language: ${replay.language}`,
        `⚔️ ${replay.playerName} vs ${replay.opponentName}`,
        `📊 Score: ${replay.playerTotalScore} - ${replay.opponentTotalScore}`,
        "",
        highlights.length > 0 ? `✨ ${highlights.length} highlight moment${highlights.length > 1 ? "s" : ""}!` : "",
        highlights.slice(0, 2).map(h => `  • ${h.description}`).join("\n"),
        "",
        `#LinguaVibe #PronunciationDuel #${replay.language}`,
      ].filter(Boolean).join("\n");
      break;

    case "clip":
      const bestRound = [...replay.rounds].sort((a, b) => b.playerScore - a.playerScore)[0];
      shareText = [
        `🎯 Best Round Highlight!`,
        `Word: "${bestRound.word}" (${bestRound.phonetic})`,
        `Score: ${bestRound.playerScore}% 🔥`,
        "",
        `Mode: ${modeLabel} | Language: ${replay.language}`,
        `#LinguaVibe #LanguageLearning`,
      ].join("\n");
      break;

    case "full_replay":
      shareText = [
        `${resultEmoji} Full Duel Replay — ${modeLabel}`,
        `🌍 ${replay.language} | ⚡ ${replay.difficulty}`,
        `⚔️ ${replay.playerName} vs ${replay.opponentName}`,
        "",
        "📋 Round-by-Round:",
        ...replay.rounds.map(r =>
          `  R${r.roundNumber}: "${r.word}" → ${r.playerScore}% vs ${r.opponentScore}% ${r.playerScore > r.opponentScore ? "✅" : r.playerScore < r.opponentScore ? "❌" : "🤝"}`
        ),
        "",
        `📊 Final: ${replay.playerTotalScore} - ${replay.opponentTotalScore}`,
        `⏱️ Duration: ${Math.round(replay.totalDurationMs / 1000)}s`,
        "",
        `#LinguaVibe #PronunciationDuel`,
      ].join("\n");
      break;
  }

  return { replay, highlights, shareText, shareFormat: format };
}

// ─── Playback State ───────────────────────────────────────────────────────────

export interface ReplayPlaybackState {
  replay: DuelReplay;
  currentRound: number;
  isPlaying: boolean;
  speed: 1 | 1.5 | 2;
  showTranscript: boolean;
}

/**
 * Create initial playback state for a replay
 */
export function createPlaybackState(replay: DuelReplay): ReplayPlaybackState {
  return {
    replay,
    currentRound: 0,
    isPlaying: false,
    speed: 1,
    showTranscript: true,
  };
}
