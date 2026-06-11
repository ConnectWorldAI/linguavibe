/**
 * Generate Learning Song - AI Music Generation Prototype
 * Creates short learning songs in the user's target language with synchronized lyrics.
 * Uses ElevenLabs Music API pattern (simulated for POC).
 * Features: Topic selection, language picker, generation progress, synced dual-language lyrics player.
 */
import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Animated,
  Platform,
  Dimensions,
  FlatList,
  ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useMusicPlayer } from "@/lib/music-player-context";
import { trpc } from "@/lib/trpc";
import * as Haptics from "expo-haptics";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// ─── TYPES ──────────────────────────────────────────────────────────────────

interface LyricLine {
  id: string;
  startTime: number;
  endTime: number;
  original: string;
  translated: string;
  phonetic?: string;
  vocabHighlights?: { word: string; meaning: string }[];
}

interface GeneratedSong {
  id: string;
  title: string;
  topic: string;
  language: string;
  flag: string;
  genre: string;
  duration: string;
  level: string;
  lyrics: LyricLine[];
  coverGradient: string[];
}

// ─── CONSTANTS ──────────────────────────────────────────────────────────────

const LANGUAGES = [
  { id: "es", name: "Spanish", flag: "🇪🇸", genres: ["Reggaeton", "Bachata", "Salsa"] },
  { id: "fr", name: "French", flag: "🇫🇷", genres: ["Chanson Pop", "French House", "Rap"] },
  { id: "ja", name: "Japanese", flag: "🇯🇵", genres: ["J-Pop", "City Pop", "Anime OST"] },
  { id: "ko", name: "Korean", flag: "🇰🇷", genres: ["K-Pop", "Ballad", "Hip-Hop"] },
  { id: "pt", name: "Portuguese", flag: "🇧🇷", genres: ["Funk Carioca", "Bossa Nova", "Sertanejo"] },
  { id: "de", name: "German", flag: "🇩🇪", genres: ["Schlager", "Techno", "Indie Pop"] },
  { id: "ar", name: "Arabic", flag: "🇪🇬", genres: ["Shaabi", "Khaleeji", "Rai"] },
  { id: "zh", name: "Chinese", flag: "🇨🇳", genres: ["C-Pop", "Mandopop", "R&B"] },
  { id: "it", name: "Italian", flag: "🇮🇹", genres: ["Pop Italiano", "Opera Pop", "Indie"] },
  { id: "hi", name: "Hindi", flag: "🇮🇳", genres: ["Bollywood", "Indie Pop", "Bhangra"] },
];

const TOPICS = [
  { id: "greetings", label: "Greetings & Introductions", icon: "👋", level: "A1" },
  { id: "food", label: "Food & Ordering", icon: "🍽️", level: "A1" },
  { id: "directions", label: "Directions & Travel", icon: "🗺️", level: "A2" },
  { id: "emotions", label: "Emotions & Feelings", icon: "💭", level: "A2" },
  { id: "daily-routine", label: "Daily Routine", icon: "☀️", level: "A1" },
  { id: "shopping", label: "Shopping & Numbers", icon: "🛍️", level: "A1" },
  { id: "family", label: "Family & Relationships", icon: "👨‍👩‍👧", level: "A2" },
  { id: "weather", label: "Weather & Seasons", icon: "🌤️", level: "A2" },
  { id: "past-tense", label: "Past Tense Stories", icon: "📖", level: "B1" },
  { id: "slang", label: "Slang & Idioms", icon: "🔥", level: "B1" },
  { id: "business", label: "Business & Formal", icon: "💼", level: "B2" },
  { id: "custom", label: "Custom Topic...", icon: "✏️", level: "Any" },
];

const GENERATION_STAGES = [
  "Composing melody...",
  "Writing lyrics in target language...",
  "Adding cultural references...",
  "Generating vocals...",
  "Synchronizing lyrics...",
  "Mastering audio...",
  "Preparing translation...",
];

// ─── MOCK GENERATED SONGS ──────────────────────────────────────────────────

