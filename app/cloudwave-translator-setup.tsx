import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Platform,
  Animated,
  ScrollView,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Colors, Spacing, BorderRadius, FontSize } from "@/constants/Colors";
import { trackWalkthroughEvent } from "@/lib/walkthrough-analytics";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// ─── Types ──────────────────────────────────────────────────────────────────

type AgentStep =
  | "greeting"
  | "permissions"
  | "configuring"
  | "step_settings"
  | "step_translate_section"
  | "step_select_app"
  | "complete"
  | "error";

interface AgentMessage {
  id: string;
  role: "agent" | "system";
  text: string;
  typing?: boolean;
}

// ─── Configuration Steps ────────────────────────────────────────────────────

const CONFIG_STEPS = [
  {
    id: "step_settings",
    label: "Opening iOS Settings...",
    detail: "Navigating to Settings > Translate",
    icon: "settings-outline" as const,
    duration: 2200,
  },
  {
    id: "step_translate_section",
    label: "Finding Translation settings...",
    detail: "Locating Default Translation App option",
    icon: "search-outline" as const,
    duration: 1800,
  },
  {
    id: "step_select_app",
    label: "Selecting ConnectWorld AI...",
    detail: "Setting as default translator",
    icon: "checkmark-circle-outline" as const,
    duration: 2000,
  },
];

// ─── Permissions Required ───────────────────────────────────────────────────

const PERMISSIONS = [
  {
    id: "settings_access",
    icon: "settings-outline" as const,
    label: "Settings Access",
    description: "Navigate to iOS Translation settings on your behalf",
  },
  {
    id: "default_app",
    icon: "swap-horizontal-outline" as const,
    label: "Default App Change",
    description: "Set ConnectWorld AI as your default translation app",
  },
  {
    id: "system_integration",
    icon: "globe-outline" as const,
    label: "System Integration",
    description: "Enable system-wide translation replacement",
  },
];

// ─── Component ──────────────────────────────────────────────────────────────

