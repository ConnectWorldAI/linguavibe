import { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
} from "react-native-reanimated";
import { createAudioPlayer, setAudioModeAsync } from "expo-audio";
import type { AudioPlayer } from "expo-audio";
import { Colors, Spacing, BorderRadius, FontSize } from "../constants/Colors";
import { trpc } from "@/lib/trpc";

// ─── Types ──────────────────────────────────────────────────────────────────
interface CloneSong {
  id: string;
  title: string;
  artist: string;
  language: string;
  flag: string;
  difficulty: "easy" | "medium" | "hard";
  duration: string;
  genre: string;
  coverGradient: [string, string];
  previewUrl?: string; // 5-second voice quality preview URL
}

interface CloneResult {
  songId: string;
  timestamp: number;
  status: "processing" | "ready" | "failed";
  previewPlaying: boolean;
}

// ─── Data ───────────────────────────────────────────────────────────────────
const CLONE_SONGS: CloneSong[] = [
  { id: "1", title: "Despacito", artist: "Luis Fonsi", language: "Spanish", flag: "🇪🇸", difficulty: "medium", duration: "3:47", genre: "Pop", coverGradient: ["#FF6B6B", "#EE5A24"], previewUrl: "preview" },
  { id: "2", title: "La Vie en Rose", artist: "Édith Piaf", language: "French", flag: "🇫🇷", difficulty: "easy", duration: "3:22", genre: "Classic", coverGradient: ["#EC4899", "#BE185D"], previewUrl: "preview" },
  { id: "3", title: "Sakura", artist: "Ikimono-gakari", language: "Japanese", flag: "🇯🇵", difficulty: "hard", duration: "4:15", genre: "J-Pop", coverGradient: ["#F472B6", "#DB2777"], previewUrl: "preview" },
  { id: "4", title: "Gangnam Style", artist: "PSY", language: "Korean", flag: "🇰🇷", difficulty: "hard", duration: "3:39", genre: "K-Pop", coverGradient: ["#60A5FA", "#2563EB"], previewUrl: "preview" },
  { id: "5", title: "Con Te Partirò", artist: "Andrea Bocelli", language: "Italian", flag: "🇮🇹", difficulty: "medium", duration: "4:05", genre: "Opera", coverGradient: ["#34D399", "#059669"], previewUrl: "preview" },
  { id: "6", title: "99 Luftballons", artist: "Nena", language: "German", flag: "🇩🇪", difficulty: "medium", duration: "3:54", genre: "Pop", coverGradient: ["#FBBF24", "#D97706"], previewUrl: "preview" },
  { id: "7", title: "Bésame Mucho", artist: "Consuelo Velázquez", language: "Spanish", flag: "🇲🇽", difficulty: "easy", duration: "3:10", genre: "Bolero", coverGradient: ["#F87171", "#DC2626"], previewUrl: "preview" },
  { id: "8", title: "Garota de Ipanema", artist: "Tom Jobim", language: "Portuguese", flag: "🇧🇷", difficulty: "medium", duration: "5:24", genre: "Bossa Nova", coverGradient: ["#4ADE80", "#16A34A"], previewUrl: "preview" },
];

const VOICE_PROFILES = [
  { id: "natural", name: "Natural", description: "Your voice as-is", icon: "person" },
  { id: "smooth", name: "Smooth", description: "Polished, studio quality", icon: "sparkles" },
  { id: "powerful", name: "Powerful", description: "More projection & resonance", icon: "flash" },
];

// ─── Dialect Voice Options ─────────────────────────────────────────────────
interface DialectOption {
  id: string;
  label: string;
  flag: string;
  description: string;
}

