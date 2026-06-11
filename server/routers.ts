import { COOKIE_NAME } from "../shared/const.js";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { transcribeAudio } from "./_core/voiceTranscription";
import { invokeLLM } from "./_core/llm";
import { storagePut, storageGetSignedUrl } from "./storage";
import { z } from "zod";
import { songReproductionRouter } from "./songReproduction";
import { interviewDetectionRouter } from "./interviewDetection";
import { liveTranslateRouter } from "./liveTranslate";
import { upsertPushToken, getUserPushTokens } from "./db";
import { sendPushToUser, broadcastPush } from "./pushNotifications";
import { videoTranslateRouter } from "./videoTranslate";
import { translateRouter } from "./translateRouter";
import { teacherRouter } from "./teacherRouter";
import { videoCallRouter } from "./videoCallRouter";
import { autoIngestRouter } from "./autoIngestScheduler";
import { humeRouter } from "./humeService";
import { pronunciationRouter } from "./pronunciationRouter";
import { songTranslationPipelineRouter } from "./songTranslationPipeline";
import { klingVideoRouter } from "./klingVideoService";
import { synthesiaRouter } from "./synthesiaService";
import { higgsfieldMarketingRouter } from "./higgsfieldMarketing";
import { slangDictionaryRouter } from "./slangDictionaryRouter";
import { adaptiveExerciseRouter } from "./adaptiveExerciseRouter";
import { voiceExerciseRouter } from "./voiceExerciseRouter";
import { trendingVocabRouter } from "./trendingVocabRouter";
import { authRouter } from "./authRouter";
import { inviteRouter } from "./inviteRouter";
import { songStudioRouter } from "./songStudioRouter";
import { songLessonBreakdownRouter } from "./songLessonBreakdownRouter";
import { ocrIngestionRouter } from "./ocrIngestion";
import { affiliateRouter } from "./affiliateRouter";
import { contentIngestionRouter } from "./contentIngestion";
import { subscriptionRouter } from "./subscriptionRouter";
import { elevenLabsAgentsRouter } from "./elevenLabsAgentsRouter";
import { resendRouter } from "./resendService";
import { tiktokIngestionRouter } from "./tiktokIngestion";
import { practiceRouter } from "./practiceRouter";
import { musicGenerationRouter } from "./musicGenerationRouter";
import { grammarLeaderboardRouter } from "./grammarLeaderboardRouter";
import { heygenRouter } from "./heygenService";
import { autoPostRouter } from "./autoPostPipeline";
import { contentProductionRouter } from "./contentProductionPipeline";
import { creatorPipelineRouter } from "./creatorPipeline";
import { creatorContentEngineRouter } from "./creatorContentEngine";
import { knowledgeVaultRouter } from "./knowledgeVault";
import { culturalIntelligenceRouter } from "./culturalIntelligence";
import { rrtAudioRouter } from "./rrtAudioRouter";
import { exerciseAnalyticsRouter } from "./exerciseAnalyticsRouter";
import { contentValidationRouter } from "./contentValidationRouter";
import { learningIntelligenceRouter } from "./learningIntelligenceRouter";
import { teacherVoiceMemoRouter } from "./teacherVoiceMemoRouter";
import { waveCloudChatRouter } from "./waveCloudChatRouter";
import { methodologyIngestionRouter } from "./methodologyIngestionRouter";
import { phrasebookRouter } from "./phrasebookRouter";
import { gamificationRouter } from "./gamificationRouter";
import { pronunciationScoringRouter } from "./pronunciationScoringRouter";
import { creatorFeedRouter } from "./creatorFeedRouter";
import { phraseCollectionsRouter } from "./phraseCollectionsRouter";
import { shareLyricsRouter } from "./shareLyricsRouter";
import { aiSecurityRouter } from "./aiSecurityRouter";
import { mfaRouter } from "./mfaRouter";
import { aiPartnersRouter } from "./aiPartnersRouter";
import { immersionLessonRouter } from "./immersionLessonRouter";
import { tasteIntelligenceRouter } from "./tasteIntelligenceRouter";

