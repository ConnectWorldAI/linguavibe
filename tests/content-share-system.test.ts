import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

const appDir = path.resolve(__dirname, '..');

describe('Deep Links System', () => {
  const filePath = path.join(appDir, 'lib/deep-links.ts');
  const content = fs.readFileSync(filePath, 'utf-8');

  it('exists and exports getContentWebUrl', () => {
    expect(fs.existsSync(filePath)).toBe(true);
    expect(content).toContain('export function getContentWebUrl');
  });

  it('exports getContentDeepLink', () => {
    expect(content).toContain('export function getContentDeepLink');
  });

  it('exports getEmbedCode', () => {
    expect(content).toContain('export function getEmbedCode');
  });

  it('exports getShareMessage', () => {
    expect(content).toContain('export function getShareMessage');
  });

  it('exports parseContentUrl', () => {
    expect(content).toContain('export function parseContentUrl');
  });

  it('exports getQRCodeUrl', () => {
    expect(content).toContain('export function getQRCodeUrl');
  });

  it('exports getOGMetadata for link previews', () => {
    expect(content).toContain('export function getOGMetadata');
  });

  it('defines ContentType with all content types', () => {
    expect(content).toContain("'video'");
    expect(content).toContain("'post'");
    expect(content).toContain("'profile'");
    expect(content).toContain("'lesson'");
    expect(content).toContain("'series_episode'");
    expect(content).toContain("'playlist'");
    expect(content).toContain("'agent'");
    expect(content).toContain("'song'");
    expect(content).toContain("'slang_card'");
    expect(content).toContain("'achievement'");
  });

  it('uses connectworldai.com as web domain', () => {
    expect(content).toContain('https://connectworldai.com');
  });

  it('generates URLs with correct path prefixes', () => {
    expect(content).toContain('/v/');  // video
    expect(content).toContain('/p/');  // post
    expect(content).toContain('/u/');  // profile
    expect(content).toContain('/l/');  // lesson
    expect(content).toContain('/s/');  // series
    expect(content).toContain('/pl/'); // playlist
  });

  it('includes OG meta tags for social sharing previews', () => {
    expect(content).toContain('og:title');
    expect(content).toContain('og:description');
    expect(content).toContain('og:image');
    expect(content).toContain('twitter:card');
  });
});

describe('Content Share Sheet Component', () => {
  const filePath = path.join(appDir, 'components/content-share-sheet.tsx');
  const content = fs.readFileSync(filePath, 'utf-8');

  it('exists and exports ContentShareSheet', () => {
    expect(fs.existsSync(filePath)).toBe(true);
    expect(content).toContain('export function ContentShareSheet');
  });

  it('includes Save quick action', () => {
    expect(content).toContain("'Save'");
    expect(content).toContain('bookmark');
  });

  it('includes Remix quick action', () => {
    expect(content).toContain("'Remix'");
  });

  it('includes Sequence/Playlist quick action', () => {
    expect(content).toContain("'Sequence'");
  });

  it('includes Copy Link action', () => {
    expect(content).toContain("'Copy Link'");
  });

  it('includes Share action with native share sheet', () => {
    expect(content).toContain("'Share'");
    expect(content).toContain('expo-sharing');
  });

  it('includes QR Code action', () => {
    expect(content).toContain("'QR Code'");
  });

  it('includes Embed action', () => {
    expect(content).toContain("'Embed'");
  });

  it('includes Repost to Feed action', () => {
    expect(content).toContain("'Repost to Feed'");
  });

  it('includes About creator action', () => {
    expect(content).toContain('About');
    expect(content).toContain('this account');
  });

  it('includes Translate action for video content', () => {
    expect(content).toContain("'Translate to Another Language'");
  });

  it('includes Not Interested action', () => {
    expect(content).toContain("'Not Interested'");
  });

  it('includes Report action (destructive)', () => {
    expect(content).toContain("'Report'");
    expect(content).toContain('destructive: true');
  });

  it('uses Modal with slide animation', () => {
    expect(content).toContain('Modal');
    expect(content).toContain('animationType="slide"');
  });

  it('has drag handle for bottom sheet UX', () => {
    expect(content).toContain('handle');
  });

  it('uses expo-clipboard for copy link', () => {
    expect(content).toContain('expo-clipboard');
    expect(content).toContain('Clipboard.setStringAsync');
  });

  it('uses expo-haptics for feedback', () => {
    expect(content).toContain('expo-haptics');
    expect(content).toContain('Haptics.impactAsync');
  });

  it('supports web share API fallback', () => {
    expect(content).toContain('navigator.share');
  });
});

