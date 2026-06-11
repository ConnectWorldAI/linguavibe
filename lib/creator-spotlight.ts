/**
 * Creator Spotlight — weekly rotating creator highlight for the home screen.
 * Each week features a different teaching creator with sample exercises inspired by their style.
 */
import AsyncStorage from "@react-native-async-storage/async-storage";

const SPOTLIGHT_DISMISSED_KEY = "@connectworld_spotlight_dismissed";

export interface SpotlightCreator {
  id: string;
  name: string;
  handle: string;
  platform: string;
  profileUrl: string;
  avatarEmoji: string;
  region: string;
  language: string;
  followers: string;
  tagline: string;
  teachingStyle: string;
  sampleExercises: SampleExercise[];
  contentHighlights: string[];
}

export interface SampleExercise {
  type: "phrase" | "quiz" | "fill_blank" | "listen";
  title: string;
  prompt: string;
  answer: string;
  hint?: string;
}

/**
 * Rotating creator roster — each creator gets a week in the spotlight.
 * The rotation is deterministic based on the week number of the year.
 */
const SPOTLIGHT_ROSTER: SpotlightCreator[] = [
  {
    id: "spotlight_spanishwithtuta",
    name: "Spanish with Tuta",
    handle: "@spanishwithtuta",
    platform: "Instagram / TikTok / Facebook",
    profileUrl: "https://www.instagram.com/spanishwithtuta",
    avatarEmoji: "🇨🇴",
    region: "Nashville, USA (Colombian heritage)",
    language: "Spanish",
    followers: "690K+",
    tagline: "More than ESPANISHHH ❤️‍🔥",
    teachingStyle: "Daily phrase immersion with natural bilingual code-switching",
    sampleExercises: [
      {
        type: "phrase",
        title: "Alternatives to 'Sí'",
        prompt: "Instead of always saying 'sí', how would you say 'of course' in a casual way?",
        answer: "Claro",
        hint: "Think of something clear/obvious",
      },
      {
        type: "quiz",
        title: "Code-Switch Challenge",
        prompt: "Complete: 'Oye, can you pass me la ___?' (salt)",
        answer: "sal",
        hint: "Three letters, starts with 's'",
      },
      {
        type: "fill_blank",
        title: "Daily Phrase",
        prompt: "'Dale' is commonly used to mean ___",
        answer: "go for it / sure / let's do it",
        hint: "It's an agreement or encouragement",
      },
    ],
    contentHighlights: [
      "Daily Spanish phrases series",
      "Teaching baby Micah Spanish from birth",
      "Country-specific vocabulary comparisons",
      "Quizzing husband on Spanish knowledge",
    ],
  },
  {
    id: "spotlight_bilingueblogs",
    name: "Bilingüe Blogs",
    handle: "@bilingueblogs",
    platform: "Instagram",
    profileUrl: "https://www.instagram.com/bilingueblogs",
    avatarEmoji: "🗣️",
    region: "Multi-Dialect",
    language: "Spanish",
    followers: "500K+",
    tagline: "Real Spanish from real speakers",
    teachingStyle: "Multi-dialect exposure through authentic conversations",
    sampleExercises: [
      {
        type: "quiz",
        title: "Dialect Detective",
        prompt: "If someone says 'chévere', which country are they likely from?",
        answer: "Venezuela or Colombia",
        hint: "It means 'cool' or 'awesome'",
      },
      {
        type: "phrase",
        title: "Regional Expressions",
        prompt: "In Mexico, how do you say 'cool/awesome'?",
        answer: "Chido / Padre",
        hint: "Two common options, one means 'father'",
      },
      {
        type: "listen",
        title: "Accent Recognition",
        prompt: "Which accent drops the 's' at the end of words most often?",
        answer: "Caribbean (Dominican, Cuban, Puerto Rican)",
        hint: "Island nations in the Caribbean",
      },
    ],
    contentHighlights: [
      "Dialect comparison videos",
      "Authentic street conversations",
      "Regional slang breakdowns",
      "Accent training exercises",
    ],
  },
  {
    id: "spotlight_spanishwithdiana",
    name: "Spanish with Diana",
    handle: "@spanishwithdiana_",
    platform: "Instagram",
    profileUrl: "https://www.instagram.com/spanishwithdiana_",
    avatarEmoji: "🇨🇴",
    region: "Colombia",
    language: "Spanish",
    followers: "400K+",
    tagline: "Colombian Spanish made easy",
    teachingStyle: "Pronunciation correction and cultural immersion",
    sampleExercises: [
      {
        type: "quiz",
        title: "False Friends",
        prompt: "'Embarazada' does NOT mean 'embarrassed'. What does it mean?",
        answer: "Pregnant",
        hint: "A very common mistake for English speakers!",
      },
      {
        type: "phrase",
        title: "Pronunciation Fix",
        prompt: "What's the difference between 'pero' and 'perro'?",
        answer: "'Pero' = but, 'Perro' = dog (rolled 'rr')",
        hint: "One has a single r, one has double r",
      },
      {
        type: "fill_blank",
        title: "Colombian Expression",
        prompt: "'Qué ___!' means 'How cool!' in Colombian Spanish",
        answer: "bacano",
        hint: "Starts with 'b', very Colombian",
      },
    ],
    contentHighlights: [
      "Common pronunciation mistakes",
      "False friends that change meaning",
      "Colombian culture deep dives",
      "Travel Spanish essentials",
    ],
  },
  {
    id: "spotlight_jonahjgomez",
    name: "Jonah Gomez",
    handle: "@jonahjgomez",
    platform: "Instagram",
    profileUrl: "https://www.instagram.com/jonahjgomez",
    avatarEmoji: "🇩🇴",
    region: "Dominican Republic",
    language: "Spanish",
    followers: "350K+",
    tagline: "Dominican Spanish for the streets",
    teachingStyle: "Street immersion with Dominican slang and cultural storytelling",
    sampleExercises: [
      {
        type: "phrase",
        title: "Dominican Slang",
        prompt: "What does 'vaina' mean in Dominican Spanish?",
        answer: "thing / stuff (universal word for anything)",
        hint: "Dominicans use it for EVERYTHING",
      },
      {
        type: "quiz",
        title: "Street Spanish",
        prompt: "'Dime a ver' is a Dominican greeting. What does it literally mean?",
        answer: "Tell me / What's up",
        hint: "Literally 'tell me to see'",
      },
      {
        type: "fill_blank",
        title: "DR Culture",
        prompt: "In the DR, a 'colmado' is a ___",
        answer: "corner store / bodega",
        hint: "Where you buy everyday items in the neighborhood",
      },
    ],
    contentHighlights: [
      "Real Dominican street phrases",
      "DR vs US culture comparisons",
      "Travel prep for Dominican Republic",
      "Immersive storytelling in Spanish",
    ],
  },
  {
    id: "spotlight_sevendayspanish",
    name: "Seven Day Spanish",
    handle: "@sevendayspanish",
    platform: "Instagram / YouTube",
    profileUrl: "https://www.instagram.com/sevendayspanish",
    avatarEmoji: "🇺🇸",
    region: "United States",
    language: "Spanish",
    followers: "300K+",
    tagline: "Speed drills that actually work",
    teachingStyle: "Rhythmic Reinforcement Training (RRT) with progressive speed-up drills",
    sampleExercises: [
      {
        type: "quiz",
        title: "Speed Drill",
        prompt: "Translate as fast as you can: 'I need to go to the store'",
        answer: "Necesito ir a la tienda",
        hint: "Necesito + ir + a la + place",
      },
      {
        type: "phrase",
        title: "Alphabet Mastery",
        prompt: "How do you pronounce the Spanish 'j'? (like which English sound?)",
        answer: "Like an English 'h' (as in 'hot')",
        hint: "Think of the 'h' sound",
      },
      {
        type: "fill_blank",
        title: "Rapid Response",
        prompt: "Someone says '¿Cómo estás?' — respond naturally: 'Bien, ¿y ___?'",
        answer: "tú",
        hint: "Informal 'you'",
      },
    ],
    contentHighlights: [
      "Progressive speed-up repetition drills",
      "Alphabet and pronunciation mastery",
      "Artificial immersion scenarios",
      "Netflix dictation exercises",
    ],
  },
];

