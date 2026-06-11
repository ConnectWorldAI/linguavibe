import React, { useState, useEffect, useCallback } from "react";
import {
  getAchievementDigestPrefs,
  updateAndRescheduleDigest,
  formatDigestDay,
  formatDigestTime,
  type AchievementDigestPrefs,
} from "@/lib/achievement-digest-notification";
import {
  getStreakNotificationSettings,
  scheduleStreakReminder,
  cancelStreakReminder,
  REMINDER_TIMES,
  type StreakNotificationSettings,
} from "@/lib/streak-notifications";
import {
  getCreatorContentNotifPrefs,
  saveCreatorContentNotifPrefs,
  cancelCreatorContentAlerts,
  type CreatorContentNotifPrefs,
} from "@/lib/creator-content-notifications";
import {
  getJournalPromptNotifPrefs,
  saveJournalPromptNotifPrefs,
  scheduleJournalPromptNotification,
  cancelJournalPromptNotification,
  type JournalPromptNotifPrefs,
} from "@/lib/journal-prompt-notification";
import {
  getEngagementPrefs,
  updateEngagementPrefs,
  type EngagementPreferences,
} from "@/lib/engagement-notifications";
import {
  toggleWeeklyNotification,
  isWeeklyNotificationEnabled,
} from "@/lib/weekly-progress-notification";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import { Colors, Spacing, BorderRadius, FontSize } from "../constants/Colors";

// ─── Types ───────────────────────────────────────────────────────────────────
type NotificationChannel = {
  id: string;
  title: string;
  description: string;
  icon: string;
  enabled: boolean;
};

type ReminderTiming = "5min" | "15min" | "30min" | "1hr" | "1day";

