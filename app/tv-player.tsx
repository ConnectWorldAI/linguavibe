import React, { useState, useCallback, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  FlatList,
  Platform,
  ActivityIndicator,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import * as Haptics from "expo-haptics";
import { Colors, Spacing, BorderRadius, FontSize } from "../constants/Colors";
import { useContentShare } from "@/hooks/use-content-share";
import { ContentItem } from "@/lib/deep-links";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

// ─── TYPES ───────────────────────────────────────────────────────────────────
type SubtitleMode = "dual" | "target" | "none";

interface PlayerEpisode {
  id: string;
  number: number;
  title: string;
  seriesTitle: string;
  seriesId: string;
  duration: string;
  description: string;
  vocabCount: number;
  language: string;
  difficulty: string;
  subtitles: SubtitleLine[];
  isLocked: boolean;
}

interface SubtitleLine {
  id: string;
  startTime: number; // seconds
  endTime: number;
  targetText: string; // text in target language
  nativeText: string; // text in native language
  phonetic?: string; // phonetic pronunciation (Omar-style)
}

// ─── SAMPLE EPISODE DATA (would come from API/state in production) ───────────
const SAMPLE_EPISODES: PlayerEpisode[] = [
  {
    id: "ga-1",
    number: 1,
    title: "Abuela Lands in Tokyo",
    seriesTitle: "Granny Abroad",
    seriesId: "granny-abroad",
    duration: "1:15",
    description: "Rosa arrives in Japan and immediately gets lost in Shibuya. Her Dominican confidence meets Japanese politeness.",
    vocabCount: 8,
    language: "Japanese",
    difficulty: "Mixed",
    isLocked: false,
    subtitles: [
      { id: "s1", startTime: 0, endTime: 4, targetText: "すみません、渋谷はどこですか？", nativeText: "Excuse me, where is Shibuya?", phonetic: "(su-mi-ma-sen, shi-bu-ya wa do-ko des-ka)" },
      { id: "s2", startTime: 4, endTime: 8, targetText: "あの、この道をまっすぐ行ってください", nativeText: "Um, please go straight on this road", phonetic: "(a-no, ko-no mi-chi wo mas-su-gu it-te ku-da-sai)" },
      { id: "s3", startTime: 8, endTime: 12, targetText: "ありがとうございます！", nativeText: "Thank you so much!", phonetic: "(a-ri-ga-tou go-zai-mas)" },
      { id: "s4", startTime: 12, endTime: 16, targetText: "いいえ、どういたしまして", nativeText: "No problem, you're welcome", phonetic: "(i-i-e, dou-i-ta-shi-ma-shi-te)" },
      { id: "s5", startTime: 16, endTime: 20, targetText: "あれ？迷子になっちゃった…", nativeText: "Huh? I got lost...", phonetic: "(a-re? ma-i-go ni nat-chat-ta)" },
    ],
  },
  {
    id: "ga-2",
    number: 2,
    title: "The Ramen Incident",
    seriesTitle: "Granny Abroad",
    seriesId: "granny-abroad",
    duration: "1:22",
    description: "Rosa tries to order ramen but accidentally insults the chef. Cultural clash comedy at its finest.",
    vocabCount: 9,
    language: "Japanese",
    difficulty: "Mixed",
    isLocked: false,
    subtitles: [
      { id: "s1", startTime: 0, endTime: 4, targetText: "ラーメンを一つください", nativeText: "One ramen please", phonetic: "(ra-a-men wo hi-to-tsu ku-da-sai)" },
      { id: "s2", startTime: 4, endTime: 8, targetText: "辛いのが好きですか？", nativeText: "Do you like spicy?", phonetic: "(ka-rai no ga su-ki des-ka)" },
      { id: "s3", startTime: 8, endTime: 12, targetText: "もちろん！私はドミニカ人よ！", nativeText: "Of course! I'm Dominican!", phonetic: "(mo-chi-ron! wa-ta-shi wa do-mi-ni-ka-jin yo)" },
      { id: "s4", startTime: 12, endTime: 16, targetText: "これは…すごく辛い！", nativeText: "This is... extremely spicy!", phonetic: "(ko-re wa... su-go-ku ka-rai)" },
    ],
  },
  {
    id: "tc-1",
    number: 1,
    title: "Opening Day",
    seriesTitle: "The Colmado",
    seriesId: "the-colmado",
    duration: "1:20",
    description: "Don Julio opens the colmado. Meet the neighborhood characters.",
    vocabCount: 12,
    language: "Spanish (Dominican)",
    difficulty: "Intermediate",
    isLocked: false,
    subtitles: [
      { id: "s1", startTime: 0, endTime: 4, targetText: "¡Bueno, ya abrimo'! ¡Lleguen, lleguen!", nativeText: "Alright, we're open! Come in, come in!", phonetic: "(bwe-no, ya a-bri-mo! ye-gen, ye-gen)" },
      { id: "s2", startTime: 4, endTime: 8, targetText: "¿Qué lo que, Don Julio? ¿Cómo amaneció?", nativeText: "What's up, Don Julio? How'd you wake up?", phonetic: "(ke lo ke, don hu-lio? ko-mo a-ma-ne-sio)" },
      { id: "s3", startTime: 8, endTime: 12, targetText: "Aquí, en la lucha. ¿Qué va a llevar?", nativeText: "Here, hustling. What are you gonna get?", phonetic: "(a-ki, en la lu-cha. ke va a ye-var)" },
      { id: "s4", startTime: 12, endTime: 16, targetText: "Dame un fiao hasta el viernes", nativeText: "Give me credit until Friday", phonetic: "(da-me un fi-ao as-ta el vi-er-nes)" },
      { id: "s5", startTime: 16, endTime: 20, targetText: "¡Ay no! Aquí no se fía. Cash o nada.", nativeText: "Oh no! No credit here. Cash or nothing.", phonetic: "(ai no! a-ki no se fi-a. cash o na-da)" },
    ],
  },
  {
    id: "tc-2",
    number: 2,
    title: "El Fiado",
    seriesTitle: "The Colmado",
    seriesId: "the-colmado",
    duration: "1:35",
    description: "Everyone wants credit. Don Julio's patience is tested.",
    vocabCount: 14,
    language: "Spanish (Dominican)",
    difficulty: "Intermediate",
    isLocked: false,
    subtitles: [
      { id: "s1", startTime: 0, endTime: 4, targetText: "Don Julio, apúntame eso ahí", nativeText: "Don Julio, put that on my tab", phonetic: "(don hu-lio, a-pun-ta-me e-so a-i)" },
      { id: "s2", startTime: 4, endTime: 8, targetText: "Tú me debe' desde el mes pasao'", nativeText: "You owe me since last month", phonetic: "(tu me de-be des-de el mes pa-sao)" },
      { id: "s3", startTime: 8, endTime: 12, targetText: "Te juro que el viernes te pago", nativeText: "I swear I'll pay you Friday", phonetic: "(te hu-ro ke el vi-er-nes te pa-go)" },
      { id: "s4", startTime: 12, endTime: 16, targetText: "Eso mismo dijiste la semana pasada", nativeText: "That's exactly what you said last week", phonetic: "(e-so mis-mo di-his-te la se-ma-na pa-sa-da)" },
    ],
  },
  {
    id: "lit-1",
    number: 1,
    title: "Day One",
    seriesTitle: "Lost in Translation",
    seriesId: "lost-in-translation",
    duration: "1:30",
    description: "Jordan arrives in Bogotá. Nothing goes as planned.",
    vocabCount: 6,
    language: "Spanish (Colombian)",
    difficulty: "Beginner",
    isLocked: false,
    subtitles: [
      { id: "s1", startTime: 0, endTime: 4, targetText: "¡Bienvenido a Bogotá, parcero!", nativeText: "Welcome to Bogotá, buddy!", phonetic: "(bi-en-ve-ni-do a bo-go-ta, par-se-ro)" },
      { id: "s2", startTime: 4, endTime: 8, targetText: "¿Primera vez en Colombia?", nativeText: "First time in Colombia?", phonetic: "(pri-me-ra ves en ko-lom-bia)" },
      { id: "s3", startTime: 8, endTime: 12, targetText: "Sí… no entiendo nada", nativeText: "Yes... I don't understand anything", phonetic: "(si... no en-ti-en-do na-da)" },
      { id: "s4", startTime: 12, endTime: 16, targetText: "Tranquilo, aquí todos te ayudamos", nativeText: "Relax, everyone here will help you", phonetic: "(tran-ki-lo, a-ki to-dos te a-yu-da-mos)" },
    ],
  },
];

// ─── MAIN PLAYER COMPONENT ──────────────────────────────────────────────────
export default function TVPlayerScreen() {
  const params = useLocalSearchParams<{ seriesId?: string; episodeId?: string }>();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [subtitleMode, setSubtitleMode] = useState<SubtitleMode>("dual");
  const [isPlaying, setIsPlaying] = useState(true);
  const [currentSubtitleIndex, setCurrentSubtitleIndex] = useState(0);
  const [playbackTime, setPlaybackTime] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [showVocab, setShowVocab] = useState(false);
  const [liked, setLiked] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const controlsTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { openShareSheet, ShareSheet } = useContentShare();

  // Filter episodes based on params
  const episodes = params.seriesId
    ? SAMPLE_EPISODES.filter((e) => e.seriesId === params.seriesId)
    : SAMPLE_EPISODES;

  const currentEpisode = episodes[currentIndex];

  // Auto-advance subtitle based on playback time
  useEffect(() => {
    if (!isPlaying || !currentEpisode) return;

    const interval = setInterval(() => {
      setPlaybackTime((prev) => {
        const next = prev + 1;
        // Find current subtitle
        const subIdx = currentEpisode.subtitles.findIndex(
          (s) => next >= s.startTime && next < s.endTime
        );
        if (subIdx !== -1) setCurrentSubtitleIndex(subIdx);
        return next;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isPlaying, currentIndex]);

  // Auto-hide controls after 3 seconds
  useEffect(() => {
    if (showControls) {
      if (controlsTimeout.current) clearTimeout(controlsTimeout.current);
      controlsTimeout.current = setTimeout(() => {
        setShowControls(false);
      }, 4000);
    }
    return () => {
      if (controlsTimeout.current) clearTimeout(controlsTimeout.current);
    };
  }, [showControls]);

  const handleTapScreen = () => {
    setShowControls(!showControls);
  };

  const handleSwipeToNext = useCallback(
    (index: number) => {
      if (index !== currentIndex) {
        setCurrentIndex(index);
        setPlaybackTime(0);
        setCurrentSubtitleIndex(0);
        setLiked(false);
        setBookmarked(false);
        if (Platform.OS !== "web") {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        }
      }
    },
    [currentIndex]
  );

  const handleShare = () => {
    if (!currentEpisode) return;
    const content: ContentItem = {
      id: currentEpisode.id,
      type: "video",
      title: `${currentEpisode.seriesTitle} - Ep ${currentEpisode.number}: ${currentEpisode.title}`,
      description: currentEpisode.description,
      authorName: "ConnectWorld AI TV",
      language: currentEpisode.language,
    };
    openShareSheet(content);
  };

  const handleLike = () => {
    setLiked(!liked);
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handleBookmark = () => {
    setBookmarked(!bookmarked);
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handleSubtitleCycle = () => {
    const modes: SubtitleMode[] = ["dual", "target", "none"];
    const nextIdx = (modes.indexOf(subtitleMode) + 1) % modes.length;
    setSubtitleMode(modes[nextIdx]);
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handleNextEpisode = () => {
    if (currentIndex < episodes.length - 1) {
      const nextIdx = currentIndex + 1;
      setCurrentIndex(nextIdx);
      setPlaybackTime(0);
      setCurrentSubtitleIndex(0);
      flatListRef.current?.scrollToIndex({ index: nextIdx, animated: true });
      if (Platform.OS !== "web") {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
    }
  };

  const handlePrevEpisode = () => {
    if (currentIndex > 0) {
      const prevIdx = currentIndex - 1;
      setCurrentIndex(prevIdx);
      setPlaybackTime(0);
      setCurrentSubtitleIndex(0);
      flatListRef.current?.scrollToIndex({ index: prevIdx, animated: true });
      if (Platform.OS !== "web") {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
    }
  };

  // ─── RENDER EPISODE SLIDE ─────────────────────────────────────────────────
  const renderEpisodeSlide = ({ item, index }: { item: PlayerEpisode; index: number }) => {
    const isActive = index === currentIndex;
    const currentSub = isActive ? item.subtitles[currentSubtitleIndex] : null;

    return (
      <TouchableOpacity
        activeOpacity={1}
        onPress={handleTapScreen}
        style={styles.episodeSlide}
      >
        {/* Video Background (placeholder — would be expo-video in production) */}
        <View style={styles.videoBackground}>
          {/* Gradient overlay for readability */}
          <View style={styles.gradientTop} />
          <View style={styles.gradientBottom} />

          {/* AI-generated scene placeholder */}
          <View style={styles.sceneContainer}>
            <View style={styles.sceneIcon}>
              <Ionicons name="videocam" size={48} color={Colors.secondary} />
            </View>
            {isActive && isPlaying && (
              <View style={styles.playingIndicator}>
                <View style={[styles.playingBar, { height: 12 }]} />
                <View style={[styles.playingBar, { height: 20 }]} />
                <View style={[styles.playingBar, { height: 16 }]} />
                <View style={[styles.playingBar, { height: 24 }]} />
                <View style={[styles.playingBar, { height: 14 }]} />
              </View>
            )}
          </View>
        </View>

        {/* Subtitle Overlay */}
        {subtitleMode !== "none" && currentSub && isActive && (
          <View style={styles.subtitleOverlay}>
            {/* Target language text */}
            <View style={styles.subtitleTargetContainer}>
              <Text style={styles.subtitleTargetText}>{currentSub.targetText}</Text>
            </View>

            {/* Phonetic pronunciation (Omar-style) */}
            {currentSub.phonetic && subtitleMode === "dual" && (
              <Text style={styles.subtitlePhonetic}>{currentSub.phonetic}</Text>
            )}

            {/* Native language translation */}
            {subtitleMode === "dual" && (
              <View style={styles.subtitleNativeContainer}>
                <Text style={styles.subtitleNativeText}>{currentSub.nativeText}</Text>
              </View>
            )}
          </View>
        )}

        {/* Episode Info (bottom) */}
        <View style={styles.episodeInfoOverlay}>
          <View style={styles.episodeInfoLeft}>
            <View style={styles.seriesBadge}>
              <Text style={styles.seriesBadgeText}>{item.seriesTitle}</Text>
            </View>
            <Text style={styles.episodeTitleText}>
              Ep {item.number}: {item.title}
            </Text>
            <Text style={styles.episodeDescText} numberOfLines={2}>
              {item.description}
            </Text>
            <View style={styles.episodeMetaRow}>
              <View style={styles.metaChip}>
                <Ionicons name="globe-outline" size={10} color={Colors.textSecondary} />
                <Text style={styles.metaChipText}>{item.language}</Text>
              </View>
              <View style={styles.metaChip}>
                <Ionicons name="book-outline" size={10} color={Colors.textSecondary} />
                <Text style={styles.metaChipText}>{item.vocabCount} words</Text>
              </View>
              <View style={styles.metaChip}>
                <Ionicons name="time-outline" size={10} color={Colors.textSecondary} />
                <Text style={styles.metaChipText}>{item.duration}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Right Side Actions (TikTok-style) */}
        <View style={styles.rightActions}>
          <TouchableOpacity style={styles.actionBtn} onPress={handleLike}>
            <Ionicons
              name={liked ? "heart" : "heart-outline"}
              size={28}
              color={liked ? "#FF2D55" : Colors.textPrimary}
            />
            <Text style={styles.actionLabel}>Like</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionBtn} onPress={handleBookmark}>
            <Ionicons
              name={bookmarked ? "bookmark" : "bookmark-outline"}
              size={26}
              color={bookmarked ? Colors.gold : Colors.textPrimary}
            />
            <Text style={styles.actionLabel}>Save</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionBtn} onPress={handleShare}>
            <Ionicons name="paper-plane-outline" size={26} color={Colors.textPrimary} />
            <Text style={styles.actionLabel}>Share</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionBtn} onPress={handleSubtitleCycle}>
            <Ionicons
              name={subtitleMode === "none" ? "text-outline" : "text"}
              size={24}
              color={subtitleMode === "none" ? Colors.textSecondary : Colors.secondary}
            />
            <Text style={styles.actionLabel}>
              {subtitleMode === "dual" ? "Dual" : subtitleMode === "target" ? "Target" : "Off"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionBtn} onPress={() => setShowVocab(!showVocab)}>
            <Ionicons name="school-outline" size={24} color={Colors.textPrimary} />
            <Text style={styles.actionLabel}>Vocab</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" hidden={!showControls} />

      {/* Full-screen swipeable episode list */}
      <FlatList
        ref={flatListRef}
        data={episodes}
        keyExtractor={(item) => item.id}
        renderItem={renderEpisodeSlide}
        pagingEnabled
        horizontal={false}
        showsVerticalScrollIndicator={false}
        snapToInterval={SCREEN_HEIGHT}
        decelerationRate="fast"
        onMomentumScrollEnd={(e) => {
          const index = Math.round(e.nativeEvent.contentOffset.y / SCREEN_HEIGHT);
          handleSwipeToNext(index);
        }}
        getItemLayout={(_, index) => ({
          length: SCREEN_HEIGHT,
          offset: SCREEN_HEIGHT * index,
          index,
        })}
      />

      {/* Top Controls (visible when tapped) */}
      {showControls && (
        <SafeAreaView style={styles.topControls} edges={["top"]}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>

          <View style={styles.topCenter}>
            <Text style={styles.topTitle}>ConnectWorld AI TV</Text>
            <Text style={styles.topSubtitle}>
              {currentIndex + 1} / {episodes.length}
            </Text>
          </View>

          <TouchableOpacity style={styles.settingsButton}>
            <Ionicons name="ellipsis-vertical" size={20} color={Colors.textPrimary} />
          </TouchableOpacity>
        </SafeAreaView>
      )}

      {/* Center Playback Controls (visible when tapped) */}
      {showControls && (
        <View style={styles.centerControls}>
          <TouchableOpacity style={styles.skipBtn} onPress={handlePrevEpisode}>
            <Ionicons name="play-back" size={28} color={Colors.textPrimary} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.mainPlayBtn} onPress={handlePlayPause}>
            <Ionicons
              name={isPlaying ? "pause" : "play"}
              size={40}
              color={Colors.textPrimary}
            />
          </TouchableOpacity>

          <TouchableOpacity style={styles.skipBtn} onPress={handleNextEpisode}>
            <Ionicons name="play-forward" size={28} color={Colors.textPrimary} />
          </TouchableOpacity>
        </View>
      )}

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressFill,
              {
                width: currentEpisode
                  ? `${Math.min((playbackTime / (currentEpisode.subtitles.length * 4)) * 100, 100)}%`
                  : "0%",
              },
            ]}
          />
        </View>
        {/* Subtitle dots */}
        {currentEpisode?.subtitles.map((_, idx) => (
          <View
            key={idx}
            style={[
              styles.subtitleDot,
              {
                left: `${((idx * 4) / (currentEpisode.subtitles.length * 4)) * 100}%`,
              },
              idx <= currentSubtitleIndex && styles.subtitleDotActive,
            ]}
          />
        ))}
      </View>

      {/* Vocabulary Panel (slides up) */}
      {showVocab && currentEpisode && (
        <View style={styles.vocabPanel}>
          <View style={styles.vocabHeader}>
            <Text style={styles.vocabTitle}>Vocabulary ({currentEpisode.vocabCount} words)</Text>
            <TouchableOpacity onPress={() => setShowVocab(false)}>
              <Ionicons name="close-circle" size={24} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>
          {currentEpisode.subtitles.slice(0, 5).map((sub, idx) => (
            <View key={sub.id} style={styles.vocabRow}>
              <View style={styles.vocabLeft}>
                <Text style={styles.vocabTarget}>{sub.targetText}</Text>
                {sub.phonetic && (
                  <Text style={styles.vocabPhonetic}>{sub.phonetic}</Text>
                )}
              </View>
              <Text style={styles.vocabNative}>{sub.nativeText}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Share Sheet */}
      {ShareSheet}
    </View>
  );
}

// ─── STYLES ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
  },
  episodeSlide: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    position: "relative",
  },

  // Video Background
  videoBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  gradientTop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 120,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  gradientBottom: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 250,
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  sceneContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  sceneIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(0, 170, 255, 0.1)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.glowBorder,
  },
  playingIndicator: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 3,
    marginTop: 16,
  },
  playingBar: {
    width: 4,
    borderRadius: 2,
    backgroundColor: Colors.secondary,
    opacity: 0.8,
  },

  // Subtitle Overlay
  subtitleOverlay: {
    position: "absolute",
    bottom: 260,
    left: 16,
    right: 70,
    alignItems: "center",
    gap: 6,
  },
  subtitleTargetContainer: {
    backgroundColor: "rgba(0, 0, 0, 0.75)",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(0, 170, 255, 0.3)",
  },
  subtitleTargetText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
    textAlign: "center",
    lineHeight: 26,
  },
  subtitlePhonetic: {
    fontSize: 13,
    color: Colors.gold,
    fontStyle: "italic",
    textAlign: "center",
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
  },
  subtitleNativeContainer: {
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  subtitleNativeText: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.85)",
    textAlign: "center",
    lineHeight: 20,
  },

  // Episode Info Overlay
  episodeInfoOverlay: {
    position: "absolute",
    bottom: 80,
    left: 16,
    right: 70,
  },
  episodeInfoLeft: {
    gap: 6,
  },
  seriesBadge: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(0, 170, 255, 0.2)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "rgba(0, 170, 255, 0.4)",
  },
  seriesBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: Colors.secondary,
    letterSpacing: 0.5,
  },
  episodeTitleText: {
    fontSize: 16,
    fontWeight: "800",
    color: "#FFFFFF",
    lineHeight: 22,
  },
  episodeDescText: {
    fontSize: 13,
    color: "rgba(255, 255, 255, 0.7)",
    lineHeight: 18,
  },
  episodeMetaRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 4,
  },
  metaChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
  },
  metaChipText: {
    fontSize: 10,
    color: Colors.textSecondary,
  },

  // Right Side Actions (TikTok-style)
  rightActions: {
    position: "absolute",
    right: 12,
    bottom: 160,
    alignItems: "center",
    gap: 20,
  },
  actionBtn: {
    alignItems: "center",
    gap: 4,
  },
  actionLabel: {
    fontSize: 10,
    color: "rgba(255, 255, 255, 0.8)",
    fontWeight: "600",
  },

  // Top Controls
  topControls: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 8,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  topCenter: {
    alignItems: "center",
  },
  topTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  topSubtitle: {
    fontSize: 11,
    color: "rgba(255, 255, 255, 0.6)",
  },
  settingsButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },

  // Center Playback Controls
  centerControls: {
    position: "absolute",
    top: "45%",
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 40,
  },
  skipBtn: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
  mainPlayBtn: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },

  // Progress Bar
  progressContainer: {
    position: "absolute",
    bottom: 60,
    left: 16,
    right: 70,
    height: 3,
  },
  progressTrack: {
    height: 3,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 1.5,
    overflow: "hidden",
  },
  progressFill: {
    height: 3,
    backgroundColor: Colors.secondary,
    borderRadius: 1.5,
  },
  subtitleDot: {
    position: "absolute",
    top: -2,
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
  },
  subtitleDotActive: {
    backgroundColor: Colors.gold,
  },

  // Vocabulary Panel
  vocabPanel: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(4, 8, 16, 0.95)",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
    maxHeight: SCREEN_HEIGHT * 0.45,
    borderTopWidth: 1,
    borderColor: Colors.glowBorder,
  },
  vocabHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  vocabTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  vocabRow: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0, 170, 255, 0.1)",
  },
  vocabLeft: {
    marginBottom: 4,
  },
  vocabTarget: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.textPrimary,
    lineHeight: 22,
  },
  vocabPhonetic: {
    fontSize: 12,
    color: Colors.gold,
    fontStyle: "italic",
    marginTop: 2,
  },
  vocabNative: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
});
