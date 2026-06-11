/**
 * Voice Memos Local Storage & Management
 * 
 * Stores teacher voice memos locally and manages their state
 * (read/unread, playback position, etc.)
 */

import AsyncStorage from "@react-native-async-storage/async-storage";

const VOICE_MEMOS_KEY = "linguavibe_voice_memos";

export interface VoiceMemo {
  id: string;
  teacherName: string;
  teacherPersona: string;
  memoType: "encouragement" | "tip" | "homework_assigned" | "milestone" | "check_in";
  transcript: string;
  targetLanguagePhrase: string | null;
  tip: string | null;
  audioUrl: string | null;
  struggleArea: string;
  createdAt: string;
  isRead: boolean;
  isPlayed: boolean;
}

interface VoiceMemoState {
  memos: VoiceMemo[];
  lastChecked: string;
}

const DEFAULT_STATE: VoiceMemoState = {
  memos: [],
  lastChecked: new Date().toISOString(),
};

async function loadState(): Promise<VoiceMemoState> {
  try {
    const raw = await AsyncStorage.getItem(VOICE_MEMOS_KEY);
    if (!raw) return { ...DEFAULT_STATE };
    return JSON.parse(raw);
  } catch {
    return { ...DEFAULT_STATE };
  }
}

async function saveState(state: VoiceMemoState): Promise<void> {
  await AsyncStorage.setItem(VOICE_MEMOS_KEY, JSON.stringify(state));
}

/**
 * Add a new voice memo (received from server)
 */
export async function addVoiceMemo(memo: Omit<VoiceMemo, "isRead" | "isPlayed">): Promise<VoiceMemo> {
  const state = await loadState();
  const fullMemo: VoiceMemo = { ...memo, isRead: false, isPlayed: false };
  state.memos.unshift(fullMemo); // Newest first
  // Keep max 50 memos
  if (state.memos.length > 50) state.memos = state.memos.slice(0, 50);
  await saveState(state);
  return fullMemo;
}

/**
 * Get all voice memos (newest first)
 */
export async function getVoiceMemos(): Promise<VoiceMemo[]> {
  const state = await loadState();
  return state.memos;
}

/**
 * Get unread voice memos count
 */
export async function getUnreadCount(): Promise<number> {
  const state = await loadState();
  return state.memos.filter((m) => !m.isRead).length;
}

/**
 * Mark a memo as read
 */
export async function markAsRead(memoId: string): Promise<void> {
  const state = await loadState();
  const memo = state.memos.find((m) => m.id === memoId);
  if (memo) {
    memo.isRead = true;
    await saveState(state);
  }
}

/**
 * Mark a memo as played
 */
export async function markAsPlayed(memoId: string): Promise<void> {
  const state = await loadState();
  const memo = state.memos.find((m) => m.id === memoId);
  if (memo) {
    memo.isPlayed = true;
    memo.isRead = true;
    await saveState(state);
  }
}

/**
 * Delete a memo
 */
export async function deleteMemo(memoId: string): Promise<void> {
  const state = await loadState();
  state.memos = state.memos.filter((m) => m.id !== memoId);
  await saveState(state);
}

/**
 * Get the most recent unread memo (for notification badge)
 */
export async function getLatestUnread(): Promise<VoiceMemo | null> {
  const state = await loadState();
  return state.memos.find((m) => !m.isRead) || null;
}

/**
 * Update a memo's audio URL (used to cache generated audio)
 */
export async function updateMemoAudioUrl(memoId: string, audioUrl: string): Promise<void> {
  const state = await loadState();
  const memo = state.memos.find((m) => m.id === memoId);
  if (memo) {
    memo.audioUrl = audioUrl;
    await saveState(state);
  }
}
