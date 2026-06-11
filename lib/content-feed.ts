/**
 * Content Feed System — Data models and utilities for the ConnectWorld AI content feed
 *
 * Every piece of content in the app (videos, posts, lessons, songs, AI short films)
 * is a FeedItem with a unique ID, shareable URL, and metadata for rendering.
 *
 * This powers:
 * - ConnectWorld AI TV (video feed)
 * - User posts/stories
 * - AI Short Film series
 * - Shared lessons and songs
 * - User profile grids
 */

import { ContentItem, ContentType } from './deep-links';

// Unique ID generator for content
export function generateContentId(type: ContentType): string {
  const prefix = type.slice(0, 3).toUpperCase();
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).slice(2, 8);
  return `${prefix}_${timestamp}_${random}`;
}

// Video content (AI short films, user uploads, translated content)
export interface VideoFeedItem extends ContentItem {
  type: 'video' | 'series_episode';
  videoUrl: string;
  thumbnailUrl: string;
  duration: number; // seconds
  views: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  language: string;
  availableLanguages: string[]; // Languages this video is dubbed into
  seriesId?: string;
  seriesTitle?: string;
  episodeNumber?: number;
  totalEpisodes?: number;
  scheduledDropTime?: string; // ISO date for scheduled content
  isLipSynced?: boolean; // Whether this is a lip-synced translation
  originalLanguage?: string;
  tags: string[];
  category: VideoCategory;
}

export type VideoCategory =
  | 'ai_short_film'
  | 'lesson_clip'
  | 'cultural_immersion'
  | 'music_video'
  | 'travel_guide'
  | 'slang_explainer'
  | 'comedy_skit'
  | 'user_generated'
  | 'pronunciation_drill'
  | 'dream_vacation';

// Post content (text + media, like Instagram posts)
export interface PostFeedItem extends ContentItem {
  type: 'post';
  text: string;
  mediaUrls: string[];
  mediaType: 'image' | 'video' | 'carousel';
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  language: string;
  hashtags: string[];
  isPinned?: boolean;
}

// AI Short Film Series
export interface SeriesDefinition {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  genre: SeriesGenre;
  targetLanguages: string[];
  totalEpisodes: number;
  releasedEpisodes: number;
  releaseSchedule: 'daily' | 'weekdays' | 'weekly';
  releaseTime: string; // "08:00" format
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'mixed';
  vocabPerEpisode: number; // Average new words per episode
  culturalRegion: string;
  characters: SeriesCharacter[];
  seasons: number;
  currentSeason: number;
}

export type SeriesGenre =
  | 'comedy'
  | 'drama'
  | 'adventure'
  | 'romance'
  | 'thriller'
  | 'cooking'
  | 'travel'
  | 'music'
  | 'documentary'
  | 'sitcom'
  | 'action';

export interface SeriesCharacter {
  name: string;
  role: string;
  language: string;
  accent: string;
  avatarUrl: string;
}

// Scheduled content drop
export interface ScheduledDrop {
  id: string;
  contentId: string;
  contentType: ContentType;
  scheduledTime: string; // ISO date
  notificationTitle: string;
  notificationBody: string;
  isReleased: boolean;
  seriesId?: string;
  episodeNumber?: number;
}

// Content engagement metrics
export interface ContentMetrics {
  contentId: string;
  views: number;
  uniqueViews: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  avgWatchTime: number; // seconds
  completionRate: number; // 0-1
  replayRate: number; // 0-1
  shareToViewRatio: number;
}

// User's content library (saved/bookmarked items)
export interface UserContentLibrary {
  saved: ContentItem[];
  playlists: ContentPlaylist[];
  watchHistory: WatchHistoryItem[];
  pinnedToProfile: ContentItem[];
}

export interface ContentPlaylist {
  id: string;
  title: string;
  description: string;
  items: ContentItem[];
  isPublic: boolean;
  coverUrl?: string;
  createdAt: string;
}

export interface WatchHistoryItem {
  content: ContentItem;
  watchedAt: string;
  progress: number; // 0-1 completion
  completed: boolean;
}

