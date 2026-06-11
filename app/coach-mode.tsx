/**
 * Coach Mode Screen
 * Real-life training calls calibrated to what the user has actually learned.
 * Survival-first approach: like you're dropped in the country and have to make it work.
 * Harder tasks count 2x toward learning pace.
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
  gold: "#FFD700",
  pink: "#EC4899",
  teal: "#14B8A6",
};

// User's current mastered skills (would come from progress tracking in production)
const USER_PROGRESS = {
  level: "A2",
  completedLessons: 18,
  masteredVerbs: ["ser", "estar", "tener", "ir", "hacer", "querer", "poder", "decir", "hablar", "comer"],
  masteredTopics: ["greetings", "introductions", "numbers", "food_ordering", "directions", "time", "family", "weather"],
  weakAreas: ["past_tense", "subjunctive"],
  learningStyle: "survival" as "survival" | "structured" | "mixed",
  hoursStudied: 24,
};

interface CoachCall {
  id: string;
  type: "scheduled" | "surprise" | "graded" | "scenario";
  title: string;
  description: string;
  scenario: string;
  icon: string;
  difficulty: "easy" | "medium" | "hard" | "surprise";
  duration: string;
  xpReward: number;
  paceMultiplier: number; // 1x, 1.5x, or 2x toward learning pace
  requiredTopics: string[];
  availableBasedOnProgress: boolean;
  graded: boolean;
  speaker: {
    name: string;
    role: string;
    accent: string;
  };
}

const COACH_CALLS: CoachCall[] = [
  {
    id: "c1",
    type: "scenario",
    title: "Lost in the City",
    description: "You just arrived and need to ask for directions to your hotel",
    scenario: "A local approaches you on the street. Ask them how to get to Calle Mayor 15. Use the verbs and direction words you've practiced.",
    icon: "navigate",
    difficulty: "easy",
    duration: "5-8 min",
    xpReward: 80,
    paceMultiplier: 1,
    requiredTopics: ["directions", "greetings"],
    availableBasedOnProgress: true,
    graded: false,
    speaker: { name: "Carlos", role: "Friendly local", accent: "Mexican" },
  },
  {
    id: "c2",
    type: "scenario",
    title: "Ordering at a Restaurant",
    description: "Order a meal, ask about ingredients, and handle the bill",
    scenario: "You're at a restaurant in Madrid. The waiter only speaks Spanish. Order food, ask what's in a dish (allergies), and ask for the check.",
    icon: "restaurant",
    difficulty: "easy",
    duration: "8-10 min",
    xpReward: 100,
    paceMultiplier: 1,
    requiredTopics: ["food_ordering", "numbers"],
    availableBasedOnProgress: true,
    graded: false,
    speaker: { name: "Ana", role: "Restaurant server", accent: "Spanish (Castilian)" },
  },
  {
    id: "c3",
    type: "scheduled",
    title: "Meeting Your Host Family",
    description: "Your teacher set up a call with a native speaker family",
    scenario: "You're meeting your host family for the first time. Introduce yourself, talk about your family, ask about theirs, and discuss the weather.",
    icon: "people",
    difficulty: "medium",
    duration: "12-15 min",
    xpReward: 150,
    paceMultiplier: 1.5,
    requiredTopics: ["introductions", "family", "weather"],
    availableBasedOnProgress: true,
    graded: true,
    speaker: { name: "Familia Rodriguez", role: "Host family", accent: "Colombian" },
  },
  {
    id: "c4",
    type: "surprise",
    title: "Surprise: Emergency Situation",
    description: "An unannounced call testing your real-world readiness",
    scenario: "You receive an unexpected call. Someone needs help — they're lost and asking YOU for directions. Can you handle it?",
    icon: "alert-circle",
    difficulty: "surprise",
    duration: "5-7 min",
    xpReward: 200,
    paceMultiplier: 2,
    requiredTopics: ["directions", "greetings", "numbers"],
    availableBasedOnProgress: true,
    graded: true,
    speaker: { name: "Unknown Caller", role: "Tourist needing help", accent: "Various" },
  },
  {
    id: "c5",
    type: "graded",
    title: "Job Interview Practice",
    description: "A graded conversation that counts toward your B1 certification",
    scenario: "You're interviewing for a position at a Spanish-speaking company. Discuss your experience, skills, and why you want the job.",
    icon: "briefcase",
    difficulty: "hard",
    duration: "15-20 min",
    xpReward: 300,
    paceMultiplier: 2,
    requiredTopics: ["introductions", "time", "numbers"],
    availableBasedOnProgress: false, // needs B1 level
    graded: true,
    speaker: { name: "Sr. Martinez", role: "HR Manager", accent: "Argentine" },
  },
  {
    id: "c6",
    type: "scenario",
    title: "At the Doctor's Office",
    description: "Describe symptoms and understand medical instructions",
    scenario: "You're not feeling well and need to visit a clinic. Describe your symptoms, understand the doctor's questions, and follow their advice.",
    icon: "medkit",
    difficulty: "medium",
    duration: "10-12 min",
    xpReward: 150,
    paceMultiplier: 1.5,
    requiredTopics: ["family", "time"],
    availableBasedOnProgress: true,
    graded: false,
    speaker: { name: "Dra. Gomez", role: "General practitioner", accent: "Peruvian" },
  },
  {
    id: "c7",
    type: "scheduled",
    title: "Teacher's Friend Just Landed",
    description: "Your teacher's friend arrived from abroad and wants to practice with you",
    scenario: "Your teacher says: 'My friend just arrived from Bogotá. She doesn't speak much English. I told her you'd help her find the train station. This is part of your grade.'",
    icon: "airplane",
    difficulty: "medium",
    duration: "10-15 min",
    xpReward: 180,
    paceMultiplier: 1.5,
    requiredTopics: ["directions", "greetings", "time"],
    availableBasedOnProgress: true,
    graded: true,
    speaker: { name: "Valentina", role: "Teacher's friend (new arrival)", accent: "Colombian" },
  },
  {
    id: "c8",
    type: "surprise",
    title: "Surprise: Phone Call from Landlord",
    description: "Your landlord calls about a maintenance issue",
    scenario: "Your apartment has a problem. The landlord calls to schedule a repair. Understand the issue, agree on a time, and confirm details.",
    icon: "call",
    difficulty: "hard",
    duration: "8-12 min",
    xpReward: 250,
    paceMultiplier: 2,
    requiredTopics: ["time", "numbers", "greetings"],
    availableBasedOnProgress: true,
    graded: true,
    speaker: { name: "Don Pedro", role: "Building landlord", accent: "Dominican" },
  },
];

export default function CoachModeScreen() {
  const [filter, setFilter] = useState<"all" | "available" | "graded" | "surprise">("all");
  const [acceptedCalls, setAcceptedCalls] = useState<Set<string>>(new Set());

  const filteredCalls = COACH_CALLS.filter((c) => {
    if (filter === "available") return c.availableBasedOnProgress;
    if (filter === "graded") return c.graded;
    if (filter === "surprise") return c.type === "surprise";
    return true;
  });

  const handleAcceptCall = (id: string) => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setAcceptedCalls((prev) => new Set(prev).add(id));
  };

  const difficultyConfig = (d: string) => {
    switch (d) {
      case "easy": return { color: Colors.success, label: "Easy", icon: "leaf" };
      case "medium": return { color: Colors.warning, label: "Medium", icon: "fitness" };
      case "hard": return { color: Colors.orange, label: "Hard", icon: "flame" };
      case "surprise": return { color: Colors.error, label: "Surprise!", icon: "flash" };
      default: return { color: Colors.textMuted, label: d, icon: "help" };
    }
  };

  const typeConfig = (t: string) => {
    switch (t) {
      case "scheduled": return { color: Colors.primary, label: "Scheduled" };
      case "surprise": return { color: Colors.error, label: "Surprise" };
      case "graded": return { color: Colors.purple, label: "Graded" };
      case "scenario": return { color: Colors.teal, label: "Scenario" };
      default: return { color: Colors.textMuted, label: t };
    }
  };

  return (
    <ScreenContainer edges={["top", "left", "right"]}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Coach Mode</Text>
          <TouchableOpacity onPress={() => router.push("/call-history")} style={styles.backBtn}>
            <Ionicons name="time" size={20} color={Colors.gold} />
          </TouchableOpacity>
        </View>

        {/* Coach Intro */}
        <View style={styles.coachCard}>
          <View style={styles.coachAvatar}>
            <Ionicons name="school" size={28} color={Colors.gold} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.coachName}>Coach Sophia</Text>
            <Text style={styles.coachMessage}>
              "I've reviewed your progress. You've mastered {USER_PROGRESS.masteredVerbs.length} verbs and {USER_PROGRESS.masteredTopics.length} topics. Time to put them to work in real conversations. I'm setting you up with some calls — treat them like you're living there."
            </Text>
          </View>
        </View>

        {/* Your Skills Summary */}
        <View style={styles.skillsCard}>
          <Text style={styles.skillsTitle}>What You Can Handle</Text>
          <Text style={styles.skillsSub}>Calls are based on what you've actually practiced</Text>
          <View style={styles.skillsGrid}>
            {USER_PROGRESS.masteredTopics.map((topic) => (
              <View key={topic} style={styles.skillChip}>
                <Ionicons name="checkmark-circle" size={12} color={Colors.success} />
                <Text style={styles.skillChipText}>{topic.replace(/_/g, " ")}</Text>
              </View>
            ))}
          </View>
          <View style={styles.verbsRow}>
            <Ionicons name="flash" size={14} color={Colors.gold} />
            <Text style={styles.verbsText}>
              {USER_PROGRESS.masteredVerbs.length} verbs mastered: {USER_PROGRESS.masteredVerbs.slice(0, 5).join(", ")}...
            </Text>
          </View>
        </View>

        {/* Pace Bonus Explainer */}
        <View style={styles.bonusCard}>
          <Ionicons name="trending-up" size={20} color={Colors.success} />
          <View style={{ flex: 1 }}>
            <Text style={styles.bonusTitle}>Harder Tasks = More Pace Credit</Text>
            <Text style={styles.bonusSub}>
              Surprise calls and graded conversations count 2x toward your learning pace. Great for catching up!
            </Text>
          </View>
        </View>

        {/* Filters */}
        <View style={styles.filterRow}>
          {(["all", "available", "graded", "surprise"] as const).map((f) => (
            <TouchableOpacity
              key={f}
              style={[styles.filterChip, filter === f && styles.filterChipActive]}
              onPress={() => setFilter(f)}
              activeOpacity={0.8}
            >
              <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
                {f === "all" ? "All" : f === "available" ? "Ready Now" : f === "graded" ? "Graded" : "Surprise"}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Call Cards */}
        <Text style={styles.sectionTitle}>Your Training Calls</Text>
        {filteredCalls.map((call) => {
          const diff = difficultyConfig(call.difficulty);
          const type = typeConfig(call.type);
          const accepted = acceptedCalls.has(call.id);
          const locked = !call.availableBasedOnProgress;

          return (
            <View key={call.id} style={[styles.callCard, locked && styles.callCardLocked]}>
              {/* Type & Difficulty Badge */}
              <View style={styles.callBadgeRow}>
                <View style={[styles.typeBadge, { backgroundColor: type.color + "20" }]}>
                  <Text style={[styles.typeBadgeText, { color: type.color }]}>{type.label}</Text>
                </View>
                <View style={[styles.diffBadge, { backgroundColor: diff.color + "20" }]}>
                  <Ionicons name={diff.icon as any} size={11} color={diff.color} />
                  <Text style={[styles.diffBadgeText, { color: diff.color }]}>{diff.label}</Text>
                </View>
                {call.paceMultiplier > 1 && (
                  <View style={[styles.multBadge, { backgroundColor: Colors.gold + "20" }]}>
                    <Text style={styles.multBadgeText}>{call.paceMultiplier}x pace</Text>
                  </View>
                )}
              </View>

              {/* Call Info */}
              <View style={styles.callHeader}>
                <View style={[styles.callIconWrap, { backgroundColor: (locked ? Colors.textMuted : Colors.primary) + "15" }]}>
                  <Ionicons name={call.icon as any} size={22} color={locked ? Colors.textMuted : Colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.callTitle, locked && { color: Colors.textMuted }]}>{call.title}</Text>
                  <Text style={styles.callDesc}>{call.description}</Text>
                </View>
              </View>

              {/* Scenario */}
              <View style={styles.scenarioBox}>
                <Ionicons name="chatbox-ellipses" size={14} color={Colors.primary} />
                <Text style={styles.scenarioText}>{call.scenario}</Text>
              </View>

              {/* Speaker */}
              <View style={styles.speakerRow}>
                <Ionicons name="person-circle" size={16} color={Colors.textMuted} />
                <Text style={styles.speakerText}>
                  {call.speaker.name} • {call.speaker.role} • {call.speaker.accent}
                </Text>
              </View>

              {/* Meta */}
              <View style={styles.callMeta}>
                <View style={styles.metaItem}>
                  <Ionicons name="time-outline" size={13} color={Colors.textMuted} />
                  <Text style={styles.metaText}>{call.duration}</Text>
                </View>
                <View style={styles.metaItem}>
                  <Ionicons name="flash" size={13} color={Colors.gold} />
                  <Text style={styles.metaText}>+{call.xpReward} XP</Text>
                </View>
                {call.graded && (
                  <View style={styles.metaItem}>
                    <Ionicons name="ribbon" size={13} color={Colors.purple} />
                    <Text style={[styles.metaText, { color: Colors.purple }]}>Counts toward cert</Text>
                  </View>
                )}
              </View>

              {/* Required Topics */}
              <View style={styles.reqRow}>
                <Text style={styles.reqLabel}>Uses:</Text>
                {call.requiredTopics.map((t) => (
                  <View key={t} style={styles.reqChip}>
                    <Text style={styles.reqChipText}>{t.replace(/_/g, " ")}</Text>
                  </View>
                ))}
              </View>

              {/* Action */}
              {locked ? (
                <View style={styles.lockedBanner}>
                  <Ionicons name="lock-closed" size={14} color={Colors.textMuted} />
                  <Text style={styles.lockedText}>Requires B1 level — keep learning!</Text>
                </View>
              ) : accepted ? (
                <View style={styles.acceptedBanner}>
                  <Ionicons name="checkmark-circle" size={16} color={Colors.success} />
                  <Text style={styles.acceptedText}>Accepted — Call scheduled</Text>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.acceptBtn}
                  onPress={() => handleAcceptCall(call.id)}
                  activeOpacity={0.8}
                >
                  <Ionicons name="call" size={16} color="#FFF" />
                  <Text style={styles.acceptBtnText}>
                    {call.type === "surprise" ? "Enable Surprise Calls" : "Accept Challenge"}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          );
        })}

        {/* Coach Tips */}
        <View style={styles.tipsCard}>
          <Text style={styles.tipsTitle}>Coach's Tips</Text>
          {[
            "Don't worry about being perfect — real conversations are messy",
            "Use the verbs you know creatively, even if grammar isn't perfect",
            "If you don't understand, ask them to repeat slower — that's a skill too",
            "Surprise calls test your instincts — embrace the pressure",
            "Graded calls count toward your certification, so give it your best",
          ].map((tip, idx) => (
            <View key={idx} style={styles.tipItem}>
              <Text style={styles.tipBullet}>💡</Text>
              <Text style={styles.tipText}>{tip}</Text>
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

  coachCard: {
    flexDirection: "row",
    gap: 14,
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: Colors.gold + "30",
  },
  coachAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.gold + "20",
    alignItems: "center",
    justifyContent: "center",
  },
  coachName: { fontSize: 14, fontWeight: "700", color: Colors.gold },
  coachMessage: { fontSize: 12, color: Colors.textSecondary, marginTop: 4, lineHeight: 18, fontStyle: "italic" },

  skillsCard: {
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  skillsTitle: { fontSize: 14, fontWeight: "700", color: Colors.text },
  skillsSub: { fontSize: 11, color: Colors.textMuted, marginTop: 2, marginBottom: 10 },
  skillsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 10 },
  skillChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: Colors.success + "12",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  skillChipText: { fontSize: 11, color: Colors.success, fontWeight: "600", textTransform: "capitalize" },
  verbsRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  verbsText: { fontSize: 11, color: Colors.textSecondary },

  bonusCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: Colors.success + "10",
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.success + "30",
  },
  bonusTitle: { fontSize: 13, fontWeight: "700", color: Colors.success },
  bonusSub: { fontSize: 11, color: Colors.textSecondary, marginTop: 2, lineHeight: 16 },

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

  callCard: {
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  callCardLocked: { opacity: 0.6 },
  callBadgeRow: { flexDirection: "row", gap: 6, marginBottom: 10 },
  typeBadge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  typeBadgeText: { fontSize: 10, fontWeight: "700" },
  diffBadge: { flexDirection: "row", alignItems: "center", gap: 3, borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3 },
  diffBadgeText: { fontSize: 10, fontWeight: "700" },
  multBadge: { borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3 },
  multBadgeText: { fontSize: 10, fontWeight: "700", color: Colors.gold },

  callHeader: { flexDirection: "row", gap: 12, marginBottom: 10 },
  callIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  callTitle: { fontSize: 15, fontWeight: "700", color: Colors.text },
  callDesc: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },

  scenarioBox: {
    flexDirection: "row",
    gap: 8,
    backgroundColor: Colors.primary + "08",
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    borderLeftWidth: 3,
    borderLeftColor: Colors.primary,
  },
  scenarioText: { flex: 1, fontSize: 12, color: Colors.textSecondary, lineHeight: 17, fontStyle: "italic" },

  speakerRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 8 },
  speakerText: { fontSize: 11, color: Colors.textMuted },

  callMeta: { flexDirection: "row", gap: 14, marginBottom: 8 },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  metaText: { fontSize: 11, color: Colors.textMuted },

  reqRow: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 6, marginBottom: 12 },
  reqLabel: { fontSize: 11, color: Colors.textMuted },
  reqChip: { backgroundColor: Colors.cardBorder, borderRadius: 5, paddingHorizontal: 6, paddingVertical: 2 },
  reqChipText: { fontSize: 10, color: Colors.textSecondary, textTransform: "capitalize" },

  lockedBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Colors.cardBorder + "50",
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  lockedText: { fontSize: 12, color: Colors.textMuted },

  acceptedBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: Colors.success + "15",
    borderRadius: 10,
    paddingVertical: 12,
  },
  acceptedText: { fontSize: 13, fontWeight: "600", color: Colors.success },

  acceptBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.primary,
    borderRadius: 10,
    paddingVertical: 12,
  },
  acceptBtnText: { fontSize: 14, fontWeight: "700", color: "#FFF" },

  tipsCard: {
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 16,
    marginTop: 8,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  tipsTitle: { fontSize: 14, fontWeight: "700", color: Colors.text, marginBottom: 10 },
  tipItem: { flexDirection: "row", gap: 8, marginBottom: 8 },
  tipBullet: { fontSize: 12 },
  tipText: { flex: 1, fontSize: 12, color: Colors.textSecondary, lineHeight: 17 },
});
