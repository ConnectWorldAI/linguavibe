/**
 * Connections — Language Exchange Partner Suggestions
 * LinkedIn/Facebook-style "People You May Know" matched by complementary languages.
 * Your native language = their target language, and vice versa.
 */
import React, { useState, useCallback, useEffect, useRef } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Image,
  Animated as RNAnimated,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { ScreenContainer } from "@/components/screen-container";
import * as Haptics from "expo-haptics";

// ─── Types ───────────────────────────────────────────────────────────────────

interface Connection {
  id: string;
  name: string;
  avatar: string;
  country: string;
  countryFlag: string;
  nativeLanguage: string;
  learningLanguage: string;
  level: string;
  bio: string;
  mutualConnections: number;
  online: boolean;
  lastActive?: string; // e.g. "2m ago", "1h ago", "3d ago" — shown when offline
  matchScore: number; // 0-100 how complementary the match is
}

type TabKey = "suggestions" | "pending" | "connections";
type FilterKey = "all" | "beginner" | "intermediate" | "advanced";

// ─── Mock Data ───────────────────────────────────────────────────────────────

const SUGGESTED_CONNECTIONS: Connection[] = [
  {
    id: "c1", name: "Valentina Reyes", avatar: "👩🏽",
    country: "Colombia", countryFlag: "🇨🇴",
    nativeLanguage: "Spanish", learningLanguage: "English",
    level: "Intermediate", bio: "Love music and travel. Looking for conversation partners to practice English!",
    mutualConnections: 3, online: true, matchScore: 98,
  },
  {
    id: "c2", name: "Kenji Tanaka", avatar: "👨🏻",
    country: "Japan", countryFlag: "🇯🇵",
    nativeLanguage: "Japanese", learningLanguage: "English",
    level: "Advanced", bio: "Software engineer in Tokyo. Happy to help with Japanese in exchange for English practice.",
    mutualConnections: 1, online: false, lastActive: "25m ago", matchScore: 85,
  },
  {
    id: "c3", name: "Amara Diallo", avatar: "👩🏿",
    country: "Senegal", countryFlag: "🇸🇳",
    nativeLanguage: "French", learningLanguage: "English",
    level: "Beginner", bio: "University student studying business. Want to improve my English for work.",
    mutualConnections: 0, online: true, matchScore: 92,
  },
  {
    id: "c4", name: "Lucas Fernández", avatar: "👨🏽",
    country: "Dominican Republic", countryFlag: "🇩🇴",
    nativeLanguage: "Spanish", learningLanguage: "English",
    level: "Intermediate", bio: "Musician and producer. I can teach you Dominican slang 🎶",
    mutualConnections: 5, online: true, matchScore: 99,
  },
  {
    id: "c5", name: "Yuki Nakamura", avatar: "👩🏻",
    country: "Japan", countryFlag: "🇯🇵",
    nativeLanguage: "Japanese", learningLanguage: "Spanish",
    level: "Beginner", bio: "Anime voice actress. Learning Spanish to connect with Latin American fans!",
    mutualConnections: 2, online: false, lastActive: "3h ago", matchScore: 78,
  },
  {
    id: "c6", name: "Ahmed Hassan", avatar: "👨🏽",
    country: "Egypt", countryFlag: "🇪🇬",
    nativeLanguage: "Arabic", learningLanguage: "English",
    level: "Intermediate", bio: "Doctor in Cairo. Want to practice medical English and everyday conversation.",
    mutualConnections: 0, online: true, matchScore: 88,
  },
  {
    id: "c7", name: "Priya Sharma", avatar: "👩🏽",
    country: "India", countryFlag: "🇮🇳",
    nativeLanguage: "Hindi", learningLanguage: "English",
    level: "Advanced", bio: "Content creator and teacher. Can help with Hindi, Urdu, and Punjabi!",
    mutualConnections: 4, online: false, lastActive: "1h ago", matchScore: 82,
  },
  {
    id: "c8", name: "Marco Rossi", avatar: "👨🏻",
    country: "Italy", countryFlag: "🇮🇹",
    nativeLanguage: "Italian", learningLanguage: "English",
    level: "Intermediate", bio: "Chef from Rome. Let's cook and talk! 🍝",
    mutualConnections: 1, online: true, matchScore: 90,
  },
  {
    id: "c9", name: "Fatima Al-Rashid", avatar: "👩🏽",
    country: "Morocco", countryFlag: "🇲🇦",
    nativeLanguage: "Arabic", learningLanguage: "French",
    level: "Beginner", bio: "Architecture student. I speak Arabic and Darija, learning French for work.",
    mutualConnections: 0, online: false, lastActive: "2d ago", matchScore: 75,
  },
  {
    id: "c10", name: "Park Ji-hoon", avatar: "👨🏻",
    country: "South Korea", countryFlag: "🇰🇷",
    nativeLanguage: "Korean", learningLanguage: "English",
    level: "Advanced", bio: "K-pop fan and gamer. Let's practice while gaming together!",
    mutualConnections: 2, online: true, matchScore: 86,
  },
];

