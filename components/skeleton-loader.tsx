import React, { useEffect, useRef } from "react";
import { View, Animated, StyleSheet, Dimensions, Platform } from "react-native";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/use-colors";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: any;
}

/**
 * Individual skeleton bone element with shimmer animation
 */
export function SkeletonBone({ width = "100%", height = 16, borderRadius = 8, style }: SkeletonProps) {
  const shimmerAnim = useRef(new Animated.Value(0)).current;
  const colors = useColors();

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 1200,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, []);

  const opacity = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <Animated.View
      style={[
        {
          width: width as any,
          height,
          borderRadius,
          backgroundColor: colors.border,
          opacity,
        },
        style,
      ]}
    />
  );
}

/**
 * Skeleton card placeholder
 */
export function SkeletonCard({ style }: { style?: any }) {
  const colors = useColors();
  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }, style]}>
      <View style={styles.cardHeader}>
        <SkeletonBone width={40} height={40} borderRadius={20} />
        <View style={styles.cardHeaderText}>
          <SkeletonBone width="60%" height={14} />
          <SkeletonBone width="40%" height={10} style={{ marginTop: 6 }} />
        </View>
      </View>
      <SkeletonBone width="100%" height={12} style={{ marginTop: 12 }} />
      <SkeletonBone width="80%" height={12} style={{ marginTop: 8 }} />
      <SkeletonBone width="90%" height={12} style={{ marginTop: 8 }} />
    </View>
  );
}

/**
 * Skeleton list item placeholder
 */
export function SkeletonListItem({ style }: { style?: any }) {
  const colors = useColors();
  return (
    <View style={[styles.listItem, { borderBottomColor: colors.border }, style]}>
      <SkeletonBone width={48} height={48} borderRadius={12} />
      <View style={styles.listItemContent}>
        <SkeletonBone width="70%" height={14} />
        <SkeletonBone width="50%" height={11} style={{ marginTop: 6 }} />
      </View>
      <SkeletonBone width={24} height={24} borderRadius={12} />
    </View>
  );
}

/**
 * Skeleton stat block placeholder
 */
export function SkeletonStat({ style }: { style?: any }) {
  return (
    <View style={[styles.stat, style]}>
      <SkeletonBone width={32} height={32} borderRadius={16} />
      <SkeletonBone width={48} height={18} style={{ marginTop: 8 }} />
      <SkeletonBone width={36} height={10} style={{ marginTop: 4 }} />
    </View>
  );
}

/**
 * Home tab skeleton layout
 */
export function HomeTabSkeleton() {
  return (
    <View style={styles.container}>
      {/* Greeting */}
      <SkeletonBone width="50%" height={28} style={{ marginBottom: 4 }} />
      <SkeletonBone width="70%" height={14} style={{ marginBottom: 20 }} />
      {/* Stats row */}
      <View style={styles.statsRow}>
        <SkeletonStat />
        <SkeletonStat />
        <SkeletonStat />
      </View>
      {/* Teacher message card */}
      <SkeletonCard style={{ marginTop: 20 }} />
      {/* Quick actions */}
      <View style={styles.quickActions}>
        <SkeletonBone width="48%" height={56} borderRadius={12} />
        <SkeletonBone width="48%" height={56} borderRadius={12} />
      </View>
      {/* Lesson card */}
      <SkeletonCard style={{ marginTop: 16 }} />
    </View>
  );
}

/**
 * Explore tab skeleton layout
 */
export function ExploreTabSkeleton() {
  return (
    <View style={styles.container}>
      {/* Search bar */}
      <SkeletonBone width="100%" height={44} borderRadius={22} style={{ marginBottom: 20 }} />
      {/* Doorway grid */}
      <View style={styles.doorwayGrid}>
        {[1, 2, 3, 4].map((i) => (
          <SkeletonBone key={i} width="22%" height={72} borderRadius={12} />
        ))}
      </View>
      <View style={[styles.doorwayGrid, { marginTop: 12 }]}>
        {[5, 6, 7, 8].map((i) => (
          <SkeletonBone key={i} width="22%" height={72} borderRadius={12} />
        ))}
      </View>
      {/* Featured section */}
      <SkeletonBone width="40%" height={18} style={{ marginTop: 24, marginBottom: 12 }} />
      <SkeletonBone width="100%" height={160} borderRadius={16} />
    </View>
  );
}

/**
 * Lessons tab skeleton layout
 */
export function LessonsTabSkeleton() {
  return (
    <View style={styles.container}>
      {/* Header */}
      <SkeletonBone width="40%" height={24} style={{ marginBottom: 16 }} />
      {/* Progress bar */}
      <SkeletonBone width="100%" height={8} borderRadius={4} style={{ marginBottom: 20 }} />
      {/* Lesson list */}
      {[1, 2, 3, 4, 5].map((i) => (
        <SkeletonListItem key={i} style={{ marginBottom: 4 }} />
      ))}
    </View>
  );
}

/**
 * Companion tab skeleton layout
 */
export function CompanionTabSkeleton() {
  return (
    <View style={styles.container}>
      {/* Avatar */}
      <View style={styles.companionHeader}>
        <SkeletonBone width={64} height={64} borderRadius={32} />
        <View style={{ marginLeft: 12, flex: 1 }}>
          <SkeletonBone width="50%" height={18} />
          <SkeletonBone width="30%" height={12} style={{ marginTop: 6 }} />
        </View>
      </View>
      {/* Chat bubbles */}
      <View style={{ marginTop: 24 }}>
        <SkeletonBone width="75%" height={48} borderRadius={16} style={{ marginBottom: 12 }} />
        <SkeletonBone width="60%" height={36} borderRadius={16} style={{ alignSelf: "flex-end", marginBottom: 12 }} />
        <SkeletonBone width="80%" height={56} borderRadius={16} style={{ marginBottom: 12 }} />
      </View>
      {/* Input bar */}
      <SkeletonBone width="100%" height={48} borderRadius={24} style={{ marginTop: "auto" }} />
    </View>
  );
}

/**
 * Profile tab skeleton layout
 */
export function ProfileTabSkeleton() {
  return (
    <View style={styles.container}>
      {/* Avatar + name */}
      <View style={styles.profileHeader}>
        <SkeletonBone width={80} height={80} borderRadius={40} />
        <SkeletonBone width="40%" height={20} style={{ marginTop: 12 }} />
        <SkeletonBone width="30%" height={12} style={{ marginTop: 6 }} />
      </View>
      {/* Stats */}
      <View style={[styles.statsRow, { marginTop: 24 }]}>
        <SkeletonStat />
        <SkeletonStat />
        <SkeletonStat />
        <SkeletonStat />
      </View>
      {/* Settings list */}
      {[1, 2, 3, 4, 5].map((i) => (
        <SkeletonListItem key={i} style={{ marginBottom: 2 }} />
      ))}
    </View>
  );
}

/**
 * Trigger a subtle haptic pulse when content finishes loading.
 * Call this in the tab screen's useEffect when data is ready.
 */
export function hapticLoadComplete() {
  if (Platform.OS !== "web") {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    paddingTop: 8,
  },
  card: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  cardHeaderText: {
    flex: 1,
    marginLeft: 12,
  },
  listItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 0.5,
  },
  listItemContent: {
    flex: 1,
    marginLeft: 12,
  },
  stat: {
    alignItems: "center",
    flex: 1,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  quickActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 16,
  },
  doorwayGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  companionHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  profileHeader: {
    alignItems: "center",
    paddingVertical: 16,
  },
});
