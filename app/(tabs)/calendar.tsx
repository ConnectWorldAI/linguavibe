import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  TextInput,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import * as Haptics from "expo-haptics";
import { useNotificationBadges } from "@/lib/notification-badges";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Colors, Spacing, BorderRadius, FontSize } from "../../constants/Colors";
import {
  getUsageData,
  getDaysRemainingInCycle,
  getUsagePercentage,
  getRemainingUsage,
  TIER_LIMITS,
  type UsageData,
  type ServiceKey,
  type TierLevel,
} from "@/lib/usage-limits";
import { useI18n } from "@/lib/i18n";

const { width } = Dimensions.get("window");

type ViewMode = "day" | "week" | "month";
type CalendarSync = "apple" | "google" | "none";

const WEEK_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const TODAY = new Date();
const TODAY_DATE = TODAY.getDate();
const CURRENT_MONTH = TODAY.getMonth(); // 0-indexed
const CURRENT_YEAR = TODAY.getFullYear();

// Events data
const ALL_EVENTS = [
  { id: "1", title: "Dominican Slang 101", type: "class", time: "3:00 PM", duration: "45 min", date: 22, color: "#8B5CF6", teacher: "Sophia Martinez" },
  { id: "2", title: "1-on-1 Tutoring", type: "tutoring", time: "5:00 PM", duration: "30 min", date: 22, color: Colors.secondary, teacher: "Sophia Martinez" },
  { id: "3", title: "Business French", type: "class", time: "10:00 AM", duration: "45 min", date: 23, color: "#8B5CF6", teacher: "Marie Dubois" },
  { id: "4", title: "Pronunciation Test", type: "test", time: "2:00 PM", duration: "30 min", date: 23, color: Colors.accent, teacher: "AI Examiner" },
  { id: "5", title: "Study Block", type: "blocked", time: "6:00 PM", duration: "1 hr", date: 23, color: Colors.gold, teacher: "" },
  { id: "6", title: "Video Call - Carlos", type: "video", time: "11:00 AM", duration: "30 min", date: 24, color: Colors.success, teacher: "Carlos Restrepo" },
  { id: "7", title: "K-Pop Korean", type: "class", time: "7:00 PM", duration: "45 min", date: 24, color: "#8B5CF6", teacher: "Min-Ji Park" },
  { id: "8", title: "Virtual Test - Spanish B1", type: "test", time: "4:00 PM", duration: "45 min", date: 25, color: Colors.accent, teacher: "AI Examiner" },
  { id: "9", title: "Group Practice", type: "class", time: "7:00 PM", duration: "30 min", date: 26, color: "#8B5CF6", teacher: "Sophia Martinez" },
  { id: "10", title: "Video Message Review", type: "video", time: "9:00 AM", duration: "15 min", date: 27, color: Colors.success, teacher: "Marie Dubois" },
  { id: "11", title: "Blocked - Personal", type: "blocked", time: "12:00 PM", duration: "2 hr", date: 28, color: Colors.gold, teacher: "" },
  { id: "12", title: "Interview - TechCorp", type: "interview", time: "10:00 AM", duration: "1 hr", date: 29, color: "#06B6D4", teacher: "HR Team" },
  { id: "13", title: "Mock Interview Prep", type: "class", time: "4:00 PM", duration: "30 min", date: 28, color: "#8B5CF6", teacher: "Carlos Restrepo" },
];

// Usage services for daily recap
const USAGE_SERVICES: { key: ServiceKey; icon: keyof typeof Ionicons.glyphMap; label: string; color: string; unit: string }[] = [
  { key: "callTranslationMinutes", icon: "call", label: "Call Translation", color: Colors.success, unit: "min" },
  { key: "videoCallMinutes", icon: "videocam", label: "Video Calls", color: Colors.glow, unit: "min" },
  { key: "songTranslations", icon: "musical-notes", label: "Songs Translated", color: Colors.gold, unit: "" },
  { key: "urlTranslations", icon: "globe", label: "URL Translations", color: "#06B6D4", unit: "" },
  { key: "videoUploadMinutes", icon: "film", label: "Video Uploads", color: "#A855F7", unit: "min" },
  { key: "voiceMemos", icon: "mic", label: "Voice Memos", color: Colors.secondary, unit: "" },
  { key: "aiTranscriptions", icon: "document-text", label: "AI Transcriptions", color: "#EC4899", unit: "" },
];

