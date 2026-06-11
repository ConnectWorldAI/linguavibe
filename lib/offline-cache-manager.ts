/**
 * Offline Cache Manager
 *
 * Manages downloading, caching, and serving lesson content for offline use.
 * Uses AsyncStorage for metadata and content storage.
 * Provides network-aware content serving — serves cached content when offline.
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

// ─── Storage Keys ────────────────────────────────────────────────────────────
const CACHE_INDEX_KEY = "@offline_cache_index";
const CACHE_CONTENT_PREFIX = "@offline_content_";
const CACHE_SETTINGS_KEY = "@offline_settings";

// ─── Types ───────────────────────────────────────────────────────────────────
export type ContentType = "lesson" | "flashcards" | "phrasebook" | "audio" | "vocabulary" | "grammar";

export interface CachedItem {
  id: string;
  title: string;
  type: ContentType;
  language: string;
  level: string; // CEFR level: A1-C2
  sizeBytes: number;
  downloadedAt: string; // ISO date
  lastAccessedAt: string; // ISO date
  version: number;
  expiresAt?: string; // ISO date, optional TTL
  tags: string[];
}

export interface CacheIndex {
  items: CachedItem[];
  totalSizeBytes: number;
  maxSizeBytes: number; // Default 500MB
  lastSyncAt: string;
}

export interface CacheSettings {
  autoDownload: boolean; // Auto-download recommended content on WiFi
  maxCacheSizeMB: number;
  downloadOnCellular: boolean;
  autoCleanupDays: number; // Remove items not accessed in N days
}

export interface LessonContent {
  id: string;
  title: string;
  type: ContentType;
  language: string;
  level: string;
  sections: LessonSection[];
  vocabulary?: VocabEntry[];
  exercises?: Exercise[];
  metadata: Record<string, string>;
}

export interface LessonSection {
  id: string;
  title: string;
  content: string; // Markdown or plain text
  audioUrl?: string;
  imageUrl?: string;
  duration?: number; // seconds
}

export interface VocabEntry {
  word: string;
  translation: string;
  pronunciation?: string;
  example?: string;
  audioUrl?: string;
}

export interface Exercise {
  id: string;
  type: "multiple_choice" | "fill_blank" | "translation" | "listening" | "speaking";
  prompt: string;
  options?: string[];
  correctAnswer: string;
  explanation?: string;
}

export interface DownloadProgress {
  itemId: string;
  progress: number; // 0-100
  status: "queued" | "downloading" | "complete" | "error";
  error?: string;
}

// ─── Default Settings ────────────────────────────────────────────────────────
const DEFAULT_SETTINGS: CacheSettings = {
  autoDownload: false,
  maxCacheSizeMB: 500,
  downloadOnCellular: false,
  autoCleanupDays: 30,
};

const DEFAULT_INDEX: CacheIndex = {
  items: [],
  totalSizeBytes: 0,
  maxSizeBytes: 500 * 1024 * 1024,
  lastSyncAt: new Date().toISOString(),
};

// ─── Cache Index Management ──────────────────────────────────────────────────
export async function getCacheIndex(): Promise<CacheIndex> {
  try {
    const stored = await AsyncStorage.getItem(CACHE_INDEX_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  return { ...DEFAULT_INDEX };
}

async function saveCacheIndex(index: CacheIndex): Promise<void> {
  await AsyncStorage.setItem(CACHE_INDEX_KEY, JSON.stringify(index));
}

// ─── Settings ────────────────────────────────────────────────────────────────
export async function getCacheSettings(): Promise<CacheSettings> {
  try {
    const stored = await AsyncStorage.getItem(CACHE_SETTINGS_KEY);
    if (stored) return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
  } catch {}
  return { ...DEFAULT_SETTINGS };
}

export async function updateCacheSettings(updates: Partial<CacheSettings>): Promise<CacheSettings> {
  const current = await getCacheSettings();
  const updated = { ...current, ...updates };
  await AsyncStorage.setItem(CACHE_SETTINGS_KEY, JSON.stringify(updated));
  return updated;
}

// ─── Download & Cache Content ────────────────────────────────────────────────
export async function cacheContent(
  content: LessonContent,
  onProgress?: (progress: DownloadProgress) => void
): Promise<CachedItem> {
  const contentKey = `${CACHE_CONTENT_PREFIX}${content.id}`;
  const serialized = JSON.stringify(content);
  const sizeBytes = new Blob([serialized]).size || serialized.length;

  // Report progress
  onProgress?.({ itemId: content.id, progress: 10, status: "downloading" });

  // Check cache size limit
  const index = await getCacheIndex();
  const settings = await getCacheSettings();
  const maxBytes = settings.maxCacheSizeMB * 1024 * 1024;

  if (index.totalSizeBytes + sizeBytes > maxBytes) {
    // Auto-cleanup oldest items to make space
    await autoCleanup(sizeBytes);
  }

  onProgress?.({ itemId: content.id, progress: 50, status: "downloading" });

  // Store content
  await AsyncStorage.setItem(contentKey, serialized);

  onProgress?.({ itemId: content.id, progress: 80, status: "downloading" });

  // Update index
  const now = new Date().toISOString();
  const cachedItem: CachedItem = {
    id: content.id,
    title: content.title,
    type: content.type,
    language: content.language,
    level: content.level,
    sizeBytes,
    downloadedAt: now,
    lastAccessedAt: now,
    version: 1,
    tags: [content.type, content.language, content.level],
  };

  // Remove existing entry if re-downloading
  const updatedIndex = await getCacheIndex();
  updatedIndex.items = updatedIndex.items.filter((i) => i.id !== content.id);
  updatedIndex.items.push(cachedItem);
  updatedIndex.totalSizeBytes = updatedIndex.items.reduce((acc, i) => acc + i.sizeBytes, 0);
  updatedIndex.lastSyncAt = now;
  await saveCacheIndex(updatedIndex);

  onProgress?.({ itemId: content.id, progress: 100, status: "complete" });

  return cachedItem;
}

// ─── Retrieve Cached Content ─────────────────────────────────────────────────
export async function getCachedContent(id: string): Promise<LessonContent | null> {
  try {
    const contentKey = `${CACHE_CONTENT_PREFIX}${id}`;
    const stored = await AsyncStorage.getItem(contentKey);
    if (!stored) return null;

    // Update last accessed time
    const index = await getCacheIndex();
    const item = index.items.find((i) => i.id === id);
    if (item) {
      item.lastAccessedAt = new Date().toISOString();
      await saveCacheIndex(index);
    }

    return JSON.parse(stored);
  } catch {
    return null;
  }
}

// ─── Check if Content is Cached ──────────────────────────────────────────────
export async function isContentCached(id: string): Promise<boolean> {
  const index = await getCacheIndex();
  return index.items.some((i) => i.id === id);
}

// ─── Remove Cached Content ───────────────────────────────────────────────────
export async function removeCachedContent(id: string): Promise<boolean> {
  try {
    const contentKey = `${CACHE_CONTENT_PREFIX}${id}`;
    await AsyncStorage.removeItem(contentKey);

    const index = await getCacheIndex();
    index.items = index.items.filter((i) => i.id !== id);
    index.totalSizeBytes = index.items.reduce((acc, i) => acc + i.sizeBytes, 0);
    await saveCacheIndex(index);

    return true;
  } catch {
    return false;
  }
}

// ─── Clear All Cache ─────────────────────────────────────────────────────────
export async function clearAllCache(): Promise<void> {
  const index = await getCacheIndex();
  for (const item of index.items) {
    await AsyncStorage.removeItem(`${CACHE_CONTENT_PREFIX}${item.id}`);
  }
  await saveCacheIndex({ ...DEFAULT_INDEX });
}

// ─── Auto Cleanup ────────────────────────────────────────────────────────────
export async function autoCleanup(neededBytes: number = 0): Promise<number> {
  const index = await getCacheIndex();
  const settings = await getCacheSettings();
  const maxBytes = settings.maxCacheSizeMB * 1024 * 1024;
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - settings.autoCleanupDays);
  const cutoffISO = cutoffDate.toISOString();

  let freedBytes = 0;

  // Sort by last accessed (oldest first)
  const sorted = [...index.items].sort(
    (a, b) => new Date(a.lastAccessedAt).getTime() - new Date(b.lastAccessedAt).getTime()
  );

  for (const item of sorted) {
    // Remove expired items or items not accessed within cleanup window
    const isExpired = item.expiresAt && new Date(item.expiresAt) < new Date();
    const isStale = item.lastAccessedAt < cutoffISO;
    const needsSpace = index.totalSizeBytes - freedBytes + neededBytes > maxBytes;

    if (isExpired || isStale || needsSpace) {
      await AsyncStorage.removeItem(`${CACHE_CONTENT_PREFIX}${item.id}`);
      freedBytes += item.sizeBytes;
      index.items = index.items.filter((i) => i.id !== item.id);
    }

    if (!needsSpace && !isExpired && !isStale) break;
  }

  index.totalSizeBytes = index.items.reduce((acc, i) => acc + i.sizeBytes, 0);
  await saveCacheIndex(index);

  return freedBytes;
}

// ─── Get Cache Stats ─────────────────────────────────────────────────────────
export async function getCacheStats(): Promise<{
  totalItems: number;
  totalSizeMB: number;
  maxSizeMB: number;
  usagePercent: number;
  byType: Record<ContentType, number>;
  byLanguage: Record<string, number>;
  oldestItem: string | null;
  newestItem: string | null;
}> {
  const index = await getCacheIndex();
  const settings = await getCacheSettings();

  const byType: Record<string, number> = {};
  const byLanguage: Record<string, number> = {};

  for (const item of index.items) {
    byType[item.type] = (byType[item.type] || 0) + 1;
    byLanguage[item.language] = (byLanguage[item.language] || 0) + 1;
  }

  const sorted = [...index.items].sort(
    (a, b) => new Date(a.downloadedAt).getTime() - new Date(b.downloadedAt).getTime()
  );

  return {
    totalItems: index.items.length,
    totalSizeMB: Math.round(index.totalSizeBytes / (1024 * 1024) * 10) / 10,
    maxSizeMB: settings.maxCacheSizeMB,
    usagePercent: Math.round((index.totalSizeBytes / (settings.maxCacheSizeMB * 1024 * 1024)) * 100),
    byType: byType as Record<ContentType, number>,
    byLanguage,
    oldestItem: sorted[0]?.id || null,
    newestItem: sorted[sorted.length - 1]?.id || null,
  };
}

// ─── Search Cached Content ───────────────────────────────────────────────────
export async function searchCachedContent(query: {
  type?: ContentType;
  language?: string;
  level?: string;
  tags?: string[];
}): Promise<CachedItem[]> {
  const index = await getCacheIndex();
  return index.items.filter((item) => {
    if (query.type && item.type !== query.type) return false;
    if (query.language && item.language !== query.language) return false;
    if (query.level && item.level !== query.level) return false;
    if (query.tags && !query.tags.every((t) => item.tags.includes(t))) return false;
    return true;
  });
}

// ─── Network-Aware Content Serving ───────────────────────────────────────────
export async function getContentWithFallback(
  id: string,
  fetchOnline: () => Promise<LessonContent>
): Promise<{ content: LessonContent; source: "cache" | "network" }> {
  // Try cache first
  const cached = await getCachedContent(id);
  if (cached) {
    return { content: cached, source: "cache" };
  }

  // Try network
  try {
    const online = await fetchOnline();
    // Cache for future offline use
    await cacheContent(online);
    return { content: online, source: "network" };
  } catch {
    // If network fails and no cache, throw
    throw new Error("Content not available offline. Please download it first.");
  }
}

// ─── Batch Download ──────────────────────────────────────────────────────────
export async function batchDownload(
  contents: LessonContent[],
  onProgress?: (overall: number, current: DownloadProgress) => void
): Promise<{ success: string[]; failed: string[] }> {
  const success: string[] = [];
  const failed: string[] = [];

  for (let i = 0; i < contents.length; i++) {
    try {
      await cacheContent(contents[i], (p) => {
        const overall = Math.round(((i + p.progress / 100) / contents.length) * 100);
        onProgress?.(overall, p);
      });
      success.push(contents[i].id);
    } catch {
      failed.push(contents[i].id);
    }
  }

  return { success, failed };
}

// ─── Recommended Downloads ───────────────────────────────────────────────────
export function getRecommendedDownloads(
  userLevel: string,
  userLanguage: string,
  existingIds: string[]
): { id: string; title: string; type: ContentType; reason: string }[] {
  // Curated recommendations based on user profile
  const recommendations = [
    { id: `${userLanguage}_${userLevel}_essentials`, title: `${userLevel} Essential Vocabulary`, type: "vocabulary" as ContentType, reason: "Core vocabulary for your level" },
    { id: `${userLanguage}_${userLevel}_grammar`, title: `${userLevel} Grammar Guide`, type: "grammar" as ContentType, reason: "Grammar patterns you're learning" },
    { id: `${userLanguage}_travel_phrases`, title: "Travel Phrasebook", type: "phrasebook" as ContentType, reason: "Most useful phrases for travel" },
    { id: `${userLanguage}_${userLevel}_flashcards`, title: `${userLevel} Flashcard Deck`, type: "flashcards" as ContentType, reason: "Spaced repetition cards for your level" },
    { id: `${userLanguage}_emergency`, title: "Emergency Phrases", type: "phrasebook" as ContentType, reason: "Critical phrases for safety" },
  ];

  return recommendations.filter((r) => !existingIds.includes(r.id));
}
