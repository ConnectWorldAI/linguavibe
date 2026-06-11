/**
 * Music-Based Language Teaching System
 * 
 * Research Notes (Suno vs ElevenLabs):
 * ─────────────────────────────────────
 * Suno AI: Best for full song generation (vocals + instrumentals). Supports 50+ languages.
 *   - Pros: High quality output, multiple genres, custom lyrics, full songs in 30s
 *   - Cons: Higher cost per generation, limited control over vocal style
 *   - Best for: Generating educational songs matched to lesson vocabulary
 * 
 * ElevenLabs: Best for voice synthesis and text-to-speech with emotion.
 *   - Pros: Voice cloning, multiple accents/dialects, natural prosody, lower latency
 *   - Cons: No music generation (voice only), requires separate instrumental tracks
 *   - Best for: Voice clone singing, pronunciation demos, narrated lyrics
 * 
 * Recommendation: Use Suno for song generation, ElevenLabs for voice features.
 * The app already has Suno wired (Sprint 8). ElevenLabs is used for voice clone.
 * 
 * Music-Based Teaching Methodology:
 * ─────────────────────────────────
 * 1. Vocabulary Extraction: Pull key words from lyrics, tag with CEFR level
 * 2. Grammar from Structure: Identify tenses, conjugations, idioms in song lines
 * 3. Pronunciation Practice: Use song phrases as pronunciation drills
 * 4. Cultural Context: Songs teach slang, idioms, and cultural references
 * 5. Spaced Repetition: Song vocabulary feeds into SRS system
 * 6. Difficulty Matching: Songs tagged by level, vocabulary density, speed
 */
import AsyncStorage from "@react-native-async-storage/async-storage";

const MUSIC_TEACHING_PREFS_KEY = "@connectworld_music_teaching_prefs";
const MUSIC_PROGRESS_KEY = "@connectworld_music_learning_progress";

// ─── TYPES ──────────────────────────────────────────────────────────────────

export type MusicDifficulty = "beginner" | "elementary" | "intermediate" | "upper_intermediate" | "advanced" | "native";
export type MusicGenre = "pop" | "reggaeton" | "ballad" | "hip_hop" | "folk" | "rock" | "jazz" | "children" | "educational";
export type TeachingMode = "vocabulary" | "grammar" | "pronunciation" | "listening" | "culture" | "sing_along";

export interface SongLearningMetadata {
  id: string;
  title: string;
  artist: string;
  language: string;
  dialect?: string; // e.g., "Dominican Spanish", "Brazilian Portuguese"
  genre: MusicGenre;
  difficulty: MusicDifficulty;
  cefrLevel: "A1" | "A2" | "B1" | "B2" | "C1" | "C2";
  bpm: number; // beats per minute (slower = easier to follow)
  durationSeconds: number;
  
  // Teaching metadata
  vocabularyDensity: number; // unique words per minute
  grammarFeatures: string[]; // e.g., ["present tense", "subjunctive", "conditional"]
  culturalReferences: string[]; // e.g., ["Dominican slang", "food references"]
  idioms: string[]; // idiomatic expressions in the song
  
  // Learning content
  keyVocabulary: VocabularyFromLyrics[];
  grammarLessons: GrammarFromSong[];
  pronunciationDrills: PronunciationFromLyrics[];
  
  // Engagement
  isEducational: boolean; // true = generated for teaching, false = real song
  hasKaraokeMode: boolean;
  hasDualSubtitles: boolean; // original + translation
  tags: string[];
}

export interface VocabularyFromLyrics {
  word: string;
  translation: string;
  context: string; // line from the song
  timestamp: number; // seconds into song where word appears
  cefrLevel: string;
  partOfSpeech: "noun" | "verb" | "adjective" | "adverb" | "phrase" | "idiom";
  frequency: "common" | "uncommon" | "rare"; // how often used in daily speech
}

export interface GrammarFromSong {
  id: string;
  lyricLine: string;
  translation: string;
  grammarPoint: string; // e.g., "Present subjunctive"
  explanation: string;
  pattern: string; // e.g., "que + subjunctive"
  examples: string[]; // other examples of same pattern
  exercisePrompt: string; // practice question
}

