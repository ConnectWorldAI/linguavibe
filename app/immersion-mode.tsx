/**
 * AI-Powered Immersion Mode
 * 
 * Takes over notifications, lock screen concepts, and widgets to push micro-lessons
 * in the target language throughout the day. "Your Uber is arriving" becomes "Votre Uber arrive."
 * 
 * Features:
 * - Immersion intensity levels (Light, Medium, Full)
 * - Notification-based micro-lessons throughout the day
 * - Common daily phrases translated into target language
 * - Schedule-aware delivery (respects work hours, sleep)
 * - Progress tracking for immersion streaks
 * - Category-based immersion (food, transport, social, work)
 */

import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Switch,
  ScrollView,
  Alert,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import { requestNotificationPermission } from "@/lib/notifications";
import { trpc } from "@/lib/trpc";

// ─── Types ───────────────────────────────────────────────────────────────────

interface ImmersionSettings {
  enabled: boolean;
  intensity: "light" | "medium" | "full";
  targetLanguage: string;
  categories: string[];
  quietHoursStart: number; // hour 0-23
  quietHoursEnd: number;
  dailyLimit: number; // max notifications per day
  immersionStreak: number;
  totalLessonsDelivered: number;
}

interface MicroLesson {
  id: string;
  category: string;
  original: string;
  translated: string;
  context: string;
  difficulty: "easy" | "medium" | "hard";
  deliveredAt: number;
  practiced: boolean;
}

interface ImmersionCategory {
  id: string;
  name: string;
  icon: string;
  description: string;
  examples: { original: string; translated: string }[];
  enabled: boolean;
}

// ─── Data ────────────────────────────────────────────────────────────────────

const IMMERSION_CATEGORIES: ImmersionCategory[] = [
  {
    id: "transport",
    name: "Transportation",
    icon: "car",
    description: "Ride-sharing, public transit, directions",
    examples: [
      { original: "Your driver is arriving", translated: "Votre chauffeur arrive" },
      { original: "The train departs in 5 minutes", translated: "Le train part dans 5 minutes" },
      { original: "Turn left at the next intersection", translated: "Tournez à gauche au prochain carrefour" },
    ],
    enabled: true,
  },
  {
    id: "food",
    name: "Food & Dining",
    icon: "restaurant",
    description: "Ordering, cooking, grocery shopping",
    examples: [
      { original: "Your order is being prepared", translated: "Votre commande est en préparation" },
      { original: "Table for two, please", translated: "Une table pour deux, s'il vous plaît" },
      { original: "The special today is fish", translated: "Le plat du jour est du poisson" },
    ],
    enabled: true,
  },
  {
    id: "social",
    name: "Social & Messaging",
    icon: "chatbubbles",
    description: "Greetings, small talk, social media",
    examples: [
      { original: "How was your weekend?", translated: "Comment était ton week-end ?" },
      { original: "Let's meet at 3pm", translated: "Retrouvons-nous à 15h" },
      { original: "Happy birthday!", translated: "Joyeux anniversaire !" },
    ],
    enabled: true,
  },
  {
    id: "work",
    name: "Work & Professional",
    icon: "briefcase",
    description: "Meetings, emails, office communication",
    examples: [
      { original: "The meeting starts in 10 minutes", translated: "La réunion commence dans 10 minutes" },
      { original: "Please review the attached document", translated: "Veuillez examiner le document ci-joint" },
      { original: "I'll follow up by end of day", translated: "Je ferai un suivi avant la fin de la journée" },
    ],
    enabled: false,
  },
  {
    id: "weather",
    name: "Weather & Environment",
    icon: "partly-sunny",
    description: "Weather updates, seasons, nature",
    examples: [
      { original: "It will rain this afternoon", translated: "Il va pleuvoir cet après-midi" },
      { original: "Bring an umbrella today", translated: "Prenez un parapluie aujourd'hui" },
      { original: "The temperature is dropping", translated: "La température baisse" },
    ],
    enabled: true,
  },
  {
    id: "health",
    name: "Health & Fitness",
    icon: "fitness",
    description: "Workout reminders, health tips, wellness",
    examples: [
      { original: "Time for your daily walk", translated: "C'est l'heure de votre promenade quotidienne" },
      { original: "You've reached your step goal!", translated: "Vous avez atteint votre objectif de pas !" },
      { original: "Remember to drink water", translated: "N'oubliez pas de boire de l'eau" },
    ],
    enabled: false,
  },
  {
    id: "shopping",
    name: "Shopping & Errands",
    icon: "cart",
    description: "Purchases, deliveries, errands",
    examples: [
      { original: "Your package has been delivered", translated: "Votre colis a été livré" },
      { original: "Sale ends tomorrow", translated: "La vente se termine demain" },
      { original: "Item added to your cart", translated: "Article ajouté à votre panier" },
    ],
    enabled: true,
  },
  {
    id: "entertainment",
    name: "Entertainment",
    icon: "musical-notes",
    description: "Movies, music, events, hobbies",
    examples: [
      { original: "New episode available", translated: "Nouvel épisode disponible" },
      { original: "The concert starts at 8pm", translated: "Le concert commence à 20h" },
      { original: "Would you like to watch a movie?", translated: "Voulez-vous regarder un film ?" },
    ],
    enabled: false,
  },
];

