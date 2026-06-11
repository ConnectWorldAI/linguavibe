/**
 * Live Cultural Feed — Real-time notifications and vocabulary suggestions
 * for approaching cultural holidays.
 * 
 * Shows a news-feed style list of upcoming holidays with:
 * - Countdown timers (7/3/1 days)
 * - Vocabulary cards to learn before the holiday
 * - "Start Cultural Lesson" buttons
 * - Push notification scheduling for approaching holidays
 */

import { useEffect, useState, useMemo, useCallback } from "react";
import { Text, View, FlatList, TouchableOpacity, Platform, Switch } from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import {
  getUpcomingHolidays,
  getAllHolidaysForLanguage,
  getDaysUntilHolidayPublic,
  type CulturalHoliday,
} from "@/lib/cultural-calendar";
import { scheduleCulturalFeedNotifications } from "@/lib/cultural-feed-notifications";

// ─── Language Options ─────────────────────────────────────────────────────────
const LANGUAGE_OPTIONS = [
  { code: "es-DO", label: "Dominican", flag: "🇩🇴" },
  { code: "es-MX", label: "Mexican", flag: "🇲🇽" },
  { code: "es-CO", label: "Colombian", flag: "🇨🇴" },
  { code: "es-VE", label: "Venezuelan", flag: "🇻🇪" },
  { code: "es-CU", label: "Cuban", flag: "🇨🇺" },
  { code: "es-CR", label: "Costa Rican", flag: "🇨🇷" },
  { code: "es-AR", label: "Argentine", flag: "🇦🇷" },
  { code: "es-PE", label: "Peruvian", flag: "🇵🇪" },
  { code: "es-CL", label: "Chilean", flag: "🇨🇱" },
  { code: "es-PR", label: "Puerto Rican", flag: "🇵🇷" },
  { code: "es", label: "Spanish", flag: "🇪🇸" },
  { code: "fr", label: "French", flag: "🇫🇷" },
  { code: "fr-HT", label: "Haitian Creole", flag: "🇭🇹" },
  { code: "fr-QC", label: "Québécois", flag: "🇨🇦" },
  { code: "fr-SN", label: "Senegalese", flag: "🇸🇳" },
  { code: "pt-BR", label: "Brazilian", flag: "🇧🇷" },
  { code: "pt-PT", label: "Portuguese", flag: "🇵🇹" },
  { code: "pt", label: "Portuguese", flag: "🇵🇹" },
  { code: "ar-EG", label: "Egyptian", flag: "🇪🇬" },
  { code: "ar-LB", label: "Lebanese", flag: "🇱🇧" },
  { code: "ar-AE", label: "Emirati", flag: "🇦🇪" },
  { code: "ja", label: "Japanese", flag: "🇯🇵" },
  { code: "ko", label: "Korean", flag: "🇰🇷" },
  { code: "zh", label: "Mandarin", flag: "🇨🇳" },
  { code: "it", label: "Italian", flag: "🇮🇹" },
  { code: "de", label: "German", flag: "🇩🇪" },
];

// ─── Urgency Colors ─────────────────────────────────────────────────────────
function getUrgencyColor(daysUntil: number): string {
  if (daysUntil <= 1) return "#EF4444"; // Red — happening now/tomorrow
  if (daysUntil <= 3) return "#F59E0B"; // Amber — this week
  if (daysUntil <= 7) return "#10B981"; // Green — coming soon
  return "#6366F1"; // Indigo — upcoming
}

function getUrgencyLabel(daysUntil: number): string {
  if (daysUntil <= 0) return "HAPPENING NOW";
  if (daysUntil === 1) return "TOMORROW";
  if (daysUntil <= 3) return "THIS WEEK";
  if (daysUntil <= 7) return "COMING SOON";
  return `IN ${daysUntil} DAYS`;
}

