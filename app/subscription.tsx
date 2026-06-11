import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Share,
  Modal,
  Animated,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import { Colors, Spacing, BorderRadius, FontSize } from "../constants/Colors";
import AsyncStorage from "@react-native-async-storage/async-storage";

// ─── INDIVIDUAL PRODUCTS ───
const INDIVIDUAL_PRODUCTS = [
  {
    id: "call-translate",
    name: "Live Call Translation",
    desc: "Real-time translation on phone, WhatsApp, or FaceTime calls",
    icon: "call",
    color: Colors.success,
    pricing: [
      { label: "Per Call", price: "$2.99" },
      { label: "Unlimited/mo", price: "$14.99" },
    ],
    badge: "MOST POPULAR",
  },
  {
    id: "song-transcription",
    name: "Song Transcription & Breakdown",
    desc: "AI transcribes any song with word-by-word translation & pronunciation",
    icon: "musical-notes",
    color: Colors.gold,
    pricing: [
      { label: "Per Song", price: "$1.99" },
      { label: "10 Pack", price: "$14.99" },
    ],
    badge: "",
  },
  {
    id: "song-translation",
    name: "Full Song Translation Pipeline",
    desc: "Translate vocals keeping cadence, melody & key — powered by WaveLoud",
    icon: "swap-horizontal",
    color: "#8B5CF6",
    pricing: [
      { label: "Per Song", price: "$3.99" },
      { label: "5 Pack", price: "$14.99" },
    ],
    badge: "NEW",
  },
  {
    id: "stem-separation",
    name: "Stem Separation",
    desc: "Isolate vocals, drums, bass & instruments from any song",
    icon: "git-branch",
    color: "#00E676",
    pricing: [
      { label: "Per Song", price: "$1.99" },
      { label: "10 Pack", price: "$14.99" },
    ],
    badge: "",
  },
  {
    id: "ai-teacher",
    name: "AI Teacher Session",
    desc: "1-on-1 AI tutoring with conversation practice & corrections",
    icon: "school",
    color: Colors.secondary,
    pricing: [
      { label: "30 min", price: "$4.99" },
      { label: "Unlimited/mo", price: "$19.99" },
    ],
    badge: "",
  },
  {
    id: "voice-clone",
    name: "Voice Clone",
    desc: "Hear translations in YOUR voice — unlock your personal AI voice",
    icon: "mic",
    color: "#E040FB",
    pricing: [
      { label: "One-Time", price: "$9.99" },
      { label: "Premium Voices", price: "$19.99" },
    ],
    badge: "",
  },
  {
    id: "video-translate",
    name: "Live Video/Camera Translation",
    desc: "Point your camera at text or join video calls with real-time subtitles",
    icon: "videocam",
    color: Colors.glow,
    pricing: [
      { label: "Per Minute", price: "$0.99" },
      { label: "Unlimited/mo", price: "$19.99" },
    ],
    badge: "",
  },
  {
    id: "call-transcript",
    name: "Call Transcript",
    desc: "Get a full written transcript of any call — requires permission from both parties",
    icon: "document-text",
    color: Colors.warning,
    pricing: [
      { label: "Per Call", price: "$0.49" },
      { label: "10 Pack", price: "$3.99" },
    ],
    badge: "LOW COST",
  },
  {
    id: "b2b-training",
    name: "B2B Training Module",
    desc: "Enterprise language training for technical fields (IT, Medical, Legal)",
    icon: "business",
    color: Colors.goldBright,
    pricing: [
      { label: "Per Course", price: "$49.99" },
      { label: "Team (5 seats)", price: "$199.99" },
    ],
    badge: "ENTERPRISE",
  },
];

// ─── SUBSCRIPTION TIERS ───
const TIERS = [
  {
    id: "free",
    name: "Free",
    price: "$0",
    period: "forever",
    description: "Try it out",
    color: Colors.textSecondary,
    features: [
      "1 language",
      "5 AI transcriptions/month",
      "Basic community access",
      "Limited song breakdowns",
    ],
    limitations: ["Ads included", "No live translation", "No priority support"],
  },
  {
    id: "plus",
    name: "Plus",
    price: "$13.99",
    period: "/month",
    description: "For serious learners",
    color: Colors.secondary,
    popular: true,
    features: [
      "5 languages + dialects",
      "500 credits/month",
      "Live call translation (30 min/mo)",
      "Song breakdowns & stem separation (5/mo)",
      "AI teacher sessions",
      "Job alerts & matching",
      "Priority support",
    ],
    limitations: [],
  },
  {
    id: "pro",
    name: "Pro",
    price: "$27.99",
    period: "/month",
    description: "Unlimited everything",
    color: Colors.gold,
    features: [
      "Unlimited languages & dialects",
      "Unlimited AI transcriptions",
      "Unlimited live translation",
      "Unlimited song translation & stem separation",
      "Voice cloning",
      "WaveLoud full pipeline",
      "Custom AI teacher",
      "No ads ever",
    ],
    limitations: [],
  },
  {
    id: "enterprise",
    name: "Family/Team",
    price: "$44.99",
    period: "/month",
    description: "Share with up to 5 people",
    color: "#E040FB",
    features: [
      "Everything in Pro",
      "5 seats included",
      "Team management dashboard",
      "B2B training modules",
      "API access",
      "Custom curriculum builder",
      "Dedicated account manager",
    ],
    limitations: [],
  },
];

// ─── CREDIT PACKS ───
const CREDIT_PACKS = [
  { id: "starter", credits: 50, price: "$4.99", bonus: "", popular: false },
  { id: "value", credits: 150, price: "$12.99", bonus: "+15 bonus", popular: true },
  { id: "pro", credits: 500, price: "$39.99", bonus: "+75 bonus", popular: false },
  { id: "mega", credits: 1200, price: "$79.99", bonus: "+200 bonus", popular: false },
];

// ─── PAYMENT METHODS ───
const PAYMENT_METHODS = [
  { id: "card", name: "Credit / Debit Card", icon: "card", color: Colors.secondary },
  { id: "apple", name: "Apple Pay", icon: "logo-apple", color: Colors.textPrimary },
  { id: "stripe", name: "Stripe", icon: "flash", color: "#635BFF" },
  { id: "paypal", name: "PayPal", icon: "logo-paypal", color: "#00457C" },
];

type TabKey = "products" | "plans" | "credits";

