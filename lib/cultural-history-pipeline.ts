/**
 * ConnectWorld AI — Cultural History Content Production Pipeline
 * 
 * Integrates with the social content calendar to produce ItsAI History-style
 * AI-generated cultural/historical videos for TikTok, Instagram Reels, and YouTube Shorts.
 * 
 * Production stack:
 * - Kling AI (via fal.ai) → Video generation (historical scene recreations)
 * - ElevenLabs → Voiceover narration (documentary tone)
 * - Content Calendar → Scheduling and cross-platform posting
 * 
 * Brand positioning: "Want to learn more of the culture? ConnectWorld AI — where the greatest scholars learn."
 */

// ============================================================
// CULTURAL HISTORY SERIES CONFIGURATION
// ============================================================

export interface CulturalHistoryScript {
  id: string;
  title: string;
  pillar: CulturalHistoryPillar;
  languageTieIn: string;
  hook: string;
  narration: string;
  klingPrompt: string;
  textOverlays: string[];
  ctaVariant: number;
  duration: number;
  scheduledWeek: number;
  hashtags: string[];
}

export type CulturalHistoryPillar =
  | 'caribbean_origins'
  | 'latin_american_empires'
  | 'african_kingdoms'
  | 'european_foundations'
  | 'east_asian_civilizations'
  | 'language_evolution';

export const PILLAR_DESCRIPTIONS: Record<CulturalHistoryPillar, string> = {
  caribbean_origins: 'Haiti, DR, Taíno civilization, African roots of Caribbean culture',
  latin_american_empires: 'Aztec, Maya, Muisca, Tairona, African diaspora in Latin America',
  african_kingdoms: 'Mali Empire, Yoruba city-states, Great Zimbabwe, Swahili Coast',
  european_foundations: 'Moorish Spain, Viking influence, French Revolution, Age of Exploration',
  east_asian_civilizations: 'Samurai Japan, Joseon Korea, Silk Road, K-pop origins',
  language_evolution: 'How Creoles form, dialect divergence, linguistic relativity, neuroscience of bilingualism',
};

// ============================================================
// CTA TEMPLATES
// ============================================================

export const CTA_VARIANTS = [
  'Want to learn more of the culture and speak the language? ConnectWorld AI — link in bio.',
  'The culture runs deep. Learn the language that carries it. Download ConnectWorld AI.',
  'History shaped the language. Now learn both. ConnectWorld AI — where scholars learn.',
  'This is just the beginning. Dive deeper into the culture and language on ConnectWorld AI.',
  'The greatest scholars don\'t just study words — they study culture. Join them on ConnectWorld AI.',
];

// ============================================================
// PRODUCTION SPECIFICATIONS
// ============================================================

export const PRODUCTION_SPECS = {
  aspectRatio: '9:16',
  resolution: { width: 1080, height: 1920 },
  duration: { min: 60, max: 90 },
  voiceover: {
    provider: 'elevenlabs',
    voice: 'documentary_narrator', // Deep, authoritative, calm
    speed: 1.0,
    stability: 0.75,
    clarity: 0.85,
  },
  visuals: {
    provider: 'kling_via_fal',
    style: 'photorealistic_cinematic',
    clipsPerVideo: { min: 4, max: 6 },
    clipDuration: { min: 5, max: 15 },
    colorGrading: 'warm_golden_hour',
  },
  audio: {
    music: 'subtle_ambient_cinematic',
    musicVolume: 0.15, // 15% — narration dominant
    cultureSpecific: true, // Match instruments to region
  },
  text: {
    subtitles: true,
    subtitleStyle: 'white_with_dark_shadow',
    subtitlePosition: 'lower_third',
    overlays: true,
    overlayFont: 'bold_sans_serif',
    watermark: 'connectworld_ai_logo_bottom_right',
  },
} as const;

// ============================================================
// KLING PROMPT TEMPLATE
// ============================================================

export const KLING_PROMPT_TEMPLATE = (scene: string, timePeriod: string, location: string) =>
  `Photorealistic cinematic recreation of ${scene}, ${timePeriod}, ${location}. ` +
  `Warm golden-hour lighting, shallow depth of field, 9:16 vertical composition. ` +
  `Historical accuracy in clothing, architecture, and environment. Documentary film quality.`;

// ============================================================
// POSTING SCHEDULE
// ============================================================

export const CULTURAL_HISTORY_SCHEDULE = {
  platforms: {
    tiktok: { frequency: 5, bestTime: '19:00 EST', notes: 'Native upload, trending sounds optional' },
    instagram_reels: { frequency: 5, bestTime: '11:00 EST', notes: 'Cross-post, add carousel companion' },
    youtube_shorts: { frequency: 3, bestTime: '15:00 EST', notes: 'Slightly longer cuts, add end screen' },
    in_app_feed: { frequency: 'all', notes: 'Full library available to app users' },
  },
  weeklyDistribution: {
    monday: 'caribbean_origins',
    tuesday: 'latin_american_empires',
    wednesday: 'african_kingdoms',
    thursday: 'european_foundations',
    friday: 'east_asian_civilizations',
    saturday: 'language_evolution',
    sunday: 'language_evolution', // Double up on universal appeal content for weekend
  },
} as const;