export interface PronunciationFromLyrics {
  id: string;
  phrase: string;
  phonetic: string; // IPA or simplified phonetic
  timestamp: number; // seconds into song
  difficulty: "easy" | "medium" | "hard";
  focusPhonemes: string[];
  tip: string;
}

export interface MusicLearningProgress {
  songId: string;
  completedModes: TeachingMode[];
  vocabularyMastered: string[]; // word IDs
  grammarCompleted: string[]; // grammar lesson IDs
  pronunciationScore: number; // 0-100
  karaokeHighScore: number; // 0-100
  timesListened: number;
  lastPlayed: number; // timestamp
  isFavorite: boolean;
}

export interface MusicTeachingPreferences {
  preferredGenres: MusicGenre[];
  preferredDifficulty: MusicDifficulty;
  autoPlayTranslation: boolean; // show translation while listening
  vocabularyExtraction: boolean; // auto-extract and quiz vocabulary
  dailySongEnabled: boolean; // daily song recommendation
  focusMode: TeachingMode; // primary learning goal from music
}

// ─── SONG CATALOG (Multi-Language) ──────────────────────────────────────────

export const SONG_CATALOG: SongLearningMetadata[] = [
  // Spanish - Beginner
  {
    id: "es_beg_1", title: "Buenos Días", artist: "AI Teacher", language: "Spanish",
    genre: "children", difficulty: "beginner", cefrLevel: "A1", bpm: 90, durationSeconds: 120,
    vocabularyDensity: 3, grammarFeatures: ["present tense", "greetings"], culturalReferences: ["morning routines"],
    idioms: [], isEducational: true, hasKaraokeMode: true, hasDualSubtitles: true, tags: ["greetings", "daily routine"],
    keyVocabulary: [
      { word: "buenos días", translation: "good morning", context: "Buenos días, ¿cómo estás?", timestamp: 5, cefrLevel: "A1", partOfSpeech: "phrase", frequency: "common" },
      { word: "desayuno", translation: "breakfast", context: "Vamos a tomar el desayuno", timestamp: 20, cefrLevel: "A1", partOfSpeech: "noun", frequency: "common" },
      { word: "feliz", translation: "happy", context: "Estoy feliz hoy", timestamp: 35, cefrLevel: "A1", partOfSpeech: "adjective", frequency: "common" },
    ],
    grammarLessons: [
      { id: "gl1", lyricLine: "Estoy feliz hoy", translation: "I am happy today", grammarPoint: "Ser vs Estar", explanation: "Use 'estar' for temporary states and emotions", pattern: "estar + adjective (emotion)", examples: ["Estoy cansado", "Estoy triste"], exercisePrompt: "How would you say 'I am tired'?" },
    ],
    pronunciationDrills: [
      { id: "pd1", phrase: "Buenos días", phonetic: "BWEH-nos DEE-as", timestamp: 5, difficulty: "easy", focusPhonemes: ["ue", "í"], tip: "The 'ue' diphthong should glide smoothly" },
    ],
  },
  // Spanish - Intermediate (Reggaeton style)
  {
    id: "es_int_1", title: "Bailando en la Ciudad", artist: "ConnectWorld Beats", language: "Spanish",
    dialect: "Dominican Spanish", genre: "reggaeton", difficulty: "intermediate", cefrLevel: "B1", bpm: 95, durationSeconds: 180,
    vocabularyDensity: 6, grammarFeatures: ["present progressive", "reflexive verbs", "informal commands"],
    culturalReferences: ["Dominican slang", "nightlife", "dance culture"], idioms: ["echar pa'lante", "estar en nota"],
    isEducational: true, hasKaraokeMode: true, hasDualSubtitles: true, tags: ["slang", "nightlife", "Dominican"],
    keyVocabulary: [
      { word: "pa'lante", translation: "forward/let's go", context: "Echa pa'lante, no te detengas", timestamp: 15, cefrLevel: "B1", partOfSpeech: "phrase", frequency: "common" },
      { word: "en nota", translation: "in the zone/vibing", context: "Estamos en nota toda la noche", timestamp: 30, cefrLevel: "B1", partOfSpeech: "idiom", frequency: "uncommon" },
      { word: "vacilón", translation: "fun time/party", context: "Este vacilón no para", timestamp: 45, cefrLevel: "B1", partOfSpeech: "noun", frequency: "uncommon" },
    ],
    grammarLessons: [
      { id: "gl2", lyricLine: "Estamos bailando toda la noche", translation: "We are dancing all night", grammarPoint: "Present Progressive", explanation: "estar + gerund (-ando/-iendo) for ongoing actions", pattern: "estar + verb-ando/iendo", examples: ["Estoy comiendo", "Están cantando"], exercisePrompt: "How would you say 'They are singing'?" },
    ],
    pronunciationDrills: [
      { id: "pd2", phrase: "Echa pa'lante", phonetic: "EH-cha pah-LAHN-teh", timestamp: 15, difficulty: "medium", focusPhonemes: ["ch", "contracted 'para'"], tip: "Dominican Spanish often contracts 'para' to 'pa' — practice the quick transition" },
    ],
  },
  // French - Beginner
  {
    id: "fr_beg_1", title: "Bonjour Paris", artist: "AI Teacher", language: "French",
    genre: "pop", difficulty: "beginner", cefrLevel: "A1", bpm: 85, durationSeconds: 130,
    vocabularyDensity: 3, grammarFeatures: ["present tense", "articles", "negation"],
    culturalReferences: ["Paris landmarks", "café culture"], idioms: [],
    isEducational: true, hasKaraokeMode: true, hasDualSubtitles: true, tags: ["Paris", "greetings", "café"],
    keyVocabulary: [
      { word: "bonjour", translation: "hello/good day", context: "Bonjour Paris, je suis là", timestamp: 5, cefrLevel: "A1", partOfSpeech: "phrase", frequency: "common" },
      { word: "croissant", translation: "croissant", context: "Un croissant et un café", timestamp: 25, cefrLevel: "A1", partOfSpeech: "noun", frequency: "common" },
      { word: "merci", translation: "thank you", context: "Merci beaucoup, monsieur", timestamp: 40, cefrLevel: "A1", partOfSpeech: "phrase", frequency: "common" },
    ],
    grammarLessons: [
      { id: "gl3", lyricLine: "Je ne suis pas fatigué", translation: "I am not tired", grammarPoint: "Negation with ne...pas", explanation: "French negation wraps around the verb: ne + verb + pas", pattern: "ne + verb + pas", examples: ["Je ne parle pas", "Il ne mange pas"], exercisePrompt: "How would you say 'He does not eat'?" },
    ],
    pronunciationDrills: [
      { id: "pd3", phrase: "Bonjour", phonetic: "bohn-ZHOOR", timestamp: 5, difficulty: "easy", focusPhonemes: ["on (nasal)", "ou", "r (uvular)"], tip: "The 'on' is nasal — don't pronounce the 'n'. The 'r' is in the throat." },
    ],
  },
  // Japanese - Beginner
  {
    id: "ja_beg_1", title: "はじめまして (Hajimemashite)", artist: "AI Teacher", language: "Japanese",
    genre: "pop", difficulty: "beginner", cefrLevel: "A1", bpm: 80, durationSeconds: 140,
    vocabularyDensity: 2, grammarFeatures: ["desu/masu form", "particles は/が"],
    culturalReferences: ["self-introduction", "bowing culture"], idioms: [],
    isEducational: true, hasKaraokeMode: true, hasDualSubtitles: true, tags: ["introduction", "polite form"],
    keyVocabulary: [
      { word: "はじめまして", translation: "nice to meet you", context: "はじめまして、私は...", timestamp: 5, cefrLevel: "A1", partOfSpeech: "phrase", frequency: "common" },
      { word: "名前", translation: "name", context: "私の名前は...", timestamp: 20, cefrLevel: "A1", partOfSpeech: "noun", frequency: "common" },
      { word: "よろしく", translation: "pleased to meet you", context: "よろしくお願いします", timestamp: 50, cefrLevel: "A1", partOfSpeech: "phrase", frequency: "common" },
    ],
    grammarLessons: [
      { id: "gl4", lyricLine: "私は学生です", translation: "I am a student", grammarPoint: "Topic marker は (wa)", explanation: "は marks the topic of the sentence — what you're talking about", pattern: "[topic] は [description] です", examples: ["彼は先生です", "これは本です"], exercisePrompt: "How would you say 'This is a book'?" },
    ],
    pronunciationDrills: [
      { id: "pd4", phrase: "よろしくお願いします", phonetic: "yo-ro-shi-ku o-ne-gai-shi-ma-su", timestamp: 50, difficulty: "medium", focusPhonemes: ["r (tap)", "shi", "long vowels"], tip: "Japanese 'r' is a quick tongue tap, not an English R or L" },
    ],
  },
  // Korean - Beginner
  {
    id: "ko_beg_1", title: "안녕하세요 (Annyeonghaseyo)", artist: "AI Teacher", language: "Korean",
    genre: "pop", difficulty: "beginner", cefrLevel: "A1", bpm: 88, durationSeconds: 125,
    vocabularyDensity: 2, grammarFeatures: ["formal speech level", "subject particles"],
    culturalReferences: ["Korean greetings", "age hierarchy"], idioms: [],
    isEducational: true, hasKaraokeMode: true, hasDualSubtitles: true, tags: ["greetings", "formal speech"],
    keyVocabulary: [
      { word: "안녕하세요", translation: "hello (formal)", context: "안녕하세요, 저는...", timestamp: 5, cefrLevel: "A1", partOfSpeech: "phrase", frequency: "common" },
      { word: "감사합니다", translation: "thank you (formal)", context: "감사합니다, 선생님", timestamp: 30, cefrLevel: "A1", partOfSpeech: "phrase", frequency: "common" },
    ],
    grammarLessons: [
      { id: "gl5", lyricLine: "저는 학생입니다", translation: "I am a student", grammarPoint: "Formal declarative -입니다", explanation: "Add -입니다 to nouns for formal 'is/am/are'", pattern: "[noun]-입니다", examples: ["선생님입니다", "한국 사람입니다"], exercisePrompt: "How would you say 'I am Korean' formally?" },
    ],
    pronunciationDrills: [
      { id: "pd5", phrase: "안녕하세요", phonetic: "ahn-nyeong-ha-se-yo", timestamp: 5, difficulty: "easy", focusPhonemes: ["ㅎ aspiration", "ㅕ vowel"], tip: "The ㅎ (h) should be clearly aspirated — breathe out" },
    ],
  },
  // Arabic - Beginner
  {
    id: "ar_beg_1", title: "مرحبا (Marhaba)", artist: "AI Teacher", language: "Arabic",
    dialect: "Egyptian Arabic", genre: "folk", difficulty: "beginner", cefrLevel: "A1", bpm: 75, durationSeconds: 135,
    vocabularyDensity: 2, grammarFeatures: ["basic greetings", "gender agreement"],
    culturalReferences: ["Egyptian hospitality", "tea culture"], idioms: [],
    isEducational: true, hasKaraokeMode: true, hasDualSubtitles: true, tags: ["greetings", "Egyptian"],
    keyVocabulary: [
      { word: "مرحبا", translation: "hello", context: "مرحبا يا صديقي", timestamp: 5, cefrLevel: "A1", partOfSpeech: "phrase", frequency: "common" },
      { word: "شكرا", translation: "thank you", context: "شكرا جزيلا", timestamp: 25, cefrLevel: "A1", partOfSpeech: "phrase", frequency: "common" },
    ],
    grammarLessons: [
      { id: "gl6", lyricLine: "أنا سعيد/سعيدة", translation: "I am happy (m/f)", grammarPoint: "Gender Agreement", explanation: "Arabic adjectives change form based on the speaker's gender", pattern: "adjective + ة for feminine", examples: ["كبير/كبيرة", "جميل/جميلة"], exercisePrompt: "How would a woman say 'I am beautiful'?" },
    ],
    pronunciationDrills: [
      { id: "pd6", phrase: "مرحبا", phonetic: "mar-HA-ba", timestamp: 5, difficulty: "easy", focusPhonemes: ["ح (pharyngeal)", "ب"], tip: "The ح is a breathy H from deep in the throat — not like English H" },
    ],
  },
  // Portuguese - Intermediate
  {
    id: "pt_int_1", title: "Saudade do Brasil", artist: "ConnectWorld Beats", language: "Portuguese",
    dialect: "Brazilian Portuguese", genre: "ballad", difficulty: "intermediate", cefrLevel: "B1", bpm: 72, durationSeconds: 200,
    vocabularyDensity: 5, grammarFeatures: ["subjunctive", "personal infinitive", "diminutives"],
    culturalReferences: ["saudade concept", "Brazilian music", "carnival"], idioms: ["matar saudade", "ficar de boa"],
    isEducational: true, hasKaraokeMode: true, hasDualSubtitles: true, tags: ["saudade", "emotions", "Brazilian"],
    keyVocabulary: [
      { word: "saudade", translation: "longing/nostalgia (untranslatable)", context: "Sinto saudade de você", timestamp: 10, cefrLevel: "B1", partOfSpeech: "noun", frequency: "common" },
      { word: "matar saudade", translation: "to satisfy longing", context: "Vou matar saudade", timestamp: 30, cefrLevel: "B1", partOfSpeech: "idiom", frequency: "uncommon" },
    ],
    grammarLessons: [
      { id: "gl7", lyricLine: "Espero que você volte", translation: "I hope you come back", grammarPoint: "Present Subjunctive", explanation: "Use subjunctive after 'esperar que' for wishes/hopes", pattern: "esperar que + subjunctive", examples: ["Espero que ela venha", "Quero que eles saibam"], exercisePrompt: "How would you say 'I hope she comes'?" },
    ],
    pronunciationDrills: [
      { id: "pd7", phrase: "Saudade", phonetic: "saw-DAH-jee", timestamp: 10, difficulty: "medium", focusPhonemes: ["au diphthong", "de → jee (Brazilian)"], tip: "In Brazilian Portuguese, 'de' at end of words sounds like 'jee'" },
    ],
  },
];

