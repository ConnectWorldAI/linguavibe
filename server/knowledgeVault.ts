/**
 * Knowledge Vault — Persistent storage engine for ALL scraped/generated content.
 * 
 * Everything that gets scraped, translated, generated, or learned goes here.
 * This is OUR data source — we own every word, meaning, and cultural note.
 * 
 * Connects to:
 * - Translator: stores every translation + slang discovered
 * - Creator Content Engine: stores all generated lessons, songs, content
 * - Airtable: syncs creator knowledge bidirectionally
 * - Adaptive Exercises: pulls vocab from the vault for exercises
 */

import { z } from "zod";
import { publicProcedure, router } from "./_core/trpc";
import { getDb } from "./db";

// Lazy db accessor - knowledgeVault uses `db` throughout, so we create a proxy
const db = new Proxy({} as any, {
  get: (_target, prop) => {
    return (...args: any[]) => getDb().then((realDb: any) => realDb[prop](...args));
  }
});
import {
  vocabBank,
  slangVault,
  translationArchive,
  songLibrary,
  creatorKnowledge,
  lessonArchive,
  contentArchive,
  culturalKnowledge,
} from "../drizzle/schema";
import { eq, like, and, desc, sql } from "drizzle-orm";
import {
  guardrails,
  normalizeLanguage,
  normalizeDialect,
  isValidLanguage,
  filterSlangByLanguageAndDialect,
  filterVocabByLanguage,
} from "./languageGuardrails";

// ═══════════════════════════════════════════════════════════════════════════════
// VAULT WRITE OPERATIONS — Called by other modules to store data
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Store a vocab word in the vault. Called by translator, lesson generator, etc.
 */
async function storeVocab(entry: {
  word: string;
  meaning: string;
  pronunciation?: string;
  partOfSpeech?: string;
  language: string;
  dialect?: string;
  region?: string;
  cefrLevel?: string;
  category?: string;
  exampleSentence?: string;
  exampleTranslation?: string;
  culturalNote?: string;
  imagePrompt?: string;
  sourceCreator?: string;
  sourceUrl?: string;
  isSlang?: boolean;
}) {
  try {
    // ═══ GUARDRAIL: Normalize and validate language before storing ═══
    entry.language = normalizeLanguage(entry.language);
    entry.dialect = normalizeDialect(entry.dialect) || undefined;
    if (!entry.language) {
      console.warn("[KnowledgeVault] GUARDRAIL: Rejected vocab with no language:", entry.word);
      return null;
    }
    // Check if word already exists for this language+dialect
    const existing = await db.select().from(vocabBank)
      .where(and(
        eq(vocabBank.word, entry.word),
        eq(vocabBank.language, entry.language),
        entry.dialect ? eq(vocabBank.dialect, entry.dialect) : sql`1=1`
      ))
      .limit(1);

    if (existing.length > 0) {
      // Update existing entry with any new info
      await db.update(vocabBank)
        .set({
          meaning: entry.meaning || existing[0].meaning,
          pronunciation: entry.pronunciation || existing[0].pronunciation,
          culturalNote: entry.culturalNote || existing[0].culturalNote,
          imagePrompt: entry.imagePrompt || existing[0].imagePrompt,
          sourceCreator: entry.sourceCreator || existing[0].sourceCreator,
        })
        .where(eq(vocabBank.id, existing[0].id));
      return existing[0].id;
    }

    // Insert new vocab
    const [result] = await db.insert(vocabBank).values({
      word: entry.word,
      meaning: entry.meaning,
      pronunciation: entry.pronunciation || null,
      partOfSpeech: entry.partOfSpeech || null,
      language: entry.language,
      dialect: entry.dialect || null,
      region: entry.region || null,
      cefrLevel: entry.cefrLevel || null,
      category: entry.category || null,
      exampleSentence: entry.exampleSentence || null,
      exampleTranslation: entry.exampleTranslation || null,
      culturalNote: entry.culturalNote || null,
      imagePrompt: entry.imagePrompt || null,
      sourceCreator: entry.sourceCreator || null,
      sourceUrl: entry.sourceUrl || null,
      isSlang: entry.isSlang ? 1 : 0,
    });
    return result.insertId;
  } catch (e) {
    console.error("[KnowledgeVault] storeVocab error:", e);
    return null;
  }
}

/**
 * Store slang in the vault. Called by translator when it discovers slang.
 */
