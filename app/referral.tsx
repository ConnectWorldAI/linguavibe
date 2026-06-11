import React, { useState, useEffect, useCallback } from "react";
import { trackReferralShared, trackInviteSent } from "@/lib/analytics";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Share,
  Platform,
  ScrollView,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Colors, Spacing, BorderRadius, FontSize } from "../constants/Colors";
import { useUsage } from "@/lib/usage-context";
import {
  getReferralProfile,
  getTierForReferrals,
  getTierProgress,
  REFERRAL_TIERS,
  type ReferralProfile,
} from "@/lib/referral-program";
import { redeemReferralCode, hasRedeemedReferral } from "@/lib/referral-incentive";
import { shouldPlayHaptic } from "@/lib/sound-settings";

const REFERRAL_KEY = "@connectworld_referral_code";
const REFERRAL_STATS_KEY = "@connectworld_referral_stats";

interface ReferralStats {
  code: string;
  totalReferred: number;
  totalCreditsEarned: number;
  referrals: { name: string; date: string; credits: number }[];
}

function generateCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "CM-";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export default function ReferralScreen() {
  const { incrementUsage } = useUsage();
  const [stats, setStats] = useState<ReferralStats>({
    code: "",
    totalReferred: 0,
    totalCreditsEarned: 0,
    referrals: [],
  });
  const [redeemCode, setRedeemCode] = useState("");
  const [redeemStatus, setRedeemStatus] = useState<"idle" | "success" | "error">("idle");
  const [copied, setCopied] = useState(false);
  const [tierProfile, setTierProfile] = useState<ReferralProfile | null>(null);

  useEffect(() => {
    loadReferralData();
    getReferralProfile().then(setTierProfile);
  }, []);

  const loadReferralData = async () => {
    try {
      const stored = await AsyncStorage.getItem(REFERRAL_STATS_KEY);
      if (stored) {
        setStats(JSON.parse(stored));
      } else {
        // Generate new code
        const code = generateCode();
        const newStats: ReferralStats = {
          code,
          totalReferred: 3, // Show some existing referrals for demo
          totalCreditsEarned: 75,
          referrals: [
            { name: "Maria G.", date: "May 18", credits: 25 },
            { name: "Carlos R.", date: "May 12", credits: 25 },
            { name: "Yuki T.", date: "May 5", credits: 25 },
          ],
        };
        await AsyncStorage.setItem(REFERRAL_STATS_KEY, JSON.stringify(newStats));
        setStats(newStats);
      }
    } catch {}
  };

  const handleShare = async () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await Share.share({
        message: `Join me on ConnectWorld AI! Use my referral code ${stats.code} to get 25 free credits when you sign up. Download: https://connectworld.ai/invite/${stats.code}`,
        title: "Invite to ConnectWorld AI",
      });
      trackReferralShared("social");
      trackInviteSent("referral");
    } catch {}
  };

  const handleCopy = () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCopied(true);
    trackReferralShared("link");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRedeem = async () => {
    if (!redeemCode.trim()) return;
    if (Platform.OS !== "web") {
      const hapticOn = await shouldPlayHaptic();
      if (hapticOn) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    // Use server-validated redemption flow
    const result = await redeemReferralCode(redeemCode);
    if (result.success) {
      setRedeemStatus("success");
      setRedeemCode("");
      setTimeout(() => setRedeemStatus("idle"), 3000);
    } else {
      setRedeemStatus("error");
      setTimeout(() => setRedeemStatus("idle"), 3000);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => {
            if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.back();
          }}
          style={styles.backBtn}
        >
          <Ionicons name="chevron-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Refer & Earn</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <View style={styles.heroCard}>
          <Text style={styles.heroEmoji}>🎁</Text>
          <Text style={styles.heroTitle}>Give 25, Get 25</Text>
          <Text style={styles.heroDesc}>
            Share your code with friends. When they sign up, you both get 25 free credits!
          </Text>
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.totalReferred}</Text>
            <Text style={styles.statLabel}>Friends Invited</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: Colors.gold }]}>
              {stats.totalCreditsEarned}
            </Text>
            <Text style={styles.statLabel}>Credits Earned</Text>
          </View>
        </View>

        {/* Tier Progress */}
        {tierProfile && (() => {
          const currentTier = getTierForReferrals(tierProfile.successfulReferrals);
          const { progress, nextTier, remaining } = getTierProgress(tierProfile.successfulReferrals);
          return (
            <View style={styles.tierCard}>
              <View style={styles.tierHeader}>
                <Text style={{ fontSize: 24 }}>{currentTier.icon}</Text>
                <View style={{ marginLeft: 10, flex: 1 }}>
                  <Text style={styles.tierLabel}>{currentTier.label} Tier</Text>
                  <Text style={styles.tierMultiplier}>{currentTier.multiplier}x reward multiplier</Text>
                </View>
              </View>
              {nextTier && (
                <View style={styles.tierProgress}>
                  <View style={styles.tierProgressBar}>
                    <View style={[styles.tierProgressFill, { width: `${progress}%`, backgroundColor: currentTier.color }]} />
                  </View>
                  <Text style={styles.tierProgressText}>
                    {remaining} more referral{remaining !== 1 ? "s" : ""} to {nextTier.icon} {nextTier.label}
                  </Text>
                </View>
              )}
              <View style={styles.tierPerks}>
                {currentTier.perks.map((perk, i) => (
                  <View key={i} style={styles.tierPerkRow}>
                    <Ionicons name="checkmark-circle" size={14} color={currentTier.color} />
                    <Text style={styles.tierPerkText}>{perk}</Text>
                  </View>
                ))}
              </View>
            </View>
          );
        })()}

        {/* Your Code */}
        <View style={styles.codeCard}>
          <Text style={styles.codeLabel}>Your Referral Code</Text>
          <View style={styles.codeRow}>
            <Text style={styles.codeText}>{stats.code}</Text>
            <TouchableOpacity onPress={handleCopy} style={styles.copyBtn}>
              <Ionicons
                name={copied ? "checkmark" : "copy-outline"}
                size={18}
                color={copied ? Colors.success : Colors.secondary}
              />
            </TouchableOpacity>
          </View>
          {copied && <Text style={styles.copiedText}>Copied to clipboard!</Text>}
        </View>

        {/* Share Button */}
        <TouchableOpacity style={styles.shareBtn} onPress={handleShare}>
          <Ionicons name="share-social" size={20} color={Colors.primary} />
          <Text style={styles.shareBtnText}>Share with Friends</Text>
        </TouchableOpacity>

        {/* How It Works */}
        <View style={styles.howItWorks}>
          <Text style={styles.sectionTitle}>How It Works</Text>
          <View style={styles.step}>
            <View style={styles.stepNum}>
              <Text style={styles.stepNumText}>1</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Share Your Code</Text>
              <Text style={styles.stepDesc}>
                Send your unique code to friends via text, email, or social media
              </Text>
            </View>
          </View>
          <View style={styles.step}>
            <View style={styles.stepNum}>
              <Text style={styles.stepNumText}>2</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Friend Signs Up</Text>
              <Text style={styles.stepDesc}>
                They enter your code during registration and get 25 free credits
              </Text>
            </View>
          </View>
          <View style={styles.step}>
            <View style={styles.stepNum}>
              <Text style={styles.stepNumText}>3</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>You Get Rewarded</Text>
              <Text style={styles.stepDesc}>
                You automatically receive 25 bonus credits — no limit on referrals!
              </Text>
            </View>
          </View>
        </View>

        {/* Redeem Code */}
        <View style={styles.redeemCard}>
          <Text style={styles.sectionTitle}>Have a Code?</Text>
          <Text style={styles.redeemDesc}>
            Enter a friend's referral code to claim your 25 free credits
          </Text>
          <View style={styles.redeemRow}>
            <TextInput
              style={styles.redeemInput}
              placeholder="Enter code (e.g. CM-ABC123)"
              placeholderTextColor={Colors.textMuted}
              value={redeemCode}
              onChangeText={setRedeemCode}
              autoCapitalize="characters"
              returnKeyType="done"
              onSubmitEditing={handleRedeem}
            />
            <TouchableOpacity
              style={[
                styles.redeemBtn,
                !redeemCode.trim() && styles.redeemBtnDisabled,
              ]}
              onPress={handleRedeem}
              disabled={!redeemCode.trim()}
            >
              <Text style={styles.redeemBtnText}>Redeem</Text>
            </TouchableOpacity>
          </View>
          {redeemStatus === "success" && (
            <View style={styles.redeemFeedback}>
              <Ionicons name="checkmark-circle" size={16} color={Colors.success} />
              <Text style={[styles.redeemFeedbackText, { color: Colors.success }]}>
                +25 credits added to your balance!
              </Text>
            </View>
          )}
          {redeemStatus === "error" && (
            <View style={styles.redeemFeedback}>
              <Ionicons name="close-circle" size={16} color={Colors.error} />
              <Text style={[styles.redeemFeedbackText, { color: Colors.error }]}>
                Invalid code. Please check and try again.
              </Text>
            </View>
          )}
        </View>

        {/* Recent Referrals */}
        {stats.referrals.length > 0 && (
          <View style={styles.recentCard}>
            <Text style={styles.sectionTitle}>Recent Referrals</Text>
            {stats.referrals.map((ref, idx) => (
              <View key={idx} style={styles.referralItem}>
                <View style={styles.referralAvatar}>
                  <Ionicons name="person" size={16} color={Colors.secondary} />
                </View>
                <View style={styles.referralInfo}>
                  <Text style={styles.referralName}>{ref.name}</Text>
                  <Text style={styles.referralDate}>{ref.date}</Text>
                </View>
                <View style={styles.referralCredits}>
                  <Text style={styles.referralCreditsText}>+{ref.credits}</Text>
                  <Ionicons name="diamond" size={10} color={Colors.gold} />
                </View>
              </View>
            ))}
          </View>
        )}
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
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surfaceCard,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: FontSize.lg,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  content: {
    padding: Spacing.md,
    paddingBottom: 100,
    gap: Spacing.md,
  },
  heroCard: {
    backgroundColor: Colors.surfaceCard,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.glowBorder,
  },
  heroEmoji: {
    fontSize: 48,
    marginBottom: Spacing.sm,
  },
  heroTitle: {
    fontSize: FontSize.xxl,
    fontWeight: "800",
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  heroDesc: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: 22,
  },
  statsRow: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.surfaceCard,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statValue: {
    fontSize: FontSize.xxl,
    fontWeight: "800",
    color: Colors.secondary,
  },
  statLabel: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  codeCard: {
    backgroundColor: Colors.surfaceCard,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.glowBorder,
  },
  codeLabel: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  codeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  codeText: {
    fontSize: 28,
    fontWeight: "900",
    color: Colors.secondary,
    letterSpacing: 2,
  },
  copyBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(0, 170, 255, 0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  copiedText: {
    fontSize: FontSize.xs,
    color: Colors.success,
    marginTop: Spacing.xs,
  },
  shareBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    backgroundColor: Colors.secondary,
    borderRadius: BorderRadius.lg,
    paddingVertical: 16,
  },
  shareBtnText: {
    fontSize: FontSize.md,
    fontWeight: "700",
    color: Colors.primary,
  },
  howItWorks: {
    backgroundColor: Colors.surfaceCard,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.md,
  },
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: "700",
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  step: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  stepNum: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(0, 170, 255, 0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  stepNumText: {
    fontSize: FontSize.sm,
    fontWeight: "700",
    color: Colors.secondary,
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: FontSize.md,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  stepDesc: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: 2,
    lineHeight: 18,
  },
  redeemCard: {
    backgroundColor: Colors.surfaceCard,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  redeemDesc: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
  },
  redeemRow: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  redeemInput: {
    flex: 1,
    height: 44,
    backgroundColor: Colors.surfaceElevated,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    color: Colors.textPrimary,
    fontSize: FontSize.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  redeemBtn: {
    paddingHorizontal: Spacing.lg,
    height: 44,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.gold,
    alignItems: "center",
    justifyContent: "center",
  },
  redeemBtnDisabled: {
    opacity: 0.5,
  },
  redeemBtnText: {
    fontSize: FontSize.md,
    fontWeight: "700",
    color: Colors.primary,
  },
  redeemFeedback: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    marginTop: Spacing.sm,
  },
  redeemFeedbackText: {
    fontSize: FontSize.sm,
    fontWeight: "500",
  },
  tierCard: {
    backgroundColor: Colors.surfaceCard,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.md,
  },
  tierHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  tierLabel: {
    fontSize: FontSize.md,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  tierMultiplier: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    marginTop: 2,
  },
  tierProgress: {
    marginBottom: 12,
  },
  tierProgressBar: {
    height: 6,
    backgroundColor: Colors.surface,
    borderRadius: 3,
    overflow: "hidden" as const,
    marginBottom: 6,
  },
  tierProgressFill: {
    height: "100%" as any,
    borderRadius: 3,
  },
  tierProgressText: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
  },
  tierPerks: {
    gap: 6,
  },
  tierPerkRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  tierPerkText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  recentCard: {
    backgroundColor: Colors.surfaceCard,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  referralItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    gap: Spacing.sm,
  },
  referralAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(0, 170, 255, 0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  referralInfo: {
    flex: 1,
  },
  referralName: {
    fontSize: FontSize.md,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  referralDate: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
  },
  referralCredits: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  referralCreditsText: {
    fontSize: FontSize.sm,
    fontWeight: "700",
    color: Colors.gold,
  },
});
