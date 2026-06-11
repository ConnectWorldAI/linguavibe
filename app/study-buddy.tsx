/**
 * Study Buddy Matching Screen
 * Pairs users with similar goals, schedules, and levels for
 * accountability check-ins and practice conversations.
 */
import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { ScreenContainer } from "@/components/screen-container";
import * as Haptics from "expo-haptics";

const Colors = {
  bg: "#0A0E1A",
  card: "#141B2D",
  cardBorder: "#1E293B",
  text: "#FFFFFF",
  textSecondary: "#94A3B8",
  textMuted: "#64748B",
  primary: "#00AAFF",
  warning: "#F59E0B",
  success: "#10B981",
  error: "#EF4444",
  purple: "#8B5CF6",
  orange: "#F97316",
  pink: "#EC4899",
};

interface StudyBuddy {
  id: string;
  name: string;
  avatar: string;
  level: string;
  language: string;
  nativeLanguage: string;
  timezone: string;
  timezoneMatch: boolean;
  compatibility: number;
  goals: string[];
  studyTime: string;
  streak: number;
  interests: string[];
  online: boolean;
}

const POTENTIAL_BUDDIES: StudyBuddy[] = [
  {
    id: "1",
    name: "Maria Santos",
    avatar: "MS",
    level: "B1",
    language: "Spanish",
    nativeLanguage: "Portuguese",
    timezone: "EST",
    timezoneMatch: true,
    compatibility: 94,
    goals: ["Business fluency", "DELE B2 cert"],
    studyTime: "Evenings (7-9 PM)",
    streak: 28,
    interests: ["Travel", "Business", "Music"],
    online: true,
  },
  {
    id: "2",
    name: "James Chen",
    avatar: "JC",
    level: "A2",
    language: "Spanish",
    nativeLanguage: "English",
    timezone: "PST",
    timezoneMatch: false,
    compatibility: 87,
    goals: ["Conversational fluency", "Travel prep"],
    studyTime: "Mornings (6-8 AM)",
    streak: 45,
    interests: ["Tech", "Gaming", "Food"],
    online: true,
  },
  {
    id: "3",
    name: "Aisha Johnson",
    avatar: "AJ",
    level: "B2",
    language: "Spanish",
    nativeLanguage: "English",
    timezone: "EST",
    timezoneMatch: true,
    compatibility: 91,
    goals: ["Job interviews", "Professional networking"],
    studyTime: "Lunch breaks (12-1 PM)",
    streak: 62,
    interests: ["Career", "Culture", "Podcasts"],
    online: false,
  },
  {
    id: "4",
    name: "Kenji Tanaka",
    avatar: "KT",
    level: "B1",
    language: "Spanish",
    nativeLanguage: "Japanese",
    timezone: "JST",
    timezoneMatch: false,
    compatibility: 78,
    goals: ["DELE B1 cert", "Cultural exchange"],
    studyTime: "Late night (10 PM-12 AM)",
    streak: 19,
    interests: ["Anime", "Cooking", "Languages"],
    online: true,
  },
  {
    id: "5",
    name: "Sophie Laurent",
    avatar: "SL",
    level: "A2",
    language: "Spanish",
    nativeLanguage: "French",
    timezone: "CET",
    timezoneMatch: false,
    compatibility: 82,
    goals: ["Travel fluency", "Making friends"],
    studyTime: "Afternoons (3-5 PM)",
    streak: 33,
    interests: ["Art", "Travel", "Wine"],
    online: false,
  },
];

