/**
 * Omar-Style AI Avatar Content Format System
 * 
 * Replicates the proven TikTok teaching format used by creators like
 * @inglesconomar (2.1M followers) — short clips with bilingual text overlays,
 * phonetic pronunciation guides, and visual comparison aids.
 * 
 * Format Analysis (from Omar's content):
 * 1. Word cards: Shows English word + Spanish translation + phonetic pronunciation
 *    Example: "He taught me" → "Él me enseñó" → "(ji tot mi)"
 * 2. Confusing word comparisons: Spider-Man pointing meme for similar words
 *    Example: taught/thought/through/tough/thorough/throughout
 * 3. Common phrases: Real-life phrases with pronunciation
 *    Example: "I got happy" → "Me puse feliz" → "(ai gat japi)"
 * 4. Quick corrections: "pero ese sonido es muy parecido o igual a decir Dios???"
 * 5. Goes LIVE for interactive Q&A sessions
 * 
 * Our AI avatars replicate this format but:
 * - Work in BOTH directions (English→Spanish AND Spanish→English)
 * - Cover ALL language pairs (not just English/Spanish)
 * - Use regional-specific pronunciation (Dominican, Mexican, Colombian, etc.)
 * - Scale infinitely (new content every hour, not limited by human availability)
 * - Include interactive elements (tap to hear, quiz after watching)
 */

// ─── TYPES ───────────────────────────────────────────────────────────────────

export type ContentFormat =
  | "word_card"           // Single word with translation + phonetics
  | "phrase_card"         // Full phrase with breakdown
  | "confusing_words"     // Similar-sounding words comparison (Spider-Man style)
  | "pronunciation_drill" // Focus on a specific sound
  | "slang_of_the_day"   // Regional slang explanation
  | "grammar_bite"        // Quick grammar rule (e.g., "Cuando se usa el 'that'")
  | "cultural_context"    // Cultural explanation behind a phrase
  | "live_session"        // Scheduled AI "live" interactive session
  | "correction_clip"     // Error correction from a previous lesson
  | "challenge_clip";     // "Can you say this?" pronunciation challenge

export type AvatarPersonality =
  | "professor"    // Formal, structured (like Omar in suit)
  | "amigo"        // Casual, friendly, uses slang
  | "abuela"       // Warm, patient, uses old sayings
  | "joven"        // Young, trendy, uses Gen-Z language
  | "profesional"; // Business-focused, corporate vocabulary

export interface AvatarProfile {
  id: string;
  name: string;
  personality: AvatarPersonality;
  nativeLanguage: string;
  teachingLanguage: string;
  region: string;
  country: string;
  accent: string;
  voiceId: string; // ElevenLabs voice ID
  avatarImageUrl: string;
  bio: string;
  specialties: string[];
  followerCount: number;
  contentCount: number;
  isVerified: boolean;
  isPartner: boolean; // Real human creator vs AI avatar
}

export interface ContentClip {
  id: string;
  format: ContentFormat;
  avatarId: string;
  title: string;
  duration: number; // seconds (typically 15-60)
  
  // Visual elements
  primaryText: string;        // Main word/phrase being taught
  translationText: string;    // Translation
  phoneticText: string;       // Phonetic pronunciation guide
  overlayPosition: "top" | "center" | "bottom";
  
  // Audio
  nativeAudioUrl: string;     // Pronunciation in native language
  targetAudioUrl: string;     // Pronunciation in target language
  slowAudioUrl: string;       // Slow pronunciation for learners
  
  // Metadata
  difficulty: "beginner" | "intermediate" | "advanced";
  languagePair: { from: string; to: string };
  region: string;
  tags: string[];
  
  // Engagement
  views: number;
  likes: number;
  saves: number;
  shares: number;
  
  // Interactive elements
  hasQuiz: boolean;
  quizQuestion?: string;
  quizOptions?: string[];
  quizCorrectIndex?: number;
  
  // Scheduling
  publishedAt: string;
  scheduledFor?: string;
  isLive: boolean;
  
  // Watermark
  watermarkText: string; // "connectworldai.com"
  watermarkPosition: "bottom-left" | "bottom-right";
}

export interface ConfusingWordsSet {
  id: string;
  title: string; // e.g., "Words that sound alike"
  words: Array<{
    word: string;
    meaning: string;
    phonetic: string;
    exampleSentence: string;
    exampleTranslation: string;
  }>;
  visualStyle: "spider_man" | "side_by_side" | "color_coded" | "animated_split";
  memeTemplate?: string; // e.g., "spider-man-pointing"
}

