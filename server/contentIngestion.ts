/**
 * Content Ingestion Architecture — SEPARATED ROUTES
 * 
 * Two distinct ingestion pipelines:
 * 
 * 1. LANGUAGE EDUCATION INGESTION (feeds the teaching LLM)
 *    - Uses sentiment AI + NLP to determine if content is language-education related
 *    - Only ingests content about: language teaching, grammar, vocabulary, pronunciation,
 *      slang explanations, cultural language context, dialect comparisons
 *    - Rejects: entertainment, news, politics, cooking (unless teaching food vocabulary),
 *      fitness, general lifestyle content
 *    - Output: Verified language data → teacher knowledge base → curriculum enrichment
 * 
 * 2. VIRAL CONTENT INGESTION (feeds the marketing/content creation strategy)
 *    - Captures trending content patterns, formats, hooks, engagement metrics
 *    - Analyzes what's going viral regardless of topic
 *    - Output: Content ideas, format templates, hook patterns, trending audio/music
 *    - Purpose: Help ConnectWorld AI create viral marketing content about language learning
 *    - NEVER feeds into the teaching LLM — strictly for marketing intelligence
 * 
 * The classification middleware sits between raw content and the two pipelines,
 * using the built-in LLM to determine which route content should take.
 */

import { z } from "zod";
import { router, publicProcedure } from "./_core/trpc";
import { invokeLLM } from "./_core/llm";

// ─── Types ───────────────────────────────────────────────────────────────────

export type ContentClassification = "language_education" | "viral_marketing" | "rejected";

export interface ClassificationResult {
  classification: ContentClassification;
  confidence: number; // 0-1
  reasoning: string;
  languageTopics?: string[]; // If language_education: what topics were detected
  viralMetrics?: {
    format: string; // e.g., "duet", "stitch", "greenscreen", "voiceover"
    hook: string; // The attention-grabbing element
    engagementPattern: string; // Why it's viral
    adaptableForLanguage: boolean; // Can we copy this format for language content?
  };
}

export interface LanguageEducationEntry {
  id: string;
  sourceUrl: string;
  platform: "youtube" | "instagram" | "tiktok" | "twitter" | "other";
  language: string;
  dialect: string;
  contentType: "vocabulary" | "grammar" | "pronunciation" | "slang" | "idiom" | "cultural_context" | "conversation" | "listening";
  extractedData: {
    words: Array<{
      word: string;
      translation: string;
      pronunciation: string;
      context: string;
      category: string;
      region: string;
    }>;
    grammarPoints: Array<{
      rule: string;
      explanation: string;
      examples: string[];
      level: string; // CEFR level
    }>;
    culturalNotes: string[];
    conversationPatterns: string[];
  };
  verificationStatus: "pending" | "verified" | "rejected";
  ingestedAt: string;
  verifiedBy?: string; // "ai" | "community" | "admin"
}

export interface ViralContentEntry {
  id: string;
  sourceUrl: string;
  platform: "youtube" | "instagram" | "tiktok" | "twitter" | "other";
  capturedAt: string;
  metrics: {
    views: number;
    likes: number;
    shares: number;
    comments: number;
    engagementRate: number;
  };
  analysis: {
    format: string; // Video format type
    hook: string; // What grabs attention in first 3 seconds
    structure: string; // Content structure pattern
    audioTrend: string; // Trending audio/music used
    hashtags: string[];
    targetAudience: string;
    emotionalTrigger: string; // What emotion drives engagement
    callToAction: string;
  };
  adaptationIdeas: Array<{
    concept: string; // How to adapt this for language learning content
    targetPlatform: string;
    estimatedEffort: "low" | "medium" | "high";
    potentialReach: "low" | "medium" | "high" | "viral";
  }>;
  status: "captured" | "analyzed" | "adapted" | "published";
}

// ─── Classification Middleware ───────────────────────────────────────────────

/**
 * Uses sentiment AI + NLP to classify content into:
 * - language_education: Content about teaching/learning languages → feeds teaching LLM
 * - viral_marketing: Trending content patterns → feeds marketing strategy
 * - rejected: Content that doesn't fit either pipeline
 */
