import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Animated,
  Platform,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import * as Haptics from "expo-haptics";
import { Alert } from "react-native";
import {
  getAvailablePackages,
  purchasePackage,
  restorePurchases,
  type AvailablePackage,
  type PlanId,
} from "@/lib/revenuecat";

// ─── Plan Data ───────────────────────────────────────────────────────────────

const PLANS = [
  {
    id: "free",
    name: "Free",
    price: 0,
    period: "",
    features: ["5 lessons/week", "Basic translator", "1 language", "Ads included"],
    popular: false,
  },
  {
    id: "plus",
    name: "Plus",
    price: 14.99,
    period: "/mo",
    features: ["Unlimited lessons", "50+ languages", "Voice calls", "No ads", "Offline mode"],
    popular: true,
    savings: "Most Popular",
  },
  {
    id: "pro",
    name: "Pro",
    price: 29.99,
    period: "/mo",
    features: ["Everything in Plus", "AI Coach Mode", "Creator Studio", "Priority support", "Family sharing (5)"],
    popular: false,
    savings: "Best Value",
  },
  {
    id: "lifetime",
    name: "Lifetime",
    price: 499.99,
    period: " one-time",
    features: ["All Pro features forever", "No recurring charges", "Early access to new features", "VIP community"],
    popular: false,
    savings: "Pay Once",
  },
];

const STEPS = [
  { id: 1, title: "Plan", icon: "📋" },
  { id: 2, title: "Billing", icon: "📧" },
  { id: 3, title: "Payment", icon: "💳" },
  { id: 4, title: "Confirm", icon: "✅" },
];

// ─── Types ───────────────────────────────────────────────────────────────────

interface CheckoutData {
  planId: string;
  name: string;
  email: string;
  country: string;
  promoCode: string;
  promoApplied: boolean;
  paymentMethod: "card" | "apple_pay" | "google_pay" | null;
  cardNumber: string;
  cardExpiry: string;
  cardCvc: string;
  agreedToTerms: boolean;
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function CheckoutScreen() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [showSuccess, setShowSuccess] = useState(false);
  const successScale = useRef(new Animated.Value(0)).current;
  const confettiOpacity = useRef(new Animated.Value(0)).current;

  const [data, setData] = useState<CheckoutData>({
    planId: "plus",
    name: "",
    email: "",
    country: "",
    promoCode: "",
    promoApplied: false,
    paymentMethod: null,
    cardNumber: "",
    cardExpiry: "",
    cardCvc: "",
    agreedToTerms: false,
  });

  const updateField = (field: keyof CheckoutData, value: any) => {
    setData((prev) => ({ ...prev, [field]: value }));
  };

  const selectedPlan = PLANS.find((p) => p.id === data.planId) || PLANS[1];
  const discount = data.promoApplied ? 0.2 : 0;
  const finalPrice = selectedPlan.price * (1 - discount);

  // ─── Validation ──────────────────────────────────────────────────────────

  const validateStep = (s: number): boolean => {
    switch (s) {
      case 1:
        return !!data.planId && data.planId !== "free";
      case 2:
        return data.name.length >= 2 && data.email.includes("@") && data.country.length >= 2;
      case 3:
        if (data.paymentMethod === "apple_pay" || data.paymentMethod === "google_pay") return true;
        return (
          data.paymentMethod === "card" &&
          data.cardNumber.replace(/\s/g, "").length === 16 &&
          data.cardExpiry.length === 5 &&
          data.cardCvc.length >= 3
        );
      case 4:
        return data.agreedToTerms;
      default:
        return false;
    }
  };

  const canAdvance = validateStep(step);
  const canGoBack = step > 1;
  const isLastStep = step === STEPS.length;

  const next = () => {
    if (canAdvance) {
      if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setStep((s) => s + 1);
    }
  };

  const back = () => {
    if (canGoBack) setStep((s) => s - 1);
  };

  const [purchasing, setPurchasing] = useState(false);
  const [packages, setPackages] = useState<AvailablePackage[]>([]);

  // Load RevenueCat packages on mount
  useEffect(() => {
    getAvailablePackages().then(setPackages).catch(() => {});
  }, []);

