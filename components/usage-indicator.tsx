import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Colors, Spacing, BorderRadius, FontSize } from "@/constants/Colors";
import {
  getUsageData,
  getRemainingUsage,
  getUsagePercentage,
  formatRemaining,
  getDaysRemainingInCycle,
  type ServiceKey,
  type UsageData,
} from "@/lib/usage-limits";

interface UsageIndicatorProps {
  service: ServiceKey;
  compact?: boolean;
  showUpgrade?: boolean;
}

const SERVICE_LABELS: Record<ServiceKey, { label: string; icon: string }> = {
  callTranslationMinutes: { label: "Call Translation", icon: "call" },
  videoCallMinutes: { label: "Video Calls", icon: "videocam" },
  songTranslations: { label: "Song Translations", icon: "musical-notes" },
  urlTranslations: { label: "URL Translations", icon: "globe" },
  videoUploadMinutes: { label: "Video Upload", icon: "film" },
  voiceMemos: { label: "Voice Memos", icon: "mic" },
  languages: { label: "Languages", icon: "language" },
  aiTranscriptions: { label: "AI Transcriptions", icon: "sparkles" },
};

export function UsageIndicator({ service, compact = false, showUpgrade = true }: UsageIndicatorProps) {
  const [usageData, setUsageData] = useState<UsageData | null>(null);

  useEffect(() => {
    getUsageData().then(setUsageData);
  }, []);

  if (!usageData) return null;

  const percentage = getUsagePercentage(usageData, service);
  const remaining = getRemainingUsage(usageData, service);
  const remainingText = formatRemaining(usageData, service);
  const daysLeft = getDaysRemainingInCycle(usageData);
  const { label, icon } = SERVICE_LABELS[service];
  const isWarning = percentage >= 80;
  const isExhausted = remaining === 0;

  if (compact) {
    return (
      <View style={styles.compactContainer}>
        <View style={styles.compactBarBg}>
          <View
            style={[
              styles.compactBarFill,
              { width: `${percentage}%` },
              isWarning && styles.barWarning,
              isExhausted && styles.barExhausted,
            ]}
          />
        </View>
        <Text style={[styles.compactText, isExhausted && styles.textExhausted]}>
          {remainingText}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.labelRow}>
          <Ionicons name={icon as any} size={16} color={isExhausted ? Colors.error : Colors.secondary} />
          <Text style={styles.label}>{label}</Text>
        </View>
        <Text style={[styles.remaining, isExhausted && styles.textExhausted]}>
          {remainingText}
        </Text>
      </View>

      <View style={styles.barBg}>
        <View
          style={[
            styles.barFill,
            { width: `${percentage}%` },
            isWarning && styles.barWarning,
            isExhausted && styles.barExhausted,
          ]}
        />
      </View>

      <View style={styles.footer}>
        <Text style={styles.cycleText}>Resets in {daysLeft} days</Text>
        {showUpgrade && isWarning && (
          <TouchableOpacity
            style={styles.upgradeBtn}
            onPress={() => router.push("/subscription")}
          >
            <Ionicons name="arrow-up-circle" size={12} color={Colors.secondary} />
            <Text style={styles.upgradeText}>Upgrade</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

// ─── Full Usage Dashboard Card ───────────────────────────────────────────────

export function UsageSummaryCard() {
  const [usageData, setUsageData] = useState<UsageData | null>(null);

  useEffect(() => {
    getUsageData().then(setUsageData);
  }, []);

  if (!usageData) return null;

  const daysLeft = getDaysRemainingInCycle(usageData);
  const tierLabel = usageData.tier.charAt(0).toUpperCase() + usageData.tier.slice(1);

  const keyServices: ServiceKey[] = [
    "callTranslationMinutes",
    "songTranslations",
    "urlTranslations",
    "voiceMemos",
  ];

  return (
    <View style={styles.summaryCard}>
      <View style={styles.summaryHeader}>
        <View>
          <Text style={styles.summaryTitle}>Usage This Month</Text>
          <Text style={styles.summaryTier}>{tierLabel} Plan • {daysLeft} days left</Text>
        </View>
        <TouchableOpacity
          style={styles.viewAllBtn}
          onPress={() => router.push("/usage-dashboard")}
        >
          <Text style={styles.viewAllText}>View All</Text>
          <Ionicons name="chevron-forward" size={14} color={Colors.secondary} />
        </TouchableOpacity>
      </View>

      <View style={styles.summaryGrid}>
        {keyServices.map((service) => {
          const percentage = getUsagePercentage(usageData, service);
          const { label, icon } = SERVICE_LABELS[service];
          const remaining = getRemainingUsage(usageData, service);
          const isExhausted = remaining === 0;

          return (
            <View key={service} style={styles.summaryItem}>
              <Ionicons
                name={icon as any}
                size={18}
                color={isExhausted ? Colors.error : Colors.secondary}
              />
              <View style={styles.summaryItemBar}>
                <View
                  style={[
                    styles.summaryItemFill,
                    { width: `${percentage}%` },
                    isExhausted && styles.barExhausted,
                  ]}
                />
              </View>
              <Text style={styles.summaryItemLabel} numberOfLines={1}>
                {label}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

// ─── STYLES ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surfaceCard,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  label: {
    fontSize: FontSize.sm,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  remaining: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
  },
  textExhausted: {
    color: Colors.error,
  },
  barBg: {
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.surfaceElevated,
    overflow: "hidden",
  },
  barFill: {
    height: "100%",
    borderRadius: 3,
    backgroundColor: Colors.secondary,
  },
  barWarning: {
    backgroundColor: Colors.warning,
  },
  barExhausted: {
    backgroundColor: Colors.error,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 6,
  },
  cycleText: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
  },
  upgradeBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  upgradeText: {
    fontSize: FontSize.xs,
    fontWeight: "600",
    color: Colors.secondary,
  },

  // Compact
  compactContainer: {
    gap: 4,
  },
  compactBarBg: {
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.surfaceElevated,
    overflow: "hidden",
  },
  compactBarFill: {
    height: "100%",
    borderRadius: 2,
    backgroundColor: Colors.secondary,
  },
  compactText: {
    fontSize: 10,
    color: Colors.textSecondary,
  },

  // Summary card
  summaryCard: {
    backgroundColor: Colors.surfaceCard,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  summaryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: Spacing.md,
  },
  summaryTitle: {
    fontSize: FontSize.md,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  summaryTier: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  viewAllBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  viewAllText: {
    fontSize: FontSize.xs,
    color: Colors.secondary,
    fontWeight: "600",
  },
  summaryGrid: {
    gap: Spacing.sm,
  },
  summaryItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  summaryItemBar: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.surfaceElevated,
    overflow: "hidden",
  },
  summaryItemFill: {
    height: "100%",
    borderRadius: 2,
    backgroundColor: Colors.secondary,
  },
  summaryItemLabel: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    width: 90,
  },
});