async function storeSlang(entry: {
  word: string;
  meaning: string;
  pronunciation?: string;
  language: string;
  dialect?: string;
  region?: string;
  formality?: string;
  usageContext?: string;
  exampleSentence?: string;
  exampleTranslation?: string;
  warningNote?: string;
  sourceCreator?: string;
  sourceUrl?: string;
  alternativeMeanings?: Array<{ region: string; meaning: string; context?: string }>;
}) {
  try {
    // ═══ GUARDRAIL: Normalize and validate language/dialect before storing slang ═══
    entry.language = normalizeLanguage(entry.language);
    entry.dialect = normalizeDialect(entry.dialect) || undefined;
    if (!entry.language) {
      console.warn("[KnowledgeVault] GUARDRAIL: Rejected slang with no language:", entry.word);
      return null;
    }
    const existing = await db.select().from(slangVault)
      .where(and(
        eq(slangVault.word, entry.word),
        eq(slangVault.language, entry.language),
        entry.dialect ? eq(slangVault.dialect, entry.dialect) : sql`1=1`
      ))
      .limit(1);

    if (existing.length > 0) {
      // Merge alternative meanings
      const existingAlts = (existing[0].alternativeMeanings as any[]) || [];
      const newAlts = entry.alternativeMeanings || [];
      const mergedAlts = [...existingAlts];
      for (const alt of newAlts) {
        if (!mergedAlts.find((a: any) => a.region === alt.region)) {
          mergedAlts.push(alt);
        }
      }
      await db.update(slangVault)
        .set({
          alternativeMeanings: mergedAlts,
          warningNote: entry.warningNote || existing[0].warningNote,
        })
        .where(eq(slangVault.id, existing[0].id));
      return existing[0].id;
    }

    const [result] = await db.insert(slangVault).values({
      word: entry.word,
      meaning: entry.meaning,
      pronunciation: entry.pronunciation || null,
      language: entry.language,
      dialect: entry.dialect || null,
      region: entry.region || null,
      formality: entry.formality || null,
      usageContext: entry.usageContext || null,
      exampleSentence: entry.exampleSentence || null,
      exampleTranslation: entry.exampleTranslation || null,
      warningNote: entry.warningNote || null,
      sourceCreator: entry.sourceCreator || null,
      sourceUrl: entry.sourceUrl || null,
      alternativeMeanings: entry.alternativeMeanings || null,
    });
    return result.insertId;
  } catch (e) {
    console.error("[KnowledgeVault] storeSlang error:", e);
    return null;
  }
}

/**
 * Store a translation in the archive. Called after every translation.
 */
async function storeTranslation(entry: {
  sourceText: string;
  translatedText: string;
  sourceLanguage: string;
  targetLanguage: string;
  targetDialect?: string;
  translationType?: string;
  slangUsed?: Array<{ word: string; meaning: string; region?: string }>;
  culturalNotes?: string;
  dialectVariants?: Array<{ dialect: string; translation: string }>;
  qualityScore?: number;
  userId?: number;
}) {
  try {
    // ═══ GUARDRAIL: Normalize languages before archiving ═══
    entry.sourceLanguage = normalizeLanguage(entry.sourceLanguage);
    entry.targetLanguage = normalizeLanguage(entry.targetLanguage);
    entry.targetDialect = normalizeDialect(entry.targetDialect) || undefined;

    const [result] = await db.insert(translationArchive).values({
      sourceText: entry.sourceText,
      translatedText: entry.translatedText,
      sourceLanguage: entry.sourceLanguage,
      targetLanguage: entry.targetLanguage,
      targetDialect: entry.targetDialect || null,
      translationType: entry.translationType || "text",
      slangUsed: entry.slangUsed || null,
      culturalNotes: entry.culturalNotes || null,
      dialectVariants: entry.dialectVariants || null,
      qualityScore: entry.qualityScore || null,
      userId: entry.userId || null,
    });

    // Also store any slang discovered during translation
    if (entry.slangUsed && entry.slangUsed.length > 0) {
      for (const slang of entry.slangUsed) {
        await storeSlang({
          word: slang.word,
          meaning: slang.meaning,
          language: entry.targetLanguage,
          dialect: entry.targetDialect,
          region: slang.region,
          formality: "casual",
        });
      }
    }

    return result.insertId;
  } catch (e) {
    console.error("[KnowledgeVault] storeTranslation error:", e);
    return null;
  }
}

/**
 * Store a generated song in the library.
 */