describe('useContentShare Hook', () => {
  const filePath = path.join(appDir, 'hooks/use-content-share.tsx');
  const content = fs.readFileSync(filePath, 'utf-8');

  it('exists and exports useContentShare', () => {
    expect(fs.existsSync(filePath)).toBe(true);
    expect(content).toContain('export function useContentShare');
  });

  it('exports getSavedContent utility', () => {
    expect(content).toContain('export async function getSavedContent');
  });

  it('exports isContentSaved utility', () => {
    expect(content).toContain('export async function isContentSaved');
  });

  it('exports getPinnedContent utility', () => {
    expect(content).toContain('export async function getPinnedContent');
  });

  it('persists saved content to AsyncStorage', () => {
    expect(content).toContain('AsyncStorage');
    expect(content).toContain('@connectworld_saved_content');
  });

  it('supports pinning content to profile', () => {
    expect(content).toContain('@connectworld_pinned_content');
  });

  it('returns openShareSheet and ShareSheet', () => {
    expect(content).toContain('openShareSheet');
    expect(content).toContain('ShareSheet');
  });
});

describe('Content Feed System', () => {
  const filePath = path.join(appDir, 'lib/content-feed.ts');
  const content = fs.readFileSync(filePath, 'utf-8');

  it('exists and exports generateContentId', () => {
    expect(fs.existsSync(filePath)).toBe(true);
    expect(content).toContain('export function generateContentId');
  });

  it('defines AI_SHORT_FILM_SERIES with 6 series', () => {
    expect(content).toContain('export const AI_SHORT_FILM_SERIES');
    expect(content).toContain("id: 'granny-abroad'");
    expect(content).toContain("id: 'the-colmado'");
    expect(content).toContain("id: 'lost-in-translation'");
    expect(content).toContain("id: 'kitchen-secrets'");
    expect(content).toContain("id: 'night-out'");
    expect(content).toContain("id: 'the-interview'");
  });

  it('defines DAILY_CONTENT_SCHEDULE with timed drops', () => {
    expect(content).toContain('export const DAILY_CONTENT_SCHEDULE');
    expect(content).toContain("time: '07:00'");
    expect(content).toContain("time: '12:00'");
    expect(content).toContain("time: '19:00'");
    expect(content).toContain("time: '22:00'");
  });

  it('includes surprise call in daily schedule', () => {
    expect(content).toContain('surprise_call');
  });

  it('includes music lesson in daily schedule', () => {
    expect(content).toContain('music_lesson');
  });

  it('exports getNextScheduledDrop', () => {
    expect(content).toContain('export function getNextScheduledDrop');
  });

  it('exports getMinutesUntilNextDrop', () => {
    expect(content).toContain('export function getMinutesUntilNextDrop');
  });

  it('defines VideoCategory types', () => {
    expect(content).toContain("'ai_short_film'");
    expect(content).toContain("'lesson_clip'");
    expect(content).toContain("'cultural_immersion'");
    expect(content).toContain("'music_video'");
    expect(content).toContain("'travel_guide'");
  });

  it('defines SeriesDefinition with all required fields', () => {
    expect(content).toContain('releaseSchedule');
    expect(content).toContain('releaseTime');
    expect(content).toContain('totalEpisodes');
    expect(content).toContain('vocabPerEpisode');
    expect(content).toContain('culturalRegion');
  });
});

