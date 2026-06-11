import { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Platform } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";

type CourseStatus = "in_progress" | "completed" | "saved";

interface UserCourse {
  id: string;
  title: string;
  instructor: string;
  thumb: string;
  progress: number; // 0-100
  totalLessons: number;
  completedLessons: number;
  duration: string;
  lastAccessed: string;
  status: CourseStatus;
  level: string;
}

const MY_COURSES: UserCourse[] = [
  { id: "1", title: "Dominican Spanish: From Zero to Fluent", instructor: "Sophia Martinez", thumb: "\u{1F1E9}\u{1F1F4}", progress: 68, totalLessons: 42, completedLessons: 28, duration: "8 hrs", lastAccessed: "Today", status: "in_progress", level: "Beginner" },
  { id: "2", title: "Business Spanish for IT Professionals", instructor: "Sophia Martinez", thumb: "\u{1F4BC}", progress: 35, totalLessons: 24, completedLessons: 8, duration: "4.5 hrs", lastAccessed: "Yesterday", status: "in_progress", level: "Intermediate" },
  { id: "3", title: "Japanese for Anime Fans", instructor: "Yuki Tanaka", thumb: "\u{1F1EF}\u{1F1F5}", progress: 100, totalLessons: 30, completedLessons: 30, duration: "6 hrs", lastAccessed: "3 days ago", status: "completed", level: "Beginner" },
  { id: "4", title: "Mandarin Business Communication", instructor: "Wei Chen", thumb: "\u{1F1E8}\u{1F1F3}", progress: 12, totalLessons: 36, completedLessons: 4, duration: "7 hrs", lastAccessed: "1 week ago", status: "in_progress", level: "Intermediate" },
  { id: "5", title: "French for Healthcare Professionals", instructor: "Marie Dubois", thumb: "\u{1F1EB}\u{1F1F7}", progress: 0, totalLessons: 28, completedLessons: 0, duration: "5.5 hrs", lastAccessed: "Saved", status: "saved", level: "Advanced" },
  { id: "6", title: "Korean K-Pop & Drama Vocab", instructor: "Min-Ji Park", thumb: "\u{1F1F0}\u{1F1F7}", progress: 100, totalLessons: 22, completedLessons: 22, duration: "4 hrs", lastAccessed: "2 weeks ago", status: "completed", level: "Beginner" },
  { id: "7", title: "Portuguese for Travel in Brazil", instructor: "Ana Silva", thumb: "\u{1F1E7}\u{1F1F7}", progress: 0, totalLessons: 18, completedLessons: 0, duration: "3.5 hrs", lastAccessed: "Saved", status: "saved", level: "Beginner" },
];

type FilterTab = "all" | "in_progress" | "completed" | "saved";

