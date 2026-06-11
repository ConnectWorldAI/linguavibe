import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Animated,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import { Colors, Spacing, BorderRadius, FontSize } from "@/constants/Colors";
import {
  PremiumFeature,
  PlanId,
  FEATURE_INFO,
  useSubscription,
  canAccessFeature,
  PLAN_DAILY_LIMITS,
} from "@/hooks/use-subscription";

// ─── Types ───────────────────────────────────────────────────────────────────
interface PremiumGuardProps {
  /** The feature being guarded */
  feature: PremiumFeature;
  /** Children to render if access is granted */
  children: React.ReactNode;
  /** Optional: render a custom locked state instead of the default */
  renderLocked?: (info: { requiredPlan: PlanId; featureName: string; onUpgrade: () => void }) => React.ReactNode;
  /** If true, show inline locked state instead of allowing tap-to-show-modal */
  inline?: boolean;
}

interface UpgradeModalProps {
  visible: boolean;
  onDismiss: () => void;
  feature: PremiumFeature;
  currentPlan: PlanId;
}

// ─── Plan Display Info ──────────────────────────────────────────────────────
const PLAN_DISPLAY: Record<PlanId, { name: string; price: string; color: string; icon: string }> = {
  free: { name: "Free", price: "$0/mo", color: Colors.textMuted, icon: "person-outline" },
  plus: { name: "Plus", price: "$9.99/mo", color: Colors.secondary, icon: "star" },
  pro: { name: "Pro", price: "$19.99/mo", color: Colors.gold, icon: "diamond" },
  enterprise: { name: "Enterprise", price: "$49.99/mo", color: Colors.glow, icon: "business" },
};

// ─── Upgrade Modal ──────────────────────────────────────────────────────────
function UpgradeModal({ visible, onDismiss, feature, currentPlan }: UpgradeModalProps) {
  const slideAnim = useRef(new Animated.Value(400)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const featureInfo = FEATURE_INFO[feature];
  const requiredPlan = featureInfo.requiredPlan;
  const planInfo = PLAN_DISPLAY[requiredPlan];

  useEffect(() => {
    if (visible) {
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      }
      Animated.parallel([
        Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, damping: 20, stiffness: 150 }),
        Animated.timing(fadeAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, { toValue: 400, duration: 200, useNativeDriver: true }),
        Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  const handleUpgrade = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    onDismiss();
    router.push("/payment-setup");
  };

  const handleViewPlans = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onDismiss();
    router.push("/subscription");
  };

  if (!visible) return null;

  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={onDismiss}>
      <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
        <TouchableOpacity style={styles.overlayTouchable} activeOpacity={1} onPress={onDismiss} />
        <Animated.View style={[styles.sheet, { transform: [{ translateY: slideAnim }] }]}>
          <View style={styles.handleBar} />

          {/* Lock Icon */}
          <View style={[styles.lockIcon, { borderColor: planInfo.color + "40" }]}>
            <Ionicons name="lock-closed" size={32} color={planInfo.color} />
          </View>

          {/* Feature Info */}
          <Text style={styles.title}>Premium Feature</Text>
          <Text style={styles.featureName}>{featureInfo.name}</Text>
          <Text style={styles.description}>{featureInfo.description}</Text>

          {/* Required Plan Badge */}
          <View style={[styles.requiredPlanBadge, { borderColor: planInfo.color + "40" }]}>
            <Ionicons name={planInfo.icon as any} size={18} color={planInfo.color} />
            <Text style={[styles.requiredPlanText, { color: planInfo.color }]}>
              Requires {planInfo.name} Plan
            </Text>
            <Text style={styles.requiredPlanPrice}>{planInfo.price}</Text>
          </View>

          {/* Current Plan Info */}
          <View style={styles.currentPlanRow}>
            <Text style={styles.currentPlanLabel}>Your plan:</Text>
            <View style={styles.currentPlanBadge}>
              <Text style={styles.currentPlanValue}>{PLAN_DISPLAY[currentPlan].name}</Text>
            </View>
          </View>

          {/* What you get */}
          <View style={styles.benefitsSection}>
            <Text style={styles.benefitsTitle}>Upgrade to {planInfo.name} and get:</Text>
            {getUpgradeBenefits(requiredPlan).map((benefit, i) => (
              <View key={i} style={styles.benefitRow}>
                <Ionicons name="checkmark-circle" size={16} color={Colors.success} />
                <Text style={styles.benefitText}>{benefit}</Text>
              </View>
            ))}
          </View>

          {/* CTA Buttons */}
          <TouchableOpacity
            style={[styles.upgradeButton, { backgroundColor: planInfo.color }]}
            onPress={handleUpgrade}
            activeOpacity={0.8}
          >
            <Ionicons name="rocket" size={18} color={Colors.primary} />
            <Text style={styles.upgradeButtonText}>Upgrade to {planInfo.name}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.viewPlansButton} onPress={handleViewPlans}>
            <Text style={styles.viewPlansText}>Compare All Plans</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.dismissButton} onPress={onDismiss}>
            <Text style={styles.dismissText}>Maybe Later</Text>
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

