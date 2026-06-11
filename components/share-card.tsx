/**
 * Social Sharing Cards
 * 
 * Generates shareable "I learned this from a song" cards that users can
 * post to Instagram Stories, driving organic installs from friends.
 */

import { useCallback } from "react";
import { View, Text, Pressable, Platform, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import * as Sharing from "expo-sharing";
import { useColors } from "@/hooks/use-colors";

// ─── Types ────────────────────────────────────────────────────────────────────

export type ShareCardType = "song_lyric" | "streak" | "new_word" | "cultural_fact";

export interface ShareCardData {
  type: ShareCardType;
  content: string;
  translation: string;
  context?: string;
  source?: string;
  language: string;
  streakCount?: number;
  wordsLearned?: number;
}

interface ShareCardProps {
  data: ShareCardData;
  onShare?: () => void;
  compact?: boolean;
}

const CARD_GRADIENTS: Record<ShareCardType, [string, string, string]> = {
  song_lyric: ["#667eea", "#764ba2", "#f093fb"],
  streak: ["#f12711", "#f5af19", "#f12711"],
  new_word: ["#11998e", "#38ef7d", "#11998e"],
  cultural_fact: ["#2193b0", "#6dd5ed", "#2193b0"],
};

const CARD_EMOJIS: Record<ShareCardType, string> = {
  song_lyric: "🎵",
  streak: "🔥",
  new_word: "📚",
  cultural_fact: "🌍",
};

const CARD_HEADERS: Record<ShareCardType, string> = {
  song_lyric: "I learned this from a song",
  streak: "Streak milestone!",
  new_word: "New word mastered",
  cultural_fact: "Cultural discovery",
};

// ─── Component ────────────────────────────────────────────────────────────────

export function ShareCard({ data, onShare, compact = false }: ShareCardProps) {
  const colors = useColors();
  const gradient = CARD_GRADIENTS[data.type];
  const emoji = CARD_EMOJIS[data.type];
  const header = CARD_HEADERS[data.type];

  const handleShare = useCallback(async () => {
    const shareText = generateShareText(data);

    if (Platform.OS === "web") {
      if (typeof navigator !== "undefined" && (navigator as any).share) {
        await (navigator as any).share({
          title: `${header} — LinguaVibe`,
          text: shareText,
        });
      }
      onShare?.();
      return;
    }

    try {
      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync("", { dialogTitle: shareText });
      }
      onShare?.();
    } catch (error) {
      console.warn("[ShareCard] Share failed:", error);
    }
  }, [data, header, onShare]);

  if (compact) {
    return (
      <Pressable
        onPress={handleShare}
        style={({ pressed }) => [
          styles.compactButton,
          pressed && { opacity: 0.8, transform: [{ scale: 0.97 }] },
        ]}
      >
        <Text style={styles.compactButtonText}>Share</Text>
      </Pressable>
    );
  }

  return (
    <View style={styles.wrapper}>
      <View style={styles.cardContainer}>
        <LinearGradient
          colors={gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradient}
        >
          <View style={styles.header}>
            <Text style={styles.emoji}>{emoji}</Text>
            <Text style={styles.headerText}>{header}</Text>
          </View>

          <View style={styles.contentArea}>
            <Text style={styles.mainContent}>{data.content}</Text>
            <Text style={styles.translation}>{data.translation}</Text>
          </View>

          {data.context && (
            <View style={styles.contextArea}>
              <Text style={styles.contextText}>
                {data.context}{data.source ? ` — ${data.source}` : ""}
              </Text>
            </View>
          )}

          {(data.streakCount || data.wordsLearned) && (
            <View style={styles.statsRow}>
              {data.streakCount ? (
                <View style={styles.statBadge}>
                  <Text style={styles.statNumber}>{data.streakCount}</Text>
                  <Text style={styles.statLabel}>day streak</Text>
                </View>
              ) : null}
              {data.wordsLearned ? (
                <View style={styles.statBadge}>
                  <Text style={styles.statNumber}>{data.wordsLearned}</Text>
                  <Text style={styles.statLabel}>words learned</Text>
                </View>
              ) : null}
            </View>
          )}

          <View style={styles.footer}>
            <Text style={styles.brandText}>LinguaVibe</Text>
            <Text style={styles.ctaText}>Learn languages through music & culture</Text>
          </View>
        </LinearGradient>
      </View>

      <Pressable
        onPress={handleShare}
        style={({ pressed }) => [
          styles.shareButton,
          pressed && { opacity: 0.8, transform: [{ scale: 0.97 }] },
        ]}
      >
        <Text style={styles.shareButtonText}>Share to Stories</Text>
      </Pressable>
    </View>
  );
}

// ─── Share Text Generator ─────────────────────────────────────────────────────

export function generateShareText(data: ShareCardData): string {
  const emoji = CARD_EMOJIS[data.type];
  const lines: string[] = [];

  lines.push(`${emoji} ${CARD_HEADERS[data.type]}`);
  lines.push("");
  lines.push(`"${data.content}"`);
  lines.push(`→ ${data.translation}`);

  if (data.context) {
    lines.push("");
    lines.push(`From: ${data.context}${data.source ? ` — ${data.source}` : ""}`);
  }

  if (data.streakCount) {
    lines.push("");
    lines.push(`🔥 ${data.streakCount}-day streak!`);
  }

  lines.push("");
  lines.push(`Learning ${data.language} on LinguaVibe`);

  return lines.join("\n");
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  wrapper: { alignItems: "center", gap: 16 },
  cardContainer: {
    width: 320,
    aspectRatio: 9 / 16,
    borderRadius: 24,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
  },
  gradient: { flex: 1, padding: 32, justifyContent: "space-between" },
  header: { alignItems: "center", gap: 8 },
  emoji: { fontSize: 48 },
  headerText: { fontSize: 18, fontWeight: "600", color: "rgba(255,255,255,0.9)", textAlign: "center", textTransform: "uppercase", letterSpacing: 1.5 },
  contentArea: { alignItems: "center", gap: 12, paddingVertical: 24 },
  mainContent: { fontSize: 32, fontWeight: "800", color: "#fff", textAlign: "center", lineHeight: 40 },
  translation: { fontSize: 18, fontWeight: "500", color: "rgba(255,255,255,0.85)", textAlign: "center", fontStyle: "italic" },
  contextArea: { alignItems: "center", paddingVertical: 12, paddingHorizontal: 16, backgroundColor: "rgba(0,0,0,0.15)", borderRadius: 12 },
  contextText: { fontSize: 14, fontWeight: "600", color: "#fff", textAlign: "center" },
  statsRow: { flexDirection: "row", justifyContent: "center", gap: 24 },
  statBadge: { alignItems: "center", backgroundColor: "rgba(255,255,255,0.2)", paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  statNumber: { fontSize: 24, fontWeight: "800", color: "#fff" },
  statLabel: { fontSize: 11, color: "rgba(255,255,255,0.8)", textTransform: "uppercase" },
  footer: { alignItems: "center", gap: 4 },
  brandText: { fontSize: 20, fontWeight: "800", color: "#fff", letterSpacing: 0.5 },
  ctaText: { fontSize: 12, color: "rgba(255,255,255,0.75)" },
  shareButton: { backgroundColor: "#000", paddingHorizontal: 32, paddingVertical: 14, borderRadius: 30 },
  shareButtonText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  compactButton: { backgroundColor: "rgba(0,0,0,0.08)", paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  compactButtonText: { fontSize: 14, fontWeight: "600", color: "#333" },
});
