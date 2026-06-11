import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Share,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Clipboard,
  Platform,
  Linking,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { ScreenContainer } from "@/components/screen-container";
import { vanillaClient } from "@/lib/trpc";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";

// ─── Colors ──────────────────────────────────────────────────────────────────
const Colors = {
  bg: "#0A0A0F",
  card: "#1A1A2E",
  cardBorder: "#2A2A3E",
  primary: "#6C63FF",
  primaryDark: "#4A42CC",
  gold: "#FFD700",
  goldDark: "#B8860B",
  green: "#22C55E",
  greenDark: "#16A34A",
  text: "#FFFFFF",
  textSecondary: "#9CA3AF",
  textMuted: "#6B7280",
  tier1: "#6C63FF",
  tier2: "#F59E0B",
  surface: "#16162A",
  border: "#2A2A3E",
  success: "#10B981",
  error: "#EF4444",
  bronze: "#CD7F32",
  silver: "#C0C0C0",
  platinum: "#E5E4E2",
};

const BADGE_COLORS: Record<string, string> = {
  Bronze: Colors.bronze,
  Silver: Colors.silver,
  Gold: Colors.gold,
  Platinum: Colors.platinum,
};

type TabKey = "overview" | "referrals" | "payouts" | "leaderboard" | "tools";

