import React from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

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

interface InstructorCourse {
  id: string;
  title: string;
  students: number;
  rating: number;
  level: string;
  emoji: string;
}

const INSTRUCTOR_DATA = {
  name: "Prof. María García",
  avatar: "👩‍🏫",
  title: "Senior Language Instructor",
  location: "Santo Domingo, Dominican Republic",
  languages: ["Spanish (Native)", "English (C2)", "Portuguese (B2)"],
  bio: "María is a certified language instructor with over 8 years of experience teaching Spanish to international professionals. She specializes in business communication, technical vocabulary, and cultural fluency. Her teaching methodology combines immersive conversation practice with structured grammar foundations.",
  credentials: [
    { icon: "school", label: "M.A. Applied Linguistics — UASD" },
    { icon: "ribbon", label: "DELE C2 Certified Examiner" },
    { icon: "briefcase", label: "Corporate Language Trainer — 5 years" },
    { icon: "globe", label: "Taught students from 40+ countries" },
  ],
  stats: {
    students: 4500,
    courses: 12,
    reviews: 1280,
    rating: 4.9,
    yearsTeaching: 8,
  },
  courses: [
    { id: "1", title: "Spanish B2 Professional Communication", students: 1200, rating: 4.9, level: "Intermediate", emoji: "🇩🇴" },
    { id: "2", title: "Business Spanish for IT Professionals", students: 890, rating: 4.8, level: "Advanced", emoji: "💼" },
    { id: "3", title: "Spanish B1 Foundations", students: 1500, rating: 4.9, level: "Beginner", emoji: "📚" },
    { id: "4", title: "Medical Spanish Essentials", students: 420, rating: 4.7, level: "Intermediate", emoji: "🏥" },
    { id: "5", title: "Spanish Pronunciation Masterclass", students: 680, rating: 4.8, level: "All Levels", emoji: "🎙️" },
  ] as InstructorCourse[],
  specializations: ["Business Spanish", "Technical Vocabulary", "Pronunciation", "Cultural Fluency", "DELE Preparation"],
  testimonials: [
    { text: "María's teaching style made complex grammar feel natural. Best instructor I've had!", author: "James K.", rating: 5 },
    { text: "Her business Spanish course directly helped me land a promotion at my company.", author: "Sarah L.", rating: 5 },
    { text: "Patient, knowledgeable, and always provides real-world context for vocabulary.", author: "Michael R.", rating: 5 },
  ],
};

