import AsyncStorage from "@react-native-async-storage/async-storage";
import { SLANG_LANGUAGES, getSlangForLanguage } from "@/lib/slang-data";

const STORAGE_KEY = "@dialect_of_the_week_history";

export interface DialectOfTheWeek {
  languageCode: string;
  languageName: string;
  languageFlag: string;
  dialectCode: string;
  dialectName: string;
  dialectFlag: string;
  weekNumber: number;
  year: number;
  featuredSlang: { word: string; meaning: string; example?: string; category?: string }[];
  culturalFact: string;
  quizChallenge: string;
}

// Build a flat list of all dialects across all languages
function getAllDialects(): { languageCode: string; languageName: string; languageFlag: string; dialectCode: string; dialectName: string; dialectFlag: string }[] {
  const dialects: { languageCode: string; languageName: string; languageFlag: string; dialectCode: string; dialectName: string; dialectFlag: string }[] = [];
  for (const lang of SLANG_LANGUAGES) {
    for (const dialect of lang.dialects) {
      dialects.push({
        languageCode: lang.languageCode,
        languageName: lang.languageName,
        languageFlag: lang.flag,
        dialectCode: dialect.code,
        dialectName: dialect.name,
        dialectFlag: dialect.flag,
      });
    }
  }
  return dialects;
}

// Get ISO week number for a given date
function getISOWeekNumber(date: Date): { week: number; year: number } {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return { week, year: d.getUTCFullYear() };
}

// Cultural facts per dialect for the featured content
const CULTURAL_FACTS: Record<string, string> = {
  "es-dominican": "Dominican Spanish is known for dropping the 's' at the end of words and using 'vaina' for almost anything. Music genres like bachata and merengue originated here.",
  "es-mexican": "Mexican Spanish has strong Nahuatl influences — words like 'chocolate', 'tomate', and 'aguacate' come from indigenous languages.",
  "es-colombian": "Colombian Spanish is often considered one of the clearest dialects. Paisas from Medellín are famous for saying 'pues' after everything.",
  "es-venezuelan": "Venezuelan Spanish uses 'chamo/chama' as the go-to word for friend. The accent varies dramatically between Caracas, Maracaibo, and the Andes.",
  "es-panamanian": "Panamanian Spanish blends Caribbean rhythm with Central American vocabulary. 'Xopa' means friend and 'vaina' means thing.",
  "es-standard": "Standard Spanish (Castilian) uses 'vosotros' and the 'th' sound for 'z' and soft 'c'. It's the dialect of Madrid and central Spain.",
  "en-american": "American English varies wildly — from Southern drawl to NYC speed to California valley talk. Slang evolves fastest through hip-hop and social media.",
  "en-british": "British English has more regional accents per square mile than anywhere else. Cockney rhyming slang, Scouse, and Geordie are practically different languages.",
  "en-australian": "Australian English shortens everything — 'afternoon' becomes 'arvo', 'breakfast' becomes 'brekkie'. Rising intonation makes statements sound like questions.",
  "fr-standard": "Parisian French is the prestige dialect, but verlan (backwards slang) dominates youth culture — 'meuf' (femme backwards) means woman.",
  "fr-quebec": "Québécois French preserves 17th-century pronunciations lost in France. 'Tabarnac' and other church-derived swear words are uniquely Québécois.",
  "pt-brazilian": "Brazilian Portuguese is more melodic than European Portuguese. Each region has distinct slang — cariocas (Rio) vs. paulistas (São Paulo) sound very different.",
  "pt-european": "European Portuguese sounds more Slavic to untrained ears due to reduced vowels. It's often called 'the French of Romance languages' for its difficulty.",
  "ja-standard": "Standard Japanese (hyōjungo) is based on Tokyo dialect. Keigo (honorific speech) has 3 levels and is essential for business.",
  "ja-kansai": "Kansai-ben (Osaka/Kyoto dialect) is known for being funnier and more direct. Comedians often use it. 'Nandeyanen!' is the classic Osaka comeback.",
  "zh-standard": "Mainland Mandarin internet slang evolves at lightning speed. '666' means 'awesome' (sounds like 'liù' = smooth/skilled).",
  "zh-taiwanese": "Taiwanese Mandarin mixes in Hokkien and Japanese loanwords. The accent is softer and more melodic than mainland Mandarin.",
  "hi-standard": "Hindi slang heavily borrows from English (Hinglish) in urban areas. Bollywood is the biggest driver of new slang across India.",
  "hi-mumbai": "Bambaiya Hindi (Mumbai street slang) was popularized by Bollywood gangster films. It mixes Hindi, Marathi, Urdu, and English.",
  "ko-standard": "Korean internet culture drives slang globally — K-pop fans spread terms like 'daebak' (awesome) and 'fighting!' (you can do it) worldwide.",
  "ko-busan": "Busan satoori (dialect) is rougher and more direct than Seoul Korean. It became famous through the movie 'Train to Busan' and BTS's Jimin.",
  "ar-levantine": "Levantine Arabic (Lebanon, Syria, Jordan) is considered the most musical Arabic dialect. It's the most understood across the Arab world thanks to Lebanese pop culture.",
  "ar-egyptian": "Egyptian Arabic is understood everywhere thanks to Egypt's film and music industry. 'Yalla' and 'khalas' have spread to non-Arabic speakers globally.",
  "ar-gulf": "Gulf Arabic (UAE, Saudi, Qatar) mixes classical Arabic with Persian and Hindi loanwords due to the region's trading history.",
};

