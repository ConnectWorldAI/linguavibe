import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { FeatureGateBanner } from "@/components/feature-gate-banner";

type StudyGroup = {
  id: string;
  name: string;
  language: string;
  level: string;
  members: { name: string; avatar: string }[];
  maxMembers: number;
  nextSession: string;
  topic: string;
  isJoined: boolean;
  streak: number;
};

const GROUPS: StudyGroup[] = [
  { id: "1", name: "Spanish Beginners Club", language: "Spanish", level: "A1-A2", members: [{ name: "Alex", avatar: "👨🏻" }, { name: "Maria", avatar: "👩🏽" }, { name: "Yuki", avatar: "👩🏻" }], maxMembers: 5, nextSession: "Today, 7 PM", topic: "Restaurant Vocabulary", isJoined: true, streak: 12 },
  { id: "2", name: "French Conversation", language: "French", level: "B1-B2", members: [{ name: "Pierre", avatar: "👨🏻" }, { name: "Amara", avatar: "👩🏿" }], maxMembers: 5, nextSession: "Tomorrow, 6 PM", topic: "Travel Phrases", isJoined: true, streak: 8 },
  { id: "3", name: "Japanese Kanji Masters", language: "Japanese", level: "B2-C1", members: [{ name: "Kenji", avatar: "👨🏻" }, { name: "Sarah", avatar: "👩🏼" }, { name: "Li", avatar: "👨🏻" }, { name: "Emma", avatar: "👩🏻" }], maxMembers: 5, nextSession: "Wed, 8 PM", topic: "JLPT N2 Prep", isJoined: false, streak: 24 },
  { id: "4", name: "Korean Drama Club", language: "Korean", level: "A2-B1", members: [{ name: "Min", avatar: "👩🏻" }, { name: "Jake", avatar: "👨🏼" }], maxMembers: 5, nextSession: "Thu, 5 PM", topic: "K-Drama Vocabulary", isJoined: false, streak: 5 },
  { id: "5", name: "Portuguese Samba", language: "Portuguese", level: "A1-B1", members: [{ name: "Carlos", avatar: "👨🏽" }], maxMembers: 5, nextSession: "Fri, 7 PM", topic: "Music & Culture", isJoined: false, streak: 3 },
];

