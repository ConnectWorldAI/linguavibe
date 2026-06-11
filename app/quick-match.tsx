/**
 * Quick Match — Instantly pair with the highest-match online user for a spontaneous practice call.
 * Shows a matching animation while "searching", then reveals the matched partner with a Start Call CTA.
 */
import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Animated,
  Easing,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { ScreenContainer } from "@/components/screen-container";
import * as Haptics from "expo-haptics";

// ─── Types ───────────────────────────────────────────────────────────────────

type MatchState = "searching" | "found" | "no_match";

interface MatchedPartner {
  name: string;
  avatar: string;
  country: string;
  countryFlag: string;
  nativeLanguage: string;
  learningLanguage: string;
  level: string;
  matchScore: number;
  online: boolean;
  bio: string;
}

// ─── Mock Match Result ───────────────────────────────────────────────────────

const MATCHED_PARTNER: MatchedPartner = {
  name: "Lucas Fernández",
  avatar: "👨🏽",
  country: "Dominican Republic",
  countryFlag: "🇩🇴",
  nativeLanguage: "Spanish",
  learningLanguage: "English",
  level: "Intermediate",
  matchScore: 99,
  online: true,
  bio: "Musician and producer. I can teach you Dominican slang 🎶",
};

// ─── Component ───────────────────────────────────────────────────────────────

