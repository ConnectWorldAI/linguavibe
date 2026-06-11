import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ScrollView,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ScreenContainer } from "@/components/screen-container";
import { Colors, Spacing, BorderRadius, FontSize } from "@/constants/Colors";
import { SUPPORTED_DUEL_LANGUAGES, type DuelLanguage } from "@/lib/word-banks";

// ─── Types ──────────────────────────────────────────────────────────────────

interface LanguageRanking {
  id: string;
  name: string;
  avatar: string;
  totalScore: number;
  wins: number;
  duelsPlayed: number;
  winRate: number;
  bestStreak: number;
  rank: number;
  change: number; // +/- rank change from last period
}

interface LeaderboardData {
  language: DuelLanguage;
  rankings: LanguageRanking[];
  userRank: LanguageRanking | null;
  lastUpdated: string;
}

// ─── Storage Key ────────────────────────────────────────────────────────────

const STORAGE_KEY = "@duel_leaderboard_language";

// ─── Sample Data Generator ──────────────────────────────────────────────────

const SAMPLE_NAMES: Record<DuelLanguage, string[]> = {
  Spanish: ["Carlos M.", "María G.", "Diego R.", "Sofía L.", "Andrés P.", "Valentina C.", "Javier H.", "Camila S."],
  French: ["Pierre D.", "Marie C.", "Jean-Luc B.", "Amélie R.", "François T.", "Claire M.", "Nicolas V.", "Sophie L."],
  Portuguese: ["Lucas S.", "Ana B.", "Pedro M.", "Juliana C.", "Rafael O.", "Beatriz A.", "Thiago F.", "Larissa R."],
  Japanese: ["Yuki T.", "Haruto S.", "Sakura M.", "Ren K.", "Aoi N.", "Sota Y.", "Hina W.", "Kaito I."],
  German: ["Hans M.", "Lena K.", "Felix B.", "Anna S.", "Maximilian W.", "Sophie R.", "Lukas H.", "Emma F."],
  Korean: ["Min-jun K.", "Seo-yeon P.", "Ji-ho L.", "Ha-yoon C.", "Ye-jun S.", "Su-bin J.", "Do-yun H.", "Yuna K."],
  Mandarin: ["Wei L.", "Xiao M.", "Jun Z.", "Mei C.", "Hao W.", "Ling Y.", "Tao H.", "Yan S."],
};

function generateLeaderboardData(language: DuelLanguage): LanguageRanking[] {
  const names = SAMPLE_NAMES[language];
  return names.map((name, i) => ({
    id: `player_${language}_${i}`,
    name,
    avatar: ["🎯", "🔥", "⚡", "🌟", "💎", "🏆", "🎪", "🎭"][i],
    totalScore: Math.floor(Math.random() * 5000) + 2000 - i * 400,
    wins: Math.floor(Math.random() * 30) + 10 - i * 2,
    duelsPlayed: Math.floor(Math.random() * 50) + 20,
    winRate: Math.floor(Math.random() * 30) + 50,
    bestStreak: Math.floor(Math.random() * 10) + 3,
    rank: i + 1,
    change: Math.floor(Math.random() * 5) - 2,
  })).sort((a, b) => b.totalScore - a.totalScore).map((p, i) => ({ ...p, rank: i + 1 }));
}

// ─── Main Screen ────────────────────────────────────────────────────────────