export default function AffiliateDashboardScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabKey>("overview");
  const [copied, setCopied] = useState(false);
  const [affiliateEmail, setAffiliateEmail] = useState("");

  // DB-backed data
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [leaderboardData, setLeaderboardData] = useState<any[]>([]);
  const [leaderboardFilter, setLeaderboardFilter] = useState<"all_time" | "this_month" | "this_week">("all_time");
  const [stripeStatus, setStripeStatus] = useState<{ connected: boolean; payoutsEnabled: boolean }>({ connected: false, payoutsEnabled: false });
  const [stripeLoading, setStripeLoading] = useState(false);
  const [payoutProcessing, setPayoutProcessing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    loadLeaderboard();
  }, [leaderboardFilter]);

  const loadData = async () => {
    try {
      // Get stored email for affiliate lookup
      const userInfo = await AsyncStorage.getItem("@user_info");
      const email = userInfo ? JSON.parse(userInfo).email || "" : "";
      setAffiliateEmail(email);

      if (email) {
        const data = await vanillaClient.affiliate.myDashboard.query({ email });
        setDashboardData(data);

        // Check Stripe status if affiliate exists
        if (data.affiliate?.id) {
          try {
            const status = await vanillaClient.affiliate.stripeCheckStatus.query({ affiliateId: data.affiliate.id });
            setStripeStatus(status);
          } catch { /* Stripe not configured */ }
        }
      }
    } catch (error) {
      console.error("Failed to load affiliate data:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadLeaderboard = async () => {
    try {
      const result = await vanillaClient.affiliate.leaderboard.query({ timeFilter: leaderboardFilter, limit: 50 });
      setLeaderboardData(result.leaderboard || []);
    } catch (error) {
      console.error("Failed to load leaderboard:", error);
    }
  };

  const copyReferralLink = useCallback(async () => {
    if (!dashboardData?.affiliate?.referralLink) return;
    const link = dashboardData.affiliate.referralLink;
    if (Platform.OS === "web") {
      await navigator.clipboard.writeText(link);
    } else {
      Clipboard.setString(link);
    }
    setCopied(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setTimeout(() => setCopied(false), 2000);
  }, [dashboardData]);

  const shareReferralLink = useCallback(async () => {
    if (!dashboardData?.affiliate?.referralLink) return;
    const link = dashboardData.affiliate.referralLink;
    try {
      await Share.share({
        message: `Learn any language through music with ConnectWorld AI! Use my link to get started: ${link}`,
        url: link,
      });
    } catch { /* User cancelled */ }
  }, [dashboardData]);

  // ─── Stripe Connect Onboarding ─────────────────────────────────────────────
  const startStripeOnboarding = async () => {
    if (!dashboardData?.affiliate?.id) return;
    setStripeLoading(true);
    try {
      const result = await vanillaClient.affiliate.stripeCreateOnboardingLink.mutate({
        affiliateId: dashboardData.affiliate.id,
      });
      if (result.success && result.url) {
        await Linking.openURL(result.url);
      } else {
        Alert.alert("Error", result.error || "Failed to create onboarding link. Stripe may not be configured yet.");
      }
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to connect Stripe");
    } finally {
      setStripeLoading(false);
    }
  };

  // ─── Request Payout via Stripe ─────────────────────────────────────────────
  const requestStripePayout = async () => {
    if (!dashboardData?.affiliate?.id) return;
    const pendingCommissions = (dashboardData.commissions || []).filter(
      (c: any) => c.status === "approved" || c.status === "pending"
    );
    if (pendingCommissions.length === 0) {
      Alert.alert("No Pending Commissions", "You don't have any approved commissions to pay out yet.");
      return;
    }
    const totalAmount = pendingCommissions.reduce((s: number, c: any) => s + c.amount, 0);
    Alert.alert(
      "Request Payout",
      `You have $${(totalAmount / 100).toFixed(2)} in pending commissions (${pendingCommissions.length} items).\n\nThis will be transferred to your Stripe Connect account.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Confirm Payout",
          onPress: async () => {
            setPayoutProcessing(true);
            try {
              const result = await vanillaClient.affiliate.stripeInitiatePayout.mutate({
                affiliateId: dashboardData.affiliate.id,
                commissionIds: pendingCommissions.map((c: any) => c.id),
              });
              if (result.success) {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                Alert.alert("Payout Sent!", `$${(result.amount! / 100).toFixed(2)} transferred to your Stripe account.\nTransfer ID: ${result.transferId}`);
                loadData(); // Refresh
              } else {
                Alert.alert("Payout Failed", result.error || "Unknown error");
              }
            } catch (err: any) {
              Alert.alert("Error", err.message || "Payout failed");
            } finally {
              setPayoutProcessing(false);
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <ScreenContainer className="bg-background">
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading your affiliate dashboard...</Text>
        </View>
      </ScreenContainer>
    );
  }

  const affiliate = dashboardData?.affiliate;
  const stats = dashboardData?.stats || { totalReferrals: 0, paidConversions: 0, totalEarnings: 0, pendingPayout: 0 };
  const referrals = dashboardData?.referrals || [];
  const commissions = dashboardData?.commissions || [];
  const referralCode = affiliate?.referralCode || "N/A";
  const referralLink = affiliate?.referralLink || "";

  // ─── OVERVIEW TAB ──────────────────────────────────────────────────────────
  const renderOverview = () => (
    <View style={styles.tabContent}>
      <View style={styles.earningsGrid}>
        <View style={[styles.earningsCard, { borderColor: Colors.green }]}>
          <Text style={styles.earningsLabel}>Total Earnings</Text>
          <Text style={[styles.earningsAmount, { color: Colors.green }]}>
            ${(stats.totalEarnings / 100).toFixed(2)}
          </Text>
          <Text style={styles.earningsSubtext}>all time</Text>
        </View>
        <View style={[styles.earningsCard, { borderColor: Colors.gold }]}>
          <Text style={styles.earningsLabel}>Pending Payout</Text>
          <Text style={[styles.earningsAmount, { color: Colors.gold }]}>
            ${(stats.pendingPayout / 100).toFixed(2)}
          </Text>
          <Text style={styles.earningsSubtext}>awaiting transfer</Text>
        </View>
      </View>

      <View style={styles.earningsGrid}>
        <View style={[styles.earningsCard, { borderColor: Colors.tier1 }]}>
          <Text style={styles.earningsLabel}>Total Referrals</Text>
          <Text style={[styles.earningsAmount, { color: Colors.tier1 }]}>
            {stats.totalReferrals}
          </Text>
          <Text style={styles.earningsSubtext}>signups</Text>
        </View>
        <View style={[styles.earningsCard, { borderColor: Colors.tier2 }]}>
          <Text style={styles.earningsLabel}>Paid Conversions</Text>
          <Text style={[styles.earningsAmount, { color: Colors.tier2 }]}>
            {stats.paidConversions}
          </Text>
          <Text style={styles.earningsSubtext}>subscribers</Text>
        </View>
      </View>

      {/* Tier Explainer */}
      <View style={styles.howItWorksCard}>
        <Text style={styles.sectionTitle}>How Your 2-Tier Program Works</Text>
        <View style={styles.tierExplainer}>
          <View style={styles.tierRow}>
            <View style={[styles.tierBadge, { backgroundColor: Colors.tier1 }]}>
              <Text style={styles.tierBadgeText}>T1</Text>
            </View>
            <View style={styles.tierInfo}>
              <Text style={styles.tierTitle}>Tier 1 — 20% Commission</Text>
              <Text style={styles.tierDesc}>
                Someone uses your link → they subscribe → you earn 20% of their monthly payment for 12 months
              </Text>
            </View>
          </View>
          <View style={styles.tierConnector}>
            <Ionicons name="arrow-down" size={20} color={Colors.textMuted} />
          </View>
          <View style={styles.tierRow}>
            <View style={[styles.tierBadge, { backgroundColor: Colors.tier2 }]}>
              <Text style={styles.tierBadgeText}>T2</Text>
            </View>
            <View style={styles.tierInfo}>
              <Text style={styles.tierTitle}>Tier 2 — 5% Commission</Text>
              <Text style={styles.tierDesc}>
                Your referral refers someone else → that person subscribes → you ALSO earn 5% for 12 months
              </Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );

  // ─── REFERRALS TAB ─────────────────────────────────────────────────────────
  const renderReferrals = () => (
    <View style={styles.tabContent}>
      <Text style={styles.sectionTitle}>Your Referrals ({referrals.length})</Text>

      {referrals.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="people-outline" size={48} color={Colors.textMuted} />
          <Text style={styles.emptyTitle}>No Referrals Yet</Text>
          <Text style={styles.emptyDesc}>
            Share your referral link to start earning! When someone signs up using your link and subscribes, you'll earn 20% of their payment every month.
          </Text>
          <TouchableOpacity style={styles.shareButton} onPress={shareReferralLink}>
            <Ionicons name="share-outline" size={20} color="#FFF" />
            <Text style={styles.shareButtonText}>Share Your Link</Text>
          </TouchableOpacity>
        </View>
      ) : (
        referrals.map((ref: any, idx: number) => (
          <View key={idx} style={styles.referralItem}>
            <View style={[styles.referralAvatar, { backgroundColor: ref.tier === "tier1" ? Colors.tier1 : Colors.tier2 }]}>
              <Text style={styles.referralAvatarText}>
                {ref.tier === "tier1" ? "T1" : "T2"}
              </Text>
            </View>
            <View style={styles.referralInfo}>
              <Text style={styles.referralName}>User #{ref.referredUserId}</Text>
              <Text style={styles.referralPlan}>
                {ref.convertedToPaid ? `${ref.subscriptionPlan || "Paid"} subscriber` : "Free user"}
              </Text>
              <Text style={styles.referralDate}>
                {new Date(ref.createdAt).toLocaleDateString()}
              </Text>
            </View>
            <View style={styles.referralEarning}>
              {ref.convertedToPaid ? (
                <Text style={[styles.referralAmount, { color: Colors.green }]}>
                  ${(ref.revenueGenerated / 100).toFixed(2)}
                </Text>
              ) : (
                <Text style={[styles.referralAmount, { color: Colors.textMuted }]}>Pending</Text>
              )}
              <View style={[styles.statusDot, { backgroundColor: ref.convertedToPaid ? Colors.green : Colors.gold }]} />
            </View>
          </View>
        ))
      )}
    </View>
  );

  // ─── PAYOUTS TAB (Stripe Connect) ──────────────────────────────────────────
  const renderPayouts = () => {
    const pendingCommissions = commissions.filter((c: any) => c.status === "pending" || c.status === "approved");
    const paidCommissions = commissions.filter((c: any) => c.status === "paid");
    const pendingTotal = pendingCommissions.reduce((s: number, c: any) => s + c.amount, 0);
    const paidTotal = paidCommissions.reduce((s: number, c: any) => s + c.amount, 0);

    return (
      <View style={styles.tabContent}>
        {/* Stripe Connect Status */}
        <View style={styles.stripeCard}>
          <View style={styles.stripeHeader}>
            <Ionicons name="card-outline" size={24} color={stripeStatus.payoutsEnabled ? Colors.green : Colors.gold} />
            <Text style={styles.stripeTitle}>Stripe Connect</Text>
          </View>
          {stripeStatus.payoutsEnabled ? (
            <View>
              <View style={styles.stripeConnectedBadge}>
                <Ionicons name="checkmark-circle" size={16} color={Colors.green} />
                <Text style={styles.stripeConnectedText}>Connected — Payouts Enabled</Text>
              </View>
              <Text style={styles.stripeDesc}>
                Your Stripe account is set up. Commissions will be transferred directly to your bank.
              </Text>
            </View>
          ) : stripeStatus.connected ? (
            <View>
              <View style={[styles.stripeConnectedBadge, { backgroundColor: "rgba(245,158,11,0.15)" }]}>
                <Ionicons name="time-outline" size={16} color={Colors.gold} />
                <Text style={[styles.stripeConnectedText, { color: Colors.gold }]}>Onboarding Incomplete</Text>
              </View>
              <Text style={styles.stripeDesc}>
                Your Stripe account is created but onboarding isn't finished. Complete it to receive payouts.
              </Text>
              <TouchableOpacity style={styles.stripeButton} onPress={startStripeOnboarding} disabled={stripeLoading}>
                {stripeLoading ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <>
                    <Ionicons name="open-outline" size={18} color="#FFF" />
                    <Text style={styles.stripeButtonText}>Complete Onboarding</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          ) : (
            <View>
              <Text style={styles.stripeDesc}>
                Connect your Stripe account to receive commission payouts directly to your bank account.
              </Text>
              <TouchableOpacity style={styles.stripeButton} onPress={startStripeOnboarding} disabled={stripeLoading}>
                {stripeLoading ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <>
                    <Ionicons name="link-outline" size={18} color="#FFF" />
                    <Text style={styles.stripeButtonText}>Connect Stripe Account</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Pending Earnings */}
        <View style={styles.pendingCard}>
          <View style={styles.pendingHeader}>
            <Text style={styles.pendingLabel}>Pending Commissions</Text>
            <Text style={[styles.pendingAmount, { color: Colors.green }]}>
              ${(pendingTotal / 100).toFixed(2)}
            </Text>
          </View>
          <Text style={styles.pendingNote}>
            {pendingCommissions.length} commission{pendingCommissions.length !== 1 ? "s" : ""} awaiting payout
          </Text>
          <TouchableOpacity
            style={[styles.payoutButton, (!stripeStatus.payoutsEnabled || pendingCommissions.length === 0) && styles.payoutButtonDisabled]}
            onPress={requestStripePayout}
            disabled={!stripeStatus.payoutsEnabled || pendingCommissions.length === 0 || payoutProcessing}
          >
            {payoutProcessing ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <>
                <Ionicons name="wallet-outline" size={20} color="#FFF" />
                <Text style={styles.payoutButtonText}>
                  {!stripeStatus.payoutsEnabled
                    ? "Connect Stripe First"
                    : pendingCommissions.length === 0
                    ? "No Pending Commissions"
                    : `Request Payout ($${(pendingTotal / 100).toFixed(2)})`}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Commission History */}
        <Text style={styles.sectionTitle}>Commission History</Text>
        {commissions.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="receipt-outline" size={40} color={Colors.textMuted} />
            <Text style={styles.emptyTitle}>No Commissions Yet</Text>
            <Text style={styles.emptyDesc}>
              When your referrals convert to paid subscribers, commissions will appear here.
            </Text>
          </View>
        ) : (
          commissions.map((comm: any, idx: number) => (
            <View key={idx} style={styles.commissionItem}>
              <View style={styles.commissionLeft}>
                <Text style={styles.commissionType}>
                  {comm.type === "tier1_commission" ? "Tier 1" : comm.type === "tier2_commission" ? "Tier 2" : comm.type}
                </Text>
                <Text style={styles.commissionDesc} numberOfLines={1}>{comm.description}</Text>
                <Text style={styles.commissionDate}>{new Date(comm.createdAt).toLocaleDateString()}</Text>
              </View>
              <View style={styles.commissionRight}>
                <Text style={[styles.commissionAmount, { color: comm.status === "paid" ? Colors.green : Colors.gold }]}>
                  ${(comm.amount / 100).toFixed(2)}
                </Text>
                <View style={[styles.commissionStatusBadge, {
                  backgroundColor: comm.status === "paid" ? "rgba(34,197,94,0.15)" :
                    comm.status === "approved" ? "rgba(245,158,11,0.15)" : "rgba(107,114,128,0.15)"
                }]}>
                  <Text style={[styles.commissionStatusText, {
                    color: comm.status === "paid" ? Colors.green :
                      comm.status === "approved" ? Colors.gold : Colors.textMuted
                  }]}>
                    {comm.status}
                  </Text>
                </View>
                {comm.payoutReference && (
                  <Text style={styles.commissionRef}>Ref: {comm.payoutReference.slice(0, 12)}...</Text>
                )}
              </View>
            </View>
          ))
        )}

        {/* Paid Total */}
        {paidTotal > 0 && (
          <View style={styles.paidTotalCard}>
            <Text style={styles.paidTotalLabel}>Total Paid Out</Text>
            <Text style={styles.paidTotalAmount}>${(paidTotal / 100).toFixed(2)}</Text>
          </View>
        )}
      </View>
    );
  };

  // ─── LEADERBOARD TAB ───────────────────────────────────────────────────────
  const renderLeaderboard = () => (
    <View style={styles.tabContent}>
      <Text style={styles.sectionTitle}>Affiliate Leaderboard</Text>

      {/* Time Filters */}
      <View style={styles.filterRow}>
        {(["all_time", "this_month", "this_week"] as const).map((filter) => (
          <TouchableOpacity
            key={filter}
            style={[styles.filterChip, leaderboardFilter === filter && styles.filterChipActive]}
            onPress={() => {
              setLeaderboardFilter(filter);
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
          >
            <Text style={[styles.filterChipText, leaderboardFilter === filter && styles.filterChipTextActive]}>
              {filter === "all_time" ? "All Time" : filter === "this_month" ? "This Month" : "This Week"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Leaderboard List */}
      {leaderboardData.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="trophy-outline" size={48} color={Colors.textMuted} />
          <Text style={styles.emptyTitle}>No Rankings Yet</Text>
          <Text style={styles.emptyDesc}>
            Be the first to climb the leaderboard by referring users!
          </Text>
        </View>
      ) : (
        leaderboardData.map((item: any, idx: number) => {
          const isMe = affiliate?.id === item.affiliateId;
          const badgeColor = BADGE_COLORS[item.badge] || Colors.bronze;
          return (
            <View key={idx} style={[styles.leaderboardItem, isMe && styles.leaderboardItemMe]}>
              {/* Rank */}
              <View style={[styles.rankBadge, item.rank <= 3 && { backgroundColor: item.rank === 1 ? Colors.gold : item.rank === 2 ? Colors.silver : Colors.bronze }]}>
                <Text style={[styles.rankText, item.rank <= 3 && { color: "#000" }]}>
                  {item.rank <= 3 ? ["🥇", "🥈", "🥉"][item.rank - 1] : `#${item.rank}`}
                </Text>
              </View>

              {/* Info */}
              <View style={styles.leaderboardInfo}>
                <View style={styles.leaderboardNameRow}>
                  <Text style={styles.leaderboardName}>
                    {isMe ? `${item.name} (You)` : item.name}
                  </Text>
                  <View style={[styles.badgePill, { backgroundColor: badgeColor + "30" }]}>
                    <Text style={[styles.badgePillText, { color: badgeColor }]}>{item.badge}</Text>
                  </View>
                </View>
                <Text style={styles.leaderboardStats}>
                  {item.totalReferrals} referrals · {item.totalConversions} conversions · {item.conversionRate}% rate
                </Text>
              </View>

              {/* Earnings */}
              <View style={styles.leaderboardEarnings}>
                <Text style={styles.leaderboardEarningsAmount}>
                  ${(item.totalEarnings / 100).toFixed(0)}
                </Text>
                <Text style={styles.leaderboardEarningsLabel}>earned</Text>
              </View>
            </View>
          );
        })
      )}

      {/* Share Your Rank */}
      <TouchableOpacity
        style={styles.shareRankButton}
        onPress={async () => {
          if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          const myRank = leaderboardData.find((item: any) => item.affiliateId === affiliate?.id);
          const rankText = myRank ? `#${myRank.rank}` : "New";
          const badgeText = myRank?.badge || "Bronze";
          const earnings = myRank ? `$${(myRank.totalEarnings / 100).toFixed(0)}` : "$0";
          const referrals = myRank?.totalReferrals || 0;
          const shareMessage = `🏆 I'm ranked ${rankText} on the ConnectWorld AI Affiliate Leaderboard!\n\n` +
            `💎 Badge: ${badgeText}\n` +
            `👥 ${referrals} referrals\n` +
            `💰 ${earnings} earned\n\n` +
            `Want to earn money teaching languages? Join the affiliate program:\n` +
            `https://connectworldai.com/affiliate-signup\n\n` +
            `#ConnectWorldAI #AffiliateProgram #LanguageLearning`;
          try {
            await Share.share({
              message: shareMessage,
              title: "My ConnectWorld AI Affiliate Rank",
            });
          } catch (e) {}
        }}
      >
        <View style={styles.shareRankContent}>
          <Ionicons name="share-social" size={20} color="#FFF" />
          <Text style={styles.shareRankText}>Share Your Rank</Text>
        </View>
        <Text style={styles.shareRankSubtext}>Show off your position on social media</Text>
      </TouchableOpacity>

      {/* Badge Legend */}
      <View style={styles.badgeLegend}>
        <Text style={styles.badgeLegendTitle}>Badge Tiers</Text>
        <View style={styles.badgeLegendRow}>
          {[
            { name: "Bronze", req: "0-19 referrals", color: Colors.bronze },
            { name: "Silver", req: "20-49 referrals", color: Colors.silver },
            { name: "Gold", req: "50-99 referrals", color: Colors.gold },
            { name: "Platinum", req: "100+ referrals", color: Colors.platinum },
          ].map((badge) => (
            <View key={badge.name} style={styles.badgeLegendItem}>
              <View style={[styles.badgeLegendDot, { backgroundColor: badge.color }]} />
              <Text style={styles.badgeLegendName}>{badge.name}</Text>
              <Text style={styles.badgeLegendReq}>{badge.req}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );

  // ─── TOOLS TAB ─────────────────────────────────────────────────────────────
  const renderTools = () => (
    <View style={styles.tabContent}>
      <Text style={styles.sectionTitle}>Sharing Tools</Text>

      {/* Referral Link */}
      <View style={styles.linkCard}>
        <Text style={styles.linkLabel}>Your Referral Link</Text>
        <View style={styles.linkRow}>
          <Text style={styles.linkText} numberOfLines={1}>{referralLink || "Pending approval"}</Text>
          <TouchableOpacity
            style={[styles.copyButton, copied && styles.copyButtonSuccess]}
            onPress={copyReferralLink}
          >
            <Ionicons name={copied ? "checkmark" : "copy-outline"} size={18} color="#FFF" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Referral Code */}
      <View style={styles.linkCard}>
        <Text style={styles.linkLabel}>Your Referral Code</Text>
        <View style={styles.codeDisplay}>
          <Text style={styles.codeText}>{referralCode}</Text>
        </View>
        <Text style={styles.codeHint}>Users can enter this code during signup</Text>
      </View>

      {/* Share Buttons */}
      <View style={styles.shareSection}>
        <Text style={styles.shareSectionTitle}>Quick Share</Text>
        <View style={styles.shareGrid}>
          <TouchableOpacity style={[styles.shareCard, { backgroundColor: "#E1306C" }]} onPress={shareReferralLink}>
            <Ionicons name="logo-instagram" size={28} color="#FFF" />
            <Text style={styles.shareCardText}>Instagram</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.shareCard, { backgroundColor: "#000" }]} onPress={shareReferralLink}>
            <Ionicons name="logo-tiktok" size={28} color="#FFF" />
            <Text style={styles.shareCardText}>TikTok</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.shareCard, { backgroundColor: "#FF0000" }]} onPress={shareReferralLink}>
            <Ionicons name="logo-youtube" size={28} color="#FFF" />
            <Text style={styles.shareCardText}>YouTube</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.shareCard, { backgroundColor: "#25D366" }]} onPress={shareReferralLink}>
            <Ionicons name="logo-whatsapp" size={28} color="#FFF" />
            <Text style={styles.shareCardText}>WhatsApp</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Pre-written Captions */}
      <View style={styles.captionsCard}>
        <Text style={styles.captionsTitle}>Pre-Written Captions</Text>
        <Text style={styles.captionsSubtitle}>Copy and paste these for your posts:</Text>
        {[
          "I've been learning Spanish through music and it actually works. This app breaks down songs into vocabulary, grammar, and pronunciation lessons. Try it: ",
          "Imagine learning a language by translating your favorite songs. That's what I'm doing with ConnectWorld AI. Link in bio ",
          "POV: You're finally understanding Bad Bunny lyrics AND learning Spanish at the same time. This app is different. ",
        ].map((caption, idx) => (
          <TouchableOpacity
            key={idx}
            style={styles.captionItem}
            onPress={() => {
              const fullCaption = caption + referralLink;
              if (Platform.OS === "web") {
                navigator.clipboard.writeText(fullCaption);
              } else {
                Clipboard.setString(fullCaption);
              }
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              Alert.alert("Copied!", "Caption copied to clipboard");
            }}
          >
            <Text style={styles.captionText}>{caption}</Text>
            <Ionicons name="copy-outline" size={16} color={Colors.textMuted} />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  return (
    <ScreenContainer className="bg-background">
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={Colors.text} />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Affiliate Program</Text>
            <View style={styles.poweredBy}>
              <Text style={styles.poweredByText}>Powered by Stripe Connect</Text>
            </View>
          </View>
          <TouchableOpacity onPress={requestStripePayout} style={styles.payoutHeaderButton}>
            <Ionicons name="wallet-outline" size={22} color={Colors.green} />
          </TouchableOpacity>
        </View>

        {/* Quick Stats Banner */}
        <View style={styles.statsBanner}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.totalReferrals}</Text>
            <Text style={styles.statLabel}>Referrals</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: Colors.green }]}>${(stats.totalEarnings / 100).toFixed(2)}</Text>
            <Text style={styles.statLabel}>Earned</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: Colors.gold }]}>{stats.paidConversions}</Text>
            <Text style={styles.statLabel}>Conversions</Text>
          </View>
        </View>

        {/* Tab Navigation */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabBarScroll}>
          <View style={styles.tabBar}>
            {(["overview", "referrals", "payouts", "leaderboard", "tools"] as const).map((tab) => (
              <TouchableOpacity
                key={tab}
                style={[styles.tab, activeTab === tab && styles.tabActive]}
                onPress={() => {
                  setActiveTab(tab);
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
              >
                <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                  {tab === "leaderboard" ? "Rankings" : tab.charAt(0).toUpperCase() + tab.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        {/* Tab Content */}
        {activeTab === "overview" && renderOverview()}
        {activeTab === "referrals" && renderReferrals()}
        {activeTab === "payouts" && renderPayouts()}
        {activeTab === "leaderboard" && renderLeaderboard()}
        {activeTab === "tools" && renderTools()}

        <View style={{ height: 100 }} />
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center", gap: 16 },
  loadingText: { color: Colors.textSecondary, fontSize: 14 },

  // Header
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingVertical: 16 },
  backButton: { width: 40, height: 40, justifyContent: "center", alignItems: "center" },
  headerCenter: { flex: 1, alignItems: "center" },
  headerTitle: { fontSize: 18, fontWeight: "700", color: Colors.text },
  poweredBy: { marginTop: 2 },
  poweredByText: { fontSize: 11, color: Colors.textMuted },
  payoutHeaderButton: { width: 40, height: 40, justifyContent: "center", alignItems: "center" },

  // Stats Banner
  statsBanner: {
    flexDirection: "row",
    backgroundColor: Colors.card,
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  statItem: { flex: 1, alignItems: "center" },
  statValue: { fontSize: 22, fontWeight: "700", color: Colors.text },
  statLabel: { fontSize: 11, color: Colors.textMuted, marginTop: 4 },
  statDivider: { width: 1, backgroundColor: Colors.border, marginVertical: 4 },

  // Tab Bar
  tabBarScroll: { marginTop: 20, marginHorizontal: 20 },
  tabBar: {
    flexDirection: "row",
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 4,
  },
  tab: { paddingVertical: 10, paddingHorizontal: 16, alignItems: "center", borderRadius: 8 },
  tabActive: { backgroundColor: Colors.primary },
  tabText: { fontSize: 12, fontWeight: "600", color: Colors.textMuted },
  tabTextActive: { color: "#FFF" },

  // Tab Content
  tabContent: { padding: 20 },

  // Earnings Grid
  earningsGrid: { flexDirection: "row", gap: 12, marginBottom: 12 },
  earningsCard: { flex: 1, backgroundColor: Colors.card, borderRadius: 12, padding: 16, borderWidth: 1 },
  earningsLabel: { fontSize: 12, color: Colors.textMuted, marginBottom: 4 },
  earningsAmount: { fontSize: 20, fontWeight: "700" },
  earningsSubtext: { fontSize: 11, color: Colors.textMuted, marginTop: 2 },

  // How It Works
  howItWorksCard: { backgroundColor: Colors.card, borderRadius: 16, padding: 20, marginTop: 8, borderWidth: 1, borderColor: Colors.cardBorder },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: Colors.text, marginBottom: 16 },
  tierExplainer: { marginBottom: 8 },
  tierRow: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  tierBadge: { width: 36, height: 36, borderRadius: 18, justifyContent: "center", alignItems: "center" },
  tierBadgeText: { fontSize: 12, fontWeight: "700", color: "#FFF" },
  tierInfo: { flex: 1 },
  tierTitle: { fontSize: 14, fontWeight: "600", color: Colors.text },
  tierDesc: { fontSize: 12, color: Colors.textSecondary, marginTop: 4, lineHeight: 18 },
  tierConnector: { alignItems: "center", paddingVertical: 8, paddingLeft: 8 },

  // Referrals
  referralItem: {
    flexDirection: "row", alignItems: "center", backgroundColor: Colors.card,
    borderRadius: 12, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: Colors.cardBorder,
  },
  referralAvatar: { width: 40, height: 40, borderRadius: 20, justifyContent: "center", alignItems: "center" },
  referralAvatarText: { fontSize: 12, fontWeight: "700", color: "#FFF" },
  referralInfo: { flex: 1, marginLeft: 12 },
  referralName: { fontSize: 14, fontWeight: "600", color: Colors.text },
  referralPlan: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  referralDate: { fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  referralEarning: { alignItems: "flex-end", gap: 4 },
  referralAmount: { fontSize: 14, fontWeight: "700" },
  statusDot: { width: 8, height: 8, borderRadius: 4 },

  // Empty State
  emptyState: { alignItems: "center", paddingVertical: 40, gap: 12 },
  emptyTitle: { fontSize: 16, fontWeight: "600", color: Colors.text },
  emptyDesc: { fontSize: 13, color: Colors.textSecondary, textAlign: "center", lineHeight: 20, paddingHorizontal: 20 },
  shareButton: { flexDirection: "row", alignItems: "center", backgroundColor: Colors.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 24, gap: 8, marginTop: 8 },
  shareButtonText: { color: "#FFF", fontWeight: "600", fontSize: 14 },

  // Stripe Connect
  stripeCard: { backgroundColor: Colors.card, borderRadius: 16, padding: 20, borderWidth: 1, borderColor: Colors.cardBorder, marginBottom: 16 },
  stripeHeader: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 12 },
  stripeTitle: { fontSize: 16, fontWeight: "700", color: Colors.text },
  stripeConnectedBadge: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "rgba(34,197,94,0.15)", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, alignSelf: "flex-start", marginBottom: 8 },
  stripeConnectedText: { fontSize: 12, fontWeight: "600", color: Colors.green },
  stripeDesc: { fontSize: 13, color: Colors.textSecondary, lineHeight: 20 },
  stripeButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", backgroundColor: Colors.primary, paddingVertical: 14, borderRadius: 12, gap: 8, marginTop: 16 },
  stripeButtonText: { color: "#FFF", fontWeight: "600", fontSize: 14 },

  // Payouts
  pendingCard: { backgroundColor: Colors.card, borderRadius: 16, padding: 20, borderWidth: 1, borderColor: Colors.cardBorder, marginBottom: 16 },
  pendingHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  pendingLabel: { fontSize: 14, color: Colors.textSecondary },
  pendingAmount: { fontSize: 24, fontWeight: "700" },
  pendingNote: { fontSize: 12, color: Colors.textMuted, marginTop: 8 },
  payoutButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", backgroundColor: Colors.green, paddingVertical: 14, borderRadius: 12, gap: 8, marginTop: 16 },
  payoutButtonDisabled: { backgroundColor: Colors.textMuted, opacity: 0.6 },
  payoutButtonText: { color: "#FFF", fontWeight: "600", fontSize: 14 },

  // Commission History
  commissionItem: {
    flexDirection: "row", justifyContent: "space-between", backgroundColor: Colors.card,
    borderRadius: 12, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: Colors.cardBorder,
  },
  commissionLeft: { flex: 1 },
  commissionType: { fontSize: 13, fontWeight: "600", color: Colors.text },
  commissionDesc: { fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  commissionDate: { fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  commissionRight: { alignItems: "flex-end", gap: 4 },
  commissionAmount: { fontSize: 16, fontWeight: "700" },
  commissionStatusBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  commissionStatusText: { fontSize: 10, fontWeight: "600", textTransform: "capitalize" },
  commissionRef: { fontSize: 9, color: Colors.textMuted },

  paidTotalCard: { backgroundColor: Colors.surface, borderRadius: 12, padding: 16, alignItems: "center", marginTop: 16 },
  paidTotalLabel: { fontSize: 12, color: Colors.textMuted },
  paidTotalAmount: { fontSize: 24, fontWeight: "700", color: Colors.green, marginTop: 4 },

  // Leaderboard
  filterRow: { flexDirection: "row", gap: 8, marginBottom: 16 },
  filterChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border },
  filterChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  filterChipText: { fontSize: 12, fontWeight: "600", color: Colors.textMuted },
  filterChipTextActive: { color: "#FFF" },

  leaderboardItem: {
    flexDirection: "row", alignItems: "center", backgroundColor: Colors.card,
    borderRadius: 12, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: Colors.cardBorder,
  },
  leaderboardItemMe: { borderColor: Colors.primary, borderWidth: 2 },
  rankBadge: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.surface, justifyContent: "center", alignItems: "center" },
  rankText: { fontSize: 14, fontWeight: "700", color: Colors.text },
  leaderboardInfo: { flex: 1, marginLeft: 12 },
  leaderboardNameRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  leaderboardName: { fontSize: 14, fontWeight: "600", color: Colors.text },
  badgePill: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  badgePillText: { fontSize: 10, fontWeight: "700" },
  leaderboardStats: { fontSize: 11, color: Colors.textMuted, marginTop: 4 },
  leaderboardEarnings: { alignItems: "flex-end" },
  leaderboardEarningsAmount: { fontSize: 16, fontWeight: "700", color: Colors.green },
  leaderboardEarningsLabel: { fontSize: 10, color: Colors.textMuted },

  badgeLegend: { backgroundColor: Colors.card, borderRadius: 16, padding: 20, marginTop: 16, borderWidth: 1, borderColor: Colors.cardBorder },
  badgeLegendTitle: { fontSize: 14, fontWeight: "600", color: Colors.text, marginBottom: 12 },
  badgeLegendRow: { gap: 8 },
  badgeLegendItem: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 4 },
  badgeLegendDot: { width: 12, height: 12, borderRadius: 6 },
  badgeLegendName: { fontSize: 13, fontWeight: "600", color: Colors.text, width: 70 },
  badgeLegendReq: { fontSize: 12, color: Colors.textMuted },

  // Tools
  linkCard: { backgroundColor: Colors.card, borderRadius: 16, padding: 20, borderWidth: 1, borderColor: Colors.cardBorder, marginBottom: 16 },
  linkLabel: { fontSize: 12, color: Colors.textMuted, marginBottom: 8 },
  linkRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  linkText: { flex: 1, fontSize: 13, color: Colors.primary, fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace" },
  copyButton: { backgroundColor: Colors.primary, width: 36, height: 36, borderRadius: 8, justifyContent: "center", alignItems: "center" },
  copyButtonSuccess: { backgroundColor: Colors.green },

  codeDisplay: { backgroundColor: Colors.surface, borderRadius: 12, padding: 16, alignItems: "center" },
  codeText: { fontSize: 24, fontWeight: "700", color: Colors.gold, letterSpacing: 4 },
  codeHint: { fontSize: 11, color: Colors.textMuted, marginTop: 8, textAlign: "center" },

  shareSection: { marginTop: 8, marginBottom: 16 },
  shareSectionTitle: { fontSize: 14, fontWeight: "600", color: Colors.text, marginBottom: 12 },
  shareGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  shareCard: { width: "47%" as any, borderRadius: 12, padding: 16, alignItems: "center", gap: 8 },
  shareCardText: { fontSize: 12, fontWeight: "600", color: "#FFF" },

  captionsCard: { backgroundColor: Colors.card, borderRadius: 16, padding: 20, borderWidth: 1, borderColor: Colors.cardBorder, marginBottom: 16 },
  captionsTitle: { fontSize: 14, fontWeight: "600", color: Colors.text },
  captionsSubtitle: { fontSize: 12, color: Colors.textMuted, marginTop: 4, marginBottom: 16 },
  captionItem: { flexDirection: "row", alignItems: "flex-start", backgroundColor: Colors.surface, borderRadius: 10, padding: 14, marginBottom: 10, gap: 8 },
  captionText: { flex: 1, fontSize: 13, color: Colors.textSecondary, lineHeight: 20 },

  // Share Rank Button
  shareRankButton: { backgroundColor: Colors.primary, borderRadius: 16, padding: 18, marginTop: 20, marginBottom: 16, alignItems: "center" },
  shareRankContent: { flexDirection: "row", alignItems: "center", gap: 10 },
  shareRankText: { fontSize: 16, fontWeight: "700", color: "#FFF" },
  shareRankSubtext: { fontSize: 12, color: "rgba(255,255,255,0.7)", marginTop: 4 },
});