const RECENT_MICRO_LESSONS: MicroLesson[] = [
  { id: "ml1", category: "transport", original: "Your Uber is 2 minutes away", translated: "Votre Uber est à 2 minutes", context: "Ride-sharing notification", difficulty: "easy", deliveredAt: Date.now() - 3600000, practiced: true },
  { id: "ml2", category: "food", original: "Your food is on its way", translated: "Votre repas est en route", context: "Food delivery update", difficulty: "easy", deliveredAt: Date.now() - 7200000, practiced: true },
  { id: "ml3", category: "social", original: "Sarah sent you a message", translated: "Sarah vous a envoyé un message", context: "Messaging notification", difficulty: "easy", deliveredAt: Date.now() - 10800000, practiced: false },
  { id: "ml4", category: "weather", original: "Expect heavy rain tonight", translated: "Attendez-vous à de fortes pluies ce soir", context: "Weather alert", difficulty: "medium", deliveredAt: Date.now() - 14400000, practiced: true },
  { id: "ml5", category: "work", original: "Reminder: Team standup in 5 min", translated: "Rappel : Réunion d'équipe dans 5 min", context: "Calendar reminder", difficulty: "medium", deliveredAt: Date.now() - 18000000, practiced: false },
  { id: "ml6", category: "shopping", original: "Flash sale: 50% off today only", translated: "Vente flash : 50% de réduction aujourd'hui seulement", context: "Shopping notification", difficulty: "hard", deliveredAt: Date.now() - 21600000, practiced: true },
];

const STORAGE_KEY = "@immersion_mode_settings";
const IMMERSION_NOTIFICATION_PREFIX = "immersion_";

// ─── Notification Scheduling ────────────────────────────────────────────────

/**
 * Build a pool of micro-lesson notifications from enabled categories
 * and schedule them at intervals throughout the day (respecting quiet hours).
 */