// Quiz challenges per dialect
const QUIZ_CHALLENGES: Record<string, string> = {
  "es-dominican": "Can you identify 5 Dominican slang words that would confuse a Mexican Spanish speaker?",
  "es-mexican": "Match these Nahuatl-origin words to their Spanish meanings: chocolate, tomate, aguacate, chile, coyote",
  "es-colombian": "What does 'parcero' mean, and in which Colombian city would you hear it most?",
  "es-venezuelan": "Translate these Venezuelan phrases: 'Está burda de bueno', 'Chamo, qué ladilla', 'Échale bola'",
  "es-panamanian": "What's the difference between 'xopa', 'fren', and 'acere' in Panamanian slang?",
  "es-standard": "Conjugate these verbs in vosotros form: hablar, comer, vivir, tener, ser",
  "en-american": "Which decade did each of these slang words peak: 'groovy', 'rad', 'lit', 'slay', 'no cap'?",
  "en-british": "Decode this Cockney: 'Use your loaf and get on the dog to your trouble and strife'",
  "en-australian": "What do these mean: 'chuck a sickie', 'she'll be right', 'flat out like a lizard drinking'?",
  "fr-standard": "Convert to verlan: femme, bizarre, louche, fête, mec",
  "fr-quebec": "What are the 5 main Québécois sacres (swear words) and which church objects do they reference?",
  "pt-brazilian": "Match the city to its slang: 'mano' (SP), 'brother' (RJ), 'bah' (RS), 'oxe' (NE)",
  "pt-european": "What does 'fixe', 'gajo', and 'bué' mean in European Portuguese?",
  "ja-standard": "Order these from most to least formal: お願いします, 頼むよ, お願い致します, 頼む",
  "ja-kansai": "Translate to standard Japanese: なんでやねん, あかん, ほんま, めっちゃ",
  "zh-standard": "What do these internet numbers mean: 520, 666, 233, 886, 1314?",
  "zh-taiwanese": "Which of these words come from Japanese: 歐巴桑, 便當, 阿莎力, 氣質?",
  "hi-standard": "Identify the English loanwords hidden in these Hinglish sentences",
  "hi-mumbai": "Which Bollywood films popularized: 'bhai', 'tapori', 'jhol', 'scene'?",
  "ko-standard": "What do these Korean internet abbreviations mean: ㅋㅋㅋ, ㅎㅎ, ㄱㅅ, ㅇㅇ?",
  "ko-busan": "How would you say 'What are you doing?' in Seoul vs. Busan dialect?",
  "ar-levantine": "Translate from Levantine to MSA: 'شو عم تعمل', 'هلق', 'كتير منيح'",
  "ar-egyptian": "What's the Egyptian Arabic for: 'awesome', 'let's go', 'enough', 'what's up'?",
  "ar-gulf": "Which of these Gulf Arabic words come from Persian: 'چاي', 'بس', 'زين', 'خوش'?",
};

/**
 * Get the current Dialect of the Week based on ISO week number.
 * Rotates through all available dialects deterministically.
 */
export function getCurrentDialectOfTheWeek(): DialectOfTheWeek {
  const allDialects = getAllDialects();
  const { week, year } = getISOWeekNumber(new Date());
  
  // Deterministic rotation: use (year * 52 + week) to cycle through all dialects
  const index = ((year * 52) + week) % allDialects.length;
  const selected = allDialects[index];
  
  // Get featured slang entries for this dialect
  const allSlang = getSlangForLanguage(selected.languageCode, selected.dialectCode);
  const featuredSlang = allSlang.slice(0, 5).map(entry => ({
    word: entry.word,
    meaning: entry.meaning,
    example: entry.example,
    category: entry.category,
  }));
  
  const key = `${selected.languageCode}-${selected.dialectCode}`;
  const culturalFact = CULTURAL_FACTS[key] || `Explore the unique sounds and expressions of ${selected.dialectName} ${selected.languageName}.`;
  const quizChallenge = QUIZ_CHALLENGES[key] || `Test your knowledge of ${selected.dialectName} ${selected.languageName} slang!`;
  
  return {
    languageCode: selected.languageCode,
    languageName: selected.languageName,
    languageFlag: selected.languageFlag,
    dialectCode: selected.dialectCode,
    dialectName: selected.dialectName,
    dialectFlag: selected.dialectFlag,
    weekNumber: week,
    year,
    featuredSlang,
    culturalFact,
    quizChallenge,
  };
}

/**
 * Get the history of past Dialects of the Week the user has viewed.
 */
export async function getDialectOfTheWeekHistory(): Promise<DialectOfTheWeek[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * Record that the user viewed the current Dialect of the Week.
 */
export async function recordDialectOfTheWeekView(dialect: DialectOfTheWeek): Promise<void> {
  try {
    const history = await getDialectOfTheWeekHistory();
    // Don't duplicate if already recorded this week
    const exists = history.find(h => h.weekNumber === dialect.weekNumber && h.year === dialect.year);
    if (!exists) {
      history.unshift(dialect);
      // Keep last 52 weeks
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(history.slice(0, 52)));
    }
  } catch {
    // Silent fail
  }
}

/**
 * Get all available dialects for browsing.
 */
export function getAllAvailableDialects() {
  return getAllDialects();
}

export { getISOWeekNumber };