async function storeSong(entry: {
  title: string;
  titleEnglish?: string;
  language: string; // GUARDRAIL: Must be a valid language
  dialect?: string; // GUARDRAIL: Must be a valid dialect for the language
  genre?: string;
  mood?: string;
  tempo?: string;
  cefrLevel?: string;
  lyrics?: string;
  lyricsTranslation?: string;
  vocabTaught?: Array<{ word: string; meaning: string; lineReference?: string }>;
  sunoPrompt?: string;
  sunoTags?: string;
  audioUrl?: string;
  audioUrl2?: string;
  sunoJobId?: string;
  inspiredByCreator?: string;
  musicStyle?: string;
  teachingNotes?: string;
  isEntertainmentOnly?: boolean;
}) {
  try {
    // ═══ GUARDRAIL: Normalize and validate language before storing song ═══
    entry.language = normalizeLanguage(entry.language);
    entry.dialect = normalizeDialect(entry.dialect) || undefined;
    if (!entry.language) {
      console.warn("[KnowledgeVault] GUARDRAIL: Rejected song with no language:", entry.title);
      return null;
    }

    const [result] = await db.insert(songLibrary).values({
      title: entry.title,
      titleEnglish: entry.titleEnglish || null,
      language: entry.language,
      dialect: entry.dialect || null,
      genre: entry.genre || null,
      mood: entry.mood || null,
      tempo: entry.tempo || null,
      cefrLevel: entry.cefrLevel || null,
      lyrics: entry.lyrics || null,
      lyricsTranslation: entry.lyricsTranslation || null,
      vocabTaught: entry.vocabTaught || null,
      sunoPrompt: entry.sunoPrompt || null,
      sunoTags: entry.sunoTags || null,
      audioUrl: entry.audioUrl || null,
      audioUrl2: entry.audioUrl2 || null,
      sunoJobId: entry.sunoJobId || null,
      inspiredByCreator: entry.inspiredByCreator || null,
      musicStyle: entry.musicStyle || null,
      teachingNotes: entry.teachingNotes || null,
      isEntertainmentOnly: entry.isEntertainmentOnly ? 1 : 0,
    });

    // Also store vocab from the song into the vocab bank
    if (entry.vocabTaught) {
      for (const v of entry.vocabTaught) {
        await storeVocab({
          word: v.word,
          meaning: v.meaning,
          language: entry.language,
          dialect: entry.dialect,
          cefrLevel: entry.cefrLevel,
          category: "song_vocab",
          sourceCreator: entry.inspiredByCreator,
        });
      }
    }

    return result.insertId;
  } catch (e) {
    console.error("[KnowledgeVault] storeSong error:", e);
    return null;
  }
}

/**
 * Store a generated lesson in the archive.
 */
async function storeLesson(entry: {
  title: string;
  language: string; // GUARDRAIL: Must be a valid language
  dialect?: string; // GUARDRAIL: Must be a valid dialect for the language
  cefrLevel: string;
  category?: string;
  topic?: string;
  culturalContext?: string;
  exercises?: any;
  vocabTaught?: Array<{ word: string; pronunciation?: string; meaning: string }>;
  creatorMethodsUsed?: Array<{ creatorName: string; method: string }>;
  inspiredByCreators?: string[];
  totalXP?: number;
  qualityRating?: number;
}) {
  try {
    // ═══ GUARDRAIL: Normalize and validate language before storing lesson ═══
    entry.language = normalizeLanguage(entry.language);
    entry.dialect = normalizeDialect(entry.dialect) || undefined;
    if (!entry.language) {
      console.warn("[KnowledgeVault] GUARDRAIL: Rejected lesson with no language:", entry.title);
      return null;
    }

    const [result] = await db.insert(lessonArchive).values({
      title: entry.title,
      language: entry.language,
      dialect: entry.dialect || null,
      cefrLevel: entry.cefrLevel,
      category: entry.category || null,
      topic: entry.topic || null,
      culturalContext: entry.culturalContext || null,
      exercises: entry.exercises || null,
      vocabTaught: entry.vocabTaught || null,
      creatorMethodsUsed: entry.creatorMethodsUsed || null,
      inspiredByCreators: entry.inspiredByCreators || null,
      totalXP: entry.totalXP || 0,
      qualityRating: entry.qualityRating || null,
    });

    // Store vocab from the lesson
    if (entry.vocabTaught) {
      for (const v of entry.vocabTaught) {
        await storeVocab({
          word: v.word,
          meaning: v.meaning,
          pronunciation: v.pronunciation,
          language: entry.language,
          dialect: entry.dialect,
          cefrLevel: entry.cefrLevel,
          category: entry.category,
          sourceCreator: entry.inspiredByCreators?.[0],
        });
      }
    }

    return result.insertId;
  } catch (e) {
    console.error("[KnowledgeVault] storeLesson error:", e);
    return null;
  }
}

/**
 * Store creator knowledge — what we've learned from a creator.
 */