/**
 * Get the current week number of the year (ISO week).
 */
function getWeekNumber(): number {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 1);
  const diff = now.getTime() - start.getTime();
  const oneWeek = 7 * 24 * 60 * 60 * 1000;
  return Math.floor(diff / oneWeek) + 1;
}

/**
 * Get this week's spotlight creator based on deterministic weekly rotation.
 */
export function getWeeklySpotlightCreator(): SpotlightCreator {
  const weekNum = getWeekNumber();
  const index = weekNum % SPOTLIGHT_ROSTER.length;
  return SPOTLIGHT_ROSTER[index];
}

/**
 * Get all creators in the spotlight roster.
 */
export function getAllSpotlightCreators(): SpotlightCreator[] {
  return SPOTLIGHT_ROSTER;
}

/**
 * Check if the user has dismissed this week's spotlight.
 */
export async function isSpotlightDismissed(): Promise<boolean> {
  try {
    const raw = await AsyncStorage.getItem(SPOTLIGHT_DISMISSED_KEY);
    if (!raw) return false;
    const { week } = JSON.parse(raw);
    return week === getWeekNumber();
  } catch {
    return false;
  }
}

/**
 * Dismiss the spotlight for this week.
 */
export async function dismissSpotlight(): Promise<void> {
  try {
    await AsyncStorage.setItem(
      SPOTLIGHT_DISMISSED_KEY,
      JSON.stringify({ week: getWeekNumber() })
    );
  } catch {}
}
