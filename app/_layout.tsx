import "@/global.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack, router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "react-native-reanimated";
import { Platform } from "react-native";
import { useFonts } from "expo-font";
import "@/lib/_core/nativewind-pressable";
import { ThemeProvider } from "@/lib/theme-provider";
import {
  SafeAreaFrameContext,
  SafeAreaInsetsContext,
  SafeAreaProvider,
  initialWindowMetrics,
} from "react-native-safe-area-context";
import type { EdgeInsets, Metrics, Rect } from "react-native-safe-area-context";
import { trpc, createTRPCClient } from "@/lib/trpc";
import { initManusRuntime, subscribeSafeAreaInsets } from "@/lib/_core/manus-runtime";
import { PipProvider } from "@/lib/pip-context";
import { AgentProvider } from "@/lib/agent-context";
import { I18nProvider } from "@/lib/i18n";
import { WhatsNewModal } from "@/components/whats-new-modal";
import { UsageProvider } from "@/lib/usage-context";
import { AppLockProvider } from "@/lib/app-lock";
import { AssessmentModeProvider } from "@/lib/assessment-mode";
import { NotificationBadgeProvider } from "@/lib/notification-badges";
import { NotificationSchedulerProvider } from "@/lib/notification-scheduler";
import { CultureModeProvider } from "@/lib/culture-mode";
import { SavedCollectionsProvider } from "@/lib/saved-collections";
import { PlaylistProvider } from "@/lib/playlist-store";
import { MusicPlayerProvider } from "@/lib/music-player-context";
import { TabOrderProvider } from "@/lib/tab-order-context";
import { MiniPlayer } from "@/components/mini-player";
import { LowBalanceToast } from "@/components/low-balance-toast";
import { scheduleWeeklySummaryNotification } from "@/lib/weekly-summary";
import { scheduleExpirationNotification } from "@/lib/expiration-notification";
import { scheduleMilestoneReminder } from "@/lib/milestone-reminder";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { canSkipOnboarding } from "@/lib/admin-access";
import { MilestoneToast } from "@/components/milestone-toast";
import { StreakSavedToast } from "@/components/streak-saved-toast";
import { RateLimitToast } from "@/components/rate-limit-toast";
import { ExpirationWarning } from "@/components/expiration-warning";
import { useUsage } from "@/lib/usage-context";
import { AnimatedSplash } from "@/components/animated-splash";
import * as SplashScreen from "expo-splash-screen";
import { ErrorBoundary } from "@/components/error-boundary";
import { initializeRevenueCat } from "@/lib/revenuecat";
import { registerForPushNotifications, getDevicePlatform, getDeviceName } from "@/lib/notifications";
import { initializeCallNotifications } from "@/lib/incoming-call-handler";
import { initGrammarStreakNotifications } from "@/lib/grammar-streak-notifications";
import { scheduleTeacherTexts, getTeacherTextPrefs } from "@/lib/teacher-texts-engine";
import { scheduleSurpriseLessonCheck, recordAppOpen } from "@/lib/surprise-lesson-notifications";
import { scheduleDailyChallengeNotification, getDailyChallengeNotifPrefs } from "@/lib/daily-challenge-notifications";
import { initJournalPromptNotification } from "@/lib/journal-prompt-notification";
import { initSlangOfDayNotification } from "@/lib/slang-of-the-day-notification";
import { handleChallengeNotificationTap } from "@/lib/challenge-notifications";
import { checkAndRescheduleDailyCulturalPush } from "@/lib/cultural-feed-notifications";
import { initInviteDeepLinkHandler, processPendingInvite } from "@/lib/deep-link-invite-handler";
import { initNotificationDeepLinking } from "@/lib/notification-deep-link";
import { initStreakNotifications } from "@/lib/streak-notifications";
import { trpc as trpcVanilla } from "@/lib/trpc";
import { setAudioModeAsync } from "expo-audio";

// Prevent native splash from auto-hiding so we control the transition
SplashScreen.preventAutoHideAsync();

const DEFAULT_WEB_INSETS: EdgeInsets = { top: 0, right: 0, bottom: 0, left: 0 };
const DEFAULT_WEB_FRAME: Rect = { x: 0, y: 0, width: 0, height: 0 };

export const unstable_settings = {
  anchor: "(tabs)",
};

// Wrapper component that uses useUsage inside the provider tree
function MilestoneToastWrapper() {
  const { milestoneAchieved, dismissMilestone } = useUsage();
  return <MilestoneToast milestone={milestoneAchieved} onDismiss={dismissMilestone} />;
}

function StreakSavedToastWrapper() {
  const { streakToastVisible, streakToastCount, dismissStreakToast } = useUsage();
  return <StreakSavedToast visible={streakToastVisible} streakCount={streakToastCount} onDismiss={dismissStreakToast} />;
}

