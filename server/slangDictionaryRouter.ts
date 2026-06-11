/**
 * Slang Dictionary Router
 * Serves slang & expressions for ANY language from the knowledge base.
 * Auto-grows as the AI ingest pipeline discovers new expressions from
 * featured creators in each language.
 */
import { z } from "zod";
import { router, publicProcedure } from "./_core/trpc";
import { getKnowledge, getKnowledgeWithFallback } from "./teacherKnowledgeStore";

// ─── Types ───────────────────────────────────────────────────────────────────

interface ParsedSlangEntry {
  id: string;
  expression: string;
  literal: string;
  meaning: string;
  usage: string;
  example: string;
  exampleTranslation: string;
  formality: "very informal" | "informal" | "neutral" | "formal";
  category: string;
  source: string;
}

// ─── Slang Parsing ───────────────────────────────────────────────────────────

/**
 * Parses slang entries from knowledge base transcripts.
 * The auto-ingest pipeline stores structured slang data in a specific format
 * within the transcript field. This parser extracts those entries.
 */
function parseSlangFromTranscript(transcript: string, source: string): ParsedSlangEntry[] {
  const entries: ParsedSlangEntry[] = [];

  // Pattern 1: Structured format from slang extraction prompts
  // "Expression: ... | Literal: ... | Meaning: ... | Usage: ... | Formality: ..."
  const structuredPattern = /Expression:\s*(.+?)\s*\|\s*Literal:\s*(.+?)\s*\|\s*Meaning:\s*(.+?)\s*\|\s*Usage:\s*(.+?)\s*\|\s*Formality:\s*(.+?)(?:\n|$)/gi;
  let match;
  while ((match = structuredPattern.exec(transcript)) !== null) {
    entries.push({
      id: `kb_${entries.length}_${Date.now()}`,
      expression: match[1].trim(),
      literal: match[2].trim(),
      meaning: match[3].trim(),
      usage: match[4].trim(),
      example: "",
      exampleTranslation: "",
      formality: categorizeFormality(match[5]?.trim() || "informal"),
      category: guessCategory(match[1].trim(), match[3].trim()),
      source,
    });
  }

  // Pattern 2: Bullet-point format
  // "• Expression — Meaning"
  const bulletPattern = /[•\-]\s*(.+?)\s*[—–-]\s*(.+?)(?:\n|$)/g;
  while ((match = bulletPattern.exec(transcript)) !== null) {
    const expression = match[1].trim();
    const meaning = match[2].trim();
    if (entries.some(e => e.expression.toLowerCase() === expression.toLowerCase())) continue;
    entries.push({
      id: `kb_${entries.length}_${Date.now()}`,
      expression,
      literal: expression,
      meaning,
      usage: "Common expression",
      example: "",
      exampleTranslation: "",
      formality: "informal",
      category: guessCategory(expression, meaning),
      source,
    });
  }

  // Pattern 3: JSON-like entries (from LLM structured output)
  try {
    const jsonMatch = transcript.match(/\[[\s\S]*?\]/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      if (Array.isArray(parsed)) {
        for (const item of parsed) {
          if (item.expression && item.meaning) {
            if (entries.some(e => e.expression.toLowerCase() === item.expression.toLowerCase())) continue;
            entries.push({
              id: `kb_${entries.length}_${Date.now()}`,
              expression: item.expression,
              literal: item.literal || item.expression,
              meaning: item.meaning || item.actual_meaning,
              usage: item.usage || item.context || "Common expression",
              example: item.example || "",
              exampleTranslation: item.example_translation || item.translation || "",
              formality: categorizeFormality(item.formality || "informal"),
              category: guessCategory(item.expression, item.meaning),
              source,
            });
          }
        }
      }
    }
  } catch (e) {
    // JSON parse failed, skip
  }

  return entries;
}

function categorizeFormality(raw: string): "very informal" | "informal" | "neutral" | "formal" {
  const lower = raw.toLowerCase();
  if (lower.includes("very") || lower.includes("muy") || lower.includes("street")) return "very informal";
  if (lower.includes("informal") || lower.includes("casual")) return "informal";
  if (lower.includes("formal")) return "formal";
  return "neutral";
}

