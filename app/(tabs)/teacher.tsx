import React, { useState, useEffect, useCallback, useRef } from "react";
import { ScreenErrorBoundary } from "@/components/error-boundary";
import { useFocusEffect } from "@react-navigation/native";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import { Colors, Spacing, BorderRadius, FontSize } from "../../constants/Colors";
import { trpc } from "@/lib/trpc";
import { usePaywallGate } from "@/hooks/use-paywall-gate";
import { PaywallModal } from "@/components/paywall-modal";
import { useI18n } from "@/lib/i18n";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getDialectMatchedTeachers, getAllTeachers, type Teacher } from "@/lib/teacher-registry";
import { StreakCelebration, isStreakMilestone } from "@/components/streak-celebration";
import { getStreakFreezeData, isFreezeActiveToday, type StreakFreezeData } from "@/lib/streak-freeze";
import { CompanionTabSkeleton, hapticLoadComplete } from "@/components/skeleton-loader";


const { width } = Dimensions.get("window");

type NavItem = {
  key: string;
  icon: string;
  label: string;
  sub: string;
};

const NAV_ITEMS: NavItem[] = [
  { key: "overview", icon: "grid", label: "Overview", sub: "Command center" },
  { key: "calendar", icon: "calendar", label: "Calendar", sub: "Schedule" },
  { key: "teachers", icon: "people", label: "Teachers", sub: "AI instructors" },
  { key: "classes", icon: "school", label: "Classes", sub: "Virtual classroom" },
  { key: "lessons", icon: "book", label: "Lessons", sub: "Structured courses" },
  { key: "courses", icon: "play-circle", label: "Courses", sub: "Video library" },
  { key: "progress", icon: "stats-chart", label: "Progress", sub: "Analytics" },
  { key: "recordings", icon: "mic", label: "Recordings", sub: "Voice history" },
];

// All teachers from registry with display metadata
const ALL_TEACHERS_DISPLAY = getAllTeachers().map((t, i) => ({
  id: t.id,
  name: t.name,
  photoUrl: t.photoUrl,
  dialect: t.dialects[0] || '',
  origin: t.origin,
  available: i % 3 !== 2, // simulate availability
  sessions: 800 + (i * 137) % 2500,
  rating: 4.6 + ((i * 3) % 4) / 10,
}));

const UPCOMING_CLASSES = [
  { id: "c1", title: "Dominican Slang 101", teacher: "Sophia Martinez", time: "Today, 3:00 PM", seats: 8, enrolled: true, level: "Beginner" },
  { id: "c2", title: "Business French", teacher: "Marie Dubois", time: "Tomorrow, 10:00 AM", seats: 12, enrolled: false, level: "Intermediate" },
  { id: "c3", title: "K-Pop Korean", teacher: "Min-Ji Park", time: "Wed, 7:00 PM", seats: 15, enrolled: false, level: "Beginner" },
];

const ACHIEVEMENTS = [
  { icon: "🔥", label: "7-Day Streak" },
  { icon: "🎯", label: "100 Words" },
  { icon: "🎤", label: "First Song" },
  { icon: "📞", label: "10 Calls" },
];

const CALENDAR_EVENTS = [
  { id: "e1", title: "Dominican Slang 101", type: "class", time: "3:00 PM - 3:45 PM", date: "Today", color: "#8B5CF6" },
  { id: "e2", title: "1-on-1 with Sophia", type: "tutoring", time: "5:00 PM - 5:30 PM", date: "Today", color: Colors.secondary },
  { id: "e3", title: "Business French", type: "class", time: "10:00 AM - 10:45 AM", date: "Tomorrow", color: "#8B5CF6" },
  { id: "e4", title: "Pronunciation Test", type: "test", time: "2:00 PM - 2:30 PM", date: "Tomorrow", color: Colors.accent },
  { id: "e5", title: "Study Block", type: "blocked", time: "6:00 PM - 7:00 PM", date: "Tomorrow", color: Colors.gold },
  { id: "e6", title: "Video Call - Carlos", type: "video", time: "11:00 AM - 11:30 AM", date: "Wed", color: Colors.success },
  { id: "e7", title: "Virtual Classroom Test", type: "test", time: "4:00 PM - 4:45 PM", date: "Thu", color: Colors.accent },
  { id: "e8", title: "Group Practice", type: "class", time: "7:00 PM - 7:30 PM", date: "Fri", color: "#8B5CF6" },
];

const WEEK_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const WEEK_DATES = [19, 20, 21, 22, 23, 24, 25];

