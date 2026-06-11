import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Colors, Spacing, BorderRadius, FontSize } from "../constants/Colors";

const { width } = Dimensions.get("window");

type ViewMode = "day" | "week" | "month";

const MONTH_DAYS = Array.from({ length: 31 }, (_, i) => i + 1);
const WEEK_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

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
];

const TIME_SLOTS = [
  "8:00 AM", "9:00 AM", "10:00 AM", "11:00 AM", "12:00 PM",
  "1:00 PM", "2:00 PM", "3:00 PM", "4:00 PM", "5:00 PM",
  "6:00 PM", "7:00 PM", "8:00 PM",
];

export default function CalendarScreen() {
  const [viewMode, setViewMode] = useState<ViewMode>("week");
  const [selectedDate, setSelectedDate] = useState(22);
  const [showNewEvent, setShowNewEvent] = useState(false);

  const todayEvents = ALL_EVENTS.filter((e) => e.date === selectedDate);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Calendar</Text>
          <Text style={styles.headerSub}>May 2026</Text>
        </View>
        <TouchableOpacity style={styles.newEventBtn} onPress={() => setShowNewEvent(!showNewEvent)}>
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

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Month Mini Calendar */}
        {viewMode === "month" && (
          <View style={styles.monthGrid}>
            {/* Day labels */}
            <View style={styles.monthRow}>
              {WEEK_LABELS.map((d) => (
                <Text key={d} style={styles.monthDayLabel}>{d}</Text>
              ))}
            </View>
            {/* Empty cells for offset (May 2026 starts on Friday) */}
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
            {/* Remaining weeks */}
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
                    style={[styles.monthCell, selectedDate === d && styles.monthCellActive, d === 22 && styles.monthCellToday]}
                    onPress={() => setSelectedDate(d)}
                  >
                    <Text style={[styles.monthCellText, selectedDate === d && styles.monthCellTextActive]}>{d}</Text>
                    {ALL_EVENTS.some((e) => e.date === d) && <View style={styles.monthEventDot} />}
                  </TouchableOpacity>
                ))}
                {week.length < 7 && Array.from({ length: 7 - week.length }).map((_, i) => (
                  <View key={`pad-${i}`} style={styles.monthCell} />
                ))}
              </View>
            ))}
          </View>
        )}

        {/* Week View */}
        {viewMode === "week" && (
          <View style={styles.weekView}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.weekStrip}>
              {Array.from({ length: 7 }, (_, i) => i + 19).map((d) => (
                <TouchableOpacity
                  key={d}
                  style={[styles.weekCell, selectedDate === d && styles.weekCellActive]}
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

        {/* Day View - Timeline */}
        {viewMode === "day" && (
          <View style={styles.dayTimeline}>
            {TIME_SLOTS.map((slot) => {
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

        {/* Selected Day Events */}
        <View style={styles.eventsSection}>
          <View style={styles.eventsSectionHeader}>
            <Text style={styles.eventsSectionTitle}>
              {selectedDate === 22 ? "Today" : `May ${selectedDate}`} — {todayEvents.length} event{todayEvents.length !== 1 ? "s" : ""}
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
                  <TouchableOpacity style={styles.rescheduleBtn}>
                    <Text style={styles.rescheduleBtnText}>Reschedule</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.cancelBtn}>
                    <Text style={styles.cancelBtnText}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <Text style={styles.quickActionsTitle}>Quick Schedule</Text>
          <View style={styles.quickActionsGrid}>
            {[
              { icon: "person", label: "Book Tutor", color: Colors.secondary },
              { icon: "school", label: "Join Class", color: "#8B5CF6" },
              { icon: "document-text", label: "Book Test", color: Colors.accent },
              { icon: "time", label: "Block Time", color: Colors.gold },
              { icon: "videocam", label: "Video Meet", color: Colors.success },
              { icon: "people", label: "Group Study", color: Colors.textAccent },
            ].map((action, i) => (
              <TouchableOpacity key={i} style={styles.quickActionItem}>
                <View style={[styles.quickActionIcon, { backgroundColor: `${action.color}15`, borderColor: `${action.color}40` }]}>
                  <Ionicons name={action.icon as any} size={20} color={action.color} />
                </View>
                <Text style={styles.quickActionLabel}>{action.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* New Event Modal (inline) */}
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
              {["Class", "Tutoring", "Test", "Block", "Video"].map((t) => (
                <TouchableOpacity key={t} style={styles.newEventTypeBtn}>
                  <Text style={styles.newEventTypeBtnText}>{t}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity style={styles.createEventBtn} onPress={() => setShowNewEvent(false)}>
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
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.surfaceCard, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: Colors.border },
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

  // Events section
  eventsSection: { paddingHorizontal: Spacing.lg, marginTop: Spacing.lg },
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
  cancelBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.redGlow,
    borderWidth: 1,
    borderColor: Colors.redBorder,
  },
  cancelBtnText: { fontSize: FontSize.xs, fontWeight: "600", color: Colors.accent },

  // Quick actions
  quickActions: { paddingHorizontal: Spacing.lg, marginTop: Spacing.lg },
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
  newEventTypeRow: { flexDirection: "row", gap: 6, marginTop: Spacing.sm, marginBottom: Spacing.md },
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