function RateLimitToastWrapper() {
  const { rateLimitVisible, rateLimitRetryAfter, dismissRateLimitToast } = useUsage();
  return <RateLimitToast visible={rateLimitVisible} retryAfterSeconds={rateLimitRetryAfter} onDismiss={dismissRateLimitToast} />;
}

const TRANSLATOR_SETUP_SHOWN_KEY = "@connectworld_translator_setup_shown";
const AUTH_LOGGED_IN_KEY = "@auth_logged_in";
const ONBOARDING_COMPLETE_KEY = "@onboarding_complete";

export default function RootLayout() {
  const [showAnimatedSplash, setShowAnimatedSplash] = useState(true);
  const hasCheckedFirstLaunch = useRef(false);
  const hasCheckedAuth = useRef(false);

  // Hide native splash once our animated one is ready to show
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  // AUTH GATE: Check if user is logged in + onboarded, redirect if not
  useEffect(() => {
    if (showAnimatedSplash || hasCheckedAuth.current) return;
    hasCheckedAuth.current = true;
    
    const checkAuth = async () => {
      try {
        const loggedIn = await AsyncStorage.getItem(AUTH_LOGGED_IN_KEY);
        const onboarded = await AsyncStorage.getItem(ONBOARDING_COMPLETE_KEY);
        
        if (!loggedIn) {
          // Not logged in — force signup
          setTimeout(() => router.replace("/signup" as any), 100);
          return;
        }
        
        if (!onboarded) {
          // GUARDRAIL: Check if admin can bypass onboarding
          const adminBypass = await canSkipOnboarding();
          if (adminBypass) {
            // Admin bypass — mark as onboarded
            await AsyncStorage.setItem(ONBOARDING_COMPLETE_KEY, "true");
          } else {
            // Regular user must complete onboarding — cannot skip
            setTimeout(() => router.replace("/onboarding" as any), 100);
            return;
          }
        }
        
        // Logged in + onboarded — show translator setup for first time
        const translatorShown = await AsyncStorage.getItem(TRANSLATOR_SETUP_SHOWN_KEY);
        if (!translatorShown) {
          await AsyncStorage.setItem(TRANSLATOR_SETUP_SHOWN_KEY, "true");
          setTimeout(() => router.push("/translator-setup" as any), 600);
        }
      } catch (e) {
        // On error, let them through
      }
    };
    checkAuth();
  }, [showAnimatedSplash]);

  // Load custom script/signature fonts for "ai" branding (matches logo)
  useFonts({
    "DancingScript-Regular": require("../assets/fonts/DancingScript-Regular.otf"),
    "DancingScript-Bold": require("../assets/fonts/DancingScript-Bold.ttf"),
    "AlexBrush-Regular": require("../assets/fonts/AlexBrush-Regular.ttf"),
    "GreatVibes-Regular": require("../assets/fonts/GreatVibes-Regular.ttf"),
  });

  const initialInsets = initialWindowMetrics?.insets ?? DEFAULT_WEB_INSETS;
  const initialFrame = initialWindowMetrics?.frame ?? DEFAULT_WEB_FRAME;
  const [insets, setInsets] = useState<EdgeInsets>(initialInsets);
  const [frame, setFrame] = useState<Rect>(initialFrame);

  useEffect(() => {
    initManusRuntime();
    initializeRevenueCat(); // Initialize RevenueCat for in-app purchases
    // CRITICAL: Enable audio playback in iOS silent mode globally
    if (Platform.OS !== "web") {
      setAudioModeAsync({ playsInSilentMode: true }).catch(() => {});
    }
    // Initialize incoming call notification handler (vibration, deep-link, foreground handling)
    const cleanupCallNotifications = initializeCallNotifications();
    // Register push token and sync to server
    registerForPushNotifications().then((token) => {
      if (token) {
        // Sync token to server (fire-and-forget, non-blocking)
        const platform = getDevicePlatform();
        const deviceName = getDeviceName();
        fetch(`${process.env.EXPO_PUBLIC_API_BASE_URL || ""}/api/push-token`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token, platform, deviceName }),
        }).catch(() => {}); // Silent fail - will retry next app launch
      }
    }).catch(() => {});
    scheduleWeeklySummaryNotification();
    scheduleMilestoneReminder();
    initGrammarStreakNotifications();
    // Initialize daily practice streak reminder notifications
    initStreakNotifications().catch(() => {});
    // Auto-schedule daily challenge push notification on app start
    getDailyChallengeNotifPrefs().then((prefs) => {
      if (prefs.enabled) {
        scheduleDailyChallengeNotification().catch(() => {});
      }
    }).catch(() => {});
    // Schedule daily cultural intelligence push notifications
    AsyncStorage.getItem("@selected_language").then((lang) => {
      checkAndRescheduleDailyCulturalPush(lang || "es").catch(() => {});
    }).catch(() => {});
    // Initialize deep link invite handler for duel/friend/study/referral invites
    const cleanupInviteHandler = initInviteDeepLinkHandler();
    // Initialize notification deep-linking (tapping notifications routes to target screens)
    const cleanupNotificationDeepLink = initNotificationDeepLinking();
    // Schedule teacher text notifications on app start
    getTeacherTextPrefs().then((prefs) => {
      if (prefs.enabled) {
        scheduleTeacherTexts().catch(() => {});
      }
    }).catch(() => {});
    // Schedule journal prompt-of-the-day notification
    initJournalPromptNotification().catch(() => {});
    initSlangOfDayNotification().catch(() => {});
    // Schedule surprise lesson inactivity check notifications
    scheduleSurpriseLessonCheck().catch(() => {});
    // Record app open for inactivity tracking
    recordAppOpen().catch(() => {});
    // Schedule credit expiration notification based on billing cycle
    AsyncStorage.getItem("@connectworld_usage_data").then((data) => {
      if (data) {
        const usage = JSON.parse(data);
        if (usage.billingCycleEnd) {
          scheduleExpirationNotification(usage.billingCycleEnd);
        }
      }
    }).catch(() => {});
    return () => {
      cleanupCallNotifications();
      cleanupInviteHandler();
      cleanupNotificationDeepLink();
    };
  }, []);

  const handleSafeAreaUpdate = useCallback((metrics: Metrics) => {
    setInsets(metrics.insets);
    setFrame(metrics.frame);
  }, []);

  useEffect(() => {
    if (Platform.OS !== "web") return;
    const unsubscribe = subscribeSafeAreaInsets(handleSafeAreaUpdate);
    return () => unsubscribe();
  }, [handleSafeAreaUpdate]);

  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      }),
  );
  const [trpcClient] = useState(() => createTRPCClient());

  const providerInitialMetrics = useMemo(() => {
    const metrics = initialWindowMetrics ?? { insets: initialInsets, frame: initialFrame };
    return {
      ...metrics,
      insets: {
        ...metrics.insets,
        top: Math.max(metrics.insets.top, 16),
        bottom: Math.max(metrics.insets.bottom, 12),
      },
    };
  }, [initialInsets, initialFrame]);

  const content = (
    <ErrorBoundary>
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: "#060912" }}>
<AppLockProvider>
      <NotificationSchedulerProvider>
      <NotificationBadgeProvider>
        <UsageProvider>
          <CultureModeProvider>
          <I18nProvider>
      <AssessmentModeProvider>
      <SavedCollectionsProvider>
      <TabOrderProvider>
      <MusicPlayerProvider>
      <PlaylistProvider>
      <AgentProvider>
      <PipProvider>
      <trpc.Provider client={trpcClient} queryClient={queryClient}>
        <QueryClientProvider client={queryClient}>
          <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: "#060912" } }}>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="oauth/callback" />
            <Stack.Screen name="onboarding" options={{ headerShown: false }} />
            <Stack.Screen name="explore-app" options={{ headerShown: false }} />
            <Stack.Screen name="saved-collections" options={{ headerShown: false }} />
            <Stack.Screen name="choose-teacher" options={{ headerShown: false }} />
            <Stack.Screen name="permissions-setup" options={{ headerShown: false }} />
            <Stack.Screen name="voice-settings" options={{ headerShown: false }} />
            <Stack.Screen name="virtual-classroom" options={{ headerShown: false, presentation: "fullScreenModal" }} />
            <Stack.Screen name="class-invite" options={{ headerShown: false }} />
            <Stack.Screen name="cloudwave-guide" options={{ headerShown: false }} />
            <Stack.Screen name="song-player" options={{ presentation: "modal" }} />
            <Stack.Screen name="voice-call" options={{ presentation: "fullScreenModal" }} />
            <Stack.Screen name="upload-song" />
            <Stack.Screen name="subscription" options={{ presentation: "modal" }} />
            <Stack.Screen name="classroom" options={{ presentation: "fullScreenModal" }} />
            <Stack.Screen name="class-schedule" />
            <Stack.Screen name="vacation-mode" />
            <Stack.Screen name="battle-mode" />
            <Stack.Screen name="pen-pal" />
            <Stack.Screen name="quiz-test" options={{ headerShown: false }} />
            <Stack.Screen name="voice-filter" />
            <Stack.Screen name="time-capsule" />
            <Stack.Screen name="decode-mode" />
            <Stack.Screen name="lesson-detail" />
            <Stack.Screen name="watch-learn" />
            <Stack.Screen name="url-translate" />
            <Stack.Screen name="video-translate" />
            <Stack.Screen name="video-dub-history" />
            <Stack.Screen name="lessons" />
            <Stack.Screen name="studio" options={{ presentation: "fullScreenModal" }} />
            <Stack.Screen name="video-call" options={{ presentation: "fullScreenModal" }} />
            <Stack.Screen name="video-message" options={{ presentation: "modal" }} />
            <Stack.Screen name="call-translator" options={{ presentation: "modal" }} />
            <Stack.Screen name="interpreter" options={{ presentation: "modal" }} />
            <Stack.Screen name="language-pack" options={{ presentation: "modal" }} />
            <Stack.Screen name="social-translate" options={{ presentation: "modal" }} />
            <Stack.Screen name="explore-detail" options={{ headerShown: false }} />
            <Stack.Screen name="song-cover" options={{ presentation: "fullScreenModal" }} />
            <Stack.Screen name="practice-pronunciation" options={{ presentation: "modal" }} />
            <Stack.Screen name="settings" options={{ headerShown: false }} />
            <Stack.Screen name="jobs" options={{ headerShown: false }} />
            <Stack.Screen name="notifications" options={{ headerShown: false }} />
            <Stack.Screen name="qr-code" options={{ headerShown: false }} />
            <Stack.Screen name="transaction-history" options={{ headerShown: false }} />
            <Stack.Screen name="favorites" options={{ headerShown: false }} />
            <Stack.Screen name="leaderboard" options={{ headerShown: false }} />
            <Stack.Screen name="usage-dashboard" options={{ headerShown: false }} />
            <Stack.Screen name="buy-credits" options={{ presentation: "modal" }} />
            <Stack.Screen name="milestones" options={{ headerShown: false }} />
            <Stack.Screen name="referral" options={{ headerShown: false }} />
            <Stack.Screen name="weekly-recap" options={{ headerShown: false }} />
            <Stack.Screen name="friends-activity" options={{ headerShown: false }} />
            <Stack.Screen name="badges" options={{ headerShown: false }} />
            <Stack.Screen name="friends" options={{ headerShown: false }} />
            <Stack.Screen name="name-recording" options={{ headerShown: false }} />
            <Stack.Screen name="qr-connect" options={{ headerShown: false }} />
            <Stack.Screen name="course-detail" options={{ headerShown: false }} />
            <Stack.Screen name="cert-path" options={{ headerShown: false }} />
            <Stack.Screen name="course-catalog" options={{ headerShown: false }} />
            <Stack.Screen name="course-library" options={{ headerShown: false }} />
            <Stack.Screen name="lesson-player" options={{ headerShown: false }} />
            <Stack.Screen name="my-certificates" options={{ headerShown: false }} />
            <Stack.Screen name="saved-lessons" options={{ headerShown: false }} />
            <Stack.Screen name="instructor-bio" options={{ headerShown: false }} />
            <Stack.Screen name="streak-calendar" options={{ headerShown: false }} />
            <Stack.Screen name="calendar" options={{ headerShown: false }} />
            <Stack.Screen name="marketing-studio" options={{ headerShown: false }} />
            <Stack.Screen name="flashcard-review" options={{ headerShown: false }} />
            <Stack.Screen name="pronunciation-practice" options={{ headerShown: false }} />
            <Stack.Screen name="custom-deck" options={{ headerShown: false }} />
            <Stack.Screen name="class-recaps" options={{ headerShown: false }} />
            <Stack.Screen name="membership" options={{ headerShown: false }} />
            <Stack.Screen name="login" options={{ headerShown: false }} />
            <Stack.Screen name="signup" options={{ headerShown: false }} />
            <Stack.Screen name="payment-flow" options={{ presentation: "modal" }} />
            <Stack.Screen name="offline-content" options={{ headerShown: false }} />
            <Stack.Screen name="ai-chat" options={{ headerShown: false }} />
            <Stack.Screen name="social-hub" options={{ headerShown: false }} />
            <Stack.Screen name="message-compose" options={{ headerShown: false }} />
            <Stack.Screen name="progress-dashboard" options={{ headerShown: false }} />
            <Stack.Screen name="daily-goals" options={{ headerShown: false }} />
            <Stack.Screen name="weekly-digest" options={{ headerShown: false }} />
            <Stack.Screen name="streak-protection" options={{ headerShown: false }} />
            <Stack.Screen name="home-customize" options={{ presentation: "modal" }} />
            <Stack.Screen name="vocabulary-battle" options={{ headerShown: false }} />
            <Stack.Screen name="studio-hub" options={{ headerShown: false }} />
            <Stack.Screen name="library" options={{ headerShown: false }} />
            <Stack.Screen name="notification-settings" options={{ headerShown: false }} />
            <Stack.Screen name="call-screen" options={{ headerShown: false, presentation: "fullScreenModal" }} />
            <Stack.Screen name="quiz-center" options={{ headerShown: false }} />
            <Stack.Screen name="wavy-eq-studio" options={{ headerShown: false, presentation: "fullScreenModal" }} />
            <Stack.Screen name="live-simulation" options={{ headerShown: false }} />
            <Stack.Screen name="submissions-history" options={{ headerShown: false }} />
            <Stack.Screen name="placement-test" options={{ headerShown: false }} />
            <Stack.Screen name="lesson-path" options={{ headerShown: false }} />
            <Stack.Screen name="lesson-exercise" options={{ headerShown: false }} />
            <Stack.Screen name="visual-association-exercise" options={{ headerShown: false }} />
            <Stack.Screen name="whiteboard-lesson" options={{ headerShown: false }} />
            <Stack.Screen name="certification-progress" options={{ headerShown: false }} />
            <Stack.Screen name="cultural-feed" options={{ headerShown: false }} />
            <Stack.Screen name="payment-setup" options={{ headerShown: false }} />
            <Stack.Screen name="privacy-policy" options={{ headerShown: false }} />
            <Stack.Screen name="terms-of-service" options={{ headerShown: false }} />
            <Stack.Screen name="lyrics-player" options={{ headerShown: false, presentation: "fullScreenModal" }} />
            <Stack.Screen name="voice-clone-training" options={{ headerShown: false, presentation: "fullScreenModal" }} />
            <Stack.Screen name="voice-clone-studio" options={{ headerShown: false, presentation: "fullScreenModal" }} />
            <Stack.Screen name="sleep-sounds" options={{ headerShown: false, presentation: "fullScreenModal" }} />
            <Stack.Screen name="tab-reorder" options={{ headerShown: false, presentation: "modal" }} />
            <Stack.Screen name="srs-review" options={{ headerShown: false, presentation: "fullScreenModal" }} />
            <Stack.Screen name="learning-goal-setup" options={{ headerShown: false, presentation: "fullScreenModal" }} />
            <Stack.Screen name="goal-adjustment" options={{ headerShown: false, presentation: "fullScreenModal" }} />
            <Stack.Screen name="smart-schedule" options={{ headerShown: false }} />
            <Stack.Screen name="streak-recovery" options={{ headerShown: false, presentation: "fullScreenModal" }} />
            <Stack.Screen name="study-buddy" options={{ headerShown: false }} />
            <Stack.Screen name="progress-milestones" options={{ headerShown: false }} />
            <Stack.Screen name="coach-mode" options={{ headerShown: false }} />
            <Stack.Screen name="call-scorecard" options={{ headerShown: false }} />
            <Stack.Screen name="call-history" options={{ headerShown: false }} />
            <Stack.Screen name="creator-studio" options={{ headerShown: false }} />
            <Stack.Screen name="surprise-call" options={{ headerShown: false, presentation: "fullScreenModal" }} />
            <Stack.Screen name="pronunciation-drill" options={{ headerShown: false }} />
            <Stack.Screen name="homework" options={{ headerShown: false }} />
            <Stack.Screen name="travel-phrasebook" options={{ headerShown: false }} />
            <Stack.Screen name="passport-stamps" options={{ headerShown: false }} />
            <Stack.Screen name="street-cred" options={{ headerShown: false }} />
            <Stack.Screen name="song-lesson-breakdown" options={{ headerShown: false }} />
            <Stack.Screen name="sing-along" options={{ headerShown: false }} />
            <Stack.Screen name="artist-portal" options={{ headerShown: false }} />
            <Stack.Screen name="scorecard-compare" options={{ headerShown: false }} />
            <Stack.Screen name="creator-upload" options={{ headerShown: false }} />
            <Stack.Screen name="checkout" options={{ headerShown: false, presentation: "fullScreenModal" }} />
            <Stack.Screen name="connections" options={{ headerShown: false }} />
            <Stack.Screen name="language-preferences" options={{ headerShown: false }} />
            <Stack.Screen name="connection-profile" options={{ headerShown: false }} />
            <Stack.Screen name="quick-match" options={{ headerShown: false, presentation: "fullScreenModal" }} />
            <Stack.Screen name="conversation-summary" options={{ headerShown: false }} />
            <Stack.Screen name="privacy-settings" options={{ headerShown: false }} />
            <Stack.Screen name="user-profile" options={{ headerShown: false }} />
            <Stack.Screen name="discover-people" options={{ headerShown: false }} />
            <Stack.Screen name="stories" options={{ headerShown: false, presentation: "fullScreenModal" }} />
            <Stack.Screen name="watch-party" options={{ headerShown: false }} />
            <Stack.Screen name="translation-hub" options={{ headerShown: false }} />
            <Stack.Screen name="live-call-translation" options={{ headerShown: false }} />
            <Stack.Screen name="live-translate" options={{ headerShown: false }} />
            <Stack.Screen name="translate-popup" options={{ headerShown: false, presentation: "modal" }} />
            <Stack.Screen name="dream-vacation" options={{ headerShown: false }} />
            <Stack.Screen name="city-explore" options={{ headerShown: false }} />
            <Stack.Screen name="scenario-chat" options={{ headerShown: false }} />
            <Stack.Screen name="voice-training" options={{ headerShown: false }} />
            <Stack.Screen name="dual-profile" options={{ headerShown: false }} />
            <Stack.Screen name="contact-sharing" options={{ headerShown: false }} />
            <Stack.Screen name="duet-mode" options={{ headerShown: false }} />
            <Stack.Screen name="curriculum-drills" options={{ headerShown: false }} />
            <Stack.Screen name="mouth-placement" options={{ headerShown: false }} />
            <Stack.Screen name="study-groups" options={{ headerShown: false }} />
            <Stack.Screen name="class-chat" options={{ headerShown: false }} />
            <Stack.Screen name="progress-feed" options={{ headerShown: false }} />
            <Stack.Screen name="family-plan" options={{ headerShown: false }} />
            <Stack.Screen name="enterprise-portal" options={{ headerShown: false }} />
            <Stack.Screen name="group-class" options={{ headerShown: false }} />
            <Stack.Screen name="offline-downloads" options={{ headerShown: false }} />
            <Stack.Screen name="trending-updates" options={{ headerShown: false }} />
            <Stack.Screen name="community-validator" options={{ headerShown: false }} />
            <Stack.Screen name="notification-center" options={{ headerShown: false }} />
            <Stack.Screen name="notification-preferences" options={{ headerShown: false }} />
            <Stack.Screen name="do-not-disturb" options={{ headerShown: false }} />
            <Stack.Screen name="study-session" options={{ headerShown: false }} />
            <Stack.Screen name="focus-leaderboard" options={{ headerShown: false }} />
            <Stack.Screen name="translator-setup" options={{ headerShown: false, presentation: "modal" }} />
            <Stack.Screen name="employer-portal" options={{ headerShown: false }} />
            <Stack.Screen name="employer-job-post" options={{ headerShown: false }} />
            <Stack.Screen name="candidate-search" options={{ headerShown: false }} />
            <Stack.Screen name="stem-separator" options={{ headerShown: false }} />
            <Stack.Screen name="studio-library" options={{ headerShown: false }} />
            <Stack.Screen name="vocal-translator" options={{ headerShown: false }} />
            <Stack.Screen name="song-translation-result" options={{ headerShown: false }} />
            <Stack.Screen name="interview-detection" options={{ headerShown: false }} />
            <Stack.Screen name="hume-call" options={{ headerShown: false, presentation: "fullScreenModal" }} />
            <Stack.Screen name="agent-call" options={{ headerShown: false, presentation: "fullScreenModal" }} />
            <Stack.Screen name="song-translate-agent" options={{ headerShown: false }} />
            <Stack.Screen name="song-translation-studio" options={{ headerShown: false, presentation: "fullScreenModal" }} />
            <Stack.Screen name="adaptive-lesson" options={{ headerShown: false }} />
            <Stack.Screen name="cultural-calendar" options={{ headerShown: false }} />
            <Stack.Screen name="live-cultural-feed" options={{ headerShown: false }} />
            <Stack.Screen name="freshness-tags" options={{ headerShown: false }} />
            <Stack.Screen name="culture-mode-settings" options={{ headerShown: false }} />
            <Stack.Screen name="trending-vocab" options={{ headerShown: false }} />
            <Stack.Screen name="admin-knowledge-base" options={{ headerShown: false }} />
            <Stack.Screen name="cloudwave-translator-setup" options={{ headerShown: false }} />
            <Stack.Screen name="tutorials" options={{ headerShown: false }} />
            <Stack.Screen name="affiliate-dashboard" options={{ headerShown: false }} />
            <Stack.Screen name="influencer-discover" options={{ headerShown: false }} />
            <Stack.Screen name="influencer-profile" options={{ headerShown: false }} />
            <Stack.Screen name="influencer-chat" options={{ headerShown: false }} />
            <Stack.Screen name="influencer-call" options={{ headerShown: false, presentation: "fullScreenModal" }} />
            <Stack.Screen name="influencer-live" options={{ headerShown: false }} />
            <Stack.Screen name="admin-command-center" options={{ headerShown: false }} />
            <Stack.Screen name="ocr-ingestion" options={{ headerShown: false }} />
            <Stack.Screen name="affiliate-signup" options={{ headerShown: false }} />
            <Stack.Screen name="affiliate-leaderboard" options={{ headerShown: false }} />
            <Stack.Screen name="city-exploration" options={{ headerShown: false }} />
            <Stack.Screen name="voice-rooms" options={{ headerShown: false }} />
            <Stack.Screen name="musical-lesson" options={{ headerShown: false }} />
            <Stack.Screen name="generate-learning-song" options={{ headerShown: false }} />
            <Stack.Screen name="song-library" options={{ headerShown: false }} />
            <Stack.Screen name="karaoke-mode" options={{ headerShown: false }} />
            <Stack.Screen name="level-assessment" options={{ headerShown: false }} />
            <Stack.Screen name="vocab-cards" options={{ headerShown: false }} />
            <Stack.Screen name="conversation-scenarios" options={{ headerShown: false }} />
            <Stack.Screen name="language-battles" options={{ headerShown: false }} />
            <Stack.Screen name="phoneme-pronunciation" options={{ headerShown: false }} />
            <Stack.Screen name="feedback-report" options={{ headerShown: false }} />
            <Stack.Screen name="teacher-lesson-planner" options={{ headerShown: false }} />
            <Stack.Screen name="teacher-dashboard" options={{ headerShown: false }} />
            <Stack.Screen name="teacher-assessment" options={{ headerShown: false }} />
            <Stack.Screen name="playlists" options={{ headerShown: false }} />
            <Stack.Screen name="playlist-detail" options={{ headerShown: false }} />
            <Stack.Screen name="downloaded-songs" options={{ headerShown: false }} />
            <Stack.Screen name="liked-songs" options={{ headerShown: false }} />
            <Stack.Screen name="recently-played" options={{ headerShown: false }} />
            <Stack.Screen name="chat-contact-info" options={{ headerShown: false }} />
            <Stack.Screen name="chat-theme-picker" options={{ headerShown: false }} />
            <Stack.Screen name="starred-messages" options={{ headerShown: false }} />
            <Stack.Screen name="disappearing-messages" options={{ headerShown: false }} />
            <Stack.Screen name="create-group-chat" options={{ headerShown: false }} />
            <Stack.Screen name="group-chat" options={{ headerShown: false }} />
            <Stack.Screen name="now-playing" options={{ headerShown: false, presentation: "fullScreenModal" }} />
            <Stack.Screen name="language-exchange" options={{ headerShown: false }} />
            <Stack.Screen name="personalized-learning-path" options={{ headerShown: false }} />
            <Stack.Screen name="daily-challenges" options={{ headerShown: false }} />
            <Stack.Screen name="partner-chat" options={{ headerShown: false }} />
            <Stack.Screen name="conversation-sim" options={{ headerShown: false }} />
            <Stack.Screen name="creator-dashboard" options={{ headerShown: false }} />
            <Stack.Screen name="dominican-slang-dictionary" options={{ headerShown: false }} />
            <Stack.Screen name="progress-report-card" options={{ headerShown: false }} />
            <Stack.Screen name="social-translate-browser" options={{ headerShown: false }} />
            <Stack.Screen name="teacher-profile" options={{ headerShown: false }} />
            <Stack.Screen name="tv-player" options={{ headerShown: false, presentation: "fullScreenModal" }} />
            <Stack.Screen name="voice-clone-translation" options={{ headerShown: false }} />
            <Stack.Screen name="auto-language-detect" options={{ headerShown: false }} />
            <Stack.Screen name="video-call-captions" options={{ headerShown: false }} />
            <Stack.Screen name="screen-overlay-translate" options={{ headerShown: false }} />
            <Stack.Screen name="offline-translation-packs" options={{ headerShown: false }} />
            <Stack.Screen name="adaptive-vocab-reuse" options={{ headerShown: false }} />
            <Stack.Screen name="challenge-leaderboard" options={{ headerShown: false }} />
            <Stack.Screen name="demo-call" options={{ headerShown: false, presentation: 'fullScreenModal' }} />
            <Stack.Screen name="pronunciation-heat-map" options={{ headerShown: false }} />
            <Stack.Screen name="phoneme-progress-history" options={{ headerShown: false }} />
            <Stack.Screen name="grammar-notebook" options={{ headerShown: false }} />
            <Stack.Screen name="grammar-quiz" options={{ headerShown: false }} />
            <Stack.Screen name="grammar-mistake-journal" options={{ headerShown: false }} />
            <Stack.Screen name="grammar-streak-leaderboard" options={{ headerShown: false }} />
            <Stack.Screen name="grammar-challenge" options={{ headerShown: false }} />
            <Stack.Screen name="grammar-progress-report" options={{ headerShown: false }} />
            <Stack.Screen name="challenge-inbox" options={{ headerShown: false }} />
            <Stack.Screen name="challenge-results" options={{ headerShown: false }} />
            <Stack.Screen name="challenge-history" options={{ headerShown: false }} />
            <Stack.Screen name="pronunciation-duel-lobby" options={{ headerShown: false }} />
            <Stack.Screen name="pronunciation-duel" options={{ headerShown: false }} />
            <Stack.Screen name="pronunciation-duel-results" options={{ headerShown: false }} />
            <Stack.Screen name="duel-multiplayer" options={{ headerShown: false }} />
            <Stack.Screen name="duel-leaderboard-language" options={{ headerShown: false }} />
            <Stack.Screen name="duel-replay" options={{ headerShown: false }} />
            <Stack.Screen name="pronunciation-heatmap" options={{ headerShown: false }} />
            <Stack.Screen name="daily-duel-challenge" options={{ headerShown: false }} />
            <Stack.Screen name="streak-freeze-purchase" options={{ headerShown: false, presentation: "modal" }} />
            <Stack.Screen name="pronunciation-accuracy-leaderboard" options={{ headerShown: false }} />
            <Stack.Screen name="achievements-wall" options={{ headerShown: false }} />
            <Stack.Screen name="ranked-leaderboard" options={{ headerShown: false }} />
            <Stack.Screen name="analytics-dashboard" options={{ headerShown: false }} />
            <Stack.Screen name="weekly-progress-report" options={{ headerShown: false }} />
            <Stack.Screen name="personalized-daily-plan" options={{ headerShown: false }} />
            <Stack.Screen name="vocabulary-from-song" options={{ headerShown: false }} />
            <Stack.Screen name="content-review-queue" options={{ headerShown: false }} />
            <Stack.Screen name="exercise-analytics" options={{ headerShown: false }} />
            <Stack.Screen name="smart-practice" options={{ headerShown: false }} />
            <Stack.Screen name="voice-memo-player" options={{ headerShown: false }} />
            <Stack.Screen name="weekly-intelligence-report" options={{ headerShown: false }} />
            <Stack.Screen name="student-journal" options={{ headerShown: false }} />
            <Stack.Screen name="surprise-lesson" options={{ headerShown: false }} />
            <Stack.Screen name="conversation-history" options={{ headerShown: false }} />
            <Stack.Screen name="admin-portal" options={{ headerShown: false }} />
            <Stack.Screen name="dialect-quiz" options={{ headerShown: false }} />
            <Stack.Screen name="dialect-quiz-leaderboard" options={{ headerShown: false }} />
            <Stack.Screen name="journal-analytics" options={{ headerShown: false }} />
            <Stack.Screen name="methodology-dashboard" options={{ headerShown: false }} />
            <Stack.Screen name="slang-history" options={{ headerShown: false }} />
            <Stack.Screen name="cultural-lessons" options={{ headerShown: false }} />
            <Stack.Screen name="methodology-recommendations" options={{ headerShown: false }} />
            <Stack.Screen name="dialect-map" options={{ headerShown: false }} />
            <Stack.Screen name="dialect-of-the-week" options={{ headerShown: false }} />
            <Stack.Screen name="share-card-generator" options={{ headerShown: false }} />
          </Stack>
          <MiniPlayer />
          <StatusBar style="light" />
          <WhatsNewModal />
          <LowBalanceToast />
          <MilestoneToastWrapper />
          <StreakSavedToastWrapper />
          <RateLimitToastWrapper />
          <ExpirationWarning />
        </QueryClientProvider>
      </trpc.Provider>
      </PipProvider>
      </AgentProvider>
      </PlaylistProvider>
      </MusicPlayerProvider>
      </TabOrderProvider>
      </SavedCollectionsProvider>
      </AssessmentModeProvider>

</I18nProvider>
</CultureModeProvider>
          </UsageProvider>
      </NotificationBadgeProvider>
      </NotificationSchedulerProvider>
        </AppLockProvider>
    </GestureHandlerRootView>
    </ErrorBoundary>
  );

  const shouldOverrideSafeArea = Platform.OS === "web";
  if (shouldOverrideSafeArea) {
    return (
      <ThemeProvider>
        <SafeAreaProvider initialMetrics={providerInitialMetrics}>
          <SafeAreaFrameContext.Provider value={frame}>
            <SafeAreaInsetsContext.Provider value={insets}>
              {content}
              {showAnimatedSplash && (
                <AnimatedSplash onFinish={() => setShowAnimatedSplash(false)} />
              )}
            </SafeAreaInsetsContext.Provider>
          </SafeAreaFrameContext.Provider>
        </SafeAreaProvider>
      </ThemeProvider>
    );
  }
  return (
    <ThemeProvider>
      <SafeAreaProvider initialMetrics={providerInitialMetrics}>
        {content}
        {showAnimatedSplash && (
          <AnimatedSplash onFinish={() => setShowAnimatedSplash(false)} />
        )}
      </SafeAreaProvider>
    </ThemeProvider>
  );
}

