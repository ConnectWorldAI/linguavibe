import React, { useState, useEffect, useRef, useCallback } from "react";
import { ScreenErrorBoundary } from "@/components/error-boundary";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  FlatList,
  Animated,
  Platform,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import * as Haptics from "expo-haptics";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Colors, Spacing, BorderRadius, FontSize } from "../../constants/Colors";
import { useAgent } from "@/lib/agent-context";
import { useDashboardGlow, getGlowColor } from "@/lib/dashboard-glow";
import { GlowIcon } from "@/components/glow-icon";
import { useNotificationBadges } from "@/lib/notification-badges";
import { useNotificationScheduler } from "@/lib/notification-scheduler";
import { getDueCount } from "@/lib/srs";
import { CulturalFeedWidget } from "@/components/cultural-feed-widget";
import { useI18n } from "@/lib/i18n";
import { LanguageRecommendation } from "@/components/language-recommendation";
import { BrandName, BrandLockup } from "@/components/brand-name";
import { DailyPlanWidget } from "@/components/daily-plan-widget";
import { DailyLessonStreakWidget } from "@/components/daily-lesson-streak-widget";
import { PronunciationWeakSpotsCard } from "@/components/pronunciation-weak-spots-card";
import { OnboardingWalkthrough } from "@/components/onboarding-walkthrough";
import { CoachMarksOverlay, hasSeenCoachMarks } from "@/components/coach-marks-overlay";
import { FavoritesSection } from "@/components/favorites-section";
import { toggleFavorite } from "@/lib/favorites-storage";
import { trackFeatureUsed } from "@/lib/analytics";
import { HomeTabSkeleton, hapticLoadComplete } from "@/components/skeleton-loader";
import { getAllTeachers, type Teacher } from "@/lib/teacher-registry";
import { Image as ExpoImage } from "expo-image";
import { getStudentName, getRelationship, getMoodContext } from "@/lib/teacher-memory";
import { DailyBriefingCard } from "@/components/daily-briefing-card";
import { QuickActionsWidget } from "@/components/quick-actions-widget";
import { RecentlyVisitedRow } from "@/components/recently-visited-row";
import { CreatorSpotlightCard } from "@/components/creator-spotlight-card";
import { XPProgressBar } from "@/components/xp-progress-bar";
import { WeeklyProgressCard } from "@/components/weekly-progress-card";
import { addRecentlyVisited } from "@/lib/recently-visited";
import { StreakCelebrationModal } from "@/components/streak-celebration-modal";
import { StreakFreezeShopModal } from "@/components/streak-freeze-shop-modal";
import { checkForNewBadge } from "@/lib/badge-celebration";
import { checkAndApplyStreakFreeze } from "@/lib/streak-freeze";
import { BadgeToast, type BadgeToastData } from "@/components/badge-toast";
import { checkAndUnlockAchievements, type UserStats } from "@/lib/achievements";
import { getOverallXP } from "@/lib/exercise-scoring";

const STREAK_KEY = "@connectworld_streak";
const LAST_VISIT_KEY = "@connectworld_last_visit";
const CHALLENGE_KEY = "@connectworld_daily_challenge";
const CHALLENGE_COMPLETED_KEY = "@connectworld_challenge_completed";
const HOME_LAYOUT_KEY = "@connectworld_home_layout";

interface HomeCardConfig {
  id: string;
  visible: boolean;
}

const DEFAULT_CARD_ORDER = [
  "streak", "usage", "progress", "daily-pulse", "daily-goals", "weekly-digest",
  "milestones", "daily-challenge", "cultural-feed", "featured", "continue-learning",
  "upcoming-classes", "ai-tip",
];

type DailyChallenge = {
  id: string;
  emoji: string;
  title: string;
  desc: string;
  icon: string;
  route: string;
  params?: Record<string, string>;
};

const DAILY_CHALLENGES: DailyChallenge[] = [
  {
    id: "pronunciation",
    emoji: "\uD83C\uDFA4",
    title: "Pronunciation Check",
    desc: 'Say "Buenos d\u00edas, \u00bfc\u00f3mo est\u00e1s?" and get scored',
    icon: "mic",
    route: "/practice-pronunciation",
    params: { phrase: "Buenos d\u00edas, \u00bfc\u00f3mo est\u00e1s?", translation: "Good morning, how are you?", language: "Spanish", flag: "\uD83C\uDDEA\uD83C\uDDF8" },
  },
  {
    id: "vocab",
    emoji: "\uD83D\uDCDA",
    title: "Vocabulary Sprint",
    desc: "Translate 5 words in under 30 seconds",
    icon: "flash",
    route: "/lessons",
  },
  {
    id: "listening",
    emoji: "\uD83C\uDFA7",
    title: "Listening Challenge",
    desc: "Listen to a clip and identify the correct translation",
    icon: "ear",
    route: "/lessons",
  },
  {
    id: "translation",
    emoji: "\uD83C\uDF0D",
    title: "Speed Translation",
    desc: "Translate a sentence from French to English in 10 seconds",
    icon: "language",
    route: "/(tabs)/translate",
  },
  {
    id: "conversation",
    emoji: "\uD83D\uDCAC",
    title: "Quick Conversation",
    desc: "Have a 1-minute chat with your AI teacher in Japanese",
    icon: "chatbubbles",
    route: "/(tabs)/teacher",
  },
  {
    id: "song",
    emoji: "\uD83C\uDFB5",
    title: "Song Lyric Match",
    desc: "Match translated lyrics to the original song lines",
    icon: "musical-notes",
    route: "/(tabs)/songs",
  },
  {
    id: "culture",
    emoji: "\uD83C\uDFAD",
    title: "Cultural Trivia",
    desc: "Answer 3 questions about Dominican culture",
    icon: "globe",
    route: "/lessons",
  },
];



const { width } = Dimensions.get("window");

// All features unified into EXPLORE_CATEGORIES below
// Legacy Phase 1 features (now merged into categories)
const PHASE1_FEATURES = [
  { id: "translate", icon: "language", title: "Translator", desc: "60+ languages • Real slang", color: Colors.secondary, route: "/(tabs)/translate" },
  { id: "songs", icon: "musical-notes", title: "Song Translation", desc: "Learn any song in seconds", color: Colors.gold, route: "/(tabs)/songs" },
  { id: "teachers", icon: "people", title: "AI Teachers", desc: "Voice calls • Cultural immersion", color: Colors.accent, route: "/(tabs)/teacher" },
  { id: "lessons", icon: "book", title: "Lessons", desc: "Grammar • Vocabulary • Quizzes", color: Colors.success, route: "/lessons" },
  { id: "url", icon: "globe", title: "URL Translator", desc: "YouTube • TikTok • Instagram", color: "#06B6D4", route: "/translation-hub" },
  { id: "watch", icon: "videocam", title: "Watch & Learn", desc: "AI-generated video clips", color: "#10B981", route: "/watch-learn" },
  { id: "studio", icon: "mic", title: "WavyEq Studio", desc: "Sing over translated songs", color: Colors.accent, route: "/studio" },
  { id: "classroom", icon: "school", title: "Virtual Classroom", desc: "Group classes • Live Q&A", color: "#8B5CF6", route: "/class-schedule" },
  { id: "homework", icon: "document-text", title: "Smart Practice", desc: "AI homework • Struggle detection", color: "#6366F1", route: "/smart-practice" },
  { id: "curriculum", icon: "list", title: "Curriculum Drills", desc: "Structured learning path", color: "#10B981", route: "/curriculum-drills" },
  { id: "cultural-calendar", icon: "calendar", title: "Cultural Calendar", desc: "Holidays • Traditions • Foods", color: "#F59E0B", route: "/cultural-calendar" },
  { id: "freshness-tags", icon: "pricetag", title: "Freshness Tags", desc: "Current • Trending • Classic • Outdated", color: "#8B5CF6", route: "/freshness-tags" },
  { id: "mouth", icon: "happy", title: "Mouth Placement", desc: "Perfect pronunciation visuals", color: "#F59E0B", route: "/mouth-placement" },
  { id: "convo-sim", icon: "chatbubble-ellipses", title: "Conversation Sim", desc: "Practice real scenarios", color: "#EC4899", route: "/conversation-sim" },
  { id: "live-feed", icon: "pulse", title: "Live Cultural Feed", desc: "Holiday alerts • Vocab prep", color: "#EF4444", route: "/live-cultural-feed" },
  { id: "trending-vocab", icon: "trending-up", title: "Trending Vocab", desc: "Social media • Music • News", color: "#F97316", route: "/trending-vocab" },
  { id: "city-explore", icon: "map", title: "City Exploration", desc: "Walk through real cities worldwide", color: "#06B6D4", route: "/city-exploration" },
  { id: "voice-rooms", icon: "mic-circle", title: "Voice Rooms", desc: "Live audio practice with others", color: "#8B5CF6", route: "/voice-rooms" },
  { id: "musical-lesson", icon: "musical-notes", title: "Musical Lessons", desc: "Learn through culture-specific songs", color: "#EC4899", route: "/musical-lesson" },
  { id: "level-test", icon: "speedometer", title: "Level Assessment", desc: "4-min CEFR test - Know your level", color: "#10B981", route: "/level-assessment" },
  { id: "vocab-cards", icon: "albums", title: "Vocab Cards", desc: "Swipe to learn - Spaced repetition", color: "#F59E0B", route: "/vocab-cards" },
  { id: "scenarios", icon: "people-circle", title: "AI Scenarios", desc: "Practice with AI personas", color: "#A855F7", route: "/conversation-scenarios" },
  { id: "phrasebook", icon: "chatbox-ellipses", title: "Phrasebook", desc: "Situational phrases • Audio", color: "#EC4899", route: "/conversation-phrasebook" },
  { id: "flashcard-srs", icon: "albums", title: "Flashcard SRS", desc: "Spaced repetition • Leitner box", color: "#F59E0B", route: "/flashcard-srs" },
  { id: "pronunciation-score", icon: "mic", title: "Pronunciation Score", desc: "AI rates your accent 0-100", color: "#10B981", route: "/pronunciation-scoring" },
  { id: "daily-streak", icon: "flame", title: "Daily Streak", desc: "XP • Achievements • Goals", color: "#F97316", route: "/daily-streak" },
  { id: "journal", icon: "journal", title: "Language Journal", desc: "Write daily • AI corrections", color: "#8B5CF6", route: "/multi-language-journal" },
  { id: "quick-translate", icon: "flash", title: "Quick Translate", desc: "Instant widget • No full app", color: Colors.secondary, route: "/translation-widget" },
];

// Phase 2 features (Communication Layer)
const PHASE2_FEATURES = [
  { id: "messages", icon: "chatbubbles", title: "Messaging", desc: "WhatsApp-style • Auto-translate", color: Colors.secondary, route: "/(tabs)/messages" },
  { id: "calls", icon: "call", title: "VoIP Calling", desc: "Free international calls", color: Colors.success, route: "/(tabs)/calls" },
  { id: "penpal", icon: "mail", title: "AI Pen Pal", desc: "Daily messages in target language", color: "#F472B6", route: "/pen-pal" },
  { id: "exchange", icon: "swap-horizontal", title: "Language Exchange", desc: "Match with native speakers", color: "#F59E0B", route: "/discover-people" },
  { id: "grammar", icon: "create", title: "Grammar Assist", desc: "Real-time corrections in chat", color: "#06B6D4", route: "/ai-chat" },
  { id: "push", icon: "notifications", title: "Smart Notifications", desc: "Teacher voice memos • Streaks", color: Colors.gold, route: "/notification-settings" },
  { id: "contacts", icon: "person-add", title: "Contact Sharing", desc: "Share profiles • Add friends", color: "#8B5CF6", route: "/contact-sharing" },
  { id: "group-class", icon: "people-circle", title: "Group Classes", desc: "Live sessions • Study groups", color: "#10B981", route: "/group-class" },
  { id: "surprise", icon: "gift", title: "Surprise Call", desc: "Random practice with AI", color: Colors.gold, route: "/surprise-call" },
];

