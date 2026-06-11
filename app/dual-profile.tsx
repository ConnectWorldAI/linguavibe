import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Platform,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";

const { width } = Dimensions.get("window");

type ProfileMode = "personal" | "professional";

type ProfileSection = {
  id: string;
  title: string;
  icon: string;
  visibleOn: ProfileMode[];
  enabled: boolean;
};

const PROFILE_SECTIONS: ProfileSection[] = [
  { id: "bio", title: "Bio & About", icon: "person-outline", visibleOn: ["personal", "professional"], enabled: true },
  { id: "languages", title: "Languages", icon: "language-outline", visibleOn: ["personal", "professional"], enabled: true },
  { id: "certifications", title: "Certifications", icon: "ribbon-outline", visibleOn: ["professional"], enabled: true },
  { id: "posts", title: "Posts & Photos", icon: "images-outline", visibleOn: ["personal"], enabled: true },
  { id: "stories", title: "Stories", icon: "albums-outline", visibleOn: ["personal"], enabled: true },
  { id: "music", title: "Music Covers", icon: "musical-notes-outline", visibleOn: ["personal"], enabled: true },
  { id: "teaching", title: "Teaching Experience", icon: "school-outline", visibleOn: ["professional"], enabled: true },
  { id: "availability", title: "Availability", icon: "calendar-outline", visibleOn: ["professional"], enabled: true },
  { id: "reviews", title: "Student Reviews", icon: "star-outline", visibleOn: ["professional"], enabled: true },
  { id: "location", title: "Location", icon: "location-outline", visibleOn: ["personal"], enabled: false },
  { id: "connections", title: "Connections", icon: "people-outline", visibleOn: ["personal", "professional"], enabled: true },
  { id: "achievements", title: "Achievements", icon: "trophy-outline", visibleOn: ["personal", "professional"], enabled: true },
];

