/**
 * Music Vocabulary Lesson Generator
 * 
 * Generates vocabulary lessons inspired by trending/viral songs.
 * Uses the viral music tracker data to create engaging lessons
 * that teach language through music people are already listening to.
 * 
 * Strategy: If a song is viral, people WANT to understand the lyrics.
 * We turn that desire into structured vocabulary lessons.
 */

import { type TrendingMusicItem, type ViralMusicGenre } from "./viral-music-tracker";
import { getMusicalVocabulary } from "./cultural-music-styles";

// ─── TYPES ──────────────────────────────────────────────────────────────────

export interface MusicVocabLesson {
  id: string;
  /** Lesson title (e.g., "Dembow Vocabulary: El Alfa Edition") */
  title: string;
  /** Short description */
  description: string;
  /** Target language */
  language: string;
  /** Dialect/region */
  dialect: string;
  /** Source song that inspired this lesson */
  sourceSong: {
    title: string;
    artist: string;
    genre: ViralMusicGenre;
  };
  /** Vocabulary items organized by category */
  sections: MusicVocabSection[];
  /** Difficulty level */
  difficulty: "beginner" | "intermediate" | "advanced";
  /** Estimated completion time in minutes */
  estimatedMinutes: number;
  /** Tags for discovery */
  tags: string[];
  /** Cultural notes about the genre/artist */
  culturalNotes: string;
}

export interface MusicVocabSection {
  title: string;
  icon: string;
  items: MusicVocabItem[];
}

export interface MusicVocabItem {
  /** Word or phrase in target language */
  original: string;
  /** Pronunciation guide */
  pronunciation: string;
  /** English translation */
  translation: string;
  /** Example sentence using the word */
  example: string;
  /** Example translation */
  exampleTranslation: string;
  /** Usage context (formal/informal/slang) */
  register: "formal" | "informal" | "slang" | "vulgar";
  /** Whether this word appears in the actual song lyrics */
  fromLyrics: boolean;
  /** Cultural note about usage */
  note?: string;
}

// ─── GENRE-SPECIFIC VOCABULARY BANKS ────────────────────────────────────────

