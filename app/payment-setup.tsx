import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Platform,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Colors, Spacing, BorderRadius, FontSize } from "../constants/Colors";
import {
  getSubscriptionStatus,
  getAvailablePackages,
  purchasePackage,
  restorePurchases,
  openManageSubscriptions,
  type PlanId,
  type SubscriptionStatus,
  type AvailablePackage,
} from "../lib/revenuecat";

// ─── Types ───────────────────────────────────────────────────────────────────
type BillingCycle = "monthly" | "yearly";

interface PlanDisplay {
  id: PlanId;
  name: string;
  features: string[];
  popular?: boolean;
  credits: number;
}

interface Invoice {
  id: string;
  date: string;
  amount: number;
  status: "paid" | "pending" | "failed";
  planName: string;
}

// ─── Plans Display Data ─────────────────────────────────────────────────────
const PLANS_DISPLAY: PlanDisplay[] = [
  {
    id: "free", name: "Free", credits: 50,
    features: ["50 credits/month", "Basic translations", "5 songs/month", "Community access", "1 language"],
  },
  {
    id: "plus", name: "Plus", credits: 500, popular: true,
    features: ["500 credits/month", "Unlimited translations", "Unlimited songs", "AI teacher (10 hrs)", "All languages", "Offline mode", "Priority support"],
  },
  {
    id: "pro", name: "Pro", credits: 2000,
    features: ["2000 credits/month", "Everything in Plus", "AI teacher (unlimited)", "Live simulation", "Custom flashcards", "Progress analytics", "Certificate exams", "Voice cloning"],
  },
  {
    id: "enterprise", name: "Enterprise", credits: 10000,
    features: ["10000 credits/month", "Everything in Pro", "Team management", "Custom curriculum", "API access", "Dedicated support", "White-label option", "Bulk licensing"],
  },
];

