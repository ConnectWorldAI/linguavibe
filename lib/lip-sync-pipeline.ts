/**
 * Lip-Sync Video Translation Pipeline
 *
 * Takes a single video and produces lip-synced translations in 20+ languages.
 * The same visual content is served to users based on their learning language.
 *
 * Pipeline:
 * 1. Original video (source language)
 * 2. Transcribe + translate script to target languages
 * 3. Generate voice in target language (ElevenLabs — matching character voice)
 * 4. Lip-sync the video to match new audio (HeyGen / Rask AI / Sync Labs)
 * 5. Generate subtitles (SRT/VTT) for each language
 * 6. Store all versions, serve based on user's learning language
 *
 * Supported APIs (user to choose one):
 * - HeyGen: Best quality lip sync, $24/mo for 15 min
 * - Rask AI: All-in-one translation + lip sync, $60/mo for 100 min
 * - Sync Labs (sync.so): Developer-friendly API, pay per minute
 *
 * Cost considerations:
 * - Each 60-second video × 20 languages = 20 minutes of lip-sync processing
 * - At scale: batch processing during off-peak hours
 * - Cache aggressively — once translated, store forever
 */

// Supported target languages for lip-sync translation
export const LIP_SYNC_LANGUAGES = [
  { code: 'es-DO', label: 'Dominican Spanish', region: 'Caribbean' },
  { code: 'es-CO', label: 'Colombian Spanish', region: 'South America' },
  { code: 'es-MX', label: 'Mexican Spanish', region: 'North America' },
  { code: 'es-VE', label: 'Venezuelan Spanish', region: 'South America' },
  { code: 'es-CU', label: 'Cuban Spanish', region: 'Caribbean' },
  { code: 'es-AR', label: 'Argentine Spanish', region: 'South America' },
  { code: 'fr', label: 'French', region: 'Europe' },
  { code: 'fr-HT', label: 'Haitian Creole', region: 'Caribbean' },
  { code: 'pt-BR', label: 'Brazilian Portuguese', region: 'South America' },
  { code: 'ja', label: 'Japanese', region: 'East Asia' },
  { code: 'ko', label: 'Korean', region: 'East Asia' },
  { code: 'zh', label: 'Mandarin Chinese', region: 'East Asia' },
  { code: 'it', label: 'Italian', region: 'Europe' },
  { code: 'de', label: 'German', region: 'Europe' },
  { code: 'ar-EG', label: 'Egyptian Arabic', region: 'Middle East' },
  { code: 'hi', label: 'Hindi', region: 'South Asia' },
  { code: 'en', label: 'English', region: 'Global' },
  { code: 'sw', label: 'Swahili', region: 'East Africa' },
  { code: 'yo', label: 'Yoruba', region: 'West Africa' },
  { code: 'tl', label: 'Tagalog', region: 'Southeast Asia' },
] as const;

export type LipSyncLanguageCode = typeof LIP_SYNC_LANGUAGES[number]['code'];

// API Provider configuration
export type LipSyncProvider = 'heygen' | 'rask_ai' | 'sync_labs';

export interface LipSyncProviderConfig {
  provider: LipSyncProvider;
  apiKey: string;
  baseUrl: string;
  costPerMinute: number; // USD
  maxConcurrentJobs: number;
  supportedLanguages: string[];
  features: {
    voiceCloning: boolean;
    emotionPreservation: boolean;
    multiSpeaker: boolean;
    batchProcessing: boolean;
    webhookCallback: boolean;
  };
}

// Provider configurations (API keys stored in env)
export const PROVIDER_CONFIGS: Record<LipSyncProvider, Omit<LipSyncProviderConfig, 'apiKey'>> = {
  heygen: {
    provider: 'heygen',
    baseUrl: 'https://api.heygen.com/v2',
    costPerMinute: 0.50,
    maxConcurrentJobs: 5,
    supportedLanguages: ['en', 'es', 'fr', 'de', 'it', 'pt', 'ja', 'ko', 'zh', 'ar', 'hi', 'ru'],
    features: {
      voiceCloning: true,
      emotionPreservation: true,
      multiSpeaker: true,
      batchProcessing: true,
      webhookCallback: true,
    },
  },
  rask_ai: {
    provider: 'rask_ai',
    baseUrl: 'https://api.rask.ai/v1',
    costPerMinute: 0.10,
    maxConcurrentJobs: 10,
    supportedLanguages: ['en', 'es', 'fr', 'de', 'it', 'pt', 'ja', 'ko', 'zh', 'ar', 'hi', 'ru', 'sw', 'yo', 'tl'],
    features: {
      voiceCloning: true,
      emotionPreservation: true,
      multiSpeaker: true,
      batchProcessing: true,
      webhookCallback: true,
    },
  },
  sync_labs: {
    provider: 'sync_labs',
    baseUrl: 'https://api.sync.so/v2',
    costPerMinute: 0.20,
    maxConcurrentJobs: 8,
    supportedLanguages: ['en', 'es', 'fr', 'de', 'it', 'pt', 'ja', 'ko', 'zh', 'ar', 'hi'],
    features: {
      voiceCloning: true,
      emotionPreservation: false,
      multiSpeaker: true,
      batchProcessing: true,
      webhookCallback: true,
    },
  },
};

