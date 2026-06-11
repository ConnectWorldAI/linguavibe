import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
  Platform,
} from "react-native";
import { Image } from "expo-image";
import { useRouter, useLocalSearchParams } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { getInfluencerById, type InfluencerAvatar } from "@/lib/influencer-avatars";
import * as Haptics from "expo-haptics";

interface LiveEvent {
  id: string;
  title: string;
  description: string;
  scheduledAt: string;
  duration: string;
  type: "class" | "qa" | "cooking" | "music" | "culture" | "party";
  price: string;
  attendees: number;
  maxAttendees: number;
  isLive: boolean;
}

export default function InfluencerLiveScreen() {
  const router = useRouter();
  const { influencerId } = useLocalSearchParams<{ influencerId: string }>();
  const [influencer, setInfluencer] = useState<InfluencerAvatar | null>(null);

  useEffect(() => {
    if (influencerId) {
      const data = getInfluencerById(influencerId);
      if (data) setInfluencer(data);
    }
  }, [influencerId]);

  const getEvents = (inf: InfluencerAvatar): LiveEvent[] => {
    const baseEvents: LiveEvent[] = [
      {
        id: `${inf.id}_live_1`,
        title: `Live ${inf.teachingLanguage || inf.language} Conversation Practice`,
        description: `Join ${inf.name.split(" ")[0]} for a live conversation session. Practice speaking in real-time with Hume Speech-to-Speech AI.`,
        scheduledAt: "Tomorrow, 7:00 PM",
        duration: "45 min",
        type: "class",
        price: "$9.99",
        attendees: 23,
        maxAttendees: 50,
        isLive: false,
      },
      {
        id: `${inf.id}_live_2`,
        title: `Q&A: Ask ${inf.name.split(" ")[0]} Anything!`,
        description: `Live Q&A session. Ask about ${inf.teachingLanguage || inf.language}, culture, slang, or anything! Powered by Hume voice AI.`,
        scheduledAt: "Friday, 8:00 PM",
        duration: "30 min",
        type: "qa",
        price: "Free",
        attendees: 67,
        maxAttendees: 100,
        isLive: false,
      },
      {
        id: `${inf.id}_live_3`,
        title: `${inf.specialTopics[0]} Deep Dive`,
        description: `An immersive session focused on ${inf.specialTopics[0]}. Interactive voice practice with real-time feedback.`,
        scheduledAt: "Next Monday, 6:00 PM",
        duration: "60 min",
        type: "culture",
        price: "$12.99",
        attendees: 15,
        maxAttendees: 30,
        isLive: false,
      },
    ];
    return baseEvents;
  };

  const handleJoinEvent = useCallback((event: LiveEvent) => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // In production: opens Hume speech-to-speech session
    // For now: show alert/feedback
  }, []);

  const handleNotify = useCallback((event: LiveEvent) => {
    if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
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

  const events = getEvents(influencer);

  return (
    <ScreenContainer className="flex-1 bg-background">
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={({ pressed }) => [pressed && { opacity: 0.7 }]}>
            <Text style={styles.backBtn}>←</Text>
          </Pressable>
          <Text style={styles.headerTitle}>Live Events</Text>
          <View style={{ width: 32 }} />
        </View>

        {/* Influencer Banner */}
        <View style={[styles.banner, { backgroundColor: influencer.avatarColor }]}>
          <View style={styles.bannerRow}>
            {influencer.avatarImageUrl ? (
              <Image source={{ uri: influencer.avatarImageUrl }} style={styles.bannerAvatar} contentFit="cover" />
            ) : (
              <View style={styles.bannerAvatarFallback}>
                <Text style={styles.bannerEmoji}>{influencer.avatarEmoji}</Text>
              </View>
            )}
            <View style={styles.bannerInfo}>
              <Text style={styles.bannerName}>{influencer.name}</Text>
              <Text style={styles.bannerLang}>
                Teaches {influencer.teachingLanguage || influencer.language} • Native {influencer.nativeLanguage || influencer.language}
              </Text>
            </View>
          </View>
          <View style={styles.humeBadge}>
            <Text style={styles.humeBadgeText}>🎙️ Powered by Hume Speech-to-Speech</Text>
          </View>
        </View>

        {/* How It Works */}
        <View style={styles.howItWorks}>
          <Text style={styles.sectionTitle}>How Live Events Work</Text>
          <View style={styles.stepRow}>
            <View style={styles.step}>
              <Text style={styles.stepNumber}>1</Text>
              <Text style={styles.stepText}>Join the live session</Text>
            </View>
            <View style={styles.step}>
              <Text style={styles.stepNumber}>2</Text>
              <Text style={styles.stepText}>Speak naturally — Hume AI powers the voice</Text>
            </View>
            <View style={styles.step}>
              <Text style={styles.stepNumber}>3</Text>
              <Text style={styles.stepText}>Get real-time responses in {influencer.teachingLanguage || influencer.language}</Text>
            </View>
          </View>
        </View>

        {/* Events List */}
        <Text style={styles.sectionTitle}>Upcoming Events</Text>
        {events.map((event) => (
          <View key={event.id} style={styles.eventCard}>
            {event.isLive && (
              <View style={styles.liveBadge}>
                <Text style={styles.liveBadgeText}>🔴 LIVE NOW</Text>
              </View>
            )}
            <Text style={styles.eventTitle}>{event.title}</Text>
            <Text style={styles.eventDesc}>{event.description}</Text>
            <View style={styles.eventMeta}>
              <Text style={styles.eventMetaText}>📅 {event.scheduledAt}</Text>
              <Text style={styles.eventMetaText}>⏱️ {event.duration}</Text>
              <Text style={styles.eventMetaText}>👥 {event.attendees}/{event.maxAttendees}</Text>
            </View>
            <View style={styles.eventFooter}>
              <Text style={styles.eventPrice}>{event.price}</Text>
              <View style={styles.eventActions}>
                <Pressable
                  onPress={() => handleNotify(event)}
                  style={({ pressed }) => [styles.notifyBtn, pressed && { opacity: 0.7 }]}
                >
                  <Text style={styles.notifyBtnText}>🔔 Notify Me</Text>
                </Pressable>
                <Pressable
                  onPress={() => handleJoinEvent(event)}
                  style={({ pressed }) => [styles.joinBtn, pressed && { opacity: 0.8, transform: [{ scale: 0.97 }] }]}
                >
                  <Text style={styles.joinBtnText}>
                    {event.isLive ? "Join Now" : "Reserve Spot"}
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>
        ))}

        {/* Revenue Note (visible to admin) */}
        <View style={styles.revenueNote}>
          <Text style={styles.revenueNoteTitle}>💰 Revenue Potential</Text>
          <Text style={styles.revenueNoteText}>
            Each live event generates ticket revenue. With 12 influencers hosting 3+ events/week, this creates a recurring revenue stream of $5K-$15K/month from live events alone.
          </Text>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  loadingContainer: { flex: 1, alignItems: "center", justifyContent: "center" },
  loadingText: { fontSize: 16, color: "#9BA1A6" },
  container: { flex: 1 },
  scrollContent: { paddingBottom: 100 },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12 },
  backBtn: { fontSize: 24, color: "#fff" },
  headerTitle: { flex: 1, textAlign: "center", fontSize: 17, fontWeight: "600", color: "#fff" },
  banner: { marginHorizontal: 16, borderRadius: 16, padding: 16, marginBottom: 20 },
  bannerRow: { flexDirection: "row", alignItems: "center" },
  bannerAvatar: { width: 50, height: 50, borderRadius: 25, borderWidth: 2, borderColor: "#ffffff55" },
  bannerAvatarFallback: { width: 50, height: 50, borderRadius: 25, backgroundColor: "#ffffff33", alignItems: "center", justifyContent: "center" },
  bannerEmoji: { fontSize: 24 },
  bannerInfo: { marginLeft: 12, flex: 1 },
  bannerName: { fontSize: 18, fontWeight: "700", color: "#fff" },
  bannerLang: { fontSize: 12, color: "#ffffffcc", marginTop: 2 },
  humeBadge: { marginTop: 10, backgroundColor: "#ffffff22", borderRadius: 8, paddingVertical: 6, paddingHorizontal: 10, alignSelf: "flex-start" },
  humeBadgeText: { fontSize: 11, color: "#fff", fontWeight: "500" },
  howItWorks: { paddingHorizontal: 16, marginBottom: 20 },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: "#fff", marginBottom: 12, paddingHorizontal: 16 },
  stepRow: { gap: 10 },
  step: { flexDirection: "row", alignItems: "center", gap: 10 },
  stepNumber: { width: 24, height: 24, borderRadius: 12, backgroundColor: "#0a7ea4", textAlign: "center", lineHeight: 24, fontSize: 12, fontWeight: "700", color: "#fff", overflow: "hidden" },
  stepText: { fontSize: 13, color: "#ECEDEE", flex: 1 },
  eventCard: { backgroundColor: "#1e2022", marginHorizontal: 16, borderRadius: 14, padding: 16, marginBottom: 12 },
  liveBadge: { alignSelf: "flex-start", backgroundColor: "#FF000033", borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, marginBottom: 8 },
  liveBadgeText: { fontSize: 11, fontWeight: "700", color: "#FF4444" },
  eventTitle: { fontSize: 15, fontWeight: "700", color: "#fff", marginBottom: 6 },
  eventDesc: { fontSize: 12, color: "#9BA1A6", lineHeight: 18, marginBottom: 10 },
  eventMeta: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginBottom: 12 },
  eventMetaText: { fontSize: 11, color: "#687076" },
  eventFooter: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  eventPrice: { fontSize: 16, fontWeight: "700", color: "#4ADE80" },
  eventActions: { flexDirection: "row", gap: 8 },
  notifyBtn: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, backgroundColor: "#ffffff11" },
  notifyBtnText: { fontSize: 11, color: "#9BA1A6" },
  joinBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, backgroundColor: "#0a7ea4" },
  joinBtnText: { fontSize: 12, fontWeight: "700", color: "#fff" },
  revenueNote: { marginHorizontal: 16, marginTop: 12, backgroundColor: "#1e2022", borderRadius: 12, padding: 14, borderLeftWidth: 3, borderLeftColor: "#4ADE80" },
  revenueNoteTitle: { fontSize: 13, fontWeight: "700", color: "#4ADE80", marginBottom: 4 },
  revenueNoteText: { fontSize: 11, color: "#9BA1A6", lineHeight: 16 },
});
