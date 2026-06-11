import React, { useState } from "react";
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

// ─── TRANSACTION DATA ───
type TransactionType = "purchase" | "credit_spent" | "credit_earned" | "referral" | "subscription";

interface Transaction {
  id: string;
  type: TransactionType;
  title: string;
  description: string;
  amount: string;
  credits?: number;
  date: string;
  time: string;
  status: "completed" | "pending" | "refunded";
  icon: string;
  iconColor: string;
}

const TRANSACTIONS: Transaction[] = [
  {
    id: "t1",
    type: "purchase",
    title: "Live Call Translation",
    description: "Per-call purchase",
    amount: "-$2.99",
    date: "May 22, 2026",
    time: "2:34 PM",
    status: "completed",
    icon: "call",
    iconColor: Colors.secondary,
  },
  {
    id: "t2",
    type: "referral",
    title: "Referral Bonus",
    description: "Maria_Speaks joined via your link",
    amount: "+25 credits",
    credits: 25,
    date: "May 21, 2026",
    time: "9:12 AM",
    status: "completed",
    icon: "gift",
    iconColor: Colors.gold,
  },
  {
    id: "t3",
    type: "credit_spent",
    title: "Song Transcription",
    description: "Bad Bunny - Titi Me Preguntó",
    amount: "-20 credits",
    credits: -20,
    date: "May 20, 2026",
    time: "7:45 PM",
    status: "completed",
    icon: "musical-notes",
    iconColor: "#E040FB",
  },
  {
    id: "t4",
    type: "subscription",
    title: "Pro Plan - Monthly",
    description: "Subscription renewal",
    amount: "-$9.99",
    date: "May 19, 2026",
    time: "12:00 AM",
    status: "completed",
    icon: "diamond",
    iconColor: Colors.glow,
  },
  {
    id: "t5",
    type: "credit_earned",
    title: "Credit Pack Purchase",
    description: "150 credits + 15 bonus",
    amount: "-$9.99",
    credits: 165,
    date: "May 18, 2026",
    time: "3:22 PM",
    status: "completed",
    icon: "wallet",
    iconColor: Colors.success,
  },
  {
    id: "t6",
    type: "purchase",
    title: "Call Transcript",
    description: "10-pack transcripts",
    amount: "-$3.99",
    date: "May 17, 2026",
    time: "11:08 AM",
    status: "completed",
    icon: "document-text",
    iconColor: Colors.secondary,
  },
  {
    id: "t7",
    type: "referral",
    title: "Referral Bonus",
    description: "Carlos_NYC joined via your QR",
    amount: "+25 credits",
    credits: 25,
    date: "May 16, 2026",
    time: "5:30 PM",
    status: "completed",
    icon: "gift",
    iconColor: Colors.gold,
  },
  {
    id: "t8",
    type: "credit_spent",
    title: "AI Teacher Session",
    description: "30 min Spanish conversation",
    amount: "-50 credits",
    credits: -50,
    date: "May 15, 2026",
    time: "4:00 PM",
    status: "completed",
    icon: "school",
    iconColor: Colors.secondary,
  },
  {
    id: "t9",
    type: "purchase",
    title: "Voice Clone",
    description: "One-time unlock",
    amount: "-$9.99",
    date: "May 14, 2026",
    time: "1:15 PM",
    status: "completed",
    icon: "mic",
    iconColor: Colors.accent,
  },
  {
    id: "t10",
    type: "referral",
    title: "Referral Bonus",
    description: "Aisha_Learn joined via your link",
    amount: "+25 credits",
    credits: 25,
    date: "May 13, 2026",
    time: "8:45 AM",
    status: "completed",
    icon: "gift",
    iconColor: Colors.gold,
  },
  {
    id: "t11",
    type: "credit_spent",
    title: "Video Translation",
    description: "3 minutes translated",
    amount: "-3 credits",
    credits: -3,
    date: "May 12, 2026",
    time: "6:20 PM",
    status: "completed",
    icon: "videocam",
    iconColor: Colors.glow,
  },
  {
    id: "t12",
    type: "purchase",
    title: "Live Call Translation",
    description: "Unlimited monthly",
    amount: "-$14.99",
    date: "May 10, 2026",
    time: "10:00 AM",
    status: "refunded",
    icon: "call",
    iconColor: Colors.secondary,
  },
];

type FilterKey = "all" | "purchases" | "credits" | "referrals";

const FILTERS: { key: FilterKey; label: string; icon: string }[] = [
  { key: "all", label: "All", icon: "list" },
  { key: "purchases", label: "Purchases", icon: "cart" },
  { key: "credits", label: "Credits", icon: "flash" },
  { key: "referrals", label: "Referrals", icon: "gift" },
];

