import { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Platform,
  Animated,
} from "react-native";
import { Image } from "expo-image";
import { useRouter, useLocalSearchParams } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { getInfluencerById, type InfluencerAvatar } from "@/lib/influencer-avatars";
import * as Haptics from "expo-haptics";
import { markTodayAsPracticed } from "@/lib/streak-notifications";
import { markPracticeAndToast } from "@/lib/streak-practice-helper";
import { useUsage } from "@/lib/usage-context";

type CallState = "ringing" | "no-answer" | "texted-back";

export default function InfluencerCallScreen() {
  const { showStreakToast } = useUsage();
  const router = useRouter();
  const { influencerId } = useLocalSearchParams<{ influencerId: string }>();
  const [influencer, setInfluencer] = useState<InfluencerAvatar | null>(null);
  const [callState, setCallState] = useState<CallState>("ringing");
  const [ringCount, setRingCount] = useState(0);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (influencerId) {
      const data = getInfluencerById(influencerId);
      if (data) setInfluencer(data);
    }
  }, [influencerId]);

  // Pulse animation while ringing
  useEffect(() => {
    if (callState === "ringing") {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.1, duration: 800, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    }
  }, [callState, pulseAnim]);

  // Ring for 8-12 seconds then "no answer"
  useEffect(() => {
    if (callState !== "ringing") return;
    const ringTimer = setInterval(() => {
      setRingCount((prev) => {
        if (prev >= 4) {
          clearInterval(ringTimer);
          setCallState("no-answer");
          if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          // After 2 seconds, show "texted back"
          setTimeout(() => {
            setCallState("texted-back");
            if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          }, 2000);
          return prev;
        }
        if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        return prev + 1;
      });
    }, 2500);
    return () => clearInterval(ringTimer);
  }, [callState]);

  const getTextBackMessage = (inf: InfluencerAvatar): string => {
    const messages: Record<string, string> = {
      natasha_rd: "Ay sorry! 😅 Estoy cocinando mangu right now. Qué pasó? Text me! 🍳",
      carlos_mx: "Hey güey, sorry I missed you! 🎧 I'm at the studio rn. What's up? Text me neta",
      valentina_co: "Hola parcero! 💅 Sorry, I'm getting ready to go out. What's up? DM me!",
      thierry_fr: "Pardon mon ami! 🍷 I'm at the boulangerie. Send me a message, s'il vous plaît",
      bianca_br: "Oi! 🏖️ Sorry, I'm at the beach rn! Can't talk but text me! Bora!",
      kenji_jp: "ごめん！🎮 I'm in the middle of a raid. Can't pick up! Text me though!",
      soojin_kr: "미안~ 💜 I'm at a concert rn! Text me what you need! 화이팅!",
      omar_ar: "يا حبيبي sorry! 📖 I'm at the ahwa with friends. Send me a message!",
      mei_cn: "不好意思！✨ I'm in a meeting right now. Please text me! 加油!",
      marco_it: "Scusa! 🤌 Sto cucinando il pranzo! Text me, I'll answer after I eat!",
      lena_de: "Sorry! 🎧 Bin gerade am DJ Pult. Text me later or now, whatever!",
      arjun_in: "Sorry yaar! 🏏 Match chal raha hai! Text me what's up bhai!",
    };
    return messages[inf.id] || `Hey sorry, I can't pick up right now! Text me instead 😊`;
  };

  const handleEndCall = useCallback(() => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    markPracticeAndToast(showStreakToast);
    router.back();
  }, [router]);

  const handleGoToChat = useCallback(() => {
    if (!influencerId) return;
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.replace({ pathname: "/influencer-chat", params: { influencerId } });
  }, [influencerId, router]);

  if (!influencer) {
    return (
      <ScreenContainer className="flex-1 bg-background">
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer className="flex-1 bg-background" edges={["top", "bottom", "left", "right"]}>
      <View style={styles.container}>
        {/* Avatar */}
        <Animated.View style={[styles.avatarContainer, { transform: [{ scale: pulseAnim }] }]}>
          {influencer.avatarImageUrl ? (
            <Image source={{ uri: influencer.avatarImageUrl }} style={styles.avatar} contentFit="cover" />
          ) : (
            <View style={[styles.avatarFallback, { backgroundColor: influencer.avatarColor }]}>
              <Text style={styles.avatarEmoji}>{influencer.avatarEmoji}</Text>
            </View>
          )}
        </Animated.View>

        {/* Name & Status */}
        <Text style={styles.callerName}>{influencer.name}</Text>
        <Text style={styles.callerLanguage}>
          {influencer.nativeLanguage || influencer.language} • {influencer.city}
        </Text>

        {/* Call State */}
        {callState === "ringing" && (
          <View style={styles.stateContainer}>
            <Text style={styles.stateText}>Calling...</Text>
            <Text style={styles.stateSubtext}>Ring {ringCount + 1}</Text>
            <View style={styles.ringDots}>
              {[0, 1, 2, 3, 4].map((i) => (
                <View key={i} style={[styles.ringDot, i <= ringCount && styles.ringDotActive]} />
              ))}
            </View>
          </View>
        )}

        {callState === "no-answer" && (
          <View style={styles.stateContainer}>
            <Text style={styles.stateText}>No Answer</Text>
            <Text style={styles.stateSubtext}>{influencer.name.split(" ")[0]} didn't pick up</Text>
          </View>
        )}

        {callState === "texted-back" && (
          <View style={styles.stateContainer}>
            <Text style={styles.stateText}>💬 Texted You Back!</Text>
            <View style={styles.textBackBubble}>
              <Text style={styles.textBackMessage}>{getTextBackMessage(influencer)}</Text>
            </View>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          {callState === "texted-back" ? (
            <>
              <Pressable
                onPress={handleGoToChat}
                style={({ pressed }) => [styles.chatButton, pressed && { opacity: 0.8, transform: [{ scale: 0.97 }] }]}
              >
                <Text style={styles.chatButtonText}>💬 Open Chat</Text>
              </Pressable>
              <Pressable
                onPress={handleEndCall}
                style={({ pressed }) => [styles.dismissButton, pressed && { opacity: 0.8 }]}
              >
                <Text style={styles.dismissButtonText}>Dismiss</Text>
              </Pressable>
            </>
          ) : (
            <Pressable
              onPress={handleEndCall}
              style={({ pressed }) => [styles.endCallButton, pressed && { opacity: 0.8, transform: [{ scale: 0.97 }] }]}
            >
              <Text style={styles.endCallText}>End Call</Text>
            </Pressable>
          )}
        </View>

        {/* Note about Hume */}
        <View style={styles.noteContainer}>
          <Text style={styles.noteText}>
            💡 For live video conversations, join {influencer.name.split(" ")[0]}'s Live Events (Hume Speech-to-Speech)
          </Text>
        </View>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  loadingContainer: { flex: 1, alignItems: "center", justifyContent: "center" },
  loadingText: { fontSize: 16, color: "#9BA1A6" },
  container: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32 },
  avatarContainer: { marginBottom: 24 },
  avatar: { width: 120, height: 120, borderRadius: 60, borderWidth: 3, borderColor: "#0a7ea4" },
  avatarFallback: { width: 120, height: 120, borderRadius: 60, alignItems: "center", justifyContent: "center" },
  avatarEmoji: { fontSize: 50 },
  callerName: { fontSize: 24, fontWeight: "700", color: "#fff", marginBottom: 4 },
  callerLanguage: { fontSize: 14, color: "#9BA1A6", marginBottom: 24 },
  stateContainer: { alignItems: "center", marginBottom: 32 },
  stateText: { fontSize: 18, fontWeight: "600", color: "#fff", marginBottom: 8 },
  stateSubtext: { fontSize: 13, color: "#9BA1A6" },
  ringDots: { flexDirection: "row", gap: 8, marginTop: 12 },
  ringDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#334155" },
  ringDotActive: { backgroundColor: "#0a7ea4" },
  textBackBubble: { backgroundColor: "#1e2022", borderRadius: 16, padding: 16, marginTop: 12, maxWidth: "100%" },
  textBackMessage: { fontSize: 14, color: "#ECEDEE", lineHeight: 20 },
  actionsContainer: { alignItems: "center", gap: 12, marginBottom: 32 },
  endCallButton: { width: 72, height: 72, borderRadius: 36, backgroundColor: "#EF4444", alignItems: "center", justifyContent: "center" },
  endCallText: { fontSize: 12, color: "#fff", fontWeight: "700" },
  chatButton: { backgroundColor: "#0a7ea4", paddingHorizontal: 32, paddingVertical: 14, borderRadius: 24 },
  chatButtonText: { fontSize: 16, fontWeight: "700", color: "#fff" },
  dismissButton: { paddingHorizontal: 24, paddingVertical: 10 },
  dismissButtonText: { fontSize: 14, color: "#9BA1A6" },
  noteContainer: { position: "absolute", bottom: 40, left: 32, right: 32 },
  noteText: { fontSize: 11, color: "#687076", textAlign: "center", lineHeight: 16 },
});
