/**
 * AI Short Film Production & Scheduling System
 *
 * Manages the creation, scheduling, and delivery of AI-generated short films
 * that serve as entertainment + education content within ConnectWorld AI.
 *
 * Key principles:
 * - Cinematic quality (inspired by @dope_got_visions)
 * - Episodic storytelling (users come back for the next episode)
 * - Scheduled drops (new content at specific times)
 * - Multi-language lip-sync (same video → every language)
 * - Vocabulary embedded naturally (not forced)
 * - Cultural immersion (real places, real situations)
 *
 * Production pipeline:
 * 1. Script generation (AI writes episode scripts with embedded vocabulary)
 * 2. Visual generation (AI creates cinematic visuals — Kling/Synthesia)
 * 3. Voice generation (ElevenLabs with character-specific voices)
 * 4. Lip-sync translation (HeyGen/Rask AI dubs into all languages)
 * 5. Post-production (music, SFX, color grading, text overlays)
 * 6. Scheduling (queue for timed release)
 * 7. Push notification (alert users when episode drops)
 */

import { SeriesDefinition, AI_SHORT_FILM_SERIES, VideoCategory } from './content-feed';

// Episode script structure
export interface EpisodeScript {
  seriesId: string;
  seasonNumber: number;
  episodeNumber: number;
  title: string;
  synopsis: string;
  duration: number; // target seconds (60-90 for shorts)
  scenes: ScriptScene[];
  targetVocabulary: VocabTarget[];
  culturalNotes: string[];
  cliffhanger?: string; // Teaser for next episode
  previousEpisodeRecap?: string;
}

export interface ScriptScene {
  sceneNumber: number;
  location: string;
  description: string; // Visual description for AI generation
  dialogue: DialogueLine[];
  action: string; // What happens visually
  mood: 'comedic' | 'dramatic' | 'tense' | 'romantic' | 'educational' | 'exciting';
  cameraDirection: string; // "Wide shot of colmado exterior" etc.
  duration: number; // seconds
}

export interface DialogueLine {
  character: string;
  text: string; // In original language
  translation: string; // English translation
  emotion: string;
  isSlang: boolean;
  slangExplanation?: string;
}

export interface VocabTarget {
  word: string;
  language: string;
  translation: string;
  context: string; // How it's used in the episode
  difficulty: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
  isSlang: boolean;
  region?: string;
}

// Production status tracking
export interface EpisodeProduction {
  episodeId: string;
  seriesId: string;
  status: ProductionStatus;
  script: EpisodeScript;
  assets: ProductionAssets;
  translations: LanguageTranslation[];
  scheduledRelease: string; // ISO date
  actualRelease?: string;
  metrics?: EpisodeMetrics;
}

export type ProductionStatus =
  | 'scripted'
  | 'visual_generation'
  | 'voice_generation'
  | 'lip_sync_translation'
  | 'post_production'
  | 'review'
  | 'scheduled'
  | 'released';

export interface ProductionAssets {
  scriptFile?: string;
  rawVideoUrl?: string;
  voiceoverUrls: Record<string, string>; // language -> audio URL
  lipSyncedVideoUrls: Record<string, string>; // language -> video URL
  thumbnailUrl?: string;
  subtitleFiles: Record<string, string>; // language -> SRT/VTT URL
  musicTrackUrl?: string;
  sfxUrls: string[];
}

export interface LanguageTranslation {
  language: string;
  languageLabel: string;
  status: 'pending' | 'voice_generated' | 'lip_synced' | 'complete';
  voiceUrl?: string;
  videoUrl?: string;
  subtitleUrl?: string;
}

export interface EpisodeMetrics {
  totalViews: number;
  viewsByLanguage: Record<string, number>;
  avgWatchTime: number;
  completionRate: number;
  vocabRetention: number; // % of users who remembered target vocab next day
  shareCount: number;
  saveCount: number;
}

// Content quality standards (inspired by @dope_got_visions)
export const PRODUCTION_STANDARDS = {
  visual: {
    resolution: '1080x1920', // Vertical for mobile
    fps: 30,
    colorGrading: 'cinematic', // Warm tones, high contrast
    transitions: ['smooth_cut', 'fade', 'whip_pan', 'zoom_in'],
    textOverlayStyle: 'minimal', // Subtle vocab highlights, not distracting
    aspectRatio: '9:16',
  },
  audio: {
    voiceQuality: 'elevenlabs_hd', // ElevenLabs high-definition voices
    backgroundMusic: true,
    sfx: true,
    musicVolume: 0.15, // Background, not overpowering
    voiceVolume: 1.0,
    sfxVolume: 0.3,
  },
  pacing: {
    minSceneDuration: 3, // seconds
    maxSceneDuration: 20, // seconds
    dialoguePause: 0.5, // seconds between lines
    vocabHighlightDuration: 2, // seconds to show vocab overlay
  },
  engagement: {
    hookWithin: 3, // Must hook viewer within 3 seconds
    cliffhangerRequired: true,
    vocabPerMinute: 6, // Max new words per minute (not overwhelming)
    humorFrequency: 'every_30_seconds', // Keep it entertaining
  },
};

/**
 * Generate an episode script prompt for AI
 */