function guessCategory(expression: string, meaning: string): string {
  const text = `${expression} ${meaning}`.toLowerCase();
  if (text.match(/hello|hi|greet|hey|what.?s up|qué lo|bonjour|ohayo|namaste|annyeong/)) return "Greetings";
  if (text.match(/food|eat|drink|rice|chicken|plat|delicious|tasty|yummy|bussin/)) return "Food";
  if (text.match(/friend|bro|dude|guy|girl|pana|loco|mate|homie|buddy/)) return "People";
  if (text.match(/good|bad|cool|nice|ugly|beautiful|feo|bonit|awesome|amazing|great/)) return "Adjectives";
  if (text.match(/go|come|run|walk|drive|move|vamo|leave|head out/)) return "Actions";
  if (text.match(/wow|damn|omg|dios|diab|no way|incredible|unbelievable/)) return "Exclamations";
  if (text.match(/ok|fine|yes|no|sure|yeah|tá to|agree|bet|deal/)) return "Responses";
  if (text.match(/party|dance|drink|club|night|fiesta|bar|rave/)) return "Nightlife";
  if (text.match(/money|cash|pay|buy|sell|cuarto|peso|expensive|cheap/)) return "Money";
  if (text.match(/car|bus|taxi|ride|guagua|train|uber/)) return "Transport";
  if (text.match(/love|date|kiss|relationship|crush|ghost|flirt/)) return "Relationships";
  if (text.match(/work|job|hustle|grind|busy|office/)) return "Work";
  if (text.match(/text|message|dm|chat|online|social/)) return "Texting";
  return "Slang";
}

// ─── Language-aware fallback entries ─────────────────────────────────────────

const FALLBACK_ENTRIES: Record<string, ParsedSlangEntry> = {
  es: {
    id: "sotd_fallback_es",
    expression: "¿Qué lo que?",
    literal: "What the what?",
    meaning: "What's up? / How's it going?",
    usage: "Universal Dominican greeting among friends",
    example: "¡Oye! ¿Qué lo que, mi pana?",
    exampleTranslation: "Hey! What's up, my friend?",
    formality: "very informal",
    category: "Greetings",
    source: "spanishovertea",
  },
  en: {
    id: "sotd_fallback_en",
    expression: "No cap",
    literal: "No cap/lie",
    meaning: "For real / I'm not lying",
    usage: "Emphasizes you're being truthful (Gen Z slang)",
    example: "That concert was insane, no cap",
    exampleTranslation: "Ese concierto fue increíble, en serio",
    formality: "very informal",
    category: "Emphasis",
    source: "community",
  },
  fr: {
    id: "sotd_fallback_fr",
    expression: "C'est ouf",
    literal: "It's crazy (verlan of 'fou')",
    meaning: "That's crazy / unbelievable",
    usage: "Verlan (French slang inversion) expression of surprise",
    example: "T'as vu le match? C'était ouf!",
    exampleTranslation: "Did you see the game? It was crazy!",
    formality: "very informal",
    category: "Exclamations",
    source: "community",
  },
  pt: {
    id: "sotd_fallback_pt",
    expression: "Beleza",
    literal: "Beauty",
    meaning: "Okay / Cool / All good",
    usage: "Universal Brazilian acknowledgment",
    example: "Nos vemos às 8? — Beleza!",
    exampleTranslation: "See you at 8? — Cool!",
    formality: "informal",
    category: "Responses",
    source: "community",
  },
  ja: {
    id: "sotd_fallback_ja",
    expression: "やばい (Yabai)",
    literal: "Dangerous",
    meaning: "Amazing / Terrible / Crazy (context-dependent)",
    usage: "Universal youth slang that can mean extremely good or bad",
    example: "このラーメンやばい！",
    exampleTranslation: "This ramen is amazing!",
    formality: "very informal",
    category: "Adjectives",
    source: "community",
  },
  zh: {
    id: "sotd_fallback_zh",
    expression: "666 (liù liù liù)",
    literal: "Six six six",
    meaning: "Awesome / Skilled / Impressive",
    usage: "Internet slang praising someone's skill (sounds like '溜' = smooth)",
    example: "你打游戏真的666",
    exampleTranslation: "You're really skilled at gaming",
    formality: "very informal",
    category: "Compliments",
    source: "community",
  },
  hi: {
    id: "sotd_fallback_hi",
    expression: "जुगाड़ (Jugaad)",
    literal: "Hack/workaround",
    meaning: "Creative improvisation / innovative fix with limited resources",
    usage: "Describes the Indian spirit of finding clever solutions",
    example: "उसने जुगाड़ लगाकर AC बना लिया",
    exampleTranslation: "He made an AC using jugaad",
    formality: "informal",
    category: "Culture",
    source: "community",
  },
  ko: {
    id: "sotd_fallback_ko",
    expression: "대박 (Daebak)",
    literal: "Big hit/jackpot",
    meaning: "Awesome! / Amazing! / No way!",
    usage: "Exclamation of amazement or disbelief",
    example: "대박! 진짜로?",
    exampleTranslation: "No way! Really?",
    formality: "informal",
    category: "Exclamations",
    source: "community",
  },
  ar: {
    id: "sotd_fallback_ar",
    expression: "يلا (Yalla)",
    literal: "O God",
    meaning: "Let's go / Come on / Hurry up",
    usage: "Universal Arabic expression to encourage action",
    example: "يلا نروح!",
    exampleTranslation: "Let's go!",
    formality: "informal",
    category: "Actions",
    source: "community",
  },
  it: {
    id: "sotd_fallback_it",
    expression: "Boh",
    literal: "(no literal meaning)",
    meaning: "I don't know / Who knows / Whatever",
    usage: "Casual expression of uncertainty or indifference",
    example: "Dove vuoi mangiare? — Boh, decidi tu",
    exampleTranslation: "Where do you want to eat? — Dunno, you decide",
    formality: "informal",
    category: "Responses",
    source: "community",
  },
  de: {
    id: "sotd_fallback_de",
    expression: "Krass",
    literal: "Crass/extreme",
    meaning: "Crazy / Intense / Wow",
    usage: "Youth slang for something impressive or shocking",
    example: "Das war echt krass!",
    exampleTranslation: "That was really crazy!",
    formality: "informal",
    category: "Exclamations",
    source: "community",
  },
};