const PENDING_CONNECTIONS: Connection[] = [
  {
    id: "p1", name: "Sofia Martinez", avatar: "👩🏽",
    country: "Mexico", countryFlag: "🇲🇽",
    nativeLanguage: "Spanish", learningLanguage: "English",
    level: "Intermediate", bio: "Graphic designer in Mexico City.",
    mutualConnections: 2, online: false, lastActive: "45m ago", matchScore: 95,
  },
];

const MY_CONNECTIONS: Connection[] = [
  {
    id: "m1", name: "Carlos Vega", avatar: "👨🏽",
    country: "Venezuela", countryFlag: "🇻🇪",
    nativeLanguage: "Spanish", learningLanguage: "English",
    level: "Intermediate", bio: "Engineer living in Caracas. We practice 3x/week!",
    mutualConnections: 7, online: true, matchScore: 100,
  },
  {
    id: "m2", name: "Hana Kim", avatar: "👩🏻",
    country: "South Korea", countryFlag: "🇰🇷",
    nativeLanguage: "Korean", learningLanguage: "English",
    level: "Advanced", bio: "Translator and bookworm. Connected since March.",
    mutualConnections: 3, online: false, lastActive: "6h ago", matchScore: 91,
  },
];

// ─── Presence Dot (animated pulse) ───────────────────────────────────────────

