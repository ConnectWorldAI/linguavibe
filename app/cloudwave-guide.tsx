import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ScrollView,
  Platform,
  Animated,
  Share,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";
import { Colors, Spacing, BorderRadius, FontSize } from "@/constants/Colors";

const { width } = Dimensions.get("window");

// ─── TYPES ───────────────────────────────────────────────────────────────────

type GuideStep =
  | "welcome"
  | "choices"
  | "voice-training"
  | "make-call"
  | "translate-song"
  | "exploring"
  | "call-limit"
  | "invite";

interface ChoiceOption {
  id: string;
  icon: string;
  title: string;
  subtitle: string;
  highlight?: boolean;
  step: GuideStep;
}

// ─── CONSTANTS ───────────────────────────────────────────────────────────────

const CHOICES: ChoiceOption[] = [
  {
    id: "voice",
    icon: "mic",
    title: "Train Your Voice",
    subtitle: "Record voice memos and set up your voice profile",
    step: "voice-training",
  },
  {
    id: "call",
    icon: "videocam",
    title: "Make Your First Call",
    subtitle: "Experience live translation on a video/voice call",
    highlight: true,
    step: "make-call",
  },
  {
    id: "song",
    icon: "musical-notes",
    title: "Translate a Song",
    subtitle: "Turn any song into your language — same beat, new words",
    step: "translate-song",
  },
  {
    id: "explore",
    icon: "compass",
    title: "Just Exploring",
    subtitle: "Look around on your own — I'm here when you need me",
    step: "exploring",
  },
];

const SUBSCRIPTION_TIERS = [
  {
    id: "free",
    name: "Free",
    price: "$0",
    features: ["1 language", "5 min call limit", "1 song translation", "Basic features"],
    color: Colors.textSecondary,
  },
  {
    id: "pro",
    name: "Pro",
    price: "$9.99/mo",
    features: ["5 languages + dialects", "30 min calls/month", "Unlimited songs", "Live translation"],
    color: Colors.secondary,
    popular: true,
  },
  {
    id: "premium",
    name: "Premium",
    price: "$24.99/mo",
    features: ["Unlimited everything", "Custom AI teacher", "Priority support", "No ads"],
    color: Colors.gold,
  },
];

// ─── COMPONENT ───────────────────────────────────────────────────────────────