function getUpgradeBenefits(plan: PlanId): string[] {
  switch (plan) {
    case "plus":
      return [
        "500 credits/month",
        "Unlimited translations & songs",
        "All 62+ languages",
        "10 hours AI teacher/month",
        "Offline mode",
        "Priority support",
      ];
    case "pro":
      return [
        "2000 credits/month",
        "Unlimited AI teacher hours",
        "Unlimited simulations",
        "Voice cloning",
        "Certificate exams",
        "Progress analytics",
      ];
    case "enterprise":
      return [
        "10000 credits/month",
        "Team management dashboard",
        "Custom curriculum builder",
        "API access",
        "Dedicated support",
        "White-label option",
      ];
    default:
      return [];
  }
}

// ─── PremiumGuard Component ─────────────────────────────────────────────────
export function PremiumGuard({ feature, children, renderLocked, inline }: PremiumGuardProps) {
  const { plan, isLoading } = useSubscription();
  const [showModal, setShowModal] = useState(false);

  // While loading, show children (optimistic)
  if (isLoading) return <>{children}</>;

  const hasAccess = canAccessFeature(plan, feature);

  if (hasAccess) {
    return <>{children}</>;
  }

  // Locked state
  const featureInfo = FEATURE_INFO[feature];

  if (renderLocked) {
    return (
      <>
        {renderLocked({
          requiredPlan: featureInfo.requiredPlan,
          featureName: featureInfo.name,
          onUpgrade: () => setShowModal(true),
        })}
        <UpgradeModal
          visible={showModal}
          onDismiss={() => setShowModal(false)}
          feature={feature}
          currentPlan={plan}
        />
      </>
    );
  }

  if (inline) {
    return (
      <>
        <TouchableOpacity
          style={styles.inlineLocked}
          onPress={() => setShowModal(true)}
          activeOpacity={0.7}
        >
          <View style={styles.inlineLockedIcon}>
            <Ionicons name="lock-closed" size={16} color={Colors.gold} />
          </View>
          <View style={styles.inlineLockedContent}>
            <Text style={styles.inlineLockedTitle}>{featureInfo.name}</Text>
            <Text style={styles.inlineLockedDesc}>
              {PLAN_DISPLAY[featureInfo.requiredPlan].name} plan required
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
        </TouchableOpacity>
        <UpgradeModal
          visible={showModal}
          onDismiss={() => setShowModal(false)}
          feature={feature}
          currentPlan={plan}
        />
      </>
    );
  }

  // Default: wrap children with locked overlay
  return (
    <>
      <TouchableOpacity
        style={styles.lockedWrapper}
        onPress={() => setShowModal(true)}
        activeOpacity={0.8}
      >
        <View style={styles.lockedOverlay}>
          <View style={styles.lockedBadge}>
            <Ionicons name="lock-closed" size={14} color={Colors.gold} />
            <Text style={styles.lockedBadgeText}>
              {PLAN_DISPLAY[featureInfo.requiredPlan].name}
            </Text>
          </View>
        </View>
        <View style={styles.lockedChildren} pointerEvents="none">
          {children}
        </View>
      </TouchableOpacity>
      <UpgradeModal
        visible={showModal}
        onDismiss={() => setShowModal(false)}
        feature={feature}
        currentPlan={plan}
      />
    </>
  );
}

