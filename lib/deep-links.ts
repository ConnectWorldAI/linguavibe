/**
 * Deep Link & Content URL System
 *
 * Generates unique URLs for all content types in ConnectWorld AI.
 * Every video, post, user profile, lesson, and AI short film gets a
 * shareable deep link that opens in-app or falls back to web.
 *
 * URL Structure:
 * - Videos: connectworldai.com/v/{id}
 * - Posts: connectworldai.com/p/{id}
 * - Profiles: connectworldai.com/u/{username}
 * - Lessons: connectworldai.com/l/{id}
 * - Series: connectworldai.com/s/{seriesId}/{episodeNum}
 * - Playlists: connectworldai.com/pl/{id}
 * - Agents: connectworldai.com/agent/{agentId}
 */

import * as Linking from 'expo-linking';

// Base domain for web URLs (production)
const WEB_DOMAIN = 'https://connectworldai.com';

// Content types that can be shared
export type ContentType =
  | 'video'
  | 'post'
  | 'profile'
  | 'lesson'
  | 'series_episode'
  | 'playlist'
  | 'agent'
  | 'song'
  | 'slang_card'
  | 'achievement'
  | 'class'
  | 'story';

export interface ContentItem {
  id: string;
  type: ContentType;
  title: string;
  description?: string;
  thumbnailUrl?: string;
  authorName?: string;
  authorUsername?: string;
  language?: string;
  duration?: number; // seconds (for video/audio)
  seriesId?: string;
  episodeNumber?: number;
}

/**
 * Generate a web URL for any content item
 */
export function getContentWebUrl(item: ContentItem): string {
  switch (item.type) {
    case 'video':
      return `${WEB_DOMAIN}/v/${item.id}`;
    case 'post':
      return `${WEB_DOMAIN}/p/${item.id}`;
    case 'profile':
      return `${WEB_DOMAIN}/u/${item.authorUsername || item.id}`;
    case 'lesson':
      return `${WEB_DOMAIN}/l/${item.id}`;
    case 'series_episode':
      return `${WEB_DOMAIN}/s/${item.seriesId}/${item.episodeNumber || 1}`;
    case 'playlist':
      return `${WEB_DOMAIN}/pl/${item.id}`;
    case 'agent':
      return `${WEB_DOMAIN}/agent/${item.id}`;
    case 'song':
      return `${WEB_DOMAIN}/song/${item.id}`;
    case 'slang_card':
      return `${WEB_DOMAIN}/slang/${item.id}`;
    case 'achievement':
      return `${WEB_DOMAIN}/badge/${item.id}`;
    case 'class':
      return `${WEB_DOMAIN}/class/${item.id}`;
    case 'story':
      return `${WEB_DOMAIN}/story/${item.id}`;
    default:
      return `${WEB_DOMAIN}/c/${item.id}`;
  }
}

/**
 * Generate a deep link URL (opens directly in app)
 */
export function getContentDeepLink(item: ContentItem): string {
  const scheme = Linking.createURL('');
  const basePath = scheme.replace(/\/$/, '');

  switch (item.type) {
    case 'video':
      return `${basePath}/video/${item.id}`;
    case 'post':
      return `${basePath}/post/${item.id}`;
    case 'profile':
      return `${basePath}/profile/${item.authorUsername || item.id}`;
    case 'lesson':
      return `${basePath}/lesson/${item.id}`;
    case 'series_episode':
      return `${basePath}/series/${item.seriesId}/${item.episodeNumber || 1}`;
    case 'playlist':
      return `${basePath}/playlist/${item.id}`;
    case 'agent':
      return `${basePath}/agent/${item.id}`;
    case 'song':
      return `${basePath}/song/${item.id}`;
    case 'slang_card':
      return `${basePath}/slang/${item.id}`;
    case 'achievement':
      return `${basePath}/badge/${item.id}`;
    case 'class':
      return `${basePath}/class/${item.id}`;
    case 'story':
      return `${basePath}/story/${item.id}`;
    default:
      return `${basePath}/content/${item.id}`;
  }
}

/**
 * Generate an embed code (HTML iframe) for content
 */
export function getEmbedCode(item: ContentItem): string {
  const webUrl = getContentWebUrl(item);
  const width = item.type === 'video' || item.type === 'series_episode' ? 560 : 400;
  const height = item.type === 'video' || item.type === 'series_episode' ? 315 : 480;

  return `<iframe src="${webUrl}/embed" width="${width}" height="${height}" frameborder="0" allowfullscreen></iframe>`;
}

/**
 * Generate QR code data URL for a content item
 * Returns the URL string that should be encoded into a QR code
 */
export function getQRCodeUrl(item: ContentItem): string {
  return getContentWebUrl(item);
}

/**
 * Generate Open Graph meta data for a content item (used for link previews)
 */
export function getOGMetadata(item: ContentItem) {
  return {
    'og:title': item.title,
    'og:description': item.description || `Check this out on ConnectWorld AI`,
    'og:image': item.thumbnailUrl || `${WEB_DOMAIN}/og-default.png`,
    'og:url': getContentWebUrl(item),
    'og:type': item.type === 'video' || item.type === 'series_episode' ? 'video.other' : 'article',
    'og:site_name': 'ConnectWorld AI',
    'twitter:card': item.type === 'video' ? 'player' : 'summary_large_image',
    'twitter:title': item.title,
    'twitter:description': item.description || `Check this out on ConnectWorld AI`,
    'twitter:image': item.thumbnailUrl || `${WEB_DOMAIN}/og-default.png`,
  };
}

/**
 * Parse a deep link URL back into content type and ID
 */
export function parseContentUrl(url: string): { type: ContentType; id: string } | null {
  try {
    const parsed = new URL(url);
    const path = parsed.pathname;

    const patterns: { regex: RegExp; type: ContentType }[] = [
      { regex: /^\/v\/(.+)$/, type: 'video' },
      { regex: /^\/p\/(.+)$/, type: 'post' },
      { regex: /^\/u\/(.+)$/, type: 'profile' },
      { regex: /^\/l\/(.+)$/, type: 'lesson' },
      { regex: /^\/s\/(.+)\/(\d+)$/, type: 'series_episode' },
      { regex: /^\/pl\/(.+)$/, type: 'playlist' },
      { regex: /^\/agent\/(.+)$/, type: 'agent' },
      { regex: /^\/song\/(.+)$/, type: 'song' },
      { regex: /^\/slang\/(.+)$/, type: 'slang_card' },
      { regex: /^\/badge\/(.+)$/, type: 'achievement' },
      { regex: /^\/class\/(.+)$/, type: 'class' },
      { regex: /^\/story\/(.+)$/, type: 'story' },
    ];

    for (const { regex, type } of patterns) {
      const match = path.match(regex);
      if (match) {
        return { type, id: match[1] };
      }
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Generate a share message with URL for native sharing
 */
export function getShareMessage(item: ContentItem): string {
  const url = getContentWebUrl(item);
  const prefix = item.type === 'video'
    ? '🎬'
    : item.type === 'song'
    ? '🎵'
    : item.type === 'lesson'
    ? '📚'
    : item.type === 'agent'
    ? '🤖'
    : '✨';

  return `${prefix} ${item.title}\n\n${url}\n\nShared via ConnectWorld AI`;
}
