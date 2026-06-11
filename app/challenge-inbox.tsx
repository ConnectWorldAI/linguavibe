import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import * as Haptics from "expo-haptics";
import { Colors, Spacing, BorderRadius, FontSize } from "@/constants/Colors";
import {
  getPendingChallenges,
  acceptChallenge,
  declineChallenge,
  simulateIncomingChallenge,
  type PendingChallenge,
} from "@/lib/challenge-notifications";

const CATEGORY_LABELS: Record<string, string> = {
  verb_conjugation: "Verb Conjugation",
  articles: "Articles",
  prepositions: "Prepositions",
  subjunctive: "Subjunctive",
  ser_estar: "Ser vs Estar",
  por_para: "Por vs Para",
  pronouns: "Pronouns",
  adjective_agreement: "Adjective Agreement",
  general: "General Grammar",
};

const DIFFICULTY_COLORS: Record<string, string> = {
  easy: Colors.success,
  medium: Colors.gold,
  hard: Colors.error,
};

export default function ChallengeInboxScreen() {
  const [challenges, setChallenges] = useState<PendingChallenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const loadChallenges = useCallback(async () => {
    setLoading(true);
    const pending = await getPendingChallenges();
    setChallenges(pending);
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadChallenges();
    }, [loadChallenges])
  );

  const handleAccept = async (challengeId: string) => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setActionLoading(challengeId);
    await acceptChallenge(challengeId);
    // acceptChallenge navigates to grammar-challenge
  };

  const handleDecline = async (challengeId: string) => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActionLoading(challengeId);
    await declineChallenge(challengeId);
    setChallenges(prev => prev.filter(c => c.id !== challengeId));
    setActionLoading(null);
  };

  const handleSimulate = async () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await simulateIncomingChallenge();
    await loadChallenges();
  };

  const formatTimeAgo = (timestamp: number) => {
    const diff = Date.now() - timestamp;
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  const renderChallenge = ({ item }: { item: PendingChallenge }) => (
    <View style={styles.challengeCard}>
      <View style={styles.challengeHeader}>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarText}>{item.fromUser.charAt(0).toUpperCase()}</Text>
        </View>
        <View style={styles.challengeInfo}>
          <Text style={styles.fromUser}>{item.fromUser}</Text>
          <Text style={styles.timeAgo}>{formatTimeAgo(item.receivedAt)}</Text>
        </View>
        <View style={[styles.difficultyBadge, { backgroundColor: DIFFICULTY_COLORS[item.difficulty] + "20" }]}>
          <Text style={[styles.difficultyText, { color: DIFFICULTY_COLORS[item.difficulty] }]}>
            {item.difficulty.charAt(0).toUpperCase() + item.difficulty.slice(1)}
          </Text>
        </View>
      </View>

      <View style={styles.challengeBody}>
        <Text style={styles.categoryLabel}>
          {CATEGORY_LABELS[item.category] || item.category}
        </Text>
        <Text style={styles.questionCount}>
          {item.questionCount} questions
        </Text>
      </View>

      <View style={styles.actionRow}>
        {actionLoading === item.id ? (
          <ActivityIndicator color={Colors.accent} />
        ) : (
          <>
            <TouchableOpacity
              style={styles.declineBtn}
              onPress={() => handleDecline(item.id)}
            >
              <Ionicons name="close" size={18} color={Colors.error} />
              <Text style={styles.declineBtnText}>Decline</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.acceptBtn}
              onPress={() => handleAccept(item.id)}
            >
              <Ionicons name="checkmark" size={18} color="#fff" />
              <Text style={styles.acceptBtnText}>Accept</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Challenge Inbox</Text>
        <View style={styles.headerRight}>
          {challenges.length > 0 && (
            <View style={styles.countBadge}>
              <Text style={styles.countBadgeText}>{challenges.length}</Text>
            </View>
          )}
        </View>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.accent} />
        </View>
      ) : challenges.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="trophy-outline" size={64} color={Colors.textSecondary} />
          <Text style={styles.emptyTitle}>No Pending Challenges</Text>
          <Text style={styles.emptySubtitle}>
            When friends challenge you to a grammar quiz, they'll appear here.
          </Text>
          <TouchableOpacity style={styles.simulateBtn} onPress={handleSimulate}>
            <Ionicons name="flash" size={18} color={Colors.gold} />
            <Text style={styles.simulateBtnText}>Simulate Incoming Challenge</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={challenges}
          keyExtractor={(item) => item.id}
          renderItem={renderChallenge}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListFooterComponent={
            <TouchableOpacity style={styles.simulateBtnSmall} onPress={handleSimulate}>
              <Ionicons name="flash" size={14} color={Colors.gold} />
              <Text style={styles.simulateBtnSmallText}>Simulate New Challenge</Text>
            </TouchableOpacity>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.primary },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backBtn: { padding: 8 },
  title: { flex: 1, fontSize: FontSize.xl, fontWeight: "700", color: Colors.text, marginLeft: 12 },
  headerRight: { width: 40, alignItems: "flex-end" },
  countBadge: {
    backgroundColor: Colors.error,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 6,
  },
  countBadgeText: { color: "#fff", fontSize: 11, fontWeight: "700" },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  emptyState: { flex: 1, justifyContent: "center", alignItems: "center", padding: Spacing.xl },
  emptyTitle: { fontSize: FontSize.lg, fontWeight: "700", color: Colors.text, marginTop: 16 },
  emptySubtitle: { fontSize: FontSize.sm, color: Colors.textSecondary, textAlign: "center", marginTop: 8, lineHeight: 20 },
  simulateBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 24,
    backgroundColor: Colors.gold + "15",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.gold + "30",
  },
  simulateBtnText: { color: Colors.gold, fontWeight: "600", fontSize: FontSize.sm },
  simulateBtnSmall: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: 16,
    marginBottom: 32,
    padding: 10,
  },
  simulateBtnSmallText: { color: Colors.gold, fontWeight: "500", fontSize: 12 },
  listContent: { padding: Spacing.md },
  challengeCard: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  challengeHeader: { flexDirection: "row", alignItems: "center" },
  avatarCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.accent + "20",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: { fontSize: 16, fontWeight: "700", color: Colors.accent },
  challengeInfo: { flex: 1, marginLeft: 12 },
  fromUser: { fontSize: FontSize.md, fontWeight: "600", color: Colors.text },
  timeAgo: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  difficultyBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  difficultyText: { fontSize: 11, fontWeight: "700", textTransform: "uppercase" },
  challengeBody: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  categoryLabel: { fontSize: FontSize.md, fontWeight: "500", color: Colors.text },
  questionCount: { fontSize: FontSize.sm, color: Colors.textSecondary },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 12,
    marginTop: 14,
  },
  declineBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.error + "40",
  },
  declineBtnText: { color: Colors.error, fontWeight: "600", fontSize: 14 },
  acceptBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.success,
  },
  acceptBtnText: { color: "#fff", fontWeight: "600", fontSize: 14 },
});
