/**
 * Slang Knowledge Base Loader — Pre-Cached Zero-Latency Architecture
 * 
 * Strategy: Pre-warm ALL dialect caches on server boot. At translation time,
 * getSlangKnowledge() is a synchronous Map lookup (0ms). Background refresh
 * happens on a timer without blocking any translation request.
 * 
 * The LLM ALWAYS gets the full slang context instantly — no network call at
 * translation time. Airtable syncs happen silently in the background.
 * 
 * Flow:
 *   Server boot → preloadSlangKnowledge() fills slangCache for ALL dialects
 *   Every 1 hour → backgroundRefresh() updates cache silently
 *   Translation request → getSlangKnowledge() = instant Map.get() (0ms)
 *   LLM prompt → includes full dialect glossary from cache
 */
import { addToKnowledgeBase } from "./teacherKnowledgeStore";

const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID || "";
const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY || "";

interface SlangEntry {
  word: string;
  pronunciation: string;
  meaning: string;
  example: string;
  region: string;
  language: string;
  dialect: string;
  category: string;
  formality: string;
  source_url?: string;
  source_creator?: string;
}

// ─── PERSISTENT IN-MEMORY CACHE ──────────────────────────────────────────────
// Pre-warmed on server boot. Never expires during runtime.
// Background refresh updates it silently every hour.
const slangCache: Map<string, SlangEntry[]> = new Map();
let lastFetchTime = 0;
const CACHE_TTL = 1000 * 60 * 60; // 1 hour background refresh interval
let refreshTimer: ReturnType<typeof setInterval> | null = null;
let isPreloaded = false;

// All supported languages and dialects
const SUPPORTED_LANGUAGES = [
  { lang: "Spanish", dialects: ["Dominican", "Mexican", "Colombian", "Venezuelan", "Cuban", "Argentine", "Puerto Rican", "standard"] },
  { lang: "French", dialects: ["Parisian", "Québécois", "Haitian Creole", "African French", "standard"] },
  { lang: "Portuguese", dialects: ["Brazilian", "European", "Angolan", "standard"] },
  { lang: "Italian", dialects: ["Standard", "Neapolitan", "Sicilian", "Roman"] },
  { lang: "German", dialects: ["Standard", "Austrian", "Swiss German"] },
  { lang: "Japanese", dialects: ["Standard", "Kansai", "Tokyo"] },
  { lang: "Korean", dialects: ["Standard", "Busan"] },
  { lang: "Mandarin", dialects: ["Standard", "Taiwanese", "Cantonese"] },
  { lang: "Arabic", dialects: ["Egyptian", "Levantine", "Gulf", "Moroccan", "standard"] },
  { lang: "Hindi", dialects: ["Standard", "Mumbai"] },
  { lang: "Russian", dialects: ["Standard", "Moscow"] },
  { lang: "Swahili", dialects: ["Standard", "Kenyan", "Tanzanian"] },
  { lang: "Turkish", dialects: ["Standard", "Istanbul"] },
  { lang: "English", dialects: ["American", "British", "Australian", "AAVE", "Caribbean", "standard"] },
  { lang: "Haitian Creole", dialects: ["Standard", "Port-au-Prince"] },
  { lang: "Tagalog", dialects: ["Standard", "Manila"] },
  { lang: "Vietnamese", dialects: ["Northern", "Southern", "standard"] },
  { lang: "Thai", dialects: ["Standard", "Bangkok"] },
  { lang: "Dutch", dialects: ["Standard", "Flemish"] },
  { lang: "Polish", dialects: ["Standard", "Warsaw"] },
];

// ─── AIRTABLE FETCH ──────────────────────────────────────────────────────────