/**
 * ConnectWorld AI TV — Series catalog
 * These are the AI short film series that drop on schedule
 */
export const AI_SHORT_FILM_SERIES: SeriesDefinition[] = [
  {
    id: 'granny-abroad',
    title: 'Granny Abroad',
    description: 'A fearless grandmother travels to different countries, getting into hilarious situations while teaching you real street language.',
    thumbnailUrl: '',
    genre: 'comedy',
    targetLanguages: ['es-DO', 'es-CO', 'fr', 'ja', 'pt-BR', 'ko', 'it'],
    totalEpisodes: 52, // 1 year of weekly content
    releasedEpisodes: 0,
    releaseSchedule: 'daily',
    releaseTime: '07:00',
    difficulty: 'mixed',
    vocabPerEpisode: 8,
    culturalRegion: 'multi',
    characters: [
      { name: 'Abuela Rosa', role: 'protagonist', language: 'es', accent: 'Dominican', avatarUrl: '' },
      { name: 'Local Guide', role: 'recurring', language: 'varies', accent: 'varies', avatarUrl: '' },
    ],
    seasons: 4,
    currentSeason: 1,
  },
  {
    id: 'the-colmado',
    title: 'The Colmado',
    description: 'Daily life at a Dominican corner store. Drama, comedy, and real Dominican Spanish — the way people actually talk.',
    thumbnailUrl: '',
    genre: 'sitcom',
    targetLanguages: ['es-DO', 'en', 'fr-HT', 'pt-BR'],
    totalEpisodes: 100,
    releasedEpisodes: 0,
    releaseSchedule: 'weekdays',
    releaseTime: '12:00',
    difficulty: 'intermediate',
    vocabPerEpisode: 12,
    culturalRegion: 'Dominican Republic',
    characters: [
      { name: 'Don Julio', role: 'store owner', language: 'es-DO', accent: 'Cibaeño', avatarUrl: '' },
      { name: 'Yari', role: 'cashier/student', language: 'es-DO', accent: 'Santo Domingo', avatarUrl: '' },
      { name: 'El Americano', role: 'expat regular', language: 'en/es', accent: 'Gringo learning', avatarUrl: '' },
    ],
    seasons: 4,
    currentSeason: 1,
  },
  {
    id: 'lost-in-translation',
    title: 'Lost in Translation',
    description: 'An American student moves abroad and has to figure everything out in a language they barely speak. Cringe, comedy, growth.',
    thumbnailUrl: '',
    genre: 'drama',
    targetLanguages: ['es-CO', 'fr', 'ja', 'ko', 'it', 'de', 'pt-BR'],
    totalEpisodes: 30,
    releasedEpisodes: 0,
    releaseSchedule: 'daily',
    releaseTime: '19:00',
    difficulty: 'beginner',
    vocabPerEpisode: 6,
    culturalRegion: 'multi',
    characters: [
      { name: 'Jordan', role: 'protagonist', language: 'en', accent: 'American', avatarUrl: '' },
      { name: 'Roommate', role: 'local friend', language: 'varies', accent: 'varies', avatarUrl: '' },
    ],
    seasons: 6,
    currentSeason: 1,
  },
  {
    id: 'kitchen-secrets',
    title: 'Kitchen Secrets',
    description: 'A chef reveals family recipes from around the world while teaching you cooking vocabulary and cultural food traditions.',
    thumbnailUrl: '',
    genre: 'cooking',
    targetLanguages: ['es-MX', 'it', 'fr', 'ja', 'ko', 'zh', 'pt-BR'],
    totalEpisodes: 40,
    releasedEpisodes: 0,
    releaseSchedule: 'daily',
    releaseTime: '17:00',
    difficulty: 'intermediate',
    vocabPerEpisode: 10,
    culturalRegion: 'multi',
    characters: [
      { name: 'Chef Marta', role: 'host', language: 'es', accent: 'Mexican', avatarUrl: '' },
      { name: 'Guest Chef', role: 'rotating', language: 'varies', accent: 'varies', avatarUrl: '' },
    ],
    seasons: 4,
    currentSeason: 1,
  },
  {
    id: 'night-out',
    title: 'Night Out',
    description: 'Friends going out in different cities worldwide. Bars, clubs, parties — all the slang you need for nightlife.',
    thumbnailUrl: '',
    genre: 'comedy',
    targetLanguages: ['es-DO', 'es-CO', 'fr', 'pt-BR', 'ko', 'ja'],
    totalEpisodes: 24,
    releasedEpisodes: 0,
    releaseSchedule: 'weekly',
    releaseTime: '21:00',
    difficulty: 'advanced',
    vocabPerEpisode: 15,
    culturalRegion: 'multi',
    characters: [
      { name: 'The Crew', role: 'ensemble', language: 'varies', accent: 'varies', avatarUrl: '' },
    ],
    seasons: 2,
    currentSeason: 1,
  },
  {
    id: 'the-interview',
    title: 'The Interview',
    description: 'Job interviews in a foreign language. High stakes, professional vocabulary, cultural workplace norms. Will they get the job?',
    thumbnailUrl: '',
    genre: 'thriller',
    targetLanguages: ['es', 'fr', 'de', 'ja', 'ko', 'zh', 'pt-BR'],
    totalEpisodes: 20,
    releasedEpisodes: 0,
    releaseSchedule: 'weekdays',
    releaseTime: '08:00',
    difficulty: 'advanced',
    vocabPerEpisode: 12,
    culturalRegion: 'multi',
    characters: [
      { name: 'Candidate', role: 'protagonist', language: 'en', accent: 'American', avatarUrl: '' },
      { name: 'Interviewer', role: 'antagonist', language: 'varies', accent: 'varies', avatarUrl: '' },
    ],
    seasons: 2,
    currentSeason: 1,
  },
];

