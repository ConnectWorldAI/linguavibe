import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { ScreenContainer } from "@/components/screen-container";
import { Colors, Spacing, BorderRadius, FontSize } from "@/constants/Colors";
import {
  purchaseStreakFreeze,
  purchaseFreezeWithCredits,
  getStreakFreezeData,
  type StreakFreezeData,
} from "@/lib/streak-freeze";

interface PurchaseOption {
  id: string;
  quantity: number;
  price: string;
  perUnit: string;
  savings: string | null;
  popular: boolean;
}

const PURCHASE_OPTIONS: PurchaseOption[] = [
  { id: "single", quantity: 1, price: "$0.99", perUnit: "$0.99/freeze", savings: null, popular: false },
  { id: "triple", quantity: 3, price: "$2.49", perUnit: "$0.83/freeze", savings: "Save 16%", popular: true },
  { id: "five_pack", quantity: 5, price: "$3.99", perUnit: "$0.80/freeze", savings: "Save 20%", popular: false },
];

const CREDITS_OPTION = { quantity: 1, cost: 10, label: "10 Credits" };

export default function StreakFreezePurchaseScreen() {
  const router = useRouter();
  const [freezeData, setFreezeData] = useState<StreakFreezeData | null>(null);
  const [selectedOption, setSelectedOption] = useState<string>("triple");
  const [purchasing, setPurchasing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"money" | "credits">("money");

  useEffect(() => {
    loadFreezeData();
  }, []);

  const loadFreezeData = async () => {
    const data = await getStreakFreezeData();
    setFreezeData(data);
  };

  const handlePurchase = async () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setPurchasing(true);

    try {
      if (paymentMethod === "credits") {
        const result = await purchaseFreezeWithCredits(1);
        if (result.success) {
          if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          Alert.alert("Purchase Complete!", "1 streak freeze added to your inventory.", [
            { text: "OK", onPress: () => { loadFreezeData(); } },
          ]);
        } else {
          Alert.alert("Purchase Failed", "Not enough credits. Earn more by completing lessons!");
        }
      } else {
        const option = PURCHASE_OPTIONS.find(o => o.id === selectedOption);
        const quantity = option?.quantity || 1;
        const result = await purchaseStreakFreeze(quantity);
        if (result.success) {
          if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          Alert.alert("Purchase Complete!", `${quantity} streak freeze${quantity > 1 ? "s" : ""} added!`, [
            { text: "OK", onPress: () => { loadFreezeData(); } },
          ]);
        } else {
          Alert.alert("Purchase Failed", "Something went wrong. Please try again.");
        }
      }
    } catch (err) {
      Alert.alert("Error", "Could not complete purchase. Please try again later.");
    } finally {
      setPurchasing(false);
    }
  };

  return (
    <ScreenContainer>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Streak Freeze</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Current Inventory */}
        <View style={styles.inventoryCard}>
          <View style={styles.inventoryIcon}>
            <Ionicons name="snow" size={32} color={Colors.secondary} />
          </View>
          <View style={styles.inventoryInfo}>
            <Text style={styles.inventoryTitle}>Your Freezes</Text>
            <Text style={styles.inventoryCount}>
              {freezeData?.availableFreezes ?? 0} available
            </Text>
          </View>
          {freezeData?.activeFreezeDate && (
            <View style={styles.activeBadge}>
              <Text style={styles.activeBadgeText}>Active</Text>
            </View>
          )}
        </View>

        {/* Explanation */}
        <View style={styles.explainCard}>
          <Ionicons name="information-circle" size={20} color={Colors.secondary} />
          <Text style={styles.explainText}>
            Streak freezes protect your daily streak when you miss a day. One freeze = one day of protection. Use them wisely!
          </Text>
        </View>

        {/* Payment Method Toggle */}
        <View style={styles.methodToggle}>
          <TouchableOpacity
            style={[styles.methodBtn, paymentMethod === "money" && styles.methodBtnActive]}
            onPress={() => setPaymentMethod("money")}
          >
            <Ionicons name="card" size={16} color={paymentMethod === "money" ? "#fff" : Colors.textMuted} />
            <Text style={[styles.methodText, paymentMethod === "money" && styles.methodTextActive]}>
              Purchase
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.methodBtn, paymentMethod === "credits" && styles.methodBtnActive]}
            onPress={() => setPaymentMethod("credits")}
          >
            <Ionicons name="star" size={16} color={paymentMethod === "credits" ? "#fff" : Colors.textMuted} />
            <Text style={[styles.methodText, paymentMethod === "credits" && styles.methodTextActive]}>
              Use Credits
            </Text>
          </TouchableOpacity>
        </View>

        {/* Purchase Options */}
        {paymentMethod === "money" ? (
          <View style={styles.optionsContainer}>
            {PURCHASE_OPTIONS.map((option) => {
              const isSelected = selectedOption === option.id;
              return (
                <TouchableOpacity
                  key={option.id}
                  style={[
                    styles.optionCard,
                    isSelected && styles.optionCardSelected,
                    option.popular && styles.optionCardPopular,
                  ]}
                  onPress={() => {
                    setSelectedOption(option.id);
                    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
                  activeOpacity={0.7}
                >
                  {option.popular && (
                    <View style={styles.popularBadge}>
                      <Text style={styles.popularBadgeText}>BEST VALUE</Text>
                    </View>
                  )}
                  <View style={styles.optionLeft}>
                    <View style={[styles.radioOuter, isSelected && styles.radioOuterSelected]}>
                      {isSelected && <View style={styles.radioInner} />}
                    </View>
                    <View>
                      <Text style={styles.optionQuantity}>
                        {option.quantity} Freeze{option.quantity > 1 ? "s" : ""}
                      </Text>
                      <Text style={styles.optionPerUnit}>{option.perUnit}</Text>
                    </View>
                  </View>
                  <View style={styles.optionRight}>
                    <Text style={styles.optionPrice}>{option.price}</Text>
                    {option.savings && (
                      <Text style={styles.optionSavings}>{option.savings}</Text>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        ) : (
          <View style={styles.creditsContainer}>
            <View style={styles.creditsCard}>
              <View style={styles.creditsLeft}>
                <Ionicons name="star" size={24} color={Colors.gold} />
                <View>
                  <Text style={styles.creditsTitle}>1 Streak Freeze</Text>
                  <Text style={styles.creditsSubtext}>Costs {CREDITS_OPTION.cost} credits</Text>
                </View>
              </View>
              <View style={styles.creditsCost}>
                <Text style={styles.creditsCostText}>{CREDITS_OPTION.label}</Text>
              </View>
            </View>
            <Text style={styles.creditsHint}>
              Earn credits by completing lessons, winning duels, and maintaining streaks!
            </Text>
          </View>
        )}

        {/* Purchase Button */}
        <TouchableOpacity
          style={[styles.purchaseBtn, purchasing && styles.purchaseBtnDisabled]}
          onPress={handlePurchase}
          activeOpacity={0.8}
          disabled={purchasing}
        >
          {purchasing ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              <Ionicons name="snow" size={20} color="#fff" />
              <Text style={styles.purchaseBtnText}>
                {paymentMethod === "money"
                  ? `Buy ${PURCHASE_OPTIONS.find(o => o.id === selectedOption)?.quantity || 1} Freeze${(PURCHASE_OPTIONS.find(o => o.id === selectedOption)?.quantity || 1) > 1 ? "s" : ""}`
                  : "Redeem with Credits"}
              </Text>
            </>
          )}
        </TouchableOpacity>

        {/* Restore Purchases */}
        {paymentMethod === "money" && (
          <TouchableOpacity style={styles.restoreBtn} onPress={() => {
            Alert.alert("Restore Purchases", "Checking for previous purchases...");
          }}>
            <Text style={styles.restoreBtnText}>Restore Purchases</Text>
          </TouchableOpacity>
        )}

        {/* Purchase History */}
        {freezeData && freezeData.purchaseHistory.length > 0 && (
          <View style={styles.historySection}>
            <Text style={styles.historyTitle}>Recent Purchases</Text>
            {freezeData.purchaseHistory.slice(0, 5).map((purchase, i) => (
              <View key={purchase.id || i} style={styles.historyRow}>
                <View style={styles.historyLeft}>
                  <Ionicons name="receipt" size={16} color={Colors.textMuted} />
                  <Text style={styles.historyDate}>
                    {new Date(purchase.date).toLocaleDateString()}
                  </Text>
                </View>
                <Text style={styles.historyPrice}>{purchase.price}</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingBottom: 40 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surfaceCard,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: { fontSize: FontSize.xl, fontWeight: "700", color: Colors.textPrimary },
  inventoryCard: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    marginTop: 12,
    padding: 16,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.surfaceCard,
    borderWidth: 1,
    borderColor: Colors.glowBorder,
  },
  inventoryIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.glowSubtle,
    alignItems: "center",
    justifyContent: "center",
  },
  inventoryInfo: { flex: 1, marginLeft: 14 },
  inventoryTitle: { fontSize: FontSize.sm, color: Colors.textMuted },
  inventoryCount: { fontSize: FontSize.xl, fontWeight: "800", color: Colors.textPrimary, marginTop: 2 },
  activeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: Colors.success + "20",
  },
  activeBadgeText: { fontSize: FontSize.xs, fontWeight: "700", color: Colors.success },
  explainCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    marginHorizontal: 16,
    marginTop: 16,
    padding: 14,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.secondary + "10",
    borderWidth: 1,
    borderColor: Colors.secondary + "30",
  },
  explainText: { flex: 1, fontSize: FontSize.sm, color: Colors.textSecondary, lineHeight: 20 },
  methodToggle: {
    flexDirection: "row",
    marginHorizontal: 16,
    marginTop: 20,
    backgroundColor: Colors.surfaceCard,
    borderRadius: BorderRadius.md,
    padding: 4,
  },
  methodBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: BorderRadius.sm,
  },
  methodBtnActive: { backgroundColor: Colors.secondary },
  methodText: { fontSize: FontSize.sm, fontWeight: "600", color: Colors.textMuted },
  methodTextActive: { color: "#fff" },
  optionsContainer: { paddingHorizontal: 16, marginTop: 16, gap: 10 },
  optionCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surfaceCard,
    borderWidth: 1.5,
    borderColor: Colors.border,
    position: "relative",
    overflow: "hidden",
  },
  optionCardSelected: { borderColor: Colors.secondary, backgroundColor: Colors.secondary + "08" },
  optionCardPopular: {},
  popularBadge: {
    position: "absolute",
    top: 0,
    right: 0,
    backgroundColor: Colors.gold,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderBottomLeftRadius: 8,
  },
  popularBadgeText: { fontSize: 9, fontWeight: "800", color: Colors.primary },
  optionLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  radioOuterSelected: { borderColor: Colors.secondary },
  radioInner: { width: 12, height: 12, borderRadius: 6, backgroundColor: Colors.secondary },
  optionQuantity: { fontSize: FontSize.md, fontWeight: "700", color: Colors.textPrimary },
  optionPerUnit: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 2 },
  optionRight: { alignItems: "flex-end" },
  optionPrice: { fontSize: FontSize.lg, fontWeight: "800", color: Colors.textPrimary },
  optionSavings: { fontSize: FontSize.xs, fontWeight: "600", color: Colors.success, marginTop: 2 },
  creditsContainer: { paddingHorizontal: 16, marginTop: 16 },
  creditsCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surfaceCard,
    borderWidth: 1,
    borderColor: Colors.goldBorder,
  },
  creditsLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  creditsTitle: { fontSize: FontSize.md, fontWeight: "700", color: Colors.textPrimary },
  creditsSubtext: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 2 },
  creditsCost: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: Colors.goldGlow,
  },
  creditsCostText: { fontSize: FontSize.sm, fontWeight: "700", color: Colors.gold },
  creditsHint: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    marginTop: 12,
    textAlign: "center",
    lineHeight: 18,
  },
  purchaseBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    marginHorizontal: 16,
    marginTop: 24,
    paddingVertical: 16,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.secondary,
  },
  purchaseBtnDisabled: { opacity: 0.6 },
  purchaseBtnText: { fontSize: FontSize.lg, fontWeight: "700", color: "#fff" },
  restoreBtn: { alignItems: "center", marginTop: 14 },
  restoreBtnText: { fontSize: FontSize.sm, color: Colors.textMuted, textDecorationLine: "underline" },
  historySection: { marginHorizontal: 16, marginTop: 28 },
  historyTitle: { fontSize: FontSize.md, fontWeight: "700", color: Colors.textPrimary, marginBottom: 12 },
  historyRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.border,
  },
  historyLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
  historyDate: { fontSize: FontSize.sm, color: Colors.textMuted },
  historyPrice: { fontSize: FontSize.sm, fontWeight: "600", color: Colors.textPrimary },
});
