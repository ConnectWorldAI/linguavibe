import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  Linking,
  StyleSheet,
  Platform,
} from "react-native";
import { Image } from "expo-image";
import { useRouter, useLocalSearchParams } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import {
  getInfluencerById,
  followInfluencer,
  unfollowInfluencer,
  isFollowingInfluencer,
  formatFollowerCount,
  type InfluencerAvatar,
  type SocialProfile,
} from "@/lib/influencer-avatars";
import * as Haptics from "expo-haptics";

export default function InfluencerProfileScreen() {
  const router = useRouter();
  const { influencerId } = useLocalSearchParams<{ influencerId: string }>();
  const [influencer, setInfluencer] = useState<InfluencerAvatar | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [activeTab, setActiveTab] = useState<"content" | "about" | "social">("content");

  useEffect(() => {
    if (influencerId) {
      const data = getInfluencerById(influencerId);
      if (data) setInfluencer(data);
      isFollowingInfluencer(influencerId).then(setIsFollowing);
    }
  }, [influencerId]);

  const handleFollow = useCallback(async () => {
    if (!influencerId) return;
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (isFollowing) {
      await unfollowInfluencer(influencerId);
      setIsFollowing(false);
    } else {
      await followInfluencer(influencerId);
      setIsFollowing(true);
    }
  }, [influencerId, isFollowing]);

  const handleMessage = useCallback(() => {
    if (!influencerId) return;
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({ pathname: "/influencer-chat", params: { influencerId } });
  }, [influencerId, router]);

  const handleCall = useCallback(() => {
    if (!influencerId || !influencer) return;
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push({ pathname: "/influencer-call", params: { influencerId } });
  }, [influencerId, influencer, router]);

  const handleLive = useCallback(() => {
    if (!influencerId) return;
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({ pathname: "/influencer-live", params: { influencerId } });
  }, [influencerId, router]);

  const handleOpenSocial = useCallback((url: string) => {
    Linking.openURL(url).catch(() => {});
  }, []);

  if (!influencer) {
    return (
      <ScreenContainer className="flex-1 bg-background">
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </ScreenContainer>
    );
  }

  const renderSocialCard = (profile: SocialProfile) => (
    <Pressable
      key={profile.platform}
      onPress={() => handleOpenSocial(profile.url)}
      style={({ pressed }) => [styles.socialCard, pressed && { opacity: 0.8, transform: [{ scale: 0.97 }] }]}
    >
      <View style={styles.socialCardHeader}>
        <Text style={styles.socialPlatformIcon}>
          {profile.platform === "tiktok" ? "🎵" : profile.platform === "instagram" ? "📸" : "▶️"}
        </Text>
        <Text style={styles.socialPlatformName}>
          {profile.platform === "tiktok" ? "TikTok" : profile.platform === "instagram" ? "Instagram" : "YouTube"}
        </Text>
      </View>
      <Text style={styles.socialHandle}>{profile.handle}</Text>
      <Text style={styles.socialFollowers}>{profile.followers} followers</Text>
      <Text style={styles.socialContentType}>{profile.contentType}</Text>
      <View style={styles.socialVisitBtn}>
        <Text style={styles.socialVisitBtnText}>Visit Profile →</Text>
      </View>
    </Pressable>
  );

  return (
    <ScreenContainer className="flex-1 bg-background">
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={({ pressed }) => [pressed && { opacity: 0.7 }]}>
            <Text style={styles.backBtn}>←</Text>
          </Pressable>
          <Text style={styles.headerTitle}>Profile</Text>
          <View style={{ width: 32 }} />
        </View>

        {/* Profile Hero with Avatar Image */}
        <View style={[styles.heroSection, { backgroundColor: influencer.avatarColor }]}>
          {influencer.avatarImageUrl ? (
            <Image
              source={{ uri: influencer.avatarImageUrl }}
              style={styles.heroAvatarImage}
              contentFit="cover"
              transition={300}
            />
          ) : (
            <View style={styles.heroAvatarContainer}>
              <Text style={styles.heroEmoji}>{influencer.avatarEmoji}</Text>
            </View>
          )}
          <Text style={styles.heroName}>{influencer.name}</Text>
          <View style={styles.heroVerified}>
            {influencer.isVerified && <Text style={styles.verifiedText}>✓ Verified Creator</Text>}
          </View>
          <Text style={styles.heroLocation}>📍 {influencer.city}, {influencer.country}</Text>

          {/* Language Info */}
          <View style={styles.languageRow}>
            <View style={styles.languageBadge}>
              <Text style={styles.languageBadgeLabel}>Native</Text>
              <Text style={styles.languageBadgeValue}>{influencer.nativeLanguage || influencer.language}</Text>
            </View>
            <View style={styles.languageDivider} />
            <View style={styles.languageBadge}>
              <Text style={styles.languageBadgeLabel}>Teaches</Text>
              <Text style={styles.languageBadgeValue}>{influencer.teachingLanguage || influencer.language}</Text>
            </View>
          </View>

          {/* Stats Row */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{formatFollowerCount(influencer.followersCount)}</Text>
              <Text style={styles.statLabel}>Followers</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{influencer.sampleContent.length}</Text>
              <Text style={styles.statLabel}>Lessons</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{influencer.socialProfiles.length}</Text>
              <Text style={styles.statLabel}>Platforms</Text>
            </View>
          </View>

          {/* Action Buttons Row */}
          <View style={styles.actionRow}>
            <Pressable
              onPress={handleFollow}
              style={({ pressed }) => [
                styles.followButton,
                isFollowing && styles.followingButton,
                pressed && { opacity: 0.8, transform: [{ scale: 0.97 }] },
              ]}
            >
              <Text style={[styles.followButtonText, isFollowing && styles.followingButtonText]}>
                {isFollowing ? "✓ Friends" : "+ Connect"}
              </Text>
            </Pressable>
            <Pressable
              onPress={handleMessage}
              style={({ pressed }) => [styles.actionBtn, pressed && { opacity: 0.8, transform: [{ scale: 0.97 }] }]}
            >
              <Text style={styles.actionBtnIcon}>💬</Text>
              <Text style={styles.actionBtnText}>Message</Text>
            </Pressable>
            <Pressable
              onPress={handleCall}
              style={({ pressed }) => [styles.actionBtn, styles.callBtn, pressed && { opacity: 0.8, transform: [{ scale: 0.97 }] }]}
            >
              <Text style={styles.actionBtnIcon}>📞</Text>
              <Text style={styles.actionBtnText}>Call</Text>
            </Pressable>
          </View>

          {/* Live Events Button */}
          <Pressable
            onPress={handleLive}
            style={({ pressed }) => [styles.liveButton, pressed && { opacity: 0.8, transform: [{ scale: 0.97 }] }]}
          >
            <Text style={styles.liveButtonIcon}>🔴</Text>
            <Text style={styles.liveButtonText}>Join Live Events</Text>
            <Text style={styles.liveButtonSub}>Hume Speech-to-Speech</Text>
          </Pressable>
        </View>

        {/* Bio */}
        <View style={styles.bioSection}>
          <Text style={styles.bioText}>{influencer.bio}</Text>
          <Text style={styles.catchphrase}>"{influencer.catchphrase}"</Text>
        </View>

        {/* Personality Tags */}
        <View style={styles.tagsSection}>
          {influencer.personality.map((p) => (
            <View key={p} style={[styles.tag, { borderColor: influencer.avatarColor }]}>
              <Text style={[styles.tagText, { color: influencer.avatarColor }]}>{p}</Text>
            </View>
          ))}
        </View>

        {/* Tab Navigation */}
        <View style={styles.tabBar}>
          {(["content", "about", "social"] as const).map((tab) => (
            <Pressable
              key={tab}
              onPress={() => setActiveTab(tab)}
              style={[styles.tab, activeTab === tab && styles.tabActive]}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                {tab === "content" ? "Content" : tab === "about" ? "About" : "Social"}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Tab Content */}
        {activeTab === "content" && (
          <View style={styles.tabContent}>
            <Text style={styles.sectionTitle}>Popular Content</Text>
            {influencer.sampleContent.map((item, index) => (
              <View key={index} style={styles.contentCard}>
                <View style={styles.contentTypeTag}>
                  <Text style={styles.contentTypeText}>{item.type.toUpperCase()}</Text>
                </View>
                <Text style={styles.contentTitle}>{item.title}</Text>
                <Text style={styles.contentDesc}>{item.description}</Text>
                <Text style={styles.contentEngagement}>📊 {item.engagement}</Text>
              </View>
            ))}
          </View>
        )}

        {activeTab === "about" && (
          <View style={styles.tabContent}>
            <Text style={styles.sectionTitle}>Lifestyle</Text>
            <Text style={styles.aboutText}>{influencer.lifestyle}</Text>

            <Text style={styles.sectionTitle}>Daily Routine</Text>
            <Text style={styles.aboutText}>{influencer.dailyRoutine}</Text>

            <Text style={styles.sectionTitle}>Teaching Style</Text>
            <Text style={styles.aboutText}>{influencer.teachingStyle}</Text>

            <Text style={styles.sectionTitle}>Special Topics</Text>
            <View style={styles.topicsList}>
              {influencer.specialTopics.map((topic) => (
                <View key={topic} style={styles.topicItem}>
                  <Text style={styles.topicText}>• {topic}</Text>
                </View>
              ))}
            </View>

            <Text style={styles.sectionTitle}>Interests</Text>
            <View style={styles.interestTags}>
              {influencer.interests.map((interest) => (
                <View key={interest} style={styles.interestTag}>
                  <Text style={styles.interestTagText}>{interest}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {activeTab === "social" && (
          <View style={styles.tabContent}>
            <Text style={styles.sectionTitle}>Social Media Profiles</Text>
            <Text style={styles.socialSubtitle}>Follow {influencer.name.split(" ")[0]} on all platforms</Text>
            {influencer.socialProfiles.map(renderSocialCard)}
          </View>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingBottom: 100 },
  loadingContainer: { flex: 1, alignItems: "center", justifyContent: "center" },
  loadingText: { fontSize: 16, color: "#9BA1A6" },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12 },
  backBtn: { fontSize: 24, color: "#fff" },
  headerTitle: { flex: 1, textAlign: "center", fontSize: 17, fontWeight: "600", color: "#fff" },
  heroSection: { marginHorizontal: 16, borderRadius: 20, padding: 24, alignItems: "center", marginBottom: 16 },
  heroAvatarImage: { width: 90, height: 90, borderRadius: 45, borderWidth: 3, borderColor: "#ffffff55", marginBottom: 12 },
  heroAvatarContainer: { width: 80, height: 80, borderRadius: 40, backgroundColor: "#ffffff33", alignItems: "center", justifyContent: "center", marginBottom: 12 },
  heroEmoji: { fontSize: 40 },
  heroName: { fontSize: 22, fontWeight: "700", color: "#fff" },
  heroVerified: { marginTop: 4 },
  verifiedText: { fontSize: 12, color: "#ffffffcc", fontWeight: "600" },
  heroLocation: { fontSize: 13, color: "#ffffffbb", marginTop: 6 },
  languageRow: { flexDirection: "row", alignItems: "center", marginTop: 12, backgroundColor: "#ffffff22", borderRadius: 12, paddingHorizontal: 16, paddingVertical: 8 },
  languageBadge: { alignItems: "center", flex: 1 },
  languageBadgeLabel: { fontSize: 10, color: "#ffffffaa", fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.5 },
  languageBadgeValue: { fontSize: 13, color: "#fff", fontWeight: "700", marginTop: 2 },
  languageDivider: { width: 1, height: 24, backgroundColor: "#ffffff44", marginHorizontal: 12 },
  statsRow: { flexDirection: "row", marginTop: 14, gap: 24 },
  statItem: { alignItems: "center" },
  statNumber: { fontSize: 18, fontWeight: "700", color: "#fff" },
  statLabel: { fontSize: 11, color: "#ffffffaa", marginTop: 2 },
  actionRow: { flexDirection: "row", marginTop: 16, gap: 8 },
  followButton: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20, backgroundColor: "#fff" },
  followingButton: { backgroundColor: "#ffffff33" },
  followButtonText: { fontSize: 13, fontWeight: "700", color: "#000" },
  followingButtonText: { color: "#fff" },
  actionBtn: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 20, backgroundColor: "#ffffff22" },
  callBtn: { backgroundColor: "#4CAF5044" },
  actionBtnIcon: { fontSize: 14 },
  actionBtnText: { fontSize: 12, fontWeight: "600", color: "#fff" },
  liveButton: { marginTop: 12, flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#FF000033", borderRadius: 14, paddingHorizontal: 16, paddingVertical: 10, width: "100%" },
  liveButtonIcon: { fontSize: 14 },
  liveButtonText: { fontSize: 13, fontWeight: "700", color: "#fff", flex: 1 },
  liveButtonSub: { fontSize: 10, color: "#ffffffaa" },
  bioSection: { paddingHorizontal: 16, marginBottom: 12 },
  bioText: { fontSize: 14, color: "#ECEDEE", lineHeight: 20 },
  catchphrase: { fontSize: 13, color: "#0a7ea4", fontStyle: "italic", marginTop: 8 },
  tagsSection: { flexDirection: "row", flexWrap: "wrap", paddingHorizontal: 16, gap: 8, marginBottom: 16 },
  tag: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4 },
  tagText: { fontSize: 12, fontWeight: "500" },
  tabBar: { flexDirection: "row", marginHorizontal: 16, backgroundColor: "#1e2022", borderRadius: 12, padding: 4, marginBottom: 16 },
  tab: { flex: 1, paddingVertical: 8, alignItems: "center", borderRadius: 10 },
  tabActive: { backgroundColor: "#0a7ea4" },
  tabText: { fontSize: 13, fontWeight: "500", color: "#9BA1A6" },
  tabTextActive: { color: "#fff" },
  tabContent: { paddingHorizontal: 16 },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: "#fff", marginBottom: 10, marginTop: 8 },
  contentCard: { backgroundColor: "#1e2022", borderRadius: 14, padding: 14, marginBottom: 10 },
  contentTypeTag: { alignSelf: "flex-start", backgroundColor: "#0a7ea422", borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2, marginBottom: 6 },
  contentTypeText: { fontSize: 10, fontWeight: "700", color: "#0a7ea4" },
  contentTitle: { fontSize: 14, fontWeight: "600", color: "#fff", marginBottom: 4 },
  contentDesc: { fontSize: 12, color: "#9BA1A6", lineHeight: 16 },
  contentEngagement: { fontSize: 11, color: "#0a7ea4", marginTop: 6, fontWeight: "500" },
  aboutText: { fontSize: 13, color: "#ECEDEE", lineHeight: 20, marginBottom: 16 },
  topicsList: { marginBottom: 16 },
  topicItem: { marginBottom: 4 },
  topicText: { fontSize: 13, color: "#ECEDEE" },
  interestTags: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  interestTag: { backgroundColor: "#1e2022", borderRadius: 10, paddingHorizontal: 10, paddingVertical: 5 },
  interestTagText: { fontSize: 12, color: "#9BA1A6" },
  socialSubtitle: { fontSize: 13, color: "#9BA1A6", marginBottom: 12 },
  socialCard: { backgroundColor: "#1e2022", borderRadius: 14, padding: 16, marginBottom: 12 },
  socialCardHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 6 },
  socialPlatformIcon: { fontSize: 20 },
  socialPlatformName: { fontSize: 15, fontWeight: "600", color: "#fff" },
  socialHandle: { fontSize: 13, color: "#0a7ea4", marginBottom: 4 },
  socialFollowers: { fontSize: 12, color: "#9BA1A6", marginBottom: 4 },
  socialContentType: { fontSize: 12, color: "#687076", marginBottom: 10 },
  socialVisitBtn: { alignSelf: "flex-start", backgroundColor: "#0a7ea422", borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  socialVisitBtnText: { fontSize: 12, fontWeight: "600", color: "#0a7ea4" },
});
