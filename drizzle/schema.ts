import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, uniqueIndex, json, boolean } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Push notification tokens for sending remote notifications to devices.
 */
export const pushTokens = mysqlTable("push_tokens", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  token: varchar("token", { length: 512 }).notNull(),
  platform: mysqlEnum("platform", ["ios", "android", "web"]).notNull(),
  deviceName: varchar("deviceName", { length: 255 }),
  active: int("active").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  tokenIdx: uniqueIndex("token_idx").on(table.token),
}));

export type PushToken = typeof pushTokens.$inferSelect;
export type InsertPushToken = typeof pushTokens.$inferInsert;

// ─── USER SETTINGS ──────────────────────────────────────────────────────────

export const userSettings = mysqlTable("user_settings", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  targetLanguage: varchar("targetLanguage", { length: 32 }).default("es-DO"),
  nativeLanguage: varchar("nativeLanguage", { length: 32 }).default("en"),
  currentLevel: varchar("currentLevel", { length: 8 }).default("A1"),
  dailyGoalMinutes: int("dailyGoalMinutes").default(15),
  notificationsEnabled: int("notificationsEnabled").default(1),
  theme: mysqlEnum("theme", ["light", "dark", "auto"]).default("auto"),
  voiceId: varchar("voiceId", { length: 128 }),
  subscriptionTier: mysqlEnum("subscriptionTier", ["free", "plus", "pro", "enterprise"]).default("free"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// ─── USER PROGRESS ──────────────────────────────────────────────────────────

export const userProgress = mysqlTable("user_progress", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  languageCode: varchar("languageCode", { length: 32 }).notNull(),
  lessonId: varchar("lessonId", { length: 128 }).notNull(),
  levelCode: varchar("levelCode", { length: 8 }).notNull(),
  score: int("score").default(0),
  completed: int("completed").default(0),
  timeSpentSeconds: int("timeSpentSeconds").default(0),
  completedAt: timestamp("completedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ─── STREAK & DAILY ACTIVITY ────────────────────────────────────────────────

export const dailyActivity = mysqlTable("daily_activity", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  date: varchar("date", { length: 10 }).notNull(), // YYYY-MM-DD
  minutesStudied: int("minutesStudied").default(0),
  lessonsCompleted: int("lessonsCompleted").default(0),
  exercisesCompleted: int("exercisesCompleted").default(0),
  xpEarned: int("xpEarned").default(0),
  streakDay: int("streakDay").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ─── ACHIEVEMENTS / BADGES ──────────────────────────────────────────────────

export const achievements = mysqlTable("achievements", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  badgeId: varchar("badgeId", { length: 64 }).notNull(),
  badgeName: varchar("badgeName", { length: 128 }).notNull(),
  category: varchar("category", { length: 64 }),
  earnedAt: timestamp("earnedAt").defaultNow().notNull(),
});

// ─── FLASHCARD DECKS ────────────────────────────────────────────────────────

export const flashcardDecks = mysqlTable("flashcard_decks", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  languageCode: varchar("languageCode", { length: 32 }),
  cardCount: int("cardCount").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const flashcards = mysqlTable("flashcards", {
  id: int("id").autoincrement().primaryKey(),
  deckId: int("deckId").notNull(),
  front: text("front").notNull(),
  back: text("back").notNull(),
  audioUrl: varchar("audioUrl", { length: 512 }),
  nextReview: timestamp("nextReview"),
  interval: int("interval_days").default(1),
  easeFactor: int("easeFactor").default(250), // stored as x100
  repetitions: int("repetitions").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ─── QUIZ RESULTS ───────────────────────────────────────────────────────────

export const quizResults = mysqlTable("quiz_results", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  quizType: varchar("quizType", { length: 64 }).notNull(),
  languageCode: varchar("languageCode", { length: 32 }),
  score: int("score").notNull(),
  totalQuestions: int("totalQuestions").notNull(),
  timeSpentSeconds: int("timeSpentSeconds"),
  details: json("details"),
  completedAt: timestamp("completedAt").defaultNow().notNull(),
});

// ─── CONVERSATIONS / MESSAGES ───────────────────────────────────────────────

export const conversations = mysqlTable("conversations", {
  id: int("id").autoincrement().primaryKey(),
  type: mysqlEnum("type", ["direct", "group", "ai_chat", "pen_pal"]).default("direct").notNull(),
  title: varchar("title", { length: 255 }),
  languageCode: varchar("languageCode", { length: 32 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const conversationMembers = mysqlTable("conversation_members", {
  id: int("id").autoincrement().primaryKey(),
  conversationId: int("conversationId").notNull(),
  userId: int("userId").notNull(),
  role: mysqlEnum("role", ["member", "admin"]).default("member").notNull(),
  joinedAt: timestamp("joinedAt").defaultNow().notNull(),
});

export const messages = mysqlTable("messages", {
  id: int("id").autoincrement().primaryKey(),
  conversationId: int("conversationId").notNull(),
  senderId: int("senderId").notNull(),
  content: text("content").notNull(),
  contentType: mysqlEnum("contentType", ["text", "audio", "image", "video", "voice_memo"]).default("text").notNull(),
  translatedContent: text("translatedContent"),
  mediaUrl: varchar("mediaUrl", { length: 512 }),
  readAt: timestamp("readAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ─── FRIENDSHIPS / CONNECTIONS ──────────────────────────────────────────────

export const friendships = mysqlTable("friendships", {
  id: int("id").autoincrement().primaryKey(),
  requesterId: int("requesterId").notNull(),
  addresseeId: int("addresseeId").notNull(),
  status: mysqlEnum("status", ["pending", "accepted", "blocked"]).default("pending").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// ─── STUDY GROUPS ───────────────────────────────────────────────────────────

export const studyGroups = mysqlTable("study_groups", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  languageCode: varchar("languageCode", { length: 32 }),
  maxMembers: int("maxMembers").default(10),
  createdBy: int("createdBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const studyGroupMembers = mysqlTable("study_group_members", {
  id: int("id").autoincrement().primaryKey(),
  groupId: int("groupId").notNull(),
  userId: int("userId").notNull(),
  role: mysqlEnum("role", ["member", "admin"]).default("member").notNull(),
  joinedAt: timestamp("joinedAt").defaultNow().notNull(),
});

// ─── CLASS SESSIONS ─────────────────────────────────────────────────────────

export const classSessions = mysqlTable("class_sessions", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  teacherName: varchar("teacherName", { length: 128 }),
  languageCode: varchar("languageCode", { length: 32 }),
  level: varchar("level", { length: 8 }),
  scheduledAt: timestamp("scheduledAt").notNull(),
  durationMinutes: int("durationMinutes").default(45),
  maxStudents: int("maxStudents").default(20),
  status: mysqlEnum("status", ["scheduled", "live", "completed", "cancelled"]).default("scheduled").notNull(),
  recordingUrl: varchar("recordingUrl", { length: 512 }),
  humeConfigId: varchar("humeConfigId", { length: 128 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const classEnrollments = mysqlTable("class_enrollments", {
  id: int("id").autoincrement().primaryKey(),
  sessionId: int("sessionId").notNull(),
  userId: int("userId").notNull(),
  attended: int("attended").default(0),
  enrolledAt: timestamp("enrolledAt").defaultNow().notNull(),
});

// ─── TRANSACTIONS / CREDITS ─────────────────────────────────────────────────

export const transactions = mysqlTable("transactions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  type: mysqlEnum("type", ["subscription", "credit_purchase", "class_purchase", "refund"]).notNull(),
  amount: int("amount").notNull(), // cents
  currency: varchar("currency", { length: 3 }).default("USD"),
  description: varchar("description", { length: 255 }),
  status: mysqlEnum("status", ["pending", "completed", "failed", "refunded"]).default("pending").notNull(),
  externalId: varchar("externalId", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const userCredits = mysqlTable("user_credits", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  balance: int("balance").default(0).notNull(), // credits remaining
  totalEarned: int("totalEarned").default(0),
  totalSpent: int("totalSpent").default(0),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// ─── CALL HISTORY ───────────────────────────────────────────────────────────

export const callHistory = mysqlTable("call_history", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  callType: mysqlEnum("callType", ["voice", "video", "hume_teacher", "surprise", "group"]).notNull(),
  participantName: varchar("participantName", { length: 128 }),
  languageCode: varchar("languageCode", { length: 32 }),
  durationSeconds: int("durationSeconds").default(0),
  humeSessionId: varchar("humeSessionId", { length: 128 }),
  emotionSummary: json("emotionSummary"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ─── SAVED CONTENT ──────────────────────────────────────────────────────────

export const savedContent = mysqlTable("saved_content", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  contentType: mysqlEnum("contentType", ["lesson", "song", "phrase", "article", "video"]).notNull(),
  contentId: varchar("contentId", { length: 128 }).notNull(),
  title: varchar("title", { length: 255 }),
  metadata: json("metadata"),
  savedAt: timestamp("savedAt").defaultNow().notNull(),
});

// ─── USER SYNC DATA ────────────────────────────────────────────────────────

export const userSyncData = mysqlTable("user_sync_data", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  data: text("data"), // JSON blob of all syncable user data
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// ─── AFFILIATE APPLICATIONS ────────────────────────────────────────────────

export const affiliateApplications = mysqlTable("affiliate_applications", {
  id: int("id").autoincrement().primaryKey(),
  // If applicant is an existing user, link them
  userId: int("userId"),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  tiktokHandle: varchar("tiktokHandle", { length: 128 }),
  instagramHandle: varchar("instagramHandle", { length: 128 }),
  youtubeHandle: varchar("youtubeHandle", { length: 128 }),
  followerCount: varchar("followerCount", { length: 64 }),
  languagesSpoken: varchar("languagesSpoken", { length: 512 }),
  languagesTaught: varchar("languagesTaught", { length: 512 }),
  contentNiche: varchar("contentNiche", { length: 255 }),
  whyJoin: text("whyJoin"),
  tier: mysqlEnum("tier", ["tier1", "tier2"]).default("tier1").notNull(),
  status: mysqlEnum("status", ["pending", "approved", "rejected"]).default("pending").notNull(),
  referralCode: varchar("referralCode", { length: 64 }),
  referralLink: varchar("referralLink", { length: 512 }),
  // If this affiliate was recruited by another affiliate (Tier 2)
  parentAffiliateId: int("parentAffiliateId"),
  approvedAt: timestamp("approvedAt"),
  rejectedAt: timestamp("rejectedAt"),
  // Stripe Connect for payouts
  stripeConnectAccountId: varchar("stripeConnectAccountId", { length: 128 }),
  stripeOnboardingComplete: int("stripeOnboardingComplete").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AffiliateApplication = typeof affiliateApplications.$inferSelect;
export type InsertAffiliateApplication = typeof affiliateApplications.$inferInsert;

// ─── AFFILIATE REFERRALS ───────────────────────────────────────────────────
// Tracks each user signup attributed to an affiliate

export const affiliateReferrals = mysqlTable("affiliate_referrals", {
  id: int("id").autoincrement().primaryKey(),
  affiliateId: int("affiliateId").notNull(), // FK to affiliateApplications.id
  referredUserId: int("referredUserId").notNull(), // FK to users.id
  referralCode: varchar("referralCode", { length: 64 }).notNull(),
  tier: mysqlEnum("tier", ["tier1", "tier2"]).default("tier1").notNull(),
  // Conversion tracking
  signedUp: int("signedUp").default(1).notNull(),
  convertedToPaid: int("convertedToPaid").default(0).notNull(),
  subscriptionPlan: varchar("subscriptionPlan", { length: 64 }),
  conversionDate: timestamp("conversionDate"),
  // Revenue attribution
  revenueGenerated: int("revenueGenerated").default(0), // cents
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AffiliateReferral = typeof affiliateReferrals.$inferSelect;
export type InsertAffiliateReferral = typeof affiliateReferrals.$inferInsert;

// ─── AFFILIATE COMMISSIONS ─────────────────────────────────────────────────
// Tracks commission earned and payout status

export const affiliateCommissions = mysqlTable("affiliate_commissions", {
  id: int("id").autoincrement().primaryKey(),
  affiliateId: int("affiliateId").notNull(), // FK to affiliateApplications.id
  referralId: int("referralId"), // FK to affiliateReferrals.id (null for bonuses)
  type: mysqlEnum("type", ["tier1_commission", "tier2_commission", "bonus", "adjustment"]).notNull(),
  amount: int("amount").notNull(), // cents
  currency: varchar("currency", { length: 3 }).default("USD"),
  description: varchar("description", { length: 255 }),
  status: mysqlEnum("status", ["pending", "approved", "paid", "cancelled"]).default("pending").notNull(),
  paidAt: timestamp("paidAt"),
  payoutMethod: varchar("payoutMethod", { length: 64 }), // paypal, stripe, bank_transfer
  payoutReference: varchar("payoutReference", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AffiliateCommission = typeof affiliateCommissions.$inferSelect;
export type InsertAffiliateCommission = typeof affiliateCommissions.$inferInsert;

// ─── USER REFERRAL ATTRIBUTION ─────────────────────────────────────────────
// Stored on the user record at signup to track which affiliate referred them

export const userReferralAttribution = mysqlTable("user_referral_attribution", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(), // FK to users.id
  referralCode: varchar("referralCode", { length: 64 }).notNull(),
  affiliateId: int("affiliateId").notNull(), // FK to affiliateApplications.id
  source: varchar("source", { length: 64 }), // signup_form, deep_link, qr_code
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ═══════════════════════════════════════════════════════════════════════════════
// KNOWLEDGE VAULT — Persistent storage for ALL scraped/generated content
// Everything that gets scraped, translated, generated, or learned goes here.
// This is OUR data source — we own every word, meaning, and cultural note.
// ═══════════════════════════════════════════════════════════════════════════════

// ─── VOCAB BANK ────────────────────────────────────────────────────────────────
// Every vocabulary word we encounter, teach, or generate — across ALL languages

export const vocabBank = mysqlTable("vocab_bank", {
  id: int("id").autoincrement().primaryKey(),
  word: varchar("word", { length: 255 }).notNull(),
  pronunciation: varchar("pronunciation", { length: 255 }),
  meaning: text("meaning").notNull(),
  partOfSpeech: varchar("partOfSpeech", { length: 32 }), // noun, verb, adj, adv, phrase, idiom
  language: varchar("language", { length: 64 }).notNull(),
  dialect: varchar("dialect", { length: 64 }),
  region: varchar("region", { length: 128 }),
  cefrLevel: varchar("cefrLevel", { length: 4 }), // A1, A2, B1, B2, C1, C2
  category: varchar("category", { length: 64 }), // greetings, food, travel, emotions, slang, etc.
  exampleSentence: text("exampleSentence"),
  exampleTranslation: text("exampleTranslation"),
  culturalNote: text("culturalNote"),
  imagePrompt: text("imagePrompt"), // for CIA visual association method
  audioUrl: varchar("audioUrl", { length: 512 }),
  sourceCreator: varchar("sourceCreator", { length: 128 }), // which creator taught us this
  sourceUrl: varchar("sourceUrl", { length: 512 }),
  isSlang: int("isSlang").default(0),
  isVerified: int("isVerified").default(0), // community-verified
  freshness: varchar("freshness", { length: 16 }).default("current"), // current, trending, classic, outdated
  timesUsedInLessons: int("timesUsedInLessons").default(0),
  timesUsedInSongs: int("timesUsedInSongs").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// ─── SLANG VAULT ───────────────────────────────────────────────────────────────
// Dedicated slang storage with multiple meanings per region

export const slangVault = mysqlTable("slang_vault", {
  id: int("id").autoincrement().primaryKey(),
  word: varchar("word", { length: 255 }).notNull(),
  pronunciation: varchar("pronunciation", { length: 255 }),
  language: varchar("language", { length: 64 }).notNull(),
  dialect: varchar("dialect", { length: 64 }),
  region: varchar("region", { length: 128 }),
  meaning: text("meaning").notNull(),
  alternativeMeanings: json("alternativeMeanings"), // [{region, meaning, context}]
  formality: varchar("formality", { length: 32 }), // casual, vulgar, affectionate, formal
  usageContext: text("usageContext"), // when/where to use this
  exampleSentence: text("exampleSentence"),
  exampleTranslation: text("exampleTranslation"),
  warningNote: text("warningNote"), // "offensive in Puerto Rico" etc.
  sourceCreator: varchar("sourceCreator", { length: 128 }),
  sourceUrl: varchar("sourceUrl", { length: 512 }),
  isVerified: int("isVerified").default(0),
  freshness: varchar("freshness", { length: 16 }).default("current"),
  trendScore: int("trendScore").default(0), // how trending this word is
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// ─── TRANSLATION ARCHIVE ───────────────────────────────────────────────────────
// Every translation we've ever done — builds our own translation memory

export const translationArchive = mysqlTable("translation_archive", {
  id: int("id").autoincrement().primaryKey(),
  sourceText: text("sourceText").notNull(),
  translatedText: text("translatedText").notNull(),
  sourceLanguage: varchar("sourceLanguage", { length: 64 }).notNull(),
  targetLanguage: varchar("targetLanguage", { length: 64 }).notNull(),
  targetDialect: varchar("targetDialect", { length: 64 }),
  translationType: varchar("translationType", { length: 32 }), // text, voice, camera, song_lyric
  slangUsed: json("slangUsed"), // [{word, meaning, region}]
  culturalNotes: text("culturalNotes"),
  dialectVariants: json("dialectVariants"), // [{dialect, translation}]
  qualityScore: int("qualityScore"), // 1-100 AI-rated quality
  userId: int("userId"), // who requested this translation
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ─── SONG LIBRARY ──────────────────────────────────────────────────────────────
// Every song we generate, translate, or process

export const songLibrary = mysqlTable("song_library", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  titleEnglish: varchar("titleEnglish", { length: 255 }),
  language: varchar("language", { length: 64 }).notNull(),
  dialect: varchar("dialect", { length: 64 }),
  genre: varchar("genre", { length: 128 }),
  mood: varchar("mood", { length: 128 }),
  tempo: varchar("tempo", { length: 32 }),
  cefrLevel: varchar("cefrLevel", { length: 4 }),
  lyrics: text("lyrics"),
  lyricsTranslation: text("lyricsTranslation"),
  vocabTaught: json("vocabTaught"), // [{word, meaning, lineReference}]
  sunoPrompt: text("sunoPrompt"),
  sunoTags: varchar("sunoTags", { length: 512 }),
  audioUrl: varchar("audioUrl", { length: 512 }),
  audioUrl2: varchar("audioUrl2", { length: 512 }), // second version
  sunoJobId: varchar("sunoJobId", { length: 128 }),
  inspiredByCreator: varchar("inspiredByCreator", { length: 128 }),
  musicStyle: varchar("musicStyle", { length: 128 }), // Funketón, Flamenco Soul, etc.
  teachingNotes: text("teachingNotes"),
  isEntertainmentOnly: int("isEntertainmentOnly").default(0), // pure entertainment vs educational
  status: varchar("status", { length: 32 }).default("generated"), // generated, reviewed, published, archived
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// ─── CREATOR KNOWLEDGE ─────────────────────────────────────────────────────────
// Persistent store of everything we've learned from each creator

export const creatorKnowledge = mysqlTable("creator_knowledge", {
  id: int("id").autoincrement().primaryKey(),
  creatorName: varchar("creatorName", { length: 128 }).notNull(),
  handle: varchar("handle", { length: 128 }),
  platform: varchar("platform", { length: 32 }),
  airtableRecordId: varchar("airtableRecordId", { length: 32 }),
  language: varchar("language", { length: 64 }),
  region: varchar("region", { length: 128 }),
  contentType: varchar("contentType", { length: 32 }), // music, visual, conversational, entertainment
  teachingMethods: json("teachingMethods"), // [{method, description, bestForLevels}]
  musicStyles: json("musicStyles"), // [{genre, tags, mood}]
  topicsTeught: json("topicsTeught"), // [{topic, level, vocabWords}]
  slangContributed: json("slangContributed"), // [{word, meaning, region}]
  contentIdeas: json("contentIdeas"), // [{title, format, concept}]
  lessonsGenerated: int("lessonsGenerated").default(0),
  songsGenerated: int("songsGenerated").default(0),
  contentGenerated: int("contentGenerated").default(0),
  lastScrapedAt: timestamp("lastScrapedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// ─── LESSON ARCHIVE ────────────────────────────────────────────────────────────
// Every AI-generated lesson stored for reuse and improvement

export const lessonArchive = mysqlTable("lesson_archive", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  language: varchar("language", { length: 64 }).notNull(),
  dialect: varchar("dialect", { length: 64 }),
  cefrLevel: varchar("cefrLevel", { length: 4 }).notNull(),
  category: varchar("category", { length: 64 }), // vocabulary, grammar, speaking, listening
  topic: varchar("topic", { length: 255 }),
  culturalContext: text("culturalContext"),
  exercises: json("exercises"), // full exercise JSON
  vocabTaught: json("vocabTaught"), // [{word, pronunciation, meaning}]
  creatorMethodsUsed: json("creatorMethodsUsed"), // [{creatorName, method}]
  inspiredByCreators: json("inspiredByCreators"), // [creatorName]
  totalXP: int("totalXP").default(0),
  timesServed: int("timesServed").default(0),
  avgScore: int("avgScore"), // average user score 0-100
  qualityRating: int("qualityRating"), // AI self-rating 1-100
  status: varchar("status", { length: 32 }).default("generated"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// ─── CONTENT ARCHIVE ───────────────────────────────────────────────────────────
// Every content idea, reel script, social post we generate

export const contentArchive = mysqlTable("content_archive", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  format: varchar("format", { length: 32 }), // reel, carousel, story, short, post
  platform: varchar("platform", { length: 32 }), // instagram, tiktok, youtube, all
  language: varchar("language", { length: 64 }).notNull(),
  cefrLevel: varchar("cefrLevel", { length: 4 }),
  hook: text("hook"), // first 2 seconds attention grabber
  concept: text("concept"),
  script: text("script"),
  vocabTaught: json("vocabTaught"), // [{word, meaning}]
  inspiredByCreator: varchar("inspiredByCreator", { length: 128 }),
  hashtags: json("hashtags"),
  viralPotential: text("viralPotential"),
  status: varchar("status", { length: 32 }).default("idea"), // idea, scripted, produced, published
  publishedUrl: varchar("publishedUrl", { length: 512 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// ─── CULTURAL KNOWLEDGE ────────────────────────────────────────────────────────
// Cultural facts, traditions, foods, dances — everything we learn about cultures

export const culturalKnowledge = mysqlTable("cultural_knowledge", {
  id: int("id").autoincrement().primaryKey(),
  topic: varchar("topic", { length: 255 }).notNull(),
  category: varchar("category", { length: 64 }), // food, dance, holiday, tradition, music, history
  language: varchar("language", { length: 64 }).notNull(),
  region: varchar("region", { length: 128 }),
  description: text("description").notNull(),
  relatedVocab: json("relatedVocab"), // [{word, pronunciation, meaning}]
  imagePrompt: text("imagePrompt"),
  sourceCreator: varchar("sourceCreator", { length: 128 }),
  sourceUrl: varchar("sourceUrl", { length: 512 }),
  cefrLevel: varchar("cefrLevel", { length: 4 }),
  isVerified: int("isVerified").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// ─── EXERCISE ANALYTICS ────────────────────────────────────────────────────────
// Tracks exercise completion rates, accuracy, and engagement per exercise type
export const exerciseAnalytics = mysqlTable("exercise_analytics", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  eventId: varchar("eventId", { length: 64 }).notNull(),
  exerciseType: varchar("exerciseType", { length: 64 }).notNull(),
  action: varchar("action", { length: 16 }).notNull(), // start, complete, abandoned
  timestamp: timestamp("timestamp").notNull(),
  language: varchar("language", { length: 64 }).notNull(),
  level: varchar("level", { length: 8 }),
  correct: int("correct"),
  total: int("total"),
  durationMs: int("durationMs"),
  accuracy: int("accuracy"),
  audioMode: varchar("audioMode", { length: 16 }),
  phraseIndex: int("phraseIndex"),
  abandonReason: varchar("abandonReason", { length: 32 }),
  deviceId: varchar("deviceId", { length: 128 }),
  metadata: json("metadata"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  eventIdIdx: uniqueIndex("event_id_idx").on(table.eventId, table.userId),
}));

// ─── CONTENT VALIDATION ────────────────────────────────────────────────────────
// Review queue for Portuguese lessons and other content requiring native speaker validation
export const contentValidation = mysqlTable("content_validation", {
  id: int("id").autoincrement().primaryKey(),
  contentType: varchar("contentType", { length: 32 }).notNull(), // lesson, phrase, translation, slang
  language: varchar("language", { length: 64 }).notNull(),
  dialect: varchar("dialect", { length: 64 }),
  title: varchar("title", { length: 255 }).notNull(),
  content: json("content").notNull(), // The full lesson/phrase data
  sourceCreator: varchar("sourceCreator", { length: 128 }),
  status: varchar("status", { length: 32 }).default("pending_review").notNull(), // pending_review, approved, rejected, needs_revision
  reviewerNotes: text("reviewerNotes"),
  reviewedBy: int("reviewedBy"),
  reviewedAt: timestamp("reviewedAt"),
  submittedBy: int("submittedBy"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});


// ─── RATE LIMITING ────────────────────────────────────────────────────────────
// Persistent rate-limit state that survives server restarts

export const rateLimitEntries = mysqlTable("rate_limit_entries", {
  id: int("id").autoincrement().primaryKey(),
  key: varchar("key", { length: 255 }).notNull(), // e.g., "redeem:user_123" or "redeem:anon_CODE"
  endpoint: varchar("endpoint", { length: 128 }).notNull(), // e.g., "validateAndRedeem"
  attempts: int("attempts").default(1).notNull(),
  windowStart: timestamp("windowStart").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  keyEndpointIdx: uniqueIndex("key_endpoint_idx").on(table.key, table.endpoint),
}));

export type RateLimitEntry = typeof rateLimitEntries.$inferSelect;
export type InsertRateLimitEntry = typeof rateLimitEntries.$inferInsert;
