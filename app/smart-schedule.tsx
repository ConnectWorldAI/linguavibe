/**
 * Smart Schedule Screen
 * Analyzes calendar gaps and suggests optimal study blocks.
 * Shows contextual recommendations based on available time.
 */
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Switch,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { ScreenContainer } from "@/components/screen-container";
import {
  analyzeCalendarGaps,
  type SmartSchedule,
  type TimeSlot,
  formatTime,
  saveSmartSchedule,
} from "@/lib/accountability";
import { scheduleSmartReminders } from "@/lib/smart-schedule-reminders";

const { width } = Dimensions.get("window");

const Colors = {
  bg: "#0A0E1A",
  card: "#141B2D",
  cardBorder: "#1E293B",
  text: "#FFFFFF",
  textSecondary: "#94A3B8",
  textMuted: "#64748B",
  primary: "#00AAFF",
  warning: "#F59E0B",
  success: "#10B981",
  purple: "#8B5CF6",
  orange: "#F97316",
};

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export default function SmartScheduleScreen() {
  const [schedule, setSchedule] = useState<SmartSchedule | null>(null);
  const [enabledSlots, setEnabledSlots] = useState<Set<string>>(new Set());
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    generateSchedule();
  }, []);

  function generateSchedule() {
    // Simulate busy blocks from user's calendar
    // In production, these come from synced Apple/Google Calendar
    const busyBlocks = [
      { day: "Monday", startHour: 9, endHour: 17 },
      { day: "Monday", startHour: 18, endHour: 19 },
      { day: "Tuesday", startHour: 8, endHour: 12 },
      { day: "Tuesday", startHour: 14, endHour: 18 },
      { day: "Wednesday", startHour: 9, endHour: 17 },
      { day: "Wednesday", startHour: 19, endHour: 20 },
      { day: "Thursday", startHour: 9, endHour: 12 },
      { day: "Thursday", startHour: 13, endHour: 17 },
      { day: "Friday", startHour: 9, endHour: 15 },
      { day: "Saturday", startHour: 10, endHour: 12 },
      { day: "Sunday", startHour: 11, endHour: 13 },
    ];

    const result = analyzeCalendarGaps(busyBlocks, 7, 23, 30);
    setSchedule(result);

    // Enable all slots by default
    const allKeys = new Set(result.slots.map((s) => `${s.day}-${s.startHour}`));
    setEnabledSlots(allKeys);
  }

  function toggleSlot(slot: TimeSlot) {
    const key = `${slot.day}-${slot.startHour}`;
    const next = new Set(enabledSlots);
    if (next.has(key)) {
      next.delete(key);
    } else {
      next.add(key);
    }
    setEnabledSlots(next);
  }

  async function handleSave() {
    if (schedule) {
      const filtered: SmartSchedule = {
        ...schedule,
        slots: schedule.slots.filter((s) => enabledSlots.has(`${s.day}-${s.startHour}`)),
      };
      await saveSmartSchedule(filtered);
      // Schedule motivational push notifications at study times
      await scheduleSmartReminders();
      setSaved(true);
      setTimeout(() => router.back(), 1500);
    }
  }

  function getSlotColor(type: string) {
    switch (type) {
      case "long": return Colors.success;
      case "medium": return Colors.primary;
      case "short": return Colors.purple;
      default: return Colors.primary;
    }
  }

  function getSlotIcon(type: string) {
    switch (type) {
      case "long": return "book";
      case "medium": return "flash";
      case "short": return "card-outline";
      default: return "time";
    }
  }

  if (saved) {
    return (
      <ScreenContainer edges={["top", "bottom", "left", "right"]}>
        <View style={styles.savedContainer}>
          <Ionicons name="checkmark-circle" size={64} color={Colors.success} />
          <Text style={styles.savedTitle}>Schedule Saved!</Text>
          <Text style={styles.savedText}>
            You'll get reminders at your optimal study times.
          </Text>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer edges={["top", "left", "right"]}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Smart Schedule</Text>
          <View style={{ width: 36 }} />
        </View>

        {/* Intro */}
        <View style={styles.introCard}>
          <Ionicons name="sparkles" size={22} color={Colors.primary} />
          <View style={styles.introTextWrap}>
            <Text style={styles.introTitle}>AI-Optimized Study Times</Text>
            <Text style={styles.introDesc}>
              Based on your calendar, here are the best times to study. Morning slots are prioritized — research shows 23% better retention before noon.
            </Text>
          </View>
        </View>

        {/* Distribution Advice */}
        {schedule && (
          <View style={styles.adviceCard}>
            <Ionicons name="bulb-outline" size={18} color={Colors.warning} />
            <Text style={styles.adviceText}>{schedule.optimalDistribution}</Text>
          </View>
        )}

        {/* Weekly Overview */}
        <View style={styles.weekOverview}>
          <Text style={styles.sectionTitle}>Your Week</Text>
          <Text style={styles.weekTotal}>
            {schedule?.totalAvailableMinutes || 0} min available across {schedule?.slots.length || 0} slots
          </Text>
        </View>

        {/* Slot Cards by Day */}
        {DAYS.map((day) => {
          const daySlots = schedule?.slots.filter((s) => s.day === day) || [];
          if (daySlots.length === 0) return null;

          return (
            <View key={day} style={styles.daySection}>
              <Text style={styles.dayTitle}>{day}</Text>
              {daySlots.map((slot, idx) => {
                const key = `${slot.day}-${slot.startHour}`;
                const isEnabled = enabledSlots.has(key);
                const color = getSlotColor(slot.type);

                return (
                  <View key={idx} style={[styles.slotCard, !isEnabled && styles.slotCardDisabled]}>
                    <View style={styles.slotLeft}>
                      <View style={[styles.slotIconWrap, { backgroundColor: color + "20" }]}>
                        <Ionicons name={getSlotIcon(slot.type) as any} size={18} color={color} />
                      </View>
                      <View style={styles.slotInfo}>
                        <Text style={[styles.slotTime, !isEnabled && styles.slotTimeDisabled]}>
                          {formatTime(slot.startHour, slot.startMinute)}
                        </Text>
                        <Text style={styles.slotDuration}>{slot.durationMinutes} min</Text>
                        <Text style={styles.slotSuggestion}>{slot.suggestion}</Text>
                      </View>
                    </View>
                    <Switch
                      value={isEnabled}
                      onValueChange={() => toggleSlot(slot)}
                      trackColor={{ false: Colors.cardBorder, true: color + "60" }}
                      thumbColor={isEnabled ? color : Colors.textMuted}
                    />
                  </View>
                );
              })}
            </View>
          );
        })}

        {/* Legend */}
        <View style={styles.legend}>
          <Text style={styles.legendTitle}>Session Types</Text>
          <View style={styles.legendRow}>
            <View style={[styles.legendDot, { backgroundColor: Colors.success }]} />
            <Text style={styles.legendText}>Long (45 min) — Full lesson + practice</Text>
          </View>
          <View style={styles.legendRow}>
            <View style={[styles.legendDot, { backgroundColor: Colors.primary }]} />
            <Text style={styles.legendText}>Medium (25 min) — Vocab + quiz</Text>
          </View>
          <View style={styles.legendRow}>
            <View style={[styles.legendDot, { backgroundColor: Colors.purple }]} />
            <Text style={styles.legendText}>Short (15 min) — Flashcard review</Text>
          </View>
        </View>

        {/* Save Button */}
        <TouchableOpacity style={styles.saveBtn} onPress={handleSave} activeOpacity={0.8}>
          <Ionicons name="calendar-outline" size={20} color="#FFF" />
          <Text style={styles.saveBtnText}>Set Study Reminders</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.skipBtn} onPress={() => router.back()}>
          <Text style={styles.skipBtnText}>I'll manage my own schedule</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  content: { padding: 20 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.card,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.text,
  },

  introCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.primary + "30",
  },
  introTextWrap: { flex: 1 },
  introTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: 4,
  },
  introDesc: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 19,
  },

  adviceCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    backgroundColor: Colors.warning + "10",
    borderRadius: 10,
    padding: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.warning + "20",
  },
  adviceText: {
    flex: 1,
    fontSize: 13,
    color: Colors.warning,
    lineHeight: 18,
  },

  weekOverview: { marginBottom: 16 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.text,
  },
  weekTotal: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 4,
  },

  daySection: { marginBottom: 16 },
  dayTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.primary,
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  slotCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  slotCardDisabled: {
    opacity: 0.5,
  },
  slotLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  slotIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  slotInfo: { flex: 1 },
  slotTime: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.text,
  },
  slotTimeDisabled: {
    color: Colors.textMuted,
  },
  slotDuration: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  slotSuggestion: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
  },

  legend: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 14,
    marginTop: 8,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  legendTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.textSecondary,
    marginBottom: 10,
  },
  legendRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    fontSize: 12,
    color: Colors.textMuted,
  },

  saveBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 16,
  },
  saveBtnText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
  },

  skipBtn: {
    alignItems: "center",
    paddingVertical: 14,
    marginTop: 8,
  },
  skipBtnText: {
    fontSize: 14,
    color: Colors.textMuted,
  },

  savedContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
    backgroundColor: Colors.bg,
  },
  savedTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: Colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  savedText: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: "center",
  },
});