// Unified feature categories — all features in one system
const EXPLORE_CATEGORIES = [
  {
    id: "learning",
    title: "Learning & Lessons",
    icon: "school-outline",
    items: [
      { id: "convo-sim", icon: "chatbubble-ellipses-outline", title: "Conversation Sim", color: "#EC4899", route: "/conversation-sim" },
      { id: "voice-conversation", icon: "mic-circle-outline", title: "Voice Practice", color: "#8B5CF6", route: "/voice-conversation" },
      { id: "lessons", icon: "book-outline", title: "Lessons", color: "#10B981", route: "/lessons" },
      { id: "curriculum", icon: "list-outline", title: "Curriculum Drills", color: "#10B981", route: "/curriculum-drills" },
      { id: "classroom", icon: "school-outline", title: "Virtual Classroom", color: "#8B5CF6", route: "/class-schedule" },
      { id: "homework", icon: "document-text-outline", title: "Smart Practice", color: "#6366F1", route: "/smart-practice" },
      { id: "scenarios", icon: "people-circle-outline", title: "AI Scenarios", color: "#A855F7", route: "/conversation-scenarios" },
      { id: "phrasebook", icon: "chatbox-ellipses-outline", title: "Phrasebook", color: "#EC4899", route: "/conversation-phrasebook" },
      { id: "level-test", icon: "speedometer-outline", title: "Level Assessment", color: "#10B981", route: "/level-assessment" },
      { id: "watch", icon: "videocam-outline", title: "Watch & Learn", color: "#10B981", route: "/watch-learn" },
      { id: "musical-lesson", icon: "musical-notes-outline", title: "Musical Lessons", color: "#EC4899", route: "/musical-lesson" },
    ],
  },
  {
    id: "progress",
    title: "Progress & Goals",
    icon: "bar-chart-outline",
    items: [
      { id: "report-card", icon: "bar-chart-outline", title: "Report Card", color: "#10B981", route: "/progress-report-card" },
      { id: "weekly-goals", icon: "flag-outline", title: "Weekly Goals", color: "#F59E0B", route: "/weekly-goals" },
      { id: "streak-shield", icon: "shield-outline", title: "Streak Shield", color: "#3B82F6", route: "/streak-shield" },
      { id: "past-reports", icon: "document-text-outline", title: "Past Reports", color: "#6366F1", route: "/view-past-reports" },
      { id: "compare-weeks", icon: "git-compare-outline", title: "Compare Weeks", color: "#06B6D4", route: "/compare-weeks" },
      { id: "export-report", icon: "download-outline", title: "Export Report", color: "#6366F1", route: "/export-report" },
      { id: "milestones", icon: "ribbon-outline", title: "Milestones", color: Colors.success, route: "/milestones" },
      { id: "knowledge-map", icon: "git-network-outline", title: "Knowledge Map", color: "#10B981", route: "/knowledge-gap-map" },
      { id: "daily-streak", icon: "flame-outline", title: "Daily Streak", color: "#F97316", route: "/daily-streak" },
      { id: "learning-style", icon: "eye-outline", title: "Learning Style", color: "#8B5CF6", route: "/learning-style" },
    ],
  },
  {
    id: "practice",
    title: "Practice & Drills",
    icon: "mic-outline",
    items: [
      { id: "phoneme", icon: "mic-outline", title: "Phoneme Drill", color: "#06B6D4", route: "/phoneme-pronunciation" },
      { id: "pronunciation-timeline", icon: "analytics-outline", title: "Pronunciation Timeline", color: "#8B5CF6", route: "/pronunciation-timeline" },
      { id: "pronunciation-score", icon: "mic-outline", title: "Pronunciation Score", color: "#10B981", route: "/pronunciation-scoring" },
      { id: "mouth", icon: "happy-outline", title: "Mouth Placement", color: "#F59E0B", route: "/mouth-placement" },
      { id: "vocab-battle", icon: "flash-outline", title: "Vocab Battle", color: Colors.error, route: "/vocabulary-battle" },
      { id: "quiz-center", icon: "help-circle-outline", title: "Quiz Center", color: "#06B6D4", route: "/quiz-center" },
      { id: "vocab-cards", icon: "albums-outline", title: "Vocab Cards", color: "#F59E0B", route: "/vocab-cards" },
      { id: "flashcard-srs", icon: "albums-outline", title: "Flashcard SRS", color: "#F59E0B", route: "/flashcard-srs" },
      { id: "decode", icon: "key-outline", title: "Decode Mode", color: Colors.success, route: "/decode-mode" },
    ],
  },
  {
    id: "communication",
    title: "Communication",
    icon: "chatbubbles-outline",
    items: [
      { id: "messages", icon: "chatbubbles-outline", title: "Messaging", color: Colors.secondary, route: "/(tabs)/messages" },
      { id: "calls", icon: "call-outline", title: "VoIP Calling", color: Colors.success, route: "/(tabs)/calls" },
      { id: "penpal", icon: "mail-outline", title: "AI Pen Pal", color: "#F472B6", route: "/pen-pal" },
      { id: "exchange", icon: "swap-horizontal-outline", title: "Language Exchange", color: "#F59E0B", route: "/discover-people" },
      { id: "grammar", icon: "create-outline", title: "Grammar Assist", color: "#06B6D4", route: "/ai-chat" },
      { id: "group-class", icon: "people-circle-outline", title: "Group Classes", color: "#10B981", route: "/group-class" },
      { id: "surprise", icon: "gift-outline", title: "Surprise Call", color: Colors.gold, route: "/surprise-call" },
      { id: "journal", icon: "journal-outline", title: "Language Journal", color: "#8B5CF6", route: "/multi-language-journal" },
    ],
  },
  {
    id: "entertainment",
    title: "Entertainment",
    icon: "musical-note-outline",
    items: [
      { id: "studio", icon: "mic-outline", title: "WavyEq Studio", color: Colors.accent, route: "/studio" },
      { id: "karaoke", icon: "mic-outline", title: "Karaoke", color: Colors.gold, route: "/sing-along" },
      { id: "duet", icon: "musical-note-outline", title: "Duet Mode", color: "#A855F7", route: "/duet-mode" },
      { id: "podcast", icon: "headset-outline", title: "Podcasts", color: "#8B5CF6", route: "/watch-learn" },
      { id: "radio", icon: "radio-outline", title: "AI Radio", color: Colors.secondary, route: "/watch-learn" },
      { id: "audiobook", icon: "book-outline", title: "Audiobooks", color: Colors.gold, route: "/watch-learn" },
      { id: "voicefilter", icon: "volume-high-outline", title: "Voice Filters", color: "#06B6D4", route: "/voice-filter" },
      { id: "share-lyrics", icon: "share-outline", title: "Share Lyrics", color: "#EC4899", route: "/share-lyrics-stories" },
      { id: "creator-feed", icon: "videocam-outline", title: "Creator Feed", color: "#E91E63", route: "/creator-feed" },
    ],
  },
  {
    id: "social",
    title: "Social & Community",
    icon: "people-outline",
    items: [
      { id: "leaderboard", icon: "trophy-outline", title: "Leaderboard", color: Colors.gold, route: "/leaderboard" },
      { id: "friends-activity", icon: "people-outline", title: "Activity Feed", color: "#E91E63", route: "/friends-activity" },
      { id: "friends-manage", icon: "person-add-outline", title: "My Friends", color: "#8B5CF6", route: "/friends" },
      { id: "study-groups", icon: "people-circle-outline", title: "Study Groups", color: "#3B82F6", route: "/study-groups" },
      { id: "language-battles", icon: "flash-outline", title: "Language Battles", color: "#EF4444", route: "/language-battles" },
      { id: "friend-challenges", icon: "trophy-outline", title: "Challenges", color: "#F59E0B", route: "/friend-challenges" },
      { id: "dating", icon: "heart-outline", title: "Language Date", color: "#EF4444", route: "/discover-people" },
      { id: "social-hub", icon: "share-social-outline", title: "Social Hub", color: "#EC4899", route: "/social-hub" },
      { id: "referral", icon: "gift-outline", title: "Refer & Earn", color: "#F472B6", route: "/referral" },
      { id: "influencers", icon: "people-circle-outline", title: "Influencers", color: "#E91E63", route: "/influencer-discover" },
    ],
  },
  {
    id: "explore-world",
    title: "Explore & Travel",
    icon: "globe-outline",
    items: [
      { id: "world", icon: "globe-outline", title: "Virtual World", color: "#8B5CF6", route: "/vacation-mode" },
      { id: "travel", icon: "airplane-outline", title: "Travel Mode", color: "#10B981", route: "/travel-phrasebook" },
      { id: "passport", icon: "map-outline", title: "Passport", color: Colors.gold, route: "/passport-stamps" },
      { id: "city-explore", icon: "map-outline", title: "City Exploration", color: "#06B6D4", route: "/city-exploration" },
      { id: "dominican-slang", icon: "book-outline", title: "🇩🇴 Slang Dict", color: "#EF4444", route: "/dominican-slang-dictionary" },
      { id: "phrase-boards", icon: "folder-outline", title: "Phrase Boards", color: "#F59E0B", route: "/phrase-collections" },
      { id: "street-cred", icon: "star-outline", title: "Street Cred", color: "#10B981", route: "/street-cred" },
      { id: "cultural-calendar", icon: "calendar-outline", title: "Cultural Calendar", color: "#F59E0B", route: "/cultural-calendar" },
      { id: "live-feed", icon: "pulse-outline", title: "Live Cultural Feed", color: "#EF4444", route: "/live-cultural-feed" },
      { id: "trending-vocab", icon: "trending-up-outline", title: "Trending Vocab", color: "#F97316", route: "/trending-vocab" },
      { id: "freshness-tags", icon: "pricetag-outline", title: "Freshness Tags", color: "#8B5CF6", route: "/freshness-tags" },
    ],
  },
  {
    id: "games",
    title: "Games & Fun",
    icon: "game-controller-outline",
    items: [
      { id: "battle", icon: "game-controller-outline", title: "Battle Mode", color: Colors.accent, route: "/battle-mode" },
      { id: "timecapsule", icon: "time-outline", title: "Time Capsule", color: "#F472B6", route: "/time-capsule" },
      { id: "kids", icon: "happy-outline", title: "Kids Mode", color: "#FBBF24", route: "/family-plan" },
      { id: "badges", icon: "shield-checkmark-outline", title: "Badges", color: "#9B59B6", route: "/badges" },
      { id: "voice-rooms", icon: "mic-circle-outline", title: "Voice Rooms", color: "#8B5CF6", route: "/voice-rooms" },
    ],
  },
  {
    id: "tools",
    title: "Tools & Settings",
    icon: "settings-outline",
    items: [
      { id: "quick-translate", icon: "flash-outline", title: "Quick Translate", color: Colors.secondary, route: "/translation-widget" },
      { id: "offline-content", icon: "cloud-download-outline", title: "Offline Mode", color: "#6366F1", route: "/offline-content" },
      { id: "subscription", icon: "diamond-outline", title: "Premium", color: "#F59E0B", route: "/subscription" },
      { id: "feedback", icon: "analytics-outline", title: "Call Reports", color: "#10B981", route: "/feedback-report" },
      { id: "push", icon: "notifications-outline", title: "Smart Notifications", color: Colors.gold, route: "/notification-settings" },
      { id: "contacts", icon: "person-add-outline", title: "Contact Sharing", color: "#8B5CF6", route: "/contact-sharing" },
      { id: "focus-mode", icon: "eye-outline", title: "Focus Mode", color: "#06B6D4", route: "/focus-mode" },
    ],
  },
];

// Flat list for backward compat
const EXPLORE_FEATURES = EXPLORE_CATEGORIES.flatMap((cat) => cat.items);

