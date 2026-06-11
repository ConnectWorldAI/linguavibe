/**
 * ContentShareSheet — Instagram-style bottom sheet for sharing content
 *
 * Provides all share/action options for any content type:
 * - Save (bookmark)
 * - Remix (create content using this)
 * - Add to Playlist/Sequence
 * - Copy Link
 * - Share (native share sheet)
 * - QR Code
 * - About this creator/agent
 * - Pin to profile
 * - Translate (switch language)
 * - Remove from feed
 * - Report
 *
 * Used on: videos, posts, AI short films, user profiles, lessons, songs, slang cards
 */

import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  Modal,
  Pressable,
  ScrollView,
  Platform,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import * as Sharing from 'expo-sharing';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/hooks/use-colors';
import {
  ContentItem,
  getContentWebUrl,
  getShareMessage,
  getEmbedCode,
  getQRCodeUrl,
} from '@/lib/deep-links';

// Quick action button type
interface QuickAction {
  icon: keyof typeof MaterialIcons.glyphMap;
  label: string;
  onPress: () => void;
}

// List action type
interface ListAction {
  icon: keyof typeof MaterialIcons.glyphMap;
  label: string;
  onPress: () => void;
  destructive?: boolean;
  premium?: boolean;
}

interface ContentShareSheetProps {
  visible: boolean;
  onClose: () => void;
  content: ContentItem;
  // Optional callbacks for specific actions
  onSave?: (item: ContentItem) => void;
  onRemix?: (item: ContentItem) => void;
  onAddToPlaylist?: (item: ContentItem) => void;
  onPinToProfile?: (item: ContentItem) => void;
  onTranslate?: (item: ContentItem) => void;
  onRemoveFromFeed?: (item: ContentItem) => void;
  onReport?: (item: ContentItem) => void;
  onRepost?: (item: ContentItem) => void;
  onViewCreator?: (item: ContentItem) => void;
  onQRCode?: (item: ContentItem) => void;
  // Customization
  showRemix?: boolean;
  showTranslate?: boolean;
  showPinToProfile?: boolean;
  isOwner?: boolean; // If user owns this content, show different options
}

