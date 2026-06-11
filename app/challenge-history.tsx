import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";

const HISTORY_KEY = "@challenge_history";

interface ChallengeRecord {
  id: string;
  friendName: string;
  yourScore: number;
  friendScore: number;
  totalQuestions: number;
  date: string;
  won: boolean;
  tied: boolean;
}

interface RivalryStats {
  friendName: string;
  wins: number;
  losses: number;
  ties: number;
  totalMatches: number;
  winRate: number;
}

export default function ChallengeHistoryScreen() {
  const router = useRouter();
  const colors = useColors();
  const [history, setHistory] = useState<ChallengeRecord[]>([]);
  const [rivalries, setRivalries] = useState<RivalryStats[]>([]);
  const [tab, setTab] = useState<"history" | "rivalries">("history");

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const raw = await AsyncStorage.getItem(HISTORY_KEY);
      const records: ChallengeRecord[] = raw ? JSON.parse(raw) : generateSampleHistory();
      setHistory(records);
      const rivalryMap: Record<string, RivalryStats> = {};
      records.forEach((r) => {
        if (!rivalryMap[r.friendName]) {
          rivalryMap[r.friendName] = { friendName: r.friendName, wins: 0, losses: 0, ties: 0, totalMatches: 0, winRate: 0 };
        }
        const stats = rivalryMap[r.friendName];
        stats.totalMatches++;
        if (r.tied) stats.ties++;
        else if (r.won) stats.wins++;
        else stats.losses++;
        stats.winRate = Math.round((stats.wins / stats.totalMatches) * 100);
      });
      setRivalries(Object.values(rivalryMap).sort((a, b) => b.totalMatches - a.totalMatches));
    } catch {
      setHistory(generateSampleHistory());
    }
  };

  const generateSampleHistory = (): ChallengeRecord[] => {
    const names = ["Maria", "Carlos", "Yuki", "Ahmed", "Sofia"];
    return Array.from({ length: 12 }, (_, i) => {
      const yourScore = Math.floor(Math.random() * 5) + 1;
      const friendScore = Math.floor(Math.random() * 5) + 1;
      const date = new Date();
      date.setDate(date.getDate() - i * 2);
      return { id: `ch_${i}`, friendName: names[i % names.length], yourScore, friendScore, totalQuestions: 5, date: date.toISOString(), won: yourScore > friendScore, tied: yourScore === friendScore };
    });
  };

  const totalWins = history.filter((h) => h.won).length;
  const totalLosses = history.filter((h) => !h.won && !h.tied).length;
  const totalTies = history.filter((h) => h.tied).length;
  const overallWinRate = history.length ? Math.round((totalWins / history.length) * 100) : 0;

  const renderHistoryItem = ({ item }: { item: ChallengeRecord }) => (
    <TouchableOpacity
      style={[styles.historyCard, { backgroundColor: colors.surface }]}
      onPress={() => router.push({ pathname: "/challenge-results", params: { friendName: item.friendName, yourScore: String(item.yourScore), friendScore: String(item.friendScore), totalQuestions: String(item.totalQuestions), challengeId: item.id } } as any)}
    >
      <View style={styles.historyLeft}>
        <View style={[styles.resultBadge, { backgroundColor: item.tied ? colors.warning + "20" : item.won ? colors.success + "20" : colors.error + "20" }]}>
          <Text style={[styles.resultBadgeText, { color: item.tied ? colors.warning : item.won ? colors.success : colors.error }]}>
            {item.tied ? "TIE" : item.won ? "WIN" : "LOSS"}
          </Text>
        </View>
        <View>
          <Text style={[styles.historyName, { color: colors.foreground }]}>vs {item.friendName}</Text>
          <Text style={[styles.historyDate, { color: colors.muted }]}>{new Date(item.date).toLocaleDateString()}</Text>
        </View>
      </View>
      <Text style={[styles.historyScore, { color: colors.foreground }]}>{item.yourScore}-{item.friendScore}</Text>
    </TouchableOpacity>
  );

  const renderRivalryItem = ({ item }: { item: RivalryStats }) => (
    <View style={[styles.rivalryCard, { backgroundColor: colors.surface }]}>
      <View style={styles.rivalryHeader}>
        <Text style={[styles.rivalryName, { color: colors.foreground }]}>{item.friendName}</Text>
        <Text style={[styles.rivalryMatches, { color: colors.muted }]}>{item.totalMatches} matches</Text>
      </View>
      <View style={styles.rivalryStatsRow}>
        <View style={styles.rivalryStat}><Text style={[styles.statValue, { color: colors.success }]}>{item.wins}</Text><Text style={[styles.statLabel, { color: colors.muted }]}>Wins</Text></View>
        <View style={styles.rivalryStat}><Text style={[styles.statValue, { color: colors.error }]}>{item.losses}</Text><Text style={[styles.statLabel, { color: colors.muted }]}>Losses</Text></View>
        <View style={styles.rivalryStat}><Text style={[styles.statValue, { color: colors.warning }]}>{item.ties}</Text><Text style={[styles.statLabel, { color: colors.muted }]}>Ties</Text></View>
        <View style={styles.rivalryStat}><Text style={[styles.statValue, { color: colors.primary }]}>{item.winRate}%</Text><Text style={[styles.statLabel, { color: colors.muted }]}>Win Rate</Text></View>
      </View>
      <View style={[styles.winRateBar, { backgroundColor: colors.border }]}>
        <View style={[styles.winRateFill, { backgroundColor: colors.success, width: `${(item.wins / item.totalMatches) * 100}%` }]} />
        <View style={[styles.winRateFill, { backgroundColor: colors.warning, width: `${(item.ties / item.totalMatches) * 100}%` }]} />
      </View>
    </View>
  );

  return (
    <ScreenContainer>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={colors.foreground} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.foreground }]}>Challenge History</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={[styles.overallStats, { backgroundColor: colors.surface }]}>
          <View style={styles.overallRow}>
            <View style={styles.overallStat}><Text style={[styles.overallValue, { color: colors.success }]}>{totalWins}</Text><Text style={[styles.overallLabel, { color: colors.muted }]}>Wins</Text></View>
            <View style={styles.overallStat}><Text style={[styles.overallValue, { color: colors.error }]}>{totalLosses}</Text><Text style={[styles.overallLabel, { color: colors.muted }]}>Losses</Text></View>
            <View style={styles.overallStat}><Text style={[styles.overallValue, { color: colors.warning }]}>{totalTies}</Text><Text style={[styles.overallLabel, { color: colors.muted }]}>Ties</Text></View>
            <View style={styles.overallStat}><Text style={[styles.overallValue, { color: colors.primary }]}>{overallWinRate}%</Text><Text style={[styles.overallLabel, { color: colors.muted }]}>Win Rate</Text></View>
          </View>
        </View>

        <View style={styles.tabs}>
          <TouchableOpacity style={[styles.tab, tab === "history" && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]} onPress={() => setTab("history")}>
            <Text style={[styles.tabText, { color: tab === "history" ? colors.primary : colors.muted }]}>Match History</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.tab, tab === "rivalries" && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]} onPress={() => setTab("rivalries")}>
            <Text style={[styles.tabText, { color: tab === "rivalries" ? colors.primary : colors.muted }]}>Rivalries</Text>
          </TouchableOpacity>
        </View>

        {tab === "history" ? (
          <FlatList data={history} keyExtractor={(item) => item.id} renderItem={renderHistoryItem} contentContainerStyle={styles.listContent} ListEmptyComponent={<Text style={[styles.emptyText, { color: colors.muted }]}>No challenge history yet.</Text>} />
        ) : (
          <FlatList data={rivalries} keyExtractor={(item) => item.friendName} renderItem={renderRivalryItem} contentContainerStyle={styles.listContent} ListEmptyComponent={<Text style={[styles.emptyText, { color: colors.muted }]}>No rivalries yet.</Text>} />
        )}
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 12 },
  backBtn: { padding: 8 },
  title: { fontSize: 20, fontWeight: "700" },
  overallStats: { marginHorizontal: 16, borderRadius: 16, padding: 16, marginBottom: 16 },
  overallRow: { flexDirection: "row", justifyContent: "space-around" },
  overallStat: { alignItems: "center" },
  overallValue: { fontSize: 22, fontWeight: "800" },
  overallLabel: { fontSize: 12, marginTop: 2 },
  tabs: { flexDirection: "row", paddingHorizontal: 16, marginBottom: 8 },
  tab: { flex: 1, alignItems: "center", paddingVertical: 10 },
  tabText: { fontSize: 15, fontWeight: "600" },
  listContent: { paddingHorizontal: 16, paddingBottom: 40 },
  historyCard: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 14, borderRadius: 12, marginBottom: 10 },
  historyLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  resultBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  resultBadgeText: { fontSize: 11, fontWeight: "800" },
  historyName: { fontSize: 15, fontWeight: "600" },
  historyDate: { fontSize: 12, marginTop: 2 },
  historyScore: { fontSize: 16, fontWeight: "700" },
  rivalryCard: { padding: 16, borderRadius: 14, marginBottom: 12 },
  rivalryHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  rivalryName: { fontSize: 17, fontWeight: "700" },
  rivalryMatches: { fontSize: 13 },
  rivalryStatsRow: { flexDirection: "row", justifyContent: "space-around", marginBottom: 12 },
  rivalryStat: { alignItems: "center" },
  statValue: { fontSize: 18, fontWeight: "700" },
  statLabel: { fontSize: 11, marginTop: 2 },
  winRateBar: { height: 6, borderRadius: 3, flexDirection: "row", overflow: "hidden" },
  winRateFill: { height: 6 },
  emptyText: { textAlign: "center", marginTop: 40, fontSize: 14 },
});
