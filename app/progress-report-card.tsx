import { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Share,
  Platform,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { captureRef } from "react-native-view-shot";
import * as Sharing from "expo-sharing";
import { Colors, Spacing, BorderRadius, FontSize } from "../constants/Colors";
import { createVanillaClient } from "@/lib/trpc";
import { FeatureGateBanner } from "@/components/feature-gate-banner";
import { BadgeUnlockModal } from "@/components/badge-unlock-modal";

// ─── Types ──────────────────────────────────────────────────────────────────
interface SkillGrade {
  skill: string;
  icon: string;
  grade: string; // A+, A, B+, B, C+, C, D, F
  score: number; // 0-100
  improvement: number; // % change from last term
  hoursSpent: number;
}

interface TermReport {
  term: string;
  period: string;
  gpa: number;
  totalXP: number;
  wordsLearned: number;
  lessonsCompleted: number;
  streak: number;
  skills: SkillGrade[];
}

interface AchievementBadge {
  id: string;
  title: string;
  icon: string;
  date: string;
  description: string;
}

// ─── Grade Helpers ──────────────────────────────────────────────────────────
function scoreToGrade(score: number): string {
  if (score >= 97) return "A+";
  if (score >= 93) return "A";
  if (score >= 90) return "A-";
  if (score >= 87) return "B+";
  if (score >= 83) return "B";
  if (score >= 80) return "B-";
  if (score >= 77) return "C+";
  if (score >= 73) return "C";
  if (score >= 70) return "C-";
  if (score >= 67) return "D+";
  if (score >= 60) return "D";
  return "F";
}

function gradeColor(grade: string): string {
  if (grade.startsWith("A")) return Colors.success;
  if (grade.startsWith("B")) return Colors.secondary;
  if (grade.startsWith("C")) return "#F59E0B";
  if (grade.startsWith("D")) return Colors.warning;
  return Colors.error;
}

function gpaToLetter(gpa: number): string {
  if (gpa >= 3.7) return "A";
  if (gpa >= 3.3) return "A-";
  if (gpa >= 3.0) return "B+";
  if (gpa >= 2.7) return "B";
  if (gpa >= 2.3) return "B-";
  if (gpa >= 2.0) return "C+";
  if (gpa >= 1.7) return "C";
  return "D";
}

// ─── Real Data Loader ──────────────────────────────────────────────────────
const FLASHCARD_KEY = "linguavibe_flashcards";
const JOURNAL_KEY = "linguavibe_journal_entries";
const GAMIFICATION_KEY = "linguavibe_gamification";

interface RealStats {
  flashcardAccuracy: number;
  flashcardsMastered: number;
  flashcardsTotal: number;
  flashcardsDueToday: number;
  journalEntries: number;
  journalAvgScore: number;
  journalStreak: number;
  totalXP: number;
  currentStreak: number;
  wordsLearned: number;
  lessonsCompleted: number;
  pronunciationAvg: number;
}

async function loadRealStats(): Promise<RealStats> {
  const stats: RealStats = {
    flashcardAccuracy: 0, flashcardsMastered: 0, flashcardsTotal: 0, flashcardsDueToday: 0,
    journalEntries: 0, journalAvgScore: 0, journalStreak: 0,
    totalXP: 0, currentStreak: 0, wordsLearned: 0, lessonsCompleted: 0, pronunciationAvg: 0,
  };
  try {
    // Flashcard data from AsyncStorage
    const fcRaw = await AsyncStorage.getItem(FLASHCARD_KEY);
    if (fcRaw) {
      const cards = JSON.parse(fcRaw) as Array<{ box: number; timesCorrect: number; timesIncorrect: number; nextReview: string }>;
      stats.flashcardsTotal = cards.length;
      stats.flashcardsMastered = cards.filter(c => c.box >= 5).length;
      const totalAttempts = cards.reduce((s, c) => s + c.timesCorrect + c.timesIncorrect, 0);
      const totalCorrect = cards.reduce((s, c) => s + c.timesCorrect, 0);
      stats.flashcardAccuracy = totalAttempts > 0 ? Math.round((totalCorrect / totalAttempts) * 100) : 0;
      stats.flashcardsDueToday = cards.filter(c => new Date(c.nextReview) <= new Date()).length;
    }
    // Journal data from AsyncStorage
    const jRaw = await AsyncStorage.getItem(JOURNAL_KEY);
    if (jRaw) {
      const entries = JSON.parse(jRaw) as Array<{ score?: number; date: string }>;
      stats.journalEntries = entries.length;
      const scored = entries.filter(e => typeof e.score === "number");
      stats.journalAvgScore = scored.length > 0 ? Math.round(scored.reduce((s, e) => s + (e.score || 0), 0) / scored.length) : 0;
    }
    const jsRaw = await AsyncStorage.getItem("linguavibe_journal_streak");
    if (jsRaw) { const js = JSON.parse(jsRaw); stats.journalStreak = js.current || 0; }
    // Gamification data from AsyncStorage
    const gRaw = await AsyncStorage.getItem(GAMIFICATION_KEY);
    if (gRaw) {
      const g = JSON.parse(gRaw);
      stats.totalXP = g.totalXP || 0;
      stats.currentStreak = g.currentStreak || 0;
      stats.wordsLearned = g.wordsLearned || 0;
      stats.lessonsCompleted = g.lessonsCompleted || 0;
    }
  } catch {}
  return stats;
}

function buildReportFromStats(stats: RealStats): TermReport {
  const now = new Date();
  const monthNames = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  const vocabScore = Math.min(100, 50 + stats.wordsLearned);
  const grammarScore = stats.journalAvgScore > 0 ? stats.journalAvgScore : 70;
  const listeningScore = Math.min(100, 60 + Math.floor(stats.lessonsCompleted * 1.5));
  const speakingScore = stats.pronunciationAvg > 0 ? stats.pronunciationAvg : Math.min(100, 55 + stats.currentStreak * 2);
  const readingScore = Math.min(100, 65 + stats.flashcardAccuracy * 0.3);
  const writingScore = stats.journalEntries > 0 ? Math.min(100, 60 + stats.journalEntries * 3) : 65;
  const pronunciationScore = stats.pronunciationAvg > 0 ? stats.pronunciationAvg : 70;
  const culturalScore = Math.min(100, 60 + stats.lessonsCompleted);
  const allScores = [vocabScore, grammarScore, listeningScore, speakingScore, readingScore, writingScore, pronunciationScore, culturalScore];
  const avgScore = allScores.reduce((s, v) => s + v, 0) / allScores.length;
  const gpa = Number(((avgScore / 100) * 4).toFixed(1));
  return {
    term: "Current",
    period: `${monthNames[now.getMonth()]} ${now.getFullYear()}`,
    gpa,
    totalXP: stats.totalXP,
    wordsLearned: stats.wordsLearned,
    lessonsCompleted: stats.lessonsCompleted,
    streak: stats.currentStreak,
    skills: [
      { skill: "Vocabulary", icon: "book", grade: scoreToGrade(vocabScore), score: vocabScore, improvement: 0, hoursSpent: 0 },
      { skill: "Grammar", icon: "construct", grade: scoreToGrade(grammarScore), score: grammarScore, improvement: 0, hoursSpent: 0 },
      { skill: "Listening", icon: "ear", grade: scoreToGrade(listeningScore), score: listeningScore, improvement: 0, hoursSpent: 0 },
      { skill: "Speaking", icon: "mic", grade: scoreToGrade(speakingScore), score: speakingScore, improvement: 0, hoursSpent: 0 },
      { skill: "Reading", icon: "document-text", grade: scoreToGrade(readingScore), score: readingScore, improvement: 0, hoursSpent: 0 },
      { skill: "Writing", icon: "pencil", grade: scoreToGrade(writingScore), score: writingScore, improvement: 0, hoursSpent: 0 },
      { skill: "Pronunciation", icon: "volume-high", grade: scoreToGrade(pronunciationScore), score: pronunciationScore, improvement: 0, hoursSpent: 0 },
      { skill: "Cultural Knowledge", icon: "globe", grade: scoreToGrade(culturalScore), score: culturalScore, improvement: 0, hoursSpent: 0 },
    ],
  };
}

// ─── Fallback Data ─────────────────────────────────────────────────────────
const FALLBACK_TERM: TermReport = {
  term: "Current",
  period: "June 2026",
  gpa: 3.6,
  totalXP: 2840,
  wordsLearned: 87,
  lessonsCompleted: 24,
  streak: 12,
  skills: [
    { skill: "Vocabulary", icon: "book", grade: "A", score: 94, improvement: 12, hoursSpent: 8.5 },
    { skill: "Grammar", icon: "construct", grade: "B+", score: 88, improvement: 8, hoursSpent: 6.2 },
    { skill: "Listening", icon: "ear", grade: "A-", score: 91, improvement: 15, hoursSpent: 5.8 },
    { skill: "Speaking", icon: "mic", grade: "B", score: 84, improvement: 22, hoursSpent: 7.1 },
    { skill: "Reading", icon: "document-text", grade: "A", score: 93, improvement: 6, hoursSpent: 4.3 },
    { skill: "Writing", icon: "pencil", grade: "B+", score: 87, improvement: 10, hoursSpent: 3.9 },
    { skill: "Pronunciation", icon: "volume-high", grade: "B+", score: 86, improvement: 18, hoursSpent: 5.5 },
    { skill: "Cultural Knowledge", icon: "globe", grade: "A-", score: 90, improvement: 5, hoursSpent: 2.8 },
  ],
};

const PAST_TERMS: TermReport[] = [
  {
    term: "Term 2",
    period: "April 2026",
    gpa: 3.3,
    totalXP: 2210,
    wordsLearned: 65,
    lessonsCompleted: 18,
    streak: 8,
    skills: [
      { skill: "Vocabulary", icon: "book", grade: "B+", score: 82, improvement: 10, hoursSpent: 7.0 },
      { skill: "Grammar", icon: "construct", grade: "B", score: 80, improvement: 5, hoursSpent: 5.5 },
      { skill: "Listening", icon: "ear", grade: "B-", score: 76, improvement: 8, hoursSpent: 4.2 },
      { skill: "Speaking", icon: "mic", grade: "C+", score: 62, improvement: 15, hoursSpent: 5.0 },
      { skill: "Reading", icon: "document-text", grade: "A-", score: 87, improvement: 3, hoursSpent: 3.8 },
      { skill: "Writing", icon: "pencil", grade: "B", score: 77, improvement: 7, hoursSpent: 3.2 },
      { skill: "Pronunciation", icon: "volume-high", grade: "C+", score: 68, improvement: 12, hoursSpent: 4.0 },
      { skill: "Cultural Knowledge", icon: "globe", grade: "A-", score: 85, improvement: 4, hoursSpent: 2.5 },
    ],
  },
  {
    term: "Term 1",
    period: "March 2026",
    gpa: 2.9,
    totalXP: 1580,
    wordsLearned: 42,
    lessonsCompleted: 12,
    streak: 5,
    skills: [
      { skill: "Vocabulary", icon: "book", grade: "B-", score: 72, improvement: 0, hoursSpent: 5.5 },
      { skill: "Grammar", icon: "construct", grade: "C+", score: 75, improvement: 0, hoursSpent: 4.8 },
      { skill: "Listening", icon: "ear", grade: "C+", score: 68, improvement: 0, hoursSpent: 3.5 },
      { skill: "Speaking", icon: "mic", grade: "C", score: 47, improvement: 0, hoursSpent: 3.2 },
      { skill: "Reading", icon: "document-text", grade: "B+", score: 84, improvement: 0, hoursSpent: 3.0 },
      { skill: "Writing", icon: "pencil", grade: "B-", score: 70, improvement: 0, hoursSpent: 2.8 },
      { skill: "Pronunciation", icon: "volume-high", grade: "C", score: 56, improvement: 0, hoursSpent: 3.0 },
      { skill: "Cultural Knowledge", icon: "globe", grade: "B", score: 81, improvement: 0, hoursSpent: 2.0 },
    ],
  },
];

// ─── Weekly/Monthly Progress Data ────────────────────────────────────────────
interface WeeklyProgress {
  week: string;
  xp: number;
  words: number;
  lessons: number;
  minutes: number;
}

const WEEKLY_PROGRESS: WeeklyProgress[] = [
  { week: "Apr 28", xp: 820, words: 42, lessons: 5, minutes: 145 },
  { week: "May 5", xp: 1050, words: 58, lessons: 7, minutes: 210 },
  { week: "May 12", xp: 940, words: 51, lessons: 6, minutes: 180 },
  { week: "May 19", xp: 1200, words: 63, lessons: 8, minutes: 240 },
  { week: "May 26", xp: 680, words: 35, lessons: 4, minutes: 120 },
];

const MONTHLY_SUMMARY = {
  thisMonth: { xp: 4690, words: 249, lessons: 30, minutes: 895, streak: 23, songsCompleted: 12, conversationsHeld: 34 },
  lastMonth: { xp: 3820, words: 198, lessons: 24, minutes: 720, streak: 18, songsCompleted: 8, conversationsHeld: 22 },
};

const ACHIEVEMENTS: AchievementBadge[] = [
  { id: "1", title: "First Words", icon: "star", date: "Mar 1", description: "Learned first 10 words" },
  { id: "2", title: "Week Warrior", icon: "flame", date: "Mar 8", description: "7-day streak" },
  { id: "3", title: "Grammar Guru", icon: "construct", date: "Mar 22", description: "Aced grammar quiz" },
  { id: "4", title: "Chatterbox", icon: "chatbubbles", date: "Apr 5", description: "10 AI conversations" },
  { id: "5", title: "Polyglot Path", icon: "globe", date: "Apr 18", description: "Completed A1 level" },
  { id: "6", title: "Ear Training", icon: "ear", date: "May 2", description: "90%+ listening score" },
  { id: "7", title: "Slang Master", icon: "flash", date: "May 10", description: "Learned 25 expressions" },
  { id: "8", title: "Dedication", icon: "trophy", date: "May 20", description: "50 lessons completed" },
];

// ─── Component ──────────────────────────────────────────────────────────────
export default function ProgressReportCardScreen() {
  const [selectedTerm, setSelectedTerm] = useState<number>(0); // 0 = current
  const [targetLanguage, setTargetLanguage] = useState("Spanish");
  const [dialect, setDialect] = useState("Dominican");
  const [liveReport, setLiveReport] = useState<TermReport | null>(null);
  const [aiInsight, setAiInsight] = useState<string>("");
  const [loadingInsight, setLoadingInsight] = useState(false);
  const [realStats, setRealStats] = useState<RealStats | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [goalGrade, setGoalGrade] = useState<string | null>(null);
  const [goalScore, setGoalScore] = useState<number>(0);
  const [goalsSet, setGoalsSet] = useState<number>(0);
  const [goalsCompleted, setGoalsCompleted] = useState<number>(0);
  const [goalStreak, setGoalStreak] = useState<{ currentStreak: number; longestStreak: number; totalWeeksHit: number; totalWeeksTracked: number } | null>(null);
  const [streakDisplay, setStreakDisplay] = useState<{ emoji: string; label: string; color: string; subtext: string } | null>(null);
  const [showBadgeModal, setShowBadgeModal] = useState(false);
  const [unlockedBadge, setUnlockedBadge] = useState<any>(null);
  const [unlockedStreakWeeks, setUnlockedStreakWeeks] = useState(0);
  const reportCardRef = useRef<View>(null);

  useEffect(() => {
    loadLanguagePrefs();
    loadLiveData();
    loadGoalGrade();
    loadGoalStreak();
    checkBadgeCelebration();
  }, []);

  const checkBadgeCelebration = async () => {
    try {
      const { checkForNewBadge } = await import("@/lib/badge-celebration");
      const result = await checkForNewBadge();
      if (result.badge) {
        setUnlockedBadge(result.badge);
        setUnlockedStreakWeeks(result.streakWeeks);
        setTimeout(() => setShowBadgeModal(true), 800);
      }
    } catch {}
  };

  const loadGoalStreak = async () => {
    try {
      const { calculateGoalStreak, getStreakDisplay } = await import("@/lib/goal-streak");
      const streak = await calculateGoalStreak();
      setGoalStreak(streak);
      setStreakDisplay(getStreakDisplay(streak));
    } catch {}
  };

  const loadLanguagePrefs = async () => {
    try {
      const prefs = await AsyncStorage.getItem("@language_preferences");
      if (prefs) {
        const parsed = JSON.parse(prefs);
        if (parsed.targetLanguage) setTargetLanguage(parsed.targetLanguage);
        if (parsed.dialect) setDialect(parsed.dialect);
      }
    } catch {};
  };

  const loadGoalGrade = async () => {
    try {
      const { getCurrentGoals, gradeGoals } = await import("@/lib/weekly-goals-storage");
      const goals = await getCurrentGoals();
      if (goals.length > 0) {
        const result = gradeGoals(goals);
        setGoalGrade(result.grade);
        setGoalScore(result.score);
        setGoalsSet(goals.length);
        setGoalsCompleted(goals.filter(g => g.currentValue >= g.targetValue).length);
      }
    } catch {}
  };

  const loadLiveData = useCallback(async () => {
    try {
      const stats = await loadRealStats();
      setRealStats(stats);
      const report = buildReportFromStats(stats);
      setLiveReport(report);
    } catch {
      setLiveReport(FALLBACK_TERM);
    }
  }, []);

  const generateAIInsight = useCallback(async () => {
    if (!realStats) return;
    setLoadingInsight(true);
    try {
      const client = createVanillaClient();
      const result = await client.gamification.getMotivation.query({
        streak: realStats.currentStreak,
        level: Math.floor(realStats.totalXP / 500) + 1,
        targetLanguage,
      });
      setAiInsight(result.message);
    } catch {
      setAiInsight("Keep practicing daily! Your consistency is building real fluency.");
    } finally {
      setLoadingInsight(false);
    }
  }, [realStats, targetLanguage]);

  useEffect(() => {
    if (realStats) generateAIInsight();
  }, [realStats]);

  const CURRENT_TERM = liveReport || FALLBACK_TERM;
  const currentReport = selectedTerm === 0 ? CURRENT_TERM : PAST_TERMS[selectedTerm - 1];
  const allTerms = [CURRENT_TERM, ...PAST_TERMS];

  const cumulativeGPA = allTerms.reduce((sum, t) => sum + t.gpa, 0) / allTerms.length;
  const totalWordsAllTime = allTerms.reduce((sum, t) => sum + t.wordsLearned, 0);
  const totalLessonsAllTime = allTerms.reduce((sum, t) => sum + t.lessonsCompleted, 0);
  const totalXPAllTime = allTerms.reduce((sum, t) => sum + t.totalXP, 0);

  const handleShare = async () => {
    const reportText = `📋 ConnectWorld AI Report Card\n\n` +
      `Student: Language Learner\n` +
      `Language: ${targetLanguage} (${dialect})\n` +
      `Term: ${currentReport.term} — ${currentReport.period}\n` +
      `GPA: ${currentReport.gpa.toFixed(1)}/4.0 (${gpaToLetter(currentReport.gpa)})\n\n` +
      `Skills:\n` +
      currentReport.skills.map(s => `  ${s.skill}: ${s.grade} (${s.score}%)`).join("\n") +
      `\n\nTotal XP: ${totalXPAllTime.toLocaleString()}\n` +
      `Words Mastered: ${totalWordsAllTime}\n` +
      `Lessons Completed: ${totalLessonsAllTime}\n\n` +
      `📱 Learning with ConnectWorld AI`;

    await Share.share({ message: reportText });
  };

  const handleShareAsImage = useCallback(async () => {
    if (!reportCardRef.current) return;
    setIsCapturing(true);
    try {
      const uri = await captureRef(reportCardRef.current, {
        format: "png",
        quality: 0.95,
        result: "tmpfile",
      });
      if (Platform.OS === "web") {
        await handleShare();
        return;
      }
      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(uri, {
          mimeType: "image/png",
          dialogTitle: "Share Report Card",
          UTI: "public.png",
        });
      } else {
        await handleShare();
      }
    } catch {
      await handleShare();
    } finally {
      setIsCapturing(false);
    }
  }, [currentReport, targetLanguage, dialect]);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <FeatureGateBanner feature="advanced_report" />

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backBtn}
          >
            <Ionicons name="arrow-back" size={24} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Report Card</Text>
          <View style={{ flexDirection: "row", gap: 8 }}>
            <TouchableOpacity
              onPress={handleShareAsImage}
              style={styles.shareBtn}
              disabled={isCapturing}
            >
              {isCapturing ? (
                <ActivityIndicator size="small" color={Colors.secondary} />
              ) : (
                <Ionicons name="image-outline" size={22} color={Colors.secondary} />
              )}
            </TouchableOpacity>
            <TouchableOpacity onPress={handleShare} style={styles.shareBtn}>
              <Ionicons name="share-outline" size={22} color={Colors.secondary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Capturable Report Card Area */}
        <View ref={reportCardRef} collapsable={false} style={{ backgroundColor: Colors.background }}>

        {/* Student Info Card */}
        <View style={styles.studentCard}>
          <View style={styles.studentHeader}>
            <View style={styles.studentAvatar}>
              <Ionicons name="school" size={32} color={Colors.secondary} />
            </View>
            <View style={styles.studentInfo}>
              <Text style={styles.studentName}>Language Learner</Text>
              <Text style={styles.studentMeta}>
                {targetLanguage} ({dialect}) • Since March 2026
              </Text>
              <View style={styles.levelBadge}>
                <Text style={styles.levelText}>Level: A2 (Elementary)</Text>
              </View>
            </View>
          </View>

          {/* Cumulative Stats */}
          <View style={styles.cumulativeRow}>
            <View style={styles.cumulativeStat}>
              <Text style={styles.cumulativeValue}>{cumulativeGPA.toFixed(1)}</Text>
              <Text style={styles.cumulativeLabel}>Cum. GPA</Text>
            </View>
            <View style={styles.cumulativeStat}>
              <Text style={styles.cumulativeValue}>{totalXPAllTime.toLocaleString()}</Text>
              <Text style={styles.cumulativeLabel}>Total XP</Text>
            </View>
            <View style={styles.cumulativeStat}>
              <Text style={styles.cumulativeValue}>{totalWordsAllTime}</Text>
              <Text style={styles.cumulativeLabel}>Words</Text>
            </View>
            <View style={styles.cumulativeStat}>
              <Text style={styles.cumulativeValue}>{totalLessonsAllTime}</Text>
              <Text style={styles.cumulativeLabel}>Lessons</Text>
            </View>
          </View>
        </View>

        {/* Term Selector */}
        <View style={styles.termSelector}>
          {allTerms.map((term, idx) => (
            <TouchableOpacity
              key={idx}
              style={[styles.termTab, selectedTerm === idx && styles.termTabActive]}
              onPress={() => setSelectedTerm(idx)}
            >
              <Text style={[styles.termTabText, selectedTerm === idx && styles.termTabTextActive]}>
                {term.term}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Term Summary */}
        <View style={styles.termSummary}>
          <View style={styles.termGPA}>
            <Text style={styles.termGPAValue}>{currentReport.gpa.toFixed(1)}</Text>
            <Text style={styles.termGPALabel}>/ 4.0 GPA</Text>
          </View>
          <View style={styles.termStats}>
            <View style={styles.termStatItem}>
              <Ionicons name="flash" size={16} color={Colors.secondary} />
              <Text style={styles.termStatValue}>{currentReport.totalXP.toLocaleString()} XP</Text>
            </View>
            <View style={styles.termStatItem}>
              <Ionicons name="book" size={16} color={Colors.success} />
              <Text style={styles.termStatValue}>{currentReport.wordsLearned} words</Text>
            </View>
            <View style={styles.termStatItem}>
              <Ionicons name="checkmark-circle" size={16} color={Colors.accent} />
              <Text style={styles.termStatValue}>{currentReport.lessonsCompleted} lessons</Text>
            </View>
            <View style={styles.termStatItem}>
              <Ionicons name="flame" size={16} color="#F59E0B" />
              <Text style={styles.termStatValue}>{currentReport.streak}-day streak</Text>
            </View>
          </View>
        </View>

        {/* Grades Table */}
        <View style={styles.gradesCard}>
          <Text style={styles.sectionTitle}>Skill Grades</Text>
          <View style={styles.gradesHeader}>
            <Text style={[styles.gradeHeaderText, { flex: 2 }]}>Subject</Text>
            <Text style={[styles.gradeHeaderText, { flex: 1, textAlign: "center" }]}>Grade</Text>
            <Text style={[styles.gradeHeaderText, { flex: 1, textAlign: "center" }]}>Score</Text>
            <Text style={[styles.gradeHeaderText, { flex: 1, textAlign: "center" }]}>Growth</Text>
          </View>
          {currentReport.skills.map((skill, idx) => (
            <View key={idx} style={[styles.gradeRow, idx % 2 === 0 && styles.gradeRowAlt]}>
              <View style={[styles.gradeCell, { flex: 2, flexDirection: "row", alignItems: "center", gap: 8 }]}>
                <Ionicons name={skill.icon as any} size={16} color={Colors.textSecondary} />
                <Text style={styles.skillName}>{skill.skill}</Text>
              </View>
              <View style={[styles.gradeCell, { flex: 1, alignItems: "center" }]}>
                <View style={[styles.gradeBadge, { backgroundColor: gradeColor(skill.grade) + "20" }]}>
                  <Text style={[styles.gradeText, { color: gradeColor(skill.grade) }]}>{skill.grade}</Text>
                </View>
              </View>
              <View style={[styles.gradeCell, { flex: 1, alignItems: "center" }]}>
                <Text style={styles.scoreText}>{skill.score}%</Text>
              </View>
              <View style={[styles.gradeCell, { flex: 1, alignItems: "center" }]}>
                {skill.improvement > 0 ? (
                  <View style={styles.growthBadge}>
                    <Ionicons name="arrow-up" size={12} color={Colors.success} />
                    <Text style={styles.growthText}>+{skill.improvement}%</Text>
                  </View>
                ) : (
                  <Text style={styles.growthTextNeutral}>—</Text>
                )}
              </View>
            </View>
          ))}
        </View>

        {/* Personal Goals Grade */}
        <View style={styles.gradesCard}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <Text style={styles.sectionTitle}>Personal Goals</Text>
            <TouchableOpacity onPress={() => router.push('/weekly-goals' as any)} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Text style={{ fontSize: 12, color: Colors.secondary }}>Set Goals</Text>
              <Ionicons name="chevron-forward" size={14} color={Colors.secondary} />
            </TouchableOpacity>
          </View>
          {goalGrade ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
              <View style={[styles.gradeBadge, { backgroundColor: gradeColor(goalGrade) + '20', width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center' }]}>
                <Text style={{ fontSize: 22, fontWeight: '800', color: gradeColor(goalGrade) }}>{goalGrade}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: '600', color: Colors.textPrimary }}>
                  {goalsCompleted}/{goalsSet} goals completed
                </Text>
                <Text style={{ fontSize: 12, color: Colors.textSecondary, marginTop: 2 }}>
                  Score: {goalScore}% • Grade reflects your personal targets
                </Text>
                <View style={{ height: 6, backgroundColor: Colors.border, borderRadius: 3, marginTop: 8 }}>
                  <View style={{ height: 6, backgroundColor: gradeColor(goalGrade), borderRadius: 3, width: `${Math.min(goalScore || 0, 100)}%` }} />
                </View>
              </View>
            </View>
          ) : (
            <View style={{ alignItems: 'center', paddingVertical: 16 }}>
              <Ionicons name="flag-outline" size={28} color={Colors.textSecondary} />
              <Text style={{ fontSize: 13, color: Colors.textSecondary, marginTop: 8, textAlign: 'center' }}>
                No goals set this week. Set personal targets to see your goal grade here.
              </Text>
            </View>
          )}
        </View>

        {/* Goal Streak Badge */}
        {streakDisplay && goalStreak && goalStreak.totalWeeksTracked > 0 && (
          <View style={styles.gradesCard}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <Text style={styles.sectionTitle}>Goal Streak</Text>
              {goalStreak.longestStreak > 0 && (
                <Text style={{ fontSize: 11, color: Colors.textSecondary }}>Best: {goalStreak.longestStreak}w</Text>
              )}
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
              <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: streakDisplay.color + '20', justifyContent: 'center', alignItems: 'center' }}>
                <Text style={{ fontSize: 24 }}>{streakDisplay.emoji}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 16, fontWeight: '700', color: streakDisplay.color }}>
                  {streakDisplay.label}
                </Text>
                <Text style={{ fontSize: 12, color: Colors.textSecondary, marginTop: 2 }}>
                  {streakDisplay.subtext}
                </Text>
                <View style={{ flexDirection: 'row', gap: 12, marginTop: 8 }}>
                  <Text style={{ fontSize: 11, color: Colors.textSecondary }}>
                    {goalStreak.totalWeeksHit}/{goalStreak.totalWeeksTracked} weeks hit
                  </Text>
                  <Text style={{ fontSize: 11, color: Colors.textSecondary }}>
                    {goalStreak.totalWeeksTracked > 0 ? Math.round((goalStreak.totalWeeksHit / goalStreak.totalWeeksTracked) * 100) : 0}% success rate
                  </Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Growth Chart (simplified bar comparison) */}
        <View style={styles.growthCard}>
          <Text style={styles.sectionTitle}>Growth Over Time</Text>
          <Text style={styles.growthSubtitle}>Average score per term</Text>
          <View style={styles.growthBars}>
            {allTerms.slice().reverse().map((term, idx) => {
              const avgScore = term.skills.reduce((s, sk) => s + sk.score, 0) / term.skills.length;
              const barHeight = (avgScore / 100) * 120;
              return (
                <View key={idx} style={styles.growthBarCol}>
                  <Text style={styles.growthBarValue}>{Math.round(avgScore)}%</Text>
                  <View style={[styles.growthBar, { height: barHeight, backgroundColor: idx === allTerms.length - 1 ? Colors.secondary : Colors.secondary + "60" }]} />
                  <Text style={styles.growthBarLabel}>{term.term}</Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Achievements */}
        <View style={styles.achievementsCard}>
          <Text style={styles.sectionTitle}>Achievements Earned</Text>
          <View style={styles.achievementsGrid}>
            {ACHIEVEMENTS.map((badge) => (
              <View key={badge.id} style={styles.achievementItem}>
                <View style={styles.achievementIcon}>
                  <Ionicons name={badge.icon as any} size={20} color={Colors.secondary} />
                </View>
                <Text style={styles.achievementTitle} numberOfLines={1}>{badge.title}</Text>
                <Text style={styles.achievementDate}>{badge.date}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* AI-Generated Weekly Insight */}
        <View style={styles.teacherNote}>
          <View style={styles.teacherNoteHeader}>
            <Ionicons name="sparkles" size={20} color={Colors.secondary} />
            <Text style={styles.teacherNoteTitle}>AI Weekly Insight</Text>
          </View>
          {loadingInsight ? (
            <ActivityIndicator size="small" color={Colors.secondary} style={{ marginVertical: 12 }} />
          ) : (
            <Text style={styles.teacherNoteText}>
              {aiInsight || "Keep practicing daily! Your consistency is building real fluency."}
            </Text>
          )}
          <Text style={styles.teacherNoteSig}>— LinguaVibe AI</Text>
        </View>

        {/* Real-Time Stats Summary */}
        {realStats && (
          <View style={styles.realStatsCard}>
            <Text style={styles.sectionTitle}>Live Learning Stats</Text>
            <View style={styles.realStatsGrid}>
              <View style={styles.realStatItem}>
                <Ionicons name="albums" size={18} color="#F59E0B" />
                <Text style={styles.realStatValue}>{realStats.flashcardsTotal}</Text>
                <Text style={styles.realStatLabel}>Flashcards</Text>
              </View>
              <View style={styles.realStatItem}>
                <Ionicons name="checkmark-done" size={18} color={Colors.success} />
                <Text style={styles.realStatValue}>{realStats.flashcardsMastered}</Text>
                <Text style={styles.realStatLabel}>Mastered</Text>
              </View>
              <View style={styles.realStatItem}>
                <Ionicons name="journal" size={18} color="#8B5CF6" />
                <Text style={styles.realStatValue}>{realStats.journalEntries}</Text>
                <Text style={styles.realStatLabel}>Journal</Text>
              </View>
              <View style={styles.realStatItem}>
                <Ionicons name="flame" size={18} color="#F97316" />
                <Text style={styles.realStatValue}>{realStats.currentStreak}</Text>
                <Text style={styles.realStatLabel}>Streak</Text>
              </View>
              <View style={styles.realStatItem}>
                <Ionicons name="trophy" size={18} color={Colors.gold} />
                <Text style={styles.realStatValue}>{realStats.flashcardAccuracy}%</Text>
                <Text style={styles.realStatLabel}>Accuracy</Text>
              </View>
              <View style={styles.realStatItem}>
                <Ionicons name="today" size={18} color={Colors.secondary} />
                <Text style={styles.realStatValue}>{realStats.flashcardsDueToday}</Text>
                <Text style={styles.realStatLabel}>Due Today</Text>
              </View>
            </View>
          </View>
        )}

        {/* Weekly XP Chart */}
        <View style={styles.weeklyCard}>
          <Text style={styles.sectionTitle}>Weekly XP Breakdown</Text>
          <View style={styles.weeklyChart}>
            {WEEKLY_PROGRESS.map((week, idx) => {
              const maxXp = Math.max(...WEEKLY_PROGRESS.map(w => w.xp));
              const barHeight = (week.xp / maxXp) * 80;
              const isLatest = idx === WEEKLY_PROGRESS.length - 1;
              return (
                <View key={week.week} style={styles.weeklyBarCol}>
                  <Text style={styles.weeklyBarValue}>{week.xp}</Text>
                  <View style={[styles.weeklyBar, { height: barHeight, backgroundColor: isLatest ? Colors.secondary : Colors.secondary + "50" }]} />
                  <Text style={styles.weeklyBarLabel}>{week.week}</Text>
                  <Text style={styles.weeklyBarWords}>{week.words} words</Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Monthly Summary */}
        <View style={styles.monthlyCard}>
          <Text style={styles.sectionTitle}>This Month vs Last Month</Text>
          <View style={styles.monthlyGrid}>
            {[
              { label: "XP Earned", current: MONTHLY_SUMMARY.thisMonth.xp, prev: MONTHLY_SUMMARY.lastMonth.xp, icon: "flash", color: Colors.secondary },
              { label: "Words Mastered", current: MONTHLY_SUMMARY.thisMonth.words, prev: MONTHLY_SUMMARY.lastMonth.words, icon: "book", color: Colors.success },
              { label: "Lessons Done", current: MONTHLY_SUMMARY.thisMonth.lessons, prev: MONTHLY_SUMMARY.lastMonth.lessons, icon: "school", color: "#8B5CF6" },
              { label: "Study Minutes", current: MONTHLY_SUMMARY.thisMonth.minutes, prev: MONTHLY_SUMMARY.lastMonth.minutes, icon: "time", color: "#06B6D4" },
              { label: "Songs Completed", current: MONTHLY_SUMMARY.thisMonth.songsCompleted, prev: MONTHLY_SUMMARY.lastMonth.songsCompleted, icon: "musical-notes", color: "#EC4899" },
              { label: "Conversations", current: MONTHLY_SUMMARY.thisMonth.conversationsHeld, prev: MONTHLY_SUMMARY.lastMonth.conversationsHeld, icon: "chatbubbles", color: "#F59E0B" },
            ].map((item) => {
              const change = item.prev > 0 ? Math.round(((item.current - item.prev) / item.prev) * 100) : 100;
              return (
                <View key={item.label} style={styles.monthlyItem}>
                  <View style={styles.monthlyItemHeader}>
                    <Ionicons name={item.icon as any} size={14} color={item.color} />
                    <Text style={styles.monthlyItemLabel}>{item.label}</Text>
                  </View>
                  <Text style={styles.monthlyItemValue}>{item.current.toLocaleString()}</Text>
                  <View style={styles.monthlyItemChange}>
                    <Ionicons name={change >= 0 ? "arrow-up" : "arrow-down"} size={10} color={change >= 0 ? Colors.success : Colors.error} />
                    <Text style={[styles.monthlyItemChangeText, { color: change >= 0 ? Colors.success : Colors.error }]}>
                      {change >= 0 ? "+" : ""}{change}%
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        </View>{/* End capturable area */}

        {/* Share as Image CTA */}
        <View style={styles.shareAsImageRow}>
          <TouchableOpacity
            style={styles.shareAsImageBtn}
            onPress={handleShareAsImage}
            disabled={isCapturing}
            activeOpacity={0.8}
          >
            <Ionicons name="image" size={20} color="#FFFFFF" />
            <Text style={styles.shareAsImageBtnText}>
              {isCapturing ? "Capturing..." : "Share as Image"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Actions */}
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => router.push("/progress-dashboard" as any)}
          >
            <Ionicons name="stats-chart" size={20} color={Colors.secondary} />
            <Text style={styles.actionBtnText}>Detailed Stats</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => router.push("/progress-milestones" as any)}
          >
            <Ionicons name="flag" size={20} color={Colors.success} />
            <Text style={styles.actionBtnText}>Milestones</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => router.push("/view-past-reports" as any)}
          >
            <Ionicons name="document-text" size={20} color={"#6366F1"} />
            <Text style={styles.actionBtnText}>Past Reports</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => router.push("/export-report" as any)}
          >
            <Ionicons name="download-outline" size={20} color={"#8B5CF6"} />
            <Text style={styles.actionBtnText}>Export</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Badge Unlock Celebration */}
      <BadgeUnlockModal
        visible={showBadgeModal}
        badge={unlockedBadge}
        streakWeeks={unlockedStreakWeeks}
        onDismiss={() => setShowBadgeModal(false)}
      />
    </SafeAreaView>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surfaceCard,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: FontSize.xl,
    fontWeight: "700",
    color: Colors.text,
  },
  shareBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surfaceCard,
    alignItems: "center",
    justifyContent: "center",
  },
  studentCard: {
    margin: Spacing.md,
    padding: Spacing.lg,
    backgroundColor: Colors.surfaceCard,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.secondary + "30",
  },
  studentHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
  },
  studentAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.secondary + "20",
    alignItems: "center",
    justifyContent: "center",
  },
  studentInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: FontSize.lg,
    fontWeight: "700",
    color: Colors.text,
  },
  studentMeta: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  levelBadge: {
    alignSelf: "flex-start",
    backgroundColor: Colors.secondary + "20",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    marginTop: 4,
  },
  levelText: {
    fontSize: 11,
    fontWeight: "600",
    color: Colors.secondary,
  },
  cumulativeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  cumulativeStat: {
    alignItems: "center",
  },
  cumulativeValue: {
    fontSize: FontSize.lg,
    fontWeight: "700",
    color: Colors.text,
  },
  cumulativeLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  termSelector: {
    flexDirection: "row",
    marginHorizontal: Spacing.md,
    gap: 8,
    marginBottom: Spacing.md,
  },
  termTab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surfaceCard,
    alignItems: "center",
  },
  termTabActive: {
    backgroundColor: Colors.secondary,
  },
  termTabText: {
    fontSize: FontSize.sm,
    fontWeight: "600",
    color: Colors.textSecondary,
  },
  termTabTextActive: {
    color: "#fff",
  },
  termSummary: {
    marginHorizontal: Spacing.md,
    padding: Spacing.md,
    backgroundColor: Colors.surfaceCard,
    borderRadius: BorderRadius.lg,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  termGPA: {
    alignItems: "center",
    paddingRight: 16,
    borderRightWidth: 1,
    borderRightColor: Colors.border,
  },
  termGPAValue: {
    fontSize: 32,
    fontWeight: "800",
    color: Colors.secondary,
  },
  termGPALabel: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  termStats: {
    flex: 1,
    paddingLeft: 16,
    gap: 6,
  },
  termStatItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  termStatValue: {
    fontSize: FontSize.sm,
    color: Colors.text,
    fontWeight: "500",
  },
  gradesCard: {
    margin: Spacing.md,
    padding: Spacing.md,
    backgroundColor: Colors.surfaceCard,
    borderRadius: BorderRadius.lg,
  },
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: 12,
  },
  gradesHeader: {
    flexDirection: "row",
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    marginBottom: 4,
  },
  gradeHeaderText: {
    fontSize: 11,
    fontWeight: "600",
    color: Colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  gradeRow: {
    flexDirection: "row",
    paddingVertical: 10,
    alignItems: "center",
  },
  gradeRowAlt: {
    backgroundColor: Colors.background + "40",
    borderRadius: 6,
    marginHorizontal: -4,
    paddingHorizontal: 4,
  },
  gradeCell: {
    justifyContent: "center",
  },
  skillName: {
    fontSize: FontSize.sm,
    color: Colors.text,
    fontWeight: "500",
  },
  gradeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  gradeText: {
    fontSize: FontSize.sm,
    fontWeight: "700",
  },
  scoreText: {
    fontSize: FontSize.sm,
    color: Colors.text,
  },
  growthBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  growthText: {
    fontSize: 12,
    color: Colors.success,
    fontWeight: "600",
  },
  growthTextNeutral: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  growthCard: {
    margin: Spacing.md,
    padding: Spacing.md,
    backgroundColor: Colors.surfaceCard,
    borderRadius: BorderRadius.lg,
  },
  growthSubtitle: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginBottom: 16,
  },
  growthBars: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "flex-end",
    height: 160,
    paddingTop: 20,
  },
  growthBarCol: {
    alignItems: "center",
    gap: 6,
  },
  growthBarValue: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.text,
  },
  growthBar: {
    width: 40,
    borderRadius: 6,
  },
  growthBarLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  achievementsCard: {
    margin: Spacing.md,
    padding: Spacing.md,
    backgroundColor: Colors.surfaceCard,
    borderRadius: BorderRadius.lg,
  },
  achievementsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  achievementItem: {
    width: "22%",
    alignItems: "center",
    gap: 4,
  },
  achievementIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.secondary + "15",
    alignItems: "center",
    justifyContent: "center",
  },
  achievementTitle: {
    fontSize: 10,
    fontWeight: "600",
    color: Colors.text,
    textAlign: "center",
  },
  achievementDate: {
    fontSize: 9,
    color: Colors.textSecondary,
  },
  teacherNote: {
    margin: Spacing.md,
    padding: Spacing.md,
    backgroundColor: Colors.secondary + "10",
    borderRadius: BorderRadius.lg,
    borderLeftWidth: 3,
    borderLeftColor: Colors.secondary,
  },
  teacherNoteHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  teacherNoteTitle: {
    fontSize: FontSize.md,
    fontWeight: "600",
    color: Colors.text,
  },
  teacherNoteText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  teacherNoteSig: {
    fontSize: FontSize.sm,
    color: Colors.secondary,
    fontStyle: "italic",
    marginTop: 8,
    textAlign: "right",
  },
  weeklyCard: {
    margin: Spacing.md,
    padding: Spacing.md,
    backgroundColor: Colors.surfaceCard,
    borderRadius: BorderRadius.lg,
  },
  weeklyChart: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    height: 130,
    paddingTop: 10,
  },
  weeklyBarCol: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-end",
  },
  weeklyBarValue: {
    fontSize: 10,
    fontWeight: "600",
    color: Colors.text,
    marginBottom: 4,
  },
  weeklyBar: {
    width: 28,
    borderRadius: 4,
    minHeight: 6,
  },
  weeklyBarLabel: {
    fontSize: 9,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  weeklyBarWords: {
    fontSize: 8,
    color: Colors.secondary,
    marginTop: 1,
  },
  monthlyCard: {
    margin: Spacing.md,
    padding: Spacing.md,
    backgroundColor: Colors.surfaceCard,
    borderRadius: BorderRadius.lg,
  },
  monthlyGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  monthlyItem: {
    width: "47%",
    backgroundColor: Colors.background + "80",
    borderRadius: BorderRadius.md,
    padding: 12,
  },
  monthlyItemHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 6,
  },
  monthlyItemLabel: {
    fontSize: 10,
    color: Colors.textSecondary,
    fontWeight: "500",
  },
  monthlyItemValue: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.text,
  },
  monthlyItemChange: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    marginTop: 4,
  },
  monthlyItemChangeText: {
    fontSize: 11,
    fontWeight: "600",
  },
  actionsRow: {
    flexDirection: "row",
    marginHorizontal: Spacing.md,
    gap: 12,
  },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    backgroundColor: Colors.surfaceCard,
    borderRadius: BorderRadius.md,
  },
  actionBtnText: {
    fontSize: FontSize.sm,
    fontWeight: "600",
    color: Colors.text,
  },
  realStatsCard: {
    backgroundColor: Colors.surfaceCard,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.md,
  },
  realStatsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginTop: Spacing.sm,
  },
  realStatItem: {
    width: "30%" as any,
    alignItems: "center",
    gap: 4,
  },
  realStatValue: {
    fontSize: FontSize.lg,
    fontWeight: "700",
    color: Colors.text,
  },
  realStatLabel: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    textAlign: "center",
  },
  shareAsImageRow: {
    paddingHorizontal: Spacing.md,
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  shareAsImageBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.secondary,
    paddingVertical: 14,
    borderRadius: BorderRadius.lg,
  },
  shareAsImageBtnText: {
    fontSize: FontSize.md,
    fontWeight: "700",
    color: "#FFFFFF",
  },
});