export default function CourseLibraryScreen() {
  const router = useRouter();
  const colors = useColors();
  const [activeTab, setActiveTab] = useState<FilterTab>("all");

  const filteredCourses = MY_COURSES.filter((course) => {
    if (activeTab === "all") return true;
    return course.status === activeTab;
  });

  const inProgressCount = MY_COURSES.filter((c) => c.status === "in_progress").length;
  const completedCount = MY_COURSES.filter((c) => c.status === "completed").length;
  const savedCount = MY_COURSES.filter((c) => c.status === "saved").length;

  const handleCoursePress = (course: UserCourse) => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push("/course-detail" as any);
  };

  const getStatusColor = (status: CourseStatus) => {
    switch (status) {
      case "in_progress": return colors.primary;
      case "completed": return "#22C55E";
      case "saved": return colors.muted;
    }
  };

  const getStatusLabel = (status: CourseStatus) => {
    switch (status) {
      case "in_progress": return "In Progress";
      case "completed": return "Completed";
      case "saved": return "Saved";
    }
  };

  return (
    <ScreenContainer edges={["top", "left", "right"]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>My Courses</Text>
        <TouchableOpacity
          onPress={() => {
            if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.push("/course-catalog" as any);
          }}
          style={[styles.browseButton, { backgroundColor: colors.primary }]}
        >
          <Ionicons name="add" size={18} color="#FFFFFF" />
          <Text style={styles.browseButtonText}>Browse</Text>
        </TouchableOpacity>
      </View>

      {/* Stats Row */}
      <View style={[styles.statsRow, { backgroundColor: colors.surface }]}>
        <View style={styles.statItem}>
          <Text style={[styles.statNumber, { color: colors.primary }]}>{inProgressCount}</Text>
          <Text style={[styles.statLabel, { color: colors.muted }]}>In Progress</Text>
        </View>
        <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
        <View style={styles.statItem}>
          <Text style={[styles.statNumber, { color: "#22C55E" }]}>{completedCount}</Text>
          <Text style={[styles.statLabel, { color: colors.muted }]}>Completed</Text>
        </View>
        <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
        <View style={styles.statItem}>
          <Text style={[styles.statNumber, { color: colors.muted }]}>{savedCount}</Text>
          <Text style={[styles.statLabel, { color: colors.muted }]}>Saved</Text>
        </View>
      </View>

      {/* Filter Tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsContainer} contentContainerStyle={styles.tabsContent}>
        {([
          { key: "all", label: "All", count: MY_COURSES.length },
          { key: "in_progress", label: "In Progress", count: inProgressCount },
          { key: "completed", label: "Completed", count: completedCount },
          { key: "saved", label: "Saved", count: savedCount },
        ] as const).map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[
              styles.filterTab,
              {
                backgroundColor: activeTab === tab.key ? colors.primary : colors.surface,
                borderColor: activeTab === tab.key ? colors.primary : colors.border,
              },
            ]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Text style={[styles.filterTabText, { color: activeTab === tab.key ? "#FFFFFF" : colors.muted }]}>
              {tab.label} ({tab.count})
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Course List */}
      <ScrollView contentContainerStyle={styles.courseList}>
        {filteredCourses.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="book-outline" size={48} color={colors.muted} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No courses here yet</Text>
            <Text style={[styles.emptySubtitle, { color: colors.muted }]}>
              Browse our catalog to find courses that match your goals.
            </Text>
            <TouchableOpacity
              style={[styles.emptyButton, { backgroundColor: colors.primary }]}
              onPress={() => router.push("/course-catalog" as any)}
            >
              <Text style={styles.emptyButtonText}>Explore Courses</Text>
            </TouchableOpacity>
          </View>
        ) : (
          filteredCourses.map((course) => (
            <TouchableOpacity
              key={course.id}
              style={[styles.courseCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={() => handleCoursePress(course)}
              activeOpacity={0.7}
            >
              <View style={styles.courseCardTop}>
                <Text style={styles.courseThumb}>{course.thumb}</Text>
                <View style={styles.courseCardInfo}>
                  <Text style={[styles.courseTitle, { color: colors.foreground }]} numberOfLines={2}>
                    {course.title}
                  </Text>
                  <Text style={[styles.courseInstructor, { color: colors.muted }]}>
                    {course.instructor}
                  </Text>
                  <View style={styles.courseMeta}>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(course.status) + "20" }]}>
                      <Text style={[styles.statusBadgeText, { color: getStatusColor(course.status) }]}>
                        {getStatusLabel(course.status)}
                      </Text>
                    </View>
                    <Text style={[styles.courseLevel, { color: colors.muted }]}>{course.level}</Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.muted} />
              </View>

              {/* Progress Bar */}
              {course.status !== "saved" && (
                <View style={styles.progressSection}>
                  <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
                    <View
                      style={[
                        styles.progressFill,
                        {
                          backgroundColor: course.progress === 100 ? "#22C55E" : colors.primary,
                          width: `${course.progress}%`,
                        },
                      ]}
                    />
                  </View>
                  <View style={styles.progressMeta}>
                    <Text style={[styles.progressText, { color: colors.muted }]}>
                      {course.completedLessons}/{course.totalLessons} lessons
                    </Text>
                    <Text style={[styles.progressPercent, { color: course.progress === 100 ? "#22C55E" : colors.primary }]}>
                      {course.progress}%
                    </Text>
                  </View>
                </View>
              )}

              {/* Last Accessed */}
              <View style={styles.courseFooter}>
                <Ionicons name="time-outline" size={12} color={colors.muted} />
                <Text style={[styles.lastAccessed, { color: colors.muted }]}>{course.lastAccessed}</Text>
                {course.status === "in_progress" && (
                  <TouchableOpacity
                    style={[styles.continueBtn, { backgroundColor: colors.primary }]}
                    onPress={() => handleCoursePress(course)}
                  >
                    <Ionicons name="play" size={12} color="#FFFFFF" />
                    <Text style={styles.continueBtnText}>Continue</Text>
                  </TouchableOpacity>
                )}
              </View>
            </TouchableOpacity>
          ))
        )}
        <View style={{ height: 40 }} />
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    flex: 1,
    marginLeft: 12,
  },
  browseButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  browseButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "600",
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    borderRadius: 12,
  },
  statItem: {
    alignItems: "center",
    gap: 4,
  },
  statNumber: {
    fontSize: 22,
    fontWeight: "800",
  },
  statLabel: {
    fontSize: 12,
    fontWeight: "500",
  },
  statDivider: {
    width: 1,
    height: 30,
  },
  tabsContainer: {
    marginTop: 16,
    maxHeight: 44,
  },
  tabsContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterTab: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  filterTabText: {
    fontSize: 13,
    fontWeight: "600",
  },
  courseList: {
    padding: 16,
    gap: 12,
  },
  courseCard: {
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    gap: 10,
  },
  courseCardTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  courseThumb: {
    fontSize: 32,
  },
  courseCardInfo: {
    flex: 1,
    gap: 3,
  },
  courseTitle: {
    fontSize: 15,
    fontWeight: "600",
    lineHeight: 20,
  },
  courseInstructor: {
    fontSize: 12,
  },
  courseMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 4,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: "700",
  },
  courseLevel: {
    fontSize: 11,
  },
  progressSection: {
    gap: 6,
  },
  progressBar: {
    height: 5,
    borderRadius: 3,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 3,
  },
  progressMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  progressText: {
    fontSize: 11,
  },
  progressPercent: {
    fontSize: 11,
    fontWeight: "700",
  },
  courseFooter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  lastAccessed: {
    fontSize: 11,
    flex: 1,
  },
  continueBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    gap: 4,
  },
  continueBtnText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "600",
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 60,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: "center",
    paddingHorizontal: 40,
  },
  emptyButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    marginTop: 8,
  },
  emptyButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
});
