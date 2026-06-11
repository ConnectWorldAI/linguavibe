/**
 * Duel Content Export Library
 *
 * Generates shareable content from pronunciation duel recordings.
 * Creates formatted text summaries, social media posts, and exportable data
 * that can be shared as stories, posts, or challenge invitations.
 */
import { Share, Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { RecordingData } from "@/components/duel-recording-overlay";

// ─── Types ──────────────────────────────────────────────────────────────────

export interface ExportedContent {
  id: string;
  type: "story" | "post" | "challenge" | "highlight_reel";
  title: string;
  body: string;
  hashtags: string[];
  stats: ContentStats;
  createdAt: string;
  shared: boolean;
}

interface ContentStats {
  playerScore: number;
  opponentScore: number;
  winner: string;
  duration: string;
  mode: string;
  rounds: number;
  highlights: number;
  accuracy: number;
}

// ─── Storage ────────────────────────────────────────────────────────────────

const EXPORTS_KEY = "duel_exports";

export async function saveExportedContent(content: ExportedContent): Promise<void> {
  try {
    const existing = await getExportedContent();
    existing.unshift(content);
    // Keep last 50 exports
    const trimmed = existing.slice(0, 50);
    await AsyncStorage.setItem(EXPORTS_KEY, JSON.stringify(trimmed));
  } catch {}
}

export async function getExportedContent(): Promise<ExportedContent[]> {
  try {
    const data = await AsyncStorage.getItem(EXPORTS_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

// ─── Content Generation ─────────────────────────────────────────────────────

function getModeEmoji(mode: string): string {
  switch (mode) {
    case "word_flash": return "⚡";
    case "phrase_race": return "🏃";
    case "tongue_twister": return "👅";
    default: return "🎤";
  }
}

function getModeLabel(mode: string): string {
  switch (mode) {
    case "word_flash": return "Word Flash";
    case "phrase_race": return "Phrase Race";
    case "tongue_twister": return "Tongue Twister";
    default: return "Pronunciation Duel";
  }
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins === 0) return `${secs}s`;
  return `${mins}m ${secs}s`;
}

function getWinMessage(playerScore: number, opponentScore: number, playerName: string, opponentName: string): string {
  if (playerScore > opponentScore) {
    const diff = playerScore - opponentScore;
    if (diff > 200) return `${playerName} DOMINATED ${opponentName}! 🔥`;
    if (diff > 100) return `${playerName} crushed it against ${opponentName}! 💪`;
    return `${playerName} edged out ${opponentName} in a close battle! ⚔️`;
  } else if (opponentScore > playerScore) {
    return `${opponentName} took the win, but ${playerName} fought hard! 🥊`;
  }
  return `It's a TIE! Both fighters are evenly matched! 🤝`;
}

// ─── Export Functions ────────────────────────────────────────────────────────

export function generateStoryContent(recording: RecordingData): ExportedContent {
  const emoji = getModeEmoji(recording.mode);
  const modeLabel = getModeLabel(recording.mode);
  const winMsg = getWinMessage(recording.finalPlayerScore, recording.finalOpponentScore, recording.playerName, recording.opponentName);
  const duration = formatDuration(recording.duration);
  const accuracy = recording.finalPlayerScore > 0
    ? Math.round((recording.finalPlayerScore / (recording.rounds * 100)) * 100)
    : 0;

  const title = `${emoji} Pronunciation Duel: ${modeLabel}`;
  const body = [
    `${winMsg}`,
    ``,
    `📊 Final Score:`,
    `${recording.playerName}: ${recording.finalPlayerScore} pts`,
    `${recording.opponentName}: ${recording.finalOpponentScore} pts`,
    ``,
    `⏱️ Duration: ${duration}`,
    `🎯 Mode: ${modeLabel}`,
    `📈 Rounds: ${recording.rounds}`,
    recording.highlights.length > 0 ? `⭐ Highlights: ${recording.highlights.length}` : "",
    ``,
    `Think you can beat this? Challenge me on LinguaVibe! 🎤`,
  ].filter(Boolean).join("\n");

  return {
    id: `export_${Date.now()}`,
    type: "story",
    title,
    body,
    hashtags: ["#LinguaVibe", "#PronunciationDuel", "#LanguageLearning", "#SpeakBetter", `#${modeLabel.replace(/\s/g, "")}`],
    stats: {
      playerScore: recording.finalPlayerScore,
      opponentScore: recording.finalOpponentScore,
      winner: recording.finalPlayerScore >= recording.finalOpponentScore ? recording.playerName : recording.opponentName,
      duration,
      mode: modeLabel,
      rounds: recording.rounds,
      highlights: recording.highlights.length,
      accuracy,
    },
    createdAt: new Date().toISOString(),
    shared: false,
  };
}

export function generateChallengeContent(recording: RecordingData): ExportedContent {
  const modeLabel = getModeLabel(recording.mode);
  const emoji = getModeEmoji(recording.mode);

  const title = `${emoji} Challenge Invitation`;
  const body = [
    `🎤 I just scored ${recording.finalPlayerScore} points in a ${modeLabel} duel!`,
    ``,
    `Think you can beat my score? 🤔`,
    ``,
    `Mode: ${modeLabel}`,
    `My Score: ${recording.finalPlayerScore} pts`,
    `Rounds: ${recording.rounds}`,
    ``,
    `Download LinguaVibe and challenge me! Let's see who has better pronunciation 🔥`,
  ].join("\n");

  return {
    id: `challenge_${Date.now()}`,
    type: "challenge",
    title,
    body,
    hashtags: ["#LinguaVibe", "#ChallengeMe", "#PronunciationBattle", "#LanguageChallenge"],
    stats: {
      playerScore: recording.finalPlayerScore,
      opponentScore: recording.finalOpponentScore,
      winner: recording.playerName,
      duration: formatDuration(recording.duration),
      mode: modeLabel,
      rounds: recording.rounds,
      highlights: recording.highlights.length,
      accuracy: Math.round((recording.finalPlayerScore / (recording.rounds * 100)) * 100),
    },
    createdAt: new Date().toISOString(),
    shared: false,
  };
}

export function generateHighlightReel(recording: RecordingData): ExportedContent {
  const modeLabel = getModeLabel(recording.mode);
  const emoji = getModeEmoji(recording.mode);
  const highlightTexts = recording.highlights.map((h, i) => `  ${i + 1}. ${h.description}`);

  const title = `${emoji} Duel Highlights`;
  const body = [
    `🏆 ${recording.playerName} vs ${recording.opponentName}`,
    `Mode: ${modeLabel} | ${recording.rounds} rounds`,
    ``,
    `⭐ Key Moments:`,
    ...highlightTexts,
    ``,
    `Final: ${recording.finalPlayerScore} - ${recording.finalOpponentScore}`,
    ``,
    `#LinguaVibe #PronunciationDuel`,
  ].join("\n");

  return {
    id: `highlight_${Date.now()}`,
    type: "highlight_reel",
    title,
    body,
    hashtags: ["#LinguaVibe", "#Highlights", "#BestMoments"],
    stats: {
      playerScore: recording.finalPlayerScore,
      opponentScore: recording.finalOpponentScore,
      winner: recording.finalPlayerScore >= recording.finalOpponentScore ? recording.playerName : recording.opponentName,
      duration: formatDuration(recording.duration),
      mode: modeLabel,
      rounds: recording.rounds,
      highlights: recording.highlights.length,
      accuracy: Math.round((recording.finalPlayerScore / (recording.rounds * 100)) * 100),
    },
    createdAt: new Date().toISOString(),
    shared: false,
  };
}

// ─── Share Functions ────────────────────────────────────────────────────────

export async function shareContent(content: ExportedContent): Promise<boolean> {
  try {
    const message = `${content.body}\n\n${content.hashtags.join(" ")}`;
    const result = await Share.share({
      message,
      title: content.title,
    });

    if (result.action === Share.sharedAction) {
      // Mark as shared
      content.shared = true;
      await saveExportedContent(content);
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

export async function shareAsChallenge(recording: RecordingData): Promise<boolean> {
  const content = generateChallengeContent(recording);
  return shareContent(content);
}

export async function shareAsStory(recording: RecordingData): Promise<boolean> {
  const content = generateStoryContent(recording);
  return shareContent(content);
}

// ─── Quick Share (no recording needed) ──────────────────────────────────────

export async function quickShareDuelResult(
  playerName: string,
  opponentName: string,
  playerScore: number,
  opponentScore: number,
  mode: string,
  rounds: number,
): Promise<boolean> {
  const modeLabel = getModeLabel(mode);
  const emoji = getModeEmoji(mode);
  const won = playerScore > opponentScore;

  const message = [
    `${emoji} Pronunciation Duel Result!`,
    ``,
    won ? `🏆 ${playerName} WINS!` : playerScore === opponentScore ? `🤝 TIE!` : `${opponentName} wins this round!`,
    ``,
    `${playerName}: ${playerScore} pts`,
    `${opponentName}: ${opponentScore} pts`,
    `Mode: ${modeLabel} | ${rounds} rounds`,
    ``,
    `Challenge me on LinguaVibe! 🎤🔥`,
    `#LinguaVibe #PronunciationDuel #LanguageLearning`,
  ].join("\n");

  try {
    const result = await Share.share({ message, title: `${emoji} Duel Result` });
    return result.action === Share.sharedAction;
  } catch {
    return false;
  }
}
