/**
 * This Week's Progress Card
 * Mini 7-day bar chart showing daily XP earned, with tap-through to XP Dashboard.
 */
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import { Colors, Spacing, BorderRadius, FontSize } from "@/constants/Colors";
import { getDailyXPGoal } from "@/lib/daily-xp-goal";
import AsyncStorage from "@react-native-async-storage/async-storage";

const WEEKLY_XP_KEY = "@connectworld_weekly_xp_history";

type DayXP = {
  day: string; // "Mon", "Tue", etc.
  xp: number;
  date: string; // ISO date string
};

/**
 * Get the last 7 days of XP data from storage.
 */
export async function getWeeklyXPData(): Promise<DayXP[]> {
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const result: DayXP[] = [];
  const today = new Date();

  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split("T")[0];
    const dayName = days[d.getDay()];
    result.push({ day: dayName, xp: 0, date: dateStr });
  }

  try {
    const stored = await AsyncStorage.getItem(WEEKLY_XP_KEY);
    if (stored) {
      const history: Record<string, number> = JSON.parse(stored);
      for (const entry of result) {
        if (history[entry.date]) {
          entry.xp = history[entry.date];
        }
      }
    }
  } catch {}

  return result;
}

/**
 * Record XP earned for today. Called when exercises are completed.
 */
export async function recordDailyXP(xp: number): Promise<void> {
  const today = new Date().toISOString().split("T")[0];
  try {
    const stored = await AsyncStorage.getItem(WEEKLY_XP_KEY);
    const history: Record<string, number> = stored ? JSON.parse(stored) : {};
    history[today] = (history[today] || 0) + xp;

    // Keep only last 14 days
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 14);
    const cutoffStr = cutoff.toISOString().split("T")[0];
    for (const key of Object.keys(history)) {
      if (key < cutoffStr) delete history[key];
    }

    await AsyncStorage.setItem(WEEKLY_XP_KEY, JSON.stringify(history));
  } catch {}
}

interface WeeklyProgressCardProps {
  refreshTrigger?: number;
}

export function WeeklyProgressCard({ refreshTrigger }: WeeklyProgressCardProps) {
  const [weekData, setWeekData] = useState<DayXP[]>([]);
  const [dailyGoal, setDailyGoal] = useState(10);
  const [totalWeekXP, setTotalWeekXP] = useState(0);

  useEffect(() => {
    loadData();
  }, [refreshTrigger]);

  const loadData = async () => {
    const data = await getWeeklyXPData();
    setWeekData(data);
    setTotalWeekXP(data.reduce((sum, d) => sum + d.xp, 0));

    try {
      const goal = await getDailyXPGoal();
      if (goal && goal.targetXP) setDailyGoal(goal.targetXP);
    } catch {}
  };

  const maxXP = Math.max(...weekData.map(d => d.xp), dailyGoal, 1);

  if (weekData.length === 0) return null;

  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.8}
      onPress={() => {
        if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.push("/xp-dashboard" as any);
      }}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="bar-chart" size={16} color={Colors.primary} />
          <Text style={styles.title}>This Week</Text>
        </View>
        <View style={styles.headerRight}>
          <Text style={styles.totalXP}>{totalWeekXP} XP</Text>
          <Ionicons name="chevron-forward" size={14} color={Colors.textMuted} />
        </View>
      </View>

      {/* Bar Chart */}
      <View style={styles.chartContainer}>
        {weekData.map((day, index) => {
          const height = maxXP > 0 ? Math.max((day.xp / maxXP) * 48, 3) : 3;
          const isToday = index === weekData.length - 1;
          const metGoal = day.xp >= dailyGoal;

          return (
            <View key={day.date} style={styles.barColumn}>
              <View style={styles.barWrapper}>
                <View
                  style={[
                    styles.bar,
                    {
                      height,
                      backgroundColor: metGoal
                        ? Colors.success || "#22C55E"
                        : isToday
                        ? Colors.primary
                        : Colors.textMuted + "40",
                    },
                  ]}
                />
              </View>
              <Text style={[styles.dayLabel, isToday && styles.dayLabelToday]}>
                {day.day}
              </Text>
            </View>
          );
        })}

        {/* Goal line */}
        <View
          style={[
            styles.goalLine,
            { bottom: 20 + (dailyGoal / maxXP) * 48 },
          ]}
        />
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: Colors.success || "#22C55E" }]} />
          <Text style={styles.legendText}>Goal met</Text>
        </View>
        <Text style={styles.goalText}>Daily goal: {dailyGoal} XP</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.sm,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  title: {
    fontSize: FontSize.md,
    fontWeight: "700",
    color: Colors.text,
  },
  totalXP: {
    fontSize: FontSize.sm,
    fontWeight: "600",
    color: Colors.primary,
  },
  chartContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    height: 72,
    paddingTop: 4,
    position: "relative",
  },
  barColumn: {
    flex: 1,
    alignItems: "center",
  },
  barWrapper: {
    flex: 1,
    justifyContent: "flex-end",
    alignItems: "center",
  },
  bar: {
    width: 20,
    borderRadius: 4,
    minHeight: 3,
  },
  dayLabel: {
    fontSize: 10,
    color: Colors.textMuted,
    marginTop: 4,
  },
  dayLabelToday: {
    color: Colors.primary,
    fontWeight: "700",
  },
  goalLine: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: Colors.textMuted + "30",
    borderStyle: "dashed",
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: Spacing.sm,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
  },
  goalText: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
  },
});