async function classifyContent(
  contentText: string,
  sourceUrl: string,
  metadata?: { caption?: string; hashtags?: string[]; platform?: string }
): Promise<ClassificationResult> {
  const response = await invokeLLM({
    messages: [
      {
        role: "system",
        content: `You are a content classification AI for ConnectWorld AI, a language learning platform.

Your job is to determine if content belongs to ONE of these categories:

1. "language_education" — Content that TEACHES language. This includes:
   - Vocabulary lessons, word explanations, grammar tips
   - Pronunciation guides, accent comparisons
   - Slang explanations, idiom breakdowns
   - Cultural context that explains language usage
   - Dialect comparisons (e.g., Dominican vs Mexican Spanish)
   - Language learning tips, study methods
   - Bilingual content that teaches through comparison
   
   DOES NOT INCLUDE: Content merely IN another language (a Spanish cooking video is NOT language education unless it explicitly teaches vocabulary)

2. "viral_marketing" — Content with high engagement potential that we can STUDY for marketing patterns:
   - Trending formats (duets, stitches, transitions)
   - Viral hooks and attention-grabbing techniques
   - High-engagement content structures
   - Trending audio/music usage patterns
   - Any content going viral regardless of topic
   
   We study these to CREATE our own viral language-learning content, NOT to teach from them.

3. "rejected" — Content that is:
   - Low quality, spam, or inappropriate
   - Not useful for either pipeline
   - Misinformation about languages

Return a JSON object with:
- "classification": "language_education" | "viral_marketing" | "rejected"
- "confidence": 0.0 to 1.0
- "reasoning": Brief explanation of why
- "languageTopics": (if language_education) Array of topics detected
- "viralMetrics": (if viral_marketing) Object with format, hook, engagementPattern, adaptableForLanguage

CRITICAL RULE: Only classify as "language_education" if the content EXPLICITLY teaches language. 
A video of someone speaking Spanish is NOT language education unless they are TEACHING Spanish.
Return ONLY the JSON object, no markdown.`
      },
      {
        role: "user",
        content: `Classify this content:

Source: ${sourceUrl}
Platform: ${metadata?.platform || "unknown"}
Caption: ${metadata?.caption || "N/A"}
Hashtags: ${metadata?.hashtags?.join(", ") || "N/A"}

Content text/transcript:
${contentText.slice(0, 3000)}`
      }
    ],
  });

  try {
    const responseText = typeof response.choices?.[0]?.message?.content === "string" ? response.choices[0].message.content : "";
    const parsed = JSON.parse(responseText.replace(/```json\n?|\n?```/g, "").trim());
    return parsed as ClassificationResult;
  } catch {
    return {
      classification: "rejected",
      confidence: 0.3,
      reasoning: "Failed to parse classification response",
    };
  }
}

// ─── Language Education Ingestion ────────────────────────────────────────────

/**
 * Processes content classified as language_education.
 * Extracts structured language data and feeds it into the teaching knowledge base.
 */
