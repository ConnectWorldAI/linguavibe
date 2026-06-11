import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Colors, Spacing, BorderRadius, FontSize } from "../constants/Colors";

const UPCOMING_CLASSES = [
  {
    id: "1",
    title: "Dominican Spanish: Beginner",
    teacher: "Sophia Martinez",
    teacherFlag: "🇩🇴",
    time: "Today, 7:00 PM EST",
    duration: "45 min",
    students: 8,
    maxStudents: 15,
    topic: "Ordering food at a restaurant",
    enrolled: true,
  },
  {
    id: "2",
    title: "Colombian Spanish: Intermediate",
    teacher: "Carlos Restrepo",
    teacherFlag: "🇨🇴",
    time: "Today, 9:00 PM EST",
    duration: "60 min",
    students: 12,
    maxStudents: 15,
    topic: "Paisa slang & street expressions",
    enrolled: false,
  },
  {
    id: "3",
    title: "French: Beginner",
    teacher: "Marie Dubois",
    teacherFlag: "🇫🇷",
    time: "Tomorrow, 10:00 AM EST",
    duration: "45 min",
    students: 6,
    maxStudents: 20,
    topic: "Introducing yourself in Paris",
    enrolled: true,
  },
  {
    id: "4",
    title: "Mandarin: Beginner",
    teacher: "Wei Chen",
    teacherFlag: "🇨🇳",
    time: "Tomorrow, 2:00 PM EST",
    duration: "60 min",
    students: 14,
    maxStudents: 15,
    topic: "Tones practice with music",
    enrolled: false,
  },
  {
    id: "5",
    title: "Yoruba: Beginner",
    teacher: "Amara Okafor",
    teacherFlag: "🇳🇬",
    time: "Wed, 6:00 PM EST",
    duration: "45 min",
    students: 4,
    maxStudents: 20,
    topic: "Greetings and family words",
    enrolled: false,
  },
  {
    id: "6",
    title: "Japanese: Pop Culture",
    teacher: "Yuki Tanaka",
    teacherFlag: "🇯🇵",
    time: "Thu, 8:00 PM EST",
    duration: "60 min",
    students: 18,
    maxStudents: 20,
    topic: "Learn Japanese through anime dialogue",
    enrolled: false,
  },
];

const MY_SCHEDULE = UPCOMING_CLASSES.filter((c) => c.enrolled);