export default function TransactionHistoryScreen() {
  const [activeFilter, setActiveFilter] = useState<FilterKey>("all");

  const filteredTransactions = TRANSACTIONS.filter((t) => {
    if (activeFilter === "all") return true;
    if (activeFilter === "purchases") return t.type === "purchase" || t.type === "subscription";
    if (activeFilter === "credits") return t.type === "credit_spent" || t.type === "credit_earned";
    if (activeFilter === "referrals") return t.type === "referral";
    return true;
  });

  // Summary stats
  const totalSpent = TRANSACTIONS.filter(t => t.type === "purchase" || t.type === "subscription")
    .reduce((sum, t) => sum + parseFloat(t.amount.replace(/[^0-9.-]/g, "")), 0);
  const totalCreditsEarned = TRANSACTIONS.filter(t => t.credits && t.credits > 0)
    .reduce((sum, t) => sum + (t.credits || 0), 0);
  const totalCreditsSpent = TRANSACTIONS.filter(t => t.credits && t.credits < 0)
    .reduce((sum, t) => sum + Math.abs(t.credits || 0), 0);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return Colors.success;
      case "pending": return Colors.warning;
      case "refunded": return Colors.accent;
      default: return Colors.textMuted;
    }
  };

  const getAmountColor = (transaction: Transaction) => {
    if (transaction.status === "refunded") return Colors.textMuted;
    if (transaction.amount.startsWith("+")) return Colors.success;
    if (transaction.type === "referral") return Colors.gold;
    return Colors.textPrimary;
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Transaction History</Text>
        <TouchableOpacity
          style={styles.exportBtn}
          onPress={() => {
            if (Platform.OS !== "web") {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }
          }}
        >
          <Ionicons name="download-outline" size={20} color={Colors.secondary} />
        </TouchableOpacity>
      </View>

      {/* Summary Cards */}
      <View style={styles.summaryRow}>
        <View style={styles.summaryCard}>
          <Ionicons name="card" size={18} color={Colors.accent} />
          <Text style={styles.summaryAmount}>${Math.abs(totalSpent).toFixed(2)}</Text>
          <Text style={styles.summaryLabel}>Total Spent</Text>
        </View>
        <View style={styles.summaryCard}>
          <Ionicons name="arrow-up-circle" size={18} color={Colors.success} />
          <Text style={[styles.summaryAmount, { color: Colors.success }]}>{totalCreditsEarned}</Text>
          <Text style={styles.summaryLabel}>Credits Earned</Text>
        </View>
        <View style={styles.summaryCard}>
          <Ionicons name="arrow-down-circle" size={18} color={Colors.gold} />
          <Text style={[styles.summaryAmount, { color: Colors.gold }]}>{totalCreditsSpent}</Text>
          <Text style={styles.summaryLabel}>Credits Used</Text>
        </View>
      </View>

      {/* Monthly Spending Chart */}
      <View style={styles.chartContainer}>
        <View style={styles.chartHeader}>
          <Text style={styles.chartTitle}>Spending Trends</Text>
          <Text style={styles.chartPeriod}>Last 6 Months</Text>
        </View>
        <View style={styles.chartBody}>
          {[
            { month: "Dec", amount: 12.99, credits: 40 },
            { month: "Jan", amount: 19.98, credits: 85 },
            { month: "Feb", amount: 9.99, credits: 50 },
            { month: "Mar", amount: 34.97, credits: 120 },
            { month: "Apr", amount: 24.99, credits: 95 },
            { month: "May", amount: 41.95, credits: 73 },
          ].map((item, index) => {
            const maxAmount = 41.95;
            const barHeight = Math.max((item.amount / maxAmount) * 80, 8);
            const isCurrentMonth = index === 5;
            return (
              <View key={item.month} style={styles.chartBar}>
                <Text style={styles.chartBarAmount}>${item.amount.toFixed(0)}</Text>
                <View style={styles.chartBarTrack}>
                  <View
                    style={[
                      styles.chartBarFill,
                      {
                        height: barHeight,
                        backgroundColor: isCurrentMonth ? Colors.secondary : Colors.secondary + "60",
                      },
                      isCurrentMonth && styles.chartBarCurrent,
                    ]}
                  />
                </View>
                <Text style={[styles.chartBarLabel, isCurrentMonth && styles.chartBarLabelActive]}>
                  {item.month}
                </Text>
              </View>
            );
          })}
        </View>
        <View style={styles.chartLegend}>
          <View style={styles.chartLegendItem}>
            <View style={[styles.chartLegendDot, { backgroundColor: Colors.secondary }]} />
            <Text style={styles.chartLegendText}>Current Month</Text>
          </View>
          <View style={styles.chartLegendItem}>
            <View style={[styles.chartLegendDot, { backgroundColor: Colors.secondary + "60" }]} />
            <Text style={styles.chartLegendText}>Previous</Text>
          </View>
        </View>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterRow}>
        {FILTERS.map((filter) => (
          <TouchableOpacity
            key={filter.key}
            style={[styles.filterTab, activeFilter === filter.key && styles.filterTabActive]}
            onPress={() => {
              setActiveFilter(filter.key);
              if (Platform.OS !== "web") {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }
            }}
          >
            <Ionicons
              name={filter.icon as any}
              size={14}
              color={activeFilter === filter.key ? Colors.secondary : Colors.textMuted}
            />
            <Text style={[styles.filterText, activeFilter === filter.key && styles.filterTextActive]}>
              {filter.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Transaction List */}
      <ScrollView style={styles.listContainer} contentContainerStyle={styles.listContent}>
        {filteredTransactions.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="receipt-outline" size={48} color={Colors.textMuted} />
            <Text style={styles.emptyText}>No transactions found</Text>
          </View>
        ) : (
          filteredTransactions.map((transaction) => (
            <View key={transaction.id} style={styles.transactionCard}>
              <View style={[styles.transactionIcon, { backgroundColor: transaction.iconColor + "18" }]}>
                <Ionicons name={transaction.icon as any} size={20} color={transaction.iconColor} />
              </View>
              <View style={styles.transactionInfo}>
                <View style={styles.transactionTop}>
                  <Text style={styles.transactionTitle} numberOfLines={1}>{transaction.title}</Text>
                  <Text style={[styles.transactionAmount, { color: getAmountColor(transaction) }]}>
                    {transaction.status === "refunded" ? (
                      <Text style={{ textDecorationLine: "line-through" }}>{transaction.amount}</Text>
                    ) : (
                      transaction.amount
                    )}
                  </Text>
                </View>
                <View style={styles.transactionBottom}>
                  <Text style={styles.transactionDesc} numberOfLines={1}>{transaction.description}</Text>
                  <View style={styles.transactionMeta}>
                    {transaction.status === "refunded" && (
                      <View style={[styles.statusBadge, { backgroundColor: Colors.accent + "20" }]}>
                        <Text style={[styles.statusText, { color: Colors.accent }]}>Refunded</Text>
                      </View>
                    )}
                  </View>
                </View>
                <Text style={styles.transactionDate}>{transaction.date} • {transaction.time}</Text>
              </View>
            </View>
          ))
        )}
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.primary },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: FontSize.xl, fontWeight: "700", color: Colors.textPrimary },
  exportBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surfaceCard,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.border,
  },

  // Summary
  summaryRow: {
    flexDirection: "row",
    paddingHorizontal: Spacing.lg,
    gap: 10,
    marginBottom: Spacing.md,
  },
  summaryCard: {
    flex: 1,
    alignItems: "center",
    backgroundColor: Colors.surfaceCard,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 4,
  },
  summaryAmount: {
    fontSize: 18,
    fontWeight: "800",
    color: Colors.textPrimary,
  },
  summaryLabel: {
    fontSize: 10,
    color: Colors.textMuted,
  },

  // Spending Chart
  chartContainer: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    backgroundColor: Colors.surfaceCard,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chartHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  chartTitle: {
    fontSize: FontSize.sm,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  chartPeriod: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
  },
  chartBody: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    height: 110,
    paddingTop: 10,
  },
  chartBar: {
    flex: 1,
    alignItems: "center",
    gap: 4,
  },
  chartBarAmount: {
    fontSize: 9,
    fontWeight: "600",
    color: Colors.textMuted,
  },
  chartBarTrack: {
    width: 28,
    height: 80,
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 6,
    justifyContent: "flex-end",
    overflow: "hidden",
  },
  chartBarFill: {
    width: "100%",
    borderRadius: 6,
  },
  chartBarCurrent: {
    shadowColor: Colors.secondary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 6,
  },
  chartBarLabel: {
    fontSize: 10,
    color: Colors.textMuted,
    fontWeight: "500",
  },
  chartBarLabelActive: {
    color: Colors.secondary,
    fontWeight: "700",
  },
  chartLegend: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 16,
    marginTop: Spacing.md,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  chartLegendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  chartLegendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  chartLegendText: {
    fontSize: 10,
    color: Colors.textMuted,
  },

  // Filters
  filterRow: {
    flexDirection: "row",
    paddingHorizontal: Spacing.lg,
    gap: 8,
    marginBottom: Spacing.md,
  },
  filterTab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingVertical: 10,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surfaceCard,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterTabActive: {
    backgroundColor: Colors.glowSubtle,
    borderColor: Colors.secondary,
  },
  filterText: {
    fontSize: 11,
    fontWeight: "600",
    color: Colors.textMuted,
  },
  filterTextActive: {
    color: Colors.secondary,
  },

  // Transaction List
  listContainer: { flex: 1 },
  listContent: { paddingHorizontal: Spacing.lg },
  transactionCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: Colors.surfaceCard,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 12,
  },
  transactionIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  transactionInfo: {
    flex: 1,
    gap: 4,
  },
  transactionTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  transactionTitle: {
    fontSize: FontSize.sm,
    fontWeight: "700",
    color: Colors.textPrimary,
    flex: 1,
    marginRight: 8,
  },
  transactionAmount: {
    fontSize: FontSize.sm,
    fontWeight: "700",
  },
  transactionBottom: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  transactionDesc: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    flex: 1,
    marginRight: 8,
  },
  transactionMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 10,
    fontWeight: "600",
  },
  transactionDate: {
    fontSize: 10,
    color: Colors.textMuted,
    marginTop: 2,
  },

  // Empty state
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.xxl * 2,
    gap: 12,
  },
  emptyText: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
  },
});