async function processLanguageEducation(
  contentText: string,
  sourceUrl: string,
  classification: ClassificationResult
): Promise<LanguageEducationEntry> {
  const response = await invokeLLM({
    messages: [
      {
        role: "system",
        content: `You are a language data extraction AI for ConnectWorld AI.

Extract ALL language-learning content from this material into structured data:

1. Words/phrases with translations, pronunciation, context, and regional info
2. Grammar rules with explanations and examples
3. Cultural notes that explain language usage
4. Conversation patterns and common exchanges

For each word/phrase, determine:
- The CEFR level it belongs to (A1, A2, B1, B2, C1, C2)
- The specific region/dialect (e.g., "Dominican Republic", "Mexico City", "Parisian")
- The category: vocabulary, slang, idiom, formal, greeting, food, culture, grammar

Return a JSON object with:
{
  "language": "Spanish" (or whatever language),
  "dialect": "Dominican" (or specific dialect),
  "contentType": "vocabulary" | "grammar" | "pronunciation" | "slang" | "idiom" | "cultural_context" | "conversation" | "listening",
  "words": [{ "word": "", "translation": "", "pronunciation": "", "context": "", "category": "", "region": "" }],
  "grammarPoints": [{ "rule": "", "explanation": "", "examples": [], "level": "" }],
  "culturalNotes": ["..."],
  "conversationPatterns": ["..."]
}

Return ONLY the JSON object, no markdown.`
      },
      {
        role: "user",
        content: `Extract language data from this content:\n\n${contentText.slice(0, 4000)}`
      }
    ],
  });

  let extractedData;
  try {
    const responseText = typeof response.choices?.[0]?.message?.content === "string" ? response.choices[0].message.content : "";
    extractedData = JSON.parse(responseText.replace(/```json\n?|\n?```/g, "").trim());
  } catch {
    extractedData = { words: [], grammarPoints: [], culturalNotes: [], conversationPatterns: [] };
  }

  return {
    id: `lang_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    sourceUrl,
    platform: detectPlatform(sourceUrl),
    language: extractedData.language || "Unknown",
    dialect: extractedData.dialect || "Standard",
    contentType: extractedData.contentType || "vocabulary",
    extractedData: {
      words: extractedData.words || [],
      grammarPoints: extractedData.grammarPoints || [],
      culturalNotes: extractedData.culturalNotes || [],
      conversationPatterns: extractedData.conversationPatterns || [],
    },
    verificationStatus: "pending",
    ingestedAt: new Date().toISOString(),
  };
}

// ─── Viral Content Ingestion ─────────────────────────────────────────────────

/**
 * Processes content classified as viral_marketing.
 * Analyzes engagement patterns and generates adaptation ideas for language content.
 * NEVER feeds into the teaching LLM.
 */
async function processViralContent(
  contentText: string,
  sourceUrl: string,
  classification: ClassificationResult,
  metrics?: { views?: number; likes?: number; shares?: number; comments?: number }
): Promise<ViralContentEntry> {
  const response = await invokeLLM({
    messages: [
      {
        role: "system",
        content: `You are a viral content strategist for ConnectWorld AI, a language learning app.

Analyze this viral/trending content and extract:
1. What FORMAT makes it engaging (duet, stitch, greenscreen, voiceover, transition, etc.)
2. What HOOK grabs attention in the first 3 seconds
3. What STRUCTURE the content follows (problem→solution, before→after, story arc, etc.)
4. What AUDIO trend is being used
5. What EMOTION drives engagement (curiosity, humor, shock, inspiration, FOMO, etc.)
6. What CALL TO ACTION drives interaction

Then generate 3 adaptation ideas for how ConnectWorld AI could create similar content about LANGUAGE LEARNING.

Return a JSON object:
{
  "format": "...",
  "hook": "...",
  "structure": "...",
  "audioTrend": "...",
  "hashtags": ["..."],
  "targetAudience": "...",
  "emotionalTrigger": "...",
  "callToAction": "...",
  "adaptationIdeas": [
    { "concept": "How to adapt for language learning", "targetPlatform": "tiktok|instagram|youtube", "estimatedEffort": "low|medium|high", "potentialReach": "low|medium|high|viral" }
  ]
}

Return ONLY the JSON object, no markdown.`
      },
      {
        role: "user",
        content: `Analyze this viral content:\n\nSource: ${sourceUrl}\n\nContent:\n${contentText.slice(0, 3000)}`
      }
    ],
  });

  let analysis;
  try {
    const responseText = typeof response.choices?.[0]?.message?.content === "string" ? response.choices[0].message.content : "";
    analysis = JSON.parse(responseText.replace(/```json\n?|\n?```/g, "").trim());
  } catch {
    analysis = {
      format: "unknown",
      hook: "unknown",
      structure: "unknown",
      audioTrend: "unknown",
      hashtags: [],
      targetAudience: "general",
      emotionalTrigger: "curiosity",
      callToAction: "none",
      adaptationIdeas: [],
    };
  }

  return {
    id: `viral_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    sourceUrl,
    platform: detectPlatform(sourceUrl),
    capturedAt: new Date().toISOString(),
    metrics: {
      views: metrics?.views || 0,
      likes: metrics?.likes || 0,
      shares: metrics?.shares || 0,
      comments: metrics?.comments || 0,
      engagementRate: metrics?.views ? ((metrics?.likes || 0) + (metrics?.shares || 0) + (metrics?.comments || 0)) / metrics.views : 0,
    },
    analysis: {
      format: analysis.format || "unknown",
      hook: analysis.hook || "unknown",
      structure: analysis.structure || "unknown",
      audioTrend: analysis.audioTrend || "unknown",
      hashtags: analysis.hashtags || [],
      targetAudience: analysis.targetAudience || "general",
      emotionalTrigger: analysis.emotionalTrigger || "curiosity",
      callToAction: analysis.callToAction || "none",
    },
    adaptationIdeas: analysis.adaptationIdeas || [],
    status: "analyzed",
  };
}

// ─── Utility ─────────────────────────────────────────────────────────────────