export default function CloudWaveGuideScreen() {
  const [step, setStep] = useState<GuideStep>("welcome");
  const [typedText, setTypedText] = useState("");
  const [showChoices, setShowChoices] = useState(false);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  // Pulse animation for the CloudWave orb
  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.08, duration: 1200, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1200, useNativeDriver: true }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  // Typing animation for welcome message
  useEffect(() => {
    if (step === "welcome") {
      const message = "Hey! I'm CloudWave, your AI guide. Welcome to ConnectWorld AI! 🌊";
      let index = 0;
      setTypedText("");
      const timer = setInterval(() => {
        if (index < message.length) {
          setTypedText(message.slice(0, index + 1));
          index++;
        } else {
          clearInterval(timer);
          // After typing completes, show choices
          setTimeout(() => {
            setStep("choices");
            Animated.parallel([
              Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
              Animated.timing(slideAnim, { toValue: 0, duration: 400, useNativeDriver: true }),
            ]).start();
            setShowChoices(true);
          }, 600);
        }
      }, 35);
      return () => clearInterval(timer);
    }
  }, [step === "welcome"]);

  const handleChoice = (choice: ChoiceOption) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    setStep(choice.step);
  };

  const handleSkipToApp = async () => {
    await AsyncStorage.setItem("@cloudwave_guide_complete", "true");
    router.replace("/(tabs)");
  };

  const handleGoToFeature = async (route: string) => {
    await AsyncStorage.setItem("@cloudwave_guide_complete", "true");
    router.replace(route as any);
  };

  const handleInviteFriend = async () => {
    try {
      await Share.share({
        message: `Join me on ConnectWorld AI! Download the app and let's practice languages together with live translation calls, AI teachers, and more! 🌍🎵\n\nhttps://connectworld.ai/download`,
      });
    } catch (e) { /* ignore */ }
  };

  // ─── RENDER STEPS ────────────────────────────────────────────────────────────

  const renderWelcome = () => (
    <View style={styles.centerContent}>
      {/* CloudWave Orb */}
      <Animated.View style={[styles.orbContainer, { transform: [{ scale: pulseAnim }] }]}>
        <View style={styles.orb}>
          <Ionicons name="cloud" size={48} color={Colors.secondary} />
        </View>
        <View style={styles.orbGlow} />
      </Animated.View>

      {/* Typing message */}
      <View style={styles.messageBubble}>
        <Text style={styles.messageText}>{typedText}</Text>
        {typedText.length < 60 && <View style={styles.cursor} />}
      </View>
    </View>
  );

  const renderChoices = () => (
    <ScrollView
      style={styles.scrollContent}
      contentContainerStyle={styles.scrollInner}
      showsVerticalScrollIndicator={false}
    >
      {/* CloudWave message */}
      <View style={styles.agentSection}>
        <View style={styles.miniOrb}>
          <Ionicons name="cloud" size={20} color={Colors.secondary} />
        </View>
        <View style={styles.agentBubble}>
          <Text style={styles.agentText}>
            What would you like to do first? I can guide you through anything, or you can explore on your own.
          </Text>
        </View>
      </View>

      {/* Choice cards */}
      <Animated.View style={[styles.choicesGrid, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
        {CHOICES.map((choice) => (
          <TouchableOpacity
            key={choice.id}
            style={[styles.choiceCard, choice.highlight && styles.choiceCardHighlight]}
            onPress={() => handleChoice(choice)}
            activeOpacity={0.7}
          >
            <View style={[styles.choiceIcon, choice.highlight && styles.choiceIconHighlight]}>
              <Ionicons
                name={choice.icon as any}
                size={28}
                color={choice.highlight ? Colors.secondary : Colors.textPrimary}
              />
            </View>
            <Text style={styles.choiceTitle}>{choice.title}</Text>
            <Text style={styles.choiceSubtitle}>{choice.subtitle}</Text>
            {choice.highlight && (
              <View style={styles.recommendedBadge}>
                <Ionicons name="sparkles" size={10} color={Colors.gold} />
                <Text style={styles.recommendedText}>Recommended</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </Animated.View>

      {/* Membership prompt */}
      <View style={styles.membershipSection}>
        <Text style={styles.membershipTitle}>Or choose your plan</Text>
        <Text style={styles.membershipSubtitle}>
          Start free, upgrade anytime for more features
        </Text>
        <View style={styles.tiersRow}>
          {SUBSCRIPTION_TIERS.map((tier) => (
            <TouchableOpacity
              key={tier.id}
              style={[
                styles.tierCard,
                tier.popular && styles.tierCardPopular,
              ]}
              onPress={() => handleGoToFeature("/subscription")}
            >
              {tier.popular && (
                <View style={styles.popularBadge}>
                  <Text style={styles.popularText}>Popular</Text>
                </View>
              )}
              <Text style={[styles.tierName, { color: tier.color }]}>{tier.name}</Text>
              <Text style={styles.tierPrice}>{tier.price}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </ScrollView>
  );

  const renderVoiceTraining = () => (
    <View style={styles.featureContent}>
      <View style={styles.featureHeader}>
        <View style={styles.featureIconLarge}>
          <Ionicons name="mic" size={40} color={Colors.secondary} />
        </View>
        <Text style={styles.featureTitle}>Train Your Voice</Text>
        <Text style={styles.featureSubtitle}>
          Record a quick voice memo so your AI teacher can greet you by name and learn your speaking style.
        </Text>
      </View>

      <View style={styles.agentSection}>
        <View style={styles.miniOrb}>
          <Ionicons name="cloud" size={20} color={Colors.secondary} />
        </View>
        <View style={styles.agentBubble}>
          <Text style={styles.agentText}>
            Let's set up your voice profile! This helps me understand your accent and personalize your learning experience.
          </Text>
        </View>
      </View>

      <TouchableOpacity
        style={styles.primaryButton}
        onPress={() => handleGoToFeature("/name-recording")}
      >
        <Ionicons name="mic" size={20} color="#060912" />
        <Text style={styles.primaryButtonText}>Start Voice Training</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.secondaryButton} onPress={() => setStep("choices")}>
        <Text style={styles.secondaryButtonText}>Back to choices</Text>
      </TouchableOpacity>
    </View>
  );

  const renderMakeCall = () => (
    <View style={styles.featureContent}>
      <View style={styles.featureHeader}>
        <View style={[styles.featureIconLarge, { backgroundColor: Colors.success + "20" }]}>
          <Ionicons name="videocam" size={40} color={Colors.success} />
        </View>
        <Text style={styles.featureTitle}>Live Translation Call</Text>
        <Text style={styles.featureSubtitle}>
          Make a free video or voice call with real-time translation. Both people need a ConnectWorld AI account.
        </Text>
      </View>

      <View style={styles.agentSection}>
        <View style={styles.miniOrb}>
          <Ionicons name="cloud" size={20} color={Colors.secondary} />
        </View>
        <View style={styles.agentBubble}>
          <Text style={styles.agentText}>
            Your first call is free! After that, free tier gets 5 minutes per call. Invite a friend to try it together!
          </Text>
        </View>
      </View>

      {/* Free tier info */}
      <View style={styles.infoCard}>
        <View style={styles.infoRow}>
          <Ionicons name="time" size={18} color={Colors.warning} />
          <Text style={styles.infoText}>Free tier: 5 min per call</Text>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="people" size={18} color={Colors.secondary} />
          <Text style={styles.infoText}>Both callers need ConnectWorld AI</Text>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="language" size={18} color={Colors.gold} />
          <Text style={styles.infoText}>Real-time translation in 60+ languages</Text>
        </View>
      </View>

      <TouchableOpacity
        style={styles.primaryButton}
        onPress={() => handleGoToFeature("/call-translator")}
      >
        <Ionicons name="call" size={20} color="#060912" />
        <Text style={styles.primaryButtonText}>Try Your First Call</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.inviteButton}
        onPress={handleInviteFriend}
      >
        <Ionicons name="person-add" size={18} color={Colors.secondary} />
        <Text style={styles.inviteButtonText}>Invite a Friend to Call</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.secondaryButton} onPress={() => setStep("choices")}>
        <Text style={styles.secondaryButtonText}>Back to choices</Text>
      </TouchableOpacity>
    </View>
  );

  const renderTranslateSong = () => (
    <View style={styles.featureContent}>
      <View style={styles.featureHeader}>
        <View style={[styles.featureIconLarge, { backgroundColor: Colors.gold + "20" }]}>
          <Ionicons name="musical-notes" size={40} color={Colors.gold} />
        </View>
        <Text style={styles.featureTitle}>Translate a Song</Text>
        <Text style={styles.featureSubtitle}>
          Upload any song and get it translated into your language — same beat, same vibe, new words you can understand.
        </Text>
      </View>

      <View style={styles.agentSection}>
        <View style={styles.miniOrb}>
          <Ionicons name="cloud" size={20} color={Colors.secondary} />
        </View>
        <View style={styles.agentBubble}>
          <Text style={styles.agentText}>
            Free tier gets one language for song translation. Pick your favorite song and let's break it down with slang analysis, dialect detection, and cultural context!
          </Text>
        </View>
      </View>

      <View style={styles.infoCard}>
        <View style={styles.infoRow}>
          <Ionicons name="language" size={18} color={Colors.warning} />
          <Text style={styles.infoText}>Free tier: 1 language for translations</Text>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="analytics" size={18} color={Colors.secondary} />
          <Text style={styles.infoText}>AI slang detection & dialect breakdown</Text>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="globe" size={18} color={Colors.gold} />
          <Text style={styles.infoText}>Pro: 5 languages | Premium: Unlimited</Text>
        </View>
      </View>

      <TouchableOpacity
        style={styles.primaryButton}
        onPress={() => handleGoToFeature("/song-translate-agent")}
      >
        <Ionicons name="cloud-upload" size={20} color="#060912" />
        <Text style={styles.primaryButtonText}>Upload Your Song</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.secondaryButton} onPress={() => setStep("choices")}>
        <Text style={styles.secondaryButtonText}>Back to choices</Text>
      </TouchableOpacity>
    </View>
  );

  const renderExploring = () => (
    <View style={styles.featureContent}>
      <View style={styles.featureHeader}>
        <View style={[styles.featureIconLarge, { backgroundColor: Colors.accent + "20" }]}>
          <Ionicons name="compass" size={40} color={Colors.accent} />
        </View>
        <Text style={styles.featureTitle}>Explore On Your Own</Text>
        <Text style={styles.featureSubtitle}>
          No problem! Go ahead and check things out. I'm always right here whenever you want guidance.
        </Text>
      </View>

      <View style={styles.agentSection}>
        <View style={styles.miniOrb}>
          <Ionicons name="cloud" size={20} color={Colors.secondary} />
        </View>
        <View style={styles.agentBubble}>
          <Text style={styles.agentText}>
            Just say "Connect me" or tap my icon anytime you want the full guided tour. I'll be floating in the corner waiting for you! 🌊
          </Text>
        </View>
      </View>

      <TouchableOpacity
        style={styles.primaryButton}
        onPress={handleSkipToApp}
      >
        <Ionicons name="arrow-forward" size={20} color="#060912" />
        <Text style={styles.primaryButtonText}>Start Exploring</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerBrand}>
          <Ionicons name="cloud" size={22} color={Colors.secondary} />
          <Text style={styles.headerTitle}>CloudWave</Text>
        </View>
        <TouchableOpacity onPress={handleSkipToApp} style={styles.skipButton}>
          <Text style={styles.skipText}>Skip</Text>
          <Ionicons name="chevron-forward" size={16} color={Colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Content */}
      {step === "welcome" && renderWelcome()}
      {step === "choices" && renderChoices()}
      {step === "voice-training" && renderVoiceTraining()}
      {step === "make-call" && renderMakeCall()}
      {step === "translate-song" && renderTranslateSong()}
      {step === "exploring" && renderExploring()}
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
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  headerBrand: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerTitle: {
    fontSize: FontSize.lg,
    fontWeight: "700",
    color: Colors.secondary,
  },
  skipButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  skipText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },

  // Welcome / typing
  centerContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing.xl,
  },
  orbContainer: {
    marginBottom: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  orb: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.secondary + "20",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: Colors.secondary + "40",
  },
  orbGlow: {
    position: "absolute",
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.secondary + "08",
    borderWidth: 1,
    borderColor: Colors.secondary + "15",
  },
  messageBubble: {
    backgroundColor: Colors.surfaceCard,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    maxWidth: width * 0.8,
    borderWidth: 1,
    borderColor: Colors.border,
    flexDirection: "row",
    alignItems: "flex-end",
  },
  messageText: {
    fontSize: FontSize.lg,
    color: Colors.textPrimary,
    lineHeight: 26,
    flex: 1,
  },
  cursor: {
    width: 2,
    height: 20,
    backgroundColor: Colors.secondary,
    marginLeft: 2,
    borderRadius: 1,
  },

  // Choices
  scrollContent: {
    flex: 1,
  },
  scrollInner: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: 40,
  },
  agentSection: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  miniOrb: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.secondary + "20",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.secondary + "30",
  },
  agentBubble: {
    flex: 1,
    backgroundColor: Colors.surfaceCard,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  agentText: {
    fontSize: FontSize.sm,
    color: Colors.textPrimary,
    lineHeight: 20,
  },
  choicesGrid: {
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  choiceCard: {
    backgroundColor: Colors.surfaceCard,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  choiceCardHighlight: {
    borderColor: Colors.secondary + "50",
    backgroundColor: Colors.secondary + "08",
  },
  choiceIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.surfaceElevated,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.sm,
  },
  choiceIconHighlight: {
    backgroundColor: Colors.secondary + "20",
  },
  choiceTitle: {
    fontSize: FontSize.md,
    fontWeight: "700",
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  choiceSubtitle: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  recommendedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: Spacing.sm,
    alignSelf: "flex-start",
    backgroundColor: Colors.goldGlow,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.goldBorder,
  },
  recommendedText: {
    fontSize: FontSize.xs,
    fontWeight: "600",
    color: Colors.gold,
  },

  // Membership
  membershipSection: {
    marginTop: Spacing.md,
    alignItems: "center",
  },
  membershipTitle: {
    fontSize: FontSize.md,
    fontWeight: "700",
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  membershipSubtitle: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
  },
  tiersRow: {
    flexDirection: "row",
    gap: Spacing.sm,
    width: "100%",
  },
  tierCard: {
    flex: 1,
    backgroundColor: Colors.surfaceCard,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tierCardPopular: {
    borderColor: Colors.secondary + "50",
    backgroundColor: Colors.secondary + "08",
  },
  popularBadge: {
    backgroundColor: Colors.secondary + "20",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
    marginBottom: 6,
  },
  popularText: {
    fontSize: 9,
    fontWeight: "700",
    color: Colors.secondary,
    textTransform: "uppercase",
  },
  tierName: {
    fontSize: FontSize.sm,
    fontWeight: "700",
    marginBottom: 2,
  },
  tierPrice: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
  },

  // Feature screens
  featureContent: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    justifyContent: "center",
  },
  featureHeader: {
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
  featureIconLarge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.secondary + "20",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.md,
  },
  featureTitle: {
    fontSize: FontSize.xl,
    fontWeight: "800",
    color: Colors.textPrimary,
    marginBottom: 8,
    textAlign: "center",
  },
  featureSubtitle: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: 20,
    paddingHorizontal: Spacing.md,
  },
  infoCard: {
    backgroundColor: Colors.surfaceCard,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.sm,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  infoText: {
    fontSize: FontSize.sm,
    color: Colors.textPrimary,
    flex: 1,
  },
  primaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.secondary,
    paddingVertical: 16,
    borderRadius: BorderRadius.full,
    marginBottom: Spacing.md,
  },
  primaryButtonText: {
    fontSize: FontSize.md,
    fontWeight: "700",
    color: "#060912",
  },
  secondaryButton: {
    alignItems: "center",
    paddingVertical: 12,
  },
  secondaryButtonText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  inviteButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.secondary + "15",
    paddingVertical: 14,
    borderRadius: BorderRadius.full,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.secondary + "30",
  },
  inviteButtonText: {
    fontSize: FontSize.sm,
    fontWeight: "600",
    color: Colors.secondary,
  },
});
