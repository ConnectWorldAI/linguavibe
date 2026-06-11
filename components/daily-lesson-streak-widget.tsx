/**
 * Daily Lesson Streak Widget
 * 
 * Compact home screen widget showing:
 * - Today's immersion lesson count
 * - Pronunciation score trend (last 7 sessions)
 * - Next scheduled notification time
 */
import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Colors } from "@/constants/Colors";

interface WidgetData {
  immersionLessonsToday: number;
  pronunciationTrend: number; // percentage change
  lastPronunciationScore: number;
  nextNotificationTime: string | null;
  immersionStreak: number;
}

const IMMERSION_SETTINGS_KEY = "@immersion_mode_settings";
const PRONUNCIATION_PROGRESS_KEY = "@pronunciation_progress";
const IMMERSION_LESSONS_CACHE_KEY = "@immersion_lessons_cache";

export function DailyLessonStreakWidget() {
  const [data, setData] = useState<WidgetData>({
    immersionLessonsToday: 0,
    pronunciationTrend: 0,
    lastPronunciationScore: 0,
    nextNotificationTime: null,
    immersionStreak: 0,
  });

  useEffect(() => {
    loadWidgetData();
  }, []);

  const loadWidgetData = async () => {
    try {
      // Load immersion settings
      const immersionRaw = await AsyncStorage.getItem(IMMERSION_SETTINGS_KEY);
      let immersionLessonsToday = 0;
      let immersionStreak = 0;
      let nextNotificationTime: string | null = null;

      if (immersionRaw) {
        const settings = JSON.parse(immersionRaw);
        immersionStreak = settings.immersionStreak || 0;
        immersionLessonsToday = settings.totalLessonsDelivered || 0;

        // Calculate next notification time based on frequency
        if (settings.enabled) {
          const now = new Date();
          const freqMinutes = settings.frequency === "aggressive" ? 30 :
            settings.frequency === "moderate" ? 60 : 120;
          const next = new Date(now.getTime() + freqMinutes * 60 * 1000);
          const quietStart = settings.quietHoursStart || 22;
          const quietEnd = settings.quietHoursEnd || 7;
          
          if (next.getHours() >= quietStart || next.getHours() < quietEnd) {
            nextNotificationTime = `${quietEnd}:00 AM`;
          } else {
            nextNotificationTime = next.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
          }
        }
      }

      // Load pronunciation progress
      const pronRaw = await AsyncStorage.getItem(PRONUNCIATION_PROGRESS_KEY);
      let pronunciationTrend = 0;
      let lastPronunciationScore = 0;

      if (pronRaw) {
        const sessions = JSON.parse(pronRaw);
        if (sessions.length > 0) {
          lastPronunciationScore = sessions[sessions.length - 1]?.overallScore || 0;
          
          // Calculate trend from last 7 sessions
          const recent = sessions.slice(-7);
          if (recent.length >= 2) {
            const firstHalf = recent.slice(0, Math.floor(recent.length / 2));
            const secondHalf = recent.slice(Math.floor(recent.length / 2));
            const avgFirst = firstHalf.reduce((a: number, s: any) => a + (s.overallScore || 0), 0) / firstHalf.length;
            const avgSecond = secondHalf.reduce((a: number, s: any) => a + (s.overallScore || 0), 0) / secondHalf.length;
            pronunciationTrend = avgFirst > 0 ? Math.round(((avgSecond - avgFirst) / avgFirst) * 100) : 0;
          }
        }
      }

      // Load cached lessons count
      const lessonsRaw = await AsyncStorage.getItem(IMMERSION_LESSONS_CACHE_KEY);
      if (lessonsRaw) {
        const lessons = JSON.parse(lessonsRaw);
        // Count lessons generated today
        const today = new Date().toDateString();
        const todayLessons = lessons.filter((l: any) => {
          const lessonDate = new Date(l.generatedAt || l.timestamp || Date.now()).toDateString();
          return lessonDate === today;
        });
        if (todayLessons.length > 0) {
          immersionLessonsToday = todayLessons.length;
        }
      }

      setData({
        immersionLessonsToday,
        pronunciationTrend,
        lastPronunciationScore,
        nextNotificationTime,
        immersionStreak,
      });
    } catch {}
  };

  const trendColor = data.pronunciationTrend > 0 ? Colors.success : data.pronunciationTrend < 0 ? Colors.error : Colors.textSecondary;
  const trendIcon = data.pronunciationTrend > 0 ? "trending-up" : data.pronunciationTrend < 0 ? "trending-down" : "remove";

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="flash" size={16} color={Colors.gold} />
          <Text style={styles.headerTitle}>Daily Learning Pulse</Text>
        </View>
        <TouchableOpacity
          onPress={() => router.push("/immersion-mode" as any)}
          activeOpacity={0.7}
          style={styles.headerAction}
        >
          <Text style={styles.headerActionText}>Details</Text>
          <Ionicons name="chevron-forward" size={12} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      <View style={styles.statsRow}>
        {/* Immersion Lessons Today */}
        <TouchableOpacity
          style={styles.statCard}
          activeOpacity={0.7}
          onPress={() => router.push("/immersion-mode" as any)}
        >
          <View style={[styles.statIcon, { backgroundColor: Colors.primary + "15" }]}>
            <Ionicons name="notifications" size={16} color={Colors.primary} />
          </View>
          <Text style={styles.statValue}>{data.immersionLessonsToday}</Text>
          <Text style={styles.statLabel}>Lessons Today</Text>
        </TouchableOpacity>

        {/* Pronunciation Score Trend */}
        <TouchableOpacity
          style={styles.statCard}
          activeOpacity={0.7}
          onPress={() => router.push("/pronunciation-progress" as any)}
        >
          <View style={[styles.statIcon, { backgroundColor: trendColor + "15" }]}>
            <Ionicons name={trendIcon as any} size={16} color={trendColor} />
          </View>
          <Text style={styles.statValue}>
            {data.lastPronunciationScore > 0 ? `${data.lastPronunciationScore}%` : "--"}
          </Text>
          <Text style={styles.statLabel}>
            {data.pronunciationTrend !== 0 ? `${data.pronunciationTrend > 0 ? "+" : ""}${data.pronunciationTrend}%` : "Pron. Score"}
          </Text>
        </TouchableOpacity>

        {/* Next Notification */}
        <TouchableOpacity
          style={styles.statCard}
          activeOpacity={0.7}
          onPress={() => router.push("/immersion-mode" as any)}
        >
          <View style={[styles.statIcon, { backgroundColor: Colors.secondary + "15" }]}>
            <Ionicons name="time" size={16} color={Colors.secondary} />
          </View>
          <Text style={styles.statValue}>
            {data.nextNotificationTime || "--"}
          </Text>
          <Text style={styles.statLabel}>Next Lesson</Text>
        </TouchableOpacity>
      </View>

      {/* Immersion Streak Bar */}
      {data.immersionStreak > 0 && (
        <View style={styles.streakBar}>
          <Ionicons name="flame" size={14} color={Colors.gold} />
          <Text style={styles.streakBarText}>
            {data.immersionStreak}-day immersion streak
          </Text>
          <View style={styles.streakBarProgress}>
            <View style={[styles.streakBarFill, { width: `${Math.min((data.immersionStreak / 30) * 100, 100)}%` }]} />
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.cardBg,
    borderRadius: 16,
    padding: 14,
    gap: 12,
    borderWidth: 0.5,
    borderColor: Colors.border,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.text,
  },
  headerAction: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  headerActionText: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: "600",
  },
  statsRow: {
    flexDirection: "row",
    gap: 8,
  },
  statCard: {
    flex: 1,
    alignItems: "center",
    gap: 4,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: Colors.background + "80",
  },
  statIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  statValue: {
    fontSize: 15,
    fontWeight: "800",
    color: Colors.text,
  },
  statLabel: {
    fontSize: 10,
    color: Colors.textSecondary,
    textAlign: "center",
  },
  streakBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingTop: 4,
    borderTopWidth: 0.5,
    borderTopColor: Colors.border,
  },
  streakBarText: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: "500",
  },
  streakBarProgress: {
    flex: 1,
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
    overflow: "hidden",
  },
  streakBarFill: {
    height: "100%",
    backgroundColor: Colors.gold,
    borderRadius: 2,
  },
});