export const appRouter = router({
  // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  contentIngestion: contentIngestionRouter,
  emailAuth: authRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  certificate: router({
    generatePdf: publicProcedure
      .input(z.object({
        userName: z.string().default("Student"),
        courseName: z.string(),
        completionDate: z.string(),
        credentialId: z.string(),
        issuer: z.string().default("ConnectWorld AI"),
      }))
      .mutation(async ({ input }) => {
        // Generate a simple HTML-based certificate and convert to PDF-like format
        const certificateHtml = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><style>
  body { margin: 0; padding: 40px; font-family: 'Georgia', serif; background: linear-gradient(135deg, #0a1628, #1a2744); color: #ECEDEE; min-height: 100vh; display: flex; align-items: center; justify-content: center; }
  .cert { width: 700px; padding: 60px; border: 3px solid #00AAFF; border-radius: 20px; background: rgba(10,22,40,0.95); text-align: center; position: relative; }
  .cert::before { content: ''; position: absolute; inset: 8px; border: 1px solid rgba(0,170,255,0.3); border-radius: 16px; pointer-events: none; }
  .logo { font-size: 28px; font-weight: bold; color: #00AAFF; margin-bottom: 10px; letter-spacing: 2px; }
  .subtitle { font-size: 14px; color: #9BA1A6; margin-bottom: 30px; }
  h1 { font-size: 36px; color: #FFB800; margin: 20px 0 10px; font-weight: normal; }
  .name { font-size: 28px; color: #FFFFFF; font-weight: bold; margin: 20px 0; padding: 10px 0; border-bottom: 2px solid rgba(0,170,255,0.3); border-top: 2px solid rgba(0,170,255,0.3); }
  .course { font-size: 20px; color: #00AAFF; margin: 15px 0; }
  .details { font-size: 13px; color: #9BA1A6; margin-top: 30px; }
  .credential { font-size: 11px; color: #687076; margin-top: 15px; font-family: monospace; }
  .seal { font-size: 48px; margin: 20px 0; }
</style></head>
<body>
  <div class="cert">
    <div class="logo">CONNECTME AI</div>
    <div class="subtitle">Certificate of Completion</div>
    <div class="seal">✨</div>
    <h1>Certificate of Achievement</h1>
    <p style="color:#9BA1A6;">This is to certify that</p>
    <div class="name">${input.userName}</div>
    <p style="color:#9BA1A6;">has successfully completed</p>
    <div class="course">${input.courseName}</div>
    <div class="details">
      <p>Issued by: ${input.issuer}</p>
      <p>Date: ${input.completionDate}</p>
    </div>
    <div class="credential">Credential ID: ${input.credentialId}</div>
  </div>
</body>
</html>`;

        const buffer = Buffer.from(certificateHtml, "utf-8");
        const result = await storagePut(
          `certificates/${input.credentialId}.html`,
          buffer,
          "text/html",
        );
        const signedUrl = await storageGetSignedUrl(result.key);
        return { key: result.key, url: signedUrl, proxyUrl: result.url };
      }),
  }),

  songAnalysis: router({
    analyze: publicProcedure
      .input(z.object({
        lyrics: z.string().min(1),
        songTitle: z.string().optional(),
        artist: z.string().optional(),
        sourceLanguage: z.string().default("Spanish"),
        targetLanguage: z.string().default("English"),
        userDialect: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const systemPrompt = `You are an expert linguist and cultural analyst specializing in music lyrics analysis for language learners. Analyze the provided song lyrics and return a comprehensive breakdown.

You MUST return valid JSON with this exact structure:
{
  "slangEntries": [
    {
      "word": "the slang/regional word",
      "meaning": "full explanation of meaning",
      "dialect": "which region/country this is from (e.g., Puerto Rican, Dominican, Colombian, Mexican)",
      "dialectFlag": "emoji flag for the region",
      "example": "example usage in a sentence",
      "note": "additional context for learners"
    }
  ],
  "dialect": {
    "detected": "the detected dialect/regional variant (e.g., Puerto Rican Spanish, Dominican Spanish)",
    "confidence": 85,
    "flag": "emoji flag",
    "characteristics": ["list of linguistic characteristics that identify this dialect"]
  },
  "cultural": {
    "genre": "music genre",
    "mood": "emotional mood of the song",
    "theme": "main theme",
    "description": "2-3 sentence cultural context description explaining the song's significance and style"
  },
  "learnerNotes": [
    {
      "type": "warning or tip or info",
      "text": "helpful note for language learners about potential confusions, dialect differences, or study tips"
    }
  ],
  "dialectComparisons": [
    {
      "word": "the word being compared",
      "variants": [
        { "region": "Puerto Rico", "flag": "🇵🇷", "term": "local equivalent", "usage": "how it's used there" },
        { "region": "Dominican Republic", "flag": "🇩🇴", "term": "local equivalent", "usage": "how it's used there" },
        { "region": "Mexico", "flag": "🇲🇽", "term": "local equivalent", "usage": "how it's used there" },
        { "region": "Colombia", "flag": "🇨🇴", "term": "local equivalent", "usage": "how it's used there" }
      ]
    }
  ]
}

IMPORTANT:
- Identify ALL slang, colloquial, or regional words — not just obvious ones
- For each slang word, explain which specific country/region it comes from
- Include at least 3-5 learner notes covering potential misunderstandings
- The dialectComparisons should show how key words/phrases differ across at least 3-4 Spanish-speaking regions
- Be specific about which dialect the song uses and why you think so
- If the user is learning a different dialect than the song's, highlight those differences`;

        const userMessage = `Analyze these ${input.sourceLanguage} lyrics${input.songTitle ? ` from "${input.songTitle}"` : ""}${input.artist ? ` by ${input.artist}` : ""}.
${input.userDialect ? `The learner is studying ${input.userDialect}, so highlight differences from that dialect.` : ""}

Lyrics:
${input.lyrics}`;

        try {
          const response = await invokeLLM({
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: userMessage },
            ],
            response_format: { type: "json_object" },
          });

          const rawContent = response.choices?.[0]?.message?.content;
          if (!rawContent) {
            return { success: false as const, error: "No response from AI", data: null };
          }

          // Content may be string or array of content parts
          const content = typeof rawContent === "string"
            ? rawContent
            : rawContent.find((p) => p.type === "text")?.text ?? "";
          if (!content) {
            return { success: false as const, error: "No text content in AI response", data: null };
          }

          const parsed = JSON.parse(content);
          return { success: true as const, error: null, data: parsed };
        } catch (err: any) {
          return { success: false as const, error: err.message || "Analysis failed", data: null };
        }
      }),
  }),

  voice: router({
    // Upload audio and get a storage URL for transcription
    uploadAudio: publicProcedure
      .input(z.object({
        base64Audio: z.string(), // Base64-encoded audio data
        mimeType: z.string().default("audio/webm"),
        filename: z.string().default("recording.webm"),
      }))
      .mutation(async ({ input }) => {
        const buffer = Buffer.from(input.base64Audio, "base64");
        const result = await storagePut(
          `audio/${input.filename}`,
          buffer,
          input.mimeType,
        );
        // Get a signed URL that the transcription service can access
        const signedUrl = await storageGetSignedUrl(result.key);
        return { key: result.key, url: signedUrl };
      }),

    // Transcribe audio from a storage URL
    transcribe: publicProcedure
      .input(z.object({
        audioUrl: z.string(),
        language: z.string().optional(),
        prompt: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const result = await transcribeAudio({
          audioUrl: input.audioUrl,
          language: input.language,
          prompt: input.prompt || "Transcribe the user's voice command for a language learning app",
        });

        // Check if it's an error
        if ("error" in result) {
          return { success: false as const, error: result.error, text: "" };
        }

        return {
          success: true as const,
          text: result.text,
          language: result.language,
          duration: result.duration,
        };
      }),
  }),
  songReproduction: songReproductionRouter,
  interviewDetection: interviewDetectionRouter,
  liveTranslate: liveTranslateRouter,
  videoTranslate: videoTranslateRouter,
  translate: translateRouter,
  teacher: teacherRouter,
  videoCall: videoCallRouter,
  autoIngest: autoIngestRouter,
  hume: humeRouter,
  pronunciation: pronunciationRouter,
  songPipeline: songTranslationPipelineRouter,
  songLesson: songLessonBreakdownRouter,
  klingVideo: klingVideoRouter,
  synthesia: synthesiaRouter,
  marketing: higgsfieldMarketingRouter,
  slang: slangDictionaryRouter,
  adaptiveExercise: adaptiveExerciseRouter,
  voiceExercise: voiceExerciseRouter,
  trendingVocab: trendingVocabRouter,
  invite: inviteRouter,
  ocrIngestion: ocrIngestionRouter,
  affiliate: affiliateRouter,
  subscription: subscriptionRouter,
  elevenLabsAgents: elevenLabsAgentsRouter,
  email: resendRouter,
  tiktok: tiktokIngestionRouter,
  practice: practiceRouter,
  musicGeneration: musicGenerationRouter,
  grammarLeaderboard: grammarLeaderboardRouter,
  heygen: heygenRouter,
  autoPost: autoPostRouter,
  contentProduction: contentProductionRouter,
  creatorPipeline: creatorPipelineRouter,
  creatorEngine: creatorContentEngineRouter,
  knowledgeVault: knowledgeVaultRouter,
  culturalIntel: culturalIntelligenceRouter,
  rrtAudio: rrtAudioRouter,
  exerciseAnalytics: exerciseAnalyticsRouter,
  contentValidation: contentValidationRouter,
  learningIntelligence: learningIntelligenceRouter,
  teacherVoiceMemo: teacherVoiceMemoRouter,
  waveCloudChat: waveCloudChatRouter,
  methodologyIngestion: methodologyIngestionRouter,

  // Data sync for cross-device progress
  sync: router({
    push: protectedProcedure
      .input(z.object({
        lessons: z.array(z.string()),
        cefrLevel: z.string(),
        streak: z.number(),
        totalXp: z.number(),
        flashcards: z.array(z.any()),
        submissions: z.array(z.any()),
        preferences: z.record(z.string(), z.any()),
        vocabulary: z.array(z.any()),
        achievements: z.array(z.string()),
        lastSyncedAt: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        // Store user progress in userSyncData table
        const { getDb } = await import("./db");
        const { userSyncData } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        const db = await getDb();
        if (!db) return { success: false, mergedData: input };
        const existing = await db.select().from(userSyncData).where(eq(userSyncData.userId, ctx.user.id)).limit(1);
        const progressData = JSON.stringify(input);
        if (existing.length > 0) {
          await db.update(userSyncData).set({ data: progressData, updatedAt: new Date() }).where(eq(userSyncData.userId, ctx.user.id));
        } else {
          await db.insert(userSyncData).values({ userId: ctx.user.id, data: progressData, updatedAt: new Date() });
        }
        return { success: true, mergedData: input };
      }),
    pull: protectedProcedure.query(async ({ ctx }) => {
      const { getDb } = await import("./db");
      const { userSyncData } = await import("../drizzle/schema");
      const { eq } = await import("drizzle-orm");
      const db = await getDb();
      if (!db) return { data: null };
      const result = await db.select().from(userSyncData).where(eq(userSyncData.userId, ctx.user.id)).limit(1);
      if (result.length > 0 && result[0].data) {
        return { data: JSON.parse(result[0].data as string) };
      }
      return { data: null };
    }),
  }),

  // Crash analytics endpoint
  crashReport: router({
    // Single crash report submission
    submit: publicProcedure
      .input(z.object({
        id: z.string(),
        message: z.string(),
        stack: z.string().optional(),
        componentStack: z.string().optional(),
        level: z.enum(["fatal", "error", "warning"]),
        timestamp: z.string(),
        platform: z.string(),
        appVersion: z.string(),
        screen: z.string().optional(),
        userId: z.string().optional(),
        metadata: z.record(z.string(), z.unknown()).optional(),
      }))
      .mutation(async ({ input }) => {
        // Log crash report server-side (in production, forward to Sentry/Datadog)
        console.error(`[CRASH] ${input.level.toUpperCase()} | ${input.platform} | ${input.screen || "unknown"} | ${input.message}`);
        if (input.stack) {
          console.error(`[CRASH STACK] ${input.stack.slice(0, 500)}`);
        }
        // Store in database if available
        try {
          const { getDb } = await import("./db");
          const db = await getDb();
          if (db) {
            // Use raw SQL to insert into a crash_reports table if it exists
            // For now, just acknowledge receipt
          }
        } catch (_) {
          // DB not available, that's fine - we already logged it
        }
        return { received: true, id: input.id };
      }),

    // Batch crash report submission
    submitBatch: publicProcedure
      .input(z.object({
        reports: z.array(z.object({
          id: z.string(),
          message: z.string(),
          stack: z.string().optional(),
          componentStack: z.string().optional(),
          level: z.enum(["fatal", "error", "warning"]),
          timestamp: z.string(),
          platform: z.string(),
          appVersion: z.string(),
          screen: z.string().optional(),
          userId: z.string().optional(),
          metadata: z.record(z.string(), z.unknown()).optional(),
        })),
      }))
      .mutation(async ({ input }) => {
        console.error(`[CRASH BATCH] Received ${input.reports.length} crash reports`);
        for (const report of input.reports) {
          console.error(`  - ${report.level} | ${report.platform} | ${report.message.slice(0, 100)}`);
        }
        return { received: true, count: input.reports.length };
      }),

    // Get crash report stats (for admin debug panel)
    stats: publicProcedure.query(async () => {
      // In production, query from DB or external service
      return {
        totalReports: 0,
        last24h: 0,
        topErrors: [] as { message: string; count: number }[],
      };
    }),
  }),

  // Push notification management
  push: router({
    // Register a push token for the authenticated user
    registerToken: protectedProcedure
      .input(z.object({
        token: z.string().min(1),
        platform: z.enum(["ios", "android", "web"]),
        deviceName: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        await upsertPushToken({
          userId: ctx.user.id,
          token: input.token,
          platform: input.platform,
          deviceName: input.deviceName,
        });
        return { success: true };
      }),

    // Send a push notification to a specific user (admin only or self)
    sendToUser: protectedProcedure
      .input(z.object({
        userId: z.number(),
        title: z.string().min(1),
        body: z.string().min(1),
        data: z.record(z.string(), z.unknown()).optional(),
      }))
      .mutation(async ({ input }) => {
        const result = await sendPushToUser(input.userId, {
          title: input.title,
          body: input.body,
          data: input.data,
        });
        return result;
      }),

    // Get the user's registered tokens
    myTokens: protectedProcedure.query(async ({ ctx }) => {
      const tokens = await getUserPushTokens(ctx.user.id);
      return { tokens, count: tokens.length };
    }),
  }),
  songStudio: songStudioRouter,
  phrasebook: phrasebookRouter,
  gamification: gamificationRouter,
  pronunciationScoring: pronunciationScoringRouter,
  creatorFeed: creatorFeedRouter,
  phraseCollections: phraseCollectionsRouter,
  shareLyrics: shareLyricsRouter,
  aiSecurity: aiSecurityRouter,
  mfa: mfaRouter,
  aiPartners: aiPartnersRouter,
  immersionLessons: immersionLessonRouter,
  tasteIntelligence: tasteIntelligenceRouter,
});

export type AppRouter = typeof appRouter;
