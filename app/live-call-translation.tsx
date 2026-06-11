import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Platform,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import { ScreenContainer } from "@/components/screen-container";
import { Colors, Spacing, BorderRadius, FontSize } from "../constants/Colors";

// ─── TYPES ───────────────────────────────────────────────────────────────────
type PlanTier = "free" | "basic" | "pro" | "unlimited";
type CallType = "phone" | "facetime" | "whatsapp" | "telegram" | "zoom";

type PricingPlan = {
  id: PlanTier;
  name: string;
  price: string;
  period: string;
  minutes: string;
  features: string[];
  popular?: boolean;
};

type SupportedApp = {
  id: CallType;
  name: string;
  icon: string;
  supported: boolean;
  note?: string;
};

// ─── CONSTANTS ───────────────────────────────────────────────────────────────
const PRICING_PLANS: PricingPlan[] = [
  {
    id: "free",
    name: "Try It",
    price: "$0",
    period: "",
    minutes: "5 min/month",
    features: ["5 minutes free trial", "1 language pair", "Text captions only"],
  },
  {
    id: "basic",
    name: "Basic",
    price: "$4.99",
    period: "/month",
    minutes: "60 min/month",
    features: ["60 minutes/month", "5 language pairs", "Real-time captions", "Post-call vocabulary"],
  },
  {
    id: "pro",
    name: "Pro",
    price: "$12.99",
    period: "/month",
    minutes: "300 min/month",
    features: ["300 minutes/month", "All 17+ languages", "Voice translation overlay", "Call recording + transcript", "Vocabulary extraction"],
    popular: true,
  },
  {
    id: "unlimited",
    name: "Unlimited",
    price: "$24.99",
    period: "/month",
    minutes: "Unlimited",
    features: ["Unlimited minutes", "All languages + dialects", "Voice translation overlay", "Call recording + transcript", "Priority processing", "Business/conference calls"],
  },
];

const SUPPORTED_APPS: SupportedApp[] = [
  { id: "phone", name: "Phone Calls", icon: "call", supported: true },
  { id: "facetime", name: "FaceTime", icon: "videocam", supported: true },
  { id: "whatsapp", name: "WhatsApp", icon: "logo-whatsapp", supported: true, note: "Audio calls only" },
  { id: "telegram", name: "Telegram", icon: "paper-plane", supported: true, note: "Audio calls only" },
  { id: "zoom", name: "Zoom / Teams", icon: "people", supported: true, note: "Coming soon" },
];