// Simulated daily usage history (in production from AsyncStorage per-day logs)
const DAILY_USAGE_LOG: Record<number, Record<string, number>> = {
  18: { callTranslationMinutes: 12, songTranslations: 2, urlTranslations: 3, voiceMemos: 1 },
  19: { callTranslationMinutes: 8, videoCallMinutes: 15, songTranslations: 1 },
  20: { callTranslationMinutes: 5, urlTranslations: 2, aiTranscriptions: 3 },
  21: { videoCallMinutes: 20, songTranslations: 3, voiceMemos: 2, videoUploadMinutes: 5 },
  22: { callTranslationMinutes: 10, songTranslations: 1, urlTranslations: 1 },
};

export default function CalendarTabScreen() {
  const { t } = useI18n();
  const [viewMode, setViewMode] = useState<ViewMode>("week");
  const [selectedDate, setSelectedDate] = useState(TODAY_DATE);
  const { clearBadge } = useNotificationBadges();

  // Clear assignments badge when this tab is focused
  useFocusEffect(
    React.useCallback(() => {
      clearBadge("assignments");
    }, [clearBadge])
  );
  const [showNewEvent, setShowNewEvent] = useState(false);
  const [calendarSync, setCalendarSync] = useState<CalendarSync>("none");
  const [usageData, setUsageData] = useState<UsageData | null>(null);
  const [showUsageRecap, setShowUsageRecap] = useState(true);
  const [userEvents, setUserEvents] = useState<typeof ALL_EVENTS>([]);
  const [newEventTitle, setNewEventTitle] = useState("");
  const [newEventTime, setNewEventTime] = useState("12:00 PM");
  const [newEventType, setNewEventType] = useState("class");

  useEffect(() => {
    getUsageData().then(setUsageData);
    AsyncStorage.getItem("@calendar_sync_type").then((val) => {
      if (val === "apple" || val === "google") setCalendarSync(val);
    });
    // Load persisted user events
    AsyncStorage.getItem("@user_calendar_events").then((val) => {
      if (val) {
        try { setUserEvents(JSON.parse(val)); } catch {}
      }
    });
  }, []);

  const saveUserEvent = async () => {
    if (!newEventTitle.trim()) return;
    const typeColors: Record<string, string> = {
      class: "#8B5CF6", tutoring: Colors.secondary, test: Colors.accent,
      block: Colors.gold, video: Colors.success, interview: "#06B6D4",
    };
    const newEvent = {
      id: `user_${Date.now()}`,
      title: newEventTitle.trim(),
      type: newEventType,
      time: newEventTime,
      duration: "30 min",
      date: selectedDate,
      color: typeColors[newEventType] || Colors.secondary,
      teacher: "",
    };
    const updated = [...userEvents, newEvent];
    setUserEvents(updated);
    await AsyncStorage.setItem("@user_calendar_events", JSON.stringify(updated));
    setNewEventTitle("");
    setNewEventTime("12:00 PM");
    setNewEventType("class");
    setShowNewEvent(false);
    if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const deleteUserEvent = async (eventId: string) => {
    const updated = userEvents.filter((e) => e.id !== eventId);
    setUserEvents(updated);
    await AsyncStorage.setItem("@user_calendar_events", JSON.stringify(updated));
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const allCombinedEvents = [...ALL_EVENTS, ...userEvents];
  const todayEvents = allCombinedEvents.filter((e) => e.date === selectedDate);
  // Usage recap shows PREVIOUS day's usage
  const recapDate = selectedDate > 1 ? selectedDate - 1 : selectedDate;
  const dailyUsage = DAILY_USAGE_LOG[recapDate] || {};
  const hasUsageData = Object.keys(dailyUsage).length > 0;

  const handleSyncToggle = async (type: CalendarSync) => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const newSync = calendarSync === type ? "none" : type;
    setCalendarSync(newSync);
    await AsyncStorage.setItem("@calendar_sync_type", newSync);
  };

  const daysLeft = usageData ? getDaysRemainingInCycle(usageData) : 0;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>{t.calendar}</Text>
          <Text style={styles.headerSub}>
            May {CURRENT_YEAR} • {daysLeft} days left in cycle
          </Text>
        </View>
        <TouchableOpacity
          style={styles.newEventBtn}
          onPress={() => {
            if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setShowNewEvent(!showNewEvent);
          }}
        >
          <Ionicons name="add" size={18} color={Colors.textPrimary} />
          <Text style={styles.newEventBtnText}>New</Text>
        </TouchableOpacity>
      </View>

      {/* View Mode Toggle */}
      <View style={styles.viewToggle}>
        {(["day", "week", "month"] as ViewMode[]).map((mode) => (
          <TouchableOpacity
            key={mode}
            style={[styles.viewToggleBtn, viewMode === mode && styles.viewToggleBtnActive]}
            onPress={() => setViewMode(mode)}
          >
            <Text style={[styles.viewToggleText, viewMode === mode && styles.viewToggleTextActive]}>
              {mode.charAt(0).toUpperCase() + mode.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        {/* Week Strip (always visible in week mode) */}
        {viewMode === "week" && (
          <View style={styles.weekView}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.weekStrip}>
              {Array.from({ length: 7 }, (_, i) => i + (TODAY_DATE - 3)).map((d) => (
                <TouchableOpacity
                  key={d}
                  style={[styles.weekCell, selectedDate === d && styles.weekCellActive, d === TODAY_DATE && styles.weekCellToday]}
                  onPress={() => setSelectedDate(d)}
                >
                  <Text style={[styles.weekCellDay, selectedDate === d && styles.weekCellDayActive]}>
                    {WEEK_LABELS[(d + 4) % 7]}
                  </Text>
                  <Text style={[styles.weekCellDate, selectedDate === d && styles.weekCellDateActive]}>{d}</Text>
                  {ALL_EVENTS.some((e) => e.date === d) && (
                    <View style={styles.weekEventIndicator}>
                      <Text style={styles.weekEventCount}>{ALL_EVENTS.filter((e) => e.date === d).length}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Month Grid */}
        {viewMode === "month" && (
          <View style={styles.monthGrid}>
            <View style={styles.monthRow}>
              {WEEK_LABELS.map((d) => (
                <Text key={d} style={styles.monthDayLabel}>{d}</Text>
              ))}
            </View>
            {/* May 2026 starts on Friday (offset 5) */}
            <View style={styles.monthRow}>
              {[0, 0, 0, 0, 0].map((_, i) => (
                <View key={`empty-${i}`} style={styles.monthCell} />
              ))}
              {[1, 2].map((d) => (
                <TouchableOpacity
                  key={d}
                  style={[styles.monthCell, selectedDate === d && styles.monthCellActive]}
                  onPress={() => setSelectedDate(d)}
                >
                  <Text style={[styles.monthCellText, selectedDate === d && styles.monthCellTextActive]}>{d}</Text>
                  {ALL_EVENTS.some((e) => e.date === d) && <View style={styles.monthEventDot} />}
                </TouchableOpacity>
              ))}
            </View>
            {[
              [3, 4, 5, 6, 7, 8, 9],
              [10, 11, 12, 13, 14, 15, 16],
              [17, 18, 19, 20, 21, 22, 23],
              [24, 25, 26, 27, 28, 29, 30],
              [31],
            ].map((week, wi) => (
              <View key={wi} style={styles.monthRow}>
                {week.map((d) => (
                  <TouchableOpacity
                    key={d}
                    style={[styles.monthCell, selectedDate === d && styles.monthCellActive, d === TODAY_DATE && styles.monthCellToday]}
                    onPress={() => setSelectedDate(d)}
                  >
                    <Text style={[styles.monthCellText, selectedDate === d && styles.monthCellTextActive]}>{d}</Text>
                    {ALL_EVENTS.some((e) => e.date === d) && <View style={styles.monthEventDot} />}
                    {DAILY_USAGE_LOG[d - 1] && <View style={[styles.monthEventDot, { backgroundColor: Colors.gold, marginTop: 1 }]} />}
                  </TouchableOpacity>
                ))}
                {week.length < 7 && Array.from({ length: 7 - week.length }).map((_, i) => (
                  <View key={`pad-${i}`} style={styles.monthCell} />
                ))}
              </View>
            ))}
          </View>
        )}

        {/* Day Timeline */}
        {viewMode === "day" && (
          <View style={styles.dayTimeline}>
            {["8:00 AM", "9:00 AM", "10:00 AM", "11:00 AM", "12:00 PM", "1:00 PM", "2:00 PM", "3:00 PM", "4:00 PM", "5:00 PM", "6:00 PM", "7:00 PM", "8:00 PM"].map((slot) => {
              const event = todayEvents.find((e) => e.time === slot);
              return (
                <View key={slot} style={styles.timeSlot}>
                  <Text style={styles.timeSlotLabel}>{slot}</Text>
                  {event ? (
                    <TouchableOpacity style={[styles.timeSlotEvent, { borderLeftColor: event.color }]}>
                      <Text style={styles.timeSlotEventTitle}>{event.title}</Text>
                      <Text style={styles.timeSlotEventDuration}>{event.duration}</Text>
                    </TouchableOpacity>
                  ) : (
                    <View style={styles.timeSlotEmpty} />
                  )}
                </View>
              );
            })}
          </View>
        )}

        {/* Daily Usage Recap (shows previous day's usage) */}
        <TouchableOpacity
          style={styles.usageRecapHeader}
          onPress={() => setShowUsageRecap(!showUsageRecap)}
        >
          <View style={styles.usageRecapHeaderLeft}>
            <Ionicons name="stats-chart" size={18} color={Colors.secondary} />
            <Text style={styles.usageRecapTitle}>
              May {recapDate} Usage Recap
            </Text>
          </View>
          <View style={styles.usageRecapHeaderRight}>
            {usageData && (
              <Text style={styles.usageRecapRemaining}>{daysLeft}d left</Text>
            )}
            <Ionicons
              name={showUsageRecap ? "chevron-up" : "chevron-down"}
              size={16}
              color={Colors.textSecondary}
            />
          </View>
        </TouchableOpacity>

        {showUsageRecap && (
          <View style={styles.usageRecapBody}>
            {hasUsageData ? (
              <>
                {USAGE_SERVICES.filter((s) => dailyUsage[s.key]).map((service) => (
                  <View key={service.key} style={styles.usageRow}>
                    <View style={[styles.usageIconWrap, { backgroundColor: `${service.color}15`, borderColor: `${service.color}40` }]}>
                      <Ionicons name={service.icon} size={14} color={service.color} />
                    </View>
                    <Text style={styles.usageLabel}>{service.label}</Text>
                    <Text style={styles.usageValue}>
                      {dailyUsage[service.key]}{service.unit ? ` ${service.unit}` : ""}
                    </Text>
                  </View>
                ))}
                {/* Remaining allowance */}
                {usageData && (
                  <View style={styles.remainingSection}>
                    <Text style={styles.remainingSectionTitle}>Remaining This Cycle</Text>
                    {USAGE_SERVICES.slice(0, 5).map((service) => {
                      const remaining = getRemainingUsage(usageData, service.key);
                      const pct = getUsagePercentage(usageData, service.key);
                      return (
                        <View key={service.key} style={styles.remainingRow}>
                          <View style={styles.remainingInfo}>
                            <Ionicons name={service.icon} size={12} color={service.color} />
                            <Text style={styles.remainingLabel}>{service.label}</Text>
                          </View>
                          <View style={styles.remainingBarWrap}>
                            <View style={styles.remainingBarBg}>
                              <View
                                style={[
                                  styles.remainingBarFill,
                                  {
                                    width: `${Math.min(pct, 100)}%`,
                                    backgroundColor: pct > 90 ? Colors.accent : pct > 75 ? Colors.gold : service.color,
                                  },
                                ]}
                              />
                            </View>
                            <Text style={styles.remainingText}>{remaining} left</Text>
                          </View>
                        </View>
                      );
                    })}
                  </View>
                )}
              </>
            ) : (
              <View style={styles.noUsage}>
                <Ionicons name="checkmark-circle" size={24} color={Colors.success} />
                <Text style={styles.noUsageText}>No usage recorded for May {recapDate}</Text>
              </View>
            )}
            <TouchableOpacity
              style={styles.viewFullUsageBtn}
              onPress={() => router.push("/usage-dashboard")}
            >
              <Text style={styles.viewFullUsageBtnText}>View Full Usage Dashboard</Text>
              <Ionicons name="arrow-forward" size={14} color={Colors.secondary} />
            </TouchableOpacity>
          </View>
        )}

        {/* Events for Selected Day */}
        <View style={styles.eventsSection}>
          <View style={styles.eventsSectionHeader}>
            <Text style={styles.eventsSectionTitle}>
              {selectedDate === TODAY_DATE ? "Today" : `May ${selectedDate}`} — {todayEvents.length} event{todayEvents.length !== 1 ? "s" : ""}
            </Text>
          </View>

          {todayEvents.length === 0 && (
            <View style={styles.noEvents}>
              <Ionicons name="calendar-outline" size={36} color={Colors.textMuted} />
              <Text style={styles.noEventsText}>No events this day</Text>
              <TouchableOpacity style={styles.addEventBtn} onPress={() => setShowNewEvent(true)}>
                <Ionicons name="add" size={16} color={Colors.secondary} />
                <Text style={styles.addEventBtnText}>Schedule Something</Text>
              </TouchableOpacity>
            </View>
          )}

          {todayEvents.map((event) => (
            <View key={event.id} style={styles.eventCard}>
              <View style={[styles.eventColorBar, { backgroundColor: event.color }]} />
              <View style={styles.eventCardBody}>
                <View style={styles.eventCardTop}>
                  <Text style={styles.eventCardTitle}>{event.title}</Text>
                  <View style={[styles.eventTypeBadge, { borderColor: event.color }]}>
                    <Text style={[styles.eventTypeText, { color: event.color }]}>{event.type}</Text>
                  </View>
                </View>
                <View style={styles.eventCardMeta}>
                  <Ionicons name="time" size={12} color={Colors.textSecondary} />
                  <Text style={styles.eventCardTime}>{event.time} • {event.duration}</Text>
                </View>
                {event.teacher && (
                  <View style={styles.eventCardMeta}>
                    <Ionicons name="person" size={12} color={Colors.textSecondary} />
                    <Text style={styles.eventCardTeacher}>{event.teacher}</Text>
                  </View>
                )}
                <View style={styles.eventCardActions}>
                  {(event.type === "class" || event.type === "tutoring") && (
                    <TouchableOpacity style={styles.joinBtn} onPress={() => router.push("/classroom")}>
                      <Ionicons name="enter" size={14} color={Colors.textPrimary} />
                      <Text style={styles.joinBtnText}>Join</Text>
                    </TouchableOpacity>
                  )}
                  {event.type === "video" && (
                    <TouchableOpacity style={[styles.joinBtn, { backgroundColor: Colors.success }]} onPress={() => router.push({ pathname: "/hume-call", params: { mode: "cloudwave", persona: "cloudwave" } } as any)}>
                      <Ionicons name="videocam" size={14} color={Colors.textPrimary} />
                      <Text style={styles.joinBtnText}>Video Call</Text>
                    </TouchableOpacity>
                  )}
                  {event.type === "interview" && (
                    <TouchableOpacity style={[styles.joinBtn, { backgroundColor: "#06B6D4" }]} onPress={() => router.push({ pathname: "/hume-call", params: { mode: "cloudwave", persona: "cloudwave" } } as any)}>
                      <Ionicons name="briefcase" size={14} color={Colors.textPrimary} />
                      <Text style={styles.joinBtnText}>Join Interview</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity style={styles.rescheduleBtn}>
                    <Text style={styles.rescheduleBtnText}>Reschedule</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* Calendar Sync Section */}
        <View style={styles.syncSection}>
          <Text style={styles.syncTitle}>Calendar Sync</Text>
          <Text style={styles.syncSubtitle}>Connect your calendar to see all events in one place</Text>
          <View style={styles.syncOptions}>
            <TouchableOpacity
              style={[styles.syncBtn, calendarSync === "apple" && styles.syncBtnActive]}
              onPress={() => handleSyncToggle("apple")}
            >
              <Ionicons name="logo-apple" size={20} color={calendarSync === "apple" ? Colors.textPrimary : Colors.textSecondary} />
              <Text style={[styles.syncBtnText, calendarSync === "apple" && styles.syncBtnTextActive]}>
                Apple Calendar
              </Text>
              {calendarSync === "apple" && (
                <Ionicons name="checkmark-circle" size={16} color={Colors.success} />
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.syncBtn, calendarSync === "google" && styles.syncBtnActive]}
              onPress={() => handleSyncToggle("google")}
            >
              <Ionicons name="logo-google" size={20} color={calendarSync === "google" ? Colors.textPrimary : Colors.textSecondary} />
              <Text style={[styles.syncBtnText, calendarSync === "google" && styles.syncBtnTextActive]}>
                Google Calendar
              </Text>
              {calendarSync === "google" && (
                <Ionicons name="checkmark-circle" size={16} color={Colors.success} />
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Learning Pace Status */}
        <TouchableOpacity
          style={styles.paceWidget}
          onPress={() => router.push("/learning-goal-setup" as any)}
          activeOpacity={0.8}
        >
          <View style={styles.paceWidgetRow}>
            <Ionicons name="trending-up" size={20} color="#10B981" />
            <Text style={styles.paceWidgetTitle}>Learning Pace: On Track</Text>
            <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
          </View>
          <View style={styles.paceWidgetBar}>
            <View style={[styles.paceWidgetBarFill, { width: "62%" }]} />
          </View>
          <Text style={styles.paceWidgetHint}>30 min/day keeps you on pace for B2 by Nov 2026</Text>
        </TouchableOpacity>

        {/* Quick Schedule Actions */}
        <View style={styles.quickActions}>
          <Text style={styles.quickActionsTitle}>Quick Schedule</Text>
          <View style={styles.quickActionsGrid}>
            {[
              { icon: "person", label: "Book Tutor", color: Colors.secondary, route: "/class-schedule" },
              { icon: "school", label: "Join Class", color: "#8B5CF6", route: "/classroom" },
              { icon: "document-text", label: "Book Test", color: Colors.accent, route: "/placement-test" },
              { icon: "time", label: "Block Time", color: Colors.gold, route: "/goal-adjustment" },
              { icon: "videocam", label: "Video Meet", color: Colors.success, route: "/video-call" },
              { icon: "briefcase", label: "Interview", color: "#06B6D4", route: "/jobs" },
            ].map((action, i) => (
              <TouchableOpacity
                key={i}
                style={styles.quickActionItem}
                onPress={() => {
                  if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  if (action.route) router.push(action.route as any);
                  else setShowNewEvent(true);
                }}
              >
                <View style={[styles.quickActionIcon, { backgroundColor: `${action.color}15`, borderColor: `${action.color}40` }]}>
                  <Ionicons name={action.icon as any} size={20} color={action.color} />
                </View>
                <Text style={styles.quickActionLabel}>{action.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* New Event Form (inline) */}
        {showNewEvent && (
          <View style={styles.newEventForm}>
            <View style={styles.newEventFormHeader}>
              <Text style={styles.newEventFormTitle}>New Event</Text>
              <TouchableOpacity onPress={() => setShowNewEvent(false)}>
                <Ionicons name="close" size={20} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <TextInput
              style={styles.newEventInput}
              placeholder="Event title..."
              placeholderTextColor={Colors.textMuted}
              value={newEventTitle}
              onChangeText={setNewEventTitle}
              returnKeyType="done"
            />
            <View style={styles.newEventRow}>
              <TouchableOpacity style={styles.newEventOption}>
                <Ionicons name="calendar" size={16} color={Colors.secondary} />
                <Text style={styles.newEventOptionText}>May {selectedDate}, 2026</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.newEventOption}>
                <Ionicons name="time" size={16} color={Colors.secondary} />
                <Text style={styles.newEventOptionText}>Select time</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.newEventRow}>
              <TouchableOpacity style={styles.newEventOption}>
                <Ionicons name="repeat" size={16} color={Colors.gold} />
                <Text style={styles.newEventOptionText}>Repeat</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.newEventOption}>
                <Ionicons name="alarm" size={16} color={Colors.accent} />
                <Text style={styles.newEventOptionText}>Alert</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.newEventTypeRow}>
              {["class", "tutoring", "test", "block", "video", "interview"].map((t) => (
                <TouchableOpacity
                  key={t}
                  style={[styles.newEventTypeBtn, newEventType === t && { backgroundColor: Colors.secondary + "30", borderColor: Colors.secondary }]}
                  onPress={() => setNewEventType(t)}
                >
                  <Text style={[styles.newEventTypeBtnText, newEventType === t && { color: Colors.secondary }]}>{t.charAt(0).toUpperCase() + t.slice(1)}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity style={styles.createEventBtn} onPress={saveUserEvent}>
              <Text style={styles.createEventBtnText}>Create Event</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.primary },

  // Header
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, gap: 12 },
  headerTitle: { fontSize: FontSize.xl, fontWeight: "700", color: Colors.textPrimary },
  headerSub: { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 2 },
  newEventBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: Colors.secondary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: BorderRadius.full,
  },
  newEventBtnText: { fontSize: FontSize.sm, fontWeight: "700", color: Colors.textPrimary },

  // View toggle
  viewToggle: {
    flexDirection: "row",
    marginHorizontal: Spacing.lg,
    backgroundColor: Colors.surfaceCard,
    borderRadius: BorderRadius.full,
    padding: 3,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  viewToggleBtn: { flex: 1, alignItems: "center", paddingVertical: 8, borderRadius: BorderRadius.full },
  viewToggleBtnActive: { backgroundColor: Colors.secondary },
  viewToggleText: { fontSize: FontSize.sm, fontWeight: "600", color: Colors.textSecondary },
  viewToggleTextActive: { color: Colors.textPrimary },

  // Month grid
  monthGrid: { paddingHorizontal: Spacing.lg, marginTop: Spacing.lg },
  monthRow: { flexDirection: "row", marginBottom: 4 },
  monthDayLabel: { flex: 1, textAlign: "center", fontSize: 10, fontWeight: "600", color: Colors.textMuted, marginBottom: 6 },
  monthCell: { flex: 1, alignItems: "center", paddingVertical: 8, borderRadius: BorderRadius.sm },
  monthCellActive: { backgroundColor: Colors.secondary },
  monthCellToday: { borderWidth: 1, borderColor: Colors.glowBorder },
  monthCellText: { fontSize: FontSize.sm, color: Colors.textPrimary, fontWeight: "500" },
  monthCellTextActive: { color: Colors.textPrimary, fontWeight: "700" },
  monthEventDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: Colors.secondary, marginTop: 3 },

  // Week view
  weekView: { marginTop: Spacing.md },
  weekStrip: { paddingHorizontal: Spacing.lg, gap: 8 },
  weekCell: {
    width: 60,
    alignItems: "center",
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.surfaceCard,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  weekCellActive: { backgroundColor: Colors.secondary, borderColor: Colors.secondary },
  weekCellToday: { borderColor: Colors.glowBorder },
  weekCellDay: { fontSize: 10, fontWeight: "600", color: Colors.textSecondary },
  weekCellDayActive: { color: Colors.textPrimary },
  weekCellDate: { fontSize: FontSize.lg, fontWeight: "700", color: Colors.textPrimary, marginTop: 4 },
  weekCellDateActive: { color: Colors.textPrimary },
  weekEventIndicator: {
    marginTop: 4,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: Colors.glowSubtle,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.glowBorder,
  },
  weekEventCount: { fontSize: 10, fontWeight: "700", color: Colors.secondary },

  // Day timeline
  dayTimeline: { paddingHorizontal: Spacing.lg, marginTop: Spacing.lg },
  timeSlot: { flexDirection: "row", alignItems: "flex-start", marginBottom: 2 },
  timeSlotLabel: { width: 60, fontSize: 10, color: Colors.textMuted, paddingTop: 8 },
  timeSlotEvent: {
    flex: 1,
    backgroundColor: Colors.surfaceCard,
    borderLeftWidth: 3,
    borderRadius: BorderRadius.sm,
    padding: Spacing.sm,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  timeSlotEventTitle: { fontSize: FontSize.sm, fontWeight: "600", color: Colors.textPrimary },
  timeSlotEventDuration: { fontSize: 10, color: Colors.textSecondary, marginTop: 2 },
  timeSlotEmpty: { flex: 1, height: 36, borderBottomWidth: 1, borderBottomColor: Colors.borderLight },

  // Usage recap
  usageRecapHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.xl,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.surfaceCard,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.glowBorder,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  usageRecapHeaderLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
  usageRecapHeaderRight: { flexDirection: "row", alignItems: "center", gap: 8 },
  usageRecapTitle: { fontSize: FontSize.md, fontWeight: "700", color: Colors.textPrimary },
  usageRecapRemaining: { fontSize: FontSize.xs, color: Colors.gold, fontWeight: "600" },
  usageRecapBody: {
    marginHorizontal: Spacing.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.surfaceCard,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    borderTopWidth: 0,
  },
  usageRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  usageIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    marginRight: 10,
  },
  usageLabel: { flex: 1, fontSize: FontSize.sm, color: Colors.textSecondary },
  usageValue: { fontSize: FontSize.sm, fontWeight: "700", color: Colors.textPrimary },

  // Remaining allowance
  remainingSection: { marginTop: Spacing.md, paddingTop: Spacing.md, borderTopWidth: 1, borderTopColor: Colors.border },
  remainingSectionTitle: { fontSize: FontSize.sm, fontWeight: "700", color: Colors.textPrimary, marginBottom: 8 },
  remainingRow: { marginBottom: 10 },
  remainingInfo: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 4 },
  remainingLabel: { fontSize: 11, color: Colors.textSecondary },
  remainingBarWrap: { flexDirection: "row", alignItems: "center", gap: 8 },
  remainingBarBg: { flex: 1, height: 6, borderRadius: 3, backgroundColor: Colors.surfaceElevated },
  remainingBarFill: { height: 6, borderRadius: 3 },
  remainingText: { fontSize: 10, color: Colors.textMuted, width: 50, textAlign: "right" },

  noUsage: { alignItems: "center", paddingVertical: Spacing.lg, gap: 6 },
  noUsageText: { fontSize: FontSize.sm, color: Colors.textMuted },
  viewFullUsageBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: Spacing.md,
    paddingVertical: 10,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.glowSubtle,
    borderWidth: 1,
    borderColor: Colors.glowBorder,
  },
  viewFullUsageBtnText: { fontSize: FontSize.sm, fontWeight: "600", color: Colors.secondary },

  // Events section
  eventsSection: { paddingHorizontal: Spacing.lg, marginTop: Spacing.xl },
  eventsSectionHeader: { marginBottom: Spacing.md },
  eventsSectionTitle: { fontSize: FontSize.lg, fontWeight: "700", color: Colors.textPrimary },

  noEvents: { alignItems: "center", paddingVertical: Spacing.xl, gap: 8 },
  noEventsText: { fontSize: FontSize.sm, color: Colors.textMuted },
  addEventBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: Colors.glowSubtle,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.glowBorder,
    marginTop: 4,
  },
  addEventBtnText: { fontSize: FontSize.sm, fontWeight: "600", color: Colors.secondary },

  // Event card
  eventCard: {
    flexDirection: "row",
    backgroundColor: Colors.surfaceCard,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: "hidden",
  },
  eventColorBar: { width: 4 },
  eventCardBody: { flex: 1, padding: Spacing.md },
  eventCardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
  eventCardTitle: { fontSize: FontSize.md, fontWeight: "700", color: Colors.textPrimary, flex: 1 },
  eventTypeBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: BorderRadius.full, borderWidth: 1 },
  eventTypeText: { fontSize: 10, fontWeight: "700", textTransform: "capitalize" },
  eventCardMeta: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 4 },
  eventCardTime: { fontSize: FontSize.xs, color: Colors.textSecondary },
  eventCardTeacher: { fontSize: FontSize.xs, color: Colors.textSecondary },
  eventCardActions: { flexDirection: "row", gap: 8, marginTop: Spacing.sm },
  joinBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: Colors.secondary,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: BorderRadius.full,
  },
  joinBtnText: { fontSize: FontSize.xs, fontWeight: "700", color: Colors.textPrimary },
  rescheduleBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.glowSubtle,
    borderWidth: 1,
    borderColor: Colors.glowBorder,
  },
  rescheduleBtnText: { fontSize: FontSize.xs, fontWeight: "600", color: Colors.secondary },

  // Calendar Sync
  syncSection: { paddingHorizontal: Spacing.lg, marginTop: Spacing.xl },
  syncTitle: { fontSize: FontSize.lg, fontWeight: "700", color: Colors.textPrimary },
  syncSubtitle: { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 2, marginBottom: Spacing.md },
  syncOptions: { gap: 8 },
  syncBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.surfaceCard,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  syncBtnActive: { borderColor: Colors.success, backgroundColor: `${Colors.success}10` },
  syncBtnText: { flex: 1, fontSize: FontSize.md, fontWeight: "600", color: Colors.textSecondary },
  syncBtnTextActive: { color: Colors.textPrimary },

  // Quick actions
  paceWidget: {
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.lg,
    backgroundColor: Colors.surfaceCard,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: "#10B981" + "30",
  },
  paceWidgetRow: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 10,
    marginBottom: 10,
  },
  paceWidgetTitle: {
    flex: 1,
    fontSize: FontSize.sm,
    fontWeight: "700" as const,
    color: Colors.textPrimary,
  },
  paceWidgetBar: {
    height: 5,
    backgroundColor: Colors.border,
    borderRadius: 3,
    marginBottom: 8,
  },
  paceWidgetBarFill: {
    height: 5,
    backgroundColor: "#10B981",
    borderRadius: 3,
  },
  paceWidgetHint: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  quickActions: { paddingHorizontal: Spacing.lg, marginTop: Spacing.xl },
  quickActionsTitle: { fontSize: FontSize.lg, fontWeight: "700", color: Colors.textPrimary, marginBottom: Spacing.md },
  quickActionsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  quickActionItem: {
    width: (width - 40 - 16) / 3,
    alignItems: "center",
    backgroundColor: Colors.surfaceCard,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 6,
  },
  quickActionIcon: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center", borderWidth: 1 },
  quickActionLabel: { fontSize: 10, fontWeight: "600", color: Colors.textSecondary },

  // New event form
  newEventForm: {
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.lg,
    padding: Spacing.lg,
    backgroundColor: Colors.surfaceCard,
    borderRadius: BorderRadius.xl,
    borderWidth: 1.5,
    borderColor: Colors.glowBorder,
  },
  newEventFormHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: Spacing.md },
  newEventFormTitle: { fontSize: FontSize.lg, fontWeight: "700", color: Colors.textPrimary },
  newEventInput: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontSize: FontSize.md,
    color: Colors.textPrimary,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.md,
  },
  newEventRow: { flexDirection: "row", gap: 8, marginBottom: Spacing.sm },
  newEventOption: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Colors.surfaceElevated,
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  newEventOptionText: { fontSize: FontSize.xs, color: Colors.textSecondary },
  newEventTypeRow: { flexDirection: "row", gap: 6, marginTop: Spacing.sm, marginBottom: Spacing.md, flexWrap: "wrap" },
  newEventTypeBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surfaceElevated,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  newEventTypeBtnText: { fontSize: FontSize.xs, fontWeight: "600", color: Colors.textSecondary },
  createEventBtn: {
    backgroundColor: Colors.secondary,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: "center",
  },
  createEventBtnText: { fontSize: FontSize.md, fontWeight: "700", color: Colors.textPrimary },
});
