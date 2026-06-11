/**
 * Homework Submission + Grading
 * View assigned homework, submit answers (text/audio/file), and receive AI-graded feedback.
 */
import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Platform,
  FlatList,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { ScreenContainer } from "@/components/screen-container";
import * as Haptics from "expo-haptics";
import { markTodayAsPracticed } from "@/lib/streak-notifications";
import { markPracticeAndToast } from "@/lib/streak-practice-helper";
import { useUsage } from "@/lib/usage-context";


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
  gold: "#FFD700",
  pink: "#EC4899",
};

type AssignmentStatus = "pending" | "submitted" | "graded" | "resubmit";

interface Assignment {
  id: string;
  title: string;
  description: string;
  type: "writing" | "speaking" | "translation" | "listening" | "mixed";
  dueDate: string;
  status: AssignmentStatus;
  xpReward: number;
  difficulty: "easy" | "medium" | "hard";
  submission?: {
    text?: string;
    submittedAt: string;
  };
  grade?: {
    letter: string;
    percentage: number;
    accuracy: number;
    completeness: number;
    effort: number;
    feedback: string;
    corrections: string[];
    praise: string[];
    canResubmit: boolean;
  };
}

const ASSIGNMENTS: Assignment[] = [
  {
    id: "hw1",
    title: "Write a Short Introduction",
    description: "Write a 5-sentence introduction about yourself in Spanish. Include your name, where you're from, your hobbies, and what you want to learn.",
    type: "writing",
    dueDate: "2026-05-25",
    status: "graded",
    xpReward: 50,
    difficulty: "easy",
    submission: { text: "Hola, me llamo Juan. Soy de Nueva York. Me gusta la musica y el futbol. Quiero aprender español para viajar. Estoy muy emocionado.", submittedAt: "2026-05-22" },
    grade: {
      letter: "B+",
      percentage: 87,
      accuracy: 82,
      completeness: 95,
      effort: 90,
      feedback: "Good effort! Your sentences are clear and well-structured. Watch for accent marks — 'música' and 'fútbol' need them.",
      corrections: ["musica → música (accent mark)", "futbol → fútbol (accent mark)", "Consider using 'Me gustan' for plural nouns"],
      praise: ["Great sentence variety", "Correct use of 'Soy de'", "Natural flow"],
      canResubmit: false,
    },
  },
  {
    id: "hw2",
    title: "Translate a Restaurant Menu",
    description: "Translate the following 8 menu items from English to Spanish. Include any regional variations you know (e.g., Dominican vs. Mexican).",
    type: "translation",
    dueDate: "2026-05-26",
    status: "pending",
    xpReward: 75,
    difficulty: "medium",
  },
  {
    id: "hw3",
    title: "Record a Voicemail Message",
    description: "Record a 30-second voicemail greeting in Spanish. Pretend you missed a call from your landlord and need to call them back.",
    type: "speaking",
    dueDate: "2026-05-27",
    status: "pending",
    xpReward: 100,
    difficulty: "hard",
  },
  {
    id: "hw4",
    title: "Conjugation Practice: Ser vs Estar",
    description: "Fill in the blanks with the correct form of 'ser' or 'estar' for each of the 10 sentences provided.",
    type: "writing",
    dueDate: "2026-05-24",
    status: "submitted",
    xpReward: 60,
    difficulty: "medium",
    submission: { text: "1. Yo soy estudiante. 2. Ella está cansada. 3. Nosotros somos de México. 4. Tú estás en la casa. 5. Él es alto. 6. Ellos están felices. 7. Yo estoy bien. 8. Usted es profesor. 9. Nosotras estamos listas. 10. Tú eres inteligente.", submittedAt: "2026-05-23" },
  },
  {
    id: "hw5",
    title: "Street Slang Translation",
    description: "Translate these 5 Dominican slang phrases into English and explain when you'd use them in conversation.",
    type: "translation",
    dueDate: "2026-05-23",
    status: "graded",
    xpReward: 80,
    difficulty: "hard",
    submission: { text: "1. 'Tá to' = Everything's good. 2. 'Vaina' = Thing/stuff. 3. 'Tigre' = Hustler/street-smart person. 4. 'Klok' = What's up. 5. 'Jevi' = Cool/awesome.", submittedAt: "2026-05-22" },
    grade: {
      letter: "A-",
      percentage: 92,
      accuracy: 90,
      completeness: 95,
      effort: 95,
      feedback: "Excellent work! You clearly understand the cultural context. 'Klok' is typically spelled 'Klk' in texts. Minor detail but shows deep knowledge.",
      corrections: ["Klok → Klk (common text spelling)", "'Tigre' can also mean 'bro/dude' in casual context"],
      praise: ["Perfect contextual explanations", "Great cultural awareness", "Accurate translations", "Shows real-world understanding"],
      canResubmit: false,
    },
  },
];

