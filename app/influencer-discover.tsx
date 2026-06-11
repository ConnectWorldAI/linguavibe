import { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  ScrollView,
  Linking,
  StyleSheet,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import {
  getAllInfluencers,
  getFeaturedInfluencers,
  getFollowedInfluencerIds,
  followInfluencer,
  unfollowInfluencer,
  formatFollowerCount,
  type InfluencerAvatar,
} from "@/lib/influencer-avatars";
import * as Haptics from "expo-haptics";

const LANGUAGES = ["All", "Spanish", "French", "Portuguese", "Japanese", "Korean", "Arabic", "Mandarin Chinese", "Italian", "German", "Hindi"];

export default function InfluencerDiscoverScreen() {
  const router = useRouter();
  const [selectedLanguage, setSelectedLanguage] = useState("All");
  const [followedIds, setFollowedIds] = useState<string[]>([]);
  const [showFeatured, setShowFeatured] = useState(true);

  const allInfluencers = getAllInfluencers();
  const featured = getFeaturedInfluencers();

  const filteredInfluencers = selectedLanguage === "All"
    ? allInfluencers
    : allInfluencers.filter((i) => i.language === selectedLanguage);

  useEffect(() => {
    getFollowedInfluencerIds().then(setFollowedIds);
  }, []);

  const handleFollow = useCallback(async (id: string) => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (followedIds.includes(id)) {
      await unfollowInfluencer(id);
      setFollowedIds((prev) => prev.filter((f) => f !== id));
    } else {
      await followInfluencer(id);
      setFollowedIds((prev) => [...prev, id]);
    }
  }, [followedIds]);

  const handleOpenProfile = useCallback((id: string) => {
    router.push({ pathname: "/influencer-profile", params: { influencerId: id } });
  }, [router]);

  const renderInfluencerCard = ({ item }: { item: InfluencerAvatar }) => {
    const isFollowing = followedIds.includes(item.id);
    return (
      <Pressable
        onPress={() => handleOpenProfile(item.id)}
        style={({ pressed }) => [styles.card, pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] }]}
      >
        <View style={[styles.avatarCircle, { backgroundColor: item.avatarColor }]}>
          <Text style={styles.avatarEmoji}>{item.avatarEmoji}</Text>
        </View>
        <View style={styles.cardContent}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardName} numberOfLines={1}>{item.name}</Text>
            {item.isVerified && <Text style={styles.verifiedBadge}>✓</Text>}
          </View>
          <Text style={styles.cardDialect}>{item.dialect} • {item.city}</Text>
          <Text style={styles.cardBio} numberOfLines={2}>{item.contentStyle}</Text>
          <View style={styles.cardStats}>
            <Text style={styles.statText}>{formatFollowerCount(item.followersCount)} followers</Text>
            <View style={styles.socialIcons}>
              {item.socialProfiles.map((sp) => (
                <Text key={sp.platform} style={styles.socialIcon}>
                  {sp.platform === "tiktok" ? "🎵" : sp.platform === "instagram" ? "📸" : "▶️"}
                </Text>
              ))}
            </View>
          </View>
        </View>
        <Pressable
          onPress={() => handleFollow(item.id)}
          style={({ pressed }) => [
            styles.followBtn,
            isFollowing && styles.followingBtn,
            pressed && { opacity: 0.8 },
          ]}
        >
          <Text style={[styles.followBtnText, isFollowing && styles.followingBtnText]}>
            {isFollowing ? "Following" : "Follow"}
          </Text>
        </Pressable>
      </Pressable>
    );
  };

  const renderFeaturedCard = ({ item }: { item: InfluencerAvatar }) => (
    <Pressable
      onPress={() => handleOpenProfile(item.id)}
      style={({ pressed }) => [styles.featuredCard, { backgroundColor: item.avatarColor }, pressed && { opacity: 0.9 }]}
    >
      <Text style={styles.featuredEmoji}>{item.avatarEmoji}</Text>
      <Text style={styles.featuredName}>{item.name}</Text>
      <Text style={styles.featuredLang}>{item.language} • {item.dialect}</Text>
      <Text style={styles.featuredFollowers}>{formatFollowerCount(item.followersCount)}</Text>
      <View style={styles.featuredPersonality}>
        {item.personality.slice(0, 2).map((p) => (
          <View key={p} style={styles.personalityTag}>
            <Text style={styles.personalityTagText}>{p}</Text>
          </View>
        ))}
      </View>
    </Pressable>
  );

  return (
    <ScreenContainer className="flex-1 bg-background">
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={({ pressed }) => [pressed && { opacity: 0.7 }]}>
            <Text style={styles.backBtn}>←</Text>
          </Pressable>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Discover Creators</Text>
            <Text style={styles.headerSubtitle}>AI influencers teaching real language</Text>
          </View>
          <View style={{ width: 32 }} />
        </View>

        {/* Language Filter */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterContainer}
        >
          {LANGUAGES.map((lang) => (
            <Pressable
              key={lang}
              onPress={() => setSelectedLanguage(lang)}
              style={[
                styles.filterChip,
                selectedLanguage === lang && styles.filterChipActive,
              ]}
            >
              <Text style={[
                styles.filterChipText,
                selectedLanguage === lang && styles.filterChipTextActive,
              ]}>
                {lang === "Mandarin Chinese" ? "Mandarin" : lang}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        <FlatList
          data={filteredInfluencers}
          keyExtractor={(item) => item.id}
          renderItem={renderInfluencerCard}
          contentContainerStyle={styles.listContainer}
          ListHeaderComponent={
            showFeatured && selectedLanguage === "All" ? (
              <View style={styles.featuredSection}>
                <Text style={styles.sectionTitle}>🔥 Featured Creators</Text>
                <FlatList
                  data={featured}
                  horizontal
                  keyExtractor={(item) => item.id}
                  renderItem={renderFeaturedCard}
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.featuredList}
                />
              </View>
            ) : null
          }
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyEmoji}>🌍</Text>
              <Text style={styles.emptyText}>No creators for this language yet</Text>
              <Text style={styles.emptySubtext}>More coming soon!</Text>
            </View>
          }
        />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12 },
  backBtn: { fontSize: 24, color: "#fff" },
  headerCenter: { flex: 1, alignItems: "center" },
  headerTitle: { fontSize: 20, fontWeight: "700", color: "#fff" },
  headerSubtitle: { fontSize: 12, color: "#9BA1A6", marginTop: 2 },
  filterContainer: { paddingHorizontal: 16, paddingBottom: 12, gap: 8 },
  filterChip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: "#1e2022", marginRight: 8 },
  filterChipActive: { backgroundColor: "#0a7ea4" },
  filterChipText: { fontSize: 13, color: "#9BA1A6", fontWeight: "500" },
  filterChipTextActive: { color: "#fff" },
  listContainer: { paddingHorizontal: 16, paddingBottom: 100 },
  card: { flexDirection: "row", alignItems: "center", backgroundColor: "#1e2022", borderRadius: 16, padding: 14 },
  avatarCircle: { width: 52, height: 52, borderRadius: 26, alignItems: "center", justifyContent: "center" },
  avatarEmoji: { fontSize: 24 },
  cardContent: { flex: 1, marginLeft: 12 },
  cardHeader: { flexDirection: "row", alignItems: "center", gap: 4 },
  cardName: { fontSize: 15, fontWeight: "600", color: "#fff" },
  verifiedBadge: { fontSize: 12, color: "#0a7ea4", fontWeight: "700", backgroundColor: "#0a7ea422", borderRadius: 8, paddingHorizontal: 4 },
  cardDialect: { fontSize: 12, color: "#9BA1A6", marginTop: 2 },
  cardBio: { fontSize: 12, color: "#687076", marginTop: 4, lineHeight: 16 },
  cardStats: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 6 },
  statText: { fontSize: 11, color: "#0a7ea4", fontWeight: "600" },
  socialIcons: { flexDirection: "row", gap: 4 },
  socialIcon: { fontSize: 12 },
  followBtn: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 16, backgroundColor: "#0a7ea4", marginLeft: 8 },
  followingBtn: { backgroundColor: "#334155" },
  followBtnText: { fontSize: 12, fontWeight: "600", color: "#fff" },
  followingBtnText: { color: "#9BA1A6" },
  separator: { height: 10 },
  featuredSection: { marginBottom: 20 },
  sectionTitle: { fontSize: 18, fontWeight: "700", color: "#fff", marginBottom: 12 },
  featuredList: { gap: 12 },
  featuredCard: { width: 150, borderRadius: 16, padding: 14, alignItems: "center" },
  featuredEmoji: { fontSize: 32, marginBottom: 6 },
  featuredName: { fontSize: 13, fontWeight: "600", color: "#fff", textAlign: "center" },
  featuredLang: { fontSize: 11, color: "#ffffffaa", marginTop: 2 },
  featuredFollowers: { fontSize: 11, color: "#fff", fontWeight: "700", marginTop: 4 },
  featuredPersonality: { flexDirection: "row", gap: 4, marginTop: 8, flexWrap: "wrap", justifyContent: "center" },
  personalityTag: { backgroundColor: "#ffffff22", borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2 },
  personalityTagText: { fontSize: 10, color: "#fff" },
  emptyState: { alignItems: "center", paddingVertical: 60 },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 16, fontWeight: "600", color: "#fff" },
  emptySubtext: { fontSize: 13, color: "#9BA1A6", marginTop: 4 },
});
