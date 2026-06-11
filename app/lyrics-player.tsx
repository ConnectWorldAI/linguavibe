import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Animated,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { Colors, Spacing, BorderRadius, FontSize } from "../constants/Colors";
import * as Haptics from "expo-haptics";

const { width, height } = Dimensions.get("window");

// Synced lyrics data structure - each line has a timestamp, original text, and translation
interface LyricLine {
  id: string;
  startTime: number; // seconds
  endTime: number;
  original: string;
  translation: string;
  words?: { text: string; translatedText: string; startTime: number; endTime: number }[];
}

// Demo song data - Despacito (Spanish → English)
const DEMO_LYRICS: LyricLine[] = [
  { id: "1", startTime: 0, endTime: 4, original: "Despacito", translation: "Slowly" },
  { id: "2", startTime: 4, endTime: 8, original: "Quiero respirar tu cuello despacito", translation: "I want to breathe your neck slowly" },
  { id: "3", startTime: 8, endTime: 12, original: "Deja que te diga cosas al oído", translation: "Let me whisper things in your ear" },
  { id: "4", startTime: 12, endTime: 16, original: "Para que te acuerdes si no estás conmigo", translation: "So you remember when you're not with me" },
  { id: "5", startTime: 16, endTime: 20, original: "Despacito", translation: "Slowly" },
  { id: "6", startTime: 20, endTime: 25, original: "Quiero desnudarte a besos despacito", translation: "I want to undress you with kisses slowly" },
  { id: "7", startTime: 25, endTime: 30, original: "Firmar las paredes de tu laberinto", translation: "Sign the walls of your labyrinth" },
  { id: "8", startTime: 30, endTime: 35, original: "Y hacer de tu cuerpo todo un manuscrito", translation: "And make your whole body a manuscript" },
  { id: "9", startTime: 35, endTime: 40, original: "Sube, sube, sube", translation: "Go up, go up, go up" },
  { id: "10", startTime: 40, endTime: 45, original: "Sube, sube", translation: "Go up, go up" },
  { id: "11", startTime: 45, endTime: 50, original: "Quiero ver bailar tu pelo", translation: "I want to see your hair dance" },
  { id: "12", startTime: 50, endTime: 55, original: "Quiero ser tu ritmo", translation: "I want to be your rhythm" },
  { id: "13", startTime: 55, endTime: 60, original: "Que le enseñes a mi boca", translation: "That you teach my mouth" },
  { id: "14", startTime: 60, endTime: 65, original: "Tus lugares favoritos", translation: "Your favorite places" },
  { id: "15", startTime: 65, endTime: 70, original: "Déjame sobrepasar tus zonas de peligro", translation: "Let me surpass your danger zones" },
  { id: "16", startTime: 70, endTime: 75, original: "Hasta provocar tus gritos", translation: "Until I provoke your screams" },
  { id: "17", startTime: 75, endTime: 80, original: "Y que olvides tu apellido", translation: "And you forget your last name" },
];

// Demo entertainment content - French movie subtitles
const MOVIE_LYRICS: LyricLine[] = [
  { id: "m1", startTime: 0, endTime: 3, original: "Bonjour, comment allez-vous?", translation: "Hello, how are you?" },
  { id: "m2", startTime: 3, endTime: 6, original: "Je suis très bien, merci.", translation: "I am very well, thank you." },
  { id: "m3", startTime: 6, endTime: 10, original: "Avez-vous vu le nouveau film?", translation: "Have you seen the new movie?" },
  { id: "m4", startTime: 10, endTime: 14, original: "Oui, c'était magnifique!", translation: "Yes, it was magnificent!" },
  { id: "m5", startTime: 14, endTime: 18, original: "Les acteurs étaient incroyables.", translation: "The actors were incredible." },
  { id: "m6", startTime: 18, endTime: 22, original: "Surtout la scène finale.", translation: "Especially the final scene." },
  { id: "m7", startTime: 22, endTime: 26, original: "Je voudrais le revoir demain.", translation: "I would like to see it again tomorrow." },
  { id: "m8", startTime: 26, endTime: 30, original: "On pourrait y aller ensemble.", translation: "We could go together." },
];

type DisplayMode = "dual" | "original_only" | "translation_only";

