import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Colors, Spacing, BorderRadius, FontSize } from "../constants/Colors";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// ─── TYPES ───────────────────────────────────────────────────────────────────
type DashboardTab = "overview" | "referrals" | "earnings" | "content" | "tools";

interface CreatorStats {
  totalReferrals: number;
  activeSubscribers: number;
  totalEarnings: number;
  pendingPayout: number;
  conversionRate: number;
  monthlyGrowth: number;
  tier: "bronze" | "silver" | "gold" | "platinum";
  nextTierAt: number;
}

interface Referral {
  id: string;
  date: string;
  plan: string;
  region: string;
  status: "active" | "churned" | "trial";
  monthlyValue: number;
  commissionEarned: number;
}

interface EarningEntry {
  id: string;
  month: string;
  referralEarnings: number;
  contentBonus: number;
  total: number;
  status: "paid" | "pending" | "processing";
}

// ─── SAMPLE DATA ─────────────────────────────────────────────────────────────
const SAMPLE_STATS: CreatorStats = {
  totalReferrals: 847,
  activeSubscribers: 623,
  totalEarnings: 4892.50,
  pendingPayout: 1247.30,
  conversionRate: 3.8,
  monthlyGrowth: 12.4,
  tier: "gold",
  nextTierAt: 1000,
};

const SAMPLE_REFERRALS: Referral[] = [
  { id: "r1", date: "2026-05-27", plan: "Plus", region: "DR", status: "active", monthlyValue: 2.99, commissionEarned: 0.75 },
  { id: "r2", date: "2026-05-26", plan: "Pro", region: "DR", status: "active", monthlyValue: 4.99, commissionEarned: 1.25 },
  { id: "r3", date: "2026-05-26", plan: "Plus", region: "Jamaica", status: "trial", monthlyValue: 2.99, commissionEarned: 0.00 },
  { id: "r4", date: "2026-05-25", plan: "Pro", region: "US", status: "active", monthlyValue: 27.99, commissionEarned: 7.00 },
  { id: "r5", date: "2026-05-25", plan: "Plus", region: "DR", status: "active", monthlyValue: 2.99, commissionEarned: 0.75 },
  { id: "r6", date: "2026-05-24", plan: "Family", region: "DR", status: "active", monthlyValue: 7.99, commissionEarned: 2.00 },
  { id: "r7", date: "2026-05-24", plan: "Plus", region: "Colombia", status: "churned", monthlyValue: 2.99, commissionEarned: 0.30 },
  { id: "r8", date: "2026-05-23", plan: "Plus", region: "DR", status: "active", monthlyValue: 2.99, commissionEarned: 0.75 },
];

const SAMPLE_EARNINGS: EarningEntry[] = [
  { id: "e1", month: "May 2026", referralEarnings: 1247.30, contentBonus: 150.00, total: 1397.30, status: "pending" },
  { id: "e2", month: "Apr 2026", referralEarnings: 1089.50, contentBonus: 125.00, total: 1214.50, status: "paid" },
  { id: "e3", month: "Mar 2026", referralEarnings: 934.20, contentBonus: 100.00, total: 1034.20, status: "paid" },
  { id: "e4", month: "Feb 2026", referralEarnings: 712.80, contentBonus: 75.00, total: 787.80, status: "paid" },
  { id: "e5", month: "Jan 2026", referralEarnings: 458.70, contentBonus: 0.00, total: 458.70, status: "paid" },
];

