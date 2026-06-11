import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";

export type PaywallFeature =
  | "translation"
  | "teacher"
  | "cloudwave"
  | "song_translation"
  | "video_translation"
  | "ai_chat"
  | "pronunciation"
  | "word_breakdown"
  | "url_translation";

interface PaywallModalProps {
  visible: boolean;
  onClose: () => void;
  feature: PaywallFeature;
  /** Price for single use purchase */
  singlePrice?: string;
  /** Whether to show single purchase option */
  showSinglePurchase?: boolean;
}

const FEATURE_INFO: Record<PaywallFeature, { title: string; description: string; icon: string; freeLimit: string }> = {
  translation: {
    title: "Translation Limit Reached",
    description: "You've used your free translations for today. Upgrade for unlimited translations in all languages and dialects.",
    icon: "language",
    freeLimit: "3 translations/day",
  },
  teacher: {
    title: "Teacher Session Required",
    description: "Live teacher sessions are a premium feature. Get unlimited access to AI teachers with a subscription.",
    icon: "school",
    freeLimit: "1 free sample session",
  },
  cloudwave: {
    title: "CloudWave Time Limit",
    description: "You've reached your free CloudWave minutes for today. Upgrade for unlimited AI conversation time.",
    icon: "cloud",
    freeLimit: "5 minutes/day",
  },
  song_translation: {
    title: "Song Translation Limit",
    description: "Upgrade to translate unlimited songs and keep the original beat, vibe, and energy.",
    icon: "musical-notes",
    freeLimit: "1 song/day",
  },
  video_translation: {
    title: "Video Translation Limit",
    description: "Upgrade for unlimited video dubbing and translation with voice cloning.",
    icon: "videocam",
    freeLimit: "1 video/day",
  },
  ai_chat: {
    title: "AI Chat Limit Reached",
    description: "You've used your free AI messages for today. Upgrade for unlimited AI conversations.",
    icon: "chatbubbles",
    freeLimit: "10 messages/day",
  },
  pronunciation: {
    title: "Pronunciation Analysis Limit",
    description: "Upgrade for unlimited pronunciation feedback and detailed scoring.",
    icon: "mic",
    freeLimit: "3 analyses/day",
  },
  word_breakdown: {
    title: "Word Breakdown — Premium Feature",
    description: "Detailed word-by-word breakdowns and grammar explanations are available for subscribers.",
    icon: "book",
    freeLimit: "Basic translation only",
  },
  url_translation: {
    title: "URL Translation Limit",
    description: "Upgrade to translate unlimited web pages in multiple languages and dialects.",
    icon: "globe",
    freeLimit: "1 URL/day",
  },
};

export function PaywallModal({ visible, onClose, feature, singlePrice = "$0.99", showSinglePurchase = true }: PaywallModalProps) {
  const info = FEATURE_INFO[feature];

  const handleSubscribe = () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onClose();
    router.push("/subscription" as any);
  };

  const handleSinglePurchase = () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onClose();
    router.push("/payment-flow" as any);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Close button */}
          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Ionicons name="close" size={24} color="#9BA1A6" />
          </TouchableOpacity>

          {/* Icon */}
          <View style={styles.iconCircle}>
            <Ionicons name={info.icon as any} size={32} color="#0a7ea4" />
          </View>

          {/* Title & Description */}
          <Text style={styles.title}>{info.title}</Text>
          <Text style={styles.description}>{info.description}</Text>

          {/* Free limit info */}
          <View style={styles.limitBadge}>
            <Ionicons name="information-circle" size={16} color="#687076" />
            <Text style={styles.limitText}>Free tier: {info.freeLimit}</Text>
          </View>

          {/* Subscribe button */}
          <TouchableOpacity style={styles.subscribeBtn} onPress={handleSubscribe}>
            <Ionicons name="diamond" size={18} color="#fff" />
            <Text style={styles.subscribeBtnText}>Subscribe — Unlimited Access</Text>
          </TouchableOpacity>

          {/* Plans info */}
          <View style={styles.plansRow}>
            <View style={styles.planChip}>
              <Text style={styles.planChipText}>Plus $9.99/mo</Text>
            </View>
            <View style={styles.planChip}>
              <Text style={styles.planChipText}>Pro $19.99/mo</Text>
            </View>
          </View>

          {/* Single purchase option */}
          {showSinglePurchase && (
            <TouchableOpacity style={styles.singleBtn} onPress={handleSinglePurchase}>
              <Text style={styles.singleBtnText}>Just this once — {singlePrice}</Text>
            </TouchableOpacity>
          )}

          {/* Not now */}
          <TouchableOpacity style={styles.notNowBtn} onPress={onClose}>
            <Text style={styles.notNowText}>Not Now</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "flex-end",
  },
  container: {
    backgroundColor: "#151718",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 40,
    alignItems: "center",
  },
  closeBtn: {
    position: "absolute",
    top: 16,
    right: 16,
    padding: 4,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(10, 126, 164, 0.15)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    marginTop: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#ECEDEE",
    textAlign: "center",
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: "#9BA1A6",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  limitBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#1e2022",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 24,
  },
  limitText: {
    fontSize: 12,
    color: "#687076",
  },
  subscribeBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#0a7ea4",
    borderRadius: 12,
    height: 52,
    width: "100%",
    marginBottom: 12,
  },
  subscribeBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  plansRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
  },
  planChip: {
    backgroundColor: "#1e2022",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#334155",
  },
  planChipText: {
    color: "#9BA1A6",
    fontSize: 12,
    fontWeight: "500",
  },
  singleBtn: {
    borderWidth: 1,
    borderColor: "#334155",
    borderRadius: 12,
    height: 44,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  singleBtnText: {
    color: "#ECEDEE",
    fontSize: 14,
    fontWeight: "500",
  },
  notNowBtn: {
    paddingVertical: 8,
  },
  notNowText: {
    color: "#687076",
    fontSize: 13,
  },
});
