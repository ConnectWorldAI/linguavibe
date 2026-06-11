import { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  Switch,
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
import { Colors, Spacing, BorderRadius, FontSize } from "../constants/Colors";

// ─── Types ──────────────────────────────────────────────────────────────────
interface SoundLayer {
  id: string;
  name: string;
  icon: string;
  category: "nature" | "ambient" | "whisper";
  volume: number;
  isActive: boolean;
  color: string;
}

interface WhisperPack {
  id: string;
  language: string;
  flag: string;
  topic: string;
  phrases: string[];
  interval: number; // seconds between phrases
}

interface SleepTimer {
  duration: number; // minutes
  label: string;
}

// ─── Data ───────────────────────────────────────────────────────────────────
const SOUND_LAYERS: SoundLayer[] = [
  { id: "rain", name: "Rain", icon: "rainy", category: "nature", volume: 0.7, isActive: true, color: "#60A5FA" },
  { id: "ocean", name: "Ocean Waves", icon: "water", category: "nature", volume: 0.5, isActive: false, color: "#06B6D4" },
  { id: "forest", name: "Forest", icon: "leaf", category: "nature", volume: 0.4, isActive: false, color: "#22C55E" },
  { id: "thunder", name: "Thunder", icon: "flash", category: "nature", volume: 0.3, isActive: false, color: "#A78BFA" },
  { id: "wind", name: "Wind", icon: "cloudy", category: "nature", volume: 0.5, isActive: false, color: "#94A3B8" },
  { id: "birds", name: "Birds", icon: "sunny", category: "nature", volume: 0.3, isActive: false, color: "#FBBF24" },
  { id: "fire", name: "Fireplace", icon: "flame", category: "ambient", volume: 0.5, isActive: false, color: "#F97316" },
  { id: "cafe", name: "Cafe", icon: "cafe", category: "ambient", volume: 0.3, isActive: false, color: "#A16207" },
  { id: "train", name: "Train", icon: "train", category: "ambient", volume: 0.4, isActive: false, color: "#6B7280" },
  { id: "piano", name: "Soft Piano", icon: "musical-note", category: "ambient", volume: 0.4, isActive: false, color: "#EC4899" },
  { id: "whitenoise", name: "White Noise", icon: "radio", category: "ambient", volume: 0.3, isActive: false, color: "#E5E7EB" },
  { id: "crickets", name: "Crickets", icon: "moon", category: "nature", volume: 0.3, isActive: false, color: "#6366F1" },
];

const WHISPER_PACKS: WhisperPack[] = [
  {
    id: "spanish-travel",
    language: "Spanish",
    flag: "🇪🇸",
    topic: "Travel Phrases",
    phrases: [
      "¿Dónde está el hotel?... Where is the hotel?",
      "Me gustaría un café, por favor... I would like a coffee, please",
      "¿Cuánto cuesta esto?... How much does this cost?",
      "La playa es hermosa... The beach is beautiful",
      "Necesito un taxi... I need a taxi",
      "¿Puede ayudarme?... Can you help me?",
      "Quiero reservar una mesa... I want to reserve a table",
      "El vuelo sale a las ocho... The flight leaves at eight",
    ],
    interval: 45,
  },
  {
    id: "french-daily",
    language: "French",
    flag: "🇫🇷",
    topic: "Daily Essentials",
    phrases: [
      "Bonjour, comment allez-vous?... Hello, how are you?",
      "Je voudrais un croissant... I would like a croissant",
      "Où est la gare?... Where is the train station?",
      "Il fait beau aujourd'hui... The weather is nice today",
      "Merci beaucoup... Thank you very much",
      "Je m'appelle...  My name is...",
      "L'addition, s'il vous plaît... The check, please",
      "À quelle heure?... At what time?",
    ],
    interval: 45,
  },
  {
    id: "japanese-basics",
    language: "Japanese",
    flag: "🇯🇵",
    topic: "Basic Greetings",
    phrases: [
      "おはようございます... Good morning",
      "ありがとうございます... Thank you very much",
      "すみません... Excuse me",
      "お元気ですか?... How are you?",
      "はい、わかりました... Yes, I understand",
      "いくらですか?... How much is it?",
      "美味しいです... It's delicious",
      "また明日... See you tomorrow",
    ],
    interval: 50,
  },
  {
    id: "korean-polite",
    language: "Korean",
    flag: "🇰🇷",
    topic: "Polite Expressions",
    phrases: [
      "안녕하세요... Hello",
      "감사합니다... Thank you",
      "죄송합니다... I'm sorry",
      "맛있어요... It's delicious",
      "얼마예요?... How much is it?",
      "도와주세요... Please help me",
      "화장실 어디예요?... Where is the restroom?",
      "좋은 하루 되세요... Have a good day",
    ],
    interval: 50,
  },
  {
    id: "italian-romance",
    language: "Italian",
    flag: "🇮🇹",
    topic: "Romantic Phrases",
    phrases: [
      "Ti amo... I love you",
      "Sei bellissima... You are beautiful",
      "Andiamo a cena... Let's go to dinner",
      "Il tramonto è magnifico... The sunset is magnificent",
      "Vorrei un bicchiere di vino... I'd like a glass of wine",
      "Che bella serata... What a beautiful evening",
      "Mi manchi... I miss you",
      "Per sempre... Forever",
    ],
    interval: 50,
  },
];

const SLEEP_TIMERS: SleepTimer[] = [
  { duration: 15, label: "15 min" },
  { duration: 30, label: "30 min" },
  { duration: 45, label: "45 min" },
  { duration: 60, label: "1 hour" },
  { duration: 90, label: "1.5 hours" },
  { duration: 120, label: "2 hours" },
  { duration: 0, label: "All night" },
];

const STORAGE_KEY = "@sleep_sounds_config";

export default function SleepSoundsScreen() {
  const [layers, setLayers] = useState<SoundLayer[]>(SOUND_LAYERS);
  const [selectedWhisper, setSelectedWhisper] = useState<WhisperPack | null>(null);
  const [whisperEnabled, setWhisperEnabled] = useState(true);
  const [whisperVolume, setWhisperVolume] = useState(0.4);
  const [selectedTimer, setSelectedTimer] = useState<number>(30);
  const [isPlaying, setIsPlaying] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [currentPhrase, setCurrentPhrase] = useState("");
  const [showTimerPicker, setShowTimerPicker] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const phraseRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Animated breathing circle
  const breathScale = useSharedValue(1);
  const breathOpacity = useSharedValue(0.3);

  useEffect(() => {
    if (isPlaying) {
      breathScale.value = withRepeat(
        withSequence(
          withTiming(1.15, { duration: 4000, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 4000, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        false
      );
      breathOpacity.value = withRepeat(
        withSequence(
          withTiming(0.6, { duration: 4000, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.3, { duration: 4000, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        false
      );
    }
  }, [isPlaying]);

  const breathStyle = useAnimatedStyle(() => ({
    transform: [{ scale: breathScale.value }],
    opacity: breathOpacity.value,
  }));

  // Load saved config
  useEffect(() => {
    loadConfig();
  }, []);

  // Timer countdown
  useEffect(() => {
    if (isPlaying && timeRemaining !== null && timeRemaining > 0) {
      timerRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev !== null && prev <= 1) {
            handleStop();
            return 0;
          }
          return prev ? prev - 1 : null;
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying]);

  // Whisper phrase rotation
  useEffect(() => {
    if (isPlaying && whisperEnabled && selectedWhisper) {
      setCurrentPhrase(selectedWhisper.phrases[0]);
      let idx = 0;
      phraseRef.current = setInterval(() => {
        idx = (idx + 1) % (selectedWhisper?.phrases.length || 1);
        setCurrentPhrase(selectedWhisper?.phrases[idx] || "");
      }, (selectedWhisper?.interval || 45) * 1000);
    }
    return () => {
      if (phraseRef.current) clearInterval(phraseRef.current);
    };
  }, [isPlaying, whisperEnabled, selectedWhisper]);

  const loadConfig = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const config = JSON.parse(stored);
        if (config.layers) setLayers(config.layers);
        if (config.selectedWhisperId) {
          const wp = WHISPER_PACKS.find((p) => p.id === config.selectedWhisperId);
          if (wp) setSelectedWhisper(wp);
        }
        if (config.timer) setSelectedTimer(config.timer);
      } else {
        setSelectedWhisper(WHISPER_PACKS[0]);
      }
    } catch {
      setSelectedWhisper(WHISPER_PACKS[0]);
    }
  };

  const saveConfig = async () => {
    try {
      await AsyncStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          layers,
          selectedWhisperId: selectedWhisper?.id,
          timer: selectedTimer,
        })
      );
    } catch {}
  };

  const toggleLayer = (id: string) => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setLayers((prev) =>
      prev.map((l) => (l.id === id ? { ...l, isActive: !l.isActive } : l))
    );
  };

  const adjustVolume = (id: string, delta: number) => {
    setLayers((prev) =>
      prev.map((l) =>
        l.id === id ? { ...l, volume: Math.max(0, Math.min(1, l.volume + delta)) } : l
      )
    );
  };

  const handlePlay = () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsPlaying(true);
    if (selectedTimer > 0) {
      setTimeRemaining(selectedTimer * 60);
    } else {
      setTimeRemaining(null);
    }
    saveConfig();
  };

  const handleStop = () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsPlaying(false);
    setTimeRemaining(null);
    setCurrentPhrase("");
    if (timerRef.current) clearInterval(timerRef.current);
    if (phraseRef.current) clearInterval(phraseRef.current);
  };

  const formatTimeRemaining = (seconds: number): string => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) return `${hrs}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const activeLayers = layers.filter((l) => l.isActive);

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Sleep & Learn</Text>
          <Text style={styles.headerSubtitle}>Passive Language Absorption</Text>
        </View>
        <TouchableOpacity style={styles.headerBtn} onPress={() => setShowTimerPicker(!showTimerPicker)}>
          <Ionicons name="timer-outline" size={22} color={Colors.secondary} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Breathing Circle / Now Playing */}
        <View style={styles.visualSection}>
          <Animated.View style={[styles.breathCircle, breathStyle]}>
            <View style={styles.breathInner}>
              {isPlaying ? (
                <>
                  <Ionicons name="moon" size={32} color={Colors.secondary} />
                  <Text style={styles.breathText}>Relaxing...</Text>
                  {timeRemaining !== null && (
                    <Text style={styles.timerText}>{formatTimeRemaining(timeRemaining)}</Text>
                  )}
                </>
              ) : (
                <>
                  <Ionicons name="moon-outline" size={32} color={Colors.textSecondary} />
                  <Text style={styles.breathTextIdle}>Tap play to begin</Text>
                </>
              )}
            </View>
          </Animated.View>

          {/* Current Whisper Phrase */}
          {isPlaying && currentPhrase && (
            <View style={styles.phraseCard}>
              <Ionicons name="chatbubble-ellipses-outline" size={14} color={Colors.secondary} />
              <Text style={styles.phraseText} numberOfLines={2}>{currentPhrase}</Text>
            </View>
          )}
        </View>

        {/* Play/Stop Button */}
        <View style={styles.playSection}>
          <TouchableOpacity
            style={[styles.playBtn, isPlaying && styles.playBtnActive]}
            onPress={isPlaying ? handleStop : handlePlay}
            activeOpacity={0.8}
          >
            <Ionicons name={isPlaying ? "stop" : "play"} size={28} color="#fff" />
            <Text style={styles.playBtnText}>{isPlaying ? "Stop" : "Start Sleep Session"}</Text>
          </TouchableOpacity>
          <Text style={styles.timerLabel}>
            Timer: {selectedTimer === 0 ? "All night" : `${selectedTimer} min`}
          </Text>
        </View>

        {/* Timer Picker */}
        {showTimerPicker && (
          <View style={styles.timerPicker}>
            <Text style={styles.sectionTitle}>Sleep Timer</Text>
            <View style={styles.timerGrid}>
              {SLEEP_TIMERS.map((t) => (
                <TouchableOpacity
                  key={t.duration}
                  style={[styles.timerChip, selectedTimer === t.duration && styles.timerChipActive]}
                  onPress={() => {
                    setSelectedTimer(t.duration);
                    setShowTimerPicker(false);
                    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
                >
                  <Text style={[styles.timerChipText, selectedTimer === t.duration && styles.timerChipTextActive]}>
                    {t.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Sound Mixer */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sound Mixer</Text>
          <Text style={styles.sectionSubtitle}>Tap to toggle, long-press to adjust volume</Text>
          
          {/* Nature Sounds */}
          <Text style={styles.categoryLabel}>Nature</Text>
          <View style={styles.soundGrid}>
            {layers.filter((l) => l.category === "nature").map((layer) => (
              <TouchableOpacity
                key={layer.id}
                style={[styles.soundChip, layer.isActive && { backgroundColor: layer.color + "20", borderColor: layer.color }]}
                onPress={() => toggleLayer(layer.id)}
                activeOpacity={0.7}
              >
                <Ionicons name={layer.icon as any} size={20} color={layer.isActive ? layer.color : Colors.textSecondary} />
                <Text style={[styles.soundChipText, layer.isActive && { color: layer.color }]}>{layer.name}</Text>
                {layer.isActive && (
                  <View style={styles.volumeIndicator}>
                    <View style={[styles.volumeBar, { width: `${layer.volume * 100}%`, backgroundColor: layer.color }]} />
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>

          {/* Ambient Sounds */}
          <Text style={styles.categoryLabel}>Ambient</Text>
          <View style={styles.soundGrid}>
            {layers.filter((l) => l.category === "ambient").map((layer) => (
              <TouchableOpacity
                key={layer.id}
                style={[styles.soundChip, layer.isActive && { backgroundColor: layer.color + "20", borderColor: layer.color }]}
                onPress={() => toggleLayer(layer.id)}
                activeOpacity={0.7}
              >
                <Ionicons name={layer.icon as any} size={20} color={layer.isActive ? layer.color : Colors.textSecondary} />
                <Text style={[styles.soundChipText, layer.isActive && { color: layer.color }]}>{layer.name}</Text>
                {layer.isActive && (
                  <View style={styles.volumeIndicator}>
                    <View style={[styles.volumeBar, { width: `${layer.volume * 100}%`, backgroundColor: layer.color }]} />
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Language Whispers */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>Language Whispers</Text>
              <Text style={styles.sectionSubtitle}>Gentle phrases while you drift off</Text>
            </View>
            <Switch
              value={whisperEnabled}
              onValueChange={setWhisperEnabled}
              trackColor={{ false: Colors.border, true: Colors.secondary + "50" }}
              thumbColor={whisperEnabled ? Colors.secondary : Colors.textSecondary}
            />
          </View>

          {whisperEnabled && (
            <View style={styles.whisperPacks}>
              {WHISPER_PACKS.map((pack) => (
                <TouchableOpacity
                  key={pack.id}
                  style={[
                    styles.whisperCard,
                    selectedWhisper?.id === pack.id && styles.whisperCardActive,
                  ]}
                  onPress={() => {
                    setSelectedWhisper(pack);
                    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.whisperFlag}>{pack.flag}</Text>
                  <View style={styles.whisperInfo}>
                    <Text style={styles.whisperLang}>{pack.language}</Text>
                    <Text style={styles.whisperTopic}>{pack.topic}</Text>
                  </View>
                  {selectedWhisper?.id === pack.id && (
                    <Ionicons name="checkmark-circle" size={20} color={Colors.secondary} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Active Mix Summary */}
        {activeLayers.length > 0 && (
          <View style={styles.mixSummary}>
            <Text style={styles.mixTitle}>Your Mix</Text>
            <View style={styles.mixTags}>
              {activeLayers.map((l) => (
                <View key={l.id} style={[styles.mixTag, { backgroundColor: l.color + "20", borderColor: l.color + "40" }]}>
                  <Ionicons name={l.icon as any} size={12} color={l.color} />
                  <Text style={[styles.mixTagText, { color: l.color }]}>{l.name}</Text>
                </View>
              ))}
              {whisperEnabled && selectedWhisper && (
                <View style={[styles.mixTag, { backgroundColor: Colors.secondary + "20", borderColor: Colors.secondary + "40" }]}>
                  <Text style={styles.mixTagText}>{selectedWhisper.flag} {selectedWhisper.language}</Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Tips */}
        <View style={styles.tipsCard}>
          <Ionicons name="bulb-outline" size={18} color={Colors.gold} />
          <View style={styles.tipsContent}>
            <Text style={styles.tipsTitle}>Sleep Learning Tips</Text>
            <Text style={styles.tipsText}>
              Research shows passive exposure during sleep can reinforce vocabulary you've already studied.
              For best results, review the phrases before bed, then let the whispers play as you drift off.
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
  headerCenter: { alignItems: "center" },
  headerTitle: { fontSize: FontSize.lg, fontWeight: "700", color: Colors.textPrimary },
  headerSubtitle: { fontSize: 11, color: Colors.textSecondary, marginTop: 2 },
  scrollContent: { paddingHorizontal: Spacing.md },
  // Visual section
  visualSection: { alignItems: "center", paddingVertical: 24 },
  breathCircle: { width: 160, height: 160, borderRadius: 80, backgroundColor: Colors.secondary + "15", borderWidth: 2, borderColor: Colors.secondary + "30", alignItems: "center", justifyContent: "center" },
  breathInner: { alignItems: "center", gap: 8 },
  breathText: { fontSize: FontSize.sm, color: Colors.secondary, fontWeight: "500" },
  breathTextIdle: { fontSize: FontSize.sm, color: Colors.textSecondary },
  timerText: { fontSize: 20, fontWeight: "700", color: Colors.textPrimary, fontVariant: ["tabular-nums"] },
  phraseCard: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 16, paddingHorizontal: 14, paddingVertical: 10, backgroundColor: Colors.surfaceCard, borderRadius: BorderRadius.lg, borderWidth: 1, borderColor: Colors.secondary + "30", maxWidth: "90%" },
  phraseText: { flex: 1, fontSize: FontSize.sm, color: Colors.textSecondary, fontStyle: "italic", lineHeight: 20 },
  // Play section
  playSection: { alignItems: "center", marginBottom: 24 },
  playBtn: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 28, paddingVertical: 14, backgroundColor: Colors.secondary, borderRadius: BorderRadius.full },
  playBtnActive: { backgroundColor: Colors.error },
  playBtnText: { fontSize: FontSize.md, fontWeight: "600", color: "#fff" },
  timerLabel: { fontSize: 12, color: Colors.textSecondary, marginTop: 8 },
  // Timer picker
  timerPicker: { marginBottom: 20, padding: Spacing.md, backgroundColor: Colors.surfaceCard, borderRadius: BorderRadius.lg, borderWidth: 1, borderColor: Colors.border },
  timerGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 10 },
  timerChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: BorderRadius.full, backgroundColor: Colors.primary, borderWidth: 1, borderColor: Colors.border },
  timerChipActive: { backgroundColor: Colors.secondary + "20", borderColor: Colors.secondary },
  timerChipText: { fontSize: FontSize.sm, color: Colors.textSecondary, fontWeight: "500" },
  timerChipTextActive: { color: Colors.secondary },
  // Sections
  section: { marginBottom: 24 },
  sectionHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
  sectionTitle: { fontSize: FontSize.lg, fontWeight: "700", color: Colors.textPrimary },
  sectionSubtitle: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  categoryLabel: { fontSize: FontSize.sm, fontWeight: "600", color: Colors.textSecondary, marginTop: 12, marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.5 },
  // Sound grid
  soundGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  soundChip: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 10, borderRadius: BorderRadius.md, backgroundColor: Colors.surfaceCard, borderWidth: 1, borderColor: Colors.border, minWidth: 100 },
  soundChipText: { fontSize: 13, fontWeight: "500", color: Colors.textSecondary },
  volumeIndicator: { position: "absolute", bottom: 2, left: 12, right: 12, height: 2, backgroundColor: "rgba(255,255,255,0.1)", borderRadius: 1 },
  volumeBar: { height: "100%", borderRadius: 1 },
  // Whisper packs
  whisperPacks: { gap: 8, marginTop: 8 },
  whisperCard: { flexDirection: "row", alignItems: "center", gap: 12, padding: 12, borderRadius: BorderRadius.md, backgroundColor: Colors.surfaceCard, borderWidth: 1, borderColor: Colors.border },
  whisperCardActive: { borderColor: Colors.secondary, backgroundColor: Colors.secondary + "08" },
  whisperFlag: { fontSize: 24 },
  whisperInfo: { flex: 1 },
  whisperLang: { fontSize: FontSize.sm, fontWeight: "600", color: Colors.textPrimary },
  whisperTopic: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  // Mix summary
  mixSummary: { marginBottom: 20, padding: Spacing.md, backgroundColor: Colors.surfaceCard, borderRadius: BorderRadius.lg, borderWidth: 1, borderColor: Colors.border },
  mixTitle: { fontSize: FontSize.sm, fontWeight: "600", color: Colors.textPrimary, marginBottom: 8 },
  mixTags: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  mixTag: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: BorderRadius.full, borderWidth: 1 },
  mixTagText: { fontSize: 11, fontWeight: "500", color: Colors.textSecondary },
  // Tips
  tipsCard: { flexDirection: "row", gap: 10, padding: Spacing.md, backgroundColor: Colors.goldGlow, borderRadius: BorderRadius.lg, borderWidth: 1, borderColor: Colors.goldBorder },
  tipsContent: { flex: 1 },
  tipsTitle: { fontSize: FontSize.sm, fontWeight: "600", color: Colors.gold, marginBottom: 4 },
  tipsText: { fontSize: 12, color: Colors.textSecondary, lineHeight: 18 },
});