export interface LiveSessionSchedule {
  id: string;
  avatarId: string;
  title: string;
  description: string;
  scheduledAt: string;
  duration: number; // minutes
  topic: string;
  languagePair: { from: string; to: string };
  maxParticipants: number;
  isRecurring: boolean;
  recurringPattern?: "daily" | "weekdays" | "weekly";
  notifySubscribers: boolean;
}

// ─── AVATAR ROSTER (DR/Caribbean Focus) ──────────────────────────────────────

export const DR_AVATAR_ROSTER: AvatarProfile[] = [
  {
    id: "avatar-dr-profesor-carlos",
    name: "Profesor Carlos",
    personality: "professor",
    nativeLanguage: "es",
    teachingLanguage: "en",
    region: "Caribbean",
    country: "DO",
    accent: "Dominican",
    voiceId: "el_dr_carlos_v1",
    avatarImageUrl: "",
    bio: "Profesor de inglés dominicano. Te enseño inglés como se habla de verdad, no como en los libros.",
    specialties: ["pronunciation", "business_english", "confusing_words", "grammar"],
    followerCount: 0,
    contentCount: 0,
    isVerified: true,
    isPartner: false,
  },
  {
    id: "avatar-dr-maria-la-profe",
    name: "María La Profe",
    personality: "amigo",
    nativeLanguage: "es",
    teachingLanguage: "en",
    region: "Caribbean",
    country: "DO",
    accent: "Dominican",
    voiceId: "el_dr_maria_v1",
    avatarImageUrl: "",
    bio: "¡Hola mi gente! Aquí aprendemos inglés con humor y sin estrés. 🇩🇴",
    specialties: ["slang", "daily_conversation", "humor", "cultural_context"],
    followerCount: 0,
    contentCount: 0,
    isVerified: true,
    isPartner: false,
  },
  {
    id: "avatar-us-mike-teaches-spanish",
    name: "Mike Teaches Spanish",
    personality: "amigo",
    nativeLanguage: "en",
    teachingLanguage: "es",
    region: "Caribbean",
    country: "US",
    accent: "American",
    voiceId: "el_us_mike_v1",
    avatarImageUrl: "",
    bio: "American dude learning Dominican Spanish. I make the mistakes so you don't have to! 🇺🇸→🇩🇴",
    specialties: ["dominican_slang", "street_spanish", "pronunciation", "cultural_mistakes"],
    followerCount: 0,
    contentCount: 0,
    isVerified: true,
    isPartner: false,
  },
  {
    id: "avatar-dr-abuela-rosa",
    name: "Abuela Rosa",
    personality: "abuela",
    nativeLanguage: "es",
    teachingLanguage: "en",
    region: "Caribbean",
    country: "DO",
    accent: "Dominican (rural)",
    voiceId: "el_dr_rosa_v1",
    avatarImageUrl: "",
    bio: "Mija, yo aprendí inglés a los 60 años. Si yo puedo, tú también puedes. Ven que te enseño.",
    specialties: ["patience", "repetition", "encouragement", "basic_english", "dichos"],
    followerCount: 0,
    contentCount: 0,
    isVerified: true,
    isPartner: false,
  },
  {
    id: "avatar-dr-joven-kevin",
    name: "Kevin el Bilingüe",
    personality: "joven",
    nativeLanguage: "es",
    teachingLanguage: "en",
    region: "Caribbean",
    country: "DO",
    accent: "Dominican (urban/Santo Domingo)",
    voiceId: "el_dr_kevin_v1",
    avatarImageUrl: "",
    bio: "Crecí entre NY y Santo Domingo. Te enseño el inglés que se usa en la calle, no el del libro. 🗽🇩🇴",
    specialties: ["street_english", "gen_z_slang", "music_english", "social_media_english"],
    followerCount: 0,
    contentCount: 0,
    isVerified: true,
    isPartner: false,
  },
];

// ─── CONTENT TEMPLATES ───────────────────────────────────────────────────────

/**
 * Template for generating Omar-style word card clips
 * These are the bread-and-butter of TikTok language teaching
 */