export default function TeacherScreen() {
  const { t } = useI18n();
  const { showPaywall, paywallFeature, singlePrice, checkAccess, dismissPaywall } = usePaywallGate();

  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    const timer = setTimeout(() => { setIsLoading(false); hapticLoadComplete(); }, 700);
    return () => clearTimeout(timer);
  }, []);

  const [activeNav, setActiveNav] = useState("overview");
  const [selectedDay, setSelectedDay] = useState(3); // Thursday index (22nd = today)
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [showStreakCelebration, setShowStreakCelebration] = useState(false);
  const [freezeData, setFreezeData] = useState<StreakFreezeData | null>(null);
  const [freezeActive, setFreezeActive] = useState(false);
  const [freezeCountdown, setFreezeCountdown] = useState("");
  const [celebrationStreak, setCelebrationStreak] = useState(0);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    if (toastTimeout.current) clearTimeout(toastTimeout.current);
    toastTimeout.current = setTimeout(() => setToastMessage(null), 2000);
  };

  // Favorite teachers
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  useFocusEffect(
    useCallback(() => {
      const loadFavs = async () => {
        try {
          const favs = await AsyncStorage.getItem("@favorite_teachers");
          if (favs) setFavoriteIds(JSON.parse(favs));
        } catch {}
      };
      loadFavs();
    }, [])
  );
  const toggleFavorite = async (teacherId: string) => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    let updated: string[];
    if (favoriteIds.includes(teacherId)) {
      updated = favoriteIds.filter(id => id !== teacherId);
    } else {
      updated = [...favoriteIds, teacherId];
    }
    setFavoriteIds(updated);
    await AsyncStorage.setItem("@favorite_teachers", JSON.stringify(updated));
  };

  // Dynamic stat card data
  const [statData, setStatData] = useState({ activeLessons: 0, streak: 0, words: 0, xp: 0 });
  useEffect(() => {
    const loadStats = async () => {
      try {
        // Active lessons from @lesson_progress
        const progressRaw = await AsyncStorage.getItem("@lesson_progress");
        const progress: Record<string, { completed: boolean }> = progressRaw ? JSON.parse(progressRaw) : {};
        const activeLessons = Object.values(progress).filter(p => !p.completed).length;

        // Streak from grammar streak data
        const { getStreakData } = await import("@/lib/grammar-streak");
        const streakData = await getStreakData();

        // Words mastered from SRS
        const { getQueueStats } = await import("@/lib/srs");
        const srsStats = await getQueueStats();

        // Total XP
        const xpRaw = await AsyncStorage.getItem("@total_xp");
        const xp = parseInt(xpRaw || "0", 10);

        setStatData({
          activeLessons: activeLessons || 0,
          streak: streakData.currentStreak || 0,
          words: srsStats.mastered || 0,
          xp,
        });

        // Check for streak milestone celebration
        if (isStreakMilestone(streakData.currentStreak)) {
          const celebratedKey = `@streak_celebrated_${streakData.currentStreak}`;
          const alreadyCelebrated = await AsyncStorage.getItem(celebratedKey);
          if (!alreadyCelebrated) {
            setCelebrationStreak(streakData.currentStreak);
            setShowStreakCelebration(true);
            await AsyncStorage.setItem(celebratedKey, "true");
          }
        }
      } catch {}
    };
    loadStats();
  }, []);

  // Streak freeze countdown timer
  useEffect(() => {
    const loadFreeze = async () => {
      try {
        const data = await getStreakFreezeData();
        setFreezeData(data);
        const active = await isFreezeActiveToday();
        setFreezeActive(active);
      } catch {}
    };
    loadFreeze();
  }, []);

  useEffect(() => {
    if (!freezeActive) { setFreezeCountdown(""); return; }
    const updateCountdown = () => {
      const now = new Date();
      const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
      const diff = endOfDay.getTime() - now.getTime();
      if (diff <= 0) { setFreezeCountdown("Expired"); return; }
      const hours = Math.floor(diff / 3600000);
      const mins = Math.floor((diff % 3600000) / 60000);
      const secs = Math.floor((diff % 60000) / 1000);
      setFreezeCountdown(`${hours}h ${mins}m ${secs}s`);
    };
    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [freezeActive]);

  // Dialect-aware teacher matching
  const [dialectTeachers, setDialectTeachers] = useState<Teacher[]>([]);
  const [userDialect, setUserDialect] = useState<string>("");
  useEffect(() => {
    const loadDialectTeachers = async () => {
      const savedLang = await AsyncStorage.getItem("@target_language");
      if (savedLang) {
        setUserDialect(savedLang);
        // Extract base language name for matching
        const langName = savedLang.includes("-") ? savedLang.split("-")[0] : savedLang;
        const langNameMap: Record<string, string> = { es: "Spanish", en: "English", fr: "French", pt: "Portuguese", ar: "Arabic", zh: "Chinese", ja: "Japanese", ko: "Korean" };
        const name = langNameMap[langName] || langName;
        const matched = getDialectMatchedTeachers(savedLang, name);
        setDialectTeachers(matched);
      }
    };
    loadDialectTeachers();
  }, []);

  // Twilio AI Teacher video call integration
  const createAITeacherRoomMutation = trpc.videoCall.createAITeacherRoom.useMutation();

  const startAITeacherVideoCall = async () => {
    if (!checkAccess("teacher", "teacher")) return;

    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const result = await createAITeacherRoomMutation.mutateAsync({
        teacherName: "Sophia Martinez",
        language: "Spanish",
        dialect: "Dominican",
      });
      if (result.success) {
        router.push({
          pathname: "/video-call",
          params: {
            roomName: result.roomName,
            token: result.token,
            calleeName: result.teacherName,
            type: "video",
            direction: "outgoing",
          },
        } as any);
      }
    } catch (e) {
      // Fallback to local-only call screen
      router.push({ pathname: "/hume-call", params: { mode: "cloudwave", persona: "cloudwave" } } as any);
    }
  };

  if (isLoading) {
    return (<ScreenErrorBoundary><SafeAreaView style={styles.container}><CompanionTabSkeleton /></SafeAreaView></ScreenErrorBoundary>);
  }

  return (
    <ScreenErrorBoundary>
    <SafeAreaView style={styles.container}>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        {/* ===== PERSONALIZED HEADER ===== */}
        <View style={styles.profileHeader}>
          <View style={styles.profileRow}>
            {/* Profile Photo */}
            <View style={styles.profilePhoto}>
              <Text style={styles.profileInitial}>J</Text>
              <View style={styles.profileOnline} />
            </View>
            {/* User Info */}
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>Jordan</Text>
              <View style={styles.languageRow}>
                <Text style={styles.flagEmoji}>🇩🇴</Text>
                <Text style={styles.languageText}>Learning Dominican Spanish</Text>
              </View>
              <View style={styles.stageRow}>
                <View style={styles.stageBadge}>
                  <Text style={styles.stageText}>Stage B1</Text>
                </View>
                <View style={styles.globeContainer}>
                  <Ionicons name="globe" size={14} color={Colors.secondary} />
                  <Text style={styles.globeText}>Santo Domingo</Text>
                </View>
              </View>
            </View>
            {/* Notifications */}
            <TouchableOpacity style={styles.notifBtn} onPress={() => router.push("/notification-center" as any)}>
              <Ionicons name="notifications" size={20} color={Colors.secondary} />
              <View style={styles.notifDot} />
            </TouchableOpacity>
          </View>

          {/* Achievements Row */}
          <View style={styles.achievementsRow}>
            {ACHIEVEMENTS.map((a, i) => (
              <View key={i} style={styles.achievementItem}>
                <Text style={styles.achievementIcon}>{a.icon}</Text>
                <Text style={styles.achievementLabel}>{a.label}</Text>
              </View>
            ))}
          </View>

          {/* Quick Stats */}
          <View style={styles.quickStatsRow}>
            <View style={styles.quickStat}>
              <Text style={[styles.quickStatValue, { color: Colors.secondary }]}>45</Text>
              <Text style={styles.quickStatLabel}>Min Left</Text>
            </View>
            <View style={styles.quickStatDivider} />
            <View style={styles.quickStat}>
              <Text style={[styles.quickStatValue, { color: Colors.success }]}>7</Text>
              <Text style={styles.quickStatLabel}>Day Streak</Text>
            </View>
            <View style={styles.quickStatDivider} />
            <View style={styles.quickStat}>
              <Text style={[styles.quickStatValue, { color: Colors.gold }]}>142</Text>
              <Text style={styles.quickStatLabel}>Words</Text>
            </View>
            <View style={styles.quickStatDivider} />
            <View style={styles.quickStat}>
              <Text style={[styles.quickStatValue, { color: "#8B5CF6" }]}>B1</Text>
              <Text style={styles.quickStatLabel}>Level</Text>
            </View>
          </View>
        </View>

        {/* ===== NAVIGATION RAIL ===== */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.navRail}
        >
          {NAV_ITEMS.map((item) => (
            <TouchableOpacity
              key={item.key}
              style={[styles.navItem, activeNav === item.key && styles.navItemActive]}
              onPress={() => setActiveNav(item.key)}
              activeOpacity={0.7}
            >
              <Ionicons
                name={item.icon as any}
                size={16}
                color={activeNav === item.key ? Colors.textPrimary : Colors.textSecondary}
              />
              <View>
                <Text style={[styles.navLabel, activeNav === item.key && styles.navLabelActive]}>
                  {item.label}
                </Text>
                <Text style={styles.navSub}>{item.sub}</Text>
              </View>
              <Ionicons name="chevron-forward" size={12} color={Colors.textMuted} />
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* ===== OVERVIEW TAB ===== */}
        {activeNav === "overview" && (
          <View>
            {/* Command Center */}
            <View style={styles.commandCenter}>
              <View style={styles.commandCenterHeader}>
                <View style={styles.commandCenterBadge}>
                  <Ionicons name="sparkles" size={12} color={Colors.gold} />
                  <Text style={styles.commandCenterBadgeText}>COMMAND CENTER</Text>
                </View>
                <View style={styles.commandCenterActions}>
                  <TouchableOpacity style={styles.commandActionBtn} onPress={() => setActiveNav("calendar")}>
                    <Ionicons name="calendar" size={14} color={Colors.secondary} />
                    <Text style={styles.commandActionText}>Schedule</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.commandActionBtn} onPress={() => {
                    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    showToast("Refreshing...");
                    // Refresh favorites and dialect-matched teachers
                    Promise.all([
                      AsyncStorage.getItem("@favorite_teachers").then(favs => {
                        if (favs) setFavoriteIds(JSON.parse(favs));
                      }),
                      AsyncStorage.getItem("@target_language").then(savedLang => {
                        if (savedLang) {
                          setUserDialect(savedLang);
                          const langName = savedLang.includes("-") ? savedLang.split("-")[0] : savedLang;
                          const langNameMap: Record<string, string> = { es: "Spanish", en: "English", fr: "French", pt: "Portuguese", ar: "Arabic", zh: "Chinese", ja: "Japanese", ko: "Korean" };
                          const name = langNameMap[langName] || langName;
                          const matched = getDialectMatchedTeachers(savedLang, name);
                          setDialectTeachers(matched);
                        }
                      }),
                    ]).then(() => {
                      showToast("Refreshed \u2713");
                      if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                    }).catch(() => showToast("Refresh failed"));
                  }}>
                    <Ionicons name="refresh" size={14} color={Colors.secondary} />
                    <Text style={styles.commandActionText}>Refresh</Text>
                  </TouchableOpacity>
                </View>
              </View>
              <Text style={styles.commandTitle}>
                Master any language from{"\n"}one clean control surface.
              </Text>
              <Text style={styles.commandDesc}>
                Track progress, join classes, and practice with AI teachers — all from your learning dashboard.
              </Text>

              {/* Stat Cards */}
              <View style={styles.statRow}>
                <View style={[styles.statCard, { borderColor: Colors.glowBorder }]}>
                  <Text style={styles.statLabel}>ACTIVE LESSONS</Text>
                  <Text style={[styles.statValue, { color: Colors.secondary }]}>{statData.activeLessons}</Text>
                  <Text style={styles.statDesc}>Courses in progress.</Text>
                </View>
                <TouchableOpacity style={[styles.statCard, { borderColor: Colors.greenBorder }]} onPress={() => router.push("/streak-calendar" as any)} activeOpacity={0.7}>
                  <Text style={styles.statLabel}>STREAK</Text>
                  <Text style={[styles.statValue, { color: Colors.success }]}>{statData.streak}</Text>
                  <Text style={styles.statDesc}>Days consistent.</Text>
                </TouchableOpacity>
                <View style={[styles.statCard, { borderColor: Colors.goldBorder }]}>
                  <Text style={styles.statLabel}>WORDS</Text>
                  <Text style={[styles.statValue, { color: Colors.gold }]}>{statData.words}</Text>
                  <Text style={styles.statDesc}>Mastered via SRS.</Text>
                </View>
                <View style={[styles.statCard, { borderColor: Colors.redBorder }]}>
                  <Text style={styles.statLabel}>XP</Text>
                  <Text style={[styles.statValue, { color: Colors.accent }]}>{statData.xp.toLocaleString()}</Text>
                  <Text style={styles.statDesc}>Total earned.</Text>
                </View>
              </View>
            </View>

            {/* Streak Freeze Widget */}
            {(freezeActive || (freezeData && freezeData.availableFreezes > 0)) && (
              <View style={[styles.freezeWidget, { borderColor: freezeActive ? Colors.secondary : Colors.border }]}>
                <View style={styles.freezeWidgetHeader}>
                  <View style={styles.freezeWidgetLeft}>
                    <Ionicons name="snow" size={20} color={freezeActive ? Colors.secondary : Colors.muted} />
                    <View>
                      <Text style={[styles.freezeWidgetTitle, { color: Colors.text }]}>
                        {freezeActive ? "Freeze Active" : "Streak Shield"}
                      </Text>
                      <Text style={[styles.freezeWidgetSub, { color: Colors.muted }]}>
                        {freezeActive ? `Expires in ${freezeCountdown}` : `${freezeData?.availableFreezes || 0} freezes available`}
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={[styles.freezeWidgetBtn, { backgroundColor: freezeActive ? Colors.secondary + "20" : Colors.primary + "15" }]}
                    onPress={() => router.push(freezeActive ? "/streak-protection" as any : "/streak-freeze-purchase" as any)}
                  >
                    <Text style={[styles.freezeWidgetBtnText, { color: freezeActive ? Colors.secondary : Colors.primary }]}>
                      {freezeActive ? "Details" : "+ Buy"}
                    </Text>
                  </TouchableOpacity>
                </View>
                {freezeActive && (
                  <View style={styles.freezeTimerBar}>
                    <View style={[styles.freezeTimerFill, { backgroundColor: Colors.secondary, width: `${Math.max(5, ((new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate(), 23, 59, 59).getTime() - Date.now()) / 86400000) * 100)}%` }]} />
                  </View>
                )}
              </View>
            )}

            {/* Quick Actions */}
            <View style={styles.quickGrid}>
<TouchableOpacity style={styles.quickGridItem} onPress={() => router.push({ pathname: "/hume-call", params: { mode: "teacher", teacherName: "Sophia Martinez", language: "Spanish", dialect: "Dominican", level: "intermediate" } } as any)}>
                 <View style={[styles.quickGridIcon, { backgroundColor: Colors.glowSubtle, borderColor: Colors.glowBorder }]}>
                   <Ionicons name="call" size={22} color={Colors.secondary} />
                 </View>
                 <Text style={styles.quickGridTitle}>Call Teacher</Text>
                 <Text style={styles.quickGridDesc}>Hume AI Voice</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.quickGridItem} onPress={startAITeacherVideoCall}>
                <View style={[styles.quickGridIcon, { backgroundColor: Colors.greenGlow, borderColor: Colors.greenBorder }]}>
                  <Ionicons name="videocam" size={22} color={Colors.success} />
                </View>
                <Text style={styles.quickGridTitle}>Video Call</Text>
                <Text style={styles.quickGridDesc}>Face-to-face</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.quickGridItem} onPress={() => router.push("/class-schedule")}>
                <View style={[styles.quickGridIcon, { backgroundColor: "rgba(139,92,246,0.12)", borderColor: "rgba(139,92,246,0.4)" }]}>
                  <Ionicons name="school" size={22} color="#8B5CF6" />
                </View>
                <Text style={styles.quickGridTitle}>Join Class</Text>
                <Text style={styles.quickGridDesc}>Virtual room</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.quickGridItem} onPress={() => router.push("/studio")}>
                <View style={[styles.quickGridIcon, { backgroundColor: Colors.redGlow, borderColor: Colors.redBorder }]}>
                  <Ionicons name="mic" size={22} color={Colors.accent} />
                </View>
                <Text style={styles.quickGridTitle}>Record</Text>
                <Text style={styles.quickGridDesc}>Studio session</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.quickGridItem} onPress={() => router.push("/flashcard-review" as any)}>
                <View style={[styles.quickGridIcon, { backgroundColor: "rgba(255,215,0,0.12)", borderColor: "rgba(255,215,0,0.4)" }]}>
                  <Ionicons name="layers" size={22} color={Colors.gold} />
                </View>
                <Text style={styles.quickGridTitle}>Flashcards</Text>
                <Text style={styles.quickGridDesc}>Spaced review</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.quickGridItem} onPress={() => router.push("/srs-review" as any)}>
                <View style={[styles.quickGridIcon, { backgroundColor: "rgba(0,170,255,0.12)", borderColor: "rgba(0,170,255,0.4)" }]}>
                  <Ionicons name="refresh-circle" size={22} color="#00AAFF" />
                </View>
                <Text style={styles.quickGridTitle}>Review</Text>
                <Text style={styles.quickGridDesc}>Due cards</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.quickGridItem} onPress={() => router.push("/streak-calendar" as any)}>
                <View style={[styles.quickGridIcon, { backgroundColor: Colors.greenGlow, borderColor: Colors.greenBorder }]}>
                  <Ionicons name="flame" size={22} color={Colors.success} />
                </View>
                <Text style={styles.quickGridTitle}>Streak</Text>
                <Text style={styles.quickGridDesc}>Calendar view</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.quickGridItem} onPress={() => router.push("/coach-mode" as any)}>
                <View style={[styles.quickGridIcon, { backgroundColor: "rgba(255,215,0,0.12)", borderColor: "rgba(255,215,0,0.4)" }]}>
                  <Ionicons name="school" size={22} color="#FFD700" />
                </View>
                <Text style={styles.quickGridTitle}>Coach</Text>
                <Text style={styles.quickGridDesc}>Real calls</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.quickGridItem} onPress={() => router.push("/progress-milestones" as any)}>
                <View style={[styles.quickGridIcon, { backgroundColor: "rgba(139,92,246,0.12)", borderColor: "rgba(139,92,246,0.4)" }]}>
                  <Ionicons name="trophy" size={22} color="#8B5CF6" />
                </View>
                <Text style={styles.quickGridTitle}>Milestones</Text>
                <Text style={styles.quickGridDesc}>Rewards</Text>
              </TouchableOpacity>
                            <TouchableOpacity style={styles.quickGridItem} onPress={() => router.push("/pronunciation-practice" as any)}>
                <View style={[styles.quickGridIcon, { backgroundColor: "rgba(255,82,82,0.12)", borderColor: "rgba(255,82,82,0.4)" }]}>
                  <Ionicons name="mic-circle" size={22} color="#FF5252" />
                </View>
                <Text style={styles.quickGridTitle}>Pronounce</Text>
                <Text style={styles.quickGridDesc}>Voice practice</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.quickGridItem} onPress={() => router.push("/voice-training" as any)}>
                <View style={[styles.quickGridIcon, { backgroundColor: "rgba(236,72,153,0.12)", borderColor: "rgba(236,72,153,0.4)" }]}>
                  <Ionicons name="ear" size={22} color="#EC4899" />
                </View>
                <Text style={styles.quickGridTitle}>Voice Lab</Text>
                <Text style={styles.quickGridDesc}>Training drills</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.quickGridItem} onPress={() => router.push("/smart-practice" as any)}>
                <View style={[styles.quickGridIcon, { backgroundColor: "rgba(99,102,241,0.12)", borderColor: "rgba(99,102,241,0.4)" }]}>
                  <Ionicons name="bulb" size={22} color="#6366F1" />
                </View>
                <Text style={styles.quickGridTitle}>Smart Practice</Text>
                <Text style={styles.quickGridDesc}>AI homework</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.quickGridItem} onPress={() => router.push("/daily-duel-challenge" as any)}>
                <View style={[styles.quickGridIcon, { backgroundColor: "rgba(255,215,0,0.12)", borderColor: "rgba(255,215,0,0.4)" }]}>
                  <Ionicons name="today" size={22} color="#FFD700" />
                </View>
                <Text style={styles.quickGridTitle}>Daily Duel</Text>
                <Text style={styles.quickGridDesc}>Word of Day</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.quickGridItem} onPress={() => router.push("/pronunciation-heatmap" as any)}>
                <View style={[styles.quickGridIcon, { backgroundColor: "rgba(34,197,94,0.12)", borderColor: "rgba(34,197,94,0.4)" }]}>
                  <Ionicons name="analytics" size={22} color={Colors.success} />
                </View>
                <Text style={styles.quickGridTitle}>Heatmap</Text>
                <Text style={styles.quickGridDesc}>Weak sounds</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.quickGridItem} onPress={() => router.push("/pronunciation-accuracy-leaderboard" as any)}>
                <View style={[styles.quickGridIcon, { backgroundColor: "rgba(255,215,0,0.12)", borderColor: "rgba(255,215,0,0.4)" }]}>
                  <Ionicons name="trophy" size={22} color="#FFD700" />
                </View>
                <Text style={styles.quickGridTitle}>Rankings</Text>
                <Text style={styles.quickGridDesc}>Accuracy board</Text>
              </TouchableOpacity>
            </View>

            {/* Today's Schedule Preview */}
            <View style={styles.todaySchedule}>
              <View style={styles.todayHeader}>
                <Text style={styles.sectionTitle}>Today's Schedule</Text>
                <TouchableOpacity onPress={() => setActiveNav("calendar")}>
                  <Text style={styles.seeAllText}>See All</Text>
                </TouchableOpacity>
              </View>
              {CALENDAR_EVENTS.filter(e => e.date === "Today").map((event) => (
                <View key={event.id} style={styles.scheduleItem}>
                  <View style={[styles.scheduleBar, { backgroundColor: event.color }]} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.scheduleTitle}>{event.title}</Text>
                    <Text style={styles.scheduleTime}>{event.time}</Text>
                  </View>
                  <View style={[styles.scheduleTypeBadge, { borderColor: event.color }]}>
                    <Text style={[styles.scheduleTypeText, { color: event.color }]}>{event.type}</Text>
                  </View>
                </View>
              ))}
            </View>

            {/* Active Teacher */}
            <View style={styles.currentTeacherCard}>
              <View style={styles.currentTeacherTop}>
                <Text style={styles.currentTeacherLabel}>ACTIVE TEACHER</Text>
                <View style={styles.onlineIndicator}>
                  <View style={styles.onlinePulse} />
                  <Text style={styles.onlineText}>Online</Text>
                </View>
              </View>
              <View style={styles.currentTeacherBody}>
                <Image source={{ uri: ALL_TEACHERS_DISPLAY[0].photoUrl }} style={{ width: 56, height: 56, borderRadius: 28, marginRight: 12 }} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.currentTeacherName}>{ALL_TEACHERS_DISPLAY[0].name}</Text>
                  <Text style={styles.currentTeacherDialect}>{ALL_TEACHERS_DISPLAY[0].dialect}</Text>
                  <Text style={styles.currentTeacherSpecialty}>{ALL_TEACHERS_DISPLAY[0].origin}</Text>
                </View>
              </View>
              <View style={styles.currentTeacherActions}>
                <TouchableOpacity style={styles.primaryActionBtn} onPress={() => router.push({ pathname: "/hume-call", params: { mode: "teacher", teacherName: ALL_TEACHERS_DISPLAY[0].name, language: "Spanish", dialect: ALL_TEACHERS_DISPLAY[0].dialect, level: "intermediate" } } as any)}>
                  <Ionicons name="call" size={16} color={Colors.textPrimary} />
                  <Text style={styles.primaryActionText}>Voice Call</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.videoActionBtn} onPress={startAITeacherVideoCall}>
                  <Ionicons name="videocam" size={16} color={Colors.success} />
                  <Text style={styles.videoActionText}>Video Call</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.secondaryActionBtn} onPress={() => router.push("/(tabs)/messages")}>
                  <Ionicons name="chatbubble" size={16} color={Colors.secondary} />
                  <Text style={styles.secondaryActionText}>Chat</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {/* ===== CALENDAR TAB (Teams-style) ===== */}
        {activeNav === "calendar" && (
          <View style={styles.sectionPad}>
            {/* Calendar Header */}
            <View style={styles.calendarHeader}>
              <Text style={styles.calendarMonth}>May 2026</Text>
              <View style={styles.calendarActions}>
                <TouchableOpacity style={styles.calendarActionBtn}>
                  <Ionicons name="add" size={16} color={Colors.secondary} />
                  <Text style={styles.calendarActionText}>New Event</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.calendarActionBtn}>
                  <Ionicons name="time" size={16} color={Colors.secondary} />
                  <Text style={styles.calendarActionText}>Block Time</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Week Strip */}
            <View style={styles.weekStrip}>
              {WEEK_DAYS.map((day, i) => (
                <TouchableOpacity
                  key={i}
                  style={[styles.weekDay, selectedDay === i && styles.weekDayActive]}
                  onPress={() => setSelectedDay(i)}
                >
                  <Text style={[styles.weekDayLabel, selectedDay === i && styles.weekDayLabelActive]}>{day}</Text>
                  <Text style={[styles.weekDayDate, selectedDay === i && styles.weekDayDateActive]}>{WEEK_DATES[i]}</Text>
                  {i === 3 && <View style={styles.todayDot} />}
                </TouchableOpacity>
              ))}
            </View>

            {/* Schedule List */}
            <View style={styles.scheduleList}>
              <Text style={styles.scheduleDateTitle}>
                {selectedDay === 3 ? "Today" : selectedDay === 4 ? "Tomorrow" : WEEK_DAYS[selectedDay]}, May {WEEK_DATES[selectedDay]}
              </Text>

              {CALENDAR_EVENTS
                .filter(e => {
                  if (selectedDay === 3) return e.date === "Today";
                  if (selectedDay === 4) return e.date === "Tomorrow";
                  if (selectedDay === 5) return e.date === "Wed";
                  if (selectedDay === 6) return e.date === "Thu";
                  return e.date === "Fri";
                })
                .map((event) => (
                  <TouchableOpacity key={event.id} style={styles.calendarEvent}>
                    <View style={[styles.eventBar, { backgroundColor: event.color }]} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.eventTitle}>{event.title}</Text>
                      <Text style={styles.eventTime}>{event.time}</Text>
                    </View>
                    <View style={styles.eventActions}>
                      {event.type === "video" && (
                        <TouchableOpacity style={styles.eventJoinBtn} onPress={startAITeacherVideoCall}>
                          <Ionicons name="videocam" size={14} color={Colors.textPrimary} />
                          <Text style={styles.eventJoinText}>Join</Text>
                        </TouchableOpacity>
                      )}
                      {event.type === "class" && (
<TouchableOpacity style={styles.eventJoinBtn} onPress={() => router.push({ pathname: "/virtual-classroom", params: { className: event.title, teacherName: "Profesora Maria", language: "Spanish", topic: event.title } } as any)}>
                           <Ionicons name="enter" size={14} color={Colors.textPrimary} />
                           <Text style={styles.eventJoinText}>Join</Text>
                        </TouchableOpacity>
                      )}
                      {event.type === "tutoring" && (
                        <TouchableOpacity style={styles.eventJoinBtn} onPress={() => router.push({ pathname: "/hume-call", params: { mode: "teacher", teacherName: "Sophia Martinez", language: "Spanish", dialect: "Dominican" } } as any)}>
                          <Ionicons name="call" size={14} color={Colors.textPrimary} />
                          <Text style={styles.eventJoinText}>Call</Text>
                        </TouchableOpacity>
                      )}
                      {event.type === "test" && (
                        <View style={[styles.eventTypeBadge, { borderColor: event.color }]}>
                          <Text style={[styles.eventTypeText, { color: event.color }]}>Test</Text>
                        </View>
                      )}
                      {event.type === "blocked" && (
                        <View style={[styles.eventTypeBadge, { borderColor: event.color }]}>
                          <Text style={[styles.eventTypeText, { color: event.color }]}>Blocked</Text>
                        </View>
                      )}
                    </View>
                  </TouchableOpacity>
                ))}

              {/* Empty state for days with no events */}
              {CALENDAR_EVENTS.filter(e => {
                if (selectedDay === 3) return e.date === "Today";
                if (selectedDay === 4) return e.date === "Tomorrow";
                if (selectedDay === 5) return e.date === "Wed";
                if (selectedDay === 6) return e.date === "Thu";
                return e.date === "Fri";
              }).length === 0 && (
                <View style={styles.emptyDay}>
                  <Ionicons name="calendar-outline" size={40} color={Colors.textMuted} />
                  <Text style={styles.emptyDayText}>No events scheduled</Text>
                  <TouchableOpacity style={styles.emptyDayBtn}>
                    <Text style={styles.emptyDayBtnText}>+ Add Event</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* Quick Schedule Actions */}
            <Text style={styles.sectionTitle}>Quick Schedule</Text>
            <View style={styles.quickScheduleGrid}>
              <TouchableOpacity style={styles.quickScheduleItem}>
                <Ionicons name="person" size={20} color={Colors.secondary} />
                <Text style={styles.quickScheduleLabel}>Book Tutor</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.quickScheduleItem}>
                <Ionicons name="school" size={20} color="#8B5CF6" />
                <Text style={styles.quickScheduleLabel}>Join Class</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.quickScheduleItem} onPress={() => router.push("/quiz-test" as any)}>
                <Ionicons name="document-text" size={20} color={Colors.accent} />
                <Text style={styles.quickScheduleLabel}>Book Test</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.quickScheduleItem}>
                <Ionicons name="time" size={20} color={Colors.gold} />
                <Text style={styles.quickScheduleLabel}>Block Time</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.quickScheduleItem}>
                <Ionicons name="videocam" size={20} color={Colors.success} />
                <Text style={styles.quickScheduleLabel}>Video Meet</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.quickScheduleItem}>
                <Ionicons name="people" size={20} color={Colors.textAccent} />
                <Text style={styles.quickScheduleLabel}>Group Study</Text>
              </TouchableOpacity>
            </View>

            {/* Alerts */}
            <Text style={styles.sectionTitle}>Upcoming Alerts</Text>
            {[
              { title: "Dominican Slang 101 starts in 2 hours", icon: "alarm", color: Colors.gold },
              { title: "Pronunciation Test tomorrow at 2 PM", icon: "alert-circle", color: Colors.accent },
              { title: "Sophia is available for video call", icon: "videocam", color: Colors.success },
            ].map((alert, i) => (
              <View key={i} style={styles.alertItem}>
                <View style={[styles.alertIcon, { backgroundColor: `${alert.color}15`, borderColor: `${alert.color}40` }]}>
                  <Ionicons name={alert.icon as any} size={16} color={alert.color} />
                </View>
                <Text style={styles.alertText}>{alert.title}</Text>
                <TouchableOpacity>
                  <Ionicons name="close" size={16} color={Colors.textMuted} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {/* ===== TEACHERS TAB ===== */}
        {activeNav === "teachers" && (
          <View style={styles.sectionPad}>
            {/* Dialect-matched recommendations */}
            {dialectTeachers.length > 0 && (
              <View style={{ marginBottom: 20 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                  <Ionicons name="sparkles" size={16} color={Colors.gold} />
                  <Text style={[styles.sectionTitle, { marginLeft: 6, marginBottom: 0 }]}>Matched for Your Dialect</Text>
                </View>
                <Text style={[styles.sectionSub, { marginBottom: 12 }]}>Teachers who specialize in your chosen dialect</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
                  {dialectTeachers.map((dt) => (
                    <TouchableOpacity
                      key={dt.id}
                      style={{ backgroundColor: Colors.surfaceCard, borderRadius: 16, padding: 14, width: 160, borderWidth: 1, borderColor: Colors.goldBorder }}
                      onPress={() => router.push({ pathname: "/teacher-profile", params: { teacherId: dt.id } } as any)}
                      activeOpacity={0.7}
                    >
                      <View style={{ alignItems: 'center', marginBottom: 8 }}>
                        <Image source={{ uri: dt.photoUrl }} style={{ width: 48, height: 48, borderRadius: 24, borderWidth: 2, borderColor: Colors.gold }} />
                      </View>
                      <Text style={{ fontSize: 14, fontWeight: '700', color: Colors.textPrimary, textAlign: 'center' }}>{dt.name}</Text>
                      <Text style={{ fontSize: 11, color: Colors.textSecondary, textAlign: 'center', marginTop: 2 }}>{dt.origin}</Text>
                      <Text style={{ fontSize: 10, color: Colors.gold, textAlign: 'center', marginTop: 4, fontWeight: '600' }}>{dt.dialects[0]}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
            <Text style={styles.sectionTitle}>All Teachers</Text>
            <Text style={styles.sectionSub}>Choose a teacher for any language and dialect</Text>
            {ALL_TEACHERS_DISPLAY.map((teacher) => (
              <TouchableOpacity key={teacher.id} style={styles.teacherCard} onPress={() => router.push({ pathname: "/teacher-profile", params: { teacherId: teacher.id } } as any)}>
                <View style={styles.teacherCardRow}>
                  <Image source={{ uri: teacher.photoUrl }} style={{ width: 48, height: 48, borderRadius: 24 }} />
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={styles.teacherName}>{teacher.name}</Text>
                    <Text style={styles.teacherDialect}>{teacher.dialect}</Text>
                    <Text style={[styles.metaText, { marginTop: 2 }]}>{teacher.origin}</Text>
                  </View>
                  <TouchableOpacity onPress={() => toggleFavorite(teacher.id)} style={{ padding: 4 }}>
                    <Ionicons name={favoriteIds.includes(teacher.id) ? "star" : "star-outline"} size={20} color={favoriteIds.includes(teacher.id) ? Colors.gold : Colors.textMuted} />
                  </TouchableOpacity>
                </View>
                <View style={styles.teacherMeta}>
                  <View style={styles.metaItem}>
                    <Ionicons name="star" size={12} color={Colors.warning} />
                    <Text style={styles.metaText}>{teacher.rating.toFixed(1)}</Text>
                  </View>
                  <Text style={styles.metaDivider}>•</Text>
                  <Text style={styles.metaText}>{teacher.sessions.toLocaleString()} sessions</Text>
                  <View style={{ flex: 1 }} />
                  <TouchableOpacity style={[styles.talkBtn, !teacher.available && styles.talkBtnDisabled]}>
                    <Text style={[styles.talkBtnText, !teacher.available && { color: Colors.textMuted }]}>
                      {teacher.available ? "Talk Now" : "Offline"}
                    </Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* ===== CLASSES TAB ===== */}
        {activeNav === "classes" && (
          <View style={styles.sectionPad}>
            <TouchableOpacity style={styles.classroomHero} onPress={() => router.push("/class-schedule")} activeOpacity={0.85}>
              <View style={styles.heroGlow} />
              <View style={styles.heroRow}>
                <View style={styles.heroIcon}>
                  <Ionicons name="school" size={26} color="#8B5CF6" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.heroTitle}>Virtual Classroom</Text>
                  <Text style={styles.heroDesc}>Live group classes • Interactive Q&A • Certificates</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#8B5CF6" />
              </View>
            </TouchableOpacity>

            <Text style={styles.sectionTitle}>Upcoming Classes</Text>
            {UPCOMING_CLASSES.map((cls) => (
              <View key={cls.id} style={styles.classCard}>
                <View style={styles.classTop}>
                  <View style={styles.levelBadge}>
                    <Text style={styles.levelText}>{cls.level}</Text>
                  </View>
                  <Text style={styles.classTime}>{cls.time}</Text>
                </View>
                <Text style={styles.classTitle}>{cls.title}</Text>
                <Text style={styles.classTeacher}>with {cls.teacher}</Text>
                <View style={styles.classBottom}>
                  <Text style={styles.classSeats}>{cls.seats} seats</Text>
                  <TouchableOpacity style={[styles.classBtn, cls.enrolled && styles.classBtnActive]} onPress={() => cls.enrolled ? router.push({ pathname: "/virtual-classroom", params: { className: cls.title, teacherName: "Profesora Maria", language: "Spanish", topic: cls.title } } as any) : router.push({ pathname: "/class-invite", params: { className: cls.title, teacherName: "Profesora Maria", type: "group" } } as any)}>
                    <Text style={[styles.classBtnText, cls.enrolled && { color: Colors.textPrimary }]}>
                      {cls.enrolled ? "Join Now" : "Enroll"}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* ===== LESSONS TAB ===== */}
        {activeNav === "lessons" && (
          <View style={styles.sectionPad}>
            <TouchableOpacity style={styles.lessonHero} onPress={() => router.push("/lessons")} activeOpacity={0.85}>
              <View style={styles.lessonHeroIcon}>
                <Ionicons name="book" size={22} color={Colors.success} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.lessonHeroTitle}>Structured Courses</Text>
                <Text style={styles.lessonHeroDesc}>Grammar • Vocab • Business • Slang</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={Colors.success} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.b2bCard} activeOpacity={0.85}>
              <View style={styles.b2bIcon}>
                <Ionicons name="briefcase" size={18} color={Colors.gold} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.b2bTitle}>Business Training</Text>
                <Text style={styles.b2bDesc}>IT • Customer Service • Technical terms</Text>
              </View>
              <View style={styles.b2bBadge}>
                <Text style={styles.b2bBadgeText}>B2B</Text>
              </View>
            </TouchableOpacity>

            <Text style={styles.sectionTitle}>Quick Lessons</Text>
            {[
              { title: "Dominican Slang 101", words: 25, time: "10 min", progress: 0.6 },
              { title: "French Business Phrases", words: 40, time: "15 min", progress: 0.3 },
              { title: "Japanese Anime Vocab", words: 30, time: "12 min", progress: 0 },
            ].map((lesson, i) => (
              <TouchableOpacity key={i} style={styles.lessonItem} onPress={() => router.push("/lesson-detail")}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.lessonItemTitle}>{lesson.title}</Text>
                  <Text style={styles.lessonItemMeta}>{lesson.words} words • {lesson.time}</Text>
                </View>
                {lesson.progress > 0 ? (
                  <View style={styles.progressCircle}>
                    <Text style={styles.progressCircleText}>{Math.round(lesson.progress * 100)}%</Text>
                  </View>
                ) : (
                  <TouchableOpacity style={styles.startBtn}>
                    <Text style={styles.startBtnText}>Start</Text>
                  </TouchableOpacity>
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* ===== COURSES TAB (Udemy/LinkedIn Learning Style) ===== */}
        {activeNav === "courses" && (
          <View style={styles.sectionPad}>
            {/* Search Bar */}
            <View style={styles.courseSearchBar}>
              <Ionicons name="search" size={18} color={Colors.textSecondary} />
              <Text style={styles.courseSearchPlaceholder}>Search courses, certifications...</Text>
            </View>

            {/* Continue Learning */}
            <Text style={styles.sectionTitle}>Continue Learning</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 20 }}>
              {[
                { id: "1", title: "Business Spanish for IT Professionals", instructor: "Sophia Martinez", progress: 0.65, lessons: 24, duration: "4.5 hrs", thumb: "💼", level: "Intermediate", rating: 4.8 },
                { id: "2", title: "French Conversation Mastery", instructor: "Marie Dubois", progress: 0.3, lessons: 18, duration: "3 hrs", thumb: "🗣️", level: "Advanced", rating: 4.9 },
              ].map((course) => (
                <TouchableOpacity key={course.id} style={styles.continueCourseCard} onPress={() => router.push("/course-detail" as any)} activeOpacity={0.8}>
                  <View style={styles.courseThumbnail}>
                    <Text style={{ fontSize: 32 }}>{course.thumb}</Text>
                    <View style={styles.coursePlayBtn}>
                      <Ionicons name="play" size={16} color="#FFFFFF" />
                    </View>
                  </View>
                  <View style={styles.courseCardBody}>
                    <Text style={styles.courseCardTitle} numberOfLines={2}>{course.title}</Text>
                    <Text style={styles.courseCardInstructor}>{course.instructor}</Text>
                    <View style={styles.courseProgressRow}>
                      <View style={styles.courseProgressBg}>
                        <View style={[styles.courseProgressFill, { width: `${course.progress * 100}%` }]} />
                      </View>
                      <Text style={styles.courseProgressText}>{Math.round(course.progress * 100)}%</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Categories */}
            <Text style={styles.sectionTitle}>Browse Categories</Text>
            <View style={styles.categoryGrid}>
              {[
                { icon: "briefcase", label: "Business", count: 12, color: Colors.gold },
                { icon: "airplane", label: "Travel", count: 8, color: Colors.secondary },
                { icon: "ribbon", label: "Certification", count: 6, color: Colors.success },
                { icon: "chatbubble", label: "Conversation", count: 15, color: "#8B5CF6" },
                { icon: "musical-notes", label: "Culture & Media", count: 10, color: Colors.accent },
                { icon: "code-slash", label: "Tech & IT", count: 9, color: "#06B6D4" },
              ].map((cat, i) => (
                <TouchableOpacity key={i} style={styles.categoryCard} onPress={() => router.push("/course-catalog" as any)} activeOpacity={0.8}>
                  <View style={[styles.categoryIconBg, { backgroundColor: cat.color + "20" }]}>
                    <Ionicons name={cat.icon as any} size={20} color={cat.color} />
                  </View>
                  <Text style={styles.categoryLabel}>{cat.label}</Text>
                  <Text style={styles.categoryCount}>{cat.count} courses</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Featured Courses */}
            <Text style={styles.sectionTitle}>Featured Courses</Text>
            {[
              { id: "f1", title: "Dominican Spanish: From Zero to Fluent", instructor: "Sophia Martinez", rating: 4.9, students: 2340, lessons: 42, duration: "8 hrs", level: "Beginner", thumb: "🇩🇴", price: "Free", certified: true },
              { id: "f2", title: "Japanese for Anime Fans", instructor: "Yuki Tanaka", rating: 4.8, students: 1560, lessons: 30, duration: "6 hrs", level: "Beginner", thumb: "🇯🇵", price: "50 credits", certified: false },
              { id: "f3", title: "Mandarin Business Communication", instructor: "Wei Chen", rating: 4.7, students: 890, lessons: 36, duration: "7 hrs", level: "Intermediate", thumb: "🇨🇳", price: "75 credits", certified: true },
              { id: "f4", title: "French for Healthcare Professionals", instructor: "Marie Dubois", rating: 4.9, students: 3100, lessons: 28, duration: "5.5 hrs", level: "Advanced", thumb: "🇫🇷", price: "100 credits", certified: true },
            ].map((course) => (
              <TouchableOpacity key={course.id} style={styles.featuredCourseCard} onPress={() => router.push("/course-detail" as any)} activeOpacity={0.8}>
                <View style={styles.featuredThumb}>
                  <Text style={{ fontSize: 28 }}>{course.thumb}</Text>
                  {course.certified && (
                    <View style={styles.certBadge}>
                      <Ionicons name="ribbon" size={10} color="#FFFFFF" />
                    </View>
                  )}
                </View>
                <View style={styles.featuredBody}>
                  <Text style={styles.featuredTitle} numberOfLines={2}>{course.title}</Text>
                  <Text style={styles.featuredInstructor}>{course.instructor}</Text>
                  <View style={styles.featuredMeta}>
                    <Ionicons name="star" size={12} color={Colors.gold} />
                    <Text style={styles.featuredRating}>{course.rating}</Text>
                    <Text style={styles.featuredDot}>•</Text>
                    <Text style={styles.featuredStudents}>{course.students.toLocaleString()} students</Text>
                  </View>
                  <View style={styles.featuredBottom}>
                    <View style={styles.levelBadge}>
                      <Text style={styles.levelBadgeText}>{course.level}</Text>
                    </View>
                    <Text style={styles.featuredDuration}>{course.lessons} lessons • {course.duration}</Text>
                  </View>
                </View>
                <View style={styles.featuredPrice}>
                  <Text style={[styles.featuredPriceText, course.price === "Free" && { color: Colors.success }]}>{course.price}</Text>
                </View>
              </TouchableOpacity>
            ))}

            {/* Certification Paths */}
            <Text style={styles.sectionTitle}>Certification Paths</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {[
                { title: "Business Spanish B2", courses: 4, duration: "20 hrs", color: Colors.gold, icon: "briefcase", progress: 0.25 },
                { title: "JLPT N3 Japanese", courses: 5, duration: "30 hrs", color: Colors.accent, icon: "school", progress: 0 },
                { title: "DELF B1 French", courses: 3, duration: "15 hrs", color: "#8B5CF6", icon: "ribbon", progress: 0 },
              ].map((path, i) => (
                <TouchableOpacity key={i} style={[styles.certPathCard, { borderColor: path.color + "40" }]} onPress={() => router.push("/cert-path" as any)} activeOpacity={0.8}>
                  <View style={[styles.certPathIcon, { backgroundColor: path.color + "20" }]}>
                    <Ionicons name={path.icon as any} size={20} color={path.color} />
                  </View>
                  <Text style={styles.certPathTitle}>{path.title}</Text>
                  <Text style={styles.certPathMeta}>{path.courses} courses • {path.duration}</Text>
                  {path.progress > 0 && (
                    <View style={styles.certPathProgress}>
                      <View style={[styles.certPathProgressFill, { width: `${path.progress * 100}%`, backgroundColor: path.color }]} />
                    </View>
                  )}
                  {path.progress === 0 && (
                    <Text style={[styles.certPathStart, { color: path.color }]}>Start Path →</Text>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Recommended For You */}
            <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Recommended For You</Text>
            <View style={styles.recommendedRow}>
              {[
                { title: "Colombian Slang & Street Talk", thumb: "🇨🇴", rating: 4.8, duration: "2.5 hrs" },
                { title: "Spanish for Customer Service", thumb: "📞", rating: 4.7, duration: "3 hrs" },
                { title: "Dominican Bachata Lyrics", thumb: "💃", rating: 4.9, duration: "2 hrs" },
              ].map((rec, i) => (
                <TouchableOpacity key={i} style={styles.recommendedCard} onPress={() => router.push("/course-detail" as any)} activeOpacity={0.8}>
                  <View style={styles.recommendedThumb}>
                    <Text style={{ fontSize: 24 }}>{rec.thumb}</Text>
                  </View>
                  <Text style={styles.recommendedTitle} numberOfLines={2}>{rec.title}</Text>
                  <View style={styles.recommendedMeta}>
                    <Ionicons name="star" size={10} color={Colors.gold} />
                    <Text style={styles.recommendedRating}>{rec.rating}</Text>
                    <Text style={styles.recommendedDuration}>{rec.duration}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* ===== PROGRESS TAB ===== */}
        {activeNav === "progress" && (
          <View style={styles.sectionPad}>
            <Text style={styles.sectionTitle}>Learning Analytics</Text>
            <View style={styles.analyticsGrid}>
              <View style={styles.analyticsCard}>
                <Text style={styles.analyticsLabel}>THIS WEEK</Text>
                <Text style={[styles.analyticsValue, { color: Colors.secondary }]}>3.5 hrs</Text>
                <Text style={styles.analyticsDesc}>Study time</Text>
              </View>
              <View style={styles.analyticsCard}>
                <Text style={styles.analyticsLabel}>ACCURACY</Text>
                <Text style={[styles.analyticsValue, { color: Colors.success }]}>87%</Text>
                <Text style={styles.analyticsDesc}>Quiz scores</Text>
              </View>
              <View style={styles.analyticsCard}>
                <Text style={styles.analyticsLabel}>PRONUNCIATION</Text>
                <Text style={[styles.analyticsValue, { color: Colors.gold }]}>72</Text>
                <Text style={styles.analyticsDesc}>Average score</Text>
              </View>
              <View style={styles.analyticsCard}>
                <Text style={styles.analyticsLabel}>FLUENCY</Text>
                <Text style={[styles.analyticsValue, { color: "#8B5CF6" }]}>B1</Text>
                <Text style={styles.analyticsDesc}>Current level</Text>
              </View>
            </View>

            <Text style={styles.sectionTitle}>Areas to Improve</Text>
            {[
              { area: "Verb conjugation (past tense)", score: 45, color: Colors.accent },
              { area: "Listening comprehension", score: 62, color: Colors.warning },
              { area: "Pronunciation of 'rr' sounds", score: 55, color: Colors.gold },
            ].map((item, i) => (
              <View key={i} style={styles.weakAreaItem}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.weakAreaTitle}>{item.area}</Text>
                  <View style={styles.weakAreaBar}>
                    <View style={[styles.weakAreaFill, { width: `${item.score}%`, backgroundColor: item.color }]} />
                  </View>
                </View>
                <Text style={[styles.weakAreaScore, { color: item.color }]}>{item.score}%</Text>
              </View>
            ))}
          </View>
        )}

        {/* ===== RECORDINGS TAB ===== */}
        {activeNav === "recordings" && (
          <View style={styles.sectionPad}>
            <Text style={styles.sectionTitle}>Voice Recordings</Text>
            <Text style={styles.sectionSub}>Your practice sessions and time capsules</Text>
            {[
              { title: "Ordering at a restaurant", date: "Today", duration: "2:34", score: 78 },
              { title: "Introducing myself in Spanish", date: "Yesterday", duration: "1:45", score: 85 },
              { title: "Song: Despacito (chorus)", date: "2 days ago", duration: "3:12", score: 72 },
              { title: "Time Capsule - Day 30", date: "Last week", duration: "0:45", score: null },
            ].map((rec, i) => (
              <View key={i} style={styles.recordingItem}>
                <View style={styles.recordingIcon}>
                  <Ionicons name="mic" size={16} color={Colors.secondary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.recordingTitle}>{rec.title}</Text>
                  <Text style={styles.recordingMeta}>{rec.date} • {rec.duration}</Text>
                </View>
                {rec.score !== null && (
                  <View style={styles.scoreBadge}>
                    <Text style={styles.scoreText}>{rec.score}</Text>
                  </View>
                )}
                <TouchableOpacity>
                  <Ionicons name="play-circle" size={28} color={Colors.secondary} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    
      <PaywallModal
        visible={showPaywall}
        onClose={dismissPaywall}
        feature={paywallFeature}
        singlePrice={singlePrice}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <View style={styles.toastContainer}>
          <View style={styles.toastBubble}>
            <Text style={styles.toastText}>{toastMessage}</Text>
          </View>
        </View>
      )}
      {/* Streak Milestone Celebration */}
      <StreakCelebration
        visible={showStreakCelebration}
        streakDays={celebrationStreak}
        onDismiss={() => setShowStreakCelebration(false)}
      />
</SafeAreaView>
    </ScreenErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.primary },

  // ===== Profile Header =====
  profileHeader: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  profileRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  profilePhoto: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.secondary,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: Colors.glowBorder,
    position: "relative",
  },
  profileInitial: { fontSize: 22, fontWeight: "800", color: Colors.textPrimary },
  profileOnline: {
    position: "absolute",
    bottom: 1,
    right: 1,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.success,
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  profileInfo: { flex: 1 },
  profileName: { fontSize: FontSize.lg, fontWeight: "700", color: Colors.textPrimary },
  languageRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 3 },
  flagEmoji: { fontSize: 16 },
  languageText: { fontSize: FontSize.sm, color: Colors.textSecondary },
  stageRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 5 },
  stageBadge: {
    backgroundColor: Colors.glowSubtle,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.glowBorder,
  },
  stageText: { fontSize: 10, fontWeight: "700", color: Colors.secondary },
  globeContainer: { flexDirection: "row", alignItems: "center", gap: 4 },
  globeText: { fontSize: 10, color: Colors.textSecondary },
  notifBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surfaceCard,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.border,
    position: "relative",
  },
  notifDot: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.accent,
  },

  // Achievements
  achievementsRow: {
    flexDirection: "row",
    marginTop: Spacing.md,
    gap: 8,
  },
  achievementItem: {
    flex: 1,
    alignItems: "center",
    backgroundColor: Colors.surfaceCard,
    paddingVertical: 8,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  achievementIcon: { fontSize: 18 },
  achievementLabel: { fontSize: 9, color: Colors.textSecondary, marginTop: 3, fontWeight: "600" },

  // Quick stats
  quickStatsRow: {
    flexDirection: "row",
    marginTop: Spacing.md,
    backgroundColor: Colors.surfaceCard,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
  },
  quickStat: { flex: 1, alignItems: "center" },
  quickStatValue: { fontSize: FontSize.lg, fontWeight: "800" },
  quickStatLabel: { fontSize: 10, color: Colors.textSecondary, marginTop: 2 },
  quickStatDivider: { width: 1, height: 28, backgroundColor: Colors.border },

  // ===== Nav Rail =====
  navRail: { paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, gap: 8 },
  navItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surfaceCard,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    borderRadius: BorderRadius.md,
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    minWidth: 130,
  },
  navItemActive: {
    backgroundColor: Colors.surfaceElevated,
    borderColor: Colors.glowBorder,
    shadowColor: Colors.glow,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  navLabel: { fontSize: FontSize.sm, fontWeight: "600", color: Colors.textSecondary },
  navLabelActive: { color: Colors.textPrimary },
  navSub: { fontSize: 9, color: Colors.textMuted, marginTop: 1 },

  // ===== Command Center =====
  commandCenter: {
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.sm,
    padding: Spacing.lg,
    backgroundColor: Colors.surfaceCard,
    borderRadius: BorderRadius.xl,
    borderWidth: 1.5,
    borderColor: Colors.glowBorder,
    shadowColor: Colors.glow,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 10,
  },
  commandCenterHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: Spacing.md },
  commandCenterBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: Colors.goldGlow,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.goldBorder,
  },
  commandCenterBadgeText: { fontSize: 9, fontWeight: "800", color: Colors.gold, letterSpacing: 0.5 },
  commandCenterActions: { flexDirection: "row", gap: 6 },
  commandActionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: Colors.glowSubtle,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.glowBorder,
  },
  commandActionText: { fontSize: 10, fontWeight: "600", color: Colors.secondary },
  commandTitle: { fontSize: FontSize.xl, fontWeight: "700", color: Colors.textPrimary, lineHeight: 30, marginBottom: Spacing.sm },
  commandDesc: { fontSize: FontSize.sm, color: Colors.textSecondary, lineHeight: 20, marginBottom: Spacing.lg },

  // Stat cards
  statRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  statCard: {
    width: (width - 40 - 24 - 8) / 2,
    backgroundColor: Colors.surfaceElevated,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    borderWidth: 1,
  },
  statLabel: { fontSize: 9, fontWeight: "800", color: Colors.textSecondary, letterSpacing: 0.5, marginBottom: 4 },
  statValue: { fontSize: FontSize.xl, fontWeight: "800", marginBottom: 4 },
  statDesc: { fontSize: 10, color: Colors.textMuted, lineHeight: 14 },

  // Quick grid
  quickGrid: { flexDirection: "row", flexWrap: "wrap", paddingHorizontal: Spacing.lg, marginTop: Spacing.lg, gap: 10 },
  quickGridItem: {
    width: (width - 40 - 10) / 2,
    backgroundColor: Colors.surfaceCard,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 8,
  },
  quickGridIcon: { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center", borderWidth: 1 },
  quickGridTitle: { fontSize: FontSize.md, fontWeight: "700", color: Colors.textPrimary },
  quickGridDesc: { fontSize: FontSize.xs, color: Colors.textSecondary },

  // Today's Schedule
  todaySchedule: { paddingHorizontal: Spacing.lg, marginTop: Spacing.lg },
  todayHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: Spacing.sm },
  seeAllText: { fontSize: FontSize.sm, color: Colors.secondary, fontWeight: "600" },
  scheduleItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surfaceCard,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 12,
  },
  scheduleBar: { width: 3, height: 36, borderRadius: 2 },
  scheduleTitle: { fontSize: FontSize.md, fontWeight: "600", color: Colors.textPrimary },
  scheduleTime: { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 2 },
  scheduleTypeBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: BorderRadius.full, borderWidth: 1 },
  scheduleTypeText: { fontSize: 10, fontWeight: "700" },

  // Current teacher
  currentTeacherCard: {
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.lg,
    padding: Spacing.lg,
    backgroundColor: Colors.surfaceCard,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.glowBorder,
  },
  currentTeacherTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: Spacing.md },
  currentTeacherLabel: { fontSize: 10, fontWeight: "800", color: Colors.secondary, letterSpacing: 1 },
  onlineIndicator: { flexDirection: "row", alignItems: "center", gap: 5 },
  onlinePulse: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.success },
  onlineText: { fontSize: FontSize.xs, color: Colors.success, fontWeight: "600" },
  currentTeacherBody: { flexDirection: "row", alignItems: "center", gap: 14, marginBottom: Spacing.lg },
  teacherAvatarLg: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.glowSubtle,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: Colors.glowBorder,
  },
  currentTeacherName: { fontSize: FontSize.lg, fontWeight: "700", color: Colors.textPrimary },
  currentTeacherDialect: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 2 },
  currentTeacherSpecialty: { fontSize: FontSize.xs, color: Colors.secondary, marginTop: 3, fontWeight: "500" },
  currentTeacherActions: { flexDirection: "row", gap: 8 },
  primaryActionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.secondary,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: 5,
  },
  primaryActionText: { fontSize: FontSize.xs, fontWeight: "700", color: Colors.textPrimary },
  videoActionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.greenGlow,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: 5,
    borderWidth: 1,
    borderColor: Colors.greenBorder,
  },
  videoActionText: { fontSize: FontSize.xs, fontWeight: "700", color: Colors.success },
  secondaryActionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.glowSubtle,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: 5,
    borderWidth: 1,
    borderColor: Colors.glowBorder,
  },
  secondaryActionText: { fontSize: FontSize.xs, fontWeight: "700", color: Colors.secondary },

  // Section
  sectionTitle: { fontSize: FontSize.lg, fontWeight: "700", color: Colors.textPrimary, marginTop: Spacing.lg, marginBottom: Spacing.sm },
  sectionSub: { fontSize: FontSize.sm, color: Colors.textSecondary, marginBottom: Spacing.md },
  sectionPad: { paddingHorizontal: Spacing.lg },

  // ===== Calendar =====
  calendarHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: Spacing.sm },
  calendarMonth: { fontSize: FontSize.xl, fontWeight: "700", color: Colors.textPrimary },
  calendarActions: { flexDirection: "row", gap: 6 },
  calendarActionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: Colors.glowSubtle,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.glowBorder,
  },
  calendarActionText: { fontSize: FontSize.xs, fontWeight: "600", color: Colors.secondary },

  // Week strip
  weekStrip: {
    flexDirection: "row",
    marginTop: Spacing.lg,
    backgroundColor: Colors.surfaceCard,
    borderRadius: BorderRadius.lg,
    padding: 6,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  weekDay: { flex: 1, alignItems: "center", paddingVertical: Spacing.sm, borderRadius: BorderRadius.md },
  weekDayActive: { backgroundColor: Colors.secondary },
  weekDayLabel: { fontSize: 10, fontWeight: "600", color: Colors.textSecondary },
  weekDayLabelActive: { color: Colors.textPrimary },
  weekDayDate: { fontSize: FontSize.md, fontWeight: "700", color: Colors.textPrimary, marginTop: 3 },
  weekDayDateActive: { color: Colors.textPrimary },
  todayDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: Colors.secondary, marginTop: 3 },

  // Schedule list
  scheduleList: { marginTop: Spacing.lg },
  scheduleDateTitle: { fontSize: FontSize.md, fontWeight: "700", color: Colors.textPrimary, marginBottom: Spacing.md },

  // Calendar events
  calendarEvent: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surfaceCard,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 12,
  },
  eventBar: { width: 3, height: 40, borderRadius: 2 },
  eventTitle: { fontSize: FontSize.md, fontWeight: "600", color: Colors.textPrimary },
  eventTime: { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 2 },
  eventActions: {},
  eventJoinBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: Colors.secondary,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: BorderRadius.full,
  },
  eventJoinText: { fontSize: FontSize.xs, fontWeight: "700", color: Colors.textPrimary },
  eventTypeBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: BorderRadius.full, borderWidth: 1 },
  eventTypeText: { fontSize: 10, fontWeight: "700" },

  // Empty day
  emptyDay: { alignItems: "center", paddingVertical: Spacing.xl, gap: 8 },
  emptyDayText: { fontSize: FontSize.sm, color: Colors.textMuted },
  emptyDayBtn: {
    backgroundColor: Colors.glowSubtle,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.glowBorder,
    marginTop: 4,
  },
  emptyDayBtnText: { fontSize: FontSize.sm, fontWeight: "600", color: Colors.secondary },

  // Quick schedule
  quickScheduleGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  quickScheduleItem: {
    width: (width - 40 - 16) / 3,
    alignItems: "center",
    backgroundColor: Colors.surfaceCard,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 6,
  },
  quickScheduleLabel: { fontSize: 10, fontWeight: "600", color: Colors.textSecondary },

  // Alerts
  alertItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surfaceCard,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 10,
  },
  alertIcon: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center", borderWidth: 1 },
  alertText: { flex: 1, fontSize: FontSize.sm, color: Colors.textPrimary },

  // ===== Teachers =====
  teacherCard: {
    backgroundColor: Colors.surfaceCard,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  teacherCardRow: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: Spacing.sm },
  teacherAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.glowSubtle,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  teacherName: { fontSize: FontSize.md, fontWeight: "700", color: Colors.textPrimary },
  teacherDialect: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 2 },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  teacherMeta: { flexDirection: "row", alignItems: "center", gap: 6 },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 3 },
  metaText: { fontSize: FontSize.xs, color: Colors.textSecondary },
  metaDivider: { color: Colors.textMuted, fontSize: FontSize.xs },
  talkBtn: { backgroundColor: Colors.secondary, paddingHorizontal: Spacing.md, paddingVertical: 5, borderRadius: BorderRadius.full },
  talkBtnDisabled: { backgroundColor: Colors.surfaceElevated },
  talkBtnText: { fontSize: FontSize.xs, fontWeight: "700", color: Colors.textPrimary },

  // ===== Classes =====
  classroomHero: {
    backgroundColor: Colors.surfaceCard,
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5,
    borderColor: "rgba(139,92,246,0.5)",
    overflow: "hidden",
    marginBottom: Spacing.md,
  },
  heroGlow: { position: "absolute", top: 0, left: 0, right: 0, height: 2, backgroundColor: "#8B5CF6" },
  heroRow: { flexDirection: "row", alignItems: "center", padding: Spacing.lg, gap: 12 },
  heroIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: "rgba(139,92,246,0.12)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(139,92,246,0.4)",
  },
  heroTitle: { fontSize: FontSize.lg, fontWeight: "700", color: Colors.textPrimary },
  heroDesc: { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 2 },
  classCard: {
    backgroundColor: Colors.surfaceCard,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  classTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
  levelBadge: {
    backgroundColor: Colors.glowSubtle,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.glowBorder,
  },
  levelText: { fontSize: 10, fontWeight: "700", color: Colors.secondary },
  classTime: { fontSize: FontSize.xs, color: Colors.textSecondary },
  classTitle: { fontSize: FontSize.md, fontWeight: "700", color: Colors.textPrimary },
  classTeacher: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 2 },
  classBottom: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: Spacing.md },
  classSeats: { fontSize: FontSize.xs, color: Colors.textMuted },
  classBtn: {
    backgroundColor: Colors.surfaceElevated,
    paddingHorizontal: Spacing.md,
    paddingVertical: 5,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  classBtnActive: { backgroundColor: Colors.secondary, borderColor: Colors.secondary },
  classBtnText: { fontSize: FontSize.sm, fontWeight: "700", color: Colors.textSecondary },

  // ===== Lessons =====
  lessonHero: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
    backgroundColor: Colors.surfaceCard,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.greenBorder,
    gap: 12,
    marginBottom: Spacing.md,
  },
  lessonHeroIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: Colors.greenGlow,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.greenBorder,
  },
  lessonHeroTitle: { fontSize: FontSize.md, fontWeight: "700", color: Colors.textPrimary },
  lessonHeroDesc: { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 2 },
  b2bCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    backgroundColor: Colors.surfaceCard,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.goldBorder,
    gap: 12,
    marginBottom: Spacing.md,
  },
  b2bIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: Colors.goldGlow,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.goldBorder,
  },
  b2bTitle: { fontSize: FontSize.md, fontWeight: "700", color: Colors.textPrimary },
  b2bDesc: { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 2 },
  b2bBadge: { backgroundColor: Colors.gold, paddingHorizontal: 8, paddingVertical: 3, borderRadius: BorderRadius.full },
  b2bBadgeText: { fontSize: 10, fontWeight: "800", color: Colors.textDark },
  lessonItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    backgroundColor: Colors.surfaceCard,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.sm,
  },
  lessonItemTitle: { fontSize: FontSize.md, fontWeight: "600", color: Colors.textPrimary },
  lessonItemMeta: { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 2 },
  progressCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 3,
    borderColor: Colors.secondary,
    alignItems: "center",
    justifyContent: "center",
  },
  progressCircleText: { fontSize: 10, fontWeight: "700", color: Colors.secondary },
  startBtn: { backgroundColor: Colors.secondary, paddingHorizontal: 12, paddingVertical: 5, borderRadius: BorderRadius.full },
  startBtnText: { fontSize: FontSize.xs, fontWeight: "700", color: Colors.textPrimary },

  // ===== Progress =====
  analyticsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  analyticsCard: {
    width: (width - 40 - 8) / 2,
    backgroundColor: Colors.surfaceCard,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  analyticsLabel: { fontSize: 9, fontWeight: "800", color: Colors.textSecondary, letterSpacing: 0.5, marginBottom: 4 },
  analyticsValue: { fontSize: FontSize.xl, fontWeight: "800", marginBottom: 4 },
  analyticsDesc: { fontSize: 10, color: Colors.textMuted },
  weakAreaItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.md,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  weakAreaTitle: { fontSize: FontSize.sm, fontWeight: "600", color: Colors.textPrimary, marginBottom: 6 },
  weakAreaBar: { height: 6, backgroundColor: "rgba(255,255,255,0.05)", borderRadius: 3, overflow: "hidden" },
  weakAreaFill: { height: "100%", borderRadius: 3 },
  weakAreaScore: { fontSize: FontSize.md, fontWeight: "700" },

  // ===== Recordings =====
  recordingItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.md,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  recordingIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.glowSubtle,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.glowBorder,
  },
  recordingTitle: { fontSize: FontSize.md, fontWeight: "600", color: Colors.textPrimary },
  recordingMeta: { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 2 },
  scoreBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.glowSubtle,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.glowBorder,
  },
  scoreText: { fontSize: FontSize.sm, fontWeight: "700", color: Colors.secondary },

  // ===== Courses Tab =====
  courseSearchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surfaceCard,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: 14,
    gap: 10,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  courseSearchPlaceholder: { fontSize: FontSize.md, color: Colors.textMuted },
  continueCourseCard: {
    width: 260,
    backgroundColor: Colors.surfaceCard,
    borderRadius: BorderRadius.lg,
    marginRight: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: "hidden",
  },
  courseThumbnail: {
    height: 100,
    backgroundColor: Colors.glowSubtle,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  coursePlayBtn: {
    position: "absolute",
    bottom: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(0,170,255,0.9)",
    alignItems: "center",
    justifyContent: "center",
  },
  courseCardBody: { padding: 12 },
  courseCardTitle: { fontSize: FontSize.md, fontWeight: "700", color: Colors.textPrimary, marginBottom: 4 },
  courseCardInstructor: { fontSize: FontSize.xs, color: Colors.textSecondary, marginBottom: 8 },
  courseProgressRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  courseProgressBg: { flex: 1, height: 4, backgroundColor: "rgba(255,255,255,0.1)", borderRadius: 2, overflow: "hidden" },
  courseProgressFill: { height: "100%", backgroundColor: Colors.secondary, borderRadius: 2 },
  courseProgressText: { fontSize: 10, fontWeight: "700", color: Colors.secondary },
  categoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 20,
  },
  categoryCard: {
    width: "48%" as any,
    backgroundColor: Colors.surfaceCard,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
    gap: 6,
  },
  categoryIconBg: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  categoryLabel: { fontSize: FontSize.sm, fontWeight: "700", color: Colors.textPrimary },
  categoryCount: { fontSize: FontSize.xs, color: Colors.textSecondary },
  featuredCourseCard: {
    flexDirection: "row",
    backgroundColor: Colors.surfaceCard,
    borderRadius: BorderRadius.lg,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 12,
  },
  featuredThumb: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: Colors.glowSubtle,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  certBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: Colors.success,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: Colors.primary,
  },
  featuredBody: { flex: 1, gap: 3 },
  featuredTitle: { fontSize: FontSize.md, fontWeight: "700", color: Colors.textPrimary },
  featuredInstructor: { fontSize: FontSize.xs, color: Colors.textSecondary },
  featuredMeta: { flexDirection: "row", alignItems: "center", gap: 4 },
  featuredRating: { fontSize: 11, fontWeight: "700", color: Colors.gold },
  featuredDot: { fontSize: 10, color: Colors.textMuted },
  featuredStudents: { fontSize: 11, color: Colors.textSecondary },
  featuredBottom: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 2 },
  levelBadgeText: { fontSize: 9, fontWeight: "700", color: Colors.secondary },
  featuredDuration: { fontSize: 10, color: Colors.textMuted },
  featuredPrice: { justifyContent: "center" },
  featuredPriceText: { fontSize: FontSize.sm, fontWeight: "800", color: Colors.gold },
  certPathCard: {
    width: 180,
    backgroundColor: Colors.surfaceCard,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginRight: 12,
    borderWidth: 1,
    gap: 8,
  },
  certPathIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  certPathTitle: { fontSize: FontSize.md, fontWeight: "700", color: Colors.textPrimary },
  certPathMeta: { fontSize: FontSize.xs, color: Colors.textSecondary },
  certPathProgress: { height: 4, backgroundColor: "rgba(255,255,255,0.1)", borderRadius: 2, overflow: "hidden" },
  certPathProgressFill: { height: "100%", borderRadius: 2 },
  certPathStart: { fontSize: FontSize.sm, fontWeight: "700", marginTop: 4 },
  recommendedRow: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  recommendedCard: {
    width: "31%" as any,
    backgroundColor: Colors.surfaceCard,
    borderRadius: BorderRadius.lg,
    padding: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
    gap: 6,
  },
  recommendedThumb: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.glowSubtle,
    alignItems: "center",
    justifyContent: "center",
  },
  recommendedTitle: { fontSize: 10, fontWeight: "600", color: Colors.textPrimary, textAlign: "center" },
  recommendedMeta: { flexDirection: "row", alignItems: "center", gap: 3 },
  recommendedRating: { fontSize: 9, fontWeight: "700", color: Colors.gold },
  recommendedDuration: { fontSize: 9, color: Colors.textMuted },

  // Freeze Widget
  freezeWidget: { marginHorizontal: 16, marginTop: 12, padding: 14, borderRadius: 14, borderWidth: 1, backgroundColor: Colors.cardBg },
  freezeWidgetHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  freezeWidgetLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  freezeWidgetTitle: { fontSize: 14, fontWeight: "700" },
  freezeWidgetSub: { fontSize: 11, marginTop: 1 },
  freezeWidgetBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  freezeWidgetBtnText: { fontSize: 12, fontWeight: "700" },
  freezeTimerBar: { height: 4, borderRadius: 2, backgroundColor: Colors.border, marginTop: 10, overflow: "hidden" as const },
  freezeTimerFill: { height: 4, borderRadius: 2 },
  // Toast
  toastContainer: { position: "absolute", top: 60, left: 0, right: 0, alignItems: "center", zIndex: 999 },
  toastBubble: { backgroundColor: "rgba(0, 170, 255, 0.9)", paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  toastText: { fontSize: 13, fontWeight: "600", color: "#fff" },
});