export default function StudyBuddyScreen() {
  const [sentRequests, setSentRequests] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<"all" | "online" | "timezone">("all");

  const filteredBuddies = POTENTIAL_BUDDIES.filter((b) => {
    if (filter === "online") return b.online;
    if (filter === "timezone") return b.timezoneMatch;
    return true;
  });

  const handleSendRequest = (id: string) => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSentRequests((prev) => new Set(prev).add(id));
  };

  const compatColor = (score: number) =>
    score >= 90 ? Colors.success : score >= 80 ? Colors.primary : Colors.warning;

  return (
    <ScreenContainer edges={["top", "left", "right"]}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Study Buddies</Text>
          <View style={{ width: 36 }} />
        </View>

        {/* Intro */}
        <View style={styles.introCard}>
          <Ionicons name="people" size={28} color={Colors.primary} />
          <View style={{ flex: 1 }}>
            <Text style={styles.introTitle}>Find Your Accountability Partner</Text>
            <Text style={styles.introSub}>
              Get matched with learners who share your goals, schedule, and level for daily check-ins and practice.
            </Text>
          </View>
        </View>

        {/* My Buddy Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>0</Text>
            <Text style={styles.statLabel}>Active Buddies</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>0</Text>
            <Text style={styles.statLabel}>Practice Sessions</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>0</Text>
            <Text style={styles.statLabel}>Check-ins</Text>
          </View>
        </View>

        {/* Filters */}
        <View style={styles.filterRow}>
          {(["all", "online", "timezone"] as const).map((f) => (
            <TouchableOpacity
              key={f}
              style={[styles.filterChip, filter === f && styles.filterChipActive]}
              onPress={() => setFilter(f)}
              activeOpacity={0.8}
            >
              <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
                {f === "all" ? "All Matches" : f === "online" ? "Online Now" : "Same Timezone"}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Buddy Cards */}
        <Text style={styles.sectionTitle}>Recommended Matches</Text>
        {filteredBuddies.map((buddy) => (
          <View key={buddy.id} style={styles.buddyCard}>
            <View style={styles.buddyHeader}>
              <View style={styles.avatarWrap}>
                <Text style={styles.avatarText}>{buddy.avatar}</Text>
                {buddy.online && <View style={styles.onlineDot} />}
              </View>
              <View style={{ flex: 1 }}>
                <View style={styles.nameRow}>
                  <Text style={styles.buddyName}>{buddy.name}</Text>
                  <View style={[styles.compatBadge, { backgroundColor: compatColor(buddy.compatibility) + "20" }]}>
                    <Text style={[styles.compatText, { color: compatColor(buddy.compatibility) }]}>
                      {buddy.compatibility}% match
                    </Text>
                  </View>
                </View>
                <Text style={styles.buddyMeta}>
                  {buddy.level} {buddy.language} • Native {buddy.nativeLanguage}
                </Text>
              </View>
            </View>

            {/* Goals */}
            <View style={styles.goalsRow}>
              {buddy.goals.map((goal, idx) => (
                <View key={idx} style={styles.goalChip}>
                  <Text style={styles.goalChipText}>{goal}</Text>
                </View>
              ))}
            </View>

            {/* Details */}
            <View style={styles.detailsRow}>
              <View style={styles.detailItem}>
                <Ionicons name="time-outline" size={13} color={Colors.textMuted} />
                <Text style={styles.detailText}>{buddy.studyTime}</Text>
              </View>
              <View style={styles.detailItem}>
                <Ionicons name="flame" size={13} color={Colors.orange} />
                <Text style={styles.detailText}>{buddy.streak}d streak</Text>
              </View>
              {buddy.timezoneMatch && (
                <View style={styles.detailItem}>
                  <Ionicons name="globe-outline" size={13} color={Colors.success} />
                  <Text style={[styles.detailText, { color: Colors.success }]}>Same TZ</Text>
                </View>
              )}
            </View>

            {/* Interests */}
            <View style={styles.interestsRow}>
              {buddy.interests.map((interest, idx) => (
                <View key={idx} style={styles.interestChip}>
                  <Text style={styles.interestText}>{interest}</Text>
                </View>
              ))}
            </View>

            {/* Actions */}
            <View style={styles.actionsRow}>
              {sentRequests.has(buddy.id) ? (
                <View style={styles.sentBadge}>
                  <Ionicons name="checkmark" size={14} color={Colors.success} />
                  <Text style={styles.sentText}>Request Sent</Text>
                </View>
              ) : (
                <>
                  <TouchableOpacity
                    style={styles.connectBtn}
                    onPress={() => handleSendRequest(buddy.id)}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="person-add" size={14} color="#FFF" />
                    <Text style={styles.connectBtnText}>Connect</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.scheduleBtn} activeOpacity={0.8}>
                    <Ionicons name="calendar-outline" size={14} color={Colors.primary} />
                    <Text style={styles.scheduleBtnText}>Schedule Practice</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>
        ))}

        {/* How Buddies Help */}
        <View style={styles.benefitsSection}>
          <Text style={styles.sectionTitle}>How Buddies Help You Learn</Text>
          {[
            { icon: "chatbubbles", color: Colors.primary, title: "Daily Check-ins", desc: "Share progress and motivate each other" },
            { icon: "mic", color: Colors.purple, title: "Practice Conversations", desc: "Real speaking practice with a partner" },
            { icon: "trophy", color: Colors.warning, title: "Friendly Competition", desc: "Challenge each other with weekly goals" },
            { icon: "heart", color: Colors.pink, title: "Accountability", desc: "Someone notices when you skip a day" },
          ].map((benefit, idx) => (
            <View key={idx} style={styles.benefitItem}>
              <View style={[styles.benefitIcon, { backgroundColor: benefit.color + "15" }]}>
                <Ionicons name={benefit.icon as any} size={18} color={benefit.color} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.benefitTitle}>{benefit.title}</Text>
                <Text style={styles.benefitDesc}>{benefit.desc}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  content: { padding: 20 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.card,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: { fontSize: 18, fontWeight: "700", color: Colors.text },

  introCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.primary + "30",
  },
  introTitle: { fontSize: 15, fontWeight: "700", color: Colors.text },
  introSub: { fontSize: 12, color: Colors.textSecondary, marginTop: 4, lineHeight: 17 },

  statsRow: { flexDirection: "row", gap: 10, marginBottom: 16 },
  statCard: {
    flex: 1,
    alignItems: "center",
    backgroundColor: Colors.card,
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  statValue: { fontSize: 20, fontWeight: "800", color: Colors.text },
  statLabel: { fontSize: 10, color: Colors.textMuted, marginTop: 2 },

  filterRow: { flexDirection: "row", gap: 8, marginBottom: 16 },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  filterChipActive: { backgroundColor: Colors.primary + "20", borderColor: Colors.primary },
  filterText: { fontSize: 12, fontWeight: "600", color: Colors.textMuted },
  filterTextActive: { color: Colors.primary },

  sectionTitle: { fontSize: 16, fontWeight: "700", color: Colors.text, marginBottom: 12 },

  buddyCard: {
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  buddyHeader: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 10 },
  avatarWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primary + "20",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  avatarText: { fontSize: 14, fontWeight: "700", color: Colors.primary },
  onlineDot: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.success,
    borderWidth: 2,
    borderColor: Colors.card,
  },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  buddyName: { fontSize: 15, fontWeight: "700", color: Colors.text },
  compatBadge: { borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2 },
  compatText: { fontSize: 11, fontWeight: "700" },
  buddyMeta: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },

  goalsRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 8 },
  goalChip: {
    backgroundColor: Colors.purple + "15",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  goalChipText: { fontSize: 11, color: Colors.purple, fontWeight: "600" },

  detailsRow: { flexDirection: "row", gap: 12, marginBottom: 8 },
  detailItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  detailText: { fontSize: 11, color: Colors.textMuted },

  interestsRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 12 },
  interestChip: {
    backgroundColor: Colors.cardBorder,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  interestText: { fontSize: 10, color: Colors.textSecondary },

  actionsRow: { flexDirection: "row", gap: 10 },
  connectBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: Colors.primary,
    borderRadius: 10,
    paddingVertical: 10,
  },
  connectBtnText: { fontSize: 13, fontWeight: "700", color: "#FFF" },
  scheduleBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: Colors.primary + "15",
    borderRadius: 10,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: Colors.primary + "40",
  },
  scheduleBtnText: { fontSize: 13, fontWeight: "600", color: Colors.primary },
  sentBadge: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: Colors.success + "15",
    borderRadius: 10,
    paddingVertical: 10,
  },
  sentText: { fontSize: 13, fontWeight: "600", color: Colors.success },

  benefitsSection: { marginTop: 20 },
  benefitItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
  },
  benefitIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  benefitTitle: { fontSize: 14, fontWeight: "600", color: Colors.text },
  benefitDesc: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
});