export const WORD_CARD_TEMPLATES: Array<{
  category: string;
  words: Array<{
    english: string;
    spanish: string;
    phonetic: string;
    example: string;
    exampleTranslation: string;
  }>;
}> = [
  {
    category: "Confusing 'oo' sounds",
    words: [
      { english: "food", spanish: "comida", phonetic: "(fuud)", example: "The food is good", exampleTranslation: "La comida está buena" },
      { english: "mood", spanish: "humor/ánimo", phonetic: "(muud)", example: "I'm in a good mood", exampleTranslation: "Estoy de buen humor" },
      { english: "took", spanish: "tomó/agarró", phonetic: "(tuk)", example: "He took my phone", exampleTranslation: "Él agarró mi teléfono" },
      { english: "blood", spanish: "sangre", phonetic: "(blod)", example: "Blood is red", exampleTranslation: "La sangre es roja" },
    ],
  },
  {
    category: "Words that look alike (taught/thought/through/tough/thorough/throughout)",
    words: [
      { english: "taught", spanish: "enseñó", phonetic: "(tot)", example: "He taught me English", exampleTranslation: "Él me enseñó inglés" },
      { english: "thought", spanish: "pensó/pensamiento", phonetic: "(zot)", example: "I thought about it", exampleTranslation: "Lo pensé" },
      { english: "through", spanish: "a través de", phonetic: "(zru)", example: "Walk through the door", exampleTranslation: "Camina por la puerta" },
      { english: "tough", spanish: "difícil/duro", phonetic: "(tof)", example: "Life is tough", exampleTranslation: "La vida es dura" },
      { english: "thorough", spanish: "minucioso", phonetic: "(zoro)", example: "Be thorough", exampleTranslation: "Sé minucioso" },
      { english: "throughout", spanish: "durante todo", phonetic: "(zruaut)", example: "Throughout the day", exampleTranslation: "Durante todo el día" },
    ],
  },
  {
    category: "Common phrases with 'got'",
    words: [
      { english: "I got happy", spanish: "Me puse feliz", phonetic: "(ai gat japi)", example: "I got happy when I saw her", exampleTranslation: "Me puse feliz cuando la vi" },
      { english: "I got it", spanish: "Lo entendí / Lo agarré", phonetic: "(ai garit)", example: "I got it, thanks!", exampleTranslation: "¡Lo entendí, gracias!" },
      { english: "I got lost", spanish: "Me perdí", phonetic: "(ai gat lost)", example: "I got lost downtown", exampleTranslation: "Me perdí en el centro" },
      { english: "I got tired", spanish: "Me cansé", phonetic: "(ai gat taird)", example: "I got tired of waiting", exampleTranslation: "Me cansé de esperar" },
    ],
  },
  {
    category: "False friends (Dios/God vs Got/Days)",
    words: [
      { english: "God", spanish: "Dios", phonetic: "(gad)", example: "Oh my God!", exampleTranslation: "¡Dios mío!" },
      { english: "Got", spanish: "obtuve/conseguí", phonetic: "(gat)", example: "I got a job", exampleTranslation: "Conseguí un trabajo" },
      { english: "Good", spanish: "bueno", phonetic: "(gud)", example: "Good morning", exampleTranslation: "Buenos días" },
      { english: "Go", spanish: "ir", phonetic: "(gou)", example: "Let's go!", exampleTranslation: "¡Vamos!" },
    ],
  },
  {
    category: "Work vocabulary",
    words: [
      { english: "I work tomorrow", spanish: "Trabajo mañana", phonetic: "(ai work tumórou)", example: "I can't go out, I work tomorrow", exampleTranslation: "No puedo salir, trabajo mañana" },
      { english: "I don't get it", spanish: "No entiendo", phonetic: "(ai dont guérit)", example: "I don't get it, explain again", exampleTranslation: "No entiendo, explica otra vez" },
      { english: "I forgot", spanish: "Se me olvidó", phonetic: "(ai forgat)", example: "I forgot my keys", exampleTranslation: "Se me olvidaron las llaves" },
      { english: "I'm running late", spanish: "Voy tarde", phonetic: "(aim roning leit)", example: "Sorry, I'm running late", exampleTranslation: "Perdón, voy tarde" },
    ],
  },
];

/**
 * Confusing words comparison sets (Spider-Man meme format)
 */
