/**
 * Song Translation Studio
 * 
 * Translate any song into your target language while keeping the same key/melody.
 * Three voice output modes:
 * 1. Voice Clone — Train AI on your voice, it sings the translated version
 * 2. Record Yourself — Karaoke-style studio, sing over the instrumental
 * 3. AI Voice Swap — Choose an AI singer voice to perform the translated song
 * 
 * Reference: Boyz II Men-style translations (same melody, different language)
 */

import { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  FlatList,
  Modal,
  Alert,
  Platform,
  Dimensions,
  ActivityIndicator,
  Share,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import * as Haptics from "expo-haptics";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
  FadeIn,
  FadeInDown,
  FadeInUp,
} from "react-native-reanimated";
import { trpc } from "@/lib/trpc";
import AsyncStorage from "@react-native-async-storage/async-storage";

const { width } = Dimensions.get("window");

// ─── Theme ─────────────────────────────────────────────────────────────────
const C = {
  bg: "#0A0E1A",
  surface: "#141825",
  surfaceElevated: "#1C2235",
  accent: "#00AAFF",
  accentGlow: "rgba(0,170,255,0.15)",
  gold: "#FFD700",
  success: "#00E676",
  error: "#FF5252",
  warning: "#FF9F43",
  text: "#FFFFFF",
  textSecondary: "#8A9BB0",
  textMuted: "#5A6A7A",
  border: "rgba(255,255,255,0.06)",
  purple: "#8B5CF6",
  pink: "#EC4899",
  orange: "#F97316",
};

// ─── Types ─────────────────────────────────────────────────────────────────
type VoiceMode = "clone" | "record" | "ai_voice";
type StudioStep = "input" | "configure" | "voice_setup" | "processing" | "result";

interface AIVoice {
  id: string;
  name: string;
  description: string;
  gender: "male" | "female";
  style: string;
  icon: string;
}

interface TranslationJob {
  jobId: string;
  status: string;
  progress: number;
  stage: string;
}

// ─── Data ──────────────────────────────────────────────────────────────────
const SUPPORTED_LANGUAGES = [
  { code: "es", name: "Spanish", flag: "🇪🇸" },
  { code: "en", name: "English", flag: "🇺🇸" },
  { code: "fr", name: "French", flag: "🇫🇷" },
  { code: "de", name: "German", flag: "🇩🇪" },
  { code: "pt", name: "Portuguese", flag: "🇧🇷" },
  { code: "ja", name: "Japanese", flag: "🇯🇵" },
  { code: "ko", name: "Korean", flag: "🇰🇷" },
  { code: "it", name: "Italian", flag: "🇮🇹" },
  { code: "zh", name: "Mandarin", flag: "🇨🇳" },
  { code: "ar", name: "Arabic", flag: "🇸🇦" },
  { code: "hi", name: "Hindi", flag: "🇮🇳" },
  { code: "tr", name: "Turkish", flag: "🇹🇷" },
];

const AI_VOICES: AIVoice[] = [
  { id: "bella", name: "Bella", description: "Warm, soulful female", gender: "female", style: "R&B / Soul", icon: "woman" },
  { id: "adam", name: "Adam", description: "Deep, smooth male", gender: "male", style: "Pop / Ballad", icon: "man" },
  { id: "aria", name: "Aria", description: "Bright, energetic female", gender: "female", style: "Pop / Dance", icon: "woman" },
  { id: "marcus", name: "Marcus", description: "Rich baritone male", gender: "male", style: "R&B / Gospel", icon: "man" },
  { id: "luna", name: "Luna", description: "Ethereal, soft female", gender: "female", style: "Indie / Folk", icon: "woman" },
  { id: "kai", name: "Kai", description: "Versatile tenor male", gender: "male", style: "Pop / Rock", icon: "man" },
  { id: "sofia", name: "Sofia", description: "Passionate, powerful female", gender: "female", style: "Latin / Pop", icon: "woman" },
  { id: "drake", name: "Drake", description: "Smooth, rhythmic male", gender: "male", style: "Hip-Hop / R&B", icon: "man" },
];

const VOICE_MODE_INFO = {
  clone: {
    title: "Voice Clone",
    subtitle: "AI sings in YOUR voice",
    icon: "finger-print" as const,
    color: C.purple,
    description: "Record 30-60 seconds of yourself singing. Our AI learns your vocal characteristics and performs the translated song in your voice.",
    tier: "Pro",
  },
  record: {
    title: "Record Yourself",
    subtitle: "Karaoke-style studio",
    icon: "mic" as const,
    color: C.accent,
    description: "Sing the translated lyrics yourself over the original instrumental. Dual-language lyrics scroll in real-time to guide you.",
    tier: "Plus",
  },
  ai_voice: {
    title: "AI Voice",
    subtitle: "Choose an AI singer",
    icon: "sparkles" as const,
    color: C.gold,
    description: "Pick from our library of AI singer voices. The AI performs the translated song in the same key and melody as the original.",
    tier: "Plus",
  },
};

// ─── Dialect-Specific Singing Styles ──────────────────────────────────────
interface DialectOption {
  id: string;
  label: string;
  flag: string;
  description: string;
}

const DIALECT_MAP: Record<string, DialectOption[]> = {
  es: [
    { id: "standard", label: "Standard", flag: "🇪🇸", description: "Neutral Castilian Spanish" },
    { id: "mexican", label: "Mexican", flag: "🇲🇽", description: "Warm, melodic Mexican inflection" },
    { id: "dominican", label: "Dominican", flag: "🇩🇴", description: "Fast, rhythmic Caribbean flow" },
    { id: "colombian", label: "Colombian", flag: "🇨🇴", description: "Clear, smooth Bogotá style" },
    { id: "argentine", label: "Argentine", flag: "🇦🇷", description: "Tango-influenced porteño" },
    { id: "cuban", label: "Cuban", flag: "🇨🇺", description: "Salsa-infused Havana rhythm" },
    { id: "venezuelan", label: "Venezuelan", flag: "🇻🇪", description: "Energetic, expressive Caracas" },
    { id: "puerto-rican", label: "Puerto Rican", flag: "🇵🇷", description: "Reggaetón-influenced island flow" },
  ],
  fr: [
    { id: "standard", label: "Parisian", flag: "🇫🇷", description: "Classic French pronunciation" },
    { id: "canadian", label: "Québécois", flag: "🇨🇦", description: "Canadian French inflection" },
    { id: "west-african", label: "West African", flag: "🇸🇳", description: "Afro-French musical style" },
  ],
  pt: [
    { id: "standard", label: "Brazilian", flag: "🇧🇷", description: "Bossa nova-influenced Brazilian" },
    { id: "european", label: "European", flag: "🇵🇹", description: "Fado-style Portuguese" },
  ],
  de: [
    { id: "standard", label: "Standard", flag: "🇩🇪", description: "Hochdeutsch pronunciation" },
    { id: "austrian", label: "Austrian", flag: "🇦🇹", description: "Softer Austrian inflection" },
    { id: "swiss", label: "Swiss", flag: "🇨🇭", description: "Swiss German style" },
  ],
  ar: [
    { id: "standard", label: "MSA", flag: "🇸🇦", description: "Modern Standard Arabic" },
    { id: "egyptian", label: "Egyptian", flag: "🇪🇬", description: "Cairo pop vocal style" },
    { id: "levantine", label: "Levantine", flag: "🇱🇧", description: "Lebanese/Syrian musical style" },
  ],
  zh: [
    { id: "standard", label: "Mandarin", flag: "🇨🇳", description: "Standard Mandarin tones" },
    { id: "cantonese", label: "Cantonese", flag: "🇭🇰", description: "Hong Kong Cantopop style" },
  ],
  it: [
    { id: "standard", label: "Standard", flag: "🇮🇹", description: "Classic Italian bel canto" },
    { id: "neapolitan", label: "Neapolitan", flag: "🇮🇹", description: "Southern Italian passion" },
  ],
  en: [
    { id: "standard", label: "American", flag: "🇺🇸", description: "Standard American English" },
    { id: "british", label: "British", flag: "🇬🇧", description: "British RP pronunciation" },
    { id: "jamaican", label: "Jamaican", flag: "🇯🇲", description: "Reggae/dancehall inflection" },
    { id: "nigerian", label: "Nigerian", flag: "🇳🇬", description: "Afrobeats vocal style" },
  ],
};