export default function InstructorBioScreen() {
  const router = useRouter();

  const handleCoursePress = (course: InstructorCourse) => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push("/course-detail" as any);
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Instructor Profile</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarEmoji}>{INSTRUCTOR_DATA.avatar}</Text>
            <View style={styles.verifiedBadge}>
              <Ionicons name="checkmark-circle" size={18} color={Colors.secondary} />
            </View>
          </View>
          <Text style={styles.instructorName}>{INSTRUCTOR_DATA.name}</Text>
          <Text style={styles.instructorTitle}>{INSTRUCTOR_DATA.title}</Text>
          <View style={styles.locationRow}>
            <Ionicons name="location" size={14} color={Colors.textMuted} />
            <Text style={styles.locationText}>{INSTRUCTOR_DATA.location}</Text>
          </View>

          {/* Languages */}
          <View style={styles.languagesRow}>
            {INSTRUCTOR_DATA.languages.map((lang, idx) => (
              <View key={idx} style={styles.langChip}>
                <Text style={styles.langChipText}>{lang}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{INSTRUCTOR_DATA.stats.students.toLocaleString()}</Text>
            <Text style={styles.statLabel}>Students</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{INSTRUCTOR_DATA.stats.courses}</Text>
            <Text style={styles.statLabel}>Courses</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statNumber, { color: Colors.gold }]}>{INSTRUCTOR_DATA.stats.rating}</Text>
            <Text style={styles.statLabel}>Rating</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{INSTRUCTOR_DATA.stats.yearsTeaching}+</Text>
            <Text style={styles.statLabel}>Years</Text>
          </View>
        </View>

        {/* Bio */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <Text style={styles.bioText}>{INSTRUCTOR_DATA.bio}</Text>
        </View>

        {/* Credentials */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Credentials</Text>
          {INSTRUCTOR_DATA.credentials.map((cred, idx) => (
            <View key={idx} style={styles.credentialRow}>
              <View style={styles.credentialIcon}>
                <Ionicons name={cred.icon as any} size={16} color={Colors.secondary} />
              </View>
              <Text style={styles.credentialText}>{cred.label}</Text>
            </View>
          ))}
        </View>

        {/* Specializations */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Specializations</Text>
          <View style={styles.specRow}>
            {INSTRUCTOR_DATA.specializations.map((spec, idx) => (
              <View key={idx} style={styles.specChip}>
                <Text style={styles.specChipText}>{spec}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Courses */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Courses ({INSTRUCTOR_DATA.courses.length})</Text>
          {INSTRUCTOR_DATA.courses.map((course) => (
            <TouchableOpacity
              key={course.id}
              style={styles.courseCard}
              activeOpacity={0.7}
              onPress={() => handleCoursePress(course)}
            >
              <View style={styles.courseEmoji}>
                <Text style={{ fontSize: 24 }}>{course.emoji}</Text>
              </View>
              <View style={styles.courseInfo}>
                <Text style={styles.courseTitle} numberOfLines={1}>{course.title}</Text>
                <View style={styles.courseMetaRow}>
                  <Text style={styles.courseMeta}>{course.level}</Text>
                  <Text style={styles.courseMetaDot}>•</Text>
                  <Ionicons name="people" size={11} color={Colors.textMuted} />
                  <Text style={styles.courseMeta}>{course.students.toLocaleString()}</Text>
                  <Text style={styles.courseMetaDot}>•</Text>
                  <Ionicons name="star" size={11} color={Colors.gold} />
                  <Text style={styles.courseMeta}>{course.rating}</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Testimonials */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Student Testimonials</Text>
          {INSTRUCTOR_DATA.testimonials.map((t, idx) => (
            <View key={idx} style={styles.testimonialCard}>
              <View style={styles.testimonialStars}>
                {Array.from({ length: t.rating }, (_, i) => (
                  <Ionicons key={i} name="star" size={12} color={Colors.gold} />
                ))}
              </View>
              <Text style={styles.testimonialText}>"{t.text}"</Text>
              <Text style={styles.testimonialAuthor}>— {t.author}</Text>
            </View>
          ))}
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
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: { fontSize: 18, fontWeight: "800", color: Colors.textPrimary },
  profileCard: {
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  avatarContainer: { position: "relative", marginBottom: 12 },
  avatarEmoji: { fontSize: 64 },
  verifiedBadge: {
    position: "absolute",
    bottom: 0,
    right: -4,
    backgroundColor: Colors.primary,
    borderRadius: 10,
    padding: 2,
  },
  instructorName: { fontSize: 22, fontWeight: "900", color: Colors.textPrimary, marginBottom: 4 },
  instructorTitle: { fontSize: 14, color: Colors.secondary, fontWeight: "600", marginBottom: 8 },
  locationRow: { flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 12 },
  locationText: { fontSize: 13, color: Colors.textMuted },
  languagesRow: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: 6 },
  langChip: {
    backgroundColor: Colors.glowSubtle,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: Colors.glowBorder,
  },
  langChipText: { fontSize: 11, fontWeight: "600", color: Colors.secondary },
  statsGrid: {
    flexDirection: "row",
    marginHorizontal: 20,
    gap: 8,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statNumber: { fontSize: 18, fontWeight: "900", color: Colors.textPrimary },
  statLabel: { fontSize: 10, color: Colors.textMuted, marginTop: 2, fontWeight: "600" },
  section: { paddingHorizontal: 20, marginBottom: 24 },
  sectionTitle: { fontSize: 16, fontWeight: "800", color: Colors.textPrimary, marginBottom: 12 },
  bioText: { fontSize: 14, color: Colors.textSecondary, lineHeight: 22 },
  credentialRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 10,
  },
  credentialIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: Colors.glowSubtle,
    alignItems: "center",
    justifyContent: "center",
  },
  credentialText: { fontSize: 13, color: Colors.textSecondary, flex: 1 },
  specRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  specChip: {
    backgroundColor: Colors.surface,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  specChipText: { fontSize: 12, fontWeight: "600", color: Colors.textSecondary },
  courseCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  courseEmoji: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.04)",
    alignItems: "center",
    justifyContent: "center",
  },
  courseInfo: { flex: 1, marginLeft: 12 },
  courseTitle: { fontSize: 13, fontWeight: "700", color: Colors.textPrimary },
  courseMetaRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 },
  courseMeta: { fontSize: 11, color: Colors.textMuted },
  courseMetaDot: { fontSize: 11, color: Colors.textMuted },
  testimonialCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  testimonialStars: { flexDirection: "row", gap: 2, marginBottom: 8 },
  testimonialText: { fontSize: 13, color: Colors.textSecondary, lineHeight: 20, fontStyle: "italic" },
  testimonialAuthor: { fontSize: 12, color: Colors.textMuted, marginTop: 8, fontWeight: "600" },
});
