/**
 * useContentShare — Hook for managing the content share sheet state
 *
 * Provides a simple API to open the share sheet for any content item
 * and handles save/bookmark state persistence.
 *
 * Usage:
 * ```tsx
 * const { openShareSheet, ShareSheet } = useContentShare();
 *
 * // Open share sheet for a video
 * openShareSheet({
 *   id: 'video-123',
 *   type: 'video',
 *   title: 'Granny Goes to Santo Domingo - Episode 5',
 *   authorName: 'ConnectWorld AI',
 *   thumbnailUrl: '...',
 * });
 *
 * // Render the sheet (put at bottom of screen)
 * return <>{ShareSheet}</>
 * ```
 */

import React, { useState, useCallback, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ContentShareSheet } from '@/components/content-share-sheet';
import { ContentItem } from '@/lib/deep-links';

const SAVED_CONTENT_KEY = '@connectworld_saved_content';
const PINNED_CONTENT_KEY = '@connectworld_pinned_content';

interface UseContentShareOptions {
  onSave?: (item: ContentItem) => void;
  onRemix?: (item: ContentItem) => void;
  onAddToPlaylist?: (item: ContentItem) => void;
  onTranslate?: (item: ContentItem) => void;
  onReport?: (item: ContentItem) => void;
  onRepost?: (item: ContentItem) => void;
  onViewCreator?: (item: ContentItem) => void;
  onQRCode?: (item: ContentItem) => void;
  isOwner?: boolean;
}

export function useContentShare(options: UseContentShareOptions = {}) {
  const [visible, setVisible] = useState(false);
  const [currentContent, setCurrentContent] = useState<ContentItem | null>(null);

  const openShareSheet = useCallback((content: ContentItem) => {
    setCurrentContent(content);
    setVisible(true);
  }, []);

  const closeShareSheet = useCallback(() => {
    setVisible(false);
    setCurrentContent(null);
  }, []);

  // Default save handler — persists to AsyncStorage
  const handleSave = useCallback(async (item: ContentItem) => {
    try {
      const existing = await AsyncStorage.getItem(SAVED_CONTENT_KEY);
      const saved: ContentItem[] = existing ? JSON.parse(existing) : [];

      // Toggle save
      const index = saved.findIndex((s) => s.id === item.id && s.type === item.type);
      if (index >= 0) {
        saved.splice(index, 1);
      } else {
        saved.unshift(item);
      }

      await AsyncStorage.setItem(SAVED_CONTENT_KEY, JSON.stringify(saved));
      options.onSave?.(item);
    } catch (error) {
      console.error('Failed to save content:', error);
    }
  }, [options]);

  // Default pin handler
  const handlePin = useCallback(async (item: ContentItem) => {
    try {
      const existing = await AsyncStorage.getItem(PINNED_CONTENT_KEY);
      const pinned: ContentItem[] = existing ? JSON.parse(existing) : [];

      const index = pinned.findIndex((p) => p.id === item.id && p.type === item.type);
      if (index >= 0) {
        pinned.splice(index, 1);
      } else {
        pinned.unshift(item);
      }

      await AsyncStorage.setItem(PINNED_CONTENT_KEY, JSON.stringify(pinned));
    } catch (error) {
      console.error('Failed to pin content:', error);
    }
  }, []);

  // The share sheet element to render
  const ShareSheet = useMemo(() => {
    if (!currentContent) return null;

    return (
      <ContentShareSheet
        visible={visible}
        onClose={closeShareSheet}
        content={currentContent}
        onSave={options.onSave || handleSave}
        onRemix={options.onRemix}
        onAddToPlaylist={options.onAddToPlaylist}
        onPinToProfile={handlePin}
        onTranslate={options.onTranslate}
        onReport={options.onReport}
        onRepost={options.onRepost}
        onViewCreator={options.onViewCreator}
        onQRCode={options.onQRCode}
        isOwner={options.isOwner}
        showPinToProfile={options.isOwner}
      />
    );
  }, [visible, currentContent, closeShareSheet, options, handleSave, handlePin]);

  return {
    openShareSheet,
    closeShareSheet,
    ShareSheet,
    isVisible: visible,
    currentContent,
  };
}

/**
 * Get all saved/bookmarked content
 */
export async function getSavedContent(): Promise<ContentItem[]> {
  try {
    const existing = await AsyncStorage.getItem(SAVED_CONTENT_KEY);
    return existing ? JSON.parse(existing) : [];
  } catch {
    return [];
  }
}

/**
 * Check if a specific content item is saved
 */
export async function isContentSaved(id: string, type: string): Promise<boolean> {
  const saved = await getSavedContent();
  return saved.some((item) => item.id === id && item.type === type);
}

/**
 * Get all pinned content for user profile
 */
export async function getPinnedContent(): Promise<ContentItem[]> {
  try {
    const existing = await AsyncStorage.getItem(PINNED_CONTENT_KEY);
    return existing ? JSON.parse(existing) : [];
  } catch {
    return [];
  }
}
