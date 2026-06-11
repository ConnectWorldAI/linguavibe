/**
 * Daily XP Goal Settings — Set target XP and reminder time.
 */
import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Switch,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import {
  getDailyXPGoal,
  setDailyXPGoal,
  getDailyProgress,
  XP_GOAL_PRESETS,
  REMINDER_TIME_PRESETS,
  type DailyXPGoal,
  type DailyXPProgress,
} from "@/lib/daily-xp-goal";
import {
  getWeeklyDigestSettings,
  setWeeklyDigestSettings,
  DAY_NAMES,
  type WeeklyDigestSettings,
} from "@/lib/weekly-digest";
import {
  getWeeklyRecapSettings,
  saveWeeklyRecapSettings,
  type WeeklyRecapSettings,
} from "@/lib/weekly-recap";

export default function DailyXPGoalScreen() {
  const router = useRouter();
  const colors = useColors();
  const [goal, setGoal] = useState<DailyXPGoal | null>(null);
  const [progress, setProgress] = useState<DailyXPProgress | null>(null);
  const [selectedXP, setSelectedXP] = useState(10);
  const [selectedTime, setSelectedTime] = useState({ hour: 20, minute: 0 });
  const [isEnabled, setIsEnabled] = useState(false);
  const [digestSettings, setDigestSettings] = useState<WeeklyDigestSettings | null>(null);
  const [digestEnabled, setDigestEnabled] = useState(true);
  const [digestDay, setDigestDay] = useState(0);
  const [recapEnabled, setRecapEnabled] = useState(true);

  const loadData = useCallback(async () => {
    const currentGoal = await getDailyXPGoal();
    const currentProgress = await getDailyProgress();
    const digest = await getWeeklyDigestSettings();
    setGoal(currentGoal);
    setProgress(currentProgress);
    setSelectedXP(currentGoal.targetXP);
    setSelectedTime({ hour: currentGoal.reminderHour, minute: currentGoal.reminderMinute });
    setIsEnabled(currentGoal.isEnabled);
    setDigestSettings(digest);
    setDigestEnabled(digest.isEnabled);
    setDigestDay(digest.dayOfWeek);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSave = async () => {
    if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const newGoal: DailyXPGoal = {
      targetXP: selectedXP,
      reminderHour: selectedTime.hour,
      reminderMinute: selectedTime.minute,
      isEnabled,
    };
    await setDailyXPGoal(newGoal);
    setGoal(newGoal);
    router.back();
  };

  if (!goal || !progress) return null;

  const progressPercent = goal.targetXP > 0 ? Math.min(progress.earnedXP / goal.targetXP, 1) : 0;

  return (
    <ScreenContainer edges={["top", "left", "right"]}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 100 }}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => {
              if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.back();
            }}
            style={[styles.backBtn, { backgroundColor: colors.surface }]}
          >
            <Ionicons name="arrow-back" size={22} color={colors.foreground} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Daily XP Goal</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Today's Progress */}
        <View style={[styles.progressCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.progressTitle, { color: colors.foreground }]}>Today's Progress</Text>
          <View style={styles.progressRow}>
            <Text style={[styles.progressXP, { color: progress.goalMet ? "#22C55E" : colors.primary }]}>
              {progress.earnedXP} / {goal.targetXP} XP
            </Text>
            {progress.goalMet && <Ionicons name="checkmark-circle" size={20} color="#22C55E" />}
          </View>
          <View style={[styles.progressTrack, { backgroundColor: colors.border }]}>
            <View style={[styles.progressFill, {
              width: `${progressPercent * 100}%`,
              backgroundColor: progress.goalMet ? "#22C55E" : colors.primary,
            }]} />
          </View>
        </View>

        {/* XP Target Selection */}
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Daily Target</Text>
        <View style={styles.presetGrid}>
          {XP_GOAL_PRESETS.map((preset) => (
            <TouchableOpacity
              key={preset.xp}
              onPress={() => {
                if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setSelectedXP(preset.xp);
              }}
              style={[styles.presetCard, {
                backgroundColor: selectedXP === preset.xp ? colors.primary + "15" : colors.surface,
                borderColor: selectedXP === preset.xp ? colors.primary : colors.border,
              }]}
            >
              <Text style={[styles.presetXP, { color: selectedXP === preset.xp ? colors.primary : colors.foreground }]}>
                {preset.xp} XP
              </Text>
              <Text style={[styles.presetLabel, { color: selectedXP === preset.xp ? colors.primary : colors.muted }]}>
                {preset.label}
              </Text>
              <Text style={[styles.presetDesc, { color: colors.muted }]} numberOfLines={1}>
                {preset.description}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Reminder Toggle */}
        <View style={[styles.reminderSection, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.reminderHeader}>
            <View style={styles.reminderLeft}>
              <Ionicons name="notifications" size={20} color={colors.primary} />
              <Text style={[styles.reminderTitle, { color: colors.foreground }]}>Daily Reminder</Text>
            </View>
            <Switch
              value={isEnabled}
              onValueChange={(val) => {
                if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setIsEnabled(val);
              }}
              trackColor={{ false: colors.border, true: colors.primary + "60" }}
              thumbColor={isEnabled ? colors.primary : "#f4f3f4"}
            />
          </View>

          {isEnabled && (
            <View style={styles.timePresets}>
              {REMINDER_TIME_PRESETS.map((time) => (
                <TouchableOpacity
                  key={time.label}
                  onPress={() => {
                    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setSelectedTime({ hour: time.hour, minute: time.minute });
                  }}
                  style={[styles.timeChip, {
                    backgroundColor: selectedTime.hour === time.hour ? colors.primary + "15" : colors.background,
                    borderColor: selectedTime.hour === time.hour ? colors.primary : colors.border,
                  }]}
                >
                  <Text style={[styles.timeLabel, {
                    color: selectedTime.hour === time.hour ? colors.primary : colors.foreground,
                  }]}>
                    {time.label}
                  </Text>
                  <Text style={[styles.timeValue, { color: colors.muted }]}>
                    {time.hour > 12 ? time.hour - 12 : time.hour}:00 {time.hour >= 12 ? "PM" : "AM"}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Weekly Digest Section */}
        <View style={[styles.sectionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.sectionHeader}>
            <Ionicons name="newspaper" size={20} color={colors.primary} />
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Weekly Digest</Text>
          </View>
          <Text style={[styles.sectionDesc, { color: colors.muted }]}>
            Get a weekly notification summarizing your badges earned and XP progress.
          </Text>

          <View style={styles.toggleRow}>
            <Text style={[styles.toggleLabel, { color: colors.foreground }]}>Weekly Summary</Text>
            <Switch
              value={digestEnabled}
              onValueChange={async (val) => {
                setDigestEnabled(val);
                await setWeeklyDigestSettings({
                  isEnabled: val,
                  dayOfWeek: digestDay,
                  hour: 10,
                  minute: 0,
                });
              }}
              trackColor={{ false: colors.border, true: colors.primary + "60" }}
              thumbColor={digestEnabled ? colors.primary : colors.muted}
            />
          </View>

          {digestEnabled && (
            <View style={styles.dayRow}>
              {DAY_NAMES.map((day, idx) => (
                <TouchableOpacity
                  key={day}
                  style={[
                    styles.dayChip,
                    {
                      backgroundColor: digestDay === idx ? colors.primary : colors.background,
                      borderColor: digestDay === idx ? colors.primary : colors.border,
                    },
                  ]}
                  onPress={async () => {
                    setDigestDay(idx);
                    await setWeeklyDigestSettings({
                      isEnabled: true,
                      dayOfWeek: idx,
                      hour: 10,
                      minute: 0,
                    });
                    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
                >
                  <Text
                    style={[
                      styles.dayChipText,
                      { color: digestDay === idx ? "#FFF" : colors.muted },
                    ]}
                  >
                    {day.slice(0, 3)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Weekly Recap Section */}
        <View style={[styles.sectionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.sectionHeader}>
            <Ionicons name="bar-chart" size={20} color={colors.primary} />
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Sunday Recap</Text>
          </View>
          <Text style={[styles.sectionDesc, { color: colors.muted }]}>
            Get a push notification every Sunday summarizing your week: XP earned, goals met, streak status.
          </Text>

          <View style={styles.toggleRow}>
            <Text style={[styles.toggleLabel, { color: colors.foreground }]}>Weekly Recap</Text>
            <Switch
              value={recapEnabled}
              onValueChange={async (val) => {
                setRecapEnabled(val);
                await saveWeeklyRecapSettings({ enabled: val, hour: 18, minute: 0 });
              }}
              trackColor={{ false: colors.border, true: colors.primary + "60" }}
              thumbColor={recapEnabled ? colors.primary : colors.muted}
            />
          </View>
        </View>

        {/* Save Button */}
        <TouchableOpacity
          onPress={handleSave}
          style={[styles.saveButton, { backgroundColor: colors.primary }]}
        >
          <Ionicons name="checkmark" size={18} color="#FFF" />
          <Text style={styles.saveButtonText}>Save Goal</Text>
        </TouchableOpacity>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
  },
  progressCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    marginBottom: 24,
  },
  progressTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
  },
  progressRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
  },
  progressXP: {
    fontSize: 22,
    fontWeight: "700",
  },
  progressTrack: {
    height: 8,
    borderRadius: 4,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 12,
  },
  presetGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 24,
  },
  presetCard: {
    width: "48%",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    alignItems: "center",
  },
  presetXP: {
    fontSize: 20,
    fontWeight: "800",
  },
  presetLabel: {
    fontSize: 13,
    fontWeight: "600",
    marginTop: 4,
  },
  presetDesc: {
    fontSize: 11,
    marginTop: 4,
  },
  reminderSection: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    marginBottom: 24,
  },
  reminderHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  reminderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  reminderTitle: {
    fontSize: 15,
    fontWeight: "600",
  },
  timePresets: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 14,
  },
  timeChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
  },
  timeLabel: {
    fontSize: 13,
    fontWeight: "600",
  },
  timeValue: {
    fontSize: 11,
    marginTop: 2,
  },
  sectionCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  sectionDesc: {
    fontSize: 13,
    marginBottom: 14,
    lineHeight: 18,
  },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  toggleLabel: {
    fontSize: 15,
    fontWeight: "600",
  },
  dayRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 4,
  },
  dayChip: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  dayChipText: {
    fontSize: 12,
    fontWeight: "600",
  },
  saveButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
  },
  saveButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "700",
  },
});