// ─── Router ──────────────────────────────────────────────────────────────────

export const slangDictionaryRouter = router({
  /**
   * Get slang entries from the knowledge base for any language/dialect.
   * Falls back to standard dialect if specific dialect has no entries.
   */
  getEntries: publicProcedure
    .input(z.object({
      language: z.string().default("spanish"),
      dialect: z.string().optional().default("standard"),
      limit: z.number().optional().default(100),
    }))
    .query(async ({ input }) => {
      const { language, dialect, limit } = input;

      // Get knowledge entries for the requested language/dialect
      const entries = getKnowledgeWithFallback(language, dialect || "standard");
      const allSlang: ParsedSlangEntry[] = [];

      for (const entry of entries) {
        if (!entry.transcript) continue;
        const sourceLabel = entry.platform || "community";
        const parsed = parseSlangFromTranscript(entry.transcript, sourceLabel);
        allSlang.push(...parsed);
      }

      // Deduplicate by expression
      const seen = new Set<string>();
      const unique = allSlang.filter(e => {
        const key = e.expression.toLowerCase().trim();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });

      // Sort by category, then expression
      unique.sort((a, b) => a.category.localeCompare(b.category) || a.expression.localeCompare(b.expression));

      return {
        entries: unique.slice(0, limit),
        total: unique.length,
        lastUpdated: new Date().toISOString(),
        sources: [...new Set(unique.map(e => e.source))],
        language,
        dialect,
      };
    }),

  /**
   * Get the "Expression of the Day" — deterministic based on date + language.
   * Each language gets its own expression of the day.
   */
  slangOfTheDay: publicProcedure
    .input(z.object({
      language: z.string().default("spanish"),
      dialect: z.string().optional().default("standard"),
    }).optional())
    .query(async ({ input }) => {
      const language = input?.language || "spanish";
      const dialect = input?.dialect || "standard";

      // Get entries for the requested language
      const entries = getKnowledgeWithFallback(language, dialect);
      const allSlang: ParsedSlangEntry[] = [];

      for (const entry of entries) {
        if (!entry.transcript) continue;
        const sourceLabel = entry.platform || "community";
        const parsed = parseSlangFromTranscript(entry.transcript, sourceLabel);
        allSlang.push(...parsed);
      }

      // Deduplicate
      const seen = new Set<string>();
      const unique = allSlang.filter(e => {
        const key = e.expression.toLowerCase().trim();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });

      if (unique.length === 0) {
        // Return a language-appropriate fallback
        const langCode = languageToCode(language);
        const fallback = FALLBACK_ENTRIES[langCode] || FALLBACK_ENTRIES["es"];
        return { entry: fallback, dayIndex: 0, language, dialect };
      }

      // Deterministic selection based on day of year
      const now = new Date();
      const dayOfYear = Math.floor((now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 86400000);
      const index = dayOfYear % unique.length;

      return {
        entry: unique[index],
        dayIndex: dayOfYear,
        language,
        dialect,
      };
    }),
});

// ─── Helpers ─────────────────────────────────────────────────────────────────

function languageToCode(language: string): string {
  const map: Record<string, string> = {
    spanish: "es", english: "en", french: "fr", portuguese: "pt",
    japanese: "ja", mandarin: "zh", chinese: "zh", hindi: "hi",
    korean: "ko", arabic: "ar", italian: "it", german: "de",
  };
  return map[language.toLowerCase()] || "es";
}
