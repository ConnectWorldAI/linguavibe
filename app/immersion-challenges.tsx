import { useState, useEffect, useCallback } from "react";
import { Text, View, TouchableOpacity, FlatList, StyleSheet, Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";

interface Challenge {
  id: string;
  title: string;
  description: string;
  type: "daily" | "weekly";
  category: "immersion" | "pronunciation" | "conversation" | "cultural";
  icon: string;
  xpReward: number;
  target: number;
  progress: number;
  completed: boolean;
  expiresAt: number;
}

interface UserXP {
  total: number;
  level: number;
  currentLevelXP: number;
  nextLevelXP: number;
  streak: number;
  completedToday: number;
}

const DAILY_CHALLENGES: Omit<Challenge, "id" | "progress" | "completed" | "expiresAt">[] = [
  { title: "Notification Responder", description: "Respond to 5 immersion notifications", type: "daily", category: "immersion", icon: "notifications", xpReward: 50, target: 5 },
  { title: "Pronunciation Pro", description: "Complete 3 drills with 70%+ accuracy", type: "daily", category: "pronunciation", icon: "mic", xpReward: 75, target: 3 },
  { title: "Conversation Starter", description: "Send 10 messages to any AI partner", type: "daily", category: "conversation", icon: "chatbubbles", xpReward: 60, target: 10 },
  { title: "Cultural Explorer", description: "Read 2 cultural intelligence entries", type: "daily", category: "cultural", icon: "earth", xpReward: 40, target: 2 },
  { title: "Streak Keeper", description: "Complete at least 1 lesson today", type: "daily", category: "immersion", icon: "flame", xpReward: 30, target: 1 },
  { title: "Voice Warrior", description: "Spend 5 minutes in a voice room", type: "daily", category: "conversation", icon: "volume-high", xpReward: 80, target: 5 },
];

const WEEKLY_CHALLENGES: Omit<Challenge, "id" | "progress" | "completed" | "expiresAt">[] = [
  { title: "Marathon Learner", description: "Complete 30 immersion lessons this week", type: "weekly", category: "immersion", icon: "trophy", xpReward: 300, target: 30 },
  { title: "Accent Master", description: "Practice 5 different accent profiles", type: "weekly", category: "pronunciation", icon: "globe", xpReward: 250, target: 5 },
  { title: "Social Butterfly", description: "Chat with all AI partners at least once", type: "weekly", category: "conversation", icon: "people", xpReward: 400, target: 8 },
  { title: "Culture Vulture", description: "Explore entries from 3 different regions", type: "weekly", category: "cultural", icon: "map", xpReward: 200, target: 3 },
  { title: "Perfect Week", description: "Maintain a 7-day streak", type: "weekly", category: "immersion", icon: "star", xpReward: 500, target: 7 },
];

const STORAGE_KEY = "@linguavibe_challenges";
const XP_STORAGE_KEY = "@linguavibe_xp";

function getLevel(totalXP: number) {
  const baseXP = 100;
  let level = 1;
  let xpForLevel = baseXP;
  let accumulatedXP = 0;
  while (accumulatedXP + xpForLevel <= totalXP) {
    accumulatedXP += xpForLevel;
    level++;
    xpForLevel = Math.floor(baseXP * Math.pow(1.5, level - 1));
  }
  return { level, currentLevelXP: totalXP - accumulatedXP, nextLevelXP: xpForLevel };
}

function generateDailyChallenges(): Challenge[] {
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  return [...DAILY_CHALLENGES]
    .sort(() => Math.random() - 0.5)
    .slice(0, 4)
    .map((c, i) => ({ ...c, id: `daily_${Date.now()}_${i}`, progress: 0, completed: false, expiresAt: today.getTime() }));
}

function generateWeeklyChallenges(): Challenge[] {
  const end = new Date();
  end.setDate(end.getDate() + (7 - end.getDay()));
  end.setHours(23, 59, 59, 999);
  return [...WEEKLY_CHALLENGES]
    .sort(() => Math.random() - 0.5)
    .slice(0, 3)
    .map((c, i) => ({ ...c, id: `weekly_${Date.now()}_${i}`, progress: 0, completed: false, expiresAt: end.getTime() }));
}

export default function ImmersionChallengesScreen() {
  const colors = useColors();
  const router = useRouter();
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [userXP, setUserXP] = useState<UserXP>({ total: 0, level: 1, currentLevelXP: 0, nextLevelXP: 100, streak: 0, completedToday: 0 });
  const [selectedTab, setSelectedTab] = useState<"daily" | "weekly">("daily");

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [storedChallenges, storedXP] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEY),
        AsyncStorage.getItem(XP_STORAGE_KEY),
      ]);
      if (storedXP) {
        const xp = JSON.parse(storedXP);
        setUserXP({ ...xp, ...getLevel(xp.total || 0) });
      }
      if (storedChallenges) {
        const parsed: Challenge[] = JSON.parse(storedChallenges);
        const now = Date.now();
        const valid = parsed.filter((c) => c.expiresAt > now);
        let updated = valid;
        if (!valid.some((c) => c.type === "daily")) updated = [...updated, ...generateDailyChallenges()];
        if (!valid.some((c) => c.type === "weekly")) updated = [...updated, ...generateWeeklyChallenges()];
        setChallenges(updated);
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } else {
        const initial = [...generateDailyChallenges(), ...generateWeeklyChallenges()];
        setChallenges(initial);
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
      }
    } catch {}
  };

  const simulateProgress = useCallback(async (challengeId: string) => {
    setChallenges((prev) => {
      const updated = prev.map((c) => {
        if (c.id !== challengeId || c.completed) return c;
        const newProgress = Math.min(c.progress + 1, c.target);
        const completed = newProgress >= c.target;
        if (completed) {
          setUserXP((xp) => {
            const newTotal = xp.total + c.xpReward;
            const u = { ...xp, total: newTotal, ...getLevel(newTotal), completedToday: xp.completedToday + 1 };
            AsyncStorage.setItem(XP_STORAGE_KEY, JSON.stringify(u)).catch(() => {});
            return u;
          });
          if (Platform.OS !== "web") {
            import("expo-haptics").then((H) => H.notificationAsync(H.NotificationFeedbackType.Success)).catch(() => {});
          }
        }
        return { ...c, progress: newProgress, completed };
      });
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated)).catch(() => {});
      return updated;
    });
  }, []);

  const getCategoryColor = (cat: Challenge["category"]) => {
    switch (cat) {
      case "immersion": return colors.primary;
      case "pronunciation": return colors.success;
      case "conversation": return "#8B5CF6";
      case "cultural": return colors.warning;
    }
  };

  const filteredChallenges = challenges.filter((c) => c.type === selectedTab);

  return (
    <ScreenContainer edges={["top", "left", "right"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.foreground }]}>Immersion Challenges</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={[styles.xpCard, { backgroundColor: colors.primary + "10", borderColor: colors.primary + "30" }]}>
        <View style={styles.xpRow}>
          <View>
            <Text style={[styles.lvlText, { color: colors.primary }]}>Level {userXP.level}</Text>
            <Text style={[styles.xpTotal, { color: colors.foreground }]}>{userXP.total.toLocaleString()} XP</Text>
          </View>
          <View style={styles.streakRow}>
            <Ionicons name="flame" size={20} color="#FF6B35" />
            <Text style={[styles.streakTxt, { color: colors.foreground }]}>{userXP.streak} day streak</Text>
          </View>
        </View>
        <View style={[styles.lvlBar, { backgroundColor: colors.border }]}>
          <View style={[styles.lvlFill, { width: `${(userXP.currentLevelXP / userXP.nextLevelXP) * 100}%`, backgroundColor: colors.primary }]} />
        </View>
        <Text style={[styles.lvlProg, { color: colors.muted }]}>{userXP.currentLevelXP}/{userXP.nextLevelXP} XP to Level {userXP.level + 1}</Text>
      </View>

      <View style={[styles.tabs, { borderBottomColor: colors.border }]}>
        {(["daily", "weekly"] as const).map((tab) => (
          <TouchableOpacity key={tab} style={[styles.tab, selectedTab === tab && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]} onPress={() => setSelectedTab(tab)} activeOpacity={0.7}>
            <Text style={[styles.tabTxt, { color: selectedTab === tab ? colors.primary : colors.muted }]}>{tab === "daily" ? "Daily" : "Weekly"}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filteredChallenges}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => {
          const pct = Math.min((item.progress / item.target) * 100, 100);
          const catColor = getCategoryColor(item.category);
          return (
            <TouchableOpacity
              style={[styles.card, { backgroundColor: colors.surface, borderColor: item.completed ? colors.success + "40" : colors.border }]}
              onPress={() => !item.completed && simulateProgress(item.id)}
              activeOpacity={item.completed ? 1 : 0.7}
            >
              <View style={styles.cardHead}>
                <View style={[styles.iconWrap, { backgroundColor: catColor + "15" }]}>
                  <Ionicons name={item.icon as any} size={20} color={catColor} />
                </View>
                <View style={styles.cardInfo}>
                  <Text style={[styles.cardTitle, { color: colors.foreground }]}>{item.title}</Text>
                  <Text style={[styles.cardDesc, { color: colors.muted }]}>{item.description}</Text>
                </View>
                <View style={[styles.xpBadge, { backgroundColor: item.completed ? colors.success + "15" : colors.primary + "15" }]}>
                  <Text style={[styles.xpBadgeTxt, { color: item.completed ? colors.success : colors.primary }]}>{item.completed ? "Done" : `+${item.xpReward}`}</Text>
                </View>
              </View>
              <View style={styles.progRow}>
                <View style={[styles.progBar, { backgroundColor: colors.border }]}>
                  <View style={[styles.progFill, { width: `${pct}%`, backgroundColor: item.completed ? colors.success : catColor }]} />
                </View>
                <Text style={[styles.progTxt, { color: colors.muted }]}>{item.progress}/{item.target}</Text>
              </View>
            </TouchableOpacity>
          );
        }}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 12 },
  backBtn: { width: 40, height: 40, justifyContent: "center", alignItems: "center" },
  title: { fontSize: 18, fontWeight: "700" },
  xpCard: { marginHorizontal: 16, marginBottom: 16, padding: 16, borderRadius: 16, borderWidth: 1 },
  xpRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  lvlText: { fontSize: 13, fontWeight: "600" },
  xpTotal: { fontSize: 22, fontWeight: "800" },
  streakRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  streakTxt: { fontSize: 13, fontWeight: "600" },
  lvlBar: { height: 6, borderRadius: 3, overflow: "hidden" },
  lvlFill: { height: "100%", borderRadius: 3 },
  lvlProg: { fontSize: 11, marginTop: 6 },
  tabs: { flexDirection: "row", paddingHorizontal: 16, borderBottomWidth: 0.5 },
  tab: { paddingVertical: 12, paddingHorizontal: 16 },
  tabTxt: { fontSize: 14, fontWeight: "600" },
  list: { padding: 16, gap: 12 },
  card: { borderRadius: 14, padding: 14, borderWidth: 1, gap: 10 },
  cardHead: { flexDirection: "row", alignItems: "center", gap: 12 },
  iconWrap: { width: 40, height: 40, borderRadius: 12, justifyContent: "center", alignItems: "center" },
  cardInfo: { flex: 1 },
  cardTitle: { fontSize: 14, fontWeight: "700" },
  cardDesc: { fontSize: 11, marginTop: 2, lineHeight: 15 },
  xpBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  xpBadgeTxt: { fontSize: 12, fontWeight: "700" },
  progRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  progBar: { flex: 1, height: 5, borderRadius: 3, overflow: "hidden" },
  progFill: { height: "100%", borderRadius: 3 },
  progTxt: { fontSize: 11, fontWeight: "600", width: 35, textAlign: "right" },
});