function getStatusColor(status: AssignmentStatus): string {
  switch (status) {
    case "pending": return Colors.warning;
    case "submitted": return Colors.primary;
    case "graded": return Colors.success;
    case "resubmit": return Colors.error;
  }
}

function getStatusLabel(status: AssignmentStatus): string {
  switch (status) {
    case "pending": return "Due";
    case "submitted": return "Submitted";
    case "graded": return "Graded";
    case "resubmit": return "Resubmit";
  }
}

function getDifficultyColor(d: string): string {
  if (d === "easy") return Colors.success;
  if (d === "medium") return Colors.warning;
  return Colors.error;
}

function getGradeColor(letter: string): string {
  if (letter.startsWith("A")) return Colors.success;
  if (letter.startsWith("B")) return Colors.primary;
  if (letter.startsWith("C")) return Colors.warning;
  return Colors.error;
}

export default function HomeworkScreen() {
  const { showStreakToast } = useUsage();
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [submissionText, setSubmissionText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showGrade, setShowGrade] = useState(false);

  const handleSubmit = () => {
    if (!submissionText.trim()) return;
    if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setIsSubmitting(true);
    // Simulate AI grading delay
    setTimeout(() => {
      setIsSubmitting(false);
      if (selectedAssignment) {
        selectedAssignment.status = "submitted";
        markPracticeAndToast(showStreakToast);
        selectedAssignment.submission = { text: submissionText, submittedAt: new Date().toISOString().split("T")[0] };
      }
      setSubmissionText("");
      setSelectedAssignment(null);
    }, 2000);
  };

  const handleResubmit = (assignment: Assignment) => {
    setSelectedAssignment(assignment);
    setSubmissionText(assignment.submission?.text || "");
    setShowGrade(false);
  };

  // Detail view for a selected assignment
  if (selectedAssignment) {
    return (
      <ScreenContainer edges={["top", "left", "right"]}>
        <View style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => setSelectedAssignment(null)} style={styles.backBtn}>
              <Ionicons name="chevron-back" size={24} color={Colors.text} />
            </TouchableOpacity>
            <Text style={styles.headerTitle} numberOfLines={1}>{selectedAssignment.title}</Text>
            <View style={{ width: 36 }} />
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
            {/* Assignment Info */}
            <View style={styles.assignmentInfoCard}>
              <View style={styles.assignmentMeta}>
                <View style={[styles.difficultyBadge, { backgroundColor: getDifficultyColor(selectedAssignment.difficulty) + "20" }]}>
                  <Text style={[styles.difficultyText, { color: getDifficultyColor(selectedAssignment.difficulty) }]}>{selectedAssignment.difficulty}</Text>
                </View>
                <View style={styles.xpBadge}>
                  <Ionicons name="star" size={12} color={Colors.gold} />
                  <Text style={styles.xpText}>{selectedAssignment.xpReward} XP</Text>
                </View>
                <Text style={styles.dueText}>Due: {selectedAssignment.dueDate}</Text>
              </View>
              <Text style={styles.assignmentDesc}>{selectedAssignment.description}</Text>
            </View>

            {/* Grade Display (if graded) */}
            {selectedAssignment.grade && (
              <View style={styles.gradeSection}>
                <View style={styles.gradeHeader}>
                  <View style={[styles.gradeCircle, { borderColor: getGradeColor(selectedAssignment.grade.letter) }]}>
                    <Text style={[styles.gradeLetter, { color: getGradeColor(selectedAssignment.grade.letter) }]}>{selectedAssignment.grade.letter}</Text>
                    <Text style={styles.gradePercent}>{selectedAssignment.grade.percentage}%</Text>
                  </View>
                  <View style={styles.gradeCategories}>
                    <View style={styles.gradeCatRow}>
                      <Text style={styles.gradeCatLabel}>Accuracy</Text>
                      <View style={styles.gradeCatBar}>
                        <View style={[styles.gradeCatFill, { width: `${selectedAssignment.grade.accuracy}%`, backgroundColor: Colors.primary }]} />
                      </View>
                      <Text style={styles.gradeCatValue}>{selectedAssignment.grade.accuracy}%</Text>
                    </View>
                    <View style={styles.gradeCatRow}>
                      <Text style={styles.gradeCatLabel}>Complete</Text>
                      <View style={styles.gradeCatBar}>
                        <View style={[styles.gradeCatFill, { width: `${selectedAssignment.grade.completeness}%`, backgroundColor: Colors.success }]} />
                      </View>
                      <Text style={styles.gradeCatValue}>{selectedAssignment.grade.completeness}%</Text>
                    </View>
                    <View style={styles.gradeCatRow}>
                      <Text style={styles.gradeCatLabel}>Effort</Text>
                      <View style={styles.gradeCatBar}>
                        <View style={[styles.gradeCatFill, { width: `${selectedAssignment.grade.effort}%`, backgroundColor: Colors.purple }]} />
                      </View>
                      <Text style={styles.gradeCatValue}>{selectedAssignment.grade.effort}%</Text>
                    </View>
                  </View>
                </View>

                {/* Feedback */}
                <View style={styles.feedbackCard}>
                  <Ionicons name="chatbox-ellipses" size={16} color={Colors.primary} />
                  <Text style={styles.feedbackText}>{selectedAssignment.grade.feedback}</Text>
                </View>

                {/* Corrections */}
                {selectedAssignment.grade.corrections.length > 0 && (
                  <View style={styles.correctionsCard}>
                    <Text style={styles.correctionTitle}>
                      <Ionicons name="alert-circle" size={14} color={Colors.error} /> Corrections
                    </Text>
                    {selectedAssignment.grade.corrections.map((c, i) => (
                      <View key={i} style={styles.correctionRow}>
                        <View style={styles.correctionDot} />
                        <Text style={styles.correctionText}>{c}</Text>
                      </View>
                    ))}
                  </View>
                )}

                {/* Praise */}
                {selectedAssignment.grade.praise.length > 0 && (
                  <View style={styles.praiseCard}>
                    <Text style={styles.praiseTitle}>
                      <Ionicons name="trophy" size={14} color={Colors.gold} /> What You Did Well
                    </Text>
                    {selectedAssignment.grade.praise.map((p, i) => (
                      <View key={i} style={styles.praiseRow}>
                        <Ionicons name="checkmark-circle" size={14} color={Colors.success} />
                        <Text style={styles.praiseText}>{p}</Text>
                      </View>
                    ))}
                  </View>
                )}

                {/* Resubmit */}
                {selectedAssignment.grade.canResubmit && (
                  <TouchableOpacity style={styles.resubmitBtn} onPress={() => handleResubmit(selectedAssignment)}>
                    <Ionicons name="refresh" size={18} color="#FFFFFF" />
                    <Text style={styles.resubmitBtnText}>Resubmit for Better Grade</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}

            {/* Submission Form (if pending or resubmit) */}
            {(selectedAssignment.status === "pending" || selectedAssignment.status === "resubmit") && (
              <View style={styles.submissionSection}>
                <Text style={styles.submissionTitle}>Your Answer</Text>
                <TextInput
                  style={styles.submissionInput}
                  placeholder="Type your answer here..."
                  placeholderTextColor={Colors.textMuted}
                  multiline
                  value={submissionText}
                  onChangeText={setSubmissionText}
                  textAlignVertical="top"
                />
                <View style={styles.submissionActions}>
                  <TouchableOpacity style={styles.attachBtn}>
                    <Ionicons name="attach" size={20} color={Colors.primary} />
                    <Text style={styles.attachText}>Attach File</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.recordBtn}>
                    <Ionicons name="mic" size={20} color={Colors.pink} />
                    <Text style={styles.recordText}>Record Audio</Text>
                  </TouchableOpacity>
                </View>
                <TouchableOpacity
                  style={[styles.submitBtn, !submissionText.trim() && styles.submitBtnDisabled]}
                  onPress={handleSubmit}
                  disabled={!submissionText.trim() || isSubmitting}
                >
                  {isSubmitting ? (
                    <Text style={styles.submitBtnText}>Grading...</Text>
                  ) : (
                    <>
                      <Ionicons name="send" size={18} color="#FFFFFF" />
                      <Text style={styles.submitBtnText}>Submit for Grading</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            )}

            {/* Already submitted, waiting for grade */}
            {selectedAssignment.status === "submitted" && !selectedAssignment.grade && (
              <View style={styles.waitingCard}>
                <Ionicons name="hourglass" size={32} color={Colors.primary} />
                <Text style={styles.waitingTitle}>Submitted!</Text>
                <Text style={styles.waitingText}>Your AI teacher is reviewing your work. Grade will appear shortly.</Text>
              </View>
            )}
          </ScrollView>
        </View>
      </ScreenContainer>
    );
  }

  // List view
  const pendingCount = ASSIGNMENTS.filter(a => a.status === "pending" || a.status === "resubmit").length;
  const gradedCount = ASSIGNMENTS.filter(a => a.status === "graded").length;
  const avgGrade = ASSIGNMENTS.filter(a => a.grade).reduce((sum, a) => sum + (a.grade?.percentage || 0), 0) / (gradedCount || 1);

  return (
    <ScreenContainer edges={["top", "left", "right"]}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Homework</Text>
          <View style={{ width: 36 }} />
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{pendingCount}</Text>
            <Text style={styles.statLabel}>Due</Text>
          </View>
          <View style={[styles.statItem, styles.statDivider]}>
            <Text style={styles.statValue}>{gradedCount}</Text>
            <Text style={styles.statLabel}>Graded</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: Colors.success }]}>{Math.round(avgGrade)}%</Text>
            <Text style={styles.statLabel}>Avg Grade</Text>
          </View>
        </View>

        <FlatList
          data={ASSIGNMENTS}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.assignmentCard}
              onPress={() => { setSelectedAssignment(item); setShowGrade(!!item.grade); }}
              activeOpacity={0.7}
            >
              <View style={styles.assignmentCardTop}>
                <View style={[styles.typeBadge, { backgroundColor: Colors.primary + "15" }]}>
                  <Ionicons
                    name={item.type === "writing" ? "pencil" : item.type === "speaking" ? "mic" : item.type === "translation" ? "language" : "headset"}
                    size={14}
                    color={Colors.primary}
                  />
                  <Text style={styles.typeText}>{item.type}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + "20" }]}>
                  <View style={[styles.statusDot, { backgroundColor: getStatusColor(item.status) }]} />
                  <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>{getStatusLabel(item.status)}</Text>
                </View>
              </View>
              <Text style={styles.assignmentTitle}>{item.title}</Text>
              <View style={styles.assignmentCardBottom}>
                <Text style={styles.assignmentDue}>Due: {item.dueDate}</Text>
                <View style={styles.xpBadgeSmall}>
                  <Ionicons name="star" size={10} color={Colors.gold} />
                  <Text style={styles.xpTextSmall}>{item.xpReward} XP</Text>
                </View>
                {item.grade && (
                  <View style={[styles.gradeSmall, { backgroundColor: getGradeColor(item.grade.letter) + "20" }]}>
                    <Text style={[styles.gradeSmallText, { color: getGradeColor(item.grade.letter) }]}>{item.grade.letter}</Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          )}
        />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 14 },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.card, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 18, fontWeight: "700", color: Colors.text },
  statsRow: { flexDirection: "row", marginHorizontal: 16, marginBottom: 16, backgroundColor: Colors.card, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: Colors.cardBorder },
  statItem: { flex: 1, alignItems: "center" },
  statDivider: { borderLeftWidth: 1, borderRightWidth: 1, borderColor: Colors.cardBorder },
  statValue: { fontSize: 20, fontWeight: "800", color: Colors.text },
  statLabel: { fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  assignmentCard: { backgroundColor: Colors.card, borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: Colors.cardBorder },
  assignmentCardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  typeBadge: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  typeText: { fontSize: 11, color: Colors.primary, fontWeight: "600", textTransform: "capitalize" },
  statusBadge: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 11, fontWeight: "600" },
  assignmentTitle: { fontSize: 14, fontWeight: "600", color: Colors.text, marginBottom: 8 },
  assignmentCardBottom: { flexDirection: "row", alignItems: "center", gap: 10 },
  assignmentDue: { fontSize: 11, color: Colors.textMuted },
  xpBadgeSmall: { flexDirection: "row", alignItems: "center", gap: 3 },
  xpTextSmall: { fontSize: 10, color: Colors.gold, fontWeight: "600" },
  gradeSmall: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  gradeSmallText: { fontSize: 11, fontWeight: "800" },
  // Detail styles
  assignmentInfoCard: { marginHorizontal: 16, backgroundColor: Colors.card, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: Colors.cardBorder, marginBottom: 16 },
  assignmentMeta: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 },
  difficultyBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  difficultyText: { fontSize: 11, fontWeight: "700", textTransform: "capitalize" },
  xpBadge: { flexDirection: "row", alignItems: "center", gap: 3, backgroundColor: Colors.gold + "15", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  xpText: { fontSize: 11, color: Colors.gold, fontWeight: "600" },
  dueText: { fontSize: 11, color: Colors.textMuted },
  assignmentDesc: { fontSize: 13, color: Colors.textSecondary, lineHeight: 20 },
  gradeSection: { paddingHorizontal: 16, marginBottom: 16 },
  gradeHeader: { flexDirection: "row", alignItems: "center", gap: 16, backgroundColor: Colors.card, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: Colors.cardBorder, marginBottom: 12 },
  gradeCircle: { width: 72, height: 72, borderRadius: 36, borderWidth: 3, alignItems: "center", justifyContent: "center" },
  gradeLetter: { fontSize: 22, fontWeight: "800" },
  gradePercent: { fontSize: 11, color: Colors.textMuted },
  gradeCategories: { flex: 1, gap: 8 },
  gradeCatRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  gradeCatLabel: { fontSize: 11, color: Colors.textMuted, width: 60 },
  gradeCatBar: { flex: 1, height: 5, backgroundColor: Colors.bg, borderRadius: 3, overflow: "hidden" },
  gradeCatFill: { height: "100%", borderRadius: 3 },
  gradeCatValue: { fontSize: 11, color: Colors.text, fontWeight: "600", width: 32, textAlign: "right" },
  feedbackCard: { flexDirection: "row", gap: 10, backgroundColor: Colors.primary + "10", borderRadius: 12, padding: 12, marginBottom: 10, borderWidth: 1, borderColor: Colors.primary + "30" },
  feedbackText: { flex: 1, fontSize: 12, color: Colors.textSecondary, lineHeight: 18 },
  correctionsCard: { backgroundColor: Colors.error + "08", borderRadius: 12, padding: 12, marginBottom: 10, borderWidth: 1, borderColor: Colors.error + "20" },
  correctionTitle: { fontSize: 12, fontWeight: "700", color: Colors.error, marginBottom: 8 },
  correctionRow: { flexDirection: "row", alignItems: "flex-start", gap: 8, marginBottom: 6 },
  correctionDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: Colors.error, marginTop: 5 },
  correctionText: { flex: 1, fontSize: 12, color: Colors.textSecondary, lineHeight: 17 },
  praiseCard: { backgroundColor: Colors.gold + "08", borderRadius: 12, padding: 12, marginBottom: 10, borderWidth: 1, borderColor: Colors.gold + "20" },
  praiseTitle: { fontSize: 12, fontWeight: "700", color: Colors.gold, marginBottom: 8 },
  praiseRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 6 },
  praiseText: { flex: 1, fontSize: 12, color: Colors.textSecondary },
  resubmitBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: Colors.warning, borderRadius: 12, padding: 14, marginTop: 8 },
  resubmitBtnText: { fontSize: 14, fontWeight: "700", color: "#FFFFFF" },
  submissionSection: { paddingHorizontal: 16 },
  submissionTitle: { fontSize: 14, fontWeight: "700", color: Colors.text, marginBottom: 10 },
  submissionInput: { backgroundColor: Colors.card, borderRadius: 12, borderWidth: 1, borderColor: Colors.cardBorder, padding: 14, fontSize: 14, color: Colors.text, minHeight: 140, lineHeight: 20 },
  submissionActions: { flexDirection: "row", gap: 12, marginTop: 12 },
  attachBtn: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: Colors.primary + "15", paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  attachText: { fontSize: 12, color: Colors.primary, fontWeight: "600" },
  recordBtn: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: Colors.pink + "15", paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  recordText: { fontSize: 12, color: Colors.pink, fontWeight: "600" },
  submitBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: Colors.success, borderRadius: 12, padding: 16, marginTop: 16 },
  submitBtnDisabled: { opacity: 0.5 },
  submitBtnText: { fontSize: 15, fontWeight: "700", color: "#FFFFFF" },
  waitingCard: { alignItems: "center", marginHorizontal: 16, backgroundColor: Colors.card, borderRadius: 16, padding: 30, borderWidth: 1, borderColor: Colors.cardBorder, gap: 10 },
  waitingTitle: { fontSize: 18, fontWeight: "700", color: Colors.text },
  waitingText: { fontSize: 13, color: Colors.textSecondary, textAlign: "center" },
});