// ─── Component ───────────────────────────────────────────────────────────────
export default function PaymentSetupScreen() {
  const router = useRouter();
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus | null>(null);
  const [packages, setPackages] = useState<AvailablePackage[]>([]);
  const [billingCycle, setBillingCycle] = useState<BillingCycle>("monthly");
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [activeTab, setActiveTab] = useState<"plans" | "manage" | "history">("plans");
  const [processing, setProcessing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [restoring, setRestoring] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Fetch subscription status from RevenueCat
      const status = await getSubscriptionStatus();
      setSubscriptionStatus(status);

      // Fetch available packages (prices from App Store / Google Play)
      const availablePackages = await getAvailablePackages();
      setPackages(availablePackages);

      // Load invoice history from local storage
      const history = await AsyncStorage.getItem("@invoice_history");
      if (history) setInvoices(JSON.parse(history));
    } catch (e) {
      console.error("[PaymentSetup] Failed to load data:", e);
    } finally {
      setLoading(false);
    }
  };

  const currentPlan = subscriptionStatus?.plan || "free";

  // Get the price for a specific plan and billing cycle from RevenueCat packages
  const getPriceForPlan = useCallback(
    (planId: PlanId, cycle: BillingCycle): string => {
      const pkg = packages.find(
        (p) => p.planId === planId && p.billingCycle === cycle
      );
      if (pkg) return pkg.price;
      // Fallback prices if RevenueCat hasn't loaded
      const fallback: Record<string, Record<string, string>> = {
        free: { monthly: "$0.00", yearly: "$0.00" },
        plus: { monthly: "$9.99", yearly: "$99.99" },
        pro: { monthly: "$19.99", yearly: "$199.99" },
        enterprise: { monthly: "$49.99", yearly: "$499.99" },
      };
      return fallback[planId]?.[cycle] || "$0.00";
    },
    [packages]
  );

  const handleSubscribe = async (planId: PlanId) => {
    if (planId === currentPlan) return;
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    if (planId === "free") {
      // Downgrade — direct user to manage subscriptions
      Alert.alert(
        "Manage Subscription",
        "To downgrade or cancel, you'll be taken to your subscription management page.",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Manage",
            onPress: async () => {
              await openManageSubscriptions();
            },
          },
        ]
      );
      return;
    }

    // Find the matching package from RevenueCat
    const pkg = packages.find(
      (p) => p.planId === planId && p.billingCycle === billingCycle
    );

    if (!pkg) {
      Alert.alert(
        "Unavailable",
        "This plan is not currently available for purchase. Please try again later."
      );
      return;
    }

    setProcessing(true);

    try {
      const result = await purchasePackage(pkg);

      if (result.success) {
        // Update local state
        setSubscriptionStatus({
          plan: result.plan,
          isActive: true,
          expirationDate: null,
          willRenew: true,
          managementUrl: null,
        });

        // Sync subscription tier to usage context for limit enforcement
        const usageTier = result.plan === "enterprise" ? "pro" : result.plan === "free" ? "free" : result.plan;
        await AsyncStorage.setItem("@subscription_tier", usageTier === "pro" ? "premium" : usageTier);
        await AsyncStorage.setItem("@subscription_plan", result.plan);

        // Record invoice locally
        const newInvoice: Invoice = {
          id: `inv_${Date.now()}`,
          date: new Date().toISOString(),
          amount: pkg.priceAmount,
          status: "paid",
          planName: PLANS_DISPLAY.find((p) => p.id === result.plan)?.name || planId,
        };
        const updatedInvoices = [newInvoice, ...invoices];
        setInvoices(updatedInvoices);
        await AsyncStorage.setItem("@invoice_history", JSON.stringify(updatedInvoices));

        if (Platform.OS !== "web") {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }

        const planDisplay = PLANS_DISPLAY.find((p) => p.id === result.plan);
        Alert.alert(
          "Subscribed!",
          `You're now on the ${planDisplay?.name || planId} plan. Enjoy your ${planDisplay?.credits || 0} monthly credits!`
        );
      } else if (result.errorCode === "cancelled") {
        // User cancelled — do nothing
      } else {
        Alert.alert("Purchase Failed", result.error || "An error occurred. Please try again.");
      }
    } catch (error: any) {
      Alert.alert("Error", error.message || "Something went wrong. Please try again.");
    } finally {
      setProcessing(false);
    }
  };

  const handleRestore = async () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setRestoring(true);

    try {
      const status = await restorePurchases();
      setSubscriptionStatus(status);

      // Sync restored subscription tier to usage context
      if (status.plan !== "free") {
        const usageTier = status.plan === "enterprise" ? "pro" : status.plan;
        await AsyncStorage.setItem("@subscription_tier", usageTier === "pro" ? "premium" : usageTier);
        await AsyncStorage.setItem("@subscription_plan", status.plan);
        Alert.alert("Restored!", `Your ${status.plan.charAt(0).toUpperCase() + status.plan.slice(1)} subscription has been restored.`);
      } else {
        Alert.alert("No Purchases Found", "We couldn't find any previous purchases to restore.");
      }
    } catch (error: any) {
      Alert.alert("Restore Failed", "Unable to restore purchases. Please try again.");
    } finally {
      setRestoring(false);
    }
  };

  // ─── Render Plans ──────────────────────────────────────────────────────────
  const renderPlans = () => (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
      {/* Billing Toggle */}
      <View style={styles.billingToggle}>
        <TouchableOpacity
          style={[styles.toggleBtn, billingCycle === "monthly" && styles.toggleBtnActive]}
          onPress={() => setBillingCycle("monthly")}
        >
          <Text style={[styles.toggleText, billingCycle === "monthly" && styles.toggleTextActive]}>Monthly</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggleBtn, billingCycle === "yearly" && styles.toggleBtnActive]}
          onPress={() => setBillingCycle("yearly")}
        >
          <Text style={[styles.toggleText, billingCycle === "yearly" && styles.toggleTextActive]}>Yearly</Text>
          <View style={styles.saveBadge}><Text style={styles.saveBadgeText}>-17%</Text></View>
        </TouchableOpacity>
      </View>

      {/* Plan Cards */}
      {PLANS_DISPLAY.map((plan) => {
        const price = getPriceForPlan(plan.id, billingCycle);
        const isCurrent = plan.id === currentPlan;
        return (
          <View key={plan.id} style={[styles.planCard, plan.popular && styles.planCardPopular, isCurrent && styles.planCardCurrent]}>
            {plan.popular && <View style={styles.popularBadge}><Text style={styles.popularBadgeText}>Most Popular</Text></View>}
            {isCurrent && <View style={styles.currentBadge}><Text style={styles.currentBadgeText}>Current Plan</Text></View>}
            <Text style={styles.planName}>{plan.name}</Text>
            <View style={styles.priceRow}>
              <Text style={styles.priceAmount}>{price}</Text>
              <Text style={styles.pricePeriod}>/{billingCycle === "monthly" ? "mo" : "yr"}</Text>
            </View>
            <View style={styles.featuresList}>
              {plan.features.map((f, i) => (
                <View key={i} style={styles.featureRow}>
                  <Ionicons name="checkmark-circle" size={16} color={Colors.success} />
                  <Text style={styles.featureText}>{f}</Text>
                </View>
              ))}
            </View>
            <TouchableOpacity
              style={[styles.subscribeBtn, isCurrent && styles.subscribeBtnDisabled]}
              onPress={() => handleSubscribe(plan.id)}
              disabled={isCurrent || processing}
              activeOpacity={0.7}
            >
              {processing && !isCurrent ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={[styles.subscribeBtnText, isCurrent && styles.subscribeBtnTextDisabled]}>
                  {isCurrent ? "Current" : plan.id === "free" ? "Downgrade" : "Subscribe"}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        );
      })}

      {/* Restore Purchases */}
      <TouchableOpacity style={styles.restoreBtn} onPress={handleRestore} disabled={restoring}>
        {restoring ? (
          <ActivityIndicator color={Colors.secondary} size="small" />
        ) : (
          <Text style={styles.restoreBtnText}>Restore Purchases</Text>
        )}
      </TouchableOpacity>

      {/* Legal Note */}
      <Text style={styles.legalText}>
        Subscriptions auto-renew unless cancelled at least 24 hours before the end of the current period.
        Payment is charged to your Apple ID or Google Play account. Manage subscriptions in your device settings.
      </Text>
    </ScrollView>
  );

  // ─── Render Manage Subscription ───────────────────────────────────────────
  const renderManage = () => (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
      {/* Current Plan Status */}
      <View style={styles.statusCard}>
        <View style={styles.statusHeader}>
          <Ionicons name="shield-checkmark" size={28} color={Colors.secondary} />
          <Text style={styles.statusTitle}>
            {currentPlan === "free" ? "Free Plan" : `${currentPlan.charAt(0).toUpperCase() + currentPlan.slice(1)} Plan`}
          </Text>
        </View>
        {subscriptionStatus?.isActive && (
          <>
            {subscriptionStatus.expirationDate && (
              <Text style={styles.statusDetail}>
                Renews: {new Date(subscriptionStatus.expirationDate).toLocaleDateString()}
              </Text>
            )}
            <Text style={styles.statusDetail}>
              Auto-renew: {subscriptionStatus.willRenew ? "On" : "Off"}
            </Text>
          </>
        )}
      </View>

      {/* Manage Actions */}
      <TouchableOpacity style={styles.manageAction} onPress={() => openManageSubscriptions()}>
        <Ionicons name="settings-outline" size={22} color={Colors.textPrimary} />
        <View style={styles.manageActionInfo}>
          <Text style={styles.manageActionTitle}>Manage Subscription</Text>
          <Text style={styles.manageActionDesc}>Change plan, cancel, or update payment method</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
      </TouchableOpacity>

      <TouchableOpacity style={styles.manageAction} onPress={handleRestore}>
        <Ionicons name="refresh-outline" size={22} color={Colors.textPrimary} />
        <View style={styles.manageActionInfo}>
          <Text style={styles.manageActionTitle}>Restore Purchases</Text>
          <Text style={styles.manageActionDesc}>Recover subscriptions after reinstall or new device</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
      </TouchableOpacity>

      {/* Subscription Info */}
      <View style={styles.infoCard}>
        <Ionicons name="information-circle-outline" size={20} color={Colors.secondary} />
        <Text style={styles.infoText}>
          Subscriptions are managed through the App Store (iOS) or Google Play (Android).
          Changes may take a few minutes to reflect in the app.
        </Text>
      </View>
    </ScrollView>
  );

  // ─── Render Invoice History ────────────────────────────────────────────────
  const renderHistory = () => (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
      {invoices.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="receipt" size={48} color={Colors.textMuted} />
          <Text style={styles.emptyTitle}>No Invoices</Text>
          <Text style={styles.emptyDesc}>Your billing history will appear here after your first purchase.</Text>
        </View>
      ) : (
        invoices.map((inv) => (
          <View key={inv.id} style={styles.invoiceCard}>
            <View style={styles.invoiceLeft}>
              <Text style={styles.invoicePlan}>{inv.planName} Plan</Text>
              <Text style={styles.invoiceDate}>{new Date(inv.date).toLocaleDateString()}</Text>
            </View>
            <View style={styles.invoiceRight}>
              <Text style={styles.invoiceAmount}>${inv.amount.toFixed(2)}</Text>
              <View style={[styles.statusBadge, inv.status === "paid" ? styles.statusPaid : inv.status === "pending" ? styles.statusPending : styles.statusFailed]}>
                <Text style={styles.statusText}>{inv.status}</Text>
              </View>
            </View>
          </View>
        ))
      )}
    </ScrollView>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.secondary} />
          <Text style={styles.loadingText}>Loading plans...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Billing & Plans</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Tabs */}
      <View style={styles.tabRow}>
        {(["plans", "manage", "history"] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Ionicons
              name={tab === "plans" ? "pricetags" : tab === "manage" ? "settings" : "receipt"}
              size={16} color={activeTab === tab ? Colors.secondary : Colors.textMuted}
            />
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab === "plans" ? "Plans" : tab === "manage" ? "Manage" : "History"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      <View style={styles.content}>
        {activeTab === "plans" && renderPlans()}
        {activeTab === "manage" && renderManage()}
        {activeTab === "history" && renderHistory()}
      </View>
    </SafeAreaView>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.backgroundDark },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center", gap: 12 },
  loadingText: { color: Colors.textMuted, fontSize: FontSize.sm },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
  },
  backBtn: { width: 40, height: 40, justifyContent: "center", alignItems: "center" },
  headerTitle: { fontSize: FontSize.lg, fontWeight: "700", color: Colors.textPrimary },
  tabRow: {
    flexDirection: "row", paddingHorizontal: Spacing.md, gap: 4,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  tab: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 4, paddingVertical: 12, borderBottomWidth: 2, borderBottomColor: "transparent",
  },
  tabActive: { borderBottomColor: Colors.secondary },
  tabText: { fontSize: FontSize.xs, color: Colors.textMuted, fontWeight: "500" },
  tabTextActive: { color: Colors.secondary },
  content: { flex: 1, paddingHorizontal: Spacing.md, paddingTop: Spacing.md },

  // Billing Toggle
  billingToggle: {
    flexDirection: "row", backgroundColor: Colors.surfaceCard,
    borderRadius: BorderRadius.md, padding: 4, marginBottom: Spacing.lg,
  },
  toggleBtn: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
    paddingVertical: 10, borderRadius: BorderRadius.sm, gap: 4,
  },
  toggleBtnActive: { backgroundColor: Colors.secondary },
  toggleText: { fontSize: FontSize.sm, color: Colors.textMuted, fontWeight: "600" },
  toggleTextActive: { color: "#fff" },
  saveBadge: {
    backgroundColor: Colors.success, paddingHorizontal: 6, paddingVertical: 2,
    borderRadius: 8,
  },
  saveBadgeText: { fontSize: 10, color: "#fff", fontWeight: "700" },

  // Plan Cards
  planCard: {
    backgroundColor: Colors.surfaceCard, borderRadius: BorderRadius.lg,
    padding: Spacing.md, marginBottom: Spacing.md, borderWidth: 1, borderColor: Colors.border,
  },
  planCardPopular: { borderColor: Colors.secondary, borderWidth: 2 },
  planCardCurrent: { borderColor: Colors.success, borderWidth: 2 },
  popularBadge: {
    position: "absolute", top: -10, right: 12,
    backgroundColor: Colors.secondary, paddingHorizontal: 10, paddingVertical: 3, borderRadius: 12,
  },
  popularBadgeText: { fontSize: 10, color: "#fff", fontWeight: "700" },
  currentBadge: {
    position: "absolute", top: -10, left: 12,
    backgroundColor: Colors.success, paddingHorizontal: 10, paddingVertical: 3, borderRadius: 12,
  },
  currentBadgeText: { fontSize: 10, color: "#fff", fontWeight: "700" },
  planName: { fontSize: FontSize.lg, fontWeight: "700", color: Colors.textPrimary, marginBottom: 4 },
  priceRow: { flexDirection: "row", alignItems: "baseline", marginBottom: 12 },
  priceAmount: { fontSize: 28, fontWeight: "800", color: Colors.textPrimary },
  pricePeriod: { fontSize: FontSize.sm, color: Colors.textMuted, marginLeft: 2 },
  featuresList: { gap: 6, marginBottom: 16 },
  featureRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  featureText: { fontSize: FontSize.xs, color: Colors.textSecondary, flex: 1 },
  subscribeBtn: {
    backgroundColor: Colors.secondary, paddingVertical: 12,
    borderRadius: BorderRadius.md, alignItems: "center",
  },
  subscribeBtnDisabled: { backgroundColor: Colors.backgroundDark },
  subscribeBtnText: { color: "#fff", fontSize: FontSize.sm, fontWeight: "700" },
  subscribeBtnTextDisabled: { color: Colors.textMuted },

  // Restore Button
  restoreBtn: {
    alignItems: "center", paddingVertical: 14, marginTop: Spacing.sm,
  },
  restoreBtnText: { color: Colors.secondary, fontSize: FontSize.sm, fontWeight: "600" },

  // Legal Text
  legalText: {
    fontSize: 11, color: Colors.textMuted, textAlign: "center",
    marginTop: Spacing.sm, lineHeight: 16, paddingHorizontal: Spacing.md,
  },

  // Manage Tab
  statusCard: {
    backgroundColor: Colors.surfaceCard, borderRadius: BorderRadius.lg,
    padding: Spacing.md, marginBottom: Spacing.lg, borderWidth: 1, borderColor: Colors.border,
  },
  statusHeader: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 8 },
  statusTitle: { fontSize: FontSize.lg, fontWeight: "700", color: Colors.textPrimary },
  statusDetail: { fontSize: FontSize.sm, color: Colors.textSecondary, marginLeft: 38 },
  manageAction: {
    flexDirection: "row", alignItems: "center", gap: 12,
    backgroundColor: Colors.surfaceCard, borderRadius: BorderRadius.md,
    padding: Spacing.md, marginBottom: Spacing.sm,
  },
  manageActionInfo: { flex: 1 },
  manageActionTitle: { fontSize: FontSize.sm, fontWeight: "600", color: Colors.textPrimary },
  manageActionDesc: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 2 },
  infoCard: {
    flexDirection: "row", gap: 10, backgroundColor: Colors.surfaceCard,
    borderRadius: BorderRadius.md, padding: Spacing.md, marginTop: Spacing.md,
    borderWidth: 1, borderColor: Colors.border,
  },
  infoText: { flex: 1, fontSize: FontSize.xs, color: Colors.textSecondary, lineHeight: 18 },

  // Empty State
  emptyState: { alignItems: "center", paddingTop: 60, gap: 8 },
  emptyTitle: { fontSize: FontSize.md, fontWeight: "600", color: Colors.textPrimary },
  emptyDesc: { fontSize: FontSize.sm, color: Colors.textMuted, textAlign: "center" },

  // Invoice Cards
  invoiceCard: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    backgroundColor: Colors.surfaceCard, borderRadius: BorderRadius.md,
    padding: Spacing.md, marginBottom: Spacing.sm,
  },
  invoiceLeft: { gap: 2 },
  invoicePlan: { fontSize: FontSize.sm, fontWeight: "600", color: Colors.textPrimary },
  invoiceDate: { fontSize: FontSize.xs, color: Colors.textMuted },
  invoiceRight: { alignItems: "flex-end", gap: 4 },
  invoiceAmount: { fontSize: FontSize.sm, fontWeight: "700", color: Colors.textPrimary },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  statusPaid: { backgroundColor: Colors.success + "30" },
  statusPending: { backgroundColor: Colors.warning + "30" },
  statusFailed: { backgroundColor: Colors.error + "30" },
  statusText: { fontSize: 10, fontWeight: "600", color: Colors.textSecondary, textTransform: "capitalize" },
});
