/**
 * Feature Gate Banner
 *
 * A lightweight banner that shows at the top of a screen when a feature
 * is limited by the user's plan. Shows remaining uses and upgrade CTA.
 */
import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useColors } from "@/hooks/use-colors";
import {
  type GatedFeature,
  type PlanId,
  getRemainingUses,
  FEATURE_GATES,
} from "@/lib/premium-feature-gates";

interface FeatureGateBannerProps {
  feature: GatedFeature;
  currentPlan?: PlanId;
  onUpgrade?: () => void;
}

export function FeatureGateBanner({ feature, currentPlan = "free", onUpgrade }: FeatureGateBannerProps) {
  const colors = useColors();
  const router = useRouter();
  const [remaining, setRemaining] = useState<number>(-1);

  useEffect(() => {
    getRemainingUses(feature, currentPlan).then(setRemaining);
  }, [feature, currentPlan]);

  const gate = FEATURE_GATES[feature]?.[currentPlan];
  if (!gate) return null;

  // Unlimited access — no banner needed
  if (gate.dailyLimit === -1) return null;

  // Feature not available on this plan
  if (gate.dailyLimit === 0) {
    return (
      <View style={[st.banner, { backgroundColor: colors.warning + "15", borderColor: colors.warning + "40" }]}>
        <Ionicons name="lock-closed" size={16} color={colors.warning} />
        <Text style={[st.bannerText, { color: colors.foreground }]} numberOfLines={2}>
          {gate.upgradeMessage}
        </Text>
        <TouchableOpacity
          style={[st.upgradeBtn, { backgroundColor: colors.primary }]}
          onPress={onUpgrade || (() => router.push("/subscription" as any))}
        >
          <Text style={st.upgradeBtnText}>Upgrade</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Has daily limit — show remaining
  if (remaining >= 0 && remaining <= gate.dailyLimit) {
    const isLow = remaining <= 1;
    return (
      <View style={[st.banner, {
        backgroundColor: isLow ? colors.error + "10" : colors.primary + "08",
        borderColor: isLow ? colors.error + "30" : colors.primary + "20",
      }]}>
        <Ionicons
          name={isLow ? "alert-circle" : "information-circle"}
          size={16}
          color={isLow ? colors.error : colors.primary}
        />
        <Text style={[st.bannerText, { color: colors.foreground }]}>
          {remaining === 0
            ? "Daily limit reached"
            : `${remaining} of ${gate.dailyLimit} uses remaining today`}
        </Text>
        {remaining === 0 && (
          <TouchableOpacity
            style={[st.upgradeBtn, { backgroundColor: colors.primary }]}
            onPress={onUpgrade || (() => router.push("/subscription" as any))}
          >
            <Text style={st.upgradeBtnText}>Upgrade</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  return null;
}

const st = StyleSheet.create({
  banner: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    marginHorizontal: 16,
    marginBottom: 8,
    gap: 8,
  },
  bannerText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 16,
  },
  upgradeBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  upgradeBtnText: {
    color: "#FFF",
    fontSize: 12,
    fontWeight: "700",
  },
});