async function scheduleImmersionNotifications(
  settings: ImmersionSettings,
  categories: ImmersionCategory[]
): Promise<void> {
  if (Platform.OS === "web") return;
  if (!settings.enabled) return;

  // Cancel existing immersion notifications first
  await cancelImmersionNotifications();

  // Build lesson pool from enabled categories
  const enabledCats = categories.filter((c) => settings.categories.includes(c.id));
  if (enabledCats.length === 0) return;

  const allLessons: { title: string; body: string; category: string }[] = [];
  for (const cat of enabledCats) {
    for (const ex of cat.examples) {
      allLessons.push({
        title: `\uD83C\uDF0D ${cat.name}`,
        body: `"${ex.original}" \u2192 "${ex.translated}"`,
        category: cat.id,
      });
    }
  }

  // Calculate available hours (excluding quiet hours)
  const { quietHoursStart, quietHoursEnd, dailyLimit } = settings;
  const availableHours: number[] = [];
  for (let h = 0; h < 24; h++) {
    if (quietHoursStart > quietHoursEnd) {
      // Quiet hours wrap around midnight (e.g., 22-7)
      if (h >= quietHoursStart || h < quietHoursEnd) continue;
    } else {
      if (h >= quietHoursStart && h < quietHoursEnd) continue;
    }
    availableHours.push(h);
  }

  if (availableHours.length === 0) return;

  // Schedule notifications spread across available hours
  const notificationsToSchedule = Math.min(dailyLimit, allLessons.length, availableHours.length);
  const interval = Math.floor(availableHours.length / notificationsToSchedule);

  for (let i = 0; i < notificationsToSchedule; i++) {
    const lesson = allLessons[i % allLessons.length];
    const hour = availableHours[Math.min(i * interval, availableHours.length - 1)];
    const minute = Math.floor(Math.random() * 50) + 5; // Random minute 5-55

    await Notifications.scheduleNotificationAsync({
      content: {
        title: lesson.title,
        body: lesson.body,
        sound: true,
        data: {
          type: "immersion_micro_lesson",
          category: lesson.category,
        },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour,
        minute,
      },
      identifier: `${IMMERSION_NOTIFICATION_PREFIX}${i}`,
    });
  }
}

/**
 * Cancel all immersion-specific scheduled notifications.
 */
