import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";

type ClassSession = {
  id: string;
  title: string;
  teacher: string;
  teacherAvatar: string;
  language: string;
  level: string;
  time: string;
  date: string;
  duration: string;
  spotsLeft: number;
  maxSpots: number;
  price: string;
  topics: string[];
  enrolled: boolean;
};

const CLASSES: ClassSession[] = [
  { id: "1", title: "Restaurant Conversations", teacher: "Prof. García", teacherAvatar: "👨🏽‍🏫", language: "Spanish", level: "A2", time: "7:00 PM", date: "Today", duration: "45 min", spotsLeft: 2, maxSpots: 5, price: "Free", topics: ["Ordering food", "Asking for the bill", "Dietary restrictions"], enrolled: true },
  { id: "2", title: "Business French", teacher: "Mme. Dubois", teacherAvatar: "👩🏻‍🏫", language: "French", level: "B1", time: "6:00 PM", date: "Tomorrow", duration: "60 min", spotsLeft: 3, maxSpots: 5, price: "Free", topics: ["Email etiquette", "Meeting vocabulary", "Presentations"], enrolled: false },
  { id: "3", title: "JLPT N3 Prep", teacher: "Tanaka-sensei", teacherAvatar: "👨🏻‍🏫", language: "Japanese", level: "B2", time: "8:00 PM", date: "Wed", duration: "60 min", spotsLeft: 1, maxSpots: 5, price: "$2.99", topics: ["Grammar patterns", "Reading comprehension", "Listening practice"], enrolled: false },
  { id: "4", title: "Travel Korean Basics", teacher: "Kim Seonbae", teacherAvatar: "👩🏻‍🏫", language: "Korean", level: "A1", time: "5:00 PM", date: "Thu", duration: "30 min", spotsLeft: 4, maxSpots: 5, price: "Free", topics: ["Greetings", "Directions", "Shopping phrases"], enrolled: false },
  { id: "5", title: "Advanced Subjunctive", teacher: "Prof. García", teacherAvatar: "👨🏽‍🏫", language: "Spanish", level: "C1", time: "9:00 PM", date: "Fri", duration: "45 min", spotsLeft: 0, maxSpots: 5, price: "$2.99", topics: ["Subjunctive triggers", "Contrary-to-fact", "Emotional expressions"], enrolled: false },
];

