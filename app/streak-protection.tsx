import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Colors, Spacing, BorderRadius, FontSize } from "@/constants/Colors";
import { purchaseStreakFreeze, activateFreeze, getStreakFreezeData } from "@/lib/streak-freeze";

const STORAGE_KEY = "@connectworld_streak_protection";

interface StreakProtectionData {
  freezesUsedThisMonth: number;
  freezesAvailable: number;
  lastFreezeDate: string | null;
  streakFrozenToday: boolean;
  monthReset: string; // YYYY-MM
}

const DEFAULT_DATA: StreakProtectionData = {
  freezesUsedThisMonth: 0,
  freezesAvailable: 2,
  lastFreezeDate: null,
  streakFrozenToday: false,
  monthReset: new Date().toISOString().slice(0, 7),
};

export default function StreakProtectionScreen() {
  const router = useRouter();
  const [data, setData] = useState<StreakProtectionData>(DEFAULT_DATA);
  const [purchasing, setPurchasing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as StreakProtectionData;
        // Reset if new month
        const currentMonth = new Date().toISOString().slice(0, 7);
        if (parsed.monthReset !== currentMonth) {
          const reset = { ...DEFAULT_DATA, monthReset: currentMonth };
          await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(reset));
          setData(reset);
        } else {
          setData(parsed);
        }
      }
    } catch {}
  };

  const saveData = async (newData: StreakProtectionData) => {
    setData(newData);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newData));
  };

  const handleFreeze = () => {
    if (data.streakFrozenToday) {
      Alert.alert("Already Frozen", "Your streak is already protected today.");
      return;
    }
    if (data.freezesUsedThisMonth >= 2) {
      Alert.alert(
        "No Freezes Left",
        "You've used both streak freezes this month. Purchase additional freezes for $0.99 each.",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Purchase ($0.99)", onPress: handlePurchaseFreeze },
        ]
      );
      return;
    }

    Alert.alert(
      "Freeze Streak?",
      `Use 1 of your ${data.freezesAvailable - data.freezesUsedThisMonth} remaining free freezes this month? Your streak won't break today.`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Freeze", onPress: confirmFreeze },
      ]
    );
  };

  const confirmFreeze = async () => {
    if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const newData: StreakProtectionData = {
      ...data,
      freezesUsedThisMonth: data.freezesUsedThisMonth + 1,
      lastFreezeDate: new Date().toISOString().split("T")[0],
      streakFrozenToday: true,
    };
    await saveData(newData);
  };

  const handlePurchaseFreeze = async () => {
    setPurchasing(true);
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Purchase via RevenueCat / streak-freeze module
    const result = await purchaseStreakFreeze(1);
    if (!result.success) {
      setPurchasing(false);
      Alert.alert("Purchase Failed", result.error || "Please try again.");
      return;
    }

    // Activate the freeze for today
    await activateFreeze();

    const newData: StreakProtectionData = {
      ...data,
      lastFreezeDate: new Date().toISOString().split("T")[0],
      streakFrozenToday: true,
    };
    await saveData(newData);
    setPurchasing(false);
    if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert("Streak Protected! \u2744\ufe0f", "Your streak is safe today. You now have " + result.data.availableFreezes + " freeze(s) remaining.");
  };

  const handleBuyCredits = () => {
    Alert.alert(
      "Use Credits?",
      "Spend 10 credits to freeze your streak today?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Use 10 Credits",
          onPress: async () => {
            if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            // Use credits to get a freeze and activate it
            const { purchaseFreezeWithCredits } = await import("@/lib/streak-freeze");
            await purchaseFreezeWithCredits(1);
            await activateFreeze();
            const newData: StreakProtectionData = {
              ...data,
              lastFreezeDate: new Date().toISOString().split("T")[0],
              streakFrozenToday: true,
            };
            await saveData(newData);
            Alert.alert("Credits Used!", "10 credits deducted. Your streak is safe today.");
          },
        },
      ]
    );
  };

  const freezesRemaining = Math.max(0, data.freezesAvailable - data.freezesUsedThisMonth);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Streak Protection</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Shield Icon */}
        <View style={styles.shieldContainer}>
          <View style={[styles.shieldCircle, data.streakFrozenToday && styles.shieldFrozen]}>
            <Ionicons
              name={data.streakFrozenToday ? "shield-checkmark" : "shield"}
              size={64}
              color={data.streakFrozenToday ? Colors.glow : Colors.textSecondary}
            />
          </View>
          <Text style={styles.shieldLabel}>
            {data.streakFrozenToday ? "Streak Protected Today!" : "Protect Your Streak"}
          </Text>
          {data.streakFrozenToday && (
            <Text style={styles.frozenSubtext}>
              Your streak won't break today. Keep it up tomorrow!
            </Text>
          )}
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Ionicons name="snow" size={24} color={Colors.glow} />
            <Text style={styles.statValue}>{freezesRemaining}</Text>
            <Text style={styles.statLabel}>Free Freezes Left</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="calendar" size={24} color={Colors.gold} />
            <Text style={styles.statValue}>{data.freezesUsedThisMonth}</Text>
            <Text style={styles.statLabel}>Used This Month</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="infinite" size={24} color={Colors.success} />
            <Text style={styles.statValue}>2</Text>
            <Text style={styles.statLabel}>Monthly Limit</Text>
          </View>
        </View>

        {/* Freeze Button */}
        {!data.streakFrozenToday && (
          <View style={styles.actionSection}>
            <Text style={styles.sectionTitle}>Freeze Options</Text>

            {/* Free Freeze */}
            {freezesRemaining > 0 && (
              <TouchableOpacity style={styles.freezeBtn} activeOpacity={0.7} onPress={handleFreeze}>
                <View style={styles.freezeBtnLeft}>
                  <Ionicons name="snow" size={24} color={Colors.glow} />
                  <View>
                    <Text style={styles.freezeBtnTitle}>Use Free Freeze</Text>
                    <Text style={styles.freezeBtnSub}>{freezesRemaining} remaining this month</Text>
                  </View>
                </View>
                <Text style={styles.freeLabel}>FREE</Text>
              </TouchableOpacity>
            )}

            {/* Purchase Freeze */}
            <TouchableOpacity
              style={styles.purchaseBtn}
              activeOpacity={0.7}
              onPress={handlePurchaseFreeze}
              disabled={purchasing}
            >
              <View style={styles.freezeBtnLeft}>
                <Ionicons name="card" size={24} color={Colors.gold} />
                <View>
                  <Text style={styles.freezeBtnTitle}>Purchase Freeze</Text>
                  <Text style={styles.freezeBtnSub}>One-time $0.99 charge</Text>
                </View>
              </View>
              <Text style={styles.priceLabel}>{purchasing ? "..." : "$0.99"}</Text>
            </TouchableOpacity>

            {/* Credits Option */}
            <TouchableOpacity style={styles.creditsBtn} activeOpacity={0.7} onPress={handleBuyCredits}>
              <View style={styles.freezeBtnLeft}>
                <Ionicons name="diamond" size={24} color={Colors.secondary} />
                <View>
                  <Text style={styles.freezeBtnTitle}>Use Credits</Text>
                  <Text style={styles.freezeBtnSub}>Spend 10 credits from your balance</Text>
                </View>
              </View>
              <Text style={styles.creditsLabel}>10 ◆</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* How It Works */}
        <View style={styles.infoSection}>
          <Text style={styles.sectionTitle}>How It Works</Text>
          <View style={styles.infoCard}>
            {[
              { icon: "shield-checkmark", text: "Freeze protects your streak for 1 day" },
              { icon: "calendar-outline", text: "2 free freezes per month included" },
              { icon: "cart-outline", text: "Additional freezes available for $0.99" },
              { icon: "diamond-outline", text: "Or use 10 credits per freeze" },
              { icon: "warning-outline", text: "Must activate BEFORE midnight" },
              { icon: "refresh-outline", text: "Free freezes reset on the 1st of each month" },
            ].map((item, i) => (
              <View key={i} style={styles.infoRow}>
                <Ionicons name={item.icon as any} size={18} color={Colors.glow} />
                <Text style={styles.infoText}>{item.text}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Earn Freezes Section */}
        <View style={styles.earnSection}>
          <Text style={styles.sectionTitle}>Earn Free Freezes</Text>
          <View style={styles.earnCard}>
            {[
              { icon: "checkmark-done", title: "Complete 5 Daily Goals", reward: "+1 Freeze", progress: "3/5", color: Colors.success },
              { icon: "people", title: "Refer a Friend", reward: "+2 Freezes", progress: "Invite", color: Colors.secondary },
              { icon: "flame", title: "7-Day Streak Bonus", reward: "+1 Freeze", progress: "5/7 days", color: Colors.gold },
              { icon: "trophy", title: "Weekly Challenge Winner", reward: "+1 Freeze", progress: "Join", color: Colors.accent },
              { icon: "musical-notes", title: "Perfect Karaoke Score", reward: "+1 Freeze", progress: "Sing", color: "#EC4899" },
            ].map((item, i) => (
              <TouchableOpacity key={i} style={styles.earnRow} activeOpacity={0.7}>
                <View style={[styles.earnIconCircle, { backgroundColor: item.color + "20" }]}>
                  <Ionicons name={item.icon as any} size={18} color={item.color} />
                </View>
                <View style={styles.earnInfo}>
                  <Text style={styles.earnTitle}>{item.title}</Text>
                  <Text style={styles.earnReward}>{item.reward}</Text>
                </View>
                <View style={[styles.earnBadge, { backgroundColor: item.color + "20" }]}>
                  <Text style={[styles.earnBadgeText, { color: item.color }]}>{item.progress}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Last Freeze */}
        {data.lastFreezeDate && (
          <View style={styles.historyCard}>
            <Ionicons name="time-outline" size={18} color={Colors.textSecondary} />
            <Text style={styles.historyText}>Last freeze used: {data.lastFreezeDate}</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.primary },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingTop: 60,
    paddingBottom: Spacing.md,
  },
  backBtn: { width: 40, height: 40, justifyContent: "center" },
  headerTitle: { fontSize: FontSize.lg, fontWeight: "700", color: Colors.textPrimary },
  content: { padding: Spacing.lg, paddingBottom: 100 },
  shieldContainer: { alignItems: "center", marginBottom: Spacing.xl },
  shieldCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.surfaceCard,
    borderWidth: 2,
    borderColor: Colors.border,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  shieldFrozen: {
    borderColor: Colors.glow,
    backgroundColor: "rgba(0, 204, 255, 0.08)",
    shadowColor: Colors.glow,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
  },
  shieldLabel: { fontSize: FontSize.xl, fontWeight: "700", color: Colors.textPrimary },
  frozenSubtext: { fontSize: FontSize.sm, color: Colors.success, marginTop: 4 },
  statsRow: { flexDirection: "row", gap: Spacing.sm, marginBottom: Spacing.xl },
  statCard: {
    flex: 1,
    backgroundColor: Colors.surfaceCard,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statValue: { fontSize: FontSize.xl, fontWeight: "700", color: Colors.textPrimary },
  statLabel: { fontSize: FontSize.xs, color: Colors.textSecondary, textAlign: "center" },
  actionSection: { marginBottom: Spacing.xl },
  sectionTitle: { fontSize: FontSize.lg, fontWeight: "600", color: Colors.textPrimary, marginBottom: Spacing.md },
  freezeBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Colors.surfaceCard,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.glowBorder,
  },
  purchaseBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Colors.surfaceCard,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.goldBorder,
  },
  creditsBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Colors.surfaceCard,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  freezeBtnLeft: { flexDirection: "row", alignItems: "center", gap: Spacing.md },
  freezeBtnTitle: { fontSize: FontSize.md, fontWeight: "600", color: Colors.textPrimary },
  freezeBtnSub: { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 2 },
  freeLabel: { fontSize: FontSize.sm, fontWeight: "700", color: Colors.success },
  priceLabel: { fontSize: FontSize.md, fontWeight: "700", color: Colors.gold },
  creditsLabel: { fontSize: FontSize.md, fontWeight: "700", color: Colors.secondary },
  infoSection: { marginBottom: Spacing.xl },
  infoCard: {
    backgroundColor: Colors.surfaceCard,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    gap: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  infoRow: { flexDirection: "row", alignItems: "center", gap: Spacing.sm },
  infoText: { fontSize: FontSize.sm, color: Colors.textSecondary, flex: 1 },
  historyCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    backgroundColor: Colors.surfaceCard,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  historyText: { fontSize: FontSize.sm, color: Colors.textSecondary },
  earnSection: { marginBottom: Spacing.xl },
  earnCard: {
    backgroundColor: Colors.surfaceCard,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.sm,
  },
  earnRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingVertical: 8,
  },
  earnIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  earnInfo: { flex: 1 },
  earnTitle: { fontSize: FontSize.sm, fontWeight: "600", color: Colors.textPrimary },
  earnReward: { fontSize: FontSize.xs, color: Colors.success, marginTop: 2 },
  earnBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  earnBadgeText: { fontSize: FontSize.xs, fontWeight: "600" },
});