const DIALECT_OPTIONS: Record<string, DialectOption[]> = {
  Spanish: [
    { id: "es-mx", label: "Mexican", flag: "🇲🇽", description: "Warm, melodic tone" },
    { id: "es-co", label: "Colombian", flag: "🇨🇴", description: "Clear, neutral accent" },
    { id: "es-do", label: "Dominican", flag: "🇩🇴", description: "Fast Caribbean style" },
    { id: "es-ar", label: "Argentine", flag: "🇦🇷", description: "Rioplatense flair" },
    { id: "es-pr", label: "Puerto Rican", flag: "🇵🇷", description: "Caribbean with slang" },
    { id: "es-cu", label: "Cuban", flag: "🇨🇺", description: "Rhythmic Caribbean" },
    { id: "es-es", label: "Castilian", flag: "🇪🇸", description: "European standard" },
  ],
  French: [
    { id: "fr-fr", label: "Parisian", flag: "🇫🇷", description: "Standard French" },
    { id: "fr-ca", label: "Québécois", flag: "🇨🇦", description: "Canadian French" },
    { id: "fr-ht", label: "Haitian", flag: "🇭🇹", description: "Creole-influenced" },
  ],
  Portuguese: [
    { id: "pt-br", label: "Brazilian", flag: "🇧🇷", description: "Warm, open sound" },
    { id: "pt-pt", label: "European", flag: "🇵🇹", description: "Lisbon standard" },
  ],
  German: [
    { id: "de-de", label: "Standard", flag: "🇩🇪", description: "Hochdeutsch" },
    { id: "de-at", label: "Austrian", flag: "🇦🇹", description: "Viennese style" },
    { id: "de-ch", label: "Swiss", flag: "🇨🇭", description: "Swiss dialect" },
  ],
  Italian: [
    { id: "it-standard", label: "Standard", flag: "🇮🇹", description: "Florentine-based" },
    { id: "it-south", label: "Southern", flag: "🇮🇹", description: "Neapolitan flair" },
  ],
  Japanese: [
    { id: "ja-standard", label: "Standard", flag: "🇯🇵", description: "Tokyo dialect" },
    { id: "ja-kansai", label: "Kansai", flag: "🇯🇵", description: "Osaka/Kyoto" },
  ],
  Korean: [
    { id: "ko-standard", label: "Standard", flag: "🇰🇷", description: "Seoul dialect" },
    { id: "ko-busan", label: "Busan", flag: "🇰🇷", description: "Gyeongsang accent" },
  ],
};

const STORAGE_KEY = "@voice_clone_results";