// ─── COMPONENT ───────────────────────────────────────────────────────────────
export default function LiveCallTranslationScreen() {
  const [isEnabled, setIsEnabled] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<PlanTier>("pro");
  const [showSetup, setShowSetup] = useState(false);
  const [autoTranslate, setAutoTranslate] = useState(true);
  const [showCaptions, setShowCaptions] = useState(true);
  const [voiceOverlay, setVoiceOverlay] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState("Spanish");

  const handleEnableToggle = (value: boolean) => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (value) {
      setShowSetup(true);
    } else {
      setIsEnabled(false);
    }
  };

  const handleActivate = () => {
    if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setIsEnabled(true);
    setShowSetup(false);
    Alert.alert(
      "Live Translation Activated",
      "ConnectWorld AI will now translate your phone calls in real-time. You'll see captions during calls and can enable voice overlay in settings.",
      [{ text: "Got it" }]
    );
  };

  const handleSelectPlan = (plan: PlanTier) => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedPlan(plan);
  };

  // ─── SETUP FLOW ──────────────────────────────────────────────────────────────
  if (showSetup) {
    return (
      <ScreenContainer>
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
          <View style={styles.setupHeader}>
            <TouchableOpacity onPress={() => setShowSetup(false)}>
              <Ionicons name="close" size={24} color={Colors.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.setupTitle}>Activate Live Translation</Text>
            <View style={{ width: 24 }} />
          </View>

          {/* How it works */}
          <View style={styles.howItWorks}>
            <Text style={styles.sectionTitle}>How It Works</Text>
            <View style={styles.howStep}>
              <View style={styles.howStepIcon}>
                <Ionicons name="call" size={20} color={Colors.secondary} />
              </View>
              <View style={styles.howStepContent}>
                <Text style={styles.howStepTitle}>Receive or make a call</Text>
                <Text style={styles.howStepDesc}>Works with any phone call, FaceTime, or supported app</Text>
              </View>
            </View>
            <View style={styles.howStepConnector} />
            <View style={styles.howStep}>
              <View style={styles.howStepIcon}>
                <Ionicons name="ear" size={20} color={Colors.gold} />
              </View>
              <View style={styles.howStepContent}>
                <Text style={styles.howStepTitle}>AI listens in real-time</Text>
                <Text style={styles.howStepDesc}>Detects the language being spoken and processes audio</Text>
              </View>
            </View>
            <View style={styles.howStepConnector} />
            <View style={styles.howStep}>
              <View style={styles.howStepIcon}>
                <Ionicons name="text" size={20} color={Colors.success} />
              </View>
              <View style={styles.howStepContent}>
                <Text style={styles.howStepTitle}>See translation instantly</Text>
                <Text style={styles.howStepDesc}>Captions appear on screen, or hear voice translation in your ear</Text>
              </View>
            </View>
            <View style={styles.howStepConnector} />
            <View style={styles.howStep}>
              <View style={styles.howStepIcon}>
                <Ionicons name="book" size={20} color={Colors.accent} />
              </View>
              <View style={styles.howStepContent}>
                <Text style={styles.howStepTitle}>Learn after the call</Text>
                <Text style={styles.howStepDesc}>Get vocabulary breakdown and save phrases to your deck</Text>
              </View>
            </View>
          </View>

          {/* Permissions needed */}
          <View style={styles.permissionsCard}>
            <Text style={styles.sectionTitle}>Permissions Needed</Text>
            <View style={styles.permItem}>
              <Ionicons name="mic" size={18} color={Colors.textSecondary} />
              <Text style={styles.permText}>Microphone access during calls</Text>
              <Ionicons name="checkmark-circle" size={18} color={Colors.success} />
            </View>
            <View style={styles.permItem}>
              <Ionicons name="notifications" size={18} color={Colors.textSecondary} />
              <Text style={styles.permText}>Notification overlay for captions</Text>
              <Ionicons name="checkmark-circle" size={18} color={Colors.success} />
            </View>
            <View style={styles.permItem}>
              <Ionicons name="shield-checkmark" size={18} color={Colors.textSecondary} />
              <Text style={styles.permText}>CallKit integration (iOS)</Text>
              <Ionicons name="checkmark-circle" size={18} color={Colors.success} />
            </View>
          </View>

          {/* Privacy note */}
          <View style={styles.privacyNote}>
            <Ionicons name="lock-closed" size={16} color={Colors.secondary} />
            <Text style={styles.privacyText}>
              Audio is processed in real-time and never stored on our servers. All translations are encrypted end-to-end.
            </Text>
          </View>

          <TouchableOpacity style={styles.activateBtn} onPress={handleActivate}>
            <Ionicons name="flash" size={18} color="#FFF" />
            <Text style={styles.activateBtnText}>Activate Live Translation</Text>
          </TouchableOpacity>
        </ScrollView>
      </ScreenContainer>
    );
  }

  // ─── MAIN VIEW ──────────────────────────────────────────────────────────────
  return (
    <ScreenContainer>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
          </TouchableOpacity>
          <View>
            <Text style={styles.headerTitle}>Live Call Translation</Text>
            <Text style={styles.headerSubtitle}>Translate calls in real-time</Text>
          </View>
          <View style={styles.premiumBadge}>
            <Ionicons name="diamond" size={12} color={Colors.gold} />
            <Text style={styles.premiumText}>PRO</Text>
          </View>
        </View>

        {/* Hero Card */}
        <View style={styles.heroCard}>
          <View style={styles.heroIconRow}>
            <View style={styles.heroIcon}>
              <Ionicons name="call" size={28} color="#FFF" />
            </View>
            <View style={styles.heroArrow}>
              <Ionicons name="flash" size={20} color={Colors.gold} />
            </View>
            <View style={[styles.heroIcon, { backgroundColor: Colors.success }]}>
              <Ionicons name="language" size={28} color="#FFF" />
            </View>
          </View>
          <Text style={styles.heroTitle}>Translate Any Phone Call</Text>
          <Text style={styles.heroDesc}>
            Get real-time translation during regular phone calls, FaceTime, and WhatsApp — right on your device
          </Text>
          <View style={styles.heroToggle}>
            <Text style={styles.heroToggleLabel}>{isEnabled ? "Active" : "Inactive"}</Text>
            <Switch
              value={isEnabled}
              onValueChange={handleEnableToggle}
              trackColor={{ false: Colors.border, true: Colors.secondary }}
              thumbColor="#FFF"
            />
          </View>
        </View>

        {/* Usage Stats (when enabled) */}
        {isEnabled && (
          <View style={styles.usageCard}>
            <Text style={styles.usageTitle}>This Month</Text>
            <View style={styles.usageStats}>
              <View style={styles.usageStat}>
                <Text style={styles.usageValue}>47</Text>
                <Text style={styles.usageLabel}>Minutes Used</Text>
              </View>
              <View style={styles.usageDivider} />
              <View style={styles.usageStat}>
                <Text style={styles.usageValue}>253</Text>
                <Text style={styles.usageLabel}>Remaining</Text>
              </View>
              <View style={styles.usageDivider} />
              <View style={styles.usageStat}>
                <Text style={styles.usageValue}>12</Text>
                <Text style={styles.usageLabel}>Calls</Text>
              </View>
            </View>
            <View style={styles.usageBar}>
              <View style={[styles.usageBarFill, { width: "16%" }]} />
            </View>
          </View>
        )}

        {/* Settings (when enabled) */}
        {isEnabled && (
          <View style={styles.settingsSection}>
            <Text style={styles.sectionTitle}>Translation Settings</Text>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Auto-detect language</Text>
                <Text style={styles.settingDesc}>Automatically detect what language is being spoken</Text>
              </View>
              <Switch
                value={autoTranslate}
                onValueChange={setAutoTranslate}
                trackColor={{ false: Colors.border, true: Colors.secondary }}
                thumbColor="#FFF"
              />
            </View>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Show captions</Text>
                <Text style={styles.settingDesc}>Display translated text on screen during calls</Text>
              </View>
              <Switch
                value={showCaptions}
                onValueChange={setShowCaptions}
                trackColor={{ false: Colors.border, true: Colors.secondary }}
                thumbColor="#FFF"
              />
            </View>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Voice overlay</Text>
                <Text style={styles.settingDesc}>Hear translation spoken in your ear (Pro+)</Text>
              </View>
              <Switch
                value={voiceOverlay}
                onValueChange={(v) => {
                  if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setVoiceOverlay(v);
                }}
                trackColor={{ false: Colors.border, true: Colors.secondary }}
                thumbColor="#FFF"
              />
            </View>
            <TouchableOpacity style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Translate to</Text>
                <Text style={styles.settingDesc}>Your preferred language for translations</Text>
              </View>
              <View style={styles.langPill}>
                <Text style={styles.langPillText}>🇺🇸 {selectedLanguage}</Text>
                <Ionicons name="chevron-forward" size={14} color={Colors.textSecondary} />
              </View>
            </TouchableOpacity>
          </View>
        )}

        {/* Supported Apps */}
        <View style={styles.appsSection}>
          <Text style={styles.sectionTitle}>Supported Apps</Text>
          {SUPPORTED_APPS.map((app) => (
            <View key={app.id} style={styles.appRow}>
              <View style={styles.appIcon}>
                <Ionicons name={app.icon as any} size={20} color={app.supported ? Colors.secondary : Colors.textMuted} />
              </View>
              <View style={styles.appInfo}>
                <Text style={styles.appName}>{app.name}</Text>
                {app.note && <Text style={styles.appNote}>{app.note}</Text>}
              </View>
              {app.supported ? (
                <View style={styles.supportedBadge}>
                  <Ionicons name="checkmark" size={14} color={Colors.success} />
                  <Text style={styles.supportedText}>Supported</Text>
                </View>
              ) : (
                <Text style={styles.comingSoonText}>Coming Soon</Text>
              )}
            </View>
          ))}
        </View>

        {/* Pricing */}
        <View style={styles.pricingSection}>
          <Text style={styles.sectionTitle}>Choose Your Plan</Text>
          <Text style={styles.pricingSubtitle}>Pay only for what you use</Text>
          {PRICING_PLANS.map((plan) => (
            <TouchableOpacity
              key={plan.id}
              style={[
                styles.planCard,
                selectedPlan === plan.id && styles.planCardSelected,
                plan.popular && styles.planCardPopular,
              ]}
              onPress={() => handleSelectPlan(plan.id)}
              activeOpacity={0.7}
            >
              {plan.popular && (
                <View style={styles.popularBadge}>
                  <Text style={styles.popularBadgeText}>MOST POPULAR</Text>
                </View>
              )}
              <View style={styles.planHeader}>
                <View>
                  <Text style={[styles.planName, selectedPlan === plan.id && styles.planNameSelected]}>{plan.name}</Text>
                  <Text style={styles.planMinutes}>{plan.minutes}</Text>
                </View>
                <View style={styles.planPriceCol}>
                  <Text style={[styles.planPrice, selectedPlan === plan.id && styles.planPriceSelected]}>{plan.price}</Text>
                  {plan.period && <Text style={styles.planPeriod}>{plan.period}</Text>}
                </View>
              </View>
              <View style={styles.planFeatures}>
                {plan.features.map((f, i) => (
                  <View key={i} style={styles.planFeatureRow}>
                    <Ionicons name="checkmark" size={14} color={selectedPlan === plan.id ? Colors.secondary : Colors.success} />
                    <Text style={styles.planFeatureText}>{f}</Text>
                  </View>
                ))}
              </View>
              {selectedPlan === plan.id && (
                <View style={styles.selectedIndicator}>
                  <Ionicons name="checkmark-circle" size={20} color={Colors.secondary} />
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Subscribe CTA */}
        <TouchableOpacity style={styles.subscribeCta} onPress={() => router.push("/checkout" as any)}>
          <Text style={styles.subscribeCtaText}>Subscribe to {PRICING_PLANS.find(p => p.id === selectedPlan)?.name}</Text>
          <Text style={styles.subscribeCtaPrice}>{PRICING_PLANS.find(p => p.id === selectedPlan)?.price}{PRICING_PLANS.find(p => p.id === selectedPlan)?.period}</Text>
        </TouchableOpacity>

        {/* iOS Setup Instructions */}
        <View style={styles.setupSection}>
          <Text style={styles.sectionTitle}>iOS Setup</Text>
          <View style={styles.setupStep}>
            <View style={styles.setupStepNum}><Text style={styles.setupStepNumText}>1</Text></View>
            <View style={styles.setupStepContent}>
              <Text style={styles.setupStepTitle}>Enable in Settings</Text>
              <Text style={styles.setupStepDesc}>Go to Settings → Phone → Call Translation → ConnectWorld AI</Text>
            </View>
          </View>
          <View style={styles.setupStep}>
            <View style={styles.setupStepNum}><Text style={styles.setupStepNumText}>2</Text></View>
            <View style={styles.setupStepContent}>
              <Text style={styles.setupStepTitle}>Grant permissions</Text>
              <Text style={styles.setupStepDesc}>Allow microphone access and notification overlay during calls</Text>
            </View>
          </View>
          <View style={styles.setupStep}>
            <View style={styles.setupStepNum}><Text style={styles.setupStepNumText}>3</Text></View>
            <View style={styles.setupStepContent}>
              <Text style={styles.setupStepTitle}>Make or receive a call</Text>
              <Text style={styles.setupStepDesc}>Translation starts automatically when a foreign language is detected</Text>
            </View>
          </View>
        </View>

        {/* Demo Preview */}
        <View style={styles.demoCard}>
          <Text style={styles.demoTitle}>Live Preview</Text>
          <Text style={styles.demoSubtitle}>What you'll see during a call</Text>
          <View style={styles.demoCallUI}>
            <View style={styles.demoCallHeader}>
              <Ionicons name="call" size={14} color={Colors.success} />
              <Text style={styles.demoCallStatus}>On call with Maria • 2:34</Text>
            </View>
            <View style={styles.demoCaptionBubble}>
              <Text style={styles.demoCaptionOriginal}>Oye, ¿puedes venir a la fiesta esta noche?</Text>
              <View style={styles.demoCaptionDivider} />
              <Text style={styles.demoCaptionTranslated}>Hey, can you come to the party tonight?</Text>
            </View>
            <View style={styles.demoVocabRow}>
              <View style={styles.demoVocabChip}>
                <Text style={styles.demoVocabWord}>fiesta</Text>
                <Text style={styles.demoVocabTrans}>party</Text>
              </View>
              <View style={styles.demoVocabChip}>
                <Text style={styles.demoVocabWord}>esta noche</Text>
                <Text style={styles.demoVocabTrans}>tonight</Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

// ─── STYLES ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 100 },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, gap: 12 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.surfaceCard, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: Colors.border },
  headerTitle: { fontSize: 20, fontWeight: "800", color: Colors.textPrimary },
  headerSubtitle: { fontSize: FontSize.sm, color: Colors.textSecondary },
  premiumBadge: { marginLeft: "auto", flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 10, paddingVertical: 4, borderRadius: BorderRadius.full, backgroundColor: Colors.goldGlow, borderWidth: 1, borderColor: Colors.goldBorder },
  premiumText: { fontSize: 10, fontWeight: "800", color: Colors.gold },
  // Hero
  heroCard: { marginHorizontal: Spacing.lg, marginBottom: Spacing.md, padding: 20, backgroundColor: Colors.surfaceCard, borderRadius: BorderRadius.lg, borderWidth: 1, borderColor: Colors.border, alignItems: "center" },
  heroIconRow: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 14 },
  heroIcon: { width: 56, height: 56, borderRadius: 28, backgroundColor: Colors.secondary, alignItems: "center", justifyContent: "center", shadowColor: Colors.glow, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.6, shadowRadius: 12, elevation: 8 },
  heroArrow: { width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.goldGlow, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: Colors.goldBorder },
  heroTitle: { fontSize: 20, fontWeight: "800", color: Colors.textPrimary, textAlign: "center", marginBottom: 6 },
  heroDesc: { fontSize: FontSize.sm, color: Colors.textSecondary, textAlign: "center", lineHeight: 20, marginBottom: 16 },
  heroToggle: { flexDirection: "row", alignItems: "center", gap: 10 },
  heroToggleLabel: { fontSize: FontSize.sm, fontWeight: "600", color: Colors.textSecondary },
  // Usage
  usageCard: { marginHorizontal: Spacing.lg, marginBottom: Spacing.md, padding: 16, backgroundColor: Colors.surfaceCard, borderRadius: BorderRadius.lg, borderWidth: 1, borderColor: Colors.border },
  usageTitle: { fontSize: FontSize.sm, fontWeight: "600", color: Colors.textSecondary, marginBottom: 12 },
  usageStats: { flexDirection: "row", justifyContent: "space-around", marginBottom: 12 },
  usageStat: { alignItems: "center" },
  usageValue: { fontSize: 22, fontWeight: "800", color: Colors.textPrimary },
  usageLabel: { fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  usageDivider: { width: 1, height: 30, backgroundColor: Colors.border },
  usageBar: { height: 6, backgroundColor: Colors.primary, borderRadius: 3 },
  usageBarFill: { height: 6, backgroundColor: Colors.secondary, borderRadius: 3 },
  // Settings
  settingsSection: { marginHorizontal: Spacing.lg, marginBottom: Spacing.md },
  sectionTitle: { fontSize: FontSize.md, fontWeight: "700", color: Colors.textPrimary, marginBottom: 12 },
  settingRow: { flexDirection: "row", alignItems: "center", paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: Colors.border },
  settingInfo: { flex: 1, marginRight: 12 },
  settingLabel: { fontSize: FontSize.sm, fontWeight: "600", color: Colors.textPrimary },
  settingDesc: { fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  langPill: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 10, paddingVertical: 6, backgroundColor: Colors.surfaceCard, borderRadius: BorderRadius.full, borderWidth: 1, borderColor: Colors.border },
  langPillText: { fontSize: 12, fontWeight: "600", color: Colors.textPrimary },
  // Apps
  appsSection: { marginHorizontal: Spacing.lg, marginBottom: Spacing.lg },
  appRow: { flexDirection: "row", alignItems: "center", paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.border, gap: 12 },
  appIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: Colors.primary, alignItems: "center", justifyContent: "center" },
  appInfo: { flex: 1 },
  appName: { fontSize: FontSize.sm, fontWeight: "600", color: Colors.textPrimary },
  appNote: { fontSize: 11, color: Colors.textMuted, marginTop: 1 },
  supportedBadge: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 4, backgroundColor: Colors.greenGlow, borderRadius: BorderRadius.full, borderWidth: 1, borderColor: Colors.greenBorder },
  supportedText: { fontSize: 10, fontWeight: "600", color: Colors.success },
  comingSoonText: { fontSize: 11, color: Colors.textMuted, fontStyle: "italic" },
  // Pricing
  pricingSection: { marginHorizontal: Spacing.lg, marginBottom: Spacing.md },
  pricingSubtitle: { fontSize: FontSize.sm, color: Colors.textSecondary, marginBottom: 14, marginTop: -6 },
  planCard: { padding: 16, backgroundColor: Colors.surfaceCard, borderRadius: BorderRadius.lg, borderWidth: 1.5, borderColor: Colors.border, marginBottom: 10, position: "relative" },
  planCardSelected: { borderColor: Colors.secondary, backgroundColor: Colors.glowSubtle },
  planCardPopular: { borderColor: Colors.gold },
  popularBadge: { position: "absolute", top: -8, right: 12, paddingHorizontal: 8, paddingVertical: 3, backgroundColor: Colors.gold, borderRadius: 4 },
  popularBadgeText: { fontSize: 9, fontWeight: "800", color: "#000" },
  planHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 },
  planName: { fontSize: FontSize.md, fontWeight: "700", color: Colors.textPrimary },
  planNameSelected: { color: Colors.secondary },
  planMinutes: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  planPriceCol: { alignItems: "flex-end" },
  planPrice: { fontSize: 22, fontWeight: "800", color: Colors.textPrimary },
  planPriceSelected: { color: Colors.secondary },
  planPeriod: { fontSize: 11, color: Colors.textMuted },
  planFeatures: { gap: 6 },
  planFeatureRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  planFeatureText: { fontSize: 12, color: Colors.textSecondary },
  selectedIndicator: { position: "absolute", top: 12, right: 12 },
  // Subscribe CTA
  subscribeCta: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginHorizontal: Spacing.lg, marginBottom: Spacing.lg, paddingHorizontal: 20, paddingVertical: 16, backgroundColor: Colors.secondary, borderRadius: BorderRadius.lg, shadowColor: Colors.glow, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.6, shadowRadius: 12, elevation: 10 },
  subscribeCtaText: { fontSize: FontSize.md, fontWeight: "700", color: "#FFF" },
  subscribeCtaPrice: { fontSize: FontSize.md, fontWeight: "800", color: "#FFF" },
  // Setup
  setupSection: { marginHorizontal: Spacing.lg, marginBottom: Spacing.lg },
  setupStep: { flexDirection: "row", gap: 12, marginBottom: 14 },
  setupStepNum: { width: 28, height: 28, borderRadius: 14, backgroundColor: Colors.secondary, alignItems: "center", justifyContent: "center" },
  setupStepNumText: { fontSize: 13, fontWeight: "800", color: "#FFF" },
  setupStepContent: { flex: 1 },
  setupStepTitle: { fontSize: FontSize.sm, fontWeight: "700", color: Colors.textPrimary },
  setupStepDesc: { fontSize: 12, color: Colors.textSecondary, marginTop: 2, lineHeight: 18 },
  // Demo
  demoCard: { marginHorizontal: Spacing.lg, marginBottom: Spacing.lg, padding: 16, backgroundColor: Colors.surfaceCard, borderRadius: BorderRadius.lg, borderWidth: 1, borderColor: Colors.border },
  demoTitle: { fontSize: FontSize.md, fontWeight: "700", color: Colors.textPrimary },
  demoSubtitle: { fontSize: 12, color: Colors.textSecondary, marginBottom: 12 },
  demoCallUI: { backgroundColor: Colors.primary, borderRadius: BorderRadius.md, padding: 12 },
  demoCallHeader: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 10 },
  demoCallStatus: { fontSize: 12, color: Colors.success, fontWeight: "600" },
  demoCaptionBubble: { backgroundColor: Colors.surfaceCard, borderRadius: BorderRadius.md, padding: 12, marginBottom: 10, borderWidth: 1, borderColor: Colors.border },
  demoCaptionOriginal: { fontSize: FontSize.sm, color: Colors.textPrimary, lineHeight: 20 },
  demoCaptionDivider: { height: 1, backgroundColor: Colors.border, marginVertical: 8 },
  demoCaptionTranslated: { fontSize: FontSize.sm, color: Colors.secondary, fontWeight: "600", lineHeight: 20 },
  demoVocabRow: { flexDirection: "row", gap: 8 },
  demoVocabChip: { paddingHorizontal: 10, paddingVertical: 6, backgroundColor: Colors.surfaceCard, borderRadius: BorderRadius.md, borderWidth: 1, borderColor: Colors.border },
  demoVocabWord: { fontSize: 12, fontWeight: "700", color: Colors.textPrimary },
  demoVocabTrans: { fontSize: 10, color: Colors.textMuted },
  // Setup Flow
  setupHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md },
  setupTitle: { fontSize: 18, fontWeight: "700", color: Colors.textPrimary },
  howItWorks: { marginHorizontal: Spacing.lg, marginBottom: Spacing.lg },
  howStep: { flexDirection: "row", gap: 12, alignItems: "center" },
  howStepIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.glowSubtle, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: Colors.glowBorder },
  howStepContent: { flex: 1 },
  howStepTitle: { fontSize: FontSize.sm, fontWeight: "700", color: Colors.textPrimary },
  howStepDesc: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  howStepConnector: { width: 2, height: 20, backgroundColor: Colors.border, marginLeft: 21 },
  permissionsCard: { marginHorizontal: Spacing.lg, marginBottom: Spacing.md, padding: 16, backgroundColor: Colors.surfaceCard, borderRadius: BorderRadius.lg, borderWidth: 1, borderColor: Colors.border },
  permItem: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 8 },
  permText: { flex: 1, fontSize: FontSize.sm, color: Colors.textPrimary },
  privacyNote: { flexDirection: "row", alignItems: "flex-start", gap: 8, marginHorizontal: Spacing.lg, marginBottom: Spacing.lg, padding: 12, backgroundColor: Colors.glowSubtle, borderRadius: BorderRadius.md, borderWidth: 1, borderColor: Colors.glowBorder },
  privacyText: { flex: 1, fontSize: 12, color: Colors.textSecondary, lineHeight: 18 },
  activateBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginHorizontal: Spacing.lg, paddingVertical: 16, backgroundColor: Colors.secondary, borderRadius: BorderRadius.lg, shadowColor: Colors.glow, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.6, shadowRadius: 12, elevation: 10 },
  activateBtnText: { fontSize: FontSize.md, fontWeight: "700", color: "#FFF" },
});
