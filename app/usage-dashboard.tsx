import { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import { Colors, Spacing, BorderRadius, FontSize } from "../constants/Colors";
import {
  getUsageData,
  getDaysRemainingInCycle,
  getUsagePercentage,
  getRemainingUsage,
  TIER_LIMITS,
  OVERAGE_RATES,
  type UsageData,
  type ServiceKey,
  type TierLevel,
} from "@/lib/usage-limits";

interface ServiceDisplay {
  key: ServiceKey;
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  color: string;
}

const SERVICE_ITEMS: ServiceDisplay[] = [
  { key: "callTranslationMinutes", icon: "call", label: "Voice Call Translation", color: Colors.success },
  { key: "videoCallMinutes", icon: "videocam", label: "Video Call Translation", color: Colors.glow },
  { key: "songTranslations", icon: "musical-notes", label: "Song Translations", color: Colors.gold },
  { key: "urlTranslations", icon: "globe", label: "URL/Page Translations", color: "#06B6D4" },
  { key: "videoUploadMinutes", icon: "film", label: "Video Upload Translation", color: "#A855F7" },
  { key: "voiceMemos", icon: "mic", label: "Voice Memos", color: Colors.secondary },
  { key: "languages", icon: "language", label: "Languages", color: "#F97316" },
  { key: "aiTranscriptions", icon: "document-text", label: "AI Transcriptions", color: "#EC4899" },
];

export default function UsageDashboardScreen() {
  const [data, setData] = useState<UsageData | null>(null);

  useEffect(() => {
    getUsageData().then(setData);
  }, []);

  if (!data) return null;

  const daysLeft = getDaysRemainingInCycle(data);

  const getTierLabel = (tier: TierLevel) => {
    switch (tier) {
      case "free": return "Free Tier";
      case "pro": return "Pro Plan";
      case "premium": return "Premium Plan";
    }
  };

  const getTierColor = (tier: TierLevel) => {
    switch (tier) {
      case "free": return Colors.textSecondary;
      case "pro": return Colors.secondary;
      case "premium": return Colors.gold;
    }
  };

  const getProgressColor = (pct: number) => {
    if (pct >= 100) return Colors.error;
    if (pct >= 90) return "#EF4444";
    if (pct >= 75) return Colors.warning;
    return Colors.secondary;
  };

  const renderProgressBar = (pct: number) => {
    const color = getProgressColor(pct);
    return (
      <View style={styles.progressBg}>
        <View style={[styles.progressFill, { width: `${Math.min(pct, 100)}%`, backgroundColor: color }]} />
      </View>
    );
  };

  const formatUsed = (service: ServiceKey) => {
    const limit = TIER_LIMITS[data.tier][service].limit;
    const used = data.usage[service] || 0;
    if (limit === null) return `${used} used (unlimited)`;
    if (limit === 0) return "Not available on this tier";
    return `${used} / ${limit} ${TIER_LIMITS[data.tier][service].unit}`;
  };

  const formatRemainingLabel = (service: ServiceKey) => {
    const remaining = getRemainingUsage(data, service);
    const limit = TIER_LIMITS[data.tier][service].limit;
    if (limit === null) return "Unlimited";
    if (limit === 0) return "Upgrade required";
    return `${remaining} left`;
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Usage</Text>
        <TouchableOpacity
          style={styles.historyBtn}
          onPress={() => router.push("/transaction-history" as any)}
        >
          <Ionicons name="receipt-outline" size={20} color={Colors.secondary} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Tier Badge & Cycle */}
        <View style={styles.tierCard}>
          <View style={styles.tierRow}>
            <View style={[styles.tierBadge, { borderColor: getTierColor(data.tier) }]}>
              <Ionicons
                name={data.tier === "premium" ? "diamond" : data.tier === "pro" ? "star" : "person"}
                size={16}
                color={getTierColor(data.tier)}
              />
              <Text style={[styles.tierLabel, { color: getTierColor(data.tier) }]}>
                {getTierLabel(data.tier)}
              </Text>
            </View>
            <View style={styles.cycleInfo}>
              <Ionicons name="calendar-outline" size={14} color={Colors.textSecondary} />
              <Text style={styles.cycleText}>{daysLeft} days left in cycle</Text>
            </View>
          </View>
          {data.tier === "free" && (
            <TouchableOpacity
              style={styles.upgradeBtn}
              onPress={() => {
                if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push("/subscription" as any);
              }}
            >
              <Ionicons name="rocket" size={16} color="#fff" />
              <Text style={styles.upgradeBtnText}>Upgrade for More</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Usage Breakdown */}
        <Text style={styles.sectionTitle}>Usage This Cycle</Text>
        {SERVICE_ITEMS.map((item) => {
          const pct = getUsagePercentage(data, item.key);
          const limit = TIER_LIMITS[data.tier][item.key].limit;
          const isUnavailable = limit === 0;
          const isUnlimited = limit === null;

          return (
            <View key={item.key} style={[styles.usageRow, isUnavailable && { opacity: 0.5 }]}>
              <View style={[styles.usageIconWrap, { backgroundColor: item.color + "20" }]}>
                <Ionicons name={item.icon} size={20} color={item.color} />
              </View>
              <View style={styles.usageInfo}>
                <View style={styles.usageLabelRow}>
                  <Text style={styles.usageLabel}>{item.label}</Text>
                  <Text style={[styles.usageRemaining, { color: isUnavailable ? Colors.error : isUnlimited ? Colors.success : getProgressColor(pct) }]}>
                    {formatRemainingLabel(item.key)}
                  </Text>
                </View>
                {!isUnavailable && renderProgressBar(isUnlimited ? 5 : pct)}
                <Text style={styles.usageDetail}>{formatUsed(item.key)}</Text>
              </View>
            </View>
          );
        })}

        {/* Pay-As-You-Go Rates */}
        <Text style={styles.sectionTitle}>Pay-As-You-Go Rates</Text>
        <View style={styles.overageCard}>
          <Text style={styles.overageSubtitle}>
            When you hit your cap, continue with pay-as-you-go:
          </Text>
          {SERVICE_ITEMS.map((item) => {
            const rate = OVERAGE_RATES[item.key];
            return (
              <View key={item.key} style={styles.overageRow}>
                <Ionicons name={item.icon} size={16} color={item.color} />
                <Text style={styles.overageLabel}>{item.label}</Text>
                <Text style={styles.overagePrice}>
                  ${rate.pricePerUnit.toFixed(2)} {rate.unit}
                </Text>
              </View>
            );
          })}
        </View>

        {/* Tier Comparison */}
        <Text style={styles.sectionTitle}>Plan Comparison</Text>
        <View style={styles.comparisonCard}>
          <View style={styles.compRow}>
            <Text style={[styles.compHeader, { flex: 1.5 }]}>Service</Text>
            <Text style={[styles.compHeader, { color: Colors.textSecondary }]}>Free</Text>
            <Text style={[styles.compHeader, { color: Colors.secondary }]}>Pro</Text>
            <Text style={[styles.compHeader, { color: Colors.gold }]}>Premium</Text>
          </View>
          <View style={styles.compDivider} />
          {SERVICE_ITEMS.map((item) => {
            const free = TIER_LIMITS.free[item.key].limit;
            const pro = TIER_LIMITS.pro[item.key].limit;
            const premium = TIER_LIMITS.premium[item.key].limit;
            const formatVal = (v: number | null) => v === null ? "∞" : v === 0 ? "—" : `${v}`;
            return (
              <View key={item.key} style={styles.compRow}>
                <Text style={[styles.compLabel, { flex: 1.5 }]} numberOfLines={1}>
                  {item.label.replace(" Translation", "").replace(" Translations", "")}
                </Text>
                <Text style={styles.compValue}>{formatVal(free)}</Text>
                <Text style={styles.compValue}>{formatVal(pro)}</Text>
                <Text style={[styles.compValue, { color: Colors.gold }]}>{formatVal(premium)}</Text>
              </View>
            );
          })}
        </View>

        {/* Quick Tips */}
        <View style={styles.tipsCard}>
          <Text style={styles.tipsTitle}>Tips to Save Usage</Text>
          <View style={styles.tipRow}>
            <Ionicons name="checkmark-circle" size={16} color={Colors.success} />
            <Text style={styles.tipText}>Use text-only translation on calls to save video minutes</Text>
          </View>
          <View style={styles.tipRow}>
            <Ionicons name="checkmark-circle" size={16} color={Colors.success} />
            <Text style={styles.tipText}>Shorter voice memos use less of your monthly quota</Text>
          </View>
          <View style={styles.tipRow}>
            <Ionicons name="checkmark-circle" size={16} color={Colors.success} />
            <Text style={styles.tipText}>URL translation is cheaper than video — use it for articles</Text>
          </View>
          <View style={styles.tipRow}>
            <Ionicons name="checkmark-circle" size={16} color={Colors.success} />
            <Text style={styles.tipText}>Upgrade to Pro for 10x more across all services</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

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
  backBtn: {
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
    fontWeight: "800",
    color: Colors.textPrimary,
  },
  historyBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surfaceCard,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.border,
  },

  // Tier Card
  tierCard: {
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.md,
    backgroundColor: Colors.surfaceCard,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tierRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  tierBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderRadius: BorderRadius.full,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  tierLabel: {
    fontSize: FontSize.sm,
    fontWeight: "700",
  },
  cycleInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  cycleText: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
  },
  upgradeBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: Colors.secondary,
    paddingVertical: 10,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.sm,
  },
  upgradeBtnText: {
    fontSize: FontSize.sm,
    fontWeight: "700",
    color: "#fff",
  },

  // Progress Bar
  progressBg: {
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 4,
  },

  // Section
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: "700",
    color: Colors.textPrimary,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.xl,
    marginBottom: Spacing.sm,
  },

  // Usage Row
  usageRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
    backgroundColor: Colors.surfaceCard,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  usageIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  usageInfo: {
    flex: 1,
  },
  usageLabelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  usageLabel: {
    fontSize: FontSize.sm,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  usageRemaining: {
    fontSize: FontSize.xs,
    fontWeight: "600",
  },
  usageDetail: {
    fontSize: 10,
    color: Colors.textMuted,
    marginTop: 4,
  },

  // Overage Card
  overageCard: {
    marginHorizontal: Spacing.lg,
    backgroundColor: Colors.surfaceCard,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  overageSubtitle: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  overageRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.border,
  },
  overageLabel: {
    flex: 1,
    fontSize: FontSize.xs,
    color: Colors.textPrimary,
  },
  overagePrice: {
    fontSize: FontSize.xs,
    fontWeight: "700",
    color: Colors.gold,
  },

  // Tips
  tipsCard: {
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.xl,
    marginBottom: Spacing.xl,
    backgroundColor: Colors.surfaceCard,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.greenBorder,
  },
  tipsTitle: {
    fontSize: FontSize.md,
    fontWeight: "700",
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  tipRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  tipText: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    flex: 1,
  },

  // Comparison
  comparisonCard: {
    marginHorizontal: Spacing.lg,
    backgroundColor: Colors.surfaceCard,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  compRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
  },
  compHeader: {
    flex: 1,
    fontSize: FontSize.xs,
    fontWeight: "700",
    color: Colors.textPrimary,
    textAlign: "center",
  },
  compLabel: {
    flex: 1,
    fontSize: 10,
    color: Colors.textSecondary,
  },
  compValue: {
    flex: 1,
    fontSize: FontSize.xs,
    fontWeight: "600",
    color: Colors.textPrimary,
    textAlign: "center",
  },
  compDivider: {
    height: 1,
    backgroundColor: Colors.border,
  },
});
