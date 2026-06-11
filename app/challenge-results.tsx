import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";

interface QuestionResult {
  question: string;
  youCorrect: boolean;
  friendCorrect: boolean;
}

export default function ChallengeResultsScreen() {
  const router = useRouter();
  const colors = useColors();
  const params = useLocalSearchParams<{
    friendName?: string;
    yourScore?: string;
    friendScore?: string;
    totalQuestions?: string;
    challengeId?: string;
  }>();

  const friendName = params.friendName || "Friend";
  const yourScore = parseInt(params.yourScore || "0", 10);
  const friendScore = parseInt(params.friendScore || "0", 10);
  const totalQuestions = parseInt(params.totalQuestions || "5", 10);

  const youWon = yourScore > friendScore;
  const tied = yourScore === friendScore;

  const questionResults: QuestionResult[] = Array.from(
    { length: totalQuestions },
    (_, i) => ({
      question: `Question ${i + 1}`,
      youCorrect: i < yourScore,
      friendCorrect: i < friendScore,
    })
  );

  const handleRematch = () => {
    router.replace({
      pathname: "/grammar-challenge",
      params: { friendName, mode: "rematch" },
    } as any);
  };

  const handleBackToLeaderboard = () => {
    router.back();
  };

  return (
    <ScreenContainer>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBackToLeaderboard} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={colors.foreground} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.foreground }]}>
            Challenge Results
          </Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Winner Banner */}
        <View
          style={[
            styles.winnerBanner,
            {
              backgroundColor: tied
                ? colors.warning + "20"
                : youWon
                ? colors.success + "20"
                : colors.error + "20",
            },
          ]}
        >
          <Text style={styles.winnerEmoji}>
            {tied ? "\u{1F91D}" : youWon ? "\u{1F3C6}" : "\u{1F624}"}
          </Text>
          <Text
            style={[
              styles.winnerText,
              {
                color: tied
                  ? colors.warning
                  : youWon
                  ? colors.success
                  : colors.error,
              },
            ]}
          >
            {tied ? "It's a Tie!" : youWon ? "You Won!" : `${friendName} Won!`}
          </Text>
        </View>

        {/* Score Comparison */}
        <View style={[styles.scoreCard, { backgroundColor: colors.surface }]}>
          <View style={styles.scoreRow}>
            <View style={styles.playerScore}>
              <Text style={[styles.playerLabel, { color: colors.muted }]}>You</Text>
              <Text style={[styles.scoreValue, { color: colors.primary }]}>
                {yourScore}/{totalQuestions}
              </Text>
              <Text style={[styles.percentText, { color: colors.muted }]}>
                {Math.round((yourScore / totalQuestions) * 100)}%
              </Text>
            </View>
            <View style={styles.vsContainer}>
              <Text style={[styles.vsText, { color: colors.muted }]}>VS</Text>
            </View>
            <View style={styles.playerScore}>
              <Text style={[styles.playerLabel, { color: colors.muted }]}>
                {friendName}
              </Text>
              <Text style={[styles.scoreValue, { color: colors.error }]}>
                {friendScore}/{totalQuestions}
              </Text>
              <Text style={[styles.percentText, { color: colors.muted }]}>
                {Math.round((friendScore / totalQuestions) * 100)}%
              </Text>
            </View>
          </View>
        </View>

        {/* Question Breakdown */}
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
          Question Breakdown
        </Text>
        {questionResults.map((q, idx) => (
          <View
            key={idx}
            style={[styles.questionRow, { backgroundColor: colors.surface }]}
          >
            <Text style={[styles.questionNum, { color: colors.muted }]}>
              Q{idx + 1}
            </Text>
            <View style={styles.answerIcons}>
              <Ionicons
                name={q.youCorrect ? "checkmark-circle" : "close-circle"}
                size={20}
                color={q.youCorrect ? colors.success : colors.error}
              />
              <Text style={[styles.answerLabel, { color: colors.muted }]}>You</Text>
            </View>
            <View style={styles.answerIcons}>
              <Ionicons
                name={q.friendCorrect ? "checkmark-circle" : "close-circle"}
                size={20}
                color={q.friendCorrect ? colors.success : colors.error}
              />
              <Text style={[styles.answerLabel, { color: colors.muted }]}>
                {friendName.slice(0, 6)}
              </Text>
            </View>
          </View>
        ))}

        {/* Rivalry Stats */}
        <View style={[styles.rivalryCard, { backgroundColor: colors.surface }]}>
          <Text style={[styles.rivalryTitle, { color: colors.foreground }]}>
            Rivalry Stats
          </Text>
          <View style={styles.rivalryRow}>
            <Text style={[styles.rivalryStat, { color: colors.muted }]}>
              Total Matches
            </Text>
            <Text style={[styles.rivalryValue, { color: colors.foreground }]}>1</Text>
          </View>
          <View style={styles.rivalryRow}>
            <Text style={[styles.rivalryStat, { color: colors.muted }]}>
              Your Wins
            </Text>
            <Text style={[styles.rivalryValue, { color: colors.success }]}>
              {youWon ? 1 : 0}
            </Text>
          </View>
          <View style={styles.rivalryRow}>
            <Text style={[styles.rivalryStat, { color: colors.muted }]}>
              Their Wins
            </Text>
            <Text style={[styles.rivalryValue, { color: colors.error }]}>
              {!youWon && !tied ? 1 : 0}
            </Text>
          </View>
        </View>

        {/* Actions */}
        <TouchableOpacity
          style={[styles.rematchBtn, { backgroundColor: colors.primary }]}
          onPress={handleRematch}
        >
          <Ionicons name="refresh" size={20} color="#fff" />
          <Text style={styles.rematchText}>Rematch</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.backToLeaderboardBtn, { borderColor: colors.border }]}
          onPress={handleBackToLeaderboard}
        >
          <Text style={[styles.backToLeaderboardText, { color: colors.foreground }]}>
            Back to Leaderboard
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20, paddingBottom: 40 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  backBtn: { padding: 8 },
  title: { fontSize: 20, fontWeight: "700" },
  winnerBanner: {
    alignItems: "center",
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
  },
  winnerEmoji: { fontSize: 48, marginBottom: 8 },
  winnerText: { fontSize: 24, fontWeight: "800" },
  scoreCard: { borderRadius: 16, padding: 20, marginBottom: 24 },
  scoreRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
  },
  playerScore: { alignItems: "center" },
  playerLabel: { fontSize: 14, fontWeight: "600", marginBottom: 4 },
  scoreValue: { fontSize: 28, fontWeight: "800" },
  percentText: { fontSize: 12, marginTop: 2 },
  vsContainer: { paddingHorizontal: 16 },
  vsText: { fontSize: 16, fontWeight: "700" },
  sectionTitle: { fontSize: 18, fontWeight: "700", marginBottom: 12 },
  questionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 12,
    borderRadius: 10,
    marginBottom: 8,
  },
  questionNum: { fontSize: 14, fontWeight: "600", width: 30 },
  answerIcons: { alignItems: "center" },
  answerLabel: { fontSize: 10, marginTop: 2 },
  rivalryCard: { borderRadius: 16, padding: 16, marginTop: 20, marginBottom: 20 },
  rivalryTitle: { fontSize: 16, fontWeight: "700", marginBottom: 12 },
  rivalryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
  },
  rivalryStat: { fontSize: 14 },
  rivalryValue: { fontSize: 14, fontWeight: "700" },
  rematchBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    borderRadius: 12,
    gap: 8,
    marginBottom: 12,
  },
  rematchText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  backToLeaderboardBtn: {
    alignItems: "center",
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  backToLeaderboardText: { fontSize: 15, fontWeight: "600" },
});