const TIER_INFO = {
  bronze: { label: "Bronze", color: "#CD7F32", minRefs: 0, commission: "15%" },
  silver: { label: "Silver", color: "#C0C0C0", minRefs: 100, commission: "20%" },
  gold: { label: "Gold", color: "#FFD700", minRefs: 500, commission: "25%" },
  platinum: { label: "Platinum", color: "#E5E4E2", minRefs: 2000, commission: "30%" },
};

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────
export default function CreatorDashboardScreen() {
  const [activeTab, setActiveTab] = useState<DashboardTab>("overview");
  const [stats, setStats] = useState<CreatorStats>(SAMPLE_STATS);
  const [referrals, setReferrals] = useState<Referral[]>(SAMPLE_REFERRALS);
  const [earnings, setEarnings] = useState<EarningEntry[]>(SAMPLE_EARNINGS);
  const [creatorName, setCreatorName] = useState("Omar");
  const [referralCode, setReferralCode] = useState("OMAR2026");
  const [referralLink, setReferralLink] = useState("connectworldai.com/ref/OMAR2026");

  const tierInfo = TIER_INFO[stats.tier];

  const handleTabChange = (tab: DashboardTab) => {
    setActiveTab(tab);
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handleCopyLink = async () => {
    // In production: Clipboard.setStringAsync(referralLink)
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const handleRequestPayout = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    // In production: trigger Stripe payout
  };

  // ─── OVERVIEW TAB ──────────────────────────────────────────────────────────
  const renderOverview = () => (
    <View style={styles.tabContent}>
      {/* Welcome & Tier */}
      <View style={styles.welcomeCard}>
        <View style={styles.welcomeRow}>
          <View>
            <Text style={styles.welcomeText}>Welcome back, {creatorName}</Text>
            <Text style={styles.welcomeSubtext}>Your audience is growing</Text>
          </View>
          <View style={[styles.tierBadge, { borderColor: tierInfo.color }]}>
            <Ionicons name="trophy" size={14} color={tierInfo.color} />
            <Text style={[styles.tierText, { color: tierInfo.color }]}>{tierInfo.label}</Text>
          </View>
        </View>
        {/* Progress to next tier */}
        <View style={styles.tierProgress}>
          <View style={styles.tierProgressBar}>
            <View
              style={[
                styles.tierProgressFill,
                { width: `${(stats.totalReferrals / stats.nextTierAt) * 100}%`, backgroundColor: tierInfo.color },
              ]}
            />
          </View>
          <Text style={styles.tierProgressText}>
            {stats.totalReferrals} / {stats.nextTierAt} referrals to next tier ({tierInfo.commission} commission)
          </Text>
        </View>
      </View>

      {/* Key Metrics Grid */}
      <View style={styles.metricsGrid}>
        <View style={styles.metricCard}>
          <Ionicons name="people" size={20} color={Colors.secondary} />
          <Text style={styles.metricValue}>{stats.totalReferrals}</Text>
          <Text style={styles.metricLabel}>Total Referrals</Text>
        </View>
        <View style={styles.metricCard}>
          <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
          <Text style={styles.metricValue}>{stats.activeSubscribers}</Text>
          <Text style={styles.metricLabel}>Active Subs</Text>
        </View>
        <View style={styles.metricCard}>
          <Ionicons name="cash" size={20} color={Colors.gold} />
          <Text style={styles.metricValue}>${stats.totalEarnings.toFixed(0)}</Text>
          <Text style={styles.metricLabel}>Total Earned</Text>
        </View>
        <View style={styles.metricCard}>
          <Ionicons name="trending-up" size={20} color={Colors.success} />
          <Text style={styles.metricValue}>{stats.conversionRate}%</Text>
          <Text style={styles.metricLabel}>Conversion</Text>
        </View>
      </View>

      {/* Pending Payout */}
      <View style={styles.payoutCard}>
        <View style={styles.payoutInfo}>
          <Text style={styles.payoutLabel}>Pending Payout</Text>
          <Text style={styles.payoutAmount}>${stats.pendingPayout.toFixed(2)}</Text>
          <Text style={styles.payoutNote}>Next payout: June 1, 2026</Text>
        </View>
        <TouchableOpacity
          style={styles.payoutBtn}
          onPress={handleRequestPayout}
          activeOpacity={0.8}
        >
          <Ionicons name="wallet" size={16} color="#FFFFFF" />
          <Text style={styles.payoutBtnText}>Request</Text>
        </TouchableOpacity>
      </View>

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <TouchableOpacity style={styles.quickAction} onPress={handleCopyLink}>
          <Ionicons name="link" size={20} color={Colors.secondary} />
          <Text style={styles.quickActionText}>Copy Link</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickAction}>
          <Ionicons name="qr-code" size={20} color={Colors.secondary} />
          <Text style={styles.quickActionText}>QR Code</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickAction}>
          <Ionicons name="share-social" size={20} color={Colors.secondary} />
          <Text style={styles.quickActionText}>Share</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickAction}>
          <Ionicons name="analytics" size={20} color={Colors.secondary} />
          <Text style={styles.quickActionText}>Analytics</Text>
        </TouchableOpacity>
      </View>

      {/* Referral Code Display */}
      <View style={styles.codeCard}>
        <Text style={styles.codeLabel}>Your Promo Code</Text>
        <View style={styles.codeDisplay}>
          <Text style={styles.codeText}>{referralCode}</Text>
          <TouchableOpacity style={styles.codeCopyBtn} onPress={handleCopyLink}>
            <Ionicons name="copy" size={16} color={Colors.secondary} />
          </TouchableOpacity>
        </View>
        <Text style={styles.codeLinkText}>{referralLink}</Text>
      </View>

      {/* Monthly Growth */}
      <View style={styles.growthCard}>
        <View style={styles.growthHeader}>
          <Text style={styles.growthTitle}>Monthly Growth</Text>
          <View style={styles.growthBadge}>
            <Ionicons name="arrow-up" size={12} color={Colors.success} />
            <Text style={styles.growthPercent}>+{stats.monthlyGrowth}%</Text>
          </View>
        </View>
        <Text style={styles.growthDesc}>
          Your referrals grew {stats.monthlyGrowth}% this month compared to last month.
          Keep posting content with your promo code!
        </Text>
      </View>
    </View>
  );

  // ─── REFERRALS TAB ─────────────────────────────────────────────────────────
  const renderReferrals = () => (
    <View style={styles.tabContent}>
      <Text style={styles.sectionTitle}>Recent Referrals</Text>
      <Text style={styles.sectionSubtitle}>{referrals.length} referrals this week</Text>

      {referrals.map((ref) => (
        <View key={ref.id} style={styles.referralRow}>
          <View style={styles.referralLeft}>
            <View style={[styles.statusDot, {
              backgroundColor: ref.status === "active" ? Colors.success :
                ref.status === "trial" ? Colors.warning : Colors.error
            }]} />
            <View>
              <Text style={styles.referralPlan}>{ref.plan} • {ref.region}</Text>
              <Text style={styles.referralDate}>{ref.date}</Text>
            </View>
          </View>
          <View style={styles.referralRight}>
            <Text style={styles.referralValue}>${ref.monthlyValue}/mo</Text>
            <Text style={styles.referralCommission}>+${ref.commissionEarned.toFixed(2)}</Text>
          </View>
        </View>
      ))}

      {/* Region Breakdown */}
      <View style={styles.regionBreakdown}>
        <Text style={styles.regionTitle}>By Region</Text>
        {[
          { region: "Dominican Republic", count: 412, pct: 49 },
          { region: "United States", count: 198, pct: 23 },
          { region: "Colombia", count: 89, pct: 11 },
          { region: "Jamaica", count: 67, pct: 8 },
          { region: "Other", count: 81, pct: 9 },
        ].map((r) => (
          <View key={r.region} style={styles.regionRow}>
            <Text style={styles.regionName}>{r.region}</Text>
            <View style={styles.regionBarContainer}>
              <View style={[styles.regionBar, { width: `${r.pct}%` }]} />
            </View>
            <Text style={styles.regionCount}>{r.count}</Text>
          </View>
        ))}
      </View>
    </View>
  );

  // ─── EARNINGS TAB ──────────────────────────────────────────────────────────
  const renderEarnings = () => (
    <View style={styles.tabContent}>
      <Text style={styles.sectionTitle}>Earnings History</Text>

      {earnings.map((entry) => (
        <View key={entry.id} style={styles.earningRow}>
          <View style={styles.earningLeft}>
            <Text style={styles.earningMonth}>{entry.month}</Text>
            <View style={styles.earningBreakdown}>
              <Text style={styles.earningDetail}>Referrals: ${entry.referralEarnings.toFixed(2)}</Text>
              {entry.contentBonus > 0 && (
                <Text style={styles.earningDetail}>Content Bonus: ${entry.contentBonus.toFixed(2)}</Text>
              )}
            </View>
          </View>
          <View style={styles.earningRight}>
            <Text style={styles.earningTotal}>${entry.total.toFixed(2)}</Text>
            <View style={[styles.earningStatus, {
              backgroundColor: entry.status === "paid" ? "rgba(0, 255, 136, 0.1)" :
                entry.status === "pending" ? "rgba(255, 184, 0, 0.1)" : "rgba(0, 170, 255, 0.1)"
            }]}>
              <Text style={[styles.earningStatusText, {
                color: entry.status === "paid" ? Colors.success :
                  entry.status === "pending" ? Colors.gold : Colors.secondary
              }]}>
                {entry.status.charAt(0).toUpperCase() + entry.status.slice(1)}
              </Text>
            </View>
          </View>
        </View>
      ))}

      {/* Commission Structure */}
      <View style={styles.commissionCard}>
        <Text style={styles.commissionTitle}>Your Commission Structure</Text>
        <View style={styles.commissionRow}>
          <Text style={styles.commissionLabel}>First month (new subscriber)</Text>
          <Text style={styles.commissionValue}>25%</Text>
        </View>
        <View style={styles.commissionRow}>
          <Text style={styles.commissionLabel}>Recurring (months 2+)</Text>
          <Text style={styles.commissionValue}>10%</Text>
        </View>
        <View style={styles.commissionRow}>
          <Text style={styles.commissionLabel}>Content bonus (monthly)</Text>
          <Text style={styles.commissionValue}>$50-$300</Text>
        </View>
        <View style={styles.commissionRow}>
          <Text style={styles.commissionLabel}>Minimum payout</Text>
          <Text style={styles.commissionValue}>$50</Text>
        </View>
      </View>
    </View>
  );

  // ─── CONTENT TAB ───────────────────────────────────────────────────────────
  const renderContent = () => (
    <View style={styles.tabContent}>
      <Text style={styles.sectionTitle}>Your AI Avatar Content</Text>
      <Text style={styles.sectionSubtitle}>Content generated using your teaching style</Text>

      {/* Avatar Performance */}
      <View style={styles.avatarCard}>
        <View style={styles.avatarHeader}>
          <View style={styles.avatarIcon}>
            <Ionicons name="person-circle" size={40} color={Colors.secondary} />
          </View>
          <View>
            <Text style={styles.avatarName}>AI Omar</Text>
            <Text style={styles.avatarStatus}>Active • Teaching 24/7</Text>
          </View>
        </View>
        <View style={styles.avatarStats}>
          <View style={styles.avatarStat}>
            <Text style={styles.avatarStatValue}>1,247</Text>
            <Text style={styles.avatarStatLabel}>Lessons Delivered</Text>
          </View>
          <View style={styles.avatarStat}>
            <Text style={styles.avatarStatValue}>4.8★</Text>
            <Text style={styles.avatarStatLabel}>Avg Rating</Text>
          </View>
          <View style={styles.avatarStat}>
            <Text style={styles.avatarStatValue}>89%</Text>
            <Text style={styles.avatarStatLabel}>Completion</Text>
          </View>
        </View>
      </View>

      {/* Content Generated */}
      <View style={styles.contentList}>
        <Text style={styles.contentListTitle}>Recent AI-Generated Content</Text>
        {[
          { title: "Pronunciation: taught vs thought", views: 3420, format: "Short Clip" },
          { title: "Kitchen vocabulary drill", views: 2180, format: "Voice Memo" },
          { title: "Natural speech linking lesson", views: 5670, format: "Short Clip" },
          { title: "Number pronunciation (3, 13, 30)", views: 4100, format: "Short Clip" },
          { title: "Conditional phrases practice", views: 1890, format: "Exercise" },
        ].map((content, idx) => (
          <View key={idx} style={styles.contentRow}>
            <View style={styles.contentInfo}>
              <Text style={styles.contentTitle}>{content.title}</Text>
              <Text style={styles.contentMeta}>{content.format} • {content.views.toLocaleString()} views</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
          </View>
        ))}
      </View>
    </View>
  );

  // ─── TOOLS TAB ─────────────────────────────────────────────────────────────
  const renderTools = () => (
    <View style={styles.tabContent}>
      <Text style={styles.sectionTitle}>Creator Tools</Text>

      {/* Promo Materials */}
      <View style={styles.toolSection}>
        <Text style={styles.toolSectionTitle}>Promo Materials</Text>
        {[
          { icon: "image", title: "Instagram Story Templates", desc: "Pre-made stories with your code" },
          { icon: "videocam", title: "TikTok Overlay Pack", desc: "Branded overlays for your videos" },
          { icon: "document-text", title: "Caption Templates", desc: "Copy-paste captions in Spanish & English" },
          { icon: "link", title: "Bio Link Page", desc: "Custom landing page for your audience" },
        ].map((tool, idx) => (
          <TouchableOpacity key={idx} style={styles.toolRow} activeOpacity={0.7}>
            <View style={styles.toolIcon}>
              <Ionicons name={tool.icon as any} size={20} color={Colors.secondary} />
            </View>
            <View style={styles.toolInfo}>
              <Text style={styles.toolTitle}>{tool.title}</Text>
              <Text style={styles.toolDesc}>{tool.desc}</Text>
            </View>
            <Ionicons name="download-outline" size={18} color={Colors.textSecondary} />
          </TouchableOpacity>
        ))}
      </View>

      {/* Suggested Posts */}
      <View style={styles.toolSection}>
        <Text style={styles.toolSectionTitle}>Suggested Posts This Week</Text>
        {[
          { text: "🎯 My students are learning English 24/7 with AI — try it for $2.99/mo with code OMAR2026", platform: "TikTok" },
          { text: "🇩🇴 Aprende inglés con IA por solo $2.99/mes. Usa mi código OMAR2026 👇", platform: "Instagram" },
          { text: "💡 I cloned my teaching style into an AI that never sleeps. Link in bio!", platform: "TikTok" },
        ].map((post, idx) => (
          <View key={idx} style={styles.suggestedPost}>
            <View style={styles.postHeader}>
              <Text style={styles.postPlatform}>{post.platform}</Text>
              <TouchableOpacity style={styles.postCopyBtn}>
                <Ionicons name="copy-outline" size={14} color={Colors.secondary} />
                <Text style={styles.postCopyText}>Copy</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.postText}>{post.text}</Text>
          </View>
        ))}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerBackBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Creator Dashboard</Text>
        <TouchableOpacity style={styles.headerNotifBtn}>
          <Ionicons name="notifications-outline" size={20} color={Colors.textPrimary} />
          <View style={styles.notifDot} />
        </TouchableOpacity>
      </View>

      {/* Tab Bar */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabBar}
      >
        {([
          { key: "overview", label: "Overview", icon: "grid" },
          { key: "referrals", label: "Referrals", icon: "people" },
          { key: "earnings", label: "Earnings", icon: "cash" },
          { key: "content", label: "Content", icon: "film" },
          { key: "tools", label: "Tools", icon: "construct" },
        ] as const).map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.tabActive]}
            onPress={() => handleTabChange(tab.key)}
          >
            <Ionicons
              name={tab.icon as any}
              size={16}
              color={activeTab === tab.key ? Colors.secondary : Colors.textMuted}
            />
            <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Tab Content */}
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {activeTab === "overview" && renderOverview()}
        {activeTab === "referrals" && renderReferrals()}
        {activeTab === "earnings" && renderEarnings()}
        {activeTab === "content" && renderContent()}
        {activeTab === "tools" && renderTools()}
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── STYLES ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerBackBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.surfaceCard,
  },
  headerTitle: {
    fontSize: FontSize.lg,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  headerNotifBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.surfaceCard,
    position: "relative",
  },
  notifDot: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.accent,
  },

  // Tab Bar
  tabBar: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  tab: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.surfaceCard,
    borderWidth: 1,
    borderColor: "transparent",
  },
  tabActive: {
    borderColor: Colors.glowBorder,
    backgroundColor: "rgba(0, 170, 255, 0.08)",
  },
  tabText: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.textMuted,
  },
  tabTextActive: {
    color: Colors.secondary,
  },

  scrollContent: {
    paddingBottom: 100,
  },
  tabContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 16,
  },

  // Welcome Card
  welcomeCard: {
    backgroundColor: Colors.surfaceCard,
    borderRadius: BorderRadius.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  welcomeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  welcomeText: {
    fontSize: FontSize.lg,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  welcomeSubtext: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  tierBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  tierText: {
    fontSize: 12,
    fontWeight: "700",
  },
  tierProgress: {
    marginTop: 14,
  },
  tierProgressBar: {
    height: 6,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 3,
    overflow: "hidden",
  },
  tierProgressFill: {
    height: 6,
    borderRadius: 3,
  },
  tierProgressText: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 6,
  },

  // Metrics Grid
  metricsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  metricCard: {
    width: (SCREEN_WIDTH - 42) / 2 - 5,
    backgroundColor: Colors.surfaceCard,
    borderRadius: BorderRadius.md,
    padding: 14,
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  metricValue: {
    fontSize: FontSize.xl,
    fontWeight: "800",
    color: Colors.textPrimary,
  },
  metricLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
  },

  // Payout Card
  payoutCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(255, 184, 0, 0.08)",
    borderRadius: BorderRadius.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.goldBorder,
  },
  payoutInfo: {},
  payoutLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  payoutAmount: {
    fontSize: FontSize.xl,
    fontWeight: "800",
    color: Colors.gold,
    marginTop: 2,
  },
  payoutNote: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
  },
  payoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Colors.gold,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
  },
  payoutBtnText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#000000",
  },

  // Quick Actions
  quickActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
  },
  quickAction: {
    flex: 1,
    alignItems: "center",
    gap: 6,
    backgroundColor: Colors.surfaceCard,
    paddingVertical: 14,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  quickActionText: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: "600",
  },

  // Code Card
  codeCard: {
    backgroundColor: Colors.surfaceCard,
    borderRadius: BorderRadius.lg,
    padding: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  codeLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  codeDisplay: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  codeText: {
    fontSize: 24,
    fontWeight: "900",
    color: Colors.secondary,
    letterSpacing: 2,
  },
  codeCopyBtn: {
    padding: 6,
  },
  codeLinkText: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 6,
  },

  // Growth Card
  growthCard: {
    backgroundColor: Colors.surfaceCard,
    borderRadius: BorderRadius.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  growthHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  growthTitle: {
    fontSize: FontSize.md,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  growthBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "rgba(0, 255, 136, 0.1)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  growthPercent: {
    fontSize: 12,
    fontWeight: "700",
    color: Colors.success,
  },
  growthDesc: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
    marginTop: 8,
  },

  // Referrals Tab
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: -8,
  },
  referralRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: Colors.surfaceCard,
    borderRadius: BorderRadius.md,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  referralLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  referralPlan: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  referralDate: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  referralRight: {
    alignItems: "flex-end",
  },
  referralValue: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  referralCommission: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.success,
  },

  // Region Breakdown
  regionBreakdown: {
    backgroundColor: Colors.surfaceCard,
    borderRadius: BorderRadius.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  regionTitle: {
    fontSize: FontSize.md,
    fontWeight: "700",
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  regionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 10,
  },
  regionName: {
    fontSize: 12,
    color: Colors.textSecondary,
    width: 120,
  },
  regionBarContainer: {
    flex: 1,
    height: 6,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 3,
    overflow: "hidden",
  },
  regionBar: {
    height: 6,
    backgroundColor: Colors.secondary,
    borderRadius: 3,
  },
  regionCount: {
    fontSize: 12,
    fontWeight: "700",
    color: Colors.textPrimary,
    width: 40,
    textAlign: "right",
  },

  // Earnings Tab
  earningRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: Colors.surfaceCard,
    borderRadius: BorderRadius.md,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  earningLeft: {},
  earningMonth: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  earningBreakdown: {
    marginTop: 4,
  },
  earningDetail: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  earningRight: {
    alignItems: "flex-end",
    gap: 6,
  },
  earningTotal: {
    fontSize: 18,
    fontWeight: "800",
    color: Colors.gold,
  },
  earningStatus: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  earningStatusText: {
    fontSize: 11,
    fontWeight: "700",
  },

  // Commission Card
  commissionCard: {
    backgroundColor: Colors.surfaceCard,
    borderRadius: BorderRadius.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  commissionTitle: {
    fontSize: FontSize.md,
    fontWeight: "700",
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  commissionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0, 170, 255, 0.08)",
  },
  commissionLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  commissionValue: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.textPrimary,
  },

  // Content Tab
  avatarCard: {
    backgroundColor: Colors.surfaceCard,
    borderRadius: BorderRadius.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.glowBorder,
  },
  avatarHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 14,
  },
  avatarIcon: {},
  avatarName: {
    fontSize: FontSize.lg,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  avatarStatus: {
    fontSize: 12,
    color: Colors.success,
  },
  avatarStats: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  avatarStat: {
    alignItems: "center",
  },
  avatarStatValue: {
    fontSize: 18,
    fontWeight: "800",
    color: Colors.textPrimary,
  },
  avatarStatLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  contentList: {
    backgroundColor: Colors.surfaceCard,
    borderRadius: BorderRadius.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  contentListTitle: {
    fontSize: FontSize.md,
    fontWeight: "700",
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  contentRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0, 170, 255, 0.06)",
  },
  contentInfo: {},
  contentTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  contentMeta: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
  },

  // Tools Tab
  toolSection: {
    gap: 10,
  },
  toolSectionTitle: {
    fontSize: FontSize.md,
    fontWeight: "700",
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  toolRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: Colors.surfaceCard,
    borderRadius: BorderRadius.md,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  toolIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "rgba(0, 170, 255, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  toolInfo: {
    flex: 1,
  },
  toolTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  toolDesc: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 1,
  },
  suggestedPost: {
    backgroundColor: Colors.surfaceCard,
    borderRadius: BorderRadius.md,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  postHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  postPlatform: {
    fontSize: 11,
    fontWeight: "700",
    color: Colors.secondary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  postCopyBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  postCopyText: {
    fontSize: 12,
    color: Colors.secondary,
  },
  postText: {
    fontSize: 14,
    color: Colors.textPrimary,
    lineHeight: 20,
  },
});