export const CONFUSING_WORD_SETS: ConfusingWordsSet[] = [
  {
    id: "cw-taught-thought-through",
    title: "¿Cuál es cuál? 🕷️",
    words: [
      { word: "taught", meaning: "enseñó", phonetic: "/tɔːt/", exampleSentence: "She taught me", exampleTranslation: "Ella me enseñó" },
      { word: "thought", meaning: "pensó", phonetic: "/θɔːt/", exampleSentence: "I thought so", exampleTranslation: "Eso pensé" },
      { word: "through", meaning: "a través", phonetic: "/θruː/", exampleSentence: "Go through", exampleTranslation: "Pasa a través" },
      { word: "tough", meaning: "difícil", phonetic: "/tʌf/", exampleSentence: "That's tough", exampleTranslation: "Eso es difícil" },
      { word: "thorough", meaning: "minucioso", phonetic: "/ˈθʌr.oʊ/", exampleSentence: "Be thorough", exampleTranslation: "Sé minucioso" },
      { word: "throughout", meaning: "durante todo", phonetic: "/θruːˈaʊt/", exampleSentence: "Throughout the year", exampleTranslation: "Durante todo el año" },
    ],
    visualStyle: "spider_man",
    memeTemplate: "spider-man-pointing",
  },
  {
    id: "cw-there-their-theyre",
    title: "There vs Their vs They're",
    words: [
      { word: "there", meaning: "allí/ahí", phonetic: "/ðɛr/", exampleSentence: "Over there", exampleTranslation: "Por allá" },
      { word: "their", meaning: "su (de ellos)", phonetic: "/ðɛr/", exampleSentence: "Their house", exampleTranslation: "Su casa (de ellos)" },
      { word: "they're", meaning: "ellos son/están", phonetic: "/ðɛr/", exampleSentence: "They're coming", exampleTranslation: "Ellos vienen" },
    ],
    visualStyle: "color_coded",
  },
  {
    id: "cw-affect-effect",
    title: "Affect vs Effect",
    words: [
      { word: "affect", meaning: "afectar (verbo)", phonetic: "/əˈfɛkt/", exampleSentence: "It affects me", exampleTranslation: "Me afecta" },
      { word: "effect", meaning: "efecto (sustantivo)", phonetic: "/ɪˈfɛkt/", exampleSentence: "The effect was huge", exampleTranslation: "El efecto fue enorme" },
    ],
    visualStyle: "side_by_side",
  },
];

// ─── CONTENT GENERATION PIPELINE ─────────────────────────────────────────────

export interface ContentGenerationRequest {
  avatarId: string;
  format: ContentFormat;
  languagePair: { from: string; to: string };
  region: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  topic?: string;
  specificWords?: string[];
}

export interface GeneratedClipScript {
  avatarId: string;
  format: ContentFormat;
  script: {
    intro: string;          // "Hoy vamos a aprender..."
    mainContent: string;    // The teaching content
    pronunciation: string;  // "Repite conmigo..."
    outro: string;          // "Sígueme para más..."
  };
  overlays: Array<{
    text: string;
    position: "top" | "center" | "bottom";
    timing: { start: number; end: number }; // seconds
    style: "primary" | "translation" | "phonetic" | "highlight";
  }>;
  audioInstructions: {
    voiceId: string;
    speed: "slow" | "normal" | "fast";
    emphasis: string[]; // words to emphasize
  };
  duration: number;
  hashtags: string[];
  watermark: string;
}

/**
 * Generate a script for an Omar-style teaching clip
 */