// ============================================================
// COST ESTIMATION
// ============================================================

export const COST_PER_VIDEO = {
  klingClips: { min: 0.50, max: 1.00, average: 0.75 },
  elevenLabsVoiceover: { min: 0.10, max: 0.20, average: 0.15 },
  musicRoyaltyFree: 0.00,
  totalPerVideo: { min: 0.60, max: 1.20, average: 0.90 },
  monthlyBudget: { videosPerMonth: 20, totalCost: 18.00 },
} as const;

// ============================================================
// HASHTAG STRATEGY
// ============================================================

export const HASHTAG_SETS: Record<string, string[]> = {
  primary: ['#ConnectWorldAI', '#LearnTheCulture', '#LanguageLearning', '#CulturalHistory'],
  haiti: ['#Haiti', '#HaitianHistory', '#KreyolAyisyen', '#HaitianCulture', '#Ayiti', '#HaitianRevolution'],
  dominican_republic: ['#DominicanRepublic', '#RD', '#HistoriaDominicana', '#SpanishHistory', '#Quisqueya'],
  mexico: ['#Mexico', '#MexicanHistory', '#HistoriaDeMexico', '#Aztec', '#Maya', '#Nahuatl'],
  france: ['#France', '#FrenchHistory', '#HistoireDeFrance', '#FrenchCulture', '#Francais'],
  japan: ['#Japan', '#JapaneseHistory', '#日本の歴史', '#JapaneseCulture', '#Samurai', '#Kanji'],
  korea: ['#Korea', '#KoreanHistory', '#한국역사', '#KoreanCulture', '#Hangul', '#KPop'],
  brazil: ['#Brazil', '#BrazilianHistory', '#HistóriaDoBrasil', '#PortugueseCulture', '#Capoeira'],
  colombia: ['#Colombia', '#ColombianHistory', '#HistoriaDeColombia', '#CiudadPerdida'],
  africa: ['#AfricanHistory', '#MaliEmpire', '#Yoruba', '#GreatZimbabwe', '#SwahiliCoast', '#MansaMusa'],
  language_science: ['#Linguistics', '#LanguageScience', '#Bilingual', '#Polyglot', '#BrainScience'],
};

// ============================================================
// PRODUCTION WORKFLOW
// ============================================================

export interface ProductionJob {
  scriptId: string;
  status: 'scripted' | 'visual_generation' | 'voiceover' | 'assembly' | 'review' | 'approved' | 'scheduled' | 'posted';
  klingJobIds: string[];
  elevenLabsJobId: string | null;
  assembledVideoUrl: string | null;
  scheduledDate: string | null;
  platforms: string[];
  cost: number;
}

export const PRODUCTION_WORKFLOW_STEPS = [
  { step: 1, name: 'Script Finalization', description: 'Review and approve script from batch', owner: 'content_team' },
  { step: 2, name: 'Visual Generation', description: 'Generate 4-6 Kling AI clips per script', owner: 'ai_pipeline' },
  { step: 3, name: 'Voiceover Recording', description: 'ElevenLabs narration of full script', owner: 'ai_pipeline' },
  { step: 4, name: 'Assembly', description: 'Stitch clips + voiceover + music + text overlays + subtitles', owner: 'editor' },
  { step: 5, name: 'Review', description: 'Check historical accuracy, visual quality, audio sync', owner: 'content_team' },
  { step: 6, name: 'Schedule', description: 'Queue in content calendar for cross-platform posting', owner: 'scheduler' },
] as const;

// ============================================================
// SERIES METADATA (for in-app ConnectWorld AI TV integration)
// ============================================================

export const CULTURAL_HISTORY_SERIES = {
  id: 'cultural_history_main',
  title: 'ConnectWorld AI — Cultural History',
  description: 'AI-generated historical recreations exploring the cultures behind the languages you learn. From the Haitian Revolution to the Silk Road, discover why language and culture are inseparable.',
  thumbnail: 'cultural_history_series_thumb.png',
  totalEpisodes: 30,
  releaseSchedule: '5 per week (Mon-Fri)',
  targetAudience: 'All language learners, history enthusiasts, culturally curious audiences',
  languages: ['Haitian Creole', 'Dominican Spanish', 'Mexican Spanish', 'Colombian Spanish', 'Brazilian Portuguese', 'French', 'Japanese', 'Korean', 'Mandarin', 'Swahili', 'Yoruba'],
  kpis: {
    viewsPerVideo: { month1: 10000, month3: 100000 },
    followerGrowth: { month1: 5000, month3: 25000 },
    appDownloads: { month1: 200, month3: 2000 },
    engagementRate: { month1: 0.05, month3: 0.08 },
    watchCompletion: { month1: 0.60, month3: 0.70 },
  },
} as const;