describe('AI Short Films Production System', () => {
  const filePath = path.join(appDir, 'lib/ai-short-films.ts');
  const content = fs.readFileSync(filePath, 'utf-8');

  it('exists and exports PRODUCTION_STANDARDS', () => {
    expect(fs.existsSync(filePath)).toBe(true);
    expect(content).toContain('export const PRODUCTION_STANDARDS');
  });

  it('defines 9:16 vertical format for mobile', () => {
    expect(content).toContain("'9:16'");
    expect(content).toContain("'1080x1920'");
  });

  it('requires cliffhanger endings', () => {
    expect(content).toContain('cliffhangerRequired: true');
  });

  it('hooks viewer within 3 seconds', () => {
    expect(content).toContain('hookWithin: 3');
  });

  it('exports generateScriptPrompt', () => {
    expect(content).toContain('export function generateScriptPrompt');
  });

  it('script prompt includes key requirements', () => {
    expect(content).toContain('CLIFFHANGER');
    expect(content).toContain('60-90 seconds');
    expect(content).toContain('Hook the viewer within 3 seconds');
    expect(content).toContain('NATURAL');
  });

  it('exports calculateReleaseSchedule', () => {
    expect(content).toContain('export function calculateReleaseSchedule');
  });

  it('exports getEpisodeDropNotification', () => {
    expect(content).toContain('export function getEpisodeDropNotification');
  });

  it('exports prioritizeProduction', () => {
    expect(content).toContain('export function prioritizeProduction');
  });

  it('exports getSeriesForLanguage', () => {
    expect(content).toContain('export function getSeriesForLanguage');
  });

  it('defines EpisodeScript interface', () => {
    expect(content).toContain('export interface EpisodeScript');
    expect(content).toContain('targetVocabulary');
    expect(content).toContain('cliffhanger');
  });

  it('defines ProductionStatus tracking', () => {
    expect(content).toContain("'scripted'");
    expect(content).toContain("'visual_generation'");
    expect(content).toContain("'voice_generation'");
    expect(content).toContain("'lip_sync_translation'");
    expect(content).toContain("'post_production'");
    expect(content).toContain("'scheduled'");
    expect(content).toContain("'released'");
  });
});

describe('Lip-Sync Pipeline', () => {
  const filePath = path.join(appDir, 'lib/lip-sync-pipeline.ts');
  const content = fs.readFileSync(filePath, 'utf-8');

  it('exists and exports LIP_SYNC_LANGUAGES', () => {
    expect(fs.existsSync(filePath)).toBe(true);
    expect(content).toContain('export const LIP_SYNC_LANGUAGES');
  });

  it('supports 20 languages', () => {
    // Count language entries
    const matches = content.match(/code: '/g);
    expect(matches?.length).toBe(20);
  });

  it('includes Dominican Spanish', () => {
    expect(content).toContain("code: 'es-DO'");
    expect(content).toContain('Dominican Spanish');
  });

  it('includes Haitian Creole', () => {
    expect(content).toContain("code: 'fr-HT'");
    expect(content).toContain('Haitian Creole');
  });

  it('includes African languages', () => {
    expect(content).toContain("code: 'sw'");
    expect(content).toContain("code: 'yo'");
  });

  it('defines all 3 provider configs', () => {
    expect(content).toContain("heygen:");
    expect(content).toContain("rask_ai:");
    expect(content).toContain("sync_labs:");
  });

  it('HeyGen costs $0.50/min', () => {
    expect(content).toContain('costPerMinute: 0.50');
  });

  it('Rask AI costs $0.10/min (cheapest)', () => {
    expect(content).toContain('costPerMinute: 0.10');
  });

  it('exports estimateTranslationCost', () => {
    expect(content).toContain('export function estimateTranslationCost');
  });

  it('exports compareProviderCosts', () => {
    expect(content).toContain('export function compareProviderCosts');
  });

  it('exports calculateMonthlyProductionCost', () => {
    expect(content).toContain('export function calculateMonthlyProductionCost');
  });

  it('exports getVideoForUserLanguage', () => {
    expect(content).toContain('export function getVideoForUserLanguage');
  });

  it('exports createBatchRequest', () => {
    expect(content).toContain('export function createBatchRequest');
  });

  it('includes production cost analysis', () => {
    expect(content).toContain('export const PRODUCTION_COST_ANALYSIS');
    expect(content).toContain('recommendation');
  });

  it('supports batch processing', () => {
    expect(content).toContain('export interface BatchTranslationRequest');
    expect(content).toContain('targetLanguages');
    expect(content).toContain('preserveBackgroundAudio');
    expect(content).toContain('generateSubtitles');
  });

  it('tracks job status through pipeline stages', () => {
    expect(content).toContain("'queued'");
    expect(content).toContain("'transcribing'");
    expect(content).toContain("'translating'");
    expect(content).toContain("'voice_generating'");
    expect(content).toContain("'lip_syncing'");
    expect(content).toContain("'complete'");
  });
});
