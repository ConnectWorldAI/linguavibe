import { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { Colors, Spacing, BorderRadius, FontSize } from "../constants/Colors";

type InviteMethod = "email" | "sms" | "link";

export default function ClassInviteScreen() {
  const params = useLocalSearchParams<{
    classId?: string;
    className?: string;
    teacherName?: string;
    dateTime?: string;
    duration?: string;
    topic?: string;
    type?: string;
  }>();

  const className = params.className || "Spanish Conversation Practice";
  const teacherName = params.teacherName || "Profesora Maria";
  const dateTime = params.dateTime || "Tomorrow at 3:00 PM";
  const duration = params.duration || "45 min";
  const topic = params.topic || "Ordering food at a restaurant";
  const classType = params.type || "group";

  const [inviteMethod, setInviteMethod] = useState<InviteMethod>("email");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [addToCalendar, setAddToCalendar] = useState(true);
  const [reminderSet, setReminderSet] = useState(true);
  const [sent, setSent] = useState(false);

  const handleSendInvite = useCallback(async () => {
    if (inviteMethod === "email" && !email.trim()) {
      Alert.alert("Email Required", "Please enter your email to receive the invite.");
      return;
    }
    if (inviteMethod === "sms" && !phone.trim()) {
      Alert.alert("Phone Required", "Please enter your phone number.");
      return;
    }

    // In production: send via server (email/SMS/generate link)
    setSent(true);

    // Add to device calendar if selected
    if (addToCalendar && Platform.OS !== "web") {
      try {
        const Calendar = await import("expo-calendar" as any);
        const { status } = await Calendar.requestCalendarPermissionsAsync();
        if (status === "granted") {
          const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
          const defaultCal = calendars.find((c: any) => c.isPrimary) || calendars[0];
          if (defaultCal) {
            const startDate = new Date();
            startDate.setDate(startDate.getDate() + 1);
            startDate.setHours(15, 0, 0, 0);
            const endDate = new Date(startDate.getTime() + 45 * 60 * 1000);
            await Calendar.createEventAsync(defaultCal.id, {
              title: `[ConnectWorld AI] ${className}`,
              notes: `Teacher: ${teacherName}\nTopic: ${topic}\nJoin via ConnectWorld AI app`,
              startDate,
              endDate,
              alarms: [{ relativeOffset: -15 }],
            });
          }
        }
      } catch {}
    }
  }, [inviteMethod, email, phone, addToCalendar, className, teacherName, topic]);

  const handleJoinNow = () => {
    router.replace({
      pathname: "/virtual-classroom" as any,
      params: {
        classId: params.classId || "class-1",
        className,
        teacherName,
        topic,
      },
    });
  };

  if (sent) {
    return (
      <ScreenContainer edges={["top", "left", "right", "bottom"]}>
        <View style={styles.successContainer}>
          <View style={styles.successIcon}>
            <Ionicons name="checkmark-circle" size={80} color={Colors.success} />
          </View>
          <Text style={styles.successTitle}>You're Registered!</Text>
          <Text style={styles.successSubtitle}>
            {inviteMethod === "link"
              ? "Your invite link has been copied. Share it to join the class."
              : `Invite sent to your ${inviteMethod}. You'll get a reminder 15 min before class.`}
          </Text>

          <View style={styles.classCard}>
            <View style={styles.classCardRow}>
              <Ionicons name="book" size={18} color={Colors.secondary} />
              <Text style={styles.classCardLabel}>{className}</Text>
            </View>
            <View style={styles.classCardRow}>
              <Ionicons name="person" size={16} color={Colors.textSecondary} />
              <Text style={styles.classCardValue}>{teacherName}</Text>
            </View>
            <View style={styles.classCardRow}>
              <Ionicons name="calendar" size={16} color={Colors.textSecondary} />
              <Text style={styles.classCardValue}>{dateTime}</Text>
            </View>
            <View style={styles.classCardRow}>
              <Ionicons name="time" size={16} color={Colors.textSecondary} />
              <Text style={styles.classCardValue}>{duration}</Text>
            </View>
            <View style={styles.classCardRow}>
              <Ionicons name="chatbubble" size={16} color={Colors.textSecondary} />
              <Text style={styles.classCardValue}>{topic}</Text>
            </View>
          </View>

          {addToCalendar && (
            <View style={styles.calendarNote}>
              <Ionicons name="calendar" size={16} color={Colors.success} />
              <Text style={styles.calendarNoteText}>Added to your calendar with a 15-min reminder</Text>
            </View>
          )}

          <TouchableOpacity style={styles.primaryBtn} onPress={handleJoinNow}>
            <Ionicons name="videocam" size={20} color={Colors.primary} />
            <Text style={styles.primaryBtnText}>Join Class Now</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.secondaryBtn} onPress={() => router.back()}>
            <Text style={styles.secondaryBtnText}>Back to Schedule</Text>
          </TouchableOpacity>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer edges={["top", "left", "right"]}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Join Class</Text>
        </View>

        {/* Class Info */}
        <View style={styles.classInfo}>
          <View style={styles.classTypeChip}>
            <Ionicons name={classType === "group" ? "people" : "person"} size={14} color={Colors.secondary} />
            <Text style={styles.classTypeText}>{classType === "group" ? "Group Class" : "1-on-1 Session"}</Text>
          </View>
          <Text style={styles.classTitle}>{className}</Text>
          <Text style={styles.classTeacher}>with {teacherName}</Text>

          <View style={styles.detailsRow}>
            <View style={styles.detailItem}>
              <Ionicons name="calendar" size={16} color={Colors.textSecondary} />
              <Text style={styles.detailText}>{dateTime}</Text>
            </View>
            <View style={styles.detailItem}>
              <Ionicons name="time" size={16} color={Colors.textSecondary} />
              <Text style={styles.detailText}>{duration}</Text>
            </View>
          </View>

          <View style={styles.topicRow}>
            <Ionicons name="chatbubble-ellipses" size={14} color={Colors.secondary} />
            <Text style={styles.topicLabel}>Topic: {topic}</Text>
          </View>
        </View>

        {/* Invite Method */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>How would you like to receive the invite?</Text>
          <Text style={styles.sectionDesc}>Like Microsoft Teams, you'll get a join link and calendar event</Text>

          <View style={styles.methodRow}>
            {([
              { id: "email", icon: "mail", label: "Email" },
              { id: "sms", icon: "chatbubble", label: "SMS" },
              { id: "link", icon: "link", label: "Copy Link" },
            ] as const).map((m) => (
              <TouchableOpacity
                key={m.id}
                style={[styles.methodChip, inviteMethod === m.id && styles.methodChipActive]}
                onPress={() => setInviteMethod(m.id)}
              >
                <Ionicons name={m.icon as any} size={18} color={inviteMethod === m.id ? Colors.primary : Colors.textSecondary} />
                <Text style={[styles.methodLabel, inviteMethod === m.id && styles.methodLabelActive]}>{m.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {inviteMethod === "email" && (
            <TextInput
              style={styles.textInput}
              placeholder="your@email.com"
              placeholderTextColor={Colors.textSecondary}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              returnKeyType="done"
            />
          )}

          {inviteMethod === "sms" && (
            <TextInput
              style={styles.textInput}
              placeholder="+1 (555) 123-4567"
              placeholderTextColor={Colors.textSecondary}
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              returnKeyType="done"
            />
          )}

          {inviteMethod === "link" && (
            <View style={styles.linkPreview}>
              <Ionicons name="link" size={16} color={Colors.secondary} />
              <Text style={styles.linkText}>connectworld.ai/class/join/{params.classId || "abc123"}</Text>
            </View>
          )}
        </View>

        {/* Options */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Options</Text>

          <TouchableOpacity style={styles.optionRow} onPress={() => setAddToCalendar(!addToCalendar)}>
            <Ionicons name="calendar" size={20} color={addToCalendar ? Colors.secondary : Colors.textSecondary} />
            <View style={{ flex: 1 }}>
              <Text style={styles.optionLabel}>Add to Calendar</Text>
              <Text style={styles.optionDesc}>Create a calendar event with join link</Text>
            </View>
            <Ionicons name={addToCalendar ? "checkbox" : "square-outline"} size={22} color={addToCalendar ? Colors.secondary : Colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.optionRow} onPress={() => setReminderSet(!reminderSet)}>
            <Ionicons name="notifications" size={20} color={reminderSet ? Colors.secondary : Colors.textSecondary} />
            <View style={{ flex: 1 }}>
              <Text style={styles.optionLabel}>15-min Reminder</Text>
              <Text style={styles.optionDesc}>Push notification before class starts</Text>
            </View>
            <Ionicons name={reminderSet ? "checkbox" : "square-outline"} size={22} color={reminderSet ? Colors.secondary : Colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Action */}
        <TouchableOpacity style={styles.primaryBtn} onPress={handleSendInvite}>
          <Ionicons name={inviteMethod === "link" ? "copy" : "send"} size={20} color={Colors.primary} />
          <Text style={styles.primaryBtnText}>
            {inviteMethod === "link" ? "Copy Invite Link" : `Send to ${inviteMethod === "email" ? "Email" : "Phone"}`}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scrollContent: { paddingBottom: 100 },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: Spacing.md, paddingVertical: Spacing.md },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.surface, alignItems: "center", justifyContent: "center" },
  headerTitle: { flex: 1, fontSize: FontSize.lg, fontWeight: "700", color: Colors.text, marginLeft: 12 },
  classInfo: { marginHorizontal: Spacing.md, marginBottom: Spacing.xl, backgroundColor: Colors.surface, borderRadius: BorderRadius.xl, padding: Spacing.lg, borderWidth: 1, borderColor: Colors.border },
  classTypeChip: { flexDirection: "row", alignItems: "center", gap: 6, alignSelf: "flex-start", backgroundColor: Colors.secondary + "15", paddingHorizontal: 10, paddingVertical: 4, borderRadius: BorderRadius.full, marginBottom: 10 },
  classTypeText: { fontSize: FontSize.xs, color: Colors.secondary, fontWeight: "600" },
  classTitle: { fontSize: FontSize.xl, fontWeight: "700", color: Colors.text, marginBottom: 4 },
  classTeacher: { fontSize: FontSize.md, color: Colors.textSecondary, marginBottom: 12 },
  detailsRow: { flexDirection: "row", gap: 20, marginBottom: 10 },
  detailItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  detailText: { fontSize: FontSize.sm, color: Colors.textSecondary },
  topicRow: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: Colors.secondary + "08", paddingHorizontal: 10, paddingVertical: 6, borderRadius: BorderRadius.md },
  topicLabel: { fontSize: FontSize.sm, color: Colors.secondary, fontWeight: "500" },
  section: { marginHorizontal: Spacing.md, marginBottom: Spacing.xl },
  sectionTitle: { fontSize: FontSize.md, fontWeight: "700", color: Colors.text, marginBottom: 4 },
  sectionDesc: { fontSize: FontSize.sm, color: Colors.textSecondary, marginBottom: 12 },
  methodRow: { flexDirection: "row", gap: 10, marginBottom: 14 },
  methodChip: { flex: 1, alignItems: "center", gap: 6, paddingVertical: 12, backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, borderWidth: 1.5, borderColor: Colors.border },
  methodChipActive: { borderColor: Colors.secondary, backgroundColor: Colors.secondary },
  methodLabel: { fontSize: FontSize.xs, fontWeight: "600", color: Colors.textSecondary },
  methodLabelActive: { color: Colors.primary },
  textInput: { backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, paddingHorizontal: 16, paddingVertical: 14, fontSize: FontSize.md, color: Colors.text, borderWidth: 1, borderColor: Colors.border },
  linkPreview: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, paddingHorizontal: 14, paddingVertical: 12, borderWidth: 1, borderColor: Colors.border },
  linkText: { fontSize: FontSize.sm, color: Colors.text, flex: 1 },
  optionRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 14, borderBottomWidth: 0.5, borderBottomColor: Colors.border },
  optionLabel: { fontSize: FontSize.md, fontWeight: "600", color: Colors.text },
  optionDesc: { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 2 },
  primaryBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: Colors.secondary, marginHorizontal: Spacing.md, paddingVertical: 16, borderRadius: BorderRadius.full },
  primaryBtnText: { fontSize: FontSize.md, fontWeight: "700", color: Colors.primary },
  secondaryBtn: { alignItems: "center", paddingVertical: 14 },
  secondaryBtnText: { fontSize: FontSize.md, color: Colors.textSecondary },
  successContainer: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: Spacing.xl },
  successIcon: { marginBottom: Spacing.lg },
  successTitle: { fontSize: FontSize.xxl, fontWeight: "700", color: Colors.text, marginBottom: 8 },
  successSubtitle: { fontSize: FontSize.md, color: Colors.textSecondary, textAlign: "center", lineHeight: 22, marginBottom: Spacing.xl },
  classCard: { width: "100%", backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, padding: Spacing.lg, gap: 10, marginBottom: Spacing.lg, borderWidth: 1, borderColor: Colors.border },
  classCardRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  classCardLabel: { fontSize: FontSize.md, fontWeight: "600", color: Colors.text },
  classCardValue: { fontSize: FontSize.sm, color: Colors.textSecondary },
  calendarNote: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: Spacing.lg },
  calendarNoteText: { fontSize: FontSize.sm, color: Colors.success },
});