// Translation job
export interface LipSyncJob {
  id: string;
  sourceVideoUrl: string;
  sourceLanguage: string;
  targetLanguage: string;
  provider: LipSyncProvider;
  status: LipSyncJobStatus;
  progress: number; // 0-100
  createdAt: string;
  completedAt?: string;
  outputVideoUrl?: string;
  outputAudioUrl?: string;
  subtitleUrl?: string;
  error?: string;
  cost?: number; // USD
  durationSeconds: number;
  metadata: {
    seriesId?: string;
    episodeNumber?: number;
    contentId: string;
    priority: 'high' | 'normal' | 'low';
  };
}

export type LipSyncJobStatus =
  | 'queued'
  | 'transcribing'
  | 'translating'
  | 'voice_generating'
  | 'lip_syncing'
  | 'post_processing'
  | 'complete'
  | 'failed';

// Batch translation request
export interface BatchTranslationRequest {
  sourceVideoUrl: string;
  sourceLanguage: string;
  targetLanguages: string[];
  priority: 'high' | 'normal' | 'low';
  contentId: string;
  seriesId?: string;
  episodeNumber?: number;
  voiceProfile?: string; // ElevenLabs voice ID for consistency
  preserveBackgroundAudio: boolean;
  generateSubtitles: boolean;
}

// Cost estimation
export interface CostEstimate {
  provider: LipSyncProvider;
  videoDurationMinutes: number;
  numberOfLanguages: number;
  totalMinutesToProcess: number;
  costPerMinute: number;
  totalCost: number;
  estimatedTimeMinutes: number;
}

/**
 * Estimate cost for translating a video into multiple languages
 */
export function estimateTranslationCost(
  videoDurationSeconds: number,
  targetLanguages: string[],
  provider: LipSyncProvider,
): CostEstimate {
  const config = PROVIDER_CONFIGS[provider];
  const durationMinutes = videoDurationSeconds / 60;
  const totalMinutes = durationMinutes * targetLanguages.length;
  const totalCost = totalMinutes * config.costPerMinute;

  // Estimate processing time (roughly 3x real-time for lip sync)
  const processingMultiplier = 3;
  const parallelJobs = config.maxConcurrentJobs;
  const estimatedTimeMinutes = (totalMinutes * processingMultiplier) / parallelJobs;

  return {
    provider,
    videoDurationMinutes: durationMinutes,
    numberOfLanguages: targetLanguages.length,
    totalMinutesToProcess: totalMinutes,
    costPerMinute: config.costPerMinute,
    totalCost: Math.round(totalCost * 100) / 100,
    estimatedTimeMinutes: Math.round(estimatedTimeMinutes),
  };
}

/**
 * Compare costs across all providers for a given job
 */
export function compareProviderCosts(
  videoDurationSeconds: number,
  targetLanguages: string[],
): CostEstimate[] {
  return (['heygen', 'rask_ai', 'sync_labs'] as LipSyncProvider[]).map((provider) =>
    estimateTranslationCost(videoDurationSeconds, targetLanguages, provider)
  );
}

/**
 * Calculate monthly cost for scheduled content production
 *
 * Example: 5 series × 5 episodes/week × 60 seconds × 20 languages
 * = 5 × 5 × 1 × 20 = 500 minutes/week of lip-sync processing
 */
