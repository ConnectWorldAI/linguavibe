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

type FamilyMember = {
  id: string;
  name: string;
  avatar: string;
  role: "owner" | "member";
  language: string;
  streak: number;
  lessonsThisWeek: number;
};

const FAMILY_MEMBERS: FamilyMember[] = [
  { id: "1", name: "You", avatar: "🧑", role: "owner", language: "Spanish", streak: 45, lessonsThisWeek: 12 },
  { id: "2", name: "Sarah (Partner)", avatar: "👩🏼", role: "member", language: "French", streak: 22, lessonsThisWeek: 8 },
  { id: "3", name: "Jake (Son)", avatar: "👦🏼", role: "member", language: "Japanese", streak: 15, lessonsThisWeek: 5 },
];

export default function FamilyPlanScreen() {
  const colors = useColors();
  const [inviteEmail, setInviteEmail] = useState("");
  const [showInvite, setShowInvite] = useState(false);

  const spotsUsed = FAMILY_MEMBERS.length;
  const maxSpots = 5;

  return (
    <ScreenContainer edges={["top", "left", "right"]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Family Plan</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Plan Card */}
        <View style={[styles.planCard, { backgroundColor: colors.primary + "10", borderColor: colors.primary + "30" }]}>
          <View style={styles.planHeader}>
            <View>
              <Text style={[styles.planTitle, { color: colors.foreground }]}>Family Pro</Text>
              <Text style={[styles.planDesc, { color: colors.muted }]}>Up to 5 family members</Text>
            </View>
            <View style={styles.priceWrap}>
              <Text style={[styles.priceValue, { color: colors.primary }]}>$39.99</Text>
              <Text style={[styles.pricePeriod, { color: colors.muted }]}>/month</Text>
            </View>
          </View>
          <View style={styles.savingsRow}>
            <Ionicons name="pricetag" size={14} color={colors.success} />
            <Text style={[styles.savingsText, { color: colors.success }]}>Save 60% vs individual plans</Text>
          </View>
        </View>

        {/* Members */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Family Members</Text>
          <Text style={[styles.sectionCount, { color: colors.muted }]}>{spotsUsed}/{maxSpots} spots</Text>
        </View>

        {FAMILY_MEMBERS.map((member) => (
          <View key={member.id} style={[styles.memberCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.memberTop}>
              <View style={styles.memberLeft}>
                <Text style={styles.memberAvatar}>{member.avatar}</Text>
                <View>
                  <View style={styles.memberNameRow}>
                    <Text style={[styles.memberName, { color: colors.foreground }]}>{member.name}</Text>
                    {member.role === "owner" && (
                      <View style={[styles.ownerBadge, { backgroundColor: "#FFD70020" }]}>
                        <Text style={[styles.ownerText, { color: "#FFD700" }]}>Owner</Text>
                      </View>
                    )}
                  </View>
                  <Text style={[styles.memberLang, { color: colors.muted }]}>Learning {member.language}</Text>
                </View>
              </View>
              {member.role !== "owner" && (
                <TouchableOpacity>
                  <Ionicons name="ellipsis-horizontal" size={18} color={colors.muted} />
                </TouchableOpacity>
              )}
            </View>
            <View style={styles.memberStats}>
              <View style={[styles.memberStat, { backgroundColor: colors.background }]}>
                <Ionicons name="flame" size={14} color="#F59E0B" />
                <Text style={[styles.memberStatValue, { color: colors.foreground }]}>{member.streak} day streak</Text>
              </View>
              <View style={[styles.memberStat, { backgroundColor: colors.background }]}>
                <Ionicons name="book" size={14} color={colors.primary} />
                <Text style={[styles.memberStatValue, { color: colors.foreground }]}>{member.lessonsThisWeek} this week</Text>
              </View>
            </View>
          </View>
        ))}

        {/* Invite Section */}
        {spotsUsed < maxSpots && (
          <>
            {!showInvite ? (
              <TouchableOpacity
                style={[styles.inviteBtn, { borderColor: colors.primary }]}
                onPress={() => {
                  if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setShowInvite(true);
                }}
              >
                <Ionicons name="person-add" size={18} color={colors.primary} />
                <Text style={[styles.inviteBtnText, { color: colors.primary }]}>Invite Family Member</Text>
              </TouchableOpacity>
            ) : (
              <View style={[styles.inviteCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Text style={[styles.inviteTitle, { color: colors.foreground }]}>Invite via Email</Text>
                <TextInput
                  style={[styles.inviteInput, { backgroundColor: colors.background, borderColor: colors.border, color: colors.foreground }]}
                  placeholder="family@email.com"
                  placeholderTextColor={colors.muted}
                  value={inviteEmail}
                  onChangeText={setInviteEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
                <View style={styles.inviteActions}>
                  <TouchableOpacity style={[styles.cancelBtn, { borderColor: colors.border }]} onPress={() => setShowInvite(false)}>
                    <Text style={[styles.cancelBtnText, { color: colors.muted }]}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.sendInviteBtn, { backgroundColor: colors.primary }]}>
                    <Text style={styles.sendInviteBtnText}>Send Invite</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </>
        )}

        {/* Features */}
        <View style={styles.featuresSection}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Included for Everyone</Text>
          {[
            { icon: "infinite", text: "Unlimited lessons & practice" },
            { icon: "people", text: "Group study sessions" },
            { icon: "trophy", text: "Family leaderboard" },
            { icon: "download", text: "Offline downloads" },
            { icon: "musical-notes", text: "All songs & content" },
          ].map((feature, i) => (
            <View key={i} style={styles.featureRow}>
              <Ionicons name={feature.icon as any} size={18} color={colors.success} />
              <Text style={[styles.featureText, { color: colors.foreground }]}>{feature.text}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 0.5 },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 17, fontWeight: "700" },
  content: { padding: 16, paddingBottom: 100 },
  planCard: { padding: 16, borderRadius: 14, borderWidth: 1, marginBottom: 20 },
  planHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  planTitle: { fontSize: 18, fontWeight: "800" },
  planDesc: { fontSize: 12, marginTop: 2 },
  priceWrap: { alignItems: "flex-end" },
  priceValue: { fontSize: 22, fontWeight: "800" },
  pricePeriod: { fontSize: 11 },
  savingsRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  savingsText: { fontSize: 12, fontWeight: "700" },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: "700" },
  sectionCount: { fontSize: 12 },
  memberCard: { padding: 14, borderRadius: 12, borderWidth: 1, marginBottom: 10 },
  memberTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  memberLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  memberAvatar: { fontSize: 28 },
  memberNameRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  memberName: { fontSize: 14, fontWeight: "700" },
  ownerBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  ownerText: { fontSize: 9, fontWeight: "800" },
  memberLang: { fontSize: 12, marginTop: 2 },
  memberStats: { flexDirection: "row", gap: 8 },
  memberStat: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 5, borderRadius: 6 },
  memberStatValue: { fontSize: 11, fontWeight: "600" },
  inviteBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 14, borderRadius: 12, borderWidth: 1.5, borderStyle: "dashed", marginTop: 4, marginBottom: 20 },
  inviteBtnText: { fontSize: 14, fontWeight: "700" },
  inviteCard: { padding: 14, borderRadius: 12, borderWidth: 1, marginTop: 4, marginBottom: 20 },
  inviteTitle: { fontSize: 14, fontWeight: "700", marginBottom: 10 },
  inviteInput: { height: 44, borderRadius: 10, borderWidth: 1, paddingHorizontal: 14, fontSize: 14, marginBottom: 10 },
  inviteActions: { flexDirection: "row", gap: 8 },
  cancelBtn: { flex: 1, paddingVertical: 10, borderRadius: 8, borderWidth: 1, alignItems: "center" },
  cancelBtnText: { fontSize: 13, fontWeight: "600" },
  sendInviteBtn: { flex: 1, paddingVertical: 10, borderRadius: 8, alignItems: "center" },
  sendInviteBtnText: { fontSize: 13, fontWeight: "700", color: "#FFF" },
  featuresSection: { marginTop: 4 },
  featureRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 8 },
  featureText: { fontSize: 14 },
});