// ─── Playback Comparison Modes ────────────────────────────────────────────
type ComparisonMode = "full_mix" | "original_vocals" | "translated_vocals" | "instrumental";

const COMPARISON_MODES: { key: ComparisonMode; label: string; icon: string }[] = [
  { key: "full_mix", label: "Full Mix", icon: "musical-notes" },
  { key: "original_vocals", label: "Original", icon: "person" },
  { key: "translated_vocals", label: "Translated", icon: "language" },
  { key: "instrumental", label: "Beat Only", icon: "disc" },
];

const STORAGE_KEY = "@song_translation_studio_history";

export default function SongTranslationStudioScreen() {
  const params = useLocalSearchParams<{
    url?: string;
    title?: string;
    artist?: string;
    sourceLanguage?: string;
  }>();

  // ─── State ─────────────────────────────────────────────────────────────
  const [step, setStep] = useState<StudioStep>("input");
  const [songUrl, setSongUrl] = useState(params.url || "");
  const [songTitle, setSongTitle] = useState(params.title || "");
  const [songArtist, setSongArtist] = useState(params.artist || "");
  const [sourceLanguage, setSourceLanguage] = useState(params.sourceLanguage || "en");
  const [targetLanguage, setTargetLanguage] = useState("es");
  const [voiceMode, setVoiceMode] = useState<VoiceMode>("ai_voice");
  const [selectedAIVoice, setSelectedAIVoice] = useState<AIVoice>(AI_VOICES[0]);
  const [preserveRhyme, setPreserveRhyme] = useState(true);
  const [preserveSyllables, setPreserveSyllables] = useState(true);
  const [preserveMelody, setPreserveMelody] = useState(true);

  // Voice clone state
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [voiceRecordingTime, setVoiceRecordingTime] = useState(0);
  const [voiceModelReady, setVoiceModelReady] = useState(false);
  const [voiceModelId, setVoiceModelId] = useState<string | null>(null);

  // Recording studio state
  const [isRecordingSong, setIsRecordingSong] = useState(false);
  const [songRecordingTime, setSongRecordingTime] = useState(0);
  const [hasRecording, setHasRecording] = useState(false);

  // Dialect selection
  const [selectedDialect, setSelectedDialect] = useState<string>("standard");

  // Processing state
  const [currentJob, setCurrentJob] = useState<TranslationJob | null>(null);
  const [translatedLyrics, setTranslatedLyrics] = useState<any[]>([]);
  const [qualityMetrics, setQualityMetrics] = useState<any>(null);

  // Pitch-matching playback
  const [comparisonMode, setComparisonMode] = useState<ComparisonMode>("full_mix");
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackProgress, setPlaybackProgress] = useState(0);

  // Share cover flow
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareCaption, setShareCaption] = useState("");
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);

  // MP3 Bounce/Export state
  const [showBounceModal, setShowBounceModal] = useState(false);
  const [bounceFormat, setBounceFormat] = useState<"mp3" | "wav" | "m4a">("mp3");
  const [isBouncing, setIsBouncing] = useState(false);
  const [bounceProgress, setBounceProgress] = useState(0);
  const [bounceComplete, setBounceComplete] = useState(false);

  // Animations
  const pulseAnim = useSharedValue(1);
  const waveAnim = useSharedValue(0);

  // Timer refs
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ─── tRPC mutations ────────────────────────────────────────────────────
  const startPipeline = trpc.songPipeline.startPipeline.useMutation();
  const getJobStatus = trpc.songPipeline.getJobStatus.useQuery(
    { jobId: currentJob?.jobId || "" },
    { enabled: !!currentJob && currentJob.status !== "completed" && currentJob.status !== "failed", refetchInterval: 2000 }
  );

  // ─── Effects ───────────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  useEffect(() => {
    if (getJobStatus.data && currentJob) {
      const data = getJobStatus.data;
      setCurrentJob({
        jobId: currentJob.jobId,
        status: data.status,
        progress: data.progress,
        stage: data.stage,
      });

      if (data.status === "completed" && data.result) {
        setTranslatedLyrics(data.result.translatedLyrics || []);
        setQualityMetrics(data.result.quality || null);
        setStep("result");
      } else if (data.status === "failed") {
        Alert.alert("Translation Failed", data.error || "Something went wrong. Please try again.");
        setStep("configure");
      }
    }
  }, [getJobStatus.data]);

  // Pulse animation for recording
  useEffect(() => {
    if (isRecordingVoice || isRecordingSong) {
      pulseAnim.value = withRepeat(
        withSequence(
          withTiming(1.15, { duration: 800, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 800, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );
    } else {
      pulseAnim.value = withTiming(1, { duration: 200 });
    }
  }, [isRecordingVoice, isRecordingSong]);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseAnim.value }],
  }));

  // ─── Handlers ──────────────────────────────────────────────────────────
  const handleNext = () => {
    if (step === "input") {
      if (!songTitle.trim()) {
        Alert.alert("Missing Info", "Please enter a song title.");
        return;
      }
      setStep("configure");
    } else if (step === "configure") {
      if (voiceMode === "clone" && !voiceModelReady) {
        setStep("voice_setup");
      } else if (voiceMode === "record") {
        setStep("voice_setup");
      } else {
        startTranslation();
      }
    }
  };

  const startVoiceRecording = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    setIsRecordingVoice(true);
    setVoiceRecordingTime(0);
    timerRef.current = setInterval(() => {
      setVoiceRecordingTime((t) => {
        if (t >= 60) {
          stopVoiceRecording();
          return 60;
        }
        return t + 1;
      });
    }, 1000);
  };

  const stopVoiceRecording = () => {
    setIsRecordingVoice(false);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    // Simulate voice model training
    if (voiceRecordingTime >= 15) {
      setTimeout(() => {
        setVoiceModelReady(true);
        setVoiceModelId(`clone-${Date.now()}`);
        if (Platform.OS !== "web") {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
      }, 2000);
    }
  };

  const startSongRecording = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    setIsRecordingSong(true);
    setSongRecordingTime(0);
    timerRef.current = setInterval(() => {
      setSongRecordingTime((t) => t + 1);
    }, 1000);
  };

  const stopSongRecording = () => {
    setIsRecordingSong(false);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setHasRecording(true);
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const startTranslation = async () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setStep("processing");

    try {
      const result = await startPipeline.mutateAsync({
        sourceUrl: songUrl || undefined,
        title: songTitle,
        artist: songArtist,
        sourceLanguage,
        targetLanguage,
        targetDialect: selectedDialect !== "standard" ? selectedDialect : undefined,
        voiceStyle: voiceMode === "clone" ? "clone" : voiceMode === "record" ? "natural" : "match_original",
        voiceModelId: voiceMode === "clone" ? voiceModelId || undefined : undefined,
        preserveRhyme,
        preserveSyllables,
        preserveMelody,
      });

      setCurrentJob({
        jobId: result.jobId,
        status: result.status,
        progress: 0,
        stage: "Starting pipeline...",
      });
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to start translation pipeline");
      setStep("configure");
    }
  };

  const handleSaveToLibrary = async () => {
    try {
      const history = JSON.parse(await AsyncStorage.getItem(STORAGE_KEY) || "[]");
      history.unshift({
        id: currentJob?.jobId || `local-${Date.now()}`,
        title: songTitle,
        artist: songArtist,
        sourceLanguage,
        targetLanguage,
        voiceMode,
        timestamp: Date.now(),
        quality: qualityMetrics,
      });
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(history.slice(0, 50)));
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      Alert.alert("Saved!", "Song added to your library.");
    } catch (err) {
      Alert.alert("Error", "Failed to save to library.");
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  // Pitch-matching playback toggle
  const togglePlayback = () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (isPlaying) {
      setIsPlaying(false);
      if (timerRef.current) clearInterval(timerRef.current);
    } else {
      setIsPlaying(true);
      timerRef.current = setInterval(() => {
        setPlaybackProgress((p) => {
          if (p >= 100) {
            setIsPlaying(false);
            if (timerRef.current) clearInterval(timerRef.current);
            return 0;
          }
          return p + 0.5;
        });
      }, 100);
    }
  };

  // ─── MP3 Bounce/Export Handler ─────────────────────────────────────
  const handleBounce = async () => {
    setIsBouncing(true);
    setBounceProgress(0);
    setBounceComplete(false);
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Simulate bounce processing (in production: calls songStudio.bounce endpoint)
    const interval = setInterval(() => {
      setBounceProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 4;
      });
    }, 150);

    setTimeout(async () => {
      clearInterval(interval);
      setBounceProgress(100);
      setIsBouncing(false);
      setBounceComplete(true);
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      // Save bounce record
      try {
        const bounceHistory = JSON.parse(await AsyncStorage.getItem("@bounce_exports") || "[]");
        bounceHistory.unshift({
          id: `bounce_${Date.now()}`,
          title: songTitle,
          artist: songArtist,
          targetLanguage,
          dialect: selectedDialect,
          format: bounceFormat,
          timestamp: Date.now(),
          quality: qualityMetrics,
        });
        await AsyncStorage.setItem("@bounce_exports", JSON.stringify(bounceHistory.slice(0, 100)));
      } catch (e) { /* silent */ }
    }, 4000);
  };

  // Share Cover export handler
  const handleShareCover = async () => {
    setIsExporting(true);
    setExportProgress(0);
    // Simulate video export with animated lyrics
    const interval = setInterval(() => {
      setExportProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 5;
      });
    }, 200);

    // Save to posts
    try {
      const existing = await AsyncStorage.getItem("@user_posts");
      const posts = existing ? JSON.parse(existing) : [];
      const dialectLabel = DIALECT_MAP[targetLanguage]?.find(d => d.id === selectedDialect)?.label || "Standard";
      posts.unshift({
        id: Date.now().toString(),
        type: "song_translation_cover",
        songTitle,
        artist: songArtist,
        sourceLanguage,
        targetLanguage,
        dialect: dialectLabel,
        voiceMode,
        caption: shareCaption,
        quality: qualityMetrics,
        createdAt: new Date().toISOString(),
        likes: 0,
        comments: 0,
      });
      await AsyncStorage.setItem("@user_posts", JSON.stringify(posts.slice(0, 100)));
    } catch (e) { /* silent */ }

    setTimeout(async () => {
      setIsExporting(false);
      setShowShareModal(false);
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      // Open native share sheet
      const dialectLabel = DIALECT_MAP[targetLanguage]?.find(d => d.id === selectedDialect)?.label || "";
      const langName = SUPPORTED_LANGUAGES.find(l => l.code === targetLanguage)?.name || targetLanguage;
      const shareText = `\u266a "${songTitle}" by ${songArtist}\nTranslated to ${langName}${dialectLabel !== "Standard" ? ` (${dialectLabel})` : ""}\n\n${shareCaption ? shareCaption + "\n\n" : ""}Translated & performed with ConnectWorld AI`;
      try {
        await Share.share({ message: shareText });
      } catch (e) { /* cancelled */ }
    }, 4200);
  };

  // ─── Render: Input Step ────────────────────────────────────────────────
  const renderInputStep = () => (
    <Animated.View entering={FadeInDown.duration(300)} style={styles.stepContainer}>
      {/* Header */}
      <View style={styles.sectionHeader}>
        <Text style={styles.stepTitle}>What song do you want to translate?</Text>
        <Text style={styles.stepSubtitle}>
          Paste a URL or enter the song details manually
        </Text>
      </View>

      {/* URL Input */}
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Song URL (optional)</Text>
        <View style={styles.urlInputRow}>
          <Ionicons name="link" size={18} color={C.textMuted} style={{ marginRight: 8 }} />
          <TextInput
            style={styles.textInput}
            placeholder="Paste Spotify, YouTube, or Apple Music URL..."
            placeholderTextColor={C.textMuted}
            value={songUrl}
            onChangeText={setSongUrl}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>
      </View>

      {/* Song Details */}
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Song Title *</Text>
        <TextInput
          style={styles.textInputFull}
          placeholder="e.g., End of the Road"
          placeholderTextColor={C.textMuted}
          value={songTitle}
          onChangeText={setSongTitle}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Artist</Text>
        <TextInput
          style={styles.textInputFull}
          placeholder="e.g., Boyz II Men"
          placeholderTextColor={C.textMuted}
          value={songArtist}
          onChangeText={setSongArtist}
        />
      </View>

      {/* Source Language */}
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Original Language</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.langScroll}>
          {SUPPORTED_LANGUAGES.map((lang) => (
            <TouchableOpacity
              key={lang.code}
              style={[styles.langChip, sourceLanguage === lang.code && styles.langChipActive]}
              onPress={() => setSourceLanguage(lang.code)}
            >
              <Text style={styles.langFlag}>{lang.flag}</Text>
              <Text style={[styles.langChipText, sourceLanguage === lang.code && styles.langChipTextActive]}>
                {lang.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Target Language */}
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Translate To</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.langScroll}>
          {SUPPORTED_LANGUAGES.filter((l) => l.code !== sourceLanguage).map((lang) => (
            <TouchableOpacity
              key={lang.code}
              style={[styles.langChip, targetLanguage === lang.code && styles.langChipActive]}
              onPress={() => setTargetLanguage(lang.code)}
            >
              <Text style={styles.langFlag}>{lang.flag}</Text>
              <Text style={[styles.langChipText, targetLanguage === lang.code && styles.langChipTextActive]}>
                {lang.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </Animated.View>
  );

  // ─── Render: Configure Step ────────────────────────────────────────────
  const renderConfigureStep = () => (
    <Animated.View entering={FadeInDown.duration(300)} style={styles.stepContainer}>
      {/* Song Info Summary */}
      <View style={styles.songSummary}>
        <View style={styles.songSummaryIcon}>
          <Ionicons name="musical-notes" size={24} color={C.accent} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.songSummaryTitle}>{songTitle}</Text>
          <Text style={styles.songSummaryArtist}>
            {songArtist || "Unknown Artist"} • {SUPPORTED_LANGUAGES.find((l) => l.code === sourceLanguage)?.flag} → {SUPPORTED_LANGUAGES.find((l) => l.code === targetLanguage)?.flag}
          </Text>
        </View>
      </View>

      {/* Voice Mode Selection */}
      <View style={styles.sectionHeader}>
        <Text style={styles.stepTitle}>How do you want it to sound?</Text>
        <Text style={styles.stepSubtitle}>Choose your voice output mode</Text>
      </View>

      {(["clone", "record", "ai_voice"] as VoiceMode[]).map((mode) => {
        const info = VOICE_MODE_INFO[mode];
        const isSelected = voiceMode === mode;
        return (
          <TouchableOpacity
            key={mode}
            style={[styles.voiceModeCard, isSelected && { borderColor: info.color, borderWidth: 1.5 }]}
            onPress={() => {
              setVoiceMode(mode);
              if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
          >
            <View style={[styles.voiceModeIcon, { backgroundColor: info.color + "20" }]}>
              <Ionicons name={info.icon} size={24} color={info.color} />
            </View>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <Text style={styles.voiceModeTitle}>{info.title}</Text>
                <View style={[styles.tierBadge, { backgroundColor: info.color + "30" }]}>
                  <Text style={[styles.tierBadgeText, { color: info.color }]}>{info.tier}</Text>
                </View>
              </View>
              <Text style={styles.voiceModeSubtitle}>{info.subtitle}</Text>
              {isSelected && (
                <Text style={styles.voiceModeDescription}>{info.description}</Text>
              )}
            </View>
            <View style={[styles.radioOuter, isSelected && { borderColor: info.color }]}>
              {isSelected && <View style={[styles.radioInner, { backgroundColor: info.color }]} />}
            </View>
          </TouchableOpacity>
        );
      })}

      {/* Preservation Options */}
      <View style={[styles.sectionHeader, { marginTop: 24 }]}>
        <Text style={styles.stepTitle}>Translation Quality</Text>
        <Text style={styles.stepSubtitle}>What to preserve from the original</Text>
      </View>

      <View style={styles.toggleRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.toggleLabel}>Same Melody & Key</Text>
          <Text style={styles.toggleDesc}>Keep the original musical arrangement</Text>
        </View>
        <TouchableOpacity
          style={[styles.toggle, preserveMelody && styles.toggleActive]}
          onPress={() => setPreserveMelody(!preserveMelody)}
        >
          <View style={[styles.toggleKnob, preserveMelody && styles.toggleKnobActive]} />
        </TouchableOpacity>
      </View>

      <View style={styles.toggleRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.toggleLabel}>Match Syllable Count</Text>
          <Text style={styles.toggleDesc}>Same number of syllables per line</Text>
        </View>
        <TouchableOpacity
          style={[styles.toggle, preserveSyllables && styles.toggleActive]}
          onPress={() => setPreserveSyllables(!preserveSyllables)}
        >
          <View style={[styles.toggleKnob, preserveSyllables && styles.toggleKnobActive]} />
        </TouchableOpacity>
      </View>

      <View style={styles.toggleRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.toggleLabel}>Preserve Rhyme Scheme</Text>
          <Text style={styles.toggleDesc}>Keep the AABB/ABAB pattern</Text>
        </View>
        <TouchableOpacity
          style={[styles.toggle, preserveRhyme && styles.toggleActive]}
          onPress={() => setPreserveRhyme(!preserveRhyme)}
        >
          <View style={[styles.toggleKnob, preserveRhyme && styles.toggleKnobActive]} />
        </TouchableOpacity>
      </View>

      {/* AI Voice Selection (if ai_voice mode) */}
      {voiceMode === "ai_voice" && (
        <View style={{ marginTop: 24 }}>
          <View style={styles.sectionHeader}>
            <Text style={styles.stepTitle}>Choose AI Singer</Text>
          </View>
          <FlatList
            data={AI_VOICES}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.aiVoiceCard,
                  selectedAIVoice.id === item.id && { borderColor: C.gold, borderWidth: 1.5 },
                ]}
                onPress={() => setSelectedAIVoice(item)}
              >
                <View style={[styles.aiVoiceAvatar, { backgroundColor: item.gender === "female" ? C.pink + "20" : C.accent + "20" }]}>
                  <Ionicons name={item.icon as any} size={20} color={item.gender === "female" ? C.pink : C.accent} />
                </View>
                <Text style={styles.aiVoiceName}>{item.name}</Text>
                <Text style={styles.aiVoiceStyle}>{item.style}</Text>
                <Text style={styles.aiVoiceDesc} numberOfLines={1}>{item.description}</Text>
              </TouchableOpacity>
            )}
          />
        </View>
      )}

      {/* Dialect-Specific Singing Style */}
      {DIALECT_MAP[targetLanguage] && DIALECT_MAP[targetLanguage].length > 1 && (
        <View style={{ marginTop: 24 }}>
          <View style={styles.sectionHeader}>
            <Text style={styles.stepTitle}>Vocal Inflection</Text>
            <Text style={styles.stepSubtitle}>Choose the regional singing style</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }}>
            {DIALECT_MAP[targetLanguage].map((dialect) => (
              <TouchableOpacity
                key={dialect.id}
                style={[
                  styles.dialectChip,
                  selectedDialect === dialect.id && styles.dialectChipActive,
                ]}
                onPress={() => {
                  setSelectedDialect(dialect.id);
                  if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
              >
                <Text style={styles.dialectFlag}>{dialect.flag}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[
                    styles.dialectLabel,
                    selectedDialect === dialect.id && styles.dialectLabelActive,
                  ]}>{dialect.label}</Text>
                  <Text style={styles.dialectDesc} numberOfLines={1}>{dialect.description}</Text>
                </View>
                {selectedDialect === dialect.id && (
                  <Ionicons name="checkmark-circle" size={16} color={C.accent} />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
    </Animated.View>
  );

  // ─── Render: Voice Setup Step ──────────────────────────────────────────
  const renderVoiceSetupStep = () => (
    <Animated.View entering={FadeInDown.duration(300)} style={styles.stepContainer}>
      {voiceMode === "clone" ? (
        <>
          <View style={styles.sectionHeader}>
            <Text style={styles.stepTitle}>Train Your Voice Clone</Text>
            <Text style={styles.stepSubtitle}>
              Record 30-60 seconds of yourself singing any song. The AI will learn your vocal characteristics.
            </Text>
          </View>

          {/* Recording UI */}
          <View style={styles.recordingArea}>
            {/* Waveform Visualization */}
            <View style={styles.waveformContainer}>
              {Array.from({ length: 30 }).map((_, i) => (
                <View
                  key={i}
                  style={[
                    styles.waveformBar,
                    {
                      height: isRecordingVoice
                        ? 8 + Math.random() * 40
                        : 8,
                      backgroundColor: isRecordingVoice ? C.purple : C.textMuted,
                    },
                  ]}
                />
              ))}
            </View>

            {/* Timer */}
            <Text style={styles.recordingTimer}>
              {formatTime(voiceRecordingTime)} / 1:00
            </Text>
            <Text style={styles.recordingHint}>
              {voiceRecordingTime < 15
                ? `Minimum 15 seconds (${15 - voiceRecordingTime}s more needed)`
                : voiceRecordingTime < 30
                  ? "Good! Keep going for better quality..."
                  : "Excellent! You can stop anytime."}
            </Text>

            {/* Record Button */}
            <Animated.View style={[styles.recordButtonOuter, isRecordingVoice && pulseStyle]}>
              <TouchableOpacity
                style={[styles.recordButton, isRecordingVoice && styles.recordButtonActive]}
                onPress={isRecordingVoice ? stopVoiceRecording : startVoiceRecording}
              >
                {isRecordingVoice ? (
                  <View style={styles.stopIcon} />
                ) : (
                  <Ionicons name="mic" size={32} color="#FFF" />
                )}
              </TouchableOpacity>
            </Animated.View>

            {/* Voice Model Status */}
            {voiceModelReady && (
              <View style={styles.voiceReadyBanner}>
                <Ionicons name="checkmark-circle" size={20} color={C.success} />
                <Text style={styles.voiceReadyText}>Voice model trained successfully!</Text>
              </View>
            )}
          </View>

          {voiceModelReady && (
            <TouchableOpacity style={styles.primaryButton} onPress={startTranslation}>
              <Ionicons name="sparkles" size={18} color="#FFF" />
              <Text style={styles.primaryButtonText}>Generate Translation in My Voice</Text>
            </TouchableOpacity>
          )}
        </>
      ) : (
        <>
          {/* Recording Studio Mode */}
          <View style={styles.sectionHeader}>
            <Text style={styles.stepTitle}>Recording Studio</Text>
            <Text style={styles.stepSubtitle}>
              The translated lyrics will scroll on screen. Sing along over the instrumental!
            </Text>
          </View>

          {/* First translate, then record */}
          {translatedLyrics.length === 0 ? (
            <View style={styles.preTranslateSection}>
              <Text style={styles.preTranslateText}>
                First, we'll translate the lyrics while preserving the melody. Then you'll record your version.
              </Text>
              <TouchableOpacity style={styles.primaryButton} onPress={startTranslation}>
                <Ionicons name="language" size={18} color="#FFF" />
                <Text style={styles.primaryButtonText}>Translate Lyrics First</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              {/* Scrolling Lyrics Display */}
              <View style={styles.lyricsScrollArea}>
                <ScrollView style={{ maxHeight: 200 }}>
                  {translatedLyrics.map((line: any, idx: number) => (
                    <View key={idx} style={styles.lyricLine}>
                      <Text style={styles.lyricOriginal}>{line.original}</Text>
                      <Text style={styles.lyricTranslated}>{line.translated}</Text>
                    </View>
                  ))}
                </ScrollView>
              </View>

              {/* Recording Controls */}
              <View style={styles.recordingArea}>
                <Text style={styles.recordingTimer}>{formatTime(songRecordingTime)}</Text>

                <Animated.View style={[styles.recordButtonOuter, isRecordingSong && pulseStyle]}>
                  <TouchableOpacity
                    style={[styles.recordButton, isRecordingSong && styles.recordButtonActive]}
                    onPress={isRecordingSong ? stopSongRecording : startSongRecording}
                  >
                    {isRecordingSong ? (
                      <View style={styles.stopIcon} />
                    ) : (
                      <Ionicons name="mic" size={32} color="#FFF" />
                    )}
                  </TouchableOpacity>
                </Animated.View>

                {hasRecording && (
                  <View style={styles.recordingActions}>
                    <TouchableOpacity style={styles.secondaryButton} onPress={() => { setHasRecording(false); setSongRecordingTime(0); }}>
                      <Ionicons name="refresh" size={16} color={C.accent} />
                      <Text style={styles.secondaryButtonText}>Re-record</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.primaryButton} onPress={() => setStep("result")}>
                      <Ionicons name="checkmark" size={16} color="#FFF" />
                      <Text style={styles.primaryButtonText}>Use This Take</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </>
          )}
        </>
      )}
    </Animated.View>
  );

  // ─── Render: Processing Step ───────────────────────────────────────────
  const renderProcessingStep = () => (
    <Animated.View entering={FadeIn.duration(300)} style={[styles.stepContainer, { alignItems: "center", justifyContent: "center", flex: 1 }]}>
      {/* Animated Visualization */}
      <View style={styles.processingVisual}>
        <View style={styles.processingOrb}>
          <Ionicons name="musical-notes" size={40} color={C.accent} />
        </View>
        {/* Orbiting dots */}
        {[0, 1, 2, 3].map((i) => (
          <View
            key={i}
            style={[
              styles.orbitDot,
              {
                transform: [
                  { rotate: `${i * 90 + (currentJob?.progress || 0) * 3.6}deg` },
                  { translateX: 50 },
                ],
              },
            ]}
          />
        ))}
      </View>

      {/* Progress Info */}
      <Text style={styles.processingTitle}>
        {currentJob?.stage || "Starting pipeline..."}
      </Text>
      <Text style={styles.processingSubtitle}>
        {currentJob?.status === "translating"
          ? "Matching syllables, rhythm, and rhyme to the original melody..."
          : currentJob?.status === "synthesizing"
            ? "Generating vocals in the target language..."
            : currentJob?.status === "mixing"
              ? "Mixing translated vocals with the instrumental..."
              : "Analyzing the song structure..."}
      </Text>

      {/* Progress Bar */}
      <View style={styles.progressBarContainer}>
        <View style={[styles.progressBar, { width: `${currentJob?.progress || 0}%` }]} />
      </View>
      <Text style={styles.progressText}>{currentJob?.progress || 0}%</Text>

      {/* Pipeline Steps */}
      <View style={styles.pipelineSteps}>
        {["Isolate", "Transcribe", "Translate", "Synthesize", "Mix"].map((s, i) => {
          const stepProgress = (currentJob?.progress || 0) / 100;
          const stepThreshold = i / 5;
          const isComplete = stepProgress > stepThreshold + 0.2;
          const isCurrent = stepProgress >= stepThreshold && stepProgress <= stepThreshold + 0.2;
          return (
            <View key={s} style={styles.pipelineStep}>
              <View style={[
                styles.pipelineStepDot,
                isComplete && { backgroundColor: C.success },
                isCurrent && { backgroundColor: C.accent, borderColor: C.accent },
              ]}>
                {isComplete && <Ionicons name="checkmark" size={10} color="#FFF" />}
              </View>
              <Text style={[
                styles.pipelineStepText,
                isComplete && { color: C.success },
                isCurrent && { color: C.accent },
              ]}>{s}</Text>
            </View>
          );
        })}
      </View>
    </Animated.View>
  );

  // ─── Render: Result Step ───────────────────────────────────────────────
  const renderResultStep = () => (
    <Animated.View entering={FadeInUp.duration(400)} style={styles.stepContainer}>
      {/* Success Header */}
      <View style={styles.resultHeader}>
        <View style={styles.resultSuccessIcon}>
          <Ionicons name="checkmark-circle" size={48} color={C.success} />
        </View>
        <Text style={styles.resultTitle}>Translation Complete!</Text>
        <Text style={styles.resultSubtitle}>
          "{songTitle}" translated to {SUPPORTED_LANGUAGES.find((l) => l.code === targetLanguage)?.name}
          {selectedDialect !== "standard" && ` (${DIALECT_MAP[targetLanguage]?.find(d => d.id === selectedDialect)?.label})`}
        </Text>
      </View>

      {/* ─── Pitch-Matching Playback Comparison ─── */}
      <View style={styles.comparisonCard}>
        <Text style={styles.comparisonTitle}>Compare Playback</Text>
        <Text style={styles.comparisonSubtitle}>Listen to original vs translated side by side</Text>

        {/* Mode Selector */}
        <View style={styles.comparisonModes}>
          {COMPARISON_MODES.map((mode) => (
            <TouchableOpacity
              key={mode.key}
              style={[
                styles.comparisonModeBtn,
                comparisonMode === mode.key && styles.comparisonModeBtnActive,
              ]}
              onPress={() => {
                setComparisonMode(mode.key);
                if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
            >
              <Ionicons
                name={mode.icon as any}
                size={14}
                color={comparisonMode === mode.key ? "#FFF" : C.textSecondary}
              />
              <Text style={[
                styles.comparisonModeText,
                comparisonMode === mode.key && styles.comparisonModeTextActive,
              ]}>{mode.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Playback Controls */}
        <View style={styles.playbackControls}>
          <TouchableOpacity onPress={() => setPlaybackProgress(Math.max(0, playbackProgress - 10))}>
            <Ionicons name="play-back" size={20} color={C.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.playPauseBtn} onPress={togglePlayback}>
            <Ionicons name={isPlaying ? "pause" : "play"} size={24} color="#FFF" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setPlaybackProgress(Math.min(100, playbackProgress + 10))}>
            <Ionicons name="play-forward" size={20} color={C.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Progress Bar */}
        <View style={styles.playbackProgressBar}>
          <View style={[styles.playbackProgressFill, { width: `${playbackProgress}%` }]} />
        </View>
        <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 4 }}>
          <Text style={styles.playbackTime}>{formatTime(Math.floor(playbackProgress * 2.4))}</Text>
          <Text style={styles.playbackTime}>4:00</Text>
        </View>
      </View>

      {/* Quality Metrics */}
      {qualityMetrics && (
        <View style={styles.qualityCard}>
          <Text style={styles.qualityTitle}>Translation Quality</Text>
          <View style={styles.qualityGrid}>
            {[
              { label: "Syllable Match", value: qualityMetrics.syllableMatch },
              { label: "Rhyme Preserved", value: qualityMetrics.rhymePreservation },
              { label: "Meaning", value: qualityMetrics.meaningPreservation },
              { label: "Singability", value: qualityMetrics.singability },
            ].map((metric) => (
              <View key={metric.label} style={styles.qualityItem}>
                <Text style={styles.qualityValue}>{Math.round((metric.value || 0) * 100)}%</Text>
                <Text style={styles.qualityLabel}>{metric.label}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Translated Lyrics Preview */}
      {translatedLyrics.length > 0 && (
        <View style={styles.lyricsPreview}>
          <Text style={styles.lyricsPreviewTitle}>Translated Lyrics</Text>
          <ScrollView style={{ maxHeight: 200 }}>
            {translatedLyrics.slice(0, 8).map((line: any, idx: number) => (
              <View key={idx} style={styles.lyricLine}>
                <Text style={styles.lyricOriginal}>{line.original}</Text>
                <Text style={styles.lyricTranslated}>{line.translated}</Text>
              </View>
            ))}
            {translatedLyrics.length > 8 && (
              <Text style={styles.moreLines}>+ {translatedLyrics.length - 8} more lines</Text>
            )}
          </ScrollView>
        </View>
      )}

      {/* Action Buttons */}
      <View style={styles.resultActions}>
        <TouchableOpacity style={styles.primaryButton} onPress={() => {
          router.push({
            pathname: "/song-player",
            params: { title: songTitle, artist: songArtist, mode: "translated" },
          });
        }}>
          <Ionicons name="play" size={18} color="#FFF" />
          <Text style={styles.primaryButtonText}>Play Translated Song</Text>
        </TouchableOpacity>

        {/* Share Cover Button */}
        <TouchableOpacity
          style={[styles.secondaryButton, { backgroundColor: "rgba(139,92,246,0.15)" }]}
          onPress={() => setShowShareModal(true)}
        >
          <Ionicons name="share-social" size={16} color="#8B5CF6" />
          <Text style={[styles.secondaryButtonText, { color: "#8B5CF6" }]}>Share Cover Video</Text>
        </TouchableOpacity>

        {/* Bounce as MP3 Button */}
        <TouchableOpacity
          style={[styles.secondaryButton, { backgroundColor: "rgba(0,230,118,0.12)" }]}
          onPress={() => setShowBounceModal(true)}
        >
          <Ionicons name="download" size={16} color={C.success} />
          <Text style={[styles.secondaryButtonText, { color: C.success }]}>Bounce as MP3</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.secondaryButton} onPress={handleSaveToLibrary}>
          <Ionicons name="bookmark" size={16} color={C.accent} />
          <Text style={styles.secondaryButtonText}>Save to Library</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.secondaryButton} onPress={() => {
          setStep("voice_setup");
          setVoiceMode("record");
        }}>
          <Ionicons name="mic" size={16} color={C.accent} />
          <Text style={styles.secondaryButtonText}>Record My Version</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.ghostButton} onPress={() => {
          setStep("input");
          setCurrentJob(null);
          setTranslatedLyrics([]);
          setQualityMetrics(null);
          setPlaybackProgress(0);
          setIsPlaying(false);
        }}>
          <Ionicons name="add" size={16} color={C.textSecondary} />
          <Text style={styles.ghostButtonText}>Translate Another Song</Text>
        </TouchableOpacity>
      </View>

      {/* ─── Share Cover Modal ─── */}
      <Modal visible={showShareModal} animationType="slide" transparent>
        <View style={styles.shareModalOverlay}>
          <View style={styles.shareModalContent}>
            <View style={styles.shareModalHeader}>
              <Text style={styles.shareModalTitle}>Share Cover Video</Text>
              <TouchableOpacity onPress={() => setShowShareModal(false)}>
                <Ionicons name="close" size={24} color={C.text} />
              </TouchableOpacity>
            </View>

            {!isExporting ? (
              <>
                {/* Preview Card */}
                <View style={styles.sharePreviewCard}>
                  <View style={styles.sharePreviewIcon}>
                    <Ionicons name="videocam" size={32} color={C.accent} />
                  </View>
                  <Text style={styles.sharePreviewTitle}>{songTitle}</Text>
                  <Text style={styles.sharePreviewArtist}>
                    {songArtist} • {SUPPORTED_LANGUAGES.find(l => l.code === targetLanguage)?.flag} {SUPPORTED_LANGUAGES.find(l => l.code === targetLanguage)?.name}
                    {selectedDialect !== "standard" && ` (${DIALECT_MAP[targetLanguage]?.find(d => d.id === selectedDialect)?.label})`}
                  </Text>
                  <Text style={styles.sharePreviewDesc}>
                    Video with animated lyrics overlay + translated audio
                  </Text>
                </View>

                {/* Caption Input */}
                <View style={{ marginTop: 16 }}>
                  <Text style={styles.inputLabel}>Caption (optional)</Text>
                  <TextInput
                    style={[styles.textInputFull, { height: 80, textAlignVertical: "top" }]}
                    placeholder="Add a caption to your cover..."
                    placeholderTextColor={C.textMuted}
                    value={shareCaption}
                    onChangeText={setShareCaption}
                    multiline
                    maxLength={280}
                  />
                </View>

                {/* Export Button */}
                <TouchableOpacity style={[styles.primaryButton, { marginTop: 20 }]} onPress={handleShareCover}>
                  <Ionicons name="cloud-upload" size={18} color="#FFF" />
                  <Text style={styles.primaryButtonText}>Export & Share</Text>
                </TouchableOpacity>

                <Text style={{ fontSize: 11, color: C.textMuted, textAlign: "center", marginTop: 12 }}>
                  Creates a video with animated lyrics synced to the translated audio
                </Text>
              </>
            ) : (
              <View style={{ alignItems: "center", paddingVertical: 40 }}>
                <ActivityIndicator size="large" color={C.accent} />
                <Text style={[styles.processingTitle, { marginTop: 20 }]}>Exporting Cover Video...</Text>
                <Text style={styles.processingSubtitle}>
                  Rendering animated lyrics overlay
                </Text>
                <View style={[styles.progressBarContainer, { marginTop: 24 }]}>
                  <View style={[styles.progressBar, { width: `${exportProgress}%` }]} />
                </View>
                <Text style={styles.progressText}>{exportProgress}%</Text>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* ─── Bounce/Export MP3 Modal ─── */}
      <Modal visible={showBounceModal} animationType="slide" transparent>
        <View style={styles.shareModalOverlay}>
          <View style={styles.shareModalContent}>
            <View style={styles.shareModalHeader}>
              <Text style={styles.shareModalTitle}>Bounce to File</Text>
              <TouchableOpacity onPress={() => { setShowBounceModal(false); setBounceComplete(false); }}>
                <Ionicons name="close" size={24} color={C.text} />
              </TouchableOpacity>
            </View>

            {!isBouncing && !bounceComplete ? (
              <>
                {/* Song Info */}
                <View style={styles.sharePreviewCard}>
                  <View style={styles.sharePreviewIcon}>
                    <Ionicons name="musical-note" size={32} color={C.success} />
                  </View>
                  <Text style={styles.sharePreviewTitle}>{songTitle}</Text>
                  <Text style={styles.sharePreviewArtist}>
                    {songArtist} • {SUPPORTED_LANGUAGES.find(l => l.code === targetLanguage)?.flag} {SUPPORTED_LANGUAGES.find(l => l.code === targetLanguage)?.name}
                  </Text>
                </View>

                {/* Format Picker */}
                <View style={{ marginTop: 20 }}>
                  <Text style={styles.inputLabel}>Export Format</Text>
                  <View style={{ flexDirection: "row", gap: 10, marginTop: 8 }}>
                    {(["mp3", "wav", "m4a"] as const).map((fmt) => (
                      <TouchableOpacity
                        key={fmt}
                        onPress={() => setBounceFormat(fmt)}
                        style={[{
                          flex: 1,
                          paddingVertical: 14,
                          borderRadius: 12,
                          alignItems: "center",
                          backgroundColor: bounceFormat === fmt ? "rgba(0,230,118,0.15)" : C.surface,
                          borderWidth: 1.5,
                          borderColor: bounceFormat === fmt ? C.success : C.border,
                        }]}
                      >
                        <Text style={{ fontSize: 16, fontWeight: "700", color: bounceFormat === fmt ? C.success : C.text }}>
                          .{fmt.toUpperCase()}
                        </Text>
                        <Text style={{ fontSize: 11, color: C.textMuted, marginTop: 2 }}>
                          {fmt === "mp3" ? "Compressed • Universal" : fmt === "wav" ? "Lossless • Large" : "Apple • High Quality"}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Quality Info */}
                <View style={{ marginTop: 16, padding: 12, backgroundColor: "rgba(0,230,118,0.06)", borderRadius: 10 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                    <Ionicons name="information-circle" size={16} color={C.success} />
                    <Text style={{ fontSize: 12, color: C.textSecondary }}>
                      {bounceFormat === "mp3" ? "320kbps high-quality MP3 • ~4MB per minute" :
                       bounceFormat === "wav" ? "44.1kHz 16-bit WAV • ~10MB per minute" :
                       "256kbps AAC M4A • ~3MB per minute"}
                    </Text>
                  </View>
                </View>

                {/* Bounce Button */}
                <TouchableOpacity
                  style={[styles.primaryButton, { marginTop: 20, backgroundColor: C.success }]}
                  onPress={handleBounce}
                >
                  <Ionicons name="download" size={18} color="#000" />
                  <Text style={[styles.primaryButtonText, { color: "#000" }]}>Bounce .{bounceFormat.toUpperCase()}</Text>
                </TouchableOpacity>

                <Text style={{ fontSize: 11, color: C.textMuted, textAlign: "center", marginTop: 12 }}>
                  Exports translated vocals mixed with original instrumental
                </Text>
              </>
            ) : isBouncing ? (
              <View style={{ alignItems: "center", paddingVertical: 40 }}>
                <ActivityIndicator size="large" color={C.success} />
                <Text style={[styles.processingTitle, { marginTop: 20 }]}>Bouncing to .{bounceFormat.toUpperCase()}...</Text>
                <Text style={styles.processingSubtitle}>
                  Mixing translated vocals + instrumental
                </Text>
                <View style={[styles.progressBarContainer, { marginTop: 24 }]}>
                  <View style={[styles.progressBar, { width: `${bounceProgress}%`, backgroundColor: C.success }]} />
                </View>
                <Text style={styles.progressText}>{bounceProgress}%</Text>
              </View>
            ) : (
              <View style={{ alignItems: "center", paddingVertical: 40 }}>
                <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: "rgba(0,230,118,0.15)", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
                  <Ionicons name="checkmark-circle" size={40} color={C.success} />
                </View>
                <Text style={[styles.processingTitle, { marginTop: 8 }]}>Bounce Complete!</Text>
                <Text style={styles.processingSubtitle}>
                  {songTitle} - {SUPPORTED_LANGUAGES.find(l => l.code === targetLanguage)?.name}.{bounceFormat}
                </Text>
                <Text style={{ fontSize: 12, color: C.textMuted, marginTop: 8 }}>
                  Saved to your device
                </Text>

                {/* Share bounced file */}
                <TouchableOpacity
                  style={[styles.primaryButton, { marginTop: 24, backgroundColor: C.accent }]}
                  onPress={async () => {
                    try {
                      await Share.share({
                        message: `Check out my translated version of "${songTitle}" by ${songArtist}! Translated to ${SUPPORTED_LANGUAGES.find(l => l.code === targetLanguage)?.name} with LinguaVibe`,
                      });
                    } catch (e) { /* cancelled */ }
                  }}
                >
                  <Ionicons name="share" size={18} color="#FFF" />
                  <Text style={styles.primaryButtonText}>Share File</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.ghostButton, { marginTop: 12 }]}
                  onPress={() => { setShowBounceModal(false); setBounceComplete(false); }}
                >
                  <Text style={styles.ghostButtonText}>Done</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </Animated.View>
  );

  // ─── Main Render ───────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color={C.text} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Translation Studio</Text>
          <Text style={styles.headerSubtitle}>
            {step === "input" ? "Choose a song" : step === "configure" ? "Configure output" : step === "voice_setup" ? "Voice setup" : step === "processing" ? "Translating..." : "Complete!"}
          </Text>
        </View>
        {step !== "processing" && step !== "result" && (
          <View style={styles.stepIndicator}>
            <Text style={styles.stepIndicatorText}>
              {step === "input" ? "1/3" : step === "configure" ? "2/3" : "3/3"}
            </Text>
          </View>
        )}
      </View>

      {/* Step Progress Bar */}
      {step !== "processing" && step !== "result" && (
        <View style={styles.stepsBar}>
          <View style={[styles.stepsBarFill, { width: step === "input" ? "33%" : step === "configure" ? "66%" : "100%" }]} />
        </View>
      )}

      {/* Content */}
      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
        {step === "input" && renderInputStep()}
        {step === "configure" && renderConfigureStep()}
        {step === "voice_setup" && renderVoiceSetupStep()}
        {step === "processing" && renderProcessingStep()}
        {step === "result" && renderResultStep()}
      </ScrollView>

      {/* Bottom Action (for input/configure steps) */}
      {(step === "input" || step === "configure") && (
        <View style={styles.bottomAction}>
          {step === "configure" && (
            <TouchableOpacity style={styles.backStepButton} onPress={() => setStep("input")}>
              <Ionicons name="chevron-back" size={18} color={C.textSecondary} />
              <Text style={styles.backStepText}>Back</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={[styles.primaryButton, { flex: 1 }]} onPress={handleNext}>
            <Text style={styles.primaryButtonText}>
              {step === "input" ? "Next: Configure" : voiceMode === "ai_voice" ? "Start Translation" : "Next: Voice Setup"}
            </Text>
            <Ionicons name="chevron-forward" size={18} color="#FFF" />
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12, gap: 12 },
  backButton: { width: 36, height: 36, borderRadius: 18, backgroundColor: C.surface, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 18, fontWeight: "700", color: C.text },
  headerSubtitle: { fontSize: 12, color: C.textSecondary, marginTop: 2 },
  stepIndicator: { backgroundColor: C.accent + "20", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  stepIndicatorText: { fontSize: 12, fontWeight: "600", color: C.accent },
  stepsBar: { height: 3, backgroundColor: C.surface, marginHorizontal: 16, borderRadius: 2 },
  stepsBarFill: { height: "100%", backgroundColor: C.accent, borderRadius: 2 },
  content: { flex: 1 },
  contentContainer: { padding: 16, paddingBottom: 100 },
  stepContainer: { gap: 16 },
  sectionHeader: { marginBottom: 4 },
  stepTitle: { fontSize: 20, fontWeight: "700", color: C.text },
  stepSubtitle: { fontSize: 14, color: C.textSecondary, marginTop: 4, lineHeight: 20 },

  // Input
  inputGroup: { gap: 6 },
  inputLabel: { fontSize: 13, fontWeight: "600", color: C.textSecondary, textTransform: "uppercase", letterSpacing: 0.5 },
  urlInputRow: { flexDirection: "row", alignItems: "center", backgroundColor: C.surface, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, borderWidth: 1, borderColor: C.border },
  textInput: { flex: 1, fontSize: 15, color: C.text },
  textInputFull: { backgroundColor: C.surface, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: C.text, borderWidth: 1, borderColor: C.border },
  langScroll: { marginTop: 4 },
  langChip: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, backgroundColor: C.surface, marginRight: 8, borderWidth: 1, borderColor: C.border },
  langChipActive: { backgroundColor: C.accent + "15", borderColor: C.accent },
  langFlag: { fontSize: 16 },
  langChipText: { fontSize: 13, color: C.textSecondary, fontWeight: "500" },
  langChipTextActive: { color: C.accent },

  // Song Summary
  songSummary: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: C.surface, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: C.border },
  songSummaryIcon: { width: 44, height: 44, borderRadius: 10, backgroundColor: C.accent + "15", alignItems: "center", justifyContent: "center" },
  songSummaryTitle: { fontSize: 16, fontWeight: "600", color: C.text },
  songSummaryArtist: { fontSize: 13, color: C.textSecondary, marginTop: 2 },

  // Voice Mode
  voiceModeCard: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: C.surface, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: C.border, marginBottom: 10 },
  voiceModeIcon: { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  voiceModeTitle: { fontSize: 15, fontWeight: "600", color: C.text },
  voiceModeSubtitle: { fontSize: 12, color: C.textSecondary, marginTop: 2 },
  voiceModeDescription: { fontSize: 12, color: C.textMuted, marginTop: 6, lineHeight: 16 },
  tierBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  tierBadgeText: { fontSize: 10, fontWeight: "700" },
  radioOuter: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: C.textMuted, alignItems: "center", justifyContent: "center" },
  radioInner: { width: 12, height: 12, borderRadius: 6 },

  // Toggles
  toggleRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: C.border },
  toggleLabel: { fontSize: 14, fontWeight: "500", color: C.text },
  toggleDesc: { fontSize: 12, color: C.textMuted, marginTop: 2 },
  toggle: { width: 48, height: 28, borderRadius: 14, backgroundColor: C.surfaceElevated, justifyContent: "center", paddingHorizontal: 3 },
  toggleActive: { backgroundColor: C.accent },
  toggleKnob: { width: 22, height: 22, borderRadius: 11, backgroundColor: C.textMuted },
  toggleKnobActive: { backgroundColor: "#FFF", alignSelf: "flex-end" },

  // AI Voice Cards
  aiVoiceCard: { width: 120, backgroundColor: C.surface, borderRadius: 12, padding: 12, marginRight: 10, alignItems: "center", borderWidth: 1, borderColor: C.border },
  aiVoiceAvatar: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center", marginBottom: 8 },
  aiVoiceName: { fontSize: 13, fontWeight: "600", color: C.text },
  aiVoiceStyle: { fontSize: 10, color: C.accent, marginTop: 2 },
  aiVoiceDesc: { fontSize: 10, color: C.textMuted, marginTop: 4, textAlign: "center" },

  // Recording
  recordingArea: { alignItems: "center", paddingVertical: 24, gap: 16 },
  waveformContainer: { flexDirection: "row", alignItems: "center", gap: 2, height: 50 },
  waveformBar: { width: 3, borderRadius: 2, backgroundColor: C.textMuted },
  recordingTimer: { fontSize: 32, fontWeight: "700", color: C.text, fontVariant: ["tabular-nums"] },
  recordingHint: { fontSize: 13, color: C.textSecondary, textAlign: "center" },
  recordButtonOuter: { marginTop: 8 },
  recordButton: { width: 72, height: 72, borderRadius: 36, backgroundColor: C.error, alignItems: "center", justifyContent: "center", shadowColor: C.error, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6 },
  recordButtonActive: { backgroundColor: C.error },
  stopIcon: { width: 24, height: 24, borderRadius: 4, backgroundColor: "#FFF" },
  voiceReadyBanner: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: C.success + "15", paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10 },
  voiceReadyText: { fontSize: 14, fontWeight: "600", color: C.success },
  recordingActions: { flexDirection: "row", gap: 12, marginTop: 16 },

  // Lyrics
  lyricsScrollArea: { backgroundColor: C.surface, borderRadius: 12, padding: 16, borderWidth: 1, borderColor: C.border },
  lyricLine: { marginBottom: 12 },
  lyricOriginal: { fontSize: 13, color: C.textMuted, marginBottom: 2 },
  lyricTranslated: { fontSize: 15, fontWeight: "500", color: C.text },
  lyricsPreview: { backgroundColor: C.surface, borderRadius: 12, padding: 16, borderWidth: 1, borderColor: C.border },
  lyricsPreviewTitle: { fontSize: 14, fontWeight: "600", color: C.textSecondary, marginBottom: 12 },
  moreLines: { fontSize: 12, color: C.textMuted, textAlign: "center", marginTop: 8 },

  // Pre-translate
  preTranslateSection: { alignItems: "center", paddingVertical: 24, gap: 16 },
  preTranslateText: { fontSize: 14, color: C.textSecondary, textAlign: "center", lineHeight: 20 },

  // Processing
  processingVisual: { width: 120, height: 120, alignItems: "center", justifyContent: "center", marginBottom: 24 },
  processingOrb: { width: 80, height: 80, borderRadius: 40, backgroundColor: C.accent + "15", alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: C.accent + "40" },
  orbitDot: { position: "absolute", width: 8, height: 8, borderRadius: 4, backgroundColor: C.accent },
  processingTitle: { fontSize: 16, fontWeight: "600", color: C.text, textAlign: "center" },
  processingSubtitle: { fontSize: 13, color: C.textSecondary, textAlign: "center", marginTop: 8, lineHeight: 18 },
  progressBarContainer: { width: "80%", height: 6, backgroundColor: C.surface, borderRadius: 3, marginTop: 20, overflow: "hidden" },
  progressBar: { height: "100%", backgroundColor: C.accent, borderRadius: 3 },
  progressText: { fontSize: 13, fontWeight: "600", color: C.accent, marginTop: 8 },
  pipelineSteps: { flexDirection: "row", justifyContent: "space-between", width: "90%", marginTop: 24 },
  pipelineStep: { alignItems: "center", gap: 4 },
  pipelineStepDot: { width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: C.textMuted, alignItems: "center", justifyContent: "center" },
  pipelineStepText: { fontSize: 10, color: C.textMuted, fontWeight: "500" },

  // Result
  resultHeader: { alignItems: "center", paddingVertical: 16, gap: 8 },
  resultSuccessIcon: { marginBottom: 8 },
  resultTitle: { fontSize: 22, fontWeight: "700", color: C.text },
  resultSubtitle: { fontSize: 14, color: C.textSecondary, textAlign: "center" },
  qualityCard: { backgroundColor: C.surface, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: C.border },
  qualityTitle: { fontSize: 14, fontWeight: "600", color: C.textSecondary, marginBottom: 12 },
  qualityGrid: { flexDirection: "row", justifyContent: "space-between" },
  qualityItem: { alignItems: "center", flex: 1 },
  qualityValue: { fontSize: 18, fontWeight: "700", color: C.success },
  qualityLabel: { fontSize: 10, color: C.textMuted, marginTop: 4, textAlign: "center" },
  resultActions: { gap: 12, marginTop: 16 },

  // Buttons
  primaryButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: C.accent, paddingVertical: 14, paddingHorizontal: 20, borderRadius: 12 },
  primaryButtonText: { fontSize: 15, fontWeight: "600", color: "#FFF" },
  secondaryButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: C.accent + "15", paddingVertical: 12, paddingHorizontal: 16, borderRadius: 12 },
  secondaryButtonText: { fontSize: 14, fontWeight: "500", color: C.accent },
  ghostButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 12 },
  ghostButtonText: { fontSize: 14, color: C.textSecondary },

  // Bottom Action
  bottomAction: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 12, borderTopWidth: 1, borderTopColor: C.border, backgroundColor: C.bg },
  backStepButton: { flexDirection: "row", alignItems: "center", gap: 4, paddingVertical: 12, paddingHorizontal: 12 },
  backStepText: { fontSize: 14, color: C.textSecondary },

  // Dialect Picker
  dialectChip: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, backgroundColor: C.surface, marginRight: 10, borderWidth: 1, borderColor: C.border, minWidth: 160 },
  dialectChipActive: { backgroundColor: C.accent + "12", borderColor: C.accent },
  dialectFlag: { fontSize: 20 },
  dialectLabel: { fontSize: 13, fontWeight: "600", color: C.text },
  dialectLabelActive: { color: C.accent },
  dialectDesc: { fontSize: 11, color: C.textMuted, marginTop: 1 },

  // Pitch-Matching Comparison
  comparisonCard: { backgroundColor: C.surface, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: C.border },
  comparisonTitle: { fontSize: 16, fontWeight: "700", color: C.text },
  comparisonSubtitle: { fontSize: 12, color: C.textSecondary, marginTop: 2, marginBottom: 12 },
  comparisonModes: { flexDirection: "row", gap: 6, marginBottom: 16 },
  comparisonModeBtn: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16, backgroundColor: C.surfaceElevated },
  comparisonModeBtnActive: { backgroundColor: C.accent },
  comparisonModeText: { fontSize: 11, fontWeight: "500", color: C.textSecondary },
  comparisonModeTextActive: { color: "#FFF" },
  playbackControls: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 24, marginBottom: 12 },
  playPauseBtn: { width: 48, height: 48, borderRadius: 24, backgroundColor: C.accent, alignItems: "center", justifyContent: "center", shadowColor: C.accent, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  playbackProgressBar: { height: 4, backgroundColor: C.surfaceElevated, borderRadius: 2, overflow: "hidden" },
  playbackProgressFill: { height: "100%", backgroundColor: C.accent, borderRadius: 2 },
  playbackTime: { fontSize: 11, color: C.textMuted, fontVariant: ["tabular-nums"] },

  // Share Cover Modal
  shareModalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "flex-end" },
  shareModalContent: { backgroundColor: C.bg, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40, maxHeight: "85%" },
  shareModalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  shareModalTitle: { fontSize: 20, fontWeight: "700", color: C.text },
  sharePreviewCard: { alignItems: "center", backgroundColor: C.surface, borderRadius: 16, padding: 24, borderWidth: 1, borderColor: C.border },
  sharePreviewIcon: { width: 64, height: 64, borderRadius: 32, backgroundColor: C.accent + "15", alignItems: "center", justifyContent: "center", marginBottom: 12 },
  sharePreviewTitle: { fontSize: 18, fontWeight: "700", color: C.text },
  sharePreviewArtist: { fontSize: 13, color: C.textSecondary, marginTop: 4 },
  sharePreviewDesc: { fontSize: 12, color: C.textMuted, marginTop: 8, textAlign: "center" },
});