function PresenceDot() {
  const pulse = useRef(new RNAnimated.Value(1)).current;

  useEffect(() => {
    const animation = RNAnimated.loop(
      RNAnimated.sequence([
        RNAnimated.timing(pulse, { toValue: 1.4, duration: 1000, useNativeDriver: true }),
        RNAnimated.timing(pulse, { toValue: 1, duration: 1000, useNativeDriver: true }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, []);

  return (
    <View style={styles.onlineDotContainer}>
      <RNAnimated.View style={[styles.onlinePulse, { transform: [{ scale: pulse }] }]} />
      <View style={styles.onlineDot} />
    </View>
  );
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function ConnectionsScreen() {
  const [activeTab, setActiveTab] = useState<TabKey>("suggestions");
  const [filter, setFilter] = useState<FilterKey>("all");
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [sentRequests, setSentRequests] = useState<Set<string>>(new Set());

  const filteredSuggestions = SUGGESTED_CONNECTIONS
    .filter((c) => !dismissed.has(c.id) && !sentRequests.has(c.id))
    .filter((c) => {
      if (filter === "all") return true;
      return c.level.toLowerCase() === filter;
    })
    .sort((a, b) => b.matchScore - a.matchScore);

  const handleConnect = useCallback((id: string) => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSentRequests((prev) => new Set(prev).add(id));
  }, []);

  const handleDismiss = useCallback((id: string) => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setDismissed((prev) => new Set(prev).add(id));
  }, []);

  const getMatchColor = (score: number) => {
    if (score >= 95) return "#4ADE80";
    if (score >= 85) return "#00AAFF";
    if (score >= 75) return "#FFD700";
    return "#94A3B8";
  };

  const getLevelColor = (level: string) => {
    switch (level.toLowerCase()) {
      case "beginner": return "#4ADE80";
      case "intermediate": return "#FFD700";
      case "advanced": return "#8B5CF6";
      default: return "#94A3B8";
    }
  };

  // ─── Render Suggestion Card ──────────────────────────────────────────────

  const renderSuggestionCard = ({ item }: { item: Connection }) => (
    <TouchableOpacity style={styles.card} onPress={() => router.push({ pathname: "/connection-profile" as any, params: { id: item.id } })} activeOpacity={0.8}>
      <View style={styles.cardHeader}>
        <View style={styles.avatarContainer}>
          <Text style={styles.avatar}>{item.avatar}</Text>
          {item.online && <PresenceDot />}
        </View>
        <View style={styles.cardInfo}>
          <View style={styles.nameRow}>
            <Text style={styles.cardName}>{item.name}</Text>
            <Text style={styles.countryFlag}>{item.countryFlag}</Text>
          </View>
          <Text style={styles.cardCountry}>{item.country}</Text>
          {!item.online && item.lastActive && (
            <Text style={styles.lastActiveText}>Active {item.lastActive}</Text>
          )}
        </View>
        <View style={[styles.matchBadge, { backgroundColor: getMatchColor(item.matchScore) + "20" }]}>
          <Text style={[styles.matchText, { color: getMatchColor(item.matchScore) }]}>
            {item.matchScore}%
          </Text>
          <Text style={styles.matchLabel}>match</Text>
        </View>
      </View>

      {/* Language Exchange Info */}
      <View style={styles.languageExchange}>
        <View style={styles.langBlock}>
          <Text style={styles.langLabel}>Speaks</Text>
          <Text style={styles.langValue}>{item.nativeLanguage}</Text>
        </View>
        <View style={styles.exchangeArrow}>
          <Ionicons name="swap-horizontal" size={20} color="#FFD700" />
        </View>
        <View style={styles.langBlock}>
          <Text style={styles.langLabel}>Learning</Text>
          <Text style={styles.langValue}>{item.learningLanguage}</Text>
        </View>
        <View style={[styles.levelBadge, { backgroundColor: getLevelColor(item.level) + "20" }]}>
          <Text style={[styles.levelText, { color: getLevelColor(item.level) }]}>{item.level}</Text>
        </View>
      </View>

      {/* Bio */}
      <Text style={styles.bio} numberOfLines={2}>{item.bio}</Text>

      {/* Mutual Connections */}
      {item.mutualConnections > 0 && (
        <View style={styles.mutualRow}>
          <Ionicons name="people" size={14} color="#64748B" />
          <Text style={styles.mutualText}>{item.mutualConnections} mutual connection{item.mutualConnections > 1 ? "s" : ""}</Text>
        </View>
      )}

      {/* Action Buttons */}
      <View style={styles.actionRow}>
        <TouchableOpacity
          style={styles.dismissBtn}
          onPress={() => handleDismiss(item.id)}
        >
          <Ionicons name="close" size={18} color="#94A3B8" />
          <Text style={styles.dismissText}>Ignore</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.connectBtn}
          onPress={() => handleConnect(item.id)}
        >
          <Ionicons name="person-add" size={16} color="#000" />
          <Text style={styles.connectText}>Connect</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  // ─── Render Pending Card ─────────────────────────────────────────────────

  const renderPendingCard = ({ item }: { item: Connection }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.avatarContainer}>
          <Text style={styles.avatar}>{item.avatar}</Text>
        </View>
        <View style={styles.cardInfo}>
          <View style={styles.nameRow}>
            <Text style={styles.cardName}>{item.name}</Text>
            <Text style={styles.countryFlag}>{item.countryFlag}</Text>
          </View>
          <Text style={styles.cardCountry}>{item.country}</Text>
        </View>
        <View style={styles.pendingBadge}>
          <Ionicons name="time" size={14} color="#FFD700" />
          <Text style={styles.pendingText}>Pending</Text>
        </View>
      </View>
      <View style={styles.languageExchange}>
        <View style={styles.langBlock}>
          <Text style={styles.langLabel}>Speaks</Text>
          <Text style={styles.langValue}>{item.nativeLanguage}</Text>
        </View>
        <View style={styles.exchangeArrow}>
          <Ionicons name="swap-horizontal" size={20} color="#FFD700" />
        </View>
        <View style={styles.langBlock}>
          <Text style={styles.langLabel}>Learning</Text>
          <Text style={styles.langValue}>{item.learningLanguage}</Text>
        </View>
      </View>
      <Text style={styles.bio} numberOfLines={2}>{item.bio}</Text>
    </View>
  );

  // ─── Render My Connection Card ───────────────────────────────────────────

  const renderMyConnectionCard = ({ item }: { item: Connection }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.avatarContainer}>
          <Text style={styles.avatar}>{item.avatar}</Text>
          {item.online && <PresenceDot />}
        </View>
        <View style={styles.cardInfo}>
          <View style={styles.nameRow}>
            <Text style={styles.cardName}>{item.name}</Text>
            <Text style={styles.countryFlag}>{item.countryFlag}</Text>
          </View>
          <Text style={styles.cardCountry}>{item.country} · {item.level}</Text>
          {!item.online && item.lastActive && (
            <Text style={styles.lastActiveText}>Active {item.lastActive}</Text>
          )}
        </View>
      </View>
      <View style={styles.languageExchange}>
        <View style={styles.langBlock}>
          <Text style={styles.langLabel}>Speaks</Text>
          <Text style={styles.langValue}>{item.nativeLanguage}</Text>
        </View>
        <View style={styles.exchangeArrow}>
          <Ionicons name="swap-horizontal" size={20} color="#FFD700" />
        </View>
        <View style={styles.langBlock}>
          <Text style={styles.langLabel}>Learning</Text>
          <Text style={styles.langValue}>{item.learningLanguage}</Text>
        </View>
      </View>
      <Text style={styles.bio} numberOfLines={2}>{item.bio}</Text>
      <View style={styles.actionRow}>
        <TouchableOpacity style={styles.messageBtn}>
          <Ionicons name="chatbubble" size={16} color="#00AAFF" />
          <Text style={styles.messageBtnText}>Message</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.callBtn}>
          <Ionicons name="call" size={16} color="#4ADE80" />
          <Text style={styles.callBtnText}>Practice Call</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // ─── Sent Requests (shown in suggestions) ───────────────────────────────

  const sentList = SUGGESTED_CONNECTIONS.filter((c) => sentRequests.has(c.id));
  const allPending = [...PENDING_CONNECTIONS, ...sentList];

  // ─── Main Render ─────────────────────────────────────────────────────────

  return (
    <ScreenContainer edges={["top", "left", "right"]}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Connections</Text>
          <TouchableOpacity style={styles.filterIconBtn}>
            <Ionicons name="search" size={20} color="#94A3B8" />
          </TouchableOpacity>
        </View>

        {/* Quick Match Button */}
        <TouchableOpacity style={styles.quickMatchBtn} onPress={() => { if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); router.push("/quick-match" as any); }}>
          <View style={styles.quickMatchIcon}>
            <Ionicons name="flash" size={20} color="#000" />
          </View>
          <View style={styles.quickMatchContent}>
            <Text style={styles.quickMatchTitle}>Quick Match</Text>
            <Text style={styles.quickMatchDesc}>Instantly pair with a partner who's online now</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#FFD700" />
        </TouchableOpacity>

        {/* Intro Banner */}
        <View style={styles.banner}>
          <View style={styles.bannerIcon}>
            <Ionicons name="globe" size={24} color="#FFD700" />
          </View>
          <View style={styles.bannerContent}>
            <Text style={styles.bannerTitle}>Find Language Partners</Text>
            <Text style={styles.bannerDesc}>
              Connect with people who speak the language you're learning — and want to learn yours!
            </Text>
          </View>
          <TouchableOpacity onPress={() => router.push("/language-preferences" as any)} style={styles.prefBtn}>
            <Ionicons name="settings-outline" size={16} color="#00AAFF" />
          </TouchableOpacity>
        </View>

        {/* Tabs */}
        <View style={styles.tabRow}>
          {([
            { key: "suggestions" as TabKey, label: "Suggested", count: filteredSuggestions.length },
            { key: "pending" as TabKey, label: "Pending", count: allPending.length },
            { key: "connections" as TabKey, label: "My Connections", count: MY_CONNECTIONS.length },
          ]).map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tab, activeTab === tab.key && styles.tabActive]}
              onPress={() => setActiveTab(tab.key)}
            >
              <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>
                {tab.label}
              </Text>
              {tab.count > 0 && (
                <View style={[styles.tabBadge, activeTab === tab.key && styles.tabBadgeActive]}>
                  <Text style={[styles.tabBadgeText, activeTab === tab.key && styles.tabBadgeTextActive]}>
                    {tab.count}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Filter Row (only for suggestions) */}
        {activeTab === "suggestions" && (
          <View style={styles.filterRow}>
            {([
              { key: "all" as FilterKey, label: "All" },
              { key: "beginner" as FilterKey, label: "Beginner" },
              { key: "intermediate" as FilterKey, label: "Intermediate" },
              { key: "advanced" as FilterKey, label: "Advanced" },
            ]).map((f) => (
              <TouchableOpacity
                key={f.key}
                style={[styles.filterChip, filter === f.key && styles.filterChipActive]}
                onPress={() => setFilter(f.key)}
              >
                <Text style={[styles.filterChipText, filter === f.key && styles.filterChipTextActive]}>
                  {f.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Content */}
        {activeTab === "suggestions" && (
          <FlatList
            data={filteredSuggestions}
            keyExtractor={(item) => item.id}
            renderItem={renderSuggestionCard}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Ionicons name="people-outline" size={48} color="#333" />
                <Text style={styles.emptyTitle}>No more suggestions</Text>
                <Text style={styles.emptyDesc}>Check back later for new language partners!</Text>
              </View>
            }
          />
        )}

        {activeTab === "pending" && (
          <FlatList
            data={allPending}
            keyExtractor={(item) => item.id}
            renderItem={renderPendingCard}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Ionicons name="time-outline" size={48} color="#333" />
                <Text style={styles.emptyTitle}>No pending requests</Text>
                <Text style={styles.emptyDesc}>Send connection requests to start practicing!</Text>
              </View>
            }
          />
        )}

        {activeTab === "connections" && (
          <FlatList
            data={MY_CONNECTIONS}
            keyExtractor={(item) => item.id}
            renderItem={renderMyConnectionCard}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Ionicons name="heart-outline" size={48} color="#333" />
                <Text style={styles.emptyTitle}>No connections yet</Text>
                <Text style={styles.emptyDesc}>Connect with language partners to start practicing together!</Text>
              </View>
            }
          />
        )}
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
  headerTitle: { fontSize: 20, fontWeight: "800", color: "#fff" },
  filterIconBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: "#1a1a2e", alignItems: "center", justifyContent: "center" },

  // Banner
  // Quick Match
  quickMatchBtn: {
    flexDirection: "row", alignItems: "center", gap: 12,
    marginHorizontal: 16, marginBottom: 12, padding: 14,
    backgroundColor: "#FFD700" + "12", borderRadius: 14,
    borderWidth: 1.5, borderColor: "#FFD700" + "40",
  },
  quickMatchIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: "#FFD700", alignItems: "center", justifyContent: "center" },
  quickMatchContent: { flex: 1 },
  quickMatchTitle: { fontSize: 15, fontWeight: "700", color: "#FFD700" },
  quickMatchDesc: { fontSize: 11, color: "#94A3B8", marginTop: 2 },

  banner: {
    flexDirection: "row", alignItems: "center", gap: 12,
    marginHorizontal: 16, marginBottom: 16, padding: 16,
    backgroundColor: "#1a1a2e", borderRadius: 16,
    borderWidth: 1, borderColor: "#FFD700" + "30",
  },
  bannerIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: "#FFD700" + "15", alignItems: "center", justifyContent: "center" },
  bannerContent: { flex: 1 },
  bannerTitle: { fontSize: 15, fontWeight: "700", color: "#fff", marginBottom: 4 },
  bannerDesc: { fontSize: 12, color: "#94A3B8", lineHeight: 17 },
  prefBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: "#00AAFF" + "15", alignItems: "center", justifyContent: "center" },

  // Tabs
  tabRow: { flexDirection: "row", paddingHorizontal: 16, marginBottom: 12, gap: 6 },
  tab: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 20, backgroundColor: "#1a1a2e",
  },
  tabActive: { backgroundColor: "#FFD700" + "20", borderWidth: 1, borderColor: "#FFD700" + "40" },
  tabText: { fontSize: 13, fontWeight: "600", color: "#64748B" },
  tabTextActive: { color: "#FFD700" },
  tabBadge: { backgroundColor: "#333", paddingHorizontal: 6, paddingVertical: 1, borderRadius: 8 },
  tabBadgeActive: { backgroundColor: "#FFD700" + "30" },
  tabBadgeText: { fontSize: 11, fontWeight: "700", color: "#64748B" },
  tabBadgeTextActive: { color: "#FFD700" },

  // Filters
  filterRow: { flexDirection: "row", paddingHorizontal: 16, marginBottom: 12, gap: 8 },
  filterChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 14, backgroundColor: "#1a1a2e" },
  filterChipActive: { backgroundColor: "#00AAFF" + "20", borderWidth: 1, borderColor: "#00AAFF" + "40" },
  filterChipText: { fontSize: 12, fontWeight: "600", color: "#64748B" },
  filterChipTextActive: { color: "#00AAFF" },

  // List
  listContent: { paddingHorizontal: 16, paddingBottom: 100 },

  // Card
  card: {
    backgroundColor: "#1a1a2e", borderRadius: 16, padding: 16,
    marginBottom: 12, borderWidth: 1, borderColor: "#2a2a3e",
  },
  cardHeader: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  avatarContainer: { position: "relative", marginRight: 12 },
  avatar: { fontSize: 36 },
  onlineDotContainer: {
    position: "absolute", bottom: -1, right: -1,
    width: 16, height: 16, alignItems: "center", justifyContent: "center",
  },
  onlinePulse: {
    position: "absolute",
    width: 14, height: 14, borderRadius: 7,
    backgroundColor: "rgba(74, 222, 128, 0.35)",
  },
  onlineDot: {
    width: 10, height: 10, borderRadius: 5,
    backgroundColor: "#4ADE80", borderWidth: 2, borderColor: "#1a1a2e",
  },
  cardInfo: { flex: 1 },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  cardName: { fontSize: 16, fontWeight: "700", color: "#fff" },
  countryFlag: { fontSize: 16 },
  cardCountry: { fontSize: 12, color: "#64748B", marginTop: 2 },
  lastActiveText: { fontSize: 11, color: "#94A3B8", marginTop: 2, fontStyle: "italic" },
  matchBadge: { alignItems: "center", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10 },
  matchText: { fontSize: 16, fontWeight: "800" },
  matchLabel: { fontSize: 9, color: "#64748B", marginTop: 1 },

  // Language exchange
  languageExchange: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: "#0a0a1a", borderRadius: 12, padding: 12,
    marginBottom: 10, gap: 8,
  },
  langBlock: { flex: 1, alignItems: "center" },
  langLabel: { fontSize: 10, color: "#64748B", marginBottom: 2 },
  langValue: { fontSize: 13, fontWeight: "700", color: "#fff" },
  exchangeArrow: { paddingHorizontal: 4 },
  levelBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  levelText: { fontSize: 11, fontWeight: "700" },

  // Bio
  bio: { fontSize: 13, color: "#94A3B8", lineHeight: 18, marginBottom: 10 },

  // Mutual
  mutualRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 12 },
  mutualText: { fontSize: 12, color: "#64748B" },

  // Actions
  actionRow: { flexDirection: "row", gap: 10 },
  dismissBtn: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6,
    paddingVertical: 10, borderRadius: 12, backgroundColor: "#0a0a1a",
    borderWidth: 1, borderColor: "#2a2a3e",
  },
  dismissText: { fontSize: 13, fontWeight: "600", color: "#94A3B8" },
  connectBtn: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6,
    paddingVertical: 10, borderRadius: 12, backgroundColor: "#FFD700",
  },
  connectText: { fontSize: 13, fontWeight: "700", color: "#000" },

  // Pending badge
  pendingBadge: {
    flexDirection: "row", alignItems: "center", gap: 4,
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10,
    backgroundColor: "#FFD700" + "15",
  },
  pendingText: { fontSize: 11, fontWeight: "600", color: "#FFD700" },

  // My connection actions
  messageBtn: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6,
    paddingVertical: 10, borderRadius: 12, backgroundColor: "#00AAFF" + "15",
    borderWidth: 1, borderColor: "#00AAFF" + "30",
  },
  messageBtnText: { fontSize: 13, fontWeight: "600", color: "#00AAFF" },
  callBtn: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6,
    paddingVertical: 10, borderRadius: 12, backgroundColor: "#4ADE80" + "15",
    borderWidth: 1, borderColor: "#4ADE80" + "30",
  },
  callBtnText: { fontSize: 13, fontWeight: "600", color: "#4ADE80" },

  // Empty state
  emptyState: { alignItems: "center", paddingTop: 60, gap: 12 },
  emptyTitle: { fontSize: 16, fontWeight: "700", color: "#fff" },
  emptyDesc: { fontSize: 13, color: "#64748B", textAlign: "center" },
});
