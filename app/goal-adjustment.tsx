/**
 * Goal Adjustment Modal
 * Shows when user is 3+ days behind pace.
 * Offers alternative routes: extend deadline, increase daily time,
 * weekend catch-up, or switch to quick wins.
 */
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { ScreenContainer } from "@/components/screen-container";
import {
  type BehindStatus,
  type GoalAdjustmentSuggestion,
  checkBehindStatus,
  dismissAdjustmentModal,
} from "@/lib/accountability";

const { width } = Dimensions.get("window");

const Colors = {
  bg: "#0A0E1A",
  card: "#141B2D",
  cardBorder: "#1E293B",
  text: "#FFFFFF",
  textSecondary: "#94A3B8",
  textMuted: "#64748B",
  primary: "#00AAFF",
  warning: "#F59E0B",
  error: "#EF4444",
  success: "#10B981",
  purple: "#8B5CF6",
};

export default function GoalAdjustmentScreen() {
  const [behindStatus, setBehindStatus] = useState<BehindStatus | null>(null);
  const [selectedSuggestion, setSelectedSuggestion] = useState<number | null>(null);
  const [applied, setApplied] = useState(false);

  useEffect(() => {
    loadStatus();
  }, []);

  async function loadStatus() {
    // In production, dailyTargetMinutes and actualMinutes come from learning-pace context
    const status = await checkBehindStatus(30, 5);
    setBehindStatus(status);
  }

  function handleApplySuggestion(suggestion: GoalAdjustmentSuggestion) {
    setApplied(true);
    // In production, this would update the learning pace settings
    setTimeout(() => {
      router.back();
    }, 2000);
  }

  async function handleDismiss() {
    await dismissAdjustmentModal();
    router.back();
  }

  function handleNotNow() {
    router.back();
  }

  const iconForType = (type: string) => {
    switch (type) {
      case "extend_deadline": return "calendar-outline";
      case "increase_daily": return "trending-up";
      case "weekend_catchup": return "sunny-outline";
      case "change_focus": return "flash-outline";
      default: return "bulb-outline";
    }
  };

  const colorForType = (type: string) => {
    switch (type) {
      case "extend_deadline": return Colors.primary;
      case "increase_daily": return Colors.warning;
      case "weekend_catchup": return Colors.success;
      case "change_focus": return Colors.purple;
      default: return Colors.primary;
    }
  };

  if (applied) {
    return (
      <ScreenContainer edges={["top", "bottom", "left", "right"]}>
        <View style={styles.successContainer}>
          <View style={styles.successIcon}>
            <Ionicons name="checkmark-circle" size={64} color={Colors.success} />
          </View>
          <Text style={styles.successTitle}>Plan Updated!</Text>
          <Text style={styles.successText}>
            Your learning plan has been adjusted. You're back on a path that works for your schedule.
          </Text>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer edges={["top", "bottom", "left", "right"]}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleNotNow} style={styles.closeBtn}>
            <Ionicons name="close" size={24} color={Colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Status Alert */}
        <View style={styles.alertCard}>
          <View style={styles.alertIconWrap}>
            <Ionicons name="alert-circle" size={32} color={Colors.warning} />
          </View>
          <Text style={styles.alertTitle}>
            You're {behindStatus?.daysBehind || 3} days behind pace
          </Text>
          <Text style={styles.alertDeficit}>
            ~{behindStatus?.hoursDeficit.toFixed(1) || "1.5"} hours to catch up
          </Text>
        </View>

        {/* Motivational Message */}
        <View style={styles.motivationCard}>
          <Ionicons name="heart" size={18} color={Colors.error} />
          <Text style={styles.motivationText}>
            {behindStatus?.motivationalMessage ||
              "Life got busy, and that's okay. Let's adjust your plan so it works with your schedule."}
          </Text>
        </View>

        {/* Suggestions */}
        <Text style={styles.sectionTitle}>Here's what we can do:</Text>

        {(behindStatus?.suggestions || []).map((suggestion, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.suggestionCard,
              selectedSuggestion === index && styles.suggestionCardSelected,
            ]}
            onPress={() => setSelectedSuggestion(index)}
            activeOpacity={0.8}
          >
            <View style={styles.suggestionHeader}>
              <View style={[styles.suggestionIconWrap, { backgroundColor: colorForType(suggestion.type) + "20" }]}>
                <Ionicons
                  name={iconForType(suggestion.type) as any}
                  size={20}
                  color={colorForType(suggestion.type)}
                />
              </View>
              <View style={styles.suggestionTitleWrap}>
                <Text style={styles.suggestionTitle}>{suggestion.title}</Text>
                <Text style={styles.suggestionImpact}>{suggestion.impact}</Text>
              </View>
              {selectedSuggestion === index && (
                <Ionicons name="checkmark-circle" size={22} color={Colors.success} />
              )}
            </View>
            <Text style={styles.suggestionDesc}>{suggestion.description}</Text>
          </TouchableOpacity>
        ))}

        {/* Apply Button */}
        {selectedSuggestion !== null && behindStatus?.suggestions && (
          <TouchableOpacity
            style={styles.applyBtn}
            onPress={() => handleApplySuggestion(behindStatus.suggestions[selectedSuggestion])}
            activeOpacity={0.8}
          >
            <Text style={styles.applyBtnText}>
              {behindStatus.suggestions[selectedSuggestion].actionLabel}
            </Text>
            <Ionicons name="arrow-forward" size={18} color="#FFF" />
          </TouchableOpacity>
        )}

        {/* Dismiss */}
        <TouchableOpacity style={styles.dismissBtn} onPress={handleDismiss}>
          <Text style={styles.dismissBtnText}>Remind me in 3 days</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  content: { padding: 20 },
  header: { flexDirection: "row", justifyContent: "flex-end", marginBottom: 16 },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.card,
    alignItems: "center",
    justifyContent: "center",
  },

  alertCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.warning + "40",
    marginBottom: 16,
  },
  alertIconWrap: { marginBottom: 12 },
  alertTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: Colors.text,
    textAlign: "center",
    marginBottom: 6,
  },
  alertDeficit: {
    fontSize: 14,
    color: Colors.warning,
    fontWeight: "600",
  },

  motivationCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  motivationText: {
    flex: 1,
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: 14,
  },

  suggestionCard: {
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: Colors.cardBorder,
  },
  suggestionCardSelected: {
    borderColor: Colors.success,
    backgroundColor: Colors.success + "08",
  },
  suggestionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 10,
  },
  suggestionIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  suggestionTitleWrap: { flex: 1 },
  suggestionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.text,
  },
  suggestionImpact: {
    fontSize: 12,
    color: Colors.success,
    marginTop: 2,
  },
  suggestionDesc: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 19,
    marginLeft: 48,
  },

  applyBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.success,
    borderRadius: 14,
    paddingVertical: 16,
    marginTop: 12,
  },
  applyBtnText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
  },

  dismissBtn: {
    alignItems: "center",
    paddingVertical: 14,
    marginTop: 8,
  },
  dismissBtnText: {
    fontSize: 14,
    color: Colors.textMuted,
  },

  successContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
    backgroundColor: Colors.bg,
  },
  successIcon: { marginBottom: 20 },
  successTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: 12,
  },
  successText: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: 22,
  },
});
