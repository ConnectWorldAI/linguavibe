import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  FlatList,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Colors, Spacing, BorderRadius, FontSize } from "@/constants/Colors";

// ─── Types ──────────────────────────────────────────────────────────────────
interface ExchangePartner {
  id: string;
  name: string;
  avatar: string;
  nativeLanguage: string;
  nativeFlag: string;
  learningLanguage: string;
  learningFlag: string;
  level: string;
  interests: string[];
  online: boolean;
  lastActive: string;
  rating: number;
  sessionsCompleted: number;
  bio: string;
  timezone: string;
}

type MatchStatus = "idle" | "searching" | "found";

// ─── Mock Data ──────────────────────────────────────────────────────────────
const PARTNERS: ExchangePartner[] = [
  {
    id: "1", name: "María García", avatar: "👩🏽", nativeLanguage: "Spanish", nativeFlag: "🇪🇸",
    learningLanguage: "English", learningFlag: "🇺🇸", level: "B2", interests: ["Travel", "Music", "Cooking"],
    online: true, lastActive: "Now", rating: 4.9, sessionsCompleted: 47, bio: "Hola! I love helping others learn Spanish while improving my English.",
    timezone: "UTC-5 (EST)",
  },
  {
    id: "2", name: "Yuki Tanaka", avatar: "👩🏻", nativeLanguage: "Japanese", nativeFlag: "🇯🇵",
    learningLanguage: "English", learningFlag: "🇺🇸", level: "B1", interests: ["Anime", "Technology", "Food"],
    online: true, lastActive: "Now", rating: 4.8, sessionsCompleted: 32, bio: "Let's practice together! I can teach you Japanese culture and language.",
    timezone: "UTC+9 (JST)",
  },
  {
    id: "3", name: "Pierre Dubois", avatar: "👨🏻", nativeLanguage: "French", nativeFlag: "🇫🇷",
    learningLanguage: "Spanish", learningFlag: "🇪🇸", level: "A2", interests: ["Cinema", "Literature", "Wine"],
    online: false, lastActive: "2h ago", rating: 4.7, sessionsCompleted: 18, bio: "Bonjour! Native French speaker looking to improve my Spanish. Happy to help with French!",
    timezone: "UTC+1 (CET)",
  },
  {
    id: "4", name: "Ji-Yeon Park", avatar: "👩🏻", nativeLanguage: "Korean", nativeFlag: "🇰🇷",
    learningLanguage: "English", learningFlag: "🇺🇸", level: "B1", interests: ["K-Pop", "Fashion", "Photography"],
    online: true, lastActive: "Now", rating: 4.9, sessionsCompleted: 56, bio: "안녕! I love teaching Korean through K-Pop lyrics and dramas.",
    timezone: "UTC+9 (KST)",
  },
  {
    id: "5", name: "Luca Rossi", avatar: "👨🏻", nativeLanguage: "Italian", nativeFlag: "🇮🇹",
    learningLanguage: "English", learningFlag: "🇺🇸", level: "B2", interests: ["Soccer", "Art", "History"],
    online: false, lastActive: "30m ago", rating: 4.6, sessionsCompleted: 23, bio: "Ciao! Let's exchange Italian for English. I love talking about art and history.",
    timezone: "UTC+1 (CET)",
  },
  {
    id: "6", name: "Ana Silva", avatar: "👩🏽", nativeLanguage: "Portuguese", nativeFlag: "🇧🇷",
    learningLanguage: "French", learningFlag: "🇫🇷", level: "A2", interests: ["Dance", "Nature", "Music"],
    online: true, lastActive: "Now", rating: 4.8, sessionsCompleted: 41, bio: "Olá! Brazilian Portuguese native. I teach through music and conversation!",
    timezone: "UTC-3 (BRT)",
  },
];

const SESSION_TYPES = [
  { id: "voice", icon: "call", label: "Voice Call", duration: "15-30 min" },
  { id: "video", icon: "videocam", label: "Video Call", duration: "15-30 min" },
  { id: "text", icon: "chatbubbles", label: "Text Chat", duration: "Flexible" },
];