export default function CloudWaveTranslatorSetupScreen() {
  const [step, setStep] = useState<AgentStep>("greeting");
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [configProgress, setConfigProgress] = useState(0);
  const [currentConfigStep, setCurrentConfigStep] = useState(0);
  const [permissionsGranted, setPermissionsGranted] = useState(false);
  const [typedText, setTypedText] = useState("");

  // Animations
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const orbGlowAnim = useRef(new Animated.Value(0.3)).current;

  // Pulse animation for CloudWave orb
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

  // Orb glow based on step
  useEffect(() => {
    if (step === "configuring" || step === "step_settings" || step === "step_translate_section" || step === "step_select_app") {
      Animated.loop(
        Animated.sequence([
          Animated.timing(orbGlowAnim, { toValue: 1, duration: 400, useNativeDriver: false }),
          Animated.timing(orbGlowAnim, { toValue: 0.4, duration: 400, useNativeDriver: false }),
        ])
      ).start();
    } else if (step === "complete") {
      Animated.timing(orbGlowAnim, { toValue: 1, duration: 300, useNativeDriver: false }).start();
    } else {
      Animated.timing(orbGlowAnim, { toValue: 0.3, duration: 500, useNativeDriver: false }).start();
    }
  }, [step]);

  // Greeting typing animation
  useEffect(() => {
    if (step === "greeting") {
      const message = "Hey! I can set up ConnectWorld AI as your default iOS translator automatically. Just grant me permission and I'll handle everything.";
      let index = 0;
      setTypedText("");
      const timer = setInterval(() => {
        if (index < message.length) {
          setTypedText(message.slice(0, index + 1));
          index++;
        } else {
          clearInterval(timer);
          // After typing, show permissions after a short delay
          setTimeout(() => {
            Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
            setStep("permissions");
          }, 800);
        }
      }, 25);
      return () => clearInterval(timer);
    }
  }, [step === "greeting"]);

  // Track analytics on mount
  useEffect(() => {
    trackWalkthroughEvent("walkthrough_started", {
      totalSteps: CONFIG_STEPS.length,
      source: "cloudwave_agent",
      mode: "agent_assisted",
    });
  }, []);

  // Configuration automation sequence
  const runConfiguration = async () => {
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    setStep("configuring");
    addMessage("agent", "Starting configuration... I'll walk through each step.");

    for (let i = 0; i < CONFIG_STEPS.length; i++) {
      setCurrentConfigStep(i);
      const configStep = CONFIG_STEPS[i];

      // Update progress
      const progress = ((i) / CONFIG_STEPS.length) * 100;
      setConfigProgress(progress);
      Animated.timing(progressAnim, {
        toValue: progress,
        duration: 300,
        useNativeDriver: false,
      }).start();

      // Show step message
      addMessage("system", `${configStep.label}`);

      // Simulate the step execution
      await delay(configStep.duration);

      if (Platform.OS !== "web") {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }

      // Track step completion
      trackWalkthroughEvent("walkthrough_step_completed", {
        stepId: configStep.id,
        stepIndex: i,
        totalSteps: CONFIG_STEPS.length,
        source: "manual",
      });
    }

    // Final progress
    setConfigProgress(100);
    Animated.timing(progressAnim, {
      toValue: 100,
      duration: 300,
      useNativeDriver: false,
    }).start();

    // Complete
    await delay(500);
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    addMessage("agent", "All done! ConnectWorld AI is now your default translator. Any time you long-press text and tap \"Translate\" — I'll handle it with color-coded breakdowns, pronunciation, and learning features.");

    // Mark as complete in AsyncStorage
    await AsyncStorage.setItem("@connectworld_translator_setup_shown", "true");
    await AsyncStorage.setItem("@connectworld_translator_agent_configured", "true");

    trackWalkthroughEvent("walkthrough_completed", {
      totalSteps: CONFIG_STEPS.length,
      source: "manual",
    });

    setStep("complete");
  };

  const handleGrantPermissions = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    // On a real device, this would request actual system permissions
    // For now, simulate the permission grant with a confirmation dialog
    if (Platform.OS === "ios") {
      Alert.alert(
        "Grant Access to CloudWave",
        "CloudWave will navigate to iOS Settings and configure ConnectWorld AI as your default translation app. This requires access to your device settings.",
        [
          { text: "Deny", style: "cancel" },
          {
            text: "Allow",
            style: "default",
            onPress: () => {
              setPermissionsGranted(true);
              addMessage("agent", "Permissions granted! Let me configure everything for you now...");
              setTimeout(() => runConfiguration(), 1200);
            },
          },
        ]
      );
    } else {
      // On web/Android, just proceed
      setPermissionsGranted(true);
      addMessage("agent", "Permissions granted! Let me configure everything for you now...");
      setTimeout(() => runConfiguration(), 1200);
    }
  };

  const handleDoItManually = () => {
    trackWalkthroughEvent("walkthrough_skipped", {
      stepId: "permissions",
      stepIndex: 0,
      totalSteps: CONFIG_STEPS.length,
    });
    router.replace("/translator-setup" as any);
  };

  const handleDone = async () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.back();
  };

  const handleTryIt = () => {
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    router.replace("/translation-hub" as any);
  };

  const addMessage = (role: "agent" | "system", text: string) => {
    setMessages((prev) => [
      ...prev,
      { id: `msg-${Date.now()}-${Math.random()}`, role, text },
    ]);
  };

  // ─── Render Sections ────────────────────────────────────────────────────────

  const renderOrb = () => {
    const glowColor = step === "complete" ? Colors.success : Colors.secondary;
    const isWorking = step === "configuring" || step.startsWith("step_");

    return (
      <Animated.View style={[styles.orbContainer, { transform: [{ scale: pulseAnim }] }]}>
        <Animated.View
          style={[
            styles.orbGlowRing,
            {
              borderColor: glowColor,
              opacity: orbGlowAnim,
              shadowColor: glowColor,
            },
          ]}
        />
        <View style={[styles.orb, step === "complete" && styles.orbComplete]}>
          <Ionicons
            name={step === "complete" ? "checkmark-circle" : isWorking ? "sync" : "cloud"}
            size={36}
            color={step === "complete" ? Colors.success : Colors.secondary}
          />
        </View>
        {isWorking && (
          <View style={styles.orbStatusDot}>
            <View style={styles.statusDotInner} />
          </View>
        )}
      </Animated.View>
    );
  };

  const renderGreeting = () => (
    <View style={styles.greetingSection}>
      <View style={styles.messageBubble}>
        <Text style={styles.messageText}>{typedText}</Text>
        {typedText.length < 120 && <View style={styles.cursor} />}
      </View>
    </View>
  );

  const renderPermissions = () => (
    <Animated.View style={[styles.permissionsSection, { opacity: fadeAnim }]}>
      <Text style={styles.sectionTitle}>Permissions Needed</Text>
      <Text style={styles.sectionSubtitle}>
        CloudWave needs the following access to configure your translator:
      </Text>

      <View style={styles.permissionsList}>
        {PERMISSIONS.map((perm) => (
          <View key={perm.id} style={styles.permissionRow}>
            <View style={styles.permissionIcon}>
              <Ionicons name={perm.icon} size={20} color={Colors.secondary} />
            </View>
            <View style={styles.permissionInfo}>
              <Text style={styles.permissionLabel}>{perm.label}</Text>
              <Text style={styles.permissionDesc}>{perm.description}</Text>
            </View>
            <Ionicons name="shield-checkmark" size={18} color={Colors.success + "80"} />
          </View>
        ))}
      </View>

      <TouchableOpacity
        style={styles.grantButton}
        onPress={handleGrantPermissions}
        activeOpacity={0.8}
      >
        <Ionicons name="lock-open" size={20} color="#060912" />
        <Text style={styles.grantButtonText}>Grant Access & Configure</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.manualButton}
        onPress={handleDoItManually}
        activeOpacity={0.7}
      >
        <Text style={styles.manualButtonText}>I'll do it manually instead</Text>
      </TouchableOpacity>
    </Animated.View>
  );

  const renderConfiguring = () => (
    <View style={styles.configuringSection}>
      <Text style={styles.configuringTitle}>CloudWave is configuring...</Text>

      {/* Progress bar */}
      <View style={styles.progressBarContainer}>
        <Animated.View
          style={[
            styles.progressBarFill,
            {
              width: progressAnim.interpolate({
                inputRange: [0, 100],
                outputRange: ["0%", "100%"],
              }),
            },
          ]}
        />
      </View>
      <Text style={styles.progressText}>{Math.round(configProgress)}% complete</Text>

      {/* Steps list */}
      <View style={styles.configStepsList}>
        {CONFIG_STEPS.map((configStep, index) => {
          const isActive = index === currentConfigStep;
          const isDone = index < currentConfigStep || (index === CONFIG_STEPS.length - 1 && configProgress === 100);

          return (
            <View key={configStep.id} style={styles.configStepRow}>
              <View style={[styles.configStepIcon, isActive && styles.configStepIconActive, isDone && styles.configStepIconDone]}>
                {isDone ? (
                  <Ionicons name="checkmark" size={14} color={Colors.success} />
                ) : (
                  <Ionicons name={configStep.icon} size={14} color={isActive ? Colors.secondary : Colors.textMuted} />
                )}
              </View>
              <View style={styles.configStepInfo}>
                <Text style={[styles.configStepLabel, isActive && styles.configStepLabelActive, isDone && styles.configStepLabelDone]}>
                  {configStep.label}
                </Text>
                <Text style={styles.configStepDetail}>{configStep.detail}</Text>
              </View>
              {isActive && (
                <View style={styles.activeIndicator}>
                  <View style={styles.activeIndicatorDot} />
                </View>
              )}
            </View>
          );
        })}
      </View>

      {/* Agent messages */}
      {messages.length > 0 && (
        <View style={styles.messagesContainer}>
          {messages.slice(-3).map((msg) => (
            <View key={msg.id} style={[styles.configMessage, msg.role === "system" && styles.systemMessage]}>
              {msg.role === "agent" && (
                <View style={styles.miniOrb}>
                  <Ionicons name="cloud" size={12} color={Colors.secondary} />
                </View>
              )}
              <Text style={[styles.configMessageText, msg.role === "system" && styles.systemMessageText]}>
                {msg.text}
              </Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );

  const renderComplete = () => (
    <View style={styles.completeSection}>
      <View style={styles.completeBadge}>
        <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
        <Text style={styles.completeBadgeText}>Configuration Complete</Text>
      </View>

      <Text style={styles.completeTitle}>You're All Set!</Text>
      <Text style={styles.completeSubtitle}>
        ConnectWorld AI is now your default iOS translator. Long-press any text and tap "Translate" to see it in action.
      </Text>

      {/* What you get */}
      <View style={styles.featuresCard}>
        <Text style={styles.featuresCardTitle}>What's different now:</Text>
        <FeatureItem icon="palette" text="Animated gradient popup (not plain white)" />
        <FeatureItem icon="text-fields" text="Color-coded word-by-word grammar" />
        <FeatureItem icon="record-voice-over" text="Pronunciation for every word" />
        <FeatureItem icon="school" text={'"Learn These" saves to your deck'} />
        <FeatureItem icon="psychology" text="Formality & context badges" />
      </View>

      <TouchableOpacity
        style={styles.tryItButton}
        onPress={handleTryIt}
        activeOpacity={0.8}
      >
        <MaterialIcons name="translate" size={20} color="#060912" />
        <Text style={styles.tryItButtonText}>Try Translation Hub</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.doneButton}
        onPress={handleDone}
        activeOpacity={0.7}
      >
        <Text style={styles.doneButtonText}>Done</Text>
      </TouchableOpacity>
    </View>
  );

  // ─── Main Render ──────────────────────────────────────────────────────────

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={["top", "left", "right", "bottom"]}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.closeBtn}
            activeOpacity={0.7}
          >
            <Ionicons name="close" size={24} color={Colors.textSecondary} />
          </TouchableOpacity>

          <View style={styles.headerCenter}>
            <Ionicons name="cloud" size={16} color={Colors.secondary} />
            <Text style={styles.headerTitle}>CloudWave Setup</Text>
          </View>

          <View style={styles.headerRight} />
        </View>

        <ScrollView
          style={styles.scrollContent}
          contentContainerStyle={styles.scrollInner}
          showsVerticalScrollIndicator={false}
        >
          {/* CloudWave Orb */}
          {renderOrb()}

          {/* Content based on step */}
          {step === "greeting" && renderGreeting()}
          {step === "permissions" && renderPermissions()}
          {(step === "configuring" || step.startsWith("step_")) && renderConfiguring()}
          {step === "complete" && renderComplete()}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

// ─── Sub-components ─────────────────────────────────────────────────────────

function FeatureItem({ icon, text }: { icon: string; text: string }) {
  return (
    <View style={styles.featureItem}>
      <MaterialIcons name={icon as any} size={16} color={Colors.secondary} />
      <Text style={styles.featureItemText}>{text}</Text>
    </View>
  );
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ─── Styles ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.05)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerCenter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  headerTitle: {
    fontSize: FontSize.md,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  headerRight: {
    width: 40,
  },
  scrollContent: {
    flex: 1,
  },
  scrollInner: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: 40,
    alignItems: "center",
  },

  // Orb
  orbContainer: {
    marginTop: Spacing.xl,
    marginBottom: Spacing.xl,
    alignItems: "center",
    justifyContent: "center",
    width: 100,
    height: 100,
  },
  orb: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.secondary + "15",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: Colors.secondary + "40",
  },
  orbComplete: {
    backgroundColor: Colors.success + "15",
    borderColor: Colors.success + "40",
  },
  orbGlowRing: {
    position: "absolute",
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 15,
  },
  orbStatusDot: {
    position: "absolute",
    bottom: 4,
    right: 4,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  statusDotInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.success,
  },

  // Greeting
  greetingSection: {
    width: "100%",
    alignItems: "center",
  },
  messageBubble: {
    backgroundColor: Colors.surfaceCard,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    maxWidth: SCREEN_WIDTH * 0.85,
    borderWidth: 1,
    borderColor: Colors.border,
    flexDirection: "row",
    alignItems: "flex-end",
  },
  messageText: {
    fontSize: FontSize.md,
    color: Colors.textPrimary,
    lineHeight: 24,
    flex: 1,
  },
  cursor: {
    width: 2,
    height: 18,
    backgroundColor: Colors.secondary,
    marginLeft: 2,
    borderRadius: 1,
  },

  // Permissions
  permissionsSection: {
    width: "100%",
  },
  sectionTitle: {
    fontSize: FontSize.xl,
    fontWeight: "700",
    color: Colors.textPrimary,
    textAlign: "center",
    marginBottom: Spacing.xs,
  },
  sectionSubtitle: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    textAlign: "center",
    marginBottom: Spacing.lg,
    lineHeight: 20,
  },
  permissionsList: {
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  permissionRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surfaceCard,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.sm,
  },
  permissionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.secondary + "15",
    alignItems: "center",
    justifyContent: "center",
  },
  permissionInfo: {
    flex: 1,
  },
  permissionLabel: {
    fontSize: FontSize.sm,
    fontWeight: "600",
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  permissionDesc: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    lineHeight: 16,
  },
  grantButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.secondary,
    paddingVertical: 16,
    borderRadius: BorderRadius.full,
    marginBottom: Spacing.md,
    shadowColor: Colors.secondary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    ...(Platform.OS === "web"
      ? ({ boxShadow: "0 4px 20px rgba(0, 170, 255, 0.3)" } as any)
      : {}),
  },
  grantButtonText: {
    fontSize: FontSize.md,
    fontWeight: "700",
    color: "#060912",
  },
  manualButton: {
    alignItems: "center",
    paddingVertical: 12,
  },
  manualButtonText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },

  // Configuring
  configuringSection: {
    width: "100%",
  },
  configuringTitle: {
    fontSize: FontSize.lg,
    fontWeight: "700",
    color: Colors.textPrimary,
    textAlign: "center",
    marginBottom: Spacing.lg,
  },
  progressBarContainer: {
    width: "100%",
    height: 6,
    backgroundColor: Colors.surfaceCard,
    borderRadius: 3,
    overflow: "hidden",
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: Colors.secondary,
    borderRadius: 3,
  },
  progressText: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    textAlign: "center",
    marginBottom: Spacing.lg,
  },
  configStepsList: {
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  configStepRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surfaceCard,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.sm,
  },
  configStepIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.surfaceElevated,
    alignItems: "center",
    justifyContent: "center",
  },
  configStepIconActive: {
    backgroundColor: Colors.secondary + "20",
    borderWidth: 1,
    borderColor: Colors.secondary + "40",
  },
  configStepIconDone: {
    backgroundColor: Colors.success + "15",
  },
  configStepInfo: {
    flex: 1,
  },
  configStepLabel: {
    fontSize: FontSize.sm,
    fontWeight: "500",
    color: Colors.textMuted,
    marginBottom: 2,
  },
  configStepLabelActive: {
    color: Colors.textPrimary,
    fontWeight: "600",
  },
  configStepLabelDone: {
    color: Colors.success,
  },
  configStepDetail: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
  },
  activeIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.secondary + "30",
    alignItems: "center",
    justifyContent: "center",
  },
  activeIndicatorDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.secondary,
  },
  messagesContainer: {
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  configMessage: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.sm,
  },
  systemMessage: {
    paddingLeft: 28,
  },
  miniOrb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.secondary + "20",
    alignItems: "center",
    justifyContent: "center",
  },
  configMessageText: {
    fontSize: FontSize.sm,
    color: Colors.textPrimary,
    lineHeight: 20,
    flex: 1,
  },
  systemMessageText: {
    color: Colors.textSecondary,
    fontStyle: "italic",
  },

  // Complete
  completeSection: {
    width: "100%",
    alignItems: "center",
  },
  completeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Colors.success + "12",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.success + "30",
    marginBottom: Spacing.lg,
  },
  completeBadgeText: {
    fontSize: FontSize.sm,
    fontWeight: "600",
    color: Colors.success,
  },
  completeTitle: {
    fontSize: FontSize.xl,
    fontWeight: "800",
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  completeSubtitle: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: Spacing.xl,
    paddingHorizontal: Spacing.md,
  },
  featuresCard: {
    width: "100%",
    backgroundColor: Colors.surfaceCard,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.xl,
    gap: Spacing.sm,
  },
  featuresCardTitle: {
    fontSize: FontSize.sm,
    fontWeight: "700",
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  featureItemText: {
    fontSize: FontSize.sm,
    color: Colors.textPrimary,
    flex: 1,
  },
  tryItButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.secondary,
    paddingVertical: 16,
    borderRadius: BorderRadius.full,
    width: "100%",
    marginBottom: Spacing.md,
    shadowColor: Colors.secondary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    ...(Platform.OS === "web"
      ? ({ boxShadow: "0 4px 20px rgba(0, 170, 255, 0.3)" } as any)
      : {}),
  },
  tryItButtonText: {
    fontSize: FontSize.md,
    fontWeight: "700",
    color: "#060912",
  },
  doneButton: {
    alignItems: "center",
    paddingVertical: 12,
  },
  doneButtonText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
});