async function fetchSlangFromAirtable(language: string, dialect?: string): Promise<SlangEntry[]> {
  if (!AIRTABLE_BASE_ID || !AIRTABLE_API_KEY) {
    return getFallbackSlang(language, dialect);
  }

  try {
    const tablesRes = await fetch(
      `https://api.airtable.com/v0/meta/bases/${AIRTABLE_BASE_ID}/tables`,
      { headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}` } }
    );
    if (!tablesRes.ok) return getFallbackSlang(language, dialect);

    const tablesData = await tablesRes.json();
    const slangTable = tablesData.tables?.find((t: any) =>
      t.name.toLowerCase().includes("slang") && t.name.toLowerCase().includes("database")
    );
    if (!slangTable) return getFallbackSlang(language, dialect);

    let filterFormula = `{Language} = '${language}'`;
    if (dialect && dialect !== "standard" && dialect !== "Standard") {
      filterFormula = `AND({Language} = '${language}', {Dialect} = '${dialect}')`;
    }

    // Fetch up to 500 records per dialect for comprehensive coverage
    const recordsRes = await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${slangTable.id}?filterByFormula=${encodeURIComponent(filterFormula)}&maxRecords=500`,
      { headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}` } }
    );
    if (!recordsRes.ok) return getFallbackSlang(language, dialect);

    const recordsData = await recordsRes.json();
    return (recordsData.records || []).map((r: any) => ({
      word: r.fields?.Word || r.fields?.Phrase || "",
      pronunciation: r.fields?.Pronunciation || "",
      meaning: r.fields?.Meaning || r.fields?.Definition || "",
      example: r.fields?.Example || r.fields?.["Example Sentence"] || "",
      region: r.fields?.Region || r.fields?.Country || "",
      language: r.fields?.Language || language,
      dialect: r.fields?.Dialect || dialect || "standard",
      category: r.fields?.Category || "general",
      formality: r.fields?.Formality || "casual",
      source_url: r.fields?.["Source URL"] || r.fields?.Source || "",
      source_creator: r.fields?.["Source Creator"] || r.fields?.Creator || "",
    }));
  } catch (err) {
    console.error("[SlangLoader] Error fetching from Airtable:", err);
    return getFallbackSlang(language, dialect);
  }
}

// ─── ZERO-LATENCY PUBLIC API ─────────────────────────────────────────────────

/**
 * Get slang knowledge — INSTANT (synchronous Map lookup).
 * Returns cached data immediately. Never blocks on network.
 * If cache is empty for this dialect, returns fallback data instantly.
 */
export async function getSlangKnowledge(language: string, dialect?: string): Promise<{
  slangContext: string;
  sources: string[];
  multipleMeanings: Array<{ word: string; meanings: Array<{ meaning: string; context: string; region: string }> }>;
}> {
  const cacheKey = `${language}-${dialect || "standard"}`;

  // INSTANT: Just read from the pre-warmed cache
  if (slangCache.has(cacheKey)) {
    const cached = slangCache.get(cacheKey)!;
    return formatSlangForTranslator(cached, language);
  }

  // If not in cache (rare edge case — new dialect requested that wasn't pre-loaded),
  // use fallback data immediately, then trigger background fetch
  const fallback = getFallbackSlang(language, dialect);
  if (fallback.length > 0) {
    slangCache.set(cacheKey, fallback);
  }

  // Fire-and-forget: fetch from Airtable in background for next time
  fetchSlangFromAirtable(language, dialect).then(entries => {
    if (entries.length > 0) {
      slangCache.set(cacheKey, entries);
    }
  }).catch(() => {});

  return formatSlangForTranslator(fallback, language);
}

/**
 * Synchronous version for contexts that can't await (e.g., building system prompts).
 * Returns whatever is in cache RIGHT NOW. Never blocks.
 */
export function getSlangKnowledgeSync(language: string, dialect?: string): {
  slangContext: string;
  sources: string[];
  multipleMeanings: Array<{ word: string; meanings: Array<{ meaning: string; context: string; region: string }> }>;
} {
  const cacheKey = `${language}-${dialect || "standard"}`;
  const cached = slangCache.get(cacheKey) || getFallbackSlang(language, dialect);
  return formatSlangForTranslator(cached, language);
}

/**
 * Get ALL cached slang for a language (across all dialects).
 * Used for offline packs and comprehensive translation context.
 */
export function getAllSlangForLanguage(language: string): Map<string, SlangEntry[]> {
  const result = new Map<string, SlangEntry[]>();
  for (const [key, entries] of slangCache.entries()) {
    if (key.startsWith(`${language}-`)) {
      result.set(key, entries);
    }
  }
  return result;
}

/**
 * Get the full offline pack for a language (all dialects combined).
 * Returns a downloadable JSON structure for client-side caching.
 */
export function getOfflinePack(language: string): {
  language: string;
  dialects: Array<{ dialect: string; entries: SlangEntry[]; count: number }>;
  totalEntries: number;
  lastUpdated: number;
} {
  const dialects: Array<{ dialect: string; entries: SlangEntry[]; count: number }> = [];
  let totalEntries = 0;

  for (const [key, entries] of slangCache.entries()) {
    if (key.startsWith(`${language}-`)) {
      const dialect = key.replace(`${language}-`, "");
      dialects.push({ dialect, entries, count: entries.length });
      totalEntries += entries.length;
    }
  }

  return { language, dialects, totalEntries, lastUpdated: lastFetchTime };
}

// ─── FORMAT FOR LLM PROMPT ───────────────────────────────────────────────────

function formatSlangForTranslator(entries: SlangEntry[], language: string): {
  slangContext: string;
  sources: string[];
  multipleMeanings: Array<{ word: string; meanings: Array<{ meaning: string; context: string; region: string }> }>;
} {
  if (entries.length === 0) {
    return { slangContext: "", sources: [], multipleMeanings: [] };
  }

  const slangLines = entries.map(e => {
    let line = `• "${e.word}" (${e.pronunciation || "N/A"}) = ${e.meaning}`;
    if (e.example) line += ` | Example: "${e.example}"`;
    if (e.region) line += ` | Region: ${e.region}`;
    if (e.formality) line += ` | Register: ${e.formality}`;
    if (e.source_creator) line += ` | Source: @${e.source_creator}`;
    return line;
  });

  const slangContext = `\n\nVERIFIED SLANG DATABASE (real expressions used by native speakers):\n${slangLines.join("\n")}\n\nWhen translating, prefer these verified expressions over generic translations. These are REAL words used by REAL people in this dialect. Cite the source creator when using their verified expressions.`;

  const sources = entries
    .filter(e => e.source_creator || e.source_url)
    .map(e => e.source_creator ? `@${e.source_creator}` : e.source_url!)
    .filter((v, i, a) => a.indexOf(v) === i);

  // Identify words with multiple meanings across regions
  const wordMap = new Map<string, Array<{ meaning: string; context: string; region: string }>>();
  for (const entry of entries) {
    const key = entry.word.toLowerCase();
    if (!wordMap.has(key)) wordMap.set(key, []);
    wordMap.get(key)!.push({
      meaning: entry.meaning,
      context: entry.example || entry.category,
      region: entry.region || entry.dialect,
    });
  }

  const multipleMeanings = Array.from(wordMap.entries())
    .filter(([_, meanings]) => meanings.length > 1)
    .map(([word, meanings]) => ({ word, meanings }));

  return { slangContext, sources, multipleMeanings };
}

// ─── MULTIPLE MEANINGS (HARDCODED REFERENCE) ─────────────────────────────────

/**
 * Get multiple meanings for words that differ by region/context.
 * This is a curated reference — always available, no network needed.
 */
export function getMultipleMeanings(word: string, language: string): Array<{ meaning: string; context: string; region: string }> {
  const multiMeanings: Record<string, Record<string, Array<{ meaning: string; context: string; region: string }>>> = {
    "Spanish": {
      "coger": [
        { meaning: "To take, to grab, to catch", context: "Standard usage in Spain", region: "Spain" },
        { meaning: "Vulgar sexual term — NEVER use casually in Latin America", context: "Offensive in most of Latin America", region: "Latin America" },
      ],
      "guapo": [
        { meaning: "Handsome, good-looking", context: "Standard meaning in most countries", region: "Spain, Mexico, Colombia" },
        { meaning: "Angry, upset, brave — NOT about appearance!", context: "Dominican/Caribbean usage", region: "Dominican Republic, Puerto Rico" },
      ],
      "mango": [
        { meaning: "The tropical fruit", context: "Literal meaning", region: "Universal" },
        { meaning: "An attractive person (hot/beautiful)", context: "Slang compliment", region: "Dominican Republic, Cuba" },
      ],
      "bicho": [
        { meaning: "Bug, insect", context: "Standard meaning", region: "Spain, Mexico" },
        { meaning: "Vulgar term for male genitalia — very offensive", context: "Extremely vulgar", region: "Puerto Rico" },
        { meaning: "A clever/smart person", context: "Positive slang", region: "Dominican Republic" },
      ],
      "pana": [
        { meaning: "Corduroy fabric", context: "Literal textile meaning", region: "Spain" },
        { meaning: "Friend, buddy, homie", context: "Very common greeting/address", region: "Venezuela, Dominican Republic" },
      ],
      "jalar": [
        { meaning: "To pull", context: "Standard meaning", region: "Most of Latin America" },
        { meaning: "To use cocaine — drug slang, be careful!", context: "Drug reference", region: "Mexico, Colombia" },
        { meaning: "To walk, to go", context: "Casual usage", region: "Peru" },
      ],
      "vaina": [
        { meaning: "Sheath, pod (botanical)", context: "Literal/formal meaning", region: "Spain" },
        { meaning: "Thing, stuff, situation — universal filler word", context: "Replaces any noun", region: "Dominican Republic, Venezuela" },
        { meaning: "Problem, issue, annoyance", context: "Negative connotation", region: "Colombia" },
      ],
      "china": [
        { meaning: "A woman from China", context: "Nationality", region: "Universal" },
        { meaning: "Orange (the fruit)", context: "Common word for orange", region: "Puerto Rico, Dominican Republic" },
        { meaning: "Girl, young woman", context: "Affectionate term", region: "Peru" },
      ],
    },
    "French": {
      "meuf": [
        { meaning: "Girl, woman (neutral)", context: "Verlan slang, commonly used among youth", region: "France" },
        { meaning: "Girlfriend (when preceded by 'ma')", context: "Possessive form = romantic partner", region: "France" },
      ],
      "grave": [
        { meaning: "Serious, grave (literal)", context: "Standard French", region: "France" },
        { meaning: "Very, extremely, totally — youth intensifier", context: "Slang usage", region: "France (youth)" },
      ],
      "nul": [
        { meaning: "Null, zero, void", context: "Mathematical/legal term", region: "France" },
        { meaning: "Terrible, awful, useless", context: "Common insult/criticism", region: "France" },
      ],
    },
    "Portuguese": {
      "legal": [
        { meaning: "Legal, lawful", context: "Standard/formal meaning", region: "Universal" },
        { meaning: "Cool, nice, awesome", context: "Very common casual usage", region: "Brazil" },
      ],
      "gato/gata": [
        { meaning: "Cat (the animal)", context: "Literal meaning", region: "Universal" },
        { meaning: "Hot/attractive person", context: "Slang compliment", region: "Brazil" },
        { meaning: "Illegal electricity connection", context: "Informal/illegal", region: "Brazil" },
      ],
    },
    "Japanese": {
      "ヤバい": [
        { meaning: "Dangerous, risky, terrible", context: "Original/older meaning — negative", region: "Japan" },
        { meaning: "Amazing, awesome, incredible", context: "Modern youth slang — positive!", region: "Japan (youth)" },
      ],
      "適当": [
        { meaning: "Appropriate, suitable", context: "Formal/positive meaning", region: "Japan" },
        { meaning: "Half-assed, careless, random", context: "Casual/negative meaning", region: "Japan (casual)" },
      ],
    },
    "Arabic": {
      "حبيبي": [
        { meaning: "My love, darling (romantic)", context: "Between couples", region: "Arab world" },
        { meaning: "Bro, dude, friend (platonic)", context: "Between male friends — very common", region: "Egypt, Levant" },
        { meaning: "Dear customer/sir (polite)", context: "Service/business context", region: "Gulf states" },
      ],
    },
    "Korean": {
      "오빠": [
        { meaning: "Older brother (from a female)", context: "Family term", region: "South Korea" },
        { meaning: "Boyfriend/crush/flirty term", context: "Romantic context", region: "South Korea" },
        { meaning: "Male celebrity/idol fans address", context: "Fan culture", region: "South Korea" },
      ],
    },
    "Haitian Creole": {
      "koze": [
        { meaning: "To talk, to speak", context: "Standard verb", region: "Haiti" },
        { meaning: "Gossip, drama, trouble", context: "Noun form — negative connotation", region: "Haiti" },
      ],
    },
  };

  const langMeanings = multiMeanings[language];
  if (!langMeanings) return [];
  const wordLower = word.toLowerCase();
  return langMeanings[wordLower] || [];
}

// ─── PRE-LOAD ON SERVER BOOT ─────────────────────────────────────────────────

/**
 * Pre-load ALL slang data into memory on server startup.
 * After this completes, getSlangKnowledge() is instant (0ms).
 * Also starts the background refresh timer.
 */
export async function preloadSlangKnowledge(): Promise<void> {
  console.log("[SlangLoader] Pre-loading slang knowledge base (zero-latency mode)...");

  let totalLoaded = 0;

  // Load all languages and dialects in parallel batches (5 at a time to avoid rate limits)
  const allDialects: Array<{ lang: string; dialect: string }> = [];
  for (const { lang, dialects } of SUPPORTED_LANGUAGES) {
    for (const dialect of dialects) {
      allDialects.push({ lang, dialect });
    }
  }

  // Process in batches of 5 to respect Airtable rate limits
  for (let i = 0; i < allDialects.length; i += 5) {
    const batch = allDialects.slice(i, i + 5);
    const results = await Promise.allSettled(
      batch.map(async ({ lang, dialect }) => {
        const entries = await fetchSlangFromAirtable(lang, dialect);
        const cacheKey = `${lang}-${dialect}`;
        if (entries.length > 0) {
          slangCache.set(cacheKey, entries);

          // Also add to the teacher knowledge store for the AI companion
          const transcript = entries.map(e =>
            `"${e.word}" (${e.pronunciation}) = ${e.meaning}. Example: "${e.example}". Region: ${e.region}. Source: ${e.source_creator || "native speaker"}`
          ).join("\n");

          addToKnowledgeBase({
            url: `airtable://slang-database/${lang}/${dialect}`,
            title: `Verified Slang: ${lang} (${dialect})`,
            transcript,
            language: lang,
            dialect,
            platform: "Airtable Slang Database",
            source: "auto",
          });

          return entries.length;
        }
        return 0;
      })
    );

    for (const result of results) {
      if (result.status === "fulfilled") {
        totalLoaded += result.value;
      }
    }
  }

  lastFetchTime = Date.now();
  isPreloaded = true;
  console.log(`[SlangLoader] Pre-loaded ${totalLoaded} slang entries across ${SUPPORTED_LANGUAGES.length} languages (${slangCache.size} dialect caches warm)`);

  // Start background refresh timer
  startBackgroundRefresh();
}