const GENRE_VOCAB_BANKS: Partial<Record<ViralMusicGenre, { language: string; words: Omit<MusicVocabItem, "fromLyrics">[] }[]>> = {
  dembow: [
    {
      language: "Spanish",
      words: [
        { original: "prende", pronunciation: "PREN-deh", translation: "light it up / get hype", example: "¡Prende la fiesta!", exampleTranslation: "Light up the party!", register: "slang", note: "Dominican party starter phrase" },
        { original: "bellaqueo", pronunciation: "beh-yah-KEH-oh", translation: "grinding / sensual dancing", example: "El bellaqueo está duro", exampleTranslation: "The grinding is intense", register: "slang", note: "Central to dembow culture" },
        { original: "dembow", pronunciation: "dem-BOW", translation: "the beat / the genre", example: "Pon el dembow", exampleTranslation: "Put on the dembow", register: "informal", note: "From Jamaican dancehall riddim" },
        { original: "perreo", pronunciation: "peh-REH-oh", translation: "reggaeton dancing", example: "Vamos al perreo", exampleTranslation: "Let's go dance", register: "slang", note: "From 'perro' (dog) - the dance style" },
        { original: "flow", pronunciation: "flow", translation: "style / swagger", example: "Tiene un flow diferente", exampleTranslation: "He has a different flow", register: "informal", note: "Borrowed from English hip-hop" },
        { original: "tiguere", pronunciation: "tee-GEH-reh", translation: "street-smart person", example: "Ese tipo es un tiguere", exampleTranslation: "That guy is street-smart", register: "slang", note: "Dominican slang, from 'tigre'" },
        { original: "janguear", pronunciation: "han-GEH-ar", translation: "to hang out", example: "Vamos a janguear", exampleTranslation: "Let's hang out", register: "slang", note: "From English 'hang'" },
        { original: "vacilón", pronunciation: "bah-see-LON", translation: "a good time / fun", example: "Esto es un vacilón", exampleTranslation: "This is a blast", register: "informal" },
      ],
    },
  ],
  reggaeton: [
    {
      language: "Spanish",
      words: [
        { original: "gata", pronunciation: "GAH-tah", translation: "girl / attractive woman", example: "Esa gata tiene style", exampleTranslation: "That girl has style", register: "slang", note: "Common in reggaeton lyrics" },
        { original: "bichiyal", pronunciation: "bee-chee-YAL", translation: "independent woman", example: "Ella es una bichiyal", exampleTranslation: "She's an independent woman", register: "slang", note: "Popularized by Bad Bunny" },
        { original: "cabrón", pronunciation: "kah-BRON", translation: "dude / badass (context-dependent)", example: "Ese cabrón es loco", exampleTranslation: "That dude is crazy", register: "vulgar", note: "Can be affectionate or offensive depending on tone" },
        { original: "prender", pronunciation: "pren-DER", translation: "to turn on / to light up", example: "Vamos a prender la noche", exampleTranslation: "Let's light up the night", register: "informal" },
        { original: "sandungueo", pronunciation: "san-doon-GEH-oh", translation: "sensual rhythm/dance", example: "El sandungueo no para", exampleTranslation: "The rhythm doesn't stop", register: "slang", note: "Puerto Rican origin" },
        { original: "bichote", pronunciation: "bee-CHO-teh", translation: "boss / big shot", example: "Él se cree bichote", exampleTranslation: "He thinks he's a big shot", register: "slang", note: "From drug culture, now mainstream" },
        { original: "bebecita", pronunciation: "beh-beh-SEE-tah", translation: "baby girl / babe", example: "Ven acá, bebecita", exampleTranslation: "Come here, baby girl", register: "informal" },
        { original: "perrear", pronunciation: "peh-reh-AR", translation: "to dance reggaeton", example: "Vamos a perrear hasta abajo", exampleTranslation: "Let's dance all the way down", register: "slang" },
      ],
    },
  ],
  corridos: [
    {
      language: "Spanish",
      words: [
        { original: "compa", pronunciation: "COM-pah", translation: "buddy / friend", example: "¿Qué onda, compa?", exampleTranslation: "What's up, buddy?", register: "informal", note: "Short for 'compadre'" },
        { original: "tumbado", pronunciation: "toom-BAH-doh", translation: "laid back / relaxed", example: "Ando bien tumbado", exampleTranslation: "I'm feeling laid back", register: "slang", note: "Defines the 'corridos tumbados' subgenre" },
        { original: "rancho", pronunciation: "RAN-cho", translation: "ranch / hometown", example: "Extraño mi rancho", exampleTranslation: "I miss my hometown", register: "informal" },
        { original: "fierro", pronunciation: "fee-EH-roh", translation: "let's go! / iron (weapon)", example: "¡Fierro, pariente!", exampleTranslation: "Let's go, cousin!", register: "slang", note: "Northern Mexican expression" },
        { original: "pariente", pronunciation: "pah-ree-EN-teh", translation: "relative / close friend", example: "Ese es mi pariente", exampleTranslation: "That's my close friend", register: "informal", note: "Used loosely for any close person" },
        { original: "buchón", pronunciation: "boo-CHON", translation: "flashy narco style", example: "Se viste bien buchón", exampleTranslation: "He dresses flashy narco style", register: "slang", note: "Sinaloa culture reference" },
      ],
    },
  ],
  kpop: [
    {
      language: "Korean",
      words: [
        { original: "대박", pronunciation: "dae-bak", translation: "amazing / jackpot", example: "이 노래 대박이야!", exampleTranslation: "This song is amazing!", register: "informal" },
        { original: "파이팅", pronunciation: "pa-i-ting", translation: "fighting! / you can do it!", example: "시험 파이팅!", exampleTranslation: "Good luck on the exam!", register: "informal", note: "Borrowed from English, uniquely Korean usage" },
        { original: "최애", pronunciation: "choe-ae", translation: "bias / favorite (idol)", example: "내 최애는 지민이야", exampleTranslation: "My bias is Jimin", register: "informal", note: "Fan culture term" },
        { original: "떡상", pronunciation: "tteok-sang", translation: "sudden rise / blow up", example: "이 그룹 떡상했어", exampleTranslation: "This group blew up", register: "slang", note: "Originally stock market term" },
        { original: "덕질", pronunciation: "deok-jil", translation: "fangirling/fanboying", example: "요즘 덕질 중이야", exampleTranslation: "I'm fangirling these days", register: "informal" },
        { original: "컴백", pronunciation: "keom-baek", translation: "comeback / new release", example: "다음 주 컴백이래!", exampleTranslation: "They're having a comeback next week!", register: "informal", note: "K-pop industry term for new music release" },
      ],
    },
  ],
  jpop: [
    {
      language: "Japanese",
      words: [
        { original: "推し", pronunciation: "o-shi", translation: "favorite / bias", example: "推しが尊い", exampleTranslation: "My bias is precious", register: "informal", note: "Otaku/fan culture term" },
        { original: "エモい", pronunciation: "e-mo-i", translation: "emotional / moving", example: "この曲エモい", exampleTranslation: "This song is so emotional", register: "slang", note: "From English 'emotional'" },
        { original: "神曲", pronunciation: "kami-kyoku", translation: "god-tier song", example: "これ神曲だわ", exampleTranslation: "This is a god-tier song", register: "slang" },
        { original: "沼る", pronunciation: "numa-ru", translation: "to fall deep into (a fandom)", example: "完全に沼った", exampleTranslation: "I've completely fallen in", register: "slang", note: "From 'swamp' - you sink in" },
        { original: "バズる", pronunciation: "bazu-ru", translation: "to go viral", example: "この動画バズってる", exampleTranslation: "This video is going viral", register: "slang", note: "From English 'buzz'" },
      ],
    },
  ],
  funk_carioca: [
    {
      language: "Portuguese",
      words: [
        { original: "baile", pronunciation: "BAI-lee", translation: "party / dance event", example: "Vamos pro baile!", exampleTranslation: "Let's go to the party!", register: "informal", note: "Central to funk carioca culture" },
        { original: "passinho", pronunciation: "pah-SEE-nyoh", translation: "dance step", example: "Manda o passinho!", exampleTranslation: "Show us the dance step!", register: "informal" },
        { original: "mandelão", pronunciation: "man-deh-LOWN", translation: "heavy bass beat", example: "Esse mandelão é pesado", exampleTranslation: "This beat is heavy", register: "slang" },
        { original: "cria", pronunciation: "CREE-ah", translation: "local / from the community", example: "Ele é cria da favela", exampleTranslation: "He's from the favela", register: "slang", note: "Term of pride for community origin" },
        { original: "bonde", pronunciation: "BON-jee", translation: "crew / squad", example: "O bonde chegou!", exampleTranslation: "The squad has arrived!", register: "slang" },
      ],
    },
  ],
};