export default function ClassScheduleScreen() {
  const [tab, setTab] = useState<"upcoming" | "my_classes" | "private">("upcoming");

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Classes</Text>
          <TouchableOpacity>
            <Ionicons name="calendar" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
        </View>

        {/* Tab Switcher */}
        <View style={styles.tabRow}>
          {[
            { key: "upcoming", label: "Browse" },
            { key: "my_classes", label: "My Classes" },
            { key: "private", label: "Private" },
          ].map((t) => (
            <TouchableOpacity
              key={t.key}
              style={[styles.tab, tab === t.key && styles.tabActive]}
              onPress={() => setTab(t.key as any)}
            >
              <Text
                style={[styles.tabText, tab === t.key && styles.tabTextActive]}
              >
                {t.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Content */}
        {tab === "upcoming" && (
          <>
            <Text style={styles.sectionTitle}>Upcoming Group Classes</Text>
            <Text style={styles.sectionSubtitle}>
              Join a live class with other learners worldwide
            </Text>
            {UPCOMING_CLASSES.map((cls) => (
              <View key={cls.id} style={styles.classCard}>
                <View style={styles.classHeader}>
                  <Text style={styles.classFlag}>{cls.teacherFlag}</Text>
                  <View style={styles.classHeaderInfo}>
                    <Text style={styles.classTitle}>{cls.title}</Text>
                    <Text style={styles.classTeacher}>with {cls.teacher}</Text>
                  </View>
                  {cls.enrolled && (
                    <View style={styles.enrolledBadge}>
                      <Text style={styles.enrolledText}>Enrolled</Text>
                    </View>
                  )}
                </View>

                <View style={styles.classDetails}>
                  <View style={styles.classDetail}>
                    <Ionicons name="time" size={14} color={Colors.textSecondary} />
                    <Text style={styles.classDetailText}>{cls.time}</Text>
                  </View>
                  <View style={styles.classDetail}>
                    <Ionicons name="hourglass" size={14} color={Colors.textSecondary} />
                    <Text style={styles.classDetailText}>{cls.duration}</Text>
                  </View>
                  <View style={styles.classDetail}>
                    <Ionicons name="people" size={14} color={Colors.textSecondary} />
                    <Text style={styles.classDetailText}>
                      {cls.students}/{cls.maxStudents} students
                    </Text>
                  </View>
                </View>

                <View style={styles.topicRow}>
                  <Ionicons name="book" size={14} color={Colors.secondary} />
                  <Text style={styles.topicText}>{cls.topic}</Text>
                </View>

                <TouchableOpacity
                  style={[
                    styles.joinButton,
                    cls.enrolled && styles.joinButtonEnrolled,
                  ]}
                  onPress={() => {
                    if (cls.enrolled) router.push("/classroom");
                  }}
                >
                  <Text style={styles.joinButtonText}>
                    {cls.enrolled ? "Join Class" : "Sign Up"}
                  </Text>
                </TouchableOpacity>
              </View>
            ))}
          </>
        )}

        {tab === "my_classes" && (
          <>
            <Text style={styles.sectionTitle}>My Enrolled Classes</Text>
            {MY_SCHEDULE.length > 0 ? (
              MY_SCHEDULE.map((cls) => (
                <View key={cls.id} style={styles.classCard}>
                  <View style={styles.classHeader}>
                    <Text style={styles.classFlag}>{cls.teacherFlag}</Text>
                    <View style={styles.classHeaderInfo}>
                      <Text style={styles.classTitle}>{cls.title}</Text>
                      <Text style={styles.classTeacher}>with {cls.teacher}</Text>
                    </View>
                  </View>
                  <View style={styles.classDetails}>
                    <View style={styles.classDetail}>
                      <Ionicons name="time" size={14} color={Colors.textSecondary} />
                      <Text style={styles.classDetailText}>{cls.time}</Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={styles.joinButton}
                    onPress={() => router.push("/classroom")}
                  >
                    <Text style={styles.joinButtonText}>Join Class</Text>
                  </TouchableOpacity>
                </View>
              ))
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="calendar-outline" size={48} color={Colors.textSecondary} />
                <Text style={styles.emptyText}>No classes enrolled yet</Text>
              </View>
            )}
          </>
        )}

        {tab === "private" && (
          <>
            <Text style={styles.sectionTitle}>Private Tutoring</Text>
            <Text style={styles.sectionSubtitle}>
              Book a 1-on-1 session with any teacher
            </Text>

            {/* Quick Book */}
            <View style={styles.quickBookCard}>
              <Ionicons name="flash" size={24} color={Colors.warning} />
              <View style={styles.quickBookInfo}>
                <Text style={styles.quickBookTitle}>Instant Tutoring</Text>
                <Text style={styles.quickBookSubtitle}>
                  Connect with an available teacher now
                </Text>
              </View>
              <TouchableOpacity
                style={styles.quickBookButton}
                onPress={() => router.push({ pathname: "/hume-call", params: { mode: "cloudwave", persona: "cloudwave" } } as any)}
              >
                <Text style={styles.quickBookButtonText}>Start</Text>
              </TouchableOpacity>
            </View>

            {/* Schedule Options */}
            <Text style={styles.scheduleLabel}>Schedule a Session</Text>
            {[
              { duration: "15 min", credits: "15 credits", desc: "Quick practice" },
              { duration: "30 min", credits: "25 credits", desc: "Standard session" },
              { duration: "60 min", credits: "45 credits", desc: "Deep dive" },
            ].map((option, index) => (
              <TouchableOpacity key={index} style={styles.scheduleOption}>
                <View style={styles.scheduleOptionInfo}>
                  <Text style={styles.scheduleOptionDuration}>{option.duration}</Text>
                  <Text style={styles.scheduleOptionDesc}>{option.desc}</Text>
                </View>
                <View style={styles.scheduleOptionPrice}>
                  <Text style={styles.scheduleOptionCredits}>{option.credits}</Text>
                  <Ionicons name="chevron-forward" size={16} color={Colors.textSecondary} />
                </View>
              </TouchableOpacity>
            ))}

            {/* Tutoring Packs */}
            <Text style={styles.scheduleLabel}>Tutoring Packs</Text>
            <View style={styles.packsRow}>
              {[
                { hours: "1 hr", price: "$9.99", save: "" },
                { hours: "5 hrs", price: "$39.99", save: "Save 20%" },
                { hours: "10 hrs", price: "$69.99", save: "Save 30%" },
              ].map((pack, index) => (
                <TouchableOpacity key={index} style={styles.packCard}>
                  {pack.save ? (
                    <View style={styles.packSaveBadge}>
                      <Text style={styles.packSaveText}>{pack.save}</Text>
                    </View>
                  ) : null}
                  <Text style={styles.packHours}>{pack.hours}</Text>
                  <Text style={styles.packPrice}>{pack.price}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  headerTitle: {
    fontSize: FontSize.lg,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  tabRow: {
    flexDirection: "row",
    marginHorizontal: Spacing.lg,
    backgroundColor: Colors.surfaceCard,
    borderRadius: BorderRadius.md,
    padding: 4,
    marginBottom: Spacing.lg,
  },
  tab: {
    flex: 1,
    paddingVertical: Spacing.sm + 2,
    alignItems: "center",
    borderRadius: BorderRadius.sm,
  },
  tabActive: {
    backgroundColor: Colors.secondary,
  },
  tabText: {
    fontSize: FontSize.sm,
    fontWeight: "600",
    color: Colors.textSecondary,
  },
  tabTextActive: {
    color: Colors.textPrimary,
  },
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: "700",
    color: Colors.textPrimary,
    paddingHorizontal: Spacing.lg,
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  classCard: {
    backgroundColor: Colors.surfaceCard,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
  },
  classHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.md,
    gap: 12,
  },
  classFlag: {
    fontSize: 28,
  },
  classHeaderInfo: {
    flex: 1,
  },
  classTitle: {
    fontSize: FontSize.md,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  classTeacher: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  enrolledBadge: {
    backgroundColor: Colors.success + "20",
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  enrolledText: {
    fontSize: FontSize.xs,
    color: Colors.success,
    fontWeight: "700",
  },
  classDetails: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.md,
    marginBottom: Spacing.sm,
  },
  classDetail: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  classDetailText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  topicRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: Spacing.md,
    backgroundColor: Colors.secondary + "10",
    padding: Spacing.sm,
    borderRadius: BorderRadius.sm,
  },
  topicText: {
    fontSize: FontSize.sm,
    color: Colors.secondary,
    fontWeight: "500",
  },
  joinButton: {
    backgroundColor: Colors.secondary,
    paddingVertical: Spacing.sm + 2,
    borderRadius: BorderRadius.md,
    alignItems: "center",
  },
  joinButtonEnrolled: {
    backgroundColor: Colors.success,
  },
  joinButtonText: {
    fontSize: FontSize.sm,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: Spacing.xl * 2,
    gap: Spacing.md,
  },
  emptyText: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
  },
  quickBookCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surfaceCard,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.warning + "40",
    gap: 12,
  },
  quickBookInfo: {
    flex: 1,
  },
  quickBookTitle: {
    fontSize: FontSize.md,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  quickBookSubtitle: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  quickBookButton: {
    backgroundColor: Colors.warning,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  quickBookButtonText: {
    fontSize: FontSize.sm,
    fontWeight: "700",
    color: Colors.primary,
  },
  scheduleLabel: {
    fontSize: FontSize.md,
    fontWeight: "700",
    color: Colors.textPrimary,
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    marginTop: Spacing.md,
  },
  scheduleOption: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surfaceCard,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
  },
  scheduleOptionInfo: {
    flex: 1,
  },
  scheduleOptionDuration: {
    fontSize: FontSize.md,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  scheduleOptionDesc: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  scheduleOptionPrice: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  scheduleOptionCredits: {
    fontSize: FontSize.sm,
    color: Colors.secondary,
    fontWeight: "600",
  },
  packsRow: {
    flexDirection: "row",
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
  },
  packCard: {
    flex: 1,
    backgroundColor: Colors.surfaceCard,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    alignItems: "center",
    position: "relative",
  },
  packSaveBadge: {
    position: "absolute",
    top: -8,
    backgroundColor: Colors.success,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  packSaveText: {
    fontSize: 9,
    fontWeight: "800",
    color: Colors.textPrimary,
  },
  packHours: {
    fontSize: FontSize.lg,
    fontWeight: "800",
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  packPrice: {
    fontSize: FontSize.md,
    fontWeight: "600",
    color: Colors.secondary,
  },
});