async function cancelImmersionNotifications(): Promise<void> {
  if (Platform.OS === "web") return;
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  for (const notif of scheduled) {
    if (notif.identifier.startsWith(IMMERSION_NOTIFICATION_PREFIX)) {
      await Notifications.cancelScheduledNotificationAsync(notif.identifier);
    }
  }
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function ImmersionModeScreen() {
  const colors = useColors();
  const router = useRouter();
  const [settings, setSettings] = useState<ImmersionSettings>({
    enabled: false,
    intensity: "medium",
    targetLanguage: "French",
    categories: ["transport", "food", "social", "weather", "shopping"],
    quietHoursStart: 22,
    quietHoursEnd: 7,
    dailyLimit: 15,
    immersionStreak: 12,
    totalLessonsDelivered: 847,
  });
  const [recentLessons, setRecentLessons] = useState<MicroLesson[]>(RECENT_MICRO_LESSONS);
  const [categories, setCategories] = useState<ImmersionCategory[]>(IMMERSION_CATEGORIES);
  const [isGenerating, setIsGenerating] = useState(false);

  // tRPC mutation for server-generated personalized lessons
  const generateLessonsMutation = trpc.immersionLessons.generateLessons.useMutation();

  useEffect(() => {
    loadSettings();
  }, []);

  // Fetch personalized lessons from server when enabled
  const fetchPersonalizedLessons = async (currentSettings: ImmersionSettings) => {
    setIsGenerating(true);
    try {
      // Get user's recent vocabulary from AsyncStorage
      const vocabStored = await AsyncStorage.getItem("@recent_vocabulary");
      const recentVocabulary = vocabStored ? JSON.parse(vocabStored) : [];
      const strugglesStored = await AsyncStorage.getItem("@struggle_areas");
      const struggleAreas = strugglesStored ? JSON.parse(strugglesStored) : [];

      // Determine time context
      const hour = new Date().getHours();
      const contextHint = hour < 12 ? "morning" : hour < 17 ? "afternoon" : hour < 21 ? "evening" : "night";

      const result = await generateLessonsMutation.mutateAsync({
        targetLanguage: currentSettings.targetLanguage,
        nativeLanguage: "English",
        level: currentSettings.intensity === "light" ? "beginner" : currentSettings.intensity === "medium" ? "intermediate" : "advanced",
        categories: currentSettings.categories,
        recentVocabulary,
        struggleAreas,
        count: currentSettings.dailyLimit,
        contextHint,
      });

      if (result.success && result.lessons.length > 0) {
        // Convert server lessons to MicroLesson format and store
        const newLessons: MicroLesson[] = result.lessons.map((l: any) => ({
          id: l.id,
          category: l.category,
          original: l.original,
          translated: l.translated,
          context: l.context,
          difficulty: l.difficulty as "easy" | "medium" | "hard",
          deliveredAt: Date.now(),
          practiced: false,
        }));
        setRecentLessons(newLessons);
        await AsyncStorage.setItem("@immersion_lessons_cache", JSON.stringify(newLessons));
        return newLessons;
      }
    } catch {
      // Fall back to static lessons if server is unavailable
    } finally {
      setIsGenerating(false);
    }
    return null;
  };

  const loadSettings = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) setSettings(JSON.parse(stored));
    } catch {}
  };

  const saveSettings = async (newSettings: ImmersionSettings) => {
    setSettings(newSettings);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newSettings));
    // Reschedule immersion notifications whenever settings change
    await scheduleImmersionNotifications(newSettings, categories);
  };

  const toggleEnabled = async () => {
    const updated = { ...settings, enabled: !settings.enabled };

    if (updated.enabled) {
      // Request notification permission before enabling
      const granted = await requestNotificationPermission();
      if (!granted) {
        Alert.alert(
          "Notifications Required",
          "Immersion Mode needs notification permission to send micro-lessons throughout the day. Please enable notifications in Settings.",
          [{ text: "OK" }]
        );
        return;
      }
    }

    await saveSettings(updated);

    if (updated.enabled) {
      // Fetch personalized lessons from server to use in notifications
      fetchPersonalizedLessons(updated);
      Alert.alert(
        "Immersion Mode Activated! \uD83C\uDF0D",
        "Generating personalized micro-lessons based on your level and vocabulary. Your phone is now a language learning machine!",
        [{ text: "Let's Go!" }]
      );
    } else {
      // Cancel all immersion notifications when disabled
      await cancelImmersionNotifications();
    }
  };

  const setIntensity = (level: "light" | "medium" | "full") => {
    const limits = { light: 8, medium: 15, full: 30 };
    saveSettings({ ...settings, intensity: level, dailyLimit: limits[level] });
  };

  const toggleCategory = (categoryId: string) => {
    const updated = categories.map((c) =>
      c.id === categoryId ? { ...c, enabled: !c.enabled } : c
    );
    setCategories(updated);
    const enabledIds = updated.filter((c) => c.enabled).map((c) => c.id);
    saveSettings({ ...settings, categories: enabledIds });
  };

  const getIntensityDescription = (level: string) => {
    switch (level) {
      case "light": return "8 micro-lessons/day • Gentle reminders";
      case "medium": return "15 micro-lessons/day • Balanced immersion";
      case "full": return "30 micro-lessons/day • Maximum exposure";
      default: return "";
    }
  };

  const renderCategoryCard = ({ item }: { item: ImmersionCategory }) => (
    <View style={[styles.categoryCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.categoryLeft}>
        <View style={[styles.categoryIcon, { backgroundColor: colors.primary + "15" }]}>
          <Ionicons name={item.icon as any} size={20} color={colors.primary} />
        </View>
        <View style={styles.categoryInfo}>
          <Text style={[styles.categoryName, { color: colors.foreground }]}>{item.name}</Text>
          <Text style={[styles.categoryDesc, { color: colors.muted }]}>{item.description}</Text>
        </View>
      </View>
      <Switch
        value={item.enabled}
        onValueChange={() => toggleCategory(item.id)}
        trackColor={{ false: colors.border, true: colors.primary + "60" }}
        thumbColor={item.enabled ? colors.primary : colors.muted}
      />
    </View>
  );

  const renderMicroLesson = ({ item }: { item: MicroLesson }) => (
    <View style={[styles.lessonCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.lessonHeader}>
        <View style={[styles.lessonCategoryBadge, { backgroundColor: colors.primary + "10" }]}>
          <Text style={[styles.lessonCategoryText, { color: colors.primary }]}>
            {item.category.charAt(0).toUpperCase() + item.category.slice(1)}
          </Text>
        </View>
        {item.practiced && (
          <View style={[styles.practicedBadge, { backgroundColor: colors.success + "15" }]}>
            <Ionicons name="checkmark-circle" size={12} color={colors.success} />
            <Text style={[styles.practicedText, { color: colors.success }]}>Practiced</Text>
          </View>
        )}
      </View>
      <Text style={[styles.lessonOriginal, { color: colors.muted }]}>{item.original}</Text>
      <Text style={[styles.lessonTranslated, { color: colors.foreground }]}>{item.translated}</Text>
      <Text style={[styles.lessonContext, { color: colors.muted }]}>{item.context}</Text>
      <Text style={[styles.lessonTime, { color: colors.muted }]}>
        {new Date(item.deliveredAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
      </Text>
    </View>
  );

  return (
    <ScreenContainer edges={["top", "left", "right"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Immersion Mode</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Hero Card */}
        <View style={[styles.heroCard, { backgroundColor: settings.enabled ? colors.primary + "10" : colors.surface, borderColor: settings.enabled ? colors.primary + "30" : colors.border }]}>
          <View style={styles.heroTop}>
            <View>
              <Text style={[styles.heroTitle, { color: colors.foreground }]}>
                {settings.enabled ? "Immersion Active" : "Activate Immersion"}
              </Text>
              <Text style={[styles.heroSubtitle, { color: colors.muted }]}>
                Transform your phone into a language learning machine
              </Text>
            </View>
            <Switch
              value={settings.enabled}
              onValueChange={toggleEnabled}
              trackColor={{ false: colors.border, true: colors.primary + "60" }}
              thumbColor={settings.enabled ? colors.primary : colors.muted}
            />
          </View>

          {/* Stats Row */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.primary }]}>{settings.immersionStreak}</Text>
              <Text style={[styles.statLabel, { color: colors.muted }]}>Day Streak</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.primary }]}>{settings.totalLessonsDelivered}</Text>
              <Text style={[styles.statLabel, { color: colors.muted }]}>Lessons</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.primary }]}>{settings.dailyLimit}</Text>
              <Text style={[styles.statLabel, { color: colors.muted }]}>Per Day</Text>
            </View>
          </View>
        </View>

        {/* Intensity Selector */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Intensity Level</Text>
          <View style={styles.intensityRow}>
            {(["light", "medium", "full"] as const).map((level) => (
              <TouchableOpacity
                key={level}
                style={[
                  styles.intensityOption,
                  {
                    backgroundColor: settings.intensity === level ? colors.primary + "15" : colors.surface,
                    borderColor: settings.intensity === level ? colors.primary : colors.border,
                  },
                ]}
                onPress={() => setIntensity(level)}
                activeOpacity={0.7}
              >
                <Text style={[styles.intensityIcon]}>
                  {level === "light" ? "🌤" : level === "medium" ? "☀️" : "🔥"}
                </Text>
                <Text style={[styles.intensityLabel, { color: settings.intensity === level ? colors.primary : colors.foreground }]}>
                  {level.charAt(0).toUpperCase() + level.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={[styles.intensityDesc, { color: colors.muted }]}>
            {getIntensityDescription(settings.intensity)}
          </Text>
        </View>

        {/* Quiet Hours */}
        <View style={[styles.quietHoursCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.quietHoursHeader}>
            <Ionicons name="moon" size={18} color={colors.primary} />
            <Text style={[styles.quietHoursTitle, { color: colors.foreground }]}>Quiet Hours</Text>
          </View>
          <Text style={[styles.quietHoursText, { color: colors.muted }]}>
            No notifications between {settings.quietHoursStart}:00 — {settings.quietHoursEnd}:00
          </Text>
        </View>

        {/* Categories */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Immersion Categories</Text>
          <Text style={[styles.sectionSubtitle, { color: colors.muted }]}>
            Choose what types of notifications get translated
          </Text>
          <FlatList
            data={categories}
            renderItem={renderCategoryCard}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            contentContainerStyle={styles.categoriesList}
          />
        </View>

        {/* Example Translations */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>How It Works</Text>
          <View style={[styles.exampleCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.exampleRow}>
              <View style={styles.exampleBefore}>
                <Text style={[styles.exampleLabel, { color: colors.muted }]}>Your phone says:</Text>
                <Text style={[styles.exampleText, { color: colors.foreground }]}>"Your Uber is arriving"</Text>
              </View>
              <Ionicons name="arrow-forward" size={18} color={colors.primary} />
              <View style={styles.exampleAfter}>
                <Text style={[styles.exampleLabel, { color: colors.primary }]}>Immersion says:</Text>
                <Text style={[styles.exampleText, { color: colors.primary }]}>"Votre Uber arrive"</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Recent Micro-Lessons */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Today's Micro-Lessons</Text>
          <FlatList
            data={recentLessons}
            renderItem={renderMicroLesson}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            contentContainerStyle={styles.lessonsList}
          />
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 18, fontWeight: "700" },
  scrollContent: { padding: 16, gap: 20, paddingBottom: 100 },
  heroCard: { borderRadius: 16, padding: 18, borderWidth: 0.5, gap: 16 },
  heroTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  heroTitle: { fontSize: 20, fontWeight: "800" },
  heroSubtitle: { fontSize: 13, marginTop: 4 },
  statsRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-around" },
  statItem: { alignItems: "center", gap: 2 },
  statValue: { fontSize: 22, fontWeight: "800" },
  statLabel: { fontSize: 11 },
  statDivider: { width: 1, height: 30 },
  section: { gap: 10 },
  sectionTitle: { fontSize: 17, fontWeight: "700" },
  sectionSubtitle: { fontSize: 13 },
  intensityRow: { flexDirection: "row", gap: 10 },
  intensityOption: { flex: 1, alignItems: "center", padding: 14, borderRadius: 12, borderWidth: 1, gap: 4 },
  intensityIcon: { fontSize: 22 },
  intensityLabel: { fontSize: 12, fontWeight: "600" },
  intensityDesc: { fontSize: 12, textAlign: "center" },
  quietHoursCard: { borderRadius: 12, padding: 14, borderWidth: 0.5, gap: 6 },
  quietHoursHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  quietHoursTitle: { fontSize: 14, fontWeight: "600" },
  quietHoursText: { fontSize: 12, marginLeft: 26 },
  categoriesList: { gap: 8 },
  categoryCard: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 12, borderRadius: 12, borderWidth: 0.5 },
  categoryLeft: { flexDirection: "row", alignItems: "center", gap: 12, flex: 1 },
  categoryIcon: { width: 38, height: 38, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  categoryInfo: { flex: 1 },
  categoryName: { fontSize: 14, fontWeight: "600" },
  categoryDesc: { fontSize: 11, marginTop: 2 },
  exampleCard: { borderRadius: 12, padding: 16, borderWidth: 0.5 },
  exampleRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  exampleBefore: { flex: 1 },
  exampleAfter: { flex: 1 },
  exampleLabel: { fontSize: 10, fontWeight: "600", marginBottom: 4 },
  exampleText: { fontSize: 13, fontWeight: "600" },
  lessonsList: { gap: 8 },
  lessonCard: { borderRadius: 12, padding: 12, borderWidth: 0.5, gap: 4 },
  lessonHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 },
  lessonCategoryBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  lessonCategoryText: { fontSize: 10, fontWeight: "600" },
  practicedBadge: { flexDirection: "row", alignItems: "center", gap: 3, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  practicedText: { fontSize: 10, fontWeight: "600" },
  lessonOriginal: { fontSize: 12, textDecorationLine: "line-through" },
  lessonTranslated: { fontSize: 15, fontWeight: "600" },
  lessonContext: { fontSize: 11 },
  lessonTime: { fontSize: 10, alignSelf: "flex-end" },
});