// ─── DIFFICULTY MATCHING ────────────────────────────────────────────────────

/**
 * Get songs matched to user's current learning level
 */
export function getSongsForLevel(
  userLevel: string,
  language?: string,
  genre?: MusicGenre
): SongLearningMetadata[] {
  const levelMap: Record<string, MusicDifficulty[]> = {
    A1: ["beginner"],
    A2: ["beginner", "elementary"],
    B1: ["elementary", "intermediate"],
    B2: ["intermediate", "upper_intermediate"],
    C1: ["upper_intermediate", "advanced"],
    C2: ["advanced", "native"],
  };
  
  const allowedDifficulties = levelMap[userLevel] || ["beginner", "elementary"];
  
  return SONG_CATALOG.filter((song) => {
    const difficultyMatch = allowedDifficulties.includes(song.difficulty);
    const languageMatch = !language || song.language === language;
    const genreMatch = !genre || song.genre === genre;
    return difficultyMatch && languageMatch && genreMatch;
  });
}

/**
 * Get a daily song recommendation based on user's progress and preferences
 */
export function getDailySongRecommendation(
  userLevel: string,
  language: string,
  completedSongIds: string[],
  preferredGenres: MusicGenre[] = []
): SongLearningMetadata | null {
  const available = getSongsForLevel(userLevel, language)
    .filter((s) => !completedSongIds.includes(s.id));
  
  if (available.length === 0) return null;
  
  // Prefer user's genre preferences
  if (preferredGenres.length > 0) {
    const preferred = available.filter((s) => preferredGenres.includes(s.genre));
    if (preferred.length > 0) return preferred[Math.floor(Math.random() * preferred.length)];
  }
  
  return available[Math.floor(Math.random() * available.length)];
}

