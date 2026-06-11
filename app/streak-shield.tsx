/**
 * Streak Shield Screen
 * 
 * Manage streak shields — view available shields, earn new ones,
 * and see shield usage history.
 */
import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import { Colors } from "@/constants/Colors";
import {
  getShieldState,
  earnShield,
  getEarnConditions,
  getShieldDisplayInfo,
  type StreakShieldState,
} from "@/lib/streak-shield";
import { calculateGoalStreak } from "@/lib/goal-streak";
import { purchaseFreezeWithXP, getNextXPFreezeCost, getStreakFreezeData, MAX_XP_FREEZE_CAPACITY } from "@/lib/streak-freeze";
import { getOverallXP } from "@/lib/exercise-scoring";

export default function StreakShieldScreen() {
  const [shieldState, setShieldState] = useState<StreakShieldState | null>(null);
  const [loading, setLoading] = useState(true);
  const [earning, setEarning] = useState(false);
  const [earnMessage, setEarnMessage] = useState<string | null>(null);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [xpAvailable, setXpAvailable] = useState(0);
  const [freezeCount, setFreezeCount] = useState(0);
  const [xpPurchasing, setXpPurchasing] = useState(false);
  const [xpMessage, setXpMessage] = useState<string | null>(null);

  useEffect(() => {
    loadData();
    loadXPData();
  }, []);

  const loadXPData = async () => {
    try {
      const xp = await getOverallXP();
      setXpAvailable(xp);
      const freezeData = await getStreakFreezeData();
      setFreezeCount(freezeData.availableFreezes);
    } catch {}
  };

  const handleXPPurchase = async () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    setXpPurchasing(true);
    setXpMessage(null);
    try {
      const result = await purchaseFreezeWithXP(xpAvailable);
      if (result.success) {
        setXpMessage(`Freeze purchased for ${result.xpSpent} XP! ❄️`);
        await loadXPData();
      } else {
        setXpMessage(result.error || "Purchase failed");
      }
    } catch {
      setXpMessage("Purchase failed");
    }
    setXpPurchasing(false);
  };

  const loadData = async () => {
    try {
      const [state, streak] = await Promise.all([
        getShieldState(),
        calculateGoalStreak(),
      ]);
      setShieldState(state);
      setCurrentStreak(streak.currentStreak);
    } catch {} finally {
      setLoading(false);
    }
  };

  const handleEarnShield = async () => {
    setEarning(true);
    setEarnMessage(null);
    try {
      const result = await earnShield();
      if (result.earned) {
        if (Platform.OS !== "web") {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
        setEarnMessage("Shield earned! 🎉");
        await loadData();
      } else {
        setEarnMessage(result.reason || "Cannot earn shield right now.");
      }
    } catch {
      setEarnMessage("Something went wrong.");
    } finally {
      setEarning(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.secondary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!shieldState) return null;

  const displayInfo = getShieldDisplayInfo(shieldState);
  const earnConditions = getEarnConditions();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Streak Shield</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Shield Status Card */}
        <View style={styles.statusCard}>
          <View style={styles.shieldIconContainer}>
            {Array.from({ length: shieldState.maxShields }).map((_, i) => (
              <View
                key={i}
                style={[
                  styles.shieldSlot,
                  i < shieldState.shieldsAvailable && styles.shieldSlotActive,
                ]}
              >
                <Text style={{ fontSize: 28 }}>
                  {i < shieldState.shieldsAvailable ? "🛡️" : "🔲"}
                </Text>
              </View>
            ))}
          </View>
          <Text style={[styles.statusText, { color: displayInfo.statusColor }]}>
            {displayInfo.statusText}
          </Text>
          <Text style={styles.statusDesc}>
            Shields automatically protect your streak when you miss a week.
          </Text>
          {currentStreak > 0 && (
            <View style={styles.streakInfo}>
              <Text style={styles.streakInfoText}>
                🔥 Current streak: {currentStreak} week{currentStreak > 1 ? "s" : ""}
              </Text>
            </View>
          )}
        </View>

        {/* How It Works */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>How It Works</Text>
          <View style={styles.howItWorksCard}>
            <View style={styles.stepRow}>
              <View style={styles.stepNum}><Text style={styles.stepNumText}>1</Text></View>
              <Text style={styles.stepText}>
                If you miss your weekly goals, a shield activates automatically
              </Text>
            </View>
            <View style={styles.stepRow}>
              <View style={styles.stepNum}><Text style={styles.stepNumText}>2</Text></View>
              <Text style={styles.stepText}>
                Your streak stays intact — the missed week doesn't count against you
              </Text>
            </View>
            <View style={styles.stepRow}>
              <View style={styles.stepNum}><Text style={styles.stepNumText}>3</Text></View>
              <Text style={styles.stepText}>
                Earn new shields by completing challenges (max {shieldState.maxShields})
              </Text>
            </View>
          </View>
        </View>

        {/* Earn Shields */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Earn Shields</Text>
          <Text style={styles.sectionSubtitle}>
            Complete challenges to earn streak protection
          </Text>
          {earnConditions.map((condition) => (
            <View key={condition.id} style={styles.earnCard}>
              <Text style={{ fontSize: 28 }}>{condition.emoji}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.earnTitle}>{condition.title}</Text>
                <Text style={styles.earnDesc}>{condition.description}</Text>
              </View>
              <TouchableOpacity
                style={[
                  styles.earnBtn,
                  !displayInfo.canEarn && styles.earnBtnDisabled,
                ]}
                onPress={handleEarnShield}
                disabled={earning || !displayInfo.canEarn}
              >
                {earning ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.earnBtnText}>
                    {displayInfo.canEarn ? "Claim" : "Full"}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          ))}
          {earnMessage && (
            <View style={styles.earnMessageContainer}>
              <Text style={[
                styles.earnMessageText,
                earnMessage.includes("🎉") ? { color: Colors.success } : { color: Colors.textSecondary }
              ]}>
                {earnMessage}
              </Text>
            </View>
          )}
        </View>

        {/* Buy with XP */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Buy with XP</Text>
          <Text style={styles.sectionSubtitle}>
            Spend earned XP to get streak freezes ({freezeCount}/{MAX_XP_FREEZE_CAPACITY})
          </Text>
          <View style={styles.xpPurchaseCard}>
            <View style={styles.xpPurchaseInfo}>
              <Text style={{ fontSize: 28 }}>❄️</Text>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.earnTitle}>Streak Freeze</Text>
                <Text style={styles.earnDesc}>
                  Cost: {freezeCount >= MAX_XP_FREEZE_CAPACITY ? "MAX" : `${getNextXPFreezeCost(freezeCount)} XP`}
                </Text>
                <Text style={[styles.earnDesc, { marginTop: 2 }]}>
                  Your XP: {xpAvailable}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              style={[
                styles.earnBtn,
                (freezeCount >= MAX_XP_FREEZE_CAPACITY || xpAvailable < getNextXPFreezeCost(freezeCount)) && styles.earnBtnDisabled,
              ]}
              onPress={handleXPPurchase}
              disabled={xpPurchasing || freezeCount >= MAX_XP_FREEZE_CAPACITY || xpAvailable < getNextXPFreezeCost(freezeCount)}
            >
              {xpPurchasing ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.earnBtnText}>
                  {freezeCount >= MAX_XP_FREEZE_CAPACITY ? "Full" : "Buy"}
                </Text>
              )}
            </TouchableOpacity>
          </View>
          {xpMessage && (
            <View style={styles.earnMessageContainer}>
              <Text style={[
                styles.earnMessageText,
                xpMessage.includes("❄️") ? { color: Colors.success } : { color: Colors.textSecondary }
              ]}>
                {xpMessage}
              </Text>
            </View>
          )}
        </View>

        {/* Shield History */}
        {shieldState.shieldHistory.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Shield History</Text>
            {shieldState.shieldHistory.slice().reverse().map((usage, idx) => (
              <View key={idx} style={styles.historyRow}>
                <View style={styles.historyIcon}>
                  <Text style={{ fontSize: 16 }}>🛡️</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.historyTitle}>
                    Streak preserved at {usage.streakPreserved} weeks
                  </Text>
                  <Text style={styles.historyDate}>
                    {new Date(usage.date).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Stats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Stats</Text>
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{shieldState.shieldsAvailable}</Text>
              <Text style={styles.statLabel}>Available</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{shieldState.shieldsUsed}</Text>
              <Text style={styles.statLabel}>Used</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{shieldState.maxShields}</Text>
              <Text style={styles.statLabel}>Max</Text>
            </View>
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtn: { width: 40, height: 40, justifyContent: "center", alignItems: "center" },
  headerTitle: { fontSize: 18, fontWeight: "700", color: Colors.text },
  statusCard: {
    marginHorizontal: 16,
    backgroundColor: Colors.surfaceCard,
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  shieldIconContainer: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  shieldSlot: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.border + "40",
    justifyContent: "center",
    alignItems: "center",
  },
  shieldSlotActive: {
    backgroundColor: "#3B82F6" + "20",
    borderWidth: 2,
    borderColor: "#3B82F6" + "60",
  },
  statusText: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 6,
  },
  statusDesc: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: 18,
  },
  streakInfo: {
    marginTop: 12,
    paddingHorizontal: 14,
    paddingVertical: 6,
    backgroundColor: "#F97316" + "15",
    borderRadius: 12,
  },
  streakInfoText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#F97316",
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 12,
  },
  howItWorksCard: {
    backgroundColor: Colors.surfaceCard,
    borderRadius: 16,
    padding: 16,
    marginTop: 8,
    gap: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  stepRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  stepNum: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.secondary + "20",
    justifyContent: "center",
    alignItems: "center",
  },
  stepNumText: {
    fontSize: 12,
    fontWeight: "700",
    color: Colors.secondary,
  },
  stepText: {
    flex: 1,
    fontSize: 14,
    color: Colors.textPrimary,
    lineHeight: 20,
  },
  earnCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: Colors.surfaceCard,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  earnTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.text,
  },
  earnDesc: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  earnBtn: {
    backgroundColor: "#3B82F6",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  earnBtnDisabled: {
    backgroundColor: Colors.border,
  },
  earnBtnText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#fff",
  },
  earnMessageContainer: {
    marginTop: 8,
    alignItems: "center",
  },
  earnMessageText: {
    fontSize: 13,
    fontWeight: "500",
  },
  historyRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border + "50",
  },
  historyIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#3B82F6" + "15",
    justifyContent: "center",
    alignItems: "center",
  },
  historyTitle: {
    fontSize: 14,
    fontWeight: "500",
    color: Colors.text,
  },
  historyDate: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  statsRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
  },
  statBox: {
    flex: 1,
    backgroundColor: Colors.surfaceCard,
    borderRadius: 14,
    padding: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statValue: {
    fontSize: 24,
    fontWeight: "800",
    color: Colors.text,
  },
  statLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  xpPurchaseCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
  },
  xpPurchaseInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
});
