/**
 * Achievement Share Card Component
 * 
 * Visual card shown when a gold/diamond achievement is unlocked,
 * allowing users to share their accomplishment on social media.
 */
import React, { useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withDelay,
  Easing,
} from "react-native-reanimated";
import {
  getShareCardStyle,
  shareAchievementCard,
  type ShareCardData,
  type ShareCardStyle,
} from "@/lib/achievement-share-card";
import type { AchievementUnlockEvent } from "@/lib/achievement-unlock";

interface AchievementShareCardProps {
  event: AchievementUnlockEvent;
  visible: boolean;
  onDismiss: () => void;
  onShared?: () => void;
}

export function AchievementShareCard({
  event,
  visible,
  onDismiss,
  onShared,
}: AchievementShareCardProps) {
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.8);
  const glowOpacity = useSharedValue(0);

  const style = getShareCardStyle(event.tier || "gold");
  const tierEmoji = event.tier === "diamond" ? "💎" : "🥇";

  useEffect(() => {
    if (visible) {
      opacity.value = withTiming(1, { duration: 300 });
      scale.value = withSequence(
        withTiming(1.02, { duration: 200, easing: Easing.out(Easing.cubic) }),
        withTiming(1, { duration: 150 })
      );
      glowOpacity.value = withDelay(
        200,
        withSequence(
          withTiming(1, { duration: 400 }),
          withTiming(0.6, { duration: 600 }),
          withTiming(1, { duration: 600 })
        )
      );
    } else {
      opacity.value = withTiming(0, { duration: 200 });
      scale.value = withTiming(0.9, { duration: 200 });
    }
  }, [visible]);

  const containerStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  const handleShare = async () => {
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    const shared = await shareAchievementCard(event);
    if (shared && onShared) onShared();
  };

  if (!visible) return null;

  return (
    <Animated.View style={[styles.overlay, containerStyle]}>
      <View style={styles.backdrop}>
        <TouchableOpacity style={styles.backdropTouch} onPress={onDismiss} activeOpacity={1} />
      </View>

      <View style={[styles.card, { backgroundColor: style.backgroundColor, borderColor: style.borderColor }]}>
        {/* Glow effect */}
        <Animated.View style={[styles.glow, { backgroundColor: style.glowColor }, glowStyle]} />

        {/* Header */}
        <View style={styles.cardHeader}>
          <Text style={[styles.tierBadge, { color: style.accentColor }]}>
            {tierEmoji} {(event.tier || "").toUpperCase()} ACHIEVEMENT
          </Text>
          <TouchableOpacity onPress={onDismiss} style={styles.closeBtn}>
            <Ionicons name="close" size={20} color={style.textColor} />
          </TouchableOpacity>
        </View>

        {/* Achievement Info */}
        <View style={styles.cardBody}>
          <Text style={[styles.achievementIcon]}>{event.icon}</Text>
          <Text style={[styles.achievementTitle, { color: style.textColor }]}>
            {event.title}
          </Text>
          <Text style={[styles.achievementDesc, { color: style.textColor + "CC" }]}>
            {event.description}
          </Text>
          <View style={[styles.categoryBadge, { borderColor: style.accentColor + "60" }]}>
            <Text style={[styles.categoryText, { color: style.accentColor }]}>
              {event.category.toUpperCase()}
            </Text>
          </View>
        </View>

        {/* Share Button */}
        <TouchableOpacity
          style={[styles.shareBtn, { backgroundColor: style.accentColor }]}
          onPress={handleShare}
          activeOpacity={0.8}
        >
          <Ionicons name="share-social" size={18} color="#000000" />
          <Text style={styles.shareBtnText}>Share Achievement</Text>
        </TouchableOpacity>

        {/* Footer */}
        <Text style={[styles.footerText, { color: style.textColor + "80" }]}>
          ConnectWorld AI • LinguaVibe
        </Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.7)",
  },
  backdropTouch: {
    flex: 1,
  },
  card: {
    width: "85%",
    maxWidth: 340,
    borderRadius: 20,
    borderWidth: 2,
    padding: 24,
    alignItems: "center",
    overflow: "hidden",
  },
  glow: {
    position: "absolute",
    top: -50,
    left: -50,
    right: -50,
    bottom: -50,
    borderRadius: 100,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    marginBottom: 20,
  },
  tierBadge: {
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1.5,
  },
  closeBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  cardBody: {
    alignItems: "center",
    marginBottom: 24,
  },
  achievementIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  achievementTitle: {
    fontSize: 22,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 8,
  },
  achievementDesc: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 12,
  },
  categoryBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1,
  },
  shareBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    marginBottom: 12,
  },
  shareBtnText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#000000",
  },
  footerText: {
    fontSize: 11,
    fontWeight: "500",
  },
});
