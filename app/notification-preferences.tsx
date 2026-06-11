import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import { useNotificationScheduler } from "@/lib/notification-scheduler";
import {
  getDailyChallengeNotifPrefs,
  updateAndReschedule,
  formatNotifTime,
  type DailyChallengeNotifPrefs,
} from "@/lib/daily-challenge-notifications";

const HOURS = Array.from({ length: 24 }, (_, i) => i);

export default function NotificationPreferencesScreen() {
  const {
    preferences,
    permissionGranted,
    updatePreferences,
    updateStreakReminder,
    updateAssignmentDeadline,
    updateDailyGoal,
    updatePracticeReminder,
    requestPermission,
    scheduleStreakReminder,
  } = useNotificationScheduler();

  const [showTimePicker, setShowTimePicker] = useState<string | null>(null);
  const [dailyChallengePrefs, setDailyChallengePrefs] = useState<DailyChallengeNotifPrefs>({
    enabled: true, hour: 8, minute: 0, includeWordPreview: true, includeStreakInfo: true,
  });

  useEffect(() => {
    getDailyChallengeNotifPrefs().then(setDailyChallengePrefs);
  }, []);

  const handleDailyChallengeToggle = async (key: keyof DailyChallengeNotifPrefs, value: boolean) => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const updated = await updateAndReschedule({ [key]: value });
    setDailyChallengePrefs(updated);
  };

  const handleDailyChallengeTime = async (hour: number) => {
    const updated = await updateAndReschedule({ hour, minute: 0 });
    setDailyChallengePrefs(updated);
    setShowTimePicker(null);
  };

  const handleToggle = async (key: string, value: boolean) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    switch (key) {
      case "enabled":
        await updatePreferences({ enabled: value });
        break;
      case "streak":
        await updateStreakReminder({ enabled: value });
        break;
      case "assignment":
        await updateAssignmentDeadline({ enabled: value });
        break;
      case "connection":
        await updatePreferences({
          connectionRequests: { ...preferences.connectionRequests, enabled: value },
        });
        break;
      case "dailyGoal":
        await updateDailyGoal({ enabled: value });
        break;
      case "practice":
        await updatePracticeReminder({ enabled: value });
        break;
    }
  };

  const handleRequestPermission = async () => {
    const granted = await requestPermission();
    if (granted) {
      await scheduleStreakReminder();
    }
  };

  const formatTime = (hour: number, minute: number) => {
    const period = hour >= 12 ? "PM" : "AM";
    const h = hour % 12 || 12;
    return `${h}:${minute.toString().padStart(2, "0")} ${period}`;
  };

  const handleTimeSelect = async (key: string, hour: number) => {
    switch (key) {
      case "streak":
        await updateStreakReminder({ hour, minute: 0 });
        break;
      case "dailyGoal":
        await updateDailyGoal({ hour, minute: 0 });
        break;
      case "practice":
        await updatePracticeReminder({ hour, minute: 0 });
        break;
    }
    setShowTimePicker(null);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notification Settings</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Permission Banner */}
        {!permissionGranted && (
          <TouchableOpacity style={styles.permissionBanner} onPress={handleRequestPermission}>
            <Ionicons name="notifications-off" size={24} color="#F59E0B" />
            <View style={{ flex: 1 }}>
              <Text style={styles.permissionTitle}>Notifications Disabled</Text>
              <Text style={styles.permissionDesc}>
                Tap to enable notifications for reminders and alerts
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
          </TouchableOpacity>
        )}

        {/* Master Toggle */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="notifications" size={20} color="#00AAFF" />
            <Text style={styles.sectionTitle}>All Notifications</Text>
          </View>
          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <Text style={styles.rowTitle}>Enable Notifications</Text>
              <Text style={styles.rowDesc}>Master toggle for all notification types</Text>
            </View>
            <Switch
              value={preferences.enabled}
              onValueChange={(v) => handleToggle("enabled", v)}
              trackColor={{ false: "#334155", true: "#00AAFF40" }}
              thumbColor={preferences.enabled ? "#00AAFF" : "#64748B"}
            />
          </View>
        </View>

        {/* Streak Reminder */}
        <View style={[styles.section, !preferences.enabled && styles.sectionDisabled]}>
          <View style={styles.sectionHeader}>
            <Ionicons name="flame" size={20} color="#F97316" />
            <Text style={styles.sectionTitle}>Streak Reminder</Text>
          </View>
          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <Text style={styles.rowTitle}>Daily Streak Alert</Text>
              <Text style={styles.rowDesc}>Remind you to practice before losing your streak</Text>
            </View>
            <Switch
              value={preferences.streakReminder.enabled}
              onValueChange={(v) => handleToggle("streak", v)}
              trackColor={{ false: "#334155", true: "#F9731640" }}
              thumbColor={preferences.streakReminder.enabled ? "#F97316" : "#64748B"}
              disabled={!preferences.enabled}
            />
          </View>
          {preferences.streakReminder.enabled && (
            <TouchableOpacity
              style={styles.timeRow}
              onPress={() => setShowTimePicker(showTimePicker === "streak" ? null : "streak")}
            >
              <Ionicons name="time-outline" size={16} color="#94A3B8" />
              <Text style={styles.timeLabel}>Remind at</Text>
              <Text style={styles.timeValue}>
                {formatTime(preferences.streakReminder.hour, preferences.streakReminder.minute)}
              </Text>
              <Ionicons name={showTimePicker === "streak" ? "chevron-up" : "chevron-down"} size={14} color="#64748B" />
            </TouchableOpacity>
          )}
          {showTimePicker === "streak" && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.timePicker}>
              {HOURS.map((h) => (
                <TouchableOpacity
                  key={h}
                  style={[styles.timeChip, h === preferences.streakReminder.hour && styles.timeChipActive]}
                  onPress={() => handleTimeSelect("streak", h)}
                >
                  <Text style={[styles.timeChipText, h === preferences.streakReminder.hour && styles.timeChipTextActive]}>
                    {formatTime(h, 0)}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>

        {/* Assignment Deadlines */}
        <View style={[styles.section, !preferences.enabled && styles.sectionDisabled]}>
          <View style={styles.sectionHeader}>
            <Ionicons name="school" size={20} color="#8B5CF6" />
            <Text style={styles.sectionTitle}>Assignment Deadlines</Text>
          </View>
          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <Text style={styles.rowTitle}>Deadline Alerts</Text>
              <Text style={styles.rowDesc}>Get notified before assignments are due</Text>
            </View>
            <Switch
              value={preferences.assignmentDeadline.enabled}
              onValueChange={(v) => handleToggle("assignment", v)}
              trackColor={{ false: "#334155", true: "#8B5CF640" }}
              thumbColor={preferences.assignmentDeadline.enabled ? "#8B5CF6" : "#64748B"}
              disabled={!preferences.enabled}
            />
          </View>
          {preferences.assignmentDeadline.enabled && (
            <View style={styles.infoRow}>
              <Ionicons name="information-circle-outline" size={14} color="#64748B" />
              <Text style={styles.infoText}>
                Notifies {preferences.assignmentDeadline.minutesBefore} minutes before deadline
              </Text>
            </View>
          )}
        </View>

        {/* Connection Requests */}
        <View style={[styles.section, !preferences.enabled && styles.sectionDisabled]}>
          <View style={styles.sectionHeader}>
            <Ionicons name="people" size={20} color="#22C55E" />
            <Text style={styles.sectionTitle}>Connection Requests</Text>
          </View>
          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <Text style={styles.rowTitle}>New Requests</Text>
              <Text style={styles.rowDesc}>When someone wants to practice with you</Text>
            </View>
            <Switch
              value={preferences.connectionRequests.enabled}
              onValueChange={(v) => handleToggle("connection", v)}
              trackColor={{ false: "#334155", true: "#22C55E40" }}
              thumbColor={preferences.connectionRequests.enabled ? "#22C55E" : "#64748B"}
              disabled={!preferences.enabled}
            />
          </View>
        </View>

        {/* Daily Goal */}
        <View style={[styles.section, !preferences.enabled && styles.sectionDisabled]}>
          <View style={styles.sectionHeader}>
            <Ionicons name="trophy" size={20} color="#EAB308" />
            <Text style={styles.sectionTitle}>Daily Goal</Text>
          </View>
          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <Text style={styles.rowTitle}>Morning Motivation</Text>
              <Text style={styles.rowDesc}>Start your day with a learning reminder</Text>
            </View>
            <Switch
              value={preferences.dailyGoal.enabled}
              onValueChange={(v) => handleToggle("dailyGoal", v)}
              trackColor={{ false: "#334155", true: "#EAB30840" }}
              thumbColor={preferences.dailyGoal.enabled ? "#EAB308" : "#64748B"}
              disabled={!preferences.enabled}
            />
          </View>
          {preferences.dailyGoal.enabled && (
            <TouchableOpacity
              style={styles.timeRow}
              onPress={() => setShowTimePicker(showTimePicker === "dailyGoal" ? null : "dailyGoal")}
            >
              <Ionicons name="time-outline" size={16} color="#94A3B8" />
              <Text style={styles.timeLabel}>Remind at</Text>
              <Text style={styles.timeValue}>
                {formatTime(preferences.dailyGoal.hour, preferences.dailyGoal.minute)}
              </Text>
              <Ionicons name={showTimePicker === "dailyGoal" ? "chevron-up" : "chevron-down"} size={14} color="#64748B" />
            </TouchableOpacity>
          )}
          {showTimePicker === "dailyGoal" && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.timePicker}>
              {HOURS.map((h) => (
                <TouchableOpacity
                  key={h}
                  style={[styles.timeChip, h === preferences.dailyGoal.hour && styles.timeChipActive]}
                  onPress={() => handleTimeSelect("dailyGoal", h)}
                >
                  <Text style={[styles.timeChipText, h === preferences.dailyGoal.hour && styles.timeChipTextActive]}>
                    {formatTime(h, 0)}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>

        {/* Daily Challenge Notification */}
        <View style={[styles.section, !preferences.enabled && styles.sectionDisabled]}>
          <View style={styles.sectionHeader}>
            <Ionicons name="today" size={20} color="#FFD700" />
            <Text style={styles.sectionTitle}>Daily Challenge</Text>
          </View>
          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <Text style={styles.rowTitle}>Word of the Day</Text>
              <Text style={styles.rowDesc}>Get notified about the daily pronunciation challenge</Text>
            </View>
            <Switch
              value={dailyChallengePrefs.enabled}
              onValueChange={(v) => handleDailyChallengeToggle("enabled", v)}
              trackColor={{ false: "#334155", true: "#FFD70040" }}
              thumbColor={dailyChallengePrefs.enabled ? "#FFD700" : "#64748B"}
              disabled={!preferences.enabled}
            />
          </View>
          {dailyChallengePrefs.enabled && (
            <>
              <View style={styles.row}>
                <View style={styles.rowLeft}>
                  <Text style={styles.rowTitle}>Show Word Preview</Text>
                  <Text style={styles.rowDesc}>Include today's word in the notification</Text>
                </View>
                <Switch
                  value={dailyChallengePrefs.includeWordPreview}
                  onValueChange={(v) => handleDailyChallengeToggle("includeWordPreview", v)}
                  trackColor={{ false: "#334155", true: "#FFD70040" }}
                  thumbColor={dailyChallengePrefs.includeWordPreview ? "#FFD700" : "#64748B"}
                  disabled={!preferences.enabled}
                />
              </View>
              <View style={styles.row}>
                <View style={styles.rowLeft}>
                  <Text style={styles.rowTitle}>Streak Info</Text>
                  <Text style={styles.rowDesc}>Show your current daily streak count</Text>
                </View>
                <Switch
                  value={dailyChallengePrefs.includeStreakInfo}
                  onValueChange={(v) => handleDailyChallengeToggle("includeStreakInfo", v)}
                  trackColor={{ false: "#334155", true: "#FFD70040" }}
                  thumbColor={dailyChallengePrefs.includeStreakInfo ? "#FFD700" : "#64748B"}
                  disabled={!preferences.enabled}
                />
              </View>
              <TouchableOpacity
                style={styles.timeRow}
                onPress={() => setShowTimePicker(showTimePicker === "dailyChallenge" ? null : "dailyChallenge")}
              >
                <Ionicons name="time-outline" size={16} color="#94A3B8" />
                <Text style={styles.timeLabel}>Remind at</Text>
                <Text style={styles.timeValue}>
                  {formatNotifTime(dailyChallengePrefs.hour, dailyChallengePrefs.minute)}
                </Text>
                <Ionicons name={showTimePicker === "dailyChallenge" ? "chevron-up" : "chevron-down"} size={14} color="#64748B" />
              </TouchableOpacity>
              {showTimePicker === "dailyChallenge" && (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.timePicker}>
                  {HOURS.map((h) => (
                    <TouchableOpacity
                      key={h}
                      style={[styles.timeChip, h === dailyChallengePrefs.hour && styles.timeChipActive]}
                      onPress={() => handleDailyChallengeTime(h)}
                    >
                      <Text style={[styles.timeChipText, h === dailyChallengePrefs.hour && styles.timeChipTextActive]}>
                        {formatNotifTime(h, 0)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}
            </>
          )}
        </View>

        {/* Practice Reminder */}
        <View style={[styles.section, !preferences.enabled && styles.sectionDisabled]}>
          <View style={styles.sectionHeader}>
            <Ionicons name="mic" size={20} color="#EC4899" />
            <Text style={styles.sectionTitle}>Practice Reminder</Text>
          </View>
          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <Text style={styles.rowTitle}>Afternoon Practice</Text>
              <Text style={styles.rowDesc}>Remind you to do a speaking exercise</Text>
            </View>
            <Switch
              value={preferences.practiceReminder.enabled}
              onValueChange={(v) => handleToggle("practice", v)}
              trackColor={{ false: "#334155", true: "#EC489940" }}
              thumbColor={preferences.practiceReminder.enabled ? "#EC4899" : "#64748B"}
              disabled={!preferences.enabled}
            />
          </View>
          {preferences.practiceReminder.enabled && (
            <TouchableOpacity
              style={styles.timeRow}
              onPress={() => setShowTimePicker(showTimePicker === "practice" ? null : "practice")}
            >
              <Ionicons name="time-outline" size={16} color="#94A3B8" />
              <Text style={styles.timeLabel}>Remind at</Text>
              <Text style={styles.timeValue}>
                {formatTime(preferences.practiceReminder.hour, preferences.practiceReminder.minute)}
              </Text>
              <Ionicons name={showTimePicker === "practice" ? "chevron-up" : "chevron-down"} size={14} color="#64748B" />
            </TouchableOpacity>
          )}
          {showTimePicker === "practice" && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.timePicker}>
              {HOURS.map((h) => (
                <TouchableOpacity
                  key={h}
                  style={[styles.timeChip, h === preferences.practiceReminder.hour && styles.timeChipActive]}
                  onPress={() => handleTimeSelect("practice", h)}
                >
                  <Text style={[styles.timeChipText, h === preferences.practiceReminder.hour && styles.timeChipTextActive]}>
                    {formatTime(h, 0)}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>

        {/* Challenge Notifications */}
        <View style={[styles.section, !preferences.enabled && styles.sectionDisabled]}>
          <View style={styles.sectionHeader}>
            <Ionicons name="flash" size={20} color="#8B5CF6" />
            <Text style={styles.sectionTitle}>Challenge Alerts</Text>
          </View>
          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <Text style={styles.rowTitle}>Friend Challenges</Text>
              <Text style={styles.rowDesc}>When a friend sends you a grammar challenge</Text>
            </View>
            <Switch
              value={preferences.connectionRequests.enabled}
              onValueChange={(v) => handleToggle("connection", v)}
              trackColor={{ false: "#334155", true: "#8B5CF640" }}
              thumbColor={preferences.connectionRequests.enabled ? "#8B5CF6" : "#64748B"}
              disabled={!preferences.enabled}
            />
          </View>
        </View>

        {/* Weekly Report */}
        <View style={[styles.section, !preferences.enabled && styles.sectionDisabled]}>
          <View style={styles.sectionHeader}>
            <Ionicons name="bar-chart" size={20} color="#06B6D4" />
            <Text style={styles.sectionTitle}>Weekly Report</Text>
          </View>
          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <Text style={styles.rowTitle}>Progress Summary</Text>
              <Text style={styles.rowDesc}>Weekly grammar progress and improvement trends</Text>
            </View>
            <Switch
              value={preferences.weeklyRecap.enabled}
              onValueChange={(v) => updatePreferences({ weeklyRecap: { ...preferences.weeklyRecap, enabled: v } })}
              trackColor={{ false: "#334155", true: "#06B6D440" }}
              thumbColor={preferences.weeklyRecap.enabled ? "#06B6D4" : "#64748B"}
              disabled={!preferences.enabled}
            />
          </View>
          {preferences.weeklyRecap.enabled && (
            <View style={styles.infoRow}>
              <Ionicons name="information-circle-outline" size={14} color="#64748B" />
              <Text style={styles.infoText}>
                Delivered every Sunday at 10:00 AM
              </Text>
            </View>
          )}
        </View>

        {/* DND Link */}
        <TouchableOpacity
          style={styles.dndLink}
          onPress={() => router.push("/do-not-disturb" as any)}
        >
          <View style={styles.dndLinkLeft}>
            <Ionicons name="moon" size={20} color="#6366F1" />
            <View>
              <Text style={styles.dndLinkTitle}>Do Not Disturb</Text>
              <Text style={styles.dndLinkDesc}>Silence all notifications during study sessions</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#64748B" />
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#060912" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0, 170, 255, 0.1)",
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.05)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#fff" },
  scrollContent: { paddingBottom: 40 },
  permissionBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    borderRadius: 14,
    backgroundColor: "rgba(245, 158, 11, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(245, 158, 11, 0.3)",
  },
  permissionTitle: { fontSize: 14, fontWeight: "700", color: "#F59E0B" },
  permissionDesc: { fontSize: 12, color: "#94A3B8", marginTop: 2 },
  section: {
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.03)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  sectionDisabled: { opacity: 0.4 },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 15, fontWeight: "700", color: "#fff" },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  rowLeft: { flex: 1, marginRight: 12 },
  rowTitle: { fontSize: 14, fontWeight: "600", color: "#E2E8F0" },
  rowDesc: { fontSize: 12, color: "#64748B", marginTop: 2 },
  timeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.06)",
  },
  timeLabel: { fontSize: 13, color: "#94A3B8", flex: 1 },
  timeValue: { fontSize: 13, fontWeight: "600", color: "#00AAFF" },
  timePicker: {
    marginTop: 10,
    paddingVertical: 4,
  },
  timeChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.05)",
    marginRight: 6,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  timeChipActive: {
    backgroundColor: "rgba(0, 170, 255, 0.2)",
    borderColor: "#00AAFF",
  },
  timeChipText: { fontSize: 12, color: "#94A3B8" },
  timeChipTextActive: { color: "#fff", fontWeight: "600" },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.06)",
  },
  infoText: { fontSize: 12, color: "#64748B" },
  dndLink: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginHorizontal: 16,
    marginTop: 20,
    padding: 16,
    borderRadius: 14,
    backgroundColor: "rgba(99, 102, 241, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(99, 102, 241, 0.2)",
  },
  dndLinkLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  dndLinkTitle: { fontSize: 14, fontWeight: "700", color: "#A5B4FC" },
  dndLinkDesc: { fontSize: 12, color: "#64748B", marginTop: 2 },
});