export default function LyricsPlayerScreen() {
  const params = useLocalSearchParams<{
    title?: string;
    artist?: string;
    language?: string;
    targetLanguage?: string;
    mode?: string; // "song" | "entertainment"
  }>();

  const title = params.title || "Despacito";
  const artist = params.artist || "Luis Fonsi ft. Daddy Yankee";
  const sourceLanguage = params.language || "Spanish";
  const targetLanguage = params.targetLanguage || "English";
  const contentMode = params.mode || "song";

  const lyrics = contentMode === "entertainment" ? MOVIE_LYRICS : DEMO_LYRICS;

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [activeLine, setActiveLine] = useState(0);
  const [displayMode, setDisplayMode] = useState<DisplayMode>("dual");
  const [showWordByWord, setShowWordByWord] = useState(false);

  const scrollRef = useRef<ScrollView>(null);
  const fadeAnims = useRef(lyrics.map(() => new Animated.Value(0.4))).current;
  const scaleAnims = useRef(lyrics.map(() => new Animated.Value(1))).current;
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Simulate playback timer
  useEffect(() => {
    if (isPlaying) {
      timerRef.current = setInterval(() => {
        setCurrentTime((prev) => {
          const next = prev + 0.1;
          const totalDuration = lyrics[lyrics.length - 1].endTime;
          if (next >= totalDuration) {
            setIsPlaying(false);
            return 0;
          }
          return next;
        });
      }, 100);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying]);

  // Update active line based on current time
  useEffect(() => {
    const newActive = lyrics.findIndex(
      (line) => currentTime >= line.startTime && currentTime < line.endTime
    );
    if (newActive !== -1 && newActive !== activeLine) {
      setActiveLine(newActive);
      if (Platform.OS !== "web") {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }

      // Animate the active line
      lyrics.forEach((_, i) => {
        Animated.timing(fadeAnims[i], {
          toValue: i === newActive ? 1 : i === newActive - 1 || i === newActive + 1 ? 0.6 : 0.3,
          duration: 300,
          useNativeDriver: true,
        }).start();
        Animated.timing(scaleAnims[i], {
          toValue: i === newActive ? 1.05 : 1,
          duration: 200,
          useNativeDriver: true,
        }).start();
      });

      // Auto-scroll to keep active line centered
      const lineHeight = 100;
      const scrollTarget = Math.max(0, newActive * lineHeight - height * 0.3);
      scrollRef.current?.scrollTo({ y: scrollTarget, animated: true });
    }
  }, [currentTime]);

  const togglePlay = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    setIsPlaying(!isPlaying);
  };

  const seekTo = (time: number) => {
    setCurrentTime(time);
  };

  const totalDuration = lyrics[lyrics.length - 1].endTime;
  const progress = currentTime / totalDuration;

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Blurred background gradient effect */}
      <View style={styles.backgroundGradient} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
          <Ionicons name="chevron-down" size={28} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerSubtitle}>
            {contentMode === "entertainment" ? "SUBTITLES" : "LYRICS"}
          </Text>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {title}
          </Text>
        </View>
        <TouchableOpacity style={styles.headerBtn}>
          <Ionicons name="ellipsis-horizontal" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Song/Content Info */}
      <View style={styles.infoBar}>
        <View style={styles.albumThumb}>
          <Ionicons
            name={contentMode === "entertainment" ? "film" : "musical-notes"}
            size={20}
            color={Colors.secondary}
          />
        </View>
        <View style={styles.infoText}>
          <Text style={styles.infoTitle} numberOfLines={1}>{title}</Text>
          <Text style={styles.infoArtist}>{artist}</Text>
        </View>
        <TouchableOpacity style={styles.favBtn}>
          <Ionicons name="star-outline" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Language Toggle Bar */}
      <View style={styles.languageBar}>
        <TouchableOpacity
          style={[styles.langBtn, displayMode === "dual" && styles.langBtnActive]}
          onPress={() => setDisplayMode("dual")}
        >
          <Text style={[styles.langBtnText, displayMode === "dual" && styles.langBtnTextActive]}>
            Both
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.langBtn, displayMode === "original_only" && styles.langBtnActive]}
          onPress={() => setDisplayMode("original_only")}
        >
          <Text style={[styles.langBtnText, displayMode === "original_only" && styles.langBtnTextActive]}>
            {sourceLanguage}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.langBtn, displayMode === "translation_only" && styles.langBtnActive]}
          onPress={() => setDisplayMode("translation_only")}
        >
          <Text style={[styles.langBtnText, displayMode === "translation_only" && styles.langBtnTextActive]}>
            {targetLanguage}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Synced Lyrics Display */}
      <ScrollView
        ref={scrollRef}
        style={styles.lyricsScroll}
        contentContainerStyle={styles.lyricsContent}
        showsVerticalScrollIndicator={false}
      >
        {lyrics.map((line, index) => {
          const isActive = index === activeLine;
          const isPast = currentTime > line.endTime;
          const isFuture = currentTime < line.startTime;

          return (
            <Animated.View
              key={line.id}
              style={[
                styles.lyricLineContainer,
                {
                  opacity: fadeAnims[index],
                  transform: [{ scale: scaleAnims[index] }],
                },
              ]}
            >
              <TouchableOpacity
                onPress={() => seekTo(line.startTime)}
                activeOpacity={0.7}
                style={styles.lyricTouchable}
              >
                {/* Original Language */}
                {(displayMode === "dual" || displayMode === "original_only") && (
                  <Text
                    style={[
                      styles.lyricOriginal,
                      isActive && styles.lyricOriginalActive,
                      isPast && styles.lyricPast,
                    ]}
                  >
                    {line.original}
                  </Text>
                )}

                {/* Translation */}
                {(displayMode === "dual" || displayMode === "translation_only") && (
                  <Text
                    style={[
                      styles.lyricTranslation,
                      isActive && styles.lyricTranslationActive,
                      isPast && styles.lyricTranslationPast,
                      displayMode === "translation_only" && styles.lyricTranslationLarge,
                    ]}
                  >
                    {line.translation}
                  </Text>
                )}
              </TouchableOpacity>
            </Animated.View>
          );
        })}
        <View style={{ height: height * 0.3 }} />
      </ScrollView>

      {/* Bottom Controls */}
      <View style={styles.bottomControls}>
        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
            <View style={[styles.progressDot, { left: `${progress * 100}%` }]} />
          </View>
          <View style={styles.timeRow}>
            <Text style={styles.timeText}>{formatTime(currentTime)}</Text>
            <Text style={styles.timeText}>{formatTime(totalDuration)}</Text>
          </View>
        </View>

        {/* Playback Controls */}
        <View style={styles.controls}>
          <TouchableOpacity onPress={() => seekTo(Math.max(0, currentTime - 10))}>
            <Ionicons name="play-back" size={24} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => seekTo(Math.max(0, currentTime - 5))}>
            <Ionicons name="play-skip-back" size={28} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.playButton} onPress={togglePlay}>
            <Ionicons name={isPlaying ? "pause" : "play"} size={32} color="#000" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => seekTo(Math.min(totalDuration, currentTime + 5))}>
            <Ionicons name="play-skip-forward" size={28} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => seekTo(Math.min(totalDuration, currentTime + 10))}>
            <Ionicons name="play-forward" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Language indicator */}
        <View style={styles.langIndicator}>
          <View style={styles.langDot} />
          <Text style={styles.langIndicatorText}>
            {sourceLanguage} → {targetLanguage}
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0A0A0F",
  },
  backgroundGradient: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#0A0A0F",
    // In production this would be a blurred album art background
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  headerBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
  },
  headerSubtitle: {
    fontSize: 10,
    fontWeight: "700",
    color: "rgba(255,255,255,0.5)",
    letterSpacing: 1.5,
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
    marginTop: 2,
  },
  infoBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 12,
  },
  albumThumb: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(0,170,255,0.3)",
  },
  infoText: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#fff",
  },
  infoArtist: {
    fontSize: 12,
    color: "rgba(255,255,255,0.6)",
    marginTop: 2,
  },
  favBtn: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  languageBar: {
    flexDirection: "row",
    marginHorizontal: 20,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 10,
    padding: 3,
    marginBottom: 8,
  },
  langBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: "center",
    borderRadius: 8,
  },
  langBtnActive: {
    backgroundColor: "rgba(0,170,255,0.2)",
    borderWidth: 1,
    borderColor: "rgba(0,170,255,0.4)",
  },
  langBtnText: {
    fontSize: 12,
    fontWeight: "600",
    color: "rgba(255,255,255,0.5)",
  },
  langBtnTextActive: {
    color: "#00AAFF",
  },
  lyricsScroll: {
    flex: 1,
  },
  lyricsContent: {
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  lyricLineContainer: {
    marginBottom: 24,
  },
  lyricTouchable: {
    paddingVertical: 4,
  },
  lyricOriginal: {
    fontSize: 22,
    fontWeight: "700",
    color: "rgba(255,255,255,0.35)",
    lineHeight: 30,
  },
  lyricOriginalActive: {
    color: "#FFFFFF",
    textShadowColor: "rgba(0,170,255,0.4)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  lyricPast: {
    color: "rgba(255,255,255,0.25)",
  },
  lyricTranslation: {
    fontSize: 15,
    fontWeight: "500",
    color: "rgba(0,170,255,0.4)",
    marginTop: 4,
    lineHeight: 22,
  },
  lyricTranslationActive: {
    color: "#00AAFF",
    textShadowColor: "rgba(0,170,255,0.3)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  lyricTranslationPast: {
    color: "rgba(0,170,255,0.2)",
  },
  lyricTranslationLarge: {
    fontSize: 22,
    fontWeight: "700",
    lineHeight: 30,
  },
  bottomControls: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: "rgba(10,10,15,0.95)",
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.05)",
  },
  progressContainer: {
    paddingTop: 16,
  },
  progressBar: {
    height: 3,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 2,
    position: "relative",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#00AAFF",
    borderRadius: 2,
    shadowColor: "#00AAFF",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 4,
  },
  progressDot: {
    position: "absolute",
    top: -4,
    width: 11,
    height: 11,
    borderRadius: 6,
    backgroundColor: "#fff",
    marginLeft: -5,
    shadowColor: "#00AAFF",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 4,
  },
  timeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 6,
  },
  timeText: {
    fontSize: 11,
    color: "rgba(255,255,255,0.4)",
    fontVariant: ["tabular-nums"],
  },
  controls: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 28,
    paddingVertical: 16,
  },
  playButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#00AAFF",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  langIndicator: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingBottom: 4,
  },
  langDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#00AAFF",
    shadowColor: "#00AAFF",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 4,
  },
  langIndicatorText: {
    fontSize: 11,
    fontWeight: "600",
    color: "rgba(255,255,255,0.5)",
  },
});
