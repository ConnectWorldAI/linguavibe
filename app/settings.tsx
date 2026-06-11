import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  Platform,
  TouchableOpacity,
  Image,
  Alert,
  Switch,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Colors, Spacing, BorderRadius, FontSize } from "../constants/Colors";
import { isWeeklyNotificationEnabled, toggleWeeklyNotification } from "@/lib/weekly-progress-notification";
import { useNotificationBadges } from "@/lib/notification-badges";
import { getUnreadReferralCount } from "@/lib/referral-incentive";
import { getGoalNotificationPrefs, setGoalNotificationPrefs } from "@/lib/weekly-goals-notifications";
import { trackWalkthroughEvent } from "@/lib/walkthrough-analytics";
import * as Auth from "@/lib/_core/auth";
import { clearCurrentUserId } from "@/lib/user-storage";
import { useI18n } from "@/lib/i18n";
import { useSubscription } from "@/hooks/use-subscription";
import { openManageSubscriptions } from "@/lib/revenuecat";
import { logOutUser } from "@/lib/revenuecat";
import { getAdminState } from "@/lib/admin-access";

const PROFILE_PHOTO_KEY = "@connectworld_profile_photo";

// Demo avatar options for profile photo picker
const AVATAR_OPTIONS = [
  { id: "1", uri: "https://i.pravatar.cc/200?img=1", label: "Avatar 1" },
  { id: "2", uri: "https://i.pravatar.cc/200?img=2", label: "Avatar 2" },
  { id: "3", uri: "https://i.pravatar.cc/200?img=3", label: "Avatar 3" },
  { id: "4", uri: "https://i.pravatar.cc/200?img=4", label: "Avatar 4" },
  { id: "5", uri: "https://i.pravatar.cc/200?img=5", label: "Avatar 5" },
  { id: "6", uri: "https://i.pravatar.cc/200?img=6", label: "Avatar 6" },
  { id: "7", uri: "https://i.pravatar.cc/200?img=7", label: "Avatar 7" },
  { id: "8", uri: "https://i.pravatar.cc/200?img=8", label: "Avatar 8" },
];

// ─── Types ───────────────────────────────────────────────────────────────────

type SettingsRowItem = {
  icon: string;
  label: string;
  value?: string;
  badge?: string;
  badgeColor?: string;
  route?: string;
  action?: string;
  destructive?: boolean;
  premium?: boolean;
};

type SettingsSection = {
  id: string;
  title: string;
  titleColor?: string;
  items: SettingsRowItem[];
};

// ─── Data ────────────────────────────────────────────────────────────────────