function detectPlatform(url: string): "youtube" | "instagram" | "tiktok" | "twitter" | "other" {
  if (url.includes("youtube.com") || url.includes("youtu.be")) return "youtube";
  if (url.includes("instagram.com")) return "instagram";
  if (url.includes("tiktok.com")) return "tiktok";
  if (url.includes("twitter.com") || url.includes("x.com")) return "twitter";
  return "other";
}

// In-memory stores (production would use DB)
const languageEducationStore: LanguageEducationEntry[] = [];
const viralContentStore: ViralContentEntry[] = [];

// ─── tRPC Router ─────────────────────────────────────────────────────────────

export const contentIngestionRouter = router({
  /**
   * Classify content — determines which pipeline it goes to
   */
  classify: publicProcedure
    .input(z.object({
      contentText: z.string().min(10),
      sourceUrl: z.string().url(),
      caption: z.string().optional(),
      hashtags: z.array(z.string()).optional(),
      platform: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const result = await classifyContent(
        input.contentText,
        input.sourceUrl,
        { caption: input.caption, hashtags: input.hashtags, platform: input.platform }
      );
      return result;
    }),

  /**
   * ROUTE 1: Language Education Ingestion
   * Only accepts content that has been classified as language_education.
   * Extracts structured language data for the teaching LLM.
   */
  ingestLanguageEducation: publicProcedure
    .input(z.object({
      contentText: z.string().min(10),
      sourceUrl: z.string().url(),
      caption: z.string().optional(),
      hashtags: z.array(z.string()).optional(),
      platform: z.string().optional(),
      skipClassification: z.boolean().optional(), // For pre-classified content
    }))
    .mutation(async ({ input }) => {
      // Step 1: Classify (unless pre-classified)
      if (!input.skipClassification) {
        const classification = await classifyContent(
          input.contentText,
          input.sourceUrl,
          { caption: input.caption, hashtags: input.hashtags, platform: input.platform }
        );

        if (classification.classification !== "language_education") {
          return {
            success: false,
            reason: `Content classified as "${classification.classification}" — not language education. Reasoning: ${classification.reasoning}`,
            classification,
          };
        }
      }

      // Step 2: Extract language data
      const entry = await processLanguageEducation(
        input.contentText,
        input.sourceUrl,
        { classification: "language_education", confidence: 1, reasoning: "Pre-classified" }
      );

      // Step 3: Store
      languageEducationStore.push(entry);

      return {
        success: true,
        entry,
        totalWordsExtracted: entry.extractedData.words.length,
        totalGrammarPoints: entry.extractedData.grammarPoints.length,
      };
    }),

  /**
   * ROUTE 2: Viral Content Ingestion
   * Captures trending content patterns for marketing/content creation.
   * NEVER feeds into the teaching LLM.
   */
  ingestViralContent: publicProcedure
    .input(z.object({
      contentText: z.string().min(10),
      sourceUrl: z.string().url(),
      caption: z.string().optional(),
      hashtags: z.array(z.string()).optional(),
      platform: z.string().optional(),
      metrics: z.object({
        views: z.number().optional(),
        likes: z.number().optional(),
        shares: z.number().optional(),
        comments: z.number().optional(),
      }).optional(),
    }))
    .mutation(async ({ input }) => {
      // Classify to get viral metrics
      const classification = await classifyContent(
        input.contentText,
        input.sourceUrl,
        { caption: input.caption, hashtags: input.hashtags, platform: input.platform }
      );

      // Process as viral content
      const entry = await processViralContent(
        input.contentText,
        input.sourceUrl,
        classification,
        input.metrics
      );

      // Store
      viralContentStore.push(entry);

      return {
        success: true,
        entry,
        adaptationIdeas: entry.adaptationIdeas.length,
      };
    }),

  /**
   * Auto-classify and route — the main entry point.
   * Content comes in, gets classified, and automatically routed to the correct pipeline.
   */
  autoIngest: publicProcedure
    .input(z.object({
      contentText: z.string().min(10),
      sourceUrl: z.string().url(),
      caption: z.string().optional(),
      hashtags: z.array(z.string()).optional(),
      platform: z.string().optional(),
      metrics: z.object({
        views: z.number().optional(),
        likes: z.number().optional(),
        shares: z.number().optional(),
        comments: z.number().optional(),
      }).optional(),
    }))
    .mutation(async ({ input }) => {
      // Step 1: Classify
      const classification = await classifyContent(
        input.contentText,
        input.sourceUrl,
        { caption: input.caption, hashtags: input.hashtags, platform: input.platform }
      );

      // Step 2: Route to correct pipeline
      if (classification.classification === "language_education") {
        const entry = await processLanguageEducation(
          input.contentText,
          input.sourceUrl,
          classification
        );
        languageEducationStore.push(entry);
        return {
          routed: "language_education" as const,
          classification,
          entry,
          message: `Content routed to Language Education pipeline. Extracted ${entry.extractedData.words.length} words and ${entry.extractedData.grammarPoints.length} grammar points.`,
        };
      }

      if (classification.classification === "viral_marketing") {
        const entry = await processViralContent(
          input.contentText,
          input.sourceUrl,
          classification,
          input.metrics
        );
        viralContentStore.push(entry);
        return {
          routed: "viral_marketing" as const,
          classification,
          entry,
          message: `Content routed to Viral Marketing pipeline. Generated ${entry.adaptationIdeas.length} adaptation ideas.`,
        };
      }

      // Rejected
      return {
        routed: "rejected" as const,
        classification,
        entry: null,
        message: `Content rejected: ${classification.reasoning}`,
      };
    }),

  /**
   * Get all language education entries (for admin/review)
   */
  getLanguageEntries: publicProcedure
    .input(z.object({
      language: z.string().optional(),
      dialect: z.string().optional(),
      status: z.enum(["pending", "verified", "rejected"]).optional(),
      limit: z.number().min(1).max(100).optional(),
    }).optional())
    .query(({ input }) => {
      let entries = [...languageEducationStore];
      if (input?.language) entries = entries.filter(e => e.language.toLowerCase().includes(input.language!.toLowerCase()));
      if (input?.dialect) entries = entries.filter(e => e.dialect.toLowerCase().includes(input.dialect!.toLowerCase()));
      if (input?.status) entries = entries.filter(e => e.verificationStatus === input.status);
      return entries.slice(0, input?.limit || 50);
    }),

  /**
   * Get all viral content entries (for marketing team)
   */
  getViralEntries: publicProcedure
    .input(z.object({
      platform: z.string().optional(),
      status: z.enum(["captured", "analyzed", "adapted", "published"]).optional(),
      limit: z.number().min(1).max(100).optional(),
    }).optional())
    .query(({ input }) => {
      let entries = [...viralContentStore];
      if (input?.platform) entries = entries.filter(e => e.platform === input.platform);
      if (input?.status) entries = entries.filter(e => e.status === input.status);
      return entries.slice(0, input?.limit || 50);
    }),

  /**
   * Verify a language education entry (admin/community validation)
   */
  verifyEntry: publicProcedure
    .input(z.object({
      entryId: z.string(),
      status: z.enum(["verified", "rejected"]),
      verifiedBy: z.enum(["ai", "community", "admin"]),
    }))
    .mutation(({ input }) => {
      const entry = languageEducationStore.find(e => e.id === input.entryId);
      if (!entry) return { success: false, error: "Entry not found" };
      entry.verificationStatus = input.status;
      entry.verifiedBy = input.verifiedBy;
      return { success: true, entry };
    }),

  /**
   * Get ingestion stats
   */
  stats: publicProcedure.query(() => {
    return {
      languageEducation: {
        total: languageEducationStore.length,
        pending: languageEducationStore.filter(e => e.verificationStatus === "pending").length,
        verified: languageEducationStore.filter(e => e.verificationStatus === "verified").length,
        rejected: languageEducationStore.filter(e => e.verificationStatus === "rejected").length,
        totalWords: languageEducationStore.reduce((sum, e) => sum + e.extractedData.words.length, 0),
        totalGrammar: languageEducationStore.reduce((sum, e) => sum + e.extractedData.grammarPoints.length, 0),
      },
      viralContent: {
        total: viralContentStore.length,
        byPlatform: {
          youtube: viralContentStore.filter(e => e.platform === "youtube").length,
          instagram: viralContentStore.filter(e => e.platform === "instagram").length,
          tiktok: viralContentStore.filter(e => e.platform === "tiktok").length,
          twitter: viralContentStore.filter(e => e.platform === "twitter").length,
        },
        totalAdaptationIdeas: viralContentStore.reduce((sum, e) => sum + e.adaptationIdeas.length, 0),
      },
    };
  }),
});