export function generateClipScript(request: ContentGenerationRequest): GeneratedClipScript {
  const avatar = DR_AVATAR_ROSTER.find(a => a.id === request.avatarId) || DR_AVATAR_ROSTER[0];
  
  // Select content based on format
  let mainContent = "";
  let overlays: GeneratedClipScript["overlays"] = [];
  
  switch (request.format) {
    case "word_card": {
      const category = WORD_CARD_TEMPLATES[Math.floor(Math.random() * WORD_CARD_TEMPLATES.length)];
      const word = category.words[Math.floor(Math.random() * category.words.length)];
      mainContent = `${word.english} = ${word.spanish} (${word.phonetic})`;
      overlays = [
        { text: word.english, position: "top", timing: { start: 1, end: 8 }, style: "primary" },
        { text: word.spanish, position: "center", timing: { start: 2, end: 8 }, style: "translation" },
        { text: word.phonetic, position: "bottom", timing: { start: 3, end: 8 }, style: "phonetic" },
        { text: word.example, position: "center", timing: { start: 9, end: 15 }, style: "primary" },
        { text: word.exampleTranslation, position: "bottom", timing: { start: 10, end: 15 }, style: "translation" },
      ];
      break;
    }
    case "confusing_words": {
      const set = CONFUSING_WORD_SETS[Math.floor(Math.random() * CONFUSING_WORD_SETS.length)];
      mainContent = set.title;
      set.words.forEach((w, i) => {
        overlays.push({
          text: `${w.word} = ${w.meaning}`,
          position: "center",
          timing: { start: 3 + i * 5, end: 7 + i * 5 },
          style: "primary",
        });
        overlays.push({
          text: w.phonetic,
          position: "bottom",
          timing: { start: 3 + i * 5, end: 7 + i * 5 },
          style: "phonetic",
        });
      });
      break;
    }
    case "slang_of_the_day": {
      mainContent = "Slang del día";
      overlays = [
        { text: "SLANG DEL DÍA 🔥", position: "top", timing: { start: 0, end: 3 }, style: "highlight" },
      ];
      break;
    }
    default:
      mainContent = "Teaching content";
  }

  const introOptions = avatar.personality === "professor"
    ? ["Hoy vamos a aprender algo importante.", "Presta atención a esto.", "Muchos cometen este error."]
    : avatar.personality === "amigo"
    ? ["¡Qué lo que mi gente!", "Mira esto que está buenísimo.", "Ven acá que te voy a enseñar algo."]
    : avatar.personality === "abuela"
    ? ["Mija, ven que te explico algo.", "Ay mi amor, esto es fácil.", "Siéntate que te voy a enseñar."]
    : avatar.personality === "joven"
    ? ["Bro, tienes que saber esto.", "Esto es lo que todo el mundo dice en la calle.", "Si no sabes esto, estás perdido."]
    : ["En el contexto profesional...", "Para tu carrera necesitas saber esto.", "En una reunión de trabajo dirías..."];

  return {
    avatarId: avatar.id,
    format: request.format,
    script: {
      intro: introOptions[Math.floor(Math.random() * introOptions.length)],
      mainContent,
      pronunciation: "Repite conmigo...",
      outro: "Sígueme para más tips de inglés. ¡Dale like y comparte! 🔥",
    },
    overlays,
    audioInstructions: {
      voiceId: avatar.voiceId,
      speed: request.difficulty === "beginner" ? "slow" : "normal",
      emphasis: request.specificWords || [],
    },
    duration: request.format === "word_card" ? 15 : request.format === "confusing_words" ? 45 : 30,
    hashtags: [
      "#AprendeInglés", "#EnglishForSpanishSpeakers", "#ConnectWorldAI",
      "#InglésReal", "#PronunciaciónEnInglés", "#BilingüeLife",
      `#${avatar.country === "DO" ? "RepúblicaDominicana" : "LearnEnglish"}`,
    ],
    watermark: "connectworldai.com",
  };
}

// ─── LIVE SESSION SCHEDULING ─────────────────────────────────────────────────

/**
 * Default live session schedule for DR market
 * Mimics how Omar and other creators go live on TikTok
 */
export const DR_LIVE_SCHEDULE: LiveSessionSchedule[] = [
  {
    id: "live-dr-morning-english",
    avatarId: "avatar-dr-profesor-carlos",
    title: "Inglés para tu trabajo 💼",
    description: "Aprende frases que necesitas en tu trabajo. Preguntas en vivo.",
    scheduledAt: "07:00",
    duration: 30,
    topic: "Business English for Dominicans",
    languagePair: { from: "es", to: "en" },
    maxParticipants: 500,
    isRecurring: true,
    recurringPattern: "weekdays",
    notifySubscribers: true,
  },
  {
    id: "live-dr-lunch-slang",
    avatarId: "avatar-dr-joven-kevin",
    title: "Slang Hour 🔥 Inglés de la calle",
    description: "El inglés que no te enseñan en la escuela. Pregunta lo que quieras.",
    scheduledAt: "12:00",
    duration: 20,
    topic: "Street English / American Slang",
    languagePair: { from: "es", to: "en" },
    maxParticipants: 1000,
    isRecurring: true,
    recurringPattern: "daily",
    notifySubscribers: true,
  },
  {
    id: "live-dr-evening-beginners",
    avatarId: "avatar-dr-abuela-rosa",
    title: "Inglés desde cero 🌟 Para principiantes",
    description: "Si nunca has estudiado inglés, este es tu espacio. Sin vergüenza, sin presión.",
    scheduledAt: "19:00",
    duration: 45,
    topic: "Absolute Beginners English",
    languagePair: { from: "es", to: "en" },
    maxParticipants: 300,
    isRecurring: true,
    recurringPattern: "weekdays",
    notifySubscribers: true,
  },
  {
    id: "live-us-spanish-night",
    avatarId: "avatar-us-mike-teaches-spanish",
    title: "Dominican Spanish Night 🇩🇴",
    description: "Learn REAL Dominican Spanish — the slang, the speed, the culture. Ask me anything!",
    scheduledAt: "20:00",
    duration: 30,
    topic: "Dominican Spanish for Americans",
    languagePair: { from: "en", to: "es" },
    maxParticipants: 500,
    isRecurring: true,
    recurringPattern: "daily",
    notifySubscribers: true,
  },
];