async function storeCreatorKnowledge(entry: {
  creatorName: string;
  handle?: string;
  platform?: string;
  airtableRecordId?: string;
  language?: string;
  region?: string;
  contentType?: string;
  teachingMethods?: Array<{ method: string; description: string; bestForLevels?: string[] }>;
  musicStyles?: Array<{ genre: string; tags?: string; mood?: string }>;
  topicsTaught?: Array<{ topic: string; level?: string; vocabWords?: string[] }>;
  slangContributed?: Array<{ word: string; meaning: string; region?: string }>;
  contentIdeas?: Array<{ title: string; format?: string; concept?: string }>;
}) {
  try {
    const existing = await db.select().from(creatorKnowledge)
      .where(eq(creatorKnowledge.creatorName, entry.creatorName))
      .limit(1);

    if (existing.length > 0) {
      // Merge knowledge
      const existingMethods = (existing[0].teachingMethods as any[]) || [];
      const existingStyles = (existing[0].musicStyles as any[]) || [];
      const existingTopics = (existing[0].topicsTeught as any[]) || [];
      const existingSlang = (existing[0].slangContributed as any[]) || [];
      const existingIdeas = (existing[0].contentIdeas as any[]) || [];

      await db.update(creatorKnowledge)
        .set({
          teachingMethods: [...existingMethods, ...(entry.teachingMethods || [])],
          musicStyles: [...existingStyles, ...(entry.musicStyles || [])],
          topicsTeught: [...existingTopics, ...(entry.topicsTaught || [])],
          slangContributed: [...existingSlang, ...(entry.slangContributed || [])],
          contentIdeas: [...existingIdeas, ...(entry.contentIdeas || [])],
          lastScrapedAt: new Date(),
        })
        .where(eq(creatorKnowledge.id, existing[0].id));
      return existing[0].id;
    }

    const [result] = await db.insert(creatorKnowledge).values({
      creatorName: entry.creatorName,
      handle: entry.handle || null,
      platform: entry.platform || null,
      airtableRecordId: entry.airtableRecordId || null,
      language: entry.language || null,
      region: entry.region || null,
      contentType: entry.contentType || null,
      teachingMethods: entry.teachingMethods || null,
      musicStyles: entry.musicStyles || null,
      topicsTeught: entry.topicsTaught || null,
      slangContributed: entry.slangContributed || null,
      contentIdeas: entry.contentIdeas || null,
    });
    return result.insertId;
  } catch (e) {
    console.error("[KnowledgeVault] storeCreatorKnowledge error:", e);
    return null;
  }
}

/**
 * Store cultural knowledge.
 */
