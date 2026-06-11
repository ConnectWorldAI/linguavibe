import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { Colors, Spacing, BorderRadius, FontSize } from "../constants/Colors";
import {
  saveLearningGoal,
  getDefaultSkillPriorities,
  getEstimatedHours,
  type LearningGoal,
  type LearningStyle,
  type GoalType,
} from "../lib/learning-pace";

type Step = "goal" | "timeline" | "availability" | "style" | "review";

const GOAL_TYPES: { key: GoalType; label: string; icon: string; desc: string }[] = [
  { key: "fluency", label: "Become Fluent", icon: "globe", desc: "Speak naturally in daily life" },
  { key: "certification", label: "Pass a Test", icon: "ribbon", desc: "DELF, JLPT, HSK, DELE, etc." },
  { key: "travel", label: "Travel Ready", icon: "airplane", desc: "Navigate a trip confidently" },
  { key: "career", label: "Career Boost", icon: "briefcase", desc: "Use in professional settings" },
  { key: "personal", label: "Personal Growth", icon: "heart", desc: "Learn at my own pace" },
];

const TARGET_LEVELS = [
  { key: "A1", label: "A1 - Beginner", hours: 80 },
  { key: "A2", label: "A2 - Elementary", hours: 200 },
  { key: "B1", label: "B1 - Intermediate", hours: 400 },
  { key: "B2", label: "B2 - Upper Intermediate", hours: 600 },
  { key: "C1", label: "C1 - Advanced", hours: 800 },
  { key: "C2", label: "C2 - Mastery", hours: 1000 },
  { key: "Fluent", label: "Conversational Fluency", hours: 700 },
];

const LEARNING_STYLES: { key: LearningStyle; label: string; icon: string; desc: string }[] = [
  { key: "conversational", label: "Conversational", icon: "chatbubbles", desc: "I learn best by talking" },
  { key: "auditory", label: "Auditory", icon: "headset", desc: "I learn best by listening" },
  { key: "visual", label: "Visual", icon: "eye", desc: "I learn best by seeing" },
  { key: "reading", label: "Reading/Writing", icon: "book", desc: "I learn best by reading" },
  { key: "mixed", label: "Mixed / Balanced", icon: "apps", desc: "A bit of everything" },
];

const TIMELINE_OPTIONS = [
  { months: 3, label: "3 months", desc: "Intensive" },
  { months: 6, label: "6 months", desc: "Steady" },
  { months: 9, label: "9 months", desc: "Relaxed" },
  { months: 12, label: "1 year", desc: "Comfortable" },
  { months: 18, label: "18 months", desc: "No rush" },
  { months: 24, label: "2 years", desc: "Long-term" },
];