export default function QuickMatchScreen() {
  const [state, setState] = useState<MatchState>("searching");
  const pulseAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Pulse animation for searching state
  useEffect(() => {
    if (state === "searching") {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1, duration: 1200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 0, duration: 1200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        ])
      );
      pulse.start();

      const rotate = Animated.loop(
        Animated.timing(rotateAnim, { toValue: 1, duration: 3000, easing: Easing.linear, useNativeDriver: true })
      );
      rotate.start();

      return () => {
        pulse.stop();
        rotate.stop();
      };
    }
  }, [state]);

  // Simulate finding a match after 3 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      // 90% chance of finding a match (for demo)
      const found = Math.random() > 0.1;
      setState(found ? "found" : "no_match");

      if (found) {
        if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, damping: 12 }).start();
        Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
      } else {
        if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start();
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  const handleStartCall = () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    router.back();
    // In production: router.push("/voice-call") with partner params
  };

  const handleRetry = () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setState("searching");
    scaleAnim.setValue(0);
    fadeAnim.setValue(0);
    // Simulate again
    setTimeout(() => {
      setState("found");
      if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, damping: 12 }).start();
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
    }, 2500);
  };

  const pulseScale = pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.15] });
  const pulseOpacity = pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [0.6, 0.2] });
  const spin = rotateAnim.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "360deg"] });

  // ─── Searching State ─────────────────────────────────────────────────────

  const renderSearching = () => (
    <View style={styles.centerContent}>
      <View style={styles.searchingContainer}>
        {/* Pulse rings */}
        <Animated.View style={[styles.pulseRing, styles.pulseRing1, { transform: [{ scale: pulseScale }], opacity: pulseOpacity }]} />
        <Animated.View style={[styles.pulseRing, styles.pulseRing2, { transform: [{ scale: pulseScale }], opacity: pulseOpacity }]} />
        <Animated.View style={[styles.pulseRing, styles.pulseRing3, { transform: [{ scale: pulseScale }], opacity: pulseOpacity }]} />

        {/* Center icon */}
        <Animated.View style={[styles.searchIcon, { transform: [{ rotate: spin }] }]}>
          <Ionicons name="globe" size={48} color="#FFD700" />
        </Animated.View>
      </View>

      <Text style={styles.searchingTitle}>Finding your match...</Text>
      <Text style={styles.searchingDesc}>
        Looking for the best language partner who's online right now
      </Text>

      <View style={styles.searchingStats}>
        <View style={styles.searchingStat}>
          <Ionicons name="people" size={16} color="#00AAFF" />
          <Text style={styles.searchingStatText}>247 users online</Text>
        </View>
        <View style={styles.searchingStat}>
          <Ionicons name="language" size={16} color="#4ADE80" />
          <Text style={styles.searchingStatText}>Matching languages...</Text>
        </View>
      </View>
    </View>
  );

  // ─── Match Found State ───────────────────────────────────────────────────

  const renderFound = () => (
    <Animated.View style={[styles.centerContent, { transform: [{ scale: scaleAnim }], opacity: fadeAnim }]}>
      <View style={styles.matchFoundBadge}>
        <Ionicons name="checkmark-circle" size={20} color="#4ADE80" />
        <Text style={styles.matchFoundText}>Match Found!</Text>
      </View>

      {/* Partner Card */}
      <View style={styles.partnerCard}>
        <View style={styles.partnerAvatar}>
          <Text style={styles.partnerAvatarText}>{MATCHED_PARTNER.avatar}</Text>
          <View style={styles.partnerOnline} />
        </View>

        <Text style={styles.partnerName}>{MATCHED_PARTNER.name}</Text>
        <View style={styles.partnerLocation}>
          <Text style={styles.partnerFlag}>{MATCHED_PARTNER.countryFlag}</Text>
          <Text style={styles.partnerCountry}>{MATCHED_PARTNER.country}</Text>
        </View>

        {/* Match Score */}
        <View style={styles.partnerMatchBadge}>
          <Text style={styles.partnerMatchScore}>{MATCHED_PARTNER.matchScore}% match</Text>
        </View>

        {/* Language Exchange */}
        <View style={styles.partnerExchange}>
          <View style={styles.partnerLang}>
            <Text style={styles.partnerLangLabel}>Speaks</Text>
            <Text style={styles.partnerLangValue}>{MATCHED_PARTNER.nativeLanguage}</Text>
          </View>
          <Ionicons name="swap-horizontal" size={20} color="#FFD700" />
          <View style={styles.partnerLang}>
            <Text style={styles.partnerLangLabel}>Learning</Text>
            <Text style={styles.partnerLangValue}>{MATCHED_PARTNER.learningLanguage}</Text>
          </View>
        </View>

        <Text style={styles.partnerBio}>{MATCHED_PARTNER.bio}</Text>

        <View style={styles.partnerLevel}>
          <Text style={styles.partnerLevelText}>{MATCHED_PARTNER.level}</Text>
        </View>
      </View>

      {/* Actions */}
      <View style={styles.foundActions}>
        <TouchableOpacity style={styles.startCallBtn} onPress={handleStartCall}>
          <Ionicons name="call" size={20} color="#000" />
          <Text style={styles.startCallText}>Start Practice Call</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.skipBtn} onPress={() => router.back()}>
          <Text style={styles.skipText}>Maybe Later</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );

  // ─── No Match State ──────────────────────────────────────────────────────

  const renderNoMatch = () => (
    <Animated.View style={[styles.centerContent, { opacity: fadeAnim }]}>
      <View style={styles.noMatchIcon}>
        <Ionicons name="moon" size={48} color="#64748B" />
      </View>
      <Text style={styles.noMatchTitle}>No matches right now</Text>
      <Text style={styles.noMatchDesc}>
        No language partners matching your profile are online at the moment. Try again later or browse suggestions.
      </Text>
      <View style={styles.noMatchActions}>
        <TouchableOpacity style={styles.retryBtn} onPress={handleRetry}>
          <Ionicons name="refresh" size={18} color="#000" />
          <Text style={styles.retryText}>Try Again</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.browseBtn} onPress={() => { router.back(); }}>
          <Text style={styles.browseText}>Browse Suggestions</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );

  // ─── Main Render ─────────────────────────────────────────────────────────

  return (
    <ScreenContainer edges={["top", "left", "right"]}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
            <Ionicons name="close" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Quick Match</Text>
          <View style={{ width: 36 }} />
        </View>

        {state === "searching" && renderSearching()}
        {state === "found" && renderFound()}
        {state === "no_match" && renderNoMatch()}
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
  closeBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: "#1a1a2e", alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#fff" },

  centerContent: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 24 },

  // Searching
  searchingContainer: { position: "relative", width: 160, height: 160, alignItems: "center", justifyContent: "center", marginBottom: 32 },
  pulseRing: { position: "absolute", borderRadius: 999, borderWidth: 2, borderColor: "#FFD700" },
  pulseRing1: { width: 100, height: 100, top: 30, left: 30 },
  pulseRing2: { width: 130, height: 130, top: 15, left: 15 },
  pulseRing3: { width: 160, height: 160, top: 0, left: 0 },
  searchIcon: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: "#FFD700" + "20", alignItems: "center", justifyContent: "center",
    borderWidth: 2, borderColor: "#FFD700" + "40",
  },
  searchingTitle: { fontSize: 22, fontWeight: "800", color: "#fff", marginBottom: 8 },
  searchingDesc: { fontSize: 14, color: "#94A3B8", textAlign: "center", lineHeight: 20 },
  searchingStats: { marginTop: 32, gap: 12 },
  searchingStat: { flexDirection: "row", alignItems: "center", gap: 8 },
  searchingStatText: { fontSize: 13, color: "#64748B" },

  // Found
  matchFoundBadge: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: "#4ADE80" + "15", paddingHorizontal: 16, paddingVertical: 8,
    borderRadius: 20, marginBottom: 24, borderWidth: 1, borderColor: "#4ADE80" + "30",
  },
  matchFoundText: { fontSize: 15, fontWeight: "700", color: "#4ADE80" },

  partnerCard: {
    width: "100%", backgroundColor: "#1a1a2e", borderRadius: 20, padding: 24,
    alignItems: "center", borderWidth: 1.5, borderColor: "#FFD700" + "30",
  },
  partnerAvatar: { position: "relative", marginBottom: 12 },
  partnerAvatarText: { fontSize: 56 },
  partnerOnline: {
    position: "absolute", bottom: 2, right: 2,
    width: 14, height: 14, borderRadius: 7,
    backgroundColor: "#4ADE80", borderWidth: 2, borderColor: "#1a1a2e",
  },
  partnerName: { fontSize: 20, fontWeight: "800", color: "#fff" },
  partnerLocation: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 4 },
  partnerFlag: { fontSize: 16 },
  partnerCountry: { fontSize: 13, color: "#94A3B8" },
  partnerMatchBadge: {
    backgroundColor: "#FFD700" + "15", paddingHorizontal: 14, paddingVertical: 6,
    borderRadius: 12, marginTop: 12, borderWidth: 1, borderColor: "#FFD700" + "30",
  },
  partnerMatchScore: { fontSize: 14, fontWeight: "700", color: "#FFD700" },
  partnerExchange: {
    flexDirection: "row", alignItems: "center", gap: 12,
    backgroundColor: "#0a0a1a", borderRadius: 12, padding: 14,
    marginTop: 16, width: "100%",
  },
  partnerLang: { flex: 1, alignItems: "center" },
  partnerLangLabel: { fontSize: 10, color: "#64748B" },
  partnerLangValue: { fontSize: 14, fontWeight: "700", color: "#fff", marginTop: 2 },
  partnerBio: { fontSize: 13, color: "#94A3B8", textAlign: "center", marginTop: 14, lineHeight: 18 },
  partnerLevel: {
    marginTop: 12, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 8,
    backgroundColor: "#FFD700" + "15",
  },
  partnerLevelText: { fontSize: 12, fontWeight: "600", color: "#FFD700" },

  foundActions: { width: "100%", marginTop: 24, gap: 12 },
  startCallBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10,
    backgroundColor: "#4ADE80", paddingVertical: 16, borderRadius: 14,
  },
  startCallText: { fontSize: 16, fontWeight: "700", color: "#000" },
  skipBtn: { alignItems: "center", paddingVertical: 12 },
  skipText: { fontSize: 14, color: "#64748B" },

  // No Match
  noMatchIcon: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: "#1a1a2e", alignItems: "center", justifyContent: "center",
    marginBottom: 20,
  },
  noMatchTitle: { fontSize: 20, fontWeight: "800", color: "#fff", marginBottom: 8 },
  noMatchDesc: { fontSize: 14, color: "#94A3B8", textAlign: "center", lineHeight: 20 },
  noMatchActions: { width: "100%", marginTop: 32, gap: 12 },
  retryBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    backgroundColor: "#FFD700", paddingVertical: 16, borderRadius: 14,
  },
  retryText: { fontSize: 16, fontWeight: "700", color: "#000" },
  browseBtn: { alignItems: "center", paddingVertical: 12 },
  browseText: { fontSize: 14, color: "#00AAFF" },
});
