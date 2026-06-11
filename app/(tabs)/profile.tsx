import React, { useState, useEffect } from "react";
import { ScreenErrorBoundary } from "@/components/error-boundary";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  FlatList,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Colors, Spacing, BorderRadius, FontSize } from "../../constants/Colors";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/hooks/use-auth";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getCurrentBadge, getNextBadge, getBadgeProgressSync, BADGE_TIERS_LIST, type BadgeTier } from "@/lib/pronunciation-streak-badges";
import { ProfileTabSkeleton, hapticLoadComplete } from "@/components/skeleton-loader";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const GRID_GAP = 2;
const GRID_COLS = 3;
const TILE_SIZE = (SCREEN_WIDTH - Spacing.lg * 2 - GRID_GAP * (GRID_COLS - 1)) / GRID_COLS;

// ─── Mock Data ──────────────────────────────────────────────────────────────

const CERTIFICATIONS = [
  {
    id: "1",
    title: "Spanish B2 Professional",
    issuer: "ConnectWorld AI",
    date: "May 2026",
    icon: "ribbon",
    color: Colors.gold,
    verified: true,
  },
  {
    id: "2",
    title: "Microsoft Purview SC-400 (Spanish)",
    issuer: "ConnectWorld AI + Microsoft",
    date: "Apr 2026",
    icon: "shield-checkmark",
    color: Colors.secondary,
    verified: true,
  },
  {
    id: "3",
    title: "French A2 Conversational",
    issuer: "ConnectWorld AI",
    date: "Mar 2026",
    icon: "ribbon",
    color: Colors.glow,
    verified: true,
  },
];

const SKILLS = [
  { name: "Spanish", level: "B2 Professional", percent: 78 },
  { name: "French", level: "A2 Conversational", percent: 35 },
  { name: "Portuguese", level: "A1 Beginner", percent: 12 },
];

const EXPERIENCE = [
  {
    id: "1",
    role: "Bilingual Customer Success Manager",
    company: "TechCorp International",
    type: "Full-time · Remote",
    period: "Jan 2025 – Present · 1 yr 5 mos",
    location: "Columbus, Ohio · Remote",
  },
  {
    id: "2",
    role: "Solutions Architect",
    company: "Infinite Web Solutions",
    type: "Full-time",
    period: "Mar 2020 – Dec 2024 · 4 yrs 10 mos",
    location: "Atlanta, Georgia · Remote",
  },
];

const RECOMMENDATIONS = [
  {
    id: "1",
    name: "Maria Gonzalez",
    title: "Director of Operations, LatAm Division",
    date: "May 2026",
    text: "An exceptional communicator who bridges language barriers effortlessly. Their Spanish proficiency and technical knowledge make them invaluable...",
  },
  {
    id: "2",
    name: "Shad Hill",
    title: "AI & Marketing Automation | Security & Compliance",
    date: "Apr 2026",
    text: "One of the most knowledgeable and forward-thinking professionals I've encountered. A rare combination of deep technical expertise and strategic vision...",
  },
];

const POSTS = [
  { id: "1", type: "image", hasLocation: true, location: "Columbus, OH" },
  { id: "2", type: "video", hasLocation: false },
  { id: "3", type: "song", hasLocation: false },
  { id: "4", type: "image", hasLocation: true, location: "Miami, FL" },
  { id: "5", type: "image", hasLocation: false },
  { id: "6", type: "video", hasLocation: true, location: "New York, NY" },
  { id: "7", type: "song", hasLocation: false },
  { id: "8", type: "image", hasLocation: false },
  { id: "9", type: "image", hasLocation: true, location: "Los Angeles, CA" },
];

// ─── Component ──────────────────────────────────────────────────────────────

