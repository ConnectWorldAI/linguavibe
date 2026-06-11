/**
 * Cultural Feed Widget — Shows the next approaching holiday at a glance
 * on the home dashboard. Displays countdown, vocabulary preview, and
 * a quick-start lesson button.
 */

import { useEffect, useState, useMemo } from "react";
import { Text, View, TouchableOpacity, StyleSheet, Platform } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";
import { Colors } from "@/constants/Colors";
import {
  getUpcomingHolidays,
  getDaysUntilHolidayPublic,
  type CulturalHoliday,
} from "@/lib/cultural-calendar";

export function CulturalFeedWidget() {
  const [activeLang, setActiveLang] = useState("es-DO");
  const [nextHoliday, setNextHoliday] = useState<CulturalHoliday | null>(null);
  const [daysUntil, setDaysUntil] = useState(0);

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

  useEffect(() => {
    const upcoming = getUpcomingHolidays(activeLang, 60);
    if (upcoming.length > 0) {
      const holiday = upcoming[0];
      const now = new Date();
      const days = getDaysUntilHolidayPublic(holiday, now.getMonth() + 1, now.getDate());
      setNextHoliday(holiday);
      setDaysUntil(days);
    } else {
      setNextHoliday(null);
    }
  }, [activeLang]);

  if (!nextHoliday) return null;

  const urgencyColor = daysUntil <= 1 ? "#EF4444" : daysUntil <= 3 ? "#F59E0B" : daysUntil <= 7 ? "#10B981" : "#6366F1";
  const urgencyLabel = daysUntil <= 0 ? "TODAY" : daysUntil === 1 ? "TOMORROW" : daysUntil <= 7 ? `${daysUntil} DAYS` : `${daysUntil} DAYS`;

  return (
    <TouchableOpacity
      style={styles.container}
      activeOpacity={0.7}
      onPress={() => {
        if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.push("/live-cultural-feed" as any);
      }}
    >
      {/* Header row */}
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <Ionicons name="pulse" size={18} color="#EF4444" />
          <Text style={styles.headerTitle}>Live Cultural Feed</Text>
        </View>
        <View style={[styles.badge, { backgroundColor: urgencyColor + "20" }]}>
          <Text style={[styles.badgeText, { color: urgencyColor }]}>{urgencyLabel}</Text>
        </View>
      </View>

      {/* Holiday info */}
      <View style={styles.holidayRow}>
        <Text style={styles.holidayName}>{nextHoliday.nativeName}</Text>
        <Text style={styles.holidayEnglish}>{nextHoliday.name}</Text>
      </View>

      {/* Vocabulary preview */}
      <View style={styles.vocabRow}>
        <Text style={styles.vocabLabel}>Learn before it starts:</Text>
        <View style={styles.vocabChips}>
          {nextHoliday.vocabulary.slice(0, 3).map((word, i) => (
            <View key={i} style={styles.vocabChip}>
              <Text style={styles.vocabChipText}>{word}</Text>
            </View>
          ))}
          {nextHoliday.vocabulary.length > 3 && (
            <Text style={styles.vocabMore}>+{nextHoliday.vocabulary.length - 3}</Text>
          )}
        </View>
      </View>

      {/* Greeting */}
      {nextHoliday.greetings.length > 0 && (
        <View style={styles.greetingRow}>
          <Ionicons name="chatbubble-ellipses-outline" size={14} color={Colors.textSecondary} />
          <Text style={styles.greetingText}>Say: "{nextHoliday.greetings[0]}"</Text>
        </View>
      )}

      {/* Footer */}
      <View style={styles.footerRow}>
        <Text style={styles.footerText}>Tap to see all upcoming holidays</Text>
        <Ionicons name="chevron-forward" size={16} color={Colors.textSecondary} />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surfaceCard,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  headerTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#EF4444",
    letterSpacing: 0.3,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  holidayRow: {
    marginBottom: 10,
  },
  holidayName: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  holidayEnglish: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  vocabRow: {
    marginBottom: 8,
  },
  vocabLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: Colors.textSecondary,
    marginBottom: 6,
  },
  vocabChips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    alignItems: "center",
  },
  vocabChip: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  vocabChipText: {
    fontSize: 12,
    fontWeight: "500",
    color: Colors.textPrimary,
  },
  vocabMore: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: "600",
  },
  greetingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 10,
    paddingTop: 4,
  },
  greetingText: {
    fontSize: 13,
    color: Colors.primary,
    fontWeight: "500",
    fontStyle: "italic",
  },
  footerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 8,
    borderTopWidth: 0.5,
    borderTopColor: Colors.border,
  },
  footerText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
});