export default function DuelLeaderboardLanguageScreen() {
  const router = useRouter();
  const [selectedLanguage, setSelectedLanguage] = useState<DuelLanguage>("Spanish");
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardData | null>(null);
  const [loading, setLoading] = useState(true);

  const loadLeaderboard = useCallback(async (language: DuelLanguage) => {
    setLoading(true);
    try {
      const stored = await AsyncStorage.getItem(`${STORAGE_KEY}_${language}`);
      if (stored) {
        setLeaderboardData(JSON.parse(stored));
      } else {
        const rankings = generateLeaderboardData(language);
        const data: LeaderboardData = {
          language,
          rankings,
          userRank: {
            id: "current_user",
            name: "You",
            avatar: "🎤",
            totalScore: Math.floor(Math.random() * 3000) + 1000,
            wins: Math.floor(Math.random() * 15) + 5,
            duelsPlayed: Math.floor(Math.random() * 30) + 10,
            winRate: Math.floor(Math.random() * 30) + 40,
            bestStreak: Math.floor(Math.random() * 7) + 2,
            rank: Math.floor(Math.random() * 5) + 4,
            change: Math.floor(Math.random() * 3) - 1,
          },
          lastUpdated: new Date().toISOString(),
        };
        await AsyncStorage.setItem(`${STORAGE_KEY}_${language}`, JSON.stringify(data));
        setLeaderboardData(data);
      }
    } catch {
      const rankings = generateLeaderboardData(language);
      setLeaderboardData({
        language,
        rankings,
        userRank: null,
        lastUpdated: new Date().toISOString(),
      });
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadLeaderboard(selectedLanguage);
  }, [selectedLanguage]);

  const handleLanguageChange = (lang: DuelLanguage) => {
    setSelectedLanguage(lang);
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const getRankColor = (rank: number) => {
    if (rank === 1) return Colors.gold;
    if (rank === 2) return Colors.secondary;
    if (rank === 3) return Colors.accent;
    return Colors.textMuted;
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return "🥇";
    if (rank === 2) return "🥈";
    if (rank === 3) return "🥉";
    return `#${rank}`;
  };

  const getChangeIcon = (change: number) => {
    if (change > 0) return { icon: "arrow-up" as const, color: Colors.success };
    if (change < 0) return { icon: "arrow-down" as const, color: Colors.accent };
    return { icon: "remove" as const, color: Colors.textMuted };
  };

  const renderPodium = () => {
    if (!leaderboardData || leaderboardData.rankings.length < 3) return null;
    const top3 = leaderboardData.rankings.slice(0, 3);
    const podiumOrder = [top3[1], top3[0], top3[2]]; // 2nd, 1st, 3rd

    return (
      <View style={styles.podiumContainer}>
        {podiumOrder.map((player, idx) => {
          const isFirst = idx === 1;
          const podiumHeight = isFirst ? 100 : idx === 0 ? 75 : 60;
          return (
            <View key={player.id} style={styles.podiumItem}>
              <Text style={styles.podiumAvatar}>{player.avatar}</Text>
              <Text style={[styles.podiumName, isFirst && { fontWeight: "800" }]} numberOfLines={1}>
                {player.name}
              </Text>
              <Text style={styles.podiumScore}>{player.totalScore.toLocaleString()}</Text>
              <View style={[
                styles.podiumBar,
                { height: podiumHeight, backgroundColor: getRankColor(player.rank) + "30" },
              ]}>
                <Text style={[styles.podiumRank, { color: getRankColor(player.rank) }]}>
                  {getRankIcon(player.rank)}
                </Text>
              </View>
            </View>
          );
        })}
      </View>
    );
  };

  const renderRankRow = ({ item }: { item: LanguageRanking }) => {
    const changeInfo = getChangeIcon(item.change);
    const isUser = item.id === "current_user";

    return (
      <View style={[styles.rankRow, isUser && styles.rankRowUser]}>
        <View style={styles.rankBadge}>
          <Text style={[styles.rankText, { color: getRankColor(item.rank) }]}>
            {getRankIcon(item.rank)}
          </Text>
        </View>
        <Text style={styles.rankAvatar}>{item.avatar}</Text>
        <View style={styles.rankInfo}>
          <Text style={[styles.rankName, isUser && { color: Colors.primary }]}>
            {item.name}
          </Text>
          <Text style={styles.rankStats}>
            {item.wins}W • {item.winRate}% WR • 🔥{item.bestStreak}
          </Text>
        </View>
        <View style={styles.rankScoreCol}>
          <Text style={styles.rankScore}>{item.totalScore.toLocaleString()}</Text>
          <View style={styles.rankChange}>
            <Ionicons name={changeInfo.icon} size={12} color={changeInfo.color} />
            <Text style={[styles.rankChangeText, { color: changeInfo.color }]}>
              {Math.abs(item.change)}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <ScreenContainer>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Duel Rankings</Text>
        <TouchableOpacity
          onPress={() => router.push("/pronunciation-duel-lobby" as any)}
          style={styles.playBtn}
        >
          <Ionicons name="game-controller" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Language Tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.languageTabs}>
        {SUPPORTED_DUEL_LANGUAGES.map((lang) => {
          const isActive = selectedLanguage === lang.id;
          return (
            <TouchableOpacity
              key={lang.id}
              style={[styles.languageTab, isActive && styles.languageTabActive]}
              onPress={() => handleLanguageChange(lang.id)}
              activeOpacity={0.7}
            >
              <Text style={styles.languageTabFlag}>{lang.flag}</Text>
              <Text style={[styles.languageTabText, isActive && styles.languageTabTextActive]}>
                {lang.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* User Rank Banner */}
      {leaderboardData?.userRank && (
        <View style={styles.userBanner}>
          <View style={styles.userBannerLeft}>
            <Text style={styles.userBannerRank}>#{leaderboardData.userRank.rank}</Text>
            <View>
              <Text style={styles.userBannerName}>Your Rank</Text>
              <Text style={styles.userBannerScore}>
                {leaderboardData.userRank.totalScore.toLocaleString()} pts
              </Text>
            </View>
          </View>
          <View style={styles.userBannerStats}>
            <View style={styles.userBannerStat}>
              <Text style={styles.userBannerStatValue}>{leaderboardData.userRank.wins}</Text>
              <Text style={styles.userBannerStatLabel}>Wins</Text>
            </View>
            <View style={styles.userBannerStat}>
              <Text style={styles.userBannerStatValue}>{leaderboardData.userRank.winRate}%</Text>
              <Text style={styles.userBannerStatLabel}>Rate</Text>
            </View>
            <View style={styles.userBannerStat}>
              <Text style={styles.userBannerStatValue}>🔥{leaderboardData.userRank.bestStreak}</Text>
              <Text style={styles.userBannerStatLabel}>Streak</Text>
            </View>
          </View>
        </View>
      )}

      {/* Podium */}
      {renderPodium()}

      {/* Full Rankings */}
      <FlatList
        data={leaderboardData?.rankings.slice(3) || []}
        keyExtractor={(item) => item.id}
        renderItem={renderRankRow}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <Text style={styles.listHeader}>All Rankings</Text>
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="trophy-outline" size={40} color={Colors.textMuted} />
            <Text style={styles.emptyText}>No rankings yet for {selectedLanguage}</Text>
            <Text style={styles.emptySubtext}>Play duels to earn your spot!</Text>
          </View>
        }
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
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
  playBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  languageTabs: { paddingLeft: 16, marginBottom: 16 },
  languageTab: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: Colors.surfaceCard,
    borderWidth: 1,
    borderColor: Colors.border,
    marginRight: 8,
  },
  languageTabActive: {
    backgroundColor: Colors.primary + "15",
    borderColor: Colors.primary,
  },
  languageTabFlag: { fontSize: 16 },
  languageTabText: { fontSize: FontSize.sm, fontWeight: "600", color: Colors.textMuted },
  languageTabTextActive: { color: Colors.primary },
  userBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.primary + "10",
    borderWidth: 1,
    borderColor: Colors.primary + "30",
  },
  userBannerLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  userBannerRank: { fontSize: 24, fontWeight: "900", color: Colors.primary },
  userBannerName: { fontSize: FontSize.sm, fontWeight: "700", color: Colors.textPrimary },
  userBannerScore: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 2 },
  userBannerStats: { flexDirection: "row", gap: 12 },
  userBannerStat: { alignItems: "center" },
  userBannerStatValue: { fontSize: FontSize.sm, fontWeight: "700", color: Colors.textPrimary },
  userBannerStatLabel: { fontSize: 10, color: Colors.textMuted },
  podiumContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "center",
    paddingHorizontal: 16,
    marginBottom: 20,
    gap: 12,
  },
  podiumItem: { alignItems: "center", flex: 1 },
  podiumAvatar: { fontSize: 28, marginBottom: 4 },
  podiumName: { fontSize: FontSize.xs, fontWeight: "600", color: Colors.textPrimary, marginBottom: 2 },
  podiumScore: { fontSize: FontSize.xs, color: Colors.textMuted, marginBottom: 6 },
  podiumBar: {
    width: "100%",
    borderRadius: BorderRadius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  podiumRank: { fontSize: 20, fontWeight: "800" },
  listContent: { paddingHorizontal: 16, paddingBottom: 40 },
  listHeader: {
    fontSize: FontSize.md,
    fontWeight: "700",
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  rankRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surfaceCard,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 8,
  },
  rankRowUser: {
    backgroundColor: Colors.primary + "08",
    borderColor: Colors.primary + "30",
  },
  rankBadge: { width: 36, alignItems: "center" },
  rankText: { fontSize: FontSize.sm, fontWeight: "800" },
  rankAvatar: { fontSize: 22, marginHorizontal: 8 },
  rankInfo: { flex: 1 },
  rankName: { fontSize: FontSize.sm, fontWeight: "700", color: Colors.textPrimary },
  rankStats: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 2 },
  rankScoreCol: { alignItems: "flex-end" },
  rankScore: { fontSize: FontSize.sm, fontWeight: "700", color: Colors.textPrimary },
  rankChange: { flexDirection: "row", alignItems: "center", gap: 2, marginTop: 2 },
  rankChangeText: { fontSize: 10, fontWeight: "600" },
  emptyState: { alignItems: "center", paddingTop: 40, gap: 8 },
  emptyText: { fontSize: FontSize.md, fontWeight: "600", color: Colors.textPrimary },
  emptySubtext: { fontSize: FontSize.sm, color: Colors.textMuted },
});