  const submit = async () => {
    if (!canAdvance || purchasing) return;
    setPurchasing(true);

    try {
      // Find the matching RevenueCat package for the selected plan
      const matchingPkg = packages.find(
        (pkg) => pkg.planId === data.planId && pkg.billingCycle === "monthly"
      ) || packages.find((pkg) => pkg.planId === data.planId);

      if (matchingPkg) {
        // Use RevenueCat native purchase flow
        const result = await purchasePackage(matchingPkg);

        if (!result.success) {
          if (result.errorCode === "cancelled") {
            setPurchasing(false);
            return; // User cancelled — don't show error
          }
          Alert.alert("Purchase Failed", result.error || "Something went wrong. Please try again.");
          setPurchasing(false);
          return;
        }
      } else {
        // Fallback: store locally (web or no packages available)
        const AsyncStorage = (await import("@react-native-async-storage/async-storage")).default;
        await AsyncStorage.setItem("@subscription_plan", data.planId);
        await AsyncStorage.setItem("@subscription_date", new Date().toISOString());
      }

      // Purchase succeeded
      if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setShowSuccess(true);
      Animated.parallel([
        Animated.spring(successScale, { toValue: 1, useNativeDriver: true, damping: 12 }),
        Animated.timing(confettiOpacity, { toValue: 1, duration: 600, useNativeDriver: true }),
      ]).start();
    } catch (error: any) {
      Alert.alert("Error", error?.message || "Purchase failed. Please try again.");
    } finally {
      setPurchasing(false);
    }
  };

  const handleRestore = async () => {
    try {
      const status = await restorePurchases();
      if (status.plan !== "free") {
        Alert.alert("Restored!", `Your ${status.plan} subscription has been restored.`);
        router.replace("/(tabs)");
      } else {
        Alert.alert("No Purchases Found", "We couldn't find any previous purchases to restore.");
      }
    } catch {
      Alert.alert("Error", "Failed to restore purchases. Please try again.");
    }
  };

