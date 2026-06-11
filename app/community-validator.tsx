import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";

type ValidationItem = {
  id: string;
  phrase: string;
  translation: string;
  language: string;
  flag: string;
  submittedBy: { name: string; avatar: string; level: string };
  context: string;
  upvotes: number;
  downvotes: number;
  myVote: "up" | "down" | null;
  status: "pending" | "approved" | "disputed";
};

const VALIDATIONS: ValidationItem[] = [
  { id: "1", phrase: "No mames", translation: "No way! / You're kidding!", language: "Spanish (Mexico)", flag: "🇲🇽", submittedBy: { name: "Carlos M.", avatar: "👨🏽", level: "Native" }, context: "Informal expression of disbelief. Vulgar origin but widely used casually.", upvotes: 42, downvotes: 3, myVote: null, status: "approved" },
  { id: "2", phrase: "C'est ouf", translation: "That's crazy / wild", language: "French (Verlan)", flag: "🇫🇷", submittedBy: { name: "Léa D.", avatar: "👩🏻", level: "Native" }, context: "Verlan (reversed slang) of 'fou' (crazy). Common in youth speak.", upvotes: 28, downvotes: 5, myVote: null, status: "pending" },
  { id: "3", phrase: "やばい (yabai)", translation: "Amazing / terrible (context-dependent)", language: "Japanese", flag: "🇯🇵", submittedBy: { name: "Kenji T.", avatar: "👨🏻", level: "Native" }, context: "Originally negative (dangerous), now used positively by youth for 'awesome'.", upvotes: 56, downvotes: 2, myVote: "up", status: "approved" },
  { id: "4", phrase: "Digga", translation: "Dude / bro", language: "German", flag: "🇩🇪", submittedBy: { name: "Max W.", avatar: "👨🏼", level: "Native" }, context: "Very common in northern Germany, especially Hamburg. Informal greeting.", upvotes: 19, downvotes: 8, myVote: null, status: "disputed" },
  { id: "5", phrase: "대박 (daebak)", translation: "Jackpot! / Amazing!", language: "Korean", flag: "🇰🇷", submittedBy: { name: "Jimin P.", avatar: "👩🏻", level: "Native" }, context: "Expression of amazement. Popularized globally through K-dramas.", upvotes: 67, downvotes: 1, myVote: "up", status: "approved" },
];

