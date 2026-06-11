import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import { Colors, Spacing, BorderRadius, FontSize } from "../constants/Colors";
import {
  redeemReferralCode,
  hasRedeemedReferral,
  REFERRAL_REWARDS,
} from "@/lib/referral-incentive";
import { shouldPlayHaptic } from "@/lib/sound-settings";

export default function RedeemReferralScreen() {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [rewards, setRewards] = useState<{
    bonusXP: number;
    streakFreezes: number;
    videoCallMinutes: number;
    translationCredits: number;
  } | null>(null);
  const [redeeming, setRedeeming] = useState(false);
  const [alreadyRedeemed, setAlreadyRedeemed] = useState(false);

  useEffect(() => {
    hasRedeemedReferral().then((redeemed) => {
      setAlreadyRedeemed(redeemed);
    });
  }, []);

  const handleRedeem = async () => {
    if (!code.trim()) return;
    setRedeeming(true);
    setError("");

    const result = await redeemReferralCode(code);
    setRedeeming(false);

    if (result.success && result.rewards) {
      setSuccess(true);
      setRewards(result.rewards);
      if (Platform.OS !== "web") {
        const hapticOn = await shouldPlayHaptic();
        if (hapticOn) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } else {
      setError(result.error || "Could not redeem code.");
      if (Platform.OS !== "web") {
        const hapticOn = await shouldPlayHaptic();
        if (hapticOn) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Redeem Referral Code</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.content}>
        {alreadyRedeemed && !success ? (
          <View style={styles.alreadyRedeemedCard}>
            <View style={styles.iconCircle}>
              <Ionicons name="checkmark-circle" size={48} color={Colors.success} />
            </View>
            <Text style={styles.alreadyRedeemedTitle}>Already Redeemed</Text>
            <Text style={styles.alreadyRedeemedDesc}>
              You've already redeemed a referral code. Each account can only redeem one code.
            </Text>
          </View>
        ) : success ? (
          <View style={styles.successCard}>
            <View style={[styles.iconCircle, { backgroundColor: Colors.success + "20" }]}>
              <Ionicons name="gift" size={48} color={Colors.success} />
            </View>
            <Text style={styles.successTitle}>Rewards Unlocked!</Text>
            {rewards && (
              <View style={styles.rewardsList}>
                <View style={styles.rewardRow}>
                  <Ionicons name="star" size={18} color={Colors.gold} />
                  <Text style={styles.rewardText}>+{rewards.bonusXP} Bonus XP</Text>
                </View>
                <View style={styles.rewardRow}>
                  <Ionicons name="snow" size={18} color={Colors.secondary} />
                  <Text style={styles.rewardText}>+{rewards.streakFreezes} Streak Freeze</Text>
                </View>
                <View style={styles.rewardRow}>
                  <Ionicons name="videocam" size={18} color="#8B5CF6" />
                  <Text style={styles.rewardText}>+{rewards.videoCallMinutes} min Video Calls</Text>
                </View>
                <View style={styles.rewardRow}>
                  <Ionicons name="language" size={18} color="#3B82F6" />
                  <Text style={styles.rewardText}>+{rewards.translationCredits} Translation Credits</Text>
                </View>
              </View>
            )}
            <TouchableOpacity
              style={styles.doneBtn}
              onPress={() => router.back()}
            >
              <Text style={styles.doneBtnText}>Done</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <View style={styles.infoCard}>
              <View style={[styles.iconCircle, { backgroundColor: Colors.secondary + "20" }]}>
                <Ionicons name="gift-outline" size={40} color={Colors.secondary} />
              </View>
              <Text style={styles.infoTitle}>Have a friend's code?</Text>
              <Text style={styles.infoDesc}>
                Enter their referral code below and you both earn rewards!
              </Text>
            </View>

            <View style={styles.inputCard}>
              <Text style={styles.inputLabel}>Referral Code</Text>
              <View style={styles.inputRow}>
                <TextInput
                  style={styles.codeInput}
                  placeholder="e.g. CW-A3B7K or CM-XYZ123"
                  placeholderTextColor={Colors.textSecondary}
                  value={code}
                  onChangeText={(t) => { setCode(t.toUpperCase()); setError(""); }}
                  autoCapitalize="characters"
                  maxLength={12}
                  returnKeyType="done"
                  onSubmitEditing={handleRedeem}
                />
              </View>

              {error ? (
                <View style={styles.errorRow}>
                  <Ionicons name="alert-circle" size={16} color={Colors.error} />
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              ) : null}

              <TouchableOpacity
                style={[styles.redeemBtn, (!code.trim() || redeeming) && styles.redeemBtnDisabled]}
                onPress={handleRedeem}
                disabled={!code.trim() || redeeming}
              >
                <Ionicons name="gift" size={20} color="#FFF" />
                <Text style={styles.redeemBtnText}>
                  {redeeming ? "Checking..." : "Redeem Code"}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.rewardsPreview}>
              <Text style={styles.rewardsPreviewTitle}>What you'll get:</Text>
              <View style={styles.rewardRow}>
                <Ionicons name="star" size={16} color={Colors.gold} />
                <Text style={styles.rewardPreviewText}>{REFERRAL_REWARDS.invitee.bonusXP} Bonus XP</Text>
              </View>
              <View style={styles.rewardRow}>
                <Ionicons name="snow" size={16} color={Colors.secondary} />
                <Text style={styles.rewardPreviewText}>{REFERRAL_REWARDS.invitee.streakFreezes} Streak Freeze</Text>
              </View>
              <View style={styles.rewardRow}>
                <Ionicons name="videocam" size={16} color="#8B5CF6" />
                <Text style={styles.rewardPreviewText}>{REFERRAL_REWARDS.invitee.videoCallMinutes} min Video Calls</Text>
              </View>
              <View style={styles.rewardRow}>
                <Ionicons name="language" size={16} color="#3B82F6" />
                <Text style={styles.rewardPreviewText}>{REFERRAL_REWARDS.invitee.translationCredits} Translation Credits</Text>
              </View>
            </View>
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.border,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: FontSize.lg,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  content: {
    flex: 1,
    padding: Spacing.lg,
    gap: 20,
  },
  infoCard: {
    alignItems: "center",
    paddingVertical: 24,
    gap: 12,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.surface,
  },
  infoTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: Colors.textPrimary,
    textAlign: "center",
  },
  infoDesc: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  inputCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    gap: 12,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  codeInput: {
    flex: 1,
    fontSize: 20,
    fontWeight: "700",
    color: Colors.textPrimary,
    letterSpacing: 2,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  errorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  errorText: {
    fontSize: 13,
    color: Colors.error,
  },
  redeemBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.secondary,
    paddingVertical: 14,
    borderRadius: BorderRadius.md,
    marginTop: 4,
  },
  redeemBtnDisabled: {
    opacity: 0.5,
  },
  redeemBtnText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFF",
  },
  rewardsPreview: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    gap: 8,
  },
  rewardsPreviewTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  rewardRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 2,
  },
  rewardPreviewText: {
    fontSize: 14,
    color: Colors.textPrimary,
  },
  successCard: {
    alignItems: "center",
    paddingVertical: 40,
    gap: 16,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  rewardsList: {
    gap: 10,
    marginTop: 8,
  },
  rewardText: {
    fontSize: 16,
    color: Colors.textPrimary,
    fontWeight: "500",
  },
  doneBtn: {
    backgroundColor: Colors.secondary,
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: BorderRadius.md,
    marginTop: 20,
  },
  doneBtnText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFF",
  },
  alreadyRedeemedCard: {
    alignItems: "center",
    paddingVertical: 40,
    gap: 12,
  },
  alreadyRedeemedTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  alreadyRedeemedDesc: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: 22,
    paddingHorizontal: 20,
  },
});