const MOCK_GENERATED: GeneratedSong[] = [
  {
    id: "gen-1",
    title: "Buenos Días, Amigos",
    topic: "greetings",
    language: "Spanish",
    flag: "🇪🇸",
    genre: "Reggaeton",
    duration: "2:15",
    level: "A1",
    coverGradient: ["#FF6B35", "#FF1744"],
    lyrics: [
      { id: "1", startTime: 0, endTime: 4, original: "Buenos días, ¿cómo estás?", translated: "Good morning, how are you?", phonetic: "bweh-nos dee-as, koh-mo es-tas", vocabHighlights: [{ word: "buenos días", meaning: "good morning" }, { word: "cómo estás", meaning: "how are you" }] },
      { id: "2", startTime: 4, endTime: 8, original: "Estoy bien, gracias, ¿y tú?", translated: "I'm fine, thanks, and you?", phonetic: "es-toy bee-en, gra-see-as, ee too", vocabHighlights: [{ word: "estoy bien", meaning: "I'm fine" }, { word: "gracias", meaning: "thanks" }] },
      { id: "3", startTime: 8, endTime: 12, original: "Me llamo Carlos, mucho gusto", translated: "My name is Carlos, nice to meet you", phonetic: "meh ya-mo kar-los, moo-cho goos-to", vocabHighlights: [{ word: "me llamo", meaning: "my name is" }, { word: "mucho gusto", meaning: "nice to meet you" }] },
      { id: "4", startTime: 12, endTime: 16, original: "¿De dónde eres? Soy de aquí", translated: "Where are you from? I'm from here", phonetic: "deh don-deh eh-res, soy deh ah-kee", vocabHighlights: [{ word: "de dónde eres", meaning: "where are you from" }, { word: "soy de", meaning: "I'm from" }] },
      { id: "5", startTime: 16, endTime: 20, original: "Encantado, nos vemos pronto", translated: "Delighted, see you soon", phonetic: "en-kan-ta-do, nos veh-mos pron-to", vocabHighlights: [{ word: "encantado", meaning: "delighted" }, { word: "nos vemos", meaning: "see you" }] },
      { id: "6", startTime: 20, endTime: 24, original: "Adiós, hasta luego, chao", translated: "Goodbye, see you later, bye", phonetic: "ah-dee-os, as-ta lweh-go, chow", vocabHighlights: [{ word: "adiós", meaning: "goodbye" }, { word: "hasta luego", meaning: "see you later" }] },
    ],
  },
  {
    id: "gen-2",
    title: "おはよう、元気？",
    topic: "greetings",
    language: "Japanese",
    flag: "🇯🇵",
    genre: "J-Pop",
    duration: "2:30",
    level: "A1",
    coverGradient: ["#FF69B4", "#9B59B6"],
    lyrics: [
      { id: "1", startTime: 0, endTime: 4, original: "おはようございます", translated: "Good morning (formal)", phonetic: "ohayou gozaimasu", vocabHighlights: [{ word: "おはよう", meaning: "good morning" }] },
      { id: "2", startTime: 4, endTime: 8, original: "元気ですか？元気です！", translated: "How are you? I'm fine!", phonetic: "genki desu ka? genki desu!", vocabHighlights: [{ word: "元気", meaning: "fine/healthy" }, { word: "ですか", meaning: "question marker" }] },
      { id: "3", startTime: 8, endTime: 12, original: "はじめまして、よろしく", translated: "Nice to meet you, please be kind", phonetic: "hajimemashite, yoroshiku", vocabHighlights: [{ word: "はじめまして", meaning: "nice to meet you" }, { word: "よろしく", meaning: "please (be kind)" }] },
      { id: "4", startTime: 12, endTime: 16, original: "私の名前は... です", translated: "My name is...", phonetic: "watashi no namae wa... desu", vocabHighlights: [{ word: "名前", meaning: "name" }, { word: "私", meaning: "I/me" }] },
      { id: "5", startTime: 16, endTime: 20, original: "さようなら、また明日", translated: "Goodbye, see you tomorrow", phonetic: "sayounara, mata ashita", vocabHighlights: [{ word: "さようなら", meaning: "goodbye" }, { word: "明日", meaning: "tomorrow" }] },
    ],
  },
];

// ─── COMPONENT ──────────────────────────────────────────────────────────────