export default function CommunityValidatorScreen() {
  const colors = useColors();
  const [items, setItems] = useState(VALIDATIONS);
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "disputed">("all");

  const filtered = items.filter((i) => filter === "all" || i.status === filter);

  const vote = (id: string, direction: "up" | "down") => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setItems((prev) =>
      prev.map((i) => {
        if (i.id !== id) return i;
        const wasUp = i.myVote === "up";
        const wasDown = i.myVote === "down";
        if (direction === "up") {
          return { ...i, myVote: wasUp ? null : "up", upvotes: wasUp ? i.upvotes - 1 : i.upvotes + 1, downvotes: wasDown ? i.downvotes - 1 : i.downvotes };
        } else {
          return { ...i, myVote: wasDown ? null : "down", downvotes: wasDown ? i.downvotes - 1 : i.downvotes + 1, upvotes: wasUp ? i.upvotes - 1 : i.upvotes };
        }
      })
    );
  };

  const statusColors: Record<string, string> = { pending: "#F59E0B", approved: "#22C55E", disputed: "#EF4444" };

  return (
    <ScreenContainer edges={["top", "left", "right"]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Community Validator</Text>
        <TouchableOpacity style={[styles.submitBtn, { backgroundColor: colors.primary }]}>
          <Ionicons name="add" size={16} color="#FFF" />
        </TouchableOpacity>
      </View>

      {/* Stats */}
      <View style={[styles.statsRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: colors.primary }]}>127</Text>
          <Text style={[styles.statLabel, { color: colors.muted }]}>Validated</Text>
        </View>
        <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: "#F59E0B" }]}>23</Text>
          <Text style={[styles.statLabel, { color: colors.muted }]}>Pending</Text>
        </View>
        <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: "#A855F7" }]}>Expert</Text>
          <Text style={[styles.statLabel, { color: colors.muted }]}>Your Rank</Text>
        </View>
      </View>

      {/* Filters */}
      <View style={styles.filterRow}>
        {(["all", "pending", "approved", "disputed"] as const).map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterBtn, { backgroundColor: filter === f ? colors.primary + "15" : colors.surface, borderColor: filter === f ? colors.primary : colors.border }]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.filterText, { color: filter === f ? colors.primary : colors.muted }]}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {filtered.map((item) => (
          <View key={item.id} style={[styles.validCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            {/* Status Badge */}
            <View style={[styles.statusBadge, { backgroundColor: statusColors[item.status] + "15" }]}>
              <View style={[styles.statusDot, { backgroundColor: statusColors[item.status] }]} />
              <Text style={[styles.statusText, { color: statusColors[item.status] }]}>{item.status}</Text>
            </View>

            {/* Phrase */}
            <Text style={[styles.phraseText, { color: colors.foreground }]}>{item.flag} {item.phrase}</Text>
            <Text style={[styles.translationText, { color: colors.primary }]}>→ {item.translation}</Text>

            {/* Context */}
            <View style={[styles.contextBox, { backgroundColor: colors.background, borderColor: colors.border }]}>
              <Ionicons name="information-circle-outline" size={14} color={colors.muted} />
              <Text style={[styles.contextText, { color: colors.muted }]}>{item.context}</Text>
            </View>

            {/* Submitted By */}
            <View style={styles.submitterRow}>
              <Text style={{ fontSize: 16 }}>{item.submittedBy.avatar}</Text>
              <Text style={[styles.submitterName, { color: colors.foreground }]}>{item.submittedBy.name}</Text>
              <View style={[styles.levelBadge, { backgroundColor: colors.primary + "10" }]}>
                <Text style={[styles.levelText, { color: colors.primary }]}>{item.submittedBy.level}</Text>
              </View>
            </View>

            {/* Voting */}
            <View style={styles.voteRow}>
              <TouchableOpacity
                style={[styles.voteBtn, { backgroundColor: item.myVote === "up" ? "#22C55E15" : colors.background, borderColor: item.myVote === "up" ? "#22C55E" : colors.border }]}
                onPress={() => vote(item.id, "up")}
              >
                <Ionicons name="thumbs-up" size={16} color={item.myVote === "up" ? "#22C55E" : colors.muted} />
                <Text style={[styles.voteCount, { color: item.myVote === "up" ? "#22C55E" : colors.muted }]}>{item.upvotes}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.voteBtn, { backgroundColor: item.myVote === "down" ? "#EF444415" : colors.background, borderColor: item.myVote === "down" ? "#EF4444" : colors.border }]}
                onPress={() => vote(item.id, "down")}
              >
                <Ionicons name="thumbs-down" size={16} color={item.myVote === "down" ? "#EF4444" : colors.muted} />
                <Text style={[styles.voteCount, { color: item.myVote === "down" ? "#EF4444" : colors.muted }]}>{item.downvotes}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.reportBtn, { borderColor: colors.border }]}>
                <Ionicons name="flag-outline" size={14} color={colors.muted} />
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 0.5 },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 17, fontWeight: "700" },
  submitBtn: { width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  statsRow: { flexDirection: "row", justifyContent: "space-around", marginHorizontal: 16, marginTop: 12, padding: 12, borderRadius: 10, borderWidth: 1 },
  statItem: { alignItems: "center" },
  statValue: { fontSize: 16, fontWeight: "800" },
  statLabel: { fontSize: 10, marginTop: 2 },
  statDivider: { width: 1, height: 24 },
  filterRow: { flexDirection: "row", paddingHorizontal: 16, paddingVertical: 10, gap: 6 },
  filterBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, borderWidth: 1 },
  filterText: { fontSize: 11, fontWeight: "700" },
  content: { padding: 16, paddingBottom: 100 },
  validCard: { padding: 14, borderRadius: 14, borderWidth: 1, marginBottom: 12 },
  statusBadge: { flexDirection: "row", alignItems: "center", gap: 5, alignSelf: "flex-start", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, marginBottom: 8 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 10, fontWeight: "700", textTransform: "uppercase" },
  phraseText: { fontSize: 17, fontWeight: "800", marginBottom: 4 },
  translationText: { fontSize: 14, fontWeight: "600", marginBottom: 8 },
  contextBox: { flexDirection: "row", alignItems: "flex-start", gap: 6, padding: 10, borderRadius: 8, borderWidth: 0.5, marginBottom: 10 },
  contextText: { fontSize: 12, lineHeight: 16, flex: 1 },
  submitterRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 10 },
  submitterName: { fontSize: 12, fontWeight: "600" },
  levelBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  levelText: { fontSize: 9, fontWeight: "700" },
  voteRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  voteBtn: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 8, borderWidth: 1 },
  voteCount: { fontSize: 12, fontWeight: "700" },
  reportBtn: { marginLeft: "auto", padding: 6, borderRadius: 6, borderWidth: 1 },
});
