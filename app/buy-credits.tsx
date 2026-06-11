import React, { useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Modal,
  Animated,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import { Colors, Spacing, BorderRadius, FontSize } from "../constants/Colors";
import { useUsage } from "@/lib/usage-context";

interface CreditPack {
  id: string;
  credits: number;
  price: string;
  priceValue: number;
  perCredit: string;
  badge?: string;
  popular?: boolean;
  savings?: string;
}

const CREDIT_PACKS: CreditPack[] = [
  {
    id: "starter",
    credits: 50,
    price: "$4.99",
    priceValue: 4.99,
    perCredit: "$0.10",
  },
  {
    id: "popular",
    credits: 200,
    price: "$14.99",
    priceValue: 14.99,
    perCredit: "$0.075",
    badge: "BEST VALUE",
    popular: true,
    savings: "Save 25%",
  },
  {
    id: "power",
    credits: 500,
    price: "$29.99",
    priceValue: 29.99,
    perCredit: "$0.06",
    savings: "Save 40%",
  },
  {
    id: "mega",
    credits: 1000,
    price: "$49.99",
    priceValue: 49.99,
    perCredit: "$0.05",
    badge: "MEGA PACK",
    savings: "Save 50%",
  },
];

const BONUS_OFFERS = [
  { icon: "gift", text: "First purchase: +20% bonus credits", color: Colors.success },
  { icon: "people", text: "Refer a friend: +25 credits each", color: Colors.secondary },
  { icon: "flame", text: "7-day streak: +10 bonus credits", color: Colors.gold },
];

export default function BuyCreditsScreen() {
  const { usage, incrementUsage } = useUsage();
  const [selectedPack, setSelectedPack] = useState<CreditPack | null>(CREDIT_PACKS[1]);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const successAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0)).current;

  const creditsRemaining = Math.max(usage.creditsTotal - usage.creditsUsed, 0);

  const handlePurchase = () => {
    if (!selectedPack) return;
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setShowConfirm(true);
  };

  const confirmPurchase = () => {
    if (!selectedPack) return;
    if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setShowConfirm(false);

    // Add credits to balance (negative increment to creditsUsed effectively adds credits)
    // We'll add to creditsTotal via a direct update
    incrementUsage("credits", -selectedPack.credits);

    // Show success animation
    setShowSuccess(true);
    Animated.sequence([
      Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, tension: 80, friction: 8 }),
      Animated.timing(successAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
    ]).start();

    setTimeout(() => {
      setShowSuccess(false);
      scaleAnim.setValue(0);
      successAnim.setValue(0);
    }, 3000);
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Buy Credits</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Current Balance */}
        <View style={styles.balanceCard}>
          <View style={styles.balanceRow}>
            <View style={styles.balanceIconWrap}>
              <Ionicons name="diamond" size={28} color={Colors.gold} />
            </View>
            <View>
              <Text style={styles.balanceLabel}>Current Balance</Text>
              <Text style={styles.balanceAmount}>{creditsRemaining} credits</Text>
            </View>
          </View>
        </View>

        {/* Credit Packs */}
        <Text style={styles.sectionTitle}>Choose a Credit Pack</Text>
        {CREDIT_PACKS.map((pack) => (
          <TouchableOpacity
            key={pack.id}
            style={[
              styles.packCard,
              selectedPack?.id === pack.id && styles.packCardSelected,
              pack.popular && styles.packCardPopular,
            ]}
            activeOpacity={0.7}
            onPress={() => {
              if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setSelectedPack(pack);
            }}
          >
            {pack.badge && (
              <View style={[styles.packBadge, pack.popular && styles.packBadgePopular]}>
                <Text style={styles.packBadgeText}>{pack.badge}</Text>
              </View>
            )}
            <View style={styles.packContent}>
              <View style={styles.packLeft}>
                <View style={styles.packCreditsRow}>
                  <Ionicons name="diamond" size={18} color={Colors.gold} />
                  <Text style={styles.packCredits}>{pack.credits}</Text>
                  <Text style={styles.packCreditsLabel}>credits</Text>
                </View>
                <Text style={styles.packPerCredit}>{pack.perCredit} per credit</Text>
                {pack.savings && (
                  <View style={styles.savingsBadge}>
                    <Text style={styles.savingsText}>{pack.savings}</Text>
                  </View>
                )}
              </View>
              <View style={styles.packRight}>
                <Text style={styles.packPrice}>{pack.price}</Text>
                <View style={[styles.radioOuter, selectedPack?.id === pack.id && styles.radioSelected]}>
                  {selectedPack?.id === pack.id && <View style={styles.radioInner} />}
                </View>
              </View>
            </View>
          </TouchableOpacity>
        ))}

        {/* Bonus Offers */}
        <Text style={styles.sectionTitle}>Ways to Earn Free Credits</Text>
        <View style={styles.bonusCard}>
          {BONUS_OFFERS.map((offer, idx) => (
            <View key={idx} style={styles.bonusRow}>
              <View style={[styles.bonusIconWrap, { backgroundColor: offer.color + "20" }]}>
                <Ionicons name={offer.icon as any} size={18} color={offer.color} />
              </View>
              <Text style={styles.bonusText}>{offer.text}</Text>
            </View>
          ))}
        </View>

        {/* What Credits Buy */}
        <Text style={styles.sectionTitle}>What Credits Buy</Text>
        <View style={styles.valueCard}>
          <View style={styles.valueRow}>
            <Ionicons name="call" size={16} color={Colors.success} />
            <Text style={styles.valueText}>1 credit = 1 min voice translation</Text>
          </View>
          <View style={styles.valueRow}>
            <Ionicons name="videocam" size={16} color={Colors.glow} />
            <Text style={styles.valueText}>2 credits = 1 min video translation</Text>
          </View>
          <View style={styles.valueRow}>
            <Ionicons name="musical-notes" size={16} color={Colors.gold} />
            <Text style={styles.valueText}>5 credits = 1 song breakdown</Text>
          </View>
          <View style={styles.valueRow}>
            <Ionicons name="school" size={16} color={Colors.secondary} />
            <Text style={styles.valueText}>3 credits = 1 min AI teacher</Text>
          </View>
        </View>
      </ScrollView>

      {/* Purchase Button */}
      {selectedPack && (
        <View style={styles.purchaseBar}>
          <View style={styles.purchaseSummary}>
            <Text style={styles.purchaseSummaryText}>
              {selectedPack.credits} credits for {selectedPack.price}
            </Text>
          </View>
          <TouchableOpacity style={styles.purchaseBtn} onPress={handlePurchase}>
            <Ionicons name="cart" size={18} color="#fff" />
            <Text style={styles.purchaseBtnText}>Purchase</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Confirmation Modal */}
      <Modal visible={showConfirm} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalIconWrap}>
              <Ionicons name="diamond" size={32} color={Colors.gold} />
            </View>
            <Text style={styles.modalTitle}>Confirm Purchase</Text>
            <Text style={styles.modalDesc}>
              You're about to purchase {selectedPack?.credits} credits for {selectedPack?.price}.
            </Text>
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setShowConfirm(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalConfirmBtn} onPress={confirmPurchase}>
                <Ionicons name="checkmark" size={18} color="#fff" />
                <Text style={styles.modalConfirmText}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Success Animation */}
      {showSuccess && (
        <View style={styles.successOverlay}>
          <Animated.View style={[styles.successCard, { transform: [{ scale: scaleAnim }] }]}>
            <Ionicons name="checkmark-circle" size={64} color={Colors.success} />
            <Text style={styles.successTitle}>Purchase Complete!</Text>
            <Text style={styles.successDesc}>
              +{selectedPack?.credits} credits added to your balance
            </Text>
            <Animated.Text style={[styles.successBalance, { opacity: successAnim }]}>
              New balance: {creditsRemaining + (selectedPack?.credits || 0)} credits
            </Animated.Text>
          </Animated.View>
        </View>
      )}
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
  backBtn: {
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
    fontSize: FontSize.xl,
    fontWeight: "800",
    color: Colors.textPrimary,
  },

  // Balance Card
  balanceCard: {
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.md,
    backgroundColor: Colors.surfaceCard,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.goldBorder,
  },
  balanceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  balanceIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.goldGlow,
    alignItems: "center",
    justifyContent: "center",
  },
  balanceLabel: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
  },
  balanceAmount: {
    fontSize: FontSize.xxl,
    fontWeight: "800",
    color: Colors.gold,
  },

  // Section
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: "700",
    color: Colors.textPrimary,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.xl,
    marginBottom: Spacing.sm,
  },

  // Pack Card
  packCard: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
    backgroundColor: Colors.surfaceCard,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  packCardSelected: {
    borderColor: Colors.secondary,
    backgroundColor: Colors.surfaceElevated,
  },
  packCardPopular: {
    borderColor: Colors.gold,
  },
  packBadge: {
    position: "absolute",
    top: -8,
    right: 12,
    backgroundColor: Colors.secondary,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  packBadgePopular: {
    backgroundColor: Colors.gold,
  },
  packBadgeText: {
    fontSize: 9,
    fontWeight: "800",
    color: "#fff",
  },
  packContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  packLeft: {
    flex: 1,
  },
  packCreditsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  packCredits: {
    fontSize: FontSize.xl,
    fontWeight: "800",
    color: Colors.textPrimary,
  },
  packCreditsLabel: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  packPerCredit: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    marginTop: 2,
  },
  savingsBadge: {
    marginTop: 4,
    backgroundColor: Colors.greenGlow,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    alignSelf: "flex-start",
  },
  savingsText: {
    fontSize: 10,
    fontWeight: "700",
    color: Colors.success,
  },
  packRight: {
    alignItems: "center",
    gap: 8,
  },
  packPrice: {
    fontSize: FontSize.lg,
    fontWeight: "800",
    color: Colors.textPrimary,
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: Colors.textMuted,
    alignItems: "center",
    justifyContent: "center",
  },
  radioSelected: {
    borderColor: Colors.secondary,
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.secondary,
  },

  // Bonus
  bonusCard: {
    marginHorizontal: Spacing.lg,
    backgroundColor: Colors.surfaceCard,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 12,
  },
  bonusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  bonusIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  bonusText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    flex: 1,
  },

  // Value Card
  valueCard: {
    marginHorizontal: Spacing.lg,
    backgroundColor: Colors.surfaceCard,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 10,
  },
  valueRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  valueText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },

  // Purchase Bar
  purchaseBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.surfaceCard,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    padding: Spacing.md,
    paddingBottom: Spacing.xl,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  purchaseSummary: {
    flex: 1,
  },
  purchaseSummaryText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  purchaseBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Colors.secondary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: BorderRadius.md,
  },
  purchaseBtnText: {
    fontSize: FontSize.md,
    fontWeight: "700",
    color: "#fff",
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: Colors.overlay,
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.lg,
  },
  modalCard: {
    backgroundColor: Colors.surfaceCard,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    alignItems: "center",
    width: "100%",
    maxWidth: 340,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  modalIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.goldGlow,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.md,
  },
  modalTitle: {
    fontSize: FontSize.xl,
    fontWeight: "800",
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  modalDesc: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    textAlign: "center",
    marginBottom: Spacing.lg,
  },
  modalActions: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
  },
  modalCancelText: {
    fontSize: FontSize.sm,
    fontWeight: "600",
    color: Colors.textSecondary,
  },
  modalConfirmBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.secondary,
  },
  modalConfirmText: {
    fontSize: FontSize.sm,
    fontWeight: "700",
    color: "#fff",
  },

  // Success
  successOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.overlay,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 9999,
  },
  successCard: {
    backgroundColor: Colors.surfaceCard,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xxl,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.greenBorder,
  },
  successTitle: {
    fontSize: FontSize.xl,
    fontWeight: "800",
    color: Colors.success,
    marginTop: Spacing.md,
  },
  successDesc: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  successBalance: {
    fontSize: FontSize.lg,
    fontWeight: "700",
    color: Colors.gold,
    marginTop: Spacing.md,
  },
});