// ─── Component ───────────────────────────────────────────────────────────────
export default function NotificationSettingsScreen() {
  // Push notifications
  const [pushEnabled, setPushEnabled] = useState(true);
  const [channels, setChannels] = useState<NotificationChannel[]>([
    { id: "class", title: "Class Reminders", description: "Upcoming live classes and sessions", icon: "school", enabled: true },
    { id: "quiz", title: "Quiz & Test Alerts", description: "When a new quiz is available or due", icon: "checkmark-circle", enabled: true },
    { id: "studio", title: "Practice Reminders", description: "Daily pronunciation and speaking drills", icon: "mic", enabled: true },
    { id: "streak", title: "Streak Protection", description: "Don't lose your streak!", icon: "flame", enabled: true },
    { id: "social", title: "Social & Messages", description: "Friend requests, messages, calls", icon: "chatbubbles", enabled: true },
    { id: "progress", title: "Progress Updates", description: "Weekly recaps and milestone alerts", icon: "trending-up", enabled: false },
    { id: "promo", title: "Tips & Offers", description: "Learning tips and special offers", icon: "gift", enabled: false },
  ]);

  // ─── Learning Notification Triggers ──────────────────────────────────────
  const [streakNotifEnabled, setStreakNotifEnabled] = useState(true);
  const [streakNotifHour, setStreakNotifHour] = useState(9);
  const [streakNotifMinute, setStreakNotifMinute] = useState(0);
  const [creatorNotifEnabled, setCreatorNotifEnabled] = useState(true);
  const [creatorFollowedOnly, setCreatorFollowedOnly] = useState(false);
  const [journalNotifEnabled, setJournalNotifEnabled] = useState(true);
  const [journalNotifHour, setJournalNotifHour] = useState(9);
  const [weeklyReportEnabled, setWeeklyReportEnabled] = useState(false);
  const [engagementStreakEnabled, setEngagementStreakEnabled] = useState(true);
  const [engagementMusicEnabled, setEngagementMusicEnabled] = useState(true);
  const [engagementMilestoneEnabled, setEngagementMilestoneEnabled] = useState(true);
  const [engagementReEngageEnabled, setEngagementReEngageEnabled] = useState(true);

  // SMS fallback
  const [smsEnabled, setSmsEnabled] = useState(false);
  const [smsForClasses, setSmsForClasses] = useState(true);
  const [smsForQuizzes, setSmsForQuizzes] = useState(false);
  const [smsForStreak, setSmsForStreak] = useState(true);

  // Calendar integration
  const [calendarSync, setCalendarSync] = useState(false);
  const [calendarType, setCalendarType] = useState<"apple" | "google" | "none">("none");
  const [autoAddClasses, setAutoAddClasses] = useState(true);
  const [autoAddTests, setAutoAddTests] = useState(true);
  const [showBusyTimes, setShowBusyTimes] = useState(false);

  // Alarm/reminder timing
  const [classReminder, setClassReminder] = useState<ReminderTiming>("15min");
  const [testReminder, setTestReminder] = useState<ReminderTiming>("1hr");
  const [practiceReminder, setPracticeReminder] = useState<ReminderTiming>("30min");

  // Alarm sounds
  const [alarmSound, setAlarmSound] = useState("default");
  const [vibration, setVibration] = useState(true);

  // Achievement digest
  const [digestEnabled, setDigestEnabled] = useState(true);
  const [digestDay, setDigestDay] = useState(1); // Sunday
  const [digestHour, setDigestHour] = useState(11);

  useEffect(() => {
    (async () => {
      const prefs = await getAchievementDigestPrefs();
      setDigestEnabled(prefs.enabled);
      setDigestDay(prefs.dayOfWeek);
      setDigestHour(prefs.hour);

      // Load learning notification trigger prefs
      const weeklyEnabled = await isWeeklyNotificationEnabled();
      setWeeklyReportEnabled(weeklyEnabled);

      const streakPrefs = await getStreakNotificationSettings();
      setStreakNotifEnabled(streakPrefs.enabled);
      setStreakNotifHour(streakPrefs.hour);
      setStreakNotifMinute(streakPrefs.minute);

      const creatorPrefs = await getCreatorContentNotifPrefs();
      setCreatorNotifEnabled(creatorPrefs.enabled);
      setCreatorFollowedOnly(creatorPrefs.followedOnly);

      const journalPrefs = await getJournalPromptNotifPrefs();
      setJournalNotifEnabled(journalPrefs.enabled);
      setJournalNotifHour(journalPrefs.hour);

      const engPrefs = await getEngagementPrefs();
      setEngagementStreakEnabled(engPrefs.streakReminders);
      setEngagementMusicEnabled(engPrefs.musicAlerts);
      setEngagementMilestoneEnabled(engPrefs.milestoneAlerts);
      setEngagementReEngageEnabled(engPrefs.reEngagement);
    })();
  }, []);

  // ─── Learning Trigger Handlers ──────────────────────────────────────────
  const handleStreakNotifToggle = useCallback(async (val: boolean) => {
    setStreakNotifEnabled(val);
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (val) {
      await scheduleStreakReminder({ enabled: true, hour: streakNotifHour, minute: streakNotifMinute });
    } else {
      await cancelStreakReminder();
    }
  }, [streakNotifHour, streakNotifMinute]);

  const handleStreakTimeChange = useCallback(async (hour: number, minute: number) => {
    setStreakNotifHour(hour);
    setStreakNotifMinute(minute);
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (streakNotifEnabled) {
      await scheduleStreakReminder({ enabled: true, hour, minute });
    }
  }, [streakNotifEnabled]);

  const handleCreatorNotifToggle = useCallback(async (val: boolean) => {
    setCreatorNotifEnabled(val);
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await saveCreatorContentNotifPrefs({ enabled: val });
    if (!val) await cancelCreatorContentAlerts();
  }, []);

  const handleCreatorFollowedOnlyToggle = useCallback(async (val: boolean) => {
    setCreatorFollowedOnly(val);
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await saveCreatorContentNotifPrefs({ followedOnly: val });
  }, []);

  const handleJournalNotifToggle = useCallback(async (val: boolean) => {
    setJournalNotifEnabled(val);
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await saveJournalPromptNotifPrefs({ enabled: val });
    if (val) {
      await scheduleJournalPromptNotification();
    } else {
      await cancelJournalPromptNotification();
    }
  }, []);

  const handleJournalTimeChange = useCallback(async (hour: number) => {
    setJournalNotifHour(hour);
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await saveJournalPromptNotifPrefs({ hour });
    if (journalNotifEnabled) {
      await scheduleJournalPromptNotification();
    }
  }, [journalNotifEnabled]);

  const handleEngagementToggle = useCallback(async (key: keyof EngagementPreferences, val: boolean) => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    switch (key) {
      case "streakReminders": setEngagementStreakEnabled(val); break;
      case "musicAlerts": setEngagementMusicEnabled(val); break;
      case "milestoneAlerts": setEngagementMilestoneEnabled(val); break;
      case "reEngagement": setEngagementReEngageEnabled(val); break;
    }
    await updateEngagementPrefs({ [key]: val });
  }, []);

  const handleDigestToggle = async (val: boolean) => {
    setDigestEnabled(val);
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await updateAndRescheduleDigest({ enabled: val });
  };

  const handleDigestDayChange = async (day: number) => {
    setDigestDay(day);
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await updateAndRescheduleDigest({ dayOfWeek: day });
  };

  const handleDigestTimeChange = async (hour: number) => {
    setDigestHour(hour);
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await updateAndRescheduleDigest({ hour });
  };

  const toggleChannel = (id: string) => {
    setChannels((prev) =>
      prev.map((c) => (c.id === id ? { ...c, enabled: !c.enabled } : c))
    );
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const DIGEST_DAYS = [
    { value: 1, label: "Sun" },
    { value: 2, label: "Mon" },
    { value: 3, label: "Tue" },
    { value: 4, label: "Wed" },
    { value: 5, label: "Thu" },
    { value: 6, label: "Fri" },
    { value: 7, label: "Sat" },
  ];

  const DIGEST_TIMES = [
    { value: 8, label: "8 AM" },
    { value: 9, label: "9 AM" },
    { value: 10, label: "10 AM" },
    { value: 11, label: "11 AM" },
    { value: 12, label: "12 PM" },
    { value: 14, label: "2 PM" },
    { value: 17, label: "5 PM" },
    { value: 20, label: "8 PM" },
  ];

  const TIMING_OPTIONS: { key: ReminderTiming; label: string }[] = [
    { key: "5min", label: "5 min" },
    { key: "15min", label: "15 min" },
    { key: "30min", label: "30 min" },
    { key: "1hr", label: "1 hour" },
    { key: "1day", label: "1 day" },
  ];

  const SOUND_OPTIONS = [
    { key: "default", label: "Default", icon: "notifications" },
    { key: "chime", label: "Chime", icon: "musical-note" },
    { key: "bell", label: "Bell", icon: "notifications-circle" },
    { key: "gentle", label: "Gentle", icon: "leaf" },
    { key: "urgent", label: "Urgent", icon: "alert-circle" },
  ];

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        {/* ─── Push Notifications ─────────────────────────────────────── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIcon}>
              <Ionicons name="notifications" size={18} color={Colors.secondary} />
            </View>
            <Text style={styles.sectionTitle}>Push Notifications</Text>
            <Switch
              value={pushEnabled}
              onValueChange={setPushEnabled}
              trackColor={{ false: Colors.border, true: Colors.secondary }}
              thumbColor="#FFFFFF"
            />
          </View>

          {pushEnabled && (
            <View style={styles.channelList}>
              {channels.map((channel) => (
                <TouchableOpacity
                  key={channel.id}
                  style={styles.channelRow}
                  onPress={() => toggleChannel(channel.id)}
                  activeOpacity={0.7}
                >
                  <View style={styles.channelLeft}>
                    <Ionicons name={channel.icon as any} size={18} color={channel.enabled ? Colors.secondary : Colors.textMuted} />
                    <View>
                      <Text style={styles.channelTitle}>{channel.title}</Text>
                      <Text style={styles.channelDesc}>{channel.description}</Text>
                    </View>
                  </View>
                  <Switch
                    value={channel.enabled}
                    onValueChange={() => toggleChannel(channel.id)}
                    trackColor={{ false: Colors.border, true: Colors.secondary }}
                    thumbColor="#FFFFFF"
                  />
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* ─── SMS Fallback (DoorDash-style) ──────────────────────────── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIcon, { backgroundColor: Colors.success + "15" }]}>
              <Ionicons name="chatbox-ellipses" size={18} color={Colors.success} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.sectionTitle}>SMS Text Alerts</Text>
              <Text style={styles.sectionSub}>Get texts when you miss push notifications</Text>
            </View>
            <Switch
              value={smsEnabled}
              onValueChange={setSmsEnabled}
              trackColor={{ false: Colors.border, true: Colors.success }}
              thumbColor="#FFFFFF"
            />
          </View>

          {smsEnabled && (
            <View style={styles.subOptions}>
              <View style={styles.subRow}>
                <Text style={styles.subRowText}>Class starting soon</Text>
                <Switch value={smsForClasses} onValueChange={setSmsForClasses} trackColor={{ false: Colors.border, true: Colors.success }} thumbColor="#FFFFFF" />
              </View>
              <View style={styles.subRow}>
                <Text style={styles.subRowText}>Quiz/test due</Text>
                <Switch value={smsForQuizzes} onValueChange={setSmsForQuizzes} trackColor={{ false: Colors.border, true: Colors.success }} thumbColor="#FFFFFF" />
              </View>
              <View style={styles.subRow}>
                <Text style={styles.subRowText}>Streak about to break</Text>
                <Switch value={smsForStreak} onValueChange={setSmsForStreak} trackColor={{ false: Colors.border, true: Colors.success }} thumbColor="#FFFFFF" />
              </View>
              <Text style={styles.smsNote}>
                Standard messaging rates may apply. You can turn this off anytime.
              </Text>
            </View>
          )}
        </View>

        {/* ─── Calendar Integration ───────────────────────────────────── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIcon, { backgroundColor: Colors.gold + "15" }]}>
              <Ionicons name="calendar" size={18} color={Colors.gold} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.sectionTitle}>Calendar Sync</Text>
              <Text style={styles.sectionSub}>Integrate with Apple/Google Calendar</Text>
            </View>
            <Switch
              value={calendarSync}
              onValueChange={setCalendarSync}
              trackColor={{ false: Colors.border, true: Colors.gold }}
              thumbColor="#FFFFFF"
            />
          </View>

          {calendarSync && (
            <View style={styles.subOptions}>
              {/* Calendar type */}
              <Text style={styles.subLabel}>Calendar Provider</Text>
              <View style={styles.calendarTypeRow}>
                <TouchableOpacity
                  style={[styles.calTypeBtn, calendarType === "apple" && styles.calTypeBtnActive]}
                  onPress={() => setCalendarType("apple")}
                >
                  <Ionicons name="logo-apple" size={18} color={calendarType === "apple" ? Colors.textPrimary : Colors.textSecondary} />
                  <Text style={[styles.calTypeText, calendarType === "apple" && styles.calTypeTextActive]}>Apple</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.calTypeBtn, calendarType === "google" && styles.calTypeBtnActive]}
                  onPress={() => setCalendarType("google")}
                >
                  <Ionicons name="logo-google" size={16} color={calendarType === "google" ? Colors.textPrimary : Colors.textSecondary} />
                  <Text style={[styles.calTypeText, calendarType === "google" && styles.calTypeTextActive]}>Google</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.subRow}>
                <Text style={styles.subRowText}>Auto-add classes to calendar</Text>
                <Switch value={autoAddClasses} onValueChange={setAutoAddClasses} trackColor={{ false: Colors.border, true: Colors.gold }} thumbColor="#FFFFFF" />
              </View>
              <View style={styles.subRow}>
                <Text style={styles.subRowText}>Auto-add tests/quizzes</Text>
                <Switch value={autoAddTests} onValueChange={setAutoAddTests} trackColor={{ false: Colors.border, true: Colors.gold }} thumbColor="#FFFFFF" />
              </View>
              <View style={styles.subRow}>
                <Text style={styles.subRowText}>Show my busy times in app</Text>
                <Switch value={showBusyTimes} onValueChange={setShowBusyTimes} trackColor={{ false: Colors.border, true: Colors.gold }} thumbColor="#FFFFFF" />
              </View>
              <Text style={styles.smsNote}>
                We'll check your calendar before scheduling to avoid conflicts.
              </Text>
            </View>
          )}
        </View>

        {/* ─── Reminder Timing ────────────────────────────────────────── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIcon, { backgroundColor: Colors.warning + "15" }]}>
              <Ionicons name="alarm" size={18} color={Colors.warning} />
            </View>
            <Text style={styles.sectionTitle}>Reminder Timing</Text>
          </View>

          <View style={styles.timingSection}>
            <Text style={styles.timingLabel}>Before class starts</Text>
            <View style={styles.timingRow}>
              {TIMING_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={opt.key}
                  style={[styles.timingChip, classReminder === opt.key && styles.timingChipActive]}
                  onPress={() => setClassReminder(opt.key)}
                >
                  <Text style={[styles.timingChipText, classReminder === opt.key && styles.timingChipTextActive]}>{opt.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.timingLabel}>Before test/quiz due</Text>
            <View style={styles.timingRow}>
              {TIMING_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={opt.key}
                  style={[styles.timingChip, testReminder === opt.key && styles.timingChipActive]}
                  onPress={() => setTestReminder(opt.key)}
                >
                  <Text style={[styles.timingChipText, testReminder === opt.key && styles.timingChipTextActive]}>{opt.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.timingLabel}>Daily practice reminder</Text>
            <View style={styles.timingRow}>
              {TIMING_OPTIONS.slice(1).map((opt) => (
                <TouchableOpacity
                  key={opt.key}
                  style={[styles.timingChip, practiceReminder === opt.key && styles.timingChipActive]}
                  onPress={() => setPracticeReminder(opt.key)}
                >
                  <Text style={[styles.timingChipText, practiceReminder === opt.key && styles.timingChipTextActive]}>{opt.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* ─── Achievement Digest ────────────────────────────────────── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIcon, { backgroundColor: Colors.gold + "15" }]}>
              <Ionicons name="trophy" size={18} color={Colors.gold} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.sectionTitle}>Achievement Digest</Text>
              <Text style={styles.sectionSub}>Weekly summary of your achievements</Text>
            </View>
            <Switch
              value={digestEnabled}
              onValueChange={handleDigestToggle}
              trackColor={{ false: Colors.border, true: Colors.gold }}
              thumbColor="#FFFFFF"
            />
          </View>

          {digestEnabled && (
            <View style={styles.digestSettings}>
              <Text style={styles.timingLabel}>Day of week</Text>
              <View style={styles.timingRow}>
                {DIGEST_DAYS.map((day) => (
                  <TouchableOpacity
                    key={day.value}
                    style={[styles.timingChip, digestDay === day.value && styles.timingChipActive]}
                    onPress={() => handleDigestDayChange(day.value)}
                  >
                    <Text style={[styles.timingChipText, digestDay === day.value && styles.timingChipTextActive]}>{day.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.timingLabel}>Time</Text>
              <View style={styles.timingRow}>
                {DIGEST_TIMES.map((time) => (
                  <TouchableOpacity
                    key={time.value}
                    style={[styles.timingChip, digestHour === time.value && styles.timingChipActive]}
                    onPress={() => handleDigestTimeChange(time.value)}
                  >
                    <Text style={[styles.timingChipText, digestHour === time.value && styles.timingChipTextActive]}>{time.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.smsNote}>
                You'll receive a weekly push notification with new achievements earned and milestones you're close to unlocking.
              </Text>
            </View>
          )}
        </View>

        {/* ─── Alarm Sound ────────────────────────────────────────────── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIcon, { backgroundColor: "#8B5CF6" + "15" }]}>
              <Ionicons name="volume-high" size={18} color="#8B5CF6" />
            </View>
            <Text style={styles.sectionTitle}>Alert Sound</Text>
          </View>

          <View style={styles.soundGrid}>
            {SOUND_OPTIONS.map((sound) => (
              <TouchableOpacity
                key={sound.key}
                style={[styles.soundCard, alarmSound === sound.key && styles.soundCardActive]}
                onPress={() => {
                  setAlarmSound(sound.key);
                  if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={sound.icon as any}
                  size={20}
                  color={alarmSound === sound.key ? Colors.textPrimary : Colors.textSecondary}
                />
                <Text style={[styles.soundLabel, alarmSound === sound.key && styles.soundLabelActive]}>
                  {sound.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={[styles.subRow, { marginTop: Spacing.md }]}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <Ionicons name="phone-portrait" size={16} color={Colors.textSecondary} />
              <Text style={styles.subRowText}>Vibration</Text>
            </View>
            <Switch value={vibration} onValueChange={setVibration} trackColor={{ false: Colors.border, true: "#8B5CF6" }} thumbColor="#FFFFFF" />
          </View>
        </View>

        {/* ─── Streak Reminders ───────────────────────────────────────── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIcon, { backgroundColor: Colors.error + "15" }]}>
              <Ionicons name="flame" size={18} color={Colors.error} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.sectionTitle}>Streak Reminders</Text>
              <Text style={styles.sectionSub}>Daily reminder to keep your streak alive</Text>
            </View>
            <Switch
              value={streakNotifEnabled}
              onValueChange={handleStreakNotifToggle}
              trackColor={{ false: Colors.border, true: Colors.error }}
              thumbColor="#FFFFFF"
            />
          </View>

          {streakNotifEnabled && (
            <View style={styles.subOptions}>
              <Text style={styles.timingLabel}>Reminder Time</Text>
              <View style={styles.timingRow}>
                {REMINDER_TIMES.map((time) => (
                  <TouchableOpacity
                    key={`${time.hour}-${time.minute}`}
                    style={[styles.timingChip, streakNotifHour === time.hour && streakNotifMinute === time.minute && styles.timingChipActive]}
                    onPress={() => handleStreakTimeChange(time.hour, time.minute)}
                  >
                    <Text style={[styles.timingChipText, streakNotifHour === time.hour && streakNotifMinute === time.minute && styles.timingChipTextActive]}>{time.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={styles.smsNote}>
                You'll get a reminder if you haven't completed your daily goal by this time.
              </Text>
            </View>
          )}
        </View>

        {/* ─── Creator Content Alerts ─────────────────────────────────── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIcon, { backgroundColor: "#EC4899" + "15" }]}>
              <Ionicons name="people" size={18} color="#EC4899" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.sectionTitle}>Creator Content Alerts</Text>
              <Text style={styles.sectionSub}>New content from language creators</Text>
            </View>
            <Switch
              value={creatorNotifEnabled}
              onValueChange={handleCreatorNotifToggle}
              trackColor={{ false: Colors.border, true: "#EC4899" }}
              thumbColor="#FFFFFF"
            />
          </View>

          {creatorNotifEnabled && (
            <View style={styles.subOptions}>
              <View style={styles.subRow}>
                <Text style={styles.subRowText}>Only from followed creators</Text>
                <Switch
                  value={creatorFollowedOnly}
                  onValueChange={handleCreatorFollowedOnlyToggle}
                  trackColor={{ false: Colors.border, true: "#EC4899" }}
                  thumbColor="#FFFFFF"
                />
              </View>
              <Text style={styles.smsNote}>
                Get notified when creators you follow post new learning content.
              </Text>
            </View>
          )}
        </View>

        {/* ─── Journal Prompts ────────────────────────────────────────── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIcon, { backgroundColor: Colors.secondary + "15" }]}>
              <Ionicons name="journal" size={18} color={Colors.secondary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.sectionTitle}>Daily Journal Prompts</Text>
              <Text style={styles.sectionSub}>Writing practice reminders</Text>
            </View>
            <Switch
              value={journalNotifEnabled}
              onValueChange={handleJournalNotifToggle}
              trackColor={{ false: Colors.border, true: Colors.secondary }}
              thumbColor="#FFFFFF"
            />
          </View>

          {journalNotifEnabled && (
            <View style={styles.subOptions}>
              <Text style={styles.timingLabel}>Prompt Time</Text>
              <View style={styles.timingRow}>
                {DIGEST_TIMES.map((time) => (
                  <TouchableOpacity
                    key={time.value}
                    style={[styles.timingChip, journalNotifHour === time.value && styles.timingChipActive]}
                    onPress={() => handleJournalTimeChange(time.value)}
                  >
                    <Text style={[styles.timingChipText, journalNotifHour === time.value && styles.timingChipTextActive]}>{time.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={styles.smsNote}>
                A daily prompt to write in your target language and get AI corrections.
              </Text>
            </View>
          )}
        </View>

        {/* ─── Engagement Notifications ───────────────────────────────── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIcon, { backgroundColor: Colors.success + "15" }]}>
              <Ionicons name="sparkles" size={18} color={Colors.success} />
            </View>
            <Text style={styles.sectionTitle}>Engagement Alerts</Text>
          </View>

          <View style={styles.subOptions}>
            <View style={styles.subRow}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <Ionicons name="flame" size={16} color={Colors.error} />
                <Text style={styles.subRowText}>Streak at risk</Text>
              </View>
              <Switch
                value={engagementStreakEnabled}
                onValueChange={(v) => handleEngagementToggle("streakReminders", v)}
                trackColor={{ false: Colors.border, true: Colors.success }}
                thumbColor="#FFFFFF"
              />
            </View>
            <View style={styles.subRow}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <Ionicons name="musical-notes" size={16} color="#EC4899" />
                <Text style={styles.subRowText}>New music translations</Text>
              </View>
              <Switch
                value={engagementMusicEnabled}
                onValueChange={(v) => handleEngagementToggle("musicAlerts", v)}
                trackColor={{ false: Colors.border, true: Colors.success }}
                thumbColor="#FFFFFF"
              />
            </View>
            <View style={styles.subRow}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <Ionicons name="trophy" size={16} color={Colors.gold} />
                <Text style={styles.subRowText}>Milestone celebrations</Text>
              </View>
              <Switch
                value={engagementMilestoneEnabled}
                onValueChange={(v) => handleEngagementToggle("milestoneAlerts", v)}
                trackColor={{ false: Colors.border, true: Colors.success }}
                thumbColor="#FFFFFF"
              />
            </View>
            <View style={styles.subRow}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <Ionicons name="heart" size={16} color={Colors.secondary} />
                <Text style={styles.subRowText}>Re-engagement nudges</Text>
              </View>
              <Switch
                value={engagementReEngageEnabled}
                onValueChange={(v) => handleEngagementToggle("reEngagement", v)}
                trackColor={{ false: Colors.border, true: Colors.success }}
                thumbColor="#FFFFFF"
              />
            </View>
          </View>
        </View>

        {/* ─── Weekly Progress Report ─────────────────────────────────── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIcon, { backgroundColor: "rgba(0,170,255,0.12)" }]}>
              <Ionicons name="bar-chart" size={18} color="#00AAFF" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.sectionTitle}>Weekly Progress Report</Text>
              <Text style={styles.sectionSub}>AI-generated summary every Sunday at 6 PM</Text>
            </View>
            <Switch
              value={weeklyReportEnabled}
              onValueChange={async (val) => {
                setWeeklyReportEnabled(val);
                if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                await toggleWeeklyNotification(val);
              }}
              trackColor={{ false: Colors.border, true: "#00AAFF" }}
              thumbColor="#FFFFFF"
            />
          </View>
          <Text style={[styles.channelDesc, { marginTop: 8 }]}>
            Receive a notification with your weekly grade, highlights, areas to improve, and a personalized teacher's note based on your learning data.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    gap: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surfaceCard,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  headerTitle: {
    flex: 1,
    fontSize: FontSize.lg,
    fontWeight: "700",
    color: Colors.textPrimary,
    textAlign: "center",
  },

  // Sections
  section: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
    backgroundColor: Colors.surfaceCard,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  sectionIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.glowSubtle,
    alignItems: "center",
    justifyContent: "center",
  },
  sectionTitle: {
    fontSize: FontSize.md,
    fontWeight: "700",
    color: Colors.textPrimary,
    flex: 1,
  },
  sectionSub: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginTop: 1,
  },

  // Channels
  channelList: {
    marginTop: Spacing.md,
    gap: 2,
  },
  channelRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border + "40",
  },
  channelLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  channelTitle: {
    fontSize: FontSize.sm,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  channelDesc: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    marginTop: 1,
  },

  // Sub options
  subOptions: {
    marginTop: Spacing.md,
    gap: 4,
  },
  subRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
  },
  subRowText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  subLabel: {
    fontSize: FontSize.xs,
    fontWeight: "700",
    color: Colors.textMuted,
    letterSpacing: 0.5,
    textTransform: "uppercase",
    marginBottom: 8,
    marginTop: 8,
  },
  smsNote: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    fontStyle: "italic",
    marginTop: 8,
  },

  // Achievement digest
  digestSettings: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
  },

  // Calendar type
  calendarTypeRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: Spacing.md,
  },
  calTypeBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: BorderRadius.full,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  calTypeBtnActive: {
    backgroundColor: Colors.secondary,
    borderColor: Colors.secondary,
  },
  calTypeText: {
    fontSize: FontSize.sm,
    fontWeight: "600",
    color: Colors.textSecondary,
  },
  calTypeTextActive: {
    color: Colors.textPrimary,
  },

  // Timing
  timingSection: {
    marginTop: Spacing.md,
    gap: 8,
  },
  timingLabel: {
    fontSize: FontSize.sm,
    fontWeight: "600",
    color: Colors.textSecondary,
    marginTop: 8,
  },
  timingRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  timingChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  timingChipActive: {
    backgroundColor: Colors.warning,
    borderColor: Colors.warning,
  },
  timingChipText: {
    fontSize: FontSize.sm,
    fontWeight: "600",
    color: Colors.textSecondary,
  },
  timingChipTextActive: {
    color: Colors.textDark,
    fontWeight: "700",
  },

  // Sound
  soundGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: Spacing.md,
  },
  soundCard: {
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: BorderRadius.md,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: Colors.border,
    minWidth: 70,
  },
  soundCardActive: {
    backgroundColor: "#8B5CF6" + "20",
    borderColor: "#8B5CF6",
  },
  soundLabel: {
    fontSize: FontSize.xs,
    fontWeight: "600",
    color: Colors.textSecondary,
  },
  soundLabelActive: {
    color: Colors.textPrimary,
  },
});