export default function GroupClassScreen() {
  const colors = useColors();
  const [filter, setFilter] = useState<"all" | "enrolled" | "available">("all");

  const filtered = CLASSES.filter((c) => {
    if (filter === "enrolled") return c.enrolled;
    if (filter === "available") return !c.enrolled && c.spotsLeft > 0;
    return true;
  });

  return (
    <ScreenContainer edges={["top", "left", "right"]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Group Classes</Text>
        <TouchableOpacity>
          <Ionicons name="calendar" size={20} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Filters */}
      <View style={[styles.filterRow, { borderBottomColor: colors.border }]}>
        {(["all", "enrolled", "available"] as const).map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterBtn, { backgroundColor: filter === f ? colors.primary + "15" : "transparent", borderColor: filter === f ? colors.primary : "transparent" }]}
            onPress={() => {
              if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setFilter(f);
            }}
          >
            <Text style={[styles.filterText, { color: filter === f ? colors.primary : colors.muted }]}>
              {f === "all" ? "All" : f === "enrolled" ? "My Classes" : "Available"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {filtered.map((cls) => (
          <View key={cls.id} style={[styles.classCard, { backgroundColor: colors.surface, borderColor: cls.enrolled ? colors.primary + "40" : colors.border }]}>
            {/* Class Header */}
            <View style={styles.classHeader}>
              <View style={styles.classLeft}>
                <Text style={styles.teacherAvatar}>{cls.teacherAvatar}</Text>
                <View>
                  <Text style={[styles.classTitle, { color: colors.foreground }]}>{cls.title}</Text>
                  <Text style={[styles.classMeta, { color: colors.muted }]}>{cls.teacher} • {cls.language} {cls.level}</Text>
                </View>
              </View>
              {cls.enrolled && (
                <View style={[styles.enrolledBadge, { backgroundColor: colors.primary + "15" }]}>
                  <Ionicons name="checkmark-circle" size={12} color={colors.primary} />
                  <Text style={[styles.enrolledText, { color: colors.primary }]}>Enrolled</Text>
                </View>
              )}
            </View>

            {/* Schedule */}
            <View style={[styles.scheduleRow, { backgroundColor: colors.background, borderColor: colors.border }]}>
              <View style={styles.scheduleItem}>
                <Ionicons name="calendar-outline" size={14} color={colors.muted} />
                <Text style={[styles.scheduleText, { color: colors.foreground }]}>{cls.date}</Text>
              </View>
              <View style={styles.scheduleItem}>
                <Ionicons name="time-outline" size={14} color={colors.muted} />
                <Text style={[styles.scheduleText, { color: colors.foreground }]}>{cls.time}</Text>
              </View>
              <View style={styles.scheduleItem}>
                <Ionicons name="hourglass-outline" size={14} color={colors.muted} />
                <Text style={[styles.scheduleText, { color: colors.foreground }]}>{cls.duration}</Text>
              </View>
            </View>

            {/* Topics */}
            <View style={styles.topicsRow}>
              {cls.topics.map((topic, i) => (
                <View key={i} style={[styles.topicChip, { backgroundColor: colors.primary + "10" }]}>
                  <Text style={[styles.topicText, { color: colors.primary }]}>{topic}</Text>
                </View>
              ))}
            </View>

            {/* Footer */}
            <View style={styles.classFooter}>
              <View style={styles.footerLeft}>
                <View style={[styles.spotsBadge, { backgroundColor: cls.spotsLeft === 0 ? "#F8717115" : "#4ADE8015" }]}>
                  <Text style={[styles.spotsText, { color: cls.spotsLeft === 0 ? "#F87171" : "#4ADE80" }]}>
                    {cls.spotsLeft === 0 ? "Full" : `${cls.spotsLeft} spots left`}
                  </Text>
                </View>
                <Text style={[styles.priceText, { color: cls.price === "Free" ? colors.success : colors.foreground }]}>{cls.price}</Text>
              </View>
              {!cls.enrolled && cls.spotsLeft > 0 && (
                <TouchableOpacity
                  style={[styles.enrollBtn, { backgroundColor: colors.primary }]}
                  onPress={() => {
                    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  }}
                >
                  <Text style={styles.enrollBtnText}>Enroll</Text>
                </TouchableOpacity>
              )}
              {cls.enrolled && (
                <TouchableOpacity style={[styles.joinBtn, { backgroundColor: colors.success }]}>
                  <Ionicons name="videocam" size={14} color="#FFF" />
                  <Text style={styles.joinBtnText}>Join</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        ))}
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 0.5 },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 17, fontWeight: "700" },
  filterRow: { flexDirection: "row", paddingHorizontal: 16, paddingVertical: 8, gap: 8, borderBottomWidth: 0.5 },
  filterBtn: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 16, borderWidth: 1 },
  filterText: { fontSize: 12, fontWeight: "700" },
  content: { padding: 16, paddingBottom: 100 },
  classCard: { padding: 14, borderRadius: 14, borderWidth: 1, marginBottom: 12 },
  classHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 },
  classLeft: { flexDirection: "row", alignItems: "center", gap: 10, flex: 1 },
  teacherAvatar: { fontSize: 28 },
  classTitle: { fontSize: 15, fontWeight: "700" },
  classMeta: { fontSize: 12, marginTop: 2 },
  enrolledBadge: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  enrolledText: { fontSize: 10, fontWeight: "700" },
  scheduleRow: { flexDirection: "row", justifyContent: "space-around", padding: 10, borderRadius: 8, borderWidth: 0.5, marginBottom: 10 },
  scheduleItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  scheduleText: { fontSize: 12, fontWeight: "600" },
  topicsRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 10 },
  topicChip: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  topicText: { fontSize: 11, fontWeight: "600" },
  classFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  footerLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
  spotsBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  spotsText: { fontSize: 11, fontWeight: "700" },
  priceText: { fontSize: 13, fontWeight: "700" },
  enrollBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  enrollBtnText: { fontSize: 13, fontWeight: "700", color: "#FFF" },
  joinBtn: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8 },
  joinBtnText: { fontSize: 13, fontWeight: "700", color: "#FFF" },
});