export default function HomeScreen() {
  const { t } = useI18n();
  const { badges, getBellColor, clearBadge } = useNotificationBadges();
  const notifCount = badges.notifications;
  const { isDNDActive } = useNotificationScheduler();
  const { agentState, showAgent, hideAgent, toggleExpand, wakeAgent } = useAgent();
  const { glowState, totalPending } = useDashboardGlow();

  // Loading state for skeleton
  const [isLoading, setIsLoading] = useState(true);
  // Welcome-back prompt for first home visit after onboarding
  const [showWelcome, setShowWelcome] = useState(false);
  // Schedule setup prompt (shows after day 2)
  const [showSchedulePrompt, setShowSchedulePrompt] = useState(false);
  // Explore section expand/collapse
  const [showAllExplore, setShowAllExplore] = useState(false);
  // Brand-new user detection (no lessons completed, no streak, no placement test)
  const [isNewUser, setIsNewUser] = useState(false);
  const [showCoachMarks, setShowCoachMarks] = useState(false);
  const [favRefresh, setFavRefresh] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [recentRefresh, setRecentRefresh] = useState(0);
  const [celebrationVisible, setCelebrationVisible] = useState(false);
  const [celebrationStreak, setCelebrationStreak] = useState(0);
  const [freezeShopVisible, setFreezeShopVisible] = useState(false);
  const [badgeToast, setBadgeToast] = useState<BadgeToastData | null>(null);
  // Active teacher for home card
  const [homeTeacher, setHomeTeacher] = useState<Teacher | null>(null);
  // Methodology recommendation banner (shows once after onboarding)
  const [showMethodologyBanner, setShowMethodologyBanner] = useState(false);
  useEffect(() => {
    const checkMethodologyFlag = async () => {
      const flag = await AsyncStorage.getItem("@show_methodology_recommendation");
      if (flag === "true") setShowMethodologyBanner(true);
    };
    checkMethodologyFlag();
  }, []);
  const dismissMethodologyBanner = useCallback(async () => {
    setShowMethodologyBanner(false);
    await AsyncStorage.removeItem("@show_methodology_recommendation");
  }, []);

  // Personalized teacher greeting
  const [personalGreeting, setPersonalGreeting] = useState<string>("");
  useEffect(() => {
    const loadHomeTeacher = async () => {
      const allTeachers = getAllTeachers();
      // choose-teacher saves an array of selected teacher IDs under 'selected_teachers'
      const savedTeachersJson = await AsyncStorage.getItem("selected_teachers");
      if (savedTeachersJson) {
        try {
          const ids: string[] = JSON.parse(savedTeachersJson);
          if (ids.length > 0) {
            const found = allTeachers.find(t => t.id === ids[0]);
            if (found) { setHomeTeacher(found); return; }
          }
        } catch {}
      }
      // Fallback: try dialect-matched teacher
      const dialect = await AsyncStorage.getItem("@target_dialect");
      if (dialect) {
        const matched = allTeachers.find(t => t.dialects.some(d => d.toLowerCase().includes(dialect.toLowerCase())));
        if (matched) { setHomeTeacher(matched); return; }
      }
      // Final fallback: first teacher
      if (allTeachers.length > 0) setHomeTeacher(allTeachers[0]);
    };
    loadHomeTeacher();
  }, []);
  // Load personalized teacher greeting
  useEffect(() => {
    const loadPersonalGreeting = async () => {
      const name = await getStudentName();
      const relationship = await getRelationship();
      const mood = await getMoodContext();
      const hour = new Date().getHours();
      const greetings: string[] = [];
      // Time-based personal greeting using student name
      if (hour < 6) greetings.push(`Up early, ${name}? I admire the dedication.`);
      else if (hour < 9) greetings.push(`Good morning, ${name}! Fresh brain = best learning.`);
      else if (hour < 12) greetings.push(`Hey ${name}! Ready to pick up where we left off?`);
      else if (hour < 14) greetings.push(`Afternoon session, ${name}? Let's go.`);
      else if (hour < 18) greetings.push(`Hey ${name}! Good time for a quick practice.`);
      else if (hour < 21) greetings.push(`Evening mode, ${name}. Let's make it count.`);
      else greetings.push(`Late night learner! Keep it light, ${name}.`);
      // Add relationship-aware message
      if ((relationship as any).sessionsCompleted > 20) {
        greetings.push("We've been at this a while — I can see real growth.");
      } else if ((relationship as any).sessionsCompleted > 5) {
        greetings.push("You're building great habits. Keep it up.");
      }
      // Mood-aware addition
      if (mood.currentMood === 'tired') greetings.push("Let's keep today light and fun.");
      else if (mood.currentMood === 'energized') greetings.push("You seem ready for a challenge!");
      setPersonalGreeting(greetings.join(" "));
    };
    loadPersonalGreeting();
  }, []);
  useEffect(() => {
    const checkFirstVisit = async () => {
      const seen = await AsyncStorage.getItem("@home_welcome_shown");
      if (!seen) {
        setShowWelcome(true);
        await AsyncStorage.setItem("@home_welcome_shown", "true");
      }
    };
    checkFirstVisit();
    // Check if schedule prompt should show (after day 2, not dismissed)
    const checkSchedulePrompt = async () => {
      const dismissed = await AsyncStorage.getItem("@schedule_prompt_dismissed");
      const scheduleSet = await AsyncStorage.getItem("@learning_schedule");
      if (dismissed || scheduleSet) return;
      const onboardingDate = await AsyncStorage.getItem("@onboarding_date");
      if (!onboardingDate) {
        // Set onboarding date if not set
        await AsyncStorage.setItem("@onboarding_date", new Date().toISOString());
        return;
      }
      const daysSinceOnboarding = Math.floor((Date.now() - new Date(onboardingDate).getTime()) / (1000 * 60 * 60 * 24));
      if (daysSinceOnboarding >= 2) {
        setShowSchedulePrompt(true);
      }
    };
    checkSchedulePrompt();
  }, []);

  // Home layout customization
  const [cardOrder, setCardOrder] = useState<string[]>(DEFAULT_CARD_ORDER);
  const [hiddenCards, setHiddenCards] = useState<Set<string>>(new Set());

  useFocusEffect(
    useCallback(() => {
      const loadLayout = async () => {
        try {
          const stored = await AsyncStorage.getItem(HOME_LAYOUT_KEY);
          if (stored) {
            const parsed: HomeCardConfig[] = JSON.parse(stored);
            const order = parsed.map(c => c.id);
            const hidden = new Set(parsed.filter(c => !c.visible).map(c => c.id));
            setCardOrder(order);
            setHiddenCards(hidden);
          }
        } catch {}
      };
      loadLayout();
      getDueCount().then((count) => setSrsDueCount(count));
    }, [])
  );

    const isCardVisible = (id: string) => !hiddenCards.has(id);
  // CEFR Level
  const [cefrLevel, setCefrLevel] = useState<string | null>(null);
  const [cefrTestDate, setCefrTestDate] = useState<string | null>(null);
  const [cefrHistory, setCefrHistory] = useState<Array<{ level: string; date: string; score: number }>>([]);
  useEffect(() => {
    const loadCefr = async () => {
      const level = await AsyncStorage.getItem("@cefr_level");
      const date = await AsyncStorage.getItem("@placement_test_date");
      const historyRaw = await AsyncStorage.getItem("@cefr_history");
      if (level) setCefrLevel(level);
      if (date) setCefrTestDate(date);
      if (historyRaw) setCefrHistory(JSON.parse(historyRaw));
    };
    loadCefr();
  }, []);
  // New user detection
  useEffect(() => {
    const detectNewUser = async () => {
      try {
        const [lessonsCompleted, streakCount, placementDate, sessionCount] = await Promise.all([
          AsyncStorage.getItem("@lessons_completed"),
          AsyncStorage.getItem(STREAK_KEY),
          AsyncStorage.getItem("@placement_test_date"),
          AsyncStorage.getItem("@session_count"),
        ]);
        const lessons = lessonsCompleted ? parseInt(lessonsCompleted, 10) : 0;
        const sessions = sessionCount ? parseInt(sessionCount, 10) : 0;
        const streakVal = streakCount ? parseInt(streakCount, 10) : 0;
        // User is "new" if they haven't completed any lessons, have no streak, and no sessions
        if (lessons === 0 && sessions === 0 && streakVal <= 1 && !placementDate) {
          setIsNewUser(true);
          // Show coach marks for new users who haven't seen them
          const seen = await hasSeenCoachMarks();
          if (!seen) {
            setTimeout(() => setShowCoachMarks(true), 800);
          }
        }
      } catch {}
    };
    detectNewUser();
  }, []);
  // Streak counter
  const [streak, setStreak] = useState(0);
  const streakFireAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const checkStreak = async () => {
      try {
        const lastVisit = await AsyncStorage.getItem(LAST_VISIT_KEY);
        const savedStreak = await AsyncStorage.getItem(STREAK_KEY);
        const today = new Date().toDateString();
        const currentStreak = savedStreak ? parseInt(savedStreak, 10) : 0;

        if (lastVisit === today) {
          setStreak(currentStreak);
        } else if (lastVisit) {
          const lastDate = new Date(lastVisit);
          const diff = Math.floor((Date.now() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
          if (diff === 1) {
            const newStreak = currentStreak + 1;
            setStreak(newStreak);
            await AsyncStorage.setItem(STREAK_KEY, String(newStreak));
          } else {
            // Missed days — try to apply streak freeze
            const freezeResult = await checkAndApplyStreakFreeze(currentStreak, diff - 1);
            setStreak(freezeResult.newStreak);
            await AsyncStorage.setItem(STREAK_KEY, String(freezeResult.newStreak));
          }
        } else {
          setStreak(1);
          await AsyncStorage.setItem(STREAK_KEY, "1");
        }
        await AsyncStorage.setItem(LAST_VISIT_KEY, today);
      } catch (e) {
        setStreak(1);
      }
    };
    checkStreak();

    // Fire animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(streakFireAnim, { toValue: 1.15, duration: 600, useNativeDriver: true }),
        Animated.timing(streakFireAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  // Check for new streak badge celebration
  useEffect(() => {
    const checkCelebration = async () => {
      try {
        const result = await checkForNewBadge();
        if (result.badge) {
          setCelebrationStreak(result.streakWeeks * 7); // Convert weeks to approx days for display
          setCelebrationVisible(true);
        }
      } catch {}
    };
    checkCelebration();
  }, []);

  // Check for newly unlocked achievements (badge toast)
  useEffect(() => {
    const checkAchievements = async () => {
      try {
        const xpData = await getOverallXP();
        const stats: UserStats = {
          totalXP: xpData.totalXP,
          currentStreak: streak,
          totalSessions: xpData.totalSessionsCompleted,
          totalExercises: xpData.totalExercisesCompleted,
          creatorsAttempted: Object.keys(xpData.creatorScores || {}).length,
          focusSessions: 0, // loaded separately if needed
          pinnedFeatures: 0, // loaded separately if needed
        };
        const newBadgeIds = await checkAndUnlockAchievements(stats);
        if (newBadgeIds.length > 0) {
          // Show toast for the first newly unlocked badge
          setBadgeToast({ badgeId: newBadgeIds[0] });
        }
      } catch {}
    };
    // Delay slightly so streak is loaded first
    const timer = setTimeout(checkAchievements, 1500);
    return () => clearTimeout(timer);
  }, [streak]);

  // Daily Challenge rotation
  const [currentChallenge, setCurrentChallenge] = useState<DailyChallenge>(DAILY_CHALLENGES[0]);
  const [challengeCompleted, setChallengeCompleted] = useState(false);

  useEffect(() => {
    const loadChallenge = async () => {
      try {
        const today = new Date().toDateString();
        const stored = await AsyncStorage.getItem(CHALLENGE_KEY);
        const completedData = await AsyncStorage.getItem(CHALLENGE_COMPLETED_KEY);

        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed.date === today) {
            // Same day — use stored challenge
            const found = DAILY_CHALLENGES.find(c => c.id === parsed.challengeId);
            if (found) setCurrentChallenge(found);
          } else {
            // New day — rotate to next challenge
            const prevIdx = DAILY_CHALLENGES.findIndex(c => c.id === parsed.challengeId);
            const nextIdx = (prevIdx + 1) % DAILY_CHALLENGES.length;
            setCurrentChallenge(DAILY_CHALLENGES[nextIdx]);
            await AsyncStorage.setItem(CHALLENGE_KEY, JSON.stringify({ date: today, challengeId: DAILY_CHALLENGES[nextIdx].id }));
            await AsyncStorage.removeItem(CHALLENGE_COMPLETED_KEY);
          }
        } else {
          // First time — pick based on day of year
          const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24));
          const idx = dayOfYear % DAILY_CHALLENGES.length;
          setCurrentChallenge(DAILY_CHALLENGES[idx]);
          await AsyncStorage.setItem(CHALLENGE_KEY, JSON.stringify({ date: today, challengeId: DAILY_CHALLENGES[idx].id }));
        }

        // Check completion
        if (completedData) {
          const completedParsed = JSON.parse(completedData);
          if (completedParsed.date === today) {
            setChallengeCompleted(true);
          }
        }
      } catch {}
    };
    loadChallenge();
  }, []);

  const handleChallengeStart = async () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (currentChallenge.params) {
      router.push({ pathname: currentChallenge.route as any, params: currentChallenge.params });
    } else {
      router.push(currentChallenge.route as any);
    }
    // Mark as completed
    const today = new Date().toDateString();
    setChallengeCompleted(true);
    await AsyncStorage.setItem(CHALLENGE_COMPLETED_KEY, JSON.stringify({ date: today, challengeId: currentChallenge.id }));
  };

  // ─── Daily Phoneme Challenge ─────────────────────────────────────────────
  const [phonemeChallenge, setPhonemeChallenge] = useState<{
    phonemeId: string; phonemeName: string; phonemeSymbol: string;
    language: string; examples: string; tip: string; srsCardId: string;
  } | null>(null);
  const [phonemeChallengeDismissed, setPhonemeChallengeDismissed] = useState(false);

  useEffect(() => {
    const loadPhonemeChallenge = async () => {
      try {
        const today = new Date().toDateString();
        const dismissedData = await AsyncStorage.getItem("@phoneme_challenge_dismissed");
        if (dismissedData) {
          const parsed = JSON.parse(dismissedData);
          if (parsed.date === today) { setPhonemeChallengeDismissed(true); return; }
        }
        const { getWeakestDuePhoneme } = require("@/lib/srs-phoneme");
        const weakest = await getWeakestDuePhoneme();
        if (weakest) setPhonemeChallenge(weakest);
      } catch {}
    };
    loadPhonemeChallenge();
  }, []);

  const handlePhonemeChallenge = () => {
    if (!phonemeChallenge) return;
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push({
      pathname: "/pronunciation-drill" as any,
      params: {
        phonemeId: phonemeChallenge.phonemeId,
        phonemeName: phonemeChallenge.phonemeName,
        phonemeSymbol: phonemeChallenge.phonemeSymbol,
        language: phonemeChallenge.language,
        examples: phonemeChallenge.examples,
        tip: phonemeChallenge.tip,
        srsCardId: phonemeChallenge.srsCardId,
      },
    });
    // Dismiss for today
    const today = new Date().toDateString();
    setPhonemeChallengeDismissed(true);
    AsyncStorage.setItem("@phoneme_challenge_dismissed", JSON.stringify({ date: today }));
  };

  const dismissPhonemeChallenge = () => {
    setPhonemeChallengeDismissed(true);
    const today = new Date().toDateString();
    AsyncStorage.setItem("@phoneme_challenge_dismissed", JSON.stringify({ date: today }));
  };

  // Milestones progress indicator
  const [milestoneProgress, setMilestoneProgress] = useState({ completed: 0, total: 8, creditsEarned: 0 });

  useEffect(() => {
    const loadMilestoneProgress = async () => {
      try {
        const { getDailyMilestoneState, DAILY_MILESTONES } = require("@/lib/streak-bonus");
        const state = await getDailyMilestoneState();
        const creditsEarned = DAILY_MILESTONES
          .filter((m: any) => state.completedIds.includes(m.id))
          .reduce((sum: number, m: any) => sum + m.credits, 0);
        setMilestoneProgress({
          completed: state.completedIds.length,
          total: DAILY_MILESTONES.length,
          creditsEarned,
        });
      } catch {}
    };
    loadMilestoneProgress();
  }, []);

  // Floating Quick Actions
  const [fabOpen, setFabOpen] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState(3);
  const [missedCalls, setMissedCalls] = useState(2);
  const [newSongs, setNewSongs] = useState(1);
  const [srsDueCount, setSrsDueCount] = useState(0);
  const [videoHeroCollapsed, setVideoHeroCollapsed] = useState(false);
  const fabAnim = useRef(new Animated.Value(0)).current;

  // Load notification counts from storage
  useEffect(() => {
    AsyncStorage.getItem("@unread_messages_count").then((val) => {
      if (val) setUnreadMessages(parseInt(val, 10) || 0);
    });
    AsyncStorage.getItem("@missed_calls_count").then((val) => {
      if (val) setMissedCalls(parseInt(val, 10) || 0);
    });
    AsyncStorage.getItem("@new_songs_count").then((val) => {
      if (val) setNewSongs(parseInt(val, 10) || 0);
    });
    getDueCount().then((count) => setSrsDueCount(count));
  }, []);

  const totalUnread = unreadMessages + missedCalls + newSongs;

  const toggleFab = () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const toValue = fabOpen ? 0 : 1;
    Animated.spring(fabAnim, { toValue, useNativeDriver: true, tension: 80, friction: 10 }).start();
    setFabOpen(!fabOpen);
  };

  const fabActions = [
    { icon: "chatbubbles" as const, label: "Messages", color: "#00AAFF", route: "/(tabs)/messages", badge: unreadMessages },
    { icon: "call" as const, label: "Call", color: Colors.success, route: "/(tabs)/calls", badge: missedCalls },
    { icon: "musical-notes" as const, label: "Songs", color: "#FFB800", route: "/(tabs)/songs", badge: newSongs },
    { icon: "mic" as const, label: "Record", color: Colors.accent, route: "/studio", badge: 0 },
    { icon: "language" as const, label: "Translate", color: Colors.secondary, route: "/(tabs)/translate", badge: 0 },
  ];

  const toggleAgentVisibility = () => {
    // Never hide the agent — always show and expand/wake it
    if (!agentState.visible) {
      showAgent();
    }
    if (!agentState.expanded) {
      toggleExpand();
    }
    if (!agentState.isAwake) {
      wakeAgent();
    }
  };

  const openCloudWave = () => {
    // Always show the agent and expand the panel when tapped
    if (!agentState.visible) {
      showAgent();
    }
    // Small delay to ensure visible state is set before expanding
    setTimeout(() => {
      if (!agentState.expanded) {
        toggleExpand();
      }
      if (!agentState.isAwake) {
        wakeAgent();
      }
    }, 100);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleNotifPress = () => {
    router.push("/notification-center" as any);
  };

  // Red with count when notifications exist, green when all read
  const getNotifColor = () => {
    return getBellColor();
  };

  // Simulate initial data load then show content with haptic
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
      hapticLoadComplete();
    }, 800);
    return () => clearTimeout(timer);
  }, []);

    if (isLoading) {
    return (
      <ScreenErrorBoundary>
      <SafeAreaView style={styles.container}>
        <HomeTabSkeleton />
      </SafeAreaView>
      </ScreenErrorBoundary>
    );
  }
  return (
    <ScreenErrorBoundary>
    <SafeAreaView style={styles.container}>
      {/* Post-onboarding guided walkthrough — shows once on first home screen visit */}
      <OnboardingWalkthrough />
      {/* Language Recommendation Modal - triggers when user reaches B1+ */}
      <LanguageRecommendation />
      {/* Streak Milestone Celebration Modal */}
      <StreakCelebrationModal
        visible={celebrationVisible}
        streakDays={celebrationStreak}
        onDismiss={() => setCelebrationVisible(false)}
      />
      {/* New Badge Toast */}
      <BadgeToast
        badge={badgeToast}
        onDismiss={() => setBadgeToast(null)}
      />
      {/* Streak Freeze Shop Modal */}
      <StreakFreezeShopModal
        visible={freezeShopVisible}
        onClose={() => setFreezeShopVisible(false)}
      />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <BrandLockup size="md" glow showTagline taglineColor={Colors.textSecondary} />
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <TouchableOpacity
              style={[styles.notifBtn, { borderColor: Colors.secondary + "40" }]}
              onPress={() => router.push("/home-customize" as any)}
            >
              <Ionicons name="options" size={18} color={Colors.secondary} />
            </TouchableOpacity>
            {isDNDActive() && (
              <TouchableOpacity
                style={styles.dndIndicator}
                onPress={() => router.push("/do-not-disturb" as any)}
              >
                <Ionicons name="moon" size={16} color="#6366F1" />
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[styles.notifBtn, { borderColor: getNotifColor() + "80", shadowColor: getNotifColor() }]}
              onPress={handleNotifPress}
            >
              <Ionicons
                name={notifCount > 0 ? "notifications" : "notifications-outline"}
                size={20}
                color={getNotifColor()}
              />
              {notifCount > 0 && (
                <View style={styles.notifBadge}>
                  <Text style={styles.notifBadgeText}>{notifCount}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* ─── SEARCH BAR ─── */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={18} color={Colors.textMuted} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search features..."
              placeholderTextColor={Colors.textMuted}
              value={searchQuery}
              onChangeText={(text) => {
                setSearchQuery(text);
                setShowSearchResults(text.length > 0);
              }}
              returnKeyType="search"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => { setSearchQuery(""); setShowSearchResults(false); }}>
                <Ionicons name="close-circle" size={18} color={Colors.textMuted} />
              </TouchableOpacity>
            )}
          </View>
          {showSearchResults && (
            <View style={styles.searchResults}>
              {EXPLORE_FEATURES.filter((f) => f.title.toLowerCase().includes(searchQuery.toLowerCase())).slice(0, 6).map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.searchResultItem}
                  onPress={() => {
                    setSearchQuery("");
                    setShowSearchResults(false);
                    trackFeatureUsed(item.id);
                    addRecentlyVisited({ id: item.id, title: item.title, icon: item.icon, route: item.route, color: item.color });
                    setRecentRefresh((r) => r + 1);
                    router.push(item.route as any);
                  }}
                >
                  <Text style={styles.searchResultIcon}>{item.icon}</Text>
                  <Text style={styles.searchResultLabel}>{item.title}</Text>
                  <Ionicons name="chevron-forward" size={14} color={Colors.textMuted} />
                </TouchableOpacity>
              ))}
              {EXPLORE_FEATURES.filter((f) => f.title.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 && (
                <Text style={styles.searchNoResults}>No features found</Text>
              )}
            </View>
          )}
        </View>

        {/* ─── XP PROGRESS ─── */}
        {!isNewUser && <View style={{ marginBottom: 12 }}><XPProgressBar /></View>}

        {/* ─── THIS WEEK'S PROGRESS ─── */}
        {!isNewUser && <WeeklyProgressCard />}

        {/* ─── RECENTLY VISITED ─── */}
        {!isNewUser && <RecentlyVisitedRow refreshTrigger={recentRefresh} />}

        {/* ─── CREATOR SPOTLIGHT ─── */}
        {!isNewUser && <CreatorSpotlightCard />}

        {/* ─── QUICK ACTIONS WIDGET ─── */}
        {!isNewUser && <QuickActionsWidget />}

        {/* ─── PERSONALIZED TEACHER GREETING ─── */}
        {personalGreeting ? (
          <View style={{ marginHorizontal: 16, marginBottom: 12, backgroundColor: Colors.surfaceCard, borderRadius: 16, padding: 14, borderWidth: 1, borderColor: Colors.border }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.accent + '15', alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name="school" size={18} color={Colors.accent} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 13, color: Colors.textPrimary, lineHeight: 18 }}>{personalGreeting}</Text>
              </View>
            </View>
          </View>
        ) : null}
        {/* ─── METHODOLOGY RECOMMENDATION BANNER (Day 1) ─── */}
        {showMethodologyBanner && (
          <View style={{ marginHorizontal: 16, marginBottom: 12, backgroundColor: Colors.surfaceCard, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: Colors.accent + '40' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
              <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.accent + '15', alignItems: 'center', justifyContent: 'center', marginRight: 10 }}>
                <Ionicons name="bulb" size={18} color={Colors.accent} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 15, fontWeight: '700', color: Colors.textPrimary }}>Your Personalized Learning Style</Text>
                <Text style={{ fontSize: 12, color: Colors.textSecondary, marginTop: 2 }}>We matched a teaching method to your profile</Text>
              </View>
              <TouchableOpacity onPress={dismissMethodologyBanner}>
                <Ionicons name="close" size={20} color={Colors.textMuted} />
              </TouchableOpacity>
            </View>
            <Text style={{ fontSize: 13, color: Colors.textSecondary, lineHeight: 18, marginBottom: 12 }}>Based on your level, pace, and goals, we found the best teaching methodology for you. Tap below to see your personalized recommendation.</Text>
            <TouchableOpacity
              style={{ backgroundColor: Colors.accent, paddingVertical: 12, borderRadius: 10, alignItems: 'center' }}
              onPress={() => { dismissMethodologyBanner(); router.push('/methodology-recommendations' as any); }}
            >
              <Text style={{ color: '#fff', fontWeight: '700', fontSize: 14 }}>See My Recommendation</Text>
            </TouchableOpacity>
          </View>
        )}
        {/* ─── SCHEDULE SETUP PROMPT (shows after day 2) ─── */}
        {showSchedulePrompt && (
          <View style={{ marginHorizontal: 16, marginBottom: 12, backgroundColor: Colors.surfaceCard, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: Colors.goldBorder }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
              <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.goldGlow || 'rgba(255,215,0,0.12)', alignItems: 'center', justifyContent: 'center', marginRight: 10 }}>
                <Ionicons name="calendar" size={18} color={Colors.gold} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 15, fontWeight: '700', color: Colors.textPrimary }}>Set Your Learning Schedule</Text>
                <Text style={{ fontSize: 12, color: Colors.textSecondary, marginTop: 2 }}>Personalize your pace for better results</Text>
              </View>
              <TouchableOpacity onPress={async () => { setShowSchedulePrompt(false); await AsyncStorage.setItem('@schedule_prompt_dismissed', 'true'); }}>
                <Ionicons name="close" size={20} color={Colors.textMuted} />
              </TouchableOpacity>
            </View>
            <Text style={{ fontSize: 13, color: Colors.textSecondary, lineHeight: 18, marginBottom: 12 }}>Choose how many minutes per day you want to practice. We'll send gentle reminders to keep you on track.</Text>
            <TouchableOpacity
              style={{ backgroundColor: Colors.gold, paddingVertical: 12, borderRadius: 10, alignItems: 'center' }}
              onPress={() => { setShowSchedulePrompt(false); router.push('/smart-schedule' as any); }}
            >
              <Text style={{ fontSize: 14, fontWeight: '700', color: Colors.primary }}>Set My Schedule</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ─── NEW USER WELCOME STATE ─── */}
        {isNewUser && (
          <View style={styles.newUserWelcome}>
            <View style={styles.newUserIconRow}>
              <View style={styles.newUserIconCircle}>
                <Ionicons name="rocket" size={28} color={Colors.accent} />
              </View>
            </View>
            <Text style={styles.newUserTitle}>Welcome to LinguaVibe!</Text>
            <Text style={styles.newUserSubtitle}>Start your language journey with one of these:</Text>
            <View style={styles.newUserActions}>
              <TouchableOpacity
                style={[styles.newUserActionBtn, { backgroundColor: Colors.accent }]}
                activeOpacity={0.8}
                onPress={() => router.push('/level-assessment' as any)}
              >
                <Ionicons name="speedometer" size={18} color="#fff" />
                <Text style={styles.newUserActionText}>Take Level Test</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.newUserActionBtn, { backgroundColor: '#10B981' }]}
                activeOpacity={0.8}
                onPress={() => router.push('/lessons' as any)}
              >
                <Ionicons name="book" size={18} color="#fff" />
                <Text style={styles.newUserActionText}>Start a Lesson</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.newUserActionBtn, { backgroundColor: '#8B5CF6' }]}
                activeOpacity={0.8}
                onPress={() => router.push('/conversation-sim' as any)}
              >
                <Ionicons name="chatbubble-ellipses" size={18} color="#fff" />
                <Text style={styles.newUserActionText}>Try a Conversation</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={styles.newUserDismiss}
              onPress={() => setIsNewUser(false)}
            >
              <Text style={styles.newUserDismissText}>I've used this before</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ─── TRY FREE CALL CTA ─── */}
        {!isNewUser && (
        <TouchableOpacity
          style={{ marginHorizontal: 16, marginBottom: 12, backgroundColor: '#10B981', borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12 }}
          onPress={() => router.push('/demo-call' as any)}
          activeOpacity={0.8}
        >
          <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="call" size={20} color="#fff" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 14, fontWeight: '700', color: '#fff' }}>Try a Free AI Call</Text>
            <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 2 }}>60-second demo • No sign-up needed</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.7)" />
        </TouchableOpacity>
        )}

        {/* ─── PERSONALIZED DAILY PLAN ─── */}
        <DailyPlanWidget />
        {/* ─── PRONUNCIATION WEAK SPOTS ─── */}
        <PronunciationWeakSpotsCard />
        {/* ─── FAVORITE TEACHERS QUICK ACCESS ─── */}
        <FavoriteTeachersSection />

        {/* ─── YOUR TEACHER CARD ─── */}
        {homeTeacher && (
          <TouchableOpacity
            style={{ marginHorizontal: 16, marginBottom: 12, backgroundColor: Colors.surfaceCard, borderRadius: 16, padding: 14, borderWidth: 1, borderColor: Colors.border, flexDirection: 'row', alignItems: 'center' }}
            onPress={() => router.push({ pathname: '/hume-call', params: { mode: 'teacher', teacherName: homeTeacher.name, language: homeTeacher.dialects[0] || 'Spanish', dialect: homeTeacher.dialects[0] || '', level: 'intermediate' } } as any)}
            activeOpacity={0.7}
          >
            <ExpoImage source={{ uri: homeTeacher.photoUrl }} style={{ width: 48, height: 48, borderRadius: 24 }} />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={{ fontSize: 14, fontWeight: '700', color: Colors.textPrimary }}>{homeTeacher.name}</Text>
              <Text style={{ fontSize: 12, color: Colors.textSecondary, marginTop: 2 }}>{homeTeacher.dialects[0]} • {homeTeacher.origin}</Text>
            </View>
            <View style={{ backgroundColor: Colors.accent, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 }}>
              <Text style={{ fontSize: 12, fontWeight: '600', color: '#fff' }}>Talk</Text>
            </View>
          </TouchableOpacity>
        )}

        {/* ─── DYNAMIC CARDS (ordered by user preference) ─── */}
        {cardOrder.map((cardId) => {
          if (!isCardVisible(cardId)) return null;
          switch (cardId) {
            case "streak":
              return (
        <TouchableOpacity
          key="streak"
          style={styles.streakCard}
          activeOpacity={0.7}
          onPress={() => {
            if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.push(streak === 0 ? "/streak-recovery" as any : "/leaderboard" as any);
          }}
        >
          <Animated.Text style={[styles.streakFire, { transform: [{ scale: streakFireAnim }] }]}>
            🔥
          </Animated.Text>
          <View style={styles.streakInfo}>
            <Text style={styles.streakCount}>{streak} Day Streak</Text>
            <Text style={styles.streakSub}>{streak === 0 ? "Recover your streak! →" : "Tap to see leaderboard →"}</Text>
          </View>
          <View style={styles.streakBadge}>
            <Text style={styles.streakBadgeText}>{streak >= 100 ? "👑" : streak >= 30 ? "💎" : streak >= 7 ? "⭐" : streak >= 3 ? "💪" : "🌱"}</Text>
          </View>
          <TouchableOpacity
            style={{ padding: 6, marginLeft: 4 }}
            onPress={(e) => {
              e.stopPropagation?.();
              if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setFreezeShopVisible(true);
            }}
            activeOpacity={0.7}
          >
            <Ionicons name="snow" size={18} color={Colors.primary} />
          </TouchableOpacity>
        </TouchableOpacity>
              );
            case "usage":
              return (
        /* ─── USAGE DASHBOARD QUICK ACCESS ─── */
        <TouchableOpacity
          key="usage"
          style={styles.usageQuickCard}
          activeOpacity={0.7}
          onPress={() => {
            if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.push("/usage-dashboard" as any);
          }}
        >
          <View style={styles.usageQuickLeft}>
            <Ionicons name="speedometer" size={22} color={Colors.secondary} />
            <View>
              <Text style={styles.usageQuickTitle}>My Usage & Balance</Text>
              <Text style={styles.usageQuickSub}>Talk time • Credits • Limits</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={18} color={Colors.textSecondary} />
        </TouchableOpacity>

              );
            case "progress":
              return (
        <View key="progress">
          {/* Daily Briefing Card - personalized learning recommendations */}
          <View style={{ marginBottom: 12 }}>
            <DailyBriefingCard />
          </View>
          {/* Placement Test Prompt (for users who skipped) */}
          {(!cefrLevel || cefrLevel === "A1") && (
            <TouchableOpacity
              style={[styles.usageQuickCard, { marginBottom: 8, borderLeftWidth: 3, borderLeftColor: Colors.secondary, backgroundColor: Colors.secondary + "08" }]}
              activeOpacity={0.7}
              onPress={() => {
                if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push("/placement-test" as any);
              }}
            >
              <View style={styles.usageQuickLeft}>
                <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.secondary + "20", alignItems: "center", justifyContent: "center" }}>
                  <Ionicons name="school" size={18} color={Colors.secondary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.usageQuickTitle}>Find Your Level</Text>
                  <Text style={styles.usageQuickSub}>
                    Take a 10-min placement test to personalize your learning path
                  </Text>
                </View>
              </View>
              <Ionicons name="arrow-forward" size={18} color={Colors.secondary} />
            </TouchableOpacity>
          )}

          {/* CEFR Level Indicator */}
          {cefrLevel && (
            <TouchableOpacity
              style={[styles.usageQuickCard, { marginBottom: 8, borderLeftWidth: 3, borderLeftColor: cefrLevel === "C2" ? "#8B5CF6" : cefrLevel === "C1" ? "#3B82F6" : cefrLevel === "B2" ? "#22C55E" : cefrLevel === "B1" ? "#EAB308" : cefrLevel === "A2" ? "#F97316" : "#EF4444" }]}
              activeOpacity={0.7}
              onPress={() => {
                if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push("/placement-test" as any);
              }}
            >
              <View style={styles.usageQuickLeft}>
                <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: (cefrLevel === "C2" ? "#8B5CF6" : cefrLevel === "C1" ? "#3B82F6" : cefrLevel === "B2" ? "#22C55E" : cefrLevel === "B1" ? "#EAB308" : cefrLevel === "A2" ? "#F97316" : "#EF4444") + "20", alignItems: "center", justifyContent: "center" }}>
                  <Text style={{ fontSize: 13, fontWeight: "700", color: cefrLevel === "C2" ? "#8B5CF6" : cefrLevel === "C1" ? "#3B82F6" : cefrLevel === "B2" ? "#22C55E" : cefrLevel === "B1" ? "#EAB308" : cefrLevel === "A2" ? "#F97316" : "#EF4444" }}>{cefrLevel}</Text>
                </View>
                <View>
                  <Text style={styles.usageQuickTitle}>CEFR Level: {cefrLevel}</Text>
                  <Text style={styles.usageQuickSub}>
                    {cefrLevel === "C2" ? "Mastery" : cefrLevel === "C1" ? "Advanced" : cefrLevel === "B2" ? "Upper Intermediate" : cefrLevel === "B1" ? "Intermediate" : cefrLevel === "A2" ? "Elementary" : "Beginner"}
                    {cefrTestDate ? " • Assessed " + new Date(cefrTestDate).toLocaleDateString() : ""}
                  </Text>
                </View>
              </View>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                <Text style={{ fontSize: 10, color: Colors.textMuted }}>Retake</Text>
                <Ionicons name="refresh" size={14} color={Colors.textMuted} />
              </View>
            </TouchableOpacity>
          )}
          {/* CEFR History Timeline */}
          {cefrHistory.length > 1 && (
            <View style={[styles.usageQuickCard, { marginBottom: 8, paddingVertical: 12 }]}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.usageQuickTitle, { marginBottom: 6 }]}>Level Journey</Text>
                <View style={{ flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 4 }}>
                  {cefrHistory.map((entry, idx) => {
                    const color = entry.level === "C2" ? "#8B5CF6" : entry.level === "C1" ? "#3B82F6" : entry.level === "B2" ? "#22C55E" : entry.level === "B1" ? "#EAB308" : entry.level === "A2" ? "#F97316" : "#EF4444";
                    return (
                      <View key={idx} style={{ flexDirection: "row", alignItems: "center" }}>
                        <View style={{ backgroundColor: color + "20", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10, borderWidth: 1, borderColor: color + "40" }}>
                          <Text style={{ fontSize: 11, fontWeight: "700", color }}>{entry.level}</Text>
                        </View>
                        {idx < cefrHistory.length - 1 && (
                          <Ionicons name="arrow-forward" size={12} color={Colors.textMuted} style={{ marginHorizontal: 2 }} />
                        )}
                      </View>
                    );
                  })}
                </View>
                <Text style={{ fontSize: 10, color: Colors.textMuted, marginTop: 4 }}>
                  {cefrHistory.length} assessment{cefrHistory.length > 1 ? "s" : ""} • Latest: {new Date(cefrHistory[cefrHistory.length - 1].date).toLocaleDateString()}
                </Text>
              </View>
            </View>
          )}
          {/* Level-Based Recommendations */}
          {cefrLevel && cefrLevel !== "A1" && (
            <View style={[styles.usageQuickCard, { marginBottom: 8, flexDirection: "column", alignItems: "stretch" }]}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 10 }}>
                <Ionicons name="sparkles" size={18} color={Colors.gold} />
                <Text style={styles.usageQuickTitle}>Recommended for {cefrLevel}</Text>
              </View>
              {(cefrLevel === "A2" || cefrLevel === "B1") && (
                <TouchableOpacity
                  style={{ flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 8, borderTopWidth: 0.5, borderTopColor: Colors.border }}
                  onPress={() => router.push("/flashcard-srs" as any)}
                  activeOpacity={0.7}
                >
                  <Ionicons name="albums" size={18} color="#3B82F6" />
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 13, fontWeight: "600", color: Colors.textPrimary }}>Build Vocabulary</Text>
                    <Text style={{ fontSize: 11, color: Colors.textMuted }}>FSRS flashcards adapted to your level</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
                </TouchableOpacity>
              )}
              {(cefrLevel === "B1" || cefrLevel === "B2") && (
                <TouchableOpacity
                  style={{ flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 8, borderTopWidth: 0.5, borderTopColor: Colors.border }}
                  onPress={() => router.push("/voice-conversation" as any)}
                  activeOpacity={0.7}
                >
                  <Ionicons name="mic" size={18} color="#8B5CF6" />
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 13, fontWeight: "600", color: Colors.textPrimary }}>Practice Speaking</Text>
                    <Text style={{ fontSize: 11, color: Colors.textMuted }}>AI conversation partner at {cefrLevel} level</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
                </TouchableOpacity>
              )}
              {(cefrLevel === "B2" || cefrLevel === "C1" || cefrLevel === "C2") && (
                <TouchableOpacity
                  style={{ flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 8, borderTopWidth: 0.5, borderTopColor: Colors.border }}
                  onPress={() => router.push("/friend-challenges" as any)}
                  activeOpacity={0.7}
                >
                  <Ionicons name="trophy" size={18} color="#F59E0B" />
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 13, fontWeight: "600", color: Colors.textPrimary }}>Challenge Friends</Text>
                    <Text style={{ fontSize: 11, color: Colors.textMuted }}>Compete in vocab duels and grammar races</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
                </TouchableOpacity>
              )}
              {(cefrLevel === "A2" || cefrLevel === "B1" || cefrLevel === "B2") && (
                <TouchableOpacity
                  style={{ flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 8, borderTopWidth: 0.5, borderTopColor: Colors.border }}
                  onPress={() => router.push("/study-groups" as any)}
                  activeOpacity={0.7}
                >
                  <Ionicons name="people" size={18} color="#10B981" />
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 13, fontWeight: "600", color: Colors.textPrimary }}>Join Study Groups</Text>
                    <Text style={{ fontSize: 11, color: Colors.textMuted }}>Learn together with peers at your level</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Progress Card */}
          <TouchableOpacity
            style={styles.usageQuickCard}
            activeOpacity={0.7}
            onPress={() => {
              if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push("/progress-dashboard" as any);
            }}
          >
            <View style={styles.usageQuickLeft}>
              <Ionicons name="analytics" size={22} color="#8B5CF6" />
              <View>
                <Text style={styles.usageQuickTitle}>My Progress</Text>
                <Text style={styles.usageQuickSub}>Charts • XP • Streaks • Achievements</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color={Colors.textSecondary} />
          </TouchableOpacity>
        </View>
              );

            case "daily-pulse":
              return (
        <View key="daily-pulse" style={{ marginBottom: 12 }}>
          <DailyLessonStreakWidget />
        </View>
              );

            case "daily-goals":
              return (
        <TouchableOpacity
          key="daily-goals"
          style={styles.usageQuickCard}
          activeOpacity={0.7}
          onPress={() => {
            if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.push("/daily-goals" as any);
          }}
        >
          <View style={styles.usageQuickLeft}>
            <Ionicons name="flag" size={22} color={Colors.success} />
            <View>
              <Text style={styles.usageQuickTitle}>Daily Goals</Text>
              <Text style={styles.usageQuickSub}>Set targets • Track progress • Build habits</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={18} color={Colors.textSecondary} />
        </TouchableOpacity>
              );

            case "weekly-digest":
              return (
        <TouchableOpacity
          key="weekly-digest"
          style={styles.usageQuickCard}
          activeOpacity={0.7}
          onPress={() => {
            if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.push("/weekly-digest" as any);
          }}
        >
          <View style={styles.usageQuickLeft}>
            <Ionicons name="newspaper" size={22} color={Colors.gold} />
            <View>
              <Text style={styles.usageQuickTitle}>Weekly Digest</Text>
              <Text style={styles.usageQuickSub}>Highlights • Stats • Next week goals</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={18} color={Colors.textSecondary} />
        </TouchableOpacity>
              );
            case "milestones":
              return (
        /* ─── MILESTONES PROGRESS INDICATOR ─── */
        <TouchableOpacity
          key="milestones"
          style={styles.milestonesIndicator}
          activeOpacity={0.7}
          onPress={() => {
            if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.push("/milestones" as any);
          }}
        >
          <View style={styles.milestonesIndicatorLeft}>
            <Text style={styles.milestonesIndicatorEmoji}>🎯</Text>
            <View>
              <Text style={styles.milestonesIndicatorTitle}>
                {milestoneProgress.completed}/{milestoneProgress.total} Milestones Today
              </Text>
              <Text style={styles.milestonesIndicatorSub}>
                {milestoneProgress.completed === milestoneProgress.total
                  ? "🌟 Perfect Day! 2x bonus earned"
                  : `+${milestoneProgress.creditsEarned} credits earned • Tap for details`}
              </Text>
            </View>
          </View>
          <View style={styles.milestonesIndicatorBar}>
            <View
              style={[
                styles.milestonesIndicatorBarFill,
                { width: `${(milestoneProgress.completed / milestoneProgress.total) * 100}%` },
              ]}
            />
          </View>
        </TouchableOpacity>
              );
            case "daily-challenge":
              return (
        <View key="daily-challenge">
        {/* ─── STREAK REWARDS ─── */}
        <View style={styles.streakRewardsCard}>
          <Text style={styles.streakRewardsTitle}>🎁 Streak Rewards</Text>
          <View style={styles.streakMilestones}>
            <View style={[styles.milestone, streak >= 7 && styles.milestoneUnlocked]}>
              <Text style={styles.milestoneEmoji}>{streak >= 7 ? "✅" : "🔒"}</Text>
              <Text style={styles.milestoneDay}>7 days</Text>
              <Text style={styles.milestoneReward}>+25 credits</Text>
            </View>
            <View style={[styles.milestone, streak >= 30 && styles.milestoneUnlocked]}>
              <Text style={styles.milestoneEmoji}>{streak >= 30 ? "✅" : "🔒"}</Text>
              <Text style={styles.milestoneDay}>30 days</Text>
              <Text style={styles.milestoneReward}>+100 credits</Text>
            </View>
            <View style={[styles.milestone, streak >= 100 && styles.milestoneUnlocked]}>
              <Text style={styles.milestoneEmoji}>{streak >= 100 ? "✅" : "🔒"}</Text>
              <Text style={styles.milestoneDay}>100 days</Text>
              <Text style={styles.milestoneReward}>+500 credits</Text>
            </View>
          </View>
          <View style={styles.streakProgressRow}>
            <View style={styles.streakProgressBg}>
              <View style={[styles.streakProgressFill, { width: `${Math.min((streak / 7) * 100, 100)}%` }]} />
            </View>
            <Text style={styles.streakProgressLabel}>{Math.max(7 - streak, 0)} days to next reward</Text>
          </View>
        </View>

        {/* ─── DAILY CHALLENGE ─── */}
          <View style={[styles.dailyChallengeCard, challengeCompleted && styles.dailyChallengeCompleted]}>
          <View style={styles.dailyChallengeHeader}>
            <Text style={styles.dailyChallengeEmoji}>{currentChallenge.emoji}</Text>
            <View style={{ flex: 1 }}>
              <TouchableOpacity onPress={() => router.push("/daily-challenges")} style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                <Text style={styles.dailyChallengeTitle}>Daily Challenge</Text>
                <Ionicons name="chevron-forward" size={14} color={Colors.textSecondary} />
              </TouchableOpacity>
              <Text style={styles.dailyChallengeSub}>
                {challengeCompleted ? "✅ Completed! +10 credits earned" : "Complete for +10 bonus credits"}
              </Text>
            </View>
            {!challengeCompleted && (
              <View style={styles.dailyChallengeTimer}>
                <Ionicons name="time" size={12} color={Colors.gold} />
                <Text style={styles.dailyChallengeTimerText}>
                  {Math.max(23 - new Date().getHours(), 0)}h left
                </Text>
              </View>
            )}
          </View>
          <View style={styles.dailyChallengeBody}>
            <View style={styles.dailyChallengeTask}>
              <Ionicons name={currentChallenge.icon as any} size={20} color={challengeCompleted ? Colors.success : Colors.secondary} />
              <View style={{ flex: 1 }}>
                <Text style={styles.dailyChallengeTaskTitle}>{currentChallenge.title}</Text>
                <Text style={styles.dailyChallengeTaskDesc}>{currentChallenge.desc}</Text>
              </View>
            </View>
            {challengeCompleted ? (
              <View style={styles.dailyChallengeCompletedBadge}>
                <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
                <Text style={styles.dailyChallengeCompletedText}>Challenge Complete!</Text>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.dailyChallengeBtn}
                onPress={handleChallengeStart}
              >
                <Text style={styles.dailyChallengeBtnText}>Start Challenge</Text>
                <Ionicons name="arrow-forward" size={16} color="#fff" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* ─── DAILY PHONEME CHALLENGE ─── */}
        {phonemeChallenge && !phonemeChallengeDismissed && (
          <View style={styles.phonemeChallengeCard}>
            <View style={styles.phonemeChallengeHeader}>
              <View style={styles.phonemeChallengeIcon}>
                <Ionicons name="mic" size={20} color="#06B6D4" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.phonemeChallengeTitle}>Daily Phoneme Drill</Text>
                <Text style={styles.phoneChallengeSub}>
                  Practice your weakest sound: {phonemeChallenge.phonemeName}
                </Text>
              </View>
              <TouchableOpacity onPress={dismissPhonemeChallenge} style={{ padding: 4 }}>
                <Ionicons name="close" size={18} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <View style={styles.phonemeChallengeBody}>
              <View style={styles.phonemeChallengeInfo}>
                <Text style={styles.phonemeChallengeSymbol}>{phonemeChallenge.phonemeSymbol}</Text>
                <Text style={styles.phoneChallengeLang}>{phonemeChallenge.language}</Text>
              </View>
              <TouchableOpacity style={styles.phonemeChallengeBtn} onPress={handlePhonemeChallenge}>
                <Text style={styles.phonemeChallengeBtnText}>Quick Drill</Text>
                <Ionicons name="arrow-forward" size={14} color="#FFF" />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* SRS Review Due Cards */}
        <TouchableOpacity
          style={styles.srsReviewCard}
          onPress={() => router.push("/srs-review" as any)}
          activeOpacity={0.8}
        >
          <View style={styles.srsReviewLeft}>
            <View style={styles.srsReviewIcon}>
              <Ionicons name="refresh-circle" size={24} color="#00AAFF" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.srsReviewTitle}>Review Due Cards</Text>
              <Text style={styles.srsReviewSub}>Strengthen your memory with spaced repetition</Text>
            </View>
          </View>
          <View style={styles.srsReviewBadge}>
            <Text style={styles.srsReviewBadgeText}>{srsDueCount}</Text>
          </View>
        </TouchableOpacity>

        {/* Learning Pace Tracker */}
        <TouchableOpacity
          style={styles.paceTrackerCard}
          onPress={() => router.push("/learning-goal-setup" as any)}
          activeOpacity={0.8}
        >
          <View style={styles.paceTrackerHeader}>
            <View style={styles.paceTrackerIconWrap}>
              <Ionicons name="analytics" size={22} color="#10B981" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.paceTrackerTitle}>Learning Pace</Text>
              <Text style={styles.paceTrackerSub}>You're on track for B2 Spanish</Text>
            </View>
            <View style={styles.paceStatusBadge}>
              <Text style={styles.paceStatusText}>On Track</Text>
            </View>
          </View>
          <View style={styles.paceProgressRow}>
            <View style={styles.paceProgressBg}>
              <View style={[styles.paceProgressFill, { width: "62%" }]} />
            </View>
            <Text style={styles.paceProgressPct}>62%</Text>
          </View>
          <View style={styles.paceStatsRow}>
            <View style={styles.paceStat}>
              <Text style={styles.paceStatValue}>30 min</Text>
              <Text style={styles.paceStatLabel}>daily goal</Text>
            </View>
            <View style={styles.paceStat}>
              <Text style={styles.paceStatValue}>127 days</Text>
              <Text style={styles.paceStatLabel}>remaining</Text>
            </View>
            <View style={styles.paceStat}>
              <Text style={styles.paceStatValue}>4.2 hrs</Text>
              <Text style={styles.paceStatLabel}>this week</Text>
            </View>
          </View>
        </TouchableOpacity>
        <View style={styles.paceQuickLinks}>
          <TouchableOpacity
            style={styles.paceQuickLink}
            onPress={() => router.push("/personalized-daily-plan" as any)}
            activeOpacity={0.8}
          >
            <Ionicons name="sparkles" size={14} color="#00AAFF" />
            <Text style={styles.paceQuickLinkText}>Today's Plan</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.paceQuickLink}
            onPress={() => router.push("/weekly-intelligence-report" as any)}
            activeOpacity={0.8}
          >
            <Ionicons name="bar-chart" size={14} color="#F59E0B" />
            <Text style={styles.paceQuickLinkText}>Weekly Report</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.paceQuickLink}
            onPress={() => router.push("/weekly-digest" as any)}
            activeOpacity={0.8}
          >
            <Ionicons name="newspaper" size={14} color="#22C55E" />
            <Text style={styles.paceQuickLinkText}>Digest</Text>
          </TouchableOpacity>
        </View>
        </View>
              );
            case "featured":
              return (
        <View key="featured">
        {/* Video Hero Section */}
        {videoHeroCollapsed ? (
          <TouchableOpacity
            style={styles.watchTourBtn}
            onPress={() => setVideoHeroCollapsed(false)}
            activeOpacity={0.8}
          >
            <Ionicons name="play-circle" size={20} color={Colors.secondary} />
            <Text style={styles.watchTourText}>Watch Tour</Text>
          </TouchableOpacity>
        ) : (
        <View style={styles.videoHero}>
          <TouchableOpacity
            style={styles.videoHeroCloseBtn}
            onPress={() => setVideoHeroCollapsed(true)}
          >
            <Ionicons name="close" size={16} color={Colors.textSecondary} />
          </TouchableOpacity>
          <View style={styles.videoHeroOverlay}>
            <View style={styles.videoHeroBadge}>
              <View style={styles.liveDot} />
              <Text style={styles.videoHeroBadgeText}>FEATURED</Text>
            </View>
            <View style={styles.videoHeroContent}>
              <Text style={styles.videoHeroTitle}>Learn Spanish Through Reggaeton</Text>
              <Text style={styles.videoHeroSub}>Bad Bunny - "Tití Me Preguntó" • Word-by-word breakdown</Text>
              <View style={styles.videoHeroActions}>
                <TouchableOpacity
                  style={styles.videoHeroPlayBtn}
                  onPress={() => router.push("/song-player" as any)}
                >
                  <Ionicons name="play" size={16} color="#060912" />
                  <Text style={styles.videoHeroPlayText}>Watch Now</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.videoHeroSecBtn}>
                  <Ionicons name="bookmark-outline" size={16} color={Colors.secondary} />
                  <Text style={styles.videoHeroSecText}>Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
          {/* Decorative gradient bars */}
          <View style={styles.videoHeroGradientBar} />
        </View>
        )}

        {/* Social Translate Doorway */}
        <TouchableOpacity
          style={styles.socialTranslateBanner}
          activeOpacity={0.8}
          onPress={() => router.push("/social-translate" as any)}
        >
          <View style={styles.socialBannerIcon}>
            <Ionicons name="share-social" size={22} color="#E4405F" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.socialBannerTitle}>Social Translate</Text>
            <Text style={styles.socialBannerDesc}>Instagram • TikTok • YouTube • X</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={Colors.textSecondary} />
        </TouchableOpacity>

        {/* Daily Slang Card */}
        <View style={styles.slangCard}>
          <View style={styles.slangGlowLine} />
          <View style={styles.slangHeader}>
            <View style={styles.slangLabelRow}>
              <View style={styles.pulseDot} />
              <Text style={styles.slangLabel}>{t.todaysSlang.toUpperCase()}</Text>
            </View>
            <View style={styles.slangBadge}>
              <Text style={styles.slangBadgeText}>🇩🇴 Dominican</Text>
            </View>
          </View>
          <Text style={styles.slangWord}>Tá to'</Text>
          <Text style={styles.slangMeaning}>Everything's cool / All good</Text>
          <TouchableOpacity style={styles.slangPlayBtn}>
            <Ionicons name="volume-high" size={16} color={Colors.secondary} />
            <Text style={styles.slangPlayText}>{t.listen}</Text>
          </TouchableOpacity>
        </View>
        </View>
              );
            case "continue-learning":
              return (
        <TouchableOpacity
          key="continue-learning"
          style={styles.usageQuickCard}
          activeOpacity={0.7}
          onPress={() => {
            if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.push("/course-library" as any);
          }}
        >
          <View style={styles.usageQuickLeft}>
            <Ionicons name="play-circle" size={22} color="#3B82F6" />
            <View>
              <Text style={styles.usageQuickTitle}>{t.continueLearning}</Text>
              <Text style={styles.usageQuickSub}>Pick up where you left off</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={18} color={Colors.textSecondary} />
        </TouchableOpacity>
              );
            case "upcoming-classes":
              return (
        <TouchableOpacity
          key="upcoming-classes"
          style={styles.usageQuickCard}
          activeOpacity={0.7}
          onPress={() => {
            if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.push("/class-recaps" as any);
          }}
        >
          <View style={styles.usageQuickLeft}>
            <Ionicons name="calendar" size={22} color="#F59E0B" />
            <View>
              <Text style={styles.usageQuickTitle}>{t.upcomingClasses}</Text>
              <Text style={styles.usageQuickSub}>Schedule • Attendance • Recaps</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={18} color={Colors.textSecondary} />
        </TouchableOpacity>
              );
            case "cultural-feed":
              return (
        <CulturalFeedWidget key="cultural-feed" />
              );
            case "ai-tip":
              return (
        <View key="ai-tip" style={styles.usageQuickCard}>
          <View style={styles.usageQuickLeft}>
            <Ionicons name="sparkles" size={22} color="#8B5CF6" />
            <View>
              <Text style={styles.usageQuickTitle}>{t.aiTipOfDay}</Text>
              <Text style={styles.usageQuickSub}>Try using "¿Qué lo que?" — Dominican for "What's up?"</Text>
            </View>
          </View>
        </View>
              );
            default:
              return null;
          }
        })}

        {/* Quick Actions - AI first, then Translate, Songs, Learn */}
        <View style={styles.quickActions}>
          {/* AI Agent Toggle - First icon: shows/hides the floating bubble */}
          <TouchableOpacity
            style={styles.quickBtn}
            onPress={openCloudWave}
          >
            <View style={[
              styles.quickIcon,
              styles.aiQuickIcon,
              agentState.visible && styles.aiQuickIconActive,
            ]}>
              <Ionicons name="cloud" size={24} color={agentState.visible ? Colors.gold : Colors.primary} />
            </View>
            <Text style={[styles.quickLabel, agentState.visible && { color: Colors.gold }]}>CloudWave</Text>
          </TouchableOpacity>
          {/* Translate */}
          <TouchableOpacity
            style={styles.quickBtn}
            onPress={() => router.push("/(tabs)/translate" as any)}
          >
            <View style={[styles.quickIcon, { backgroundColor: Colors.glowSubtle, borderColor: Colors.secondary + "50" }]}>
              <Ionicons name="language" size={24} color={Colors.secondary} />
            </View>
            <Text style={styles.quickLabel}>{t.translate}</Text>
          </TouchableOpacity>
          {/* Songs */}
          <TouchableOpacity
            style={styles.quickBtn}
            onPress={() => router.push("/(tabs)/songs" as any)}
          >
            <View style={[styles.quickIcon, { backgroundColor: Colors.goldGlow, borderColor: Colors.gold + "50" }]}>
              <Ionicons name="musical-notes" size={24} color={Colors.gold} />
            </View>
            <Text style={styles.quickLabel}>{t.songs}</Text>
          </TouchableOpacity>
          {/* Learn */}
          <TouchableOpacity
            style={styles.quickBtn}
            onPress={() => router.push("/(tabs)/teacher" as any)}
          >
            <View style={[styles.quickIcon, { backgroundColor: Colors.redGlow, borderColor: Colors.accent + "50" }]}>
              <Ionicons name="school" size={24} color={Colors.accent} />
            </View>
            <Text style={styles.quickLabel}>{t.learn}</Text>
          </TouchableOpacity>
          {/* Talk to AI */}
          <TouchableOpacity
            style={styles.quickBtn}
            onPress={() => router.push({ pathname: "/hume-call", params: { mode: "cloudwave", persona: "cloudwave", language: "Spanish", dialect: "Dominican" } } as any)}
          >
            <View style={[styles.quickIcon, { backgroundColor: "rgba(139,92,246,0.12)", borderColor: "#8B5CF6" + "50" }]}>
              <Ionicons name="mic" size={24} color="#8B5CF6" />
            </View>
            <Text style={styles.quickLabel}>Talk</Text>
          </TouchableOpacity>
          {/* Focus Mode */}
          <TouchableOpacity
            style={styles.quickBtn}
            onPress={() => router.push("/study-session" as any)}
          >
            <View style={[styles.quickIcon, { backgroundColor: "rgba(99, 102, 241, 0.12)", borderColor: "#6366F1" + "50" }]}>
              <Ionicons name="timer" size={24} color="#6366F1" />
            </View>
            <Text style={styles.quickLabel}>Focus</Text>
          </TouchableOpacity>
        </View>

        {/* Learning Hub - Glowing Icons */}
        <View style={styles.learningHubSection}>
          <Text style={styles.sectionTitle}>{t.learningHub}</Text>
          <View style={styles.learningHubGrid}>
            <TouchableOpacity style={styles.learningHubItem} onPress={() => router.push("/studio-hub" as any)} activeOpacity={0.7}>
              <GlowIcon icon="mic" size={26} isGlowing={glowState.studio.isGlowing} count={glowState.studio.count} glowColor={getGlowColor(glowState.studio.urgency)} />
              <Text style={[styles.learningHubLabel, glowState.studio.isGlowing && { color: getGlowColor(glowState.studio.urgency) }]}>Studio</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.learningHubItem} onPress={() => router.push("/library" as any)} activeOpacity={0.7}>
              <GlowIcon icon="book" size={26} isGlowing={glowState.library.isGlowing} count={glowState.library.count} glowColor={getGlowColor(glowState.library.urgency)} />
              <Text style={[styles.learningHubLabel, glowState.library.isGlowing && { color: getGlowColor(glowState.library.urgency) }]}>Library</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.learningHubItem} onPress={() => router.push("/quiz-test" as any)} activeOpacity={0.7}>
              <GlowIcon icon="checkbox" size={26} isGlowing={glowState.quiz.isGlowing} count={glowState.quiz.count} glowColor={getGlowColor(glowState.quiz.urgency)} />
              <Text style={[styles.learningHubLabel, glowState.quiz.isGlowing && { color: getGlowColor(glowState.quiz.urgency) }]}>Quiz</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.learningHubItem} onPress={() => router.push("/classroom" as any)} activeOpacity={0.7}>
              <GlowIcon icon="people" size={26} isGlowing={glowState.classroom.isGlowing} count={glowState.classroom.count} glowColor={getGlowColor(glowState.classroom.urgency)} />
              <Text style={[styles.learningHubLabel, glowState.classroom.isGlowing && { color: getGlowColor(glowState.classroom.urgency) }]}>Class</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.learningHubItem} onPress={() => router.push("/(tabs)/calls" as any)} activeOpacity={0.7}>
              <GlowIcon icon="call" size={26} isGlowing={glowState.calls.isGlowing} count={glowState.calls.count} glowColor={getGlowColor(glowState.calls.urgency)} />
              <Text style={[styles.learningHubLabel, glowState.calls.isGlowing && { color: getGlowColor(glowState.calls.urgency) }]}>Calls</Text>
            </TouchableOpacity>
          </View>
          {totalPending > 0 && (
            <Text style={styles.learningHubPending}>{totalPending} pending task{totalPending !== 1 ? "s" : ""} — tap a glowing icon to start</Text>
          )}
        </View>

        {/* Subscription CTA */}
        <TouchableOpacity
          style={styles.upgradeCard}
          activeOpacity={0.85}
          onPress={() => router.push("/checkout" as any)}
        >
          <View style={styles.upgradeRow}>
            <View style={styles.upgradeIcon}>
              <Ionicons name="diamond" size={20} color={Colors.gold} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.upgradeTitle}>{t.upgradeToPro}</Text>
              <Text style={styles.upgradeDesc}>Unlimited songs • All teachers • Voice clone</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={Colors.gold} />
          </View>
        </TouchableOpacity>

        {/* ─── PINNED FAVORITES ─── */}
        <FavoritesSection refreshTrigger={favRefresh} />

        {/* ─── UNIFIED FEATURE CATEGORIES ─── */}
        <Text style={styles.sectionTitle}>{t.explore}</Text>
        <Text style={styles.sectionSub}>All features in one place • Long-press to pin</Text>
        {EXPLORE_CATEGORIES.slice(0, showAllExplore ? EXPLORE_CATEGORIES.length : 3).map((category) => (
          <View key={category.id} style={styles.exploreCategoryBlock}>
            <View style={styles.exploreCategoryHeader}>
              <Ionicons name={category.icon as any} size={16} color={Colors.textSecondary} />
              <Text style={styles.exploreCategoryTitle}>{category.title}</Text>
              <Text style={styles.exploreCategoryCount}>{category.items.length}</Text>
            </View>
            <View style={styles.exploreGrid}>
              {category.items.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.exploreItem}
                  activeOpacity={0.7}
                  onPress={() => { if (item.route) { trackFeatureUsed(item.id); addRecentlyVisited({ id: item.id, title: item.title, icon: item.icon, route: item.route, color: item.color }); setRecentRefresh((p) => p + 1); router.push(item.route as any); } }}
                  onLongPress={async () => {
                    if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                    await toggleFavorite({ id: item.id, title: item.title, icon: item.icon, route: item.route || "" });
                    setFavRefresh((p) => p + 1);
                  }}
                >
                  <View style={[styles.exploreIconWrap, { borderColor: item.color + "50", backgroundColor: item.color + "12" }]}>
                    <Ionicons name={item.icon as any} size={22} color={item.color} />
                  </View>
                  <Text style={styles.exploreLabel}>{item.title}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}
        {!showAllExplore && (
          <TouchableOpacity
            style={styles.showMoreBtn}
            activeOpacity={0.7}
            onPress={() => setShowAllExplore(true)}
          >
            <Text style={styles.showMoreText}>Show {EXPLORE_CATEGORIES.length - 3} More Categories</Text>
            <Ionicons name="chevron-down" size={16} color={Colors.primary} />
          </TouchableOpacity>
        )}
        {showAllExplore && (
          <TouchableOpacity
            style={styles.showMoreBtn}
            activeOpacity={0.7}
            onPress={() => setShowAllExplore(false)}
          >
            <Text style={styles.showMoreText}>Show Less</Text>
            <Ionicons name="chevron-up" size={16} color={Colors.primary} />
          </TouchableOpacity>
        )}

        {/* Progress Card */}
        <View style={styles.progressCard}>
          <Text style={styles.progressTitle}>{t.todaysProgress.toUpperCase()}</Text>
          <View style={styles.progressRow}>
            <View style={styles.progressItem}>
              <Text style={styles.progressNum}>12</Text>
              <Text style={styles.progressLabel}>{t.words}</Text>
            </View>
            <View style={styles.progressDivider} />
            <View style={styles.progressItem}>
              <Text style={styles.progressNum}>8</Text>
              <Text style={styles.progressLabel}>{t.minutes}</Text>
            </View>
            <View style={styles.progressDivider} />
            <View style={styles.progressItem}>
              <Text style={styles.progressNum}>2</Text>
              <Text style={styles.progressLabel}>{t.songs}</Text>
            </View>
            <View style={styles.progressDivider} />
            <View style={styles.progressItem}>
              <Text style={[styles.progressNum, { color: Colors.gold }]}>7</Text>
              <Text style={styles.progressLabel}>{t.streak} 🔥</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* ─── FLOATING QUICK ACTIONS BUTTON ─── */}
      {fabActions.map((action, index) => {
        const translateY = fabAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [0, -(60 * (index + 1))],
        });
        const opacity = fabAnim.interpolate({
          inputRange: [0, 0.5, 1],
          outputRange: [0, 0, 1],
        });
        const scale = fabAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [0.3, 1],
        });
        return (
          <Animated.View
            key={action.label}
            style={[styles.fabAction, { transform: [{ translateY }, { scale }], opacity }]}
          >
            <TouchableOpacity
              style={[styles.fabActionBtn, { backgroundColor: action.color }]}
              onPress={() => {
                toggleFab();
                if (action.route) router.push(action.route as any);
              }}
            >
              <Ionicons name={action.icon} size={20} color="#FFFFFF" />
              {action.badge > 0 && (
                <View style={styles.fabActionBadge}>
                  <Text style={styles.fabActionBadgeText}>{action.badge > 9 ? "9+" : action.badge}</Text>
                </View>
              )}
            </TouchableOpacity>
            <Text style={styles.fabActionLabel}>{action.label}</Text>
          </Animated.View>
        );
      })}
      <TouchableOpacity
        style={[styles.fab, fabOpen && styles.fabOpen]}
        onPress={toggleFab}
        activeOpacity={0.8}
      >
        <Animated.View style={{ transform: [{ rotate: fabAnim.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "45deg"] }) }] }}>
          <Ionicons name="add" size={28} color="#FFFFFF" />
        </Animated.View>
        {totalUnread > 0 && !fabOpen && (
          <View style={styles.fabBadge}>
            <Text style={styles.fabBadgeText}>{totalUnread > 9 ? "9+" : totalUnread}</Text>
          </View>
        )}
      </TouchableOpacity>
      {/* Welcome-back prompt */}
      {showWelcome && (
        <View style={styles.welcomeOverlay}>
          <View style={styles.welcomeCard}>
            <View style={{ alignItems: 'center', marginBottom: 16 }}>
              <Ionicons name="sparkles" size={32} color={Colors.secondary} />
              <Text style={{ fontSize: 22, fontWeight: '800', color: Colors.textPrimary, marginTop: 12, textAlign: 'center' }}>Welcome to LinguaVibe!</Text>
              <Text style={{ fontSize: 14, color: Colors.textSecondary, textAlign: 'center', marginTop: 8, lineHeight: 20 }}>You're all set. Want a quick tour of what you can do?</Text>
            </View>
            <TouchableOpacity
              style={{ backgroundColor: Colors.secondary, paddingVertical: 14, borderRadius: 12, alignItems: 'center', marginBottom: 10 }}
              onPress={() => { setShowWelcome(false); router.push('/cloudwave-guide' as any); }}
            >
              <Text style={{ fontSize: 15, fontWeight: '700', color: Colors.textPrimary }}>Take a Quick Tour</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={{ backgroundColor: Colors.surfaceCard, paddingVertical: 14, borderRadius: 12, alignItems: 'center', marginBottom: 10 }}
              onPress={() => { setShowWelcome(false); router.push('/explore-app' as any); }}
            >
              <Text style={{ fontSize: 15, fontWeight: '600', color: Colors.textPrimary }}>Explore Features</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={{ paddingVertical: 10, alignItems: 'center' }}
              onPress={() => setShowWelcome(false)}
            >
              <Text style={{ fontSize: 14, color: Colors.textMuted }}>Skip, I'll explore on my own</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
      {/* Coach Marks Overlay for new users */}
      <CoachMarksOverlay
        visible={showCoachMarks}
        onDismiss={() => setShowCoachMarks(false)}
      />
    </SafeAreaView>
    </ScreenErrorBoundary>
  );
}