const SETTINGS_SECTIONS: SettingsSection[] = [
  {
    id: "learning",
    title: "Your Learning",
    items: [
      { icon: "earth", label: "Culture Mode", value: "Balanced", route: "/culture-mode-settings" },
      { icon: "bookmark", label: "Saved Phrases", value: "142", route: "/saved-lessons" },
      { icon: "time", label: "Learning History", route: "/progress-dashboard" },
      { icon: "mic", label: "Voice Training", value: "Active", route: "/voice-training" },
      { icon: "calendar", label: "Smart Schedule", value: "Set", route: "/calendar" },
      { icon: "trophy", label: "Certifications", value: "2", route: "/my-certificates" },
    ],
  },
  {
    id: "voice",
    title: "Your Voice",
    titleColor: Colors.gold,
    items: [
      { icon: "pulse", label: "Voice Model Status", value: "Training 68%", route: "/voice-clone-training" },
      { icon: "recording", label: "Train Your Voice", route: "/voice-clone-training" },
      { icon: "chatbubble", label: "CloudWave Voice & Accent", value: "Customize", route: "/voice-settings" as any },
      { icon: "volume-high", label: "Voice Type Selection", value: "Your Voice", route: "/voice-settings" },
      { icon: "people", label: "My Teachers", value: "Choose", route: "/choose-teacher" as any },
      { icon: "musical-note", label: "Playback Quality", value: "HD", route: "/voice-settings" },
      { icon: "radio", label: "Voice Clone Preview", premium: true, route: "/voice-clone-training" },
    ],
  },
  {
    id: "career",
    title: "Career & Opportunities",
    titleColor: Colors.success,
    items: [
      { icon: "briefcase", label: "Job Alerts", value: "3 new", badge: "3", badgeColor: Colors.success, route: "/jobs" },
      { icon: "ribbon", label: "Your Certifications", value: "2 earned", route: "/my-certificates" },
      { icon: "eye", label: "Visible to Employers", value: "On", route: "/privacy-settings" },
      { icon: "globe", label: "Preferred Job Type", value: "Remote", route: "/jobs" },
      { icon: "business", label: "Industries", value: "Tech, Education", route: "/jobs" },
    ],
  },
  {
    id: "identity",
    title: "Profile & Identity",
    items: [
      { icon: "school", label: "Classroom / Career Profile", route: "/dual-profile" },
      { icon: "person-circle", label: "Personal Profile", route: "/dual-profile" },
      { icon: "eye-off", label: "Profile Visibility", value: "Public", route: "/privacy-settings" },
      { icon: "image", label: "Hide Profile Picture", value: "Off", route: "/privacy-settings" },
      { icon: "swap-horizontal", label: "Switch Profile View", route: "/dual-profile" },
      { icon: "qr-code", label: "My QR Code", route: "/qr-code" as any },
    ],
  },
  {
    id: "privacy",
    title: "Who Can See You",
    items: [
      { icon: "lock-closed", label: "Account Privacy", value: "Public", route: "/privacy-settings" },
      { icon: "star", label: "Close Friends", value: "0", route: "/friends" },
      { icon: "people", label: "Alumni Connections", value: "12", route: "/connections" },
      { icon: "ban", label: "Blocked", value: "0", route: "/privacy-settings" },
      { icon: "ellipse", label: "Online Status", value: "Online", route: "/privacy-settings" },
      { icon: "finger-print", label: "App Lock (Biometrics)", value: "Off", route: "/privacy-settings" },
      { icon: "shield-checkmark", label: "Verified Profile", value: "✓ Verified", route: "/privacy-settings" },
    ],
  },
  {
    id: "interactions",
    title: "How Others Interact",
    items: [
      { icon: "chatbubble-ellipses", label: "Messages & Voice Memos", value: "Everyone", route: "/notification-preferences" },
      { icon: "at", label: "Tags & Mentions", value: "Followers", route: "/notification-preferences" },
      { icon: "chatbubbles", label: "Comments", value: "Everyone", route: "/notification-preferences" },
      { icon: "git-compare", label: "Duets & Covers", value: "Everyone", route: "/notification-preferences" },
      { icon: "person-add", label: "Follow Requests", route: "/notification-preferences" },
      { icon: "hand-left", label: "Limit Interactions", value: "Off", route: "/privacy-settings" },
    ],
  },
  {
    id: "content",
    title: "Content & Feed",
    items: [
      { icon: "heart", label: "Favorites", value: "13", route: "/favorites" },
      { icon: "volume-mute", label: "Muted Accounts", value: "0", route: "/privacy-settings" },
      { icon: "options", label: "Content Preferences", route: "/notification-preferences" },
      { icon: "language", label: "Language Preferences", value: "Setup", route: "/language-preferences" as any },
      { icon: "globe", label: "ConnectWorld AI Translator", value: "Default App", route: "/translation-hub" as any },
      { icon: "settings", label: "Set as Default iOS Translator", value: "Guide", route: "/translator-setup" as any },
      { icon: "call", label: "Live Call Translation", value: "Pro", route: "/live-call-translation" as any },
      { icon: "film", label: "Video Autoplay", value: "WiFi Only", route: "/notification-preferences" },
    ],
  },
  {
    id: "subscription",
    title: "Subscription & Credits",
    titleColor: Colors.gold,
    items: [
      { icon: "diamond", label: "Current Plan", value: "__PLAN__", premium: true, route: "/payment-setup" },
      { icon: "settings", label: "Manage Subscription", value: "App Store / Play Store", action: "manage_subscription" },
      { icon: "speedometer", label: "Usage & Balance", value: "View", route: "/usage-dashboard" },
      { icon: "wallet", label: "Credit Balance", value: "250", route: "/buy-credits" },
      { icon: "receipt", label: "Purchase History", route: "/payment-setup" },
      { icon: "rocket", label: "Upgrade Plan", premium: true, route: "/payment-setup" },
      { icon: "gift", label: "Refer & Earn", value: "+25 credits", route: "/referral" },
      { icon: "ticket", label: "Redeem Referral Code", value: "Enter code", route: "/redeem-referral" },
      { icon: "cash", label: "Affiliate Program", value: "Earn 20%", premium: true, route: "/affiliate-dashboard" },
    ],
  },
  {
    id: "app",
    title: "App & Media",
    items: [
      { icon: "language", label: "Language & Translations", route: "/language-pack" },
      { icon: "speedometer", label: "Media Quality", value: "Auto", route: "/notification-preferences" },
      { icon: "cloud-download", label: "Downloads & Offline", value: "2 packs", route: "/offline-downloads" },
      { icon: "notifications", label: "Notifications", route: "/notification-settings" as any },
      { icon: "phone-portrait", label: "Device Permissions", route: "/permissions-setup" },
      { icon: "accessibility", label: "Accessibility", route: "/notification-preferences" },
      { icon: "volume-high", label: "Sound & Haptics", route: "/sound-settings" },
    ],
  },
  {
    id: "support",
    title: "Support & Info",
    items: [
      { icon: "help-buoy", label: "Help Center", route: "/privacy-policy" },
      { icon: "sparkles", label: "AI Assistant", badge: "New", badgeColor: Colors.secondary, route: "/ai-chat" },
      { icon: "shield-checkmark", label: "Privacy Center", route: "/privacy-policy" },
      { icon: "document-text", label: "Terms of Service", route: "/terms-of-service" },
      { icon: "information-circle", label: "About ConnectWorld AI", route: "/privacy-policy" },
      { icon: "refresh", label: "Reset Translator Walkthrough", value: "Re-show", action: "reset_walkthrough" },
    ],
  },
  {
    id: "admin",
    title: "Admin & Creator Tools",
    items: [
      { icon: "construct", label: "Knowledge Base", route: "/admin-knowledge-base" },
      { icon: "videocam", label: "Marketing Studio", route: "/marketing-studio" },
      { icon: "business", label: "Enterprise Portal", route: "/enterprise-portal" },
      { icon: "color-palette", label: "Artist Portal", route: "/artist-portal" },
      { icon: "briefcase", label: "Employer Job Post", route: "/employer-job-post" },
      { icon: "search", label: "Candidate Search", route: "/candidate-search" },
      { icon: "people-circle", label: "Community Validator", route: "/community-validator" },
      { icon: "chatbox", label: "Class Chat", route: "/class-chat" },
      { icon: "document-text", label: "Conversation Summary", route: "/conversation-summary" },
      { icon: "fitness", label: "Goal Adjustment", route: "/goal-adjustment" },
      { icon: "card", label: "Payment Flow", route: "/payment-flow" },
      { icon: "notifications", label: "Notifications", route: "/notifications" },
      { icon: "newspaper", label: "Song Breakdown", route: "/song-lesson-breakdown" },
      { icon: "shield-checkmark", label: "Admin Access Portal", route: "/admin-portal" },
    ],
  },
  {
    id: "competitive",
    title: "AI Learning Lab",
    titleColor: Colors.secondary,
    items: [
      { icon: "people", label: "AI Conversation Partners", value: "Characters", route: "/ai-partners" },
      { icon: "mic", label: "Live Voice Rooms", value: "Drop-in", route: "/voice-rooms" },
      { icon: "phone-portrait", label: "Immersion Mode", value: "All Day", route: "/immersion-mode" },
        { icon: "trophy", label: "Immersion Challenges", value: "Daily/Weekly XP", route: "/immersion-challenges" },
      { icon: "earth", label: "Cultural Intelligence", value: "Deep", route: "/cultural-intelligence" },
      { icon: "flash", label: "Streak Battles", value: "Compete", route: "/streak-battles" },
      { icon: "pulse", label: "AI Speech Coach", value: "Accent", route: "/speech-coach" },
      { icon: "analytics", label: "Pronunciation Progress", value: "Timeline", route: "/pronunciation-progress" },
      { icon: "swap-horizontal", label: "Language Exchange", value: "Match", route: "/language-exchange" },
      { icon: "musical-notes", label: "Music Taste Profile", value: "Setup", route: "/music-taste-onboarding" },
      { icon: "radio", label: "My Music Feed", value: "Personalized", route: "/my-music-feed" },
    ],
  },
  {
    id: "wavecloud",
    title: "Wave Cloud Companion",
    titleColor: Colors.neonPurple,
    items: [
      { icon: "chatbubbles", label: "Conversation History", route: "/conversation-history" },
      { icon: "journal", label: "Student Journal", route: "/student-journal" },
      { icon: "sparkles", label: "Surprise Lessons", route: "/surprise-lesson" },
      { icon: "settings", label: "Voice & Coaching Settings", route: "/voice-settings" },
    ],
  },
  {
    id: "account",
    title: "Account",
    items: [
      { icon: "settings", label: "Account Settings", value: "Security & Data", route: "/account-settings" },
      { icon: "lock-closed", label: "Privacy", value: "Controls", route: "/privacy-settings" },
      { icon: "shield-checkmark", label: "Security & MFA", value: "Protected", route: "/security-settings" },
      { icon: "chatbubble-ellipses", label: "Conversations", value: "Theme & Backup", route: "/conversations-settings" },
      { icon: "notifications-outline", label: "Notifications", value: "Sounds & Alerts", route: "/notifications-settings" },
      { icon: "laptop-outline", label: "Linked Devices", route: "/linked-devices" },
      { icon: "person-add", label: "Invite a Friend", route: "/invite-friend" },
      { icon: "swap-vertical", label: "Switch Account", route: "/login" },
      { icon: "log-out", label: "Log Out", destructive: true, route: "/login" },
    ],
  },
  {
    id: "ai_safety",
    title: "AI Safety & Compliance",
    items: [
      { icon: "shield-half", label: "AI Safety Controls", value: "Content Filters", route: "/ai-safety-settings" },
      { icon: "alert-circle", label: "Report AI Issue", route: "/ai-safety-settings" },
      { icon: "list", label: "AI Guardrails Audit Log", value: "Security Events", route: "/ai-audit-log" },
      { icon: "analytics", label: "AI Moderation Dashboard", value: "Admin Only", route: "/moderation-dashboard" },
    ],
  },
];

