import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import * as Haptics from "expo-haptics";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Colors, Spacing, BorderRadius, FontSize } from "../constants/Colors";

type PaymentStep = "method" | "details" | "processing" | "confirmation";

const PLANS = {
  pro: { name: "Pro", price: "$9.99/mo", features: ["Unlimited replays", "AI summaries", "Priority support"] },
  premium: { name: "Premium", price: "$19.99/mo", features: ["Everything in Pro", "1-on-1 tutoring", "Certificate generation", "Family sharing"] },
  replay: { name: "Class Replay", price: "$2.99", features: ["One-time access to missed class recording"] },
  summary: { name: "AI Summary", price: "$0.99", features: ["AI-generated class summary with key points"] },
  tutoring: { name: "Tutoring Session", price: "$14.99", features: ["30-min 1-on-1 session with instructor"] },
};

export default function PaymentFlowScreen() {
  const params = useLocalSearchParams<{ plan?: string }>();
  const planKey = (params.plan || "pro") as keyof typeof PLANS;
  const plan = PLANS[planKey] || PLANS.pro;

  const [step, setStep] = useState<PaymentStep>("method");
  const [paymentMethod, setPaymentMethod] = useState<"card" | "apple" | "google" | null>(null);
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvc, setCvc] = useState("");
  const [cardName, setCardName] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSelectMethod = (method: "card" | "apple" | "google") => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setPaymentMethod(method);
    if (method === "apple" || method === "google") {
      processPayment();
    } else {
      setStep("details");
    }
  };

  const processPayment = async () => {
    setStep("processing");
    setLoading(true);
    // Simulate payment processing
    await new Promise((r) => setTimeout(r, 2500));
    // Save subscription state
    await AsyncStorage.setItem("@subscription_plan", planKey);
    await AsyncStorage.setItem("@subscription_date", new Date().toISOString());
    setLoading(false);
    setStep("confirmation");
    if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleSubmitCard = () => {
    if (!cardNumber.trim() || !expiry.trim() || !cvc.trim() || !cardName.trim()) {
      Alert.alert("Missing Info", "Please fill in all card details.");
      return;
    }
    processPayment();
  };

  const formatCardNumber = (text: string) => {
    const cleaned = text.replace(/\D/g, "").slice(0, 16);
    return cleaned.replace(/(.{4})/g, "$1 ").trim();
  };

  const formatExpiry = (text: string) => {
    const cleaned = text.replace(/\D/g, "").slice(0, 4);
    if (cleaned.length >= 3) return `${cleaned.slice(0, 2)}/${cleaned.slice(2)}`;
    return cleaned;
  };

  const renderMethodSelection = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Choose Payment Method</Text>

      <View style={styles.planSummary}>
        <View style={styles.planSummaryLeft}>
          <Ionicons name="diamond" size={20} color={Colors.gold} />
          <View>
            <Text style={styles.planName}>{plan.name}</Text>
            <Text style={styles.planPrice}>{plan.price}</Text>
          </View>
        </View>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.changeText}>Change</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={[styles.methodCard, paymentMethod === "apple" && styles.methodCardSelected]}
        onPress={() => handleSelectMethod("apple")}
      >
        <Ionicons name="logo-apple" size={24} color={Colors.textPrimary} />
        <View style={{ flex: 1 }}>
          <Text style={styles.methodTitle}>Apple Pay</Text>
          <Text style={styles.methodDesc}>Pay instantly with Face ID</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.methodCard, paymentMethod === "google" && styles.methodCardSelected]}
        onPress={() => handleSelectMethod("google")}
      >
        <Ionicons name="logo-google" size={24} color={Colors.textPrimary} />
        <View style={{ flex: 1 }}>
          <Text style={styles.methodTitle}>Google Pay</Text>
          <Text style={styles.methodDesc}>Pay with your Google account</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.methodCard, paymentMethod === "card" && styles.methodCardSelected]}
        onPress={() => handleSelectMethod("card")}
      >
        <Ionicons name="card" size={24} color={Colors.secondary} />
        <View style={{ flex: 1 }}>
          <Text style={styles.methodTitle}>Credit / Debit Card</Text>
          <Text style={styles.methodDesc}>Visa, Mastercard, Amex</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
      </TouchableOpacity>

      <View style={styles.securityNote}>
        <Ionicons name="shield-checkmark" size={16} color={Colors.success} />
        <Text style={styles.securityText}>256-bit SSL encrypted. Your data is safe.</Text>
      </View>
    </View>
  );

  const renderCardDetails = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Card Details</Text>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Cardholder Name</Text>
        <TextInput
          style={styles.input}
          placeholder="John Doe"
          placeholderTextColor={Colors.textMuted}
          value={cardName}
          onChangeText={setCardName}
          returnKeyType="next"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Card Number</Text>
        <View style={styles.cardInputWrap}>
          <TextInput
            style={[styles.input, { flex: 1 }]}
            placeholder="4242 4242 4242 4242"
            placeholderTextColor={Colors.textMuted}
            value={cardNumber}
            onChangeText={(t) => setCardNumber(formatCardNumber(t))}
            keyboardType="number-pad"
            maxLength={19}
            returnKeyType="next"
          />
          <Ionicons name="card" size={20} color={Colors.textSecondary} />
        </View>
      </View>

      <View style={styles.rowInputs}>
        <View style={[styles.inputGroup, { flex: 1 }]}>
          <Text style={styles.inputLabel}>Expiry</Text>
          <TextInput
            style={styles.input}
            placeholder="MM/YY"
            placeholderTextColor={Colors.textMuted}
            value={expiry}
            onChangeText={(t) => setExpiry(formatExpiry(t))}
            keyboardType="number-pad"
            maxLength={5}
            returnKeyType="next"
          />
        </View>
        <View style={[styles.inputGroup, { flex: 1 }]}>
          <Text style={styles.inputLabel}>CVC</Text>
          <TextInput
            style={styles.input}
            placeholder="123"
            placeholderTextColor={Colors.textMuted}
            value={cvc}
            onChangeText={(t) => setCvc(t.replace(/\D/g, "").slice(0, 4))}
            keyboardType="number-pad"
            maxLength={4}
            secureTextEntry
            returnKeyType="done"
          />
        </View>
      </View>

      <TouchableOpacity style={styles.payBtn} onPress={handleSubmitCard}>
        <Ionicons name="lock-closed" size={16} color={Colors.textPrimary} />
        <Text style={styles.payBtnText}>Pay {plan.price}</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.backLink} onPress={() => setStep("method")}>
        <Text style={styles.backLinkText}>← Back to payment methods</Text>
      </TouchableOpacity>
    </View>
  );

  const renderProcessing = () => (
    <View style={styles.processingContainer}>
      <ActivityIndicator size="large" color={Colors.secondary} />
      <Text style={styles.processingTitle}>Processing Payment...</Text>
      <Text style={styles.processingDesc}>Please don't close this screen</Text>
    </View>
  );

  const renderConfirmation = () => (
    <View style={styles.confirmationContainer}>
      <View style={styles.successCircle}>
        <Ionicons name="checkmark" size={48} color={Colors.success} />
      </View>
      <Text style={styles.confirmTitle}>Payment Successful!</Text>
      <Text style={styles.confirmDesc}>
        You're now subscribed to {plan.name}. Enjoy all the premium features!
      </Text>

      <View style={styles.receiptCard}>
        <Text style={styles.receiptTitle}>Receipt</Text>
        <View style={styles.receiptRow}>
          <Text style={styles.receiptLabel}>Plan</Text>
          <Text style={styles.receiptValue}>{plan.name}</Text>
        </View>
        <View style={styles.receiptRow}>
          <Text style={styles.receiptLabel}>Amount</Text>
          <Text style={styles.receiptValue}>{plan.price}</Text>
        </View>
        <View style={styles.receiptRow}>
          <Text style={styles.receiptLabel}>Date</Text>
          <Text style={styles.receiptValue}>{new Date().toLocaleDateString()}</Text>
        </View>
        <View style={styles.receiptRow}>
          <Text style={styles.receiptLabel}>Status</Text>
          <Text style={[styles.receiptValue, { color: Colors.success }]}>Confirmed</Text>
        </View>
      </View>

      <View style={styles.featuresList}>
        <Text style={styles.featuresTitle}>What you get:</Text>
        {plan.features.map((f, i) => (
          <View key={i} style={styles.featureRow}>
            <Ionicons name="checkmark-circle" size={16} color={Colors.success} />
            <Text style={styles.featureText}>{f}</Text>
          </View>
        ))}
      </View>

      <TouchableOpacity style={styles.doneBtn} onPress={() => router.back()}>
        <Text style={styles.doneBtnText}>Start Learning</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right", "bottom"]}>
      {/* Header */}
      <View style={styles.header}>
        {step !== "processing" && step !== "confirmation" && (
          <TouchableOpacity style={styles.closeBtn} onPress={() => router.back()}>
            <Ionicons name="close" size={22} color={Colors.textPrimary} />
          </TouchableOpacity>
        )}
        <Text style={styles.headerTitle}>
          {step === "method" && "Payment"}
          {step === "details" && "Card Details"}
          {step === "processing" && ""}
          {step === "confirmation" && ""}
        </Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {step === "method" && renderMethodSelection()}
        {step === "details" && renderCardDetails()}
        {step === "processing" && renderProcessing()}
        {step === "confirmation" && renderConfirmation()}
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
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surfaceCard,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  headerTitle: {
    fontSize: FontSize.lg,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: Spacing.lg,
    paddingBottom: 40,
  },
  section: {
    gap: 14,
  },
  sectionTitle: {
    fontSize: FontSize.xl,
    fontWeight: "800",
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  planSummary: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Colors.surfaceCard,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.goldBorder,
    marginBottom: 8,
  },
  planSummaryLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  planName: {
    fontSize: FontSize.md,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  planPrice: {
    fontSize: FontSize.sm,
    color: Colors.gold,
    fontWeight: "600",
  },
  changeText: {
    fontSize: FontSize.sm,
    color: Colors.secondary,
    fontWeight: "600",
  },
  methodCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: Colors.surfaceCard,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  methodCardSelected: {
    borderColor: Colors.secondary,
    backgroundColor: Colors.secondary + "10",
  },
  methodTitle: {
    fontSize: FontSize.md,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  methodDesc: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  securityNote: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    justifyContent: "center",
    marginTop: 8,
  },
  securityText: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
  },
  inputGroup: {
    gap: 6,
  },
  inputLabel: {
    fontSize: FontSize.sm,
    fontWeight: "600",
    color: Colors.textSecondary,
    marginLeft: 4,
  },
  input: {
    backgroundColor: Colors.surfaceCard,
    borderRadius: BorderRadius.md,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: FontSize.md,
    color: Colors.textPrimary,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardInputWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surfaceCard,
    borderRadius: BorderRadius.md,
    paddingRight: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  rowInputs: {
    flexDirection: "row",
    gap: 12,
  },
  payBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.secondary,
    borderRadius: BorderRadius.full,
    paddingVertical: 16,
    marginTop: 12,
  },
  payBtnText: {
    fontSize: FontSize.md,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  backLink: {
    alignItems: "center",
    marginTop: 12,
  },
  backLinkText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  processingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 100,
    gap: 16,
  },
  processingTitle: {
    fontSize: FontSize.xl,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  processingDesc: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
  },
  confirmationContainer: {
    alignItems: "center",
    paddingTop: 40,
    gap: 12,
  },
  successCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: Colors.success + "20",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: Colors.greenBorder,
    marginBottom: 8,
  },
  confirmTitle: {
    fontSize: FontSize.xxl,
    fontWeight: "800",
    color: Colors.textPrimary,
  },
  confirmDesc: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: 22,
  },
  receiptCard: {
    width: "100%",
    backgroundColor: Colors.surfaceCard,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginTop: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 10,
  },
  receiptTitle: {
    fontSize: FontSize.md,
    fontWeight: "700",
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  receiptRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  receiptLabel: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  receiptValue: {
    fontSize: FontSize.sm,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  featuresList: {
    width: "100%",
    marginTop: 16,
    gap: 8,
  },
  featuresTitle: {
    fontSize: FontSize.md,
    fontWeight: "700",
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  featureText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  doneBtn: {
    backgroundColor: Colors.secondary,
    borderRadius: BorderRadius.full,
    paddingVertical: 16,
    paddingHorizontal: 40,
    marginTop: 24,
  },
  doneBtnText: {
    fontSize: FontSize.md,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
});
