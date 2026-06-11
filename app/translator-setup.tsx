import React, { useState, useRef, useCallback, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Dimensions,
  TouchableOpacity,
  Platform,
  ViewToken,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { MaterialIcons, Ionicons } from "@expo/vector-icons";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSequence,
  Easing,
  interpolate,
  FadeIn,
  FadeInDown,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { trackWalkthroughEvent } from "@/lib/walkthrough-analytics";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// ─── Walkthrough Steps ──────────────────────────────────────────────────────
interface WalkthroughStep {
  id: string;
  icon: string;
  iconFamily: "MaterialIcons" | "Ionicons";
  title: string;
  subtitle: string;
  description: string;
  tip?: string;
  stepNumber: string;
}

const STEPS: WalkthroughStep[] = [
  {
    id: "intro",
    icon: "translate",
    iconFamily: "MaterialIcons",
    title: "Make ConnectWorld AI\nYour Default Translator",
    subtitle: "Replace Google Translate system-wide",
    description:
      "Once set up, any time you long-press text in iMessage, Safari, or any app and tap \"Translate\" — ConnectWorld AI handles it with color-coded breakdowns, pronunciation, and learning features.",
    tip: "Works in iMessage, Safari, Notes, Mail, and every iOS app that supports translation.",
    stepNumber: "Overview",
  },
  {
    id: "step1",
    icon: "settings",
    iconFamily: "Ionicons",
    title: "Open iOS Settings",
    subtitle: "Navigate to the Translate section",
    description:
      "Open the Settings app on your iPhone, then scroll down and tap \"Translate\". This is where iOS lets you choose which app handles all translation requests.",
    tip: "Settings → Translate (scroll past General, Display & Brightness, etc.)",
    stepNumber: "Step 1",
  },
  {
    id: "step2",
    icon: "swap-horiz",
    iconFamily: "MaterialIcons",
    title: "Tap \"Default Translation App\"",
    subtitle: "Choose your preferred translator",
    description:
      "Inside the Translate settings, you'll see \"Default Translation App\" at the top. Tap it to see a list of all installed apps that support iOS translation.",
    tip: "If you don't see this option, make sure you're on iOS 17.4 or later.",
    stepNumber: "Step 2",
  },
  {
    id: "step3",
    icon: "checkmark-circle",
    iconFamily: "Ionicons",
    title: "Select ConnectWorld AI",
    subtitle: "You're all set!",
    description:
      "Tap \"ConnectWorld AI\" from the list. A checkmark will appear next to it. From now on, every translation request across iOS will use ConnectWorld AI's distinctive popup with word breakdowns and learning features.",
    tip: "You can always switch back to Apple Translate or Google Translate from the same menu.",
    stepNumber: "Step 3",
  },
  {
    id: "try-it",
    icon: "rocket",
    iconFamily: "Ionicons",
    title: "Try It Now!",
    subtitle: "See the difference instantly",
    description:
      "Open iMessage, long-press any message in a foreign language, and tap \"Translate\". You'll see ConnectWorld AI's animated popup with color-coded grammar, pronunciation guides, and a \"Learn These\" button to save words to your deck.",
    stepNumber: "Done",
  },
];

// ─── Step Card Component ────────────────────────────────────────────────────
function StepCard({ item, index }: { item: WalkthroughStep; index: number }) {
  const isIntro = index === 0;
  const isFinal = index === STEPS.length - 1;

  return (
    <View style={styles.stepCard}>
      <View style={styles.stepContent}>
        {/* Step badge */}
        <Animated.View
          entering={FadeInDown.delay(100).duration(400)}
          style={styles.stepBadge}
        >
          <Text style={styles.stepBadgeText}>{item.stepNumber}</Text>
        </Animated.View>

        {/* Icon */}
        <Animated.View
          entering={FadeInDown.delay(200).duration(500)}
          style={[
            styles.iconContainer,
            isFinal && styles.iconContainerSuccess,
          ]}
        >
          {item.iconFamily === "MaterialIcons" ? (
            <MaterialIcons
              name={item.icon as any}
              size={48}
              color={isFinal ? "#4ADE80" : "#00AAFF"}
            />
          ) : (
            <Ionicons
              name={item.icon as any}
              size={48}
              color={isFinal ? "#4ADE80" : "#00AAFF"}
            />
          )}
        </Animated.View>

        {/* Title */}
        <Animated.Text
          entering={FadeInDown.delay(300).duration(400)}
          style={styles.stepTitle}
        >
          {item.title}
        </Animated.Text>

        {/* Subtitle */}
        <Animated.Text
          entering={FadeInDown.delay(400).duration(400)}
          style={styles.stepSubtitle}
        >
          {item.subtitle}
        </Animated.Text>

        {/* Description */}
        <Animated.Text
          entering={FadeInDown.delay(500).duration(400)}
          style={styles.stepDescription}
        >
          {item.description}
        </Animated.Text>

        {/* Tip box */}
        {item.tip && (
          <Animated.View
            entering={FadeInDown.delay(600).duration(400)}
            style={styles.tipBox}
          >
            <MaterialIcons name="lightbulb-outline" size={16} color="#F59E0B" />
            <Text style={styles.tipText}>{item.tip}</Text>
          </Animated.View>
        )}

        {/* Final step: feature highlights */}
        {isFinal && (
          <Animated.View
            entering={FadeInDown.delay(700).duration(400)}
            style={styles.featuresBox}
          >
            <FeatureRow icon="palette" text="Animated gradient popup (not plain white)" />
            <FeatureRow icon="text-fields" text="Color-coded word-by-word grammar" />
            <FeatureRow icon="record-voice-over" text="Pronunciation for every word" />
            <FeatureRow icon="school" text={'"Learn These" saves to your deck'} />
            <FeatureRow icon="psychology" text="Formality & context badges" />
          </Animated.View>
        )}
      </View>
    </View>
  );
}

function FeatureRow({ icon, text }: { icon: string; text: string }) {
  return (
    <View style={styles.featureRow}>
      <MaterialIcons name={icon as any} size={16} color="#00AAFF" />
      <Text style={styles.featureText}>{text}</Text>
    </View>
  );
}

// ─── Main Screen ────────────────────────────────────────────────────────────
export default function TranslatorSetupScreen() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const trackedSteps = useRef<Set<number>>(new Set());

  // Track walkthrough start on mount
  useEffect(() => {
    trackWalkthroughEvent("walkthrough_started", {
      totalSteps: STEPS.length,
      source: "first_launch",
    });
    // Track first step view
    trackedSteps.current.add(0);
    trackWalkthroughEvent("walkthrough_step_viewed", {
      stepId: STEPS[0].id,
      stepIndex: 0,
      totalSteps: STEPS.length,
    });
  }, []);

  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index != null) {
        const newIndex = viewableItems[0].index;
        setCurrentIndex(newIndex);

        // Track step view (only once per step per session)
        if (!trackedSteps.current.has(newIndex)) {
          trackedSteps.current.add(newIndex);
          trackWalkthroughEvent("walkthrough_step_viewed", {
            stepId: STEPS[newIndex].id,
            stepIndex: newIndex,
            totalSteps: STEPS.length,
          });
        }
      }
    },
    []
  );

  const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  const handleNext = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    // Track step completion
    trackWalkthroughEvent("walkthrough_step_completed", {
      stepId: STEPS[currentIndex].id,
      stepIndex: currentIndex,
      totalSteps: STEPS.length,
    });

    if (currentIndex < STEPS.length - 1) {
      flatListRef.current?.scrollToIndex({
        index: currentIndex + 1,
        animated: true,
      });
    } else {
      // Track full completion
      trackWalkthroughEvent("walkthrough_completed", {
        totalSteps: STEPS.length,
      });
      router.back();
    }
  };

  const handleSkip = () => {
    // Track skip with current step info for drop-off analysis
    trackWalkthroughEvent("walkthrough_skipped", {
      stepId: STEPS[currentIndex].id,
      stepIndex: currentIndex,
      totalSteps: STEPS.length,
    });
    router.back();
  };

  const handleOpenSettings = () => {
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    // Track that user opened settings (completed the guide)
    trackWalkthroughEvent("walkthrough_settings_opened", {
      totalSteps: STEPS.length,
    });
    trackWalkthroughEvent("walkthrough_completed", {
      totalSteps: STEPS.length,
    });
    router.back();
  };

  const isLastStep = currentIndex === STEPS.length - 1;

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={handleSkip}
            style={styles.skipBtn}
            activeOpacity={0.7}
          >
            <Ionicons name="close" size={24} color="#9BA1A6" />
          </TouchableOpacity>

          <View style={styles.headerCenter}>
            <MaterialIcons name="translate" size={18} color="#00AAFF" />
            <Text style={styles.headerTitle}>Translator Setup</Text>
          </View>

          <View style={styles.headerRight} />
        </View>

        {/* Progress dots */}
        <View style={styles.dotsContainer}>
          {STEPS.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                i === currentIndex && styles.dotActive,
                i < currentIndex && styles.dotCompleted,
              ]}
            />
          ))}
        </View>

        {/* Walkthrough carousel */}
        <FlatList
          ref={flatListRef}
          data={STEPS}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item.id}
          renderItem={({ item, index }) => <StepCard item={item} index={index} />}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
          getItemLayout={(_, index) => ({
            length: SCREEN_WIDTH,
            offset: SCREEN_WIDTH * index,
            index,
          })}
        />

        {/* Bottom actions */}
        <View style={styles.bottomActions}>
          {isLastStep ? (
            <>
              <TouchableOpacity
                style={styles.primaryBtn}
                onPress={handleOpenSettings}
                activeOpacity={0.8}
              >
                <Ionicons name="settings-outline" size={20} color="#fff" />
                <Text style={styles.primaryBtnText}>Open iOS Settings</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.secondaryBtn}
                onPress={handleSkip}
                activeOpacity={0.7}
              >
                <Text style={styles.secondaryBtnText}>I'll do it later</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <TouchableOpacity
                style={styles.primaryBtn}
                onPress={handleNext}
                activeOpacity={0.8}
              >
                <Text style={styles.primaryBtnText}>
                  {currentIndex === 0 ? "Get Started" : "Next"}
                </Text>
                <MaterialIcons name="arrow-forward" size={20} color="#fff" />
              </TouchableOpacity>
              {currentIndex === 0 && (
                <TouchableOpacity
                  style={styles.agentBtn}
                  onPress={() => {
                    trackWalkthroughEvent("walkthrough_skipped", {
                      stepId: STEPS[0].id,
                      stepIndex: 0,
                      totalSteps: STEPS.length,
                      reason: "chose_agent_assisted",
                    });
                    router.replace("/cloudwave-translator-setup" as any);
                  }}
                  activeOpacity={0.7}
                >
                  <Ionicons name="cloud" size={16} color="#00AAFF" />
                  <Text style={styles.agentBtnText}>Let CloudWave do it for me</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={styles.secondaryBtn}
                onPress={handleSkip}
                activeOpacity={0.7}
              >
                <Text style={styles.secondaryBtnText}>Skip for now</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </SafeAreaView>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#040810",
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  skipBtn: {
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
    fontSize: 15,
    fontWeight: "600",
    color: "#ECEDEE",
  },
  headerRight: {
    width: 40,
  },
  dotsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    paddingVertical: 12,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(255,255,255,0.15)",
  },
  dotActive: {
    width: 24,
    backgroundColor: "#00AAFF",
    shadowColor: "#00AAFF",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 6,
  },
  dotCompleted: {
    backgroundColor: "rgba(0, 170, 255, 0.4)",
  },
  stepCard: {
    width: SCREEN_WIDTH,
    paddingHorizontal: 24,
    justifyContent: "center",
  },
  stepContent: {
    alignItems: "center",
    paddingVertical: 20,
  },
  stepBadge: {
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 12,
    backgroundColor: "rgba(0, 170, 255, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(0, 170, 255, 0.25)",
    marginBottom: 20,
  },
  stepBadgeText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#00AAFF",
    textTransform: "uppercase",
    letterSpacing: 1.5,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "rgba(0, 170, 255, 0.08)",
    borderWidth: 2,
    borderColor: "rgba(0, 170, 255, 0.25)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
    shadowColor: "#00AAFF",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    ...(Platform.OS === "web"
      ? ({ boxShadow: "0 0 24px rgba(0, 170, 255, 0.25)" } as any)
      : {}),
  },
  iconContainerSuccess: {
    backgroundColor: "rgba(74, 222, 128, 0.08)",
    borderColor: "rgba(74, 222, 128, 0.3)",
    shadowColor: "#4ADE80",
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#ECEDEE",
    textAlign: "center",
    marginBottom: 8,
    lineHeight: 32,
  },
  stepSubtitle: {
    fontSize: 14,
    fontWeight: "500",
    color: "#00AAFF",
    textAlign: "center",
    marginBottom: 16,
  },
  stepDescription: {
    fontSize: 15,
    color: "#9BA1A6",
    textAlign: "center",
    lineHeight: 23,
    paddingHorizontal: 8,
    marginBottom: 16,
  },
  tipBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: "rgba(245, 158, 11, 0.06)",
    borderWidth: 1,
    borderColor: "rgba(245, 158, 11, 0.15)",
    borderRadius: 12,
    padding: 12,
    width: "100%",
  },
  tipText: {
    flex: 1,
    fontSize: 13,
    color: "#F59E0B",
    lineHeight: 19,
  },
  featuresBox: {
    width: "100%",
    backgroundColor: "rgba(0, 170, 255, 0.04)",
    borderWidth: 1,
    borderColor: "rgba(0, 170, 255, 0.12)",
    borderRadius: 14,
    padding: 16,
    gap: 12,
    marginTop: 8,
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  featureText: {
    fontSize: 13,
    color: "#ECEDEE",
    flex: 1,
  },
  bottomActions: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    gap: 12,
  },
  primaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#00AAFF",
    paddingVertical: 16,
    borderRadius: 14,
    shadowColor: "#00AAFF",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    ...(Platform.OS === "web"
      ? ({ boxShadow: "0 4px 20px rgba(0, 170, 255, 0.3)" } as any)
      : {}),
  },
  primaryBtnText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#fff",
  },
  agentBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "rgba(0, 170, 255, 0.08)",
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(0, 170, 255, 0.25)",
  },
  agentBtnText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#00AAFF",
  },
  secondaryBtn: {
    alignItems: "center",
    paddingVertical: 10,
  },
  secondaryBtnText: {
    fontSize: 14,
    color: "#687076",
  },
});
