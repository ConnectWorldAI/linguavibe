import AsyncStorage from "@react-native-async-storage/async-storage";

export interface ArtistEntry {
  name: string;
  genre: string;
  addedAt: string;
  playCount: number;
  source: "onboarding" | "stem_separator" | "upload" | "url_paste" | "manual";
}

export interface SongEntry {
  title: string;
  artist: string;
  genre: string;
  mood: string;
  addedAt: string;
  source: "onboarding" | "stem_separator" | "upload" | "url_paste" | "manual";
}

export interface ActivitySignal {
  type: "stem_process" | "song_upload" | "url_paste" | "song_play" | "song_skip" | "song_favorite" | "lesson_complete" | "lesson_skip";
  data: Record<string, string>;
  timestamp: string;
}

export interface TasteProfile {
  topArtists: ArtistEntry[];
  topSongs: SongEntry[];
  preferredGenres: string[];
  preferredMoods: string[];
  preferredTempos: string[];
  vocalPreferences: string[];
  targetLanguage: string;
  currentLevel: "beginner" | "intermediate" | "advanced";
  activitySignals: ActivitySignal[];
  dataCollectionConsent: boolean;
  onboardingComplete: boolean;
  lastUpdated: string;
}

const TASTE_PROFILE_KEY = "@connectme_taste_profile";
const CONSENT_KEY = "@connectme_taste_consent";

const DEFAULT_PROFILE: TasteProfile = {
  topArtists: [],
  topSongs: [],
  preferredGenres: [],
  preferredMoods: [],
  preferredTempos: [],
  vocalPreferences: [],
  targetLanguage: "spanish",
  currentLevel: "beginner",
  activitySignals: [],
  dataCollectionConsent: true,
  onboardingComplete: false,
  lastUpdated: new Date().toISOString(),
};

export async function getTasteProfile(): Promise<TasteProfile> {
  try {
    const stored = await AsyncStorage.getItem(TASTE_PROFILE_KEY);
    if (stored) return JSON.parse(stored);
    return { ...DEFAULT_PROFILE };
  } catch {
    return { ...DEFAULT_PROFILE };
  }
}

export async function saveTasteProfile(profile: TasteProfile): Promise<void> {
  profile.lastUpdated = new Date().toISOString();
  await AsyncStorage.setItem(TASTE_PROFILE_KEY, JSON.stringify(profile));
}

export async function clearTasteProfile(): Promise<void> {
  await AsyncStorage.removeItem(TASTE_PROFILE_KEY);
}

export async function getDataCollectionConsent(): Promise<boolean> {
  try {
    const val = await AsyncStorage.getItem(CONSENT_KEY);
    return val !== "false";
  } catch {
    return true;
  }
}

export async function setDataCollectionConsent(consent: boolean): Promise<void> {
  await AsyncStorage.setItem(CONSENT_KEY, consent ? "true" : "false");
  const profile = await getTasteProfile();
  profile.dataCollectionConsent = consent;
  await saveTasteProfile(profile);
}

export async function recordArtist(artist: ArtistEntry): Promise<void> {
  const consent = await getDataCollectionConsent();
  if (!consent) return;
  const profile = await getTasteProfile();
  const existing = profile.topArtists.find(a => a.name.toLowerCase() === artist.name.toLowerCase());
  if (existing) {
    existing.playCount += 1;
  } else {
    profile.topArtists.push(artist);
    if (profile.topArtists.length > 20) {
      profile.topArtists.sort((a, b) => b.playCount - a.playCount);
      profile.topArtists = profile.topArtists.slice(0, 20);
    }
  }
  await saveTasteProfile(profile);
}

export async function recordSong(song: SongEntry): Promise<void> {
  const consent = await getDataCollectionConsent();
  if (!consent) return;
  const profile = await getTasteProfile();
  const exists = profile.topSongs.some(s => s.title.toLowerCase() === song.title.toLowerCase() && s.artist.toLowerCase() === song.artist.toLowerCase());
  if (!exists) {
    profile.topSongs.push(song);
    if (profile.topSongs.length > 20) profile.topSongs = profile.topSongs.slice(-20);
  }
  await saveTasteProfile(profile);
}

export async function recordSignal(signal: ActivitySignal): Promise<void> {
  const consent = await getDataCollectionConsent();
  if (!consent) return;
  const profile = await getTasteProfile();
  profile.activitySignals.push(signal);
  if (profile.activitySignals.length > 100) profile.activitySignals = profile.activitySignals.slice(-100);
  await saveTasteProfile(profile);
}

export async function recordStemSeparation(songTitle: string, artist: string, genre: string): Promise<void> {
  await recordArtist({ name: artist, genre, addedAt: new Date().toISOString(), playCount: 1, source: "stem_separator" });
  await recordSong({ title: songTitle, artist, genre, mood: "unknown", addedAt: new Date().toISOString(), source: "stem_separator" });
  await recordSignal({ type: "stem_process", data: { songTitle, artist, genre }, timestamp: new Date().toISOString() });
}

export async function recordUrlPaste(url: string, artist: string, title: string): Promise<void> {
  await recordSignal({ type: "url_paste", data: { url, artist, title }, timestamp: new Date().toISOString() });
  if (artist) await recordArtist({ name: artist, genre: "unknown", addedAt: new Date().toISOString(), playCount: 1, source: "url_paste" });
}

export function buildTasteSummary(profile: TasteProfile): string {
  const artists = profile.topArtists.sort((a, b) => b.playCount - a.playCount).slice(0, 10).map(a => `${a.name} (${a.genre})`).join(", ");
  const songs = profile.topSongs.slice(-10).map(s => `"${s.title}" by ${s.artist}`).join(", ");
  const genres = profile.preferredGenres.join(", ") || "not specified";
  const moods = profile.preferredMoods.join(", ") || "not specified";
  const tempos = profile.preferredTempos.join(", ") || "not specified";
  const vocals = profile.vocalPreferences.join(", ") || "not specified";
  return `User Music Taste Profile:\n- Top Artists: ${artists || "none yet"}\n- Recent Songs: ${songs || "none yet"}\n- Preferred Genres: ${genres}\n- Preferred Moods: ${moods}\n- Preferred Tempos: ${tempos}\n- Vocal Preferences: ${vocals}\n- Target Language: ${profile.targetLanguage}\n- Current Level: ${profile.currentLevel}`;
}