export function ContentShareSheet({
  visible,
  onClose,
  content,
  onSave,
  onRemix,
  onAddToPlaylist,
  onPinToProfile,
  onTranslate,
  onRemoveFromFeed,
  onReport,
  onRepost,
  onViewCreator,
  onQRCode,
  showRemix = true,
  showTranslate = true,
  showPinToProfile = false,
  isOwner = false,
}: ContentShareSheetProps) {
  const colors = useColors();
  const [copiedFeedback, setCopiedFeedback] = useState(false);
  const screenHeight = Dimensions.get('window').height;

  const triggerHaptic = useCallback(() => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, []);

  // Copy link to clipboard
  const handleCopyLink = useCallback(async () => {
    triggerHaptic();
    const url = getContentWebUrl(content);
    await Clipboard.setStringAsync(url);
    setCopiedFeedback(true);
    setTimeout(() => setCopiedFeedback(false), 2000);
  }, [content, triggerHaptic]);

  // Native share sheet
  const handleShare = useCallback(async () => {
    triggerHaptic();
    const message = getShareMessage(content);
    const url = getContentWebUrl(content);

    if (Platform.OS === 'web') {
      if (navigator.share) {
        await navigator.share({
          title: content.title,
          text: message,
          url: url,
        });
      } else {
        // Fallback: copy to clipboard
        await Clipboard.setStringAsync(message);
        setCopiedFeedback(true);
        setTimeout(() => setCopiedFeedback(false), 2000);
      }
    } else {
      // On native, use expo-sharing
      try {
        await Sharing.shareAsync(url, {
          dialogTitle: `Share: ${content.title}`,
        });
      } catch {
        // Fallback to clipboard
        await Clipboard.setStringAsync(message);
      }
    }
    onClose();
  }, [content, triggerHaptic, onClose]);

  // Copy embed code
  const handleCopyEmbed = useCallback(async () => {
    triggerHaptic();
    const embed = getEmbedCode(content);
    await Clipboard.setStringAsync(embed);
    setCopiedFeedback(true);
    setTimeout(() => setCopiedFeedback(false), 2000);
  }, [content, triggerHaptic]);

  // Quick actions (top row with large icons)
  const quickActions: QuickAction[] = [
    {
      icon: 'bookmark-border',
      label: 'Save',
      onPress: () => {
        triggerHaptic();
        onSave?.(content);
        onClose();
      },
    },
  ];

  if (showRemix) {
    quickActions.push({
      icon: 'loop',
      label: 'Remix',
      onPress: () => {
        triggerHaptic();
        onRemix?.(content);
        onClose();
      },
    });
  }

  quickActions.push({
    icon: 'playlist-add',
    label: 'Sequence',
    onPress: () => {
      triggerHaptic();
      onAddToPlaylist?.(content);
      onClose();
    },
  });

  // List actions
  const listActions: ListAction[] = [
    {
      icon: 'link',
      label: copiedFeedback ? 'Copied!' : 'Copy Link',
      onPress: handleCopyLink,
    },
    {
      icon: 'share',
      label: 'Share',
      onPress: handleShare,
    },
    {
      icon: 'qr-code',
      label: 'QR Code',
      onPress: () => {
        triggerHaptic();
        onQRCode?.(content);
        onClose();
      },
    },
    {
      icon: 'code',
      label: 'Embed',
      onPress: handleCopyEmbed,
    },
  ];

  // Repost option
  if (!isOwner) {
    listActions.push({
      icon: 'repeat',
      label: 'Repost to Feed',
      onPress: () => {
        triggerHaptic();
        onRepost?.(content);
        onClose();
      },
    });
  }

  // About creator
  if (content.authorName || content.authorUsername) {
    listActions.push({
      icon: 'person-outline',
      label: `About ${content.authorName || 'this account'}`,
      onPress: () => {
        triggerHaptic();
        onViewCreator?.(content);
        onClose();
      },
    });
  }

  // Translate option (for video/audio content)
  if (showTranslate && (content.type === 'video' || content.type === 'series_episode' || content.type === 'song')) {
    listActions.push({
      icon: 'translate',
      label: 'Translate to Another Language',
      onPress: () => {
        triggerHaptic();
        onTranslate?.(content);
        onClose();
      },
    });
  }

  // Pin to profile (owner only)
  if (isOwner && showPinToProfile) {
    listActions.push({
      icon: 'push-pin',
      label: 'Pin to Profile',
      onPress: () => {
        triggerHaptic();
        onPinToProfile?.(content);
        onClose();
      },
    });
  }

  // Destructive actions
  if (!isOwner) {
    listActions.push({
      icon: 'visibility-off',
      label: 'Not Interested',
      onPress: () => {
        triggerHaptic();
        onRemoveFromFeed?.(content);
        onClose();
      },
    });
  }

  listActions.push({
    icon: 'flag',
    label: 'Report',
    onPress: () => {
      triggerHaptic();
      onReport?.(content);
      onClose();
    },
    destructive: true,
  });

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable
        style={styles.overlay}
        onPress={onClose}
      >
        <View style={styles.overlayBg} />
      </Pressable>

      <View
        style={[
          styles.sheetContainer,
          {
            backgroundColor: colors.background,
            maxHeight: screenHeight * 0.7,
          },
        ]}
      >
        {/* Drag handle */}
        <View style={styles.handleContainer}>
          <View style={[styles.handle, { backgroundColor: colors.muted }]} />
        </View>

        {/* Quick Actions Row */}
        <View style={styles.quickActionsRow}>
          {quickActions.map((action, index) => (
            <Pressable
              key={index}
              onPress={action.onPress}
              style={({ pressed }) => [
                styles.quickActionButton,
                { backgroundColor: colors.surface },
                pressed && { opacity: 0.7 },
              ]}
            >
              <MaterialIcons
                name={action.icon}
                size={24}
                color={colors.foreground}
              />
              <Text
                style={[styles.quickActionLabel, { color: colors.foreground }]}
                numberOfLines={1}
              >
                {action.label}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Divider */}
        <View style={[styles.divider, { backgroundColor: colors.border }]} />

        {/* List Actions */}
        <ScrollView
          style={styles.listContainer}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          {listActions.map((action, index) => (
            <Pressable
              key={index}
              onPress={action.onPress}
              style={({ pressed }) => [
                styles.listItem,
                pressed && { backgroundColor: colors.surface },
              ]}
            >
              <MaterialIcons
                name={action.icon}
                size={22}
                color={action.destructive ? colors.error : colors.foreground}
              />
              <Text
                style={[
                  styles.listItemLabel,
                  {
                    color: action.destructive ? colors.error : colors.foreground,
                  },
                ]}
              >
                {action.label}
              </Text>
              {action.premium && (
                <View style={[styles.premiumBadge, { backgroundColor: colors.warning }]}>
                  <Text style={styles.premiumBadgeText}>PRO</Text>
                </View>
              )}
            </Pressable>
          ))}

          {/* Bottom spacing for safe area */}
          <View style={{ height: 40 }} />
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  overlayBg: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  sheetContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 20,
  },
  handleContainer: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    opacity: 0.4,
  },
  quickActionsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    gap: 16,
  },
  quickActionButton: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 90,
    height: 72,
    borderRadius: 12,
    gap: 6,
  },
  quickActionLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginHorizontal: 16,
  },
  listContainer: {
    paddingTop: 8,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    gap: 14,
  },
  listItemLabel: {
    fontSize: 16,
    fontWeight: '400',
    flex: 1,
  },
  premiumBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  premiumBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#000',
  },
});