export default function GenerateLearningSongScreen() {
  const colors = useColors();
  const musicPlayer = useMusicPlayer();
  const [step, setStep] = useState<"topic" | "language" | "generating" | "player">("topic");
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [customTopic, setCustomTopic] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState<string | null>(null);
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [generationStage, setGenerationStage] = useState("");
  const [generatedSong, setGeneratedSong] = useState<GeneratedSong | null>(null);
  const [currentLineIndex, setCurrentLineIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showPhonetic, setShowPhonetic] = useState(true);
  const [showVocab, setShowVocab] = useState(true);
  const [previousSongs, setPreviousSongs] = useState<GeneratedSong[]>(MOCK_GENERATED);
  const progressAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Live API generation with polling
  const generateMutation = trpc.musicGeneration.generate.useMutation();
  const [activeJobId, setActiveJobId] = useState<string | null>(null);

  const { data: jobStatus } = trpc.musicGeneration.getStatus.useQuery(
    { jobId: activeJobId || "" },
    { enabled: !!activeJobId && step === "generating", refetchInterval: 2000 }
  );

  // Handle job status updates
  useEffect(() => {
    if (!jobStatus || !jobStatus.found) return;
    setGenerationProgress(jobStatus.progress);
    setGenerationStage(jobStatus.stage);

    if (jobStatus.status === "completed" && jobStatus.result) {
      const lang = LANGUAGES.find(l => l.id === selectedLanguage);
      const topic = TOPICS.find(t => t.id === selectedTopic);
      const result = jobStatus.result;
      const completedSong: GeneratedSong = {
        id: `gen-${Date.now()}`,
        title: result.title || `${topic?.label || "Learning"} Song`,
        topic: selectedTopic || "greetings",
        language: lang?.name || "Spanish",
        flag: lang?.flag || "🇪🇸",
        genre: selectedGenre || lang?.genres[0] || "Pop",
        duration: `${Math.floor((result.duration || 120000) / 60000)}:${String(Math.floor(((result.duration || 120000) % 60000) / 1000)).padStart(2, "0")}`,
        level: topic?.level || "A1",
        coverGradient: lang?.id === "ja" ? ["#FF69B4", "#9B59B6"] : ["#FF6B35", "#FF1744"],
        lyrics: (result.syncedLyrics || []).map((line: any, i: number) => ({
          id: `line-${i}`,
          startTime: line.startTime || i * 4000,
          endTime: line.endTime || (i + 1) * 4000,
          original: line.original || "",
          translated: line.translated || "",
          phonetic: "",
          vocabHighlights: (line.words || []).slice(0, 3).map((w: any) => ({ word: w.word, meaning: w.translation })),
        })),
      };
      // Store audioUrl for playback
      (completedSong as any).audioUrl = result.audioUrl;
      setGeneratedSong(completedSong);
      setActiveJobId(null);
      setTimeout(() => setStep("player"), 500);
    } else if (jobStatus.status === "failed") {
      // Fallback to mock on failure
      setActiveJobId(null);
      const lang = LANGUAGES.find(l => l.id === selectedLanguage);
      const mockSong: GeneratedSong = {
        id: `gen-${Date.now()}`,
        title: lang?.id === "es" ? "Buenos Días, Amigos" : `Learning Song`,
        topic: selectedTopic || "greetings",
        language: lang?.name || "Spanish",
        flag: lang?.flag || "🇪🇸",
        genre: selectedGenre || lang?.genres[0] || "Pop",
        duration: "2:15",
        level: "A1",
        coverGradient: ["#FF6B35", "#FF1744"],
        lyrics: MOCK_GENERATED[0]?.lyrics || [],
      };
      setGeneratedSong(mockSong);
      setTimeout(() => setStep("player"), 500);
    }
  }, [jobStatus]);

  // Playback simulation
  useEffect(() => {
    if (isPlaying && generatedSong) {
      const interval = setInterval(() => {
        setCurrentLineIndex((prev) => {
          if (prev >= generatedSong.lyrics.length - 1) {
            setIsPlaying(false);
            return 0;
          }
          return prev + 1;
        });
      }, 4000);
      return () => clearInterval(interval);
    }
  }, [isPlaying, generatedSong]);

  // Pulse animation for generating state
  useEffect(() => {
    if (step === "generating") {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.1, duration: 600, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 0.9, duration: 600, useNativeDriver: true }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [step]);

  const startGeneration = async () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setStep("generating");
    setGenerationProgress(0);
    setGenerationStage("Initializing...");

    try {
      const lang = LANGUAGES.find(l => l.id === selectedLanguage);
      const topic = TOPICS.find(t => t.id === selectedTopic);
      const result = await generateMutation.mutateAsync({
        topic: selectedTopic === "custom" ? customTopic : (topic?.label || "greetings"),
        language: lang?.name || "Spanish",
        nativeLanguage: "English",
        difficulty: (topic?.level === "A1" || topic?.level === "A2") ? "beginner" : topic?.level === "B1" ? "intermediate" : "advanced",
        style: `${selectedGenre || "pop"}, catchy, educational`,
      });
      setActiveJobId(result.jobId);
    } catch (err) {
      // Fallback to simulated generation
      let stageIndex = 0;
      setGenerationStage(GENERATION_STAGES[0]);
      const interval = setInterval(() => {
        stageIndex++;
        if (stageIndex >= GENERATION_STAGES.length) {
          clearInterval(interval);
          setGenerationProgress(100);
          const lang = LANGUAGES.find(l => l.id === selectedLanguage);
          const mockSong: GeneratedSong = {
            id: `gen-${Date.now()}`,
            title: lang?.id === "es" ? "Buenos Días, Amigos" : `Learning Song`,
            topic: selectedTopic || "greetings",
            language: lang?.name || "Spanish",
            flag: lang?.flag || "🇪🇸",
            genre: selectedGenre || lang?.genres[0] || "Pop",
            duration: "2:15",
            level: "A1",
            coverGradient: ["#FF6B35", "#FF1744"],
            lyrics: MOCK_GENERATED[0]?.lyrics || [],
          };
          setGeneratedSong(mockSong);
          setTimeout(() => setStep("player"), 500);
        } else {
          setGenerationProgress(Math.round((stageIndex / GENERATION_STAGES.length) * 100));
          setGenerationStage(GENERATION_STAGES[stageIndex]);
        }
      }, 1200);
    }
  };

  const togglePlay = () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsPlaying(!isPlaying);
    if (generatedSong && !isPlaying) {
      const audioUrl = (generatedSong as any).audioUrl || undefined;
      musicPlayer.play({
        id: generatedSong.id,
        title: generatedSong.title,
        artist: `AI Generated • ${generatedSong.genre}`,
        artworkColor: generatedSong.coverGradient[0],
        language: generatedSong.language,
        languageFlag: generatedSong.flag,
      }, audioUrl);
    } else {
      musicPlayer.pause();
    }
  };

  const generateAnother = () => {
    if (generatedSong) {
      setPreviousSongs(prev => [generatedSong, ...prev]);
    }
    setStep("topic");
    setSelectedTopic(null);
    setSelectedLanguage(null);
    setSelectedGenre(null);
    setGeneratedSong(null);
    setCurrentLineIndex(0);
    setIsPlaying(false);
  };

  // ─── STEP 1: TOPIC SELECTION ──────────────────────────────────────────────

  const renderTopicStep = () => (
    <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      <View style={styles.stepHeader}>
        <Text style={[styles.stepTitle, { color: colors.foreground }]}>🎵 Generate Learning Song</Text>
        <Text style={[styles.stepSubtitle, { color: colors.muted }]}>
          AI creates a catchy song to help you learn vocabulary and grammar. Choose a topic to get started.
        </Text>
      </View>

      <Text style={[styles.sectionLabel, { color: colors.foreground }]}>Choose a Topic</Text>
      <View style={styles.topicGrid}>
        {TOPICS.map((topic) => (
          <TouchableOpacity
            key={topic.id}
            style={[
              styles.topicCard,
              { backgroundColor: colors.surface, borderColor: selectedTopic === topic.id ? colors.primary : colors.border },
              selectedTopic === topic.id && { borderWidth: 2 },
            ]}
            onPress={() => {
              setSelectedTopic(topic.id);
              if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
            activeOpacity={0.7}
          >
            <Text style={styles.topicIcon}>{topic.icon}</Text>
            <Text style={[styles.topicLabel, { color: colors.foreground }]} numberOfLines={2}>{topic.label}</Text>
            <Text style={[styles.topicLevel, { color: colors.muted }]}>{topic.level}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {selectedTopic === "custom" && (
        <View style={[styles.customInput, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <TextInput
            style={[styles.customInputText, { color: colors.foreground }]}
            placeholder="e.g., ordering coffee, asking for directions..."
            placeholderTextColor={colors.muted}
            value={customTopic}
            onChangeText={setCustomTopic}
          />
        </View>
      )}

      {selectedTopic && (
        <TouchableOpacity
          style={[styles.nextBtn, { backgroundColor: colors.primary }]}
          onPress={() => setStep("language")}
          activeOpacity={0.8}
        >
          <Text style={styles.nextBtnText}>Next: Choose Language</Text>
          <Ionicons name="arrow-forward" size={18} color="#fff" />
        </TouchableOpacity>
      )}

      {/* Previously Generated */}
      {previousSongs.length > 0 && (
        <View style={styles.previousSection}>
          <Text style={[styles.sectionLabel, { color: colors.foreground }]}>Previously Generated</Text>
          {previousSongs.map((song) => (
            <TouchableOpacity
              key={song.id}
              style={[styles.previousRow, { backgroundColor: colors.surface }]}
              onPress={() => {
                setGeneratedSong(song);
                setStep("player");
              }}
              activeOpacity={0.7}
            >
              <View style={[styles.previousIcon, { backgroundColor: song.coverGradient[0] }]}>
                <Ionicons name="musical-notes" size={18} color="#fff" />
              </View>
              <View style={styles.previousInfo}>
                <Text style={[styles.previousTitle, { color: colors.foreground }]}>{song.title}</Text>
                <Text style={[styles.previousMeta, { color: colors.muted }]}>{song.flag} {song.language} • {song.genre} • {song.level}</Text>
              </View>
              <Ionicons name="play-circle" size={28} color={colors.primary} />
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* API Info */}
      <View style={[styles.apiInfo, { backgroundColor: colors.surface }]}>
        <Text style={[styles.apiInfoTitle, { color: colors.foreground }]}>⚡ Powered by AI Music Generation</Text>
        <Text style={[styles.apiInfoText, { color: colors.muted }]}>
          Songs are generated using Suno AI music models. Each song is unique, culturally authentic, and designed specifically for language learning with synchronized dual-language lyrics.
        </Text>
        <View style={styles.apiInfoStats}>
          <View style={styles.apiInfoStat}>
            <Text style={[styles.apiStatValue, { color: colors.primary }]}>$0.15</Text>
            <Text style={[styles.apiStatLabel, { color: colors.muted }]}>per minute</Text>
          </View>
          <View style={styles.apiInfoStat}>
            <Text style={[styles.apiStatValue, { color: colors.primary }]}>10+</Text>
            <Text style={[styles.apiStatLabel, { color: colors.muted }]}>languages</Text>
          </View>
          <View style={styles.apiInfoStat}>
            <Text style={[styles.apiStatValue, { color: colors.primary }]}>30+</Text>
            <Text style={[styles.apiStatLabel, { color: colors.muted }]}>genres</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );

  // ─── STEP 2: LANGUAGE & GENRE ──────────────────────────────────────────────

  const renderLanguageStep = () => {
    const selectedLang = LANGUAGES.find(l => l.id === selectedLanguage);
    return (
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.stepHeader}>
          <Text style={[styles.stepTitle, { color: colors.foreground }]}>🌍 Choose Language & Genre</Text>
          <Text style={[styles.stepSubtitle, { color: colors.muted }]}>
            Select the language you want to learn and a musical genre that fits the culture.
          </Text>
        </View>

        <Text style={[styles.sectionLabel, { color: colors.foreground }]}>Target Language</Text>
        <View style={styles.languageGrid}>
          {LANGUAGES.map((lang) => (
            <TouchableOpacity
              key={lang.id}
              style={[
                styles.languageCard,
                { backgroundColor: colors.surface, borderColor: selectedLanguage === lang.id ? colors.primary : colors.border },
                selectedLanguage === lang.id && { borderWidth: 2 },
              ]}
              onPress={() => {
                setSelectedLanguage(lang.id);
                setSelectedGenre(lang.genres[0]);
                if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.langFlag}>{lang.flag}</Text>
              <Text style={[styles.langName, { color: colors.foreground }]}>{lang.name}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {selectedLang && (
          <>
            <Text style={[styles.sectionLabel, { color: colors.foreground, marginTop: 20 }]}>Musical Genre</Text>
            <View style={styles.genreRow}>
              {selectedLang.genres.map((genre) => (
                <TouchableOpacity
                  key={genre}
                  style={[
                    styles.genreChip,
                    { backgroundColor: selectedGenre === genre ? colors.primary : colors.surface, borderColor: colors.border },
                  ]}
                  onPress={() => setSelectedGenre(genre)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.genreChipText, { color: selectedGenre === genre ? "#fff" : colors.foreground }]}>{genre}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        {selectedLanguage && selectedGenre && (
          <TouchableOpacity
            style={[styles.generateBtn, { backgroundColor: colors.primary }]}
            onPress={startGeneration}
            activeOpacity={0.8}
          >
            <Ionicons name="sparkles" size={20} color="#fff" />
            <Text style={styles.generateBtnText}>Generate Song</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity style={styles.backBtn} onPress={() => setStep("topic")}>
          <Ionicons name="arrow-back" size={18} color={colors.muted} />
          <Text style={[styles.backBtnText, { color: colors.muted }]}>Back to Topics</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  };

  // ─── STEP 3: GENERATING ──────────────────────────────────────────────────

  const renderGenerating = () => (
    <View style={styles.generatingContainer}>
      <Animated.View style={[styles.generatingIcon, { transform: [{ scale: pulseAnim }] }]}>
        <Text style={styles.generatingEmoji}>🎵</Text>
      </Animated.View>
      <Text style={[styles.generatingTitle, { color: colors.foreground }]}>Creating Your Song...</Text>
      <Text style={[styles.generatingStage, { color: colors.muted }]}>{generationStage}</Text>
      <View style={[styles.progressBar, { backgroundColor: colors.surface }]}>
        <View style={[styles.progressFill, { width: `${generationProgress}%`, backgroundColor: colors.primary }]} />
      </View>
      <Text style={[styles.progressText, { color: colors.muted }]}>{generationProgress}%</Text>
      <View style={[styles.generatingInfo, { backgroundColor: colors.surface }]}>
        <Text style={[styles.generatingInfoText, { color: colors.muted }]}>
          🧠 AI is composing a unique song in {LANGUAGES.find(l => l.id === selectedLanguage)?.name || "your target language"} using {selectedGenre || "authentic"} style with vocabulary from "{TOPICS.find(t => t.id === selectedTopic)?.label || "your topic"}"
        </Text>
      </View>
    </View>
  );

  // ─── STEP 4: PLAYER ──────────────────────────────────────────────────────

  const renderPlayer = () => {
    if (!generatedSong) return null;
    const currentLine = generatedSong.lyrics[currentLineIndex];

    return (
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Song Header */}
        <View style={[styles.playerHeader, { backgroundColor: generatedSong.coverGradient[0] }]}>
          <View style={styles.playerHeaderOverlay}>
            <Text style={styles.playerGenre}>{generatedSong.flag} {generatedSong.genre}</Text>
            <Text style={styles.playerTitle}>{generatedSong.title}</Text>
            <Text style={styles.playerMeta}>AI Generated • {generatedSong.level} • {generatedSong.duration}</Text>
          </View>
        </View>

        {/* Controls */}
        <View style={styles.controlsRow}>
          <TouchableOpacity
            style={[styles.playBtn, { backgroundColor: colors.primary }]}
            onPress={togglePlay}
            activeOpacity={0.8}
          >
            <Ionicons name={isPlaying ? "pause" : "play"} size={28} color="#fff" />
          </TouchableOpacity>
          <View style={styles.controlToggles}>
            <TouchableOpacity
              style={[styles.toggleChip, { backgroundColor: showPhonetic ? colors.primary + "20" : colors.surface }]}
              onPress={() => setShowPhonetic(!showPhonetic)}
            >
              <Text style={[styles.toggleChipText, { color: showPhonetic ? colors.primary : colors.muted }]}>Phonetic</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggleChip, { backgroundColor: showVocab ? colors.primary + "20" : colors.surface }]}
              onPress={() => setShowVocab(!showVocab)}
            >
              <Text style={[styles.toggleChipText, { color: showVocab ? colors.primary : colors.muted }]}>Vocab</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Synced Lyrics */}
        <View style={styles.lyricsSection}>
          <Text style={[styles.sectionLabel, { color: colors.foreground }]}>Synchronized Lyrics</Text>
          {generatedSong.lyrics.map((line, index) => (
            <View
              key={line.id}
              style={[
                styles.lyricLine,
                { backgroundColor: index === currentLineIndex ? colors.primary + "15" : "transparent", borderLeftColor: index === currentLineIndex ? colors.primary : "transparent" },
              ]}
            >
              <Text style={[styles.lyricOriginal, { color: colors.foreground, fontWeight: index === currentLineIndex ? "700" : "400" }]}>
                {line.original}
              </Text>
              <Text style={[styles.lyricTranslated, { color: colors.muted }]}>
                {line.translated}
              </Text>
              {showPhonetic && line.phonetic && (
                <Text style={[styles.lyricPhonetic, { color: colors.primary }]}>
                  /{line.phonetic}/
                </Text>
              )}
              {showVocab && line.vocabHighlights && line.vocabHighlights.length > 0 && (
                <View style={styles.vocabRow}>
                  {line.vocabHighlights.map((v, vi) => (
                    <View key={vi} style={[styles.vocabChip, { backgroundColor: colors.primary + "10" }]}>
                      <Text style={[styles.vocabWord, { color: colors.primary }]}>{v.word}</Text>
                      <Text style={[styles.vocabMeaning, { color: colors.muted }]}> = {v.meaning}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          ))}
        </View>

        {/* Actions */}
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: colors.surface }]}
            onPress={generateAnother}
            activeOpacity={0.7}
          >
            <Ionicons name="refresh" size={20} color={colors.primary} />
            <Text style={[styles.actionBtnText, { color: colors.primary }]}>Generate Another</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: colors.surface }]}
            onPress={() => {
              if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            }}
            activeOpacity={0.7}
          >
            <Ionicons name="bookmark-outline" size={20} color={colors.primary} />
            <Text style={[styles.actionBtnText, { color: colors.primary }]}>Save to Library</Text>
          </TouchableOpacity>
        </View>

        {/* Back */}
        <TouchableOpacity style={styles.backBtn} onPress={generateAnother}>
          <Ionicons name="arrow-back" size={18} color={colors.muted} />
          <Text style={[styles.backBtnText, { color: colors.muted }]}>New Song</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  };

  // ─── MAIN RENDER ──────────────────────────────────────────────────────────

  return (
    <ScreenContainer>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBack}>
          <Ionicons name="arrow-back" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>
          {step === "topic" ? "Generate Song" : step === "language" ? "Language & Genre" : step === "generating" ? "Creating..." : "Your Song"}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      {step === "topic" && renderTopicStep()}
      {step === "language" && renderLanguageStep()}
      {step === "generating" && renderGenerating()}
      {step === "player" && renderPlayer()}
    </ScreenContainer>
  );
}

// ─── STYLES ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  scrollContent: { paddingBottom: 100 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 0.5 },
  headerBack: { width: 40 },
  headerTitle: { fontSize: 17, fontWeight: "600" },
  stepHeader: { padding: 20, alignItems: "center" },
  stepTitle: { fontSize: 24, fontWeight: "700", marginBottom: 8 },
  stepSubtitle: { fontSize: 14, textAlign: "center", lineHeight: 20 },
  sectionLabel: { fontSize: 16, fontWeight: "600", marginHorizontal: 20, marginBottom: 12, marginTop: 8 },
  topicGrid: { flexDirection: "row", flexWrap: "wrap", paddingHorizontal: 16, gap: 10 },
  topicCard: { width: (SCREEN_WIDTH - 52) / 3, padding: 12, borderRadius: 12, alignItems: "center", borderWidth: 1 },
  topicIcon: { fontSize: 24, marginBottom: 6 },
  topicLabel: { fontSize: 11, fontWeight: "500", textAlign: "center" },
  topicLevel: { fontSize: 10, marginTop: 4 },
  customInput: { marginHorizontal: 20, marginTop: 12, borderRadius: 12, borderWidth: 1, padding: 14 },
  customInputText: { fontSize: 15 },
  nextBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", marginHorizontal: 20, marginTop: 20, padding: 16, borderRadius: 14, gap: 8 },
  nextBtnText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  previousSection: { marginTop: 30, paddingBottom: 20 },
  previousRow: { flexDirection: "row", alignItems: "center", marginHorizontal: 20, marginBottom: 10, padding: 14, borderRadius: 12 },
  previousIcon: { width: 40, height: 40, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  previousInfo: { flex: 1, marginLeft: 12 },
  previousTitle: { fontSize: 15, fontWeight: "600" },
  previousMeta: { fontSize: 12, marginTop: 2 },
  apiInfo: { marginHorizontal: 20, marginTop: 24, padding: 16, borderRadius: 14 },
  apiInfoTitle: { fontSize: 14, fontWeight: "600", marginBottom: 8 },
  apiInfoText: { fontSize: 13, lineHeight: 18 },
  apiInfoStats: { flexDirection: "row", marginTop: 12, gap: 20 },
  apiInfoStat: { alignItems: "center" },
  apiStatValue: { fontSize: 18, fontWeight: "700" },
  apiStatLabel: { fontSize: 11, marginTop: 2 },
  languageGrid: { flexDirection: "row", flexWrap: "wrap", paddingHorizontal: 16, gap: 10 },
  languageCard: { width: (SCREEN_WIDTH - 52) / 3, padding: 14, borderRadius: 12, alignItems: "center", borderWidth: 1 },
  langFlag: { fontSize: 28, marginBottom: 6 },
  langName: { fontSize: 12, fontWeight: "500" },
  genreRow: { flexDirection: "row", flexWrap: "wrap", paddingHorizontal: 20, gap: 8 },
  genreChip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, borderWidth: 1 },
  genreChipText: { fontSize: 14, fontWeight: "500" },
  generateBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", marginHorizontal: 20, marginTop: 24, padding: 16, borderRadius: 14, gap: 8 },
  generateBtnText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  backBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", marginTop: 16, gap: 6, padding: 12 },
  backBtnText: { fontSize: 14 },
  generatingContainer: { flex: 1, alignItems: "center", justifyContent: "center", padding: 40 },
  generatingIcon: { marginBottom: 20 },
  generatingEmoji: { fontSize: 64 },
  generatingTitle: { fontSize: 22, fontWeight: "700", marginBottom: 8 },
  generatingStage: { fontSize: 15, marginBottom: 24 },
  progressBar: { width: "80%", height: 8, borderRadius: 4, overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 4 },
  progressText: { fontSize: 14, fontWeight: "600", marginTop: 8 },
  generatingInfo: { marginTop: 30, padding: 16, borderRadius: 12, width: "100%" },
  generatingInfoText: { fontSize: 13, lineHeight: 18, textAlign: "center" },
  playerHeader: { margin: 20, borderRadius: 16, overflow: "hidden" },
  playerHeaderOverlay: { padding: 24, backgroundColor: "rgba(0,0,0,0.3)" },
  playerGenre: { color: "#fff", fontSize: 13, opacity: 0.9, marginBottom: 4 },
  playerTitle: { color: "#fff", fontSize: 22, fontWeight: "700", marginBottom: 4 },
  playerMeta: { color: "#fff", fontSize: 13, opacity: 0.8 },
  controlsRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: 20, marginBottom: 16, gap: 16 },
  playBtn: { width: 56, height: 56, borderRadius: 28, alignItems: "center", justifyContent: "center" },
  controlToggles: { flexDirection: "row", gap: 8 },
  toggleChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 16 },
  toggleChipText: { fontSize: 13, fontWeight: "500" },
  lyricsSection: { paddingHorizontal: 20 },
  lyricLine: { padding: 14, borderRadius: 10, marginBottom: 8, borderLeftWidth: 3 },
  lyricOriginal: { fontSize: 16, lineHeight: 22 },
  lyricTranslated: { fontSize: 14, marginTop: 4, lineHeight: 20 },
  lyricPhonetic: { fontSize: 12, marginTop: 4, fontStyle: "italic" },
  vocabRow: { flexDirection: "row", flexWrap: "wrap", marginTop: 8, gap: 6 },
  vocabChip: { flexDirection: "row", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  vocabWord: { fontSize: 12, fontWeight: "600" },
  vocabMeaning: { fontSize: 12 },
  actionsRow: { flexDirection: "row", paddingHorizontal: 20, marginTop: 20, gap: 12 },
  actionBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", padding: 14, borderRadius: 12, gap: 8 },
  actionBtnText: { fontSize: 14, fontWeight: "500" },
});
