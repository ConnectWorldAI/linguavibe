/**
 * Streak Freeze Shop Modal
 * Quick-buy modal accessible from the home screen streak display.
 * Shows inventory count, cost, user XP, and purchase button.
 */
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { shouldPlayHaptic } from "@/lib/sound-settings";
import { Colors, Spacing, BorderRadius, FontSize } from "@/constants/Colors";
import {
  getStreakFreezeData,
  purchaseFreezeWithXP,
  getNextXPFreezeCost,
  MAX_XP_FREEZE_CAPACITY,
} from "@/lib/streak-freeze";
import { getOverallXP } from "@/lib/exercise-scoring";

interface StreakFreezeShopModalProps {
  visible: boolean;
  onClose: () => void;
}

export function StreakFreezeShopModal({ visible, onClose }: StreakFreezeShopModalProps) {
  const [inventory, setInventory] = useState(0);
  const [xpPurchased, setXpPurchased] = useState(0);
  const [userXP, setUserXP] = useState(0);
  const [cost, setCost] = useState(50);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (visible) {
      loadData();
    }
  }, [visible]);

  const loadData = async () => {
    try {
      const freezeData = await getStreakFreezeData();
      setInventory(freezeData.availableFreezes || 0);
      setXpPurchased(freezeData.purchaseHistory?.length || 0);

      const xp = await getOverallXP();
      setUserXP(xp.totalXP);

      const nextCost = getNextXPFreezeCost(freezeData.purchaseHistory?.length || 0);
      setCost(nextCost);
      setMessage("");
    } catch {
      setInventory(0);
      setUserXP(0);
      setCost(50);
    }
  };

  const handlePurchase = async () => {
    setLoading(true);
    setMessage("");
    if (Platform.OS !== "web") {
      const hapticOn = await shouldPlayHaptic();
      if (hapticOn) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    try {
      const result = await purchaseFreezeWithXP(userXP);
      if (result.success) {
        setMessage("Freeze purchased!");
        if (Platform.OS !== "web") {
          const hapticOn = await shouldPlayHaptic();
          if (hapticOn) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
        await loadData();
      } else {
        setMessage(result.error || "Purchase failed");
        if (Platform.OS !== "web") {
          const hapticOn = await shouldPlayHaptic();
          if (hapticOn) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        }
      }
    } catch {
      setMessage("Something went wrong");
    }
    setLoading(false);
  };

  const canPurchase = userXP >= cost && xpPurchased < MAX_XP_FREEZE_CAPACITY;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Ionicons name="snow" size={22} color={Colors.primary} />
              <Text style={styles.title}>Streak Freeze Shop</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color={Colors.textMuted} />
            </TouchableOpacity>
          </View>

          {/* Inventory */}
          <View style={styles.inventoryRow}>
            <View style={styles.inventoryCard}>
              <Ionicons name="shield-checkmark" size={28} color="#60A5FA" />
              <Text style={styles.inventoryCount}>{inventory}</Text>
              <Text style={styles.inventoryLabel}>Available</Text>
            </View>
            <View style={styles.inventoryCard}>
              <Ionicons name="star" size={28} color="#FBBF24" />
              <Text style={styles.inventoryCount}>{userXP}</Text>
              <Text style={styles.inventoryLabel}>Your XP</Text>
            </View>
          </View>

          {/* Cost Info */}
          <View style={styles.costSection}>
            <Text style={styles.costLabel}>Next freeze costs</Text>
            <Text style={styles.costValue}>{cost} XP</Text>
            {xpPurchased >= MAX_XP_FREEZE_CAPACITY && (
              <Text style={styles.maxReached}>Max capacity reached ({MAX_XP_FREEZE_CAPACITY})</Text>
            )}
          </View>

          {/* Purchase Button */}
          <TouchableOpacity
            style={[styles.buyButton, !canPurchase && styles.buyButtonDisabled]}
            onPress={handlePurchase}
            disabled={!canPurchase || loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Ionicons name="flash" size={18} color="#fff" />
                <Text style={styles.buyButtonText}>
                  Buy Freeze — {cost} XP
                </Text>
              </>
            )}
          </TouchableOpacity>

          {/* Message */}
          {message !== "" && (
            <Text style={[styles.message, message.includes("failed") || message.includes("wrong") ? styles.messageError : styles.messageSuccess]}>
              {message}
            </Text>
          )}

          {/* Info */}
          <Text style={styles.info}>
            Freezes automatically protect your streak when you miss a day. Cost increases with each purchase.
          </Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.lg,
  },
  modal: {
    width: "100%",
    maxWidth: 340,
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.md,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  title: {
    fontSize: FontSize.lg,
    fontWeight: "700",
    color: Colors.text,
  },
  closeBtn: {
    padding: 4,
  },
  inventoryRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: Spacing.md,
  },
  inventoryCard: {
    flex: 1,
    alignItems: "center",
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.md,
    paddingVertical: 14,
    gap: 4,
  },
  inventoryCount: {
    fontSize: FontSize.xl,
    fontWeight: "800",
    color: Colors.text,
  },
  inventoryLabel: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
  },
  costSection: {
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  costLabel: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
  },
  costValue: {
    fontSize: FontSize.lg,
    fontWeight: "700",
    color: Colors.primary,
    marginTop: 2,
  },
  maxReached: {
    fontSize: FontSize.xs,
    color: Colors.error || "#EF4444",
    marginTop: 4,
  },
  buyButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.sm,
  },
  buyButtonDisabled: {
    opacity: 0.4,
  },
  buyButtonText: {
    color: "#fff",
    fontSize: FontSize.md,
    fontWeight: "700",
  },
  message: {
    textAlign: "center",
    fontSize: FontSize.sm,
    marginBottom: Spacing.sm,
  },
  messageSuccess: {
    color: Colors.success || "#22C55E",
  },
  messageError: {
    color: Colors.error || "#EF4444",
  },
  info: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    textAlign: "center",
    lineHeight: 16,
  },
});