/**
 * Background refresh — silently updates cache every hour.
 * Never blocks translation requests.
 */
function startBackgroundRefresh(): void {
  if (refreshTimer) clearInterval(refreshTimer);

  refreshTimer = setInterval(async () => {
    console.log("[SlangLoader] Background refresh starting...");
    try {
      let updated = 0;
      for (const { lang, dialects } of SUPPORTED_LANGUAGES) {
        for (const dialect of dialects) {
          try {
            const entries = await fetchSlangFromAirtable(lang, dialect);
            if (entries.length > 0) {
              slangCache.set(`${lang}-${dialect}`, entries);
              updated += entries.length;
            }
          } catch {
            // Skip failed fetches — keep existing cache
          }
          // Small delay between requests to avoid rate limits
          await new Promise(r => setTimeout(r, 200));
        }
      }
      lastFetchTime = Date.now();
      console.log(`[SlangLoader] Background refresh complete: ${updated} entries updated`);
    } catch (err) {
      console.error("[SlangLoader] Background refresh failed:", err);
    }
  }, CACHE_TTL);
}

/**
 * Check if the slang cache is pre-loaded and ready.
 */
export function isSlangCacheReady(): boolean {
  return isPreloaded;
}

/**
 * Get cache statistics for monitoring.
 */