// ─── Component ───────────────────────────────────────────────────────────────

export default function SettingsScreen() {
  const { t } = useI18n();
  const router = useRouter();
  const { plan, isPremium, isPro, isEnterprise } = useSubscription();
  const [themeMode, setThemeMode] = useState<"dark" | "light" | "system">("dark");
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [showPhotoPicker, setShowPhotoPicker] = useState(false);
  const [weeklyReportEnabled, setWeeklyReportEnabled] = useState(true);
  const [goalRemindersEnabled, setGoalRemindersEnabled] = useState(true);
  const { badges, setBadge } = useNotificationBadges();
  const [referralBadgeCount, setReferralBadgeCount] = useState(0);
  const [isAdminUser, setIsAdminUser] = useState(false);

  useEffect(() => {
    loadNotifPrefs();
    // Load referral badge count
    getUnreadReferralCount().then((count) => {
      setReferralBadgeCount(count);
      setBadge("referrals", count);
    });
    // Check admin status to conditionally show admin-only items
    getAdminState().then((state) => setIsAdminUser(state.isAdmin));
  }, []);

  const loadNotifPrefs = async () => {
    try {
      const weeklyEnabled = await isWeeklyNotificationEnabled();
      setWeeklyReportEnabled(weeklyEnabled);
      const goalPrefs = await getGoalNotificationPrefs();
      setGoalRemindersEnabled(goalPrefs.enabled);
    } catch {}
  };

  const handleToggleWeeklyReport = async (val: boolean) => {
    setWeeklyReportEnabled(val);
    await toggleWeeklyNotification(val);
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleToggleGoalReminders = async (val: boolean) => {
    setGoalRemindersEnabled(val);
    const prefs = await getGoalNotificationPrefs();
    await setGoalNotificationPrefs({ ...prefs, enabled: val });
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  // Triple-tap version number to open admin debug panel
  const [versionTapCount, setVersionTapCount] = useState(0);
  const versionTapTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleVersionTap = () => {
    const newCount = versionTapCount + 1;
    setVersionTapCount(newCount);
    if (versionTapTimer.current) clearTimeout(versionTapTimer.current);
    if (newCount >= 3) {
      setVersionTapCount(0);
      if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.push("/admin-debug" as any);
    } else {
      versionTapTimer.current = setTimeout(() => setVersionTapCount(0), 800);
    }
  };

  // Dynamic plan display for settings
  const planDisplayName = plan === "free" ? "Free" : plan === "plus" ? "Plus" : plan === "pro" ? "Pro" : "Enterprise";

  useEffect(() => {
    AsyncStorage.getItem(PROFILE_PHOTO_KEY).then((uri) => {
      if (uri) setProfilePhoto(uri);
    });
  }, []);

  const handleSelectPhoto = async (uri: string) => {
    if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setProfilePhoto(uri);
    setShowPhotoPicker(false);
    await AsyncStorage.setItem(PROFILE_PHOTO_KEY, uri);
  };

  const handleRemovePhoto = async () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setProfilePhoto(null);
    setShowPhotoPicker(false);
    await AsyncStorage.removeItem(PROFILE_PHOTO_KEY);
  };

  const cycleTheme = () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setThemeMode((prev) => {
      if (prev === "dark") return "light";
      if (prev === "light") return "system";
      return "dark";
    });
  };

  const handleResetWalkthrough = async () => {
    if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    // Clear the first-launch flag so walkthrough shows again
    await AsyncStorage.removeItem("@connectworld_translator_setup_shown");
    // Track the reset event
    trackWalkthroughEvent("walkthrough_reset", { source: "settings" });
    // Navigate to the walkthrough immediately
    router.push("/translator-setup" as any);
  };

  const getThemeIcon = () => {
    if (themeMode === "dark") return "moon";
    if (themeMode === "light") return "sunny";
    return "phone-portrait";
  };

  const getThemeLabel = () => {
    if (themeMode === "dark") return "Dark";
    if (themeMode === "light") return "Light";
    return "System";
  };

  const renderSectionHeader = (section: SettingsSection) => (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionHeaderLine} />
      <Text
        style={[
          styles.sectionTitle,
          section.titleColor ? { color: section.titleColor } : null,
        ]}
      >
        {section.title}
      </Text>
    </View>
  );

  const renderRow = (item: SettingsRowItem) => (
    <Pressable
      key={item.label}
      style={({ pressed }) => [
        styles.row,
        pressed && styles.rowPressed,
      ]}
      onPress={async () => {
        if (item.action === "reset_walkthrough") {
          handleResetWalkthrough();
        } else if (item.action === "manage_subscription") {
          if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          await openManageSubscriptions();
        } else if (item.destructive && item.label === "Log Out") {
          // Clear all auth state on logout
          if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          await AsyncStorage.multiRemove([
            "@auth_logged_in",
            "@auth_user",
            "@onboarding_complete",
            "@user_username",
            "@user_profile_photo",
            "@user_avatar",
          ]);
          // Also clear the Auth module data (SecureStore/localStorage)
          await Auth.clearUserInfo();
          await Auth.removeSessionToken();
          await logOutUser(); // Reset RevenueCat to anonymous
          await clearCurrentUserId();
          router.replace("/login" as any);
        } else if (item.route) {
          router.push(item.route as any);
        }
      }}
    >
      <View style={styles.rowLeft}>
        <View style={[styles.iconContainer, item.premium && styles.iconContainerPremium]}>
          <Ionicons
            name={item.icon as any}
            size={20}
            color={item.destructive ? Colors.accent : item.premium ? Colors.gold : Colors.textPrimary}
          />
        </View>
        <Text
          style={[
            styles.rowLabel,
            item.destructive && styles.rowLabelDestructive,
          ]}
        >
          {item.label}
        </Text>
      </View>
      <View style={styles.rowRight}>
        {(item.badge || (item.label === "Refer & Earn" && referralBadgeCount > 0)) && (
          <View style={[styles.badge, { backgroundColor: (item.label === "Refer & Earn" ? "#EF4444" : item.badgeColor) || Colors.secondary }]}>
            <Text style={styles.badgeText}>
              {item.label === "Refer & Earn" ? String(referralBadgeCount) : item.badge}
            </Text>
          </View>
        )}
        {item.value && !(item.badge || (item.label === "Refer & Earn" && referralBadgeCount > 0)) && (
          <Text style={[styles.rowValue, item.premium && styles.rowValuePremium]}>
            {item.value === "__PLAN__" ? planDisplayName : item.value}
          </Text>
        )}
        <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
      </View>
    </Pressable>
  );

  const renderItem = ({ item }: { item: SettingsSection }) => (
    <View key={item.id}>
      {renderSectionHeader(item)}
      <View style={styles.sectionContent}>
        {item.items.map(renderRow)}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          style={({ pressed }) => [
            styles.backButton,
            pressed && { opacity: 0.6 },
          ]}
          onPress={() => router.back()}
        >
          <Ionicons name="chevron-back" size={24} color={Colors.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>{t.settings}</Text>
        <View style={styles.headerRight} />
      </View>

      {/* Profile Photo */}
      <TouchableOpacity style={styles.profileCard} onPress={() => setShowPhotoPicker(true)}>
        <View style={styles.profileAvatarWrap}>
          {profilePhoto ? (
            <Image source={{ uri: profilePhoto }} style={styles.profileAvatar} />
          ) : (
            <View style={styles.profileAvatarPlaceholder}>
              <Ionicons name="person" size={28} color={Colors.textSecondary} />
            </View>
          )}
          <View style={styles.profileCameraBadge}>
            <Ionicons name="camera" size={12} color="#fff" />
          </View>
        </View>
        <View style={styles.profileInfo}>
          <Text style={styles.profileName}>ConnectWorld User</Text>
          <Text style={styles.profileSub}>Tap to change profile photo</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
      </TouchableOpacity>

      {/* Photo Picker Modal */}
      {showPhotoPicker && (
        <View style={styles.photoPickerOverlay}>
          <View style={styles.photoPickerSheet}>
            <Text style={styles.photoPickerTitle}>Choose Profile Photo</Text>
            <View style={styles.photoGrid}>
              {AVATAR_OPTIONS.map((avatar) => (
                <TouchableOpacity
                  key={avatar.id}
                  style={[
                    styles.photoOption,
                    profilePhoto === avatar.uri && styles.photoOptionSelected,
                  ]}
                  onPress={() => handleSelectPhoto(avatar.uri)}
                >
                  <Image source={{ uri: avatar.uri }} style={styles.photoOptionImg} />
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.photoPickerActions}>
              {profilePhoto && (
                <TouchableOpacity style={styles.removePhotoBtn} onPress={handleRemovePhoto}>
                  <Ionicons name="trash" size={16} color={Colors.error} />
                  <Text style={styles.removePhotoText}>Remove Photo</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity style={styles.cancelPhotoBtn} onPress={() => setShowPhotoPicker(false)}>
                <Text style={styles.cancelPhotoText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={16} color={Colors.textMuted} />
          <Text style={styles.searchPlaceholder}>Search settings...</Text>
        </View>
      </View>

      {/* Theme Toggle */}
      <View style={styles.themeToggleCard}>
        <View style={styles.themeToggleLeft}>
          <Ionicons name={getThemeIcon() as any} size={20} color={Colors.secondary} />
          <Text style={styles.themeToggleLabel}>Appearance</Text>
        </View>
        <TouchableOpacity style={styles.themeToggleBtn} onPress={cycleTheme}>
          <Ionicons name="moon" size={14} color={themeMode === "dark" ? Colors.secondary : Colors.textSecondary + "60"} />
          <Ionicons name="sunny" size={14} color={themeMode === "light" ? Colors.gold : Colors.textSecondary + "60"} />
          <Ionicons name="phone-portrait" size={14} color={themeMode === "system" ? Colors.success : Colors.textSecondary + "60"} />
          <View style={[styles.themeToggleIndicator, themeMode === "light" && { left: 28 }, themeMode === "system" && { left: 52 }]} />
        </TouchableOpacity>
        <Text style={styles.themeToggleValue}>{getThemeLabel()}</Text>
      </View>

      {/* ─── NOTIFICATION QUICK TOGGLES ─── */}
      <View style={styles.notifQuickSection}>
        <View style={styles.notifQuickHeader}>
          <Ionicons name="notifications" size={18} color={Colors.secondary} />
          <Text style={styles.notifQuickTitle}>Notification Quick Settings</Text>
          <TouchableOpacity onPress={() => router.push("/notification-settings" as any)}>
            <Text style={styles.notifQuickLink}>All Settings</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.notifQuickRow}>
          <View style={styles.notifQuickRowLeft}>
            <Ionicons name="document-text" size={16} color={Colors.textSecondary} />
            <Text style={styles.notifQuickLabel}>Weekly Progress Report</Text>
          </View>
          <Switch
            value={weeklyReportEnabled}
            onValueChange={handleToggleWeeklyReport}
            trackColor={{ false: Colors.border, true: Colors.success + "80" }}
            thumbColor={weeklyReportEnabled ? Colors.success : Colors.textMuted}
          />
        </View>
        <View style={styles.notifQuickRow}>
          <View style={styles.notifQuickRowLeft}>
            <Ionicons name="flag" size={16} color={Colors.textSecondary} />
            <Text style={styles.notifQuickLabel}>Goal Reminders</Text>
          </View>
          <Switch
            value={goalRemindersEnabled}
            onValueChange={handleToggleGoalReminders}
            trackColor={{ false: Colors.border, true: Colors.success + "80" }}
            thumbColor={goalRemindersEnabled ? Colors.success : Colors.textMuted}
          />
        </View>
      </View>

      {/* Settings List */}
      <FlatList
        data={SETTINGS_SECTIONS.map((section) => {
          // Hide admin-only items from non-admin users
          if (!isAdminUser && section.id === "ai_safety") {
            return {
              ...section,
              items: section.items.filter((item) => !item.label.includes("Moderation Dashboard") && !item.label.includes("Audit Log")),
            };
          }
          if (!isAdminUser && section.id === "admin") {
            return { ...section, items: [] };
          }
          return section;
        }).filter((section) => section.items.length > 0)}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ListFooterComponent={
          <View style={styles.footer}>
            <TouchableOpacity onPress={handleVersionTap} activeOpacity={0.7}>
              <Text style={styles.footerVersion}>ConnectWorld AI v1.0.0</Text>
            </TouchableOpacity>
            <Text style={styles.footerTagline}>Learn. Connect. Earn.</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

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
    paddingVertical: Spacing.md,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surfaceCard,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  headerTitle: {
    fontSize: FontSize.xl,
    fontWeight: "700",
    color: Colors.textPrimary,
    letterSpacing: -0.5,
  },
  headerRight: {
    width: 36,
  },
  // Profile Photo
  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    backgroundColor: Colors.surfaceCard,
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  profileAvatarWrap: {
    position: "relative",
    marginRight: 12,
  },
  profileAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: Colors.secondary,
  },
  profileAvatarPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary + "80",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: Colors.border,
  },
  profileCameraBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Colors.secondary,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: Colors.surfaceCard,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: FontSize.md,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  profileSub: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  // Photo Picker
  photoPickerOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.8)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 100,
    padding: Spacing.lg,
  },
  photoPickerSheet: {
    width: "100%",
    maxWidth: 340,
    backgroundColor: Colors.surfaceCard,
    borderRadius: 28,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.secondary + "30",
  },
  photoPickerTitle: {
    fontSize: FontSize.lg,
    fontWeight: "700",
    color: Colors.textPrimary,
    textAlign: "center",
    marginBottom: Spacing.md,
  },
  photoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 10,
    marginBottom: Spacing.md,
  },
  photoOption: {
    width: 64,
    height: 64,
    borderRadius: 32,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "transparent",
  },
  photoOptionSelected: {
    borderColor: Colors.secondary,
    shadowColor: Colors.secondary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
  },
  photoOptionImg: {
    width: "100%",
    height: "100%",
  },
  photoPickerActions: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 12,
  },
  removePhotoBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.error + "15",
  },
  removePhotoText: {
    fontSize: FontSize.sm,
    fontWeight: "600",
    color: Colors.error,
  },
  cancelPhotoBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.primary + "80",
  },
  cancelPhotoText: {
    fontSize: FontSize.sm,
    fontWeight: "600",
    color: Colors.textSecondary,
  },
  searchContainer: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surfaceCard,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Platform.OS === "ios" ? 12 : 10,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 8,
  },
  searchPlaceholder: {
    fontSize: FontSize.md,
    color: Colors.textMuted,
  },
  listContent: {
    paddingBottom: 120,
  },
  sectionHeader: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
  sectionHeaderLine: {
    position: "absolute",
    top: 0,
    left: Spacing.lg,
    right: Spacing.lg,
    height: 1,
    backgroundColor: Colors.border,
  },
  sectionTitle: {
    fontSize: FontSize.sm,
    fontWeight: "700",
    color: Colors.secondary,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  sectionContent: {
    paddingHorizontal: Spacing.sm,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: Spacing.md,
    marginHorizontal: Spacing.sm,
    borderRadius: BorderRadius.sm,
  },
  rowPressed: {
    backgroundColor: Colors.glowSubtle,
  },
  rowLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 14,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "rgba(0, 170, 255, 0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  iconContainerPremium: {
    backgroundColor: Colors.goldGlow,
    borderWidth: 1,
    borderColor: "rgba(255, 184, 0, 0.25)",
  },
  rowLabel: {
    fontSize: FontSize.md,
    fontWeight: "500",
    color: Colors.textPrimary,
    flex: 1,
  },
  rowLabelDestructive: {
    color: Colors.accent,
  },
  rowRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  rowValue: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  rowValuePremium: {
    color: Colors.gold,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 22,
    alignItems: "center",
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  footer: {
    alignItems: "center",
    paddingVertical: Spacing.xxl,
    gap: 4,
  },
  footerVersion: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
  },
  footerTagline: {
    fontSize: FontSize.sm,
    color: Colors.secondary,
    fontWeight: "600",
    letterSpacing: 0.5,
  },

  // Theme Toggle
  themeToggleCard: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    backgroundColor: Colors.surfaceCard,
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.secondary + "30",
  },
  themeToggleLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  themeToggleLabel: {
    fontSize: FontSize.sm,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  themeToggleBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.primary + "80",
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 6,
    gap: 10,
    position: "relative",
  },
  themeToggleIndicator: {
    position: "absolute",
    left: 4,
    top: 3,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Colors.secondary + "30",
  },
  themeToggleValue: {
    fontSize: FontSize.xs,
    fontWeight: "600",
    color: Colors.textSecondary,
    marginLeft: 10,
    minWidth: 50,
    textAlign: "right",
  },
  notifQuickSection: {
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: Colors.surfaceCard,
    borderRadius: BorderRadius.lg,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  notifQuickHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  notifQuickTitle: {
    flex: 1,
    fontSize: FontSize.sm,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  notifQuickLink: {
    fontSize: FontSize.xs,
    fontWeight: "600",
    color: Colors.secondary,
  },
  notifQuickRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.border + "40",
  },
  notifQuickRowLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  notifQuickLabel: {
    fontSize: FontSize.sm,
    color: Colors.textPrimary,
  },
});
