/**
 * Connection Profile — Full profile view for a language exchange partner.
 * Shows avatar, bio, languages, availability, interests, stats, and action buttons.
 */
import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Alert,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { ScreenContainer } from "@/components/screen-container";
import * as Haptics from "expo-haptics";

// ─── Mock Profile Data ───────────────────────────────────────────────────────

const PROFILES: Record<string, any> = {
  default: {
    name: "Valentina Reyes",
    avatar: "👩🏽",
    country: "Colombia",
    countryFlag: "🇨🇴",
    city: "Medellín",
    nativeLanguage: "Spanish",
    learningLanguage: "English",
    level: "Intermediate",
    bio: "Love music and travel. Looking for conversation partners to practice English! I'm a graphic designer who loves hiking in the Andes and cooking traditional Colombian food.",
    online: true,
    matchScore: 98,
    memberSince: "March 2025",
    lastActive: "2 min ago",
    stats: {
      sessionsCompleted: 47,
      hoursPracticed: 32,
      rating: 4.9,
      responseRate: 95,
    },
    availability: [
      { day: "Mon-Fri", time: "7:00 PM - 9:00 PM", timezone: "COT (UTC-5)" },
      { day: "Sat-Sun", time: "10:00 AM - 2:00 PM", timezone: "COT (UTC-5)" },
    ],
    interests: ["Music", "Travel", "Cooking", "Design", "Hiking", "Photography"],
    languages: [
      { name: "Spanish", flag: "🇪🇸", level: "Native" },
      { name: "English", flag: "🇺🇸", level: "Intermediate" },
      { name: "Portuguese", flag: "🇧🇷", level: "Beginner" },
    ],
    badges: ["🏆 Top Rated", "⚡ Fast Responder", "🔥 7-Day Streak"],
  },
};

// ─── Component ───────────────────────────────────────────────────────────────

