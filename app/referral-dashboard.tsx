/**
 * Referral Dashboard Screen
 * 
 * Shows user's referral code, tier progress, referral history,
 * and unclaimed rewards with a "Claim All" button.
 */
import { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Share,
  Platform,
  StyleSheet,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import * as Clipboard from "expo-clipboard";
import * as Haptics from "expo-haptics";
import { shouldPlayHaptic } from "@/lib/sound-settings";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import {
  getReferralData,
  claimReferralRewards,
  getRewardHistory,
  clearUnreadReferralCount,
  REFERRAL_TIERS,
  type ReferralData,
  type ReferralRecord,
  type RewardHistoryEntry,
} from "@/lib/referral-incentive";
import { useNotificationBadges } from "@/lib/notification-badges";

export default function ReferralDashboardScreen() {
  const router = useRouter();
  const colors = useColors();
  const { setBadge } = useNotificationBadges();
  const [data, setData] = useState<ReferralData | null>(null);
  const [rewardHistory, setRewardHistory] = useState<RewardHistoryEntry[]>([]);
  const [claiming, setClaiming] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const loadData = useCallback(async () => {
    const referralData = await getReferralData();
    setData(referralData);
    const history = await getRewardHistory();
    setRewardHistory(history);
    // Clear badge when user views the dashboard
    await clearUnreadReferralCount();
    setBadge("referrals", 0);
  }, [setBadge]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCopyCode = async () => {
    if (!data?.code) return;
    await Clipboard.setStringAsync(data.code);
    if (Platform.OS !== "web") {
      const hapticOn = await shouldPlayHaptic();
      if (hapticOn) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShareCode = async () => {
    if (!data?.code) return;
    try {
      await Share.share({
        message: `Join me on ConnectWorld AI! Use my referral code ${data.code} to get bonus XP, a free Streak Freeze, video call minutes, and translation credits. Download now: https://connectworld.ai/invite/${data.code}`,
      });
    } catch {}
  };

  const handleClaimAll = async () => {
    if (!data || claiming) return;
    const { unclaimedXP, unclaimedFreezes, unclaimedVideoMinutes, unclaimedTranslationCredits } = data.rewards;
    if (unclaimedXP === 0 && unclaimedFreezes === 0 && unclaimedVideoMinutes === 0 && unclaimedTranslationCredits === 0) {
      Alert.alert("No Rewards", "You have no unclaimed rewards right now.");
      return;
    }

    setClaiming(true);
    const claimed = await claimReferralRewards();
    if (Platform.OS !== "web") {
      const hapticOn = await shouldPlayHaptic();
      if (hapticOn) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    Alert.alert(
      "Rewards Claimed! 🎉",
      `+${claimed.xp} XP\n+${claimed.freezes} Streak Freeze(s)\n+${claimed.videoMinutes} min video calls\n+${claimed.translationCredits} translation credits`
    );
    await loadData();
    setClaiming(false);
  };

  const hasUnclaimed = data && (
    data.rewards.unclaimedXP > 0 ||
    data.rewards.unclaimedFreezes > 0 ||
    data.rewards.unclaimedVideoMinutes > 0 ||
    data.rewards.unclaimedTranslationCredits > 0
  );

  const tierProgress = data ? {
    current: data.currentTier,
    next: data.nextTier,
    referralCount: data.referrals.length,
    toNext: data.referralsToNextTier,
  } : null;

  const renderReferralItem = ({ item }: { item: ReferralRecord }) => (
    <View style={[styles.historyItem, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.historyLeft}>
        <Text style={[styles.historyName, { color: colors.foreground }]}>
          {item.inviteeName}
        </Text>
        <Text style={[styles.historyDate, { color: colors.muted }]}>
          {new Date(item.timestamp).toLocaleDateString()}
        </Text>
      </View>
      <View style={[styles.statusBadge, { backgroundColor: item.rewardsClaimed ? colors.success + "20" : colors.warning + "20" }]}>
        <Text style={[styles.statusText, { color: item.rewardsClaimed ? colors.success : colors.warning }]}>
          {item.rewardsClaimed ? "Claimed" : "Pending"}
        </Text>
      </View>
    </View>
  );

  return (
    <ScreenContainer edges={["top", "left", "right"]} className="flex-1">
      <FlatList
        data={data?.referrals || []}
        keyExtractor={(item) => item.id}
        renderItem={renderReferralItem}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View>
            {/* Header */}
            <View style={styles.header}>
              <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                <Text style={[styles.backText, { color: colors.primary }]}>← Back</Text>
              </TouchableOpacity>
              <Text style={[styles.title, { color: colors.foreground }]}>Referral Dashboard</Text>
            </View>

            {/* Referral Code Card */}
            <View style={[styles.codeCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.codeLabel, { color: colors.muted }]}>Your Referral Code</Text>
              <Text style={[styles.codeText, { color: colors.primary }]}>{data?.code || "..."}</Text>
              <View style={styles.codeActions}>
                <TouchableOpacity
                  onPress={handleCopyCode}
                  style={[styles.codeButton, { backgroundColor: copied ? colors.success + "20" : colors.primary + "15" }]}
                >
                  <Text style={[styles.codeButtonText, { color: copied ? colors.success : colors.primary }]}>
                    {copied ? "✓ Copied!" : "📋 Copy Code"}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleShareCode}
                  style={[styles.codeButton, { backgroundColor: colors.primary + "15" }]}
                >
                  <Text style={[styles.codeButtonText, { color: colors.primary }]}>📤 Share</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Tier Progress */}
            <View style={[styles.tierCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Tier Progress</Text>
              <View style={styles.tierRow}>
                {REFERRAL_TIERS.map((tier, idx) => {
                  const isActive = tierProgress && tierProgress.referralCount >= tier.referrals;
                  const isCurrent = tierProgress?.current?.title === tier.title;
                  return (
                    <View key={tier.title} style={styles.tierItem}>
                      <View style={[
                        styles.tierBadge,
                        { backgroundColor: isActive ? colors.primary + "20" : colors.border + "40" },
                        isCurrent && { borderWidth: 2, borderColor: colors.primary },
                      ]}>
                        <Text style={styles.tierEmoji}>{tier.badge}</Text>
                      </View>
                      <Text style={[styles.tierName, { color: isActive ? colors.foreground : colors.muted }]}>
                        {tier.title}
                      </Text>
                      <Text style={[styles.tierReq, { color: colors.muted }]}>{tier.referrals}+</Text>
                    </View>
                  );
                })}
              </View>
              {tierProgress?.next && (
                <View style={styles.progressSection}>
                  <View style={[styles.progressBar, { backgroundColor: colors.border + "40" }]}>
                    <View
                      style={[
                        styles.progressFill,
                        {
                          backgroundColor: colors.primary,
                          width: `${Math.min(100, ((tierProgress.referralCount - (tierProgress.current?.referrals || 0)) / (tierProgress.next.referrals - (tierProgress.current?.referrals || 0))) * 100)}%`,
                        },
                      ]}
                    />
                  </View>
                  <Text style={[styles.progressText, { color: colors.muted }]}>
                    {tierProgress.toNext} more referral{tierProgress.toNext !== 1 ? "s" : ""} to {tierProgress.next.title}
                  </Text>
                </View>
              )}
              {!tierProgress?.next && tierProgress?.current && (
                <Text style={[styles.maxTierText, { color: colors.success }]}>
                  🎉 You've reached the highest tier!
                </Text>
              )}
            </View>

            {/* Unclaimed Rewards */}
            <View style={[styles.rewardsCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Rewards</Text>
              <View style={styles.rewardsGrid}>
                <View style={styles.rewardItem}>
                  <Text style={styles.rewardEmoji}>⚡</Text>
                  <Text style={[styles.rewardValue, { color: colors.foreground }]}>
                    {data?.rewards.unclaimedXP || 0}
                  </Text>
                  <Text style={[styles.rewardLabel, { color: colors.muted }]}>XP</Text>
                </View>
                <View style={styles.rewardItem}>
                  <Text style={styles.rewardEmoji}>❄️</Text>
                  <Text style={[styles.rewardValue, { color: colors.foreground }]}>
                    {data?.rewards.unclaimedFreezes || 0}
                  </Text>
                  <Text style={[styles.rewardLabel, { color: colors.muted }]}>Freezes</Text>
                </View>
                <View style={styles.rewardItem}>
                  <Text style={styles.rewardEmoji}>📹</Text>
                  <Text style={[styles.rewardValue, { color: colors.foreground }]}>
                    {data?.rewards.unclaimedVideoMinutes || 0}
                  </Text>
                  <Text style={[styles.rewardLabel, { color: colors.muted }]}>Video Min</Text>
                </View>
                <View style={styles.rewardItem}>
                  <Text style={styles.rewardEmoji}>🌐</Text>
                  <Text style={[styles.rewardValue, { color: colors.foreground }]}>
                    {data?.rewards.unclaimedTranslationCredits || 0}
                  </Text>
                  <Text style={[styles.rewardLabel, { color: colors.muted }]}>Credits</Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={handleClaimAll}
                disabled={!hasUnclaimed || claiming}
                style={[
                  styles.claimButton,
                  { backgroundColor: hasUnclaimed ? colors.success : colors.border },
                ]}
              >
                <Text style={[styles.claimButtonText, { color: hasUnclaimed ? "#fff" : colors.muted }]}>
                  {claiming ? "Claiming..." : hasUnclaimed ? "🎁 Claim All" : "No Rewards to Claim"}
                </Text>
              </TouchableOpacity>

              {/* Lifetime stats */}
              <View style={[styles.lifetimeRow, { borderTopColor: colors.border }]}>
                <Text style={[styles.lifetimeLabel, { color: colors.muted }]}>Lifetime earned:</Text>
                <Text style={[styles.lifetimeValue, { color: colors.foreground }]}>
                  {data?.rewards.totalXPEarned || 0} XP · {data?.rewards.totalFreezes || 0} Freezes · {data?.rewards.totalVideoMinutes || 0} min · {data?.rewards.totalTranslationCredits || 0} credits
                </Text>
              </View>
            </View>

            {/* Reward History Section */}
            <View style={[styles.rewardsCard, { backgroundColor: colors.surface, borderColor: colors.border, marginTop: 16 }]}>
              <TouchableOpacity
                onPress={() => setShowHistory(!showHistory)}
                style={styles.rewardHistoryHeader}
              >
                <Text style={[styles.sectionTitle, { color: colors.foreground, marginBottom: 0 }]}>
                  Reward History ({rewardHistory.length})
                </Text>
                <Text style={{ color: colors.muted, fontSize: 14 }}>
                  {showHistory ? "▲ Hide" : "▼ Show"}
                </Text>
              </TouchableOpacity>
              {showHistory && rewardHistory.length > 0 && (
                <View style={styles.rewardHistoryList}>
                  {rewardHistory.slice(0, 20).map((entry) => (
                    <View key={entry.id} style={[styles.rewardHistoryItem, { borderTopColor: colors.border }]}>
                      <View style={styles.rewardHistoryRow}>
                        <Text style={[styles.rewardHistoryIcon, { color: colors.foreground }]}>
                          {entry.type === "referrer_earned" ? "🎁" : entry.type === "invitee_redeemed" ? "🎉" : "✅"}
                        </Text>
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.rewardHistoryDesc, { color: colors.foreground }]}>
                            {entry.description}
                          </Text>
                          <Text style={[styles.rewardHistoryDate, { color: colors.muted }]}>
                            {new Date(entry.date).toLocaleDateString()}
                          </Text>
                        </View>
                        <View style={styles.rewardHistoryRewards}>
                          {entry.rewards.bonusXP > 0 && (
                            <Text style={[styles.rewardHistoryBadge, { color: colors.primary }]}>+{entry.rewards.bonusXP} XP</Text>
                          )}
                          {entry.rewards.streakFreezes > 0 && (
                            <Text style={[styles.rewardHistoryBadge, { color: colors.success }]}>+{entry.rewards.streakFreezes} ❄️</Text>
                          )}
                        </View>
                      </View>
                    </View>
                  ))}
                </View>
              )}
              {showHistory && rewardHistory.length === 0 && (
                <Text style={[styles.emptyHistoryText, { color: colors.muted }]}>
                  No reward history yet. Earn rewards by sharing your code!
                </Text>
              )}
            </View>

            {/* Referral History Header */}
            <Text style={[styles.sectionTitle, { color: colors.foreground, paddingHorizontal: 20, marginTop: 20 }]}>
              Referral History ({data?.referrals.length || 0})
            </Text>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={[styles.emptyEmoji]}>🤝</Text>
            <Text style={[styles.emptyText, { color: colors.muted }]}>
              No referrals yet. Share your code to start earning rewards!
            </Text>
          </View>
        }
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  listContent: { paddingBottom: 40 },
  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
  backButton: { marginBottom: 8 },
  backText: { fontSize: 16, fontWeight: "500" },
  title: { fontSize: 28, fontWeight: "bold" },
  codeCard: { margin: 20, marginTop: 16, padding: 20, borderRadius: 16, borderWidth: 1, alignItems: "center" },
  codeLabel: { fontSize: 13, marginBottom: 4 },
  codeText: { fontSize: 32, fontWeight: "bold", letterSpacing: 2, marginBottom: 16 },
  codeActions: { flexDirection: "row", gap: 12 },
  codeButton: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10 },
  codeButtonText: { fontSize: 14, fontWeight: "600" },
  tierCard: { marginHorizontal: 20, padding: 20, borderRadius: 16, borderWidth: 1 },
  sectionTitle: { fontSize: 17, fontWeight: "700", marginBottom: 12 },
  tierRow: { flexDirection: "row", justifyContent: "space-between" },
  tierItem: { alignItems: "center", flex: 1 },
  tierBadge: { width: 48, height: 48, borderRadius: 24, alignItems: "center", justifyContent: "center" },
  tierEmoji: { fontSize: 22 },
  tierName: { fontSize: 11, fontWeight: "600", marginTop: 4 },
  tierReq: { fontSize: 10, marginTop: 2 },
  progressSection: { marginTop: 16 },
  progressBar: { height: 8, borderRadius: 4, overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 4 },
  progressText: { fontSize: 12, marginTop: 6, textAlign: "center" },
  maxTierText: { marginTop: 12, fontSize: 14, fontWeight: "600", textAlign: "center" },
  rewardsCard: { margin: 20, padding: 20, borderRadius: 16, borderWidth: 1 },
  rewardsGrid: { flexDirection: "row", justifyContent: "space-between", marginBottom: 16 },
  rewardItem: { alignItems: "center", flex: 1 },
  rewardEmoji: { fontSize: 24, marginBottom: 4 },
  rewardValue: { fontSize: 20, fontWeight: "bold" },
  rewardLabel: { fontSize: 11, marginTop: 2 },
  claimButton: { paddingVertical: 14, borderRadius: 12, alignItems: "center" },
  claimButtonText: { fontSize: 16, fontWeight: "700" },
  lifetimeRow: { marginTop: 16, paddingTop: 12, borderTopWidth: 1 },
  lifetimeLabel: { fontSize: 12, marginBottom: 4 },
  lifetimeValue: { fontSize: 12, fontWeight: "500" },
  historyItem: { marginHorizontal: 20, marginTop: 8, padding: 14, borderRadius: 12, borderWidth: 1, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  historyLeft: {},
  historyName: { fontSize: 15, fontWeight: "600" },
  historyDate: { fontSize: 12, marginTop: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontSize: 12, fontWeight: "600" },
  emptyState: { alignItems: "center", paddingVertical: 40, paddingHorizontal: 20 },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 14, textAlign: "center", lineHeight: 20 },
  rewardHistoryHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  rewardHistoryList: { marginTop: 12 },
  rewardHistoryItem: { paddingTop: 10, marginTop: 10, borderTopWidth: 1 },
  rewardHistoryRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  rewardHistoryIcon: { fontSize: 20, width: 28 },
  rewardHistoryDesc: { fontSize: 13, fontWeight: "500" },
  rewardHistoryDate: { fontSize: 11, marginTop: 2 },
  rewardHistoryRewards: { alignItems: "flex-end" },
  rewardHistoryBadge: { fontSize: 12, fontWeight: "600" },
  emptyHistoryText: { marginTop: 12, fontSize: 13, textAlign: "center" },
});