/**
 * Daily engagement schedule — what content drops and when
 */
export const DAILY_CONTENT_SCHEDULE = [
  { time: '07:00', type: 'ai_short_film', series: 'granny-abroad', label: 'Morning Episode' },
  { time: '07:05', type: 'slang_of_the_day', series: null, label: 'Slang of the Day' },
  { time: '08:00', type: 'ai_short_film', series: 'the-interview', label: 'Professional Series' },
  { time: '12:00', type: 'ai_short_film', series: 'the-colmado', label: 'Lunch Break Episode' },
  { time: '13:00', type: 'surprise_call', series: null, label: 'Surprise Agent Call' },
  { time: '15:00', type: 'music_lesson', series: null, label: 'Music Feature' },
  { time: '17:00', type: 'ai_short_film', series: 'kitchen-secrets', label: 'Cooking Episode' },
  { time: '19:00', type: 'ai_short_film', series: 'lost-in-translation', label: 'Evening Series' },
  { time: '21:00', type: 'cultural_content', series: null, label: 'Cultural Deep Dive' },
  { time: '22:00', type: 'daily_recap', series: null, label: 'Daily Recap & Tomorrow Preview' },
];

/**
 * Get the next scheduled content drop
 */
export function getNextScheduledDrop(): typeof DAILY_CONTENT_SCHEDULE[0] | null {
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  for (const drop of DAILY_CONTENT_SCHEDULE) {
    const [hours, minutes] = drop.time.split(':').map(Number);
    const dropMinutes = hours * 60 + minutes;
    if (dropMinutes > currentMinutes) {
      return drop;
    }
  }

  // All drops passed for today, return tomorrow's first
  return DAILY_CONTENT_SCHEDULE[0];
}

/**
 * Get time until next content drop (in minutes)
 */
export function getMinutesUntilNextDrop(): number {
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const next = getNextScheduledDrop();

  if (!next) return 0;

  const [hours, minutes] = next.time.split(':').map(Number);
  const dropMinutes = hours * 60 + minutes;

  if (dropMinutes > currentMinutes) {
    return dropMinutes - currentMinutes;
  }

  // Tomorrow
  return (24 * 60 - currentMinutes) + dropMinutes;
}
