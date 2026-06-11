/**
 * Song Library — Save translated songs and track lesson completion
 * 
 * Uses user-scoped AsyncStorage to persist:
 * - Saved translated songs with metadata
 * - Lesson completion status per song
 * - Download history
 */

import AsyncStorage from "@react-native-async-storage/async-storage";

const SONG_LIBRARY_KEY = "@song_library";
const LESSON_COMPLETION_KEY = "@lesson_completions";

export interface SavedSong {
  id: string;
  title: string;
  artist: string;
  sourceLanguage: string;
  targetLanguage: string;
  voiceStyle: "natural" | "clone" | "match_original";
  savedAt: string;
  quality?: {
    syllableMatch: number;
    rhymePreservation: number;
    meaningPreservation: number;
    singability: number;
  };
  outputUrl?: string;
  jobId?: string;
  lessonCompleted?: boolean;
  lessonCompletedAt?: string;
  isDemoSong?: boolean;
  demoSongId?: string;
}

export interface LessonCompletion {
  songId: string;
  completedAt: string;
  vocabLearned: number;
  grammarRulesLearned: number;
  quizScore?: number;
}

/**
 * Get all saved songs from the library
 */
export async function getSavedSongs(): Promise<SavedSong[]> {
  try {
    const data = await AsyncStorage.getItem(SONG_LIBRARY_KEY);
    if (!data) return [];
    return JSON.parse(data);
  } catch {
    return [];
  }
}

/**
 * Save a song to the library
 */
export async function saveSongToLibrary(song: Omit<SavedSong, "id" | "savedAt">): Promise<SavedSong> {
  const songs = await getSavedSongs();
  
  // Check if already saved (by title + artist + targetLanguage)
  const existing = songs.find(
    (s) => s.title === song.title && s.artist === song.artist && s.targetLanguage === song.targetLanguage
  );
  if (existing) return existing;

  const newSong: SavedSong = {
    ...song,
    id: `song_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    savedAt: new Date().toISOString(),
  };

  songs.unshift(newSong);
  await AsyncStorage.setItem(SONG_LIBRARY_KEY, JSON.stringify(songs));
  return newSong;
}

/**
 * Remove a song from the library
 */
export async function removeSongFromLibrary(songId: string): Promise<void> {
  const songs = await getSavedSongs();
  const filtered = songs.filter((s) => s.id !== songId);
  await AsyncStorage.setItem(SONG_LIBRARY_KEY, JSON.stringify(filtered));
}

/**
 * Check if a song is already saved
 */
export async function isSongSaved(title: string, artist: string, targetLanguage: string): Promise<boolean> {
  const songs = await getSavedSongs();
  return songs.some(
    (s) => s.title === title && s.artist === artist && s.targetLanguage === targetLanguage
  );
}

/**
 * Mark a song's lesson as completed
 */
export async function markLessonCompleted(
  songId: string,
  completion: Omit<LessonCompletion, "songId" | "completedAt">
): Promise<void> {
  // Update the song entry
  const songs = await getSavedSongs();
  const songIndex = songs.findIndex((s) => s.id === songId);
  if (songIndex >= 0) {
    songs[songIndex].lessonCompleted = true;
    songs[songIndex].lessonCompletedAt = new Date().toISOString();
    await AsyncStorage.setItem(SONG_LIBRARY_KEY, JSON.stringify(songs));
  }

  // Store completion details
  const completions = await getLessonCompletions();
  completions.push({
    songId,
    completedAt: new Date().toISOString(),
    ...completion,
  });
  await AsyncStorage.setItem(LESSON_COMPLETION_KEY, JSON.stringify(completions));
}

/**
 * Get all lesson completions
 */
export async function getLessonCompletions(): Promise<LessonCompletion[]> {
  try {
    const data = await AsyncStorage.getItem(LESSON_COMPLETION_KEY);
    if (!data) return [];
    return JSON.parse(data);
  } catch {
    return [];
  }
}

/**
 * Get library stats
 */
export async function getLibraryStats(): Promise<{
  totalSongs: number;
  lessonsCompleted: number;
  languagesLearned: string[];
}> {
  const songs = await getSavedSongs();
  const completions = await getLessonCompletions();
  const languages = [...new Set(songs.map((s) => s.targetLanguage))];

  return {
    totalSongs: songs.length,
    lessonsCompleted: completions.length,
    languagesLearned: languages,
  };
}