export default function StudyGroupsScreen() {
  const colors = useColors();
  const [tab, setTab] = useState<"my_groups" | "discover">("my_groups");
  const [searchQuery, setSearchQuery] = useState("");

  const myGroups = GROUPS.filter((g) => g.isJoined);
  const discoverGroups = GROUPS.filter((g) => !g.isJoined);

  return (
    <ScreenContainer edges={["top", "left", "right"]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Study Groups</Text>
        <TouchableOpacity style={[styles.createBtn, { backgroundColor: colors.primary }]}>
          <Ionicons name="add" size={18} color="#FFF" />
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={[styles.tabRow, { borderBottomColor: colors.border }]}>
        {(["my_groups", "discover"] as const).map((t) => (
          <TouchableOpacity
            key={t}
            style={[styles.tab, { borderBottomColor: tab === t ? colors.primary : "transparent" }]}
            onPress={() => setTab(t)}
          >
            <Text style={[styles.tabText, { color: tab === t ? colors.primary : colors.muted }]}>
              {t === "my_groups" ? "My Groups" : "Discover"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <FeatureGateBanner feature="study_group_create" />

        {/* Search */}
        <View style={[styles.searchBar, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Ionicons name="search" size={16} color={colors.muted} />
          <TextInput
            style={[styles.searchInput, { color: colors.foreground }]}
            placeholder="Search groups..."
            placeholderTextColor={colors.muted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {tab === "my_groups" ? (
          <>
            {myGroups.map((group) => (
              <TouchableOpacity
                key={group.id}
                style={[styles.groupCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
                activeOpacity={0.7}
              >
                <View style={styles.groupTop}>
                  <View>
                    <Text style={[styles.groupName, { color: colors.foreground }]}>{group.name}</Text>
                    <Text style={[styles.groupMeta, { color: colors.muted }]}>{group.language} • {group.level}</Text>
                  </View>
                  <View style={[styles.streakBadge, { backgroundColor: "#F59E0B15" }]}>
                    <Ionicons name="flame" size={12} color="#F59E0B" />
                    <Text style={[styles.streakText, { color: "#F59E0B" }]}>{group.streak}</Text>
                  </View>
                </View>

                {/* Members */}
                <View style={styles.membersRow}>
                  {group.members.map((m, i) => (
                    <View key={i} style={[styles.memberAvatar, { backgroundColor: colors.background, marginLeft: i > 0 ? -8 : 0 }]}>
                      <Text style={{ fontSize: 16 }}>{m.avatar}</Text>
                    </View>
                  ))}
                  <Text style={[styles.memberCount, { color: colors.muted }]}>{group.members.length}/{group.maxMembers}</Text>
                </View>

                {/* Next Session */}
                <View style={[styles.sessionRow, { backgroundColor: colors.primary + "10", borderColor: colors.primary + "30" }]}>
                  <Ionicons name="calendar" size={14} color={colors.primary} />
                  <Text style={[styles.sessionText, { color: colors.primary }]}>{group.nextSession}</Text>
                  <Text style={[styles.sessionTopic, { color: colors.muted }]}>• {group.topic}</Text>
                </View>

                {/* Actions */}
                <View style={styles.actionRow}>
                  <TouchableOpacity style={[styles.actionBtn, { backgroundColor: colors.primary }]}>
                    <Ionicons name="chatbubbles" size={14} color="#FFF" />
                    <Text style={styles.actionBtnText}>Chat</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.actionBtn, { backgroundColor: colors.success }]}>
                    <Ionicons name="videocam" size={14} color="#FFF" />
                    <Text style={styles.actionBtnText}>Join Session</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            ))}
          </>
        ) : (
          <>
            {discoverGroups.map((group) => (
              <TouchableOpacity
                key={group.id}
                style={[styles.groupCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
                activeOpacity={0.7}
              >
                <View style={styles.groupTop}>
                  <View>
                    <Text style={[styles.groupName, { color: colors.foreground }]}>{group.name}</Text>
                    <Text style={[styles.groupMeta, { color: colors.muted }]}>{group.language} • {group.level}</Text>
                  </View>
                  <View style={styles.spotsLeft}>
                    <Text style={[styles.spotsText, { color: colors.success }]}>{group.maxMembers - group.members.length} spots left</Text>
                  </View>
                </View>

                <View style={styles.membersRow}>
                  {group.members.map((m, i) => (
                    <View key={i} style={[styles.memberAvatar, { backgroundColor: colors.background, marginLeft: i > 0 ? -8 : 0 }]}>
                      <Text style={{ fontSize: 16 }}>{m.avatar}</Text>
                    </View>
                  ))}
                  <Text style={[styles.memberCount, { color: colors.muted }]}>{group.members.length}/{group.maxMembers}</Text>
                </View>

                <View style={[styles.sessionRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <Ionicons name="book" size={14} color={colors.muted} />
                  <Text style={[styles.sessionText, { color: colors.muted }]}>Next: {group.topic}</Text>
                </View>

                <TouchableOpacity
                  style={[styles.joinBtn, { backgroundColor: colors.primary }]}
                  onPress={() => {
                    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  }}
                >
                  <Ionicons name="people" size={14} color="#FFF" />
                  <Text style={styles.joinBtnText}>Join Group</Text>
                </TouchableOpacity>
              </TouchableOpacity>
            ))}
          </>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 0.5 },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 17, fontWeight: "700" },
  createBtn: { width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  tabRow: { flexDirection: "row", borderBottomWidth: 0.5 },
  tab: { flex: 1, alignItems: "center", paddingVertical: 12, borderBottomWidth: 2 },
  tabText: { fontSize: 14, fontWeight: "700" },
  content: { padding: 16, paddingBottom: 100 },
  searchBar: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 12, height: 40, borderRadius: 10, borderWidth: 1, marginBottom: 16 },
  searchInput: { flex: 1, fontSize: 14 },
  groupCard: { padding: 14, borderRadius: 14, borderWidth: 1, marginBottom: 12 },
  groupTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 },
  groupName: { fontSize: 15, fontWeight: "700" },
  groupMeta: { fontSize: 12, marginTop: 2 },
  streakBadge: { flexDirection: "row", alignItems: "center", gap: 3, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  streakText: { fontSize: 11, fontWeight: "800" },
  spotsLeft: {},
  spotsText: { fontSize: 11, fontWeight: "700" },
  membersRow: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  memberAvatar: { width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: "rgba(0,0,0,0.1)" },
  memberCount: { fontSize: 11, marginLeft: 8 },
  sessionRow: { flexDirection: "row", alignItems: "center", gap: 6, padding: 10, borderRadius: 8, borderWidth: 1, marginBottom: 10 },
  sessionText: { fontSize: 12, fontWeight: "600" },
  sessionTopic: { fontSize: 11 },
  actionRow: { flexDirection: "row", gap: 8 },
  actionBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 10, borderRadius: 8 },
  actionBtnText: { fontSize: 12, fontWeight: "700", color: "#FFF" },
  joinBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 10, borderRadius: 8 },
  joinBtnText: { fontSize: 13, fontWeight: "700", color: "#FFF" },
});