// ─── CONTENT PRODUCTION QUEUE ────────────────────────────────────────────────

export interface ContentProductionJob {
  id: string;
  request: ContentGenerationRequest;
  status: "queued" | "scripting" | "recording" | "editing" | "publishing" | "published" | "failed";
  script?: GeneratedClipScript;
  videoUrl?: string;
  thumbnailUrl?: string;
  publishedAt?: string;
  scheduledFor?: string;
  error?: string;
}

/**
 * Daily content production targets per avatar
 * This ensures consistent output like a real creator would post
 */
export const DAILY_PRODUCTION_TARGETS = {
  wordCards: 5,          // 5 word card clips per day per avatar
  phraseCards: 3,        // 3 phrase clips per day
  confusingWords: 1,     // 1 comparison video per day
  slangOfTheDay: 1,      // 1 slang clip per day
  grammarBite: 2,        // 2 grammar clips per day
  pronunciationDrill: 2, // 2 pronunciation drills per day
  culturalContext: 1,    // 1 cultural clip per day
  liveSessions: 2,       // 2 live sessions per day
  totalPerAvatar: 17,    // ~17 pieces of content per avatar per day
  totalAcrossRoster: 85, // 5 avatars × 17 = 85 clips per day for DR market alone
};

/**
 * Generate a full day's content queue for the DR market
 */
export function generateDailyContentQueue(date: string): ContentProductionJob[] {
  const queue: ContentProductionJob[] = [];
  let jobIndex = 0;

  for (const avatar of DR_AVATAR_ROSTER) {
    // Word cards
    for (let i = 0; i < DAILY_PRODUCTION_TARGETS.wordCards; i++) {
      queue.push({
        id: `job-${date}-${jobIndex++}`,
        request: {
          avatarId: avatar.id,
          format: "word_card",
          languagePair: { from: avatar.nativeLanguage, to: avatar.teachingLanguage },
          region: avatar.country,
          difficulty: i < 2 ? "beginner" : i < 4 ? "intermediate" : "advanced",
        },
        status: "queued",
      });
    }

    // Phrase cards
    for (let i = 0; i < DAILY_PRODUCTION_TARGETS.phraseCards; i++) {
      queue.push({
        id: `job-${date}-${jobIndex++}`,
        request: {
          avatarId: avatar.id,
          format: "phrase_card",
          languagePair: { from: avatar.nativeLanguage, to: avatar.teachingLanguage },
          region: avatar.country,
          difficulty: "intermediate",
        },
        status: "queued",
      });
    }

    // Confusing words (1 per day)
    queue.push({
      id: `job-${date}-${jobIndex++}`,
      request: {
        avatarId: avatar.id,
        format: "confusing_words",
        languagePair: { from: avatar.nativeLanguage, to: avatar.teachingLanguage },
        region: avatar.country,
        difficulty: "intermediate",
      },
      status: "queued",
    });

    // Slang of the day
    queue.push({
      id: `job-${date}-${jobIndex++}`,
      request: {
        avatarId: avatar.id,
        format: "slang_of_the_day",
        languagePair: { from: avatar.nativeLanguage, to: avatar.teachingLanguage },
        region: avatar.country,
        difficulty: "intermediate",
      },
      status: "queued",
    });

    // Grammar bites
    for (let i = 0; i < DAILY_PRODUCTION_TARGETS.grammarBite; i++) {
      queue.push({
        id: `job-${date}-${jobIndex++}`,
        request: {
          avatarId: avatar.id,
          format: "grammar_bite",
          languagePair: { from: avatar.nativeLanguage, to: avatar.teachingLanguage },
          region: avatar.country,
          difficulty: i === 0 ? "beginner" : "advanced",
        },
        status: "queued",
      });
    }

    // Pronunciation drills
    for (let i = 0; i < DAILY_PRODUCTION_TARGETS.pronunciationDrill; i++) {
      queue.push({
        id: `job-${date}-${jobIndex++}`,
        request: {
          avatarId: avatar.id,
          format: "pronunciation_drill",
          languagePair: { from: avatar.nativeLanguage, to: avatar.teachingLanguage },
          region: avatar.country,
          difficulty: "beginner",
        },
        status: "queued",
      });
    }

    // Cultural context
    queue.push({
      id: `job-${date}-${jobIndex++}`,
      request: {
        avatarId: avatar.id,
        format: "cultural_context",
        languagePair: { from: avatar.nativeLanguage, to: avatar.teachingLanguage },
        region: avatar.country,
        difficulty: "intermediate",
      },
      status: "queued",
    });
  }

  return queue;
}