  const applyPromo = () => {
    if (data.promoCode.toLowerCase() === "connect20") {
      updateField("promoApplied", true);
      if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  // ─── Success Screen ──────────────────────────────────────────────────────

  if (showSuccess) {
    return (
      <ScreenContainer edges={["top", "bottom", "left", "right"]}>
        <View style={styles.successContainer}>
          <Animated.View style={[styles.confettiLayer, { opacity: confettiOpacity }]}>
            {["🎉", "✨", "🎊", "⭐", "💫", "🌟"].map((emoji, i) => (
              <Text
                key={i}
                style={[
                  styles.confettiEmoji,
                  { top: `${10 + Math.random() * 60}%`, left: `${5 + Math.random() * 85}%` },
                ]}
              >
                {emoji}
              </Text>
            ))}
          </Animated.View>

          <Animated.View style={[styles.successCard, { transform: [{ scale: successScale }] }]}>
            <Text style={styles.successIcon}>🎉</Text>
            <Text style={styles.successTitle}>Welcome to {selectedPlan.name}!</Text>
            <Text style={styles.successSubtitle}>
              Your subscription is now active. Start exploring all your new features.
            </Text>

            <View style={styles.successDetails}>
              <View style={styles.successRow}>
                <Text style={styles.successLabel}>Plan</Text>
                <Text style={styles.successValue}>{selectedPlan.name}</Text>
              </View>
              <View style={styles.successRow}>
                <Text style={styles.successLabel}>Amount Charged</Text>
                <Text style={styles.successValue}>${finalPrice.toFixed(2)}</Text>
              </View>
              <View style={styles.successRow}>
                <Text style={styles.successLabel}>Order ID</Text>
                <Text style={styles.successValue}>#CM-{Date.now().toString(36).toUpperCase()}</Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.successBtn}
              onPress={() => router.replace("/(tabs)")}
            >
              <Text style={styles.successBtnText}>Start Learning</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </ScreenContainer>
    );
  }

  // ─── Step Renderers ──────────────────────────────────────────────────────

  const renderPlanSelection = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Choose Your Plan</Text>
      <Text style={styles.stepSubtitle}>Unlock your full language learning potential</Text>

      {PLANS.filter((p) => p.id !== "free").map((plan) => (
        <TouchableOpacity
          key={plan.id}
          style={[styles.planCard, data.planId === plan.id && styles.planCardSelected]}
          onPress={() => {
            updateField("planId", plan.id);
            if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }}
        >
          {plan.savings && (
            <View style={styles.planBadge}>
              <Text style={styles.planBadgeText}>{plan.savings}</Text>
            </View>
          )}
          <View style={styles.planHeader}>
            <Text style={styles.planName}>{plan.name}</Text>
            <View style={styles.planPriceRow}>
              <Text style={styles.planPrice}>${plan.price.toFixed(2)}</Text>
              <Text style={styles.planPeriod}>{plan.period}</Text>
            </View>
          </View>
          <View style={styles.planFeatures}>
            {plan.features.map((f, i) => (
              <Text key={i} style={styles.planFeature}>
                ✓ {f}
              </Text>
            ))}
          </View>
          {data.planId === plan.id && (
            <View style={styles.planCheckmark}>
              <Text style={styles.planCheckmarkText}>●</Text>
            </View>
          )}
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderBillingInfo = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Billing Information</Text>
      <Text style={styles.stepSubtitle}>We'll send your receipt here</Text>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Full Name</Text>
        <TextInput
          style={styles.input}
          value={data.name}
          onChangeText={(v) => updateField("name", v)}
          placeholder="John Doe"
          placeholderTextColor="#555"
          autoCapitalize="words"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Email Address</Text>
        <TextInput
          style={styles.input}
          value={data.email}
          onChangeText={(v) => updateField("email", v)}
          placeholder="john@example.com"
          placeholderTextColor="#555"
          keyboardType="email-address"
          autoCapitalize="none"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Country</Text>
        <TextInput
          style={styles.input}
          value={data.country}
          onChangeText={(v) => updateField("country", v)}
          placeholder="United States"
          placeholderTextColor="#555"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Promo Code (optional)</Text>
        <View style={styles.promoRow}>
          <TextInput
            style={[styles.input, styles.promoInput]}
            value={data.promoCode}
            onChangeText={(v) => updateField("promoCode", v)}
            placeholder="Enter code"
            placeholderTextColor="#555"
            autoCapitalize="none"
          />
          <TouchableOpacity
            style={[styles.promoBtn, data.promoApplied && styles.promoBtnApplied]}
            onPress={applyPromo}
            disabled={data.promoApplied}
          >
            <Text style={styles.promoBtnText}>{data.promoApplied ? "Applied ✓" : "Apply"}</Text>
          </TouchableOpacity>
        </View>
        {data.promoApplied && (
          <Text style={styles.promoSuccess}>20% discount applied!</Text>
        )}
      </View>
    </View>
  );

  const renderPaymentMethod = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Payment Method</Text>
      <Text style={styles.stepSubtitle}>Choose how you'd like to pay</Text>

      {/* Quick pay options */}
      <View style={styles.quickPayRow}>
        <TouchableOpacity
          style={[styles.quickPayBtn, data.paymentMethod === "apple_pay" && styles.quickPaySelected]}
          onPress={() => updateField("paymentMethod", "apple_pay")}
        >
          <Text style={styles.quickPayIcon}>🍎</Text>
          <Text style={styles.quickPayText}>Apple Pay</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.quickPayBtn, data.paymentMethod === "google_pay" && styles.quickPaySelected]}
          onPress={() => updateField("paymentMethod", "google_pay")}
        >
          <Text style={styles.quickPayIcon}>G</Text>
          <Text style={styles.quickPayText}>Google Pay</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.dividerRow}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>or pay with card</Text>
        <View style={styles.dividerLine} />
      </View>

      {/* Card input */}
      <TouchableOpacity
        style={[styles.cardOption, data.paymentMethod === "card" && styles.cardOptionSelected]}
        onPress={() => updateField("paymentMethod", "card")}
      >
        <Text style={styles.cardOptionIcon}>💳</Text>
        <Text style={styles.cardOptionText}>Credit / Debit Card</Text>
      </TouchableOpacity>

      {data.paymentMethod === "card" && (
        <View style={styles.cardForm}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Card Number</Text>
            <TextInput
              style={styles.input}
              value={data.cardNumber}
              onChangeText={(v) => {
                const cleaned = v.replace(/\D/g, "").slice(0, 16);
                const formatted = cleaned.replace(/(.{4})/g, "$1 ").trim();
                updateField("cardNumber", formatted);
              }}
              placeholder="1234 5678 9012 3456"
              placeholderTextColor="#555"
              keyboardType="number-pad"
              maxLength={19}
            />
          </View>

          <View style={styles.cardRow}>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.inputLabel}>Expiry</Text>
              <TextInput
                style={styles.input}
                value={data.cardExpiry}
                onChangeText={(v) => {
                  let cleaned = v.replace(/\D/g, "").slice(0, 4);
                  if (cleaned.length > 2) cleaned = cleaned.slice(0, 2) + "/" + cleaned.slice(2);
                  updateField("cardExpiry", cleaned);
                }}
                placeholder="MM/YY"
                placeholderTextColor="#555"
                keyboardType="number-pad"
                maxLength={5}
              />
            </View>
            <View style={{ width: 16 }} />
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.inputLabel}>CVC</Text>
              <TextInput
                style={styles.input}
                value={data.cardCvc}
                onChangeText={(v) => updateField("cardCvc", v.replace(/\D/g, "").slice(0, 4))}
                placeholder="123"
                placeholderTextColor="#555"
                keyboardType="number-pad"
                maxLength={4}
                secureTextEntry
              />
            </View>
          </View>
        </View>
      )}

      <View style={styles.securityNote}>
        <Text style={styles.securityIcon}>🔒</Text>
        <Text style={styles.securityText}>
          Your payment info is encrypted and secure. We never store your full card number.
        </Text>
      </View>
    </View>
  );

  const renderConfirmation = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Review & Confirm</Text>
      <Text style={styles.stepSubtitle}>Double-check everything before subscribing</Text>

      <View style={styles.summaryCard}>
        <View style={styles.summarySection}>
          <Text style={styles.summaryLabel}>Plan</Text>
          <View style={styles.summaryValueRow}>
            <Text style={styles.summaryValue}>{selectedPlan.name}</Text>
            <TouchableOpacity onPress={() => setStep(1)}>
              <Text style={styles.editLink}>Edit</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.summaryDivider} />

        <View style={styles.summarySection}>
          <Text style={styles.summaryLabel}>Billing To</Text>
          <View style={styles.summaryValueRow}>
            <View>
              <Text style={styles.summaryValue}>{data.name}</Text>
              <Text style={styles.summaryMeta}>{data.email}</Text>
            </View>
            <TouchableOpacity onPress={() => setStep(2)}>
              <Text style={styles.editLink}>Edit</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.summaryDivider} />

        <View style={styles.summarySection}>
          <Text style={styles.summaryLabel}>Payment</Text>
          <View style={styles.summaryValueRow}>
            <Text style={styles.summaryValue}>
              {data.paymentMethod === "apple_pay"
                ? "Apple Pay"
                : data.paymentMethod === "google_pay"
                ? "Google Pay"
                : `•••• ${data.cardNumber.slice(-4)}`}
            </Text>
            <TouchableOpacity onPress={() => setStep(3)}>
              <Text style={styles.editLink}>Edit</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.summaryDivider} />

        <View style={styles.summarySection}>
          <Text style={styles.summaryLabel}>Price Breakdown</Text>
          <View style={styles.priceBreakdown}>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>{selectedPlan.name} plan</Text>
              <Text style={styles.priceValue}>${selectedPlan.price.toFixed(2)}</Text>
            </View>
            {data.promoApplied && (
              <View style={styles.priceRow}>
                <Text style={[styles.priceLabel, { color: "#4ADE80" }]}>Promo (CONNECT20)</Text>
                <Text style={[styles.priceValue, { color: "#4ADE80" }]}>
                  -${(selectedPlan.price * 0.2).toFixed(2)}
                </Text>
              </View>
            )}
            <View style={[styles.priceRow, styles.priceTotalRow]}>
              <Text style={styles.priceTotalLabel}>Total</Text>
              <Text style={styles.priceTotalValue}>${finalPrice.toFixed(2)}{selectedPlan.period}</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Terms checkbox */}
      <TouchableOpacity
        style={styles.termsRow}
        onPress={() => updateField("agreedToTerms", !data.agreedToTerms)}
      >
        <View style={[styles.checkbox, data.agreedToTerms && styles.checkboxChecked]}>
          {data.agreedToTerms && <Text style={styles.checkboxMark}>✓</Text>}
        </View>
        <Text style={styles.termsText}>
          I agree to the Terms of Service and Privacy Policy. I understand I can cancel anytime.
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderStep = () => {
    switch (step) {
      case 1: return renderPlanSelection();
      case 2: return renderBillingInfo();
      case 3: return renderPaymentMethod();
      case 4: return renderConfirmation();
      default: return null;
    }
  };

  // ─── Main Render ─────────────────────────────────────────────────────────

  return (
    <ScreenContainer edges={["top", "bottom", "left", "right"]}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
            <Text style={styles.closeBtnText}>✕</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Checkout</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Progress Bar */}
        <View style={styles.progressBar}>
          {STEPS.map((s, i) => (
            <React.Fragment key={s.id}>
              <View style={styles.progressStep}>
                <View
                  style={[
                    styles.stepDot,
                    step > s.id && styles.stepCompleted,
                    step === s.id && styles.stepActive,
                  ]}
                >
                  {step > s.id ? (
                    <Text style={styles.stepDotText}>✓</Text>
                  ) : (
                    <Text style={[styles.stepDotText, step === s.id && styles.stepDotTextActive]}>
                      {s.icon}
                    </Text>
                  )}
                </View>
                <Text style={[styles.stepLabel, step >= s.id && styles.stepLabelActive]}>
                  {s.title}
                </Text>
              </View>
              {i < STEPS.length - 1 && (
                <View style={[styles.stepLine, step > s.id && styles.stepLineCompleted]} />
              )}
            </React.Fragment>
          ))}
        </View>

        {/* Step Content */}
        <ScrollView
          style={styles.scrollContent}
          contentContainerStyle={styles.scrollInner}
          showsVerticalScrollIndicator={false}
        >
          {renderStep()}
        </ScrollView>

        {/* Sticky Price Summary + Navigation */}
        <View style={styles.stickyFooter}>
          {/* Price summary bar */}
          <View style={styles.priceSummaryBar}>
            <View>
              <Text style={styles.priceSummaryPlan}>{selectedPlan.name} Plan</Text>
              {data.promoApplied && (
                <Text style={styles.priceSummarySavings}>20% off applied</Text>
              )}
            </View>
            <View style={styles.priceSummaryRight}>
              {data.promoApplied && (
                <Text style={styles.priceSummaryOriginal}>${selectedPlan.price.toFixed(2)}</Text>
              )}
              <Text style={styles.priceSummaryTotal}>${finalPrice.toFixed(2)}</Text>
              <Text style={styles.priceSummaryPeriod}>{selectedPlan.period}</Text>
            </View>
          </View>

          {/* Navigation buttons */}
          <View style={styles.navRow}>
            {canGoBack ? (
              <TouchableOpacity onPress={back} style={styles.backBtn}>
                <Text style={styles.backBtnText}>← Back</Text>
              </TouchableOpacity>
            ) : (
              <View />
            )}
            <TouchableOpacity
              onPress={isLastStep ? submit : next}
              style={[styles.nextBtn, (!canAdvance || purchasing) && styles.nextBtnDisabled]}
              disabled={!canAdvance || purchasing}
            >
              <Text style={styles.nextBtnText}>
                {purchasing ? "Processing..." : isLastStep ? `Pay $${finalPrice.toFixed(2)}` : "Continue →"}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Restore purchases link */}
          <TouchableOpacity onPress={handleRestore} style={styles.restoreBtn}>
            <Text style={styles.restoreBtnText}>Restore Previous Purchases</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScreenContainer>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0a0a1a" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  closeBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  closeBtnText: { fontSize: 20, color: "#fff" },
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#fff" },

  // Progress bar
  progressBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  progressStep: { alignItems: "center", gap: 4 },
  stepDot: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#1a1a2e",
    borderWidth: 2,
    borderColor: "#333",
    alignItems: "center",
    justifyContent: "center",
  },
  stepCompleted: { backgroundColor: "#4ADE80", borderColor: "#4ADE80" },
  stepActive: { borderColor: "#FFD700", backgroundColor: "#1a1a2e" },
  stepDotText: { fontSize: 14, color: "#666" },
  stepDotTextActive: { color: "#FFD700" },
  stepLabel: { fontSize: 10, color: "#555", fontWeight: "600" },
  stepLabelActive: { color: "#ccc" },
  stepLine: { flex: 1, height: 2, backgroundColor: "#333", marginHorizontal: 4, marginBottom: 16 },
  stepLineCompleted: { backgroundColor: "#4ADE80" },

  // Content
  scrollContent: { flex: 1 },
  scrollInner: { paddingHorizontal: 20, paddingBottom: 20 },
  stepContent: { gap: 16 },
  stepTitle: { fontSize: 24, fontWeight: "800", color: "#fff" },
  stepSubtitle: { fontSize: 14, color: "#888", marginBottom: 8 },

  // Plan cards
  planCard: {
    backgroundColor: "#1a1a2e",
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: "#2a2a3e",
    position: "relative",
  },
  planCardSelected: { borderColor: "#FFD700" },
  planBadge: {
    position: "absolute",
    top: -10,
    right: 16,
    backgroundColor: "#FFD700",
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
  },
  planBadgeText: { fontSize: 10, fontWeight: "800", color: "#000" },
  planHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  planName: { fontSize: 20, fontWeight: "700", color: "#fff" },
  planPriceRow: { flexDirection: "row", alignItems: "baseline" },
  planPrice: { fontSize: 24, fontWeight: "800", color: "#FFD700" },
  planPeriod: { fontSize: 12, color: "#888", marginLeft: 2 },
  planFeatures: { gap: 6 },
  planFeature: { fontSize: 13, color: "#aaa" },
  planCheckmark: { position: "absolute", top: 16, left: 16 },
  planCheckmarkText: { fontSize: 16, color: "#FFD700" },

  // Inputs
  inputGroup: { gap: 6 },
  inputLabel: { fontSize: 13, fontWeight: "600", color: "#aaa" },
  input: {
    backgroundColor: "#1a1a2e",
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: "#fff",
    borderWidth: 1,
    borderColor: "#2a2a3e",
  },
  promoRow: { flexDirection: "row", gap: 8 },
  promoInput: { flex: 1 },
  promoBtn: {
    backgroundColor: "#2a2a3e",
    paddingHorizontal: 16,
    borderRadius: 12,
    justifyContent: "center",
  },
  promoBtnApplied: { backgroundColor: "#166534" },
  promoBtnText: { fontSize: 14, fontWeight: "600", color: "#fff" },
  promoSuccess: { fontSize: 12, color: "#4ADE80", marginTop: 4 },

  // Payment methods
  quickPayRow: { flexDirection: "row", gap: 12 },
  quickPayBtn: {
    flex: 1,
    backgroundColor: "#1a1a2e",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    gap: 6,
    borderWidth: 2,
    borderColor: "#2a2a3e",
  },
  quickPaySelected: { borderColor: "#FFD700" },
  quickPayIcon: { fontSize: 24 },
  quickPayText: { fontSize: 13, fontWeight: "600", color: "#fff" },
  dividerRow: { flexDirection: "row", alignItems: "center", gap: 12, marginVertical: 8 },
  dividerLine: { flex: 1, height: 1, backgroundColor: "#333" },
  dividerText: { fontSize: 12, color: "#666" },
  cardOption: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1a1a2e",
    borderRadius: 12,
    padding: 16,
    gap: 12,
    borderWidth: 2,
    borderColor: "#2a2a3e",
  },
  cardOptionSelected: { borderColor: "#FFD700" },
  cardOptionIcon: { fontSize: 24 },
  cardOptionText: { fontSize: 15, fontWeight: "600", color: "#fff" },
  cardForm: { gap: 12, marginTop: 8 },
  cardRow: { flexDirection: "row" },
  securityNote: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#1a1a2e",
    borderRadius: 10,
    padding: 12,
    marginTop: 8,
  },
  securityIcon: { fontSize: 16 },
  securityText: { fontSize: 12, color: "#888", flex: 1 },

  // Confirmation
  summaryCard: {
    backgroundColor: "#1a1a2e",
    borderRadius: 16,
    padding: 20,
  },
  summarySection: { gap: 6 },
  summaryLabel: { fontSize: 11, fontWeight: "700", color: "#666", textTransform: "uppercase", letterSpacing: 1 },
  summaryValueRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  summaryValue: { fontSize: 15, fontWeight: "600", color: "#fff" },
  summaryMeta: { fontSize: 12, color: "#888", marginTop: 2 },
  editLink: { fontSize: 13, color: "#FFD700", fontWeight: "600" },
  summaryDivider: { height: 1, backgroundColor: "#2a2a3e", marginVertical: 14 },
  priceBreakdown: { gap: 8, marginTop: 8 },
  priceRow: { flexDirection: "row", justifyContent: "space-between" },
  priceLabel: { fontSize: 14, color: "#aaa" },
  priceValue: { fontSize: 14, color: "#aaa" },
  priceTotalRow: { borderTopWidth: 1, borderTopColor: "#2a2a3e", paddingTop: 8, marginTop: 4 },
  priceTotalLabel: { fontSize: 16, fontWeight: "700", color: "#fff" },
  priceTotalValue: { fontSize: 16, fontWeight: "700", color: "#FFD700" },
  termsRow: { flexDirection: "row", alignItems: "flex-start", gap: 12, marginTop: 8 },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "#444",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  checkboxChecked: { backgroundColor: "#FFD700", borderColor: "#FFD700" },
  checkboxMark: { fontSize: 14, color: "#000", fontWeight: "800" },
  termsText: { fontSize: 13, color: "#888", flex: 1, lineHeight: 18 },

  // Sticky footer
  stickyFooter: {
    borderTopWidth: 1,
    borderTopColor: "#1a1a2e",
    backgroundColor: "#0a0a1a",
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: Platform.OS === "web" ? 20 : 8,
  },
  priceSummaryBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#1a1a2e",
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
  },
  priceSummaryPlan: { fontSize: 14, fontWeight: "600", color: "#fff" },
  priceSummarySavings: { fontSize: 11, color: "#4ADE80", marginTop: 2 },
  priceSummaryRight: { flexDirection: "row", alignItems: "baseline", gap: 4 },
  priceSummaryOriginal: {
    fontSize: 13,
    color: "#666",
    textDecorationLine: "line-through",
  },
  priceSummaryTotal: { fontSize: 20, fontWeight: "800", color: "#FFD700" },
  priceSummaryPeriod: { fontSize: 11, color: "#888" },
  navRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  backBtn: { paddingVertical: 14, paddingHorizontal: 16 },
  backBtnText: { fontSize: 15, color: "#aaa", fontWeight: "600" },
  nextBtn: {
    backgroundColor: "#FFD700",
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 14,
    minWidth: 160,
    alignItems: "center",
  },
  nextBtnDisabled: { opacity: 0.4 },
  nextBtnText: { fontSize: 16, fontWeight: "700", color: "#000" },

  // Success
  successContainer: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  confettiLayer: { ...StyleSheet.absoluteFillObject },
  confettiEmoji: { position: "absolute", fontSize: 32 },
  successCard: { backgroundColor: "#1a1a2e", borderRadius: 24, padding: 32, alignItems: "center", width: "100%", maxWidth: 360 },
  successIcon: { fontSize: 64, marginBottom: 16 },
  successTitle: { fontSize: 24, fontWeight: "800", color: "#fff", textAlign: "center" },
  successSubtitle: { fontSize: 14, color: "#888", textAlign: "center", marginTop: 8, marginBottom: 24 },
  successDetails: { width: "100%", gap: 12, marginBottom: 24 },
  successRow: { flexDirection: "row", justifyContent: "space-between" },
  successLabel: { fontSize: 13, color: "#888" },
  successValue: { fontSize: 13, fontWeight: "600", color: "#fff" },
  successBtn: { backgroundColor: "#FFD700", paddingVertical: 16, paddingHorizontal: 40, borderRadius: 14 },
  successBtnText: { fontSize: 16, fontWeight: "700", color: "#000" },
  restoreBtn: { alignItems: "center", paddingVertical: 10 },
  restoreBtnText: { fontSize: 12, color: "#888", textDecorationLine: "underline" },
});
