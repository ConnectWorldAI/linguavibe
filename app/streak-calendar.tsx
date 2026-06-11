import React, { useState, useEffect, useMemo } from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getPracticeLog } from "@/lib/learning-pace";

const Colors = {
  primary: "#0A0E1A",
  surface: "#141825",
  surfaceElevated: "#1C2235",
  secondary: "#00AAFF",
  textPrimary: "#FFFFFF",
  textSecondary: "#8A9BB0",
  textMuted: "#5A6A7A",
  border: "rgba(255,255,255,0.06)",
  gold: "#FFD700",
  success: "#00E676",
  glowSubtle: "rgba(0,170,255,0.08)",
  glowBorder: "rgba(0,170,255,0.2)",
};

// Heat map intensity colors
const HEAT_COLORS = {
  0: "rgba(255,255,255,0.03)",
  1: "rgba(0,170,255,0.2)",
  2: "rgba(0,170,255,0.4)",
  3: "rgba(0,170,255,0.6)",
  4: "rgba(0,170,255,0.85)",
};

// Activity data loaded from real practice log
type ActivityRecord = Record<string, { minutes: number; lessons: number; cards: number }>;
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

function getIntensity(dateKey: string, activityData: ActivityRecord): 0 | 1 | 2 | 3 | 4 {
  const activity = activityData[dateKey];
  if (!activity) return 0;
  if (activity.minutes < 10) return 1;
  if (activity.minutes < 25) return 2;
  if (activity.minutes < 45) return 3;
  return 4;
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

function calculateStreak(activityData: ActivityRecord): { current: number; longest: number; totalDays: number; totalMinutes: number } {
  const today = new Date();
  let current = 0;
  let longest = 0;
  let tempStreak = 0;
  let totalDays = 0;
  let totalMinutes = 0;
  for (let i = 0; i < 90; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const key = date.toISOString().split("T")[0];
    if (activityData[key]) {
      totalDays++;
      totalMinutes += activityData[key].minutes;
      if (i === 0 || tempStreak > 0) {
        tempStreak++;
        if (i < 2 || current === 0) current = tempStreak;
      } else {
        tempStreak = 1;
      }
      longest = Math.max(longest, tempStreak);
    } else {
      if (i === 0) current = 0;
      tempStreak = 0;
    }
  }
  return { current, longest, totalDays, totalMinutes };
}

export default function StreakCalendarScreen() {
  const router = useRouter();
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [activityData, setActivityData] = useState<ActivityRecord>({});

  useEffect(() => {
    loadActivityData();
  }, []);

  const loadActivityData = async () => {
    try {
      const log = await getPracticeLog();
      const data: ActivityRecord = {};
      for (const entry of log) {
        const key = new Date(entry.date).toISOString().split("T")[0];
        if (!data[key]) data[key] = { minutes: 0, lessons: 0, cards: 0 };
        data[key].minutes += (entry as any).durationMinutes || entry.minutesSpent || 0;
        data[key].lessons += 1;
        data[key].cards += (entry as any).cardsReviewed || 0;
      }
      setActivityData(data);
    } catch {
      // Fallback: try reading streak from AsyncStorage
      const streakStr = await AsyncStorage.getItem("@connectworld_streak");
      if (streakStr) {
        // At minimum show today as active
        const todayKey = new Date().toISOString().split("T")[0];
        setActivityData({ [todayKey]: { minutes: 10, lessons: 1, cards: 5 } });
      }
    }
  };

  const streakStats = useMemo(() => calculateStreak(activityData), [activityData]);

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDay = getFirstDayOfMonth(currentYear, currentMonth);

  const goToPrevMonth = () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
    setSelectedDate(null);
  };

  const goToNextMonth = () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
    setSelectedDate(null);
  };

  const isToday = (day: number) => {
    return day === today.getDate() && currentMonth === today.getMonth() && currentYear === today.getFullYear();
  };

  const calendarDays = useMemo(() => {
    const days: { day: number; dateKey: string }[] = [];
    for (let d = 1; d <= daysInMonth; d++) {
      const dateKey = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      days.push({ day: d, dateKey });
    }
    return days;
  }, [currentMonth, currentYear, daysInMonth]);

  const selectedActivity = selectedDate ? activityData[selectedDate] : null;

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Learning Streak</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Streak Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statEmoji}>🔥</Text>
            <Text style={styles.statNumber}>{streakStats.current}</Text>
            <Text style={styles.statLabel}>Current Streak</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statEmoji}>🏆</Text>
            <Text style={[styles.statNumber, { color: Colors.gold }]}>{streakStats.longest}</Text>
            <Text style={styles.statLabel}>Longest Streak</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statEmoji}>📅</Text>
            <Text style={styles.statNumber}>{streakStats.totalDays}</Text>
            <Text style={styles.statLabel}>Active Days</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statEmoji}>⏱️</Text>
            <Text style={styles.statNumber}>{Math.round(streakStats.totalMinutes / 60)}h</Text>
            <Text style={styles.statLabel}>Total Time</Text>
          </View>
        </View>

        {/* Month Navigation */}
        <View style={styles.monthNav}>
          <TouchableOpacity onPress={goToPrevMonth} style={styles.navBtn}>
            <Ionicons name="chevron-back" size={20} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.monthTitle}>{MONTHS[currentMonth]} {currentYear}</Text>
          <TouchableOpacity onPress={goToNextMonth} style={styles.navBtn}>
            <Ionicons name="chevron-forward" size={20} color={Colors.textPrimary} />
          </TouchableOpacity>
        </View>

        {/* Calendar Grid */}
        <View style={styles.calendarContainer}>
          {/* Weekday Headers */}
          <View style={styles.weekdayRow}>
            {WEEKDAYS.map((day) => (
              <Text key={day} style={styles.weekdayText}>{day}</Text>
            ))}
          </View>

          {/* Days Grid */}
          <View style={styles.daysGrid}>
            {/* Empty cells for offset */}
            {Array.from({ length: firstDay }, (_, i) => (
              <View key={`empty-${i}`} style={styles.dayCell} />
            ))}
            {/* Actual days */}
            {calendarDays.map(({ day, dateKey }) => {
              const intensity = getIntensity(dateKey, activityData);
              const selected = selectedDate === dateKey;
              return (
                <TouchableOpacity
                  key={dateKey}
                  style={[
                    styles.dayCell,
                    { backgroundColor: HEAT_COLORS[intensity] },
                    isToday(day) && styles.todayCell,
                    selected && styles.selectedCell,
                  ]}
                  onPress={() => {
                    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setSelectedDate(selected ? null : dateKey);
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={[
                    styles.dayText,
                    intensity > 0 && styles.activeDayText,
                    isToday(day) && styles.todayText,
                  ]}>
                    {day}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Legend */}
        <View style={styles.legend}>
          <Text style={styles.legendLabel}>Less</Text>
          {[0, 1, 2, 3, 4].map((level) => (
            <View key={level} style={[styles.legendBox, { backgroundColor: HEAT_COLORS[level as keyof typeof HEAT_COLORS] }]} />
          ))}
          <Text style={styles.legendLabel}>More</Text>
        </View>

        {/* Selected Day Detail */}
        {selectedDate && (
          <View style={styles.detailCard}>
            <Text style={styles.detailDate}>
              {new Date(selectedDate + "T12:00:00").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
            </Text>
            {selectedActivity ? (
              <View style={styles.detailStats}>
                <View style={styles.detailRow}>
                  <Ionicons name="time-outline" size={16} color={Colors.secondary} />
                  <Text style={styles.detailText}>{selectedActivity.minutes} minutes studied</Text>
                </View>
                <View style={styles.detailRow}>
                  <Ionicons name="book-outline" size={16} color={Colors.success} />
                  <Text style={styles.detailText}>{selectedActivity.lessons} lessons completed</Text>
                </View>
                <View style={styles.detailRow}>
                  <Ionicons name="layers-outline" size={16} color={Colors.gold} />
                  <Text style={styles.detailText}>{selectedActivity.cards} flashcards reviewed</Text>
                </View>
              </View>
            ) : (
              <View style={styles.detailStats}>
                <Text style={styles.noActivityText}>No activity on this day</Text>
              </View>
            )}
          </View>
        )}

        {/* Weekly Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>This Week</Text>
          <View style={styles.weekBars}>
            {WEEKDAYS.map((day, idx) => {
              const date = new Date(today);
              const currentDayOfWeek = today.getDay();
              date.setDate(date.getDate() - (currentDayOfWeek - idx));
              const key = date.toISOString().split("T")[0];
              const activity = activityData[key];
              const height = activity ? Math.min((activity.minutes / 60) * 100, 100) : 5;
              return (
                <View key={day} style={styles.barCol}>
                  <View style={styles.barContainer}>
                    <View style={[styles.bar, { height: `${height}%`, backgroundColor: activity ? Colors.secondary : "rgba(255,255,255,0.05)" }]} />
                  </View>
                  <Text style={[styles.barLabel, idx === currentDayOfWeek && { color: Colors.secondary, fontWeight: "700" }]}>{day[0]}</Text>
                </View>
              );
            })}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.primary },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.surface, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 18, fontWeight: "800", color: Colors.textPrimary },
  statsRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 10,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statEmoji: { fontSize: 20, marginBottom: 4 },
  statNumber: { fontSize: 18, fontWeight: "900", color: Colors.textPrimary },
  statLabel: { fontSize: 9, color: Colors.textMuted, marginTop: 2, fontWeight: "600", textAlign: "center" },
  monthNav: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  navBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.surface, alignItems: "center", justifyContent: "center" },
  monthTitle: { fontSize: 16, fontWeight: "800", color: Colors.textPrimary },
  calendarContainer: { paddingHorizontal: 16, marginBottom: 12 },
  weekdayRow: { flexDirection: "row", marginBottom: 8 },
  weekdayText: { flex: 1, textAlign: "center", fontSize: 11, fontWeight: "600", color: Colors.textMuted },
  daysGrid: { flexDirection: "row", flexWrap: "wrap" },
  dayCell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    marginBottom: 4,
  },
  todayCell: { borderWidth: 1.5, borderColor: Colors.secondary },
  selectedCell: { borderWidth: 2, borderColor: Colors.gold },
  dayText: { fontSize: 12, color: Colors.textMuted, fontWeight: "500" },
  activeDayText: { color: Colors.textPrimary, fontWeight: "700" },
  todayText: { color: Colors.secondary, fontWeight: "800" },
  legend: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    marginBottom: 20,
    paddingHorizontal: 16,
  },
  legendLabel: { fontSize: 10, color: Colors.textMuted, marginHorizontal: 4 },
  legendBox: { width: 14, height: 14, borderRadius: 3 },
  detailCard: {
    marginHorizontal: 16,
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  detailDate: { fontSize: 14, fontWeight: "700", color: Colors.textPrimary, marginBottom: 12 },
  detailStats: { gap: 8 },
  detailRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  detailText: { fontSize: 13, color: Colors.textSecondary },
  noActivityText: { fontSize: 13, color: Colors.textMuted, fontStyle: "italic" },
  section: { paddingHorizontal: 16, marginBottom: 20 },
  sectionTitle: { fontSize: 16, fontWeight: "800", color: Colors.textPrimary, marginBottom: 12 },
  weekBars: { flexDirection: "row", gap: 8, height: 120 },
  barCol: { flex: 1, alignItems: "center" },
  barContainer: { flex: 1, width: "100%", justifyContent: "flex-end", backgroundColor: "rgba(255,255,255,0.02)", borderRadius: 6, overflow: "hidden" },
  bar: { width: "100%", borderRadius: 6 },
  barLabel: { fontSize: 11, color: Colors.textMuted, marginTop: 6, fontWeight: "500" },
});