export default function ProfileScreen() {
  const router = useRouter();
  const { language, t } = useI18n();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    const timer = setTimeout(() => { setIsLoading(false); hapticLoadComplete(); }, 650);
    return () => clearTimeout(timer);
  }, []);
  const [activeTab, setActiveTab] = useState<"posts" | "songs" | "videos" | "certs">("posts");
  const [recTab, setRecTab] = useState<"received" | "given">("received");
  const [streakDays, setStreakDays] = useState(0);
  const [lessonsCompleted, setLessonsCompleted] = useState(0);
  const [userUsername, setUserUsername] = useState('');
  const [userBio, setUserBio] = useState('');
  const [userPhoto, setUserPhoto] = useState<string | null>(null);
  const [wordsLearned, setWordsLearned] = useState(0);
  const [totalSessions, setTotalSessions] = useState(0);
  const [callsCompleted, setCallsCompleted] = useState(0);
  const [userLocation, setUserLocation] = useState('');
  const [userCompany, setUserCompany] = useState('');

  // Load real progress data and profile from AsyncStorage
  useEffect(() => {
    const loadProgress = async () => {
      try {
        const streak = await AsyncStorage.getItem('@streak_count');
        const streakData = await AsyncStorage.getItem('@streak_data');
        const lessons = await AsyncStorage.getItem('@lessons_completed');
        const username = await AsyncStorage.getItem('@user_username');
        const photo = await AsyncStorage.getItem('@user_profile_photo');
        const avatar = await AsyncStorage.getItem('@user_avatar');
        const authUser = await AsyncStorage.getItem('@auth_user');
        const vocabData = await AsyncStorage.getItem('@mastered_words');
        const location = await AsyncStorage.getItem('@user_location');
        const company = await AsyncStorage.getItem('@user_company');

        if (streak) setStreakDays(parseInt(streak, 10));
        else if (streakData) {
          try { setStreakDays(JSON.parse(streakData).current || 0); } catch {}
        }
        if (lessons) setLessonsCompleted(parseInt(lessons, 10));
        if (username) setUserUsername(username);
        if (photo) setUserPhoto(photo);
        else if (avatar) setUserPhoto(avatar);
        if (vocabData) {
          try { setWordsLearned(JSON.parse(vocabData).length || 0); } catch {}
        }
        if (location) setUserLocation(location);
        if (company) setUserCompany(company);
        if (authUser) {
          try {
            const parsed = JSON.parse(authUser);
            if (parsed.bio) setUserBio(parsed.bio);
            if (parsed.location && !location) setUserLocation(parsed.location);
            if (parsed.company && !company) setUserCompany(parsed.company);
          } catch {}
        }

        // Load analytics counts
        try {
          const { getAnalyticsSummary, getEventCounts } = await import("@/lib/analytics");
          const summary = await getAnalyticsSummary();
          const counts = await getEventCounts(["call_completed"]);
          setTotalSessions(summary.sessionsCount || 0);
          setCallsCompleted(counts["call_completed"] || 0);
          if (!lessons && counts["lesson_complete"]) setLessonsCompleted(counts["lesson_complete"]);
        } catch {}
      } catch {}
    };
    loadProgress();
  }, []);

  const userName = user?.name || user?.email?.split('@')[0] || 'User';

  const SUPPORTED_LANGUAGES_MAP: Record<string, { flag: string; name: string }> = {
    en: { flag: "🇺🇸", name: "English" },
    es: { flag: "🇪🇸", name: "Español" },
    fr: { flag: "🇫🇷", name: "Français" },
    pt: { flag: "🇧🇷", name: "Português" },
    ja: { flag: "🇯🇵", name: "日本語" },
    ko: { flag: "🇰🇷", name: "한국어" },
    zh: { flag: "🇨🇳", name: "中文" },
    ar: { flag: "🇸🇦", name: "العربية" },
    hi: { flag: "🇮🇳", name: "हिन्दी" },
  };
  const currentLang = SUPPORTED_LANGUAGES_MAP[language] || SUPPORTED_LANGUAGES_MAP.en;

    if (isLoading) {
    return (<ScreenErrorBoundary><SafeAreaView style={styles.container}><ProfileTabSkeleton /></SafeAreaView></ScreenErrorBoundary>);
  }
  return (
    <ScreenErrorBoundary>
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* ─── Header ─────────────────────────────────────────────── */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{t.profile}</Text>
          <View style={styles.headerRight}>
            <TouchableOpacity style={styles.headerBtn}>
              <Ionicons name="pencil" size={18} color={Colors.textPrimary} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.headerBtn}
              onPress={() => router.push("/settings" as any)}
            >
              <Ionicons name="settings-outline" size={20} color={Colors.textPrimary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* ─── Cover Banner ───────────────────────────────────────── */}
        <View style={styles.coverBanner}>
          <View style={styles.coverGradient}>
            <Text style={styles.coverText}>BILINGUAL</Text>
            <Text style={styles.coverSubtext}>PROFESSIONAL</Text>
          </View>
          <TouchableOpacity style={styles.coverEditBtn}>
            <Ionicons name="camera" size={14} color={Colors.textPrimary} />
          </TouchableOpacity>
        </View>

        {/* ─── Profile Header (IG + LinkedIn hybrid) ──────────────── */}
        <View style={styles.profileSection}>
          {/* Avatar overlapping cover */}
          <View style={styles.avatarWrapper}>
            <View style={styles.avatar}>
              {userPhoto ? (
                <Image source={{ uri: userPhoto }} style={{ width: 72, height: 72, borderRadius: 36 }} />
              ) : (
                <Ionicons name="person" size={36} color={Colors.textPrimary} />
              )}
            </View>
            {/* Open to Work ring */}
            <View style={styles.openToWorkBadge}>
              <Text style={styles.openToWorkText}>OPEN</Text>
            </View>
            {/* Level badge */}
            <View style={styles.levelBadge}>
              <Text style={styles.levelText}>12</Text>
            </View>
          </View>

                    {/* Name + Verified + Pronouns */}
          <View style={styles.nameRow}>
            <Text style={styles.userName}>{userName}</Text>
            <View style={styles.verifiedBadge}>
              <Ionicons name="checkmark-circle" size={18} color={Colors.secondary} />
            </View>
          </View>
          {userUsername ? (
            <Text style={[styles.pronouns, { marginTop: 2 }]}>@{userUsername}</Text>
          ) : null}
          {/* Bio / Headline */}
          <Text style={styles.headline}>
            {userBio || "Language learner | ConnectWorld ai"}
          </Text>

          {/* Company + Location */}
          {(userCompany || true) && (
            <View style={styles.metaRow}>
              <Ionicons name="business" size={14} color={Colors.textSecondary} />
              <Text style={styles.metaText}>{userCompany || "Add your company"}</Text>
            </View>
          )}
          {(userLocation || true) && (
            <View style={styles.metaRow}>
              <Ionicons name="location" size={14} color={Colors.textSecondary} />
              <Text style={styles.metaText}>{userLocation || "Add your location"}</Text>
            </View>
          )}

          {/* Language badge */}
          <TouchableOpacity
            style={styles.langBadge}
            onPress={() => router.push("/language-pack" as any)}
          >
            <Text style={styles.langBadgeFlag}>{currentLang.flag}</Text>
            <Text style={styles.langBadgeName}>{currentLang.name}</Text>
            <Ionicons name="chevron-forward" size={12} color={Colors.textSecondary} />
          </TouchableOpacity>

          {/* Connections + Profile viewers */}
          <View style={styles.connectionsRow}>
            <TouchableOpacity onPress={() => router.push("/connections" as any)}>
              <Text style={styles.connectionsText}>
                <Text style={styles.connectionsNumber}>96</Text> connections
              </Text>
            </TouchableOpacity>
            <Text style={styles.dotSep}>·</Text>
            <TouchableOpacity>
              <Text style={styles.connectionsText}>
                <Text style={styles.connectionsNumber}>54</Text> profile viewers
              </Text>
            </TouchableOpacity>
          </View>

          {/* Action Buttons (LinkedIn-style) */}
          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.openToBtn}>
              <Text style={styles.openToBtnText}>Open to</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.addSectionBtn}>
              <Text style={styles.addSectionBtnText}>Add section</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.moreBtn} onPress={() => router.push({ pathname: "/user-profile", params: { userId: "self", name: "Your Profile" } } as any)}>
              <Ionicons name="eye-outline" size={18} color={Colors.textPrimary} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.moreBtn}>
              <Ionicons name="ellipsis-horizontal" size={18} color={Colors.textPrimary} />
            </TouchableOpacity>
          </View>

          {/* Open to Work card */}
          <View style={styles.openToWorkCard}>
            <View style={styles.openToWorkCardContent}>
              <Text style={styles.openToWorkCardTitle}>Open to work · Visible to all</Text>
              <Text style={styles.openToWorkCardSub}>
                Bilingual roles, Remote, Enterprise Solutions
              </Text>
            </View>
            <TouchableOpacity>
              <Ionicons name="pencil" size={14} color={Colors.secondary} />
            </TouchableOpacity>
          </View>

          {/* Social Stats (IG-style) — Real data */}
          <View style={styles.socialStats}>
            <TouchableOpacity style={styles.socialStatItem}>
              <Text style={styles.socialStatNumber}>{lessonsCompleted}</Text>
              <Text style={styles.socialStatLabel}>Lessons</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.socialStatItem}>
              <Text style={styles.socialStatNumber}>{wordsLearned}</Text>
              <Text style={styles.socialStatLabel}>Words</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.socialStatItem}>
              <Text style={styles.socialStatNumber}>{streakDays}</Text>
              <Text style={styles.socialStatLabel}>Streak</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.socialStatItem}>
              <Text style={styles.socialStatNumber}>{callsCompleted}</Text>
              <Text style={styles.socialStatLabel}>Calls</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ─── Analytics (Private to you) ─────────────────────────── */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Analytics</Text>
            <View style={styles.privateTag}>
              <Ionicons name="eye" size={12} color={Colors.textMuted} />
              <Text style={styles.privateTagText}>Private to you</Text>
            </View>
          </View>
          <View style={styles.analyticsGrid}>
            <TouchableOpacity style={styles.analyticsItem}>
              <Ionicons name="school" size={20} color={Colors.secondary} />
              <Text style={styles.analyticsNumber}>{lessonsCompleted}</Text>
              <Text style={styles.analyticsLabel}>Lessons done</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.analyticsItem}>
              <Ionicons name="time" size={20} color={Colors.gold} />
              <Text style={styles.analyticsNumber}>{totalSessions}</Text>
              <Text style={styles.analyticsLabel}>Sessions</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.analyticsItem}>
              <Ionicons name="flame" size={20} color={Colors.success} />
              <Text style={styles.analyticsNumber}>{streakDays}</Text>
              <Text style={styles.analyticsLabel}>Day streak</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={styles.showAllBtn} onPress={() => router.push("/analytics-dashboard" as any)}>
            <Text style={styles.showAllText}>View all analytics →</Text>
          </TouchableOpacity>
        </View>

        {/* ─── About ──────────────────────────────────────────────── */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderEditable}>
            <Text style={styles.sectionTitle}>About</Text>
            <TouchableOpacity>
              <Ionicons name="pencil" size={16} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>
          <Text style={styles.aboutText}>
            Expert in cloud architecture, AI solution delivery, and bilingual enterprise communication. 
            Operating as a solutions architect who designs, secures, and runs platforms end-to-end. 
            Certified bilingual professional (Spanish B2) through ConnectWorld AI with proven ability to 
            bridge technical and cultural gaps for international teams.
          </Text>
          <TouchableOpacity>
            <Text style={styles.seeMoreText}>...see more</Text>
          </TouchableOpacity>
        </View>

        {/* ─── Certifications & Licenses ──────────────────────────── */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderEditable}>
            <Text style={styles.sectionTitle}>Certifications ({CERTIFICATIONS.length})</Text>
            <View style={styles.sectionActions}>
              <TouchableOpacity>
                <Ionicons name="add" size={20} color={Colors.textSecondary} />
              </TouchableOpacity>
              <TouchableOpacity>
                <Ionicons name="pencil" size={16} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>
          </View>
          {CERTIFICATIONS.map((cert, idx) => (
            <View key={cert.id} style={[styles.certItem, idx > 0 && styles.certDivider]}>
              <View style={[styles.certIcon, { backgroundColor: `${cert.color}20` }]}>
                <Ionicons name={cert.icon as any} size={20} color={cert.color} />
              </View>
              <View style={styles.certInfo}>
                <Text style={styles.certTitle}>{cert.title}</Text>
                <Text style={styles.certIssuer}>{cert.issuer}</Text>
                <Text style={styles.certDate}>Issued {cert.date}</Text>
                {cert.verified && (
                  <TouchableOpacity style={styles.showCredBtn}>
                    <Text style={styles.showCredText}>Show credential</Text>
                    <Ionicons name="open-outline" size={12} color={Colors.secondary} />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ))}
          <TouchableOpacity style={styles.showAllBtn} onPress={() => router.push("/my-certificates")}>
            <Text style={styles.showAllText}>Show all →</Text>
          </TouchableOpacity>
        </View>

        {/* ─── Skills & Languages ─────────────────────────────────── */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderEditable}>
            <Text style={styles.sectionTitle}>Skills ({SKILLS.length + 4})</Text>
            <View style={styles.sectionActions}>
              <TouchableOpacity>
                <Ionicons name="add" size={20} color={Colors.textSecondary} />
              </TouchableOpacity>
              <TouchableOpacity>
                <Ionicons name="pencil" size={16} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>
          </View>
          {SKILLS.map((skill, idx) => (
            <View key={skill.name} style={[styles.skillItem, idx > 0 && styles.certDivider]}>
              <View style={styles.skillHeader}>
                <Text style={styles.skillName}>{skill.name}</Text>
                <Text style={styles.skillLevel}>{skill.level}</Text>
              </View>
              <View style={styles.skillBar}>
                <View style={[styles.skillFill, { width: `${skill.percent}%` }]} />
              </View>
            </View>
          ))}
          <TouchableOpacity style={styles.showAllBtn}>
            <Text style={styles.showAllText}>Show all →</Text>
          </TouchableOpacity>
        </View>

        {/* ─── Experience ─────────────────────────────────────────── */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderEditable}>
            <Text style={styles.sectionTitle}>Experience</Text>
            <View style={styles.sectionActions}>
              <TouchableOpacity>
                <Ionicons name="add" size={20} color={Colors.textSecondary} />
              </TouchableOpacity>
              <TouchableOpacity>
                <Ionicons name="pencil" size={16} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>
          </View>
          {EXPERIENCE.map((exp, idx) => (
            <View key={exp.id} style={[styles.expItem, idx > 0 && styles.certDivider]}>
              <View style={styles.expIcon}>
                <Ionicons name="briefcase" size={20} color={Colors.secondary} />
              </View>
              <View style={styles.expInfo}>
                <Text style={styles.expRole}>{exp.role}</Text>
                <Text style={styles.expCompany}>{exp.company} · {exp.type}</Text>
                <Text style={styles.expPeriod}>{exp.period}</Text>
                <Text style={styles.expLocation}>{exp.location}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* ─── Recommendations ────────────────────────────────────── */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderEditable}>
            <Text style={styles.sectionTitle}>Recommendations</Text>
            <View style={styles.sectionActions}>
              <TouchableOpacity>
                <Ionicons name="add" size={20} color={Colors.textSecondary} />
              </TouchableOpacity>
              <TouchableOpacity>
                <Ionicons name="pencil" size={16} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>
          </View>
          {/* Tabs */}
          <View style={styles.recTabs}>
            <TouchableOpacity
              style={[styles.recTab, recTab === "received" && styles.recTabActive]}
              onPress={() => setRecTab("received")}
            >
              <Text style={[styles.recTabText, recTab === "received" && styles.recTabTextActive]}>
                Received ({RECOMMENDATIONS.length})
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.recTab, recTab === "given" && styles.recTabActive]}
              onPress={() => setRecTab("given")}
            >
              <Text style={[styles.recTabText, recTab === "given" && styles.recTabTextActive]}>
                Given
              </Text>
            </TouchableOpacity>
          </View>
          {RECOMMENDATIONS.map((rec, idx) => (
            <View key={rec.id} style={[styles.recItem, idx > 0 && styles.certDivider]}>
              <View style={styles.recAvatar}>
                <Ionicons name="person" size={18} color={Colors.textSecondary} />
              </View>
              <View style={styles.recContent}>
                <Text style={styles.recName}>{rec.name}</Text>
                <Text style={styles.recTitle}>{rec.title}</Text>
                <Text style={styles.recDate}>{rec.date}</Text>
                <Text style={styles.recText}>{rec.text}</Text>
                <TouchableOpacity>
                  <Text style={styles.seeMoreText}>...more</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>

        {/* ─── Featured / Posts Section (IG-style tabs) ────────────── */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Content</Text>
          {/* Filter tabs */}
          <View style={styles.profileTabs}>
            <TouchableOpacity
              style={[styles.profileTab, activeTab === "posts" && styles.profileTabActive]}
              onPress={() => setActiveTab("posts")}
            >
              <Ionicons name="grid" size={20} color={activeTab === "posts" ? Colors.secondary : Colors.textMuted} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.profileTab, activeTab === "songs" && styles.profileTabActive]}
              onPress={() => setActiveTab("songs")}
            >
              <Ionicons name="musical-notes" size={20} color={activeTab === "songs" ? Colors.gold : Colors.textMuted} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.profileTab, activeTab === "videos" && styles.profileTabActive]}
              onPress={() => setActiveTab("videos")}
            >
              <Ionicons name="videocam" size={20} color={activeTab === "videos" ? Colors.accent : Colors.textMuted} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.profileTab, activeTab === "certs" && styles.profileTabActive]}
              onPress={() => setActiveTab("certs")}
            >
              <Ionicons name="ribbon" size={20} color={activeTab === "certs" ? Colors.success : Colors.textMuted} />
            </TouchableOpacity>
          </View>

          {/* Posts Grid */}
          <View style={styles.postsGrid}>
            {POSTS.map((post) => (
              <TouchableOpacity key={post.id} style={styles.postTile}>
                <View style={styles.postPlaceholder}>
                  {post.type === "song" ? (
                    <Ionicons name="musical-notes" size={20} color={Colors.gold} />
                  ) : post.type === "video" ? (
                    <Ionicons name="play" size={20} color={Colors.accent} />
                  ) : (
                    <Ionicons name="image" size={20} color={Colors.textMuted} />
                  )}
                </View>
                {post.hasLocation && (
                  <View style={styles.locationTag}>
                    <Ionicons name="location" size={8} color={Colors.textPrimary} />
                    <Text style={styles.locationText}>{post.location}</Text>
                  </View>
                )}
                {post.type === "video" && (
                  <View style={styles.postBadge}>
                    <Ionicons name="play" size={8} color="#FFF" />
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ─── Learning Progress ──────────────────────────────────── */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Learning Progress</Text>
          <View style={styles.learningStats}>
            <View style={styles.learnStatItem}>
              <Text style={styles.learnStatNumber}>7</Text>
              <Text style={styles.learnStatLabel}>Day Streak</Text>
            </View>
            <View style={styles.learnStatDivider} />
            <View style={styles.learnStatItem}>
              <Text style={styles.learnStatNumber}>1,240</Text>
              <Text style={styles.learnStatLabel}>XP</Text>
            </View>
            <View style={styles.learnStatDivider} />
            <View style={styles.learnStatItem}>
              <Text style={styles.learnStatNumber}>5</Text>
              <Text style={styles.learnStatLabel}>Songs</Text>
            </View>
          </View>
          {/* Language cards */}
          <View style={styles.langCards}>
            <View style={styles.langCard}>
              <Text style={styles.langCardFlag}>🇩🇴</Text>
              <View style={styles.langCardInfo}>
                <Text style={styles.langCardName}>Dominican Spanish</Text>
                <Text style={styles.langCardLevel}>B2 Professional</Text>
              </View>
              <View style={styles.langCardPercent}>
                <Text style={styles.langCardPercentText}>78%</Text>
              </View>
            </View>
            <View style={styles.langCard}>
              <Text style={styles.langCardFlag}>🇫🇷</Text>
              <View style={styles.langCardInfo}>
                <Text style={styles.langCardName}>Parisian French</Text>
                <Text style={styles.langCardLevel}>A2 Conversational</Text>
              </View>
              <View style={styles.langCardPercent}>
                <Text style={styles.langCardPercentText}>35%</Text>
              </View>
            </View>
          </View>
        </View>

        {/* ─── Pronunciation Streak Badges ────────────────────── */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Pronunciation Badges</Text>
          <View style={styles.badgeGrid}>
            {BADGE_TIERS_LIST.map((tier) => {
              const current = getCurrentBadge(streakDays);
              const currentIdx = current ? BADGE_TIERS_LIST.findIndex(t => t.name === current.name) : -1;
              const tierIdx = BADGE_TIERS_LIST.indexOf(tier);
              const isEarned = currentIdx >= tierIdx;
              return (
                <View
                  key={tier.name}
                  style={[
                    styles.badgeItem,
                    { borderColor: isEarned ? tier.color : Colors.border, opacity: isEarned ? 1 : 0.4 },
                  ]}
                >
                  <Text style={styles.badgeIcon}>{tier.icon}</Text>
                  <Text style={[styles.badgeName, { color: isEarned ? tier.color : Colors.textMuted }]}>
                    {tier.name}
                  </Text>
                  <Text style={styles.badgeReq}>{tier.minStreak}+ days</Text>
                </View>
              );
            })}
          </View>
          {(() => {
            const progress = getBadgeProgressSync(streakDays);
            const next = getNextBadge(streakDays);
            return next ? (
              <View style={styles.badgeProgressRow}>
                <View style={styles.badgeProgressBar}>
                  <View style={[styles.badgeProgressFill, { width: `${Math.min(progress, 100)}%`, backgroundColor: next.color }]} />
                </View>
                <Text style={styles.badgeProgressText}>{Math.round(progress)}% to {next.icon} {next.name}</Text>
              </View>
            ) : (
              <Text style={styles.badgeProgressText}>All badges earned! You're a pronunciation master!</Text>
            );
          })()}
        </View>

        {/* ─── Trophies / Achievements Card ──────────────────────── */}
        <TouchableOpacity
          style={styles.trophiesCard}
          onPress={() => router.push("/achievements-wall" as any)}
          activeOpacity={0.8}
        >
          <View style={styles.trophiesIconWrap}>
            <Ionicons name="trophy" size={28} color={Colors.gold} />
          </View>
          <View style={styles.trophiesContent}>
            <Text style={styles.trophiesTitle}>Trophy Room</Text>
            <Text style={styles.trophiesSub}>View all achievements & badges</Text>
          </View>
          <View style={styles.trophiesBadgeCount}>
            <Text style={styles.trophiesBadgeNumber}>0</Text>
            <Text style={styles.trophiesBadgeLabel}>Earned</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
        </TouchableOpacity>

        {/* ─── My Progress / Analytics Dashboard ────────────────────── */}
        <TouchableOpacity
          style={styles.trophiesCard}
          onPress={() => router.push("/analytics-dashboard" as any)}
          activeOpacity={0.8}
        >
          <View style={styles.trophiesIconWrap}>
            <Ionicons name="analytics" size={28} color={Colors.secondary} />
          </View>
          <View style={styles.trophiesContent}>
            <Text style={styles.trophiesTitle}>My Progress</Text>
            <Text style={styles.trophiesSub}>Lessons, duels, streaks & more</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
        </TouchableOpacity>

        {/* ─── Upgrade Card ───────────────────────────────────────── */}
        <TouchableOpacity style={styles.upgradeCard} onPress={() => router.push("/checkout" as any)}>
          <Ionicons name="diamond" size={24} color={Colors.warning} />
          <View style={styles.upgradeText}>
            <Text style={styles.upgradeTitle}>Upgrade to Pro</Text>
            <Text style={styles.upgradeSubtitle}>
              Unlimited certifications · Voice clone · Priority job matching
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={Colors.textSecondary} />
        </TouchableOpacity>

        {/* ─── Quick Settings ─────────────────────────────────────── */}
        <View style={styles.quickSettings}>
          <TouchableOpacity style={styles.quickSettingItem} onPress={() => router.push("/settings" as any)}>
            <Ionicons name="settings" size={20} color={Colors.textSecondary} />
            <Text style={styles.quickSettingText}>{t.settings}</Text>
            <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickSettingItem} onPress={() => router.push("/subscription" as any)}>
            <Ionicons name="diamond" size={20} color={Colors.gold} />
            <Text style={styles.quickSettingText}>Premium features</Text>
            <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickSettingItem} onPress={() => router.push("/saved-lessons" as any)}>
            <Ionicons name="bookmark" size={20} color={Colors.gold} />
            <Text style={styles.quickSettingText}>Saved Lessons</Text>
            <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickSettingItem} onPress={() => router.push("/saved-collections" as any)}>
            <Ionicons name="folder" size={20} color={Colors.secondary} />
            <Text style={styles.quickSettingText}>Saved Items</Text>
            <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickSettingItem} onPress={() => router.push("/playlists" as any)}>
            <Ionicons name="musical-notes" size={20} color={Colors.glow} />
            <Text style={styles.quickSettingText}>Music Library</Text>
            <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickSettingItem} onPress={() => router.push("/study-groups" as any)}>
            <Ionicons name="people" size={20} color={Colors.textSecondary} />
            <Text style={styles.quickSettingText}>Groups</Text>
            <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickSettingItem} onPress={() => router.push("/tab-reorder" as any)}>
            <Ionicons name="swap-horizontal" size={20} color="#00AAFF" />
            <Text style={styles.quickSettingText}>Customize Tab Bar</Text>
            <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
          </TouchableOpacity>
        </View>

        <View style={{ height: 120 }} />
            </ScrollView>
    </SafeAreaView>
    </ScreenErrorBoundary>
  );
}
// ─── Styles ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  headerTitle: {
    fontSize: FontSize.xxl,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  headerRight: {
    flexDirection: "row",
    gap: 10,
  },
  headerBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surfaceCard,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.border,
  },

  // Cover Banner
  coverBanner: {
    height: 100,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.sm,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.surfaceElevated,
    borderWidth: 1,
    borderColor: Colors.glowBorder,
    overflow: "hidden",
    position: "relative",
    justifyContent: "center",
    alignItems: "center",
  },
  coverGradient: {
    alignItems: "center",
  },
  coverText: {
    fontSize: 20,
    fontWeight: "900",
    color: Colors.secondary,
    letterSpacing: 6,
    opacity: 0.6,
  },
  coverSubtext: {
    fontSize: 10,
    fontWeight: "700",
    color: Colors.gold,
    letterSpacing: 4,
    opacity: 0.5,
  },
  coverEditBtn: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(0,0,0,0.6)",
    alignItems: "center",
    justifyContent: "center",
  },

  // Profile Section
  profileSection: {
    paddingHorizontal: Spacing.lg,
    marginTop: -30,
  },
  avatarWrapper: {
    position: "relative",
    alignSelf: "flex-start",
    marginBottom: Spacing.md,
  },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: Colors.surfaceCard,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: Colors.secondary,
    shadowColor: Colors.glow,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 14,
    elevation: 10,
  },
  openToWorkBadge: {
    position: "absolute",
    bottom: 0,
    left: 0,
    backgroundColor: Colors.success,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  openToWorkText: {
    fontSize: 7,
    fontWeight: "900",
    color: Colors.textDark,
    letterSpacing: 0.5,
  },
  levelBadge: {
    position: "absolute",
    top: -2,
    right: -2,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: Colors.gold,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  levelText: {
    fontSize: 10,
    fontWeight: "900",
    color: Colors.textDark,
  },

  // Name row
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
  },
  userName: {
    fontSize: FontSize.xl,
    fontWeight: "800",
    color: Colors.textPrimary,
  },
  verifiedBadge: {},
  pronouns: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  headline: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginBottom: Spacing.sm,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
  },
  metaText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  langBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: Colors.glowSubtle,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.glowBorder,
    alignSelf: "flex-start",
  },
  langBadgeFlag: {
    fontSize: 14,
  },
  langBadgeName: {
    fontSize: FontSize.xs,
    color: Colors.secondary,
    fontWeight: "600",
  },
  connectionsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: Spacing.md,
    gap: 6,
  },
  connectionsText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  connectionsNumber: {
    color: Colors.secondary,
    fontWeight: "700",
  },
  dotSep: {
    color: Colors.textMuted,
  },

  // Action buttons
  actionRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: Spacing.md,
  },
  openToBtn: {
    flex: 1,
    backgroundColor: Colors.secondary,
    paddingVertical: 10,
    borderRadius: BorderRadius.full,
    alignItems: "center",
  },
  openToBtnText: {
    fontSize: FontSize.sm,
    fontWeight: "700",
    color: Colors.textDark,
  },
  addSectionBtn: {
    flex: 1,
    backgroundColor: "transparent",
    paddingVertical: 10,
    borderRadius: BorderRadius.full,
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: Colors.secondary,
  },
  addSectionBtnText: {
    fontSize: FontSize.sm,
    fontWeight: "700",
    color: Colors.secondary,
  },
  moreBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surfaceCard,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.border,
  },

  // Open to work card
  openToWorkCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.greenGlow,
    borderWidth: 1,
    borderColor: Colors.greenBorder,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginTop: Spacing.md,
  },
  openToWorkCardContent: {
    flex: 1,
  },
  openToWorkCardTitle: {
    fontSize: FontSize.sm,
    fontWeight: "700",
    color: Colors.success,
  },
  openToWorkCardSub: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },

  // Social stats
  socialStats: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: Spacing.lg,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  socialStatItem: {
    alignItems: "center",
  },
  socialStatNumber: {
    fontSize: FontSize.lg,
    fontWeight: "800",
    color: Colors.textPrimary,
  },
  socialStatLabel: {
    fontSize: 10,
    color: Colors.textSecondary,
    marginTop: 2,
  },

  // Section cards
  sectionCard: {
    backgroundColor: Colors.surfaceCard,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.md,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.md,
  },
  sectionHeaderEditable: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  sectionActions: {
    flexDirection: "row",
    gap: 12,
  },
  privateTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  privateTagText: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
  },

  // Analytics
  analyticsGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  analyticsItem: {
    flex: 1,
    alignItems: "center",
    gap: 4,
  },
  analyticsNumber: {
    fontSize: FontSize.lg,
    fontWeight: "800",
    color: Colors.textPrimary,
  },
  analyticsLabel: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    textAlign: "center",
  },
  showAllBtn: {
    marginTop: Spacing.md,
    alignItems: "center",
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  showAllText: {
    fontSize: FontSize.sm,
    fontWeight: "600",
    color: Colors.secondary,
  },

  // About
  aboutText: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  seeMoreText: {
    fontSize: FontSize.sm,
    color: Colors.secondary,
    fontWeight: "600",
    marginTop: 4,
  },

  // Certifications
  certItem: {
    flexDirection: "row",
    gap: 12,
    paddingVertical: Spacing.md,
  },
  certDivider: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  certIcon: {
    width: 44,
    height: 44,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  certInfo: {
    flex: 1,
  },
  certTitle: {
    fontSize: FontSize.md,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  certIssuer: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  certDate: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    marginTop: 2,
  },
  showCredBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: Colors.glowSubtle,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.glowBorder,
    alignSelf: "flex-start",
  },
  showCredText: {
    fontSize: FontSize.xs,
    fontWeight: "600",
    color: Colors.secondary,
  },

  // Skills
  skillItem: {
    paddingVertical: Spacing.md,
  },
  skillHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  skillName: {
    fontSize: FontSize.md,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  skillLevel: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
  },
  skillBar: {
    height: 6,
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 3,
    overflow: "hidden",
  },
  skillFill: {
    height: "100%",
    backgroundColor: Colors.secondary,
    borderRadius: 3,
  },

  // Experience
  expItem: {
    flexDirection: "row",
    gap: 12,
    paddingVertical: Spacing.md,
  },
  expIcon: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: Colors.glowSubtle,
    alignItems: "center",
    justifyContent: "center",
  },
  expInfo: {
    flex: 1,
  },
  expRole: {
    fontSize: FontSize.md,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  expCompany: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  expPeriod: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    marginTop: 2,
  },
  expLocation: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    marginTop: 2,
  },

  // Recommendations
  recTabs: {
    flexDirection: "row",
    gap: 8,
    marginBottom: Spacing.md,
  },
  recTab: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surfaceElevated,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  recTabActive: {
    backgroundColor: Colors.secondary,
    borderColor: Colors.secondary,
  },
  recTabText: {
    fontSize: FontSize.sm,
    fontWeight: "600",
    color: Colors.textSecondary,
  },
  recTabTextActive: {
    color: Colors.textDark,
  },
  recItem: {
    flexDirection: "row",
    gap: 12,
    paddingVertical: Spacing.md,
  },
  recAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surfaceElevated,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  recContent: {
    flex: 1,
  },
  recName: {
    fontSize: FontSize.md,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  recTitle: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  recDate: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    marginTop: 2,
  },
  recText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginTop: 6,
  },

  // Content tabs + grid
  profileTabs: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    marginBottom: Spacing.md,
  },
  profileTab: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 12,
  },
  profileTabActive: {
    borderBottomWidth: 2,
    borderBottomColor: Colors.secondary,
  },
  postsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: GRID_GAP,
  },
  postTile: {
    width: TILE_SIZE,
    height: TILE_SIZE,
    position: "relative",
  },
  postPlaceholder: {
    flex: 1,
    backgroundColor: Colors.surfaceElevated,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 4,
  },
  locationTag: {
    position: "absolute",
    bottom: 4,
    left: 4,
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    backgroundColor: "rgba(0,0,0,0.7)",
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
  },
  locationText: {
    fontSize: 7,
    color: Colors.textPrimary,
    fontWeight: "600",
  },
  postBadge: {
    position: "absolute",
    top: 4,
    right: 4,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "rgba(0,0,0,0.6)",
    alignItems: "center",
    justifyContent: "center",
  },

  // Learning Progress
  learningStats: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  learnStatItem: {
    flex: 1,
    alignItems: "center",
  },
  learnStatNumber: {
    fontSize: FontSize.lg,
    fontWeight: "800",
    color: Colors.textPrimary,
  },
  learnStatLabel: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  learnStatDivider: {
    width: 1,
    height: 28,
    backgroundColor: Colors.border,
  },
  langCards: {
    gap: Spacing.sm,
  },
  langCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surfaceElevated,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: 12,
  },
  langCardFlag: {
    fontSize: 28,
  },
  langCardInfo: {
    flex: 1,
  },
  langCardName: {
    fontSize: FontSize.md,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  langCardLevel: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  langCardPercent: {
    backgroundColor: Colors.glowSubtle,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.glowBorder,
  },
  langCardPercentText: {
    fontSize: FontSize.sm,
    fontWeight: "700",
    color: Colors.secondary,
  },

  // Upgrade card
  trophiesCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surfaceCard,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.md,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.gold + "40",
    gap: 12,
  },
  trophiesIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.gold + "15",
    alignItems: "center",
    justifyContent: "center",
  },
  trophiesContent: {
    flex: 1,
  },
  trophiesTitle: {
    fontSize: FontSize.md,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  trophiesSub: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  trophiesBadgeCount: {
    alignItems: "center",
    marginRight: 4,
  },
  trophiesBadgeNumber: {
    fontSize: FontSize.lg,
    fontWeight: "800",
    color: Colors.gold,
  },
  trophiesBadgeLabel: {
    fontSize: FontSize.xs - 1,
    color: Colors.textMuted,
  },
  upgradeCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surfaceCard,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.md,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5,
    borderColor: Colors.goldBorder,
    gap: 12,
    shadowColor: Colors.gold,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  upgradeText: {
    flex: 1,
  },
  upgradeTitle: {
    fontSize: FontSize.md,
    fontWeight: "700",
    color: Colors.warning,
  },
  upgradeSubtitle: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },

  // Quick settings
  quickSettings: {
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.md,
    backgroundColor: Colors.surfaceCard,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: "hidden",
  },
  quickSettingItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md + 2,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  quickSettingText: {
    flex: 1,
    fontSize: FontSize.md,
    color: Colors.textPrimary,
  },
  badgeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 12,
    marginBottom: 12,
  },
  badgeItem: {
    alignItems: "center",
    padding: 12,
    borderRadius: BorderRadius.md,
    borderWidth: 2,
    backgroundColor: Colors.surfaceCard,
    minWidth: 72,
    flex: 1,
  },
  badgeIcon: {
    fontSize: 28,
    marginBottom: 4,
  },
  badgeName: {
    fontSize: FontSize.xs,
    fontWeight: "700",
  },
  badgeReq: {
    fontSize: 10,
    color: Colors.textMuted,
    marginTop: 2,
  },
  badgeProgressRow: {
    marginTop: 8,
    gap: 6,
  },
  badgeProgressBar: {
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.border,
    overflow: "hidden",
  },
  badgeProgressFill: {
    height: "100%",
    borderRadius: 3,
  },
  badgeProgressText: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    textAlign: "center",
  },
});