// ─── LESSON GENERATION ──────────────────────────────────────────────────────

/**
 * Generate a music vocabulary lesson from a trending song.
 * Combines genre-specific vocabulary with cultural music terms.
 */
export function generateMusicVocabLesson(song: TrendingMusicItem): MusicVocabLesson {
  const genreBank = GENRE_VOCAB_BANKS[song.genre]?.find(
    (bank) => bank.language === song.language
  );

  const musicalVocab = getMusicalVocabulary(song.language);

  // Build sections
  const sections: MusicVocabSection[] = [];

  // Section 1: From the lyrics (genre-specific slang)
  if (genreBank && genreBank.words.length > 0) {
    sections.push({
      title: `${formatGenreName(song.genre)} Vocabulary`,
      icon: "musical-notes",
      items: genreBank.words.slice(0, 6).map((w) => ({ ...w, fromLyrics: true })),
    });
  }

  // Section 2: Musical terms in the target language
  if (musicalVocab.length > 0) {
    sections.push({
      title: "Musical Terms",
      icon: "headset",
      items: musicalVocab.slice(0, 5).map((term: any) => ({
        original: term.term,
        pronunciation: "",
        translation: term.translation,
        example: term.context,
        exampleTranslation: "",
        register: "informal" as const,
        fromLyrics: false,
        note: `Used in ${song.language} music culture`,
      })),
    });
  }

  // Section 3: Cultural context words
  sections.push({
    title: "Cultural Context",
    icon: "globe",
    items: getCulturalContextWords(song.language, song.dialect),
  });

  const difficulty = getDifficulty(song.genre);

  return {
    id: `music_vocab_${song.id}`,
    title: `${formatGenreName(song.genre)} Vocab: ${song.artist}`,
    description: `Learn real ${song.language} through "${song.title}" by ${song.artist}. ${song.trendingReason}`,
    language: song.language,
    dialect: song.dialect,
    sourceSong: {
      title: song.title,
      artist: song.artist,
      genre: song.genre,
    },
    sections,
    difficulty,
    estimatedMinutes: sections.reduce((acc, s) => acc + s.items.length * 2, 0),
    tags: [...song.tags, "music", "vocabulary", song.genre],
    culturalNotes: getCulturalNote(song.genre, song.dialect),
  };
}

/**
 * Generate multiple lessons from a list of trending songs.
 */
export function generateMusicVocabLessons(songs: TrendingMusicItem[]): MusicVocabLesson[] {
  return songs.map(generateMusicVocabLesson);
}

/**
 * Get all available genre vocabulary for a language.
 * Useful for the admin panel or content review.
 */
export function getAvailableGenresForLanguage(language: string): ViralMusicGenre[] {
  const genres: ViralMusicGenre[] = [];
  for (const [genre, banks] of Object.entries(GENRE_VOCAB_BANKS)) {
    if (banks?.some((b) => b.language === language)) {
      genres.push(genre as ViralMusicGenre);
    }
  }
  return genres;
}

// ─── HELPERS ────────────────────────────────────────────────────────────────

