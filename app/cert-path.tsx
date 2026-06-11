import React, { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

const Colors = {
  primary: "#0A0E1A",
  surface: "#141825",
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

const CERT_PATHS = [
  {
    id: "1",
    title: "Business Spanish B2",
    description: "Become fluent in professional Spanish for the workplace. Covers meetings, emails, presentations, and negotiations.",
    icon: "briefcase",
    color: "#FFD700",
    totalHours: 20,
    courses: [
      { id: "c1", title: "Spanish for the Workplace", duration: "4.5 hrs", lessons: 24, progress: 0.65, enrolled: true },
      { id: "c2", title: "Business Email & Phone Calls", duration: "3 hrs", lessons: 18, progress: 0.2, enrolled: true },
      { id: "c3", title: "Presentations & Negotiations", duration: "5 hrs", lessons: 28, progress: 0, enrolled: false },
      { id: "c4", title: "B2 Certification Exam Prep", duration: "7.5 hrs", lessons: 36, progress: 0, enrolled: false },
    ],
    skills: ["Professional vocabulary", "Email writing", "Phone etiquette", "Presentation skills", "Negotiation tactics"],
    certBenefits: ["LinkedIn-verified certificate", "Qualifies for bilingual job listings", "Recognized by 500+ employers"],
  },
  {
    id: "2",
    title: "JLPT N3 Japanese",
    description: "Prepare for the Japanese Language Proficiency Test N3 level. Covers reading, listening, grammar, and vocabulary.",
    icon: "school",
    color: "#FF6B6B",
    totalHours: 30,
    courses: [
      { id: "c5", title: "Kanji Mastery (N3 Level)", duration: "8 hrs", lessons: 40, progress: 0, enrolled: false },
      { id: "c6", title: "Grammar Patterns N3", duration: "6 hrs", lessons: 32, progress: 0, enrolled: false },
      { id: "c7", title: "Listening Comprehension", duration: "5 hrs", lessons: 24, progress: 0, enrolled: false },
      { id: "c8", title: "Reading & Vocabulary", duration: "6 hrs", lessons: 30, progress: 0, enrolled: false },
      { id: "c9", title: "JLPT N3 Mock Exams", duration: "5 hrs", lessons: 10, progress: 0, enrolled: false },
    ],
    skills: ["600+ Kanji", "Grammar patterns", "Listening skills", "Reading comprehension", "Test strategies"],
    certBenefits: ["JLPT N3 preparation certificate", "Qualifies for Japan work visa", "Recognized internationally"],
  },
  {
    id: "3",
    title: "DELF B1 French",
    description: "Achieve DELF B1 certification in French. Covers speaking, writing, reading, and listening at intermediate level.",
    icon: "ribbon",
    color: "#8B5CF6",
    totalHours: 15,
    courses: [
      { id: "c10", title: "French Conversation B1", duration: "4 hrs", lessons: 20, progress: 0, enrolled: false },
      { id: "c11", title: "Written Expression", duration: "4 hrs", lessons: 22, progress: 0, enrolled: false },
      { id: "c12", title: "DELF B1 Exam Strategies", duration: "7 hrs", lessons: 30, progress: 0, enrolled: false },
    ],
    skills: ["Conversational fluency", "Written expression", "Reading comprehension", "Listening skills", "Exam techniques"],
    certBenefits: ["DELF B1 preparation certificate", "Recognized in 175+ countries", "Required for French residency"],
  },
];

export default function CertPathScreen() {
  const router = useRouter();
  const [selectedPath, setSelectedPath] = useState(CERT_PATHS[0]);
  const [activeTab, setActiveTab] = useState<"courses" | "skills" | "benefits">("courses");

  const overallProgress =
    selectedPath.courses.reduce((sum, c) => sum + c.progress, 0) / selectedPath.courses.length;

  const handleSelectPath = (path: typeof CERT_PATHS[0]) => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedPath(path);
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Certification Paths</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Path Selector */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pathSelector}>
          {CERT_PATHS.map((path) => (
            <TouchableOpacity
              key={path.id}
              style={[styles.pathTab, selectedPath.id === path.id && { borderColor: path.color }]}
              onPress={() => handleSelectPath(path)}
              activeOpacity={0.7}
            >
              <View style={[styles.pathTabIcon, { backgroundColor: path.color + "20" }]}>
                <Ionicons name={path.icon as any} size={18} color={path.color} />
              </View>
              <Text style={[styles.pathTabTitle, selectedPath.id === path.id && { color: Colors.textPrimary }]}>
                {path.title}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Selected Path Hero */}
        <View style={[styles.pathHero, { borderColor: selectedPath.color + "40" }]}>
          <View style={[styles.pathHeroIcon, { backgroundColor: selectedPath.color + "20" }]}>
            <Ionicons name={selectedPath.icon as any} size={28} color={selectedPath.color} />
          </View>
          <Text style={styles.pathHeroTitle}>{selectedPath.title}</Text>
          <Text style={styles.pathHeroDesc}>{selectedPath.description}</Text>

          <View style={styles.pathStats}>
            <View style={styles.pathStat}>
              <Text style={styles.pathStatValue}>{selectedPath.courses.length}</Text>
              <Text style={styles.pathStatLabel}>Courses</Text>
            </View>
            <View style={styles.pathStat}>
              <Text style={styles.pathStatValue}>{selectedPath.totalHours}h</Text>
              <Text style={styles.pathStatLabel}>Total</Text>
            </View>
            <View style={styles.pathStat}>
              <Text style={[styles.pathStatValue, { color: selectedPath.color }]}>
                {Math.round(overallProgress * 100)}%
              </Text>
              <Text style={styles.pathStatLabel}>Done</Text>
            </View>
          </View>

          {overallProgress > 0 && (
            <View style={styles.pathProgressBar}>
              <View style={[styles.pathProgressFill, { width: `${overallProgress * 100}%`, backgroundColor: selectedPath.color }]} />
            </View>
          )}
        </View>

        {/* Tabs */}
        <View style={styles.tabRow}>
          {(["courses", "skills", "benefits"] as const).map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, activeTab === tab && styles.tabActive]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                {tab === "courses" ? "Courses" : tab === "skills" ? "Skills" : "Benefits"}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Tab Content */}
        <View style={styles.tabContent}>
          {activeTab === "courses" && (
            <>
              {selectedPath.courses.map((course, i) => (
                <TouchableOpacity
                  key={course.id}
                  style={styles.courseRow}
                  onPress={() => router.push("/course-detail" as any)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.courseNumber, course.progress > 0 && { backgroundColor: selectedPath.color + "20", borderColor: selectedPath.color + "40" }]}>
                    {course.progress >= 1 ? (
                      <Ionicons name="checkmark" size={14} color={selectedPath.color} />
                    ) : (
                      <Text style={[styles.courseNumberText, course.progress > 0 && { color: selectedPath.color }]}>
                        {i + 1}
                      </Text>
                    )}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.courseRowTitle}>{course.title}</Text>
                    <Text style={styles.courseRowMeta}>{course.lessons} lessons • {course.duration}</Text>
                    {course.progress > 0 && (
                      <View style={styles.courseRowProgress}>
                        <View style={[styles.courseRowProgressFill, { width: `${course.progress * 100}%`, backgroundColor: selectedPath.color }]} />
                      </View>
                    )}
                  </View>
                  {course.enrolled ? (
                    <View style={[styles.enrolledBadge, { backgroundColor: selectedPath.color + "20" }]}>
                      <Text style={[styles.enrolledBadgeText, { color: selectedPath.color }]}>Enrolled</Text>
                    </View>
                  ) : (
                    <Ionicons name="lock-closed" size={16} color={Colors.textMuted} />
                  )}
                </TouchableOpacity>
              ))}
            </>
          )}

          {activeTab === "skills" && (
            <View style={styles.skillsGrid}>
              {selectedPath.skills.map((skill, i) => (
                <View key={i} style={styles.skillChip}>
                  <Ionicons name="checkmark-circle" size={14} color={selectedPath.color} />
                  <Text style={styles.skillChipText}>{skill}</Text>
                </View>
              ))}
            </View>
          )}

          {activeTab === "benefits" && (
            <View>
              {selectedPath.certBenefits.map((benefit, i) => (
                <View key={i} style={styles.benefitRow}>
                  <View style={[styles.benefitIcon, { backgroundColor: selectedPath.color + "20" }]}>
                    <Ionicons name="ribbon" size={16} color={selectedPath.color} />
                  </View>
                  <Text style={styles.benefitText}>{benefit}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Bottom CTA */}
      <View style={styles.bottomCta}>
        <TouchableOpacity
          style={[styles.startPathBtn, { backgroundColor: selectedPath.color }]}
          activeOpacity={0.8}
          onPress={() => {
            if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            router.push("/course-detail" as any);
          }}
        >
          <Ionicons name="rocket" size={18} color="#FFFFFF" />
          <Text style={styles.startPathBtnText}>
            {overallProgress > 0 ? "Continue Path" : "Start Path"}
          </Text>
        </TouchableOpacity>
      </View>
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
  pathSelector: { paddingHorizontal: 16, marginBottom: 16 },
  pathTab: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: Colors.surface,
    marginRight: 10,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  pathTabIcon: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  pathTabTitle: { fontSize: 13, fontWeight: "700", color: Colors.textSecondary },
  pathHero: {
    marginHorizontal: 16,
    padding: 20,
    backgroundColor: Colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: "center",
    marginBottom: 20,
  },
  pathHeroIcon: { width: 56, height: 56, borderRadius: 28, alignItems: "center", justifyContent: "center", marginBottom: 12 },
  pathHeroTitle: { fontSize: 20, fontWeight: "800", color: Colors.textPrimary, marginBottom: 8 },
  pathHeroDesc: { fontSize: 13, color: Colors.textSecondary, textAlign: "center", lineHeight: 20, marginBottom: 16 },
  pathStats: { flexDirection: "row", gap: 30 },
  pathStat: { alignItems: "center" },
  pathStatValue: { fontSize: 20, fontWeight: "800", color: Colors.textPrimary },
  pathStatLabel: { fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  pathProgressBar: { width: "100%", height: 4, backgroundColor: "rgba(255,255,255,0.1)", borderRadius: 2, marginTop: 16, overflow: "hidden" },
  pathProgressFill: { height: "100%", borderRadius: 2 },
  tabRow: { flexDirection: "row", marginHorizontal: 16, marginBottom: 16, gap: 8 },
  tab: { flex: 1, paddingVertical: 10, alignItems: "center", borderRadius: 10, backgroundColor: Colors.surface },
  tabActive: { backgroundColor: Colors.glowSubtle, borderWidth: 1, borderColor: Colors.glowBorder },
  tabText: { fontSize: 13, fontWeight: "600", color: Colors.textMuted },
  tabTextActive: { color: Colors.secondary, fontWeight: "700" },
  tabContent: { paddingHorizontal: 16 },
  courseRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  courseNumber: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: Colors.surface,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  courseNumberText: { fontSize: 13, fontWeight: "700", color: Colors.textMuted },
  courseRowTitle: { fontSize: 14, fontWeight: "700", color: Colors.textPrimary },
  courseRowMeta: { fontSize: 12, color: Colors.textSecondary, marginTop: 3 },
  courseRowProgress: { height: 3, backgroundColor: "rgba(255,255,255,0.1)", borderRadius: 2, marginTop: 6, overflow: "hidden" },
  courseRowProgressFill: { height: "100%", borderRadius: 2 },
  enrolledBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  enrolledBadgeText: { fontSize: 10, fontWeight: "700" },
  skillsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  skillChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: Colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  skillChipText: { fontSize: 13, color: Colors.textPrimary, fontWeight: "600" },
  benefitRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 12 },
  benefitIcon: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  benefitText: { fontSize: 14, color: Colors.textPrimary, fontWeight: "600", flex: 1 },
  bottomCta: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: 34,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  startPathBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
    borderRadius: 30,
  },
  startPathBtnText: { fontSize: 16, fontWeight: "700", color: "#FFFFFF" },
});