// Favorite Teachers horizontal scroll section for home screen
function FavoriteTeachersSection() {
  const [favTeachers, setFavTeachers] = useState<Teacher[]>([]);
  useEffect(() => {
    const loadFavorites = async () => {
      try {
        const favs = await AsyncStorage.getItem("@favorite_teachers");
        if (favs) {
          const ids: string[] = JSON.parse(favs);
          if (ids.length > 0) {
            const allTeachers = getAllTeachers();
            const teachers = ids.map(id => allTeachers.find(t => t.id === id)).filter(Boolean) as Teacher[];
            setFavTeachers(teachers);
          }
        }
      } catch {}
    };
    loadFavorites();
  }, []);

  if (favTeachers.length === 0) return null;

  return (
    <View style={{ marginBottom: 12, paddingLeft: 16 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
        <Ionicons name="star" size={14} color={Colors.gold} />
        <Text style={{ fontSize: 13, fontWeight: '700', color: Colors.textPrimary, marginLeft: 6 }}>Favorite Teachers</Text>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingRight: 16 }}>
        {favTeachers.map(teacher => (
          <TouchableOpacity
            key={teacher.id}
            style={{ alignItems: 'center', width: 68 }}
            onPress={() => router.push({ pathname: '/teacher-profile', params: { teacherId: teacher.id } } as any)}
            activeOpacity={0.7}
          >
            <ExpoImage source={{ uri: teacher.photoUrl }} style={{ width: 52, height: 52, borderRadius: 26, borderWidth: 2, borderColor: Colors.gold }} />
            <Text style={{ fontSize: 10, fontWeight: '600', color: Colors.textPrimary, marginTop: 4, textAlign: 'center' }} numberOfLines={1}>{teacher.name.split(' ')[0]}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.md,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  logoGlow: {
    borderRadius: 14,
    shadowColor: Colors.glow,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 16,
    elevation: 14,
    // Double ring effect like the logo's blue halo
    borderWidth: 2,
    borderColor: Colors.glowBorder,
  },
  logo: {
    width: 46,
    height: 46,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.glowBorder,
  },
  appName: {
    fontSize: FontSize.lg,
    fontWeight: "800",
    color: Colors.textPrimary,
    letterSpacing: 0.5,
  },
  aiScript: {
    fontStyle: "italic",
    fontWeight: "300",
    fontSize: FontSize.md,
    color: "#FFFFFF",
  },
  tagline: {
    fontSize: 10,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  dndIndicator: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(99, 102, 241, 0.15)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(99, 102, 241, 0.3)",
  },
  notifBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surfaceCard,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 10,
    elevation: 8,
    position: "relative" as const,
  },
  notifBadge: {
    position: "absolute" as const,
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: Colors.accent,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  notifBadgeText: {
    fontSize: 9,
    fontWeight: "800",
    color: "#FFFFFF",
  },

  // Slang Card
  slangCard: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.surfaceCard,
    borderWidth: 1.5,
    borderColor: Colors.glowBorder,
    overflow: "hidden",
    shadowColor: Colors.glow,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 12,
  },
  slangGlowLine: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: Colors.gold,
    // Gold waveform-inspired top accent (like logo's amber bars)
    shadowColor: Colors.gold,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
  },
  slangHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  slangLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.secondary,
  },
  slangLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: Colors.textAccent,
    letterSpacing: 1,
  },
  slangBadge: {
    backgroundColor: Colors.glowSubtle,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.glowBorder,
  },
  slangBadgeText: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  slangWord: {
    fontSize: FontSize.xl,
    fontWeight: "800",
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  slangMeaning: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
  },
  slangPlayBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.glowSubtle,
    borderWidth: 1,
    borderColor: Colors.glowBorder,
  },
  slangPlayText: {
    fontSize: FontSize.sm,
    color: Colors.secondary,
    fontWeight: "600",
  },

  // Quick Actions
  quickActions: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  quickBtn: {
    alignItems: "center",
    gap: 6,
  },
  quickIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  quickLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: Colors.textSecondary,
  },
  // AI Agent icon - matches logo font style
  aiQuickIcon: {
    backgroundColor: "rgba(255, 184, 0, 0.08)",
    borderColor: Colors.goldBorder,
    borderWidth: 1.5,
    shadowColor: Colors.gold,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  aiQuickIconActive: {
    backgroundColor: "rgba(255, 184, 0, 0.20)",
    borderColor: Colors.gold,
    shadowOpacity: 0.8,
    shadowRadius: 14,
  },
  aiIconText: {
    fontSize: 26,
    fontFamily: "GreatVibes-Regular",
    color: Colors.gold,
    letterSpacing: 0,
  },
  aiIconTextActive: {
    color: "#FFFFFF",
    textShadowColor: Colors.gold,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },

  // Upgrade card
  upgradeCard: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
    padding: Spacing.md,
    backgroundColor: Colors.surfaceCard,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.goldBorder,
  },
  upgradeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  upgradeIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.goldGlow,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.goldBorder,
  },
  upgradeTitle: {
    fontSize: FontSize.md,
    fontWeight: "700",
    color: Colors.gold,
  },
  upgradeDesc: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },

  // Section titles
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: "700",
    color: Colors.textPrimary,
    paddingHorizontal: Spacing.lg,
    marginTop: Spacing.md,
  },
  sectionSub: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    marginTop: 2,
  },

  // Feature grid
  featureGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: Spacing.lg,
    gap: 10,
  },
  featureGridItem: {
    width: (width - 40 - 10) / 2,
    padding: Spacing.md,
    backgroundColor: Colors.surfaceCard,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 6,
    position: "relative",
  },
  featureGridItemLocked: {
    opacity: 0.7,
  },
  featureGridIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  featureGridTitle: {
    fontSize: FontSize.sm,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  featureGridDesc: {
    fontSize: 10,
    color: Colors.textSecondary,
    lineHeight: 14,
  },
  lockBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.05)",
    alignItems: "center",
    justifyContent: "center",
  },

  // Explore grid
  exploreGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: Spacing.lg,
    gap: 12,
  },
  exploreItem: {
    width: (width - 40 - 36) / 4,
    alignItems: "center",
    gap: 5,
  },
  exploreIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    position: "relative",
  },
  exploreLock: {
    position: "absolute",
    bottom: -2,
    right: -2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: Colors.surfaceCard,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  exploreLabel: {
    fontSize: 10,
    fontWeight: "600",
    color: Colors.textSecondary,
    textAlign: "center",
  },
  exploreCategoryBlock: {
    marginTop: 12,
  },
  exploreCategoryHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    marginBottom: 8,
    gap: 6,
  },
  exploreCategoryTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.textPrimary,
    flex: 1,
  },
  exploreCategoryCount: {
    fontSize: 11,
    fontWeight: "600",
    color: Colors.textMuted,
    backgroundColor: Colors.surfaceCard,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    overflow: "hidden",
  },
  showMoreBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    marginHorizontal: Spacing.lg,
    marginTop: 8,
    gap: 6,
    backgroundColor: Colors.primary + "10",
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.primary + "30",
  },
  showMoreText: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.primary,
  },

  // Search Bar
  searchContainer: {
    marginHorizontal: 16,
    marginBottom: 12,
  },
  searchBar: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    backgroundColor: Colors.surfaceCard,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: Colors.textPrimary,
    padding: 0,
  },
  searchResults: {
    marginTop: 8,
    backgroundColor: Colors.surfaceCard,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: "hidden" as const,
  },
  searchResultItem: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border + "40",
    gap: 10,
  },
  searchResultIcon: {
    fontSize: 18,
  },
  searchResultLabel: {
    flex: 1,
    fontSize: 14,
    color: Colors.textPrimary,
    fontWeight: "500" as const,
  },
  searchNoResults: {
    padding: 16,
    textAlign: "center" as const,
    fontSize: 13,
    color: Colors.textMuted,
  },

  // New User Welcome
  newUserWelcome: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 24,
    backgroundColor: Colors.surfaceCard,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: Colors.accent + "30",
    alignItems: "center" as const,
  },
  newUserIconRow: {
    marginBottom: 12,
  },
  newUserIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.accent + "15",
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  newUserTitle: {
    fontSize: 20,
    fontWeight: "700" as const,
    color: Colors.textPrimary,
    marginBottom: 6,
  },
  newUserSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 20,
    textAlign: "center" as const,
  },
  newUserActions: {
    width: "100%" as const,
    gap: 10,
  },
  newUserActionBtn: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 14,
    gap: 10,
  },
  newUserActionText: {
    fontSize: 15,
    fontWeight: "600" as const,
    color: "#fff",
  },
  newUserDismiss: {
    marginTop: 16,
    paddingVertical: 8,
  },
  newUserDismissText: {
    fontSize: 13,
    color: Colors.textSecondary,
    textDecorationLine: "underline" as const,
  },

  // Progress Card
  progressCard: {
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.xl,
    padding: Spacing.lg,
    backgroundColor: Colors.surfaceCard,
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5,
    borderColor: Colors.glowBorder,
    // Neon blue ring glow (logo halo)
    shadowColor: Colors.glow,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  progressTitle: {
    fontSize: 11,
    fontWeight: "800",
    color: Colors.textAccent,
    letterSpacing: 1,
    marginBottom: Spacing.md,
  },
  progressRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
  },
  progressItem: {
    alignItems: "center",
    gap: 4,
  },
  progressNum: {
    fontSize: FontSize.xl,
    fontWeight: "800",
    color: Colors.textPrimary,
  },
  progressLabel: {
    fontSize: 10,
    color: Colors.textSecondary,
    fontWeight: "600",
  },
  progressDivider: {
    width: 1,
    height: 30,
    backgroundColor: Colors.border,
  },

  // Video Hero
  videoHero: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    borderRadius: BorderRadius.xl,
    backgroundColor: Colors.surfaceElevated,
    borderWidth: 1.5,
    borderColor: Colors.glowBorder,
    overflow: "hidden",
    shadowColor: Colors.glow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 10,
  },
  videoHeroOverlay: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  videoHeroBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: Colors.accent + "20",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 6,
    marginBottom: 14,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.accent,
  },
  videoHeroBadgeText: {
    fontSize: 10,
    fontWeight: "800",
    color: Colors.accent,
    letterSpacing: 0.5,
  },
  videoHeroContent: {
    gap: 6,
  },
  videoHeroTitle: {
    fontSize: FontSize.xl,
    fontWeight: "800",
    color: Colors.textPrimary,
    lineHeight: 28,
  },
  videoHeroSub: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 18,
    marginBottom: 12,
  },
  videoHeroActions: {
    flexDirection: "row",
    gap: 12,
  },
  videoHeroPlayBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.secondary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 6,
  },
  videoHeroPlayText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#060912",
  },
  videoHeroSecBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.secondary + "15",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.secondary + "40",
    gap: 6,
  },
  videoHeroSecText: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.secondary,
  },
  videoHeroGradientBar: {
    height: 3,
    backgroundColor: Colors.secondary,
    opacity: 0.6,
  },

  // Watch Tour collapsed button
  watchTourBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    paddingVertical: 10,
    backgroundColor: Colors.glowSubtle,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  watchTourText: {
    fontSize: FontSize.sm,
    fontWeight: "600",
    color: Colors.secondary,
  },
  videoHeroCloseBtn: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },

  // Social Translate Banner
  socialTranslateBanner: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
    padding: Spacing.md,
    backgroundColor: Colors.surfaceCard,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: "rgba(228, 64, 95, 0.25)",
    gap: 12,
  },
  socialBannerIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: "rgba(228, 64, 95, 0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  socialBannerTitle: {
    fontSize: FontSize.md,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  socialBannerDesc: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },

  // Streak Counter
  streakCard: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    backgroundColor: Colors.surfaceCard,
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.gold + "40",
    shadowColor: Colors.gold,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  streakFire: {
    fontSize: 32,
    marginRight: 12,
  },
  streakInfo: {
    flex: 1,
  },
  streakCount: {
    fontSize: FontSize.lg,
    fontWeight: "800",
    color: Colors.gold,
  },
  streakSub: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  streakBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.gold + "20",
    alignItems: "center",
    justifyContent: "center",
  },
  streakBadgeText: {
    fontSize: 18,
  },

  // Streak Rewards
  streakRewardsCard: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    backgroundColor: Colors.surfaceCard,
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.gold + "30",
  },
  streakRewardsTitle: {
    fontSize: FontSize.md,
    fontWeight: "700",
    color: Colors.textPrimary,
    marginBottom: 10,
  },
  streakMilestones: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  milestone: {
    alignItems: "center",
    flex: 1,
    padding: 8,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.primary + "60",
    marginHorizontal: 3,
  },
  milestoneUnlocked: {
    backgroundColor: Colors.gold + "20",
    borderWidth: 1,
    borderColor: Colors.gold + "50",
  },
  milestoneEmoji: {
    fontSize: 20,
    marginBottom: 4,
  },
  milestoneDay: {
    fontSize: FontSize.xs,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  milestoneReward: {
    fontSize: 10,
    color: Colors.gold,
    fontWeight: "600",
    marginTop: 2,
  },
  streakProgressRow: {
    gap: 6,
  },
  streakProgressBg: {
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.primary + "60",
    overflow: "hidden",
  },
  streakProgressFill: {
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.gold,
  },
  streakProgressLabel: {
    fontSize: 10,
    color: Colors.textSecondary,
    textAlign: "center",
  },

  // Usage Quick Access Card
  usageQuickCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.sm,
    backgroundColor: Colors.surfaceCard,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  usageQuickLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  usageQuickTitle: {
    fontSize: FontSize.sm,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  usageQuickSub: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },

  // Milestones Progress Indicator
  milestonesIndicator: {
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.sm,
    backgroundColor: Colors.surfaceCard,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.greenBorder,
  },
  milestonesIndicatorLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: Spacing.sm,
  },
  milestonesIndicatorEmoji: {
    fontSize: 20,
  },
  milestonesIndicatorTitle: {
    fontSize: FontSize.md,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  milestonesIndicatorSub: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  milestonesIndicatorBar: {
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(0, 255, 136, 0.12)",
    overflow: "hidden",
  },
  milestonesIndicatorBarFill: {
    height: "100%",
    borderRadius: 3,
    backgroundColor: Colors.success,
  },

  // Daily Challenge
  dailyChallengeCard: {
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.md,
    backgroundColor: Colors.surfaceCard,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.secondary + "40",
  },
  dailyChallengeHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: Spacing.sm,
  },
  dailyChallengeEmoji: {
    fontSize: 24,
  },
  dailyChallengeTitle: {
    fontSize: FontSize.md,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  dailyChallengeSub: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  dailyChallengeTimer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: Colors.gold + "20",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  dailyChallengeTimerText: {
    fontSize: 11,
    fontWeight: "600",
    color: Colors.gold,
  },
  dailyChallengeBody: {
    gap: Spacing.sm,
  },
  dailyChallengeTask: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: Colors.primary + "30",
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  dailyChallengeTaskTitle: {
    fontSize: FontSize.sm,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  dailyChallengeTaskDesc: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  dailyChallengeBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: Colors.secondary,
    paddingVertical: 12,
    borderRadius: BorderRadius.md,
  },
  dailyChallengeBtnText: {
    fontSize: FontSize.sm,
    fontWeight: "700",
    color: "#fff",
  },
  dailyChallengeCompleted: {
    borderColor: Colors.greenBorder,
    opacity: 0.85,
  },
  dailyChallengeCompletedBadge: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.greenGlow,
    paddingVertical: 12,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.greenBorder,
  },
  dailyChallengeCompletedText: {
    fontSize: FontSize.sm,
    fontWeight: "700",
    color: Colors.success,
  },

  // SRS Review Card
  srsReviewCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
    backgroundColor: "rgba(0, 170, 255, 0.08)",
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: "rgba(0, 170, 255, 0.25)",
    padding: Spacing.md,
  },
  srsReviewLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  srsReviewIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0, 170, 255, 0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  srsReviewTitle: {
    fontSize: FontSize.sm,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  srsReviewSub: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  srsReviewBadge: {
    backgroundColor: "#00AAFF",
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
  },
  srsReviewBadgeText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#FFFFFF",
  },

  // Daily Phoneme Challenge
  phonemeChallengeCard: {
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.md,
    backgroundColor: "rgba(6, 182, 212, 0.08)",
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: "rgba(6, 182, 212, 0.25)",
    padding: Spacing.md,
  },
  phonemeChallengeHeader: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 10,
    marginBottom: 10,
  },
  phonemeChallengeIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(6, 182, 212, 0.15)",
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  phonemeChallengeTitle: {
    fontSize: FontSize.sm,
    fontWeight: "700" as const,
    color: Colors.textPrimary,
  },
  phoneChallengeSub: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  phonemeChallengeBody: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "space-between" as const,
  },
  phonemeChallengeInfo: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 8,
  },
  phonemeChallengeSymbol: {
    fontSize: 22,
    fontWeight: "700" as const,
    color: "#06B6D4",
  },
  phoneChallengeLang: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    backgroundColor: "rgba(6, 182, 212, 0.12)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    overflow: "hidden" as const,
  },
  phonemeChallengeBtn: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 6,
    backgroundColor: "#06B6D4",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  phonemeChallengeBtnText: {
    fontSize: FontSize.xs,
    fontWeight: "700" as const,
    color: "#FFFFFF",
  },

  // Learning Pace Tracker
  paceTrackerCard: {
    backgroundColor: Colors.surfaceCard,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginTop: 12,
    borderWidth: 1,
    borderColor: "#10B981" + "30",
  },
  paceTrackerHeader: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 12,
    marginBottom: 12,
  },
  paceTrackerIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#10B981" + "20",
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  paceTrackerTitle: {
    fontSize: FontSize.md,
    fontWeight: "700" as const,
    color: Colors.textPrimary,
  },
  paceTrackerSub: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  paceStatusBadge: {
    backgroundColor: "#10B981" + "20",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  paceStatusText: {
    fontSize: 11,
    fontWeight: "700" as const,
    color: "#10B981",
  },
  paceProgressRow: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 10,
    marginBottom: 12,
  },
  paceProgressBg: {
    flex: 1,
    height: 6,
    backgroundColor: Colors.border,
    borderRadius: 3,
  },
  paceProgressFill: {
    height: 6,
    backgroundColor: "#10B981",
    borderRadius: 3,
  },
  paceProgressPct: {
    fontSize: 12,
    fontWeight: "700" as const,
    color: "#10B981",
  },
  paceStatsRow: {
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
  },
  paceStat: {
    alignItems: "center" as const,
  },
  paceStatValue: {
    fontSize: FontSize.sm,
    fontWeight: "700" as const,
    color: Colors.textPrimary,
  },
  paceStatLabel: {
    fontSize: 10,
    color: Colors.textMuted,
    marginTop: 2,
  },
  paceQuickLinks: {
    flexDirection: "row",
    gap: 10,
    marginTop: 10,
  },
  paceQuickLink: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#141B2D",
    borderRadius: 10,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "#1E293B",
  },
  paceQuickLinkText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#94A3B8",
  },

  // Floating Action Button
  fab: {
    position: "absolute",
    bottom: 90,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.secondary,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: Colors.secondary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
    zIndex: 100,
  },
  fabOpen: {
    backgroundColor: Colors.accent,
  },
  fabBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    backgroundColor: Colors.accent,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  fabBadgeText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  fabAction: {
    position: "absolute",
    bottom: 90,
    right: 20,
    flexDirection: "row",
    alignItems: "center",
    zIndex: 99,
  },
  fabActionBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  fabActionBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    backgroundColor: "#FF3B30",
    borderRadius: 9,
    minWidth: 18,
    height: 18,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  fabActionBadgeText: {
    fontSize: 9,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  fabActionLabel: {
    position: "absolute",
    right: 54,
    backgroundColor: Colors.surfaceCard,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.md,
    fontSize: FontSize.xs,
    fontWeight: "600",
    color: Colors.textPrimary,
    overflow: "hidden",
  },

  // Learning Hub
  learningHubSection: {
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  learningHubGrid: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    marginHorizontal: Spacing.lg,
    backgroundColor: Colors.surfaceCard,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  learningHubItem: {
    alignItems: "center",
    gap: 6,
  },
  learningHubLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: Colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  learningHubPending: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    textAlign: "center",
    marginTop: Spacing.sm,
    fontStyle: "italic",
  },
  welcomeOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 999,
    paddingHorizontal: 24,
  },
  welcomeCard: {
    backgroundColor: Colors.surfaceCard,
    borderRadius: 20,
    padding: 28,
    width: "100%",
    maxWidth: 340,
    borderWidth: 1,
    borderColor: Colors.border,
  },
});