export default function ConnectionProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const profile = PROFILES[id || "default"] || PROFILES.default;
  const [isConnected, setIsConnected] = useState(false);

  const handleConnect = () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsConnected(true);
  };

  const handleDisconnect = () => {
    if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    setIsConnected(false);
  };

  const handleMessage = () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // Navigate to message compose
  };

  const handleCall = () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // Navigate to practice call
  };

  const handleMoreMenu = () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Alert.alert(
      profile.name,
      "Choose an action",
      [
        {
          text: "Report User",
          onPress: () => {
            Alert.alert("Report Submitted", "Thank you. Our team will review this profile within 24 hours.");
          },
        },
        {
          text: "Block User",
          style: "destructive",
          onPress: () => handleBlockUser(),
        },
        { text: "Cancel", style: "cancel" },
      ]
    );
  };

  const handleBlockUser = () => {
    Alert.alert(
      `Block ${profile.name}?`,
      "They won't be able to see your profile, send you messages, or appear in your connections. You can unblock them later in Privacy Settings.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Block",
          style: "destructive",
          onPress: async () => {
            try {
              const existing = await AsyncStorage.getItem("@linguavibe_blocked_users");
              const blocked = existing ? JSON.parse(existing) : [];
              blocked.push({
                id: id || "default",
                name: profile.name,
                username: profile.name.toLowerCase().replace(/\s/g, "."),
                avatar: null,
                blockedAt: new Date().toISOString(),
                reason: "Blocked from profile",
              });
              await AsyncStorage.setItem("@linguavibe_blocked_users", JSON.stringify(blocked));
              if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              Alert.alert("Blocked", `${profile.name} has been blocked.`, [
                { text: "OK", onPress: () => router.back() },
              ]);
            } catch {}
          },
        },
      ]
    );
  };

  return (
    <ScreenContainer edges={["top", "left", "right"]}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Profile</Text>
          <TouchableOpacity style={styles.moreBtn} onPress={handleMoreMenu}>
            <Ionicons name="ellipsis-horizontal" size={20} color="#94A3B8" />
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
          {/* Profile Hero */}
          <View style={styles.heroSection}>
            <View style={styles.avatarLarge}>
              <Text style={styles.avatarText}>{profile.avatar}</Text>
              {profile.online && <View style={styles.onlineBadge} />}
            </View>
            <Text style={styles.profileName}>{profile.name}</Text>
            <View style={styles.locationRow}>
              <Text style={styles.locationFlag}>{profile.countryFlag}</Text>
              <Text style={styles.locationText}>{profile.city}, {profile.country}</Text>
            </View>
            <Text style={styles.lastActive}>
              {profile.online ? "🟢 Online now" : `Last active ${profile.lastActive}`}
            </Text>

            {/* Match Score */}
            <View style={styles.matchCard}>
              <View style={styles.matchScoreCircle}>
                <Text style={styles.matchScoreText}>{profile.matchScore}%</Text>
              </View>
              <View style={styles.matchInfo}>
                <Text style={styles.matchLabel}>Language Match</Text>
                <Text style={styles.matchDesc}>
                  They speak {profile.nativeLanguage} (your target) and are learning {profile.learningLanguage} (your native)
                </Text>
              </View>
            </View>
          </View>

          {/* Bio */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About</Text>
            <Text style={styles.bioText}>{profile.bio}</Text>
          </View>

          {/* Languages */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Languages</Text>
            <View style={styles.languagesList}>
              {profile.languages.map((lang: any, i: number) => (
                <View key={i} style={styles.languageRow}>
                  <Text style={styles.languageFlag}>{lang.flag}</Text>
                  <Text style={styles.languageName}>{lang.name}</Text>
                  <View style={[styles.levelPill, { backgroundColor: lang.level === "Native" ? "#4ADE80" + "20" : lang.level === "Intermediate" ? "#FFD700" + "20" : "#00AAFF" + "20" }]}>
                    <Text style={[styles.levelPillText, { color: lang.level === "Native" ? "#4ADE80" : lang.level === "Intermediate" ? "#FFD700" : "#00AAFF" }]}>
                      {lang.level}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>

          {/* Stats */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Exchange Stats</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <Ionicons name="chatbubbles" size={20} color="#00AAFF" />
                <Text style={styles.statValue}>{profile.stats.sessionsCompleted}</Text>
                <Text style={styles.statLabel}>Sessions</Text>
              </View>
              <View style={styles.statCard}>
                <Ionicons name="time" size={20} color="#FFD700" />
                <Text style={styles.statValue}>{profile.stats.hoursPracticed}h</Text>
                <Text style={styles.statLabel}>Practiced</Text>
              </View>
              <View style={styles.statCard}>
                <Ionicons name="star" size={20} color="#F59E0B" />
                <Text style={styles.statValue}>{profile.stats.rating}</Text>
                <Text style={styles.statLabel}>Rating</Text>
              </View>
              <View style={styles.statCard}>
                <Ionicons name="flash" size={20} color="#4ADE80" />
                <Text style={styles.statValue}>{profile.stats.responseRate}%</Text>
                <Text style={styles.statLabel}>Response</Text>
              </View>
            </View>
          </View>

          {/* Availability */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Availability</Text>
            {profile.availability.map((slot: any, i: number) => (
              <View key={i} style={styles.availabilityRow}>
                <Ionicons name="calendar" size={16} color="#64748B" />
                <Text style={styles.availDay}>{slot.day}</Text>
                <Text style={styles.availTime}>{slot.time}</Text>
                <Text style={styles.availTz}>{slot.timezone}</Text>
              </View>
            ))}
          </View>

          {/* Interests */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Interests</Text>
            <View style={styles.interestsWrap}>
              {profile.interests.map((interest: string, i: number) => (
                <View key={i} style={styles.interestChip}>
                  <Text style={styles.interestText}>{interest}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Badges */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Badges</Text>
            <View style={styles.badgesRow}>
              {profile.badges.map((badge: string, i: number) => (
                <View key={i} style={styles.badgeChip}>
                  <Text style={styles.badgeText}>{badge}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Member Since */}
          <View style={styles.memberSince}>
            <Ionicons name="calendar-outline" size={14} color="#64748B" />
            <Text style={styles.memberSinceText}>Member since {profile.memberSince}</Text>
          </View>
        </ScrollView>

        {/* Sticky Action Bar */}
        <View style={styles.actionBar}>
          {isConnected ? (
            <>
              <TouchableOpacity style={styles.actionMessage} onPress={handleMessage}>
                <Ionicons name="chatbubble" size={18} color="#00AAFF" />
                <Text style={styles.actionMessageText}>Message</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionCall} onPress={handleCall}>
                <Ionicons name="call" size={18} color="#fff" />
                <Text style={styles.actionCallText}>Practice Call</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionDisconnect} onPress={handleDisconnect}>
                <Ionicons name="person-remove" size={16} color="#FF6B6B" />
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity style={styles.actionConnectFull} onPress={handleConnect}>
              <Ionicons name="person-add" size={18} color="#000" />
              <Text style={styles.actionConnectText}>Connect with {profile.name.split(" ")[0]}</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </ScreenContainer>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0a0a1a" },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingVertical: 14,
  },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: "#1a1a2e", alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#fff" },
  moreBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: "#1a1a2e", alignItems: "center", justifyContent: "center" },

  // Hero
  heroSection: { alignItems: "center", paddingHorizontal: 16, paddingBottom: 20 },
  avatarLarge: { position: "relative", marginBottom: 12 },
  avatarText: { fontSize: 64 },
  onlineBadge: {
    position: "absolute", bottom: 4, right: 4,
    width: 16, height: 16, borderRadius: 8,
    backgroundColor: "#4ADE80", borderWidth: 3, borderColor: "#0a0a1a",
  },
  profileName: { fontSize: 24, fontWeight: "800", color: "#fff" },
  locationRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 6 },
  locationFlag: { fontSize: 16 },
  locationText: { fontSize: 14, color: "#94A3B8" },
  lastActive: { fontSize: 12, color: "#64748B", marginTop: 6 },

  // Match Card
  matchCard: {
    flexDirection: "row", alignItems: "center", gap: 14,
    backgroundColor: "#1a1a2e", borderRadius: 16, padding: 16,
    marginTop: 16, width: "100%",
    borderWidth: 1, borderColor: "#FFD700" + "30",
  },
  matchScoreCircle: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: "#FFD700" + "20", alignItems: "center", justifyContent: "center",
    borderWidth: 2, borderColor: "#FFD700" + "60",
  },
  matchScoreText: { fontSize: 16, fontWeight: "800", color: "#FFD700" },
  matchInfo: { flex: 1 },
  matchLabel: { fontSize: 14, fontWeight: "700", color: "#FFD700" },
  matchDesc: { fontSize: 12, color: "#94A3B8", marginTop: 4, lineHeight: 17 },

  // Sections
  section: { paddingHorizontal: 16, marginTop: 24 },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: "#fff", marginBottom: 12 },
  bioText: { fontSize: 14, color: "#94A3B8", lineHeight: 22 },

  // Languages
  languagesList: { gap: 8 },
  languageRow: {
    flexDirection: "row", alignItems: "center", gap: 10,
    backgroundColor: "#1a1a2e", borderRadius: 12, padding: 12,
    borderWidth: 1, borderColor: "#2a2a3e",
  },
  languageFlag: { fontSize: 20 },
  languageName: { flex: 1, fontSize: 14, fontWeight: "600", color: "#fff" },
  levelPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  levelPillText: { fontSize: 12, fontWeight: "700" },

  // Stats
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  statCard: {
    flex: 1, minWidth: "45%", alignItems: "center", gap: 6,
    backgroundColor: "#1a1a2e", borderRadius: 14, padding: 16,
    borderWidth: 1, borderColor: "#2a2a3e",
  },
  statValue: { fontSize: 20, fontWeight: "800", color: "#fff" },
  statLabel: { fontSize: 11, color: "#64748B" },

  // Availability
  availabilityRow: {
    flexDirection: "row", alignItems: "center", gap: 10,
    backgroundColor: "#1a1a2e", borderRadius: 12, padding: 12,
    marginBottom: 8, borderWidth: 1, borderColor: "#2a2a3e",
  },
  availDay: { fontSize: 13, fontWeight: "700", color: "#fff", width: 70 },
  availTime: { flex: 1, fontSize: 13, color: "#94A3B8" },
  availTz: { fontSize: 11, color: "#64748B" },

  // Interests
  interestsWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  interestChip: {
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: 16,
    backgroundColor: "#1a1a2e", borderWidth: 1, borderColor: "#2a2a3e",
  },
  interestText: { fontSize: 13, color: "#94A3B8", fontWeight: "500" },

  // Badges
  badgesRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  badgeChip: {
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12,
    backgroundColor: "#FFD700" + "10", borderWidth: 1, borderColor: "#FFD700" + "30",
  },
  badgeText: { fontSize: 12, fontWeight: "600", color: "#FFD700" },

  // Member since
  memberSince: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 6, paddingVertical: 20,
  },
  memberSinceText: { fontSize: 12, color: "#64748B" },

  // Action Bar
  actionBar: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    flexDirection: "row", gap: 10,
    paddingHorizontal: 16, paddingVertical: 16, paddingBottom: 34,
    backgroundColor: "#0a0a1a", borderTopWidth: 1, borderTopColor: "#1a1a2e",
  },
  actionConnectFull: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    backgroundColor: "#FFD700", paddingVertical: 16, borderRadius: 14,
  },
  actionConnectText: { fontSize: 16, fontWeight: "700", color: "#000" },
  actionMessage: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6,
    paddingVertical: 14, borderRadius: 14,
    backgroundColor: "#00AAFF" + "15", borderWidth: 1, borderColor: "#00AAFF" + "30",
  },
  actionMessageText: { fontSize: 14, fontWeight: "600", color: "#00AAFF" },
  actionCall: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6,
    paddingVertical: 14, borderRadius: 14, backgroundColor: "#4ADE80",
  },
  actionCallText: { fontSize: 14, fontWeight: "700", color: "#fff" },
  actionDisconnect: {
    width: 48, height: 48, borderRadius: 14, alignItems: "center", justifyContent: "center",
    backgroundColor: "#FF6B6B" + "15", borderWidth: 1, borderColor: "#FF6B6B" + "30",
  },
});