export function getSlangCacheStats(): {
  totalDialects: number;
  totalEntries: number;
  lastRefresh: number;
  isReady: boolean;
} {
  let totalEntries = 0;
  for (const entries of slangCache.values()) {
    totalEntries += entries.length;
  }
  return {
    totalDialects: slangCache.size,
    totalEntries,
    lastRefresh: lastFetchTime,
    isReady: isPreloaded,
  };
}

// ─── FALLBACK DATA ───────────────────────────────────────────────────────────

function getFallbackSlang(language: string, dialect?: string): SlangEntry[] {
  const fallbackData: Record<string, SlangEntry[]> = {
    "Spanish-Dominican": [
      { word: "Tiguere", pronunciation: "tee-GEH-reh", meaning: "A street-smart, clever person; hustler", example: "Ese tiguere sabe cómo resolver", region: "Santo Domingo, DR", language: "Spanish", dialect: "Dominican", category: "personality", formality: "casual", source_creator: "bilingueblogs" },
      { word: "Vaina", pronunciation: "VAI-nah", meaning: "Thing, stuff, situation (universal filler word)", example: "Pásame esa vaina", region: "Dominican Republic", language: "Spanish", dialect: "Dominican", category: "general", formality: "casual", source_creator: "bilingueblogs" },
      { word: "Klok", pronunciation: "klok", meaning: "Cool, awesome, great", example: "Eso ta' klok", region: "Santo Domingo", language: "Spanish", dialect: "Dominican", category: "approval", formality: "slang", source_creator: "bilingueblogs" },
      { word: "Jevi", pronunciation: "HEH-vee", meaning: "Cool, nice, awesome (from 'heavy')", example: "La fiesta estuvo jevi", region: "Dominican Republic", language: "Spanish", dialect: "Dominican", category: "approval", formality: "casual" },
      { word: "Guapo/a", pronunciation: "GWAH-poh", meaning: "Angry, upset (NOT handsome like in other countries)", example: "No te pongas guapo conmigo", region: "Dominican Republic", language: "Spanish", dialect: "Dominican", category: "emotion", formality: "casual", source_creator: "dominicanspanish101" },
      { word: "Mango", pronunciation: "MAHN-goh", meaning: "An attractive person (not the fruit in this context)", example: "Ella es un mango", region: "Dominican Republic, Cuba", language: "Spanish", dialect: "Dominican", category: "appearance", formality: "casual" },
      { word: "Chin", pronunciation: "cheen", meaning: "A little bit, a small amount", example: "Dame un chin de agua", region: "Dominican Republic", language: "Spanish", dialect: "Dominican", category: "quantity", formality: "casual" },
      { word: "Pariguayo", pronunciation: "pah-ree-GWAH-yoh", meaning: "Someone who's lame, boring, or a party pooper", example: "No seas pariguayo, vamos a bailar", region: "Dominican Republic", language: "Spanish", dialect: "Dominican", category: "personality", formality: "slang" },
    ],
    "Spanish-Mexican": [
      { word: "Chido", pronunciation: "CHEE-doh", meaning: "Cool, awesome, great", example: "Está bien chido tu carro", region: "Mexico City", language: "Spanish", dialect: "Mexican", category: "approval", formality: "casual", source_creator: "spanishwithpaul" },
      { word: "Neta", pronunciation: "NEH-tah", meaning: "Truth, for real, seriously", example: "¿Neta? No te creo", region: "Mexico", language: "Spanish", dialect: "Mexican", category: "emphasis", formality: "casual" },
      { word: "Güey/Wey", pronunciation: "wey", meaning: "Dude, bro (friendly or insulting depending on tone)", example: "¿Qué onda, güey?", region: "Mexico", language: "Spanish", dialect: "Mexican", category: "address", formality: "slang", source_creator: "spanishwithpaul" },
      { word: "Chamba", pronunciation: "CHAHM-bah", meaning: "Job, work", example: "Tengo mucha chamba hoy", region: "Mexico", language: "Spanish", dialect: "Mexican", category: "work", formality: "casual" },
      { word: "Fresa", pronunciation: "FREH-sah", meaning: "Snobby, preppy, upper-class person", example: "Es muy fresa, solo va a restaurantes caros", region: "Mexico", language: "Spanish", dialect: "Mexican", category: "personality", formality: "casual" },
      { word: "No manches", pronunciation: "no MAHN-chehs", meaning: "No way! You're kidding! (mild exclamation)", example: "¡No manches! ¿En serio pasó eso?", region: "Mexico", language: "Spanish", dialect: "Mexican", category: "exclamation", formality: "casual" },
    ],
    "Spanish-Colombian": [
      { word: "Parcero/Parce", pronunciation: "par-SEH-roh", meaning: "Buddy, friend, bro", example: "¿Qué más, parce?", region: "Medellín, Colombia", language: "Spanish", dialect: "Colombian", category: "address", formality: "casual" },
      { word: "Bacano", pronunciation: "bah-KAH-noh", meaning: "Cool, awesome, great", example: "¡Qué bacano que viniste!", region: "Colombia", language: "Spanish", dialect: "Colombian", category: "approval", formality: "casual" },
      { word: "Chimba", pronunciation: "CHEEM-bah", meaning: "Amazing, awesome (can also be vulgar depending on context)", example: "Esa película es una chimba", region: "Medellín", language: "Spanish", dialect: "Colombian", category: "approval", formality: "slang" },
      { word: "Berraco/a", pronunciation: "beh-RRAH-koh", meaning: "Tough, badass, impressive person", example: "Ella es muy berraca en los negocios", region: "Colombia", language: "Spanish", dialect: "Colombian", category: "personality", formality: "casual" },
    ],
    "Spanish-Venezuelan": [
      { word: "Chévere", pronunciation: "CHEH-veh-reh", meaning: "Cool, awesome, great", example: "¡Qué chévere que viniste!", region: "Venezuela", language: "Spanish", dialect: "Venezuelan", category: "approval", formality: "casual", source_creator: "spanishteacher_venezuela" },
      { word: "Pana", pronunciation: "PAH-nah", meaning: "Friend, buddy, homie", example: "¿Qué hubo, pana?", region: "Venezuela", language: "Spanish", dialect: "Venezuelan", category: "address", formality: "casual" },
      { word: "Ladilla", pronunciation: "lah-DEE-yah", meaning: "Annoying person or situation", example: "No seas ladilla, déjame en paz", region: "Venezuela", language: "Spanish", dialect: "Venezuelan", category: "personality", formality: "slang" },
      { word: "Burda", pronunciation: "BOOR-dah", meaning: "A lot, very, extremely (intensifier)", example: "Eso está burda de bueno", region: "Venezuela", language: "Spanish", dialect: "Venezuelan", category: "emphasis", formality: "casual" },
    ],
    "French-Parisian": [
      { word: "Kiffer", pronunciation: "kee-FAY", meaning: "To love, to really like something", example: "Je kiffe cette chanson", region: "Paris, France", language: "French", dialect: "Parisian", category: "emotion", formality: "slang", source_creator: "innerfrench" },
      { word: "Meuf", pronunciation: "muhf", meaning: "Girl, woman (verlan of 'femme')", example: "C'est une meuf cool", region: "France", language: "French", dialect: "Parisian", category: "address", formality: "slang" },
      { word: "Ouf", pronunciation: "oof", meaning: "Crazy, insane (verlan of 'fou')", example: "C'est ouf ce film!", region: "France", language: "French", dialect: "Parisian", category: "exclamation", formality: "slang" },
      { word: "Chanmé", pronunciation: "shahn-MAY", meaning: "Amazing, incredible (verlan of 'méchant')", example: "La soirée était chanmé", region: "Paris", language: "French", dialect: "Parisian", category: "approval", formality: "slang" },
      { word: "Relou", pronunciation: "ruh-LOO", meaning: "Annoying, irritating (verlan of 'lourd')", example: "Il est trop relou ce mec", region: "France", language: "French", dialect: "Parisian", category: "personality", formality: "slang" },
    ],
    "Portuguese-Brazilian": [
      { word: "Maneiro", pronunciation: "mah-NAY-roh", meaning: "Cool, awesome", example: "Esse lugar é muito maneiro", region: "Rio de Janeiro", language: "Portuguese", dialect: "Brazilian", category: "approval", formality: "casual" },
      { word: "Mano/Mana", pronunciation: "MAH-noh", meaning: "Bro, dude, friend", example: "E aí, mano, beleza?", region: "São Paulo", language: "Portuguese", dialect: "Brazilian", category: "address", formality: "casual" },
      { word: "Gata/Gato", pronunciation: "GAH-tah", meaning: "Hot person, attractive (literally 'cat')", example: "Aquela mina é muito gata", region: "Brazil", language: "Portuguese", dialect: "Brazilian", category: "appearance", formality: "casual" },
      { word: "Firmeza", pronunciation: "feer-MEH-zah", meaning: "All good, solid, agreed", example: "Firmeza, te vejo lá", region: "São Paulo", language: "Portuguese", dialect: "Brazilian", category: "agreement", formality: "slang" },
    ],
    "Japanese-Standard": [
      { word: "ヤバい (Yabai)", pronunciation: "yah-BAI", meaning: "Amazing/terrible/crazy (context-dependent youth slang)", example: "このラーメンヤバい！", region: "Tokyo", language: "Japanese", dialect: "Standard", category: "exclamation", formality: "casual" },
      { word: "マジ (Maji)", pronunciation: "MAH-jee", meaning: "Seriously? For real?", example: "マジで？信じられない", region: "Japan", language: "Japanese", dialect: "Standard", category: "emphasis", formality: "casual" },
      { word: "ウザい (Uzai)", pronunciation: "oo-ZAI", meaning: "Annoying, irritating", example: "あいつマジウザい", region: "Japan", language: "Japanese", dialect: "Standard", category: "personality", formality: "slang" },
      { word: "エモい (Emoi)", pronunciation: "eh-MOI", meaning: "Emotional, nostalgic, touching (from English 'emo')", example: "この曲エモいね", region: "Japan", language: "Japanese", dialect: "Standard", category: "emotion", formality: "casual" },
    ],
    "Korean-Standard": [
      { word: "대박 (Daebak)", pronunciation: "DAE-bahk", meaning: "Amazing! Jackpot! Wow!", example: "대박! 시험 합격했어!", region: "South Korea", language: "Korean", dialect: "Standard", category: "exclamation", formality: "casual" },
      { word: "헐 (Heol)", pronunciation: "huhl", meaning: "OMG, no way (expression of shock)", example: "헐, 진짜?", region: "South Korea", language: "Korean", dialect: "Standard", category: "exclamation", formality: "casual" },
      { word: "꿀잼 (Kkuljaem)", pronunciation: "kkul-JAEM", meaning: "Super fun/entertaining (honey + fun)", example: "이 드라마 꿀잼이야", region: "South Korea", language: "Korean", dialect: "Standard", category: "approval", formality: "slang" },
    ],
    "Arabic-Egyptian": [
      { word: "يلا (Yalla)", pronunciation: "YAL-lah", meaning: "Let's go! Come on! Hurry up!", example: "يلا نروح السينما", region: "Egypt, Middle East", language: "Arabic", dialect: "Egyptian", category: "exclamation", formality: "casual" },
      { word: "حبيبي (Habibi)", pronunciation: "ha-BEE-bee", meaning: "My love / bro / dear (context-dependent)", example: "كيفك حبيبي؟", region: "Arab world", language: "Arabic", dialect: "Egyptian", category: "address", formality: "casual" },
      { word: "عالبركة (Aal baraka)", pronunciation: "aal ba-RA-ka", meaning: "Wing it, hope for the best, YOLO", example: "مش عارف هعمل إيه، عالبركة", region: "Egypt", language: "Arabic", dialect: "Egyptian", category: "attitude", formality: "casual" },
    ],
    "Haitian Creole-Standard": [
      { word: "Sak pase", pronunciation: "sahk pah-SAY", meaning: "What's up? What's happening?", example: "Sak pase, zanmi?", region: "Haiti", language: "Haitian Creole", dialect: "Standard", category: "greeting", formality: "casual" },
      { word: "N'ap boule", pronunciation: "nahp boo-LAY", meaning: "We're hanging in there (response to Sak pase)", example: "N'ap boule, tout bagay anfòm", region: "Haiti", language: "Haitian Creole", dialect: "Standard", category: "greeting", formality: "casual" },
      { word: "Degage", pronunciation: "day-gah-JAY", meaning: "To hustle, get by, manage", example: "M'ap degage pou fanmi mwen", region: "Haiti", language: "Haitian Creole", dialect: "Standard", category: "survival", formality: "casual" },
      { word: "Koze", pronunciation: "koh-ZAY", meaning: "Talk, gossip, conversation / drama", example: "Gen anpil koze nan katye a", region: "Haiti", language: "Haitian Creole", dialect: "Standard", category: "social", formality: "casual" },
    ],
    "English-AAVE": [
      { word: "Bussin", pronunciation: "BUH-sin", meaning: "Really good, delicious, amazing", example: "This food is bussin fr fr", region: "USA", language: "English", dialect: "AAVE", category: "approval", formality: "slang" },
      { word: "No cap", pronunciation: "no kap", meaning: "No lie, for real, I'm serious", example: "That concert was fire, no cap", region: "USA", language: "English", dialect: "AAVE", category: "emphasis", formality: "slang" },
      { word: "Slay", pronunciation: "slay", meaning: "To do something exceptionally well", example: "She slayed that presentation", region: "USA", language: "English", dialect: "AAVE", category: "approval", formality: "slang" },
      { word: "Bet", pronunciation: "bet", meaning: "Okay, agreed, sounds good", example: "Wanna grab food? Bet.", region: "USA", language: "English", dialect: "AAVE", category: "agreement", formality: "slang" },
      { word: "Finna", pronunciation: "FIH-nah", meaning: "About to, going to (fixing to)", example: "I'm finna leave", region: "USA", language: "English", dialect: "AAVE", category: "action", formality: "slang" },
    ],
    "Hindi-Standard": [
      { word: "Yaar", pronunciation: "yaar", meaning: "Friend, buddy, dude", example: "Yaar, chal na party chalte hain", region: "India", language: "Hindi", dialect: "Standard", category: "address", formality: "casual" },
      { word: "Jugaad", pronunciation: "joo-GAAD", meaning: "Creative hack, workaround, improvisation", example: "Koi jugaad lagao bhai", region: "India", language: "Hindi", dialect: "Standard", category: "resourcefulness", formality: "casual" },
      { word: "Bakwas", pronunciation: "bak-WAAS", meaning: "Nonsense, rubbish, BS", example: "Ye sab bakwas hai", region: "India", language: "Hindi", dialect: "Standard", category: "dismissal", formality: "casual" },
    ],
    "Swahili-Standard": [
      { word: "Poa", pronunciation: "POH-ah", meaning: "Cool, fine, good", example: "Mambo? Poa!", region: "Kenya, Tanzania", language: "Swahili", dialect: "Standard", category: "approval", formality: "casual" },
      { word: "Sawa", pronunciation: "SAH-wah", meaning: "Okay, alright, agreed", example: "Sawa, tutaonana kesho", region: "East Africa", language: "Swahili", dialect: "Standard", category: "agreement", formality: "casual" },
      { word: "Fiti", pronunciation: "FEE-tee", meaning: "Great, perfect, awesome", example: "Leo ni fiti sana!", region: "Kenya", language: "Swahili", dialect: "Standard", category: "approval", formality: "slang" },
    ],
  };

  const key = `${language}-${dialect || "Standard"}`;
  return fallbackData[key] || fallbackData[`${language}-Standard`] || [];
}