function formatGenreName(genre: ViralMusicGenre): string {
  const names: Record<ViralMusicGenre, string> = {
    dembow: "Dembow",
    reggaeton: "Reggaeton",
    salsa: "Salsa",
    bachata: "Bachata",
    corridos: "Corridos Tumbados",
    cumbia: "Cumbia",
    trap_latino: "Trap Latino",
    kpop: "K-Pop",
    jpop: "J-Pop",
    cpop: "C-Pop",
    afrobeats: "Afrobeats",
    amapiano: "Amapiano",
    french_rap: "French Rap",
    german_rap: "German Rap",
    italian_pop: "Italian Pop",
    fado: "Fado",
    bossa_nova: "Bossa Nova",
    funk_carioca: "Funk Carioca",
    arabic_pop: "Arabic Pop",
    turkish_pop: "Turkish Pop",
    russian_pop: "Russian Pop",
    classical: "Classical",
    flamenco: "Flamenco",
    other: "Music",
  };
  return names[genre] || "Music";
}

function getDifficulty(genre: ViralMusicGenre): "beginner" | "intermediate" | "advanced" {
  const advanced: ViralMusicGenre[] = ["dembow", "corridos", "funk_carioca"];
  const beginner: ViralMusicGenre[] = ["classical", "bossa_nova", "italian_pop"];
  if (advanced.includes(genre)) return "advanced";
  if (beginner.includes(genre)) return "beginner";
  return "intermediate";
}

function getCulturalNote(genre: ViralMusicGenre, dialect: string): string {
  const notes: Partial<Record<ViralMusicGenre, string>> = {
    dembow: `Dembow originated in the Dominican Republic, evolving from Jamaican dancehall. The ${dialect} style is characterized by rapid-fire lyrics, heavy bass, and party culture. Understanding dembow vocabulary gives you access to Dominican street culture and nightlife language.`,
    reggaeton: `Reggaeton emerged from Puerto Rico in the 1990s, blending Latin rhythms with hip-hop. ${dialect} reggaeton has its own slang and cultural references. This vocabulary is essential for understanding modern Latin American youth culture.`,
    corridos: `Corridos tumbados are a modern evolution of traditional Mexican corridos, blending regional Mexican music with trap and hip-hop. The ${dialect} style reflects northern Mexican culture, ranch life, and contemporary youth identity.`,
    kpop: `K-Pop has created an entire vocabulary ecosystem around fan culture, idol relationships, and music industry terms. These words are essential for participating in Korean pop culture conversations.`,
    jpop: `J-Pop vocabulary intersects heavily with anime, otaku culture, and internet slang. Many terms have been adopted from English but given uniquely Japanese meanings and usage patterns.`,
    funk_carioca: `Funk carioca (or baile funk) is the sound of Rio de Janeiro's favelas. The vocabulary reflects community pride, dance culture, and the creative energy of Brazil's urban youth.`,
  };
  return notes[genre] || `This genre represents an important part of ${dialect} music culture. Learning its vocabulary connects you to authentic cultural expression.`;
}

function getCulturalContextWords(language: string, dialect: string): MusicVocabItem[] {
  const contextWords: Record<string, MusicVocabItem[]> = {
    "Spanish": [
      { original: "pegao", pronunciation: "peh-GAH-oh", translation: "catchy / stuck in your head", example: "Esa canción está pegá", exampleTranslation: "That song is catchy", register: "slang", fromLyrics: false, note: "Short for 'pegado' - common in Caribbean Spanish" },
      { original: "tema", pronunciation: "TEH-mah", translation: "song / track", example: "Pon ese tema", exampleTranslation: "Play that track", register: "informal", fromLyrics: false },
      { original: "pista", pronunciation: "PEES-tah", translation: "beat / instrumental", example: "La pista está dura", exampleTranslation: "The beat is hard", register: "informal", fromLyrics: false },
    ],
    "Portuguese": [
      { original: "hit", pronunciation: "HEE-chee", translation: "hit song", example: "Esse é o hit do verão", exampleTranslation: "That's the summer hit", register: "informal", fromLyrics: false },
      { original: "toca", pronunciation: "TOH-kah", translation: "play (a song)", example: "Toca essa música!", exampleTranslation: "Play this song!", register: "informal", fromLyrics: false },
    ],
    "Korean": [
      { original: "음원", pronunciation: "eum-won", translation: "digital music release", example: "음원 공개됐어!", exampleTranslation: "The song was released!", register: "informal", fromLyrics: false },
      { original: "차트", pronunciation: "cha-teu", translation: "music chart", example: "차트 1위!", exampleTranslation: "Number 1 on the chart!", register: "informal", fromLyrics: false },
    ],
    "Japanese": [
      { original: "新曲", pronunciation: "shin-kyoku", translation: "new song", example: "新曲出たよ!", exampleTranslation: "The new song is out!", register: "informal", fromLyrics: false },
      { original: "サビ", pronunciation: "sa-bi", translation: "chorus / hook", example: "サビが最高", exampleTranslation: "The chorus is the best", register: "informal", fromLyrics: false },
    ],
  };
  return contextWords[language] || contextWords["Spanish"] || [];
}
