/**
 * Certification Progress Screen
 *
 * Shows CEFR hour tracking dashboard:
 * - Total hours completed toward certification
 * - Hours by activity type (visual bar chart)
 * - Progress ring toward next level
 * - Estimated time to next level
 * - CEFR requirements table for the target language
 */
import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, {
  FadeInDown,
  FadeInUp,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from "react-native-reanimated";
import Svg, { Circle } from "react-native-svg";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useColors } from "@/hooks/use-colors";
import {
  getLanguageProgress,
  getCertificationProgress,
  getAllLanguages,
  getCEFRRequirements,
  getActivityDisplayInfo,
  type LanguageProgress,
  type CertificationProgress,
  type ActivityType,
  type CEFRLevel,
} from "@/lib/cefr-hour-tracker";

const AnimatedView = Animated.createAnimatedComponent(View);

export default function CertificationProgressScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ language?: string }>();
  const colors = useColors();

  const [loading, setLoading] = useState(true);
  const [selectedLanguage, setSelectedLanguage] = useState(params.language || "Spanish");
  const [languages, setLanguages] = useState<string[]>([]);
  const [progress, setProgress] = useState<LanguageProgress | null>(null);
  const [certification, setCertification] = useState<CertificationProgress | null>(null);

  // Progress ring animation
  const ringProgress = useSharedValue(0);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const allLangs = await getAllLanguages();
      if (allLangs.length === 0) {
        // If no data yet, use the language from AsyncStorage
        const stored = await AsyncStorage.getItem("selectedLanguage");
        const lang = stored || params.language || "Spanish";
        setLanguages([lang]);
        setSelectedLanguage(lang);
      } else {
        setLanguages(allLangs);
        if (!allLangs.includes(selectedLanguage) && allLangs.length > 0) {
          setSelectedLanguage(allLangs[0]);
        }
      }

      const langProgress = await getLanguageProgress(selectedLanguage);
      const certProgress = await getCertificationProgress(selectedLanguage);

      setProgress(langProgress);
      setCertification(certProgress);

      // Animate progress ring
      ringProgress.value = 0;
      setTimeout(() => {
        ringProgress.value = withTiming(certProgress.percentComplete / 100, {
          duration: 1200,
          easing: Easing.out(Easing.cubic),
        });
      }, 300);
    } catch (e) {
      console.error("[CertProgress] Load error:", e);
    } finally {
      setLoading(false);
    }
  }, [selectedLanguage]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ─── Progress Ring Component ─────────────────────────────────────────────
  const ProgressRing = ({ percent, level }: { percent: number; level: CEFRLevel }) => {
    const size = 180;
    const strokeWidth = 12;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;

    const animatedStyle = useAnimatedStyle(() => ({
      transform: [{ rotate: "-90deg" }],
    }));

    const strokeDashoffset = circumference * (1 - Math.min(percent, 100) / 100);

    return (
      <View style={{ alignItems: "center", justifyContent: "center" }}>
        <Svg width={size} height={size}>
          {/* Background circle */}
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={colors.border}
            strokeWidth={strokeWidth}
            fill="none"
            opacity={0.3}
          />
          {/* Progress circle */}
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={colors.tint}
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={`${circumference}`}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            rotation={-90}
            origin={`${size / 2}, ${size / 2}`}
          />
        </Svg>
        <View style={[StyleSheet.absoluteFill, { alignItems: "center", justifyContent: "center" }]}>
          <Text style={[styles.ringLevel, { color: colors.tint }]}>{level}</Text>
          <Text style={[styles.ringPercent, { color: colors.foreground }]}>{percent}%</Text>
          <Text style={[styles.ringLabel, { color: colors.muted }]}>Complete</Text>
        </View>
      </View>
    );
  };

  // ─── Activity Bar Chart ──────────────────────────────────────────────────
  const ActivityChart = ({ hoursByActivity }: { hoursByActivity: Record<ActivityType, number> }) => {
    const entries = Object.entries(hoursByActivity)
      .filter(([, hours]) => hours > 0)
      .sort(([, a], [, b]) => b - a);

    if (entries.length === 0) {
      return (
        <View style={[styles.emptyChart, { backgroundColor: colors.surface }]}>
          <Ionicons name="bar-chart-outline" size={40} color={colors.muted} />
          <Text style={[styles.emptyText, { color: colors.muted }]}>
            Complete exercises to see your activity breakdown
          </Text>
        </View>
      );
    }

    const maxHours = Math.max(...entries.map(([, h]) => h));

    return (
      <View style={styles.chartContainer}>
        {entries.map(([type, hours], idx) => {
          const info = getActivityDisplayInfo(type as ActivityType);
          const barWidth = maxHours > 0 ? (hours / maxHours) * 100 : 0;
          return (
            <AnimatedView
              key={type}
              entering={FadeInDown.delay(idx * 80).duration(400)}
              style={styles.chartRow}
            >
              <View style={styles.chartLabel}>
                <Ionicons name={info.icon as any} size={16} color={info.color} />
                <Text style={[styles.chartLabelText, { color: colors.foreground }]} numberOfLines={1}>
                  {info.label}
                </Text>
              </View>
              <View style={[styles.chartBarBg, { backgroundColor: colors.surface }]}>
                <View
                  style={[
                    styles.chartBar,
                    {
                      width: `${Math.max(barWidth, 5)}%`,
                      backgroundColor: info.color,
                    },
                  ]}
                />
              </View>
              <Text style={[styles.chartHours, { color: colors.muted }]}>
                {hours >= 1 ? `${hours.toFixed(1)}h` : `${Math.round(hours * 60)}m`}
              </Text>
            </AnimatedView>
          );
        })}
      </View>
    );
  };

  // ─── CEFR Requirements Table ─────────────────────────────────────────────
  const CEFRTable = () => {
    const requirements = getCEFRRequirements(selectedLanguage);
    const currentLevel = certification?.currentLevel || "A1";

    return (
      <View style={[styles.tableContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        {/* Header */}
        <View style={[styles.tableHeader, { borderBottomColor: colors.border }]}>
          <Text style={[styles.tableHeaderText, { color: colors.muted, flex: 1 }]}>Level</Text>
          <Text style={[styles.tableHeaderText, { color: colors.muted, flex: 1.5 }]}>Hours Needed</Text>
          <Text style={[styles.tableHeaderText, { color: colors.muted, flex: 1.5 }]}>Cumulative</Text>
          <Text style={[styles.tableHeaderText, { color: colors.muted, flex: 1 }]}>Status</Text>
        </View>
        {/* Rows */}
        {requirements.map((req, idx) => {
          const levelIdx = ["A1", "A2", "B1", "B2", "C1", "C2"].indexOf(req.level);
          const currentIdx = ["A1", "A2", "B1", "B2", "C1", "C2"].indexOf(currentLevel);
          const isCompleted = levelIdx < currentIdx;
          const isCurrent = req.level === currentLevel;

          return (
            <View
              key={req.level}
              style={[
                styles.tableRow,
                idx < requirements.length - 1 && { borderBottomColor: colors.border, borderBottomWidth: 0.5 },
                isCurrent && { backgroundColor: `${colors.tint}15` },
              ]}
            >
              <View style={{ flex: 1 }}>
                <Text
                  style={[
                    styles.tableCellLevel,
                    { color: isCurrent ? colors.tint : isCompleted ? colors.success : colors.foreground },
                  ]}
                >
                  {req.level}
                </Text>
              </View>
              <Text style={[styles.tableCell, { color: colors.foreground, flex: 1.5 }]}>
                {req.incrementalHours}h
              </Text>
              <Text style={[styles.tableCell, { color: colors.foreground, flex: 1.5 }]}>
                {req.cumulativeHours}h
              </Text>
              <View style={{ flex: 1, alignItems: "center" }}>
                {isCompleted ? (
                  <Ionicons name="checkmark-circle" size={20} color={colors.success} />
                ) : isCurrent ? (
                  <View style={[styles.currentBadge, { backgroundColor: colors.tint }]}>
                    <Text style={styles.currentBadgeText}>NOW</Text>
                  </View>
                ) : (
                  <Ionicons name="lock-closed-outline" size={18} color={colors.muted} />
                )}
              </View>
            </View>
          );
        })}
      </View>
    );
  };

  // ─── Main Render ─────────────────────────────────────────────────────────
  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.tint} />
          <Text style={[styles.loadingText, { color: colors.muted }]}>Loading progress...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={["top", "left", "right"]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity
          onPress={() => {
            if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.back();
          }}
          style={styles.backBtn}
        >
          <Ionicons name="chevron-back" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Certification Progress</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Language Selector */}
        {languages.length > 1 && (
          <AnimatedView entering={FadeInDown.delay(100).duration(400)}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.langSelector}
            >
              {languages.map((lang) => (
                <TouchableOpacity
                  key={lang}
                  style={[
                    styles.langChip,
                    {
                      backgroundColor: lang === selectedLanguage ? colors.tint : colors.surface,
                      borderColor: lang === selectedLanguage ? colors.tint : colors.border,
                    },
                  ]}
                  onPress={() => {
                    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setSelectedLanguage(lang);
                  }}
                >
                  <Text
                    style={[
                      styles.langChipText,
                      { color: lang === selectedLanguage ? "#FFFFFF" : colors.foreground },
                    ]}
                  >
                    {lang}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </AnimatedView>
        )}

        {/* Progress Ring */}
        <AnimatedView entering={FadeInUp.delay(200).duration(500)} style={styles.ringSection}>
          <ProgressRing
            percent={certification?.percentComplete || 0}
            level={certification?.currentLevel || "A1"}
          />
          <View style={styles.ringStats}>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.foreground }]}>
                {certification?.hoursCompleted || 0}h
              </Text>
              <Text style={[styles.statLabel, { color: colors.muted }]}>Completed</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.foreground }]}>
                {certification?.hoursToNextLevel || 0}h
              </Text>
              <Text style={[styles.statLabel, { color: colors.muted }]}>To Next Level</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.foreground }]}>
                {certification?.estimatedDaysToNextLevel === 999
                  ? "—"
                  : `${certification?.estimatedDaysToNextLevel || 0}d`}
              </Text>
              <Text style={[styles.statLabel, { color: colors.muted }]}>Est. Days Left</Text>
            </View>
          </View>
        </AnimatedView>

        {/* Quick Stats Cards */}
        <AnimatedView entering={FadeInDown.delay(300).duration(400)} style={styles.quickStats}>
          <View style={[styles.quickCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Ionicons name="flame" size={24} color="#FF6B6B" />
            <Text style={[styles.quickValue, { color: colors.foreground }]}>{progress?.streak || 0}</Text>
            <Text style={[styles.quickLabel, { color: colors.muted }]}>Day Streak</Text>
          </View>
          <View style={[styles.quickCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Ionicons name="school" size={24} color={colors.tint} />
            <Text style={[styles.quickValue, { color: colors.foreground }]}>{progress?.totalSessions || 0}</Text>
            <Text style={[styles.quickLabel, { color: colors.muted }]}>Sessions</Text>
          </View>
          <View style={[styles.quickCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Ionicons name="trophy" size={24} color="#FFB800" />
            <Text style={[styles.quickValue, { color: colors.foreground }]}>{progress?.totalXP || 0}</Text>
            <Text style={[styles.quickLabel, { color: colors.muted }]}>Total XP</Text>
          </View>
          <View style={[styles.quickCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Ionicons name="analytics" size={24} color="#10B981" />
            <Text style={[styles.quickValue, { color: colors.foreground }]}>
              {progress?.averageAccuracy ? `${Math.round(progress.averageAccuracy * 100)}%` : "—"}
            </Text>
            <Text style={[styles.quickLabel, { color: colors.muted }]}>Accuracy</Text>
          </View>
        </AnimatedView>

        {/* Average Daily Pace */}
        <AnimatedView entering={FadeInDown.delay(350).duration(400)}>
          <View style={[styles.paceCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.paceRow}>
              <Ionicons name="speedometer-outline" size={20} color={colors.tint} />
              <Text style={[styles.paceTitle, { color: colors.foreground }]}>Your Daily Pace</Text>
            </View>
            <Text style={[styles.paceValue, { color: colors.tint }]}>
              {certification?.averageDailyHours
                ? certification.averageDailyHours >= 1
                  ? `${certification.averageDailyHours.toFixed(1)} hours/day`
                  : `${Math.round(certification.averageDailyHours * 60)} min/day`
                : "Start learning to track pace"}
            </Text>
            <Text style={[styles.paceHint, { color: colors.muted }]}>
              {certification?.nextLevel
                ? `At this pace, you'll reach ${certification.nextLevel} in ~${certification.estimatedDaysToNextLevel === 999 ? "∞" : certification.estimatedDaysToNextLevel} days`
                : "You've reached the highest level!"}
            </Text>
          </View>
        </AnimatedView>

        {/* Hours by Activity */}
        <AnimatedView entering={FadeInDown.delay(400).duration(400)}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Hours by Activity</Text>
          <ActivityChart hoursByActivity={progress?.hoursByActivity || ({} as Record<ActivityType, number>)} />
        </AnimatedView>

        {/* CEFR Requirements Table */}
        <AnimatedView entering={FadeInDown.delay(500).duration(400)}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            CEFR Requirements — {selectedLanguage}
          </Text>
          <Text style={[styles.sectionSubtitle, { color: colors.muted }]}>
            Hours adjusted for language difficulty (FSI estimates)
          </Text>
          <CEFRTable />
        </AnimatedView>

        {/* Bottom padding */}
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  loadingText: { fontSize: 15 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
  },
  backBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 18, fontWeight: "700" },
  scrollContent: { paddingHorizontal: 20, paddingTop: 16 },
  // Language selector
  langSelector: { gap: 8, paddingBottom: 16 },
  langChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  langChipText: { fontSize: 14, fontWeight: "600" },
  // Progress ring
  ringSection: { alignItems: "center", marginBottom: 24 },
  ringLevel: { fontSize: 28, fontWeight: "800", letterSpacing: 1 },
  ringPercent: { fontSize: 22, fontWeight: "700", marginTop: 2 },
  ringLabel: { fontSize: 12, marginTop: 2 },
  ringStats: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 20,
    gap: 0,
  },
  statItem: { alignItems: "center", flex: 1 },
  statValue: { fontSize: 18, fontWeight: "700" },
  statLabel: { fontSize: 11, marginTop: 2 },
  statDivider: { width: 1, height: 30 },
  // Quick stats
  quickStats: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 20,
  },
  quickCard: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    gap: 4,
  },
  quickValue: { fontSize: 18, fontWeight: "700" },
  quickLabel: { fontSize: 10, textAlign: "center" },
  // Pace card
  paceCard: {
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 24,
    gap: 6,
  },
  paceRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  paceTitle: { fontSize: 15, fontWeight: "600" },
  paceValue: { fontSize: 20, fontWeight: "700" },
  paceHint: { fontSize: 13 },
  // Section
  sectionTitle: { fontSize: 18, fontWeight: "700", marginBottom: 4 },
  sectionSubtitle: { fontSize: 13, marginBottom: 12 },
  // Chart
  chartContainer: { gap: 10, marginBottom: 28 },
  chartRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  chartLabel: { flexDirection: "row", alignItems: "center", gap: 6, width: 100 },
  chartLabelText: { fontSize: 12, fontWeight: "500", flex: 1 },
  chartBarBg: { flex: 1, height: 20, borderRadius: 10, overflow: "hidden" },
  chartBar: { height: "100%", borderRadius: 10 },
  chartHours: { fontSize: 12, fontWeight: "600", width: 40, textAlign: "right" },
  emptyChart: {
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
    borderRadius: 14,
    gap: 8,
    marginBottom: 28,
  },
  emptyText: { fontSize: 13, textAlign: "center" },
  // Table
  tableContainer: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: "hidden",
    marginBottom: 20,
  },
  tableHeader: {
    flexDirection: "row",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  tableHeaderText: { fontSize: 12, fontWeight: "600", textTransform: "uppercase" },
  tableRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  tableCellLevel: { fontSize: 16, fontWeight: "700" },
  tableCell: { fontSize: 14 },
  currentBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  currentBadgeText: { color: "#FFF", fontSize: 10, fontWeight: "800" },
});