async function storeCulturalKnowledge(entry: {
  topic: string;
  category?: string;
  language: string;
  region?: string;
  description: string;
  relatedVocab?: Array<{ word: string; pronunciation?: string; meaning: string }>;
  imagePrompt?: string;
  sourceCreator?: string;
  sourceUrl?: string;
  cefrLevel?: string;
}) {
  try {
    const [result] = await db.insert(culturalKnowledge).values({
      topic: entry.topic,
      category: entry.category || null,
      language: entry.language,
      region: entry.region || null,
      description: entry.description,
      relatedVocab: entry.relatedVocab || null,
      imagePrompt: entry.imagePrompt || null,
      sourceCreator: entry.sourceCreator || null,
      sourceUrl: entry.sourceUrl || null,
      cefrLevel: entry.cefrLevel || null,
    });
    return result.insertId;
  } catch (e) {
    console.error("[KnowledgeVault] storeCulturalKnowledge error:", e);
    return null;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// VAULT READ OPERATIONS — Called by lesson generator, translator, etc.
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Get vocab for a specific language, level, and category.
 */
async function getVocabForLesson(language: string, cefrLevel?: string, category?: string, limit = 20) {
  try {
    const conditions = [eq(vocabBank.language, language)];
    if (cefrLevel) conditions.push(eq(vocabBank.cefrLevel, cefrLevel));
    if (category) conditions.push(eq(vocabBank.category, category));

    return await db.select().from(vocabBank)
      .where(and(...conditions))
      .orderBy(desc(vocabBank.updatedAt))
      .limit(limit);
  } catch (e) {
    console.error("[KnowledgeVault] getVocabForLesson error:", e);
    return [];
  }
}

/**
 * Get slang for a specific language/dialect for the translator.
 */
async function getSlangForTranslation(language: string, dialect?: string, limit = 50) {
  try {
    const conditions = [eq(slangVault.language, language)];
    if (dialect) conditions.push(eq(slangVault.dialect, dialect));

    return await db.select().from(slangVault)
      .where(and(...conditions))
      .orderBy(desc(slangVault.trendScore))
      .limit(limit);
  } catch (e) {
    console.error("[KnowledgeVault] getSlangForTranslation error:", e);
    return [];
  }
}

/**
 * Get creator knowledge for a specific language to inform lesson/song generation.
 */
async function getCreatorMethodsForLanguage(language: string) {
  try {
    return await db.select().from(creatorKnowledge)
      .where(eq(creatorKnowledge.language, language));
  } catch (e) {
    console.error("[KnowledgeVault] getCreatorMethodsForLanguage error:", e);
    return [];
  }
}

/**
 * Get songs for a specific language/level for the music page.
 */
async function getSongsForLevel(language: string, cefrLevel?: string, limit = 20) {
  try {
    const conditions = [eq(songLibrary.language, language)];
    if (cefrLevel) conditions.push(eq(songLibrary.cefrLevel, cefrLevel));

    return await db.select().from(songLibrary)
      .where(and(...conditions))
      .orderBy(desc(songLibrary.createdAt))
      .limit(limit);
  } catch (e) {
    console.error("[KnowledgeVault] getSongsForLevel error:", e);
    return [];
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORT — Both the write functions (for other modules) and the tRPC router
// ═══════════════════════════════════════════════════════════════════════════════

// Export write functions for use by other server modules
export const vault = {
  storeVocab,
  storeSlang,
  storeTranslation,
  storeSong,
  storeLesson,
  storeCreatorKnowledge,
  storeCulturalKnowledge,
  getVocabForLesson,
  getSlangForTranslation,
  getCreatorMethodsForLanguage,
  getSongsForLevel,
};

// tRPC router for client-side access
export const knowledgeVaultRouter = router({
  // ─── Query vocab bank ────────────────────────────────────────────────
  getVocab: publicProcedure
    .input(z.object({
      language: z.string(),
      cefrLevel: z.string().optional(),
      category: z.string().optional(),
      search: z.string().optional(),
      limit: z.number().default(50),
    }))
    .query(async ({ input }) => {
      const conditions = [eq(vocabBank.language, input.language)];
      if (input.cefrLevel) conditions.push(eq(vocabBank.cefrLevel, input.cefrLevel));
      if (input.category) conditions.push(eq(vocabBank.category, input.category));
      if (input.search) conditions.push(like(vocabBank.word, `%${input.search}%`));

      const items = await db.select().from(vocabBank)
        .where(and(...conditions))
        .orderBy(desc(vocabBank.updatedAt))
        .limit(input.limit);

      return { items, total: items.length };
    }),

  // ─── Query slang vault ───────────────────────────────────────────────
  getSlang: publicProcedure
    .input(z.object({
      language: z.string(),
      dialect: z.string().optional(),
      search: z.string().optional(),
      limit: z.number().default(50),
    }))
    .query(async ({ input }) => {
      const conditions = [eq(slangVault.language, input.language)];
      if (input.dialect) conditions.push(eq(slangVault.dialect, input.dialect));
      if (input.search) conditions.push(like(slangVault.word, `%${input.search}%`));

      const items = await db.select().from(slangVault)
        .where(and(...conditions))
        .orderBy(desc(slangVault.trendScore))
        .limit(input.limit);

      return { items, total: items.length };
    }),

  // ─── Query song library ──────────────────────────────────────────────
  getSongs: publicProcedure
    .input(z.object({
      language: z.string().optional(),
      cefrLevel: z.string().optional(),
      genre: z.string().optional(),
      entertainmentOnly: z.boolean().optional(),
      limit: z.number().default(20),
    }))
    .query(async ({ input }) => {
      const conditions: any[] = [];
      if (input.language) conditions.push(eq(songLibrary.language, input.language));
      if (input.cefrLevel) conditions.push(eq(songLibrary.cefrLevel, input.cefrLevel));
      if (input.genre) conditions.push(eq(songLibrary.genre, input.genre));
      if (input.entertainmentOnly !== undefined) {
        conditions.push(eq(songLibrary.isEntertainmentOnly, input.entertainmentOnly ? 1 : 0));
      }

      const items = await db.select().from(songLibrary)
        .where(conditions.length > 0 ? and(...conditions) : sql`1=1`)
        .orderBy(desc(songLibrary.createdAt))
        .limit(input.limit);

      return { items, total: items.length };
    }),

  // ─── Query creator knowledge ─────────────────────────────────────────
  getCreators: publicProcedure
    .input(z.object({
      language: z.string().optional(),
      contentType: z.string().optional(),
    }))
    .query(async ({ input }) => {
      const conditions: any[] = [];
      if (input.language) conditions.push(eq(creatorKnowledge.language, input.language));
      if (input.contentType) conditions.push(eq(creatorKnowledge.contentType, input.contentType));

      const items = await db.select().from(creatorKnowledge)
        .where(conditions.length > 0 ? and(...conditions) : sql`1=1`)
        .orderBy(desc(creatorKnowledge.updatedAt));

      return { items, total: items.length };
    }),

  // ─── Query translation archive ───────────────────────────────────────
  getTranslations: publicProcedure
    .input(z.object({
      targetLanguage: z.string().optional(),
      limit: z.number().default(20),
    }))
    .query(async ({ input }) => {
      const conditions: any[] = [];
      if (input.targetLanguage) conditions.push(eq(translationArchive.targetLanguage, input.targetLanguage));

      const items = await db.select().from(translationArchive)
        .where(conditions.length > 0 ? and(...conditions) : sql`1=1`)
        .orderBy(desc(translationArchive.createdAt))
        .limit(input.limit);

      return { items, total: items.length };
    }),

  // ─── Vault stats ─────────────────────────────────────────────────────
  getStats: publicProcedure.query(async () => {
    const [vocabCount] = await db.select({ count: sql<number>`count(*)` }).from(vocabBank);
    const [slangCount] = await db.select({ count: sql<number>`count(*)` }).from(slangVault);
    const [translationCount] = await db.select({ count: sql<number>`count(*)` }).from(translationArchive);
    const [songCount] = await db.select({ count: sql<number>`count(*)` }).from(songLibrary);
    const [lessonCount] = await db.select({ count: sql<number>`count(*)` }).from(lessonArchive);
    const [creatorCount] = await db.select({ count: sql<number>`count(*)` }).from(creatorKnowledge);
    const [contentCount] = await db.select({ count: sql<number>`count(*)` }).from(contentArchive);
    const [culturalCount] = await db.select({ count: sql<number>`count(*)` }).from(culturalKnowledge);

    return {
      vocabWords: vocabCount.count,
      slangTerms: slangCount.count,
      translations: translationCount.count,
      songs: songCount.count,
      lessons: lessonCount.count,
      creators: creatorCount.count,
      contentPieces: contentCount.count,
      culturalFacts: culturalCount.count,
    };
  }),

  // ─── Bulk import vocab (for seeding from Airtable/creators) ──────────
  bulkImportVocab: publicProcedure
    .input(z.object({
      items: z.array(z.object({
        word: z.string(),
        meaning: z.string(),
        pronunciation: z.string().optional(),
        partOfSpeech: z.string().optional(),
        language: z.string(),
        dialect: z.string().optional(),
        region: z.string().optional(),
        cefrLevel: z.string().optional(),
        category: z.string().optional(),
        exampleSentence: z.string().optional(),
        exampleTranslation: z.string().optional(),
        culturalNote: z.string().optional(),
        imagePrompt: z.string().optional(),
        sourceCreator: z.string().optional(),
        isSlang: z.boolean().optional(),
      })),
    }))
    .mutation(async ({ input }) => {
      let imported = 0;
      for (const item of input.items) {
        const id = await storeVocab(item);
        if (id) imported++;
      }
      return { imported, total: input.items.length };
    }),

  // ─── Push generated songs to Airtable "Song Library" table ──────────
  pushSongsToAirtable: publicProcedure
    .input(z.object({ limit: z.number().default(50) }))
    .mutation(async ({ input }) => {
      const apiKey = process.env.AIRTABLE_API_KEY;
      const baseId = process.env.AIRTABLE_BASE_ID;
      if (!apiKey || !baseId) return { pushed: 0, error: "Missing Airtable credentials" };

      try {
        const songs = await db.select().from(songLibrary)
          .orderBy(desc(songLibrary.createdAt))
          .limit(input.limit);

        let pushed = 0;
        for (const song of songs) {
          await fetch(`https://api.airtable.com/v0/${baseId}/Song%20Library`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${apiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              fields: {
                "Title": song.title,
                "Title (English)": song.titleEnglish || "",
                "Language": song.language,
                "Dialect": song.dialect || "",
                "Genre": song.genre || "",
                "Mood": song.mood || "",
                "CEFR Level": song.cefrLevel || "",
                "Lyrics": song.lyrics || "",
                "Lyrics Translation": song.lyricsTranslation || "",
                "Suno Prompt": song.sunoPrompt || "",
                "Audio URL": song.audioUrl || "",
                "Inspired By": song.inspiredByCreator || "",
                "Music Style": song.musicStyle || "",
                "Teaching Notes": song.teachingNotes || "",
                "Entertainment Only": song.isEntertainmentOnly === 1,
                "Vocab Taught": JSON.stringify(song.vocabTaught || []),
              },
            }),
          });
          pushed++;
        }
        return { pushed, total: songs.length };
      } catch (e: any) {
        return { pushed: 0, error: e.message };
      }
    }),

  // ─── Push generated lessons to Airtable "Lesson Archive" table ──────
  pushLessonsToAirtable: publicProcedure
    .input(z.object({ limit: z.number().default(50) }))
    .mutation(async ({ input }) => {
      const apiKey = process.env.AIRTABLE_API_KEY;
      const baseId = process.env.AIRTABLE_BASE_ID;
      if (!apiKey || !baseId) return { pushed: 0, error: "Missing Airtable credentials" };

      try {
        const lessons = await db.select().from(lessonArchive)
          .orderBy(desc(lessonArchive.createdAt))
          .limit(input.limit);

        let pushed = 0;
        for (const lesson of lessons) {
          await fetch(`https://api.airtable.com/v0/${baseId}/Lesson%20Archive`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${apiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              fields: {
                "Title": lesson.title,
                "Language": lesson.language,
                "Dialect": lesson.dialect || "",
                "CEFR Level": lesson.cefrLevel,
                "Category": lesson.category || "",
                "Topic": lesson.topic || "",
                "Cultural Context": lesson.culturalContext || "",
                "Creator Methods Used": JSON.stringify(lesson.creatorMethodsUsed || []),
                "Inspired By": JSON.stringify(lesson.inspiredByCreators || []),
                "Total XP": lesson.totalXP || 0,
                "Vocab Taught": JSON.stringify(lesson.vocabTaught || []),
                "Exercises": JSON.stringify(lesson.exercises || []),
              },
            }),
          });
          pushed++;
        }
        return { pushed, total: lessons.length };
      } catch (e: any) {
        return { pushed: 0, error: e.message };
      }
    }),

  // ─── Push vocab bank to Airtable "Vocab Bank" table ─────────────────
  pushVocabToAirtable: publicProcedure
    .input(z.object({ language: z.string(), limit: z.number().default(200) }))
    .mutation(async ({ input }) => {
      const apiKey = process.env.AIRTABLE_API_KEY;
      const baseId = process.env.AIRTABLE_BASE_ID;
      if (!apiKey || !baseId) return { pushed: 0, error: "Missing Airtable credentials" };

      try {
        const vocab = await db.select().from(vocabBank)
          .where(eq(vocabBank.language, input.language))
          .orderBy(desc(vocabBank.updatedAt))
          .limit(input.limit);

        // Airtable batch create (max 10 per request)
        let pushed = 0;
        for (let i = 0; i < vocab.length; i += 10) {
          const batch = vocab.slice(i, i + 10);
          await fetch(`https://api.airtable.com/v0/${baseId}/Vocab%20Bank`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${apiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              records: batch.map((v: any) => ({
                fields: {
                  "Word": v.word,
                  "Meaning": v.meaning,
                  "Pronunciation": v.pronunciation || "",
                  "Part of Speech": v.partOfSpeech || "",
                  "Language": v.language,
                  "Dialect": v.dialect || "",
                  "Region": v.region || "",
                  "CEFR Level": v.cefrLevel || "",
                  "Category": v.category || "",
                  "Example Sentence": v.exampleSentence || "",
                  "Example Translation": v.exampleTranslation || "",
                  "Cultural Note": v.culturalNote || "",
                  "Image Prompt": v.imagePrompt || "",
                  "Source Creator": v.sourceCreator || "",
                  "Is Slang": v.isSlang === 1,
                },
              })),
            }),
          });
          pushed += batch.length;
        }
        return { pushed, total: vocab.length };
      } catch (e: any) {
        return { pushed: 0, error: e.message };
      }
    }),

  // ─── Push slang vault to Airtable "Slang Vault" table ───────────────
  pushSlangToAirtable: publicProcedure
    .input(z.object({ language: z.string(), limit: z.number().default(200) }))
    .mutation(async ({ input }) => {
      const apiKey = process.env.AIRTABLE_API_KEY;
      const baseId = process.env.AIRTABLE_BASE_ID;
      if (!apiKey || !baseId) return { pushed: 0, error: "Missing Airtable credentials" };

      try {
        const slang = await db.select().from(slangVault)
          .where(eq(slangVault.language, input.language))
          .orderBy(desc(slangVault.trendScore))
          .limit(input.limit);

        let pushed = 0;
        for (let i = 0; i < slang.length; i += 10) {
          const batch = slang.slice(i, i + 10);
          await fetch(`https://api.airtable.com/v0/${baseId}/Slang%20Vault`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${apiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              records: batch.map((s: any) => ({
                fields: {
                  "Word": s.word,
                  "Meaning": s.meaning,
                  "Formal Equivalent": s.formalEquivalent || "",
                  "Language": s.language,
                  "Dialect": s.dialect || "",
                  "Region": s.region || "",
                  "Usage Context": s.usageContext || "",
                  "Example": s.exampleSentence || "",
                  "Example Translation": s.exampleTranslation || "",
                  "Trend Score": s.trendScore || 50,
                  "Source Creator": s.sourceCreator || "",
                  "CEFR Level": s.cefrLevel || "",
                },
              })),
            }),
          });
          pushed += batch.length;
        }
        return { pushed, total: slang.length };
      } catch (e: any) {
        return { pushed: 0, error: e.message };
      }
    }),

  // ─── Full bidirectional sync — pull from Airtable + push back ───────
  fullSync: publicProcedure.mutation(async () => {
    const results: Record<string, any> = {};

    // 1. Pull creators from Airtable → DB
    const apiKey = process.env.AIRTABLE_API_KEY;
    const baseId = process.env.AIRTABLE_BASE_ID;
    if (!apiKey || !baseId) return { error: "Missing Airtable credentials" };

    try {
      const url = `https://api.airtable.com/v0/${baseId}/Creators?maxRecords=100`;
      const resp = await fetch(url, {
        headers: { Authorization: `Bearer ${apiKey}` },
      });
      const data = await resp.json() as any;
      let synced = 0;
      for (const record of data.records || []) {
        const f = record.fields;
        await storeCreatorKnowledge({
          creatorName: f["Name"] || "Unknown",
          handle: f["Instagram Handle"] || f["Handle"] || "",
          platform: f["Platform"] || "Instagram",
          airtableRecordId: record.id,
          language: f["Language"] || "Spanish",
          region: f["Country/Region"] || f["Region"] || "",
          contentType: Array.isArray(f["Content Style"]) ? f["Content Style"][0] : f["Content Style"] || "Educational",
        });
        synced++;
      }
      results.creatorsPulled = synced;
    } catch (e: any) {
      results.creatorsPullError = e.message;
    }

    // 2. Get vault stats
    const [vc] = await db.select({ count: sql<number>`count(*)` }).from(vocabBank);
    const [sc] = await db.select({ count: sql<number>`count(*)` }).from(slangVault);
    const [lc] = await db.select({ count: sql<number>`count(*)` }).from(lessonArchive);
    const [sgc] = await db.select({ count: sql<number>`count(*)` }).from(songLibrary);

    results.vaultStats = {
      vocabWords: vc.count,
      slangTerms: sc.count,
      lessons: lc.count,
      songs: sgc.count,
    };

    return results;
  }),

  // ─── Sync creators from Airtable to Knowledge Vault DB ──────────────
  syncCreatorsFromAirtable: publicProcedure.mutation(async () => {
    const apiKey = process.env.AIRTABLE_API_KEY;
    const baseId = process.env.AIRTABLE_BASE_ID;
    if (!apiKey || !baseId) {
      return { synced: 0, error: "Missing Airtable credentials" };
    }

    try {
      const url = `https://api.airtable.com/v0/${baseId}/Creators?maxRecords=100`;
      const resp = await fetch(url, {
        headers: { Authorization: `Bearer ${apiKey}` },
      });
      const data = await resp.json() as any;

      let synced = 0;
      for (const record of data.records || []) {
        const f = record.fields;
        await storeCreatorKnowledge({
          creatorName: f["Name"] || "Unknown",
          handle: f["Instagram Handle"] || f["Handle"] || "",
          platform: f["Platform"] || "Instagram",
          airtableRecordId: record.id,
          language: f["Language"] || "Spanish",
          region: f["Country/Region"] || f["Region"] || "",
          contentType: Array.isArray(f["Content Style"]) ? f["Content Style"][0] : f["Content Style"] || "Educational",
          teachingMethods: f["Teaching Methods"] ? JSON.parse(f["Teaching Methods"]) : undefined,
          contentIdeas: f["Content Ideas"] ? JSON.parse(f["Content Ideas"]) : undefined,
        });
        synced++;
      }

      return { synced, total: data.records?.length || 0 };
    } catch (e: any) {
      return { synced: 0, error: e.message };
    }
  }),
});