export function generateScriptPrompt(
  series: SeriesDefinition,
  episodeNumber: number,
  targetLanguage: string,
  targetVocab: string[],
  previousEpisodeSummary?: string,
): string {
  return `
You are a screenwriter for "${series.title}" — a ${series.genre} series on ConnectWorld AI.

SERIES PREMISE: ${series.description}

EPISODE ${episodeNumber} of ${series.totalEpisodes} (Season ${series.currentSeason})

TARGET LANGUAGE: ${targetLanguage}
CULTURAL REGION: ${series.culturalRegion}
DIFFICULTY: ${series.difficulty}
DURATION: 60-90 seconds

CHARACTERS:
${series.characters.map(c => `- ${c.name} (${c.role}) — speaks ${c.language} with ${c.accent} accent`).join('\n')}

TARGET VOCABULARY TO EMBED NATURALLY:
${targetVocab.map(v => `- ${v}`).join('\n')}

${previousEpisodeSummary ? `PREVIOUS EPISODE RECAP: ${previousEpisodeSummary}` : 'This is the FIRST episode.'}

PRODUCTION STANDARDS:
- Hook the viewer within 3 seconds
- Dialogue must sound NATURAL (real street language, not textbook)
- Vocabulary is embedded in context (characters USE the words naturally)
- End with a CLIFFHANGER that makes them want the next episode
- Include humor every 30 seconds
- Cultural authenticity is critical — real places, real situations
- Cinematic visual descriptions (think short film, not educational video)

Write the complete episode script with:
1. Title
2. Synopsis (1 sentence)
3. Scene-by-scene breakdown (location, action, dialogue, camera direction)
4. Target vocabulary list with context
5. Cliffhanger ending
6. "Next episode" teaser (1 sentence)
`;
}

/**
 * Calculate the release schedule for a series
 */
export function calculateReleaseSchedule(
  series: SeriesDefinition,
  startDate: Date,
): { episodeNumber: number; releaseDate: Date }[] {
  const schedule: { episodeNumber: number; releaseDate: Date }[] = [];
  let currentDate = new Date(startDate);
  const [hours, minutes] = series.releaseTime.split(':').map(Number);

  for (let ep = 1; ep <= series.totalEpisodes; ep++) {
    const releaseDate = new Date(currentDate);
    releaseDate.setHours(hours, minutes, 0, 0);
    schedule.push({ episodeNumber: ep, releaseDate });

    // Advance to next release day
    switch (series.releaseSchedule) {
      case 'daily':
        currentDate.setDate(currentDate.getDate() + 1);
        break;
      case 'weekdays':
        currentDate.setDate(currentDate.getDate() + 1);
        // Skip weekends
        while (currentDate.getDay() === 0 || currentDate.getDay() === 6) {
          currentDate.setDate(currentDate.getDate() + 1);
        }
        break;
      case 'weekly':
        currentDate.setDate(currentDate.getDate() + 7);
        break;
    }
  }

  return schedule;
}

/**
 * Get notification content for an episode drop
 */
export function getEpisodeDropNotification(
  series: SeriesDefinition,
  episodeNumber: number,
  episodeTitle: string,
): { title: string; body: string } {
  const emojis: Record<string, string> = {
    comedy: '😂',
    drama: '🎭',
    adventure: '🌍',
    romance: '💕',
    thriller: '😱',
    cooking: '👨‍🍳',
    travel: '✈️',
    music: '🎵',
    documentary: '📹',
    sitcom: '📺',
    action: '💥',
  };

  const emoji = emojis[series.genre] || '🎬';

  return {
    title: `${emoji} New Episode: ${series.title}`,
    body: `Episode ${episodeNumber}: "${episodeTitle}" just dropped! Watch now before your friends spoil it.`,
  };
}

/**
 * Determine which series episodes to produce next based on engagement
 */
export function prioritizeProduction(
  series: SeriesDefinition[],
  metrics: Record<string, EpisodeMetrics[]>,
): string[] {
  // Sort series by engagement (completion rate * views)
  const ranked = series
    .map((s) => {
      const seriesMetrics = metrics[s.id] || [];
      const avgCompletion = seriesMetrics.length > 0
        ? seriesMetrics.reduce((sum, m) => sum + m.completionRate, 0) / seriesMetrics.length
        : 0.5; // Default for new series
      const totalViews = seriesMetrics.reduce((sum, m) => sum + m.totalViews, 0);
      return {
        seriesId: s.id,
        score: avgCompletion * Math.log(totalViews + 1),
        hasUnreleasedEpisodes: s.releasedEpisodes < s.totalEpisodes,
      };
    })
    .filter((s) => s.hasUnreleasedEpisodes)
    .sort((a, b) => b.score - a.score);

  return ranked.map((r) => r.seriesId);
}

/**
 * Get all available series for a user based on their learning language
 */
export function getSeriesForLanguage(targetLanguage: string): SeriesDefinition[] {
  return AI_SHORT_FILM_SERIES.filter((series) =>
    series.targetLanguages.some((lang) =>
      targetLanguage.startsWith(lang) || lang.startsWith(targetLanguage)
    )
  );
}

/**
 * Get the "Up Next" content for a user's daily schedule
 */
export function getDailyContentForUser(
  userLanguage: string,
  currentHour: number,
): { series: SeriesDefinition; episodeNumber: number; dropTime: string }[] {
  const availableSeries = getSeriesForLanguage(userLanguage);
  const upcoming: { series: SeriesDefinition; episodeNumber: number; dropTime: string }[] = [];

  for (const series of availableSeries) {
    const [hours] = series.releaseTime.split(':').map(Number);
    if (hours >= currentHour) {
      upcoming.push({
        series,
        episodeNumber: series.releasedEpisodes + 1,
        dropTime: series.releaseTime,
      });
    }
  }

  return upcoming.sort((a, b) => a.dropTime.localeCompare(b.dropTime));
}