export default function LearningGoalSetupScreen() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("goal");
  const [goalType, setGoalType] = useState<GoalType>("fluency");
  const [targetLevel, setTargetLevel] = useState("B2");
  const [language, setLanguage] = useState("Spanish");
  const [timelineMonths, setTimelineMonths] = useState(6);
  const [minutesPerDay, setMinutesPerDay] = useState(30);
  const [daysPerWeek, setDaysPerWeek] = useState(5);
  const [learningStyle, setLearningStyle] = useState<LearningStyle>("mixed");
  const [workSchedule, setWorkSchedule] = useState("");

  const steps: Step[] = ["goal", "timeline", "availability", "style", "review"];
  const currentIndex = steps.indexOf(step);

  const goNext = () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const next = steps[currentIndex + 1];
    if (next) setStep(next);
  };

  const goBack = () => {
    if (currentIndex === 0) {
      router.back();
    } else {
      setStep(steps[currentIndex - 1]);
    }
  };

  const handleSave = async () => {
    if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const targetDate = new Date();
    targetDate.setMonth(targetDate.getMonth() + timelineMonths);

    const goal: LearningGoal = {
      id: Date.now().toString(),
      language,
      goalType,
      targetLevel,
      targetDate: targetDate.toISOString(),
      createdAt: new Date().toISOString(),
      learningStyle,
      availableMinutesPerDay: minutesPerDay,
      availableDaysPerWeek: daysPerWeek,
      workSchedule: workSchedule || undefined,
      prioritySkills: getDefaultSkillPriorities(learningStyle),
    };

    await saveLearningGoal(goal);
    router.back();
  };

  const estimatedHours = getEstimatedHours(targetLevel);
  const totalMinutesNeeded = estimatedHours * 60;
  const dailyAvailable = minutesPerDay * daysPerWeek;
  const weeksNeeded = Math.ceil(totalMinutesNeeded / Math.max(1, dailyAvailable));
  const monthsNeeded = Math.ceil(weeksNeeded / 4.3);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={goBack} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Set Learning Goal</Text>
        <Text style={styles.stepIndicator}>{currentIndex + 1}/{steps.length}</Text>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${((currentIndex + 1) / steps.length) * 100}%` }]} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Step 1: Goal Type */}
        {step === "goal" && (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>What's your goal?</Text>
            <Text style={styles.stepDesc}>This helps us calculate the right pace for you.</Text>

            {GOAL_TYPES.map((g) => (
              <TouchableOpacity
                key={g.key}
                style={[styles.optionCard, goalType === g.key && styles.optionCardSelected]}
                onPress={() => setGoalType(g.key)}
                activeOpacity={0.7}
              >
                <View style={[styles.optionIcon, goalType === g.key && styles.optionIconSelected]}>
                  <Ionicons name={g.icon as any} size={22} color={goalType === g.key ? "#fff" : Colors.textSecondary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.optionTitle, goalType === g.key && styles.optionTitleSelected]}>{g.label}</Text>
                  <Text style={styles.optionDesc}>{g.desc}</Text>
                </View>
                {goalType === g.key && <Ionicons name="checkmark-circle" size={22} color={Colors.secondary} />}
              </TouchableOpacity>
            ))}

            <Text style={[styles.stepTitle, { marginTop: 24 }]}>Target Level</Text>
            <View style={styles.levelGrid}>
              {TARGET_LEVELS.map((l) => (
                <TouchableOpacity
                  key={l.key}
                  style={[styles.levelChip, targetLevel === l.key && styles.levelChipSelected]}
                  onPress={() => setTargetLevel(l.key)}
                >
                  <Text style={[styles.levelChipText, targetLevel === l.key && styles.levelChipTextSelected]}>
                    {l.key}
                  </Text>
                  <Text style={[styles.levelChipSub, targetLevel === l.key && { color: Colors.secondary }]}>
                    ~{l.hours}h
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.languageRow}>
              <Text style={styles.languageLabel}>Language:</Text>
              <TextInput
                style={styles.languageInput}
                value={language}
                onChangeText={setLanguage}
                placeholder="Spanish"
                placeholderTextColor={Colors.textMuted}
              />
            </View>
          </View>
        )}

        {/* Step 2: Timeline */}
        {step === "timeline" && (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>When do you want to achieve this?</Text>
            <Text style={styles.stepDesc}>
              Based on research, {targetLevel} requires ~{estimatedHours} hours of study.
            </Text>

            <View style={styles.timelineGrid}>
              {TIMELINE_OPTIONS.map((t) => {
                const isRealistic = t.months >= monthsNeeded * 0.7;
                return (
                  <TouchableOpacity
                    key={t.months}
                    style={[
                      styles.timelineCard,
                      timelineMonths === t.months && styles.timelineCardSelected,
                      !isRealistic && styles.timelineCardWarning,
                    ]}
                    onPress={() => setTimelineMonths(t.months)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.timelineLabel, timelineMonths === t.months && styles.timelineLabelSelected]}>
                      {t.label}
                    </Text>
                    <Text style={styles.timelineDesc}>{t.desc}</Text>
                    {!isRealistic && (
                      <View style={styles.warningBadge}>
                        <Ionicons name="warning" size={12} color={Colors.warning} />
                        <Text style={styles.warningText}>Ambitious</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.insightCard}>
              <Ionicons name="bulb" size={18} color={Colors.gold} />
              <Text style={styles.insightText}>
                At your current settings, you'd need ~{monthsNeeded} months minimum.
                {timelineMonths < monthsNeeded
                  ? " You may need to increase daily study time."
                  : " This timeline gives you comfortable buffer."}
              </Text>
            </View>
          </View>
        )}

        {/* Step 3: Availability */}
        {step === "availability" && (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>How much time can you commit?</Text>
            <Text style={styles.stepDesc}>
              Be honest — we'll adjust your pace based on real availability.
            </Text>

            <Text style={styles.fieldLabel}>Minutes per day</Text>
            <View style={styles.sliderRow}>
              {[15, 20, 30, 45, 60, 90, 120].map((m) => (
                <TouchableOpacity
                  key={m}
                  style={[styles.minuteChip, minutesPerDay === m && styles.minuteChipSelected]}
                  onPress={() => setMinutesPerDay(m)}
                >
                  <Text style={[styles.minuteChipText, minutesPerDay === m && styles.minuteChipTextSelected]}>
                    {m}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.fieldLabel}>Days per week</Text>
            <View style={styles.sliderRow}>
              {[3, 4, 5, 6, 7].map((d) => (
                <TouchableOpacity
                  key={d}
                  style={[styles.minuteChip, daysPerWeek === d && styles.minuteChipSelected]}
                  onPress={() => setDaysPerWeek(d)}
                >
                  <Text style={[styles.minuteChipText, daysPerWeek === d && styles.minuteChipTextSelected]}>
                    {d}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.fieldLabel}>Work/life schedule (optional)</Text>
            <TextInput
              style={styles.scheduleInput}
              value={workSchedule}
              onChangeText={setWorkSchedule}
              placeholder="e.g., 9-5 Mon-Fri, busy weekends"
              placeholderTextColor={Colors.textMuted}
              multiline
            />

            <View style={styles.insightCard}>
              <Ionicons name="calculator" size={18} color={Colors.secondary} />
              <Text style={styles.insightText}>
                {minutesPerDay} min × {daysPerWeek} days = {minutesPerDay * daysPerWeek} min/week ({Math.round((minutesPerDay * daysPerWeek) / 60 * 10) / 10} hrs/week).
                {"\n"}At this rate, you'll need ~{Math.ceil(totalMinutesNeeded / (minutesPerDay * daysPerWeek))} weeks.
              </Text>
            </View>
          </View>
        )}

        {/* Step 4: Learning Style */}
        {step === "style" && (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>How do you learn best?</Text>
            <Text style={styles.stepDesc}>
              We'll prioritize activities that match your style and allocate more time to high-impact skills.
            </Text>

            {LEARNING_STYLES.map((s) => (
              <TouchableOpacity
                key={s.key}
                style={[styles.optionCard, learningStyle === s.key && styles.optionCardSelected]}
                onPress={() => setLearningStyle(s.key)}
                activeOpacity={0.7}
              >
                <View style={[styles.optionIcon, learningStyle === s.key && styles.optionIconSelected]}>
                  <Ionicons name={s.icon as any} size={22} color={learningStyle === s.key ? "#fff" : Colors.textSecondary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.optionTitle, learningStyle === s.key && styles.optionTitleSelected]}>{s.label}</Text>
                  <Text style={styles.optionDesc}>{s.desc}</Text>
                </View>
                {learningStyle === s.key && <Ionicons name="checkmark-circle" size={22} color={Colors.secondary} />}
              </TouchableOpacity>
            ))}

            {/* Show skill distribution */}
            <View style={styles.distributionCard}>
              <Text style={styles.distributionTitle}>Your Time Distribution</Text>
              {getDefaultSkillPriorities(learningStyle).map((sp) => (
                <View key={sp.skill} style={styles.distRow}>
                  <Text style={styles.distSkill}>{sp.skill.charAt(0).toUpperCase() + sp.skill.slice(1)}</Text>
                  <View style={styles.distBarBg}>
                    <View style={[styles.distBarFill, { width: `${sp.weight * 100}%` }]} />
                  </View>
                  <Text style={styles.distPercent}>{Math.round(sp.weight * 100)}%</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Step 5: Review */}
        {step === "review" && (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Your Learning Plan</Text>
            <Text style={styles.stepDesc}>Here's what we've calculated for you:</Text>

            <View style={styles.reviewCard}>
              <View style={styles.reviewRow}>
                <Ionicons name="flag" size={18} color={Colors.secondary} />
                <Text style={styles.reviewLabel}>Goal</Text>
                <Text style={styles.reviewValue}>{targetLevel} {language}</Text>
              </View>
              <View style={styles.reviewRow}>
                <Ionicons name="calendar" size={18} color={Colors.gold} />
                <Text style={styles.reviewLabel}>Timeline</Text>
                <Text style={styles.reviewValue}>{timelineMonths} months</Text>
              </View>
              <View style={styles.reviewRow}>
                <Ionicons name="time" size={18} color={Colors.accent} />
                <Text style={styles.reviewLabel}>Daily Study</Text>
                <Text style={styles.reviewValue}>{minutesPerDay} min/day</Text>
              </View>
              <View style={styles.reviewRow}>
                <Ionicons name="repeat" size={18} color={Colors.success} />
                <Text style={styles.reviewLabel}>Frequency</Text>
                <Text style={styles.reviewValue}>{daysPerWeek} days/week</Text>
              </View>
              <View style={styles.reviewRow}>
                <Ionicons name="school" size={18} color="#8B5CF6" />
                <Text style={styles.reviewLabel}>Style</Text>
                <Text style={styles.reviewValue}>{learningStyle}</Text>
              </View>
              <View style={styles.reviewRow}>
                <Ionicons name="hourglass" size={18} color={Colors.warning} />
                <Text style={styles.reviewLabel}>Total Hours</Text>
                <Text style={styles.reviewValue}>~{estimatedHours}h needed</Text>
              </View>
            </View>

            <View style={styles.insightCard}>
              <Ionicons name="analytics" size={18} color={Colors.secondary} />
              <Text style={styles.insightText}>
                We'll track your progress daily and let you know if you're on pace, ahead, or need to catch up. You can take days off and still stay on track — just like billable hours at work!
              </Text>
            </View>
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Bottom Action */}
      <View style={styles.bottomAction}>
        {step === "review" ? (
          <TouchableOpacity style={styles.saveBtn} onPress={handleSave} activeOpacity={0.8}>
            <Ionicons name="checkmark-circle" size={20} color="#fff" />
            <Text style={styles.saveBtnText}>Start Tracking My Pace</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.nextBtn} onPress={goNext} activeOpacity={0.8}>
            <Text style={styles.nextBtnText}>Continue</Text>
            <Ionicons name="arrow-forward" size={18} color="#fff" />
          </TouchableOpacity>
        )}
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
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  backBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: FontSize.lg, fontWeight: "700", color: Colors.textPrimary },
  stepIndicator: { fontSize: FontSize.sm, color: Colors.textSecondary, fontWeight: "600" },
  progressBar: {
    height: 3,
    backgroundColor: Colors.border,
    marginHorizontal: Spacing.lg,
    borderRadius: 2,
  },
  progressFill: {
    height: 3,
    backgroundColor: Colors.secondary,
    borderRadius: 2,
  },
  content: { flex: 1, paddingHorizontal: Spacing.lg },
  stepContent: { paddingTop: Spacing.xl },
  stepTitle: { fontSize: 22, fontWeight: "800", color: Colors.textPrimary, marginBottom: 6 },
  stepDesc: { fontSize: FontSize.sm, color: Colors.textSecondary, lineHeight: 20, marginBottom: Spacing.lg },
  optionCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.surfaceCard,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 10,
  },
  optionCardSelected: {
    borderColor: Colors.secondary,
    backgroundColor: Colors.secondary + "10",
  },
  optionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  optionIconSelected: { backgroundColor: Colors.secondary },
  optionTitle: { fontSize: FontSize.md, fontWeight: "700", color: Colors.textPrimary },
  optionTitleSelected: { color: Colors.secondary },
  optionDesc: { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 2 },
  levelGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: Spacing.lg },
  levelChip: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surfaceCard,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
  },
  levelChipSelected: { borderColor: Colors.secondary, backgroundColor: Colors.secondary + "15" },
  levelChipText: { fontSize: FontSize.sm, fontWeight: "700", color: Colors.textPrimary },
  levelChipTextSelected: { color: Colors.secondary },
  levelChipSub: { fontSize: 10, color: Colors.textMuted, marginTop: 2 },
  languageRow: { flexDirection: "row", alignItems: "center", gap: 12, marginTop: Spacing.md },
  languageLabel: { fontSize: FontSize.sm, fontWeight: "600", color: Colors.textPrimary },
  languageInput: {
    flex: 1,
    backgroundColor: Colors.surfaceCard,
    borderRadius: BorderRadius.md,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: Colors.textPrimary,
    fontSize: FontSize.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  timelineGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  timelineCard: {
    width: "47%",
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.surfaceCard,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  timelineCardSelected: { borderColor: Colors.secondary, backgroundColor: Colors.secondary + "10" },
  timelineCardWarning: { borderColor: Colors.warning + "50" },
  timelineLabel: { fontSize: FontSize.md, fontWeight: "700", color: Colors.textPrimary },
  timelineLabelSelected: { color: Colors.secondary },
  timelineDesc: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 2 },
  warningBadge: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 6 },
  warningText: { fontSize: 10, color: Colors.warning, fontWeight: "600" },
  fieldLabel: { fontSize: FontSize.sm, fontWeight: "700", color: Colors.textPrimary, marginTop: Spacing.lg, marginBottom: 10 },
  sliderRow: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  minuteChip: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surfaceCard,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  minuteChipSelected: { borderColor: Colors.secondary, backgroundColor: Colors.secondary + "15" },
  minuteChipText: { fontSize: FontSize.sm, fontWeight: "600", color: Colors.textSecondary },
  minuteChipTextSelected: { color: Colors.secondary, fontWeight: "700" },
  scheduleInput: {
    backgroundColor: Colors.surfaceCard,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    color: Colors.textPrimary,
    fontSize: FontSize.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    minHeight: 60,
    textAlignVertical: "top",
  },
  insightCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    backgroundColor: Colors.secondary + "10",
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginTop: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.secondary + "30",
  },
  insightText: { flex: 1, fontSize: FontSize.sm, color: Colors.textSecondary, lineHeight: 20 },
  distributionCard: {
    backgroundColor: Colors.surfaceCard,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginTop: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  distributionTitle: { fontSize: FontSize.sm, fontWeight: "700", color: Colors.textPrimary, marginBottom: 12 },
  distRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 8 },
  distSkill: { fontSize: FontSize.xs, color: Colors.textSecondary, width: 80 },
  distBarBg: { flex: 1, height: 6, backgroundColor: Colors.border, borderRadius: 3 },
  distBarFill: { height: 6, backgroundColor: Colors.secondary, borderRadius: 3 },
  distPercent: { fontSize: 11, color: Colors.textMuted, width: 30, textAlign: "right" },
  reviewCard: {
    backgroundColor: Colors.surfaceCard,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  reviewRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border + "50",
  },
  reviewLabel: { flex: 1, fontSize: FontSize.sm, color: Colors.textSecondary },
  reviewValue: { fontSize: FontSize.sm, fontWeight: "700", color: Colors.textPrimary },
  bottomAction: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  nextBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.secondary,
    paddingVertical: 16,
    borderRadius: BorderRadius.lg,
  },
  nextBtnText: { fontSize: FontSize.md, fontWeight: "700", color: "#fff" },
  saveBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.success,
    paddingVertical: 16,
    borderRadius: BorderRadius.lg,
  },
  saveBtnText: { fontSize: FontSize.md, fontWeight: "700", color: "#fff" },
});