export default function SubscriptionScreen() {
  const [currentPlan] = useState("free");
  const [credits] = useState(50);
  const [activeTab, setActiveTab] = useState<TabKey>("products");
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");
  const [selectedPack, setSelectedPack] = useState<string | null>(null);
  const [trialUsed, setTrialUsed] = useState(false);
  // Referral state
  const [referralCount] = useState(3);
  const [referralCredits] = useState(75);
  // Redeem code state
  const [redeemCode, setRedeemCode] = useState("");
  const [redeemStatus, setRedeemStatus] = useState<"idle" | "success" | "error">("idle");
  const [redeemMessage, setRedeemMessage] = useState("");
  // Purchase confirmation modal
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [purchaseDetails, setPurchaseDetails] = useState<{ name: string; price: string } | null>(null);
  const confettiAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.5)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Gift Credits contact picker
  const [showContactPicker, setShowContactPicker] = useState(false);
  const [selectedGiftAmount, setSelectedGiftAmount] = useState<{ amount: number; price: string } | null>(null);
  const [selectedRecipient, setSelectedRecipient] = useState<string | null>(null);
  const [contactSearch, setContactSearch] = useState("");

  // Credit received toast
  const [creditToast, setCreditToast] = useState<{ sender: string; amount: number } | null>(null);
  const creditToastAnim = useRef(new Animated.Value(-100)).current;

  const showCreditReceivedToast = (sender: string, amount: number) => {
    setCreditToast({ sender, amount });
    creditToastAnim.setValue(-100);
    Animated.sequence([
      Animated.spring(creditToastAnim, { toValue: 60, useNativeDriver: true, tension: 80, friction: 10 }),
      Animated.delay(3500),
      Animated.timing(creditToastAnim, { toValue: -100, duration: 300, useNativeDriver: true }),
    ]).start(() => setCreditToast(null));
  };

  // Simulate receiving credits after gifting (demo)
  useEffect(() => {
    const timer = setTimeout(() => {
      showCreditReceivedToast("Sophie Dubois", 25);
    }, 8000);
    return () => clearTimeout(timer);
  }, []);
  const GIFT_CONTACTS = [
    { id: "c1", name: "Maria Garcia", avatar: "MG", lang: "🇪🇸", online: true },
    { id: "c2", name: "Yuki Tanaka", avatar: "YT", lang: "🇯🇵", online: true },
    { id: "c3", name: "Ahmed Hassan", avatar: "AH", lang: "🇸🇦", online: false },
    { id: "c4", name: "Sophie Dubois", avatar: "SD", lang: "🇫🇷", online: true },
    { id: "c5", name: "Wei Chen", avatar: "WC", lang: "🇨🇳", online: false },
    { id: "c6", name: "Carlos Silva", avatar: "CS", lang: "🇧🇷", online: true },
    { id: "c7", name: "Priya Patel", avatar: "PP", lang: "🇮🇳", online: false },
    { id: "c8", name: "Olga Ivanova", avatar: "OI", lang: "🇷🇺", online: true },
  ];

  const showConfirmation = (name: string, price: string) => {
    setPurchaseDetails({ name, price });
    setShowPurchaseModal(true);
    confettiAnim.setValue(0);
    scaleAnim.setValue(0.5);
    fadeAnim.setValue(0);
    Animated.parallel([
      Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, damping: 12 }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.timing(confettiAnim, { toValue: 1, duration: 1200, useNativeDriver: true }),
    ]).start();
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const handleShareReferral = async () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    try {
      await Share.share({
        message: "Join me on ConnectWorld AI! Use my link and we both get 25 free credits: https://connectworld.ai/ref/jordan_speaks",
        title: "Invite to ConnectWorld AI",
      });
    } catch (e) {}
  };

  const handleRedeemCode = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    const code = redeemCode.trim().toUpperCase();
    if (!code) {
      setRedeemStatus("error");
      setRedeemMessage("Please enter a code");
      return;
    }
    // Simulate code validation
    const validCodes: Record<string, { credits: number; desc: string }> = {
      "WELCOME50": { credits: 50, desc: "Welcome bonus! 50 credits added" },
      "PARTNER25": { credits: 25, desc: "Partner discount! 25 credits added" },
      "LAUNCH100": { credits: 100, desc: "Launch promo! 100 credits added" },
      "FRIEND10": { credits: 10, desc: "Friend code! 10 credits added" },
    };
    if (validCodes[code]) {
      setRedeemStatus("success");
      setRedeemMessage(validCodes[code].desc);
      setRedeemCode("");
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } else {
      setRedeemStatus("error");
      setRedeemMessage("Invalid or expired code");
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    }
    setTimeout(() => {
      setRedeemStatus("idle");
      setRedeemMessage("");
    }, 3000);
  };

  const handleBuy = (productId: string, pricingLabel: string) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    const product = INDIVIDUAL_PRODUCTS.find(p => p.id === productId);
    const pricing = product?.pricing.find(p => p.label === pricingLabel);
    if (product && pricing) {
      showConfirmation(product.name, pricing.price);
    }
  };

  const handleTryFree = () => {
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    setTrialUsed(true);
    // In production: navigate to call screen with free trial flag
    router.push("/call-translator");
  };

  const handleUpgrade = (tierId: string) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    const tier = TIERS.find(t => t.id === tierId);
    if (tier && tier.id !== "free") {
      router.push("/checkout" as any);
    }
  };

  const handleBuyCredits = (packId: string) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setSelectedPack(packId);
    const pack = CREDIT_PACKS.find(p => p.id === packId);
    if (pack) {
      showConfirmation(`${pack.credits} Credits`, pack.price);
    }
  };

  const handlePayment = (methodId: string) => {
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    setSelectedPack(null);
  };

  // ─── INDIVIDUAL PRODUCTS TAB ───
  const renderProducts = () => (
    <View>
      <Text style={styles.sectionTitle}>Individual Products</Text>
      <Text style={styles.sectionSubtitle}>
        Buy just what you need. No subscription required.
      </Text>

      {INDIVIDUAL_PRODUCTS.map((product) => (
        <View key={product.id} style={styles.productCard}>
          {product.badge ? (
            <View style={[styles.productBadge, { backgroundColor: product.color }]}>
              <Text style={styles.productBadgeText}>{product.badge}</Text>
            </View>
          ) : null}
          <View style={styles.productHeader}>
            <View style={[styles.productIconWrap, { backgroundColor: product.color + "18" }]}>
              <Ionicons name={product.icon as any} size={22} color={product.color} />
            </View>
            <View style={styles.productInfo}>
              <Text style={styles.productName}>{product.name}</Text>
              <Text style={styles.productDesc}>{product.desc}</Text>
            </View>
          </View>
          <View style={styles.pricingRow}>
            {product.pricing.map((opt, idx) => (
              <TouchableOpacity
                key={idx}
                style={[styles.pricingOption, idx === 0 && styles.pricingOptionPrimary]}
                activeOpacity={0.7}
                onPress={() => handleBuy(product.id, opt.label)}
              >
                <Text style={styles.pricingLabel}>{opt.label}</Text>
                <Text style={[styles.pricingPrice, idx === 0 && styles.pricingPricePrimary]}>
                  {opt.price}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          {/* Try Free button for Live Call Translation */}
          {product.id === "call-translate" && (
            <TouchableOpacity
              style={[styles.tryFreeBtn, trialUsed && styles.tryFreeBtnUsed]}
              activeOpacity={0.7}
              onPress={handleTryFree}
              disabled={trialUsed}
            >
              <Ionicons
                name={trialUsed ? "checkmark-circle" : "gift"}
                size={18}
                color={trialUsed ? Colors.textMuted : "#FFFFFF"}
              />
              <Text style={[styles.tryFreeText, trialUsed && styles.tryFreeTextUsed]}>
                {trialUsed ? "Free Trial Used" : "Try 1 Free Call"}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      ))}
    </View>
  );

  // ─── SUBSCRIPTION PLANS TAB ───
  const renderPlans = () => (
    <View>
      {/* Billing Toggle */}
      <View style={styles.billingToggle}>
        <TouchableOpacity
          style={[styles.billingOption, billingCycle === "monthly" && styles.billingOptionActive]}
          onPress={() => setBillingCycle("monthly")}
        >
          <Text style={[styles.billingText, billingCycle === "monthly" && styles.billingTextActive]}>
            Monthly
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.billingOption, billingCycle === "yearly" && styles.billingOptionActive]}
          onPress={() => setBillingCycle("yearly")}
        >
          <Text style={[styles.billingText, billingCycle === "yearly" && styles.billingTextActive]}>
            Yearly
          </Text>
          <View style={styles.saveBadge}>
            <Text style={styles.saveText}>Save 33%</Text>
          </View>
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>Subscription Plans</Text>
      <Text style={styles.sectionSubtitle}>
        Get everything bundled. Best value for power users.
      </Text>

      {TIERS.map((tier) => (
        <View
          key={tier.id}
          style={[
            styles.tierCard,
            tier.popular && styles.tierCardPopular,
            currentPlan === tier.id && styles.tierCardCurrent,
          ]}
        >
          {tier.popular && (
            <View style={styles.popularBadge}>
              <Text style={styles.popularBadgeText}>MOST POPULAR</Text>
            </View>
          )}
          <View style={styles.tierHeader}>
            <View>
              <Text style={[styles.tierName, { color: tier.color }]}>{tier.name}</Text>
              <Text style={styles.tierDesc}>{tier.description}</Text>
              <View style={styles.tierPriceRow}>
                <Text style={styles.tierPrice}>{tier.price}</Text>
                <Text style={styles.tierPeriod}>{tier.period}</Text>
              </View>
            </View>
            {currentPlan === tier.id ? (
              <View style={styles.currentBadge}>
                <Text style={styles.currentBadgeText}>Active</Text>
              </View>
            ) : (
              <TouchableOpacity
                style={[styles.upgradeBtn, { backgroundColor: tier.color + "20", borderColor: tier.color }]}
                onPress={() => handleUpgrade(tier.id)}
              >
                <Text style={[styles.upgradeBtnText, { color: tier.color }]}>
                  {tier.id === "free" ? "Current" : "Upgrade"}
                </Text>
              </TouchableOpacity>
            )}
          </View>
          <View style={styles.tierFeatures}>
            {tier.features.map((feature, idx) => (
              <View key={idx} style={styles.featureRow}>
                <Ionicons name="checkmark-circle" size={16} color={Colors.success} />
                <Text style={styles.featureText}>{feature}</Text>
              </View>
            ))}
            {tier.limitations.map((limit, idx) => (
              <View key={`l-${idx}`} style={styles.featureRow}>
                <Ionicons name="close-circle" size={16} color={Colors.textMuted} />
                <Text style={styles.limitText}>{limit}</Text>
              </View>
            ))}
          </View>
        </View>
      ))}
    </View>
  );

  // ─── CREDITS TAB ───
  const renderCredits = () => (
    <View>
      <Text style={styles.sectionTitle}>Credit Marketplace</Text>
      <Text style={styles.sectionSubtitle}>
        Buy credits and spend them on ANY service. 1 credit = ~$0.10 value. No expiration.
      </Text>

      <View style={styles.creditsGrid}>
        {CREDIT_PACKS.map((pack) => (
          <TouchableOpacity
            key={pack.id}
            style={[
              styles.creditPack,
              pack.popular && styles.creditPackPopular,
              selectedPack === pack.id && styles.creditPackSelected,
            ]}
            activeOpacity={0.7}
            onPress={() => handleBuyCredits(pack.id)}
          >
            {pack.popular && (
              <View style={styles.creditPopularTag}>
                <Text style={styles.creditPopularTagText}>BEST VALUE</Text>
              </View>
            )}
            <Ionicons name="diamond" size={24} color={Colors.gold} />
            <Text style={styles.creditAmount}>{pack.credits}</Text>
            <Text style={styles.creditLabel}>credits</Text>
            {pack.bonus ? <Text style={styles.creditBonus}>{pack.bonus}</Text> : null}
            <Text style={styles.creditPrice}>{pack.price}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* What credits buy */}
      <Text style={[styles.sectionTitle, { marginTop: Spacing.xl }]}>What Credits Buy</Text>
      <View style={styles.creditUsageList}>
        {[
          { service: "Live Call Translation", cost: "30 credits/call", icon: "call" },
          { service: "Song Transcription", cost: "20 credits/song", icon: "musical-notes" },
          { service: "AI Teacher (30 min)", cost: "50 credits", icon: "school" },
          { service: "Video Translation (1 min)", cost: "10 credits", icon: "videocam" },
          { service: "Voice Clone Unlock", cost: "100 credits", icon: "mic" },
        ].map((item, idx) => (
          <View key={idx} style={styles.creditUsageRow}>
            <Ionicons name={item.icon as any} size={18} color={Colors.secondary} />
            <Text style={styles.creditUsageService}>{item.service}</Text>
            <Text style={styles.creditUsageCost}>{item.cost}</Text>
          </View>
        ))}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Store</Text>
        <TouchableOpacity
          style={styles.creditsHeaderDisplay}
          onPress={() => router.push("/transaction-history")}
        >
          <Ionicons name="diamond" size={14} color={Colors.gold} />
          <Text style={styles.creditsHeaderText}>{credits}</Text>
          <Ionicons name="receipt-outline" size={14} color={Colors.textMuted} />
        </TouchableOpacity>
      </View>

      {/* Current Plan Banner */}
      <View style={styles.currentPlanBanner}>
        <View style={styles.currentPlanLeft}>
          <Ionicons name="shield-checkmark" size={16} color={Colors.success} />
          <Text style={styles.currentPlanLabel}>
            {TIERS.find((t) => t.id === currentPlan)?.name} Plan
          </Text>
        </View>
        <TouchableOpacity
          style={styles.managePlanBtn}
          onPress={() => setActiveTab("plans")}
        >
          <Text style={styles.managePlanText}>Manage</Text>
        </TouchableOpacity>
      </View>

      {/* Tab Switcher */}
      <View style={styles.tabRow}>
        {([
          { key: "products" as TabKey, label: "Products", icon: "bag" },
          { key: "plans" as TabKey, label: "Plans", icon: "layers" },
          { key: "credits" as TabKey, label: "Credits", icon: "diamond" },
        ]).map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.tabActive]}
            onPress={() => setActiveTab(tab.key)}
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
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {activeTab === "products" && renderProducts()}
        {activeTab === "plans" && renderPlans()}
        {activeTab === "credits" && renderCredits()}

        {/* Payment Methods — always visible */}
        <Text style={[styles.sectionTitle, { marginTop: Spacing.xl }]}>Payment Methods</Text>
        <Text style={styles.sectionSubtitle}>
          Secure checkout with your preferred method.
        </Text>

        {PAYMENT_METHODS.map((method) => (
          <TouchableOpacity
            key={method.id}
            style={styles.paymentCard}
            activeOpacity={0.7}
            onPress={() => handlePayment(method.id)}
          >
            <View style={[styles.paymentIcon, { backgroundColor: method.color + "15" }]}>
              <Ionicons name={method.icon as any} size={22} color={method.color} />
            </View>
            <Text style={styles.paymentName}>{method.name}</Text>
            <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
          </TouchableOpacity>
        ))}

        {/* Security Note */}
        <View style={styles.securityNote}>
          <Ionicons name="lock-closed" size={14} color={Colors.success} />
          <Text style={styles.securityText}>
            All payments are processed securely. Cancel subscriptions anytime.
          </Text>
        </View>

        {/* ─── REDEEM CODE SECTION ─── */}
        <View style={styles.redeemSection}>
          <View style={styles.redeemHeader}>
            <Ionicons name="ticket" size={20} color={Colors.gold} />
            <Text style={styles.redeemTitle}>Redeem Code</Text>
          </View>
          <Text style={styles.redeemDesc}>
            Have a promo code or partner discount? Enter it below to claim your credits.
          </Text>
          <View style={styles.redeemInputRow}>
            <TextInput
              style={styles.redeemInput}
              value={redeemCode}
              onChangeText={setRedeemCode}
              placeholder="Enter code (e.g. WELCOME50)"
              placeholderTextColor={Colors.textMuted}
              autoCapitalize="characters"
              returnKeyType="done"
              onSubmitEditing={handleRedeemCode}
            />
            <TouchableOpacity style={styles.redeemBtn} onPress={handleRedeemCode}>
              <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
              <Text style={styles.redeemBtnText}>Apply</Text>
            </TouchableOpacity>
          </View>
          {redeemMessage !== "" && (
            <View style={[styles.redeemFeedback, { backgroundColor: redeemStatus === "success" ? Colors.greenGlow : Colors.redGlow }]}>
              <Ionicons
                name={redeemStatus === "success" ? "checkmark-circle" : "close-circle"}
                size={16}
                color={redeemStatus === "success" ? Colors.success : Colors.error}
              />
              <Text style={[styles.redeemFeedbackText, { color: redeemStatus === "success" ? Colors.success : Colors.error }]}>
                {redeemMessage}
              </Text>
            </View>
          )}
        </View>

        {/* ─── REFERRAL CREDITS SECTION ─── */}
        <View style={styles.referralSection}>
          <View style={styles.referralHeader}>
            <View style={styles.referralIconWrap}>
              <Ionicons name="gift" size={22} color={Colors.gold} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.referralTitle}>Earn Free Credits</Text>
              <Text style={styles.referralSubtitle}>Invite friends, get 25 credits each</Text>
            </View>
          </View>

          {/* Stats */}
          <View style={styles.referralStats}>
            <View style={styles.referralStat}>
              <Text style={styles.referralStatNum}>{referralCount}</Text>
              <Text style={styles.referralStatLabel}>Friends Invited</Text>
            </View>
            <View style={styles.referralStatDivider} />
            <View style={styles.referralStat}>
              <Text style={[styles.referralStatNum, { color: Colors.gold }]}>{referralCredits}</Text>
              <Text style={styles.referralStatLabel}>Credits Earned</Text>
            </View>
            <View style={styles.referralStatDivider} />
            <View style={styles.referralStat}>
              <Text style={styles.referralStatNum}>25</Text>
              <Text style={styles.referralStatLabel}>Per Referral</Text>
            </View>
          </View>

          {/* How it works */}
          <View style={styles.referralSteps}>
            <View style={styles.referralStep}>
              <View style={styles.referralStepNum}><Text style={styles.referralStepNumText}>1</Text></View>
              <Text style={styles.referralStepText}>Share your link or QR code</Text>
            </View>
            <View style={styles.referralStep}>
              <View style={styles.referralStepNum}><Text style={styles.referralStepNumText}>2</Text></View>
              <Text style={styles.referralStepText}>Friend signs up & uses ConnectWorld AI</Text>
            </View>
            <View style={styles.referralStep}>
              <View style={styles.referralStepNum}><Text style={styles.referralStepNumText}>3</Text></View>
              <Text style={styles.referralStepText}>You both get 25 free credits!</Text>
            </View>
          </View>

          {/* Share buttons */}
          <View style={styles.referralActions}>
            <TouchableOpacity style={styles.referralShareBtn} onPress={handleShareReferral}>
              <Ionicons name="share-social" size={18} color="#FFFFFF" />
              <Text style={styles.referralShareText}>Share Invite Link</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.referralQRBtn} onPress={() => router.push("/qr-code")}>
              <Ionicons name="qr-code" size={18} color={Colors.secondary} />
              <Text style={styles.referralQRText}>My QR Code</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ─── GIFT CREDITS SECTION ─── */}
        <View style={styles.giftSection}>
          <View style={styles.giftHeader}>
            <View style={[styles.referralIconWrap, { backgroundColor: "#E040FB" + "18" }]}>
              <Ionicons name="gift-outline" size={22} color={"#E040FB"} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.giftTitle}>Gift Credits</Text>
              <Text style={styles.giftSubtitle}>Send credits to friends & family</Text>
            </View>
          </View>

          <Text style={styles.giftDesc}>
            Surprise someone with ConnectWorld AI credits. They can use them for calls, translations, lessons, or any service.
          </Text>

          {/* Gift amount options */}
          <View style={styles.giftAmounts}>
            {[
              { amount: 10, price: "$0.99", label: "Starter" },
              { amount: 25, price: "$1.99", label: "Nice" },
              { amount: 50, price: "$3.99", label: "Generous" },
              { amount: 100, price: "$6.99", label: "Amazing" },
              { amount: 250, price: "$14.99", label: "VIP" },
            ].map((gift) => (
              <TouchableOpacity
                key={gift.amount}
                style={styles.giftCard}
                onPress={() => {
                  if (Platform.OS !== "web") {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  }
                  setSelectedGiftAmount({ amount: gift.amount, price: gift.price });
                  setShowContactPicker(true);
                }}
              >
                <Text style={styles.giftEmoji}>
                  {gift.amount <= 10 ? "\uD83C\uDF81" : gift.amount <= 25 ? "\uD83C\uDF89" : gift.amount <= 50 ? "\u2728" : gift.amount <= 100 ? "\uD83D\uDC8E" : "\uD83D\uDC51"}
                </Text>
                <Text style={styles.giftAmount}>{gift.amount}</Text>
                <Text style={styles.giftCreditsLabel}>credits</Text>
                <Text style={styles.giftPrice}>{gift.price}</Text>
                <Text style={styles.giftLabel}>{gift.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Send to contact */}
          <TouchableOpacity
            style={styles.giftSendBtn}
            onPress={() => {
              if (Platform.OS !== "web") {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              }
              setShowContactPicker(true);
            }}
          >
            <Ionicons name="send" size={18} color="#FFFFFF" />
            <Text style={styles.giftSendText}>Choose Recipient & Send</Text>
          </TouchableOpacity>
          {selectedRecipient && (
            <View style={styles.giftRecipientBadge}>
              <Ionicons name="checkmark-circle" size={14} color={Colors.success} />
              <Text style={styles.giftRecipientText}>Sending to: {selectedRecipient}</Text>
            </View>
          )}

          <Text style={styles.giftNote}>
            Recipients will be notified via push notification. Credits never expire.
          </Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* ─── CREDIT RECEIVED TOAST ─── */}
      {creditToast && (
        <Animated.View style={[styles.creditToast, { transform: [{ translateY: creditToastAnim }] }]}>
          <View style={styles.creditToastIcon}>
            <Ionicons name="gift" size={20} color="#E040FB" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.creditToastTitle}>Credits Received!</Text>
            <Text style={styles.creditToastMsg}>
              {creditToast.sender} sent you {creditToast.amount} credits
            </Text>
          </View>
          <TouchableOpacity onPress={() => setCreditToast(null)}>
            <Ionicons name="close" size={18} color={Colors.textMuted} />
          </TouchableOpacity>
        </Animated.View>
      )}

      {/* ─── CONTACT PICKER MODAL ─── */}
      <Modal visible={showContactPicker} transparent animationType="slide">
        <View style={styles.contactPickerOverlay}>
          <View style={styles.contactPickerSheet}>
            <View style={styles.contactPickerHeader}>
              <Text style={styles.contactPickerTitle}>Send Credits To</Text>
              <TouchableOpacity onPress={() => setShowContactPicker(false)}>
                <Ionicons name="close-circle" size={28} color={Colors.textMuted} />
              </TouchableOpacity>
            </View>
            <Text style={styles.contactPickerSubtitle}>
              Select a friend to gift credits to
            </Text>
            <View style={styles.contactSearchWrap}>
              <Ionicons name="search" size={16} color={Colors.textMuted} />
              <TextInput
                style={styles.contactSearchInput}
                placeholder="Search contacts..."
                placeholderTextColor={Colors.textMuted}
                value={contactSearch}
                onChangeText={setContactSearch}
                returnKeyType="done"
              />
              {contactSearch.length > 0 && (
                <TouchableOpacity onPress={() => setContactSearch("")}>
                  <Ionicons name="close-circle" size={16} color={Colors.textMuted} />
                </TouchableOpacity>
              )}
            </View>
            <ScrollView style={styles.contactPickerList} showsVerticalScrollIndicator={false}>
              {GIFT_CONTACTS.filter((c) =>
                c.name.toLowerCase().includes(contactSearch.toLowerCase())
              ).map((contact) => (
                <TouchableOpacity
                  key={contact.id}
                  style={styles.contactPickerItem}
                  onPress={() => {
                    if (Platform.OS !== "web") {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }
                    setSelectedRecipient(contact.name);
                    setShowContactPicker(false);
                    if (selectedGiftAmount) {
                      showConfirmation(`Gift ${selectedGiftAmount.amount} Credits to ${contact.name}`, selectedGiftAmount.price);
                    }
                  }}
                >
                  <View style={styles.contactPickerAvatar}>
                    <Text style={styles.contactPickerAvatarText}>{contact.avatar}</Text>
                    {contact.online && <View style={styles.contactPickerOnline} />}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.contactPickerName}>{contact.name}</Text>
                    <Text style={styles.contactPickerLang}>{contact.lang} {contact.online ? "Online" : "Offline"}</Text>
                  </View>
                  <Ionicons name="gift" size={18} color={"#E040FB"} />
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ─── PURCHASE CONFIRMATION MODAL ─── */}
      <Modal visible={showPurchaseModal} transparent animationType="none">
        <Animated.View style={[styles.purchaseOverlay, { opacity: fadeAnim }]}>
          <Animated.View style={[styles.purchaseModal, { transform: [{ scale: scaleAnim }] }]}>
            {/* Confetti particles */}
            {[...Array(12)].map((_, i) => (
              <Animated.View
                key={i}
                style={[
                  styles.confettiPiece,
                  {
                    left: `${10 + (i * 7) % 80}%`,
                    backgroundColor: [Colors.gold, Colors.secondary, Colors.success, Colors.accent, "#E040FB", Colors.glow][i % 6],
                    transform: [
                      { translateY: confettiAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [-20, 120 + (i % 3) * 40],
                      })},
                      { rotate: confettiAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: ["0deg", `${180 + i * 30}deg`],
                      })},
                    ],
                    opacity: confettiAnim.interpolate({
                      inputRange: [0, 0.2, 0.8, 1],
                      outputRange: [0, 1, 1, 0],
                    }),
                  },
                ]}
              />
            ))}

            {/* Success icon */}
            <View style={styles.purchaseSuccessIcon}>
              <Ionicons name="checkmark-circle" size={56} color={Colors.success} />
            </View>

            <Text style={styles.purchaseTitle}>Purchase Complete!</Text>
            {purchaseDetails && (
              <>
                <Text style={styles.purchaseProduct}>{purchaseDetails.name}</Text>
                <View style={styles.purchaseReceipt}>
                  <View style={styles.receiptRow}>
                    <Text style={styles.receiptLabel}>Amount</Text>
                    <Text style={styles.receiptValue}>{purchaseDetails.price}</Text>
                  </View>
                  <View style={styles.receiptDivider} />
                  <View style={styles.receiptRow}>
                    <Text style={styles.receiptLabel}>Credits Balance</Text>
                    <Text style={[styles.receiptValue, { color: Colors.gold }]}>{credits} credits</Text>
                  </View>
                  <View style={styles.receiptDivider} />
                  <View style={styles.receiptRow}>
                    <Text style={styles.receiptLabel}>Status</Text>
                    <View style={styles.receiptStatusBadge}>
                      <Ionicons name="checkmark" size={10} color={Colors.success} />
                      <Text style={styles.receiptStatusText}>Confirmed</Text>
                    </View>
                  </View>
                </View>
              </>
            )}

            <TouchableOpacity
              style={styles.purchaseDoneBtn}
              onPress={async () => {
                // Save subscription status so the app recognizes user as premium
                await AsyncStorage.setItem("@subscription_tier", "premium");
                await AsyncStorage.setItem("@subscription_active", "true");
                await AsyncStorage.setItem("@subscription_purchased_at", new Date().toISOString());
                if (purchaseDetails) {
                  await AsyncStorage.setItem("@subscription_plan", purchaseDetails.name);
                }
                setShowPurchaseModal(false);
                // Navigate back so the paywall is dismissed
                if (router.canGoBack()) router.back();
              }}
            >
              <Text style={styles.purchaseDoneText}>Done</Text>
            </TouchableOpacity>
          </Animated.View>
        </Animated.View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.primary },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: FontSize.xl, fontWeight: "700", color: Colors.textPrimary },
  creditsHeaderDisplay: { flexDirection: "row", alignItems: "center", gap: 4 },
  creditsHeaderText: { fontSize: 14, fontWeight: "700", color: Colors.gold },
  scrollContent: { paddingHorizontal: Spacing.lg, paddingBottom: 100 },

  // Current Plan Banner
  currentPlanBanner: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    marginHorizontal: Spacing.lg, marginBottom: Spacing.md,
    paddingHorizontal: Spacing.md, paddingVertical: 10,
    borderRadius: BorderRadius.md, backgroundColor: Colors.surfaceCard,
    borderWidth: 1, borderColor: Colors.greenBorder,
  },
  currentPlanLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
  currentPlanLabel: { fontSize: 13, fontWeight: "600", color: Colors.textPrimary },
  managePlanBtn: {
    paddingHorizontal: 12, paddingVertical: 4,
    borderRadius: 12, backgroundColor: Colors.glowSubtle,
    borderWidth: 1, borderColor: Colors.glowBorder,
  },
  managePlanText: { fontSize: 11, fontWeight: "600", color: Colors.secondary },

  // Tab Row
  tabRow: {
    flexDirection: "row", marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md, gap: 8,
  },
  tab: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 6, paddingVertical: 10, borderRadius: BorderRadius.md,
    backgroundColor: Colors.surfaceCard, borderWidth: 1, borderColor: Colors.border,
  },
  tabActive: { backgroundColor: Colors.glowSubtle, borderColor: Colors.secondary },
  tabText: { fontSize: 12, fontWeight: "600", color: Colors.textMuted },
  tabTextActive: { color: Colors.secondary },

  // Section
  sectionTitle: { fontSize: FontSize.lg, fontWeight: "700", color: Colors.textPrimary, marginBottom: 4 },
  sectionSubtitle: { fontSize: 13, color: Colors.textSecondary, marginBottom: Spacing.md, lineHeight: 18 },

  // Individual Product Cards
  productCard: {
    backgroundColor: Colors.surfaceCard, borderRadius: BorderRadius.lg,
    padding: Spacing.lg, marginBottom: Spacing.md,
    borderWidth: 1, borderColor: Colors.border,
  },
  productBadge: {
    position: "absolute", top: -9, right: 14,
    borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2,
  },
  productBadgeText: { fontSize: 9, fontWeight: "700", color: "#FFFFFF" },
  productHeader: { flexDirection: "row", gap: 12, marginBottom: 12 },
  productIconWrap: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: "center", justifyContent: "center",
  },
  productInfo: { flex: 1 },
  productName: { fontSize: 15, fontWeight: "700", color: Colors.textPrimary, marginBottom: 3 },
  productDesc: { fontSize: 12, color: Colors.textSecondary, lineHeight: 17 },
  pricingRow: { flexDirection: "row", gap: 10 },
  pricingOption: {
    flex: 1, alignItems: "center", paddingVertical: 10,
    borderRadius: BorderRadius.md, backgroundColor: Colors.surfaceElevated,
    borderWidth: 1, borderColor: Colors.border,
  },
  pricingOptionPrimary: { borderColor: Colors.glowBorder, backgroundColor: Colors.glowSubtle },
  pricingLabel: { fontSize: 11, color: Colors.textMuted, marginBottom: 3 },
  pricingPrice: { fontSize: 16, fontWeight: "700", color: Colors.textPrimary },
  pricingPricePrimary: { color: Colors.secondary },

  // Try Free Button
  tryFreeBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, marginTop: 12, paddingVertical: 12,
    borderRadius: BorderRadius.md, backgroundColor: Colors.success,
  },
  tryFreeBtnUsed: {
    backgroundColor: Colors.surfaceElevated,
    borderWidth: 1, borderColor: Colors.border,
  },
  tryFreeText: { fontSize: 14, fontWeight: "700", color: "#FFFFFF" },
  tryFreeTextUsed: { color: Colors.textMuted },

  // Billing Toggle
  billingToggle: {
    flexDirection: "row", backgroundColor: Colors.surfaceCard,
    borderRadius: BorderRadius.md, padding: 4, marginBottom: Spacing.lg,
  },
  billingOption: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
    paddingVertical: Spacing.sm + 2, borderRadius: BorderRadius.sm, gap: 6,
  },
  billingOptionActive: { backgroundColor: Colors.secondary },
  billingText: { fontSize: FontSize.sm, fontWeight: "600", color: Colors.textSecondary },
  billingTextActive: { color: Colors.textPrimary },
  saveBadge: {
    backgroundColor: Colors.success, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4,
  },
  saveText: { fontSize: 9, fontWeight: "800", color: Colors.textPrimary },

  // Tier Cards
  tierCard: {
    backgroundColor: Colors.surfaceCard, borderRadius: BorderRadius.lg,
    padding: Spacing.lg, marginBottom: Spacing.md,
    borderWidth: 1, borderColor: Colors.border,
  },
  tierCardPopular: { borderColor: Colors.secondary, borderWidth: 1.5 },
  tierCardCurrent: { borderColor: Colors.success, borderWidth: 1.5 },
  popularBadge: {
    position: "absolute", top: -10, right: 16,
    backgroundColor: Colors.secondary, borderRadius: 10,
    paddingHorizontal: 10, paddingVertical: 3,
  },
  popularBadgeText: { fontSize: 10, fontWeight: "700", color: "#FFFFFF" },
  tierHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 },
  tierName: { fontSize: 18, fontWeight: "700" },
  tierDesc: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  tierPriceRow: { flexDirection: "row", alignItems: "baseline", gap: 2, marginTop: 4 },
  tierPrice: { fontSize: 24, fontWeight: "800", color: Colors.textPrimary },
  tierPeriod: { fontSize: 13, color: Colors.textMuted },
  currentBadge: {
    backgroundColor: Colors.greenGlow, borderRadius: 12,
    paddingHorizontal: 12, paddingVertical: 5,
    borderWidth: 1, borderColor: Colors.greenBorder,
  },
  currentBadgeText: { fontSize: 12, fontWeight: "600", color: Colors.success },
  upgradeBtn: {
    paddingHorizontal: 16, paddingVertical: 8,
    borderRadius: 20, borderWidth: 1.5,
  },
  upgradeBtnText: { fontSize: 13, fontWeight: "600" },
  tierFeatures: { gap: 8 },
  featureRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  featureText: { fontSize: 13, color: Colors.textSecondary },
  limitText: { fontSize: 13, color: Colors.textMuted },

  // Credit Packs
  creditsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  creditPack: {
    width: "47%" as any, alignItems: "center",
    backgroundColor: Colors.surfaceCard, borderRadius: BorderRadius.lg,
    padding: Spacing.md, borderWidth: 1, borderColor: Colors.border,
  },
  creditPackPopular: { borderColor: Colors.gold, borderWidth: 1.5 },
  creditPackSelected: { borderColor: Colors.secondary, backgroundColor: Colors.glowSubtle },
  creditPopularTag: {
    position: "absolute", top: -8, right: 10,
    backgroundColor: Colors.gold, borderRadius: 8,
    paddingHorizontal: 8, paddingVertical: 2,
  },
  creditPopularTagText: { fontSize: 9, fontWeight: "700", color: Colors.textDark },
  creditAmount: { fontSize: 28, fontWeight: "800", color: Colors.textPrimary, marginTop: 6 },
  creditLabel: { fontSize: 12, color: Colors.textMuted, marginBottom: 4 },
  creditBonus: { fontSize: 11, fontWeight: "600", color: Colors.success },
  creditPrice: { fontSize: 16, fontWeight: "700", color: Colors.secondary, marginTop: 6 },

  // Credit Usage List
  creditUsageList: { gap: 8 },
  creditUsageRow: {
    flexDirection: "row", alignItems: "center", gap: 10,
    backgroundColor: Colors.surfaceCard, borderRadius: BorderRadius.md,
    padding: 12, borderWidth: 1, borderColor: Colors.border,
  },
  creditUsageService: { flex: 1, fontSize: 13, fontWeight: "500", color: Colors.textPrimary },
  creditUsageCost: { fontSize: 12, fontWeight: "600", color: Colors.gold },

  // Payment Methods
  paymentCard: {
    flexDirection: "row", alignItems: "center", gap: 12,
    backgroundColor: Colors.surfaceCard, borderRadius: BorderRadius.md,
    padding: Spacing.md, marginBottom: 10,
    borderWidth: 1, borderColor: Colors.border,
  },
  paymentIcon: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: "center", justifyContent: "center",
  },
  paymentName: { flex: 1, fontSize: 14, fontWeight: "600", color: Colors.textPrimary },

  // Security
  securityNote: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 6, marginTop: Spacing.lg, paddingVertical: Spacing.md,
  },
  securityText: { fontSize: 12, color: Colors.textMuted },

  // Redeem Code Section
  redeemSection: {
    marginTop: Spacing.xl,
    backgroundColor: Colors.surfaceCard,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.goldBorder,
  },
  redeemHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
  },
  redeemTitle: {
    fontSize: FontSize.lg,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  redeemDesc: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
    lineHeight: 18,
  },
  redeemInputRow: {
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
  },
  redeemInput: {
    flex: 1,
    height: 44,
    backgroundColor: Colors.surfaceElevated,
    borderRadius: BorderRadius.md,
    paddingHorizontal: 14,
    fontSize: FontSize.sm,
    color: Colors.textPrimary,
    borderWidth: 1,
    borderColor: Colors.border,
    letterSpacing: 1,
  },
  redeemBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Colors.gold,
    paddingHorizontal: 16,
    height: 44,
    borderRadius: BorderRadius.md,
  },
  redeemBtnText: {
    fontSize: FontSize.sm,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  redeemFeedback: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: BorderRadius.sm,
  },
  redeemFeedbackText: {
    fontSize: FontSize.xs,
    fontWeight: "600",
  },

  // Referral Section
  referralSection: {
    marginTop: Spacing.xl,
    backgroundColor: Colors.surfaceCard,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.gold + "40",
  },
  referralHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: Spacing.md,
  },
  referralIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.gold + "20",
    alignItems: "center",
    justifyContent: "center",
  },
  referralTitle: {
    fontSize: FontSize.lg,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  referralSubtitle: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  referralStats: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surfaceElevated,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  referralStat: {
    flex: 1,
    alignItems: "center",
  },
  referralStatNum: {
    fontSize: 22,
    fontWeight: "800",
    color: Colors.textPrimary,
  },
  referralStatLabel: {
    fontSize: 10,
    color: Colors.textMuted,
    marginTop: 2,
  },
  referralStatDivider: {
    width: 1,
    height: 30,
    backgroundColor: Colors.border,
  },
  referralSteps: {
    gap: 10,
    marginBottom: Spacing.lg,
  },
  referralStep: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  referralStepNum: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.secondary + "25",
    alignItems: "center",
    justifyContent: "center",
  },
  referralStepNumText: {
    fontSize: 12,
    fontWeight: "700",
    color: Colors.secondary,
  },
  referralStepText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  referralActions: {
    flexDirection: "row",
    gap: 10,
  },
  referralShareBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.secondary,
    paddingVertical: 14,
    borderRadius: BorderRadius.full,
  },
  referralShareText: {
    fontSize: FontSize.sm,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  referralQRBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.secondary + "15",
    paddingVertical: 14,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.secondary + "40",
  },
  referralQRText: {
    fontSize: FontSize.sm,
    fontWeight: "700",
    color: Colors.secondary,
  },

  // Gift Credits Section
  giftSection: {
    marginTop: Spacing.xl,
    backgroundColor: Colors.surfaceCard,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: "#E040FB" + "30",
  },
  giftHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 8,
  },
  giftTitle: {
    fontSize: FontSize.lg,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  giftSubtitle: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  giftDesc: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    lineHeight: 18,
    marginBottom: Spacing.md,
  },
  giftAmounts: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: Spacing.md,
  },
  giftCard: {
    width: "30%" as any,
    backgroundColor: Colors.surfaceElevated,
    borderRadius: BorderRadius.lg,
    padding: 10,
    alignItems: "center",
    gap: 2,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  giftEmoji: {
    fontSize: 20,
    marginBottom: 2,
  },
  giftAmount: {
    fontSize: FontSize.lg,
    fontWeight: "800",
    color: "#E040FB",
  },
  giftCreditsLabel: {
    fontSize: 9,
    color: Colors.textMuted,
    textTransform: "uppercase",
  },
  giftPrice: {
    fontSize: FontSize.xs,
    fontWeight: "700",
    color: Colors.textPrimary,
    marginTop: 2,
  },
  giftLabel: {
    fontSize: 9,
    color: Colors.textSecondary,
  },
  giftSendBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#E040FB",
    paddingVertical: 14,
    borderRadius: BorderRadius.full,
    marginBottom: 8,
  },
  giftSendText: {
    fontSize: FontSize.sm,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  giftNote: {
    fontSize: 10,
    color: Colors.textMuted,
    textAlign: "center",
    lineHeight: 14,
  },
  giftRecipientBadge: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: Colors.success + "15",
    borderRadius: BorderRadius.full,
    alignSelf: "center",
  },
  giftRecipientText: {
    fontSize: FontSize.xs,
    fontWeight: "600",
    color: Colors.success,
  },

  // Contact Picker Modal
  contactPickerOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "flex-end",
  },
  contactPickerSheet: {
    backgroundColor: Colors.surfaceCard,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: Spacing.lg,
    maxHeight: "70%",
    borderWidth: 1,
    borderColor: "#E040FB" + "30",
  },
  contactPickerHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  contactPickerTitle: {
    fontSize: FontSize.xl,
    fontWeight: "800",
    color: Colors.textPrimary,
  },
  contactPickerSubtitle: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  contactSearchWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surfaceElevated,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: Spacing.md,
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  contactSearchInput: {
    flex: 1,
    fontSize: FontSize.sm,
    color: Colors.textPrimary,
    padding: 0,
  },
  contactPickerList: {
    maxHeight: 400,
  },
  contactPickerItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  contactPickerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.surfaceElevated,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#E040FB" + "40",
  },
  contactPickerAvatarText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#E040FB",
  },
  contactPickerOnline: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.success,
    borderWidth: 2,
    borderColor: Colors.surfaceCard,
  },
  contactPickerName: {
    fontSize: FontSize.sm,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  contactPickerLang: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },

  // Credit Received Toast
  creditToast: {
    position: "absolute",
    top: 0,
    left: 16,
    right: 16,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surfaceCard,
    borderRadius: BorderRadius.xl,
    padding: 14,
    gap: 12,
    borderWidth: 1,
    borderColor: "#E040FB" + "40",
    shadowColor: "#E040FB",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
    zIndex: 999,
  },
  creditToastIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#E040FB" + "20",
    alignItems: "center",
    justifyContent: "center",
  },
  creditToastTitle: {
    fontSize: FontSize.sm,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  creditToastMsg: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },

  // Purchase Confirmation Modal
  purchaseOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.75)",
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.xl,
  },
  purchaseModal: {
    backgroundColor: Colors.surfaceCard,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    width: "100%",
    maxWidth: 320,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: "hidden",
  },
  confettiPiece: {
    position: "absolute",
    width: 8,
    height: 8,
    borderRadius: 2,
  },
  purchaseSuccessIcon: {
    marginBottom: Spacing.md,
  },
  purchaseTitle: {
    fontSize: FontSize.xl,
    fontWeight: "800",
    color: Colors.textPrimary,
    marginBottom: 6,
  },
  purchaseProduct: {
    fontSize: FontSize.md,
    color: Colors.secondary,
    fontWeight: "600",
    marginBottom: Spacing.md,
  },
  purchaseReceipt: {
    width: "100%",
    backgroundColor: Colors.surfaceElevated,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  receiptRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
  },
  receiptLabel: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  receiptValue: {
    fontSize: FontSize.sm,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  receiptDivider: {
    height: 1,
    backgroundColor: Colors.border,
  },
  receiptStatusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: Colors.success + "20",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  receiptStatusText: {
    fontSize: 11,
    fontWeight: "600",
    color: Colors.success,
  },
  purchaseDoneBtn: {
    backgroundColor: Colors.secondary,
    paddingVertical: 14,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.full,
    width: "100%",
    alignItems: "center",
  },
  purchaseDoneText: {
    fontSize: FontSize.md,
    fontWeight: "700",
    color: "#FFFFFF",
  },
});