export default function DualProfileScreen() {
  const colors = useColors();
  const [activeMode, setActiveMode] = useState<ProfileMode>("personal");
  const [sections, setSections] = useState(PROFILE_SECTIONS);
  const [personalPrivate, setPersonalPrivate] = useState(false);
  const [professionalPublic, setProfessionalPublic] = useState(true);

  const toggleSection = (id: string, mode: ProfileMode) => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSections((prev) =>
      prev.map((s) => {
        if (s.id === id) {
          const visibleOn = s.visibleOn.includes(mode)
            ? s.visibleOn.filter((m) => m !== mode)
            : [...s.visibleOn, mode];
          return { ...s, visibleOn };
        }
        return s;
      })
    );
  };

  const personalSections = sections.filter((s) => s.visibleOn.includes("personal"));
  const professionalSections = sections.filter((s) => s.visibleOn.includes("professional"));

  return (
    <ScreenContainer edges={["top", "left", "right"]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Dual Profile</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {/* Explanation */}
        <View style={[styles.infoCard, { backgroundColor: colors.primary + "10", borderColor: colors.primary + "30" }]}>
          <Ionicons name="information-circle-outline" size={20} color={colors.primary} />
          <Text style={[styles.infoText, { color: colors.foreground }]}>
            Manage two profiles: a personal one for friends and a professional one for classmates, teachers, and employers. Control what each audience sees.
          </Text>
        </View>

        {/* Profile Switcher */}
        <View style={styles.switcherContainer}>
          <TouchableOpacity
            style={[
              styles.switcherTab,
              activeMode === "personal" && { backgroundColor: "#6C5CE715", borderColor: "#6C5CE7" },
              activeMode !== "personal" && { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
            onPress={() => {
              if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setActiveMode("personal");
            }}
          >
            <Ionicons name="heart-outline" size={20} color={activeMode === "personal" ? "#6C5CE7" : colors.muted} />
            <Text style={[styles.switcherLabel, { color: activeMode === "personal" ? "#6C5CE7" : colors.muted }]}>Personal</Text>
            <Text style={[styles.switcherDesc, { color: colors.muted }]}>Friends & Social</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.switcherTab,
              activeMode === "professional" && { backgroundColor: "#00B89415", borderColor: "#00B894" },
              activeMode !== "professional" && { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
            onPress={() => {
              if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setActiveMode("professional");
            }}
          >
            <Ionicons name="briefcase-outline" size={20} color={activeMode === "professional" ? "#00B894" : colors.muted} />
            <Text style={[styles.switcherLabel, { color: activeMode === "professional" ? "#00B894" : colors.muted }]}>Professional</Text>
            <Text style={[styles.switcherDesc, { color: colors.muted }]}>Career & Academic</Text>
          </TouchableOpacity>
        </View>

        {/* Privacy Toggle */}
        <View style={[styles.privacyRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.privacyInfo}>
            <Ionicons
              name={activeMode === "personal" ? "lock-closed-outline" : "globe-outline"}
              size={18}
              color={activeMode === "personal" ? "#6C5CE7" : "#00B894"}
            />
            <View style={styles.privacyText}>
              <Text style={[styles.privacyTitle, { color: colors.foreground }]}>
                {activeMode === "personal" ? "Private Profile" : "Public Profile"}
              </Text>
              <Text style={[styles.privacyDesc, { color: colors.muted }]}>
                {activeMode === "personal"
                  ? "Only approved friends can see this profile"
                  : "Visible to anyone on ConnectWorld AI"}
              </Text>
            </View>
          </View>
          <Switch
            value={activeMode === "personal" ? personalPrivate : professionalPublic}
            onValueChange={(val) => {
              if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              if (activeMode === "personal") setPersonalPrivate(val);
              else setProfessionalPublic(val);
            }}
            trackColor={{ false: colors.border, true: (activeMode === "personal" ? "#6C5CE7" : "#00B894") + "60" }}
            thumbColor={activeMode === "personal" ? "#6C5CE7" : "#00B894"}
          />
        </View>

        {/* Visible Sections */}
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
          Visible on {activeMode === "personal" ? "Personal" : "Professional"} Profile
        </Text>
        <Text style={[styles.sectionDesc, { color: colors.muted }]}>
          Toggle which sections appear on this profile view.
        </Text>

        {sections.map((section) => {
          const isVisible = section.visibleOn.includes(activeMode);
          const accentColor = activeMode === "personal" ? "#6C5CE7" : "#00B894";
          return (
            <View key={section.id} style={[styles.sectionRow, { borderBottomColor: colors.border }]}>
              <View style={[styles.sectionIcon, { backgroundColor: accentColor + "10" }]}>
                <Ionicons name={section.icon as any} size={18} color={accentColor} />
              </View>
              <Text style={[styles.sectionName, { color: colors.foreground }]}>{section.title}</Text>
              <Switch
                value={isVisible}
                onValueChange={() => toggleSection(section.id, activeMode)}
                trackColor={{ false: colors.border, true: accentColor + "60" }}
                thumbColor={isVisible ? accentColor : colors.muted}
              />
            </View>
          );
        })}

        {/* Preview */}
        <TouchableOpacity style={[styles.previewBtn, { backgroundColor: activeMode === "personal" ? "#6C5CE7" : "#00B894" }]}>
          <Ionicons name="eye-outline" size={18} color="#FFFFFF" />
          <Text style={styles.previewBtnText}>Preview {activeMode === "personal" ? "Personal" : "Professional"} Profile</Text>
        </TouchableOpacity>

        {/* Cross-Visibility */}
        <View style={[styles.crossSection, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.crossTitle, { color: colors.foreground }]}>Cross-Visibility Rules</Text>
          <View style={[styles.crossRow, { borderBottomColor: colors.border }]}>
            <View style={styles.crossInfo}>
              <Ionicons name="school-outline" size={16} color="#00B894" />
              <Text style={[styles.crossText, { color: colors.foreground }]}>Classmates can see personal</Text>
            </View>
            <Switch
              value={false}
              trackColor={{ false: colors.border, true: "#00B89460" }}
              thumbColor={colors.muted}
            />
          </View>
          <View style={styles.crossRow}>
            <View style={styles.crossInfo}>
              <Ionicons name="people-outline" size={16} color="#6C5CE7" />
              <Text style={[styles.crossText, { color: colors.foreground }]}>Friends can see professional</Text>
            </View>
            <Switch
              value={true}
              trackColor={{ false: colors.border, true: "#6C5CE760" }}
              thumbColor="#6C5CE7"
            />
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 0.5 },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 17, fontWeight: "700" },
  content: { flex: 1 },
  contentContainer: { padding: 16 },
  infoCard: { flexDirection: "row", alignItems: "flex-start", gap: 10, padding: 14, borderRadius: 12, borderWidth: 1, marginBottom: 20 },
  infoText: { flex: 1, fontSize: 13, lineHeight: 18 },
  switcherContainer: { flexDirection: "row", gap: 10, marginBottom: 20 },
  switcherTab: { flex: 1, padding: 16, borderRadius: 14, borderWidth: 1.5, alignItems: "center", gap: 4 },
  switcherLabel: { fontSize: 14, fontWeight: "700" },
  switcherDesc: { fontSize: 11 },
  privacyRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 14, borderRadius: 12, borderWidth: 1, marginBottom: 20 },
  privacyInfo: { flexDirection: "row", alignItems: "center", gap: 10, flex: 1 },
  privacyText: { flex: 1 },
  privacyTitle: { fontSize: 14, fontWeight: "700" },
  privacyDesc: { fontSize: 12, marginTop: 2 },
  sectionTitle: { fontSize: 16, fontWeight: "700", marginBottom: 4 },
  sectionDesc: { fontSize: 13, marginBottom: 14 },
  sectionRow: { flexDirection: "row", alignItems: "center", paddingVertical: 12, borderBottomWidth: 0.5 },
  sectionIcon: { width: 32, height: 32, borderRadius: 8, alignItems: "center", justifyContent: "center", marginRight: 12 },
  sectionName: { flex: 1, fontSize: 14, fontWeight: "600" },
  previewBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, padding: 14, borderRadius: 12, marginTop: 20, marginBottom: 24 },
  previewBtnText: { fontSize: 15, fontWeight: "700", color: "#FFFFFF" },
  crossSection: { padding: 16, borderRadius: 14, borderWidth: 1 },
  crossTitle: { fontSize: 15, fontWeight: "700", marginBottom: 12 },
  crossRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 10, borderBottomWidth: 0.5 },
  crossInfo: { flexDirection: "row", alignItems: "center", gap: 8 },
  crossText: { fontSize: 13, fontWeight: "600" },
});