export function calculateMonthlyProductionCost(
  seriesCount: number,
  episodesPerWeekPerSeries: number,
  avgEpisodeDurationSeconds: number,
  languageCount: number,
  provider: LipSyncProvider,
): {
  weeklyMinutes: number;
  monthlyMinutes: number;
  monthlyCost: number;
  costPerEpisode: number;
  costPerEpisodePerLanguage: number;
} {
  const config = PROVIDER_CONFIGS[provider];
  const episodeDurationMinutes = avgEpisodeDurationSeconds / 60;
  const weeklyMinutes = seriesCount * episodesPerWeekPerSeries * episodeDurationMinutes * languageCount;
  const monthlyMinutes = weeklyMinutes * 4.33; // avg weeks per month
  const monthlyCost = monthlyMinutes * config.costPerMinute;
  const totalEpisodesPerMonth = seriesCount * episodesPerWeekPerSeries * 4.33;
  const costPerEpisode = monthlyCost / totalEpisodesPerMonth;
  const costPerEpisodePerLanguage = costPerEpisode / languageCount;

  return {
    weeklyMinutes: Math.round(weeklyMinutes),
    monthlyMinutes: Math.round(monthlyMinutes),
    monthlyCost: Math.round(monthlyCost * 100) / 100,
    costPerEpisode: Math.round(costPerEpisode * 100) / 100,
    costPerEpisodePerLanguage: Math.round(costPerEpisodePerLanguage * 100) / 100,
  };
}

/**
 * Create a batch translation request for an episode
 */
export function createBatchRequest(
  videoUrl: string,
  sourceLanguage: string,
  userTargetLanguage: string,
  contentId: string,
  options?: {
    seriesId?: string;
    episodeNumber?: number;
    priority?: 'high' | 'normal' | 'low';
    voiceProfile?: string;
  },
): BatchTranslationRequest {
  // Determine which languages to translate into
  // For scheduled content: translate into ALL supported languages
  // For user-requested: translate into just their target language
  const targetLanguages = LIP_SYNC_LANGUAGES
    .map((l) => l.code)
    .filter((code) => code !== sourceLanguage);

  return {
    sourceVideoUrl: videoUrl,
    sourceLanguage,
    targetLanguages,
    priority: options?.priority || 'normal',
    contentId,
    seriesId: options?.seriesId,
    episodeNumber: options?.episodeNumber,
    voiceProfile: options?.voiceProfile,
    preserveBackgroundAudio: true,
    generateSubtitles: true,
  };
}

/**
 * Get the correct video URL for a user based on their learning language
 */
export function getVideoForUserLanguage(
  availableTranslations: Record<string, string>, // language -> video URL
  userLearningLanguage: string,
  fallbackLanguage: string = 'en',
): { videoUrl: string; language: string } {
  // Exact match
  if (availableTranslations[userLearningLanguage]) {
    return { videoUrl: availableTranslations[userLearningLanguage], language: userLearningLanguage };
  }

  // Partial match (e.g., user learning "es-DO" but only "es" available)
  const baseLanguage = userLearningLanguage.split('-')[0];
  const partialMatch = Object.keys(availableTranslations).find(
    (lang) => lang.startsWith(baseLanguage)
  );
  if (partialMatch) {
    return { videoUrl: availableTranslations[partialMatch], language: partialMatch };
  }

  // Fallback to English or source
  if (availableTranslations[fallbackLanguage]) {
    return { videoUrl: availableTranslations[fallbackLanguage], language: fallbackLanguage };
  }

  // Return first available
  const firstLang = Object.keys(availableTranslations)[0];
  return { videoUrl: availableTranslations[firstLang], language: firstLang };
}

/**
 * Production cost analysis for the profitability model
 *
 * Scenario: 6 series, daily episodes, 60 seconds each, 20 languages
 */
export const PRODUCTION_COST_ANALYSIS = {
  scenario: '6 series × daily episodes × 60s × 20 languages',
  providers: {
    heygen: calculateMonthlyProductionCost(6, 5, 60, 20, 'heygen'),
    rask_ai: calculateMonthlyProductionCost(6, 5, 60, 20, 'rask_ai'),
    sync_labs: calculateMonthlyProductionCost(6, 5, 60, 20, 'sync_labs'),
  },
  recommendation: 'Rask AI offers the best value at scale ($0.10/min vs $0.50/min for HeyGen). ' +
    'However, HeyGen has superior lip-sync quality. Recommended strategy: Use HeyGen for ' +
    'hero/flagship series (Granny Abroad, Lost in Translation) and Rask AI for volume content.',
};
