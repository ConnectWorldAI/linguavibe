/**
 * "What's Hot" Trending Music Carousel
 * 
 * Horizontal carousel showing viral/trending music for the user's
 * target language. Tapping a song navigates to the lyrics player
 * or auto-generated vocab lesson.
 */

import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Platform,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Colors, Spacing, BorderRadius, FontSize } from "@/constants/Colors";
import { getTrendingMusic, TrendingMusicItem } from "@/lib/viral-music-tracker";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CARD_WIDTH = SCREEN_WIDTH * 0.42;
const CARD_HEIGHT = 180;

interface WhatsHotCarouselProps {
  language?: string;
  onSongPress?: (song: TrendingMusicItem) => void;
}

export function WhatsHotCarousel({ language = "Spanish", onSongPress }: WhatsHotCarouselProps) {
  const [trending, setTrending] = useState<TrendingMusicItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    getTrendingMusic(language).then((items) => {
      if (mounted) {
        setTrending(items);
        setLoading(false);
      }
    });
    return () => { mounted = false; };
  }, [language]);

  const handleSongPress = (song: TrendingMusicItem) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    if (onSongPress) {
      onSongPress(song);
    } else {
      // Navigate to song player with this song's info
      router.push({
        pathname: "/song-player",
        params: {
          title: song.title,
          artist: song.artist,
          language: song.language,
        },
      });
    }
  };

  const handleLearnPress = (song: TrendingMusicItem) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    // Navigate to lyrics player for learning mode
    router.push({
      pathname: "/lyrics-player",
      params: {
        title: song.title,
        artist: song.artist,
        language: song.language,
        mode: "song",
      },
    });
  };

  if (loading || trending.length === 0) {
    return null; // Don't show section if no data
  }

  const renderCard = ({ item, index }: { item: TrendingMusicItem; index: number }) => {
    // Cycle through accent colors for visual variety
    const accentColors = ["#FF6B6B", "#4ECDC4", "#FFE66D", "#A78BFA", "#F472B6", "#34D399"];
    const accent = accentColors[index % accentColors.length];

    return (
      <TouchableOpacity
        style={[styles.card, { borderColor: accent + "40" }]}
        activeOpacity={0.8}
        onPress={() => handleSongPress(item)}
      >
        {/* Cover art placeholder / genre icon */}
        <View style={[styles.coverArt, { backgroundColor: accent + "15" }]}>
          <Ionicons name="musical-notes" size={28} color={accent} />
          {/* Virality badge */}
          <View style={[styles.viralBadge, { backgroundColor: accent }]}>
            <Ionicons name="flame" size={10} color="#fff" />
            <Text style={styles.viralScore}>{item.viralityScore}</Text>
          </View>
        </View>

        {/* Song info */}
        <View style={styles.cardInfo}>
          <Text style={styles.songTitle} numberOfLines={1}>{item.title}</Text>
          <Text style={styles.artistName} numberOfLines={1}>{item.artist}</Text>
          <Text style={styles.trendingReason} numberOfLines={1}>{item.trendingReason}</Text>
        </View>

        {/* CTA button */}
        <TouchableOpacity
          style={[styles.learnBtn, { backgroundColor: accent + "20", borderColor: accent + "50" }]}
          onPress={() => handleLearnPress(item)}
        >
          <Ionicons name="book-outline" size={12} color={accent} />
          <Text style={[styles.learnBtnText, { color: accent }]}>Learn</Text>
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Section header */}
      <View style={styles.sectionHeader}>
        <View style={styles.headerLeft}>
          <Ionicons name="flame" size={18} color="#FF6B6B" />
          <Text style={styles.sectionTitle}>What's Hot</Text>
        </View>
        <TouchableOpacity style={styles.seeAllBtn}>
          <Text style={styles.seeAllText}>See All</Text>
          <Ionicons name="chevron-forward" size={14} color={Colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Horizontal carousel */}
      <FlatList
        horizontal
        data={trending}
        keyExtractor={(item) => item.id}
        renderItem={renderCard}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.carousel}
        snapToInterval={CARD_WIDTH + 12}
        decelerationRate="fast"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  seeAllBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  seeAllText: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  carousel: {
    paddingHorizontal: 16,
    gap: 12,
  },
  card: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    backgroundColor: Colors.surfaceCard,
    borderRadius: 14,
    borderWidth: 1,
    overflow: "hidden",
    padding: 10,
    justifyContent: "space-between",
  },
  coverArt: {
    width: "100%",
    height: 70,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  viralBadge: {
    position: "absolute",
    top: 6,
    right: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  viralScore: {
    fontSize: 9,
    fontWeight: "700",
    color: "#fff",
  },
  cardInfo: {
    gap: 2,
  },
  songTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  artistName: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  trendingReason: {
    fontSize: 9,
    color: Colors.textMuted || Colors.textSecondary,
    fontStyle: "italic",
  },
  learnBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  learnBtnText: {
    fontSize: 11,
    fontWeight: "600",
  },
});