/**
 * Extract vocabulary quiz from a song's metadata
 */
export function generateVocabularyQuiz(song: SongLearningMetadata): {
  question: string;
  options: string[];
  correctAnswer: string;
  context: string;
}[] {
  return song.keyVocabulary.map((vocab) => {
    const wrongAnswers = SONG_CATALOG
      .flatMap((s) => s.keyVocabulary)
      .filter((v) => v.word !== vocab.word && v.partOfSpeech === vocab.partOfSpeech)
      .slice(0, 3)
      .map((v) => v.translation);
    
    const options = [vocab.translation, ...wrongAnswers].sort(() => Math.random() - 0.5);
    
    return {
      question: `What does "${vocab.word}" mean?`,
      options: options.slice(0, 4),
      correctAnswer: vocab.translation,
      context: vocab.context,
    };
  });
}

/**
 * Get grammar exercises from song lyrics
 */
export function getGrammarExercisesFromSong(song: SongLearningMetadata): GrammarFromSong[] {
  return song.grammarLessons;
}

/**
 * Calculate song difficulty score (0-100) based on multiple factors
 */
export function calculateDifficultyScore(song: SongLearningMetadata): number {
  let score = 0;
  
  // BPM factor (faster = harder)
  if (song.bpm > 120) score += 25;
  else if (song.bpm > 100) score += 15;
  else if (song.bpm > 80) score += 10;
  else score += 5;
  
  // Vocabulary density
  if (song.vocabularyDensity > 8) score += 25;
  else if (song.vocabularyDensity > 5) score += 15;
  else score += 5;
  
  // Grammar complexity
  score += Math.min(30, song.grammarFeatures.length * 10);
  
  // Idioms/slang
  score += Math.min(20, song.idioms.length * 7);
  
  return Math.min(100, score);
}