// ─── Premium Screen Guard ───────────────────────────────────────────────────
// Use this to guard entire screens - shows a full-screen upgrade prompt
interface PremiumScreenGuardProps {
  feature: PremiumFeature;
  children: React.ReactNode;
}

export function PremiumScreenGuard({ feature, children }: PremiumScreenGuardProps) {
  const { plan, isLoading } = useSubscription();

  if (isLoading) return <>{children}</>;

  const hasAccess = canAccessFeature(plan, feature);
  if (hasAccess) return <>{children}</>;

  const featureInfo = FEATURE_INFO[feature];
  const planInfo = PLAN_DISPLAY[featureInfo.requiredPlan];

  return (
    <View style={styles.screenGuard}>
      <View style={[styles.screenGuardIcon, { borderColor: planInfo.color + "30" }]}>
        <Ionicons name={featureInfo.icon as any} size={48} color={planInfo.color} />
      </View>
      <Text style={styles.screenGuardTitle}>{featureInfo.name}</Text>
      <Text style={styles.screenGuardDesc}>{featureInfo.description}</Text>
      <View style={[styles.screenGuardBadge, { borderColor: planInfo.color + "40" }]}>
        <Ionicons name="lock-closed" size={14} color={planInfo.color} />
        <Text style={[styles.screenGuardBadgeText, { color: planInfo.color }]}>
          Requires {planInfo.name} ({planInfo.price})
        </Text>
      </View>
      <TouchableOpacity
        style={[styles.screenGuardUpgrade, { backgroundColor: planInfo.color }]}
        onPress={() => router.push("/payment-setup")}
        activeOpacity={0.8}
      >
        <Ionicons name="rocket" size={18} color={Colors.primary} />
        <Text style={styles.screenGuardUpgradeText}>Upgrade to {planInfo.name}</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.screenGuardBack}
        onPress={() => router.back()}
        activeOpacity={0.7}
      >
        <Ionicons name="arrow-back" size={16} color={Colors.textSecondary} />
        <Text style={styles.screenGuardBackText}>Go Back</Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── Usage Guard Hook ───────────────────────────────────────────────────────
// Checks daily usage limits for free/plus users
export function useDailyUsageGuard(type: keyof typeof PLAN_DAILY_LIMITS.free) {
  const { plan } = useSubscription();
  const [usageCount, setUsageCount] = useState(0);
  const [showUpgrade, setShowUpgrade] = useState(false);

  const limit = PLAN_DAILY_LIMITS[plan][type];
  const isUnlimited = limit === -1;
  const remaining = isUnlimited ? Infinity : Math.max(0, limit - usageCount);
  const isAtLimit = !isUnlimited && usageCount >= limit;

  useEffect(() => {
    loadUsage();
  }, []);

  const loadUsage = async () => {
    try {
      const today = new Date().toISOString().split("T")[0];
      const key = `@daily_usage_${type}_${today}`;
      const count = await AsyncStorage.getItem(key);
      if (count) setUsageCount(parseInt(count, 10));
    } catch {}
  };

  const incrementUsage = async (): Promise<boolean> => {
    if (isUnlimited) return true;
    if (isAtLimit) {
      setShowUpgrade(true);
      return false;
    }
    const newCount = usageCount + 1;
    setUsageCount(newCount);
    const today = new Date().toISOString().split("T")[0];
    const key = `@daily_usage_${type}_${today}`;
    await AsyncStorage.setItem(key, String(newCount));
    if (newCount >= limit) {
      setShowUpgrade(true);
      return false;
    }
    return true;
  };

  return {
    usageCount,
    limit,
    remaining,
    isUnlimited,
    isAtLimit,
    showUpgrade,
    setShowUpgrade,
    incrementUsage,
  };
}

// ─── Styles ─────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  // Modal
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.75)",
    justifyContent: "flex-end",
  },
  overlayTouchable: {
    flex: 1,
  },
  sheet: {
    backgroundColor: Colors.surfaceCard,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: 40,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.border,
    borderBottomWidth: 0,
  },
  handleBar: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.textMuted,
    marginBottom: Spacing.lg,
  },
  lockIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.gold + "10",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.md,
    borderWidth: 2,
  },
  title: {
    fontSize: FontSize.sm,
    fontWeight: "600",
    color: Colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 4,
  },
  featureName: {
    fontSize: FontSize.xl,
    fontWeight: "800",
    color: Colors.textPrimary,
    marginBottom: 8,
    textAlign: "center",
  },
  description: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: Spacing.lg,
    paddingHorizontal: Spacing.md,
  },
  requiredPlanBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: Colors.surfaceElevated,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginBottom: Spacing.md,
  },
  requiredPlanText: {
    fontSize: FontSize.sm,
    fontWeight: "700",
  },
  requiredPlanPrice: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    fontWeight: "500",
  },
  currentPlanRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: Spacing.lg,
  },
  currentPlanLabel: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
  },
  currentPlanBadge: {
    backgroundColor: Colors.surfaceElevated,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  currentPlanValue: {
    fontSize: FontSize.sm,
    fontWeight: "600",
    color: Colors.textSecondary,
  },
  benefitsSection: {
    width: "100%",
    marginBottom: Spacing.lg,
  },
  benefitsTitle: {
    fontSize: FontSize.sm,
    fontWeight: "600",
    color: Colors.textPrimary,
    marginBottom: 10,
  },
  benefitRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
  },
  benefitText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  upgradeButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    width: "100%",
    paddingVertical: 14,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
  },
  upgradeButtonText: {
    fontSize: FontSize.md,
    fontWeight: "700",
    color: Colors.primary,
  },
  viewPlansButton: {
    paddingVertical: 10,
    marginBottom: 4,
  },
  viewPlansText: {
    fontSize: FontSize.sm,
    fontWeight: "600",
    color: Colors.secondary,
  },
  dismissButton: {
    paddingVertical: 8,
  },
  dismissText: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
  },

  // Inline locked
  inlineLocked: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surfaceCard,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.gold + "25",
    gap: 12,
  },
  inlineLockedIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.gold + "15",
    alignItems: "center",
    justifyContent: "center",
  },
  inlineLockedContent: {
    flex: 1,
  },
  inlineLockedTitle: {
    fontSize: FontSize.sm,
    fontWeight: "600",
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  inlineLockedDesc: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
  },

  // Locked wrapper (overlay on children)
  lockedWrapper: {
    position: "relative",
  },
  lockedOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(4, 8, 16, 0.7)",
    borderRadius: BorderRadius.md,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },
  lockedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Colors.surfaceCard,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.gold + "40",
  },
  lockedBadgeText: {
    fontSize: FontSize.xs,
    fontWeight: "700",
    color: Colors.gold,
  },
  lockedChildren: {
    opacity: 0.4,
  },

  // Screen guard (full screen)
  screenGuard: {
    flex: 1,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing.xl,
  },
  screenGuardIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: Colors.surfaceCard,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.lg,
    borderWidth: 2,
  },
  screenGuardTitle: {
    fontSize: FontSize.xl,
    fontWeight: "800",
    color: Colors.textPrimary,
    marginBottom: 8,
    textAlign: "center",
  },
  screenGuardDesc: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: Spacing.lg,
  },
  screenGuardBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: Colors.surfaceElevated,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginBottom: Spacing.xl,
  },
  screenGuardBadgeText: {
    fontSize: FontSize.sm,
    fontWeight: "600",
  },
  screenGuardUpgrade: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    width: "100%",
    paddingVertical: 16,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
  },
  screenGuardUpgradeText: {
    fontSize: FontSize.md,
    fontWeight: "700",
    color: Colors.primary,
  },
  screenGuardBack: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 12,
  },
  screenGuardBackText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
});

// Need AsyncStorage for usage guard
import AsyncStorage from "@react-native-async-storage/async-storage";