export default function LanguageExchangeScreen() {
  const [matchStatus, setMatchStatus] = useState<MatchStatus>("idle");
  const [selectedPartner, setSelectedPartner] = useState<ExchangePartner | null>(null);
  const [filterLanguage, setFilterLanguage] = useState<string | null>(null);
  const [showOnlineOnly, setShowOnlineOnly] = useState(false);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [sessionType, setSessionType] = useState("voice");

  useEffect(() => {
    loadFavorites();
  }, []);

  const loadFavorites = async () => {
    try {
      const stored = await AsyncStorage.getItem("@exchange_favorites");
      if (stored) setFavorites(JSON.parse(stored));
    } catch {}
  };

  const toggleFavorite = async (id: string) => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const updated = favorites.includes(id)
      ? favorites.filter((f) => f !== id)
      : [...favorites, id];
    setFavorites(updated);
    await AsyncStorage.setItem("@exchange_favorites", JSON.stringify(updated));
  };

  const handleQuickMatch = () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setMatchStatus("searching");
    // Simulate matching
    setTimeout(() => {
      setMatchStatus("found");
      setSelectedPartner(PARTNERS.filter((p) => p.online)[Math.floor(Math.random() * 3)]);
      if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }, 3000);
  };

  const handleConnect = (partner: ExchangePartner) => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({ pathname: "/partner-chat", params: { partnerId: partner.id, partnerName: partner.name } });
  };

  const languages = [...new Set(PARTNERS.map((p) => p.nativeLanguage))];
  const filteredPartners = PARTNERS.filter((p) => {
    if (filterLanguage && p.nativeLanguage !== filterLanguage) return false;
    if (showOnlineOnly && !p.online) return false;
    return true;
  });

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Language Exchange</Text>
        <TouchableOpacity style={styles.headerBtn} onPress={() => setShowOnlineOnly(!showOnlineOnly)}>
          <Ionicons name={showOnlineOnly ? "radio-button-on" : "radio-button-off"} size={20} color={showOnlineOnly ? Colors.success : Colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Quick Match */}
        <View style={styles.quickMatchCard}>
          {matchStatus === "idle" && (
            <>
              <View style={styles.quickMatchIcon}>
                <Ionicons name="people" size={32} color={Colors.secondary} />
              </View>
              <Text style={styles.quickMatchTitle}>Quick Match</Text>
              <Text style={styles.quickMatchSubtitle}>
                Find an online partner who speaks your target language and wants to learn yours
              </Text>
              <TouchableOpacity style={styles.matchBtn} onPress={handleQuickMatch} activeOpacity={0.8}>
                <Ionicons name="flash" size={18} color="#fff" />
                <Text style={styles.matchBtnText}>Find a Partner</Text>
              </TouchableOpacity>
            </>
          )}
          {matchStatus === "searching" && (
            <>
              <View style={styles.searchingPulse}>
                <Ionicons name="search" size={28} color={Colors.secondary} />
              </View>
              <Text style={styles.quickMatchTitle}>Searching...</Text>
              <Text style={styles.quickMatchSubtitle}>
                Looking for the perfect language partner for you
              </Text>
            </>
          )}
          {matchStatus === "found" && selectedPartner && (
            <>
              <View style={styles.matchFoundIcon}>
                <Ionicons name="checkmark-circle" size={32} color={Colors.success} />
              </View>
              <Text style={styles.quickMatchTitle}>Match Found!</Text>
              <View style={styles.matchedPartnerRow}>
                <Text style={styles.matchedAvatar}>{selectedPartner.avatar}</Text>
                <View>
                  <Text style={styles.matchedName}>{selectedPartner.name}</Text>
                  <Text style={styles.matchedLang}>{selectedPartner.nativeFlag} {selectedPartner.nativeLanguage} native</Text>
                </View>
              </View>
              <View style={styles.matchActions}>
                <TouchableOpacity style={styles.startSessionBtn} activeOpacity={0.8} onPress={() => router.push({ pathname: "/partner-chat", params: { partnerId: selectedPartner.id, partnerName: selectedPartner.name } })}>
                  <Ionicons name="chatbubbles" size={16} color="#fff" />
                  <Text style={styles.startSessionText}>Start Chat</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.laterBtn} onPress={() => setMatchStatus("idle")}>
                  <Text style={styles.laterBtnText}>Maybe Later</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>

        {/* Session Type */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Session Type</Text>
          <View style={styles.sessionTypeRow}>
            {SESSION_TYPES.map((type) => (
              <TouchableOpacity
                key={type.id}
                style={[styles.sessionTypeCard, sessionType === type.id && styles.sessionTypeActive]}
                onPress={() => {
                  setSessionType(type.id);
                  if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
                activeOpacity={0.7}
              >
                <Ionicons name={type.icon as any} size={20} color={sessionType === type.id ? Colors.secondary : Colors.textSecondary} />
                <Text style={[styles.sessionTypeLabel, sessionType === type.id && styles.sessionTypeLabelActive]}>{type.label}</Text>
                <Text style={styles.sessionTypeDuration}>{type.duration}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Language Filter */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Browse Partners</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
            <TouchableOpacity
              style={[styles.filterChip, !filterLanguage && styles.filterChipActive]}
              onPress={() => setFilterLanguage(null)}
            >
              <Text style={[styles.filterChipText, !filterLanguage && styles.filterChipTextActive]}>All</Text>
            </TouchableOpacity>
            {languages.map((lang) => (
              <TouchableOpacity
                key={lang}
                style={[styles.filterChip, filterLanguage === lang && styles.filterChipActive]}
                onPress={() => setFilterLanguage(lang)}
              >
                <Text style={[styles.filterChipText, filterLanguage === lang && styles.filterChipTextActive]}>{lang}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Partner List */}
        {filteredPartners.map((partner) => (
          <TouchableOpacity
            key={partner.id}
            style={styles.partnerCard}
            onPress={() => handleConnect(partner)}
            activeOpacity={0.7}
          >
            <View style={styles.partnerTop}>
              <View style={styles.partnerAvatarWrap}>
                <Text style={styles.partnerAvatar}>{partner.avatar}</Text>
                {partner.online && <View style={styles.onlineDot} />}
              </View>
              <View style={styles.partnerInfo}>
                <Text style={styles.partnerName}>{partner.name}</Text>
                <View style={styles.partnerLangRow}>
                  <Text style={styles.partnerLang}>{partner.nativeFlag} {partner.nativeLanguage}</Text>
                  <Ionicons name="swap-horizontal" size={12} color={Colors.textSecondary} />
                  <Text style={styles.partnerLang}>{partner.learningFlag} {partner.learningLanguage}</Text>
                </View>
                <Text style={styles.partnerBio} numberOfLines={2}>{partner.bio}</Text>
              </View>
              <TouchableOpacity style={styles.favBtn} onPress={() => toggleFavorite(partner.id)}>
                <Ionicons
                  name={favorites.includes(partner.id) ? "heart" : "heart-outline"}
                  size={20}
                  color={favorites.includes(partner.id) ? "#EF4444" : Colors.textSecondary}
                />
              </TouchableOpacity>
            </View>
            <View style={styles.partnerBottom}>
              <View style={styles.partnerStats}>
                <View style={styles.partnerStat}>
                  <Ionicons name="star" size={12} color={Colors.gold} />
                  <Text style={styles.partnerStatText}>{partner.rating}</Text>
                </View>
                <View style={styles.partnerStat}>
                  <Ionicons name="chatbubbles-outline" size={12} color={Colors.textSecondary} />
                  <Text style={styles.partnerStatText}>{partner.sessionsCompleted} sessions</Text>
                </View>
                <View style={styles.partnerStat}>
                  <Ionicons name="school-outline" size={12} color={Colors.textSecondary} />
                  <Text style={styles.partnerStatText}>Level {partner.level}</Text>
                </View>
              </View>
              <View style={styles.interestRow}>
                {partner.interests.slice(0, 3).map((interest, i) => (
                  <View key={i} style={styles.interestChip}>
                    <Text style={styles.interestText}>{interest}</Text>
                  </View>
                ))}
              </View>
            </View>
          </TouchableOpacity>
        ))}

        {/* Tips */}
        <View style={styles.tipsCard}>
          <Ionicons name="bulb-outline" size={18} color={Colors.gold} />
          <View style={styles.tipsContent}>
            <Text style={styles.tipsTitle}>Exchange Tips</Text>
            <Text style={styles.tipsText}>
              • Split time 50/50 between languages{"\n"}
              • Use the built-in timer to stay balanced{"\n"}
              • Correct each other gently — it helps!{"\n"}
              • Focus on conversation, not grammar drills
            </Text>
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.primary },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm },
  headerBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.surfaceCard, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: Colors.border },
  headerTitle: { fontSize: FontSize.lg, fontWeight: "700", color: Colors.textPrimary },
  scrollContent: { paddingHorizontal: Spacing.md },
  // Quick match
  quickMatchCard: { padding: Spacing.lg, backgroundColor: Colors.surfaceCard, borderRadius: BorderRadius.lg, borderWidth: 1, borderColor: Colors.border, alignItems: "center", marginBottom: 20 },
  quickMatchIcon: { width: 60, height: 60, borderRadius: 30, backgroundColor: Colors.secondary + "15", alignItems: "center", justifyContent: "center", marginBottom: 12 },
  quickMatchTitle: { fontSize: FontSize.lg, fontWeight: "700", color: Colors.textPrimary, marginBottom: 4 },
  quickMatchSubtitle: { fontSize: FontSize.sm, color: Colors.textSecondary, textAlign: "center", lineHeight: 20, marginBottom: 16 },
  matchBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 24, paddingVertical: 12, backgroundColor: Colors.secondary, borderRadius: BorderRadius.full },
  matchBtnText: { fontSize: FontSize.md, fontWeight: "600", color: "#fff" },
  searchingPulse: { width: 60, height: 60, borderRadius: 30, backgroundColor: Colors.secondary + "20", alignItems: "center", justifyContent: "center", marginBottom: 12 },
  matchFoundIcon: { marginBottom: 8 },
  matchedPartnerRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 16 },
  matchedAvatar: { fontSize: 36 },
  matchedName: { fontSize: FontSize.md, fontWeight: "600", color: Colors.textPrimary },
  matchedLang: { fontSize: FontSize.sm, color: Colors.textSecondary },
  matchActions: { flexDirection: "row", gap: 10 },
  startSessionBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 20, paddingVertical: 10, backgroundColor: Colors.success, borderRadius: BorderRadius.full },
  startSessionText: { fontSize: FontSize.sm, fontWeight: "600", color: "#fff" },
  laterBtn: { paddingHorizontal: 16, paddingVertical: 10 },
  laterBtnText: { fontSize: FontSize.sm, color: Colors.textSecondary },
  // Section
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: FontSize.lg, fontWeight: "700", color: Colors.textPrimary, marginBottom: 10 },
  // Session type
  sessionTypeRow: { flexDirection: "row", gap: 8 },
  sessionTypeCard: { flex: 1, alignItems: "center", padding: 12, borderRadius: BorderRadius.md, backgroundColor: Colors.surfaceCard, borderWidth: 1, borderColor: Colors.border, gap: 4 },
  sessionTypeActive: { borderColor: Colors.secondary, backgroundColor: Colors.secondary + "10" },
  sessionTypeLabel: { fontSize: 11, fontWeight: "600", color: Colors.textSecondary, textAlign: "center" },
  sessionTypeLabelActive: { color: Colors.secondary },
  sessionTypeDuration: { fontSize: 10, color: Colors.textMuted },
  // Filter
  filterScroll: { marginBottom: 12 },
  filterChip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: BorderRadius.full, backgroundColor: Colors.surfaceCard, borderWidth: 1, borderColor: Colors.border, marginRight: 8 },
  filterChipActive: { backgroundColor: Colors.secondary + "20", borderColor: Colors.secondary },
  filterChipText: { fontSize: 12, fontWeight: "500", color: Colors.textSecondary },
  filterChipTextActive: { color: Colors.secondary },
  // Partner card
  partnerCard: { backgroundColor: Colors.surfaceCard, borderRadius: BorderRadius.lg, padding: Spacing.md, borderWidth: 1, borderColor: Colors.border, marginBottom: 12 },
  partnerTop: { flexDirection: "row", gap: 10, marginBottom: 10 },
  partnerAvatarWrap: { position: "relative" },
  partnerAvatar: { fontSize: 36 },
  onlineDot: { position: "absolute", bottom: 0, right: -2, width: 12, height: 12, borderRadius: 6, backgroundColor: Colors.success, borderWidth: 2, borderColor: Colors.surfaceCard },
  partnerInfo: { flex: 1 },
  partnerName: { fontSize: FontSize.md, fontWeight: "600", color: Colors.textPrimary },
  partnerLangRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 },
  partnerLang: { fontSize: 12, color: Colors.textSecondary },
  partnerBio: { fontSize: 12, color: Colors.textMuted, marginTop: 4, lineHeight: 16 },
  favBtn: { padding: 4 },
  partnerBottom: { borderTopWidth: 1, borderTopColor: Colors.border, paddingTop: 10 },
  partnerStats: { flexDirection: "row", gap: 12, marginBottom: 8 },
  partnerStat: { flexDirection: "row", alignItems: "center", gap: 3 },
  partnerStatText: { fontSize: 11, color: Colors.textSecondary },
  interestRow: { flexDirection: "row", gap: 6 },
  interestChip: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: BorderRadius.full, backgroundColor: Colors.primary },
  interestText: { fontSize: 10, color: Colors.textSecondary },
  // Tips
  tipsCard: { flexDirection: "row", gap: 10, padding: Spacing.md, backgroundColor: Colors.surfaceCard, borderRadius: BorderRadius.lg, borderWidth: 1, borderColor: Colors.goldBorder, marginTop: 8 },
  tipsContent: { flex: 1 },
  tipsTitle: { fontSize: FontSize.sm, fontWeight: "600", color: Colors.gold, marginBottom: 4 },
  tipsText: { fontSize: 12, color: Colors.textSecondary, lineHeight: 20 },
});
