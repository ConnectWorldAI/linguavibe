import React from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import {
  getAllCreatorProfiles,
  type CreatorProfile,
} from "@/lib/viral-creator-templates";

const { width } = Dimensions.get("window");
const CARD_WIDTH = width * 0.42;

// ─── Platform Icons ─────────────────────────────────────────────────────────

function getPlatformIcon(platform: string): string {
  switch (platform) {
    case "instagram": return "logo-instagram";
    case "tiktok": return "logo-tiktok";
    case "youtube": return "logo-youtube";
    default: return "globe";
  }
}

function getFormatLabel(style: string): string {
  switch (style) {
    case "talking_head": return "Talking Head";
    case "music_mix": return "Music Mix";
    case "street_interview": return "Street Interview";
    case "reaction": return "Reaction";
    case "tutorial": return "Tutorial";
    case "montage": return "Montage";
    case "duet": return "Duet";
    default: return style;
  }
}

function formatFollowers(count: number): string {
  if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
  if (count >= 1000) return `${(count / 1000).toFixed(0)}K`;
  return count.toString();
}

// ─── Creator Card ───────────────────────────────────────────────────────────

function CreatorCard({ creator }: { creator: CreatorProfile }) {
  const gradientColors: Record<string, string> = {
    instagram: "rgba(225,48,108,0.15)",
    tiktok: "rgba(0,0,0,0.1)",
    youtube: "rgba(255,0,0,0.1)",
  };

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: gradientColors[creator.platform] || "rgba(255,255,255,0.05)" }]}
      activeOpacity={0.7}
      onPress={() => {
        router.push({
          pathname: "/creator-content-view",
          params: {
            creatorId: creator.id,
            handle: creator.handle,
            name: creator.name,
            language: creator.language,
          },
        } as any);
      }}
    >
      {/* Platform Badge */}
      <View style={styles.platformBadge}>
        <Ionicons name={getPlatformIcon(creator.platform) as any} size={14} color="#fff" />
      </View>

      {/* Avatar Placeholder */}
      <View style={styles.avatarCircle}>
        <Text style={styles.avatarText}>
          {creator.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
        </Text>
      </View>

      {/* Creator Info */}
      <Text style={styles.creatorName} numberOfLines={1}>{creator.name}</Text>
      <Text style={styles.creatorHandle} numberOfLines={1}>@{creator.handle}</Text>

      {/* Stats Row */}
      <View style={styles.statsRow}>
        <Text style={styles.followers}>{formatFollowers(creator.followers)}</Text>
        <View style={styles.dot} />
        <Text style={styles.location} numberOfLines={1}>{creator.location}</Text>
      </View>

      {/* Format Badge */}
      <View style={styles.formatBadge}>
        <Text style={styles.formatText}>{getFormatLabel(creator.format.visualStyle)}</Text>
      </View>

      {/* Signature Expression */}
      {creator.signatureExpressions.length > 0 && (
        <Text style={styles.signature} numberOfLines={2}>
          "{creator.signatureExpressions[0]}"
        </Text>
      )}

      {/* Language Tag */}
      <View style={styles.languageTag}>
        <Text style={styles.languageText}>
          {creator.language}{creator.dialect ? ` · ${creator.dialect}` : ""}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

// ─── Creator Discovery Feed ─────────────────────────────────────────────────

export function CreatorDiscoveryFeed() {
  const creators = getAllCreatorProfiles();

  return (
    <View style={styles.container}>
      {/* Section Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="people" size={20} color="#E91E63" />
          <Text style={styles.headerTitle}>Viral Creators</Text>
        </View>
        <TouchableOpacity style={styles.seeAllBtn}>
          <Text style={styles.seeAllText}>See All</Text>
          <Ionicons name="chevron-forward" size={14} color="rgba(255,255,255,0.5)" />
        </TouchableOpacity>
      </View>
      <Text style={styles.headerSubtitle}>
        Learn from the creators who make language go viral
      </Text>

      {/* Horizontal Scroll */}
      <FlatList
        data={creators}
        keyExtractor={(item) => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => <CreatorCard creator={item} />}
      />
    </View>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    marginTop: 24,
    marginBottom: 8,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    marginBottom: 4,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#fff",
  },
  headerSubtitle: {
    fontSize: 13,
    color: "rgba(255,255,255,0.5)",
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  seeAllBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  seeAllText: {
    fontSize: 13,
    color: "rgba(255,255,255,0.5)",
  },
  listContent: {
    paddingHorizontal: 12,
    gap: 10,
  },
  card: {
    width: CARD_WIDTH,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  platformBadge: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#fff",
  },
  creatorName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 2,
  },
  creatorHandle: {
    fontSize: 12,
    color: "rgba(255,255,255,0.5)",
    marginBottom: 8,
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  followers: {
    fontSize: 12,
    fontWeight: "600",
    color: "#E91E63",
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: "rgba(255,255,255,0.3)",
    marginHorizontal: 6,
  },
  location: {
    fontSize: 11,
    color: "rgba(255,255,255,0.4)",
    flex: 1,
  },
  formatBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.08)",
    marginBottom: 8,
  },
  formatText: {
    fontSize: 10,
    fontWeight: "600",
    color: "rgba(255,255,255,0.6)",
    textTransform: "uppercase",
  },
  signature: {
    fontSize: 12,
    fontStyle: "italic",
    color: "rgba(255,255,255,0.6)",
    marginBottom: 8,
    lineHeight: 16,
  },
  languageTag: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    backgroundColor: "rgba(233,30,99,0.15)",
  },
  languageText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#E91E63",
  },
});
