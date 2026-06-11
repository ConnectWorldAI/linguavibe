import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Platform } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/use-colors";
import { getOverallXP } from "@/lib/exercise-scoring";
import { getCurrentTier, getNextTier, getTierProgress, XP_TIERS } from "@/app/xp-dashboard";
import { getDailyXPGoal, getDailyProgress, type DailyXPGoal, type DailyXPProgress } from "@/lib/daily-xp-goal";

export function XPProgressBar() {
  const router = useRouter();
  const colors = useColors();
  const [totalXP, setTotalXP] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [dailyGoal, setDailyGoal] = useState<DailyXPGoal | null>(null);
  const [dailyProgress, setDailyProgress] = useState<DailyXPProgress | null>(null);

  useEffect(() => {
    Promise.all([getOverallXP(), getDailyXPGoal(), getDailyProgress()]).then(
      ([xp, goal, progress]) => {
        setTotalXP(xp.totalXP);
        setDailyGoal(goal);
        setDailyProgress(progress);
        setLoaded(true);
      }
    );
  }, []);

  if (!loaded) return null;

  const tier = getCurrentTier(totalXP);
  const nextTier = getNextTier(totalXP);
  const progress = getTierProgress(totalXP);

  return (
    <TouchableOpacity
      style={[styles.container, { backgroundColor: colors.surface, borderColor: colors.border }]}
      onPress={() => {
        if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.push("/xp-dashboard" as any);
      }}
      activeOpacity={0.7}
    >
      <View style={[styles.iconCircle, { backgroundColor: tier.color + "15" }]}>
        <Ionicons name={tier.icon as any} size={20} color={tier.color} />
      </View>

      <View style={styles.content}>
        <View style={styles.topRow}>
          <Text style={[styles.tierLabel, { color: tier.color }]}>{tier.name}</Text>
          <Text style={[styles.xpText, { color: colors.muted }]}>{totalXP} XP</Text>
        </View>

        <View style={[styles.progressTrack, { backgroundColor: colors.border }]}>
          <View
            style={[
              styles.progressFill,
              { width: `${progress * 100}%`, backgroundColor: tier.color },
            ]}
          />
        </View>

        {nextTier && (
          <Text style={[styles.nextLabel, { color: colors.muted }]}>
            {nextTier.minXP - totalXP} XP to {nextTier.name}
          </Text>
        )}

        {dailyGoal?.isEnabled && dailyProgress && (
          <View style={styles.dailyRow}>
            <Ionicons name="today" size={12} color={dailyProgress.goalMet ? "#22C55E" : colors.muted} />
            <Text style={[styles.dailyText, { color: dailyProgress.goalMet ? "#22C55E" : colors.muted }]}>
              Today: {dailyProgress.earnedXP}/{dailyGoal.targetXP} XP
              {dailyProgress.goalMet ? " ✓" : ""}
            </Text>
          </View>
        )}
      </View>

      <TouchableOpacity
        onPress={() => {
          if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          router.push("/daily-xp-goal" as any);
        }}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Ionicons name="settings-outline" size={16} color={colors.muted} />
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    gap: 12,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    flex: 1,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  tierLabel: {
    fontSize: 14,
    fontWeight: "700",
  },
  xpText: {
    fontSize: 12,
    fontWeight: "600",
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 3,
  },
  nextLabel: {
    fontSize: 11,
    marginTop: 4,
  },
  dailyRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
  },
  dailyText: {
    fontSize: 11,
    fontWeight: "500",
  },
});
