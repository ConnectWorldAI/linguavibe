import React, { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Platform, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

const Colors = {
  primary: "#0A0E1A",
  surface: "#141825",
  surfaceElevated: "#1C2235",
  secondary: "#00AAFF",
  textPrimary: "#FFFFFF",
  textSecondary: "#8A9BB0",
  textMuted: "#5A6A7A",
  border: "rgba(255,255,255,0.06)",
  gold: "#FFD700",
  success: "#00E676",
  error: "#FF5252",
  warning: "#FF9F43",
  purple: "#8B5CF6",
  glowSubtle: "rgba(0,170,255,0.08)",
  glowBorder: "rgba(0,170,255,0.2)",
};

interface PlanFeature {
  text: string;
  included: boolean;
}

interface MembershipPlan {
  id: string;
  name: string;
  price: string;
  period: string;
  description: string;
  badge: string;
  badgeColor: string;
  popular?: boolean;
  features: PlanFeature[];
}

const PLANS: MembershipPlan[] = [
  {
    id: "free",
    name: "Free",
    price: "$0",
    period: "forever",
    description: "Get started with the basics",
    badge: "🆓",
    badgeColor: Colors.textMuted,
    features: [
      { text: "3 lessons per week", included: true },
      { text: "Basic flashcards (15 cards)", included: true },
      { text: "Pre-recorded class videos", included: true },
      { text: "Community forum access", included: true },
      { text: "Live class replays", included: false },
      { text: "AI class summaries", included: false },
      { text: "Unlimited flashcard decks", included: false },
      { text: "Pronunciation feedback", included: false },
      { text: "1-on-1 tutoring", included: false },
      { text: "Content translation", included: false },
      { text: "Certificate generation", included: false },
    ],
  },
  {
    id: "plus",
    name: "Plus",
    price: "$13.99",
    period: "/month",
    description: "Everything you need to learn fast",
    badge: "⭐",
    badgeColor: Colors.secondary,
    popular: true,
    features: [
      { text: "Unlimited lessons", included: true },
      { text: "Unlimited flashcard decks", included: true },
      { text: "All class replays included", included: true },
      { text: "AI class summaries", included: true },
      { text: "Advanced pronunciation AI", included: true },
      { text: "Content translation (all languages)", included: true },
      { text: "Priority support", included: true },
      { text: "Certificate generation", included: true },
      { text: "1-on-1 tutoring (2 sessions/mo)", included: true },
      { text: "Ad-free experience", included: true },
      { text: "Exclusive community channels", included: true },
    ],
  },
  {
    id: "pro",
    name: "Pro",
    price: "$27.99",
    period: "/month",
    description: "The ultimate language learning experience",
    badge: "💎",
    badgeColor: Colors.gold,
    features: [
      { text: "Everything in Pro", included: true },
      { text: "Unlimited 1-on-1 tutoring", included: true },
      { text: "Custom learning path AI", included: true },
      { text: "Live class priority seating", included: true },
      { text: "Offline download (all content)", included: true },
      { text: "White-glove onboarding", included: true },
      { text: "Early access to new features", included: true },
      { text: "Business language modules", included: true },
      { text: "Team/family sharing (up to 5)", included: true },
      { text: "Dedicated account manager", included: true },
      { text: "Custom certificate branding", included: true },
    ],
  },
];

const PAY_AS_YOU_GO = [
  { item: "Song Translation (full pipeline)", price: "$3.99" },
  { item: "Stem Separation", price: "$1.99" },
  { item: "HD Voice Synthesis", price: "$0.99" },
  { item: "AI Tutor Session (30 min)", price: "$4.99" },
  { item: "Voice Clone", price: "$2.99" },
  { item: "WaveLoud Full Pipeline", price: "$4.99" },
  { item: "Single class replay", price: "$2.99" },
  { item: "Certificate PDF", price: "$1.99" },
];

export default function MembershipScreen() {
  const router = useRouter();
  const [currentPlan] = useState("free");
  const [selectedPlan, setSelectedPlan] = useState("pro");

  const handleSubscribe = (planId: string) => {
    if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert(
      "Subscribe",
      `You selected the ${PLANS.find((p) => p.id === planId)?.name} plan.\n\nPayment processing would happen here via App Store / Google Play.`,
      [{ text: "OK" }]
    );
  };

  const handlePayAsYouGo = (item: string, price: string) => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Alert.alert("Purchase", `Buy "${item}" for ${price}?`, [
      { text: "Cancel", style: "cancel" },
      { text: "Buy", onPress: () => Alert.alert("Success", "Purchase complete!") },
    ]);
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Membership</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Current Plan */}
        <View style={styles.currentPlanBanner}>
          <Text style={styles.currentPlanLabel}>Current Plan</Text>
          <View style={styles.currentPlanRow}>
            <Text style={styles.currentPlanName}>Free Tier</Text>
            <View style={styles.currentPlanBadge}>
              <Text style={styles.currentPlanBadgeText}>ACTIVE</Text>
            </View>
          </View>
          <Text style={styles.currentPlanDesc}>Upgrade to unlock all features and accelerate your learning</Text>
        </View>

        {/* Plans */}
        {PLANS.map((plan) => (
          <TouchableOpacity
            key={plan.id}
            style={[
              styles.planCard,
              selectedPlan === plan.id && styles.planCardSelected,
              plan.popular && styles.planCardPopular,
            ]}
            onPress={() => setSelectedPlan(plan.id)}
            activeOpacity={0.8}
          >
            {plan.popular && (
              <View style={styles.popularBadge}>
                <Ionicons name="star" size={10} color="#FFFFFF" />
                <Text style={styles.popularBadgeText}>MOST POPULAR</Text>
              </View>
            )}

            <View style={styles.planHeader}>
              <View style={styles.planNameRow}>
                <Text style={styles.planBadge}>{plan.badge}</Text>
                <Text style={[styles.planName, { color: plan.badgeColor }]}>{plan.name}</Text>
              </View>
              <View style={styles.planPriceRow}>
                <Text style={styles.planPrice}>{plan.price}</Text>
                <Text style={styles.planPeriod}>{plan.period}</Text>
              </View>
            </View>

            <Text style={styles.planDesc}>{plan.description}</Text>

            <View style={styles.planFeatures}>
              {plan.features.map((feature, idx) => (
                <View key={idx} style={styles.featureRow}>
                  <Ionicons
                    name={feature.included ? "checkmark-circle" : "close-circle"}
                    size={14}
                    color={feature.included ? Colors.success : Colors.textMuted}
                  />
                  <Text style={[styles.featureText, !feature.included && styles.featureTextDisabled]}>
                    {feature.text}
                  </Text>
                </View>
              ))}
            </View>

            {plan.id !== "free" && (
              <TouchableOpacity
                style={[styles.subscribeBtn, plan.id === "premium" && styles.subscribeBtnPremium]}
                onPress={() => handleSubscribe(plan.id)}
              >
                <Text style={styles.subscribeBtnText}>
                  {currentPlan === plan.id ? "Current Plan" : `Subscribe to ${plan.name}`}
                </Text>
              </TouchableOpacity>
            )}
          </TouchableOpacity>
        ))}

        {/* Pay As You Go */}
        <View style={styles.paygoSection}>
          <Text style={styles.paygoTitle}>Pay As You Go</Text>
          <Text style={styles.paygoDesc}>Don't want a subscription? Buy individual features</Text>
          {PAY_AS_YOU_GO.map((item) => (
            <View key={item.item} style={styles.paygoRow}>
              <Text style={styles.paygoItem}>{item.item}</Text>
              <TouchableOpacity style={styles.paygoBtn} onPress={() => handlePayAsYouGo(item.item, item.price)}>
                <Text style={styles.paygoBtnText}>{item.price}</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>

        {/* FAQ */}
        <View style={styles.faqSection}>
          <Text style={styles.faqTitle}>Frequently Asked</Text>
          {[
            { q: "Can I cancel anytime?", a: "Yes, cancel anytime. No commitments." },
            { q: "Do credits roll over?", a: "Pay-as-you-go credits never expire." },
            { q: "Family sharing?", a: "Premium plan includes sharing for up to 5 members." },
          ].map((faq) => (
            <View key={faq.q} style={styles.faqItem}>
              <Text style={styles.faqQuestion}>{faq.q}</Text>
              <Text style={styles.faqAnswer}>{faq.a}</Text>
            </View>
          ))}
        </View>
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
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.surface, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 18, fontWeight: "800", color: Colors.textPrimary },
  currentPlanBanner: {
    marginHorizontal: 16,
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 20,
  },
  currentPlanLabel: { fontSize: 11, fontWeight: "600", color: Colors.textMuted, textTransform: "uppercase", marginBottom: 6 },
  currentPlanRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 6 },
  currentPlanName: { fontSize: 18, fontWeight: "800", color: Colors.textPrimary },
  currentPlanBadge: { backgroundColor: "rgba(0,230,118,0.15)", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  currentPlanBadgeText: { fontSize: 9, fontWeight: "800", color: Colors.success },
  currentPlanDesc: { fontSize: 12, color: Colors.textSecondary, lineHeight: 18 },
  planCard: {
    marginHorizontal: 16,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1.5,
    borderColor: Colors.border,
    marginBottom: 14,
    position: "relative",
    overflow: "hidden",
  },
  planCardSelected: { borderColor: Colors.secondary },
  planCardPopular: { borderColor: Colors.secondary, backgroundColor: Colors.glowSubtle },
  popularBadge: {
    position: "absolute",
    top: 0,
    right: 0,
    flexDirection: "row",
    gap: 4,
    backgroundColor: Colors.secondary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderBottomLeftRadius: 10,
    alignItems: "center",
  },
  popularBadgeText: { fontSize: 9, fontWeight: "800", color: "#FFFFFF" },
  planHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  planNameRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  planBadge: { fontSize: 20 },
  planName: { fontSize: 18, fontWeight: "900" },
  planPriceRow: { flexDirection: "row", alignItems: "baseline", gap: 2 },
  planPrice: { fontSize: 22, fontWeight: "900", color: Colors.textPrimary },
  planPeriod: { fontSize: 12, color: Colors.textMuted },
  planDesc: { fontSize: 12, color: Colors.textSecondary, marginBottom: 14 },
  planFeatures: { gap: 6, marginBottom: 14 },
  featureRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  featureText: { fontSize: 12, color: Colors.textPrimary, fontWeight: "500" },
  featureTextDisabled: { color: Colors.textMuted, textDecorationLine: "line-through" },
  subscribeBtn: {
    backgroundColor: Colors.secondary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  subscribeBtnPremium: { backgroundColor: Colors.gold },
  subscribeBtnText: { fontSize: 14, fontWeight: "800", color: "#FFFFFF" },
  paygoSection: {
    marginHorizontal: 16,
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 16,
  },
  paygoTitle: { fontSize: 16, fontWeight: "800", color: Colors.textPrimary, marginBottom: 4 },
  paygoDesc: { fontSize: 12, color: Colors.textMuted, marginBottom: 14 },
  paygoRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: Colors.border },
  paygoItem: { fontSize: 13, color: Colors.textSecondary, fontWeight: "500" },
  paygoBtn: { backgroundColor: Colors.surfaceElevated, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: Colors.border },
  paygoBtnText: { fontSize: 12, fontWeight: "700", color: Colors.secondary },
  faqSection: {
    marginHorizontal: 16,
    marginBottom: 20,
  },
  faqTitle: { fontSize: 16, fontWeight: "800", color: Colors.textPrimary, marginBottom: 12 },
  faqItem: { marginBottom: 12 },
  faqQuestion: { fontSize: 13, fontWeight: "700", color: Colors.textPrimary, marginBottom: 4 },
  faqAnswer: { fontSize: 12, color: Colors.textSecondary, lineHeight: 18 },
});