// ─── Component ──────────────────────────────────────────────────────────────
export default function LiveCulturalFeedScreen() {
  const router = useRouter();
  const colors = useColors();
  const [activeLang, setActiveLang] = useState("es-DO");
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [showLanguagePicker, setShowLanguagePicker] = useState(false);

  // Load user's language preference
  useEffect(() => {
    (async () => {
      try {
        const prefsStr = await AsyncStorage.getItem("@language_preferences");
        if (prefsStr) {
          const prefs = JSON.parse(prefsStr);
          if (prefs.targetLanguages?.length > 0) {
            setActiveLang(prefs.targetLanguages[0]);
            return;
          }
        }
        const lang = await AsyncStorage.getItem("@target_language");
        if (lang) setActiveLang(lang);
      } catch {}
    })();
  }, []);

  // Load notification preference
  useEffect(() => {
    (async () => {
      try {
        const val = await AsyncStorage.getItem("@cultural_feed_notifications");
        if (val !== null) setNotificationsEnabled(val === "true");
      } catch {}
    })();
  }, []);

  // Get upcoming holidays (next 30 days)
  const upcomingHolidays = useMemo(() => {
    return getUpcomingHolidays(activeLang, 30);
  }, [activeLang]);

  // Get all holidays for the year (for "All Holidays" section)
  const allHolidays = useMemo(() => {
    return getAllHolidaysForLanguage(activeLang);
  }, [activeLang]);

  // Toggle notifications
  const handleToggleNotifications = useCallback(async (value: boolean) => {
    setNotificationsEnabled(value);
    await AsyncStorage.setItem("@cultural_feed_notifications", value.toString());
    if (value) {
      await scheduleCulturalFeedNotifications(activeLang);
    }
  }, [activeLang]);

  // Start a cultural lesson for a holiday
  const handleStartLesson = useCallback((holiday: CulturalHoliday) => {
    const culturalHint = `${holiday.nativeName} — ${holiday.description}. Vocabulary: ${holiday.vocabulary.slice(0, 5).join(", ")}. Traditions: ${holiday.traditions.slice(0, 3).join(", ")}. Greetings: ${holiday.greetings.join(", ")}. Foods: ${holiday.foods.slice(0, 4).join(", ")}.`;
    router.push({
      pathname: "/adaptive-lesson",
      params: {
        lessonId: `cultural_${holiday.id}`,
        topic: holiday.nativeName,
        category: "vocabulary",
        level: "A2",
        language: activeLang,
        culturalHint,
      },
    });
  }, [activeLang, router]);

  // Get the current language option
  const currentLangOption = LANGUAGE_OPTIONS.find(l => l.code === activeLang) || LANGUAGE_OPTIONS[0];

  // ─── Render Holiday Card ────────────────────────────────────────────────────
  const renderHolidayCard = useCallback(({ item: holiday }: { item: CulturalHoliday }) => {
    const now = new Date();
    const daysUntil = getDaysUntilHolidayPublic(holiday, now.getMonth() + 1, now.getDate());
    const urgencyColor = getUrgencyColor(daysUntil);
    const urgencyLabel = getUrgencyLabel(daysUntil);

    return (
      <View className="bg-surface rounded-2xl p-4 mb-4 border border-border">
        {/* Urgency Badge */}
        <View className="flex-row items-center justify-between mb-3">
          <View style={{ backgroundColor: urgencyColor + "20", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 }}>
            <Text style={{ color: urgencyColor, fontSize: 11, fontWeight: "700", letterSpacing: 0.5 }}>
              {urgencyLabel}
            </Text>
          </View>
          {holiday.newsStyle && (
            <View className="flex-row items-center">
              <Ionicons name="newspaper-outline" size={14} color={colors.muted} />
              <Text className="text-muted text-xs ml-1">Live</Text>
            </View>
          )}
        </View>

        {/* Holiday Name */}
        <Text className="text-foreground text-xl font-bold mb-1">{holiday.nativeName}</Text>
        <Text className="text-muted text-sm mb-3">{holiday.name}</Text>

        {/* News-style headline */}
        {holiday.newsStyle && (
          <View className="bg-background rounded-xl p-3 mb-3">
            <Text className="text-foreground text-sm font-medium italic">
              "{holiday.newsStyle.headline}"
            </Text>
          </View>
        )}

        {/* Location */}
        {holiday.location && (
          <View className="flex-row items-center mb-3">
            <Ionicons name="location-outline" size={14} color={colors.muted} />
            <Text className="text-muted text-xs ml-1">
              {holiday.location.city}, {holiday.location.country}
            </Text>
          </View>
        )}

        {/* Vocabulary Preview */}
        <View className="mb-3">
          <Text className="text-foreground text-sm font-semibold mb-2">
            Learn Before It Starts:
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {holiday.vocabulary.slice(0, 6).map((word, i) => (
              <View key={i} className="bg-background rounded-lg px-3 py-1.5">
                <Text className="text-foreground text-xs font-medium">{word}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Greetings */}
        {holiday.greetings.length > 0 && (
          <View className="mb-3">
            <Text className="text-foreground text-sm font-semibold mb-1">
              Say This:
            </Text>
            <Text className="text-primary text-sm font-medium">
              {holiday.greetings[0]}
            </Text>
          </View>
        )}

        {/* Foods */}
        {holiday.foods.length > 0 && (
          <View className="mb-3">
            <Text className="text-foreground text-sm font-semibold mb-1">
              Traditional Foods:
            </Text>
            <Text className="text-muted text-xs">
              {holiday.foods.slice(0, 4).join(" • ")}
            </Text>
          </View>
        )}

        {/* Action Buttons */}
        <View className="flex-row gap-3 mt-2">
          <TouchableOpacity
            className="flex-1 bg-primary rounded-xl py-3 items-center"
            onPress={() => handleStartLesson(holiday)}
            style={({ pressed }) => pressed ? { opacity: 0.8 } : {}}
          >
            <Text className="text-background font-semibold text-sm">Start Cultural Lesson</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }, [colors, handleStartLesson]);

  return (
    <ScreenContainer className="p-0">
      {/* Header */}
      <View className="px-5 pt-4 pb-3">
        <View className="flex-row items-center justify-between mb-2">
          <TouchableOpacity onPress={() => router.back()} className="mr-3">
            <Ionicons name="arrow-back" size={24} color={colors.foreground} />
          </TouchableOpacity>
          <View className="flex-1">
            <Text className="text-foreground text-2xl font-bold">Live Cultural Feed</Text>
            <Text className="text-muted text-sm">Upcoming holidays & vocabulary</Text>
          </View>
        </View>

        {/* Language Selector */}
        <TouchableOpacity
          className="flex-row items-center bg-surface rounded-xl px-4 py-2.5 mt-2"
          onPress={() => setShowLanguagePicker(!showLanguagePicker)}
        >
          <Text className="text-lg mr-2">{currentLangOption.flag}</Text>
          <Text className="text-foreground font-medium flex-1">{currentLangOption.label}</Text>
          <Ionicons name={showLanguagePicker ? "chevron-up" : "chevron-down"} size={18} color={colors.muted} />
        </TouchableOpacity>

        {/* Language Picker Dropdown */}
        {showLanguagePicker && (
          <View className="bg-surface rounded-xl mt-2 border border-border max-h-48">
            <FlatList
              data={LANGUAGE_OPTIONS}
              keyExtractor={(item) => item.code}
              renderItem={({ item }) => (
                <TouchableOpacity
                  className="flex-row items-center px-4 py-2.5 border-b border-border"
                  onPress={() => {
                    setActiveLang(item.code);
                    setShowLanguagePicker(false);
                  }}
                >
                  <Text className="text-lg mr-2">{item.flag}</Text>
                  <Text className={`text-sm ${item.code === activeLang ? "text-primary font-bold" : "text-foreground"}`}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              )}
            />
          </View>
        )}

        {/* Notification Toggle */}
        <View className="flex-row items-center justify-between bg-surface rounded-xl px-4 py-3 mt-3">
          <View className="flex-row items-center flex-1">
            <Ionicons name="notifications" size={18} color={colors.primary} />
            <Text className="text-foreground text-sm font-medium ml-2">Holiday Alerts</Text>
          </View>
          <Switch
            value={notificationsEnabled}
            onValueChange={handleToggleNotifications}
            trackColor={{ false: colors.border, true: colors.primary + "60" }}
            thumbColor={notificationsEnabled ? colors.primary : colors.muted}
          />
        </View>
      </View>

      {/* Feed Content */}
      <FlatList
        data={upcomingHolidays.length > 0 ? upcomingHolidays : allHolidays.slice(0, 10)}
        keyExtractor={(item) => item.id}
        renderItem={renderHolidayCard}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }}
        ListHeaderComponent={
          upcomingHolidays.length === 0 ? (
            <View className="bg-surface rounded-2xl p-4 mb-4 items-center">
              <Ionicons name="calendar-outline" size={32} color={colors.muted} />
              <Text className="text-muted text-sm mt-2 text-center">
                No holidays in the next 30 days for {currentLangOption.label}.{"\n"}
                Showing all holidays for the year:
              </Text>
            </View>
          ) : (
            <View className="mb-2">
              <Text className="text-muted text-xs uppercase tracking-wider font-semibold">
                {upcomingHolidays.length} holiday{upcomingHolidays.length !== 1 ? "s" : ""} approaching
              </Text>
            </View>
          )
        }
        ListEmptyComponent={
          <View className="items-center py-8">
            <Ionicons name="globe-outline" size={48} color={colors.muted} />
            <Text className="text-muted text-sm mt-3 text-center">
              No cultural holidays found for this language.{"\n"}
              Try selecting a different dialect.
            </Text>
          </View>
        }
      />
    </ScreenContainer>
  );
}