// ─── VIDEO GENERATION SPECS ──────────────────────────────────────────────────

/**
 * Video generation specifications for each content format
 * These specs are sent to HeyGen/Synthesia/Kling for avatar video generation
 */
export const VIDEO_SPECS: Record<ContentFormat, {
  aspectRatio: "9:16" | "16:9" | "1:1";
  resolution: string;
  fps: number;
  maxDuration: number;
  overlayStyle: string;
  backgroundStyle: string;
}> = {
  word_card: {
    aspectRatio: "9:16",
    resolution: "1080x1920",
    fps: 30,
    maxDuration: 15,
    overlayStyle: "large-text-center-with-phonetic",
    backgroundStyle: "solid-with-avatar-speaking",
  },
  phrase_card: {
    aspectRatio: "9:16",
    resolution: "1080x1920",
    fps: 30,
    maxDuration: 30,
    overlayStyle: "phrase-top-translation-bottom",
    backgroundStyle: "solid-with-avatar-speaking",
  },
  confusing_words: {
    aspectRatio: "9:16",
    resolution: "1080x1920",
    fps: 30,
    maxDuration: 60,
    overlayStyle: "split-comparison-with-meme",
    backgroundStyle: "animated-split-screen",
  },
  pronunciation_drill: {
    aspectRatio: "9:16",
    resolution: "1080x1920",
    fps: 30,
    maxDuration: 20,
    overlayStyle: "ipa-phonetic-large",
    backgroundStyle: "waveform-visualization",
  },
  slang_of_the_day: {
    aspectRatio: "9:16",
    resolution: "1080x1920",
    fps: 30,
    maxDuration: 30,
    overlayStyle: "fire-emoji-header-with-definition",
    backgroundStyle: "gradient-with-flag",
  },
  grammar_bite: {
    aspectRatio: "9:16",
    resolution: "1080x1920",
    fps: 30,
    maxDuration: 45,
    overlayStyle: "rule-box-with-examples",
    backgroundStyle: "whiteboard-style",
  },
  cultural_context: {
    aspectRatio: "9:16",
    resolution: "1080x1920",
    fps: 30,
    maxDuration: 45,
    overlayStyle: "story-text-with-images",
    backgroundStyle: "cultural-imagery-collage",
  },
  live_session: {
    aspectRatio: "9:16",
    resolution: "1080x1920",
    fps: 30,
    maxDuration: 2700, // 45 min max
    overlayStyle: "live-badge-with-viewer-count",
    backgroundStyle: "avatar-full-body-with-chat",
  },
  correction_clip: {
    aspectRatio: "9:16",
    resolution: "1080x1920",
    fps: 30,
    maxDuration: 20,
    overlayStyle: "red-x-green-check",
    backgroundStyle: "before-after-split",
  },
  challenge_clip: {
    aspectRatio: "9:16",
    resolution: "1080x1920",
    fps: 30,
    maxDuration: 15,
    overlayStyle: "challenge-text-with-timer",
    backgroundStyle: "energetic-gradient",
  },
};