export default function VoiceCloneStudioScreen() {
  const [voiceReady, setVoiceReady] = useState(false);
  const [selectedSong, setSelectedSong] = useState<CloneSong | null>(null);
  const [selectedProfile, setSelectedProfile] = useState("natural");
  const [results, setResults] = useState<CloneResult[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [playingResult, setPlayingResult] = useState<string | null>(null);
  const [filterLanguage, setFilterLanguage] = useState<string | null>(null);
  const [selectedDialect, setSelectedDialect] = useState<string | null>(null);

  // Voice Preview State
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewPlaying, setPreviewPlaying] = useState(false);
  const [previewSongId, setPreviewSongId] = useState<string | null>(null);
  const previewPlayerRef = useRef<AudioPlayer | null>(null);
  const previewTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Animated waveform
  const waveAnim = useSharedValue(0);

  useEffect(() => {
    checkVoiceReady();
    loadResults();
    // Enable audio in silent mode
    if (Platform.OS !== "web") {
      setAudioModeAsync({ playsInSilentMode: true }).catch(() => {});
    }
    return () => {
      // Cleanup preview player on unmount
      stopPreview();
    };
  }, []);

  useEffect(() => {
    if (isGenerating) {
      waveAnim.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 600, easing: Easing.inOut(Easing.ease) }),
          withTiming(0, { duration: 600, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        false
      );
    }
  }, [isGenerating]);

  const waveStyle = useAnimatedStyle(() => ({
    opacity: 0.5 + waveAnim.value * 0.5,
  }));

  const checkVoiceReady = async () => {
    try {
      const stored = await AsyncStorage.getItem("@voice_clone_complete");
      setVoiceReady(stored === "true");
    } catch {
      setVoiceReady(false);
    }
  };

  const loadResults = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) setResults(JSON.parse(stored));
    } catch {}
  };

  const saveResults = async (newResults: CloneResult[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newResults));
    } catch {}
  };

  // ─── Voice Quality Preview (Real Backend TTS) ─────────────────────────────
  const ttsMutation = trpc.translate.tts.useMutation();
  const previewCacheRef = useRef<Record<string, string>>({});

  const handlePreview = async (song: CloneSong) => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // If already playing this song's preview, stop it
    if (previewPlaying && previewSongId === song.id) {
      stopPreview();
      return;
    }

    // Stop any existing preview
    stopPreview();

    setPreviewLoading(true);
    setPreviewSongId(song.id);

    try {
      // Check cache first
      let audioUrl = previewCacheRef.current[song.id];

      if (!audioUrl) {
        // Generate a 5-second voice quality sample via backend TTS
        // Use dialect-specific language code if selected
        const langMap: Record<string, string> = { Spanish: "es", French: "fr", Portuguese: "pt", German: "de", Italian: "it", Japanese: "ja", Korean: "ko" };
        const baseLang = langMap[song.language] || "en";
        const dialectCode = selectedDialect || baseLang;
        const dialectLabel = DIALECT_OPTIONS[song.language]?.find(d => d.id === selectedDialect)?.label || song.language;
        const previewText = `This is a preview of how your voice will sound singing ${song.title} by ${song.artist} in ${dialectLabel}. Your cloned voice will match this quality.`;
        const result = await ttsMutation.mutateAsync({
          text: previewText,
          language: dialectCode,
        });
        audioUrl = result.audioUrl;
        if (audioUrl) {
          previewCacheRef.current[song.id] = audioUrl;
        }
      }

      if (!audioUrl) {
        throw new Error("No audio URL returned");
      }

      // Play the audio preview
      setPreviewLoading(false);
      setPreviewPlaying(true);

      const player = createAudioPlayer(audioUrl);
      previewPlayerRef.current = player;
      player.play();

      // Auto-stop after 5 seconds (preview limit)
      previewTimeoutRef.current = setTimeout(() => {
        stopPreview();
        if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }, 5000);
    } catch (error) {
      // Fallback: show brief visual feedback if TTS fails
      setPreviewLoading(false);
      setPreviewPlaying(true);
      previewTimeoutRef.current = setTimeout(() => {
        setPreviewPlaying(false);
        setPreviewSongId(null);
      }, 2000);
    }
  };

  const stopPreview = () => {
    if (previewPlayerRef.current) {
      try {
        previewPlayerRef.current.pause();
        previewPlayerRef.current.remove();
      } catch {}
      previewPlayerRef.current = null;
    }
    if (previewTimeoutRef.current) {
      clearTimeout(previewTimeoutRef.current);
      previewTimeoutRef.current = null;
    }
    setPreviewPlaying(false);
    setPreviewLoading(false);
    setPreviewSongId(null);
  };

  // ─── Full Generation ──────────────────────────────────────────────────────
  const handleGenerate = async () => {
    if (!selectedSong) return;
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    // Stop any preview playing
    stopPreview();
    
    setIsGenerating(true);
    setGenerationProgress(0);

    // Simulate AI generation process
    const interval = setInterval(() => {
      setGenerationProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + Math.random() * 8 + 2;
      });
    }, 300);

    // Simulate completion after ~8 seconds
    setTimeout(() => {
      clearInterval(interval);
      setGenerationProgress(100);
      setIsGenerating(false);

      const newResult: CloneResult = {
        songId: selectedSong.id,
        timestamp: Date.now(),
        status: "ready",
        previewPlaying: false,
      };
      const updated = [newResult, ...results];
      setResults(updated);
      saveResults(updated);
      
      if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }, 8000);
  };

  const handlePlayResult = (songId: string) => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (playingResult === songId) {
      setPlayingResult(null);
    } else {
      setPlayingResult(songId);
      // Simulate playback for 5 seconds
      setTimeout(() => setPlayingResult(null), 5000);
    }
  };

  const languages = [...new Set(CLONE_SONGS.map((s) => s.language))];
  const filteredSongs = filterLanguage
    ? CLONE_SONGS.filter((s) => s.language === filterLanguage)
    : CLONE_SONGS;

  const getDifficultyColor = (d: string) => {
    switch (d) {
      case "easy": return Colors.success;
      case "medium": return Colors.gold;
      case "hard": return Colors.accent;
      default: return Colors.textSecondary;
    }
  };

  // If voice not trained yet
  if (!voiceReady) {
    return (
      <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.headerBtn} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Voice Clone Studio</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.emptyState}>
          <View style={styles.emptyIcon}>
            <Ionicons name="mic-off" size={48} color={Colors.textSecondary} />
          </View>
          <Text style={styles.emptyTitle}>Train Your Voice First</Text>
          <Text style={styles.emptySubtitle}>
            Record 2 minutes of your voice so our AI can learn your unique vocal characteristics.
            Then you'll be able to hear yourself sing in any language!
          </Text>
          <TouchableOpacity
            style={styles.trainBtn}
            onPress={() => router.push("/voice-clone-training" as any)}
            activeOpacity={0.8}
          >
            <Ionicons name="mic" size={20} color="#fff" />
            <Text style={styles.trainBtnText}>Start Voice Training</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.skipBtn}
            onPress={() => {
              setVoiceReady(true);
              AsyncStorage.setItem("@voice_clone_complete", "true");
            }}
          >
            <Text style={styles.skipBtnText}>Skip (use demo voice)</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Voice Clone Studio</Text>
        <TouchableOpacity style={styles.headerBtn} onPress={() => router.push("/voice-clone-training" as any)}>
          <Ionicons name="settings-outline" size={20} color={Colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Hero */}
        <View style={styles.heroCard}>
          <View style={styles.heroIconRow}>
            <View style={styles.heroIconCircle}>
              <Ionicons name="mic" size={24} color={Colors.secondary} />
            </View>
            <Ionicons name="arrow-forward" size={16} color={Colors.textSecondary} />
            <View style={styles.heroIconCircle}>
              <Ionicons name="musical-notes" size={24} color={Colors.gold} />
            </View>
            <Ionicons name="arrow-forward" size={16} color={Colors.textSecondary} />
            <View style={styles.heroIconCircle}>
              <Ionicons name="globe" size={24} color={Colors.success} />
            </View>
          </View>
          <Text style={styles.heroTitle}>Hear Yourself Sing in Any Language</Text>
          <Text style={styles.heroSubtitle}>
            AI transforms your voice to sing songs in languages you're learning — same voice, new language!
          </Text>
        </View>

        {/* Voice Profile */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Voice Style</Text>
          <View style={styles.profileRow}>
            {VOICE_PROFILES.map((p) => (
              <TouchableOpacity
                key={p.id}
                style={[styles.profileCard, selectedProfile === p.id && styles.profileCardActive]}
                onPress={() => {
                  setSelectedProfile(p.id);
                  if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
                activeOpacity={0.7}
              >
                <Ionicons name={p.icon as any} size={20} color={selectedProfile === p.id ? Colors.secondary : Colors.textSecondary} />
                <Text style={[styles.profileName, selectedProfile === p.id && styles.profileNameActive]}>{p.name}</Text>
                <Text style={styles.profileDesc}>{p.description}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Dialect/Accent Selection */}
        {selectedSong && DIALECT_OPTIONS[selectedSong.language] && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Dialect / Accent</Text>
            <Text style={styles.dialectSubtitle}>
              Hear how your clone sounds in different {selectedSong.language} accents
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dialectRow}>
              {DIALECT_OPTIONS[selectedSong.language].map((dialect) => {
                const isActive = selectedDialect === dialect.id;
                return (
                  <TouchableOpacity
                    key={dialect.id}
                    style={[styles.dialectChip, isActive && styles.dialectChipActive]}
                    onPress={() => {
                      setSelectedDialect(isActive ? null : dialect.id);
                      // Clear preview cache when dialect changes so next preview uses new dialect
                      if (selectedSong) {
                        delete previewCacheRef.current[selectedSong.id];
                      }
                      if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.dialectFlag}>{dialect.flag}</Text>
                    <Text style={[styles.dialectLabel, isActive && styles.dialectLabelActive]}>
                      {dialect.label}
                    </Text>
                    {isActive && (
                      <Ionicons name="checkmark-circle" size={14} color={Colors.secondary} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
            {selectedDialect && (
              <View style={styles.dialectInfoBanner}>
                <Ionicons name="language" size={14} color={Colors.gold} />
                <Text style={styles.dialectInfoText}>
                  {DIALECT_OPTIONS[selectedSong.language]?.find(d => d.id === selectedDialect)?.description} — tap Preview to hear the difference
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Song Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Choose a Song</Text>
          
          {/* Language Filter */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
            <TouchableOpacity
              style={[styles.filterChip, !filterLanguage && styles.filterChipActive]}
              onPress={() => setFilterLanguage(null)}
            >
              <Text style={[styles.filterChipText, !filterLanguage && styles.filterChipTextActive]}>All</Text>
            </TouchableOpacity>
            {languages.map((lang) => (
              <TouchableOpacity
                key={lang}
                style={[styles.filterChip, filterLanguage === lang && styles.filterChipActive]}
                onPress={() => setFilterLanguage(lang)}
              >
                <Text style={[styles.filterChipText, filterLanguage === lang && styles.filterChipTextActive]}>{lang}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Song List */}
          {filteredSongs.map((song) => {
            const isThisPreviewPlaying = previewPlaying && previewSongId === song.id;
            const isThisPreviewLoading = previewLoading && previewSongId === song.id;

            return (
              <TouchableOpacity
                key={song.id}
                style={[styles.songCard, selectedSong?.id === song.id && styles.songCardActive]}
                onPress={() => {
                  setSelectedSong(song);
                  if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
                activeOpacity={0.7}
              >
                <View style={[styles.songCover, { backgroundColor: song.coverGradient[0] }]}>
                  <Ionicons name="musical-notes" size={18} color="#fff" />
                </View>
                <View style={styles.songInfo}>
                  <Text style={styles.songTitle} numberOfLines={1}>{song.title}</Text>
                  <Text style={styles.songArtist} numberOfLines={1}>{song.artist}</Text>
                  <View style={styles.songMeta}>
                    <Text style={styles.songFlag}>{song.flag}</Text>
                    <Text style={[styles.songDifficulty, { color: getDifficultyColor(song.difficulty) }]}>
                      {song.difficulty}
                    </Text>
                    <Text style={styles.songDuration}>{song.duration}</Text>
                  </View>
                </View>

                {/* Voice Preview Button */}
                {song.previewUrl && (
                  <TouchableOpacity
                    style={[
                      styles.previewBtn,
                      isThisPreviewPlaying && styles.previewBtnActive,
                    ]}
                    onPress={(e) => {
                      e.stopPropagation?.();
                      handlePreview(song);
                    }}
                    activeOpacity={0.7}
                  >
                    {isThisPreviewLoading ? (
                      <Ionicons name="hourglass" size={14} color={Colors.gold} />
                    ) : isThisPreviewPlaying ? (
                      <Ionicons name="stop" size={14} color={Colors.secondary} />
                    ) : (
                      <Ionicons name="ear" size={14} color={Colors.textSecondary} />
                    )}
                  </TouchableOpacity>
                )}

                {selectedSong?.id === song.id && (
                  <Ionicons name="checkmark-circle" size={22} color={Colors.secondary} />
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Voice Preview Info Banner */}
        {previewPlaying && previewSongId && (
          <View style={styles.previewBanner}>
            <View style={styles.previewBannerLeft}>
              <Ionicons name="ear" size={16} color={Colors.secondary} />
              <Text style={styles.previewBannerText}>
                Playing 5s voice preview...
              </Text>
            </View>
            <View style={styles.previewWaveform}>
              {[...Array(8)].map((_, i) => (
                <View
                  key={i}
                  style={[
                    styles.previewWaveBar,
                    { height: 4 + Math.sin(Date.now() / 200 + i) * 8 },
                  ]}
                />
              ))}
            </View>
            <TouchableOpacity onPress={stopPreview} style={styles.previewStopBtn}>
              <Ionicons name="close-circle" size={18} color={Colors.accent} />
            </TouchableOpacity>
          </View>
        )}

        {/* Generate Button */}
        {selectedSong && (
          <View style={styles.generateSection}>
            {isGenerating ? (
              <View style={styles.generatingCard}>
                <Animated.View style={[styles.generatingWave, waveStyle]}>
                  <View style={styles.waveRow}>
                    {[...Array(12)].map((_, i) => (
                      <View
                        key={i}
                        style={[
                          styles.waveBar,
                          { height: 8 + Math.sin(i * 0.8 + generationProgress * 0.05) * 16 },
                        ]}
                      />
                    ))}
                  </View>
                </Animated.View>
                <Text style={styles.generatingTitle}>Creating Your Version...</Text>
                <Text style={styles.generatingSubtitle}>
                  AI is synthesizing your voice singing "{selectedSong.title}" in {selectedSong.language}
                </Text>
                <View style={styles.progressBar}>
                  <View style={[styles.progressFill, { width: `${Math.min(generationProgress, 100)}%` }]} />
                </View>
                <Text style={styles.progressText}>{Math.min(Math.round(generationProgress), 100)}%</Text>
              </View>
            ) : (
              <View style={styles.generateBtnRow}>
                {/* Preview button before generating */}
                <TouchableOpacity
                  style={styles.previewBeforeGenBtn}
                  onPress={() => handlePreview(selectedSong)}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name={previewPlaying && previewSongId === selectedSong.id ? "stop" : "ear"}
                    size={18}
                    color={Colors.secondary}
                  />
                  <Text style={styles.previewBeforeGenText}>
                    {previewPlaying && previewSongId === selectedSong.id ? "Stop" : "Preview"}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.generateBtn} onPress={handleGenerate} activeOpacity={0.8}>
                  <Ionicons name="sparkles" size={20} color="#fff" />
                  <Text style={styles.generateBtnText}>Generate Full Song</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        {/* Results */}
        {results.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>My Recordings</Text>
            {results.map((result, idx) => {
              const song = CLONE_SONGS.find((s) => s.id === result.songId);
              if (!song) return null;
              const isPlaying = playingResult === result.songId;
              return (
                <View key={idx} style={styles.resultCard}>
                  <View style={[styles.resultCover, { backgroundColor: song.coverGradient[0] }]}>
                    <Ionicons name={isPlaying ? "pause" : "play"} size={16} color="#fff" />
                  </View>
                  <View style={styles.resultInfo}>
                    <Text style={styles.resultTitle}>{song.title}</Text>
                    <Text style={styles.resultMeta}>
                      {song.flag} {song.language} • {new Date(result.timestamp).toLocaleDateString()}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.resultPlayBtn}
                    onPress={() => handlePlayResult(result.songId)}
                  >
                    <Ionicons name={isPlaying ? "pause-circle" : "play-circle"} size={32} color={Colors.secondary} />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.resultShareBtn}>
                    <Ionicons name="share-outline" size={18} color={Colors.textSecondary} />
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        )}

        {/* Info Card */}
        <View style={styles.infoCard}>
          <Ionicons name="information-circle-outline" size={18} color={Colors.secondary} />
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>How It Works</Text>
            <Text style={styles.infoText}>
              1. We analyze your voice from training recordings{"\n"}
              2. Tap the ear icon to hear a 5-second quality preview{"\n"}
              3. AI synthesizes your voice singing in the target language{"\n"}
              4. The original beat and melody are preserved
            </Text>
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.primary },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm },
  headerBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.surfaceCard, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: Colors.border },
  headerTitle: { fontSize: FontSize.lg, fontWeight: "700", color: Colors.textPrimary },
  scrollContent: { paddingHorizontal: Spacing.md },
  // Empty state
  emptyState: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32 },
  emptyIcon: { width: 80, height: 80, borderRadius: 40, backgroundColor: Colors.surfaceCard, alignItems: "center", justifyContent: "center", marginBottom: 16, borderWidth: 1, borderColor: Colors.border },
  emptyTitle: { fontSize: FontSize.xl, fontWeight: "700", color: Colors.textPrimary, marginBottom: 8 },
  emptySubtitle: { fontSize: FontSize.sm, color: Colors.textSecondary, textAlign: "center", lineHeight: 20, marginBottom: 24 },
  trainBtn: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 24, paddingVertical: 14, backgroundColor: Colors.secondary, borderRadius: BorderRadius.full },
  trainBtnText: { fontSize: FontSize.md, fontWeight: "600", color: "#fff" },
  skipBtn: { marginTop: 12, paddingVertical: 8 },
  skipBtnText: { fontSize: FontSize.sm, color: Colors.textSecondary },
  // Hero
  heroCard: { padding: Spacing.lg, backgroundColor: Colors.surfaceCard, borderRadius: BorderRadius.lg, borderWidth: 1, borderColor: Colors.border, marginBottom: 20, alignItems: "center" },
  heroIconRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 },
  heroIconCircle: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.primary, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: Colors.border },
  heroTitle: { fontSize: FontSize.lg, fontWeight: "700", color: Colors.textPrimary, textAlign: "center", marginBottom: 6 },
  heroSubtitle: { fontSize: FontSize.sm, color: Colors.textSecondary, textAlign: "center", lineHeight: 20 },
  // Section
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: FontSize.lg, fontWeight: "700", color: Colors.textPrimary, marginBottom: 12 },
  // Voice profile
  profileRow: { flexDirection: "row", gap: 8 },
  profileCard: { flex: 1, alignItems: "center", padding: 12, borderRadius: BorderRadius.md, backgroundColor: Colors.surfaceCard, borderWidth: 1, borderColor: Colors.border, gap: 4 },
  profileCardActive: { borderColor: Colors.secondary, backgroundColor: Colors.secondary + "10" },
  profileName: { fontSize: 12, fontWeight: "600", color: Colors.textSecondary },
  profileNameActive: { color: Colors.secondary },
  profileDesc: { fontSize: 10, color: Colors.textMuted, textAlign: "center" },
  // Filter
  filterRow: { marginBottom: 12 },
  filterChip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: BorderRadius.full, backgroundColor: Colors.surfaceCard, borderWidth: 1, borderColor: Colors.border, marginRight: 8 },
  filterChipActive: { backgroundColor: Colors.secondary + "20", borderColor: Colors.secondary },
  filterChipText: { fontSize: 12, fontWeight: "500", color: Colors.textSecondary },
  filterChipTextActive: { color: Colors.secondary },
  // Song card
  songCard: { flexDirection: "row", alignItems: "center", gap: 12, padding: 12, borderRadius: BorderRadius.md, backgroundColor: Colors.surfaceCard, borderWidth: 1, borderColor: Colors.border, marginBottom: 8 },
  songCardActive: { borderColor: Colors.secondary, backgroundColor: Colors.secondary + "08" },
  songCover: { width: 44, height: 44, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  songInfo: { flex: 1 },
  songTitle: { fontSize: FontSize.sm, fontWeight: "600", color: Colors.textPrimary },
  songArtist: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  songMeta: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 4 },
  songFlag: { fontSize: 12 },
  songDifficulty: { fontSize: 10, fontWeight: "600", textTransform: "uppercase" },
  songDuration: { fontSize: 10, color: Colors.textMuted },
  // Preview button on song card
  previewBtn: { width: 30, height: 30, borderRadius: 15, backgroundColor: Colors.primary, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: Colors.border, marginRight: 4 },
  previewBtnActive: { borderColor: Colors.secondary, backgroundColor: Colors.secondary + "15" },
  // Preview banner
  previewBanner: { flexDirection: "row", alignItems: "center", padding: 12, borderRadius: BorderRadius.md, backgroundColor: Colors.secondary + "12", borderWidth: 1, borderColor: Colors.secondary + "40", marginBottom: 16, gap: 8 },
  previewBannerLeft: { flexDirection: "row", alignItems: "center", gap: 6, flex: 1 },
  previewBannerText: { fontSize: 12, fontWeight: "600", color: Colors.secondary },
  previewWaveform: { flexDirection: "row", alignItems: "center", gap: 2 },
  previewWaveBar: { width: 3, backgroundColor: Colors.secondary, borderRadius: 2 },
  previewStopBtn: { padding: 4 },
  // Generate
  generateSection: { marginBottom: 24 },
  generateBtnRow: { flexDirection: "row", gap: 10, alignItems: "center" },
  previewBeforeGenBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingVertical: 14, paddingHorizontal: 16, borderRadius: BorderRadius.lg, borderWidth: 1, borderColor: Colors.secondary + "50", backgroundColor: Colors.secondary + "10" },
  previewBeforeGenText: { fontSize: FontSize.sm, fontWeight: "600", color: Colors.secondary },
  generateBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 16, backgroundColor: Colors.secondary, borderRadius: BorderRadius.lg },
  generateBtnText: { fontSize: FontSize.md, fontWeight: "700", color: "#fff" },
  generatingCard: { padding: Spacing.lg, backgroundColor: Colors.surfaceCard, borderRadius: BorderRadius.lg, borderWidth: 1, borderColor: Colors.secondary + "30", alignItems: "center" },
  generatingWave: { marginBottom: 12 },
  waveRow: { flexDirection: "row", alignItems: "center", gap: 3, height: 32 },
  waveBar: { width: 4, backgroundColor: Colors.secondary, borderRadius: 2 },
  generatingTitle: { fontSize: FontSize.md, fontWeight: "700", color: Colors.textPrimary, marginBottom: 4 },
  generatingSubtitle: { fontSize: 12, color: Colors.textSecondary, textAlign: "center", lineHeight: 18, marginBottom: 12 },
  progressBar: { width: "100%", height: 4, backgroundColor: Colors.primary, borderRadius: 2, overflow: "hidden" },
  progressFill: { height: "100%", backgroundColor: Colors.secondary, borderRadius: 2 },
  progressText: { fontSize: 12, color: Colors.secondary, fontWeight: "600", marginTop: 6 },
  // Results
  resultCard: { flexDirection: "row", alignItems: "center", gap: 10, padding: 10, borderRadius: BorderRadius.md, backgroundColor: Colors.surfaceCard, borderWidth: 1, borderColor: Colors.border, marginBottom: 8 },
  resultCover: { width: 36, height: 36, borderRadius: 6, alignItems: "center", justifyContent: "center" },
  resultInfo: { flex: 1 },
  resultTitle: { fontSize: FontSize.sm, fontWeight: "600", color: Colors.textPrimary },
  resultMeta: { fontSize: 11, color: Colors.textSecondary, marginTop: 2 },
  resultPlayBtn: { padding: 4 },
  resultShareBtn: { padding: 6 },
  // Info
  infoCard: { flexDirection: "row", gap: 10, padding: Spacing.md, backgroundColor: Colors.surfaceCard, borderRadius: BorderRadius.lg, borderWidth: 1, borderColor: Colors.secondary + "30" },
  infoContent: { flex: 1 },
  infoTitle: { fontSize: FontSize.sm, fontWeight: "600", color: Colors.secondary, marginBottom: 4 },
  infoText: { fontSize: 12, color: Colors.textSecondary, lineHeight: 20 },
  // Dialect selection
  dialectSubtitle: { fontSize: 12, color: Colors.textSecondary, marginBottom: 10, lineHeight: 18 },
  dialectRow: { marginBottom: 10 },
  dialectChip: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: BorderRadius.full, backgroundColor: Colors.surfaceCard, borderWidth: 1, borderColor: Colors.border, marginRight: 8 },
  dialectChipActive: { borderColor: Colors.secondary, backgroundColor: Colors.secondary + "15" },
  dialectFlag: { fontSize: 16 },
  dialectLabel: { fontSize: 12, fontWeight: "600", color: Colors.textSecondary },
  dialectLabelActive: { color: Colors.secondary },
  dialectInfoBanner: { flexDirection: "row", alignItems: "center", gap: 6, padding: 10, borderRadius: BorderRadius.md, backgroundColor: Colors.gold + "12", borderWidth: 1, borderColor: Colors.gold + "30", marginTop: 4 },
  dialectInfoText: { fontSize: 11, color: Colors.gold, flex: 1, lineHeight: 16 },
});