// ─── PROGRESS TRACKING ──────────────────────────────────────────────────────

/**
 * Save music learning progress
 */
export async function saveMusicProgress(progress: MusicLearningProgress): Promise<void> {
  try {
    const stored = await AsyncStorage.getItem(MUSIC_PROGRESS_KEY);
    const allProgress: MusicLearningProgress[] = stored ? JSON.parse(stored) : [];
    const idx = allProgress.findIndex((p) => p.songId === progress.songId);
    if (idx >= 0) allProgress[idx] = progress;
    else allProgress.push(progress);
    await AsyncStorage.setItem(MUSIC_PROGRESS_KEY, JSON.stringify(allProgress));
  } catch {}
}

/**
 * Load music learning progress for a song
 */
export async function getMusicProgress(songId: string): Promise<MusicLearningProgress | null> {
  try {
    const stored = await AsyncStorage.getItem(MUSIC_PROGRESS_KEY);
    const allProgress: MusicLearningProgress[] = stored ? JSON.parse(stored) : [];
    return allProgress.find((p) => p.songId === songId) || null;
  } catch {
    return null;
  }
}

/**
 * Get all music learning progress
 */
export async function getAllMusicProgress(): Promise<MusicLearningProgress[]> {
  try {
    const stored = await AsyncStorage.getItem(MUSIC_PROGRESS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

/**
 * Save music teaching preferences
 */
export async function saveMusicTeachingPrefs(prefs: MusicTeachingPreferences): Promise<void> {
  await AsyncStorage.setItem(MUSIC_TEACHING_PREFS_KEY, JSON.stringify(prefs));
}

/**
 * Load music teaching preferences
 */
export async function loadMusicTeachingPrefs(): Promise<MusicTeachingPreferences> {
  try {
    const stored = await AsyncStorage.getItem(MUSIC_TEACHING_PREFS_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  return {
    preferredGenres: ["pop", "reggaeton"],
    preferredDifficulty: "intermediate",
    autoPlayTranslation: true,
    vocabularyExtraction: true,
    dailySongEnabled: true,
    focusMode: "vocabulary",
  };
}

/**
 * Get supported languages for music-based teaching
 */
export function getSupportedMusicLanguages(): { language: string; songCount: number; dialects: string[] }[] {
  const languageMap = new Map<string, { count: number; dialects: Set<string> }>();
  
  SONG_CATALOG.forEach((song) => {
    if (!languageMap.has(song.language)) {
      languageMap.set(song.language, { count: 0, dialects: new Set() });
    }
    const entry = languageMap.get(song.language)!;
    entry.count++;
    if (song.dialect) entry.dialects.add(song.dialect);
  });
  
  return Array.from(languageMap.entries()).map(([language, data]) => ({
    language,
    songCount: data.count,
    dialects: Array.from(data.dialects),
  }));
}

/**
 * Get songs that teach specific vocabulary or grammar
 */
export function findSongsTeaching(target: string, type: "vocabulary" | "grammar"): SongLearningMetadata[] {
  if (type === "vocabulary") {
    return SONG_CATALOG.filter((s) => 
      s.keyVocabulary.some((v) => v.word.toLowerCase().includes(target.toLowerCase()) || v.translation.toLowerCase().includes(target.toLowerCase()))
    );
  }
  return SONG_CATALOG.filter((s) => 
    s.grammarFeatures.some((g) => g.toLowerCase().includes(target.toLowerCase()))
  );
}
